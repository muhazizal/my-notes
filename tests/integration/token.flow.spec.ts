import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import VerifyPage from '~/pages/verify/[token].vue'
import ResetPasswordPage from '~/pages/reset-password/[token].vue'
import SignInPage from '~/pages/sign-in.vue'
import Verify from '~/components/Verify/Index.vue'
import ResetPassword from '~/components/ResetPassword/Index.vue'
import Login from '~/components/Login/Index.vue'

declare const useToast: () => any

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
		template: `<input data-test="input" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" />`,
	},
	UProgress: { template: '<div data-test="progress" />' },
}

const createTestRouter = () => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/verify/:token', component: VerifyPage },
			{ path: '/reset-password/:token', component: ResetPasswordPage },
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
					Verify,
					ResetPassword,
					Login,
				},
			},
		}
	)

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('🔗 Token flows integration (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('verify → success then clicking Sign in navigates to /sign-in', async () => {
		const app = await mountRouterView('/verify/abc123')

		await flushPromises()
		await nextTick()

		const signInBtn = app.findAll('[data-test="btn"]').find((b) => b.text() === 'Sign in')
		expect(signInBtn).toBeTruthy()
		await signInBtn!.trigger('click')

		await flushPromises()
		await nextTick()

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/sign-in')
	})

	it('reset-password → submits, shows toast, then Sign in navigates', async () => {
		const app = await mountRouterView('/reset-password/tok987')

		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		await inputs[0].setValue('newPass123')
		await inputs[1].setValue('newPass123')

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Reset Password',
				description: expect.stringContaining('Success reset password'),
			})
		)

		// Look within the ResetPassword component to find the link
		const comp = app.findComponent(ResetPassword)
		expect(comp.exists()).toBe(true)
		// Trigger navigation via component method when success UI is active
		;(comp.vm as any).handleRedirectSignIn()

		await flushPromises()
		await nextTick()

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/sign-in')
	})
})
