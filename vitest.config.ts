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
		setupFiles: ['tests/vitest.setup.ts'],
		// Use non-deprecated reporter; mimic "basic" with summary disabled
		reporters: [['default', { summary: false }]],
		coverage: {
			reporter: ['text', 'html', 'lcov'],
			provider: 'v8',
			all: true,
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
			thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
		},
		onConsoleLog(log) {
			// Silence noisy framework warnings during tests
			if (log.includes('<Suspense> is an experimental feature')) return false
			if (log.includes('No match found for location with path')) return false
			return true
		},
	},
})
