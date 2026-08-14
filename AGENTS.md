# AGENTS.md

This file is the canonical guide for AI coding agents working in this repository.
Keep tool-specific instruction files small and point them here so that project rules stay in sync.

## Project overview

Proxyfy is a Manifest V3 Chrome extension for switching between direct, fixed-server, system,
auto-detect, and PAC-script proxy modes. It is written in strict TypeScript with React and MUI,
bundled by Rspack, tested with Vitest in `jsdom`, and developed visually with Storybook.

The extension has four build entry points:

- `src/background.ts` initializes the background service worker.
- `src/Popup.tsx` mounts the toolbar popup UI.
- `src/Options.tsx` mounts the options UI.
- `src/pacScript.ts` becomes the PAC runtime embedded by `src/services/pac/pacService.ts`.

## Repository map

- `src/components/` — React UI, page layouts, hooks, and theme configuration.
- `src/domain/proxy/` — pure proxy state, configuration mutations, and credential split/merge logic.
- `src/services/background/` — Chrome event listeners and background orchestration.
- `src/services/config/` — serialized configuration reads and mutations through the active repository.
- `src/services/proxy/` — proxy selection, application, and current-state logic.
- `src/services/pac/` — PAC configuration and script construction.
- `src/services/runtime/` — validated messages shared by extension UIs and the background worker.
- `src/storage/` — public config, local credential and selection repositories, storage abstractions,
  and sync/local selection.
- `src/tools/` — configuration schemas and focused utilities.
- `src/types/` — shared TypeScript declarations.
- `src/**/__tests__/` — unit and integration tests; shared Chrome mocks live under
  `src/__tests__/mocks/`.
- `src/**/*.stories.tsx` — component and full-page Storybook stories.
- `src/assets/manifest.json` — source extension manifest.
- `.storybook/` — Storybook configuration and its in-memory Chrome API mock.
- `builder/` and `rspack.config.mts` — packaging and build configuration.
- `dist/` and `storybook-static/` — generated build outputs; never edit or commit them.

## Architecture boundaries

- The background service worker is the single writer for proxy configuration and storage settings.
  Extension UIs use `src/services/runtime/runtimeClient.ts`; they do not mutate repositories or
  `chrome.storage` directly.
- Keep the request schema, background handler, runtime client, and Storybook Chrome mock aligned when
  changing the runtime contract. All configuration commands are serialized by the background
  request queue, while `src/services/config/configService.ts` serializes repository mutations.
- Keep proxy configuration mutations pure in `src/domain/proxy/configMutations.ts`. Persistence,
  Chrome API effects, and UI state do not belong in those functions.
- `StorageFactory.getConfigRepository()` is the application configuration boundary. It returns a
  `SecureConfigRepository`, which combines the selected public configuration storage with the
  local-only credential repository.
- Public proxy configuration may live in sync or local storage under `proxies`. Proxy usernames and
  passwords live only in local storage under `proxyCredentials`; active proxy selection is also
  local-only. `ConfigRepository` must never persist embedded credentials.
- Application reads receive credentials merged into the in-memory `Config`. Legacy configurations
  containing embedded credentials are migrated automatically: save credentials locally, then clean
  the public configuration. Preserve that ordering and retry-safe behavior.
- Configuration imports may contain legacy credentials and must pass through the background write
  path. Exports must use the dedicated `config.getExport` request and never include credentials.
- `getProxyState()` may legitimately return `null` when Chrome proxy settings are not controlled by
  this extension. UI loading state must be represented separately; do not treat a resolved `null`
  proxy state as a request that is still pending.

## Working rules

1. Read the nearest relevant source and tests before changing behavior. Keep patches scoped; do not
   refactor unrelated code or silently alter public behavior.
2. Treat `src/` and build configuration as source of truth. Do not hand-edit files in `dist/`.
3. Preserve Chrome extension boundaries. UI code communicates through Chrome APIs; service-worker
   code cannot depend on a DOM; PAC code runs in a constrained, separate runtime.
