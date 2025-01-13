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

export const defaultV2ContractDisplayValues = [107, 112, 321]

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
	[WritableChainKey.DEVNET]: {
		chainId: 19735516467,
		display: 'Gas Devnet',
		rpcUrl: 'https://http-rpc.devnet.gas.network',
		v2Contract: '0x3277023a8577dDc27d65efBC2536d550F3011818',
		blockExplorerUrl: 'https://explorer.devnet.gas.network'
	},
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
		v2Contract: '0xb690C4CbDE4747FD614477Ab24c7630C5aAa6Ec5',
		contract: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
		blockExplorerUrl: 'https://sepolia.lineascan.build'
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
		v2Supported: true,
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

export const v2ContractSchema: Record<number, Record<number, Record<number, { name: string, type: string, description: string }>>> = {
	'1': {},
	'2': {
		'1': {
			'100': {
				name: 'slot',
				type: 'number',
				description: "Block's slot"
			},
			'101': {
				name: 'epoch',
				type: 'number',
				description: "Block's epoch"
			},
			'102': {
				name: 'tx_count',
				type: 'number',
				description: 'Transaction Count'
			},
			'103': {
				name: 'miner',
				type: 'address',
				description: 'Miner'
			},
			'104': {
				name: 'fee_recipient',
				type: 'address',
				description: 'Fee Recipient'
			},
			'105': {
				name: 'gas_used',
				type: 'number',
				description: 'Gas Used'
			},
			'106': {
				name: 'gas_limit',
				type: 'number',
				description: 'Gas Limit'
			},
			'107': {
				name: 'base_fee_per_gas',
				type: 'number',
				description: 'Base Fee Per Gas'
			},
			'108': {
				name: 'block_blob_size',
				type: 'number',
				description: 'Block Blob Size'
			},
			'109': {
				name: 'block_blob_gas_price',
				type: 'number',
				description: 'Block Blob Gas Price'
			},
			'110': {
				name: 'block_blob_gas_used',
				type: 'number',
				description: 'Block Blob Gas Used'
			},
			'111': {
				name: 'block_blob_gas_limit',
				type: 'number',
				description: 'Block Blob Gas Limit'
			},
			'112': {
				name: 'blob_base_fee_per_gas',
				type: 'number',
				description: 'Blob Base Fee Per Gas'
			},
			'200': {
				name: 'pred_base_fee_per_gas_p99',
				type: 'number',
				description: 'Gas Price Prediction - p99'
			},
			'201': {
				name: 'pred_base_fee_per_gas_p95',
				type: 'number',
				description: 'Gas Price Prediction - p95'
			},
			'202': {
				name: 'pred_base_fee_per_gas_p90',
				type: 'number',
				description: 'Gas Price Prediction - p90'
			},
			'203': {
				name: 'pred_base_fee_per_gas_p80',
				type: 'number',
				description: 'Gas Price Prediction - p80'
			},
			'204': {
				name: 'pred_base_fee_per_gas_p70',
				type: 'number',
				description: 'Gas Price Prediction - p70'
			},
			'205': {
				name: 'pred_base_fee_per_gas_p50',
				type: 'number',
				description: 'Gas Price Prediction - p50'
			},
			'300': {
				name: 'pred_tx_count_p99',
				type: 'number',
				description: 'Transaction Count Prediction - p99'
			},
			'301': {
				name: 'pred_tx_count_p95',
				type: 'number',
				description: 'Transaction Count Prediction - p95'
			},
			'302': {
				name: 'pred_tx_count_p90',
				type: 'number',
				description: 'Transaction Count Prediction - p90'
			},
			'303': {
				name: 'pred_tx_count_p80',
				type: 'number',
				description: 'Transaction Count Prediction - p80'
			},
			'304': {
				name: 'pred_tx_count_p70',
				type: 'number',
				description: 'Transaction Count Prediction - p70'
			},
			'305': {
				name: 'pred_tx_count_p50',
				type: 'number',
				description: 'Transaction Count Prediction - p50'
			},
			'310': {
				name: 'pred_base_fee_per_gas_p99',
				type: 'number',
				description: 'Base Fee Per Gas Prediction - p99'
			},
			'311': {
				name: 'pred_base_fee_per_gas_p95',
				type: 'number',
				description: 'Base Fee Per Gas Prediction - p95'
			},
			'312': {
				name: 'pred_base_fee_per_gas_p90',
				type: 'number',
				description: 'Base Fee Per Gas Prediction - p90'
			},
			'313': {
				name: 'pred_base_fee_per_gas_p80',
				type: 'number',
				description: 'Base Fee Per Gas Prediction - p80'
			},
			'314': {
				name: 'pred_base_fee_per_gas_p70',
				type: 'number',
				description: 'Base Fee Per Gas Prediction - p70'
			},
			'315': {
				name: 'pred_base_fee_per_gas_p50',
				type: 'number',
				description: 'Base Fee Per Gas Prediction - p50'
			},
			'320': {
				name: 'pred_max_priority_fee_per_gas_p99',
				type: 'number',
				description: 'Max Priority Fee Per Gas Prediction - p99'
			},
			'321': {
				name: 'pred_max_priority_fee_per_gas_p95',
				type: 'number',
				description: 'Max Priority Fee Per Gas Prediction - p95'
			},
			'322': {
				name: 'pred_max_priority_fee_per_gas_p90',
				type: 'number',
				description: 'Max Priority Fee Per Gas Prediction - p90'
			},
			'323': {
				name: 'pred_max_priority_fee_per_gas_p80',
				type: 'number',
				description: 'Max Priority Fee Per Gas Prediction - p80'
			},
			'324': {
				name: 'pred_max_priority_fee_per_gas_p70',
				type: 'number',
				description: 'Max Priority Fee Per Gas Prediction - p70'
			},
			'325': {
				name: 'pred_max_priority_fee_per_gas_p50',
				type: 'number',
				description: 'Max Priority Fee Per Gas Prediction - p50'
			},
			'330': {
				name: 'pred_max_fee_per_gas_p99',
				type: 'number',
				description: 'Max Fee Per Gas Prediction - p99'
			},
			'331': {
				name: 'pred_max_fee_per_gas_p95',
				type: 'number',
				description: 'Max Fee Per Gas Prediction - p95'
			},
			'332': {
				name: 'pred_max_fee_per_gas_p90',
				type: 'number',
				description: 'Max Fee Per Gas Prediction - p90'
			},
			'333': {
				name: 'pred_max_fee_per_gas_p80',
				type: 'number',
				description: 'Max Fee Per Gas Prediction - p80'
			},
			'334': {
				name: 'pred_max_fee_per_gas_p70',
				type: 'number',
				description: 'Max Fee Per Gas Prediction - p70'
			},
			'335': {
				name: 'pred_max_fee_per_gas_p50',
				type: 'number',
				description: 'Max Fee Per Gas Prediction - p50'
			}
		}
	}
}
