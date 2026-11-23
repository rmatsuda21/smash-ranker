# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**For UI changes, check the result in the browser before reporting the work as done.** Start the dev server through the browser preview (the `dev` configuration in `.claude/launch.json`, which runs `bun dev` on port 5173) and look at the affected screen, at desktop and mobile widths when layout changes. Non-visual changes need no manual testing: `bun lint` and `bun run build` are enough. Avoid `curl`-ing the dev server — the UI is React-rendered so HTML scrapes won't reveal anything useful.

## Commands

```bash
bun dev              # Start dev server (Vite, port 5173)
bun run dev:https    # Dev server on https://local.smash-ranker.app:5173 (mkcert certificate in `.certs/`; needs a hosts entry to 127.0.0.1) — the address for testing start.gg login
bun run dev:vercel   # Start dev server via Vercel CLI (enables serverless functions)
bun run build            # Production build (tsc + vite build)
bun run build:analyze    # Build with bundle size analysis
bun lint             # Run ESLint
bun lint:fix         # Auto-fix lint issues
bun extract          # Extract Lingui i18n strings
bun compile          # Compile Lingui i18n catalogs
bun codegen          # Generate TypeScript types from start.gg GraphQL schema
bun codegenwatch     # Watch mode for GraphQL codegen
bun generate:previews # Regenerate built-in template preview WebP images (uses Playwright + preview-generator.html)
bun run test:goldens        # Render every built-in template headlessly and pixel-diff against tests/goldens/
bun run test:goldens:update # Accept the current rendering as the new goldens (after an intended visual change)
```

No test runner is configured. Use `bun lint` and `bun build` to validate changes. For changes to the Top 8 render pipeline (element factory, layout, canvas leaves), also run `bun run test:goldens`; failures write the current render and a diff image to `tests/goldens/.diff/`. The goldens go through `src/tools/PreviewGenerator.tsx`, so they cover the element factory, leaf components and the shared scene components (`Canvas/scene/`), but not the desktop editing layers (`EditableContentLayers.tsx`, `TournamentLayer.tsx`: hover, drag, transformer). Golden-only cases (e.g. multi-character players for dynamic player height) are listed in `GOLDEN_ONLY_TEMPLATES` in `PreviewGenerator.tsx`. A case can bring its own `players` and `tournament` (long names, an icon).

**After making changes, always run `bunx prettier --write <changed files>` to format, then `bun lint` to surface any new lint errors before reporting the work as done.** Prettier config lives in `.prettierrc` and the ignore list in `.prettierignore` (auto-generated files in `src/gql/` and `src/locales/*.ts` plus vendored `.agents/` content are excluded).

## File organization

- `src/components/` holds only components (`.tsx`) and their SCSS modules.
- Hooks go in `src/hooks/` (shared) or `src/hooks/<area>/` (`top8`, `thumbnail`, `predict`, ...), one hook per file named after it. Exceptions that stay in `src/components/`: a hook that only reads a context defined beside it (`useAssetLoad`, `useRenderProfile`, `Toast/useToast.ts`), and a small unexported hook used by one component.
- Plain logic goes in `src/utils/` or `src/utils/<area>/`; types in `src/types/`; constants in `src/consts/`.
- Use `.tsx` only for files that contain JSX.

## Commit messages

- Keep messages short and simple — a single lowercase line describing the change, matching the existing `git log` style.

## Architecture

**Smash Ranker** is a tournament graphic generator for Super Smash Bros. events, currently focused on Top 8 bracket graphics. Built with React 19 + TypeScript, Vite, and deployed to Vercel.

### Routing & Pages

