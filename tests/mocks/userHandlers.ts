import { http, HttpResponse } from 'msw'
import type {
	IUserProfileResponse,
	IEditUserProfileBody,
	IEditUserProfileResponse,
	IDeleteResponse,
} from '~/types/user'
import { sampleUser } from './data'

export const userHandlers = [
	http.get('/api/user/profile', async () => {
		return HttpResponse.json<IUserProfileResponse>({
			message: 'Success get profile',
			data: sampleUser,
			code: 200,
		})
	}),
	http.put('/api/user/profile', async ({ request }) => {
		const body = (await request.json()) as IEditUserProfileBody
		return HttpResponse.json<IEditUserProfileResponse>({
			message: 'Success update profile',
			data: body,
			code: 200,
		})
	}),
	http.delete('/api/user', async () => {
		return HttpResponse.json<IDeleteResponse>({
			message: 'Success delete account',
			code: 200,
		})
	}),
]