import { http, HttpResponse } from 'msw'
import type {
	IGetNotesResponse,
	ICreateNoteBody,
	ICreateNoteResponse,
	IGetNoteByIdResponse,
	IUpdateNoteResponse,
	IDeleteNoteResponse,
	INote,
} from '@/types/notes'
import { sampleNotes } from './data'

export const notesHandlers = [
	http.get('/api/notes', async () => {
		return HttpResponse.json<IGetNotesResponse>(
			{
				message: 'Success get notes',
				data: sampleNotes,
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.post('/api/notes', async ({ request }) => {
		const body = (await request.json()) as ICreateNoteBody
		const newNote: INote = {
			id: String(sampleNotes.length + 1),
			title: body.title,
			description: body.description,
			raw_description: body.description,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		sampleNotes.unshift(newNote)
		return HttpResponse.json<ICreateNoteResponse>(
			{
				message: 'Success create note',
				data: newNote,
				code: 201,
			},
			{ status: 201 }
		)
	}),
	http.get('/api/notes/:id', async ({ params }) => {
		const id = params.id as string
		const note = sampleNotes.find((n) => n.id === id) || sampleNotes[0]
		return HttpResponse.json<IGetNoteByIdResponse>(
			{
				message: 'Success get note',
				data: note,
				code: 200,
			},
			{ status: 200 }
		)
	}),
	http.put('/api/notes/:id', async ({ params, request }) => {
		const id = params.id as string
		const body = (await request.json()) as ICreateNoteBody
		let note = sampleNotes.find((n) => n.id === id)
		if (!note) {
			note = {
				id,
				title: body.title,
				description: body.description,
				raw_description: body.description,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}
			sampleNotes.unshift(note)
		} else {
			note.title = body.title
			note.description = body.description
			note.raw_description = body.description
			note.updatedAt = new Date().toISOString()
		}
		return HttpResponse.json<IUpdateNoteResponse>(
			{
				message: 'Success update note',
				data: note,
				code: 201,
			},
			{ status: 201 }
		)
	}),
	http.delete('/api/notes/:id', async ({ params }) => {
		const id = params.id as string
		const idx = sampleNotes.findIndex((n) => n.id === id)
		if (idx >= 0) sampleNotes.splice(idx, 1)
		return HttpResponse.json<IDeleteNoteResponse>(
			{
				message: 'Success delete note',
				code: 200,
			},
			{ status: 200 }
		)
	}),
]
