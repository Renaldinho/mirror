#!/usr/bin/env bash
# Install the repo's public browser configuration, retaining the previous Pi copy.
set -euo pipefail

source_config="${1:?Usage: install-config.sh SOURCE DESTINATION}"
target_config="${2:?Usage: install-config.sh SOURCE DESTINATION}"

if [[ ! -f "$source_config" ]]; then
  echo "Missing browser configuration: $source_config" >&2
  exit 1
fi

if [[ -f "$target_config" ]] && ! cmp -s "$source_config" "$target_config"; then
  backup="$(mktemp "${target_config}.backup.XXXXXXXX")"
  cp -p -- "$target_config" "$backup"
  echo "Previous browser configuration backed up to $backup"
fi

install -m 0644 "$source_config" "$target_config"
echo "Browser configuration synced from $source_config"
