#!/usr/bin/env python3
"""Build AP Environmental Science decks from the supplied Simple Studies PDF."""

import json
import pathlib
import re
import sys

import pdfplumber


SOURCE_TITLE = "AP Environmental Science Study Guide - Simple Studies"
SOURCE_URL = "https://uploads-ssl.webflow.com/605fe570e5454a357d1e1811/60a02be2f3b25f044ccddca1_SS-AP-Env-Sci.pdf"

UNIT_NAMES = {
    "1-2": "The Living World",
    "3": "Populations",
    "4": "Earth Systems and Resources",
    "5": "Land and Water Use",
    "6": "Energy Resources and Consumption",
    "7-8": "Atmospheric, Terrestrial, and Aquatic Pollution",
    "9": "Global Change",
}

FEYNMAN_TOPICS = {
    "1-2": [
        "Ecosystem structure", "Species interactions", "Energy flow through ecosystems",
        "Biodiversity and ecosystem stability", "Ecological succession",
    ],
    "3": [
        "Population growth and carrying capacity", "R-selected vs. K-selected species",
        "Human population growth", "The IPAT model and ecological footprints",
    ],
    "4": [
        "Plate tectonics and volcanism", "Atmospheric structure and the greenhouse effect",
        "Freshwater and marine systems", "Soil formation and soil chemistry",
        "The rock cycle and weathering", "Agriculture and soil conservation",
    ],
    "5": [
        "The tragedy of the commons", "Renewable vs. nonrenewable resources",
        "Agriculture and soil degradation", "Forest and mineral resource management",
        "Commercial fishing and aquaculture",
    ],
    "6": [
        "Energy and the laws of thermodynamics", "Fossil fuels and nuclear energy",
        "Renewable energy systems and tradeoffs",
    ],
    "7-8": [
        "Human water use and wastewater treatment", "Eutrophication and oxygen depletion",
        "Persistent, thermal, and sediment pollution", "Air pollution and emission controls",
        "Stratospheric ozone depletion",
    ],
    "9": [
        "Physical and biological effects of climate change",
        "Climate mitigation and adaptation",
    ],
}

SKIP_TERMS = {
    "pros", "cons", "solutions", "characteristics", "locations", "uses", "problem",
    "drawbacks", "positive effects", "negative effects", "other problems", "what is it?",
    "examples", "classifications", "types of species", "types of volcanoes",
    "types of rocks", "types of soil", "types of weathering", "types of pollution",
    "types of pesticides", "main sources of energy", "forms of energy",
    "sources of energy", "sources of air pollution", "anthropogenic emissions",
    "ways to address air pollution", "ways of controlling emissions",
    "practices to conserve soil properties", "how the problem is being addressed",
    "source", "ples",
    "blending", "cell respiration", "recharging", "the importance of soil", "soil problems",
    "natural events & forest fires", "location", "biggest source of pollution",
    "wastewater from humans + livestock could pose multiple problems", "problems w. wastewater",
    "heavy metals and other chemicals", "photochemical smog and acid rain",
}

