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

### 2026-08-08 · ERR · safe-push.sh flagged itself as a secret leak
- what: first real use of `docs/safe-push.sh` refused at step 4 —
  `possible secret or local path in the outgoing diff (R9)`. The match was the
  scanner's own source line: the diff adds a line containing the pattern, and
  the pattern matches itself.
- checks: checks.sh ok · smoke.sh ok 5 pages
- push: not pushed
- note: caught by the tool on its own first outing, which is the good version
  of this. A secret scanner that cries wolf on every commit touching itself is
  a scanner people learn to bypass.

### 2026-08-08 · FIX · Bracket the pattern so it cannot match itself
- what: `gh[p]_`, `github[_]pat_`, `[/]home[/][a-z]+[/]` — the `grep [c]ommand`
  trick. First attempt still self-matched because the *comment* explaining the
  fix spelled the literal token prefix twice; reworded, and the comment now
  says not to spell one anywhere in the file.
- checks: checks.sh ok · smoke.sh ok 5 pages · manual: appended a fake token
  and a fake local path to worklog.md — both still caught (2 matches); scanning
  the script's own diff now returns 0
- push: this commit

### 2026-08-08 · OK · Cursor tracks the pointer 1:1
- what: the pen crosshair eased toward the mouse (`cx += (mx-cx)*.17` in a
  permanent rAF loop, the CURSOR block in `shared/site.js`) — a ~17%/frame
  follow that never quite arrives, so it visibly trailed the hand. Now written
  straight from the `mousemove` event; the rAF loop and the mx/my/cx/cy state
  are gone.
- checks: checks.sh ok · smoke.sh ok 5 pages — both run against this change
  alone, in a scratchpad copy, because a parallel session's uncommitted work
  landed in the shared tree mid-task (see ERR below) · manual: not exercised in
  a real browser — smoke.sh loads the page but never moves a pointer, so the
  1:1 tracking itself is unverified here
- push: this commit
- note: kept the block at exactly 21 lines so none of R11's 28 citations
  shifted. Removing the loop also drops a forever-running rAF on every desktop
  page — the `.big` hover transition is CSS and is unaffected.

### 2026-08-08 · ERR · checks.sh red in the shared tree — 26 citations off by 28
- what: `check-citations` failed on 26 of R11's 28 numbers immediately after the
  cursor change passed clean. Not the cursor edit: a parallel session (four are
  live in this clone) added a ~28-line DIAGNOSTICS block near the top of
  `shared/site.js` — `reportError()`, `safeSet()`, and window `error` /
  `unhandledrejection` listeners, plus the R6 rewrite of the five silent
  `localStorage` catches. Every citation below it shifted by exactly 28.
- checks: checks.sh FAIL in the working tree · checks.sh ok + smoke.sh ok 5
  pages on a scratchpad copy holding only the cursor change
- push: not pushed
- note: left open on purpose. The CLAUDE.md numbers belong to the change that
  moved them (L1 step 4), and renumbering them from here would fold someone
  else's in-flight work into this commit. The cursor block was sized to keep the
  file's line count unchanged precisely so it would not do this.

### 2026-08-08 · OK · OPT-01, OPT-02, OPT-03 — errors surface, saves report, publish checks
- what: three named backlog items (R10 — named by the user, so acted on).
  **OPT-01**: nothing in 3000 lines reported a throw — no `console.*`, no
  `window.onerror`. Added a DIAGNOSTICS block: `reportError()` (site.js:31)
  logs always and toasts only while `body.editing`, since a visitor can do
  nothing with the message; window `error` and `unhandledrejection` listeners
  route into it.
  **OPT-02**: `safeSet()` (site.js:40) replaces every raw `localStorage.setItem`
  — 11 call sites, silent catches 20 → 11. Two of them were worse than silent:
  `parkStaleDraft()` and the draft-restore path both `removeItem`'d the original
  *after* a `setItem` that could throw, so a full quota deleted the only copy.
  Both now remove only once `safeSet` returns true.
  **OPT-03**: `ghPublish()` read the head sha before uploading media and never
  re-read it, so a second tab or a push made the PATCH a non-fast-forward and
  GitHub answered with a bare "422". It now re-reads the ref immediately before
  the commit and aborts with a sentence saying nothing was overwritten.
- checks: checks.sh ok · smoke.sh ok 5 pages · manual: **not exercised through
  the editor UI** — smoke.sh loads every page but clicks nothing, so the toast
  path, a real quota failure and a real concurrent publish are all unverified.
  The publish abort in particular has never run against GitHub.
