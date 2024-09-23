<template>
	<div class="form">
		<AppLogo class="form__logo" />
		<h2 class="form__title">Email Verification.</h2>
		<template v-if="isWaitingVerify">
			<div class="form__caption">
				<p>Please wait, email verification is on progress</p>
				<UProgress animation="carousel" />
			</div>
		</template>
		<template v-else-if="isSuccessVerify">
			<div class="form__caption">
				<p>
					Success to verify your email, please
					<UButton color="primary" variant="link" :padded="false" @click="handleRedirectSignIn"
						>Sign in</UButton
					>
					to continue
				</p>
			</div>
		</template>
		<template v-else>
			<template v-if="isSuccessResendVerification">
				<div class="form__caption">
					<p>Success to send new verification URL, please check your email</p>
				</div>
			</template>
			<template v-else>
				<div class="form__caption">
					<p>Failed to verify your email, please try again with new verification URL</p>
					<UButton
						class="form__caption__btn"
						size="xl"
						:square="true"
						:loading="isLoadingResendVerification"
						:disabled="isLoadingResendVerification"
						@click="handleResendVerification"
						>Resend Verification URL</UButton
					>
				</div>
			</template>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useVerify } from '@/composables/api/useVerify'

const route = useRoute()
const router = useRouter()
const { verify, resendVerification, isLoadingResendVerification } = useVerify()

const toast = useToast()
const { token } = route.params
const isWaitingVerify = ref<boolean>(true)
const isSuccessVerify = ref<boolean>(false)
const isSuccessResendVerification = ref<boolean>(false)

const handleVerify = async (): Promise<void> => {
	setTimeout(async (): Promise<void> => {
		const data = await verify(token)

		if (data) {
			isWaitingVerify.value = false
			isSuccessVerify.value = true
			toast.add({
				color: 'green',
				title: 'Verify Email',
				description: 'Success to verify email',
			})
		} else {
			isWaitingVerify.value = false
		}
	}, 1500)
}
const handleResendVerification = async (): Promise<void> => {
	const data = await resendVerification(token)

	if (data) {
		isSuccessResendVerification.value = true
		toast.add({
			color: 'green',
			title: 'Resend Email Verification URL',
			description: 'Success to resend email verification URL',
		})
	}
}

const handleRedirectSignIn = (): void => {
	router.replace('/')
}

onMounted(async (): Promise<void> => {
	await handleVerify()
})
</script>

<style lang="scss" scoped>
.form {
	@apply min-h-screen flex flex-col justify-center items-center;

	&__logo {
		@apply mb-16;
	}

	&__title {
		@apply text-3xl font-bold mb-3;
	}

	&__caption {
		@apply text-sm flex flex-col gap-1 mb-12;

		p {
			@apply mb-10;
		}

		&__btn {
			@apply w-56 justify-center p-3 rounded-none mx-auto;
		}
	}
}
</style>
