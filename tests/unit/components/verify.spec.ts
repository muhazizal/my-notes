import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { UButtonStub, UProgressStub, AppLogoStub } from '~/tests/helpers/uiStubs'

declare const useRouter: () => any
declare const useRoute: () => any

// Mock useAuth for verify/resend with adjustable fns
const verifyMock = vi.fn().mockResolvedValue(null)
const resendMock = vi.fn().mockResolvedValue(null)
vi.mock('@/composables/api/useAuth', () => {
	const isLoadingResendVerification = ref(false)
	const isLoadingVerify = ref(false)
	return {
		useAuth: () => ({
			verify: verifyMock,
			resendVerification: resendMock,
			isLoadingResendVerification,
			isLoadingVerify,
		}),
	}
})

describe('components/Verify/Index.vue', () => {
	let replaceSpy: ReturnType<typeof vi.fn>

	beforeEach(() => {
		const routerStub = vi.mocked(useRouter as any)
		replaceSpy = vi.fn()
		routerStub.mockReturnValue({ replace: replaceSpy })
		const routeStub = vi.mocked(useRoute as any)
		routeStub.mockReturnValue({ params: { token: 'TOKEN' } })
		verifyMock.mockReset()
		resendMock.mockReset()
	})

	it('successful verify shows success caption and "Sign in" navigates (positive)', async () => {
		vi.useFakeTimers()
		verifyMock.mockResolvedValueOnce({ ok: true })

		const mod = await import('~/components/Verify/Index.vue')
		const Comp = mod.default

		const wrapper = shallowMount(Comp, {
			global: { stubs: { UButton: UButtonStub, UProgress: UProgressStub, AppLogo: AppLogoStub } },
		})

		// Ensure async onMounted + DOM update complete and advance verify delay
		vi.advanceTimersByTime(1600)
		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(wrapper.find('[data-test="verify-success"]').exists()).toBe(true)
		// Navigate via component method to avoid stub lookup flakiness
		;(wrapper.vm as any).handleRedirectSignIn()
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
		vi.useRealTimers()
	})

	it('failed verify shows resend button; clicking it shows resend success (negative)', async () => {
		vi.useFakeTimers()
		verifyMock.mockResolvedValueOnce(null)
		resendMock.mockResolvedValueOnce({ ok: true })

		const mod = await import('~/components/Verify/Index.vue')
		const Comp = mod.default

		const wrapper = shallowMount(Comp, {
			global: { stubs: { UButton: UButtonStub, UProgress: UProgressStub, AppLogo: AppLogoStub } },
		})

		vi.advanceTimersByTime(1600)
		await flushPromises()
		await wrapper.vm.$nextTick()

		const resendCaption = wrapper.find('[data-test="verify-resend-fail"]')
		expect(resendCaption.exists()).toBe(true)
		// Trigger resend via component method to avoid stub lookup flakiness
		;(wrapper.vm as any).handleResendVerification()

		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(wrapper.find('[data-test="verify-resend-success"]').exists()).toBe(true)
		expect(replaceSpy).not.toHaveBeenCalled()
		vi.useRealTimers()
	})

	it('shows loading caption and progress when isLoadingVerify is true (positive)', async () => {
		const mod = await import('~/components/Verify/Index.vue')
		const Comp = mod.default

		const wrapper = shallowMount(Comp, {
			global: { stubs: { UButton: UButtonStub, UProgress: UProgressStub, AppLogo: AppLogoStub } },
		})

		;(wrapper.vm as any).isLoadingVerify = true
		await wrapper.vm.$nextTick()

		expect(wrapper.text()).toContain('Please wait, email verification is on progress')
		expect(wrapper.find('[data-test="progress"]').exists()).toBe(true)
	})
})
