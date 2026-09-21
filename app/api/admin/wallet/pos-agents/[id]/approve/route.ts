import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const WALLET_API = process.env.WALLET_API_URL;

/**
 * Proxy PATCH /api/admin/wallet/pos-agents/:id/approve → PATCH /api/admin/pos-agents/:id/approve on wallet-nest
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
		const url = `${WALLET_API}/api/admin/pos-agents/${id}/approve`;

		const res = await fetch(url, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Wallet PosAgent Approve Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to approve POS agent application' },
			{ status: 500 },
		);
	}
}
