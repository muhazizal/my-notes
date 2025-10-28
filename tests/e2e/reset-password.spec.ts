import { test, expect } from '@/tests/playwright.setup'
import { http, HttpResponse } from 'msw'

test.describe('Reset Password E2E', () => {
	test.afterEach(async ({ network }) => {
		await network.resetHandlers()
	})

	test('reset password success and redirect to sign-in page', async ({ page }) => {
		// Navigate to reset password page with token
		await page.goto('/reset-password/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure page rendered
		await expect(page.getByTestId('reset-password-title')).toBeVisible()

		// Fill both password fields
		const realInput = page.getByTestId('reset-password-real')
		const confirmInput = page.getByTestId('reset-password-confirmation')
		await expect(realInput).toBeVisible()
		await expect(confirmInput).toBeVisible()
		await realInput.fill('newPass123')
		await confirmInput.fill('newPass123')

		// Submit
		const submitBtn = page.getByTestId('reset-password-submit')
		await expect(submitBtn).toBeEnabled()
		await submitBtn.click()

		// Verify API response
		const resp = await page.waitForResponse(
			(r) => r.url().includes('/api/auth/reset-password') && r.status() === 200,
			{ timeout: 3000 }
		)
		const body = await resp.json()
		expect(body).toMatchObject({ code: 200 })

		// Success UI appears and Sign in navigates
		const successCaption = page.getByTestId('reset-password-success')
		await expect(successCaption).toBeVisible()

		const signInBtn = page.getByTestId('reset-password-sign-in')
		await expect(signInBtn).toBeVisible()
		await signInBtn.click()

		await expect(page).toHaveURL('/sign-in')
		await expect(page.getByTestId('login-title')).toBeVisible()
	})

	test('reset password failed shows fail caption and redirects to forgot password', async ({
		page,
		network,
	}) => {
		// Override handler to return 422 for this token
		network.use(
			http.post('/api/auth/reset-password/:token', async () => {
				return HttpResponse.json({ message: 'Failed reset password', code: 422 }, { status: 422 })
			})
		)

		await page.goto('/reset-password/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill both password fields
		await page.getByTestId('reset-password-real').fill('newPass123')
		await page.getByTestId('reset-password-confirmation').fill('newPass123')

		// Submit
		const submitBtn = page.getByTestId('reset-password-submit')
		await submitBtn.click()

		// Verify API error response
		const resp = await page.waitForResponse(
			(r) => r.url().includes('/api/auth/reset-password') && r.status() === 422,
			{ timeout: 3000 }
		)
		const body = await resp.json()
		expect(body).toMatchObject({ code: 422 })

		// Fail UI appears and request new url navigates
		const failCaption = page.getByTestId('reset-password-fail')
		await expect(failCaption).toBeVisible()

		const forgotBtn = page.getByTestId('reset-password-forgot-password')
		await expect(forgotBtn).toBeVisible()
		await forgotBtn.click()

		await expect(page).toHaveURL('/forgot-password')
		await expect(page.getByTestId('forgot-password-title')).toBeVisible()
	})

	test('validation errors: empty passwords show required messages', async ({ page }) => {
		await page.goto('/reset-password/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Ensure form and submit
		const form = page.getByTestId('reset-password-form')
		await expect(form).toBeVisible()
		await page.getByTestId('reset-password-submit').click()

		// Both fields should show min-length message (assert at page level for robustness)
		const errMsg = 'Password must be at least 5 characters long'
    await expect(page.getByText(errMsg).first()).toBeVisible()
	})

	test('validation errors: mismatched passwords show match message', async ({ page }) => {
		await page.goto('/reset-password/tok123')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		await page.getByTestId('reset-password-real').fill('newPass123')
		await page.getByTestId('reset-password-confirmation').fill('different123')
		await page.getByTestId('reset-password-submit').click()

		const form = page.getByTestId('reset-password-form')
    await expect(page.getByText('Passwords is not match').first()).toBeVisible()
	})
})
