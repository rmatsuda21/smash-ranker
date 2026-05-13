# 🏆 Smash Ranker

> _Make high quality Smash Bros. graphics look without opening up Photoshop._

A free, browser-based graphic generator for Super Smash Bros. tournaments. Paste a tournament URL, pick a template, smash a few buttons, and export polished Top 8 cards, tier lists, and prediction graphics ready for Twitter/X, Bluesky, and Discord. 📸

🎮 No account. 🔒 No tracking*. 💾 Your designs live in your browser, not our database (because there isn't one, yet).

*\*Error and event logging is performed for development purposes but data is not used for advertisement or distributed*

## ✨ Features

- 🥇 **Top 8 graphics**: auto-fill placements from a tournament URL, swap templates, customize colors, fonts, characters, and backgrounds, then export as PNG.
- 📊 **Tier list maker**: drag-and-drop ranking tool for the entire Smash Ultimate roster, with multiple layout variants and font controls. Yes, you can finally rank Steve in S-tier with confidence.
- 🔮 **Prediction graphics**: paste a tournament URL, drag entrants into your predicted ordering, and share a graphic of your galaxy-brain bracket predictions. (No refunds when MKLeo wins anyway.)
- 🌐 **Multi-platform support**: pulls data from [start.gg](https://start.gg), [Challonge](https://challonge.com), and [Tonamel](https://tonamel.com). Paste any URL, we'll figure it out.
- 🎨 **Custom assets**: upload your own background images, character art, fonts, and logos. Saved locally via IndexedDB so nothing leaves your machine.
- 🌏 **Localized**: English and Japanese (日本語) UI. Looking for contributors to add more languages!

## 🛠️ Tech Stack

The shiny stuff making this all possible:

- ⚛️ **React 19 + TypeScript** with [Vite](https://vitejs.dev/) and [Bun](https://bun.sh/): fast dev loop, fast builds
- 🖼️ **[Konva](https://konvajs.org/)** + [react-konva](https://konvajs.org/docs/react/): for the canvas pixel-pushing
- 🐻 **[Zustand](https://zustand-demo.pmnd.rs/)**: state management without the ceremony
- 🔌 **[urql](https://commerce.nearform.com/open-source/urql/)**: GraphQL client (start.gg, Tonamel)
- 🤏 **[@dnd-kit](https://dndkit.com/)**: drag-and-drop for tier lists & predictions
- 🌍 **[Lingui](https://lingui.dev/)**: i18n
- 🐭 **[Wouter](https://github.com/molefrog/wouter)**: tiny router with big energy
- 🔤 **[Fontsource](https://fontsource.org/)**: fonts that handle Japanese without breaking a sweat
- 🔼 **[Vercel](https://vercel.com/)**: hosting, serverless functions, and server-side image rendering with [satori](https://github.com/vercel/satori) + [resvg](https://github.com/yisibl/resvg-js)

## 🚀 Getting Started

### Prerequisites

- 🥟 [Bun](https://bun.sh/): the project's package manager and runtime
- 🟢 Node.js 22.x: required by some build tooling

### Setup

```bash
git clone git@github.com:rmatsuda21/smash-ranker.git
cd smash-ranker
bun install
bun dev
```

Then open <http://localhost:5173> and get started!

### 🔑 Environment variables

Copy `.env.example` to `.env.local` if present, or create a `.env.local` with:

```bash
VITE_START_GG_TOKEN=your_startgg_api_token   # https://start.gg/admin/profile/developer
CHALLONGE_API_KEY=your_challonge_v1_key      # https://challonge.com/settings/developer
```

To run the serverless functions locally (Challonge proxy, Tonamel proxy, prediction-image renderer, feature flags):

```bash
bun run dev:vercel   # Vite via Vercel CLI on localhost:3000
```

### 📜 Other commands

```bash
bun run build     # Type-check + production build
bun lint          # Run ESLint
bun lint:fix      # Auto-fix what's safe
bun extract       # Extract Lingui translation strings
bun compile       # Compile Lingui catalogs
bun codegen       # Regenerate start.gg GraphQL types
```

## 📁 Project Structure

A quick map of the codebase so you don't get lost:

```
src/
├── components/    # Feature components (top8/, tierlist/, predict/, thumbnail/, ...)
├── pages/         # Route entry points (lazy-loaded)
├── store/         # Zustand stores (canvas, player, tournament, tierlist, ...)
├── designs/       # Built-in Top 8 templates (top8er, minimal, squares, kagaribi)
├── hooks/         # Data-fetching hooks for start.gg / Challonge / Tonamel
├── utils/         # Canvas rendering, font loading, IndexedDB helpers
├── db/            # IndexedDB stores (templates, assets, fonts, preview cache)
├── locales/       # Lingui catalogs (en, ja)
├── gql/           # Auto-generated GraphQL types — do NOT edit; run `bun codegen`
api/               # Vercel serverless functions
```

📚 Want the full architecture deep-dive? See [`CLAUDE.md`](./CLAUDE.md).

## 🤝 Contributing

PRs, bug reports, and feature requests are super welcome 🙌 
See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, coding conventions, and the PR workflow.

Found a bug? [Open an issue](https://github.com/rmatsuda21/smash-ranker/issues) 🐛
Got a sick template idea? [Open an issue](https://github.com/rmatsuda21/smash-ranker/issues) 💡
Want to translate the UI into your language? [You guessed it](https://github.com/rmatsuda21/smash-ranker/issues) 🌍

## 📜 License

[MIT](./LICENSE) © Reo Matsuda

---

<sub>Made with ❤️ & ☕</sub>
