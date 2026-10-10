#!/usr/bin/env python3
"""Build Chemistry: The Central Science 12e course data from its glossary."""

import json
import re
import sys
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "pdfs" / "chemistry-central-science-12e.pdf"
OUTPUT = ROOT / "dist" / "central-science-data.js"

UNITS = [
    ("Chemical Foundations and Reactions", range(1, 5)),
    ("Energy, Atomic Structure, Bonding, and Gases", range(5, 11)),
    ("Liquids, Solids, Solutions, and Kinetics", range(11, 15)),
    ("Equilibrium, Environment, Thermodynamics, and Electrochemistry", range(15, 21)),
    ("Nuclear, Inorganic, Coordination, and Biological Chemistry", range(21, 25)),
]


def clean_title(value):
    return re.sub(r"\s+", " ", str(value).replace("\n", " ")).strip()


def outline_chapters(reader):
    chapters = {}
    current = None

    def walk(items, depth=0):
        nonlocal current
        for item in items:
            if isinstance(item, list):
                walk(item, depth + 1)
                continue
            title = clean_title(item.get("/Title", ""))
            chapter_match = re.match(r"^(\d{1,2})\s+(.+)$", title)
            section_match = re.match(r"^(\d{1,2})\.(\d+)\s+(.+)$", title)
            if depth == 0 and chapter_match and 1 <= int(chapter_match.group(1)) <= 24:
                number = int(chapter_match.group(1))
                current = number
                chapters[number] = {
                    "number": number,
                    "title": chapter_match.group(2).title(),
                    "sections": [],
                }
            elif depth == 1 and current and section_match and int(section_match.group(1)) == current:
                chapters[current]["sections"].append({
                    "number": f"{section_match.group(1)}.{section_match.group(2)}",
                    "title": section_match.group(3).title(),
                    "topics": [],
                })

    walk(reader.outline)
    return chapters


def join_words(words):
    output = ""
    previous = None
    for word in words:
        text = word["text"]
        if not output:
            output = text
        elif abs(word["top"] - previous["top"]) < 2:
            output += ("" if output.endswith(("-", "–")) else " ") + text
        else:
            output += ("" if output.endswith(("-", "–")) else " ") + text
        previous = word
    return re.sub(r"\s+", " ", output).strip()


def clean_term(value):
    corrections = {
        ") helix": "alpha (α) helix",
        "acid-dissociation constant (K )": "acid-dissociation constant (Ka)",
        "base-dissociation constant (K )": "base-dissociation constant (Kb)",
    }
    value = re.sub(r"\s+([,.;:])", r"\1", value)
    value = re.sub(r"\s+", " ", value).strip(" ,.;:")
    return corrections.get(value, value)


def clean_definition(value):
    value = re.sub(r"\(cid:\d+\)", "", value)
    value = value.replace("¬", "")
    value = re.sub(r"([a-z])-+\s*([a-z])", r"\1\2", value)
    value = re.sub(r"\s+([,.;:])", r"\1", value)
    value = re.sub(r"\s+", " ", value).strip(" /;:")
    if value:
        value = value[0].upper() + value[1:]
    return value


def glossary_entries():
    entries = []
    reference_pattern = re.compile(r"\((Sections?|Chapter)\s+([^)]*\d[^)]*)\)", re.I)
    with pdfplumber.open(SOURCE) as pdf:
        for page_index in range(1153, 1164):
            page = pdf.pages[page_index]
            page_words = page.extract_words(x_tolerance=1.5, extra_attrs=["fontname", "size"])
            printed_page = page_index + 1
            columns = ((48, 226), (226, 404), (404, 610)) if printed_page % 2 == 0 else ((30, 209), (209, 387), (387, 610))
            for left, right in columns:
                words = [
                    word for word in page_words
                    if 68 <= word["top"] <= 725
                    and left <= word["x0"] < right
                ]
                words.sort(key=lambda word: (round(word["top"], 1), word["x0"]))
                term_words, definition_words = [], []

                def flush():
                    if not term_words or not definition_words:
                        return
                    term = clean_term(join_words(term_words))
                    raw_definition = join_words(definition_words)
                    references = list(reference_pattern.finditer(raw_definition))
                    if not references:
                        return
                    reference = references[-1]
                    definition = clean_definition(raw_definition[:reference.start()])
                    reference_text = reference.group(2)
                    section_numbers = re.findall(r"(?<!\d)(\d{1,2}\.\d+)", reference_text)
                    chapter_numbers = sorted({int(number.split(".")[0]) for number in section_numbers})
                    if not chapter_numbers:
                        chapter_numbers = sorted({
                            int(number) for number in re.findall(r"(?<![.\d])(\d{1,2})(?![.\d])", reference_text)
                            if 1 <= int(number) <= 24
                        })
                    if 2 < len(term) < 100 and 12 < len(definition) < 500 and chapter_numbers:
                        entries.append({
                            "term": term,
                            "definition": definition,
                            "chapters": chapter_numbers,
                            "sections": section_numbers,
                            "reference": f"{reference.group(1).title()} {reference_text}",
                        })

                for word in words:
                    is_term = "Bold" in word["fontname"] and 7.5 <= word["size"] <= 8.5
                    if is_term:
                        if definition_words:
                            flush()
                            term_words, definition_words = [], []
                        term_words.append(word)
                    elif term_words:
                        definition_words.append(word)
                flush()
    return entries


def build():
    reader = PdfReader(str(SOURCE))
    chapters = outline_chapters(reader)
    entries = glossary_entries()
    vocabulary = {number: [] for number in chapters}
    seen = {number: set() for number in chapters}

    for entry in entries:
        for chapter_number in entry["chapters"]:
            if chapter_number not in chapters:
                continue
            key = re.sub(r"[^a-z0-9]", "", entry["term"].lower())
            if key in seen[chapter_number]:
                continue
            seen[chapter_number].add(key)
            vocabulary[chapter_number].append([entry["term"], entry["definition"]])
            for section in chapters[chapter_number]["sections"]:
                if section["number"] in entry["sections"]:
                    section["topics"].append(entry["term"])

    for number, chapter in chapters.items():
        chapter["focusAreas"] = [section["title"] for section in chapter["sections"]]
        chapter["vocabulary"] = vocabulary[number]
        chapter["equations"] = []

    missing = [number for number, terms in vocabulary.items() if len(terms) < 5]
    if missing:
        raise RuntimeError(f"Too few glossary terms extracted for chapters: {missing}")

    data = {
        "sourceTitle": "Chemistry: The Central Science, 12th Edition",
        "authors": "Theodore L. Brown, H. Eugene LeMay, Bruce E. Bursten, Catherine J. Murphy, and Patrick M. Woodward",
        "units": [
            {"title": unit_title, "chapters": [chapters[number] for number in chapter_numbers]}
            for unit_title, chapter_numbers in UNITS
        ],
    }
    OUTPUT.write_text(
        "window.CENTRAL_SCIENCE_COURSE_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    total = sum(len(terms) for terms in vocabulary.values())
    print(f"Wrote {OUTPUT} with {len(entries)} glossary entries and {total} chapter-term placements")
    print("Chapter counts:", ", ".join(f"{number}:{len(vocabulary[number])}" for number in sorted(vocabulary)))


if __name__ == "__main__":
    if not SOURCE.exists():
        sys.exit(f"Missing source PDF: {SOURCE}")
    build()
