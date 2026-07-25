# Raspberry Pi mirror

An Angular smart-mirror interface designed to run full-screen on a Raspberry Pi.
Nginx serves the UI, and a deliberately small .NET API persists the shared note
and pet preferences to one SQLite file.

There is no AI agent, remote-management page, application account, or database
server. Spotify uses Authorization Code with PKCE directly in the Pi's Chromium
browser.

## Architecture

```text
Chromium kiosk
    |
    v
Nginx (127.0.0.1:80)
    |-- Angular static files
    `-- /api/* --> .NET (127.0.0.1:5000) --> /var/lib/mirror/mirror.db

Chromium -- HTTPS --> Spotify Web API
```

SQLite is embedded in the .NET process. `mirror.db` is an ordinary file on the
Pi, not a separate service.

Spotify's access token, refresh token, and expiry are stored in the persistent
Chromium profile under the `spotify.tokens` local-storage key. Clearing that
profile disconnects Spotify and requires authorization again.

## Local development

Requirements:

- Node.js 22
- .NET 10 SDK

Run the API:

```powershell
cd backend
dotnet run
```

Run Angular in a second terminal:

```powershell
cd frontend
npm install
npm start
```

The Angular development server runs at `http://127.0.0.1:4200` and proxies
`/api` to `http://127.0.0.1:5000`.

Run checks:

```powershell
cd backend.Tests
dotnet test

cd ../frontend
npm test
npm run build
```

## Spotify configuration

1. Create an application in the Spotify developer dashboard.
2. For the installed Pi, register this redirect URI exactly:

   ```text
   http://127.0.0.1/
   ```

3. Put the public client ID in `/etc/mirror/config.js`:

   ```js
   window.__MIRROR_CONFIG__ = {
     spotifyClientId: 'YOUR_CLIENT_ID',
     spotifyRedirectUri: 'http://127.0.0.1/',
   };
   ```

4. Reload the kiosk and choose **Connect Spotify** using the Rii keyboard.

PKCE does not use a Spotify client secret. Do not add one to the UI or backend.
Spotify playback control requires a Premium account and an active Spotify
device.

For local Angular development, register `http://127.0.0.1:4200/` as an
additional redirect and temporarily use that value in `frontend/public/config.js`.

## Raspberry Pi installation

Use 64-bit Raspberry Pi OS with the desktop. Install:

- Nginx
- Chromium
- Node.js 22 and npm
- .NET 10 SDK and ASP.NET Core runtime

After cloning this repository, run:

```bash
sudo bash ./deploy/pi/install.sh
```

The installer:

- builds Angular and publishes .NET;
- installs the UI under `/opt/mirror/ui`;
- installs the API under `/opt/mirror/api`;
- creates the `mirror-api` system user and `/var/lib/mirror`;
- enables Nginx and the API systemd unit;
- adds Chromium kiosk startup to the current desktop user;
- preserves an existing `/etc/mirror/config.js` during updates.

Edit `/etc/mirror/config.js` with the Spotify client ID, then log out and back
in or restart Chromium. The kiosk always uses a persistent profile at:

```text
~/.local/state/mirror/chromium
```

### Operations

```bash
sudo systemctl status mirror-api nginx
sudo journalctl -u mirror-api -f
curl http://127.0.0.1/api/health
```

To update, pull the repository and run the installer again.

To back up persistent data:

```bash
sudo systemctl stop mirror-api
sudo cp /var/lib/mirror/mirror.db /path/to/backup/mirror.db
sudo systemctl start mirror-api
```

Back up `~/.local/state/mirror/chromium` as well if retaining the Spotify login
is important. Treat that browser-profile backup as sensitive because it contains
the Spotify refresh token.

## Persisted state

Stored in SQLite:

- the shared note;
- the active pet;
- per-pet names.

Stored only in the Chromium profile:

- Spotify PKCE tokens;
- themes, lighting, widget layout, habitat, pet energy, and other display-local
  preferences.

The API database path is configurable with `Database__Path`; development
defaults to `backend/mirror.db`.
