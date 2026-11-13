# Deploying LeadPilot

The pieces are deliberately separate, so you can move the app between hosts
without moving your data:

| Piece | Where it lives | Moves with you? |
|---|---|---|
| Code | GitHub (this repository) | Yes, it is the source of truth |
| Data (leads, messages, settings) | Supabase Postgres | Yes: the same `DATABASE_URL` works from any host |
| The running app | Any host that runs Python 3.10+ | Replaceable |

## What any host needs

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `python run.py`
- **Health check path:** `/healthz` (answers 200 without a login; 503 if the database is unreachable)
- **Exactly one running copy.** The follow-up scheduler runs inside the app, so
  two copies would each send every due message.

The app reads the port from `PORT` (hosts set this) and listens on `HOST`
(`0.0.0.0` on a host, `127.0.0.1` on your own machine).

## Environment variables

Set these in the host's settings, never in the repository.

| Variable | Needed | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase **Session pooler** connection string (see the README) |
| `APP_PASSWORD` | Yes | Login for the dashboard (any username). Without it the app is open to anyone with the address |
| `HOST` | Yes on a host | `0.0.0.0` |
| `ANTHROPIC_API_KEY` | Optional | AI summaries, estimates and drafts. The score works without it |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Optional | Automatic WhatsApp sending (Meta Cloud API) |
| `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | With the webhook | Receiving replies; the app rejects unsigned webhooks |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional | Automatic email |
| `TZ_OFFSET_HOURS` | Optional | Hours from UTC for quiet hours (Dubai is `4`) |
| `DEFAULT_COUNTRY_CODE` | Optional | Added to local phone numbers (default `971`) |

`.env.example` lists them all. Do not set `SEED_DEMO` on a real deployment.

## Moving to a new host

1. Create the service from this GitHub repository and pick the branch to deploy.
2. Enter the build command, start command and health check path above.
3. Copy the environment variables from the old host. `DATABASE_URL` is the same
   string, so the new host sees all your existing leads.
4. Deploy, open the address, log in, and confirm your leads are there.
5. If you use the WhatsApp webhook, change its URL in Meta's dashboard to
   `https://YOUR-NEW-ADDRESS/webhook/whatsapp`.
6. Only then shut down the old service, so two copies never run together.

## Updating

Push to the deployed branch on GitHub. Hosts with auto-deploy rebuild within a
couple of minutes. **Settings** shows the commit that is running, so you can
compare it with the latest commit on GitHub.

## Choosing a host

- **Always-on hosting is what makes follow-ups automatic.** Free plans put the
  app to sleep when nobody is using it, and nothing is sent while it sleeps.
  A small paid service, or any always-on server, avoids that. Check current
  prices; they change.
- **Keep the app and the database in the same region.** Each page makes
  several database calls, so distance makes the app slower.
- **Sleeping hosts:** you can call `POST /api/scheduler/run` (with the dashboard
  login) from an outside timer such as cPanel's Cron Jobs, every 5 minutes:
  `curl -s -u admin:PASSWORD -X POST https://YOUR-ADDRESS/api/scheduler/run`.
  If you do, set `DISABLE_SCHEDULER=1` so the built-in scheduler doesn't also
  run, otherwise a message can be sent twice.
- **cPanel** can only host this if it offers "Setup Python App" with Python
  3.10 or newer, and it needs a small adapter file that is **not included
  here**. The app is a modern async (ASGI) app, which cPanel does not run
  directly.

## Security checklist

- `APP_PASSWORD` is set and is long and random.
- The address is HTTPS (hosts provide this).
- `.env` and passwords are not committed to GitHub.
- Supabase's Security Advisor shows no errors. The app turns on row-level
  security for its tables at startup so Supabase's public API can't read them.
- You have only given the app a database password and keys you can replace.
  If one leaks, reset it in Supabase, Meta or Anthropic and update the host.
