import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

declare const useRouter: () => any
declare const useUserStore: () => any

const UButtonStub = {
	name: 'UButton',
	props: ['icon'],
	template:
		'<button data-test="btn" :data-icon="icon" @click="$emit(\'click\', $event)"><slot /></button>',
}
const UFormStub = {
	name: 'UForm',
	template: '<form data-test="form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
}
const UFormGroupStub = { name: 'UFormGroup', template: '<div data-test="group"><slot/></div>' }

// Render trailing slot only when provided, and expose current type
const UInputStub = {
	name: 'UInput',
	props: ['type', 'modelValue', 'placeholder', 'size', 'class'],
	setup(props: any, ctx: any) {
		const currentType = computed(() => props.type || 'password')
		const hasTrailing = computed(() => !!ctx.slots.trailing)
		return { currentType, hasTrailing }
	},
	template: `
    <div data-test="input" :data-type="currentType">
      <div v-if="hasTrailing" data-test="trailing"><slot name="trailing" /></div>
    </div>
  `,
}
const AppLogoStub = { name: 'AppLogo', template: '<div>Logo</div>' }

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

	it('asserts computed icon/type via DOM and toggle (positive)', async () => {
		const mod = await import('~/components/Login/Index.vue')
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

		// Find password input (the one with trailing button)
		let pwInput = wrapper
			.findAll('[data-test="input"]')
			.find((w) => w.find('[data-test="trailing"] button').exists())!
		let trailingBtn = pwInput.find('[data-test="trailing"] button')

		// Initial computed values
		expect(pwInput.attributes('data-type')).toBe('password')
		expect(trailingBtn.attributes('data-icon')).toBe('i-heroicons-eye-slash')

		// Manually toggle to avoid stub quirks
		;(wrapper.vm as any).handleShowPassword()
		await wrapper.vm.$nextTick()

		// Re-query after update
		pwInput = wrapper
			.findAll('[data-test="input"]')
			.find((w) => w.find('[data-test="trailing"] button').exists())!
		trailingBtn = pwInput.find('[data-test="trailing"] button')

		expect(pwInput.attributes('data-type')).toBe('text')
		expect(trailingBtn.attributes('data-icon')).toBe('i-heroicons-eye')
	})

	it('covers inline @keypress handlers on email and password inputs (positive)', async () => {
		const mod = await import('~/components/Login/Index.vue')
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

		// Trigger keypress on both inputs to execute the inline handlers
		const inputs = wrapper.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		for (const input of inputs) {
			await input.trigger('keypress', { key: ' ' })
		}

		// preventSpace called once per input handler
		expect(preventSpaceMock).toHaveBeenCalledTimes(inputs.length)
	})

	it('calls redirect methods directly via vm (positive)', async () => {
		const mod = await import('~/components/Login/Index.vue')
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

		const vm = wrapper.vm as any

		// Explicitly invoke both redirect functions so they count in function coverage
		vm.handleRedirectSignUp()
		expect(replaceSpy).toHaveBeenCalledWith('/sign-up')

		vm.handleRedirectForgotPassword()
		expect(replaceSpy).toHaveBeenCalledWith('/forgot-password')
	})

	it('redirects to /sign-up via "Sign up." button (positive)', async () => {
		const mod = await import('~/components/Login/Index.vue')
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

		const signUpBtn = wrapper.findAll('button').find((b) => b.text() === 'Sign up.')!
		await signUpBtn.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/sign-up')
	})

	it('redirects to /forgot-password via "Forgot password?" button (positive)', async () => {
		const mod = await import('~/components/Login/Index.vue')
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

		const forgotBtn = wrapper.findAll('button').find((b) => b.text() === 'Forgot password?')!
		await forgotBtn.trigger('click')

		expect(replaceSpy).toHaveBeenCalledWith('/forgot-password')
	})

	it('handleLogin success shows toast, fetches profile, and navigates to /notes (positive)', async () => {
		loginMock.mockResolvedValueOnce({ message: 'Welcome' })

		const mod = await import('~/components/Login/Index.vue')
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

		// Submit the form to trigger handleLogin
		await wrapper.find('[data-test="form"]').trigger('submit')
		await Promise.resolve()
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

		const mod = await import('~/components/Login/Index.vue')
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
		expect(store.getUserProfile).not.toHaveBeenCalled()
		expect(replaceSpy).not.toHaveBeenCalledWith('/notes')
	})

	it('executes true branch of handleShowPassword and returns type to password (positive)', async () => {
		const mod = await import('~/components/Login/Index.vue')
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

		const vm = wrapper.vm as any
		const readType = () => vm.getPasswordType?.value ?? vm.getPasswordType

		// Initial state: false -> 'password'
		expect(readType()).toBe('password')

		// First toggle: else branch (sets true)
		vm.handleShowPassword()
		await wrapper.vm.$nextTick()
		expect(readType()).toBe('text')

		// Second toggle: if branch at L85 (sets false)
		vm.handleShowPassword()
		await wrapper.vm.$nextTick()
		expect(readType()).toBe('password')
	})
})
