const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'no-undef': [0],
      '@typescript-eslint/ban-ts-comment': [0],
      'no-control-regex': [0],
      'array-callback-return': [0],
      'class-methods-use-this': [0],
      'no-unused-expressions': [0],
      'unused-imports/no-unused-imports': 'error',
      'object-curly-spacing': [0],
      'import/extensions': [0],
      'import/prefer-default-export': [0],
      'no-unused-vars': [0],
      '@typescript-eslint/no-empty-function': [0],
      'object-curly-newline': [0],
      'default-case': [0],
      'no-use-before-define': [0],
      'arrow-body-style': [0],
      'no-shadow': [0],
      'no-restricted-globals': [0],
      'max-classes-per-file': [0],
      '@typescript-eslint/no-explicit-any': [0],
      'no-console': [0],
      'max-len': [0],
      'no-mixed-operators': [0],
      'consistent-return': [0],
      'no-param-reassign': [0],
      'no-nested-ternary': [0],
      'no-plusplus': [0],
      'no-cond-assign': [1],
      '@typescript-eslint/no-empty-interface': [0],
      '@typescript-eslint/no-non-null-assertion': [0],
      '@typescript-eslint/no-unused-vars': [0],
      'function-paren-newline': [0],
      'operator-linebreak': [0],
      'indent': [0],
      'space-before-function-paren': [0],
      'no-spaced-func': [0],
      'func-call-spacing': [0],
      'implicit-arrow-linebreak': [0],
      'wrap-iife': [0],
    },
  },
];