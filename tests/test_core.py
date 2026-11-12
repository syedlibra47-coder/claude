import hashlib
import hmac
import json
from datetime import timedelta
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app import ai, channels, db, engine, importer, scoring
from app.main import app


def make_lead(con, **kw):
    lead_id = db.create_lead(con, {"name": "Test Lead", "phone": "0501234567", **kw})
    return lead_id


def get(con, lead_id):
    return db.one(con, "SELECT * FROM leads WHERE id=?", (lead_id,))


def set_mode(con, mode):
    con.execute("UPDATE settings SET value=? WHERE key='send_mode'", (mode,))


# ---------- phones ----------

def test_phone_normalisation():
    assert db.normalize_phone("050 123 4567") == "971501234567"
    assert db.normalize_phone("+44 7700 900123") == "447700900123"
    assert db.normalize_phone("00971501234567") == "971501234567"
    assert db.normalize_phone("") == ""


# ---------- scoring ----------

def test_engaged_lead_outranks_silent_lead():
    with db.connect() as con:
        hot = make_lead(con, name="Hot", phone="0500000001", budget="1.2M")
        cold = make_lead(con, name="Cold", phone="0500000002")
        engine.handle_inbound(con, hot, "whatsapp", "Can you send the payment plan? I'd like a site visit this week")
        for _ in range(5):
            db.add_event(con, cold, "wa_out", "following up", "sent")
        scoring.rescore(con)
        assert get(con, hot)["score"] > 40 > get(con, cold)["score"]
        reasons = json.loads(get(con, hot)["score_reasons"])
        assert any("Buying signals" in r[0] for r in reasons)


def test_not_interested_is_negative_not_positive():
    with db.connect() as con:
        a = make_lead(con, phone="0500000001", notes="Said he is interested")
        b = make_lead(con, phone="0500000002", notes="Not interested, didn't respond")
        scoring.rescore(con)
        assert get(con, a)["score"] > get(con, b)["score"]
        assert not any("Buying" in r[0] for r in json.loads(get(con, b)["score_reasons"]))


def test_closed_leads_are_pinned():
    with db.connect() as con:
        w = make_lead(con, phone="0500000001", stage="won")
        l = make_lead(con, phone="0500000002", stage="lost")
        scoring.rescore(con)
        assert get(con, w)["score"] == 100 and get(con, l)["score"] == 0


def test_priors_shrink_small_samples():
    leads = [{"stage": "won", "source": "Referral", "project": ""}] + \
            [{"stage": "new", "source": "Ads", "project": ""} for _ in range(40)]
    p = scoring.learn_priors(leads)
    # One win from one lead is good news, but nowhere near "100% conversion".
    assert p["base"] < p["source"]["referral"]["rate"] < 0.25
    assert p["source"]["ads"]["rate"] < p["base"]


def test_ai_probability_is_blended():
    with db.connect() as con:
        lid = make_lead(con)
        scoring.rescore(con)
        before = get(con, lid)["score"]
        con.execute("UPDATE leads SET ai_probability=90, ai_timeline='this_week' WHERE id=?", (lid,))
        scoring.rescore(con, [lid])
        after = get(con, lid)
        assert after["score"] == round((before + 90) / 2) and after["timeline"] == "this_week"


# ---------- import ----------

def test_import_ragged_tsv():
    text = (
        "Status\tName\tMobile\tEmail\tSource\tProject\tFollow up\n"
        "Yes\tDr Adnan\t0501112222\ta@x.com\tPersonal - YT\tMaison Elyse\tcalled, liked it\tSold studio in Binghatti\n"
        "\tOmar\t0503334444\t\tCompany\tDanube\tdidn't respond\n"
        "\tOmar again\t050 333 4444\t\tCompany\tDanube\n"
        "\t\t\t\t\t\t\n"
    )
    with db.connect() as con:
        r = importer.import_text(con, text)
        assert r == {"created": 2, "duplicates": 1, "empty": 1}
        adnan = db.one(con, "SELECT * FROM leads WHERE name='Dr Adnan'")
        assert adnan["stage"] == "won" and adnan["phone"] == "971501112222"
        assert db.one(con, "SELECT COUNT(*) AS n FROM events WHERE lead_id=?", (adnan["id"],))["n"] == 2
        assert db.one(con, "SELECT stage FROM leads WHERE name='Omar'")["stage"] == "contacted"


