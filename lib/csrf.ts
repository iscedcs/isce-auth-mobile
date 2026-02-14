import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/** Paths exempt from CSRF validation */
const EXEMPT_PATHS = [
	'/api/auth/set-token', // Called from same-origin redirects
];

/**
 * Sets or refreshes the CSRF token cookie on the response.
 */
export function setCsrfCookie(
	response: NextResponse,
	existingToken?: string,
): string {
	const token = existingToken || crypto.randomBytes(32).toString('hex');
	const isProduction = process.env.NODE_ENV === 'production';

	response.cookies.set(CSRF_COOKIE_NAME, token, {
		httpOnly: false, // Must be readable by client-side JS
		secure: isProduction,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24, // 24 hours
	});

	return token;
}

/**
 * Validates the CSRF token for state-changing requests to /api/* routes.
 * Returns null if valid, or a NextResponse with 403 if invalid.
 */
export function validateCsrf(req: NextRequest): NextResponse | null {
	// Skip safe methods
	if (SAFE_METHODS.includes(req.method)) {
		return null;
	}

	// Skip non-API routes
	if (!req.nextUrl.pathname.startsWith('/api/')) {
		return null;
	}

	// Skip exempt paths
	if (EXEMPT_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))) {
		return null;
	}

	const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
	const headerToken = req.headers.get(CSRF_HEADER_NAME);

	if (!cookieToken || !headerToken || cookieToken !== headerToken) {
		return NextResponse.json(
			{ error: 'CSRF token validation failed' },
			{ status: 403 },
		);
	}

	return null;
}
