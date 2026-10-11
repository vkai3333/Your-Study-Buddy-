#!/usr/bin/env python3
"""Build AP European History decks from the supplied narrative review PDF."""

import json
import pathlib
import re
import sys

import pdfplumber


SOURCE_TITLE = "Historical Summary - AP European History Exam Review"
SOURCE_URL = "https://drive.google.com/file/d/1i9qEjc3w5DZl7deuECsvaRdvp9fBMxmz/view"

UNIT_NAMES = {
    1: "Renaissance and Exploration",
    2: "Age of Reformation",
    3: "Absolutism and Constitutionalism",
    4: "Scientific, Philosophical, and Political Developments",
    5: "Conflict, Crisis, and Reaction in the Late 18th Century",
    6: "Industrialization and Its Effects",
    7: "19th-Century Perspectives and Political Developments",
    8: "20th-Century Global Conflicts",
    9: "Cold War and Contemporary Europe",
}

FEYNMAN_CANDIDATES = {
    1: ["Italian Renaissance", "Renaissance humanism", "Renaissance art and patronage", "Northern Renaissance", "New monarchies", "Spanish Inquisition", "European exploration", "Columbian Exchange and Atlantic slavery"],
    2: ["Protestant Reformation", "Catholic Reformation", "French Wars of Religion", "Thirty Years' War", "Peace of Westphalia", "Religious pluralism and state power", "Printing and religious reform"],
    3: ["European absolutism", "Louis XIV and French state building", "Mercantilism", "English Civil War", "Glorious Revolution", "English constitutionalism", "War of the Spanish Succession", "Balance of power"],
    4: ["Scientific Revolution", "Enlightenment", "Enlightenment political thought", "Consumer Revolution", "Enlightened absolutism", "Changing ideas about religion", "Women's roles in Enlightenment culture"],
    5: ["Seven Years' War", "Origins of the French Revolution", "Liberal phase of the French Revolution", "Radical phase of the French Revolution", "Napoleonic Europe", "Congress of Vienna", "Conservatism after Napoleon", "Revolutionary nationalism"],
    6: ["Industrial Revolution", "Industrial capitalism", "Urbanization and working conditions", "Classical economics", "Socialism and Marxism", "Second Industrial Revolution", "Revolutions of 1830", "Revolutions of 1848", "Congress of Vienna and the Concert of Europe", "Early labor movements", "Technological change and industrial production", "Industrialization beyond Britain"],
    7: ["Conservatism, liberalism, and socialism", "Romanticism and nationalism", "Second French Empire", "Italian unification", "German unification", "Austro-Hungarian Empire", "New imperialism", "Social Darwinism and the civilizing mission", "Third French Republic", "Dreyfus affair", "State building and Realpolitik", "European imperial technology"],
    8: ["Causes of World War I", "Alliance systems before World War I", "Nationalism in the Balkans", "Total war", "Home fronts during World War I", "Russian Revolution", "Bolshevik consolidation of power", "Treaty of Versailles", "Women's rights after World War I", "Great Depression", "Weimar Republic", "Fascism and totalitarianism", "Stalinism", "Fascist Italy", "Nazi Germany", "Appeasement and the road to World War II", "World War II", "Nazi racial ideology", "Holocaust", "Allied victory"],
    9: ["Postwar division of Europe", "Cold War alliances", "Nuclear arms race", "De-Stalinization", "Hungarian Revolution", "Prague Spring", "Berlin Wall and Cuban missile crisis", "Brezhnev Doctrine", "Détente", "Helsinki Accords", "Solidarity movement", "Revolutions of 1989", "German reunification", "Dissolution of the Soviet Union", "European integration", "Globalization and neoliberalism"],
}

