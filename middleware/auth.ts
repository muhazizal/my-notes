export default defineNuxtRouteMiddleware(() => {
	const access_token = useCookie('access_token')

	if (!access_token.value) {
		navigateTo('/')
	}
})
