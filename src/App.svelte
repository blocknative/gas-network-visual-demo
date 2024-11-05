<script lang="ts">
  import { ethers } from 'ethers'
  import { share } from 'rxjs/operators'
  import { Quantile, type GasEstimate, type PredictionData } from './types'
  import { createPredictionObject } from './utils'
  import { onboard } from './services/web3-onboard'
  import { 
    GASNET_URL, 
    GASNET_CONTRACT_ADDRESS, 
    GASNET_CONTRACT_ADDRESS_SEPOLIA 
  } from './constants'
  import consumer from './abis/consumer.json'
  import gasnet from './abis/gasnet.json'

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

      const transaction = await consumerContract.setEstimation(
        gasEstimation, 
        transactionSignature
      )
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

<main>
  <div class="connected-wallet">
    {#if !$wallets$?.length}
      <div class="sign-transaction">
        <button on:click={() => onboard.connectWallet()}>Connect Wallet</button>
      </div>
    {/if}

    {#if $wallets$}
      {#each $wallets$ as { provider }}
        <div class="sign-transaction">
          <button on:click={() => handleMainnetGasEstimation(provider)}>
            Get Mainnet Gas Predictions and Publish to Sepolia
          </button>
        </div>

        {#if gasEstimation}
          <div class="sign-transaction">
            <div class="sign-transaction">
              <h3>Data Pulled From Gas Network</h3>
              <pre>{JSON.stringify(gasEstimation, formatBigInt, 2)}</pre>
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
          <button on:click={() => readPublishedGasData(MAINNET_CHAIN_ID, provider)}>
            Get Mainnet Gas Data from Sepolia - 99 Quantile
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  main {
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
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
    margin: 1rem 0;
    border: 1px solid #e5e7eb;
    background: white;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .sign-transaction {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
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
</style>

