import { useApi } from './useApi'
import type { IRegisterBody, IRegisterResponse } from '@/types/register'

export function useRegister() {
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

	return {
		register,
		isLoadingRegister,
	}
}
