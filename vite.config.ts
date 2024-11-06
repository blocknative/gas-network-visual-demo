import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import inject from '@rollup/plugin-inject'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills(),
		{
			name: 'intl-messageformat-resolver',
			enforce: 'pre',

			transform(code, id) {
				if (id.includes('intl-messageformat')) {
					return {
						code: `
							import * as IMF from '${path.resolve(__dirname, 'node_modules/intl-messageformat/lib/index.js')}';
							export const IntlMessageFormat = IMF.default || IMF;
							export default IntlMessageFormat;
						`,
						map: {
							mappings: '',
							sources: [],
							sourcesContent: [],
							names: [],
							version: 3
						}
					}
				}
			}
		}
	],
	resolve: {
		alias: {
			crypto: 'crypto-browserify',
			stream: 'stream-browserify',
			assert: 'assert',
			zlib: 'browserify-zlib',
			buffer: 'buffer/'
		}
	},
	build: {
		rollupOptions: {
			external: ['@web3-onboard/*', 'Buffer'],
			plugins: [
				nodePolyfills({
					globals: {
						Buffer: true,
						global: true
					}
				}),
				inject({
					Buffer: ['buffer', 'Buffer']
				})
			]
		}
	},
	optimizeDeps: {
		exclude: ['@ethersproject/hash', 'wrtc', 'http'],
		include: ['Buffer', 'intl-messageformat']
	},
	ssr: {
		noExternal: ['intl-messageformat']
	}
})
