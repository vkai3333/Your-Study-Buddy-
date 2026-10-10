#!/usr/bin/env python3
"""Build AP World History study decks from the supplied Simple Studies PDF.

The source is narrative rather than glossary-driven, so cards preserve the
guide's claims while grouping them into explanation, cause/effect,
comparison, and significance prompts.
"""

import json
import pathlib
import re
import sys

import pdfplumber


SOURCE_TITLE = "AP World History Study Guide - Simple Studies"
SOURCE_URL = "https://uploads-ssl.webflow.com/605fe570e5454a357d1e1811/609f602ab8c522d2fbb74495_SS-AP-World-History.pdf"

UNIT_NAMES = {
    1: "The Global Tapestry",
    2: "Networks of Exchange",
    3: "Land-Based Empires",
    4: "Transoceanic Interconnections",
    5: "Revolutions",
    6: "Consequences of Industrialization",
    7: "Global Conflict",
    8: "Cold War and Decolonization",
    9: "Globalization",
}

FEYNMAN_TOPICS = {
    1: [
        "Song Dynasty", "China's tributary system", "Japanese feudalism", "Korea's relationship with China",
        "Dar al-Islam", "Delhi Sultanate", "Chola Dynasty", "Srivijaya Empire", "Majapahit Kingdom",
        "Khmer Empire", "Aztec Empire", "Inca Empire", "Mali Empire", "Great Zimbabwe", "Medieval European feudalism",
    ],
    2: [
        "Silk Roads", "Mongol Empire", "Indian Ocean trade network", "Trans-Saharan trade routes",
        "Caravanserai and commercial exchange", "Diasporic merchant communities", "Cultural diffusion across trade routes",
        "The Black Death and Afro-Eurasian exchange", "Tributary trade relationships",
    ],
    3: [
        "Ottoman Empire", "Safavid Empire", "Mughal Empire", "Qing Dynasty", "Tokugawa Japan", "Russian Empire",
        "Gunpowder empires", "Imperial bureaucracy and taxation", "Religion as imperial legitimacy",
    ],
    4: [
        "Portuguese maritime empire", "Spanish maritime empire", "Dutch maritime empire", "British maritime empire",
        "Columbian Exchange", "Atlantic slave trade", "Global silver trade", "Mercantilism", "Encomienda and hacienda systems",
        "Resistance to expanding empires", "Changing social hierarchies in the Atlantic world",
    ],
    5: [
        "The Enlightenment", "American Revolution", "French Revolution", "Haitian Revolution",
        "Latin American independence movements", "Nationalism", "Industrial Revolution", "Capitalism and socialism",
        "Labor movements in the Industrial Age", "Industrialization beyond Britain",
    ],
    6: [
        "New imperialism", "Scramble for Africa", "Imperialism in South and Southeast Asia",
        "Indigenous resistance to imperial expansion", "Economic imperialism", "Export economies",
        "Indentured labor migration", "Global migration and diaspora communities", "Social effects of migration",
    ],
    7: [
        "Shifting global power after 1900", "Causes of World War I", "Total war in World War I", "Russian Revolution",
        "Great Depression", "Fascism", "Causes of World War II", "Total war in World War II", "Genocide and mass atrocities",
    ],
    8: [
        "Cold War", "Containment", "Cold War proxy wars", "Chinese Communist Revolution", "Decolonization in India",
        "Decolonization in Africa", "Decolonization in Southeast Asia", "Non-Aligned Movement",
        "Challenges facing newly independent states", "End of the Soviet Union",
    ],
    9: [
        "Green Revolution", "Digital revolution", "Global disease in the twentieth century", "Climate change",
        "Economic globalization", "International economic institutions", "Post-1900 reform movements",
        "Globalized popular culture", "Resistance to globalization",
    ],
}

PROMPT_OVERRIDES = {
    (1, "Transfers"): "How did knowledge move among Islamic and Christian societies?",
    (2, "Mongolian Empire Expands"): "How did the Mongol Empire expand and support exchange?",
    (3, "Europe"): "How did European states centralize and expand power from 1450 to 1750?",
    (3, "Russia"): "How did Russia centralize and expand power from 1450 to 1750?",
    (3, "East Asia"): "How did East Asian states consolidate power from 1450 to 1750?",
    (4, "Empire"): "How did maritime empires establish and maintain overseas control?",
    (4, "Portugal"): "How did Portugal build and maintain its maritime empire?",
    (4, "France"): "How did France build and maintain its maritime empire?",
    (4, "Russia"): "How did Russia expand its territorial empire?",
}

