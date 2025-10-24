import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useApi } from '~/composables/api/useApi'
import { flushPromises } from '@vue/test-utils'

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
		await flushPromises()

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
		await flushPromises()

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
		await flushPromises()

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
		await flushPromises()

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
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(403)

		const toast = useToast()
		expect(toast.add).not.toHaveBeenCalled()
	})

	it('handles non-specific error (400): sets error without toast or redirect', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({}, { status: 400, statusText: 'Bad Request' }))
		)

		const result = await useApi('/api/test')
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(400)

		const toast = useToast()
		expect(toast.add).not.toHaveBeenCalled()
		expect(navigateTo).not.toHaveBeenCalled()
	})

	it('excludeInterceptor provided but not matching: behaves normally', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const result = await useApi('/api/test', { excludeInterceptor: [404] })
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const store = useUserStore()
		expect(store.handleClearUser).toHaveBeenCalled()
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
	})

	it('401 path: user store throws, catch branch executes and redirect still happens', async () => {
		// Override global stub to throw to exercise catch {}
		const originalUseUserStore = useUserStore
		vi.stubGlobal('useUserStore', () => {
			throw new Error('store unavailable')
		})

		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const result = await useApi('/api/test')
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		// handleClearUser not called because store threw before access
		const store = originalUseUserStore()
		expect(store.handleClearUser).not.toHaveBeenCalled()
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')

		// restore
		vi.stubGlobal('useUserStore', originalUseUserStore)
	})

	it('500 with no message and empty statusText: uses default friendly copy', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({}, { status: 500, statusText: '' }))
		)

		const result = await useApi('/api/test')
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(500)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.title).toBe('Server error')
		expect(payload.description).toBe('Internal Server Error')
	})

	it('401 fallback copy when message and statusText are missing', async () => {
		mswServer.use(
			http.get('/api/test', () =>
				HttpResponse.json({ message: undefined }, { status: 401, statusText: undefined })
			)
		)

		const result = await useApi('/api/test')
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.title).toBe('Session expired')
		expect(payload.description).toBe('Unauthorized')
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
	})

	it('422 fallback copy when message and statusText are missing', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({}, { status: 422, statusText: '' }))
		)

		const result = await useApi('/api/test')
		await flushPromises()

		expect(result.error.value).not.toBeNull()
		const err = result.error.value!
		expect(err.status).toBe(422)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.title).toBe('Validation error')
		expect(payload.description).toBe('Unprocessable Entity')
	})

	it('403 fallback copy when message and statusText are missing', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({}, { status: 403, statusText: '' }))
		)

		await expect(useApi('/api/test')).rejects.toThrow()

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.title).toBe('Access denied')
		expect(payload.description).toBe('Forbidden')
	})

	it('404 fallback copy when message and statusText are missing', async () => {
		mswServer.use(
			http.get('/api/test', () => HttpResponse.json({}, { status: 404, statusText: '' }))
		)

		await expect(useApi('/api/test')).rejects.toThrow()

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.title).toBe('Not found')
		expect(payload.description).toBe('Not Found')
	})
})
