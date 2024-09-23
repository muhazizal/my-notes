import type { IResponse } from './api'

// API
export interface IResetPasswordBody {
	password: string
}
export interface IResetPasswordResponse extends IResponse {
	message: string
	code: number
}

// UI
export interface IResetPasswordForm {
	password: {
		real: string
		confirmation: string
	}
}
