#!/usr/bin/env python3
"""Build image-front AP Art History decks from the supplied study guide."""

import hashlib
import io
import json
import pathlib
import re
import shutil

import pdfplumber
from PIL import Image
from pypdf import PdfReader


SOURCE_TITLE = "AP Art History Course Study Guide - Simple Studies"
SOURCE_URL = "https://uploads-ssl.webflow.com/605fe570e5454a357d1e1811/60a174e467e8ec74d0a64d6a_SS-AP-Art-History.pdf"

UNIT_NAMES = {
    1: "Global Prehistoric Art",
    2: "Ancient Mediterranean Art",
    3: "Early Europe and Colonial Americas",
    4: "Later Europe and the Americas",
    5: "Indigenous Americas",
    6: "Africa",
    7: "West and Central Asia",
    8: "South, East, and Southeast Asia",
    9: "The Pacific",
}

FEYNMAN = {
    1: ["Art and survival in prehistoric communities", "Ritual and portable prehistoric objects", "Monumental prehistoric architecture"],
    2: ["Art and political authority in ancient states", "Ancient funerary art and the afterlife", "Greek idealism and Roman adaptation"],
    3: ["Sacred space in medieval Europe", "Pilgrimage and church architecture", "Colonial exchange in the Americas"],
    4: ["Renaissance humanism and classical revival", "Baroque art and persuasion", "Modernism and artistic experimentation"],
    5: ["Indigenous American art and sacred landscape", "Objects of rulership in the Americas", "Material, memory, and community"],
    6: ["African art and spiritual power", "Royal authority in African art", "Performance, masking, and identity"],
    7: ["Islamic architecture and sacred experience", "Calligraphy and ornament", "Art across West and Central Asian empires"],
    8: ["Buddhist art across Asia", "Art, court culture, and imperial power in Asia", "Landscape and nature in Asian art"],
    9: ["Pacific art and ancestral presence", "Navigation, exchange, and oceanic identity", "Performance and community in Pacific art"],
}


def clean(value):
    value = value.replace("\u00ad", "").replace("\uf0b7", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def page_lines(page):
    words = page.extract_words(use_text_flow=True, keep_blank_chars=False)
    lines = []
    for word in sorted(words, key=lambda item: (round(float(item["top"]), 1), float(item["x0"]))):
        top = float(word["top"])
        if not lines or abs(lines[-1][0] - top) > 2.2:
            lines.append([top, [word]])
        else:
            lines[-1][1].append(word)
    return [(top, clean(" ".join(item["text"] for item in sorted(items, key=lambda word: float(word["x0"]))))) for top, items in lines]


def parse_entries(pdf_path):
    entries = []
    expected = 1
    active_unit = 1
    current = None
    headings = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages):
            for top, line in page_lines(page):
                unit_match = re.search(r"Unit\s+(One|2|3|4|5|6|7|8|9)\s*:", line, re.I)
                if unit_match:
                    raw = unit_match.group(1).lower()
                    active_unit = 1 if raw == "one" else int(raw)
                match = re.match(r"^(\d{1,3})\.\s+(.+)$", line)
                if match and int(match.group(1)) == expected:
                    if current:
                        entries.append(current)
                    current = {"number": expected, "unit": active_unit, "page": page_index + 1, "lines": [match.group(2)]}
                    headings.append((expected, page_index, top))
                    expected += 1
                elif current and not line.startswith("AP Art History Course Study Guide") and not line.startswith("Images Courtesy"):
                    current["lines"].append(line)
    if current:
        entries.append(current)
    if len(entries) != 223:
        raise RuntimeError(f"Expected 223 artworks, found {len(entries)}")

    for entry in entries:
        joined = clean(" ".join(entry.pop("lines")))
        label = re.search(r"\s+[a-d]\.\s+(?:Context|Content|Form|Function)\s*:?", joined, re.I)
        heading = joined[:label.start()].strip() if label else joined
        body = joined[label.start():].strip() if label else ""
        title = heading.split("(", 1)[0].strip().rstrip(".")
        body = re.sub(r"\b[a-d]\.\s+(?:Context|Content|Form|Function)\s*:?", " ", body, flags=re.I)
        body = re.sub(r"\b(?:i{1,4}|v|vi{0,3}|ix|x)\.\s+", " ", body, flags=re.I)
        body = re.sub(r"\b\d+\.\s+", " ", body)
        body = clean(body)
        if len(body) > 1400:
            body = body[:1397].rsplit(" ", 1)[0] + "..."
        entry["title"] = title
        entry["back"] = clean(f"{heading}. {body}")
    return entries, headings


