import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const WALLET_API = process.env.WALLET_API_URL;

/**
 * Proxy PATCH /api/admin/wallet/pos-agents/:id/reject → PATCH /api/admin/pos-agents/:id/reject on wallet-nest
 */
export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('isce_auth_token')?.value;

		if (!token) {
			return NextResponse.json(
				{ error: 'Not authenticated' },
				{ status: 401 },
			);
		}

		const { id } = await params;
		const body = await req.json();
		const url = `${WALLET_API}/api/admin/pos-agents/${id}/reject`;

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
		console.error('[Admin Wallet PosAgent Reject Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to reject POS agent application' },
			{ status: 500 },
		);
	}
}
