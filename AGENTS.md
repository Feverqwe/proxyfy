# AGENTS.md

This file is the canonical guide for AI coding agents working in this repository.
Keep tool-specific instruction files small and point them here so that project rules stay in sync.

## Project overview

Proxyfy is a Manifest V3 Chrome extension for switching between direct, fixed-server, system,
auto-detect, and PAC-script proxy modes. It is written in strict TypeScript with React and MUI,
bundled by Rspack, and tested with Vitest in `jsdom`.

The extension has four build entry points:

- `src/background.ts` initializes the background service worker.
- `src/Popup.tsx` mounts the toolbar popup UI.
- `src/Options.tsx` mounts the options UI.
- `src/pacScript.ts` becomes the PAC runtime embedded by `src/services/pac/pacService.ts`.

## Repository map

- `src/components/` — React UI, page layouts, hooks, and theme configuration.
- `src/services/background/` — Chrome event listeners and background orchestration.
- `src/services/proxy/` — proxy selection, application, and current-state logic.
- `src/services/pac/` — PAC configuration and script construction.
- `src/storage/` — local/sync Chrome storage abstractions and selection.
- `src/tools/` — configuration schemas and focused utilities.
- `src/types/` — shared TypeScript declarations.
- `src/**/__tests__/` — unit and integration tests; shared Chrome mocks live under
  `src/__tests__/mocks/`.
- `src/assets/manifest.json` — source extension manifest.
- `builder/` and `rspack.config.ts` — packaging and build configuration.
- `dist/` — generated build output; never edit or commit it.

## Working rules

1. Read the nearest relevant source and tests before changing behavior. Keep patches scoped; do not
   refactor unrelated code or silently alter public behavior.
2. Treat `src/` and build configuration as source of truth. Do not hand-edit files in `dist/`.
3. Preserve Chrome extension boundaries. UI code communicates through Chrome APIs; service-worker
   code cannot depend on a DOM; PAC code runs in a constrained, separate runtime.
4. When changing messages, stored configuration, or proxy modes, update every producer and consumer
   together. Preserve compatibility with existing stored user data unless a migration is included.
5. Keep `src/assets/manifest.json` permissions minimal. Explain and test any new permission.
6. Never log proxy credentials, complete private configurations, or other sensitive storage values.
7. Prefer the existing storage services and `StorageFactory` over direct `chrome.storage` access.
   The selected proxy configuration may use sync or local storage, while storage preferences and
   UI-only state can intentionally remain local.
8. Keep PAC generation deterministic and browser-compatible. Add tests for wildcard/regexp matching,
   exclusions, ordering, and fallbacks when those semantics change.
9. Follow the existing TypeScript style: single quotes, no spaces inside braces, trailing commas,
   and a 100-column target. Let Prettier decide formatting.
10. Use explicit types at Chrome API, storage, message, and configuration boundaries. Avoid adding
    `any`; validate untrusted or persisted configuration with the existing Superstruct schemas.

## Commands

Install dependencies from the lockfile:

```bash
npm ci
```

Use non-watch mode in automated agent runs:

```bash
npm test -- --run
```

Other checks:

```bash
npm run typecheck
npm run prettier
npm run lint
npm run build
```

`npm run lint` already runs ESLint, Prettier checking, and TypeScript checking. During iteration,
prefer the narrowest useful test command, for example:

```bash
npm test -- --run src/tools/__tests__/wildcardToRegexpStr.test.ts
```

Run `npm run release` only when the task explicitly concerns a production archive or release. It
rebuilds generated output and creates a zip in `dist/`.

## Testing expectations

- Add or update a test for every behavior change and regression fix.
- Put focused tests beside the module in its `__tests__` directory; use `src/__tests__/` for behavior
  spanning multiple subsystems.
- Reuse the Chrome mocks in `src/__tests__/mocks/` and reset mock/singleton state between tests.
- Test success, error, and storage-switching paths when changing asynchronous Chrome API code.
- Snapshot changes must be intentional and reviewed, not accepted merely to make a test pass.
- `npm run typecheck` follows `tsconfig.json`, which excludes test directories; passing it does not
  prove that test-only code is type-correct.

## Definition of done

Before handing off a code change:

- Run the most relevant tests plus `npm run lint`.
- Run `npm run build` when entry points, assets, the manifest, dependencies, or build config changed.
- Report which checks ran and any checks that could not run.
- Review the diff for generated files, credentials, debug output, unrelated formatting, and accidental
  permission changes.
- For user-visible extension changes, describe a short manual Chrome verification path when it was
  not possible to load the unpacked extension in a browser.
