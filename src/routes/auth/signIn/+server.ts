import { app } from '$lib/server/admin';
import { json, redirect } from '@sveltejs/kit';
export const POST = async ({ request, cookies }) => {
	const body = await request.json();
	const idToken = body['token'];
	console.log('idToken', idToken);
	if (!idToken) {
		return json({ message: 'Bad Input' }, { status: 400 });
	}
	const a = await app.verifyIdToken(idToken);
	if (!a) {
		return json({ message: 'Invalid Id Token' }, { status: 400 });
	}

	const expiresIn = 2 * 60 * 60;
	// console.log('here');
	const sessionCookie = await app.createSessionCookie(idToken, expiresIn);

	cookies.set('sessionToken', sessionCookie, {
		maxAge: expiresIn,
		httpOnly: true,
		sameSite: 'strict',
		path: '/'
	});
	// throw redirect(303,"/")
	return json({ message: 'Good to go!' });
};
