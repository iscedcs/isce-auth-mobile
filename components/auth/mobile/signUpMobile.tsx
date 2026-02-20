'use client';

import BusinessSignUpForm from '@/components/forms/sign-up/businessSignUpForm';
import IndividualSignUpForm from '@/components/forms/sign-up/individualSignUpForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AuthService } from '@/lib/auth-service';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { userType } from '@/lib/types/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GoArrowLeft } from 'react-icons/go';
import { MdEmail } from 'react-icons/md';
import { TbLoader2 } from 'react-icons/tb';
import { toast } from 'sonner';

export default function SignUpMobile({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const router = useRouter();
	const singleProduct = useSearchParams();

	// ─── Email pre-step state ────────────────────────────────────────────────
	const [emailStep, setEmailStep] = useState(true);
	const [preEmail, setPreEmail] = useState('');
	const [emailLoading, setEmailLoading] = useState(false);

	// ─── Account-type / form step state ─────────────────────────────────────
	const [step, setStep] = useState(15);
	const [business, setBusiness] = useState(false);
	const [individual, setIndividual] = useState(true);
	const [userType, setUserType] = useState<userType>('USER');
	const [stepNumber, setStepNumber] = useState(1);

	// If an email was passed via URL param, pre-fill and skip the email step
	useEffect(() => {
		const urlEmail = singleProduct.get('email');
		if (urlEmail) {
			setPreEmail(urlEmail);
			setEmailStep(false);
		}
	}, [singleProduct]);

	const safe = useMemo(() => {
		try {
			const sp = new URLSearchParams(window.location.search);
			const raw =
				sp.get('callbackUrl') ??
				sp.get('redirect') ??
				sp.get('redirect_uri');
			return getSafeRedirect(raw) || null;
		} catch {
			return null;
		}
	}, []);

	useEffect(() => {
		if (safe) sessionStorage.setItem('redirect_hint', safe);
	}, [safe]);

	const getRedirect = () => {
		const fromStorage = sessionStorage.getItem('redirect_hint');
		return getSafeRedirect(fromStorage) || '/';
	};

	// ─── Email step handler ──────────────────────────────────────────────────
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

	// ─── Progress helpers ────────────────────────────────────────────────────
	// 8 total steps: email(1) + account type(2) + 6 form steps(3-8)
	const totalSteps = 8;
	const displayStepNumber =
		emailStep ? 1
		: step === 15 ? 2
		: stepNumber + 1;
	const progressValue =
		emailStep ? (1 / totalSteps) * 100
		: step === 15 ? (2 / totalSteps) * 100
		: ((stepNumber + 1) / totalSteps) * 100;

	// ─── Account-type handlers ───────────────────────────────────────────────
	const handleBusiness = () => {
		setBusiness(true);
		setIndividual(false);
		setUserType('BUSINESS_USER');
	};

	const handleIndividual = () => {
		setBusiness(false);
		setIndividual(true);
		setUserType('USER');
	};

	const handleNextStep = () => {
		setStep(step + 15);
		setStepNumber(stepNumber + 1);
	};

	// ─── Email pre-step UI ───────────────────────────────────────────────────
	if (emailStep) {
		return (
			<div className='relative h-[100svh]'>
				<p className='pt-[50px] text-[14px]'>Step 1 of {totalSteps}</p>
				<div className='mt-2.5'>
					<Progress
						value={progressValue}
						className='h-[3px]'
					/>
				</div>
				<div className='mt-5'>
					<GoArrowLeft
						onClick={() => router.back()}
						className='w-8 h-8 mb-4 cursor-pointer'
					/>
					<MdEmail className='w-8 h-8 mb-4' />
					<p className='font-extrabold text-[24px] mb-1'>
						{"What's your email?"}
					</p>
					<p className='text-[14px] text-muted-foreground mb-6'>
						{"We'll check if you already have an account."}
					</p>
					<Input
						type='email'
						placeholder='Enter your email address'
						value={preEmail}
						onChange={(e) => setPreEmail(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleEmailContinue();
						}}
						className='rounded-[12px] py-[24px]'
						disabled={emailLoading}
					/>
				</div>
				<div className='absolute bottom-0 mb-[30px] w-full'>
					<Button
						onClick={handleEmailContinue}
						disabled={emailLoading}
						type='button'
						className='w-full rounded-[12px] font-semibold py-[24px]'
					>
						{emailLoading ?
							<TbLoader2 className='animate-spin w-5 h-5' />
						:	'Continue'}
					</Button>
				</div>
			</div>
		);
	}

	// ─── Account-type + form steps UI ────────────────────────────────────────
	return (
		<div className='relative h-[100svh]'>
			<p className='pt-[50px] text-[14px]'>
				Step {displayStepNumber} of {totalSteps}
			</p>
			<div className='mt-2.5'>
				<Progress
					value={progressValue}
					className='h-[3px]'
				/>
			</div>

			<div
				className={`${step > 15 ? 'hidden' : 'inline'}  w-full flex flex-row`}
			>
				<div className='absolute bottom-0 mb-[30px] w-full'>
					<Button
						onClick={handleNextStep}
						type='button'
						className='w-full rounded-[12px] font-semibold py-[24px] '
					>
						Continue
					</Button>
				</div>
				<div
					className={` ${
						step === 15 ?
							' inline translate-x-0'
						:	' hidden -translate-x-full '
					} w-full flex justify-between transition-all flex-col`}
				>
					<div className='mt-5 flex gap-5 flex-col'>
						{/* Back to email step */}
						<GoArrowLeft
							onClick={() => setEmailStep(true)}
							className='w-8 h-8 cursor-pointer'
						/>
						<p className='font-extrabold text-[24px]'>
							Select an account type
						</p>
						<div className='flex flex-col gap-5'>
							<Card
								className={` ${
									individual ? ' border-[0.5]' : ' border-0'
								} py-2.5 px-[15px] flex flex-row rounded-[12px]`}
							>
								<CardContent className=''>
									<p className='font-bold text-white text-5'>
										Individual
									</p>
									<p className='text-[14px] text-white'>
										{`Create a personal account to manage your activities and
                    access exclusive features tailored just for you.`}
									</p>
								</CardContent>
								<div className=''>
									<Checkbox
										checked={individual}
										onClick={() => handleIndividual()}
									/>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</div>
			<div className='mt-5'>
				{userType === 'USER' ?
					<IndividualSignUpForm
						stepNumber={stepNumber}
						setStepNumber={setStepNumber}
						step={step}
						setStep={setStep}
						getRedirect={getRedirect}
						prefillEmail={preEmail}
						onBackFromFirst={() => setStep(15)}
					/>
				: userType === 'BUSINESS_USER' ?
					<BusinessSignUpForm />
				:	<IndividualSignUpForm
						stepNumber={stepNumber}
						setStepNumber={setStepNumber}
						step={step}
						setStep={setStep}
						getRedirect={getRedirect}
						prefillEmail={preEmail}
						onBackFromFirst={() => setStep(15)}
					/>
				}
			</div>
		</div>
	);
}
