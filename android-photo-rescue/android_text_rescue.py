#!/usr/bin/env python3
r"""
Android Text Rescue
===================
A free, open tool that recovers text messages (SMS/MMS) from an Android phone's
data -- including DELETED messages that still linger in the database file.

It handles the two real, honest sources of Android texts:

  1. An SMS BACKUP file (easiest, no root):
     The popular free app "SMS Backup & Restore" writes an .xml file (usually in
     Download/ or on an SD card). Point this tool at it and it turns it into a
     clean, readable page of all your conversations.

  2. The message DATABASE "mmssms.db" (recovers DELETED texts):
     Android keeps SMS in a SQLite database. When you delete a text, its row is
     just marked free -- the actual words stay in the file's empty space until
     overwritten. This tool:
        - reads every EXISTING message from the database, AND
        - carves recoverable text out of the file's free space to bring back
          DELETED messages.

WHAT YOU NEED / THE HONEST CATCH:
  - The backup .xml works for anyone who used SMS Backup & Restore. (Best case.)
  - Getting "mmssms.db" off a NON-rooted phone is hard -- it lives in protected
    storage. You usually need either an ADB backup, a phone/vendor backup that
    contains it, or a rooted phone. If you can get that file, this tool will
    pull deleted texts out of it. (Same limit every tool, incl. Dr. Fone, hits.)

Nothing is uploaded. Everything stays on your PC.

------------------------------------------------------------------------------
HOW TO USE (Windows):
  1. Install Python from https://python.org (tick "Add Python to PATH").
  2. Put your backup .xml and/or mmssms.db file in a folder.
  3. Double-click RUN_ME_TEXTS.bat  (or:  python android_text_rescue.py )
  4. Paste the path to that folder (or directly to a file).
  5. Open the "RecoveredTexts" folder -- you'll get a readable .html page and a
     .csv spreadsheet of every message it could recover.
------------------------------------------------------------------------------
"""

import os
import re
import sys
import csv
import html
import sqlite3
import tempfile
import datetime
import xml.etree.ElementTree as ET

OUT_NAME = "RecoveredTexts"
# printable text runs of at least this many chars are treated as candidate
# message bodies when carving free space.
MIN_CARVE_LEN = 6


def ts_to_str(ms):
    """Android stores dates as milliseconds since 1970."""
    try:
        ms = int(ms)
        if ms > 10_000_000_000:  # looks like milliseconds
            ms //= 1000
        return datetime.datetime.fromtimestamp(ms).strftime("%Y-%m-%d %H:%M")
    except (ValueError, OverflowError, OSError, TypeError):
        return ""


# ---------------------------------------------------------------------------
# Source 1: SMS Backup & Restore XML
# ---------------------------------------------------------------------------
def parse_backup_xml(path):
    msgs = []
    try:
        for _evt, el in ET.iterparse(path, events=("end",)):
            if el.tag == "sms":
                msgs.append({
                    "source": "backup",
                    "status": "saved",
                    "contact": el.get("contact_name") or el.get("address") or "",
                    "address": el.get("address") or "",
                    "date": ts_to_str(el.get("date")),
                    "direction": "received" if el.get("type") == "1" else "sent",
                    "body": el.get("body") or "",
                })
                el.clear()
    except ET.ParseError:
        pass
    return msgs


# ---------------------------------------------------------------------------
# Source 2: mmssms.db  -- existing rows
# ---------------------------------------------------------------------------
def read_db_messages(path):
    msgs = []
    bodies = set()
    # copy to temp so we never touch the original, and to dodge locks
    tmp = os.path.join(tempfile.gettempdir(), "mmssms_copy.db")
    try:
        with open(path, "rb") as src, open(tmp, "wb") as dst:
            dst.write(src.read())
        con = sqlite3.connect(tmp)
        con.text_factory = lambda b: b.decode("utf-8", "replace")
        cur = con.cursor()
        # the SMS table is usually named "sms"
        try:
            cur.execute("SELECT address, date, type, body FROM sms")
            rows = cur.fetchall()
        except sqlite3.OperationalError:
            rows = []
        for address, date, type_, body in rows:
            body = body or ""
            bodies.add(body.strip())
            msgs.append({
                "source": "database",
                "status": "saved",
                "contact": address or "",
                "address": address or "",
                "date": ts_to_str(date),
                "direction": "received" if str(type_) == "1" else "sent",
                "body": body,
            })
        con.close()
    except (sqlite3.DatabaseError, OSError):
        pass
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    return msgs, bodies


# ---------------------------------------------------------------------------
# Source 2b: mmssms.db  -- carve DELETED text out of the raw file
# ---------------------------------------------------------------------------
# matches readable text (printable ASCII + common punctuation/space). We carve
# runs of such characters, then keep ones that look like real messages.
_TEXT_RUN = re.compile(rb"[\x20-\x7e]{%d,}" % MIN_CARVE_LEN)
# throw away runs that are database plumbing, not human text (case-insensitive).
_NOISE = re.compile(
    r"sqlite|format\s*3|create\s|insert\s|\btable\b|\bindex\b|\btrigger\b|"
    r"primary\s*key|autoincrement|integer|varchar|android_metadata|content://|"
    r"\.db$|com\.android|providers\.telephony",
    re.IGNORECASE,
)


