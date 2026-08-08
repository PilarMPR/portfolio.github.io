# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static portfolio site (game designer, GitHub Pages) with **no build step, no dependencies, no tests**. Plain HTML/CSS/vanilla JS served as-is (`.nojekyll`).

The unusual part: the site edits and publishes *itself*. An in-page editor (opened by a hidden modifier gesture on the nav logo — see the EDIT MODE section of `shared/site.js`; deliberately not spelled out in the docs, which are public) makes the page editable, stores edits in the browser, and commits the current page back to this repo through the GitHub API. Most commits in `git log` ("Update portfolio content via in-page editor") were written by the site, not by hand.

## Commands

```bash
python3 -m http.server        # serve the repo root, then open http://localhost:8000
bash docs/checks.sh           # static checks; no output = all clear
bash docs/smoke.sh            # loads all five pages in a real engine; "ok 5 pages" = clear
bash docs/safe-push.sh -n     # L2 as a script: verify without pushing (drop -n to push)
```

`file://` mostly works, but **Export** and the asset-inlining fetches require http. There is still no build or test framework — the two scripts above are plain shell, and neither installs anything.

`docs/checks.sh` runs five static checks — R2, R3, R11, R12 and the figures quoted in R7 — each one a mistake that is otherwise invisible until a user clicks the wrong thing or the site goes blank. Run it after touching handler names, page markup, the shared script, or any number quoted in this file. Four are grep and awk; the syntax check compiles `site.js` with `node --check`, else `gjs`, and prints `SKIPPED` with neither rather than passing quietly on a check that never ran.

`docs/smoke.sh` is the runtime half, and the only thing here that proves the site *works* rather than merely parses. It loads every page in WebKitGTK via `gjs`, captures `window.onerror` and unhandled rejections from before the first script runs, and asserts each page reaches its `window.PAGE` contract, applies the theme, renders a body, keeps its sentinels, and defines every function the markup calls. A missing `#lightbox` shows up here as `TypeError: null is not an object (evaluating 'lb.addEventListener')` — R3 demonstrated instead of asserted. It needs a display and skips loudly without one.

> Running `gjs` with GTK from a VS Code terminal fails with `undefined symbol: __libc_pthread_init` — the snap exports `GTK_PATH` and friends, which drags in snap's glibc. `smoke.sh` strips those vars itself; a bare `gjs` call using GTK needs the same treatment.

## Working agreement

Twelve rules and four loops. Two living files carry the state between sessions:
`docs/worklog.md` (append-only record of what happened) and `docs/backlog.md`
(ranked optimization ideas, never acted on unprompted).

### Rules

R1–R3 are the ones the repo cannot recover from on its own. `docs/checks.sh` enforces R2, R3, R11 and R12; the rest are on you. Every rule below is a real failure mode in this repo, not general advice.

