# Proxyfy - Chrome Extension

A Chrome extension for managing proxy configurations with support for multiple proxy types, pattern-based URL filtering, and PAC script generation.

## Features

- **Multiple Proxy Types**: Support for HTTP, HTTPS, SOCKS4, and SOCKS5 proxies
- **Direct and QUIC Modes**: Configure direct connections and QUIC proxies
- **Pattern-based URL Filtering**: Configure which URLs use which proxy using wildcard patterns
- **PAC Script Generation**: Automatic PAC script generation for complex proxy configurations
- **Storage Options**: Choose between Chrome's sync and local storage for configuration
- **Material-UI Interface**: Modern, responsive user interface built with Material-UI
- **Storybook**: Develop popup, options pages, and reusable controls in isolation

## Tech Stack

- **Runtime**: Node.js 24
- **Language**: TypeScript 6
- **UI Framework**: React 19 with Material UI 9
- **Routing**: React Router 8
- **Build Tool**: Rspack 2
- **Component Development**: Storybook 10 with Vite
- **Testing**: Vitest 4 with `jsdom`
- **Validation**: Superstruct 2
- **Storage**: Chrome Extension Storage API

## Project Structure

```
src/
├── components/           # React components
│   ├── Options/         # Options page components
│   ├── Popup/           # Popup components
│   └── PageBase/        # Base page layout components
├── services/            # Background, proxy, PAC, and UI services
├── storage/             # Storage service implementations
├── tools/               # Utility functions and helpers
├── types/               # Shared TypeScript declarations
├── assets/              # Static assets (icons, HTML templates)
├── background.ts        # Background script
├── pacScript.ts         # PAC script generator
└── __tests__/           # Integration tests

.storybook/              # Storybook config and Chrome API mock
builder/                 # Production archive scripts
```

## Development

### Prerequisites

- Node.js 24 (pinned in `.nvmrc`)
- npm

### Installation

1. Clone the repository
2. Select the project Node.js version and install dependencies from the lockfile:

   ```bash
   nvm use
   npm ci
   ```

### Build Commands

- **Development build**: `npm run build`
- **Production build**: `npm run release`
- **Watch mode**: `npm run watch`
- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint`
- **Testing**: `npm test -- --run`
- **Storybook**: `npm run storybook`
- **Static Storybook build**: `npm run build-storybook`

### Testing

The project uses Vitest for testing. All tests are located in `__tests__` directories throughout the codebase.

- Run all tests once: `npm test -- --run`
- Run TypeScript compilation check: `npm run typecheck`

## Build System

This project uses **Rspack** as the build system, which provides faster build times compared to Webpack while maintaining compatibility.

### Configuration Files

- **Rspack**: `rspack.config.mts`
- **TypeScript**: `tsconfig.json`
- **Vitest**: `vitest.config.mts`
- **ESLint**: `eslint.config.mjs`
- **Prettier**: `.prettierrc.mjs`
- **Storybook**: `.storybook/main.ts` and `.storybook/preview.tsx`
- **Node.js**: `.nvmrc`

## Migration History

This project has been successfully migrated from:

- **Jest → Vitest**: Tests run with Vitest in `jsdom`
- **Webpack → Rspack**: Extension bundles are built with Rspack

All migrations were completed with full test coverage and functionality preservation.

## Chrome Extension Structure

### Entry Points

- **Background Script**: `src/background.ts`
- **Popup**: `src/Popup.tsx`
- **Options Page**: `src/Options.tsx`
- **PAC Script**: `src/pacScript.ts`

### Manifest

The extension manifest is located at `src/assets/manifest.json`.

## Contributing

1. Ensure all tests pass: `npm test -- --run`
2. Verify TypeScript compilation: `npm run typecheck`
3. Run linting: `npm run lint`
4. Test the build: `npm run build`
5. If stories or Storybook configuration changed, run `npm run build-storybook`

## License

ISC License
