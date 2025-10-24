import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from '~/layouts/default.vue'

describe('layouts/default.vue', () => {
	it('renders slot content inside <main> (positive case)', () => {
		const wrapper = mount(DefaultLayout, {
			slots: {
				default: '<div data-test="slot">Hello Layout</div>',
			},
		})

		const main = wrapper.find('main')
		expect(main.exists()).toBe(true)
		expect(main.text()).toContain('Hello Layout')
		expect(main.element.children.length).toBe(1)
	})

	it('renders empty <main> when no slot provided (negative case)', () => {
		const wrapper = mount(DefaultLayout)

		const main = wrapper.find('main')
		expect(main.exists()).toBe(true)
		expect(main.element.children.length).toBe(0)
		expect(main.text().trim()).toBe('')
	})
})
