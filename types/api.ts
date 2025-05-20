export interface IResponse<T = undefined> {
	message: string
	code: number
	data?: T
}

export interface IError {
	statusCode: string
	statusMessage: string
}
