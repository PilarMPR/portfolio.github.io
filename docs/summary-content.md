# The portfolio, described

What the site *is* and what it *says* — the content side. For how it is built,
see [`summary-engineering.md`](summary-engineering.md).

Written against commit `8d14e63` (2026-08-10). Page content is machine-written
and changes whenever the browser publishes, so treat quoted copy as a snapshot,
not a contract.

---

## 1. What it is

A personal portfolio for **Pilar Martín-Peña Rojo**, game designer and producer
based in Madrid. Its stated purpose (`SPEC.md`) is job applications and showing
work to studios and clients.

The framing is a **designer's notebook, not a gallery**. The landing page calls
its project grid a "Work **Log**", the section kicker reads
`// FOUR GAMES, TAKEN APART`, and the subtitle promises "four shipped games,
pulled apart into the systems that make them tick". The visual language follows:
paper-coloured background, red-pen accent, handwritten scribbles in the margin
("she designs the rules, not the art ↗"), highlighter tones, monospace labels.

The claim the whole site is making is a specific one — *not* "look at these
pretty games" but "here is how these games work, and here is the part I
designed". Every case study is organised around that: context, core loop,
responsibilities split into design and production, the decisions that were hard,
the outcome.

## 2. Shape of the site

Five pages, all reachable from a shared header (Work · About · Contact · CV ↓):

| Page | What it holds |
|---|---|
| `index.html` | Hero, work grid (4 projects), About, Contact |
| `projects/hot-potato.html` | Case study + dev log |
| `projects/block-city.html` | Case study + dev log |
| `projects/healthy-jeart.html` | Case study + dev log |
| `projects/create-your-own-monster.html` | Case study + dev log |

Case studies are chained: each ends with "← All work" and "Next: …", so the four
read as a sequence rather than four dead ends. A CV PDF
(`assets/site/pilar-mpr-cv.pdf`) is downloadable from the header, the mobile
menu and the About section.

## 3. Landing page

**Hero.** Name set in three stacked lines, the kicker "Game Designer & Producer
· Madrid", and the tagline *"My ultimate passion is designing the experience
that inmerses you in a whole new universe"*. Two calls to action: *See my work
↓* and *Get in touch*.

**Work.** Four cards, numbered 01–04, each with a category tag, a status tag, the
role held, and a one-line excerpt. In order:

| # | Project | Tags | Role | The hook |
|---|---|---|---|---|
| 01 | Hot Potato | Party Brawler · In Development | Lead Designer & Producer | "Chaotic third-person multiplayer built on one rule: don't be the potato when time runs out." |
| 02 | Block City | Educational · Freelance | Designer & Producer | "City-builder where kids unlock buildings by solving maths puzzles." |
| 03 | Healthy Jeart | F2P Mobile · Educational | Intern Game Designer | "F2P monetisation mechanics repurposed to reward real-world healthy habits." |
| 04 | Create Your Own Monster | F2P Mobile · Casual | Intern Game Designer | "Kids customise monsters and level them up through distinct minigames." |

The ordering is deliberate and reads as seniority descending: lead role first,
freelance ownership second, two internships last.

