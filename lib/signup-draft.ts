/**
 * Signup draft persistence (ENG-423).
 *
 * A hard refresh mid-signup used to drop every entered value and send the
 * user back to step 1. This keeps a short-lived draft so a refresh, an
 * accidental back-navigation or a brief interruption doesn't cost the whole
 * form.
 *
 * Three deliberate constraints:
 *
 * 1. `sessionStorage`, never `localStorage` — a partial signup should not
 *    outlive the browser session.
 * 2. A 30-minute TTL on top of that, so a tab left open for a day does not
 *    restore stale personal data.
 * 3. Credentials are never written. See `SENSITIVE_KEYS`.
 */

const VERSION = 1;
const TTL_MS = 30 * 60 * 1000; // 30 minutes

export const DRAFT_KEYS = {
	desktop: 'signup_draft_desktop',
	mobileIndividual: 'signup_draft_mobile_individual',
	mobileBusiness: 'signup_draft_mobile_business',
} as const;

/**
 * Keys stripped from the draft at any depth before it is written.
 *
 * - `password` / `confirmPassword` / `passwordObj` / `passwordCreation`:
 *   a plaintext password in web storage is readable by any XSS on the
 *   origin. Never persisted; the user retypes it.
 * - `code` / `otp` / `otpVerification`: one-time codes, pointless and
 *   unwise to keep.
 * - `idNumber`: NIN/BVN/CAC/TIN. ENG-410 is moving these out of signup
 *   entirely, at which point this entry becomes a no-op — it protects the
 *   interim at no cost to the end state.
 */
const SENSITIVE_KEYS = new Set([
	'password',
	'confirmPassword',
	'passwordObj',
	'passwordCreation',
	'code',
	'otp',
	'otpVerification',
	'idNumber',
]);

interface DraftEnvelope<T> {
	version: number;
	savedAt: number;
	step: number;
	values: T;
}

export interface LoadedDraft<T> {
	values: T;
	step: number;
	savedAt: number;
}

/** Deep copy with sensitive keys removed. Arrays and plain objects only. */
function sanitize(input: unknown): unknown {
	if (Array.isArray(input)) return input.map(sanitize);

	if (input instanceof Date) return input.toISOString();

	if (input && typeof input === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
			if (SENSITIVE_KEYS.has(key)) continue;
			out[key] = sanitize(value);
		}
		return out;
	}

	return input;
}

export function saveDraft<T>(key: string, values: T, step: number): void {
	if (typeof window === 'undefined') return;
	try {
		const envelope: DraftEnvelope<unknown> = {
			version: VERSION,
			savedAt: Date.now(),
			step,
			values: sanitize(values),
		};
		sessionStorage.setItem(key, JSON.stringify(envelope));
	} catch {
		// Storage blocked or full — losing the draft is acceptable, breaking
		// the signup is not.
	}
}

/**
 * Read a draft back, or null when there is none, it has expired, or it was
 * written by an older shape of this module.
 *
 * `reviveDateKeys` names fields that were `Date` objects before JSON turned
 * them into strings — zod's `z.date()` rejects the string form, so those
 * have to be rehydrated or the restored form fails validation on a field
 * the user cannot see.
 */
export function loadDraft<T>(
	key: string,
	reviveDateKeys: string[] = [],
): LoadedDraft<T> | null {
	if (typeof window === 'undefined') return null;

	try {
		const raw = sessionStorage.getItem(key);
		if (!raw) return null;

		const parsed = JSON.parse(raw) as DraftEnvelope<T>;

		if (parsed?.version !== VERSION) {
			sessionStorage.removeItem(key);
			return null;
		}

		if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
			sessionStorage.removeItem(key);
			return null;
		}

		return {
			values: reviveDates(parsed.values, reviveDateKeys) as T,
			step: parsed.step,
			savedAt: parsed.savedAt,
		};
	} catch {
		// Corrupt entry — drop it rather than trapping the user in a
		// half-restored form on every load.
		try {
			sessionStorage.removeItem(key);
		} catch {
			// no-op
		}
		return null;
	}
}

function reviveDates(input: unknown, dateKeys: string[]): unknown {
	if (dateKeys.length === 0) return input;
	if (Array.isArray(input)) return input.map((v) => reviveDates(v, dateKeys));

	if (input && typeof input === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
			if (dateKeys.includes(key) && typeof value === 'string') {
				const d = new Date(value);
				out[key] = Number.isNaN(d.getTime()) ? value : d;
			} else {
				out[key] = reviveDates(value, dateKeys);
			}
		}
		return out;
	}

	return input;
}

export function clearDraft(key: string): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.removeItem(key);
	} catch {
		// no-op
	}
}

/** Clears every signup draft — used once an account is successfully created. */
export function clearAllSignupDrafts(): void {
	Object.values(DRAFT_KEYS).forEach(clearDraft);
}

/** True when the draft holds anything worth restoring. */
export function hasContent(values: unknown): boolean {
	if (!values || typeof values !== 'object') return false;
	return Object.values(values as Record<string, unknown>).some((v) => {
		if (v == null || v === '') return false;
		if (typeof v === 'object') return hasContent(v);
		return true;
	});
}
