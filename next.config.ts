import type { NextConfig } from 'next';

function domain(url?: string) {
	if (!url) return '';
	try {
		return new URL(url).origin;
	} catch {
		return '';
	}
}

const API_DOMAINS = [
	process.env.NEXT_PUBLIC_AUTH_API_URL,
	process.env.NEXT_PUBLIC_URL,
	process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS,
]
	.flatMap((v) => (v ? v.split(',') : []))
	.map(domain)
	.filter(Boolean)
	.join(' ');

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
			},
			{
				protocol: 'https',
				hostname: 'flagcdn.com',
			},
			{
				protocol: 'https',
				hostname: 'encrypted-tbn0.gstatic.com',
			},
			{
				protocol: 'https',
				hostname: 'isce-image-uploader.s3.us-east-1.amazonaws.com',
			},
			{
				protocol: 'https',
				hostname: 'isce-image.fra1.digitaloceanspaces.com',
			},
			{
				protocol: 'https',
				hostname: 'fra1.digitaloceanspaces.com',
			},
			{
				protocol: 'https',
				hostname: 'i.ytimg.com',
			},
			{
				protocol: 'https',
				hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
			},
		],
	},
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: '/:path*',
				headers: [
					{
						key: 'X-DNS-Prefetch-Control',
						value: 'on',
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=63072000; includeSubDomains; preload',
					},
					{
						key: 'X-Frame-Options',
						value: 'SAMEORIGIN',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()',
					},
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://*.googleapis.com",
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
							"font-src 'self' https://fonts.gstatic.com data:",
							"img-src 'self' data: blob: https://encrypted-tbn0.gstatic.com https://*.s3.amazonaws.com https://*.digitaloceanspaces.com https://i.ytimg.com https://*.vercel-storage.com https://flagcdn.com https://cdn.sanity.io",
							`connect-src 'self' ${API_DOMAINS} https://*.googleapis.com https://*.google.com https://*.sanity.io https://open.spotify.com https://*.s3.amazonaws.com https://*.digitaloceanspaces.com https://*.vercel-storage.com https://flagcdn.com https://auth.isce.tech https://connect-web-eight.vercel.app https://gada.isce.tech`,
							"frame-src 'self' https://*.google.com https://*.googleapis.com https://maps.googleapis.com https://www.youtube.com https://open.spotify.com https://fra1.digitaloceanspaces.com",
							"object-src 'none'",
							"base-uri 'self'",
							"form-action 'self'",
							"frame-ancestors 'self'",
							'upgrade-insecure-requests',
						].join('; '),
					},
				],
			},
		];
	},
};

export default nextConfig;
