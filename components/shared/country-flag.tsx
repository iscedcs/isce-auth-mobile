'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { detectCountry } from '@/lib/detect-country';
import { flagUrl } from '@/lib/countries';

/**
 * Decorative flag shown next to the logo on the splash and auth screens.
 *
 * Detection lives in `lib/detect-country.ts` so this and the phone field's
 * country picker always agree on where the user is.
 */
export default function CountryFlag() {
	const [countryCode, setCountryCode] = useState<string | null>(null);

	useEffect(() => {
		setCountryCode(detectCountry());
	}, []);

	if (!countryCode) return null;

	return (
		<Image
			src={flagUrl(countryCode, 20)}
			alt='Country Flag'
			width={20}
			height={20}
			className='rounded-full'
			unoptimized
		/>
	);
}
