import {
  type WriteChain,
  type ReadChain,
  WritableChainKey,
  ReadableChainKey,
  type QuantileMap
} from './types'

export const GASNET_URL = 'https://devnet.gas.network'
export const GASNET_CONTRACT_ADDRESS = '0x69E23e00384F213B8d6e26aeC80BBE30ACD804BA'

// You can then create the object that implements this interface:
export const quantiles: QuantileMap = {
  Q99: 99,
  Q95: 95,
  Q90: 90,
  Q80: 80,
  Q70: 70
}

export const writableChains: Record<WritableChainKey, WriteChain> = {
  [WritableChainKey.SEPOLIA]: {
    chainId: 11155111,
    display: 'Sepolia',
    rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    contract: '0xE4859432d9Af6D40C2D923e3F13D66057F4AEcA0'
  },
  [WritableChainKey.ARBITRUM_SEPOLIA]: {
    chainId: 421614,
    display: 'Arb Sepolia',
    rpcUrl: 'https://arbitrum-sepolia.gateway.tenderly.co',
    contract: ''
  },
  [WritableChainKey.OP_SEPOLIA]: {
    chainId: 11155420,
    display: 'OP Sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    contract: ''
  }
}

export const readableChains: Record<ReadableChainKey, ReadChain> = {
  [ReadableChainKey.MAIN]: {
    chainId: 1,
    display: 'Eth Main'
  },
  [ReadableChainKey.OPTIMISM]: {
    chainId: 10,
    display: 'Optimism'
  },
  [ReadableChainKey.ARBITRUM]: {
    chainId: 42161,
    display: 'Arbitrum'
  },
  [ReadableChainKey.BASE]: {
    chainId: 8453,
    display: 'Base'
  }
}