DEFINITION_CARDS = {
    1: [
        ("What was Champa rice?", "A fast-ripening, drought-resistant rice variety from Champa that increased food production and supported population growth in Song China."),
        ("What was the Mandate of Heaven?", "The Chinese belief that a ruler governed with divine approval only while ruling justly and maintaining order."),
        ("What was the dynastic cycle?", "A model describing the rise, prosperity, decline, and replacement of Chinese dynasties as rulers gained and lost the Mandate of Heaven."),
        ("What was meritocracy in imperial China?", "A system in which government positions were awarded largely through education and performance on civil service examinations."),
        ("What was the Chinese tributary system?", "A diplomatic system in which neighboring states presented tribute to the Chinese emperor in exchange for recognition, trade access, or protection."),
        ("What was Neo-Confucianism?", "A revived form of Confucian thought that incorporated ideas from Buddhism and Daoism while emphasizing social order and moral conduct."),
        ("Who were the daimyo?", "Powerful Japanese landholding lords who controlled territories and competed for political influence."),
        ("Who was the shogun?", "Japan's military ruler, who exercised political authority while the emperor retained symbolic status."),
        ("What was the Bhakti movement?", "A Hindu devotional movement that emphasized an individual's loving connection to a chosen deity over ritual or social status."),
        ("What was the mit'a system?", "The Inca labor obligation requiring communities to provide workers for state projects and public service."),
        ("Who were griots?", "West African oral historians and storytellers who preserved community history, genealogy, and traditions."),
    ],
    2: [
        ("What was a caravanserai?", "A roadside inn along overland trade routes where merchants and animals could rest, resupply, and exchange information."),
        ("What was a bill of exchange?", "A written order allowing merchants to transfer or receive money without carrying large quantities of currency."),
        ("What was Pax Mongolica?", "The period of relative stability under Mongol rule that made travel and exchange across much of Eurasia safer."),
        ("What was a khanate?", "A territory governed by a khan; the Mongol Empire divided into several major khanates after Chinggis Khan's death."),
        ("How did monsoon winds support Indian Ocean trade?", "Their predictable seasonal direction allowed sailors to plan reliable outward and return voyages across the Indian Ocean."),
        ("What was a dhow?", "A sailing vessel with lateen sails widely used by merchants in the Indian Ocean and Arabian Sea."),
        ("What was a Chinese junk?", "A large, durable sailing ship with multiple masts and compartmentalized hulls used in Asian maritime trade."),
        ("What was a diasporic merchant community?", "A community of merchants living outside their homeland that maintained cultural ties while facilitating long-distance trade."),
        ("What were the Swahili city-states?", "Independent East African coastal trading cities that blended African and Islamic cultural influences."),
        ("What was the trans-Saharan trade network?", "The caravan routes across the Sahara that exchanged gold, salt, enslaved people, and other goods between North and West Africa."),
    ],
    3: [
        ("Who were the Janissaries?", "Elite Ottoman infantry soldiers, many originally recruited through the devshirme system and trained for service to the sultan."),
        ("What was devshirme?", "The Ottoman levy that took Christian boys from the Balkans, converted and educated them, and placed them in military or administrative service."),
        ("What was the Ottoman Empire?", "A Sunni Muslim empire centered in Anatolia that expanded into southeastern Europe, Southwest Asia, and North Africa."),
        ("What was the Safavid Empire?", "A Persian empire that established Twelver Shi'a Islam as a central part of state identity."),
        ("What was the Mughal Empire?", "A Muslim-ruled empire in South Asia known for territorial expansion, administrative integration, and cultural blending."),
        ("Who were zamindars?", "Local officials or landholders in the Mughal Empire who collected taxes and transmitted revenue to the state."),
        ("What was Sikhism?", "A monotheistic religion founded in South Asia that drew from regional Hindu and Islamic traditions while developing distinct beliefs and practices."),
        ("What was divine right?", "The belief that a monarch's authority came from God and therefore was not subject to ordinary earthly challenge."),
        ("Who were the boyars?", "Russia's hereditary noble landowners, whose political independence was reduced as tsars centralized power."),
        ("What was a gunpowder empire?", "A large early modern state that used firearms and artillery to conquer territory and strengthen centralized rule."),
    ],
    4: [
        ("What was a caravel?", "A small, maneuverable European sailing ship suited to long-distance exploration and Atlantic travel."),
        ("What was an astrolabe?", "A navigation instrument used to estimate latitude by measuring the position of celestial bodies."),
        ("What was the Columbian Exchange?", "The transfer of crops, animals, people, diseases, and ideas between the Eastern and Western Hemispheres after 1492."),
        ("What was the encomienda system?", "A Spanish colonial labor system granting settlers the right to demand labor or tribute from Indigenous communities."),
        ("What was the hacienda system?", "A system of large landed estates in Spanish America that relied on dependent labor to produce agricultural goods."),
        ("What was mercantilism?", "An economic policy that sought national wealth through favorable trade balances, state regulation, and colonial control of resources and markets."),
        ("What was a joint-stock company?", "A business funded by multiple investors who shared its risks and profits, often used to finance overseas trade and colonization."),
        ("What was the Middle Passage?", "The forced Atlantic voyage that transported enslaved Africans to the Americas under brutal and deadly conditions."),
        ("What was chattel slavery?", "A hereditary system that treated enslaved people as legally owned property for life."),
        ("What were the Manila galleons?", "Spanish ships that carried American silver to Manila and returned with Asian luxury goods, linking the Americas to Asian trade."),
    ],
    5: [
        ("What was the Enlightenment?", "An intellectual movement emphasizing reason, natural rights, and the use of evidence to evaluate government and society."),
        ("What was the social contract?", "The idea that political authority comes from an agreement in which people accept government in exchange for protection of their rights."),
        ("What were natural rights?", "Rights understood as inherent to human beings rather than granted by a ruler, often identified as life, liberty, and property."),
        ("What was popular sovereignty?", "The principle that legitimate political power originates with the people."),
        ("What was nationalism?", "A strong identification with a nation and the belief that people sharing a culture or identity should govern themselves."),
        ("What was laissez-faire economics?", "The view that markets function best with limited government interference in production and trade."),
        ("What was industrialization?", "The shift toward mechanized production, factories, fossil-fuel energy, and increasingly urban wage labor."),
        ("What was capitalism?", "An economic system based on private ownership, investment, markets, and production for profit."),
        ("What was socialism?", "A family of ideas favoring social or public control of economic resources to reduce inequality."),
        ("What was communism in Marxist theory?", "A proposed classless society with collective ownership of productive property, expected to emerge after the end of capitalism."),
    ],
    6: [
        ("What was Social Darwinism?", "The misuse of evolutionary ideas to claim that competition among peoples or states justified inequality and imperial domination."),
        ("What was the 'White Man's Burden'?", "A racist imperial ideology claiming Europeans had a duty to rule and 'civilize' other peoples."),
        ("What was a sphere of influence?", "An area where an outside power claimed special economic or political privileges without establishing full colonial rule."),
        ("What was the Berlin Conference?", "The 1884-1885 meeting where European powers established rules for claiming African territory without African representation."),
        ("What was a settler colony?", "A colony where large numbers of migrants permanently settled and often displaced Indigenous populations."),
        ("What was a cash crop?", "An agricultural product grown mainly for sale or export rather than direct local consumption."),
        ("What was indentured servitude?", "Contract labor in which workers served for a fixed period, often in exchange for transportation, wages, or debt repayment."),
        ("What were the Opium Wars?", "Wars in which Britain defeated Qing China and forced it to expand foreign trade access and grant unequal concessions."),
        ("What was the Sepoy Rebellion?", "The 1857 uprising by Indian soldiers and civilians against British East India Company rule, after which Britain imposed direct imperial control."),
        ("What was the Meiji Restoration?", "The political transformation beginning in 1868 that restored imperial rule and accelerated Japanese centralization and industrialization."),
    ],
    7: [
        ("What was militarism?", "The glorification of military power and the expansion of armed forces as instruments of national policy."),
        ("What was total war?", "Warfare in which states mobilized economies and civilian populations as well as armies to achieve victory."),
        ("What was trench warfare?", "A defensive form of combat fought from fortified trench systems, especially associated with the Western Front in World War I."),
        ("What was self-determination?", "The principle that a people should have the right to choose its own government and political status."),
        ("What was the Treaty of Versailles?", "The post-World War I treaty that imposed territorial losses, military limits, and reparations on Germany and created the League of Nations."),
        ("What was the mandate system?", "The League of Nations arrangement that placed former German and Ottoman territories under the administration of victorious powers."),
        ("What was fascism?", "An authoritarian nationalist ideology that rejected liberal democracy, promoted state power, and often embraced militarism and political violence."),
        ("What was appeasement?", "The policy of granting concessions to an aggressive state in hopes of avoiding a larger conflict."),
        ("What was the Holocaust?", "Nazi Germany's systematic persecution and murder of six million Jews and millions of other targeted victims."),
        ("What is genocide?", "The intentional effort to destroy, in whole or in part, a national, ethnic, racial, or religious group."),
    ],
    8: [
        ("What was containment?", "The United States strategy of limiting the further spread of communism during the Cold War."),
        ("What was the Truman Doctrine?", "The American policy of supporting states threatened by communist expansion, first announced in aid to Greece and Turkey."),
        ("What was the Marshall Plan?", "A United States program providing economic aid to rebuild Western European economies after World War II."),
        ("What was NATO?", "A collective-defense alliance formed in 1949 by the United States, Canada, and Western European states."),
        ("What was the Warsaw Pact?", "The Soviet-led military alliance formed in 1955 with communist states in Eastern Europe."),
        ("What was a proxy war?", "A conflict in which larger powers supported opposing local forces rather than fighting each other directly."),
        ("What was decolonization?", "The process through which colonies gained political independence from imperial powers."),
        ("What was the Non-Aligned Movement?", "A coalition of states that sought political independence from both the American and Soviet blocs during the Cold War."),
        ("What was the Great Leap Forward?", "Mao Zedong's campaign to rapidly industrialize and collectivize China, which contributed to catastrophic famine."),
        ("What were glasnost and perestroika?", "Mikhail Gorbachev's policies of greater openness and economic-political restructuring in the Soviet Union."),
    ],
    9: [
        ("What was the Green Revolution?", "The spread of high-yield crops, irrigation, fertilizers, and pesticides that increased agricultural production in many developing regions."),
        ("What is globalization?", "The intensification of worldwide economic, cultural, political, and technological connections."),
        ("What is a multinational corporation?", "A company that owns or controls production and business operations in more than one country."),
        ("What is the World Trade Organization?", "An international organization that establishes trade rules and provides a forum for resolving trade disputes."),
        ("What is the International Monetary Fund?", "An international institution that promotes monetary cooperation and lends to states facing financial instability."),
        ("What is the World Bank?", "An international institution that finances development and poverty-reduction projects."),
        ("What is neoliberalism?", "An economic approach favoring privatization, deregulation, reduced trade barriers, and a larger role for markets."),
        ("What is the digital divide?", "The unequal access to digital technologies, reliable internet service, and the skills needed to use them."),
        ("What is climate change?", "Long-term shifts in climate patterns, now driven primarily by human greenhouse-gas emissions from fossil fuels and land-use change."),
        ("What is a nongovernmental organization?", "A nonprofit organization independent of government that works on humanitarian, environmental, development, or advocacy goals."),
    ],
}


