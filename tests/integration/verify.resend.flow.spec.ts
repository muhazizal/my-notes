import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import VerifyPage from '~/pages/verify/[token].vue'
import Verify from '~/components/Verify/Index.vue'
import Login from '~/components/Login/Index.vue'

declare const useToast: () => any
declare const mswServer: any

type RouterLike = ReturnType<typeof createRouter>

const stubs = {
	AppLogo: { template: '<div data-test="logo" />' },
	UContainer: { template: '<div data-test="container"><slot /></div>' },
	UButton: {
		props: ['icon', 'loading', 'disabled', 'type'],
		template: `<button data-test="btn" :type="type || 'button'" :disabled="disabled ? true : undefined" :data-loading="loading ? 'true' : 'false'" :data-disabled="disabled ? 'true' : 'false'" @click="$emit('click', $event)"><slot /></button>`,
	},
	UProgress: { template: '<div data-test="progress" />' },
}

const createTestRouter = (): RouterLike => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/verify/:token', component: VerifyPage },
			{ path: '/sign-in', component: { template: '<div>SignIn</div>' } },
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
				components: { Verify, Login },
			},
		}
	)

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('🔁 Verify resend flow after verify error', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('verify fails (422), then clicking Resend succeeds and toasts', async () => {
		mswServer.use(
			http.get('/api/auth/verify/:token', async () => {
				return HttpResponse.json({ message: 'Invalid verification token' }, { status: 422 })
			})
		)

		const app = await mountRouterView('/verify/badtok')

		await flushPromises()
		await nextTick()

		// Verify error causes validation toast
		expect(useToast().add).toHaveBeenCalled()
		const [firstToast] = useToast().add.mock.calls[0]
		expect(firstToast.title).toBe('Validation error')

		// Click Resend
		const resendBtn = app.findAll('[data-test="btn"]').find((b) => b.text().includes('Resend'))
		expect(resendBtn).toBeTruthy()
		await resendBtn!.trigger('click')

		await flushPromises()
		await nextTick()

		// Resend success toast and success caption visible
		const lastCall = useToast().add.mock.calls.at(-1)![0]
		expect(lastCall.title).toBe('Resend Email Verification URL')
		expect(app.text()).toContain('Success to send new verification URL')
	})
})
