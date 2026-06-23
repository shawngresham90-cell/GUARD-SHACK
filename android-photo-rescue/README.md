# 📷📨 Android Rescue Tools (Windows)

**Free** recovery tools that do the same real work paid apps like **Dr. Fone**
do on a **non-rooted** Android phone:

- **Photo Rescue** — carves your pictures (including thumbnails of **deleted**
  photos) out of the phone's leftover data.
- **Text Rescue** — recovers SMS/text messages, including **deleted** ones still
  lingering in the message database, plus reads any SMS backup file.
- **Call-Log Rescue** — recovers your call history (incoming / outgoing / missed)
  from a backup or the `contacts2.db` database.
- **Contacts Rescue** — recovers names, phone numbers and emails from a `.vcf`
  backup or `contacts2.db`, and writes a ready-to-import `.vcf`.

No internet. Nothing is uploaded. Everything stays on your PC.

---

# ⭐ Easiest way: the one menu

Don't want to think about which tool? **Double-click `RUN_ME_MENU.bat`.**
It asks for the folder where you copied your phone's data, then lets you pick:

```
  1) Photos
  2) Texts / SMS
  3) Call log
  4) Contacts
  5) Everything
```

Results land in the `Recovered`, `RecoveredTexts`, `RecoveredCalls`, and
`RecoveredContacts` folders next to the program. (The individual `RUN_ME_*.bat`
launchers below still work if you prefer running one tool at a time.)

---

# 📷 Photo Rescue

---

## ⚠️ The honest truth first

A locked, non-rooted Android encrypts its internal storage, so **no software
(Dr. Fone included) can pull deleted full-resolution photos back out of it.**

But Android keeps small **thumbnail copies** of your photos in hidden cache
files (`.thumbnails / thumbdata...`). When a photo is deleted, the full file
disappears but the **thumbnail often survives** — and this tool recovers every
one of them, plus any normal photos in the folders you give it.

So: you get back **thumbnail-sized versions** of deleted photos, and **full
copies** of anything still on the phone. That's the real, achievable win
without rooting (rooting can recover more but risks wiping/bricking the phone).

---

## ▶️ How to use

1. **Install Python** from <https://python.org> — on the first screen,
   tick **“Add Python to PATH.”**
2. **Plug the phone into the PC.** On the phone, pull down the notification and
   set USB to **“File transfer / MTP.”**
3. In **File Explorer**, turn on **View → Show → Hidden items**, open the phone,
   and **copy these folders to your Desktop** (whichever exist):
   - `Internal storage\DCIM`
   - `Internal storage\Pictures`
   - `Internal storage\DCIM\.thumbnails`  ← the important hidden one
4. **Double-click `RUN_ME.bat`** (or run `python android_photo_rescue.py`).
5. When asked, paste the folder you copied (e.g. `C:\Users\You\Desktop\DCIM`).
6. Recovered images appear in the **`Recovered`** folder next to the script.
   Files starting with `thumb_` came from the deleted-photo thumbnail cache.

---

## Also check these (often the fastest win)

- **Google Photos → Library → Trash** (kept up to 60 days)
- **Samsung Gallery → ☰ → Trash** (kept ~30 days)
- **Google One / phone backup** — Settings → Google → Backup

---

---

# 📨 Text Rescue (deleted SMS)

Recovers text messages from two real sources:

1. **An SMS backup `.xml`** — made by the free **“SMS Backup & Restore”** app
   (usually saved in `Download/` or on an SD card). Easiest, works without root.
2. **The message database `mmssms.db`** — Android keeps SMS in this SQLite file.
   Deleted texts often stay in the file's free space until overwritten, so the
   tool pulls back **existing *and* deleted** messages from it.

### ⚠️ The catch (same one Dr. Fone hits)
Getting `mmssms.db` off a **non-rooted** phone is hard — it lives in protected
storage. You can get it via an **ADB/phone backup** or a **rooted** phone. If
you can’t, use the **SMS backup `.xml`** route, or check your phone’s **Recycle
bin** / carrier message backup.

### ▶️ How to use
1. Put your `.xml` backup and/or `mmssms.db` into a folder.
2. Double-click **`RUN_ME_TEXTS.bat`** (or run `python android_text_rescue.py`).
3. Paste the folder path.
4. Open the **`RecoveredTexts`** folder → a readable **`.html`** page and a
   **`.csv`** spreadsheet. 🟢 = existing, 🟡 = possibly deleted (carved — may be
   partial, e.g. a stray character at the end).

---

# 📞 Call-Log Rescue

Recovers your call history (incoming, outgoing, missed) from two real sources:

1. **A call-log backup `.xml`** — the free **“SMS Backup & Restore”** app also
   backs up call logs (often a `calls-*.xml`). Works without root.
2. **The `contacts2.db` database** — Android stores call history here (table
   `calls`). Same catch as texts: getting this file off a **non-rooted** phone
   needs an ADB/phone backup or root. Existing history recovers cleanly;
   fully-deleted call rows are often overwritten quickly, so those are limited.

### ▶️ How to use
1. Put your `calls-*.xml` and/or `contacts2.db` into a folder.
2. Double-click **`RUN_ME_CALLS.bat`** (or run `python android_call_rescue.py`).
3. Paste the folder path → open the **`RecoveredCalls`** folder for a readable
   **`.html`** page and a **`.csv`** spreadsheet.

---

# 👥 Contacts Rescue

Recovers names, phone numbers and emails from two real sources:

1. **A vCard `.vcf` backup** — exported from the Contacts app or
   **contacts.google.com → Export**. Works without root.
2. **The `contacts2.db` database** — Android stores contacts here. Same catch:
   getting this file off a **non-rooted** phone needs an ADB/phone backup or
   root. Existing contacts recover cleanly.

It de-duplicates (merging entries that share a name or number) and writes a
fresh **`RecoveredContacts.vcf`** you can import straight back into any phone.

> 💡 **Try this first:** most contacts auto-sync to Google. Go to
> **contacts.google.com → Settings → Undo changes** to roll your contacts back
> up to 30 days — often the fastest fix of all.

### ▶️ How to use
1. Put your `.vcf` and/or `contacts2.db` into a folder.
2. Double-click **`RUN_ME_CONTACTS.bat`** (or `python android_contacts_rescue.py`).
3. Paste the folder path → open the **`RecoveredContacts`** folder for the
   `.html` page, `.csv` spreadsheet, and the importable `.vcf`.

---

## Files

| File | What it is |
|------|------------|
| `rescue_menu.py` / `RUN_ME_MENU.bat` | ⭐ One menu that runs all the tools |
| `android_photo_rescue.py` / `RUN_ME.bat` | Photo recovery (deleted-photo thumbnails + existing) |
| `android_text_rescue.py` / `RUN_ME_TEXTS.bat` | Text/SMS recovery (deleted + existing) |
| `android_call_rescue.py` / `RUN_ME_CALLS.bat` | Call-log recovery (incoming/outgoing/missed) |
| `android_contacts_rescue.py` / `RUN_ME_CONTACTS.bat` | Contacts recovery (names/numbers/emails → .vcf) |
| `Recovered/` | Created automatically — rescued images |
| `RecoveredTexts/` | Created automatically — recovered messages |
| `RecoveredCalls/` | Created automatically — recovered call history |
| `RecoveredContacts/` | Created automatically — recovered contacts (+ importable .vcf) |

All tools are pure Python (no extra installs beyond Python itself).