- `src/App.tsx` — Root with urql GraphQL provider + Lingui i18n provider
- `src/components/PageRouter.tsx` — Wouter-based routing. Lazy-loads `/tier`, `/predict`, `/results`, and `/thumbnail` via `React.lazy` + `Suspense`.
- Routes: `/` → home (shows the user's recent tournaments when logged in); `/me` → logged-in user's profile (stats + every tournament entered); `/oauth/callback` → start.gg login return; `/ranker` → main Top 8 editor; `/tier` → tier list maker; `/predict` → tournament prediction maker; `/results` → per-player tournament recap (gated by the `results-enabled` feature flag); `/recap` → the logged-in player's yearly recap, played as a phone story (gated by the `recap-enabled` feature flag); `/thumbnail` → thumbnail/graphic editor (gated by the `thumbnail-enabled` feature flag).

### State Management (Zustand)

All stores live in `src/store/` and use Zustand's persist middleware (localStorage) unless noted:

- **canvasStore** — design configuration, color palette, background images, undo/redo
- **playerStore** — player list, selected player, API fetch status
- **tournamentStore** — tournament metadata and settings
- **editorStore** — UI state (active panel/tab, preview cache invalidation)
- **historyStore** — undo/redo history stack (also used by the thumbnail editor)
- **fontStore** — Fontsource catalog + active font selection. Tracks `selectedFont` (user's pick), `displayedFont` (what's currently rendered, lags during loads), the catalog `fonts` Set, and custom-font registrations. Loading lifecycle is owned by `src/utils/fonts/fontLoader.ts`, not the store.
- **tierListStore** — tier list state: tiers, character pool, layout variant, label font settings, image mode
- **predictionStore** — `/predict` state: tournament metadata, entrant pool, ordered predictions, prediction count, fetch status. Reducer-based.
- **resultsStore** — `/results` state: tournament metadata, entrant pool, selected entrant, `playerResults` (placement, W-L, set list), separate `fetchingPool` and `fetchingResults` flags. Reducer-based.
- **thumbnailStore** — `/thumbnail` design state: `ThumbnailDesign` element tree (groups + leaves). Reducer-based with custom history integration via `historyStore`.
- **thumbnailEditorStore** — `/thumbnail` UI state (not persisted): selection, hover, zoom/pan, grid/snap settings, active sidebar tab, Konva `Stage` ref.

### start.gg Login & Profile (`/me`)

Users can log in with start.gg (OAuth authorization-code flow, scope `user.identity`). Logging in changes the home page (their latest tournaments with one-click links into the tools), adds `/me`, and makes every start.gg request go out with the user's own token.

- **Flow** — `LoginPrompt` (`src/components/home/LoginPrompt/`) calls `startLogin()` (`src/utils/auth/oauth.ts`) → start.gg → `/oauth/callback` (`src/pages/oauthCallback.tsx`) → `completeLogin()` POSTs the code to `/api/auth`, which holds the client secret. The redirect URI is always `<origin>/oauth/callback` and must be registered on the start.gg application. The login button is hidden when `VITE_START_GG_CLIENT_ID` is unset.
- **Tokens** — the access token (7 days) is returned to the browser and kept in `authStore` (persisted), because the browser calls start.gg directly. The refresh token lives only in an HttpOnly, SameSite=Strict cookie scoped to `/api/auth`. `src/utils/auth/session.ts` renews the session on app start when it is within two days of expiry.
- **Shared client** — `src/utils/startgg/client.ts` exports the one urql client used by `/ranker`, `/predict`, `/results` and the profile fetchers. It sends the user's token when there is a valid one and `VITE_START_GG_TOKEN` otherwise; if start.gg rejects the user's token (it answers 400 "Invalid authentication token", not 401) it refreshes once and then falls back to the app token. **Do not create another start.gg client.**
- **Never query `currentUser` through the shared client** — after a fallback it would describe the app token's owner. `fetchCurrentUser` uses a bare fetch with the explicit token; everything else looks the user up by `user(slug:)`.
- **One game at a time** — the profile covers only the games in the registry (Ultimate, Melee) and shows one of them: the list, the stats and the player card all follow `game`. `fetchUserGameCounts` asks, in one request built from the registry, how many events the user has in each game; `pickProfileGame` (`src/utils/user/profileGame.ts`) opens the page on the game picked last time (`PREF_KEYS.PROFILE_GAME`), or on the one they play most when they have nothing in it. The `GameSwitch` in the header appears only for someone with events in more than one game. A new game in the registry is picked up with no changes here.
- **Data** — `src/utils/user/`: `fetchUserEvents.ts` (`user.events` filtered by `videogameId`, so `total` is the game's own count, with `userEntrant(userId)` for seed/placement; 60 per page ≈ 420 complexity), `fetchUserSets.ts` (`player.sets` with per-game picks, 28 to a page with every page requested at once; a page start.gg refuses as too complex is fetched again as two halves), `careerStats.ts` (pure: `computeCareerStats`, `computeSetStats`), `toolLinks.ts`. Hooks in `src/hooks/user/`; `useUserEvents` and `useUserSets` keep finished loads in memory, so switching back to a game is instant. `useUserEvents` requests its pages together (all the pages `expectedTotal` predicts, the rest once the first page gives the count) and still hands them over in order.
- **Sets by game** — start.gg's set filters have no game, so sets are narrowed with `eventIds`: the ids of the game's most recent page of events (`setEventIds` in `UserPage`). **Never send an empty `eventIds`**: start.gg reads it as no filter and returns every set the player has; `useUserSets` answers "no sets" itself in that case.
- **Tool links** — `rankerLink(slug)` → `/ranker?s=<event slug>` (read by `TournamentLoader`, which asks before loading), `recapLink(slug, entrantId)` → `/results?s=…&e=…` (read by `ResultsApp`, which loads the event and selects the entrant), `predictLink(slug)` → the existing `/predict?d=` invite. The parameters are removed from the address bar once acted on.
- **Components** — `src/components/user/`: `UserPage` (header, stats, list), `StatsBoard` (animated stat tiles; rendered only once all events are loaded so numbers count up once), `EventList` (search + show more, skeleton rows while the first page loads), `EventRow` (shared with the home page's `RecentTournaments`), `UserAvatar`, `PlayerCardLauncher`, `PlayerCard` and `PlayerCardModal`. An account with no tournaments gets `EmptyProfile` in place of the stats and list.
- **Layout** — the page is up to 1280px wide and has two panes, tournaments (`EventList`) and stats (`StatsBoard`). From 1024px (`useMediaQuery`, matching the `wide` mixin) they sit side by side: the list in a 360–420px column on the left, using the phone's row design (`EventRow` with `stacked`, buttons under the text), and the stats in the rest. The page itself does not scroll there: the header stays put and each pane scrolls on its own (the list's title and search stick to the top of its pane), so stats arriving late never move the list and stay in view beside it. Below that they are tabs under a one-line header, tournaments first; the tab bar is sticky and `StatsBoard` is mounted only while its tab is open, so its numbers count up when the user gets there. `StatsBoard` is a 4-column grid where there is room (a tablet's tab, a desktop from 1200px: four single tiles to a row, double ones in pairs) and 2 columns otherwise. **Keep anything that loads late out of the space above the tournament list**: both panes show skeletons at their final sizes while loading.
- **Player card** — a foil trading card of the logged-in player, opened from a miniature of the card in the header (`PlayerCardLauncher`, lazy-loaded once the stats are in, with the card's display font, Big Shoulders Display from `@fontsource`; it builds the data, loads the assets and hands both to `PlayerCardModal`). The header holds the miniature's place with an empty card-shaped box until then. `src/utils/user/playerCard.ts` is the one painter: `buildPlayerCardData` (tag, prefix, start.gg user id as the card number, place, four stats, up to three most-played characters), `loadPlayerCardAssets` (art, head icons, fonts, and the ground's hue taken from the art) and `drawPlayerCard` (a 1000×1400 canvas, laid out in hundredths of the width). `PlayerCard` shows that canvas with the foil, glitter and glare as CSS layers over it, driven by the CSS variables `useCardTilt` writes every frame from the mouse or, on a phone, the gyroscope (iOS hands out tilt only after a permission prompt, which it shows only from inside a tap: `src/utils/motionAccess.ts` asks once per page, from a tap on the card or from any earlier tap that calls `requestMotionAccess`, and every card listens from then on; left alone the card sways; reduced motion gets a still card). `renderPlayerCardImage` makes the shared image: the same face with a still of the foil baked in, on a 1080×1350 backdrop. **Change the card in the painter, not in CSS**, so the screen and the shared image stay the same. Share (system share sheet, where the browser can share files), Download and Copy log `graphic_export_complete` with `export_surface: "player_card"`.
- **Back navigation** — scroll position (of the list's pane on a wide screen, of the page below that), the open tab, the search text and how many tournaments "Show more" had revealed are stored on the page's own history entry (`src/utils/user/pageMemory.ts`, `useScrollMemory`), so Back returns to the same tournament while a fresh visit starts at the top. Scroll is restored once the page has its final height (events loaded, set tiles settled).
- **Tournament icons** are requested with `crossOrigin="anonymous"` (falling back to a plain request on error): the ranker later `fetch`es the same file, and a copy cached without CORS headers makes that fetch fail.

### Tier List (`/tier`)

A drag-and-drop tier list maker for ranking Smash Bros. characters. Built with **@dnd-kit** for sortable drag-and-drop.

- **Components** live in `src/components/tierlist/`
- **Types** in `src/types/tierlist/TierList.ts` — `Tier`, `TierCharacter`, `TierListLayout` (`"side"` | `"top"`), `LabelFont`, `ImageDisplayMode`
- **Store** — `src/store/tierListStore.ts` (Zustand + persist to localStorage). Reducer-based with actions like `MOVE_CHARACTER`, `ADD_TIER`, `SET_LAYOUT`, `SET_LABEL_FONT`, etc.
- **Shell** — its own layout, built from the same tokens and shared controls as `/ranker`, arranged to give the list as much height as possible. `TierListToolbar` is the one bar: Unrank all (`CLEAR_TIERS`) and Start over (`RESET_ALL`) left, `TierDesignBar` in the middle (it drops to a second row under 1200px), Save Image right. Under it the list (centred, with a resize handle on its right edge) and `CharacterPool`: a column beside the list from the `wide` mixin's breakpoint (1024px), docked under the list below that. The list and pool sit in one `DndContext`.
- **List width** — `tierListWidth` in the store is the user's chosen width; `TierListApp` renders `min(stored, room in the workspace)` so the resize handle can never sit under the roster or off screen. The handle moves the width by twice the pointer travel (the list is centred), shows the width while dragging, resets on double-click and takes arrow keys.
- **Design bar** (`TierDesignBar`) — layout, image style and title alignment inline as shared `RadioGroup`s; palette and label font (family/weight/size) each behind a `Popover`. The font family picker is `TextFontSelect` (the Fontsource picker shared with `/thumbnail`), so `labelFont.family` holds a catalog family name; `src/utils/tierlist/labelFont.ts` turns it into CSS and still accepts the system font stacks saved by older lists. The weight list shows only the weights the chosen font ships, and `TierListApp` calls `loadFamily(family, [weight])` so only the weight in use is downloaded.
- **Layout variants** — "side" (label left of row), "top" (label as tab above row) and "fancy" (glow in the tier colour).
- **Export** — renders to PNG with a purpose-built canvas painter, `src/utils/tierlist/renderElementToCanvas.ts`, which reads each element's measured box and computed style from the live DOM (no DOM-snapshot library). Elements with `data-export-ignore` are excluded. It supports only the CSS the tier list uses (backgrounds, one `linear-gradient`, borders, radius, overflow clipping, box/text shadow, wrapped text, `<img>` object-fit) — **when exported tier list content starts using another CSS feature (pseudo-elements, transforms, filters, background images), add it to the painter.** Character `<img>`s carry `crossOrigin="anonymous"` so they can be drawn without tainting the canvas.
- **Mobile** — toolbar, list, pool; the design bar becomes a strip that scrolls sideways and the list's `.scrollArea` is the scroll container. The character pool is a two-row strip that scrolls sideways, with a swipe zone under it because the characters themselves capture touches for dragging.

### Predict (`/predict`)

A tournament prediction maker: paste a tournament URL, fetch the entrant pool, then drag entrants into an ordered predicted-placements list and share the result.

- **Components** live in `src/components/predict/` (`PredictApp`, `TournamentUrlInput`, `EntrantPoolPanel`, `PredictionListPanel`, `PredictionWorkspace`, `SortablePredictionItem`, `PredictionCountSelector`, `ActionBar`, `ExportBar`, `InviteShareButton`, `FetchingState`, `PredictionPreview`, `PredictionGraphic`).
- **Page** — `src/pages/predict.tsx` provides its own urql `Provider` (separate from `/ranker`'s) so the predict app can talk to start.gg without depending on the ranker provider tree.
- **Store** — `src/store/predictionStore.ts` (reducer-based). Actions include `FETCH_START`/`SUCCESS`/`FAIL`, `ADD_PREDICTION`, `REMOVE_PREDICTION`, `REORDER_PREDICTIONS`, `SET_PREDICTION_COUNT`, `AUTO_FILL`, `CLEAR_PREDICTIONS`, `RESET`.
- **Types** — `src/types/predict/Prediction.ts` (`PredictionPlayer`, `PredictionCount`).
- **Fetching** — `src/hooks/predict/useFetchPredictionEntrants.ts` reuses the same start.gg / Challonge / Tonamel pipeline as `/ranker` (`detectPlatformAndSlug` + per-platform proxies). start.gg entrants come from `fetchEventEntrants` (see Results).
- **Auto-load via URL** — `PredictApp` parses `?p=<platform>&s=<slug>` from `window.location.search` on first mount and triggers `fetchEntrants`. `InviteShareButton` produces the same shareable URL.
- **Drag-and-drop** — `@dnd-kit` (sortable) for reordering predictions.
- **Preview & export** — `PredictionPreview` GETs `/api/prediction-image?d=<base64url(JSON)>` and renders the returned PNG. Encoding the payload into the URL makes responses CDN-cacheable. The result blob/URL are also cached on a `cacheRef` so re-opening the modal with the same payload skips even the network round-trip. `ExportBar` handles download/share.

### Results (`/results`)

A per-player tournament recap generator: paste a start.gg event URL, fetch the entrant pool, pick a player, fetch their full set history, and generate a shareable graphic (placement, W-L, seed delta, and every set with characters/scores/round labels). **Gated by the `results-enabled` feature flag** (default-on in dev, default-off in prod).

- **Components** live in `src/components/results/` (`ResultsApp`, `EntrantPicker`, `PlayerSummary`, `SetList/SetRow`, `ResultsPreview`, `ResultsExportBar`). Shared with predict via `src/components/shared/TournamentUrlInput/` and `src/components/shared/FetchingState/` (lifted from predict — both accept callback/tagline props and have no store coupling).
- **Page** — `src/pages/results.tsx` provides its own urql `Provider` (separate from `/ranker` and `/predict`).
- **Shell** — same tokens and toolbar pattern as `/ranker` and `/tier`: a bar with the tournament left (icon, name, then event and date, linking to its start.gg page) and the URL field filling the rest (`TournamentUrlInput` with `variant="pill"`, the look of the ranker's `TournamentLoader`); loading another URL replaces the tournament, so there is no clear action; under it `EntrantPicker` in a raised panel on the left and the recap (summary, set list, sticky Generate button) in a centred column. On a phone the two panes become tabs and the bar stays one row: the URL field is a short "Paste URL" pill beside the tournament and takes the whole row while focused.
- **Store** — `src/store/resultsStore.ts` (reducer-based). Actions: `FETCH_POOL_*`, `SELECT_ENTRANT`, `FETCH_RESULTS_*`, `SET_COLOR_PALETTE`, `CLEAR_SELECTION`, `RESET`. Two independent fetch-status flags.
- **Types** — `src/types/results/ResultsEntrantSummary.ts`, `src/types/results/PlayerTournamentResults.ts` (`PlayerSet`, `PlayerSetOpponent`, `CharacterRef`).
- **Fetching** — Two-stage start.gg-only pipeline:
  - `src/hooks/results/useFetchResultsEntrantPool.ts` — pasted URL → `ResultsEventMeta`, then `fetchEventEntrants` (`src/utils/startgg/fetchEventEntrants.ts`, shared with predict) for the whole entrant list. It has no entrant cap: the meta query says how many seeds there are, so every page is requested at once (8 at a time), sized from the roster so a page stays under start.gg's 1000-object limit. It reads the first phase's seeds, or the event's entrant list when that phase does not hold everyone (seeding unpublished, entrants placed in a later phase). **Do not page through entrants one request after another, and do not cap the page count.** Pasting a Challonge/Tonamel URL dispatches `FETCH_POOL_FAIL` with a "start.gg-only" message.
  - **Recap links** pass the entrant to `fetchEntrants(url, { selectEntrantId })`, which dispatches `PRESELECT_ENTRANT` as soon as the event's game is known, so the player's results load while the entrant list is still coming in; `FETCH_POOL_SUCCESS` keeps that selection if the player is in the pool.
  - `src/hooks/results/useFetchPlayerResults.ts` — selected entrant id → `PlayerTournamentResults` query (`entrant.paginatedSets` with `sortType: RECENT`, `filters: { hideEmpty: true }`). Parses `displayScore` ("X - Y"), groups distinct characters per side from `games[].selections[]`, then reverses to chronological-oldest-first (secondary sort by `startAt`).
- **Palette extraction** — reuses `src/utils/predict/extractTournamentPalette.ts` and the `PredictionPalette` type from `src/types/predict/PredictionPalette.ts`.
- **Preview & export** — `ResultsPreview` GETs `/api/results-image?d=<base64url(JSON)>` and renders the returned PNG; payloads over `MAX_GET_PAYLOAD_LENGTH` (players with many sets) are POSTed as `{ d }` because Vercel rejects URLs past roughly 32K characters. Same blob-caching pattern as `PredictionPreview` (`cacheRef`). `ResultsExportBar` handles download/clipboard with `export_surface: "results"` analytics. Tall graphics scroll inside the modal — no `+N more` truncation.
- **Upset factor** — payload-only field (`upsetFactor` on `PlayerSet`). The graphic renders a badge when present and `> 0`; client doesn't compute it (planned to come from better-gg).
- **Path layout** — the default set list layout (`"path"` in `SetListLayout`). In the image it is a graphic of its own, built by `api/_lib/resultsPathGraphic.ts`: a compact header (placement, record, a seed bar counted in placement tiers), then the run as a rail with a winners and a losers lane (taken from each set's round name), whose markers are the characters the player used, and a two-cell UF badge that fills in by tier. The rail is drawn with absolute coordinates beside rows of fixed height, so **change row heights only through `ROW_H` and `PHASE_H`**. It uses Barlow and Barlow Condensed (`getPathFonts` in `api/_lib/fonts.ts`, with M PLUS Rounded 1c behind them for Japanese) and has its own English and Japanese strings, chosen by the payload's `locale`. Card styles do not apply to it, and on the page it is shown with the compact rows. Types and pure helpers shared with the other layouts live in `api/_lib/resultsImageShared.ts`.
- **Server renderer** — `api/results-image.ts` mirrors `api/prediction-image.ts`: satori + resvg, M PLUS Rounded 1c fonts, content-addressable LRU caches (tournament icon, character icons, PNG), ETag/304. Width 380px, output 760px. Pulls character stocks from the `SmashRankerAssets` GitHub repo (same path as `getCharImgUrl`).

### Recap (`/recap`)

The logged-in player's year, played like a phone story: ten slides that advance on their own, tap right or left to move, hold to pause. Mobile first; on a wide screen the story sits in a phone-shaped frame. **Gated by the `recap-enabled` feature flag.** The year is `RECAP_YEAR` (`src/consts/recap/recap.ts`), and the recap covers one game: the one the profile opens on (`pickProfileGame`).

- **Data** — `src/utils/recap/`: `fetchRecapEvents.ts` (the user's events, read newest first until a page holds nothing from the year; adds `lat`/`lng` and `type` to what the profile asks for), `fetchRecapSets.ts` (`player.sets` narrowed by `eventIds`, with round names, both seeds and opponents' avatars; 18 a page because a set with avatars and picks is about 50 objects, four pages at a time), `computeRecap.ts` (pure: events + sets → `Recap`). `useRecap` (`src/hooks/recap/`) runs them and keeps finished recaps in memory. **Never send an empty `eventIds`** (see the profile's sets).
- **Side brackets** — redemption, amateur, ladder and team events count as showing up but not towards placements, the best run or upsets. start.gg has no flag for them: `fetchRecapEvents` goes by the event's name and `type`.
- **Full screen** — `RecapApp` renders through a portal on `document.body`, so the story covers the site header at every width. Inside the layout it does not on iOS: the layout's scrolling `main` is a stacking context there, and the header is drawn over anything fixed inside it.
- **Story** — `RecapStory` mounts one slide at a time (keyed by slide id), so a slide's entrance animations are plain CSS that restarts on every visit: no "active" class. Progress bars and auto-advance are written to the DOM from one rAF loop. A slide that needs the story to wait (the globe being explored) calls `useRecapStory().setLocked(true)`. `RecapApp` builds the slide list and leaves out slides the player has nothing for (no upsets, no rival, no located tournaments).
- **Styles** — one module for the whole story, `src/components/recap/recap.module.scss`, with its own palette (`--rc-*`) apart from the app's themes. Sizes are in `cqw` of the stage, so the story scales as one piece; text that can be long is sized with `fitSize` (`src/utils/recap/recapText.ts`). The display face is Big Shoulders Display, falling back to M PLUS Rounded 1c for Japanese.
- **Globe** — `RecapGlobe` draws the player's cities on an orthographic globe (canvas, `d3-geo`, `topojson-client`, `world-atlas`, loaded through `loadRecapGlobe` in `src/utils/recap/loadGlobe.ts`: dynamic imports, so no other page pays for them, started as the recap opens so the slide does not wait). `computeRecap` picks the resting rotation (midpoint of the two farthest cities), which city is home, which are trips, and one labelled city per region; labels that would overlap are moved or left out. In explore mode, gestures only change the view and one rAF loop repaints it at most once a frame, eases the zoom and carries the globe on after a flick; while it moves, the grid and borders are left out and come back at rest. The projection runs with `precision(0)` (no adaptive resampling), so anything long, like a route, must bring its own intermediate points.
- **Type card** — it sways on its own (CSS `typeSway`, with the foil drifting on a different beat): no pointer, tilt or permission prompt. It does not use `useCardTilt`.
- **Player types** — nine, in `src/consts/recap/playerTypes.ts` (name and colours) with their emblems in `TypeEmblem.tsx`. `pickType` in `computeRecap.ts` chooses one by fixed rules, first match wins; `TypeSlide` words the reason.
- **Share cover** — the last slide is a magazine cover drawn by one canvas painter, `src/utils/recap/recapCover.ts` (`drawRecapCover`, 1080×1920). The slide plays its layers in by passing the elapsed time; the shared image is the same painter with no time. **Change the cover in the painter, not in CSS**, as with the player card. The slide builds every string (`RecapCoverText`), so the painter has no i18n. Exports log `graphic_export_complete` with `export_surface: "recap"`.
- **i18n** — the recap's strings are a catalog of their own (see i18n), loaded by `useRecapCatalog` when the recap opens; `RecapApp` renders no text until it is in. A string used in the recap and elsewhere is translated in both catalogs. A few labels read differently in the two languages on purpose (`{tournaments}` → `{tournaments}大会` on the cover; W/L → 勝/敗 under the `recap` message context).
- **Development** — in a dev build, `/recap?u=<discriminator>` shows any player's recap with the app's own token (the slug's part after `user/`), and `&s=<slide id>` opens on one slide and holds it there (`intro`, `grind`, `main`, `record`, `best`, `upset`, `rival`, `road`, `type`, `cover`).

### Thumbnail (`/thumbnail`)

A general-purpose graphic/thumbnail editor (vs-match cards, match banners, etc.) built on Konva with a custom element tree, selection model, and history. Lazy-loaded and gated by the `thumbnail-enabled` feature flag.

- **Components** live in `src/components/thumbnail/` — `Canvas/`, `Sidebar/`, `Toolbar/`, `Elements/`, `Pickers/`, `ContextMenu/`, plus `KeyboardShortcuts.tsx` and `useElementActions.ts`.
- **Page** — `src/pages/thumbnail/ThumbnailPage.tsx` (default export from `index.tsx`). Clears selection on unmount.
- **Stores** — `thumbnailStore` (design tree, reducer-based, persisted) and `thumbnailEditorStore` (transient editor state, not persisted).
- **Element tree** — `src/types/thumbnail/ThumbnailDesign.ts` defines `ThumbnailDesign`, `ThumbnailElement`, and `GroupElement`. Tree operations (`flattenTree`, `findElement`, `insertIntoTree`, `removeAndReturn`, `updateElementInTree`, `applyParentTransform`, `elementLocalToWorld`, `elementWorldToLocal`, `computeBoundingBox`, etc.) live in `src/utils/thumbnail/elementTree.ts`.
- **Templates** — `src/thumbnails/` (`blank`, `vsMatch`, `matchBanner`, `index`). Default design is `vsMatchTemplate()`.
- **Sidebar tabs** — `add` | `layers` | `properties` | `templates` | `background` | `settings`.
- **History** — Integrates with shared `historyStore`. Some actions (`LOAD_DESIGN`, `RESET`, `SET_CANVAS_SIZE`) clear history.
- **Keyboard shortcuts** — Wired up in `KeyboardShortcuts.tsx`.

### Feature Flags

- **Provider** — `FeatureFlagsProvider` (`src/components/FeatureFlagsProvider.tsx`) fetches `/api/flags` once on mount and merges the response over local defaults. Expose flags via `useFeatureFlag(key)` / `useFeatureFlags()` from `src/hooks/useFeatureFlags.ts`.
- **Local-dev defaults** — In `import.meta.env.DEV`, new flags default to **on** so contributors can work on them without hitting the API; in production they default to **off** until the dashboard says otherwise. Defaults also apply when `/api/flags` is unreachable (e.g. plain `bun dev` without `bun run dev:vercel`).
- **Backend** — `api/flags.ts` is a Vercel function backed by `@vercel/flags-core`. Exposes `?debug=1` for diagnostic info; cached `public, max-age=60, stale-while-revalidate=300` at the edge. `api/vercel/flags.ts` is the discovery endpoint. The dashboard's evaluation counts come from the client itself, which reports them only from `@vercel/flags-core` 1.6.0 on.
- **Adding a flag** — Add the key to both `FeatureFlagKey`/`DEFAULT_FLAGS` in `src/hooks/useFeatureFlags.ts` and `FLAG_KEYS`/`DEFAULTS` in `api/flags.ts`. Also add it to `DEFINITIONS` in `api/vercel/flags.ts`: the Vercel dashboard reads that list on each production deployment and marks a flag missing from it as "Unreferenced".

### TextEditor

The TextEditor panel (`src/components/top8/TextEditor/`) allows users to edit text content displayed in Top 8 graphics.

- **TextEditor.tsx** — Container that reads `design.textPalette` from canvasStore, renders a `RichTextInput` per text item, and debounces (150ms) updates via `UPDATE_TEXT_CONTENT`.
- **RichTextInput.tsx** — A single-line field built on one `contenteditable` element. The component file holds the React handlers (keys, clipboard, mouse) and markup; the rest follows the project layout: `src/utils/top8/richText/model.ts` (units and caret boundaries, no DOM), `src/utils/top8/richText/dom.ts` (model ↔ DOM, selection ↔ offsets), `src/hooks/top8/useRichTextModel.ts` (state, edits, undo history, sync with `value`), `src/hooks/top8/useRichTextNativeEditing.ts` (`beforeinput`/`input`/composition/`selectionchange` listeners). Plain text is text nodes; each known placeholder token is an atomic, non-editable pill (`<span contenteditable="false" data-token="…" data-label="…">`).
  - **Edits go through a model, not the browser.** The model is a list of units (one UTF-16 code unit of text, or one whole token); caret positions are offsets into it (`domToOffset` / `offsetToDom`). Every edit is cancelled in the native `beforeinput` listener (Backspace/Delete also in `handleKeyDown`), applied to the model by `replaceRange`, and the DOM is rewritten from the model with the caret set by hand (`commit`). Browsers disagree about typing and deleting next to non-editable elements, so do not hand an edit back to the browser (no `execCommand`, no letting a `beforeinput` through). The browser still owns caret movement through text and IME composition.
  - **IME composition is the exception**: while composing, events pass through untouched and the DOM is read back into the model on `compositionend` (`adoptDom`). The `input` listener does the same for anything else the browser changed on its own (Android keyboards, dictation).
  - **Undo/redo is the component's own stack** (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y, and `historyUndo`/`historyRedo`), since cancelled edits never reach the native one. Consecutive typing or deleting within a second merges into one step; an outside value change clears it.
  - **Pills contain no text.** The label and the × are CSS generated content (`::before` from `data-label`, `::after`), so there is no position inside a pill for a caret to land in. Do not put text nodes or child elements inside a pill. The × is hit-tested by position (`PILL_REMOVE_WIDTH`, kept in sync with the SCSS). The pill element is also wider than the chip you see on its left side (transparent `padding-left`, fill clipped with `background-clip: content-box`, `PILL_GUTTER_WIDTH`): browsers draw a caret that sits before a pill at the edge of the pill's box, so without that gutter the caret is painted on top of the chip. Clicking the gutter puts the caret before the pill.
  - **Left/Right next to a pill are handled in `handleKeyDown`**: they step over it, Shift extends the selection over it. A `selectionchange` guard moves any caret that ends up inside a pill to one side of it.
  - **React does not own the editor's children.** It renders an empty div; the module writes the DOM itself. Value flows prop → model only when the value changes from outside (loading a template or tournament); a locale change re-renders the pill labels. Do not render children into the editor from React.
  - **Copy/cut put the raw value on the clipboard** (tokens included), and paste parses it back, so pills survive a round trip. Paste is plain text only, with line breaks turned into spaces.
  - **Single line, plain text**: Enter (outside an IME composition), line-break and `format*` input types, Cmd/Ctrl+B/I/U and drag-and-drop are blocked.
  - Only tokens in `DesignPlaceholder` become pills; any other `<…>` stays as text.
- **Placeholder system** — `src/consts/top8/placeholders.ts` defines `DesignPlaceholder` enum (emoji-based keys like `<📝>`, `<📅>`) and `PlaceholderLabel` for i18n display labels. Only tournament placeholders (not player-specific) are shown in the chip bar.
- **Lazy loaded** via `React.lazy` in `SidePanel.tsx` under `EditorTab.TEXTS`.
- **Data flow** — `design.textPalette` → TextEditor → RichTextInput → `UPDATE_TEXT_CONTENT` → canvasStore → `resolveText()` → `replacePlaceholders()` → Konva Text nodes.

### Fonts

Fonts are sourced from **Fontsource** (https://fontsource.org) — no Google Fonts dependency, no API key. Static `@fontsource/<id>` packages are used (not `@fontsource-variable`) so family names match what's stored in user designs. All loading is mediated by a single central loader.

- **Module** — `src/utils/fonts/`:
  - `catalog.ts` — fetches `https://api.fontsource.org/v1/fonts?subsets=japanese` once on app boot and maps each entry to `{ fontFamily, id, weights, isVariable }`. Also exports `fetchFontMeta(family)` for one-off lookups.
  - `fontsourceUrls.ts` — URL builders. Canvas CSS = `cdn.jsdelivr.net/npm/@fontsource/<id>@latest/japanese.css`; preview CSS (used by the dropdown) = `…/latin-400.css`.
  - `fontLoader.ts` — central `loadFamily(family, requestedWeights?)` with in-flight dedup and per-family tracking of which weights have been fetched. Injects the CSS `<link>`, then calls `document.fonts.load("<weight> 16px '<family>'", "Aa1 あ漢")` for each needed weight so the WOFF2s are fetched before resolving (Fontsource's static japanese.css ships ~1MB per weight with no `unicode-range` chunking — without this, Konva paints with fallback metrics until the user interacts). With `requestedWeights`, only those weights (snapped to what the family ships) are fetched; without it, every catalog weight is. Also exposes `pickWeight(family, requested)` (W3C closest-weight algorithm), `resolveRequestedWeight(fontWeight, fontStyle)`, and `composeFontStyle(family, fontWeight, fontStyle)` for element factories.
  - `designWeights.ts` — `collectDesignFontWeights(design)` walks a Top 8 design and returns every weight it can ask for. `/ranker` passes this to `loadFamily` so it fetches only the weights in use. **Anything that applies a new design must load its weights first** (see `loadTemplate` in `TemplateEditor.tsx`): the canvas only gates on font-family changes.
  - `weightFallback.ts` — pure W3C font-weight matching algorithm (target 400–500 → search up to 500 then below; target < 400 → descending then ascending; target > 500 → ascending then descending).
- **Custom fonts** — uploaded via `src/utils/top8/registerCustomFont.ts` (FontFace API + IndexedDB Blob storage). On registration the loader is notified via `registerCustomFamily(family, weights?)` so `isLoaded` returns true and `pickWeight` returns 400.
- **Element factory integration** — `src/utils/top8/elementFactory/creators/text.tsx` and the flex-layout measurer in `…/layout/measureElement.ts` call `composeFontStyle()` to resolve `element.fontWeight`/`element.fontStyle` into a Konva-compatible shorthand (e.g. `"500"` or `"italic 600"`). Konva's `fontStyle` prop accepts the CSS shorthand. **Always emit weight via `composeFontStyle`; do not hand `String(element.fontWeight)` directly to Konva — it conflates weight and italic.**
- **Font-swap UX** — `useFontSwap` (`src/hooks/top8/useFontSwap.ts`, used by `Canvas.tsx` and `MobileCanvas.tsx`) watches `selectedFont` and dispatches `SET_DISPLAYED_FONT` only after `loadFamily` resolves. While `selectedFont !== displayedFont`, all canvas content keeps rendering with `displayedFont` and a subtle blurred overlay (`.fontSwapOverlay`, `cursor: wait`) covers the canvas to block interaction. Initial mount shows the full-canvas spinner (`.loader`).
- **Adding a new consumer** — anything that renders text on canvas should: (1) call `loadFamily(family)` and gate rendering on its resolution, (2) pass the resolved `composeFontStyle(...)` value to the Konva node's `fontStyle` prop. See `Canvas.tsx`, `TemplatePreview.tsx`, `PlayerElementEditor.tsx`, `thumbnail/Elements/TextNode.tsx` for patterns.

### Canvas Rendering

The Top 8 graphic is rendered via **Konva** (2D canvas) through React-Konva. The canvas tree is driven entirely by the `canvasStore` design state. Key concepts:

- **Designs** (`src/designs/`) — predefined layout templates (`top8er`, `minimal`, `squares`, `kagaribi`, `standings`, `comicBook`, `neonSign`, `highScore`, `tape`, `colourBars`, `sleeve`). Each design is a typed object describing all canvas elements. The kagaribi template uses `altCharacterImage` with `flow: "column"` and `rows: 6` to display alt character icons in a top-right vertical grid that grows leftward.
- **Element types** — `text`, `smartText`, `image`, `group`, `flexGroup`, `flexGrid`, `rect`, `polygon`, `pattern`, `svg`, `customImage`, `characterImage`, `altCharacterImage`, `customAltCharacterImage`, `tournamentIcon`, `playerFlag`
- **Element factory** (`src/utils/top8/elementFactory/`) — turns element configs into Konva nodes:
  - `ElementList.tsx` — the `<ElementList elements context />` component is the only way configs become nodes. Per element it checks `hidden`/`conditions`, calls the type's creator, then wraps the result from the outside in: `SelectableElement` (when `selectable`), `FilteredElement` (when `filterEffects`), a clipping `Group` (when `clip`).
  - `creators/` — one function per element type returning the bare Konva node. Containers (`group`, `flexGroup`, `flexGrid`) render their children with a nested `ElementList`.
  - `layout/` — pure layout math with no JSX: `flexLayout.ts` (`layoutFlexChildren`), `gridLayout.ts` (`layoutGridChildren`, `placeGridCells`, the two grid sizing strategies), `measureElement.ts` (intrinsic sizes).
- **Shapes, clipping and transforms** — added for the Comic Book template, usable by any design:
  - `polygon` draws a closed shape through `points` (fill and/or stroke). `pattern` fills its box with a screentone (`dots`, `lines`, `burst`) or the mortar lines of a wall (`brick`), drawn by `Canvas/PatternFill.tsx` from small cached tiles.
  - `clipPoints` on any element clips it to a polygon in its own coordinate space (takes the place of `clip`).
  - `rotation`, `skew` and `scale` apply to every element, pivoting on its position. `ElementList` wraps the node in a group that owns the position, the same way it does for clips. Selectable elements still get rotation from `SelectableElement` (no skew there).
  - Text takes `fillAfterStrokeEnabled` and `lineJoin` for outlined lettering: with a `stroke`, set `fillAfterStrokeEnabled` or the outline eats into the letters.
- **Glow** — `rect` and text take `shadowColor`/`shadowBlur`/`shadowOffset`/`shadowOpacity`; a blur with a zero offset is a glow (the Neon Sign template). `rect` also takes `opacity`, and text takes `letterSpacing`, which flex measurement and `SmartText` fitting both account for.
- **Character grids that shrink** — a `customAltCharacterImage` with an `elementTemplate` and no `columns` draws its characters at the template's size while they fit in `size.maxWidth` × `size.height`, then shrinks them into the grid with the largest cells; in a row `flexGroup` it is as wide as that grid. Neon Sign uses it for extra characters: two at the main icon's size, more as a grid in the same space.
- **Name tabs** — `smartText` takes `background` (`{ fill, padding }`): a box behind the text that is as wide as the text at the size it was fitted to, so two tabs stacked in a column each hug their own text (the Tape template's sponsor and name). `minFontSize` stops the shrinking there and cuts what is still too wide with an ellipsis. In a column `flexGroup`, a `smartText` with a width and no height is as tall as its fitted size, so what is stacked on it follows it down.
- **Character stacks** — a `customAltCharacterImage` with an `elementTemplate`, `rows` and `flow: "column"` stacks its characters top to bottom from the right edge of its box, `rows` to a column, at the template's size; when the columns outgrow the box the cells are scaled down, template contents included (`fitColumnStacks` in `layout/gridLayout.ts`).
- **Stock icons** — `characterImage.imageType: "stock"` draws the character's head icon instead of the render, with no crop.
- **Text running down a bar** — Colour Bars turns a column `flexGroup` a quarter (`rotation: 90` on a wrapper group) with `justify: "end"`: the stack's top is the bar's right, so the sponsor runs beside the name and the name keeps to the bar's left edge whatever size it is fitted to. Japanese text is turned with the rest (Konva has no upright vertical text).
- **Tape colourways** — `src/designs/tape.ts` builds every Tape variant from one layout and a `COLORWAYS` entry (seven colours). `ink` must contrast with `ground`, and band and strip text is drawn in `ground`; the Night variant is the same roles inverted. A new variant is a `COLORWAYS` entry, an export, and an entry in `TemplateEditor.tsx` and `PreviewGenerator.tsx`.
- **Colour Bars colourways** — `src/designs/colourBars.ts` builds its variants from a `COLORWAYS` entry: eight bar colours in placement order and one lettering colour that has to read on all of them (dark for the Signal and Pastel variants). The footer keeps its own `title` colour.
- **Background text** — background elements are given the tournament too, so text that has to sit under the players can name it (Tape's band of running text, which the winner's figure reaches over). It is edited in the Texts tab; only tournament layer elements can be picked on the canvas.
- **Player elements cannot use `textId`** — `PlayersContent` hands players only the colour palette, so text edits don't rebuild every player. Editable text that sits on a player's card goes in the tournament layer at the card's coordinates (Comic Book's sound effect).
- **One-colour art** — `characterImage` takes `opacity`; grey art (`tone.grayscale`) at part strength over a flat colour reads as art printed in that colour (the Sleeve template's winner). There are no blend modes.
- **Image tone** — `characterImage.tone` (`{ grayscale, contrast, brightness }`) is baked into the image by `useCustomImage` when it loads. **Use it instead of `filterEffects` for large images**: the mobile profile skips filters above `maxNativeArea` (30,000 px²), which is smaller than most character art.
- **Image readiness** (`src/components/top8/Canvas/AssetLoadBoundary.tsx`) — `CustomImage` and `CustomSVG` register with the nearest `<AssetLoadBoundary>` via `useAssetLoad()` when they mount; the boundary calls `onAllReady` once everything under it has settled (a failed image counts as settled) and `onAssetReady` on each load. Scene content and `Player` wrap their `ElementList` in one, and `FilteredElement` uses one to re-cache when an image inside it loads. **A new image-like leaf must call `useAssetLoad()` before its loading hook, or loaders will not wait for it.**
- **Flex layout** (`src/utils/top8/elementFactory/layout/flexLayout.ts`) — `flexGroup` elements lay out children using a flex-like algorithm. `getElementMainSize` (`layout/measureElement.ts`) measures child widths (text via `measureTextBoxWidth`). Child `position` values are used as offsets from the flex-computed position. Children with `flex.grow`/`flex.shrink` participate in space distribution. A `flexGroup` with `stretch` gives its children its cross size, so text in a column can shrink to the column's width; a column with `maxWidth` and no width is as wide as its widest child. In a column, a wrapping `text` with a width and no height is measured at its wrapped height, and a `group` with no height is as tall as its content, so a block can centre itself around text of any length (see the Comic Book title box). A `text` with `maxHeight` shrinks its font until the wrapped lines fit.
- **FlexGrid flow** — `flexGrid` supports a `flow` property (`"row"` | `"column"`). Default `"row"` fills left-to-right then top-to-bottom. `"column"` fills top-to-bottom in the rightmost column first, then adds new columns to the left. Use with `rows` (not `columns`) to set max items per column. The `alignLastRow` property doubles as last-column alignment in column flow. Both `altCharacterImage` and `customAltCharacterImage` pass `flow` through to their internal flexGrid.
- **Dynamic player height** — Opt-in feature (`Design.dynamicPlayerHeight`) that grows player cards at render time when characters exceed one row. Utility: `src/utils/top8/dynamicPlayerHeight.ts`. Hook: `src/hooks/top8/useEffectiveCanvasSize.ts`. Currently enabled only on the minimal template.
- **FilteredElement** (`src/components/top8/Canvas/FilteredElement.tsx`) — Wraps elements with filter effects (brightness, blur, etc.) in a cached bitmap, drawn by `FilteredGroup` using the profile's filter strategy. Tracks `text`, `fontSize`, `fill`, `fontFamily`, and `fontStyle` to invalidate the cache. **When adding new dynamic props to filtered elements, ensure they are tracked here.**
- **Scene** — one implementation of "design + data → nodes", shared by every render path:
  - `src/utils/top8/scene.ts` — pure derivations (`getPlayerConfigs`, `getEffectiveCanvasSize`, `fitBackgroundToCanvas`, `getPlayerPaintOrder`).
  - `src/components/top8/Canvas/scene/` — `BackgroundContent`, `PlayersContent`, `TournamentContent` render bare nodes from props (no store access, no layers). `StaticScene` composes all three into the current layer and is what the mobile canvas, `TemplatePreview` and `tools/PreviewGenerator` render. **Do not assemble element lists by hand in a new consumer — render `StaticScene` or the content components.**
  - Desktop (`Canvas.tsx`) uses three layers: content (background + players) and overlay (hover highlights, dragged player, player transformer) from `EditableContentLayers.tsx`, then `TournamentLayer.tsx` on top. Mobile uses one read-only layer.
  - `useStageBackingRatio` (`src/hooks/top8/useStageBackingRatio.ts`) sizes stage canvases to `displayScale × devicePixelRatio` on both desktop and mobile via the global `Konva.pixelRatio`; mount the `<Stage>` only once the display scale is measured. Any `node.cache()` call must pass an explicit `pixelRatio` because of this.
- **Render profile** (`src/utils/top8/renderProfile.ts`) — a `RenderProfile` object holds every device-class trade-off in the Top 8 pipeline (interactive canvas, source-image retention, cache sizes, filter strategy and area caps, bitmap density). `getDeviceRenderProfile()` picks `DESKTOP_PROFILE` or `MOBILE_PROFILE` once per page load; stages provide it through `RenderProfileContext` (default desktop, `MobileCanvas` provides mobile, previews provide `OFFSCREEN_PROFILE`) and leaves read fields via `useRenderProfile()`. **Do not add `isMobile()` checks to rendering code — add a profile field.** `isMobile()` is for layout only. Baked images and filter caches use `useBitmapScale()` (max of screen density and export pixel ratio, capped at 2) so exports don't depend on the monitor.
- **Text measurement** (`src/utils/top8/textMetrics.ts`) — `measureTextBoxWidth` (flex layout) and `fitText` (`SmartText`) measure through a detached Konva `Text` node and cache results; caches clear on `document.fonts` `loadingdone`. `SmartText` computes its fitted size synchronously during render, so text must only render after its font has loaded. **Do not create `new KonvaText` nodes for measuring elsewhere — add to this module.**
- **Placeholder resolution** (`src/utils/top8/resolveText.ts`) — replaces `{{player.name}}`, `{{placement}}`, etc. with real data at render time. `DesignPlaceholder.PLAYER_PLACEMENT_SUFFIX` gives the English ordinal suffix (st, nd, rd, th) for designs that set it smaller than the number.
- **Color resolution** (`src/utils/top8/resolveColor.ts`) — maps palette keys to hex values
- **SVG processing** (`src/hooks/top8/useSvgImage.ts`) — fetches SVGs and recolors them for flags/icons

### Characters and games

Character art lives in the `SmashRankerAssets` GitHub repo as `main/<id>/<alt>.webp` (render) and `stock/<id>/<alt>.webp` (head icon), where `<id>` is the start.gg character id. Those ids never repeat between games, so one folder layout and `getCharImgUrl` serve every game, and anything that only draws a character needs no game at all.

- **Game registry** — `GameId` (`src/types/Game.ts`) and `GAMES` (`src/consts/games.ts`) are the one place a game is described: label, start.gg videogame id, the name fragments Challonge/Tonamel use, the default character, and whether the better-gg player dataset covers it. `src/utils/games.ts` has the lookups (`getGameForStartggVideogame`, `getGameForName`). **Do not compare against a game id or hard-code a videogame id anywhere else — add a field to the registry.**
- **Lists** — `src/consts/top8/ultCharacters.json` (Ultimate) and `meleeCharacters.json` (Melee; 4–6 alts per character, id 628 "Sheik / Zelda" drawn as Sheik, id 1744 Random drawn with a copy of Ultimate's Random art). Each entry has names, alt count and names, and the crop (`cropOffset`, `cropScale`) used for player cards.
- **Catalog** — `src/utils/top8/characterCatalog.ts` is the only importer of those files: `getCharacter(id)`, `getCharacterGame(id)` and `isKnownCharacter(id)` work across games (names, crops, alt pickers), `getCharactersForGame(game)` is for pickers. **Do not import a character JSON directly.**
- **Unknown ids** — start.gg returns picks from games the site has no art for, and picks with no art (Random). Everything that takes character ids from start.gg (`useFetchResult`, the recap's `parseCharacterSelections` and fallback lookup, the profile stats) filters them with `isKnownCharacter`; do the same in a new fetcher.
- **Game switch** — `GameSwitch` (`src/components/shared/GameSwitch/`) lists every game in the registry. Each tool keeps its own game: `game` on `tournamentStore` for the ranker (set from the event when a tournament loads, on all three platforms), `game` on `tierListStore` for the tier list, local state in the thumbnail editor's character properties. `CharacterSelect` and `CharacterList` take the game as a required prop; a selected character from another game stays in the list.
- **Render styles** — a game can have more than one set of full-size art (`RenderStyleId`, `GAMES[game].renderStyles`, `RENDER_STYLES` for label and asset folder). Ultimate has `standard` (`main/`) and `mural` (`mural/<id>/<alt>.webp`); head icons are shared by every style. `src/consts/top8/ultMuralRenders.json` lists, per character, which costumes have mural art (standard alt numbers, with gaps) and the mural's own crop; the catalog exposes it as `getRenderSet`, `getRenderAlts` and `resolveRenderAlt`. `getCharImgUrl` and `getCharacterCrop` take a `style`: a character with no art in the style gets its standard render, and a costume the style lacks gets the style's first one, so they never build a URL for a missing file.
- **Render style in the ranker** — one setting for the whole graphic: `renderStyle` on `playerStore` (`SET_RENDER_STYLE`, `RenderStyleSwitch` under the game switch). Every action that changes `players` passes them through `applyRenderStyle` (`src/utils/top8/renderStyle.ts`), which stamps `style` on each character that has art in the style and moves it to an available costume, so the canvas, the alt picker and the icons read it straight from `CharacerData` with no other plumbing. **A new action that writes `players` must do the same.** The tier list offers the style as a third Image Style and the thumbnail editor as an image type; both resolve it when drawing.
- **Tier list** — one game at a time. `SET_GAME` parks the current game's placements (pool and each tier's characters) under `parked` and restores the other game's, so switching back and forth loses nothing; tiers, colours and the look are shared.
- **Recap fallback character** — the better-gg dataset holds Ultimate mains only, so `useFetchPlayerFallbackCharacter` reads it only when the event's game has `hasPlayerDataset`; other games go straight to start.gg's `recentStandings`, which is filtered by videogame. That query asks for 6 events of 10 sets: start.gg's maximum (20 events) returns over 1000 objects for an active player and is refused.
- **Adding a game** — import its art into the asset repo, add a JSON list, add the id to `GameId`; the compiler then asks for its `GAMES` entry and its list in the catalog. Pickers, the switch, the tier list, the confetti and the preload pick it up from there.

### Dynamic Player Height

When `Design.dynamicPlayerHeight` is set, player cards grow taller at render time to accommodate multiple rows of character icons. This is computed without mutating the stored design:

- **Config** — `{ rowHeight, gap, maxPerRow }` on the `Design` type. Only the minimal template uses this.
- **Utility** — `src/utils/top8/dynamicPlayerHeight.ts` computes per-player height deltas, patches element heights (rect `"primary"`, flexGroup `"main"`, flexGroup `"characterImageGroup"`, customAltCharacterImage `"altCharacterImage"`), and cascades y-position offsets.
- **Hook** — `src/hooks/top8/useEffectiveCanvasSize.ts` returns canvas size adjusted for total height delta. Thin store wrapper over `getEffectiveCanvasSize` in `src/utils/top8/scene.ts`.
- **`customAltCharacterImage`** — Supports `includeMainCharacter: true` to render all characters (main + alts) in a single grid. When `columns` is set, the grid uses fixed column count with the template's preferred cell size (no dynamic resizing). The `getElementMainSize` function in `layout/measureElement.ts` also respects `includeMainCharacter` and `columns` for accurate flex width calculation.

### Dynamic Player Count

A design opts in with `Design.dynamicPlayerCount` (`{ slotPitch, min, max, slotOverrides? }`); the standings and minimal templates do, which is why each has one light and one dark entry in the picker instead of per-count variants. Designs without it keep a fixed number of slots.

- **Resize** — `resizePlayerSlots(design, count)` in `src/utils/top8/playerCount.ts` (pure) truncates or appends `design.players`, and changes the canvas height and full-height background rects by `slotPitch` per slot. Slots must be a vertical stack. `slotOverrides[i]` is what slot `i` adds to `basePlayer` (podium styling), re-applied when a removed slot comes back. Store action: `SET_PLAYER_COUNT` on `canvasStore` (undoable).
- **Characters arrive in two steps on start.gg loads** — `fetchResult(slug, playerCount, visibleCount)` looks up characters for the design's slots before showing the graphic and for the other fetched players afterwards, six at a time (`addCharactersInBackground`, `FILL_PLAYER_CHARACTERS`). A player the user gave a character in the meantime keeps it, and the background work stops when another tournament starts loading.
- **Player data is never resized with it** — `playerStore` already holds 32 players (tournament loads overfetch, see `MIN_FETCH_COUNT`), so a new slot shows the next player in the standings and a removed one keeps its data. `usePlayerCount` (`src/hooks/top8/usePlayerCount.ts`) pads with blank players if the data is short and keeps the selection inside the slots. Keep `max` at or under 32 unless the fetch count grows too.
- **UI** — `PlayerCountControl` in the Players tab (stepper, typed number, 4/8/16/32 presets) plus a "+" chip at the end of the roster strip; both render only when the design has the flag.
- **Template loads** — loading a built-in template with the flag while the current design also has it keeps the current count (`loadTemplate`); saved templates keep the count they were saved with.

### Collapsible Band

A design can set aside a horizontal band for something the winner may not have with `Design.collapsibleBand` (`{ y, height, conditions }`); Sleeve does, for the sponsor line over the winner's name. When the first player does not meet `conditions`, the band is taken out: player slots and top-level tournament elements positioned at or below `y` move up by `height` and the canvas gets shorter by it (`getCollapsedBand` and `closeBand` in `scene.ts`, applied in `getPlayerConfigs`, `getTournamentElements` and `getEffectiveCanvasSize`). Elements inside a player are not moved: the winner's own layout handles both cases with `conditions`. Full-height background rects follow the canvas, as with dynamic player height.

### Player Table

A design whose players are the rows of a table opts in with `Design.playerTable` (`{ width, gap, columns }`); High Score does. Column widths depend on every player, so they are worked out before anything renders.

- **Columns** — each is `{ id, width, grow?, optional? }`. `width` is a number (fixed) or `{ min, max }` (as wide as the widest cell, within the range); both include the trailing `gap`. An `optional` column is left out when no player has anything in it. With `align: "center"`, cells in a column wider than its widest cell are inset so the widest is centred (High Score's Fighters when everyone plays one character); the header stays at the left edge. The `grow` column gets its own width first and then all the room left over; when the columns don't fit, the others narrow to their minimum, last one first.
- **Elements** — a top-level player or tournament element joins a column with `column: "<id>"`: it gets the column's width, its `position.x` counts from the column's left edge, and it is hidden with the column. Headers are tournament elements (editable `textId`s) with `column` set.
- **Code** — `src/utils/top8/playerTable.ts` (`layoutPlayerTable`, `placeInColumns`, pure). `getPlayerConfigs` applies it to the players and `getTournamentElements` (both in `scene.ts`) to the tournament layer; **render tournament elements through `getTournamentElements` / `useTournamentElements`, not straight from the design.**
- **Ellipsis** — `smartText` takes `overflow: "ellipsis"` to keep its font size and cut text wider than its box, for a column that has reached its maximum.

### Persistence (IndexedDB)

`src/db/indexDB.ts` initializes the DB. Separate modules handle:

- `src/db/template/` — saved design templates (`DBTemplate`)
- `src/db/asset/` — custom images/graphics (`DBAsset`, stored as Blobs)
- `src/db/customFont/` — custom font files (`DBCustomFont`, stored as Blobs)
- `src/db/previewCache.ts` — separate IndexedDB store for rendered template preview thumbnails (Blobs). Cleared via Settings → "Regenerate Thumbnails" which dispatches `INVALIDATE_PREVIEW_CACHE` to `editorStore`, causing `UserTemplatePreview` components to re-render sequentially.

### API Integration

**start.gg request rules** (measured, see the notes in each fetcher):

- A request may return at most 1000 objects, counted from what actually comes back, so a query that works for a quiet player can be refused for an active one. Size pages for the heaviest case and prefer `selectionValue` (with `selectionType`) over `character { id }`.
- start.gg takes longer over a page the bigger it is, and answers parallel requests independently: when the page count is known or can be guessed, request the pages together rather than one after another. The limit is 80 requests a minute.
- Looking sets up from `entrant(id)` is lighter than `event.sets` filtered by entrant. Fetching several players' sets in one `event.sets` request was measured slower than one request per player.

Tournament data can be loaded from **start.gg**, **Challonge**, or **Tonamel**. Platform is auto-detected from the pasted URL.

- **Platform detection** (`src/consts/platforms.ts`) — `detectPlatformAndSlug()` parses URLs for all three platforms
- **start.gg** — GraphQL API (`https://api.start.gg/gql/alpha`) via urql. Auth token via `VITE_START_GG_TOKEN` env var. GraphQL types auto-generated into `src/gql/` — do not edit manually; run `bun codegen`. Hook: `src/hooks/top8/useFetchResult.ts`
- **Challonge** — REST API v1 (`https://api.challonge.com/v1`) proxied through a Vercel serverless function (`api/challonge.ts`) to keep the API key server-side. Hook: `src/hooks/top8/useFetchChallonge.ts`. Uses `include_participants=1` to fetch tournament + participants in a single request.
- **Tonamel** — GraphQL API (`https://tonamel.com/graphql`) proxied through Vercel serverless functions. Uses two endpoints: a management endpoint for placements (competition → tournaments → blocks → podium) and a public endpoint for metadata/participants. Requires CSRF token fetched from `tonamel.com/api/csrf_token`. No API key needed. Hook: `src/hooks/top8/useFetchTonamel.ts`. Tournament images are proxied through `api/tonamel-image.ts` (allowlisted hosts) and stored in IndexedDB to avoid CORS. Tonamel does not provide location data, so `location` is set to `{}`.

The Vite dev server includes dev proxy plugins (`vite.config.ts`) for start.gg login (`authDevProxy`, runs `api/auth.ts`), Challonge (`challongeDevProxy`) and Tonamel (`tonamelDevProxy`, `tonamelImageProxy`) that proxy `/api/challonge`, `/api/tonamel`, and `/api/tonamel-image` requests locally, so loading works with both `bun dev` and `bun run dev:vercel`.

### i18n (Lingui)

- Locales: `en`, `ja` — catalogs in `src/locales/{locale}.po`
- After adding new `<Trans>` or `t\`\``strings, run`bun extract`then`bun compile`
- Both commands run twice: once for `lingui.config.ts`, whose catalogs (`ranker`, `tierlist`, `home`) are merged into the one file every page loads at startup (`src/locales/{locale}.ts`), and once for `lingui.recap.config.ts`, which compiles the recap's strings to `src/locales/recap/{locale}.ts`. A merge cannot leave a catalog out, hence the second config. **A new area whose strings should not load at startup needs the same: its own config, an `exclude` in the main one, and a loader beside `loadRecapCatalog` in `src/i18n.ts`.**
- Language preference stored in localStorage via `src/utils/prefs.ts`; defaults to browser language

### Styling

- SCSS + CSS Modules throughout
- Theme system via CSS variables: `data-theme` (dark/light), `data-accent` (accent color)
- Theme preferences persisted in localStorage via `src/utils/prefs.ts` (`getPref`/`setPref`)

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
- `api/prediction-image.ts` — GET endpoint that renders a `/predict` graphic server-side. Reads the payload from a base64url-encoded `d` query param so responses are URL-addressed and CDN-cacheable. Uses `satori` (JSX → SVG) + `@resvg/resvg-js` (SVG → PNG) at 2× pixel ratio. Bundles M PLUS Rounded 1c fonts from `api/fonts/` and pulls character stock images from the `SmashRankerAssets` GitHub repo. Module-scope LRU caches dedupe character/icon fetches and rendered PNGs across requests on a warm instance.
- `api/results-image.ts` — same pattern as `prediction-image.ts`, but renders a per-player tournament recap (tournament header + player summary stats + chronological set list). Width 380px / output 760px. Accepts the payload as GET `?d=` or, for payloads too long for a URL, POST `{ d }`. Validates payload (`MAX_SETS = 64`, `MAX_CHARACTERS_PER_SIDE = 4`, character-id regex). Module-scope LRU caches for tournament icon, character icons (256 entries), and rendered PNGs.
- `api/auth.ts` — start.gg login. POST `{ action: "exchange", code }` / `{ action: "refresh" }` / `{ action: "logout" }`. Requires an allowed `Origin` header (`requireAllowedOrigin`), returns `{ accessToken, expiresIn }` and manages the refresh-token cookie. One function for all three actions to stay under the Vercel function count. Token calls live in `api/_lib/startggOAuth.ts`.
- `api/flags.ts` — Feature-flag endpoint backed by `@vercel/flags-core`. Returns `{ "thumbnail-enabled": boolean, ... }`. Falls back to defaults if the `FLAGS` env var is missing. Pass `?debug=1` for evaluation reasons.
- `api/vercel/flags.ts` — Vercel Flags discovery endpoint.

### Environment Variables

- `VITE_START_GG_TOKEN` — start.gg API token
- `VITE_START_GG_CLIENT_ID` — start.gg OAuth application id (public; also read server-side by `api/auth.ts`). Login is hidden when unset.
- `START_GG_OAUTH_SECRET` — start.gg OAuth application secret (server-side, used by `api/auth.ts`)
- `CHALLONGE_API_KEY` — Challonge API v1 key (server-side, used by `api/challonge.ts`)
- `VITE_SENTRY_DSN` — Sentry DSN for the client SDK (public; embedded in the bundle). Leave unset locally to silence Sentry during `bun dev`.
- `SENTRY_DSN` — Sentry DSN for `api/*` functions (server-side).
- `SENTRY_AUTH_TOKEN` — Build-time only. Enables source-map upload via `@sentry/vite-plugin`. Without it, the build succeeds and emits no source maps.
- `SENTRY_ORG`, `SENTRY_PROJECT` — Required when `SENTRY_AUTH_TOKEN` is set.
- `VITE_POSTHOG_KEY` — PostHog project API key (public; embedded in the bundle). Drives `logEvent` product analytics. Leave unset locally to silence PostHog during `bun dev`.
- `VITE_POSTHOG_HOST` — Optional PostHog ingestion host. Defaults to `https://us.i.posthog.com`; set to `https://eu.i.posthog.com` if your project lives in the EU region.

### Observability

Errors and analytics flow through three helpers in `src/utils/observability/`:

- `logError(error, context?)` — `console.error` + Sentry exception capture. Use for unexpected failures.
- `logWarning(message, context?)` — `console.warn` + Sentry message capture at warning level. Use for recoverable conditions (silent fallbacks, missing config, swallowed catches).
- `logEvent(name, props?)` — `posthog.capture(...)` typed against the event registry in `src/utils/analytics/events.ts`. Use for product-specific outcome events (`tournament_load`, `graphic_export_complete`, etc.). PostHog is the analytics backend because Vercel Web Analytics restricts custom events to Pro+; the dual setup is intentional — `@vercel/analytics`'s `inject()` continues to power Vercel's pageviews dashboard (free on Hobby), and PostHog handles custom events plus its own SPA `$pageview` capture.
- `setPersonOnce(props)` / `setPerson(props)` — write person-level state (`first_export_at`, `has_uploaded_custom_font`, etc.). Counts (e.g. total exports) belong to the event stream — query via `count()` over `graphic_export_complete` in PostHog Insights. Person properties are for _state_ (booleans, first/last timestamps).

PostHog is initialized in `src/utils/observability/analytics.ts`:

- `defaults: '2026-01-30'` opts into the modern defaults bundle: SPA `$pageview` on `history_change` (works with wouter automatically — do NOT manually emit pageview events), `capture_pageleave: 'if_capture_pageview'` for accurate session duration, and rageclick filtering.
- `autocapture: false` — the app is a Konva canvas tool; autocapture would drown signal in canvas-element click noise. Stick with explicit `logEvent` calls.
- Slim core bundle (`posthog-js/dist/module.slim`) drops session-replay, surveys, and rarely-used extensions for ~30KB gzipped savings. We don't mount `<PostHogProvider>` because we use no PostHog hooks today; if we ever need `usePostHog` / `useFeatureFlagEnabled`, switch the import back to `posthog-js` (full) and add the Provider — slim's types aren't assignable to the React bindings.
- Super-properties registered via `posthog.register({ app_environment, commit_sha })` so every event carries deployment context.
- Init early-returns under `import.meta.env.DEV` so `bun dev` doesn't ship to the prod project. Vercel preview deploys are PROD builds and DO report.
- `posthog.identify(getClientId())` runs at init with a stable UUID persisted in `localStorage` (`smash-ranker:client-id`). Without this, every cache wipe creates a new "person" and breaks cohort/funnel views.
- `before_send` strips sensitive query params (`s`, `slug`) from `$current_url` and `$referrer` before they leave the browser — predict deep-link URLs contain tournament slugs that are organizer/event data.
- `ip: false` and `disable_external_dependency_loading: true` for privacy: no IP capture, no lazy-loading of toolbar/recorder scripts.

**Event/property conventions** (per `src/utils/analytics/events.ts`):

- Events follow `<object>_<verb>` in present tense, snake_case. `tournament_load` not `tournament_loaded`. `graphic_export_complete` not `export_png`.
- Properties use snake_case, namespaced by domain (`tournament_platform`, `export_format`, `export_surface`, `failure_kind`, `size_kb`, `duration_ms`).
- Booleans prefixed with `has_` / `is_`. Timestamps suffixed with `_at` (ISO string) or `_ms` (relative).
- All event names are typed via `EventName` in the registry — adding an event means updating the union, then call sites get type errors until they pass valid props.

**Sentry vs PostHog separation:**

- Sentry receives **bugs**: unexpected exceptions, post-process failures, IndexedDB corruption.
- PostHog receives **outcomes**: success/failure events with rate-queryable properties (`tournament_fetch_fail` with `failure_kind`).
- We deliberately do NOT Sentry-capture user-input failures (bad slugs, 404s) from tournament-fetch hooks — those inflate Sentry exception counts without aiding triage. Real upstream issues land in the api/\* function-side Sentry captures, which is the authoritative source for upstream/server bugs.

`<ErrorBoundary>` (`src/components/ErrorBoundary.tsx`) catches React render-phase errors and reports them to Sentry. React 19's root-level `onUncaughtError` / `onCaughtError` / `onRecoverableError` handlers are wired via `Sentry.reactErrorHandler()` in `src/main.tsx` to catch errors that escape the boundary. `<ToastProvider>` (`src/components/Toast/`) exposes `useToast().showToast(message, { variant })` for non-modal user-visible errors — prefer it over `alert()`. `@vercel/speed-insights/react` is mounted in `src/App.tsx` for Web Vitals.

`api/_instrument.ts` initializes `@sentry/node` at module load. Every `api/*` function MUST `import "./_instrument";` (or `import "../_instrument";` for nested entries) as its **first line**, before any other imports. `@sentry/node`'s OpenTelemetry-based auto-instrumentation only patches modules imported AFTER `Sentry.init`; initializing later means HTTP/fetch instruments never attach.

Vercel functions wrap their default export with `withLogging("<name>", handler)` from `api/_lib/withLogging.ts`, which:

- Emits one structured JSON log line per request (`fn`, `requestId`, `status`, `durationMs`, `path`).
- Captures unhandled exceptions to Sentry with `fn` + `requestId` tags, sets the `x-request-id` response header, and flushes Sentry via `waitUntil(Sentry.flush(2000))`.
- Exports `addBreadcrumb(category, message, data?)` and `captureFnException(err, tags)` for handlers that catch and respond themselves (e.g. `api/tonamel.ts`).

When adding a new `api/*` function: (1) make `import "./_instrument";` the very first line, then (2) wrap the default export with `withLogging`.