- **R1 — Don't hand-edit page *content*.** The HTML files are machine-written; the next browser publish overwrites the whole file from that browser's DOM + `localStorage`, discarding hand edits it doesn't know about. Structural markup, CSS and JS changes are safe (the browser reloads them); prose and images go through the editor. If a task needs a content change, say so and stop.
- **R2 — Every `on*=` handler name must resolve to a declaration in `site.js`.** Handlers are wired by string, in the five HTML files *and* inside `site.js` template literals. Nothing else in the repo can catch a rename that misses one — no import fails, no lint fires; the button simply does nothing when clicked.
- **R3 — Every page keeps the sentinel elements.** `#cursor`, `#nav`, `#nav-logo`, `#fmt-bar` and `#lightbox` are captured at load with no null check; removing one throws and kills the rest of the script. `#de-toast` is looked up lazily and null-guarded, so losing it fails quietly instead — every toast just disappears. `checks.sh` requires all six. (This is why export leaves them in place, inert.)
- **R4 — New editor UI joins the scrub list** in `buildPublishHTML()` (shared/site.js:1703), or it is serialized into every future publish. The stray `#ep-section-list` / `#ep-presets` markup in `projects/block-city.html` is what that looks like when it's missed.
- **R5 — Editor-chrome changes land in all five HTML files** (`#edit-panel`, `#fmt-bar`, `#dev-editor`, `#de-toast`). Afterwards the four project pages must still be byte-identical to each other (`diff` them); only `index.html`'s `#edit-panel` legitimately differs — it has the extra "+ Add" tab.
- **R6 — No new silent catches, and no raw storage writes.** `catch (e) {}` is why `localStorage` quota failures were once indistinguishable from successful saves. Every write now goes through `safeSet()` (shared/site.js:40), which reports via `reportError()` (shared/site.js:31) — use it instead of `localStorage.setItem`, and never remove an old key until `safeSet` has returned true. 11 silent catches remain elsewhere in the file; every new catch reaches the user via `dlToast()` or `alert()`, or at minimum `console.warn`.
- **R7 — No hex literals in new CSS.** Use the variables `computeVars()` writes. 86 literals already survive in `portfolio.css` (against 620 `var()` uses), plus 15 in `shared/theme.css` — they are exactly the parts that ignore presets and don't invert in dark mode. Don't add another. These counts drift when the editor republishes the theme — one did on 2026-08-08 — so `checks.sh` recomputes all three and fails if this sentence disagrees with the files.
- **R8 — Never force-push, `reset --hard`, or rebase `main`.** `origin/main` holds content the browser published from someone's `localStorage`; nothing local can reconstruct it. `--force-with-lease` is no safer here — L2 always fetches first, and after a fetch it will happily overwrite a browser commit. Blanket restores belong in the same family: `git checkout -- .` and `git restore .` take uncommitted work with them and there is no reflog for it — name the files you actually want reverted.
- **R9 — Nothing secret in `docs/`.** No tokens, no absolute local paths, no personal data. Those files are committed to a public repo and served by GitHub Pages.
- **R10 — Backlog items are inert.** Never act on anything in `docs/backlog.md` unless the user names it. Noticing something is a reason to file it, not to fix it.
- **R11 — Every `shared/site.js:NNN` cited in this file must still name what it points at.** The browser rewrites `site.js` on every publish, so a citation rots the moment anything above it grows — one batch of commits on 2026-08-07 invalidated 18 of 19 at once, silently. `checks.sh` re-resolves all 29 against the file. Cite a symbol in backticks on the same line as its number, or the check has nothing to match. `docs/backlog.md` is exempt: it pins its numbers to a stated commit.
- **R12 — `site.js` must parse.** One flat script, no module graph, no bundler — a stray brace blanks all five pages and no other check here would notice. `checks.sh` compiles it without executing it, so browser globals don't matter.

### Loops

**L1 — Change loop** (every code task)
1. Read the target region *and every call site* before editing.
2. Make the change. Match surrounding style. No dependencies, no build step.
3. Re-read the rules it touches — rename → R2; page markup → R3/R5; editor UI → R4; CSS → R7; new catch → R6.
4. `bash docs/checks.sh` — must exit 0.
5. `git diff` — read every hunk. Revert anything unintended (baked editor state, reformatted machine-written HTML) before continuing. Revert by *name*, never `git checkout -- .` (R8).
6. `bash docs/smoke.sh` — must print `ok 5 pages`. This catches what step 4 cannot: a handler that throws, an element dereferenced at load, anything that parses but dies. It does **not** click anything, so for interaction changes also load the page yourself and exercise the control. State what you verified **and what you did not**.
7. Append one worklog entry.

**L2 — Safe-push loop** (the only way anything reaches `origin`)

`bash docs/safe-push.sh` performs steps 1–3 and 5, and refuses rather than guesses. Run it with `-n` to verify without pushing. The steps are here because you still have to understand what it refused and why.

1. `git status --short` — nothing unintended staged. Check for a parallel session's work before assuming the tree is yours.
2. `git fetch origin`, then `git log --oneline HEAD..origin/main`. **The browser publishes to `main` on its own — assume it has moved.**
3. If it moved: `git pull --rebase origin main`, then re-run `checks.sh` and `smoke.sh` and re-read the diff. A conflict inside an HTML file means the user published while you worked — keep *their* content, re-apply only your structural change. The script stops here deliberately: which side of that conflict wins is not a call a script gets to make.
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

