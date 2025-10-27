import { test, expect } from '@playwright/test'
import { stubAuthLogin, stubUserProfile, stubNotesIndex } from '@/tests/helpers/network'
import { sampleUser } from '@/tests/mocks/data'

test.describe('🔐 Auth E2E', () => {
	test.beforeEach(async ({ page }) => {
		await stubUserProfile(page)
		await stubNotesIndex(page)
	})

	test('sign-in success redirects to /notes', async ({ page }) => {
		// Stub network
		await stubAuthLogin(page, 'success')

		// Redirect to sign in page
		await page.goto('/sign-in')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get login form elements
		const loginEmailInput = page.getByTestId('login-email-input')
		const loginPasswordInput = page.getByTestId('login-password-input')

		// Check login form elements are visible
		await expect(loginEmailInput).toBeVisible()
		await expect(loginPasswordInput).toBeVisible()

		// Fill login form
		await loginEmailInput.fill('a@b.com')
		await loginPasswordInput.fill('P@ssw0rd!')

		// Click login button
		const loginButton = page.getByTestId('login-button')
		await expect(loginButton).toBeEnabled()
		loginButton.click()

		// Check login response
		const loginResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/login') && resp.status() === 200,
			{ timeout: 3000 }
		)
		const loginResponseBody = await loginResponse.json()
		expect(loginResponseBody).toMatchObject({
			message: 'Success login user',
			code: 200,
		})

		// Check user profile response
		const userProfileResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/user/profile') && resp.status() === 200,
			{ timeout: 3000 }
		)
		const userProfileResponseBody = await userProfileResponse.json()
		expect(userProfileResponseBody).toMatchObject({
			message: 'Success get user profile',
			data: sampleUser,
			code: 200,
		})

		// Check notes index element is visible
		const notesIndex = page.getByTestId('notes-index')
		await expect(notesIndex).toBeVisible()
	})

	test('sign in with invalid credentials shows validation error', async ({ page }) => {
		// Stub network
		await stubAuthLogin(page, 'error')
		await stubNotesIndex(page)

		// Redirect to sign in page
		await page.goto('/sign-in')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get login form elements
		const loginEmailInput = page.getByTestId('login-email-input')
		const loginPasswordInput = page.getByTestId('login-password-input')

		// Check login form elements are visible
		await expect(loginEmailInput).toBeVisible()
		await expect(loginPasswordInput).toBeVisible()

		// Fill login form with invalid credentials
		await loginEmailInput.fill('invalid@example.com')
		await loginPasswordInput.fill('invalidpassword')

		// Click login button
		const loginButton = page.getByTestId('login-button')
		await expect(loginButton).toBeEnabled()
		loginButton.click()

		// Check login response
		const loginResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/login') && resp.status() === 422,
			{ timeout: 3000 }
		)
		const loginResponseBody = await loginResponse.json()
		expect(loginResponseBody).toMatchObject({
			message: 'Invalid email or password',
			code: 422,
		})
	})
})
