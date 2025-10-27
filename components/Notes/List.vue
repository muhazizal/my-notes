<template>
	<template v-if="error">
		<div class="text-center text-sm text-red-600 py-6">
			Unable to load notes. Please try again later.
		</div>
	</template>
	<template v-else>
		<NotesItem
			v-for="(note, index) in notes"
			:key="`notes-${index}`"
			role="button"
			data-test="note-item"
			@click="handleRedirectNote(note.id)"
		>
			<div class="flex flex-col items-center justify-center p-3">
				<h3 class="text-base font-bold mb-1">{{ note.title }}</h3>
				<p class="text-xs line-clamp-1">{{ note.description }}</p>
			</div>
		</NotesItem>
	</template>
</template>

<script setup lang="ts">
import { useNotes } from '~/composables/api/useNotes'

const router = useRouter()
const { notes, getNotes } = useNotes()

const { data, error } = await getNotes()
if (data.value?.data) {
	const newNotes = data.value.data
	notes.value = newNotes
}

const handleRedirectNote = (id: string): void => {
	router.push(`/notes/${id}`)
}
</script>

<styles scoped lang="scss"></styles>
