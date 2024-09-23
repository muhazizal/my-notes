import { z } from 'zod'
import { passwordSchema } from '@/schema/standalone/password.js'

export const resetPasswordSchema = z.object({
	password: z
		.object({
			real: passwordSchema,
			confirmation: passwordSchema,
		})
		.refine((data) => data.real === data.confirmation, {
			path: ['confirmation'],
			message: 'Passwords is not match',
		}),
})
