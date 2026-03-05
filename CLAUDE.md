# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**No manual testing is required for this repo when making changes**

## Commands

```bash
bun dev              # Start dev server (Vite, port 5173)
bun run build            # Production build (tsc + vite build)
bun run build:analyze    # Build with bundle size analysis
bun lint             # Run ESLint
bun lint:fix         # Auto-fix lint issues
bun extract          # Extract Lingui i18n strings
bun compile          # Compile Lingui i18n catalogs
bun codegen          # Generate TypeScript types from start.gg GraphQL schema
bun codegenwatch     # Watch mode for GraphQL codegen
```

No test runner is configured. Use `bun lint` and `bun build` to validate changes.

## Architecture

**Smash Ranker** is a tournament graphic generator for Super Smash Bros. events, currently focused on Top 8 bracket graphics. Built with React 19 + TypeScript, Vite, and deployed to Vercel.

### Routing & Pages

- `src/App.tsx` — Root with urql GraphQL provider + Lingui i18n provider
- `src/components/PageRouter.tsx` — Wouter-based routing
- `/` → home page; `/ranker` → main Top 8 editor

### State Management (Zustand)

All stores live in `src/store/` and use Zustand's persist middleware (localStorage):

- **canvasStore** — design configuration, color palette, background images, undo/redo
- **playerStore** — player list, selected player, API fetch status
- **tournamentStore** — tournament metadata and settings
- **editorStore** — UI state (active panel/tab)
- **historyStore** — undo/redo history stack
- **fontStore** — custom font loading and registration

### Canvas Rendering

The Top 8 graphic is rendered via **Konva** (2D canvas) through React-Konva. The canvas tree is driven entirely by the `canvasStore` design state. Key concepts:

- **Designs** (`src/designs/`) — predefined layout templates (`top8er`, `minimal`, `squares`). Each design is a typed object describing all canvas elements.
- **Element types** — `text`, `smartText`, `image`, `group`, `flexGroup`, `flexGrid`, `rect`, `svg`, `customImage`, `characterImage`, `altCharacterImage`, `tournamentIcon`, `playerFlag`
- **Element factory** (`src/utils/top8/elementFactory/`) — renders each element type to Konva nodes
- **Placeholder resolution** (`src/utils/top8/resolveText.ts`) — replaces `{{player.name}}`, `{{placement}}`, etc. with real data at render time
- **Color resolution** (`src/utils/top8/resolveColor.ts`) — maps palette keys to hex values
- **SVG processing** (`src/utils/top8/fetchAndColorSVG.ts`) — fetches SVGs and recolors them for flags/icons

### Persistence (IndexedDB)

`src/db/indexDB.ts` initializes the DB. Separate modules handle:

- `src/db/template/` — saved design templates (`DBTemplate`)
- `src/db/asset/` — custom images/graphics (`DBAsset`, stored as Blobs)
- `src/db/customFont/` — custom font files (`DBCustomFont`, stored as Blobs)

### API Integration

- **start.gg GraphQL API** (`https://api.start.gg/gql/alpha`) via urql
- Auth token via `VITE_START_GG_TOKEN` env var (stored in cookies at runtime)
- GraphQL types auto-generated into `src/gql/` — do not edit manually; run `bun codegen`
- Hook: `src/hooks/top8/useFetchResult.ts` — fetches tournament bracket results

### i18n (Lingui)

- Locales: `en`, `ja` — catalogs in `src/locales/{locale}.po`
- After adding new `<Trans>` or `t\`\``strings, run`bun extract`then`bun compile`
- Language preference stored in cookies; defaults to browser language

### Styling

- SCSS + CSS Modules throughout
- Theme system via CSS variables: `data-theme` (dark/light), `data-accent` (accent color)
- Theme preferences persisted via cookies

### Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@assets/` → `src/assets/`

### Environment Variables

- `VITE_START_GG_TOKEN` — start.gg API token
- `VITE_GOOGLE_API_KEY` — Google Fonts API key
- `START_GG_OAUTH_SECRET` — start.gg OAuth secret (server-side)
