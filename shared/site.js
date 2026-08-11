/* ═══════════════════════════════════════════════════════════════════
   Shared behaviour for every page of the portfolio.

   Each page declares its own context inline before loading this file:
     window.PAGE = { role:'home',    path:'index.html',               base:''   }
     window.PAGE = { role:'project', path:'projects/hot-potato.html', base:'../',
                     id:'hot-potato', name:'Hot Potato', next:'block-city' }

   `base` prefixes every asset URL so the same code works from / and
   from /projects/. Paths stored in localStorage and in the dev log are
   always repo-relative ("assets/…") — that is what gets committed.
   ═══════════════════════════════════════════════════════════════════ */
const PAGE = Object.assign({ role:'home', path:'index.html', base:'', id:null, name:'' }, window.PAGE || {});
const IS_PROJECT = PAGE.role === 'project';

/* repo-relative path → URL usable from this page */
const asset = p => (p && !/^(?:[a-z]+:|\/|#)/i.test(p)) ? PAGE.base + p : p;
const projectHref = id => PAGE.base + 'projects/' + id + '.html';

/* A stored image may be a legacy data: URL or an assets/ path. */
const storedSrc = v => !v ? '' : (v.startsWith('data:') ? v : (MEDIA_CACHE[v] || asset(v)));

/* ─── DIAGNOSTICS ──────────────────────────
   This file is one flat script wired to the markup by name, so nothing
   reports a throw: a bad handler leaves the button doing nothing, and a
   failed save looks exactly like a successful one. Both are logged here.

   Visitors get silence on purpose — they can't act on it, and the toast
   host only exists while editing. dlToast is hoisted, so calling it from
   here is fine even though it is declared much further down. */
function reportError(what, err) {
  console.error('[portfolio] ' + what + ':', err);
  if (document.body && document.body.classList.contains('editing')) {
    dlToast('⚠ ' + what);
  }
}

/* Every localStorage write goes through this. The quota is small, images
   are not, and each of these call sites used to swallow the failure. */
function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) {
    reportError('Could not save — browser storage is full. Publish to free space.', e);
    return false;
  }
}

window.addEventListener('error', e => reportError('Script error', e.error || e.message));
window.addEventListener('unhandledrejection', e => reportError('Unhandled promise rejection', e.reason));

/* ─── LAYOUT METRICS ───────────────────────
   Single source of truth is --nav-h in portfolio.css, so the header
   height and every scroll offset that depends on it can't drift apart. */
const navH = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 56;

/* Media queries the script needs to agree with. Keep in step with the
   RESPONSIVE block in portfolio.css. */
const MQ_PHONE = matchMedia('(max-width:620px)');
const MQ_STACK = matchMedia('(max-width:900px)');
const MQ_FINE  = matchMedia('(hover:hover) and (pointer:fine)');

/* ─── SCROLL LOCK ──────────────────────────
   The lightbox, the dev-log editor and the mobile menu can all be open
   over the page. Counted, so whichever closes first doesn't hand scroll
   back while another is still up. */
let scrollLocks = 0;
function lockScroll()   { if (++scrollLocks === 1) document.body.style.overflow = 'hidden'; }
function unlockScroll() { if (scrollLocks > 0 && --scrollLocks === 0) document.body.style.overflow = ''; }

/* ─── CURSOR ─────────────────────────────
   Pointer-driven, so it's skipped entirely on touch — otherwise the move
   handler runs forever on a phone positioning an element nobody sees.
   The crosshair is written straight from the event rather than eased
   toward it: the old `cx += (mx-cx)*.17` inside a rAF loop left it a
   handful of frames behind the hand moving it, and since it stands in
   for the system cursor (body { cursor:none }) any gap at all reads as
   the whole page lagging. Matching the pointer exactly is the feature —
   there is nothing to tune here. */
const cur = document.getElementById('cursor');
if (cur && MQ_FINE.matches) {
  document.addEventListener('mousemove', e => { cur.style.left = e.clientX+'px'; cur.style.top = e.clientY+'px'; });
  document.addEventListener('mouseleave', () => cur.classList.add('hidden'));
  document.addEventListener('mouseenter', () => cur.classList.remove('hidden'));
  document.querySelectorAll('a,button,.project,.ch,.skill,.sh-nav-btn,.db-btn').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('big'));
    el.addEventListener('mouseleave', () => cur.classList.remove('big'));
  });
} else if (cur) {
  cur.classList.add('hidden');
}

/* ─── SCROLL ───────────────────────────── */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - navH() - 6;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ─── NAV ──────────────────────────────── */
const nav = document.getElementById('nav');
const heroEl = document.getElementById('hero');
if (heroEl) {
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting), { threshold:.1 }).observe(heroEl);
} else {
  // Project pages have no hero — go solid as soon as the page scrolls.
  const onScroll = () => nav.classList.toggle('solid', window.scrollY > 24);
  addEventListener('scroll', onScroll, { passive:true }); onScroll();
}

/* ─── MOBILE MENU ──────────────────────────
   Markup is static in every page (the publish flow serializes the DOM,
   so injecting it here would bake it in and then duplicate it). This
   only drives state. Null-guarded: the rest of the script must survive
   a page that doesn't have these nodes. */
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('mobile-menu');

function setMenu(open) {
  if (!burger || !mobileMenu) return;
  if (open === mobileMenu.classList.contains('open')) return;
  mobileMenu.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.setAttribute('aria-hidden', String(!open));
  if (open) { lockScroll(); mobileMenu.querySelector('a')?.focus({ preventScroll:true }); }
  else      { unlockScroll(); burger.focus({ preventScroll:true }); }
}
const closeMenu = () => setMenu(false);

if (burger && mobileMenu) {
  burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  // Anchors on project pages navigate away; scrollToSection() links on the
  // home page do not, so the menu has to close itself either way.
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  // Rotating to landscape can cross the breakpoint with the menu still up.
  MQ_PHONE.addEventListener('change', e => { if (!e.matches) closeMenu(); });
}

/* ─── SCROLL REVEAL ────────────────────── */
const revealIO = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); revealIO.unobserve(e.target); }
  }),
  { threshold: .07 }
);
document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

/* ─── PAGE VIEWS ───────────────────────────
   Case studies are their own pages now, so there is no modal. A project
   page shows #case-view, and swaps to #entry-view for one dev-log entry.
   Both states have a real URL.
   ───────────────────────────────────────── */
const caseView  = document.getElementById('case-view');
const entryView = document.getElementById('entry-view');

function showCaseView() {
  if (!caseView) return;
  if (entryView) { entryView.innerHTML = ''; entryView.hidden = true; }
  caseView.hidden = false;
}

function showEntryView(node) {
  if (!entryView) return;
  entryView.innerHTML = '';
  entryView.appendChild(node);
  entryView.hidden = false;
  if (caseView) caseView.hidden = true;
  window.scrollTo({ top: 0 });
}

/* Opening a case study is a navigation now, not a modal. */
function openCase(id) {
  if (IS_PROJECT && id === PAGE.id) { showCaseView(); dlMountLog(); return; }
  location.href = projectHref(id);
}

function closeCase() {
  if (!IS_PROJECT) return;
  showCaseView();
  dlMountLog();
  dlClearHash();
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (entryView && !entryView.hidden) closeCase();
  else if (editing) toggleEdit();
});

/* ─── EDIT MODE ────────────────────────── */
let editing = false, logoClicks = 0, logoTimer = null;
let focusedSectionEl = null;

// Section registry — defines what's in the panel
const SECTIONS = [
  { id:'hero',    icon:'🏠', name:'Hero' },
  { id:'work',    icon:'🎮', name:'Work' },
  { id:'about',   icon:'👤', name:'About' },
  { id:'contact', icon:'✉',  name:'Contact' },
];

/* Alt + three quick clicks on the logo open the editor. The modifier is what
   does the hiding: an unmodified click is never intercepted, so the logo stays
   an ordinary link home and no amount of clicking around finds edit mode.
   It also drops the old gesture's 420ms navigation delay on every logo click.
   Alt+click means "save link target" in some browsers — preventDefault() on
   the modified click suppresses that. */
const navLogo = document.getElementById('nav-logo');

