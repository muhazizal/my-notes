export interface IResponse<T = undefined> {
	message: string
	code: number
	data?: T
}

export interface IError {
	statusCode: number
	statusMessage: string
}
