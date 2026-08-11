# The portfolio, engineered

How the site is built, how it got here, and what is proven versus assumed. For
what the site says, see [`summary-content.md`](summary-content.md).

Written against commit `8d14e63` (2026-08-10), 83 commits in. Figures below are
pinned to that commit — `shared/site.js` is rewritten by the browser on every
publish, so counts and line numbers drift. `docs/checks.sh` re-derives the ones
quoted in `CLAUDE.md`; the ones here are not checked.

---

## 1. Snapshot

| | |
|---|---|
| Stack | Plain HTML, CSS, vanilla JS. No build step, no dependencies, no package manager, no test framework |
| Hosting | GitHub Pages, `.nojekyll`, served exactly as committed |
| Pages | 5 (371 + 146–185 lines each) |
| Shared script | `shared/site.js` — 3,407 lines, 176 top-level functions, one flat global scope |
| Shared CSS | `shared/portfolio.css` 1,369 lines (620 `var()` uses, 86 surviving hex literals) · `shared/theme.css` 29 lines, machine-generated |
| Media | 21 files, ~2.8 MB, committed as real files under `assets/` |
| Verification | `docs/checks.sh` (6 static checks) · `docs/smoke.sh` (real-engine runtime test) · `docs/safe-push.sh` (push gate) |
| Commits | 83 total, of which **19 were written by the site itself** from a browser |

The unusual property: **the site edits and publishes itself.** An in-page editor
makes any page directly editable, stores edits in the browser, and commits the
resulting page — plus any new media — back to this repository through the GitHub
API. Roughly a quarter of the history was authored by the deployed site rather
than by a person in an editor.

## 2. How it got here

