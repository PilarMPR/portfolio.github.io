# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static portfolio site (game designer, GitHub Pages) with **no build step, no dependencies, no tests**. Plain HTML/CSS/vanilla JS served as-is (`.nojekyll`).

The unusual part: the site edits and publishes *itself*. An in-page editor (opened by a hidden modifier gesture on the nav logo — see the EDIT MODE section of `shared/site.js`; deliberately not spelled out in the docs, which are public) makes the page editable, stores edits in the browser, and commits the current page back to this repo through the GitHub API. Most commits in `git log` ("Update portfolio content via in-page editor") were written by the site, not by hand.

The editor is gated on a stored GitHub token — `edUnlocked()` (shared/site.js:236) — so the gesture does nothing on a browser that has never published from here, and the chrome is built rather than served, so a published page contains no editor markup at all. **Neither is a security boundary and neither can be**: `site.js` is served to every visitor, so a determined reader can patch both out. What they still cannot do is publish, because GitHub checks the token server-side. Gate and chrome hide the editor; the token is what protects it. Don't let a future change confuse the two.

## Commands

```bash
python3 -m http.server        # serve the repo root, then open http://localhost:8000
bash docs/checks.sh           # static checks; no output = all clear
bash docs/smoke.sh            # loads all five pages in a real engine; "ok 5 pages" = clear
bash docs/safe-push.sh -n     # L2 as a script: verify without pushing (drop -n to push)
```

`file://` mostly works, but **Export** and the asset-inlining fetches require http. There is still no build or test framework — the two scripts above are plain shell, and neither installs anything.

`docs/checks.sh` runs six static checks — R2, R3, R5, R11, R12 and the figures quoted in R7 — each one a mistake that is otherwise invisible until a user clicks the wrong thing or the site goes blank. Run it after touching handler names, page markup, the shared script, or any number quoted in this file. Five are grep and awk; the syntax check compiles `site.js` with `node --check`, else `gjs`, and prints `SKIPPED` with neither rather than passing quietly on a check that never ran.

`docs/smoke.sh` is the runtime half, and the only thing here that proves the site *works* rather than merely parses. It loads every page in WebKitGTK via `gjs`, captures `window.onerror` and unhandled rejections from before the first script runs, and asserts each page reaches its `window.PAGE` contract, applies the theme, renders a body, keeps its sentinels, and defines every function the markup calls. A missing `#lightbox` shows up here as `TypeError: null is not an object (evaluating 'lb.addEventListener')` — R3 demonstrated instead of asserted. It needs a display and skips loudly without one.

It also asserts the three things the editor now depends on: that no page *serves* editor chrome (R5), that `edChrome()` builds all four subtrees exactly once when called twice, and that `toggleEdit()` refuses to open with no token stored — it clears the token itself first, rather than assuming a clean profile, so a token left by another run can't turn that green by accident.

> Running `gjs` with GTK from a VS Code terminal fails with `undefined symbol: __libc_pthread_init` — the snap exports `GTK_PATH` and friends, which drags in snap's glibc. `smoke.sh` strips those vars itself; a bare `gjs` call using GTK needs the same treatment.

## Working agreement

Twelve rules and four loops. Two living files carry the state between sessions:
`docs/worklog.md` (append-only record of what happened) and `docs/backlog.md`
(ranked optimization ideas, never acted on unprompted).

### Rules

R1–R3 are the ones the repo cannot recover from on its own. `docs/checks.sh` enforces R2, R3, R5, R11 and R12; the rest are on you. Every rule below is a real failure mode in this repo, not general advice.

