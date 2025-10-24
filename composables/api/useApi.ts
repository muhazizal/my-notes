import type { UseFetchOptions } from 'nuxt/app'
import { defu } from 'defu'

type CustomFetchOptions<T> = UseFetchOptions<T> & {
	excludeInterceptor?: number[]
}

export function useApi<T>(url: string, opts: CustomFetchOptions<T> = {}) {
	const toast = useToast()

	const { excludeInterceptor, ...options } = opts

	// Map status codes to consistent, user-friendly messages
	const getFriendlyErrorCopy = (
		status: number,
		message?: string,
		statusText?: string
	): { title: string; description: string } => {
		const fallback = (message || statusText) as string
		if (status === 401) return { title: 'Session expired', description: fallback }
		if (status === 403)
			return {
				title: 'Access denied',
				description: fallback,
			}
		if (status === 404)
			return {
				title: 'Not found',
				description: fallback,
			}
		if (status === 422)
			return {
				title: 'Validation error',
				description: fallback,
			}
		if (status >= 500) return { title: 'Server error', description: fallback }
		return { title: `Error ${status}`, description: fallback }
	}

	const defaults: UseFetchOptions<T> = {
		credentials: 'include',
		async onRequest({ options }) {
			options.headers = new Headers(options.headers)
			options.headers.set('X-Requested-With', 'XMLHttpRequest')
			options.headers.set('Content-Type', 'application/json')
			options.headers.set('Accept', 'application/json')
		},
		async onResponseError({ response }) {
			const excludedInterceptor = (statusCode: number): boolean => {
				if (!excludeInterceptor) return false
				return excludeInterceptor.includes(statusCode)
			}

			if (!excludedInterceptor(response.status)) {
				const { message } = response._data
				const fallbackMessage = response.statusText
				const { title, description } = getFriendlyErrorCopy(
					response.status,
					message,
					fallbackMessage
				)

				if (response.status === 422) {
					toast.add({ color: 'red', title, description })
				}

				if (response.status === 401) {
					toast.add({ color: 'red', title, description })
					try {
						const { handleClearUser } = useUserStore()
						handleClearUser()
					} catch (e) {}
					return navigateTo('/sign-in')
				}

				if (response.status === 403) {
					toast.add({ color: 'red', title, description })
					throw createError({ statusCode: 403, statusMessage: description })
				}

				if (response.status === 404) {
					toast.add({ color: 'red', title, description })
					throw createError({ statusCode: 404, statusMessage: description })
				}

				if (response.status >= 500) {
					toast.add({ color: 'red', title, description })
				}
			}
		},
	}

	const params = defu(options, defaults)
	return useFetch(url, params)
}
