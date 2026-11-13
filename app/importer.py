"""Import leads from a CSV/TSV export (Google Sheets, Excel, a CRM).

Columns are matched by header name. Anything that isn't a recognised column,
including extra trailing cells on a row, is kept as a remark on the lead, so
free-form follow-up logs survive the import."""
import csv
import io
import re

from . import db

SYNONYMS = {
    "name": {"name", "client", "client name", "lead", "lead name", "full name", "customer", "customer name"},
    "phone": {"phone", "mobile", "number", "contact", "whatsapp", "mobile no", "mobile number", "phone number",
              "contact number", "contact no", "phone no"},
    "email": {"email", "e-mail", "mail", "email address", "email id"},
    "source": {"source", "lead source", "channel"},
    "project": {"project", "property", "interest", "interested in", "project interest"},
    "budget": {"budget"},
    "notes": {"notes", "note"},
    "stage": {"stage"},
    "status": {"status"},
}
SOLD = re.compile(r"^[\s,]*sold\b", re.IGNORECASE)


def import_text(con, text: str) -> dict:
    text = text.lstrip("﻿")
    first_line = text.split("\n", 1)[0]
    delimiter = "\t" if "\t" in first_line else (";" if first_line.count(";") > first_line.count(",") else ",")
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    try:
        header = [h.strip().lower() for h in next(reader)]
    except StopIteration:
        raise ValueError("The file is empty")
    col = {}
    for i, h in enumerate(header):
        for field, names in SYNONYMS.items():
            if h in names and field not in col:
                col[field] = i
    if "name" not in col and "phone" not in col:
        raise ValueError("Could not find a 'name' or 'phone' column in the header row")
    mapped = set(col.values())
    result = {"created": 0, "duplicates": 0, "empty": 0}

    for raw in reader:
        cell = lambda f: raw[col[f]].strip() if f in col and col[f] < len(raw) else ""
        name, phone = cell("name"), db.normalize_phone(cell("phone"))
        if not name and not phone:
            result["empty"] += 1
            continue
        if phone and db.find_lead_by_phone(con, phone):
            result["duplicates"] += 1
            continue
        remarks = [c.strip() for i, c in enumerate(raw) if i not in mapped and c.strip()]
        stage = cell("stage").lower().replace(" ", "_")
        if stage not in db.STAGES:
            if remarks and SOLD.match(remarks[-1]):
                stage = "won"
            elif cell("status").lower() == "yes":
                stage = "engaged"
            else:
                stage = "contacted" if remarks else "new"
        lead_id = db.create_lead(con, {
            "name": name, "phone": phone, "email": cell("email"), "source": cell("source"),
            "project": cell("project"), "budget": cell("budget"), "notes": cell("notes"), "stage": stage,
        })
        for r in remarks:
            db.add_event(con, lead_id, "note", r)
        result["created"] += 1
    return result
