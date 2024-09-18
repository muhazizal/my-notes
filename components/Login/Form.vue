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
		<UForm class="form__body" :schema="loginSchema" :state="form">
			<UFormGroup name="email" size="xl" eager-validation>
				<UInput v-model="form.email" class="form__input" placeholder="Email address" size="xl" />
			</UFormGroup>
			<UFormGroup name="password" size="xl" eager-validation>
				<UInput v-model="form.password" placeholder="Password" size="xl" :type="getPasswordType">
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
		</UForm>
		<div class="form__footer">
			<UButton color="primary" variant="link" :padded="false" @click="handleRedirectSignUp"
				>Forgot password?</UButton
			>
		</div>
		<div class="form__actions">
			<UButton class="form__actions__login" size="xl" :square="true">Log in</UButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { loginSchema } from '@/schema/login'
import type { LoginForm } from '@/types/login'

const form = ref<LoginForm>({
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

const handleRedirectSignUp = () => {
	const router = useRouter()
	router.push('/sign-up')
}
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
		@apply text-sm flex flex-row gap-1 mb-12;
	}

	&__body {
		@apply w-6/12 max-w-96 space-y-5;
	}

	&__footer {
		@apply mt-4 w-6/12 max-w-96 text-right;
	}

	&__actions {
		@apply mt-12 w-6/12 max-w-96 text-center;

		&__login {
			@apply w-52 justify-center p-3 rounded-none;
		}
	}
}
</style>
