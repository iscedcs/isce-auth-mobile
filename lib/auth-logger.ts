/**
 * Auth flow debug logger.
 * Logs auth events with structured tags for easy tracing.
 * Never logs tokens, passwords, or full PII — only masked identifiers.
 */

const PREFIX = '[AUTH:isce-auth-web]';

function timestamp(): string {
	return new Date().toISOString();
}

/** Generate a short random flow ID to trace a single sign-in across components */
function flowId(): string {
	return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Start a timer — returns a function that returns elapsed ms when called */
function startTimer(): () => number {
	const start = Date.now();
	return () => Date.now() - start;
}

/** Mask email for safe logging: "j***@example.com" */
function maskEmail(email: string): string {
	if (!email) return '***';
	const [local, domain] = email.split('@');
	if (!domain) return '***';
	return `${local[0]}***@${domain}`;
}

/** Mask a token: show first 8 and last 4 chars */
function maskToken(token: string | undefined | null): string {
	if (!token) return 'none';
	if (token.length < 16) return `present(${token.length}chars)`;
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

/** Classify an axios/fetch error for logging */
function classifyError(error: any): string {
	if (error?.code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
	if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT')
		return 'TIMEOUT';
	if (error?.code === 'ERR_NETWORK') return 'NETWORK_ERROR';
	if (error?.response?.status) return `HTTP_${error.response.status}`;
	if (error?.message?.includes('Network Error')) return 'NETWORK_ERROR';
	return 'UNKNOWN';
}

export const authLogger = {
	log(tag: string, message: string, meta?: Record<string, unknown>) {
		const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
		console.log(`${PREFIX}[${tag}] ${timestamp()} ${message}${metaStr}`);
	},

	warn(tag: string, message: string, meta?: Record<string, unknown>) {
		const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
		console.warn(`${PREFIX}[${tag}] ${timestamp()} ${message}${metaStr}`);
	},

	error(tag: string, message: string, meta?: Record<string, unknown>) {
		const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
		console.error(`${PREFIX}[${tag}] ${timestamp()} ${message}${metaStr}`);
	},

	flowId,
	startTimer,
	maskEmail,
	maskToken,
	classifyError,
};
