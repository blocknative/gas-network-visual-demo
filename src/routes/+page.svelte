<script lang="ts">
	import { onMount } from 'svelte'
	import { map, share } from 'rxjs/operators'
	import { timer, type Observable } from 'rxjs'
	import type { OnboardAPI, WalletState } from '@web3-onboard/core'
	import {
		OracleVersion,
		WritableNetworkType,
		type PayloadValues,
		type VPayload
	} from '$lib/@types/types'
	import { getOnboard } from '$lib/services/web3-onboard'
	import {
		quantiles,
		gasNetwork,
		archSchemaMap,
		evmTypeSchema,
		DEFAULT_READ_CHAIN_ID,
		UNSUPPORTED_CHAIN,
		LOCAL_SETTING_KEY,
		defaultOracleTestnetChainId,
		defaultOracleMainnetChainId
	} from '../constants'
	import consumerV2 from '$lib/abis/consumerV2.json'
	import gasnetV2 from '$lib/abis/gasnetV2.json'
	import consumer from '$lib/abis/consumer.json'
	import gasnet from '$lib/abis/gasnet.json'
	import type {
		EstimationData,
		LocalSettings,
		OracleVersions,
		QuantileMap,
		ReadChain,
		OracleChain
	} from '$lib/@types/types'
	import Drawer from '$lib/components/Drawer.svelte'
	import { createEstimationObject, getOracleByChainId, getTypValuesByArch } from '$lib/utils'
	import type { Contract } from 'ethers'
	import { fetchChains, fetchOracleChains } from '$lib/services/api'
	import gasNetIcon from '$lib/svg/new-gas-net-icon.svg?raw'

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

	let selectedReadChain: ReadChain
	let selectedWriteChain: OracleChain
	let selectedQuantile: keyof QuantileMap
	let selectedTimeout: number
	let contractVersion: number
	let writableNetworkType: WritableNetworkType

	let localSettings: LocalSettings = {
		oracleVersion: undefined,
		networkType: undefined,
		readChain: undefined,
		writeChain: undefined,
		quantile: undefined,
		timeout: undefined
	}

	let readableChains: ReadChain[] | undefined = undefined
	let writableChains: OracleChain[] | undefined = undefined
	let onboard: OnboardAPI
	onMount(async () => {
		readableChains = await fetchChains()
		if (!readableChains) {
			throw new Error('Failed to fetch chains')
		}
		writableChains = await fetchOracleChains()
		if (!writableChains) {
			throw new Error('Failed to fetch chains')
		}
		onboard = await getOnboard()
		handleLocalStorageSettings(readableChains, writableChains)
	})

	$: if (
		selectedWriteChain ||
		selectedQuantile ||
		selectedTimeout ||
		writableNetworkType ||
		selectedReadChain
	) {
		localSettings = {
			oracleVersion: contractVersion,
			networkType: writableNetworkType,
			readChain: selectedReadChain,
			writeChain: selectedWriteChain,
			quantile: selectedQuantile,
			timeout: selectedTimeout
		}
		localStorage.setItem('bn-gas-demo-settings', JSON.stringify(localSettings))
	}

	// Create a reactive timer that updates when v2Timestamp changes
	$: timeElapsed$ = v2Timestamp
		? timer(0, 1000).pipe(
				map(() => getTimeElapsed(v2Timestamp!)),
				share()
			)
		: null

	$: v2TestnetsAvailable =
		contractVersion === OracleVersion.v2 &&
		writableChains?.some((chain) => chain.addressByVersion[2] && !chain.testnet)

	$: if (onboard) {
		wallets$ = onboard.state.select('wallets').pipe(share())
	}

	function handleLocalStorageSettings(readableChains: ReadChain[], oracleChains: OracleChain[]) {
		const oldSavedSetting = localStorage.getItem('contractVersion')
		if (oldSavedSetting) {
			contractVersion = Number(oldSavedSetting)
			localSettings.oracleVersion = contractVersion
			localStorage.removeItem('contractVersion')
		}

		const savedSettings = localStorage.getItem(LOCAL_SETTING_KEY)
		localSettings = JSON.parse(savedSettings ?? '{}')
		const { oracleVersion, networkType, readChain, writeChain, quantile, timeout } = localSettings
		// Check for deprecated Writable/Old Chain Key
		if (writeChain && typeof writeChain !== 'object') {
			selectedWriteChain = getOracleByChainId(
				oracleChains,
				writeChain ?? defaultOracleMainnetChainId
			)
		} else {
			selectedWriteChain = getOracleByChainId(
				oracleChains,
				writeChain?.chainId ?? defaultOracleMainnetChainId
			)
		}

		selectedQuantile = quantile ?? 'Q99'
		selectedTimeout = timeout ?? 3600000
		writableNetworkType = networkType ?? WritableNetworkType.MAINNET
		selectedReadChain = readableChains.find(
			(c) => c.chainId === (readChain?.chainId ?? DEFAULT_READ_CHAIN_ID)
		)!
		contractVersion = OracleVersion.v2
	}

	let ethersModule: typeof import('ethers')
	async function loadEthers() {
		if (!ethersModule) {
			ethersModule = await import('ethers')
		}
		return ethersModule
	}

	function getTimeElapsed(timestamp: number) {
		const diff = Date.now() - timestamp
		const seconds = Math.floor(diff / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const remainingSeconds = seconds % 60

		if (hours > 0) return `${hours}h ago`
		if (minutes > 0) return `${minutes}m ${remainingSeconds}s ago`
		return `${seconds}s ago`
	}

	async function fetchGasEstimationFromGasNet(chain: string) {
		isLoading = true
		transactionHash = null
		try {
			const { ethers } = await loadEthers()

			const rpcProvider = new ethers.JsonRpcProvider(gasNetwork.url)
			if (contractVersion === OracleVersion.v2) {
				const gasNetContract = new ethers.Contract(gasNetwork.v2Contract, gasnetV2.abi, rpcProvider)

				const { arch } = selectedReadChain

				// This assumes any non-evm chain architectures we support does not have L2s of sub chains with different chain IDs
				// Will change when we pass in systemID/OracleID per chain
				let networkId = selectedReadChain.arch === 'evm' ? chain : 1

				const payload = await gasNetContract.getValues(archSchemaMap[arch], networkId)

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
			const arch = archSchemaMap[selectedReadChain.arch]
			let { chainId, label } = selectedReadChain
			v2NoDataFoundErrorMsg = null
			v2Timestamp = null

			const typVal = getTypValuesByArch(arch, chainId)
			const evmChain = selectedReadChain.arch === 'evm' ? true : false

			const v2ValuesObject = await typVal.reduce(async (accPromise, typ) => {
				const acc = await accPromise
				const contractRespPerType = await gasNetContract.getInTime(
					arch,

					// This assumes any non-evm chain architectures we support does not have L2s of sub chains with different chain IDs
					// Will change when we pass in systemID/OracleID per chain
					evmChain ? chainId : 1,
					typ,
					selectedTimeout
				)

				const [value, height, timestamp] = contractRespPerType
				if (value === 0n && height === 0n && timestamp === 0n) {
					v2NoDataFoundErrorMsg = `Estimate not available for ${label} at selected recency`
				}

				const blockNumber = height
				const estTimestamp = timestamp

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
					...(chainId > 0 ? { 'Chain ID': chainId } : {}),
					Timestamp: new Date(Number(estTimestamp)).toLocaleString(undefined, {
						timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						dateStyle: 'medium',
						timeStyle: 'long'
					}),
					'Block Number': blockNumber,
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
			await onboard.setChain({ chainId: selectedWriteChain.chainId })

			const { ethers } = await loadEthers()
			const ethersProvider = new ethers.BrowserProvider(provider, 'any')
			const signer = await ethersProvider.getSigner()
			const contractAddress =
				contractVersion === OracleVersion.v2 && selectedWriteChain.addressByVersion[2]
					? selectedWriteChain.addressByVersion[2]!
					: selectedWriteChain.addressByVersion[1]!

			const gasNetContract = new ethers.Contract(
				contractAddress,
				contractVersion === OracleVersion.v2 ? consumerV2.abi : consumer.abi,
				signer
			)

			readGasDataFromTargetChainTime = new Date().toLocaleString(undefined, {
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				dateStyle: 'medium',
				timeStyle: 'long'
			})

			if (contractVersion === OracleVersion.v2) {
				v2PublishedGasData = null
				handleV2OracleValues(gasNetContract)
			} else {
				const [gasPrice, maxPriorityFeePerGas, maxFeePerGas] =
					await gasNetContract.getGasEstimationQuantile(
						BigInt(selectedReadChain.chainId),
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
				contractVersion === OracleVersion.v2 && selectedWriteChain.addressByVersion[2]
					? selectedWriteChain.addressByVersion[2]!
					: selectedWriteChain.addressByVersion[1]!

			const consumerContract = new ethers.Contract(
				contractAddress,
				contractVersion === OracleVersion.v2 ? consumerV2.abi : consumer.abi,
				signer
			)
			const networkFee = await consumerContract.getNetworkFee()

			let transaction
			if (contractVersion === OracleVersion.v2) {
				transaction = await consumerContract.storeValues(v2ContractRawRes, {
					value: networkFee ?? 0n
				})
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

			if (contractVersion === OracleVersion.v2) {
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
		return writableChains!
			?.filter((chain) => {
				const hasRequiredContract =
					contractVersion === OracleVersion.v2
						? chain.addressByVersion[2]
						: chain.addressByVersion[1]
				const matchesTestnetFilter =
					writableNetworkType === WritableNetworkType.MAINNET ? !chain.testnet : chain.testnet
				const testNetFilter =
					writableNetworkType === WritableNetworkType.TESTNET
						? chain.chainId === 11155111 || chain.chainId === 84532
						: !chain.testnet
				return hasRequiredContract && matchesTestnetFilter && testNetFilter
			})
			.sort((a, b) => a.label.localeCompare(b.label))
	}

	function orderAndFilterReadableChainsAlphabetically() {
		return [...readableChains!, UNSUPPORTED_CHAIN].sort((a, b) => {
			if (a.arch === 'unsupported') return 1
			if (b.arch === 'unsupported') return -1
			return a.label.localeCompare(b.label)
		})
	}

	let lastSelectChainOfDifferentContractVersion: OracleChain | null = null

	function updateContractSetting(version: OracleVersions) {
		contractVersion = version
		publishedGasData = null
		v2PublishedGasData = null
		// if (version === OracleVersion.v1) {
		// 	writableNetworkType = WritableNetworkType.TESTNET
		// }
		if (!Object.keys(selectedWriteChain.addressByVersion).includes(version.toString())) {
			selectedWriteChain =
				writableNetworkType === WritableNetworkType.MAINNET && selectedWriteChain.testnet
					? getOracleByChainId(writableChains!, defaultOracleMainnetChainId)
					: getOracleByChainId(writableChains!, defaultOracleTestnetChainId)
		}
	}

	function updateDisplayWritableMainnets() {
		console.log(lastSelectChainOfDifferentContractVersion)
		if (!lastSelectChainOfDifferentContractVersion) {
			lastSelectChainOfDifferentContractVersion = selectedWriteChain
			selectedWriteChain =
				writableNetworkType === WritableNetworkType.MAINNET && selectedWriteChain.testnet
					? getOracleByChainId(writableChains!, defaultOracleMainnetChainId)
					: getOracleByChainId(writableChains!, defaultOracleTestnetChainId)
			return
		}
		if (lastSelectChainOfDifferentContractVersion) {
			const tempLastChain = selectedWriteChain
			selectedWriteChain = lastSelectChainOfDifferentContractVersion
			lastSelectChainOfDifferentContractVersion = tempLastChain
			return
		}
	}
</script>

<main class="h-full min-h-[100vh] w-full bg-black p-4 font-sans text-white sm:p-6">
	<div
		class="mx-auto max-w-3xl rounded-xl border border-gray-800 bg-brandForeground p-6 shadow-2xl sm:p-8"
	>
		<div class="relative mb-6 flex w-full flex-col items-center gap-6">
			<div class="flex w-72 items-center">
				{@html gasNetIcon}
			</div>
			<h1 class="text-center font-sans text-5xl font-normal text-white">Gas Network</h1>
			<p class="text-center font-sans text-2xl font-light">Unlocking Gas Markets For All Chains</p>
		</div>

		{#if onboard && !$wallets$?.length}
			<div class="flex w-full justify-center">
				<button
					class="w-full max-w-72 rounded-full bg-brandAction px-8 py-4 text-lg font-medium text-black transition-all hover:bg-brandAction/70"
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
					<div class="flex items-center justify-between gap-5">
						<div class="flex w-full justify-center">
							<!-- <div class="mb-4 flex flex-col items-center gap-2">
								<label for="contract-version" class="text-sm font-medium text-white"
									>Contract Version</label
								>
								<select
									id="contract-version"
									bind:value={contractVersion}
									on:change={() => updateContractSetting(contractVersion as OracleVersions)}
									class="w-full cursor-pointer rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-800 hover:border-brandAction focus:border-brandAction focus:ring-2 focus:ring-brandAction/10"
								>
									<option value={1}>V1 Oracle</option>
									<option value={2}>V2 Oracle</option>
								</select>
							</div> -->
							<div class="mb-4 flex flex-col items-center gap-2">
								<label for="network-type" class="text-sm font-medium text-white">Network Type</label
								>

								<select
									id="network-type"
									bind:value={writableNetworkType}
									on:change={() => updateDisplayWritableMainnets()}
									disabled={!v2TestnetsAvailable}
									class="w-full cursor-pointer rounded-lg border px-3 py-2 text-sm text-gray-800 hover:border-brandAction focus:border-brandAction focus:ring-2 focus:ring-brandAction/10"
								>
									<option value={WritableNetworkType.TESTNET}>Testnet</option>
									<option value={WritableNetworkType.MAINNET}>Mainnet</option>
								</select>
							</div>
						</div>
					</div>

					<div class="flex items-center justify-between gap-5">
						<div class="flex w-full flex-col gap-1">
							<label for="read-chain" class="ml-1 text-xs font-medium text-white"
								>Estimates For</label
							>
							<select
								id="read-chain"
								bind:value={selectedReadChain}
								class="w-full cursor-pointer rounded-lg border px-3 py-3 text-sm text-gray-800 hover:border-brandAction focus:border-brandAction focus:ring-2 focus:ring-brandAction/10"
							>
								{#each orderAndFilterReadableChainsAlphabetically() as chain}
									<option value={chain}>{chain.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex w-full flex-col gap-1">
							<label for="write-chain" class="ml-1 text-xs font-medium text-white">Write To</label>
							<select
								id="write-chain"
								bind:value={selectedWriteChain}
								class="w-full cursor-pointer rounded-lg border px-3 py-3 text-sm text-gray-800 hover:border-brandAction focus:border-brandAction focus:ring-2 focus:ring-brandAction/10"
							>
								{#each orderAndFilterChainsAlphabetically() as chain}
									<option value={chain}>{chain.label}</option>
								{/each}
							</select>
						</div>
					</div>
					<button
						class="w-full rounded-lg bg-brandAction px-6 py-3 font-medium text-black transition-all hover:bg-brandAction/70 sm:rounded-full"
						on:click={() =>
							handleGasEstimation(provider, selectedReadChain.chainId, selectedWriteChain.chainId)}
					>
						Write {selectedReadChain.label} Estimations to {selectedWriteChain.label}
					</button>

					{#if v2ContractValues}
						<Drawer {isDrawerOpen}>
							<pre
								class="m-0 overflow-auto bg-[#141414] p-4 text-sm text-gray-300 sm:p-6">{JSON.stringify(
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
						<div class="my-2 flex flex-col items-center gap-2">
							<div
								class="h-14 w-14 animate-spin rounded-full border-4 border-brandAccent/30 border-t-brandAccent"
							></div>
							<p class="text-center text-brandAccent/90 sm:text-left">
								Please Check Connected Browser Wallet for Progress
							</p>
						</div>
					{/if}

					{#if transactionHash}
						<div class="my-4 flex flex-col gap-2">
							<p class="text-white">Confirmed Hash:</p>
							<a
								href={`${selectedWriteChain.blockExplorerUrl}/tx/${transactionHash}`}
								target="_blank"
								rel="noopener noreferrer"
								class="overflow-hidden text-ellipsis text-blue-500 hover:underline"
							>
								{`${selectedWriteChain.blockExplorerUrl}/tx/${transactionHash}`}
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
						<div class="flex w-full items-start justify-between gap-4">
							<!-- {#if contractVersion === OracleVersion.v1}
								<div class="flex w-full flex-col gap-1">
									<label for="quantile-select" class="ml-1 text-xs font-medium text-white"
										>Read Quantile</label
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
							{/if} -->
							<div class="flex w-full flex-col gap-1">
								<label for="timeout-select" class="ml-1 text-xs font-medium text-white"
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
							class="w-full rounded-lg bg-brandAction px-6 py-3 font-medium text-brandBackground transition-colors hover:bg-brandAction/70 sm:rounded-full"
							on:click={() => readFromOracle(provider)}
						>
							Read {selectedReadChain.label} Estimations from {selectedWriteChain.label}
							<!-- {#if contractVersion === OracleVersion.v1}<span
									>for the {quantiles[selectedQuantile]} Quantile</span
								>{/if} -->
						</button>

						{#if publishedGasData}
							<div class="w-full text-left">
								Data read from {selectedWriteChain.label} at: {readGasDataFromTargetChainTime}
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
									Data read from {selectedWriteChain.label} at: {readGasDataFromTargetChainTime}
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
								<div class="mx-2 my-3 flex w-full flex-col gap-2 pb-3 text-xs sm:text-sm">
									{#each Object.entries(v2PublishedGasData) as [key, value]}
										<div class="flex justify-between gap-4 py-1">
											<span class="font-medium">{key}:</span>
											{#if key.includes('Fee') && selectedReadChain.arch === 'evm'}
												<span>{typeof value === 'bigint' ? value.toString() : value} gwei</span>
											{:else if key.includes('Fee') && selectedReadChain.arch === 'utxo'}
												<span>{typeof value === 'bigint' ? value.toString() : value} sats</span>
											{:else}
												<div>
													<span>{value}</span>
													{#if timeElapsed$ && key === 'Timestamp'}
														<br /><span class="flex" style="justify-content: right"
															>{` (${$timeElapsed$})`}</span
														>
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

		<br />
		<div class="flex justify-center">
			<span
				class="mt-4 rounded-full border border-brandAction px-6 py-3 text-sm font-medium text-brandAction transition-colors hover:bg-brandAction/10"
			>
				<a href="https://gasnetwork.notion.site/" target="_blank">Documentation</a>
			</span>
		</div>
	</div>
</main>

<style>
	:root {
		--w3o-background-color: #1c1c1c;
		--w3o-text-color: #ffffff;
		--w3o-border-color: #333333;
		--w3o-action-color: #59fbf5;
		--w3o-border-radius: 0.75rem;
	}

	/* Update select styling */
	select {
		@apply border-gray-700 bg-brandForeground text-white;
		background-position: right 4px center; /* Move chevron 4px from the right */
	}

	/* If the above doesn't work, this is a more specific approach */
	select::-ms-expand {
		margin-right: 4px;
	}

	/* For webkit browsers */
	select {
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
		background-position: right 4px center;
		background-repeat: no-repeat;
		background-size: 1.5em;
		padding-right: 2.5em;
	}

	/* Update pre/code blocks */
	pre {
		@apply border border-gray-700 bg-brandForeground text-gray-300;
	}

	/* Add subtle glow effect to main action buttons */
	button {
		box-shadow: 0 0 20px rgba(0, 248, 226, 0.1);
	}

	/* Improve scrollbar styling for the content area */
	:global(.overflow-x-auto::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-track) {
		background: #1c1c1c;
		border-radius: 4px;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-thumb) {
		background: #333;
		border-radius: 4px;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-thumb:hover) {
		background: #444;
	}
</style>
