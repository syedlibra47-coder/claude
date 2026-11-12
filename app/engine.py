"""Follow-up engine: message delivery, sequences, the scheduler tick, and
what happens when a lead replies."""
import json
import logging
import threading
from datetime import timedelta

from . import ai, channels, config, db, scoring

log = logging.getLogger("leadpilot.engine")

OPT_OUT_WORDS = {"stop", "unsubscribe", "stop messaging", "do not contact", "remove me"}
FALLBACKS = {"agent": "your property consultant", "project": "the project you asked about", "company": "our team"}


def render(template: str, lead: dict, settings: dict) -> str:
    first = (lead["name"] or "").split()[0] if lead["name"] and lead["name"] != "Unknown" else "there"
    values = {
        "name": lead["name"] if lead["name"] != "Unknown" else "there",
        "first_name": first,
        "project": lead["project"] or FALLBACKS["project"],
        "agent": settings.get("agent_name") or FALLBACKS["agent"],
        "company": settings.get("company_name") or FALLBACKS["company"],
    }
    out = template
    for k, v in values.items():
        out = out.replace("{" + k + "}", v)
    return out


def queue_message(con, lead_id, channel, body, subject="", wa_template="", enrollment_id=None, ai_written=False) -> int:
    cur = con.execute(
        "INSERT INTO outbox(lead_id, enrollment_id, channel, subject, body, wa_template, ai_written, created_at)"
        " VALUES(?,?,?,?,?,?,?,?)",
        (lead_id, enrollment_id, channel, subject, body, wa_template, int(ai_written), db.iso(db.now())),
    )
    return cur.lastrowid


def _within_whatsapp_window(con, lead_id, now) -> bool:
    last = db.one(con, "SELECT ts FROM events WHERE lead_id=? AND kind='wa_in' ORDER BY ts DESC LIMIT 1", (lead_id,))
    return bool(last) and now - db.parse_ts(last["ts"]) < timedelta(hours=24)


def deliver(con, outbox_id: int) -> dict:
    """Send (or simulate) one outbox message and record the outcome."""
    msg = db.one(con, "SELECT * FROM outbox WHERE id=?", (outbox_id,))
    lead = db.one(con, "SELECT * FROM leads WHERE id=?", (msg["lead_id"],))
    settings = db.get_settings(con)
    now = db.now()
    wa = msg["channel"] == "whatsapp"
    address = lead["phone"] if wa else lead["email"]
    configured = config.whatsapp_configured() if wa else config.email_configured()
    status, error, logged_body = "failed", "", msg["body"]

    if lead["opted_out"]:
        error = "Lead opted out of messages"
    elif not address:
        error = f"Lead has no {'phone number' if wa else 'email address'}"
    elif settings["send_mode"] == "dry_run" or not configured:
        status = "simulated"
        if settings["send_mode"] != "dry_run":
            error = f"{'WhatsApp' if wa else 'Email'} is not connected, so this was not really sent"
    elif wa:
        first = render("{first_name}", lead, settings)
        if _within_whatsapp_window(con, lead["id"], now):
            ok, error = channels.send_whatsapp(address, msg["body"])
        elif msg["wa_template"]:
            ok, error = channels.send_whatsapp(address, "", template=msg["wa_template"], first_name=first)
            logged_body = f"[template: {msg['wa_template']}] {msg['body']}"
        else:
            ok, error = False, ("Outside WhatsApp's 24-hour reply window. Meta only allows an approved "
                                "template here; add a template name to this step.")
        status = "sent" if ok else "failed"
    else:
        ok, error = channels.send_email(address, msg["subject"], msg["body"])
        status = "sent" if ok else "failed"

    ts = db.iso(now)
    con.execute("UPDATE outbox SET status=?, error=?, sent_at=? WHERE id=?", (status, error, ts, outbox_id))
    kind = "wa_out" if wa else "email_out"
    body = logged_body if status != "failed" else f"{logged_body}\n[not sent: {error}]"
    db.add_event(con, lead["id"], kind, body, status, ts)
    if status != "failed":
        stage = "contacted" if lead["stage"] == "new" else lead["stage"]
        con.execute("UPDATE leads SET last_outbound_at=?, stage=?, updated_at=? WHERE id=?", (ts, stage, ts, lead["id"]))
        scoring.rescore(con, [lead["id"]])
    return {"status": status, "error": error}


def log_manual(con, lead_id: int, channel: str, body: str, subject: str = "", outbox_id=None) -> int:
    """Record a message the agent sent themselves (via the WhatsApp/email app on
    their device). We can't see whether they pressed send, so it is logged as
    'manual' and counted as contact."""
    lead = db.one(con, "SELECT * FROM leads WHERE id=?", (lead_id,))
    if lead["opted_out"]:
        raise ValueError("This lead opted out of messages")
    ts = db.iso(db.now())
    if outbox_id is None:
        outbox_id = queue_message(con, lead_id, channel, body, subject)
    con.execute("UPDATE outbox SET body=?, subject=?, status='sent', sent_at=? WHERE id=?",
                (body, subject, ts, outbox_id))
    db.add_event(con, lead_id, "wa_out" if channel == "whatsapp" else "email_out", body, "manual", ts)
    stage = "contacted" if lead["stage"] == "new" else lead["stage"]
    con.execute("UPDATE leads SET last_outbound_at=?, stage=?, updated_at=? WHERE id=?", (ts, stage, ts, lead_id))
    scoring.rescore(con, [lead_id])
    return outbox_id


