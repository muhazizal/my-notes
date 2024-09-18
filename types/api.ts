export interface IResponse<T = any> {
	message: string
	code: number
	data?: T
}
