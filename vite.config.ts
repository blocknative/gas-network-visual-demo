import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import inject from '@rollup/plugin-inject'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import path from 'path'

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills()
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
		include: ['Buffer']
	}
})
