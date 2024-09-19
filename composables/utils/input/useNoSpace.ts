export function useNoSpace() {
	const preventSpace = (event: KeyboardEvent) => {
		if (event.which === 32 || event.code === 'Space') {
			event.preventDefault()
		}
	}
	return {
		preventSpace,
	}
}
