# Contributing to Smash Ranker

Thanks for your interest in contributing! This guide covers how to get a working dev environment, the conventions the project follows, and how to contribute to the project!

## Setting up your dev environment

### Prerequisites

- [Bun](https://bun.sh/) — the project's package manager and runtime
- Node.js 22.x — required by some tooling
- A [start.gg API token](https://start.gg/admin/profile/developer) (free) for any work that touches the Top 8 / prediction features

### Setup

```bash
git clone git@github.com:rmatsuda21/smash-ranker.git
cd smash-ranker
bun install
cp .env.example .env.local   # if .env.example exists, otherwise create .env.local
bun dev
```

Add at minimum:

```bash
VITE_START_GG_TOKEN=your_startgg_token
CHALLONGE_API_KEY=your_challonge_v1_key   # only needed if you're touching Challonge code
```

To run with the serverless API functions (`/api/*`), use `bun run dev:vercel` instead.

## Branching & PR workflow

- `main` — staging branch. PRs merge here.
- Open PRs against `main`. Each PR gets its own preview URL from Vercel for review.
- CI must be green before merge: see `.github/workflows/ci.yml`.

For larger changes, please open an issue first to discuss the approach.

## Coding conventions

### Style and formatting

- **Format with Prettier** before committing: `bunx prettier --write <files>`. Config lives in `.prettierrc`.
- **Lint must pass**: `bun lint`. Use `bun lint:fix` to auto-fix what's safe.
- **Type-check via build**: `bun run build` runs `tsc -b` and Vite's build together. CI runs this on every PR.
- **No tests are required.** This repo doesn't have a test runner; lint and build are the correctness gates. Visual changes should be checked manually in the browser.

### TypeScript

- Strict mode is on.
- Path aliases: `@/` → `src/`, `@components/` → `src/components/`, `@assets/` → `src/assets/`. Configured in `vite.config.ts` and `tsconfig.json`.
- `src/gql/` is auto-generated. **Never edit it directly.** Run `bun codegen` to regenerate after schema changes.

### State management

- Zustand stores live in `src/store/`. Most are persisted to localStorage via the `persist` middleware.
- Reducer-based stores (e.g. `predictionStore`, `thumbnailStore`, `tierListStore`) follow an action-dispatch pattern, add a new action type and case rather than mutating from outside.
- IndexedDB writes go through the helpers in `src/db/`. Don't open the DB ad-hoc.

### Canvas rendering

- The Top 8 graphic is a Konva tree driven entirely by `canvasStore`. New visual features should be expressed as element-tree changes, not imperative Konva calls.
- Element types live in `src/utils/top8/elementFactory/`.
- When adding new dynamic props that affect text rendering, remember to track them in `FilteredElement.tsx` (otherwise the cached bitmap won't invalidate).
- Always emit font weight via `composeFontStyle()` from `src/utils/fonts/fontLoader.ts`. Don't hand `String(element.fontWeight)` to Konva, it conflates weight and italic.

### i18n

- All user-facing strings should be wrapped with Lingui's `<Trans>` component or `t\`\`` macro.
- After adding new strings, run `bun extract` (updates `.po` files) and `bun compile` (regenerates `.ts` catalogs).
- We currently support English (`en`) and Japanese (`ja`). If you only speak one, leave the Japanese translation blank.

### Architecture deep-dive

See [`CLAUDE.md`](./CLAUDE.md) for a more thorough tour of routing, stores, fonts, the canvas pipeline, persistence, and API integrations.

## Pull requests

- Title: short, lowercase, descriptive.
- Description: what changed and why. For UI changes, include before/after screenshots or a short clip.
- Link any related issue.
- Keep PRs focused. Refactors and feature work should generally land separately.
- The CI workflow (`Lint` and `Build` jobs) must be green.

## Reporting bugs / requesting features

Use [GitHub Issues](https://github.com/rmatsuda21/smash-ranker/issues). For bugs, please include:

- What you tried to do
- What happened vs. what you expected
- Browser + OS
- The tournament URL you were importing from, if relevant (helps reproduce platform-specific edge cases)
- A screenshot or screen recording when possible

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE) that covers the project.
