import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [vue()],
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
				'layouts/**/*',
				'middleware/**/*',
				'pages/**/*',
				'plugins/**/*',
				'stores/**/*',
				'server/**/*',
			],
			exclude: ['tests/**/*', '**/*.d.ts', '**/*.test.*', '**/*.spec.*', 'node_modules/**/*'],
			thresholds: {
				lines: 90,
				statements: 90,
				functions: 90,
				branches: 95,
			},
		},
	},
})
