import { test, expect } from '@playwright/test'
import { stubAuthLogin, stubUserProfile, stubNotesIndex } from '@/tests/helpers/network'
import { sampleUser, sampleNotes } from '@/tests/mocks/data'

test.describe('Login E2E', () => {
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

		// Check redirect to notes index page
		await expect(page).toHaveURL('/notes')

		// Check notes index response
		const notesIndexResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/notes') && resp.status() === 200,
			{ timeout: 3000 }
		)
		const notesIndexResponseBody = await notesIndexResponse.json()
		expect(notesIndexResponseBody).toMatchObject({
			message: 'Success get notes',
			data: sampleNotes,
			code: 200,
		})

		// Check notes index element is visible
		const notesIndex = page.getByTestId('notes-index')
		await expect(notesIndex).toBeVisible()

		const noteItems = page.getByTestId('note-item')
		const allNotes = await noteItems.all()
		expect(allNotes).toHaveLength(sampleNotes.length)
	})

	test('sign in with invalid credentials shows error message', async ({ page }) => {
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

	test('sign-in with empty credentials show validation error', async ({ page }) => {
		// Redirect to sign in page
		await page.goto('/sign-in')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Click login button
		const loginButton = page.getByTestId('login-button')
		await expect(loginButton).toBeEnabled()
		loginButton.click()

		// Check login form email is required
		const loginForm = page.getByTestId('login-form')

		const loginEmailError = loginForm.getByText('Email is required')
		await expect(loginEmailError).toBeVisible()

		// Check login form password is required
		const loginPasswordError = loginForm.getByText('Password is required')
		await expect(loginPasswordError).toBeVisible()
	})

	test('redirect to sign-up page when click sign-up button', async ({ page }) => {
		// Redirect to sign in page
		await page.goto('/sign-in')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get sign-up button element
		const signUpButton = page.getByTestId('login-sign-up-button')
		await expect(signUpButton).toBeVisible()

		// Click sign-up button
		signUpButton.click()

		// Check redirect to sign-up page
		await expect(page).toHaveURL('/sign-up')

		// Check sign-up title is visible
		const signUpTitle = page.getByTestId('register-title')
		await expect(signUpTitle).toBeVisible()
	})

	test('redirect to forgot password page when click forgot password button', async ({ page }) => {
		// Redirect to sign in page
		await page.goto('/sign-in')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get forgot password button element
		const forgotPasswordButton = page.getByTestId('login-forgot-password-button')
		await expect(forgotPasswordButton).toBeVisible()

		// Click forgot password button
		forgotPasswordButton.click()

		// Check redirect to forgot password page
		await expect(page).toHaveURL('/forgot-password')

		// Check forgot password title is visible
		const forgotPasswordTitle = page.getByTestId('forgot-password-title')
		await expect(forgotPasswordTitle).toBeVisible()
	})
})
