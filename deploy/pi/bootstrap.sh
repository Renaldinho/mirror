#!/usr/bin/env bash
#
# Install everything the mirror needs on a fresh 64-bit Raspberry Pi OS (Desktop):
# Nginx, Chromium, Node.js 22, and the .NET 10 SDK (system-wide). Run once:
#
#   sudo bash deploy/pi/bootstrap.sh
#
# Then run deploy/pi/install.sh to build and deploy the mirror.
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this with sudo:  sudo bash deploy/pi/bootstrap.sh" >&2
  exit 1
fi

echo "==> Updating package lists..."
apt-get update -y

echo "==> Installing Nginx, Chromium, and basics..."
apt-get install -y nginx git curl ca-certificates
# Chromium is 'chromium-browser' on older images, 'chromium' on newer ones.
apt-get install -y chromium-browser || apt-get install -y chromium

echo "==> Installing Node.js 22..."
if command -v node >/dev/null 2>&1 && node -v | grep -q '^v22\.'; then
  echo "    Node $(node -v) already present, skipping."
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> Installing the .NET 10 SDK (system-wide)..."
if command -v dotnet >/dev/null 2>&1 && dotnet --version 2>/dev/null | grep -q '^10\.'; then
  echo "    .NET $(dotnet --version) already present, skipping."
else
  # The scripted install is the most reliable way to get .NET on ARM64.
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 10.0 --install-dir /usr/lib/dotnet
  rm -f /tmp/dotnet-install.sh
  # Symlink so every user (incl. the mirror-api service account) finds it on PATH.
  ln -sf /usr/lib/dotnet/dotnet /usr/local/bin/dotnet
fi

echo
echo "==> Verifying prerequisites..."
ok=1
node -v      || { echo "MISSING: node" >&2; ok=0; }
dotnet --version || { echo "MISSING: dotnet" >&2; ok=0; }
nginx -v     || { echo "MISSING: nginx" >&2; ok=0; }
if command -v chromium-browser >/dev/null 2>&1; then
  echo "chromium: $(command -v chromium-browser)"
elif command -v chromium >/dev/null 2>&1; then
  echo "chromium: $(command -v chromium)"
else
  echo "MISSING: chromium" >&2; ok=0
fi

echo
if [[ $ok -eq 1 ]]; then
  echo "Prerequisites installed. Next:  sudo bash deploy/pi/install.sh"
else
  echo "Some prerequisites are missing (see above). Fix them, then re-run this script." >&2
  exit 1
fi
