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

const openSpy = vi.fn()

// Shared UI stubs
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

describe('📝 Notes integration delete flow (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.stubGlobal(
			'useHead',
			vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg))
		)
	})

	it('deletes a note successfully, shows toast, and navigates to /notes', async () => {
		const app = await mountRouterView(
		'/notes/1',
		routes,
		{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
		{ ...commonStubs, ...stubs }
	)

		await flushPromises()
		await nextTick()

		// Trigger deletion via header action
		const deleteBtn = app
			.findAll('[data-test="btn"]')
			.find((b) => b.attributes('data-icon') === 'i-heroicons-trash')
		expect(deleteBtn).toBeTruthy()
		await deleteBtn!.trigger('click')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Delete Note')

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/notes')
	})

	it('delete server error (500) toasts and stays on detail page', async () => {
		mswServer.use(
			http.delete('/api/notes/:id', () =>
				HttpResponse.json({ message: 'Server error' }, { status: 500 })
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

		const deleteBtn = app
			.findAll('[data-test="btn"]')
			.find((b) => b.attributes('data-icon') === 'i-heroicons-trash')
		expect(deleteBtn).toBeTruthy()
		await deleteBtn!.trigger('click')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Server error')

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/notes/1')
	})

	it('delete ignored when note id missing (early return)', async () => {
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

		const deleteBtn = app
			.findAll('[data-test="btn"]')
			.find((b) => b.attributes('data-icon') === 'i-heroicons-trash')
		expect(deleteBtn).toBeTruthy()
		await deleteBtn!.trigger('click')

		await flushPromises()
		await nextTick()

		expect(useToast().add).not.toHaveBeenCalled()
		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/notes/1')
	})
})
