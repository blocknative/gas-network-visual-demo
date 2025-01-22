<script lang="ts">
	import { onMount } from 'svelte'
	import { map, share } from 'rxjs/operators'
	import { timer, type Observable } from 'rxjs'
	import type { OnboardAPI, WalletState } from '@web3-onboard/core'
	import {
		ReadableChainKey,
		WritableChainKey,
		type PayloadValues,
		type VPayload
	} from '$lib/@types/types'
	import { getOnboard } from '$lib/services/web3-onboard'
	import {
		readableChains,
		writableChains,
		quantiles,
		gasNetwork,
		archSchemaMap,
		evmTypeSchema,
		evmV2ContractTypValues,
		mainnetV2ContractTypValues
	} from '../constants'
	import consumerV2 from '$lib/abis/consumerV2.json'
	import gasnetV2 from '$lib/abis/gasnetV2.json'
	import consumer from '$lib/abis/consumer.json'
	import gasnet from '$lib/abis/gasnet.json'
	import type { EstimationData, QuantileMap } from '$lib/@types/types'
	import Drawer from '$lib/components/Drawer.svelte'
	import { createEstimationObject } from '$lib/utils'
	import type { Contract } from 'ethers'

	let publishedGasData: {
		gasPrice: string
		maxPriorityFeePerGas: string
		maxFeePerGas: string
	} | null = null
	let v2PublishedGasData: Record<string, number | bigint> | null = null
	let v2RawData: Record<number, [string, number, number]> = {} as Record<
		number,
		[string, number, number]
	>

	let v2ContractValues: PayloadValues | null = null
	let v2ContractRawRes: string | null = null
	let gasEstimation: EstimationData | null = null
	let transactionSignature: string | null = null
	let transactionHash: string | null = null
	let publishErrorMessage: string | null = null
	let readFromGasNetErrorMessage: string | null = null
	let v2NoDataFoundErrorMsg: string | null = null
	let readFromTargetNetErrorMessage: string | null = null
	let v2Timestamp: number | null = null
	let isLoading = false
	let isDrawerOpen = true
	let wallets$: Observable<WalletState[]>
	let readGasDataFromTargetChainTime: string

	// Update your selected chain variables to use the enums
	let selectedReadChain: ReadableChainKey = ReadableChainKey.MAIN
	let selectedWriteChain: WritableChainKey = WritableChainKey.SEPOLIA
	let selectedQuantile: keyof QuantileMap = 'Q99'
	let selectedTimeout = 3600000
	let v2ContractEnabled = false

	let onboard: OnboardAPI
	onMount(async () => {
		onboard = await getOnboard()
		const savedSetting = localStorage.getItem('v2ContractEnabled')
		if (savedSetting !== null) {
			v2ContractEnabled = savedSetting === 'true'
		}
	})

	// Create a reactive timer that updates when v2Timestamp changes
	$: timeElapsed$ = v2Timestamp
		? timer(0, 1000).pipe(
				map(() => getTimeElapsed(v2Timestamp!)),
				share()
			)
		: null

	function getTimeElapsed(timestamp: number) {
		const diff = Date.now() - timestamp
		const seconds = Math.floor(diff / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)

		if (hours > 0) return `${hours}h ago`
		if (minutes > 0) return `${minutes}m ago`
		return `${seconds}s ago`
	}

	$: if (onboard) {
		wallets$ = onboard.state.select('wallets').pipe(share())
	}

	$: if (v2ContractEnabled) {
		selectedWriteChain = WritableChainKey.LINEA_SEPOLIA
	} else {
		selectedWriteChain = WritableChainKey.SEPOLIA
	}

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

			const rpcProvider = new ethers.JsonRpcProvider(gasNetwork.url)
			if (v2ContractEnabled) {
				const gasNetContract = new ethers.Contract(gasNetwork.v2Contract, gasnetV2.abi, rpcProvider)

				const { arch } = readableChains[selectedReadChain]
				const payload = await gasNetContract.getValues(archSchemaMap[arch], chain)

				return { paramsPayload: parsePayload(payload), rawReadChainData: payload }
			} else {
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

	async function handleV2OracleValues(gasNetContract: Contract) {
		try {
			v2RawData = {} as Record<number, [string, number, number]>
			const arch = archSchemaMap[readableChains[selectedReadChain].arch]
			const { chainId, display } = readableChains[selectedReadChain]
			v2NoDataFoundErrorMsg = null
			v2Timestamp = null

			let blockNumber
			let estTimestamp
			const v2ValuesObject = await (
				chainId === 1 ? mainnetV2ContractTypValues : evmV2ContractTypValues
			).reduce(async (accPromise, typ) => {
				const acc = await accPromise
				const contractRespPerType = await gasNetContract.getInTime(
					arch,
					chainId,
					typ,
					selectedTimeout
				)

				const [value, height, timestamp] = contractRespPerType
				if (value === 0n && height === 0n && timestamp === 0n) {
					v2NoDataFoundErrorMsg = `Estimate not available for ${display} at selected recency`
				}

				blockNumber = height
				estTimestamp = timestamp

				const resDataMap = evmTypeSchema?.[typ]
				if (!resDataMap) {
					console.error(
						`No resDataMap found within the Type Map Schema for arch: ${arch}, chainId: ${chainId}, typ: ${typ}`
					)
					return acc
				}

				v2RawData[typ] = [value, height, timestamp]
				v2Timestamp = Number(timestamp)
				return {
					'Estimate Timestamp': new Date(Number(estTimestamp)).toLocaleString(undefined, {
						timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						dateStyle: 'medium',
						timeStyle: 'long'
					}),
					'Estimate Block Number': blockNumber,
					...acc,
					// Added for validation
					[resDataMap.description]: (Number(value) / 1e9).toPrecision(4)
				}
			}, Promise.resolve({}))
			if (v2ValuesObject) {
				v2PublishedGasData = v2ValuesObject
			}
		} catch (error) {
			v2PublishedGasData = null
			v2Timestamp = null
			isLoading = false
			console.error('Error Reading V2 Published Data:', error)
			const revertErrorFromContract = (error as any)?.info?.error?.message || (error as any)?.reason
			readFromTargetNetErrorMessage = revertErrorFromContract || (error as string)
		}
	}

	async function readFromOracle(provider: any) {
		try {
			readFromTargetNetErrorMessage = null
			await onboard.setChain({ chainId: writableChains[selectedWriteChain].chainId })

			const { ethers } = await loadEthers()
			const ethersProvider = new ethers.BrowserProvider(provider, 'any')
			const signer = await ethersProvider.getSigner()
			const contractAddress =
				v2ContractEnabled && writableChains[selectedWriteChain].v2Contract
					? writableChains[selectedWriteChain].v2Contract!
					: writableChains[selectedWriteChain].contract!

			const gasNetContract = new ethers.Contract(
				contractAddress,
				v2ContractEnabled ? consumerV2.abi : consumer.abi,
				signer
			)

			readGasDataFromTargetChainTime = new Date().toLocaleString(undefined, {
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				dateStyle: 'medium',
				timeStyle: 'long'
			})

			if (v2ContractEnabled) {
				v2PublishedGasData = null
				handleV2OracleValues(gasNetContract)
			} else {
				const [gasPrice, maxPriorityFeePerGas, maxFeePerGas] =
					await gasNetContract.getGasEstimationQuantile(
						BigInt(readableChains[selectedReadChain].chainId),
						BigInt(selectedTimeout / 1000),
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
			console.error('Gas data read published data error:', error)
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
			const contractAddress =
				v2ContractEnabled && writableChains[selectedWriteChain].v2Contract
					? writableChains[selectedWriteChain].v2Contract!
					: writableChains[selectedWriteChain].contract!

			const consumerContract = new ethers.Contract(
				contractAddress,
				v2ContractEnabled ? consumerV2.abi : consumer.abi,
				signer
			)

			let transaction
			if (v2ContractEnabled) {
				transaction = await consumerContract.storeValues(v2ContractRawRes)
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
				value: '0x' + value.toString('hex')
			} as VPayload)
		}

		// ... and signature
		return pV
	}

	async function handleGasEstimation(provider: any, readChainId: number, writeChainId: number) {
		publishErrorMessage = null
		readFromGasNetErrorMessage = null
		gasEstimation = null
		v2ContractValues = null
		try {
			const gasNetData = await fetchGasEstimationFromGasNet(readChainId.toString())
			if (!gasNetData) {
				throw new Error('No data received from GasNet')
			}

			if (v2ContractEnabled) {
				const { paramsPayload, rawReadChainData } = gasNetData as any

				if (!paramsPayload) {
					throw new Error(`Failed to fetch V2 gas estimation: ${gasNetData?.paramsPayload}`)
				}

				v2ContractValues = paramsPayload
				v2ContractRawRes = rawReadChainData
			} else {
				const { estimationData, signature } = gasNetData as any
				if (!estimationData || !signature) {
					throw new Error(`Failed to fetch gas estimation or signature`)
				}

				gasEstimation = estimationData
			}

			await onboard.setChain({ chainId: writeChainId })
			await publishGasEstimation(provider)
		} catch (e) {
			console.error(e)
		}
	}

	function formatBigInt(key: string, value: any) {
		return typeof value === 'bigint' ? value.toString() : value
	}

	function orderAndFilterChainsAlphabetically() {
		const rChains = v2ContractEnabled
			? Object.entries(writableChains).filter((chain) => chain[1].v2Contract)
			: Object.entries(writableChains).filter((chain) => chain[1].contract)
		return rChains.sort((a, b) => {
			return a[1].display.localeCompare(b[1].display)
		})
	}

	function orderAndFilterReadableChainsAlphabetically() {
		return Object.entries(readableChains).sort((a, b) => {
			if (a[0] === 'unsupportedChain') return 1
			if (b[0] === 'unsupportedChain') return -1
			return a[1].display.localeCompare(b[1].display)
		})
	}

	function updateV2ContractSetting(value: boolean) {
		v2ContractEnabled = value
		publishedGasData = null
		v2PublishedGasData = null
		localStorage.setItem('v2ContractEnabled', String(value))
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
					<div class="mb-4 flex items-center gap-2">
						<span class="text-sm font-medium text-brandBackground/80">Contract Version</span>
						<label class="relative inline-flex cursor-pointer items-center">
							<input
								type="checkbox"
								bind:checked={v2ContractEnabled}
								on:change={() => updateV2ContractSetting(v2ContractEnabled)}
								class="peer sr-only"
							/>
							<div
								class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brandAction peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brandAction/20 rtl:peer-checked:after:-translate-x-full"
							></div>
							<span class="ms-3 text-sm font-medium text-brandBackground/80">
								{v2ContractEnabled ? 'V2' : 'V1'}
							</span>
						</label>
					</div>

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

					{#if v2ContractValues}
						<Drawer {isDrawerOpen}>
							<pre
								class="m-0 overflow-x-auto bg-gray-50 p-1 text-xs text-gray-800 sm:p-6 sm:text-sm">{JSON.stringify(
									v2ContractValues,
									formatBigInt,
									2
								)}</pre>
						</Drawer>
						{#if v2ContractRawRes}
							Raw Data:
							<pre
								class="m-0 overflow-x-auto bg-gray-50 p-1 text-xs text-gray-800 sm:p-6 sm:text-sm">{v2ContractRawRes}</pre>
						{/if}
						<p>
							Data created on GasNet at: {new Date(
								Number(v2ContractValues.timestamp)
							).toLocaleString(undefined, {
								timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
								dateStyle: 'medium',
								timeStyle: 'long'
							})}
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
							{#if !v2ContractEnabled}
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
									<option value={10000}>10 Sec</option>
									<option value={30000}>30 Sec</option>
									<option value={60000}>1 Min</option>
									<option value={3600000}>1 Hr</option>
									<option value={86400000}>1 Day</option>
									<option value={604800000}>1 Week</option>
								</select>
							</div>
						</div>
						<button
							class="w-full rounded-lg bg-brandAction px-6 py-3 font-medium text-brandBackground transition-colors hover:bg-brandAction/80"
							on:click={() => readFromOracle(provider)}
						>
							Read {readableChains[selectedReadChain].display} Estimations from {writableChains[
								selectedWriteChain
							].display}
							{#if !v2ContractEnabled}<span>for the {quantiles[selectedQuantile]} Quantile</span
								>{/if}
						</button>

						{#if publishedGasData}
							<div class="w-full text-left">
								Data read from {writableChains[selectedWriteChain].display} at: {readGasDataFromTargetChainTime}
							</div>
							<div
								class="my-2 flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-gray-200"
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
							{#if v2NoDataFoundErrorMsg}
								<div class="w-full overflow-auto rounded-lg border border-red-500 p-4 text-red-500">
									{v2NoDataFoundErrorMsg}
								</div>
							{:else}
								<div class="w-full text-left">
									Data read from {writableChains[selectedWriteChain].display} at: {readGasDataFromTargetChainTime}
								</div>
								<div
									class="my-2 flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-gray-200 p-1"
								>
									Read Raw Data:
									<pre
										class="m-0 overflow-scroll overflow-x-auto bg-gray-50 p-2 text-xs leading-relaxed text-gray-800 sm:p-6 sm:text-sm">{JSON.stringify(
											v2RawData,
											formatBigInt,
											2
										)}</pre>
								</div>
								<div class="mx-2 my-4 flex w-full flex-col gap-2 pb-3 text-xs sm:text-sm">
									{#each Object.entries(v2PublishedGasData) as [key, value]}
										<div class="flex justify-between gap-4 py-1">
											<span class="font-medium">{key}:</span>
											{#if key.includes('Gas')}
												<span>{typeof value === 'bigint' ? value.toString() : value} gwei</span>
											{:else}
												<div>
													<span>{value}</span>
													{#if timeElapsed$ && key === 'Estimate Timestamp'}
														<span>{` (${$timeElapsed$})`}</span>
													{/if}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
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
