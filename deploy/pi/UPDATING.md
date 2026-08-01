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

> Note: `/etc/mirror/config.js` (your Spotify client ID) is **not** in the repo,
> so updates never touch it.

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

If the browser shows the default Nginx page or that health request fails, repair
the installed copy with:

```bash
cd ~/mirror-agent                    # use the folder where you cloned it
git pull --ff-only
sudo bash deploy/pi/install.sh
```

The installer replaces the default Nginx site and verifies the UI, backend, and
API proxy before it reports success. It preserves `/etc/mirror/config.js` and
`/var/lib/mirror/mirror.db`. When verification fails it prints the backend
status and recent service logs for diagnosis.

## Watch logs / see errors

```bash
sudo journalctl -u mirror-api -f        # live API log (Ctrl+C to stop)
sudo journalctl -u mirror-api -n 100    # last 100 lines
```

## Restart things by hand

```bash
sudo systemctl restart mirror-api       # restart just the API
sudo systemctl reload nginx             # reload the web server
sudo reboot                             # full restart (also refreshes the kiosk)
```

## Configure Spotify

```bash
sudo nano /etc/mirror/config.js         # set spotifyClientId, then Ctrl+R on the kiosk
```

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
