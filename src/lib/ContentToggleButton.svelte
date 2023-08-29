<script lang="ts">
	let pressed: boolean = false;
	let clazz: string = '';
	export { clazz as class };
	function toggle() {
        pressed = !pressed;
		console.log(pressed);
	}
</script>

<button class="btn {clazz}" class:btn-active={pressed} {...$$restProps} on:click={toggle}>
	<slot />
</button>
{#if pressed}
	<slot name="content" {pressed} {toggle} />
{/if}
