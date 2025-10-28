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

import { sampleNotes } from '@/tests/helpers/data'
import {
	UContainerStub,
	UButtonStub,
	UFormStub,
	UFormGroupStub,
	UInputStub,
	UTextareaStub,
	UIconStub,
} from '~/tests/helpers/uiStubs'

declare const useToast: () => any
declare const mswServer: any
declare const useRouter: () => any
declare const useRoute: () => any

// UI and dialog stubs for integration
const stubs = {
	UContainer: UContainerStub,
	UButton: UButtonStub,
	UForm: UFormStub,
	UFormGroup: UFormGroupStub,
	UInput: UInputStub,
	UTextarea: UTextareaStub,
	UIcon: UIconStub,
	AppCreateDialog: {
		name: 'AppCreateDialog',
		props: ['title'],
		setup(_: any, { expose }: any) {
			const isOpen = ref(false)
			const handleOpenModal = (open?: boolean) => {
				isOpen.value = !!open
			}
			expose({ handleOpenModal })
			return { isOpen }
		},
		template: `<div v-if="isOpen" data-test="create-dialog"><slot name="body" /></div>`,
	},
}

const routes = [
	{ path: '/notes', component: NotesIndexPage },
	{ path: '/notes/:id', component: NotesDetailPage },
]

describe('📝 Notes integration success flow', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.stubGlobal(
			'useHead',
			vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg))
		)
	})

	it('lists notes and navigates to detail on item click', async () => {
		const app = await mountRouterView(
			'/notes',
			routes,
			{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
			{ ...commonStubs, ...stubs }
		)

		await flushPromises()
		await nextTick()

		// Notes list shows sample titles
		expect(app.text()).toContain(sampleNotes[0].title)
		expect(app.text()).toContain(sampleNotes[1].title)

		const items = app.findAll('[role="button"]')
		expect(items.length).toBeGreaterThanOrEqual(2)

		// Click the actual first note item (avoid the Create Note tile)
		const firstNoteEl = items.find((el) => el.text().includes(sampleNotes[0].title))
		expect(firstNoteEl).toBeTruthy()
		await firstNoteEl!.trigger('click')
		await flushPromises()
		await nextTick()

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe(`/notes/${sampleNotes[0].id}`)
	})

	it('creates a note successfully and shows toast', async () => {
		mswServer.use(
			http.post('/api/notes', async () => {
				return HttpResponse.json(
					{
						message: 'Success create note',
						data: {
							id: '99',
							title: 'Brand New Note',
							description: 'Created from test',
							raw_description: 'Created from test',
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						code: 201,
					},
					{ status: 201 }
				)
			})
		)

		const app = await mountRouterView(
			'/notes',
			routes,
			{ Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate },
			{ ...commonStubs, ...stubs }
		)

		await flushPromises()
		await nextTick()

		// Open create dialog
		const createTrigger = app
			.findAll('[role="button"]')
			.find((el) => el.text().includes('Create Note'))
		expect(createTrigger).toBeTruthy()
		await createTrigger!.trigger('click')

		// Fill form
		const inputs = app.findAll('[data-test="input"]')
		const textarea = app.find('[data-test="textarea"]')
		expect(inputs.length).toBeGreaterThan(0)
		await inputs[0].setValue('Brand New Note')
		await textarea.setValue('Created from test')

		// Submit
		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		// Toast fired and new note appears
		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Create Note')
		expect(app.text()).toContain('Brand New Note')
	})
})
