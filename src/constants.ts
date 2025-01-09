import {
	type WriteChain,
	type ReadChain,
	WritableChainKey,
	ReadableChainKey,
	type QuantileMap
} from '$lib/@types/types'

export const gasNetwork = {
	//	url: 'https://proxy.gas.network',
	//	contract: '0x106A0e60fb930b96BDF9da93997747601435e1d9'

	//url: 'https://http-rpc.devnet.bnc-tooling.com',
	//contract: '0x75F68Cda7D257fF6A253d4d12757b733d9A7dA3E', //'0x50D090B45AB70a88eE15F702939FA2ab4CFCA5e7'

	//	url: 'http://0.0.0.0:8545',
	//contract: '0xC2F61FAfA65D874725e485f4B52B9B495559F381'

	url: 'https://http-rpc.devnet.gas.network',
	contract: '0xC2F61FAfA65D874725e485f4B52B9B495559F381',
  v2Contract: '0x106A0e60fb930b96BDF9da93997747601435e1d9'
}

export const gasNetworkV2 = {
	url: 'http://pretender-min.prod',
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

//Add block observers to each one of the writable chains
export const writableChains: Record<WritableChainKey, WriteChain> = {
	// [WritableChainKey.DEVNET]: {
	// 	chainId: 19735516467,
	// 	display: 'Gas Devnet',
	// 	rpcUrl: 'https://http-rpc.devnet.gas.network',
	// 	contract: '0x3277023a8577dDc27d65efBC2536d550F3011818',
  //   blockExplorerUrl: 'https://explorer.devnet.gas.network',
  //   v2Supported: true
	// },
	[WritableChainKey.SEPOLIA]: {
		chainId: 11155111,
		display: 'Ethereum Sepolia',
		rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
		contract: '0xE4859432d9Af6D40C2D923e3F13D66057F4AEcA0',
    blockExplorerUrl: 'https://sepolia.etherscan.io'
	},
	// [WritableChainKey.ARBITRUM_SEPOLIA]: {
	//   chainId: 421614,
	//   display: 'Arb Sepolia',
	//   rpcUrl: 'https://arbitrum-sepolia.gateway.tenderly.co',
	//   contract: '',
  // blockExplorerUrl: 'https://sepolia.arbiscan.io'
	// },
	[WritableChainKey.OP_SEPOLIA]: {
		chainId: 11155420,
		display: 'Optimism Sepolia',
		rpcUrl: 'https://sepolia.optimism.io',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
    blockExplorerUrl: 'https://sepolia-optimism.etherscan.io'
	},
	[WritableChainKey.BASE_SEPOLIA]: {
		chainId: 84532,
		display: 'Base Sepolia',
		rpcUrl: 'https://sepolia.base.org',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
    blockExplorerUrl: 'https://sepolia.basescan.org'
	},
	[WritableChainKey.LINEA_SEPOLIA]: {
		chainId: 59141,
		display: 'Linea Sepolia',
		rpcUrl: 'https://linea-sepolia-rpc.publicnode.com',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
    blockExplorerUrl: 'https://sepolia.lineascan.build'
	}
}

export const readableChains: Record<ReadableChainKey, ReadChain> = {
  // Supported chains are sorted in the component handler
	[ReadableChainKey.ARBITRUM]: {
		chainId: 42161,
		display: 'Arbitrum'
	},
	[ReadableChainKey.AVALANCHE]: {
		chainId: 43114,
		display: 'Avalanche'
	},
	[ReadableChainKey.BASE]: {
		chainId: 8453,
		display: 'Base'
	},
	[ReadableChainKey.BLAST]: {
		chainId: 81457,
		display: 'Blast'
	},
	[ReadableChainKey.CHILIZ]: {
		chainId: 88888,
		display: 'Chiliz'
	},
	[ReadableChainKey.CRONOS]: {
		chainId: 25,
		display: 'Cronos'
	},
	[ReadableChainKey.MAIN]: {
		chainId: 1,
		display: 'Ethereum',
    v2Supported: true
	},
	[ReadableChainKey.FANTOM]: {
		chainId: 250,
		display: 'Fantom'
	},
	[ReadableChainKey.LINEA]: {
		chainId: 59144,
		display: 'Linea'
	},
	[ReadableChainKey.LISK]: {
		chainId: 1135,
		display: 'Lisk'
	},
	[ReadableChainKey.MANTLE]: {
		chainId: 5000,
		display: 'Mantle'
	},
	[ReadableChainKey.MOONBEAM]: {
		chainId: 1284,
		display: 'Moonbeam'
	},
	[ReadableChainKey.OPTIMISM]: {
		chainId: 10,
		display: 'Optimism'
	},
	[ReadableChainKey.POLYGON]: {
		chainId: 137,
		display: 'Polygon'
	},
	[ReadableChainKey.RONIN]: {
		chainId: 2020,
		display: 'Ronin'
	},
	[ReadableChainKey.SEI]: {
		chainId: 1329,
		display: 'SEI'
	},
	[ReadableChainKey.ZKSYNC]: {
		chainId: 324,
		display: 'zkSync'
	},
	[ReadableChainKey.GNOSIS]: {
		chainId: 100,
		display: 'Gnosis'
	},
	[ReadableChainKey.IMMUTABLE]: {
		chainId: 204,
		display: 'Immutable zkEVM'
	},
	[ReadableChainKey.OPBNB]: {
		chainId: 13371,
		display: 'opBNB'
	},
	[ReadableChainKey.SCROLL]: {
		chainId: 534352,
		display: 'Scroll'
	},
	[ReadableChainKey.ZETACHAIN]: {
		chainId: 7000,
		display: 'ZetaChain'
	},
	[ReadableChainKey.POLYGONZKEVM]: {
		chainId: 1101,
		display: 'Polygon zkEVM'
	},
	[ReadableChainKey.WORLDCHAIN]: {
		chainId: 480,
		display: 'World Chain'
	},

  // Add new chains above this
  // Unsupported chain for error testing
	[ReadableChainKey.UNSUPPORTED_CHAIN]: {
		chainId: 1638,
		display: 'Unsupported Chain'
	}
}
