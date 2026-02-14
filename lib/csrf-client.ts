/**
 * Reads the CSRF token from the csrf_token cookie.
 */
export function getCsrfToken(): string | undefined {
	if (typeof document === 'undefined') return undefined;
	const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
	return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * A fetch wrapper that automatically includes the CSRF token header
 * on state-changing requests (POST, PUT, PATCH, DELETE).
 */
export async function csrfFetch(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	const method = (init?.method || 'GET').toUpperCase();
	const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

	if (!safeMethods.includes(method)) {
		const csrfToken = getCsrfToken();
		if (csrfToken) {
			const headers = new Headers(init?.headers);
			headers.set('X-CSRF-Token', csrfToken);
			init = { ...init, headers };
		}
	}

	return fetch(input, init);
}