- push: this commit
- note: check-citations earned itself here — the DIAGNOSTICS block shifted every
  line below it and the check failed on 26 of 29 citations, which is exactly the
  drift OPT-12 was filed for. All renumbered. R6 rewritten (its cited lines were
  the silent catches this removed) and its silent-catch count is now recomputed
  by check-counts, so it cannot rot quietly either.

### 2026-08-08 · FIX · The parallel session renumbered the citations — and took the cursor commit with it
- what: the open ERR above resolved itself. That session committed as `e8d47d4`
  with the whole working tree staged, so its DIAGNOSTICS/R6 work, the cursor
  change and both of my worklog entries went up as one commit — the citations
  it shifted were renumbered inside the same commit that shifted them, which is
  what L1 step 4 asks for, just not by the session that noticed.
- checks: checks.sh ok · smoke.sh ok 5 pages, both against `af14973`
- push: nothing of mine left to commit — the cursor change is already on main
  inside `e8d47d4`; this entry is the only thing in this commit
- note: second time this has happened in this clone (see 2026-08-07 ERR). Same
  resolution as then: keep the commit, don't rewrite main (R8), and accept that
  the commit message describes only half of what it contains. The real lesson
  is upstream of git — `git commit -a` in a clone with four live sessions
  commits whatever anyone else is holding. Filing it rather than fixing it (R10).