BAD_TERMS = {
    "spain", "portugal", "west", "east", "africa", "catholicism", "protestant", "protestantism",
    "england", "france", "russia", "austria", "prussia", "poland", "communism", "peace", "poverty",
    "large armies", "increasing taxation", "suppressing representative institutions", "new world",
    "free market", "internet", "economic competition", "mass bombing", "war in the pacific",
    "plantations", "gold", "silver", "army", "government", "religion", "science", "women", "men",
    "allied powers", "central powers", "communist party", "war communism",
    "suppressing representative institutions", "westernized", "great britain", "silesia",
    "liberal phase", "radical phase", "directory phase", "foreign policy", "natural resources",
    "third", "estate", "technology", "italy", "allies", "hungary",
}

CURATION_REMOVE = {
    1: {"the school of athens", "spanish empire", "aztec", "smallpox", "anti-semitism"},
    2: {"pope paul iii", "pagans", "habsburg-valois", "concordatof bologna", "henry of guise",
        "henry iii", "maximilian i", "baron tilly", "frederick v", "battle of white mountain",
        "christian iv", "albrecht von wallenstein", "treatyof lubeck", "battle of lutzen", "philip"},
    3: {"protestants", "ferdinand ii", "louis xiii", "ferdinand iii", "austrian habsburgs",
        "huguenots", "military dictator", "ferdinand i"},
    4: {"catholic church", "consumer goods", "authoritarian", "applied", "catholic",
        "marquis de condorcet", "tolerance", "industrious revolution"},
    5: {"second", "estates", "monarchiens", "jacobin republic", "planned economy", "egalitarian",
        "revolutionary culture", "robespierre", "grand empire", "centralization", "paul delaroche",
        "emperor of the french", "joseph bonaparte", "spanishthrone", "alexander i", "moscow",
        "napoleon", "d-day", "representatives"},
    6: {"medici", "rocket", "wage-earners", "homemakers", "accessible foods", "anti-christian",
        "grand struggle for survival", "anti-semetic", "petroleum", "electricity", "steel",
        "automobiles", "chemicals", "telegraph", "telephone", "radio", "urbanized", "quality of life",
        "migrated", "crystal palace", "great exhibition", "utopian", "reactionary", "frenchnationalism",
        "nationalist ideas", "democratic constitutions", "social reform", "ethnic minority groups",
        "political autonomy", "cultural independence", "prussian constituent assembly",
        "prussiantroops forcibly dissolved what remained of the assembly", "malaria", "britain", "russians"},
    7: {"enlightenment", "revolutionary government", "liberal", "working class", "imperialists",
        "class-consciousness", "class war", "sociology", "klemens von metternich", "brothers grimm",
        "karl marx and friedrich engels", "republicanism", "emperor napoleon iii", "right to strike",
        "urban living", "magyar nobility", "weakened by nationalism", "northern italy", "cavour",
        "kingdom of italy", "parliamentary monarchy", "united germany", "old-age pensions", "russian",
        "trade unions", "privatization", "maxim machine gun", "steamship"},
    8: {"first", "tsar nicholas i", "industrial revolution", "nationalists", "soviet union",
        "second industrial revolution", "provisional republic", "civilliberties", "unions",
        "victor emmanuel ii", "otto von bismarck", "franco-prussian war", "germany", "anti-semites",
        "industrialization", "military", "whig party", "liberal party", "second reform bill",
        "benjamin disraeli", "third reform bill", "william gladstone", "david lloyd george",
        "people’s budget", "nationalhealth insurance", "unemployment benefits", "austria-hungary",
        "german chancellor otto von bismarck", "planes", "tanks", "temporarilyabandonedfree-market capitalism",
        "united states", "lloyd george", "georges clemenceau", "rhineland", "formal defensive alliance",
        "middle east", "finland", "baltic states", "austro-hungarian", "munitionsfactories",
        "monet", "newtonian physics", "pseudoscientific", "heroic age of physics", "neutron",
        "japan", "economic downturn", "stock market crash", "reparations", "moratorium", "ruhrdistrict",
        "print money", "inflation", "liberal democracy", "marxist", "bolshevik", "international",
        "rapid industrialization", "collective farms", "class cooperation", "rejection of liberalism",
        "revival of national greatness", "national rebirth", "reichstag", "president hindenburg",
        "aryan ethnostate", "traditional familyvalues", "hitler", "nonaggressionpact", "baltic nations",
        "spheres of influence", "greater germany", "world war i", "nazi germany", "radar technology",
        "enigmacode", "nonagressionpact", "new order", "national socialism", "racial imperialism",
        "eastern front", "poles", "ukranians", "ethnic german", "pearl harbor", "europe first",
        "unconditional surrender", "self-determination", "red army", "mussolini", "liberties"},
    9: {"czechoslovakia", "yugoslavia", "world war ii", "chancellor", "churchill", "soviet foreign policy",
        "coexistence with capitalism", "communist reformer", "open elections", "suezcrisis", "czechoslovak",
        "local decision", "dubček", "loyalty to the soviet union", "khrushchev", "fidel castro",
        "communist cuba", "turkey", "re-stalinization", "arms buildup", "neutrality", "preserve communist rule",
        "status quo", "space mission", "final act of the conference on security and cooperation",
        "environmental policies", "moderation", "nationwide strike", "outlawed solidarity", "polish parliament",
        "solidarity government", "neoliberaleconomic policy", "10-pointplan", "economic blessing",
        "alliance for germany", "christian democrats", "yeltsin", "withdrewfrom the soviet union",
        "end of the soviet union", "economiccompetition", "eurocrats", "import-export policies"},
}

