import type { Page } from '@playwright/test'
import { sampleUser, sampleNotes } from '../mocks/data'

export async function stubAuthLoginSuccess(page: Page) {
	await page.route('**/api/auth/login', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ message: 'Success login user', code: 200 }),
		})
	})
}

export async function stubUserProfile(page: Page) {
	await page.route('**/api/user/profile', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				message: 'Success get user profile',
				data: sampleUser,
				code: 200,
			}),
		})
	})
}

export async function stubNotesIndex(page: Page) {
	await page.route('**/api/notes', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				message: 'Success get notes',
				data: sampleNotes,
				code: 200,
			}),
		})
	})
}
