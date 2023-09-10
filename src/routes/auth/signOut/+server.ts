import { json, redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
	cookies.delete('sessionToken', { path: '/' });
	// return json({ message: '' });
	throw redirect(302, '/auth');
};
