'use client';

import { useEffect, useState } from 'react';
import {
	Users,
	UserCheck,
	UserPlus,
	Briefcase,
	Shield,
	Activity,
} from 'lucide-react';

interface StatsData {
	totalUsers: number | null;
	activeUsers: number | null;
	loading: boolean;
	error: string | null;
}

interface UserTypeBreakdown {
	USER: number;
	BUSINESS_USER: number;
	ADMIN: number;
	SUPER_ADMIN: number;
	EMPLOYEE: number;
}

function StatCard({
	label,
	value,
	icon: Icon,
	loading,
	accent = 'white',
}: {
	label: string;
	value: number | string | null;
	icon: React.ElementType;
	loading: boolean;
	accent?: string;
}) {
	const accentColors: Record<string, string> = {
		white: 'text-white bg-white/10 border-white/20',
		green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
		blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
		purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
		red: 'text-red-400 bg-red-500/10 border-red-500/20',
		amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
	};

	const colorClass = accentColors[accent] || accentColors.white;

	return (
		<div className='border border-white/10 rounded-xl p-5 bg-white/[0.02]'>
			<div className='flex items-center justify-between mb-4'>
				<p className='text-sm text-white/50'>{label}</p>
				<div
					className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorClass}`}
				>
					<Icon className='w-4 h-4' />
				</div>
			</div>
			{loading ?
				<div className='h-8 w-20 bg-white/10 rounded animate-pulse' />
			:	<p className='text-2xl font-bold'>
					{value !== null ? value.toLocaleString() : '—'}
				</p>
			}
		</div>
	);
}

export default function SuperAdminOverviewPage() {
	const [stats, setStats] = useState<StatsData>({
		totalUsers: null,
		activeUsers: null,
		loading: true,
		error: null,
	});
	const [breakdown, setBreakdown] = useState<UserTypeBreakdown | null>(null);

	useEffect(() => {
		async function fetchStats() {
			try {
				const [countRes, activeRes] = await Promise.all([
					fetch('/api/admin/users/count'),
					fetch('/api/admin/users/active'),
				]);

				const countData = await countRes.json();
				const activeData = await activeRes.json();

				// Backend returns { success, message, data }
				// /users/count → data is a number
				// /users/active → data is an array of active users
				const totalUsers =
					countData?.data !== undefined ?
						typeof countData.data === 'number' ?
							countData.data
						:	null
					:	null;

				const activeUsers =
					activeData?.data !== undefined ?
						Array.isArray(activeData.data) ? activeData.data.length
						: typeof activeData.data === 'number' ? activeData.data
						: null
					:	null;

				setStats({
					totalUsers,
					activeUsers,
					loading: false,
					error: null,
				});
			} catch (err) {
				setStats((prev) => ({
					...prev,
					loading: false,
					error: 'Failed to load statistics',
				}));
			}
		}

		async function fetchBreakdown() {
			try {
				const types = [
					'USER',
					'BUSINESS_USER',
					'ADMIN',
					'SUPER_ADMIN',
					'EMPLOYEE',
				] as const;
				const results = await Promise.all(
					types.map(async (type) => {
						const res = await fetch(
							`/api/admin/users?userType=${type}&limit=1000`,
						);
						const data = await res.json();
						// Backend returns { success, data: UserDto[] }
						const count =
							Array.isArray(data?.data) ? data.data.length : 0;
						return [type, count] as const;
					}),
				);
				setBreakdown(Object.fromEntries(results) as UserTypeBreakdown);
			} catch {
				// Non-critical — silently fail
			}
		}

		fetchStats();
		fetchBreakdown();
	}, []);

	return (
		<div className='p-8 max-w-6xl'>
			<div className='mb-8'>
				<h1 className='text-2xl font-bold mb-1'>System Overview</h1>
				<p className='text-white/50 text-sm'>
					Ecosystem-wide statistics and health monitoring
				</p>
			</div>

			{stats.error && (
				<div className='mb-6 p-4 border border-red-500/30 bg-red-500/10 rounded-xl text-red-300 text-sm'>
					{stats.error}
				</div>
			)}

			{/* Primary Stats */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
				<StatCard
					label='Total Users'
					value={stats.totalUsers}
					icon={Users}
					loading={stats.loading}
					accent='blue'
				/>
				<StatCard
					label='Active Users'
					value={stats.activeUsers}
					icon={UserCheck}
					loading={stats.loading}
					accent='green'
				/>
				<StatCard
					label='Inactive Users'
					value={
						(
							stats.totalUsers !== null &&
							stats.activeUsers !== null
						) ?
							stats.totalUsers - stats.activeUsers
						:	null
					}
					icon={Activity}
					loading={stats.loading}
					accent='amber'
				/>
			</div>

			{/* User Type Breakdown */}
			<div className='mb-8'>
				<h2 className='text-lg font-semibold mb-4'>Users by Type</h2>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
					<StatCard
						label='Regular Users'
						value={breakdown?.USER ?? null}
						icon={UserPlus}
						loading={!breakdown}
						accent='white'
					/>
					<StatCard
						label='Business Users'
						value={breakdown?.BUSINESS_USER ?? null}
						icon={Briefcase}
						loading={!breakdown}
						accent='purple'
					/>
					<StatCard
						label='Admins'
						value={breakdown?.ADMIN ?? null}
						icon={Shield}
						loading={!breakdown}
						accent='blue'
					/>
					<StatCard
						label='Super Admins'
						value={breakdown?.SUPER_ADMIN ?? null}
						icon={Shield}
						loading={!breakdown}
						accent='red'
					/>
					<StatCard
						label='Employees'
						value={breakdown?.EMPLOYEE ?? null}
						icon={Users}
						loading={!breakdown}
						accent='amber'
					/>
				</div>
			</div>

			{/* Quick Actions */}
			<div>
				<h2 className='text-lg font-semibold mb-4'>Quick Actions</h2>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					<a
						href='/superadmin/users'
						className='border border-white/10 rounded-xl p-5 bg-white/[0.02] hover:bg-white/[0.05] transition group'
					>
						<Users className='w-6 h-6 text-white/40 group-hover:text-white/70 mb-3 transition' />
						<p className='font-medium mb-1'>Manage Users</p>
						<p className='text-sm text-white/40'>
							View, search, and manage all ecosystem users
						</p>
					</a>
					<a
						href='/superadmin/settings'
						className='border border-white/10 rounded-xl p-5 bg-white/[0.02] hover:bg-white/[0.05] transition group'
					>
						<Activity className='w-6 h-6 text-white/40 group-hover:text-white/70 mb-3 transition' />
						<p className='font-medium mb-1'>Global Settings</p>
						<p className='text-sm text-white/40'>
							Configure ecosystem-wide preferences
						</p>
					</a>
				</div>
			</div>
		</div>
	);
}
