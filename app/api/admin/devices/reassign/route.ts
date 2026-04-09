import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * Proxy PATCH /api/admin/devices/reassign → PATCH /device/admin/reassign on isce-auth
 */
export async function PATCH(req: NextRequest) {
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
		const url = `${AUTH_API}/device/admin/reassign`;

		const res = await fetch(url, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Device Reassign Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to reassign device' },
			{ status: 500 },
		);
	}
}
