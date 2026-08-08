// Runtime smoke test — loads every page in a real engine (WebKitGTK) and
// reports anything that throws. Not run directly: use `bash docs/smoke.sh`,
// which starts the http server and strips the snap env vars that otherwise
// break GTK module loading.
//
// Why this exists: checks.sh proves site.js *parses*. Parsing is not running.
// A ReferenceError in a handler, a missing element dereferenced at load, a
// broken template literal — all of it compiles fine and dies in the browser.
//
// ARGV: <base-url> <comma-separated page paths> <comma-separated handler names>
imports.gi.versions.Gtk = '3.0';
imports.gi.versions.WebKit2 = '4.1';
const { Gtk, WebKit2, GLib } = imports.gi;

const [BASE, PAGES_CSV, FNS_CSV] = ARGV;
const PAGES = PAGES_CSV.split(',').filter(s => s.length);
const FNS = JSON.stringify(FNS_CSV.split(',').filter(s => s.length));
const SENTINELS = '["cursor","nav","nav-logo","fmt-bar","lightbox","de-toast"]';

Gtk.init(null);

// Installed before any page script runs, so it catches load-time throws too.
const ucm = new WebKit2.UserContentManager();
ucm.add_script(WebKit2.UserScript.new(
  'window.__errs = [];' +
  'window.onerror = function (m, s, l) { window.__errs.push(String(m) + " @ " + s + ":" + l); };' +
  'window.addEventListener("unhandledrejection", function (e) { window.__errs.push("unhandledrejection: " + e.reason); });',
  WebKit2.UserContentInjectedFrames.TOP_FRAME,
  WebKit2.UserScriptInjectionTime.START, null, null));

const PROBE = `JSON.stringify({
  title: document.title,
  role: (window.PAGE || {}).role || null,
  errs: window.__errs || [],
  missingEls: ${SENTINELS}.filter(function (id) { return !document.getElementById(id); }),
  missingFns: ${FNS}.filter(function (n) { return typeof window[n] !== "function"; }),
  themed: !!getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
  // The landing page is <section>s, case studies are .sh-sec — count both, and
  // require rendered text too, so a page that keeps its shell but loses its
  // body still fails.
  blocks: document.querySelectorAll("section, .sh-sec").length,
  // textContent, not innerText: case-study sections are revealed by an
  // IntersectionObserver, so offscreen they are display:none and innerText
  // reports ~200 chars on every project page regardless of content.
  textLen: (document.body.textContent || "").trim().length
})`;

const win = new Gtk.OffscreenWindow();
const view = new WebKit2.WebView({ user_content_manager: ucm });
win.add(view);
win.set_default_size(1280, 900);   // a 0x0 viewport makes every media query and
win.show_all();                    // IntersectionObserver behave unlike a browser

const loop = GLib.MainLoop.new(null, false);
let idx = 0, failed = 0;

function finish() {
  print(failed ? `FAIL ${failed} of ${PAGES.length} page(s)` : `ok ${PAGES.length} pages`);
  loop.quit();
}

function report(page, raw) {
  let r;
  try { r = JSON.parse(raw); }
  catch (e) { print(`RUNTIME ${page}: probe returned junk: ${raw}`); failed++; return; }
  const bad = [];
  r.errs.forEach(e => bad.push(`threw: ${e}`));
  if (r.missingEls.length) bad.push(`missing elements: ${r.missingEls.join(', ')}`);
  if (r.missingFns.length) bad.push(`handlers not defined at runtime: ${r.missingFns.join(', ')}`);
  if (!r.role) bad.push('window.PAGE never set — site.js did not reach the page contract');
  if (!r.themed) bad.push('--bg unset — applyTheme() did not run');
  if (!r.blocks) bad.push('no <section>/.sh-sec rendered — page structure is gone');
  if (r.textLen < 1000) bad.push(`only ${r.textLen} chars of body text — page is empty`);
  if (bad.length) { failed++; bad.forEach(b => print(`RUNTIME ${page}: ${b}`)); }
}

function next() {
  if (idx >= PAGES.length) return finish();
  const page = PAGES[idx++];
  let done = false;
  const hid = view.connect('load-changed', (v, ev) => {
    if (ev !== WebKit2.LoadEvent.FINISHED || done) return;
    done = true;
    view.disconnect(hid);
    // Let deferred work (dlLoad, mediaBoot, observers) settle before probing.
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 700, () => {
      view.run_javascript(PROBE, null, (o, res) => {
        try { report(page, o.run_javascript_finish(res).get_js_value().to_string()); }
        catch (e) { print(`RUNTIME ${page}: probe failed: ${e.message}`); failed++; }
        next();
      });
      return false;
    });
  });
  view.load_uri(BASE + '/' + page);
}

GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 90, () => {
  print('RUNTIME: timed out waiting for pages to load');
  failed++; finish(); return false;
});

next();
loop.run();
imports.system.exit(failed ? 1 : 0);
