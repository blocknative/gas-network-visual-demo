import blocknativeIcon from './blocknative-icon'
import type { OnboardAPI } from '@web3-onboard/core'

const infura_key = '80633e48116943128cbab25e402764ab'

let web3Onboard: OnboardAPI

export async function getOnboard() {
  if (!web3Onboard) {
    const { default: Web3Onboard } = await import('@web3-onboard/core')
    const { default: injectedModule } = await import('@web3-onboard/injected-wallets')

    const injected = injectedModule()

    web3Onboard = Web3Onboard({
      wallets: [injected],
      chains: [
        {
          id: '0x1',
          token: 'ETH',
          label: 'Ethereum',
          rpcUrl: `https://mainnet.infura.io/v3/${infura_key}`
        },
        {
          id: 11155111,
          token: 'ETH',
          label: 'Sepolia',
          rpcUrl: 'https://sepolia.drpc.org'
        },
        {
          id: 11155420,
          token: 'ETH',
          label: 'OP Sepolia',
          rpcUrl: 'https://sepolia.optimism.io'
        },
        {
          id: 84532,
          token: 'ETH',
          label: 'Base Sepolia',
          rpcUrl: 'https://sepolia.base.org'
        },
        {
          id: 42161,
          token: 'ARB-ETH',
          label: 'Arbitrum One',
          rpcUrl: 'https://rpc.ankr.com/arbitrum'
        },
        {
          id: '0x2105',
          token: 'ETH',
          label: 'Base',
          rpcUrl: 'https://mainnet.base.org'
        },
    
        {
          id: '0x89',
          token: 'MATIC',
          label: 'Polygon',
          rpcUrl: 'https://matic-mainnet.chainstacklabs.com'
        },
        {
          id: 10,
          token: 'OETH',
          label: 'OP Mainnet',
          rpcUrl: 'https://mainnet.optimism.io'
        }
      ],
      connect: {
        autoConnectAllPreviousWallet: true
      },
      appMetadata: {
        name: 'Blocknative',
        icon: blocknativeIcon,
        description: 'Demo app for Onboard V2',
        recommendedInjectedWallets: [
          { name: 'MetaMask', url: 'https://metamask.io' },
          { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
        ],
        agreement: {
          version: '1.0.0',
          termsUrl: 'https://www.blocknative.com/terms-conditions',
          privacyUrl: 'https://www.blocknative.com/privacy-policy'
        },
        gettingStartedGuide: 'https://blocknative.com',
        explore: 'https://blocknative.com'
      }
    })
  }

  return web3Onboard
}
