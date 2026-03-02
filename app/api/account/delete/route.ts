import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * PATCH /api/account/delete → PATCH /user/delete-my-account on isce-auth
 * Soft-deletes the authenticated user's account.
 */
export async function PATCH() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('isce_auth_token')?.value;

		if (!token) {
			return NextResponse.json(
				{ error: 'Not authenticated' },
				{ status: 401 },
			);
		}

		const res = await fetch(`${AUTH_API}/user/delete-my-account`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Delete Account Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to delete account' },
			{ status: 500 },
		);
	}
}
