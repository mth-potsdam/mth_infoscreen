# mth_infoscreen

A facility infoscreen: public transport departures on the left, upcoming
events from a Microsoft 365 List on the right. Designed to run fullscreen in
a browser (e.g. on an Amazon Fire TV Stick) and to be configured entirely
through an admin panel — no redeploys needed to change stops, intervals, or
the events source.

## How it works

- **Display** (`/`) — public, no login. Polls the backend for departures and
  events at admin-configured intervals and always shows the last-known-good
  data with an "Updated Xm ago" indicator if a fetch fails, instead of going
  blank.
- **Admin panel** (`/admin`) — password protected. Configure the facility
  location, pick nearby transit stops, set refresh intervals, and connect a
  Microsoft 365 List.
- **Backend** — a single Node/Express process serves the API, the built
  frontend, and runs two background pollers (departures, events).

## Local development

Requires Node 22+.

```bash
npm run install:all
cp .env.example .env   # fill in ADMIN_PASSWORD, APP_SECRET, APP_USER_AGENT
npm run dev
```

This runs the backend on `http://localhost:3001` and the frontend (with
`/api` proxied to the backend) on `http://localhost:5173`. Generate
`APP_SECRET` with:

```bash
openssl rand -hex 32
```

### Testing the production image with docker-compose

`docker compose up` runs the real production image locally. By default the
admin session cookie is **not** marked `Secure`, so admin login works over
plain HTTP at `http://localhost:3000` — this matches how the app is meant to
run on a local network (see "Deploying on a Synology NAS" below). If you
ever put this app behind a reverse proxy that terminates HTTPS, set
`COOKIE_SECURE=true` in its environment so the cookie is HTTPS-only.

## Header font (Cy)

The display header uses the "Cy" typeface, which is licensed and not
included in this (public) repo. Building the frontend requires these two
files to exist locally — they're gitignored, so a fresh clone won't have
them:

```
frontend/src/assets/fonts/Cy-Regular.woff2
frontend/src/assets/fonts/Cy-ExtraBold.woff2
```

