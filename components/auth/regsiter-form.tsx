'use client';

import { AuthService } from '@/lib/auth-service';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getSafeRedirect } from '@/lib/safe-redirect';
import Link from 'next/link';
import { BiRename } from 'react-icons/bi';
import { FaPhoneAlt, FaRegEye } from 'react-icons/fa';
import { LuEyeClosed } from 'react-icons/lu';
import { MdEmail, MdOutlinePassword } from 'react-icons/md';

export default function QuickRegisterForm() {
	const router = useRouter();
	const sp = useSearchParams();

	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		password: '',
	});

	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [redirectURL, setRedirectURL] = useState('/sign-in');

	/** ----------------------------------------------------------
   *  STORE REDIRECT DESTINATION (if coming from a product)
   ------------------------------------------------------------*/
	const safeRedirect = getSafeRedirect(
		sp.get('redirect') || sp.get('redirect_uri') || sp.get('callbackUrl'),
	);

	useEffect(() => {
		if (safeRedirect) sessionStorage.setItem('redirect_hint', safeRedirect);
	}, [safeRedirect]);

	const getFinalRedirect = () => {
		return (
			sessionStorage.getItem('redirect_hint') || '/' // fallback after signin
		);
	};

	/** ----------------------------------------------------------
   *  HANDLE INPUT
   ------------------------------------------------------------*/
	const handleChange = (key: string, value: string) => {
		setForm({ ...form, [key]: value });
	};

	/** ----------------------------------------------------------
   *  SUBMIT (Register → Auto Login → SSO Callback)
   ------------------------------------------------------------*/
	const handleSubmit = async () => {
		const { firstName, lastName, email, phone, password } = form;

		if (!firstName || !lastName || !email || !phone || !password) {
			toast.error('All fields are required');
			return;
		}

		setLoading(true);

		try {
			/** 1. REGISTER USER */
			const reg = await AuthService.quickRegister({
				firstName,
				lastName,
				email,
				phone,
				password,
			});

			if (!reg.success) {
				toast.error(reg.message);
				setLoading(false);
				return;
			}

			/** 2. AUTO LOGIN (NO NEXTAUTH) */
			const login = await AuthService.signIn(email, password);

			if (!login?.success && !login.data?.accessToken) {
				toast.error(
					'Account created, but login failed. Please login manually.',
				);
				router.push('/sign-in');
				return;
			}
			const token = login.data?.accessToken;
			const refreshToken = login.data?.refreshToken;

			/** STORE TOKENS IN HTTPONLY COOKIES */
			await fetch('/api/auth/set-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, refreshToken }),
			});

			toast.success(`Welcome, ${firstName} ${lastName}🎉 !`);

			/** 3. DETERMINE REDIRECT DESTINATION */
			const finalRedirect = getSafeRedirect(getFinalRedirect()) || '/';

			/** 4. SERVER-SIDE SSO REDIRECT */
			const launchUrl = `/api/auth/launch?url=${encodeURIComponent(finalRedirect)}`;
			window.location.href = launchUrl;
		} catch (error: any) {
			toast.error(error?.message || 'Something went wrong.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='p-6 max-w-md mx-auto h-[100svh] flex flex-col gap-8'>
			<h1 className='text-3xl font-bold mt-4'>Get In Quick</h1>

			{/* First Name */}
			<div className='relative'>
				<BiRename className='absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white' />
				<input
					type='text'
					placeholder='Enter your preferred firstname'
					className='w-full pl-10 p-3 bg-black placeholder:text-gray-50/15 border-b border-gray-700 outline-none'
					value={form.firstName}
					onChange={(e) => handleChange('firstName', e.target.value)}
				/>
			</div>

			{/* Last Name */}
			<div className='relative'>
				<BiRename className='absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white' />
				<input
					type='text'
					placeholder='Enter your popular lastname'
					className='w-full pl-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none'
					value={form.lastName}
					onChange={(e) => handleChange('lastName', e.target.value)}
				/>
			</div>

			{/* Email */}
			<div className='relative'>
				<MdEmail className='absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white' />
				<input
					type='email'
					placeholder='Email Address'
					className='w-full pl-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none'
					value={form.email}
					onChange={(e) => handleChange('email', e.target.value)}
				/>
			</div>

			{/* Phone */}
			<div className='relative'>
				<FaPhoneAlt className='absolute left-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-white' />
				<input
					type='tel'
					placeholder='Phone Number'
					className='w-full pl-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none'
					value={form.phone}
					onChange={(e) => handleChange('phone', e.target.value)}
				/>
			</div>

			{/* Password */}
			<div className='relative'>
				<MdOutlinePassword className='absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white' />
				<input
					type={showPassword ? 'text' : 'password'}
					placeholder='Password'
					className='w-full pl-10 pr-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none'
					value={form.password}
					onChange={(e) => handleChange('password', e.target.value)}
				/>

				{/* Show / Hide Password */}
				{!showPassword ?
					<FaRegEye
						onClick={() => setShowPassword(true)}
						className='absolute right-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] cursor-pointer'
					/>
				:	<LuEyeClosed
						onClick={() => setShowPassword(false)}
						className='absolute right-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] cursor-pointer'
					/>
				}
			</div>

			{/* Submit */}
			<button
				onClick={handleSubmit}
				disabled={loading}
				className='mt-auto p-4 bg-white text-black rounded-lg font-semibold disabled:opacity-40'
			>
				{loading ? 'Creating account...' : 'Register'}
			</button>
			<div className='text-center text-sm text-white/60 mt-3'>
				Already have an account?{' '}
				<Link
					href={redirectURL}
					className='text-primary hover:underline font-medium'
				>
					Login
				</Link>
			</div>
		</div>
	);
}
