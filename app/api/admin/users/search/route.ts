import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * Proxy GET /api/admin/users/search → GET /user/users/search on isce-auth
 * Forwards query params: email, fullname, userType, limit, offset
 */
export async function GET(req: NextRequest) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('isce_auth_token')?.value;

		if (!token) {
			return NextResponse.json(
				{ error: 'Not authenticated' },
				{ status: 401 },
			);
		}

		const { searchParams } = new URL(req.url);
		const queryString = searchParams.toString();
		const url = `${AUTH_API}/user/users/search${queryString ? `?${queryString}` : ''}`;

		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Users Search Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to search users' },
			{ status: 500 },
		);
	}
}
