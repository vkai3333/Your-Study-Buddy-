#!/usr/bin/env python3
"""Generate the built-in AP Chemistry deck and formula SVGs."""

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "apchem-data.js"
IMAGE_DIR = ROOT / "dist" / "ap-chemistry-images"


def rows(block):
    return [tuple(part.strip() for part in line.split("|", 1)) for line in block.strip().splitlines() if line.strip()]


UNITS = [
    ("Atomic Structure and Properties", rows(r"""
atom|The smallest unit of an element that retains the element's chemical identity.
proton|A positively charged subatomic particle in the nucleus; its number determines the element.
neutron|An electrically neutral subatomic particle in the nucleus that contributes to atomic mass.
electron|A negatively charged subatomic particle found in quantized energy levels outside the nucleus.
atomic number|The number of protons in an atom's nucleus.
mass number|The total number of protons and neutrons in one isotope.
isotope|An atom of an element with the same number of protons but a different number of neutrons.
average atomic mass|The weighted mean of an element's naturally occurring isotope masses.
mole|An amount containing exactly 6.02214076 × 10²³ representative particles.
Avogadro's number|The number of representative particles in one mole: 6.02214076 × 10²³ mol⁻¹.
molar mass|The mass in grams of one mole of a substance.
mass spectrum|A plot of ion abundance versus mass-to-charge ratio used to identify isotopes or molecular fragments.
electromagnetic radiation|Energy that travels through space as oscillating electric and magnetic fields.
photon|A quantum of electromagnetic radiation with energy E = hν.
ground state|The lowest-energy electron configuration of an atom or ion.
excited state|A state in which one or more electrons occupy higher-energy levels than in the ground state.
orbital|A mathematical description of a region in which an electron has a high probability of being found.
electron configuration|A notation showing how electrons are distributed among an atom's orbitals.
Aufbau principle|Electrons occupy the lowest-energy available orbitals before higher-energy orbitals.
Pauli exclusion principle|No two electrons in an atom can have the same set of four quantum numbers; an orbital holds at most two electrons with opposite spins.
Hund's rule|Electrons occupy equal-energy orbitals singly with parallel spins before pairing.
valence electrons|Electrons in an atom's highest occupied principal energy level that participate most directly in bonding.
core electrons|Inner-shell electrons that generally do not participate directly in bonding.
photoelectron spectroscopy|A technique that measures electron binding energies by ejecting electrons with photons.
Coulomb's law|The electrostatic attraction or repulsion between charges increases with charge magnitude and decreases with the square of separation.
effective nuclear charge|The net positive charge experienced by a valence electron after shielding by other electrons.
shielding|Reduction of nuclear attraction for outer electrons caused by repulsion from inner electrons.
atomic radius|A measure of atomic size that generally decreases across a period and increases down a group.
ionization energy|The energy required to remove an electron from a gaseous atom or ion.
electron affinity|The energy change when a gaseous atom gains an electron.
ionic radius|The size of an ion; cations are usually smaller and anions larger than their neutral atoms.
periodic law|Element properties recur periodically when elements are arranged by atomic number.
"""), ["Atomic structure and isotope abundance", "Electron configurations and periodic trends", "Photoelectron spectroscopy and electron binding energy"]),
    ("Compound Structure and Properties", rows(r"""
chemical bond|An electrostatic attraction that holds atoms or ions together.
ionic bond|Electrostatic attraction between oppositely charged ions.
covalent bond|A bond formed when atoms share one or more pairs of electrons.
metallic bonding|Attraction between metal cations and a mobile sea of delocalized valence electrons.
electronegativity|An atom's ability to attract shared electrons in a bond.
bond polarity|Unequal sharing of bonding electrons caused by an electronegativity difference.
dipole moment|A measure of charge separation in a bond or molecule.
Lewis diagram|A representation of valence electrons, bonds, and lone pairs in a molecule or ion.
octet rule|The tendency of many main-group atoms to form bonds that give them eight valence electrons.
formal charge|The charge assigned to an atom in a Lewis structure by dividing bonding electrons equally.
resonance|Use of two or more valid Lewis structures to represent electron delocalization in one species.
bond order|The number of shared electron pairs between two atoms; higher bond order generally means a shorter, stronger bond.
bond length|The equilibrium distance between bonded nuclei.
bond energy|The energy required to break one mole of a specified gaseous bond.
VSEPR theory|A model predicting molecular geometry by minimizing repulsions among electron domains around a central atom.
electron-domain geometry|The arrangement of all bonding regions and lone pairs around a central atom.
molecular geometry|The three-dimensional arrangement of atoms in a molecule, excluding lone pairs from the named shape.
linear geometry|A two-domain arrangement with a 180° bond angle.
trigonal planar geometry|A three-domain arrangement with approximately 120° bond angles.
tetrahedral geometry|A four-domain arrangement with approximately 109.5° bond angles.
trigonal bipyramidal geometry|A five-domain arrangement with equatorial and axial positions.
octahedral geometry|A six-domain arrangement with 90° angles.
hybridization|A bonding model that combines atomic orbitals into equivalent hybrid orbitals.
sigma bond|A bond formed by head-on orbital overlap along the internuclear axis.
pi bond|A bond formed by sideways overlap of parallel orbitals above and below the internuclear axis.
molecular polarity|Net charge separation determined by both bond polarities and molecular geometry.
lattice energy|The energy associated with separating an ionic solid into gaseous ions; its magnitude grows with ionic charge and decreases with ion size.
alloy|A metallic material containing more than one element.
"""), ["Lewis structures, formal charge, and resonance", "VSEPR geometry and molecular polarity", "Ionic, covalent, and metallic bonding"]),
    ("Properties of Substances and Mixtures", rows(r"""
intermolecular force|An attraction between separate particles that influences physical properties.
London dispersion force|An attraction caused by instantaneous and induced dipoles; it occurs in all particles.
dipole-dipole force|An attraction between permanent partial charges of polar molecules.
hydrogen bonding|A strong dipole-dipole attraction involving H bonded to N, O, or F and a lone pair on N, O, or F.
ion-dipole force|An attraction between an ion and the partial charges of a polar molecule.
polarizability|The ease with which a particle's electron cloud can be distorted.
vapor pressure|The pressure exerted by a vapor in dynamic equilibrium with its liquid or solid.
boiling point|The temperature at which a liquid's vapor pressure equals the external pressure.
surface tension|The energy required to increase a liquid's surface area, arising from cohesive forces.
viscosity|A fluid's resistance to flow.
crystalline solid|A solid whose particles occupy a repeating, ordered structure.
amorphous solid|A solid lacking long-range repeating order.
unit cell|The smallest repeating structural unit of a crystal lattice.
solution|A homogeneous mixture of solute particles dispersed in a solvent.
solute|The component of a solution present in the smaller amount or dissolved by the solvent.
solvent|The component that forms the medium in which a solute is dispersed.
molarity|Moles of solute per liter of solution.
dilution|Lowering a solution's concentration by adding solvent while conserving moles of solute.
electrolyte|A substance that produces mobile ions when dissolved or molten and therefore conducts electricity.
strong electrolyte|A soluble ionic compound or strong acid/base that forms ions essentially completely in solution.
solubility|The maximum amount of solute that dissolves under specified conditions.
like dissolves like|A guideline that substances dissolve best in solvents with similar intermolecular-force characteristics.
chromatography|A separation technique based on differing attractions for stationary and mobile phases.
Beer-Lambert law|The linear relationship A = εbc connecting absorbance, concentration, path length, and molar absorptivity.
ideal gas|A model gas with negligible particle volume and no intermolecular attractions.
kinetic molecular theory|A model relating gas pressure and temperature to constant random particle motion and elastic collisions.
partial pressure|The pressure a component gas would exert alone in the same volume and temperature.
mole fraction|The fraction of all gas particles belonging to one component.
deviation from ideal behavior|Behavior caused mainly by intermolecular attractions at low temperature or finite molecular volume at high pressure.
"""), ["Intermolecular forces and physical properties", "Solutions, solubility, and separation", "Gas behavior and kinetic molecular theory"]),
    ("Chemical Reactions", rows(r"""
chemical equation|A symbolic representation of reactants, products, physical states, and stoichiometric relationships.
balanced equation|An equation with equal numbers of each type of atom and equal net charge on both sides.
net ionic equation|An equation showing only species that undergo chemical change in aqueous solution.
spectator ion|An ion present in solution that does not participate in the net chemical change.
precipitation reaction|A reaction in which dissolved ions form an insoluble solid.
acid-base reaction|A reaction involving proton transfer or neutralization.
oxidation-reduction reaction|A reaction involving electron transfer and changes in oxidation number.
oxidation|Loss of electrons or an increase in oxidation number.
reduction|Gain of electrons or a decrease in oxidation number.
oxidizing agent|A reactant that accepts electrons and is reduced.
reducing agent|A reactant that donates electrons and is oxidized.
oxidation number|A bookkeeping charge assigned using agreed rules to track electron transfer.
stoichiometry|Quantitative relationships among reactants and products based on a balanced equation.
limiting reactant|The reactant consumed first, thereby limiting the maximum amount of product.
excess reactant|A reactant remaining after the limiting reactant is consumed.
theoretical yield|The maximum product predicted from stoichiometry and the limiting reactant.
actual yield|The amount of product actually obtained experimentally.
percent yield|Actual yield divided by theoretical yield, multiplied by 100%.
titration|A quantitative procedure in which a solution of known concentration reacts with an analyte to determine its amount.
equivalence point|The point at which titrant and analyte have reacted in the exact stoichiometric ratio.
endpoint|The observed signal used to approximate a titration's equivalence point.
gravimetric analysis|Quantitative analysis based on measuring mass, often after forming and isolating a precipitate.
combustion analysis|Determination of elemental composition by measuring combustion products such as CO₂ and H₂O.
"""), ["Writing net ionic equations", "Stoichiometry and limiting reactants", "Redox reactions and oxidation numbers"]),
    ("Kinetics", rows(r"""
reaction rate|The change in concentration of a reactant or product per unit time.
rate law|An experimentally determined equation relating reaction rate to reactant concentrations.
rate constant|The proportionality constant k in a rate law; its value depends on temperature and the reaction.
reaction order|An exponent in a rate law describing how rate responds to a reactant's concentration.
overall reaction order|The sum of the concentration exponents in a rate law.
initial-rates method|A method for determining reaction orders by comparing rates from experiments with different initial concentrations.
integrated rate law|An equation relating reactant concentration to time for a specified reaction order.
half-life|The time required for a reactant concentration to decrease to half its value.
elementary reaction|A single molecular event whose stoichiometry can determine its rate law.
reaction mechanism|A sequence of elementary reactions whose sum is the overall reaction.
intermediate|A species produced in one mechanism step and consumed in a later step.
rate-determining step|A comparatively slow elementary step that constrains the overall rate.
molecularity|The number of reacting particles involved in an elementary step.
collision model|A model stating that reactions require collisions with sufficient energy and suitable orientation.
activation energy|The minimum energy barrier that reacting particles must overcome.
transition state|A high-energy, unstable arrangement at the top of the reaction-energy barrier.
catalyst|A substance that increases reaction rate by providing a lower-activation-energy pathway and is regenerated.
homogeneous catalyst|A catalyst in the same phase as the reactants.
heterogeneous catalyst|A catalyst in a different phase, often acting at a surface.
Arrhenius equation|An equation relating the rate constant to activation energy and absolute temperature.
"""), ["Rate laws and reaction order", "Reaction mechanisms and rate-determining steps", "Activation energy and catalysis"]),
    ("Thermochemistry", rows(r"""
system|The part of the universe selected for study.
surroundings|Everything outside the system that can exchange energy or matter with it.
endothermic process|A process in which the system absorbs heat from the surroundings.
exothermic process|A process in which the system releases heat to the surroundings.
temperature|A measure proportional to the average kinetic energy of particles.
heat|Energy transferred because of a temperature difference.
thermal equilibrium|The state reached when objects in contact have the same temperature and no net heat flows.
specific heat capacity|The heat required to raise one gram of a substance by one kelvin or degree Celsius.
calorimetry|Measurement of heat transferred during a physical or chemical process.
enthalpy|A state function H whose change at constant pressure equals heat transferred for many chemical processes.
enthalpy of reaction|The enthalpy change associated with a reaction as written.
standard enthalpy of formation|The enthalpy change when one mole of a compound forms from its elements in their standard states.
Hess's law|Because enthalpy is a state function, reaction enthalpies add when equations are added.
bond enthalpy|The average energy required to break one mole of a specified gaseous bond.
state function|A property determined only by the system's current state, not the path taken.
energy conservation|Energy is transferred or transformed but the total energy of the universe remains constant.
coffee-cup calorimeter|A constant-pressure calorimeter commonly used for reactions in solution.
bomb calorimeter|A rigid constant-volume calorimeter commonly used for combustion reactions.
heating curve|A graph of temperature versus added heat showing warming regions and phase-change plateaus.
phase change|A physical transition between solid, liquid, and gas involving energy but no change in chemical identity.
"""), ["Calorimetry and energy transfer", "Reaction enthalpy and Hess's law"]),
    ("Equilibrium", rows(r"""
dynamic equilibrium|A state in which forward and reverse reactions continue at equal rates, keeping concentrations constant.
equilibrium constant|A ratio of product and reactant activities at equilibrium, each raised to its stoichiometric power.
law of mass action|The rule used to construct an equilibrium expression from a balanced reaction.
reaction quotient|A product-to-reactant ratio with the form of K, evaluated at any moment.
homogeneous equilibrium|An equilibrium in which all reactants and products are in the same phase.
heterogeneous equilibrium|An equilibrium involving more than one phase; pure solids and liquids are omitted from K.
Le Châtelier's principle|An equilibrium system shifts in the direction that partially counteracts an imposed disturbance.
equilibrium shift|A change in relative amounts of reactants and products as a system establishes a new equilibrium.
Kc|An equilibrium constant expressed using molar concentrations.
Kp|An equilibrium constant expressed using partial pressures of gases.
solubility product constant|The equilibrium constant Ksp for dissolution of a sparingly soluble ionic solid.
common-ion effect|Suppression of ionization or solubility caused by adding a species already present in the equilibrium.
coupled equilibrium|Two or more equilibria sharing species, so one reaction influences the position of another.
large equilibrium constant|A K much greater than 1 indicates products predominate at equilibrium.
small equilibrium constant|A K much less than 1 indicates reactants predominate at equilibrium.
Q compared with K|If Q < K the reaction proceeds forward; if Q > K it proceeds in reverse until equilibrium is reached.
equilibrium and catalysts|A catalyst accelerates forward and reverse reactions equally, reducing time to equilibrium without changing K.
"""), ["Dynamic equilibrium and equilibrium constants", "Reaction quotient and predicting shifts", "Le Châtelier's principle and coupled equilibria"]),
    ("Acids and Bases", rows(r"""
Arrhenius acid|A substance that increases hydronium concentration in water.
Arrhenius base|A substance that increases hydroxide concentration in water.
Brønsted-Lowry acid|A proton donor.
Brønsted-Lowry base|A proton acceptor.
conjugate acid-base pair|Two species differing by one proton.
amphiprotic species|A species capable of either donating or accepting a proton.
strong acid|An acid that ionizes essentially completely in water.
weak acid|An acid that ionizes only partially in water.
strong base|A base that dissociates or reacts essentially completely to produce hydroxide in water.
weak base|A base that reacts only partially with water to produce its conjugate acid and hydroxide.
acid-ionization constant|The equilibrium constant Ka for a weak acid's reaction with water.
base-ionization constant|The equilibrium constant Kb for a weak base's reaction with water.
water-ionization constant|Kw = [H₃O⁺][OH⁻], equal to 1.0 × 10⁻¹⁴ at 25°C.
pH|The negative base-10 logarithm of hydronium concentration.
pOH|The negative base-10 logarithm of hydroxide concentration.
pKa|The negative base-10 logarithm of Ka; a lower pKa indicates a stronger acid.
percent ionization|The percentage of an initial weak acid or base that ionizes at equilibrium.
buffer|A solution containing a weak acid-base conjugate pair that resists pH change.
buffer capacity|The amount of added acid or base a buffer can absorb before its pH changes substantially.
Henderson-Hasselbalch equation|An equation relating buffer pH to pKa and the conjugate-base-to-acid ratio.
acid-base indicator|A weak acid or base whose conjugate forms have different colors over a pH range.
titration curve|A graph of pH versus titrant volume showing buffer regions and equivalence points.
half-equivalence point|The titration point where conjugate base and weak acid concentrations are equal, so pH = pKa.
polyprotic acid|An acid capable of donating more than one proton in sequential equilibria.
"""), ["Strong and weak acids and bases", "Buffers and the Henderson-Hasselbalch relationship", "Acid-base titration curves"]),
    ("Thermodynamics and Electrochemistry", rows(r"""
entropy|A state function related to energy dispersal and the number of accessible microstates.
second law of thermodynamics|A spontaneous process increases the total entropy of the universe.
Gibbs free energy|A state function that predicts thermodynamic favorability at constant temperature and pressure.
thermodynamically favorable process|A process with ΔG < 0 under the stated conditions.
standard free-energy change|The Gibbs free-energy change when reactants and products are in their standard states.
equilibrium and free energy|At equilibrium ΔG = 0, Q = K, and there is no net driving force.
galvanic cell|An electrochemical cell that uses a thermodynamically favorable redox reaction to produce electrical energy.
electrolytic cell|An electrochemical cell that uses external electrical energy to drive a nonspontaneous reaction.
anode|The electrode where oxidation occurs.
cathode|The electrode where reduction occurs.
salt bridge|An ion-conducting connection that maintains electrical neutrality in electrochemical half-cells.
cell potential|The electrical potential difference between a cell's cathode and anode.
standard reduction potential|The potential for a reduction half-reaction under standard conditions relative to the standard hydrogen electrode.
standard hydrogen electrode|The reference electrode assigned a standard reduction potential of 0.00 V.
Nernst equation|An equation relating cell potential to standard potential, temperature, electron transfer, and reaction quotient.
Faraday's constant|The magnitude of electric charge per mole of electrons, approximately 96,485 C mol⁻¹.
electrolysis|Use of electrical energy to drive a nonspontaneous redox reaction.
electroplating|Electrolytic deposition of a metal coating on an electrode.
charge stoichiometry|Quantitative relation among current, time, charge, moles of electrons, and chemical amount in electrolysis.
concentration cell|A galvanic cell whose potential arises from a concentration difference between otherwise similar half-cells.
"""), ["Entropy, enthalpy, and Gibbs free energy", "Galvanic and electrolytic cells", "Cell potential, the Nernst equation, and electrolysis"]),
]


