import tsparser from '@typescript-eslint/parser';
import fossyl from '../dist/index.js';

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
      'fossyl/path-prefix-convention': ['warn', { prefixes: ['/api/'] }],
      'fossyl/consistent-naming': 'warn',
      'fossyl/no-mixed-prefixes': 'warn',
    },
  },
];
