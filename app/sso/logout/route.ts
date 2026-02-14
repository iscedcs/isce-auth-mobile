import { NextResponse } from 'next/server';

// Get allowed origins from environment variable
function getAllowedOrigins(): string[] {
	const origins = process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS || '';
	return origins
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

// Check if origin is allowed
function isOriginAllowed(origin: string | null): boolean {
	if (!origin) return false;
	const allowed = getAllowedOrigins();
	return allowed.includes(origin);
}

// Create CORS headers
function getCorsHeaders(origin: string | null) {
	const headers: Record<string, string> = {};

	if (origin && isOriginAllowed(origin)) {
		headers['Access-Control-Allow-Origin'] = origin;
		headers['Access-Control-Allow-Credentials'] = 'true';
		headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
		headers['Access-Control-Allow-Headers'] =
			'Content-Type, Authorization, X-Requested-With';
		headers['Access-Control-Max-Age'] = '86400'; // 24 hours
	}

	return headers;
}

// Handle OPTIONS preflight request
export async function OPTIONS(req: Request) {
	const origin = req.headers.get('origin');
	const headers = getCorsHeaders(origin);

	return new NextResponse(null, {
		status: 204,
		headers,
	});
}

export async function GET(req: Request) {
	const origin = req.headers.get('origin');
	const url = new URL(req.url);
	const redirectParam =
		url.searchParams.get('redirect') ||
		url.searchParams.get('callbackUrl') ||
		url.searchParams.get('redirect_uri') ||
		'/';

	// Build callback
	const authBase = process.env.NEXT_PUBLIC_URL!;
	const callbackUrl = `${authBase}/sign-in?prompt=login&redirect=${encodeURIComponent(
		redirectParam,
	)}`;

	const res = NextResponse.redirect(callbackUrl);

	// Add CORS headers
	const corsHeaders = getCorsHeaders(origin);
	Object.entries(corsHeaders).forEach(([key, value]) => {
		res.headers.set(key, value);
	});

	// ❗Delete ALL NextAuth cookies
	res.cookies.set('next-auth.session-token', '', {
		path: '/',
		maxAge: 0,
	});

	res.cookies.set('__Secure-next-auth.session-token', '', {
		path: '/',
		maxAge: 0,
		secure: true,
		httpOnly: true,
	});

	res.cookies.set('next-auth.callback-url', '', {
		path: '/',
		maxAge: 0,
	});

	// Any optional custom cookies
	res.cookies.set('accessToken', '', {
		path: '/',
		maxAge: 0,
	});

	res.cookies.set('refreshToken', '', {
		path: '/',
		maxAge: 0,
	});

	res.cookies.set('isce_auth_token', '', {
		path: '/',
		maxAge: 0,
	});

	return res;
}