WHAT_KEYWORDS = (
    "war", "revolution", "reformation", "treaty", "peace", "act", "edict", "plan", "doctrine",
    "empire", "republic", "conference", "congress", "alliance", "pact", "party", "church", "council",
    "movement", "system", "ism", "ity", "tion", "ism", "trade", "slavery", "exchange", "crisis",
    "renaissance", "enlightenment", "inquisition", "charter", "constitution", "manifesto", "affair",
    "front", "union", "organization", "bloc", "wall", "commune", "dynasty", "monarchy", "parliament",
)

ENTITY_KEYWORDS = WHAT_KEYWORDS + (
    "assembly", "entente", "estates", "accord", "decree", "coalition", "league", "court",
    "army", "bank", "company", "cult", "curtain", "powers", "laws", "rights", "school",
    "states", "kingdom", "confederation", "restoration", "palace", "district",
)
ARTICLE_KEYWORDS = (
    "war", "revolution", "reformation", "renaissance", "inquisition", "exchange", "schism",
    "church", "empire", "holocaust", "fronde", "restoration", "treaty", "peace", "plan",
    "doctrine", "conference", "congress", "assembly", "entente", "alliance", "league", "bloc",
    "curtain", "council", "act", "acts", "law", "edict", "oath", "massacre", "system", "charter", "party",
    "army", "palace", "confederation", "accord", "decree", "court", "republic",
)
PERSON_PREFIXES = (
    "pope ", "king ", "queen ", "tsar ", "czar ", "emperor ", "empress ", "cardinal ",
    "marquis ", "prince ", "princess ", "baron ", "president ", "chancellor ",
)
PLURAL_ENTITY_ENDINGS = (
    " acts", " laws", " decrees", " accords", " rights", " powers", " estates", " huguenots",
    " intendants", " jacobins", " girondins", " bolsheviks", " mensheviks", " soviets",
)
FRONT_OVERRIDES = {
    (1, "medici"): "Who were the Medici?",
    (3, "huguenots"): "Who were the Huguenots?",
    (5, "estates general"): "What was the Estates General?",
    (5, "fall of the bastille"): "What happened during the fall of the Bastille?",
    (5, "great fear"): "What was the Great Fear?",
    (8, "united states"): "What role did the United States play in World War I?",
    (9, "arms race"): "What was the nuclear arms race?",
    (8, "alliances"): "How did alliances contribute to the outbreak of World War I?",
    (8, "militarism"): "How did militarism contribute to the outbreak of World War I?",
    (8, "imperialism"): "How did imperialism contribute to the outbreak of World War I?",
    (8, "nationalism"): "How did nationalism contribute to the outbreak of World War I?",
    (8, "self-determination on the basis of ethnicity"): "How did ethnic self-determination contribute to tensions before World War I?",
}

