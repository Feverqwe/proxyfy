# Proxyfy - Chrome Extension

A Chrome extension for managing proxy configurations with support for multiple proxy types, pattern-based URL filtering, and PAC script generation.

## Features

- **Multiple Proxy Types**: Support for HTTP, HTTPS, SOCKS4, and SOCKS5 proxies
- **Pattern-based URL Filtering**: Configure which URLs use which proxy using wildcard patterns
- **PAC Script Generation**: Automatic PAC script generation for complex proxy configurations
- **Storage Options**: Choose between Chrome's sync and local storage for configuration
- **Material-UI Interface**: Modern, responsive user interface built with Material-UI

## Tech Stack

- **Language**: TypeScript
- **UI Framework**: React 18.2.0 with Material-UI 5.12.0
- **Build Tool**: Rspack 1.7.10
- **Testing**: Vitest 4.1.1
- **Validation**: Superstruct 1.0.3
- **Storage**: Chrome Extension Storage API

## Project Structure

```
src/
├── components/           # React components
│   ├── Options/         # Options page components
│   ├── Popup/           # Popup components
│   └── PageBase/        # Base page layout components
├── storage/             # Storage service implementations
├── tools/               # Utility functions and helpers
├── assets/              # Static assets (icons, HTML templates)
├── background.ts        # Background script
├── pacScript.ts         # PAC script generator
└── __tests__/           # Integration tests
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Build Commands

- **Development build**: `npm run build`
- **Production build**: `npm run release`
- **Watch mode**: `npm run watch`
- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint`
- **Testing**: `npm run test`

### Testing

The project uses Vitest for testing. All tests are located in `__tests__` directories throughout the codebase.

- Run all tests: `npm run test`
- Run TypeScript compilation check: `npm run typecheck`

## Build System

This project uses **Rspack** as the build system, which provides faster build times compared to Webpack while maintaining compatibility.

### Configuration Files

- **Rspack**: `rspack.config.ts`
- **TypeScript**: `tsconfig.json`
- **Vitest**: `vitest.config.ts`
- **ESLint**: `.eslintrc.json`
- **Prettier**: `.prettierrc.json`

## Migration History

This project has been successfully migrated from:

- **Jest → Vitest**: All tests migrated to Vitest 4.1.1
- **Webpack → Rspack**: Build system upgraded to Rspack 1.7.10

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

1. Ensure all tests pass: `npm run test`
2. Verify TypeScript compilation: `npm run typecheck`
3. Run linting: `npm run lint`
4. Test the build: `npm run build`

## License

ISC License