import { useUserStore } from '@/stores/user'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin(async ({ $pinia }): Promise<void> => {
	const session_id = useCookie<string>('session_id')

	const { getUserProfile } = useUserStore($pinia as Pinia)

	if (session_id.value) {
		await getUserProfile()
	}
})
