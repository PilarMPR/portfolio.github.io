# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static portfolio site (game designer, GitHub Pages) with **no build step, no dependencies, no tests**. Plain HTML/CSS/vanilla JS served as-is (`.nojekyll`).

The unusual part: the site edits and publishes *itself*. An in-page editor (click the nav logo 6× quickly) makes the page editable, stores edits in the browser, and commits the current page back to this repo through the GitHub API. Most commits in `git log` ("Update portfolio content via in-page editor") were written by the site, not by hand.

## Commands

```bash
python3 -m http.server        # serve the repo root, then open http://localhost:8000
bash docs/checks.sh           # static invariant checks; no output = all clear
```

`file://` mostly works, but **Export** and the asset-inlining fetches require http. There is no build or test framework — verify behaviour by loading the page and exercising the editor.

`docs/checks.sh` is the only automated check in the repo. It is plain grep over the HTML and `site.js`, it exits non-zero on failure, and it catches the two mistakes that are otherwise invisible until a user clicks the wrong thing (see R2/R3 below). Run it after touching handler names, page markup, or the shared script.

## Working agreement

Three rules the repo cannot recover from on its own. `docs/checks.sh` enforces R2 and R3; R1 is on you.

- **R1 — Don't hand-edit page *content*.** The HTML files are machine-written; the next browser publish overwrites the whole file from that browser's DOM + `localStorage`, discarding hand edits it doesn't know about. Structural markup, CSS and JS changes are safe (the browser reloads them); prose and images go through the editor.
- **R2 — Every `on*=` handler name must resolve to a declaration in `site.js`.** Handlers are wired by string, in the five HTML files *and* inside `site.js` template literals. Nothing else in the repo can catch a rename that misses one — no import fails, no lint fires; the button simply does nothing when clicked.
- **R3 — Every page keeps the sentinel elements.** `#cursor`, `#nav`, `#nav-logo`, `#fmt-bar` and `#lightbox` are captured at load with no null check; removing one throws and kills the rest of the script. `#de-toast` is looked up lazily and null-guarded, so losing it fails quietly instead — every toast just disappears. `checks.sh` requires all six. (This is why export leaves them in place, inert.)

## Architecture

### Page contract

Every page is standalone HTML that declares its context inline *before* loading the shared script:

```html
<script>window.PAGE = { role:'project', path:'projects/hot-potato.html', base:'../', id:'hot-potato', name:"Hot Potato" };</script>
<script src="../shared/site.js"></script>
```

- `role` — `home` (landing) or `project` (case study). `IS_PROJECT` branches most behaviour.
- `base` — prefix applied by `asset()` (shared/site.js:17) so identical code works from `/` and `/projects/`. **Stored paths are always repo-relative (`assets/…`)**; never store a `base`-prefixed or absolute URL.
- `path` — the file this page publishes to. Each page publishes only itself.

`shared/site.js` and `shared/portfolio.css` are shared by all five pages. `site.js` is one flat script in global scope (no modules, no bundler) and is wired to the HTML through inline `onclick="…"` handlers — so renaming a function means grepping all five HTML files, then running `checks.sh` (R2).

### Three storage planes

| Plane | Holds | Keys |
|---|---|---|
| `localStorage` | landing-page field HTML, per-project case-study HTML, theme, dev-log working copy, GitHub token | `pmpr_portfolio_v2`, `pmpr_cs_content_<id>`, `pmpr_cs_<key>`, `pmpr_img_<zone>`, `pmpr_theme`, `pmpr_devlog_v1`, `pmpr_gh_token` |
| IndexedDB (`pmpr-media` / `files`) | uploaded images and clips, `{path, data, type, published}` | keyed by repo-relative `assets/…` path |
| Baked into the HTML | published dev-log entries, in `<script type="application/json" id="devlog-data">` on each project page | — |

