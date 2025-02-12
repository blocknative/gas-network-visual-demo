export interface QuantileMap {
	Q99: 99
	Q98: 98
	Q95: 95
	Q90: 90
	Q80: 80
	Q70: 70
}

export enum ContractType {
	v1 = 1,
	v2 = 2
}

export enum WritableNetworkType {
	MAINNET = 'mainnet',
	TESTNET = 'testnet'
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

export interface VPayload {
	typ: number
	value: string
}

export interface PayloadValues {
	height: bigint
	timestamp: bigint
	systemid: number
	chainid: bigint
	payloads: Array<VPayload>
}

export enum WritableChainKey {
	// ARBITRUM_SEPOLIA = 'arbitrumSepolia',
	// DEVNET = 'devnet'
	SEPOLIA = 'sepolia',
	OP_SEPOLIA = 'opSepolia',
	BASE_SEPOLIA = 'baseSepolia',
	LINEA_SEPOLIA = 'lineaSepolia',
	LINEA_MAINNET = 'linea',
	BASE_MAINNET = 'base',
	OP_MAINNET = 'optimism',
	MAINNET = 'mainnet',
	ARBITRUM_ONE = 'arbitrumOne'
}

export enum ReadableChainKey {
	ARBITRUM = 'arb',
	AVALANCHE = 'avalanche',
	BASE = 'base',
	BLAST = 'blast',
	CHILIZ = 'chiliz',
	CRONOS = 'cronos',
	MAIN = 'main',
	FANTOM = 'fantom',
	LINEA = 'linea',
	LISK = 'lisk',
	MANTLE = 'mantle',
	MOONBEAM = 'moonbeam',
	OPTIMISM = 'op',
	POLYGON = 'polygon',
	RONIN = 'ronin',
	SEI = 'sei',
	ZKSYNC = 'zksync',
	UNSUPPORTED_CHAIN = 'unsupportedChain',
	GNOSIS = 'gnosis',
	IMMUTABLE = 'immutablezkenv',
	OPBNB = 'opbnb',
	SCROLL = 'scroll',
	ZETACHAIN = 'zetachain',
	POLYGONZKEVM = 'polygonzkevm',
	WORLDCHAIN = 'worldchain',
	ROOTSTOCK = 'rootstock',
	FRAXTAL = 'fraxtal',
	ZORA = 'zora',
	INK = 'ink',
	LENSSEPOLIA = 'lenssepolia',
	PALM = 'palm',
	BOB = 'bob',
	SNAX = 'snax',
	TAIKO = 'taiko',
	METIS = 'metis',
	MODE = 'mode',
	BSC = 'bsc'
}
export interface ReadChain {
	chainId: number
	label: string
	arch: 'evm' | 'btc' | 'unsupported'
	v2Supported?: boolean
}

export type WriteChain = {
	chainId: number
	label: string
	rpcUrl: string
	blockExplorerUrl: string
  testnet?: boolean
} & (
	| { contract: string; v2Contract?: string }
	| { contract?: string; v2Contract: string }
	| { contract: string; v2Contract: string }
)
