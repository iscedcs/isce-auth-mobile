'use client';

import AuthHeader from '@/components/shared/authHeader';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/auth-service';
import { authLogger } from '@/lib/auth-logger';
import { csrfFetch } from '@/lib/csrf-client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { signInFormSchema } from '@/schemas/mobile/sign-in';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaRegEye } from 'react-icons/fa';
import { GoArrowLeft } from 'react-icons/go';
import { LuEyeClosed } from 'react-icons/lu';
import { MdEmail, MdOutlinePassword } from 'react-icons/md';
import { TbLoader2 } from 'react-icons/tb';
import { toast } from 'sonner';
import z from 'zod';

export type signInValues = z.infer<typeof signInFormSchema>;
type Props = { callbackUrl: string | null };

export default function MobileSignInForm({ callbackUrl }: Props) {
	const [password, setPassword] = useState(true);
	const [loading, setIsLoading] = useState(false);
	const [step, setStep] = useState(1);

	const form = useForm<signInValues>({
		resolver: zodResolver(signInFormSchema),
		defaultValues: {
			email: '',
			password: '',
		},
		mode: 'all',
	});

	const router = useRouter();
	const singleProduct = useSearchParams();

	const emailWatch = form.watch('email');

	useEffect(() => {
		if (emailWatch === '') {
			setIsLoading(true);
		} else {
			setIsLoading(false);
		}
	}, [emailWatch]);

	const prompt =
		singleProduct.get('prompt') === 'login' ? '&prompt=login' : '';

	// Pre-fill email from URL param (e.g. redirected from sign-up or sign-up email check)
	useEffect(() => {
		const urlEmail = singleProduct.get('email');
		if (urlEmail) {
			form.setValue('email', urlEmail);
			setIsLoading(false);
		}
	}, [singleProduct, form]);

	// /** -------------------------------------------
	//  * 🧹 2. STORE SAFE REDIRECT
	//  * ------------------------------------------*/
	// useEffect(() => {
	//   const safe = getSafeRedirect(callbackUrl);
	//   if (safe) sessionStorage.setItem("redirect_hint", safe);
	// }, [callbackUrl]);

	// const getRedirect = () => {
	//   const stored = sessionStorage.getItem("redirect_hint");
	//   return getSafeRedirect(stored) || "/";
	// };

	const forgotPasswordHref =
		callbackUrl ?
			`/forgot-password?redirect=${encodeURIComponent(callbackUrl)}${prompt}`
		:	`/forgot-password${prompt}`;

	const handleRedirectToForgotPassword = () => {
		router.push(forgotPasswordHref);
	};

	const signUpHref =
		callbackUrl ?
			`/sign-up?redirect=${encodeURIComponent(callbackUrl)}${prompt}`
		:	`/sign-up${prompt}`;

	const handleRedirectCreateAccount = (email?: string) => {
		if (email) {
			const base =
				callbackUrl ?
					`/sign-up?redirect=${encodeURIComponent(callbackUrl)}${prompt}`
				:	`/sign-up${prompt ? '?' + prompt.slice(1) : ''}`;
			const url = `${base}${base.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}`;
			router.push(url);
		} else {
			router.push(signUpHref);
		}
	};

	const handleDisplayPassword = () => {
		setPassword((password) => !password);
	};

	const handleNextStep = async () => {
		// Validate email field before proceeding
		const isValid = await form.trigger('email');
		if (!isValid) return;

		const email = form.getValues('email');
		setIsLoading(true);
		try {
			const { exists } = await AuthService.checkEmail(email);
			if (exists) {
				setStep(2);
			} else {
				// Email not registered — redirect to sign-up with email pre-filled
				toast.info("No account found. Let's create one!");
				handleRedirectCreateAccount(email);
			}
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (data: signInValues) => {
		const flow = authLogger.flowId();
		const elapsed = authLogger.startTimer();
		authLogger.log(
			'MOBILE-SIGNIN',
			`[${flow}] === Sign-in flow started ===`,
			{
				email: authLogger.maskEmail(data.email),
				callbackUrl: callbackUrl || 'none',
				hasPrompt: !!prompt,
				userAgent:
					typeof navigator !== 'undefined' ?
						navigator.userAgent.slice(0, 60)
					:	'unknown',
			},
		);
		try {
			setIsLoading(true);
			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] Step 1: Calling AuthService.signIn()`,
			);
			const result = await AuthService.signIn(data.email, data.password);
			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] Step 1 complete: AuthService.signIn() returned`,
				{
					success: result?.success,
					hasData: !!result?.data,
					message: result?.success ? undefined : result.message,
					elapsedMs: elapsed(),
				},
			);

			if (!result?.success) {
				authLogger.warn(
					'MOBILE-SIGNIN',
					`[${flow}] Sign-in failed at backend: ${result.message}`,
				);
				toast.error(result.message || 'Invalid email or password');
				setIsLoading(false);
				return;
			}

			if (!result?.data) {
				authLogger.error(
					'MOBILE-SIGNIN',
					`[${flow}] No user data in result — backend returned success but no data`,
				);
				toast.error('Authentication failed: missing user data');
				setIsLoading(false);
				return;
			}

			const { accessToken, refreshToken, firstName } = result.data;

			authLogger.log('MOBILE-SIGNIN', `[${flow}] Step 1 data extracted`, {
				hasAccessToken: !!accessToken,
				hasRefreshToken: !!refreshToken,
				firstName: firstName || 'empty',
			});

			if (!accessToken) {
				authLogger.error(
					'MOBILE-SIGNIN',
					`[${flow}] No access token in result.data — cannot proceed`,
				);
				toast.error('Authentication failed: missing token');
				setIsLoading(false);
				return;
			}

			// Store tokens in httpOnly cookies via server route
			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] Step 2: Storing tokens via /api/auth/set-token`,
				{
					hasAccessToken: !!accessToken,
					hasRefreshToken: !!refreshToken,
				},
			);
			const setTokenRes = await csrfFetch('/api/auth/set-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: accessToken, refreshToken }),
			});

			let setTokenBody: any = null;
			try {
				setTokenBody = await setTokenRes.clone().json();
			} catch {}

			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] Step 2 complete: set-token response`,
				{
					status: setTokenRes.status,
					ok: setTokenRes.ok,
					body: setTokenBody,
					elapsedMs: elapsed(),
				},
			);

			if (!setTokenRes.ok) {
				authLogger.error(
					'MOBILE-SIGNIN',
					`[${flow}] set-token failed — cookies not stored`,
					{
						status: setTokenRes.status,
						body: setTokenBody,
					},
				);
				toast.error(
					'Failed to store authentication. Please try again.',
				);
				setIsLoading(false);
				return;
			}

			toast.success(`Welcome back${firstName ? ', ' + firstName : ''}! `);
			const safe = getSafeRedirect(callbackUrl);
			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] Step 3: Redirect decision`,
				{
					callbackUrl: callbackUrl || 'none',
					safeRedirect: safe || 'none',
					willLaunch: !!(safe && accessToken),
				},
			);

			if (safe && accessToken) {
				// Use server-side launch to avoid exposing token to JS
				const launchUrl = `/api/auth/launch?url=${encodeURIComponent(safe)}`;
				authLogger.log(
					'MOBILE-SIGNIN',
					`[${flow}] Navigating to launch: ${launchUrl}`,
				);
				authLogger.log(
					'MOBILE-SIGNIN',
					`[${flow}] === Sign-in flow complete (SSO launch) === totalMs=${elapsed()}`,
				);
				window.location.href = launchUrl;
				return;
			}
			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] No callback — pushing to /dashboard`,
			);
			authLogger.log(
				'MOBILE-SIGNIN',
				`[${flow}] === Sign-in flow complete (dashboard) === totalMs=${elapsed()}`,
			);
			router.push('/dashboard');
		} catch (e) {
			authLogger.error(
				'MOBILE-SIGNIN',
				`[${flow}] Unexpected error: ${e instanceof Error ? e.message : 'unknown'}`,
				{
					elapsedMs: elapsed(),
					stack:
						e instanceof Error ? e.stack?.slice(0, 200) : undefined,
				},
			);
			console.error('Mobile sign-in error:', e);
			toast.error('An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<div className=' left-0 absolute top-0 w-screen'>
					<AuthHeader
						message="Don't have an account?"
						loading={false}
						onClick={handleRedirectCreateAccount}
						linkText='Create account'
					/>
				</div>
				<div className=' left-0 absolute top-0 w-screen '>
					{step === 2 ?
						<AuthHeader
							message='Forgot password?'
							loading={false}
							onClick={handleRedirectToForgotPassword}
							linkText='Click here to retrieve account'
						/>
					:	null}
				</div>
				<div className=' h-[100svh] relative '>
					<div className=' pt-6  flex gap-3 items-center'>
						<GoArrowLeft
							className=' w-8 h-8'
							onClick={() =>
								step === 2 ? setStep(1) : router.back()
							}
						/>
						{/* <p className=" text-[24px]  font-bold">Sign in to your account</p> */}
					</div>

					<div className=' mt-[40px]'>
						<div
							className={` ${
								step === 1 ?
									' inline translate-x-0 '
								:	' hidden -translate-x-full  '
							}  transition-all w-full `}
						>
							<MdEmail className=' w-8  h-8' />
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<Label className=' mt-2.5 font-extrabold text-[24px]'>
											What’s your email?
										</Label>
										<FormControl>
											<Input
												{...field}
												// placeholder="What’s your email?"
												className=' mt-[15px] py-5 text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
											/>
										</FormControl>
										<FormMessage className=' text-accent' />
									</FormItem>
								)}
							/>
						</div>
						<div
							className={` ${
								step === 2 ?
									' inline translate-x-0 '
								:	' hidden -translate-x-full  '
							} hidden transition-all w-full mt-5 relative`}
						>
							<MdOutlinePassword className=' w-8 h-8' />
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<Label className=' mt-2.5 font-extrabold text-[24px]'>
											Enter your password
										</Label>
										<FormControl>
											<div className=' relative'>
												<Input
													{...field}
													// placeholder="What’s your email?"
													type={`${password ? 'password' : 'text'}`}
													className=' mt-2.5 pr-[50px]  py-5 text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
												/>
												{!password ?
													<FaRegEye
														onClick={
															handleDisplayPassword
														}
														className=' absolute right-0 -translate-y-1 top-1/2  w-[24px] h-[24px]'
													/>
												:	<LuEyeClosed
														onClick={
															handleDisplayPassword
														}
														className=' absolute right-0 -translate-y-1 top-1/2  w-[24px] h-[24px]'
													/>
												}
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</div>

					<div className='  absolute bottom-0 mb-[30px] w-full'>
						{step === 1 ?
							<Button
								type='button'
								onClick={handleNextStep}
								disabled={loading}
								className='  w-full rounded-[12px] font-semibold py-[24px] '
							>
								{loading ?
									<TbLoader2 className=' w-[22px] h-[22px] animate-spin' />
								:	'Continue'}
							</Button>
						:	<Button
								type='submit'
								disabled={loading}
								className='  w-full rounded-[12px] font-semibold py-[24px] '
							>
								{loading ?
									<TbLoader2 className=' w-[22px] h-[22px] animate-spin' />
								:	'Login'}
							</Button>
						}
					</div>
				</div>
			</form>
		</Form>
	);
}
