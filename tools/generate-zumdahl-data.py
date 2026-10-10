#!/usr/bin/env python3
"""Build source-aligned Study Desk data from Zumdahl Chemistry 7e."""

import json
import re
import sys
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


SOURCE = Path("/Users/kaichenguo/Downloads/Zumdahl_Text.pdf")
OUTPUT = Path(__file__).resolve().parents[1] / "dist" / "zumdahl-data.js"

UNITS = [
    ("Foundations and Chemical Reactions", range(1, 5)),
    ("Gases, Energy, and Atomic Structure", range(5, 10)),
    ("States of Matter, Solutions, and Kinetics", range(10, 13)),
    ("Equilibrium, Thermodynamics, and Electrochemistry", range(13, 18)),
    ("Nuclear, Inorganic, and Organic Chemistry", range(18, 23)),
]

EQUATIONS = {
    1: [("Density", "d = m/V", "Use it to relate a sample's mass and volume."), ("Kelvin conversion", "K = °C + 273.15", "Use it to convert Celsius temperature to the absolute temperature scale.")],
    3: [("Amount from mass", "n = m/M", "Use it to convert a sample mass to moles using molar mass."), ("Percent composition", "% element = (mass of element / mass of compound) × 100", "Use it to determine a compound's elemental mass percentages."), ("Percent yield", "% yield = (actual yield / theoretical yield) × 100", "Use it to compare experimental product with the stoichiometric maximum.")],
    4: [("Molarity", "M = moles of solute / liters of solution", "Use it to express solution concentration."), ("Dilution relation", "M₁V₁ = M₂V₂", "Use it when solvent is added without changing moles of solute.")],
    5: [("Boyle's law", "P₁V₁ = P₂V₂", "Use it for pressure-volume changes at constant temperature and amount."), ("Charles's law", "V₁/T₁ = V₂/T₂", "Use it for volume-temperature changes at constant pressure and amount."), ("Combined gas law", "P₁V₁/T₁ = P₂V₂/T₂", "Use it when pressure, volume, and temperature all change for a fixed gas sample."), ("Ideal gas law", "PV = nRT", "Use it to connect gas pressure, volume, amount, and absolute temperature."), ("Dalton's law", "Ptotal = ΣPi", "Use it to find total pressure from component partial pressures."), ("Graham's law", "rate₁/rate₂ = √(M₂/M₁)", "Use it to compare effusion rates of gases with different molar masses."), ("van der Waals equation", "[P + a(n/V)²](V - nb) = nRT", "Use it to model real gases by correcting for attractions and molecular volume.")],
    6: [("First Law", "ΔE = q + w", "Use it to account for heat and work contributions to internal-energy change."), ("Pressure-volume work", "w = -PΔV", "Use it for expansion or compression against constant external pressure."), ("Calorimetry", "q = mcΔT", "Use it to calculate heat from mass, specific heat, and temperature change."), ("Hess's law", "ΔHoverall = ΣΔHsteps", "Use it to combine known reactions to obtain an unknown enthalpy change."), ("Formation-enthalpy relation", "ΔH°rxn = ΣnΔH°f(products) - ΣnΔH°f(reactants)", "Use it to calculate reaction enthalpy from standard formation enthalpies.")],
    7: [("Wave relation", "c = λν", "Use it to connect wavelength and frequency of electromagnetic radiation."), ("Photon energy", "E = hν", "Use it to calculate the energy of one photon."), ("de Broglie relation", "λ = h/(mv)", "Use it to determine the wavelength associated with a moving particle."), ("Hydrogen energy levels", "En = -2.178 × 10⁻¹⁸ J / n²", "Use it to calculate allowed electron energies in hydrogen."), ("Rydberg transition", "ΔE = -2.178 × 10⁻¹⁸ J(1/nf² - 1/ni²)", "Use it to calculate the energy change for a hydrogen electron transition.")],
    8: [("Formal charge", "formal charge = valence e⁻ - lone-pair e⁻ - ½(bonding e⁻)", "Use it to compare plausible Lewis structures."), ("Bond-enthalpy estimate", "ΔHrxn ≈ ΣD(bonds broken) - ΣD(bonds formed)", "Use it to estimate reaction enthalpy from average bond energies.")],
    9: [("Molecular-orbital bond order", "bond order = ½(bonding e⁻ - antibonding e⁻)", "Use it to predict relative bond stability and strength in the MO model.")],
    10: [("Clausius-Clapeyron equation", "ln(P₂/P₁) = -(ΔHvap/R)(1/T₂ - 1/T₁)", "Use it to relate vapor pressure at two temperatures."), ("Bragg equation", "nλ = 2d sin θ", "Use it to determine crystal-plane spacing from X-ray diffraction.")],
    11: [("Mole fraction", "χi = ni/ntotal", "Use it to express a component's fraction of total moles."), ("Raoult's law", "Pi = χiP°i", "Use it to calculate a volatile component's partial pressure in an ideal solution."), ("Boiling-point elevation", "ΔTb = Kb m", "Use it to calculate boiling-point change from solute molality."), ("Freezing-point depression", "ΔTf = Kf m", "Use it to calculate freezing-point change from solute molality."), ("Osmotic pressure", "Π = MRT", "Use it to connect osmotic pressure with dilute-solution concentration and temperature.")],
    12: [("Differential rate law", "rate = k[A]ᵐ[B]ⁿ", "Use it to relate reaction rate to reactant concentrations."), ("First-order integrated rate law", "ln[A]t = -kt + ln[A]₀", "Use it to find concentration or time for a first-order reaction."), ("First-order half-life", "t½ = 0.693/k", "Use it to find the concentration-independent half-life of a first-order process."), ("Second-order integrated rate law", "1/[A]t = kt + 1/[A]₀", "Use it for a second-order reaction in one reactant."), ("Arrhenius equation", "ln k = -Ea/(RT) + ln A", "Use it to describe how the rate constant depends on temperature.")],
    13: [("Concentration equilibrium constant", "Kc = product concentrations / reactant concentrations", "Use it to describe an equilibrium mixture using molar concentrations and stoichiometric powers."), ("Pressure equilibrium constant", "Kp = product partial pressures / reactant partial pressures", "Use it for gas-phase equilibria expressed with partial pressures."), ("Reaction quotient", "Q = current product terms / current reactant terms", "Use it to predict which direction a nonequilibrium mixture will shift.")],
    14: [("pH", "pH = -log[H⁺]", "Use it to express hydrogen-ion concentration on a logarithmic scale."), ("pOH", "pOH = -log[OH⁻]", "Use it to express hydroxide-ion concentration on a logarithmic scale."), ("Water ion product", "Kw = [H⁺][OH⁻]", "Use it to connect hydrogen- and hydroxide-ion concentrations."), ("Acid dissociation constant", "Ka = [H⁺][A⁻]/[HA]", "Use it to quantify weak-acid ionization."), ("Base dissociation constant", "Kb = [BH⁺][OH⁻]/[B]", "Use it to quantify weak-base ionization."), ("Conjugate relation", "KaKb = Kw", "Use it to connect the strengths of a conjugate acid-base pair.")],
    15: [("Henderson-Hasselbalch equation", "pH = pKa + log([A⁻]/[HA])", "Use it to estimate the pH of a buffer."), ("Solubility product", "Ksp = product of dissolved-ion concentrations", "Use it to describe equilibrium between a sparingly soluble solid and its ions."), ("Formation constant", "Kf = [complex ion] / reactant concentration terms", "Use it to quantify complex-ion formation.")],
    16: [("Entropy change of the universe", "ΔSuniv = ΔSsystem + ΔSsurroundings", "Use it to test spontaneity: a spontaneous process has positive ΔSuniv."), ("Gibbs free energy", "ΔG = ΔH - TΔS", "Use it to predict spontaneity at constant temperature and pressure."), ("Standard free energy and equilibrium", "ΔG° = -RT ln K", "Use it to connect thermodynamic favorability with the equilibrium constant."), ("Nonstandard free energy", "ΔG = ΔG° + RT ln Q", "Use it to determine reaction direction away from standard conditions.")],
    17: [("Standard cell potential", "E°cell = E°cathode - E°anode", "Use it to calculate voltage from standard reduction potentials."), ("Electrical work and free energy", "ΔG = -nFE", "Use it to connect cell potential with reaction free-energy change."), ("Nernst equation", "E = E° - (RT/nF)ln Q", "Use it to calculate cell potential under nonstandard conditions."), ("Electrolysis charge relation", "charge = current × time", "Use it to determine charge passed during electrolysis.")],
    18: [("Radioactive decay law", "ln(Nt/N₀) = -kt", "Use it to calculate the amount of a radioactive nuclide remaining."), ("Radioactive half-life", "t½ = 0.693/k", "Use it to relate a first-order decay constant to half-life."), ("Mass-energy equivalence", "ΔE = Δmc²", "Use it to convert nuclear mass defect into binding energy.")],
}

