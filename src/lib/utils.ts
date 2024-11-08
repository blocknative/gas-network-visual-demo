import type { EstimationData } from "./@types/types"

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
