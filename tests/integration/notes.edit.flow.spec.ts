import { nextTick, ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { mountRouterView, commonStubs } from '~/tests/helpers/testUtils'

import NotesIndexPage from '~/pages/notes/index.vue'
import NotesDetailPage from '~/pages/notes/[id].vue'
import NotesIndex from '~/components/Notes/Index.vue'
import NotesDetail from '~/components/Notes/Detail.vue'
import NotesList from '~/components/Notes/List.vue'
import NotesItem from '~/components/Notes/Item.vue'
import NotesCreate from '~/components/Notes/Create.vue'
import { sampleNotes } from '~/tests/mocks/data'
import {
	AppLogoStub,
	UContainerStub,
	UButtonStub,
	UFormStub,
	UFormGroupStub,
	UInputStub,
	UTextareaStub,
	UIconStub,
	createAppCreateDialogStub,
} from '~/tests/helpers/uiStubs'

declare const useToast: () => any
declare const mswServer: any
declare const useRouter: () => any
declare const useRoute: () => any

const openSpy = vi.fn()

// Local UI and dialog stubs (plus shared common stubs)
const stubs = {
	UContainer: UContainerStub,
	UButton: UButtonStub,
	UForm: UFormStub,
	UFormGroup: UFormGroupStub,
	UInput: UInputStub,
	UTextarea: UTextareaStub,
	UIcon: UIconStub,
	AppLogo: AppLogoStub,
	AppCreateDialog: createAppCreateDialogStub(openSpy, 'create-dialog'),
}

const routes = [
	{ path: '/notes', component: NotesIndexPage },
	{ path: '/notes/:id', component: NotesDetailPage },
]

describe('📝 Notes integration edit flow (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.stubGlobal(
			'useHead',
			vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg))
		)
	})

	it('update ignored when note id missing (early return)', async () => {
		mswServer.use(
			http.get('/api/notes/:id', async () =>
				HttpResponse.json(
					{
						message: 'Success get note',
						data: {
							id: '',
							title: 'No ID',
							description: 'desc',
							raw_description: 'desc',
							createdAt: new Date().toISOString(),
							updatedAt: '',
						},
						code: 200,
					},
					{ status: 200 }
				)
			)
		)

		const app = await mountRouterView(
			'/notes/1',
			routes,
			{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
			{ ...commonStubs, ...stubs }
		)

		await flushPromises()
		await nextTick()

		// Open update dialog
		const editBtn = app
			.findAll('[data-test="btn"]')
			.find((b) => b.attributes('data-icon') === 'i-heroicons-pencil-square')
		expect(editBtn).toBeTruthy()
		await editBtn!.trigger('click')

		const inputs = app.findAll('[data-test="input"]')
		const textarea = app.find('[data-test="textarea"]')
		await inputs[0].setValue('Updated Title')
		await textarea.setValue('Updated Description')

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		// No toast should be fired due to early return
		expect(useToast().add).not.toHaveBeenCalled()
		// Title unchanged from response (still "No ID")
		const titleEl = app.find('h4.note__title')
		expect(titleEl.exists()).toBe(true)
		expect(titleEl.text()).toBe('No ID')
	})

	it('update validation error (422) toasts and stays on modal; content unchanged', async () => {
		mswServer.use(
			http.put('/api/notes/:id', async () =>
				HttpResponse.json({ message: 'Validation failed' }, { status: 422 })
			)
		)

		const app = await mountRouterView(
			'/notes/1',
			routes,
			{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
			{ ...commonStubs, ...stubs }
		)

		await flushPromises()
		await nextTick()

		// Open update dialog
		const editBtn = app
			.findAll('[data-test="btn"]')
			.find((b) => b.attributes('data-icon') === 'i-heroicons-pencil-square')
		expect(editBtn).toBeTruthy()
		await editBtn!.trigger('click')

		const inputs = app.findAll('[data-test="input"]')
		const textarea = app.find('[data-test="textarea"]')
		await inputs[0].setValue('Updated Title')
		await textarea.setValue('Updated Description')

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		// Interceptor fired toast for 422; modal should remain open
		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Validation error')

		expect(app.find('[data-test="create-dialog"]').exists()).toBe(true)
		const titleEl = app.find('h4.note__title')
		expect(titleEl.exists()).toBe(true)
		expect(titleEl.text()).toBe(sampleNotes[0].title)
	})
})
