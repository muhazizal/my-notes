import type { IResponse } from './api'

// API
export interface ILoginBody {
	email: string
	password: string
}
export interface ILoginResponse extends IResponse {
	message: string
	code: number
}

// UI
export interface ILoginForm extends ILoginBody {}
