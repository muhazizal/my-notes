import type { IUser, IUserProfileResponse } from '~/types/user'
import type { IEditUserProfileBody, IEditUserProfileResponse } from '~/types/edit-user-profile'
import { useApi } from '@/composables/api/useApi.js'

export const useUserStore = defineStore('userStore', () => {
	const isLoading = ref<boolean>(false)
	const isLoggedIn = ref<boolean>(false)

	// User data
	const user = ref<IUser | undefined>({
		email: '',
		fullname: '',
		isVerified: false,
		username: '',
	})

	// Get user profile
	const getUserProfile = async (): Promise<void> => {
		if (isLoading.value) return
		isLoading.value = true

		const { data, error } = await useApi<IUserProfileResponse>('/api/user/profile', {
			method: 'get',
			credentials: 'include',
			watch: false,
		})

		if (error.value) {
			isLoggedIn.value = false
			isLoading.value = false
		} else {
			user.value = data.value?.data
			isLoggedIn.value = true
			isLoading.value = false
		}
	}

	// Edit user profile
	const editUserProfile = async (body: IEditUserProfileBody) => {
		return await useApi<IEditUserProfileResponse>('/api/user/profile', {
			method: 'put',
			credentials: 'include',
			watch: false,
			body,
		})
	}

	return {
		user,
		isLoggedIn,
		getUserProfile,
		editUserProfile,
	}
})