SUPPLEMENTAL_VOCABULARY = {
    9: [
        ["hybrid orbital", "An orbital formed by mixing atomic orbitals on the same atom to describe localized bonding."],
        ["sp hybridization", "Mixing one s and one p orbital to produce two linear hybrid orbitals."],
        ["sp2 hybridization", "Mixing one s and two p orbitals to produce three trigonal-planar hybrid orbitals."],
        ["sp3 hybridization", "Mixing one s and three p orbitals to produce four tetrahedrally directed hybrid orbitals."],
        ["sigma bond", "A bond formed by head-on orbital overlap with electron density along the internuclear axis."],
        ["pi bond", "A bond formed by side-by-side p-orbital overlap with electron density above and below the internuclear axis."],
        ["bonding molecular orbital", "A molecular orbital lower in energy than its parent atomic orbitals and concentrated between nuclei."],
        ["antibonding molecular orbital", "A molecular orbital higher in energy than its parent orbitals and containing a node between nuclei."],
        ["paramagnetism", "Attraction to a magnetic field caused by one or more unpaired electrons."],
        ["diamagnetism", "Weak repulsion from a magnetic field when all electrons are paired."],
    ],
    13: [
        ["dynamic equilibrium", "A state in which forward and reverse reactions continue at equal rates, leaving concentrations constant."],
        ["equilibrium position", "The particular relative amounts of reactants and products present at equilibrium."],
        ["law of mass action", "The rule used to construct an equilibrium expression from the balanced reaction coefficients."],
        ["homogeneous equilibrium", "An equilibrium in which all reacting species occupy the same phase."],
        ["heterogeneous equilibrium", "An equilibrium involving species in more than one phase."],
        ["reaction quotient", "An expression with the form of the equilibrium constant evaluated using current, not necessarily equilibrium, amounts."],
        ["ICE table", "An organizational table that tracks initial, change, and equilibrium concentrations during an equilibrium calculation."],
        ["Le Chatelier's principle", "A system at equilibrium shifts in the direction that partially counteracts an imposed change."],
    ],
    15: [
        ["common-ion effect", "Suppression of a weak electrolyte's ionization when a strong electrolyte supplies an ion the two share."],
        ["buffered solution", "A solution that resists pH change because it contains a weak acid-base pair in appreciable amounts."],
        ["buffering capacity", "The amount of added acid or base a buffer can absorb before its pH changes substantially."],
        ["acid-base titration", "A controlled neutralization used to determine an unknown acid or base amount from a standard solution."],
        ["equivalence point", "The titration point at which stoichiometrically equivalent amounts of acid and base have reacted."],
        ["acid-base indicator", "A weak acid or base whose differently colored forms signal a pH range near a titration end point."],
        ["solubility product constant", "The equilibrium constant for dissolution of a sparingly soluble ionic solid."],
        ["molar solubility", "The number of moles of a solid that dissolve per liter of saturated solution."],
        ["selective precipitation", "Separation of ions by choosing conditions under which one precipitates before another."],
        ["qualitative analysis", "Identification of ions through a planned sequence of selective chemical reactions."],
        ["complex ion", "A charged species consisting of a central metal ion bonded to surrounding ligands."],
        ["ligand", "A Lewis base that donates an electron pair to a metal ion to form a coordinate bond."],
        ["formation constant", "The equilibrium constant for formation of a complex ion from a metal ion and its ligands."],
    ],
    16: [
        ["spontaneous process", "A process that can proceed without continuous external intervention under the stated conditions."],
        ["entropy", "A thermodynamic state function related to energy dispersal and the number of accessible arrangements."],
        ["microstate", "One specific microscopic arrangement consistent with a system's macroscopic state."],
        ["Second Law of Thermodynamics", "A spontaneous process increases the entropy of the universe."],
        ["Third Law of Thermodynamics", "A perfect crystal at absolute zero has zero entropy."],
        ["Gibbs free energy", "A state function that predicts spontaneity at constant temperature and pressure."],
        ["standard free energy change", "The free-energy change when reactants and products occupy their standard states."],
        ["reversible process", "An ideal process that can be reversed by an infinitesimal change while restoring system and surroundings."],
        ["positional probability", "The number of arrangements available to particles among the positions in a system."],
    ],
    19: [
        ["representative element", "A main-group element whose chemical behavior reflects filling of s or p valence orbitals."],
        ["alkali metal", "A Group 1A metal characterized by one valence electron and formation of +1 ions."],
        ["alkaline earth metal", "A Group 2A metal characterized by two valence electrons and formation of +2 ions."],
        ["hydride", "A binary compound containing hydrogen bonded to a less electronegative element."],
        ["allotrope", "One of two or more different structural forms of the same element in the same physical state."],
        ["inert-pair effect", "The increasing tendency of the outermost s-electron pair in heavier p-block elements to remain nonbonding."],
        ["network covalent solid", "A solid in which atoms are connected throughout an extended covalent-bond framework."],
        ["silicate", "A compound built from silicon-oxygen structural units, commonly based on SiO4 tetrahedra."],
        ["metalloid", "An element with properties intermediate between typical metals and nonmetals."],
    ],
}

