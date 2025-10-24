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
		return HttpResponse.json<IUserProfileResponse>(
			{
				message: 'Success get profile',
				data: sampleUser,
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.put('/api/user/profile', async ({ request }) => {
		const body = (await request.json()) as IEditUserProfileBody

		const message =
			body.email !== sampleUser.email
				? 'Success update profile, please verify your new email'
				: 'Success update profile'

		return HttpResponse.json<IEditUserProfileResponse>(
			{
				message,
				data: body,
				code: 201,
			},
			{ status: 201 }
		)
	}),
	http.delete('/api/user', async () => {
		return HttpResponse.json<IDeleteResponse>(
			{
				message: 'Success delete account',
				code: 200,
			},
			{ status: 200 }
		)
	}),
]
