import { type WriteChain, WritableChainKey, type QuantileMap } from '$lib/@types/types'

export const gasNetwork = {
	url: 'https://rpc.gas.network',
	contract: '0xC2F61FAfA65D874725e485f4B52B9B495559F381',
	v2Contract: '0x22973B6Fa2c15278f930d302AE8670abC4Fa6f28'
}

export const LOCAL_SETTING_KEY = 'bn-gas-demo-settings'

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
	//   label: 'Arb Sepolia',
	//   rpcUrl: 'https://arbitrum-sepolia.gateway.tenderly.co',
	//   contract: '',
	// blockExplorerUrl: 'https://sepolia.arbiscan.io'
	// },
	// [WritableChainKey.DEVNET]: {
	// 	chainId: 19735516467,
	// 	label: 'Gas Devnet',
	// 	rpcUrl: 'https://http-rpc.devnet.gas.network',
	// 	v2Contract: '0xeb4AE8e5828d0675F4D8420A188F53E1Fdf65e5E',
	// 	blockExplorerUrl: 'https://explorer.devnet.gas.network'
	// },
	[WritableChainKey.SEPOLIA]: {
    arch: 'evm',
		chainId: 11155111,
		addressByVersion: {
			1: '0xE4859432d9Af6D40C2D923e3F13D66057F4AEcA0',
			2: '0xCc936bE977BeDb5140C5584d8B6043C9068622A6'
		},
		label: 'Ethereum Sepolia',
		rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
		blockExplorerUrl: 'https://sepolia.etherscan.io',
		testnet: true
	},
	[WritableChainKey.OP_SEPOLIA]: {
    arch: 'evm',
		chainId: 11155420,
		addressByVersion: {
			1: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
			2: '0x20A5DCE3646BD975edEE3082319bd0dB64A0e0B9'
		},
		label: 'Optimism Sepolia',
		rpcUrl: 'https://sepolia.optimism.io',
		blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
		testnet: true
	},
	[WritableChainKey.BASE_SEPOLIA]: {
    arch: 'evm',
		chainId: 84532,
		addressByVersion: {
			1: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
			2: '0xD87f5Ea40C592DfFAe5B87922E1cdA2bb44CB67F'
		},
		label: 'Base Sepolia',
		rpcUrl: 'https://sepolia.base.org',
		blockExplorerUrl: 'https://sepolia.basescan.org',
		testnet: true
	},
	[WritableChainKey.LINEA_SEPOLIA]: {
    arch: 'evm',
		chainId: 59141,
		addressByVersion: {
			1: '0x1a3d7A0bD9585B730e615aE0fD9a2294C33Df1E1',
			2: '0xb690C4CbDE4747FD614477Ab24c7630C5aAa6Ec5'
		},
		label: 'Linea Sepolia',
		rpcUrl: 'https://linea-sepolia-rpc.publicnode.com',
		blockExplorerUrl: 'https://sepolia.lineascan.build',
		testnet: true
	},
	[WritableChainKey.LINEA_MAINNET]: {
    arch: 'evm',
		chainId: 59144,
		addressByVersion: { 2: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13' },
		label: 'Linea',
		rpcUrl: 'https://rpc.linea.build',
		blockExplorerUrl: 'https://lineascan.build'
	},
	[WritableChainKey.BASE_MAINNET]: {
    arch: 'evm',
		chainId: 8453,
		addressByVersion: { 2: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13' },
		label: 'Base',
		rpcUrl: 'https://base.llamarpc.com',
		blockExplorerUrl: 'https://basescan.org/'
	},
	[WritableChainKey.OP_MAINNET]: {
    arch: 'evm',
		chainId: 10,
		addressByVersion: { 2: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13' },
		label: 'Optimism',
		rpcUrl: 'https://optimism.llamarpc.com',
		blockExplorerUrl: 'https://optimistic.etherscan.io/'
	},
	[WritableChainKey.MAINNET]: {
    arch: 'evm',
		chainId: 1,
		addressByVersion: { 2: '0x063FEaF3D1A724Fe0cc46F0481Ec15279beb9581' },
		label: 'Ethereum',
		rpcUrl: 'https://eth.llamarpc.com',
		blockExplorerUrl: 'https://mainnet.etherscan.io'
	},
	[WritableChainKey.ARBITRUM_ONE]: {
    arch: 'evm',
		chainId: 42161,
		addressByVersion: { 2: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13' },
		label: 'Arbitrum One',
		rpcUrl: 'https://arbitrum.llamarpc.com',
		blockExplorerUrl: 'https://arbiscan.io/'
	},
	[WritableChainKey.UNICHAIN_MAINNET]: {
    arch: 'evm',
		chainId: 130,
		addressByVersion: { 2: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13' },
		label: 'Unichain',
		rpcUrl: 'https://mainnet.unichain.org',
		blockExplorerUrl: 'https://uniscan.xyz/'
	}
}

export const DEFAULT_READ_CHAIN_ID = 1

export const UNSUPPORTED_CHAIN = {
	chainId: 1638,
	label: 'Unsupported Chain',
	arch: 'unsupported'
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
		description: 'Base Fee'
	},
	'112': {
		name: 'blob_base_fee_per_gas',
		type: 'number',
		description: 'Blob Base Fee'
	},
	'322': {
		name: 'pred_max_priority_fee_per_gas_p90',
		type: 'number',
		description: 'P90 Max Priority Fee'
	}
}

export const BN_CHAINS_ENDPOINT = 'https://api.blocknative.com/chains'
