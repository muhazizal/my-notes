import type { UseFetchOptions } from 'nuxt/app'
import { defu } from 'defu'

type CustomFetchOptions<T> = UseFetchOptions<T> & {
	excludeInterceptor?: number[]
}

export function useApi<T>(url: string, opts: CustomFetchOptions<T> = {}) {
	const toast = useToast()

	const { excludeInterceptor, ...options } = opts

	const defaults: UseFetchOptions<T> = {
		credentials: 'include',
		async onRequest({ options }) {
			options.headers = new Headers(options.headers) || {}
			options.headers.set('X-Requested-With', 'XMLHttpRequest')
			options.headers.set('Content-Type', 'application/json')
			options.headers.set('Accept', 'application/json')
		},
		async onResponseError({ response }) {
			if (import.meta.server) {
				console.error('useApi onResponseError', response)
			}

			const excludedInterceptor = (statusCode: number): boolean => {
				if (!excludeInterceptor) return false
				return excludeInterceptor.includes(statusCode)
			}

			if (!excludedInterceptor(response.status)) {
				const { message } = response._data
				const fallbackMessage = response.statusText

				if (response.status === 422) {
					toast.add({
						color: 'red',
						title: 'Error 422',
						description: message || fallbackMessage,
					})
				}

				if (response.status === 401) {
					toast.add({
						color: 'red',
						title: 'Error 401',
						description: message || fallbackMessage,
					})
					try {
						const { handleClearUser } = useUserStore()
						handleClearUser()
					} catch (e) {}
					return navigateTo('/sign-in')
				}

				if (response.status === 403) {
					toast.add({
						color: 'red',
						title: 'Error 403',
						description: message || fallbackMessage,
					})

					throw createError({ statusCode: 403, statusMessage: message || fallbackMessage })
				}

				if (response.status === 404) {
					toast.add({
						color: 'red',
						title: 'Error 404',
						description: message || fallbackMessage,
					})

					throw createError({ statusCode: 404, statusMessage: message || fallbackMessage })
				}

				if (response.status >= 500) {
					toast.add({
						color: 'red',
						title: `Error ${response.status}`,
						description: message || fallbackMessage || 'Internal server error',
					})
				}
			}
		},
	}

	const params = defu(options, defaults)
	return useFetch(url, params)
}
