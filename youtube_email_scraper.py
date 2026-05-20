"""Scrape emails from trucking YouTube channel About pages.

Usage:
    python youtube_email_scraper.py channels.txt
    python youtube_email_scraper.py channels.txt --out emails.csv

`channels.txt` should contain one channel per line. Accepted formats:
    https://www.youtube.com/@TruckerJoe
    https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx
    https://www.youtube.com/c/SomeCustomName
    https://www.youtube.com/user/LegacyUserName
    @TruckerJoe

Note: YouTube hides the "business email" behind a CAPTCHA, so that one is not
fetchable without auth. However, the vast majority of trucking channels paste
their email directly into the public channel description, which IS visible on
the About page HTML — that's what this script extracts.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from dataclasses import dataclass
from urllib.parse import urlparse

import requests

EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)

OBFUSCATED_RE = re.compile(
    r"([a-zA-Z0-9._%+\-]+)\s*(?:\(at\)|\[at\]|\s+at\s+)\s*"
    r"([a-zA-Z0-9.\-]+)\s*(?:\(dot\)|\[dot\]|\s+dot\s+)\s*([a-zA-Z]{2,})",
    re.IGNORECASE,
)

JUNK_DOMAINS = {
    "youtube.com",
    "ytimg.com",
    "googlevideo.com",
    "gstatic.com",
    "google.com",
    "schema.org",
    "w3.org",
    "example.com",
    "sentry.io",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class ChannelResult:
    channel: str
    about_url: str
    channel_name: str
    emails: list[str]
    error: str = ""


def normalize_channel(raw: str) -> str:
    """Turn a handle or URL into a canonical About-page URL."""
    raw = raw.strip()
    if not raw:
        return ""

    if raw.startswith("@"):
        return f"https://www.youtube.com/{raw}/about"

    if not raw.startswith("http"):
        raw = "https://" + raw

    parsed = urlparse(raw)
    path = parsed.path.rstrip("/")
    if not path.endswith("/about"):
        path = path + "/about"
    return f"https://www.youtube.com{path}"


def extract_emails(html: str) -> list[str]:
    """Pull emails (including lightly obfuscated ones) from page HTML."""
    found: set[str] = set()

    for match in EMAIL_RE.findall(html):
        email = match.lower().rstrip(".")
        domain = email.split("@", 1)[1]
        if any(domain.endswith(j) for j in JUNK_DOMAINS):
            continue
        if email.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp")):
            continue
        found.add(email)

    for user, domain, tld in OBFUSCATED_RE.findall(html):
        email = f"{user}@{domain}.{tld}".lower()
        if not any(email.split("@")[1].endswith(j) for j in JUNK_DOMAINS):
            found.add(email)

    return sorted(found)


def extract_channel_name(html: str) -> str:
    m = re.search(r'"title"\s*:\s*"([^"]+)"\s*,\s*"navigationEndpoint"', html)
    if m:
        try:
            return json.loads(f'"{m.group(1)}"')
        except json.JSONDecodeError:
            return m.group(1)
    m = re.search(r"<title>([^<]+)</title>", html)
    return m.group(1).replace(" - YouTube", "").strip() if m else ""


def fetch_about(url: str, session: requests.Session) -> tuple[str, str]:
    """Return (final_url, html). Raises requests exceptions on network errors."""
    resp = session.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
    resp.raise_for_status()
    return resp.url, resp.text


def scrape_channel(raw: str, session: requests.Session) -> ChannelResult:
    about_url = normalize_channel(raw)
    if not about_url:
        return ChannelResult(raw, "", "", [], error="empty input")

    try:
        final_url, html = fetch_about(about_url, session)
    except requests.RequestException as e:
        return ChannelResult(raw, about_url, "", [], error=str(e))

    return ChannelResult(
        channel=raw,
        about_url=final_url,
        channel_name=extract_channel_name(html),
        emails=extract_emails(html),
    )


def load_channels(path: str) -> list[str]:
    with open(path, encoding="utf-8") as f:
        return [
            line.strip()
            for line in f
            if line.strip() and not line.lstrip().startswith("#")
        ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("channels_file", help="Text file with one channel per line")
    parser.add_argument("--out", default="emails.csv", help="Output CSV path")
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="Seconds to sleep between requests (be polite to YouTube)",
    )
    args = parser.parse_args()

    channels = load_channels(args.channels_file)
    if not channels:
        print("No channels found in input file.", file=sys.stderr)
        return 1

    session = requests.Session()
    results: list[ChannelResult] = []

    for i, raw in enumerate(channels, 1):
        print(f"[{i}/{len(channels)}] {raw}", file=sys.stderr)
        result = scrape_channel(raw, session)
        results.append(result)
        if result.error:
            print(f"    error: {result.error}", file=sys.stderr)
        else:
            print(
                f"    {result.channel_name or '(no name)'} -> "
                f"{', '.join(result.emails) if result.emails else 'no emails'}",
                file=sys.stderr,
            )
        if i < len(channels):
            time.sleep(args.delay)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["channel_input", "channel_name", "about_url", "emails", "error"])
        for r in results:
            writer.writerow(
                [r.channel, r.channel_name, r.about_url, "; ".join(r.emails), r.error]
            )

    total_emails = sum(len(r.emails) for r in results)
    hits = sum(1 for r in results if r.emails)
    print(
        f"\nDone. {hits}/{len(results)} channels had emails "
        f"({total_emails} total). Wrote {args.out}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