FALLBACK_SECTIONS = {
    15: [
        "Solutions of Acids or Bases Containing a Common Ion",
        "Buffered Solutions",
        "Buffering Capacity",
        "Titrations and pH Curves",
        "Acid-Base Indicators",
        "Solubility Equilibria and the Solubility Product",
        "Precipitation and Qualitative Analysis",
        "Equilibria Involving Complex Ions",
    ]
}


def title_text(item):
    value = str(item.get("/Title", "")).replace("\n", " ")
    return re.sub(r"\.([a-z])", r"fi\1", value)


def outline_chapters(reader):
    chapters = {}
    current = None

    def walk(items, depth=0):
        nonlocal current
        for item in items:
            if isinstance(item, list):
                walk(item, depth + 1)
                continue
            title = title_text(item)
            chapter_match = re.match(r"^(\d{1,2})\s+(.+)$", title)
            section_match = re.match(r"^(\d{1,2})\.(\d+)\s+(.+)$", title)
            if depth == 0 and chapter_match and 1 <= int(chapter_match.group(1)) <= 22:
                number = int(chapter_match.group(1))
                current = number
                chapters[number] = {"number": number, "title": chapter_match.group(2), "sections": []}
            elif depth == 1 and current and section_match and int(section_match.group(1)) == current:
                chapters[current]["sections"].append({"title": section_match.group(3), "topics": []})

    walk(reader.outline)
    return chapters


