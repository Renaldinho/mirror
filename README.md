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

## Pi help inside the mirror

Choose **Menu → Help** to read the Pi instructions without closing the kiosk.
The guide covers updates, closing/reopening the kiosk, SSH, usernames and IPs,
password changes, audio, diagnostics, and shutdown. **Save TXT** downloads a copy.
Close it with the close button or Escape.

`PI-INSTRUCTIONS.txt` at the repo root is the source of truth. The frontend npm
scripts embed it in the UI and copy it into the downloadable assets before
serving, building, or testing. Reading Help makes no separate file request and
works without an internet connection. Running its commands requires a Pi keyboard
or an SSH connection from another device; the browser does not open a terminal.

## Arrange widgets

Use the visible grip handle at the left of each widget header. In landscape,
drag to position the widget freely; bounds follow its displayed size. In
portrait, drag onto another widget to change the grid order. The order is saved,
and the widget's landscape coordinates are retained when rotating the display.
Pinned widgets stay fixed; the pin/unpin button is available in both orientations.
You can also focus the grip handle and use **Alt + arrow keys** to move or reorder.
Header buttons and widget contents are separate from the handle, so using them
does not start a drag.

## Spotify (optional)

1. Create an app in the [Spotify developer dashboard](https://developer.spotify.com/dashboard).
2. Register this redirect URI **exactly** for the installed Pi: `http://127.0.0.1:80/`
3. Put the (public) client ID in `frontend/public/config.js` in your checkout:

   ```js
   window.__MIRROR_CONFIG__ = {
     spotifyClientId: 'YOUR_CLIENT_ID',
     spotifyRedirectUri: 'http://127.0.0.1:80/',
   };
   ```

The client ID is public and can be committed in `frontend/public/config.js`.
Each Pi install/update copies this file to `/etc/mirror/config.js`, which Nginx
serves without caching. A differing previous Pi config is backed up alongside
it as `config.js.backup.*`. Repo configuration is the source of truth; edits
only in `/etc/mirror/config.js` will be replaced on the next update. For local
development on port 4200, register `http://127.0.0.1:4200/`; the checked-in config
already chooses the redirect URI based on the port.

4. Reload the kiosk (Ctrl+R) and choose **Connect Spotify**.

It uses PKCE, so there's no client secret — never add one. Controlling playback
needs a Spotify Premium account with an active device.

## Alarm

Add **Alarm** from the Widgets menu. Pick a time, switch **Alarm on**, and use
**Preview laugh + popup** to check the sound. The first ringtone is **Petah
Gryffin**: Peter Griffin's laugh repeats alongside a face popup until you stop
it or snooze for five minutes. Alarms fire once; a time that has passed is set
for tomorrow. Time and settings use the mirror's local timezone and survive
reloads. Removing the widget cancels its alarm. Keep the mirror app running.

The updated Pi kiosk launcher allows alarm audio after a reboot without a
click. Restart the kiosk after updating to apply that launcher setting. Normal
browsers may require a click; the popup offers **Play sound** if audio is
blocked. Audio and image assets are bundled locally; their sources are listed
in [`frontend/public/alarms/ASSETS.md`](frontend/public/alarms/ASSETS.md).

## Pong

Open **Menu → Games → Pong**. Play against the AI representing your selected
companion (or Computer if no pet is selected). Pick Easy, Normal, or Hard;
first to seven points wins. The saved high score is your longest rally.

Move your mouse/controller pointer or drag on the court to move your paddle.
Arrow keys or W/S work in landscape; left/right or A/D work in portrait.
The portrait court rotates so your paddle is at the bottom. Use **P**, Space,
or the pause button to pause, then **Resume match** to continue. Losing focus,
hiding the tab, or opening an alarm pauses the match automatically. The shared
game mute and app volume controls apply to Pong's sounds.

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

For display, throttling, memory, Chromium, service, and health details:

```bash
/opt/mirror/bin/mirror-diagnose
```

Native 4K displays use lightweight rendering defaults. Animated game
canvases have a 1080p pixel budget (75% fewer pixels at 4K), while the dashboard
and pointer coordinates retain the display's native resolution. These canvas
effects can look softer on large displays. Pet controls move with transforms
instead of changing their layout positions on every frame. The
retro pointer FX is off by default; it can still be enabled from the `FX` control.
Its trail uses a moving 512×512 canvas, draws at most 30 times per second, and
keeps at most 48 particles, including click bursts. Older trails are clipped
outside the area around the pointer. Interface
icons are bundled SVGs, so they do not depend on Raspberry Pi OS symbol or emoji
fonts.

If `http://127.0.0.1/` shows the default Nginx page, or the health request
fails, update the checkout and rerun the installer:

```bash
cd ~/mirror-agent                    # use the folder where you cloned it
git pull --ff-only
sudo bash deploy/pi/install.sh
```

The installer now removes Raspberry Pi OS's default Nginx site, restarts both
services, and verifies the UI plus the direct and proxied API before reporting
success, including verifying that `/config.js` matches the checkout.
Reinstalling preserves `/var/lib/mirror/mirror.db` and backs up a differing old
Pi config before syncing the repo config. If it fails, the command prints the API status and
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
