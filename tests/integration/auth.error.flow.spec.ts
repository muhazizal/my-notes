import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import SignInPage from '~/pages/sign-in.vue'
import NotesIndexPage from '~/pages/notes/index.vue'
import ForgotPasswordPage from '~/pages/forgot-password.vue'
import Login from '~/components/Login/Index.vue'
import ForgotPassword from '~/components/ForgotPassword/Index.vue'

// Local UI stubs for integration (mirrors unit helper behavior)
const UButtonStub = {
	name: 'UButton',
	props: ['icon', 'type', 'loading', 'disabled'],
	template: `
    <button
      data-test="btn"
      :type="type || ($attrs && $attrs.type) || 'button'"
      :disabled="(disabled ?? ($attrs && $attrs.disabled)) ? true : undefined"
      :data-disabled="(disabled ?? ($attrs && $attrs.disabled)) ? 'true' : 'false'"
      :data-loading="(loading ?? ($attrs && $attrs.loading)) ? 'true' : 'false'"
      :data-icon="icon"
      @click="$emit('click', $event)"
    >
      <slot />
    </button>
  `,
}
const UFormStub = {
	name: 'UForm',
	template: '<form data-test="form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
}
const UFormGroupStub = { name: 'UFormGroup', template: '<div data-test="group"><slot /></div>' }
const UInputStub = {
	name: 'UInput',
	props: ['type', 'modelValue', 'placeholder', 'size', 'class'],
	emits: ['update:modelValue', 'keypress'],
	inheritAttrs: false,
	template: `
    <div data-test="input" :data-type="type || 'text'">
      <input
        data-test="input-inner"
        :type="type || 'text'"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')"
        @keypress="$emit('keypress', $event)"
      />
      <div v-if="$slots.trailing" data-test="trailing"><slot name="trailing" /></div>
    </div>
  `,
}
const UTextareaStub = {
	name: 'UTextarea',
	props: ['modelValue', 'placeholder'],
	emits: ['update:modelValue'],
	inheritAttrs: false,
	template: `<textarea data-test="textarea" :placeholder="placeholder" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" />`,
}
const AppLogoStub = { name: 'AppLogo', template: '<div>Logo</div>' }

declare const useToast: () => any
declare const mswServer: any

type RouterLike = ReturnType<typeof createRouter>

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
				stubs: {
					Suspense: false,
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					AppLogo: AppLogoStub,
				},
				components: {
					// manually register auto-imported components
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

// Mount the ForgotPassword component directly
const mountForgotComp = async () => {
	const wrapper = mount(ForgotPassword, {
		global: {
			stubs: {
				UButton: UButtonStub,
				UForm: UFormStub,
				UFormGroup: UFormGroupStub,
				UInput: UInputStub,
				AppLogo: AppLogoStub,
			},
		},
	})

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('🔐 Auth integration errors (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('login → invalid credentials shows validation error and stays on /sign-in', async () => {
		// Override login endpoint to return 422
		mswServer.use(
			http.post('/api/auth/login', async () => {
				return HttpResponse.json({ message: 'Invalid email or password' }, { status: 422 })
			})
		)

		const app = await mountRouterView('/sign-in')

		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		await inputs[0].find('[data-test="input-inner"]').setValue('bad@example.com')
		await inputs[1].find('[data-test="input-inner"]').setValue('wrong')

		await app.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/sign-in')
	})

	it('forgot-password → server validation error shows toast and no success caption', async () => {
		// Override forgot-password endpoint to return 422
		mswServer.use(
			http.post('/api/auth/forgot-password', async () => {
				return HttpResponse.json({ message: 'Email not found' }, { status: 422 })
			})
		)

		const comp = await mountForgotComp()

		const emailInput = comp.find('[data-test="input"] [data-test="input-inner"]')
		await emailInput.setValue('missing@example.com')

		await comp.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		// Check success caption is not shown
		expect(comp.text()).not.toContain(
			'Success to send reset password URL, please check your email.'
		)
	})
})
