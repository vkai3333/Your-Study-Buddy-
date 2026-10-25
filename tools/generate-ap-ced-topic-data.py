#!/usr/bin/env python3
"""Build stable AP card-to-topic mappings from official College Board CED PDFs.

Usage:
    python tools/generate-ap-ced-topic-data.py --ced-dir /path/to/pdfs

The directory must contain the PDF stems named in COURSE_CONFIG. The generated
browser data is intentionally checked in so the app remains fully offline.
"""

from __future__ import annotations

import argparse
import html
import json
import math
import re
import subprocess
from collections import Counter
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist" / "ap-ced-topic-data.js"

COURSE_CONFIG = {
    "aphug": ("AP_HUMAN_GEOGRAPHY_DECKS", "aphug"),
    "apworld": ("AP_WORLD_HISTORY_DECKS", "apworld"),
    "apes": ("AP_ENVIRONMENTAL_SCIENCE_DECKS", "apes"),
    "apeuro": ("AP_EUROPEAN_HISTORY_DECKS", "apeuro"),
    "apgov": ("AP_US_GOVERNMENT_DECKS", "apgov"),
    "appsych": ("AP_PSYCHOLOGY_DECKS", "appsych"),
    "apush": ("AP_US_HISTORY_DECKS", "apush"),
    "apart": ("AP_ART_HISTORY_DECKS", "apart"),
    "apcsp": ("AP_CSP_DECKS", "apcsp"),
    "apbiology": ("AP_BIOLOGY_DECKS", "apbio"),
    "apstats": ("AP_STATISTICS_DECKS", "apstats"),
    "apchem": ("AP_CHEMISTRY_DECKS", "apchem"),
    "apcalculus": ("AP_CALCULUS_DECKS", "apcalc"),
    "apprecalculus": ("AP_PRECALCULUS_DECKS", "apprecalc"),
    "apcompgov": ("AP_COMPARATIVE_GOVERNMENT_DECKS", "apcompgov"),
    "apmicro": ("AP_MICROECONOMICS_DECKS", "apmicro"),
    "apmacro": ("AP_MACROECONOMICS_DECKS", "apmacro"),
    "apmusic": ("AP_MUSIC_THEORY_DECKS", "apmusic"),
    "aplatin": ("AP_LATIN_DECKS", "aplatin"),
    "apaas": ("AP_AFRICAN_AMERICAN_STUDIES_DECKS", "apaas"),
    "apcyber": ("AP_CYBERSECURITY_DECKS", "apcyber"),
    "apbusiness": ("AP_BUSINESS_PERSONAL_FINANCE_DECKS", "apbusiness"),
}

SPECIAL_UNIT_PREFIXES = {
    "apes-unit-12": ("1", "2"),
    "apes-unit-78": ("7", "8"),
    "apart-unit-9": ("9", "10"),
    "apbusiness-unit-3a": ("3",),
    "apbusiness-unit-3b": ("3",),
}

TITLE_OVERRIDES = {
    ("apes", "8.1"): "Sources of Pollution",
    ("apes", "3.4"): "Carrying Capacity",
    ("aphug", "3.2"): "Cultural Landscapes",
    ("apbio", "1.1"): "Structure of Water and Hydrogen Bonding",
    ("apbio", "1.2"): "Elements of Life",
    ("apbio", "1.3"): "Introduction to Macromolecules",
    ("apchem", "1.6"): "Photoelectron Spectroscopy",
    ("apchem", "9.10"): "Cell Potential Under Nonstandard Conditions",
    ("apcalc", "2.2"): "Defining the Derivative of a Function and Using Derivative Notation",
    ("apcalc", "4.7"): "Using L'Hospital's Rule for Determining Limits of Indeterminate Forms",
    ("apcalc", "7.8"): "Exponential Models with Differential Equations",
    ("apcalc", "10.8"): "Ratio Test for Convergence",
    ("apprecalc", "1.1"): "Change in Tandem",
    ("apprecalc", "1.3"): "Rates of Change in Linear and Quadratic Functions",
    ("apprecalc", "3.6"): "Sinusoidal Function Transformations",
    ("apmusic", "4.1"): "Soprano-Bass Counterpoint",
    ("apmusic", "4.3"): "Harmonic Progression, Functional Harmony, and Cadences",
    ("apmusic", "2.1"): "Minor Scales: Natural, Harmonic, and Melodic",
    ("apmusic", "6.2"): "Embellishing Tones: Writing Passing Tones and Neighbor Tones",
    ("apaas", "1.6"): "Learning Traditions",
    ("apaas", "2.4"): "African Resistance on Slave Ships and the Antislavery Movement",
    ("apaas", "2.16"): "Diasporic Connections: Slavery and Freedom in Brazil",
    ("apcompgov", "1.5"): "Sources of Power and Authority",
    ("apush", "3.11"): "Developing an American Identity",
    ("apush", "5.10"): "Reconstruction",
    ("apstats", "1.1"): "Introducing Statistics: What Can We Learn from Data?",
}

