# Work log

Append-only. Newest at the bottom. One entry per task, written *before* the
commit so it ships inside the commit it describes — that is why `push:` says
"this commit" rather than a sha. Never rewrite an entry; add a `FIX` entry
below it instead. Past ~300 lines, move everything older than the current year
to `docs/worklog-archive.md` in one commit.

Kinds: `OK` (worked) · `ERR` (broke) · `FIX` (resolved an ERR) · `SESSION` (close-out).

    ### <YYYY-MM-DD> · <OK|ERR|FIX|SESSION> · <one-line title>
    - what: <change made, or symptom observed> — file:line
    - checks: checks.sh <ok|FAIL> · manual: <what you clicked, or none>
    - push: <this commit | not pushed | rebased onto N browser commits>
    - note: <optional — surprise, follow-up, OPT-nn raised>

---

### 2026-08-07 · OK · Add docs/checks.sh and prove it catches both failure modes
- what: `docs/checks.sh` — greps every `on*=` handler name against declarations
  in `site.js` (R2), and every page for the six sentinel ids (R3)
- checks: checks.sh ok · manual: fault-injected both rules — renamed
  `toggleEdit` in shared/site.js and stripped `id="de-toast"` from
  projects/hot-potato.html; script reported both and exited 1; reverted via
  `git checkout` and re-verified exit 0
- push: this commit
- note: written for `bash`, not fish — the handler check needs process
  substitution. Invoke as `bash docs/checks.sh`.

### 2026-08-07 · ERR · Working tree held a parallel session's uncommitted commit
- what: `bd92d14` appeared on main mid-task, authored by a second Claude session
  in this same clone; it swept my untracked `docs/checks.sh` into its commit.
  `git status` came back clean when two untracked files were expected.
- checks: checks.sh ok · manual: inspected reflog, commit metadata, tree
- push: not pushed
- note: initially misread it as having deleted two Gotchas from CLAUDE.md. It
  had not — it promoted them into R1 and R3 of a new Working agreement section.
  Its R3 is more precise than my draft: `#de-toast` is null-guarded, so losing
  it degrades quietly rather than fatally.

### 2026-08-07 · FIX · Built on the parallel commit instead of rewriting it
- what: kept `bd92d14`, extended its R1–R3 to ten rules plus loops L1–L4
- checks: checks.sh ok · manual: none
- push: not pushed
- note: no history rewritten; the other session's commit message stands.

