import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authLogger } from '@/lib/auth-logger';
import { isAllowedAppOrigin } from '@/lib/safe-redirect';

/**
 * The page the product's callback should send the user to next, kept on
 * the product's own site. Anything that resolves to another origin —
 * "//evil.com", "/\evil.com", an absolute URL elsewhere — becomes "/".
 */
function sameSitePath(requested: string, target: URL): string {
	try {
		const resolved = new URL(requested, target.origin);
		if (resolved.origin === target.origin) {
			return resolved.pathname + resolved.search + resolved.hash;
		}
	} catch {}
	return '/';
}

/**
 * Server-side redirect to a product's auth callback.
 * Phase 3: Instead of passing the raw JWT in the URL, we call
 * the isce-auth backend to generate a short-lived authorization
 * code and pass that instead. The product exchanges the code for
 * tokens server-to-server, so the JWT never appears in URLs.
 *
 * The code is only ever sent to an allowlisted ISCE app (see
 * getAllowedAppOrigins in lib/safe-redirect.ts). Without that check,
 * ?url=https://attacker.example would receive a live code for the
 * signed-in user (ENG-373).
 *
 * Usage: GET /api/auth/launch?url=https://gada.isce.tech&redirect=/
 */
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const productUrl = searchParams.get('url');

		authLogger.log('SSO:LAUNCH', `Launch requested`, {
			productUrl: productUrl || 'missing',
		});

		if (!productUrl) {
			authLogger.warn('SSO:LAUNCH', 'Missing url parameter');
			return NextResponse.json(
				{ error: 'Missing url parameter' },
				{ status: 400 },
			);
		}

		let target: URL;
		try {
			target = new URL(productUrl);
		} catch {
			authLogger.warn('SSO:LAUNCH', 'Invalid url parameter');
			return NextResponse.json(
				{ error: 'Invalid url parameter' },
				{ status: 400 },
			);
		}

		if (!isAllowedAppOrigin(target)) {
			authLogger.warn('SSO:LAUNCH', 'Rejected launch to an unrecognised app', {
				origin: target.origin,
			});
			return NextResponse.json(
				{ error: 'Unrecognised application' },
				{ status: 400 },
			);
		}

		// Extract the redirect destination from the productUrl.
		// Products pass either:
		//   (a) a full page URL like "http://localhost:3323/user/me"  → use pathname
		//   (b) a callback URL with a redirect param like "…?redirect=/dashboard" → use that
		const redirect = sameSitePath(
			target.searchParams.get('redirect') ||
				(target.pathname !== '/' ?
					target.pathname + target.search
				:	'/'),
			target,
		);

		authLogger.log('SSO:LAUNCH', `Extracted redirect: ${redirect}`);

		const cookieStore = await cookies();
		const token = cookieStore.get('isce_auth_token')?.value;

		if (!token) {
			authLogger.warn(
				'SSO:LAUNCH',
				'No auth token in cookies — redirecting to sign-in',
			);
			const authBase = process.env.NEXT_PUBLIC_URL!;
			return NextResponse.redirect(`${authBase}/sign-in?prompt=login`);
		}

		authLogger.log(
			'SSO:LAUNCH',
			`Auth token found (${authLogger.maskToken(token)}), requesting auth code`,
		);

		// Request a short-lived authorization code from isce-auth
		const authApiBase =
			process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

		authLogger.log(
			'SSO:LAUNCH',
			`Calling POST ${authApiBase}/auth/authorize`,
			{ authApiBase: authApiBase || 'NOT_SET' },
		);

		const elapsed = authLogger.startTimer();
		const codeRes = await fetch(`${authApiBase}/auth/authorize`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		if (!codeRes.ok) {
			let errorBody: string | undefined;
			try {
				errorBody = await codeRes.text();
			} catch {}
			authLogger.error('SSO:LAUNCH', `Auth code request failed`, {
				status: codeRes.status,
				statusText: codeRes.statusText,
				elapsedMs: elapsed(),
				body: errorBody?.slice(0, 300),
			});
			const authBase = process.env.NEXT_PUBLIC_URL!;
			return NextResponse.redirect(`${authBase}/sign-in?prompt=login`);
		}

		const { code } = await codeRes.json();
		authLogger.log('SSO:LAUNCH', `Auth code received`, {
			codeLength: code ? String(code).length : 0,
			elapsedMs: elapsed(),
		});

		// Build the callback URL with the code (not the JWT)
		const callback = new URL('/auth/callback', target.origin);
		callback.searchParams.set('code', code);
		callback.searchParams.set('redirect', redirect);

		const callbackStr = callback.toString();
		authLogger.log('SSO:LAUNCH', `Redirecting to product callback`, {
			callbackOrigin: callback.origin,
			callbackPath: callback.pathname,
			redirect,
			fullUrl: callbackStr.replace(/code=[^&]+/, 'code=***'),
		});

		return NextResponse.redirect(callbackStr);
	} catch (error) {
		authLogger.error(
			'SSO:LAUNCH',
			`Unexpected error: ${error instanceof Error ? error.message : 'unknown'}`,
		);
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}
