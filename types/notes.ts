import type { IResponse } from './api'

// Notes
export interface INote {
	id: string
	title: string
	description: string
	raw_description: string
	createdAt: string
	updatedAt: string
}

// Get Notes
export interface IGetNotesResponse extends IResponse<INote[]> {}

// Create Note
export interface ICreateNoteBody {
	title: string
	description: string
}
export interface ICreateNoteResponse extends IResponse<INote> {}

// Get Note by ID
export interface IGetNoteByIdResponse extends IResponse<INote> {}

// Update Note
export interface IUpdateNoteBody extends ICreateNoteBody {}
export interface IUpdateNotePayload {
	id: string
	body: IUpdateNoteBody
}
export interface IUpdateNoteResponse extends IResponse<INote> {}

// Delete Note
export interface IDeleteNoteResponse extends IResponse {}
