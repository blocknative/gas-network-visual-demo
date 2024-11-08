import aspectRatio from '@tailwindcss/aspect-ratio'
import containerQueries from '@tailwindcss/container-queries'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				system: ['system-ui', '-apple-system', 'sans-serif']
			}
		}
	},

	plugins: [typography, containerQueries, aspectRatio]
} satisfies Config
