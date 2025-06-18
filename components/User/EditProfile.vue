<template>
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
			<UInput v-model="form.username" placeholder="Username" size="xl" @keypress="preventSpace" />
		</UFormGroup>
		<UFormGroup name="email" size="xl" eager-validation>
			<UInput v-model="form.email" placeholder="Email address" size="xl" @keypress="preventSpace" />
		</UFormGroup>
		<div class="edit__actions">
			<UButton
				size="xl"
				variant="outline"
				color="gray"
				:square="true"
				:disabled="isLoadingForm"
				@click="handleCancel"
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
</template>

<script lang="ts" setup>
import type { IEditUserProfileForm } from '~/types/user'
import { editUserProfileSchema } from '~/schema/edit-user-profile'
import { useNoSpace } from '@/composables/utils/input/useNoSpace'

const emit = defineEmits<{
	(e: 'on-open-modal', payload: boolean): void
}>()

const toast = useToast()
const { preventSpace } = useNoSpace()

const { editUserProfile } = useUserStore()
const { user } = storeToRefs(useUserStore())

const isLoadingForm = ref(false)
const form = ref<IEditUserProfileForm>({
	fullname: '',
	username: '',
	email: '',
})

const handleInitForm = (): void => {
	form.value.fullname = user.value.fullname
	form.value.username = user.value.username
	form.value.email = user.value.email
}
const handleClearForm = (): void => {
	form.value.fullname = ''
	form.value.username = ''
	form.value.email = ''
}

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
	emit('on-open-modal', false)
}

const handleCancel = (): void => {
	handleClearForm()
	emit('on-open-modal', false)
}

onMounted(() => {
	handleInitForm()
})
</script>
