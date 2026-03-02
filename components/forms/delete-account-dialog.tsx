'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Download, Loader2, AlertTriangle } from 'lucide-react';
import { csrfFetch } from '@/lib/csrf-client';
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface DeleteAccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({
	open,
	onOpenChange,
}: DeleteAccountDialogProps) {
	const router = useRouter();
	const [retrieveData, setRetrieveData] = useState(false);
	const [confirmText, setConfirmText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const canDelete = confirmText.toLowerCase() === 'delete my account';

	async function handleExportData() {
		try {
			setIsExporting(true);
			const res = await fetch('/api/account/export-data');
			if (!res.ok) {
				throw new Error('Failed to export data');
			}
			const result = await res.json();
			if (!result.success) {
				throw new Error(result.message || 'Export failed');
			}

			// Download as JSON file
			const blob = new Blob([JSON.stringify(result.data, null, 2)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `isce-account-data-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success('Your data has been downloaded');
			return true;
		} catch {
			toast.error('Failed to download your data. Please try again.');
			return false;
		} finally {
			setIsExporting(false);
		}
	}

	async function handleDelete() {
		if (!canDelete) return;

		try {
			setIsDeleting(true);

			// If the user wants their data, download it first
			if (retrieveData) {
				const exportOk = await handleExportData();
				if (!exportOk) {
					setIsDeleting(false);
					return; // Don't proceed with deletion if export failed
				}
			}

			const res = await csrfFetch('/api/account/delete', {
				method: 'PATCH',
			});

			if (!res.ok) {
				const data = await res.json().catch(() => null);
				throw new Error(
					data?.error || data?.message || 'Failed to delete account',
				);
			}

			toast.success('Your account has been deleted');

			// Clear cookies and redirect to sign-in
			await fetch('/api/logout', { method: 'POST' });
			router.replace('/sign-in');
		} catch (err: any) {
			toast.error(err.message || 'Something went wrong');
		} finally {
			setIsDeleting(false);
		}
	}

	function handleClose() {
		if (isDeleting) return;
		setConfirmText('');
		setRetrieveData(false);
		onOpenChange(false);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleClose}
		>
			<DialogContent className='bg-zinc-950 border-zinc-800 text-white sm:max-w-md'>
				<div className='flex items-center gap-3 mb-1'>
					<div className='w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center'>
						<AlertTriangle className='w-5 h-5 text-red-400' />
					</div>
					<div>
						<DialogTitle className='text-lg font-semibold text-white'>
							Delete Account
						</DialogTitle>
						<DialogDescription className='text-sm text-zinc-400'>
							This action cannot be undone.
						</DialogDescription>
					</div>
				</div>

				<div className='space-y-4 mt-2'>
					<p className='text-sm text-zinc-300 leading-relaxed'>
						Deleting your account will permanently remove your
						profile, data, and access to all ISCE products. You will
						be able to create a new account with the same email
						afterwards.
					</p>

					{/* Retrieve data checkbox */}
					<label className='flex items-start gap-3 p-3 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-600 transition group'>
						<Checkbox
							checked={retrieveData}
							onCheckedChange={(checked) =>
								setRetrieveData(checked === true)
							}
							className='mt-0.5 border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
						/>
						<div className='flex-1'>
							<div className='flex items-center gap-2'>
								<Download className='w-4 h-4 text-blue-400' />
								<span className='text-sm font-medium text-white'>
									Download a copy of my data
								</span>
							</div>
							<p className='text-xs text-zinc-400 mt-1'>
								Export your profile, permissions, and account
								history as a JSON file before deletion.
							</p>
						</div>
					</label>

					{/* Confirmation input */}
					<div>
						<label
							htmlFor='confirm-delete'
							className='text-sm text-zinc-400 block mb-2'
						>
							Type{' '}
							<span className='font-mono text-red-400'>
								delete my account
							</span>{' '}
							to confirm:
						</label>
						<input
							id='confirm-delete'
							type='text'
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							disabled={isDeleting}
							placeholder='delete my account'
							className='w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 disabled:opacity-50'
						/>
					</div>

					{/* Actions */}
					<div className='flex gap-3 pt-1'>
						<Button
							variant='outline'
							onClick={handleClose}
							disabled={isDeleting}
							className='flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
						>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={handleDelete}
							disabled={!canDelete || isDeleting}
							className='flex-1'
						>
							{isDeleting ?
								<>
									<Loader2 className='w-4 h-4 animate-spin' />
									Deleting…
								</>
							:	<>
									<Trash2 className='w-4 h-4' />
									Delete Account
								</>
							}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
