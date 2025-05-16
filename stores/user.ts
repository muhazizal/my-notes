import type { IUser, IUserProfileResponse } from '~/types/user'
import { useApi } from '@/composables/api/useApi.js'

export const useUserStore = defineStore('userStore', () => {
	const isLoading = ref<boolean>(false)

	// User data
	const user = ref<IUser | undefined>({
		email: '',
		fullname: '',
		isVerified: false,
		username: '',
	})

	// Get user profile
	const getUserProfile = async () => {
		if (isLoading.value) return
		isLoading.value = true

		const { data, error } = await useApi<IUserProfileResponse>('/api/user/profile', {
			method: 'get',
			credentials: 'include',
			watch: false,
		})

		if (error.value) {
			isLoading.value = false
		} else {
			user.value = data.value?.data
			isLoading.value = false
		}
	}

	return {
		user,
		getUserProfile,
	}
})
