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
			provider: 'v8',
			reporter: ['text', 'text-summary', 'html', 'lcov'],
			include: [
				'components/**/*',
				'composables/**/*',
				'stores/**/*',
				'middleware/**/*',
				'plugins/**/*',
				'pages/**/*',
				'server/**/*',
			],
			exclude: ['tests/**/*', '**/*.d.ts', '**/*.test.*', '**/*.spec.*', 'node_modules/**/*'],
		},
	},
})
