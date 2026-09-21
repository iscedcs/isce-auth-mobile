import type { CountryCode } from 'libphonenumber-js';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

export interface Country {
	/** ISO 3166-1 alpha-2, e.g. "NG" */
	code: CountryCode;
	/** Localised display name, e.g. "Nigeria" */
	name: string;
	/** Dial code without the plus, e.g. "234" */
	callingCode: string;
	/** Lowercased code for flagcdn image URLs */
	flag: string;
}

/**
 * The full country list, derived from libphonenumber's own metadata so the
 * dropdown can never offer a country whose numbers we then fail to validate.
 *
 * Names come from `Intl.DisplayNames` where available, falling back to the
 * raw ISO code rather than shipping a hand-maintained name table that would
 * drift.
 */
function buildCountries(): Country[] {
	let displayNames: Intl.DisplayNames | null = null;
	try {
		displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
	} catch {
		displayNames = null;
	}

	return getCountries()
		.map((code) => ({
			code,
			name: displayNames?.of(code) ?? code,
			callingCode: getCountryCallingCode(code),
			flag: code.toLowerCase(),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

let cached: Country[] | null = null;

export function getAllCountries(): Country[] {
	if (!cached) cached = buildCountries();
	return cached;
}

export function findCountry(code: CountryCode): Country | undefined {
	return getAllCountries().find((c) => c.code === code);
}

/** Flag image URL — flagcdn is already allow-listed in next.config CSP. */
export function flagUrl(country: Country | string, width: 20 | 40 | 80 = 40): string {
	const iso = typeof country === 'string' ? country.toLowerCase() : country.flag;
	return `https://flagcdn.com/w${width}/${iso}.png`;
}

/**
 * Countries surfaced above the divider in the picker. ISCE's user base is
 * overwhelmingly Nigerian, and forcing those users to scroll past 200
 * entries to reach their own country would be a regression on the
 * Nigeria-only field this replaces.
 */
export const PRIORITY_COUNTRIES: CountryCode[] = ['NG', 'GH', 'KE', 'ZA', 'GB', 'US'];
