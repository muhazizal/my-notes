import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MainLayout from '~/layouts/main.vue'

describe('layouts/main.vue', () => {
	it('renders AppHeader and slot content (positive case)', () => {
		const wrapper = mount(MainLayout, {
			global: {
				// stub AppHeader to focus the test on layout structure
				stubs: {
					AppHeader: { template: '<div data-test="header">Header</div>' },
				},
			},
			slots: {
				default: '<div data-test="slot">Main Content</div>',
			},
		})

		const header = wrapper.find('[data-test="header"]')
		const main = wrapper.find('main')
		expect(header.exists()).toBe(true)
		expect(main.exists()).toBe(true)
		expect(main.text()).toContain('Main Content')
		expect(main.element.children.length).toBe(1)
	})

	it('renders AppHeader and empty <main> without slot (negative case)', () => {
		const wrapper = mount(MainLayout, {
			global: {
				stubs: {
					AppHeader: { template: '<div data-test="header">Header</div>' },
				},
			},
		})

		const header = wrapper.find('[data-test="header"]')
		const main = wrapper.find('main')
		expect(header.exists()).toBe(true)
		expect(main.exists()).toBe(true)
		expect(main.element.children.length).toBe(0)
		expect(main.text().trim()).toBe('')
	})
})
