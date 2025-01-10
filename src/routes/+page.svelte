<script lang="ts">
	import { onMount } from 'svelte'
	import { share } from 'rxjs/operators'
	import type { Observable } from 'rxjs'
	import type { OnboardAPI, WalletState } from '@web3-onboard/core'
	import {
		type GasEstimate,
		ReadableChainKey,
		WritableChainKey,
		type PayloadValues,
		type VPayload
	} from '$lib/@types/types'
	import { getOnboard } from '$lib/services/web3-onboard'
	import { readableChains, writableChains, quantiles, gasNetwork, gasNetworkV2 } from '../constants'
	import consumerV2 from '$lib/abis/consumerV2.json'
	import gasnetV2 from '$lib/abis/gasnetV2.json'
	import consumer from '$lib/abis/consumer.json'
	import gasnet from '$lib/abis/gasnet.json'
	import type { EstimationData, QuantileMap } from '$lib/@types/types'
	import Drawer from '$lib/components/Drawer.svelte'
	import { createEstimationObject } from '$lib/utils'
	import { Contract } from 'ethers'

	let pValues: PayloadValues | undefined
	let pRaw: string | null = null

	let publishedGasData: {
		gasPrice: string
		maxPriorityFeePerGas: string
		maxFeePerGas: string
	} | null = null
	let v2PublishedGasData: GasEstimate | null = null
	let gasEstimation: EstimationData | null = null
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
	let v2Contract = true

	let onboard: OnboardAPI
	onMount(async () => {
		onboard = await getOnboard()
	})

	$: if (onboard) {
		wallets$ = onboard.state.select('wallets').pipe(share())
	}

	$: if (v2Contract) selectedWriteChain = WritableChainKey.LINEA_SEPOLIA

	let ethersModule: typeof import('ethers')
	async function loadEthers() {
		if (!ethersModule) {
			ethersModule = await import('ethers')
		}
		return ethersModule
	}

	async function fetchGasEstimationFromGasNet(chain: string) {
		isLoading = true
		transactionHash = null
		try {
			const { ethers } = await loadEthers()

			if (v2Contract) {
				const rpcProvider = new ethers.JsonRpcProvider(gasNetworkV2.url)
				const gasNetContract = new ethers.Contract(gasNetworkV2.contract, gasnetV2.abi, rpcProvider)
				const payload = await gasNetContract.getValues(2, chain)
				return { paramsPayload: parsePayload(payload), rawReadChainData: payload }
			} else {
				const rpcProvider = new ethers.JsonRpcProvider(gasNetwork.url)
				const gasNetContract = new ethers.Contract(gasNetwork.contract, gasnet.abi, rpcProvider)
				const [estimation, signature] = await gasNetContract.getEstimation(chain)
				transactionSignature = signature
				return { estimationData: createEstimationObject(estimation), signature }
			}
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
			const { contract, v2Supported } = writableChains[selectedWriteChain]

			const gasNetContract = new ethers.Contract(
				contract,
				v2Contract ? consumerV2.abi : consumer.abi,
				signer
			)

			readGasDataFromTargetChainTime = new Date().toLocaleString(undefined, {
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				dateStyle: 'medium',
				timeStyle: 'long'
			})

			if (v2Supported) {
				console.log(selectedTimeout)
				const v2ValuesList = await gasNetContract.getInTime(2, 1, 2, selectedTimeout)

				console.log('new data from gasNetContract.getInTime', v2ValuesList)
				v2PublishedGasData = v2ValuesList
			} else {
				// if v1 contract
				const [gasPrice, maxPriorityFeePerGas, maxFeePerGas] =
					await gasNetContract.getGasEstimationQuantile(
						BigInt(readableChains[selectedReadChain].chainId),
						BigInt(selectedTimeout),
						Number(quantiles[selectedQuantile])
					)
				publishedGasData = {
					gasPrice: gasPrice,
					maxPriorityFeePerGas: maxPriorityFeePerGas,
					maxFeePerGas: maxFeePerGas
				}
			}
		} catch (error) {
			publishedGasData = null
			v2PublishedGasData = null
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
				v2Contract ? consumerV2.abi : consumer.abi,
				signer
			)

			let transaction
			if (v2Contract) {
				transaction = await consumerContract.storeValues(pRaw)
			} else {
				transaction = await consumerContract.setEstimation(gasEstimation, transactionSignature)
			}

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

	function parsePayload(payload: string): PayloadValues {
		let pV = {} as PayloadValues
		const buf = Buffer.from(payload.replace('0x', ''), 'hex')
		pV.height = buf.readBigUInt64BE(0x17)
		pV.chainid = buf.readBigUInt64BE(0xf)
		pV.systemid = buf.readUint8(0xe)

		let timeBuff = Buffer.alloc(8)
		buf.copy(timeBuff, 2, 0x8, 0xe)
		pV.timestamp = timeBuff.readBigUInt64BE(0)
		let pLen = buf.readUint16BE(0x6)

		pV.payloads = new Array()
		let value = Buffer.alloc(0x20)
		let pos = 0

		for (let i = 0; i < pLen; i++) {
			pos += 0x20 // also, skip header
			buf.copy(value, 2, pos + 0x2)
			pV.payloads.push({
				typ: buf.readUint16BE(pos),
				value: '0x' + value.toString('hex') // value.readBigUInt64BE(0),
			} as VPayload)
		}

		// ... and signature
		return pV
	}

	async function handleGasEstimation(provider: any, readChainId: number, writeChainId: number) {
		publishErrorMessage = null
		readFromGasNetErrorMessage = null
		gasEstimation = null
		try {
			const gasNetData = await fetchGasEstimationFromGasNet(readChainId.toString())
			if (gasNetData) {
				if (v2Contract) {
					const { paramsPayload, rawReadChainData } = gasNetData as any
					if (paramsPayload) {
						pValues = paramsPayload
						pRaw = rawReadChainData
						await onboard.setChain({ chainId: writeChainId })
						await publishGasEstimation(provider)
						return
					}
				} else {
					const { estimationData, signature } = gasNetData as any
					if (estimationData && signature) {
						gasEstimation = estimationData
						await onboard.setChain({ chainId: writeChainId })
						await publishGasEstimation(provider)
						return
					}
				}
			}

			throw new Error(
				v2Contract
					? `Failed to fetch gas estimation: ${gasNetData?.paramsPayload} from GasNet`
					: `Failed to fetch gas estimation: ${gasNetData?.estimationData} or signature: ${gasNetData?.signature} from GasNet`
			)
		} catch (e) {
			console.error(e)
		}
	}

	function formatBigInt(key: string, value: any) {
		return typeof value === 'bigint' ? value.toString() : value
	}

	function orderAndFilterChainsAlphabetically() {
		const rChains = v2Contract
			? Object.entries(writableChains).filter((chain) => chain[1].v2Supported)
			: Object.entries(writableChains)
		return rChains.sort((a, b) => {
			return a[1].display.localeCompare(b[1].display)
		})
	}
	function orderAndFilterReadableChainsAlphabetically() {
		const rChains = v2Contract
			? Object.entries(readableChains).filter((chain) => chain[1].v2Supported)
			: Object.entries(readableChains)
		return rChains.sort((a, b) => {
			if (a[0] === 'unsupportedChain') return 1
			if (b[0] === 'unsupportedChain') return -1
			return a[1].display.localeCompare(b[1].display)
		})
	}
</script>

<main
	class="h-full min-h-[100vh] w-full bg-brandBackground p-4 font-sans text-brandBackground sm:p-6"
>
	<div
		class="mx-auto max-w-3xl rounded-xl border border-brandAction/50 bg-brandForeground p-6 shadow-md sm:p-8"
	>
		<h1 class="mb-8 text-center text-3xl">Gas Network Demo</h1>

		{#if onboard && !$wallets$?.length}
			<div class="flex flex-col gap-2">
				<button
					class="w-full rounded-lg bg-brandAction px-6 py-3 font-medium text-brandBackground transition-colors hover:bg-brandAction/80"
					on:click={() => onboard.connectWallet()}
				>
					Connect Wallet
				</button>
			</div>
		{/if}

		{#if $wallets$}
			{#each $wallets$ as { provider }}
				<div class="flex flex-col gap-2 sm:gap-4">
					<!-- V2 contract toggle -->
					<!-- <div class="mb-4 flex items-center gap-2">
						<span class="text-sm font-medium text-brandBackground/80">Contract Version</span>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={v2Contract} class="peer sr-only" />
							<div
								class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brandAction peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brandAction/20 rtl:peer-checked:after:-translate-x-full"
							></div>
							<span class="ms-3 text-sm font-medium text-brandBackground/80">
								{v2Contract ? 'V2' : 'V1'}
							</span>
						</label>
					</div> -->

					<div class="flex items-center justify-between gap-5">
						<div class="flex w-full flex-col gap-1">
							<label for="read-chain" class="ml-1 text-xs font-medium text-brandBackground/80"
								>Estimates For</label
							>
							<select
								id="read-chain"
								bind:value={selectedReadChain}
								class="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
							>
								{#each orderAndFilterReadableChainsAlphabetically() as [key, chain]}
									<option value={key}>{chain.display}</option>
								{/each}
							</select>
						</div>
						<div class="flex w-full flex-col gap-1">
							<label for="write-chain" class="ml-1 text-xs font-medium text-brandBackground/80"
								>Write To</label
							>
							<select
								id="write-chain"
								bind:value={selectedWriteChain}
								class="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
							>
								{#each orderAndFilterChainsAlphabetically() as [key, chain]}
									<option value={key}>{chain.display}</option>
								{/each}
							</select>
						</div>
					</div>
					<button
						class="w-full rounded-lg bg-brandAction px-6 py-3 font-medium text-brandBackground transition-colors hover:bg-brandAction/80"
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

					{#if pValues}
						<Drawer {isDrawerOpen}>
							<pre
								class="m-0 overflow-x-auto bg-gray-50 p-2 text-xs leading-relaxed text-gray-800 sm:p-6 sm:text-sm">{JSON.stringify(
									pValues,
									formatBigInt,
									2
								)}</pre>
						</Drawer>
						{#if pRaw}
							Raw Data:
							<pre
								class="m-0 overflow-scroll overflow-x-auto bg-gray-50 p-2 text-xs leading-relaxed text-gray-800 sm:p-6 sm:text-sm">{pRaw}</pre>
						{/if}
						<p>
							Data created on GasNet at: {new Date(Number(pValues.timestamp)).toLocaleString(
								undefined,
								{
									timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
									dateStyle: 'medium',
									timeStyle: 'long'
								}
							)}
						</p>
					{/if}
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
								class="h-12 w-12 animate-spin rounded-full border-4 border-brandBackground/20 border-t-brandBackground"
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
								href={`${writableChains[selectedWriteChain].blockExplorerUrl}/tx/${transactionHash}`}
								target="_blank"
								rel="noopener noreferrer"
								class="overflow-hidden text-ellipsis text-blue-500 hover:underline"
							>
								{`${writableChains[selectedWriteChain].blockExplorerUrl}/tx/${transactionHash}`}
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

					<div class="flex w-full flex-col items-center justify-between gap-4">
						<div class="flex w-full items-start justify-between gap-5">
							{#if !v2Contract}
								<div class="flex w-full flex-col gap-1">
									<label
										for="quantile-select"
										class="ml-1 text-xs font-medium text-brandBackground/80">Read Quantile</label
									>
									<select
										id="quantile-select"
										bind:value={selectedQuantile}
										class="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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
							{/if}
							<div class="flex w-full flex-col gap-1">
								<label for="timeout-select" class="ml-1 text-xs font-medium text-brandBackground/80"
									>Recency</label
								>
								<select
									id="timeout-select"
									bind:value={selectedTimeout}
									class="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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
							class="w-full rounded-lg bg-brandAction px-6 py-3 font-medium text-brandBackground transition-colors hover:bg-brandAction/80"
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
						{#if v2PublishedGasData}
							<div class="w-full text-left">
								Data read from {writableChains[selectedWriteChain].display} at: {readGasDataFromTargetChainTime}
							</div>
							<div
								class="my-4 flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-gray-200"
							>
								Typ 2 data:
								<pre
									class="m-0 overflow-scroll overflow-x-auto bg-gray-50 p-2 text-xs leading-relaxed text-gray-800 sm:p-6 sm:text-sm">{JSON.stringify(
										v2PublishedGasData,
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
		--w3o-background-color: #fce9cf;
		--w3o-text-color: #280019;
		--w3o-border-color: hsl(35 88% 70% / 1);
		--w3o-action-color: #fb3d00;
		--w3o-border-radius: 1rem;
	}
</style>
