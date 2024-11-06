<script lang="ts">
  import { share } from 'rxjs/operators'
  import {
    type GasEstimate,
    type EstimationData,
    ReadableChainKey,
    WritableChainKey
  } from './types'
  import { createEstimationObject } from './utils'
  import { getOnboard } from './services/web3-onboard'
  import {
    GASNET_URL,
    GASNET_CONTRACT_ADDRESS,
    GASNET_CONTRACT_ADDRESS_SEPOLIA,
    readableChains,
    writableChains,
    quantiles
  } from './constants'
  import consumer from './abis/consumer.json'
  import gasnet from './abis/gasnet.json'
  import { slide } from 'svelte/transition'
  import type { OnboardAPI, WalletState } from '@web3-onboard/core'
  import { onMount } from 'svelte'
  import type { Observable } from 'rxjs'

  const GAS_ESTIMATION_DELAY = 600000 // seconds

  let gasEstimation: EstimationData | null = null
  let publishedGasData: GasEstimate | null = null
  let transactionSignature: string | null = null
  let transactionHash: string | null = null
  let errorMessage: string | null = null
  let isLoading = false
  let isDrawerOpen = true // Starts open by default
  let wallets$: Observable<WalletState[]>
  let mounted = false

  // Update your selected chain variables to use the enums
  let selectedReadChain: ReadableChainKey = ReadableChainKey.MAIN
  let selectedWriteChain: WritableChainKey = WritableChainKey.SEPOLIA
  let selectedQuantile = `Q${quantiles.Q99}`

  let onboard: OnboardAPI
  onMount(async () => {
    mounted = true
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

  async function fetchGasEstimationFromGasNet(chain: string) {
    isLoading = true
    errorMessage = null

    try {
      const { ethers } = await loadEthers()
      const rpcProvider = new ethers.JsonRpcProvider(GASNET_URL)
      const gasNetContract = new ethers.Contract(GASNET_CONTRACT_ADDRESS, gasnet.abi, rpcProvider)
      console.log(64, chain, typeof chain)
      const [estimation, signature] = await gasNetContract.getEstimation(chain)
      transactionSignature = signature
      gasEstimation = createEstimationObject(estimation)
    } catch (error) {
      console.error(error)
      errorMessage = error as string
      isLoading = false
    }
  }

  async function readPublishedGasData(provider: any) {
    errorMessage = null

    try {
      const { ethers } = await loadEthers()
      const ethersProvider = new ethers.BrowserProvider(provider, 'any')
      const signer = await ethersProvider.getSigner()
      const gasNetContract = new ethers.Contract(
        GASNET_CONTRACT_ADDRESS_SEPOLIA,
        consumer.abi,
        signer
      )
      console.log(quantiles[selectedQuantile])
      const [gasPrice, maxPriorityFeePerGas, maxFeePerGas] =
        await gasNetContract.getGasEstimationQuantile(
          BigInt(readableChains[selectedReadChain].chainId.toString()),
          GAS_ESTIMATION_DELAY,
          quantiles[selectedQuantile]
        )

      publishedGasData = { gasPrice, maxPriorityFeePerGas, maxFeePerGas }
    } catch (error) {
      console.error('Gas data fetch error:', error)
      errorMessage = error as string
    }
  }

  async function publishGasEstimation(provider: any) {
    try {
      const { ethers } = await loadEthers()
      const signer = await provider.getSigner()
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
      console.error('Publication error:', error)
      errorMessage = error as string
      isLoading = false
    }
  }

  async function handleGasEstimation(provider: any, readChainId: number, writeChainId: number) {
    const { ethers } = await loadEthers()
    const ethersProvider = new ethers.BrowserProvider(provider, 'any')
    await fetchGasEstimationFromGasNet(readChainId.toString())
    await onboard.setChain({ chainId: writeChainId })
    await publishGasEstimation(ethersProvider)
  }

  function formatBigInt(key: string, value: any) {
    return typeof value === 'bigint' ? value.toString() : value
  }
</script>

<main>
  <div class="connected-wallet">
    {#if onboard && !$wallets$?.length}
      <div class="sign-transaction">
        <button on:click={() => onboard.connectWallet()}>Connect Wallet</button>
      </div>
    {/if}

    {#if $wallets$}
      {#each $wallets$ as { provider }}
        <div class="sign-transaction">
          <div class="button-group">
            <div class="select-group">
              <label for="read-chain" class="select-label">Estimates For</label>
              <select id="read-chain" bind:value={selectedReadChain} class="chain-select">
                {#each Object.entries(readableChains) as [key, chain]}
                  <option value={key}>{chain.display}</option>
                {/each}
              </select>
            </div>
            <div class="select-group">
              <label for="write-chain" class="select-label">Write To</label>
              <select id="write-chain" bind:value={selectedWriteChain} class="chain-select">
                {#each Object.entries(writableChains) as [key, chain]}
                  <option value={key}>{chain.display}</option>
                {/each}
              </select>
            </div>
          </div>
          <button
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
        </div>

        {#if gasEstimation}
          <!-- <div class="sign-transaction">
            <button on:click={() => publishGasEstimation(provider)}>
              Publish to {writableChains[selectedWriteChain].display}
            </button>
          </div> -->

          <div class="sign-transaction">
            <div class="drawer-container">
              <button
                class="drawer-button"
                on:click={() => (isDrawerOpen = !isDrawerOpen)}
                aria-expanded={isDrawerOpen}
              >
                <div class="drawer-header">
                  <svg
                    class="chevron {isDrawerOpen ? 'rotate' : ''}"
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
                  <span class="data-label">Data Pulled From Gas Network</span>
                </div>
              </button>

              {#if isDrawerOpen}
                <div class="drawer-content" transition:slide={{ duration: 200 }}>
                  <pre>{JSON.stringify(gasEstimation, formatBigInt, 2)}</pre>
                </div>
              {/if}
            </div>

            {#if isLoading}
              <div class="flex flex-col items-center content-center gap-2 my-4 spinner-container">
                <div class="spinner" />
                <p>Please Check Connected Browser Wallet for Progress</p>
              </div>
            {/if}

            {#if transactionHash}
              <div class="sign-transaction m-3">
                Confirmed Hash:
                <a
                  href="https://sepolia.etherscan.io/tx/{transactionHash}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {transactionHash}
                </a>
              </div>
            {/if}
          </div>
        {/if}

        <div class="sign-transaction">
          <div class="select-group">
            <label for="quantile-select" class="select-label">Read Quantile</label>
            <select id="quantile-select" bind:value={selectedQuantile} class="chain-select">
              {#each Object.entries(quantiles) as [key, value]}
                <option value={key}>Q{value}</option>
              {/each}
            </select>
          </div>
          <button on:click={() => readPublishedGasData(provider)}>
            Read {readableChains[selectedReadChain].display} Estimations from {writableChains[
              selectedWriteChain
            ].display} for the 99 Quantile
          </button>

          {#if publishedGasData}
            <div class="sign-transaction">
              <pre>{JSON.stringify(publishedGasData, formatBigInt, 2)}</pre>
            </div>
          {/if}
        </div>

        {#if errorMessage}
          <div class="error-message">
            {errorMessage}
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</main>

<style>
  .spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .error-message {
    color: red;
    overflow: scroll;
    padding: 1rem;
    border: 1px solid red;
    border-radius: 8px;
    margin-top: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  button {
    width: auto;
    min-width: 14rem;
    margin: 8px;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  button:hover {
    background: #2563eb;
  }

  .connected-wallet {
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: white;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .sign-transaction {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .data-label {
    font-weight: 500;
    font-size: 1.2rem;
  }

  pre {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px solid #e5e7eb;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #1e293b;
  }

  a {
    color: #3b82f6;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  :global(body) {
    background: #f1f5f9;
    margin: 0;
    padding: 0;
  }

  button[aria-expanded] {
    background: none;
    margin: 0;
    min-width: 0;
    width: 100%;
    color: inherit;
  }

  button[aria-expanded]:hover {
    background: #f8fafc;
  }

  .drawer-container {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }

  .drawer-button {
    width: 100%;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    text-align: left;
    transition: background-color 0.2s ease;
  }

  .drawer-button:hover {
    background-color: #f8fafc;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 1rem;
  }

  .chevron {
    width: 20px;
    height: 20px;
    color: #64748b;
    transition: transform 0.2s ease;
  }

  .chevron.rotate {
    transform: rotate(180deg);
  }

  .drawer-content {
    border-top: 1px solid #e5e7eb;
  }

  .drawer-content pre {
    margin: 0;
    background-color: #f8fafc;
  }

  .button-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .chain-select {
    min-width: 140px;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background-color: white;
    color: #1e293b;
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .chain-select:hover {
    border-color: #3b82f6;
  }

  .chain-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .chain-select option {
    padding: 0.5rem;
    background-color: white;
    color: #1e293b;
  }

  .select-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .select-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    margin-left: 0.25rem;
  }
</style>
