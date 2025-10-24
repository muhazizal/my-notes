// Shared Vitest setup: stubs common Nuxt globals and boots MSW.
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { ref } from 'vue'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

// Stub common Nuxt/Vue app globals
const __toast = { add: vi.fn() }
vi.stubGlobal('useToast', () => __toast)

const __navigateTo = vi.fn()
vi.stubGlobal('navigateTo', __navigateTo)

const __useRouter = vi.fn()
vi.stubGlobal('useRouter', __useRouter)

const __useRoute = vi.fn()
vi.stubGlobal('useRoute', __useRoute)

// Stub useState (persisting per key)
const __stateMap = new Map<string, any>()
vi.stubGlobal('useState', (key: string, init?: () => any) => {
	if (__stateMap.has(key)) return __stateMap.get(key)
	const r = ref(typeof init === 'function' ? init() : init)
	__stateMap.set(key, r)
	return r
})

vi.stubGlobal('defineStore', (name: string, setup: Function) => {
	const store = setup()
	return () => store
})

// Stub storeToRefs (return only refs from a store object)
vi.stubGlobal('storeToRefs', (store: Record<string, any>) => {
	const out: Record<string, any> = {}
	for (const k of Object.keys(store)) {
		const v = store[k]
		if (v && typeof v === 'object' && 'value' in v) out[k] = v
	}
	return out
})

vi.stubGlobal('defineNuxtRouteMiddleware', (fn: any) => fn)

// Minimal stub for user store used by composables (shared instance)
const __userStore = {
	user: ref({ email: '', fullname: '', isVerified: false, username: '' }),
	isLoggedIn: ref(false),
	handleClearUser: vi.fn(),
	getUserProfile: vi.fn(),
	editUserProfile: vi.fn(),
	deleteUserAccount: vi.fn(),
}
vi.stubGlobal('useUserStore', () => __userStore)

// Stub createError to avoid undefined when error paths are exercised
vi.stubGlobal(
	'createError',
	(opts: any) => new Error(`${opts?.statusCode ?? ''} ${opts?.statusMessage ?? ''}`)
)

// Lightweight useFetch that plays well with MSW
vi.stubGlobal('useFetch', async (url: string, opts: any = {}) => {
	const options = {
		method: 'get',
		headers: new Headers(),
		body: undefined,
		onRequest: undefined,
		onResponseError: undefined,
		...opts,
	}

	// allow composable to set headers etc.
	if (typeof options.onRequest === 'function') {
		await options.onRequest({ options })
	}

	const init: RequestInit = {
		method: String(options.method || 'GET').toUpperCase(),
		headers: options.headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	}

	const res = await fetch(url, init)
	const data = ref<any>(null)
	const error = ref<any>(null)

	if (!res.ok) {
		let body: any = null
		try {
			body = await res.json()
		} catch {
			body = null
		}
		const responseLike = {
			status: res.status,
			statusText: res.statusText,
			_data: body,
		}
		if (typeof options.onResponseError === 'function') {
			await options.onResponseError({ response: responseLike })
		}
		error.value = responseLike
	} else {
		try {
			data.value = await res.json()
		} catch {
			data.value = null
		}
	}

	return { data, error }
})

// MSW server bootstrapping
const server = setupServer(...handlers)
vi.stubGlobal('mswServer', server)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


// Nitro/h3 helper stubs for server route unit tests
vi.stubGlobal('defineEventHandler', (fn: any) => fn)
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ apiBaseUrl: 'https://api.example' })))
vi.stubGlobal('proxyRequest', vi.fn())
vi.stubGlobal('getRequestHeader', vi.fn())
vi.stubGlobal('getRouterParam', vi.fn())
vi.stubGlobal('getQuery', vi.fn())
