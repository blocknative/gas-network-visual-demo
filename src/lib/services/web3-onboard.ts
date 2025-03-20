import gasNetIcon from '$lib/svg/gas-net-icon-v2.svg?raw'
import type { OnboardAPI } from '@web3-onboard/core'

const infura_key = '80633e48116943128cbab25e402764ab'

let web3Onboard: OnboardAPI

export async function getOnboard() {
	if (!web3Onboard) {
		const { default: Web3Onboard } = await import('@web3-onboard/core')
		const { default: injectedModule } = await import('@web3-onboard/injected-wallets')
		const { default: metamaskModule } = await import('@web3-onboard/metamask')

		const injected = injectedModule()
		const metamask = metamaskModule({
			options: {
				extensionOnly: false,
				i18nOptions: {
					enabled: true
				},
				dappMetadata: {
					name: 'Demo Gas Network'
				}
			}
		})

		web3Onboard = Web3Onboard({
			wallets: [metamask, injected],
			chains: [
				{
					id: '0x1',
					token: 'ETH',
					label: 'Ethereum',
					rpcUrl: `https://mainnet.infura.io/v3/${infura_key}`
				},
				{
					id: 11155111,
					token: 'ETH',
					label: 'Sepolia',
					rpcUrl: 'https://sepolia.drpc.org'
				},
				{
					id: 11155420,
					token: 'ETH',
					label: 'OP Sepolia',
					rpcUrl: 'https://sepolia.optimism.io'
				},
				{
					id: 84532,
					token: 'ETH',
					label: 'Base Sepolia',
					rpcUrl: 'https://sepolia.base.org'
				},
				{
					id: 42161,
					token: 'ARB-ETH',
					label: 'Arbitrum One',
					rpcUrl: 'https://rpc.ankr.com/arbitrum'
				},
				{
					id: '0x2105',
					token: 'ETH',
					label: 'Base',
					rpcUrl: 'https://mainnet.base.org'
				},

				{
					id: '0x89',
					token: 'MATIC',
					label: 'Polygon',
					rpcUrl: 'https://matic-mainnet.chainstacklabs.com'
				},
				{
					id: 10,
					token: 'OETH',
					label: 'OP Mainnet',
					rpcUrl: 'https://mainnet.optimism.io'
				},
				{
					id: 19735516467,
					token: 'GAS',
					label: 'Gas Devnet',
					rpcUrl: 'https://http-rpc.devnet.gas.network'
				},
				{
					id: 59141,
					token: 'LineaETH',
					label: 'Linea Sepolia',
					rpcUrl: 'https://rpc.sepolia.linea.build'
				},
				{
					id: 59144,
					token: 'LineaETH',
					label: 'Linea',
					rpcUrl: 'https://rpc.linea.build'
				},
				{
					id: 130,
					token: 'ETH',
					label: 'Unichain',
					rpcUrl: 'https://mainnet.unichain.org'
				},
				{
					id: 1868,
					token: 'ETH',
					label: 'Soneium',
					rpcUrl: 'https://rpc.soneium.org.org'
				}
			],
			connect: {
				autoConnectAllPreviousWallet: true
			},
			appMetadata: {
				name: 'Gas Network Demo',
				icon: gasNetIcon,
				logo: gasNetIcon,
				description: 'Bringing web3 gas markets onchain',
				recommendedInjectedWallets: [
					{ name: 'MetaMask', url: 'https://metamask.io' },
					{ name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
				],
				agreement: {
					version: '1.0.0',
					termsUrl: 'https://www.blocknative.com/terms-conditions',
					privacyUrl: 'https://www.blocknative.com/privacy-policy'
				}
			}
		})
	}

	return web3Onboard
}