PERSON_TERMS = {
    "pico della mirandola", "desiderius erasmus", "ferdinand", "isabella", "martin luther",
    "charles ii", "charles i", "james ii", "mary stuart", "jean-jacques rousseau",
    "montesquieu", "voltaire", "diderot", "jeremy bentham", "jacques-louis david",
    "catherine the great", "emmanuel joseph sièyes", "robespierre", "napoleon bonaparte",
    "alexander i of russia", "francisco goya", "alexander i", "louis xviii", "napoleon",
    "metternich", "jethro tull", "charles darwin", "georg hegel", "karl marx",
    "friedrich engels", "max weber", "charles x", "louis philippe",
    "karl marx and friedrich engels", "louis blanc", "louis napoleon", "napoleon iii",
    "giuseppe garibaldi", "lloyd george", "georges clemenceau", "emmeline pankhurst",
    "kerensky", "vladimir lenin", "leon trotsky", "edvard munch", "sigmund freud",
    "albert einstein", "ernest rutherford", "adolf hitler", "hitler", "stalin", "churchill",
    "joseph stalin", "nikita khrushchev", "dubček", "khrushchev", "leonid brezhnev",
    "lech wałęsa", "gorbachev",
}

BACK_OVERRIDES = {
    "humanism": "A Renaissance intellectual movement that revived Greek and Roman learning and emphasized human dignity, individual potential, education in the humanities, and active participation in civic life.",
    "Columbian Exchange": "The transfer of plants, animals, diseases, people, and ideas between the Americas and Afro-Eurasia after 1492. It transformed diets and economies, devastated Indigenous American populations through disease, and helped expand European colonization and Atlantic slavery.",
    "naturalism": "An artistic approach that represents people and the physical world with realistic proportions, movement, perspective, and close observation of nature.",
    "Ulrich Zwingli": "A Swiss Protestant reformer who led the Reformation in Zürich, rejected many Catholic rituals and sacraments, and argued that scripture should be the sole foundation of Christian practice.",
    "divine right of kings": "The doctrine that monarchs received their authority directly from God and therefore were accountable to God rather than to representative institutions or their subjects.",
    "tolerance": "The acceptance of religious or intellectual beliefs different from one's own; Enlightenment thinkers increasingly defended toleration as protection against persecution and coercion.",
    "Mary Wollstonecraft": "An English writer and early advocate of women's equality. In A Vindication of the Rights of Woman, she argued that women appeared inferior because they were denied education and should receive the same rational education as men.",
    "deductive reasoning": "Reasoning that begins with general principles or premises and applies logic to reach a specific conclusion; René Descartes made it central to his rationalist method.",
    "inductive reasoning": "Reasoning that builds general conclusions from repeated observations and experiments; Francis Bacon promoted it as a foundation of the scientific method.",
    "Women’s March to Versailles": "An October 1789 march in which thousands of Parisian women, angered by bread shortages and high prices, compelled Louis XVI and the royal family to move from Versailles to Paris, placing them under closer revolutionary control.",
    "Treaty of Paris": "The 1856 settlement ending the Crimean War. It weakened Russian influence in the Black Sea region, affirmed the territorial integrity of the Ottoman Empire, and temporarily altered the European balance of power.",
    "Third French Republic": "The republican government established in France after Napoleon III's defeat in 1870. It survived political crises and remained France's regime until the German invasion of 1940.",
    "conservatism": "A political ideology favoring tradition, established institutions, social hierarchy, and gradual change; after Napoleon, conservatives sought to restore legitimate monarchies and prevent revolutionary upheaval.",
    "socialism": "A family of political and economic ideas seeking greater equality through collective or public control of production, stronger protections for workers, and limits on private concentrations of wealth.",
    "totalitarianism": "A system in which a centralized state seeks extensive control over politics, the economy, culture, and private life through dictatorship, propaganda, surveillance, censorship, and repression.",
    "Cult of the Leader": "A fascist practice of portraying the dictator as an infallible embodiment of the nation. Mussolini's image as Il Duce and Hitler's Führer cult were reinforced through propaganda, ritual, and mass politics.",
    "militarism": "The elevation of military power, values, and expansion as central goals of the state. Fascist Italy used militarism to mobilize society and justify aggressive campaigns such as the conquest of Ethiopia.",
    "Benito Mussolini": "The founder of Italian Fascism and dictator of Italy from 1922 to 1943. He dismantled parliamentary government, built a one-party dictatorship, pursued imperial expansion, and allied Italy with Nazi Germany.",
    "Leningrad": "The name given to St. Petersburg in 1924 after Lenin's death. The city endured a prolonged and devastating German siege during World War II.",
    "Stalingrad": "The Soviet city formerly called Tsaritsyn and later renamed Volgograd. The Soviet victory there in 1942-1943 stopped a major German advance and marked a decisive turning point on the Eastern Front.",
    "Peace of Westphalia": "The 1648 series of treaties that ended the Thirty Years' War, recognized greater sovereignty for the states of the Holy Roman Empire, and confirmed a broader legal place for Catholic, Lutheran, and Calvinist rulers.",
    "Third French Republic": "The republican regime established in France after Napoleon III's defeat in 1870. It endured repeated political crises and lasted until the German invasion of 1940.",
    "Scientific Method": "A systematic approach to knowledge based on observation, hypothesis, experimentation, measurement, and revision of conclusions in light of evidence, combining inductive and deductive reasoning.",
}


