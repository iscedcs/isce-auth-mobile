import { NextRequest, NextResponse } from 'next/server';
import { setCsrfCookie, validateCsrf } from './lib/csrf';

export async function proxy(req: NextRequest) {
	// -- CSRF validation for state-changing API requests --
	const csrfError = validateCsrf(req);
	if (csrfError) return csrfError;

	// Set CSRF cookie on all responses
	const response = NextResponse.next();
	setCsrfCookie(response, req.cookies.get('csrf_token')?.value);
	return response;
}

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:css|js|png|jpg|jpeg|svg|ico|webp|woff2?|ttf)).*)',
	],
};
