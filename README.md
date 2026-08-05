# Portfolio

A static, browser-editable portfolio site for a game designer. No build step, no dependencies — edit any page in place, publish straight to GitHub.

## Files

```
index.html                  landing page — hero, work grid, about, contact  (28 KB)
projects/
  hot-potato.html           one page per project: case study + its dev log  (~20 KB each)
  block-city.html
  healthy-jeart.html
  create-your-own-monster.html
shared/
  portfolio.css             every page's styling
  site.js                   every page's behaviour, incl. the editor
assets/
  <project>/…               images and clips, as real files
  site/                     profile photo, CV pdf
.nojekyll                   serve the files as-is
SPEC.md · README.md
```

Nothing is base64'd into the markup, so the landing page is 28 KB and a visitor only downloads the images for the project they actually open.

## Quick start

1. Serve the folder — `python3 -m http.server` — and open it. (Opening `index.html` straight off disk mostly works, but export and a few fetches need http.)
2. Click the logo in the top-left **6 times** in quick succession to open the editor.
3. Edit in place. Everything saves to your browser as you type.
4. **Save & publish** commits the page you're on, plus any new images, to GitHub.

Each page publishes itself: edit the landing page and you commit `index.html`; edit Hot Potato and you commit `projects/hot-potato.html`. Nothing else is touched.

## Editor tabs

### Sections
On the landing page: hero, work, about and contact, each expanding to its editable fields. On a project page: a table of contents for the case study — click any text on the page to edit it directly.

### Profile fields
- Name, job title, tagline (hero section)
- Profile photo
- Bio, quote, education, skills
- Contact: email, LinkedIn, Twitter/X, CV link

### Projects
Each project has:
- **Card fields:** name, category, excerpt, hero image
- **Case-study fields:** role, team, duration, platform, overview, challenges & solutions, results, tools, gallery images

Reorder with the up/down buttons. Up to as many projects as you want, though the SPEC targets 4.

### Dev Log

Where you explain how each game was actually built. Every project has its own log of entries — one per system, feature or decision — shown at the bottom of its case study.

**To write one:** editor → **Dev Log** tab → pick the project → **New dev entry**. A full-screen form opens.

Entries are published with their project's page, so they're written there. Starting from the landing page just takes you to the right page first.

An entry is a short header and then whatever you build under it.

**Header** — only the title is required; anything left blank simply doesn't appear:

| Field | What goes in it |
|---|---|
| Title | Shown at the top, and it becomes the entry's URL |
| Phase | Concept → Postmortem |
| When | e.g. "Q2 2024" |
| Summary | One line — the hook shown in the entry list |
| Header image or clip | Image, GIF or short MP4/WebM |
| Tools & tech | Comma separated; listed at the foot of the entry |

**The entry** — everything else is blocks, in whatever order you put them:

`Heading` · `Subheading` · `Text` · `Image` · `GIF / video` · `Gallery` · `Pull quote` · `Core loop` (diagram) · `Before / after` · `Table` (for balance and economy tuning) · `Bullet list` · `Code / formula` · `Divider`

Nothing is pre-written and no section is compulsory — an entry contains exactly the blocks you add. Hover between any two blocks for **+ Add block here** to drop a new one in at that spot, drag a block by its ⠿ handle (or use ↑ ↓) to move it, ⧉ to duplicate, 🗑 to remove.

A heading block also takes an optional small label above it — that's how the older Problem / Approach / Result entries are laid out. Those entries were converted to blocks automatically, so they read exactly as before and are now editable and deletable like everything else.

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
- **Theme presets:** one click to apply Soft Latte (default cozy light), Warm Cabin, Forest Dusk, Ghibli Pastel, or Original Dark.
- **Custom colors:** picker + hex input for background, surface, accent, and text. Text color drives all the secondary opacity tones automatically.
- **Font:** dropdown of curated display fonts (Unbounded, Space Grotesk, Syne, Clash Display, etc.) loaded on demand from Google Fonts and Fontshare.

### Layout
- Hero style (modern / classic / minimal), content position, background glow on/off
- Project grid columns, image position (top / left / right / gallery), aspect ratio, blur
- About-section photo position

## Case study pages

Each project tile links to its own page under `projects/`. The page carries the full case study — hero, facts row, overview, challenges, awards, gallery, tools sidebar — and its Development Log at the foot, with prev/next links between projects.

Because they're real pages, each one has its own title, description and URL, so a link to a single case study previews properly when you paste it somewhere.

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
| Editing | Editor still available (logo ×6) | Read-only; the editor is stripped out |
| Needs the rest of the site | Yes | No — works offline, from a USB stick, as an email attachment |

Both exclude private entries. Export gives you a single self-contained page — handy for emailing one case study to a studio; links to the other pages point back at the live site. Export needs the page served over http, not opened from disk.

## Tips

- Images are committed as real files, so page weight stays low — but the repo still grows. Resize screenshots before uploading; keep clips to a few seconds.
- The CV link is just a URL — host the PDF anywhere (Drive, Dropbox, your repo) and paste the public link.
- The tagline, bio, and case-study text fields all preserve line breaks.
- Status dot in the contact section is hard-coded as "Available for projects" — edit `index.html` directly to change the wording.

## Tech

- Plain HTML / CSS / vanilla JS, no build step, no dependencies
- One stylesheet and one script shared by every page, so they're cached across navigation
- Each page declares its own `window.PAGE` context (role, path, base) — that's how the same script drives the landing page and the project pages
- Works fully offline once the fonts are cached
- Responsive (single column under 900px)
- Theme system uses CSS variables; the text color drives all derivative `rgba()` shades automatically via `--text-rgb`