def join_tokens(tokens):
    output = ""
    previous = None
    for word in tokens:
        text = word["text"]
        if not output:
            output = text
        elif abs(word["top"] - previous["top"]) < 2:
            gap = word["x0"] - previous["x1"]
            output += ("" if gap < 0.8 or output.endswith(("-", "–")) else " ") + text
        else:
            output += ("" if output.endswith("-") else " ") + text
        previous = word
    return re.sub(r"\s+", " ", output).strip()


def clean_definition(value):
    value = re.sub(r"\s*\([^()]*\d[^()]*\)\s*$", "", value)
    value = re.sub(r"\(cid:\d+\)", "", value)
    value = re.sub(r"([a-z])-([a-z])", r"\1\2", value)
    value = re.sub(r"\s+([,.;:])", r"\1", value)
    value = re.sub(r"\s+", " ", value).strip(" /;")
    if value:
        value = value[0].upper() + value[1:]
    return value


def clean_term(value):
    replacements = {
        "-Amino acid": "α-Amino acid",
        "Alpha ( ) particle": "Alpha (α) particle",
        "Beta ( ) particle": "Beta (β) particle",
        "Gamma ( ) ray": "Gamma (γ) ray",
        "Pi ( ) bond": "Pi (π) bond",
        "Sigma ( ) bond": "Sigma (σ) bond",
        "d-Orbital splitting": "d-orbital splitting",
    }
    return replacements.get(value, value)


