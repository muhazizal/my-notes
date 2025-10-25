import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

describe('middleware/auth.global', () => {
  let middleware: (to: any, from?: any) => any
  let useStore: () => { isLoggedIn: { value: boolean } }

  beforeAll(async () => {
    // defineNuxtRouteMiddleware is globally stubbed in vitest.setup.ts
    const storeMod = await import('@/stores/user')
    useStore = storeMod.useUserStore as any

    const mod = await import('~/middleware/auth.global')
    middleware = mod.default as any
  })

  afterEach(() => {
    const nav = vi.mocked(navigateTo as any)
    nav.mockReset()
    const store = useStore()
    store.isLoggedIn.value = false
  })

  it('logged-in user visiting auth route redirects to /notes (positive)', () => {
    const store = useStore()
    store.isLoggedIn.value = true

    middleware({ name: 'sign-in' }, { name: 'index' })

    const nav = vi.mocked(navigateTo as any)
    expect(nav).toHaveBeenCalledTimes(1)
    expect(nav).toHaveBeenCalledWith('/notes')
  })

  it('logged-in user visiting non-auth route does not redirect (negative)', () => {
    const store = useStore()
    store.isLoggedIn.value = true

    middleware({ name: 'notes' }, { name: 'index' })

    const nav = vi.mocked(navigateTo as any)
    expect(nav).not.toHaveBeenCalled()
  })

  it('logged-out user visiting non-auth route redirects to /sign-in (positive)', () => {
    const store = useStore()
    store.isLoggedIn.value = false

    middleware({ name: 'notes' }, { name: 'index' })

    const nav = vi.mocked(navigateTo as any)
    expect(nav).toHaveBeenCalledTimes(1)
    expect(nav).toHaveBeenCalledWith('/sign-in')
  })

  it('logged-out user visiting auth route does not redirect (negative)', () => {
    const store = useStore()
    store.isLoggedIn.value = false

    middleware({ name: 'sign-up' }, { name: 'index' })

    const nav = vi.mocked(navigateTo as any)
    expect(nav).not.toHaveBeenCalled()
  })

  it('auth route list includes verify-token and reset-password-token', () => {
    const store = useStore()
    store.isLoggedIn.value = true

    middleware({ name: 'verify-token' }, { name: 'index' })
    middleware({ name: 'reset-password-token' }, { name: 'index' })

    const nav = vi.mocked(navigateTo as any)
    expect(nav).toHaveBeenCalledTimes(2)
    expect(nav).toHaveBeenNthCalledWith(1, '/notes')
    expect(nav).toHaveBeenNthCalledWith(2, '/notes')
  })
})
