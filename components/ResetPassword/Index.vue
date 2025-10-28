<template>
	<div class="form">
		<AppLogo class="form__logo" />
		<h2 class="form__title" data-test="reset-password-title">Reset Password.</h2>
		<div v-if="!isFailedReset && !isSuccessReset" class="form__caption">
			<p>Input your new password to reset your password</p>
		</div>
		<div v-if="isFailedReset" data-test="reset-password-fail">
			<div class="form__caption">
				<p>
					failed to reset your password, please
					<UButton
						color="primary"
						variant="link"
						:padded="false"
						@click="handleRedirectForgotPassword"
						data-test="reset-password-forgot-password"
						>request new url</UButton
					>
				</p>
			</div>
		</div>
		<div v-else-if="isSuccessReset">
			<div class="form__caption" data-test="reset-password-success">
				<p>
					Success to reset your password, please
					<UButton
						color="primary"
						variant="link"
						:padded="false"
						@click="handleRedirectSignIn"
						data-test="reset-password-sign-in"
						>Sign in</UButton
					>
					to continue
				</p>
			</div>
		</div>
		<div v-else>
			<div class="form__caption">
				<UForm
					class="form__body"
					:schema="resetPasswordSchema"
					:state="form"
					@submit="handleResetPassword"
					data-test="reset-password-form"
				>
					<UFormGroup name="password.real" size="xl" eager-validation>
						<UInput
							v-model="form.password.real"
							placeholder="New password"
							size="xl"
							type="password"
							@keypress="preventSpace"
							data-test="reset-password-real"
						/>
					</UFormGroup>
					<UFormGroup name="password.confirmation" size="xl" eager-validation>
						<UInput
							v-model="form.password.confirmation"
							placeholder="Confirm new password"
							size="xl"
							type="password"
							@keypress="preventSpace"
							data-test="reset-password-confirmation"
						/>
					</UFormGroup>
					<div class="form__actions">
						<UButton
							class="form__actions__submit"
							type="submit"
							size="xl"
							:square="true"
							:loading="isLoadingResetPassword"
							:disabled="isLoadingResetPassword"
							data-test="reset-password-submit"
							>Submit</UButton
						>
					</div>
				</UForm>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IResetPasswordForm } from '@/types/auth'
import { resetPasswordSchema } from '@/schema/reset-password'
import { useAuth } from '@/composables/api/useAuth'
import { useNoSpace } from '@/composables/utils/input/useNoSpace'

const toast = useToast()
const router = useRouter()
const { isLoadingResetPassword, resetPassword } = useAuth()
const { preventSpace } = useNoSpace()

const isSuccessReset = ref<boolean>(false)
const isFailedReset = ref<boolean>(false)
const form = ref<IResetPasswordForm>({
	password: {
		real: '',
		confirmation: '',
	},
})

const handleResetPassword = async (): Promise<void> => {
	const res = await resetPassword({
		password: form.value.password.real,
	})

	if (res) {
		toast.add({
			color: 'green',
			title: 'Reset Password',
			description: res.message,
		})
		isSuccessReset.value = true
	} else {
		isFailedReset.value = true
	}
}

const handleRedirectSignIn = (): void => {
	router.replace('/sign-in')
}
const handleRedirectForgotPassword = (): void => {
	router.replace('/forgot-password')
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
		@apply w-96 space-y-5;
	}

	&__actions {
		@apply max-w-96 text-center !mt-12;

		&__submit {
			@apply w-52 justify-center p-3 rounded-none;
		}
	}
}
</style>
