import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useAuth } from '@/composables/api/useAuth'

declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useUserStore: () => any

describe('useAuth', () => {
	beforeEach(() => {
		// Reset shared store state/spies
		const userStore = useUserStore()
		userStore.user.value = { email: '', fullname: '', isVerified: false, username: '' }
		userStore.isLoggedIn.value = false
		userStore.handleClearUser.mockClear()
	})

	describe('login', () => {
		const userStore = useUserStore()

		it('succeeds and sets isLoggedIn', async () => {
			const { login, isLoadingLogin } = useAuth()
			expect(isLoadingLogin.value).toBe(false)

			const res = await login({ email: 'a@b.com', password: 'secret' })

			expect(isLoadingLogin.value).toBe(false)
			expect(userStore.isLoggedIn.value).toBe(true)
			expect(res && res.code).toBe(200)
			expect(res && res.message).toBe('Success login user')
		})

		it('fails and clears user', async () => {
			mswServer.use(
				http.post('/api/auth/login', async () => {
					return HttpResponse.json(
						{ message: 'Invalid credentials' },
						{ status: 401, statusText: 'Unauthorized' }
					)
				})
			)

			const { login, isLoadingLogin } = useAuth()
			const res = await login({ email: 'a@b.com', password: 'wrong' })

			expect(isLoadingLogin.value).toBe(false)
			expect(res).toBe(false)
			expect(userStore.isLoggedIn.value).toBe(false)
		})
	})

	describe('logout', () => {
		it('succeeds and returns API result', async () => {
			const { logout } = useAuth()
			const res = await logout()
			expect(res.data.value?.code).toBe(200)
			expect(res.data.value?.message).toBe('Success logout user')
			expect(res.error.value).toBeNull || expect(res.error.value).toBeUndefined
		})

		it('fails with server error', async () => {
			mswServer.use(
				http.post('/api/auth/logout', async () => {
					return HttpResponse.json(
						{ message: 'Server error' },
						{ status: 500, statusText: 'Internal Server Error' }
					)
				})
			)
			const { logout } = useAuth()
			const res = await logout()
			expect(res.error.value?.status).toBe(500)
			expect(res.data.value).toBeNull || expect(res.data.value).toBeUndefined
		})
	})

	describe('register', () => {
		it('succeeds with 201', async () => {
			const { register, isLoadingRegister } = useAuth()
			const res = await register({
				email: 'new@user.com',
				fullname: 'New User',
				password: 'pass',
				username: 'newbie',
			})
			expect(isLoadingRegister.value).toBe(false)
			expect(res && res.code).toBe(201)
			expect(res && res.message).toBe('Success register user, please verify your email')
		})

		it('fails with 409 conflict', async () => {
			mswServer.use(
				http.put('/api/auth/register', async () => {
					return HttpResponse.json(
						{ message: 'Email already exists' },
						{ status: 409, statusText: 'Conflict' }
					)
				})
			)
			const { register } = useAuth()
			const res = await register({
				email: 'new@user.com',
				fullname: 'New User',
				password: 'pass',
				username: 'newbie',
			})
			expect(res).toBe(false)
		})
	})

	describe('forgotPassword', () => {
		it('succeeds', async () => {
			const { forgotPassword, isLoadingForgotPassword } = useAuth()
			const res = await forgotPassword({ email: 'a@b.com' })
			expect(isLoadingForgotPassword.value).toBe(false)
			expect(res && res.code).toBe(200)
			expect(res && res.message).toBe('Success forgot password, please check your email')
		})

		it('fails with 400', async () => {
			mswServer.use(
				http.post('/api/auth/forgot-password', async () => {
					return HttpResponse.json(
						{ message: 'Invalid email' },
						{ status: 400, statusText: 'Bad Request' }
					)
				})
			)
			const { forgotPassword } = useAuth()
			const res = await forgotPassword({ email: 'invalid' })
			expect(res).toBe(false)
		})
	})

	describe('resetPassword', () => {
		it('succeeds using route token', async () => {
			vi.stubGlobal('useRoute', () => ({ params: { token: 't123' }, query: {} }))
			const { resetPassword, isLoadingResetPassword } = useAuth()
			const res = await resetPassword({ password: 'newpass' })
			expect(isLoadingResetPassword.value).toBe(false)
			expect(res && res.code).toBe(200)
			expect(res && res.message).toBe('Success reset password, please log in with new password')
		})

		it('fails with invalid token', async () => {
			vi.stubGlobal('useRoute', () => ({ params: { token: 'bad' }, query: {} }))
			mswServer.use(
				http.post('/api/auth/reset-password/:token', async ({ params }) => {
					return HttpResponse.json(
						{ message: `Invalid token ${params.token}` },
						{ status: 400, statusText: 'Bad Request' }
					)
				})
			)
			const { resetPassword } = useAuth()
			const res = await resetPassword({ password: 'newpass' })
			expect(res).toBe(false)
		})
	})

	describe('verify', () => {
		it('succeeds', async () => {
			const { verify, isLoadingVerify } = useAuth()
			const res = await verify('tok123')
			expect(isLoadingVerify.value).toBe(false)
			expect(res && res.code).toBe(200)
			expect(res && res.message).toBe('Success verify user email')
		})

		it('fails with invalid token', async () => {
			mswServer.use(
				http.get('/api/auth/verify/:token', async ({ params }) => {
					return HttpResponse.json(
						{ message: `Invalid token ${params.token}` },
						{ status: 400, statusText: 'Bad Request' }
					)
				})
			)
			const { verify } = useAuth()
			const res = await verify('bad')
			expect(res).toBe(false)
		})
	})

	describe('resendVerification', () => {
		it('succeeds', async () => {
			const { resendVerification, isLoadingResendVerification } = useAuth()
			const res = await resendVerification('tok123')
			expect(isLoadingResendVerification.value).toBe(false)
			expect(res && res.code).toBe(200)
			expect(res && res.message).toBe('Success resend verification')
		})

		it('fails', async () => {
			mswServer.use(
				http.post('/api/auth/resend-verification', async () => {
					return HttpResponse.json(
						{ message: 'Cannot resend' },
						{ status: 400, statusText: 'Bad Request' }
					)
				})
			)
			const { resendVerification } = useAuth()
			const res = await resendVerification('bad')
			expect(res).toBe(false)
		})
	})

	describe('loading guards (early returns)', () => {
		it('forgotPassword returns early when already loading', async () => {
			const { forgotPassword, isLoadingForgotPassword } = useAuth()
			isLoadingForgotPassword.value = true

			const res = await forgotPassword({ email: 'a@b.com' })
			expect(res).toBeUndefined()
			expect(isLoadingForgotPassword.value).toBe(true)
		})

		it('login returns early when already loading', async () => {
			const { login, isLoadingLogin } = useAuth()
			const userStore = useUserStore()
			isLoadingLogin.value = true
			userStore.isLoggedIn.value = false
			userStore.handleClearUser.mockClear()

			const res = await login({ email: 'a@b.com', password: 'secret' })
			expect(res).toBeUndefined()
			expect(isLoadingLogin.value).toBe(true)
			expect(userStore.isLoggedIn.value).toBe(false)
			expect(userStore.handleClearUser).not.toHaveBeenCalled()
		})

		it('register returns early when already loading', async () => {
			const { register, isLoadingRegister } = useAuth()
			isLoadingRegister.value = true

			const res = await register({
				email: 'new@user.com',
				fullname: 'New User',
				password: 'pass',
				username: 'newbie',
			})
			expect(res).toBeUndefined()
			expect(isLoadingRegister.value).toBe(true)
		})

		it('resetPassword returns early when already loading', async () => {
			const { resetPassword, isLoadingResetPassword } = useAuth()
			isLoadingResetPassword.value = true

			const res = await resetPassword({ password: 'newpass' })
			expect(res).toBeUndefined()
			expect(isLoadingResetPassword.value).toBe(true)
		})

		it('verify returns early when already loading', async () => {
			const { verify, isLoadingVerify } = useAuth()
			isLoadingVerify.value = true

			const res = await verify('tok123')
			expect(res).toBeUndefined()
			expect(isLoadingVerify.value).toBe(true)
		})

		it('resendVerification returns early when already loading', async () => {
			const { resendVerification, isLoadingResendVerification } = useAuth()
			isLoadingResendVerification.value = true

			const res = await resendVerification('tok123')
			expect(res).toBeUndefined()
			expect(isLoadingResendVerification.value).toBe(true)
		})
	})
})
