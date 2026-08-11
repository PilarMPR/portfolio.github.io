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

### OPT-01 · No global error handler · impact high · effort low · done
Evidence: zero `console.error/warn/log` in 3056 lines of `shared/site.js`; no
`window.onerror`, no `unhandledrejection`. A throw inside any handler is
completely invisible. Fix: ~10 lines near the top of `site.js` routing both into
`console.error` plus `dlToast()`. Catch: `dlToast()` (:1908) no-ops without
`#de-toast`, and the handler must stay silent for ordinary visitors on the
published page.
**Done 2026-08-08** in `e8d47d4` as `reportError()` (shared/site.js:31) — logs
always, toasts only while `body.editing`, wired to both `error` and
`unhandledrejection`.

### OPT-02 · 20 silent `catch (e) {}` · impact high · effort med · done
Evidence: shared/site.js:763, 1086, 1106, 1137, 1231 are `localStorage` writes —
a quota failure is indistinguishable from a successful save, so the user loses
work believing it saved. Fix: a `safeSet(key, val)` helper that toasts on
failure; convert those five sites first. Catch: `dlSave()` (:1919) already
surfaces quota failure correctly — match that pattern rather than inventing a
second one.
**Done 2026-08-08** in `e8d47d4`. `safeSet()` (shared/site.js:40) now fronts all
11 writes; silent catches 20 → 11. Bigger than filed: `parkStaleDraft()` and the
draft-restore path each removed the original *after* a write that could throw, so
a full quota deleted the only copy — the very thing parking exists to prevent.
Both now remove only once the write is confirmed.

### OPT-03 · `ghPublish()` never re-reads the head sha · impact high · effort low · done
Evidence: read at shared/site.js:1777, used as `parents` at :1815, ref `PATCH`ed
at :1816. Two publishes (two tabs open, or a slow media upload) collide and
surface only as `alert('Publish failed: 422 …')`. Fix: re-`GET` the ref
immediately before the PATCH and abort with a human-readable message if it moved.
**Done 2026-08-08** in `e8d47d4` — re-reads the ref just before committing and
stops with a sentence saying nothing was overwritten and the edits are still in
the browser. Never exercised against a real concurrent publish; the abort path is
unverified.

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

### OPT-07 · Editor chrome duplicated across five files · impact med · effort high · done
Evidence: the `#edit-panel`…`#de-toast` block is byte-identical in
`hot-potato.html`, `healthy-jeart.html` and `create-your-own-monster.html`
(0 diff lines); `block-city.html` differs by 75 lines, all of it baked runtime
state rather than authored markup (see OPT-10). Fix: inject the chrome from
`site.js` at load. Catch: `buildPublishHTML()` serializes the live DOM, so
injected chrome bakes straight back into the published file unless the scrub
list removes it first (R4). Do not start this without a plan.
**Done 2026-08-09**, as part of hiding the editor from view-source rather than
as a cleanup in its own right. The chrome is built by `edChrome()` from three
template functions and removed from the clone by id on every publish — so the
catch above is answered by deleting the subtree, not by scrubbing it. The
drift the item predicted had already happened and was worse than recorded:
`index.html` was missing `#ep-grip` entirely, so its panel could not be
collapsed on a phone. One template fixed that by construction. `checks.sh`
grew `check-no-chrome` to stop it coming back.

### OPT-08 · Storage failures never reach the user · impact med · effort low · open
Evidence: the publish path both `alert()`s and drives the button label; the
case-study and profile save paths do neither. Fix: depends on OPT-02 landing
first.

### OPT-09 · Dead code in the publish path · impact low · effort low · open
Evidence: `GH` is declared with `path:'index.html'` at shared/site.js:1632 and
overwritten on the very next line; `#cs-edit-notice` is removed twice inside
`buildPublishHTML()` (:1667 and :1743). Harmless at runtime, but both make the
scrub list harder to read correctly — which is R4's entire problem.