navLogo.addEventListener('click', e => {
  // Plain click navigates; ctrl/cmd still open the link in a new tab.
  if (!e.altKey || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  logoClicks++;
  clearTimeout(logoTimer);
  // Holding shift on the closing click asks for the token instead of opening
  // — the only way in on a browser that has never published from here.
  if (logoClicks >= 3) { logoClicks = 0; e.shiftKey ? edUnlock() : toggleEdit(); return; }
  logoTimer = setTimeout(() => { logoClicks = 0; }, 700);
});

/* ─── THE GATE ─────────────────────────────
   The editor opens only where a GitHub token is already stored, which in
   practice means the author's own browsers. Everywhere else the gesture is
   a dead no-op that says nothing about why.

   Be clear about what this is: `site.js` is served to every visitor, so a
   determined reader can patch this check out in devtools and open the panel.
   What they still cannot do is publish — that is checked by GitHub against
   the token, server-side, and no amount of client-side patching forges it.
   So this gates discovery, not access; the token gates access, and always
   did. Do not let a future change treat edUnlocked() as a security boundary. */
function edUnlocked() {
  try { return !!(localStorage.getItem('pmpr_gh_token') || '').trim(); }
  catch (e) { console.warn('Token store unreadable; editor stays closed.', e); return false; }
}

/* Verify a token can actually write here before accepting it. Wrong or
   expired tokens used to be discovered only by a failed publish, after an
   entry had been written. */
async function edTokenValid(token) {
  try {
    const r = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}`, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' } });
    if (!r.ok) return { ok: false, why: r.status === 401 ? 'GitHub rejected that token.'
                                    : r.status === 404 ? 'That token cannot see this repository.'
                                    : 'GitHub answered ' + r.status + '.' };
    const j = await r.json();
    return j?.permissions?.push ? { ok: true }
         : { ok: false, why: 'That token can read the repository but not write to it.\nIt needs Contents → Read and write.' };
  } catch (e) {
    return { ok: false, why: 'Could not reach GitHub to check the token: ' + e.message };
  }
}

/* Reached only by the shift variant of the gesture, so anyone seeing this
   prompt already knows the way in — telling them why a token failed leaks
   nothing further, and not telling them makes a typo indistinguishable
   from a mis-clicked gesture. */
async function edUnlock() {
  const t = (prompt(
    'Paste your GitHub token to unlock editing on this browser.\n\n' +
    'Fine-grained token, github.com/settings/personal-access-tokens:\n' +
    '  • Repository access → only ' + GH.owner + '/' + GH.repo + '\n' +
    '  • Permissions → Contents → Read and write\n\n' +
    'Stored only in this browser. Never added to your site.'
  ) || '').trim();
  if (!t) return;
  const v = await edTokenValid(t);
  if (!v.ok) { alert('Not unlocked.\n\n' + v.why); return; }
  if (!safeSet('pmpr_gh_token', t)) return;   // safeSet reports its own failure
  toggleEdit();
}

/* The "Open ✏" links hand off to a project page with ?edit=1. That param on
   its own is a plaintext way in for anyone who ever sees the URL, so it only
   counts when this tab set the matching handoff immediately before navigating.
   sessionStorage survives the navigation and is scoped to the one tab. */
const ED_HANDOFF = 'pmpr_ed_handoff';
function edHandoffSet() {
  try { sessionStorage.setItem(ED_HANDOFF, '1'); }
  catch (e) { console.warn('Editor handoff could not be stored; ?edit will be ignored on arrival.', e); }
}
function edHandoffTake() {
  try {
    const ok = sessionStorage.getItem(ED_HANDOFF) === '1';
    sessionStorage.removeItem(ED_HANDOFF);   // one arrival per handoff
    return ok;
  } catch (e) { console.warn('Editor handoff could not be read; staying closed.', e); return false; }
}

/* ─── EDITOR CHROME ────────────────────────
   The panel, the formatting bar, the dev-entry editor and the toast are
   built here on first use rather than shipped in the five HTML files.
   Three reasons, in order of how much they matter:

   1. A published page carries no editor markup at all, so view-source
      shows a portfolio rather than a CMS. It was 44–51% of every file.
   2. One template instead of five copies — the chrome cannot drift
      between pages any more, which is what R5 was written to catch by
      hand. index.html had already lost its #ep-grip that way.
   3. Nothing editor-shaped is in the DOM at publish time, so there is
      no runtime state left to scrub (R4) and none to bake by mistake.

   The cost: #fmt-bar and #de-toast are no longer load-time sentinels, so
   anything reaching for them must tolerate their absence — see fmtBarEl()
   and dlToast(). edChrome() is idempotent, because a page published
   before this change still has the old markup in it. */
const EP_CHROME_IDS = ['edit-panel', 'fmt-bar', 'dev-editor', 'de-toast'];

function epPanelHTML() {
  return `<div id="edit-panel">
  <button class="ep-grip" id="ep-grip" type="button" aria-label="Collapse editor panel" aria-expanded="true"></button>
  <div class="ep-head">
    <span class="ep-head-title">Edit mode</span>
    <button class="ep-exit" onclick="toggleEdit()">✕ Exit</button>
  </div>

  <div class="ep-tabs">
    <button class="ep-tab active" onclick="switchTab('sections',this)">Sections</button>
    <button class="ep-tab" onclick="switchTab('add',this)">+ Add</button>
    <button class="ep-tab" onclick="switchTab('devlog',this)">Dev Log</button>
    <button class="ep-tab" onclick="switchTab('design',this)">Design</button>
  </div>

  <div class="ep-body">
    <!-- SECTIONS TAB -->
    <div class="ep-tab-pane active" id="tab-sections">
      <div id="ep-section-list"></div>
      <div id="ep-fields-area" style="margin-top:.5rem;border-top:1px solid var(--faint);padding-top:.5rem;display:none">
        <div style="font-family:var(--fm);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:.5rem .85rem .35rem">Editable fields</div>
        <div id="ep-field-list" class="ep-fields"></div>
      </div>
    </div>

    <!-- ADD TAB -->
    <div class="ep-tab-pane" id="tab-add">
      <div style="font-family:var(--fm);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:.75rem .25rem .4rem">Work / Projects</div>
      <button class="ep-add-btn" onclick="insertProjectCard()">
        <span class="ep-add-btn-icon">🎮</span>
        <span class="ep-add-btn-label">New project card</span>
      </button>${IS_PROJECT ? '' : `
      <button class="ep-add-btn" onclick="insertProjectCard('ai-projects')">
        <span class="ep-add-btn-icon">🤖</span>
        <span class="ep-add-btn-label">New AI project card</span>
      </button>
      <div style="border-top:1px solid var(--faint);margin:.6rem 0"></div>
      <div style="font-family:var(--fm);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:.25rem .25rem .4rem">About</div>
      <button class="ep-add-btn" onclick="eduAdd()">
        <span class="ep-add-btn-icon">🎓</span>
        <span class="ep-add-btn-label">Education entry</span>
      </button>`}
      <div style="border-top:1px solid var(--faint);margin:.6rem 0"></div>
      <div style="font-family:var(--fm);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:.25rem .25rem .4rem">Content blocks</div>
      <button class="ep-add-btn" onclick="insertTextBlock()">
        <span class="ep-add-btn-icon">📝</span>
        <span class="ep-add-btn-label">Text section</span>
      </button>
      <button class="ep-add-btn" onclick="insertImageBlock()">
        <span class="ep-add-btn-icon">📷</span>
        <span class="ep-add-btn-label">Image block</span>
      </button>
      <button class="ep-add-btn" onclick="insertDividerBlock()">
        <span class="ep-add-btn-icon">—</span>
        <span class="ep-add-btn-label">Divider</span>
      </button>
    </div>

    <!-- DEV LOG TAB -->
    <div class="ep-tab-pane" id="tab-devlog">
      <div class="ep-dsn-label">Project</div>
      <select class="ep-select" id="dl-proj-select" onchange="renderDlEntryList()"></select>
      <div class="ep-note" id="dl-tab-note"></div>

      <div class="ep-dsn-label" style="margin-top:.9rem">Dev entries</div>
      <div id="dl-entry-list"></div>

      <button class="ep-add-btn" onclick="dlAddEntry()">
        <span class="ep-add-btn-icon">✚</span>
        <span class="ep-add-btn-label">New dev entry</span>
      </button>

      <div class="dl-pending" id="dl-pending"></div>

      <div style="border-top:1px solid var(--faint);margin:.8rem 0 .5rem"></div>
      <div style="font-family:var(--fm);font-size:.55rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:0 .25rem .45rem;line-height:1.7">
        Private entries stay in this browser only — back them up.
      </div>
      <button class="ep-add-btn" onclick="dlExportPrivate()">
        <span class="ep-add-btn-icon">⤓</span>
        <span class="ep-add-btn-label">Export private entries</span>
      </button>
      <label class="ep-add-btn" style="cursor:pointer">
        <span class="ep-add-btn-icon">⤒</span>
        <span class="ep-add-btn-label">Restore from backup</span>
        <input type="file" accept="application/json,.json" style="display:none" onchange="dlImportPrivate(this)"/>
      </label>
    </div>

    <!-- DESIGN TAB -->
    <div class="ep-tab-pane" id="tab-design">
      <div class="ep-dsn-label">Theme presets</div>
      <div id="ep-presets" class="ep-presets"></div>
      <div class="ep-dsn-label">Colors — click a swatch</div>
      <div id="ep-colors"></div>
      <div class="ep-dsn-label">Fonts</div>
      <div id="ep-fonts"></div>
      <button class="ep-add-btn" style="justify-content:center;margin-top:.7rem" onclick="resetTheme()">
        <span class="ep-add-btn-label">↺ Reset to default</span>
      </button>
    </div>
  </div>

  <div class="ep-foot">
    <button class="ep-foot-btn ep-foot-save" onclick="saveAndPublish()">💾 Save &amp; publish</button>
    <button class="ep-foot-btn ep-foot-export" onclick="exportHTML()">📥 Export HTML file</button>
  </div>
</div>`;
}

function epFmtBarHTML() {
  return `<div id="fmt-bar">
  <button class="fmt-btn" onclick="fmt('bold')"      title="Bold"><b>B</b></button>
  <button class="fmt-btn" onclick="fmt('italic')"    title="Italic"><i>I</i></button>
  <button class="fmt-btn" onclick="fmt('underline')" title="Underline"><u>U</u></button>
  <div class="fmt-sep"></div>
  <button class="fmt-btn" onclick="fmt('removeFormat')" title="Clear formatting">✕</button>
</div>`;
}

function epDevEditorHTML() {
  return `<div id="dev-editor">
  <div class="de-bar">
    <span class="de-bar-t">Dev entry</span>
    <span class="de-bar-t" id="de-bar-proj" style="color:var(--muted)"></span>
    <span class="de-bar-sp"></span>
    <label class="de-toggle" title="Private entries are never published to the live site">
      <input type="checkbox" id="de-private" onchange="deSetPrivate(this.checked)">
      <span id="de-private-lbl">Public</span>
    </label>
    <button class="de-btn danger" onclick="deDeleteEntry()">🗑 Delete</button>
    <button class="de-btn primary" onclick="deClose()">✓ Done</button>
  </div>

  <div class="de-body">
    <div class="de-inner">

      <!-- ── Header: the three things the log list and the link need.
           Everything else about the entry is a block. ── -->
      <div class="de-sec">
        <div class="de-sec-lbl">Header</div>

        <div class="de-field">
          <label class="de-lbl" for="de-title">Title</label>
          <input class="de-in" id="de-title" oninput="deField('title',this.value)">
          <div class="de-hint">Shown at the top of the entry, and it becomes the link: <code id="de-slug-preview" style="font-family:var(--fm);font-size:.72rem;color:var(--accent)"></code></div>
        </div>

        <div class="de-field">
          <label class="de-lbl" for="de-summary">One-line summary <span class="de-opt">optional</span></label>
          <input class="de-in" id="de-summary" oninput="deField('summary',this.value)">
          <div class="de-hint">Shown under the title in the entry list. Leave it empty and no summary appears.</div>
        </div>

        <div class="de-field">
          <label class="de-lbl" for="de-tools">Tools &amp; tech <span class="de-opt">optional</span></label>
          <input class="de-in mono" id="de-tools" oninput="deField('tools',this.value)">
          <div class="de-hint">Comma separated, listed at the foot of the entry.</div>
        </div>
      </div>

      <!-- ── The entry itself — blocks, in whatever order you want ── -->
      <div class="de-sec">
        <div class="de-sec-lbl">The entry</div>
        <div id="de-blocks"></div>
      </div>

    </div>
  </div>
</div>
<div class="de-toast" id="de-toast"></div>`;
}

/* Build the chrome once, on the first thing that needs it. Returns early
   on an already-built page *and* on a page published before the chrome
   moved into script, so neither ends up with two panels. */
let edChromeBuilt = false;
function edChrome() {
  if (edChromeBuilt) return;
  edChromeBuilt = true;
  if (document.getElementById('edit-panel')) { edWireSheet(); return; }
  const holder = document.createElement('div');
  holder.innerHTML = epPanelHTML() + epFmtBarHTML() + epDevEditorHTML();
  while (holder.firstChild) document.body.appendChild(holder.firstChild);
  edWireSheet();
}

/* ─── EDITOR SHEET (small screens) ─────────
   Below the stack breakpoint #edit-panel is docked to the bottom edge and
   can collapse to a peek, so the page underneath stays visible while you
   edit it. Above that breakpoint it's the usual side drawer and none of
   this applies. */
function setEditorSheet(expanded) {
  document.body.classList.toggle('panel-peek', !expanded);
  const grip = document.getElementById('ep-grip');
  if (grip) {
    grip.setAttribute('aria-expanded', String(expanded));
    grip.setAttribute('aria-label', expanded ? 'Collapse editor panel' : 'Expand editor panel');
  }
}
function toggleEditorSheet() {
  setEditorSheet(document.body.classList.contains('panel-peek'));
}

/* Wired from edChrome(), because the grip does not exist before it. */
function edWireSheet() {
  const grip = document.getElementById('ep-grip');
  if (!grip) return;
  grip.addEventListener('click', toggleEditorSheet);
  // Tapping the header expands too — the grip alone is a small target and
  // the header is the obvious thing to reach for.
  document.querySelector('#edit-panel .ep-head')?.addEventListener('click', e => {
    if (e.target.closest('.ep-exit')) return;
    if (MQ_STACK.matches && document.body.classList.contains('panel-peek')) setEditorSheet(true);
  });
  // Back to the side drawer: the peek state is meaningless there.
  MQ_STACK.addEventListener('change', e => { if (!e.matches) document.body.classList.remove('panel-peek'); });
}

function toggleEdit() {
  // Exported copies ship without the editor panel — don't half-open it.
  if (document.documentElement.dataset.readonly) return;
  // Entering is gated; leaving never is, or a token cleared mid-session
  // would strand the editor open with no way to shut it.
  if (!editing && !edUnlocked()) return;
  // Nothing below this line can assume the panel exists until this runs:
  // published pages carry no editor markup, it is built on first entry.
  edChrome();
  editing = !editing;
  document.body.classList.toggle('editing', editing);
  // On a phone the panel is a bottom sheet. Open it collapsed so the first
  // thing you can do is tap the region you came here to edit.
  if (editing && MQ_STACK.matches) setEditorSheet(false);
  else if (!editing) document.body.classList.remove('panel-peek');

  document.querySelectorAll('[data-ed]').forEach(el => {
    el.contentEditable = editing ? 'true' : 'false';
    if (editing) el.spellcheck = false;
  });

  if (IS_PROJECT) { editing ? enableCaseEditing() : disableCaseEditing(); }

  if (editing) {
    buildSectionList();
    renderDesignTab();
    renderDevlogTab();
  } else {
    // Leaving edit mode with a dev entry open used to strand the overlay on
    // screen and leave body overflow locked to hidden — the page then looked
    // like it had lost its scroll for no visible reason.
    if (document.getElementById('dev-editor')?.classList.contains('open')) deClose();
    // Clear focus
    document.querySelectorAll('.ep-focused-section').forEach(el => el.classList.remove('ep-focused-section'));
    focusedSectionEl = null;
    hideFmtBar();
    autoSave();
  }
}

/* ─── PANEL TABS ───────────────────────── */
function switchTab(name, btn) {
  document.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ep-tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

/* ─── SECTION LIST ─────────────────────── */
let PROJECTS = [
  { id:'hot-potato',   icon:'🥔', name:'Hot Potato' },
  { id:'block-city',   icon:'🏙', name:'Block City' },
  { id:'healthy-jeart',icon:'🤖', name:'Healthy Jeart' },
  { id:'create-your-own-monster', icon:'👾', name:'Create Your Own Monster' },
];

function buildSectionList() {
  const list = document.getElementById('ep-section-list');
  if (!list) return;
  list.innerHTML = '';
  if (IS_PROJECT) return buildProjectSectionList(list);

  // Fixed sections — each expands to show its editable fields
  SECTIONS.forEach(sec => {
    const item = makeSectionItem(sec.id, sec.icon, sec.name, false);
    list.appendChild(item);

    const sub = document.createElement('div');
    sub.id = 'ep-sub-' + sec.id;
    sub.className = 'ep-sub';

    if (sec.id === 'work') {
      PROJECTS.forEach(p => {
        const pi = document.createElement('div');
        pi.className = 'ep-section-item ep-sub-item';
        pi.innerHTML = `<span class="ep-section-icon" style="font-size:.85rem">${p.icon}</span><span class="ep-section-name">${p.name}</span><span class="ep-sub-go">Open ✏</span>`;
        pi.addEventListener('click', () => openCaseEdit(p.id));
        sub.appendChild(pi);
      });
    } else {
      const el = document.getElementById(sec.id);
      if (el) appendFieldItems(sub, el.querySelectorAll('[data-ed]'));
    }
    list.appendChild(sub);
  });

  document.querySelectorAll('.added-block').forEach((block, i) => {
    const id = block.dataset.blockId || ('added-' + i);
    block.dataset.blockId = id;
    const h = block.querySelector('h3');
    const name = h ? (h.textContent.trim().slice(0,22) || 'Custom block') : 'Custom block';
    list.appendChild(makeSectionItem(id, '📝', name, true));
    const sub = document.createElement('div');
    sub.id = 'ep-sub-' + id;
    sub.className = 'ep-sub';
    appendFieldItems(sub, block.querySelectorAll('[data-ed]'));
    list.appendChild(sub);
  });

  const area = document.getElementById('ep-fields-area');
  if (area) area.style.display = 'none';
}

/* On a project page the whole case study is directly editable, so the
   panel is a table of contents rather than a field list. */
function buildProjectSectionList(list) {
  const head = document.createElement('div');
  head.className = 'ep-note';
  head.innerHTML = 'Click any text in the case study to edit it. Use the <strong>Dev Log</strong> tab to write how it was built.';
  list.appendChild(head);

  if (!caseView) return;
  const secs = [...caseView.querySelectorAll('.sh-sec')];
  if (!secs.length) { list.insertAdjacentHTML('beforeend', '<div class="ep-note">No sections on this page.</div>'); return; }

  secs.forEach(sec => {
    const lbl = sec.querySelector('.sh-sec-lbl')?.textContent.trim() || '';
    const h   = sec.querySelector('h3')?.textContent.trim() || lbl || 'Section';
    const item = document.createElement('div');
    item.className = 'ep-section-item';
    item.innerHTML = `<span class="ep-section-icon">§</span><span class="ep-section-name">${h}</span><span class="ep-sub-go">Go</span>`;
    item.addEventListener('click', () => {
      document.querySelectorAll('.ep-focused-section').forEach(x => x.classList.remove('ep-focused-section'));
      sec.classList.add('ep-focused-section');
      sec.scrollIntoView({ behavior:'smooth', block:'center' });
    });
    list.appendChild(item);
  });

  buildAsideList(list);

  const back = document.createElement('div');
  back.className = 'ep-section-item';
  back.innerHTML = '<span class="ep-section-icon">🏠</span><span class="ep-section-name">Back to the landing page</span>';
  back.addEventListener('click', () => { location.href = PAGE.base + 'index.html'; });
  list.appendChild(back);
}

/* The sidebar, as a group in the Sections tab: one row per widget with the
   same reorder arrows the landing page's sections use, then the buttons
   that add a new one. */
function buildAsideList(list) {
  const aside = asideEl();
  if (!aside) return;

  const head = document.createElement('div');
  head.className = 'ep-dsn-label';
  head.textContent = 'Sidebar';
  list.appendChild(head);

  const widgets = [...aside.querySelectorAll('.sh-widget')];
  if (!widgets.length) {
    list.insertAdjacentHTML('beforeend', '<div class="ep-note">No boxes yet — add one below.</div>');
  }

  widgets.forEach(w => {
    const id = w.dataset.widget;
    const kind = w.querySelector('.sh-tools') ? 'chips' : w.querySelector('.sh-bullets') ? 'bullets' : 'text';
    const name = w.querySelector('.sh-widget-lbl')?.textContent.trim() || WIDGET_KINDS[kind].name;
    const item = document.createElement('div');
    item.className = 'ep-section-item';
    item.innerHTML =
      `<span class="ep-section-icon">${WIDGET_KINDS[kind].icon}</span>` +
      `<span class="ep-section-name">${dlEsc(name)}</span>` +
      `<div class="ep-section-arrows">` +
        `<button class="ep-arr" title="Move up" onclick="moveWidget('${id}',-1,event)">▲</button>` +
        `<button class="ep-arr" title="Move down" onclick="moveWidget('${id}',1,event)">▼</button>` +
      `</div>`;
    item.addEventListener('click', e => {
      if (e.target.closest('.ep-arr')) return;
      if (MQ_STACK.matches) setEditorSheet(false);
      w.scrollIntoView({ behavior:'smooth', block:'center' });
      w.querySelector('.sh-widget-lbl')?.focus();
    });
    list.appendChild(item);
  });

  Object.entries(WIDGET_KINDS).forEach(([kind, spec]) => {
    const btn = document.createElement('button');
    btn.className = 'ep-add-btn';
    btn.innerHTML = `<span class="ep-add-btn-icon">${spec.icon}</span><span class="ep-add-btn-label">Add ${spec.name}</span>`;
    btn.addEventListener('click', () => addWidget(kind));
    list.appendChild(btn);
  });
}

function appendFieldItems(sub, fields) {
  if (!fields.length) {
    sub.insertAdjacentHTML('beforeend', '<div class="ep-note">No editable fields</div>');
    return;
  }
  fields.forEach((f, i) => {
    const label = f.dataset.label || f.dataset.ed || ('Field ' + (i+1));
    const preview = f.textContent.trim().slice(0,28) || '(empty)';
    const fi = document.createElement('div');
    fi.className = 'ep-section-item ep-field-item';
    fi.innerHTML = `
      <span class="ep-dot"></span>
      <div style="flex:1;overflow:hidden">
        <div class="ep-field-lbl">${label}</div>
        <div class="ep-field-prev">${preview}</div>
      </div>
      <span class="ep-sub-go">Edit</span>`;
    fi.addEventListener('click', () => {
      // Get the sheet out of the way first — the point is to see the field.
      if (MQ_STACK.matches) setEditorSheet(false);
      f.focus();
      f.scrollIntoView({ behavior:'smooth', block:'center' });
      f.style.outline = '2px solid var(--accent)';
      setTimeout(() => { f.style.outline = ''; }, 1800);
    });
    sub.appendChild(fi);
  });
}

function makeSectionItem(id, icon, name, deletable) {
  const item = document.createElement('div');
  item.className = 'ep-section-item';
  item.dataset.sectionId = id;

  const chevron = `<span class="ep-chevron" style="font-size:.6rem;color:var(--muted);transition:transform .2s;display:inline-block;margin-left:auto">▾</span>`;
  item.innerHTML = `
    <span class="ep-section-icon">${icon}</span>
    <span class="ep-section-name">${name}</span>
    <div class="ep-section-arrows" style="display:flex;align-items:center;gap:.35rem">
      ${deletable ? `<button class="ep-arr" onclick="deleteAddedBlock('${id}',event)" title="Delete">🗑</button>` : ''}
      ${chevron}
    </div>`;

  item.addEventListener('click', e => {
    if (e.target.closest('.ep-arr')) return;
    toggleSubItems(id, item);
    // Also scroll to section
    const el = document.getElementById(id) || document.querySelector(`[data-block-id="${id}"]`);
    if (el) {
      document.querySelectorAll('.ep-focused-section').forEach(x => x.classList.remove('ep-focused-section'));
      el.classList.add('ep-focused-section');
      if (MQ_STACK.matches) setEditorSheet(false);
      const top = el.getBoundingClientRect().top + window.scrollY - navH() - 24;
      window.scrollTo({ top, behavior:'smooth' });
    }
  });
  return item;
}

function toggleSubItems(id, itemEl) {
  const sub = document.getElementById('ep-sub-' + id);
  if (!sub) return;
  const isOpen = sub.style.display !== 'none';
  // Close all others
  document.querySelectorAll('[id^="ep-sub-"]').forEach(s => { s.style.display = 'none'; });
  document.querySelectorAll('.ep-section-item').forEach(i => {
    i.classList.remove('focused');
    const ch = i.querySelector('.ep-chevron');
    if (ch) ch.style.transform = '';
  });
  if (!isOpen) {
    sub.style.display = 'block';
    itemEl.classList.add('focused');
    const ch = itemEl.querySelector('.ep-chevron');
    if (ch) ch.style.transform = 'rotate(180deg)';
  }
}

/* ─── EDIT A CASE STUDY IN THE MODAL ────── */
function openCaseEdit(id) {
  // Another project's case study lives on another page.
  if (!IS_PROJECT || id !== PAGE.id) { edHandoffSet(); location.href = projectHref(id) + '?edit=1'; return; }
  showCaseView();
  enableCaseEditing();
  caseView.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ─── CASE-STUDY FIELD KEYS ────────────────
   Every editable bit of a case study needs a stable name, so an edit can
   be stored and put back into the page's own markup rather than replacing
   the page with a stored copy of itself. The key is a path — which region,
   which section, which element — derived from position in the file, so it
   survives text edits and reappears identically on the next load.

   `.sh-aside` is its own region: the sidebar can be added to and pruned,
   so its widgets are keyed by their own id rather than by position. */
const CS_EDITABLE = 'h2,h3,p,li,.sh-pull,.sh-widget-lbl,.sh-tool';

function csFieldKey(el) {
  const widget = el.closest('.sh-widget');
  if (widget) {
    const wid = widget.dataset.widget || 'w0';
    const peers = [...widget.querySelectorAll(CS_EDITABLE)];
    return `aside/${wid}/${peers.indexOf(el)}`;
  }
  const sec = el.closest('.sh-sec');
  if (sec) {
    const secs = [...caseView.querySelectorAll('.sh-sec')];
    const peers = [...sec.querySelectorAll(CS_EDITABLE)];
    return `sec${secs.indexOf(sec)}/${peers.indexOf(el)}`;
  }
  const loose = [...caseView.querySelectorAll(CS_EDITABLE)]
    .filter(n => !n.closest('.sh-sec') && !n.closest('.sh-widget'));
  return `page/${loose.indexOf(el)}`;
}

/* Widgets need an id before anything can be keyed against them. Authored
   ones get a positional id on first load; once the page is published the
   attribute is in the file, so it never moves again. */
function ensureWidgetIds() {
  if (!caseView) return;
  caseView.querySelectorAll('.sh-widget').forEach((w, i) => {
    if (!w.dataset.widget) w.dataset.widget = 'w' + i;
  });
}

/* Everything the editor owns on a case-study page. */
function csFields() {
  if (!caseView) return [];
  return [...caseView.querySelectorAll(CS_EDITABLE)]
    .filter(el => !el.closest('.sh-facts') && !el.closest('.sh-nav') && !el.closest('#dl-wrap'));
}

/* Make the case-study prose directly editable. */
function enableCaseEditing() {
  if (!caseView || caseView.dataset.editable) return;
  caseView.dataset.editable = '1';
  ensureWidgetIds();
  decorateWidgets();

  /* The dashed outline and focus highlight are pure CSS —
     `body.editing #case-view [contenteditable="true"]` in portfolio.css.
     They used to be written here as inline styles, which is how a set of
     them got serialized into a published page and shipped dashed boxes
     to visitors. Styling that only ever lives in a stylesheet can't leak
     that way. */
  csFields().forEach(el => {
    el.contentEditable = 'true';
    el.spellcheck = false;
    el.addEventListener('blur', () => {
      markBlankFields();
      saveCaseStudy(PAGE.id);
    });
    if (el.dataset.ph) el.addEventListener('input', markBlankFields);
  });

  if (!document.getElementById('cs-edit-notice')) {
    const notice = document.createElement('div');
    notice.id = 'cs-edit-notice';
    notice.innerHTML = '<span></span> Editing — click any text to change it';
    caseView.insertBefore(notice, caseView.firstChild);
  }
}

/* ─── SIDEBAR WIDGETS ──────────────────────
   The boxes down the right of a case study. Three shapes cover every one
   in use: chips (Tools & Tech), bullets (Role breakdown) and text
   (Studio). Built the same way as the landing page's custom project
   cards — make the node, then autoSave() and rebuild the panel list. */
const WIDGET_KINDS = {
  chips:   { icon:'🏷', name:'Tool chips',  body:'<div class="sh-tools"><span class="sh-tool" data-ph="Tool"></span></div>' },
  bullets: { icon:'▹', name:'Bullet list', body:'<ul class="sh-bullets"><li data-ph="Point"></li></ul>' },
  text:    { icon:'¶', name:'Text',        body:'<p data-ph="Write something…"></p>' },
};

function asideEl() { return caseView?.querySelector('.sh-aside') || null; }

/* Mark the sidebar as user-modified. Until this happens its markup is
   never stored, so an untouched page always takes its widgets from the
   file — see saveCaseStudy(). */
function touchAside() {
  const a = asideEl();
  if (a) a.dataset.touched = '1';
}

function widgetUid() { return 'w-' + Date.now().toString(36) + Math.floor(Math.random()*1296).toString(36); }

function addWidget(kind) {
  const aside = asideEl();
  const spec = WIDGET_KINDS[kind];
  if (!aside || !spec) return;
  const id = widgetUid();
  const w = document.createElement('div');
  w.className = 'sh-widget';
  w.dataset.widget = id;
  w.dataset.kind = kind;
  w.innerHTML = `<div class="sh-widget-lbl" data-ph="Heading"></div>${spec.body}`;
  aside.appendChild(w);
  touchAside();
  refreshCaseEditing();
  w.scrollIntoView({ behavior:'smooth', block:'center' });
  w.querySelector('.sh-widget-lbl')?.focus();
}

function deleteWidget(id, e) {
  e?.preventDefault(); e?.stopPropagation();
  const w = caseView?.querySelector(`.sh-widget[data-widget="${id}"]`);
  if (!w) return;
  w.remove();
  touchAside();
  refreshCaseEditing();
}

function moveWidget(id, dir, e) {
  e?.preventDefault(); e?.stopPropagation();
  const w = caseView?.querySelector(`.sh-widget[data-widget="${id}"]`);
  if (!w) return;
  const sib = dir < 0 ? w.previousElementSibling : w.nextElementSibling;
  if (!sib) return;
  dir < 0 ? w.parentNode.insertBefore(w, sib) : w.parentNode.insertBefore(sib, w);
  touchAside();
  refreshCaseEditing();
}

/* Items inside a widget — a chip or a bullet. */
function addWidgetItem(id, e) {
  e?.preventDefault(); e?.stopPropagation();
  const w = caseView?.querySelector(`.sh-widget[data-widget="${id}"]`);
  if (!w) return;
  const chips = w.querySelector('.sh-tools');
  const list  = w.querySelector('.sh-bullets');
  let item;
  if (chips)      { item = document.createElement('span'); item.className = 'sh-tool'; item.dataset.ph = 'Tool';  chips.appendChild(item); }
  else if (list)  { item = document.createElement('li');   item.dataset.ph = 'Point'; list.appendChild(item); }
  else return;
  touchAside();
  refreshCaseEditing();
  item.focus();
}

function removeWidgetItem(el, e) {
  e?.preventDefault(); e?.stopPropagation();
  const item = el.closest('.sh-tool, .sh-bullets li');
  if (!item) return;
  item.remove();
  touchAside();
  refreshCaseEditing();
}

/* Re-arm editing after the sidebar's shape changes, then persist. New
   nodes need their contentEditable and handlers; the panel needs to list
   them. Cheapest correct approach is to tear down and rebuild. */
function refreshCaseEditing() {
  if (!caseView) return;
  const wasEditing = !!caseView.dataset.editable;
  if (wasEditing) { disableCaseEditing(); enableCaseEditing(); }
  ensureWidgetIds();
  saveCaseStudy(PAGE.id);
  buildSectionList();
}

/* In-page controls, added only while editing and stripped on the way out
   so they can never be serialized into a published page. */
function decorateWidgets() {
  const aside = asideEl();
  if (!aside) return;
  aside.querySelectorAll('.sh-widget').forEach(w => {
    const id = w.dataset.widget;
    if (!w.querySelector('.sh-widget-tools')) {
      const tools = document.createElement('div');
      tools.className = 'sh-widget-tools';
      tools.innerHTML =
        `<button type="button" title="Move up" onclick="moveWidget('${id}',-1,event)">↑</button>` +
        `<button type="button" title="Move down" onclick="moveWidget('${id}',1,event)">↓</button>` +
        `<button type="button" title="Delete this box" onclick="deleteWidget('${id}',event)">🗑</button>`;
      w.appendChild(tools);
    }
    // A chip or bullet list gets an "add" affordance and a remove per item.
    const host = w.querySelector('.sh-tools, .sh-bullets');
    if (host && !w.querySelector('.sh-item-add')) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'sh-item-add';
      add.textContent = '+';
      add.title = 'Add one';
      add.setAttribute('onclick', `addWidgetItem('${id}',event)`);
      host.appendChild(add);
    }
    w.querySelectorAll('.sh-tool, .sh-bullets li').forEach(item => {
      if (item.querySelector('.sh-item-del')) return;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'sh-item-del';
      del.textContent = '×';
      del.title = 'Remove';
      // The item itself is contenteditable — without this the button
      // becomes typeable text inside it.
      del.contentEditable = 'false';
      del.setAttribute('onclick', 'removeWidgetItem(this,event)');
      item.appendChild(del);
    });
  });
  markBlankFields();
}

