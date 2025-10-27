import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import Login from '@/components/Login/Index.vue'

declare const useRouter: () => any
declare const useUserStore: () => any

import {
	UButtonStub,
	UFormStub,
	UFormGroupStub,
	UInputTrailingStub,
	AppLogoStub,
} from '~/tests/helpers/uiStubs'

// New: mock useNoSpace to capture inline @keypress handler execution
const preventSpaceMock = vi.fn()
vi.mock('@/composables/utils/input/useNoSpace', () => ({
	useNoSpace: () => ({ preventSpace: preventSpaceMock }),
}))

// Mock useAuth.login to drive handleLogin branches
const loginMock = vi.fn().mockResolvedValue(null)
vi.mock('@/composables/api/useAuth', () => {
	const isLoadingLogin = ref(false)
	return { useAuth: () => ({ isLoadingLogin, login: loginMock }) }
})

describe('components/Login/Index.vue', () => {
	let replaceSpy: ReturnType<typeof vi.fn>
	let toastAddSpy: ReturnType<typeof vi.fn>
	let store: any

	beforeEach(() => {
		store = useUserStore()
		store.getUserProfile = vi.fn().mockResolvedValue(null)

		const routerStub = vi.mocked(useRouter as any)
		replaceSpy = vi.fn()
		routerStub.mockReturnValue({ replace: replaceSpy })

		toastAddSpy = vi.fn()
		vi.stubGlobal('useToast', () => ({ add: toastAddSpy }))

		loginMock.mockReset()
	})

	// Shared mount factory using shallowMount to reduce render cost
	const mountComp = () =>
		shallowMount(Login, {
			global: {
				stubs: {
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputTrailingStub,
					AppLogo: AppLogoStub,
				},
			},
		})

	it('asserts computed icon/type and toggles via vm (positive)', async () => {
		const wrapper = mountComp()
		const vm = wrapper.vm as any

		// Initial computed values
		const readType = () => vm.getPasswordType?.value ?? vm.getPasswordType
		const readIcon = () => vm.getPasswordIcon?.value ?? vm.getPasswordIcon
		expect(readType()).toBe('password')
		expect(readIcon()).toBe('i-heroicons-eye-slash')

		// Toggle using method
		vm.handleShowPassword()
		await wrapper.vm.$nextTick()

		expect(readType()).toBe('text')
		expect(readIcon()).toBe('i-heroicons-eye')
	})

	it('covers inline @keypress handlers on email and password inputs (positive)', async () => {
		const wrapper = mountComp()

		// Emit keypress from UInput component instances to exercise inline handlers
		const inputs = wrapper.findAllComponents({ name: 'UInput' })
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		for (const input of inputs) {
			input.vm.$emit('keypress', { key: ' ' })
		}

		// preventSpace called once per input handler
		expect(preventSpaceMock).toHaveBeenCalledTimes(inputs.length)
	})

	it('v-model setters update email and password (positive)', async () => {
		const wrapper = mountComp()

		const vm = wrapper.vm as any
		const read = () => ({
			email: vm.form?.email ?? vm.form?.value?.email,
			password: vm.form?.password ?? vm.form?.value?.password,
		})

		const inputs = wrapper.findAllComponents({ name: 'UInput' })
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		// Emit update:modelValue to execute both v-model setter functions
		inputs[0].vm.$emit('update:modelValue', 'e@x.com')
		inputs[1].vm.$emit('update:modelValue', 'secret')
		await wrapper.vm.$nextTick()

		expect(read().email).toBe('e@x.com')
		expect(read().password).toBe('secret')
	})

	it('calls redirect methods directly via vm (positive)', async () => {
		const wrapper = mountComp()
		const vm = wrapper.vm as any

		// Explicitly invoke both redirect functions so they count in function coverage
		vm.handleRedirectSignUp()
		expect(replaceSpy).toHaveBeenCalledWith('/sign-up')

		vm.handleRedirectForgotPassword()
		expect(replaceSpy).toHaveBeenCalledWith('/forgot-password')
	})

	it('redirects to /sign-up via "Sign up." button (positive)', async () => {
		const wrapper = mountComp()

		const signUpBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign up.')!
		await signUpBtn.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/sign-up')
	})

	it('redirects to /forgot-password via "Forgot password?" button (positive)', async () => {
		const wrapper = mountComp()

		const forgotBtn = wrapper.findAll('button').find((b) => b.text() === 'Forgot password?')!
		await forgotBtn.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/forgot-password')
	})

	it('handleLogin success shows toast, fetches profile, and navigates to /notes (positive)', async () => {
		loginMock.mockResolvedValueOnce({ message: 'Welcome' })

		const wrapper = mountComp()

		// Emit submit on UForm component to trigger handleLogin
		const formComp = wrapper.findComponent({ name: 'UForm' })
		expect(formComp.exists()).toBe(true)
		formComp.vm.$emit('submit')
		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Login',
				description: 'Welcome',
			})
		)
		expect(store.getUserProfile).toHaveBeenCalledTimes(1)
		expect(replaceSpy).toHaveBeenCalledWith('/notes')
	})

	it('handleLogin failure does not navigate or fetch profile (negative)', async () => {
		loginMock.mockResolvedValueOnce(false)

		const wrapper = mountComp()

		const formComp = wrapper.findComponent({ name: 'UForm' })
		expect(formComp.exists()).toBe(true)
		formComp.vm.$emit('submit')
		await flushPromises()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).not.toHaveBeenCalled()
		expect(store.getUserProfile).not.toHaveBeenCalled()
		expect(replaceSpy).not.toHaveBeenCalledWith('/notes')
	})

	it('toggles show password via template handler (positive)', async () => {
		const wrapper = mountComp()
		const vm = wrapper.vm as any
		const readType = () => vm.getPasswordType?.value ?? vm.getPasswordType

		// Initially password is hidden
		expect(readType()).toBe('password')

		// Call the same handler used by the template
		vm.handleShowPassword()
		await wrapper.vm.$nextTick()

		// After toggle via handler, password becomes visible
		expect(readType()).toBe('text')
	})

	it('executes true branch of handleShowPassword and returns type to password (positive)', async () => {
		const wrapper = mountComp()

		const vm = wrapper.vm as any
		const readType = () => vm.getPasswordType?.value ?? vm.getPasswordType

		// Initial state: false -> 'password'
		expect(readType()).toBe('password')

		// First toggle: else branch (sets true)
		vm.handleShowPassword()
		await wrapper.vm.$nextTick()
		expect(readType()).toBe('text')

		// Second toggle: if branch (sets false)
		vm.handleShowPassword()
		await wrapper.vm.$nextTick()
		expect(readType()).toBe('password')
	})
})
