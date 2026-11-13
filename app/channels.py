"""Outbound delivery: WhatsApp Business Cloud API and SMTP email.

Each sender returns (ok, error). Nothing here decides *whether* to send;
that is engine.deliver's job."""
import json
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage

from . import config


def send_whatsapp(to: str, body: str, template: str = "", first_name: str = ""):
    """Free-form text, or an approved template (required by Meta when the lead
    hasn't messaged you in the last 24 hours). The template is expected to take
    one body variable: the lead's first name."""
    payload = {"messaging_product": "whatsapp", "to": to}
    if template:
        payload["type"] = "template"
        payload["template"] = {
            "name": template,
            "language": {"code": config.get("WHATSAPP_TEMPLATE_LANG", "en")},
            "components": [{"type": "body", "parameters": [{"type": "text", "text": first_name or "there"}]}],
        }
    else:
        payload["type"] = "text"
        payload["text"] = {"body": body}
    url = (f"https://graph.facebook.com/{config.get('WHATSAPP_API_VERSION', 'v23.0')}"
           f"/{config.get('WHATSAPP_PHONE_ID')}/messages")
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {config.get('WHATSAPP_TOKEN')}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
        return True, ""
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        try:
            detail = json.loads(detail)["error"]["message"]
        except (ValueError, KeyError, TypeError):
            pass
        return False, f"WhatsApp API {e.code}: {detail}"[:500]
    except (urllib.error.URLError, TimeoutError) as e:
        return False, f"WhatsApp API unreachable: {e}"[:500]


def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = config.get("SMTP_FROM")
    msg["To"] = to
    msg["Subject"] = subject or "Following up"
    msg.set_content(body)
    try:
        port = int(config.get("SMTP_PORT", "587"))
        cls = smtplib.SMTP_SSL if port == 465 else smtplib.SMTP
        with cls(config.get("SMTP_HOST"), port, timeout=30) as s:
            if port != 465:
                s.starttls()
            if config.get("SMTP_USER"):
                s.login(config.get("SMTP_USER"), config.get("SMTP_PASSWORD"))
            s.send_message(msg)
        return True, ""
    except (smtplib.SMTPException, OSError) as e:
        return False, f"Email failed: {e}"[:500]
