import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * GET /api/account/export-data → GET /user/export-my-data on isce-auth
 * Returns the authenticated user's full data export as JSON.
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

		const res = await fetch(`${AUTH_API}/user/export-my-data`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Export Data Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to export data' },
			{ status: 500 },
		);
	}
}
