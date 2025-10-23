<template>
	<div class="note">
		<div class="note__header">
			<UButton
				color="gray"
				variant="link"
				icon="i-heroicons-arrow-left"
				:padded="false"
				@click="handleBack"
			>
				Back to Notes
			</UButton>

			<div class="note__actions">
				<UButton
					size="sm"
					icon="i-heroicons-pencil-square"
					color="primary"
					:loading="isUpdating"
					:disabled="isUpdating"
					@click="updateNoteRef?.handleOpenModal(true)"
				>
					Update
				</UButton>
				<UButton
					size="sm"
					icon="i-heroicons-trash"
					color="red"
					:loading="isDeleting"
					:disabled="isDeleting"
					@click="handleDeleteNote"
				>
					Delete
				</UButton>
			</div>
		</div>

		<hr />

		<div v-if="pending" class="note__skeleton">
			<div class="h-4 w-24 bg-slate-200 animate-pulse rounded mb-4"></div>
			<div class="h-6 w-3/4 bg-slate-200 animate-pulse rounded mb-2"></div>
			<div class="h-4 w-full bg-slate-200 animate-pulse rounded mb-1"></div>
			<div class="h-4 w-11/12 bg-slate-200 animate-pulse rounded"></div>
		</div>

		<div v-else-if="error" class="note__error">
			<p class="mb-4">Unable to load note. It may have been moved or deleted.</p>
			<UButton color="gray" variant="link" :padded="false" @click="handleBack"
				>Back to Notes</UButton
			>
		</div>

		<template v-else>
			<p class="note__date">{{ formattedUpdatedDate }}</p>
			<h4 class="note__title">{{ note.title }}</h4>
			<p class="note__desc whitespace-pre-line">{{ note.description }}</p>
		</template>

		<AppCreateDialog ref="updateNoteRef" title="Update Note">
			<template #body>
				<UForm
					class="create__body"
					:schema="createNoteSchema"
					:state="form"
					@submit="handleUpdateNote"
				>
					<UFormGroup name="title" size="xl" eager-validation>
						<UInput v-model="form.title" placeholder="Title" size="xl" />
					</UFormGroup>
					<UFormGroup name="description" size="xl" eager-validation>
						<UTextarea
							v-model="form.description"
							autoresize
							:maxrows="10"
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
							:disabled="isUpdating"
							@click="handleClearForm"
							>Cancel</UButton
						>
						<UButton
							type="submit"
							size="xl"
							:square="true"
							:loading="isUpdating"
							:disabled="isUpdating"
							>Update</UButton
						>
					</div>
				</UForm>
			</template>
		</AppCreateDialog>
	</div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useNotes } from '~/composables/api/useNotes'
import { createNoteSchema } from '~/schema/notes'
import AppCreateDialog from '~/components/App/CreateDialog.vue'
import type { INote } from '~/types/notes'
import type { IUpdateNoteBody } from '~/types/notes'

const router = useRouter()
const toast = useToast()
const { params } = useRoute()

const { getNoteById, deleteNote, updateNote } = useNotes()
const note = ref<INote>({
	createdAt: '',
	description: '',
	id: '',
	raw_description: '',
	title: '',
	updatedAt: '',
})
const formattedUpdatedDate = computed<string>(() => {
	const dateStr = note.value.updatedAt || note.value.createdAt
	return dateStr ? format(dateStr, "dd MMM yyyy 'at' HH:mm") : ''
})

const { data, pending, error } = await getNoteById(params.id as string)

if (data.value?.data) {
	note.value = data.value.data
}

const handleBack = (): void => {
	router.push('/notes')
}

const updateNoteRef = useTemplateRef<InstanceType<typeof AppCreateDialog>>('updateNoteRef')
const form = ref<IUpdateNoteBody>({
	title: note.value.title,
	description: note.value.description,
})
const handleClearForm = async (): Promise<void> => {
	updateNoteRef.value?.handleOpenModal(false)

	await nextTick()

	form.value.title = ''
	form.value.description = ''
}
const isUpdating = ref(false)
const handleUpdateNote = async (): Promise<void> => {
	if (!note.value.id || isUpdating.value) return
	isUpdating.value = true

	const { data: updateData, error: updateError } = await updateNote({
		id: note.value.id,
		body: {
			title: form.value.title,
			description: form.value.description,
		},
	})

	if (!updateError.value) {
		toast.add({
			color: 'green',
			title: 'Update Note',
			description: updateData.value?.message || 'Note updated',
		})
		note.value = updateData.value?.data || note.value
		handleClearForm()
	}
	isUpdating.value = false
}

const isDeleting = ref(false)
const handleDeleteNote = async (): Promise<void> => {
	if (!note.value.id || isDeleting.value) return
	isDeleting.value = true

	const { data: delData, error: delError } = await deleteNote(note.value.id)

	if (!delError.value) {
		toast.add({
			color: 'green',
			title: 'Delete Note',
			description: delData.value?.message || 'Note deleted',
		})
		router.replace('/notes')
	}
	isDeleting.value = false
}

useHead(() => ({
	title: note.value.title ? `${note.value.title} • Notes` : 'Note • My Notes',
}))
</script>

<style lang="scss" scoped>
.note {
	@apply w-full min-h-[calc(100vh-32px)] sm:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] rounded-lg flex flex-col justify-start text-slate-600 transition-all transform;

	&__header {
		@apply flex items-center justify-between mb-6;
	}

	&__actions {
		@apply flex items-center gap-2;
	}

	&__skeleton {
		@apply max-w-3xl mx-auto w-full mt-4;
	}

	&__error {
		@apply max-w-3xl mx-auto w-full mt-4 text-center;
	}

	&__date {
		@apply text-xs mt-6;
	}

	&__title {
		@apply text-2xl font-bold mt-10 text-center;
	}

	&__desc {
		@apply text-base break-words mt-4 max-w-3xl mx-auto;
	}
}
</style>
