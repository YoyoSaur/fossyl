import tsparser from '@typescript-eslint/parser';
import fossyl from 'eslint-plugin-fossyl';

export default [
  {
    ignores: ['**/dist/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: { fossyl },
    rules: {
      'fossyl/no-repo-import-outside-service': 'error',
      'fossyl/no-duplicate-routes': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
