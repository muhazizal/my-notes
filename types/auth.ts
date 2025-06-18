import type { IResponse } from './api'

// Forgot Password
export interface IForgotPasswordBody {
	email: string
}
export interface IForgotPasswordResponse extends IResponse {}

// Login
export interface ILoginBody {
	email: string
	password: string
}
export interface ILoginResponse extends IResponse {}

// Logout
export interface ILogoutResponse extends IResponse {}

// Register
export interface IRegisterBody {
	fullname: string
	username: string
	email: string
	password: string
}
export interface IRegisterResponse extends IResponse {}
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

// Reset Password
export interface IResetPasswordBody {
	password: string
}
export interface IResetPasswordResponse extends IResponse {}
export interface IResetPasswordForm {
	password: {
		real: string
		confirmation: string
	}
}

// Verification
export interface IVerifyResponse extends IResponse {}
export interface IResendVerificationResponse extends IResponse {}
