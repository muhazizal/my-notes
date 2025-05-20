<template>
	<header class="nav border-b">
		<UContainer class="!py-4">
			<nav aria-label="Main navigation" class="nav__content">
				<UDropdown mode="hover" :items="items" :popper="{ placement: 'bottom-end' }">
					<div class="nav__dropdown">
						✋🏼 Hello {{ user?.fullname }}
						<UButton
							color="white"
							variant="ghost"
							trailing-icon="i-heroicons-chevron-down-20-solid"
						/>
					</div>
				</UDropdown>
			</nav>
		</UContainer>

		<UserEditProfile ref="userEditProfile" />
	</header>
</template>

<script setup lang="ts">
import UserEditProfile from '~/components/User/EditProfile.vue'

const { user } = storeToRefs(useUserStore())

const userEditProfile = useTemplateRef<InstanceType<typeof UserEditProfile>>('userEditProfile')

const items = ref([
	[
		{
			label: 'Edit Profile',
			icon: 'i-heroicons-pencil-square',
			click: () => {
				userEditProfile.value?.handleOpenModal(true)
			},
		},
	],
	[
		{
			label: 'Logout',
			labelClass: 'text-red-600',
			icon: 'i-heroicons-arrow-right-on-rectangle',
			iconClass: 'text-red-600',
		},
	],
])
</script>

<style lang="scss" scoped>
.nav {
	&__content {
		ul {
			@apply flex items-center;
		}
	}

	&__dropdown {
		@apply flex items-center;
	}
}
</style>
