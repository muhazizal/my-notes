import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { joinURL, withQuery } from 'ufo'

describe('server/api/[...path].ts', () => {
  let handler: (event: any) => Promise<any>

  // Use shared global stubs from setup
  const proxyRequest = (globalThis as any).proxyRequest as ReturnType<typeof vi.fn>
  const useRuntimeConfig = (globalThis as any).useRuntimeConfig as ReturnType<typeof vi.fn>
  const getRequestHeader = (globalThis as any).getRequestHeader as ReturnType<typeof vi.fn>
  const getRouterParam = (globalThis as any).getRouterParam as ReturnType<typeof vi.fn>
  const getQuery = (globalThis as any).getQuery as ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Reset and configure defaults
    proxyRequest.mockReset()
    useRuntimeConfig.mockReset()
    getRequestHeader.mockReset()
    getRouterParam.mockReset()
    getQuery.mockReset()

    useRuntimeConfig.mockReturnValue({ apiBaseUrl: 'https://api.example' })

    // Fresh import binds to current stubs
    handler = (await import('../../../server/api/[...path]')).default
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('rejects with 403 when X-Requested-With is not XMLHTTPRequest', async () => {
    getRequestHeader.mockImplementation((_event: any, name: string) =>
      name === 'X-Requested-With' ? 'fetch' : null
    )

    await expect(handler({})).rejects.toThrow(/Forbidden Access/i)
    expect(proxyRequest).not.toHaveBeenCalled()
  })

  it('proxies the request with joined URL and forwarded query when header is XMLHTTPRequest', async () => {
    getRequestHeader.mockImplementation((_event: any, name: string) =>
      name === 'X-Requested-With' ? 'XMLHttpRequest' : null
    )
    getRouterParam.mockImplementation((_event: any, key: string) => (key === 'path' ? 'user/profile' : ''))
    getQuery.mockImplementation((_event: any) => ({ q: '1', s: 'x' }))

    const event = { node: { req: {} }, context: { params: { path: 'user/profile' } } }
    proxyRequest.mockResolvedValue({ ok: true })

    const res = await handler(event)

    const base = joinURL('https://api.example', '/api', 'user/profile')
    const expectedUrl = withQuery(base, { q: '1', s: 'x' })

    expect(proxyRequest).toHaveBeenCalledTimes(1)
    expect(proxyRequest).toHaveBeenCalledWith(event, expectedUrl)
    expect(res).toEqual({ ok: true })
  })

  it('uses empty path when router param is missing', async () => {
    getRequestHeader.mockImplementation((_event: any, name: string) =>
      name === 'X-Requested-With' ? 'XMLHttpRequest' : null
    )
    getRouterParam.mockImplementation((_event: any, _key: string) => undefined)
    getQuery.mockImplementation((_event: any) => ({}))

    proxyRequest.mockResolvedValue({ ok: true })

    const event = { node: { req: {} }, context: {} }
    const res = await handler(event)

    const expectedUrl = joinURL('https://api.example', '/api', '')

    expect(proxyRequest).toHaveBeenCalledTimes(1)
    expect(proxyRequest).toHaveBeenCalledWith(event, expectedUrl)
    expect(res).toEqual({ ok: true })
  })
})