LATIN_READINGS = {
    "1": [
        ("1.1", "Teacher's Choice Prose, approximately 300 words"),
        ("1.2", "Teacher's Choice Prose, approximately 300 words"),
        ("1.3", "Teacher's Choice Prose, approximately 300 words"),
        ("1.4", "Teacher's Choice Prose, approximately 300 words"),
    ],
    "2": [
        ("2.1", "Pliny, Letter 6.16.1-12: Vesuvius and Pliny the Elder"),
        ("2.2", "Pliny, Letter 6.16.13-22: Vesuvius and Pliny the Elder"),
        ("2.3", "Pliny, Letter 6.20.1-10: Vesuvius and Pliny the Younger"),
        ("2.4", "Pliny, Letter 6.20.11-20: Vesuvius and Pliny the Younger"),
        ("2.5", "Teacher's Choice Prose, approximately 225 words"),
    ],
    "3": [
        ("3.1", "Pliny, Letter 7.27.1-8: Ghosts and Apparitions"),
        ("3.2", "Pliny, Letter 7.27.9-16: Ghosts and Apparitions"),
        ("3.3", "Teacher's Choice Prose, approximately 225 words"),
        ("3.4", "Pliny, Letters 10.37 and 10.90: Aqueducts"),
        ("3.5", "Pliny, Letters 10.5-7: Citizenship for His Doctor"),
        ("3.6", "Pliny, Letters 6.4 and 6.7: Calpurnia"),
    ],
    "4": [
        ("4.1", "Teacher's Choice Poetry, approximately 300 words"),
        ("4.2", "Teacher's Choice Poetry, approximately 300 words"),
        ("4.3", "Teacher's Choice Poetry, approximately 250 words"),
        ("4.4", "Aeneid 1.1-33: The Epic Begins"),
        ("4.5", "Aeneid 1.88-107 and 496-508: The Storm and Queen Dido"),
        ("4.6", "Aeneid 2.40-56 and 201-249: Laocoon and the Trojan Horse"),
    ],
    "5": [
        ("5.1", "Aeneid 4.74-89 and 165-197: Cupid and Rumor"),
        ("5.2", "Aeneid 4.305-361: Aeneas Leaves Dido"),
        ("5.3", "Aeneid 6.450-476, 788-800, and 847-853: Dido and Anchises"),
        ("5.4", "Aeneid 7.45-58, 783-792, and 803-817: Latinus and Turnus"),
        ("5.5", "Aeneid 11.532-594: Camilla"),
        ("5.6", "Aeneid 12.791-796, 803-812, and 818-828: Fate of the Trojans"),
        ("5.7", "Aeneid 12.919-952: Aeneas and Turnus"),
    ],
    "6": [
        ("6.1", "Teacher's Choice Poetry, approximately 250 words"),
        ("6.2", "Teacher's Choice Poetry, approximately 250 words"),
    ],
}

PSYCH_SCIENCE_PRACTICES = [
    ("SP.1", "Concept Explanation"),
    ("SP.2", "Visual Representations"),
    ("SP.3", "Research Methods"),
    ("SP.4", "Data Interpretation"),
    ("SP.5", "Argumentation"),
]

CARD_TOPIC_OVERRIDES = {
    "aphug": {
        "culture": "3.1",
        "relocation diffusion": "3.4",
        "expansion diffusion": "3.4",
        "hierarchical diffusion": "3.4",
        "contagious diffusion": "3.4",
        "stimulus diffusion": "3.4",
        "reverse hierarchical diffusion": "3.4",
        "core countries": "7.5",
        "peripheral countries": "7.5",
        "semi periphery countries": "7.5",
        "core": "7.5",
        "periphery": "7.5",
        "semi periphery": "7.5",
    },
    "apbiology": {
        "buffer": "1.1",
        "ph": "1.1",
        "hydroxyl group": "1.3",
        "carboxyl group": "1.3",
    },
    "apstats": {
        "boxplot": "1.8",
    },
    "apcalculus": {
        "direct substitution": "1.5",
    },
}

