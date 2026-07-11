#!/usr/bin/env python3
r"""
Android Rescue -- One Menu
==========================
A single menu that runs all the free recovery tools:

  1. Photos        (deleted-photo thumbnails + existing photos)
  2. Texts / SMS   (deleted + existing messages, from backup or mmssms.db)
  3. Call log      (incoming/outgoing/missed calls, from backup or contacts2.db)
  4. Contacts      (names/numbers/emails, from .vcf or contacts2.db)
  5. Everything

Just point it at the folder where you copied your phone's data, pick what to
recover, and the results land in the Recovered / RecoveredTexts / RecoveredCalls
/ RecoveredContacts folders next to this script.

Nothing is uploaded. Everything stays on your PC.

HOW TO USE (Windows): double-click RUN_ME_MENU.bat  (install Python first).
"""

import os
import sys

from android_photo_rescue import recover_photos
from android_text_rescue import recover_texts
from android_call_rescue import recover_calls
from android_contacts_rescue import recover_contacts


def ask_folder():
    while True:
        target = input(
            "\nPaste the folder where you copied your phone's data\n"
            "(e.g. C:\\Users\\You\\Desktop\\PhoneBackup):\n> "
        ).strip().strip('"')
        if target and os.path.exists(target):
            return target
        print("\n[!] That path doesn't exist. Try again (or close the window).")


def main():
    print("=" * 64)
    print("  ANDROID RESCUE  --  free photo, text & call recovery")
    print("=" * 64)
    print("\nThe honest part: deleted FULL-resolution photos and protected")
    print("databases can't be pulled from a locked, non-rooted phone (no tool")
    print("can, Dr. Fone included). This recovers thumbnails, backups, existing")
    print("data, and deleted items still lingering in any database you provide.")

    target = sys.argv[1] if len(sys.argv) > 1 else ask_folder()

    print("\nWhat do you want to recover?")
    print("  1) Photos")
    print("  2) Texts / SMS")
    print("  3) Call log")
    print("  4) Contacts")
    print("  5) Everything")
    choice = input("Type 1, 2, 3, 4 or 5 and press Enter: ").strip()

    if choice == "1":
        recover_photos(target)
    elif choice == "2":
        recover_texts(target)
    elif choice == "3":
        recover_calls(target)
    elif choice == "4":
        recover_contacts(target)
    else:
        if choice != "5":
            print("\n(Not sure what you picked -- running EVERYTHING.)")
        recover_photos(target)
        recover_texts(target)
        recover_calls(target)
        recover_contacts(target)

    print("\nAll done. Open the Recovered / RecoveredTexts / RecoveredCalls /")
    print("RecoveredContacts folders (next to this program) to see what came back.")
    input("\nPress Enter to close...")


if __name__ == "__main__":
    main()
