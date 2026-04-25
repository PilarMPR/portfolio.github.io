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
