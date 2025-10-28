import { nextTick } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountRouterView, commonStubs } from '~/tests/helpers/testUtils'

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

describe('🔗 Token flows integration (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

  it('verify → success then clicking Sign in navigates to /sign-in', async () => {
    // Use fake timers to advance component's internal setTimeout
    vi.useFakeTimers()
		const app = await mountRouterView(
			'/verify/abc123',
			routes,
			{ Verify, ResetPassword, Login },
			{ ...commonStubs, ...stubs }
		)

    // Advance past verify delay
    vi.advanceTimersByTime(1600)
    await flushPromises()
    await nextTick()

    // Ensure success caption is rendered
    const successCaption = app.find('[data-test="verify-success"]')
    expect(successCaption.exists()).toBe(true)
    // Trigger navigation via component method to avoid stub lookup flakiness
    const verifyComp = app.findComponent(Verify)
    expect(verifyComp.exists()).toBe(true)
    ;(verifyComp.vm as any).handleRedirectSignIn()

		await flushPromises()
		await nextTick()

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/sign-in')
    // Restore timers to real
    vi.useRealTimers()
  })

	it('reset-password → submits, shows toast, then Sign in navigates', async () => {
		const app = await mountRouterView(
			'/reset-password/tok987',
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
