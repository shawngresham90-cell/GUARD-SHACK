# 📷 Android Photo Rescue (Windows)

A **free** photo-recovery tool that does the same real work paid apps like
**Dr. Fone** do on a **non-rooted** Android phone — it carves your pictures
(including thumbnails of **deleted** photos) out of the phone's leftover data.

No internet. Nothing is uploaded. Everything stays on your PC.

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

## Files

| File | What it is |
|------|------------|
| `android_photo_rescue.py` | The recovery program (pure Python, no extra installs) |
| `RUN_ME.bat` | Double-click launcher for Windows |
| `Recovered/` | Created automatically — your rescued images go here |
