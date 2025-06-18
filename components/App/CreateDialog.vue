<template>
	<UModal v-model="isOpen" class="create" prevent-close>
		<UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
			<template #header>
				<div class="create__header">
					<h3>{{ props.title }}</h3>
				</div>
			</template>

			<slot name="body" @open-modal="handleOpenModal"></slot>
		</UCard>
	</UModal>
</template>

<script lang="ts" setup>
const props = defineProps({
	title: { type: String, default: '' },
})

const isOpen = ref(false)
const handleOpenModal = (payload: boolean) => {
	isOpen.value = payload
}

defineExpose({
	handleOpenModal,
})
</script>

<style lang="scss">
.create {
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
		@apply flex items-center justify-end !mt-12 gap-3;

		button {
			@apply w-28 justify-center p-3 rounded-none;
		}
	}
}
</style>
