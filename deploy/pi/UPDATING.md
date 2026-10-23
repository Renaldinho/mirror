# Mirror — Raspberry Pi cheat sheet

Everything runs on the Pi itself: Nginx serves the UI on port 80 and proxies
`/api` to the .NET service (`mirror-api`) on `127.0.0.1:5000`, which stores data
in one SQLite file at `/var/lib/mirror/mirror.db`.

The repo lives wherever you cloned it (e.g. `~/mirror-agent`). Run every command
below from inside that folder.

---

The repo is public, so the Pi pulls over HTTPS with no credentials needed. If
you ever cloned it with a token in the URL, reset the remote to the clean URL:

```bash
git -C ~/mirror-agent remote set-url origin https://github.com/Renaldinho/mirror-agent.git
```

---

## Update to the latest version

Run as your normal desktop user — **not** with sudo (the script uses sudo itself):

```bash
cd ~/mirror-agent            # wherever you cloned it
bash deploy/pi/update.sh
```

This pulls the newest commits, rebuilds the UI + API, reinstalls, and restarts
the `mirror-api` service. Then, to show the new UI on the screen, press **Ctrl+R**
on the kiosk keyboard — or do a clean restart instead:

```bash
bash deploy/pi/update.sh --reboot
```

Useful variants:

- `bash deploy/pi/update.sh --force` — rebuild even if there are no new commits.
- If it says *"the repo has local changes"*, you edited a tracked file on the Pi.
  Keep your edits with `git stash` (re-apply later with `git stash pop`), or throw
  them away with `git reset --hard`, then run the update again.

> Every install/update syncs `frontend/public/config.js` from the repo to
> `/etc/mirror/config.js`. If the previous Pi copy differs, it is backed up as
> `/etc/mirror/config.js.backup.*` before replacement. Commit and push your public
> Spotify configuration so the Pi receives it with the rest of the app.

---

## Do it manually (what the script does)

```bash
cd ~/mirror-agent
git pull --ff-only origin main
sudo bash deploy/pi/install.sh
```

---

## Check it's healthy

```bash
systemctl status mirror-api nginx      # both should be "active (running)"
curl http://127.0.0.1/api/health       # -> {"status":"ok"}
```

Collect hardware, display, throttling, Chromium, memory, and service details:

```bash
/opt/mirror/bin/mirror-diagnose
```

If the browser shows the default Nginx page or that health request fails, repair
the installed copy with:

```bash
cd ~/mirror-agent                    # use the folder where you cloned it
git pull --ff-only
sudo bash deploy/pi/install.sh
```

The installer replaces the default Nginx site and verifies the UI, backend, and
API proxy and served browser config before it reports success. It preserves
`/var/lib/mirror/mirror.db` and backs up a differing Pi config before syncing
the repo config. When verification fails it prints the backend
status and recent service logs for diagnosis.

## Watch logs / see errors

```bash
sudo journalctl -u mirror-api -f        # live API log (Ctrl+C to stop)
sudo journalctl -u mirror-api -n 100    # last 100 lines
```

## Restart things by hand

With the updated launcher, **Menu → Settings → Desktop mode** exits fullscreen
for Wi-Fi setup. **Return to kiosk** restores it. The desktop **Mirror** shortcut
reopens the kiosk or returns an existing normal mirror window to kiosk mode.
Reboot once after installing this update to enable the new launcher.

```bash
sudo systemctl restart mirror-api       # restart just the API
sudo systemctl reload nginx             # reload the web server
sudo reboot                             # full restart (also refreshes the kiosk)
```

## Configure Spotify

```bash
nano frontend/public/config.js         # set the public Spotify client ID
sudo bash deploy/pi/install.sh         # sync config and rebuild
```

The checked-in config selects port 4200 for development and port 80 on the Pi.
Reload Chromium after installation to apply it. Make persistent changes in the
repo file; editing only `/etc/mirror/config.js` is temporary until the next update.

## Back up the data (the note, pet names, active pet)

```bash
sudo systemctl stop mirror-api
sudo cp /var/lib/mirror/mirror.db ~/mirror-backup.db
sudo systemctl start mirror-api
```

---

## Where things live

| What                     | Path                                   |
|--------------------------|----------------------------------------|
| Source repo              | `~/mirror-agent` (wherever you cloned) |
| Installed UI (served)    | `/opt/mirror/ui`                       |
| Installed API (running)  | `/opt/mirror/api/Mirror.Server.dll`    |
| Database (SQLite)        | `/var/lib/mirror/mirror.db`            |
| Spotify config           | `/etc/mirror/config.js`                |
| API service unit         | `/etc/systemd/system/mirror-api.service` |
