import type { CountryCode } from 'libphonenumber-js';
import { getCountries } from 'libphonenumber-js';

export const DEFAULT_COUNTRY: CountryCode = 'NG';

let supported: Set<string> | null = null;

/** ISO codes libphonenumber actually knows about, so we never select a dud. */
function isSupportedCountry(code: string): code is CountryCode {
	if (!supported) supported = new Set<string>(getCountries());
	return supported.has(code);
}

/**
 * Best-effort guess at the user's country, in priority order:
 *
 *   1. `Intl.DateTimeFormat().resolvedOptions().timeZone` — reflects the
 *      device's actual location setting, so it survives the common case of
 *      someone running an "en-US" browser build while sat in Lagos.
 *   2. `navigator.languages` region subtags.
 *   3. Nigeria.
 *
 * This is the detection `country-flag.tsx` used to do inline with only step 2.
 * It is a convenience for pre-selecting a dial code — never a substitute for
 * validating what the user actually typed.
 */
export function detectCountry(): CountryCode {
	if (typeof window === 'undefined') return DEFAULT_COUNTRY;

	const fromZone = countryFromTimeZone();
	if (fromZone) return fromZone;

	const fromLocale = countryFromLocales();
	if (fromLocale) return fromLocale;

	return DEFAULT_COUNTRY;
}

function countryFromLocales(): CountryCode | null {
	if (typeof navigator === 'undefined') return null;

	const locales =
		navigator.languages && navigator.languages.length > 0
			? navigator.languages
			: [navigator.language];

	for (const locale of locales) {
		if (!locale) continue;
		// "en-NG" -> NG. Skip bare tags like "en", and script subtags
		// like "zh-Hans" which are 4 letters rather than a 2-letter region.
		const region = locale.split('-').find((p) => /^[A-Za-z]{2}$/.test(p) && p === p.toUpperCase());
		if (region && isSupportedCountry(region)) return region;

		// Some browsers report lowercase regions ("en-ng").
		const parts = locale.split('-');
		if (parts.length >= 2) {
			const last = parts[parts.length - 1].toUpperCase();
			if (/^[A-Z]{2}$/.test(last) && isSupportedCountry(last)) return last;
		}
	}

	return null;
}

/**
 * Map an IANA time zone to a country. `Intl.Locale.prototype.getTimeZones`
 * is not available everywhere, so this uses the region lookup where present
 * and falls back to a small table for the zones our users actually hit.
 */
function countryFromTimeZone(): CountryCode | null {
	let timeZone: string | undefined;
	try {
		timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return null;
	}
	if (!timeZone) return null;

	const mapped = TIME_ZONE_COUNTRY[timeZone];
	if (mapped && isSupportedCountry(mapped)) return mapped;

	return null;
}

/**
 * Deliberately small: the zones covering ISCE's actual and near-term markets
 * plus the common diaspora ones. Anything not listed falls through to the
 * locale check, which is the behaviour this replaced.
 */
const TIME_ZONE_COUNTRY: Record<string, string> = {
	'Africa/Lagos': 'NG',
	'Africa/Accra': 'GH',
	'Africa/Nairobi': 'KE',
	'Africa/Kampala': 'UG',
	'Africa/Dar_es_Salaam': 'TZ',
	'Africa/Johannesburg': 'ZA',
	'Africa/Cairo': 'EG',
	'Africa/Kigali': 'RW',
	'Africa/Abidjan': 'CI',
	'Africa/Dakar': 'SN',
	'Africa/Douala': 'CM',
	'Europe/London': 'GB',
	'Europe/Dublin': 'IE',
	'Europe/Paris': 'FR',
	'Europe/Berlin': 'DE',
	'Europe/Madrid': 'ES',
	'Europe/Rome': 'IT',
	'Europe/Amsterdam': 'NL',
	'America/New_York': 'US',
	'America/Chicago': 'US',
	'America/Denver': 'US',
	'America/Los_Angeles': 'US',
	'America/Toronto': 'CA',
	'America/Vancouver': 'CA',
	'Asia/Dubai': 'AE',
	'Asia/Riyadh': 'SA',
	'Asia/Kolkata': 'IN',
	'Australia/Sydney': 'AU',
	'Australia/Melbourne': 'AU',
};
