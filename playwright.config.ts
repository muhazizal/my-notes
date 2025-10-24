import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: 'tests/e2e',
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	retries: 2,
	webServer: {
		command: 'npm run dev',
		port: 3000,
		timeout: 120_000,
		reuseExistingServer: true,
	},
})
