'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    ArrowRightLeft,
    X,
    Loader2,
    User as UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import { csrfFetch } from '@/lib/csrf-client';
import { Badge } from '@/components/ui/badge';

interface UserRecord {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	displayPicture?: string;
	username?: string;
}

interface DeviceRecord {
	id: string;
	productId: string;
	type: string;
	isPrimary: boolean;
	assignedAt?: string;
	createdAt?: string;
	userId: string;
	user?: UserRecord;
}

const DEVICE_TYPE_LABELS: Record<string, string> = {
	'6214bdef7dbcb': 'Card',
	'6214bdef6dbcb': 'Wristband',
	'6214bdef5dbcb': 'Sticker',
	CARD: 'Card',
	WRISTBAND: 'Wristband',
	STICKER: 'Sticker',
};

const DEVICE_TYPE_COLORS: Record<string, string> = {
	Card: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
	Wristband: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
	Sticker: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const PAGE_SIZE = 20;

export default function SuperAdminDevicesPage() {
	const [devices, setDevices] = useState<DeviceRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	// Reassign modal state
	const [reassignDevice, setReassignDevice] = useState<DeviceRecord | null>(
		null,
	);
	const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
	const [reassigning, setReassigning] = useState(false);
	const [reassignError, setReassignError] = useState('');
	const [reassignSuccess, setReassignSuccess] = useState('');

	// User search state
	const [userSearchQuery, setUserSearchQuery] = useState('');
	const [userSearchResults, setUserSearchResults] = useState<UserRecord[]>([]);
	const [userSearchLoading, setUserSearchLoading] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const fetchDevices = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('limit', String(PAGE_SIZE));
			params.set('offset', String(page * PAGE_SIZE));
			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}

			const res = await fetch(
				`/api/admin/devices?${params.toString()}`,
			);
			const data = await res.json();

			const deviceList =
				Array.isArray(data?.data) ? data.data
				: Array.isArray(data) ? data
				: [];
			setDevices(deviceList);
			setHasMore(deviceList.length === PAGE_SIZE);
		} catch (err) {
			console.error('Failed to fetch devices:', err);
			setDevices([]);
		} finally {
			setLoading(false);
		}
	}, [searchQuery, page]);

	useEffect(() => {
		fetchDevices();
	}, [fetchDevices]);

	useEffect(() => {
		setPage(0);
	}, [searchQuery]);

	// Debounced user search for reassign modal
	const searchUsers = useCallback(async (query: string) => {
		if (!query.trim() || query.trim().length < 2) {
			setUserSearchResults([]);
			setShowUserDropdown(false);
			return;
		}

		setUserSearchLoading(true);
		try {
			const params = new URLSearchParams();
			if (query.includes('@')) {
				params.set('email', query.trim());
			} else {
				params.set('fullname', query.trim());
			}
			params.set('limit', '8');

			const res = await fetch(
				`/api/admin/users/search?${params.toString()}`,
			);
			const data = await res.json();

			const users: UserRecord[] =
				Array.isArray(data?.data) ? data.data
				: Array.isArray(data) ? data
				: [];
			setUserSearchResults(users);
			setShowUserDropdown(users.length > 0);
		} catch (err) {
			console.error('User search failed:', err);
			setUserSearchResults([]);
		} finally {
			setUserSearchLoading(false);
		}
	}, []);

	const handleUserSearchChange = (value: string) => {
		setUserSearchQuery(value);
		setSelectedUser(null);

		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
		searchTimeoutRef.current = setTimeout(() => searchUsers(value), 300);
	};

	const selectUser = (user: UserRecord) => {
		setSelectedUser(user);
		setUserSearchQuery(
			[user.firstName, user.lastName].filter(Boolean).join(' ') ||
				user.email,
		);
		setShowUserDropdown(false);
		setUserSearchResults([]);
	};

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const getDeviceTypeLabel = (type: string) => {
		return DEVICE_TYPE_LABELS[type] || type;
	};

	const handleReassign = async () => {
		if (!reassignDevice || !selectedUser) return;

		setReassigning(true);
		setReassignError('');
		setReassignSuccess('');

		try {
			const res = await csrfFetch('/api/admin/devices/reassign', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productId: reassignDevice.productId,
					newUserId: selectedUser.id,
				}),
			});

			const data = await res.json();

			if (res.ok && data.success) {
				setReassignSuccess(
					data.message || 'Device reassigned successfully',
				);
				setTimeout(() => {
					setReassignDevice(null);
					setSelectedUser(null);
					setUserSearchQuery('');
					setReassignSuccess('');
					fetchDevices();
				}, 1500);
			} else {
				setReassignError(
					data.message || data.error || 'Failed to reassign device',
				);
			}
		} catch (err) {
			console.error('Reassign error:', err);
			setReassignError('Network error — please try again');
		} finally {
			setReassigning(false);
		}
	};

	return (
		<div className='p-8 max-w-6xl'>
			<div className='mb-8'>
				<h1 className='text-2xl font-bold mb-1'>Device Management</h1>
				<p className='text-white/50 text-sm'>
					View and manage NFC cards, wristbands, and stickers across
					all users
				</p>
			</div>

			{/* Search */}
			<div className='flex flex-col sm:flex-row gap-3 mb-6'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
					<input
						type='text'
						placeholder='Search by product ID or user email…'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition'
					/>
				</div>
			</div>

			{/* Devices Table */}
			<div className='border border-white/10 rounded-xl overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-white/10 bg-white/[0.02]'>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Product ID
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Type
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Owner
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Primary
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Assigned
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Actions
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
										{Array.from({ length: 6 }).map(
											(_, j) => (
												<td key={j} className='px-4 py-3'>
													<div className='h-5 w-24 bg-white/10 rounded animate-pulse' />
												</td>
											),
										)}
									</tr>
								))
							: devices.length === 0 ?
								<tr>
									<td
										colSpan={6}
										className='px-4 py-12 text-center text-white/30'
									>
										<CreditCard className='w-8 h-8 mx-auto mb-2 text-white/20' />
										<p>No devices found</p>
									</td>
								</tr>
							:	devices.map((device) => {
									const typeLabel = getDeviceTypeLabel(
										device.type,
									);
									return (
										<tr
											key={device.id}
											className='border-b border-white/5 hover:bg-white/[0.03] transition'
										>
											<td className='px-4 py-3'>
												<code className='text-xs text-white/70 bg-white/5 px-2 py-1 rounded'>
													{device.productId.length >
													20
														? `${device.productId.slice(0, 10)}…${device.productId.slice(-8)}`
														: device.productId}
												</code>
											</td>
											<td className='px-4 py-3'>
												<Badge
													variant='outline'
													className={`text-xs ${DEVICE_TYPE_COLORS[typeLabel] || 'bg-white/10 text-white/70 border-white/20'}`}
												>
													{typeLabel}
												</Badge>
											</td>
											<td className='px-4 py-3'>
												{device.user ? (
													<div className='flex items-center gap-2.5'>
														{device.user.displayPicture ? (
															<Image
																src={device.user.displayPicture}
																alt=''
																width={32}
																height={32}
																className='w-8 h-8 rounded-full object-cover shrink-0'
															/>
														) : (
															<div className='w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0'>
																<UserIcon className='w-4 h-4 text-white/30' />
															</div>
														)}
														<div>
															<p className='text-sm'>
																{device.user
																	.firstName ||
																device.user
																	.lastName
																	? `${device.user.firstName ?? ''} ${device.user.lastName ?? ''}`.trim()
																	: 'Unnamed'}
															</p>
															<p className='text-xs text-white/40'>
																{device.user.email}
															</p>
														</div>
													</div>
												) : (
													<span className='text-sm text-white/40'>
														{device.userId.slice(
															0,
															8,
														)}
														…
													</span>
												)}
											</td>
											<td className='px-4 py-3'>
												{device.isPrimary ? (
													<Badge
														variant='outline'
														className='text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
													>
														Primary
													</Badge>
												) : (
													<span className='text-xs text-white/30'>
														—
													</span>
												)}
											</td>
											<td className='px-4 py-3 text-sm text-white/50'>
												{formatDate(
													device.assignedAt ||
														device.createdAt,
												)}
											</td>
											<td className='px-4 py-3'>
												<button
													onClick={() => {
														setReassignDevice(
															device,
														);
														setSelectedUser(null);
														setUserSearchQuery('');
														setUserSearchResults([]);
														setReassignError('');
														setReassignSuccess('');
														setReassignSuccess('');
													}}
													className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition'
												>
													<ArrowRightLeft className='w-3.5 h-3.5' />
													Reassign
												</button>
											</td>
										</tr>
									);
								})
							}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			<div className='flex items-center justify-between mt-4'>
				<p className='text-sm text-white/40'>
					Page {page + 1}
					{devices.length > 0 && ` · ${devices.length} results`}
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

			{/* Reassign Modal */}
			{reassignDevice && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
					onClick={() => setReassignDevice(null)}
				>
					<div
						className='bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4'
						onClick={(e) => e.stopPropagation()}
					>
						<div className='flex items-center justify-between mb-6'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center'>
									<ArrowRightLeft className='w-5 h-5 text-blue-400' />
								</div>
								<div>
									<h3 className='font-semibold text-lg'>
										Reassign Device
									</h3>
									<p className='text-xs text-white/40'>
										Transfer to a different user
									</p>
								</div>
							</div>
                            <button
                                title='close'
								onClick={() => setReassignDevice(null)}
								className='text-white/30 hover:text-white/60 transition'
							>
								<X className='w-5 h-5' />
							</button>
						</div>

						{/* Device info */}
						<div className='bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-2'>
							<div className='flex justify-between text-sm'>
								<span className='text-white/40'>
									Product ID
								</span>
								<code className='text-xs text-white/70'>
									{reassignDevice.productId}
								</code>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-white/40'>Type</span>
								<span>
									{getDeviceTypeLabel(reassignDevice.type)}
								</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-white/40'>
									Current Owner
								</span>
								<span>
									{reassignDevice.user
										? reassignDevice.user.email
										: reassignDevice.userId.slice(0, 12) +
											'…'}
								</span>
							</div>
						</div>

						{/* User search */}
						<div className='mb-4'>
							<label className='block text-sm font-medium text-white/60 mb-2'>
								New Owner
							</label>
							<div className='relative' ref={dropdownRef}>
								<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
								<input
									type='text'
									placeholder='Search by name or email…'
									value={userSearchQuery}
									onChange={(e) =>
										handleUserSearchChange(e.target.value)
									}
									onFocus={() => {
										if (userSearchResults.length > 0)
											setShowUserDropdown(true);
									}}
									className='w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition'
								/>
								{userSearchLoading && (
									<Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin' />
								)}

								{/* Dropdown results */}
								{showUserDropdown && (
									<div className='absolute z-10 mt-1 w-full max-h-52 overflow-y-auto bg-zinc-800 border border-white/10 rounded-xl shadow-xl'>
										{userSearchResults.map((user) => (
											<button
												key={user.id}
												type='button'
												onClick={() => selectUser(user)}
												className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-left'
											>
												{user.displayPicture ? (
													<Image
														src={
															user.displayPicture
														}
														alt=''
														width={36}
														height={36}
														className='w-9 h-9 rounded-full object-cover shrink-0'
													/>
												) : (
													<div className='w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0'>
														<UserIcon className='w-4 h-4 text-white/30' />
													</div>
												)}
												<div className='min-w-0 flex-1'>
													<p className='text-sm font-medium truncate'>
														{user.firstName ||
														user.lastName
															? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
															: 'Unnamed'}
													</p>
													<p className='text-xs text-white/40 truncate'>
														{user.email}
													</p>
												</div>
											</button>
										))}
									</div>
								)}
							</div>

							{/* Selected user preview */}
							{selectedUser && (
								<div className='mt-2 flex items-center gap-2.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl'>
									{selectedUser.displayPicture ? (
										<Image
											src={selectedUser.displayPicture}
											alt=''
											width={28}
											height={28}
											className='w-7 h-7 rounded-full object-cover shrink-0'
										/>
									) : (
										<div className='w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0'>
											<UserIcon className='w-3.5 h-3.5 text-white/30' />
										</div>
									)}
									<div className='min-w-0 flex-1'>
										<p className='text-sm font-medium text-blue-200 truncate'>
											{selectedUser.firstName ||
											selectedUser.lastName
												? `${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''}`.trim()
												: 'Unnamed'}
										</p>
										<p className='text-xs text-blue-300/50 truncate'>
											{selectedUser.email}
										</p>
									</div>
                                    <button
                                        title='close'
										type='button'
										onClick={() => {
											setSelectedUser(null);
											setUserSearchQuery('');
										}}
										className='text-blue-300/50 hover:text-blue-200 transition'
									>
										<X className='w-4 h-4' />
									</button>
								</div>
							)}
						</div>

						{/* Error / Success */}
						{reassignError && (
							<div className='mb-4 px-4 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-sm text-red-300'>
								{reassignError}
							</div>
						)}
						{reassignSuccess && (
							<div className='mb-4 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-sm text-emerald-300'>
								{reassignSuccess}
							</div>
						)}

						{/* Actions */}
						<div className='flex gap-3'>
							<button
								onClick={() => setReassignDevice(null)}
								className='flex-1 px-4 py-2.5 text-sm border border-white/10 rounded-xl hover:bg-white/5 transition'
							>
								Cancel
							</button>
							<button
								onClick={handleReassign}
								disabled={
									!selectedUser || reassigning
								}
								className='flex-1 px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition flex items-center justify-center gap-2'
							>
								{reassigning && (
									<Loader2 className='w-4 h-4 animate-spin' />
								)}
								{reassigning ? 'Reassigning…' : 'Reassign'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
