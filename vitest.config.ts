/// <reference types="vitest" />

import {defineConfig} from 'vitest/config';

// Set debug environment variable
process.env.DEBUG = 'app:*';

export default defineConfig({
  test: {
    // The test environment that will be used for testing
    environment: 'jsdom',

    // A list of paths to modules that run some code to configure or set up the testing framework before each test
    setupFiles: ['./vitest.setup.ts'],

    // The glob patterns Vitest uses to detect test files
    include: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    exclude: [
      '**/node_modules/**',
      '**/__tests__/mocks/chromeMocks.ts',
      '**/__tests__/mocks/storageMocks.ts',
      '**/__tests__/mocks/index.ts',
      '**/__tests__/utils/testHelpers.ts',
    ],

    // Global configuration
    globals: true,

    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});