### OPT-10 · Baked editor artifacts in `projects/block-city.html` · impact low · effort low · done
Evidence: `#ep-section-list`, `#ep-presets`, `#ep-colors`, `#ep-fonts`,
`class="ep-tab active"` and `disabled=""` are serialized runtime state, not
authored markup, and they generate diff churn nobody wrote — 75 lines of it.
Fix: extend the scrub list (R4); the next publish from that page then cleans
the file itself. **Never hand-edit the file** (R1).
**Done 2026-08-09** by OPT-07 removing the markup from all five files, which
took the baked artifacts with it. Nothing was hand-edited: the blocks were cut
whole by id after checking each was div-balanced, and no line of page content
was touched (the HTML diff is pure deletion).

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

### OPT-15 · The editor gesture is readable in the served JS · impact low · effort high · done
Evidence: `shared/site.js` is served to every visitor, so the Alt+3-click
gesture in its EDIT MODE section is discoverable by anyone who opens it. The
docs deliberately omit it (README, CLAUDE.md, SPEC.md all point at the code
instead), but the code itself cannot hide. Fix: nothing cheap — a real gate
means the gesture checks a value that isn't in the bundle (a hash compared
against a typed passphrase). Catch: probably not worth it. Publishing already
requires the GitHub token in `localStorage`, so the realistic worst case from a
found gesture is a visitor editing their own local copy of the page.
**Done 2026-08-09**, by the route this item didn't consider. Not a passphrase
hash — that would have put the secret in the public bundle and invited an
offline attack. The gesture now checks `edUnlocked()`, i.e. whether a GitHub
token is in this browser's `localStorage`: a value that is genuinely not in
the bundle, that only the author has, and that needs no second secret to
remember. Shift on the closing click runs `edUnlock()`, which validates a
pasted token against the GitHub API (including `permissions.push`) before
storing it, so a new device is one paste and a typo fails at the door rather
than after an entry is written. The item's own verdict — "probably not worth
it" — still stands on its merits; it was done because the user asked, and the
honest ceiling is unchanged: the check runs in the visitor's browser and can
be patched out. Publishing remains the only real gate.

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

### OPT-17 · The private toggle's *label* is never scrubbed before publish · impact med · effort low · done
Evidence (`shared/site.js` at `5fcb736`, 3136 lines): `buildPublishHTML()` clears
the checkbox — `clone.querySelector('#de-private')?.removeAttribute('checked')`
(site.js:1735) — but nothing resets `#de-private-lbl`, which `deSetPrivateLabel()`
(site.js:2726) writes text *and* an inline colour into. `projects/block-city.html`
was published while a private entry was selected and now ships
`<span id="de-private-lbl" style="color: rgb(138, 109, 31);">🔒 Private</span>`;
the other three pages say `Public`. Two consequences, and only the second matters:
the file drifts from its three siblings (R5), and on that page the toggle reads
"🔒 Private" next to an unchecked box until an entry is loaded and
`deLoadEntry()` (site.js:2675) corrects it — a control that misreports the one
state the author is relying on. Also baked: `class=""` on `#dev-editor` in
`block-city` and `healthy-jeart`, left by `classList.remove('open')`. Fix: reset
the label's text and `style.color` in the scrub list, and drop `class` when it
empties; the next publish from each page then cleans its own file. **Never
hand-edit the files** (R1). Related: OPT-10 (same file, same root cause,
different elements) and OPT-07 (why the chrome is duplicated at all).
Not a content leak — verified separately that no private title, summary, body,
id or media reaches the published HTML or an export.
**Done 2026-08-09**, one day after filing, and not by adding the label to the
scrub list: OPT-07 deleted the whole subtree the label lives in, so the toggle
is rebuilt from the template every time and cannot carry a stale state
forward. The published pages no longer contain `#de-private-lbl` at all.

