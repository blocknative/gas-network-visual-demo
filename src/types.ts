export enum Quantile {
  Q99 = 0,
  Q90 = 1,
  Q80 = 2,
  Q70 = 3,
  Q50 = 4
}

export interface GasEstimate {
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
}

export interface PredictionData {
  Q70: GasEstimate;
  Q80: GasEstimate;
  Q90: GasEstimate;
  Q95: GasEstimate;
  Q99: GasEstimate;
  precision: number;
  height: bigint;
  timestamp: bigint;
  chainid: bigint;
}