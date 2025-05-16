import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
	const { isLoggedIn } = useUserStore()

	const authRoutes = ['index', 'sign-in', 'sign-up', 'forgot-password', 'verify', 'reset-password']

	if (isLoggedIn) {
		if (authRoutes.includes(to.name as string)) {
			return navigateTo('/notes')
		}
	} else {
		return navigateTo('/sign-in')
	}
})
