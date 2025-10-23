<template>
	<UProgress
		v-show="loading"
		:value="progress"
		color="primary"
		class="fixed top-0 left-0 right-0 z-50 h-[3px] transition-all duration-300 ease-out bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
	/>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const progress = ref(0)
let timer

const startProgress = () => {
	loading.value = true
	progress.value = 0

	// simulate a natural loading ramp
	timer = setInterval(() => {
		if (progress.value < 90) {
			progress.value += Math.random() * 5 // random increments for realism
		}
	}, 200)
}

const finishProgress = () => {
	progress.value = 100
	setTimeout(() => {
		loading.value = false
		progress.value = 0
		clearInterval(timer)
	}, 400) // short fade-out delay
}

onMounted(() => {
	router.beforeEach(() => startProgress())
	router.afterEach(() => finishProgress())
})

onBeforeUnmount(() => clearInterval(timer))
</script>