- **R1 — Don't hand-edit page *content*.** The HTML files are machine-written; the next browser publish overwrites the whole file from that browser's DOM + `localStorage`, discarding hand edits it doesn't know about. Structural markup, CSS and JS changes are safe (the browser reloads them); prose and images go through the editor. If a task needs a content change, say so and stop.
- **R2 — Every `on*=` handler name must resolve to a declaration in `site.js`.** Handlers are wired by string, in the five HTML files *and* inside `site.js` template literals. Nothing else in the repo can catch a rename that misses one — no import fails, no lint fires; the button simply does nothing when clicked.
- **R3 — Every page keeps the sentinel elements.** `#cursor`, `#nav`, `#nav-logo` and `#lightbox` are captured at load with no null check; removing one throws and kills the rest of the script. `checks.sh` requires all four. (This is why export leaves them in place, inert.) `#fmt-bar` and `#de-toast` were on this list until the chrome moved into script — they are built on demand now, so `fmtBarEl()` (shared/site.js:1162) and `dlToast()` (shared/site.js:2240) must keep tolerating their absence rather than assuming a page has them.
- **R4 — Editor UI is built, never authored.** `edChrome()` (shared/site.js:491) creates `#edit-panel`, `#fmt-bar`, `#dev-editor` and `#de-toast` from the templates above it, on first entry to edit mode; every publish removes all four from the clone by id. New editor UI belongs **inside that subtree**, where it is removed for free. Put it anywhere else and it is serialized into every future publish — which is what the stray `#ep-section-list` / `#ep-presets` markup in the old `projects/block-city.html` was.
- **R5 — There is one copy of the editor chrome, in `site.js`.** It used to be duplicated across all five HTML files and drifted anyway — `index.html` had silently lost its `#ep-grip`, so its panel could not be collapsed on a phone. `checks.sh` now fails if any page carries `#edit-panel`, `#fmt-bar`, `#dev-editor` or `#de-toast` as markup; a page that does was published by a browser running the old script, and needs republishing rather than hand-editing (R1). Role differences go in the template — `epPanelHTML()` (shared/site.js:314) gates the landing page's Education button on `IS_PROJECT`.
- **R6 — No new silent catches, and no raw storage writes.** `catch (e) {}` is why `localStorage` quota failures were once indistinguishable from successful saves. Every write now goes through `safeSet()` (shared/site.js:40), which reports via `reportError()` (shared/site.js:31) — use it instead of `localStorage.setItem`, and never remove an old key until `safeSet` has returned true. 11 silent catches remain elsewhere in the file; every new catch reaches the user via `dlToast()` or `alert()`, or at minimum `console.warn`.
- **R7 — No hex literals in new CSS.** Use the variables `computeVars()` writes. 86 literals already survive in `portfolio.css` (against 623 `var()` uses), plus 15 in `shared/theme.css` — they are exactly the parts that ignore presets and don't invert in dark mode. Don't add another. These counts drift when the editor republishes the theme — one did on 2026-08-08 — so `checks.sh` recomputes all three and fails if this sentence disagrees with the files.
- **R8 — Never force-push, `reset --hard`, or rebase `main`.** `origin/main` holds content the browser published from someone's `localStorage`; nothing local can reconstruct it. `--force-with-lease` is no safer here — L2 always fetches first, and after a fetch it will happily overwrite a browser commit. Blanket restores belong in the same family: `git checkout -- .` and `git restore .` take uncommitted work with them and there is no reflog for it — name the files you actually want reverted.
- **R9 — Nothing secret in `docs/`.** No tokens, no absolute local paths, no personal data. Those files are committed to a public repo and served by GitHub Pages.
- **R10 — Backlog items are inert.** Never act on anything in `docs/backlog.md` unless the user names it. Noticing something is a reason to file it, not to fix it.
- **R11 — Every `shared/site.js:NNN` cited in this file must still name what it points at.** The browser rewrites `site.js` on every publish, so a citation rots the moment anything above it grows — one batch of commits on 2026-08-07 invalidated 18 of 19 at once, silently. `checks.sh` re-resolves all 40 against the file. Cite a symbol in backticks on the same line as its number, or the check has nothing to match. `docs/backlog.md` is exempt: it pins its numbers to a stated commit.
- **R12 — `site.js` must parse.** One flat script, no module graph, no bundler — a stray brace blanks all five pages and no other check here would notice. `checks.sh` compiles it without executing it, so browser globals don't matter.

### Loops

**L1 — Change loop** (every code task)
1. Read the target region *and every call site* before editing.
2. Make the change. Match surrounding style. No dependencies, no build step.
3. Re-read the rules it touches — rename → R2; page markup → R3/R5; editor UI → R4; CSS → R7; new catch → R6.
4. `bash docs/checks.sh` — must exit 0.
5. `git diff` — read every hunk. Revert anything unintended (baked editor state, reformatted machine-written HTML) before continuing. Revert by *name*, never `git checkout -- .` (R8).
6. `bash docs/smoke.sh` — must print `ok 5 pages`. This catches what step 4 cannot: a handler that throws, an element dereferenced at load, anything that parses but dies. It calls a few functions directly (`edChrome`, `toggleEdit`) but **dispatches no events**, so a gesture, a drag or a tab click is still unproven by it. For interaction changes, drive the real thing — a throwaway `gjs` probe that dispatches events into the same WebKit view is cheap and catches what neither script does (the 2026-08-09 gate and chrome work used three). State what you verified **and what you did not**.
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

