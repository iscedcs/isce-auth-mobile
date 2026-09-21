import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const WALLET_API = process.env.WALLET_API_URL;

/**
 * Proxy GET /api/admin/wallet/pos-terminals → GET /api/admin/pos-terminals on wallet-nest
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
		const url = `${WALLET_API}/api/admin/pos-terminals${queryString ? `?${queryString}` : ''}`;

		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[Admin Wallet PosTerminals Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to fetch POS terminals' },
			{ status: 500 },
		);
	}
}

/**
 * Proxy POST /api/admin/wallet/pos-terminals → POST /api/admin/pos-terminals on wallet-nest
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
		const url = `${WALLET_API}/api/admin/pos-terminals`;

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
		console.error('[Admin Wallet PosTerminal Create Proxy]', err);
		return NextResponse.json(
			{ error: 'Failed to create POS terminal' },
			{ status: 500 },
		);
	}
}
