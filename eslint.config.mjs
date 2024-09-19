import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
	files: ['**/*.ts', '**/*.tsx'],
	rules: {
		'no-constant-binary-expression': 'off',
		'no-console': 'off',
	},
})
