import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ResetPassword from '@/components/ResetPassword/Index.vue'

declare const useRouter: () => any
declare const useToast: () => any

// Button stub: expose disabled/loading via data attributes and emit click
const UButtonStub = {
	name: 'UButton',
	props: ['type', 'size', 'square', 'loading', 'disabled', 'variant', 'color', 'padded', 'icon'],
	template: `
    <button
      data-test="btn"
      :data-disabled="disabled ? 'true' : 'false'"
      :data-loading="loading ? 'true' : 'false'"
      @click="$emit('click', $event)"
    >
      <slot />
    </button>
  `,
}

// Form stubs
const UFormStub = {
	name: 'UForm',
	template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>`,
}
const UFormGroupStub = { name: 'UFormGroup', template: `<div data-test="group"><slot /></div>` }

// Input stub: supports v-model and keypress, exposes placeholder for identification
const UInputStub = {
	name: 'UInput',
	props: ['modelValue', 'placeholder', 'size', 'class', 'type'],
	emits: ['update:modelValue', 'keypress'],
	template: `
    <div
      data-test="input"
      :data-placeholder="placeholder"
      :data-type="type"
      @keypress="$emit('keypress', $event)"
    >
      <!-- minimal rendering -->
    </div>
  `,
}

const AppLogoStub = { name: 'AppLogo', template: '<div>Logo</div>' }

// Mock useNoSpace to capture inline @keypress handler execution
const preventSpaceMock = vi.fn()
vi.mock('@/composables/utils/input/useNoSpace', () => ({
	useNoSpace: () => ({ preventSpace: preventSpaceMock }),
}))

// Mock useAuth.resetPassword and loading flag
const resetPasswordMock = vi.fn().mockResolvedValue(null)
const isLoadingResetPassword = ref(false)
vi.mock('@/composables/api/useAuth', () => ({
	useAuth: () => ({ isLoadingResetPassword, resetPassword: resetPasswordMock }),
}))

describe('components/ResetPassword/Index.vue', () => {
	let replaceSpy: ReturnType<typeof vi.fn>
	let toastAddSpy: ReturnType<typeof vi.fn>

	beforeEach(() => {
		const routerStub = vi.mocked(useRouter as any)
		replaceSpy = vi.fn()
		routerStub.mockReturnValue({ replace: replaceSpy })

		toastAddSpy = useToast().add
		toastAddSpy.mockReset()
		preventSpaceMock.mockReset()
		resetPasswordMock.mockReset()
		isLoadingResetPassword.value = false
	})

	const mountComp = () =>
		shallowMount(ResetPassword, {
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

	const shallowComp = () =>
		shallowMount(ResetPassword, {
			global: {
				stubs: {
					AppLogo: true,
					UButton: UButtonStub, // use real button stub for clicks
					UForm: true,
					UFormGroup: true,
					UInput: true,
				},
			},
		})

	it('initially shows default caption and renders form (positive)', async () => {
		const wrapper = await mountComp()
		expect(wrapper.text()).toContain('Input your new password to reset your password')
		expect(wrapper.find('[data-test="form"]').exists()).toBe(true)

		const inputs = wrapper.findAllComponents(UInputStub)
		expect(inputs.length).toBeGreaterThanOrEqual(2)
	})

	it('both password inputs render with type="password" (positive)', async () => {
		const wrapper = await mountComp()

		const inputs = wrapper.findAllComponents(UInputStub)
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		for (const input of inputs) {
			expect(input.props('type')).toBe('password')
			// Also reflected in stub DOM
			expect(input.attributes('data-type')).toBe('password')
		}
	})

	it('v-model setters update password fields (positive)', async () => {
		const wrapper = await mountComp()
		const vm = wrapper.vm as any

		const inputs = wrapper.findAllComponents(UInputStub)
		const realCmp = inputs.find((c) => c.props('placeholder') === 'New password')!
		const confirmCmp = inputs.find((c) => c.props('placeholder') === 'Confirm new password')!

		realCmp.vm.$emit('update:modelValue', 'supersecret')
		confirmCmp.vm.$emit('update:modelValue', 'supersecret')
		await wrapper.vm.$nextTick()

		const form = vm.form?.value ?? vm.form
		expect(form.password.real).toBe('supersecret')
		expect(form.password.confirmation).toBe('supersecret')
	})

	it('inline @keypress handlers call preventSpace on both inputs (positive)', async () => {
		const wrapper = await mountComp()
		const inputs = wrapper.findAllComponents(UInputStub)
		const realCmp = inputs.find((c) => c.props('placeholder') === 'New password')!
		const confirmCmp = inputs.find((c) => c.props('placeholder') === 'Confirm new password')!

		realCmp.vm.$emit('keypress', { key: ' ' })
		confirmCmp.vm.$emit('keypress', { key: ' ' })
		await wrapper.vm.$nextTick()

		expect(preventSpaceMock).toHaveBeenCalledTimes(2)
	})

	it('success branch hides form and shows only caption (positive)', async () => {
		resetPasswordMock.mockResolvedValueOnce({ message: 'Reset complete' })

		const wrapper = await mountComp()
		const vm = wrapper.vm as any

		await vm.handleResetPassword()
		await wrapper.vm.$nextTick()

		// Success caption visible
		expect(wrapper.text()).toContain('Success to reset your password')
		// Form should be hidden after success
		expect(wrapper.find('[data-test="form"]').exists()).toBe(false)
	})

	it('handleResetPassword success shows toast, success caption, and "Sign in" navigation (positive)', async () => {
		resetPasswordMock.mockResolvedValueOnce({ message: 'Reset complete' })

		const wrapper = shallowComp()
		const vm = wrapper.vm as any

		await vm.handleResetPassword()

		// Toast and success state
		expect(toastAddSpy).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Reset Password', description: 'Reset complete' })
		)
		expect(vm.isSuccessReset).toBe(true)
		expect(vm.isFailedReset).toBe(false)

		// Success caption branch renders Sign in button
		const signInBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign in')!
		expect(signInBtn.exists()).toBe(true)

		// Trigger native click for speed and correctness
		await signInBtn.trigger('click')
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')

		// Direct method call also covered
		vm.handleRedirectSignIn()
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})

	it('failure branch hides form and shows "request new url" (negative)', async () => {
		resetPasswordMock.mockResolvedValueOnce(false)

		const wrapper = await mountComp()
		const vm = wrapper.vm as any

		await vm.handleResetPassword()
		await wrapper.vm.$nextTick()

		// Failure caption visible
		expect(wrapper.text()).toContain('failed to reset your password')
		// Form should be hidden after failure
		expect(wrapper.find('[data-test="form"]').exists()).toBe(false)
	})

	it('handleResetPassword failure shows failure caption and "request new url" navigation (negative)', async () => {
		resetPasswordMock.mockResolvedValueOnce(false)

		const wrapper = shallowComp()
		const vm = wrapper.vm as any

		await vm.handleResetPassword()

		// Failure state
		expect(vm.isFailedReset).toBe(true)
		expect(vm.isSuccessReset).toBe(false)
		expect(wrapper.text()).toContain('failed to reset your password')

		// Find and click the "request new url" button
		const reqNewUrlBtn = wrapper.findAll('button').find((b) => b.text() === 'request new url')!
		await reqNewUrlBtn.trigger('click')
		expect(replaceSpy).toHaveBeenCalledWith('/forgot-password')

		vm.handleRedirectForgotPassword()
		expect(replaceSpy).toHaveBeenCalledWith('/forgot-password')
	})

	it('submit button disabled/loading reflect isLoadingResetPassword (positive)', async () => {
		const wrapper = await mountComp()

		const submitBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit')!
		expect(submitBtn.attributes('data-disabled')).toBe('false')
		expect(submitBtn.attributes('data-loading')).toBe('false')

		isLoadingResetPassword.value = true
		await wrapper.vm.$nextTick()

		expect(submitBtn.attributes('data-disabled')).toBe('true')
		expect(submitBtn.attributes('data-loading')).toBe('true')
	})

	it('submitting form calls resetPassword with correct body (positive)', async () => {
		const wrapper = await mountComp()
		const vm = wrapper.vm as any
		const form = vm.form?.value ?? vm.form
		form.password.real = 'newpass!'

		await wrapper.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(resetPasswordMock).toHaveBeenCalledWith({ password: 'newpass!' })
	})

	it('toast includes green color on success (positive)', async () => {
		resetPasswordMock.mockResolvedValueOnce({ message: 'Reset complete' })

		const wrapper = await mountComp()
		await (wrapper.vm as any).handleResetPassword()

		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				color: 'green',
				title: 'Reset Password',
				description: 'Reset complete',
			})
		)
	})
})