def enroll(con, lead_id: int, sequence_id: int):
    if db.one(con, "SELECT id FROM enrollments WHERE lead_id=? AND sequence_id=? AND status='active'",
              (lead_id, sequence_id)):
        return None
    first = db.one(con, "SELECT delay_hours FROM steps WHERE sequence_id=? ORDER BY position LIMIT 1", (sequence_id,))
    if not first:
        return None
    now = db.now()
    cur = con.execute(
        "INSERT INTO enrollments(lead_id, sequence_id, next_run_at, created_at) VALUES(?,?,?,?)",
        (lead_id, sequence_id, db.iso(now + timedelta(hours=first["delay_hours"])), db.iso(now)),
    )
    return cur.lastrowid


def stop_enrollments(con, lead_id: int, reason: str):
    active = db.rows(con, "SELECT id FROM enrollments WHERE lead_id=? AND status='active'", (lead_id,))
    for e in active:
        con.execute("UPDATE enrollments SET status='stopped', stop_reason=? WHERE id=?", (reason, e["id"]))
        con.execute("UPDATE outbox SET status='discarded', error=? WHERE enrollment_id=? AND status='draft'",
                    (reason, e["id"]))
    return len(active)


def in_quiet_hours(now, settings) -> bool:
    try:
        start, end = int(settings["quiet_start"]) % 24, int(settings["quiet_end"]) % 24
    except ValueError:
        return False
    h = (now + timedelta(hours=config.tz_offset_hours())).hour
    return (h >= start or h < end) if start > end else (start <= h < end)


def tick(now=None) -> int:
    """Process every follow-up that is due. Returns how many steps ran."""
    now = now or db.now()
    ran = 0
    with db.connect() as con:
        due = db.rows(con, "SELECT * FROM enrollments WHERE status='active' AND next_run_at <= ? ORDER BY next_run_at",
                      (db.iso(now),))
    for enr in due:
        try:
            ran += _run_step(enr["id"], now)
        except Exception:  # one bad enrolment must not stall everyone else's follow-ups
            log.exception("Follow-up step failed for enrolment %s", enr["id"])
    return ran


def _run_step(enrollment_id: int, now) -> int:
    with db.connect() as con:
        enr = db.one(con, "SELECT * FROM enrollments WHERE id=? AND status='active'", (enrollment_id,))
        if not enr:
            return 0
        lead = db.one(con, "SELECT * FROM leads WHERE id=?", (enr["lead_id"],))
        seq = db.one(con, "SELECT * FROM sequences WHERE id=?", (enr["sequence_id"],))
        steps = db.rows(con, "SELECT * FROM steps WHERE sequence_id=? ORDER BY position", (enr["sequence_id"],))
        settings = db.get_settings(con)
        events = db.rows(con, "SELECT * FROM events WHERE lead_id=? ORDER BY ts, id", (lead["id"],))
        if lead["stage"] in ("won", "lost") or lead["opted_out"]:
            stop_enrollments(con, lead["id"], "lead closed or opted out")
            return 0
        if not seq["active"]:
            return 0
        if enr["step_index"] >= len(steps):
            con.execute("UPDATE enrollments SET status='completed' WHERE id=?", (enr["id"],))
            return 0
        if in_quiet_hours(now, settings):
            return 0  # stays due; goes out on the first tick after quiet hours

    step = steps[enr["step_index"]]
    body = render(step["body"], lead, settings)
    ai_written = False
    if step["ai_personalize"]:  # network call: made with no database connection held
        draft = ai.draft_message(lead, events, step["channel"], body, settings, db.iso(now)[:10])
        if draft:
            body, ai_written = draft, True

    with db.connect() as con:
        # The lead may have replied while the draft was being written.
        if not db.one(con, "SELECT id FROM enrollments WHERE id=? AND status='active'", (enr["id"],)):
            return 0
        oid = queue_message(con, lead["id"], step["channel"], body, render(step["subject"], lead, settings),
                            step["wa_template"], enr["id"], ai_written)
        if settings["send_mode"] != "approve":
            deliver(con, oid)
        nxt = enr["step_index"] + 1
        if nxt < len(steps):
            con.execute("UPDATE enrollments SET step_index=?, next_run_at=? WHERE id=?",
                        (nxt, db.iso(now + timedelta(hours=steps[nxt]["delay_hours"])), enr["id"]))
        else:
            con.execute("UPDATE enrollments SET step_index=?, status='completed' WHERE id=?", (nxt, enr["id"]))
    return 1


