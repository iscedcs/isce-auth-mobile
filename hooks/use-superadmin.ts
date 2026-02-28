'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SessionUser {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	displayPicture?: string;
	userType?: string;
	phone?: string;
}

interface UseSuperAdminReturn {
	user: SessionUser | null;
	loading: boolean;
}

/**
 * Hook that checks if the authenticated user is a SUPER_ADMIN.
 * Redirects to /dashboard if not authenticated or not a superadmin.
 */
export function useSuperAdmin(): UseSuperAdminReturn {
	const router = useRouter();
	const [user, setUser] = useState<SessionUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function checkAccess() {
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
				if (data.user?.userType !== 'SUPER_ADMIN') {
					router.replace('/dashboard');
					return;
				}
				setUser(data.user);
			} catch {
				router.replace('/sign-in');
			} finally {
				setLoading(false);
			}
		}
		checkAccess();
	}, [router]);

	return { user, loading };
}
