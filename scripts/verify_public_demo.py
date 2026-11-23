#!/usr/bin/env python3
"""Block accidental publication of live contract tooling or external resources."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def main() -> int:
    files = [p for p in PUBLIC.rglob("*") if p.is_file() or p.is_symlink()]
    if len(files) != 1 or files[0].relative_to(PUBLIC).as_posix() != "index.html":
        raise SystemExit("FAIL: Pages artifact must contain only public/index.html")
    html_file = files[0]
    if html_file.is_symlink() or html_file.stat().st_size > 100_000:
        raise SystemExit("FAIL: unexpected demo symlink or oversized asset")
    page = html_file.read_text(encoding="utf-8")
    if '<meta name="referrer" content="no-referrer">' not in page:
        raise SystemExit("FAIL: missing referrer policy")
    if 'http-equiv="Content-Security-Policy"' not in page or "connect-src 'none'" not in page:
        raise SystemExit("FAIL: restrictive CSP is required")
    if "Demonstration only" not in page or "fictional" not in page.lower():
        raise SystemExit("FAIL: synthetic-only disclosure is missing")
    if 'type="file"' not in page or "crypto.subtle.digest" not in page or "SHA-256" not in page:
        raise SystemExit("FAIL: browser-local fingerprint-verified PDF upload is required")
    if "%PDF-1.4" not in page or "Generate Flow-Down Matrix" not in page:
        raise SystemExit("FAIL: synthetic PDF-to-matrix workflow is missing")
    denied = {
        "remote URL": r"https?://",
        "embedded form": r"<form\b",
        "embed or remote media": r"<(?:iframe|object|embed|link|img|video|audio)\b",
        "external script": r"<script[^>]+src\s*=",
        "network capability": r"\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\b",
        "persistence": r"\b(?:localStorage|sessionStorage|serviceWorker)\b",
    }
    for label, expression in denied.items():
        if re.search(expression, page, flags=re.IGNORECASE):
            raise SystemExit(f"FAIL: demo contains forbidden {label}")
    print("PASS: Pages artifact is a single synthetic-only, no-network HTML application with local PDF handling.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