4. When changing messages, stored configuration, or proxy modes, update every producer and consumer
   together, including the Storybook mock. Preserve compatibility with existing stored user data
   unless a migration is included.
5. Keep `src/assets/manifest.json` permissions minimal. Explain and test any new permission.
6. Never log proxy credentials, complete private configurations, or other sensitive storage values.
7. Use `SecureConfigRepository` through `StorageFactory` for application configuration. Use the raw
   `ConfigRepository` only inside storage composition and migrations; its defensive credential
   stripping must remain intact. Storage preferences, credentials, active selection, and UI-only
   state intentionally remain local.
8. Keep PAC generation deterministic and browser-compatible. Add tests for wildcard/regexp matching,
   exclusions, ordering, and fallbacks when those semantics change.
9. Follow the existing TypeScript style: single quotes, no spaces inside braces, trailing commas,
   and a 100-column target. Let Prettier decide formatting.
10. Use explicit types at Chrome API, storage, message, and configuration boundaries. Avoid adding
    `any`; validate untrusted or persisted configuration with the existing Valibot schemas and
    parsing helpers in `src/tools/ConfigSchema.ts`.
11. Keep Storybook-only data and Chrome API mocks isolated from production entry points. Reuse
    `.storybook/chromeMock.ts` for stories that render extension UI.

## Commands

Use the Node.js version pinned in `.nvmrc` (Node 24), then install dependencies from the lockfile:

```bash
nvm use
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

For visual UI development, start Storybook manually. In automated runs, prefer its finite static
build command:

```bash
npm run storybook
npm run build-storybook
```

`npm run lint` already runs ESLint, Prettier checking, and TypeScript checking. During iteration,
prefer the narrowest useful test command, for example:

```bash
npm test -- --run src/tools/__tests__/wildcardToRegexpStr.test.ts
```

Run `npm run release` only when the task explicitly concerns a production archive or release. It
rebuilds generated output and creates a zip in `dist/`.

Rspack writes the unpacked extension to `dist/chrome/`. Rebuilding or running watch mode updates
files on disk but does not reload the Manifest V3 service worker. After runtime-contract or
background changes, reload Proxyfy from `chrome://extensions` before manual verification; otherwise
an old worker may ignore new action names and `chrome.runtime.sendMessage()` can resolve to
`undefined`.

## Testing expectations

- Add or update a test for every behavior change and regression fix.
- Put focused tests beside the module in its `__tests__` directory; use `src/__tests__/` for behavior
  spanning multiple subsystems.
- Reuse the Chrome mocks in `src/__tests__/mocks/` and reset mock/singleton state between tests.
- Reuse `.storybook/chromeMock.ts` and realistic, non-sensitive fixture data in page stories.
- Cover the valid `null` proxy-state case in popup or proxy-selector tests and stories whenever their
  loading or active-route behavior changes.
- Test success, error, and storage-switching paths when changing asynchronous Chrome API code.
- When changing configuration persistence, test credential separation, legacy migration, rollback,
  and exported-data sanitization. Never put real credentials in fixtures.
- Snapshot changes must be intentional and reviewed, not accepted merely to make a test pass.
- `npm run typecheck` follows `tsconfig.json`, which excludes test directories; passing it does not
  prove that test-only code is type-correct.

## Definition of done

Before handing off a code change:

- Run the most relevant tests plus `npm run lint`.
- Run `npm run build` when entry points, assets, the manifest, dependencies, or build config changed.
- Run `npm run build-storybook` when Storybook configuration, stories, mocks, or dependencies changed.
- Report which checks ran and any checks that could not run.
- Review the diff for generated files, credentials, debug output, unrelated formatting, and accidental
  permission changes.
- For user-visible extension changes, describe a short manual Chrome verification path when it was
  not possible to load the unpacked extension in a browser.
