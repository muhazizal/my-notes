import { useApi } from './useApi'
import type { IForgotPasswordBody, IForgotPasswordResponse } from '@/types/forgot-password'

export function useForgotPassword() {
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

	return {
		forgotPassword,
		isLoadingForgotPassword,
	}
}
