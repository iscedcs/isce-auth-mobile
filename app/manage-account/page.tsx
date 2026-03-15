import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Trash2, ShieldAlert, Mail } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Account Deletion | ISCE',
	description:
		'Learn how to delete your ISCE account and what data will be removed.',
};

export default function ManageAccountPage() {
	return (
		<div className='min-h-[100svh] bg-black text-white flex flex-col'>
			<div className='flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col gap-10'>
				{/* Header */}
				<div className='flex flex-col gap-3'>
					<div className='flex items-center gap-3'>
						<ShieldAlert className='w-7 h-7 text-red-400 shrink-0' />
						<h1 className='text-2xl font-bold'>Manage Account</h1>
					</div>
					<p className='text-gray-400 text-sm leading-relaxed'>
						This page explains how to delete your ISCE account and
						what happens to your data when you do.
					</p>
				</div>

				{/* What gets deleted */}
				<section className='flex flex-col gap-4'>
					<h2 className='text-base font-semibold flex items-center gap-2'>
						<Trash2 className='w-5 h-5 text-red-400' />
						What gets deleted
					</h2>
					<ul className='flex flex-col gap-2 text-sm text-gray-300'>
						{[
							'Your profile and all personal information',
							'Social links, contact cards, and custom links',
							'Saved contacts and meeting links',
							'Uploaded files and gallery items',
							'Wallet payment details and linked bank accounts',
							'Transaction history and escrow records',
							'All connected device tokens and sessions',
						].map((item) => (
							<li
								key={item}
								className='flex items-start gap-2'
							>
								<span className='mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0' />
								{item}
							</li>
						))}
					</ul>
					<p className='text-xs text-gray-500 leading-relaxed'>
						Account deletion is permanent and cannot be undone.
						Before deleting, you have the option to export a copy
						of your data.
					</p>
				</section>

				{/* How to delete */}
				<section className='flex flex-col gap-4'>
					<h2 className='text-base font-semibold'>
						How to delete your account
					</h2>
					<ol className='flex flex-col gap-3 text-sm text-gray-300'>
						{[
							'Sign in to your ISCE account using the button below.',
							'You will be taken to your account dashboard.',
							'Tap the "Delete Account" button at the bottom of the dashboard.',
							'Optionally export your data, then type "delete my account" to confirm.',
							'Your account and all associated data will be permanently deleted.',
						].map((step, i) => (
							<li
								key={i}
								className='flex items-start gap-3'
							>
								<span className='shrink-0 w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center font-medium'>
									{i + 1}
								</span>
								{step}
							</li>
						))}
					</ol>
				</section>

				{/* CTA */}
				<Link
					href='/sign-in'
					className='flex items-center justify-center gap-2 w-full rounded-xl bg-white text-black font-semibold py-3.5 text-sm active:scale-95 transition-transform'
				>
					Sign in to delete your account
					<ArrowRight className='w-4 h-4' />
				</Link>

				{/* Support fallback */}
				<section className='flex flex-col gap-2 text-sm'>
					<p className='text-gray-400'>
						Can&apos;t sign in?{' '}
						<span className='text-white'>
							Contact support and we&apos;ll process your deletion
							request manually.
						</span>
					</p>
					<a
						href='mailto:support@isce.tech'
						className='flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit'
					>
						<Mail className='w-4 h-4' />
						support@isce.tech
					</a>
				</section>
			</div>
		</div>
	);
}