def clean(text):
    text = str(text or "").replace("—", "-").replace("–", "-")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def page_lines(page):
    """Return visually grouped lines with basic bold/bullet metadata."""
    words = page.extract_words(extra_attrs=["fontname", "size"], use_text_flow=False)
    groups = []
    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        group = next((item for item in reversed(groups[-4:]) if abs(item["top"] - word["top"]) <= 2), None)
        if group is None:
            group = {"top": word["top"], "words": []}
            groups.append(group)
        group["words"].append(word)
    lines = []
    for group in groups:
        ordered = sorted(group["words"], key=lambda item: item["x0"])
        text = clean(" ".join(item["text"] for item in ordered))
        if not text:
            continue
        letter_words = [item for item in ordered if re.search(r"[A-Za-z]", item["text"])]
        bold = bool(letter_words) and sum("Bold" in item.get("fontname", "") for item in letter_words) / len(letter_words) >= 0.75
        first_font = ordered[0].get("fontname", "")
        bullet = bool(re.match(r"^[°•]\s*", text)) or (text.startswith("o ") and "Courier" in first_font)
        lines.append({"text": text, "bold": bold, "bullet": bullet})
    return lines


def strip_bullet(text):
    return clean(re.sub(r"^(?:[°•]|o)\s*", "", text))


