import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

declare const useRouter: () => any

import { UButtonStub, AppLogoStub } from '~/tests/helpers/uiStubs'

describe('components/LandingScreen/Index.vue', () => {
	let replaceSpy: ReturnType<typeof vi.fn>

	beforeEach(() => {
		const routerStub = vi.mocked(useRouter as any)
		replaceSpy = vi.fn()
		routerStub.mockReturnValue({ replace: replaceSpy })
	})

	it('clicking "Sign in" navigates to /sign-in (positive)', async () => {
		const mod = await import('~/components/LandingScreen/Index.vue')
		const Comp = mod.default

		const wrapper = shallowMount(Comp, {
			global: { stubs: { UButton: UButtonStub, AppLogo: AppLogoStub } },
		})

		const signInBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign in')!
		await signInBtn.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})

	it('clicking "Sign up" navigates to /sign-up and not /sign-in (negative)', async () => {
		const mod = await import('~/components/LandingScreen/Index.vue')
		const Comp = mod.default

		const wrapper = shallowMount(Comp, {
			global: { stubs: { UButton: UButtonStub, AppLogo: AppLogoStub } },
		})

		const signUpBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign up')!
		await signUpBtn.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/sign-up')
		expect(replaceSpy).not.toHaveBeenCalledWith('/sign-in')
	})
})
