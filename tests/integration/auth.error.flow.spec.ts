import { nextTick } from 'vue'

import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'

import SignInPage from '~/pages/sign-in.vue'
import NotesIndexPage from '~/pages/notes/index.vue'
import ForgotPasswordPage from '~/pages/forgot-password.vue'
import Login from '~/components/Login/Index.vue'
import ForgotPassword from '~/components/ForgotPassword/Index.vue'

declare const useToast: () => any
declare const mswServer: any

import { mountRouterView, mountWithRouter, commonStubs } from '~/tests/helpers/testUtils'

const routes = [
	{ path: '/sign-in', component: SignInPage },
	{ path: '/notes', component: NotesIndexPage },
	{ path: '/forgot-password', component: ForgotPasswordPage },
]

describe('🔐 Auth integration errors (Nuxt + MSW)', () => {
	beforeEach(() => {
		useToast().add.mockReset()
	})

	it('login → invalid credentials shows validation error and stays on /sign-in', async () => {
		// Override login endpoint to return 422
		mswServer.use(
			http.post('/api/auth/login', async () => {
				return HttpResponse.json({ message: 'Invalid email or password' }, { status: 422 })
			})
		)

		const app = await mountRouterView('/sign-in', routes, { Login, ForgotPassword }, commonStubs)

		const inputs = app.findAll('[data-test="input"]')
		expect(inputs.length).toBeGreaterThanOrEqual(2)

		await inputs[0].setValue('bad@example.com')
		await inputs[1].setValue('wrong')

		await app.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		const router = (app.vm as any).$router
		expect(router.currentRoute.value.path).toBe('/sign-in')
	})

	it('forgot-password → server validation error shows toast and no success caption', async () => {
		// Override forgot-password endpoint to return 422
		mswServer.use(
			http.post('/api/auth/forgot-password', async () => {
				return HttpResponse.json({ message: 'Email not found' }, { status: 422 })
			})
		)

		const comp = await mountWithRouter(ForgotPassword, {
			routes,
			startPath: '/forgot-password',
			stubs: commonStubs,
		})

		const emailInput = comp.find('[data-test="input"]')
		await emailInput.setValue('missing@example.com')

		await comp.find('[data-test="form"]').trigger('submit')
		await flushPromises()
		await nextTick()

		expect(useToast().add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Validation error' })
		)

		// Check success caption is not shown
		expect(comp.text()).not.toContain(
			'Success to send reset password URL, please check your email.'
		)
	})
})
