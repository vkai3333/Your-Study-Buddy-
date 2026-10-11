#!/usr/bin/env python3
"""Extract Raven's end glossary into chapter-organized study cards."""

import json
import re
import unicodedata
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/kaichenguo/Downloads/Raven Biology of Plants 8e by Ray F. Evert & Susan E. Eichhorn.pdf")
OUT = ROOT / "dist" / "raven-glossary-data.js"

# More specific rules come first. These are intentionally based on both the term
# and its definition so glossary entries land near the chapter where they are taught.
RULES = [
    (16, r"antheridiophore|archegoniophore|gametophore|calyptra|peristome|protonema"),
    (3, r"^cisterna$|^cytosol$|^lumen$|^amyloplast$|^etioplast$|^leucoplast$"),
    (9, r"multigene family|regulator gene|genetic recombination"),
    (23, r"protophloem|protoxylem"),
    (24, r"branch root|secondary root"),
    (28, r"thigmomorphogenesis"),
    (31, r"climax community"),
    (30, r"transpiration|translocation|pressure flow|cohesion-tension|xylem transport|phloem transport|source|sink|water potential|solute potential|pressure potential|guttation"),
    (29, r"soil|mineral nutrition|essential element|macronutrient|micronutrient|nitrogen fixation|nodule|rhizob|mycorrhiz|cation exchange|hydroponic|fertilizer"),
    (27, r"auxin|cytokinin|ethylene|abscisic|gibberell|brassinosteroid|plant hormone|apical dominance|senescence|triple response"),
    (28, r"photoperiod|phytochrome|tropism|circadian|vernalization|florigen|nastic|dormancy|solar tracking|etiolation"),
    (26, r"vascular cambium|cork cambium|secondary xylem|secondary phloem|heartwood|sapwood|annual ring|growth ring|wood|bark|periderm|tylose"),
    (24, r"root cap|root hair|root apical|lateral root|taproot|fibrous root|endoderm|casparian|pericycle|rhizoderm|root pressure|root system"),
    (25, r"shoot apical|leaf primord|axillary bud|node|internode|phyllotax|stoma|guard cell|mesophyll|petiole|blade|venation|abscission|shoot system|inflorescence"),
    (23, r"parenchyma|collenchyma|sclerenchyma|epidermis|tracheid|vessel element|sieve|companion cell|meristem|tissue system|fiber|cell differentiation"),
    (22, r"embryo|embryogenesis|cotyledon|suspensor|seed coat|germination|radicle|plumule|seedling|hypocotyl|epicotyl"),
    (19, r"flower|stamen|anther|carpel|pistil|ovary|ovule|sepal|petal|pollen tube|double fertilization|endosperm|fruit|pericarp|receptacle|gynoecium|androecium"),
    (20, r"angiosperm|monocot|eudicot|magnoliid|basal angiosperm|pollination syndrome|coevolution"),
    (18, r"gymnosperm|conifer|cycad|ginkgo|gnetophyte|cone|strobilus|pollen grain|seed plant"),
    (17, r"lycophyte|monilophyte|fern|horsetail|microphyll|megaphyll|heterospor|homospor|seedless vascular"),
    (16, r"bryophyte|moss|liverwort|hornwort|protonema|rhizoid|antheridium|archegonium"),
    (15, r"alga|diatom|dinoflagellate|brown alga|red alga|green alga|phytoplankton|slime mold|oomycete|stramenopile|euglen|protist"),
    (14, r"fung|hypha|mycelium|ascospore|basidiospore|conidium|lichen|dikary|chitin|yeast|mushroom"),
    (13, r"bacter|archaea|archaeon|prokary|virus|capsid|plasmid|endospore|cyanobacter|viroid|bacteriophage"),
    (12, r"taxonomy|systematics|phylogen|clade|cladogram|synapomorph|binomial nomenclature|homology|taxon|classification"),
    (11, r"evolution|natural selection|genetic drift|gene flow|fitness|speciation|reproductive isolation|adaptive radiation|hardy-weinberg|allele frequency|gene pool"),
    (10, r"recombinant|restriction enzyme|vector|polymerase chain|transgenic|transformation|tissue culture|totipot|genom|bioinformatics|cloning"),
    (9, r"dna|rna|transcription|translation|codon|anticodon|ribosome|promoter|intron|exon|gene expression|replication|chromatin|nucleotide"),
    (8, r"meiosis|allele|genotype|phenotype|mendel|crossing over|homologous chromosome|linkage|mutation|gamete|zygote|heredity|vegetative reproduction"),
    (7, r"photosynth|chlorophyll|photosystem|calvin|rubisco|carbon fixation|photorespiration|photophosphorylation|carotenoid|reaction center"),
    (6, r"respiration|glycolysis|pyruvate|citric acid|electron transport|chemiosmosis|oxidative phosphorylation|fermentation|nadh"),
    (5, r"free energy|endergonic|exergonic|activation energy|allosteric|atp|metabolic pathway|catalyst|enzyme|oxidation|reduction"),
    (4, r"diffusion|osmosis|active transport|facilitated diffusion|aquaporin|selective permeability|proton pump|endocytosis|exocytosis|membrane transport|turgor"),
    (3, r"chloroplast|plastid|vacuole|plasmodes|middle lamella|microtubule|microfilament|cytoskeleton|mitosis|cytokinesis|cell plate|phragmoplast|organelle"),
    (2, r"carbohydrate|monosaccharide|polysaccharide|cellulose|lipid|phospholipid|protein|amino acid|nucleic acid|lignin|cutin|pectin|molecule|chemical bond"),
    (21, r"domesticat|crop|agriculture|green revolution|monoculture|germplasm|food security|biofuel|artificial selection"),
    (31, r"community|population|ecological succession|food web|food chain|predation|competition|mutualism|commensalism|parasitism|ecosystem|niche"),
    (32, r"biome|biosphere|tundra|desert|rain forest|carbon cycle|nitrogen cycle|global warming|climate|biodiversity|ecology"),
]

