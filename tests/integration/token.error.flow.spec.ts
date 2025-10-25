import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import VerifyPage from '~/pages/verify/[token].vue'
import ResetPasswordPage from '~/pages/reset-password/[token].vue'
import SignInPage from '~/pages/sign-in.vue'
import Verify from '~/components/Verify/Index.vue'
import ResetPassword from '~/components/ResetPassword/Index.vue'
import Login from '~/components/Login/Index.vue'

declare const useToast: () => any
declare const mswServer: any

type RouterLike = ReturnType<typeof createRouter>

const stubs = {
	AppLogo: { template: '<div data-test="logo" />' },
	UContainer: { template: '<div data-test="container"><slot /></div>' },
	UButton: {
		props: ['icon', 'loading', 'disabled', 'type'],
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
	},
	UForm: { template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>` },
	UFormGroup: { template: `<div data-test="group"><slot /></div>` },
	UInput: {
		props: ['modelValue', 'placeholder'],
		emits: ['update:modelValue'],
		inheritAttrs: false,
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
				components: { Verify, ResetPassword, Login },
			},
		}
	)

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('🔗 Token flow integration errors (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('verify → invalid token shows toast and stays on /verify', async () => {
		mswServer.use(
			http.get('/api/auth/verify/:token', async () => {
				return HttpResponse.json({ message: 'Invalid verification token' }, { status: 422 })
			})
		)

		const app = await mountRouterView('/verify/badtoken')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/verify/badtoken')
	})

	it('reset-password → invalid token shows toast and stays on /reset-password', async () => {
		mswServer.use(
			http.post('/api/auth/reset-password/:token', async () => {
				return HttpResponse.json({ message: 'Invalid reset token' }, { status: 422 })
			})
		)

		const app = await mountRouterView('/reset-password/invalidtok')

		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		await inputs[0].setValue('newPass123')
		await inputs[1].setValue('newPass123')

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/reset-password/invalidtok')
	})
})
