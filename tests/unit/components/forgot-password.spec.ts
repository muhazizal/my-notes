import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ForgotPassword from '@/components/ForgotPassword/Index.vue'
import { useAuth } from '@/composables/api/useAuth'

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
	props: ['modelValue'],
	emits: ['update:modelValue', 'keypress'],
	inheritAttrs: false,
	template:
		'<input data-test="input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keypress="$emit(\'keypress\', $event)" />',
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

	// Shared factories to reduce dynamic imports and boilerplate stubs
	const shallowComp = () =>
		shallowMount(ForgotPassword, {
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

	const mountComp = () =>
		shallowMount(ForgotPassword, {
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

	it('initially shows default caption and form (negative)', async () => {
		const wrapper = mountComp()

		expect(wrapper.text()).toContain('Already remember your password?')
		expect(wrapper.text()).not.toContain(
			'Success to send reset password URL, please check your email.'
		)
	})

	it('handleForgotPassword success shows toast and success caption (positive)', async () => {
		// Use mocked function directly instead of re-importing
		forgotPasswordMock.mockResolvedValueOnce({
			code: 200,
			message: 'Success to send reset password URL, please check your email.',
		})

		const wrapper = shallowComp()

		await (wrapper.vm as any).handleForgotPassword()
		await wrapper.vm.$nextTick()

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

		const wrapper = mountComp()

		await wrapper.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).not.toHaveBeenCalled()
		expect(wrapper.text()).toContain('Already remember your password?')
		expect(wrapper.text()).not.toContain(
			'Success to send reset password URL, please check your email.'
		)
	})

	it('renders success caption when isSuccessForgotPassword is true (positive)', async () => {
		const wrapper = shallowComp()

		;(wrapper.vm as any).isSuccessForgotPassword = true
		await wrapper.vm.$nextTick()

		expect(wrapper.text()).toContain('Success to send reset password URL, please check your email.')
		expect(wrapper.text()).not.toContain('Already remember your password?')
	})

	it('inline @keypress handlers call preventSpace (positive)', async () => {
		// Ensure clean call history
		preventSpaceMock.mockClear()

		const wrapper = mountComp()

		const inputs = wrapper.findAll('input')
		for (const inp of inputs) {
			await inp.trigger('keypress', { key: ' ' })
		}

		expect(preventSpaceMock).toHaveBeenCalled()
		expect(preventSpaceMock.mock.calls.length).toBeGreaterThanOrEqual(inputs.length)
	})

	it('clicking "Sign in" navigates to /sign-in (positive)', async () => {
		const wrapper = mountComp()

		const signInBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign in')!
		await signInBtn.trigger('click')
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})

	it('disables submit and shows loading when isLoadingForgotPassword is true (positive)', async () => {
		// Toggle loading state before mount via mocked useAuth
		useAuth().isLoadingForgotPassword.value = true

		const wrapper = mountComp()

		const submitBtn = wrapper.find('button[type="submit"]')
		expect(submitBtn.exists()).toBe(true)
		expect(submitBtn.attributes('disabled')).toBeDefined()
		expect(submitBtn.attributes('data-loading')).toBe('true')
	})

	it('v-model setter updates email (positive)', async () => {
		const wrapper = mountComp()

		const emailInput = wrapper.find('input')
		await emailInput.setValue('user@example.com')
		await wrapper.vm.$nextTick()

		const vm = wrapper.vm as any
		expect(vm.form.email).toBe('user@example.com')
	})
	// New: ensure submit passes current form payload to API
	it('submitting form calls forgotPassword with current email payload (positive)', async () => {
		const wrapper = mountComp()

		// Update form value via v-model
		const emailInput = wrapper.find('input')
		await emailInput.setValue('payload@example.com')
		await wrapper.vm.$nextTick()

		await wrapper.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).not.toHaveBeenCalled()
		// Assert the API received current state
		expect(forgotPasswordMock).toHaveBeenCalledWith({ email: 'payload@example.com' })
	})
})
