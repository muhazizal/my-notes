import { useApi } from './useApi'
import type {
	INote,
	IGetNotesResponse,
	ICreateNoteBody,
	ICreateNoteResponse,
	IGetNoteByIdResponse,
	IUpdateNotePayload,
	IUpdateNoteResponse,
	IDeleteNoteResponse,
} from '@/types/notes'

export function useNotes() {
	const notes = useState<INote[]>('notes-list', () => [])

	const getNotes = async () => {
		return await useApi<IGetNotesResponse>('/api/notes', {
			method: 'get',
			watch: false,
		})
	}

	const createNote = async (body: ICreateNoteBody) => {
		return await useApi<ICreateNoteResponse>('/api/notes', {
			method: 'post',
			body,
			watch: false,
		})
	}

	const getNoteById = async (id: string) => {
		return await useApi<IGetNoteByIdResponse>(`/api/notes/${id}`, {
			method: 'get',
			watch: false,
		})
	}

	const updateNote = async ({ id, body }: IUpdateNotePayload) => {
		return await useApi<IUpdateNoteResponse>(`/api/notes/${id}`, {
			method: 'put',
			body,
			watch: false,
		})
	}

	const deleteNote = async (id: string) => {
		return await useApi<IDeleteNoteResponse>(`/api/notes/${id}`, {
			method: 'delete',
			watch: false,
		})
	}

	return {
		notes,
		getNotes,
		createNote,
		getNoteById,
		updateNote,
		deleteNote,
	}
}