function stripWidgetControls(root) {
  const host = root || caseView;
  host?.querySelectorAll('.sh-widget-tools,.sh-item-add,.sh-item-del').forEach(n => n.remove());
  host?.querySelectorAll('.is-blank').forEach(n => n.classList.remove('is-blank'));
}

/* Flag the fields with no text so CSS can show their placeholder. A chip
   or bullet always contains its remove button, so :empty never matches —
   this reads the text instead. */
function markBlankFields() {
  const aside = asideEl();
  if (!aside) return;
  aside.querySelectorAll('[data-ph]').forEach(el => {
    // textContent would count the injected × as content, so every chip
    // would look non-empty. Read only what the user actually typed.
    const typed = [...el.childNodes]
      .filter(n => !(n.nodeType === 1 && n.classList?.contains('sh-item-del')))
      .map(n => n.textContent)
      .join('')
      .trim();
    el.classList.toggle('is-blank', !typed);
  });
}

function disableCaseEditing() {
  if (!caseView) return;
  delete caseView.dataset.editable;
  document.getElementById('cs-edit-notice')?.remove();
  stripWidgetControls();
  caseView.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.style.outline = ''; el.style.background = ''; el.style.cursor = '';
  });
}

/* Store what was edited, keyed by field — NOT the whole of #case-view.
   Snapshotting the subtree is what silently deleted Block City's sidebar:
   the page rebuilt itself from a stored copy taken before the sidebar
   existed, then published that copy over the real file. Structure now
   always comes from the markup; only text comes from here. */
function saveCaseStudy(id) {
  if (!caseView) return;
  const data = {};
  csFields().forEach(el => { data[csFieldKey(el)] = fieldHTML(el); });

  // The sidebar is the one place the user builds structure rather than
  // just editing it, so its markup is stored — but only once it has
  // actually been touched. Otherwise an untouched page would save an
  // empty aside over a perfectly good one, which is the original bug.
  const aside = caseView.querySelector('.sh-aside');
  if (aside && aside.dataset.touched) data.__widgets__ = cleanAsideHTML(aside);

  data.__savedAt__ = Date.now();        // so a later publish can outrank it
  safeSet('pmpr_cs_fields_' + id, JSON.stringify(data));
}

/* A field's value without any edit-mode controls that sit inside it —
   the per-item × lives inside the chip or bullet it removes. */
function fieldHTML(el) {
  if (!el.querySelector('.sh-item-del')) return el.innerHTML;
  const c = el.cloneNode(true);
  c.querySelectorAll('.sh-item-del').forEach(n => n.remove());
  return c.innerHTML;
}

/* Strip edit-mode residue so nothing transient is persisted or published. */
function cleanAsideHTML(aside) {
  const clone = aside.cloneNode(true);
  clone.querySelectorAll('.sh-widget-tools,.sh-item-del,.sh-item-add').forEach(n => n.remove());
  clone.querySelectorAll('.is-blank').forEach(el => {
    el.classList.remove('is-blank');
    if (!el.className) el.removeAttribute('class');
  });
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.style.outline = ''; el.style.background = ''; el.style.cursor = '';
    if (!el.getAttribute('style')) el.removeAttribute('style');
  });
  return clone.innerHTML;
}

function loadSavedCaseContent(id) {
  try {
    const raw = localStorage.getItem('pmpr_cs_fields_' + id);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return migrateCaseSnapshot(id);
}

/* Older builds stored #case-view's entire innerHTML under
   pmpr_cs_content_<id>. Convert one to the keyed format instead of
   discarding it, so edits that were never published aren't lost. The old
   copy's *structure* is thrown away deliberately — that's the fix. */
function migrateCaseSnapshot(id) {
  let html = null;
  try { html = localStorage.getItem('pmpr_cs_content_' + id); } catch (e) {}
  if (!html || !caseView) return null;

  const old = document.createElement('div');
  old.innerHTML = html;
  const pick = root => [...root.querySelectorAll(CS_EDITABLE)]
    .filter(el => !el.closest('.sh-facts') && !el.closest('.sh-nav') && !el.closest('#dl-wrap'));

  // Walk the snapshot and the live page in parallel. Where the snapshot is
  // missing a region the file has (Block City's sidebar), there is simply
  // nothing to copy and the file's own markup stands.
  const data = {};
  const liveSecs = [...caseView.querySelectorAll('.sh-sec')];
  const oldSecs  = [...old.querySelectorAll('.sh-sec')];
  liveSecs.forEach((sec, i) => {
    if (!oldSecs[i]) return;
    const oldEls = [...oldSecs[i].querySelectorAll(CS_EDITABLE)];
    [...sec.querySelectorAll(CS_EDITABLE)].forEach((el, j) => {
      if (oldEls[j]) data[`sec${i}/${j}`] = oldEls[j].innerHTML;
    });
  });
  const oldLoose = pick(old).filter(n => !n.closest('.sh-sec') && !n.closest('.sh-widget'));
  oldLoose.forEach((el, i) => { data[`page/${i}`] = el.innerHTML; });

  // Drop the superseded blob only if the new one actually stored.
  if (safeSet('pmpr_cs_fields_' + id, JSON.stringify(data))) {
    localStorage.removeItem('pmpr_cs_content_' + id);
  }
  return data;
}

function deleteAddedBlock(id, e) {
  e.stopPropagation();
  const block = document.querySelector(`[data-block-id="${id}"]`);
  if (block) { block.remove(); autoSave(); buildSectionList(); }
}

/* ─── FORMATTING TOOLBAR ───────────────── */
/* Looked up on each use, not captured at load: the bar is built by
   edChrome() and simply does not exist on a page nobody has edited.
   Both callers below run only while editing, but hideFmtBar() is also
   reached from toggleEdit()'s exit path, so the null guard is real. */
function fmtBarEl() { return document.getElementById('fmt-bar'); }

function fmt(cmd) { document.execCommand(cmd, false, null); }

function showFmtBar(x, y) {
  const bar = fmtBarEl();
  if (!bar) return;
  /* On a phone the bar is docked to the bottom edge by CSS — free
     positioning there would push it off-screen at narrow widths. */
  if (!MQ_PHONE.matches) {
    const w = bar.offsetWidth || 200;
    bar.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + 'px';
    bar.style.top  = Math.max(8, y - 48) + 'px';
  }
  bar.classList.add('show');
}
function hideFmtBar() { fmtBarEl()?.classList.remove('show'); }

document.addEventListener('mouseup', e => {
  if (!editing) return;
  if (e.target.closest('#fmt-bar')) return;
  setTimeout(() => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0 && e.target.closest('[data-ed],[data-rich]')) {
      showFmtBar(e.clientX, e.clientY);
    } else {
      hideFmtBar();
    }
  }, 10);
});
document.addEventListener('mousedown', e => {
  if (!e.target.closest('#fmt-bar')) hideFmtBar();
});

/* ─── ADD BLOCKS ───────────────────────── */
function insertTextBlock() {
  const id = 'added-' + Date.now();
  const block = document.createElement('div');
  block.className = 'added-block';
  block.dataset.blockId = id;
  block.innerHTML = `
    <div class="added-block-wrap">
      <h3 data-ed="${id}-h" data-label="Heading" contenteditable="${editing}" spellcheck="false">New Section</h3>
      <p data-ed="${id}-p1" data-label="Paragraph" contenteditable="${editing}" spellcheck="false">Click to write your content here. Add anything — process notes, descriptions, reflections on a project.</p>
    </div>`;
  document.getElementById('added-blocks').appendChild(block);
  block.querySelector('h3').focus();
  autoSave();
  buildSectionList();
}

function insertImageBlock() {
  const id = 'img-added-' + Date.now();
  const block = document.createElement('div');
  block.className = 'added-block';
  block.dataset.blockId = id;
  block.innerHTML = `
    <div class="added-block-wrap">
      <div class="added-img-wrap" data-img-zone="${id}" style="position:relative;overflow:hidden">
        <div class="added-img-ph">
          <span style="font-size:2rem">📷</span>
          <span style="font-family:var(--fm);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Click the button below to upload</span>
        </div>
        <img id="img-${id}" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0"/>
        <label class="img-upload-btn">📷 Upload image<input type="file" accept="image/*" style="display:none" onchange="handleImgUpload(this,'${id}')"/></label>
      </div>
      <p class="added-img-cap" data-ed="${id}-cap" data-label="Image caption" contenteditable="${editing}" spellcheck="false">Image caption — click to edit</p>
    </div>`;
  document.getElementById('added-blocks').appendChild(block);
  autoSave();
  buildSectionList();
}

function insertDividerBlock() {
  const block = document.createElement('div');
  block.className = 'added-block';
  block.dataset.blockId = 'div-' + Date.now();
  block.style.cssText = 'padding:1.5rem clamp(1.5rem,5vw,3.5rem)';
  block.innerHTML = `<div style="border-top:1px solid var(--faint)"></div>`;
  document.getElementById('added-blocks').appendChild(block);
  autoSave();
  buildSectionList();
}

/* gridId picks which grid the card lands in — 'ai-projects' for the
   Independent AI section, omitted for the main Work grid. Each grid
   numbers its own cards, so both categories start at 01. */
function insertProjectCard(gridId) {
  const grid = (gridId && document.getElementById(gridId)) || document.querySelector('.projects');
  if (!grid) return;
  const n = grid.querySelectorAll('.project').length + 1;
  const id = 'proj-new-' + Date.now();
  const imgId = 'img-' + id;

  const card = document.createElement('a');
  card.href = '#';
  card.className = 'project';
  card.dataset.customCard = id;
  card.innerHTML = `
    <div class="proj-img" data-img-zone="${id}">
      <div class="proj-img ph" style="display:flex;align-items:center;justify-content:center;position:absolute;inset:0;background:var(--bg3)">
        <span style="font-family:var(--fd);font-weight:900;font-size:clamp(7rem,17vw,20rem);color:rgba(255,255,255,.025);letter-spacing:-.05em;user-select:none">0${n}</span>
      </div>
      <img id="${imgId}" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0;filter:brightness(.5) saturate(.7)"/>
      <label class="img-upload-btn">📷 Upload image<input type="file" accept="image/*" style="display:none" onchange="handleImgUpload(this,'${id}')"/></label>
    </div>
    <div class="proj-grad"></div>
    <div class="proj-arrow">↗</div>
    <div class="proj-body">
      <div class="proj-top">
        <span class="proj-num" data-ed="${id}-num" data-label="Project number" contenteditable="${editing}" spellcheck="false">0${n}</span>
        <div class="proj-tags">
          <span class="tag tag-accent" data-ed="${id}-tag1" data-label="Category tag" contenteditable="${editing}" spellcheck="false">Category</span>
          <span class="tag tag-dim"    data-ed="${id}-tag2" data-label="Status tag"   contenteditable="${editing}" spellcheck="false">Status</span>
        </div>
      </div>
      <div class="proj-bottom">
        <div class="proj-role"    data-ed="${id}-role"    data-label="Your role"        contenteditable="${editing}" spellcheck="false">Your Role</div>
        <div class="proj-name"    data-ed="${id}-name"    data-label="Project name"     contenteditable="${editing}" spellcheck="false">Project Title</div>
        <p   class="proj-excerpt" data-ed="${id}-excerpt" data-label="Short description" contenteditable="${editing}" spellcheck="false">Short description of this project — appears on hover.</p>
        <span class="proj-cta">View case study</span>
      </div>
    </div>
    <button class="card-del-btn" onclick="deleteProjectCard('${id}',event)" title="Delete card">🗑</button>`;

  grid.appendChild(card);

  // Register in PROJECTS so it shows in the panel
  PROJECTS.push({ id, icon:'🎮', name:'New Project' });
  autoSave();
  buildSectionList();

  // Scroll to the new card
  card.scrollIntoView({ behavior:'smooth', block:'center' });
}

/* ─── EDUCATION LIST ───────────────────────
   Add, remove and reorder schools. The list is saved as one blob rather
   than field by field, because the number of fields changes — which is
   also why every editable field on this page carries an explicit
   data-ed key now, so inserting an entry can't shift anyone else's.
   ───────────────────────────────────────── */
function eduList() { return document.getElementById('edu-list'); }

