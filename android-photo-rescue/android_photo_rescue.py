#!/usr/bin/env python3
r"""
Android Photo Rescue
====================
A free, open recovery tool that carves images out of an Android phone's
leftover data -- the SAME technique paid tools (Dr. Fone, EaseUS) use on a
NON-ROOTED phone.

It does TWO real things:

  1. Thumbnail-cache carving:
     Android stores small copies of your photos in ".thumbnails" cache files
     (named like "thumbdata3--1967290299"). When you DELETE a photo, the
     full-size file goes away, but a thumbnail of it often survives in this
     cache for a long time. This tool scans those cache files and pulls every
     embedded JPEG/PNG back out -- including thumbnails of deleted photos.

  2. Plain image recovery:
     It also rescues every normal photo it finds in the folder you point it at
     (handy after you copy DCIM / Pictures off the phone).

WHAT IT CANNOT DO (and no honest tool can, without rooting the phone):
  - It cannot pull DELETED full-resolution photos out of the phone's internal
    memory. That storage is encrypted and locked by Android. Thumbnails are
    the best that's recoverable without root -- this tool gets all of them.

------------------------------------------------------------------------------
HOW TO USE (Windows):

  1. Install Python from https://python.org  (tick "Add Python to PATH").
  2. On the phone: plug into the PC, pull down the notification, set USB to
     "File transfer" / "MTP".
  3. In File Explorer open the phone, then copy these folders to your Desktop
     (whichever exist):
        Internal storage\DCIM
        Internal storage\Pictures
        Internal storage\DCIM\.thumbnails   (turn on "Show hidden files" first)
  4. Double-click RUN_ME.bat  (or run:  python android_photo_rescue.py )
  5. When asked, paste the folder you copied (e.g. C:\Users\You\Desktop\DCIM).
  6. Recovered pictures land in a "Recovered" folder next to this script.

No internet. Nothing is uploaded. Everything stays on your PC.
------------------------------------------------------------------------------
"""

import os
import sys
import hashlib

# ---- image signatures we carve for -----------------------------------------
JPEG_SOI = b"\xff\xd8\xff"          # start of a JPEG
JPEG_EOI = b"\xff\xd9"             # end of a JPEG
PNG_SIG  = b"\x89PNG\r\n\x1a\n"    # start of a PNG
PNG_IEND = b"IEND\xae\x42\x60\x82"  # end of a PNG (IEND chunk + CRC)

MIN_BYTES = 1500          # ignore carved blobs smaller than this (junk)
READ_CHUNK = 8 * 1024 * 1024


def carve_jpegs(data):
    """Yield every embedded JPEG found in a blob of bytes."""
    pos = 0
    n = len(data)
    while True:
        start = data.find(JPEG_SOI, pos)
        if start == -1:
            return
        end = data.find(JPEG_EOI, start + 3)
        if end == -1:
            return
        end += 2  # include the EOI marker
        blob = data[start:end]
        if len(blob) >= MIN_BYTES:
            yield blob
        pos = end


def carve_pngs(data):
    """Yield every embedded PNG found in a blob of bytes."""
    pos = 0
    while True:
        start = data.find(PNG_SIG, pos)
        if start == -1:
            return
        end = data.find(PNG_IEND, start)
        if end == -1:
            return
        end += len(PNG_IEND)
        blob = data[start:end]
        if len(blob) >= MIN_BYTES:
            yield blob
        pos = end


def read_file(path):
    try:
        with open(path, "rb") as f:
            return f.read()
    except (OSError, MemoryError):
        return None


def recover_photos(target):
    """Scan `target` for recoverable images. Returns number saved."""
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Recovered")
    os.makedirs(out_dir, exist_ok=True)

    seen = set()       # content hashes, so we don't save the same image twice
    saved = 0
    scanned = 0
    thumb_hits = 0

    print(f"\nScanning for photos: {target}")
    print(f"Saving recovered images to: {out_dir}\n")

    for root, _dirs, files in os.walk(target):
        is_thumb_cache = ".thumbnail" in root.lower()
        for name in files:
            path = os.path.join(root, name)
            scanned += 1
            if scanned % 200 == 0:
                print(f"  ...scanned {scanned} files, recovered {saved} images so far")

            data = read_file(path)
            if not data:
                continue

            # carve every embedded image out of this file's raw bytes
            blobs = list(carve_jpegs(data)) + list(carve_pngs(data))
            if not blobs:
                continue

            from_thumb = is_thumb_cache or name.lower().startswith("thumbdata")
            for blob in blobs:
                h = hashlib.md5(blob).digest()
                if h in seen:
                    continue
                seen.add(h)
                ext = "jpg" if blob[:3] == JPEG_SOI else "png"
                prefix = "thumb" if from_thumb else "photo"
                fname = f"{prefix}_{saved + 1:05d}.{ext}"
                try:
                    with open(os.path.join(out_dir, fname), "wb") as f:
                        f.write(blob)
                    saved += 1
                    if from_thumb:
                        thumb_hits += 1
                except OSError:
                    pass

    print("\n" + "=" * 64)
    print(f"  PHOTOS: scanned {scanned} files.")
    print(f"  Recovered {saved} images  ({thumb_hits} from thumbnail caches).")
    print(f"  Open this folder to see them:\n    {out_dir}")
    print("=" * 64)
    if saved == 0:
        print("\nNothing was recovered from this folder. Tips:")
        print("  - Make sure you copied the '.thumbnails' folder (it's hidden).")
        print("  - Also check Google Photos > Trash and your phone's Recycle bin.")
    return saved


def main():
    print("=" * 64)
    print("  Android Photo Rescue  --  free thumbnail & photo recovery")
    print("=" * 64)
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = input("\nPaste the folder to scan (the one you copied off the phone):\n> ").strip().strip('"')
    if not target or not os.path.isdir(target):
        print("\n[!] That folder doesn't exist. Double-check the path and try again.")
        input("\nPress Enter to close...")
        return
    recover_photos(target)
    input("\nPress Enter to close...")


if __name__ == "__main__":
    main()
