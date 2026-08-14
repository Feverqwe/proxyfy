import gravityConfig from '@gravity-ui/eslint-config';
import importOrderConfig from '@gravity-ui/eslint-config/import-order';
import prettierConfig from '@gravity-ui/eslint-config/prettier';
import reactConfig from '@gravity-ui/eslint-config/react';

export default [
  {
    ignores: ['dist/**', 'storybook-static/**'],
  },
  ...gravityConfig,
  ...reactConfig,
  ...importOrderConfig,
  ...prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/parameter-properties': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'consistent-return': 'off',
      'no-param-reassign': 'off',
      'no-nested-ternary': 'off',
      'no-negated-condition': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/pacScript.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off',
    },
  },
  {
    files: ['src/services/pac/pacService.ts'],
    rules: {
      'no-control-regex': 'off',
    },
  },
];
