"""LeadPilot web app: REST API, WhatsApp webhook, and the dashboard."""
import base64
import hashlib
import hmac
import json
import logging
import secrets
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse, Response
from pydantic import BaseModel

from . import ai, config, db, demo, engine, importer, scoring

config.load_env_file()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("leadpilot")
STATIC = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app):
    db.init()
    engine.seed_default_sequence()
    if config.get("SEED_DEMO"):  # for trial deployments with a throwaway database
        demo.seed()
    stop = threading.Event()
    if not config.get("DISABLE_SCHEDULER"):
        threading.Thread(target=engine.run_scheduler, args=(stop,), daemon=True).start()
    yield
    stop.set()


app = FastAPI(title="LeadPilot", lifespan=lifespan)


@app.middleware("http")
async def require_password(request: Request, call_next):
    password = config.get("APP_PASSWORD")
    # The webhook is called by Meta and authenticates by signature instead.
    if password and not request.url.path.startswith("/webhook/"):
        given = ""
        header = request.headers.get("authorization", "")
        if header.lower().startswith("basic "):
            try:
                given = base64.b64decode(header[6:]).decode().partition(":")[2]
            except ValueError:
                pass
        if not secrets.compare_digest(given.encode(), password.encode()):
            return Response(status_code=401, headers={"WWW-Authenticate": 'Basic realm="LeadPilot"'})
    return await call_next(request)


# ---------- models ----------

class LeadIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    source: Optional[str] = None
    project: Optional[str] = None
    budget: Optional[str] = None
    stage: Optional[str] = None
    notes: Optional[str] = None
    opted_out: Optional[bool] = None


class EventIn(BaseModel):
    kind: str  # note | call | wa_in | email_in
    body: str


class SendIn(BaseModel):
    channel: str
    body: str
    subject: str = ""
    wa_template: str = ""


class DraftIn(BaseModel):
    channel: str = "whatsapp"
    guidance: str = ""


class StepIn(BaseModel):
    delay_hours: float = 0
    channel: str = "whatsapp"
    subject: str = ""
    body: str
    wa_template: str = ""
    ai_personalize: bool = False


class SequenceIn(BaseModel):
    name: str
    active: bool = True
    steps: List[StepIn]


class EnrollIn(BaseModel):
    sequence_id: int
    lead_ids: Optional[List[int]] = None


class ApproveIn(BaseModel):
    body: Optional[str] = None
    subject: Optional[str] = None


def _lead_or_404(con, lead_id):
    lead = db.one(con, "SELECT * FROM leads WHERE id=?", (lead_id,))
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


# ---------- leads ----------

LEAD_LIST_SQL = """
SELECT l.*,
  (SELECT s.name FROM enrollments e JOIN sequences s ON s.id = e.sequence_id
    WHERE e.lead_id = l.id AND e.status = 'active' ORDER BY e.next_run_at LIMIT 1) AS sequence_name,
  (SELECT MIN(e.next_run_at) FROM enrollments e WHERE e.lead_id = l.id AND e.status = 'active') AS next_followup_at
FROM leads l
"""


@app.get("/api/leads")
def list_leads(q: str = "", stage: str = ""):
    where, params = [], []
    if q:
        where.append("(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.project LIKE ? OR l.source LIKE ?)")
        params += [f"%{q}%"] * 5
    if stage == "open":
        where.append("l.stage NOT IN ('won','lost')")
    elif stage:
        where.append("l.stage = ?")
        params.append(stage)
    sql = LEAD_LIST_SQL + (" WHERE " + " AND ".join(where) if where else "") + " ORDER BY l.score DESC, l.updated_at DESC"
    with db.connect() as con:
        return [db.lead_json(l) for l in db.rows(con, sql, params)]


@app.post("/api/leads")
def create_lead(data: LeadIn):
    if not (data.name or data.phone):
        raise HTTPException(400, "A lead needs a name or a phone number")
    with db.connect() as con:
        if data.phone and db.find_lead_by_phone(con, data.phone):
            raise HTTPException(409, "A lead with this phone number already exists")
        lead_id = db.create_lead(con, data.model_dump(exclude_none=True))
        scoring.rescore(con, [lead_id])
    return {"id": lead_id}


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: int):
    with db.connect() as con:
        lead = db.one(con, LEAD_LIST_SQL + " WHERE l.id=?", (lead_id,))
        if not lead:
            raise HTTPException(404, "Lead not found")
        out = db.lead_json(lead)
        out["events"] = db.rows(con, "SELECT * FROM events WHERE lead_id=? ORDER BY ts DESC, id DESC", (lead_id,))
        out["enrollments"] = db.rows(
            con,
            "SELECT e.*, s.name AS sequence_name, (SELECT COUNT(*) FROM steps WHERE sequence_id = s.id) AS step_count"
            " FROM enrollments e JOIN sequences s ON s.id = e.sequence_id WHERE e.lead_id=? ORDER BY e.id DESC",
            (lead_id,),
        )
        return out


