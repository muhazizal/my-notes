import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware((to) => {
	const { isLoggedIn } = storeToRefs(useUserStore())

	const isAuthRoute = (route: string): boolean => {
		return [
			'index',
			'sign-in',
			'sign-up',
			'forgot-password',
			'verify-token',
			'reset-password-token',
		].includes(route)
	}

	if (isLoggedIn.value) {
		if (isAuthRoute(to.name as string)) {
			return navigateTo('/notes')
		}
	} else {
		if (!isAuthRoute(to.name as string)) {
			return navigateTo('/sign-in')
		}
	}
})
