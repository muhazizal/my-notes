import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

declare const useRouter: () => any

const UButtonStub = {
	name: 'UButton',
	// Forward key props so we can assert disabled/loading and submit type
	template:
		'<button data-test="btn" :type="$attrs.type || \'button\'" :disabled="$attrs.disabled" :data-loading="$attrs.loading" @click="$emit(\'click\', $event)"><slot /></button>',
}
const UFormStub = {
	name: 'UForm',
	template: '<form data-test="form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
}
const UFormGroupStub = { name: 'UFormGroup', template: '<div data-test="group"><slot /></div>' }
// Emits keypress so parent’s @keypress handler receives it
const UInputStub = {
	name: 'UInput',
	template: '<input data-test="input" @keypress="$emit(\'keypress\', $event)" />',
}
const AppLogoStub = { name: 'AppLogo', template: '<div>Logo</div>' }

// Mocks
const forgotPasswordMock = vi.fn().mockResolvedValue(null)
vi.mock('@/composables/api/useAuth', () => {
	const isLoadingForgotPassword = ref(false)
	return { useAuth: () => ({ isLoadingForgotPassword, forgotPassword: forgotPasswordMock }) }
})
const preventSpaceMock = vi.fn()
vi.mock('@/composables/utils/input/useNoSpace', () => ({
	useNoSpace: () => ({ preventSpace: preventSpaceMock }),
}))

describe('components/ForgotPassword/Index.vue', () => {
	let replaceSpy: ReturnType<typeof vi.fn>
	let toastAddSpy: ReturnType<typeof vi.fn>

	beforeEach(() => {
		const routerStub = vi.mocked(useRouter as any)
		replaceSpy = vi.fn()
		routerStub.mockReturnValue({ replace: replaceSpy })

		toastAddSpy = vi.fn()
		vi.stubGlobal('useToast', () => ({ add: toastAddSpy }))

		forgotPasswordMock.mockReset()
		preventSpaceMock.mockReset()
	})

	it('initially shows default caption and form (negative)', async () => {
		const mod = await import('~/components/ForgotPassword/Index.vue')
		const Comp = mod.default

		const wrapper = mount(Comp, {
			global: {
				stubs: {
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					AppLogo: AppLogoStub,
				},
			},
		})

		expect(wrapper.text()).toContain('Already remember your password?')
		expect(wrapper.text()).not.toContain(
			'Success to send reset password URL, please check your email.'
		)
	})

	it('handleForgotPassword success shows toast and success caption (positive)', async () => {
		const { shallowMount } = await import('@vue/test-utils')
		const { nextTick } = await import('vue')
		const Comp = (await import('@/components/ForgotPassword/Index.vue')).default

		const { useAuth } = await import('@/composables/api/useAuth')
		const fp = useAuth().forgotPassword
		vi.mocked(fp).mockResolvedValue({
			code: 200,
			message: 'Success to send reset password URL, please check your email.',
		})

		const wrapper = shallowMount(Comp, {
			global: {
				stubs: {
					UButton: true,
					UForm: true,
					UFormGroup: true,
					UInput: true,
					AppLogo: true,
				},
			},
		})

		await (wrapper.vm as any).handleForgotPassword()
		await nextTick()

		const toast = (globalThis as any).useToast()
		expect(toast.add).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Forgot Password',
				description: 'Success to send reset password URL, please check your email.',
			})
		)
		expect(wrapper.text()).toContain('Success to send reset password URL, please check your email.')
	})

	it('handleForgotPassword failure keeps default caption and no toast (negative)', async () => {
		forgotPasswordMock.mockResolvedValueOnce(null)

		const mod = await import('~/components/ForgotPassword/Index.vue')
		const Comp = mod.default

		const wrapper = mount(Comp, {
			global: {
				stubs: {
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					AppLogo: AppLogoStub,
				},
			},
		})

		await wrapper.find('[data-test="form"]').trigger('submit')
		await Promise.resolve()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).not.toHaveBeenCalled()
		expect(wrapper.text()).toContain('Already remember your password?')
		expect(wrapper.text()).not.toContain(
			'Success to send reset password URL, please check your email.'
		)
	})

  it('renders success caption when isSuccessForgotPassword is true (positive)', async () => {
    const { shallowMount } = await import('@vue/test-utils')
    const { nextTick } = await import('vue')
    const Comp = (await import('@/components/ForgotPassword/Index.vue')).default

    const wrapper = shallowMount(Comp, {
      global: {
        stubs: {
          AppLogo: true,
          UButton: true,
          UForm: true,
          UFormGroup: true,
          UInput: true,
        },
      },
    })

    ;(wrapper.vm as any).isSuccessForgotPassword = true
    await nextTick()

    expect(wrapper.text()).toContain(
      'Success to send reset password URL, please check your email.',
    )
    expect(wrapper.text()).not.toContain('Already remember your password?')
  })

  it('inline @keypress handlers call preventSpace (positive)', async () => {
    const mod = await import('~/components/ForgotPassword/Index.vue')
    const Comp = mod.default

    // Ensure clean call history
    preventSpaceMock.mockClear()

    // Use mount with our stubs so a real <input> exists and emits keypress
    const wrapper = mount(Comp, {
      global: {
        stubs: {
          UButton: UButtonStub,
          UForm: UFormStub,
          UFormGroup: UFormGroupStub,
          UInput: UInputStub,
          AppLogo: AppLogoStub,
        },
      },
    })

    const inputs = wrapper.findAll('input')
    for (const inp of inputs) {
      await inp.trigger('keypress', { key: ' ' })
    }

    expect(preventSpaceMock).toHaveBeenCalled()
    expect(preventSpaceMock.mock.calls.length).toBeGreaterThanOrEqual(inputs.length)
  })

	it('clicking "Sign in" navigates to /sign-in (positive)', async () => {
		const mod = await import('~/components/ForgotPassword/Index.vue')
		const Comp = mod.default

		const wrapper = mount(Comp, {
			global: {
				stubs: {
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					AppLogo: AppLogoStub,
				},
			},
		})

		const signInBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign in')!
		await signInBtn.trigger('click')
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})

	it('disables submit and shows loading when isLoadingForgotPassword is true (positive)', async () => {
		const mod = await import('~/components/ForgotPassword/Index.vue')
		const Comp = mod.default

		// Toggle loading state before mount
		const { useAuth } = await import('@/composables/api/useAuth')
		useAuth().isLoadingForgotPassword.value = true

		const wrapper = mount(Comp, {
			global: {
				stubs: {
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					AppLogo: AppLogoStub,
				},
			},
		})

		// Find the submit button by type forwarded via UButtonStub
		const submitBtn = wrapper.find('button[type="submit"]')
		expect(submitBtn.exists()).toBe(true)

		// Assert disabled attribute is present
		expect(submitBtn.attributes('disabled')).toBeDefined()

		// Assert loading flag forwarded via data attribute
		expect(submitBtn.attributes('data-loading')).toBe('true')
	})
})
