import { http, HttpResponse } from 'msw'
import type {
	IForgotPasswordBody,
	IForgotPasswordResponse,
	ILoginBody,
	ILoginResponse,
	ILogoutResponse,
	IRegisterBody,
	IRegisterResponse,
	IResetPasswordBody,
	IResetPasswordResponse,
	IVerifyResponse,
	IResendVerificationResponse,
} from '@/types/auth'

export const authHandlers = [
	http.put('/api/auth/register', async ({ request }) => {
		const _body = (await request.json()) as IRegisterBody
		return HttpResponse.json<IRegisterResponse>(
			{
				message: 'Success register user, please verify your email',
				code: 201,
			},
			{ status: 201 }
		)
	}),
	http.post('/api/auth/login', async ({ request }) => {
		const _body = (await request.json()) as ILoginBody
		return HttpResponse.json<ILoginResponse>(
			{
				message: 'Success login user',
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.post('/api/auth/logout', async () => {
		return HttpResponse.json<ILogoutResponse>(
			{
				message: 'Success logout user',
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.get('/api/auth/verify/:token', async ({ params }) => {
		const _token = params.token as string
		return HttpResponse.json<IVerifyResponse>(
			{
				message: 'Success verify user email',
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.post('/api/auth/resend-verification', async ({ request }) => {
		const { token } = (await request.json()) as { token: string | string[] }
		return HttpResponse.json<IResendVerificationResponse>(
			{
				message: 'Success resend verification',
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.post('/api/auth/forgot-password', async ({ request }) => {
		const _body = (await request.json()) as IForgotPasswordBody
		return HttpResponse.json<IForgotPasswordResponse>(
			{
				message: 'Success forgot password, please check your email',
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.post('/api/auth/reset-password/:token', async ({ params, request }) => {
		const _token = params.token as string
		const _body = (await request.json()) as IResetPasswordBody
		return HttpResponse.json<IResetPasswordResponse>(
			{
				message: 'Success reset password, please log in with new password',
				code: 200,
			},
			{ status: 200 }
		)
	}),
]
