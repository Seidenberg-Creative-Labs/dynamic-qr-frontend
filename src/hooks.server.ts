import { redirect, type Handle } from '@sveltejs/kit';
import { app } from '$lib/server/admin';
import { ALLOWED_EMAILS } from '$env/static/private';
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
	const whitelist = ALLOWED_EMAILS.split(',');
	if (!whitelist.includes(token.email)) {
		event.cookies.delete('sessionToken');
		throw redirect(303, '/notauthorized');
	}
	return await resolve(event);
};
