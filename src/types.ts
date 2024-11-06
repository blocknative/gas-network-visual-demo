// Or alternatively, if you prefer an interface:
export interface QuantileMap {
  Q99: 99
  Q95: 95
  Q90: 90
  Q80: 80
  Q70: 70
}

export interface GasEstimate {
  gasPrice: bigint
  maxPriorityFeePerGas: bigint
  maxFeePerGas: bigint
}

export interface EstimationData {
  Q70: GasEstimate
  Q80: GasEstimate
  Q90: GasEstimate
  Q95: GasEstimate
  Q99: GasEstimate
  precision: number
  height: bigint
  timestamp: bigint
  chainid: bigint
}

export enum WritableChainKey {
  SEPOLIA = 'sepolia',
  // ARBITRUM_SEPOLIA = 'arbitrumSepolia',
  OP_SEPOLIA = 'opSepolia',
  BASE_SEPOLIA = 'baseSepolia'
}

export enum ReadableChainKey {
  MAIN = 'main',
  OPTIMISM = 'op',
  ARBITRUM = 'arb',
  BASE = 'base',
  POLYGON = 'polygon'
}

export interface ReadChain {
  chainId: number
  display: string
}

export interface WriteChain {
  chainId: number
  display: string
  rpcUrl: string
  contract: string
}
