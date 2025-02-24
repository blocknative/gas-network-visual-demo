<script lang="ts">
	import { cubicOut } from 'svelte/easing'
	import { slide } from 'svelte/transition'

	export let isDrawerOpen: boolean
</script>

<div 
	class="overflow-hidden rounded-lg border border-gray-800 bg-[#141414] transition-shadow hover:shadow-lg hover:shadow-[#00f8e2]/5"
>
	<button
		class="w-full px-6 py-4 text-left transition-all hover:bg-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#00f8e2]/20"
		on:click={() => (isDrawerOpen = !isDrawerOpen)}
		aria-expanded={isDrawerOpen}
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<svg
					class="h-5 w-5 text-[#00f8e2] transition-transform duration-300 ease-in-out {isDrawerOpen ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
				<span class="text-md font-medium text-white sm:text-lg">
						Data From Gas Network
				</span>
			</div>
			<span class="text-sm text-gray-400">
				{isDrawerOpen ? 'Click to collapse' : 'Click to expand'}
			</span>
		</div>
	</button>

	{#if isDrawerOpen}
		<div 
			class="border-t border-gray-800 transition-colors" 
			transition:slide={{ duration: 300, easing: cubicOut }}
		>
			<div class="p-4 transition-colors">
				<slot />
			</div>
		</div>
	{/if}
</div>

<style>
	/* Add smooth transitions for all interactive elements */
	:global(.transition-all) {
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
