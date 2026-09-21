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
	CreditCard,
	Plus,
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
	type?: string;
	terminalModel?: string | null;
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

	// Drill-down detail modal
	const [detailApp, setDetailApp] = useState<PosAgentApplication | null>(null);
	const [unassignedTerminals, setUnassignedTerminals] = useState<Terminal[]>([]);
	const [loadingTerminals, setLoadingTerminals] = useState(false);
	const [selectedTerminalId, setSelectedTerminalId] = useState('');
	const [assigningTerminal, setAssigningTerminal] = useState(false);
	const [unassigningTerminalId, setUnassigningTerminalId] = useState<string | null>(null);
	const [terminalError, setTerminalError] = useState('');

	// Create custom terminal (inline, inside the detail modal)
	const [showCreateTerminal, setShowCreateTerminal] = useState(false);
	const [newTerminalId, setNewTerminalId] = useState('');
	const [newTerminalType, setNewTerminalType] = useState<'PHYSICAL' | 'SOFTPOS'>('SOFTPOS');
	const [newTerminalSerial, setNewTerminalSerial] = useState('');
	const [creatingTerminal, setCreatingTerminal] = useState(false);

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
				if (detailApp?.id === app.id && data.data?.posAgent) {
					setDetailApp(data.data.posAgent);
				}
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

	const fetchUnassignedTerminals = useCallback(async () => {
		setLoadingTerminals(true);
		try {
			const res = await fetch('/api/admin/wallet/pos-terminals?status=UNASSIGNED');
			const data = await res.json();
			const list: Terminal[] = Array.isArray(data?.data?.terminals) ? data.data.terminals : [];
			setUnassignedTerminals(list);
		} catch (err) {
			console.error('Failed to fetch terminals:', err);
			setUnassignedTerminals([]);
		} finally {
			setLoadingTerminals(false);
		}
	}, []);

	const openDetail = (app: PosAgentApplication) => {
		setDetailApp(app);
		setSelectedTerminalId('');
		setTerminalError('');
		setShowCreateTerminal(false);
		if (app.status === 'APPROVED') {
			fetchUnassignedTerminals();
		}
	};

	const refreshDetailApp = async (id: string) => {
		try {
			const res = await fetch(`/api/admin/wallet/pos-agents/${id}`);
			const data = await res.json();
			if (data?.data?.posAgent) setDetailApp(data.data.posAgent);
		} catch {
			// non-critical — the modal keeps its last-known state
		}
	};

	const handleAssignTerminal = async () => {
		if (!detailApp || !selectedTerminalId) return;
		setAssigningTerminal(true);
		setTerminalError('');
		try {
			const res = await csrfFetch(`/api/admin/wallet/pos-agents/${detailApp.id}/assign-terminal`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ terminalId: selectedTerminalId }),
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setSelectedTerminalId('');
				await Promise.all([
					refreshDetailApp(detailApp.id),
					fetchUnassignedTerminals(),
					fetchApplications(),
				]);
			} else {
				setTerminalError(data.message || data.error || 'Failed to assign terminal');
			}
		} catch (err) {
			console.error('Assign terminal error:', err);
			setTerminalError('Network error — please try again');
		} finally {
			setAssigningTerminal(false);
		}
	};

	const handleUnassignTerminal = async (terminal: Terminal) => {
		if (!detailApp) return;
		setUnassigningTerminalId(terminal.id);
		setTerminalError('');
		try {
			const res = await csrfFetch(`/api/admin/wallet/pos-terminals/${terminal.id}/unassign`, {
				method: 'PATCH',
			});
			const data = await res.json();
			if (res.ok && data.success) {
				await Promise.all([
					refreshDetailApp(detailApp.id),
					fetchUnassignedTerminals(),
					fetchApplications(),
				]);
			} else {
				setTerminalError(data.message || data.error || 'Failed to unassign terminal');
			}
		} catch (err) {
			console.error('Unassign terminal error:', err);
			setTerminalError('Network error — please try again');
		} finally {
			setUnassigningTerminalId(null);
		}
	};

	const handleCreateTerminal = async () => {
		if (!newTerminalId.trim()) return;
		setCreatingTerminal(true);
		setTerminalError('');
		try {
			const res = await csrfFetch('/api/admin/wallet/pos-terminals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					terminalId: newTerminalId.trim(),
					type: newTerminalType,
					...(newTerminalSerial.trim() ? { terminalSerialNumber: newTerminalSerial.trim() } : {}),
				}),
			});
			const data = await res.json();
			if (res.ok && data.success) {
				const created: Terminal | undefined = data.data?.terminal;
				setNewTerminalId('');
				setNewTerminalSerial('');
				setShowCreateTerminal(false);
				await fetchUnassignedTerminals();
				if (created) setSelectedTerminalId(created.id);
			} else {
				setTerminalError(data.message || data.error || 'Failed to create terminal');
			}
		} catch (err) {
			console.error('Create terminal error:', err);
			setTerminalError('Network error — please try again');
		} finally {
			setCreatingTerminal(false);
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
							<button
								key={app.id}
								onClick={() => openDetail(app)}
								className="w-full text-left border border-white/10 rounded-xl p-4 sm:p-5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition cursor-pointer"
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
														: 'No terminal assigned yet — click to assign'}
												</p>
											)}
										</div>
									</div>

									{app.status === 'PENDING' && (
										<div className="flex gap-2 shrink-0">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleApprove(app);
												}}
												disabled={actioning}
												className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition disabled:opacity-50"
											>
												<CheckCircle2 className="w-3.5 h-3.5" />
												Approve
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
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
							</button>
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

			{/* Drill-down detail modal */}
			{detailApp && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
					onClick={() => setDetailApp(null)}
				>
					<div
						className="bg-zinc-900 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-start justify-between mb-5">
							<div className="min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="font-semibold text-base sm:text-lg truncate">
										{detailApp.merchant?.businessName || 'Unnamed business'}
									</h3>
									<Badge
										variant="outline"
										className={`text-xs shrink-0 ${STATUS_COLORS[detailApp.status] || ''}`}
									>
										{detailApp.status}
									</Badge>
								</div>
								{detailApp.merchant?.businessAddress && (
									<p className="text-xs text-white/40 mt-1">
										{detailApp.merchant.businessAddress}
									</p>
								)}
							</div>
							<button
								title="Close"
								onClick={() => setDetailApp(null)}
								className="text-white/30 hover:text-white/60 transition shrink-0"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Contact */}
						<div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-2 text-sm">
							<div className="flex justify-between gap-3">
								<span className="text-white/40">Contact</span>
								<span className="text-right">
									{detailApp.contactName}
									{detailApp.contactTitle ? ` (${detailApp.contactTitle})` : ''}
								</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-white/40">Phone</span>
								<span>{detailApp.contactPhone}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-white/40">Email</span>
								<span className="truncate">{detailApp.contactEmail}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-white/40">BVN</span>
								<span>ending {detailApp.bvnLastFour || '****'}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-white/40">Settlement</span>
								<span className="text-right">
									{detailApp.settlementBankCode || '—'} ····
									{detailApp.settlementAccountNumber?.slice(-4) || '····'}
									<br />
									<span className="text-white/40">
										{detailApp.settlementAccountName || 'unnamed'}
									</span>
								</span>
							</div>
							{detailApp.acquirerMerchantId && (
								<div className="flex justify-between gap-3">
									<span className="text-white/40">Acquirer merchant ID</span>
									<span>
										{detailApp.acquirerMerchantId} ({detailApp.acquirerName})
									</span>
								</div>
							)}
							{detailApp.reviewedBy && (
								<div className="flex justify-between gap-3">
									<span className="text-white/40">Reviewed by</span>
									<span className="text-right">
										{detailApp.reviewedBy}
										<br />
										<span className="text-white/40">{formatDate(detailApp.reviewedAt)}</span>
									</span>
								</div>
							)}
							{detailApp.status === 'REJECTED' && detailApp.rejectionReason && (
								<div className="pt-2 border-t border-white/10">
									<span className="text-red-300/80">Reason: {detailApp.rejectionReason}</span>
								</div>
							)}
						</div>

						{/* Assigned terminals */}
						<div className="mb-4">
							<h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
								Assigned terminals
							</h4>
							{detailApp.terminals?.length ? (
								<div className="space-y-2">
									{detailApp.terminals.map((t) => (
										<div
											key={t.id}
											className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm gap-2"
										>
											<span className="flex items-center gap-2 min-w-0">
												<CreditCard className="w-3.5 h-3.5 text-white/40 shrink-0" />
												<code className="text-white/80">{t.terminalId}</code>
												{t.terminalModel && (
													<span className="text-white/30 text-xs">{t.terminalModel}</span>
												)}
											</span>
											<span className="flex items-center gap-2 shrink-0">
												<Badge variant="outline" className="text-xs">
													{t.status}
												</Badge>
												<button
													onClick={() => handleUnassignTerminal(t)}
													disabled={unassigningTerminalId === t.id}
													className="text-xs text-red-300/80 hover:text-red-300 transition disabled:opacity-50 flex items-center gap-1"
												>
													{unassigningTerminalId === t.id && (
														<Loader2 className="w-3 h-3 animate-spin" />
													)}
													Unassign
												</button>
											</span>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-white/30">No terminal assigned yet</p>
							)}
						</div>

						{/* Assign a terminal (approved applications only) */}
						{detailApp.status === 'APPROVED' && (
							<div className="border-t border-white/10 pt-4">
								<h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
									Assign a terminal
								</h4>

								{terminalError && (
									<div className="mb-3 px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-sm text-red-300">
										{terminalError}
									</div>
								)}

								{loadingTerminals ? (
									<div className="flex items-center gap-2 text-sm text-white/40 py-2">
										<Loader2 className="w-4 h-4 animate-spin" />
										Loading available terminals…
									</div>
								) : (
									<>
										<div className="flex gap-2">
											<div className="relative flex-1">
												<select
													title="Select an unassigned terminal"
													value={selectedTerminalId}
													onChange={(e) => setSelectedTerminalId(e.target.value)}
													className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 focus:outline-none focus:border-white/30 transition cursor-pointer"
												>
													<option value="" className="bg-zinc-900">
														{unassignedTerminals.length
															? 'Select a terminal…'
															: 'No unassigned terminals'}
													</option>
													{unassignedTerminals.map((t) => (
														<option key={t.id} value={t.id} className="bg-zinc-900">
															{t.terminalId} ({t.type}
															{t.terminalModel ? ` · ${t.terminalModel}` : ''})
														</option>
													))}
												</select>
											</div>
											<button
												onClick={handleAssignTerminal}
												disabled={!selectedTerminalId || assigningTerminal}
												className="px-4 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition flex items-center gap-2 shrink-0"
											>
												{assigningTerminal && <Loader2 className="w-4 h-4 animate-spin" />}
												Assign
											</button>
										</div>

										{!showCreateTerminal ? (
											<button
												onClick={() => setShowCreateTerminal(true)}
												className="mt-3 flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition"
											>
												<Plus className="w-3.5 h-3.5" />
												Create a custom/test terminal
											</button>
										) : (
											<div className="mt-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-2.5">
												<div className="flex items-center justify-between">
													<span className="text-xs font-medium text-white/50">
														New terminal
													</span>
													<button
														title="Cancel"
														onClick={() => setShowCreateTerminal(false)}
														className="text-white/30 hover:text-white/60 transition"
													>
														<X className="w-4 h-4" />
													</button>
												</div>
												<input
													type="text"
													value={newTerminalId}
													onChange={(e) => setNewTerminalId(e.target.value)}
													placeholder="Terminal ID (TID) — e.g. TEST00001"
													className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
												/>
												<div className="flex gap-2">
													<select
														title="Terminal type"
														value={newTerminalType}
														onChange={(e) =>
															setNewTerminalType(e.target.value as 'PHYSICAL' | 'SOFTPOS')
														}
														className="flex-1 appearance-none bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-white/30 transition cursor-pointer"
													>
														<option value="SOFTPOS" className="bg-zinc-900">
															SOFTPOS (tap-on-phone)
														</option>
														<option value="PHYSICAL" className="bg-zinc-900">
															PHYSICAL (dedicated hardware)
														</option>
													</select>
												</div>
												<input
													type="text"
													value={newTerminalSerial}
													onChange={(e) => setNewTerminalSerial(e.target.value)}
													placeholder="Device serial number (optional)"
													className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
												/>
												<button
													onClick={handleCreateTerminal}
													disabled={!newTerminalId.trim() || creatingTerminal}
													className="w-full px-3 py-2 text-sm bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center justify-center gap-2"
												>
													{creatingTerminal && <Loader2 className="w-4 h-4 animate-spin" />}
													{creatingTerminal ? 'Creating…' : 'Create terminal'}
												</button>
											</div>
										)}
									</>
								)}
							</div>
						)}

						{detailApp.status === 'PENDING' && (
							<div className="flex gap-3 pt-4 border-t border-white/10">
								<button
									onClick={() => handleApprove(detailApp)}
									disabled={actioning}
									className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition disabled:opacity-50"
								>
									<CheckCircle2 className="w-4 h-4" />
									Approve
								</button>
								<button
									onClick={() => {
										setRejectTarget(detailApp);
										setRejectReason('');
										setActionError('');
										setDetailApp(null);
									}}
									disabled={actioning}
									className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition disabled:opacity-50"
								>
									<XCircle className="w-4 h-4" />
									Reject
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
