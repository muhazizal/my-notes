export default defineNuxtRouteMiddleware(() => {
	const access_token = useCookie('access_token')

	if (!access_token.value) {
		const router = useRouter()
		router.replace('/sign-in')
	}
})
