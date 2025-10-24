import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./', import.meta.url)),
			'~': fileURLToPath(new URL('./', import.meta.url)),
		},
	},
	test: {
		environment: 'happy-dom',
		setupFiles: ['tests/setup/vitest.setup.ts'],
		coverage: {
			reporter: ['text', 'html'],
			include: ['components/**/*', 'composables/**/*', 'stores/**/*'],
			exclude: ['tests/**/*', 'server/**/*'],
		},
	},
})
