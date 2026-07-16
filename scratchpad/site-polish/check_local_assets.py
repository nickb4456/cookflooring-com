#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
BASE_URL = "http://127.0.0.1:8000/"


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, _tag, attrs):
        values = dict(attrs)
        for name in ("href", "src", "poster"):
            if values.get(name):
                self.references.append(values[name])
        if values.get("srcset"):
            self.references.extend(
                item.strip().split()[0]
                for item in values["srcset"].split(",")
                if item.strip()
            )


def local_path(source_file, reference):
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = unquote(parsed.path)
    if path.startswith("/"):
        return ROOT / path.lstrip("/")
    return source_file.parent / path


def request_path(path):
    relative = path.resolve().relative_to(ROOT).as_posix()
    if path.is_dir():
        relative += "/"
    request = Request(BASE_URL + relative, method="HEAD")
    with urlopen(request, timeout=4) as response:
        return response.status


def main():
    html_files = [ROOT / "index.html", *sorted((ROOT / "services").glob("*/index.html"))]
    checks = set()

    for html_file in html_files:
        parser = ReferenceParser()
        parser.feed(html_file.read_text(encoding="utf-8"))
        for reference in parser.references:
            path = local_path(html_file, reference)
            if path is not None:
                checks.add(path.resolve())

    css_file = ROOT / "css" / "styles.css"
    for reference in re.findall(r"url\([\"']?([^\"')]+)", css_file.read_text(encoding="utf-8")):
        if reference.startswith(("data:", "#", "%23")):
            continue
        path = local_path(css_file, reference)
        if path is not None:
            checks.add(path.resolve())

    failures = []
    for path in sorted(checks):
        try:
            if not path.exists():
                failures.append(f"missing: {path.relative_to(ROOT)}")
                continue
            status = request_path(path)
            if status != 200:
                failures.append(f"http {status}: {path.relative_to(ROOT)}")
        except Exception as error:
            failures.append(f"request failed: {path.relative_to(ROOT)} ({error})")

    print(f"Checked {len(html_files)} pages and {len(checks)} local references.")
    if failures:
        print("\n".join(failures))
        return 1
    print("All local routes and assets returned HTTP 200.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
