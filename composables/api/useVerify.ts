import { useApi } from './useApi'
import type { IVerifyResponse, IResendVerificationResponse } from '@/types/verify'

export function useVerify() {
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
		verify,
		isLoadingVerify,
		resendVerification,
		isLoadingResendVerification,
	}
}
