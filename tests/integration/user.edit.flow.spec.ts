import { nextTick, ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithRouter } from '~/tests/helpers/testUtils'
import { http, HttpResponse } from 'msw'

import UserEditProfile from '~/components/User/EditProfile.vue'
import { sampleUser } from '@/tests/helpers/data'

// MSW and Nuxt globals from setup
declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useToast: () => any

// Real store: use actual implementation for API calls
let realUseUserStore: any

// Local UI stubs (kept minimal and deterministic)
const stubs = {
	UCard: { template: '<div data-test="card"><slot /></div>' },
	UButton: {
		props: ['icon', 'loading', 'disabled', 'type', 'variant', 'color'],
		template: `<button data-test="btn" :type="type || 'button'" :data-icon="icon" :data-loading="loading" :data-disabled="disabled" @click="$emit('click', $event)"><slot /></button>`,
	},
	UForm: { template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>` },
	UFormGroup: { template: `<div data-test="group"><slot /></div>` },
	UInput: {
		props: ['modelValue', 'placeholder', 'size', 'class', 'type'],
		emits: ['update:modelValue', 'keypress'],
		inheritAttrs: false,
		template: `<input data-test="input" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event && $event.target ? $event.target.value : '')" @keypress="$emit('keypress', $event)" />`,
	},
	UModal: {
		name: 'UModal',
		props: ['modelValue', 'preventClose'],
		emits: ['update:modelValue'],
		template: `<div v-if="modelValue" data-test="modal"><slot /></div>`,
	},
	AppCreateDialog: {
		name: 'AppCreateDialog',
		props: ['title'],
		setup(_: any, { expose }: any) {
			const isOpen = ref(true)
			const onOpenModal = (open?: boolean) => {
				isOpen.value = !!open
			}
			const handleOpenModal = (open?: boolean) => {
				isOpen.value = !!open
			}
			expose({ handleOpenModal })
			return { isOpen, onOpenModal }
		},
		template: `<div v-if="isOpen" data-test="create-dialog"><slot name="body" :onOpenModal="onOpenModal" /></div>`,
	},
}

const routes = [
	{ path: '/', component: { template: '<div>Home</div>' } },
	{ path: '/profile', component: { template: '<div>Profile</div>' } },
]

const mountEditFlow = async (route: string) => {
	const Root = {
		components: { UserEditProfile },
		template:
			'<div><AppCreateDialog title="Edit Profile"><template #body="{ onOpenModal }"><UserEditProfile @on-open-modal="onOpenModal" /></template></AppCreateDialog><router-view /></div>',
	}

	const wrapper = await mountWithRouter(Root as any, {
		routes,
		startPath: route,
		stubs,
	})

	await flushPromises()
	await nextTick()

	return wrapper
}

describe('👤 User Edit Profile integration flow', () => {
	beforeEach(async () => {
		// Use real store implementation for API calls
		const mod = await import('@/stores/user')
		realUseUserStore = mod.useUserStore
		vi.stubGlobal('useUserStore', realUseUserStore)

		// Fresh toast
		useToast().add.mockReset()

		// Stub useHead to avoid Nuxt warnings
		vi.stubGlobal(
			'useHead',
			vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg))
		)

		// Seed user
		const store = realUseUserStore()
		store.user.value = { ...sampleUser }
		store.isLoggedIn.value = true
	})

	it('updates profile successfully and shows toast; store changes; modal closes', async () => {
		const app = await mountEditFlow('/profile')

		// Modal open
		expect(app.find('[data-test="create-dialog"]').exists()).toBe(true)

		// Fill form
		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(3)
		await inputs[0].setValue('Jane Tester')
		await inputs[1].setValue('janet')
		await inputs[2].setValue('jane@test.com')

		// Submit
		await app.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await nextTick()

		// Toast fired
		expect(useToast().add).toHaveBeenCalled()
		const [payload] = useToast().add.mock.calls[0]
		expect(payload.title).toBe('Edit Profile')

		// Store updated
		const store = realUseUserStore()
		expect(store.user.value.fullname).toBe('Jane Tester')
		expect(store.user.value.username).toBe('janet')
		expect(store.user.value.email).toBe('jane@test.com')

		// Modal closed
		expect(app.find('[data-test="create-dialog"]').exists()).toBe(false)

		// Router unchanged (no navigation in edit)
		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/profile')
	})

	it('edit validation error (422) toasts; store unchanged; modal closes', async () => {
		mswServer.use(
			http.put('/api/user/profile', async () =>
				HttpResponse.json({ message: 'Invalid fields' }, { status: 422 })
			)
		)

		const app = await mountEditFlow('/profile')

		expect(app.find('[data-test="create-dialog"]').exists()).toBe(true)

		const inputs = app.findAll('[data-test="input"]')
		await inputs[0].setValue('Bad Name')
		await inputs[1].setValue('baduser')
		await inputs[2].setValue('bad@example.com')

		await app.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await nextTick()

		// Toast from interceptor
		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		// Store unchanged
		const store = realUseUserStore()
		expect(store.user.value).toEqual(sampleUser)

		// Modal closed (component always closes on submit)
		expect(app.find('[data-test="create-dialog"]').exists()).toBe(false)

		// Path unchanged
		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/profile')
	})
})
