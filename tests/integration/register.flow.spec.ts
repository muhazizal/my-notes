// @vitest-environment jsdom
import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import SignUpPage from '~/pages/sign-up.vue'
import Register from '~/components/Register/Index.vue'

declare const useToast: () => any
declare const mswServer: any

type RouterLike = ReturnType<typeof createRouter>

const createTestRouter = (): RouterLike => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/sign-up', component: SignUpPage },
			{ path: '/sign-in', component: { template: '<div>SignIn</div>' } },
		],
	})
	return router
}

const mountRegister = async () => {
	const router = createTestRouter()

	const useRouterMock = useRouter as ReturnType<typeof vi.fn>
	useRouterMock.mockReturnValue(router)

	const useRouteMock = useRoute as ReturnType<typeof vi.fn>
	useRouteMock.mockReturnValue(router.currentRoute.value)

	const wrapper = mount(Register, {
		global: { plugins: [router] },
	})

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('👤 Register integration flow', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('register success shows success caption and toasts', async () => {
		const app = await mountRegister()

		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(5)

		await inputs[0].setValue('Jane Tester') // fullname
		await inputs[1].setValue('janet') // username
		await inputs[2].setValue('jane@test.com') // email
		await inputs[3].setValue('secret123') // password real
		await inputs[4].setValue('secret123') // password confirmation

		const checkbox = app.find('[data-test="checkbox"]')
		await checkbox.setValue(true)

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Register')
		expect(app.text()).toContain('Success to register your account')
	})

	it('register validation error (422) toasts and stays on form', async () => {
		mswServer.use(
			http.put('/api/auth/register', async () => {
				return HttpResponse.json({ message: 'Validation failed' }, { status: 422 })
			})
		)

		const app = await mountRegister()

		const inputs = app.findAll('[data-test="input"]')
		await inputs[0].setValue('John Tester')
		await inputs[1].setValue('johnny')
		await inputs[2].setValue('john@test.com')
		await inputs[3].setValue('secret123')
		await inputs[4].setValue('secret123')
		await app.find('[data-test="checkbox"]').setValue(true)

		await app.find('[data-test="form"]').trigger('submit')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Validation error')
		expect(app.text()).not.toContain('Success to register your account')
	})
})
