import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useApi } from '~/composables/api/useApi'

declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useToast: () => any
declare const navigateTo: () => any
declare const useUserStore: () => any

describe('useApi', () => {
	beforeEach(() => {
		const toast = useToast()
		vi.mocked(toast.add).mockReset()
		vi.mocked(navigateTo).mockReset()
		const store = useUserStore()
		vi.mocked(store.handleClearUser).mockReset()
	})

	it('sets required headers on request', async () => {
		let capturedHeaders: Record<string, string> | null = null
		let resolveHit!: () => void
		const hit = new Promise<void>((resolve) => {
			resolveHit = resolve
		})

		mswServer.use(
			http.get('/api/test', ({ request }) => {
				// Normalize header keys to lowercase for robust assertions
				capturedHeaders = Object.fromEntries(
					Array.from(request.headers.entries()).map(([k, v]) => [k.toLowerCase(), v])
				)
				resolveHit()
				return HttpResponse.json({ ok: true })
			})
		)

		const { data, error } = await useApi('/api/test')
		await hit

		expect(capturedHeaders?.['x-requested-with']).toBe('XMLHttpRequest')
		expect(capturedHeaders?.['content-type']).toBe('application/json')
		expect(capturedHeaders?.['accept']).toBe('application/json')
		expect(data).toBeDefined()
		expect(error).toBeDefined()
	})

	it('merges options and sends POST body', async () => {
		let method = ''
		let body: any = null
		mswServer.use(
			http.post('/api/test', async ({ request }) => {
				method = request.method
				body = await request.json()
				return HttpResponse.json({ ok: true })
			})
		)

		const res = await useApi('/api/test', { method: 'post', body: { hello: 'world' } })
		expect(method).toBe('POST')
		expect(body).toEqual({ hello: 'world' })
		expect(res.data).toBeDefined()
	})

	it('handles 401: toasts, clears user and redirects (no throw)', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const result = await useApi('/api/test')
		await Promise.resolve()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const store = useUserStore()
		expect(store.handleClearUser).toHaveBeenCalled()
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
	})

	it('handles 422: toasts validation error (no throw)', async () => {
		mswServer.use(
			http.get('/api/test', () =>
				HttpResponse.json({ message: 'Validation failed' }, { status: 422 })
			)
		)

		const result = await useApi('/api/test')
		await Promise.resolve()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(422)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.color).toBe('red')
		expect(payload.title).toBe('Validation error')
		expect(payload.description).toContain('Validation failed')
	})

	it('handles 403: toasts and throws createError', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Forbidden' }, { status: 403 }))
		)

		await expect(useApi('/api/test')).rejects.toThrow()
		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	it('handles 404: toasts and throws createError', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Missing' }, { status: 404 }))
		)

		await expect(useApi('/api/test')).rejects.toThrow()
		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	it('handles 500+: toasts server error (no throw)', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Oops' }, { status: 500 }))
		)

		const result = await useApi('/api/test')
		await Promise.resolve()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(500)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	it('excludeInterceptor prevents 401 side-effects', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const result = await useApi('/api/test', { excludeInterceptor: [401] })
		await Promise.resolve()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).not.toHaveBeenCalled()
		const store = useUserStore()
		expect(store.handleClearUser).not.toHaveBeenCalled()
		expect(navigateTo).not.toHaveBeenCalled()
	})

	it('excludeInterceptor prevents 403 throw and toast', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Forbidden' }, { status: 403 }))
		)

		const result = await useApi('/api/test', { excludeInterceptor: [403] })
		await Promise.resolve()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(403)

		const toast = useToast()
		expect(toast.add).not.toHaveBeenCalled()
	})
})
