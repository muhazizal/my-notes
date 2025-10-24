import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Item from '~/components/Notes/Item.vue'

describe('components/Notes/Item.vue', () => {
  it('renders slot content inside root .item', () => {
    const wrapper = mount(Item, {
      slots: {
        default: '<span data-test="slot">Hello Note</span>',
      },
    })

    // Use find() when calling exists()
    const root = wrapper.find('.item')
    expect(root.exists()).toBe(true)
    expect(root.text()).toContain('Hello Note')
  })

  it('forwards attrs to root and triggers click listener', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Item, {
      attrs: {
        role: 'button',
        onClick,
      },
      slots: {
        default: 'Click me',
      },
    })

    // get() guarantees presence; no need to call exists()
    const root = wrapper.get('.item')
    expect(root.attributes('role')).toBe('button')

    await root.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})