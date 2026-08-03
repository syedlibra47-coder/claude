import csv
import re
from collections import Counter
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
REPORT_DIR = Path(__file__).resolve().parent.parent / "reports"
REPORT_DIR.mkdir(exist_ok=True)

SOLD_PREFIX_RE = re.compile(r"^sold\b", re.IGNORECASE)
DEAD_RE = re.compile(
    r"didn'?t (respond|response|pickup|pick up|connect)|no response|not interest",
    re.IGNORECASE,
)


def load_ragged_tsv(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader)
        for raw in reader:
            if not any(cell.strip() for cell in raw):
                continue
            rows.append(raw)
    return header, rows


def last_nonempty(cells):
    for cell in reversed(cells):
        if cell.strip():
            return cell.strip()
    return ""


def build_lead(segment, status_raw, name, mobile, source, project, remaining_cells, default_source):
    text_blob = " ".join(c for c in remaining_cells if c.strip())
    outcome = last_nonempty(remaining_cells)
    is_sold = bool(SOLD_PREFIX_RE.match(outcome.lstrip(", ")))
    return {
        "segment": segment,
        "status_raw": status_raw.strip(),
        "engaged": (status_raw.strip().lower() == "yes") if segment == "Personal" else None,
        "name": name.strip(),
        "mobile": mobile.strip(),
        "source": source.strip() or default_source,
        "project": project.strip(),
        "text": text_blob,
        "outcome": outcome,
        "is_sold": is_sold,
        "is_dead": (not is_sold) and bool(DEAD_RE.search(text_blob)),
    }


def parse_personal(path):
    _, rows = load_ragged_tsv(path)
    leads = []
    for r in rows:
        status, name, mobile, email, source, project = r[0], r[1], r[2], r[3], r[4], r[5]
        leads.append(build_lead("Personal", status, name, mobile, source, project, r[6:], "Personal - YT"))
    return leads


def parse_company(path):
    _, rows = load_ragged_tsv(path)
    leads = []
    for r in rows:
        name, mobile, email, source, project = r[0], r[1], r[2], r[3], r[4]
        leads.append(build_lead("Company", "", name, mobile, source, project, r[5:], "Company"))
    return leads


def normalize_source(src):
    s = src.strip().lower()
    if "personal" in s:
        return "Personal - YT"
    if s == "company":
        return "Company"
    return src.strip()


def main():
    personal = parse_personal(DATA_DIR / "leads_raw.tsv")
    company = parse_company(DATA_DIR / "leads_company_raw.tsv")
    all_leads = personal + company

    total = len(all_leads)
    sold = [l for l in all_leads if l["is_sold"]]
    dead = [l for l in all_leads if l["is_dead"] and not l["is_sold"]]
    engaged_personal = [l for l in personal if l["engaged"]]

    project_counter = Counter(l["project"] for l in all_leads if l["project"])
    source_counter = Counter(normalize_source(l["source"]) for l in all_leads)
    segment_counter = Counter(l["segment"] for l in all_leads)

    lines = []
    lines.append("# Lead Analysis Report\n")
    lines.append(f"**Total leads:** {total}")
    lines.append(f"**Personal - YT leads:** {len(personal)}")
    lines.append(f"**Company leads:** {len(company)}\n")

    lines.append("## Conversion")
    lines.append(f"- Closed/Sold deals: **{len(sold)}** ({len(sold)/total:.1%} of all leads)")
    lines.append(f"- Personal-YT segment conversion: {sum(1 for l in sold if l['segment']=='Personal')}/{len(personal)} = {sum(1 for l in sold if l['segment']=='Personal')/len(personal):.1%}")
    lines.append(f"- Company segment conversion: {sum(1 for l in sold if l['segment']=='Company')}/{len(company)} = {sum(1 for l in sold if l['segment']=='Company')/len(company):.1%}")
    lines.append(f"- Dead/unresponsive leads (no sale, explicit non-response): **{len(dead)}** ({len(dead)/total:.1%})\n")

    lines.append("## Closed Deals")
    for l in sold:
        lines.append(f"- **{l['name']}** ({l['segment']}, project interest: {l['project'] or 'n/a'}) — {l['outcome']}")
    lines.append("")

    lines.append("## Engagement status (Personal - YT only)")
    lines.append(f"- Marked 'Yes' (engaged/responded): {len(engaged_personal)}/{len(personal)} = {len(engaged_personal)/len(personal):.1%}")
    lines.append(f"- Unmarked (blank status): {len(personal)-len(engaged_personal)}\n")

    lines.append("## Top projects by lead interest")
    for proj, cnt in project_counter.most_common(15):
        lines.append(f"- {proj}: {cnt}")
    lines.append("")

    lines.append("## Leads by source")
    for src, cnt in source_counter.most_common():
        lines.append(f"- {src}: {cnt}")
    lines.append("")

    lines.append("## Leads by segment")
    for seg, cnt in segment_counter.most_common():
        lines.append(f"- {seg}: {cnt}")
    lines.append("")

    out_path = REPORT_DIR / "lead_analysis_report.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print(f"\nReport written to {out_path}")


if __name__ == "__main__":
    main()