def topic_label(topic):
    label = clean(re.sub(r"^TOPIC\s+\d+\.\d+\s+", "", topic, flags=re.I))
    if re.search(r"from 1450 to$", label, re.I):
        label += " 1750"
    if re.search(r"After$", label, re.I):
        label += " 1900"
    return label


def question_for(unit_number, section, topic, region="", part=None):
    section = clean(section).rstrip(":")
    lowered = section.lower()
    place = clean(region).title()
    if (unit_number, section) in PROMPT_OVERRIDES:
        prompt = PROMPT_OVERRIDES[(unit_number, section)]
    elif lowered.startswith("significance of "):
        prompt = f"Why was {section[16:]} historically significant?"
    elif "cause" in lowered:
        subject = re.sub(r"^Causes?\s+of\s+", "", section, flags=re.I)
        prompt = f"What caused {subject}?"
    elif any(word in lowered for word in ("effect", "consequence", "impact")):
        prompt = f"What were the major {section.lower()}?"
    elif "comparison" in lowered or lowered.startswith("compare"):
        prompt = f"Compare the developments described in {section}."
    elif lowered == "government" and place:
        prompt = f"How was {place} governed?"
    elif "political structure" in lowered:
        prompt = f"How was power organized in {place or section}?"
    elif "social structure" in lowered:
        prompt = f"How was society organized in {place or section}?"
    elif "religion" in lowered or "belief" in lowered:
        prompt = f"How did {section.lower()} shape this historical setting?"
    else:
        prompt = f"Explain {section}{f' in {place}' if place and place.casefold() not in lowered else ''}."
    if part:
        focus = [
            "its origins and defining features",
            "how it operated and changed over time",
            "its political, economic, and social effects",
            "its wider historical significance",
        ][min(part - 1, 3)]
        prompt = f"{prompt} Focus on {focus}."
    return prompt