TERM_REPAIRS = {
    ("1-2", "Abiotic"): "Abiotic factors",
    ("1-2", "Biotic"): "Biotic factors",
    ("1-2", "Keystone"): "Keystone species",
    ("1-2", "Indicator"): "Indicator species",
    ("1-2", "Support Services"): "Supporting ecosystem services",
    ("1-2", "Charles Darwin (Father of Evolution) Theory"): "Evolution by natural selection",
    ("3", "Rule of"): "Rule of 70",
    ("3", "Type I"): "Type I survivorship curve",
    ("3", "Type II"): "Type II survivorship curve",
    ("3", "Type III"): "Type III survivorship curve",
    ("3", "I=P*A*T"): "IPAT equation",
    ("4", "Active"): "Active volcano",
    ("4", "Dormant"): "Dormant volcano",
    ("4", "Extinct"): "Extinct volcano",
    ("4", "Physical"): "Physical weathering",
    ("4", "Chemical"): "Chemical weathering",
    ("4", "Biological"): "Biological weathering",
    ("4", "What is Soil?"): "Soil",
    ("4", "Igneous"): "Igneous rock",
    ("4", "Sedimentary"): "Sedimentary rock",
    ("4", "Metamorphic"): "Metamorphic rock",
    ("6", "Potential"): "Potential energy",
    ("6", "Kinetic"): "Kinetic energy",
    ("6", "Radiant"): "Radiant energy",
    ("6", "Thermal"): "Thermal energy",
    ("6", "Chemical"): "Chemical energy",
    ("6", "Electrical"): "Electrical energy",
    ("6", "Nuclear"): "Nuclear energy",
    ("5", "No-Hill Method"): "No-till farming",
    ("5", "Biological"): "Biological pest control",
    ("5", "(POPs)"): "Persistent organic pollutants (POPs)",
    ("5", "Inorganic"): "Inorganic pesticides",
    ("5", "Organic/Natural"): "Botanical pesticides",
    ("5", "Slash"): "Slash-and-burn agriculture",
    ("5", "Overfishing & Aquaculture"): "Overfishing",
    ("6", "Nonrenewable"): "Nonrenewable energy",
    ("6", "Renewable"): "Renewable energy",
    ("7-8", "Agriculture"): "Agricultural water use",
    ("7-8", "Industry"): "Industrial water use",
    ("7-8", "Household Use (Anthropogenic Uses)"): "Residential water use",
    ("7-8", "Oxygen Problems"): "Oxygen depletion in water",
    ("7-8", "Excessive Nutrient Release"): "Nutrient pollution",
    ("7-8", "Disease-Causing Organisms"): "Waterborne pathogens",
    ("7-8", "Deposition"): "Acid deposition",
    ("7-8", "Synthetic Organic Compounds and Human-Produced Chemicals"): "Synthetic organic water pollutants",
    ("7-8", "Military Compounds"): "Perchlorate contamination",
    ("7-8", "Industrial Compounds"): "Polychlorinated biphenyls (PCBs)",
    ("7-8", "Primary Pollutants"): "Primary pollutant",
    ("7-8", "Secondary Pollutants"): "Secondary pollutant",
    ("7-8", "Volatile Organic Compounds"): "Volatile organic compound",
    ("7-8", "How People are Implementing Innovative Pollution Control Measures"): "Air pollution control strategies",
    ("7-8", "Breakdown of Stratospheric Ozone"): "Stratospheric ozone depletion",
    ("9", "Greenhouse Gas Pre-Industrial Level In 2016"): "Changes in greenhouse gas concentrations",
    ("9", "Physical Changes"): "Physical effects of climate change",
    ("9", "Changes in Biota"): "Biological effects of climate change",
    ("9", "Adaptations to the Warmer Climate"): "Climate adaptation",
    ("9", "Technological"): "Technological climate solutions",
    ("9", "Behavioral"): "Behavioral climate solutions",
    ("9", "Policy"): "Climate policy solutions",
}

