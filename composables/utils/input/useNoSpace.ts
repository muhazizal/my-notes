export function useNoSpace() {
	const preventSpace = (event: KeyboardEvent) => {
		if (event.key === ' ') {
			event.preventDefault()
		}
	}
	return {
		preventSpace,
	}
}
