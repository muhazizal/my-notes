import { authHandlers } from './authHandlers'
import { userHandlers } from './userHandlers'
import { notesHandlers } from './notesHandlers'

export const handlers = [...authHandlers, ...userHandlers, ...notesHandlers]
