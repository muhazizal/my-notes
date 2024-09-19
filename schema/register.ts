import { z } from 'zod'
import { isAlphanumeric } from 'validator'

const passwordSchema = z.string().trim().min(5, 'Password must be at least 5 characters long')

export const registerSchema = z.object({
	fullname: z.string().min(1, 'Full name is required'),
	username: z
		.string()
		.trim()
		.min(3, 'Username must be at least 3 characters long')
		.refine(
			(value) => {
				return isAlphanumeric(value)
			},
			{
				message: 'Username must be alphanumeric',
			}
		),
	email: z.string().trim().min(1, 'Email is required').email('Email is not valid'),
	password: z
		.object({
			real: passwordSchema,
			confirmation: passwordSchema,
		})
		.refine((data) => data.real === data.confirmation, {
			path: ['confirmation'],
			message: 'Passwords is not match',
		}),
	tnc: z
		.boolean()
		.refine((val) => val === true, { message: 'Term and conditions must be checked' }),
})
