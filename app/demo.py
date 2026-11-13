"""Fictional leads for trying the dashboard (scripts/seed_demo.py, or SEED_DEMO=1)."""
from datetime import timedelta

from . import db, engine, scoring

# name, phone, email, source, project, budget, stage, [(days_ago, kind, text)]
DEMO = [
    ("Layla Haddad", "0505550101", "layla@example.com", "YouTube", "Harbour Gate", "AED 1.4M", "site_visit", [
        (9, "wa_out", "Hi Layla, thanks for your interest in Harbour Gate. Shall I send the floor plans?"),
        (9, "wa_in", "Yes please. What's the payment plan on the 1 bed?"),
        (8, "wa_out", "60/40 with 10% on booking. Sending the plans now."),
        (3, "call", "Visited the show apartment with her husband. Liked the 1BR on the 12th floor."),
        (1, "wa_in", "We discussed it at home. Can you hold the unit until Saturday? We want to pay the booking token."),
    ]),
    ("Omar Siddiqui", "0505550102", "", "Referral", "Marina Crest", "AED 2.1M", "engaged", [
        (5, "wa_out", "Hi Omar, Faisal mentioned you're looking at Marina Crest."),
        (4, "wa_in", "Yes, send me the brochure and price list for 2 bedrooms"),
        (4, "wa_out", "Sent. Happy to arrange a viewing this week."),
    ]),
    ("Priya Nair", "0505550103", "priya@example.com", "YouTube", "Harbour Gate", "", "engaged", [
        (14, "wa_out", "Hi Priya, thanks for reaching out about Harbour Gate."),
        (13, "wa_in", "Thanks. I'm comparing a few options, what is the rental yield like?"),
        (13, "wa_out", "Around 6-7% for comparable units. I can send recent rental data."),
        (6, "wa_out", "Hi Priya, did you get a chance to look at the numbers?"),
    ]),
    ("Daniel Okafor", "0505550104", "", "Portal", "Palm Vista", "AED 900K", "contacted", [
        (20, "wa_out", "Hi Daniel, following up on your Palm Vista enquiry."),
        (17, "wa_out", "Hi Daniel, just checking you received the details."),
        (12, "wa_out", "Hi Daniel, are you still looking?"),
        (6, "email_out", "Following up on Palm Vista."),
    ]),
    ("Fatima Al Mansoori", "0505550105", "fatima@example.com", "Referral", "Marina Crest", "AED 3M", "negotiation", [
        (12, "call", "Second viewing done. Wants the corner 3BR. Asked for a discount on the service charge."),
        (2, "wa_in", "If the developer can do the 2% we are ready to sign the EOI this week."),
    ]),
    ("Chen Wei", "0505550106", "", "Portal", "Palm Vista", "", "contacted", [
        (30, "wa_out", "Hi Chen, thanks for your enquiry."),
        (29, "note", "Called twice, didn't pick up."),
    ]),
    ("Sofia Rossi", "0505550107", "sofia@example.com", "YouTube", "Harbour Gate", "", "new", []),
    ("Hamza Qureshi", "0505550108", "", "Portal", "Palm Vista", "", "contacted", [
        (10, "wa_out", "Hi Hamza, following up on Palm Vista."),
        (9, "wa_in", "Not interested anymore, we bought elsewhere."),
    ]),
    ("Grace Mensah", "0505550109", "grace@example.com", "Referral", "Marina Crest", "AED 1.8M", "won", [
        (40, "note", "Sold 1BR in Marina Crest."),
    ]),
    ("Yusuf Demir", "0505550110", "", "YouTube", "Harbour Gate", "AED 1.1M", "won", [
        (55, "note", "Sold studio in Harbour Gate."),
    ]),
    ("Anna Kowalska", "0505550111", "anna@example.com", "Portal", "Palm Vista", "", "new", []),
    ("Rashid Karim", "0505550112", "", "YouTube", "Marina Crest", "AED 2.5M", "engaged", [
        (3, "wa_out", "Hi Rashid, thanks for watching the Marina Crest walkthrough."),
        (2, "wa_in", "Looks good. When can we meet? I'm in Dubai next week."),
    ]),
]


def seed() -> int:
    db.init()
    engine.seed_default_sequence()
    now = db.now()
    with db.connect() as con:
        if db.one(con, "SELECT id FROM leads LIMIT 1"):
            return 0
        for name, phone, email, source, project, budget, stage, history in DEMO:
            oldest = max([d for d, _, _ in history] + [2])
            lead_id = db.create_lead(con, {"name": name, "phone": phone, "email": email, "source": source,
                                           "project": project, "budget": budget, "stage": stage,
                                           "created_at": db.iso(now - timedelta(days=oldest + 1))})
            for days, kind, text in history:
                ts = db.iso(now - timedelta(days=days, hours=2))
                db.add_event(con, lead_id, kind, text, "sent" if kind.endswith("_out") else "", ts)
                if kind.endswith("_in"):
                    con.execute("UPDATE leads SET last_inbound_at=? WHERE id=?", (ts, lead_id))
                if kind.endswith("_out"):
                    con.execute("UPDATE leads SET last_outbound_at=? WHERE id=?", (ts, lead_id))
        scoring.rescore(con)
        seq = db.one(con, "SELECT id FROM sequences LIMIT 1")["id"]
        for name in ("Sofia Rossi", "Anna Kowalska"):
            engine.enroll(con, db.one(con, "SELECT id FROM leads WHERE name=?", (name,))["id"], seq)
    return len(DEMO)