STOPWORDS = set("""
the a an and or but if then than of in on at to for from by with without into over under
is are was were be been being it its this that these those as can could may might will would
should do does did done how what which who whom whose why when where describe explain identify
determine analyze evaluate compare use using used including include includes introduction context
course framework unit topic required content learning objective essential knowledge continued page
ap students student college board return table contents one two three four five six seven eight nine
""".split())


def normalize_text(value: object) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text.replace("\x07", " ")).strip()


def stem(word: str) -> str:
    if len(word) > 5 and word.endswith("ies"):
        return word[:-3] + "y"
    for suffix in ("ingly", "edly", "ing", "ed", "es", "s"):
        if len(word) > len(suffix) + 3 and word.endswith(suffix):
            return word[: -len(suffix)]
    return word


def tokens(value: object) -> list[str]:
    words = re.findall(r"[a-z0-9]+", normalize_text(value).lower())
    return [stem(word) for word in words if len(word) > 1 and word not in STOPWORDS]


def extract_title(lines: list[str], index: int, number: str) -> str:
    marker = re.search(rf"TOPIC\s+{re.escape(number)}\s*(.*)", lines[index], re.I)
    candidates = [marker.group(1).strip()] if marker and marker.group(1).strip() else []
    for line in lines[index + 1 : index + 14]:
        clean = normalize_text(line)
        if re.search(r"Required Course Content|LEARNING OBJECTIVE|ESSENTIAL KNOWLEDGE|SUGGESTED SKILL", clean, re.I):
            break
        if not clean or clean == "UNIT" or clean.isdigit():
            continue
        if re.search(r"Course.Framework|Course and Exam Description|Return to Table|College Board|©|V\.1", clean, re.I):
            continue
        candidates.append(clean)
    title = " ".join(candidates)
    title = re.split(
        r"\b(?:continued on next page|THEMATIC FOCUS|SOURCES|SOURCE NOTE|AVAILABLE RESOURCES?|"
        r"BOUNDARY STATEMENT|ENDURING UNDERSTANDING|HISTORICAL DEVELOPMENTS|Return to T able of Contents|"
        r"The final topic in this unit|Spend a class period|This topic is intended|Additional Topic Available|"
        r"Applying Disciplinary Knowledge|Requir equired Cour ed Course Cont se Content ent)\b",
        title,
        1,
        flags=re.I,
    )[0]
    title = re.sub(r"^\d+\.[A-Z]\s+Apply an appropriate mathematical definition, theorem, or test\.\s*", "", title)
    title = re.sub(r"\s+(?:Origins of the African Diaspora|Freedom, Enslavement, and Resistance|Harmony and Voice Leading III)$", "", title)
    if title.startswith("What Is African American Studies?"):
        title = "What Is African American Studies?"
    title = re.sub(r"\s+", " ", title).strip(" -|·")
    return title


def extract_topics(pdf_path: Path, stem_name: str) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    page_texts = [normalize_text(page.extract_text() or "") for page in reader.pages]
    occurrences: dict[str, list[tuple[int, str]]] = {}
    for page_index, text in enumerate(page_texts):
        lines = [normalize_text(line) for line in (reader.pages[page_index].extract_text() or "").splitlines()]
        for index, line in enumerate(lines):
            for match in re.finditer(r"\bTOPIC\s+(\d{1,2}\.\d{1,2})\b", line, re.I):
                number = match.group(1)
                occurrences.setdefault(number, []).append((page_index, extract_title(lines, index, number)))

    selected = []
    for number, choices in occurrences.items():
        detailed = [choice for choice in choices if "Required Course Content" in page_texts[choice[0]] and "Course at a Glance" not in page_texts[choice[0]]]
        page_index, title = (detailed or choices)[-1]
        title = TITLE_OVERRIDES.get((stem_name, number), title) or f"Topic {number}"
        selected.append({"number": number, "title": title, "page": page_index})

    selected.sort(key=lambda item: (item["page"], [int(part) for part in item["number"].split(".")]))
    for index, topic in enumerate(selected):
        next_page = selected[index + 1]["page"] if index + 1 < len(selected) else min(len(page_texts), topic["page"] + 4)
        end_page = max(topic["page"] + 1, min(next_page, topic["page"] + 5))
        topic["document"] = " ".join(page_texts[topic["page"] : end_page])
    return sorted(selected, key=lambda item: [int(part) for part in item["number"].split(".")])


