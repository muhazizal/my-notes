<template>
	<div class="form">
		<AppLogo class="form__logo" />
		<h2 class="form__title" data-test="landing-title">Never Forget Anything 📝</h2>
		<div class="form__caption">
			<p>Write your notes and you will save time-energy to remember.</p>
		</div>
		<div class="form__actions">
			<UButton
				class="form__actions__item"
				size="xl"
				:square="true"
				@click="handleRedirectSignIn"
				data-test="landing-sign-in-button"
				>Sign in</UButton
			>
			<span>or</span>
			<UButton
				class="form__actions__item"
				size="xl"
				:square="true"
				@click="handleRedirectSignUp"
				data-test="landing-sign-up-button"
				>Sign up</UButton
			>
		</div>
	</div>
</template>

<script setup lang="ts">
const router = useRouter()

const handleRedirectSignIn = (): void => {
	router.replace('/sign-in')
}
const handleRedirectSignUp = (): void => {
	router.replace('/sign-up')
}
</script>

<style lang="scss" scoped>
.form {
	@apply min-h-[calc(100vh-32px)] sm:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] flex flex-col justify-center items-center;

	&__logo {
		@apply mb-16;
	}

	&__title {
		@apply text-7xl font-bold mb-8;
	}

	&__caption {
		@apply text-lg flex flex-row gap-1;
	}

	&__actions {
		@apply text-center !mt-16;

		span {
			@apply mx-6;
		}

		&__item {
			@apply w-44 justify-center p-3 rounded-none;
		}
	}
}
</style>
