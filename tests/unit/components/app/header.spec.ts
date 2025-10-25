import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Header from '~/components/App/Header.vue'

declare const useUserStore: () => any

// Mock @vueuse/core's useTemplateRef to return writable refs
vi.mock('@vueuse/core', () => ({
	useTemplateRef: () => ref(null),
}))

import {
	UContainerStub,
	UButtonStub,
	UDropdownStub,
	createAppCreateDialogStub,
} from '~/tests/helpers/uiStubs'

describe('App/Header.vue', () => {
	let editSpy: ReturnType<typeof vi.fn>
	let logoutSpy: ReturnType<typeof vi.fn>
	let deleteSpy: ReturnType<typeof vi.fn>
	let AppCreateDialogStub: any

	beforeEach(() => {
		editSpy = vi.fn()
		logoutSpy = vi.fn()
		deleteSpy = vi.fn()
		AppCreateDialogStub = createAppCreateDialogStub(editSpy, 'edit-dialog')
		const store = useUserStore()
		store.user.value.fullname = 'John Doe'
	})

	const UserLogoutStub = {
		name: 'UserLogout',
		template: '<div data-test="logout-dialog"></div>',
		setup() {
			return {
				handleOpenModal: (payload: boolean) => logoutSpy(payload),
			}
		},
	}

	const UserDeleteStub = {
		name: 'UserDelete',
		template: '<div data-test="delete-dialog"></div>',
		setup() {
			return {
				handleOpenModal: (payload: boolean) => deleteSpy(payload),
			}
		},
	}

	const UserEditProfileStub = {
		name: 'UserEditProfile',
		template: '<div data-test="edit-profile"></div>',
	}

	it('greets with first name and triggers all actions (positive)', () => {
		const wrapper = mount(Header, {
			global: {
				stubs: {
					UContainer: UContainerStub,
					UButton: UButtonStub,
					UDropdown: UDropdownStub,
					AppCreateDialog: AppCreateDialogStub,
					UserLogout: UserLogoutStub,
					UserDelete: UserDeleteStub,
					UserEditProfile: UserEditProfileStub,
				},
			},
		})

		expect(wrapper.text()).toContain('Hello John')

		const dropdown = wrapper.findComponent({ name: 'UDropdown' })
		const items: any[] = dropdown.props('items')
		items[0][0].click()
		items[1][0].click()
		items[2][0].click()

		expect(editSpy).toHaveBeenCalledWith(true)
		expect(logoutSpy).toHaveBeenCalledWith(true)
		expect(deleteSpy).toHaveBeenCalledWith(true)
	})

	it('logout action only triggers logout modal (negative)', () => {
		const wrapper = mount(Header, {
			global: {
				stubs: {
					UContainer: UContainerStub,
					UButton: UButtonStub,
					UDropdown: UDropdownStub,
					AppCreateDialog: AppCreateDialogStub,
					UserLogout: UserLogoutStub,
					UserDelete: UserDeleteStub,
					UserEditProfile: UserEditProfileStub,
				},
			},
		})

		const dropdown = wrapper.findComponent({ name: 'UDropdown' })
		const items: any[] = dropdown.props('items')
		items[1][0].click()

		expect(logoutSpy).toHaveBeenCalledTimes(1)
		expect(editSpy).not.toHaveBeenCalled()
		expect(deleteSpy).not.toHaveBeenCalled()
	})
})
