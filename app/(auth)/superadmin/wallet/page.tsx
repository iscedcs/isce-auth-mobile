'use client';

import { useEffect, useState, useCallback } from 'react';
import {
	Wallet,
	CheckCircle2,
	XCircle,
	Clock,
	Loader2,
	X,
	Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { csrfFetch } from '@/lib/csrf-client';

interface Merchant {
	id: string;
	businessName: string;
	businessAddress?: string | null;
}

interface Terminal {
	id: string;
	terminalId: string;
	status: string;
}

interface PosAgentApplication {
	id: string;
	merchantId: string;
	status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
	contactName: string;
	contactTitle?: string | null;
	contactPhone: string;
	contactEmail: string;
	bvnLastFour?: string | null;
	tin?: string | null;
	settlementBankCode?: string | null;
	settlementAccountNumber?: string | null;
	settlementAccountName?: string | null;
	acquirerMerchantId?: string | null;
	acquirerName?: string | null;
	reviewedBy?: string | null;
	reviewedAt?: string | null;
	rejectionReason?: string | null;
	createdAt: string;
	merchant?: Merchant;
	terminals?: Terminal[];
}

const STATUS_TABS = [
	{ value: '', label: 'All' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'APPROVED', label: 'Approved' },
	{ value: 'REJECTED', label: 'Rejected' },
] as const;

const STATUS_COLORS: Record<string, string> = {
	PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
	APPROVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
	REJECTED: 'bg-red-500/15 text-red-300 border-red-500/30',
	SUSPENDED: 'bg-white/10 text-white/60 border-white/20',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
	PENDING: Clock,
	APPROVED: CheckCircle2,
	REJECTED: XCircle,
	SUSPENDED: XCircle,
};

export default function SuperAdminWalletPage() {
	const [applications, setApplications] = useState<PosAgentApplication[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState('');

	const [rejectTarget, setRejectTarget] = useState<PosAgentApplication | null>(null);
	const [rejectReason, setRejectReason] = useState('');
	const [actioning, setActioning] = useState(false);
	const [actionError, setActionError] = useState('');

	const fetchApplications = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			const res = await fetch(`/api/admin/wallet/pos-agents?${params.toString()}`);
			const data = await res.json();
			const list: PosAgentApplication[] = Array.isArray(data?.data?.posAgents)
				? data.data.posAgents
				: [];
			setApplications(list);
		} catch (err) {
			console.error('Failed to fetch POS agent applications:', err);
			setApplications([]);
		} finally {
			setLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		fetchApplications();
	}, [fetchApplications]);

	const formatDate = (dateStr?: string | null) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const handleApprove = async (app: PosAgentApplication) => {
		setActioning(true);
		setActionError('');
		try {
			const res = await csrfFetch(`/api/admin/wallet/pos-agents/${app.id}/approve`, {
				method: 'PATCH',
			});
			const data = await res.json();
			if (res.ok && data.success) {
				fetchApplications();
			} else {
				setActionError(data.message || data.error || 'Failed to approve application');
			}
		} catch (err) {
			console.error('Approve error:', err);
			setActionError('Network error — please try again');
		} finally {
			setActioning(false);
		}
	};

	const handleReject = async () => {
		if (!rejectTarget || !rejectReason.trim()) return;
		setActioning(true);
		setActionError('');
		try {
			const res = await csrfFetch(`/api/admin/wallet/pos-agents/${rejectTarget.id}/reject`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason: rejectReason.trim() }),
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setRejectTarget(null);
				setRejectReason('');
				fetchApplications();
			} else {
				setActionError(data.message || data.error || 'Failed to reject application');
			}
		} catch (err) {
			console.error('Reject error:', err);
			setActionError('Network error — please try again');
		} finally {
			setActioning(false);
		}
	};

	return (
		<div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
			<div className="mb-6 sm:mb-8">
				<h1 className="text-xl sm:text-2xl font-bold mb-1">Fiscus — POS Agent Applications</h1>
				<p className="text-white/50 text-sm">
					Review and decide POS/SoftPOS acquiring applications submitted through the wallet
				</p>
			</div>

			{/* Status tabs */}
			<div className="flex flex-wrap gap-2 mb-6">
				{STATUS_TABS.map((tab) => (
					<button
						key={tab.value}
						onClick={() => setStatusFilter(tab.value)}
						className={`px-4 py-2 text-sm rounded-xl border transition ${
							statusFilter === tab.value
								? 'bg-white/10 border-white/20 text-white font-medium'
								: 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white hover:bg-white/5'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{actionError && (
				<div className="mb-4 px-4 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-sm text-red-300">
					{actionError}
				</div>
			)}

			{/* Applications list */}
			<div className="space-y-3">
				{loading ? (
					Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="border border-white/10 rounded-xl p-5 bg-white/[0.02] h-28 animate-pulse"
						/>
					))
				) : applications.length === 0 ? (
					<div className="border border-white/10 rounded-xl p-12 text-center text-white/30">
						<Wallet className="w-8 h-8 mx-auto mb-2 text-white/20" />
						<p>No applications found</p>
					</div>
				) : (
					applications.map((app) => {
						const StatusIcon = STATUS_ICONS[app.status] || Clock;
						return (
							<div
								key={app.id}
								className="border border-white/10 rounded-xl p-4 sm:p-5 bg-white/[0.02]"
							>
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
									<div className="flex items-start gap-3 min-w-0">
										<div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
											<Building2 className="w-4 h-4 text-white/40" />
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<p className="font-medium text-sm sm:text-base truncate">
													{app.merchant?.businessName || 'Unnamed business'}
												</p>
												<Badge
													variant="outline"
													className={`text-xs shrink-0 ${STATUS_COLORS[app.status] || ''}`}
												>
													<StatusIcon className="w-3 h-3 mr-1" />
													{app.status}
												</Badge>
											</div>
											<p className="text-xs text-white/40 mt-0.5">
												{app.contactName}
												{app.contactTitle ? ` · ${app.contactTitle}` : ''} ·{' '}
												{app.contactPhone} · {app.contactEmail}
											</p>
											<p className="text-xs text-white/30 mt-1">
												BVN ending {app.bvnLastFour || '****'} · Settlement{' '}
												{app.settlementBankCode || '—'} ····
												{app.settlementAccountNumber?.slice(-4) || '····'} (
												{app.settlementAccountName || 'unnamed'}) · Applied{' '}
												{formatDate(app.createdAt)}
											</p>
											{app.status === 'REJECTED' && app.rejectionReason && (
												<p className="text-xs text-red-300/70 mt-1">
													Reason: {app.rejectionReason}
												</p>
											)}
											{app.status === 'APPROVED' && (
												<p className="text-xs text-emerald-300/70 mt-1">
													{app.terminals?.length
														? `${app.terminals.length} terminal(s) assigned`
														: 'No terminal assigned yet'}
												</p>
											)}
										</div>
									</div>

									{app.status === 'PENDING' && (
										<div className="flex gap-2 shrink-0">
											<button
												onClick={() => handleApprove(app)}
												disabled={actioning}
												className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition disabled:opacity-50"
											>
												<CheckCircle2 className="w-3.5 h-3.5" />
												Approve
											</button>
											<button
												onClick={() => {
													setRejectTarget(app);
													setRejectReason('');
													setActionError('');
												}}
												disabled={actioning}
												className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
											>
												<XCircle className="w-3.5 h-3.5" />
												Reject
											</button>
										</div>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Reject modal */}
			{rejectTarget && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
					onClick={() => !actioning && setRejectTarget(null)}
				>
					<div
						className="bg-zinc-900 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="font-semibold text-base sm:text-lg">Reject application</h3>
								<p className="text-xs text-white/40 mt-0.5">
									{rejectTarget.merchant?.businessName || 'Unnamed business'}
								</p>
							</div>
							<button
								title="Close"
								onClick={() => setRejectTarget(null)}
								className="text-white/30 hover:text-white/60 transition"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<label className="block text-sm font-medium text-white/60 mb-2">
							Reason (sent to the applicant)
						</label>
						<textarea
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
							placeholder="e.g. Settlement account name doesn't match BVN records"
							className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition resize-none"
						/>

						{actionError && (
							<div className="mt-3 px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-sm text-red-300">
								{actionError}
							</div>
						)}

						<div className="flex gap-3 mt-5">
							<button
								onClick={() => setRejectTarget(null)}
								disabled={actioning}
								className="flex-1 px-4 py-2.5 text-sm border border-white/10 rounded-xl hover:bg-white/5 transition disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleReject}
								disabled={!rejectReason.trim() || actioning}
								className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition flex items-center justify-center gap-2"
							>
								{actioning && <Loader2 className="w-4 h-4 animate-spin" />}
								{actioning ? 'Rejecting…' : 'Reject application'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