def clean(value):
    value = str(value or "").replace("—", "-").replace("–", "-")
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    repairs = {
        "slavetrade": "slave trade", "representativeinstitutions": "representative institutions",
        "planetarymotion": "planetary motion", "Battleof": "Battle of", "Communistparty": "Communist party",
        "SovietUnion": "Soviet Union", "Self-determinationon": "Self-determination on",
        "invisiblehand": "invisible hand", "theNavigator": "the Navigator", "DesideriusErasmus": "Desiderius Erasmus",
    }
    for old, new in repairs.items():
        value = value.replace(old, new)
    return re.sub(r"\s+", " ", value).strip(" -\t\n")


def normalized(value):
    return re.sub(r"[^a-z0-9]", "", clean(value).casefold())


def looks_like_heading(line):
    words = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]+", line)
    if not words or len(words) > 12 or re.search(r"[.!?;:]$", line):
        return False
    significant = [word for word in words if word.casefold() not in {"and", "of", "the", "to", "in", "a", "an"}]
    return bool(significant) and sum(word[:1].isupper() for word in significant) / len(significant) >= 0.8


def document_paragraphs(pdf):
    """Reconstruct complete bullet paragraphs across wrapped lines and page breaks."""
    paragraphs = []
    current = ""
    current_unit = None
    current_page = None

    def flush():
        nonlocal current
        value = clean(current)
        if current_unit in UNIT_NAMES and value:
            paragraphs.append((current_unit, current_page, value))
        current = ""

    for page_number, page in enumerate(pdf.pages, start=1):
        text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
        for raw in text.splitlines():
            line = clean(raw)
            unit_match = re.match(r"^Unit\s+(\d+)\s*:", line, re.I)
            if unit_match:
                flush()
                current_unit = int(unit_match.group(1))
                continue
            if not line or re.fullmatch(r"\d+", line):
                continue
            if re.match(r"^-\s+", raw.strip()):
                flush()
                current_page = page_number
                current = re.sub(r"^-\s+", "", raw.strip())
            elif current:
                if looks_like_heading(line):
                    flush()
                else:
                    current += " " + line
        # Do not flush here: a bullet may continue onto the next page.
    flush()
    return paragraphs


