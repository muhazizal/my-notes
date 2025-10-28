import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { http, HttpResponse } from 'msw'
import { useUserStore } from '@/stores/user'
import { sampleUser } from '@/tests/helpers/data'
import * as useApiMod from '@/composables/api/useApi'

describe('stores/user', () => {
	let store: ReturnType<typeof useUserStore>
	let userRef: Ref<{ email: string; fullname: string; isVerified: boolean; username: string }>
	let isLoggedInRef: Ref<boolean>
	const mswServer = (globalThis as any).mswServer
	const navigateTo = (globalThis as any).navigateTo
	const useToast = (globalThis as any).useToast

	beforeEach(() => {
		store = useUserStore()

		// Cast to typed refs to satisfy TS
		userRef = store.user as unknown as Ref<{
			email: string
			fullname: string
			isVerified: boolean
			username: string
		}>
		isLoggedInRef = store.isLoggedIn as unknown as Ref<boolean>

		store.handleClearUser()
		navigateTo.mockClear()
		useToast().add.mockClear()
	})

	afterEach(() => {
		store.handleClearUser()
		navigateTo.mockClear()
		useToast().add.mockClear()
	})

	it('handleClearUser resets user and isLoggedIn', () => {
		userRef.value = { email: 'x', fullname: 'y', isVerified: true, username: 'z' }
		isLoggedInRef.value = true

		store.handleClearUser()

		expect(isLoggedInRef.value).toBe(false)
		expect(userRef.value.email).toBe('')
		expect(userRef.value.fullname).toBe('')
		expect(userRef.value.isVerified).toBe(false)
		expect(userRef.value.username).toBe('')
	})

	it('getUserProfile (negative 401): clears user and redirects to /sign-in', async () => {
		mswServer.use(
			http.get('/api/user/profile', () =>
				HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
			)
		)

		await store.getUserProfile()

		expect(isLoggedInRef.value).toBe(false)
		expect(userRef.value.email).toBe('')
		expect(navigateTo).toHaveBeenCalledWith('/sign-in')
		expect(useToast().add).toHaveBeenCalled()
	})

	it('editUserProfile (positive): returns updated data and 201 status', async () => {
		const body = { email: 'a@b.com', fullname: 'Test User', isVerified: true, username: 'tester' }
		const res = await store.editUserProfile(body)

		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(201)
		expect(res.data.value?.data).toEqual(body)
		expect(String(res.data.value?.message)).toContain('Success update profile')
	})

	it('editUserProfile (negative 422): sets error and shows toast', async () => {
		mswServer.use(
			http.put('/api/user/profile', () =>
				HttpResponse.json({ message: 'Invalid data' }, { status: 422 })
			)
		)

		const body = { email: 'a@b.com', fullname: 'Test User', isVerified: true, username: 'tester' }
		const res = await store.editUserProfile(body)

		expect(res.error.value?.status).toBe(422)
		expect(useToast().add).toHaveBeenCalled()
	})

	it('deleteUserAccount (positive): returns success payload', async () => {
		const res = await store.deleteUserAccount()
		expect(res.error.value).toBeNull()
		expect(res.data.value?.code).toBe(200)
		expect(res.data.value?.message).toBe('Success delete account')
	})

	it('deleteUserAccount (negative 500): sets error and shows toast', async () => {
		mswServer.use(
			http.delete('/api/user', () =>
				HttpResponse.json({ message: 'Server blowup' }, { status: 500 })
			)
		)

		const res = await store.deleteUserAccount()
		expect(res.error.value?.status).toBe(500)
		expect(useToast().add).toHaveBeenCalled()
	})

	it('getUserProfile (isLoading guard): prevents duplicate calls while loading', async () => {
		const store = useUserStore()

		// Deferred promise to keep the first call in "loading" state
		const defer = <T>() => {
			let resolve!: (value: T) => void
			let reject!: (reason?: any) => void
			const promise = new Promise<T>((res, rej) => {
				resolve = res
				reject = rej
			})
			return { promise, resolve, reject }
		}
		const d = defer<{ data: ReturnType<typeof ref>; error: ReturnType<typeof ref> }>()

		const apiSpy = vi.spyOn(useApiMod, 'useApi').mockImplementation(() => d.promise as any)

		// First call sets isLoading = true and awaits the deferred useApi
		const p1 = store.getUserProfile()
		// Second call should short-circuit due to isLoading guard (L35)
		const p2 = store.getUserProfile()

		// Verify only one network call was made
		expect(apiSpy).toHaveBeenCalledTimes(1)

		// Resolve the first call and await completion
		d.resolve({ data: ref({ data: sampleUser }), error: ref(null) })
		await p1

		// Store reflects successful fetch
		expect(isLoggedInRef.value).toBe(true)
		expect(userRef.value).toEqual(sampleUser)

		apiSpy.mockRestore()
	})
})
