import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import fossyl from './packages/eslint-plugin/dist/index.js';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.js', '**/*.mjs'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      fossyl,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'fossyl/no-repo-import-outside-service': 'error',
    },
  },
];
