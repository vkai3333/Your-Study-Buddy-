(() => {
  const q = (prompt, answer, distractors, difficulty = "Medium", stimulus = "") => ({
    type: stimulus ? "stimulus_mcq" : "mcq",
    prompt,
    answer,
    options: [answer, ...distractors],
    difficulty,
    ...(stimulus ? { stimulus } : {}),
  });

  const rotate = (items, seed) => {
    const offset = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % items.length;
    return [...items.slice(offset), ...items.slice(0, offset)];
  };

  const banks = {
    moles: [
      q("How many moles are in 18.0 g of H₂O? Use a molar mass of 18.0 g/mol.", "1.00 mol", ["0.500 mol", "18.0 mol", "324 mol"], "Easy"),
      q("How many formula units are present in 0.250 mol of NaCl?", "1.51 × 10²³", ["4.15 × 10⁻²⁵", "6.02 × 10²³", "2.41 × 10²⁴"]),
      q("A sample contains 3.01 × 10²³ CO₂ molecules. What is its mass?", "22.0 g", ["11.0 g", "44.0 g", "88.0 g"], "Hard"),
      q("A 5.00 g sample of an unknown metal contains 9.20 × 10²² atoms. What is the metal’s approximate molar mass?", "32.7 g/mol", ["3.27 g/mol", "54.6 g/mol", "92.3 g/mol"], "Hard"),
    ],
    composition: [
      q("What percent by mass of CaCO₃ is calcium? Use molar masses Ca = 40.1, C = 12.0, and O = 16.0 g/mol.", "40.0%", ["12.0%", "48.0%", "60.0%"]),
      q("A compound is 40.0% C, 6.7% H, and 53.3% O by mass. What is its empirical formula?", "CH₂O", ["CHO", "C₂H₄O₂", "CH₃O"], "Hard"),
      q("A mixture contains 4.0 g NaCl and 6.0 g KCl. What is the mass percent of NaCl?", "40%", ["4%", "60%", "67%"], "Easy"),
      q("A hydrocarbon’s empirical formula is CH₂ and its molar mass is 56 g/mol. What is its molecular formula?", "C₄H₈", ["C₂H₄", "C₃H₆", "C₄H₁₀"], "Hard"),
    ],
    spectra: [
      q("An element has isotopes of mass 35 amu (75%) and 37 amu (25%). What is its average atomic mass?", "35.5 amu", ["35.0 amu", "36.0 amu", "36.5 amu"]),
      q("A mass spectrum has peaks at m/z 24, 25, and 26. The m/z 24 peak is largest. What does that indicate?", "The mass-24 isotope is most abundant", ["Mass 24 has the greatest charge", "Mass 26 is most abundant", "Every isotope has equal abundance"], "Easy"),
      q("An element’s average atomic mass lies much closer to isotope X than isotope Y. Which conclusion is best?", "Isotope X has the greater natural abundance", ["Isotope X has more protons", "Isotope Y has the greater abundance", "Both isotopes must be equally abundant"]),
      q("A sample has isotope masses 10.0 and 11.0 amu and an average mass of 10.8 amu. What is the approximate abundance of the 11.0 amu isotope?", "80%", ["20%", "50%", "90%"], "Hard"),
    ],
    electrons: [
      q("Which is the ground-state electron configuration of Na?", "1s² 2s² 2p⁶ 3s¹", ["1s² 2s² 2p⁵ 3s²", "1s² 2s² 2p⁶ 3p¹", "1s² 2s² 2p⁶"]),
      q("Which electron configuration represents Fe²⁺?", "[Ar] 3d⁶", ["[Ar] 4s² 3d⁴", "[Ar] 4s¹ 3d⁵", "[Ar] 3d⁴"], "Hard"),
      q("In a photoelectron spectrum, which electrons produce the peak with the greatest binding energy?", "Core electrons closest to the nucleus", ["Valence electrons farthest from the nucleus", "Unpaired electrons only", "Electrons in the highest-energy orbital"]),
      q("A photoelectron spectrum shows peaks with relative areas 2:2:6:2:1. Which atom is consistent with the data?", "Al", ["Na", "Mg", "Si"], "Hard"),
    ],
    periodic: [
      q("Which atom has the largest atomic radius?", "K", ["Na", "Cl", "Br"], "Easy"),
      q("Why is the first ionization energy of Mg greater than that of Na?", "Mg has a greater effective nuclear charge with similar shielding", ["Mg has fewer protons", "Na has a filled valence shell", "Mg’s valence electron is in a higher principal level"]),
      q("Which species has the smallest radius?", "Mg²⁺", ["Na⁺", "F⁻", "O²⁻"], "Hard"),
      q("Which element is expected to have the most exothermic electron affinity among Na, Mg, Al, and Cl?", "Cl", ["Na", "Mg", "Al"]),
    ],
    bonding: [
      q("Which substance is best described as an ionic solid?", "MgO", ["CO₂", "Cu", "SiO₂"]),
      q("As two H atoms approach to form H₂, at what separation is the system most stable?", "At the minimum of the potential-energy curve", ["At zero separation", "Where potential energy is zero", "At infinite separation"]),
      q("Which bond is expected to be most polar?", "H–F", ["H–Cl", "C–H", "N–N"], "Easy"),
      q("A solid conducts electricity when molten but not when solid. Which bonding model best explains this?", "Ionic bonding with mobile ions only in the liquid", ["Metallic bonding", "Nonpolar covalent bonding", "Hydrogen bonding"], "Hard"),
    ],
    structures: [
      q("What is the molecular geometry of NH₃?", "Trigonal pyramidal", ["Trigonal planar", "Tetrahedral", "Bent"]),
      q("How many equivalent resonance structures are commonly drawn for NO₃⁻?", "3", ["1", "2", "4"]),
      q("What is the formal charge on N in NH₄⁺?", "+1", ["−1", "0", "+4"]),
      q("Which hybridization is associated with the central carbon in CO₂?", "sp", ["sp²", "sp³", "dsp³"], "Hard"),
    ],
    solids: [
      q("Which solid is expected to have the highest melting point?", "SiO₂", ["CO₂", "I₂", "CH₄"]),
      q("Why are metals typically malleable?", "Metal ions can shift while remaining attracted to delocalized electrons", ["Metal atoms are held by directional covalent bonds", "Metals contain neutral molecules", "Metallic bonds disappear under stress"]),
      q("Brass is best classified as what type of material?", "A substitutional alloy", ["A molecular solid", "An ionic crystal", "An interstitial compound only"]),
      q("Which property is characteristic of a network covalent solid?", "High melting point and poor electrical conductivity", ["Low boiling point", "High vapor pressure", "Conductivity caused by freely moving ions"], "Hard"),
    ],
    intermolecular: [
      q("Which substance has the strongest intermolecular forces?", "H₂O", ["H₂S", "CH₄", "CO₂"]),
      q("Why does I₂ have a higher boiling point than Br₂?", "I₂ is more polarizable and has stronger dispersion forces", ["I₂ forms hydrogen bonds", "Br₂ is ionic", "I₂ has a permanent dipole"]),
      q("Which liquid is expected to have the lowest vapor pressure at the same temperature?", "The liquid with the strongest intermolecular attractions", ["The liquid with the smallest molar mass", "The liquid with the weakest attractions", "All liquids have the same vapor pressure"]),
      q("Acetone mixes with water primarily because acetone’s carbonyl oxygen can do what?", "Accept hydrogen bonds from water", ["Donate ionic bonds", "Form metallic bonds", "Transfer protons completely"], "Hard"),
    ],
    gases: [
      q("What volume does 0.500 mol of an ideal gas occupy at 1.00 atm and 273 K? Use R = 0.0821 L·atm·mol⁻¹·K⁻¹.", "11.2 L", ["5.60 L", "22.4 L", "44.8 L"]),
      q("At the same temperature, which gas has the greatest average molecular speed?", "He", ["Ne", "Ar", "Kr"]),
      q("A gas is compressed at constant temperature from 4.0 L to 2.0 L. What happens to its pressure?", "It doubles", ["It halves", "It remains constant", "It quadruples"]),
      q("A real gas deviates most strongly from ideal behavior under which conditions?", "High pressure and low temperature", ["Low pressure and high temperature", "Low pressure and low temperature", "High temperature at any pressure"], "Hard"),
    ],
    solutions: [
      q("What is the molarity of a solution containing 0.50 mol solute in 2.0 L of solution?", "0.25 M", ["0.50 M", "1.0 M", "4.0 M"], "Easy"),
      q("What volume of 6.0 M stock solution is needed to make 250 mL of 0.60 M solution?", "25 mL", ["10 mL", "40 mL", "100 mL"]),
      q("Which method best separates ethanol from water based on boiling-point differences?", "Distillation", ["Filtration", "Decanting", "Paper chromatography"]),
      q("Why does NaCl dissolve in water?", "Ion–dipole attractions compensate for separating the ions and water molecules", ["NaCl becomes covalent", "Water transfers electrons to Na⁺", "Hydrogen bonds form between Na⁺ and Cl⁻"], "Hard"),
    ],
    spectroscopy: [
      q("What is the frequency of light with wavelength 600 nm? Use c = 3.00 × 10⁸ m/s.", "5.00 × 10¹⁴ s⁻¹", ["2.00 × 10⁻¹⁵ s⁻¹", "1.80 × 10² s⁻¹", "5.00 × 10⁵ s⁻¹"]),
      q("Which photon has the greatest energy?", "A 200 nm photon", ["A 400 nm photon", "A 600 nm photon", "An 800 nm photon"]),
      q("A calibration line follows A = 0.020C, where C is in μM. What concentration gives A = 0.50?", "25 μM", ["0.010 μM", "10 μM", "50 μM"]),
      q("A student dilutes a colored solution by a factor of two while path length stays constant. What happens to absorbance?", "It is approximately halved", ["It doubles", "It is squared", "It is unchanged"], "Hard"),
    ],
    reactions: [
      q("Which is the net ionic equation when AgNO₃(aq) and NaCl(aq) are mixed?", "Ag⁺(aq) + Cl⁻(aq) → AgCl(s)", ["Na⁺ + NO₃⁻ → NaNO₃", "AgNO₃ + NaCl → AgCl", "Ag⁺ + NO₃⁻ → AgNO₃"]),
      q("Which observation provides the strongest evidence that a chemical reaction occurred?", "A precipitate forms when two clear solutions are mixed", ["Ice melts", "Water boils", "A solid is crushed"]),
      q("In 2Al + 3Cu²⁺ → 2Al³⁺ + 3Cu, which species is oxidized?", "Al", ["Cu²⁺", "Al³⁺", "Cu"]),
      q("What is the oxidation number of sulfur in SO₄²⁻?", "+6", ["−2", "+4", "+8"], "Hard"),
    ],
    stoichiometry: [
      q("For N₂ + 3H₂ → 2NH₃, how many moles of NH₃ form from 4.0 mol H₂ with excess N₂?", "2.67 mol", ["1.33 mol", "4.0 mol", "6.0 mol"]),
      q("For 2H₂ + O₂ → 2H₂O, a mixture contains 3.0 mol H₂ and 2.0 mol O₂. Which reactant is limiting?", "H₂", ["O₂", "H₂O", "Neither reactant"]),
      q("A reaction has a theoretical yield of 12.0 g and produces 9.0 g. What is the percent yield?", "75%", ["25%", "100%", "133%"]),
      q("A 25.0 mL sample of HCl requires 20.0 mL of 0.150 M NaOH for neutralization. What is [HCl]?", "0.120 M", ["0.0300 M", "0.150 M", "0.188 M"], "Hard"),
    ],
    kinetics: [
      q("For rate = k[A]²[B], what happens to the rate if [A] doubles while [B] remains constant?", "The rate increases by a factor of 4", ["It doubles", "It increases by a factor of 8", "It remains constant"]),
      q("A plot of ln[A] versus time is linear. What is the reaction order in A?", "First order", ["Zero order", "Second order", "Third order"]),
      q("A first-order reaction has k = 0.200 min⁻¹. What is its half-life?", "3.47 min", ["0.139 min", "5.00 min", "13.9 min"]),
      q("Experimental data show that doubling [A] doubles the rate and doubling [B] has no effect. Which rate law is consistent?", "rate = k[A]", ["rate = k[A]²", "rate = k[A][B]", "rate = k[B]"], "Hard", "Several trials are performed at constant temperature while initial concentrations are changed independently."),
    ],
    mechanisms: [
      q("For an elementary step A + 2B → products, what is its rate law?", "rate = k[A][B]²", ["rate = k[A]²[B]", "rate = k[A+B]", "The rate law cannot be written for an elementary step"]),
      q("A species is produced in one mechanism step and consumed in a later step but absent from the overall equation. What is it?", "An intermediate", ["A catalyst", "A reactant", "A transition state"]),
      q("What effect does a catalyst have on a reaction-energy profile?", "It provides a pathway with lower activation energy", ["It lowers ΔH", "It raises product energy", "It changes the equilibrium constant"]),
      q("A proposed mechanism’s slow step predicts rate = k[NO₂]². The measured rate law is rate = k[NO₂]². What does this show?", "The mechanism is kinetically consistent but not proven uniquely", ["The mechanism is proven correct", "The mechanism must be wrong", "The reaction is at equilibrium"], "Hard"),
    ],
    calorimetry: [
      q("How much heat is absorbed by 100 g of water warmed from 20°C to 25°C? Use c = 4.18 J·g⁻¹·°C⁻¹.", "2.09 kJ", ["0.478 kJ", "4.18 kJ", "20.9 kJ"]),
      q("A reaction warms the surrounding solution. What is the sign of q for the reaction system?", "Negative", ["Positive", "Zero", "Cannot be determined"]),
      q("A 50.0 g metal at 100°C is placed in water and cools to 30°C. The water gains 1.75 kJ. What is the metal’s specific heat?", "0.500 J·g⁻¹·°C⁻¹", ["0.250 J·g⁻¹·°C⁻¹", "1.00 J·g⁻¹·°C⁻¹", "2.00 J·g⁻¹·°C⁻¹"], "Hard"),
      q("During melting at constant pressure, what happens to temperature and potential energy?", "Temperature stays constant while potential energy increases", ["Both decrease", "Temperature rises while potential energy stays constant", "Both stay constant"]),
    ],
    enthalpy: [
      q("Using bond enthalpies, which expression estimates ΔH for H₂ + Cl₂ → 2HCl?", "D(H–H) + D(Cl–Cl) − 2D(H–Cl)", ["2D(H–Cl) − D(H–H) − D(Cl–Cl)", "D(H–H) + D(Cl–Cl) + 2D(H–Cl)", "D(H–Cl) − D(H–H)"]),
      q("If reversing a thermochemical equation changes ΔH from −100 kJ to what value?", "+100 kJ", ["−100 kJ", "+50 kJ", "+200 kJ"]),
      q("Given ΔHf° values CO₂ = −394, H₂O(l) = −286, and CH₄ = −75 kJ/mol, what is ΔH° for CH₄ + 2O₂ → CO₂ + 2H₂O?", "−891 kJ/mol", ["−605 kJ/mol", "−319 kJ/mol", "+891 kJ/mol"], "Hard"),
      q("Two steps have ΔH values +50 kJ and −80 kJ and add to the target reaction. What is the target ΔH?", "−30 kJ", ["+30 kJ", "−130 kJ", "+130 kJ"]),
    ],
    equilibrium: [
      q("For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), which expression is Kc?", "[NH₃]²/([N₂][H₂]³)", ["[N₂][H₂]³/[NH₃]²", "2[NH₃]/([N₂]+3[H₂])", "[NH₃]/[N₂][H₂]"]),
      q("If Q < K, in which direction will a reaction proceed to reach equilibrium?", "Toward products", ["Toward reactants", "It will not change", "K must decrease"]),
      q("If K = 4.0 for a reaction, what is K for the reverse reaction?", "0.250", ["−4.0", "2.0", "4.0"]),
      q("For A ⇌ B, initially [A]=1.00 M and [B]=0. A 0.40 M amount of A reacts. What are the equilibrium concentrations?", "[A]=0.60 M and [B]=0.40 M", ["[A]=0.40 M and [B]=0.60 M", "[A]=1.40 M and [B]=0.40 M", "[A]=0.60 M and [B]=1.00 M"], "Hard"),
    ],
    lechatelier: [
      q("For N₂ + 3H₂ ⇌ 2NH₃, what happens when H₂ is added at constant temperature?", "The system shifts toward NH₃", ["The system shifts toward N₂", "K increases", "K decreases"]),
      q("For an exothermic forward reaction, what happens when temperature increases?", "Equilibrium shifts toward reactants and K decreases", ["Equilibrium shifts toward products and K increases", "K remains constant", "Only the rates change temporarily"]),
      q("What effect does adding a catalyst have on equilibrium composition?", "No effect on equilibrium composition", ["More products form", "More reactants form", "K increases"]),
      q("A gaseous equilibrium has two moles of gas on the reactant side and four on the product side. What happens when volume decreases?", "It shifts toward reactants", ["It shifts toward products", "K increases", "There is never a shift"], "Hard"),
    ],
    solubility: [
      q("For AgCl(s) ⇌ Ag⁺ + Cl⁻, which expression is Ksp?", "[Ag⁺][Cl⁻]", ["[AgCl]/([Ag⁺][Cl⁻])", "[Ag⁺]+[Cl⁻]", "[AgCl]"]),
      q("If the molar solubility of AgCl is s in pure water, what is Ksp?", "s²", ["2s", "2s²", "s/2"]),
      q("What happens to AgCl solubility when NaCl is added?", "It decreases because of the common-ion effect", ["It increases", "It is unchanged", "Ksp increases"]),
      q("A solution has [Ag⁺][Cl⁻] greater than Ksp for AgCl. What occurs?", "AgCl precipitates until Qsp equals Ksp", ["More AgCl dissolves", "Ksp increases", "Nothing changes"], "Hard"),
    ],
    acids: [
      q("What is the pH of 1.0 × 10⁻³ M HCl?", "3.00", ["1.00", "7.00", "11.00"], "Easy"),
      q("What is the pH of 0.010 M NaOH at 25°C?", "12.00", ["2.00", "7.00", "10.00"]),
      q("A weak acid has Ka = 1.0 × 10⁻⁵ and initial concentration 0.10 M. What is the approximate [H₃O⁺]?", "1.0 × 10⁻³ M", ["1.0 × 10⁻⁵ M", "1.0 × 10⁻² M", "0.10 M"], "Hard"),
      q("Which acid is strongest?", "The acid with the smallest pKa", ["The acid with the largest pKa", "The acid with the smallest concentration", "All acids with one proton are equally strong"]),
    ],
    buffers: [
      q("A buffer contains equal concentrations of HA and A⁻. What is its pH?", "pH = pKa", ["pH = 7 always", "pH = ½pKa", "pH = 14 − pKa"]),
      q("Which mixture can form a buffer?", "CH₃COOH and CH₃COONa", ["HCl and NaCl", "NaOH and KOH", "HNO₃ and HCl"]),
      q("A buffer has pKa = 4.76 and [A⁻]/[HA] = 10. What is its pH?", "5.76", ["3.76", "4.76", "14.76"]),
      q("Which change most directly increases a buffer’s capacity without changing its initial pH?", "Increase both HA and A⁻ concentrations by the same factor", ["Dilute the buffer", "Remove half of A⁻ only", "Add enough strong acid to consume all A⁻"], "Hard"),
    ],
    titration: [
      q("At the half-equivalence point of a weak-acid/strong-base titration, which relation holds?", "pH = pKa", ["pH = 7", "pOH = pKa", "[HA] = 0"]),
      q("At the equivalence point of a strong-acid/strong-base titration at 25°C, what is the pH?", "Approximately 7", ["Always below 7", "Always above 7", "Equal to the acid’s pKa"]),
      q("Why is the equivalence-point pH above 7 when a weak acid is titrated with a strong base?", "The conjugate base hydrolyzes water to produce OH⁻", ["Excess strong base is always present", "The weak acid becomes stronger", "Water releases H⁺"]),
      q("A student overshoots the endpoint while determining an acid concentration with standardized NaOH. What happens to the calculated acid concentration?", "It is too high", ["It is too low", "It is unchanged", "It becomes zero"], "Hard", "The student records a titrant volume larger than the volume actually required for stoichiometric equivalence."),
    ],
    entropy: [
      q("Which process has a positive ΔS for the system?", "Ice melting", ["Water freezing", "Gas condensing", "A gas being compressed"]),
      q("Which substance has the greatest standard molar entropy at the same temperature?", "A gas with many atoms per molecule", ["A monatomic solid", "A small liquid molecule", "A perfectly ordered crystal at 0 K"]),
      q("A process has ΔH < 0 and ΔS > 0. When is it thermodynamically favorable?", "At all temperatures", ["Only at low temperature", "Only at high temperature", "At no temperature"]),
      q("For a spontaneous process, which statement must be true?", "ΔS_universe > 0", ["ΔS_system > 0", "ΔH_system < 0", "Activation energy equals zero"], "Hard"),
    ],
    gibbs: [
      q("At 298 K, a reaction has ΔH = +20 kJ/mol and ΔS = +100 J·mol⁻¹·K⁻¹. What is ΔG?", "−9.8 kJ/mol", ["+19.9 kJ/mol", "+49.8 kJ/mol", "−29.8 kJ/mol"], "Hard"),
      q("What is true at equilibrium under constant temperature and pressure?", "ΔG = 0 and Q = K", ["ΔG° = 0 for every reaction", "K = 0", "Forward and reverse reactions stop"]),
      q("If ΔG° is strongly negative, what can be concluded about K?", "K is greater than 1", ["K equals 0", "K is less than 1", "The reaction must be fast"]),
      q("A reaction is thermodynamically favorable but occurs very slowly. What best explains this?", "It has a large activation-energy barrier", ["Its ΔG is positive", "Its equilibrium constant is zero", "Entropy cannot change"]),
    ],
    electrochemistry: [
      q("In a galvanic cell, where does oxidation occur?", "At the anode", ["At the cathode", "In the salt bridge", "At both electrodes equally"]),
      q("Given E°cathode = +0.34 V and E°anode = −0.76 V as reduction potentials, what is E°cell?", "+1.10 V", ["−1.10 V", "+0.42 V", "+0.58 V"]),
      q("What is the purpose of a salt bridge?", "Maintain electrical neutrality by allowing ion migration", ["Supply electrons", "Increase E°cell", "Prevent oxidation"]),
      q("If Q increases for a galvanic-cell reaction at constant temperature, what happens to E according to the Nernst equation?", "E decreases", ["E increases", "E stays constant", "E becomes E° regardless of Q"], "Hard"),
    ],
    electrolysis: [
      q("How much charge passes through a cell carrying 2.00 A for 300 s?", "600 C", ["150 C", "302 C", "6,000 C"]),
      q("How many moles of electrons correspond to 96,485 C?", "1.00 mol e⁻", ["0.500 mol e⁻", "2.00 mol e⁻", "96,485 mol e⁻"]),
      q("How many moles of Cu are plated by 2.00 mol e⁻ from Cu²⁺?", "1.00 mol Cu", ["0.500 mol Cu", "2.00 mol Cu", "4.00 mol Cu"]),
      q("A current of 1.00 A runs for 1,930 s through Ag⁺ solution. Approximately how much Ag is deposited? Use F = 96,500 C/mol and M(Ag)=108 g/mol.", "2.16 g", ["1.08 g", "4.32 g", "108 g"], "Hard"),
    ],
  };

  const bankKey = (unit, title) => {
    if (unit === 1) {
      if (/Moles|Molar Mass/.test(title)) return "moles";
      if (/Mass Spectra/.test(title)) return "spectra";
      if (/Composition/.test(title)) return "composition";
      if (/Atomic Structure|Electron Configuration|Photoelectron/.test(title)) return "electrons";
      return "periodic";
    }
    if (unit === 2) return /Lewis|Resonance|Formal Charge|VSEPR|Hybridization/.test(title) ? "structures" : /Ionic Solids|Metals|Alloys/.test(title) ? "solids" : "bonding";
    if (unit === 3) {
      if (/Intermolecular|Interparticle/.test(title)) return "intermolecular";
      if (/Ideal Gas|Kinetic Molecular|Deviation|Solids, Liquids, and Gases/.test(title)) return "gases";
      if (/Solutions|Mixtures|Separation|Solubility|Representations/.test(title)) return "solutions";
      if (/Spectroscopy|Photons|Beer-Lambert/.test(title)) return "spectroscopy";
      return "solids";
    }
    if (unit === 4) return /Stoichiometry|Titration/.test(title) ? "stoichiometry" : "reactions";
    if (unit === 5) return /Rate|Concentration Changes/.test(title) ? "kinetics" : "mechanisms";
    if (unit === 6) return /Heat|Calorimetry|Phase|Endothermic|Exothermic|Energy Diagrams/.test(title) ? "calorimetry" : "enthalpy";
    if (unit === 7) {
      if (/Le Châtelier/.test(title)) return "lechatelier";
      if (/Solubility|Common-Ion/.test(title)) return "solubility";
      return "equilibrium";
    }
    if (unit === 8) {
      if (/Titration/.test(title)) return "titration";
      if (/Buf\s*fers|Henderson|Capacity/.test(title)) return "buffers";
      if (/Solubility/.test(title)) return "solubility";
      return "acids";
    }
    if (/Entropy/.test(title)) return "entropy";
    if (/Cell|Electrolysis|Faraday/.test(title)) return /Electrolysis|Faraday/.test(title) ? "electrolysis" : "electrochemistry";
    return "gibbs";
  };

  window.AP_CHEMISTRY_QUESTIONS_FOR_TOPIC = (topicNumber, topicTitle) => {
    const unit = Number(String(topicNumber).split(".")[0]);
    const key = bankKey(unit, topicTitle);
    return banks[key].map((item, index) => ({
      ...item,
      options: rotate(item.options, `${topicNumber}-${index}`),
    }));
  };
})();
