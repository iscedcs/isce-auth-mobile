'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthService } from '@/lib/auth-service';
import { csrfFetch } from '@/lib/csrf-client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { BUSINESS_URL } from '@/lib/const';
import {
	AddressDobFormData,
	BusinessOnlyDetailsFormData,
	CompanyDetailsFormData,
	IdentificationDetailsFormData,
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
import { AddressDobForm } from './forms/auth/desktop/address-dob-form';
import { CompanyDetailsForm } from './forms/auth/desktop/company-details-form';
import { IdentificationDetailsForm } from './forms/auth/desktop/identification-details-form';
import { OtpVerificationForm } from './forms/auth/desktop/otp-verification-form';
import { PasswordCreationForm } from './forms/auth/desktop/password-creation-form';
import { UserDetailsForm } from './forms/auth/desktop/user-details-form';
import { PasswordResetModal } from './forms/auth/password-reset-modal';
import { Button } from './ui/button';

type SignupData = {
	userType?: UserTypeFormData;
	userDetails?: UserDetailsFormData;
	companyDetails?: CompanyDetailsFormData;
	identificationDetails?: IdentificationDetailsFormData;
	addressDobDetails?: AddressDobFormData;
	businessDetails?: BusinessOnlyDetailsFormData;
	otpVerification?: OtpVerificationFormData;
	passwordCreation?: PasswordCreationFormData;
};

interface Props {
	callbackUrl?: string;
}

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

	const safe = useMemo(() => {
		const raw =
			callbackUrl ||
			singleProduct.get('callbackUrl') ||
			singleProduct.get('redirect') ||
			singleProduct.get('redirect_uri') ||
			singleProduct.get('url') ||
			(typeof sessionStorage !== 'undefined'
				? sessionStorage.getItem('redirect_hint')
				: null);
		return getSafeRedirect(raw) || null;
	}, [callbackUrl, singleProduct]);

	// ─── Email pre-step ────────────────────────────────────────────────────────
	const [emailStep, setEmailStep] = useState(true);
	const [preEmail, setPreEmail] = useState('');
	const [emailLoading, setEmailLoading] = useState(false);

	const [referralCode, setReferralCode] = useState<string | null>(null);

	// Skip email step if ?email= is provided in the URL
	useEffect(() => {
		const urlEmail = singleProduct.get('email');
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (
			urlEmail &&
			emailRegex.test(urlEmail.trim()) &&
			!urlEmail.includes('[object')
		) {
			setPreEmail(urlEmail.trim());
			setEmailStep(false);
		}
	}, [singleProduct]);

	// Extract and persist referral code so it survives navigation
	useEffect(() => {
		const fromUrl =
			singleProduct.get('ref') ||
			singleProduct.get('referralCode') ||
			singleProduct.get('referralUsername');
		const fromStorage =
			typeof sessionStorage !== 'undefined'
				? sessionStorage.getItem('referral_code')
				: null;
		const code = fromUrl?.trim() || fromStorage?.trim() || null;
		if (code) {
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem('referral_code', code);
			}
			setReferralCode(code);
		}
	}, [singleProduct]);

	useEffect(() => {
		if (safe) sessionStorage.setItem('redirect_hint', safe);
	}, [safe]);

	function getRedirect() {
		const fromStorage =
			typeof sessionStorage !== 'undefined'
				? sessionStorage.getItem('redirect_hint')
				: null;
		return (
			safe ||
			getSafeRedirect(fromStorage) ||
			getSafeRedirect(singleProduct.get('callbackUrl')) ||
			getSafeRedirect(singleProduct.get('redirect')) ||
			getSafeRedirect(singleProduct.get('redirect_uri')) ||
			getSafeRedirect(singleProduct.get('url')) ||
			'/'
		);
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
		setIsLoading(true);
		try {
			const { exists } = await AuthService.checkPhone(data.phoneNumber);
			if (exists) {
				toast.error('Phone number already registered', {
					description:
						'An account with this phone number already exists. Please use a different number or sign in.',
				});
				setIsLoading(false);
				return;
			}
		} catch (e) {
			console.error('Phone check error:', e);
		} finally {
			setIsLoading(false);
		}

		let userDetails: any;

		if ((signupData.userType?.userType || 'USER') === 'BUSINESS_USER') {
			userDetails = {
				...data,
				userType: 'BUSINESS_USER' as const,
			};
			setSignupData((prev) => ({
				...prev,
				userDetails,
			}));
			setCurrentStep(3);
		} else {
			userDetails = {
				...data,
				userType: 'USER' as const,
				dob: (data as any).dob ?? '',
			};
			setSignupData((prev) => ({
				...prev,
				userDetails,
			}));
			setCurrentStep(3);
		}
	};

	const handleCompanyDetailsSubmit = (data: CompanyDetailsFormData) => {
		setSignupData((prev) => ({
			...prev,
			companyDetails: data,
		}));
		setCurrentStep(4);
	};

	const handleIdentificationSubmit = (data: IdentificationDetailsFormData) => {
		setSignupData((prev) => ({
			...prev,
			identificationDetails: data,
		}));
		setCurrentStep(5);
	};

	const handleAddressDobSubmit = (data: AddressDobFormData) => {
		setSignupData((prev) => {
			const businessOnly: BusinessOnlyDetailsFormData = {
				...(prev.companyDetails || {
					businessName: '',
					businessEmail: '',
					businessAddress: '',
				}),
				...(prev.identificationDetails || {
					identificationType: '',
					idNumber: '',
				}),
				...data,
			} as any;
			return {
				...prev,
				addressDobDetails: data,
				businessDetails: businessOnly,
				userDetails: prev.userDetails
					? ({
							...prev.userDetails,
							...businessOnly,
							userType: 'BUSINESS_USER' as const,
						} as any)
					: undefined,
			};
		});
		setCurrentStep(6);
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
			setCurrentStep(
				(signupData.userType?.userType || 'USER') === 'BUSINESS_USER'
					? 6
					: 3,
			);
			return;
		}

		setIsLoading(true);

		try {
			// Step 1: Verify OTP code
			const response = await AuthService.verifyOtp({
				...data,
				email: signupData.userDetails.email,
			});

			if (!response.success) {
				toast.error(response.message);
				setIsLoading(false);
				return;
			}

			// Store the OTP data
			setSignupData((prev) => ({ ...prev, otpVerification: data }));
			toast.success('Email verified successfully!');

			// Step 2: Now that OTP is verified, complete account creation (exactly like mobile!)
			const signupRes = await AuthService.completeSignup(
				signupData.userDetails,
				signupData.passwordCreation,
			);

			if (!signupRes.success) {
				toast.error(
					signupRes.message || 'Unable to create your account.',
					{ id: 'desktop-signup' },
				);
				setIsLoading(false);
				return;
			}

			// Step 3: Sign in after account creation
			const login = await AuthService.signIn(
				signupData.userDetails.email,
				signupData.passwordCreation.password,
			);
			if (!login.success || !login.data?.accessToken) {
				toast.error(
					'Account created, but login failed. Please sign in manually.',
				);
				const r = safe || getRedirect();
				const refCode =
					signupData.userDetails?.referralCode ||
					referralCode ||
					(typeof sessionStorage !== 'undefined'
						? sessionStorage.getItem('referral_code')
						: null) ||
					null;
				const redirectUrl =
					r === '/' ||
					r === '/dashboard' ||
					r === window.location.origin + '/' ||
					r === window.location.origin + '/dashboard'
						? refCode
							? `/dashboard?referralCode=${encodeURIComponent(refCode)}`
							: '/dashboard'
						: r;
				router.push(
					`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`,
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

			const finalCallback = getRedirect();
			const isRealCallback =
				finalCallback &&
				finalCallback !== '/' &&
				finalCallback !== window.location.origin + '/' &&
				!finalCallback.startsWith('/dashboard') &&
				!finalCallback.startsWith(window.location.origin + '/dashboard');

			toast.success('Welcome! Redirecting...');

			const isBusinessAccount =
				(signupData.userType?.userType || 'USER') === 'BUSINESS_USER';

			if (isRealCallback && accessToken) {
				// Use server-side launch to avoid exposing token to JS and redirect to callback url
				const launchUrl = `/api/auth/launch?url=${encodeURIComponent(finalCallback)}`;
				window.location.href = launchUrl;
				return;
			}
			if (isRealCallback) {
				window.location.href = finalCallback;
				return;
			}
			if (isBusinessAccount) {
				const businessTarget = BUSINESS_URL;
				const launchUrl = `/api/auth/launch?url=${encodeURIComponent(businessTarget)}`;
				window.location.href = launchUrl;
				return;
			}
			const refCode =
				signupData.userDetails?.referralCode ||
				referralCode ||
				(typeof sessionStorage !== 'undefined'
					? sessionStorage.getItem('referral_code')
					: null) ||
				null;
			const dashboardUrl = refCode
				? `/dashboard?referralCode=${encodeURIComponent(refCode)}`
				: (finalCallback && (finalCallback.startsWith('/dashboard') || finalCallback.startsWith(window.location.origin + '/dashboard')) ? finalCallback : '/dashboard');
			router.push(dashboardUrl);
		} catch (error) {
			console.error('OTP verification or complete signup error:', error);
			toast.error('An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordCreationSubmit = async (
		data: PasswordCreationFormData,
	) => {
		if (otpRequestInFlightRef.current) return;
		if (!signupData.userDetails?.email) {
			toast.error('User details not found. Please start over.');
			setCurrentStep(1);
			return;
		}

		setIsLoading(true);

		try {
			otpRequestInFlightRef.current = true;
			// Store password creation data
			setSignupData((prev) => ({ ...prev, passwordCreation: data }));

			// Request OTP BEFORE creating account (exactly like mobile!)
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
			setCurrentStep(
				(signupData.userType?.userType || 'USER') === 'BUSINESS_USER'
					? 7
					: 4,
			);
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
				// Only carry the email and any app redirect — NOT the referral code.
				// Referrals only apply to net-new users; an existing user signing in
				// should never trigger a referral reward.
				const signInParams = new URLSearchParams();
				signInParams.set('email', preEmail.trim());
				const redirectHint =
					typeof sessionStorage !== 'undefined'
						? sessionStorage.getItem('redirect_hint')
						: null;
				if (redirectHint) signInParams.set('redirect', redirectHint);
				router.push(`/sign-in?${signInParams.toString()}`);
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
		const isBusiness = selectedUserType === 'BUSINESS_USER';
		switch (currentStep) {
			case 1:
				return 'Please Select your account type';
			case 2:
				return 'Enter your personal details';
			case 3:
				return isBusiness
					? 'Enter your company details'
					: 'Set your password to your account';
			case 4:
				return isBusiness
					? 'Enter identification details'
					: 'Enter the OTP code sent to your mail';
			case 5:
				return isBusiness ? 'Enter your address and date of birth' : '';
			case 6:
				return isBusiness ? 'Set your password to your account' : '';
			case 7:
				return isBusiness ? 'Enter the OTP code sent to your mail' : '';
			default:
				return '';
		}
	};

	const selectedUserType = signupData.userType?.userType;

	const renderCurrentStep = () => {
		const isBusiness = selectedUserType === 'BUSINESS_USER';
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
						referralCode={referralCode}
						prefillEmail={preEmail}
					/>
				);
			case 3:
				if (isBusiness) {
					return (
						<CompanyDetailsForm
							onSubmit={handleCompanyDetailsSubmit}
							defaultValues={signupData.companyDetails}
							isLoading={isLoading}
						/>
					);
				}
				return (
					<PasswordCreationForm
						onSubmit={handlePasswordCreationSubmit}
						defaultValues={signupData.passwordCreation}
						isLoading={isLoading}
					/>
				);
			case 4:
				if (isBusiness) {
					return (
						<IdentificationDetailsForm
							onSubmit={handleIdentificationSubmit}
							defaultValues={signupData.identificationDetails}
							isLoading={isLoading}
						/>
					);
				}
				return (
					<OtpVerificationForm
						onSubmit={handleOtpVerificationSubmit}
						onResendCode={handleResendCode}
						defaultValues={signupData.otpVerification}
						isLoading={isLoading}
					/>
				);
			case 5:
				if (isBusiness) {
					return (
						<AddressDobForm
							onSubmit={handleAddressDobSubmit}
							defaultValues={signupData.addressDobDetails}
							isLoading={isLoading}
						/>
					);
				}
				return null;
			case 6:
				if (isBusiness) {
					return (
						<PasswordCreationForm
							onSubmit={handlePasswordCreationSubmit}
							defaultValues={signupData.passwordCreation}
							isLoading={isLoading}
						/>
					);
				}
				return null;
			case 7:
				if (isBusiness) {
					return (
						<OtpVerificationForm
							onSubmit={handleOtpVerificationSubmit}
							onResendCode={handleResendCode}
							defaultValues={signupData.otpVerification}
							isLoading={isLoading}
						/>
					);
				}
				return null;
			default:
				return null;
		}
	};

	return (
		<AuthLayout
			currentStep={emailStep ? 0 : currentStep}
			totalSteps={selectedUserType === 'BUSINESS_USER' ? 7 : 4}
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
							className='bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0'
							disabled={emailLoading}
						/>
						<Button
							type='button'
							onClick={handleEmailContinue}
							disabled={emailLoading}
							className='w-full rounded-[12px] font-semibold py-[24px]'
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
