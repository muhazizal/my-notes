<template>
	<NotesItem
		role="button"
		@click="handleRedirectNote('1')"
		v-for="(note, index) in notes"
		:key="`notes-${index}`"
	>
		<div class="flex flex-col items-center justify-center p-3">
			<h3 class="text-base font-bold mb-1">{{ note.title }}</h3>
			<p class="text-xs line-clamp-1">{{ note.description }}</p>
		</div>
	</NotesItem>
</template>

<script setup lang="ts">
import { useNotes } from '~/composables/api/useNotes'

const router = useRouter()
const { notes, getNotes } = useNotes()

const { data } = await getNotes()
if (data.value?.data) {
	const newNotes = data.value.data
	notes.value = newNotes
}

const handleRedirectNote = (id: string): void => {
	router.push(`/notes/${id}`)
}
</script>

<styles scoped lang="scss"></styles>