`dlLoad()` (shared/site.js:1979) merges the baked (published) data with the local working copy: local entries win by `id`, and baked entries the browser doesn't know about are kept so a cleared `localStorage` never drops live content.

### Publishing = DOM snapshot

`buildPublishHTML()` (shared/site.js:1703) clones the **live `document.documentElement`** and serializes it. Consequences to keep in mind:

- Anything the script rendered at runtime is baked into the committed file (that's why `index.html` contains a generated `#ep-section-list`). Diffs will show churn you didn't write.
- The function must scrub every trace of transient editor state before serializing — panel innerHTML, toasts, focus outlines, mid-publish button labels, private entry titles. Adding new editor UI usually means adding it to that scrub list.
- `#dl-wrap` is stripped (shared/site.js:1709): the dev log renders from data on load, so baking it would produce two copies. Same reason it's removed before re-mounting in `dlMountLog()` (shared/site.js:2467), and excluded from the editable-field walk in `csFields()` (:577) and `migrateCaseSnapshot()` (:849).
- Private entries are never baked (`dlPageData` → `dlPublicData`, shared/site.js:3065 → :3072).

`ghPublish()` (shared/site.js:1812) does one commit via the git-data API: blobs for pending media + the page, one tree on top of `HEAD`, one commit, `PATCH` the branch ref. Target repo is hardcoded in `GH` (shared/site.js:1675). Media is committed as **real files under `assets/`** — nothing is base64'd into the page.

`buildExportHTML()` (shared/site.js:1338) is the opposite: strips the editor, inlines CSS/JS and every `assets/` reference as data URIs, and rewrites sibling `.html` links to the live site so a single downloaded file works offline.

### Dev log

`DEVLOG = { projectId: [entry, …] }`. An entry is a small header (`title`, `summary`, `tools`, `private`, `published`, `v`) plus `blocks[]` — the body is entirely blocks, nothing is prescribed.

- Entry `id` doubles as its URL slug (`#/dev/<id>`) and follows the title until the entry is published, then freezes (`dlRetitle`, shared/site.js:1954) so shared links don't break.
- Adding a block type touches four places: `DE_BLOCKS` (shared/site.js:2751) + `DE_NEW` (:2769) for the palette and default shape, `deRenderBlocks()` (shared/site.js:2956) for the editor UI, `dlRenderBlock()` (shared/site.js:2308) for the public render. If it holds media, also the ref-walkers `dlMediaRefs()` (shared/site.js:2209) and `dlExportData()` (shared/site.js:3083), which scan `b.src`, `b.a`, `b.b` and `b.items`.
- Changing entry shape means bumping `DL_SCHEMA` (currently `3`, shared/site.js:2018) and extending `dlMigrate()` (shared/site.js:2020). Migration is idempotent, gated on `e.v`, and runs on every load — old published entries are upgraded in place.
- Routing: project pages handle `#/dev/<id>`; the landing page only redirects legacy `#/<project>/dev/<id>` links (`dlRoute`/`dlLegacyRedirect`, shared/site.js:2507 / :2514).
- Media resolution order is `MEDIA_CACHE` (unpublished, in memory) → `ref.data` (export) → `asset(path)`, in `dlSrc()` (shared/site.js:2133). On error, `dlMediaFallback()` retries from IndexedDB then hides the figure — this is what covers the ~1 min GitHub Pages deploy lag after a publish.

### Theme

`PRESETS` (shared/site.js:1522) hold ~8 seed colours + two font names; `computeVars()` (shared/site.js:1567) derives the full CSS-variable set (shades, `rgba()` tones, dark-mode inversion via luminance) and `applyTheme()` writes them onto `:root`. `portfolio.css` and `shared/theme.css` read the variables — don't hardcode colours in new CSS (R7).

## Gotchas

- **The editor panel markup (`#edit-panel`, `#dev-editor`) is duplicated in all five HTML files.** A UI change there must be applied to each one, and the landing page's panel legitimately differs from the project pages'.
- `README.md` and `SPEC.md` are user-facing docs and lag the code in places (e.g. README's theme-preset names don't match `PRESETS`, and SPEC.md still describes the site as a single HTML file). Trust the code.
- Uploads over 25 MB are rejected on purpose — everything published lands in git history.
