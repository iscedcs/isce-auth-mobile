import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * Proxy POST /api/admin/devices/assign → POST /device/admin/assign on isce-auth
 */
export async function POST(req: NextRequest) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('isce_auth_token')?.value;

		if (!token) {
			return NextResponse.json(
				{ error: 'Not authenticated' },
				{ status: 401 },
			);
		}

		const body = await req.json();
		const url = `${AUTH_API}/device/admin/assign`;

		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Device Assign Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to assign device' },
			{ status: 500 },
		);
	}
}