`dlLoad()` (shared/site.js:1339) merges the baked (published) data with the local working copy: local entries win by `id`, and baked entries the browser doesn't know about are kept so a cleared `localStorage` never drops live content.

### Publishing = DOM snapshot

`buildPublishHTML()` (shared/site.js:1127) clones the **live `document.documentElement`** and serializes it. Consequences to keep in mind:

- Anything the script rendered at runtime is baked into the committed file (that's why `index.html` contains a generated `#ep-section-list`). Diffs will show churn you didn't write.
- The function must scrub every trace of transient editor state before serializing — panel innerHTML, toasts, focus outlines, mid-publish button labels, private entry titles. Adding new editor UI usually means adding it to that scrub list.
- `#dl-wrap` is stripped: the dev log renders from data on load, so baking it would produce two copies. Same reason it's removed in `saveCaseStudy()` (shared/site.js:390).
- Private entries are never baked (`dlPageData` → `dlPublicData`, shared/site.js:2396).

`ghPublish()` (shared/site.js:1193) does one commit via the git-data API: blobs for pending media + the page, one tree on top of `HEAD`, one commit, `PATCH` the branch ref. Target repo is hardcoded in `GH` (shared/site.js:1099). Media is committed as **real files under `assets/`** — nothing is base64'd into the page.

`buildExportHTML()` (shared/site.js:794) is the opposite: strips the editor, inlines CSS/JS and every `assets/` reference as data URIs, and rewrites sibling `.html` links to the live site so a single downloaded file works offline.

### Dev log

`DEVLOG = { projectId: [entry, …] }`. An entry is a small header (`title`, `summary`, `tools`, `private`, `published`, `v`) plus `blocks[]` — the body is entirely blocks, nothing is prescribed.

- Entry `id` doubles as its URL slug (`#/dev/<id>`) and follows the title until the entry is published, then freezes (`dlRetitle`, shared/site.js:1313) so shared links don't break.
- Adding a block type touches four places: `DE_BLOCKS` + `DE_NEW` (shared/site.js:2082) for the palette and default shape, `deRenderBlocks()` (shared/site.js:2287) for the editor UI, `dlRenderBlock()` (shared/site.js:1645) for the public render. If it holds media, also the ref-walkers `dlMediaRefs()` (shared/site.js:1561) and `dlExportData()` (shared/site.js:2414), which scan `b.src`, `b.a`, `b.b` and `b.items`.
- Changing entry shape means bumping `DL_SCHEMA` and extending `dlMigrate()` (shared/site.js:1378). Migration is idempotent, gated on `e.v`, and runs on every load — old published entries are upgraded in place.
- Routing: project pages handle `#/dev/<id>`; the landing page only redirects legacy `#/<project>/dev/<id>` links (`dlRoute`/`dlLegacyRedirect`, shared/site.js:1841).
- Media resolution order is `MEDIA_CACHE` (unpublished, in memory) → `ref.data` (export) → `asset(path)` (shared/site.js:1493). On error, `dlMediaFallback()` retries from IndexedDB then hides the figure — this is what covers the ~1 min GitHub Pages deploy lag after a publish.

### Theme

`PRESETS` (shared/site.js:971) hold ~8 seed colours + two font names; `computeVars()` derives the full CSS-variable set (shades, `rgba()` tones, dark-mode inversion via luminance) and `applyTheme()` writes them onto `:root`. `portfolio.css` reads only the variables — don't hardcode colours in new CSS.

## Gotchas

- **The editor panel markup (`#edit-panel`, `#dev-editor`) is duplicated in all five HTML files.** A UI change there must be applied to each one, and the landing page's panel legitimately differs from the project pages'.
- `README.md` and `SPEC.md` are user-facing docs and lag the code in places (e.g. README's theme-preset names don't match `PRESETS`, and SPEC.md still describes the site as a single HTML file). Trust the code.
- Uploads over 25 MB are rejected on purpose — everything published lands in git history.