CORE_TERM_PATTERN = re.compile(
    r"(?:acid|base|allele|annual|biennial|perennial|angiosperm|gymnosperm|bryophyte|fern|moss|"
    r"photosynth|respiration|chlorophyll|rubisco|calvin|stoma|guard cell|xylem|phloem|root|leaf|stem|"
    r"flower|fruit|seed|pollen|ovule|embryo|meristem|cambium|parenchyma|sclerenchyma|collenchyma|"
    r"auxin|cytokinin|ethylene|gibberell|abscisic|phytochrome|photoperiod|tropism|transpiration|"
    r"water potential|osmosis|diffusion|active transport|nitrogen fixation|mycorrhiz|soil|mineral|"
    r"mitosis|meiosis|dna|rna|gene|chromosome|mutation|natural selection|evolution|speciation|"
    r"fung|alga|bacter|virus|ecosystem|community|population|biome|biodiversity)", re.I
)

MAX_GLOSSARY_CARDS_PER_CHAPTER = 20


def clean_term(raw):
    term = re.sub(r"\s*\[[^\]]*\]", "", raw)
    term = re.sub(r",\s*pl\..*$", "", term, flags=re.I)
    # Remove pronunciation guides while preserving useful acronyms such as (ATP).
    term = re.sub(r"\s*\((?![A-Z0-9-]{2,8}\))[^)]*\)", "", term)
    term = " ".join(term.replace("", "").split()).strip(" .")
    return unicodedata.normalize("NFKC", term)


def clean_definition(text):
    text = unicodedata.normalize("NFKC", " ".join(text.replace("", "").split()))
    text = re.sub(r"\s+See also .*$", "", text, flags=re.I)
    return text.strip()


def extract_entries():
    entries = []
    current = None
    with pdfplumber.open(SOURCE) as pdf:
        for page_index in range(821, 847):
            page = pdf.pages[page_index]
            for x0, x1 in ((0, page.width / 2), (page.width / 2, page.width)):
                text = page.crop((x0, 25, x1, page.height - 20)).extract_text(x_tolerance=2, y_tolerance=3) or ""
                for raw in text.splitlines():
                    line = " ".join(raw.split())
                    if not line or re.fullmatch(r"(?:GLOSSARY|Glossary|G\s*[–-]\s*\d+|[A-Z])", line):
                        continue
                    match = re.match(r"^(.{1,110}?):\s+(.+)$", line)
                    if match and not re.match(r"^(?:See also|Also called|For example|In contrast)$", match.group(1), re.I):
                        if current:
                            entries.append(current)
                        current = [match.group(1), match.group(2)]
                    elif current:
                        current[1] += " " + line
    if current:
        entries.append(current)
    return entries


