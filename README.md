# Portfolio

A static, browser-editable portfolio site for a game designer. No build step, no dependencies — edit any page in place, publish straight to GitHub.

## Files

```
index.html                  landing page — hero, work grid, about, contact  (20 KB)
projects/
  hot-potato.html           one page per project: case study + its dev log  (9–12 KB each)
  block-city.html
  healthy-jeart.html
  create-your-own-monster.html
shared/
  portfolio.css             every page's styling
  theme.css                 the colours — machine-written by Save & publish
  site.js                   every page's behaviour, incl. the editor
assets/
  <project>/…               images and clips, as real files
  site/                     profile photo, CV pdf
docs/                       checks, smoke test, push script, work log, backlog
.nojekyll                   serve the files as-is
SPEC.md · README.md · CLAUDE.md
```

Nothing is base64'd into the markup, so the landing page is 20 KB and a visitor only downloads the images for the project they actually open. The editor isn't in the markup either — it's built by the script when you open it — which is the other half of why the pages are that small.

## Quick start

1. Serve the folder — `python3 -m http.server` — and open it. (Opening `index.html` straight off disk mostly works, but export and a few fetches need http.)
2. Open the editor with the hidden trigger in the header. The gesture is deliberately not written down — this repo is public, and the point is that a visitor can't find it. Nothing in the header marks it, either: no icon, no pointer cursor, no hover state.
3. Edit in place. Everything saves to your browser as you type.
4. **Save & publish** commits the page you're on, plus any new images, to GitHub.

Each page publishes itself: edit the landing page and you commit `index.html`; edit Hot Potato and you commit `projects/hot-potato.html`. Nothing else is touched.

### Unlocking a browser

The gesture does nothing until a GitHub token is stored in that browser — so on a visitor's machine, or a fresh profile of your own, it's a silent no-op. A variant of the same gesture prompts for the token instead, checks it against the GitHub API, and stores it only if it can actually write here. Like the gesture, the variant is in the code rather than written down here.

Use a fine-grained token from `github.com/settings/personal-access-tokens`, scoped to **this repository only**, with **Contents → Read and write**. It's kept in `localStorage` on that machine and is never written into the site.

Be clear about what the gate is and isn't. `shared/site.js` is served to every visitor, so a determined reader can patch the check out in devtools and open the panel over their own copy of the page. What they can't do is **publish** — GitHub verifies the token server-side, and nothing in the browser can forge that. The gesture and the gate hide the editor; the token is what protects it.

## Editor tabs

Four of them: **Sections**, **+ Add**, **Dev Log**, **Design**. Save & publish and Export sit at the foot of the panel, under all four.

### Sections

On the **landing page**, the four fixed sections — Hero, Work, About, Contact — each expand to the editable fields inside them. Work expands to the four projects instead, with **Open ✏** beside each, which takes you to that project's page already in edit mode.

