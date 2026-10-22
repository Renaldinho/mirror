#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fixture="$(mktemp -d)"
cleanup() {
  rm -f -- "$fixture"/*.js "$fixture"/*.backup.*
  rmdir -- "$fixture"
}
trap cleanup EXIT
source_config="$fixture/repo-config.js"
target_config="$fixture/pi-config.js"
sync_config() { bash "$script_dir/../install-config.sh" "$source_config" "$target_config"; }

printf '%s\n' 'window.__MIRROR_CONFIG__ = {spotifyClientId: "current"};' > "$source_config"
sync_config
cmp -s "$source_config" "$target_config"

printf '%s\n' 'window.__MIRROR_CONFIG__ = {spotifyClientId: "old-pi-value"};' > "$target_config"
cp "$target_config" "$fixture/expected-backup.js"
sync_config
cmp -s "$source_config" "$target_config"
backups=("$target_config".backup.*)
[[ ${#backups[@]} -eq 1 ]]
cmp -s "$fixture/expected-backup.js" "${backups[0]}"

# An unchanged update must not accumulate redundant backups.
sync_config
backups=("$target_config".backup.*)
[[ ${#backups[@]} -eq 1 ]]

# A missing source must leave the installed configuration intact.
if bash "$script_dir/../install-config.sh" "$fixture/missing.js" "$target_config"; then
  echo 'Expected a missing-source failure' >&2
  exit 1
fi
cmp -s "$source_config" "$target_config"
echo 'Browser config install checks passed.'
