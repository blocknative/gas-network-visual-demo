<script lang="ts">
	import '../app.css'
	import { ethers } from 'ethers'
	import { share } from 'rxjs/operators'
	import { Quantile, type GasEstimate, type PredictionData } from '../lib/@types/types'
	import { createPredictionObject } from '../lib/utils'
	import { onboard } from '../lib/services/web3-onboard'
	import {
		GASNET_URL,
		GASNET_CONTRACT_ADDRESS,
		GASNET_CONTRACT_ADDRESS_SEPOLIA
	} from '../constants'
	import consumer from '../lib/abis/consumer.json'
	import gasnet from '../lib/abis/gasnet.json'
	import { slide } from 'svelte/transition'

	const SEPOLIA_CHAIN_ID = 11155111
	const MAINNET_CHAIN_ID = '1'
	const GAS_ESTIMATION_DELAY = 60000000000 // 10 minutes in seconds

	const wallets$ = onboard.state.select('wallets').pipe(share())

	let gasEstimation: PredictionData | null = null
	let publishedGasData: GasEstimate | null = null
	let transactionSignature: string | null = null
	let transactionHash: string | null = null
	let errorMessage: string | null = null
	let isLoading = false
	let isDrawerOpen = true // Starts open by default

	async function fetchMainnetGasEstimation(chain: string) {
		isLoading = true
		errorMessage = null

		try {
			const rpcProvider = new ethers.JsonRpcProvider(GASNET_URL)
			const gasNetContract = new ethers.Contract(GASNET_CONTRACT_ADDRESS, gasnet.abi, rpcProvider)

			const [estimation, signature] = await gasNetContract.getEstimation(chain)
			transactionSignature = signature
			gasEstimation = createPredictionObject(estimation)
		} catch (error) {
			console.error(error)
			errorMessage = error as string
			isLoading = false
		}
	}

	async function readPublishedGasData(chainId: string, provider: any) {
		errorMessage = null

		try {
			const ethersProvider = new ethers.BrowserProvider(provider, 'any')
			const signer = await ethersProvider.getSigner()
			const gasNetContract = new ethers.Contract(
				GASNET_CONTRACT_ADDRESS_SEPOLIA,
				consumer.abi,
				signer
			)

			const [gasPrice, maxPriorityFeePerGas, maxFeePerGas] =
				await gasNetContract.getGasEstimationQuantile(
					BigInt(chainId),
					GAS_ESTIMATION_DELAY,
					Quantile.Q99
				)

			publishedGasData = { gasPrice, maxPriorityFeePerGas, maxFeePerGas }
		} catch (error) {
			console.error('Gas data fetch error:', error)
			errorMessage = error as string
		}
	}

	async function publishGasEstimation(provider: any) {
		try {
			const signer = await provider.getSigner()
			const consumerContract = new ethers.Contract(
				GASNET_CONTRACT_ADDRESS_SEPOLIA,
				consumer.abi,
				signer
			)

			const transaction = await consumerContract.setEstimation(gasEstimation, transactionSignature)
			const receipt = await transaction.wait()

			isLoading = false
			transactionHash = receipt.hash
		} catch (error) {
			console.error('Publication error:', error)
			errorMessage = error as string
			isLoading = false
		}
	}

	async function handleMainnetGasEstimation(provider: any) {
		const ethersProvider = new ethers.BrowserProvider(provider, 'any')
		await fetchMainnetGasEstimation(MAINNET_CHAIN_ID)
		await onboard.setChain({ chainId: SEPOLIA_CHAIN_ID })
		await publishGasEstimation(ethersProvider)
	}

	function formatBigInt(key: string, value: any) {
		return typeof value === 'bigint' ? value.toString() : value
	}
</script>

<main class="mx-auto max-w-3xl p-4 font-sans md:p-8">
	<div class=" flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-md md:p-8">
		{#if !$wallets$?.length}
			<div class="flex flex-col gap-2">
				<button class="btn" on:click={() => onboard.connectWallet()}>Connect Wallet</button>
			</div>
		{/if}

		{#if $wallets$}
			{#each $wallets$ as { provider }}
				<div class="flex flex-col gap-2">
					<button class="btn" on:click={() => handleMainnetGasEstimation(provider)}>
						Get Mainnet Gas Predictions and Publish to Sepolia
					</button>
				</div>

				{#if gasEstimation}
					<div class="flex flex-col gap-4">
						<div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
							<button
								class="w-full p-4 bg-transparent border-none cursor-pointer text-inherit text-left transition-colors duration-200 hover:bg-slate-50"
								on:click={() => (isDrawerOpen = !isDrawerOpen)}
								aria-expanded={isDrawerOpen}
							>
								<div class="flex items-center w-full gap-4">
									<svg
										class={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
											isDrawerOpen ? 'rotate-180' : ''
										}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
									<div class="text-lg font-medium">Data Pulled From Gas Network</div>
								</div>
							</button>

							{#if isDrawerOpen}
								<div class="border-t" transition:slide={{ duration: 200 }}>
									<pre
										class="m-0 bg-slate-50 overflow-x-auto whitespace-pre-wrap break-words p-4 text-sm leading-6 text-gray-800 md:p-6"
									>{JSON.stringify(gasEstimation, formatBigInt, 2)}</pre>
								</div>
							{/if}
						</div>

						{#if isLoading}
							<div class="flex flex-col items-center justify-center gap-2 my-2">
								<div
									class="spinner h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
								></div>
								<p class="text-sm text-gray-600">
									Please Check Connected Browser Wallet for Progress
								</p>
							</div>
						{/if}

						{#if transactionHash}
							<div>
								Confirmed Hash:
								<a
									href="https://sepolia.etherscan.io/tx/{transactionHash}"
									target="_blank"
									rel="noopener noreferrer"
									class="break-all text-blue-500 hover:underline"
								>
									{transactionHash}
								</a>
							</div>
						{/if}
					</div>
				{/if}

				<div class="flex flex-col gap-4">
					<button class="btn" on:click={() => readPublishedGasData(MAINNET_CHAIN_ID, provider)}>
						Get Mainnet Gas Data from Sepolia - 99 Quantile
					</button>

					{#if publishedGasData}
						<div class="flex flex-col gap-2">
							<pre
								class="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800 md:p-6">{JSON.stringify(
									publishedGasData,
									formatBigInt,
									2
								)}</pre>
						</div>
					{/if}
				</div>

				{#if errorMessage}
					<div class="overflow-auto rounded-lg border border-red-500 p-4 text-red-500">
						{errorMessage}
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</main>

<style>
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	:global(.btn) {
		@apply w-auto min-w-[14rem] cursor-pointer rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-600;
		@apply text-sm md:text-base; /* Smaller text on mobile */
		@apply max-w-full; /* Ensure button doesn't overflow on mobile */
	}
</style>
