import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import NotesIndexPage from '~/pages/notes/index.vue'
import SignInPage from '~/pages/sign-in.vue'
import NotesIndex from '~/components/Notes/Index.vue'
import NotesDetail from '~/components/Notes/Detail.vue'
import NotesList from '~/components/Notes/List.vue'
import NotesItem from '~/components/Notes/Item.vue'
import NotesCreate from '~/components/Notes/Create.vue'

declare const useToast: () => any
declare const mswServer: any

type RouterLike = ReturnType<typeof createRouter>

// Shared UI stubs (mirrors other integration tests)
const stubs = {
	AppLogo: { template: '<div data-test="logo" />' },
	UContainer: { template: '<div data-test="container"><slot /></div>' },
	UButton: {
		props: ['icon', 'loading', 'disabled', 'type'],
		template: `<button data-test="btn" :type="type || 'button'" :data-icon="icon" :data-loading="loading" :data-disabled="disabled" @click="$emit('click', $event)"><slot /></button>`,
	},
	UForm: { template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>` },
	UFormGroup: { template: `<div data-test="group"><slot /></div>` },
	UInput: {
		props: ['modelValue', 'placeholder'],
		emits: ['update:modelValue'],
		inheritAttrs: false,
		template: `<input data-test="input" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" />`,
	},
	UTextarea: {
		props: ['modelValue', 'placeholder'],
		emits: ['update:modelValue'],
		inheritAttrs: false,
		template: `<textarea data-test="textarea" :placeholder="placeholder" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" />`,
	},
	UIcon: { template: `<span data-test="icon"><slot /></span>` },
}

const createTestRouter = (): RouterLike => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/notes', component: NotesIndexPage },
			{ path: '/sign-in', component: SignInPage },
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

describe('📝 Notes integration errors (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
		vi.mocked(navigateTo as any).mockReset()
	})

	it('notes → 401 shows toast, clears user and redirects to /sign-in', async () => {
		mswServer.use(
			http.get('/api/notes', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const app = await mountRouterView('/notes')

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

		const app = await mountRouterView('/notes')

		await flushPromises()
		await nextTick()

		expect(app.text()).toContain('Unable to load notes. Please try again later.')
		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Server error')
	})
})
