import { test, expect } from '@/tests/playwright.setup'
import { stubAuthVerify, stubResendVerification } from '@/tests/helpers/network'

test.describe('Verify E2E', () => {
	test.afterEach(async ({ network }) => {
		network.resetHandlers()
	})

	test('success verify and redirect to sign-in page', async ({ page, network }) => {
		// Stub verify response to success
		await stubAuthVerify(network, 'success')

		// Redirect to verify page
		await page.goto('/verify/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure page rendered
		await expect(page.getByTestId('verify-title')).toBeVisible()

		// Ensure loading indicator hidden
		const loadingVerify = page.getByTestId('verify-loading')
		await expect(loadingVerify).toBeVisible()

		// Ensure verify request completes successfully
		const verifyResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/verify') && resp.status() === 200,
			{ timeout: 3000 }
		)
		const verifyResponseBody = await verifyResponse.json()
		expect(verifyResponseBody).toMatchObject({ code: 200 })

		// Success caption shows and sign-in button navigates
		const success = page.getByTestId('verify-success')
		await expect(success).toBeVisible({ timeout: 5000 })

		const signInButton = page.getByTestId('verify-success-btn')
		await expect(signInButton).toBeVisible()
		await signInButton.click()

		await expect(page).toHaveURL('/sign-in')

		const loginTitle = page.getByTestId('login-title')
		await expect(loginTitle).toBeVisible()

		await network.stop()
	})

	test('failed verify displays resend fail', async ({ page, network }) => {
		// Stub verify response to fail
		await stubAuthVerify(network, 'error')

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

		await network.stop()
	})

	test('failed verify -> resend verification shows success', async ({ page, network }) => {
		// Stub verify response to fail
		await stubAuthVerify(network, 'error')

		// Stub resend verification response to success
		await stubResendVerification(network, 'success')

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

		// Check resend verification response
		const resendResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/resend-verification') && resp.status() === 200,
			{ timeout: 3000 }
		)
		const resendResponseBody = await resendResponse.json()
		expect(resendResponseBody).toMatchObject({
			message: 'Success resend verification',
			code: 200,
		})

		// Check success caption shows
		const successCaption = page.getByTestId('verify-resend-success')
		await expect(successCaption).toBeVisible()

		await network.stop()
	})

	test('failed verify -> resend verification shows failed', async ({ page, network }) => {
		// Stub verify response to fail
		await stubAuthVerify(network, 'error')

		// Stub resend verification response to fail
		await stubResendVerification(network, 'error')

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
		resendBtn.click()

		// Check resend verification response
		const resendResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/resend-verification') && resp.status() === 422,
			{ timeout: 3000 }
		)
		const resendResponseBody = await resendResponse.json()
		expect(resendResponseBody).toMatchObject({
			message: 'Cannot resend verification',
			code: 422,
		})
	})
})
