import { test, expect } from '@/tests/playwright.setup'
import { sampleNotes } from '@/tests/helpers/data'
import { loginViaUI } from '@/tests/helpers/e2e'

test.describe('Notes E2E', () => {
	test.beforeEach(async ({ network }) => {
		await network.resetHandlers()
	})
	test.afterEach(async ({ network }) => {
		await network.resetHandlers()
	})

	test('notes index shows list when authenticated', async ({ page }) => {
		// Log in via UI helper to set store state
		await loginViaUI(page)
		await expect(page).toHaveURL('/notes')

		// Notes index container is visible
		const notesIndex = page.getByTestId('notes-index')
		await expect(notesIndex).toBeVisible()

		// List renders expected number of note items
		const noteItems = page.getByTestId('note-item')
		const allNotes = await noteItems.all()
		expect(allNotes).toHaveLength(sampleNotes.length)
	})

	test('unauthenticated users are redirected to sign-in', async ({ page }) => {
		await page.goto('/notes')
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		await expect(page).toHaveURL('/sign-in')
		await expect(page.getByTestId('login-title')).toBeVisible()
	})
})
