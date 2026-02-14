import { NextResponse } from 'next/server';
import { authLogger } from '@/lib/auth-logger';

/**
 * Sets the JWT and refresh token in httpOnly cookies.
 * Called after sign-in/sign-up instead of storing tokens in localStorage.
 */
export async function POST(req: Request) {
	try {
		const { token, refreshToken } = await req.json();

		authLogger.log('SET-TOKEN', `Token storage requested`, {
			hasToken: !!token,
			tokenLength: token ? String(token).length : 0,
			hasRefreshToken: !!refreshToken,
			refreshTokenLength: refreshToken ? String(refreshToken).length : 0,
		});

		if (!token || typeof token !== 'string') {
			authLogger.warn('SET-TOKEN', 'Missing or invalid token', {
				tokenType: typeof token,
				tokenFalsy: !token,
			});
			return NextResponse.json(
				{ error: 'Missing or invalid token' },
				{ status: 400 },
			);
		}

		// Derive maxAge from JWT exp claim
		let maxAge = 60 * 60; // 1 hour default
		let jwtPayload: Record<string, any> | null = null;
		try {
			jwtPayload = JSON.parse(atob(token.split('.')[1]));
			if (jwtPayload?.exp) {
				const nowSec = Math.floor(Date.now() / 1000);
				const remaining = Math.max(jwtPayload.exp - nowSec, 0);
				maxAge = Math.min(remaining, 60 * 60 * 24 * 7); // cap at 7 days

				authLogger.log('SET-TOKEN', `JWT decoded`, {
					userId: jwtPayload.id,
					email:
						jwtPayload.email ?
							authLogger.maskEmail(jwtPayload.email)
						:	'missing',
					userType: jwtPayload.userType || 'unknown',
					issuedAt:
						jwtPayload.iat ?
							new Date(jwtPayload.iat * 1000).toISOString()
						:	'missing',
					expiresAt: new Date(jwtPayload.exp * 1000).toISOString(),
					remainingSec: remaining,
					maxAge,
					payloadKeys: Object.keys(jwtPayload),
				});
			} else {
				authLogger.warn(
					'SET-TOKEN',
					'JWT has no exp claim — using default 1h maxAge',
				);
			}
		} catch (decodeErr) {
			authLogger.warn(
				'SET-TOKEN',
				'JWT decode failed — using default maxAge',
				{
					error:
						decodeErr instanceof Error ?
							decodeErr.message
						:	'unknown',
					tokenPreview: authLogger.maskToken(token),
				},
			);
		}

		const isProduction = process.env.NODE_ENV === 'production';

		const res = NextResponse.json({ success: true });

		res.cookies.set('isce_auth_token', token, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			path: '/',
			maxAge,
		});

		// Store refresh token in httpOnly cookie (7-day lifespan)
		if (refreshToken && typeof refreshToken === 'string') {
			res.cookies.set('isce_refresh_token', refreshToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: 'lax',
				path: '/',
				maxAge: 60 * 60 * 24 * 7, // 7 days
			});
		}

		// Non-httpOnly flag so client JS can check "logged in" without reading the JWT
		res.cookies.set('isce_logged_in', '1', {
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 7, // Use refresh token lifespan for the flag
		});

		authLogger.log(
			'SET-TOKEN',
			`Tokens stored in httpOnly cookies successfully`,
			{
				accessTokenMaxAge: maxAge,
				hasRefreshToken: !!(
					refreshToken && typeof refreshToken === 'string'
				),
			},
		);

		return res;
	} catch (error) {
		authLogger.error(
			'SET-TOKEN',
			`Failed: ${error instanceof Error ? error.message : 'unknown'}`,
		);
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}
