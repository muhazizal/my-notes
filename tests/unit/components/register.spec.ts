import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

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
		const Comp = (await import('@/components/Register/Index.vue')).default

		const wrapper = mount(Comp, {
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

		expect(wrapper.text()).toContain('Already have an account?')
		expect(wrapper.text()).not.toContain('Success to register your account')
		expect(wrapper.text()).not.toContain('Please check your email to complete verification process')
	})

	it('handleRegister success shows toast and success caption (positive)', async () => {
		const Comp = (await import('@/components/Register/Index.vue')).default

		// Make register resolve so success branch runs
		registerMock.mockResolvedValue({
			code: 200,
			message: 'Success to register your account',
		})

		// Use shallowMount to avoid DOM fragment anchor issues when toggling v-if
		const wrapper = shallowMount(Comp, {
			global: {
				stubs: {
					UButton: true,
					UForm: true,
					UFormGroup: true,
					UInput: true,
					UCheckbox: true,
					AppLogo: true,
				},
			},
		})

		await (wrapper.vm as any).handleRegister()
		await nextTick()

		expect(toastAddSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Register',
				description: 'Success to register your account',
			})
		)
		expect(wrapper.text()).toContain('Success to register your account')
		expect(wrapper.text()).toContain('Please check your email to complete verification process')
		// Default caption should be gone
		expect(wrapper.text()).not.toContain('Already have an account?')
	})

	it('handleRegister failure keeps default caption and no toast (negative)', async () => {
		// Ensure failure branch (no toast, no success caption)
		registerMock.mockResolvedValueOnce(null)

		const Comp = (await import('@/components/Register/Index.vue')).default

		// Use shallowMount since we don't need actual child DOM when not toggling v-if
		const { shallowMount } = await import('@vue/test-utils')
		const { nextTick } = await import('vue')
		const wrapper = shallowMount(Comp, {
			global: {
				stubs: {
					UButton: true,
					UForm: true,
					UFormGroup: true,
					UInput: true,
					UCheckbox: true,
					AppLogo: true,
				},
			},
		})

		// Call the method directly and await to ensure the false branch of `if (res)` executes
		await (wrapper.vm as any).handleRegister()
		await nextTick()

		expect(toastAddSpy).not.toHaveBeenCalled()
		expect(wrapper.text()).toContain('Already have an account?')
		expect(wrapper.text()).not.toContain('Success to register your account')
		expect(wrapper.text()).not.toContain('Please check your email to complete verification process')
	})

	it('inline @keypress handlers call preventSpace (positive)', async () => {
		const Comp = (await import('@/components/Register/Index.vue')).default

		preventSpaceMock.mockClear()

		const wrapper = mount(Comp, {
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

		const allInputs = wrapper.findAll('input')
		const textInputs = allInputs.filter((i) => i.attributes('type') !== 'checkbox')

		// Skip the first text input (fullname) because it has no @keypress handler
		for (let i = 1; i < textInputs.length; i++) {
		await textInputs[i].trigger('keypress', { key: ' ' })
		}

		const expectedCalls = textInputs.length - 1
		expect(preventSpaceMock).toHaveBeenCalledTimes(expectedCalls)
	})

	it('clicking "Sign in" navigates to /sign-in (positive)', async () => {
		const Comp = (await import('@/components/Register/Index.vue')).default

		const wrapper = mount(Comp, {
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

		const signInBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign in')!
		await signInBtn.trigger('click')
		expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
	})

	it('disables submit and shows loading when isLoadingRegister is true (positive)', async () => {
		const Comp = (await import('@/components/Register/Index.vue')).default

		// Toggle loading state before mount
		const { useAuth } = await import('@/composables/api/useAuth')
		useAuth().isLoadingRegister.value = true

		const wrapper = mount(Comp, {
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

		// Find the submit button by forwarded type
		const submitBtn = wrapper.find('button[type="submit"]')
		expect(submitBtn.exists()).toBe(true)
		// Disabled attribute present
		expect(submitBtn.attributes('disabled')).toBeDefined()
		// Loading flag forwarded via data attribute
		expect(submitBtn.attributes('data-loading')).toBe('true')
	})

	it('submit enabled and not loading when isLoadingRegister is false (negative)', async () => {
		const Comp = (await import('@/components/Register/Index.vue')).default

		// Ensure loading is false (default), but set explicitly for clarity
		const { useAuth } = await import('@/composables/api/useAuth')
		useAuth().isLoadingRegister.value = false

		const wrapper = mount(Comp, {
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

		const submitBtn = wrapper.find('button[type="submit"]')
		expect(submitBtn.exists()).toBe(true)

		// Assert submit is enabled
		expect(submitBtn.attributes('disabled')).toBeUndefined()

		// Assert loading false or absent
		const loadingAttr = submitBtn.attributes('data-loading')
		expect(loadingAttr === undefined || loadingAttr === 'false').toBe(true)
	})

	it('v-model setters run for all fields (positive)', async () => {
		const Comp = (await import('@/components/Register/Index.vue')).default

		const wrapper = mount(Comp, {
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

		// Text/password inputs: fullname, username, email, password.real, password.confirmation
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

		// Assert v-model setters updated the reactive form
		const vm = wrapper.vm as any
		expect(vm.form.fullname).toBe('John Doe')
		expect(vm.form.username).toBe('johnd')
		expect(vm.form.email).toBe('john@example.com')
		expect(vm.form.password.real).toBe('pass123!')
		expect(vm.form.password.confirmation).toBe('pass123!')
		expect(vm.form.tnc).toBe(true)
	})
})