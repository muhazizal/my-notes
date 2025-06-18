<template>
	<UModal v-model="isOpen" class="logout" prevent-close>
		<UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
			<template #header>
				<div class="logout__header">
					<h3>Logout Account</h3>
				</div>
			</template>

			<p class="logout__body">Do you really want to end your session and log out?</p>

			<div class="logout__actions">
				<UButton
					size="xl"
					variant="outline"
					color="gray"
					:square="true"
					:disabled="isLoadingLogout"
					@click="handleCancelLogout"
					>Cancel</UButton
				>
				<UButton
					type="submit"
					size="xl"
					:square="true"
					:loading="isLoadingLogout"
					:disabled="isLoadingLogout"
					@click="handleLogout"
					>Logout</UButton
				>
			</div>
		</UCard>
	</UModal>
</template>

<script lang="ts" setup>
import { useAuth } from '@/composables/api/useAuth'

const { handleClearUser } = useUserStore()
const { logout } = useAuth()
const toast = useToast()
const router = useRouter()

const isOpen = ref(false)
const handleOpenModal = (payload: boolean) => {
	isOpen.value = payload
}

const isLoadingLogout = ref(false)

const handleLogout = async (): Promise<void> => {
	if (isLoadingLogout.value) return
	isLoadingLogout.value = true

	const { data } = await logout()

	if (data.value) {
		toast.add({
			color: 'green',
			title: 'Logout',
			description: data.value.message,
		})

		handleClearUser()

		router.replace('/')
	}

	isLoadingLogout.value = false
	isOpen.value = false
}

const handleCancelLogout = (): void => {
	handleOpenModal(false)
}

defineExpose({
	handleOpenModal,
})
</script>

<style lang="scss" scoped>
.logout {
	&__header {
		@apply flex items-center justify-between;

		h3 {
			@apply text-base font-semibold leading-6 text-gray-900 dark:text-white;
		}
	}

	&__body {
		@apply space-y-5 text-base;
	}

	&__actions {
		@apply flex items-center justify-between !mt-12;

		button {
			@apply w-28 justify-center p-3 rounded-none;
		}
	}
}
</style>
