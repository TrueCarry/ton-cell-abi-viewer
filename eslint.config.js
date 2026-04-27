import js from '@eslint/js'
import solid from 'eslint-plugin-solid'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'src/block.tlb.ts', 'prettier.config.cjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        clearTimeout: 'readonly',
        console: 'readonly',
        decodeURIComponent: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        self: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
        Worker: 'readonly',
        window: 'readonly',
      },
    },
    plugins: {
      solid,
    },
    rules: {
      ...solid.configs.typescript.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
)
