"""Conversion scoring.

Three layers, blended into one 0-100 score:

1. Behavioural signals   - stage, replies, recency, unanswered follow-ups,
                           buying / negative language in notes and messages.
2. Learned priors        - conversion rate of the lead's source and project in
                           *your own* history, shrunk toward the overall rate
                           (empirical Bayes) so a source with 1 win out of 2
                           leads doesn't look like a 50% channel.
3. Claude's read         - probability from a language-model analysis of the
                           full conversation (see ai.py), when available.

Every score carries its reasons so it can be checked rather than trusted.
"""
import json
import math
import re

from . import db

STAGE_LOGIT = {"new": -0.3, "contacted": 0.0, "engaged": 0.9, "site_visit": 1.8, "negotiation": 2.6}
STAGE_LABEL = {"new": "New", "contacted": "Contacted", "engaged": "Engaged",
               "site_visit": "Site visit", "negotiation": "Negotiation"}

NEGATIVE = [
    r"not interest\w*", r"no(t)? (longer )?looking", r"didn'?t (respond|response|reply|pick ?up|connect|answer)",
    r"no (response|reply|answer)", r"not (responding|answering|reachable)", r"wrong number",
    r"just (looking|browsing)", r"next year", r"too expensive", r"out of budget", r"bought (elsewhere|from)",
    r"stop (messaging|calling)", r"do not (call|contact)", r"switched off",
]
POSITIVE = [
    (r"site visit|viewing|visit(ed)? the (site|project|unit|show ?room)|show ?room", "asked about a viewing"),
    (r"\beoi\b|token|booking|book(ed)? (a|the)|reserve", "talked about booking"),
    (r"payment plan|down ?payment|instal?ments?|mortgage|\broi\b|rental yield", "asked about payment terms"),
    (r"brochure|floor ?plan|send (me )?(the )?(details|price|prices|pricing|options)|availability|price list", "requested details"),
    (r"call me|let'?s (talk|meet|discuss)|when can (we|you)|meeting|zoom", "wants to talk"),
    (r"\binterested\b|sounds good|looks good|i like|ready to", "expressed interest"),
    (r"budget (is|of|around)|aed ?\d|\d ?(m|mn|million|k)\b", "shared a budget"),
]
INBOUND = ("wa_in", "email_in")
OUTBOUND = ("wa_out", "email_out")


def _logit(p):
    p = min(max(p, 1e-4), 1 - 1e-4)
    return math.log(p / (1 - p))


def _sigmoid(x):
    return 1 / (1 + math.exp(-x))


def learn_priors(leads: list) -> dict:
    """Base conversion rate plus shrunken per-source / per-project rates."""
    total = len(leads)
    won = sum(1 for l in leads if l["stage"] == "won")
    base = (won + 2) / (total + 30)  # ~6.7% until your own history takes over
    out = {"base": base, "source": {}, "project": {}}
    m = 10  # pseudo-leads: how much evidence before a group moves off the base rate
    for field in ("source", "project"):
        groups = {}
        for l in leads:
            key = (l[field] or "").strip().lower()
            if not key:
                continue
            g = groups.setdefault(key, [0, 0])
            g[0] += 1
            g[1] += l["stage"] == "won"
        for key, (n, w) in groups.items():
            out[field][key] = {"n": n, "won": w, "rate": (w + m * base) / (n + m)}
    return out


