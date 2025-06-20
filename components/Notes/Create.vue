<template>
	<NotesItem role="button" @click="createNoteRef?.handleOpenModal(true)">
		<UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
		<span>Create Note</span>
	</NotesItem>

	<AppCreateDialog ref="createNoteRef" title="Create Note">
		<template #body>
			<UForm
				class="create__body"
				:schema="createNoteSchema"
				:state="form"
				@submit="handleCreateNote"
			>
				<UFormGroup name="title" size="xl" eager-validation>
					<UInput v-model="form.title" placeholder="Title" size="xl" />
				</UFormGroup>
				<UFormGroup name="description" size="xl" eager-validation>
					<UTextarea
						v-model="form.description"
						autoresize
						placeholder="Description"
						size="xl"
						:ui="{ rounded: 'rounded-none' }"
					/>
				</UFormGroup>
				<div class="create__actions">
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
						>Create</UButton
					>
				</div>
			</UForm>
		</template>
	</AppCreateDialog>
</template>

<script setup lang="ts">
import AppCreateDialog from '~/components/App/CreateDialog.vue'
import { useNotes } from '~/composables/api/useNotes'
import { createNoteSchema } from '@/schema/notes'
import type { ICreateNoteBody } from '@/types/notes'

const toast = useToast()

const createNoteRef = useTemplateRef<InstanceType<typeof AppCreateDialog>>('createNoteRef')

const isLoadingForm = ref(false)
const form = ref<ICreateNoteBody>({
	title: '',
	description: '',
})
const handleClearForm = (): void => {
	form.value.title = ''
	form.value.description = ''
}

const { notes, createNote } = useNotes()
const handleCreateNote = async (): Promise<void> => {
	if (isLoadingForm.value) return
	isLoadingForm.value = true

	const { data } = await createNote(form.value)

	if (data.value?.data) {
		const note = data.value.data
		notes.value.unshift(note)

		toast.add({
			color: 'green',
			title: 'Create Note',
			description: data.value.message,
		})
	}

	isLoadingForm.value = false
	createNoteRef.value?.handleOpenModal(false)
}
const handleCancel = (): void => {
	handleClearForm()
	createNoteRef.value?.handleOpenModal(false)
}
</script>

<style lang="scss" scoped></style>
