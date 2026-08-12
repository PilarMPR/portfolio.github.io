#!/usr/bin/env bash
# Runtime smoke test. Loads all nine pages in WebKitGTK and fails on anything
# that throws. No output but the final "ok" line = all clear.
#   bash docs/smoke.sh
#
# checks.sh proves site.js parses; this proves it *runs*. It needs a display
# (DISPLAY or WAYLAND_DISPLAY) and gjs with the WebKit2-4.1 typelib. Where those
# are missing it says SKIPPED and exits 0 — a check that cannot run must say so,
# never pass quietly.
set -u
cd "$(dirname "$0")/.." || exit 1
export LC_ALL=C

if ! command -v gjs >/dev/null 2>&1; then
  echo "SKIPPED runtime smoke: no gjs on PATH"; exit 0
fi
if ! gjs -c 'imports.gi.versions.WebKit2="4.1"; imports.gi.WebKit2;' >/dev/null 2>&1; then
  # Failure here is usually the snap-env problem below, not a missing typelib,
  # so only trust it after the strip.
  :
fi
if [ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  echo "SKIPPED runtime smoke: no display"; exit 0
fi

# The editor and asset inlining need http; file:// will not do.
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT

for _ in $(seq 40); do
  python3 -c "import socket,sys;s=socket.socket();sys.exit(s.connect_ex(('127.0.0.1',$PORT)))" && break
  sleep 0.1
done

PAGES="index.html,$(ls projects/*.html | tr '\n' ',' | sed 's/,$//')"

# The same handler names checks.sh resolves statically — asserted here as
# actually-defined functions on window, which is what the markup needs.
FNS=$(grep -ohE '\bon[a-z]+="[^"]*"' index.html projects/*.html shared/site.js \
  | grep -oE '[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*\(' | tr -d ' (' | sort -u | tr '\n' ',' | sed 's/,$//')

# VS Code's snap exports GTK/GDK module paths that make gjs load snap's glibc
# and die with "undefined symbol: __libc_pthread_init". Stripping them is what
# makes a real engine usable from this shell at all.
env -u GTK_PATH -u GTK_EXE_PREFIX -u GTK_IM_MODULE_FILE \
    -u GDK_PIXBUF_MODULE_FILE -u GDK_PIXBUF_MODULEDIR -u GIO_MODULE_DIR \
    -u GSETTINGS_SCHEMA_DIR -u LOCPATH -u XDG_DATA_DIRS -u XDG_DATA_HOME \
    gjs docs/smoke.js "http://127.0.0.1:$PORT" "$PAGES" "$FNS" 2>/dev/null
