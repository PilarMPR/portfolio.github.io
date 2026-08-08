# Optimization backlog

Ranked, highest value first. **Nothing here is ever acted on unless the user
names it** (CLAUDE.md R10). IDs are stable — never reused, never renumbered.
Status: `open` · `doing` · `done` · `wontfix`.

Line numbers are against `shared/site.js` as of commit `5a62610` (3056 lines).
They drift every time the browser publishes; re-verify before acting.

    ### OPT-nn · <title> · impact <high|med|low> · effort <high|med|low> · <status>
    Evidence: <file:line>. Fix: <one or two sentences>. Catch: <what makes it
    non-trivial, if anything>.

---

### OPT-01 · No global error handler · impact high · effort low · open
Evidence: zero `console.error/warn/log` in 3056 lines of `shared/site.js`; no
`window.onerror`, no `unhandledrejection`. A throw inside any handler is
completely invisible. Fix: ~10 lines near the top of `site.js` routing both into
`console.error` plus `dlToast()`. Catch: `dlToast()` (:1908) no-ops without
`#de-toast`, and the handler must stay silent for ordinary visitors on the
published page.

### OPT-02 · 20 silent `catch (e) {}` · impact high · effort med · open
Evidence: shared/site.js:763, 1086, 1106, 1137, 1231 are `localStorage` writes —
a quota failure is indistinguishable from a successful save, so the user loses
work believing it saved. Fix: a `safeSet(key, val)` helper that toasts on
failure; convert those five sites first. Catch: `dlSave()` (:1919) already
surfaces quota failure correctly — match that pattern rather than inventing a
second one.

### OPT-03 · `ghPublish()` never re-reads the head sha · impact high · effort low · open
Evidence: read at shared/site.js:1777, used as `parents` at :1815, ref `PATCH`ed
at :1816. Two publishes (two tabs open, or a slow media upload) collide and
surface only as `alert('Publish failed: 422 …')`. Fix: re-`GET` the ref
immediately before the PATCH and abort with a human-readable message if it moved.

### OPT-04 · Publish is non-transactional · impact med · effort high · open
Evidence: media blobs are created before the ref moves in `ghPublish()`
(shared/site.js:1769-1816), so a mid-flight failure orphans them and re-uploads
next time. Cheap mitigation: cache uploaded blob shas in memory for the session
and reuse them on retry. Catch: full transactionality isn't available in the
git-data API — this can be mitigated, not solved.

### OPT-05 · Token invalidation keys off an error *string* · impact med · effort low · open
Evidence: `/^(401|403)/.test(e.message)` at shared/site.js:1834, where
`e.message` is `status + ' ' + body.slice(0,160)`. A response body that happens
to start with "401" false-positives and silently drops a working token. Fix:
have the `j()` helper attach `.status` to the Error and test that instead.

### OPT-06 · 104 hardcoded hex literals across the CSS · impact med · effort med · open
Evidence: 86 in `shared/portfolio.css` (against 620 `var()` uses) and 18 in
`shared/theme.css`. They are exactly the parts that ignore theme presets and
don't invert in dark mode (R7). Fix incrementally, one section per session, each
verified against every preset in both light and dark.

### OPT-07 · Editor chrome duplicated across five files · impact med · effort high · open
Evidence: the `#edit-panel`…`#de-toast` block is byte-identical in
`hot-potato.html`, `healthy-jeart.html` and `create-your-own-monster.html`
(0 diff lines); `block-city.html` differs by 75 lines, all of it baked runtime
state rather than authored markup (see OPT-10). Fix: inject the chrome from
`site.js` at load. Catch: `buildPublishHTML()` serializes the live DOM, so
injected chrome bakes straight back into the published file unless the scrub
list removes it first (R4). Do not start this without a plan.

### OPT-08 · Storage failures never reach the user · impact med · effort low · open
Evidence: the publish path both `alert()`s and drives the button label; the
case-study and profile save paths do neither. Fix: depends on OPT-02 landing
first.

### OPT-09 · Dead code in the publish path · impact low · effort low · open
Evidence: `GH` is declared with `path:'index.html'` at shared/site.js:1632 and
overwritten on the very next line; `#cs-edit-notice` is removed twice inside
`buildPublishHTML()` (:1667 and :1743). Harmless at runtime, but both make the
scrub list harder to read correctly — which is R4's entire problem.

