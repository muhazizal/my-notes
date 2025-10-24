import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Logo from '~/components/App/Logo.vue'

describe('App/Logo.vue', () => {
  it('renders brand text (positive)', () => {
    const wrapper = mount(Logo)
    const h1 = wrapper.find('h1.logo__text')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('My Notes.')
  })

  it('does not render incorrect text (negative)', () => {
    const wrapper = mount(Logo)
    expect(wrapper.text()).not.toContain('Notes App') // different wording should not appear
  })
})