def bold_spans(page):
    words = page.extract_words(extra_attrs=["fontname", "size"], use_text_flow=True)
    spans = []
    current = []
    for word in words:
        if "Bold" in word.get("fontname", ""):
            current.append(word["text"])
        elif current:
            spans.append(clean(" ".join(current)))
            current = []
    if current:
        spans.append(clean(" ".join(current)))
    return spans


def useful_term(term):
    lower = term.casefold().strip(" .,:;()")
    if len(term) < 5 or lower in BAD_TERMS:
        return False
    if re.match(r"^(?:unit\s+\d+|chapter|page|the following|this|these|his|her|their)\b", lower):
        return False
    if len(term.split()) > 9 or re.search(r"[.!?]$", term):
        return False
    if re.fullmatch(r"(?:[A-Z][a-z]*\s*){1,2}", term) and lower in {"italian", "french", "german", "soviet", "western", "eastern"}:
        return False
    return True


def answer_from_paragraph(paragraph, term):
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", paragraph)
    key = normalized(term)
    matches = [index for index, sentence in enumerate(sentences) if key and key in normalized(sentence)]
    if not matches:
        return ""
    index = matches[0]
    chosen = [sentences[index]]
    if len(chosen[0]) < 260 and index + 1 < len(sentences):
        chosen.append(sentences[index + 1])
    answer = clean(" ".join(chosen))
    if len(answer) > 620:
        answer = answer[:620].rsplit(" ", 1)[0].rstrip(" ,;:") + "."
    if answer and not re.search(r"[.!?\"”)]$", answer):
        answer = answer.rstrip(" ,;:") + "."
    return answer


def has_keyword(value, keyword):
    if keyword in {"ism", "ity", "tion"}:
        return value.endswith(keyword)
    return re.search(rf"\b{re.escape(keyword)}\b", value) is not None


def question_for(unit_number, term, answer):
    lower = term.casefold()
    override = FRONT_OVERRIDES.get((unit_number, lower))
    if override:
        return override
    is_entity = any(has_keyword(lower, keyword) for keyword in ENTITY_KEYWORDS)
    subject = term if lower.startswith("the ") or not any(has_keyword(lower, keyword) for keyword in ARTICLE_KEYWORDS) else f"the {term}"
    if re.match(r"^\d+\s+laws?\b", lower):
        return f"What were the {term}?"
    if lower in {ending.strip() for ending in PLURAL_ENTITY_ENDINGS} or lower.endswith(PLURAL_ENTITY_ENDINGS):
        return f"What were {subject}?"
    tokens = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]+", term)
    if lower.startswith("brothers "):
        return f"Who were {term}?"
    person_roles = r"\b(?:king|queen|emperor|empress|pope|tsar|president|chancellor|minister|statesman|philosopher|writer|author|artist|scientist|reformer|leader|general|captain|monarch|inventor|economist|theologian|diplomat|dictator|explorer|humanist|composer)\b"
    person_action = rf"\b{re.escape(term)}(?:'s|’s)?\b\s+(?:was|became|wrote|developed|led|ruled|built|expanded|founded|argued|believed|served|published|painted|created|abolished|reigned|proclaimed|introduced|supported|opposed|advocated|established)"
    title_like = len(tokens) >= 2 and sum(token[:1].isupper() for token in tokens) >= len(tokens) - 1
    if lower in PERSON_TERMS or lower.startswith(PERSON_PREFIXES) or (not is_entity and title_like and (re.search(person_action, answer, re.I) or re.search(person_roles, answer, re.I))):
        return f"Who was {term}?"
    return f"What was {subject}?"


