#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi

kiosk_user="${SUDO_USER:-}"
if [[ -z "$kiosk_user" || "$kiosk_user" == root ]]; then
  echo "Run with sudo from the Raspberry Pi desktop account." >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
for tool in npm dotnet nginx curl; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "Missing prerequisite: $tool" >&2
    exit 1
  }
done

publish_dir="$repo_root/.publish/api"

sudo -u "$kiosk_user" npm ci --prefix "$repo_root/frontend"
sudo -u "$kiosk_user" npm run build --prefix "$repo_root/frontend"
rm -rf -- "$publish_dir"
sudo -u "$kiosk_user" dotnet publish \
  "$repo_root/backend/src/Mirror.Server/Mirror.Server.csproj" \
  --configuration Release \
  --output "$publish_dir"

ui_build="$repo_root/frontend/dist/frontend/browser"
if [[ ! -f "$ui_build/index.html" ]]; then
  echo "Frontend build did not produce $ui_build/index.html" >&2
  exit 1
fi
if [[ ! -f "$publish_dir/Mirror.Server.dll" ]]; then
  echo "Backend publish did not produce $publish_dir/Mirror.Server.dll" >&2
  exit 1
fi

id mirror-api >/dev/null 2>&1 ||
  useradd --system --home /var/lib/mirror --shell /usr/sbin/nologin mirror-api

install -d -m 0755 /opt/mirror/ui /opt/mirror/api /opt/mirror/bin /etc/mirror
install -d -o mirror-api -g mirror-api -m 0750 /var/lib/mirror

systemctl stop mirror-api 2>/dev/null || true
find /opt/mirror/ui -mindepth 1 -delete
find /opt/mirror/api -mindepth 1 -delete
cp -a "$ui_build/." /opt/mirror/ui/
cp -a "$publish_dir/." /opt/mirror/api/
install -m 0755 "$repo_root/deploy/pi/mirror-kiosk" /opt/mirror/bin/mirror-kiosk

if [[ ! -f /etc/mirror/config.js ]]; then
  install -m 0644 "$repo_root/frontend/public/config.js" /etc/mirror/config.js
fi

install -m 0644 "$repo_root/deploy/pi/nginx-mirror.conf" /etc/nginx/sites-available/mirror
ln -sfn /etc/nginx/sites-available/mirror /etc/nginx/sites-enabled/mirror
# Raspberry Pi OS normally creates this as a symlink, but remove it even if a
# previous installation or manual change turned it into a regular file.
rm -f /etc/nginx/sites-enabled/default

install -m 0644 "$repo_root/deploy/pi/mirror-api.service" /etc/systemd/system/mirror-api.service

kiosk_home="$(getent passwd "$kiosk_user" | cut -d: -f6)"
install -d -o "$kiosk_user" -g "$kiosk_user" -m 0755 "$kiosk_home/.config/autostart"
install -o "$kiosk_user" -g "$kiosk_user" -m 0644 \
  "$repo_root/deploy/pi/mirror-kiosk.desktop" \
  "$kiosk_home/.config/autostart/mirror-kiosk.desktop"

show_service_diagnostics() {
  echo >&2
  echo "mirror-api status:" >&2
  systemctl status mirror-api --no-pager -l >&2 || true
  echo >&2
  echo "Recent mirror-api logs:" >&2
  journalctl -u mirror-api -n 50 --no-pager >&2 || true
}

wait_for_health() {
  local label="$1"
  local url="$2"
  local response

  for _ in {1..30}; do
    if response="$(curl -fsS --max-time 2 "$url" 2>/dev/null)" &&
       grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' <<<"$response"; then
      echo "    $label is healthy."
      return 0
    fi
    sleep 1
  done

  echo "$label did not become healthy at $url" >&2
  return 1
}

nginx -t
systemctl daemon-reload
systemctl enable mirror-api nginx
systemctl restart mirror-api
if ! wait_for_health "Backend" "http://127.0.0.1:5000/api/health"; then
  show_service_diagnostics
  exit 1
fi

# A restart guarantees that site additions/removals are applied even when this
# machine already had Nginx running before the mirror was installed.
systemctl restart nginx
if ! wait_for_health "Nginx API proxy" "http://127.0.0.1/api/health"; then
  nginx -T >&2 || true
  show_service_diagnostics
  exit 1
fi

ui_response="$(curl -fsS --max-time 5 http://127.0.0.1/)" || {
  echo "Nginx did not serve the mirror UI at http://127.0.0.1/" >&2
  nginx -T >&2 || true
  exit 1
}
if ! grep -q '<app-root' <<<"$ui_response"; then
  echo "http://127.0.0.1/ is not serving the mirror UI." >&2
  echo "Check for another enabled Nginx site in /etc/nginx/sites-enabled/." >&2
  nginx -T >&2 || true
  exit 1
fi

echo
echo "Mirror installed and verified at http://127.0.0.1/."
echo "Configure /etc/mirror/config.js if needed, then restart Chromium."
