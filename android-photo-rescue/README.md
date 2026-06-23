# 📷📨 Android Rescue Tools (Windows)

**Free** recovery tools that do the same real work paid apps like **Dr. Fone**
do on a **non-rooted** Android phone:

- **Photo Rescue** — carves your pictures (including thumbnails of **deleted**
  photos) out of the phone's leftover data.
- **Text Rescue** — recovers SMS/text messages, including **deleted** ones still
  lingering in the message database, plus reads any SMS backup file.

No internet. Nothing is uploaded. Everything stays on your PC.

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

## Files

| File | What it is |
|------|------------|
| `android_photo_rescue.py` | Photo recovery program (pure Python, no installs) |
| `RUN_ME.bat` | Double-click launcher for photo recovery |
| `android_text_rescue.py` | Text/SMS recovery program (pure Python, no installs) |
| `RUN_ME_TEXTS.bat` | Double-click launcher for text recovery |
| `Recovered/` | Created automatically — rescued images go here |
| `RecoveredTexts/` | Created automatically — recovered messages go here |