### OPT-18 · The editor cannot be opened on a phone at all · impact med · effort med · open
Evidence (`shared/site.js` at `3776482`, 3407 lines): the only entry point to
`toggleEdit()` is the click handler on `#nav-logo` (site.js:221), which requires
`e.altKey`. There is no `touchstart`/`pointerdown` path anywhere in the file —
the only touch listeners are the lightbox's swipe (site.js:1769). A phone has
no Alt key, so on a phone there is no way in. The `?edit=1` handoff is not a
second door: it demands this same tab already be in edit mode. This predates the
chrome refactor — it arrived with `9676035`, which put the editor behind the
modifier — but it is sharper now, because the panel carries a whole bottom-sheet
layout for small screens (`#ep-grip`, `body.panel-peek`, `MQ_STACK` at
site.js:59) that the device it was designed for cannot reach. The 2026-08-09
refactor even restored `#ep-grip` to `index.html`, which had silently lost it.
Fix: a touch gesture that opens the same gate — three taps on the logo inside
the 700 ms window, but only when `MQ_STACK.matches` and only when a token is
already stored, so it is inert for every visitor. Catch: this is exactly the
discoverability the Alt requirement was added to remove, and three fast taps on
a link is something a real visitor can do by accident. Gating it behind
`edUnlocked()` is what makes it safe — a visitor without a token can tap the
logo all day and nothing happens — so this must not be built before that gate
is trusted. iOS also fires a context menu on long-press of an `<a>`, so a
long-press variant needs `preventDefault` on `contextmenu` and will fight the
browser; taps are the safer shape. Unlocking a *new* phone still needs the
Shift path or a typed token, which no touch gesture solves — worth deciding
whether that matters before starting.

### OPT-19 · Placeholder copy still live on the landing page · impact med · effort low · open
Evidence (`index.html` at `8d14e63`): `about-p1` and `about-p2` are byte-identical
paragraphs, and `about-p3` repeats the `about-quote` pull quote sitting directly
above it — three of the four bio paragraphs are placeholder duplicates, and only
`about-p4` is unique. Separately, `contact-availability` holds
"Pilar Martín-Peña Rojo" where the green status dot beside it is designed for an
availability message, and the hero tagline reads "inmerses" for "immerses". Fix:
**the user, through the in-page editor** — every one of these is page content, so
R1 forbids touching them from here; a hand edit would be overwritten by the next
publish anyway. Catch: nothing in `checks.sh` or `smoke.sh` can see this class of
defect, and nothing should try — "is this paragraph the one you meant" is not
checkable. Recorded so it is not re-discovered on every read. Related: the two
empty dev logs and the stale README/SPEC preset names, both in
`docs/summary-content.md` §8.

### OPT-20 · Independent AI section has no nav entry · impact low · effort low · open
Evidence (`index.html`): the nav (`.nav-links`) and `#mobile-menu` both list
Work / About / Contact and were left untouched when `#ai-work` was added, so the
new category is reachable only by scrolling. Fix: one `<li>` and one `<a>`, both
calling `scrollToSection('ai-work')`. Catch: the section is `display:none` until
it holds a card, so a nav link added now points at nothing and would need the
same `:has()` gate — hence it was left out rather than shipped broken. Do this
once the first card is published, not before. Related: OPT-19, also blocked on
the user adding content through the editor.

### OPT-21 · Added project cards can't link anywhere · impact med · effort med · done
Evidence (`shared/site.js`, `insertProjectCard()`): every generated card is built
with `href = '#'` and a hardcoded `<span class="proj-cta">View case study</span>`,
and neither is a `data-ed` field — so a card added from the panel cannot be
pointed at a repo, a live demo or anything else from inside the editor, and
always claims to lead to a case study. Harmless while added cards were rare;
load-bearing for the Independent AI category, where every card wants an outbound
link. Fix: an editable CTA label is a plain `data-ed` field, but the href is not
— `data-ed` round-trips `innerHTML`, not attributes, so a URL needs its own
input in the panel plus a line in `autoSave`/`loadSaved`, or a convention like
reading the href out of the CTA field. Catch: `buildExportHTML()` rewrites
sibling `.html` links to the live site and must leave absolute external URLs
alone; check that before shipping. Worked around for the four cards filled on
2026-08-11 by setting both from script, which persists because they ride along
in the card's `outerHTML` — that covers those cards only, not the next one added
from the panel.
**Done 2026-08-11.** The URL is a `.proj-link` field shown only under
`body.editing`, and `syncCardLinks()` copies it onto the anchor — called from
insert, from save (before `outerHTML` is serialized) and after restore. The CTA
label became a plain `data-ed` field. Blank field means no `href` at all rather
than a dead `#`, and `https://` links get `target=_blank rel=noopener`. Two
things the fix turned up that the entry had not predicted: cards are anchors, so
a real destination made clicking one while editing navigate away — handled by a
capture-phase guard that spares the upload label and the delete button — and
`buildExportHTML()` needed no change, since it only rewrites sibling `.html`
links and leaves absolute URLs alone.
