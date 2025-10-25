import { vi } from 'vitest'
// Avoid importing from 'nuxt/app'; rely on globals stubbed in vitest.setup
import { createRouter, createWebHistory } from 'vue-router'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useUserStore } from '@/stores/user'

// Use global stubbed useToast from vitest.setup instead of importing from '@nuxt/ui'
declare const useToast: () => any
// Globals provided via vitest.setup
declare const navigateTo: any
declare const useRouter: () => any

// Import stubs locally so they can be referenced below
import {
	UButtonStub,
	UFormStub,
	UFormGroupStub,
	UInputStub,
	UTextareaStub,
	UCheckboxStub,
	UIconStub,
	UProgressStub,
	UModalStub,
	UCardStub,
	AppLogoStub,
	UContainerStub,
	UDropdownStub,
} from '~/tests/helpers/uiStubs'
// Re-export for convenience
export {
	UButtonStub,
	UFormStub,
	UFormGroupStub,
	UInputStub,
	UTextareaStub,
	UCheckboxStub,
	UIconStub,
	UProgressStub,
	UModalStub,
	UCardStub,
	AppLogoStub,
	UContainerStub,
	UDropdownStub,
}

export const commonStubs = {
	UContainer: UContainerStub,
	UForm: UFormStub,
	UFormGroup: UFormGroupStub,
	UInput: UInputStub,
	UButton: UButtonStub,
	UTextarea: UTextareaStub,
	UCheckbox: UCheckboxStub,
	UIcon: UIconStub,
	UProgress: UProgressStub,
	UDropdown: UDropdownStub,
	AppLogo: AppLogoStub,
}

export function resetToast() {
	const toast = useToast()
	if (toast?.add && typeof (toast.add as any).mockReset === 'function') {
		;(toast.add as any).mockReset()
	}
}

export function getToast() {
	return useToast()
}

export function resetNavigateTo() {
	const mocked = vi.mocked(navigateTo as any)
	mocked.mockReset()
}

export function resetRouterPush() {
	const router = useRouter()
	const mocked = vi.mocked(router.push as any)
	mocked.mockReset()
	return router
}

export function resetUserStore() {
	const store = useUserStore()
	store.handleClearUser()
	return store
}

export function createTestRouter(routes: Array<{ path: string; component: any }>) {
	const router = createRouter({ history: createWebHistory(), routes })
	return router
}

export function bindRouterMocks(router: any) {
	const useRouterMock = (globalThis as any).useRouter
	if (useRouterMock && typeof useRouterMock.mockReturnValue === 'function') {
		useRouterMock.mockReturnValue(router)
	}
	const useRouteMock = (globalThis as any).useRoute
	if (useRouteMock && typeof useRouteMock.mockReturnValue === 'function') {
		useRouteMock.mockReturnValue(router.currentRoute.value)
	}
}

export async function mountRouterView(
	route: string,
	routes: Array<{ path: string; component: any }>,
	components: Record<string, any> = {},
	stubs: Record<string, any> = {}
) {
	const router = createTestRouter(routes)
	router.push(route)
	await router.isReady()

	bindRouterMocks(router)

	const wrapper = mount(
		{ template: '<Suspense><router-view /></Suspense>' },
		{
			global: {
				plugins: [router],
				stubs: { Suspense: false, ...stubs },
				components,
			},
		}
	)

	await flushPromises()
	await nextTick()

	return wrapper
}

export async function mountWithRouter(
	component: any,
	options: {
		routes: Array<{ path: string; component: any }>
		startPath: string
		stubs?: Record<string, any>
		components?: Record<string, any>
	}
) {
	const router = createTestRouter(options.routes)
	router.push(options.startPath)
	await router.isReady()

	bindRouterMocks(router)

	const wrapper = mount(component, {
		global: {
			plugins: [router],
			stubs: { ...(options.stubs || {}) },
			components: options.components || {},
		},
	})

	await flushPromises()
	await nextTick()

	return wrapper
}
