import {
	type WriteChain,
	type ReadChain,
	WritableChainKey,
	ReadableChainKey,
	type QuantileMap
} from '$lib/@types/types'

export const gasNetwork = {
	url: 'https://http-rpc.devnet.gas.network',
	// url: 'https://test.devnet.gas.network',
	contract: '0xC2F61FAfA65D874725e485f4B52B9B495559F381',
	v2Contract: '0x22973B6Fa2c15278f930d302AE8670abC4Fa6f28'
}

export const evmV2ContractTypValues = [107, 322]
export const mainnetV2ContractTypValues = [107, 112, 322]

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
	// [WritableChainKey.ARBITRUM_SEPOLIA]: {
	//   chainId: 421614,
	//   display: 'Arb Sepolia',
	//   rpcUrl: 'https://arbitrum-sepolia.gateway.tenderly.co',
	//   contract: '',
	// blockExplorerUrl: 'https://sepolia.arbiscan.io'
	// },
	// [WritableChainKey.DEVNET]: {
	// 	chainId: 19735516467,
	// 	display: 'Gas Devnet',
	// 	rpcUrl: 'https://http-rpc.devnet.gas.network',
	// 	v2Contract: '0xeb4AE8e5828d0675F4D8420A188F53E1Fdf65e5E',
	// 	blockExplorerUrl: 'https://explorer.devnet.gas.network'
	// },
	[WritableChainKey.SEPOLIA]: {
		chainId: 11155111,
		display: 'Ethereum Sepolia',
		rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
		contract: '0xE4859432d9Af6D40C2D923e3F13D66057F4AEcA0',
		blockExplorerUrl: 'https://sepolia.etherscan.io',
		v2Contract: '0xCc936bE977BeDb5140C5584d8B6043C9068622A6'
	},
	[WritableChainKey.OP_SEPOLIA]: {
		chainId: 11155420,
		display: 'Optimism Sepolia',
		rpcUrl: 'https://sepolia.optimism.io',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
		blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
		v2Contract: '0x20A5DCE3646BD975edEE3082319bd0dB64A0e0B9'
	},
	[WritableChainKey.BASE_SEPOLIA]: {
		chainId: 84532,
		display: 'Base Sepolia',
		rpcUrl: 'https://sepolia.base.org',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
		blockExplorerUrl: 'https://sepolia.basescan.org',
		v2Contract: '0xD87f5Ea40C592DfFAe5B87922E1cdA2bb44CB67F'
	},
	[WritableChainKey.LINEA_SEPOLIA]: {
		chainId: 59141,
		display: 'Linea Sepolia',
		rpcUrl: 'https://linea-sepolia-rpc.publicnode.com',
		v2Contract: '0xb690C4CbDE4747FD614477Ab24c7630C5aAa6Ec5',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
		blockExplorerUrl: 'https://sepolia.lineascan.build'
	},
	[WritableChainKey.LINEA_MAINNET]: {
		chainId: 59144,
		display: 'Linea Mainnet',
		rpcUrl: 'https://rpc.linea.build',
		v2Contract: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13',
		blockExplorerUrl: 'https://lineascan.build'
	},
	[WritableChainKey.BASE_MAINNET]: {
		chainId: 8453,
		display: 'Base Mainnet',
		rpcUrl: 'https://base.llamarpc.com',
		v2Contract: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13',
		blockExplorerUrl: 'https://basescan.org/'
	},
	[WritableChainKey.OP_MAINNET]: {
		chainId: 10,
		display: 'Optimism Mainnet',
		rpcUrl: 'https://optimism.llamarpc.com',
		v2Contract: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13',
		blockExplorerUrl: 'https://optimistic.etherscan.io/'
	}
}

