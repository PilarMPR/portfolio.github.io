# Portfolio

A single-file, customizable portfolio site for a game designer. Edit everything from the browser, save to localStorage, deploy as static HTML.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole portfolio (HTML + CSS + JS in one file) |
| `case-study.html` | Standalone case-study page; reads `?project=N` and pulls data from localStorage |
| `SPEC.md` | Original design spec |
| `README.md` | This file |

## Quick start

1. Open `index.html` in a browser (no build step, no server needed).
2. Click the logo in the top-left **6 times** in quick succession to open the editor panel.
3. Fill in your info across the four tabs.
4. Everything saves automatically to your browser's localStorage.
5. When ready, click **Download HTML** in the editor to get a standalone file with all your content (and embedded images) baked in.

## Editor tabs

### Profile
- Name, job title, tagline (hero section)
- Profile photo (uploads embed as base64 — no hosting needed)
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

Each entry has a fixed skeleton, so they all read consistently:

| Field | What goes in it |
|---|---|
| Title | Becomes the entry's URL |
| Discipline / Phase / When | Systems, Combat, Economy… · Concept → Postmortem · e.g. "Q2 2024" |
| Summary | One line — the hook shown in the entry list |
| Header image or clip | Image, GIF or short MP4/WebM |
| **Problem** | What needed solving |
| **Approach** | What you designed, and how you iterated |
| **Result** | What changed, with evidence |
| Tools & tech | Comma separated |

Below that, add as many free blocks as you want, in any order: text, image, GIF/video, gallery, pull quote, **core-loop diagram**, before/after, **table** (for balance and economy tuning), bullet list, code/formula.

#### Links you can share

Every entry has its own address:

```
yoursite.com/#/hot-potato/dev/round-timer-tuning
```

Paste that into an application and it opens straight to that entry. **Copy link to this entry** at the bottom of any entry copies it for you. The link is generated from the title and follows it while you edit — once the entry has been published, the link freezes so nothing you've already sent out breaks.

#### Private entries

Toggle any entry to 🔒 **Private** (top-right of the editor). Private entries are visible to you in the browser but are stripped out completely when you publish — they never reach GitHub.

> **They live only in this browser.** Clear your browser data and they're gone. Use **Export private entries** to save a JSON backup, and **Restore from backup** to bring it back or move it to another machine.

#### Images and clips

Uploads in dev entries are **not** base64'd into the page. They're held in the browser and committed as real files under `assets/<project>/` when you hit **Save & publish** — one commit, page and media together. Until you publish, a badge in the Dev Log tab tells you how many files are still browser-only.

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

Project tiles link to `case-study.html?project=N` (where `N` is the project's index). The page renders the full case study from your saved data: hero, facts row (role / team / duration / platform), overview, challenges, results, gallery, tools sidebar, and prev/next navigation between projects.

Empty fields render as friendly "Coming soon" placeholders so the layout still looks intentional while you fill things in.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings → **Pages**, set the source to the `main` branch root.
3. Your portfolio will be live at `https://<username>.github.io/<repo-name>/`.
4. Optional: rename the repo to `<username>.github.io` to host at the apex path.

Because everything is static, any static host works (Netlify, Vercel, Cloudflare Pages, plain S3, etc.).

## How data is stored

- **In the browser:** `localStorage.portfolioData` (one JSON blob with all your content + theme + layout).
- **In a downloaded file:** click **Download HTML** in the editor to export a self-contained `portfolio.html` with all data and images baked into the markup. This is what you'd commit/deploy.

If you switch browsers or clear localStorage, your in-progress edits are gone — download HTML or back up the JSON manually if you want to migrate.

## Tips

- Images are embedded as base64 data URIs. Big photos make big files; resize before uploading if you care about page weight.
- The CV link is just a URL — host the PDF anywhere (Drive, Dropbox, your repo) and paste the public link.
- The tagline, bio, and case-study text fields all preserve line breaks.
- Status dot in the contact section is hard-coded as "Available for projects" — edit `index.html` directly to change the wording.

## Tech

- Plain HTML / CSS / vanilla JS, no build step, no dependencies
- Works fully offline once the fonts are cached
- Responsive (single column under 900px)
- Theme system uses CSS variables; the text color drives all derivative `rgba()` shades automatically via `--text-rgb`
