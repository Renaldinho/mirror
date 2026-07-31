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
for tool in npm dotnet nginx; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "Missing prerequisite: $tool" >&2
    exit 1
  }
done

sudo -u "$kiosk_user" npm ci --prefix "$repo_root/frontend"
sudo -u "$kiosk_user" npm run build --prefix "$repo_root/frontend"
sudo -u "$kiosk_user" dotnet publish \
  "$repo_root/backend/src/Mirror.Server/Mirror.Server.csproj" \
  --configuration Release \
  --output "$repo_root/.publish/api"

id mirror-api >/dev/null 2>&1 ||
  useradd --system --home /var/lib/mirror --shell /usr/sbin/nologin mirror-api

install -d -m 0755 /opt/mirror/ui /opt/mirror/api /opt/mirror/bin /etc/mirror
install -d -o mirror-api -g mirror-api -m 0750 /var/lib/mirror

cp -a "$repo_root/frontend/dist/frontend/browser/." /opt/mirror/ui/
cp -a "$repo_root/.publish/api/." /opt/mirror/api/
install -m 0755 "$repo_root/deploy/pi/mirror-kiosk" /opt/mirror/bin/mirror-kiosk

if [[ ! -f /etc/mirror/config.js ]]; then
  install -m 0644 "$repo_root/frontend/public/config.js" /etc/mirror/config.js
fi

install -m 0644 "$repo_root/deploy/pi/nginx-mirror.conf" /etc/nginx/sites-available/mirror
ln -sfn /etc/nginx/sites-available/mirror /etc/nginx/sites-enabled/mirror
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  unlink /etc/nginx/sites-enabled/default
fi

install -m 0644 "$repo_root/deploy/pi/mirror-api.service" /etc/systemd/system/mirror-api.service

kiosk_home="$(getent passwd "$kiosk_user" | cut -d: -f6)"
install -d -o "$kiosk_user" -g "$kiosk_user" -m 0755 "$kiosk_home/.config/autostart"
install -o "$kiosk_user" -g "$kiosk_user" -m 0644 \
  "$repo_root/deploy/pi/mirror-kiosk.desktop" \
  "$kiosk_home/.config/autostart/mirror-kiosk.desktop"

nginx -t
systemctl daemon-reload
systemctl enable --now mirror-api
systemctl enable --now nginx
systemctl reload nginx

echo
echo "Mirror installed. Configure /etc/mirror/config.js, then restart Chromium."
