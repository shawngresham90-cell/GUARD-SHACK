#!/usr/bin/env python3
r"""
Android Call-Log Rescue
=======================
A free, open tool that recovers your phone's CALL HISTORY (incoming, outgoing,
missed calls) from an Android phone's data.

It reads the two real, honest sources of Android call logs:

  1. A CALL-LOG BACKUP file (easiest, no root):
     The free app "SMS Backup & Restore" also backs up call logs to an .xml
     file (often a "calls-*.xml" in Download/ or on an SD card).

  2. The contacts/calls DATABASE "contacts2.db":
     Android keeps call history in this SQLite database (table "calls").
     Point this tool at a copy of it and it lists every call it can read.

THE HONEST CATCH (same one every tool hits):
  - The backup .xml works for anyone who used SMS Backup & Restore.
  - Getting "contacts2.db" off a NON-rooted phone needs an ADB/phone backup or
    a rooted phone -- it lives in protected storage. Fully DELETED call rows are
    often overwritten quickly, so deleted-call recovery is limited; existing
    history recovers cleanly.

Nothing is uploaded. Everything stays on your PC.

------------------------------------------------------------------------------
HOW TO USE (Windows):
  1. Install Python from https://python.org (tick "Add Python to PATH").
  2. Put your call-log .xml backup and/or contacts2.db into a folder.
  3. Double-click RUN_ME_CALLS.bat  (or:  python android_call_rescue.py )
  4. Paste the folder path.
  5. Open the "RecoveredCalls" folder -> a readable .html page and a .csv.
------------------------------------------------------------------------------
"""

import os
import sys
import csv
import html
import sqlite3
import tempfile
import datetime
import xml.etree.ElementTree as ET

OUT_NAME = "RecoveredCalls"

# Android call "type" codes
CALL_TYPES = {
    "1": "Incoming",
    "2": "Outgoing",
    "3": "Missed",
    "4": "Voicemail",
    "5": "Rejected",
    "6": "Blocked",
}


def ts_to_str(ms):
    try:
        ms = int(ms)
        if ms > 10_000_000_000:
            ms //= 1000
        return datetime.datetime.fromtimestamp(ms).strftime("%Y-%m-%d %H:%M")
    except (ValueError, OverflowError, OSError, TypeError):
        return ""


def dur_to_str(seconds):
    try:
        s = int(seconds)
    except (ValueError, TypeError):
        return ""
    if s <= 0:
        return "0:00"
    return f"{s // 60}:{s % 60:02d}"


# ---------------------------------------------------------------------------
# Source 1: SMS Backup & Restore call-log XML  (<call .../> elements)
# ---------------------------------------------------------------------------
def parse_call_backup_xml(path):
    calls = []
    try:
        for _evt, el in ET.iterparse(path, events=("end",)):
            if el.tag == "call":
                calls.append({
                    "source": "backup",
                    "name": el.get("contact_name") or "",
                    "number": el.get("number") or "",
                    "date": ts_to_str(el.get("date")),
                    "type": CALL_TYPES.get(el.get("type"), el.get("type") or ""),
                    "duration": dur_to_str(el.get("duration")),
                })
                el.clear()
    except ET.ParseError:
        pass
    return calls


# ---------------------------------------------------------------------------
# Source 2: contacts2.db  -- the "calls" table
# ---------------------------------------------------------------------------
def read_db_calls(path):
    calls = []
    tmp = os.path.join(tempfile.gettempdir(), "contacts2_copy.db")
    try:
        with open(path, "rb") as src, open(tmp, "wb") as dst:
            dst.write(src.read())
        con = sqlite3.connect(tmp)
        con.text_factory = lambda b: b.decode("utf-8", "replace")
        cur = con.cursor()
        try:
            cur.execute("SELECT number, date, duration, type, name FROM calls")
            rows = cur.fetchall()
        except sqlite3.OperationalError:
            rows = []
        for number, date, duration, type_, name in rows:
            calls.append({
                "source": "database",
                "name": name or "",
                "number": number or "",
                "date": ts_to_str(date),
                "type": CALL_TYPES.get(str(type_), str(type_) if type_ is not None else ""),
                "duration": dur_to_str(duration),
            })
        con.close()
    except (sqlite3.DatabaseError, OSError):
        pass
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    return calls