def score_lead(lead: dict, events: list, priors: dict, now=None) -> dict:
    now = now or db.now()
    if lead["stage"] == "won":
        return {"rule_score": 100, "timeline": "closed", "reasons": [["Deal closed", 0]], "next_action": ""}
    if lead["stage"] == "lost" or lead["opted_out"]:
        why = "Opted out of messages" if lead["opted_out"] else "Marked lost"
        return {"rule_score": 0, "timeline": "unlikely", "reasons": [[why, 0]], "next_action": ""}

    parts = []  # (reason, logit contribution)

    def add(reason, value):
        if abs(value) >= 0.05:
            parts.append((reason, value))

    add(f"Stage: {STAGE_LABEL.get(lead['stage'], lead['stage'])}", STAGE_LOGIT.get(lead["stage"], 0))

    for field in ("source", "project"):
        key = (lead[field] or "").strip().lower()
        g = priors[field].get(key)
        if g:
            delta = max(-1.0, min(1.0, _logit(g["rate"]) - _logit(priors["base"])))
            verb = "converts well" if delta > 0 else "rarely converts"
            add(f"{field.title()} '{lead[field]}' {verb} for you ({g['won']}/{g['n']} won)", delta)

    inbound = [e for e in events if e["kind"] in INBOUND]
    if inbound:
        add(f"{len(inbound)} repl{'y' if len(inbound) == 1 else 'ies'} from the lead", 0.35 * min(len(inbound), 4))
        days = (now - db.parse_ts(inbound[-1]["ts"])).total_seconds() / 86400
        if days < 2:
            add("Replied in the last 2 days", 1.0)
        elif days < 7:
            add("Replied this week", 0.6)
        elif days < 21:
            add("Replied in the last 3 weeks", 0.2)
        elif days > 45:
            add(f"Silent for {int(days)} days", -0.4)

    last_in_ts = inbound[-1]["ts"] if inbound else ""
    unanswered = sum(1 for e in events if e["kind"] in OUTBOUND and e["status"] != "failed" and e["ts"] > last_in_ts)
    if unanswered >= 5:
        add(f"{unanswered} messages unanswered", -1.0)
    elif unanswered >= 3:
        add(f"{unanswered} messages unanswered", -0.5)

    text = " ".join([lead["notes"] or ""] + [e["body"] for e in events if e["kind"] in INBOUND + ("note", "call")]).lower()
    neg_hits = 0
    for pat in NEGATIVE:
        if re.search(pat, text):
            neg_hits += 1
            text = re.sub(pat, " ", text)  # so "not interested" can't also count as "interested"
    if neg_hits:
        add("Negative signals in notes/messages", max(-1.5, -0.6 * neg_hits))
    pos = [label for pat, label in POSITIVE if re.search(pat, text)]
    if pos:
        add("Buying signals: " + ", ".join(pos), min(1.4, 0.45 * len(pos)))

    if lead["budget"]:
        add("Budget known", 0.3)
    if lead["email"] and lead["phone"]:
        add("Reachable on two channels", 0.1)
    age = (now - db.parse_ts(lead["created_at"])).total_seconds() / 86400
    if age > 60 and not inbound:
        add(f"{int(age)} days old with no reply", -0.5)

    # Evidence is damped: these signals overlap, and adding them at full weight
    # pushes good leads to an overconfident 98-99.
    p = _sigmoid(_logit(priors["base"]) + 0.75 * sum(v for _, v in parts))
    rule_score = round(p * 100)
    parts.sort(key=lambda x: -abs(x[1]))
    contact = [e for e in events if e["kind"] in INBOUND + OUTBOUND and e["status"] != "failed"]
    if neg_hits and not pos:
        action = "Negative signals; park this lead or mark it lost"
    elif contact and contact[-1]["kind"] in INBOUND:
        action = "They are waiting on your reply"
    elif not contact:
        action = "Make first contact"
    elif unanswered >= 3:
        action = "Messages aren't landing; try a call instead"
    elif lead["stage"] == "negotiation":
        action = "Confirm terms and ask for the booking"
    elif lead["stage"] == "site_visit":
        action = "Follow up on the viewing and ask for a decision"
    elif inbound:
        action = "Send what they asked for and propose a viewing"
    else:
        action = "Keep following up"
    return {
        "next_action": action,
        "rule_score": rule_score,
        "timeline": timeline_for(rule_score),
        "reasons": [[r, round(v, 2)] for r, v in parts],
    }


def timeline_for(score: int) -> str:
    if score >= 70:
        return "this_week"
    if score >= 45:
        return "this_month"
    if score >= 20:
        return "this_quarter"
    return "later"


def blend(rule_score: int, ai_probability) -> int:
    if ai_probability is None:
        return rule_score
    return round(0.5 * rule_score + 0.5 * ai_probability)


def rescore(con, lead_ids=None) -> None:
    """Recompute and store scores. Priors use every lead, so call without ids
    after stages change in bulk."""
    all_leads = db.rows(con, "SELECT * FROM leads")
    priors = learn_priors(all_leads)
    targets = all_leads if lead_ids is None else [l for l in all_leads if l["id"] in set(lead_ids)]
    by_lead = {}  # one query for everyone: round trips are slow against a hosted database
    if lead_ids is None:
        ev = db.rows(con, "SELECT * FROM events ORDER BY ts, id")
    elif targets:
        marks = ",".join("?" * len(targets))
        ev = db.rows(con, f"SELECT * FROM events WHERE lead_id IN ({marks}) ORDER BY ts, id", [l["id"] for l in targets])
    else:
        ev = []
    for e in ev:
        by_lead.setdefault(e["lead_id"], []).append(e)
    for lead in targets:
        events = by_lead.get(lead["id"], [])
        r = score_lead(lead, events, priors)
        closed = lead["stage"] in ("won", "lost") or lead["opted_out"]
        ai_p = None if closed else lead["ai_probability"]
        final = blend(r["rule_score"], ai_p)
        timeline = r["timeline"] if closed or not lead["ai_timeline"] else lead["ai_timeline"]
        con.execute(
            "UPDATE leads SET score=?, rule_score=?, timeline=?, score_reasons=?, next_action=? WHERE id=?",
            (final, r["rule_score"], timeline, json.dumps(r["reasons"]), r["next_action"], lead["id"]),
        )
