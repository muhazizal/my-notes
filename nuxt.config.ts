// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: [
		'@nuxt/ui',
		'@pinia/nuxt',
		'@vueuse/nuxt',
		'@nuxt/test-utils/module',
		'@nuxt/image',
		'@nuxt/eslint',
		'@nuxtjs/google-fonts',
		'@nuxtjs/device',
	],
	compatibilityDate: '2024-09-17',
	ui: {
		global: true,
	},
	googleFonts: {
		families: {
			Raleway: true,
		},
	},
})
