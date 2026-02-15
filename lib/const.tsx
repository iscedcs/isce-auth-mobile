// Server-side: prefer internal Docker URL; client-side: falls back to NEXT_PUBLIC_
export const AUTH_API =
	process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

export const URLS = {
	auth: {
		sign_up: '/auth/signup',
		sign_in: '/auth/signin',
		quick_register: '/auth/signupUser',
		sign_out: '/auth/signout',
		reset_token: '/auth/send-reset-token',
		reset_password: '/auth/reset-password',
		request_verification_code: '/auth/request-verify-email-code',
		verify_code: '/auth/verify-email-code',
	},
	user: {
		one: '/user/one/{id}',
		update_user: '/user/update/{id}',
	},
};

export const PASSWORDCHECK = [
	{
		key: 'lowercase',
		message: 'At least one lowercase letter',
		state: false,
	},
	{
		key: 'length',
		message: 'Minimum of 8 characters',
		state: false,
	},
	{
		key: 'uppercase',
		message: 'At least one uppercase letter',
		state: false,
	},
	{
		key: 'number',
		message: 'At least one number',
		state: false,
	},
];
