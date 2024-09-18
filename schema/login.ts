import { z } from 'zod'

export const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Email is not valid'),
	password: z.string().min(1, 'Password is required'),
})
