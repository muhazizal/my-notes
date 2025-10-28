import { nextTick } from 'vue'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import SignInPage from '~/pages/sign-in.vue'
import NotesIndexPage from '~/pages/notes/index.vue'
import ForgotPasswordPage from '~/pages/forgot-password.vue'
import Login from '~/components/Login/Index.vue'
import ForgotPassword from '~/components/ForgotPassword/Index.vue'

import NotesIndex from '~/components/Notes/Index.vue'
import NotesDetail from '~/components/Notes/Detail.vue'
import NotesList from '~/components/Notes/List.vue'
import NotesItem from '~/components/Notes/Item.vue'
import NotesCreate from '~/components/Notes/Create.vue'

import {
  AppLogoStub,
  UContainerStub,
  UButtonStub,
  UFormStub,
  UFormGroupStub,
  UInputStub,
  UTextareaStub,
  UIconStub,
} from '~/tests/helpers/uiStubs'

declare const useToast: () => any
// Declare Nuxt composables used in tests
declare const useRouter: () => any
declare const useRoute: () => any

type RouterLike = ReturnType<typeof createRouter>

// Shared UI stubs for integration (from helpers)
const stubs = {
  AppLogo: AppLogoStub,
  UContainer: UContainerStub,
  UButton: UButtonStub,
  UForm: UFormStub,
  UFormGroup: UFormGroupStub,
  UInput: UInputStub,
  UTextarea: UTextareaStub,
  UIcon: UIconStub,
}

// More conservative stubs for ForgotPassword (mirror unit test)
const forgotStubs = {
  UButton: UButtonStub,
  UForm: UFormStub,
  UFormGroup: UFormGroupStub,
  UInput: UInputStub,
  AppLogo: AppLogoStub,
}

// Use shared test utils for router and mounting
import { mountRouterView, mountWithRouter, commonStubs } from '~/tests/helpers/testUtils'

const routes = [
  { path: '/sign-in', component: SignInPage },
  { path: '/notes', component: NotesIndexPage },
  { path: '/forgot-password', component: ForgotPasswordPage },
]

describe('🔐 Auth integration (Nuxt + MSW)', () => {
  beforeEach(() => {
    useToast().add.mockReset()
  })

  it('login → redirects to /notes and renders list', async () => {
    const app = await mountRouterView(
      '/sign-in',
      routes,
      { Notes: NotesIndex, NotesIndex, NotesDetail, NotesList, NotesItem, NotesCreate, Login, ForgotPassword },
      { ...commonStubs, ...stubs }
    )

    const inputs = app.findAll('[data-test="input"]')
    expect(inputs.length).toBeGreaterThanOrEqual(2)

    await inputs[0].setValue('test@example.com')
    await inputs[1].setValue('password123')

    const formComp = app.findComponent({ name: 'UForm' })
    expect(formComp.exists()).toBe(true)
    formComp.vm.$emit('submit')

    await flushPromises()
    await nextTick()

    expect(useToast().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Login',
        description: expect.stringContaining('Success login user'),
      })
    )

    const router = (app.vm as any).$router
    expect(router.currentRoute.value.path).toBe('/notes')

    const items = app.findAll('.item')
    expect(items.length).toBeGreaterThan(0)
  })

  it('forgot-password → submits shows toast and success caption', async () => {
    const comp = await mountWithRouter(ForgotPassword, {
      routes,
      startPath: '/forgot-password',
      stubs: forgotStubs,
    })

    const emailInput = comp.find('[data-test="input"]')
    await emailInput.setValue('user@example.com')

    const formComp = comp.findComponent({ name: 'UForm' })
    expect(formComp.exists()).toBe(true)
    formComp.vm.$emit('submit')

    await flushPromises()
    await nextTick()

    expect(useToast().add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Forgot Password',
        description: expect.stringContaining('Success forgot password'),
      })
    )

    // Success caption is shown
    expect(comp.text()).toContain('Success to send reset password URL, please check your email.')
    // Sign in link should not be visible after success
    const signInBtnNow = comp.findAll('[data-test="btn"]').find((b) => b.text() === 'Sign in')
    expect(!!signInBtnNow).toBe(false)
  })

  it('forgot-password → "Sign in" link navigates to /sign-in', async () => {
    // Stub router and assert replace is called, avoid real navigation unmount
    const replaceSpy = vi.fn()
    const useRouterMock = useRouter as ReturnType<typeof vi.fn>
    useRouterMock.mockReturnValue({ replace: replaceSpy })

    const comp = mount(ForgotPassword, { global: { stubs: forgotStubs } })

    // Prefer component-level lookup to avoid markup differences
    const buttons = comp.findAllComponents({ name: 'UButton' })
    const signInBtnComp = buttons.find((b) => b.text() === 'Sign in')
    expect(signInBtnComp).toBeTruthy()
    ;(signInBtnComp as any).vm.$emit('click')

    expect(replaceSpy).toHaveBeenCalledWith('/sign-in')
  })
})
