import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

describe('pages/index.vue', () => {
  it('renders LandingScreen inside UContainer (positive)', async () => {
    const mod = await import('~/pages/index.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          LandingScreen: { template: '<div data-test="landing">Landing</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="landing"]').exists()).toBe(true)
  })

  it('does not render Login component (negative)', async () => {
    const mod = await import('~/pages/index.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          LandingScreen: { template: '<div data-test="landing">Landing</div>' },
          Login: { template: '<div data-test="login">Login</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="login"]').exists()).toBe(false)
  })
})

describe('pages/verify/[token].vue', () => {
  it('renders Verify inside UContainer (positive)', async () => {
    const mod = await import('~/pages/verify/[token].vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          Verify: { template: '<div data-test="verify">Verify</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="verify"]').exists()).toBe(true)
  })

  it('does not render ResetPassword component (negative)', async () => {
    const mod = await import('~/pages/verify/[token].vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          Verify: { template: '<div data-test="verify">Verify</div>' },
          ResetPassword: { template: '<div data-test="reset">Reset</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="reset"]').exists()).toBe(false)
  })
})

describe('pages/reset-password/[token].vue', () => {
  it('renders ResetPassword inside UContainer (positive)', async () => {
    const mod = await import('~/pages/reset-password/[token].vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          ResetPassword: { template: '<div data-test="reset">Reset</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="reset"]').exists()).toBe(true)
  })

  it('does not render Verify component (negative)', async () => {
    const mod = await import('~/pages/reset-password/[token].vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          ResetPassword: { template: '<div data-test="reset">Reset</div>' },
          Verify: { template: '<div data-test="verify">Verify</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="verify"]').exists()).toBe(false)
  })
})