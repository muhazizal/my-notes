import { authHandlers } from '@/tests/helpers/authHandlers'
import { userHandlers } from '@/tests/helpers/userHandlers'
import { notesHandlers } from '@/tests/helpers/notesHandlers'

export const handlers = [...authHandlers, ...userHandlers, ...notesHandlers]
