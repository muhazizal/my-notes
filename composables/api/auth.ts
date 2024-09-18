import type { ILoginBody, ILoginResponse } from '@/types/login'

export function useApiAuth() {
	const login = (body: ILoginBody) => {
		return useApi<ILoginResponse>(`/api/auth/login`, {
			method: 'post',
			body,
		})
	}

	return {
		login,
	}
}