def _norm(s):
    """Collapse to lowercase alphanumerics for de-duplication."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def carve_deleted_text(path, known_bodies):
    found = []
    seen = set()
    known_norm = {_norm(b) for b in known_bodies if b.strip()}
    try:
        with open(path, "rb") as f:
            data = f.read()
    except OSError:
        return found
    for m in _TEXT_RUN.finditer(data):
        text = m.group().decode("ascii", "ignore").strip()
        if len(text) < MIN_CARVE_LEN:
            continue
        # real texts almost always have a space; this drops schema tokens/ids
        if " " not in text:
            continue
        if _NOISE.search(text):
            continue
        cnorm = _norm(text)
        if not cnorm or cnorm in seen or cnorm in known_norm:
            continue
        # skip fragments that are just part of an existing message
        if any(cnorm in kn or kn in cnorm for kn in known_norm):
            continue
        # must be mostly letters, not a blob of symbols/digits
        letters = sum(c.isalpha() for c in text)
        if letters < max(5, len(text) * 0.5):
            continue
        seen.add(cnorm)
        found.append({"body": text, "norm": cnorm})

    # collapse overlapping fragments of the same message: keep the longest,
    # drop any whose normalized text is contained in a longer kept one.
    found.sort(key=lambda c: len(c["norm"]), reverse=True)
    kept = []
    for c in found:
        if any(c["norm"] in k["norm"] for k in kept):
            continue
        kept.append(c)
    return [{
        "source": "database",
        "status": "possibly deleted",
        "contact": "",
        "address": "",
        "date": "",
        "direction": "",
        "body": c["body"],
    } for c in kept]


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def write_outputs(msgs, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, OUT_NAME + ".csv")
    html_path = os.path.join(out_dir, OUT_NAME + ".html")

    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["status", "source", "contact", "address", "date", "direction", "message"])
        for m in msgs:
            w.writerow([m["status"], m["source"], m["contact"], m["address"],
                        m["date"], m["direction"], m["body"]])

    rows = []
    for m in msgs:
        flag = "🟢" if m["status"] == "saved" else "🟡"
        cls = "saved" if m["status"] == "saved" else "deleted"
        meta = " · ".join(x for x in [m["contact"], m["date"], m["direction"]] if x)
        rows.append(
            f'<div class="msg {cls}"><div class="meta">{flag} {html.escape(meta) or m["status"]}</div>'
            f'<div class="body">{html.escape(m["body"])}</div></div>'
        )
    page = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recovered Texts</title><style>
body{{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0b1220;color:#e8eefc;margin:0;padding:16px}}
h1{{font-size:20px}} .legend{{color:#9fb0cf;font-size:13px;margin-bottom:14px}}
.msg{{background:#111c30;border:1px solid #24395c;border-radius:12px;padding:10px 12px;margin:8px 0}}
.msg.deleted{{border-color:#ffb84d;background:#1c1606}}
.meta{{font-size:11px;color:#9fb0cf;margin-bottom:4px}}
.body{{white-space:pre-wrap;font-size:14px}}
</style></head><body>
<h1>📨 Recovered Texts — {len(msgs)} messages</h1>
<div class="legend">🟢 saved/existing &nbsp;&nbsp; 🟡 possibly deleted (carved from free space — may be partial)</div>
{''.join(rows)}
</body></html>"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(page)
    return csv_path, html_path


# ---------------------------------------------------------------------------
def gather_files(target):
    """Return (xml_files, db_files) from a file or folder path."""
    xmls, dbs = [], []
    paths = []
    if os.path.isfile(target):
        paths = [target]
    elif os.path.isdir(target):
        for root, _d, files in os.walk(target):
            for n in files:
                paths.append(os.path.join(root, n))
    for p in paths:
        low = p.lower()
        if low.endswith(".xml"):
            xmls.append(p)
        elif low.endswith((".db", ".sqlite", ".sqlite3")) or os.path.basename(low).startswith("mmssms"):
            dbs.append(p)
        else:
            # sniff: SQLite files start with this magic header
            try:
                with open(p, "rb") as f:
                    if f.read(16).startswith(b"SQLite format 3"):
                        dbs.append(p)
            except OSError:
                pass
    return xmls, dbs


def main():
    print("=" * 64)
    print("  Android Text Rescue  --  free SMS recovery (incl. deleted)")
    print("=" * 64)

    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = input("\nPaste the folder (or file) with your backup .xml / mmssms.db:\n> ").strip().strip('"')

    if not target or not os.path.exists(target):
        print("\n[!] That path doesn't exist. Check it and try again.")
        input("\nPress Enter to close...")
        return

    xmls, dbs = gather_files(target)
    if not xmls and not dbs:
        print("\n[!] No SMS backup (.xml) or message database (mmssms.db) found there.")
        print("    - Backup .xml: make one with the free 'SMS Backup & Restore' app.")
        print("    - mmssms.db:  needs an ADB/phone backup or a rooted phone to extract.")
        input("\nPress Enter to close...")
        return

    all_msgs = []
    for x in xmls:
        print(f"  reading backup: {os.path.basename(x)}")
        all_msgs += parse_backup_xml(x)
    for d in dbs:
        print(f"  reading database: {os.path.basename(d)}")
        existing, bodies = read_db_messages(d)
        all_msgs += existing
        deleted = carve_deleted_text(d, bodies)
        print(f"     -> {len(existing)} existing, {len(deleted)} possibly-deleted recovered")
        all_msgs += deleted

    if not all_msgs:
        print("\nNothing readable was recovered from those files.")
        input("\nPress Enter to close...")
        return

    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), OUT_NAME)
    csv_path, html_path = write_outputs(all_msgs, out_dir)
    saved = sum(1 for m in all_msgs if m["status"] == "saved")
    deleted = len(all_msgs) - saved

    print("\n" + "=" * 64)
    print(f"  DONE. {len(all_msgs)} messages  ({saved} existing, {deleted} possibly deleted).")
    print(f"  Open this to read them:\n    {html_path}")
    print(f"  Spreadsheet version:\n    {csv_path}")
    print("=" * 64)
    input("\nPress Enter to close...")


if __name__ == "__main__":
    main()