**April 2026 — the prototype.** ~20 commits, a single `index.html` growing to
1,542 lines. Editability was there from almost the first week ("editable
portfolio index html", 2026-04-07), along with image upload, a keyboard
shortcut to open the editor, and colour customisation. Several full reworks
("rework del portfolio entero"), responsive breakpoints and a hamburger nav
landed by 2026-04-25.

**24–25 July — the systems-notebook rework.** The single file was redesigned
around the GDD/notebook concept, then gained three things in two days that
defined everything after: **publish to GitHub in one click** (`ghPublish`), a
**Figma-style Design tab** with a live theme editor, and the **per-project
Development Log** with a fillable entry editor. The file then hit its limit and
was **split into five pages sharing one script and one stylesheet** — `site.js`
was 2,157 lines at that point. Export was fixed to produce a genuinely
standalone file. Touch affordances, reduced-motion support and lazy image
loading followed.

**5–6 August — modularity and one theme.** The dev-log entry lost its fixed
skeleton and became **pure blocks** — the old Problem/Approach/Result form,
phase, date and header image were all migrated into block form automatically, so
existing entries survived. Case studies stopped storing their whole `#case-view`
(which had silently cost Block City its sidebar) and moved to per-field storage.
The theme moved into **one shared file**, after publishing twice from different
pages left the site with three different accent colours at once. 10 MB of
orphaned media was removed and a 1.5 MB gallery GIF became animated WebP.

**7–8 August — the working agreement and the toolchain.** `CLAUDE.md` gained a
twelve-rule working agreement and four loops, backed by `docs/checks.sh`,
`docs/worklog.md` and `docs/backlog.md`. Then the checks earned their keep:
`site.js` syntax compilation, doc-citation re-resolution, prose-figure
recomputation, a WebKitGTK runtime smoke test, and `safe-push.sh` as a
mechanical version of the push loop. Three high-impact backlog items closed the
same week — a global error handler, a `safeSet()` wrapper over every storage
write, and a publish that re-reads the head sha before committing.

**9–10 August — hiding and gating the editor.** All editor markup moved out of
the five HTML files and into template functions in `site.js`, built on demand;
pages shrank by roughly half (index 706 → 371 lines). Then the editor was gated
on a **stored GitHub token**, so the opening gesture is a silent no-op on any
browser that has never published from here.

## 3. Architecture

### Page contract

Each page is standalone HTML that declares its own context inline, before the
shared script loads:

```html
<script>window.PAGE = { role:'project', path:'projects/hot-potato.html',
                        base:'../', id:'hot-potato', name:"Hot Potato" };</script>
<script src="../shared/site.js"></script>
```

`role` (`home` | `project`) branches most behaviour through a single
`IS_PROJECT` constant. `base` is prefixed to every asset URL so identical code
works from `/` and from `/projects/`; stored paths are always repo-relative.
`path` is the file that page publishes to — **each page publishes only itself**.

There is no module system. `site.js` is one flat script in global scope, wired to
its markup by `on*=` attribute strings, in the five HTML files *and* inside the
editor templates in `site.js` itself. That is why renaming a function is a
grep-all-six-places operation, and why a check exists for exactly that.

### Three storage planes

| Plane | Holds |
|---|---|
| `localStorage` | Landing-page fields, per-project case-study fields, theme, dev-log working copy, GitHub token |
| IndexedDB (`pmpr-media`) | Uploaded images and clips as `{path, data, type, published}`, keyed by repo-relative path |
| Baked into the HTML | Published dev-log entries, in a `<script type="application/json" id="devlog-data">` block per page |

On load the baked data and the local working copy are **merged**, not swapped:
local entries win by `id`, and baked entries the browser has never seen are
kept — so clearing `localStorage` cannot silently delete live content.

### Publishing is a DOM snapshot

`buildPublishHTML()` clones the live `document.documentElement` and serializes
it. Two consequences shape most of the codebase's rules:

1. Anything the script rendered at runtime is baked into the committed file. The
   published pages carry churn nobody typed.
2. The editor has to be removed from the clone. This is done **structurally, not
   by scrubbing**: four subtrees are named by id and deleted whole, so nothing
   has to remember to blank a panel, a toast, or a private entry's title first.
   Only page-level state that sits on kept content (focus outlines, an open
   mobile menu, `body.editing`) is cleared by hand.

`ghPublish()` then does one commit through the git-data API: blobs for the page
and any pending media, one tree on top of `HEAD`, one commit, one ref `PATCH`.
Media goes up as **real files under `assets/`** — nothing is base64'd into the
markup, which is why the landing page is 20 KB and a visitor downloads only the
images for the project they opened.

`buildExportHTML()` is the mirror image: it inlines CSS, JS and every `assets/`
reference as data URIs, rewrites sibling links to the live site, and produces one
read-only file that works offline, from a USB stick or as an email attachment.

### Dev log

`DEVLOG = { projectId: [entry, …] }`. An entry is a small header plus `blocks[]`
— the body is entirely blocks, nothing is prescribed. Fourteen block types.

The parts a future change has to keep in step:

- Adding a block type touches four places: the palette, the default shape, the
  editor renderer and the public renderer — plus the two media ref-walkers if it
  holds media.
- Entry `id` doubles as the URL slug and follows the title **until the entry is
  published, then freezes**, so shared links do not break.
- Changing entry shape means bumping the schema version and extending the
  migration, which is idempotent, gated on the entry's own `v`, and runs on every
  load. Old published entries are upgraded in place.
- Media resolves in-memory-cache → export data → `assets/` path, with a fallback
  that retries from IndexedDB and then hides the figure — this is what covers the
  ~1 minute GitHub Pages deploy lag after a publish.

### Theme

Six presets, each six seed colours plus two font names. `computeVars()` derives
the entire CSS-variable set from those — shades, `rgba()` tones, and dark-mode
inversion decided by luminance — and `applyTheme()` writes them onto `:root`.
Publishing writes `shared/theme.css` from the same source, so **publishing any
page recolours the whole site**.

Translucent shades derive from three emitted triplets (`--accent-rgb`,
`--text-rgb`, `--yellow-rgb`), so rules can pick their own alpha and still
follow the theme. Around 70 shades used to be literals from the original
red-pen design, which meant changing the accent barely changed anything.

### Responsive

Four breakpoints (1100 / 900 / 620 / 420px), defined at the *end* of the
stylesheet on purpose so later rules win by source order and nothing needs an
inflated selector. `--nav-h` is the single source of truth for header height —
CSS uses it and the script reads it back, so scroll offsets cannot drift out of
step. It is deliberately not a theme variable, since `applyTheme()` would
override it.

Below 900px the editor drawer becomes a bottom sheet that collapses to a peek,
so the page being edited stays visible.

## 4. The editor lifecycle

Three gates, in order, and **only the last one is real**:

1. **Gate.** The opening gesture returns immediately unless a GitHub token is
   found in `localStorage`. On any other browser it is a silent no-op. A modifier
   variant of the closing click routes to the unlock path instead, which
   validates a pasted token against the GitHub API — repo reachable *and*
   `permissions.push` — before storing it. Leaving edit mode is deliberately
   ungated, or a token cleared mid-session would strand the panel open.
2. **Build.** The chrome — edit panel, formatting bar, dev-entry editor, toast —
   is built from three template functions on first entry to edit mode.
   Idempotent, because a page published before the chrome moved into script may
   still carry the old markup.
3. **Removal.** Every publish drops all four subtrees by id, so the cycle leaves
   no trace in the committed file.

**The honest ceiling:** `site.js` is served to every visitor, so both the gesture
and the gate are readable and can be patched out in devtools. What cannot be
bypassed is publishing, because GitHub checks the token server-side. The gesture
and the missing markup *hide* the editor; the token is what *protects* it. The
documentation says this in three places on purpose, because it is exactly the
kind of thing a later change quietly confuses.

## 5. Verification

There is no test framework and no CI. There are three shell scripts, and between
them they cover more than the absence of a framework suggests.

**`docs/checks.sh`** — six static checks, no output means clear:

| Check | Catches |
|---|---|
| handlers | An `on*=` handler name with no matching declaration — the button that silently does nothing |
| sentinels | A page missing `#cursor`, `#nav`, `#nav-logo` or `#lightbox`, captured at load with no null check |
| no-chrome | A page that ships editor markup — i.e. was published by a browser running an old script |
| syntax | `site.js` failing to parse, which blanks all five pages at once |
| citations | Every `shared/site.js:NNN` line reference in `CLAUDE.md` still landing on what it names |
| counts | Figures quoted in the docs disagreeing with the files they describe |

**`docs/smoke.sh` + `smoke.js`** — the only thing here that proves the site
*works* rather than merely parses. It loads all five pages in WebKitGTK via
`gjs`, captures `window.onerror` and unhandled rejections from before the first
script runs, and asserts each page reaches its `window.PAGE` contract, applies
the theme, renders a body, keeps its sentinels, and defines every function its
markup calls. It also asserts the three editor invariants: no page serves the
chrome, the builder produces each subtree exactly once when called twice, and
the gate refuses to open with no token stored — clearing the token itself first,
so a leftover token cannot turn that green by accident.

**`docs/safe-push.sh`** — the push loop as a script. Refuses on a dirty tree, on
`origin/main` being ahead, on either check script failing, or on a token or local
path appearing in the outgoing diff. It **refuses rather than resolves**: when a
page conflicts, which side wins is a judgement about the author's published
content, not a call a script gets to make.

Beyond the committed scripts, interaction work is verified with throwaway
`gjs` probes that dispatch real events into the same WebKit view — the gesture,
privacy and toast probes from 2026-08-09 ran 14/14, 18/18 and 6/6. Those live in
a scratchpad and are **not committed**, which is a known gap: a future session
inherits only the assertions that were deliberately folded into `smoke.sh`.

## 6. The working agreement

Twelve rules and four loops in `CLAUDE.md`, with two living files carrying state
between sessions: `docs/worklog.md` (append-only record) and `docs/backlog.md`
(ranked ideas, never acted on unprompted). Every rule is a failure mode that has
actually occurred here, not general advice. The ones that shape day-to-day work:

- **Never hand-edit page content.** HTML files are machine-written; the next
  browser publish overwrites the whole file from that browser's DOM and
  `localStorage`, discarding hand edits it never knew about. Structure, CSS and
  JS are safe. Prose and images go through the editor.
- **Handler names are contracts.** They exist only as strings across six files.
- **Editor UI is built, never authored**, and lives inside the removed subtree so
  it is stripped for free.
- **No silent catches, no raw storage writes.** Every write goes through a helper
  that reports failure, because a quota error used to be indistinguishable from a
  successful save.
- **Never force-push, `reset --hard`, or rebase `main`.** `origin/main` holds
  content published from someone's browser storage; nothing local can
  reconstruct it. Blanket restores (`git checkout -- .`) are in the same family —
  they take uncommitted work with them and there is no reflog for it.

The failure modes that produced these rules are worth knowing because they
repeat: **the browser publishes to `main` on its own**, so origin moves with no
local action (twice in one day on 2026-08-08, once 17 commits deep); a batch of
publishes invalidated 18 of 19 documentation line references at once, silently;
and a fault-injection harness using `git checkout -- .` destroyed the very
uncommitted script it was testing, so two checks "passed" that no longer
existed.

## 7. State of the backlog

Eighteen items filed, eight closed:

**Done.** Global error handler · `safeSet()` over all 11 storage writes (silent
catches 20 → 11) · publish re-reads the head sha before committing · editor
chrome de-duplicated out of five files · baked editor artifacts removed · doc
line-number rot made a check failure · the private-entry label leak · the
editor gesture gated on a stored token.

**Open, highest value first.** Publish is non-transactional (mitigable, not
solvable, through the git-data API) · token invalidation keys off an error
*string* rather than a status code · 101 hex literals still bypassing the theme
· storage failures on the profile and case-study paths still never reach the
user · published assets are never garbage-collected (a safe fix has to union
references across all five published pages first, or it would delete every live
card image) · browser-extension attributes baking into published pages · scroll
state baked onto the nav · dead code in the publish path · five stale remote
branches · **and the one with a real user cost: the editor cannot be opened on a
phone at all**, since the only entry point cannot be performed on a touchscreen
and there is no touch path anywhere in the file.

## 8. What is not proven

Stated plainly, because everything above is green:

- **No hand-driven browser has ever been used.** WebKitGTK via `gjs` is the
  engine behind every passing result. Nothing has been exercised on a real
  phone.
- **Token validation has never run against a live GitHub response.** The probes
  never reach the network; the first real exercise is the first new device.
- **The publish abort path has never fired in anger.** It was written for a
  concurrent publish that has not yet happened.
- **`smoke.sh` dispatches no events.** It calls a couple of functions directly,
  but a gesture, a drag or a tab click is unproven by it. Interaction changes
  need a purpose-built probe.
- **Nothing checks the visitor-facing toast**, which is the one place where
  editor chrome and visitor UI overlap — a regression there was caught by reading
  a diff, and no check covers it even now.
