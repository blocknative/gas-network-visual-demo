import type { ReadChain, OracleChain } from '$lib/@types/types'
import { BN_CHAINS_ENDPOINT, BN_ORACLE_CHAINS_ENDPOINT } from '../../constants'

export async function fetchChains(): Promise<ReadChain[] | undefined> {
	try {
		const response = await fetch(BN_CHAINS_ENDPOINT)
		if (!response.ok) throw new Error('Failed to fetch chains')
		const data = await response.json()
		return data
	} catch (error) {
		console.error('Error fetching chains:', error)
		return undefined
	}
}

export async function fetchOracleChains(): Promise<OracleChain[] | undefined> {
	try {
		const response = await fetch(BN_ORACLE_CHAINS_ENDPOINT)
		if (!response.ok) throw new Error('Failed to fetch chains')
		const data = await response.json()
		return data
	} catch (error) {
		console.error('Error fetching chains:', error)
		return undefined
	}
}