function eduItemHTML(key) {
  return `<div class="edu-item" data-edu="${key}">
    <div class="edu-dot"></div>
    <div class="edu-body">
      <div class="edu-name" data-label="School name" data-ed="${key}-name" contenteditable="${editing}" spellcheck="false">School or course</div>
      <div class="edu-sub" data-label="Degree / detail" data-ed="${key}-sub" contenteditable="${editing}" spellcheck="false">Qualification · Place</div>
    </div>
    <span class="edu-ctrl">
      <button onclick="eduMove(this,-1)" title="Move up">↑</button>
      <button onclick="eduMove(this,1)" title="Move down">↓</button>
      <button class="del" onclick="eduDel(this)" title="Remove this entry">🗑</button>
    </span>
  </div>`;
}

function eduAdd() {
  const list = eduList();
  if (!list) return;
  const key = 'edu-' + Date.now().toString(36);
  list.insertAdjacentHTML('beforeend', eduItemHTML(key));
  autoSave();
  buildSectionList();
  const name = list.lastElementChild?.querySelector('.edu-name');
  name?.scrollIntoView({ behavior:'smooth', block:'center' });
  if (editing && name) { name.focus(); document.getSelection()?.selectAllChildren(name); }
}

function eduDel(btn) {
  const item = btn.closest('.edu-item');
  if (!item) return;
  const name = item.querySelector('.edu-name')?.textContent.trim() || 'this entry';
  if (!confirm(`Remove "${name}" from your education?`)) return;
  item.remove();
  autoSave();
  buildSectionList();
}

function eduMove(btn, dir) {
  const item = btn.closest('.edu-item');
  const sib = dir < 0 ? item?.previousElementSibling : item?.nextElementSibling;
  if (!item || !sib) return;
  dir < 0 ? sib.before(item) : sib.after(item);
  autoSave();
  buildSectionList();
}

function deleteProjectCard(id, e) {
  e.preventDefault(); e.stopPropagation();
  const card = document.querySelector(`.project[data-custom-card="${id}"]`);
  if (!card) return;
  card.remove();
  PROJECTS = PROJECTS.filter(p => p.id !== id);
  autoSave();
  buildSectionList();
}

/* ─── IMAGE UPLOADS ────────────────────────
   Uploads become real files under assets/ on the next publish, exactly
   like dev-log media. Nothing is base64'd into the page any more.
   ───────────────────────────────────────── */
function assetUpload(file, dir, base) {
  return new Promise((res, rej) => {
    if (!file) return rej(new Error('no file'));
    if (file.size > 25 * 1024 * 1024) return rej(new Error('That file is over 25 MB — too big for a git repo. Compress it first.'));
    const r = new FileReader();
    r.onload = async () => {
      const path = `${DL_ASSET}/${dir}/${base}-${Date.now().toString(36).slice(-4)}.${dlExt(file.type, file.name)}`;
      MEDIA_CACHE[path] = r.result;
      try { await mediaPut({ path, data: r.result, type: file.type || '', published: false }); } catch (e) {}
      dlUpdatePendingBadge();
      res(path);
    };
    r.onerror = () => rej(new Error('Could not read that file'));
    r.readAsDataURL(file);
  });
}

async function handleCsImg(input, key) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  let path;
  try { path = await assetUpload(file, PAGE.id || 'site', key); }
  catch (e) { return alert(e.message); }
  const src = storedSrc(path);

  const item = input.closest('[data-cs-img]');
  let img = item.querySelector('img');
  if (!img) { img = document.createElement('img'); item.insertBefore(img, item.firstChild); }
  img.src = src;
  item.classList.remove('sh-gal-ph');
  item.querySelector('span')?.remove();

  const gal = item.closest('.sh-gallery');
  if (gal && item === gal.querySelector('.sh-gal-item[data-cs-img]')) {
    const featured = gal.querySelector('.sh-gal-featured');
    let fimg = featured?.querySelector('img');
    if (featured && !fimg) {
      fimg = document.createElement('img');
      featured.classList.remove('sh-gal-ph');
      featured.querySelector('span')?.remove();
      featured.insertBefore(fimg, featured.firstChild);
    }
    if (fimg) fimg.src = src;
  }
  safeSet('pmpr_cs_' + key, path);
  saveCaseStudy(PAGE.id);
}

async function handleImgUpload(input, zoneId) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  let path;
  try { path = await assetUpload(file, 'site', zoneId); }
  catch (e) { return alert(e.message); }

  const img = document.getElementById('img-' + zoneId);
  if (img) { img.src = storedSrc(path); img.style.display = ''; }
  const zone = input.closest('[data-img-zone]');
  if (zone) zone.querySelectorAll('.added-img-ph, .photo-ph').forEach(ph => ph.style.display = 'none');
  if (zoneId === 'about-photo') {
    const ph = document.getElementById('photo-ph');
    if (ph) ph.style.display = 'none';
  }
  safeSet('pmpr_img_' + zoneId, path);
  autoSave();
}

function loadSavedImages() {
  ['proj-1','proj-2','proj-3','proj-4','about-photo'].forEach(zoneId => {
    const saved = localStorage.getItem('pmpr_img_' + zoneId);
    if (!saved) return;
    const img = document.getElementById('img-' + zoneId);
    if (img) { img.src = storedSrc(saved); img.style.display = ''; }
    if (zoneId === 'about-photo') {
      const ph = document.getElementById('photo-ph');
      if (ph) ph.style.display = 'none';
    }
  });
}

/* ─── SAVE / EXPORT ────────────────────── */
function autoSave() {
  if (IS_PROJECT) { saveCaseStudy(PAGE.id); dlSave(); return; }

  const data = {};
  document.querySelectorAll('[data-ed]').forEach((el, i) => {
    const key = el.dataset.ed || 'field_' + i;
    data[key] = el.innerHTML;
  });
  data['__added__'] = document.getElementById('added-blocks')?.innerHTML || '';
  data['__edu__'] = eduList()?.innerHTML || '';
  const customCards = [...document.querySelectorAll('.project[data-custom-card]')];
  // Which grid a card sits in is read back off the DOM rather than stored on
  // the card, so a card dragged between categories saves where it actually is.
  data['__custom_cards__'] = customCards.map(c => ({ id: c.dataset.customCard, grid: c.closest('.projects')?.id || '', html: c.outerHTML }));
  data['__savedAt__'] = Date.now();     // so a later publish can outrank it
  safeSet('pmpr_portfolio_v2', JSON.stringify(data));
  dlSave();
}

/* ─── LOCAL DRAFTS vs PUBLISHED ────────────
   Edits live in this browser until you publish. That's the point — but
   it means a browser can hold a draft that the live file has since moved
   past, because someone published from somewhere else. Replaying that
   draft made the newer content look like it never arrived.

   buildPublishHTML() stamps <html data-pub>. A draft is stale when the
   file was published after the draft was last touched; a stale draft is
   set aside rather than applied, and never silently discarded. */
function publishedAt() { return parseInt(document.documentElement.dataset.pub, 10) || 0; }

function draftIsStale(data) {
  const savedAt = data && data.__savedAt__;
  if (!savedAt) return false;          // pre-dates stamping — leave it alone
  return publishedAt() > savedAt;
}

/* Park it under its own key so nothing is lost, and say so. */
function parkStaleDraft(key, data) {
  // Never remove the live copy unless the parked copy is safely written — on
  // a full quota this used to delete the only copy of the draft that existed.
  if (safeSet(key + '__stale', JSON.stringify(data))) localStorage.removeItem(key);
  showDraftNotice(key);
}

function showDraftNotice(key) {
  if (document.getElementById('draft-notice')) return;
  const when = new Date(publishedAt()).toLocaleString();
  const bar = document.createElement('div');
  bar.id = 'draft-notice';
  bar.innerHTML =
    `<span>This browser had older unpublished edits. Showing the version published ${when} instead.</span>` +
    `<button type="button" id="draft-restore">Use my edits</button>` +
    `<button type="button" id="draft-dismiss">Dismiss</button>`;
  document.body.appendChild(bar);
  bar.querySelector('#draft-dismiss').onclick = () => bar.remove();
  bar.querySelector('#draft-restore').onclick = () => {
    try {
      const d = localStorage.getItem(key + '__stale');
      if (d) {
        // Choosing the draft is asserting it as current — otherwise it's
        // still older than the page stamp and gets parked again on reload,
        // and the button does nothing forever.
        const data = JSON.parse(d);
        data.__savedAt__ = Date.now();
        if (safeSet(key, JSON.stringify(data))) localStorage.removeItem(key + '__stale');
      }
    } catch (e) { reportError('Could not restore the parked draft', e); }
    location.reload();
  };
}

function loadSaved() {
  if (IS_PROJECT) {
    const saved = loadSavedCaseContent(PAGE.id);
    if (!saved || !caseView) return;
    if (draftIsStale(saved)) { parkStaleDraft('pmpr_cs_fields_' + PAGE.id, saved); return; }
    // Restore the sidebar's own structure first, so the fields inside it
    // exist before their text is put back.
    const aside = caseView.querySelector('.sh-aside');
    if (aside && saved.__widgets__ !== undefined) {
      aside.innerHTML = saved.__widgets__;
      aside.dataset.touched = '1';
    }
    // Text only. The page keeps the structure its own markup describes —
    // that is what stops a stale copy erasing part of the page.
    csFields().forEach(el => {
      const v = saved[csFieldKey(el)];
      if (v !== undefined) el.innerHTML = v;
    });
    return;
  }
  try {
    const raw = localStorage.getItem('pmpr_portfolio_v2');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (draftIsStale(data)) { parkStaleDraft('pmpr_portfolio_v2', data); return; }

    // Fields used to be keyed by their position in the document, which broke
    // the moment one was added or removed. They have names now; carry the old
    // positional values across once, while the document still matches the
    // order they were saved in.
    if (!data.__keyed__) {
      document.querySelectorAll('[data-ed]').forEach((el, i) => {
        const k = el.dataset.ed;
        if (k && data[k] === undefined && data['field_' + i] !== undefined) data[k] = data['field_' + i];
      });
      data.__keyed__ = 1;
      safeSet('pmpr_portfolio_v2', JSON.stringify(data));
    }

    // The education list is restored whole — its entries are added and
    // removed, so it can't be put back field by field.
    const edu = eduList();
    if (edu && data['__edu__']) {
      edu.innerHTML = data['__edu__'];
      edu.querySelectorAll('[data-ed]').forEach(el => { el.contentEditable = String(!!editing); });
    }

    document.querySelectorAll('[data-ed]').forEach((el, i) => {
      const key = el.dataset.ed || 'field_' + i;
      if (data[key] !== undefined) el.innerHTML = data[key];
    });
    const added = document.getElementById('added-blocks');
    if (added && data['__added__']) added.innerHTML = data['__added__'];
    if (data['__custom_cards__'] && data['__custom_cards__'].length) {
      const mainGrid = document.querySelector('.projects');
      data['__custom_cards__'].forEach(c => {
        if (document.querySelector(`.project[data-custom-card="${c.id}"]`)) return;
        // Cards saved before the AI section existed carry no grid, and a named
        // grid can go missing if a page drops the section — both fall back to
        // the main Work grid rather than stranding the card off-page.
        const grid = (c.grid && document.getElementById(c.grid)) || mainGrid;
        const tmp = document.createElement('div');
        tmp.innerHTML = c.html;
        const card = tmp.firstElementChild;
        if (card && grid) {
          grid.appendChild(card);
          PROJECTS.push({ id: c.id, icon:'🎮', name: card.querySelector('.proj-name')?.textContent?.trim() || 'Project' });
        }
      });
    }
  } catch (e) {}
}

function manualSave() {
  autoSave();
  const btn = document.querySelector('.ep-foot-save');
  if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => btn.textContent = '💾 Save to browser', 2000); }
}

/* A standalone, read-only copy of the site: one file you can email, hand
   to a studio on a USB stick, or open offline. Unlike publishing — which
   writes media to assets/ as real files — the export embeds every image
   so nothing depends on the repo being there. That makes it a big file;
   that's the trade for it working anywhere. */
async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.text();
}

async function fetchDataURL(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  const blob = await r.blob();
  return new Promise((ok, no) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result);
    fr.onerror = () => no(new Error('read failed: ' + url));
    fr.readAsDataURL(blob);
  });
}

/* Pull the shared stylesheet, the shared script and every local asset
   into the markup, so the result is one file that needs nothing else. */
async function buildExportHTML() {
  const doc = new DOMParser().parseFromString(
    buildPublishHTML({ forExport: true, devlogData: await dlExportData() }), 'text/html');

  // Both sheets, in order — theme.css after portfolio.css, because it
  // wins on source order alone. Swap them and the export loses its colours.
  // *= not $= — a published page's links carry a ?v= cache-buster, so an
  // "ends with" match would find nothing and the export would ship naked.
  for (const name of ['portfolio.css', 'theme.css']) {
    const link = doc.querySelector(`link[rel="stylesheet"][href*="${name}"]`);
    if (!link) continue;
    const st = doc.createElement('style');
    st.textContent = await fetchText(asset('shared/' + name));
    link.replaceWith(st);
  }
  const scr = [...doc.querySelectorAll('script[src]')].find(s => /site\.js$/.test(s.getAttribute('src') || ''));
  if (scr) {
    const s2 = doc.createElement('script');
    s2.textContent = await fetchText(asset('shared/site.js'));
    scr.replaceWith(s2);
  }

  const cache = new Map();
  for (const el of doc.querySelectorAll('[src],[href]')) {
    for (const a of ['src', 'href']) {
      const v = el.getAttribute(a);
      if (!v || /^(?:[a-z]+:|#|data:)/i.test(v)) continue;
      if (/(?:^|\/)assets\//.test(v)) {
        if (!cache.has(v)) { try { cache.set(v, await fetchDataURL(v)); } catch (e) { cache.set(v, null); } }
        const d = cache.get(v);
        if (d) el.setAttribute(a, d);
      } else if (/\.html$/.test(v)) {
        // A single exported page can't link to its siblings on disk —
        // point those at the live site instead of leaving them dangling.
        el.setAttribute(a, SITE_URL + v.replace(/^(?:\.\.\/)+/, ''));
      }
    }
  }
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/* A standalone, read-only copy of THIS page: one file you can email or
   hand over on a USB stick. Publishing is the opposite — it writes real
   files to the repo and keeps every page small. */
async function exportHTML() {
  autoSave();
  const btn = document.querySelector('.ep-foot-export');
  const set = t => { if (btn) btn.textContent = t; };
  if (location.protocol === 'file:') {
    alert('Export needs the site served over http.\n\nOpen it from the live URL, or run a local server in this folder:\n  python3 -m http.server');
    return;
  }
  set('⏳ Packing…');
  try {
    const blob = new Blob([await buildExportHTML()], { type:'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (IS_PROJECT ? 'pilar-mpr-' + PAGE.id : 'pilar-mpr-portfolio') + '.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    set('✓ Downloaded');
  } catch (e) {
    alert('Export failed: ' + e.message);
    set('⚠ Retry export');
  }
  setTimeout(() => set('📥 Export this page'), 2600);
}

/* ─── GALLERY + LIGHTBOX CAROUSEL ─────── */
let lbImages = [], lbIndex = 0;

// Called when openCase loads — wire up featured images
function initGalleries() {
  document.querySelectorAll('.sh-gallery').forEach(gal => {
    // Restore saved images into hidden data items
    gal.querySelectorAll('.sh-gal-item[data-cs-img]').forEach(item => {
      const key = item.dataset.csImg;
      const saved = localStorage.getItem('pmpr_cs_' + key);
      if (!saved) return;
      let img = item.querySelector('img');
      if (!img) { img = document.createElement('img'); item.appendChild(img); }
      img.src = saved;
    });

    // Sync first item's saved image to featured slot
    const firstItem = gal.querySelector('.sh-gal-item[data-cs-img]');
    const featured  = gal.querySelector('.sh-gal-featured');
    if (firstItem && featured) {
      const img = firstItem.querySelector('img');
      if (img?.src && !featured.querySelector('img')?.src) {
        let fimg = featured.querySelector('img');
        if (!fimg) { fimg = document.createElement('img'); featured.insertBefore(fimg, featured.firstChild); }
        fimg.src = img.src;
      }
      // Update count hint
      const allItems = gal.querySelectorAll('.sh-gal-item');
      const hint = featured.querySelector('.sh-gal-hint');
      if (hint) hint.textContent = `🖼 ${allItems.length} images — click to view`;
    }
  });
}

function openGallery(featuredEl) {
  const gal = featuredEl.closest('.sh-gallery');
  // Collect images from hidden data items
  const items = [...gal.querySelectorAll('.sh-gal-item[data-cs-img]')];
  lbImages = items.map(item => ({
    src: item.querySelector('img')?.src || '',
    cap: item.dataset.cap || ''
  })).filter(i => i.src);
  if (!lbImages.length) return;
  lbIndex = 0;
  showLbImage();
  document.getElementById('lightbox').classList.add('open');
  lockScroll();
}

function showLbImage() {
  const cur = lbImages[lbIndex];
  const img = document.getElementById('lb-img');
  img.style.animation = 'none';
  img.offsetHeight; // reflow
  img.style.animation = '';
  img.src = cur?.src || '';
  document.getElementById('lb-counter').textContent = `${lbIndex + 1} / ${lbImages.length}`;
  document.getElementById('lb-caption').textContent = cur?.cap || '';
  document.getElementById('lb-prev').style.opacity = lbImages.length < 2 ? '0' : '';
  document.getElementById('lb-next').style.opacity = lbImages.length < 2 ? '0' : '';

  // Dots
  const dotsEl = document.getElementById('lb-dots');
  if (dotsEl.children.length !== lbImages.length) {
    dotsEl.innerHTML = lbImages.map((_, i) =>
      `<button class="lb-dot${i===lbIndex?' active':''}" onclick="lbGoto(${i})"></button>`
    ).join('');
  } else {
    [...dotsEl.children].forEach((d, i) => d.classList.toggle('active', i === lbIndex));
  }
}

function lbNav(dir, e) {
  if (e) e.stopPropagation();
  if (lbImages.length < 2) return;
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  showLbImage();
}
function lbGoto(i) { lbIndex = i; showLbImage(); }

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.closest('#lb-close')) return;
  const lb = document.getElementById('lightbox');
  if (!lb.classList.contains('open')) return;
  lb.classList.remove('open');
  unlockScroll();
}

// Swipe support on lightbox
let lbTx = 0, lbSx = 0;
const lb = document.getElementById('lightbox');
lb.addEventListener('touchstart', e => { lbSx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend',   e => {
  lbTx = e.changedTouches[0].clientX - lbSx;
  if (lbTx < -50) lbNav(1, null);
  else if (lbTx > 50) lbNav(-1, null);
});
// Mouse drag on lightbox
let lbMx = 0, lbDrag = false;
lb.addEventListener('mousedown', e => { if (e.target === lb || e.target.closest('#lb-img-wrap')) { lbMx = e.clientX; lbDrag = true; } });
window.addEventListener('mouseup', e => {
  if (!lbDrag) return; lbDrag = false;
  const dx = e.clientX - lbMx;
  if (dx < -60) lbNav(1, null);
  else if (dx > 60) lbNav(-1, null);
});

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'ArrowRight') lbNav(1, null);
  if (e.key === 'ArrowLeft')  lbNav(-1, null);
  if (e.key === 'Escape') closeLightbox();
});

