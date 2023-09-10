import { redirect, type Handle } from '@sveltejs/kit';
import { app } from '$lib/server/admin';
import { sequence } from '@sveltejs/kit/hooks';
const protectRoutes = ['/'];
export const handle: Handle = async ({ event, resolve }) => {
	if (!protectRoutes.includes(event.url.pathname)) {
		return await resolve(event);
	}
	console.log('inside of hook');
	const sessionToken = event.cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(303, '/auth');
	}
	const token = await app.verifySessionCookie(sessionToken);
	console.log('token', token);
	console.log('should not go through', token.email !== 'jphillipjean@gmail.com');
	if (token.email !== 'jphillipjean@gmail.com') {
		event.cookies.delete('sessionToken');
		throw redirect(303, '/notauthorized');
	}
	return await resolve(event);
};
