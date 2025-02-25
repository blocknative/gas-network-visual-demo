export interface QuantileMap {
	Q99: 99
	Q98: 98
	Q95: 95
	Q90: 90
	Q80: 80
	Q70: 70
}

export enum OracleVersion {
	v1 = 1,
	v2 = 2
}

export type OracleVersions = 1 | 2

export enum WritableNetworkType {
	MAINNET = 'mainnet',
	TESTNET = 'testnet'
}

export interface GasEstimate {
	gasPrice: bigint
	maxPriorityFeePerGas: bigint
	maxFeePerGas: bigint
}

export interface EstimationData {
	Q70: GasEstimate
	Q80: GasEstimate
	Q90: GasEstimate
	Q95: GasEstimate
	Q99: GasEstimate
	precision: number
	height: bigint
	timestamp: bigint
	chainid: bigint
}

export interface VPayload {
	typ: number
	value: string
}

export interface PayloadValues {
	height: bigint
	timestamp: bigint
	systemid: number
	chainid: bigint
	payloads: Array<VPayload>
}
export interface ReadChain {
	chainId: number
	label: string
	arch: 'evm' | 'utxo' | 'unsupported'
	v2Supported?: boolean
	units?: string
  icon?: string
}

export type OracleChain = {
	chainId: number
	label: string
	rpcUrl: string
	blockExplorerUrl: string
	addressByVersion: Record<number, string>
	testnet?: boolean
	icon?: string
  arch?: string
}

export interface LocalSettings {
	oracleVersion: undefined | number
	networkType: undefined | WritableNetworkType
	readChain: undefined | ReadChain
	writeChain: undefined | OracleChain
	quantile: undefined | keyof QuantileMap
	timeout: undefined | number
}