BACK_OVERRIDES = {
    "population": "A group of individuals of the same species living in the same area at the same time and capable of interacting and reproducing.",
    "ecotones": "Transitional zones where two ecosystems or biomes meet; they often contain species from both communities and may have high biodiversity.",
    "biological extinction": "The permanent loss of a species when its last surviving individual dies, leaving no living members anywhere on Earth.",
    "abiotic factors": "The nonliving physical and chemical components of an ecosystem, including sunlight, temperature, water, air, soil, and nutrients.",
    "biotic factors": "The living components of an ecosystem, including organisms and their interactions with one another.",
    "keystone species": "A species whose ecological impact is disproportionately large relative to its abundance; removing it can cause major changes throughout the community.",
    "indicator species": "A species whose presence, absence, or condition provides information about environmental quality or ecosystem change.",
    "supporting ecosystem services": "Underlying ecological processes that make other ecosystem services possible, including nutrient cycling, soil formation, primary production, and habitat provision.",
    "evolution by natural selection": "The process by which heritable traits that improve survival or reproduction become more common in a population across generations.",
    "type i survivorship curve": "A survivorship pattern with low mortality through early and middle life followed by high mortality in old age, typical of humans and other large mammals.",
    "type ii survivorship curve": "A survivorship pattern with a roughly constant probability of death at every age, seen in many birds and some rodents.",
    "type iii survivorship curve": "A survivorship pattern with very high juvenile mortality but relatively long survival among the few individuals that reach adulthood, common in fish, insects, and many plants.",
    "ipat equation": "A conceptual model stating that environmental impact equals population multiplied by affluence and technology: I = P × A × T.",
    "j-curve model": "A graph of exponential population growth in which population size rises increasingly rapidly when resources are effectively unlimited.",
    "logistic population growth (s-curve)": "Population growth that begins rapidly, slows as limiting factors intensify, and levels near the environment's carrying capacity.",
    "density-independent factors": "Environmental events whose effects do not depend on population density, such as droughts, freezes, floods, fires, storms, and earthquakes.",
    "emigration": "The movement of individuals out of a population, which decreases that population's size.",
    "immigration": "The movement of individuals into a population, which increases that population's size.",
    "endangered species": "A species at serious risk of extinction throughout all or a significant portion of its range.",
    "degradation": "The deterioration of habitat or environmental quality through pollution, resource depletion, fragmentation, erosion, or other disturbances.",
    "overexploitation": "The unsustainable harvesting of organisms faster than their populations can replace themselves, increasing the risk of population collapse or extinction.",
    "soil": "A mixture of weathered mineral particles, organic matter, water, air, and living organisms that supports terrestrial plant growth and nutrient cycling.",
    "igneous rock": "Rock formed when molten magma or lava cools and solidifies.",
    "sedimentary rock": "Rock formed when sediments are deposited, compacted, and cemented or when minerals precipitate from water.",
    "metamorphic rock": "Rock altered from an existing rock type by heat, pressure, or chemically active fluids without completely melting.",
    "divergent boundary": "A plate boundary where tectonic plates move apart, allowing magma to rise and create new crust at features such as mid-ocean ridges and rift valleys.",
    "epicenter": "The point on Earth's surface directly above an earthquake's focus, where the rupture begins underground.",
    "richter scale": "A logarithmic scale historically used to express earthquake magnitude from the amplitude of seismic waves recorded by a seismograph.",
    "active volcano": "A volcano that is erupting, has erupted in recent geologic history, or shows signs that it may erupt again.",
    "extinct volcano": "A volcano that scientists do not expect to erupt again because it no longer has an active magma supply.",
    "shield volcanoes": "Broad, gently sloping volcanoes formed by repeated eruptions of low-viscosity basaltic lava, such as Mauna Loa.",
    "composite volcanoes": "Tall, steep-sided volcanoes built from alternating layers of lava and pyroclastic material; they can produce explosive eruptions.",
    "exosphere": "The outermost atmospheric layer, where gases are extremely sparse and gradually merge with outer space.",
    "thermosphere": "A very thin upper atmospheric layer above the mesosphere where absorption of high-energy solar radiation produces high temperatures and auroras occur.",
    "tropopause": "The boundary between the troposphere and stratosphere, where the troposphere's general decrease in temperature with altitude stops.",
    "no-till farming": "Planting crops directly into the residue of previous crops without plowing, which reduces erosion, soil disturbance, fuel use, and carbon loss.",
    "biological pest control": "The use of predators, parasites, pathogens, or competitors to reduce pest populations instead of relying only on chemical pesticides.",
    "persistent organic pollutants (pops)": "Carbon-based chemicals that resist degradation, travel long distances, bioaccumulate in organisms, and biomagnify through food webs; examples include DDT and PCBs.",
    "inorganic pesticides": "Pesticides made from toxic elements or mineral compounds, such as compounds containing arsenic, copper, lead, or mercury, that can persist in the environment.",
    "botanical pesticides": "Pesticides derived from plants, such as pyrethrins from chrysanthemums or nicotine from tobacco; natural origin does not necessarily mean nontoxic.",
    "slash-and-burn agriculture": "A form of shifting cultivation in which vegetation is cut and burned to clear land and release nutrients before short-term cropping.",
    "overfishing": "Harvesting fish faster than populations can reproduce, causing declining stocks, altered food webs, and possible fishery collapse.",
    "seed agriculture": "Cultivation in which farmers plant and reproduce crops using seeds rather than vegetative cuttings or root fragments.",
    "carbamates": "A class of pesticides that disrupts nervous-system function by inhibiting acetylcholinesterase; many break down faster than organochlorines but can still harm nontarget organisms.",
    "clear-cutting": "A timber-harvesting method that removes nearly all trees from an area at once, efficiently producing wood but increasing erosion, runoff, habitat loss, and stream warming.",
    "selective cutting": "A timber-harvesting method that removes selected trees while leaving most of the forest standing, generally reducing disturbance compared with clear-cutting.",
    "nonrenewable energy": "Energy from resources that form too slowly to be replenished on a human time scale, including coal, oil, natural gas, and uranium.",
    "renewable energy": "Energy from sources replenished naturally on a human time scale, including sunlight, wind, flowing water, biomass, and geothermal heat.",
    "potential energy": "Stored energy associated with an object's position, condition, or chemical composition that can be converted into other forms.",
    "kinetic energy": "The energy of motion; an object's kinetic energy increases with its mass and the square of its speed.",
    "radiant energy": "Energy carried by electromagnetic waves, including visible sunlight, infrared radiation, ultraviolet radiation, and radio waves.",
    "thermal energy": "The internal energy associated with the random motion of particles in matter and transferred between objects as heat.",
    "electrical energy": "Energy associated with moving electric charges, commonly electrons traveling through a conductor.",
    "nuclear energy": "Energy stored in atomic nuclei and released through fission, fusion, or radioactive decay.",
    "oil": "A liquid fossil fuel composed mainly of hydrocarbons, formed from ancient organic matter and refined into fuels and petrochemical products.",
    "methods of extracting oil": "Primary recovery uses natural reservoir pressure and pumping; secondary recovery injects water or gas to displace oil; enhanced recovery uses steam, heat, or chemicals to reduce viscosity and mobilize remaining oil.",
    "agricultural water use": "Freshwater used for irrigation and livestock; agriculture is the largest global human use of freshwater.",
    "industrial water use": "Freshwater used for manufacturing, processing, washing, cooling, and electricity generation.",
    "residential water use": "Household water used for drinking, cooking, sanitation, cleaning, landscaping, and recreation.",
    "oxygen depletion in water": "A decline in dissolved oxygen when microorganisms consume oxygen while decomposing organic matter, potentially creating hypoxic or anoxic conditions.",
    "nutrient pollution": "Excess nitrogen or phosphorus entering water, often from fertilizer, sewage, or animal waste, and stimulating algal growth and eutrophication.",
    "waterborne pathogens": "Disease-causing bacteria, viruses, protozoa, or parasites transmitted through contaminated water.",
    "acid deposition": "Acidic compounds deposited from the atmosphere as rain, snow, fog, gases, or particles, largely after sulfur dioxide and nitrogen oxides form acids.",
    "synthetic organic water pollutants": "Human-made carbon-based chemicals such as solvents, pesticides, fuels, and industrial compounds that contaminate surface water or groundwater.",
    "perchlorate contamination": "Water or soil contamination by perchlorate salts used in rocket fuel and explosives; exposure can interfere with thyroid function.",
    "polychlorinated biphenyls (pcbs)": "Persistent industrial chemicals formerly used in electrical equipment that bioaccumulate, biomagnify, and can damage human and ecosystem health.",
    "primary pollutant": "A pollutant emitted directly from a source, such as carbon monoxide, sulfur dioxide, nitrogen oxides, particulate matter, or volatile organic compounds.",
    "secondary pollutant": "A pollutant formed in the atmosphere through chemical reactions involving primary pollutants, sunlight, water, or oxygen; examples include tropospheric ozone and acids.",
    "particulate matter": "Solid particles and liquid droplets suspended in air; fine particles can enter deep into the lungs and increase respiratory and cardiovascular risk.",
    "volatile organic compound": "A carbon-containing compound that readily evaporates and can react with nitrogen oxides in sunlight to form photochemical smog and ozone.",
    "air pollution control strategies": "Measures that prevent or reduce emissions, including cleaner fuels, catalytic converters, scrubbers, electrostatic precipitators, vapor recovery, efficiency standards, and public transit.",
    "stratospheric ozone depletion": "The thinning of the protective ozone layer when chlorine or bromine radicals from compounds such as CFCs catalytically destroy stratospheric ozone.",
    "hydroponic agriculture": "Growing plants without soil by supplying roots with a controlled, nutrient-rich water solution; it can greatly reduce water and pesticide use but requires energy, equipment, and careful management.",
    "haze": "Reduced atmospheric visibility caused by fine particles and droplets that scatter and absorb light; common sources include smoke, sulfates, nitrates, dust, and organic aerosols.",
    "photochemical smog": "A brownish mixture of secondary pollutants, especially tropospheric ozone, formed when nitrogen oxides and volatile organic compounds react in sunlight.",
    "climate policy solutions": "Government actions such as emissions standards, carbon pricing, clean-energy incentives, efficiency requirements, conservation programs, and international agreements that reduce greenhouse gas emissions or protect carbon sinks.",
}