On a **project page** the panel is a table of contents: click a case-study section to jump to it, or just click any text on the page and type. The sidebar widgets get their own group below it (see [The sidebar](#the-sidebar)), and a link back to the landing page sits at the bottom.

What you can edit is whatever the markup marks as editable, which on the landing page is:

| Section | Fields |
|---|---|
| Hero | Job title + location, name, tagline |
| Work | The section subtitle; each card's image via its upload button |
| About | The bio paragraphs, the pull quote, and every education entry (name + detail) |
| Contact | Heading, email, LinkedIn, Discord, the status line, the footer note |

Two things on the landing page are **not** editor fields: the skills chips in the About box and the CV link in the header — both are authored in `index.html`. The four project cards are authored too, so their text isn't editable in place and there's no reorder control for them; open a card's case study to edit its content. Cards you add yourself with **+ Add** *are* fully editable, because they're generated with the fields already on them.

The profile photo and the card images are replaced by hovering the image and using its upload button rather than through a field.

### + Add

Drops new content into the page you're on:

| | Adds |
|---|---|
| 🎮 New project card | A fifth (sixth, seventh…) card in the work grid, with editable number, tags, role, name and excerpt |
| 🎓 Education entry | One more row in the About timeline — landing page only |
| 📝 Text section | A heading + paragraph block |
| 📷 Image block | An image with a caption |
| — Divider | A rule between blocks |

Added blocks appear in the Sections tab with a 🗑 to remove them. Education rows carry their own ↑ ↓ 🗑 controls in the page.

### Dev Log

Where you explain how each game was actually built. Every project has its own log of entries — one per system, feature or decision — shown at the bottom of its case study.

**To write one:** editor → **Dev Log** tab → pick the project → **New dev entry**. A full-screen form opens.

Entries are published with their project's page, so they're written there. Starting from the landing page just takes you to the right page first.

An entry is three header fields and then whatever you build under them.

**Header** — only the title is required; anything left blank simply doesn't appear:

| Field | What goes in it |
|---|---|
| Title | Shown at the top, and it becomes the entry's URL |
| Summary | One line — the hook shown in the entry list |
| Tools & tech | Comma separated; listed at the foot of the entry |

**The entry** — everything else is blocks, in whatever order you put them:

`Heading` · `Subheading` · `Text` · `Image` · `GIF / video` · `Gallery` · `Pull quote` · `Core loop` (diagram) · `Before / after` · `Table` (for balance and economy tuning) · `Bullet list` · `Code / formula` · `Tags` · `Divider`

Nothing is pre-written and no section is compulsory — an entry contains exactly the blocks you add. Hover between any two blocks for **+ Add block here** to drop a new one in at that spot, drag a block by its ⠿ handle (or use ↑ ↓) to move it, ⧉ to duplicate, 🗑 to remove.

Two blocks also feed the log list: the entry's thumbnail is the first picture it contains, wherever that sits, and the chips beside the title come from its first **Tags** block. A tag that names a phase (Concept, Production, Shipped…) keeps the blue phase colouring.

A heading block takes an optional small label above it — that's how the older Problem / Approach / Result entries are laid out. Everything from the old fixed form (those three beats, the discipline tag, phase, when, the header image) was converted to blocks automatically, so existing entries read as they did and every part of them is now movable and deletable.

#### Links you can share

Every entry has its own address:

```
yoursite.com/projects/hot-potato.html#/dev/round-timer-tuning
```

Paste that into an application and it opens straight to that entry. **Copy link to this entry** at the bottom of any entry copies it for you. The link is generated from the title and follows it while you edit — once the entry has been published, the link freezes so nothing you've already sent out breaks.

Links in the older `#/hot-potato/dev/…` form still work — the landing page forwards them.

#### Private entries

Toggle any entry to 🔒 **Private** (top-right of the editor). Private entries are visible to you in the browser but are stripped out completely when you publish — they never reach GitHub.

> **They live only in this browser.** Clear your browser data and they're gone. Use **Export private entries** to save a JSON backup, and **Restore from backup** to bring it back or move it to another machine.

#### Images and clips

Every upload — dev-entry media, project card art, gallery images, your profile photo — is committed as a real file under `assets/` when you hit **Save & publish**. One commit, page and media together. Nothing is base64'd into the markup. Until you publish, a badge in the Dev Log tab tells you how many files are still browser-only.

GitHub Pages takes about a minute to deploy, so freshly published images fall back to your local copy in the meantime instead of showing as broken.

### Design

- **Theme presets** — one click each: **Notebook** (the default: warm paper, dark ink, red pen), **Blueprint**, **Midnight** (the dark one), **Rosé**, **Forest**, **Mono**.
- **Colors** — click a swatch to change it. Six, named for what they do rather than where they sit: Paper, Ink / text, Accent (pen), Blue ink, Highlighter, Approved. Everything else is derived — shades, borders, drop shadows, every translucent tone — so changing the accent changes all of it, and picking a dark paper flips the whole site to dark mode by itself.
- **Fonts** — a display face and a body face, loaded from Google Fonts only when you pick them. Display: Bricolage Grotesque, Space Grotesk, Syne, Unbounded, Archivo Black, Fraunces. Body: Space Grotesk, Inter, DM Sans, Work Sans.
- **↺ Reset to default** puts the Notebook preset back.

The theme is site-wide, not per-page: publishing any page writes `shared/theme.css`, and every page loads it. See [Tech](#tech) for why it works that way.

## Case study pages

Each project tile links to its own page under `projects/`. The page carries the full case study — hero, facts row, overview, challenges, awards, gallery, tools sidebar — and its Development Log at the foot, with prev/next links between projects.

Because they're real pages, each one has its own title, description and URL, so a link to a single case study previews properly when you paste it somewhere.

### The sidebar

The boxes down the right of a case study. In edit mode each one gets ↑ ↓ 🗑 in its corner, and the **Sections** tab lists them under **Sidebar** with buttons to add more. Three shapes:

| | Looks like | Add items with |
|---|---|---|
| Tool chips | Tools & Tech | the dashed **+** at the end of the row |
| Bullet list | Role breakdown | the dashed **+** under the last point |
| Text | Studio | just type |

Headings, chips and bullets are all editable in place; **×** on any chip or bullet removes it.

### How a case study is stored

Worth knowing, because getting it wrong once cost Block City its whole sidebar.

Project pages save **only the text you edited**, keyed by where each field sits — never a copy of the page. Layout always comes from the `.html` file. An earlier version stored the entire `#case-view` and put it back on load, which meant any page whose stored copy predated a structural change would quietly rebuild itself without that part, then publish the loss back over the file.

The one exception is the sidebar, because that's structure you author rather than just edit. It's stored — but only after you've actually changed it, so a page you've never touched still takes its widgets from its own markup. If you add anything similar, keep that rule.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings → **Pages**, set the source to the `main` branch root.
3. Your portfolio will be live at `https://<username>.github.io/<repo-name>/`.
4. Optional: rename the repo to `<username>.github.io` to host at the apex path.

All internal links are relative, so the site works at any sub-path without changes. `.nojekyll` tells Pages to serve the files exactly as committed.

Because everything is static, any static host works (Netlify, Vercel, Cloudflare Pages, plain S3, etc.).

## How data is stored

- **In the browser:** `localStorage` (content + theme + dev log) and `IndexedDB` (uploaded dev-log media).
- **On the live site:** **Save & publish** commits the current page with everything baked in, plus any new media as real files under `assets/`.
- **In a downloaded file:** **Export this page** gives you a self-contained, read-only copy of whichever page you're on.

If you switch browsers or clear localStorage, your in-progress edits are gone — publish, export, or back up the JSON manually if you want to migrate.

### Publish vs. export

They're different on purpose:

| | Save & publish | Export HTML file |
|---|---|---|
| Scope | The page you're on | The page you're on |
| Goes to | The live GitHub Pages site | Your downloads folder |
| Images, CSS, JS | Stay as separate files — pages stay small | All folded into the one file |
| Editing | Editor still available | Read-only; the editor is stripped out |
| Needs the rest of the site | Yes | No — works offline, from a USB stick, as an email attachment |

Both exclude private entries. Export gives you a single self-contained page — handy for emailing one case study to a studio; links to the other pages point back at the live site. Export needs the page served over http, not opened from disk.

## Tips

- Images are committed as real files, so page weight stays low — but the repo still grows. Resize screenshots before uploading; keep clips to a few seconds.
- **Don't publish animated GIFs.** A GIF is stuck with 256 dithered colours and no interframe compression — the one on Healthy Jeart was 1.5 MB for 1.4 seconds. Save animations as **animated WebP** instead: it's still an `<img>`, so the gallery and lightbox handle it with no special casing, and it came out 68% smaller *and* cleaner (no dither noise in flat areas). Any modern browser plays it.
- The CV is a real file in the repo (`assets/site/pilar-mpr-cv.pdf`), linked from the header, the mobile menu and the About section. Replacing it means committing a new PDF at that path; pointing at a hosted copy instead means editing the three `href`s in the markup.
- The tagline, bio, and case-study text fields all preserve line breaks.
- The status line beside the green dot in Contact **is** an editable field — click it in edit mode. It's meant to say something like "Available for projects".
- **Don't hand-edit page text in the `.html` files.** Publishing rewrites the whole page from what's in the browser, so a hand edit is silently overwritten the next time you publish from a browser that never saw it. Structure, CSS and JS are safe to edit by hand — the browser reloads those. Prose and images go through the editor.

## Tech

- Plain HTML / CSS / vanilla JS, no build step, no dependencies, no package manager
- One stylesheet and one script shared by every page, so they're cached across navigation
- Each page declares its own `window.PAGE` context (role, path, base) — that's how the same script drives the landing page and the project pages
- Works fully offline once the fonts are cached
- **The editor isn't in the HTML.** The panel, the formatting bar, the dev-entry form and the toast are built from templates in `site.js` the first time you open edit mode, and every publish removes them again by id. So a published page contains no editor markup at all — view-source shows a portfolio, not a CMS — and there's no leftover editor state that could be baked into a page by accident. A page that *does* contain `#edit-panel` was published by a browser running an old copy of the script, and republishing from it will clean it up.
- **Publishing is a DOM snapshot.** `Save & publish` clones the live page and serializes it, so anything the script rendered at runtime ends up in the committed file. That's the reason for the rule about not hand-editing page text, and the reason the mobile menu is static markup rather than injected by script.
- Theme system uses CSS variables. The theme is **one file — `shared/theme.css`** — loaded by every page after `portfolio.css`, and written by **Save & publish** from whatever the Design tab is set to. Publishing any page therefore recolours the whole site.

  It used to be baked into each page's `<html style>` instead, which meant a theme change only reached the page you published from. Doing that twice left the site with three different accents at once — near-black on the landing page, navy on Block City, the original red everywhere else. If you add anything themed, put it in `theme.css`, not on a page.

  Translucent shades derive from three bases the theme emits — `--accent-rgb`, `--text-rgb`, `--yellow-rgb` — so rules write `rgba(var(--text-rgb),.1)` and every drop shadow, label rule and highlighter tint follows the theme. Around 70 of those used to be literals from the original red-pen design, which meant changing the accent barely changed anything and the dark `Midnight` preset rendered dark shadows on dark paper.

  One deliberate literal remains: the lightbox backdrop. It has to stay dark under every theme, since its own chrome is light to sit on top of it.

### Responsive

Four breakpoints, defined at the bottom of `shared/portfolio.css`. They live
at the end of the file on purpose — later rules win by source order, so
nothing there needs an inflated selector to take effect.

| | Width | What changes |
|---|---|---|
| wide | 1100px | Two-column layouts loosen up; the floating "← All work" link drops |
| stack | 900px | Everything goes to one column. The editor drawer becomes a bottom sheet |
| phone | 620px | Hamburger menu; 16px form fields; 44px tap targets |
| small | 420px | Final tightening |

Before adding a fifth, check whether intrinsic sizing solves it instead —
`.sh-facts` uses `auto-fit` and reflows 4 → 1 columns with no query at all.

Two things worth knowing if you change the layout:

- `--nav-h` is the single source of truth for the header height. CSS uses it
  and `navH()` in `site.js` reads it back, so scroll offsets can't drift out
  of step with it. It is deliberately **not** a theme variable — `applyTheme()`
  writes theme vars onto `documentElement.style`, which would override it.
- The mobile menu's markup is static in all five pages rather than injected
  by script. `buildPublishHTML()` serializes the live DOM, so anything the
  script adds would be baked into the published page and then added again on
  the next load. Any new UI state class needs clearing there too.

On a small screen the editor panel docks to the bottom of the screen instead
of the left edge, and collapses to a peek so you can see the page you're
editing. Tap the handle or the "Edit mode" header to expand it; picking a
section or field collapses it again so you land on what you selected.

> **Known gap:** that bottom sheet can't currently be reached on the device it
> was built for. The only way into edit mode is the logo gesture, and the
> gesture can't be performed on a touchscreen — so editing is desktop-only for
> now. Tracked as OPT-18 in `docs/backlog.md`.

### Editing on more than one machine

Edits live in **this browser** until you hit **Save & publish** — that part is by design. What wasn't by design: a browser holding an older draft used to replay it over whatever had been published since, so work published from your laptop looked like it never arrived on your desktop.

Publishing now stamps the page with the time. If a browser's draft is older than the page it just loaded, the draft is set aside instead of applied, and a bar tells you so with **Use my edits** to put it back — nothing is thrown away. A draft newer than the published page still wins, silently, which is the normal state while you're working.

The same stamp cache-busts `shared/site.js` and the stylesheets. Before that, a tab could sit on a months-old `site.js` and publish with its old behaviour — which is how a theme change got reverted by an ordinary content publish.

### Checks

There's no build and no test framework, but there are three shell scripts in `docs/`. None of them installs anything.

```bash
bash docs/checks.sh      # static checks — no output means all clear
bash docs/smoke.sh       # loads all five pages in a real engine; "ok 5 pages" = clear
bash docs/safe-push.sh   # verify, then push (-n to verify only)
```

`checks.sh` catches the mistakes this codebase can't catch any other way: an `onclick` naming a function that no longer exists (nothing imports anything, so the button just silently does nothing), a page missing one of the elements the script grabs at load without a null check, a page that still ships editor markup, and a syntax error in `site.js` — which, being one flat script, would blank all five pages at once.

`smoke.sh` is the half that proves the site *runs*. It loads every page in WebKitGTK, catching anything thrown from before the first script executes, and checks each page reaches its `window.PAGE` contract, applies the theme, renders, and defines every handler its markup names.

`safe-push.sh` refuses to push on a dirty tree, when the browser has published since you last fetched, when either script above fails, or when a token or a local path appears in the outgoing diff. It won't resolve a conflict for you — when a page conflicts, the published content is somebody's real work and which side wins isn't a script's call.

For the conventions behind all of this — what's safe to hand-edit, why nothing force-pushes, how the work log and backlog are kept — see `CLAUDE.md`.
