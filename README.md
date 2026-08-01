# Mirror

A full-screen smart-mirror dashboard that runs on a Raspberry Pi. It shows a
dark-academia board of draggable widgets — clock, weather, notes, Spotify
now-playing, a desktop pet, and mini-games — that you scale, collapse, and
arrange. A small local .NET + SQLite API stores the shared note and pet choices.
Everything runs on the Pi; nothing is in the cloud.

## Set up on a Raspberry Pi

Needs **64-bit Raspberry Pi OS (Desktop)**. From a terminal on the Pi:

```bash
git clone https://github.com/Renaldinho/mirror-agent.git
cd mirror-agent
sudo bash deploy/pi/bootstrap.sh   # installs Nginx, Chromium, Node 22, .NET 10
sudo bash deploy/pi/install.sh     # builds the app and enables it on boot
sudo reboot                        # comes back up full-screen in kiosk mode
```

That's the whole install. After the reboot the mirror runs full-screen, and the
API and web server start automatically every boot.

## Update to the latest version

```bash
cd ~/mirror-agent
bash deploy/pi/update.sh
```

Pulls the newest version, rebuilds, and restarts the service. See
[`deploy/pi/UPDATING.md`](deploy/pi/UPDATING.md) for options (`--reboot`,
`--force`), health checks, logs, and backups.

## Spotify (optional)

1. Create an app in the [Spotify developer dashboard](https://developer.spotify.com/dashboard).
2. Register this redirect URI **exactly**: `http://127.0.0.1/`
3. Put the (public) client ID in `/etc/mirror/config.js` on the Pi:

   ```js
   window.__MIRROR_CONFIG__ = {
     spotifyClientId: 'YOUR_CLIENT_ID',
     spotifyRedirectUri: 'http://127.0.0.1/',
   };
   ```

4. Reload the kiosk (Ctrl+R) and choose **Connect Spotify**.

It uses PKCE, so there's no client secret — never add one. Controlling playback
needs a Spotify Premium account with an active device.

## Check it's running / troubleshooting

> These commands only work **after** `install.sh` has run — that's what creates
> the `mirror-api` service. If you see *"Unit mirror-api.service could not be
> found,"* the install hasn't completed (usually a missing prerequisite — re-run
> `bootstrap.sh`, then `install.sh`).

```bash
systemctl status mirror-api nginx     # both should be "active (running)"
curl http://127.0.0.1/api/health      # -> {"status":"ok"}
sudo journalctl -u mirror-api -f      # live API log (Ctrl+C to stop)
```

If `http://127.0.0.1/` shows the default Nginx page, or the health request
fails, update the checkout and rerun the installer:

```bash
cd ~/mirror-agent                    # use the folder where you cloned it
git pull --ff-only
sudo bash deploy/pi/install.sh
```

The installer now removes Raspberry Pi OS's default Nginx site, restarts both
services, and verifies the UI plus the direct and proxied API before reporting
success. Reinstalling preserves `/etc/mirror/config.js` and
`/var/lib/mirror/mirror.db`. If it fails, the command prints the API status and
recent logs instead of leaving a silently broken installation.

## Develop on your PC (optional)

Needs Node.js 22 and the .NET 10 SDK.

```bash
# API (the runnable project of the layered solution)
dotnet run --project backend/src/Mirror.Server

# UI, in a second terminal — serves http://127.0.0.1:4200, proxies /api to :5000
cd frontend
npm install
npm start

# tests
dotnet test backend.Tests
cd frontend && npm test
```

## How it fits together

```text
Chromium kiosk
    |
    v
Nginx (127.0.0.1:80)
    |-- Angular static files (the dashboard UI)
    `-- /api/* --> .NET API (127.0.0.1:5000) --> /var/lib/mirror/mirror.db
```

The .NET API is a small onion-layered solution under `backend/` (Domain /
Application / Infrastructure / `Mirror.Server`) with SQLite embedded in the
process — `mirror.db` is just a file, not a separate database service. The
Angular app lives in `frontend/`. Spotify talks to its Web API directly from
Chromium; its tokens live in the browser profile, not on the server.
