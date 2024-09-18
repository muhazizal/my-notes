import type { ILoginBody, ILoginResponse } from '@/types/login'
import { useApiAuth } from '@/composables/api/auth'

export function useAuth() {
	const { login } = useApiAuth()

	const handleLogin = async (params: ILoginBody): Promise<ILoginResponse | null> => {
		const { data, error } = await login(params)

		if (error.value) {
			console.error(error.value)
		}

		return data.value
	}

	return { handleLogin }
}