### OPT-10 · Baked editor artifacts in `projects/block-city.html` · impact low · effort low · open
Evidence: `#ep-section-list`, `#ep-presets`, `#ep-colors`, `#ep-fonts`,
`class="ep-tab active"` and `disabled=""` are serialized runtime state, not
authored markup, and they generate diff churn nobody wrote — 75 lines of it.
Fix: extend the scrub list (R4); the next publish from that page then cleans
the file itself. **Never hand-edit the file** (R1).

### OPT-11 · Five stale `origin/claude/*` branches · impact low · effort low · open
Evidence: `entry-writing-edit-mode-lo5i0u`, `game-dev-portfolio-container-ng1hf4`,
`portfolio-design-unique-3lkt4r`, `portfolio-edition-interface-9sz2ks`,
`responsive-portfolio-git-mh7yf9`. Fix: delete once the user confirms none are
wanted. Catch: deleting a remote branch is irreversible from here — confirm each.

### OPT-13 · Browser-extension attributes bake into published pages · impact med · effort low · open
Evidence: `data-lt-installed="true"` sits on `<html>` in both `index.html` and
`projects/block-city.html` — a LanguageTool attribute, captured because
`buildPublishHTML()` clones the live `document.documentElement`. It re-bakes on
every publish from that browser, and any other extension that decorates the DOM
lands the same way. Fix: in the scrub list, drop `data-*` attributes on the
clone's root except `pub` and `readonly` (both set deliberately at :1724/:1754).
Catch: allow-list, not deny-list — a deny-list needs updating per extension.

### OPT-14 · Scroll state baked onto `#nav` · impact low · effort low · open
Evidence: `projects/block-city.html:17` is `<nav id="nav" class="solid">`. The
`solid` class is written by the IntersectionObserver at shared/site.js:76 and
was frozen at publish time, so the page now loads with a solid nav until the
first scroll event re-computes it. Fix: one line in the scrub list next to the
`#cursor` reset at :1745. Catch: only `solid` — `#nav` has no other classes
today, so don't blanket-clear `className`.

### OPT-15 · The editor gesture is readable in the served JS · impact low · effort high · open
Evidence: `shared/site.js` is served to every visitor, so the Alt+3-click
gesture in its EDIT MODE section is discoverable by anyone who opens it. The
docs deliberately omit it (README, CLAUDE.md, SPEC.md all point at the code
instead), but the code itself cannot hide. Fix: nothing cheap — a real gate
means the gesture checks a value that isn't in the bundle (a hash compared
against a typed passphrase). Catch: probably not worth it. Publishing already
requires the GitHub token in `localStorage`, so the realistic worst case from a
found gesture is a visitor editing their own local copy of the page.

### OPT-12 · Doc line numbers rot on every publish · impact med · effort med · done
Evidence: 17 upstream commits on 2026-08-07 grew `site.js` 2465 → 3056 lines and
invalidated 18 of the 19 `shared/site.js:NNN` citations in `CLAUDE.md` at once —
only `asset()` at :17 survived. Fix options: (a) cite function names only and
drop line numbers, (b) extend `checks.sh` to assert each cited line still
contains the named symbol. (b) is better — it makes rot a check failure instead
of silent misinformation. Catch: needs a parseable citation format in the doc.
**Done 2026-08-08** as option (b), now rule R11 — `check-citations` in
`docs/checks.sh` re-resolves all 28 citations on every run. The "parseable
format" catch resolved softer than expected: a citation passes if *any*
backticked symbol on its line appears at the cited line. Binding each number to
one symbol is not decidable from prose (`"on top of `HEAD` … hardcoded in `GH`
(site.js:1649)"` binds HEAD), and a strict pairing produced 6 false positives on
the existing text. The loose rule still fails on real drift, because when the
file grows none of the line's symbols match.

### OPT-16 · Published assets are never garbage-collected · impact med · effort high · open
Evidence: `dlDropMedia()` (shared/site.js:2194) deletes from IndexedDB only, and
`ghPublish()` (shared/site.js:1800-1824) only ever *adds* tree entries — so a
file stays in the repo forever once committed, even after the block, entry or
project referencing it is gone. Commit `f183182` cleaned 10 MB of exactly this
by hand. Fix: emit `{path, sha:null}` tree entries for unreachable `assets/`
files during publish. Catch: reachability cannot be computed from one page. A
publish sees only its own DOM, and non-devlog uploads (card art, hero images,
the profile photo) are referenced from page markup and `localStorage`, never
from `DEVLOG` — so deleting "anything not in `dlMediaRefs()`" would destroy
every live card image. A safe version has to fetch all five published pages and
union their `assets/` references with `dlMediaRefs()` first, which also means
deciding what happens when that fetch fails (answer: publish nothing).
