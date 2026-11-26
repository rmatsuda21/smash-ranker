# Smash Ranker browser extension

A browser extension that opens tournaments in Smash Ranker from the sites
they are run on. One source, built for Chromium browsers and for Firefox.

- **On a tournament page** (start.gg, Hivee, Challonge, Tonamel) it adds a
  floating button. Its main part opens the tournament's page on Smash Ranker;
  the arrow beside it lists the tools that can load the event you are looking
  at: Tournament Ranker (Top 8 graphic), Tournament Recap, Predictions and the
  Thumbnail Maker. Every link opens in a new tab.
- **The toolbar popup** shows the same for the open tab, then every other
  tool, and a switch that hides or shows the floating button.

| Site      | Tournament page | Ranker | Recap | Predictions | Thumbnails |
| --------- | --------------- | ------ | ----- | ----------- | ---------- |
| start.gg  | yes             | yes    | yes   | yes         | yes        |
| Hivee     | yes             | yes    | yes   | yes         | yes        |
| Challonge | no              | yes    | no    | yes         | no         |
| Tonamel   | no              | yes    | no    | yes         | no         |

On a start.gg tournament's own page, with no event open, only the tournament
page is offered: every tool works on one event.

## Browsers

| Package    | Browsers                                 | Where users get it                                                                     |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `chromium` | Chrome, Edge, Brave, Opera, Vivaldi, Arc | Chrome Web Store (Brave, Vivaldi and Arc install from it), Edge Add-ons, Opera add-ons |
| `firefox`  | Firefox 140+ on desktop, 142+ on Android | addons.mozilla.org                                                                     |

Safari is not built: it needs the extension wrapped in a macOS/iOS app made
with Xcode, and an Apple Developer Program membership to ship it.

## Build and try it

The extension is its own package, with three dev dependencies (the icon
renderer, Chrome's types and TypeScript), so it installs and builds without
the site's. From the repository root, the site's install is enough:

```bash
bun run build:extension
```

Or on its own, from `extension/`:

```bash
bun install
```

```bash
bun run build
```

Either writes `extension/dist/chromium` and `extension/dist/firefox`, the same
bytes wherever it is started from.
`--browser chromium` or `--browser firefox` builds one. To point the links at
a dev server instead of smash-ranker.app:

```bash
bun run build:extension --site http://localhost:5173
```

To load it:

- **Chrome, Edge, Brave, Opera, Vivaldi, Arc**: open the extensions page
  (`chrome://extensions`, `edge://extensions`, …), turn on Developer mode,
  choose **Load unpacked** and pick `extension/dist/chromium`. After a
  rebuild, press the reload icon on its card.
- **Firefox**: open `about:debugging#/runtime/this-firefox`, choose **Load
  Temporary Add-on** and pick `extension/dist/firefox/manifest.json`. It stays
  until Firefox closes; **Reload** picks up a rebuild.

Mozilla's linter checks the Firefox package the way its store will
(`bun run lint:firefox` from `extension/`):

```bash
bunx web-ext lint --source-dir extension/dist/firefox
```

`bun run typecheck` from `extension/` checks the types; the site's `tsc -b`
checks them too.

## Publishing

`--zip` also writes the uploads into `extension/dist`:
`smash-ranker-chromium-<version>.zip` (Chrome Web Store, Edge Add-ons, Opera
add-ons), `smash-ranker-firefox-<version>.zip` (addons.mozilla.org) and
`smash-ranker-source-<version>.zip`, the source addons.mozilla.org asks for
because the scripts are bundled. Raise `version` in `manifest.json` for every
upload. Screenshots and promo tiles are in `store/` (English and Japanese).
Listing copy, permission justifications, privacy answers and each store's
own steps are in [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).

## How it fits together

- `src/pages.ts` reads a page's address (and, on Challonge, its links) into a
  `TournamentPage`: the platform, the slug the tools load, and the site's
  tournament page address. It uses the site's own URL parsers from
  `src/consts/platforms.ts`.
- `src/links.ts` turns that into links with the site's own builders from
  `src/utils/user/toolLinks.ts`, so the extension and the site cannot
  disagree about a link's format. **Keep that module free of analytics, stores
  and translations**: the extension bundles it.
- `src/content.ts` draws the floating button in a closed shadow root and
  follows the sites' in-page navigation. `src/popup.ts` asks the tab's content
  script for its `TournamentPage`, injecting the script first into a tab where
  it is not running (opened before the extension was installed, or a site the
  user took the extension's access away from).
- The code calls `chrome.*` and awaits it: Chrome and Firefox both return
  promises there in Manifest V3, so no compatibility layer is needed.
  Firefox-only manifest keys are added by `build.ts`, not kept in
  `manifest.json`, so Chrome's store sees no unknown keys.
- Icons are built as DOM nodes (`src/icons.ts`), never through `innerHTML`,
  which Firefox's review flags.
- Text is in `_locales/en` and `_locales/ja`, in the browser's language. The
  tool names match the site's home page.
- `build.ts` bundles both scripts with Bun, renders the toolbar icons from
  `public/favicon.svg`, writes each browser's manifest and copies the rest. It
  resolves the site's `@/` imports itself, so it needs none of the site's
  config, and always runs from `extension/`, since Bun writes module paths
  into the bundle relative to where it runs.

### What the site does with the links

- `/tournament/<start.gg tournament slug>?event=<event slug>` is turned into
  the page's own address with ids (`SlugRedirect` in `TournamentPage.tsx`), so
  the extension never needs start.gg's API.
- A tool link's `s` is a start.gg or Hivee slug, or for Challonge and Tonamel
  the tournament's whole URL (`toolLinkUrl`).
- The Thumbnail Maker reads `s` like the ranker and the recap do.

Installed extensions update on their own schedule, so **the site must keep
accepting every link format a published version hands out.**

Tools behind a feature flag (Recap, Thumbnails) are offered whatever the flag
says; while a flag is off the link reaches the site's "not found" page.
