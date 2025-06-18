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

		<AppCreateDialog ref="userEditProfile" title="Edit Profile">
			<template #body="{ onOpenModal }">
				<UserEditProfile @on-open-modal="onOpenModal" />
			</template>
		</AppCreateDialog>
		<UserLogout ref="userLogout" />
		<UserDelete ref="userDelete" />
	</header>
</template>

<script setup lang="ts">
import AppCreateDialog from '~/components/App/CreateDialog.vue'
import UserLogout from '~/components/User/Logout.vue'
import UserDelete from '~/components/User/Delete.vue'

const { user } = storeToRefs(useUserStore())

const userEditProfile = useTemplateRef<InstanceType<typeof AppCreateDialog>>('userEditProfile')
const userLogout = useTemplateRef<InstanceType<typeof UserLogout>>('userLogout')
const userDelete = useTemplateRef<InstanceType<typeof UserDelete>>('userDelete')

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
			click: () => {
				userLogout.value?.handleOpenModal(true)
			},
		},
	],
	[
		{
			label: 'Delete Account',
			labelClass: 'text-red-600',
			icon: 'i-heroicons-trash',
			iconClass: 'text-red-600',
			click: () => {
				userDelete.value?.handleOpenModal(true)
			},
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
