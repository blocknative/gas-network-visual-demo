export enum Quantile {
  Q99 = 99,
  Q90 = 90,
  Q80 = 80,
  Q70 = 70,
  Q50 = 50
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