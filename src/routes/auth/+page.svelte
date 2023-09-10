<script>
	import { auth } from '$lib/firebase/app';
	import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

	async function handleLogin() {
		const provider = new GoogleAuthProvider();

		const result = await signInWithPopup(auth, provider);
		console.log(result);
		if (!result) {
			console.log('no user');
			return;
		}
		const res = await fetch('/auth/signIn', {
			method: 'POST',
			body: JSON.stringify({ token: await result.user.getIdToken() })
		});
		if (res.status !== 200) {
			alert('failed to set cookie');
			return;
		}
		window.location.href = '/';
	}
</script>

<main class="container mx-auto space-y-2 px-6 py-4">
	<h1 class="font-bold text-3xl">Dynamic QR Sign-In Page</h1>
	<p>Click on the Sign In Button to login through the app using your Google Account</p>
	<p>If you're authorized you'll automatically be redirected to the home page</p>
	<button on:click={handleLogin} class="btn btn-outline">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="w-6 h-6"
			fill="currentColor"
			viewBox="0 0 488 512"
		>
			<path
				d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
			/>
		</svg>
		Sign In with Google
	</button>
</main>
