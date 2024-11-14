<script lang="ts">
	import '../app.css'
	let { children } = $props()
</script>

<svelte:head>
	<!-- set default title and meta to all pages -->
	<title>Gas Network Demo</title>
	<meta name="description" content="Gas Network Demo" />
	<!-- load fonts -->
	<link rel="preconnect" href="https://fonts.bunny.net" />
	<link
		href="https://fonts.bunny.net/css?family=fira-mono:500|fira-sans:500,700|fira-sans-condensed:500&display=fallback"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
