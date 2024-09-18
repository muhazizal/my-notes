import { joinURL, withQuery } from 'ufo'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
	const requestedWith = getRequestHeader(event, 'X-Requested-With')

	if (requestedWith !== 'XMLHttpRequest') {
		throw createError({
			statusCode: 403,
			message: 'Forbidden Access',
		})
	}

	// const token = getCookie(event, 'oauth/token')
	const { apiBaseUrl } = useRuntimeConfig()
	const path = getRouterParam(event, 'path') ?? ''

	// if (token) {
	//   event.node.req.headers.authorization = `Bearer ${token}`
	// }

	const queryParam = getQuery(event)

	return await proxyRequest(event, withQuery(joinURL(apiBaseUrl, '/api', path), queryParam))
})