def unit_prefixes(unit_id: str) -> tuple[str, ...]:
    if unit_id in SPECIAL_UNIT_PREFIXES:
        return SPECIAL_UNIT_PREFIXES[unit_id]
    match = re.search(r"(?:unit|period)-(\d+)", unit_id)
    return (match.group(1),) if match else ()


def item_text(item: dict, kind: str) -> str:
    if kind == "cards":
        front = normalize_text(item.get("front"))
        back = normalize_text(item.get("back"))
        return f"{front} {front} {front} {front} {back}"
    if kind == "questions":
        return normalize_text(item.get("prompt") or item.get("question") or item.get("front"))
    return normalize_text(item.get("prompt"))


def assign_items(items: list[dict], topics: list[dict], kind: str) -> list[list[int]]:
    assignments = [[] for _ in topics]
    if not topics:
        return assignments
    topic_counts = [Counter(tokens(f"{topic['title']} {topic['title']} {topic['title']} {topic['document']}")) for topic in topics]
    document_frequency = Counter(token for counts in topic_counts for token in counts)
    idf = {token: math.log((len(topics) + 1) / (frequency + 0.5)) + 1 for token, frequency in document_frequency.items()}
    title_tokens = [set(tokens(topic["title"])) for topic in topics]
    normalized_documents = [normalize_text(topic["document"]).lower() for topic in topics]
    item_groups: dict[str, list[int]] = {}
    for item_index, item in enumerate(items):
        group_key = normalize_text(item.get("front")).lower() if kind == "cards" else f"{kind}-{item_index}"
        item_groups.setdefault(group_key or f"{kind}-{item_index}", []).append(item_index)
    for group_indexes in item_groups.values():
        query = Counter(tokens(" ".join(item_text(items[index], kind) for index in group_indexes)))
        position = sum(group_indexes) / len(group_indexes) / max(1, len(items) - 1)
        front_phrase = normalize_text(items[group_indexes[0]].get("front")).lower() if kind == "cards" else ""
        scores = []
        for topic_index, counts in enumerate(topic_counts):
            lexical = sum((1 + math.log(freq)) * (1 + math.log(counts[token])) * idf.get(token, 1) ** 2 for token, freq in query.items() if counts[token])
            title_overlap = sum(idf.get(token, 1) * freq for token, freq in query.items() if token in title_tokens[topic_index])
            phrase_boost = 30 if len(front_phrase.split()) > 1 and front_phrase in normalized_documents[topic_index] else 0
            expected = topic_index / max(1, len(topics) - 1)
            position_prior = 1.5 * (1 - abs(position - expected))
            scores.append(lexical + 4 * title_overlap + phrase_boost + position_prior)
        assignments[max(range(len(scores)), key=scores.__getitem__)].extend(group_indexes)
    return assignments


def topic_definitions_for_unit(course_id: str, unit: dict, extracted: list[dict]) -> list[dict]:
    prefixes = unit_prefixes(unit["id"])
    if course_id == "appsych" and unit["id"] == "appsych-unit-0":
        return [{"number": number, "title": title, "document": title} for number, title in PSYCH_SCIENCE_PRACTICES]
    if course_id == "aplatin":
        readings = LATIN_READINGS.get(prefixes[0], []) if prefixes else []
        return [{"number": number, "title": title, "document": title} for number, title in readings]
    return [topic for topic in extracted if topic["number"].split(".")[0] in prefixes]


def target_unit_for_topic(course_id: str, units: list[dict], topic: dict) -> str:
    number = topic["number"]
    prefix = number.split(".")[0]
    if course_id == "appsych" and prefix == "SP":
        return "appsych-unit-0"
    if course_id == "apbusiness" and prefix == "3":
        return "apbusiness-unit-3a" if int(number.split(".")[1]) <= 2 else "apbusiness-unit-3b"
    for unit in units:
        if prefix in unit_prefixes(unit["id"]):
            return unit["id"]
    raise RuntimeError(f"No navigation unit for {course_id} topic {number}")


def append_assignments(items: list[dict], source_unit_ids: list[str], topics: list[dict], kind: str) -> None:
    groups = assign_items(items, topics, kind)
    field = {"cards": "cardRefs", "questions": "questionRefs", "feynmanPrompts": "promptRefs"}[kind]
    for topic_index, indexes in enumerate(groups):
        for index in indexes:
            item = items[index]
            reference = [source_unit_ids[index], item["id"]] if kind == "cards" else [source_unit_ids[index], item["sourceIndex"]]
            topics[topic_index][field].append(reference)


