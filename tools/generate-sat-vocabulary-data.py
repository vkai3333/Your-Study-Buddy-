#!/usr/bin/env python3
"""Build five stable, shuffled SAT vocabulary decks from a saved HTML source."""

import json
import html
import pathlib
import random
import re
import sys


SOURCE_TITLE = "The 1000 Most Common SAT Words"
SOURCE_URL = "https://img.sparknotes.com/content/testprep/pdf/sat.vocab.pdf"
DEFINITION_SOURCE = "WordNet and Webster's 1913 Unabridged Dictionary via VocabAhead"
DEFINITION_SOURCE_URL = "https://www.vocabahead.com/sat"
SHUFFLE_SEED = 57525022


def clean(value):
    value = re.sub(r"\s*;\s*;(?:\s*-[^;]+)?", "", str(value or ""))
    return re.sub(r"\s+", " ", value).strip(" ;")


def extract_cards(source_path):
    source = source_path.read_text(encoding="utf-8")
    heading = next((match for match in re.finditer(r"<h2[^>]*>(.*?)</h2>", source, re.I | re.S)
                    if "The full SAT list" in re.sub(r"<[^>]+>", "", match.group(1))), None)
    section = re.search(r"<ul[^>]*>(.*?)</ul>", source[heading.end():], re.I | re.S) if heading else None
    if heading is None or section is None:
        raise ValueError("Could not locate the full SAT list")
    cards = []
    seen = set()
    for item in re.findall(r"<li(?:\s[^>]*)?>(.*?)</li>", section.group(1), re.I | re.S):
        word_match = re.search(r'<span[^>]*class="[^"]*font-display[^"]*font-semibold[^"]*"[^>]*>(.*?)</span>', item, re.I | re.S)
        part_match = re.search(r'<span[^>]*class="[^"]*italic[^"]*"[^>]*>(.*?)</span>', item, re.I | re.S)
        definition_match = re.search(r"<p(?:\s[^>]*)?>(.*?)</p>", item, re.I | re.S)
        if not word_match or not definition_match:
            continue
        plain = lambda value: html.unescape(re.sub(r"<[^>]+>", " ", value))
        word = clean(plain(word_match.group(1))).lower()
        part = clean(plain(part_match.group(1))) if part_match else ""
        definition = clean(plain(definition_match.group(1)))
        key = word.casefold()
        if not word or not definition or key in seen:
            continue
        seen.add(key)
        back = f"{part.capitalize()}. {definition[0].upper()}{definition[1:]}" if part else definition[0].upper() + definition[1:]
        if not back.endswith((".", "!", "?")):
            back += "."
        cards.append({"front": word, "back": back})
    return cards


def build_decks(cards):
    shuffled = list(cards)
    random.Random(SHUFFLE_SEED).shuffle(shuffled)
    groups = [[] for _ in range(5)]
    for index, card in enumerate(shuffled):
        groups[index % len(groups)].append(card)

    decks = []
    for group_index, group in enumerate(groups, start=1):
        deck_id = f"sat-vocabulary-mix-{group_index}"
        decks.append({
            "id": deck_id,
            "name": f"SAT Vocabulary - Mix {group_index}",
            "shortName": f"Mix {group_index}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "definitionSource": DEFINITION_SOURCE,
            "definitionSourceUrl": DEFINITION_SOURCE_URL,
            "cards": [
                {"id": f"{deck_id}-c{card_index}", **card}
                for card_index, card in enumerate(group, start=1)
            ],
            "questions": [],
            "feynmanPrompts": [],
        })
    return decks


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: generate-sat-vocabulary-data.py SOURCE_HTML OUTPUT_JS")
    source_path = pathlib.Path(sys.argv[1])
    output_path = pathlib.Path(sys.argv[2])
    cards = extract_cards(source_path)
    if len(cards) < 950:
        raise ValueError(f"Expected at least 950 SAT words, found {len(cards)}")
    decks = build_decks(cards)
    output_path.write_text(
        "window.SAT_VOCABULARY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {sum(len(deck['cards']) for deck in decks)} cards across {len(decks)} shuffled mixes")
    print("Group sizes:", ", ".join(str(len(deck["cards"])) for deck in decks))


if __name__ == "__main__":
    main()