@app.patch("/api/leads/{lead_id}")
def update_lead(lead_id: int, data: LeadIn):
    changes = data.model_dump(exclude_none=True)
    with db.connect() as con:
        lead = _lead_or_404(con, lead_id)
        if "stage" in changes and changes["stage"] not in db.STAGES:
            raise HTTPException(400, "Unknown stage")
        if "phone" in changes:
            changes["phone"] = db.normalize_phone(changes["phone"])
        if "opted_out" in changes:
            changes["opted_out"] = int(changes["opted_out"])
        if not changes:
            return {"ok": True}
        sets = ", ".join(f"{k}=?" for k in changes)
        con.execute(f"UPDATE leads SET {sets}, updated_at=? WHERE id=?", (*changes.values(), db.iso(db.now()), lead_id))
        stage_changed = "stage" in changes and changes["stage"] != lead["stage"]
        if stage_changed:
            db.add_event(con, lead_id, "stage", f"{lead['stage']} -> {changes['stage']}")
        if changes.get("stage") in ("won", "lost") or changes.get("opted_out"):
            engine.stop_enrollments(con, lead_id, "lead closed or opted out")
        # A won/lost change shifts the learned source/project rates for everyone.
        scoring.rescore(con, None if stage_changed and {"won", "lost"} & {lead["stage"], changes["stage"]} else [lead_id])
    return {"ok": True}


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int):
    with db.connect() as con:
        _lead_or_404(con, lead_id)
        con.execute("DELETE FROM leads WHERE id=?", (lead_id,))
    return {"ok": True}


@app.post("/api/leads/{lead_id}/events")
def log_event(lead_id: int, data: EventIn):
    if data.kind not in ("note", "call", "wa_in", "email_in"):
        raise HTTPException(400, "Unknown event kind")
    if not data.body.strip():
        raise HTTPException(400, "Nothing to log")
    with db.connect() as con:
        _lead_or_404(con, lead_id)
        if data.kind in ("wa_in", "email_in"):
            engine.handle_inbound(con, lead_id, "whatsapp" if data.kind == "wa_in" else "email", data.body.strip())
        else:
            db.add_event(con, lead_id, data.kind, data.body.strip())
            scoring.rescore(con, [lead_id])
    if config.ai_configured():
        engine.analyze_in_background([lead_id])
    return {"ok": True}


@app.post("/api/leads/{lead_id}/send")
def send_message(lead_id: int, data: SendIn):
    if data.channel not in ("whatsapp", "email") or not data.body.strip():
        raise HTTPException(400, "Choose a channel and write a message")
    with db.connect() as con:
        _lead_or_404(con, lead_id)
        oid = engine.queue_message(con, lead_id, data.channel, data.body.strip(), data.subject, data.wa_template)
        return engine.deliver(con, oid)


@app.post("/api/leads/{lead_id}/draft")
def draft_message(lead_id: int, data: DraftIn):
    with db.connect() as con:
        lead = _lead_or_404(con, lead_id)
        events = db.rows(con, "SELECT * FROM events WHERE lead_id=? ORDER BY ts, id", (lead_id,))
        settings = db.get_settings(con)
    text = ai.draft_message(lead, events, data.channel, data.guidance, settings, db.iso(db.now())[:10])
    if text:
        return {"body": text, "ai": True}
    fallback = "Hi {first_name}, this is {agent}. Just following up on {project}. Is now a good time to talk it through?"
    return {"body": engine.render(fallback, lead, settings), "ai": False}


@app.post("/api/leads/{lead_id}/analyze")
def analyze_lead(lead_id: int):
    if not config.ai_configured():
        raise HTTPException(400, "Add ANTHROPIC_API_KEY to .env to enable AI analysis")
    if not engine.analyze(lead_id):
        raise HTTPException(502, "AI analysis did not complete; check the server log")
    return {"ok": True}


