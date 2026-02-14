import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authLogger } from '@/lib/auth-logger';

/**
 * Returns the decoded JWT payload from the httpOnly cookie.
 * Client components call this instead of reading localStorage.
 * Auto-refreshes expired access tokens using the refresh token.
 */
export async function GET() {
	try {
		const cookieStore = await cookies();
		let token = cookieStore.get('isce_auth_token')?.value;
		const refreshTokenValue = cookieStore.get('isce_refresh_token')?.value;

		authLogger.log('SESSION', `Session check requested`, {
			hasAccessToken: !!token,
			accessTokenLength: token ? token.length : 0,
			hasRefreshToken: !!refreshTokenValue,
		});

		if (!token && !refreshTokenValue) {
			authLogger.log(
				'SESSION',
				`No tokens found — returning unauthenticated`,
			);
			return NextResponse.json({ authenticated: false }, { status: 401 });
		}

		// Check if access token exists and is still valid
		let payload: any = null;
		let needsRefresh = !token;
		if (token) {
			try {
				payload = JSON.parse(atob(token.split('.')[1]));
				const nowSec = Math.floor(Date.now() / 1000);
				if (payload.exp && payload.exp <= nowSec) {
					needsRefresh = true;
					authLogger.log('SESSION', `Access token expired`, {
						userId: payload.id,
						expiredAt: new Date(payload.exp * 1000).toISOString(),
						expiredAgoSec: nowSec - payload.exp,
					});
				} else {
					authLogger.log('SESSION', `Access token valid`, {
						userId: payload.id,
						email:
							payload.email ?
								authLogger.maskEmail(payload.email)
							:	'missing',
						expiresAt:
							payload.exp ?
								new Date(payload.exp * 1000).toISOString()
							:	'no-exp',
						remainingSec:
							payload.exp ? payload.exp - nowSec : 'unknown',
					});
				}
			} catch {
				needsRefresh = true;
				authLogger.warn(
					'SESSION',
					`Access token decode failed — marking for refresh`,
				);
			}
		} else {
			authLogger.log('SESSION', `No access token — will attempt refresh`);
		}

		// Auto-refresh if access token is expired/missing but refresh token exists
		if (needsRefresh && refreshTokenValue) {
			const authApiBase =
				process.env.AUTH_API_URL ||
				process.env.NEXT_PUBLIC_AUTH_API_URL;

			authLogger.log('SESSION', `Attempting token refresh`, {
				authApiBase: authApiBase || 'NOT_SET',
				refreshTokenPreview: authLogger.maskToken(refreshTokenValue),
			});

			const elapsed = authLogger.startTimer();
			const refreshRes = await fetch(`${authApiBase}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken: refreshTokenValue }),
			});

			authLogger.log('SESSION', `Refresh response received`, {
				status: refreshRes.status,
				ok: refreshRes.ok,
				elapsedMs: elapsed(),
			});

			if (refreshRes.ok) {
				const data = await refreshRes.json();
				token = data.accessToken;
				payload = JSON.parse(atob(token!.split('.')[1]));

				authLogger.log('SESSION', `Token refresh successful`, {
					userId: payload.id,
					email:
						payload.email ?
							authLogger.maskEmail(payload.email)
						:	'missing',
					newExpiresAt:
						payload.exp ?
							new Date(payload.exp * 1000).toISOString()
						:	'no-exp',
					hasNewRefreshToken: !!data.refreshToken,
				});

				const isProduction = process.env.NODE_ENV === 'production';
				const nowSec = Math.floor(Date.now() / 1000);
				const accessMaxAge = Math.max(
					(payload.exp || nowSec + 3600) - nowSec,
					0,
				);

				const res = NextResponse.json({
					authenticated: true,
					user: {
						id: payload.id,
						email: payload.email,
						firstName: payload.firstName,
						lastName: payload.lastName,
						displayPicture: payload.displayPicture,
						userType: payload.userType,
						phone: payload.phone,
					},
				});

				// Update cookies with new tokens
				res.cookies.set('isce_auth_token', token!, {
					httpOnly: true,
					secure: isProduction,
					sameSite: 'lax',
					path: '/',
					maxAge: accessMaxAge,
				});
				res.cookies.set('isce_refresh_token', data.refreshToken, {
					httpOnly: true,
					secure: isProduction,
					sameSite: 'lax',
					path: '/',
					maxAge: 60 * 60 * 24 * 7,
				});
				res.cookies.set('isce_logged_in', '1', {
					httpOnly: false,
					secure: isProduction,
					sameSite: 'lax',
					path: '/',
					maxAge: 60 * 60 * 24 * 7,
				});

				authLogger.log(
					'SESSION',
					`Refreshed cookies set — returning authenticated`,
				);
				return res;
			}

			authLogger.warn(
				'SESSION',
				`Token refresh failed — clearing all cookies`,
				{
					status: refreshRes.status,
					statusText: refreshRes.statusText,
				},
			);

			// Refresh failed — clear all cookies
			const res = NextResponse.json(
				{ authenticated: false, reason: 'refresh_failed' },
				{ status: 401 },
			);
			res.cookies.set('isce_auth_token', '', { maxAge: 0, path: '/' });
			res.cookies.set('isce_refresh_token', '', { maxAge: 0, path: '/' });
			res.cookies.set('isce_logged_in', '', { maxAge: 0, path: '/' });
			return res;
		}

		if (needsRefresh) {
			// No refresh token available — clear cookies
			authLogger.warn(
				'SESSION',
				`Token expired and no refresh token — clearing cookies`,
			);
			const res = NextResponse.json(
				{ authenticated: false, reason: 'expired' },
				{ status: 401 },
			);
			res.cookies.set('isce_auth_token', '', { maxAge: 0, path: '/' });
			res.cookies.set('isce_logged_in', '', { maxAge: 0, path: '/' });
			return res;
		}

		authLogger.log('SESSION', `Returning authenticated session`, {
			userId: payload.id,
			email:
				payload.email ? authLogger.maskEmail(payload.email) : 'missing',
			userType: payload.userType || 'unknown',
		});

		return NextResponse.json({
			authenticated: true,
			user: {
				id: payload.id,
				email: payload.email,
				firstName: payload.firstName,
				lastName: payload.lastName,
				displayPicture: payload.displayPicture,
				userType: payload.userType,
				phone: payload.phone,
			},
		});
	} catch (err) {
		authLogger.error('SESSION', `Unexpected error in session check`, {
			error: err instanceof Error ? err.message : 'unknown',
		});
		return NextResponse.json({ authenticated: false }, { status: 401 });
	}
}
