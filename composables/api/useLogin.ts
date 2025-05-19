import { useApi } from './useApi'
import type { ILoginBody, ILoginResponse } from '@/types/login'

export function useLogin() {
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

	return {
		login,
		isLoadingLogin,
	}
}
