#!/usr/bin/env python3
r"""
Android Contacts Rescue
=======================
A free, open tool that recovers your CONTACTS (names, phone numbers, emails)
from an Android phone's data.

It reads the two real, honest sources of Android contacts:

  1. A vCard backup ".vcf" (easiest, no root):
     Google Contacts and most phones export contacts to a .vcf file
     (Contacts app -> Export, or contacts.google.com -> Export).

  2. The contacts DATABASE "contacts2.db":
     Android stores contacts in this SQLite database. Point this tool at a copy
     of it and it rebuilds every contact it can read (name + phones + emails).

THE HONEST CATCH (same one every tool hits):
  - The .vcf works for anyone who exported contacts. (Best case, no root.)
  - Getting "contacts2.db" off a NON-rooted phone needs an ADB/phone backup or
    a rooted phone -- it lives in protected storage. Existing contacts recover
    cleanly; fully-deleted contacts are often overwritten quickly.

BEST FREE OPTION FIRST: most contacts auto-sync to your Google account. Open
contacts.google.com -> Settings -> "Undo changes" can roll contacts back up to
30 days. Try that before anything else.

Nothing is uploaded. Everything stays on your PC.

------------------------------------------------------------------------------
HOW TO USE (Windows):
  1. Install Python from https://python.org (tick "Add Python to PATH").
  2. Put your .vcf and/or contacts2.db into a folder.
  3. Double-click RUN_ME_CONTACTS.bat  (or: python android_contacts_rescue.py)
  4. Paste the folder path.
  5. Open the "RecoveredContacts" folder -> a readable .html page, a .csv, and
     a fresh .vcf you can import straight back into any phone.
------------------------------------------------------------------------------
"""

import os
import re
import sys
import csv
import html
import sqlite3
import tempfile

OUT_NAME = "RecoveredContacts"

MT_NAME = "vnd.android.cursor.item/name"
MT_PHONE = "vnd.android.cursor.item/phone_v2"
MT_EMAIL = "vnd.android.cursor.item/email_v2"


def _add(contacts, key):
    if key not in contacts:
        contacts[key] = {"name": "", "phones": [], "emails": []}
    return contacts[key]


# ---------------------------------------------------------------------------
# Source 1: vCard .vcf
# ---------------------------------------------------------------------------
def parse_vcf(path):
    out = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    except OSError:
        return out
    # split into individual cards
    for block in re.split(r"(?i)BEGIN:VCARD", text):
        if "END:VCARD" not in block.upper():
            continue
        name, phones, emails = "", [], []
        for line in block.splitlines():
            line = line.strip()
            up = line.upper()
            # property name is before the first ':' (ignoring ; params)
            if up.startswith("FN"):
                name = line.split(":", 1)[-1].strip()
            elif up.startswith("N") and not up.startswith(("NICKNAME", "NOTE", "NUMBER")) and not name:
                raw = line.split(":", 1)[-1].strip()
                name = " ".join(p for p in raw.replace(";", " ").split() if p)
            elif up.startswith("TEL"):
                v = line.split(":", 1)[-1].strip()
                if v:
                    phones.append(v)
            elif up.startswith("EMAIL"):
                v = line.split(":", 1)[-1].strip()
                if v:
                    emails.append(v)
        if name or phones or emails:
            out.append({"name": name, "phones": phones, "emails": emails, "source": "vcf"})
    return out


# ---------------------------------------------------------------------------
# Source 2: contacts2.db
# ---------------------------------------------------------------------------
def read_db_contacts(path):
    out = []
    tmp = os.path.join(tempfile.gettempdir(), "contacts2_c_copy.db")
    try:
        with open(path, "rb") as src, open(tmp, "wb") as dst:
            dst.write(src.read())
        con = sqlite3.connect(tmp)
        con.text_factory = lambda b: b.decode("utf-8", "replace")
        cur = con.cursor()

        # map mimetype id -> string
        try:
            cur.execute("SELECT _id, mimetype FROM mimetypes")
            mt = {row[0]: row[1] for row in cur.fetchall()}
        except sqlite3.OperationalError:
            con.close()
            return out

        try:
            cur.execute("SELECT raw_contact_id, mimetype_id, data1 FROM data")
            rows = cur.fetchall()
        except sqlite3.OperationalError:
            con.close()
            return out

        contacts = {}
        for rcid, mtid, data1 in rows:
            if not data1:
                continue
            kind = mt.get(mtid, "")
            c = _add(contacts, rcid)
            if kind == MT_NAME:
                c["name"] = data1
            elif kind == MT_PHONE:
                if data1 not in c["phones"]:
                    c["phones"].append(data1)
            elif kind == MT_EMAIL:
                if data1 not in c["emails"]:
                    c["emails"].append(data1)

        # fall back to raw_contacts.display_name for any unnamed contact
        try:
            cur.execute("SELECT _id, display_name FROM raw_contacts")
            for rcid, dn in cur.fetchall():
                if rcid in contacts and not contacts[rcid]["name"] and dn:
                    contacts[rcid]["name"] = dn
        except sqlite3.OperationalError:
            pass

        con.close()
        for c in contacts.values():
            if c["name"] or c["phones"] or c["emails"]:
                c["source"] = "database"
                out.append(c)
    except (sqlite3.DatabaseError, OSError):
        pass
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    return out


