import { z } from 'zod'

export const passwordSchema = z
	.string()
	.trim()
	.min(5, 'Password must be at least 5 characters long')
