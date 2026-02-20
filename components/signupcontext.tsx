'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthService } from '@/lib/auth-service';
import { csrfFetch } from '@/lib/csrf-client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import {
	OtpVerificationFormData,
	PasswordCreationFormData,
	UserDetailsFormData,
	UserTypeFormData,
} from '@/schemas/desktop';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Input } from './ui/input';
import { AuthLayout } from './forms/auth/auth-layout';
import { AccountTypeForm } from './forms/auth/desktop/account-type-form';
import { OtpVerificationForm } from './forms/auth/desktop/otp-verification-form';
import { PasswordCreationForm } from './forms/auth/desktop/password-creation-form';
import { UserDetailsForm } from './forms/auth/desktop/user-details-form';
import { PasswordResetModal } from './forms/auth/password-reset-modal';
import { Button } from './ui/button';

type SignupData = {
	userType?: UserTypeFormData;
	userDetails?: UserDetailsFormData;
	otpVerification?: OtpVerificationFormData;
	passwordCreation?: PasswordCreationFormData;
};

type Props = { callbackUrl: string | null };

export default function SignUpClient({ callbackUrl }: Props) {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [signupData, setSignupData] = useState<SignupData>({});
	const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] =
		useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const otpRequestInFlightRef = useRef(false);
	const otpResendInFlightRef = useRef(false);
	const singleProduct = useSearchParams();
	const safe = getSafeRedirect(callbackUrl);

	// ─── Email pre-step ────────────────────────────────────────────────────────
	const [emailStep, setEmailStep] = useState(true);
	const [preEmail, setPreEmail] = useState('');
	const [emailLoading, setEmailLoading] = useState(false);

	// Skip email step if ?email= is provided in the URL
	useEffect(() => {
		const urlEmail = singleProduct.get('email');
		if (urlEmail) {
			setPreEmail(urlEmail);
			setEmailStep(false);
		}
	}, [singleProduct]);

	useEffect(() => {
		if (safe) sessionStorage.setItem('redirect_hint', safe);
	}, [safe]);

	function getRedirect() {
		const fromStorage = sessionStorage.getItem('redirect_hint');
		return getSafeRedirect(fromStorage) || '/';
	}

	// useEffect(() => {
	//   function maybeForceReauth() {
	//     if (singleProduct.get("prompt") === "login") {
	//       localStorage.removeItem("isce_auth_token");

	//       sessionStorage.removeItem("redirect_hint");

	//       document.cookie = "accessToken=; Max-Age=0; path=/;";
	//     }
	//   }

	//   maybeForceReauth();
	// }, [singleProduct]);

	const cardImages = [
		'/images/BROWN.png',
		'/images/GREEN.png',
		'/images/PuURPLE.png',
	];
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		const t = setInterval(
			() => setCurrent((p) => (p + 1) % cardImages.length),
			4000,
		);
		return () => clearInterval(t);
	}, []);

	const handleUserTypeSubmit = (data: UserTypeFormData) => {
		setSignupData((prev) => ({ ...prev, userType: data }));
		setCurrentStep(2);
	};

	const handleUserDetailsSubmit = async (data: UserDetailsFormData) => {
		let userDetails: SignupData['userDetails'];

		if ((signupData.userType?.userType || 'USER') === 'BUSINESS_USER') {
			userDetails = {
				...data,
				userType: 'BUSINESS_USER' as const,
				address: data.address ?? '',
				dob: data.dob ?? '',
			};
		} else {
			userDetails = {
				...data,
				userType: 'USER' as const,
				dob: data.dob ?? '',
			};
		}
		setSignupData((prev) => ({
			...prev,
			userDetails,
		}));
		setCurrentStep(3);
	};

	const handleOtpVerificationSubmit = async (
		data: OtpVerificationFormData,
	) => {
		if (!signupData.userDetails?.email) {
			toast.error('Email not found. Please start over.');
			setCurrentStep(1);
			return;
		}
		if (!signupData.passwordCreation?.password) {
			toast.error('Password not found. Please set your password first.');
			setCurrentStep(3);
			return;
		}

		setIsLoading(true);

		try {
			// If your backend supports separate OTP verification, uncomment this:
			const response = await AuthService.verifyOtp({
				...data,
				email: signupData.userDetails.email,
			});

			if (!response.success) {
				toast.error(response.message);
				setIsLoading(false);
				return;
			}

			// Store the OTP data and continue to sign-in
			setSignupData((prev) => ({ ...prev, otpVerification: data }));
			toast.success('Email verified successfully!');

			const login = await AuthService.signIn(
				signupData.userDetails.email,
				signupData.passwordCreation.password,
			);
			if (!login.success || !login.data?.accessToken) {
				toast.error(
					'Account verified, but login failed. Please sign in manually.',
				);
				const redirect = safe || getRedirect();
				router.push(
					`/sign-in?redirect=${encodeURIComponent(redirect)}`,
				);
				setIsLoading(false);
				return;
			}

			const accessToken = login.data.accessToken;
			const refreshToken = login.data.refreshToken;

			// Store tokens in httpOnly cookies via server route
			await csrfFetch('/api/auth/set-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: accessToken, refreshToken }),
			});

			toast.success('Welcome! Redirecting...');

			if (safe && accessToken) {
				// Use server-side launch to avoid exposing token to JS
				const launchUrl = `/api/auth/launch?url=${encodeURIComponent(safe)}`;
				window.location.href = launchUrl;
				return;
			}
			router.push('/dashboard');
		} catch (error) {
			console.error('OTP verification error:', error);
			toast.error('An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordCreationSubmit = async (
		data: PasswordCreationFormData,
	) => {
		if (otpRequestInFlightRef.current) return;
		if (!signupData.userDetails) {
			toast.error('User details not found. Please start over.');
			setCurrentStep(1);
			return;
		}

		setIsLoading(true);

		try {
			otpRequestInFlightRef.current = true;
			const response = await AuthService.completeSignup(
				signupData.userDetails,
				data,
			);

			if (response.success) {
				setSignupData((prev) => ({ ...prev, passwordCreation: data }));
				const otpResponse = await AuthService.requestOtp(
					signupData.userDetails.email,
				);
				if (!otpResponse.success) {
					toast.error(otpResponse.message, {
						id: 'desktop-otp-request',
					});
					return;
				}

				toast.success(
					'Details saved! Please check your email for verification code.',
					{ id: 'desktop-otp-request' },
				);
				setCurrentStep(4);
			} else {
				toast.error(
					response.message || 'Unable to create your account.',
					{
						id: 'desktop-signup',
					},
				);
			}
		} catch (error) {
			console.error('Complete signup error:', error);
			toast.error('An unexpected error occurred. Please try again.', {
				id: 'desktop-signup',
			});
		} finally {
			setIsLoading(false);
			otpRequestInFlightRef.current = false;
		}
	};

	const handleResendCode = async () => {
		if (otpResendInFlightRef.current) return;
		if (!signupData.userDetails?.email) {
			toast.error('Email not found. Please start over.');
			return;
		}

		setIsLoading(true);

		try {
			otpResendInFlightRef.current = true;
			const response = await AuthService.requestOtp(
				signupData.userDetails.email,
			);

			if (response.success) {
				toast.success('Verification code sent!', {
					id: 'desktop-otp-resend',
				});
			} else {
				toast.error(response.message, { id: 'desktop-otp-resend' });
			}
		} catch (error) {
			console.error('Resend OTP error:', error);
			toast.error('Failed to resend code. Please try again.', {
				id: 'desktop-otp-resend',
			});
		} finally {
			setIsLoading(false);
			otpResendInFlightRef.current = false;
		}
	};

	const handleEmailContinue = async () => {
		if (!preEmail.trim()) {
			toast.error('Please enter your email address to continue.');
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(preEmail.trim())) {
			toast.error('Please enter a valid email address.');
			return;
		}
		try {
			setEmailLoading(true);
			const { exists } = await AuthService.checkEmail(preEmail.trim());
			if (exists) {
				toast.error('Email already registered', {
					description:
						'An account with this email already exists. Redirecting you to sign in…',
				});
				router.push(
					`/sign-in?email=${encodeURIComponent(preEmail.trim())}`,
				);
				return;
			}
			setEmailStep(false);
		} catch {
			toast.error('Something went wrong', {
				description:
					'Unable to check your email right now. Please try again.',
			});
		} finally {
			setEmailLoading(false);
		}
	};

	const handlePreviousStep = () => {
		if (isLoading) return;
		if (currentStep <= 1) {
			// Back from account type → email pre-step
			setEmailStep(true);
			return;
		}
		setCurrentStep((prev) => Math.max(1, prev - 1));
	};

	const getStepTitle = () => {
		switch (currentStep) {
			case 1:
				return 'Please Select your account type';
			case 2:
				return 'Enter your details';
			case 3:
				return 'Set your password to your account';
			case 4:
				return 'Enter the OTP code sent to your mail';
			default:
				return '';
		}
	};

	const selectedUserType = signupData.userType?.userType;

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<AccountTypeForm
						onSubmit={handleUserTypeSubmit}
						defaultValues={signupData.userType}
					/>
				);
			case 2:
				if (!selectedUserType) {
					setCurrentStep(1);
					return null;
				}
				return (
					<UserDetailsForm
						onSubmit={handleUserDetailsSubmit}
						defaultValues={{ email: preEmail, ...signupData.userDetails }}
						userType={selectedUserType || 'USER'}
						isLoading={isLoading}
					/>
				);
			case 3:
				return (
					<PasswordCreationForm
						onSubmit={handlePasswordCreationSubmit}
						defaultValues={signupData.passwordCreation}
						isLoading={isLoading}
					/>
				);
			case 4:
				return (
					<OtpVerificationForm
						onSubmit={handleOtpVerificationSubmit}
						onResendCode={handleResendCode}
						defaultValues={signupData.otpVerification}
						isLoading={isLoading}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<AuthLayout
			currentStep={emailStep ? 0 : currentStep}
			totalSteps={5}
			cardImages={cardImages}
			currentSlide={current}
			setCurrentSlide={setCurrent}
		>
			<div className='space-y-4'>
				{/* Back button: on email step go to browser history; on form steps go back */}
				{emailStep ? (
					<Button
						type='button'
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='px-0 text-gray-400 hover:text-white'
					>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back
					</Button>
				) : (
					<Button
						type='button'
						variant='ghost'
						size='sm'
						onClick={handlePreviousStep}
						className='px-0 text-gray-400 hover:text-white'
					>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back
					</Button>
				)}
				{emailStep ? (
					<div className='space-y-6'>
						<div className='text-center'>
							<Mail className='mx-auto mb-3 h-8 w-8 text-gray-400' />
							<h2 className='text-2xl font-semibold text-white mb-1'>
								{"What's your email?"}
							</h2>
							<p className='text-sm text-gray-400'>
								{"We'll check if you already have an account."}
							</p>
						</div>
						<Input
							type='email'
							placeholder='Enter your email address'
							value={preEmail}
							onChange={(e) => setPreEmail(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleEmailContinue();
							}}
							className='bg-transparent border-gray-600 text-white placeholder:text-gray-500'
							disabled={emailLoading}
						/>
						<Button
							type='button'
							onClick={handleEmailContinue}
							disabled={emailLoading}
							className='w-full'
						>
							{emailLoading ? (
								<Loader2 className='animate-spin h-4 w-4' />
							) : (
								'Continue'
							)}
						</Button>
					</div>
				) : (
					renderCurrentStep()
				)}
			</div>
			<PasswordResetModal
				isOpen={isPasswordResetModalOpen}
				onClose={() => setIsPasswordResetModalOpen(false)}
				onLoginRedirect={() => {
					setIsPasswordResetModalOpen(false);
					const r = safe || getRedirect();
					router.push(`/sign-in?redirect=${encodeURIComponent(r)}`);
				}}
			/>
		</AuthLayout>
	);
}
