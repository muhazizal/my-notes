export interface IResponse<T = unknown> {
	message: string
	code: number
	data?: T
}

export interface IError {
	statusCode: string
	statusMessage: string
}
