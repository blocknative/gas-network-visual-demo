<script lang="ts">
	import { slide } from 'svelte/transition'

	export let isDrawerOpen: boolean
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
	<button
		class="w-full px-6 py-4 text-left transition-colors hover:bg-gray-50"
		on:click={() => (isDrawerOpen = !isDrawerOpen)}
		aria-expanded={isDrawerOpen}
	>
		<div class="flex items-center gap-4">
			<svg
				class="h-5 w-5 text-gray-500 transition-transform {isDrawerOpen ? 'rotate-180' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
			<span class="text-md font-medium sm:text-lg">Data Pulled From Gas Network</span>
		</div>
	</button>

	{#if isDrawerOpen}
		<div class="border-t border-gray-200" transition:slide={{ duration: 300 }}>
			<slot />
		</div>
	{/if}
</div>