# ---------- sequences ----------

def test_sequence_runs_on_schedule_and_stops_on_reply():
    with db.connect() as con:
        lid = make_lead(con, project="Park Five")
        seq = db.one(con, "SELECT id FROM sequences")["id"]
        assert engine.enroll(con, lid, seq)
        assert engine.enroll(con, lid, seq) is None  # no double enrolment
    now = db.now()
    assert engine.tick(now) == 1                      # step 1 is immediate
    assert engine.tick(now + timedelta(hours=1)) == 0  # step 2 waits 48h
    assert engine.tick(now + timedelta(hours=49)) == 1
    with db.connect() as con:
        out = db.rows(con, "SELECT * FROM events WHERE lead_id=? AND kind='wa_out'", (lid,))
        assert len(out) == 2 and out[0]["status"] == "simulated" and "Park Five" in out[0]["body"]
        assert get(con, lid)["stage"] == "contacted"
        engine.handle_inbound(con, lid, "whatsapp", "Yes please send details")
        assert get(con, lid)["stage"] == "engaged"
        enr = db.one(con, "SELECT * FROM enrollments WHERE lead_id=?", (lid,))
        assert enr["status"] == "stopped" and enr["stop_reason"] == "lead replied"
    assert engine.tick(now + timedelta(days=30)) == 0


def test_approve_mode_holds_drafts_until_approved():
    with db.connect() as con:
        set_mode(con, "approve")
        lid = make_lead(con)
        engine.enroll(con, lid, db.one(con, "SELECT id FROM sequences")["id"])
    engine.tick()
    with db.connect() as con:
        draft = db.one(con, "SELECT * FROM outbox")
        assert draft["status"] == "draft"
        assert not db.rows(con, "SELECT id FROM events WHERE kind='wa_out'")
    client = TestClient(app)
    r = client.post(f"/api/outbox/{draft['id']}/approve", json={"body": "Edited text"})
    assert r.json()["status"] == "simulated"
    with db.connect() as con:
        assert db.one(con, "SELECT body FROM events WHERE kind='wa_out'")["body"] == "Edited text"


def test_quiet_hours_defer_sends(monkeypatch):
    monkeypatch.setenv("TZ_OFFSET_HOURS", "0")
    with db.connect() as con:
        con.execute("UPDATE settings SET value='21' WHERE key='quiet_start'")
        con.execute("UPDATE settings SET value='9' WHERE key='quiet_end'")
        lid = make_lead(con)
        engine.enroll(con, lid, db.one(con, "SELECT id FROM sequences")["id"])
    night = db.now().replace(hour=23, minute=0, second=0, microsecond=0) + timedelta(days=1)
    assert engine.tick(night) == 0
    assert engine.tick(night + timedelta(hours=9)) == 0   # 08:00, still quiet
    assert engine.tick(night + timedelta(hours=10)) == 1  # 09:00


def test_opt_out_blocks_sending():
    with db.connect() as con:
        lid = make_lead(con)
        engine.handle_inbound(con, lid, "whatsapp", "STOP")
        assert get(con, lid)["opted_out"] == 1 and get(con, lid)["score"] == 0
        oid = engine.queue_message(con, lid, "whatsapp", "hello")
        assert engine.deliver(con, oid)["status"] == "failed"


def test_whatsapp_24h_window(monkeypatch):
    monkeypatch.setenv("WHATSAPP_TOKEN", "t")
    monkeypatch.setenv("WHATSAPP_PHONE_ID", "1")
    calls = []
    monkeypatch.setattr(channels, "send_whatsapp", lambda to, body, template="", first_name="":
                        (calls.append((to, body, template, first_name)), (True, ""))[1])
    with db.connect() as con:
        set_mode(con, "auto")
        lid = make_lead(con, name="Sara Khan")
        # Never replied, no template: Meta would reject it, so we don't try.
        r = engine.deliver(con, engine.queue_message(con, lid, "whatsapp", "hi"))
        assert r["status"] == "failed" and "24-hour" in r["error"] and not calls
        # With an approved template it goes out as a template.
        r = engine.deliver(con, engine.queue_message(con, lid, "whatsapp", "hi", wa_template="follow_up_1"))
        assert r["status"] == "sent" and calls[-1] == ("971501234567", "", "follow_up_1", "Sara")
        # After the lead replies, free-form text is allowed.
        engine.handle_inbound(con, lid, "whatsapp", "hello")
        r = engine.deliver(con, engine.queue_message(con, lid, "whatsapp", "thanks for replying"))
        assert r["status"] == "sent" and calls[-1][1] == "thanks for replying" and calls[-1][2] == ""


