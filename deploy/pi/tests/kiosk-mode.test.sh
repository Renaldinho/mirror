#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fixture="$(mktemp -d)"
launcher=""
cleanup() {
  if [[ -n "$launcher" ]]; then kill "$launcher" 2>/dev/null || true; wait "$launcher" 2>/dev/null || true; fi
  rm -f -- "$fixture/bin/chromium" "$fixture/bin/flock" "$fixture/log" "$fixture/lock" "$fixture/control/"* "$fixture/state/mirror/chromium/launcher.lock"
  rmdir -- "$fixture/state/mirror/chromium" "$fixture/state/mirror" "$fixture/state" "$fixture/control" "$fixture/bin" "$fixture"
}
trap cleanup EXIT
mkdir -p "$fixture/bin" "$fixture/control"
cat > "$fixture/bin/chromium" <<'BROWSER'
#!/usr/bin/env bash
trap 'exit 0' TERM INT
printf '%s\n' "$*" >> "$KIOSK_TEST_LOG"
while true; do sleep .1; done
BROWSER
# Git Bash lacks flock; model a held lock to test the duplicate-launch path too.
cat > "$fixture/bin/flock" <<'LOCK'
#!/usr/bin/env bash
[[ ! -f "$KIOSK_TEST_LOCK" ]] || exit 1
touch "$KIOSK_TEST_LOCK"
LOCK
chmod +x "$fixture/bin/chromium" "$fixture/bin/flock"
export PATH="$fixture/bin:$PATH" XDG_STATE_HOME="$fixture/state"
export MIRROR_KIOSK_CONTROL_DIR="$fixture/control" KIOSK_TEST_LOG="$fixture/log" KIOSK_TEST_LOCK="$fixture/lock"
bash "$script_dir/../mirror-kiosk" &
launcher=$!
wait_mode() {
  for _ in {1..80}; do
    if [[ -f "$fixture/control/applied-mode" ]] && [[ "$(cat "$fixture/control/applied-mode")" == "$1" ]]; then return 0; fi
    sleep .1
  done
  echo "Did not switch to $1" >&2; exit 1
}
wait_mode kiosk
grep -q -- '--kiosk' "$fixture/log"
printf 'desktop\n' > "$fixture/control/requested-mode"
wait_mode desktop
grep -q -- '--new-window --window-size=1000,760' "$fixture/log"
printf 'invalid-command\n' > "$fixture/control/requested-mode"
sleep 1.2
[[ "$(cat "$fixture/control/applied-mode")" == desktop ]]
bash "$script_dir/../mirror-kiosk"
wait_mode kiosk
[[ "$(wc -l < "$fixture/log")" -eq 3 ]]
[[ -f "$fixture/control/heartbeat" ]]
kill "$launcher"
wait "$launcher" || true
launcher=""
[[ ! -f "$fixture/control/heartbeat" ]]
echo 'Kiosk / desktop / kiosk switching checks passed.'
