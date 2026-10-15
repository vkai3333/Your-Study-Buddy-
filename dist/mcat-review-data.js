(() => {
  const sourceUrl = "https://students-residents.aamc.org/prepare-mcat-exam/whats-mcat-exam-pdf-outline";
  const themeNames = [
    "Biochemistry: amino acids, proteins, and enzymes",
    "Cells, membranes, and molecular biology",
    "Metabolism, genetics, and evolution",
    "Organ systems and homeostasis",
    "General chemistry and molecular structure",
    "Reactions, equilibrium, acids, and thermodynamics",
    "Organic chemistry and laboratory methods",
    "Physics: mechanics, fluids, and energy",
    "Physics: electricity, waves, sound, and optics",
    "Research methods, math, and data interpretation",
    "Sensation, cognition, learning, and development",
    "Behavior, identity, and social interaction",
    "Society, demographics, and inequality",
    "CARS reasoning strategies",
  ];
  const decks = themeNames.map((shortName, index) => ({
    id: `mcat-theme-${index + 1}`,
    name: `MCAT Review · Theme ${index + 1}`,
    shortName,
    description: `${shortName}. Aligned to the AAMC foundational concepts and content categories.`,
    builtIn: true,
    sourceTitle: "AAMC What’s on the MCAT Exam? Content Outline",
    sourceUrl,
    cards: [], questions: [], feynmanPrompts: [],
  }));
  const seen = new Set();
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const add = (theme, card, sourceUnit = "") => {
    const key = normalize(card.front);
    if (!key || seen.has(key)) return;
    seen.add(key);
    decks[theme].cards.push({ ...JSON.parse(JSON.stringify(card)), id: `mcat-t${theme + 1}-c${decks[theme].cards.length + 1}`, crosswalkSourceUnit: sourceUnit });
  };
  const addSource = (source, map, filter = () => true) => (source || []).forEach((deck) => {
    const theme = map[deck.id];
    if (!Number.isInteger(theme)) return;
    (deck.cards || []).filter(filter).forEach((card) => add(theme, card, deck.id));
    (deck.feynmanPrompts || []).forEach((item) => decks[theme].feynmanPrompts.push({ id: `mcat-t${theme + 1}-f${decks[theme].feynmanPrompts.length + 1}`, prompt: item.prompt }));
  });
  addSource(window.AP_BIOLOGY_DECKS, {
    "apbio-unit-1": 0, "apbio-unit-2": 1, "apbio-unit-3": 2, "apbio-unit-4": 1,
    "apbio-unit-5": 2, "apbio-unit-6": 2, "apbio-unit-7": 2, "apbio-unit-8": 3,
  }, (card) => !/population ecology|community ecology|biome|succession|island biogeography/i.test(`${card.front} ${card.back}`));
  addSource(window.AP_CHEMISTRY_DECKS, {
    "apchem-unit-1": 4, "apchem-unit-2": 4, "apchem-unit-3": 4, "apchem-unit-4": 5,
    "apchem-unit-5": 5, "apchem-unit-6": 5, "apchem-unit-7": 5, "apchem-unit-8": 5, "apchem-unit-9": 5,
  });
  addSource(window.AP_PSYCHOLOGY_DECKS, {
    "appsych-unit-0": 9, "appsych-unit-1": 10, "appsych-unit-2": 10,
    "appsych-unit-3": 10, "appsych-unit-4": 11, "appsych-unit-5": 11,
  }, (card) => !/specific phobia treatment|electroconvulsive|lobotomy|projective test|rorschach/i.test(`${card.front} ${card.back}`));

  const rows = (theme, text) => [[theme, text.trim().split("\n").map((line) => line.split("|"))]];
  const manual = [
    ...rows(0, `Amino acid zwitterion|At physiological pH, most free amino acids carry a positive ammonium group and negative carboxylate group while having no net charge unless the side chain is ionized.
Isoelectric point|The pH at which an amino acid or protein has zero net electric charge and therefore shows minimal migration in an electric field.
Peptide bond|Planar amide linkage formed by condensation between the amino group of one amino acid and carboxyl group of another.
Protein primary structure|Linear amino-acid sequence joined by peptide bonds; it ultimately constrains every higher level of folding.
Protein secondary structure|Local backbone folding, especially alpha helices and beta sheets, stabilized mainly by hydrogen bonds between peptide backbone groups.
Protein tertiary structure|Overall three-dimensional conformation of one polypeptide produced by hydrophobic interactions, hydrogen bonds, ionic interactions, and disulfide bonds.
Protein quaternary structure|Arrangement and interaction of multiple polypeptide subunits in one functional protein.
Competitive inhibition|Inhibitor binds the active site; apparent Km increases while Vmax remains unchanged and can be reached with enough substrate.
Noncompetitive inhibition|Pure inhibitor binds enzyme and enzyme–substrate complex equally at an allosteric site; Vmax decreases while Km remains unchanged.
Uncompetitive inhibition|Inhibitor binds only the enzyme–substrate complex, decreasing both apparent Km and Vmax.
Michaelis constant (Km)|Substrate concentration at half Vmax; for simple Michaelis–Menten behavior, lower Km generally indicates greater apparent substrate affinity.
Turnover number|Maximum number of substrate molecules converted to product per enzyme molecule per unit time when saturated.
Coenzyme|Small organic helper, often vitamin-derived, that transfers electrons or chemical groups during enzyme-catalyzed reactions.
Denaturation|Loss of a protein’s native higher-order structure and function without normally breaking its primary peptide-bond sequence.`),
    ...rows(3, `Nephron|Functional unit of the kidney consisting of a renal corpuscle and tubule that filters blood and adjusts water, ions, nutrients, and wastes.
Glomerular filtration|Pressure-driven movement of water and small solutes from glomerular capillaries into Bowman’s space while cells and most proteins remain in blood.
Proximal convoluted tubule|Nephron segment that reabsorbs most filtered sodium and water plus nearly all glucose and amino acids under normal conditions.
Loop of Henle|Countercurrent multiplier that establishes the medullary osmotic gradient; descending limb favors water exit and ascending limb reabsorbs salts but is water-impermeable.
Distal convoluted tubule|Nephron segment that fine-tunes electrolytes and pH under hormonal control.
Collecting duct|Final nephron pathway where ADH-regulated water permeability adjusts urine concentration.
Renin–angiotensin–aldosterone system|Hormonal cascade activated by low renal perfusion that increases vasoconstriction, sodium retention, water retention, and blood pressure.
Antidiuretic hormone|Posterior-pituitary hormone that increases collecting-duct water permeability by promoting aquaporin insertion.
Cardiac output|Volume of blood pumped by one ventricle per minute, equal to heart rate multiplied by stroke volume.
Frank–Starling mechanism|Greater ventricular filling stretches cardiac muscle and increases contraction strength within physiological limits.
Bohr effect|Lower pH and higher carbon dioxide reduce hemoglobin’s oxygen affinity, promoting oxygen unloading in active tissues.
Surfactant|Lipid-rich alveolar secretion that lowers surface tension, reduces collapse, and increases lung compliance.
Pancreatic bicarbonate|Bicarbonate-rich secretion that neutralizes acidic chyme in the duodenum and creates a suitable pH for pancreatic enzymes.
Portal circulation|Vascular pathway carrying blood between two capillary beds, such as nutrient-rich blood from the gut to the liver.
Spermatogenesis|Production of haploid sperm from diploid germ cells through mitosis, meiosis, and maturation in seminiferous tubules.
Menstrual cycle|Coordinated ovarian and uterine cycle regulated by GnRH, FSH, LH, estrogen, and progesterone.
Innate immunity|Rapid, nonspecific defense using barriers, complement, inflammation, phagocytes, and natural killer cells.
Adaptive immunity|Antigen-specific defense mediated by B and T lymphocytes that produces clonal expansion and immunological memory.
Major histocompatibility complex I|Surface proteins on nearly all nucleated cells that present intracellular peptides to CD8 cytotoxic T cells.
Major histocompatibility complex II|Surface proteins on professional antigen-presenting cells that present extracellularly derived peptides to CD4 helper T cells.`),
    ...rows(6, `Nucleophilic substitution|Reaction in which an electron-rich nucleophile replaces a leaving group at an electrophilic carbon.
SN1 reaction|Two-step substitution through a carbocation intermediate; rate depends only on substrate and rearrangements are possible.
SN2 reaction|Concerted backside substitution; rate depends on substrate and nucleophile and stereochemistry inverts at the reacting center.
E1 reaction|Two-step elimination through a carbocation, often competing with SN1 and favoring the more substituted alkene.
E2 reaction|Concerted elimination requiring an antiperiplanar hydrogen and leaving group; rate depends on substrate and base.
Carbonyl carbon|Electrophilic carbon of a C=O bond because electron density is pulled toward oxygen.
Aldol condensation|Carbon–carbon bond-forming reaction in which an enolate attacks a carbonyl and the product may dehydrate to an alpha,beta-unsaturated carbonyl.
Fischer esterification|Acid-catalyzed equilibrium reaction between a carboxylic acid and alcohol producing an ester and water.
Saponification|Base-promoted ester hydrolysis producing a carboxylate salt and alcohol; fat hydrolysis produces soap.
Thin-layer chromatography|Separation on a coated plate; retention factor equals distance traveled by compound divided by distance traveled by solvent front.
Extraction|Separation based on unequal solubility of a compound between two immiscible liquid phases.
Distillation|Separation based primarily on volatility and boiling-point differences; fractional distillation improves separation of close boiling points.
Recrystallization|Purification using high solubility in hot solvent and low solubility in cold solvent so crystals exclude many impurities.
Infrared spectroscopy|Absorption of infrared radiation excites bond vibrations; characteristic frequencies help identify functional groups.
Nuclear magnetic resonance|Nuclei in distinct electronic environments resonate at different chemical shifts, revealing connectivity and symmetry.
Mass spectrometry|Ionization and mass-to-charge analysis used to determine molecular mass, isotope patterns, and fragmentation clues.`),
    ...rows(7, `Displacement|Vector change in position from initial to final point.
Velocity|Rate of change of displacement; the slope of a position–time graph.
Acceleration|Rate of change of velocity; the slope of a velocity–time graph.
Newton’s first law|An object maintains constant velocity unless acted on by a net external force.
Newton’s second law|Net force equals mass times acceleration, with force and acceleration pointing in the same direction.
Newton’s third law|Forces occur in equal-magnitude, opposite-direction pairs acting on different objects.
Work|Energy transferred when a force acts through displacement; W = Fd cos θ.
Kinetic energy|Energy of motion equal to one-half mass times speed squared.
Gravitational potential energy|Near Earth’s surface, stored energy relative to a reference height equals mgh.
Power|Rate of energy transfer or work, P = W/t; for parallel constant force and velocity, P = Fv.
Momentum|Vector quantity p = mv conserved in an isolated system.
Impulse|Change in momentum equal to force integrated over time, or average force times time interval.
Torque|Rotational effect of force equal to rF sin θ about a chosen axis.
Static equilibrium|State with both zero net force and zero net torque.
Density|Mass per unit volume.
Pressure|Normal force per unit area.
Hydrostatic pressure|Pressure change with depth in a fluid is ρgh.
Pascal’s principle|An applied pressure change in a confined incompressible fluid is transmitted throughout the fluid.
Archimedes’ principle|Buoyant force equals the weight of fluid displaced by an immersed object.
Continuity equation|For steady incompressible flow, cross-sectional area times flow speed remains constant.
Bernoulli equation|Along a streamline in ideal flow, pressure, kinetic energy density, and gravitational potential energy density trade off while their sum remains constant.
Poiseuille’s law|Laminar volume flow through a cylindrical tube is proportional to pressure difference and radius to the fourth power, and inversely proportional to viscosity and length.`),
    ...rows(8, `Electric field|Force per unit positive test charge; for a point charge its magnitude is k|q|/r².
Electric potential|Electric potential energy per unit charge; voltage difference drives charge movement.
Capacitance|Charge stored per potential difference; a parallel-plate capacitor increases capacitance with plate area and dielectric constant and decreases it with separation.
Ohm’s law|For an ohmic element, voltage equals current times resistance.
Series circuit|Components share the same current; resistances add and voltage drops divide.
Parallel circuit|Branches share the same voltage; currents divide and reciprocal resistances add.
Electrical power|Rate of electrical energy conversion, expressible as IV, I²R, or V²/R.
Magnetic force on a charge|Moving charge in a magnetic field experiences qvB sin θ perpendicular to velocity and field.
Wave speed|Propagation speed equals frequency multiplied by wavelength.
Standing wave|Interference pattern with fixed nodes and antinodes produced by oppositely traveling waves of the same frequency.
Doppler effect|Observed frequency changes when source and observer have relative radial motion.
Sound intensity level|Logarithmic decibel measure comparing intensity with a reference intensity.
Index of refraction|Ratio of light speed in vacuum to light speed in a medium.
Snell’s law|Relation n₁ sin θ₁ = n₂ sin θ₂ governing refraction at a boundary.
Total internal reflection|Complete reflection when light travels from higher to lower refractive index above the critical angle.
Thin lens equation|Relationship 1/f = 1/o + 1/i among focal length, object distance, and image distance.
Magnification|Image height divided by object height, equal to negative image distance divided by object distance for a thin lens.
Photon energy|Energy of one photon equals Planck’s constant times frequency.
Photoelectric effect|Electrons are emitted only when photon frequency exceeds a threshold; intensity changes electron number while frequency changes maximum kinetic energy.`),
    ...rows(9, `Dimensional analysis|Track units as algebraic factors to test equations and convert quantities.
Scientific notation|Representation a × 10ⁿ with 1 ≤ |a| < 10, useful for order-of-magnitude estimation.
Proportional reasoning|Determine how changing one variable scales another while holding specified variables constant.
Logarithm rule|For base ten, log(ab)=log a+log b and log(a/b)=log a−log b; pH and decibels use logarithmic scales.
Independent variable|Factor deliberately manipulated or used to define comparison groups.
Dependent variable|Measured outcome expected to respond to the independent variable.
Confounding variable|Uncontrolled factor associated with both predictor and outcome that offers an alternative explanation.
Random assignment|Chance allocation to conditions that tends to balance confounders and supports causal inference.
Random sampling|Chance selection from a population that supports generalization when implemented well.
Sensitivity|Proportion of people with a condition who test positive.
Specificity|Proportion of people without a condition who test negative.
Positive predictive value|Probability that a person truly has the condition given a positive test; it changes with prevalence.
Standard deviation|Typical spread of observations around their mean.
Standard error|Estimated variability of a sample statistic across repeated samples; for a mean it decreases with square root of sample size.
Confidence interval|Range generated by a procedure designed to contain the true parameter at a stated long-run frequency.
Type I error|Rejecting a true null hypothesis; a false positive.
Type II error|Failing to reject a false null hypothesis; a false negative.
Correlation coefficient|Standardized measure from −1 to +1 describing direction and strength of a linear relationship, not causation.`),
    ...rows(12, `Culture|Shared learned beliefs, values, practices, symbols, and material products transmitted among members of a society.
Socialization|Lifelong process through which people learn social norms, roles, identities, and expected behavior.
Norm|Social rule or expectation that guides behavior and may be enforced formally or informally.
Folkway|Informal norm governing everyday behavior whose violation usually brings mild sanctions.
More|Strongly held norm with moral significance whose violation may trigger serious disapproval.
Role conflict|Tension produced by incompatible expectations attached to different social positions.
Role strain|Difficulty satisfying competing expectations within one social role.
Social institution|Stable organized pattern meeting social needs, such as family, education, religion, economy, government, or medicine.
Bureaucracy|Formal organization characterized by specialization, hierarchy, written rules, impersonality, and credentialed positions.
Social constructionism|Perspective that meanings and categories arise through social interaction and historical context rather than simply reflecting nature.
Symbolic interactionism|Micro-level perspective emphasizing how people construct meaning through symbols and interaction.
Functionalism|Macro-level perspective viewing society as interdependent institutions that contribute to stability while sometimes creating dysfunction.
Conflict theory|Macro-level perspective emphasizing unequal power, competition over resources, and institutions that reproduce advantage.
Demographic transition|Model describing population change as mortality and fertility fall during social and economic development.
Population pyramid|Graph of age and sex structure used to infer growth patterns, dependency, and demographic history.
Incidence|Number or rate of new cases arising in a population during a specified period.
Prevalence|Proportion of a population with a condition at a specified point or period.
Social stratification|Structured hierarchy that distributes wealth, power, prestige, opportunities, and health unequally.
Socioeconomic status|Position based on interacting dimensions such as income, education, occupation, and neighborhood resources.
Absolute poverty|Inability to obtain resources required for basic survival needs.
Relative poverty|Economic disadvantage measured against the typical resources or living standards of a society.
Social capital|Resources available through relationships, trust, shared norms, and social networks.
Health disparity|Systematic difference in health outcomes or healthcare access among social groups.
Medicalization|Process by which a condition or behavior becomes defined and treated as a medical problem.
Intersectionality|Framework analyzing how overlapping social identities and systems of power jointly shape experience and inequality.`),
    ...rows(13, `Main idea|The passage’s central claim or organizing purpose, broad enough to cover the whole text but specific enough to distinguish it from alternatives.
Author’s tone|The writer’s attitude conveyed through diction, emphasis, qualification, and rhetorical choices.
Passage map|Brief mental or written record of each paragraph’s function and how the argument develops.
Textual evidence|Specific passage information that directly supports an answer; outside knowledge should not replace it.
Inference|Conclusion strongly supported by passage evidence even when not stated word for word.
Reasoning within the text|Assessing relationships among claims, evidence, assumptions, examples, and implications inside the passage.
Reasoning beyond the text|Applying or extending the passage’s ideas to a new situation while preserving the author’s logic.
Author agreement question|Choose the option most consistent with the author’s expressed commitments, qualifications, and priorities.
Strengthen question|Identify new information that makes the passage’s reasoning or conclusion more likely to hold.
Weaken question|Identify new information that undermines a premise, assumption, causal link, or generalization.
Necessary assumption|Unstated idea the argument requires; if negated, the argument substantially fails.
Rhetorical function|Purpose served by a sentence or example, such as defining, qualifying, contrasting, illustrating, or conceding.
Scope trap|Answer that is too broad, too narrow, or about a related issue the passage does not actually address.
Extreme-language trap|Answer using absolute wording unsupported by a passage that is qualified or limited.
Opposite answer|Option that reverses the passage’s position or relationship while borrowing familiar language.
CARS timing checkpoint|Use a consistent passage pace, but protect accuracy by locating evidence rather than racing through every sentence.`),
  ];
  manual.forEach(([theme, entries]) => entries.forEach(([front, back]) => add(theme, { front, back })));

  const prompts = [
    [0,"How to determine an amino acid’s charge at a given pH"],[0,"How to interpret Michaelis–Menten and Lineweaver–Burk changes"],[0,"How protein structure produces function"],
    [1,"How to predict membrane transport from molecular properties"],[1,"How a receptor signal changes a cell’s behavior"],[1,"How to trace information from DNA to protein"],
    [2,"How to trace carbon and reducing equivalents through metabolism"],[2,"How to connect inheritance, mutation, and gene expression"],[2,"How to predict the effect of fed and fasting states"],
    [3,"How the kidney concentrates urine"],[3,"How ventilation, circulation, and hemoglobin deliver oxygen"],[3,"How endocrine feedback maintains homeostasis"],[3,"How innate and adaptive immunity cooperate"],
    [4,"How to move between molecular structure and intermolecular forces"],[4,"How to solve a multi-step stoichiometry problem"],[5,"How to predict equilibrium and acid–base changes"],[5,"How to connect kinetics with thermodynamics"],
    [6,"How to choose between extraction, chromatography, distillation, and recrystallization"],[6,"How to distinguish SN1, SN2, E1, and E2"],[6,"How to combine IR, NMR, and mass spectra"],
    [7,"How to draw a free-body diagram before choosing an equation"],[7,"How to use continuity and Bernoulli equations in physiology"],[7,"How to conserve energy and momentum in a mechanics problem"],
    [8,"How to reduce a circuit before calculating current and voltage"],[8,"How to construct and use a ray diagram"],[8,"How to reason through sound and Doppler-effect problems"],
    [9,"How to separate sampling, assignment, bias, and confounding"],[9,"How to interpret a graph before calculating"],[9,"How prevalence changes predictive value"],
    [10,"How sensation becomes perception"],[10,"How to distinguish memory systems and learning mechanisms"],[10,"How biology, cognition, and environment interact in behavior"],
    [11,"How identity, attitudes, roles, and groups influence behavior"],[11,"How to apply a psychological theory to a new scenario"],
    [12,"How institutions and stratification shape health"],[12,"How to distinguish incidence, prevalence, and mortality"],[12,"How to compare functionalism, conflict theory, and symbolic interactionism"],
    [13,"How to build a passage map without summarizing every sentence"],[13,"How to eliminate CARS answers by scope and evidence"],[13,"How to apply an unfamiliar author’s argument to a new case"],
  ];
  prompts.forEach(([theme, prompt]) => {
    const normalized = normalize(prompt);
    if (decks[theme].feynmanPrompts.some((item) => normalize(item.prompt) === normalized)) return;
    decks[theme].feynmanPrompts.push({ id: `mcat-t${theme + 1}-f${decks[theme].feynmanPrompts.length + 1}`, prompt });
  });

  const visualRules = [
    [/membrane|phospholipid|osmosis|diffusion|transport protein/i,"./science-diagrams/biology-membrane.svg","OpenStax / Wikimedia Commons / CC BY 4.0",6],
    [/mitochond|cellular respiration|electron transport|chemiosmosis|atp synthase/i,"./science-diagrams/biology-mitochondrion.svg","Kelvinsong / Wikimedia Commons / CC BY-SA 3.0",6],
    [/dna replication|helicase|leading strand|lagging strand|okazaki/i,"./science-diagrams/biology-dna-replication.svg","LadyofHats / Wikimedia Commons / public domain",5],
    [/cell cycle|mitosis|checkpoint|cyclin/i,"./science-diagrams/biology-cell-cycle.svg","Kelvinsong / Wikimedia Commons / CC BY-SA 3.0",5],
    [/mass spectrum|mass spectrometry|mass-to-charge/i,"./science-diagrams/chemistry-mass-spectrum.svg","K. Aainsqatsi / Wikimedia Commons / CC BY-SA 3.0",5],
    [/electromagnetic spectrum|photon|wavelength|frequency|spectroscopy/i,"./science-diagrams/chemistry-electromagnetic-spectrum.svg","Philip Ronan / Wikimedia Commons / CC BY-SA 3.0",5],
    [/chromatograph|stationary phase|mobile phase|retention factor/i,"./science-diagrams/chemistry-chromatogram.svg","Wikimedia Commons / CC BY-SA",5],
    [/photoelectron|binding energy|electron configuration/i,"./science-diagrams/chemistry-photoelectron-spectrum.png","Wikimedia Commons / CC BY-SA",4],
    [/neuron|axon|dendrite|myelin|synap/i,"./science-diagrams/psychology-neuron.svg","BruceBlaus / Wikimedia Commons / CC BY 3.0",6],
    [/action potential|depolarization|repolarization|refractory/i,"./science-diagrams/psychology-action-potential.svg","Chris 73 / Wikimedia Commons / CC BY-SA",5],
    [/brainstem|medulla|pons|reticular formation/i,"./science-diagrams/psychology-brainstem.svg","OpenStax / Wikimedia Commons / CC BY 4.0",4],
    [/auditory|cochlea|inner ear|hearing|sound transduction/i,"./science-diagrams/psychology-inner-ear.svg","OpenStax / Wikimedia Commons / CC BY 4.0",4],
  ];
  let visualCount = decks.flatMap((deck) => deck.cards).filter((card) => card.backImage).length;
  visualRules.forEach(([pattern, image, imageCredit, limit]) => {
    let used = 0;
    for (const card of decks.flatMap((deck) => deck.cards)) {
      if (visualCount >= 90 || used >= limit) break;
      if (card.backImage || !pattern.test(`${card.front} ${card.back}`)) continue;
      card.backImage = image; card.imageCredit = imageCredit; visualCount += 1; used += 1;
    }
  });
  window.MCAT_REVIEW_DECKS = decks;
})();
