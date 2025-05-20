import { z } from 'zod'
import { isAlphanumeric } from 'validator'

export const editUserProfileSchema = z.object({
	fullname: z.string().min(1, 'Full name is required'),
	username: z
		.string()
		.trim()
		.min(3, 'Username must be at least 3 characters long')
		.refine(isAlphanumeric, {
			message: 'Username must be alphanumeric',
		}),
	email: z.string().trim().min(1, 'Email is required').email('Email is not valid'),
})
