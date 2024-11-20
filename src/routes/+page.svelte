<script lang="ts">
	import { onMount } from 'svelte'
	import { share } from 'rxjs/operators'
	import type { Observable } from 'rxjs'
	import type { OnboardAPI, WalletState } from '@web3-onboard/core'
	import {
		type GasEstimate,
		type EstimationData,
		ReadableChainKey,
		WritableChainKey
	} from '$lib/@types/types'
	import { createEstimationObject } from '$lib/utils'
	import { getOnboard } from '$lib/services/web3-onboard'
	import { readableChains, writableChains, quantiles, gasNetwork } from '../constants'
	import consumer from '$lib/abis/consumer.json'
	import gasnet from '$lib/abis/gasnet.json'
	import type { QuantileMap } from '$lib/@types/types'
	import Drawer from '$lib/components/Drawer.svelte'

	let gasEstimation: EstimationData | null = null
	let publishedGasData: GasEstimate | null = null
	let transactionSignature: string | null = null
	let transactionHash: string | null = null
	let publishErrorMessage: string | null = null
	let readFromGasNetErrorMessage: string | null = null
	let readFromTargetNetErrorMessage: string | null = null
	let isLoading = false
	let isDrawerOpen = true
	let wallets$: Observable<WalletState[]>
	let readGasDataFromTargetChainTime: string

	// Update your selected chain variables to use the enums
	let selectedReadChain: ReadableChainKey = ReadableChainKey.MAIN
	let selectedWriteChain: WritableChainKey = WritableChainKey.SEPOLIA
	let selectedQuantile: keyof QuantileMap = 'Q99'
	let selectedTimeout = 3600

	let onboard: OnboardAPI
	onMount(async () => {
		onboard = await getOnboard()
	})

	$: if (onboard) {
		wallets$ = onboard.state.select('wallets').pipe(share())
	}

	let ethersModule: typeof import('ethers')
	async function loadEthers() {
		if (!ethersModule) {
			ethersModule = await import('ethers')
		}
		return ethersModule
	}

	async function fetchGasEstimationFromGasNet(
		chain: string
	): Promise<{ estimationData: EstimationData; signature: string } | null> {
		isLoading = true
		transactionHash = null

		try {
			const { ethers } = await loadEthers()
			const rpcProvider = new ethers.JsonRpcProvider(gasNetwork.url)
			const gasNetContract = new ethers.Contract(gasNetwork.contract, gasnet.abi, rpcProvider)
			const [estimation, signature] = await gasNetContract.getEstimation(chain)
			transactionSignature = signature
			return { estimationData: createEstimationObject(estimation), signature }
		} catch (error) {
			const revertErrorFromContract = (error as any)?.info?.error?.message
			console.error(error)
			readFromGasNetErrorMessage = revertErrorFromContract || (error as string)
			isLoading = false
			return null
		}
	}

	async function readPublishedGasData(provider: any) {
		try {
			readFromTargetNetErrorMessage = null
			await onboard.setChain({ chainId: writableChains[selectedWriteChain].chainId })

			const { ethers } = await loadEthers()
			const ethersProvider = new ethers.BrowserProvider(provider, 'any')
			const signer = await ethersProvider.getSigner()

			const gasNetContract = new ethers.Contract(
				writableChains[selectedWriteChain].contract,
				consumer.abi,
				signer
			)

			readGasDataFromTargetChainTime = new Date().toLocaleString(undefined, {
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				dateStyle: 'medium',
				timeStyle: 'long'
			})

			const [gasPrice, maxPriorityFeePerGas, maxFeePerGas] =
				await gasNetContract.getGasEstimationQuantile(
					BigInt(readableChains[selectedReadChain].chainId),
					BigInt(selectedTimeout),
					Number(quantiles[selectedQuantile])
				)
			publishedGasData = { gasPrice, maxPriorityFeePerGas, maxFeePerGas }
		} catch (error) {
			publishedGasData = null
			console.error('Gas data fetch error:', error)
			const revertErrorFromContract = (error as any)?.info?.error?.message || (error as any)?.reason
			readFromTargetNetErrorMessage = revertErrorFromContract || (error as string)
			isLoading = false
		}
	}

	async function publishGasEstimation(provider: any) {
		try {
			const { ethers } = await loadEthers()
			const ethersProvider = new ethers.BrowserProvider(provider, 'any')

			const signer = await ethersProvider.getSigner()
			const consumerContract = new ethers.Contract(
				writableChains[selectedWriteChain].contract,
				consumer.abi,
				signer
			)

			const transaction = await consumerContract.setEstimation(gasEstimation, transactionSignature)
			const receipt = await transaction.wait()

			isLoading = false
			transactionHash = receipt.hash
		} catch (error) {
			const revertErrorFromGasNetContract = (error as any)?.info?.error?.message

			console.error('Publication error:', error)
			publishErrorMessage = revertErrorFromGasNetContract || (error as string)
			isLoading = false
		}
	}

	async function handleGasEstimation(provider: any, readChainId: number, writeChainId: number) {
		publishErrorMessage = null
		readFromGasNetErrorMessage = null
		try {
			const gasNetData = await fetchGasEstimationFromGasNet(readChainId.toString())
			if (gasNetData) {
				const { estimationData, signature } = gasNetData
				if (estimationData && signature) {
					gasEstimation = estimationData
					await onboard.setChain({ chainId: writeChainId })
					await publishGasEstimation(provider)
					return
				}
			}
			throw new Error(
				`Failed to fetch gas estimation: ${gasNetData?.estimationData} or signature: ${gasNetData?.signature} from GasNet`
			)
		} catch (e) {
			console.error(e)
		}
	}

	function formatBigInt(key: string, value: any) {
		return typeof value === 'bigint' ? value.toString() : value
	}
