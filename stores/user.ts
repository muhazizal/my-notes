import type {
	IUser,
	IUserProfileResponse,
	IEditUserProfileBody,
	IEditUserProfileResponse,
	IDeleteResponse,
} from '~/types/user'
import { useApi } from '@/composables/api/useApi.js'

export const useUserStore = defineStore('userStore', () => {
	const isLoading = ref<boolean>(false)
	const isLoggedIn = ref<boolean>(false)

	// User data
	const user = ref<IUser>({
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
		} else if (data.value?.data) {
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

	// Clear user data
	const handleClearUser = () => {
		isLoggedIn.value = false
		user.value.email = ''
		user.value.fullname = ''
		user.value.isVerified = false
		user.value.username = ''
	}

	// Delete user account
	const deleteUserAccount = async () => {
		return await useApi<IDeleteResponse>('/api/user', {
			method: 'delete',
			credentials: 'include',
			watch: false,
		})
	}

	return {
		user,
		isLoggedIn,
		getUserProfile,
		editUserProfile,
		handleClearUser,
		deleteUserAccount,
	}
})