/* ─── DESIGN / THEME EDITOR ────────────── */
const PRESETS = {
  'Notebook':  { bg:'#f4efe3', text:'#24211b', accent:'#c8402e', blue:'#2f5c8f', yellow:'#f4d24a', green:'#4f7a4a', fd:'Bricolage Grotesque', fb:'Space Grotesk' },
  'Blueprint': { bg:'#e4ecf2', text:'#152435', accent:'#1f6feb', blue:'#16405f', yellow:'#f2c14e', green:'#2f8f6a', fd:'Space Grotesk', fb:'Space Grotesk' },
  'Midnight':  { bg:'#1f1b16', text:'#efe6d4', accent:'#e0553f', blue:'#83a8d8', yellow:'#e6c14a', green:'#7bb06a', fd:'Bricolage Grotesque', fb:'Space Grotesk' },
  'Rosé':      { bg:'#f6ebe6', text:'#2b2320', accent:'#c05678', blue:'#6a7bb0', yellow:'#f0c667', green:'#6a9a72', fd:'Fraunces', fb:'Space Grotesk' },
  'Forest':    { bg:'#eceee2', text:'#20261d', accent:'#b5622e', blue:'#456a58', yellow:'#dabf47', green:'#3f7a4a', fd:'Bricolage Grotesque', fb:'Space Grotesk' },
  'Mono':      { bg:'#eeeae4', text:'#1c1c1c', accent:'#141414', blue:'#3b3b3b', yellow:'#e6e0d0', green:'#4a4a4a', fd:'Archivo Black', fb:'Inter' },
};
const THEME_DEFAULT = Object.assign({}, PRESETS['Notebook']);
const COLOR_ROWS = [
  { key:'bg',     label:'Paper' },
  { key:'text',   label:'Ink / text' },
  { key:'accent', label:'Accent (pen)' },
  { key:'blue',   label:'Blue ink' },
  { key:'yellow', label:'Highlighter' },
  { key:'green',  label:'Approved' },
];
const DISPLAY_FONTS = [
  { n:'Bricolage Grotesque', w:'400;500;700;800' }, { n:'Space Grotesk', w:'400;500;700' },
  { n:'Syne', w:'400;700;800' }, { n:'Unbounded', w:'400;700;900' },
  { n:'Archivo Black', w:'400' }, { n:'Fraunces', w:'400;600;800' },
];
const BODY_FONTS = [
  { n:'Space Grotesk', w:'400;500;700' }, { n:'Inter', w:'400;500;700' },
  { n:'DM Sans', w:'400;500;700' }, { n:'Work Sans', w:'400;500;600' },
];
const _loadedFonts = new Set(['Bricolage Grotesque','Space Grotesk','JetBrains Mono','Caveat']);
function ensureFont(name, weights) {
  if (_loadedFonts.has(name)) return;
  _loadedFonts.add(name);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + name.replace(/ /g,'+') + ':wght@' + (weights||'400;700') + '&display=swap';
  document.head.appendChild(l);
}
/* colour helpers */
function _hex(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}; }
function _toHex(r,g,b){ const t=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); return '#'+t(r)+t(g)+t(b); }
function _mix(a,b,t){ const x=_hex(a),y=_hex(b); return _toHex(x.r+(y.r-x.r)*t, x.g+(y.g-x.g)*t, x.b+(y.b-x.b)*t); }
function _shade(h,amt){ return _mix(h, amt>=0?'#ffffff':'#000000', Math.abs(amt)); }
function _lum(h){ const c=_hex(h); return (0.299*c.r+0.587*c.g+0.114*c.b)/255; }
function _rgba(h,a){ const c=_hex(h); return `rgba(${c.r},${c.g},${c.b},${a})`; }
/* Bare "r,g,b" so a rule can pick its own alpha: rgba(var(--accent-rgb),.3).
   That's how the theme reaches the ~70 shades that used to be literals. */
function _triplet(h){ const c=_hex(h); return `${c.r},${c.g},${c.b}`; }
function computeVars(t){
  const dark = _lum(t.bg) < 0.4;
  const s = dark ? 1 : -1;
  return {
    '--bg': t.bg,
    '--bg2': _shade(t.bg, s*0.05),
    '--bg3': _shade(t.bg, s*0.10),
    '--card-bg': _shade(t.bg, s*0.03),
    '--card-bg2': _shade(t.bg, s*0.07),
    '--text': t.text, '--white': t.text,
    '--muted': _mix(t.text, t.bg, 0.40),
    '--faint': _shade(t.bg, dark ? 0.16 : -0.20),
    '--accent': t.accent, '--accent2': _shade(t.accent, 0.10),
    '--blue': t.blue,
    '--yellow': t.yellow, '--sticky': _shade(t.yellow, 0.08),
    '--green': t.green,
    '--grid': _rgba(t.text, 0.05), '--grid2': _rgba(t.text, 0.085),
    /* Derivation bases. Every translucent shade in portfolio.css mixes
       from one of these, so a theme change reaches the drop shadows,
       label rules and highlighter tints too — not just the solid fills. */
    '--accent-rgb': _triplet(t.accent),
    '--text-rgb':   _triplet(t.text),
    '--yellow-rgb': _triplet(t.yellow),
  };
}
function applyTheme(t){
  const vars = computeVars(t), root = document.documentElement.style;
  for (const k in vars) root.setProperty(k, vars[k]);
  if (t.fd) { ensureFont(t.fd, (DISPLAY_FONTS.find(f=>f.n===t.fd)||{}).w); root.setProperty('--fd', "'"+t.fd+"', sans-serif"); }
  if (t.fb) { ensureFont(t.fb, (BODY_FONTS.find(f=>f.n===t.fb)||{}).w); root.setProperty('--fb', "'"+t.fb+"', sans-serif"); }
}
let currentTheme = Object.assign({}, THEME_DEFAULT);
/* The theme as a stylesheet, for shared/theme.css. Built from the same
   computeVars() applyTheme() uses, so the published file and the live
   preview cannot disagree. */
function themeCSS(t){
  const vars = computeVars(t || currentTheme);
  const lines = Object.keys(vars).map(k => `  ${k}: ${vars[k]};`);
  const th = t || currentTheme;
  if (th.fd) lines.push(`  --fd: '${th.fd}', sans-serif;`);
  if (th.fb) lines.push(`  --fb: '${th.fb}', sans-serif;`);
  return `/* SITE THEME — one file, every page.\n` +
         `   Written by "Save & publish"; change it through the editor's\n` +
         `   Design tab rather than by hand. Loaded after portfolio.css,\n` +
         `   and both declare :root, so that link order is what makes\n` +
         `   these win — keep it. */\n:root {\n${lines.join('\n')}\n}\n`;
}

function saveTheme(){ safeSet('pmpr_theme', JSON.stringify(currentTheme)); }
function loadTheme(){
  try { const raw = localStorage.getItem('pmpr_theme'); if (raw){ currentTheme = Object.assign({}, THEME_DEFAULT, JSON.parse(raw)); applyTheme(currentTheme); } } catch(e){}
}
function _matchesPreset(name){ const p=PRESETS[name]; return COLOR_ROWS.every(r=>(currentTheme[r.key]||'').toLowerCase()===p[r.key].toLowerCase()); }
function renderDesignTab(){
  const pv = document.getElementById('ep-presets');
  if (pv) {
    pv.innerHTML = '';
    Object.keys(PRESETS).forEach(name => {
      const p = PRESETS[name];
      const el = document.createElement('div');
      el.className = 'ep-preset' + (_matchesPreset(name) ? ' active' : '');
      el.innerHTML = `<span class="ep-preset-sw"><i style="background:${p.bg}"></i><i style="background:${p.accent}"></i><i style="background:${p.text}"></i></span><span class="ep-preset-name">${name}</span>`;
      el.onclick = () => applyPreset(name);
      pv.appendChild(el);
    });
  }
  const cv = document.getElementById('ep-colors');
  if (cv) {
    cv.innerHTML = '';
    COLOR_ROWS.forEach(row => {
      const val = currentTheme[row.key] || '#000000';
      const r = document.createElement('div');
      r.className = 'ep-color-row';
      r.innerHTML = `<label>${row.label}</label>
        <span class="ep-swatch"><input type="color" value="${val}" data-ck="${row.key}"></span>
        <input class="ep-hex" value="${val.toUpperCase()}" data-hk="${row.key}" spellcheck="false" maxlength="7">`;
      cv.appendChild(r);
    });
    cv.querySelectorAll('input[type=color]').forEach(inp => inp.addEventListener('input', e => setColor(e.target.dataset.ck, e.target.value)));
    cv.querySelectorAll('.ep-hex').forEach(inp => inp.addEventListener('change', e => {
      let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#'+v;
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) setColor(e.target.dataset.hk, v); else e.target.value = (currentTheme[e.target.dataset.hk]||'').toUpperCase();
    }));
  }
  const fv = document.getElementById('ep-fonts');
  if (fv) {
    const opt = (list, sel) => list.map(f=>`<option value="${f.n}" ${f.n===sel?'selected':''}>${f.n}</option>`).join('');
    fv.innerHTML = `<select class="ep-select" id="ep-fd">${opt(DISPLAY_FONTS, currentTheme.fd)}</select>
                    <select class="ep-select" id="ep-fb">${opt(BODY_FONTS, currentTheme.fb)}</select>`;
    fv.querySelector('#ep-fd').addEventListener('change', e => setFont('fd', e.target.value));
    fv.querySelector('#ep-fb').addEventListener('change', e => setFont('fb', e.target.value));
  }
}
function setColor(key, val){
  currentTheme[key] = val; applyTheme(currentTheme); saveTheme();
  const cv = document.getElementById('ep-colors'); if (!cv) return;
  const c = cv.querySelector(`input[type=color][data-ck="${key}"]`); if (c) c.value = val;
  const h = cv.querySelector(`.ep-hex[data-hk="${key}"]`); if (h) h.value = val.toUpperCase();
  document.querySelectorAll('#ep-presets .ep-preset').forEach((el,i)=>el.classList.toggle('active', _matchesPreset(Object.keys(PRESETS)[i])));
}
function setFont(kind, name){ currentTheme[kind] = name; applyTheme(currentTheme); saveTheme(); }
function applyPreset(name){ currentTheme = Object.assign({}, PRESETS[name]); applyTheme(currentTheme); saveTheme(); renderDesignTab(); }
function resetTheme(){ document.documentElement.removeAttribute('style'); try{ localStorage.removeItem('pmpr_theme'); }catch(e){} currentTheme = Object.assign({}, THEME_DEFAULT); renderDesignTab(); }

/* ─── PUBLISH TO GITHUB ────────────────── */
/* Commits the current page (with your edits baked in) straight to the
   repo via the GitHub API. Your token lives only in this browser's
   localStorage and is never written into the published HTML. */
const GH = { owner:'PilarMPR', repo:'portfolio.github.io', branch:'main', path:'index.html' };
GH.path = PAGE.path;                       // publish the page you're editing
const SITE_URL = `https://${GH.owner.toLowerCase()}.github.io/${GH.repo}/`;

function ghToken(force) {
  let t = localStorage.getItem('pmpr_gh_token');
  if (!t || force) {
    t = prompt(
      'Paste a GitHub token to publish your changes to the live site.\n\n' +
      'Make one (once) at github.com/settings/personal-access-tokens — "Fine-grained":\n' +
      '  • Repository access → only ' + GH.owner + '/' + GH.repo + '\n' +
      '  • Permissions → Contents → Read and write\n\n' +
      'Stored only in this browser. Never added to your site.'
    );
    if (t) { t = t.trim(); safeSet('pmpr_gh_token', t); }
  }
  return t && t.trim();
}

function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
}

/* Serialize the live document with all edits baked in, keeping the
   in-page editor fully working so you can keep editing + re-publishing. */
function buildPublishHTML(opts) {
  const { devlogData, forExport } = opts || {};
  const clone = document.documentElement.cloneNode(true);

  // The editor is built by edChrome() on demand and never authored into a
  // page, so it comes straight back out — which is also why none of its
  // runtime state needs scrubbing any more. Removing the nodes is what
  // keeps a published page free of editor markup; the old approach of
  // wiping their innerHTML left the shells, the drift and the giveaway.
  EP_CHROME_IDS.forEach(id => clone.querySelector('#' + id)?.remove());

  // The dev log is rendered from data on load — baking it in would give
  // the next visit two copies.
  clone.querySelectorAll('#dl-wrap').forEach(n => n.remove());
  clone.querySelector('#cs-edit-notice')?.remove();
  clone.querySelector('#case-view')?.removeAttribute('data-editable');
  // Sidebar edit controls are injected, never authored — they must not
  // reach the published file.
  clone.querySelectorAll('.sh-widget-tools,.sh-item-add,.sh-item-del').forEach(n => n.remove());
  clone.querySelectorAll('.is-blank').forEach(el => {
    el.classList.remove('is-blank');
    if (!el.className) el.removeAttribute('class');
  });
  clone.querySelector('.sh-aside')?.removeAttribute('data-touched');
  const ev = clone.querySelector('#entry-view'); if (ev) { ev.innerHTML = ''; ev.hidden = true; }
  const cv = clone.querySelector('#case-view');  if (cv) cv.hidden = false;

  // Bake the dev log in — public entries only, private ones never leave the browser
  const dlSlot = clone.querySelector('#devlog-data');
  if (dlSlot) dlSlot.textContent = JSON.stringify(devlogData || dlPageData());

  // Neutralize transient edit/UI state (edits themselves stay in the DOM).
  // The editor's own state used to be wiped field by field here — the whole
  // subtree is gone above, so what is left is page state only.
  clone.querySelector('body')?.classList.remove('editing');
  // Page content ships read-only — edit mode turns it back on.
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.setAttribute('contenteditable', 'false');
    // enableCaseEditing() paints dashed outlines and a text cursor onto
    // every editable region. Those are author-only affordances; published
    // once, a visitor sees dashed boxes around all the prose.
    ['outline', 'background', 'cursor', 'borderRadius'].forEach(k => { el.style[k] = ''; });
    if (!el.getAttribute('style')) el.removeAttribute('style');
    el.removeAttribute('spellcheck');
  });

  // The theme lives in shared/theme.css, written by ghPublish(). Leaving
  // applyTheme()'s inline copy on <html> would pin this page to whatever
  // the theme was the day it was published — which is how the site ended
  // up with three different accents. An export has no sibling files, so
  // it keeps its inline theme.
  if (!forExport) clone.removeAttribute('style');

  /* Stamp when this page was published. A browser holding an older local
     draft can then tell that the file has moved on since, instead of
     silently replaying its own copy over it — which is what made edits
     published from one machine look like they never arrived on another.
     The same stamp busts the cache on the shared files, so a stale
     site.js can't keep publishing with last month's behaviour. */
  if (!forExport) {
    const stamp = Date.now();
    clone.dataset.pub = String(stamp);
    clone.querySelectorAll('link[rel="stylesheet"][href*="shared/"], script[src*="shared/"]').forEach(el => {
      const attr = el.tagName === 'LINK' ? 'href' : 'src';
      el.setAttribute(attr, el.getAttribute(attr).split('?')[0] + '?v=' + stamp);
    });
  }
  clone.querySelector('#lightbox')?.classList.remove('open');
  // Transient UI state that would otherwise ship to the live site: an open
  // mobile menu, or an editor sheet left collapsed.
  clone.querySelector('#mobile-menu')?.classList.remove('open');
  clone.querySelector('#mobile-menu')?.setAttribute('aria-hidden', 'true');
  clone.querySelector('#nav-burger')?.setAttribute('aria-expanded', 'false');
  clone.querySelector('#nav-burger')?.setAttribute('aria-label', 'Open menu');
  clone.querySelector('body')?.classList.remove('menu-open', 'panel-peek');
  clone.querySelector('#cs-edit-notice')?.remove();
  clone.querySelectorAll('.ep-focused-section').forEach(el => el.classList.remove('ep-focused-section'));
  const cur = clone.querySelector('#cursor'); if (cur) { cur.className = ''; cur.removeAttribute('style'); }

  /* Export mode: strip the authoring UI for a read-only copy. The chrome
     itself is already gone — every publish drops it now — so what is left
     here is the affordances that live inside page content. Careful still:
     the script captures #cursor, #nav and #lightbox at load with no null
     check, so removing any of those throws and kills the rest of it. */
  if (forExport) {
    clone.dataset.readonly = '1';
    clone.querySelectorAll('.img-upload-btn,.cs-img-btn').forEach(el => el.remove());
    clone.querySelectorAll('[data-img-zone]').forEach(el => el.removeAttribute('data-img-zone'));
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    const b = clone.querySelector('body'); if (b) b.style.marginLeft = '';
  }

  return '<!DOCTYPE html>\n' + clone.outerHTML;
}

/* Commits index.html plus any dev-log media that hasn't been uploaded
   yet — images and clips go in as real files under assets/, not as
   base64 inside the page. One commit, whatever the file count. */
