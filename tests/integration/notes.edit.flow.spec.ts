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

// Local UI and dialog stubs (no shared helpers)
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
	AppLogo: { template: '<div data-test="logo" />' },
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

describe('📝 Notes integration edit flow (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.stubGlobal(
			'useHead',
			vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg))
		)
	})

	it('updates a note successfully and shows toast; content changes', async () => {
		const app = await mountRouterView('/notes/1')

		await flushPromises()
		await nextTick()

		// Initial title from sample data
		expect(app.text()).toContain(sampleNotes[0].title)

		// Open update dialog via header action
		const editBtn = app
			.findAll('[data-test="btn"]')
			.find((b) => b.attributes('data-icon') === 'i-heroicons-pencil-square')
		expect(editBtn).toBeTruthy()
		await editBtn!.trigger('click')

		// Fill form
		const inputs = app.findAll('[data-test="input"]')
		const textarea = app.find('[data-test="textarea"]')
		expect(inputs.length).toBeGreaterThan(0)
		await inputs[0].setValue('Updated Title')
		await textarea.setValue('Updated Description')

		// Submit update
		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		// Toast fired and content updated
		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Update Note')
		expect(app.text()).toContain('Updated Title')
		expect(app.text()).toContain('Updated Description')
	})

	it('update validation error (422) toasts and stays on modal; content unchanged', async () => {
		mswServer.use(
			http.put('/api/notes/:id', async () =>
				HttpResponse.json({ message: 'Validation failed' }, { status: 422 })
			)
		)

		const app = await mountRouterView('/notes/1')

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
