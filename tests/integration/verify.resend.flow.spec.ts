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

		const resendBtn = app.findAll('[data-test="btn"]').find((b) => b.text() === 'Resend')
		expect(resendBtn).toBeTruthy()
		await resendBtn!.trigger('click')

		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenLastCalledWith(
			expect.objectContaining({
				title: 'Resend Email Verification URL',
				description: expect.stringContaining('Success to resend email verification URL'),
			})
		)
	})
})
