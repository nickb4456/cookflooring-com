#!/usr/bin/env python3
"""Local proof rig for Cook Flooring crawlability and service-page SEO."""

from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.canonical = ""
        self.links: list[str] = []
        self.assets: list[str] = []
        self.json_ld: list[str] = []
        self._in_json = False
        self._json_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "link" and values.get("rel") == "canonical":
            self.canonical = values.get("href", "") or ""
        if tag == "a" and values.get("href"):
            self.links.append(values["href"] or "")
        if tag in {"img", "script", "link", "source"}:
            for key in ("src", "href"):
                value = values.get(key)
                if value and not value.startswith(("http:", "https:", "data:", "#", "tel:", "mailto:")):
                    self.assets.append(value)
        if tag == "script" and values.get("type") == "application/ld+json":
            self._in_json = True
            self._json_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_json:
            self.json_ld.append("".join(self._json_parts))
            self._in_json = False

    def handle_data(self, data: str) -> None:
        if self._in_json:
            self._json_parts.append(data)


def local_path(page: Path, href: str) -> Path | None:
    clean = href.split("#", 1)[0].split("?", 1)[0]
    if not clean or clean.startswith(("http:", "https:", "tel:", "mailto:")):
        return None
    if clean.startswith("/"):
        target = ROOT / clean.lstrip("/")
    else:
        target = page.parent / clean
    if clean.endswith("/"):
        target = target / "index.html"
    return target.resolve()


def main() -> None:
    tree = ET.parse(SITEMAP)
    urls = [node.text.strip() for node in tree.findall("sm:url/sm:loc", NS) if node.text]
    assert len(urls) == 6, f"expected 6 sitemap URLs, found {len(urls)}"

    pages: list[Path] = []
    for url in urls:
        path = urlparse(url).path
        page = ROOT / (path.lstrip("/") or "index.html")
        if path.endswith("/") and path != "/":
            page = page / "index.html"
        assert page.is_file(), f"missing sitemap page: {page}"
        pages.append(page)

    for page, sitemap_url in zip(pages, urls):
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        assert parser.canonical == sitemap_url, f"canonical mismatch in {page}"
        assert parser.json_ld, f"missing JSON-LD in {page}"
        for block in parser.json_ld:
            json.loads(block)
        for ref in parser.assets + parser.links:
            target = local_path(page, ref)
            if target is not None:
                assert target.exists(), f"broken local reference in {page}: {ref}"

    service_pages = [page for page in pages if "services" in page.parts]
    for page in service_pages:
        text = page.read_text(encoding="utf-8")
        assert 'class="service-proof"' in text, f"missing proof section: {page}"
        assert 'class="service-faq"' in text, f"missing FAQ section: {page}"
        assert '"@type": "FAQPage"' in text, f"missing FAQ schema: {page}"

    print(f"PASS: {len(pages)} sitemap pages, JSON-LD, canonicals, assets, links, proof sections, and FAQs verified")


if __name__ == "__main__":
    main()
