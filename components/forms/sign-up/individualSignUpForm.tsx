import GoogleAddressField from '@/components/shared/location-auto-complete';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SlideStep } from '@/components/ui/slide-step';
import { AuthService } from '@/lib/auth-service';
import { PASSWORDCHECK } from '@/lib/const';
import { csrfFetch } from '@/lib/csrf-client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { userType } from '@/lib/types/auth';
import { cn, startFiveMinuteCountdown } from '@/lib/utils';
import { otpSchema, signUpForIndividualSchema } from '@/schemas/mobile/sign-up';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns/format';
import { CalendarIcon } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BiRename } from 'react-icons/bi';
import { FaPhoneAlt, FaRegEye } from 'react-icons/fa';
import { GoArrowLeft } from 'react-icons/go';
import { IoMdCheckmark, IoMdClose } from 'react-icons/io';
import { LuEyeClosed } from 'react-icons/lu';
import { MdEmail, MdLocationOn, MdOutlinePassword } from 'react-icons/md';
import { toast } from 'sonner';
import z from 'zod';

export type signUpValues = z.infer<typeof signUpForIndividualSchema>;
export type otpValue = z.infer<typeof otpSchema>;

export default function IndividualSignUpForm({
	step,
	stepNumber,
	setStep,
	setStepNumber,
	getRedirect,
	prefillEmail,
	onBackFromFirst,
}: {
	stepNumber: number;
	setStepNumber: React.Dispatch<React.SetStateAction<number>>;
	step: number;
	setStep: React.Dispatch<React.SetStateAction<number>>;
	getRedirect: () => string;
	prefillEmail?: string;
	onBackFromFirst?: () => void;
}) {
	const sp = useSearchParams();

	// Save redirect during onboarding
	useEffect(() => {
		const safe = getSafeRedirect(sp.get('redirect'));
		if (safe) sessionStorage.setItem('redirect_hint', safe);
	}, [sp]);

	const userType: userType = 'USER';
	const [isOtpScreen, setIsOtpScreen] = useState(false);
	const [isConfirmPasswordScreen, setIsConfirmPasswordScreen] =
		useState(false);
	const [loading, setIsLoading] = useState(false);
	const [time, setTime] = useState('00:00');
	const [resendOTP, setResendOTP] = useState(false);
	const [password, setPassword] = useState(true);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isBuildingProfile, setIsBuidlingProfile] = useState(false);
	const [isEmailVerified, setIsEmailVerified] = useState(false);
	const otpRequestInFlightRef = useRef(false);
	const otpResendInFlightRef = useRef(false);
	const otpVerifyInFlightRef = useRef(false);

	const STEP_SIZE = 15;
	const FIRST_STEP = 2 * STEP_SIZE; // 30
	const [maxAllowedStep, setMaxAllowedStep] = useState(FIRST_STEP);

	const form = useForm<signUpValues>({
		resolver: zodResolver(signUpForIndividualSchema),
		defaultValues: {
			dob: null as unknown as Date,
			email: '',
			phoneNumber: '',
			firstName: '',
			lastName: '',
			address: '',
			passwordObj: {
				password: '',
				confirmPassword: '',
			},
		},
		mode: 'all',
	});

	const otpForm = useForm<otpValue>({
		resolver: zodResolver(otpSchema),
		defaultValues: {
			otp: '',
		},
		mode: 'all',
	});

	const email = form.watch('email');
	// Pre-fill email from parent if provided (e.g. from email-first pre-step)
	useEffect(() => {
		if (prefillEmail) {
			form.setValue('email', prefillEmail);
		}
	}, [prefillEmail, form]);
	const otpWatch = otpForm.watch('otp');
	const code = otpForm.getValues('otp');
	const passwordValues = form.watch('passwordObj.password');
	const confirmPasswordValues = form.watch('passwordObj.confirmPassword');

	const hasEightCharacters =
		form.getValues('passwordObj.password').length >= 8;
	const hasUppercase = /[A-Z]/.test(passwordValues);
	const hasLowercase = /[a-z]/.test(passwordValues);
	const hasNumber = /[0-9]/.test(passwordValues);

	// Helper: move to a given step and track the highest step the user has legitimately reached
	const goToStep = (newStep: number, newStepNumber?: number) => {
		setStep(newStep);
		if (typeof newStepNumber === 'number') {
			setStepNumber(newStepNumber);
		} else {
			setStepNumber(newStep / STEP_SIZE);
		}
		setMaxAllowedStep((prev) => Math.max(prev, newStep));
	};

	// Reusable stepGuard: validates relevant fields for the current step
	const stepGuard = async (currentStep: number): Promise<boolean> => {
		if (currentStep < 15 * 2) return true;
		const fieldsByStep: Record<number, (keyof signUpValues | string)[]> = {
			[15 * 2]: ['firstName', 'lastName'],
			[15 * 3]: ['email'],
			[15 * 4]: ['phoneNumber'],
			[15 * 5]: ['passwordObj.password', 'passwordObj.confirmPassword'],
			[15 * 6]: ['address'],
			[15 * 7]: ['dob'],
		};

		const fields = fieldsByStep[currentStep];
		if (!fields) return true;

		const valid = await form.trigger(fields as any);

		if (!valid) {
			switch (currentStep) {
				case 15 * 2:
					toast.error(
						'Please enter your first and last name to continue.',
					);
					break;
				case 15 * 3:
					toast.error(
						'Please enter a valid email address to continue.',
					);
					break;
				case 15 * 4:
					toast.error(
						'Please enter a valid Nigerian phone number to continue.',
					);
					break;
				case 15 * 5:
					toast.error(
						'Please choose a strong password and confirm it to continue.',
					);
					break;
				case 15 * 6:
					toast.error('Please enter your address to continue.');
					break;
				case 15 * 7:
					toast.error(
						'Please select your date of birth to continue.',
					);
					break;
				default:
					toast.error('Please complete this step before continuing.');
					break;
			}
		}

		return valid;
	};

	// Prevent manual step skipping via URL / parent manipulation
	useEffect(() => {
		if (step > maxAllowedStep) {
			goToStep(maxAllowedStep, maxAllowedStep / STEP_SIZE);
			toast.error(
				'Please follow the signup steps in order before jumping ahead.',
			);
		}
	}, [step, maxAllowedStep]);

	// OTP countdown
	useEffect(() => {
		if (!isOtpScreen) {
			setTime('00:00');
			return;
		}

		const stop = startFiveMinuteCountdown(
			(min, sec) => {
				setTime(
					`${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
				);
			},
			() => {
				toast.error('The verification code has expired', {
					description:
						'Enter your email address again for a new verification code.',
				});
				setIsOtpScreen(false);
			},
		);

		return stop;
	}, [isOtpScreen, resendOTP]);

	// Live password strength detection (auto-detect bad passwords)
	useEffect(() => {
		// update PASSWORDCHECK visual flags
		if (hasLowercase) {
			PASSWORDCHECK[0].state = true;
		} else {
			PASSWORDCHECK[0].state = false;
		}

		if (hasEightCharacters) {
			PASSWORDCHECK[1].state = true;
		} else {
			PASSWORDCHECK[1].state = false;
		}

		if (hasUppercase) {
			PASSWORDCHECK[2].state = true;
		} else {
			PASSWORDCHECK[2].state = false;
		}

		if (hasNumber) {
			PASSWORDCHECK[3].state = true;
		} else {
			PASSWORDCHECK[3].state = false;
		}

		// Attach a live error to the password field if it's weak
		if (!passwordValues) {
			form.clearErrors('passwordObj.password');
			return;
		}

		if (
			!hasEightCharacters ||
			!hasLowercase ||
			!hasUppercase ||
			!hasNumber
		) {
			form.setError('passwordObj.password', {
				type: 'manual',
				message:
					'Password is too weak. Please meet all the requirements listed above.',
			});
		} else {
			form.clearErrors('passwordObj.password');
		}
	}, [
		hasEightCharacters,
		hasLowercase,
		hasUppercase,
		hasNumber,
		passwordValues,
		form,
	]);

	const handleResendOTP = async () => {
		if (otpResendInFlightRef.current) return;
		try {
			otpResendInFlightRef.current = true;
			setResendOTP(true);
			setIsLoading(true);
			const res = await csrfFetch('/api/request-verification-code', {
				body: JSON.stringify({ email }),
				method: 'POST',
			});
			const data = await res.json();
			if (!isApiErrorResponse(res, data)) {
				toast.success('Verification Code Resent', {
					id: 'otp-resend',
					description: 'Check your email for the code.',
				});
				setIsLoading(false);
				setResendOTP(false);
				return data;
			}
			toast.error('Something went wrong', {
				id: 'otp-resend',
				description:
					getApiErrorMessage(data) ||
					'There was a problem getting the verification code.',
			});
			setIsLoading(false);
			return null;
		} catch (e: any) {
			setIsLoading(false);
			console.log('Error resending OTP Code', e);
		} finally {
			otpResendInFlightRef.current = false;
		}
	};

	// Auto-verify OTP once 6 digits are entered
	useEffect(() => {
		const verifyOTP = async () => {
			if (otpWatch.length === 6) {
				if (otpVerifyInFlightRef.current) return;
				const isValid = await otpForm.trigger('otp');
				if (!isValid) return;
				try {
					otpVerifyInFlightRef.current = true;
					setIsLoading(true);
					const res = await csrfFetch('/api/verify-code', {
						body: JSON.stringify({ email, code }),
						method: 'POST',
					});
					const data = await res.json();
					if (!isApiErrorResponse(res, data)) {
						setIsLoading(false);
						setIsOtpScreen(false);
						setIsEmailVerified(true);

						toast.success('Email verified successfully', {
							id: 'otp-verify',
							description:
								'Your email has been verified successfully',
						});

						// Move to phone number step after successful email verification
						goToStep(15 * 4, 4);
						return data;
					}
					setTime('00:00');
					setIsLoading(false);
					// Stay / return on email step
					goToStep(15 * 3, 3);
					const apiMessage = getApiErrorMessage(data);
					toast.error('Something went wrong', {
						id: 'otp-verify',
						description:
							apiMessage ||
							'There was a problem verifying your email address. Please try again.',
					});
				} catch (e) {
					setIsLoading(false);
					console.log('Problem verifying email address', e);
				} finally {
					otpVerifyInFlightRef.current = false;
				}
			}
		};
		verifyOTP();
	}, [otpWatch, email, code]);

	const handleDisplayPassword = () => {
		setPassword((prev) => !prev);
	};

	// Back navigation
	const handlePreviousStep = () => {
		// First handle sub-screens
		if (isOtpScreen) {
			setIsOtpScreen(false);
			return;
		}

		if (isConfirmPasswordScreen) {
			setIsConfirmPasswordScreen(false);
			return;
		}

		// At first form step (names) — go back to account type
		if (step <= 15 * 2) {
			if (onBackFromFirst) onBackFromFirst();
			return;
		}

		const newStep = step - STEP_SIZE;
		const newStepNumber = Math.max(2, stepNumber - 1);

		setStep(newStep);
		setStepNumber(newStepNumber);
	};

	// Main "Continue / Next" flow with validation + stepGuard
	const handleNextStep = async () => {
		if (loading) return;

		// If user somehow jumped ahead without email verification, snap them back
		if (step > 15 * 3 && !isEmailVerified) {
			goToStep(15 * 3, 3);
			toast.error(
				'Please verify your email with the OTP before continuing.',
			);
			return;
		}

		// Allow moving from step 15 (account type) → step 30 freely
		if (step === 15) {
			goToStep(30, 2);
			return;
		}

		// Step 2 -> Step 3 (names -> email)
		if (step === 15 * 2) {
			const valid = await stepGuard(15 * 2);
			if (!valid) return;
			goToStep(15 * 3, 3);
			return;
		}

		// Step 3 (email) -> request OTP (stay on step, open OTP screen)
		if (step === 15 * 3 && !isOtpScreen) {
			if (otpRequestInFlightRef.current) return;
			const valid = await stepGuard(15 * 3);
			if (!valid) return;

			try {
				otpRequestInFlightRef.current = true;
				setIsLoading(true);
				const res = await csrfFetch('/api/request-verification-code', {
					body: JSON.stringify({ email }),
					method: 'POST',
				});
				const data = await res.json();
				if (!isApiErrorResponse(res, data)) {
					toast.success('Verification Code Sent', {
						id: 'otp-request',
						description: 'Check your email for the code.',
					});
					setIsOtpScreen(true);
				} else {
					const apiMessage = getApiErrorMessage(data);
					toast.error('Something went wrong', {
						id: 'otp-request',
						description:
							apiMessage ||
							'There was a problem getting the verification code.',
					});
				}
				setIsLoading(false);
				return data;
			} catch (e: any) {
				setIsLoading(false);
				console.log('Error sending OTP', e);
			} finally {
				otpRequestInFlightRef.current = false;
			}
			return;
		}

		// Step 4 -> Step 5 (phone -> password)
		if (step === 15 * 4) {
			const valid = await stepGuard(15 * 4);
			if (!valid) return;

			// Check if phone is already registered before proceeding
			const phone = form.getValues('phoneNumber');
			setIsLoading(true);
			try {
				const { exists } = await AuthService.checkPhone(phone);
				if (exists) {
					toast.error('Phone number already registered', {
						description:
							'An account with this phone number already exists. Please use a different number or sign in.',
					});
					form.setError('phoneNumber', {
						type: 'manual',
						message:
							'This phone number is already linked to an existing account.',
					});
					setIsLoading(false);
					return;
				}
			} catch {
				// If check fails, allow proceeding
			} finally {
				setIsLoading(false);
			}

			goToStep(15 * 5, 5);
			return;
		}

		// Step 6 -> Step 7 (address -> dob)
		if (step === 15 * 6) {
			const valid = await stepGuard(15 * 6);
			if (!valid) return;
			goToStep(15 * 7, 7);
			return;
		}
	};

	// Password + confirm password flow
	const handleShowConfirmPasswordScreen = async () => {
		// First click: move from password input to confirm-password sub-screen
		if (!isConfirmPasswordScreen) {
			const validPasswordOnly = await form.trigger(
				'passwordObj.password',
			);
			if (!validPasswordOnly) {
				toast.error(
					'Please choose a strong password before moving to the next step.',
				);
				return;
			}
			setIsConfirmPasswordScreen(true);
			return;
		}

		// Second click (while confirm screen is open): validate both and move forward
		const valid = await stepGuard(15 * 5);
		if (!valid) {
			toast.error('Your passwords must match to continue.');
			return;
		}

		setIsConfirmPasswordScreen(false);
		// After password step, go to address step (step 6)
		goToStep(15 * 6, 6);
	};

	const getSignupErrorMessage = (responseData: any) => {
		const detailsMessage = responseData?.details?.message;
		if (Array.isArray(detailsMessage)) {
			return detailsMessage.filter(Boolean).join(', ');
		}
		if (typeof detailsMessage === 'string' && detailsMessage.trim()) {
			return detailsMessage;
		}

		const directMessage = responseData?.message;
		if (Array.isArray(directMessage)) {
			return directMessage.filter(Boolean).join(', ');
		}
		if (typeof directMessage === 'string' && directMessage.trim()) {
			return directMessage;
		}

		if (
			typeof responseData?.error === 'string' &&
			responseData.error.trim()
		) {
			return responseData.error;
		}

		return null;
	};

	const getApiErrorMessage = (responseData: any) => {
		const directMessage = responseData?.message;
		if (Array.isArray(directMessage)) {
			return directMessage.filter(Boolean).join(', ');
		}
		if (typeof directMessage === 'string' && directMessage.trim()) {
			return directMessage;
		}

		if (
			typeof responseData?.error === 'string' &&
			responseData.error.trim()
		) {
			return responseData.error;
		}

		return null;
	};

	const isApiErrorResponse = (res: Response, responseData: any) => {
		if (!res.ok) return true;
		if (responseData?.error) return true;

		const statusCode = responseData?.statusCode;
		if (typeof statusCode === 'number' && statusCode >= 400) return true;

		const status = responseData?.status;
		if (typeof status === 'string' && status.toLowerCase() === 'error') {
			return true;
		}

		if (responseData?.success === false) return true;

		return false;
	};

	const handleSubmit = async (data: signUpValues) => {
		const finalValid = await stepGuard(15 * 7);
		if (!finalValid) return;

		setIsLoading(true);
		setIsBuidlingProfile(true);

		const payload = {
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phoneNumber,
			email: data.email,
			dob: data.dob,
			address: data.address,
			password: data.passwordObj.password,
			confirmpassword: data.passwordObj.confirmPassword,
			isce_permissions: {
				connect: true,
				connect_plus: true,
				store: true,
				wallet: true,
				event: true,
				access: true,
			},
			business_permissions: {
				invoicing: false,
				appointment: false,
				chat: false,
				analytics: false,
				services: false,
			},
		};

		try {
			const res = await csrfFetch(
				`/api/sign-up?userType=${encodeURIComponent(userType)}`,
				{
					body: JSON.stringify(payload),
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
			const responseData = await res.json();
			if (res.ok) {
				setIsLoading(false);

				// Attempt automatic sign in
				const login = await AuthService.signIn(
					payload.email,
					payload.password,
				);

				if (login.success && login.data?.accessToken) {
					const token = login.data.accessToken;
					const refreshToken = login.data.refreshToken;

					// Store tokens in httpOnly cookies via server route
					await csrfFetch('/api/auth/set-token', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ token, refreshToken }),
					});

					toast.success("You're In!");
					const safe = getSafeRedirect(getRedirect());
					setIsBuidlingProfile(true);

					setTimeout(() => {
						if (safe && token) {
							// Use server-side launch to avoid exposing token to JS
							const launchUrl = `/api/auth/launch?url=${encodeURIComponent(safe)}`;
							window.location.href = launchUrl;
							return;
						}

						window.location.href = '/dashboard';
					}, 1500);

					return;
				}

				// If auto sign-in fails, fall back to explicit login
				const r = getRedirect();
				toast.success('Account created! Please sign in.');
				window.location.href = `/sign-in?redirect=${encodeURIComponent(r)}`;
				return responseData;
			}

			setIsBuidlingProfile(false);
			goToStep(15 * 2, 2);
			const backendMessage = getSignupErrorMessage(responseData);
			toast.error('Sign up failed', {
				description:
					backendMessage ||
					'There was a problem creating your account. Please try again.',
			});
			return null;
		} catch (e) {
			console.log('Problem creating account', e);
			setIsBuidlingProfile(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				{/* STEP 2: Names */}
				<SlideStep
					show={
						step === 15 * 2 &&
						!isOtpScreen &&
						!isConfirmPasswordScreen
					}
				>
					<div
						className={` ${
							step === 15 * 2 ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full  '
						} hidden transition-all w-full mt-5`}
					>
						{/* Back to account type */}
						<GoArrowLeft
							onClick={handlePreviousStep}
							className=' w-8 h-8 mb-4 cursor-pointer'
						/>
						<BiRename className=' w-8 h-8' />
						<FormField
							control={form.control}
							name='firstName'
							render={({ field }) => (
								<FormItem>
									<Label className=' mt-2.5 font-extrabold text-[24px]'>
										Enter your first name*
									</Label>
									<FormControl>
										<Input
											required
											{...field}
											className=' text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
										/>
									</FormControl>
									<FormMessage className=' text-accent' />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='lastName'
							render={({ field }) => (
								<FormItem className=' mt-5'>
									<Label className=' mt-2.5 font-extrabold text-[24px]'>
										Enter your last name*
									</Label>
									<FormControl>
										<Input
											required
											{...field}
											className=' text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
										/>
									</FormControl>
									<FormMessage className=' text-accent' />
								</FormItem>
							)}
						/>
					</div>
				</SlideStep>

				{/* STEP 3: Email / OTP */}
				<SlideStep show={step === 15 * 3 && !isOtpScreen}>
					<div
						className={` ${
							step === 15 * 3 && isOtpScreen === false ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full  '
						} hidden transition-all w-full mt-5`}
					>
						{step > 15 * 2 && !isOtpScreen && (
							<GoArrowLeft
								onClick={handlePreviousStep}
								className=' w-8 h-8 mb-4'
							/>
						)}
						<MdEmail className=' w-8 h-8' />
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
											required
											{...field}
											className=' text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
										/>
									</FormControl>
									<FormMessage className=' text-accent' />
								</FormItem>
							)}
						/>
					</div>
				</SlideStep>

				{/* OTP SCREEN (sub-step of email) */}
				<SlideStep show={isOtpScreen}>
					<div
						className={`${
							isOtpScreen ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full  '
						} hidden transition-all w-full mt-5`}
					>
						<GoArrowLeft
							onClick={handlePreviousStep}
							className=' w-8 h-8'
						/>
						<Form {...otpForm}>
							<FormField
								name='otp'
								control={otpForm.control}
								render={({ field }) => (
									<FormItem>
										<Label className=' mt-2.5 font-extrabold text-[24px]'>
											Enter OTP code*
										</Label>
										<FormControl>
											<div className=' relative'>
												<Input
													{...field}
													maxLength={6}
													className=' text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
												/>
												<p className=' right-0 top-1/2 text-[12px] -translate-y-1/2 absolute'>
													{time}
												</p>
											</div>
										</FormControl>
										<FormDescription className=' text-[12px]'>
											You only have to enter the OTP code
											we sent to your email address -{' '}
											{email}
										</FormDescription>
										<FormMessage className=' text-accent' />
									</FormItem>
								)}
							/>
						</Form>
					</div>
				</SlideStep>

				{/* STEP 4: Phone */}
				<SlideStep show={step === 15 * 4}>
					<div
						className={` ${
							step === 15 * 4 ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full  '
						} hidden transition-all w-full mt-5`}
					>
						{step >= 15 * 4 && (
							<GoArrowLeft
								onClick={handlePreviousStep}
								className=' w-8 h-8 mb-4'
							/>
						)}
						<FaPhoneAlt className=' w-8 h-8' />
						<FormField
							control={form.control}
							name='phoneNumber'
							render={({ field }) => (
								<FormItem>
									<Label className=' w-[70%] mt-2.5 font-extrabold text-[24px]'>
										What’s your phone number?
									</Label>
									<FormControl>
										<div className=' mt-[15px] items-center flex gap-5'>
											<Input
												required
												{...field}
												className='  text-5 outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 '
											/>
										</div>
									</FormControl>
									<FormMessage className=' text-accent' />
								</FormItem>
							)}
						/>
					</div>
				</SlideStep>

				{/* STEP 5: Password */}
				<SlideStep show={step === 15 * 5 && !isConfirmPasswordScreen}>
					<div
						className={` ${
							step === 15 * 5 && !isConfirmPasswordScreen ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full  '
						} hidden transition-all w-full mt-5`}
					>
						{step >= 15 * 5 && !isConfirmPasswordScreen && (
							<GoArrowLeft
								onClick={handlePreviousStep}
								className=' w-8 h-8 mb-4'
							/>
						)}
						<MdOutlinePassword className=' w-8 h-8' />
						<FormField
							control={form.control}
							name='passwordObj.password'
							render={({ field }) => (
								<FormItem>
									<Label className=' mt-2.5 font-extrabold text-[24px]'>
										Create your password
									</Label>
									<FormControl>
										<div className=' relative'>
											<Input
												required
												{...field}
												type={
													password ? 'password' : (
														'text'
													)
												}
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
									<div className=' text-[12px] mt-2.5'>
										{PASSWORDCHECK.map((check) => (
											<div
												key={check.key}
												className={`flex gap-2 items-center ${
													check.state === true ?
														' text-white '
													:	' text-accent'
												} `}
											>
												{check.state === true ?
													<IoMdCheckmark />
												:	<IoMdClose />}
												<div>{check.message}</div>
											</div>
										))}
									</div>
									<FormMessage className=' text-accent' />
								</FormItem>
							)}
						/>
					</div>
				</SlideStep>

				{/* Confirm Password sub-screen */}
				<SlideStep show={isConfirmPasswordScreen}>
					<div
						className={`${
							isConfirmPasswordScreen ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full  '
						} hidden transition-all w-full mt-5`}
					>
						<GoArrowLeft
							onClick={handlePreviousStep}
							className=' w-8 h-8'
						/>
						<FormField
							name='passwordObj.confirmPassword'
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<Label className=' mt-2.5 font-extrabold text-[24px]'>
										Confirm your password
									</Label>
									<FormControl>
										<div className=' relative'>
											<Input
												required
												{...field}
												type={
													password ? 'password' : (
														'text'
													)
												}
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
									<FormMessage className=' text-accent' />
								</FormItem>
							)}
						/>
					</div>
				</SlideStep>

				{/* STEP 6: Address */}
				<SlideStep show={step === 15 * 6}>
					<div
						className={` ${
							step === 15 * 6 ?
								' inline translate-x-0 '
							:	' hidden  -translate-x-full '
						} hidden transition-all w-full mt-5`}
					>
						{step >= 15 * 6 && (
							<GoArrowLeft
								onClick={handlePreviousStep}
								className=' w-8 h-8 mb-4'
							/>
						)}
						<div className=''>
							<p className=' text-[24px] font-extrabold'>
								Personalize your profile with your address
							</p>
							<ScrollArea className=' h-[400px]'>
								<div className=' mt-2.5'>
									<FormField
										name='address'
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<div className='relative'>
														<MdLocationOn className='absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px]' />
														<GoogleAddressField
															value={
																field.value ??
																''
															}
															onChange={(val) =>
																field.onChange(
																	val,
																)
															}
															onSelectAddress={(
																structured,
															) => {
																form.setValue(
																	'structuredAddress',
																	structured,
																);
															}}
														/>
													</div>
												</FormControl>
												<FormMessage className='text-accent' />
											</FormItem>
										)}
									/>
								</div>
								<ScrollBar orientation='vertical' />
							</ScrollArea>
						</div>
					</div>
				</SlideStep>

				{/* STEP 7: DOB + submit */}
				<SlideStep show={step === 15 * 7}>
					<div
						className={` ${
							step === 15 * 7 ?
								' inline translate-x-0 '
							:	' hidden -translate-x-full '
						} hidden transition-all w-full mt-5`}
					>
						<div className=' px-5 py-[100px]  bg-black w-screen  flex flex-col gap-[19px] fixed left-0 top-0 z-30 h-[100svh]'>
							<GoArrowLeft
								onClick={handlePreviousStep}
								className=' w-8 h-8'
							/>
							<div className=''>
								<p className=' text-8 font-bold'>
									When’s your birthday?
								</p>
								<p className=' w-[70%] text-[18px]'>
									Your birthday won’t be shown publicly.
								</p>
								<FormField
									control={form.control}
									name='dob'
									render={({ field }) => (
										<FormItem className='flex w-full flex-col'>
											<Popover>
												<PopoverTrigger
													className='w-full'
													asChild
												>
													<FormControl>
														<Button
															variant={'outline'}
															className={cn(
																' text-[18px] py-5 mt-[30px] border-l-0 px-0 border-r-0 border-t-0 w-full rounded-none text-left font-normal',
																!field.value &&
																	'text-muted-foreground',
															)}
														>
															{field.value ?
																format(
																	field.value,
																	'PPP',
																)
															:	<span>
																	Pick a date
																</span>
															}
															<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent
													className='w-full p-0 bg-secondary mt-2.5 text-white border-none'
													align='center'
												>
													<Calendar
														mode='single'
														selected={field.value}
														onSelect={
															field.onChange
														}
														className='w-full bg-black text-white'
														disabled={(date) =>
															date > new Date() ||
															date <
																new Date(
																	'1900-01-01',
																)
														}
														captionLayout='dropdown'
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<Button
								type='submit'
								disabled={!form.formState.isValid || loading}
								className=' w-full rounded-[12px] font-semibold py-[24px]'
							>
								Finish setup
							</Button>
						</div>
					</div>
				</SlideStep>

				{isBuildingProfile ?
					<div className='fixed left-0 top-0 z-30 h-[100svh]'>
						<div className=' relative'>
							<Image
								src={'/assets/loading-screen.gif'}
								alt='building'
								width={'1000'}
								height={'1000'}
								className=' h-[100svh]'
							/>
							<div className=' bg-black/60 flex flex-col items-center justify-center top-0 absolute z-40 w-full h-[100svh] '>
								<p className=' text-8 w-[60%] text-center font-bold'>
									BUILDING YOUR PROFILE
								</p>
								<p className=' text-[18px]'>
									Sit tight while we work our magic.
								</p>

								<div className=' absolute  text-center mb-5 bottom-0'>
									<p className=' text-[18px]'>
										Did you know?
									</p>
									<p className=' mx-auto w-[70%] text-[12px]'>
										You can share your contact information
										with a tap – easy and fast contactless
										lifestyle.
									</p>
								</div>
							</div>
						</div>
					</div>
				:	<div className=''></div>}

				{/* Bottom CTA area */}
				<div className='  absolute bottom-0 mb-[30px] w-full'>
					{isOtpScreen ?
						<Button
							onClick={handleResendOTP}
							type='button'
							disabled={loading}
							className='  w-full rounded-[12px] font-semibold py-[24px] '
						>
							Resend OTP
						</Button>
					: step === 15 * 5 ?
						<Button
							onClick={handleShowConfirmPasswordScreen}
							type='button'
							disabled={loading}
							className='  w-full rounded-[12px] font-semibold py-[24px] '
						>
							Continue
						</Button>
					:	<Button
							onClick={handleNextStep}
							type='button'
							disabled={loading}
							className='  w-full rounded-[12px] font-semibold py-[24px] '
						>
							{step === 15 * 6 ? 'Next' : 'Continue'}
						</Button>
					}
				</div>
			</form>
		</Form>
	);
}
