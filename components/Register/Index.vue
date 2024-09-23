<template>
	<div class="form">
		<AppLogo class="form__logo" />
		<h2 class="form__title">Create new account.</h2>
		<template v-if="isRegisterSuccess">
			<div class="form__caption--success">
				<p>Success to register your account</p>
				<p>Please check your email to complete verification process</p>
				<UButton
					class="form__caption__action"
					color="primary"
					size="xl"
					:square="true"
					@click="handleRedirectSignIn"
					>Sign in now</UButton
				>
			</div>
		</template>
		<template v-else>
			<div class="form__caption">
				<p>Already have an account?</p>
				<UButton color="primary" variant="link" :padded="false" @click="handleRedirectSignIn"
					>Sign in now</UButton
				>
			</div>
			<UForm class="form__body" :schema="registerSchema" :state="form" @submit="handleRegister">
				<UFormGroup name="fullname" size="xl" eager-validation>
					<UInput v-model="form.fullname" placeholder="Full name" size="xl" />
				</UFormGroup>
				<UFormGroup name="username" size="xl" eager-validation>
					<UInput
						v-model="form.username"
						placeholder="Username"
						size="xl"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<UFormGroup name="email" size="xl" eager-validation>
					<UInput
						v-model="form.email"
						placeholder="Email address"
						size="xl"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<UFormGroup name="password.real" size="xl" eager-validation>
					<UInput
						v-model="form.password.real"
						placeholder="Password"
						size="xl"
						type="password"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<UFormGroup name="password.confirmation" size="xl" eager-validation>
					<UInput
						v-model="form.password.confirmation"
						placeholder="Confirm password"
						size="xl"
						type="password"
						@keypress="preventSpace"
					/>
				</UFormGroup>
				<UFormGroup name="tnc" size="xl" eager-validation>
					<UCheckbox v-model="form.tnc" name="tnc" label="Term & Conditions" />
				</UFormGroup>
				<div class="form__actions">
					<UButton
						class="form__actions__register"
						type="submit"
						size="xl"
						:square="true"
						:loading="isLoadingRegister"
						:disabled="isLoadingRegister"
						>Sign Up</UButton
					>
				</div>
			</UForm>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { IRegisterForm } from '@/types/register'
import { registerSchema } from '@/schema/register'
import { useRegister } from '@/composables/api/useRegister'
import { useNoSpace } from '@/composables/utils/input/useNoSpace'

const toast = useToast()
const router = useRouter()
const { isLoadingRegister, register } = useRegister()
const { preventSpace } = useNoSpace()

const form = ref<IRegisterForm>({
	fullname: '',
	username: '',
	email: '',
	password: {
		real: '',
		confirmation: '',
	},
	tnc: false,
})
const isRegisterSuccess = ref<boolean>(false)

const handleRegister = async (): Promise<void> => {
	const res = await register({
		fullname: form.value.fullname,
		username: form.value.username,
		email: form.value.email,
		password: form.value.password.real,
	})

	if (res) {
		toast.add({
			color: 'green',
			title: 'Register',
			description: res.message,
		})
		isRegisterSuccess.value = true
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
		@apply text-sm flex flex-row gap-1 mb-12 text-center;

		&--success {
			@apply flex-col;
		}

		&__action {
			@apply mx-auto mt-12 rounded-none p-3 w-52 justify-center;
		}
	}

	&__body {
		@apply w-6/12 max-w-96 space-y-5;
	}

	&__actions {
		@apply max-w-96 text-center !mt-12;

		&__register {
			@apply w-52 justify-center p-3 rounded-none;
		}
	}
}
</style>