MANUAL_CARDS = {
    "6": [
        ("Hydroelectric power", "Electricity generated as moving water turns a turbine. It produces no chemical pollutants, but can cause thermal pollution and alter river flow and habitat."),
        ("Solar power", "Solar panels convert solar energy into heat or electricity. Operation produces no pollutants and requires little maintenance, but manufacturing and storage have costs and output depends on sunlight."),
        ("Biomass energy", "Energy from wood, charcoal, animal waste, or other biological material. It can be widely available and approximately carbon neutral, but may be expensive and contribute to deforestation."),
        ("Wind power", "Wind rotates turbine blades to generate electricity. It produces no operational pollutants, but is intermittent and can create noise, visual, and siting concerns."),
        ("Geothermal power", "Energy obtained from Earth's internal heat. It is reliable and produces little operational pollution, but is location-limited and can release dissolved gases or chemicals."),
        ("Tidal energy", "Incoming or outgoing tides turn turbines to generate electricity. Tides are predictable, but suitable sites are limited and ecosystem effects remain a concern."),
        ("Hydrogen fuel cell", "A device that uses hydrogen obtained from water or organic matter to generate electricity. Use is clean, but producing hydrogen can be expensive and may release pollutants."),
    ],
    "7-8": [
        ("Water footprint", "The total daily per-capita use of freshwater."),
        ("Biochemical oxygen demand", "The amount of oxygen a quantity of water uses over a period of time at a specified temperature."),
        ("Dead zone", "An area with extremely low oxygen concentration and very little aquatic life."),
        ("Eutrophication", "A process in which a body of water becomes rich in nutrients, often promoting algal growth and subsequent oxygen depletion."),
        ("Primary pollutant", "A polluting compound emitted directly from a source such as a smokestack, exhaust pipe, or natural emission source."),
        ("Secondary pollutant", "A pollutant formed when a primary pollutant is transformed in the presence of sunlight, water, oxygen, or other compounds."),
        ("Particulate matter", "Solid or liquid particles suspended in air."),
        ("Volatile organic compound", "An organic compound that evaporates at typical atmospheric temperatures and can contribute to ozone formation."),
    ],
    "9": [
        ("Global warming", "The long-term rise in Earth's average temperature associated with increasing atmospheric greenhouse gas concentrations."),
        ("Greenhouse effect", "The warming that occurs when greenhouse gases absorb and re-emit outgoing infrared radiation in the atmosphere."),
        ("Carbon dioxide concentration", "The guide reports atmospheric carbon dioxide rising from about 280 ppm before industrialization to about 400 ppm in 2016."),
        ("Methane concentration", "The guide reports atmospheric methane rising from about 715 ppb before industrialization to about 1,840 ppb in 2016."),
        ("Nitrous oxide concentration", "The guide reports atmospheric nitrous oxide rising from about 270 ppb before industrialization to about 328 ppb in 2016."),
        ("Carbon sequestration", "The capture and long-term storage of carbon as a technological approach to reducing climate change."),
        ("Climate mitigation", "Actions that limit climate change by reducing greenhouse gas emissions or increasing carbon storage."),
    ],
}


