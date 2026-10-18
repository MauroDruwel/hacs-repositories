import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/data/**'],
  },
  {
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
]
