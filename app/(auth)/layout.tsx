'use client';
import { getSafeRedirect } from '@/lib/safe-redirect';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AuthLayoutInner({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const pathname = usePathname();
	const search = useSearchParams();

	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		try {
			const raw =
				search.get('redirect') ??
				search.get('callbackUrl') ??
				search.get('redirect_uri') ??
				null;

			const safe = getSafeRedirect(raw);
			if (safe) {
				console.log('Captured redirect:', safe);
				sessionStorage.setItem('redirect_hint', safe);
			}
		} catch (e) {
			console.log('Redirect capture skipped');
		}
	}, [search]);

	// Check if user is logged in via cookie flag
	useEffect(() => {
		const hasFlag = document.cookie
			.split('; ')
			.some((c) => c.startsWith('isce_logged_in='));
		setIsLoggedIn(hasFlag);
	}, []);

	/**---------------------------------------------------------
   * Redirect logged-in users AWAY from sign-in/sign-up pages
   -----------------------------------------------------------*/
	useEffect(() => {
		if (!isLoggedIn) return;

		const restricted = ['/sign-in', '/sign-up', '/register'];

		const isRestricted = restricted.includes(pathname);

		const hasRedirect = search.has('redirect_uri');
		const forcedLogin = search.get('prompt') === 'login';

		if (isLoggedIn && isRestricted && !hasRedirect && !forcedLogin) {
			router.replace('/dashboard');
		}
	}, [isLoggedIn, pathname, router]);

	return <>{children}</>;
}

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense fallback={null}>
			<AuthLayoutInner>{children}</AuthLayoutInner>
		</Suspense>
	);
}
