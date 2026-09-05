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
cp .env.example .env   # fill in ADMIN_PASSWORD, APP_SECRET, NOMINATIM_USER_AGENT
npm run dev
```

This runs the backend on `http://localhost:3001` and the frontend (with
`/api` proxied to the backend) on `http://localhost:5173`. Generate
`APP_SECRET` with:

```bash
openssl rand -hex 32
```

### Testing the production image with docker-compose

`docker compose up` runs the real production image locally over plain HTTP.
The admin session cookie is marked `Secure` whenever `NODE_ENV=production`
(matching how it behaves in the real Coolify deployment, which sits behind
HTTPS) — browsers and `curl` correctly refuse to store a `Secure` cookie set
over plain HTTP, so logging into `/admin` won't work at `http://localhost:3000`
in this mode. That's expected, not a bug: it works over HTTPS in production.
Use `npm run dev` instead to exercise the admin login flow locally.

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

## Public transport data

Departures come from the free, keyless
[v6.db.transport.rest](https://v6.db.transport.rest) API, which aggregates
Deutsche Bahn's HAFAS data (covers long-distance, regional, and local
transit including buses and trams). No API key or account is needed.

## Deploying with Coolify

1. Push this repository to GitHub.
2. In Coolify, create a new **Application** from the GitHub repo, build pack
   **Dockerfile**.
3. **Before the first deploy**, add a **persistent volume** mounted at
   `/data` — this is where `config.json` (facility location, stops,
   intervals, Graph settings, admin password hash) lives. If this isn't
   attached before the first deploy, all admin-configured settings are lost
   on the next redeploy.
4. Set environment variables in Coolify:
   - `ADMIN_PASSWORD` — bootstraps the admin password on first boot only
   - `APP_SECRET` — `openssl rand -hex 32`
   - `NOMINATIM_USER_AGENT` — e.g. `mth-infoscreen (you@example.com)`
   - optionally `TZ`, `PORT`, `CONFIG_DIR`, `DEPARTURES_API_BASE`
5. Deploy. Coolify will build the multi-stage Dockerfile and run the
   container; `/api/health` is used as the Docker healthcheck.
6. Open the deployed URL, go to `/admin`, log in, and configure the facility
   location, stops, intervals, and Microsoft 365 connection.

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