def chapter_for(term, definition):
    haystack = f"{term} {definition}".lower()
    for chapter, pattern in RULES:
        if re.search(pattern, haystack):
            return chapter
    # General plant form and vocabulary belong with the introductory survey.
    return 1


def study_value(term, definition, chapter):
    """Favor durable course concepts over aliases and highly specialized fragments."""
    score = 0
    term_text = term.lower()
    chapter_patterns = [pattern for number, pattern in RULES if number == chapter]
    if any(re.search(pattern, term_text) for pattern in chapter_patterns):
        score += 50
    elif any(re.search(pattern, definition.lower()) for pattern in chapter_patterns):
        score += 15
    if CORE_TERM_PATTERN.search(term):
        score += 35
    if 3 <= len(term.split()) <= 4:
        score += 3
    if len(term.split()) <= 2:
        score += 5
    if 45 <= len(definition) <= 260:
        score += 6
    if re.search(r"obsolete|formerly|hypothetical|nontechnical term|suffix|prefix", definition, re.I):
        score -= 25
    if len(term) > 55 or len(definition) > 430:
        score -= 15
    return score


def main():
    raw_entries = extract_entries()
    aliases = {}
    cleaned = []
    for raw_term, raw_definition in raw_entries:
        term = clean_term(raw_term)
        definition = clean_definition(raw_definition)
        if not term or len(term) < 2 or term.endswith("-") or term.casefold() == "systems" or "Prefix meaning" in definition or "Suffix meaning" in definition:
            continue
        if "]" in term or ";" in term or re.match(r"^(?:and|or|a tissue|the )\b", term, re.I):
            continue
        aliases[term.casefold()] = definition
        cleaned.append((term, definition))

    cards_by_chapter = {number: [] for number in range(1, 33)}
    seen = set()
    for term, definition in cleaned:
        key = term.casefold()
        if key in seen:
            continue
        seen.add(key)
        if re.fullmatch(r"See [^.]+\.?", definition, flags=re.I):
            target = re.sub(r"^See\s+|\.$", "", definition, flags=re.I).casefold()
            resolved = aliases.get(target)
            if not resolved or re.fullmatch(r"See [^.]+\.?", resolved, flags=re.I):
                continue
            definition = resolved
        if len(definition) < 24:
            continue
        chapter = chapter_for(term, definition)
        cards_by_chapter[chapter].append({"front": term, "back": definition})

    # Keep the strongest, most chapter-specific glossary terms. The base deck
    # already supplies ten foundational cards per chapter, so twenty glossary
    # additions deepen coverage without turning the deck into an index dump.
    payload = []
    for chapter, cards in cards_by_chapter.items():
        cards = [card for card in cards if study_value(card["front"], card["back"], chapter) >= 30]
        ranked = sorted(cards, key=lambda card: (-study_value(card["front"], card["back"], chapter), card["front"].casefold()))
        selected = ranked[:MAX_GLOSSARY_CARDS_PER_CHAPTER]
        if selected:
            payload.append({"chapter": chapter, "cards": selected})
    script = """// Vocabulary terms are drawn from Raven's printed glossary; definitions are cleaned for flashcard use.\n(function () {\n  const additions = """ + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n" + """  const units = window.RAVEN_COURSE_DATA && window.RAVEN_COURSE_DATA.units;
  if (!units) return;
  const chapters = units.flatMap((unit) => unit.chapters || []);
  const existing = new Set(chapters.flatMap((chapter) => (chapter.vocabulary || []).map((card) => String(card[0]).trim().toLowerCase())));
  additions.forEach((entry) => {
    const chapter = chapters.find((item) => Number(item.number) === entry.chapter);
    if (!chapter) return;
    entry.cards.forEach((card, index) => {
      const key = card.front.trim().toLowerCase();
      if (existing.has(key)) return;
      existing.add(key);
      chapter.vocabulary.push([card.front, card.back]);
    });
  });
})();
"""
    OUT.write_text(script, encoding="utf-8")
    total = sum(len(group["cards"]) for group in payload)
    print(f"Extracted {len(raw_entries)} glossary entries and generated {total} unique usable cards across {len(payload)} chapters.")
    for group in payload:
        print(f"Chapter {group['chapter']}: {len(group['cards'])}")


if __name__ == "__main__":
    main()