FORMULAS = {
    1: [("Photon energy", "Use to calculate the energy of a photon from its frequency.", "E = hν"), ("Wave relationship", "Use to relate the wavelength and frequency of electromagnetic radiation.", "c = λν"), ("Coulombic force", "Use qualitatively to compare attraction or repulsion as charge and separation change.", "F ∝ q₁q₂ / r²"), ("Moles from mass", "Use to convert a sample mass to moles using molar mass.", "n = m / M")],
    2: [("Formal charge", "Use to evaluate atoms in Lewis structures and compare resonance contributors.", "FC = valence e⁻ − nonbonding e⁻ − ½(bonding e⁻)"), ("Bond enthalpy estimate", "Use average bond enthalpies to estimate reaction enthalpy.", "ΔHᵣₓₙ ≈ ΣD(bonds broken) − ΣD(bonds formed)")],
    3: [("Ideal gas law", "Use to relate pressure, volume, amount, and absolute temperature for an approximately ideal gas.", "PV = nRT"), ("Combined gas law", "Use for a fixed amount of gas changing pressure, volume, and temperature.", "P₁V₁ / T₁ = P₂V₂ / T₂"), ("Dalton's law", "Use to find the total pressure of a gas mixture.", "Pₜₒₜₐₗ = P₁ + P₂ + ⋯"), ("Partial pressure", "Use mole fraction to find a component's pressure in an ideal-gas mixture.", "Pₐ = XₐPₜₒₜₐₗ"), ("Molarity", "Use to express solution concentration in moles per liter.", "M = nₛₒₗᵤₜₑ / Vₛₒₗᵤₜᵢₒₙ"), ("Dilution equation", "Use when solvent is added and the moles of solute remain constant.", "M₁V₁ = M₂V₂"), ("Beer-Lambert law", "Use absorbance to determine concentration or relate absorbance to path length.", "A = εbc"), ("Density", "Use to relate a sample's mass and volume.", "D = m / V")],
    4: [("Percent yield", "Use to compare the experimentally obtained amount with the stoichiometric maximum.", "% yield = (actual yield / theoretical yield) × 100"), ("Titration stoichiometry", "Use the balanced reaction and moles n = MV to relate titrant and analyte at equivalence.", "n = MV")],
    5: [("Zero-order integrated rate law", "Use when rate is independent of reactant concentration.", "[A]ₜ = [A]₀ − kt"), ("First-order integrated rate law", "Use when a plot of ln[A] versus time is linear.", "ln[A]ₜ = ln[A]₀ − kt"), ("Second-order integrated rate law", "Use when a plot of 1/[A] versus time is linear.", "1/[A]ₜ = 1/[A]₀ + kt"), ("First-order half-life", "Use to find the concentration-independent half-life of a first-order process.", "t₁⁄₂ = 0.693 / k"), ("Arrhenius equation", "Use to relate a rate constant to temperature and activation energy.", "ln(k₂/k₁) = −Eₐ/R(1/T₂ − 1/T₁)")],
    6: [("Calorimetry", "Use to calculate heat from mass, specific heat capacity, and temperature change.", "q = mcΔT"), ("Heat balance", "Use in an isolated calorimeter: heat lost by one part equals heat gained by another.", "qᵣₓₙ + qₛᵤᵣᵣ = 0"), ("Formation enthalpies", "Use tabulated standard formation enthalpies to calculate a standard reaction enthalpy.", "ΔH°ᵣₓₙ = ΣnΔH°f(products) − ΣnΔH°f(reactants)"), ("Hess's law", "Use when target reaction equations can be constructed by adding known equations.", "ΔHₜₐᵣgₑₜ = ΣΔHₛₜₑₚₛ")],
    7: [("Equilibrium constant", "Use equilibrium concentrations for aA + bB ⇌ cC + dD; omit pure solids and liquids.", "Kc = [C]ᶜ[D]ᵈ / ([A]ᵃ[B]ᵇ)"), ("Reaction quotient", "Use current concentrations or pressures to predict the direction of net change by comparing Q with K.", "Q = products / reactants"), ("Solubility product", "Use ion concentrations at equilibrium for a sparingly soluble ionic solid.", "Ksp = [cation]ᵐ[anion]ⁿ")],
    8: [("Water-ionization constant", "Use to relate hydronium and hydroxide concentrations at 25°C.", "Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴"), ("pH", "Use to convert hydronium concentration to pH.", "pH = −log[H₃O⁺]"), ("pOH", "Use to convert hydroxide concentration to pOH.", "pOH = −log[OH⁻]"), ("Acid-ionization constant", "Use for the equilibrium ionization of a weak acid HA.", "Ka = [H₃O⁺][A⁻] / [HA]"), ("Conjugate-pair relationship", "Use to relate Ka and Kb for a conjugate acid-base pair at 25°C.", "KaKb = Kw"), ("Henderson-Hasselbalch equation", "Use to find a buffer's pH from pKa and the conjugate-base-to-acid ratio.", "pH = pKa + log([A⁻]/[HA])"), ("pH-pOH relationship", "Use at 25°C to convert between pH and pOH.", "pH + pOH = 14.00")],
    9: [("Gibbs free energy", "Use to combine enthalpy and entropy to predict favorability at a specified temperature.", "ΔG° = ΔH° − TΔS°"), ("Free energy and equilibrium", "Use to connect the standard free-energy change to the equilibrium constant.", "ΔG° = −RT ln K"), ("Free energy and cell potential", "Use to connect electrochemical potential and reaction free energy.", "ΔG° = −nFE°cell"), ("Standard cell potential", "Use standard reduction potentials to find the voltage of a galvanic cell.", "E°cell = E°cathode − E°anode"), ("Nernst equation", "Use to find cell potential under nonstandard conditions.", "Ecell = E°cell − (RT/nF) ln Q"), ("Electrical charge", "Use current and time to calculate charge transferred during electrolysis.", "q = It"), ("Electrolysis amount", "Use Faraday's constant to convert charge to moles of electrons.", "mol e⁻ = q / F")],
}