def label_question(label, topic, region=""):
    label = clean(label).rstrip(":")
    place = clean(region).title()
    if label.lower().startswith(("why ", "how ", "what ")):
        return label + ("" if label.endswith("?") else "?")
    return f"What role or historical significance did {label} have{f' in {place}' if place else ''}?"


def term_front(section, region="", part=None):
    """Return a concise term/phrase, never a question, for a card front."""
    section = clean(section).rstrip(":")
    place = clean(region).title()
    lowered = section.casefold()
    if lowered.startswith("significance of "):
        section = clean(re.sub(r"^significance of\s+(?:the\s+)?", "", section, flags=re.I))
        lowered = section.casefold()
    elif re.match(r"^causes? of ", lowered):
        section = clean(re.sub(r"^causes? of\s+(?:the\s+)?", "", section, flags=re.I)) + " - causes"
        lowered = section.casefold()
    elif re.match(r"^(?:effects?|consequences?|impacts?) of ", lowered):
        section = clean(re.sub(r"^(?:effects?|consequences?|impacts?) of\s+(?:the\s+)?", "", section, flags=re.I)) + " - effects"
        lowered = section.casefold()
    if place and lowered in {"government", "religion", "beliefs", "aristocracy", "society", "social structures", "political structures"}:
        term = f"{section} in {place}"
    elif place and place.casefold() not in lowered:
        term = f"{section} in {place}"
    else:
        term = section
    if part:
        focus = ("origins and features", "development and change", "effects", "historical significance")[min(part - 1, 3)]
        term = f"{term} - {focus}"
    return term


def definition_term(front):
    special = {
        "How did monsoon winds support Indian Ocean trade?": "Monsoon winds and Indian Ocean trade",
    }
    if front in special:
        return special[front]
    match = re.match(r"^(?:What (?:was|is|were)|Who (?:was|were))\s+(?:the\s+|an?\s+)?(.+?)\?$", front, re.I)
    return clean(match.group(1)) if match else clean(front).rstrip("?")


