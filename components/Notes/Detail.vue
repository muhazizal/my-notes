<template>
	<AppNavLinks v-if="isGreater('sm')" class="note__links" />
	<div class="note">
		<p class="note__date">{{ formattedUpdatedDate }}</p>
		<h4 class="note__title">{{ note.title }}</h4>
		<p class="note__desc">{{ note.description }}</p>
	</div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useNotes } from '~/composables/api/useNotes'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import type { INote } from '~/types/notes'

const { params } = useRoute()
const { isGreater } = useBreakpoints(breakpointsTailwind)

const { getNoteById } = useNotes()
const note = ref<INote>({
	createdAt: '',
	description: '',
	id: '',
	raw_description: '',
	title: '',
	updatedAt: '',
})
const formattedUpdatedDate = computed<string>(() =>
	format(note.value.updatedAt, "dd MMM yyyy 'at' HH:mm")
)

const { data } = await getNoteById(params.id as string)

if (data.value?.data) {
	note.value = data.value.data
}
</script>

<style lang="scss" scoped>
.note {
	@apply w-full h-full rounded-lg flex flex-col justify-center text-slate-600 transition-all transform;

	&__links {
		@apply mb-10;
	}

	&__date {
		@apply text-xs text-center;
	}

	&__title {
		@apply text-xl font-bold mt-4;
	}

	&__desc {
		@apply text-sm break-words mt-1;
	}
}
</style>
