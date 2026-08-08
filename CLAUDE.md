# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static portfolio site (game designer, GitHub Pages) with **no build step, no dependencies, no tests**. Plain HTML/CSS/vanilla JS served as-is (`.nojekyll`).

The unusual part: the site edits and publishes *itself*. An in-page editor (opened by a hidden modifier gesture on the nav logo — see the EDIT MODE section of `shared/site.js`; deliberately not spelled out in the docs, which are public) makes the page editable, stores edits in the browser, and commits the current page back to this repo through the GitHub API. Most commits in `git log` ("Update portfolio content via in-page editor") were written by the site, not by hand.

## Commands

```bash
python3 -m http.server        # serve the repo root, then open http://localhost:8000
bash docs/checks.sh           # static invariant checks; no output = all clear
```

`file://` mostly works, but **Export** and the asset-inlining fetches require http. There is no build or test framework — verify behaviour by loading the page and exercising the editor.

`docs/checks.sh` is the only automated check in the repo. It is plain grep over the HTML and `site.js`, it exits non-zero on failure, and it catches the two mistakes that are otherwise invisible until a user clicks the wrong thing (see R2/R3 below). Run it after touching handler names, page markup, or the shared script.

## Working agreement

Ten rules and four loops. Two living files carry the state between sessions:
`docs/worklog.md` (append-only record of what happened) and `docs/backlog.md`
(ranked optimization ideas, never acted on unprompted).

### Rules

R1–R3 are the ones the repo cannot recover from on its own. `docs/checks.sh` enforces R2 and R3; the rest are on you. Every rule below is a real failure mode in this repo, not general advice.

- **R1 — Don't hand-edit page *content*.** The HTML files are machine-written; the next browser publish overwrites the whole file from that browser's DOM + `localStorage`, discarding hand edits it doesn't know about. Structural markup, CSS and JS changes are safe (the browser reloads them); prose and images go through the editor. If a task needs a content change, say so and stop.
- **R2 — Every `on*=` handler name must resolve to a declaration in `site.js`.** Handlers are wired by string, in the five HTML files *and* inside `site.js` template literals. Nothing else in the repo can catch a rename that misses one — no import fails, no lint fires; the button simply does nothing when clicked.
- **R3 — Every page keeps the sentinel elements.** `#cursor`, `#nav`, `#nav-logo`, `#fmt-bar` and `#lightbox` are captured at load with no null check; removing one throws and kills the rest of the script. `#de-toast` is looked up lazily and null-guarded, so losing it fails quietly instead — every toast just disappears. `checks.sh` requires all six. (This is why export leaves them in place, inert.)
- **R4 — New editor UI joins the scrub list** in `buildPublishHTML()` (shared/site.js:1677), or it is serialized into every future publish. The stray `#ep-section-list` / `#ep-presets` markup in `projects/block-city.html` is what that looks like when it's missed.
- **R5 — Editor-chrome changes land in all five HTML files** (`#edit-panel`, `#fmt-bar`, `#dev-editor`, `#de-toast`). Afterwards the four project pages must still be byte-identical to each other (`diff` them); only `index.html`'s `#edit-panel` legitimately differs — it has the extra "+ Add" tab.
- **R6 — No new silent catches.** `catch (e) {}` is why `localStorage` quota failures are indistinguishable from successful saves (shared/site.js:780, 1103, 1123, 1154, 1248). Every new catch reaches the user via `dlToast()` or `alert()`, or at minimum `console.warn`.
- **R7 — No hex literals in new CSS.** Use the variables `computeVars()` writes. 86 literals already survive in `portfolio.css` (against 620 `var()` uses), plus 18 in `shared/theme.css` — they are exactly the parts that ignore presets and don't invert in dark mode. Don't add another.
- **R8 — Never force-push, `reset --hard`, or rebase `main`.** `origin/main` holds content the browser published from someone's `localStorage`; nothing local can reconstruct it. `--force-with-lease` is no safer here — L2 always fetches first, and after a fetch it will happily overwrite a browser commit.
- **R9 — Nothing secret in `docs/`.** No tokens, no absolute local paths, no personal data. Those files are committed to a public repo and served by GitHub Pages.
- **R10 — Backlog items are inert.** Never act on anything in `docs/backlog.md` unless the user names it. Noticing something is a reason to file it, not to fix it.

