import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: 'tests/e2e',
	workers: 1,
	use: {
		baseURL: 'http://localhost:3000',
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
		url: 'http://localhost:3000',
		timeout: 120_000,
		reuseExistingServer: true,
	},
})
