import { test, expect } from '@playwright/test'
import { stubAuthForgotPassword } from '@/tests/helpers/network'

test.describe('Forgot Password E2E', () => {
	test('forgot password success and display success message', async ({ page }) => {
		// Stub forgot password API
		await stubAuthForgotPassword(page, 'success')

		// Redirect to forgot password page
		await page.goto('/forgot-password')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill email address
		const emailInput = page.getByTestId('forgot-password-email')
		await emailInput.fill('test@example.com')

		// Click submit button
		const submitButton = page.getByTestId('forgot-password-submit')
		await expect(submitButton).toBeEnabled()
		submitButton.click()

		// Check forgot password response
		const forgotPasswordResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/forgot-password') && resp.status() === 200,
			{ timeout: 3000 }
		)
		const forgotPasswordResponseBody = await forgotPasswordResponse.json()
		expect(forgotPasswordResponseBody).toMatchObject({
			message: 'Success forgot password, please check your email',
			code: 200,
		})

		// Check success message is displayed
		const successMessage = await page.getByTestId('forgot-password-success')
		await expect(successMessage).toBeVisible()
	})

	test('forgot password failed and display error message', async ({ page }) => {
		// Stub forgot password API
		await stubAuthForgotPassword(page, 'error')

		// Redirect to forgot password page
		await page.goto('/forgot-password')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill email address
		const emailInput = page.getByTestId('forgot-password-email')
		await emailInput.fill('test@example.com')

		// Click submit button
		const submitButton = page.getByTestId('forgot-password-submit')
		await expect(submitButton).toBeEnabled()
		submitButton.click()

		// Check forgot password response
		const forgotPasswordResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/forgot-password') && resp.status() === 422,
			{ timeout: 3000 }
		)
		const forgotPasswordResponseBody = await forgotPasswordResponse.json()
		expect(forgotPasswordResponseBody).toMatchObject({
			message: 'Invalid email address',
			code: 422,
		})
	})

	test('forgot password with empty email address', async ({ page }) => {
		// Stub forgot password API
		await stubAuthForgotPassword(page, 'error')

		// Redirect to forgot password page
		await page.goto('/forgot-password')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill email address
		const emailInput = page.getByTestId('forgot-password-email')
		await emailInput.fill('')

		// Click submit button
		const submitButton = page.getByTestId('forgot-password-submit')
		await expect(submitButton).toBeEnabled()
		submitButton.click()

		// Check email error message is displayed
		const forgotPasswordForm = page.getByTestId('forgot-password-form')
		const emailError = forgotPasswordForm.getByText('Email is required')
		await expect(emailError).toBeVisible()
	})

	test('forgot password with invalid email address', async ({ page }) => {
		// Stub forgot password API
		await stubAuthForgotPassword(page, 'error')

		// Redirect to forgot password page
		await page.goto('/forgot-password')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill email address
		const emailInput = page.getByTestId('forgot-password-email')
		await emailInput.fill('test@example')

		// Click submit button
		const submitButton = page.getByTestId('forgot-password-submit')
		await expect(submitButton).toBeEnabled()
		submitButton.click()

		// Check email error message is displayed
		const forgotPasswordForm = page.getByTestId('forgot-password-form')
		const emailError = forgotPasswordForm.getByText('Email is not valid')
		await expect(emailError).toBeVisible()
	})

	test('redirect to sign-in page when click sign-in button', async ({ page }) => {
		// Redirect to forgot password page
		await page.goto('/forgot-password')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get sign-in button element
		const signInButton = page.getByTestId('forgot-password-sign-in')
		await expect(signInButton).toBeVisible()

		// Click sign-in button
		signInButton.click()

		// Check redirect to sign-in page
		await expect(page).toHaveURL('/sign-in')

		// Check sign-in title
		const signInTitle = page.getByTestId('login-title')
		await expect(signInTitle).toBeVisible()
	})
})