`shared/site.js`, `shared/portfolio.css` and `shared/theme.css` are shared by all five pages. `site.js` is one flat script in global scope (no modules, no bundler) and is wired to its markup through inline `onclick="…"` handlers — so renaming a function means grepping the five HTML files **and the chrome templates inside `site.js` itself**, which is where most handlers now live, then running `checks.sh` (R2).

### Two card grids on the landing page

`#work > .projects` holds the four authored game cards. `#ai-work > #ai-projects` holds the **Independent AI projects** category and ships empty on purpose — every card in it is editor-added, because cards are page content (R1). CSS hides `#ai-work` outright until it contains a `.project`, so an unfilled category never publishes as a heading standing over nothing; `body.editing` always shows it, or there would be no way to add the first card.

**`document.querySelector('.projects')` is no longer unambiguous** — it returns the Work grid, which is correct only as a fallback. `insertProjectCard()` (shared/site.js:1249) takes the target grid's id and numbers cards per grid, so both categories start at 01. `autoSave()` records each card's grid by walking up from the card (shared/site.js:1462), and `loadSaved()` (shared/site.js:1520) routes it back there; a `__custom_cards__` record with no `grid` predates this section and falls back to Work.

### Editor lifecycle

The editor is neither shipped nor always available. Three gates in order, and only the last one is real:

1. **Gate** — `toggleEdit()` returns immediately unless `edUnlocked()` (shared/site.js:236) finds a token in `localStorage`. On any other browser the gesture is a silent no-op. Shift on the closing click routes to `edUnlock()` (shared/site.js:263), which validates a pasted token against the GitHub API — repo reachable *and* `permissions.push` — before storing it. Leaving edit mode is deliberately ungated, or a token cleared mid-session would strand the panel open.
2. **Build** — `edChrome()` (shared/site.js:491) appends `#edit-panel`, `#fmt-bar`, `#dev-editor` and `#de-toast` from three template functions. Idempotent, because a page published before the chrome moved into script still carries the old markup.
3. **Removal** — every publish drops all four by id, so the cycle leaves no trace in the committed file.

The gate and the missing markup hide the editor. **Neither protects it** — `site.js` is served to every visitor and both can be patched out in devtools. Only the token protects anything, because only GitHub can check it. `#de-toast` is the one piece that is not editor-only: `dlToast()` is reachable by a visitor pressing Copy link, so it builds its own host when missing.

### Three storage planes

| Plane | Holds | Keys |
|---|---|---|
| `localStorage` | landing-page field HTML, per-project case-study HTML, theme, dev-log working copy, GitHub token | `pmpr_portfolio_v2`, `pmpr_cs_content_<id>`, `pmpr_cs_<key>`, `pmpr_img_<zone>`, `pmpr_theme`, `pmpr_devlog_v1`, `pmpr_gh_token` |
| IndexedDB (`pmpr-media` / `files`) | uploaded images and clips, `{path, data, type, published}` | keyed by repo-relative `assets/…` path |
| Baked into the HTML | published dev-log entries, in `<script type="application/json" id="devlog-data">` on each project page | — |

`dlLoad()` (shared/site.js:2265) merges the baked (published) data with the local working copy: local entries win by `id`, and baked entries the browser doesn't know about are kept so a cleared `localStorage` never drops live content.

### Publishing = DOM snapshot

`buildPublishHTML()` (shared/site.js:1989) clones the **live `document.documentElement`** and serializes it. Consequences to keep in mind:

- Anything the script rendered at runtime is baked into the committed file. Diffs will show churn you didn't write.
- The editor is the exception, and it is handled structurally rather than by scrubbing: `EP_CHROME_IDS` (shared/site.js:312) names the four subtrees and every publish removes them from the clone whole. That is why nothing has to remember to blank a panel, a toast or a private entry title first — all of it is inside the removed subtree. Page-level state (focus outlines, an open mobile menu, `body.editing`) is still cleared by hand, because it sits on content the publish keeps.
- `#dl-wrap` is stripped (shared/site.js:849): the dev log renders from data on load, so baking it would produce two copies. Same reason it's removed before re-mounting in `dlMountLog()` (shared/site.js:2753), and excluded from the editable-field walk in `csFields()` (:846) and `migrateCaseSnapshot()` (:1118).
- Private entries are never baked (`dlPageData` → `dlPublicData`, shared/site.js:3351 → :3358).

