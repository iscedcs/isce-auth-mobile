'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * Derives a country code from the browser's locale (e.g. "en-NG" → "ng").
 * Falls back to "ng" (Nigeria) when no region subtag is present.
 */
function getCountryFromLocale(): string {
	if (typeof navigator === 'undefined') return 'ng';

	const locale = navigator.language; // e.g. "en-NG", "en-US", "fr-FR"
	const parts = locale.split('-');

	// The region subtag is the second part (ISO 3166-1 alpha-2)
	if (parts.length >= 2) {
		return parts[parts.length - 1].toLowerCase();
	}

	return 'ng'; // default to Nigeria
}

export default function CountryFlag() {
	const [countryCode, setCountryCode] = useState<string | null>(null);

	useEffect(() => {
		setCountryCode(getCountryFromLocale());
	}, []);

	if (!countryCode) return null;

	return (
		<Image
			src={`https://flagcdn.com/w20/${countryCode}.png`}
			alt='Country Flag'
			width={20}
			height={20}
			className='rounded-full'
		/>
	);
}
