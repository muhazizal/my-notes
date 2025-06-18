import { useApi } from './useApi'
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

export function useAuth() {
	const route = useRoute()

	const isLoadingForgotPassword = useState('is-loading-forgot-password', () => false)
	const forgotPassword = async (body: IForgotPasswordBody) => {
		if (isLoadingForgotPassword.value) return
		isLoadingForgotPassword.value = true

		const { data, error } = await useApi<IForgotPasswordResponse>(`/api/auth/forgot-password`, {
			method: 'post',
			body,
			watch: false,
		})

		if (error.value) {
			isLoadingForgotPassword.value = false
			return false
		} else {
			isLoadingForgotPassword.value = false
			return data.value
		}
	}

	const isLoadingLogin = useState('is-loading-login', () => false)
	const { isLoggedIn } = storeToRefs(useUserStore())
	const login = async (body: ILoginBody) => {
		if (isLoadingLogin.value) return
		isLoadingLogin.value = true

		const { data, error } = await useApi<ILoginResponse>(`/api/auth/login`, {
			method: 'post',
			body,
			watch: false,
		})

		if (error.value) {
			isLoadingLogin.value = false
			isLoggedIn.value = false
			return false
		} else {
			isLoadingLogin.value = false
			isLoggedIn.value = true
			return data.value
		}
	}

	const logout = async () => {
		return await useApi<ILogoutResponse>(`/api/auth/logout`, {
			method: 'post',
			watch: false,
		})
	}

	const isLoadingRegister = useState('is-loading-register', () => false)
	const register = async (body: IRegisterBody) => {
		if (isLoadingRegister.value) return
		isLoadingRegister.value = true

		const { data, error } = await useApi<IRegisterResponse>(`/api/auth/register`, {
			method: 'put',
			body,
			watch: false,
		})

		if (error.value) {
			isLoadingRegister.value = false
			return false
		} else {
			isLoadingRegister.value = false
			return data.value
		}
	}

	const isLoadingResetPassword = useState('is-loading-reset-password', () => false)
	const resetPassword = async (body: IResetPasswordBody) => {
		if (isLoadingResetPassword.value) return
		isLoadingResetPassword.value = true

		const { token } = route.params

		const { data, error } = await useApi<IResetPasswordResponse>(
			`/api/auth/reset-password/${token}`,
			{
				method: 'post',
				body,
				watch: false,
			}
		)

		if (error.value) {
			isLoadingResetPassword.value = false
			return false
		} else {
			isLoadingResetPassword.value = false
			return data.value
		}
	}

	const isLoadingVerify = useState('is-loading-verify', () => false)
	const verify = async (token: string | string[]) => {
		if (isLoadingVerify.value) return
		isLoadingVerify.value = true

		const { data, error } = await useApi<IVerifyResponse>(`/api/auth/verify/${token}`, {
			method: 'get',
			watch: false,
		})

		if (error.value) {
			isLoadingVerify.value = false
			return false
		} else {
			isLoadingVerify.value = false
			return data.value
		}
	}

	const isLoadingResendVerification = useState('is-loading-resend-verification', () => false)
	const resendVerification = async (token: string | string[]) => {
		if (isLoadingResendVerification.value) return
		isLoadingResendVerification.value = true

		const { data, error } = await useApi<IResendVerificationResponse>(
			`/api/auth/resend-verification`,
			{
				method: 'post',
				body: { token },
				watch: false,
			}
		)

		if (error.value) {
			isLoadingResendVerification.value = false
			return false
		} else {
			isLoadingResendVerification.value = false
			return data.value
		}
	}

	return {
		forgotPassword,
		isLoadingForgotPassword,
		login,
		isLoadingLogin,
		logout,
		register,
		isLoadingRegister,
		resetPassword,
		isLoadingResetPassword,
		verify,
		isLoadingVerify,
		resendVerification,
		isLoadingResendVerification,
	}
}
