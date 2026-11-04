import prettierPlugin from 'eslint-plugin-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
    },
  },
)
