import { vi } from 'vitest'
import { navigateTo, useRouter } from 'nuxt/app'
// Use global stubbed useToast from vitest.setup instead of importing from '@nuxt/ui'
declare const useToast: () => any
import { useUserStore } from '@/stores/user'

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
