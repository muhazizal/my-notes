import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Ref } from 'vue'
import plugin from '../../../plugins/user.server'
import { useUserStore } from '@/stores/user'
import { sampleUser } from '../../mocks/data'

describe('plugins/user.server', () => {
	let store: ReturnType<typeof useUserStore>
	let isLoggedInRef: Ref<boolean>
	let userRef: Ref<{ email: string; fullname: string; isVerified: boolean; username: string }>
	const accessToken = (globalThis as any).useCookie('access_token')

	beforeEach(() => {
		store = useUserStore()
		// Cast store fields to typed refs to satisfy TS
		isLoggedInRef = store.isLoggedIn as unknown as Ref<boolean>
		userRef = store.user as unknown as Ref<{
			email: string
			fullname: string
			isVerified: boolean
			username: string
		}>

		// reset store state and cookie before each run
		store.handleClearUser()
		accessToken.value = undefined
	})

	it('does not fetch profile when access_token is missing', async () => {
		accessToken.value = undefined
		const spy = vi.spyOn(store, 'getUserProfile')

		await plugin({ $pinia: {} } as any)

		expect(spy).not.toHaveBeenCalled()
		expect(isLoggedInRef.value).toBe(false)
		expect(userRef.value.email).toBe('')
	})

	it('fetches profile when access_token is present and updates store', async () => {
		accessToken.value = 'token-123'

		await plugin({ $pinia: {} } as any)

		// MSW userHandlers respond with sampleUser
		expect(isLoggedInRef.value).toBe(true)
		expect(userRef.value).toEqual(sampleUser)
	})
})
