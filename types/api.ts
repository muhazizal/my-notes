export interface IResponse<T> {
	message: string
	code: number
	data: T
}

export interface IError {
	statusCode: string
	statusMessage: string
}
