<script>
	import { onMount } from 'svelte';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/app';
	onMount(() => {
		signOut(auth).then(async () => {
			await fetch('/auth/signOut', { method: 'POST' });
		});
	});
</script>

You're not allowed here! Leave!
