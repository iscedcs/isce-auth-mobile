'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PRODUCTS } from '@/lib/products';
import {
	Calendar,
	ShoppingBag,
	Contact,
	Briefcase,
	Wallet,
	LogOut,
	User,
} from 'lucide-react';
import { getRedirect } from '@/lib/auth-flow';
import { getSafeRedirect } from '@/lib/safe-redirect';

const ICON_MAP: any = {
	contact: Contact,
	briefcase: Briefcase,
	calendar: Calendar,
	'shopping-bag': ShoppingBag,
	wallet: Wallet,
};

interface SessionUser {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	displayPicture?: string;
	userType?: string;
}

export default function DashboardPage() {
	const router = useRouter();
	const [user, setUser] = useState<SessionUser | null>(null);

	useEffect(() => {
		async function checkSession() {
			try {
				const res = await fetch('/api/auth/session');
				if (!res.ok) {
					router.replace('/sign-in');
					return;
				}
				const data = await res.json();
				if (!data.authenticated) {
					router.replace('/sign-in');
					return;
				}
				setUser(data.user);
			} catch {
				router.replace('/sign-in');
			}
		}
		checkSession();
	}, [router]);

	const handleLaunch = (product: any) => {
		if (!product.active || !user) return;

		const safe = getSafeRedirect(getRedirect()) || '/';

		// Use server-side launch to avoid exposing token to JS
		const launchUrl = `/api/auth/launch?url=${encodeURIComponent(product.url)}&redirect=${encodeURIComponent(safe)}`;
		window.location.href = launchUrl;
	};

	const handleLogout = async () => {
		await fetch('/api/logout', { method: 'POST' });
		router.replace('/sign-in?prompt=login');
	};

	const fullName =
		user?.firstName || user?.lastName ?
			`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
		:	'ISCE User';

	return (
		<div className='min-h-screen bg-black text-white p-6 flex flex-col'>
			{/* Header */}
			<div className='flex items-center justify-between mb-6'>
				<div className='flex items-center gap-3'>
					<User className='w-10 h-10 text-white/70' />
					<div>
						<p className='font-semibold text-lg'>{fullName}</p>
						<p className='text-sm text-white/50'>{user?.email}</p>
					</div>
				</div>

				<button
					onClick={handleLogout}
					className='flex items-center gap-2 border px-3 py-2 rounded-lg border-white/20 hover:bg-white/10 transition'
				>
					<LogOut className='w-4 h-4' />
					Logout
				</button>
			</div>

			<h1 className='text-3xl font-bold mb-2'>ISCE Products</h1>
			<p className='text-white/60 mb-2'>
				You’re signed in to your ISCE account. Choose where you want to
				continue.
			</p>
			<p className='text-xs text-white/40 mb-8'>
				Clicking a product will open it and pass your secure access
				token so you don’t have to log in again.
			</p>

			{/* Product Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
				{PRODUCTS.map((item) => {
					const Icon = ICON_MAP[item.icon];

					return (
						<motion.div
							key={item.id}
							whileHover={{ scale: item.active ? 1.03 : 1 }}
							whileTap={{ scale: item.active ? 0.98 : 1 }}
							onClick={() => handleLaunch(item)}
							className={`p-6 border rounded-xl bg-white/5 backdrop-blur-md cursor-pointer transition group
                ${
					item.active ?
						'border-white/20 hover:border-white/40'
					:	'border-white/10 opacity-40 cursor-not-allowed'
				}
              `}
						>
							<Icon
								className={`w-10 h-10 mb-4 ${
									item.active ? 'text-white' : 'text-white/40'
								}`}
							/>
							<p className='font-semibold text-lg'>{item.name}</p>
							<p className='text-white/40 text-sm mt-1'>
								{item.active ?
									'Open product'
								:	'Coming soon — not yet available'}
							</p>
						</motion.div>
					);
				})}
			</div>

			{/* Footer */}
			<div className='mt-auto pt-10 text-center text-white/40 text-sm'>
				ISCE Digital Concept © {new Date().getFullYear()}
			</div>
		</div>
	);
}
