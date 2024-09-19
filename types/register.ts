import type { IResponse } from './api'

// API
export interface IRegisterBody {
	fullname: string
	username: string
	email: string
	password: string
}
export interface IRegisterResponse extends IResponse {
	message: string
	code: number
}

// UI
export interface IRegisterForm {
	fullname: string
	username: string
	email: string
	password: {
		real: string
		confirmation: string
	}
	tnc: boolean
}
