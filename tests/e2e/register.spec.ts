import { test, expect } from '@/tests/playwright.setup'
import { http, HttpResponse } from 'msw'

test.describe('Register E2E', () => {
	test.afterEach(async ({ network }) => {
		await network.resetHandlers()
	})

	test('register success and display success caption', async ({ page }) => {
		// Redirect to register page
		await page.goto('/sign-up')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill register form
		const fullnameInput = page.getByTestId('register-fullname-input')
		await fullnameInput.fill('Test User')

		const usernameInput = page.getByTestId('register-username-input')
		await usernameInput.fill('testuser')

		const emailInput = page.getByTestId('register-email-input')
		await emailInput.fill('test@example.com')

		const passwordInput = page.getByTestId('register-password-input')
		await passwordInput.fill('password123')

		const confirmPasswordInput = page.getByTestId('register-confirm-password-input')
		await confirmPasswordInput.fill('password123')

		const tncCheckbox = page.getByTestId('register-tnc-checkbox')
		await tncCheckbox.check()

		// Click register button
		const registerButton = page.getByTestId('register-button')
		registerButton.click()

		// Check register response (default MSW returns 201 on success)
		const registerResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/register') && resp.status() === 201,
			{ timeout: 3000 }
		)
		const registerResponseBody = await registerResponse.json()
		expect(registerResponseBody).toMatchObject({
			message: 'Success register user, please verify your email',
			code: 201,
		})

		// Check success caption
		const successCaption = page.getByTestId('register-success-caption')
		await expect(successCaption).toBeVisible()
	})

	test('register with same email show error message', async ({ page, network }) => {
		// Override register API to return 422
		await network.use(
			http.put('/api/auth/register', () =>
				HttpResponse.json({ message: 'User already exists', code: 422 }, { status: 422 })
			)
		)

		// Redirect to register page
		await page.goto('/sign-up')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Fill register form
		const fullnameInput = page.getByTestId('register-fullname-input')
		await fullnameInput.fill('Test User')

		const usernameInput = page.getByTestId('register-username-input')
		await usernameInput.fill('testuser')

		const emailInput = page.getByTestId('register-email-input')
		await emailInput.fill('test@example.com')

		const passwordInput = page.getByTestId('register-password-input')
		await passwordInput.fill('password123')

		const confirmPasswordInput = page.getByTestId('register-confirm-password-input')
		await confirmPasswordInput.fill('password123')

		const tncCheckbox = page.getByTestId('register-tnc-checkbox')
		await tncCheckbox.check()

		// Click register button
		const registerButton = page.getByTestId('register-button')
		registerButton.click()

		// Check register response
		const registerResponse = await page.waitForResponse(
			(resp) => resp.url().includes('/api/auth/register') && resp.status() === 422,
			{ timeout: 3000 }
		)
		const registerResponseBody = await registerResponse.json()
		expect(registerResponseBody).toMatchObject({
			message: 'User already exists',
			code: 422,
		})
	})

	test('register with empty credentials show validation error', async ({ page }) => {
		// Redirect to register page
		await page.goto('/sign-up')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Click register button
		const registerButton = page.getByTestId('register-button')
		await expect(registerButton).toBeEnabled()
		registerButton.click()

		// Check register form fullname is required
		const registerForm = page.getByTestId('register-form')

		const registerFullnameError = registerForm.getByText('Full name is required')
		await expect(registerFullnameError).toBeVisible()

		// Check register form username is required
		const registerUsernameError = registerForm.getByText(
			'Username must be at least 3 characters long'
		)
		await expect(registerUsernameError).toBeVisible()

		// Check register form email is required
		const registerEmailError = registerForm.getByText('Email is required')
		await expect(registerEmailError).toBeVisible()

		// Check register form password is required
		const registerPasswordError = registerForm.getByText(
			'Password must be at least 5 characters long'
		)
		const firstPasswordError = registerPasswordError.nth(0)
		const secondPasswordError = registerPasswordError.nth(1)
		await expect(firstPasswordError).toBeVisible()
		await expect(secondPasswordError).toBeVisible()

		// Check register form tnc is required
		const registerTncError = registerForm.getByText('Term and conditions must be checked')
		await expect(registerTncError).toBeVisible()
	})

	test('redirect to sign in page when click sign in button', async ({ page }) => {
		// Redirect to register page
		await page.goto('/sign-up')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get sign in button element
		const signInButton = page.getByTestId('register-sign-in-button')
		await expect(signInButton).toBeVisible()

		// Click sign in button
		signInButton.click()

		// Check redirect to sign in page
		await expect(page).toHaveURL('/sign-in')

		// Check login title
		const loginTitle = page.getByTestId('login-title')
		await expect(loginTitle).toBeVisible()
	})
})