def apply_card_overrides(course_id: str, course_units: list[dict], topics: list[dict]) -> None:
    overrides = CARD_TOPIC_OVERRIDES.get(course_id, {})
    if not overrides:
        return
    fronts = {
        (unit["id"], card["id"]): re.sub(r"[^a-z0-9]+", " ", normalize_text(card.get("front")).lower()).strip()
        for unit in course_units
        for card in unit.get("cards", [])
    }
    targets = {topic["number"]: topic for topic in topics}
    for topic in topics:
        retained = []
        for reference in topic["cardRefs"]:
            requested_number = overrides.get(fronts.get(tuple(reference), ""))
            if requested_number and requested_number != topic["number"]:
                targets[requested_number]["cardRefs"].append(reference)
            else:
                retained.append(reference)
        topic["cardRefs"] = retained


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ced-dir", type=Path, required=True)
    parser.add_argument("--course", choices=COURSE_CONFIG, help="Regenerate one course while preserving the others")
    args = parser.parse_args()
    exported = subprocess.run(
        ["node", str(ROOT / "tools" / "export-ap-content.cjs")],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    globals_data = json.loads(exported.stdout)
    if args.course and OUTPUT.exists():
        raw = OUTPUT.read_text(encoding="utf-8").strip()
        prefix = "window.AP_CED_TOPIC_MAP = "
        result = json.loads(raw.removeprefix(prefix).removesuffix(";"))
    else:
        result = {"version": "2026-10-20", "courses": {}}

    selected_courses = {args.course: COURSE_CONFIG[args.course]} if args.course else COURSE_CONFIG
    for course_id, (global_name, pdf_stem) in selected_courses.items():
        pdf_path = args.ced_dir / f"{pdf_stem}.pdf"
        extracted = [] if course_id == "aplatin" else extract_topics(pdf_path, pdf_stem)
        course_units = globals_data[global_name]
        all_topics = []
        seen_numbers = set()
        for unit in course_units:
            for topic in topic_definitions_for_unit(course_id, unit, extracted):
                if topic["number"] in seen_numbers:
                    continue
                seen_numbers.add(topic["number"])
                all_topics.append({**topic, "targetUnitId": target_unit_for_topic(course_id, course_units, topic), "cardRefs": [], "questionRefs": [], "promptRefs": []})
        if not all_topics:
            raise RuntimeError(f"No CED topics found for {course_id}")

        def flattened(kind: str, selected_units: list[dict]) -> tuple[list[dict], list[str]]:
            items, source_ids = [], []
            for source_unit in selected_units:
                for source_index, original in enumerate(source_unit.get(kind, [])):
                    items.append({**original, "sourceIndex": source_index})
                    source_ids.append(source_unit["id"])
            return items, source_ids

        for source_unit in course_units:
            target_unit_id = source_unit["id"]
            # The legacy AP Human Geography source has its development and
            # urban decks numbered in the opposite order from the CED.
            if course_id == "aphug" and source_unit["id"] == "aphug-unit-6":
                target_unit_id = "aphug-unit-7"
            elif course_id == "aphug" and source_unit["id"] == "aphug-unit-7":
                target_unit_id = "aphug-unit-6"
            local_topics = [topic for topic in all_topics if topic["targetUnitId"] == target_unit_id]
            for kind in ("cards", "questions", "feynmanPrompts"):
                items, source_ids = flattened(kind, [source_unit])
                append_assignments(items, source_ids, local_topics, kind)
        apply_card_overrides(course_id, course_units, all_topics)

        units = {unit["id"]: [] for unit in course_units}
        for topic in all_topics:
            units[topic["targetUnitId"]].append({
                "id": f"{course_id}-topic-{topic['number'].lower().replace('.', '-')}",
                "number": topic["number"],
                "title": topic["title"],
                "cardRefs": topic["cardRefs"],
                "questionRefs": topic["questionRefs"],
                "promptRefs": topic["promptRefs"],
            })
        result["courses"][course_id] = {"units": units}

    payload = json.dumps(result, ensure_ascii=False, separators=(",", ":"))
    OUTPUT.write_text(f"window.AP_CED_TOPIC_MAP = {payload};\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