def parse(pdf_path):
    units = {number: [] for number in UNIT_NAMES}
    seen = {number: set() for number in UNIT_NAMES}
    with pdfplumber.open(pdf_path) as pdf:
        paragraphs = document_paragraphs(pdf)
        for page_number, page in enumerate(pdf.pages, start=1):
            for term in bold_spans(page):
                if not useful_term(term):
                    continue
                key = normalized(term)
                if not key:
                    continue
                candidates = [(unit_number, paragraph) for unit_number, _paragraph_page, paragraph in paragraphs if unit_number in units and key in normalized(paragraph)]
                if not candidates:
                    continue
                def candidate_rank(item):
                    paragraph_key = normalized(item[1])
                    return (0 if paragraph_key.startswith(key) else 1, len(item[1]))

                unit_number, paragraph = min(candidates, key=candidate_rank)
                if term.casefold().strip(" .,:;()") in CURATION_REMOVE.get(unit_number, set()):
                    continue
                answer = answer_from_paragraph(paragraph, term)
                if len(answer) < 45:
                    continue
                if key in seen[unit_number]:
                    continue
                seen[unit_number].add(key)
                units[unit_number].append({
                    "back": answer,
                    "sourcePage": page_number,
                    "subject": term,
                })
    royal_pair = [item for item in units[1] if item["subject"].casefold() in {"ferdinand", "isabella", "ferdinand and isabella"}]
    if royal_pair:
        insert_at = min(units[1].index(item) for item in royal_pair)
        units[1] = [item for item in units[1] if item not in royal_pair]
        units[1].insert(insert_at, {
            "back": "Ferdinand of Aragon and Isabella of Castile were the monarchs who united dynastic Spain, strengthened royal authority over nobles and clergy, completed the conquest of Granada, enforced Catholic religious unity through the Spanish Inquisition, and sponsored Columbus's 1492 voyage.",
            "sourcePage": min(item["sourcePage"] for item in royal_pair),
            "subject": "Ferdinand and Isabella",
        })
    return units


def build_decks(units):
    decks = []
    for unit_number, unit_name in UNIT_NAMES.items():
        cards = []
        for item in units[unit_number]:
            cards.append({
                "id": f"apeuro-u{unit_number}-c{len(cards) + 1}",
                "front": item["subject"],
                "back": BACK_OVERRIDES.get(item["subject"], item["back"]),
                "sourcePage": item["sourcePage"],
            })
        topic_count = max(1, round(len(cards) / 10))
        candidates = FEYNMAN_CANDIDATES[unit_number]
        prompts = candidates[:min(topic_count, len(candidates))]
        deck_id = f"apeuro-unit-{unit_number}"
        decks.append({
            "id": deck_id,
            "name": f"AP European History - Unit {unit_number}",
            "shortName": f"Unit {unit_number}: {unit_name}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": cards,
            "questions": [],
            "feynmanPrompts": [
                {"id": f"{deck_id}-f{index + 1}", "prompt": prompt}
                for index, prompt in enumerate(prompts)
            ],
        })
    return decks


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: generate-apeuro-data.py SOURCE_PDF OUTPUT_JS")
    source, output = map(pathlib.Path, sys.argv[1:])
    decks = build_decks(parse(source))
    payload = "window.AP_EUROPEAN_HISTORY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n"
    output.write_text(payload)
    cards = sum(len(deck["cards"]) for deck in decks)
    topics = sum(len(deck["feynmanPrompts"]) for deck in decks)
    print(f"Wrote {cards} cards and {topics} Feynman topics across {len(decks)} units ({cards / max(1, topics):.1f}:1)")
    for deck in decks:
        print(f"  {deck['shortName']}: {len(deck['cards'])} cards, {len(deck['feynmanPrompts'])} topics")


if __name__ == "__main__":
    main()