### Loops

**L1 — Change loop** (every code task)
1. Read the target region *and every call site* before editing.
2. Make the change. Match surrounding style. No dependencies, no build step.
3. Re-read the rules it touches — rename → R2; page markup → R3/R5; editor UI → R4; CSS → R7; new catch → R6.
4. `bash docs/checks.sh` — must exit 0.
5. `git diff` — read every hunk. Revert anything unintended (baked editor state, reformatted machine-written HTML) before continuing.
6. Verify: `python3 -m http.server`, load the page, open the editor with the gesture in `shared/site.js` (EDIT MODE section) and exercise the control you touched. State what you verified **and what you did not**.
7. Append one worklog entry.

**L2 — Safe-push loop** (the only way anything reaches `origin`)
1. `git status --short` — nothing unintended staged. Check for a parallel session's work before assuming the tree is yours.
2. `git fetch origin`, then `git log --oneline HEAD..origin/main`. **The browser publishes to `main` on its own — assume it has moved.**
3. If it moved: `git pull --rebase origin main`, then re-run `checks.sh` and re-read the diff. A conflict inside an HTML file means the user published while you worked — keep *their* content, re-apply only your structural change.
4. Ask before committing. Commit message: one line, sentence case, imperative, no scope, no prefix. Style: "Fix dev-log entry layout: unbalanced markup and stranded footers". The worklog entry ships inside the commit it describes.
5. Ask before pushing. Plain `git push origin main`, never a force variant (R8).
6. Rejected? Back to step 2. Never resolve a rejection with force.

**L3 — Error loop** (a check fails, a command fails, the page breaks)
1. Stop. Don't stack a second change on top of an unexplained failure.
2. Append an `ERR` worklog entry *before* attempting a fix — symptom, `file:line`, suspected cause.
3. Fix the smallest thing that explains it. One hypothesis at a time.
4. Re-run the failing check plus `checks.sh`.
5. Append `FIX` underneath (what actually worked) — or leave `ERR` open and say so plainly.
6. Two failed attempts on the same cause → stop and ask.

**L4 — Session-close loop**
1. `git status --short` — everything committed, or state what was left and why.
2. Anything noticed but not done → a new `docs/backlog.md` item. Never fixed unprompted (R10).
3. If this session made the Architecture section below wrong, fix it now.
4. Append one `SESSION` worklog entry: shipped / open / pick up next.

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

`shared/site.js`, `shared/portfolio.css` and `shared/theme.css` are shared by all five pages. `site.js` is one flat script in global scope (no modules, no bundler) and is wired to the HTML through inline `onclick="…"` handlers — so renaming a function means grepping all five HTML files, then running `checks.sh` (R2).

### Three storage planes

| Plane | Holds | Keys |
|---|---|---|
| `localStorage` | landing-page field HTML, per-project case-study HTML, theme, dev-log working copy, GitHub token | `pmpr_portfolio_v2`, `pmpr_cs_content_<id>`, `pmpr_cs_<key>`, `pmpr_img_<zone>`, `pmpr_theme`, `pmpr_devlog_v1`, `pmpr_gh_token` |
| IndexedDB (`pmpr-media` / `files`) | uploaded images and clips, `{path, data, type, published}` | keyed by repo-relative `assets/…` path |
| Baked into the HTML | published dev-log entries, in `<script type="application/json" id="devlog-data">` on each project page | — |

`dlLoad()` (shared/site.js:1940) merges the baked (published) data with the local working copy: local entries win by `id`, and baked entries the browser doesn't know about are kept so a cleared `localStorage` never drops live content.

### Publishing = DOM snapshot

