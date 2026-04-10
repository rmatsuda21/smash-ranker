# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**No manual testing is required for this repo when making changes**

## Commands

```bash
bun dev              # Start dev server (Vite, port 5173)
bun run dev:vercel   # Start dev server via Vercel CLI (enables serverless functions)
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
- `/` → home page; `/ranker` → main Top 8 editor; `/tier` → tier list maker

### State Management (Zustand)

All stores live in `src/store/` and use Zustand's persist middleware (localStorage):

- **canvasStore** — design configuration, color palette, background images, undo/redo
- **playerStore** — player list, selected player, API fetch status
- **tournamentStore** — tournament metadata and settings
- **editorStore** — UI state (active panel/tab)
- **historyStore** — undo/redo history stack
- **fontStore** — custom font loading and registration
- **tierListStore** — tier list state: tiers, character pool, layout variant, label font settings, image mode

### Tier List (`/tier`)

A drag-and-drop tier list maker for ranking Smash Bros. characters. Built with **@dnd-kit** for sortable drag-and-drop.

- **Components** live in `src/components/tierlist/`
- **Types** in `src/types/tierlist/TierList.ts` — `Tier`, `TierCharacter`, `TierListLayout` (`"side"` | `"top"`), `LabelFont`, `ImageDisplayMode`
- **Store** — `src/store/tierListStore.ts` (Zustand + persist to localStorage). Reducer-based with actions like `MOVE_CHARACTER`, `ADD_TIER`, `SET_LAYOUT`, `SET_LABEL_FONT`, etc.
- **Layout variants** — "side" (label left of row) and "top" (label as tab above row). Controlled via `TierListSettings` popover.
- **Settings popover** (`TierListSettings`) — label position, image style (stock/main art), font family/weight/size. Uses the shared `DropDownSelect` component.
- **Export** — renders to PNG via `html-to-image`. Elements with `data-export-ignore` are excluded.
- **Mobile** — uses `touch-action: pan-y` on sortable characters to allow vertical scrolling while preserving horizontal drag. The `main` element in Layout is the scroll container on mobile. Character pool sticks to the bottom via `position: sticky`.

### Canvas Rendering

The Top 8 graphic is rendered via **Konva** (2D canvas) through React-Konva. The canvas tree is driven entirely by the `canvasStore` design state. Key concepts:

- **Designs** (`src/designs/`) — predefined layout templates (`top8er`, `minimal`, `squares`). Each design is a typed object describing all canvas elements.
- **Element types** — `text`, `smartText`, `image`, `group`, `flexGroup`, `flexGrid`, `rect`, `svg`, `customImage`, `characterImage`, `altCharacterImage`, `tournamentIcon`, `playerFlag`
- **Element factory** (`src/utils/top8/elementFactory/`) — renders each element type to Konva nodes
- **Placeholder resolution** (`src/utils/top8/resolveText.ts`) — replaces `{{player.name}}`, `{{placement}}`, etc. with real data at render time
- **Color resolution** (`src/utils/top8/resolveColor.ts`) — maps palette keys to hex values
- **SVG processing** (`src/hooks/top8/useSvgImage.ts`) — fetches SVGs and recolors them for flags/icons

### Persistence (IndexedDB)

`src/db/indexDB.ts` initializes the DB. Separate modules handle:

- `src/db/template/` — saved design templates (`DBTemplate`)
- `src/db/asset/` — custom images/graphics (`DBAsset`, stored as Blobs)
- `src/db/customFont/` — custom font files (`DBCustomFont`, stored as Blobs)

### API Integration

Tournament data can be loaded from **start.gg**, **Challonge**, or **Tonamel**. Platform is auto-detected from the pasted URL.

- **Platform detection** (`src/consts/platforms.ts`) — `detectPlatformAndSlug()` parses URLs for all three platforms
- **start.gg** — GraphQL API (`https://api.start.gg/gql/alpha`) via urql. Auth token via `VITE_START_GG_TOKEN` env var (stored in cookies at runtime). GraphQL types auto-generated into `src/gql/` — do not edit manually; run `bun codegen`. Hook: `src/hooks/top8/useFetchResult.ts`
- **Challonge** — REST API v1 (`https://api.challonge.com/v1`) proxied through a Vercel serverless function (`api/challonge.ts`) to keep the API key server-side. Hook: `src/hooks/top8/useFetchChallonge.ts`. Uses `include_participants=1` to fetch tournament + participants in a single request.
- **Tonamel** — GraphQL API (`https://tonamel.com/graphql`) proxied through Vercel serverless functions. Uses two endpoints: a management endpoint for placements (competition → tournaments → blocks → podium) and a public endpoint for metadata/participants. Requires CSRF token fetched from `tonamel.com/api/csrf_token`. No API key needed. Hook: `src/hooks/top8/useFetchTonamel.ts`. Tournament images are proxied through `api/tonamel-image.ts` (allowlisted hosts) and stored in IndexedDB to avoid CORS. Tonamel does not provide location data, so `location` is set to `{}`.

The Vite dev server includes dev proxy plugins (`vite.config.ts`) for both Challonge (`challongeDevProxy`) and Tonamel (`tonamelDevProxy`, `tonamelImageProxy`) that proxy `/api/challonge`, `/api/tonamel`, and `/api/tonamel-image` requests locally, so loading works with both `bun dev` and `bun run dev:vercel`.

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

### Serverless Functions

Vercel serverless functions live in the `api/` directory:

- `api/challonge.ts` — Proxy for Challonge API v1. Accepts `?slug=<tournament_slug>` and returns tournament data with participants.
- `api/tonamel.ts` — Proxy for Tonamel GraphQL API. Accepts `?slug=<competition_id>`. Fetches CSRF token, then queries management endpoint for placements and public endpoint for metadata/participants.
- `api/tonamel-image.ts` — Image proxy for Tonamel tournament icons. Accepts `?url=<image_url>`. Allowlisted hosts: `assets.tonamel.com`, `img.tonamel.com`, `p1-c2db36b0.imageflux.jp`.

### Environment Variables

- `VITE_START_GG_TOKEN` — start.gg API token
- `VITE_GOOGLE_API_KEY` — Google Fonts API key
- `START_GG_OAUTH_SECRET` — start.gg OAuth secret (server-side)
- `CHALLONGE_API_KEY` — Challonge API v1 key (server-side, used by `api/challonge.ts`)
