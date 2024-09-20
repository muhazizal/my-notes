export interface IResponse<T = unknown> {
	message: string
	code: number
	data?: T
}
