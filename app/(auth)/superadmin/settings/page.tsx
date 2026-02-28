'use client';

import { Settings, Globe, Bell, Shield, Server } from 'lucide-react';

interface SettingSection {
	title: string;
	description: string;
	icon: React.ElementType;
	items: SettingItem[];
}

interface SettingItem {
	label: string;
	description: string;
	type: 'toggle' | 'text' | 'select';
	value?: string | boolean;
	disabled?: boolean;
}

const SETTINGS_SECTIONS: SettingSection[] = [
	{
		title: 'General',
		description: 'Core ecosystem configuration',
		icon: Globe,
		items: [
			{
				label: 'Maintenance Mode',
				description:
					'When enabled, all products show a maintenance page to non-admin users',
				type: 'toggle',
				value: false,
				disabled: true,
			},
			{
				label: 'Default User Type',
				description:
					'The default role assigned to new users at registration',
				type: 'select',
				value: 'USER',
				disabled: true,
			},
		],
	},
	{
		title: 'Security',
		description: 'Authentication and access settings',
		icon: Shield,
		items: [
			{
				label: 'Enforce Email Verification',
				description:
					'Require all new users to verify their email before accessing products',
				type: 'toggle',
				value: true,
				disabled: true,
			},
			{
				label: 'Max Login Attempts',
				description:
					'Number of failed login attempts before temporary lockout',
				type: 'text',
				value: '5',
				disabled: true,
			},
			{
				label: 'Session Timeout (hours)',
				description:
					'How long access tokens remain valid before requiring refresh',
				type: 'text',
				value: '1',
				disabled: true,
			},
		],
	},
	{
		title: 'Notifications',
		description: 'Push notification and email settings',
		icon: Bell,
		items: [
			{
				label: 'Enable Push Notifications',
				description:
					'Allow sending push notifications via Firebase across all products',
				type: 'toggle',
				value: true,
				disabled: true,
			},
			{
				label: 'Enable Email Notifications',
				description:
					'Allow sending transactional emails (OTP, password resets, etc.)',
				type: 'toggle',
				value: true,
				disabled: true,
			},
		],
	},
	{
		title: 'Infrastructure',
		description: 'Server and system-level configuration',
		icon: Server,
		items: [
			{
				label: 'Rate Limit (req/min)',
				description:
					'Maximum requests per minute per user across all APIs',
				type: 'text',
				value: '30',
				disabled: true,
			},
			{
				label: 'CORS Origins',
				description:
					'Allowed origins for cross-origin requests (comma-separated)',
				type: 'text',
				value: '*.isce.app',
				disabled: true,
			},
		],
	},
];

export default function SuperAdminSettingsPage() {
	return (
		<div className='p-8 max-w-4xl'>
			<div className='mb-8'>
				<h1 className='text-2xl font-bold mb-1'>Global Settings</h1>
				<p className='text-white/50 text-sm'>
					Ecosystem-wide configuration for all ISCE products
				</p>
			</div>

			{/* Coming Soon Notice */}
			<div className='mb-8 p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl'>
				<div className='flex items-center gap-3'>
					<Settings className='w-5 h-5 text-amber-400' />
					<div>
						<p className='text-sm font-medium text-amber-300'>
							Settings are read-only
						</p>
						<p className='text-xs text-white/40 mt-0.5'>
							These settings are currently configured via
							environment variables. Interactive editing will be
							available in a future update.
						</p>
					</div>
				</div>
			</div>

			{/* Settings Sections */}
			<div className='space-y-8'>
				{SETTINGS_SECTIONS.map((section) => {
					const Icon = section.icon;

					return (
						<div key={section.title}>
							<div className='flex items-center gap-3 mb-4'>
								<div className='w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center'>
									<Icon className='w-4 h-4 text-white/50' />
								</div>
								<div>
									<h2 className='text-lg font-semibold'>
										{section.title}
									</h2>
									<p className='text-xs text-white/40'>
										{section.description}
									</p>
								</div>
							</div>

							<div className='border border-white/10 rounded-xl divide-y divide-white/5'>
								{section.items.map((item) => (
									<div
										key={item.label}
										className='px-5 py-4 flex items-center justify-between gap-4'
									>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium'>
												{item.label}
											</p>
											<p className='text-xs text-white/40 mt-0.5'>
												{item.description}
											</p>
										</div>
										<div className='shrink-0'>
											{item.type === 'toggle' ?
												<div
													className={`w-10 h-6 rounded-full relative cursor-not-allowed ${
														item.value ?
															'bg-emerald-500/30'
														:	'bg-white/10'
													}`}
												>
													<div
														className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
															item.value ?
																'right-1 bg-emerald-400'
															:	'left-1 bg-white/30'
														}`}
													/>
												</div>
											: item.type === 'select' ?
												<div className='px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60'>
													{String(item.value)}
												</div>
											:	<div className='px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 min-w-[80px] text-center'>
													{String(item.value)}
												</div>
											}
										</div>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