@app.post("/api/analyze-all")
def analyze_all():
    if not config.ai_configured():
        raise HTTPException(400, "Add ANTHROPIC_API_KEY to .env to enable AI analysis")
    with db.connect() as con:
        ids = [r["id"] for r in db.rows(con, "SELECT id FROM leads WHERE stage NOT IN ('won','lost') AND opted_out=0")]
    engine.analyze_in_background(ids)
    return {"queued": len(ids)}


# ---------- sequences & enrolment ----------

@app.get("/api/sequences")
def list_sequences():
    with db.connect() as con:
        seqs = db.rows(con, "SELECT s.*, (SELECT COUNT(*) FROM enrollments e WHERE e.sequence_id = s.id"
                            " AND e.status='active') AS active_leads FROM sequences s ORDER BY s.id")
        for s in seqs:
            s["steps"] = db.rows(con, "SELECT * FROM steps WHERE sequence_id=? ORDER BY position", (s["id"],))
        return seqs


@app.post("/api/sequences")
def create_sequence(data: SequenceIn):
    if not data.steps:
        raise HTTPException(400, "A sequence needs at least one step")
    with db.connect() as con:
        cur = con.execute("INSERT INTO sequences(name, active) VALUES(?,?)", (data.name.strip() or "Untitled", int(data.active)))
        engine.save_steps(con, cur.lastrowid, [s.model_dump() for s in data.steps])
        return {"id": cur.lastrowid}


@app.put("/api/sequences/{seq_id}")
def update_sequence(seq_id: int, data: SequenceIn):
    if not data.steps:
        raise HTTPException(400, "A sequence needs at least one step")
    with db.connect() as con:
        if not db.one(con, "SELECT id FROM sequences WHERE id=?", (seq_id,)):
            raise HTTPException(404, "Sequence not found")
        con.execute("UPDATE sequences SET name=?, active=? WHERE id=?", (data.name.strip() or "Untitled", int(data.active), seq_id))
        engine.save_steps(con, seq_id, [s.model_dump() for s in data.steps])
    return {"ok": True}


@app.delete("/api/sequences/{seq_id}")
def delete_sequence(seq_id: int):
    with db.connect() as con:
        con.execute("DELETE FROM sequences WHERE id=?", (seq_id,))
    return {"ok": True}


@app.post("/api/enroll")
def enroll(data: EnrollIn):
    with db.connect() as con:
        if not db.one(con, "SELECT id FROM sequences WHERE id=?", (data.sequence_id,)):
            raise HTTPException(404, "Sequence not found")
        ids = data.lead_ids
        if ids is None:  # everyone still open who isn't already in a sequence
            ids = [r["id"] for r in db.rows(
                con, "SELECT id FROM leads WHERE stage NOT IN ('won','lost') AND opted_out=0 AND id NOT IN"
                     " (SELECT lead_id FROM enrollments WHERE status='active')")]
        enrolled = 0
        for lid in ids:
            lead = db.one(con, "SELECT stage, opted_out FROM leads WHERE id=?", (lid,))
            if lead and lead["stage"] not in ("won", "lost") and not lead["opted_out"]:
                enrolled += bool(engine.enroll(con, lid, data.sequence_id))
    return {"enrolled": enrolled}


@app.post("/api/leads/{lead_id}/stop-sequences")
def stop_sequences(lead_id: int):
    with db.connect() as con:
        return {"stopped": engine.stop_enrollments(con, lead_id, "stopped manually")}


@app.post("/api/scheduler/run")
def run_scheduler_now():
    return {"ran": engine.tick()}


# ---------- outbox ----------

@app.get("/api/outbox")
def list_outbox(status: str = ""):
    sql = ("SELECT o.*, l.name AS lead_name, l.phone, l.email, l.score FROM outbox o JOIN leads l ON l.id = o.lead_id"
           + (" WHERE o.status = ?" if status else "") + " ORDER BY o.id DESC LIMIT 200")
    with db.connect() as con:
        return db.rows(con, sql, (status,) if status else ())


@app.post("/api/outbox/{oid}/approve")
def approve(oid: int, data: ApproveIn):
    with db.connect() as con:
        msg = db.one(con, "SELECT * FROM outbox WHERE id=?", (oid,))
        if not msg or msg["status"] != "draft":
            raise HTTPException(404, "No draft with this id")
        if data.body is not None and data.body.strip():
            con.execute("UPDATE outbox SET body=? WHERE id=?", (data.body.strip(), oid))
        if data.subject is not None:
            con.execute("UPDATE outbox SET subject=? WHERE id=?", (data.subject, oid))
        return engine.deliver(con, oid)


