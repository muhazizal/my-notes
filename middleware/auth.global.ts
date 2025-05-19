import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
	const { isLoggedIn } = storeToRefs(useUserStore())
	const router = useRouter()

	const isAuthRoute = (route: string): boolean => {
		return ['index', 'sign-in', 'sign-up', 'forgot-password', 'verify', 'reset-password'].includes(
			route
		)
	}

	if (isLoggedIn.value) {
		if (isAuthRoute(to.name as string)) {
			router.replace('/notes')
		}
	} else {
		if (!isAuthRoute(to.name as string)) {
			router.replace('/sign-in')
		}
	}
})