def extract_images(pdf_path, entries, headings, image_dir):
    if image_dir.exists():
        shutil.rmtree(image_dir)
    image_dir.mkdir(parents=True)
    reader = PdfReader(pdf_path)
    heading_positions = [(page * 1000 + top, number) for number, page, top in headings]
    artwork_images = []
    watermark_hash = None
    with pdfplumber.open(pdf_path) as plumber_pdf:
        for page_index, page in enumerate(reader.pages):
            plumber_images = sorted(plumber_pdf.pages[page_index].images, key=lambda item: float(item.get("top", 0)))
            by_name = {image.name.split(".")[0]: image for image in page.images}
            for placed in plumber_images:
                name = placed.get("name", "")
                image = by_name.get(name)
                if not image:
                    continue
                digest = hashlib.sha1(image.data).hexdigest()
                if name == "Image5" or (watermark_hash and digest == watermark_hash):
                    watermark_hash = digest
                    continue
                position = page_index * 1000 + float(placed.get("top", 0))
                nearby_following = [
                    (heading_position, number) for heading_position, number in heading_positions
                    if position < heading_position <= position + 50
                ]
                if nearby_following:
                    artwork_images.append((nearby_following[0][1], image.data))
                    continue
                preceding = [number for heading_position, number in heading_positions if heading_position <= position]
                if preceding:
                    artwork_images.append((preceding[-1], image.data))

    first_image = {}
    for number, data in artwork_images:
        first_image.setdefault(number, data)
    for entry in entries:
        data = first_image.get(entry["number"])
        if not data:
            continue
        image = Image.open(io.BytesIO(data)).convert("RGB")
        image.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        filename = f"ap-art-{entry['number']:03d}.jpg"
        image.save(image_dir / filename, "JPEG", quality=86, optimize=True)
        entry["frontImage"] = f"./ap-art-history-images/{filename}"


def build_decks(entries):
    decks = []
    for unit in range(1, 10):
        unit_entries = [entry for entry in entries if entry["unit"] == unit and entry.get("frontImage")]
        deck_id = f"apart-unit-{unit}"
        decks.append({
            "id": deck_id,
            "name": f"AP Art History · Unit {unit}",
            "shortName": f"Unit {unit}: {UNIT_NAMES[unit]}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": [{
                "id": f"{deck_id}-c{entry['number']}",
                "front": "",
                "frontImage": entry["frontImage"],
                "back": entry["back"],
                "sourcePage": entry["page"],
            } for entry in unit_entries],
            "questions": [],
            "feynmanPrompts": [{"id": f"{deck_id}-f{index}", "prompt": prompt} for index, prompt in enumerate(FEYNMAN[unit], 1)],
        })
    return decks


def main():
    root = pathlib.Path(__file__).resolve().parents[1]
    pdf_path = root / "tmp/pdfs/ap-art-history.pdf"
    output_path = root / "dist/apart-data.js"
    image_dir = root / "dist/ap-art-history-images"
    entries, headings = parse_entries(pdf_path)
    extract_images(pdf_path, entries, headings, image_dir)
    decks = build_decks(entries)
    output_path.write_text("window.AP_ART_HISTORY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    counts = [len(deck["cards"]) for deck in decks]
    print(f"Wrote {sum(counts)} image cards across units: {counts}")


if __name__ == "__main__":
    main()
