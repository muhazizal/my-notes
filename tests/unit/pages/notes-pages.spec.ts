import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

declare const definePageMeta: any

describe('pages/notes/index.vue', () => {
	it('renders Notes inside UContainer (positive)', async () => {
		const mod = await import('~/pages/notes/index.vue')
		const Page = mod.default

		const wrapper = mount(Page, {
			global: {
				stubs: {
					UContainer: { template: '<div data-test="container"><slot /></div>' },
					Notes: { template: '<div data-test="notes">Notes</div>' },
				},
			},
		})

		expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
		expect(wrapper.find('[data-test="notes"]').exists()).toBe(true)
	})

	it('does not render NotesDetail component (negative)', async () => {
		const mod = await import('~/pages/notes/index.vue')
		const Page = mod.default

		const wrapper = mount(Page, {
			global: {
				stubs: {
					UContainer: { template: '<div data-test="container"><slot /></div>' },
					Notes: { template: '<div data-test="notes">Notes</div>' },
					NotesDetail: { template: '<div data-test="detail">NotesDetail</div>' },
				},
			},
		})

		expect(wrapper.find('[data-test="detail"]').exists()).toBe(false)
	})
})

describe('pages/notes/[id].vue', () => {
	it('renders NotesDetail inside UContainer (positive)', async () => {
		const mod = await import('~/pages/notes/[id].vue')
		const Page = mod.default

		const wrapper = mount(Page, {
			global: {
				stubs: {
					UContainer: { template: '<div data-test="container"><slot /></div>' },
					NotesDetail: { template: '<div data-test="detail">NotesDetail</div>' },
				},
			},
		})

		expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
		expect(wrapper.find('[data-test="detail"]').exists()).toBe(true)
	})

	it('does not render Notes component (negative)', async () => {
		const mod = await import('~/pages/notes/[id].vue')
		const Page = mod.default

		const wrapper = mount(Page, {
			global: {
				stubs: {
					UContainer: { template: '<div data-test="container"><slot /></div>' },
					NotesDetail: { template: '<div data-test="detail">NotesDetail</div>' },
					Notes: { template: '<div data-test="notes">Notes</div>' },
				},
			},
		})

		expect(wrapper.find('[data-test="notes"]').exists()).toBe(false)
	})

	it('declares layout meta "main" in source', async () => {
		const src: any = await import('~/pages/notes/[id].vue?raw')
		const content = (src?.default || src) as string

		expect(content).toMatch(/definePageMeta\s*\(\s*\{[^}]*layout\s*:\s*['"]main['"][^}]*\}\s*\)/m)
	})
})
