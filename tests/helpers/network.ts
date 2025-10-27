import type { Page } from '@playwright/test'
import { sampleUser, sampleNotes } from '../mocks/data'

export async function stubAuthLogin(page: Page, mode: 'success' | 'error') {
	await page.route('**/api/auth/login', async (route) => {
		await route.fulfill({
			status: mode === 'success' ? 200 : 422,
			contentType: 'application/json',
			body: JSON.stringify({
				message: mode === 'success' ? 'Success login user' : 'Invalid email or password',
				code: mode === 'success' ? 200 : 422,
			}),
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
