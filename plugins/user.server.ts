import { useUserStore } from '@/stores/user'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin(async ({ $pinia }): Promise<void> => {
	const access_token = useCookie<string>('access_token')

	const { getUserProfile } = useUserStore($pinia as Pinia)

	if (access_token.value) {
		await getUserProfile()
	}
})
