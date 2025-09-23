// eslint.config.ts
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // Global ignores
  { ignores: ['dist/**', 'node_modules/**', '**/*.d.ts'] },

  // JS baseline
  js.configs.recommended,

  // 1) Config/Node files (type-aware via dedicated project)
  {
    files: [
      '**/*.config.{js,cjs,mjs,ts}',
      'vite.config.{js,ts}',
      'eslint.config.{js,ts}'
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.node.json'], // bind type-checking to node config project
        tsconfigRootDir: process.cwd()
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
    // keep rules minimal on configs
    rules: {}
  },

  // 2) App source (TS) — type-aware via main project
  {
    files: ['src/**/*.{ts,tsx}'], // scope to src/ to avoid matching config files again
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      'no-constant-binary-expression': 'error',
      'no-implicit-coercion': ['error', { boolean: false }],
      'no-new': 'error',
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'all']
    }
  },

  // Prettier LAST
  prettier
]
