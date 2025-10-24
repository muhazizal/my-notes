import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

declare const useUserStore: () => any
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

// Simple form stubs
const UFormStub = {
  name: 'UForm',
  template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>`,
}
const UFormGroupStub = { name: 'UFormGroup', template: `<div data-test="group"><slot /></div>` }

// Input stub: expose placeholder for identification and support v-model + keypress
const UInputStub = {
  name: 'UInput',
  props: ['modelValue', 'placeholder', 'size', 'class', 'type'],
  emits: ['update:modelValue', 'keypress'],
  template: `
    <div
      data-test="input"
      :data-placeholder="placeholder"
      @keypress="$emit('keypress', $event)"
    >
      <!-- minimal rendering; events are emitted via component VM in tests -->
    </div>
  `,
}

// AppLogo isn't used in assertions but stub to avoid real render
const AppLogoStub = { name: 'AppLogo', template: '<div>Logo</div>' }

// Mock useNoSpace to capture inline @keypress handler execution
const preventSpaceMock = vi.fn()
vi.mock('@/composables/utils/input/useNoSpace', () => ({
  useNoSpace: () => ({ preventSpace: preventSpaceMock }),
}))

describe('components/User/EditProfile.vue', () => {
  let store: any
  let toastAddSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    store = useUserStore()
    store.editUserProfile.mockReset()

    // Set a fresh user baseline
    store.user.value = {
      fullname: 'John',
      username: 'johnny',
      email: 'john@example.com',
      isVerified: false,
    }

    toastAddSpy = useToast().add
    toastAddSpy.mockReset()
    preventSpaceMock.mockReset()
  })

  const mountComp = async () => {
    const mod = await import('~/components/User/EditProfile.vue')
    const Comp = mod.default
    return mount(Comp, {
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
  }

  it('initializes form from user store on mounted (positive)', async () => {
    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    // onMounted -> handleInitForm copies user into form
    const form = vm.form?.value ?? vm.form
    expect(form.fullname).toBe('John')
    expect(form.username).toBe('johnny')
    expect(form.email).toBe('john@example.com')
  })

  it('v-model setters update fullname, username, and email (positive)', async () => {
    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    const inputs = wrapper.findAllComponents(UInputStub)
    expect(inputs.length).toBeGreaterThanOrEqual(3)

    const fullnameCmp = inputs.find((c) => c.props('placeholder') === 'Full name')!
    const usernameCmp = inputs.find((c) => c.props('placeholder') === 'Username')!
    const emailCmp = inputs.find((c) => c.props('placeholder') === 'Email address')!

    fullnameCmp.vm.$emit('update:modelValue', 'Jane Doe')
    usernameCmp.vm.$emit('update:modelValue', 'jane')
    emailCmp.vm.$emit('update:modelValue', 'jane@x.com')
    await wrapper.vm.$nextTick()

    const form = vm.form?.value ?? vm.form
    expect(form.fullname).toBe('Jane Doe')
    expect(form.username).toBe('jane')
    expect(form.email).toBe('jane@x.com')
  })

  it('inline @keypress calls preventSpace for username and email only (positive)', async () => {
    const wrapper = await mountComp()

    const usernameCmp = wrapper.findAllComponents(UInputStub).find((c) => c.props('placeholder') === 'Username')!
    const emailCmp = wrapper.findAllComponents(UInputStub).find((c) => c.props('placeholder') === 'Email address')!

    usernameCmp.vm.$emit('keypress', { key: ' ' })
    emailCmp.vm.$emit('keypress', { key: ' ' })
    await wrapper.vm.$nextTick()

    expect(preventSpaceMock).toHaveBeenCalledTimes(2)
  })

  it('handleEditUserProfile success updates user, shows toast, and closes modal (positive)', async () => {
    // Mock successful API response with data and message
    store.editUserProfile.mockResolvedValueOnce({
      data: ref({
        data: { fullname: 'Jane D', username: 'jane_d', email: 'jane_d@example.com' },
        message: 'Updated successfully',
      }),
    })

    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    // Set form values using instance-unwrapped ref fallback
    const form = vm.form?.value ?? vm.form
    form.fullname = 'Jane D'
    form.username = 'jane_d'
    form.email = 'jane_d@example.com'

    await vm.handleEditUserProfile()

    // User store updated
    expect(store.user.value.fullname).toBe('Jane D')
    expect(store.user.value.username).toBe('jane_d')
    expect(store.user.value.email).toBe('jane_d@example.com')

    // Toast added
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Edit Profile', description: 'Updated successfully' })
    )

    // Modal closed
    const emitted = wrapper.emitted('on-open-modal') ?? []
    expect(emitted.length).toBeGreaterThanOrEqual(1)
    expect(emitted[emitted.length - 1]).toEqual([false])

    // Loading reset
    expect(vm.isLoadingForm).toBe(false)

    // API called with submitted body
    expect(store.editUserProfile).toHaveBeenCalledWith({
      fullname: 'Jane D',
      username: 'jane_d',
      email: 'jane_d@example.com',
    })
  })

  it('handleEditUserProfile failure keeps user unchanged and still closes modal (negative)', async () => {
    // Mock response without data to skip success branch
    store.editUserProfile.mockResolvedValueOnce({
      data: ref({ data: null, message: 'No changes' }),
    })

    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    // Change form values using instance-unwrapped ref fallback
    const form = vm.form?.value ?? vm.form
    form.fullname = 'Changed Name'
    form.username = 'changed_user'
    form.email = 'changed@example.com'

    await vm.handleEditUserProfile()

    // User store NOT updated
    expect(store.user.value.fullname).toBe('John')
    expect(store.user.value.username).toBe('johnny')
    expect(store.user.value.email).toBe('john@example.com')

    // No toast
    expect(toastAddSpy).not.toHaveBeenCalled()

    // Modal closed
    const emitted = wrapper.emitted('on-open-modal') ?? []
    expect(emitted.length).toBeGreaterThanOrEqual(1)
    expect(emitted[emitted.length - 1]).toEqual([false])

    // Loading reset
    expect(vm.isLoadingForm).toBe(false)
  })

  it('handleEditUserProfile early-returns when isLoadingForm is true (negative)', async () => {
    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    vm.isLoadingForm = true
    await vm.handleEditUserProfile()

    // No API call or modal emission
    expect(store.editUserProfile).not.toHaveBeenCalled()
    expect(wrapper.emitted('on-open-modal')).toBeUndefined()
    // Loading remains true (no reset on early-return)
    expect(vm.isLoadingForm).toBe(true)
  })

  it('handleCancel clears form and closes modal (positive)', async () => {
    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    // Fill form with non-empty values using instance-unwrapped ref fallback
    const form = vm.form?.value ?? vm.form
    form.fullname = 'To Clear'
    form.username = 'clear_me'
    form.email = 'clear@example.com'

    vm.handleCancel()

    const cleared = vm.form?.value ?? vm.form
    expect(cleared.fullname).toBe('')
    expect(cleared.username).toBe('')
    expect(cleared.email).toBe('')

    const emitted = wrapper.emitted('on-open-modal') ?? []
    expect(emitted.length).toBeGreaterThanOrEqual(1)
    expect(emitted[emitted.length - 1]).toEqual([false])
  })

  it('buttons reflect loading/disabled states from isLoadingForm (positive)', async () => {
    const wrapper = await mountComp()
    const vm = wrapper.vm as any

    const findBtnByText = (t: string) => wrapper.findAll('button').find((b) => b.text() === t)!

    const cancelBtn = findBtnByText('Cancel')
    const updateBtn = findBtnByText('Update')

    // Initially not loading
    expect(cancelBtn.attributes('data-disabled')).toBe('false')
    expect(cancelBtn.attributes('data-loading')).toBe('false')
    expect(updateBtn.attributes('data-disabled')).toBe('false')
    expect(updateBtn.attributes('data-loading')).toBe('false')

    vm.isLoadingForm = true
    await wrapper.vm.$nextTick()

    // When loading: both disabled, only Update shows loading
    expect(cancelBtn.attributes('data-disabled')).toBe('true')
    expect(cancelBtn.attributes('data-loading')).toBe('false')
    expect(updateBtn.attributes('data-disabled')).toBe('true')
    expect(updateBtn.attributes('data-loading')).toBe('true')
  })

  it('submitting the form triggers handleEditUserProfile via UForm (positive)', async () => {
    store.editUserProfile.mockResolvedValueOnce({
      data: ref({ data: null, message: 'noop' }),
    })

    const wrapper = await mountComp()
    await wrapper.find('[data-test="form"]').trigger('submit')
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(store.editUserProfile).toHaveBeenCalledTimes(1)
  })
})