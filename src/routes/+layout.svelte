<script>
	import { onMount } from 'svelte';
	import '../app.postcss';
	import { auth } from '$lib/firebase/app';
	import { onIdTokenChanged } from 'firebase/auth';
	import { userStore } from '$lib/firebase/store';

	onMount(() => {
		onIdTokenChanged(auth, async (user) => {
			$userStore = user;
		});
	});
</script>

<slot />
