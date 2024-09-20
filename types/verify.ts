import type { IResponse } from './api'

// API
export interface IVerifyResponse extends IResponse {
	message: string
	code: number
}
export interface IResendVerificationResponse extends IResponse {
	message: string
	code: number
}
