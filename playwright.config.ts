import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: 'tests/e2e',
	use: {
		baseURL: process.env.NUXT_API_BASE_URL,
		testIdAttribute: 'data-test',
		trace: 'on-first-retry',
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
		extraHTTPHeaders: {
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	},
	webServer: {
		command: 'npm run dev',
		port: 3000,
		timeout: 120_000,
		reuseExistingServer: true,
	},
})
