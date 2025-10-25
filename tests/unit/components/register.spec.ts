import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, shallowMount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Register from '@/components/Register/Index.vue'
import { useAuth } from '@/composables/api/useAuth'

// Allow mocking the router instance returned by global useRouter
declare const useRouter: () => any

// Component stubs
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
// Emits keypress and supports v-model so parent’s handlers receive updates
const UInputStub = {
	name: 'UInput',
	props: ['modelValue'],
	emits: ['update:modelValue', 'keypress'],
	inheritAttrs: false,
	template:
		'<input data-test="input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keypress="$emit(\'keypress\', $event)" />',
}
const UCheckboxStub = {
	name: 'UCheckbox',
	props: ['modelValue', 'name', 'label'],
	emits: ['update:modelValue'],
	template:
		'<input type="checkbox" data-test="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
}
const AppLogoStub = { name: 'AppLogo', template: '<div>Logo</div>' }

// Mocks
const registerMock = vi.fn().mockResolvedValue(null)
vi.mock('@/composables/api/useAuth', () => {
	const isLoadingRegister = ref(false)
	return { useAuth: () => ({ isLoadingRegister, register: registerMock }) }
})
const preventSpaceMock = vi.fn()
vi.mock('@/composables/utils/input/useNoSpace', () => ({
	useNoSpace: () => ({ preventSpace: preventSpaceMock }),
}))

describe('components/Register/Index.vue', () => {
	let replaceSpy: ReturnType<typeof vi.fn>
	let toastAddSpy: ReturnType<typeof vi.fn>

	// Shared factories for speed
	const shallowComp = () =>
		shallowMount(Register, {
			global: {
				stubs: {
					AppLogo: true,
					UButton: UButtonStub, // render real <button> for reliable click
					UForm: true,
					UFormGroup: true,
					UInput: true,
					UCheckbox: true,
				},
			},
		})

	const mountComp = () =>
		mount(Register, {
			global: {
				stubs: {
					UButton: UButtonStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					UCheckbox: UCheckboxStub,
					AppLogo: AppLogoStub,
				},
			},
		})

	beforeEach(() => {
		// Mock router.replace for redirect assertions
		const routerStub = vi.mocked(useRouter as any)
		replaceSpy = vi.fn()
		routerStub.mockReturnValue({ replace: replaceSpy })

		// Fresh toast.add spy per test
		toastAddSpy = vi.fn()
		vi.stubGlobal('useToast', () => ({ add: toastAddSpy }))

		registerMock.mockReset()
		preventSpaceMock.mockReset()
	})

	it('initially shows default caption and form (negative)', async () => {
		// Use shallow mount for speed; UFormStub still renders a real <form>
		const wrapper = shallowComp()

		expect(wrapper.text()).toContain('Already have an account?')
		expect(wrapper.text()).not.toContain('Success to register your account')
		expect(wrapper.text()).not.toContain('Please check your email to complete verification process')

		// Shallow stubs don’t render a real <form>; assert the component exists instead
		expect(wrapper.findComponent({ name: 'UForm' }).exists()).toBe(true)
	})

	it('handleRegister success shows toast and success caption (positive)', async () => {
		// Drive success branch
		registerMock.mockResolvedValueOnce({
			code: 200,
			message: 'Success to register your account',
		})

		const wrapper = shallowComp()

		// Call handler and flush microtasks + DOM updates
		await (wrapper.vm as any).handleRegister()
		await flushPromises()
		await wrapper.vm.$nextTick()

		// Assert toast and state
		expect(toastAddSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Register',
				description: 'Success to register your account',
			})
		)
		expect((wrapper.vm as any).isRegisterSuccess).toBe(true)

		// Assert success caption specifically (avoids flakiness)
		const successCaption = wrapper.find('.form__caption--success')
		expect(successCaption.exists()).toBe(true)
		expect(successCaption.text()).toContain('Success to register your account')
		expect(successCaption.text()).toContain(
			'Please check your email to complete verification process'
		)

		// Default caption should be gone
		expect(wrapper.text()).not.toContain('Already have an account?')
	})

	it('handleRegister failure keeps default caption and no toast (negative)', async () => {
		registerMock.mockResolvedValueOnce(null)

		const wrapper = shallowComp()

		await (wrapper.vm as any).handleRegister()
		await wrapper.vm.$nextTick()

		expect(toastAddSpy).not.toHaveBeenCalled()
		expect(wrapper.text()).toContain('Already have an account?')
		expect(wrapper.text()).not.toContain('Success to register your account')
		expect(wrapper.text()).not.toContain('Please check your email to complete verification process')
	})

	it('inline @keypress handlers call preventSpace (positive)', async () => {
		// Needs real input DOM, keep full mount
		preventSpaceMock.mockClear()

		const wrapper = mountComp()

		const allInputs = wrapper.findAll('input')
		const textInputs = allInputs.filter((i) => i.attributes('type') !== 'checkbox')

		// Skip first text input (fullname) — no @keypress handler
		for (let i = 1; i < textInputs.length; i++) {
			await textInputs[i].trigger('keypress', { key: ' ' })
		}

		const expectedCalls = textInputs.length - 1
		expect(preventSpaceMock).toHaveBeenCalledTimes(expectedCalls)
	})

	it('clicking "Sign in" navigates to /sign-in (positive)', async () => {
		const wrapper = shallowComp()

		// Find the real button rendered by UButtonStub, then click it
		const signInBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign in')
		expect(signInBtn).toBeDefined()

		await signInBtn!.trigger('click')
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})

	it('disables submit and shows loading when isLoadingRegister is true (positive)', async () => {
		// Set mocked flag via static import to avoid dynamic import overhead
		useAuth().isLoadingRegister.value = true

		const wrapper = mountComp()

		const submitBtn = wrapper.find('button[type="submit"]')
		expect(submitBtn.exists()).toBe(true)
		expect(submitBtn.attributes('disabled')).toBeDefined()
		expect(submitBtn.attributes('data-loading')).toBe('true')
	})

	it('submit enabled and not loading when isLoadingRegister is false (negative)', async () => {
		useAuth().isLoadingRegister.value = false

		const wrapper = mountComp()

		const submitBtn = wrapper.find('button[type="submit"]')
		expect(submitBtn.exists()).toBe(true)

		// Assert submit is enabled
		expect(submitBtn.attributes('disabled')).toBeUndefined()

		// Assert loading false or absent
		const loadingAttr = submitBtn.attributes('data-loading')
		expect(loadingAttr === undefined || loadingAttr === 'false').toBe(true)
	})

	it('v-model setters run for all fields (positive)', async () => {
		// Needs real input/checkbox DOM, keep full mount
		const wrapper = mountComp()

		const inputs = wrapper.findAll('input')
		const textInputs = inputs.filter((i) => i.attributes('type') !== 'checkbox')

		await textInputs[0].setValue('John Doe')
		await textInputs[1].setValue('johnd')
		await textInputs[2].setValue('john@example.com')
		await textInputs[3].setValue('pass123!')
		await textInputs[4].setValue('pass123!')

		// Checkbox: tnc
		const checkbox = wrapper.find('input[type="checkbox"]')
		await checkbox.setValue(true)

		const vm = wrapper.vm as any
		expect(vm.form.fullname).toBe('John Doe')
		expect(vm.form.username).toBe('johnd')
		expect(vm.form.email).toBe('john@example.com')
		expect(vm.form.password.real).toBe('pass123!')
		expect(vm.form.password.confirmation).toBe('pass123!')
		expect(vm.form.tnc).toBe(true)
	})
})
