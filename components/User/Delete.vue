<template>
	<UModal v-model="isOpen" class="delete" prevent-close>
		<UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
			<template #header>
				<div class="delete__header">
					<h3>Delete Account</h3>
				</div>
			</template>

			<p class="delete__body">
				<span>Are you sure you want to delete your account?</span>
				<span>This will permanently remove all your data and cannot be undone.</span>
			</p>

			<div class="delete__actions">
				<UButton
					size="xl"
					variant="outline"
					color="gray"
					:square="true"
					:disabled="isLoadingDelete"
					@click="handleCancelLogout"
					>Cancel</UButton
				>
				<UButton
					type="submit"
					size="xl"
					:square="true"
					:loading="isLoadingDelete"
					:disabled="isLoadingDelete"
					@click="handleDeleteAccount"
					>Delete</UButton
				>
			</div>
		</UCard>
	</UModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const { deleteUserAccount, handleClearUser } = useUserStore()
const toast = useToast()
const router = useRouter()

const isOpen = ref(false)
const handleOpenModal = (payload: boolean) => {
	isOpen.value = payload
}

const isLoadingDelete = ref(false)

const handleDeleteAccount = async (): Promise<void> => {
	if (isLoadingDelete.value) return
	isLoadingDelete.value = true

	const { data } = await deleteUserAccount()

	if (data.value) {
		toast.add({
			color: 'green',
			title: 'Delete Account',
			description: data.value.message,
		})

		handleClearUser()

		router.replace('/')
	}

	isLoadingDelete.value = false
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
.delete {
	&__header {
		@apply flex items-center justify-between;

		h3 {
			@apply text-base font-semibold leading-6 text-gray-900 dark:text-white;
		}
	}

	&__body {
		@apply space-y-1 text-base flex flex-col;
	}

	&__actions {
		@apply flex items-center justify-end gap-3 !mt-12;

		button {
			@apply w-28 justify-center p-3 rounded-none;
		}
	}
}
</style>
