import type { IResponse } from './api'

// API
export interface IForgotPasswordBody {
	email: string
}
export interface IForgotPasswordResponse extends IResponse {
	message: string
	code: number
}
