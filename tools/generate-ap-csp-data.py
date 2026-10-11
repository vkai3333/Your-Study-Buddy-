#!/usr/bin/env python3
"""Build the AP CSP vocabulary decks from the supplied vocabulary webpage."""

import html
import json
import pathlib
import re
import sys
import urllib.request


SOURCE_TITLE = "AP CSP Vocabulary List — APCSExamPrep.com"
SOURCE_URL = "https://www.apcsexamprep.com/products/ap-csp-vocabulary-list-pdf"

UNIT_NAMES = {
    1: "Creative Development",
    2: "Data",
    3: "Algorithms and Programming",
    4: "Computing Systems and Networks",
    5: "Impact of Computing",
}

FEYNMAN = {
    1: ["Program development process", "Abstraction and modularity", "Testing, debugging, and iteration"],
    2: ["Representing information with bits", "Lossy and lossless compression", "Finding patterns in data"],
    3: ["Sequencing, selection, and iteration", "Lists and data abstraction", "Algorithm efficiency and undecidable problems"],
    4: ["How data travels across the Internet", "Fault tolerance and redundancy", "Cybersecurity threats and defenses"],
    5: ["Benefits and harms of computing innovations", "Privacy, bias, and the digital divide", "Intellectual property and responsible computing"],
}


def text(value):
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def load_source():
    if len(sys.argv) > 1:
        return pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
    request = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request) as response:
        return response.read().decode("utf-8")


def parse(source):
    decks = []
    headings = list(re.finditer(r"Big Idea ([1-5]):[^<]+<span", source))
    headings = [match for match in headings if "terms" in source[match.end():match.end() + 150]]
    if len(headings) != 5:
        raise RuntimeError(f"Expected five vocabulary tables, found {len(headings)}")
    for unit in range(1, 6):
        start = headings[unit - 1].start()
        end = headings[unit].start() if unit < 5 else source.index("Exam Tip:", start)
        section = source[start:end]
        rows = re.findall(r"<tr>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*</tr>", section, re.S | re.I)
        cards = []
        for index, (front, back) in enumerate(rows, 1):
            front, back = text(front), text(back)
            if not front or not back:
                continue
            cards.append({"id": f"apcsp-unit-{unit}-c{index}", "front": front, "back": back})
        decks.append({
            "id": f"apcsp-unit-{unit}",
            "name": f"AP Computer Science Principles · Big Idea {unit}",
            "shortName": f"Big Idea {unit}: {UNIT_NAMES[unit]}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": cards,
            "questions": [],
            "feynmanPrompts": [
                {"id": f"apcsp-unit-{unit}-f{index}", "prompt": prompt}
                for index, prompt in enumerate(FEYNMAN[unit], 1)
            ],
        })
    return decks


def main():
    root = pathlib.Path(__file__).resolve().parents[1]
    decks = parse(load_source())
    counts = [len(deck["cards"]) for deck in decks]
    if counts != [20, 26, 37, 32, 30]:
        raise RuntimeError(f"Unexpected AP CSP term counts: {counts}")
    output = root / "dist/apcsp-data.js"
    output.write_text(
        "window.AP_CSP_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {sum(counts)} AP CSP cards across five Big Ideas: {counts}")


if __name__ == "__main__":
    main()