# ---------------------------------------------------------------------------
def gather_files(target):
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
        elif low.endswith((".db", ".sqlite", ".sqlite3")) or "contacts" in os.path.basename(low):
            dbs.append(p)
        else:
            try:
                with open(p, "rb") as f:
                    if f.read(16).startswith(b"SQLite format 3"):
                        dbs.append(p)
            except OSError:
                pass
    return xmls, dbs


def write_outputs(calls, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, OUT_NAME + ".csv")
    html_path = os.path.join(out_dir, OUT_NAME + ".html")

    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["type", "name", "number", "date", "duration", "source"])
        for c in calls:
            w.writerow([c["type"], c["name"], c["number"], c["date"], c["duration"], c["source"]])

    icons = {"Incoming": "📥", "Outgoing": "📤", "Missed": "❌", "Voicemail": "📩",
             "Rejected": "🚫", "Blocked": "⛔"}
    rows = []
    for c in calls:
        ic = icons.get(c["type"], "📞")
        who = html.escape(c["name"] or c["number"] or "Unknown")
        sub = " · ".join(x for x in [c["number"] if c["name"] else "", c["date"],
                                     c["type"], c["duration"]] if x)
        rows.append(
            f'<div class="call"><div class="who">{ic} {who}</div>'
            f'<div class="meta">{html.escape(sub)}</div></div>'
        )
    page = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recovered Calls</title><style>
body{{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0b1220;color:#e8eefc;margin:0;padding:16px}}
h1{{font-size:20px}}
.call{{background:#111c30;border:1px solid #24395c;border-radius:12px;padding:10px 12px;margin:8px 0}}
.who{{font-size:15px;font-weight:600}} .meta{{font-size:12px;color:#9fb0cf;margin-top:3px}}
</style></head><body>
<h1>📞 Recovered Call Log — {len(calls)} calls</h1>
{''.join(rows)}
</body></html>"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(page)
    return csv_path, html_path


def recover_calls(target):
    """Recover call history from backups/databases under `target`. Returns count."""
    xmls, dbs = gather_files(target)
    if not xmls and not dbs:
        print("\n[!] No call-log backup (.xml) or contacts2.db found there.")
        print("    - Backup .xml:  make one with the free 'SMS Backup & Restore' app.")
        print("    - contacts2.db: needs an ADB/phone backup or a rooted phone.")
        return 0

    all_calls = []
    for x in xmls:
        found = parse_call_backup_xml(x)
        if found:
            print(f"  reading call backup: {os.path.basename(x)} -> {len(found)} calls")
        all_calls += found
    for d in dbs:
        found = read_db_calls(d)
        if found:
            print(f"  reading call database: {os.path.basename(d)} -> {len(found)} calls")
        all_calls += found

    if not all_calls:
        print("\nNo readable call history was found in those files.")
        return 0

    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), OUT_NAME)
    csv_path, html_path = write_outputs(all_calls, out_dir)
    print("\n" + "=" * 64)
    print(f"  CALLS: recovered {len(all_calls)} call-log entries.")
    print(f"  Open this to read them:\n    {html_path}")
    print(f"  Spreadsheet version:\n    {csv_path}")
    print("=" * 64)
    return len(all_calls)


def main():
    print("=" * 64)
    print("  Android Call-Log Rescue  --  free call history recovery")
    print("=" * 64)
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = input("\nPaste the folder (or file) with your call .xml / contacts2.db:\n> ").strip().strip('"')
    if not target or not os.path.exists(target):
        print("\n[!] That path doesn't exist. Check it and try again.")
        input("\nPress Enter to close...")
        return
    recover_calls(target)
    input("\nPress Enter to close...")


if __name__ == "__main__":
    main()
