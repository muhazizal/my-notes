import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Header from '~/components/App/Header.vue'

declare const useUserStore: () => any

// Mock @vueuse/core's useTemplateRef to return writable refs
vi.mock('@vueuse/core', () => ({
	useTemplateRef: () => ref(null),
}))

const UContainerStub = {
	name: 'UContainer',
	template: '<div data-test="container"><slot /></div>',
}
const UButtonStub = {
	name: 'UButton',
	template: '<button data-test="btn"><slot /></button>',
}
const makeDropdownStub = () => ({
	name: 'UDropdown',
	props: {
		items: { type: Array, default: () => [] },
		popper: { type: Object, default: () => ({}) },
	},
	template: `
    <div data-test="dropdown">
      <div data-test="trigger"><slot /></div>
      <ul>
        <template v-for="(grp, gi) in items">
          <li v-for="(item, ii) in grp" :key="gi+'-'+ii">
            <button
              :data-test="'action-'+String(item.label).toLowerCase().replace(/\\s+/g,'-')"
              @click="item.click && item.click()"
            >{{ item.label }}</button>
          </li>
        </template>
      </ul>
    </div>
  `,
})

describe('App/Header.vue', () => {
	let editSpy: ReturnType<typeof vi.fn>
	let logoutSpy: ReturnType<typeof vi.fn>
	let deleteSpy: ReturnType<typeof vi.fn>

	beforeEach(() => {
		editSpy = vi.fn()
		logoutSpy = vi.fn()
		deleteSpy = vi.fn()
		const store = useUserStore()
		store.user.value.fullname = 'John Doe'
	})

	const AppCreateDialogStub = {
		name: 'AppCreateDialog',
		props: { title: { type: String, default: '' } },
		template: '<div data-test="edit-dialog"></div>',
		setup() {
			return {
				handleOpenModal: (payload: boolean) => editSpy(payload),
			}
		},
	}

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
					UDropdown: makeDropdownStub(),
					AppCreateDialog: AppCreateDialogStub,
					UserLogout: UserLogoutStub,
					UserDelete: UserDeleteStub,
					UserEditProfile: UserEditProfileStub,
				},
			},
		})

		expect(wrapper.text()).toContain('Hello John')

		wrapper.find('[data-test="action-edit-profile"]').trigger('click')
		wrapper.find('[data-test="action-logout"]').trigger('click')
		wrapper.find('[data-test="action-delete-account"]').trigger('click')

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
					UDropdown: makeDropdownStub(),
					AppCreateDialog: AppCreateDialogStub,
					UserLogout: UserLogoutStub,
					UserDelete: UserDeleteStub,
					UserEditProfile: UserEditProfileStub,
				},
			},
		})

		wrapper.find('[data-test="action-logout"]').trigger('click')

		expect(logoutSpy).toHaveBeenCalledTimes(1)
		expect(editSpy).not.toHaveBeenCalled()
		expect(deleteSpy).not.toHaveBeenCalled()
	})
})
