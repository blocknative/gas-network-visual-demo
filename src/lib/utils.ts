import {
	defaultOracleMainnetChain,
	evmV2ContractTypValues,
	mainnetV2ContractTypValues,
	utxoV2ContractTypValues,
	svmV2ContractTypValues
} from '../constants'
import type { EstimationData, OracleChain } from './@types/types'

// Prepare estimation data
export const createEstimationObject = (pred: EstimationData): EstimationData => {
	const { Q70, Q80, Q90, Q95, Q99, precision, height, timestamp, chainid } = pred
	return {
		Q70: {
			gasPrice: Q70.gasPrice,
			maxPriorityFeePerGas: Q70.maxPriorityFeePerGas,
			maxFeePerGas: Q70.maxFeePerGas
		},
		Q80: {
			gasPrice: Q80.gasPrice,
			maxPriorityFeePerGas: Q80.maxPriorityFeePerGas,
			maxFeePerGas: Q80.maxFeePerGas
		},
		Q90: {
			gasPrice: Q90.gasPrice,
			maxPriorityFeePerGas: Q90.maxPriorityFeePerGas,
			maxFeePerGas: Q90.maxFeePerGas
		},
		Q95: {
			gasPrice: Q95.gasPrice,
			maxPriorityFeePerGas: Q95.maxPriorityFeePerGas,
			maxFeePerGas: Q95.maxFeePerGas
		},
		Q99: {
			gasPrice: Q99.gasPrice,
			maxPriorityFeePerGas: Q99.maxPriorityFeePerGas,
			maxFeePerGas: Q99.maxFeePerGas
		},
		precision: precision,
		height: BigInt(height),
		timestamp: BigInt(timestamp),
		chainid: BigInt(chainid)
	}
}

export const getOracleByChainId = (
	chains: OracleChain[],
	chainId: number | undefined
): OracleChain => {
	return chains.find((chain) => chain.chainId === chainId) ?? defaultOracleMainnetChain
}

export const getTypValuesByArch = (arch: number, chainId?: number): number[] => {
	switch (arch) {
		case 1:
			return utxoV2ContractTypValues
		case 2:
			if (chainId === 1) {
				return mainnetV2ContractTypValues
			}
			return evmV2ContractTypValues
			case 3:
				return svmV2ContractTypValues
		default:
			return []
	}
}
