import { nextTick } from 'vue'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import NotesIndexPage from '~/pages/notes/index.vue'
import SignInPage from '~/pages/sign-in.vue'
import NotesIndex from '~/components/Notes/Index.vue'
import NotesDetail from '~/components/Notes/Detail.vue'
import NotesList from '~/components/Notes/List.vue'
import NotesItem from '~/components/Notes/Item.vue'
import NotesCreate from '~/components/Notes/Create.vue'
import { mountRouterView, commonStubs } from '~/tests/helpers/testUtils'

declare const useToast: () => any
declare const mswServer: any

const routes = [
	{ path: '/notes', component: NotesIndexPage },
	{ path: '/sign-in', component: SignInPage },
]

describe('📝 Notes integration errors (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.mocked(navigateTo as any).mockReset()
	})

	it('notes → 401 shows toast, clears user and redirects to /sign-in', async () => {
		mswServer.use(
			http.get('/api/notes', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const app = await mountRouterView(
			'/notes',
			routes,
			{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
			commonStubs
		)

		await flushPromises()
		await nextTick()

		// UI error banner should be shown
		expect(app.text()).toContain('Unable to load notes. Please try again later.')

		// Interceptor fired toast and redirected via navigateTo
		expect(useToast().add).toHaveBeenCalled()
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
	})

	it('notes → 500 shows server error toast and error banner', async () => {
		mswServer.use(
			http.get('/api/notes', () => HttpResponse.json({ message: 'Server down' }, { status: 500 }))
		)

		const app = await mountRouterView(
			'/notes',
			routes,
			{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
			commonStubs
		)

		await flushPromises()
		await nextTick()

		expect(app.text()).toContain('Unable to load notes. Please try again later.')
		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Server error')
	})
})
