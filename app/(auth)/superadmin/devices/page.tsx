'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
	Search,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	ArrowRightLeft,
	X,
	Loader2,
	User as UserIcon,
	ArrowUpDown,
	Filter,
	ChevronDown,
	QrCode,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { csrfFetch } from '@/lib/csrf-client';

interface UserRecord {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
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

const SORT_OPTIONS = [
	{ value: 'assignedAt', label: 'Assigned Date' },
	{ value: 'createdAt', label: 'Created Date' },
	{ value: 'type', label: 'Type' },
	{ value: 'productId', label: 'Product ID' },
];

const TYPE_FILTER_OPTIONS = [
	{ value: '', label: 'All Types' },
	{ value: '6214bdef7dbcb', label: 'Card' },
	{ value: '6214bdef6dbcb', label: 'Wristband' },
	{ value: '6214bdef5dbcb', label: 'Sticker' },
];

const PRIMARY_FILTER_OPTIONS = [
	{ value: '', label: 'All' },
	{ value: 'true', label: 'Primary' },
	{ value: 'false', label: 'Not Primary' },
];

export default function SuperAdminDevicesPage() {
	const [devices, setDevices] = useState<DeviceRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	// Sort & filter state
	const [sortBy, setSortBy] = useState('assignedAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [filterType, setFilterType] = useState('');
	const [filterPrimary, setFilterPrimary] = useState('');
	const [showFilters, setShowFilters] = useState(false);

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
			params.set('page', String(page));
			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}
			if (filterType) {
				params.set('type', filterType);
			}
			if (filterPrimary) {
				params.set('isPrimary', filterPrimary);
			}
			params.set('sortBy', sortBy);
			params.set('sortOrder', sortOrder);

			const res = await fetch(
				`/api/admin/devices?${params.toString()}`,
			);
			const data = await res.json();

			const deviceList =
				Array.isArray(data?.data) ? data.data
				: Array.isArray(data) ? data
				: [];
			setDevices(deviceList);
			setTotalPages(data?.meta?.totalPages ?? 1);
			setTotal(data?.meta?.total ?? deviceList.length);
		} catch (err) {
			console.error('Failed to fetch devices:', err);
			setDevices([]);
		} finally {
			setLoading(false);
		}
	}, [searchQuery, page, sortBy, sortOrder, filterType, filterPrimary]);

	useEffect(() => {
		fetchDevices();
	}, [fetchDevices]);

	// Reset to page 1 when search or filters change
	useEffect(() => {
		setPage(1);
	}, [searchQuery, filterType, filterPrimary]);

	const toggleSort = (field: string) => {
		if (sortBy === field) {
			setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortBy(field);
			setSortOrder('desc');
		}
		setPage(1);
	};

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
		<div className='p-4 sm:p-6 lg:p-8 max-w-6xl'>
			<div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold mb-1">Device Management</h1>
					<p className="text-white/50 text-sm">
						View and manage NFC cards, wristbands, and stickers across
						all users
					</p>
				</div>
				<Link
					href="/superadmin/devices/assign"
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition shrink-0"
				>
					<QrCode className="w-4 h-4" />
					Assign Device
				</Link>
			</div>

			{/* Search & Filters */}
			<div className='flex flex-col gap-3 mb-6'>
				<div className='flex flex-col sm:flex-row gap-3'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30' />
						<input
							type='text'
							placeholder='Search by product ID, user email, or name…'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition'
						/>
					</div>
					<button
						onClick={() => setShowFilters((f) => !f)}
						className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl transition ${
							showFilters || filterType || filterPrimary
								? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
								: 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
						}`}
					>
						<Filter className='w-4 h-4' />
						Filters
						{(filterType || filterPrimary) && (
							<span className='w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold'>
								{(filterType ? 1 : 0) + (filterPrimary ? 1 : 0)}
							</span>
						)}
					</button>
				</div>

				{/* Filter Row */}
				{showFilters && (
					<div className='flex flex-wrap items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl'>
						<div className='flex items-center gap-2'>
							<span className='text-xs text-white/40 uppercase tracking-wider'>Type</span>
							<div className='relative'>
								<select
								title='select'
									value={filterType}
									onChange={(e) => setFilterType(e.target.value)}
									className='appearance-none bg-white/5 border border-white/10 rounded-lg text-sm text-white pl-3 pr-8 py-1.5 focus:outline-none focus:border-white/30 transition cursor-pointer'
								>
									{TYPE_FILTER_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value} className='bg-zinc-900'>
											{opt.label}
										</option>
									))}
								</select>
								<ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none' />
							</div>
						</div>

						<div className='w-px h-6 bg-white/10' />

						<div className='flex items-center gap-2'>
							<span className='text-xs text-white/40 uppercase tracking-wider'>Primary</span>
							<div className='relative'>
								<select
								title='select primary status'
									value={filterPrimary}
									onChange={(e) => setFilterPrimary(e.target.value)}
									className='appearance-none bg-white/5 border border-white/10 rounded-lg text-sm text-white pl-3 pr-8 py-1.5 focus:outline-none focus:border-white/30 transition cursor-pointer'
								>
									{PRIMARY_FILTER_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value} className='bg-zinc-900'>
											{opt.label}
										</option>
									))}
								</select>
								<ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none' />
							</div>
						</div>

						<div className='w-px h-6 bg-white/10' />

						<div className='flex items-center gap-2'>
							<span className='text-xs text-white/40 uppercase tracking-wider'>Sort</span>
							<div className='relative'>
								<select
									title='select sort field'
									value={sortBy}
									onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
									className='appearance-none bg-white/5 border border-white/10 rounded-lg text-sm text-white pl-3 pr-8 py-1.5 focus:outline-none focus:border-white/30 transition cursor-pointer'
								>
									{SORT_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value} className='bg-zinc-900'>
											{opt.label}
										</option>
									))}
								</select>
								<ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none' />
							</div>
							<button
								onClick={() => { setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')); setPage(1); }}
								className='flex items-center gap-1 px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-white/70'
							>
								<ArrowUpDown className='w-3.5 h-3.5' />
								{sortOrder === 'asc' ? 'Asc' : 'Desc'}
							</button>
						</div>

						{(filterType || filterPrimary) && (
							<>
								<div className='w-px h-6 bg-white/10' />
								<button
									onClick={() => { setFilterType(''); setFilterPrimary(''); }}
									className='text-xs text-red-400 hover:text-red-300 transition'
								>
									Clear filters
								</button>
							</>
						)}
					</div>
				)}
			</div>

			{/* Devices Table */}
			<div className='border border-white/10 rounded-xl overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-white/10 bg-white/[0.02]'>
								<th
									onClick={() => toggleSort('productId')}
									className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider cursor-pointer hover:text-white/60 transition select-none'
								>
									<span className='inline-flex items-center gap-1'>
										Product ID
										{sortBy === 'productId' && <ArrowUpDown className='w-3 h-3 text-blue-400' />}
									</span>
								</th>
								<th
									onClick={() => toggleSort('type')}
									className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider cursor-pointer hover:text-white/60 transition select-none'
								>
									<span className='inline-flex items-center gap-1'>
										Type
										{sortBy === 'type' && <ArrowUpDown className='w-3 h-3 text-blue-400' />}
									</span>
								</th>
								<th className='text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider'>
									Owner
								</th>
								<th
									onClick={() => toggleSort('isPrimary')}
									className='hidden sm:table-cell text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider cursor-pointer hover:text-white/60 transition select-none'
								>
									<span className='inline-flex items-center gap-1'>
										Primary
										{sortBy === 'isPrimary' && <ArrowUpDown className='w-3 h-3 text-blue-400' />}
									</span>
								</th>
								<th
									onClick={() => toggleSort('assignedAt')}
									className='hidden md:table-cell text-left text-xs font-medium text-white/40 px-4 py-3 uppercase tracking-wider cursor-pointer hover:text-white/60 transition select-none'
								>
									<span className='inline-flex items-center gap-1'>
										Assigned
										{sortBy === 'assignedAt' && <ArrowUpDown className='w-3 h-3 text-blue-400' />}
									</span>
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
											<td className='hidden sm:table-cell px-4 py-3'>
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
											<td className='hidden md:table-cell px-4 py-3 text-sm text-white/50'>
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
			<div className='flex flex-col sm:flex-row items-center justify-between gap-3 mt-4'>
				<p className='text-sm text-white/40'>
					Page {page} of {totalPages}
					{total > 0 && ` · ${total} total`}
				</p>
				<div className='flex gap-2'>
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
						className='flex items-center gap-1 px-3 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition'
					>
						<ChevronLeft className='w-4 h-4' />
						<span className='hidden sm:inline'>Previous</span>
					</button>
					<button
						onClick={() => setPage((p) => p + 1)}
						disabled={page >= totalPages}
						className='flex items-center gap-1 px-3 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition'
					>
						<span className='hidden sm:inline'>Next</span>
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
						className='bg-zinc-900 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto'
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className='flex items-center justify-between mb-5 sm:mb-6'>
							<div className='flex items-center gap-2.5 sm:gap-3'>
								<div className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0'>
									<ArrowRightLeft className='w-4 h-4 sm:w-5 sm:h-5 text-blue-400' />
								</div>
								<div>
									<h3 className='font-semibold text-base sm:text-lg'>
										Reassign Device
									</h3>
									<p className='text-xs text-white/40'>
										Transfer to a different user
									</p>
								</div>
							</div>
							<button
								title='Close'
								onClick={() => setReassignDevice(null)}
								className='text-white/30 hover:text-white/60 transition'
							>
								<X className='w-5 h-5' />
							</button>
						</div>

						{/* Device info */}
						<div className='bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 mb-4 space-y-3'>
							<div>
								<span className='text-xs text-white/40 block mb-1'>
									Product ID
								</span>
								<code className='text-xs text-white/70 font-mono break-all bg-white/5 px-2 py-1 rounded-md inline-block max-w-full'>
									{reassignDevice.productId}
								</code>
							</div>
							<div className='flex items-center justify-between text-sm'>
								<span className='text-white/40'>Type</span>
								<span className='text-xs bg-white/5 border border-white/15 px-2 py-0.5 rounded-md'>
									{getDeviceTypeLabel(reassignDevice.type)}
								</span>
							</div>
							<div>
								<span className='text-xs text-white/40 block mb-1.5'>
									Current Owner
								</span>
								<div className='flex items-center gap-2'>
									{reassignDevice.user?.displayPicture ? (
										<Image
											src={
												reassignDevice.user
													.displayPicture
											}
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
										<p className='text-sm font-medium truncate'>
											{reassignDevice.user
												? `${reassignDevice.user.firstName ?? ''} ${reassignDevice.user.lastName ?? ''}`.trim() ||
													reassignDevice.user.email
												: reassignDevice.userId.slice(
														0,
														12,
													) + '…'}
										</p>
										{reassignDevice.user?.email && (
											<p className='text-xs text-white/40 truncate'>
												{reassignDevice.user.email}
											</p>
										)}
									</div>
								</div>
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
										title='Remove selection'
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
							<div className='mb-4 px-3 sm:px-4 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-sm text-red-300'>
								{reassignError}
							</div>
						)}
						{reassignSuccess && (
							<div className='mb-4 px-3 sm:px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-sm text-emerald-300'>
								{reassignSuccess}
							</div>
						)}

						{/* Actions */}
						<div className='flex gap-2.5 sm:gap-3'>
							<button
								onClick={() => setReassignDevice(null)}
								className='flex-1 px-4 py-2.5 text-sm border border-white/10 rounded-xl hover:bg-white/5 transition'
							>
								Cancel
							</button>
							<button
								onClick={handleReassign}
								disabled={!selectedUser || reassigning}
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
