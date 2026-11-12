# LeadPilot

A self-hosted lead desk: every lead in one place, ranked by how likely they
are to buy, with WhatsApp and email follow-ups that send themselves on a
schedule and stop the moment the lead replies.

## Quick start

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/seed_demo.py   # optional: 12 fictional leads to explore
.venv/bin/python run.py                 # open http://127.0.0.1:8000
```

With no configuration it runs in **dry-run mode**: the whole flow works and
every message is logged, but nothing is actually sent. Connect services by
copying `.env.example` to `.env` and filling in what you need.

## What it does

**Leads.** Add leads by hand or import a CSV/TSV exported from your
spreadsheet. Columns are matched by header (`Name`, `Mobile`, `Email`,
`Source`, `Project`, `Budget`, `Status`); any other cells on a row become
notes on the lead, so follow-up remarks carry over. Duplicate phone numbers
are skipped. A message from an unknown WhatsApp number creates a new lead.

**Scoring.** Each open lead gets a 0-100 score from three layers:

1. *Behaviour*: pipeline stage, how many times and how recently they
   replied, unanswered follow-ups, and buying or negative language in notes
   and messages ("payment plan", "site visit" vs. "not interested").
2. *Your own history*: how often each source and project has converted for
   you, shrunk toward your overall rate so one lucky sale doesn't make a
   channel look like a sure thing. This updates whenever you mark a deal won.
3. *Claude's read* (needs `ANTHROPIC_API_KEY`): the model reads the full
   conversation and returns a probability, a likely timeline, buying
   signals, objections and a suggested next step. It is averaged 50/50 with
   layers 1-2.

Open a lead to see exactly which factors moved its score. Treat the number
as a ranking of who to call first, not a calibrated probability: with a few
dozen leads and a handful of sales there isn't enough history to train or
validate a statistical model, which is why the design leans on transparent
signals plus language understanding rather than a black-box classifier.

**Follow-up sequences.** A sequence is a list of steps: wait N hours or days,
then send a WhatsApp or email. Templates take `{first_name}`, `{name}`,
`{project}`, `{agent}` and `{company}`. A step can be marked for AI
rewriting, in which case Claude writes the message for that lead from their
conversation, using your template as the brief. A lead leaves every sequence
when they reply, are marked won or lost, or opt out (replying `STOP` does
this automatically). Scheduled follow-ups wait out quiet hours.

**Send modes** (Settings):

| Mode | Behaviour |
|---|---|
| Dry run | Everything is simulated. The default. |
| Approve first | Follow-ups queue in the Outbox; you edit and approve each one. |
| Automatic | Follow-ups send on schedule with no review, including AI-written ones. |

Start with *Approve first* when you go live.

## Connecting WhatsApp

This uses Meta's official **WhatsApp Business Cloud API**. Unofficial
WhatsApp Web automation gets numbers banned, so it is not supported.

1. Create an app at developers.facebook.com, add the WhatsApp product, and
   register your business number.
2. Put the permanent access token and phone number ID in `.env` as
   `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID`.
3. To receive replies, the app must be reachable from the internet over
   HTTPS. Point Meta's webhook at `https://your-domain/webhook/whatsapp`,
   subscribe to `messages`, and set `WHATSAPP_VERIFY_TOKEN` (any string, same
   on both sides) and `WHATSAPP_APP_SECRET` (so forged webhooks are rejected).
4. **The 24-hour rule.** Meta only delivers free-text messages to people who
   messaged you in the last 24 hours. For everyone else you must send a
   pre-approved template. Create one in WhatsApp Manager with a single body
   variable (the first name) and enter its name on the sequence step. Steps
   with no template are recorded as failed for leads outside the window.
   Template sends cost money per message; Meta sets the price.

`WHATSAPP_API_VERSION` defaults to `v23.0`; update it if Meta has retired
that version.

## Connecting email

Fill in the `SMTP_*` values (Gmail: `smtp.gmail.com`, port 587, an app
password). Inbound email is not read automatically: log a reply from the
lead's page ("Lead replied by email"), which also stops their sequence.

## Trial deployment on Render (free, demo data only)

`render.yaml` deploys the app to Render's free plan in a few taps, including
from an iPad:

1. Sign in at render.com with your GitHub account.
2. **New** -> **Blueprint**, pick this repository and the branch to deploy.
3. Wait for the build, then open the service's **Environment** tab and copy
   the generated `APP_PASSWORD`.
4. Open the service URL. Your browser asks for a login: any username, and
   that password.

The free plan sleeps after ~15 minutes without traffic (the first request
then takes about a minute) and wipes its files on every restart. The demo
leads are re-created each time, and anything you add is lost. Because the
app is asleep, scheduled follow-ups don't fire; use **Run due follow-ups
now** on the Sequences page. Don't enter real client data here, and keep
Send mode on Dry run.

## Security

The database holds your clients' contact details. The app listens only on
your own machine by default. Before exposing it (which WhatsApp webhooks
require), set `APP_PASSWORD` and put it behind HTTPS.

## Layout

```
app/scoring.py    conversion scoring and learned source/project rates
app/ai.py         Claude analysis and message drafting
app/engine.py     delivery rules, sequences, scheduler, reply handling
app/channels.py   WhatsApp Cloud API and SMTP senders
app/importer.py   CSV/TSV import
app/main.py       REST API, webhook, auth
app/static/       dashboard
tests/            pytest suite (`.venv/bin/python -m pytest`)
```
