import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useNotes } from '~/composables/api/useNotes'
import { flushPromises } from '@vue/test-utils'

declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useToast: () => any
declare const navigateTo: () => any
declare const useUserStore: () => any

describe('useNotes', () => {
	beforeEach(() => {
		const toast = useToast()
		vi.mocked(toast.add).mockReset()
		vi.mocked(navigateTo).mockReset()
		const store = useUserStore()
		vi.mocked(store.handleClearUser).mockReset()
	})

	// getNotes
	it('getNotes: returns list on success', async () => {
		const { getNotes } = useNotes()
		const res = await getNotes()

		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(200)
		expect(Array.isArray(res.data.value?.data)).toBe(true)
	})

	it('getNotes: 401 toasts, clears user and redirects', async () => {
		mswServer.use(
			http.get('/api/notes', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
		)

		const { getNotes } = useNotes()
		const res = await getNotes()
		await flushPromises()

		expect(res.error.value).not.toBeNull()
		const err = res.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const store = useUserStore()
		expect(store.handleClearUser).toHaveBeenCalled()
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
	})

	it('getNotes: 500 toasts and sets error (no throw)', async () => {
		mswServer.use(
			http.get('/api/notes', () => HttpResponse.json({ message: 'Server down' }, { status: 500 }))
		)

		const { getNotes } = useNotes()
		const res = await getNotes()
		await flushPromises()

		expect(res.error.value).not.toBeNull()
		const err = res.error.value!
		expect(err.status).toBe(500)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	it('getNotes: 404 throws and toasts', async () => {
		mswServer.use(
			http.get('/api/notes', () => HttpResponse.json({ message: 'Not found' }, { status: 404 }))
		)

		const { getNotes } = useNotes()
		await expect(getNotes()).rejects.toThrow()
		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	// createNote
	it('createNote: returns created note on success', async () => {
		const { createNote } = useNotes()
		const res = await createNote({ title: 'New', description: 'Content' })

		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(201)
		expect(res.data.value?.data?.title).toBe('New')
		expect(res.data.value?.data?.description).toBe('Content')
	})

	it('createNote: 422 toasts validation error (no throw)', async () => {
		mswServer.use(
			http.post('/api/notes', () =>
				HttpResponse.json({ message: 'Validation failed' }, { status: 422 })
			)
		)

		const { createNote } = useNotes()
		const res = await createNote({ title: '', description: '' })
		await flushPromises()

		expect(res.error.value).not.toBeNull()
		const err = res.error.value!
		expect(err.status).toBe(422)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const [payload] = toast.add.mock.calls[0]
		expect(payload.title).toBe('Validation error')
		expect(payload.color).toBe('red')
	})

	// getNoteById
	it('getNoteById: returns note on success', async () => {
		const { getNoteById } = useNotes()
		const res = await getNoteById('1')

		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(200)
		expect(res.data.value?.data?.id).toBe('1')
	})

	it('getNoteById: 404 throws and toasts', async () => {
		mswServer.use(
			http.get('/api/notes/404', () => HttpResponse.json({ message: 'Missing' }, { status: 404 }))
		)

		const { getNoteById } = useNotes()
		await expect(getNoteById('404')).rejects.toThrow()
		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	// updateNote
	it('updateNote: returns updated note on success', async () => {
		const { updateNote } = useNotes()
		const res = await updateNote({ id: '1', body: { title: 'Updated', description: 'Edited' } })

		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(201)
		expect(res.data.value?.data?.title).toBe('Updated')
		expect(res.data.value?.data?.description).toBe('Edited')
	})

	it('updateNote: 422 toasts validation error (no throw)', async () => {
		mswServer.use(
			http.put('/api/notes/1', () =>
				HttpResponse.json({ message: 'Validation failed' }, { status: 422 })
			)
		)

		const { updateNote } = useNotes()
		const res = await updateNote({ id: '1', body: { title: '', description: '' } })
		await flushPromises()

		expect(res.error.value).not.toBeNull()
		const err = res.error.value!
		expect(err.status).toBe(422)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	it('updateNote: 401 toasts, clears user and redirects', async () => {
		mswServer.use(
			http.put('/api/notes/1', () =>
				HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
			)
		)

		const { updateNote } = useNotes()
		const res = await updateNote({ id: '1', body: { title: 'x', description: 'y' } })
		await flushPromises()

		expect(res.error.value).not.toBeNull()
		const err = res.error.value!
		expect(err.status).toBe(401)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
		const store = useUserStore()
		expect(store.handleClearUser).toHaveBeenCalled()
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
	})

	// deleteNote
	it('deleteNote: returns success on delete', async () => {
		const { deleteNote } = useNotes()
		const res = await deleteNote('1')

		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(200)
	})

	it('deleteNote: 404 throws and toasts', async () => {
		mswServer.use(
			http.delete('/api/notes/1', () =>
				HttpResponse.json({ message: 'Not found' }, { status: 404 })
			)
		)

		const { deleteNote } = useNotes()
		await expect(deleteNote('1')).rejects.toThrow()
		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})

	it('deleteNote: 500 toasts error (no throw)', async () => {
		mswServer.use(
			http.delete('/api/notes/1', () =>
				HttpResponse.json({ message: 'Server error' }, { status: 500 })
			)
		)

		const { deleteNote } = useNotes()
		const res = await deleteNote('1')
		await flushPromises()

		expect(res.error.value).not.toBeNull()
		const err = res.error.value!
		expect(err.status).toBe(500)

		const toast = useToast()
		expect(toast.add).toHaveBeenCalled()
	})
})
