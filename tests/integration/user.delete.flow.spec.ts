import { nextTick, ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import UserDelete from '~/components/User/Delete.vue'
import { sampleUser } from '../mocks/data'

// Globals
declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useRouter: ReturnType<typeof vi.fn>
declare const useRoute: ReturnType<typeof vi.fn>
declare const useToast: () => any

 type RouterLike = ReturnType<typeof createRouter>

 let realUseUserStore: any

const stubs = {
  UCard: { template: '<div data-test="card"><slot /></div>' },
  UButton: {
    props: ['icon', 'loading', 'disabled', 'type', 'variant', 'color'],
    template: `<button data-test="btn" :type="type || 'button'" :data-icon="icon" :data-loading="loading" :data-disabled="disabled" @click="$emit('click', $event)"><slot /></button>`,
  },
  UModal: {
    name: 'UModal',
    props: ['modelValue', 'preventClose'],
    emits: ['update:modelValue'],
    template: `<div v-if="modelValue" data-test="modal"><slot /></div>`,
  },
}

const createTestRouter = (): RouterLike => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/profile', component: { template: '<div>Profile</div>' } },
    ],
  })
  return router
}

describe('👤 User Delete Account integration flow', () => {
  beforeEach(async () => {
    const mod = await import('@/stores/user')
    realUseUserStore = mod.useUserStore
    vi.stubGlobal('useUserStore', realUseUserStore)

    useToast().add.mockReset()
    vi.stubGlobal('useHead', vi.fn((arg: any) => (typeof arg === 'function' ? arg() : arg)))

    const store = realUseUserStore()
    store.user.value = { ...sampleUser }
    store.isLoggedIn.value = true
  })

  it('deletes account successfully; toast shown; user cleared; navigates home; modal closes', async () => {
    const router = createTestRouter()
    router.push('/profile')
    await router.isReady()

    // Bind router composables used in component
    const useRouterMock = useRouter as ReturnType<typeof vi.fn>
    useRouterMock.mockReturnValue(router)
    const useRouteMock = useRoute as ReturnType<typeof vi.fn>
    useRouteMock.mockReturnValue(router.currentRoute.value)

    const app = mount(UserDelete, {
      global: {
        plugins: [router],
        stubs,
      },
    })

    ;(app.vm as any).handleOpenModal(true)
    await nextTick()

    const modal = app.find('[data-test="modal"]')
    expect(modal.exists()).toBe(true)

    await (app.vm as any).handleDeleteAccount()
    await flushPromises()

    // Toast from component
    expect(useToast().add).toHaveBeenCalled()
    const [payload] = useToast().add.mock.calls[0]
    expect(payload.title).toBe('Delete Account')

    // User cleared
    const store = realUseUserStore()
    expect(store.user.value.email).toBe('')
    expect(store.user.value.username).toBe('')
    expect(store.user.value.fullname).toBe('')
    expect(store.isLoggedIn.value).toBe(false)

    // Navigated home
    expect(router.currentRoute.value.path).toBe('/')

    // Modal closed
    expect(app.find('[data-test="modal"]').exists()).toBe(false)
  })

  it('delete account server error (500); error toast; user unchanged; stays on route; modal closes', async () => {
    mswServer.use(
      http.delete('/api/user', async () =>
        HttpResponse.json({ message: 'Server broke' }, { status: 500 })
      )
    )

    const router = createTestRouter()
    router.push('/profile')
    await router.isReady()

    // Bind router composables used in component
    const useRouterMock = useRouter as ReturnType<typeof vi.fn>
    useRouterMock.mockReturnValue(router)
    const useRouteMock = useRoute as ReturnType<typeof vi.fn>
    useRouteMock.mockReturnValue(router.currentRoute.value)

    const app = mount(UserDelete, {
      global: {
        plugins: [router],
        stubs,
      },
    })

    ;(app.vm as any).handleOpenModal(true)
    await nextTick()

    const modal = app.find('[data-test="modal"]')
    expect(modal.exists()).toBe(true)

    await (app.vm as any).handleDeleteAccount()
    await flushPromises()

    // Interceptor toast
    expect(useToast().add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Server error' })
    )

    // User unchanged
    const store = realUseUserStore()
    expect(store.user.value).toEqual(sampleUser)
    expect(store.isLoggedIn.value).toBe(true)

    // Stays on profile
    expect(router.currentRoute.value.path).toBe('/profile')

    // Modal closed
    expect(app.find('[data-test="modal"]').exists()).toBe(false)
  })

  it('cancel closes modal; no toast; user unchanged; stays on route', async () => {
    const router = createTestRouter()
    router.push('/profile')
    await router.isReady()

    const useRouterMock = useRouter as ReturnType<typeof vi.fn>
    useRouterMock.mockReturnValue(router)
    const useRouteMock = useRoute as ReturnType<typeof vi.fn>
    useRouteMock.mockReturnValue(router.currentRoute.value)

    const app = mount(UserDelete, {
      global: { plugins: [router], stubs },
    })

    ;(app.vm as any).handleOpenModal(true)
    await nextTick()

    const modal = app.find('[data-test="modal"]')
    expect(modal.exists()).toBe(true)

    const cancelBtn = app.findAll('[data-test="btn"]').find((b) => b.text() === 'Cancel')!
    await cancelBtn.trigger('click')

    expect(useToast().add).not.toHaveBeenCalled()

    const store = realUseUserStore()
    expect(store.user.value).toEqual(sampleUser)
    expect(store.isLoggedIn.value).toBe(true)

    expect(router.currentRoute.value.path).toBe('/profile')
    expect(app.find('[data-test="modal"]').exists()).toBe(false)
  })

  it('guard prevents delete when already loading; modal stays open', async () => {
    const router = createTestRouter()
    router.push('/profile')
    await router.isReady()

    const useRouterMock = useRouter as ReturnType<typeof vi.fn>
    useRouterMock.mockReturnValue(router)
    const useRouteMock = useRoute as ReturnType<typeof vi.fn>
    useRouteMock.mockReturnValue(router.currentRoute.value)

    const app = mount(UserDelete, {
      global: { plugins: [router], stubs },
    })

    ;(app.vm as any).handleOpenModal(true)
    await nextTick()

    ;(app.vm as any).isLoadingDelete = true
    await nextTick()

    await (app.vm as any).handleDeleteAccount()
    await flushPromises()
    await nextTick()

    expect(useToast().add).not.toHaveBeenCalled()

    const store = realUseUserStore()
    expect(store.user.value).toEqual(sampleUser)
    expect(store.isLoggedIn.value).toBe(true)

    expect(router.currentRoute.value.path).toBe('/profile')
    expect(app.find('[data-test="modal"]').exists()).toBe(true)
  })

  it('v-model setter updates isOpen when modal emits update', async () => {
    const router = createTestRouter()
    router.push('/profile')
    await router.isReady()

    const useRouterMock = useRouter as ReturnType<typeof vi.fn>
    useRouterMock.mockReturnValue(router)
    const useRouteMock = useRoute as ReturnType<typeof vi.fn>
    useRouteMock.mockReturnValue(router.currentRoute.value)

    const app = mount(UserDelete, {
      global: { plugins: [router], stubs },
    })

    ;(app.vm as any).handleOpenModal(true)
    await nextTick()

    const modalComp = app.findComponent({ name: 'UModal' })
    expect(modalComp.exists()).toBe(true)

    modalComp.vm.$emit('update:modelValue', false)
    await nextTick()

    expect((app.vm as any).isOpen).toBe(false)
    expect(app.find('[data-test="modal"]').exists()).toBe(false)
  })
})
