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
				console.log('useApi onResponse', response._data)
			}
		},
		async onResponseError({ response }) {
			if (import.meta.server) {
				console.log('useApi onResponseError', response._data)
			}

			const excludedInterceptor = (statusCode: number): boolean => {
				if (!excludeInterceptor) return false
				return excludeInterceptor.includes(statusCode)
			}

			if (!excludedInterceptor(response._data.code)) {
				if (response._data.code === 422) {
					let errorText = response._data.message
					const errors = response._data.errors

					if (typeof errors === 'string') {
						errorText = errors
					} else if (Array.isArray(errors)) {
						errorText = errors[0].messages[0]
					}

					toast.add({
						color: 'red',
						title: 'Error 422',
						description: errorText,
					})
				}

				if (response._data.code === 401) {
					toast.add({
						color: 'red',
						title: 'Error 401',
						description: response._data.message,
					})

					if (import.meta.client) {
						router.replace('/')
					}
				}

				if (response._data.code === 403) {
					toast.add({
						color: 'red',
						title: 'Error 403',
						description: response._data.message,
					})

					throw showError({ statusCode: 403 })
				}

				if (response._data.code === 404) {
					throw showError({ statusCode: 404 })
				}

				if (response._data.code >= 500) {
					toast.add({
						color: 'red',
						title: `Error ${response._data.code}`,
						description: response._data.message,
					})
				}
			}
		},
	}

	const params = defu(options, defaults)
	return useFetch(url, params)
}
