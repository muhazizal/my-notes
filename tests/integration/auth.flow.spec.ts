import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import SignInPage from '~/pages/sign-in.vue'
import NotesIndexPage from '~/pages/notes/index.vue'
import ForgotPasswordPage from '~/pages/forgot-password.vue'
import Login from '~/components/Login/Index.vue'
import ForgotPassword from '~/components/ForgotPassword/Index.vue'

import NotesIndex from '~/components/Notes/Index.vue'
import NotesDetail from '~/components/Notes/Detail.vue'
import NotesList from '~/components/Notes/List.vue'
import NotesItem from '~/components/Notes/Item.vue'
import NotesCreate from '~/components/Notes/Create.vue'

declare const useToast: () => any

type RouterLike = ReturnType<typeof createRouter>

// Shared UI stubs for integration
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
		emits: ['update:modelValue', 'keypress'],
		inheritAttrs: false,
		template: `<input data-test="input" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" @keypress="$emit('keypress', $event)" />`,
	},
	UTextarea: {
		props: ['modelValue', 'placeholder'],
		emits: ['update:modelValue'],
		inheritAttrs: false,
		template: `<textarea data-test="textarea" :placeholder="placeholder" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" />`,
	},
	UIcon: { template: `<span data-test="icon"><slot /></span>` },
}

// More conservative stubs for ForgotPassword (mirror unit test)
const forgotStubs = {
	UButton: {
		name: 'UButton',
		template:
			'<button data-test="btn" :type="$attrs.type || \'button\'" :disabled="$attrs.disabled" :data-loading="$attrs.loading" @click="$emit(\'click\', $event)"><slot /></button>',
	},
	UForm: {
		name: 'UForm',
		template: '<form data-test="form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
	},
	UFormGroup: { name: 'UFormGroup', template: '<div data-test="group"><slot /></div>' },
	UInput: {
		name: 'UInput',
		props: ['modelValue'],
		emits: ['update:modelValue', 'keypress'],
		template:
			'<input data-test="input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keypress="$emit(\'keypress\', $event)" />',
	},
	AppLogo: { name: 'AppLogo', template: '<div>Logo</div>' },
}

// Create a test router instance covering auth and notes routes
const createTestRouter = (): RouterLike => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/sign-in', component: SignInPage },
			{ path: '/notes', component: NotesIndexPage },
			{ path: '/forgot-password', component: ForgotPasswordPage },
		],
	})
	return router
}

// Mount helper binding Nuxt composables to the real router
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
					// manually register auto-imported components
					Notes: NotesIndex,
					NotesIndex,
					NotesDetail,
					NotesList,
					NotesItem,
					NotesCreate,
					Login,
					ForgotPassword,
				},
			},
		}
	)

	await flushPromises()
	await nextTick()

	return wrapper
}

// Mount the ForgotPassword component directly without router to avoid extraneous patching
const mountForgotComp = async () => {
	const wrapper = mount(ForgotPassword, {
		global: {
			stubs: { ...forgotStubs },
		},
	})

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('🔐 Auth integration (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('login → redirects to /notes and renders list', async () => {
		const app = await mountRouterView('/sign-in')

		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		await inputs[0].setValue('test@example.com')
		await inputs[1].setValue('password123')

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Login',
				description: expect.stringContaining('Success login user'),
			})
		)

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/notes')

		const items = app.findAll('.item')
		expect(items.length).toBeGreaterThan(0)
	})

	it('forgot-password → submits shows toast and success caption', async () => {
		const comp = await mountForgotComp()

		const emailInput = comp.find('[data-test="input"]')
		await emailInput.setValue('user@example.com')

		await comp.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Forgot Password',
				description: expect.stringContaining('Success forgot password'),
			})
		)

		// Success caption is shown
		expect(comp.text()).toContain('Success to send reset password URL, please check your email.')
		// Sign in link should not be visible after success
		const signInBtnNow = comp.findAll('[data-test="btn"]').find((b) => b.text() === 'Sign in')
		expect(!!signInBtnNow).toBe(false)
	})

	it('forgot-password → "Sign in" link navigates to /sign-in', async () => {
		// Stub router and assert replace is called, avoid real navigation unmount
		const replaceSpy = vi.fn()
		const useRouterMock = useRouter as ReturnType<typeof vi.fn>
		useRouterMock.mockReturnValue({ replace: replaceSpy })

		const comp = mount(ForgotPassword, { global: { stubs: forgotStubs } })

		const signInBtn = comp.findAll('[data-test="btn"]').find((b) => b.text() === 'Sign in')
		expect(signInBtn).toBeTruthy()
		await signInBtn!.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})
})
