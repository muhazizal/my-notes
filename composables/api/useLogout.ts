import { useApi } from './useApi'
import type { ILogoutResponse } from '@/types/auth'

export function useLogout() {
	const logout = async () => {
		return await useApi<ILogoutResponse>(`/api/auth/logout`, {
			method: 'post',
			watch: false,
		})
	}

	return {
		logout,
	}
}
