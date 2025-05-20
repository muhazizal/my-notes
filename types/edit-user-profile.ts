import type { IResponse } from './api'

// API
export interface IEditUserProfileBody {
	fullname: string
	username: string
	email: string
}
export interface IEditUserProfileResponse extends IResponse<IEditUserProfileBody> {
	message: string
	code: number
}

// UI
export interface IEditUserProfileForm {
	fullname: string
	username: string
	email: string
}
