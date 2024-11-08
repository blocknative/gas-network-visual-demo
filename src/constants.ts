import {
	type WriteChain,
	type ReadChain,
	WritableChainKey,
	ReadableChainKey,
	type QuantileMap
} from '$lib/@types/types'

export const gasNetwork = {
	url: 'https://proxy.gas.network',
	contract: '0x106A0e60fb930b96BDF9da93997747601435e1d9'
}

// You can then create the object that implements this interface:
export const quantiles: QuantileMap = {
	Q99: 99,
	Q98: 98,
	Q95: 95,
	Q90: 90,
	Q80: 80,
	Q70: 70
}

export const writableChains: Record<WritableChainKey, WriteChain> = {
	[WritableChainKey.SEPOLIA]: {
		chainId: 11155111,
		display: 'Ethereum Sepolia',
		rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
		contract: '0xE4859432d9Af6D40C2D923e3F13D66057F4AEcA0'
	},
	// [WritableChainKey.ARBITRUM_SEPOLIA]: {
	//   chainId: 421614,
	//   display: 'Arb Sepolia',
	//   rpcUrl: 'https://arbitrum-sepolia.gateway.tenderly.co',
	//   contract: ''
	// },
	[WritableChainKey.OP_SEPOLIA]: {
		chainId: 11155420,
		display: 'Optimism Sepolia',
		rpcUrl: 'https://sepolia.optimism.io',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1'
	},
	[WritableChainKey.BASE_SEPOLIA]: {
		chainId: 84532,
		display: 'Base Sepolia',
		rpcUrl: 'https://sepolia.base.org',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1'
	}
}

export const readableChains: Record<ReadableChainKey, ReadChain> = {
	[ReadableChainKey.MAIN]: {
		chainId: 1,
		display: 'Ethereum'
	},
	[ReadableChainKey.OPTIMISM]: {
		chainId: 10,
		display: 'Optimism'
	},
	// [ReadableChainKey.ARBITRUM]: {
	//   chainId: 42161,
	//   display: 'Arbitrum'
	// },
	[ReadableChainKey.BASE]: {
		chainId: 8453,
		display: 'Base'
	},
	[ReadableChainKey.POLYGON]: {
		chainId: 137,
		display: 'Polygon'
	},
	[ReadableChainKey.UNSUPPORTED_CHAIN]: {
		chainId: 1638,
		display: 'Unsupported Chain'
	}
}
