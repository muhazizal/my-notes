<template>
	<UModal v-model="isOpen" class="edit" prevent-close>
		<UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
			<template #header>
				<div class="edit__header">
					<h3>Edit Profile</h3>
				</div>
			</template>

			<UForm
				class="edit__body"
				:schema="editUserProfileSchema"
				:state="form"
				@submit="handleEditUserProfile"
			>
				<UFormGroup name="fullname" size="xl" eager-validation>
					<UInput v-model="form.fullname" placeholder="Full name" size="xl" />
				</UFormGroup>
				<UFormGroup name="username" size="xl" eager-validation>
					<UInput
						v-model="form.username"
						placeholder="Username"
						size="xl"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<UFormGroup name="email" size="xl" eager-validation>
					<UInput
						v-model="form.email"
						placeholder="Email address"
						size="xl"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<div class="edit__actions">
					<UButton
						size="xl"
						variant="outline"
						color="gray"
						:square="true"
						:disabled="isLoadingForm"
						@click="handleCancelEdit"
						>Cancel</UButton
					>
					<UButton
						type="submit"
						size="xl"
						:square="true"
						:loading="isLoadingForm"
						:disabled="isLoadingForm"
						>Update</UButton
					>
				</div>
			</UForm>
		</UCard>
	</UModal>
</template>

<script lang="ts" setup>
import type { IEditUserProfileForm } from '~/types/edit-user-profile'
import { editUserProfileSchema } from '~/schema/edit-user-profile'
import { useNoSpace } from '@/composables/utils/input/useNoSpace'

const toast = useToast()
const { preventSpace } = useNoSpace()

const { editUserProfile } = useUserStore()
const { user } = storeToRefs(useUserStore())

const isOpen = ref(false)
const handleOpenModal = (payload: boolean) => {
	isOpen.value = payload
}

const isLoadingForm = ref(false)
const form = ref<IEditUserProfileForm>({
	fullname: user.value!.fullname,
	username: user.value!.username,
	email: user.value!.email,
})

const handleEditUserProfile = async (): Promise<void> => {
	if (isLoadingForm.value) return
	isLoadingForm.value = true

	const { data, error } = await editUserProfile({
		fullname: form.value.fullname,
		username: form.value.username,
		email: form.value.email,
	})

	if (error.value) {
		toast.add({
			color: 'red',
			title: 'Edit Profile',
			description: error.value.data.message,
		})
	} else if (data.value?.data) {
		const { fullname, username, email } = data.value.data
		user.value!.fullname = fullname
		user.value!.username = username
		user.value!.email = email

		toast.add({
			color: 'green',
			title: 'Edit Profile',
			description: data.value.message,
		})
	}

	isLoadingForm.value = false
	isOpen.value = false
}

const handleCancelEdit = (): void => {
	form.value.fullname = ''
	form.value.username = ''
	form.value.email = ''

	handleOpenModal(false)
}

defineExpose({
	handleOpenModal,
})
</script>

<style lang="scss" scoped>
.edit {
	&__header {
		@apply flex items-center justify-between;

		h3 {
			@apply text-base font-semibold leading-6 text-gray-900 dark:text-white;
		}

		button {
			@apply -my-1;
		}
	}

	&__body {
		@apply space-y-5;
	}

	&__actions {
		@apply flex items-center justify-between !mt-12;

		button {
			@apply w-28 justify-center p-3 rounded-none;
		}
	}
}
</style>