**About.** A photo, a bio, a pull quote, an editable education list and a skills
box. The bio traces the interest back to playing games — Assassin's Creed
Brotherhood, Subnautica — and lands on two stated specialisms: **mechanic
design** ("how to tell a story through player actions") and **educational
games** ("making something that genuinely teaches without sacrificing game
feel"). The pull quote: *"The most powerful moments in games are the ones where
you understand something without being told — where the rule and the meaning
arrive at the same time."*

Education, newest first as displayed: UDIT (Game Design & Development, Madrid),
Runnymede College (A Levels: History, Geography, English Literature), and two IE
summer bootcamps (Business & Management, Entrepreneurship).

Skills, as 17 chips: Unreal Engine 5, Unity, Construct, Blueprints, C# OOP, JSON
pipelines, Adobe XD, Miro, Jira/Notion, Google Sheets, Git/Perforce, mechanic
design, economy design, level design, GDD writing, sprint planning, playtesting.

**Contact.** Three channels — email (`pilarmprojo@gmail.com`, marked preferred),
LinkedIn, and Discord (`@pilumpr`) — plus a status line and a footer note.

## 4. The four case studies

Every case study uses the same skeleton: a full-bleed hero, a four-fact row
(engine, team, role, timeline), then labelled sections, a gallery, and a sidebar
of widgets down the right.

### 01 · Hot Potato — Unreal Engine 5 · 9 people · Lead Designer & Producer · 2023 → present

A social party brawler at **Wild Alchemists**, built on a playground rule: one
player is the potato, and whoever holds it when the timer runs out explodes.

- **Core loop:** round starts → potato assigned → chase/evade → tag transfers →
  timer ends → loser explodes. Movement is physics-driven (run, jump, slide,
  dodge, push), and because tagging transfers instantly, every close moment is
  dangerous for *both* players — the design point of the whole thing.
- **The design tension, stated outright:** making chaos feel *fair*. Players have
  to feel they lost by their own choices.
- **The iteration that mattered:** round length. Early rounds ran 3–4 minutes and
  tension collapsed halfway; cutting to 60–90 seconds kept urgency constant and
  visibly improved the "one more round" pull in playtests. This is the single
  most concrete design-decision-with-evidence anywhere on the site.
- **Split of responsibility:** design (full loop, UE5 Blueprints + GASP movement
  implementation, playtesting, animation specs and state diagrams) and
  production (sprints, cross-department coordination, unblocking).
- **Outcome:** three awards — Match in Games 2025 *3º Premio del Jurado*, CYL
  Game Show 2025 *Premio a la mejor idea*, Match in Games 2025 *Premio del
  Público*. Further detail is under NDA and the page says so.
- **Sidebar:** Tools & Tech (UE5, Blueprints, GASP, Miro, Google Sheets), role
  breakdown, and a Studio box (Wild Alchemists, 10-person indie studio, Madrid).

### 02 · Block City — Construct · 3 people · Designer & Producer · 12 months, freelance

A free educational city-builder for 8–9 year olds where **all progression is
gated behind three-step unit-conversion maths puzzles**. The stated hypothesis:
interactive reward systems motivate mathematical engagement better than rote
practice.

- **Core loop:** solve puzzle → earn coins → build → city grows → next puzzle.
- **Design work:** every puzzle, plus balance spreadsheets covering difficulty
  mapping, coin reward formulas and building unlock logic; JSON tables generated
  for direct import into Construct; buildings, triggers, UI and SFX implemented
  directly in Construct.
- **The constraint worth noting:** an anti-softlock rule hard-coded into every
  progression branch — a child must never be able to strand themselves.
- **The lesson claimed:** driving content from JSON tables meant changes needed
  no code, but forced thinking in data structures rather than design documents —
  "that shift in thinking influenced every project since."
- Also mentioned: emergent creative play the team had not planned for, which
  they leaned into.
- **Dev log:** one published entry, *Core loop*, with the loop diagram image.

### 03 · Healthy Jeart — Unity · 6 people · Intern Game Designer · 3-month internship

An educational platformer that takes **F2P monetisation mechanics and inverts
them**: currencies, shops and engagement loops reward real-world healthy habits
in 8–14 year olds instead of extracting money.

- **The premise, quoted on the page:** "Can the same mechanics that drive
  compulsive spending drive behavioural change instead?"
- **The key inversion:** hard currency — normally the real-money tier — is earned
  by completing health questionnaires and taking part in an age-banded community
  forum.
- **Contribution:** balancing the engagement-vs-education tension, items and
  power-ups that reinforce healthy/unhealthy distinctions with positive game
  feel, Adobe XD interface mock-ups and menu flow, challenge and prize systems,
  iterative playtesting.
- **The hard part:** making habit logging feel rewarding rather than homework —
  most of the iteration went into the *quality of the feedback*, not the size of
  the reward.
- **The professional lesson:** contributing meaningfully inside an established
  senior team, and advocating for design ideas without owning creative
  direction.
- **Dev log:** one published entry, *Item balancing*, with two balance-table
  images.

### 04 · Create Your Own Monster — Unity · 9 people · Intern Game Designer · 2-month internship

A family-friendly F2P mobile game at **Mechanic Games** for ages 6–12, resting on
two interlocking pillars: deep customisation for emotional attachment, and
varied minigames for progression.

- **Core loop:** customise monster → play minigame → earn resources → level up →
  unlock more.
- **The thesis, quoted:** "You care about winning minigames because the monster
  is yours. Without the customisation, the progression has no emotional anchor."
- **Contribution:** multiple distinct minigames each with a unique core mechanic
  (explicitly to avoid session fatigue), balancing and level design in Unity
  across the whole age band, and structured documentation.
- **The hard part:** 6–12 is an unusually wide accessibility band. Every minigame
  had to read without tutorial text — pure visual communication — while still
  holding older players. And each needed a genuinely distinct core action, "not
  just a reskin … not repeating the same loop with different wallpaper."

## 5. The dev log

The most distinctive content feature, and the one that carries the site's
premise furthest. Each project page ends with its own log of entries — one per
system, feature or decision — and each entry has a shareable URL of its own
(`…/projects/hot-potato.html#/dev/round-timer-tuning`), so a single system can
be linked directly into an application.

An entry is three header fields (title, one-line summary, tools & tech) and then
**whatever blocks are added under them** — nothing is prescribed. Fourteen block
types are available: heading, subheading, text, image, GIF/video, gallery, pull
quote, core-loop diagram, before/after, table (for balance and economy tuning),
bullet list, code/formula, tags, divider.

Entries can be marked **private**: visible in the author's own browser, stripped
completely on publish — text, images and all. That makes the log usable as a
working notebook, not only a publication surface.

**Current state: two published entries across four projects.** Block City has
*Core loop*; Healthy Jeart has *Item balancing*. Hot Potato and Create Your Own
Monster have none. The feature is fully built and barely populated — the largest
content gap on the site by a distance, and the one with the highest return,
since Hot Potato is the lead project and its round-length iteration is exactly
the kind of thing an entry is shaped to hold.

## 6. Visual identity

The theme is generated, not hand-painted: six presets ship in the code —
**Notebook** (the live default: warm paper `#f4efe3`, dark ink, red-pen accent),
Blueprint, Midnight, Rosé, Forest, Mono. Each preset is six seed colours plus a
display and body font, and the rest of the palette (shades, translucent tones,
dark-mode inversion) is derived from those.

Typography: Bricolage Grotesque for display, Space Grotesk for body, JetBrains
Mono for the labels and diagrams, Caveat for the handwritten scribbles.

Recurring devices: numbered project cards, `//` monospace kickers, sticky-note
pull quotes, `→`-chained core-loop diagrams, award rows with medal glyphs, and a
crosshair cursor that tracks the pointer.

## 7. Media

21 files, ~2.8 MB total. Each project carries a card image, a hero, and two
gallery images; Block City and Healthy Jeart also carry diagram images used by
their dev-log entries. Site-level assets are the About photo and the CV PDF.

Nothing is embedded in the markup — images are real files under `assets/`, so a
visitor only downloads what the page they opened actually shows. One deliberate
format rule: **no animated GIFs**, animated WebP instead (the Healthy Jeart
gallery clip went from 1.5 MB to 68% smaller and cleaner in the swap).

## 8. Gaps in the content, as of this commit

Recorded rather than fixed — page content is machine-written and only the
in-page editor may change it (rule R1).

- **Two of four dev logs are empty**, as above.
- **The About bio repeats itself.** The first and second paragraphs are
  byte-identical, and the third paragraph repeats the pull quote directly above
  it — placeholder text that was never replaced. Only the fourth paragraph (the
  mechanic-design / educational-games one) is unique.
- **The contact status line holds the wrong value.** The field beside the green
  status dot is designed for an availability message ("Available for projects")
  and currently reads "Pilar Martín-Peña Rojo".
- **The footer reads "This website has used AI to a small extent."** Accurate and
  deliberate as a disclosure, worth a decision about whether it belongs in the
  footer of a job-application site.
- **The Hot Potato card claims one award; the case study lists three.** The card
  excerpt names only the Audience Award.
- **A typo in the hero tagline** — "inmerses" for "immerses".
- **`README.md` and `SPEC.md` describe an older site.** README names five theme
  presets that no longer exist (Soft Latte, Warm Cabin, Forest Dusk, Ghibli
  Pastel, Original Dark) against the six that do; SPEC.md still describes a
  single-file site with a Twitter contact channel, where the live site has four
  pages and Discord.
