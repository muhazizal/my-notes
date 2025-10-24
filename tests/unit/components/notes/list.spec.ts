import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import List from '~/components/Notes/List.vue'
import { sampleNotes } from '../../../mocks/data'

// MSW and Nuxt globals from test setup
declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useToast: () => any

describe('components/Notes/List.vue', () => {
	const NotesItemStub = {
		name: 'NotesItem',
		template: '<div class="notes-item-stub" role="button" @click="$emit(\'click\')"><slot /></div>',
	}

	const flushAsync = async (vm?: any) => {
		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		if (vm?.$nextTick) await vm.$nextTick()
	}

	// Real Suspense wrapper to allow async setup() rendering
	const WithSuspense = {
		components: { List },
		template: '<Suspense><List /></Suspense>',
	}

	it('renders notes and navigates on click when API succeeds', async () => {
		const routerMock = { push: vi.fn() }
		;(globalThis as any).useRouter.mockReturnValue(routerMock)

		const wrapper = await mount(WithSuspense, {
			global: {
				stubs: {
					NotesItem: NotesItemStub,
				},
			},
		})

		// Wait for Suspense to resolve List's async setup
		await flushAsync(wrapper.vm)

		const items = wrapper.findAll('.notes-item-stub')
		expect(items.length).toBe(sampleNotes.length)

		expect(items[0].text()).toContain(sampleNotes[0].title)
		expect(items[0].text()).toContain(sampleNotes[0].description)

		await items[0].trigger('click')
		expect(routerMock.push).toHaveBeenCalledWith(`/notes/${sampleNotes[0].id}`)
	})

	it('renders error message when API fails', async () => {
		mswServer.use(
			http.get('/api/notes', async () =>
				HttpResponse.json({ message: 'Server error' }, { status: 500 })
			)
		)

		const routerMock = { push: vi.fn() }
		;(globalThis as any).useRouter.mockReturnValue(routerMock)

		const wrapper = await mount(WithSuspense, {
			global: {
				stubs: {
					NotesItem: NotesItemStub,
				},
			},
		})

		// Wait for Suspense to resolve List's async setup
		await flushAsync(wrapper.vm)

		expect(wrapper.text()).toContain('Unable to load notes. Please try again later.')

		expect(wrapper.findAll('.notes-item-stub').length).toBe(0)
	})
})
