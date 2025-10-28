import { nextTick } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountRouterView, commonStubs } from '~/tests/helpers/testUtils'
import { http, HttpResponse } from 'msw'

import VerifyPage from '~/pages/verify/[token].vue'
import ResetPasswordPage from '~/pages/reset-password/[token].vue'
import SignInPage from '~/pages/sign-in.vue'
import Verify from '~/components/Verify/Index.vue'
import ResetPassword from '~/components/ResetPassword/Index.vue'
import Login from '~/components/Login/Index.vue'

import {
	AppLogoStub,
	UContainerStub,
	UButtonStub,
	UFormStub,
	UFormGroupStub,
	UInputStub,
	UProgressStub,
} from '~/tests/helpers/uiStubs'

declare const useToast: () => any
declare const mswServer: any
// Declare Nuxt composables used in tests
declare const useRouter: () => any
declare const useRoute: () => any

const stubs = {
	AppLogo: AppLogoStub,
	UContainer: UContainerStub,
	UButton: UButtonStub,
	UForm: UFormStub,
	UFormGroup: UFormGroupStub,
	UInput: UInputStub,
	UProgress: UProgressStub,
}

const routes = [
	{ path: '/verify/:token', component: VerifyPage },
	{ path: '/reset-password/:token', component: ResetPasswordPage },
	{ path: '/sign-in', component: SignInPage },
]

describe('🔗 Token flow integration errors (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

  it('verify → invalid token shows toast and stays on /verify', async () => {
    vi.useFakeTimers()
		mswServer.use(
			http.get('/api/auth/verify/:token', async () => {
				return HttpResponse.json({ message: 'Invalid verification token' }, { status: 422 })
			})
		)

		const app = await mountRouterView(
			'/verify/badtoken',
			routes,
			{ Verify, ResetPassword, Login },
			{ ...commonStubs, ...stubs }
		)

    // Advance past verify delay
    vi.advanceTimersByTime(1600)
    await flushPromises()
    await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/verify/badtoken')
    vi.useRealTimers()
  })

	it('reset-password → invalid token shows toast and stays on /reset-password', async () => {
		mswServer.use(
			http.post('/api/auth/reset-password/:token', async () => {
				return HttpResponse.json({ message: 'Invalid reset token' }, { status: 422 })
			})
		)

		const app = await mountRouterView(
			'/reset-password/invalidtok',
			routes,
			{ Verify, ResetPassword, Login },
			{ ...commonStubs, ...stubs }
		)

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
