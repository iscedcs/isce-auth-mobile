/**
 * Which OAuth client an app launches as. When an app's origin has an entry,
 * the auth code we request is bound to that client, so only the app holding
 * the client secret can redeem it.
 *
 * SSO_CLIENT_IDS is server-side only (never NEXT_PUBLIC_*), a comma-separated
 * list of `origin=clientId`, for example:
 *   https://test-wallet.isce.app=wallet-web,https://test-connect.isce.app=connect-web
 *
 * An origin with no entry keeps the old, unbound behaviour. Add an app here
 * only once its callback already sends its client credentials to /auth/token,
 * otherwise redeeming its bound code fails with a 401.
 */
export function getLaunchClientMap(
	raw: string | undefined = process.env.SSO_CLIENT_IDS,
): Map<string, string> {
	const map = new Map<string, string>();
	for (const pair of (raw ?? '').split(',')) {
		const index = pair.lastIndexOf('=');
		if (index <= 0) continue;
		const origin = pair.slice(0, index).trim();
		const clientId = pair.slice(index + 1).trim();
		if (!origin || !clientId) continue;
		try {
			map.set(new URL(origin).origin, clientId);
		} catch {
			// ignore malformed origin entries
		}
	}
	return map;
}

export function getLaunchClientId(
	origin: string,
	raw?: string,
): string | undefined {
	return getLaunchClientMap(raw).get(origin);
}