@app.post("/api/outbox/{oid}/discard")
def discard(oid: int):
    with db.connect() as con:
        con.execute("UPDATE outbox SET status='discarded' WHERE id=? AND status='draft'", (oid,))
    return {"ok": True}


# ---------- settings, stats, import ----------

@app.get("/api/settings")
def get_settings():
    with db.connect() as con:
        s = db.get_settings(con)
    s["connections"] = {
        "whatsapp": config.whatsapp_configured(),
        "email": config.email_configured(),
        "ai": config.ai_configured(),
        "ai_model": config.claude_model(),
    }
    return s


@app.put("/api/settings")
def put_settings(data: dict):
    if data.get("send_mode") not in (None, "dry_run", "approve", "auto"):
        raise HTTPException(400, "Unknown send mode")
    with db.connect() as con:
        for k, v in data.items():
            if k in db.DEFAULT_SETTINGS:
                con.execute("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                            (k, str(v)))
    return {"ok": True}


@app.get("/api/stats")
def stats():
    with db.connect() as con:
        week = db.iso(db.now() - timedelta(days=7))
        by_stage = {r["stage"]: r["n"] for r in db.rows(con, "SELECT stage, COUNT(*) AS n FROM leads GROUP BY stage")}
        count = lambda sql, p=(): db.one(con, sql, p)["n"]
        return {
            "total": sum(by_stage.values()),
            "by_stage": by_stage,
            "hot": count("SELECT COUNT(*) AS n FROM leads WHERE score >= 60 AND stage NOT IN ('won','lost')"),
            "in_sequence": count("SELECT COUNT(DISTINCT lead_id) AS n FROM enrollments WHERE status='active'"),
            "drafts": count("SELECT COUNT(*) AS n FROM outbox WHERE status='draft'"),
            "sent_7d": count("SELECT COUNT(*) AS n FROM events WHERE kind IN ('wa_out','email_out')"
                             " AND status != 'failed' AND ts >= ?", (week,)),
            "replies_7d": count("SELECT COUNT(*) AS n FROM events WHERE kind IN ('wa_in','email_in') AND ts >= ?", (week,)),
        }


@app.post("/api/import")
async def import_leads(file: UploadFile):
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    with db.connect() as con:
        try:
            result = importer.import_text(con, text)
        except ValueError as e:
            raise HTTPException(400, str(e))
        scoring.rescore(con)
    return result


# ---------- WhatsApp webhook ----------

@app.get("/webhook/whatsapp")
def verify_webhook(request: Request):
    q = request.query_params
    token = config.get("WHATSAPP_VERIFY_TOKEN")
    if token and q.get("hub.mode") == "subscribe" and secrets.compare_digest(q.get("hub.verify_token", ""), token):
        return PlainTextResponse(q.get("hub.challenge", ""))
    raise HTTPException(403, "Verification failed")


@app.post("/webhook/whatsapp")
async def receive_webhook(request: Request):
    raw = await request.body()
    secret = config.get("WHATSAPP_APP_SECRET")
    if secret:
        expected = "sha256=" + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, request.headers.get("x-hub-signature-256", "")):
            raise HTTPException(403, "Bad signature")
    elif not config.get("WHATSAPP_VERIFY_TOKEN"):
        raise HTTPException(403, "Webhook is not configured")
    try:
        payload = json.loads(raw)
    except ValueError:
        raise HTTPException(400, "Invalid JSON")
    touched = []
    with db.connect() as con:
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                names = {c.get("wa_id"): c.get("profile", {}).get("name", "") for c in value.get("contacts", [])}
                for m in value.get("messages", []):
                    sender = m.get("from", "")
                    if not sender:
                        continue
                    body = m.get("text", {}).get("body") if m.get("type") == "text" else f"[{m.get('type', 'message')}]"
                    lead = db.find_lead_by_phone(con, "+" + sender)
                    if lead:
                        lead_id = lead["id"]
                    else:  # someone new messaged the business number
                        lead_id = db.create_lead(con, {"name": names.get(sender) or "Unknown", "phone": "+" + sender,
                                                       "source": "WhatsApp inbound"})
                    ts = None
                    if str(m.get("timestamp", "")).isdigit():
                        ts = db.iso(datetime.fromtimestamp(int(m["timestamp"]), timezone.utc))
                    engine.handle_inbound(con, lead_id, "whatsapp", body or "", ts)
                    touched.append(lead_id)
    if touched and config.ai_configured():
        engine.analyze_in_background(sorted(set(touched)))
    return {"ok": True}


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")
