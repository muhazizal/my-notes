import type { IResponse } from './api'

export interface IEditUserProfileForm {
	fullname: string
	username: string
	email: string
}

export interface IUser {
	username: string
	fullname: string
	email: string
	isVerified: boolean
}

export interface IUserProfileResponse extends IResponse<IUser> {}
export interface IEditUserProfileBody {
	fullname: string
	username: string
	email: string
}
export interface IEditUserProfileResponse extends IResponse<IEditUserProfileBody> {}
export interface IDeleteResponse extends IResponse {}
