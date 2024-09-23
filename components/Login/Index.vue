<template>
	<div class="form">
		<AppLogo class="form__logo" />
		<h2 class="form__title">Welcome back!</h2>
		<div class="form__caption">
			<p>Don't have an account yet?</p>
			<UButton color="primary" variant="link" :padded="false" @click="handleRedirectSignUp"
				>Sign up now</UButton
			>
		</div>
		<UForm class="form__body" :schema="loginSchema" :state="form" @submit="handleLogin">
			<UFormGroup name="email" size="xl" eager-validation>
				<UInput
					v-model="form.email"
					class="form__input"
					placeholder="Email address"
					size="xl"
					@keypress="preventSpace"
				/>
			</UFormGroup>
			<UFormGroup name="password" size="xl" eager-validation>
				<UInput
					v-model="form.password"
					placeholder="Password"
					size="xl"
					:type="getPasswordType"
					@keypress="preventSpace"
				>
					<template #trailing>
						<UButton
							color="gray"
							variant="link"
							:padded="false"
							:icon="getPasswordIcon"
							@click="handleShowPassword()"
						/>
					</template>
				</UInput>
			</UFormGroup>
			<div class="form__footer">
				<UButton
					color="primary"
					variant="link"
					:padded="false"
					@click="handleRedirectForgotPassword"
					>Forgot password?</UButton
				>
			</div>
			<div class="form__actions">
				<UButton
					class="form__actions__login"
					type="submit"
					size="xl"
					:square="true"
					:loading="isLoadingLogin"
					:disabled="isLoadingLogin"
					>Log in</UButton
				>
			</div>
		</UForm>
	</div>
</template>

<script setup lang="ts">
import type { ILoginBody } from '@/types/login'
import { loginSchema } from '@/schema/login'
import { useLogin } from '@/composables/api/useLogin'
import { useNoSpace } from '@/composables/utils/input/useNoSpace'

const toast = useToast()
const router = useRouter()
const { isLoadingLogin, login } = useLogin()
const { preventSpace } = useNoSpace()

const form = ref<ILoginBody>({
	email: '',
	password: '',
})

const showPassword = ref<boolean>(false)
const handleShowPassword = (): void => {
	if (showPassword.value) {
		showPassword.value = false
	} else {
		showPassword.value = true
	}
}
const getPasswordIcon = computed<string>(() =>
	showPassword.value ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'
)
const getPasswordType = computed<string>(() => (showPassword.value ? 'text' : 'password'))

const handleLogin = async (): Promise<void> => {
	const res = await login(form.value)

	if (res) {
		toast.add({
			color: 'green',
			title: 'Login',
			description: res.message,
		})
		// router.replace('/notes')
	}
}

const handleRedirectSignUp = () => {
	router.replace('/sign-up')
}
const handleRedirectForgotPassword = () => {
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
		@apply w-6/12 max-w-96 space-y-5;
	}

	&__footer {
		@apply max-w-96 text-right;
	}

	&__actions {
		@apply max-w-96 text-center !mt-12;

		&__login {
			@apply w-52 justify-center p-3 rounded-none;
		}
	}
}
</style>
