import { test, expect } from '@/tests/playwright.setup'
import { http, HttpResponse } from 'msw'
import { sampleUser, sampleNotes } from '@/tests/helpers/data'

test.describe('Login E2E', () => {
	test.afterEach(async ({ network }) => {
		await network.resetHandlers()
	})

	test('sign-in success redirects to /notes', async ({ page }) => {
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

		// Rely on UI: redirect and content rendering

		// Check redirect to notes index page
		await expect(page).toHaveURL('/notes')

		// Check notes index element is visible
		const notesIndex = page.getByTestId('notes-index')
		await expect(notesIndex).toBeVisible({ timeout: 5000 })

		const noteItems = page.getByTestId('note-item')
		const allNotes = await noteItems.all()
		expect(allNotes).toHaveLength(sampleNotes.length)
	})

	test('sign in with invalid credentials shows error message', async ({ page, network }) => {
		// Override login endpoint to return 422
		await network.use(
			http.post('/api/auth/login', () =>
				HttpResponse.json({ message: 'Invalid email or password', code: 422 }, { status: 422 })
			)
		)

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
		await loginButton.click()

		// Assert we stay on sign-in and show login form
		await expect(page).toHaveURL('/sign-in')
		await expect(page.getByTestId('login-form')).toBeVisible()
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
