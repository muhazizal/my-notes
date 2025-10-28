import { test, expect } from '@/tests/playwright.setup'
import { http, HttpResponse } from 'msw'

test.describe('Verify E2E', () => {
	test.beforeEach(async ({ network }) => {
		await network.resetHandlers()
	})
	test.afterEach(async ({ network }) => {
		await network.resetHandlers()
	})

	test('success verify and redirect to sign-in page', async ({ page }) => {
		// Redirect to verify page
		await page.goto('/verify/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure page rendered
		await expect(page.getByTestId('verify-title')).toBeVisible()

		// Ensure loading indicator hidden
		const loadingVerify = page.getByTestId('verify-loading')
		await expect(loadingVerify).toBeVisible()

		// Success caption shows and sign-in button navigates
		const success = page.getByTestId('verify-success')
		await expect(success).toBeVisible({ timeout: 5000 })

		const signInButton = page.getByTestId('verify-success-btn')
		await expect(signInButton).toBeVisible()
		await signInButton.click()

		await expect(page).toHaveURL('/sign-in')

		const loginTitle = page.getByTestId('login-title')
		await expect(loginTitle).toBeVisible()
	})

	test('failed verify displays resend fail', async ({ page, network }) => {
		// Override verify response to fail
		await network.use(
			http.get('/api/auth/verify/:token', () =>
				HttpResponse.json({ code: 422, message: 'Failed verify user email' }, { status: 422 })
			)
		)

		// Redirect to verify page
		await page.goto('/verify/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure page rendered
		await expect(page.getByTestId('verify-title')).toBeVisible()

		// Error caption shows and resend button navigates
		const resendFail = page.getByTestId('verify-resend-fail')
		await expect(resendFail).toBeVisible()

		const resendBtn = page.getByTestId('verify-resend-btn')
		await expect(resendBtn).toBeVisible()
	})

	test('failed verify -> resend verification shows success', async ({ page, network }) => {
		// Override verify response to fail
		await network.use(
			http.get('/api/auth/verify/:token', () =>
				HttpResponse.json({ code: 422, message: 'Failed verify user email' }, { status: 422 })
			)
		)
		// Override resend verification response to success
		await network.use(
			http.post('/api/auth/resend-verification', () =>
				HttpResponse.json({ code: 200, message: 'Success resend verification' }, { status: 200 })
			)
		)

		// Redirect to verify page
		await page.goto('/verify/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure page rendered
		await expect(page.getByTestId('verify-title')).toBeVisible()

		// Success caption shows and resend button navigates
		const resendBtn = page.getByTestId('verify-resend-btn')
		await expect(resendBtn).toBeVisible()
		resendBtn.click()

		// Check success caption shows
		const successCaption = page.getByTestId('verify-resend-success')
		await expect(successCaption).toBeVisible()
	})

	test('failed verify -> resend verification shows failed', async ({ page, network }) => {
		// Override verify response to fail
		await network.use(
			http.get('/api/auth/verify/:token', () =>
				HttpResponse.json({ code: 422, message: 'Failed verify user email' }, { status: 422 })
			)
		)

		// Override resend verification response to fail
		await network.use(
			http.post('/api/auth/resend-verification', () =>
				HttpResponse.json({ code: 422, message: 'Cannot resend verification' }, { status: 422 })
			)
		)

		// Redirect to verify page
		await page.goto('/verify/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure page rendered
		await expect(page.getByTestId('verify-title')).toBeVisible()

		// Error caption shows and resend button navigates
		const resendFail = page.getByTestId('verify-resend-fail')
		await expect(resendFail).toBeVisible()

		const resendBtn = page.getByTestId('verify-resend-btn')
		await expect(resendBtn).toBeVisible()
		await resendBtn.click()

		// Assert fail caption remains visible, success caption not shown
		await expect(page.getByTestId('verify-resend-fail')).toBeVisible()
		const successCaption = page.getByTestId('verify-resend-success')
		expect(await successCaption.count()).toBe(0)
	})
})
