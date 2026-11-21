import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist', 'node_modules', 'public'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      // Film state is a pure function of fixtures and frame: no wall clock, timers or randomness.
      'no-restricted-globals': ['error', 'setTimeout', 'setInterval', 'requestAnimationFrame'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'No randomness: frame state must be deterministic.' },
        { object: 'Date', property: 'now', message: 'No wall clock: frame state must be deterministic.' },
      ],
    },
  },
  {
    files: ['*.config.{ts,js}', 'scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
)
