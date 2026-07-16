#!/usr/bin/env python3
"""Verify service-area promises and JSON-LD stay consistent across the site."""

from html.parser import HTMLParser
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INSTALL_PAGES = (
    ROOT / "services/hardwood-floor-installation-ri/index.html",
    ROOT / "services/lvp-installation-ri/index.html",
    ROOT / "services/bathroom-tile-installation-ri/index.html",
)
RI_ONLY_PAGES = (
    ROOT / "services/floor-refinishing-ri/index.html",
    ROOT / "services/deck-builder-ri/index.html",
)


class JsonLdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._capture = False
        self._chunks = []
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        attr_map = dict(attrs)
        if tag == "script" and attr_map.get("type") == "application/ld+json":
            self._capture = True
            self._chunks = []

    def handle_data(self, data):
        if self._capture:
            self._chunks.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._capture:
            self.blocks.append("".join(self._chunks))
            self._capture = False


def read(path):
    return path.read_text(encoding="utf-8")


def parse_json_ld(path):
    parser = JsonLdParser()
    parser.feed(read(path))
    assert parser.blocks, f"No JSON-LD found in {path.relative_to(ROOT)}"
    for block in parser.blocks:
        json.loads(block)
    return [json.loads(block) for block in parser.blocks]


def area_names(value):
    values = value if isinstance(value, list) else [value]
    return {
        item.get("name") if isinstance(item, dict) else item
        for item in values
    }


def main():
    checked = (ROOT / "index.html",) + INSTALL_PAGES + RI_ONLY_PAGES
    for path in checked:
        parse_json_ld(path)

    home_path = ROOT / "index.html"
    home = read(home_path)
    assert "RI, MA, and CT installation; RI-only refinishing and decks" in home
    assert "Installations in RI, MA, and CT. Floor refinishing in RI only." in home
    assert '<label for="qTown">Town and state</label>' in home

    graph = parse_json_ld(home_path)[0]["@graph"]
    business = next(item for item in graph if item.get("@id") == "https://cookflooring.com/#business")
    offers = business["hasOfferCatalog"]["itemListElement"]
    service_areas = {
        offer["itemOffered"]["name"]: area_names(offer["itemOffered"]["areaServed"])
        for offer in offers
    }
    tri_state = {"Rhode Island", "Massachusetts", "Connecticut"}
    assert service_areas["Hardwood floor installation"] == tri_state
    assert service_areas["Luxury vinyl plank (LVP) installation"] == tri_state
    assert service_areas["Bathroom and shower tile installation"] == tri_state
    assert service_areas["Hardwood floor refinishing"] == {"Rhode Island"}
    assert service_areas["Deck building and deck repair"] == {"Rhode Island"}

    for path in INSTALL_PAGES:
        text = read(path)
        for state in ("Rhode Island", "Massachusetts", "Connecticut"):
            assert state in text, f"{state} missing from {path.relative_to(ROOT)}"

    refinishing = read(ROOT / "services/floor-refinishing-ri/index.html")
    assert "Floor sanding and refinishing are available in Rhode Island only" in refinishing
    assert "Massachusetts" not in refinishing and "Connecticut" not in refinishing

    deck = read(ROOT / "services/deck-builder-ri/index.html")
    assert "Massachusetts" not in deck and "Connecticut" not in deck

    print(f"PASS: {len(checked)} pages have valid JSON-LD and consistent service areas")


if __name__ == "__main__":
    main()
