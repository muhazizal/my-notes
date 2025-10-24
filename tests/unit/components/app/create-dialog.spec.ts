import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateDialog from '~/components/App/CreateDialog.vue'

const UModalStub = {
  name: 'UModal',
  props: { modelValue: { type: Boolean, default: false } },
  template: '<div data-test="modal" :data-open="modelValue"><slot /></div>',
}
const UCardStub = {
  name: 'UCard',
  template: '<div data-test="card"><slot name="header"></slot><slot /></div>',
}

describe('App/CreateDialog.vue', () => {
  it('opens and renders title + body slot (positive)', async () => {
    const wrapper = mount(CreateDialog, {
      props: { title: 'Create Something' },
      global: {
        stubs: {
          UModal: UModalStub,
          UCard: UCardStub,
        },
      },
      slots: {
        body: '<div data-test="body">Body Content</div>',
      },
    })

    ;(wrapper.vm as any).handleOpenModal(true)
    await (wrapper.vm as any).$nextTick()

    const modal = wrapper.find('[data-test="modal"]')
    const card = wrapper.find('[data-test="card"]')
    expect(modal.attributes('data-open')).toBe('true')
    expect(card.text()).toContain('Create Something')
    expect(wrapper.find('[data-test="body"]').exists()).toBe(true)

    // Exercise v-model setter by emitting from the child
    const umodal = wrapper.findComponent({ name: 'UModal' })
    umodal.vm.$emit('update:modelValue', false)
    await (wrapper.vm as any).$nextTick()
    expect(modal.attributes('data-open')).toBe('false')
  })

  it('closes and has no body slot when omitted (negative)', async () => {
    const wrapper = mount(CreateDialog, {
      props: { title: 'No Body' },
      global: {
        stubs: {
          UModal: UModalStub,
          UCard: UCardStub,
        },
      },
    })

    // Exercise v-model setter to open
    const umodal = wrapper.findComponent({ name: 'UModal' })
    umodal.vm.$emit('update:modelValue', true)
    await (wrapper.vm as any).$nextTick()
    const modal = wrapper.find('[data-test="modal"]')
    expect(modal.attributes('data-open')).toBe('true')

    // Then close via exposed handler
    ;(wrapper.vm as any).handleOpenModal(false)
    await (wrapper.vm as any).$nextTick()
    expect(modal.attributes('data-open')).toBe('false')

    const card = wrapper.find('[data-test="card"]')
    expect(card.text()).toContain('No Body')
    expect(wrapper.find('[data-test="body"]').exists()).toBe(false)
  })
})