import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const WALLET_API = process.env.WALLET_API_URL;

/**
 * Proxy GET /api/admin/wallet/pos-agents → GET /api/admin/pos-agents on wallet-nest
 * Forwards query params: status
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
		const url = `${WALLET_API}/api/admin/pos-agents${queryString ? `?${queryString}` : ''}`;

		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Wallet PosAgents Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to fetch POS agent applications' },
			{ status: 500 },
		);
	}
}