def parse(pdf_path):
    units = {number: {"topics": [], "sections": []} for number in UNIT_NAMES}
    current_unit = None
    current_topic = ""
    current_section = "Overview"
    current_region = ""
    current_bullet = None
    current_page = None

    def flush_bullet():
        nonlocal current_bullet
        if current_unit and current_bullet:
            value = clean(current_bullet)
            if len(value) >= 20:
                units[current_unit]["sections"].append({
                    "topic": current_topic,
                    "section": current_section,
                    "region": current_region,
                    "text": value,
                    "page": current_page,
                })
        current_bullet = None

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            for line in page_lines(page):
                text = line["text"]
                unit_match = re.match(r"^Unit\s+(\d+):\s*(.*)", text, re.I)
                if unit_match:
                    flush_bullet()
                    current_unit = int(unit_match.group(1))
                    current_topic = ""
                    current_section = "Overview"
                    current_region = ""
                    continue
                if current_unit is None:
                    continue
                if re.match(r"^TOPIC\s+\d+\.\d+", text, re.I):
                    flush_bullet()
                    current_topic = text
                    units[current_unit]["topics"].append(text)
                    current_section = topic_label(text)
                    current_region = ""
                    continue
                if line["bold"] and not line["bullet"] and len(text) <= 150:
                    flush_bullet()
                    if not re.match(r"^(AP World History Study Guide|\(?\d+%|-?\d+%|Emperor$)", text, re.I):
                        if text == text.upper() and re.search(r"[A-Z]", text):
                            current_region = text
                        current_section = text
                    continue
                if line["bullet"]:
                    flush_bullet()
                    current_page = page_number
                    current_bullet = strip_bullet(text)
                elif current_bullet:
                    current_bullet += " " + text
            # Bullets sometimes continue across pages, so do not flush here.
        flush_bullet()
    return units


def build_decks(units):
    decks = []
    for unit_number, name in UNIT_NAMES.items():
        source = units[unit_number]
        cards = []
        seen = set()
        grouped = {}
        for item in source["sections"]:
            if clean(item["section"]).casefold() == "sources":
                continue
            grouped.setdefault((item["topic"], item["section"], item.get("region", "")), []).append(item)
        for (topic, section, region), items in grouped.items():
            colon_items = []
            narrative_items = []
            for item in items:
                match = re.match(r"^([^:]{2,70}):\s+(.+)$", item["text"])
                if match:
                    colon_items.append((item, clean(match.group(1)), clean(match.group(2))))
                else:
                    narrative_items.append(item)
            for item, label, answer in colon_items:
                front = term_front(label, region)
                key = (front.casefold(), answer.casefold())
                if key in seen:
                    continue
                seen.add(key)
                cards.append({"front": front, "back": answer, "sourcePage": item["page"]})
            chunk_size = 3
            chunks = [narrative_items[index:index + chunk_size] for index in range(0, len(narrative_items), chunk_size)]
            for chunk_index, chunk in enumerate(chunks, start=1):
                if not chunk:
                    continue
                answer = " ".join(item["text"] for item in chunk)
                front = term_front(section, region, chunk_index if len(chunks) > 1 else None)
                key = (front.casefold(), answer.casefold())
                if key in seen:
                    continue
                seen.add(key)
                cards.append({"front": front, "back": answer, "sourcePage": chunk[0]["page"]})
        for front, back in DEFINITION_CARDS[unit_number]:
            front = definition_term(front)
            key = (front.casefold(), back.casefold())
            if key not in seen:
                seen.add(key)
                cards.append({"front": front, "back": back, "sourcePage": None})
        for index, card in enumerate(cards, start=1):
            card["back"] = clean(card["back"].replace("•", " "))
            card["id"] = f"apworld-u{unit_number}-c{index}"
        prompts = []
        # AP topic headers such as "Empires Expand" and "Empires:
        # Administration" are organizational labels, not useful recall cues.
        # Use concrete, deliberately selected historical subjects instead.
        prompt_values = FEYNMAN_TOPICS[unit_number]
        prompt_seen = set()
        for value in prompt_values:
            value = re.sub(r"\s+from\s+c\.\s*\d+.*$", "", clean(value), flags=re.I).rstrip(":")
            normalized = value.casefold()
            if not value or normalized in prompt_seen:
                continue
            prompt_seen.add(normalized)
            prompts.append({"id": f"apworld-u{unit_number}-f{len(prompts) + 1}", "prompt": value})
        decks.append({
            "id": f"apworld-unit-{unit_number}",
            "name": f"AP World History · Unit {unit_number}",
            "shortName": f"Unit {unit_number}: {name}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": cards,
            "questions": [],
            "feynmanPrompts": prompts,
        })
    return decks


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: generate-apworld-data.py SOURCE_PDF OUTPUT_JS")
    source_path = pathlib.Path(sys.argv[1])
    output_path = pathlib.Path(sys.argv[2])
    decks = build_decks(parse(source_path))
    payload = "window.AP_WORLD_HISTORY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n"
    output_path.write_text(payload)
    print(f"Wrote {sum(len(deck['cards']) for deck in decks)} cards and {sum(len(deck['feynmanPrompts']) for deck in decks)} Feynman topics across {len(decks)} units")


if __name__ == "__main__":
    main()
