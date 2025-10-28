import { nextTick } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithRouter } from '~/tests/helpers/testUtils'
import { http, HttpResponse } from 'msw'

import VerifyPage from '~/pages/verify/[token].vue'
import Verify from '~/components/Verify/Index.vue'
import Login from '~/components/Login/Index.vue'

import { AppLogoStub, UContainerStub, UButtonStub, UProgressStub } from '~/tests/helpers/uiStubs'

declare const useToast: () => any
declare const mswServer: any

// Declare Nuxt composables used in tests
declare const useRouter: () => any
declare const useRoute: () => any

const stubs = {
	AppLogo: AppLogoStub,
	UContainer: UContainerStub,
	UButton: UButtonStub,
	UProgress: UProgressStub,
}

const routes = [
	{ path: '/verify/:token', component: VerifyPage },
	{ path: '/sign-in', component: { template: '<div>SignIn</div>' } },
]

describe('🔗 Verify resend token integration (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

  it('resends verification and shows toast', async () => {
    // Use fake timers to advance component's internal setTimeout
    vi.useFakeTimers()
		// Force initial verification to fail so Resend button is shown
		mswServer.use(
			http.get('/api/auth/verify/:token', async () => {
				return HttpResponse.json(
					{ message: 'Failed verify user email', code: 400 },
					{ status: 400 }
				)
			})
		)

    const app = await mountWithRouter(Verify, {
      routes,
      startPath: '/verify/abc123',
      stubs,
    })
    // Advance past verify delay so resend UI becomes visible
    vi.advanceTimersByTime(1600)
    await flushPromises()
    await nextTick()

		// Prefer component lookup and emit for stability across stub implementations
    // Ensure resend fail caption is visible
    const resendFail = app.find('[data-test="verify-resend-fail"]')
    expect(resendFail.exists()).toBe(true)
    // Trigger resend via component method to avoid stub lookup flakiness
    const verifyComp = app.findComponent(Verify)
    expect(verifyComp.exists()).toBe(true)
    ;(verifyComp.vm as any).handleResendVerification()

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenLastCalledWith(
			expect.objectContaining({
				title: 'Resend Email Verification URL',
				description: expect.stringContaining('Success to resend email verification URL'),
			})
		)

		// Restore timers to real
		vi.useRealTimers()
	})
})
