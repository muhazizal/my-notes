import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

describe('pages/sign-in.vue', () => {
  it('renders Login component inside UContainer (positive)', async () => {
    const mod = await import('~/pages/sign-in.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          Login: { template: '<div data-test="login">Login</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="login"]').exists()).toBe(true)
  })

  it('does not render Register component (negative)', async () => {
    const mod = await import('~/pages/sign-in.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          Login: { template: '<div data-test="login">Login</div>' },
          Register: { template: '<div data-test="register">Register</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="register"]').exists()).toBe(false)
  })
})

describe('pages/sign-up.vue', () => {
  it('renders Register component inside UContainer (positive)', async () => {
    const mod = await import('~/pages/sign-up.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          Register: { template: '<div data-test="register">Register</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="register"]').exists()).toBe(true)
  })

  it('does not render Login component (negative)', async () => {
    const mod = await import('~/pages/sign-up.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          Register: { template: '<div data-test="register">Register</div>' },
          Login: { template: '<div data-test="login">Login</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="login"]').exists()).toBe(false)
  })
})

describe('pages/forgot-password.vue', () => {
  it('renders ForgotPassword component inside UContainer (positive)', async () => {
    const mod = await import('~/pages/forgot-password.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          ForgotPassword: { template: '<div data-test="fp">Forgot Password</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="container"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="fp"]').exists()).toBe(true)
  })

  it('does not render Login component (negative)', async () => {
    const mod = await import('~/pages/forgot-password.vue')
    const Page = mod.default

    const wrapper = mount(Page, {
      global: {
        stubs: {
          UContainer: { template: '<div data-test="container"><slot /></div>' },
          ForgotPassword: { template: '<div data-test="fp">Forgot Password</div>' },
          Login: { template: '<div data-test="login">Login</div>' },
        },
      },
    })

    expect(wrapper.find('[data-test="login"]').exists()).toBe(false)
  })
})