def svg_for(title, equation):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330">
<rect width="1200" height="330" rx="30" fill="#f7f7ff"/>
<rect x="2" y="2" width="1196" height="326" rx="28" fill="none" stroke="#5c59dc" stroke-width="4"/>
<text x="600" y="88" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="32" font-weight="700" fill="#5c59dc">{html.escape(title)}</text>
<text x="600" y="212" text-anchor="middle" font-family="STIX Two Math, Cambria Math, Times New Roman, serif" font-size="48" fill="#171b2d">{html.escape(equation)}</text>
</svg>'''


def main():
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    decks = []
    for unit_number, (name, terms, topics) in enumerate(UNITS, 1):
        cards = [{"id": f"apchem-u{unit_number}-c{i}", "front": front, "back": back} for i, (front, back) in enumerate(terms, 1)]
        for i, (front, back, equation) in enumerate(FORMULAS.get(unit_number, []), 1):
            filename = f"unit-{unit_number}-formula-{i}.svg"
            (IMAGE_DIR / filename).write_text(svg_for(front, equation), encoding="utf-8")
            cards.append({"id": f"apchem-u{unit_number}-eq{i}", "front": front, "back": back, "backImage": f"./ap-chemistry-images/{filename}"})
        decks.append({
            "id": f"apchem-unit-{unit_number}", "name": f"AP Chemistry · Unit {unit_number}",
            "shortName": f"Unit {unit_number}: {name}", "builtIn": True,
            "sourceTitle": "AP Chemistry Course and Exam Description, Effective Fall 2024",
            "sourceUrl": "https://apcentral.collegeboard.org/media/pdf/ap-chemistry-course-and-exam-description.pdf",
            "cards": cards, "questions": [],
            "feynmanPrompts": [{"id": f"apchem-u{unit_number}-f{i}", "prompt": topic} for i, topic in enumerate(topics, 1)],
        })
    OUT.write_text("window.AP_CHEMISTRY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Generated {sum(len(d['cards']) for d in decks)} cards, {sum(len(d['feynmanPrompts']) for d in decks)} Feynman topics, and {sum(map(len, FORMULAS.values()))} formula images.")


if __name__ == "__main__":
    main()