def term_key(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())


def glossary_entries():
    entries = []
    with pdfplumber.open(SOURCE) as pdf:
        for page_number in range(1108, 1120):
            page = pdf.pages[page_number - 1]
            # The glossary alternates its inner/outer margins on facing pages.
            # Cropping at one fixed gutter can slice a term (for example,
            # "Chemical" became "ical"). Assign complete words to the two
            # columns by their centres instead, using the page-specific gutter.
            gutter = 320 if page_number % 2 == 0 else 293
            page_words = page.extract_words(extra_attrs=["fontname", "size"])
            for column in (0, 1):
                words = [
                    word for word in page_words
                    if 90 <= word["top"] <= 725
                    and ((word["x0"] + word["x1"]) / 2 < gutter) == (column == 0)
                ]
                words.sort(key=lambda word: (round(word["top"], 1), word["x0"]))
                term_words, definition_words = [], []

                def flush():
                    if not term_words or not definition_words:
                        return
                    term = clean_term(join_tokens(term_words).strip(" ,.;:"))
                    raw_definition = join_tokens(definition_words)
                    references = re.findall(r"\(([^()]*(?:\d)[^()]*)\)\s*$", raw_definition)
                    if not references or "(cid:" in raw_definition:
                        return
                    chapters = sorted({int(number) for number in re.findall(r"(?<!\d)(\d{1,2})(?:\.\d+)?", references[-1]) if 1 <= int(number) <= 22})
                    definition = clean_definition(raw_definition)
                    if term == "E mc":
                        return
                    if 2 < len(term) < 100 and 12 < len(definition) < 280 and chapters:
                        entries.append((term, definition, chapters))

                for word in words:
                    is_term = "Bold" in word["fontname"] and 7.5 <= word["size"] <= 10
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
    vocabulary = {number: [] for number in chapters}
    seen = {number: set() for number in chapters}
    for term, definition, references in glossary_entries():
        for chapter_number in references:
            key = term_key(term)
            if chapter_number in vocabulary and key not in seen[chapter_number]:
                vocabulary[chapter_number].append([term, definition])
                seen[chapter_number].add(key)

    for number, chapter in chapters.items():
        if not chapter["sections"] and number in FALLBACK_SECTIONS:
            chapter["sections"] = [{"title": title, "topics": []} for title in FALLBACK_SECTIONS[number]]
        for term, definition in SUPPLEMENTAL_VOCABULARY.get(number, []):
            if term_key(term) not in seen[number]:
                vocabulary[number].append([term, definition])
                seen[number].add(term_key(term))
        chapter["focusAreas"] = [section["title"] for section in chapter["sections"]]
        chapter["vocabulary"] = vocabulary[number]
        chapter["equations"] = EQUATIONS.get(number, [])

    data = {
        "sourceTitle": "Chemistry, Seventh Edition",
        "authors": "Steven S. Zumdahl and Susan A. Zumdahl",
        "units": [
            {"title": unit_title, "chapters": [chapters[number] for number in chapter_numbers]}
            for unit_title, chapter_numbers in UNITS
        ],
    }
    OUTPUT.write_text("window.ZUMDAHL_COURSE_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} with {sum(len(chapter['vocabulary']) for chapter in chapters.values())} chapter-term placements")


if __name__ == "__main__":
    if not SOURCE.exists():
        sys.exit(f"Missing source PDF: {SOURCE}")
    build()