`buildPublishHTML()` (shared/site.js:1677) clones the **live `document.documentElement`** and serializes it. Consequences to keep in mind:

- Anything the script rendered at runtime is baked into the committed file (that's why `index.html` contains a generated `#ep-section-list`). Diffs will show churn you didn't write.
- The function must scrub every trace of transient editor state before serializing — panel innerHTML, toasts, focus outlines, mid-publish button labels, private entry titles. Adding new editor UI usually means adding it to that scrub list.
- `#dl-wrap` is stripped (shared/site.js:1683): the dev log renders from data on load, so baking it would produce two copies. Same reason it's removed before re-mounting in `dlMountLog()` (shared/site.js:2428), and excluded from the editable-field walk in `csFields()` (:549) and `migrateCaseSnapshot()` (:821).
- Private entries are never baked (`dlPageData` → `dlPublicData`, shared/site.js:3026 → :3033).

`ghPublish()` (shared/site.js:1786) does one commit via the git-data API: blobs for pending media + the page, one tree on top of `HEAD`, one commit, `PATCH` the branch ref. Target repo is hardcoded in `GH` (shared/site.js:1649). Media is committed as **real files under `assets/`** — nothing is base64'd into the page.

`buildExportHTML()` (shared/site.js:1312) is the opposite: strips the editor, inlines CSS/JS and every `assets/` reference as data URIs, and rewrites sibling `.html` links to the live site so a single downloaded file works offline.

### Dev log

`DEVLOG = { projectId: [entry, …] }`. An entry is a small header (`title`, `summary`, `tools`, `private`, `published`, `v`) plus `blocks[]` — the body is entirely blocks, nothing is prescribed.

- Entry `id` doubles as its URL slug (`#/dev/<id>`) and follows the title until the entry is published, then freezes (`dlRetitle`, shared/site.js:1914) so shared links don't break.
- Adding a block type touches four places: `DE_BLOCKS` (shared/site.js:2712) + `DE_NEW` (:2730) for the palette and default shape, `deRenderBlocks()` (shared/site.js:2917) for the editor UI, `dlRenderBlock()` (shared/site.js:2269) for the public render. If it holds media, also the ref-walkers `dlMediaRefs()` (shared/site.js:2170) and `dlExportData()` (shared/site.js:3044), which scan `b.src`, `b.a`, `b.b` and `b.items`.
- Changing entry shape means bumping `DL_SCHEMA` (currently `3`, shared/site.js:1979) and extending `dlMigrate()` (shared/site.js:1981). Migration is idempotent, gated on `e.v`, and runs on every load — old published entries are upgraded in place.
- Routing: project pages handle `#/dev/<id>`; the landing page only redirects legacy `#/<project>/dev/<id>` links (`dlRoute`/`dlLegacyRedirect`, shared/site.js:2468 / :2475).
- Media resolution order is `MEDIA_CACHE` (unpublished, in memory) → `ref.data` (export) → `asset(path)`, in `dlSrc()` (shared/site.js:2094). On error, `dlMediaFallback()` retries from IndexedDB then hides the figure — this is what covers the ~1 min GitHub Pages deploy lag after a publish.

### Theme

`PRESETS` (shared/site.js:1496) hold ~8 seed colours + two font names; `computeVars()` (shared/site.js:1541) derives the full CSS-variable set (shades, `rgba()` tones, dark-mode inversion via luminance) and `applyTheme()` writes them onto `:root`. `portfolio.css` and `shared/theme.css` read the variables — don't hardcode colours in new CSS (R7).

## Gotchas

- **The editor panel markup (`#edit-panel`, `#dev-editor`) is duplicated in all five HTML files.** A UI change there must be applied to each one, and the landing page's panel legitimately differs from the project pages'.
- `README.md` and `SPEC.md` are user-facing docs and lag the code in places (e.g. README's theme-preset names don't match `PRESETS`, and SPEC.md still describes the site as a single HTML file). Trust the code.
- Uploads over 25 MB are rejected on purpose — everything published lands in git history.
