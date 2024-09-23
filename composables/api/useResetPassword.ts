import { useApi } from './useApi'
import type { IResetPasswordBody, IResetPasswordResponse } from '@/types/reset-password'

export function useResetPassword() {
	const route = useRoute()
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

	return {
		resetPassword,
		isLoadingResetPassword,
	}
}