Convert the `.otf` files (e.g. from `~/Library/Fonts/`) with
[fonttools](https://github.com/fonttools/fonttools):

```bash
pip3 install fonttools brotli
python3 -c "
from fontTools.ttLib import TTFont
for src, dst in [
    ('/path/to/Cy-Regular.otf', 'frontend/src/assets/fonts/Cy-Regular.woff2'),
    ('/path/to/Cy-ExtraBold.otf', 'frontend/src/assets/fonts/Cy-ExtraBold.woff2'),
]:
    font = TTFont(src)
    font.flavor = 'woff2'
    font.save(dst)
"
```

Without these files, `vite build` (and therefore the Docker build) fails —
so when setting up a new clone (including the NAS), create the folder and
copy the two `.woff2` files over before building, e.g.:

```bash
ssh <user>@<nas-ip> "mkdir -p /volume1/docker/mth_infoscreen/frontend/src/assets/fonts"
scp frontend/src/assets/fonts/*.woff2 <user>@<nas-ip>:/volume1/docker/mth_infoscreen/frontend/src/assets/fonts/
```

## Setting up the Microsoft 365 connection

The events panel reads a Microsoft List via the Graph API using an **app-only
(client credentials)** connection — no user ever has to sign in on the
infoscreen itself. A tenant admin needs to do this once:

1. In the [Azure Portal](https://portal.azure.com), go to **Microsoft Entra
   ID → App registrations → New registration**. Name it e.g.
   "mth-infoscreen", single tenant.
2. Note the **Application (client) ID** and **Directory (tenant) ID** from
   the app's Overview page.
3. Go to **Certificates & secrets → New client secret**, and copy the secret
   **value** immediately (it's shown only once).
4. Go to **API permissions → Add a permission → Microsoft Graph →
   Application permissions**, and add:
   - `Sites.Selected` (recommended — grants access to only the specific
     SharePoint site you choose, see step 5), **or**
   - `Sites.Read.All` (simpler, but grants read access to every site in the
     tenant).
   Click **Grant admin consent** afterwards — application permissions don't
   work until an admin consents.
5. If you used `Sites.Selected`, you additionally need to grant the app
   access to the specific SharePoint site behind your Microsoft List. This
   is done via a Graph API call (not the portal UI) — see
   [Microsoft's docs on Sites.Selected](https://learn.microsoft.com/en-us/sharepoint/dev/solution-guidance/security-apponly-azuread#restricting-app-permissions-to-specific-site-collections),
   or use `Sites.Read.All` initially to get up and running.
6. In the infoscreen admin panel, go to **Microsoft 365**, enter the tenant
   ID, client ID, and client secret, then search for and select the
   SharePoint site and the specific list, and map its columns to
   Title/Start/End/Location/Description. Use **Test Connection** to verify
   each step (token → site access → list access).

**Before entering event times, check the SharePoint site's Regional
Settings.** Graph always returns date/time column values as UTC, and the app
always displays them converted to Europe/Berlin — but SharePoint converts
what someone *types* into a date/time column to UTC using the *site's*
configured regional timezone, not necessarily where your facility is. Many
tenants are left on a US-default timezone, which silently shifts every
entered time by several hours. Go to the site's **Settings → Site
information → Site settings → Regional Settings** and set it to
**"(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna"** — do this
*before* entering events, since fixing it later won't correct times already
stored under the wrong offset (those need to be manually re-entered).

## Public transport data

Departures and nearby-stop lookups come from
[transitous.org](https://transitous.org), a free, keyless, community-run
routing API (MOTIS) covering long-distance, regional, and local transit —
including buses and trams — via open GTFS feeds. No API key or account is
needed, but its [usage policy](https://transitous.org/api/) requires:

- **A descriptive `User-Agent`** on every request — set via `APP_USER_AGENT`
  (also reused for Nominatim's geocoding calls).
- **The project to be open-source, non-commercial, and light on resources**
  — this repo is public specifically to satisfy that; if you fork this for
  a commercial deployment, use the official Deutsche Bahn API or a
  self-hosted MOTIS instance instead.
- **Attribution** — the app credits transitous.org and OpenStreetMap
  contributors directly on the display and in the admin panel; don't remove
  those links.

We previously used the unofficial `v6.db.transport.rest` (HAFAS-wrapper)
API, but its own maintainers now warn it's "subject to haphazard blocking"
and recommend transitous.org as the replacement — which matched our own
experience running it in production.

## Deploying on a Synology NAS

This runs entirely on your local network via Synology's **Container
Manager** app (DSM 7.2+) — no public hosting, no HTTPS certificate needed.

1. **Install Container Manager** from Package Center if it isn't already.
2. **Get the code onto the NAS.** Easiest via SSH (enable it under Control
   Panel → Terminal & SNMP). The repo is private, and GitHub no longer
   accepts passwords for git operations, so clone over SSH using a
   **read-only deploy key** rather than HTTPS:
   ```bash
   ssh admin@<nas-ip>
   ssh-keygen -t ed25519 -C "synology-mth-infoscreen" -f ~/.ssh/mth_infoscreen_deploy -N ""
   cat ~/.ssh/mth_infoscreen_deploy.pub
   ```
   Add that public key at
   `github.com/mth-potsdam/mth_infoscreen/settings/keys` → **Add deploy
   key** (leave "Allow write access" unchecked — pulls only need read
   access). Then point SSH at it — a single `printf` line, not a heredoc,
   since heredocs pasted into some SSH terminal apps can fail to terminate
   cleanly and corrupt the file:
   ```bash
   printf 'Host github.com\n  IdentityFile ~/.ssh/mth_infoscreen_deploy\n  IdentitiesOnly yes\n' > ~/.ssh/config
   chmod 600 ~/.ssh/config
   cat ~/.ssh/config   # sanity check before continuing
   ```
   Then clone, as a separate command:
   ```bash
   cd /volume1/docker   # or wherever you keep app folders
   git clone git@github.com:mth-potsdam/mth_infoscreen.git
   ```
   (No SSH/git? Download the repo as a ZIP from GitHub — you'll need to be
   logged into GitHub in a browser since it's private — and extract it into
   a shared folder via File Station instead. You'll need to repeat that
   manually for future updates, though, since there's no `git pull`.)
3. **Create the env file.** In that same folder (via SSH — replace the
   password and contact email first):
   ```bash
   printf 'ADMIN_PASSWORD=choose-a-strong-password\nAPP_SECRET=%s\nAPP_USER_AGENT=mth-infoscreen (you@example.com)\n' "$(openssl rand -hex 32)" > .env
   chmod 600 .env
   cat .env   # sanity check
   ```
   This generates a random `APP_SECRET` inline. Leave `COOKIE_SECURE`
   unset — the default (`false`) is correct here since the NAS serves plain
   HTTP on your LAN. (File Station's text editor works too, but the command
   above avoids retyping a long random secret by hand.)
4. **Create the data folder.** Container Manager (unlike plain
   `docker compose`) won't auto-create a bind-mount source folder that
   doesn't exist yet, and will fail with "Bind mount failed: ... does not
   exist" if you skip this:
   ```bash
   mkdir -p /volume1/docker/mth_infoscreen/data
   ```
5. **Create the Project.** In Container Manager → Project → Create, give it
   a name, set the path to the cloned folder (Container Manager will detect
   `docker-compose.yml` there automatically), then Build.
6. **Check the port.** `docker-compose.yml` publishes port `3000`. If
   anything else on the NAS already uses it, edit the `ports:` line (e.g.
   `"8080:3000"`) before building.
7. **Find the NAS's local URL.** Use its LAN IP (Control Panel → Network) —
   ideally reserve it as a static IP in your router's DHCP settings so the
   URL never changes — and open `http://<nas-ip>:3000`. If DSM's firewall is
   enabled (Control Panel → Security → Firewall), allow that port.
8. Go to `/admin`, log in with `ADMIN_PASSWORD`, and configure the facility
   location, stops, intervals, and Microsoft 365 connection. `config.json`
   lives in the `./data` folder next to `docker-compose.yml` on the NAS's
   own storage, so it survives rebuilds and reboots automatically.
9. **To update later:** `git pull` in that folder (or re-download the ZIP),
   then use Container Manager's Build/Rebuild on the project.

### Synology troubleshooting

- **`permission denied ... docker.sock`** — Docker commands need `sudo` on
  DSM (the account also needs to be in the `administrators` group). If
  `sudo docker compose ...` says the `compose` subcommand isn't found, try
  the older `sudo docker-compose ...` (hyphenated) instead.
- **Rebuilt in Container Manager but nothing changed** (e.g. still serving
  an old JS bundle) — its Build action can reuse cached layers even when
  source files changed. Force a real rebuild from SSH:
  ```bash
  sudo docker compose build --no-cache
  sudo docker compose up -d
  ```
- **`port is already allocated`** on `docker compose up` — an old container
  (often a previous run Container Manager itself started) is still holding
  the port. Tear it down first: `sudo docker compose down`, then `up -d`
  again. If that doesn't clear it, `sudo docker ps -a` to find whatever
  else is publishing that port and remove it.
- **Container Manager's UI shows the project "stopped" but the app is
  reachable and running** — this happens after starting/stopping the
  container via the CLI instead of the UI; Container Manager's status
  tracking only updates for actions *it* initiates. Harmless, but to
  resync: `sudo docker compose down`, then start the project from
  Container Manager's own UI so it's tracking the container it started.

Any other Docker host works the same way (Coolify, a Raspberry Pi, etc.) —
just set `COOKIE_SECURE=true` in its environment if it sits behind a reverse
proxy that terminates HTTPS, and make sure `/data` is a persistent volume.

## Displaying on a Fire TV Stick

The Fire TV Stick's Silk Browser can open the deployed URL and be pinned to
the home screen. For a true kiosk experience (no browser chrome, no sleep,
auto-launch on boot), install a dedicated kiosk browser app from the Amazon
Appstore (e.g. "Fully Kiosk Browser") and point it at the deployed URL —
this also lets you disable the screensaver and auto-reload on crash.

## Project structure

```
backend/   Express API + background pollers (transit, Microsoft Graph)
frontend/  React + Vite app: the display screen and the admin panel
shared/    TypeScript types shared by both
```
