import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Auth by ISCE',
	description: 'Centralized Authentication Service by ISCE',
};

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className=' w-full'>
			<div className='md:p-0 p-5 relative w-full h-[100svh] '>
				{children}
			</div>
		</div>
	);
}