</script>

<main
	class="bg-brandBackground text-brandBackground h-full min-h-[100vh] w-full p-4 font-sans sm:p-6"
>
	<div
		class="border-brandAction/50 bg-brandForeground mx-auto max-w-3xl rounded-xl border p-6 shadow-md sm:p-8"
	>
		{#if onboard && !$wallets$?.length}
			<div class="my-4 flex flex-col gap-2">
				<button
					class="bg-brandAction text-brandBackground hover:bg-brandAction/80 w-full rounded-lg px-6 py-3 font-medium text-white transition-colors"
					on:click={() => onboard.connectWallet()}
				>
					Connect Wallet
				</button>
			</div>
		{/if}

		{#if $wallets$}
			{#each $wallets$ as { provider }}
				<div class="flex flex-col gap-2 sm:gap-4">
					<div class="mb-2 flex items-center justify-between gap-4">
						<div class="flex flex-col gap-1">
							<label for="read-chain" class="text-brandBackground/80 ml-1 text-xs font-medium"
								>Estimates For</label
							>
							<select
								id="read-chain"
								bind:value={selectedReadChain}
								class="min-w-[140px] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
							>
								{#each Object.entries(readableChains) as [key, chain]}
									<option value={key}>{chain.display}</option>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label for="write-chain" class="text-brandBackground/80 ml-1 text-xs font-medium"
								>Write To</label
							>
							<select
								id="write-chain"
								bind:value={selectedWriteChain}
								class="min-w-[140px] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
							>
								{#each Object.entries(writableChains) as [key, chain]}
									<option value={key}>{chain.display}</option>
								{/each}
							</select>
						</div>
					</div>
					<button
						class="bg-brandAction text-brandBackground hover:bg-brandAction/80 w-full rounded-lg px-6 py-3 font-medium text-white transition-colors"
						on:click={() =>
							handleGasEstimation(
								provider,
								readableChains[selectedReadChain].chainId,
								writableChains[selectedWriteChain].chainId
							)}
					>
						Read {readableChains[selectedReadChain].display} Estimations and Write to {writableChains[
							selectedWriteChain
						].display}
					</button>

					{#if gasEstimation}
						<Drawer {isDrawerOpen}>
							<pre
								class="m-0 overflow-x-auto bg-gray-50 p-2 text-xs leading-relaxed text-gray-800 sm:p-6 sm:text-sm">{JSON.stringify(
									gasEstimation,
									formatBigInt,
									2
								)}</pre>
						</Drawer>
						<p>
							Data created on GasNet at: {new Date(
								Number(gasEstimation.timestamp) * 1000
							).toLocaleString(undefined, {
								timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
								dateStyle: 'medium',
								timeStyle: 'long'
							})}
						</p>
					{/if}

					{#if isLoading}
						<div class="my-4 flex flex-col items-center gap-2">
							<div
								class="border-t-brandBackground border-brandBackground/20 h-12 w-12 animate-spin rounded-full border-4"
							></div>
							<p class="text-center sm:text-left">
								Please Check Connected Browser Wallet for Progress
							</p>
						</div>
					{/if}

					{#if transactionHash}
						<div class="my-4 flex flex-col gap-2">
							<p class="text-gray-600">Confirmed Hash:</p>
							<a
								href="https://sepolia.etherscan.io/tx/{transactionHash}"
								target="_blank"
								rel="noopener noreferrer"
								class="overflow-hidden text-ellipsis text-blue-500 hover:underline"
							>
								{`https://sepolia.etherscan.io/tx/${transactionHash}`}
							</a>
						</div>
					{/if}
					{#if readFromGasNetErrorMessage}
						<div class="overflow-auto rounded-lg border border-red-500 p-4 text-red-500">
							{readFromGasNetErrorMessage}
						</div>
					{/if}
					{#if publishErrorMessage}
						<div class="overflow-auto rounded-lg border border-red-500 p-4 text-red-500">
							{publishErrorMessage}
						</div>
					{/if}

					<div class="mb-2 flex w-full flex-col items-center justify-between gap-4">
						<div class="flex w-full items-start justify-between gap-4">
							<div class="flex flex-col gap-1">
								<label
									for="quantile-select"
									class="text-brandBackground/80 ml-1 text-xs font-medium">Read Quantile</label
								>
								<select
									id="quantile-select"
									bind:value={selectedQuantile}
									class="min-w-[140px] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
								>
									{#each Object.entries(quantiles) as [key, value]}
										{#if key !== 'Q98'}
											<option value={key}>Q{value}</option>
										{:else}
											<option value={key}>Q{value} - (unsupported)</option>
										{/if}
									{/each}
								</select>
							</div>
							<div class="flex flex-col gap-1">
								<label for="timeout-select" class="text-brandBackground/80 ml-1 text-xs font-medium"
									>Recency</label
								>
								<select
									id="timeout-select"
									bind:value={selectedTimeout}
									class="min-w-[140px] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
								>
									<option value={10}>10 Sec</option>
									<option value={30}>30 Sec</option>
									<option value={60}>1 Min</option>
									<option value={3600}>1 Hr</option>
									<option value={86400}>1 Day</option>
									<option value={604800}>1 Week</option>
								</select>
							</div>
						</div>
						<button
							class="bg-brandAction text-brandBackground hover:bg-brandAction/80 w-full rounded-lg px-6 py-3 font-medium text-white transition-colors"
							on:click={() => readPublishedGasData(provider)}
						>
							Read {readableChains[selectedReadChain].display} Estimations from {writableChains[
								selectedWriteChain
							].display} for the {quantiles[selectedQuantile]} Quantile
						</button>

						{#if publishedGasData}
							<div class="w-full text-left">
								Data read from {writableChains[selectedWriteChain].display} at: {readGasDataFromTargetChainTime}
							</div>
							<div
								class="my-4 flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-gray-200"
							>
								<pre
									class="m-0 overflow-scroll overflow-x-auto bg-gray-50 p-2 text-xs leading-relaxed text-gray-800 sm:p-6 sm:text-sm">{JSON.stringify(
										publishedGasData,
										formatBigInt,
										2
									)}</pre>
							</div>
						{/if}
					</div>

					{#if readFromTargetNetErrorMessage}
						<div class="overflow-auto rounded-lg border border-red-500 p-4 text-red-500">
							{readFromTargetNetErrorMessage}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</main>

<style>
	:root {
		--w3o-background-color: hsl(323 100% 6% / 1);
		--w3o-text-color: #fce9cf;
		--w3o-border-color: hsl(35 88% 15% / 1);
		--w3o-action-color: #fb8d5b;
		--w3o-border-radius: 1rem;
	}
</style>
