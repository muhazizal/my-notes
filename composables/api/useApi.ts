import type { UseFetchOptions } from 'nuxt/app'
import { defu } from 'defu'

type CustomFetchOptions<T> = UseFetchOptions<T> & {
	excludeInterceptor?: number[]
}

export function useApi<T>(url: string, opts: CustomFetchOptions<T> = {}) {
	const router = useRouter()
	const toast = useToast()

	const { excludeInterceptor, ...options } = opts

	const defaults: UseFetchOptions<T> = {
		async onRequest({ options }) {
			options.headers = new Headers(options.headers) || {}
			options.headers.set('X-Requested-With', 'XMLHttpRequest')
		},
		onResponse({ response }) {
			if (import.meta.server) {
				console.error('useApi onResponse', response)
			}
		},
		async onResponseError({ response }) {
			console.error(response)

			if (import.meta.server) {
				console.error('useApi onResponseError', response)
			}

			const excludedInterceptor = (statusCode: number): boolean => {
				if (!excludeInterceptor) return false
				return excludeInterceptor.includes(statusCode)
			}

			if (!excludedInterceptor(response.status)) {
				if (response.status === 422) {
					const errorText = response.statusText
					toast.add({
						color: 'red',
						title: 'Error 422',
						description: errorText,
					})
				}

				if (response.status === 401) {
					toast.add({
						color: 'red',
						title: 'Error 401',
						description: response.statusText,
					})

					if (import.meta.client) {
						router.replace('/')
					}
				}

				if (response.status === 403) {
					toast.add({
						color: 'red',
						title: 'Error 403',
						description: response.statusText,
					})

					throw showError({ statusCode: 403 })
				}

				if (response.status === 404) {
					throw showError({ statusCode: 404 })
				}

				if (response.status >= 500) {
					toast.add({
						color: 'red',
						title: `Error ${response.status}`,
						description: response.statusText,
					})
				}
			}
		},
	}

	const params = defu(options, defaults)
	return useFetch(url, params)
}
