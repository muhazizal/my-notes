import { authHandlers } from '~/tests/mocks/authHandlers'
import { userHandlers } from '~/tests/mocks/userHandlers'
import { notesHandlers } from '~/tests/mocks/notesHandlers'

export const handlers = [...authHandlers, ...userHandlers, ...notesHandlers]
