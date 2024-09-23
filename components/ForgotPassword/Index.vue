<template>
	<div class="form">
		<AppLogo class="form__logo" />
		<h2 class="form__title">Forgot Password.</h2>
		<template v-if="isSuccessForgotPassword">
			<p>Success to send reset password URL, please check your email.</p>
		</template>
		<template v-else>
			<div class="form__caption">
				<p>Already remember your password?</p>
				<UButton color="primary" variant="link" :padded="false" @click="handleRedirectSignIn"
					>Sign in now</UButton
				>
			</div>
			<UForm
				class="form__body"
				:schema="forgotPasswordSchema"
				:state="form"
				@submit="handleForgotPassword"
			>
				<UFormGroup name="email" size="xl" eager-validation>
					<UInput
						v-model="form.email"
						class="form__input"
						placeholder="Email address"
						size="xl"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<div class="form__actions">
					<UButton
						class="form__actions__submit"
						type="submit"
						size="xl"
						:square="true"
						:loading="isLoadingForgotPassword"
						:disabled="isLoadingForgotPassword"
						>Submit</UButton
					>
				</div>
			</UForm>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { IForgotPasswordBody } from '@/types/forgot-password'
import { forgotPasswordSchema } from '@/schema/forgot-password'
import { useForgotPassword } from '@/composables/api/useForgotPassword'
import { useNoSpace } from '@/composables/utils/input/useNoSpace'

const toast = useToast()
const router = useRouter()
const { isLoadingForgotPassword, forgotPassword } = useForgotPassword()
const { preventSpace } = useNoSpace()

const isSuccessForgotPassword = ref<boolean>(false)
const form = ref<IForgotPasswordBody>({
	email: '',
})

const handleForgotPassword = async (): Promise<void> => {
	const res = await forgotPassword(form.value)

	if (res) {
		toast.add({
			color: 'green',
			title: 'Forgot Password',
			description: res.message,
		})
		isSuccessForgotPassword.value = true
	}
}

const handleRedirectSignIn = () => {
	router.replace('/')
}
</script>

<style lang="scss" scoped>
.form {
	@apply min-h-[calc(100vh-32px)] sm:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] flex flex-col justify-center items-center;

	&__logo {
		@apply mb-16;
	}

	&__title {
		@apply text-3xl font-bold mb-3;
	}

	&__caption {
		@apply text-sm flex flex-row gap-1 mb-12;
	}

	&__body {
		@apply w-6/12 max-w-96 space-y-5;
	}

	&__footer {
		@apply max-w-96 text-right;
	}

	&__actions {
		@apply max-w-96 text-center !mt-12;

		&__submit {
			@apply w-52 justify-center p-3 rounded-none;
		}
	}
}
</style>
