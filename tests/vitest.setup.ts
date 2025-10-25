// Shared Vitest setup: stubs common Nuxt globals and boots MSW.
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { ref } from 'vue'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import { config } from '@vue/test-utils'

// Global UI component stubs to resolve common components and reduce warnings
config.global.stubs = {
	UContainer: { name: 'UContainer', template: '<div data-test="container"><slot /></div>' },
	UButton: {
		name: 'UButton',
		template: '<button data-test="btn" @click="$emit(\'click\', $event)"><slot /></button>',
	},
	UForm: {
		name: 'UForm',
		template: '<form data-test="form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
	},
	UFormGroup: { name: 'UFormGroup', template: '<div data-test="group"><slot /></div>' },
	UInput: {
		name: 'UInput',
		inheritAttrs: false,
		template:
			'<input data-test="input" @input="$emit(\'update:modelValue\', $event && $event.target ? $event.target.value : \'\')" />',
	},
	UTextarea: {
		name: 'UTextarea',
		inheritAttrs: false,
		template:
			'<textarea data-test="textarea" @input="$emit(\'update:modelValue\', $event && $event.target ? $event.target.value : \'\')"></textarea>',
	},
	UIcon: { name: 'UIcon', template: '<span data-test="icon"><slot /></span>' },
	UProgress: { name: 'UProgress', template: '<div data-test="progress" />' },
	UDropdown: { name: 'UDropdown', template: '<div data-test="dropdown"><slot /></div>' },
	UModal: { name: 'UModal', template: '<div data-test="modal"><slot /></div>' },
	UCard: { name: 'UCard', template: '<div data-test="card"><slot /></div>' },
	UCheckbox: {
		name: 'UCheckbox',
		template:
			'<input type="checkbox" data-test="checkbox" @change="$emit(\'update:modelValue\', $event && $event.target ? !!$event.target.checked : false)" />',
	},
	AppLogo: { name: 'AppLogo', template: '<div data-test="logo"></div>' },
}

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

// Stub definePageMeta so page SFCs can be imported and assertions can be made
const __definePageMeta = vi.fn((meta: any) => meta)
vi.stubGlobal('definePageMeta', __definePageMeta)

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
vi.stubGlobal(
	'useRuntimeConfig',
	vi.fn(() => ({ apiBaseUrl: 'https://api.example' }))
)
vi.stubGlobal('proxyRequest', vi.fn())
vi.stubGlobal('getRequestHeader', vi.fn())
vi.stubGlobal('getRouterParam', vi.fn())
vi.stubGlobal('getQuery', vi.fn())

// Stub defineNuxtPlugin for plugin tests
vi.stubGlobal('defineNuxtPlugin', (fn: any) => fn)

// Persisting useCookie stub (so multiple calls share the same ref per name)
const __cookieMap = new Map<string, any>()
vi.stubGlobal('useCookie', (name: string) => {
	if (__cookieMap.has(name)) return __cookieMap.get(name)
	const r = ref<any>(undefined)
	__cookieMap.set(name, r)
	return r
})