def clean(value):
    value = str(value or "").replace("—", "-").replace("–", "-")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def strip_marker(value):
    return clean(re.sub(r"^(?:[●○■▪•]|o)\s*", "", value)).strip(" :-")


def visual_lines(page):
    words = page.extract_words(extra_attrs=["fontname", "size"], use_text_flow=False)
    groups = []
    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        group = next((item for item in reversed(groups[-5:]) if abs(item["top"] - word["top"]) <= 2), None)
        if group is None:
            group = {"top": word["top"], "words": []}
            groups.append(group)
        group["words"].append(word)

    lines = []
    for group in groups:
        ordered = sorted(group["words"], key=lambda item: item["x0"])
        full_text = clean(" ".join(item["text"] for item in ordered))
        if not full_text:
            continue
        letter_words = [item for item in ordered if re.search(r"[A-Za-z]", item["text"])]
        bold_flags = ["Bold" in item.get("fontname", "") for item in letter_words]
        all_bold = bool(letter_words) and sum(bold_flags) / len(bold_flags) >= 0.75
        prefix_words = []
        started = False
        for item in ordered:
            has_letters = bool(re.search(r"[A-Za-z]", item["text"]))
            is_bold = "Bold" in item.get("fontname", "")
            if not started and not has_letters:
                continue
            if has_letters and is_bold:
                started = True
                prefix_words.append(item["text"])
            elif started:
                break
        prefix = strip_marker(" ".join(prefix_words))
        definition = ""
        if prefix and not all_bold:
            marker = full_text.find(prefix)
            if marker >= 0:
                definition = clean(full_text[marker + len(prefix):]).lstrip(" :-")
        lines.append({
            "text": full_text,
            "term": strip_marker(full_text) if all_bold else prefix,
            "definition": definition,
            "bold": all_bold or bool(prefix),
        })
    return lines