# ---------------------------------------------------------------------------
def gather_files(target):
    vcfs, dbs = [], []
    paths = []
    if os.path.isfile(target):
        paths = [target]
    elif os.path.isdir(target):
        for root, _d, files in os.walk(target):
            for n in files:
                paths.append(os.path.join(root, n))
    for p in paths:
        low = p.lower()
        if low.endswith(".vcf"):
            vcfs.append(p)
        elif low.endswith((".db", ".sqlite", ".sqlite3")) or "contacts" in os.path.basename(low):
            dbs.append(p)
        else:
            try:
                with open(p, "rb") as f:
                    if f.read(16).startswith(b"SQLite format 3"):
                        dbs.append(p)
            except OSError:
                pass
    return vcfs, dbs


def dedupe(contacts):
    """Merge contacts that share a name or a phone number."""
    seen = {}
    result = []
    for c in contacts:
        keys = [("p", re.sub(r"\D", "", p)) for p in c["phones"] if re.sub(r"\D", "", p)]
        if c["name"]:
            keys.append(("n", c["name"].strip().lower()))
        match = None
        for k in keys:
            if k in seen:
                match = seen[k]
                break
        if match is None:
            match = {"name": c["name"], "phones": list(c["phones"]),
                     "emails": list(c["emails"]), "source": c["source"]}
            result.append(match)
        else:
            if not match["name"] and c["name"]:
                match["name"] = c["name"]
            for p in c["phones"]:
                if p not in match["phones"]:
                    match["phones"].append(p)
            for e in c["emails"]:
                if e not in match["emails"]:
                    match["emails"].append(e)
        for k in keys:
            seen[k] = match
    return result


def write_outputs(contacts, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, OUT_NAME + ".csv")
    html_path = os.path.join(out_dir, OUT_NAME + ".html")
    vcf_path = os.path.join(out_dir, OUT_NAME + ".vcf")

    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["name", "phones", "emails", "source"])
        for c in contacts:
            w.writerow([c["name"], " / ".join(c["phones"]), " / ".join(c["emails"]), c["source"]])

    # a clean .vcf you can import straight back into any phone
    with open(vcf_path, "w", encoding="utf-8") as f:
        for c in contacts:
            f.write("BEGIN:VCARD\nVERSION:3.0\n")
            f.write(f"FN:{c['name'] or (c['phones'][0] if c['phones'] else 'Unknown')}\n")
            for p in c["phones"]:
                f.write(f"TEL:{p}\n")
            for e in c["emails"]:
                f.write(f"EMAIL:{e}\n")
            f.write("END:VCARD\n")

    rows = []
    for c in contacts:
        who = html.escape(c["name"] or "(no name)")
        sub_parts = c["phones"] + c["emails"]
        sub = html.escape(" · ".join(sub_parts))
        rows.append(f'<div class="c"><div class="who">👤 {who}</div><div class="meta">{sub}</div></div>')
    page = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recovered Contacts</title><style>
body{{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0b1220;color:#e8eefc;margin:0;padding:16px}}
h1{{font-size:20px}} .hint{{color:#9fb0cf;font-size:13px;margin-bottom:12px}}
.c{{background:#111c30;border:1px solid #24395c;border-radius:12px;padding:10px 12px;margin:8px 0}}
.who{{font-size:15px;font-weight:600}} .meta{{font-size:12px;color:#9fb0cf;margin-top:3px}}
</style></head><body>
<h1>👥 Recovered Contacts — {len(contacts)}</h1>
<div class="hint">Tip: import <b>{OUT_NAME}.vcf</b> (in this folder) back into any phone to restore them all at once.</div>
{''.join(rows)}
</body></html>"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(page)
    return csv_path, html_path, vcf_path


def recover_contacts(target):
    """Recover contacts from .vcf / contacts2.db under `target`. Returns count."""
    vcfs, dbs = gather_files(target)
    if not vcfs and not dbs:
        print("\n[!] No vCard (.vcf) or contacts2.db found there.")
        print("    - .vcf:         Contacts app -> Export, or contacts.google.com -> Export.")
        print("    - contacts2.db: needs an ADB/phone backup or a rooted phone.")
        print("    - Easiest of all: contacts.google.com -> Settings -> Undo changes.")
        return 0

    found = []
    for v in vcfs:
        c = parse_vcf(v)
        if c:
            print(f"  reading vCard: {os.path.basename(v)} -> {len(c)} contacts")
        found += c
    for d in dbs:
        c = read_db_contacts(d)
        if c:
            print(f"  reading contacts database: {os.path.basename(d)} -> {len(c)} contacts")
        found += c

    if not found:
        print("\nNo readable contacts were found in those files.")
        return 0

    found = dedupe(found)
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), OUT_NAME)
    csv_path, html_path, vcf_path = write_outputs(found, out_dir)
    print("\n" + "=" * 64)
    print(f"  CONTACTS: recovered {len(found)} contacts.")
    print(f"  Read them:\n    {html_path}")
    print(f"  Spreadsheet:\n    {csv_path}")
    print(f"  Import this back into any phone:\n    {vcf_path}")
    print("=" * 64)
    return len(found)


def main():
    print("=" * 64)
    print("  Android Contacts Rescue  --  free contact recovery")
    print("=" * 64)
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = input("\nPaste the folder (or file) with your .vcf / contacts2.db:\n> ").strip().strip('"')
    if not target or not os.path.exists(target):
        print("\n[!] That path doesn't exist. Check it and try again.")
        input("\nPress Enter to close...")
        return
    recover_contacts(target)
    input("\nPress Enter to close...")


if __name__ == "__main__":
    main()