### 2026-08-09 · SESSION · Verified the self-edit / publish path still works end to end
- what: no code change — a question ("is the site still editable and auto
  publishable across devices?") answered from the code rather than the docs.
  Confirmed: the Alt + three-clicks logo gesture still opens the editor
  (site.js:213); `autoSave()` (site.js:1169) fires on every edit but writes
  only to this browser's `localStorage` + IndexedDB; `saveAndPublish()`
  (site.js:1880) is the sole path off-device and is a manual button — no timer,
  no publish-on-save, no background sync anywhere in the file. Corrected the
  "auto publishable" framing on that basis: saving is automatic, publishing is
  not, and only publishing is what another device ever sees.
- checks: checks.sh ok · smoke.sh ok 5 pages · live site HTTP 200,
  last-modified 2026-08-08 12:33 UTC (matches the last browser publish)
- push: e975c98 was still unpushed at session start; this commit sits on top
- note: two caveats worth remembering because both look like success. A browser
  with no stored `pmpr_gh_token` reports `✓ Saved locally` and publishes
  nothing — correct, but indistinguishable from a publish if you aren't
  reading the button. And OPT-03's new pre-commit ref re-check (site.js:1862)
  means a publish can now legitimately refuse; it still has never run against
  a real concurrent publish, so that abort path remains untested in anger.

### 2026-08-09 · OK · Proved the private/public toggle keeps work off the live site
- what: no code change — a verification the user asked for. Read the chain
  (`deSetPrivate` site.js:2718 → `dlPublicData` site.js:3071 → `buildPublishHTML`
  site.js:1723, plus `dlPrivateOnlyMedia` site.js:2228 → `dlPendingMedia`
  site.js:2160) and then exercised it in WebKitGTK rather than trusting the
  read: seeded one public + one private entry into a real project page,
  rendered the private one into the log list, the panel list *and* `#entry-view`
  so the publish clone was taken from the worst-case DOM, and called the actual
  `buildPublishHTML()` / `buildExportHTML()` / `dlPendingMedia()`.
- checks: 15/15 in the probe — private title, summary, body, id and media path
  all absent from the published HTML; baked `#devlog-data` held only the public
  entry; private-only media absent from the publish queue; export clean. Two
  positive controls (public entry present, `#devlog-data` found) so "absent" is
  not vacuous · checks.sh ok · smoke.sh ok 5 pages earlier this session
- push: not pushed yet — this entry plus OPT-17
- note: the probe is a scratchpad one-off, not committed; it manipulates
  `DEVLOG` in a throwaway WebKit context and never calls `ghPublish`. Worth
  folding into `smoke.sh` if privacy ever needs a standing check — filed
  nothing for that, since smoke.sh deliberately clicks nothing. What the probe
  *did* surface is OPT-17: the toggle's label survives the scrub even though
  its checkbox does not, which is how `block-city.html` came to ship
  `🔒 Private` as static markup.

### 2026-08-09 · OK · The editor is built on demand, not shipped in the HTML
- what: user asked to make the site's editability less obvious. Nothing was
  visible on the rendered page already — the panel is `translateX(-100%)`, the
  editor and bar are `display:none` — so the whole tell was view-source, where
  44–51% of every page was editor markup. Moved all four blocks (`#edit-panel`,
  `#fmt-bar`, `#dev-editor`, `#de-toast`) into three template functions in
  `site.js` and a builder, `edChrome()`, called from `toggleEdit()`. Pages went
  index 706→371, hot-potato 345→185, block-city 334→160. Two load-time captures
  had to become lazy (`fmtBar` → `fmtBarEl()`, `epGrip` → looked up in
  `edWireSheet()`); `buildPublishHTML()` now removes the four subtrees by id,
  which replaced most of the scrub list rather than adding to it.
- checks: checks.sh ok · smoke.sh ok 5 pages, extended with `chromeServed` /
  `chromeBuilt` so it now asserts no page ships the chrome *and* that
  `edChrome()` builds it exactly once, twice in a row · new scratchpad probe
  drove the real gesture (12/12 on both roles: plain click inert, one alt-click
  inert, three enters, tabs populate, fmt bar shows/hides, exit and re-entry
  clean, no duplicate panel) · privacy probe re-run 18/18, now including "no
  editor chrome in the published HTML"
- push: not pushed — asked first
- note: R3 lost two sentinels, R4 and R5 were rewritten around a built rather
  than authored editor, and checks.sh gained `check-no-chrome`, which fails if
  a page carries the markup again — a stale page published by an old browser
  is now a check failure rather than an invisible divergence. OPT-07, OPT-10
  and OPT-17 all closed as side effects. **OPT-15 is untouched**: the gesture
  is still spelled out in a comment at site.js:205 and `site.js` is served to
  everyone, so this hides the editor, it does not gate it. The token still does
  that. Not done: no real browser was driven by hand — WebKitGTK is the engine
  in every check above, and nothing tested a phone-width bottom sheet.

### 2026-08-09 · ERR · My own citation renumbering corrupted citations that were correct
- what: the chrome templates shifted every line below them and checks.sh failed
  26 of 33 citations (R11 doing its job). I wrote a resolver that paired each
  citation with symbols in line order and fell back to "first line containing
  the string" — it moved `safeSet` to :1048 and `reportError` to :10, both of
  which had been right, and pointed `buildPublishHTML` at :443. Wrong in a way
  checks.sh could not see, because a citation only has to mention *some*
  backticked symbol from its line.
- checks: checks.sh FAIL, differently and more quietly than before the fix
- FIX: reverted `CLAUDE.md` by name (`git checkout HEAD -- CLAUDE.md`, R8 —
  named file, not a blanket restore), re-applied the prose by hand, and rewrote
  the resolver to pair each citation with the backticked symbol *immediately
  preceding it* and to resolve only against a real declaration, reporting
  anything it could not resolve instead of guessing. Three lines cite a second
  symbol after the number (`dlPublicData`, `DL_SCHEMA`, `dlLegacyRedirect`) and
  were done by hand both times. checks.sh green.
- note: the lesson is about the check, not the script — R11 is satisfied by any
  symbol on the line, so it catches drift but not mis-pairing. A resolver that
  guesses is worse than one that reports, because its output looks verified.

### 2026-08-09 · FIX · Visitors lost the "link copied" toast
- what: caught reading the diff, not by any check. `#de-toast` was static markup
  on every page, so `dlToast()` could assume it existed; after the move it is
  editor chrome and `dlToast()`'s `if (!t) return` made it a silent no-op. But
  `dlCopyLink()` is wired to a `.dl-share` button in the *public* dev-entry
  view — a visitor pressing Copy link would have got no confirmation at all.
- checks: 6/6 in a scratchpad probe — nothing served, built on first call,
  carries the message, actually shown, reused rather than duplicated on a
  second call, still stripped from a publish
- note: `dlToast()` now creates the node when it's missing. It stays in
  `EP_CHROME_IDS` so a publish still removes it. This is the one place where
  "editor chrome" and "visitor UI" overlapped, and the static markup had been
  hiding that.

### 2026-08-09 · OK · The editor opens only where a GitHub token is stored
- what: user asked whether editing could be gated to them alone. Answered the
  honest version first — publishing already is, unbypassably, because GitHub
  checks the token server-side; the *UI* cannot be, because `site.js` runs on
  the visitor's machine — then built the gate they picked. `toggleEdit()` now
  refuses to open unless `edUnlocked()` (site.js:236) finds a token, so the
  gesture is a silent no-op on any other browser. Shift on the closing click
  routes to `edUnlock()` (site.js:263) instead, which prompts for a token and
  checks it against `GET /repos/{owner}/{repo}` — including `permissions.push`
  — before storing it. Leaving edit mode is deliberately *not* gated, or a
  token cleared mid-session would strand the panel open with no way to close.
- checks: checks.sh ok · smoke.sh ok 5 pages, extended with `gateHolds` — it
  clears the token itself rather than assuming an empty profile, then asserts
  `toggleEdit()` refuses · gesture probe 14/14 on both roles, now opening with
  "no token → gesture does nothing, no chrome even built" before proving the
  unlocked path still works · privacy 18/18 and the toast probe 6/6, both
  unaffected (they call `edChrome()` directly, not through the gate)
- push: not pushed — asked first
- note: the gate checks *presence*, not validity — validation happens at unlock
  and at publish. Revalidating on every entry would mean a network round trip
  per gesture and would break editing offline, and it would buy nothing: the
  key name and the gesture are both readable in the served script, so anyone
  who can fake one can fake the other. That is the honest ceiling of a
  client-side gate and CLAUDE.md now says so in the opening section, next to
  the claim it qualifies. OPT-15 closed by a different route than it proposed
  — a token in `localStorage` is the "value that isn't in the bundle" it asked
  for, without a passphrase hash sitting in a public repo waiting to be
  brute-forced. Not done: no hand-driven real browser, nothing exercised on a
  phone, and `edTokenValid()` has never run against a live GitHub response —
  the probes never reach the network.

### 2026-08-09 · SESSION · Editor hidden, gated, and proved — four backlog items closed
Ran as one continuous session across five asks: is the site still editable, is
private really private, make editability less obvious, gate it to me, how do I
open it.

**Successes (5).**
1. *Verified the edit/publish path* rather than trusting the docs — and corrected
   the premise in the question: saving is automatic and local, publishing is a
   manual button, and only publishing crosses devices.
2. *Proved the private/public filter* with a WebKitGTK probe seeded with one
   public and one private entry, rendered into the log, the panel list and
   `#entry-view` so the clone came from the worst-case DOM. 18/18, including
   two positive controls so "absent" was not vacuous, and including the case
   that had never been checked: media only a private entry references is kept
   out of the commit.
3. *Removed the editor from every served page.* Chrome moved into three template
   functions plus `edChrome()`; publishes drop it by id. index 706→371,
   hot-potato 345→184, block-city 334→160. The HTML diff was pure deletion — no
   page content touched (R1).
4. *Gated the editor on a stored GitHub token.* Silent no-op elsewhere;
   Shift-variant unlocks a new device after validating the token against the
   API, including `permissions.push`, which nothing previously checked.
5. *Closed OPT-07, OPT-10, OPT-15 and OPT-17*, three of them as side effects
   rather than as work aimed at them.

**Errors (2), both mine, both caught before they shipped.**
1. `ERR`/`FIX` above: my first citation-renumbering script mis-paired symbols and
   corrupted citations that were already correct — `safeSet` and `reportError`
   among them. checks.sh could not see it, because R11 accepts *any* backticked
   symbol on the line. Reverted `CLAUDE.md` by name (R8-safe), rewrote the
   resolver to pair each citation with the symbol immediately preceding it and
   to report rather than guess. Now a repeatable script, run four times since.
2. `FIX` above: moving `#de-toast` into editor chrome silently broke the "link
   copied" toast for *visitors*, because `dlCopyLink()` is on a public button.
   Caught by reading the diff, not by any check — no check covers it even now.

**Open / pick up next.**
- OPT-18 filed and untouched: there is no way to open the editor on a phone,
  and the panel has a bottom-sheet layout built for one. Read its Catch before
  starting — the safe version depends on the gate that now exists.
- `edTokenValid()` has never run against a live GitHub response; the probes
  never reach the network. First real exercise is the first new device.
- Nothing has been driven in a hand-operated browser this whole session.
  WebKitGTK is the engine behind every green result above.
- The three probes (`priv`, `gesture`, `toast`) live in a scratchpad and are
  **not committed**. Anything worth keeping has to be folded into `smoke.sh`
  deliberately; right now a future session inherits the assertions that were
  moved there and none of the ones that weren't.

### 2026-08-10 · OK · Two summary docs — what the site says, and how it is built
- what: `docs/summary-content.md` (the portfolio as content: framing, the four
  case studies, the dev log, visual identity, media, and §8 "gaps in the
  content") and `docs/summary-engineering.md` (stack figures, the five-phase
  history from the April single file to the gated editor, architecture, the
  editor lifecycle, the three verification scripts, the working agreement, the
  backlog's state, and §8 "what is not proven"). No code touched — both are new
  files under `docs/`, read out of the repo rather than out of README/SPEC,
  which lag it.
- checks: checks.sh ok · smoke.sh ok 5 pages · manual: every figure quoted was
  re-derived from the tree at this commit rather than copied from CLAUDE.md —
  which caught one, the silent-catch count (11, not the 10 a looser grep gave)
- push: this commit
- note: raised OPT-19. Three of the four About paragraphs are placeholder
  duplicates and the contact status line holds the author's name instead of an
  availability message — all page content, so R1 puts the fix in the editor's
  hands, not this session's. Also worth stating outright somewhere permanent:
  two of the four dev logs are empty, which is the largest content gap on the
  site and the one the block editor was built for.

### 2026-08-10 · OK · README and SPEC brought back in step with the code
- what: both were documenting a site that no longer exists. `README.md` — the
  **Layout tab it described was removed entirely** (the panel has four tabs:
  Sections, + Add, Dev Log, Design; + Add was undocumented); every Design-tab
  fact was wrong (five invented preset names against the six in `PRESETS`, four
  colour rows against six, Clash Display and Fontshare, neither of which the
  code loads); the editable-field list claimed Twitter and skills and a
  pastable CV URL, none of which are editor fields; project cards were said to
  reorder, and there is no such control; page sizes were 28 KB / ~20 KB against
  20 KB / 9–12 KB. Added the token gate, the built-not-shipped chrome, the
  publish-is-a-DOM-snapshot consequence, the three `docs/` scripts, and the
  OPT-18 phone gap. `SPEC.md` rewritten from "single HTML file … Ready to
  build" into a spec of what shipped, keeping its brief-style tables.
- checks: checks.sh ok · smoke.sh ok 5 pages · manual: every claim re-read
  against `epPanelHTML()`, `PRESETS`, `COLOR_ROWS`, `DISPLAY_FONTS`,
  `DE_BLOCKS` and the `data-ed` attributes actually present in `index.html`,
  rather than against the old prose
- push: this commit
- note: two corrections to my own first draft, both caught by grepping the
  files I had just written for the gesture. I had spelled out the unlock
  variant's modifier and the phone gap's cause — the same detail CLAUDE.md,
  README and SPEC all deliberately withhold. Reworded both to point at the
  code. Worth flagging and *not* fixing here: OPT-18 in `docs/backlog.md`
  spells the gesture out completely (`e.altKey`, "a phone has no Alt key") and
  `docs/` is served publicly, so the convention is already broken one file
  over. Left alone rather than quietly rewritten — it is the user's call
  whether the convention or the backlog entry gives way. Deleted one tip that
  told the reader to hand-edit `index.html` to change the contact status line:
  it is an editable field, and following that tip would have violated R1 and
  been overwritten by the next publish.

### 2026-08-10 · SESSION · Documentation session — four docs, no code
Asked for a summary of the portfolio to date, content-wise and programming-wise,
then for README and SPEC to be brought in line.

**Shipped.** `docs/summary-content.md` and `docs/summary-engineering.md`
(`12294a3`); `README.md` and `SPEC.md` rewritten against the code (`ab39611`);
OPT-19 filed; this section of CLAUDE.md corrected. Pushed — `origin/main` went
`a27c29c` → `ab39611`, taking the previous session's unpushed `8d14e63` with it.
No site code, CSS or page content touched: the whole diff is `.md`.

**What the read turned up.** The docs had drifted further than the CLAUDE.md
Gotcha admitted. README documented a **Layout tab that does not exist** (the
panel has four: Sections, + Add, Dev Log, Design) and omitted + Add entirely;
its Design section was wrong in every particular — five invented preset names,
four colour rows against six, two fonts the code never loads. It also told the
reader to hand-edit `index.html` for a field that is editable in the editor,
i.e. documented an R1 violation as a tip.

**Errors (1), caught before the commit.** I spelled out part of the editor
gesture in two places in my own new prose — the one thing every doc here
deliberately withholds. Found by grepping the files I had just written, not by
any check, and reworded to point at the code.

**Open / pick up next.**
- **OPT-19** — three of the four About paragraphs are placeholder duplicates and
  the contact status line holds the author's name. Page content, so only the
  in-page editor can fix it (R1). Nothing here can.
- **Two of four dev logs are empty** (Hot Potato, Create Your Own Monster). The
  block editor's whole point, unused on the lead project.
- **The gesture convention contradicts itself.** OPT-18 in this repo's public
  `docs/` spells the gesture out completely, while CLAUDE.md, README and SPEC
  all withhold it. Flagged to the user, deliberately not resolved — which side
  gives way is their call, and rewriting a backlog entry to match a convention
  is not something to do quietly.
- **Nothing checks the prose.** `check-counts` guards five figures in CLAUDE.md
  and nothing else; every claim in README, SPEC and the two summaries is
  hand-verified and rots on the next editor change.

---

## 2026-08-11 · SESSION · Independent AI projects: the category, not its contents

**Task.** Find every repo built with Claude Code and add them to the portfolio
under a new "Independent AI projects" category.

**The scan.** All 50 repos under `PilarMPR` plus the local clones, on three
signals: commits authored or co-authored by Claude, a `CLAUDE.md`, a `.claude/`
directory. Sixteen hit. Ten are substantial (config *and* authored commits);
six carry one or two Claude commits in an otherwise hand-built repo. Note
`AdhdBulletJournal` — four Claude commits exist **locally only**, never pushed,
so a GitHub-only scan reports it clean and is wrong.

**Where this split in two.** The cards are page content, so R1 forbids writing
them from here — the next browser publish rebuilds `index.html` from its own
DOM and would drop them. The *category* is structural and did not exist at all:
`index.html` had one flat `.projects` grid and `insertProjectCard()` appended to
`document.querySelector('.projects')` unconditionally, so the editor had no way
to express "this card belongs elsewhere". Built the structure, left the content
to the user. Scope confirmed with them first: public + substantial (5 repos).

**Shipped.**
- `#ai-work` / `#ai-projects` in `index.html` — a second `.projects` grid, empty
  by design, with an editable subtitle.
- CSS hides `#ai-work` until it holds a `.project` and always shows it under
  `body.editing`. An empty category must not publish as a heading over nothing,
  and there must still be somewhere to put the first card. Uses `:has()`, which
  fails *closed* (section hidden) on an engine without it — the safe direction.
- `insertProjectCard(gridId)` now takes a target grid and numbers per grid, so
  both categories start at 01.
- `__custom_cards__` records each card's grid, read off the DOM at save time
  rather than stamped on the card, so a card moved between grids saves where it
  actually is. Restore routes on it; a record with no `grid` predates the
  section and falls back to Work.
- Panel button 🤖 **New AI project card**, inside `epPanelHTML()` so R4 removes
  it from every publish for free. Landing page only.

**Errors (1).** `checks.sh` failed on R11 — the four insertions shifted 28
`site.js` citations in CLAUDE.md at once, exactly the silent rot R11 exists to
catch. Re-resolved them from the diff hunk offsets rather than by eye, then the
R7 `var()` count (620 → 623) and R11's own citation count (37 → 40). All three
were the check doing its job; none were noticed without it.

**Verified.** `checks.sh` exits 0; `smoke.sh` prints `ok 5 pages`. Neither
proves any of the above, because smoke.sh dispatches no events — so a throwaway
`gjs` probe drove the real cycle in the same WebKit view: insert into each grid,
per-grid numbering (AI 01, Work 05), `autoSave()` → reload → `loadSaved()`
round-trip, a planted legacy record with no `grid` key landing back in Work, no
duplicate cards, the section hidden empty and visible with a card, the panel
button present with its handler resolving, and `buildPublishHTML()` keeping the
section and all three cards while dropping the chrome. All green.

**Not verified.** Nothing was published — `ghPublish()` was never called, so the
GitHub write path is untouched and unproven by this session. The section has
never been seen on a real phone, only in a 1280×900 offscreen view. No
screenshot: the category renders empty by design until the user adds a card.

**The cards, second pass.** The user then named a different four — this repo,
`HotPotato-TagOut`, `fitsanitario` and `wildalchemists/FossilsKanban` — and asked
for them filled in. Two notes worth keeping: `FossilsKanban` sits under the
studio org so it never appeared in the scan of the user's own account, and it
carries **no Claude Code markers at all** (4 commits by "PDEV", no `CLAUDE.md`,
no `.claude/`, no trailers) — flagged to them rather than quietly filed under an
AI category. `HotPotato-TagOut` is private, so its card cannot link anywhere.

Rather than hand over text to retype, wrote a console snippet that drives the
site's own `insertProjectCard('ai-projects')` and fills each card's fields, then
`autoSave()`. That is the editor's code path, not a hand edit, so R1 holds — the
browser is still the author and the publish still comes from its DOM. It also
sidesteps the href/CTA gap for these four, because both live in the card's
`outerHTML`, which is what gets saved and published. Idempotent: re-running skips
cards whose name is already in the grid. Kept out of the repo — it is a one-time
tool, not site code.

**Verified (second pass).** A second `gjs` probe ran the snippet twice in a real
engine: 4 cards added then 0 added / 4 skipped on the re-run, numbered 01–04, the
private card carrying no `href` at all, external cards `target=_blank rel=noopener`,
the Work grid still holding exactly its four authored cards, and after a full
reload every name, CTA label, link and excerpt restored from storage and present
in `buildPublishHTML()` with the chrome dropped. All green. One failure on the
first run was **the probe's own bug** — it wrapped the snippet's IIFE in another
function and swallowed the return value — not the snippet's; fixed and re-run.

**Open / pick up next.**
- **Publishing.** Everything above is local. The user still has to run the
  snippet in their own browser and press Save & publish; `ghPublish()` remains
  unexercised by this session.
- **OPT-20** — nav and mobile-menu entries for the new section, deliberately not
  added while the section can still be hidden.
- Older: OPT-19 placeholder bio copy, two empty dev logs, unchecked prose in
  README/SPEC/summaries.

---

## 2026-08-11 · SESSION · Generated cards can point somewhere (OPT-21)

**Task.** The user asked for OPT-21 and said they want the category live on the
web. The second half is not something this end can do — publishing needs their
browser and their token — so this session did the code and handed back a shorter
path, rather than pretending the two were the same job.

**Why it needed doing now.** The four Independent AI cards got their links by
having them written straight onto the anchor from a console snippet. That works
only because `autoSave()` stores `outerHTML`; the *next* card added from the
panel would still say "View case study" and link nowhere.

**Shipped.**
- `.proj-cta` is now a plain `data-ed` field, and generated cards carry a new
  `.proj-link` field holding the destination. `data-ed` round-trips `innerHTML`
  and cannot reach an attribute, which is the whole reason the URL has to live
  in the DOM as text rather than as an `href`.
- `syncCardLinks()` (shared/site.js:1307) copies that field onto the anchor and
  is now **the only writer of a `.project` href**. Called from insert, from
  `autoSave()` *before* it serializes, and after restore — get that order wrong
  and the link vanishes on the next reload.
- A blank field removes `href` outright. Cards used to ship `href="#"`, which
  silently scrolled the page to the top when clicked.
- `https://` destinations get `target=_blank rel=noopener`; relative ones don't.
- CSS shows `.proj-link` only under `body.editing`, with an empty-state hint.

**What the fix turned up that OPT-21 had not predicted.** Cards are anchors, so
giving them real destinations made *clicking one while editing* navigate away
mid-edit — a hazard that did not exist while every href was `#`. Handled with a
document-level capture listener that swallows clicks on `.project` while
editing, excluding `.img-upload-btn` and `.card-del-btn`, which need their own
default behaviour or the file dialog never opens. The entry's stated catch —
that `buildExportHTML()` might mangle absolute URLs — turned out to be a
non-issue: it only rewrites sibling `.html` links.

**Errors (2).** `checks.sh` failed on R11 again — 24 citations shifted, plus the
`var()` count and the citation count. Re-resolved from the diff hunk offsets.
Separately, the first probe run reported the delete button broken; the probe was
wrong, not the code. `deleteProjectCard()` calls `preventDefault()` itself, so
asserting `defaultPrevented === false` could never hold, and firing the button
really did delete a card, which cascaded into six phase-2 failures. Rewritten to
drive a throwaway fifth card and assert the card is *gone* afterwards.

**Verified.** `checks.sh` 0, `smoke.sh` `ok 5 pages`, and an extended `gjs`
probe: the link field present and hidden from visitors, editing it moves the
href, blanking it un-links the card, a card click passes through normally when
not editing and is swallowed while editing, the upload label and delete button
keep working, the scratch card cleaned up, and after a full reload all four
links, labels and excerpts restored and reached `buildPublishHTML()`.

**Not verified.** Still nothing published — `ghPublish()` remains unexercised.
The link field has never been typed into by a human, only set from script, and
none of this has been seen on a phone.

**Open / pick up next.**
- **The cards are still not live.** The user has to run the snippet in their own
  browser and press Save & publish; that is the only step left.
- **FossilsKanban has no Claude Code markers** — flagged twice, still in the set
  at the user's choice.
- **OPT-20** — nav entries, still waiting on the section being non-empty.

---

## 2026-08-11 · SESSION · Independent AI cards, written by hand at the user's direction

**Task.** Fill the `#ai-projects` grid with the four AI projects, styled like
the four authored game cards.

**R1 exception, on the record.** Cards are page content, so R1 says they go
through the editor, not into `index.html` from here. A console snippet driving
`insertProjectCard('ai-projects')` was built and verified first (15 checks in
Chromium: idempotent re-run, per-grid numbering, the private repo carrying no
href, full reload round-trip, `buildPublishHTML()` keeping all four). The
concern and the overwrite risk were put to the user, who asked twice for it
pushed to `main` instead. Their call, taken deliberately.

**Why authored markup rather than editor-generated.** Written in the shape of
the Work cards — plain anchors, no `data-custom-card`, no `data-ed`. That form
has no field keys to collide with `pmpr_portfolio_v2` and no `__custom_cards__`
record to be restored over, so a browser with its own landing-page draft leaves
them alone. Verified: with an unrelated draft in `localStorage`, all four still
render after a reload.

**Content came from the repos, not from guesswork.** Cloned `fitsanitario`,
`FossilsKanban` and `HotPotato-TagOut` and wrote each excerpt from its own
README. Two findings worth keeping:
- `HotPotato-TagOut` is a React/TypeScript, Firebase-backed command centre —
  145 files, four-layer architecture, i18n, Zod, Vitest, CI. Its README states
  it absorbed the Fossils Kanban as a first-class production section.
- `FossilsKanban` therefore is **superseded by another card in the same set**,
  and still carries no Claude Code markers (no `CLAUDE.md`, no `.claude/`, zero
  Claude commits). Third time flagged; kept at the user's choice.

**Card art.** Three of the four render locally, so they were screenshotted and
converted to WebP at 900×720 — 60 KB for all three. `HotPotato-TagOut` needs
`npm install`, a Vite build and Firebase credentials, so its card ships with
the empty figure frame.

**Verified.** `checks.sh` exits 0. Nine assertions in Chromium as a visitor with
empty storage: four cards, numbered 01–04, section visible, the private card a
`<div>` with no href, the three public ones `target=_blank rel=noopener`, art
decoded at 900px on three, Work grid still exactly four, no failed requests, no
JS errors, and survival of a reload alongside an unrelated local draft.

**Not verified.** `smoke.sh` could not run — no `gjs` in this container, so the
WebKit runtime half is unproven; Chromium via Playwright stood in. Nothing was
published through `ghPublish()`; this went to `main` as a normal commit.

**Open / pick up next.**
- **OPT-20** now unblocks — the section has content, so nav and mobile-menu
  entries can finally point at something real.
- The `--accent` in `shared/theme.css` is `#24211b`, identical to `--text`, so
  every accent-derived tint reads as ink. A publish from the Design tab fixes
  it site-wide.
- OPT-16 stands: nothing garbage-collects published assets.

## 2026-08-12 · SESSION · Nav entries for the AI section (OPT-20)

**Shipped.** The Independent AI category is reachable from the nav now, on all
five pages. `index.html` gets `scrollToSection('ai-work')` in both the desktop
list and the mobile menu; the four project pages get `../index.html#ai-work` in
theirs. Order everywhere: Work / AI / About / Contact / CV.

**Two things that had to change alongside it.**

The visibility gate was inverted. It was `#ai-work { display:none }` plus an
`#ai-work:has(.project) { display:block }` override — which fails *closed*: an
engine that doesn't understand `:has()` drops the override and hides a section
that has content. That was the safe direction while the grid shipped empty and
nothing linked to it. It is the wrong direction now, so it is written as
`#ai-work:not(:has(.project)) { display:none }` — same behaviour where `:has()`
works, section visible where it doesn't, and a nav link that never points at
something invisible.

`section[id]` gained `scroll-margin-top: calc(var(--nav-h) + 1rem)`. The
in-page links go through `scrollToSection()`, which offsets by hand; the
cross-page ones are native anchor jumps that know nothing about the fixed nav,
so `../index.html#ai-work` was landing with the section's first 56px underneath
it. This was true of `#work`, `#about` and `#contact` too — the new link only
made it visible. R7 clean (one `var()`, no literal); the `var()` count in
CLAUDE.md moves 626 → 627.

**Verified.** `checks.sh` exits 0. Eight assertions in Chromium: nav order
reads `Work,AI,About,Contact,CV ↓`; the section computes visible before any
click; the desktop AI link lands the section 62px down against a 56px nav; the
mobile menu lists AI, closes on the click and lands at 58px; from
`hot-potato.html` the link reaches `index.html#ai-work` with the section 72px
down — 0px before the `scroll-margin-top`, i.e. flush under the nav; no JS
errors on any page. Re-ran `check.js`, `theme.js`, `sidebar.js`, `aiverify.js`
and `final.js` — all green.

**Two suites needed fixing, neither a regression.** `aiverify.js` asserted the
published HTML carried four `data-custom-card` attributes; the AI cards are
authored markup now, not editor-inserted, so they carry none — it counts
`#ai-projects .project` instead. `final.js` opened the editor with six plain
logo clicks, which predates both the token gate and the alt-key gesture — it
plants a token, reloads, and alt-clicks three times. Test-harness rot, no repo
change either way.

**Not verified.** `smoke.sh` still skips — no `gjs` in this container, so the
WebKit half is unproven and Chromium stood in again. Nothing went through
`ghPublish()`.

**Open / pick up next.**
- `--accent` in `shared/theme.css` is still `#24211b`, identical to `--text`,
  so every accent-derived tint reads as ink. One publish from the Design tab
  fixes it site-wide; nothing here can.
- OPT-16 stands: nothing garbage-collects published assets.
