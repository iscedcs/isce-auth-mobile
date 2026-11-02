'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronDown, Search } from 'lucide-react';
import {
	AsYouType,
	parsePhoneNumberFromString,
	getCountryCallingCode,
	type CountryCode,
} from 'libphonenumber-js';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	findCountry,
	flagUrl,
	getAllCountries,
	PRIORITY_COUNTRIES,
	type Country,
} from '@/lib/countries';
import { DEFAULT_COUNTRY, detectCountry } from '@/lib/detect-country';

interface PhoneInputProps {
	/** E.164 value, e.g. "+2348012345678". Empty string when unset. */
	value?: string;
	/** Emits E.164, or "" while the field is empty. */
	onChange: (value: string) => void;
	onBlur?: () => void;
	name?: string;
	disabled?: boolean;
	placeholder?: string;
	/** Wrapper classes — lets each form keep its own look. */
	className?: string;
	/** Classes for the number input itself. */
	inputClassName?: string;
	/** Classes for the country trigger button. */
	triggerClassName?: string;
	autoFocus?: boolean;
}

/**
 * Phone field with a country/dial-code picker.
 *
 * The form value is always E.164 ("+2348012345678") regardless of what the
 * user typed. That matters on two fronts: the auth API validates with
 * `@IsPhoneNumber('NG')`, which accepts any country only when the number
 * arrives in international format, and `check-phone` matches the stored
 * string exactly, so a single canonical format is the only way duplicate
 * detection stays reliable.
 */
export function PhoneInput({
	value = '',
	onChange,
	onBlur,
	name,
	disabled,
	placeholder,
	className,
	inputClassName,
	triggerClassName,
	autoFocus,
}: PhoneInputProps) {
	const countries = React.useMemo(() => getAllCountries(), []);

	const [country, setCountry] = React.useState<CountryCode>(DEFAULT_COUNTRY);
	const [national, setNational] = React.useState('');
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState('');

	// Tracks the E.164 string this component last emitted, so an echo of our
	// own value back through props does not clobber what the user is typing.
	const lastEmitted = React.useRef<string>('');
	const didInitCountry = React.useRef(false);

	// Pre-select the detected country once, and only while the field is
	// empty — never override a country the user picked or one implied by an
	// existing value.
	React.useEffect(() => {
		if (didInitCountry.current) return;
		didInitCountry.current = true;
		if (!value) setCountry(detectCountry());
	}, [value]);

	// Adopt an externally-set value (form reset, draft restore, back nav).
	React.useEffect(() => {
		if (value === lastEmitted.current) return;

		if (!value) {
			setNational('');
			return;
		}

		const parsed = parsePhoneNumberFromString(value);
		if (parsed?.country) {
			setCountry(parsed.country);
			setNational(parsed.nationalNumber);
		} else {
			setNational(value.replace(/^\+/, ''));
		}
	}, [value]);

	function emit(nextCountry: CountryCode, nextNational: string) {
		const digits = nextNational.replace(/\D/g, '');

		if (!digits) {
			lastEmitted.current = '';
			onChange('');
			return;
		}

		const parsed = parsePhoneNumberFromString(digits, nextCountry);
		// `.number` is E.164. Before the number is complete enough to parse,
		// fall back to a hand-built E.164 so validation sees a consistent
		// shape and the error message stays about the number, not the format.
		const next = parsed?.isValid()
			? parsed.number
			: `+${getCountryCallingCode(nextCountry)}${digits}`;

		lastEmitted.current = next;
		onChange(next);
	}

	function handleNumberChange(raw: string) {
		const digits = raw.replace(/\D/g, '');
		setNational(digits);
		emit(country, digits);
	}

	function handleCountrySelect(next: Country) {
		setCountry(next.code);
		setOpen(false);
		setQuery('');
		emit(next.code, national);
	}

	const selected = findCountry(country);

	// Format for display only; state stays as raw digits so editing in the
	// middle of the number does not fight the formatter.
	const formatted = React.useMemo(() => {
		if (!national) return '';
		return new AsYouType(country).input(national);
	}, [national, country]);

	const filtered = React.useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) {
			const priority = PRIORITY_COUNTRIES.map((c) => findCountry(c)).filter(
				Boolean,
			) as Country[];
			const rest = countries.filter((c) => !PRIORITY_COUNTRIES.includes(c.code));
			return [...priority, ...rest];
		}
		const digits = q.replace(/\D/g, '');
		return countries.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.code.toLowerCase().includes(q) ||
				(digits.length > 0 && c.callingCode.startsWith(digits)),
		);
	}, [countries, query]);

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type='button'
						disabled={disabled}
						aria-label={`Country code: ${selected?.name ?? country}`}
						className={cn(
							'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-base transition-colors',
							'hover:bg-foreground/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							'disabled:cursor-not-allowed disabled:opacity-50',
							triggerClassName,
						)}
					>
						{selected && (
							<Image
								src={flagUrl(selected, 40)}
								alt=''
								width={22}
								height={16}
								className='rounded-[2px] object-cover'
								unoptimized
							/>
						)}
						<span className='font-semibold tabular-nums'>
							+{selected?.callingCode ?? getCountryCallingCode(country)}
						</span>
						<ChevronDown className='h-4 w-4 opacity-60' aria-hidden />
					</button>
				</PopoverTrigger>

				<PopoverContent align='start' className='w-[300px] p-0'>
					<div className='flex items-center gap-2 border-b px-3 py-2'>
						<Search className='h-4 w-4 shrink-0 opacity-50' aria-hidden />
						<input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder='Search country or code'
							className='w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground'
							aria-label='Search countries'
						/>
					</div>

					<div className='max-h-64 overflow-y-auto py-1' role='listbox'>
						{filtered.length === 0 && (
							<p className='px-3 py-6 text-center text-sm text-muted-foreground'>
								No country matches “{query}”.
							</p>
						)}

						{filtered.map((c) => (
							<button
								key={c.code}
								type='button'
								role='option'
								aria-selected={c.code === country}
								onClick={() => handleCountrySelect(c)}
								className={cn(
									'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
									'hover:bg-accent/60 focus:bg-accent/60 focus:outline-none',
									c.code === country && 'bg-accent/40 font-medium',
								)}
							>
								<Image
									src={flagUrl(c, 40)}
									alt=''
									width={22}
									height={16}
									className='shrink-0 rounded-[2px] object-cover'
									unoptimized
								/>
								<span className='flex-1 truncate'>{c.name}</span>
								<span className='shrink-0 tabular-nums opacity-60'>
									+{c.callingCode}
								</span>
							</button>
						))}
					</div>
				</PopoverContent>
			</Popover>

			<input
				type='tel'
				inputMode='tel'
				autoComplete='tel-national'
				name={name}
				disabled={disabled}
				autoFocus={autoFocus}
				value={formatted}
				onChange={(e) => handleNumberChange(e.target.value)}
				onBlur={onBlur}
				placeholder={placeholder ?? 'Phone number'}
				className={cn('w-full bg-transparent outline-none', inputClassName)}
			/>
		</div>
	);
}

export default PhoneInput;