def parse(pdf_path):
    units = {key: [] for key in UNIT_NAMES}
    current_unit = None
    current = None

    def flush():
        nonlocal current
        if not current_unit or not current:
            current = None
            return
        term = clean(current["term"]).rstrip(":")
        definition = clean(" ".join(current["parts"]))
        normalized = term.casefold()
        if (term and definition and len(term) >= 3 and len(definition) >= 12 and normalized not in SKIP_TERMS
                and not re.match(r"^(?:unit|ap environmental science study guide)", normalized)
                and not re.match(r"^(?:types?|ways?|factors?|problems?|effects?)\s+(?:of|to|that)\b", normalized)):
            if len(definition) > 720:
                definition = definition[:720].rsplit(" ", 1)[0].rstrip(" ,;:") + "."
            units[current_unit].append({"term": term, "definition": definition, "page": current["page"]})
        current = None

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            for line in visual_lines(page):
                unit_match = re.search(r"Unit\s+(1-2|3|4|5|6|7-8|9)\s*:", line["text"], re.I)
                if unit_match:
                    flush()
                    current_unit = unit_match.group(1)
                    continue
                if not current_unit:
                    continue
                if line["bold"] and line["term"]:
                    flush()
                    current = {"term": line["term"], "parts": [], "page": page_number}
                    if line["definition"]:
                        current["parts"].append(line["definition"])
                elif current:
                    content = strip_marker(line["text"])
                    if content:
                        current["parts"].append(content)
        flush()
    return units


def build_decks(units):
    decks = []
    for unit_key, unit_name in UNIT_NAMES.items():
        cards = []
        seen = set()
        source_cards = units[unit_key]
        source_cards.extend({"term": term, "definition": definition, "page": None} for term, definition in MANUAL_CARDS.get(unit_key, []))
        for item in source_cards:
            item["term"] = TERM_REPAIRS.get((unit_key, item["term"]), item["term"])
            if unit_key == "3" and item["term"] == "Rule of 70":
                item["definition"] = re.sub(r"^70\s*-?\s*", "", item["definition"]).strip()
            normalized = item["term"].casefold()
            if normalized in seen:
                continue
            seen.add(normalized)
            item["definition"] = BACK_OVERRIDES.get(normalized, re.sub(r"^=\s*", "", item["definition"]).strip())
            cards.append({
                "id": f"apes-u{unit_key.replace('-', '')}-c{len(cards) + 1}",
                "front": item["term"],
                "back": item["definition"],
                "sourcePage": item["page"],
            })
        deck_id = f"apes-unit-{unit_key.replace('-', '')}"
        decks.append({
            "id": deck_id,
            "name": f"AP Environmental Science - Unit {unit_key}",
            "shortName": f"Unit {unit_key}: {unit_name}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": cards,
            "questions": [],
            "feynmanPrompts": [
                {"id": f"{deck_id}-f{index + 1}", "prompt": prompt}
                for index, prompt in enumerate(FEYNMAN_TOPICS[unit_key])
            ],
        })
    return decks


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: generate-apes-data.py SOURCE_PDF OUTPUT_JS")
    source, output = map(pathlib.Path, sys.argv[1:])
    decks = build_decks(parse(source))
    payload = "window.AP_ENVIRONMENTAL_SCIENCE_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n"
    output.write_text(payload)
    print(f"Wrote {sum(len(deck['cards']) for deck in decks)} cards and {sum(len(deck['feynmanPrompts']) for deck in decks)} Feynman topics across {len(decks)} source sections")
    for deck in decks:
        print(f"  {deck['shortName']}: {len(deck['cards'])} cards, {len(deck['feynmanPrompts'])} topics")


if __name__ == "__main__":
    main()