# ---------- webhook ----------

def wa_payload(sender, text):
    return {"entry": [{"changes": [{"value": {
        "contacts": [{"wa_id": sender, "profile": {"name": "New Person"}}],
        "messages": [{"from": sender, "type": "text", "text": {"body": text}, "timestamp": "1790000000"}],
    }}]}]}


def test_webhook_requires_valid_signature_and_logs_reply(monkeypatch):
    monkeypatch.setenv("WHATSAPP_APP_SECRET", "shh")
    client = TestClient(app)
    with db.connect() as con:
        lid = make_lead(con)
    raw = json.dumps(wa_payload("971501234567", "I am interested")).encode()
    assert client.post("/webhook/whatsapp", content=raw, headers={"x-hub-signature-256": "sha256=bad"}).status_code == 403
    sig = "sha256=" + hmac.new(b"shh", raw, hashlib.sha256).hexdigest()
    assert client.post("/webhook/whatsapp", content=raw, headers={"x-hub-signature-256": sig}).status_code == 200
    with db.connect() as con:
        assert get(con, lid)["stage"] == "engaged"
        assert db.one(con, "SELECT body FROM events WHERE kind='wa_in'")["body"] == "I am interested"


def test_webhook_creates_lead_for_unknown_number(monkeypatch):
    monkeypatch.setenv("WHATSAPP_VERIFY_TOKEN", "v")
    client = TestClient(app)
    assert client.get("/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=v&hub.challenge=42").text == "42"
    assert client.post("/webhook/whatsapp", json=wa_payload("447700900123", "Hi")).status_code == 200
    with db.connect() as con:
        lead = db.one(con, "SELECT * FROM leads")
        assert lead["name"] == "New Person" and lead["phone"] == "447700900123" and lead["source"] == "WhatsApp inbound"


def test_webhook_closed_when_unconfigured():
    assert TestClient(app).post("/webhook/whatsapp", json=wa_payload("447700900123", "Hi")).status_code == 403


# ---------- API & auth ----------

def test_api_roundtrip_and_password(monkeypatch):
    client = TestClient(app)
    lid = client.post("/api/leads", json={"name": "Aisha", "phone": "0509998888"}).json()["id"]
    assert client.post("/api/leads", json={"name": "Dup", "phone": "+971509998888"}).status_code == 409
    client.post(f"/api/leads/{lid}/events", json={"kind": "wa_in", "body": "Call me tomorrow"})
    client.patch(f"/api/leads/{lid}", json={"stage": "won"})
    lead = client.get(f"/api/leads/{lid}").json()
    assert lead["score"] == 100 and lead["events"]
    assert client.get("/api/stats").json()["by_stage"] == {"won": 1}
    monkeypatch.setenv("APP_PASSWORD", "pw")
    assert client.get("/api/leads").status_code == 401
    assert client.get("/api/leads", auth=("admin", "pw")).status_code == 200


# ---------- AI ----------

def test_ai_analysis_request_and_fallback(monkeypatch):
    with db.connect() as con:
        lid = make_lead(con)
    assert engine.analyze(lid) is False  # no key: quietly unavailable

    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    seen = {}

    def fake_parse(**kw):
        seen.update(kw)
        parsed = ai.LeadAnalysis(conversion_probability=140, timeline="this_month", intent_signals=["asked price"],
                                 objections=[], summary="Warm.", next_best_action="Send the payment plan.")
        return SimpleNamespace(stop_reason="end_turn", parsed_output=parsed)

    fake = SimpleNamespace(beta=SimpleNamespace(messages=SimpleNamespace(parse=fake_parse)))
    monkeypatch.setattr(ai, "client", lambda: fake)
    assert engine.analyze(lid) is True
    assert seen["model"] == "claude-opus-5-5" and seen["output_format"] is ai.LeadAnalysis
    assert "<lead_record>" in seen["messages"][0]["content"]
    with db.connect() as con:
        lead = get(con, lid)
        assert lead["ai_probability"] == 100 and lead["ai_next_action"] == "Send the payment plan."
