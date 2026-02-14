import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
	const cookieStore = await cookies();

	// Clear legacy auth cookies
	cookieStore.set('accessToken', '', { maxAge: 0 });
	cookieStore.set('refreshToken', '', { maxAge: 0 });

	// Clear new httpOnly auth cookie, refresh token, and logged-in flag
	cookieStore.set('isce_auth_token', '', { maxAge: 0, path: '/' });
	cookieStore.set('isce_refresh_token', '', { maxAge: 0, path: '/' });
	cookieStore.set('isce_logged_in', '', { maxAge: 0, path: '/' });

	return NextResponse.json({ success: true });
}