def handle_inbound(con, lead_id: int, channel: str, body: str, ts=None):
    """A lead replied: log it, stop their sequences, and update stage/score."""
    ts = ts or db.iso(db.now())
    db.add_event(con, lead_id, "wa_in" if channel == "whatsapp" else "email_in", body, "", ts)
    lead = db.one(con, "SELECT * FROM leads WHERE id=?", (lead_id,))
    stage = "engaged" if lead["stage"] in ("new", "contacted") else lead["stage"]
    opted_out = lead["opted_out"] or body.strip().lower().rstrip(".!") in OPT_OUT_WORDS
    con.execute("UPDATE leads SET last_inbound_at=?, stage=?, opted_out=?, updated_at=? WHERE id=?",
                (ts, stage, int(opted_out), ts, lead_id))
    if stage != lead["stage"]:
        db.add_event(con, lead_id, "stage", f"{lead['stage']} -> {stage} (lead replied)", "", ts)
    stop_enrollments(con, lead_id, "lead opted out" if opted_out else "lead replied")
    scoring.rescore(con, [lead_id])


def analyze(lead_id: int) -> bool:
    """Run Claude's analysis for one lead and fold it into the score."""
    with db.connect() as con:
        lead = db.one(con, "SELECT * FROM leads WHERE id=?", (lead_id,))
        if not lead or lead["stage"] in ("won", "lost"):
            return False
        events = db.rows(con, "SELECT * FROM events WHERE lead_id=? ORDER BY ts, id", (lead_id,))
    result = ai.analyze_lead(lead, events, db.iso(db.now())[:10])
    if not result:
        return False
    with db.connect() as con:
        con.execute(
            "UPDATE leads SET ai_probability=?, ai_timeline=?, ai_summary=?, ai_next_action=?, ai_signals=?,"
            " ai_objections=?, ai_scored_at=? WHERE id=?",
            (result["conversion_probability"], result["timeline"], result["summary"], result["next_best_action"],
             json.dumps(result["intent_signals"]), json.dumps(result["objections"]), db.iso(db.now()), lead_id),
        )
        scoring.rescore(con, [lead_id])
    return True


def analyze_in_background(lead_ids):
    def work():
        for lid in lead_ids:
            try:
                analyze(lid)
            except Exception:
                log.exception("AI analysis failed for lead %s", lid)
    threading.Thread(target=work, daemon=True).start()


def run_scheduler(stop: threading.Event, interval: float = 30.0):
    while not stop.is_set():
        try:
            tick()
        except Exception:
            log.exception("Scheduler tick failed")
        stop.wait(interval)


DEFAULT_SEQUENCE = {
    "name": "New lead nurture",
    "steps": [
        {"delay_hours": 0, "channel": "whatsapp", "wa_template": "", "ai_personalize": 0, "subject": "",
         "body": "Hi {first_name}, this is {agent}. Thanks for your interest in {project}. "
                 "Shall I send you the floor plans and payment plan?"},
        {"delay_hours": 48, "channel": "whatsapp", "wa_template": "", "ai_personalize": 1, "subject": "",
         "body": "Hi {first_name}, just checking you received the details on {project}. "
                 "Happy to answer any questions or set up a quick call."},
        {"delay_hours": 72, "channel": "email", "wa_template": "", "ai_personalize": 0,
         "subject": "Details on {project}",
         "body": "Hi {first_name},\n\nFollowing up on {project}. I can share current availability, "
                 "the payment plan and arrange a viewing whenever suits you.\n\nJust reply to this email "
                 "and I'll take it from there.\n\nBest regards,\n{agent}"},
        {"delay_hours": 120, "channel": "whatsapp", "wa_template": "", "ai_personalize": 1, "subject": "",
         "body": "Hi {first_name}, I don't want to crowd your inbox. Are you still looking at {project}, "
                 "or should I check back later?"},
    ],
}


def save_steps(con, sequence_id: int, steps: list):
    con.execute("DELETE FROM steps WHERE sequence_id=?", (sequence_id,))
    for i, s in enumerate(steps):
        con.execute(
            "INSERT INTO steps(sequence_id, position, delay_hours, channel, subject, body, wa_template, ai_personalize)"
            " VALUES(?,?,?,?,?,?,?,?)",
            (sequence_id, i, max(0.0, float(s.get("delay_hours") or 0)),
             "email" if s.get("channel") == "email" else "whatsapp", s.get("subject") or "",
             s.get("body") or "", s.get("wa_template") or "", int(bool(s.get("ai_personalize")))),
        )


def seed_default_sequence():
    with db.connect() as con:
        if db.one(con, "SELECT id FROM sequences LIMIT 1"):
            return
        cur = con.execute("INSERT INTO sequences(name) VALUES(?)", (DEFAULT_SEQUENCE["name"],))
        save_steps(con, cur.lastrowid, DEFAULT_SEQUENCE["steps"])
