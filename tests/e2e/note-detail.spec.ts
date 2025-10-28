import { test, expect } from '@/tests/playwright.setup'
import { http, HttpResponse } from 'msw'
import { sampleNotes } from '@/tests/helpers/data'
import { loginViaUI } from '@/tests/helpers/e2e'

test.describe('Note Detail E2E', () => {
	test.beforeEach(async ({ network }) => {
		await network.resetHandlers()
	})
	test.afterEach(async ({ network }) => {
		await network.resetHandlers()
	})

	test('renders note detail actions and content when authenticated', async ({ page }) => {
		await loginViaUI(page)
		await expect(page).toHaveURL('/notes')
		await page.getByTestId('note-item').first().click()
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Actions visible
		await expect(page.getByTestId('detail-back-button')).toBeVisible()
		await expect(page.getByTestId('detail-update-button')).toBeVisible()
		await expect(page.getByTestId('detail-delete-button')).toBeVisible()

		// Content matches sample note
		await expect(page.getByTestId('note-title')).toHaveText(sampleNotes[0].title)
		await expect(page.getByTestId('note-description')).toHaveText(sampleNotes[0].description)
	})

	test('update note shows success toast and updates content', async ({ page }) => {
		await loginViaUI(page)
		await expect(page).toHaveURL('/notes')
		await page.getByTestId('note-item').first().click()
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Open update dialog
		await page.getByTestId('detail-update-button').click()

		// Fill form in dialog
		const newTitle = 'Updated First Note'
		const newDesc = 'Updated description for first note.'
		await page.getByTestId('update-title-input').fill(newTitle)
		await page.getByTestId('update-description-textarea').fill(newDesc)

		// Submit update
		await page.getByTestId('update-submit-button').click()

		// Toast appears and content updates
		await expect(page.getByText('Update Note').first()).toBeVisible()
		await expect(page.getByText('Success update note').first()).toBeVisible()
		await expect(page.getByTestId('note-title')).toHaveText(newTitle)
		await expect(page.getByTestId('note-description')).toHaveText(newDesc)
	})

	test('delete note shows success toast and redirects to index', async ({ page }) => {
		await loginViaUI(page)
		await expect(page).toHaveURL('/notes')
		await page.getByTestId('note-item').first().click()
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		// Delete action
		await page.getByTestId('detail-delete-button').click()

		// Toast and redirect to /notes
		await expect(page.getByText('Delete Note').first()).toBeVisible()
		await expect(page.getByText('Success delete note').first()).toBeVisible()
		await expect(page).toHaveURL('/notes')
		await expect(page.getByTestId('notes-index')).toBeVisible()
	})

	test('error loading note shows message and back navigation works', async ({ page, network }) => {
		await loginViaUI(page)
		await expect(page).toHaveURL('/notes')

		// Force a 404 on get-by-id to hit error state
		await network.use(
			http.get('/api/notes/:id', () =>
				HttpResponse.json({ message: 'Note not found', code: 404 }, { status: 404 })
			)
		)

		await page.getByTestId('note-item').first().click()
		await page.waitForLoadState('domcontentloaded')
		await page.waitForLoadState('networkidle')

		await expect(
			page.getByText('Unable to load note. It may have been moved or deleted.')
		).toBeVisible()
		await page.getByTestId('detail-error-back-button').click()
		await expect(page).toHaveURL('/notes')
		await expect(page.getByTestId('notes-index')).toBeVisible()
	})
})
