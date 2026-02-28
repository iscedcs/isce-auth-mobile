import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * Proxy GET /api/admin/users/active → GET /user/users/active on isce-auth
 */
export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('isce_auth_token')?.value;

		if (!token) {
			return NextResponse.json(
				{ error: 'Not authenticated' },
				{ status: 401 },
			);
		}

		const res = await fetch(`${AUTH_API}/user/users/active`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Users Active Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to fetch active count' },
			{ status: 500 },
		);
	}
}
