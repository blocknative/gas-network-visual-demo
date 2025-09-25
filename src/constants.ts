import { type OracleChain, type QuantileMap } from '$lib/@types/types'

export const BN_CHAINS_ENDPOINT = 'https://api.blocknative.com/chains'
export const BN_ORACLE_CHAINS_ENDPOINT = 'https://api.blocknative.com/oracles'

export const LOCAL_SETTING_KEY = 'bn-gas-demo-settings'

export const utxoV2ContractTypValues = [342]
export const evmV2ContractTypValues = [107, 322]
export const svmV2ContractTypValues = [342]
export const mainnetV2ContractTypValues = [107, 112, 322]

export const gasNetwork = {
	url: 'https://rpc.gas.network',
	contract: '0xC2F61FAfA65D874725e485f4B52B9B495559F381',
	v2Contract: '0x4245Cb7c690B650a38E680C9BcfB7814D42BfD32'
}

export const archSchemaMap: Record<string, number> = {
	utxo: 1,
	evm: 2,
	unsupported: 0,
	svm: 3
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

export const defaultOracleMainnetChain: OracleChain = {
	chainId: 59144,
	label: 'Linea',
	rpcUrl: 'https://rpc.linea.build',
	addressByVersion: { 2: '0x2c84370DaddBcD67d729689671A9Fe63DF39Cf13' },
	blockExplorerUrl: 'https://lineascan.build',
	testnet: false
}
export const defaultOracleMainnetChainId = defaultOracleMainnetChain.chainId

export const defaultOracleTestnetChains: OracleChain = {
	chainId: 11155111,
	label: 'Ethereum Sepolia',
	rpcUrl: 'https://sepolia.gateway.tenderly.co',
	addressByVersion: {
		2: '0xBFa35257A63db764e9B4CD204edb560649553627',
		1: '0xE4859432d9Af6D40C2D923e3F13D66057F4AEcA0'
	},
	blockExplorerUrl: 'https://sepolia.etherscan.io',
	arch: 'evm',
	icon: 'https://bnc-assets.com/evm/11155111/assets/icon.svg',
	testnet: true
}
export const defaultOracleTestnetChainId = defaultOracleTestnetChains.chainId

export const DEFAULT_READ_CHAIN_ID = 1

export const UNSUPPORTED_CHAIN = {
	chainId: 1638,
	label: 'Unsupported Chain',
	arch: 'unsupported'
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
	},
	'342': {
		name: 'pred_gas_fee_p90',
		type: 'number',
		description: 'P90 Gas Fee'
	}
}
