import { test, expect } from '@playwright/test'

test.describe('Landing E2E', () => {
	test('check landing page title is visible', async ({ page }) => {
		// Redirect to landing page
		await page.goto('/')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get title element
		const title = page.getByTestId('landing-title')
		await expect(title).toBeVisible()
	})

	test('redirect to sign in page when click sign in button', async ({ page }) => {
		// Redirect to landing page
		await page.goto('/')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get sign in button element
		const signInButton = page.getByTestId('landing-sign-in-button')
		await expect(signInButton).toBeVisible()

		// Click sign in button
		signInButton.click()

		// Check redirect to sign in page
		await expect(page).toHaveURL('/sign-in')
	})

	test('redirect to sign up page when click sign up button', async ({ page }) => {
		// Redirect to landing page
		await page.goto('/')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Get sign up button element
		const signUpButton = page.getByTestId('landing-sign-up-button')
		await expect(signUpButton).toBeVisible()

		// Click sign up button
		signUpButton.click()

		// Check redirect to sign up page
		await expect(page).toHaveURL('/sign-up')
	})
})
