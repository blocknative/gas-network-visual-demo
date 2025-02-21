import aspectRatio from '@tailwindcss/aspect-ratio'
import containerQueries from '@tailwindcss/container-queries'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				brandBackground: '#111111',
				brandForeground: '#181818',
				brandAction: '#59FBF5',
        brandAccent: '#C8A74C'
			},
			fontFamily: {
				system: ['system-ui', '-apple-system', 'sans-serif'],
				sans: ['Fira Sans', 'sans-serif'],
				mono: ['Fira Mono', 'monospace']
			}
		}
	},

	plugins: [typography, containerQueries, aspectRatio]
} satisfies Config
