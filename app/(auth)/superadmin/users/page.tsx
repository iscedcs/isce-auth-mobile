'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, UserX, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface UserRecord {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	userType?: string;
	displayPicture?: string;
	createdAt?: string;
	deletedAt?: string | null;
	username?: string;
	businessName?: string;
}

const USER_TYPE_COLORS: Record<string, string> = {
	USER: 'bg-white/10 text-white/70 border-white/20',
	BUSINESS_USER: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
	ADMIN: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
	SUPER_ADMIN: 'bg-red-500/15 text-red-300 border-red-500/30',
	EMPLOYEE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const PAGE_SIZE = 20;

export default function SuperAdminUsersPage() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState<string>('');
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			let url: string;

			if (searchQuery.trim()) {
				// Use search endpoint
				const params = new URLSearchParams();
				if (searchQuery.includes('@')) {
					params.set('email', searchQuery.trim());
				} else {
					params.set('fullname', searchQuery.trim());
				}
				if (filterType) params.set('userType', filterType);
				params.set('limit', String(PAGE_SIZE));
				params.set('offset', String(page * PAGE_SIZE));
				url = `/api/admin/users/search?${params.toString()}`;
			} else {
				// Use list endpoint
				const params = new URLSearchParams();
				if (filterType) params.set('userType', filterType);
				params.set('limit', String(PAGE_SIZE));
				params.set('offset', String(page * PAGE_SIZE));
				url = `/api/admin/users?${params.toString()}`;
			}

			const res = await fetch(url);
			const data = await res.json();

			const userList =
				Array.isArray(data?.data) ? data.data
				: Array.isArray(data) ? data
				: [];
			setUsers(userList);
			setHasMore(userList.length === PAGE_SIZE);
		} catch (err) {
			console.error('Failed to fetch users:', err);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}, [searchQuery, filterType, page]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// Reset page when search/filter changes
	useEffect(() => {
		setPage(0);
	}, [searchQuery, filterType]);

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className='p-8 max-w-6xl'>
			<div className='mb-8'>
				<h1 className='text-2xl font-bold mb-1'>User Management</h1>
				<p className='text-white/50 text-sm'>
					View and manage all users across the ISCE ecosystem
				</p>
			</div>

			{/* Search & Filters */}
			<div className='flex flex-col sm:flex-row gap-3 mb-6'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
					<input
						type='text'
						placeholder='Search by name or email…'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition'
					/>
				</div>
				<Select
					value={filterType || 'ALL'}
					onValueChange={(value) =>
						setFilterType(value === 'ALL' ? '' : value)
					}
				>
					<SelectTrigger className='w-[160px] bg-white/5 border-white/10 rounded-xl text-sm text-white h-[42px]'>
						<SelectValue placeholder='All Types' />
					</SelectTrigger>
					<SelectContent className='bg-zinc-900 border-white/10'>
						<SelectItem value='ALL'>All Types</SelectItem>
						<SelectItem value='USER'>User</SelectItem>
						<SelectItem value='BUSINESS_USER'>
							Business User
						</SelectItem>
						<SelectItem value='ADMIN'>Admin</SelectItem>
						<SelectItem value='SUPER_ADMIN'>Super Admin</SelectItem>
						<SelectItem value='EMPLOYEE'>Employee</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Users Table */}
			<div className='border border-white/10 rounded-xl overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-white/10 bg-white/[0.02]'>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									User
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Email
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Type
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Joined
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							{loading ?
								Array.from({ length: 5 }).map((_, i) => (
									<tr
										key={i}
										className='border-b border-white/5'
									>
										<td className='px-4 py-3'>
											<div className='h-5 w-32 bg-white/10 rounded animate-pulse' />
										</td>
										<td className='px-4 py-3'>
											<div className='h-5 w-40 bg-white/10 rounded animate-pulse' />
										</td>
										<td className='px-4 py-3'>
											<div className='h-5 w-20 bg-white/10 rounded animate-pulse' />
										</td>
										<td className='px-4 py-3'>
											<div className='h-5 w-24 bg-white/10 rounded animate-pulse' />
										</td>
										<td className='px-4 py-3'>
											<div className='h-5 w-16 bg-white/10 rounded animate-pulse' />
										</td>
									</tr>
								))
							: users.length === 0 ?
								<tr>
									<td
										colSpan={5}
										className='px-4 py-12 text-center text-white/30'
									>
										<UserX className='w-8 h-8 mx-auto mb-2 text-white/20' />
										<p>No users found</p>
									</td>
								</tr>
							:	users.map((user) => (
									<tr
										key={user.id}
										onClick={() => setSelectedUser(user)}
										className='border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition'
									>
										<td className='px-4 py-3'>
											<div className='flex items-center gap-3'>
												{user.displayPicture ?
													<img
														src={
															user.displayPicture
														}
														alt=''
														className='w-8 h-8 rounded-full object-cover'
													/>
												:	<div className='w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/50'>
														{(
															user
																.firstName?.[0] ||
															user.email?.[0] ||
															'?'
														).toUpperCase()}
													</div>
												}
												<div>
													<p className='text-sm font-medium'>
														{(
															user.firstName ||
															user.lastName
														) ?
															`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
														:	user.username ||
															'Unnamed'
														}
													</p>
													{user.phone && (
														<p className='text-xs text-white/30'>
															{user.phone}
														</p>
													)}
												</div>
											</div>
										</td>
										<td className='px-4 py-3'>
											<div className='flex items-center gap-2 text-sm text-white/60'>
												<Mail className='w-3.5 h-3.5 text-white/30' />
												{user.email}
											</div>
										</td>
										<td className='px-4 py-3'>
											<Badge
												variant='outline'
												className={`text-xs ${USER_TYPE_COLORS[user.userType || 'USER'] || USER_TYPE_COLORS.USER}`}
											>
												{(
													user.userType || 'USER'
												).replace('_', ' ')}
											</Badge>
										</td>
										<td className='px-4 py-3 text-sm text-white/50'>
											{formatDate(user.createdAt)}
										</td>
										<td className='px-4 py-3'>
											{user.deletedAt ?
												<Badge
													variant='outline'
													className='text-xs bg-red-500/15 text-red-300 border-red-500/30'
												>
													Deleted
												</Badge>
											:	<Badge
													variant='outline'
													className='text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
												>
													Active
												</Badge>
											}
										</td>
									</tr>
								))
							}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			<div className='flex items-center justify-between mt-4'>
				<p className='text-sm text-white/40'>
					Page {page + 1}
					{users.length > 0 && ` · ${users.length} results`}
				</p>
				<div className='flex gap-2'>
					<button
						onClick={() => setPage((p) => Math.max(0, p - 1))}
						disabled={page === 0}
						className='flex items-center gap-1 px-3 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition'
					>
						<ChevronLeft className='w-4 h-4' />
						Previous
					</button>
					<button
						onClick={() => setPage((p) => p + 1)}
						disabled={!hasMore}
						className='flex items-center gap-1 px-3 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition'
					>
						Next
						<ChevronRight className='w-4 h-4' />
					</button>
				</div>
			</div>

			{/* User Detail Modal */}
			{selectedUser && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
					onClick={() => setSelectedUser(null)}
				>
					<div
						className='bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4'
						onClick={(e) => e.stopPropagation()}
					>
						<div className='flex items-center gap-4 mb-6'>
							{selectedUser.displayPicture ?
								<img
									src={selectedUser.displayPicture}
									alt=''
									className='w-14 h-14 rounded-full object-cover'
								/>
							:	<div className='w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-lg font-semibold text-white/50'>
									{(
										selectedUser.firstName?.[0] ||
										selectedUser.email?.[0] ||
										'?'
									).toUpperCase()}
								</div>
							}
							<div>
								<p className='text-lg font-semibold'>
									{(
										selectedUser.firstName ||
										selectedUser.lastName
									) ?
										`${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''}`.trim()
									:	'Unnamed User'}
								</p>
								<p className='text-sm text-white/50'>
									{selectedUser.email}
								</p>
							</div>
						</div>

						<div className='space-y-3 mb-6'>
							<DetailRow
								label='ID'
								value={selectedUser.id}
							/>
							<DetailRow
								label='Phone'
								value={selectedUser.phone}
							/>
							<DetailRow
								label='Username'
								value={selectedUser.username}
							/>
							<DetailRow
								label='Type'
								value={selectedUser.userType}
							/>
							<DetailRow
								label='Business'
								value={selectedUser.businessName}
							/>
							<DetailRow
								label='Joined'
								value={formatDate(selectedUser.createdAt)}
							/>
							<DetailRow
								label='Status'
								value={
									selectedUser.deletedAt ? 'Deleted' : (
										'Active'
									)
								}
							/>
						</div>

						<button
							onClick={() => setSelectedUser(null)}
							className='w-full py-2.5 text-sm border border-white/10 rounded-xl hover:bg-white/5 transition'
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className='flex items-center justify-between py-2 border-b border-white/5'>
			<span className='text-sm text-white/40'>{label}</span>
			<span className='text-sm text-white/80 text-right max-w-[60%] truncate'>
				{value || '—'}
			</span>
		</div>
	);
}