`ghPublish()` (shared/site.js:2087) does one commit via the git-data API: blobs for pending media + the page, one tree on top of `HEAD`, one commit, `PATCH` the branch ref. Target repo is hardcoded in `GH` (shared/site.js:1961). Media is committed as **real files under `assets/`** — nothing is base64'd into the page.

`buildExportHTML()` (shared/site.js:1624) is the opposite: inlines CSS/JS and every `assets/` reference as data URIs, and rewrites sibling `.html` links to the live site so a single downloaded file works offline. It no longer has to strip the editor — every publish already did — so what its `forExport` branch removes is only the affordances that live inside page content (upload buttons, `contenteditable`), plus the `data-readonly` flag that makes `toggleEdit()` refuse.

### Dev log

`DEVLOG = { projectId: [entry, …] }`. An entry is a small header (`title`, `summary`, `tools`, `private`, `published`, `v`) plus `blocks[]` — the body is entirely blocks, nothing is prescribed.

- Entry `id` doubles as its URL slug (`#/dev/<id>`) and follows the title until the entry is published, then freezes (`dlRetitle`, shared/site.js:2229) so shared links don't break.
- Adding a block type touches four places: `DE_BLOCKS` (shared/site.js:3037) + `DE_NEW` (:3055) for the palette and default shape, `deRenderBlocks()` (shared/site.js:3242) for the editor UI, `dlRenderBlock()` (shared/site.js:2594) for the public render. If it holds media, also the ref-walkers `dlMediaRefs()` (shared/site.js:2495) and `dlExportData()` (shared/site.js:3369), which scan `b.src`, `b.a`, `b.b` and `b.items`.
- Changing entry shape means bumping `DL_SCHEMA` (currently `3`, shared/site.js:2304) and extending `dlMigrate()` (shared/site.js:2306). Migration is idempotent, gated on `e.v`, and runs on every load — old published entries are upgraded in place.
- Routing: project pages handle `#/dev/<id>`; the landing page only redirects legacy `#/<project>/dev/<id>` links (`dlRoute`/`dlLegacyRedirect`, shared/site.js:2793 / :2800).
- Media resolution order is `MEDIA_CACHE` (unpublished, in memory) → `ref.data` (export) → `asset(path)`, in `dlSrc()` (shared/site.js:2419). On error, `dlMediaFallback()` retries from IndexedDB then hides the figure — this is what covers the ~1 min GitHub Pages deploy lag after a publish.

### Theme

`PRESETS` (shared/site.js:1808) hold ~8 seed colours + two font names; `computeVars()` (shared/site.js:1853) derives the full CSS-variable set (shades, `rgba()` tones, dark-mode inversion via luminance) and `applyTheme()` writes them onto `:root`. `portfolio.css` and `shared/theme.css` read the variables — don't hardcode colours in new CSS (R7).

## Gotchas

- **The editor chrome is not in the HTML at all** — `edChrome()` builds it on first entry to edit mode and every publish removes it again, so a served page is about half the size it was and shows no editor in view-source. A page that still contains `#edit-panel` is stale, not authored. This is not a security boundary, and can't be made one: `site.js` is served to every visitor, so the gesture is readable by anyone who looks for it. What actually gates publishing is the GitHub token in `localStorage`.
- `README.md` and `SPEC.md` are user-facing docs, re-verified against the code on 2026-08-10 — but nothing checks them, so they lag again the moment the editor UI changes. They had drifted far enough to document a Layout tab that no longer exists and five theme presets that never did. `docs/summary-content.md` and `docs/summary-engineering.md` (same date) are the fuller versions and rot the same way. **Trust the code**, and when you change the panel, `PRESETS`, `COLOR_ROWS`, the font lists or `DE_BLOCKS`, fix the docs in the same commit — that is the only thing keeping them honest.
- Uploads over 25 MB are rejected on purpose — everything published lands in git history.