export const readableChains: Record<ReadableChainKey, ReadChain> = {
	// Supported chains are sorted in the component handler
	[ReadableChainKey.ARBITRUM]: {
		chainId: 42161,
		display: 'Arbitrum',
		arch: 'evm'
	},
	[ReadableChainKey.AVALANCHE]: {
		chainId: 43114,
		display: 'Avalanche',
		arch: 'evm'
	},
	[ReadableChainKey.BASE]: {
		chainId: 8453,
		display: 'Base',
		arch: 'evm'
	},
	[ReadableChainKey.BLAST]: {
		chainId: 81457,
		display: 'Blast',
		arch: 'evm'
	},
	[ReadableChainKey.CHILIZ]: {
		chainId: 88888,
		display: 'Chiliz',
		arch: 'evm'
	},
	[ReadableChainKey.CRONOS]: {
		chainId: 25,
		display: 'Cronos',
		arch: 'evm'
	},
	[ReadableChainKey.MAIN]: {
		chainId: 1,
		display: 'Ethereum',
		arch: 'evm'
	},
	[ReadableChainKey.FANTOM]: {
		chainId: 250,
		display: 'Fantom',
		arch: 'evm'
	},
	[ReadableChainKey.LINEA]: {
		chainId: 59144,
		display: 'Linea',
		arch: 'evm'
	},
	[ReadableChainKey.LISK]: {
		chainId: 1135,
		display: 'Lisk',
		arch: 'evm'
	},
	[ReadableChainKey.MANTLE]: {
		chainId: 5000,
		display: 'Mantle',
		arch: 'evm'
	},
	[ReadableChainKey.MOONBEAM]: {
		chainId: 1284,
		display: 'Moonbeam',
		arch: 'evm'
	},
	[ReadableChainKey.OPTIMISM]: {
		chainId: 10,
		display: 'Optimism',
		arch: 'evm'
	},
	[ReadableChainKey.POLYGON]: {
		chainId: 137,
		display: 'Polygon',
		arch: 'evm'
	},
	[ReadableChainKey.RONIN]: {
		chainId: 2020,
		display: 'Ronin',
		arch: 'evm'
	},
	[ReadableChainKey.SEI]: {
		chainId: 1329,
		display: 'SEI',
		arch: 'evm'
	},
	[ReadableChainKey.ZKSYNC]: {
		chainId: 324,
		display: 'zkSync',
		arch: 'evm'
	},
	[ReadableChainKey.GNOSIS]: {
		chainId: 100,
		display: 'Gnosis',
		arch: 'evm'
	},
	[ReadableChainKey.IMMUTABLE]: {
		chainId: 204,
		display: 'Immutable zkEVM',
		arch: 'evm'
	},
	[ReadableChainKey.OPBNB]: {
		chainId: 13371,
		display: 'opBNB',
		arch: 'evm'
	},
	[ReadableChainKey.SCROLL]: {
		chainId: 534352,
		display: 'Scroll',
		arch: 'evm'
	},
	[ReadableChainKey.ZETACHAIN]: {
		chainId: 7000,
		display: 'ZetaChain',
		arch: 'evm'
	},
	[ReadableChainKey.POLYGONZKEVM]: {
		chainId: 1101,
		display: 'Polygon zkEVM',
		arch: 'evm'
	},
	[ReadableChainKey.WORLDCHAIN]: {
		chainId: 480,
		display: 'World Chain',
		arch: 'evm'
	},
	[ReadableChainKey.ROOTSTOCK]: {
		chainId: 30,
		display: 'Rootstock',
		arch: 'evm'
	},
	[ReadableChainKey.FRAXTAL]: {
		chainId: 252,
		display: 'Fraxtal',
		arch: 'evm'
	},
	[ReadableChainKey.ZORA]: {
		chainId: 7777777,
		display: 'Zora',
		arch: 'evm'
	},
	[ReadableChainKey.INK]: {
		chainId: 57073,
		display: 'Ink',
		arch: 'evm'
	},
	[ReadableChainKey.LENSSEPOLIA]: {
		chainId: 37111,
		display: 'Lens Sepolia',
		arch: 'evm'
	},
	[ReadableChainKey.PALM]: {
		chainId: 11297108109,
		display: 'Palm',
		arch: 'evm'
	},
	[ReadableChainKey.BOB]: {
		chainId: 60808,
		display: 'Bob',
		arch: 'evm'
	},
	[ReadableChainKey.SNAX]: {
		chainId: 2192,
		display: 'SNAXchain',
		arch: 'evm'
	},
	[ReadableChainKey.TAIKO]: {
		chainId: 167000,
		display: 'Taiko',
		arch: 'evm'
	},
	[ReadableChainKey.METIS]: {
		chainId: 1088,
		display: 'Metis',
		arch: 'evm'
	},
	[ReadableChainKey.MODE]: {
		chainId: 34443,
		display: 'Mode',
		arch: 'evm'
	},
	[ReadableChainKey.BSC]: {
		chainId: 56,
		display: 'BNB Smart Chain',
		arch: 'evm'
	},

	// Add new chains above this
	// Unsupported chain for error testing
	[ReadableChainKey.UNSUPPORTED_CHAIN]: {
		chainId: 1638,
		display: 'Unsupported Chain',
		arch: 'unsupported'
	}
}

export const archSchemaMap: Record<string, number> = {
	btc: 1,
	evm: 2,
	unsupported: 0
}

export const evmTypeSchema: Record<number, { name: string; type: string; description: string }> = {
	'107': {
		name: 'base_fee_per_gas',
		type: 'number',
		description: 'Base Fee Per Gas'
	},
	'112': {
		name: 'blob_base_fee_per_gas',
		type: 'number',
		description: 'Blob Base Fee Per Gas'
	},
	'322': {
		name: 'pred_max_priority_fee_per_gas_p90',
		type: 'number',
		description: 'Max Priority Fee Per Gas Prediction - p90'
	}
}
