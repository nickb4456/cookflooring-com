#!/usr/bin/env python3
"""Check static city-page discovery, metadata, content, and linked assets."""
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("city_builder", ROOT / "_tools/build-city-pages.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.elements = []
        self.ids = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if "id" in attrs:
            self.ids.append(attrs["id"])


ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
sitemap = [e.text for e in ET.parse(ROOT / "sitemap.xml").findall("s:url/s:loc", ns)]
assert len(sitemap) == len(set(sitemap)), "Duplicate sitemap URLs"
titles, descriptions = set(), set()
for city in builder.CITIES:
    relative = builder.path(city["name"])
    file = ROOT / relative.lstrip("/") / "index.html"
    text = file.read_text()
    assert text == builder.render(city), f"Generated page drift: {file}"
    page = Page(text)
    assert len(page.ids) == len(set(page.ids)), f"Duplicate IDs: {file}"
    assert sum(tag == "h1" for tag, _ in page.elements) == 1
    canonical = [a["href"] for t, a in page.elements if t == "link" and a.get("rel") == "canonical"]
    assert canonical == [builder.SITE + relative]
    assert canonical[0] in sitemap
    for hub in [ROOT / "index.html", ROOT / "service-area/rhode-island/index.html"]:
        assert f'href="{relative}"' in hub.read_text(), f"Missing discovery link: {hub}"
    import re
    title = re.search(r'<title>(.*?)</title>', text).group(1)
    description = next(a["content"] for t, a in page.elements if t == "meta" and a.get("name") == "description")
    assert title not in titles and description not in descriptions, "Duplicate metadata"
    titles.add(title)
    descriptions.add(description)
    assert sum(t == "details" for t, _ in page.elements) == 6
    form = next(a for t, a in page.elements if t == "form")
    assert form["action"] == "https://formspree.io/f/mgogwyoz" and form["method"] == "POST"
    town = next(a for t, a in page.elements if a.get("name") == "town")
    assert town["value"] == city["name"] + ", RI" and "required" in town
    graph = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', text, re.S).group(1))["@graph"]
    service = next(node for node in graph if node["@type"] == "Service")
    assert service["areaServed"]["name"] == city["name"] + ", Rhode Island"
    assert service["provider"]["@id"] == builder.SITE + "/#business"
    for tag, attrs in page.elements:
        refs = [attrs[key] for key in ("src", "href") if key in attrs]
        if "srcset" in attrs:
            refs.extend(item.strip().split()[0] for item in attrs["srcset"].split(","))
        for ref in refs:
            parsed = urlsplit(ref)
            if parsed.scheme or parsed.netloc:
                continue
            target = ROOT / parsed.path.lstrip("/") if parsed.path.startswith("/") else file.parent / parsed.path
            if target.is_dir():
                target = target / "index.html"
            assert target.is_file(), f"Missing asset or page: {file}: {ref}"
            if parsed.fragment:
                assert unquote(parsed.fragment) in Page(target.read_text()).ids, f"Missing anchor: {ref}"
print(f"PASS: {len(builder.CITIES)} city pages, unique metadata, 84 FAQs, callback fields, structured data, sitemap, discovery links, assets, and anchors.")