### 2026-08-07 · OK · Rebased onto 17 upstream commits and repaired the doc
- what: L2 step 2 caught `origin/main` 17 commits ahead. `shared/site.js` had
  grown 2465 → 3056 lines, `portfolio.css` by 609, and `shared/theme.css` was
  new. Rebased with `--autostash` (clean, no conflicts — `CLAUDE.md` and `docs/`
  don't exist upstream), then re-verified every factual claim in the rules and
  the backlog against the new tree.
- checks: checks.sh ok — passes against `origin/main` too, so the checks
  survived the upstream rewrite · manual: none (no site code changed)
- push: rebased onto 17 browser commits; not pushed
- note: 18 of the 19 `shared/site.js:NNN` citations in CLAUDE.md were pointing
  at unrelated code; only `asset()` at :17 survived. All corrected. Filed
  OPT-12 to stop this recurring. Backed the work up to the scratchpad before
  rebasing.

### 2026-08-07 · OK · Structure audit across the five pages
- what: compared head order, nav, sentinels, `window.PAGE` and editor chrome
  across all five HTML files. The three hand-authored project pages have
  byte-identical chrome (only the `window.PAGE` line differs) — R5 holds.
  Four drifts found: index.html had no `#nav-burger`/`#mobile-menu` (fixed
  below); `data-lt-installed="true"` baked onto `<html>` in index.html and
  block-city.html; `class="solid"` baked onto `#nav` in block-city.html;
  index.html's 12 `style=""` + 29 `spellcheck` predate the current scrub and
  self-clean on its next publish.
- checks: checks.sh ok · manual: static comparison only
- push: this commit
- note: raised OPT-13 and OPT-14 for the two scrub-list gaps. Not acted on (R10).

### 2026-08-07 · OK · Landing page lost its nav on phones — added the burger
- what: `portfolio.css:1265` hides `.nav-links a:not(.nav-cv)` below 620px and
  `:1266` shows `.nav-burger`. All four project pages carry the burger and the
  mobile menu; index.html never got them, so Work/About/Contact vanished on a
  phone with nothing to replace them — the exact regression the CSS comment
  above that rule says was fixed. Added both to index.html, wired to
  `scrollToSection()` (same-page jumps) rather than the project pages'
  cross-page hrefs. Four anchors, matching the `nth-child(1..4)` delays.
- checks: checks.sh ok — the new `onclick="scrollToSection('work')"` passes the
  R2 handler check · manual: **not verified in a browser** (see ERR below);
  confirmed by markup comparison that all five pages now match
- push: this commit
- note: `setMenu()` (site.js:91) was already null-guarded and already handles
  both link styles, and the scrub list (`:1738-1742`) already neutralizes an
  open menu — no site.js change was needed.

### 2026-08-07 · OK · Replaced the 6-click editor gesture with a modifier gesture
- what: six unmodified clicks on the logo → Alt + three clicks (site.js EDIT
  MODE section). An unmodified click is no longer intercepted at all, which
  also removes the old 420ms navigation delay on every logo click. Closed the
  second entry point: `?edit=1` opened the editor for *any* visitor who loaded
  the URL; it now also requires a same-tab `sessionStorage` handoff that only
  `openCaseEdit()` and `dlGoToProject()` set, so the "Open ✏" flow is unchanged
  and a pasted URL does nothing.
- checks: checks.sh ok · manual: **not verified in a browser** (see ERR below)
- push: this commit
- note: the gesture is obscurity, not security — `shared/site.js` is served to
  every visitor, so it is readable by anyone who looks. What actually gates
  damage is the GitHub token in `localStorage`. Kept the gesture out of
  CLAUDE.md and SPEC.md (README already did this); both now point at the code.

### 2026-08-07 · ERR · No way to drive a browser in this environment
- what: `node` is absent, so no `--check`; `firefox --headless --screenshot`
  hangs and is killed at 120s, with and without a fresh `-profile`. Two
  attempts on the same cause, so stopped per L3 step 6.
- checks: checks.sh ok · manual: `python3 -m http.server` serves all four pages
  and `shared/site.js` at 200
- push: this commit
- note: left open. The Alt+click gesture, the phone burger and the `?edit=1`
  gate are all unverified at runtime — they need a real browser. Everything
  claimed above is from static comparison plus checks.sh.

### 2026-08-07 · SESSION · Working agreement in place
- shipped: `CLAUDE.md` Working agreement (R1–R10, L1–L4), `docs/checks.sh`,
  `docs/worklog.md`, `docs/backlog.md` (OPT-01…OPT-12), `.claude/settings.json`
- open: nothing committed yet beyond `bd92d14` — awaiting review of the second
  commit; `.claude/settings.json` takes effect only on the next session start
- next: OPT-12 (make doc line-number rot a check failure) is the natural
  follow-on, since it protects everything written this session

### 2026-08-08 · OK · Stop publishing media that only private entries reference
- what: `dlPendingMedia()` (site.js:2121) committed every unpublished IndexedDB
  record, with no reference to `entry.private` anywhere in the path — so a
  private entry's *text* was correctly stripped by `dlPublicData()` while its
  images were committed to the public repo by `ghPublish()` (:1800). Added
  `dlPrivateOnlyMedia()` (:2188) = refs(private) − refs(public), and excluded
  those paths from `dlPendingMedia()`. Rather than write a third media walker to
  keep in sync, gave `dlMediaRefs()` (:2170) an optional `pick` filter; the
  no-arg call in `dlDropMedia()` (:2194) is unchanged, so local GC still sees
  private entries and will not delete a private entry's file from IndexedDB.
  Held-back files stay `published:false` and go up if the entry is made public.
  Uploads outside the dev log (card art, hero, profile photo) are in neither
  set and are unaffected.
- checks: checks.sh ok · manual: **not verified in a browser** — no JS engine
  and no driveable browser in this environment (the 2026-08-07 ERR entry is
  still open). Verified statically: both call sites of each changed function,
  boot order (`dlLoad()` at :3077 precedes `mediaBoot()`, so `DEVLOG` is
  populated before the first badge render), and that `e.private` undefined
  reads as public.
- push: this commit
- note: raised OPT-16 — the repo still never deletes an asset, so this stops new
  leaks but does not clean the ones already committed. The auto-delete half of
  that idea is not safe as first sketched: a publish sees only its own page, and
  card/hero/profile uploads never appear in `dlMediaRefs()`, so deleting
  everything absent from it would wipe every live card image.

### 2026-08-08 · OK · Re-verify every site.js citation in CLAUDE.md
- what: 30 `shared/site.js:NNN` citations were wrong. 26 were already +17 lines
  off before this session — the same drift OPT-12 describes, from commits that
  grew `site.js` after the numbers were written — and 4 more moved when
  `dlPrivateOnlyMedia()` was added in `cc12ea7`. Prose unchanged; only the
  numbers move.
- checks: checks.sh ok · manual: scripted every citation back against
  `shared/site.js` and confirmed each lands on the symbol it names, including
  the five `localStorage` catch sites listed in R6 (:780, :1103, :1123, :1154,
  :1248) and the `#dl-wrap` strip inside `buildPublishHTML()` (:1683)
- push: this commit
- note: this is OPT-12's option (b) performed by hand, once. It rots again the
  next time anything edits `site.js` above a cited line — the check is what
  makes that a failure instead of silent misinformation, and it is still unbuilt.

### 2026-08-08 · OK · checks.sh gains a syntax check and a citation check
- what: `docs/checks.sh` — two new checks, plus rules R11/R12 in CLAUDE.md.
  **check-syntax**: `site.js` is one flat script with no module graph, so a
  stray brace blanks all five pages and nothing here would notice. Compiles it
  via `node --check`, else `gjs` + `new Function(src)` — which parses without
  executing, so the browser globals it touches at load are irrelevant. Prints
  `SKIPPED` with neither engine rather than passing on a check that never ran.
  **check-citations**: re-resolves all 28 `shared/site.js:NNN` citations in
  CLAUDE.md against the file. Closes OPT-12.
- checks: checks.sh ok · manual: fault-injected all four checks and confirmed
  each fails on its own fault — renamed `toggleEdit` (R2), stripped
  `id="de-toast"` (R3), appended `function broken( {` (R12), and inserted 20
  lines at site.js:20 to simulate a publish growing the file (R11, flagged 4
  citations). Baseline and post-restore runs both exit 0.
- push: this commit
- note: the strict version of check-citations — bind each line number to one
  symbol — produced 6 false positives on the existing prose, because backticked
  words like `HEAD`, `id` and `3` sit between a symbol and its number. Relaxed
  to "any backticked symbol on the line appears at the cited line". Less precise
  per citation, unchanged against real drift, and it no longer cries wolf.

### 2026-08-08 · ERR · git checkout -- . destroyed the uncommitted checks.sh
- what: the fault-injection harness restored with `git checkout -- .` between
  cases. `docs/checks.sh` was itself uncommitted, so the first restore reverted
  it to the two-check version committed in `ce72929` — faults 3 and 4 then
  "passed" against checks that no longer existed. The exit 0 was real; the
  checks were not there to fail.
- checks: checks.sh ok (the old two-check one — which is the bug)
- push: not pushed
- note: a passing check that never ran is the exact failure check-syntax was
  written to avoid, reproduced by the harness testing it.

### 2026-08-08 · FIX · Restore named files only, never the whole tree
- what: rewrote `docs/checks.sh` from the session transcript and re-ran the
  harness with `git checkout -- shared/site.js projects/hot-potato.html` — the
  two files actually faulted. Added a `diff` against a scratchpad copy at the
  end to prove `checks.sh` survived, and re-ran all four cases from a verified
  baseline.
- checks: checks.sh ok · manual: all four faults caught, tree clean afterwards
- push: this commit
- note: extended R8 to cover blanket restores. `git checkout -- .` and
  `git restore .` sit with force-push and `reset --hard`: they take uncommitted
  work and there is no reflog for it. Name the files you want reverted.

### 2026-08-08 · OK · Rebased onto a browser publish mid-task
- what: L2 step 2 found `38bc3e9` (a publish, +2 media) on origin while the
  checks work was uncommitted. Rebased with `--autostash`, clean. It rewrote
  `projects/healthy-jeart.html` and `shared/theme.css`; `site.js` was untouched,
  so R11's 28 citations still resolve.
- checks: checks.sh ok after rebase · manual: re-counted the figures R7 asserts
- push: this commit
- note: theme.css went 18 → 15 hex literals in that publish, so R7's count was
  wrong within minutes of being written. Corrected, and R7 now says outright
  that these counts drift and are not checked. Prose numbers rot exactly like
  line numbers do — check-citations only covers `shared/site.js:NNN`.

### 2026-08-08 · FIX · Runtime verification works — closes the 2026-08-07 ERR
- what: `docs/smoke.sh` + `docs/smoke.js` load all five pages in WebKitGTK via
  `gjs` (the `WebKit2-4.1` typelib is installed) and fail on anything that
  throws. A user script installed at document-start captures `window.onerror`
  and `unhandledrejection` before any page script runs; each page must then
  reach its `window.PAGE` contract, apply the theme, render a body, keep all
  six sentinels, and define every function the markup calls.
- checks: checks.sh ok · smoke.sh ok 5 pages · manual: fault-injected three
  runtime-only faults, all caught — an undefined call appended to site.js
  (`ReferenceError … @ site.js:3099`, on all five pages), `openGallery` renamed
  (`handlers not defined at runtime`), and `id="lightbox"` stripped from
  hot-potato.html, which surfaced *both* the missing element and
  `TypeError: null is not an object (evaluating 'lb.addEventListener')` at
  site.js:1472
- push: this commit
- note: the old ERR blamed the environment; the environment was fine. VS Code's
  snap exports `GTK_PATH`, `GDK_PIXBUF_MODULEDIR`, `LOCPATH` and friends, which
  make `gjs` load snap's glibc and die with `undefined symbol:
  __libc_pthread_init`. Stripping ten env vars is the whole fix. Firefox
  headless was never the only option — it was just the first one tried.
  R3 is now demonstrated rather than asserted: fault C is the exact failure
  the rule describes.

### 2026-08-08 · OK · Two false assertions found by writing the smoke test
- what: the first probe asserted `.proj-card, .sh-sec` — `.proj-card` exists
  nowhere in the repo and `.sh-sec` is project-pages-only, so index.html
  "failed" on a selector that was simply wrong. The second used `innerText`
  with a threshold of 200; measured values were index 2563 and *every* project
  page 198–205, because case-study sections are revealed by an
  IntersectionObserver and are `display:none` offscreen. The threshold sat
  inside the natural cluster and would have flaked at random.
- checks: checks.sh ok · smoke.sh ok 5 pages
- push: this commit
- note: fixed by counting `section, .sh-sec` (both roles), switching to
  `textContent`, and giving the offscreen window a 1280x900 viewport so media
  queries and observers behave. Worth recording that both failures were in the
  test, not the site — R1 says don't hand-edit page content, and the first
  instinct on a red check is to go change the page.

### 2026-08-08 · OK · checks.sh checks its own prose; L2 becomes a script
- what: `check-counts` recomputes the three figures R7 quotes plus R11's
  citation total and fails if CLAUDE.md disagrees — the gap that let R7 go
  stale within minutes when a publish rewrote theme.css. `docs/safe-push.sh`
  runs L2 mechanically: refuses on a dirty tree, on origin being ahead, on
  either script failing, or on a token or local path in the outgoing diff.
- checks: checks.sh ok · smoke.sh ok 5 pages · manual: appended a hex literal
  to theme.css and check-counts reported `is 16 … expected "plus 16 in
  shared/theme.css"`; ran safe-push.sh -n against a dirty tree and it refused
- push: this commit
- note: safe-push refuses rather than resolves. It will not rebase for you —
  which side of an HTML conflict wins is a judgement about the user's published
  content (R1/R8), not something a script should decide.
