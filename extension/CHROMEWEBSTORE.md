# Store Listings — Smash Ranker

> Last Updated: 2026-11-26

The Chrome Web Store listing first; Edge, Opera and Firefox reuse its copy
and are covered under [Other stores](#other-stores).

## Store Listing

**Extension Name**
Smash Ranker

**Short Description** (manifest `description`, 108 characters in English)
Open start.gg, Hivee, Challonge and Tonamel tournaments in Smash Ranker's tournament page and graphic tools.

Japanese: start.gg・Hivee・Challonge・Tonamelの大会をSmash Rankerで開けます。大会ページ、TOP8画像、大会振り返り、順位予想、サムネ作成へすぐ移動。

**Detailed Description**

Open any Smash Bros. tournament you are looking at on start.gg, Hivee, Challonge or Tonamel in Smash Ranker with one click.

On a tournament's page you get a small "Open in Smash Ranker" button in the corner. Click it to see the tournament on Smash Ranker: standings, the bracket and the biggest upsets. The arrow beside it lists the tools that can load the event you are looking at:
Tournament Ranker: a Top 8 graphic of the results
Tournament Recap: one player's run, set by set
Predictions: predict the placements and share them
Thumbnail Maker: video thumbnails for the event's matches

The toolbar icon shows the same for the tab you are on, along with every other Smash Ranker tool, including the Tier List Maker and your profile.

How to use it: open a tournament or one of its events on start.gg, Hivee, Challonge or Tonamel, then click the button in the corner or the Smash Ranker icon in the toolbar. Tools open in a new tab with the event already loading. Don't want the button? Hide it from its own list or from the toolbar icon.

Privacy: the extension sends nothing anywhere. It reads the address and title of tournament pages on these four sites to build its links, and it stores one setting (whether the button is shown) in your Chrome profile. Nothing is collected or tracked.

Smash Ranker is free and open source: https://github.com/rmatsuda21/smash-ranker

**Category**
Sports

**Single Purpose**
Opens the tournament on the current start.gg, Hivee, Challonge or Tonamel page in Smash Ranker's tournament page and tools.

**Primary Language**
English (Japanese translation included)

## Graphics & Assets

Everything below is ready to upload. Store images live in `extension/store/`
(English in `en/`, Japanese in `ja/` for the Japanese listing); all are
opaque 24-bit PNGs at the stores' exact sizes.

| Asset              | Dimensions | Status   | Filename                                                                  |
| ------------------ | ---------- | -------- | ------------------------------------------------------------------------- |
| Store Icon         | 128×128    | ✅ Ready | `dist/chromium/icons/icon-128.png` (built: 96px artwork, 16px clear edge) |
| Screenshot 1       | 1280×800   | ✅ Ready | `store/en/1-startgg.png`                                                  |
| Screenshot 2       | 1280×800   | ✅ Ready | `store/en/2-popup.png`                                                    |
| Screenshot 3       | 1280×800   | ✅ Ready | `store/en/3-tournament-page.png`                                          |
| Screenshot 4       | 1280×800   | ✅ Ready | `store/en/4-hivee.png`                                                    |
| Screenshot 5       | 1280×800   | ✅ Ready | `store/en/5-challonge.png`                                                |
| Small Promo Tile   | 440×280    | ✅ Ready | `store/en/promo-small-440x280.png`                                        |
| Marquee Promo Tile | 1400×560   | ✅ Ready | `store/en/promo-marquee-1400x560.png`                                     |
| Edge logo          | 300×300    | ✅ Ready | `store/logo-300x300.png` (Edge Add-ons only)                              |

Japanese listing: `store/ja/1-hivee.png`, `2-startgg.png`, `3-popup.png` and
both promo tiles.

### Screenshot captions

Firefox's store shows a caption under each screenshot; the Chrome Web Store
shows none.

1. One click from a start.gg event to its page on Smash Ranker, or straight
   into a tool with the event loaded.
2. The toolbar button shows the same for the tab you are on, and every other
   Smash Ranker tool.
3. The tournament's page on Smash Ranker: standings, bracket and upsets.
4. Works on Hivee events too.
5. On Challonge and Tonamel, the tools that read them: Top 8 graphics and
   predictions.

Japanese:

1. Hiveeの大会から、ワンクリックでSmash Rankerの大会ページやツールへ。
2. start.ggのイベントでも同じように使えます。
3. ツールバーのボタンからも、開いている大会とすべてのツールへ。

### Remaking them

The screenshots are of live pages (start.gg's Genesis 9, a Hivee event, a
Challonge bracket) with the extension loaded in Chromium, the popup
composited where it opens under the toolbar. The promo tiles are the site's
wordmark (M PLUS Rounded 1c, `api/fonts/`) beside a cut-out of the
extension's own button and list. Retake them when the button or popup
changes.

## Permissions Justification

| Permission                                               | Type           | Justification                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                | permissions    | Remembers one setting, whether the "Open in Smash Ranker" button is shown on tournament pages, so the choice made in the popup or the button's list sticks.                                                                                     |
| `activeTab`                                              | permissions    | When the user clicks the toolbar icon, the popup reads the open tab's address to tell whether it is a tournament page and which tournament it shows, so it can offer links to that tournament.                                                  |
| `scripting`                                              | permissions    | A tab that was already open when the extension was installed has no button script yet. When the user clicks the toolbar icon on such a tournament page, the popup adds the script to that one tab so the popup can show the tournament's links. |
| `https://start.gg/*`, `https://www.start.gg/*`           | content script | Shows the "Open in Smash Ranker" button on start.gg tournament and event pages and reads their address and title to build the links.                                                                                                            |
| `https://hivee.jp/*`                                     | content script | The same on Hivee event pages.                                                                                                                                                                                                                  |
| `https://challonge.com/*`, `https://www.challonge.com/*` | content script | The same on Challonge tournament pages. The script also looks for the tournament's own navigation links, to tell tournament pages apart from Challonge's other pages.                                                                           |
| `https://tonamel.com/*`                                  | content script | The same on Tonamel competition pages.                                                                                                                                                                                                          |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The extension makes no network requests of its own. It reads the address and title of tournament pages on the four sites above, on the user's device, to build links. When the user clicks one, the tournament's public address goes to smash-ranker.app as part of that link, as it would if they pasted it into the site. The only stored data is the button setting, in Chrome's synced storage.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
Not created yet. The store does not require one for an extension that collects no user data, but a short page on smash-ranker.app stating the above would answer reviewers' questions.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name**
(to fill in)

**Contact Email**
(to fill in: shown publicly on the listing)

**Support URL**
https://github.com/rmatsuda21/smash-ranker/issues

**Homepage URL**
https://smash-ranker.app

## Version History

| Version | Date       | Changes                                                                                                                                                               | Status |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.0.0   | 2026-11-26 | First version: button on start.gg, Hivee, Challonge and Tonamel tournament pages; toolbar popup with every tool; English and Japanese; Chromium and Firefox packages. | Draft  |

## Review Notes

### Known Issues / Limitations

- Challonge tournaments on an organisation's subdomain (`<org>.challonge.com/<slug>`) get no button: the site cannot load them yet.
- A Hivee short URL (an event name in place of its id) gets the tools but not the tournament page, which needs the id.
- Recap and Thumbnails are behind feature flags on the site; the extension offers them regardless.

### Rejection History

None yet.

## Other stores

All of them take the store listing copy above. Upload what
`bun run build:extension --zip` writes into `extension/dist`.

### Microsoft Edge Add-ons

- Upload `smash-ranker-chromium-<version>.zip` at Partner Center
  (partner.microsoft.com/dashboard/microsoftedge).
- Same permission justifications and privacy answers as above.
- Logo: `store/logo-300x300.png`. Screenshots and promo tiles: the same files
  as the Chrome Web Store.
- Category: Sports.

### Opera add-ons

- Upload `smash-ranker-chromium-<version>.zip` at addons.opera.com/developer.
- Brave, Vivaldi and Arc install straight from the Chrome Web Store.

### Firefox (addons.mozilla.org)

- **Package**: `smash-ranker-firefox-<version>.zip`. Mark it compatible with
  Firefox for Android too.
- **Add-on id**: `extension@smash-ranker.app`, set in `build.ts`. It is the
  add-on's identity on AMO: never change it after the first upload.
- **Source code**: AMO asks for it because the scripts are bundled. Upload
  `smash-ranker-source-<version>.zip` with these build notes for the
  reviewer:

  > Built with Bun 1.4 (https://bun.sh) on macOS or Linux. From the
  > archive's `extension` folder: `bun install` (three dev dependencies), then
  > `bun run build --browser firefox`. The add-on is written to
  > `extension/dist/firefox` and matches the upload byte for byte. The scripts
  > are bundled but not minified; besides `extension/`, they take three small
  > modules from the website's `src/`, included here. The full project is open
  > source at https://github.com/rmatsuda21/smash-ranker.

- **Data collection**: the manifest declares none
  (`data_collection_permissions: { required: ["none"] }`), which Firefox shows
  at install. Answer AMO's questions the same way as the privacy section
  above.
- **Site access**: Firefox lists the four sites at install and grants them;
  users can take that away per site in about:addons. The button then stays
  off on that site, and the popup still works there when clicked.
- **Screenshots**: the same files, with the captions above.
- **Category**: Games & Entertainment.
- **License**: MIT, as the repository.
- **Check before uploading**:
  `bunx web-ext lint --source-dir extension/dist/firefox` (0 errors and 0
  warnings for 1.0.0).

### Safari

Not built. It needs the extension converted into a macOS/iOS app with Xcode
(`xcrun safari-web-extension-converter`) and an Apple Developer Program
membership to ship it through the App Store.
