import { describe, it, expect, vi, afterEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LoadingBar from '~/components/App/LoadingBar.vue'
import { UProgressStub } from '~/tests/helpers/uiStubs'

// Mock vue-router so we can capture guards
vi.mock('vue-router', () => {
	let beforeHandler: (() => any) | null = null
	let afterHandler: (() => any) | null = null
	return {
		useRouter: () => ({
			beforeEach: (fn: () => any) => {
				beforeHandler = fn
			},
			afterEach: (fn: () => any) => {
				afterHandler = fn
			},
		}),
		__handlers: {
			get before() {
				return beforeHandler
			},
			get after() {
				return afterHandler
			},
		},
	}
})

afterEach(() => {
	vi.useRealTimers()
})

describe('App/LoadingBar.vue', () => {
	it('shows, ramps up, then completes and hides (positive)', async () => {
		vi.useFakeTimers()

		const wrapper = shallowMount(LoadingBar, {
			global: { stubs: { UProgress: UProgressStub } },
		})

		const progressEl = wrapper.find('[data-test="progress"]')
		// v-show applies display: none initially
		expect((progressEl.element as HTMLElement).style.display).toBe('none')

		const vr = (await import('vue-router')) as any
		vr.__handlers.before!()
		// after start, visible
		await wrapper.vm.$nextTick()
		expect((progressEl.element as HTMLElement).style.display).not.toBe('none')

		// ramp up at ~200ms increments
		vi.advanceTimersByTime(200)
		await wrapper.vm.$nextTick()
		const valAfterTick = Number(progressEl.attributes('data-value'))
		expect(valAfterTick).toBeGreaterThan(0)

		// finish
		vr.__handlers.after!()
		await wrapper.vm.$nextTick()
		expect(Number(progressEl.attributes('data-value'))).toBe(100)

		// still visible until 400ms after finish
		vi.advanceTimersByTime(399)
		expect((progressEl.element as HTMLElement).style.display).not.toBe('none')

		// then hidden
		vi.advanceTimersByTime(1)
		await wrapper.vm.$nextTick()
		expect((progressEl.element as HTMLElement).style.display).toBe('none')
	})

	it('does not hide immediately before delay when finishing after start (negative)', async () => {
		vi.useFakeTimers()

		const wrapper = shallowMount(LoadingBar, {
			global: { stubs: { UProgress: UProgressStub } },
		})

		const vr = (await import('vue-router')) as any
		const progressEl = wrapper.find('[data-test="progress"]')

		vr.__handlers.before!()
		await wrapper.vm.$nextTick()
		vr.__handlers.after!()

		// Immediately after finish, still visible
		await wrapper.vm.$nextTick()
		expect((progressEl.element as HTMLElement).style.display).not.toBe('none')

		// Only after 400ms it hides
		vi.advanceTimersByTime(400)
		await wrapper.vm.$nextTick()
		expect((progressEl.element as HTMLElement).style.display).toBe('none')
	})
})
