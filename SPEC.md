# Portfolio Specification

What the site is meant to be and do. Written as a brief before the build; kept
in step with what actually shipped. Where this and the code disagree, the code
wins — see `README.md` for how to use it and `CLAUDE.md` for how to change it.

## 1. Overview

- **Who**: Game designer and producer (systems, mechanics, economies)
- **Goal**: Job applications; showing work to studios and clients
- **Angle**: Not a gallery — a notebook. Each project is taken apart into the
  systems that make it work, and the part the author designed is named.
- **Style**: Editorial and minimal — paper, ink, one accent, plenty of whitespace

## 2. Structure

Five static pages. The landing page carries the pitch; each project gets a page
of its own so it has its own title, description, URL and link preview.

| Page | Contains |
|---|---|
| **Landing** | Hero · Work grid (4 cards) · About · Contact |
| **Case study** ×4 | Hero · facts row · case study · gallery · sidebar · dev log |

| Section | Description |
|---|---|
| **Hero** | Name, job title + location, tagline, two CTAs |
| **Work** | Four project cards → each links to its own case-study page |
| **About** | Bio, pull quote, photo, education timeline, skills |
| **Contact** | Email, LinkedIn, Discord, CV download, status line |

## 3. Case study page

| Part | Description |
|---|---|
| Hero + tags | Key art, category, status, dates |
| Facts row | Engine · team size · role · timeline |
| Context | What the project is, and the design goal in one quote |
| Core loop | The loop as a diagram, plus how it plays |
| Responsibilities | Split by discipline — design vs. production |
| Challenges | The decisions that were hard, and what iteration settled them |
| Outcome | Awards, results, feedback |
| Gallery | Screenshots and key art, in a lightbox carousel |
| Sidebar | Tools & tech chips, role breakdown, free-text boxes (e.g. studio) |
| Dev log | Entries on how it was built — see §5 |
| Prev / next | The four case studies read as a sequence |

## 4. Visual style

- **Theme**: generated from six seed colours and two fonts, not hand-painted.
  Six presets ship — Notebook (default), Blueprint, Midnight, Rosé, Forest,
  Mono. Shades, translucent tones and dark-mode inversion are all derived, so
  one colour change carries across the whole site.
- **Type**: a display face and a body face, both swappable; monospace for
  labels and diagrams; a handwriting face for margin notes.
- **Layout**: two-column grids on desktop, single column on mobile.
- **Responsive**: four breakpoints — 1100 / 900 / 620 / 420px.

## 5. Development log

Per-project, at the foot of each case study. The feature that carries the
"how it was built" premise, and the reason the site isn't just four cards.

- One entry per system, feature or decision.
- An entry is three header fields — title, one-line summary, tools & tech —
  and then **blocks**, in any order. Nothing is prescribed and no section is
  compulsory.
- Fourteen block types: heading, subheading, text, image, GIF/video, gallery,
  pull quote, core loop, before/after, table, bullet list, code/formula, tags,
  divider.
- Each entry has its own shareable URL (`…/projects/<project>.html#/dev/<slug>`),
  generated from the title and frozen once published so sent links don't break.
- Entries can be marked **private**: kept in the browser, never published.

## 6. Editor

The site edits itself in the browser and commits the result back to the repo.

- **Access**: a hidden gesture on the logo, which does nothing unless a GitHub
  token is stored in that browser. The gesture is deliberately not written down
  — this repo is public. See the EDIT MODE section of `shared/site.js`.
  A variant of the gesture prompts for a token and validates it against the
  GitHub API before storing it, which is how a new machine is unlocked.
- **Not a security boundary**: `site.js` is served to every visitor, so the
  gesture and the gate can both be patched out locally. Publishing cannot —
  GitHub checks the token server-side. The gate hides the editor; the token
  protects it.
- **Not shipped**: the editor UI is built from templates on first use and
  removed again on every publish, so a published page contains no editor markup.

Editable:

- [x] Job title, name, tagline
- [x] Bio paragraphs and pull quote
- [x] Education list — add, reorder, remove
- [x] Contact fields and status line
- [x] Profile photo and all project card images (upload)
- [x] Full case-study text on each project page
- [x] Case-study sidebar widgets — chips, bullets, free text
- [x] Dev-log entries and their blocks
- [x] Theme colours and fonts
- [x] New project cards, text sections, image blocks, dividers

Authored in markup, not through the editor: the skills chips, the CV link, and
the four original project cards' text.

## 7. Publish and export

| | Save & publish | Export HTML file |
|---|---|---|
| Scope | The page you're on | The page you're on |
| Goes to | The live GitHub Pages site, as one commit | Your downloads folder |
| Media | Real files under `assets/` | Inlined as data URIs |
| Result | Editable, part of the site | Read-only, self-contained, works offline |

Both exclude private dev-log entries.

## 8. Tech

- Plain HTML / CSS / vanilla JS. No build step, no dependencies, no framework.
- Five standalone pages sharing one stylesheet, one theme file and one script;
  each page declares its own `window.PAGE` context so the same script drives
  every role.
- Hosted on GitHub Pages, `.nojekyll`, served exactly as committed. All links
  are relative, so it works at any sub-path and on any static host.
- Storage: `localStorage` for text and theme, IndexedDB for uploaded media,
  published dev-log entries baked into each page as JSON.
- Works offline once fonts are cached.
