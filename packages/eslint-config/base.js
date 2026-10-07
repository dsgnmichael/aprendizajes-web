import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

/** Shared rules for every TypeScript package in the monorepo. */
export const baseRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
  eqeqeq: ['error', 'smart'],
}

export default tseslint.config(
  { ignores: ['dist/**', '.turbo/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: baseRules,
  },
)
