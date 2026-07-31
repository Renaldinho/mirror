#!/usr/bin/env bash
#
# Pull the latest mirror-agent and re-deploy it on this Raspberry Pi.
#
# Run as your normal desktop user (NOT with sudo) — it calls sudo itself where
# needed, so that `git pull` keeps the repo owned by you:
#
#   bash deploy/pi/update.sh            # update if there are new commits
#   bash deploy/pi/update.sh --force    # rebuild even if already up to date
#   bash deploy/pi/update.sh --reboot   # update, then reboot to refresh the display
#
set -euo pipefail

# Refuse root so `git pull` doesn't leave root-owned files in the repo.
if [[ $EUID -eq 0 ]]; then
  echo "Run this WITHOUT sudo, as your normal desktop user. It will ask for sudo when needed." >&2
  exit 1
fi

force=0
reboot=0
for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    --reboot) reboot=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

branch="$(git rev-parse --abbrev-ref HEAD)"

# Refuse to pull over local edits rather than risk clobbering them.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "The repo has local changes, so it won't be updated automatically." >&2
  echo "  See them:      git -C \"$repo_root\" status" >&2
  echo "  Keep them:     git -C \"$repo_root\" stash    (re-apply later with: git stash pop)" >&2
  echo "  Discard them:  git -C \"$repo_root\" reset --hard   (destroys local changes)" >&2
  exit 1
fi

echo "==> Fetching latest on '$branch'..."
before="$(git rev-parse HEAD)"
git pull --ff-only origin "$branch"
after="$(git rev-parse HEAD)"

if [[ "$before" == "$after" ]]; then
  echo "==> Already up to date ($after)."
  if [[ $force -eq 0 ]]; then
    echo "    Nothing to rebuild. Use --force to rebuild anyway."
    exit 0
  fi
  echo "    --force given: rebuilding anyway."
else
  echo "==> Updated ${before:0:8} -> ${after:0:8}"
  git --no-pager log --oneline "$before..$after" | sed 's/^/       /'
fi

echo "==> Rebuilding and reinstalling (this takes a few minutes on a Pi)..."
sudo bash "$repo_root/deploy/pi/install.sh"

if [[ $reboot -eq 1 ]]; then
  echo "==> Rebooting to refresh the display..."
  sudo reboot
else
  echo
  echo "Done. The API service (mirror-api) was restarted automatically."
  echo "To show the new UI on the mirror: press Ctrl+R on the kiosk keyboard,"
  echo "or re-run with --reboot for a clean restart."
fi
