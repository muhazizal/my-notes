import type { IResponse } from './api'

// API
export interface IUserProfileResponse extends IResponse<IUser> {}

// DATA
export interface IUser {
	username: string
	fullname: string
	email: string
	isVerified: boolean
}