async function ghPublish(token, onStep) {
  const { owner, repo, branch, path } = GH;
  const api = 'https://api.github.com';
  const H = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
  const j = async res => { if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 160)); return res.json(); };
  const step = t => { try { onStep && onStep(t); } catch (e) {} };

  const ref = await j(await fetch(`${api}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers: H }));
  const headSha = ref.object.sha;
  const commit = await j(await fetch(`${api}/repos/${owner}/${repo}/git/commits/${headSha}`, { headers: H }));

  const tree = [];

  // Media first — an image referenced by a page must exist alongside it.
  const pending = await dlPendingMedia();
  const uploaded = [];
  for (let i = 0; i < pending.length; i++) {
    const rec = pending[i];
    step(`⏳ Uploading file ${i + 1}/${pending.length}…`);
    const b64 = String(rec.data || '').split(',')[1];
    if (!b64) continue;
    const blob = await j(await fetch(`${api}/repos/${owner}/${repo}/git/blobs`, { method: 'POST', headers: H,
      body: JSON.stringify({ content: b64, encoding: 'base64' }) }));
    tree.push({ path: rec.path, mode: '100644', type: 'blob', sha: blob.sha });
    uploaded.push(rec.path);
  }

  // The theme is site-wide, so it ships as its own file rather than being
  // stamped into this one page. Publishing any page now recolours the
  // whole site instead of leaving the other four behind.
  step('⏳ Publishing theme…');
  const themeBlob = await j(await fetch(`${api}/repos/${owner}/${repo}/git/blobs`, { method: 'POST', headers: H,
    body: JSON.stringify({ content: utf8ToB64(themeCSS()), encoding: 'base64' }) }));
  tree.push({ path: 'shared/theme.css', mode: '100644', type: 'blob', sha: themeBlob.sha });

  step('⏳ Publishing page…');
  const pageBlob = await j(await fetch(`${api}/repos/${owner}/${repo}/git/blobs`, { method: 'POST', headers: H,
    body: JSON.stringify({ content: utf8ToB64(buildPublishHTML()), encoding: 'base64' }) }));
  tree.push({ path, mode: '100644', type: 'blob', sha: pageBlob.sha });

  const newTree = await j(await fetch(`${api}/repos/${owner}/${repo}/git/trees`, { method: 'POST', headers: H,
    body: JSON.stringify({ base_tree: commit.tree.sha, tree }) }));
  const msg = uploaded.length
    ? `Update portfolio content + ${uploaded.length} media file${uploaded.length > 1 ? 's' : ''} via in-page editor`
    : 'Update portfolio content via in-page editor';
  // The ref was read before the uploads, which take as long as the files are
  // big. If another tab, device or a git push moved the branch since then, this
  // commit's parent is stale: the PATCH below is not a fast-forward and GitHub
  // rejects it with a bare "422", which says nothing about what happened or
  // whether anything was lost. Check first and say it in words.
  step('⏳ Checking for other changes…');
  const nowRef = await j(await fetch(`${api}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers: H }));
  if (nowRef.object.sha !== headSha) {
    throw new Error(
      'The site changed on GitHub while this was publishing — probably another ' +
      'tab, another device, or a push.\n\nNothing was overwritten and your edits ' +
      'are still saved in this browser. Reload the page and publish again.');
  }

  const nc = await j(await fetch(`${api}/repos/${owner}/${repo}/git/commits`, { method: 'POST', headers: H,
    body: JSON.stringify({ message: msg, tree: newTree.sha, parents: [headSha] }) }));
  await j(await fetch(`${api}/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: 'PATCH', headers: H,
    body: JSON.stringify({ sha: nc.sha }) }));

  await dlMarkPublished(uploaded);
  return nc.sha;
}

async function saveAndPublish() {
  autoSave(); // always keep a local copy first
  const btn = document.querySelector('.ep-foot-save');
  const set = t => { if (btn) btn.textContent = t; };
  const token = ghToken(false);
  if (!token) { set('✓ Saved locally'); setTimeout(() => set('💾 Save & publish'), 2200); return; }
  set('⏳ Publishing…');
  try {
    await ghPublish(token, set);
    set('✓ Published! (live in ~1 min)');
  } catch (e) {
    if (/^(401|403)/.test(e.message)) {
      localStorage.removeItem('pmpr_gh_token');
      alert('GitHub rejected the token (' + e.message + ').\nClick "Save & publish" again to enter a new one.');
    } else {
      alert('Publish failed: ' + e.message + '\n\nYour changes are still saved in this browser.');
    }
    set('⚠ Retry publish');
  }
  setTimeout(() => set('💾 Save & publish'), 3000);
}


/* ═══════════════════════════════════════════════════════════════════
   DEVELOPMENT LOG
   Per-project dev entries. A short header (title, phase, when,
   summary, header image, tools) and then a body made entirely of
   blocks — heading, text, image, gallery, table… — in whatever
   order the entry wants. Nothing is prescribed, nothing is
   pre-written: an entry contains exactly the blocks you add.

   Data lives in localStorage while you work and is baked into
   #devlog-data on publish. Private entries are never baked.
   Uploaded media is held in IndexedDB and committed to assets/ as
   real files when you publish — it is NOT base64'd into this page.
   ═══════════════════════════════════════════════════════════════════ */

const DL_KEY   = 'pmpr_devlog_v1';
const DL_ASSET = 'assets';
let   DEVLOG   = {};          // { projectId: [entry, ...] }

/* ── Utilities ─────────────────────────── */
function dlEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Strip anything executable out of pasted rich text before it is
   stored — this content gets published to a live site. */
function dlClean(html) {
  const d = document.createElement('div');
  d.innerHTML = String(html || '');
  d.querySelectorAll('script,iframe,object,embed,style,link,meta').forEach(n => n.remove());
  d.querySelectorAll('*').forEach(n => {
    [...n.attributes].forEach(a => {
      const name = a.name.toLowerCase();
      if (name.startsWith('on')) n.removeAttribute(a.name);
      if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
    });
  });
  return d.innerHTML;
}

function dlSlug(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
}

function dlUid() { return 'entry-' + Date.now().toString(36) + Math.floor(Math.random()*1296).toString(36); }

/* Entry ids double as URLs, so they follow the title — until the entry
   is published. After that the link is frozen, because someone may
   already have it in an application. */
function dlRetitle(proj, entry, title) {
  entry.title = title;
  if (entry.published) return;
  const base = dlSlug(title);
  if (!base) return;
  let id = base, n = 2;
  while (dlEntries(proj).some(e => e !== entry && e.id === id)) id = base + '-' + (n++);
  entry.id = id;
  if (deCur && deCur.id !== id) deCur.id = id;
}

function dlToast(msg) {
  /* Made on demand rather than returning early when it's missing. The toast
     is not editor-only: "🔗 Link copied" answers a visitor pressing Copy
     link on a dev entry, and that button is public. Before the chrome moved
     into script #de-toast was static markup on every page, so a plain
     `if (!t) return` here would have swallowed that confirmation silently.
     It's still in EP_CHROME_IDS, so a publish never bakes it. */
  let t = document.getElementById('de-toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'de-toast';
    t.id = 'de-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(dlToast._t);
  dlToast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── Persistence ───────────────────────── */
function dlSave() {
  safeSet(DL_KEY, JSON.stringify(DEVLOG));
}

function dlLoad() {
  // Baked-in published data is the base…
  let baked = {};
  try { baked = JSON.parse(document.getElementById('devlog-data')?.textContent || '{}') || {}; }
  catch (e) { baked = {}; }

  // …and this browser's working copy layers on top of it.
  let local = {};
  try { local = JSON.parse(localStorage.getItem(DL_KEY) || 'null') || {}; }
  catch (e) { local = {}; }

  // The monster project used to be keyed 'monster'; its page is
  // create-your-own-monster.html now. Carry any entries across.
  [baked, local].forEach(o => {
    if (o.monster && !o['create-your-own-monster']) o['create-your-own-monster'] = o.monster;
    delete o.monster;
  });

  DEVLOG = {};
  const projects = new Set([...Object.keys(baked), ...Object.keys(local)]);
  projects.forEach(p => {
    const list = Array.isArray(local[p]) ? local[p].slice() : [];
    const seen = new Set(list.map(e => e.id));
    // Keep anything already published that this browser doesn't know about,
    // so a cleared localStorage never silently drops live entries.
    (baked[p] || []).forEach(e => { if (!seen.has(e.id)) list.push(e); });
    DEVLOG[p] = list;
  });

  let moved = false;
  Object.keys(DEVLOG).forEach(p => dlEntries(p).forEach(e => { if (dlMigrate(e)) moved = true; }));
  if (moved) dlSave();
}

/* Entries used to be a form: a "discipline" tag, a phase, a date, a header
   image and a compulsory problem → approach → result skeleton. All of it is
   blocks now, so anything written under an older shape is lifted into blocks
   — same words, same order, but movable and deletable like everything else.
   Idempotent: v records how far an entry has been carried. */
const DL_SCHEMA = 3;

function dlMigrate(e) {
  if (!e || e.v >= DL_SCHEMA) return false;
  const blocks = () => (e.blocks = Array.isArray(e.blocks) ? e.blocks : []);

  // v2 — the three prose beats become a heading + its text, each.
  if (!(e.v >= 2)) {
    const has  = html => String(html || '').replace(/<[^>]*>/g, '').trim() !== '';
    const head = [];
    [['problem',  'The problem',  'What needed solving'],
     ['approach', 'The approach', 'What I designed'],
     ['result',   'The result',   'What changed']].forEach(([key, lbl, text]) => {
      if (!has(e[key])) return;
      head.push({ t:'heading', lbl, text });
      head.push({ t:'text', html: e[key] });
    });
    e.blocks = head.concat(blocks());
    delete e.problem; delete e.approach; delete e.result;
    delete e.tag;                     // the title already says which discipline it is
  }

  // v3 — phase and date become a tags block, the header image an image block,
  // both at the top, which is where they used to render.
  const head = [];
  const tags = [e.phase, e.date].map(t => String(t || '').trim()).filter(Boolean);
  if (tags.length) head.push({ t:'tags', items: tags.join(', ') });
  if (e.hero && e.hero.path) head.push({ t: dlIsVideo(e.hero) ? 'clip' : 'image', src: e.hero, cap:'' });
  e.blocks = head.concat(blocks());
  delete e.phase; delete e.date; delete e.hero;

  e.v = DL_SCHEMA;
  return true;
}

/* Phase names keep their own chip colour wherever they're written. */
const DL_PHASES = ['concept','pre-production','production','polish','shipped','postmortem'];
const dlChipCls = t => DL_PHASES.includes(String(t).toLowerCase()) ? 'dl-chip phase' : 'dl-chip';

function dlTagItems(e) {
  const b = (e.blocks || []).find(x => x.t === 'tags' && String(x.items || '').trim());
  return b ? String(b.items).split(',').map(s => s.trim()).filter(Boolean) : [];
}

/* b.items is a gallery's images — but on a list or tags block it's a plain
   string, so never iterate it blind. */
const dlGalItems = b => Array.isArray(b && b.items) ? b.items : [];

/* The entry list still wants a thumbnail — it takes the first picture the
   entry contains, wherever that happens to sit. */
function dlThumb(e) {
  if (e.hero && e.hero.path) return e.hero;              // not yet migrated
  for (const b of e.blocks || []) {
    for (const r of [b.src, b.a, b.b, ...dlGalItems(b)])
      if (r && r.path) return r;
  }
  return null;
}

/* Read-only — never invents a project, so a junk URL can't pollute the data. */
function dlEntries(projId)      { return DEVLOG[projId] || []; }
/* Use this when you're about to add to the list. */
function dlEnsure(projId)       { return DEVLOG[projId] || (DEVLOG[projId] = []); }
function dlPublic(projId)       { return dlEntries(projId).filter(e => !e.private); }
function dlGet(projId, entryId) { return dlEntries(projId).find(e => e.id === entryId) || null; }

function dlProjectName(projId) {
  const p = (typeof PROJECTS !== 'undefined') && PROJECTS.find(x => x.id === projId);
  return p ? p.name : projId;
}

/* ═══ MEDIA STORE ══════════════════════════════════════════
   Uploads go to IndexedDB, then to real files in assets/ on
   publish. MEDIA_CACHE holds not-yet-live files so previews
   work before the first publish.
   ═════════════════════════════════════════════════════════ */
const MEDIA_DB = 'pmpr-media', MEDIA_STORE = 'files';
const MEDIA_CACHE = Object.create(null);

function mediaDB() {
  if (mediaDB._p) return mediaDB._p;
  mediaDB._p = new Promise((res, rej) => {
    const rq = indexedDB.open(MEDIA_DB, 1);
    rq.onupgradeneeded = () => {
      if (!rq.result.objectStoreNames.contains(MEDIA_STORE))
        rq.result.createObjectStore(MEDIA_STORE, { keyPath:'path' });
    };
    rq.onsuccess = () => res(rq.result);
    rq.onerror   = () => rej(rq.error);
  });
  return mediaDB._p;
}

function mediaTx(mode, fn) {
  return mediaDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(MEDIA_STORE, mode);
    const rq = fn(tx.objectStore(MEDIA_STORE));
    tx.oncomplete = () => res(rq && rq.result);
    tx.onerror    = () => rej(tx.error);
  }));
}

const mediaPut = rec => mediaTx('readwrite', s => s.put(rec));
const mediaDel = path => mediaTx('readwrite', s => s.delete(path));
const mediaAll = ()   => mediaTx('readonly',  s => s.getAll());

async function mediaBoot() {
  try {
    const all = await mediaAll();
    (all || []).forEach(r => { if (!r.published) MEDIA_CACHE[r.path] = r.data; });
    dlUpdatePendingBadge();
  } catch (e) { /* private browsing / no IDB — previews fall back to the live path */ }
}

/* Resolve a stored media reference to something an <img> can use. */
function dlSrc(ref) {
  if (!ref || !ref.path) return '';
  return MEDIA_CACHE[ref.path] || ref.data || asset(ref.path);   // .data = embedded in an export
}

/* Safety net: a published file that GitHub Pages hasn't deployed yet
   still renders from the local copy. If there's no local copy either —
   a visitor hitting a genuinely missing file — collapse the figure
   rather than leaving a broken-image box in the middle of the page. */
async function dlMediaFallback(el) {
  const p = el.dataset.mpath;
  if (!p || el.dataset.mtried) return;
  el.dataset.mtried = '1';
  let data = null;
  try { data = (await mediaTx('readonly', s => s.get(p)))?.data || null; } catch (e) {}
  if (data) { el.src = data; return; }
  const fig = el.closest('.dl-d-hero, .dl-blk-fig, .de-prev');
  const cell = el.closest('.dl-gal > div');
  if (fig)       fig.style.display = 'none';
  else if (cell) cell.style.display = 'none';
  else           el.style.display = 'none';   // thumbnail — the number shows through
}

/* Waiting to be committed: uploaded, not yet published, and not held back for
   being private. Publishing a private entry's media would leak it (see
   dlPrivateOnlyMedia); it stays in IndexedDB and goes up if the entry is ever
   made public. */
async function dlPendingMedia() {
  try {
    const held = dlPrivateOnlyMedia();
    return (await mediaAll() || []).filter(r => !r.published && !held.has(r.path));
  }
  catch (e) { return []; }
}

async function dlUpdatePendingBadge() {
  const el = document.getElementById('dl-pending');
  if (!el) return;
  const n = (await dlPendingMedia()).length;
  el.classList.toggle('on', n > 0);
  if (n > 0) el.textContent = `⬆ ${n} file${n>1?'s':''} waiting to publish — they live only in this browser until you hit Save & publish.`;
}

function dlExt(mime, name) {
  const m = { 'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp',
              'image/avif':'avif','image/svg+xml':'svg','video/mp4':'mp4','video/webm':'webm' }[mime];
  if (m) return m;
  const dot = String(name||'').lastIndexOf('.');
  return dot > -1 ? name.slice(dot+1).toLowerCase().replace(/[^a-z0-9]/g,'') : 'bin';
}

/* Read a File, store it, and return the reference to save in the entry. */
function dlStoreFile(file, projId, entryId) {
  return new Promise((res, rej) => {
    if (!file) return rej(new Error('no file'));
    if (file.size > 25 * 1024 * 1024) return rej(new Error('That file is over 25 MB — too big for a git repo. Compress it first.'));
    const r = new FileReader();
    r.onload = async () => {
      const ext  = dlExt(file.type, file.name);
      const n    = Date.now().toString(36).slice(-4);
      const path = `${DL_ASSET}/${projId}/${entryId}-${n}.${ext}`;
      const rec  = { path, data: r.result, type: file.type || '', published: false };
      MEDIA_CACHE[path] = r.result;
      try { await mediaPut(rec); } catch (e) { /* keep the in-memory copy at minimum */ }
      dlUpdatePendingBadge();
      res({ path, type: file.type || '' });
    };
    r.onerror = () => rej(new Error('Could not read that file'));
    r.readAsDataURL(file);
  });
}

/* Every media reference currently held by an entry — all of them, or only
   those `pick` accepts. Used before deleting a file — duplicating a block
   copies the reference, so the same upload can be pointed at from two places
   and must survive losing one of them. */
function dlMediaRefs(pick) {
  const out = [];
  const take = r => { if (r && r.path) out.push(r.path); };
  Object.keys(DEVLOG).forEach(p => dlEntries(p).forEach(e => {
    if (pick && !pick(e)) return;
    take(e.hero);
    (e.blocks || []).forEach(b => { take(b.src); take(b.a); take(b.b); dlGalItems(b).forEach(take); });
  }));
  return out;
}

/* Files that only private entries point at. Private entries are stripped from
   every publish (dlPublicData), so committing their media would put it in a
   public repo with nothing on the site referencing it — the one way private
   content still reached GitHub. A file a public entry also uses is not
   private-only and still publishes. Uploads that live outside the dev log
   (card art, hero images, the profile photo) appear in neither set, so they
   are unaffected. */
function dlPrivateOnlyMedia() {
  const shown = new Set(dlMediaRefs(e => !e.private));
  return new Set(dlMediaRefs(e => e.private).filter(p => !shown.has(p)));
}

/* Call *after* the reference has been removed from the entry. */
function dlDropMedia(ref) {
  if (!ref || !ref.path) return;
  if (dlMediaRefs().includes(ref.path)) return;
  mediaDel(ref.path).catch(() => {});
  delete MEDIA_CACHE[ref.path];
}

const dlIsVideo = ref => /^video\//.test(ref?.type || '') || /\.(mp4|webm)$/i.test(ref?.path || '');

function dlMediaTag(ref, cls) {
  if (!ref || !ref.path) return '';
  const src = dlEsc(dlSrc(ref)), p = dlEsc(ref.path), c = cls ? ` class="${cls}"` : '';
  // Dev-log media is always below the fold, so none of it needs to be on
  // the wire before the page is usable.
  return dlIsVideo(ref)
    ? `<video${c} src="${src}" data-mpath="${p}" onerror="dlMediaFallback(this)" preload="metadata" autoplay loop muted playsinline></video>`
    : `<img${c} src="${src}" data-mpath="${p}" onerror="dlMediaFallback(this)" loading="lazy" decoding="async" alt=""/>`;
}

/* ═══ RENDERING — the log list inside a case study ═══ */
function dlRenderList(projId) {
  const entries = editing ? dlEntries(projId) : dlPublic(projId);
  const wrap = document.createElement('div');
  wrap.className = 'dl-wrap';
  wrap.id = 'dl-wrap';

  const n = entries.length;
  let html = `
    <div class="dl-head">
      <div>
        <div class="dl-meta" style="margin-bottom:.4rem">// How it was built</div>
        <div class="dl-title">Development Log</div>
      </div>
      <div class="dl-meta">${n} ${n === 1 ? 'entry' : 'entries'}</div>
    </div>`;

  if (!n) {
    html += `
      <div class="dl-empty">
        <div class="dl-empty-t">No entries yet</div>
        <div class="dl-empty-s">${editing
          ? 'Open the <strong>Dev Log</strong> tab in the editor to write your first entry for this project.'
          : 'Development write-ups for this project are on the way.'}</div>
      </div>`;
  } else {
    html += '<div class="dl-list">';
    entries.forEach((e, i) => {
      const num = String(i + 1).padStart(2, '0');
      const thumb = dlThumb(e);
      html += `
        <button class="dl-entry" onclick="dlOpenEntry('${dlEsc(projId)}','${dlEsc(e.id)}')">
          <span class="dl-thumb">
            <span class="dl-thumb-n">${num}</span>
            ${thumb ? dlMediaTag(thumb, 'dl-thumb-img') : ''}
          </span>
          <span class="dl-entry-body">
            <span class="dl-chips">
              <span class="dl-chip">${num}</span>
              ${dlTagItems(e).slice(0, 3).map(t => `<span class="${dlChipCls(t)}">${dlEsc(t)}</span>`).join('')}
              ${e.private ? `<span class="dl-chip locked">🔒 Private</span>` : ''}
            </span>
            <span class="dl-entry-name">${dlEsc(e.title || 'Untitled entry')}</span>
            ${e.summary ? `<span class="dl-entry-sum">${dlEsc(e.summary)}</span>` : ''}
          </span>
          <span class="dl-entry-go">→</span>
        </button>`;
    });
    html += '</div>';
  }

  wrap.innerHTML = html;
  return wrap;
}

/* ═══ RENDERING — a single entry ═══ */
function dlRenderBlock(b) {
  switch (b.t) {
    case 'heading': {
      const lbl = String(b.lbl || '').trim(), text = String(b.text || '').trim();
      if (!lbl && !text) return '';
      return `<div class="dl-blk dl-blk-head">
        ${lbl  ? `<div class="sh-sec-lbl">${dlEsc(lbl)}</div>` : ''}
        ${text ? `<h3 class="dl-h3">${dlEsc(text)}</h3>`       : ''}
      </div>`;
    }

    case 'sub':
      return String(b.text || '').trim()
        ? `<div class="dl-blk dl-blk-sub"><h4 class="dl-h4">${dlEsc(b.text)}</h4></div>` : '';

    case 'tags': {
      const items = String(b.items || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!items.length) return '';
      return `<div class="dl-blk dl-blk-tags"><div class="dl-chips">${
        items.map(t => `<span class="${dlChipCls(t)}">${dlEsc(t)}</span>`).join('')
      }</div></div>`;
    }

    case 'divider':
      return '<div class="dl-rule"></div>';

    case 'text':
      return `<div class="dl-blk sh-sec">${dlClean(b.html) || ''}</div>`;

    case 'image':
    case 'clip':
      if (!b.src || !b.src.path) return '';
      return `<div class="dl-blk">
        <div class="dl-blk-fig">${dlMediaTag(b.src)}</div>
        ${b.cap ? `<div class="dl-cap">${dlEsc(b.cap)}</div>` : ''}
      </div>`;

    case 'gallery': {
      const items = dlGalItems(b).filter(i => i && i.path);
      if (!items.length) return '';
      return `<div class="dl-blk">
        <div class="dl-gal">${items.map(i => `<div>${dlMediaTag(i)}</div>`).join('')}</div>
        ${b.cap ? `<div class="dl-cap">${dlEsc(b.cap)}</div>` : ''}
      </div>`;
    }

    case 'quote':
      return b.text ? `<div class="sh-pull">${dlEsc(b.text)}</div>` : '';

    case 'loop': {
      const steps = String(b.steps || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!steps.length) return '';
      return `<div class="dl-blk"><div class="sh-loop">${
        steps.map((s, i) => `${i ? '<span class="loop-a">→</span>' : ''}<span class="loop-n">${dlEsc(s)}</span>`).join('')
      }</div>${b.cap ? `<div class="dl-cap">${dlEsc(b.cap)}</div>` : ''}</div>`;
    }

    case 'beforeafter': {
      if (!(b.a && b.a.path) && !(b.b && b.b.path)) return '';
      // Labels are yours to write — an unlabelled pair just shows the images.
      const side = (ref, lbl) => `<div>
        ${lbl ? `<div class="dl-ba-lbl">${dlEsc(lbl)}</div>` : ''}
        ${ref && ref.path ? `<div class="dl-blk-fig">${dlMediaTag(ref)}</div>` : ''}
      </div>`;
      return `<div class="dl-blk">
        <div class="dl-grid2">${side(b.a, b.la)}${side(b.b, b.lb)}</div>
        ${b.cap ? `<div class="dl-cap">${dlEsc(b.cap)}</div>` : ''}
      </div>`;
    }

    case 'table': {
      const rows = String(b.data || '').split('\n').map(r => r.trim()).filter(Boolean)
                    .map(r => r.split('|').map(c => c.trim()));
      if (!rows.length) return '';
      const [head, ...body] = rows;
      return `<div class="dl-blk">
        <div class="dl-table-wrap"><table class="dl-table">
          <thead><tr>${head.map(c => `<th>${dlEsc(c)}</th>`).join('')}</tr></thead>
          <tbody>${body.map(r => `<tr>${r.map(c => `<td>${dlEsc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        ${b.cap ? `<div class="dl-cap">${dlEsc(b.cap)}</div>` : ''}
      </div>`;
    }

    case 'list': {
      const items = String(b.items || '').split('\n').map(s => s.trim()).filter(Boolean);
      if (!items.length) return '';
      return `<div class="dl-blk sh-sec"><ul>${items.map(i => `<li>${dlEsc(i)}</li>`).join('')}</ul></div>`;
    }

    case 'code':
      if (!b.code) return '';
      return `<div class="dl-blk"><div class="dl-code">
        ${b.lbl ? `<div class="dl-code-lbl">${dlEsc(b.lbl)}</div>` : ''}
        <pre>${dlEsc(b.code)}</pre>
      </div></div>`;

    default: return '';
  }
}

function dlRenderDetail(projId, e) {
  const wrap = document.createElement('div');
  wrap.className = 'dl-detail';

  const tools = String(e.tools || '').split(',').map(s => s.trim()).filter(Boolean);

  wrap.innerHTML = `
    <div class="dl-top">
      <button class="dl-back" onclick="dlBackToCase('${dlEsc(projId)}')">← ${dlEsc(dlProjectName(projId))} · Development Log</button>
      <span class="dl-top-actions">
        <button class="dl-share" onclick="dlCopyLink('${dlEsc(projId)}','${dlEsc(e.id)}')">🔗 Copy link</button>
        ${editing ? `<button class="dl-share" onclick="deOpen('${dlEsc(projId)}','${dlEsc(e.id)}')">✎ Edit entry</button>` : ''}
      </span>
    </div>

    ${e.private ? `<div class="dl-chips">
      <span class="dl-chip locked">🔒 Private — not published</span>
    </div>` : ''}

    <h2 class="dl-d-title">${dlEsc(e.title || 'Untitled entry')}</h2>
    ${e.summary ? `<p class="dl-d-sum">${dlEsc(e.summary)}</p>` : ''}

    ${e.private ? `<div class="dl-nda">
      <span style="font-size:1.1rem">🔒</span>
      <div><div class="dl-nda-t">Private entry</div>
      <div class="dl-nda-s">Only visible in this browser. It is stripped out when you publish, so it never reaches the live site.</div></div>
    </div>` : ''}

    ${(e.blocks || []).map(dlRenderBlock).join('')}

    ${tools.length ? `<div class="sh-sec" style="margin-top:2.5rem">
      <div class="sh-sec-lbl">Tools &amp; tech</div>
      <div class="sh-tools">${tools.map(t => `<span class="sh-tool">${dlEsc(t)}</span>`).join('')}</div>
    </div>` : ''}

    <div class="sh-nav dl-foot">
      <button class="sh-nav-btn" onclick="dlBackToCase('${dlEsc(projId)}')">← Back to project</button>
    </div>`;
  return wrap;
}

/* ═══ NAVIGATION / URLs ══════════════════════════════════ */
let dlRouting = false;

function dlSetHash(h) {
  dlRouting = true;
  if (location.hash !== h) location.hash = h;
  setTimeout(() => { dlRouting = false; }, 0);
}

function dlClearHash() {
  if (!location.hash) return;
  dlRouting = true;
  history.replaceState(null, '', location.pathname + location.search);
  setTimeout(() => { dlRouting = false; }, 0);
}

/* Render (or re-render) the log at the foot of the case study. */
function dlMountLog() {
  if (!IS_PROJECT || !caseView) return;
  caseView.querySelectorAll('#dl-wrap').forEach(n => n.remove());   // never stack two
  const wrap = dlRenderList(PAGE.id);
  // .sh-body used to be a second <main>, which isn't valid inside
  // main.sh-page. Both are accepted so pages published before the rename
  // keep mounting their log in the right place.
  const host = caseView.querySelector('.sh-content > .sh-body, .sh-content > main');
  const nav  = caseView.querySelector('.sh-nav');
  if (host)     host.appendChild(wrap);
  else if (nav) caseView.insertBefore(wrap, nav);
  else          caseView.appendChild(wrap);
}

function dlOpenEntry(projId, entryId) {
  if (projId !== PAGE.id) { location.href = projectHref(projId) + '#/dev/' + entryId; return; }
  const e = dlGet(projId, entryId);
  if (!e) return;
  showEntryView(dlRenderDetail(projId, e));
  dlSetHash('#/dev/' + entryId);
}

function dlBackToCase(projId) {
  if (projId !== PAGE.id) { location.href = projectHref(projId); return; }
  closeCase();
  document.getElementById('dl-wrap')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

function dlCopyLink(projId, entryId) {
  const url = projId === PAGE.id
    ? location.origin + location.pathname + '#/dev/' + entryId
    : new URL(projectHref(projId) + '#/dev/' + entryId, location.href).href;
  const done = () => dlToast('🔗 Link copied');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('Copy this link:', url));
  else prompt('Copy this link:', url);
}

/* Project pages route #/dev/<entry>. The landing page has no case
   studies of its own — it forwards the old #/<project>/dev/<entry>
   links, so anything already shared keeps working. */
function dlRoute() {
  if (!IS_PROJECT) return dlLegacyRedirect();
  const m = /^#\/dev\/([a-z0-9_-]+)$/i.exec(location.hash || '');
  if (m && dlGet(PAGE.id, m[1])) dlOpenEntry(PAGE.id, m[1]);
  else showCaseView();
}

function dlLegacyRedirect() {
  const m = /^#\/([a-z0-9_-]+)(?:\/dev\/([a-z0-9_-]+))?$/i.exec(location.hash || '');
  if (!m || !PROJECTS.some(p => p.id === m[1])) return;
  location.replace(projectHref(m[1]) + (m[2] ? '#/dev/' + m[2] : ''));
}

window.addEventListener('hashchange', () => { if (!dlRouting) dlRoute(); });

/* ═══ EDITOR — Dev Log tab ═══════════════════════════════ */
function renderDevlogTab() {
  const sel = document.getElementById('dl-proj-select');
  if (!sel) return;
  const keep = sel.value;
  const list = (typeof PROJECTS !== 'undefined' ? PROJECTS : []);
  sel.innerHTML = list
    .map(p => `<option value="${dlEsc(p.id)}">${dlEsc(p.icon || '')} ${dlEsc(p.name)}</option>`).join('');
  if (IS_PROJECT) { sel.value = PAGE.id; sel.disabled = true; }
  else if (keep && [...sel.options].some(o => o.value === keep)) sel.value = keep;

  // A dev entry is published with its project's page, so it has to be
  // written there. From the landing page the panel is a launcher.
  const note = document.getElementById('dl-tab-note');
  if (note) {
    note.innerHTML = IS_PROJECT
      ? 'Writing the log for <strong>' + dlEsc(PAGE.name || PAGE.id) + '</strong>. Publishing from here updates this project\'s page.'
      : 'Pick a game and I\'ll open its page — entries are written and published there.';
  }
  renderDlEntryList();
  dlUpdatePendingBadge();
}

function dlSelectedProject() {
  if (IS_PROJECT) return PAGE.id;
  return document.getElementById('dl-proj-select')?.value || (PROJECTS[0] && PROJECTS[0].id);
}

/* From the landing page, jump to where the entry actually lives. */
function dlGoToProject(projId, entryId, andNew) {
  const q = '?edit=1' + (andNew ? '&new=1' : '');
  edHandoffSet();
  location.href = projectHref(projId) + q + (entryId ? '#/dev/' + entryId : '');
}

function renderDlEntryList() {
  // Keep the log on the page in step with the panel — titles drive entry
  // ids, so a stale render would link to an id that no longer exists.
  dlMountLog();
  const host = document.getElementById('dl-entry-list');
  if (!host) return;
  const proj = dlSelectedProject();
  const list = dlEntries(proj);
  host.innerHTML = '';

  if (!list.length) {
    host.innerHTML = `<div style="font-family:var(--fm);font-size:.6rem;letter-spacing:.06em;color:var(--muted);padding:.9rem .3rem;line-height:1.7">
      No entries yet.<br>Add one to start documenting how this game was built.</div>`;
    return;
  }

  list.forEach((e, i) => {
    const row = document.createElement('div');
    row.className = 'dl-ed-item';
    row.innerHTML = `
      <span class="dl-ed-num">${String(i+1).padStart(2,'0')}</span>
      <span class="dl-ed-name">${e.private ? '🔒 ' : ''}${dlEsc(e.title || 'Untitled entry')}</span>
      <span class="dl-ed-arrows">
        <button title="Move up"   onclick="dlMove('${dlEsc(proj)}',${i},-1,event)">↑</button>
        <button title="Move down" onclick="dlMove('${dlEsc(proj)}',${i},1,event)">↓</button>
      </span>`;
    row.addEventListener('click', ev => {
      if (ev.target.closest('button')) return;
      if (IS_PROJECT) deOpen(proj, e.id);
      else dlGoToProject(proj, e.id);
    });
    host.appendChild(row);
  });
}

function dlMove(proj, i, dir, ev) {
  ev?.stopPropagation();
  const list = dlEnsure(proj);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  dlSave();
  renderDlEntryList();
}

function dlAddEntry() {
  const proj = dlSelectedProject();
  if (!IS_PROJECT) return dlGoToProject(proj, null, true);
  const entry = {
    id: dlUid(), title:'', summary:'', tools:'',
    private:false, published:false, blocks:[], v: DL_SCHEMA
  };
  dlEnsure(proj).push(entry);
  dlSave();
  renderDlEntryList();
  deOpen(proj, entry.id);
}

/* Private entries never leave the browser, so give her a real backup. */
function dlExportPrivate() {
  const out = {};
  let n = 0;
  Object.keys(DEVLOG).forEach(p => {
    const priv = dlEntries(p).filter(e => e.private);
    if (priv.length) { out[p] = priv; n += priv.length; }
  });
  if (!n) return dlToast('No private entries to export');
  const blob = new Blob([JSON.stringify(out, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'devlog-private-backup.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  dlToast(`⤓ ${n} private ${n>1?'entries':'entry'} backed up`);
}

function dlImportPrivate(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      let n = 0;
      Object.keys(data).forEach(p => {
        const list = dlEnsure(p);
        (data[p] || []).forEach(e => {
          if (!e || !e.id) return;
          dlMigrate(e);                 // a backup taken before the block rewrite
          const at = list.findIndex(x => x.id === e.id);
          if (at > -1) list[at] = e; else list.push(e);
          n++;
        });
      });
      dlSave(); renderDlEntryList();
      dlToast(`✓ Restored ${n} ${n===1?'entry':'entries'}`);
    } catch (err) { alert('That file could not be read as a dev log backup.'); }
  };
  r.readAsText(file);
}

/* ═══ EDITOR — the fillable entry form ═══════════════════ */
let deCur = null;   // { proj, id }

function deEntry() { return deCur ? dlGet(deCur.proj, deCur.id) : null; }

function deOpen(proj, id) {
  const e = dlGet(proj, id);
  if (!e) return;
  deCur = { proj, id };
  deInsertAt = null;
  showCaseView();

  document.getElementById('de-bar-proj').textContent = dlProjectName(proj);
  document.getElementById('de-title').value    = e.title   || '';
  document.getElementById('de-summary').value  = e.summary || '';
  document.getElementById('de-tools').value    = e.tools   || '';
  document.getElementById('de-private').checked = !!e.private;
  deSetPrivateLabel(!!e.private);
  deSlugPreview();
  deRenderBlocks();

  document.getElementById('dev-editor').classList.add('open');
  lockScroll();
  const scroller = document.querySelector('#dev-editor .de-body');
  if (scroller) scroller.scrollTop = 0;
}

function deClose() {
  const de = document.getElementById('dev-editor');
  const wasOpen = de.classList.contains('open');
  de.classList.remove('open');
  if (wasOpen) unlockScroll();
  dlSave();
  deCur = null;
  renderDlEntryList();
  closeCase();          // back to the case study with a freshly rendered log
}

function deField(key, val) {
  const e = deEntry();
  if (!e) return;
  if (key === 'title') { dlRetitle(deCur.proj, e, val); deSlugPreview(); }
  else                 { e[key] = val; }
  dlSaveSoon();
}

let dlSaveTimer = null;
function dlSaveSoon() {
  clearTimeout(dlSaveTimer);
  dlSaveTimer = setTimeout(() => { dlSave(); renderDlEntryList(); }, 400);
}

function deSlugPreview() {
  const e = deEntry();
  const el = document.getElementById('de-slug-preview');
  if (!e || !el) return;
  el.textContent = '#/' + deCur.proj + '/dev/' + e.id + (e.published ? '  (locked — already shared)' : '');
}

function deSetPrivate(on) {
  const e = deEntry();
  if (!e) return;
  e.private = !!on;
  deSetPrivateLabel(!!on);
  dlSaveSoon();
}

function deSetPrivateLabel(on) {
  const l = document.getElementById('de-private-lbl');
  if (!l) return;
  l.textContent = on ? '🔒 Private' : 'Public';
  l.style.color = on ? '#8a6d1f' : '';
}

function deDeleteEntry() {
  const e = deEntry();
  if (!e) return;
  if (!confirm(`Delete "${e.title || 'this entry'}"?\n\nThis cannot be undone.`)) return;
  const list = dlEnsure(deCur.proj);
  const i = list.findIndex(x => x.id === deCur.id);
  if (i > -1) list.splice(i, 1);
  dlSave();
  deClose();
  dlToast('Entry deleted');
}

/* ── Content blocks ────────────────────────────────────────
   The whole body of an entry. Order is yours: add anything
   anywhere, drag it where you want it, delete what you don't
   need. Nothing here is required and nothing is filled in for
   you — an empty entry publishes as an empty entry.
   ───────────────────────────────────────────────────────── */
const DE_BLOCKS = {
  heading:     { name:'Heading',        icon:'H'  },
  sub:         { name:'Subheading',     icon:'h'  },
  text:        { name:'Text',           icon:'📝' },
  image:       { name:'Image',          icon:'🖼' },
  clip:        { name:'GIF / video',    icon:'🎬' },
  gallery:     { name:'Gallery',        icon:'🗂' },
  quote:       { name:'Pull quote',     icon:'💬' },
  loop:        { name:'Core loop',      icon:'🔁' },
  beforeafter: { name:'Before / after', icon:'⇄'  },
  table:       { name:'Table',          icon:'▦'  },
  list:        { name:'Bullet list',    icon:'•'  },
  code:        { name:'Code / formula', icon:'⌨'  },
  tags:        { name:'Tags',           icon:'#'  },
  divider:     { name:'Divider',        icon:'—'  },
};
const DE_ORDER = Object.keys(DE_BLOCKS);

const DE_NEW = {
  heading:     () => ({ lbl:'', text:'' }),
  sub:         () => ({ text:'' }),
  tags:        () => ({ items:'' }),
  divider:     () => ({}),
  text:        () => ({ html:'' }),
  image:       () => ({ src:null, cap:'' }),
  clip:        () => ({ src:null, cap:'' }),
  gallery:     () => ({ items:[], cap:'' }),
  quote:       () => ({ text:'' }),
  loop:        () => ({ steps:'', cap:'' }),
  beforeafter: () => ({ a:null, b:null, la:'', lb:'', cap:'' }),
  table:       () => ({ data:'', cap:'' }),
  list:        () => ({ items:'' }),
  code:        () => ({ lbl:'', code:'' }),
};

/* Which gap the block palette is currently open at (null = closed). */
let deInsertAt = null;

function deToggleInsert(i) {
  deInsertAt = (deInsertAt === i) ? null : i;
  deRenderBlocks();
}

function deAddBlock(t, at) {
  const e = deEntry();
  if (!e || !DE_BLOCKS[t]) return;
  const blocks = (e.blocks = e.blocks || []);
  const i = (at == null || at < 0 || at > blocks.length) ? blocks.length : at;
  blocks.splice(i, 0, Object.assign({ t }, (DE_NEW[t] || (() => ({})))()));
  deInsertAt = null;
  dlSave();
  deRenderBlocks();
  deFocusBlock(i);
}

function deFocusBlock(i) {
  const el = document.querySelector(`#de-blocks .de-blk[data-i="${i}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior:'smooth', block:'center' });
  el.querySelector('input:not([type=file]),textarea,[contenteditable]')?.focus();
}

function deBlkMove(i, dir) {
  const e = deEntry(), b = e?.blocks;
  const j = i + dir;
  if (!b || j < 0 || j >= b.length) return;
  [b[i], b[j]] = [b[j], b[i]];
  dlSave(); deRenderBlocks();
}

/* Move block `from` so it lands at slot `to` in the *current* list. */
function deBlkMoveTo(from, to) {
  const e = deEntry(), b = e?.blocks;
  if (!b || from < 0 || from >= b.length) return;
  if (to > from) to--;                       // removing it first shifts the target
  to = Math.max(0, Math.min(b.length - 1, to));
  if (to === from) return;
  b.splice(to, 0, b.splice(from, 1)[0]);
  dlSave(); deRenderBlocks();
}

function deBlkDup(i) {
  const e = deEntry();
  if (!e?.blocks?.[i]) return;
  // Media references are copied, not the files — dlDropMedia keeps the
  // upload alive as long as either copy still points at it.
  e.blocks.splice(i + 1, 0, JSON.parse(JSON.stringify(e.blocks[i])));
  dlSave(); deRenderBlocks(); deFocusBlock(i + 1);
}

function deBlkDel(i) {
  const e = deEntry();
  if (!e?.blocks?.[i]) return;
  const b = e.blocks.splice(i, 1)[0];
  [b.src, b.a, b.b, ...dlGalItems(b)].forEach(dlDropMedia);
  if (deInsertAt != null && deInsertAt > i) deInsertAt--;
  dlSave(); deRenderBlocks(); dlUpdatePendingBadge();
}

/* ── Drag to reorder ── */
let deDragFrom = null;

function deDragStart(i, ev) {
  deDragFrom = i;
  try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(i)); } catch (err) {}
  ev.currentTarget.closest('.de-blk')?.classList.add('dragging');
}

function deDragEnd() {
  deDragFrom = null;
  document.querySelectorAll('#de-blocks .de-blk')
    .forEach(n => n.classList.remove('dragging', 'drop-before', 'drop-after'));
}

function deDragOver(i, ev) {
  if (deDragFrom === null) return;
  ev.preventDefault();
  const el = ev.currentTarget, r = el.getBoundingClientRect();
  const after = (ev.clientY - r.top) > r.height / 2;
  document.querySelectorAll('#de-blocks .de-blk')
    .forEach(n => n.classList.remove('drop-before', 'drop-after'));
  el.classList.add(after ? 'drop-after' : 'drop-before');
}

function deDrop(i, ev) {
  if (deDragFrom === null) return;
  ev.preventDefault();
  const el = ev.currentTarget, r = el.getBoundingClientRect();
  const after = (ev.clientY - r.top) > r.height / 2;
  const from = deDragFrom;
  deDragEnd();
  deBlkMoveTo(from, i + (after ? 1 : 0));
}

function deBlkField(i, key, val) {
  const e = deEntry();
  if (!e?.blocks?.[i]) return;
  e.blocks[i][key] = val;
  dlSaveSoon();
}

async function deBlkUpload(input, i, key) {
  const e = deEntry(), file = input.files?.[0];
  input.value = '';
  if (!e?.blocks?.[i] || !file) return;
  try {
    e.blocks[i][key] = await dlStoreFile(file, deCur.proj, e.id);
    dlSave(); deRenderBlocks();
  } catch (err) { alert(err.message); }
}

async function deGalUpload(input, i) {
  const e = deEntry(), files = [...(input.files || [])];
  input.value = '';
  if (!e?.blocks?.[i] || !files.length) return;
  for (const f of files) {
    try { (e.blocks[i].items = e.blocks[i].items || []).push(await dlStoreFile(f, deCur.proj, e.id)); }
    catch (err) { alert(err.message); break; }
  }
  dlSave(); deRenderBlocks();
}

function deGalDel(i, k) {
  const e = deEntry();
  const ref = e?.blocks?.[i]?.items?.[k];
  if (!ref) return;
  e.blocks[i].items.splice(k, 1);
  dlDropMedia(ref);
  dlSave(); deRenderBlocks(); dlUpdatePendingBadge();
}

function deBlkClear(i, key) {
  const e = deEntry();
  if (!e?.blocks?.[i]) return;
  const ref = e.blocks[i][key];
  e.blocks[i][key] = null;
  dlDropMedia(ref);
  dlSave(); deRenderBlocks(); dlUpdatePendingBadge();
}

function deMediaSlot(i, key, ref, label) {
  return ref && ref.path
    ? `<div class="de-prev">${dlMediaTag(ref)}
         <button class="de-prev-x" onclick="deBlkClear(${i},'${key}')" title="Remove">✕</button>
         <span class="de-prev-tag">${dlEsc(ref.path)}</span></div>`
    : `<label class="de-drop"><div class="de-drop-t">${label}</div>
         <input type="file" accept="image/*,video/mp4,video/webm" style="display:none" onchange="deBlkUpload(this,${i},'${key}')"/></label>`;
}

/* Every block type, each inserting at slot i. */
function dePalette(i) {
  return `<div class="de-palette de-pop">${DE_ORDER.map(t =>
    `<button class="de-pal-btn" onclick="deAddBlock('${t}',${i})"><span class="de-pal-i">${DE_BLOCKS[t].icon}</span>${DE_BLOCKS[t].name}</button>`
  ).join('')}</div>`;
}

/* The "+" between two blocks, and the palette it opens. */
function deGap(i, opts) {
  const open = deInsertAt === i;
  const cls  = 'de-gap' + (open ? ' open' : '') + (opts && opts.always ? ' always' : '');
  return `<div class="${cls}">
      <button class="de-gap-btn" onclick="deToggleInsert(${i})">${open ? '✕ Close' : '+ Add block here'}</button>
    </div>${open ? dePalette(i) : ''}`;
}

function deRenderBlocks() {
  const e = deEntry(), host = document.getElementById('de-blocks');
  if (!e || !host) return;
  const blocks = e.blocks || [];

  // Nothing to insert *between* yet — just offer the palette outright.
  if (!blocks.length) {
    deInsertAt = null;
    host.innerHTML = `<div class="de-blank">This entry is empty. Build it out of the blocks below, in any order.</div>${dePalette(0)}`;
    return;
  }

  host.innerHTML = blocks.map((b, i) => {
    const cap = (ph = 'Caption (optional)') =>
      `<input class="de-in" style="margin-top:.5rem" placeholder="${ph}" value="${dlEsc(b.cap || '')}" oninput="deBlkField(${i},'cap',this.value)"/>`;
    let body = '';

    switch (b.t) {
      case 'heading':
        body = `<input class="de-in mono" style="margin-bottom:.5rem" placeholder="Small label above it (optional)"
                  value="${dlEsc(b.lbl || '')}" oninput="deBlkField(${i},'lbl',this.value)"/>
                <input class="de-in de-h-in" value="${dlEsc(b.text || '')}" oninput="deBlkField(${i},'text',this.value)"/>`;
        break;
      case 'sub':
        body = `<input class="de-in de-h-in sm" value="${dlEsc(b.text || '')}" oninput="deBlkField(${i},'text',this.value)"/>`;
        break;
      case 'tags':
        body = `<input class="de-in mono" value="${dlEsc(b.items || '')}" oninput="deBlkField(${i},'items',this.value)"/>
                <div class="de-hint">Comma separated. Small chips — phase, date, platform, whatever labels the entry.
                  The first tags block in an entry is also what shows in the log list.</div>`;
        break;
      case 'divider':
        body = `<div class="de-hint" style="margin:0">A dashed rule across the page. Nothing to fill in.</div>`;
        break;
      case 'text':
        body = `<div class="de-rich" contenteditable="true" spellcheck="false" data-rich
                  oninput="deBlkField(${i},'html',this.innerHTML)">${dlClean(b.html || '')}</div>`;
        break;
      case 'image':
      case 'clip':
        body = deMediaSlot(i, 'src', b.src, b.t === 'clip'
          ? '🎬 Click to add a GIF or short MP4/WebM' : '🖼 Click to add an image') + cap();
        break;
      case 'gallery':
        body = `<div class="dl-gal" style="margin-bottom:.6rem">${
          dlGalItems(b).map((it, k) => `<div style="position:relative">${dlMediaTag(it)}
            <button class="de-prev-x" onclick="deGalDel(${i},${k})" title="Remove">✕</button></div>`).join('')
        }</div>
        <label class="de-drop"><div class="de-drop-t">🗂 Add images — you can pick several at once</div>
          <input type="file" accept="image/*" multiple style="display:none" onchange="deGalUpload(this,${i})"/></label>${cap()}`;
        break;
      case 'quote':
        body = `<textarea class="de-ta" style="min-height:70px"
                  oninput="deBlkField(${i},'text',this.value)">${dlEsc(b.text || '')}</textarea>`;
        break;
      case 'loop':
        body = `<input class="de-in mono"
                  value="${dlEsc(b.steps || '')}" oninput="deBlkField(${i},'steps',this.value)"/>
                <div class="de-hint">Separate each step with a comma — they render as a linked loop diagram.</div>${cap()}`;
        break;
      case 'beforeafter':
        body = `<div class="de-row">
          <div><input class="de-in" style="margin-bottom:.5rem" value="${dlEsc(b.la || '')}" placeholder="Label (optional)"
                 oninput="deBlkField(${i},'la',this.value)"/>${deMediaSlot(i,'a',b.a,'🖼 Left image')}</div>
          <div><input class="de-in" style="margin-bottom:.5rem" value="${dlEsc(b.lb || '')}" placeholder="Label (optional)"
                 oninput="deBlkField(${i},'lb',this.value)"/>${deMediaSlot(i,'b',b.b,'🖼 Right image')}</div>
        </div>${cap()}`;
        break;
      case 'table':
        body = `<textarea class="de-ta mono" style="min-height:120px"
                  oninput="deBlkField(${i},'data',this.value)">${dlEsc(b.data || '')}</textarea>
                <div class="de-hint">One row per line, columns separated by <code>|</code>. The first line is the header.</div>${cap()}`;
        break;
      case 'list':
        body = `<textarea class="de-ta" style="min-height:100px"
                  oninput="deBlkField(${i},'items',this.value)">${dlEsc(b.items || '')}</textarea>
                <div class="de-hint">One bullet per line.</div>`;
        break;
      case 'code':
        body = `<input class="de-in mono" style="margin-bottom:.5rem" placeholder="Label (optional)"
                  value="${dlEsc(b.lbl || '')}" oninput="deBlkField(${i},'lbl',this.value)"/>
                <textarea class="de-ta mono" style="min-height:110px"
                  oninput="deBlkField(${i},'code',this.value)">${dlEsc(b.code || '')}</textarea>`;
        break;
    }

    return deGap(i) + `<div class="de-blk" data-i="${i}"
        ondragover="deDragOver(${i},event)" ondrop="deDrop(${i},event)">
      <div class="de-blk-hd" draggable="true" ondragstart="deDragStart(${i},event)" ondragend="deDragEnd()">
        <span class="de-grip" title="Drag to move this block">⠿</span>
        <span class="de-blk-name">${DE_BLOCKS[b.t]?.name || b.t}</span>
        <button onclick="deBlkMove(${i},-1)" title="Move up">↑</button>
        <button onclick="deBlkMove(${i},1)"  title="Move down">↓</button>
        <button onclick="deBlkDup(${i})"     title="Duplicate block">⧉</button>
        <button onclick="deBlkDel(${i})"     title="Delete block">🗑</button>
      </div>
      <div class="de-blk-bd">${body}</div>
    </div>`;
  }).join('') + deGap(blocks.length, { always:true });

  // A copy published before the editor's own surfaces were exempted from
  // read-only mode can arrive with contenteditable off; re-arm it here.
  host.querySelectorAll('[data-rich]').forEach(el => { el.contentEditable = 'true'; });
}

/* ═══ PUBLISH SUPPORT ════════════════════════════════════ */

/* Only this page's public entries are baked into it — the landing page
   carries no dev-log data at all, which is what keeps it small. */
function dlPageData() {
  if (!IS_PROJECT) return {};
  const all = dlPublicData();
  return all[PAGE.id] ? { [PAGE.id]: all[PAGE.id] } : {};
}

/* Only public entries are baked into the page. */
function dlPublicData() {
  const out = {};
  Object.keys(DEVLOG).forEach(p => {
    const pub = dlEntries(p).filter(e => !e.private);
    if (pub.length) out[p] = pub;
  });
  return out;
}

/* Same public data, but with every image and clip embedded, so an
   exported file works with no assets/ folder next to it. */
async function dlExportData() {
  const data = JSON.parse(JSON.stringify(dlPageData()));
  const refs = [];
  const take = r => { if (r && r.path) refs.push(r); };
  Object.values(data).forEach(list => (list || []).forEach(e => {
    take(e.hero);
    (e.blocks || []).forEach(b => { take(b.src); take(b.a); take(b.b); dlGalItems(b).forEach(take); });
  }));
  for (const r of refs) {
    if (MEDIA_CACHE[r.path]) { r.data = MEDIA_CACHE[r.path]; continue; }
    try {
      const rec = await mediaTx('readonly', s => s.get(r.path));
      if (rec && rec.data) r.data = rec.data;   // no local copy → falls back to the path
    } catch (e) {}
  }
  return data;
}

/* Called after a successful publish: media is live, slugs freeze. */
async function dlMarkPublished(paths) {
  for (const p of paths) {
    try {
      const rec = await mediaTx('readonly', s => s.get(p));
      if (rec) await mediaPut(Object.assign({}, rec, { published:true }));
    } catch (e) {}
    delete MEDIA_CACHE[p];
  }
  Object.keys(DEVLOG).forEach(pr => dlEntries(pr).forEach(e => { if (!e.private) e.published = true; }));
  dlSave();
  dlUpdatePendingBadge();
}

/* ═══ BOOT ═══════════════════════════════════════════════ */
dlLoad();
mediaBoot();
loadTheme();
loadSaved();
loadSavedImages();

if (IS_PROJECT) {
  initGalleries();
  dlMountLog();
}
dlRoute();

/* projects/x.html?edit=1 — arriving from "Open ✏" on the landing page. The
   param alone opens nothing: edHandoffTake() requires that this same tab was
   already in edit mode when it followed the link. */
const _q = new URLSearchParams(location.search);
if (_q.get('edit') && edHandoffTake()) {
  toggleEdit();
  switchTab('devlog', document.querySelectorAll('.ep-tab')[2]);
  if (_q.get('new')) dlAddEntry();
}
