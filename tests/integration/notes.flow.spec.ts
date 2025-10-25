import { nextTick, ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import NotesIndexPage from '~/pages/notes/index.vue'
import NotesDetailPage from '~/pages/notes/[id].vue'
import NotesIndex from '~/components/Notes/Index.vue'
import NotesDetail from '~/components/Notes/Detail.vue'
import NotesList from '~/components/Notes/List.vue'
import NotesItem from '~/components/Notes/Item.vue'
import NotesCreate from '~/components/Notes/Create.vue'

import { sampleNotes } from '../mocks/data'

declare const useToast: () => any
declare const mswServer: any

type RouterLike = ReturnType<typeof createRouter>

// UI and dialog stubs for integration
const stubs = {
	UContainer: { template: '<div data-test="container"><slot /></div>' },
	UButton: {
		props: ['icon', 'loading', 'disabled', 'type'],
		template: `<button data-test="btn" :type="type || 'button'" :data-icon="icon" :data-loading="loading" :data-disabled="disabled" @click="$emit('click', $event)"><slot /></button>`,
	},
	UForm: { template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>` },
	UFormGroup: { template: `<div data-test="group"><slot /></div>` },
	UInput: {
		props: ['modelValue', 'placeholder'],
		emits: ['update:modelValue', 'keypress'],
		template: `<input data-test="input" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" @keypress="$emit('keypress', $event)" />`,
	},
	UTextarea: {
		props: ['modelValue', 'placeholder'],
		emits: ['update:modelValue'],
		template: `<textarea data-test="textarea" :placeholder="placeholder" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" />`,
	},
	UIcon: { template: `<span data-test="icon"><slot /></span>` },
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

const createTestRouter = (): RouterLike => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/notes', component: NotesIndexPage },
			{ path: '/notes/:id', component: NotesDetailPage },
		],
	})
	return router
}

const mountRouterView = async (route: string) => {
	const router = createTestRouter()
	router.push(route)
	await router.isReady()

	const useRouterMock = useRouter as ReturnType<typeof vi.fn>
	useRouterMock.mockReturnValue(router)

	const useRouteMock = useRoute as ReturnType<typeof vi.fn>
	useRouteMock.mockReturnValue(router.currentRoute.value)

	const wrapper = mount(
		{ template: '<Suspense><router-view /></Suspense>' },
		{
			global: {
				plugins: [router],
				stubs: { ...stubs, Suspense: false },
				components: {
					Notes: NotesIndex,
					NotesIndex,
					NotesDetail,
					NotesList,
					NotesItem,
					NotesCreate,
				},
			},
		}
	)

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('📝 Notes integration success flow', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.stubGlobal(
			'useHead',
			vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg))
		)
	})

	it('lists notes and navigates to detail on item click', async () => {
		const app = await mountRouterView('/notes')

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

		const app = await mountRouterView('/notes')

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
