const state = {
  activeCourse: null,
  activeChapter: 0,
  activeMiniUnit: 0,
  activeSection: 0,
  activeView: "lesson",
  selectedAnkiDecks: null,
  ankiQueue: [],
  ankiPosition: 0,
  ankiSessionTotal: 0,
  ankiReviewActive: false,
  ankiStartedAt: null,
  selectedFlashcardDecks: null,
  flashcardQueue: [],
  flashcardPosition: 0,
  flashcardReviewActive: false,
  selectedFeynmanDecks: null,
  feynmanQueue: [],
  feynmanPosition: 0,
  feynmanActive: false,
  feynmanFinished: false,
  feynmanStartedAt: null,
  feynmanResponse: "",
  feynmanTimeAmount: 5,
  feynmanTimeUnit: "minutes",
  customDraft: [],
  customQuestionDraft: [],
  customFeynmanDraft: [],
  customImportSource: null,
  editingCustomDeckId: null,
  editingBuiltInCollectionId: null,
  selectedCustomDeckId: null,
  selectedCustomDeckBuiltIn: false,
  selectedBuiltInCollectionId: null,
  selectedBuiltInUnitIds: [],
  pendingCustomDeleteId: null,
  pendingBuiltInDeleteId: null,
  pendingDeleteAllStudySets: false,
  customStudyReturnView: "flashcards",
  customDeleteReturnView: "flashcards",
  courseReturnView: "courses",
  customReviewMode: "regular",
  customReviewCards: [],
  customReviewPosition: 0,
  customAnkiSessionTotal: 0,
  customReviewRevealed: false,
  customReviewWasRevealed: false,
  customReviewStartedAt: null,
  customQuestionAnswered: false,
  customFeynmanTimeAmount: 5,
  customFeynmanTimeUnit: "minutes",
  customFeynmanStartedAt: null,
  manualFrontImage: "",
  manualBackImage: "",
  pendingCardImageTarget: null,
};

const SETTINGS_KEY = "your-study-buddy-settings-v1";
const DEFAULT_SETTINGS = {
  theme: "light", newCardsPerDay: 20, maxReviewsPerDay: 200,
  newCardOrder: "random", newReviewOrder: "reviews-first",
  learningSteps: "1, 10", graduatingInterval: 1, easyInterval: 4, startingEase: 250,
  hardInterval: 120, easyBonus: 130, intervalModifier: 100, maximumInterval: 36500,
  relearningSteps: "10", minimumLapseInterval: 1, leechThreshold: 8, leechAction: "tag",
};

function loadSettings() {
  try {
    const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    if (!['light', 'dark'].includes(settings.theme)) settings.theme = "light";
    return settings;
  }
  catch { return { ...DEFAULT_SETTINGS }; }
}

function numericSetting(name) {
  const value = Number(loadSettings()[name]);
  return Number.isFinite(value) ? value : Number(DEFAULT_SETTINGS[name]);
}

function parseMinuteSteps(value) {
  const steps = String(value || "").split(/[\s,]+/).map(Number).filter((number) => Number.isFinite(number) && number > 0).map((number) => Math.min(15, number));
  return steps.length ? steps : [1];
}

function effectiveTheme(theme = loadSettings().theme) {
  return theme === "dark" ? "dark" : "light";
}

function applyTheme(theme = loadSettings().theme) {
  document.documentElement.dataset.theme = effectiveTheme(theme);
  document.documentElement.style.colorScheme = effectiveTheme(theme);
}

const apHumanGeographyFeynmanTopics = {
  "aphug-unit-1": ["Geographic data", "Spatial concepts", "Map projections", "Scale of analysis", "Regional analysis", "Human-environment interaction"],
  "aphug-unit-2": ["Population distribution", "Population composition", "Demographic transition", "Population policies", "Migration causes", "Forced migration", "Migration consequences"],
  "aphug-unit-3": ["Concepts of culture", "Cultural landscapes", "Cultural diffusion", "Language patterns", "Religious patterns", "Ethnicity and identity"],
  "aphug-unit-4": ["States and nations", "Political boundaries", "International organizations", "Internal boundaries", "Devolution", "Challenges to sovereignty"],
  "aphug-unit-5": ["Origins of agriculture", "Agricultural revolutions", "Subsistence agriculture", "Commercial agriculture", "Von Thünen model", "Environmental effects of agriculture"],
  "aphug-unit-6": ["Economic sectors", "Measures of development", "Industrial location", "Global trade", "Women and development", "Sustainable development"],
  "aphug-unit-7": ["City types", "Urban origins and growth", "Urban hierarchy", "Urban land-use models", "Suburbanization", "Informal settlements", "Urban sustainability"],
};

const builtInHumanGeographyDecks = (window.AP_HUMAN_GEOGRAPHY_DECKS || []).map((deck) => ({
  ...deck,
  feynmanPrompts: (apHumanGeographyFeynmanTopics[deck.id] || []).map((prompt, index) => ({ id: `${deck.id}-f${index + 1}`, prompt })),
}));
const builtInWorldHistoryDecks = window.AP_WORLD_HISTORY_DECKS || [];
const builtInEnvironmentalScienceDecks = window.AP_ENVIRONMENTAL_SCIENCE_DECKS || [];
const builtInEuropeanHistoryDecks = window.AP_EUROPEAN_HISTORY_DECKS || [];
const builtInGovernmentDecks = window.AP_US_GOVERNMENT_DECKS || [];
const builtInSatVocabularyDecks = window.SAT_VOCABULARY_DECKS || [];
const builtInPsychologyDecks = window.AP_PSYCHOLOGY_DECKS || [];
const builtInFlashcardDecks = [...builtInHumanGeographyDecks, ...builtInWorldHistoryDecks, ...builtInEnvironmentalScienceDecks, ...builtInEuropeanHistoryDecks, ...builtInGovernmentDecks, ...builtInSatVocabularyDecks, ...builtInPsychologyDecks];
const builtInFlashcardCollections = [{
  id: "aphug",
  name: "AP Human Geography",
  description: "Highlighted terms and broad Feynman topics from the AP Human Geography guide, organized into Units 1–7.",
  units: builtInHumanGeographyDecks,
}, {
  id: "apworld",
  name: "AP World History",
  description: "Explanation, comparison, cause-and-effect, and significance cards grounded in the AP World History guide, organized into Units 1–9.",
  units: builtInWorldHistoryDecks,
}, {
  id: "apes",
  name: "AP Environmental Science",
  description: "Source-aligned environmental science terms and broad Feynman topics from the supplied guide, organized by its seven unit sections.",
  units: builtInEnvironmentalScienceDecks,
}, {
  id: "apeuro",
  name: "AP European History",
  description: "Source-aligned people, events, institutions, ideas, and broad Feynman topics from the supplied review, organized into Units 1–9.",
  units: builtInEuropeanHistoryDecks,
}, {
  id: "apgov",
  name: "AP U.S. Government and Politics",
  description: "Curated institutions, constitutional principles, court cases, civil rights, political beliefs, and participation concepts organized into Units 1–5.",
  units: builtInGovernmentDecks,
}, {
  id: "sat-vocabulary",
  name: "SAT Vocabulary",
  description: "A large SAT vocabulary library divided into five stable, randomly mixed sections of about 200 words each.",
  unitLabel: "mixes",
  catalogLabel: "SAT preparation",
  units: builtInSatVocabularyDecks,
}, {
  id: "appsych",
  name: "AP Psychology",
  description: "Vocabulary from the supplied Myers resource, organized into Unit 0 for statistics, research methods, and ethics plus the five current AP Psychology content units.",
  unitLabel: "sections",
  catalogLabel: "AP course",
  units: builtInPsychologyDecks,
}];

const courses = [
  {
    id: "biology", code: "BIO", title: "Campbell Biology 12e", icon: "⌁", color: "green", level: "Biology", duration: "8 units",
    description: "Eight units and 56 chapter-sized mini-units with textbook-aligned vocabulary and chapter topics.",
    sourceTitle: "Campbell Biology, 12th Edition",
    studyBasis: "Terms come from the chapter reviews and glossary; definitions are cleaned and shortened for study.",
    chapters: [
      lesson("The Chemistry of Life", "Life depends on the properties of matter, water, carbon, and large biological molecules. Chemical structure helps explain how molecules behave inside organisms.", ["Water's polarity supports hydrogen bonding and makes it an effective solvent.", "Carbon can form four covalent bonds and build diverse frameworks.", "Carbohydrates, lipids, proteins, and nucleic acids perform different cellular jobs."], [["Why is water polar?", "Oxygen attracts shared electrons more strongly than hydrogen."], ["What are the four major biological macromolecules?", "Carbohydrates, lipids, proteins, and nucleic acids."], ["Why is carbon chemically versatile?", "It can form four stable covalent bonds and many kinds of skeletons."]], ["Which interaction forms between neighboring water molecules?", ["Peptide bonds", "Hydrogen bonds", "Ionic crystals", "Phosphodiester bonds"], 1]),
      lesson("The Cell", "Cells are life's basic units. Their membranes regulate exchange, their internal structures divide work, and energy transformations power cellular activity.", ["Membranes are selectively permeable phospholipid bilayers.", "Eukaryotic organelles create specialized environments.", "Cellular respiration and photosynthesis transform energy.", "Cell signaling coordinates responses."], [["What is the cell membrane's main role?", "It selectively controls movement between the cell and its environment."], ["Where are proteins assembled?", "At ribosomes."], ["What do mitochondria do?", "They convert energy from fuel molecules into ATP through cellular respiration."]], ["Which structure produces most ATP in a eukaryotic cell?", ["Golgi apparatus", "Mitochondrion", "Lysosome", "Nucleus"], 1]),
      lesson("Genetics", "Genetic information flows from DNA to RNA to protein and is transmitted through cell division and reproduction. Variation arises through mutation, recombination, and independent assortment.", ["Genes are DNA sequences that contribute to inherited traits.", "Meiosis creates haploid cells and reshuffles alleles.", "Gene expression connects genotype with phenotype.", "Regulation determines when and where genes are active."], [["What is an allele?", "One of multiple versions of a gene."], ["What does meiosis produce?", "Genetically varied haploid cells."], ["What is gene expression?", "The use of genetic information to produce a functional RNA or protein."]], ["A heterozygous individual has…", ["Two identical alleles", "Two different alleles", "No alleles", "Only recessive traits"], 1]),
      lesson("Mechanisms of Evolution", "Evolution is change in inherited characteristics across generations. Natural selection, genetic drift, gene flow, and mutation alter populations in different ways.", ["Natural selection increases variants that improve reproductive success in a given environment.", "Genetic drift changes allele frequencies by chance.", "Gene flow moves alleles between populations.", "Speciation requires the evolution of reproductive isolation."], [["What is natural selection?", "Differential survival and reproduction associated with heritable variation."], ["What is genetic drift?", "Random change in allele frequencies, especially strong in small populations."], ["What is reproductive isolation?", "Barriers that prevent populations from exchanging genes successfully."]], ["Which mechanism changes allele frequencies purely by chance?", ["Natural selection", "Genetic drift", "Gene flow", "Assortative mating"], 1]),
      lesson("The Evolutionary History of Biological Diversity", "Shared ancestry explains both the unity and diversity of life. Phylogenies organize evolutionary relationships, while fossils and molecular evidence reveal major transitions.", ["Phylogenetic trees are hypotheses about relationships.", "Three domains organize cellular life: Bacteria, Archaea, and Eukarya.", "Endosymbiosis helps explain mitochondria and chloroplasts.", "Major lineages diversified through adaptation and extinction."], [["What does a branch point represent?", "The most recent common ancestor of descendant lineages."], ["What is endosymbiosis?", "A relationship in which one organism lives inside another; it explains the origin of some organelles."], ["What are the three domains?", "Bacteria, Archaea, and Eukarya."]], ["Mitochondria most likely originated from…", ["Infolded nuclear membranes", "Engulfed bacteria", "Viral particles", "Cell-wall fragments"], 1]),
      lesson("Plant Form and Function", "Plants acquire light, water, minerals, and carbon dioxide while coordinating growth across roots, stems, and leaves. Transport and signaling connect the entire organism.", ["Roots anchor plants and absorb water and minerals.", "Xylem transports water; phloem transports sugars.", "Stomata balance carbon dioxide uptake with water loss.", "Plant hormones coordinate development and environmental responses."], [["What does xylem transport?", "Water and dissolved minerals, mainly from roots upward."], ["What does phloem transport?", "Sugars and other organic products between sources and sinks."], ["What is a stoma?", "A regulated pore that controls gas exchange and water loss."]], ["Which tissue transports sugars?", ["Xylem", "Phloem", "Epidermis", "Cork"], 1]),
      lesson("Animal Form and Function", "Animal bodies maintain internal stability through coordinated tissues, organs, and feedback systems. Exchange, transport, signaling, defense, and reproduction depend on specialized structures.", ["Negative feedback helps maintain homeostasis.", "Nervous and endocrine signals coordinate body functions.", "Circulatory systems move gases, nutrients, wastes, and signals.", "Immune defenses distinguish threats from the body's own cells."], [["What is homeostasis?", "Regulation that keeps internal conditions within workable ranges."], ["What is negative feedback?", "A response that counteracts a deviation from a set range."], ["How do nervous and endocrine signals differ?", "Nervous signals are often rapid and targeted; endocrine signals travel as hormones and are often slower and broader."]], ["Which process usually stabilizes body temperature?", ["Positive feedback", "Negative feedback", "Genetic drift", "Osmosis alone"], 1]),
      lesson("Ecology", "Ecology examines how organisms interact with one another and with their physical environment, from individual behavior to global energy flow and nutrient cycles.", ["Population size changes through births, deaths, immigration, and emigration.", "Species interactions shape communities.", "Energy flows through ecosystems while matter cycles.", "Biodiversity supports resilience and ecosystem services."], [["What is a population?", "Individuals of the same species living in the same area."], ["How does energy move through an ecosystem?", "It flows through trophic levels and is eventually lost as heat."], ["What is carrying capacity?", "The largest population an environment can sustain over time under given conditions."]], ["Which statement about ecosystem energy is correct?", ["It cycles indefinitely", "It flows and is lost as heat", "It increases at higher trophic levels", "It is created by consumers"], 1]),
    ],
  },
];

const miniUnitsByUnit = [
  [
    miniUnit(1, "Evolution, the Themes of Biology, and Scientific Inquiry", "levels of organization|information flow|energy and matter|biological interactions|natural selection|scientific inquiry"),
    miniUnit(2, "The Chemical Context of Life", "elements of life|atomic structure|isotopes|electron shells|chemical bonds|chemical reactions"),
    miniUnit(3, "Water and Life", "water polarity|hydrogen bonding|cohesion and adhesion|temperature moderation|solutions and solutes|acids bases and pH"),
    miniUnit(4, "Carbon and the Molecular Diversity of Life", "carbon skeletons|hydrocarbons|isomers|functional groups|organic chemistry|ATP structure"),
    miniUnit(5, "The Structure and Function of Large Biological Molecules", "polymer formation|carbohydrates|lipids|protein structure|nucleic acids|genomics and proteomics"),
  ],
  [
    miniUnit(6, "A Tour of the Cell", "microscopy|prokaryotic and eukaryotic cells|nucleus and ribosomes|endomembrane system|mitochondria and chloroplasts|cytoskeleton and junctions"),
    miniUnit(7, "Membrane Structure and Function", "fluid mosaic model|selective permeability|diffusion and osmosis|facilitated diffusion|active transport|exocytosis and endocytosis"),
    miniUnit(8, "An Introduction to Metabolism", "metabolic pathways|thermodynamics|free energy|ATP coupling|enzyme catalysis|metabolic regulation"),
    miniUnit(9, "Cellular Respiration and Fermentation", "redox reactions|glycolysis|pyruvate oxidation|citric acid cycle|oxidative phosphorylation|fermentation"),
    miniUnit(10, "Photosynthesis", "chloroplast structure|light reactions|photosystems|electron transport|Calvin cycle|C4 and CAM pathways"),
    miniUnit(11, "Cell Communication", "signal reception|membrane receptors|signal transduction|second messengers|cellular response|apoptosis"),
    miniUnit(12, "The Cell Cycle", "chromosome organization|interphase|mitosis|cytokinesis|cell-cycle control|cancer cells"),
  ],
  [
    miniUnit(13, "Meiosis and Sexual Life Cycles", "chromosome sets|fertilization|stages of meiosis|crossing over|mitosis versus meiosis|sources of genetic variation"),
    miniUnit(14, "Mendel and the Gene Idea", "law of segregation|independent assortment|probability rules|testcrosses|complex inheritance|pedigrees"),
    miniUnit(15, "The Chromosomal Basis of Inheritance", "chromosome theory|sex-linked genes|genetic linkage|recombination maps|chromosome alterations|non-Mendelian inheritance"),
    miniUnit(16, "The Molecular Basis of Inheritance", "DNA as genetic material|double-helix structure|semiconservative replication|replication enzymes|DNA repair|chromatin organization"),
    miniUnit(17, "Gene Expression: From Gene to Protein", "transcription|RNA processing|genetic code|translation|protein targeting|mutations"),
    miniUnit(18, "Regulation of Gene Expression", "operons|chromatin regulation|transcription factors|noncoding RNA|cell differentiation|cancer genetics"),
    miniUnit(19, "Viruses", "viral structure|host dependence|phage cycles|animal virus cycles|emerging viruses|prions"),
    miniUnit(20, "DNA Tools and Biotechnology", "DNA sequencing|recombinant DNA|PCR|gene-expression analysis|cloning and stem cells|genome editing"),
    miniUnit(21, "Genomes and Their Evolution", "genome sequencing|bioinformatics|genome size|multigene families|transposable elements|comparative genomics"),
  ],
  [
    miniUnit(22, "Descent with Modification: A Darwinian View of Life", "Darwin's observations|natural selection|homology|fossil evidence|biogeography|evolutionary adaptation"),
    miniUnit(23, "The Evolution of Populations", "genetic variation|Hardy-Weinberg equilibrium|natural selection|genetic drift|gene flow|sexual selection"),
    miniUnit(24, "The Origin of Species", "species concepts|reproductive barriers|allopatric speciation|sympatric speciation|hybrid zones|rates of speciation"),
    miniUnit(25, "The History of Life on Earth", "origin of life|fossil record|mass extinctions|continental drift|adaptive radiations|evo-devo"),
  ],
  [
    miniUnit(26, "Phylogeny and the Tree of Life", "phylogenetic trees|homology and analogy|cladistics|shared derived characters|molecular clocks|horizontal gene transfer"),
    miniUnit(27, "Bacteria and Archaea", "prokaryotic structure|binary fission|genetic variation|metabolic diversity|bacterial domains|ecological roles"),
    miniUnit(28, "Protists", "eukaryotic diversity|endosymbiosis|excavates|SAR clade|archaeplastids|unicellular ecology"),
    miniUnit(29, "Plant Diversity I: How Plants Colonized Land", "green-algal ancestry|land-plant adaptations|alternation of generations|bryophytes|vascular tissue|seedless vascular plants"),
    miniUnit(30, "Plant Diversity II: The Evolution of Seed Plants", "seed adaptations|gymnosperms|angiosperms|flowers and fruits|plant life cycles|plant conservation"),
    miniUnit(31, "Fungi", "absorptive nutrition|hyphae and mycelia|fungal life cycles|fungal phylogeny|decomposition|mutualism"),
    miniUnit(32, "An Overview of Animal Diversity", "animal characteristics|embryonic development|body symmetry|tissue layers|body cavities|animal phylogeny"),
    miniUnit(33, "An Introduction to Invertebrates", "sponges|cnidarians|lophotrochozoans|molluscs and annelids|ecdysozoans|echinoderms"),
    miniUnit(34, "The Origin and Evolution of Vertebrates", "chordate traits|early vertebrates|jawed vertebrates|tetrapods|amniotes|mammals and humans"),
  ],
  [
    miniUnit(35, "Vascular Plant Structure, Growth, and Development", "plant organs|plant tissues|meristems|primary growth|secondary growth|cell differentiation"),
    miniUnit(36, "Resource Acquisition and Transport in Vascular Plants", "root architecture|apoplast and symplast|xylem transport|transpiration|stomatal control|phloem translocation"),
    miniUnit(37, "Soil and Plant Nutrition", "soil structure|essential elements|mineral deficiency|nitrogen fixation|mycorrhizae|sustainable agriculture"),
    miniUnit(38, "Angiosperm Reproduction and Biotechnology", "flower anatomy|pollination|double fertilization|seed and fruit development|asexual reproduction|crop biotechnology"),
    miniUnit(39, "Plant Responses to Internal and External Signals", "signal transduction|plant hormones|tropisms|photoperiodism|stress responses|plant defenses"),
  ],
  [
    miniUnit(40, "Basic Principles of Animal Form and Function", "structure-function relationships|animal tissues|homeostasis|feedback control|thermoregulation|metabolic rate"),
    miniUnit(41, "Animal Nutrition", "essential nutrients|feeding strategies|digestion|absorption|digestive adaptations|appetite regulation"),
    miniUnit(42, "Circulation and Gas Exchange", "open and closed circulation|heart cycles|blood vessels|blood components|respiratory surfaces|gas transport"),
    miniUnit(43, "The Immune System", "innate immunity|antigens|B cells and antibodies|T cells|immunological memory|immune disorders"),
    miniUnit(44, "Osmoregulation and Excretion", "osmolarity|nitrogenous wastes|excretory systems|nephron function|water conservation|hormonal regulation"),
    miniUnit(45, "Hormones and the Endocrine System", "hormone classes|target receptors|feedback pathways|hypothalamus and pituitary|stress hormones|sex hormones"),
    miniUnit(46, "Animal Reproduction", "asexual and sexual reproduction|fertilization|reproductive anatomy|gametogenesis|hormonal cycles|embryonic pregnancy"),
    miniUnit(47, "Animal Development", "fertilization|cleavage|gastrulation|organogenesis|cell-fate determination|pattern formation"),
    miniUnit(48, "Neurons, Synapses, and Signaling", "neuron structure|resting potential|action potentials|synaptic transmission|neurotransmitters|signal integration"),
    miniUnit(49, "Nervous Systems", "neural circuits|central and peripheral systems|brain regions|cerebral cortex|memory and learning|nervous-system disorders"),
    miniUnit(50, "Sensory and Motor Mechanisms", "sensory reception|mechanoreception|hearing and balance|vision|taste and smell|muscle contraction"),
    miniUnit(51, "Animal Behavior", "behavioral ecology|fixed action patterns|learning|communication|foraging|mating and social behavior"),
  ],
  [
    miniUnit(52, "An Introduction to Ecology and the Biosphere", "ecological levels|climate patterns|terrestrial biomes|aquatic biomes|species distributions|global change"),
    miniUnit(53, "Population Ecology", "population density|demography|exponential growth|logistic growth|life histories|population regulation"),
    miniUnit(54, "Community Ecology", "interspecific competition|predation|symbiosis|species diversity|trophic structure|ecological succession"),
    miniUnit(55, "Ecosystems and Restoration Ecology", "primary production|energy transfer|nutrient cycling|decomposition|restoration ecology|human nutrient impacts"),
    miniUnit(56, "Conservation Biology and Global Change", "biodiversity loss|small-population dynamics|landscape conservation|ecosystem services|climate change|sustainability"),
  ],
];

courses[0].chapters.forEach((unit, index) => { unit.miniUnits = miniUnitsByUnit[index]; });
courses[0].chapters.flatMap((unit) => unit.miniUnits).forEach((chapter) => {
  const vocabulary = window.CAMPBELL_VOCABULARY?.[chapter.number];
  if (vocabulary?.length) {
    const preparedVocabulary = prepareTextbookVocabulary(expandedVocabulary("campbell", chapter.number, vocabulary), "campbell", chapter.number);
    chapter.source = "campbell";
    chapter.textbookTerms = preparedVocabulary.map(([term]) => term);
    chapter.cards = vocabularyDeck(preparedVocabulary);
    chapter.topics = chapter.textbookTerms;
    chapter.quizzes = vocabularyQuizzes(preparedVocabulary, chapter.number, 5);
    chapter.quiz = chapter.quizzes[0];
  }
});
const photosynthesisChapter = courses[0].chapters.flatMap((unit) => unit.miniUnits).find((chapter) => chapter.number === 10);
photosynthesisChapter.cards = vocabularyDeck([
  ["photosynthesis", "The process that converts light energy into chemical energy stored in sugars and other organic molecules."],
  ["autotroph", "An organism that produces its own organic food from inorganic materials using light or chemical energy."],
  ["heterotroph", "An organism that obtains organic molecules by consuming other organisms or their products."],
  ["chloroplast", "The plant and algal organelle where photosynthesis occurs."],
  ["mesophyll", "The leaf tissue containing many chloroplast-rich cells and carrying out most photosynthesis."],
  ["stoma", "A regulated pore in the leaf epidermis that allows carbon dioxide to enter and oxygen and water vapor to leave."],
  ["stroma", "The fluid-filled region of a chloroplast surrounding the thylakoids; the Calvin cycle occurs here."],
  ["thylakoid", "A flattened membrane sac inside a chloroplast; its membrane contains the machinery for the light reactions."],
  ["granum", "A stack of thylakoids inside a chloroplast."],
  ["chlorophyll", "A green pigment that absorbs light energy used in photosynthesis."],
  ["carbon fixation", "The incorporation of inorganic carbon dioxide into an organic molecule."],
  ["light reactions", "Reactions in the thylakoid membrane that use light and water to produce ATP and NADPH while releasing oxygen."],
  ["Calvin cycle", "A cycle in the stroma that uses ATP and NADPH to reduce carbon dioxide and produce G3P."],
  ["NADP+", "The oxidized electron carrier that accepts electrons and hydrogen during the light reactions."],
  ["NADPH", "The reduced electron carrier that supplies high-energy electrons to the Calvin cycle."],
  ["phosphorylation", "The addition of a phosphate group to a molecule; cells commonly use it to transfer energy or regulate protein activity."],
  ["photophosphorylation", "The light-driven production of ATP by chemiosmosis in a chloroplast."],
  ["photon", "A discrete packet of light energy."],
  ["wavelength", "The distance between corresponding points of successive waves, such as crest to crest."],
  ["electromagnetic spectrum", "The complete range of electromagnetic radiation, from short gamma rays to long radio waves."],
  ["visible light", "The portion of the electromagnetic spectrum detectable by human eyes and usable by photosynthetic pigments."],
  ["spectrophotometer", "An instrument that measures how much light a substance absorbs at different wavelengths."],
  ["absorption spectrum", "A graph showing how strongly a pigment absorbs different wavelengths of light."],
  ["action spectrum", "A graph showing how effective different wavelengths are at driving a biological process such as photosynthesis."],
  ["chlorophyll a", "The primary photosynthetic pigment in reaction centers; it directly participates in the light reactions."],
  ["chlorophyll b", "An accessory pigment that broadens the range of light a plant can use and transfers energy to chlorophyll a."],
  ["carotenoid", "A yellow-orange accessory pigment that absorbs additional wavelengths and helps protect chlorophyll from excess light."],
  ["photosystem", "A thylakoid-membrane unit made of a reaction-center complex surrounded by light-harvesting complexes."],
  ["light-harvesting complex", "A group of pigment molecules bound to proteins that captures light and transfers energy toward a reaction center."],
  ["reaction-center complex", "A protein complex containing a special chlorophyll pair and a primary electron acceptor."],
  ["primary electron acceptor", "The molecule that receives an excited electron from reaction-center chlorophyll."],
  ["photosystem II (PS II)", "The photosystem that absorbs light at P680, splits water, releases oxygen, and begins linear electron flow."],
  ["P680", "The reaction-center chlorophyll a pair in photosystem II, named for its best absorption near 680 nanometers."],
  ["photosystem I (PS I)", "The photosystem that absorbs light at P700 and supplies electrons used to reduce NADP+ to NADPH."],
  ["P700", "The reaction-center chlorophyll a pair in photosystem I, named for its best absorption near 700 nanometers."],
  ["linear electron flow", "Electron movement from water through photosystems II and I to NADP+, producing oxygen, ATP, and NADPH."],
  ["cyclic electron flow", "Electron cycling around photosystem I that produces ATP without producing NADPH or oxygen."],
  ["chemiosmosis", "The use of energy stored in a proton gradient to drive ATP synthesis."],
  ["proton gradient", "A difference in hydrogen-ion concentration across a membrane that stores potential energy."],
  ["ATP synthase", "A membrane enzyme that makes ATP as hydrogen ions flow through it down their electrochemical gradient."],
  ["glyceraldehyde 3-phosphate (G3P)", "The three-carbon sugar produced by the Calvin cycle and used to build glucose and other organic molecules."],
  ["rubisco", "The Calvin-cycle enzyme that attaches carbon dioxide to RuBP during carbon fixation."],
  ["RuBP", "The five-carbon carbon-dioxide acceptor that begins the Calvin cycle and is regenerated at the cycle's end."],
  ["reduction phase", "The Calvin-cycle phase in which ATP and NADPH convert carbon-fixation products into G3P."],
  ["regeneration phase", "The Calvin-cycle phase that uses ATP to rebuild RuBP so carbon fixation can continue."],
  ["C3 plant", "A plant whose first stable product of carbon fixation is a three-carbon compound."],
  ["photorespiration", "A process in which rubisco adds oxygen instead of carbon dioxide to RuBP, consuming energy and releasing carbon dioxide."],
  ["C4 plant", "A plant that first fixes carbon dioxide into a four-carbon compound and concentrates carbon dioxide in bundle-sheath cells."],
  ["bundle-sheath cell", "A cell surrounding a leaf vein where C4 plants concentrate carbon dioxide and run the Calvin cycle."],
  ["PEP carboxylase", "The enzyme that initially fixes carbon dioxide in C4 and CAM plants and has a high affinity for carbon dioxide."],
  ["crassulacean acid metabolism (CAM)", "A water-saving pathway that fixes carbon dioxide at night and releases it for the Calvin cycle during the day."],
  ["CAM plant", "A plant that opens its stomata mainly at night and separates initial carbon fixation from the Calvin cycle by time."],
], [
  ["How do the light reactions and Calvin cycle depend on each other?", "The light reactions supply ATP and NADPH to the Calvin cycle; the Calvin cycle returns ADP, phosphate, and NADP+ for reuse."],
  ["How do photosystem II and photosystem I differ?", "Photosystem II begins linear flow by extracting electrons from water at P680; photosystem I re-energizes electrons at P700 so NADPH can form."],
  ["How do linear and cyclic electron flow differ?", "Linear flow uses both photosystems and produces ATP, NADPH, and oxygen. Cyclic flow uses photosystem I and produces additional ATP only."],
  ["How do C4 and CAM plants limit photorespiration?", "C4 plants separate initial carbon fixation and the Calvin cycle by location; CAM plants separate them by time."],
]);
courses[0].cardCount = courses[0].chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);

function lesson(title, summary, takeaways, cards, quiz) {
  return { title, summary, takeaways, cards, quiz: { question: quiz[0], options: quiz[1], answer: quiz[2] } };
}

function vocabularyDeck(entries, processCards = []) {
  const cards = entries.map(([term, definition], index) => {
    switch (index % 5) {
      case 0: return [definitionQuestion(term, definition), definition];
      case 1: return [`Describe ${term}.`, definition];
      case 2: return [`Which term does this definition describe? ${definition}`, term];
      case 3: return [functionQuestion(term, definition), definition];
      default: return [definitionQuestion(term, definition), definition];
    }
  });
  return cards.concat(processCards);
}

function prepareTextbookVocabulary(entries, source, chapterNumber) {
  const contextualDefinitions = {
    "campbell:2:ion": "An atom or molecule with a net electrical charge caused by gaining or losing electrons.",
    "campbell:6:nucleus": "The membrane-enclosed organelle that contains most of a eukaryotic cell's DNA.",
    "campbell:6:chromatin": "DNA and associated proteins that make up eukaryotic chromosomes.",
    "campbell:49:nucleus": "A cluster of neuron cell bodies within the central nervous system.",
  };
  const termCorrections = { "netic drift": "genetic drift" };
  const seen = new Set();
  return entries.map(([rawTerm, rawDefinition]) => {
    const term = (termCorrections[rawTerm] || rawTerm).replace(/\s+/g, " ").trim();
    const key = `${source}:${chapterNumber}:${term.toLowerCase()}`;
    const definition = (contextualDefinitions[key] || rawDefinition)
      .replace(/^\)\s*/, "")
      .replace(/\bknowl edge\b/gi, "knowledge")
      .replace(/\bpolypeps tides\b/gi, "polypeptides")
      .replace(/\bthree[- ]dimensional\b/gi, "three-dimensional")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    return [term, definition];
  }).filter(([term, definition]) => {
    const normalized = term.toLowerCase();
    if (!term || !definition || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function expandedVocabulary(source, chapterNumber, entries) {
  const additions = window.TEXTBOOK_VOCABULARY_EXPANSIONS?.[source]?.[chapterNumber] || [];
  return entries.concat(additions);
}

function definitionQuestion(term, definition) {
  const pluralEnding = /\b(acids|alleles|animals|attractions|bases|biomes|bonds|carbohydrates|cells|chromosomes|communities|ecosystems|enzymes|forces|genes|hormones|interactions|ions|lipids|molecules|neurons|observations|organisms|organelles|plants|populations|proteins|reactions|systems|tissues)\b/i;
  const irregularPlural = /^(data|fungi|nuclei|ova|stimuli)$/i.test(term);
  const plural = term.includes(" and ") || pluralEnding.test(term) || irregularPlural;
  if (plural) return `What are ${term}?`;
  const domainName = /^(Archaea|Bacteria|Eukarya)$/i.test(term) && /^[A-Z]/.test(term);
  const bareConcept = /(?:tion|sion|sis|ism|ics|ity|ence|ance|logy|metry|pathy|genesis|chemistry|energy|matter|heat|water|science|technology|inquiry|DNA|RNA|ATP)$/i.test(term);
  const adjective = /^(?:aerobic|anaerobic|abiotic|biotic|hydrophilic|hydrophobic|hypertonic|hypotonic|isotonic|endothermic|exothermic)$/i.test(term);
  if (domainName || bareConcept || adjective) return `What is ${term}?`;
  const countable = /^(?:A|An|One|Any)\b/.test(definition) || /\b(cell|community|ecosystem|molecule|organelle|organism|species)$/i.test(term);
  if (!countable) return `What is ${term}?`;
  const article = /^[aeio]/i.test(term) || /^h(?:erb|our)/i.test(term) ? "an" : "a";
  return `What is ${article} ${term}?`;
}

function functionQuestion(term, definition) {
  const hasBiologicalFunction = /\b(cell|channel|complex|enzyme|hormone|membrane|molecule|organelle|organ|pigment|protein|pump|receptor|structure|tissue)\b/i.test(`${term} ${definition}`);
  return hasBiologicalFunction ? `What is the function of ${term}?` : `How does ${term} work?`;
}

function vocabularyQuizzes(entries, seed, count = 5) {
  const prompts = [
    "Which term matches this description?",
    "Which concept is defined below?",
    "Identify the concept defined below:",
    "Choose the term that best fits this definition:",
    "Which vocabulary term does this describe?",
  ];
  return Array.from({ length: Math.min(count, entries.length) }, (_, questionIndex) => {
    const correctEntryIndex = (seed * 3 + questionIndex * 7) % entries.length;
    const [correctTerm, definition] = entries[correctEntryIndex];
    const distractors = entries
      .map(([term], index) => ({ term, rank: (index - correctEntryIndex - seed - questionIndex + entries.length * 2) % entries.length }))
      .filter(({ term }) => term !== correctTerm)
      .sort((a, b) => a.rank - b.rank)
      .map(({ term }) => term)
      .filter((term, index, terms) => terms.indexOf(term) === index)
      .slice(0, 3);
    const answer = (seed + questionIndex) % 4;
    const options = [...distractors];
    options.splice(answer, 0, correctTerm);
    return { question: `${prompts[questionIndex % prompts.length]} ${definition}`, options, answer };
  });
}

function miniUnit(number, title, topicList) {
  const topics = topicList.split("|");
  const cards = [];
  topics.forEach((topic) => {
    cards.push([`What is ${topic}?`, `Define ${topic} in one sentence, then identify where it occurs and its direct biological role in ${title}.`]);
    cards.push([`Why is ${topic} important?`, `Connect ${topic} to the chapter's main process, focusing on the biological result it helps produce.`]);
    if (topic.length > 17 || topic.includes(" and ") || topic.includes("-")) {
      cards.push([`How does ${topic} work?`, `Trace ${topic} from its starting conditions through its key mechanism to its outcome.`]);
    }
  });
  for (let index = 0; index < topics.length - 1; index += 2) {
    cards.push([`How are ${topics[index]} and ${topics[index + 1]} connected?`, `Explain the relationship between ${topics[index]} and ${topics[index + 1]}, including one similarity or causal link and one meaningful distinction.`]);
  }
  return {
    number,
    title,
    topics,
    focusAreas: topics,
    summary: `This chapter develops six connected ideas: ${topics.join(", ")}. Use the lesson to build a mechanism-first explanation rather than memorizing isolated terms.`,
    takeaways: topics.slice(0, 4).map((topic) => `Explain ${topic} and connect it to the chapter's central biological problem.`),
    cards,
    quiz: { question: `Which term describes ${topics[0]}?`, options: [topics[0], topics[1], topics[2], topics[3]], answer: 0 },
  };
}

function companionChapter(spec, source) {
  const vocabulary = prepareTextbookVocabulary(expandedVocabulary(source, spec.number, spec.vocabulary), source, spec.number);
  const details = source === "atkins" ? window.ATKINS_CHAPTER_DETAILS?.[spec.number] : ["zumdahl", "central-science"].includes(source) ? spec : null;
  const sections = details?.sections || (source === "atkins" ? spec.focusAreas.map((title) => ({ title, topics: [] })) : null);
  const equationCards = source === "zumdahl"
    ? (spec.equations || []).map(([name, equation, application]) => [name, application, equation])
    : (details?.equations || []).map(([prompt, equation]) => atkinsEquationApplicationCard(prompt, equation, spec));
  return {
    number: spec.number,
    title: spec.title,
    source,
    topics: vocabulary.map(([term]) => term),
    focusAreas: spec.focusAreas,
    textbookTerms: vocabulary.map(([term]) => term),
    textbookVocabulary: vocabulary,
    summary: `This chapter connects ${spec.focusAreas.join(", ")} to build a clear, mechanism-first understanding of the subject.`,
    takeaways: spec.focusAreas.slice(0, 4).map((topic) => `Explain ${topic} using a clear cause-and-effect mechanism.`),
    sections,
    equations: equationCards,
    cards: vocabularyDeck(vocabulary).concat(equationCards),
    quizzes: vocabularyQuizzes(vocabulary, 100 + spec.number, 5),
  };
}

function expandCourseToAnkiTarget(course, target = 1000) {
  const chapters = course.chapters.flatMap((unit) => unit.miniUnits);
  const candidateDecks = chapters.map((chapter) => {
    const vocabulary = chapter.textbookVocabulary || [];
    return vocabulary.flatMap(([term, definition]) => {
      if (!term || !definition) return [];
      return [
        [`Which term does this definition describe? ${definition}`, term],
        [`What is the function or significance of ${term}?`, definition],
      ];
    });
  });
  let total = chapters.reduce((sum, chapter) => sum + chapter.cards.length, 0);
  let candidateIndex = 0;
  while (total < target && candidateDecks.some((deck) => candidateIndex < deck.length)) {
    chapters.forEach((chapter, chapterIndex) => {
      if (total >= target) return;
      const candidate = candidateDecks[chapterIndex][candidateIndex];
      if (candidate && !chapter.cards.some((card) => card[0] === candidate[0])) {
        chapter.cards.push(candidate);
        total += 1;
      }
    });
    candidateIndex += 1;
  }
}

function atkinsEquationApplicationCard(prompt, equation, chapter) {
  const aliases = {
    "State the perfect-gas equation.": "Perfect-gas equation",
    "State the compression factor.": "Compression factor",
    "State the pressure virial equation through the second virial coefficient.": "Pressure virial equation",
    "State the volume virial equation through the third virial coefficient.": "Volume virial equation",
    "State the van der Waals equation for n moles.": "Van der Waals equation",
    "Define a reduced variable.": "Reduced-variable relations",
    "State the First Law using the book's sign convention.": "First Law of thermodynamics",
    "State reversible pressure-volume work.": "Reversible expansion-work equation",
    "Relate heat to internal energy at constant volume.": "Constant-volume heat relation",
    "Relate heat to enthalpy at constant pressure.": "Constant-pressure heat relation",
    "Define enthalpy.": "Enthalpy definition",
    "State Kirchhoff's equation.": "Kirchhoff equation",
    "Relate perfect-gas heat capacities.": "Perfect-gas heat-capacity relation",
    "Define thermodynamic entropy change.": "Thermodynamic entropy equation",
    "State the Boltzmann formula.": "Boltzmann formula",
    "Define Helmholtz energy.": "Helmholtz-energy definition",
    "Define Gibbs energy.": "Gibbs-energy definition",
    "State the fundamental equation.": "Fundamental thermodynamic equation",
    "State the Gibbs-Helmholtz equation.": "Gibbs-Helmholtz equation",
  };
  const name = aliases[prompt] || prompt
    .replace(/^(State|Define|Write)\s+(the\s+)?/i, "")
    .replace(/^Relate\s+/i, "")
    .replace(/[.?]$/, "")
    .replace(/^./, (letter) => letter.toUpperCase());
  const tests = [
    [/perfect-gas equation/i, "Use it to relate pressure, volume, amount, and temperature when gas interactions are negligible."],
    [/compression factor/i, "Use it to measure how strongly a real gas departs from perfect-gas behavior."],
    [/virial/i, "Use it to model real-gas deviations from experimental pressure-volume-temperature data."],
    [/van der Waals/i, "Use it to estimate real-gas behavior while accounting for attractions and molecular size."],
    [/reduced-variable/i, "Use it to compare different gases at corresponding fractions of their critical conditions."],
    [/First Law/i, "Use it to account for energy transferred as heat and work and the resulting internal-energy change."],
    [/expansion-work/i, "Use it to calculate pressure-volume work along an expansion or compression path."],
    [/constant-volume heat/i, "Use it to obtain an internal-energy change from heat measured at constant volume."],
    [/constant-pressure heat/i, "Use it to obtain an enthalpy change from heat measured at constant pressure."],
    [/enthalpy definition/i, "Use it to define the state function used for heat changes in constant-pressure processes."],
    [/Kirchhoff/i, "Use it to adjust a reaction enthalpy from one temperature to another."],
    [/heat-capacity relation/i, "Use it to convert between constant-pressure and constant-volume heat capacities for a perfect gas."],
    [/entropy equation/i, "Use it to calculate entropy change along a reversible heat-transfer path."],
    [/Boltzmann/i, "Use it to connect macroscopic entropy with the number of accessible microscopic arrangements."],
    [/Helmholtz/i, "Use it to test spontaneity and maximum work at constant temperature and volume."],
    [/Gibbs-energy definition/i, "Use it to test spontaneity and equilibrium at constant temperature and pressure."],
    [/fundamental thermodynamic/i, "Use it to connect changes in internal energy with entropy and volume."],
    [/Gibbs-Helmholtz/i, "Use it to determine how Gibbs energy changes with temperature from enthalpy data."],
    [/Clapeyron/i, "Use it to calculate the slope of a phase boundary from transition enthalpy and volume."],
    [/chemical potential/i, "Use it to predict matter transfer, phase equilibrium, and composition changes."],
    [/Raoult/i, "Use it to calculate component vapor pressures in an ideal solution."],
    [/Henry/i, "Use it to relate dilute-solute concentration to partial pressure."],
    [/osmotic/i, "Use it to connect osmotic pressure with dilute-solute concentration and temperature."],
    [/phase rule/i, "Use it to count the independent intensive variables in a multiphase equilibrium."],
    [/lever rule/i, "Use it to calculate relative amounts of two coexisting phases."],
    [/reaction Gibbs/i, "Use it to determine reaction direction under nonstandard conditions."],
    [/equilibrium constant/i, "Use it to connect equilibrium composition with standard reaction Gibbs energy."],
    [/van 't Hoff/i, "Use it to predict how an equilibrium constant changes with temperature."],
    [/Nernst/i, "Use it to calculate cell potential from composition and standard potential."],
    [/de Broglie/i, "Use it to determine the wavelength associated with a moving particle."],
    [/Schrodinger/i, "Use it to obtain the allowed wavefunctions and energies of a quantum system."],
    [/uncertainty/i, "Use it to estimate the minimum joint uncertainty of conjugate observables."],
    [/box energies/i, "Use it to model quantized translational motion in a confined region."],
    [/harmonic/i, "Use it to approximate molecular vibrational energy levels."],
    [/rigid-rotor/i, "Use it to approximate rotational energy levels of a molecule."],
    [/Rydberg|hydrogenic/i, "Use it to calculate hydrogen-like atomic energies or spectral transitions."],
    [/bond order/i, "Use it to estimate bond strength and stability from molecular-orbital populations."],
    [/Beer-Lambert/i, "Use it to determine concentration from measured absorbance."],
    [/Larmor|resonance condition/i, "Use it to connect magnetic-field strength with nuclear resonance frequency."],
    [/chemical shift/i, "Use it to compare an NMR resonance with a reference and identify chemical environment."],
    [/partition function/i, "Use it to connect molecular energy levels and populations with thermodynamic properties."],
    [/Lennard-Jones/i, "Use it to model short-range repulsion and longer-range dispersion attraction."],
    [/Bragg/i, "Use it to obtain crystal-plane spacings from diffraction angles."],
    [/Fick/i, "Use it to calculate diffusive flux from a concentration gradient."],
    [/Arrhenius/i, "Use it to predict how a reaction rate constant changes with temperature."],
    [/Michaelis-Menten/i, "Use it to model the dependence of enzyme rate on substrate concentration."],
    [/Eyring/i, "Use it to connect a rate constant with activation Gibbs energy."],
    [/Marcus/i, "Use it to estimate electron-transfer barriers and rates."],
    [/Langmuir/i, "Use it to relate surface coverage to pressure for ideal monolayer adsorption."],
  ];
  const application = tests.find(([pattern]) => pattern.test(name))?.[1]
    || `Use it for quantitative problems involving ${chapter.focusAreas.slice(0, 2).join(" and ")}.`;
  return [name, application, equation];
}

const vandersCourse = {
  id: "physiology",
  code: "A&P",
  title: "Vander's Human Physiology 16e",
  icon: "∿",
  color: "blue",
  level: "Human physiology",
  duration: `${window.VANDERS_COURSE_DATA.units.length} units`,
  description: "Five study units and 19 chapters using Vander's chapter topics and key physiological terms.",
  sourceTitle: "Vander's Human Physiology, 16th Edition",
  studyBasis: "Terms and topics are aligned to the chapter text and glossary/index; definitions are paraphrased for study.",
  chapters: window.VANDERS_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "vanders");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
expandCourseToAnkiTarget(vandersCourse);
vandersCourse.cardCount = vandersCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(vandersCourse);

const atkinsCourse = {
  id: "physical-chemistry",
  code: "P-CHEM",
  title: "Atkins' Physical Chemistry 8e",
  icon: "⚗",
  color: "coral",
  level: "Physical chemistry",
  duration: `${window.ATKINS_COURSE_DATA.units.length} units`,
  description: "Three parts and 25 chapters using Atkins' section structure and checklist concepts.",
  sourceTitle: "Atkins' Physical Chemistry, 8th Edition",
  studyBasis: "Terms and topics are aligned to section headings, checklists of key ideas, and the index; definitions are paraphrased for study.",
  chapters: window.ATKINS_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "atkins");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
expandCourseToAnkiTarget(atkinsCourse);
atkinsCourse.cardCount = atkinsCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(atkinsCourse);

const ravenCourse = {
  id: "plant-biology",
  code: "BOT",
  title: "Raven Biology of Plants 8e",
  icon: "❧",
  color: "teal",
  level: "Plant biology",
  duration: `${window.RAVEN_COURSE_DATA.units.length} units`,
  description: "Eight study units and 32 chapters using Raven's summaries, glossary, and plant-biology terminology.",
  sourceTitle: "Raven Biology of Plants, 8th Edition",
  studyBasis: "Terms and topics are aligned to chapter summaries, questions, and the glossary; definitions are paraphrased for study.",
  chapters: window.RAVEN_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "raven");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
expandCourseToAnkiTarget(ravenCourse);
ravenCourse.cardCount = ravenCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(ravenCourse);

const zumdahlCourse = {
  id: "general-chemistry",
  code: "CHEM",
  title: "Zumdahl Chemistry 7e",
  icon: "⚛",
  color: "amber",
  level: "General chemistry",
  duration: `${window.ZUMDAHL_COURSE_DATA.units.length} units`,
  description: "Five study units and 22 chapters aligned to Zumdahl's numbered sections, glossary, equations, and problem-solving structure.",
  sourceTitle: "Chemistry, Seventh Edition",
  studyBasis: "Chapter structure, terminology, definitions, and equations are aligned to Zumdahl Chemistry 7e; explanations are condensed for study.",
  chapters: window.ZUMDAHL_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "zumdahl");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
expandCourseToAnkiTarget(zumdahlCourse);
zumdahlCourse.cardCount = zumdahlCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(zumdahlCourse);

const centralScienceCourse = {
  id: "central-science",
  code: "CHEM",
  title: "Chemistry: The Central Science 12e",
  icon: "◇",
  color: "violet",
  level: "General chemistry",
  duration: `${window.CENTRAL_SCIENCE_COURSE_DATA.units.length} units`,
  description: "Five study units and 24 chapters built from the textbook glossary and its printed section references.",
  sourceTitle: "Chemistry: The Central Science, 12th Edition",
  studyBasis: "Vocabulary and definitions come from the textbook glossary and are assigned using the section references printed with each entry.",
  chapters: window.CENTRAL_SCIENCE_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "central-science");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
centralScienceCourse.cardCount = centralScienceCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(centralScienceCourse);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = $("#toast");
let toastHandle;
let ankiTimerHandle;
let feynmanTimerHandle;
let customReviewTimerHandle;
let customFeynmanTimerHandle;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function showToast(message) {
  window.clearTimeout(toastHandle);
  toast.textContent = message;
  toast.classList.add("show");
  toastHandle = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function showAppView(view) {
  const showingCourses = view === "courses";
  const showingCourse = view === "course";
  const showingFlashcards = view === "flashcards";
  const showingCreate = view === "create";
  const showingCustomStudy = view === "custom-study";
  const showingCustomDelete = view === "custom-delete";
  const showingStudyGuide = view === "study-guide";
  const showingSettings = view === "settings";
  $("#courses").hidden = !showingCourses;
  $("#course-page").hidden = !showingCourse;
  $("#flashcards").hidden = !showingFlashcards;
  $("#create").hidden = !showingCreate;
  $("#custom-study-page").hidden = !showingCustomStudy;
  $("#custom-delete-page").hidden = !showingCustomDelete;
  $("#study-guide-page").hidden = !showingStudyGuide;
  $("#settings-page").hidden = !showingSettings;
  $$(".topbar, .stats-grid, .dashboard-grid").forEach((section) => { section.hidden = showingCourses || showingCourse || showingFlashcards || showingCreate || showingCustomStudy || showingCustomDelete || showingStudyGuide || showingSettings; });
  const activeHref = showingSettings ? null : showingStudyGuide ? "#study-guide" : showingCustomStudy ? `#${state.customStudyReturnView}` : showingCustomDelete ? `#${state.customDeleteReturnView}` : showingCreate ? "#create" : showingFlashcards ? "#flashcards" : showingCourses || showingCourse ? "#courses" : "#dashboard";
  $$(".primary-nav .nav-item, .mobile-nav a").forEach((item) => {
    const active = item.getAttribute("href") === activeHref;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  $("#open-settings").classList.toggle("active", showingSettings);
  if (showingSettings) populateSettingsForm();
  if (showingCreate || showingFlashcards) renderCustomDecks();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateSettingsForm() {
  const settings = loadSettings();
  const form = $("#settings-form");
  Object.entries(settings).forEach(([name, value]) => {
    const fields = form.elements[name];
    if (fields) fields.value = String(value);
  });
}

function settingsFromForm() {
  const data = new FormData($("#settings-form"));
  const settings = { ...DEFAULT_SETTINGS };
  Object.keys(settings).forEach((key) => { if (data.has(key)) settings[key] = data.get(key); });
  ["newCardsPerDay", "maxReviewsPerDay", "graduatingInterval", "easyInterval", "startingEase", "hardInterval", "easyBonus", "intervalModifier", "maximumInterval", "minimumLapseInterval", "leechThreshold"].forEach((key) => { settings[key] = Number(settings[key]); });
  settings.learningSteps = parseMinuteSteps(settings.learningSteps).join(", ");
  settings.relearningSteps = parseMinuteSteps(settings.relearningSteps).join(", ");
  return settings;
}

function selectSettingsTab(tabName) {
  $$('[data-settings-tab]').forEach((button) => {
    const active = button.dataset.settingsTab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-settings-panel]').forEach((panel) => { panel.hidden = panel.dataset.settingsPanel !== tabName; });
}

function setDateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  $("h1").firstChild.textContent = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, Kai `;
  $("#today-label").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function renderCourseShelf(filter = "") {
  const query = filter.trim().toLowerCase();
  const matches = courses.filter((course) => `${course.title} ${course.code} ${course.level} ${course.sourceTitle || ""} ${course.description}`.toLowerCase().includes(query));
  $("#course-shelf").innerHTML = matches.map((course) => `
    <article class="course-tile catalog-course">
      <div class="course-cover ${course.color}"><span>${course.icon}</span><small>${course.code}</small></div>
      <div class="course-tile-copy"><span>${course.level} · ${course.duration}</span><h3>${course.title}</h3><p>${course.description}</p><small class="book-status connected">● Ready to add</small></div>
      <button class="button course-add" type="button" data-add-course="${course.id}" ${isEnrolled(course.id) ? "disabled" : ""}>${isEnrolled(course.id) ? "Added" : "Add textbook"}</button>
    </article>`).join("") || '<p class="empty-search">No available textbooks match that search.</p>';
  $$('[data-add-course]').forEach((button) => button.addEventListener("click", () => addCourse(button.dataset.addCourse)));
  renderMyCourses($("#my-courses-search").value);
}

function enrolledCourseIds() {
  try { return JSON.parse(localStorage.getItem("study-desk-enrolled-courses") || "[]"); }
  catch { return []; }
}

function isEnrolled(courseId) {
  return enrolledCourseIds().includes(courseId);
}

function addCourse(courseId) {
  const enrolled = new Set(enrolledCourseIds());
  enrolled.add(courseId);
  localStorage.setItem("study-desk-enrolled-courses", JSON.stringify([...enrolled]));
  renderCourseShelf($("#catalog-courses-search").value);
  const course = courses.find((item) => item.id === courseId);
  showToast(`${course?.title || "Textbook"} added to My textbooks.`);
}

function removeCourse(courseId, event) {
  event.stopPropagation();
  localStorage.setItem("study-desk-enrolled-courses", JSON.stringify(enrolledCourseIds().filter((id) => id !== courseId)));
  renderCourseShelf($("#catalog-courses-search").value);
  const course = courses.find((item) => item.id === courseId);
  showToast(`${course?.title || "Textbook"} removed from My textbooks.`);
}

function renderMyCourses(filter = "") {
  const query = filter.trim().toLowerCase();
  const allEnrolled = courses.filter((course) => isEnrolled(course.id));
  const enrolled = allEnrolled.filter((course) => `${course.title} ${course.code} ${course.level} ${course.sourceTitle || ""} ${course.description}`.toLowerCase().includes(query));
  $("#continue-card").hidden = allEnrolled.length === 0;
  $("#my-course-shelf").innerHTML = enrolled.length ? enrolled.map((course) => `
    <article class="course-tile enrolled-course" data-course="${course.id}">
      <div class="course-cover ${course.color}"><span>${course.icon}</span><small>${course.code}</small></div>
      <div class="course-tile-copy"><span>My textbook · ${course.duration}</span><h3>${course.title}</h3><p>Continue your lessons, flashcards, and quizzes.</p></div>
      <button class="course-remove" type="button" data-remove-course="${course.id}" aria-label="Remove ${course.title}">Remove</button>
    </article>`).join("") : query ? '<div class="empty-my-courses"><strong>No added textbooks match</strong><span>Try a different title, subject, or code.</span></div>' : '<div class="empty-my-courses"><strong>No textbooks added yet</strong><span>Choose a textbook from the catalog below.</span></div>';
  $$(".enrolled-course").forEach((tile) => tile.addEventListener("click", () => openCourse(tile.dataset.course)));
  $$('[data-remove-course]').forEach((button) => button.addEventListener("click", (event) => removeCourse(button.dataset.removeCourse, event)));
}

function resetAnkiReview() {
  state.selectedAnkiDecks = null;
  state.ankiQueue = [];
  state.ankiPosition = 0;
  state.ankiSessionTotal = 0;
  state.ankiReviewActive = false;
  state.ankiStartedAt = null;
}

function resetFlashcardReview() {
  state.selectedFlashcardDecks = null;
  state.flashcardQueue = [];
  state.flashcardPosition = 0;
  state.flashcardReviewActive = false;
}

function resetFeynmanStudy() {
  state.selectedFeynmanDecks = null;
  state.feynmanQueue = [];
  state.feynmanPosition = 0;
  state.feynmanActive = false;
  state.feynmanFinished = false;
  state.feynmanStartedAt = null;
  state.feynmanResponse = "";
}

function openCourse(courseId, chapterIndex = 0, view = "lesson") {
  state.courseReturnView = !$("#flashcards").hidden ? "flashcards" : "courses";
  state.activeCourse = courses.find((course) => course.id === courseId) || courses[0];
  state.activeChapter = Math.max(0, Math.min(chapterIndex, state.activeCourse.chapters.length - 1));
  state.activeMiniUnit = 0;
  state.activeSection = 0;
  state.activeView = view;
  resetAnkiReview();
  resetFlashcardReview();
  resetFeynmanStudy();
  $("#library-dialog-kicker").textContent = state.activeCourse.code;
  $("#library-dialog-title").textContent = state.activeCourse.title;
  $("#close-library-button").textContent = state.courseReturnView === "flashcards" ? "← Back to Study" : "← Back to textbooks";
  renderChapterSidebar();
  renderLesson();
  showAppView("course");
  window.setTimeout(() => $("#lesson-view").focus(), 40);
}

function showLibraryOverview() {
  state.activeCourse = null;
  showAppView(state.courseReturnView);
}

function renderChapterSidebar() {
  const course = state.activeCourse;
  const miniUnitCount = course.chapters.reduce((total, unit) => total + unit.miniUnits.length, 0);
  const isAtkins = course.id === "physical-chemistry";
  const usesChapters = isAtkins || ["general-chemistry", "central-science"].includes(course.id);
  const groupLabel = isAtkins ? "Part" : "Unit";
  const itemLabel = usesChapters ? "chapters" : "mini-units";
  $("#chapter-sidebar").innerHTML = `<div class="course-mini ${course.color}"><span>${course.icon}</span><div><strong>${course.code}</strong><small>${course.chapters.length} ${groupLabel.toLowerCase()}s · ${miniUnitCount} ${itemLabel}</small></div></div><p class="chapter-label">Textbook structure</p>${course.chapters.map((unit, unitIndex) => `<div class="unit-group"><button class="chapter-button unit-button ${unitIndex === state.activeChapter ? "active" : ""}" data-unit="${unitIndex}"><span>${groupLabel} ${unitIndex + 1} · ${unit.miniUnits.length} ${itemLabel}</span><strong>${unit.title}</strong></button>${unitIndex === state.activeChapter ? `<div class="mini-unit-list">${unit.miniUnits.map((chapter, miniIndex) => `<button class="mini-unit-button ${miniIndex === state.activeMiniUnit ? "active" : ""}" data-mini-unit="${miniIndex}" aria-label="Chapter ${chapter.number}: ${escapeHtml(chapter.title)}"><span>${chapter.number}</span><strong>${chapter.title}</strong></button>${miniIndex === state.activeMiniUnit && chapter.sections ? `<div class="atkins-section-list">${chapter.sections.map((section, sectionIndex) => `<button type="button" class="atkins-section-button ${sectionIndex === state.activeSection ? "active" : ""}" data-atkins-section="${sectionIndex}">${section.title}</button>`).join("")}</div>` : ""}`).join("")}</div>` : ""}</div>`).join("")}`;
  $$("[data-unit]", $("#chapter-sidebar")).forEach((button) => button.addEventListener("click", () => {
    state.activeChapter = Number(button.dataset.unit);
    state.activeMiniUnit = 0;
    state.activeSection = 0;
    state.activeView = "lesson";
    resetAnkiReview();
    resetFlashcardReview();
    resetFeynmanStudy();
    renderChapterSidebar();
    renderLesson();
  }));
  $$("[data-mini-unit]", $("#chapter-sidebar")).forEach((button) => button.addEventListener("click", () => {
    state.activeMiniUnit = Number(button.dataset.miniUnit);
    state.activeSection = 0;
    state.activeView = "lesson";
    resetAnkiReview();
    resetFlashcardReview();
    resetFeynmanStudy();
    renderChapterSidebar();
    renderLesson();
  }));
  $$('[data-atkins-section]', $("#chapter-sidebar")).forEach((button) => button.addEventListener("click", () => {
    state.activeSection = Number(button.dataset.atkinsSection);
    state.activeView = "lesson";
    renderChapterSidebar();
    renderLesson();
  }));
}

function renderLesson() {
  window.clearInterval(ankiTimerHandle);
  window.clearInterval(feynmanTimerHandle);
  const unit = state.activeCourse.chapters[state.activeChapter];
  const chapter = unit.miniUnits[state.activeMiniUnit];
  const completedKey = `${state.activeCourse.id}-${state.activeChapter}-${state.activeMiniUnit}`;
  const completed = JSON.parse(localStorage.getItem("study-desk-completed-lessons") || "[]").includes(completedKey);
  const tabs = `<div class="lesson-tabs"><button data-view="lesson" class="${state.activeView === "lesson" ? "active" : ""}">Lesson</button><button data-view="flashcards" class="${state.activeView === "flashcards" ? "active" : ""}">Flashcards</button><button data-view="anki" class="${state.activeView === "anki" ? "active" : ""}">Anki</button><button data-view="feynman" class="${state.activeView === "feynman" ? "active" : ""}">Feynman</button><button data-view="quiz" class="${state.activeView === "quiz" ? "active" : ""}">Quiz</button></div>`;
  let body = "";
  if (state.activeView === "lesson") {
    const activeSection = chapter.sections?.[state.activeSection];
    const sectionOutline = activeSection ? `<div class="atkins-section-outline"><span>Section group</span><h4>${escapeHtml(activeSection.title)}</h4>${activeSection.topics.length ? `<ul>${activeSection.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>` : ""}</div>` : "";
    const equationList = chapter.equations?.length ? `<div class="atkins-equations"><h4>Equations and applications</h4>${chapter.equations.map(([name, application, equation]) => `<div><strong>${escapeHtml(name)}</strong><span class="equation-display">${escapeHtml(equation)}</span><span>${escapeHtml(application)}</span></div>`).join("")}</div>` : "";
    body = `<article class="lesson-article"><p class="lesson-number">Chapter ${chapter.number} · ${state.activeCourse.id === "physical-chemistry" ? "Part" : "Unit"} ${state.activeChapter + 1} of ${state.activeCourse.chapters.length}</p><h3>${chapter.title}</h3><p class="unit-context">${unit.title}</p><div class="textbook-alignment"><strong>Textbook-aligned</strong><span>${escapeHtml(state.activeCourse.studyBasis)}</span></div>${sectionOutline}<p class="lesson-lead">${chapter.summary}</p><h4>Key ideas</h4><ul>${chapter.takeaways.map((idea) => `<li>${idea}</li>`).join("")}</ul>${equationList}<button class="button primary-button complete-lesson" type="button">${completed ? "✓ Chapter completed" : "Mark chapter complete"}</button></article>`;
  } else if (state.activeView === "flashcards") {
    body = renderFlashcardView();
  } else if (state.activeView === "anki") {
    body = renderAnkiView(chapter);
  } else if (state.activeView === "feynman") {
    body = renderFeynmanView();
  } else {
    const quizzes = chapter.quizzes || [chapter.quiz];
    body = `<section class="practice-view"><p class="lesson-number">Knowledge check</p><h3>${chapter.title}</h3><div class="quiz-summary"><strong>${quizzes.length} questions</strong><span id="quiz-score">0 answered</span></div><div class="offline-quiz-stack">${quizzes.map((quiz, questionIndex) => `<div class="offline-quiz" data-quiz="${questionIndex}"><small>Question ${questionIndex + 1} of ${quizzes.length}</small><strong>${quiz.question}</strong>${quiz.options.map((option, answerIndex) => `<button type="button" data-question="${questionIndex}" data-answer="${answerIndex}">${option}</button>`).join("")}<p class="quiz-feedback" aria-live="polite"></p></div>`).join("")}</div></section>`;
  }
  $("#lesson-view").innerHTML = tabs + body;
  $$("[data-view]", $("#lesson-view")).forEach((button) => button.addEventListener("click", () => { state.activeView = button.dataset.view; renderLesson(); }));
  $$("[data-anki-unit], [data-anki-mini]", $("#lesson-view")).forEach((input) => input.addEventListener("change", updateAnkiDeckSelection));
  $$("[data-flashcard-unit], [data-flashcard-mini]", $("#lesson-view")).forEach((input) => input.addEventListener("change", updateFlashcardDeckSelection));
  $$("[data-feynman-unit], [data-feynman-mini]", $("#lesson-view")).forEach((input) => input.addEventListener("change", updateFeynmanDeckSelection));
  const selectAll = $("[data-select-all]", $("#lesson-view"));
  if (selectAll) selectAll.addEventListener("click", () => { state.selectedAnkiDecks = allAnkiDeckKeys(); renderLesson(); });
  const clearSelection = $("[data-clear-selection]", $("#lesson-view"));
  if (clearSelection) clearSelection.addEventListener("click", () => { state.selectedAnkiDecks = []; renderLesson(); });
  const selectAllFlashcards = $("[data-select-all-flashcards]", $("#lesson-view"));
  if (selectAllFlashcards) selectAllFlashcards.addEventListener("click", () => { state.selectedFlashcardDecks = allAnkiDeckKeys(); renderLesson(); });
  const clearFlashcards = $("[data-clear-flashcards]", $("#lesson-view"));
  if (clearFlashcards) clearFlashcards.addEventListener("click", () => { state.selectedFlashcardDecks = []; renderLesson(); });
  const selectAllFeynman = $("[data-select-all-feynman]", $("#lesson-view"));
  if (selectAllFeynman) selectAllFeynman.addEventListener("click", () => { state.selectedFeynmanDecks = allAnkiDeckKeys(); renderLesson(); });
  const clearFeynman = $("[data-clear-feynman]", $("#lesson-view"));
  if (clearFeynman) clearFeynman.addEventListener("click", () => { state.selectedFeynmanDecks = []; renderLesson(); });
  const startReview = $("[data-start-anki]", $("#lesson-view"));
  if (startReview) startReview.addEventListener("click", startAnkiReview);
  const startFlashcards = $("[data-start-flashcards]", $("#lesson-view"));
  if (startFlashcards) startFlashcards.addEventListener("click", startFlashcardReview);
  const removeAnkiCardButton = $("[data-remove-anki-card]", $("#lesson-view"));
  if (removeAnkiCardButton) removeAnkiCardButton.addEventListener("click", removeCurrentAnkiCard);
  const restoreAnkiCardsButton = $("[data-restore-anki-cards]", $("#lesson-view"));
  if (restoreAnkiCardsButton) restoreAnkiCardsButton.addEventListener("click", restoreRemovedAnkiCards);
  const startFeynman = $("[data-start-feynman]", $("#lesson-view"));
  if (startFeynman) startFeynman.addEventListener("click", startFeynmanStudy);
  const feynmanAmount = $("[data-feynman-time]", $("#lesson-view"));
  if (feynmanAmount) feynmanAmount.addEventListener("input", (event) => { state.feynmanTimeAmount = Math.max(1, Number(event.currentTarget.value) || 1); });
  const feynmanUnit = $("[data-feynman-time-unit]", $("#lesson-view"));
  if (feynmanUnit) feynmanUnit.addEventListener("change", (event) => { state.feynmanTimeUnit = event.currentTarget.value; });
  const feynmanResponse = $("[data-feynman-response]", $("#lesson-view"));
  if (feynmanResponse) feynmanResponse.addEventListener("input", (event) => { state.feynmanResponse = event.currentTarget.value; });
  const finishFeynman = $("[data-finish-feynman]", $("#lesson-view"));
  if (finishFeynman) finishFeynman.addEventListener("click", () => finishFeynmanPrompt(false));
  const nextFeynman = $("[data-next-feynman]", $("#lesson-view"));
  if (nextFeynman) nextFeynman.addEventListener("click", nextFeynmanPrompt);
  const feynmanBack = $(".feynman-back", $("#lesson-view"));
  if (feynmanBack) feynmanBack.addEventListener("click", () => { state.feynmanActive = false; state.feynmanStartedAt = null; state.feynmanFinished = false; state.feynmanResponse = ""; renderLesson(); });
  const ankiBack = $(".anki-back", $("#lesson-view"));
  if (ankiBack) ankiBack.addEventListener("click", () => { state.ankiReviewActive = false; state.ankiStartedAt = null; renderLesson(); });
  const flashcardBack = $("[data-flashcard-back]", $("#lesson-view"));
  if (flashcardBack) flashcardBack.addEventListener("click", () => { state.flashcardReviewActive = false; renderLesson(); });
  const previousFlashcard = $("[data-previous-flashcard]", $("#lesson-view"));
  if (previousFlashcard) previousFlashcard.addEventListener("click", () => { state.flashcardPosition = Math.max(0, state.flashcardPosition - 1); renderLesson(); });
  const nextFlashcard = $("[data-next-flashcard]", $("#lesson-view"));
  if (nextFlashcard) nextFlashcard.addEventListener("click", () => { state.flashcardPosition = (state.flashcardPosition + 1) % state.flashcardQueue.length; renderLesson(); });
  const ankiCard = $(".anki-card", $("#lesson-view"));
  if (ankiCard) ankiCard.addEventListener("click", () => {
    const review = $(".anki-review", $("#lesson-view"));
    review.classList.toggle("revealed");
    review.classList.add("ratings-ready");
  });
  const revealAnkiButton = $("[data-reveal-anki]", $("#lesson-view"));
  if (revealAnkiButton) revealAnkiButton.addEventListener("click", () => {
    const review = $(".anki-review", $("#lesson-view"));
    review.classList.add("revealed", "ratings-ready");
  });
  $$("[data-anki-rating]", $("#lesson-view")).forEach((button) => button.addEventListener("click", () => rateAnkiCard(button.dataset.ankiRating)));
  $$("[data-answer]", $("#lesson-view")).forEach((button) => button.addEventListener("click", () => answerQuiz(button)));
  const completeButton = $(".complete-lesson");
  if (completeButton) completeButton.addEventListener("click", () => toggleLessonComplete(completedKey));
  if (state.activeView === "anki" && state.ankiReviewActive) {
    updateAnkiTimer();
    ankiTimerHandle = window.setInterval(updateAnkiTimer, 1000);
  }
  if (state.activeView === "feynman" && state.feynmanActive && !state.feynmanFinished) {
    feynmanTimerHandle = window.setInterval(updateFeynmanTimer, 250);
    updateFeynmanTimer();
  }
}

function selectedFlashcardChapters() {
  const selected = new Set(state.selectedFlashcardDecks || []);
  return state.activeCourse.chapters.flatMap((unit, unitIndex) => unit.miniUnits.map((chapter, miniIndex) => ({ unitIndex, miniIndex, chapter })).filter((item) => selected.has(ankiDeckKey(item.unitIndex, item.miniIndex))));
}

function renderFlashcardView() {
  if (state.selectedFlashcardDecks === null) state.selectedFlashcardDecks = [ankiDeckKey(state.activeChapter, state.activeMiniUnit)];
  if (!state.flashcardReviewActive) {
    const selected = new Set(state.selectedFlashcardDecks);
    const removed = removedAnkiCardKeys();
    const selectedChapters = selectedFlashcardChapters();
    const cardCount = selectedChapters.reduce((total, item) => total + item.chapter.cards.filter((_, cardIndex) => !removed.has(ankiCardKey(item.unitIndex, item.miniIndex, cardIndex))).length, 0);
    const unitPicker = state.activeCourse.chapters.map((unit, unitIndex) => {
      const unitKeys = unit.miniUnits.map((_, miniIndex) => ankiDeckKey(unitIndex, miniIndex));
      const selectedCount = unitKeys.filter((key) => selected.has(key)).length;
      return `<div class="anki-unit-picker"><label class="anki-unit-choice"><input type="checkbox" data-flashcard-unit="${unitIndex}" ${selectedCount === unitKeys.length ? "checked" : ""}><span><small>Unit ${unitIndex + 1} · ${unit.miniUnits.length} mini-units</small><strong>${escapeHtml(unit.title)}</strong></span></label><div class="anki-mini-picker">${unit.miniUnits.map((miniUnit, miniIndex) => { const key = ankiDeckKey(unitIndex, miniIndex); const available = miniUnit.cards.filter((_, cardIndex) => !removed.has(ankiCardKey(unitIndex, miniIndex, cardIndex))).length; return `<label><input type="checkbox" data-flashcard-mini="${key}" ${selected.has(key) ? "checked" : ""}><span><small>Chapter ${miniUnit.number} · ${available} cards</small><strong>${escapeHtml(miniUnit.title)}</strong></span></label>`; }).join("")}</div></div>`;
    }).join("");
    return `<section class="practice-view anki-setup"><p class="lesson-number">Normal flashcards</p><h3>Choose units and mini-units</h3><p>Study every selected card freely. This mode does not change Anki due dates or scheduling.</p><div class="anki-selection-bar"><strong>${selectedChapters.length} mini-units · ${cardCount} cards</strong><div><button type="button" data-select-all-flashcards>Select all</button><button type="button" data-clear-flashcards>Clear</button></div></div><div class="anki-deck-picker">${unitPicker}</div><button class="button primary-button start-anki" type="button" data-start-flashcards ${cardCount ? "" : "disabled"}>Study ${cardCount} flashcards</button></section>`;
  }
  const item = state.flashcardQueue[state.flashcardPosition];
  const reviewChapter = state.activeCourse.chapters[item.unitIndex].miniUnits[item.miniIndex];
  const card = reviewChapter.cards[item.cardIndex];
  const equation = card[2] ? `<span class="anki-equation" aria-label="Equation">${escapeHtml(card[2])}</span>` : "";
  return `<section class="practice-view flashcard-study"><button class="flashcard-back" type="button" data-flashcard-back>← Change selection</button><div class="anki-session-heading"><p class="lesson-number">Flashcard ${state.flashcardPosition + 1} of ${state.flashcardQueue.length}</p><span class="flashcard-mode-label">No scheduling</span></div><h3>${escapeHtml(reviewChapter.title)}</h3><p class="anki-card-source">Unit ${item.unitIndex + 1} · Chapter ${reviewChapter.number}</p><div class="anki-review"><button class="anki-card" type="button"><span>${card[2] ? "Equation" : "Question"}</span><strong>${escapeHtml(card[0])}</strong><em>Click to show answer</em><div class="anki-answer">${equation}<p>${escapeHtml(card[1])}</p></div></button></div><div class="flashcard-navigation"><button type="button" data-previous-flashcard ${state.flashcardPosition === 0 ? "disabled" : ""}>← Previous</button><button type="button" data-next-flashcard>${state.flashcardPosition === state.flashcardQueue.length - 1 ? "Restart deck" : "Next →"}</button></div></section>`;
}

function updateFlashcardDeckSelection(event) {
  const selected = new Set(state.selectedFlashcardDecks || []);
  if (event.currentTarget.dataset.flashcardUnit !== undefined) {
    const unitIndex = Number(event.currentTarget.dataset.flashcardUnit);
    state.activeCourse.chapters[unitIndex].miniUnits.forEach((_, miniIndex) => {
      const key = ankiDeckKey(unitIndex, miniIndex);
      if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
    });
  } else {
    const key = event.currentTarget.dataset.flashcardMini;
    if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
  }
  state.selectedFlashcardDecks = allAnkiDeckKeys().filter((key) => selected.has(key));
  renderLesson();
}

function startFlashcardReview() {
  const removed = removedAnkiCardKeys();
  state.flashcardQueue = selectedFlashcardChapters().flatMap(({ unitIndex, miniIndex, chapter }) => chapter.cards.map((_, cardIndex) => ({ unitIndex, miniIndex, cardIndex })).filter((item) => !removed.has(ankiCardKey(item.unitIndex, item.miniIndex, item.cardIndex))));
  if (!state.flashcardQueue.length) return;
  shuffleInPlace(state.flashcardQueue);
  state.flashcardPosition = 0;
  state.flashcardReviewActive = true;
  renderLesson();
}

function renderAnkiView(chapter) {
  if (state.selectedAnkiDecks === null) state.selectedAnkiDecks = [ankiDeckKey(state.activeChapter, state.activeMiniUnit)];
  if (!state.ankiReviewActive) {
    const selected = new Set(state.selectedAnkiDecks);
    const removed = removedAnkiCardKeys();
    const selectedChapters = selectedAnkiChapters();
    const selectedCards = selectedChapters.flatMap((item) => item.chapter.cards.map((_, cardIndex) => ({ ...item, cardIndex })).filter((card) => !removed.has(ankiCardKey(card.unitIndex, card.miniIndex, card.cardIndex))));
    const preparedCards = selectedCards.map((card) => prepareAnkiSessionCard(card, ankiCardKey(card.unitIndex, card.miniIndex, card.cardIndex)));
    const dailyPlan = dailyAnkiPlan(preparedCards, `course:${state.activeCourse.id}`);
    const selectedCardCount = dailyPlan.queue.length;
    const todayReviewCount = dailyPlan.learningCards.length + dailyPlan.reviewCards.length;
    const nextDue = selectedCards.map((card) => ankiScheduleFor(ankiCardKey(card.unitIndex, card.miniIndex, card.cardIndex)).due).filter((due) => due > Date.now()).sort((a, b) => a - b)[0];
    const removedCount = [...removed].filter((key) => key.startsWith(`${state.activeCourse.id}-`)).length;
    const unitPicker = state.activeCourse.chapters.map((unit, unitIndex) => {
      const unitKeys = unit.miniUnits.map((_, miniIndex) => ankiDeckKey(unitIndex, miniIndex));
      const selectedCount = unitKeys.filter((key) => selected.has(key)).length;
      return `<div class="anki-unit-picker"><label class="anki-unit-choice"><input type="checkbox" data-anki-unit="${unitIndex}" ${selectedCount === unitKeys.length ? "checked" : ""}><span><small>Unit ${unitIndex + 1} · ${unit.miniUnits.length} mini-units</small><strong>${unit.title}</strong></span></label><div class="anki-mini-picker">${unit.miniUnits.map((miniUnit, miniIndex) => { const key = ankiDeckKey(unitIndex, miniIndex); const available = miniUnit.cards.filter((_, cardIndex) => !removed.has(ankiCardKey(unitIndex, miniIndex, cardIndex))).length; const due = miniUnit.cards.filter((_, cardIndex) => !removed.has(ankiCardKey(unitIndex, miniIndex, cardIndex)) && isAnkiCardDue(ankiCardKey(unitIndex, miniIndex, cardIndex))).length; return `<label><input type="checkbox" data-anki-mini="${key}" ${selected.has(key) ? "checked" : ""}><span><small>Chapter ${miniUnit.number} · ${due} due / ${available} total</small><strong>${miniUnit.title}</strong></span></label>`; }).join("")}</div></div>`;
    }).join("");
    return `<section class="practice-view anki-setup"><p class="lesson-number">Spaced-repetition review</p><h3>Choose units and mini-units</h3><p>Your current limit introduces up to ${Math.max(0, Math.floor(numericSetting("newCardsPerDay")))} new cards per day. Learning cards and reviews due today are carried forward automatically.</p><div class="anki-selection-bar"><strong><span id="anki-selected-count">${selectedChapters.length}</span> mini-units</strong><div><button type="button" data-select-all>Select all</button><button type="button" data-clear-selection>Clear</button></div></div><div class="anki-today-panel"><span>Today</span><div><strong>${dailyPlan.newCards.length}</strong><small>New</small></div><div><strong>${todayReviewCount}</strong><small>Review</small></div></div>${!selectedCardCount && nextDue ? `<div class="anki-next-due">Nothing is due now. Next review ${escapeHtml(relativeDueTime(nextDue))}.</div>` : ""}${removedCount ? `<div class="anki-removed-note"><span>${removedCount} removed ${removedCount === 1 ? "card" : "cards"}</span><button type="button" data-restore-anki-cards>Restore removed cards</button></div>` : ""}<div class="anki-deck-picker">${unitPicker}</div><button class="button primary-button start-anki" type="button" data-start-anki ${selectedCardCount ? "" : "disabled"}>Start today's ${selectedCardCount} cards</button></section>`;
  }
  const queueItem = state.ankiQueue[0];
  const reviewChapter = state.activeCourse.chapters[queueItem.unitIndex].miniUnits[queueItem.miniIndex];
  const card = reviewChapter.cards[queueItem.cardIndex];
  const cardFront = cleanAnkiStudyText(card[0]);
  const cardBack = cleanAnkiStudyText(card[1]);
  const intervals = ankiRatingIntervals(ankiScheduleFor(queueItem.scheduleKey));
  const equation = card[2] ? `<span class="anki-equation" aria-label="Equation">${escapeHtml(card[2])}</span>` : "";
  return `<section class="practice-view anki-study"><button class="anki-back" type="button">← Change unit selection</button><div class="anki-session-heading"><p class="lesson-number">Anki review · ${state.ankiQueue.length} ${state.ankiQueue.length === 1 ? "card" : "cards"} remaining</p><span class="anki-time">◷ <strong id="anki-elapsed">00:00</strong></span></div><h3>${reviewChapter.title}</h3><div class="anki-card-meta"><p class="anki-card-source">Chapter ${reviewChapter.number}</p><button type="button" data-remove-anki-card>Remove from deck</button></div><div class="anki-review"><button class="anki-card" type="button"><span>${card[2] ? "Equation" : "Question"}</span><strong>${escapeHtml(cardFront)}</strong><em>Click to show answer</em><div class="anki-answer">${equation}<p>${escapeHtml(cardBack)}</p></div></button>${ankiSessionCountsMarkup(state.ankiQueue, queueItem.sessionType)}<button class="button primary-button anki-reveal-button" type="button" data-reveal-anki>Reveal answer</button><div class="anki-ratings" aria-label="Schedule this card's next review"><button type="button" data-anki-rating="again"><span>${formatReviewInterval(intervals.again)}</span><strong>Again</strong></button><button type="button" data-anki-rating="hard"><span>${formatReviewInterval(intervals.hard)}</span><strong>Hard</strong></button><button type="button" data-anki-rating="good"><span>${formatReviewInterval(intervals.good)}</span><strong>Good</strong></button><button type="button" data-anki-rating="easy"><span>${formatReviewInterval(intervals.easy)}</span><strong>Easy</strong></button></div></div></section>`;
}

function ankiDeckKey(unitIndex, miniIndex) { return `${unitIndex}-${miniIndex}`; }

function ankiCardKey(unitIndex, miniIndex, cardIndex) { return `${state.activeCourse.id}-${unitIndex}-${miniIndex}-${cardIndex}`; }

function ankiSchedules() {
  try { return JSON.parse(localStorage.getItem("study-desk-anki-schedules") || "{}"); }
  catch { return {}; }
}

function ankiScheduleFor(key) {
  const value = ankiSchedules()[key];
  return value && typeof value === "object" ? value : { due: 0, intervalDays: 0, ease: numericSetting("startingEase") / 100, repetitions: 0 };
}

function isAnkiCardDue(key, now = Date.now()) { const schedule = ankiScheduleFor(key); return !schedule.suspended && schedule.due <= now; }

const ANKI_DAILY_NEW_STORAGE_KEY = "study-desk-anki-daily-new-v1";

function localAnkiDayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function ankiDailyNewState() {
  const empty = { day: localAnkiDayKey(), scopes: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(ANKI_DAILY_NEW_STORAGE_KEY) || "null");
    return saved?.day === empty.day && saved.scopes && typeof saved.scopes === "object" ? saved : empty;
  } catch { return empty; }
}

function markDailyNewCardsStarted(scope, cards) {
  const dailyLimit = Math.max(0, Math.floor(numericSetting("newCardsPerDay")));
  const daily = ankiDailyNewState();
  const started = new Set(Array.isArray(daily.scopes[scope]) ? daily.scopes[scope] : []);
  cards.forEach((card) => started.add(card.scheduleKey));
  daily.scopes[scope] = [...started].slice(0, dailyLimit);
  localStorage.setItem(ANKI_DAILY_NEW_STORAGE_KEY, JSON.stringify(daily));
}

function dailyAnkiPlan(cards, scope) {
  const settings = loadSettings();
  const dailyLimit = Math.max(0, Math.floor(Number(settings.newCardsPerDay)));
  const reviewLimit = Math.max(0, Math.floor(Number(settings.maxReviewsPerDay)));
  const daily = ankiDailyNewState();
  const started = new Set(Array.isArray(daily.scopes[scope]) ? daily.scopes[scope] : []);
  const newCards = cards.filter((card) => card.sessionType === "new" && !ankiScheduleFor(card.scheduleKey).suspended);
  const alreadyStarted = newCards.filter((card) => started.has(card.scheduleKey)).slice(0, dailyLimit);
  const notStarted = newCards.filter((card) => !started.has(card.scheduleKey));
  const availableNew = settings.newCardOrder === "added" ? notStarted : shuffleInPlace(notStarted);
  const openNewSlots = Math.max(0, dailyLimit - started.size);
  const selectedNew = [...alreadyStarted, ...availableNew.slice(0, openNewSlots)];
  const dueLearning = cards.filter((card) => card.sessionType === "learning" && isAnkiCardDue(card.scheduleKey));
  const dueReview = cards.filter((card) => card.sessionType === "review" && isAnkiCardDue(card.scheduleKey)).sort((a, b) => ankiScheduleFor(a.scheduleKey).due - ankiScheduleFor(b.scheduleKey).due).slice(0, reviewLimit);
  // Learning cards are never displaced by the new-card or review limits.
  // They are placed before new material so overdue work is pushed forward.
  const learningQueue = shuffleInPlace([...dueLearning]);
  const reviewQueue = [...dueReview];
  const newQueue = settings.newCardOrder === "added" ? [...selectedNew] : shuffleInPlace([...selectedNew]);
  let queue;
  if (settings.newReviewOrder === "new-first") queue = [...newQueue, ...learningQueue, ...reviewQueue];
  else if (settings.newReviewOrder === "mix") {
    const established = [...learningQueue, ...reviewQueue];
    queue = [];
    while (established.length || newQueue.length) { if (established.length) queue.push(established.shift()); if (newQueue.length) queue.push(newQueue.shift()); }
  } else queue = [...learningQueue, ...reviewQueue, ...newQueue];
  return {
    newCards: selectedNew,
    learningCards: shuffleInPlace([...dueLearning]),
    reviewCards: shuffleInPlace([...dueReview]),
    queue,
  };
}

function ankiSessionTypeForSchedule(schedule) {
  if (!schedule.lastReviewed && !schedule.repetitions) return "new";
  if ((Number(schedule.intervalDays) || 0) < 1 || schedule.lastRating === "again") return "learning";
  return "review";
}

function prepareAnkiSessionCard(card, scheduleKey) {
  const schedule = ankiScheduleFor(scheduleKey);
  const prepared = Array.isArray(card)
    ? card
    : { ...card, front: cleanAnkiStudyText(card.front), back: cleanAnkiStudyText(card.back) };
  return { ...prepared, scheduleKey, sessionType: ankiSessionTypeForSchedule(schedule), learningStep: 0 };
}

function cleanAnkiStudyText(value) {
  return String(value ?? "")
    .replace(/\s*\(part\s+\d+\)/gi, "")
    .replace(/\bUnit\s+\d+\s+(?:Vocabulary|Vocab|Notes|Review)\b/gi, "")
    .replace(/\b(?:in|from|for)\s+Unit\s+\d+\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function ankiSessionCounts(cards) {
  return cards.reduce((counts, card) => {
    counts[card.sessionType || "new"] += 1;
    return counts;
  }, { new: 0, learning: 0, review: 0 });
}

function ankiSessionCountsMarkup(cards, currentType = "new") {
  const counts = ankiSessionCounts(cards);
  return `<div class="anki-session-counts" data-current-type="${currentType}" aria-label="${counts.new} new, ${counts.learning} learning, ${counts.review} review cards remaining; current card is ${currentType}"><span class="anki-count-new">${counts.new}</span><b>+</b><span class="anki-count-learning">${counts.learning}</span><b>+</b><span class="anki-count-review">${counts.review}</span><div class="anki-type-markers" aria-hidden="true"><i class="anki-type-marker-new"></i><i class="anki-type-marker-learning"></i><i class="anki-type-marker-review"></i></div><small>New · Learning · Review</small></div>`;
}

function applyAnkiSessionRating(card, rating, selectedIntervalDays) {
  if (ankiScheduleFor(card.scheduleKey).suspended) return true;
  // A day-or-longer interval graduates the card from today's active session.
  // Short learning steps stay in the queue and are shown again before the
  // session can finish, even when their real due time has not elapsed yet.
  if ((Number(selectedIntervalDays) || 0) >= 1) return true;
  if (card.sessionType === "review") {
    if (rating === "again") {
      card.sessionType = "learning";
      card.learningStep = 1;
      return false;
    }
    return true;
  }
  if (rating === "easy") return true;
  if (card.sessionType === "new") card.sessionType = "learning";
  if (rating === "again") {
    card.learningStep = 0;
    return false;
  }
  if (rating === "hard") return false;
  if ((card.learningStep || 0) >= 1) return true;
  card.learningStep = 1;
  return false;
}

function saveAnkiRating(scheduleKey, rating) {
  const settings = loadSettings();
  const schedules = ankiSchedules();
  const current = ankiScheduleFor(scheduleKey);
  const intervals = ankiRatingIntervals(current);
  const intervalDays = intervals[rating];
  const easeChange = rating === "again" ? -0.2 : rating === "hard" ? -0.15 : rating === "easy" ? 0.15 : 0;
  const lapses = (Number(current.lapses) || 0) + (rating === "again" && current.repetitions ? 1 : 0);
  const leech = lapses >= Math.max(1, Number(settings.leechThreshold) || 8);
  schedules[scheduleKey] = {
    due: Date.now() + intervalDays * 86400000,
    intervalDays,
    ease: Math.max(1.3, (Number(current.ease) || Number(settings.startingEase) / 100 || 2.5) + easeChange),
    repetitions: rating === "again" ? 0 : (Number(current.repetitions) || 0) + 1,
    lastReviewed: Date.now(),
    lastRating: rating,
    lapses,
    leech,
    suspended: Boolean(current.suspended) || (leech && settings.leechAction === "suspend"),
  };
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  return intervalDays;
}

function ankiRatingIntervals(schedule) {
  const settings = loadSettings();
  const interval = Math.max(0, Number(schedule.intervalDays) || 0);
  const ease = Math.max(1.3, Number(schedule.ease) || Number(settings.startingEase) / 100 || 2.5);
  const learning = parseMinuteSteps(settings.learningSteps).map((minutes) => minutes / 1440);
  const relearning = parseMinuteSteps(settings.relearningSteps).map((minutes) => minutes / 1440);
  const graduation = Math.max(1, Number(settings.graduatingInterval) || 1);
  const easyGraduation = Math.max(graduation, Number(settings.easyInterval) || 4);
  if (!schedule.repetitions) return { again: learning[0], hard: learning[Math.min(1, learning.length - 1)], good: learning.length > 1 ? learning[1] : graduation, easy: easyGraduation };
  if (interval < 1 || schedule.lastRating === "again") return { again: relearning[0], hard: Math.min(15 / 1440, Math.max(relearning[0], (relearning[1] || relearning[0]) * 0.75)), good: Math.max(Number(settings.minimumLapseInterval) || 1, graduation), easy: easyGraduation };
  const modifier = Math.max(0.1, Number(settings.intervalModifier) / 100 || 1);
  const maximum = Math.max(1, Number(settings.maximumInterval) || 36500);
  return {
    again: relearning[0],
    hard: Math.min(maximum, Math.max(1, interval * (Number(settings.hardInterval) / 100 || 1.2) * modifier)),
    good: Math.min(maximum, Math.max(2, interval * ease * modifier)),
    easy: Math.min(maximum, Math.max(easyGraduation, interval * ease * (Number(settings.easyBonus) / 100 || 1.3) * modifier)),
  };
}

function formatReviewInterval(days) {
  if (days < 1 / 24) return `${Math.round(days * 1440)}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 60) return `${Math.round(days)}d`;
  if (days < 730) return `${(days / 30.44).toFixed(days < 305 ? 1 : 0)}mo`;
  return `${(days / 365.25).toFixed(1)}y`;
}

function relativeDueTime(timestamp) {
  const milliseconds = Math.max(0, timestamp - Date.now());
  return `in ${formatReviewInterval(milliseconds / 86400000)}`;
}

function removedAnkiCardKeys() {
  try { return new Set(JSON.parse(localStorage.getItem("study-desk-removed-anki-cards") || "[]")); }
  catch { return new Set(); }
}

function allAnkiDeckKeys() {
  return state.activeCourse.chapters.flatMap((unit, unitIndex) => unit.miniUnits.map((_, miniIndex) => ankiDeckKey(unitIndex, miniIndex)));
}

function selectedAnkiChapters() {
  const selected = new Set(state.selectedAnkiDecks || []);
  return state.activeCourse.chapters.flatMap((unit, unitIndex) => unit.miniUnits.map((chapter, miniIndex) => ({ unitIndex, miniIndex, chapter })).filter((item) => selected.has(ankiDeckKey(item.unitIndex, item.miniIndex))));
}

function updateAnkiDeckSelection(event) {
  const selected = new Set(state.selectedAnkiDecks || []);
  if (event.currentTarget.dataset.ankiUnit !== undefined) {
    const unitIndex = Number(event.currentTarget.dataset.ankiUnit);
    state.activeCourse.chapters[unitIndex].miniUnits.forEach((_, miniIndex) => {
      const key = ankiDeckKey(unitIndex, miniIndex);
      if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
    });
  } else {
    const key = event.currentTarget.dataset.ankiMini;
    if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
  }
  state.selectedAnkiDecks = allAnkiDeckKeys().filter((key) => selected.has(key));
  renderLesson();
}

function startAnkiReview() {
  const selectedChapters = selectedAnkiChapters();
  if (!selectedChapters.length) return;
  const removed = removedAnkiCardKeys();
  const candidates = selectedChapters.flatMap(({ unitIndex, miniIndex, chapter }) => chapter.cards.map((_, cardIndex) => ({ unitIndex, miniIndex, cardIndex })).filter((item) => !removed.has(ankiCardKey(item.unitIndex, item.miniIndex, item.cardIndex))).map((item) => prepareAnkiSessionCard(item, ankiCardKey(item.unitIndex, item.miniIndex, item.cardIndex))));
  const scope = `course:${state.activeCourse.id}`;
  const plan = dailyAnkiPlan(candidates, scope);
  state.ankiQueue = plan.queue;
  if (!state.ankiQueue.length) return;
  markDailyNewCardsStarted(scope, plan.newCards);
  state.ankiPosition = 0;
  state.ankiSessionTotal = state.ankiQueue.length;
  state.ankiReviewActive = true;
  state.ankiStartedAt = Date.now();
  renderLesson();
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function removeCurrentAnkiCard() {
  const queueItem = state.ankiQueue[0];
  if (!queueItem) return;
  const removed = removedAnkiCardKeys();
  removed.add(ankiCardKey(queueItem.unitIndex, queueItem.miniIndex, queueItem.cardIndex));
  localStorage.setItem("study-desk-removed-anki-cards", JSON.stringify([...removed]));
  state.ankiQueue.shift();
  if (!state.ankiQueue.length) {
    state.ankiReviewActive = false;
    state.ankiStartedAt = null;
    state.ankiPosition = 0;
  }
  renderLesson();
  showToast("Card removed from the deck. You can restore it from Anki setup.");
}

function restoreRemovedAnkiCards() {
  const prefix = `${state.activeCourse.id}-`;
  const remaining = [...removedAnkiCardKeys()].filter((key) => !key.startsWith(prefix));
  localStorage.setItem("study-desk-removed-anki-cards", JSON.stringify(remaining));
  renderLesson();
  showToast("Removed Anki cards restored.");
}

function feynmanPrompts(chapter) {
  const customPrompts = {
    3: ["pH", "Water polarity", "Hydrogen bonding", "Acids vs. bases"],
    6: ["Cell parts", "Prokaryotes vs. eukaryotes", "The endomembrane system", "Mitochondria vs. chloroplasts", "Organelles and their functions"],
    9: ["Cellular respiration", "Glycolysis", "The citric acid cycle", "Oxidative phosphorylation", "Aerobic vs. anaerobic respiration"],
    10: ["Photosynthesis", "Light reactions", "Photosystems", "The Calvin cycle", "C4 vs. CAM pathways"],
    13: ["Meiosis", "Mitosis", "Crossing over", "Mitosis vs. meiosis"],
  };
  if (chapter.source === "campbell" && customPrompts[chapter.number]) return customPrompts[chapter.number];
  const sectionTopics = chapter.focusAreas || [];
  const vocabularyTopics = (chapter.textbookTerms || chapter.topics || []).filter((term) => /(?:cycle|system|pathway|transport|growth|development|evolution|respiration|photosynthesis|reproduction|regulation|equilibrium|structure|mechanism|theory|model|metabolism|signaling|inheritance|ecology|diversity|interaction|reaction|synthesis|division|immunity|circulation)/i.test(term));
  const areas = [...new Set([...sectionTopics, ...vocabularyTopics])];
  const termCount = (chapter.textbookTerms || chapter.topics || []).length;
  const count = Math.min(areas.length, termCount <= 8 ? 2 : termCount <= 10 ? 3 : termCount <= 12 ? 4 : termCount <= 14 ? 5 : 6);
  const chosen = Array.from({ length: count }, (_, index) => areas[Math.round(index * (areas.length - 1) / Math.max(1, count - 1))]);
  return [...new Set(chosen)].map(formatFeynmanTopic);
}

function formatFeynmanTopic(topic) {
  const cleaned = topic.replace(/\bversus\b/gi, "vs.").replace(/\s+/g, " ").trim();
  return cleaned === "pH" ? cleaned : cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function selectedFeynmanChapters() {
  const selected = new Set(state.selectedFeynmanDecks || []);
  return state.activeCourse.chapters.flatMap((unit, unitIndex) => unit.miniUnits.map((chapter, miniIndex) => ({ unitIndex, miniIndex, chapter })).filter((item) => selected.has(ankiDeckKey(item.unitIndex, item.miniIndex))));
}

function renderFeynmanView() {
  if (state.selectedFeynmanDecks === null) state.selectedFeynmanDecks = [ankiDeckKey(state.activeChapter, state.activeMiniUnit)];
  if (!state.feynmanActive) {
    const selected = new Set(state.selectedFeynmanDecks);
    const selectedChapters = selectedFeynmanChapters();
    const promptCount = selectedChapters.reduce((total, item) => total + feynmanPrompts(item.chapter).length, 0);
    const unitPicker = state.activeCourse.chapters.map((unit, unitIndex) => {
      const unitKeys = unit.miniUnits.map((_, miniIndex) => ankiDeckKey(unitIndex, miniIndex));
      const selectedCount = unitKeys.filter((key) => selected.has(key)).length;
      return `<div class="anki-unit-picker"><label class="anki-unit-choice"><input type="checkbox" data-feynman-unit="${unitIndex}" ${selectedCount === unitKeys.length ? "checked" : ""}><span><small>Unit ${unitIndex + 1} · ${unit.miniUnits.length} mini-units</small><strong>${unit.title}</strong></span></label><div class="anki-mini-picker">${unit.miniUnits.map((miniUnit, miniIndex) => { const key = ankiDeckKey(unitIndex, miniIndex); const topics = feynmanPrompts(miniUnit).length; return `<label><input type="checkbox" data-feynman-mini="${key}" ${selected.has(key) ? "checked" : ""}><span><small>Chapter ${miniUnit.number} · ${topics} ${topics === 1 ? "topic" : "topics"}</small><strong>${miniUnit.title}</strong></span></label>`; }).join("")}</div></div>`;
    }).join("");
    return `<section class="practice-view feynman-setup"><p class="lesson-number">Feynman study</p><h3>Explain it in your own words</h3><p>Choose units or mini-units, set a writing time, and write freely about one broad topic.</p><div class="anki-selection-bar"><strong>${selectedChapters.length} mini-units · ${promptCount} topics</strong><div><button type="button" data-select-all-feynman>Select all</button><button type="button" data-clear-feynman>Clear</button></div></div><div class="anki-deck-picker">${unitPicker}</div><div class="feynman-time-setting"><label><span>Writing time per topic</span><input type="number" min="1" max="120" value="${state.feynmanTimeAmount}" data-feynman-time></label><select data-feynman-time-unit aria-label="Writing time unit"><option value="seconds" ${state.feynmanTimeUnit === "seconds" ? "selected" : ""}>Seconds</option><option value="minutes" ${state.feynmanTimeUnit === "minutes" ? "selected" : ""}>Minutes</option></select></div><button class="button primary-button start-anki" type="button" data-start-feynman ${promptCount ? "" : "disabled"}>Start Feynman session</button></section>`;
  }
  const item = state.feynmanQueue[state.feynmanPosition];
  const totalSeconds = feynmanDurationSeconds();
  return `<section class="practice-view feynman-session"><button class="anki-back feynman-back" type="button">← Change topic selection</button><div class="anki-session-heading"><p class="lesson-number">Feynman topic · ${state.feynmanPosition + 1} of ${state.feynmanQueue.length}</p><span class="feynman-countdown ${state.feynmanFinished ? "finished" : ""}">◷ <strong id="feynman-remaining">${formatElapsed(totalSeconds * 1000)}</strong></span></div><div class="feynman-prompt"><small>Open-ended topic</small><strong>${escapeHtml(item.prompt)}</strong></div><label class="feynman-response-label" for="feynman-response">Your explanation</label><textarea id="feynman-response" data-feynman-response placeholder="Write what you know, connect the steps, and identify anything you cannot yet explain…" ${state.feynmanFinished ? "disabled" : ""}>${escapeHtml(state.feynmanResponse)}</textarea><div class="feynman-session-actions"><span id="feynman-status">${state.feynmanFinished ? "Response complete. Review the gaps before moving on." : "Keep writing until the timer ends, or finish early."}</span><button class="button secondary-button" type="button" data-finish-feynman ${state.feynmanFinished ? "hidden" : ""}>Finish early</button><button class="button primary-button" type="button" data-next-feynman ${state.feynmanFinished ? "" : "hidden"}>Next topic</button></div></section>`;
}

function updateFeynmanDeckSelection(event) {
  const selected = new Set(state.selectedFeynmanDecks || []);
  if (event.currentTarget.dataset.feynmanUnit !== undefined) {
    const unitIndex = Number(event.currentTarget.dataset.feynmanUnit);
    state.activeCourse.chapters[unitIndex].miniUnits.forEach((_, miniIndex) => {
      const key = ankiDeckKey(unitIndex, miniIndex);
      if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
    });
  } else {
    const key = event.currentTarget.dataset.feynmanMini;
    if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
  }
  state.selectedFeynmanDecks = allAnkiDeckKeys().filter((key) => selected.has(key));
  renderLesson();
}

function feynmanDurationSeconds() {
  return state.feynmanTimeUnit === "minutes" ? state.feynmanTimeAmount * 60 : state.feynmanTimeAmount;
}

function startFeynmanStudy() {
  const selectedChapters = selectedFeynmanChapters();
  if (!selectedChapters.length) return;
  state.feynmanQueue = selectedChapters.flatMap(({ unitIndex, miniIndex, chapter }) => feynmanPrompts(chapter).map((prompt) => ({ unitIndex, miniIndex, chapter, prompt })));
  const offset = Date.now() % state.feynmanQueue.length;
  state.feynmanQueue = state.feynmanQueue.slice(offset).concat(state.feynmanQueue.slice(0, offset));
  state.feynmanPosition = 0;
  state.feynmanActive = true;
  state.feynmanFinished = false;
  state.feynmanStartedAt = Date.now();
  state.feynmanResponse = "";
  renderLesson();
  window.setTimeout(() => $("[data-feynman-response]")?.focus(), 40);
}

function updateFeynmanTimer() {
  const remaining = Math.max(0, feynmanDurationSeconds() * 1000 - (Date.now() - state.feynmanStartedAt));
  const display = $("#feynman-remaining");
  if (display) display.textContent = formatElapsed(remaining);
  if (remaining === 0) finishFeynmanPrompt(true);
}

function finishFeynmanPrompt(timedOut) {
  if (state.feynmanFinished) return;
  state.feynmanFinished = true;
  window.clearInterval(feynmanTimerHandle);
  const response = $("[data-feynman-response]");
  if (response) response.disabled = true;
  const countdown = $(".feynman-countdown");
  if (countdown) countdown.classList.add("finished");
  const status = $("#feynman-status");
  if (status) status.textContent = timedOut ? "Time’s up. Review your explanation and identify what you missed." : "Response complete. Review the gaps before moving on.";
  $("[data-finish-feynman]")?.setAttribute("hidden", "");
  $("[data-next-feynman]")?.removeAttribute("hidden");
  showToast(timedOut ? "Feynman writing time finished." : "Feynman response completed.");
}

function nextFeynmanPrompt() {
  state.feynmanPosition = (state.feynmanPosition + 1) % state.feynmanQueue.length;
  state.feynmanFinished = false;
  state.feynmanStartedAt = Date.now();
  state.feynmanResponse = "";
  renderLesson();
  window.setTimeout(() => $("[data-feynman-response]")?.focus(), 40);
}

function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function updateAnkiTimer() {
  const display = $("#anki-elapsed");
  if (display && state.ankiStartedAt) display.textContent = formatElapsed(Date.now() - state.ankiStartedAt);
}

function rateAnkiCard(rating) {
  if (!$(".anki-review", $("#lesson-view"))?.classList.contains("ratings-ready")) return;
  const queueItem = state.ankiQueue.shift();
  if (!queueItem) return;
  const selectedIntervalDays = saveAnkiRating(queueItem.scheduleKey, rating);
  const graduated = applyAnkiSessionRating(queueItem, rating, selectedIntervalDays);
  if (!graduated) state.ankiQueue.push(queueItem);
  const finished = state.ankiQueue.length === 0;
  const elapsed = state.ankiStartedAt ? formatElapsed(Date.now() - state.ankiStartedAt) : "00:00";
  if (finished) {
    state.ankiReviewActive = false;
    state.ankiStartedAt = null;
    state.ankiPosition = 0;
  }
  renderLesson();
  if (finished) showToast(`Anki session complete in ${elapsed} — no New, Learning, or Review cards remain.`);
}

function answerQuiz(button) {
  const chapter = state.activeCourse.chapters[state.activeChapter].miniUnits[state.activeMiniUnit];
  const quizzes = chapter.quizzes || [chapter.quiz];
  const questionIndex = Number(button.dataset.question || 0);
  const quiz = quizzes[questionIndex];
  const quizElement = button.closest(".offline-quiz");
  const selected = Number(button.dataset.answer);
  $$('[data-answer]', quizElement).forEach((option) => {
    option.disabled = true;
    if (Number(option.dataset.answer) === quiz.answer) option.classList.add("correct");
  });
  const correct = selected === quiz.answer;
  if (!correct) button.classList.add("incorrect");
  quizElement.dataset.answered = "true";
  quizElement.dataset.correct = String(correct);
  $(".quiz-feedback", quizElement).textContent = correct ? "Correct — you’ve got it." : `Not quite. The answer is ${quiz.options[quiz.answer]}.`;
  const answered = $$('.offline-quiz[data-answered="true"]', $("#lesson-view"));
  const correctCount = answered.filter((item) => item.dataset.correct === "true").length;
  $("#quiz-score").textContent = answered.length === quizzes.length ? `${correctCount} of ${quizzes.length} correct` : `${answered.length} of ${quizzes.length} answered`;
}

function toggleLessonComplete(key) {
  const completed = new Set(JSON.parse(localStorage.getItem("study-desk-completed-lessons") || "[]"));
  if (completed.has(key)) completed.delete(key); else completed.add(key);
  localStorage.setItem("study-desk-completed-lessons", JSON.stringify([...completed]));
  renderLesson();
  showToast(completed.has(key) ? "Lesson completed — progress saved on this Mac." : "Lesson marked incomplete.");
}

const STUDY_ALARMS_KEY = "your-study-buddy-alarms-v1";

function loadStudyAlarms() {
  try { const alarms = JSON.parse(localStorage.getItem(STUDY_ALARMS_KEY) || "[]"); return Array.isArray(alarms) ? alarms : []; }
  catch { return []; }
}

function storeStudyAlarms(alarms) { localStorage.setItem(STUDY_ALARMS_KEY, JSON.stringify(alarms)); }

function notifyNativeAlarm(action, alarm) {
  const handler = window.webkit?.messageHandlers?.studyAlarm;
  if (handler) handler.postMessage({ action, ...alarm });
}

function formatAlarmDate(timestamp) {
  return new Date(timestamp).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderStudyAlarms() {
  const alarms = loadStudyAlarms().sort((a, b) => a.timestamp - b.timestamp);
  $("#tasks-done-stat").textContent = String(alarms.length);
  $("#task-list").innerHTML = alarms.length ? alarms.map((alarm) => `<li class="task-item alarm-item"><span class="alarm-icon" aria-hidden="true">◷</span><div class="task-copy"><strong>${escapeHtml(alarm.title)}</strong><span>${escapeHtml(formatAlarmDate(alarm.timestamp))}${alarm.description ? ` · ${escapeHtml(alarm.description)}` : ""}</span></div><button class="icon-button remove-alarm" type="button" data-remove-alarm="${alarm.id}" aria-label="Remove ${escapeHtml(alarm.title)}">×</button></li>`).join("") : '<li class="alarm-empty"><strong>No alarms scheduled</strong><span>Create one and Your Study Buddy will notify this Mac when it is time to study.</span></li>';
  $$('[data-remove-alarm]').forEach((button) => button.addEventListener("click", () => {
    const alarm = alarms.find((item) => item.id === button.dataset.removeAlarm);
    if (!alarm || !window.confirm(`Remove the alarm “${alarm.title}”?`)) return;
    storeStudyAlarms(alarms.filter((item) => item.id !== alarm.id));
    notifyNativeAlarm("cancel", alarm);
    renderStudyAlarms();
    showToast("Study alarm removed.");
  }));
}

function restoreTasks() { renderStudyAlarms(); }
function wireTaskCheckbox() {}

function addStudyAlarm(title, description, timestamp) {
  const alarm = { id: `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, description, timestamp };
  const alarms = loadStudyAlarms();
  alarms.push(alarm);
  storeStudyAlarms(alarms);
  notifyNativeAlarm("schedule", alarm);
  renderStudyAlarms();
  return alarm;
}

const CUSTOM_DECKS_KEY = "your-study-buddy-custom-decks";

function makeLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadCustomDecks() {
  try {
    const decks = JSON.parse(localStorage.getItem(CUSTOM_DECKS_KEY) || "[]");
    return Array.isArray(decks) ? decks.filter((deck) => deck && Array.isArray(deck.cards)) : [];
  } catch {
    localStorage.removeItem(CUSTOM_DECKS_KEY);
    return [];
  }
}

function storeCustomDecks(decks) {
  try {
    localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    showToast("This image is too large to save locally. Try a smaller image.");
    return false;
  }
}

function readFlashcardImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || "").startsWith("image/")) { reject(new Error("Choose an image file.")); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const source = String(reader.result || "");
      const image = new Image();
      image.onerror = () => reject(new Error("The image could not be opened."));
      image.onload = () => {
        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const outputType = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
        resolve(canvas.toDataURL(outputType, 0.86));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

function renderManualImagePreview(side) {
  const data = side === "front" ? state.manualFrontImage : state.manualBackImage;
  const image = $(`#manual-${side}-image-preview`);
  const remove = $(`[data-remove-manual-image="${side}"]`);
  image.src = data || "";
  image.hidden = !data;
  remove.hidden = !data;
}

function applyCardImage(target, dataUrl) {
  if (!target) return;
  const property = target.side === "front" ? "frontImage" : "backImage";
  if (target.kind === "manual") {
    if (target.side === "front") state.manualFrontImage = dataUrl;
    else state.manualBackImage = dataUrl;
    renderManualImagePreview(target.side);
    return;
  }
  const card = state.customDraft[target.index];
  if (!card) return;
  card[property] = dataUrl;
  renderCustomDraft();
}

async function acceptCardImage(file, target) {
  try {
    applyCardImage(target, await readFlashcardImage(file));
    showToast("Image added to the card.");
  } catch (error) {
    showToast(error.message || "The image could not be added.");
  }
}

function handleCardPaste(event, target) {
  const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  acceptCardImage(file, target);
}

function cleanNoteLine(line) {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lessonHeadingInfo(line) {
  const cleaned = cleanNoteLine(line).replace(/[–—]/g, "-").trim();
  if (!cleaned || cleaned.length > 100) return null;
  let match = cleaned.match(/^(?:lesson|lecture)\s*(\d+)\s*(?:[-:.]\s*)?(.*)$/i);
  if (match) return { number: match[1], topic: (match[2] || "").replace(/^[-:.]\s*/, "").trim() };
  match = cleaned.match(/^(.+?)\s*(?:[-:]\s*)?(?:lesson|lecture)\s*(\d+)$/i);
  if (match) return { number: match[2], topic: match[1].replace(/^[-:.]\s*|\s*[-:.]$/g, "").trim() };
  return null;
}

function notesEditor() { return $("#notes-input"); }

function notesPlainText() {
  const editor = notesEditor();
  const lines = [];
  const inlineText = (node) => node.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const visit = (node, depth = 0) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.replace(/\u00a0/g, " ").replace(/\r/g, "").split("\n").forEach((part) => {
        const text = part.trim();
        if (text) lines.push(text);
      });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") { lines.push(""); return; }
    if (["UL", "OL"].includes(node.tagName)) {
      [...node.children].forEach((child) => visit(child, depth));
      return;
    }
    if (node.tagName === "LI") {
      const nestedLists = [...node.children].filter((child) => ["UL", "OL"].includes(child.tagName));
      const clone = node.cloneNode(true);
      clone.querySelectorAll("ul,ol").forEach((list) => list.remove());
      const text = inlineText(clone);
      if (text) lines.push(`${"  ".repeat(depth)}- ${text}`);
      nestedLists.forEach((list) => [...list.children].forEach((child) => visit(child, depth + 1)));
      return;
    }
    if (/^H[1-6]$/.test(node.tagName)) {
      const text = inlineText(node);
      if (text) lines.push(`## ${text}`);
      return;
    }
    if (["DIV", "P"].includes(node.tagName)) {
      const lists = [...node.children].filter((child) => ["UL", "OL"].includes(child.tagName));
      const onlyChild = node.children.length === 1 ? node.firstElementChild : null;
      const boldLine = onlyChild && (["B", "STRONG"].includes(onlyChild.tagName) || /bold|[6-9]00/.test(onlyChild.style.fontWeight || ""));
      if (!lists.length) {
        const segments = [];
        let segment = { text: "", bold: false };
        const flush = () => {
          segment.text.replace(/\u00a0/g, " ").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean).forEach((text) => segments.push({ text, bold: segment.bold }));
          segment = { text: "", bold: false };
        };
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR") { flush(); return; }
          segment.text += child.textContent || "";
          if (child.nodeType === Node.ELEMENT_NODE && (["B", "STRONG"].includes(child.tagName) || /bold|[6-9]00/.test(child.style.fontWeight || ""))) segment.bold = true;
        });
        flush();
        let insideBoldTerm = false;
        segments.forEach(({ text, bold }) => {
          if (/^\d+(?:\.\d+)+\.?\s+/.test(text)) { lines.push(text); insideBoldTerm = false; return; }
          if (bold) { lines.push(`- ${text.replace(/^[-*•]\s*/, "")}`); insideBoldTerm = true; return; }
          if (insideBoldTerm && /^[-*•]\s*/.test(text)) lines.push(`  - ${text.replace(/^[-*•]\s*/, "")}`);
          else lines.push(text);
        });
        return;
      }
      const clone = node.cloneNode(true);
      clone.querySelectorAll("ul,ol").forEach((list) => list.remove());
      const text = inlineText(clone);
      if (text) lines.push(boldLine ? `**${text}**` : text);
      lists.forEach((list) => visit(list, depth));
      return;
    }
    [...node.childNodes].forEach((child) => visit(child, depth));
  };
  [...editor.childNodes].forEach((child) => visit(child));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function notesRichHtml() {
  return notesEditor().innerHTML.trim();
}

function setNotesContent(text = "", html = "") {
  const editor = notesEditor();
  if (html) editor.innerHTML = sanitizeNotesHtml(html);
  else editor.textContent = text;
}

function sanitizeNotesHtml(rawHtml) {
  const documentFragment = new DOMParser().parseFromString(`<div>${rawHtml}</div>`, "text/html").body.firstElementChild;
  const allowed = new Set(["P", "DIV", "BR", "UL", "OL", "LI", "B", "STRONG", "I", "EM", "U", "MARK", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN"]);
  const cleanNode = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      cleanNode(child);
      if (!allowed.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      const style = child.style;
      const safeStyles = [];
      if (style.backgroundColor) safeStyles.push(`background-color: ${style.backgroundColor}`);
      if (style.fontWeight && (/bold/i.test(style.fontWeight) || Number(style.fontWeight) >= 600)) safeStyles.push(`font-weight: ${style.fontWeight}`);
      if (style.fontStyle === "italic") safeStyles.push("font-style: italic");
      if (style.textDecorationLine === "underline" || /underline/.test(style.textDecoration || "")) safeStyles.push("text-decoration: underline");
      [...child.attributes].forEach((attribute) => child.removeAttribute(attribute.name));
      if (safeStyles.length) child.setAttribute("style", safeStyles.join("; "));
    });
  };
  cleanNode(documentFragment);
  return documentFragment.innerHTML;
}

function ankiSeparator(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ({ tab: "\t", comma: ",", semicolon: ";", space: " ", pipe: "|", colon: ":" })[normalized] || (normalized === "\\t" ? "\t" : value);
}

function countUnquotedSeparators(line, separator) {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && line[index] === separator) count += 1;
  }
  return count;
}

function detectAnkiSeparator(lines, extension) {
  if (extension === "tsv") return "\t";
  const candidates = ["\t", ";", ",", "|"];
  const sample = lines.slice(0, 6);
  return candidates
    .map((separator) => ({ separator, score: sample.reduce((total, line) => total + countUnquotedSeparators(line, separator), 0) }))
    .sort((left, right) => right.score - left.score)[0]?.score > 0
    ? candidates.map((separator) => ({ separator, score: sample.reduce((total, line) => total + countUnquotedSeparators(line, separator), 0) })).sort((left, right) => right.score - left.score)[0].separator
    : extension === "csv" ? "," : "\t";
}

function parseSeparatedRecords(text, separator) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (!quoted && character === separator) {
      record.push(field);
      field = "";
    } else if (!quoted && character === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (field || record.length) { record.push(field); records.push(record); }
  return records;
}

function ankiFieldToText(value) {
  const decoder = document.createElement("textarea");
  decoder.innerHTML = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\[sound:[^\]]+\]/gi, "")
    .replace(/<[^>]*>/g, "");
  return decoder.value.replace(/\u00a0/g, " ").trim();
}

function clozeCardFromField(value) {
  const answers = [];
  const front = value.replace(/\{\{c\d+::([\s\S]*?)(?:::([\s\S]*?))?\}\}/gi, (_, answer, hint) => {
    answers.push(answer);
    return hint ? `[${hint}]` : "[…]";
  });
  if (!answers.length) return null;
  return { front: ankiFieldToText(front), back: ankiFieldToText(answers.join("; ")) };
}

function parseAnkiNotes(fileName, sourceText) {
  const normalized = sourceText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const allLines = normalized.split("\n");
  const headers = {};
  let dataStart = 0;
  while (dataStart < allLines.length) {
    const line = allLines[dataStart];
    if (!line.trim()) { dataStart += 1; continue; }
    if (!line.startsWith("#")) break;
    const header = line.match(/^#([^:]+):\s*(.*)$/);
    if (header) headers[header[1].trim().toLowerCase()] = header[2].trim();
    dataStart += 1;
  }
  const dataLines = allLines.slice(dataStart);
  const extension = fileName.split(".").pop().toLowerCase();
  const separator = headers.separator ? ankiSeparator(headers.separator) : detectAnkiSeparator(dataLines.filter((line) => line.trim() && !line.startsWith("#")), extension);
  const records = parseSeparatedRecords(dataLines.join("\n"), separator).filter((record) => record.some((field) => field.trim()) && !record[0].trim().startsWith("#"));
  const columns = headers.columns ? parseSeparatedRecords(headers.columns, separator)[0].map((column) => column.trim().toLowerCase()) : [];
  let frontIndex = Math.max(0, columns.findIndex((column) => /^(front|question|prompt)$/.test(column)));
  let backIndex = columns.findIndex((column) => /^(back|answer|response)$/.test(column));
  if (backIndex < 0) backIndex = frontIndex === 0 ? 1 : 0;
  if (records.length && /^(front|question|prompt)$/i.test(records[0][frontIndex]?.trim() || "") && /^(back|answer|response)$/i.test(records[0][backIndex]?.trim() || "")) records.shift();
  const cardsByFront = new Map();
  records.forEach((record) => {
    const rawFront = record[frontIndex] || "";
    const rawBack = record[backIndex] || "";
    const cloze = !rawBack.trim() ? clozeCardFromField(rawFront) : null;
    const front = cloze?.front || ankiFieldToText(rawFront);
    const back = cloze?.back || ankiFieldToText(rawBack);
    if (!front || !back) return;
    const key = front.toLocaleLowerCase();
    const existing = cardsByFront.get(key);
    cardsByFront.set(key, { id: existing?.id || makeLocalId("card"), front, back, imported: true });
  });
  return { cards: [...cardsByFront.values()], separator, headers };
}

function cardsFromAnkiPackageNotes(notes) {
  const cardsByFront = new Map();
  let skipped = 0;
  (notes || []).forEach((note) => {
    const rawFields = Array.isArray(note.fields) ? note.fields : [];
    const cloze = rawFields.map(clozeCardFromField).find(Boolean);
    const textFields = rawFields.map(ankiFieldToText).filter(Boolean);
    const front = cloze?.front || textFields[0] || "";
    const back = cloze?.back || textFields[1] || "";
    if (!front || !back || front.toLocaleLowerCase() === back.toLocaleLowerCase()) { skipped += 1; return; }
    const key = front.toLocaleLowerCase();
    const existing = cardsByFront.get(key);
    cardsByFront.set(key, { id: existing?.id || makeLocalId("card"), front, back, imported: true });
  });
  return { cards: [...cardsByFront.values()], skipped };
}

const NOTES_GENERATOR_VERSION = 8;

function generateCardsFromNotes(notes) {
  const cards = [];
  const seen = new Set();
  const addCard = (front, back) => {
    const cleanFront = front.replace(/\s+/g, " ").trim();
    const cleanBack = back.replace(/\s+/g, " ").trim();
    if (cleanFront.length < 4 || cleanBack.length < 3 || cleanFront.toLowerCase() === cleanBack.toLowerCase()) return;
    const key = cleanFront.toLowerCase();
    if (seen.has(key) || cards.length >= 300) return;
    seen.add(key);
    cards.push({ id: makeLocalId("card"), front: cleanFront, back: cleanBack });
  };
  const embeddedSubject = (value) => value.replace(/^(A|An|The)\b/, (article) => article.toLowerCase());

  const rawLines = notes.replace(/\r/g, "").split("\n").filter((line) => {
    if (lessonHeadingInfo(line)) return false;
    return !/^Page\s+\d+\s*:/i.test(cleanNoteLine(line));
  });
  const outlineLines = rawLines.map((raw, sourceIndex) => {
    const expanded = raw.replace(/\t/g, "  ");
    const headingMatch = expanded.match(/^\s*(?:#{1,6}\s+)?\*\*(.+?)\*\*\s*$/)
      || expanded.match(/^\s*#{1,6}\s+(.+?)\s*$/)
      || expanded.match(/^\s*\d+(?:\.\d+)+\.?\s+(.+?)\s*$/);
    const bulletMatch = expanded.match(/^(\s*)(?:[-*•]|\d+[.)])\s+(.+?)\s*$/);
    if (headingMatch) return { sourceIndex, kind: "heading", depth: -1, text: cleanNoteLine(headingMatch[1]).replace(/^\d+(?:\.\d+)*\.?\s*/, ""), children: [] };
    if (bulletMatch) return { sourceIndex, kind: "bullet", depth: Math.floor(bulletMatch[1].length / 2), text: cleanNoteLine(bulletMatch[2]), children: [] };
    const plainText = cleanNoteLine(expanded);
    return plainText ? { sourceIndex, kind: "plain", depth: 0, text: plainText, children: [] } : null;
  }).filter((line) => line?.text);

  // Markdown outlines are treated as a hierarchy. A bullet with children becomes
  // a term card; its immediate details become the back instead of one giant card.
  const headingCount = outlineLines.filter((line) => line.kind === "heading").length;
  const outlineContentCount = outlineLines.filter((line) => line.kind !== "heading").length;
  if (outlineLines.filter((line) => line.kind === "bullet").length >= 3 || (headingCount && outlineContentCount >= 4)) {
    let currentHeading = null;
    const stack = [];
    const roots = [];
    outlineLines.forEach((line) => {
      if (line.kind === "heading") {
        currentHeading = line;
        stack.length = 0;
        roots.push(line);
        return;
      }
      line.section = currentHeading?.text || "";
      while (stack.length && stack[stack.length - 1].depth >= line.depth) stack.pop();
      const parent = stack[stack.length - 1] || currentHeading;
      if (parent) { line.parent = parent; parent.children.push(line); }
      else roots.push(line);
      stack.push(line);
    });

    const splitTermDetail = (value) => {
      const colon = value.match(/^([^:]{2,70}):\s+(.{3,})$/);
      if (colon) return [colon[1].trim(), colon[2].trim()];
      const paren = value.match(/^([^()]{2,65})\s*\(([^()]{4,})\)$/);
      if (paren && !/^(?:more info|[A-Z0-9-]{1,6})$/i.test(paren[2])) return [paren[1].trim(), paren[2].trim()];
      return [value.trim(), ""];
    };
    const readableDetail = (node) => {
      const [term, detail] = splitTermDetail(node.text);
      if (detail) return `${term}: ${detail}`;
      if (node.children.length) return `${term}: ${node.children.map((child) => splitTermDetail(child.text)[0]).join(", ")}`;
      return term;
    };
    const looksLikeFact = (value) => /\b(?:is|are|was|were|has|have|contains?|containing|comes?|carry|carries|forms?|supports?|assists?|lines?|secretes?|translates?|modif(?:y|ies)|synthesizes?|produces?|production|breaks?|controls?|maintains?|occurs?|affects?|found|pumped|released|acquired|transferred|tolerates?|switch(?:es)?|starts?)\b|\bvia\b|→/i.test(value);
    const looksLikeTerm = (node) => {
      const [term, detail] = splitTermDetail(node.text);
      const words = term.match(/[A-Za-z0-9+'-]+/g) || [];
      return Boolean(detail) || (words.length > 0 && words.length <= 7 && term.length <= 65 && !/[,;.!?]$/.test(term) && !looksLikeFact(term));
    };
    const addOutlineNode = (node) => {
      const [term, inlineDetail] = splitTermDetail(node.text);
      const childDetails = node.children.map(readableDetail);
      const back = [inlineDetail, ...childDetails].filter(Boolean).join("; ");
      if (node.children.length && term.length <= 75 && back) addCard(term, back);
      else if (inlineDetail) addCard(term, inlineDetail);
      else if (node.parent?.kind === "bullet") {
        const fact = term.match(/^(.{2,55}?)\s+(is|are|has|have|synthesizes?|translates?|produces?|breaks?|controls?|maintains?|supports?|assists?|forms?|lines?|secretes?|carries?|contains?)\s+(.{3,})$/i);
        if (fact && !/\b(?:and|or)$/i.test(fact[1])) addCard(fact[1], `${fact[2].charAt(0).toUpperCase()}${fact[2].slice(1)} ${fact[3]}`);
      }
      node.children.forEach(addOutlineNode);
    };
    roots.forEach((root) => {
      if (root.kind === "heading") {
        const flatOutline = root.children.length && root.children.every((child) => !child.children.length);
        const firstTermIndex = flatOutline ? root.children.findIndex(looksLikeTerm) : -1;
        if (firstTermIndex >= 0) {
          const openingFacts = root.children.slice(0, firstTermIndex).map((child) => child.text).filter(looksLikeFact);
          if (openingFacts.length >= 2) addCard(root.text, openingFacts.join("; "));
          for (let index = firstTermIndex; index < root.children.length;) {
            const node = root.children[index];
            if (!looksLikeTerm(node)) { index += 1; continue; }
            const [term, inlineDetail] = splitTermDetail(node.text);
            let end = index + 1;
            while (end < root.children.length && !looksLikeTerm(root.children[end])) end += 1;
            const details = root.children.slice(index + 1, end).map((child) => child.text);
            const back = [inlineDetail, ...details].filter(Boolean).join("; ");
            if (back) addCard(term, back);
            index = end;
          }
          return;
        }
        const directFacts = root.children.filter((child) => !child.children.length && looksLikeFact(child.text)).map((child) => child.text);
        if (directFacts.length >= 2) addCard(root.text, directFacts.join("; "));
        root.children.forEach(addOutlineNode);
      } else addOutlineNode(root);
    });
    if (cards.length) return cards;
  }

  const lines = rawLines.map(cleanNoteLine).filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";
    const questionMatch = line.match(/^(?:q|question)\s*[:.-]\s*(.+\?)?\s*(.*)$/i);
    const answerMatch = nextLine.match(/^(?:a|answer)\s*[:.-]\s*(.+)$/i);
    if (questionMatch && answerMatch) {
      const question = [questionMatch[1], questionMatch[2]].filter(Boolean).join(" ").trim();
      addCard(question.endsWith("?") ? question : `${question}?`, answerMatch[1]);
      index += 1;
      continue;
    }

    const inlineQuestion = line.match(/^(.+\?)\s+(?:[-–—]|answer\s*:)\s+(.+)$/i);
    if (inlineQuestion) {
      addCard(inlineQuestion[1], inlineQuestion[2]);
      continue;
    }

    const pair = line.match(/^([^:]{2,80})\s*:\s+(.{4,})$/) || line.match(/^(.{2,80}?)\s+[–—]\s+(.{4,})$/);
    if (pair && !/^(https?|file)$/i.test(pair[1])) {
      addCard(pair[1].replace(/[.?!]+$/, ""), pair[2]);
      continue;
    }

    const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((sentence) => sentence.length >= 18);
    sentences.forEach((sentence) => {
      const normalized = sentence.replace(/[.]+$/, "").trim();
      let match = normalized.match(/^(.{2,70}?)\s+(is|are|means|refers to|describes)\s+(.{6,})$/i);
      if (match) {
        addCard(match[1].replace(/^(?:A|An|The)\s+/i, ""), `${match[1]} ${match[2]} ${match[3]}.`);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+(?:functions?|serves)\s+to\s+(.{6,})$/i);
      if (match) {
        addCard(`What is the function of ${embeddedSubject(match[1])}?`, `${match[1]} functions to ${match[2]}.`);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+(causes?|produces?|creates?|converts?)\s+(.{2,})$/i);
      if (match) {
        addCard(`Describe what ${embeddedSubject(match[1])} ${match[2].toLowerCase()}.`, match[3]);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+(contains?|consists? of|includes?|requires?)\s+(.{2,})$/i);
      if (match) {
        addCard(`Describe what ${embeddedSubject(match[1])} ${match[2].toLowerCase()}.`, match[3]);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+occurs? when\s+(.{6,})$/i);
      if (match) addCard(`When does ${embeddedSubject(match[1])} occur?`, match[2]);
    });
  }
  return cards;
}

function cardTopic(card) {
  const patterns = [
    /^Explain\s+(.+?)\.$/i,
    /^What is the function of\s+(.+?)\?$/i,
    /^Describe what\s+(.+?)\s+(?:causes?|produces?|creates?|converts?|contains?|consists? of|includes?|requires?)\.$/i,
    /^What is\s+(?:an?\s+|the\s+)?(.+?)\?$/i,
    /^When does\s+(.+?)\s+occur\?$/i,
    /^Which term does this definition describe\?\s*(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = card.front.match(pattern);
    if (match && match[1].length <= 70) return match[1].trim();
  }
  if (!/[?]$/.test(card.front) && card.front.length <= 70) return card.front.trim();
  return "";
}

function generateQuestionsFromCards(cards) {
  const questionCards = cards.filter((card) => !/^Explain\b/i.test(String(card.front || "").trim()));
  const topics = [...new Set(questionCards.map(cardTopic).filter(Boolean))];
  return questionCards.map((card, index) => {
    const topic = cardTopic(card);
    const base = { id: makeLocalId("question"), source: card.back, confidence: 0.75 };
    const statement = topic && card.back.toLowerCase().startsWith(topic.toLowerCase())
      ? card.back
      : topic ? `${topic} is ${card.back.charAt(0).toLowerCase()}${card.back.slice(1)}` : card.back;
    if (index % 4 === 1 && topic) {
      const makeFalse = Math.floor(index / 4) % 2 === 1 && topics.length > 1;
      const replacement = topics.find((item) => item !== topic);
      const prompt = makeFalse && replacement
        ? statement.replace(new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), replacement)
        : statement;
      return { ...base, type: "true_false", prompt, answer: makeFalse ? "False" : "True", difficulty: "Medium", confidence: 0.7, rule: makeFalse ? "altered statement" : "source statement" };
    }
    if (index % 4 === 2 && topic) {
      const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cloze = new RegExp(escapedTopic, "i").test(statement) ? statement.replace(new RegExp(escapedTopic, "i"), "_____") : `_____ is ${card.back.charAt(0).toLowerCase()}${card.back.slice(1)}`;
      return { ...base, type: "cloze", prompt: cloze, answer: topic, difficulty: "Medium", confidence: 0.85, rule: "key-term deletion" };
    }
    if (index % 4 === 3 && topic && topics.length >= 4) {
      const candidates = topics.filter((item) => item.toLowerCase() !== topic.toLowerCase());
      const offset = index % candidates.length;
      const distractors = [...candidates.slice(offset), ...candidates.slice(0, offset)].slice(0, 3);
      const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cloze = new RegExp(escapedTopic, "i").test(statement) ? statement.replace(new RegExp(escapedTopic, "i"), "_____") : `_____ matches this description: ${card.back}`;
      const options = shuffleInPlace([topic, ...distractors]);
      if (options.length === 4) return { ...base, type: "mcq", prompt: `Complete the statement: ${cloze}`, answer: topic, options, difficulty: "Medium", confidence: 0.9, rule: "key-term deletion with noun distractors" };
    }
    const prompt = topic && card.front.trim() === topic ? `What is the significance of ${topic}?` : card.front;
    return { ...base, type: "wh", prompt, answer: card.back, difficulty: "Easy", confidence: 0.8, rule: "fact-to-question transformation" };
  });
}

function generateFeynmanPrompts(notes, cards) {
  const stopWords = new Set("a an and are as at be because been being but by can did do does for from had has have how if in into is it its may more most not of on or our should than that the their then there these they this those through to using was were what when where which who why will with your".split(" "));
  const scores = new Map();
  const display = new Map();
  const lessonTopics = [];
  const headingTopics = [];
  const addCandidate = (value, weight) => {
    const phrase = cleanNoteLine(value).replace(/[.:;!?]+$/, "").trim();
    const words = phrase.match(/\b(?:\d+(?:st|nd|rd|th)|[A-Za-z][A-Za-z0-9'-]*)\b/gi) || [];
    if (!words.length || words.length > 6 || words.every((word) => stopWords.has(word.toLowerCase()))) return;
    const key = words.join(" ").toLowerCase();
    if (key.length < 3) return;
    scores.set(key, (scores.get(key) || 0) + weight + Math.min(2.5, words.length * 0.45));
    if (!display.has(key)) display.set(key, words.join(" "));
  };

  const lines = notes.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  lines.forEach((line, lineIndex) => {
    const cleaned = cleanNoteLine(line);
    const pageHeading = cleaned.match(/^Page\s+\d+\s*:\s*(.+)$/i);
    if (pageHeading) return;
    const lessonHeading = lessonHeadingInfo(line);
    if (lessonHeading) {
      let topic = lessonHeading.topic;
      if (!topic) {
        const following = lines.slice(lineIndex + 1, lineIndex + 9).map(cleanNoteLine).find((candidate) => candidate && !lessonHeadingInfo(candidate));
        topic = (following || "").replace(/^(?:A|An|The)\s+/i, "").split(/[,;:]/)[0].trim();
      }
      if (topic && !/^lesson\s*\d+$/i.test(topic)) {
        addCandidate(topic, 15);
        lessonTopics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
      }
      return;
    }
    const numberedHeading = line.match(/^\s*\d+(?:\.\d+)*\.?\s+([^.!?]{3,80})$/);
    const heading = /^#{1,6}\s+/.test(line) || numberedHeading || (/^[A-Z][^.!?]{2,80}:?$/.test(cleaned) && !cleaned.includes(":"));
    if (heading) {
      const headingText = cleanNoteLine(numberedHeading?.[1] || cleaned.replace(/^#{1,6}\s+/, "")).replace(/^(?:Page\s+\d+\s*:\s*)/i, "");
      if (headingText && !/^(?:Overview|Important Vocabulary|Vocabulary)$/i.test(headingText)) {
        addCandidate(headingText, 12);
        headingTopics.push(headingText);
      }
    }
    const definedTerm = cleaned.match(/^([^:]{2,60}):\s+.+/);
    if (definedTerm) addCandidate(definedTerm[1], 8);
  });
  // Well-formed document headings make better broad-recall prompts than
  // vocabulary cards. Card topics are only a fallback for unstructured notes.
  if (!lessonTopics.length && !headingTopics.length) {
    cards.map(cardTopic).filter((topic) => topic && topic.split(/\s+/).length >= 2).forEach((topic) => addCandidate(topic, 4));
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const chosen = [];
  const tokenSet = (value) => new Set(value.toLowerCase().split(/\s+/));
  const overlap = (left, right) => {
    const a = tokenSet(left); const b = tokenSet(right);
    const shared = [...a].filter((word) => b.has(word)).length;
    return shared / Math.max(1, new Set([...a, ...b]).size);
  };
  const targetCount = Math.min(18, Math.max(2, Math.ceil(cards.length / 10)));
  for (const [key] of ranked) {
    if (chosen.length >= targetCount) break;
    const phrase = display.get(key);
    if (chosen.some((item) => overlap(item, phrase) > 0.55)) continue;
    chosen.push(phrase);
  }
  return chosen.map((topic) => ({ id: makeLocalId("feynman"), prompt: topic.charAt(0).toUpperCase() + topic.slice(1) }));
}

function questionTypeLabel(type) {
  return ({ wh: "Who / What / Why / How", short_answer: "Short answer", true_false: "True / false", cloze: "Fill in the blank", mcq: "Multiple choice" })[type] || "Short answer";
}

function renderCustomQuestionDraft() {
  $("#question-draft-count").textContent = state.customQuestionDraft.length;
  $("#question-tab-count").textContent = state.customQuestionDraft.length;
  $("#question-draft-empty").hidden = state.customQuestionDraft.length > 0;
  $("#question-draft-list").innerHTML = state.customQuestionDraft.map((question, index) => `<div class="draft-card-row" data-question-draft="${index}"><span class="draft-card-number">${index + 1}</span><label>Question<select class="question-type-select" data-question-type="${index}">${["wh","short_answer","true_false","cloze","mcq"].map((type) => `<option value="${type}" ${question.type === type ? "selected" : ""}>${questionTypeLabel(type)}</option>`).join("")}</select><textarea data-question-prompt="${index}">${escapeHtml(question.prompt)}</textarea></label><label>Answer<textarea data-question-answer="${index}">${escapeHtml(question.answer)}</textarea></label><button type="button" class="remove-draft-card" data-remove-question="${index}" aria-label="Remove question ${index + 1}">×</button></div>`).join("");
  $$('[data-question-type]').forEach((input) => input.addEventListener("change", () => { state.customQuestionDraft[Number(input.dataset.questionType)].type = input.value; }));
  $$('[data-question-prompt]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionPrompt)].prompt = input.value; }));
  $$('[data-question-answer]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionAnswer)].answer = input.value; }));
  $$('[data-remove-question]').forEach((button) => button.addEventListener("click", () => { state.customQuestionDraft.splice(Number(button.dataset.removeQuestion), 1); renderCustomQuestionDraft(); updateCustomSaveButtons(); }));
  updateCustomSaveButtons();
}

function renderCustomFeynmanDraft() {
  $("#feynman-draft-count").textContent = state.customFeynmanDraft.length;
  $("#feynman-tab-count").textContent = state.customFeynmanDraft.length;
  $("#feynman-draft-list").innerHTML = state.customFeynmanDraft.map((item, index) => `<div class="feynman-draft-row"><span class="draft-card-number">${index + 1}</span><input data-feynman-prompt="${index}" value="${escapeHtml(item.prompt)}" aria-label="Feynman prompt ${index + 1}"><button type="button" class="remove-draft-card" data-remove-feynman="${index}" aria-label="Remove Feynman prompt ${index + 1}">×</button></div>`).join("");
  $$('[data-feynman-prompt]').forEach((input) => input.addEventListener("input", () => { state.customFeynmanDraft[Number(input.dataset.feynmanPrompt)].prompt = input.value; }));
  $$('[data-remove-feynman]').forEach((button) => button.addEventListener("click", () => { state.customFeynmanDraft.splice(Number(button.dataset.removeFeynman), 1); renderCustomFeynmanDraft(); updateCustomSaveButtons(); }));
  updateCustomSaveButtons();
}

function updateCustomSaveButtons() {
  const button = $("#generate-note-cards");
  if (state.editingCustomDeckId) button.disabled = false;
}

function renderCustomDraft() {
  const list = $("#draft-card-list");
  const empty = $("#draft-empty");
  $("#draft-card-count").textContent = state.customDraft.length;
  $("#flashcard-tab-count").textContent = state.customDraft.length;
  empty.hidden = state.customDraft.length > 0;
  updateCustomSaveButtons();
  list.innerHTML = state.customDraft.map((card, index) => `<div class="draft-card-row" data-draft-card="${index}"><span class="draft-card-number">${index + 1}</span><label>Front<textarea data-draft-front="${index}" placeholder="Text or pasted image">${escapeHtml(card.front || "")}</textarea><span class="card-image-editor">${card.frontImage ? `<img src="${card.frontImage}" alt="Front image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-draft-image="front" data-image-index="${index}">${card.frontImage ? "Replace image" : "Add image"}</button>${card.frontImage ? `<button type="button" data-remove-draft-image="front" data-image-index="${index}">Remove image</button>` : ""}</span></span></label><label>Back<textarea data-draft-back="${index}" placeholder="Text or pasted image">${escapeHtml(card.back || "")}</textarea><span class="card-image-editor">${card.backImage ? `<img src="${card.backImage}" alt="Back image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-draft-image="back" data-image-index="${index}">${card.backImage ? "Replace image" : "Add image"}</button>${card.backImage ? `<button type="button" data-remove-draft-image="back" data-image-index="${index}">Remove image</button>` : ""}</span></span></label><button type="button" class="remove-draft-card" data-remove-draft="${index}" aria-label="Remove card ${index + 1}">×</button></div>`).join("");
  $$('[data-draft-front]', list).forEach((input) => input.addEventListener("input", () => { state.customDraft[Number(input.dataset.draftFront)].front = input.value; }));
  $$('[data-draft-back]', list).forEach((input) => input.addEventListener("input", () => { state.customDraft[Number(input.dataset.draftBack)].back = input.value; }));
  $$('[data-draft-front]', list).forEach((input) => input.addEventListener("paste", (event) => handleCardPaste(event, { kind: "draft", side: "front", index: Number(input.dataset.draftFront) })));
  $$('[data-draft-back]', list).forEach((input) => input.addEventListener("paste", (event) => handleCardPaste(event, { kind: "draft", side: "back", index: Number(input.dataset.draftBack) })));
  $$('[data-choose-draft-image]', list).forEach((button) => button.addEventListener("click", () => {
    state.pendingCardImageTarget = { kind: "draft", side: button.dataset.chooseDraftImage, index: Number(button.dataset.imageIndex) };
    $("#flashcard-image-file").click();
  }));
  $$('[data-remove-draft-image]', list).forEach((button) => button.addEventListener("click", () => {
    const card = state.customDraft[Number(button.dataset.imageIndex)];
    if (card) card[button.dataset.removeDraftImage === "front" ? "frontImage" : "backImage"] = "";
    renderCustomDraft();
  }));
  $$('[data-remove-draft]', list).forEach((button) => button.addEventListener("click", () => {
    state.customDraft.splice(Number(button.dataset.removeDraft), 1);
    renderCustomDraft();
  }));
}

function selectCreateContentTab(tabName) {
  $$('[data-create-tab]').forEach((button) => {
    const active = button.dataset.createTab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-create-panel]').forEach((panel) => { panel.hidden = panel.dataset.createPanel !== tabName; });
}

function resetCustomDraft() {
  state.customDraft = [];
  state.customQuestionDraft = [];
  state.customFeynmanDraft = [];
  state.customImportSource = null;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = null;
  state.manualFrontImage = "";
  state.manualBackImage = "";
  state.pendingCardImageTarget = null;
  $("#custom-deck-name").value = "";
  setNotesContent();
  $("#notes-input").dataset.placeholder = "Paste class notes here. Bold text, highlights, headings, and bullet lists will be preserved.";
  $("#manual-card-front").value = "";
  $("#manual-card-back").value = "";
  renderManualImagePreview("front");
  renderManualImagePreview("back");
  $("#manual-feynman-topic").value = "";
  $("#anki-notes-file").value = "";
  $("#anki-import-status").textContent = "Supports APKG, UTF-8 TXT, CSV, and TSV files.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Generate and save study set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  selectCreateContentTab("flashcards");
}

function renderCustomDecks() {
  const decks = loadCustomDecks();
  const addedCollections = builtInFlashcardCollections.filter((collection) => isFlashcardCollectionAdded(collection.id)).map((collection) => effectiveBuiltInCollection(collection));
  $("#saved-deck-count").textContent = decks.length;
  $("#flashcards-deck-count").textContent = decks.length + addedCollections.length;
  const creatorMarkup = decks.length ? decks.map((deck) => `<article class="custom-deck-item"><h3>${escapeHtml(deck.name)}</h3><p>${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts</p><div class="custom-deck-actions"><button type="button" data-study-custom="${deck.id}">Study</button><button type="button" data-edit-custom="${deck.id}">Edit</button><button type="button" class="delete-custom-deck" data-delete-custom="${deck.id}">Delete</button></div></article>`).join("") : '<div class="custom-deck-empty">Your saved study sets will appear here.</div>';
  const personalMarkup = decks.map((deck) => `<article class="custom-deck-item personal-deck-item"><button type="button" class="deck-wrench" data-edit-custom="${deck.id}" aria-label="Edit ${escapeHtml(deck.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5l-7.5 7.5a2 2 0 1 0 2.8 2.8l7.5-7.5a4 4 0 0 0 5-5L18 8.6 15.6 6.2l2.1-2.1Z" /></svg></button><div class="built-in-deck-label">Personal set</div><h3>${escapeHtml(deck.name)}</h3><p>${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts</p><div class="custom-deck-actions"><button type="button" data-study-custom="${deck.id}">Study</button><button type="button" data-edit-custom="${deck.id}">Edit</button><button type="button" class="delete-custom-deck" data-delete-custom="${deck.id}">Delete</button></div></article>`).join("");
  const addedMarkup = addedCollections.map((collection) => `<article class="custom-deck-item built-in-deck-item added-built-in-deck"><div class="built-in-deck-label">Built-in · ${collection.units.length} ${collection.unitLabel || "units"}</div><h3>${escapeHtml(collection.name)}</h3><p>${collection.units.reduce((total, unit) => total + unit.cards.length, 0)} cards · ${collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0)} Feynman topics</p><div class="custom-deck-actions"><button type="button" data-study-built-in-collection="${collection.id}">Study</button><button type="button" data-edit-built-in-collection="${collection.id}">Edit</button><button type="button" class="remove-built-in-deck" data-delete-built-in-collection="${collection.id}">Delete</button></div></article>`).join("");
  $("#custom-deck-list").innerHTML = creatorMarkup;
  $("#flashcards-deck-list").innerHTML = personalMarkup + addedMarkup || '<div class="custom-deck-empty">Add flashcards from the library below, or create your own study set.</div>';
  $$('[data-study-custom]').forEach((button) => button.addEventListener("click", () => openCustomStudyOptions(button.dataset.studyCustom)));
  $$('[data-edit-custom]').forEach((button) => button.addEventListener("click", () => { showAppView("create"); editCustomDeck(button.dataset.editCustom); }));
  $$('[data-delete-custom]').forEach((button) => button.addEventListener("click", () => deleteCustomDeck(button.dataset.deleteCustom)));
  $$('[data-study-built-in-collection]').forEach((button) => button.addEventListener("click", () => openCustomStudyOptions(button.dataset.studyBuiltInCollection)));
  $$('[data-edit-built-in-collection]').forEach((button) => button.addEventListener("click", () => { showAppView("create"); editBuiltInCollection(button.dataset.editBuiltInCollection); }));
  $$('[data-delete-built-in-collection]').forEach((button) => button.addEventListener("click", () => deleteBuiltInCollection(button.dataset.deleteBuiltInCollection)));
  renderBuiltInDecks();
}

function renderBuiltInDecks() {
  const list = $("#built-in-deck-list");
  if (!list) return;
  $("#built-in-deck-count").textContent = `${builtInFlashcardCollections.length} ${builtInFlashcardCollections.length === 1 ? "deck" : "decks"}`;
  list.innerHTML = builtInFlashcardCollections.map((collection) => {
    const added = isFlashcardCollectionAdded(collection.id);
    const cardCount = collection.units.reduce((total, unit) => total + unit.cards.length, 0);
    const feynmanCount = collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0);
    const topicSummary = feynmanCount ? `${cardCount} study cards · ${feynmanCount} Feynman topics.` : `${cardCount} study cards.`;
    return `<article class="custom-deck-item built-in-deck-item flashcard-catalog-item"><div class="flashcard-catalog-icon" aria-hidden="true">⌖</div><div class="flashcard-catalog-copy"><div class="built-in-deck-label">${escapeHtml(collection.catalogLabel || "AP course")} · ${collection.units.length} ${escapeHtml(collection.unitLabel || "units")}</div><h3>${escapeHtml(collection.name)}</h3><p>${topicSummary} ${escapeHtml(collection.description)}</p></div><button type="button" class="button course-add" data-add-flashcard-collection="${collection.id}" ${added ? "disabled" : ""}>${added ? "Added" : "Add study deck"}</button></article>`;
  }).join("");
  $$('[data-add-flashcard-collection]').forEach((button) => button.addEventListener("click", () => addFlashcardCollection(button.dataset.addFlashcardCollection)));
}

function addedFlashcardCollectionIds() {
  try { return JSON.parse(localStorage.getItem("study-desk-added-flashcard-collections") || "[]"); }
  catch { return []; }
}

function loadBuiltInCollectionOverrides() {
  try { return JSON.parse(localStorage.getItem("study-desk-built-in-collection-overrides") || "{}"); }
  catch { return {}; }
}

function storeBuiltInCollectionOverrides(overrides) {
  localStorage.setItem("study-desk-built-in-collection-overrides", JSON.stringify(overrides));
}

function effectiveBuiltInCollection(collection) {
  const override = loadBuiltInCollectionOverrides()[collection.id];
  if (!override) return collection;
  return { ...collection, name: override.name || collection.name, units: override.units || collection.units, customized: true };
}

function getBuiltInCollection(collectionId) {
  const collection = builtInFlashcardCollections.find((item) => item.id === collectionId);
  return collection ? effectiveBuiltInCollection(collection) : null;
}

function isFlashcardCollectionAdded(collectionId) {
  return addedFlashcardCollectionIds().includes(collectionId);
}

function addFlashcardCollection(collectionId) {
  const added = new Set(addedFlashcardCollectionIds());
  added.add(collectionId);
  localStorage.setItem("study-desk-added-flashcard-collections", JSON.stringify([...added]));
  renderCustomDecks();
  const collection = getBuiltInCollection(collectionId);
  showToast(`${collection?.name || "Flashcards"} added to My study sets.`);
}

function removeFlashcardCollection(collectionId, event) {
  event?.stopPropagation();
  localStorage.setItem("study-desk-added-flashcard-collections", JSON.stringify(addedFlashcardCollectionIds().filter((id) => id !== collectionId)));
  renderCustomDecks();
  const collection = getBuiltInCollection(collectionId);
  showToast(`${collection?.name || "Flashcards"} removed from My study sets.`);
}

function collectionStudyDeck(collection) {
  const selectedIds = state.selectedBuiltInCollectionId === collection.id ? state.selectedBuiltInUnitIds : collection.units.map((unit) => unit.id);
  const selectedUnits = collection.units.filter((unit) => selectedIds.includes(unit.id));
  const suffix = selectedUnits.length === 1 ? ` · ${selectedUnits[0].shortName}` : !selectedUnits.length || selectedUnits.length === collection.units.length ? "" : ` · ${selectedUnits.length} units`;
  return { id: collection.id, name: `${collection.name}${suffix}`, builtIn: true, cards: selectedUnits.flatMap((unit) => unit.cards), questions: selectedUnits.flatMap((unit) => unit.questions || []), feynmanPrompts: selectedUnits.flatMap((unit) => unit.feynmanPrompts || []) };
}

function findStudyDeck(deckId) {
  const personalDeck = loadCustomDecks().find((deck) => deck.id === deckId);
  if (personalDeck) return personalDeck;
  const collection = getBuiltInCollection(deckId);
  if (collection) return collectionStudyDeck(collection);
  return builtInFlashcardDecks.find((deck) => deck.id === deckId);
}

function saveCustomDeck({ resetAfterSave = true, notify = true } = {}) {
  const name = $("#custom-deck-name").value.trim();
  const cards = state.customDraft.map((card) => ({ ...card, front: String(card.front || "").trim(), back: String(card.back || "").trim() })).filter((card) => (card.front || card.frontImage) && (card.back || card.backImage));
  const questions = state.customQuestionDraft.map((question) => ({ ...question, prompt: question.prompt.trim(), answer: question.answer.trim() })).filter((question) => question.prompt && question.answer);
  const feynmanPrompts = state.customFeynmanDraft.map((item) => ({ ...item, prompt: item.prompt.trim() })).filter((item) => item.prompt);
  if (!name) { $("#custom-deck-name").focus(); showToast("Give this deck a name first."); return null; }
  if (!cards.length && !questions.length && !feynmanPrompts.length) { showToast("Add at least one card, question, or Feynman prompt."); return null; }
  const decks = loadCustomDecks();
  const existingIndex = decks.findIndex((deck) => deck.id === state.editingCustomDeckId);
  const deck = { id: state.editingCustomDeckId || makeLocalId("deck"), name, cards, questions, feynmanPrompts, sourceNotes: notesPlainText(), sourceNotesHtml: notesRichHtml(), sourceImport: state.customImportSource, generatorVersion: NOTES_GENERATOR_VERSION, updatedAt: Date.now() };
  if (existingIndex >= 0) decks.splice(existingIndex, 1, deck); else decks.unshift(deck);
  if (!storeCustomDecks(decks)) return null;
  state.editingCustomDeckId = deck.id;
  renderCustomDecks();
  if (notify) showToast(`${deck.name} updated — ${cards.length} cards, ${questions.length} questions, and ${feynmanPrompts.length} Feynman prompts.`);
  if (resetAfterSave) resetCustomDraft();
  else {
    $("#generate-note-cards").disabled = false;
    $("#generate-note-cards").textContent = "Update set";
  }
  return deck;
}

function saveBuiltInCollectionOverride({ notify = true } = {}) {
  const collectionId = state.editingBuiltInCollectionId;
  const original = builtInFlashcardCollections.find((item) => item.id === collectionId);
  if (!original) return null;
  const name = $("#custom-deck-name").value.trim() || original.name;
  const fallbackUnitId = original.units[0]?.id;
  const cleanCards = state.customDraft.map((card) => ({ ...card, front: String(card.front || "").trim(), back: String(card.back || "").trim(), builtInUnitId: card.builtInUnitId || fallbackUnitId })).filter((card) => (card.front || card.frontImage) && (card.back || card.backImage));
  const cleanQuestions = state.customQuestionDraft.map((question) => ({ ...question, prompt: question.prompt.trim(), answer: question.answer.trim(), builtInUnitId: question.builtInUnitId || fallbackUnitId })).filter((question) => question.prompt && question.answer);
  const cleanPrompts = state.customFeynmanDraft.map((item) => ({ ...item, prompt: item.prompt.trim(), builtInUnitId: item.builtInUnitId || fallbackUnitId })).filter((item) => item.prompt);
  if (!cleanCards.length && !cleanQuestions.length && !cleanPrompts.length) { showToast("Keep at least one card, question, or Feynman prompt."); return null; }
  const units = original.units.map((unit) => ({
    ...unit,
    cards: cleanCards.filter((card) => card.builtInUnitId === unit.id),
    questions: cleanQuestions.filter((question) => question.builtInUnitId === unit.id),
    feynmanPrompts: cleanPrompts.filter((item) => item.builtInUnitId === unit.id),
  }));
  const overrides = loadBuiltInCollectionOverrides();
  overrides[collectionId] = { name, units, updatedAt: Date.now() };
  storeBuiltInCollectionOverrides(overrides);
  renderCustomDecks();
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  if (notify) showToast(`${name} updated — ${cleanCards.length} cards and ${cleanPrompts.length} Feynman prompts.`);
  return getBuiltInCollection(collectionId);
}

function saveGeneratedCustomDeckInPlace() {
  const name = $("#custom-deck-name").value.trim();
  const decks = loadCustomDecks();
  const existingIndex = decks.findIndex((deck) => deck.id === state.editingCustomDeckId);
  const deck = {
    id: state.editingCustomDeckId || makeLocalId("deck"),
    name,
    cards: state.customDraft.map((card) => ({ ...card })),
    questions: state.customQuestionDraft.map((question) => ({ ...question })),
    feynmanPrompts: state.customFeynmanDraft.map((item) => ({ ...item })),
    sourceNotes: notesPlainText(),
    sourceNotesHtml: notesRichHtml(),
    sourceImport: state.customImportSource,
    generatorVersion: NOTES_GENERATOR_VERSION,
    updatedAt: Date.now(),
  };
  if (existingIndex >= 0) decks.splice(existingIndex, 1, deck); else decks.unshift(deck);
  if (!storeCustomDecks(decks)) return null;
  state.editingCustomDeckId = deck.id;
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDecks();
  return deck;
}

function editCustomDeck(deckId) {
  const deck = loadCustomDecks().find((item) => item.id === deckId);
  if (!deck) return;
  state.editingBuiltInCollectionId = null;
  state.editingCustomDeckId = deck.id;
  state.customDraft = deck.cards.map((card) => ({ ...card }));
  state.customQuestionDraft = (deck.questions || []).map((question) => ({ ...question }));
  state.customFeynmanDraft = (deck.feynmanPrompts || []).map((item) => ({ ...item }));
  state.customImportSource = deck.sourceImport || null;
  $("#custom-deck-name").value = deck.name;
  setNotesContent(deck.sourceNotes || "", deck.sourceNotesHtml || "");
  $("#anki-import-status").textContent = state.customImportSource ? `Imported from ${state.customImportSource.name} · flashcards only` : "Supports APKG, UTF-8 TXT, CSV, and TSV files.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  selectCreateContentTab("flashcards");
  $("#custom-deck-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

function editBuiltInCollection(collectionId) {
  const collection = getBuiltInCollection(collectionId);
  if (!collection) return;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = collectionId;
  state.customDraft = collection.units.flatMap((unit) => unit.cards.map((card) => ({ ...card, builtInUnitId: unit.id })));
  state.customQuestionDraft = collection.units.flatMap((unit) => (unit.questions || []).map((question) => ({ ...question, builtInUnitId: unit.id })));
  state.customFeynmanDraft = collection.units.flatMap((unit) => (unit.feynmanPrompts || []).map((item) => ({ ...item, builtInUnitId: unit.id })));
  state.customImportSource = null;
  $("#custom-deck-name").value = collection.name;
  setNotesContent();
  $("#notes-input").dataset.placeholder = "This built-in deck is edited below. You can also add individual cards manually.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  selectCreateContentTab("flashcards");
  $("#custom-deck-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteCustomDeck(deckId) {
  const deck = loadCustomDecks().find((item) => item.id === deckId);
  if (!deck) return;
  if (!$("#flashcards").hidden) state.customDeleteReturnView = "flashcards";
  else if (!$("#create").hidden) state.customDeleteReturnView = "create";
  state.pendingCustomDeleteId = deckId;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = false;
  $("#custom-delete-title").textContent = `Delete “${deck.name}”?`;
  $("#custom-delete-message").textContent = "Are you sure? This study set and its saved review progress will be permanently deleted.";
  $("#custom-delete-summary").textContent = `${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts`;
  $("#confirm-custom-delete").textContent = "Delete permanently";
  showAppView("custom-delete");
}

function deleteBuiltInCollection(collectionId) {
  const collection = getBuiltInCollection(collectionId);
  if (!collection) return;
  state.customDeleteReturnView = "flashcards";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = collectionId;
  state.pendingDeleteAllStudySets = false;
  $("#custom-delete-title").textContent = `Delete “${collection.name}”?`;
  $("#custom-delete-message").textContent = "Are you sure? This deck will be removed from My study sets. You can add the original built-in deck again from the Study library.";
  $("#custom-delete-summary").textContent = `${collection.units.reduce((total, unit) => total + unit.cards.length, 0)} cards · ${collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0)} Feynman prompts`;
  $("#confirm-custom-delete").textContent = "Delete deck";
  showAppView("custom-delete");
}

function deleteAllStudySets() {
  const personalDecks = loadCustomDecks();
  const addedCollections = addedFlashcardCollectionIds();
  const total = personalDecks.length + addedCollections.length;
  if (!total) { showToast("There are no study sets to delete."); return; }
  state.customDeleteReturnView = "flashcards";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = true;
  $("#custom-delete-title").textContent = "Delete all study sets?";
  $("#custom-delete-message").textContent = "Are you sure? Every personal set, added built-in deck, and their saved Anki progress will be permanently removed.";
  $("#custom-delete-summary").textContent = `${total} ${total === 1 ? "study set" : "study sets"}`;
  $("#confirm-custom-delete").textContent = "Delete All";
  showAppView("custom-delete");
}

function confirmCustomDeckDeletion() {
  if (state.pendingDeleteAllStudySets) {
    storeCustomDecks([]);
    localStorage.setItem("study-desk-added-flashcard-collections", "[]");
    storeBuiltInCollectionOverrides({});
    const schedules = ankiSchedules();
    Object.keys(schedules).filter((key) => key.startsWith("custom:")).forEach((key) => delete schedules[key]);
    localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
    resetCustomDraft();
    state.pendingDeleteAllStudySets = false;
    showAppView("flashcards");
    renderCustomDecks();
    showToast("All study sets deleted.");
    return;
  }
  if (state.pendingBuiltInDeleteId) {
    const collectionId = state.pendingBuiltInDeleteId;
    const collection = getBuiltInCollection(collectionId);
    removeFlashcardCollection(collectionId);
    const overrides = loadBuiltInCollectionOverrides();
    delete overrides[collectionId];
    storeBuiltInCollectionOverrides(overrides);
    const schedules = ankiSchedules();
    Object.keys(schedules).filter((key) => key.startsWith(`custom:${collectionId}:`)).forEach((key) => delete schedules[key]);
    localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
    state.pendingBuiltInDeleteId = null;
    showAppView(state.customDeleteReturnView);
    renderCustomDecks();
    showToast(`${collection?.name || "Built-in deck"} deleted from My study sets.`);
    return;
  }
  const deckId = state.pendingCustomDeleteId;
  const decks = loadCustomDecks();
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) { state.pendingCustomDeleteId = null; showAppView(state.customDeleteReturnView); return; }
  storeCustomDecks(decks.filter((item) => item.id !== deckId));
  const schedules = ankiSchedules();
  Object.keys(schedules).filter((key) => key.startsWith(`custom:${deckId}:`)).forEach((key) => delete schedules[key]);
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  if (state.editingCustomDeckId === deckId) resetCustomDraft();
  state.pendingCustomDeleteId = null;
  showAppView(state.customDeleteReturnView);
  showToast(`${deck.name} deleted.`);
}

function customAnkiKey(deckId, cardId) {
  return `custom:${deckId}:${cardId}`;
}

function openCustomStudyOptions(deckId) {
  const collection = getBuiltInCollection(deckId);
  if (collection && state.selectedBuiltInCollectionId !== collection.id) state.selectedBuiltInUnitIds = collection.units.map((unit) => unit.id);
  state.selectedBuiltInCollectionId = collection?.id || null;
  const deck = findStudyDeck(deckId);
  if (!deck) return;
  if (!$("#flashcards").hidden) state.customStudyReturnView = "flashcards";
  else if (!$("#create").hidden) state.customStudyReturnView = "create";
  state.selectedCustomDeckId = deckId;
  state.selectedCustomDeckBuiltIn = Boolean(deck.builtIn);
  $("#close-custom-study").textContent = state.customStudyReturnView === "flashcards" ? "← Back to Study" : "← Back to Create";
  renderBuiltInUnitPicker(collection);
  refreshCustomStudyOptions();
  $("#custom-study-options-view").hidden = false;
  $("#custom-review-view").hidden = true;
  showAppView("custom-study");
}

function renderBuiltInUnitPicker(collection) {
  const picker = $("#built-in-unit-picker");
  picker.hidden = !collection;
  if (!collection) return;
  $("#built-in-unit-grid").innerHTML = collection.units.map((unit) => {
    const feynmanCount = (unit.feynmanPrompts || []).length;
    const summary = feynmanCount ? `${unit.cards.length} cards · ${feynmanCount} Feynman topics` : `${unit.cards.length} cards`;
    return `<label class="built-in-unit-choice"><input type="checkbox" value="${unit.id}" ${state.selectedBuiltInUnitIds.includes(unit.id) ? "checked" : ""}><span><strong>${escapeHtml(unit.shortName)}</strong><small>${summary}</small></span></label>`;
  }).join("");
  $$('input[type="checkbox"]', $("#built-in-unit-grid")).forEach((input) => input.addEventListener("change", () => {
    state.selectedBuiltInUnitIds = $$('input[type="checkbox"]:checked', $("#built-in-unit-grid")).map((item) => item.value);
    updateBuiltInUnitToggle(collection);
    refreshCustomStudyOptions();
  }));
  $("#toggle-all-built-in-units").onclick = () => {
    const allSelected = state.selectedBuiltInUnitIds.length === collection.units.length;
    state.selectedBuiltInUnitIds = allSelected ? [] : collection.units.map((unit) => unit.id);
    renderBuiltInUnitPicker(collection);
    refreshCustomStudyOptions();
  };
  updateBuiltInUnitToggle(collection);
}

function updateBuiltInUnitToggle(collection) {
  $("#toggle-all-built-in-units").textContent = state.selectedBuiltInUnitIds.length === collection.units.length ? "Clear all" : "Select all";
}

function refreshCustomStudyOptions() {
  const deck = findStudyDeck(state.selectedCustomDeckId);
  if (!deck) return;
  $("#custom-study-title").textContent = deck.name;
  const candidates = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(deck.id, card.id)));
  const dailyPlan = dailyAnkiPlan(candidates, `deck:${deck.id}`);
  const dueCount = dailyPlan.queue.length;
  const reviewCount = dailyPlan.learningCards.length + dailyPlan.reviewCards.length;
  const futureDue = deck.cards.map((card) => ankiScheduleFor(customAnkiKey(deck.id, card.id)).due).filter((due) => due > Date.now()).sort((a, b) => a - b)[0];
  $("#custom-anki-due-copy").textContent = !deck.cards.length ? "Select at least one unit." : dueCount ? `${dueCount} cards are in today's session.` : futureDue ? `Nothing is due now. Next review ${relativeDueTime(futureDue)}.` : "No flashcards are available.";
  $("#custom-anki-daily-new").textContent = dailyPlan.newCards.length;
  $("#custom-anki-daily-review").textContent = reviewCount;
  $('[data-custom-study-mode="regular"]').disabled = !deck.cards.length;
  $('[data-custom-study-mode="anki"]').disabled = !dueCount;
  $('[data-custom-study-mode="questions"]').disabled = !(deck.questions || []).length;
  $('[data-custom-study-mode="feynman"]').disabled = !(deck.feynmanPrompts || []).length;
  $('[data-custom-study-mode="questions"]').closest(".custom-study-option-card").hidden = Boolean(deck.builtIn);
  $('[data-custom-study-mode="feynman"]').closest(".custom-study-option-card").hidden = false;
  configureCustomReviewCount("#custom-regular-count", deck.cards.length);
  configureCustomReviewCount("#custom-questions-count", (deck.questions || []).length);
}

function configureCustomReviewCount(selector, available) {
  const input = $(selector);
  const maximum = Math.max(0, available);
  const wasDisabled = input.disabled;
  input.disabled = maximum === 0;
  input.max = String(Math.max(1, maximum));
  input.value = String(maximum ? Math.min(maximum, wasDisabled ? 20 : Math.max(1, Number(input.value) || maximum)) : 1);
}

function customReviewCount(mode, available) {
  const selectors = { regular: "#custom-regular-count", questions: "#custom-questions-count" };
  const input = $(selectors[mode]);
  if (!input) return available;
  const count = Math.min(available, Math.max(1, Math.floor(Number(input.value) || available)));
  input.value = String(count);
  return count;
}

function startCustomReview(mode) {
  const deck = findStudyDeck(state.selectedCustomDeckId);
  if (!deck) return;
  state.customReviewMode = mode;
  if (mode === "questions") {
    const questions = (deck.questions || []).map((question) => ({
      ...question,
      front: question.prompt,
      back: question.answer,
    }));
    state.customReviewCards = shuffleInPlace(questions).slice(0, customReviewCount(mode, questions.length));
  } else if (mode === "feynman") {
    state.customReviewCards = (deck.feynmanPrompts || []).map((item) => ({ id: item.id, front: cleanCustomFeynmanPrompt(item.prompt), back: "Review your explanation and add any important details you missed." }));
  } else if (mode === "anki") {
    const scope = `deck:${deck.id}`;
    const candidates = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(deck.id, card.id)));
    const plan = dailyAnkiPlan(candidates, scope);
    state.customReviewCards = plan.queue;
    markDailyNewCardsStarted(scope, plan.newCards);
  } else {
    const cards = deck.cards.map((card) => ({ ...card }));
    state.customReviewCards = shuffleInPlace(cards).slice(0, customReviewCount(mode, cards.length));
  }
  if (!state.customReviewCards.length) { showToast("Nothing is available for that study mode yet."); return; }
  state.customReviewPosition = 0;
  state.customAnkiSessionTotal = mode === "anki" ? state.customReviewCards.length : 0;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  state.customQuestionAnswered = false;
  state.customFeynmanStartedAt = null;
  state.customReviewStartedAt = Date.now();
  $("#custom-review-title").textContent = deck.name;
  $("#custom-study-options-view").hidden = true;
  $("#custom-review-view").hidden = false;
  renderCustomReviewCard();
  window.clearInterval(customReviewTimerHandle);
  if (mode === "anki") {
    $("#custom-review-time").textContent = "00:00";
    customReviewTimerHandle = window.setInterval(() => {
      $("#custom-review-time").textContent = formatElapsed(Date.now() - state.customReviewStartedAt);
    }, 1000);
  }
}

function closeCustomReview() {
  window.clearInterval(customReviewTimerHandle);
  window.clearInterval(customFeynmanTimerHandle);
  if (state.selectedCustomDeckId) openCustomStudyOptions(state.selectedCustomDeckId);
  else {
    $("#custom-review-view").hidden = true;
    $("#custom-study-options-view").hidden = false;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCustomReviewCard() {
  const card = state.customReviewCards[state.customReviewMode === "anki" ? 0 : state.customReviewPosition];
  if (!card) return;
  const reviewCard = $("#custom-review-card");
  reviewCard.classList.toggle("revealed", state.customReviewRevealed);
  const modeLabels = { regular: ["Front", "Back", "Flashcard review"], anki: ["Front", "Back", "Anki review"], questions: ["Question", "Answer", "Question practice"], feynman: ["Prompt", "Self-check", "Feynman practice"] };
  const labels = modeLabels[state.customReviewMode] || modeLabels.regular;
  $("#custom-review-side").textContent = state.customReviewRevealed ? labels[1] : labels[0];
  $("#custom-review-mode-label").textContent = labels[2];
  const reviewText = state.customReviewRevealed ? card.back : card.front;
  const reviewImage = state.customReviewRevealed ? card.backImage : card.frontImage;
  const reviewContent = $("#custom-review-content");
  const reviewImageElement = $("#custom-review-image");
  reviewContent.textContent = reviewText || "";
  reviewContent.hidden = !reviewText;
  reviewImageElement.src = reviewImage || "";
  reviewImageElement.alt = reviewImage ? `${state.customReviewRevealed ? labels[1] : labels[0]} image` : "";
  reviewImageElement.hidden = !reviewImage;
  const isAnki = state.customReviewMode === "anki";
  const isQuestions = state.customReviewMode === "questions";
  const isFeynman = state.customReviewMode === "feynman";
  $("#custom-question-practice").hidden = !isQuestions;
  $("#custom-feynman-practice").hidden = !isFeynman;
  $("#custom-review-card").hidden = isQuestions || isFeynman;
  $("#custom-review-progress").textContent = isAnki ? `${state.customReviewCards.length} ${state.customReviewCards.length === 1 ? "card" : "cards"} remaining` : `${labels[0]} ${state.customReviewPosition + 1} of ${state.customReviewCards.length}`;
  $("#custom-regular-controls").hidden = isAnki || isQuestions || isFeynman;
  $("#custom-anki-ratings").hidden = !isAnki || !state.customReviewWasRevealed;
  $("#custom-review-reveal").hidden = isQuestions || isFeynman || state.customReviewRevealed;
  $("#custom-anki-session-counts").hidden = !isAnki;
  $("#delete-custom-anki-card").hidden = !isAnki || state.selectedCustomDeckBuiltIn;
  $("#custom-review-time").hidden = !isAnki;
  $("#custom-review-previous").disabled = state.customReviewPosition === 0;
  $("#custom-review-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  if (isQuestions) {
    renderCustomQuestionPractice(card);
    return;
  }
  if (isFeynman) {
    renderCustomFeynmanPractice(card);
    return;
  }
  if (isAnki) {
    const counts = ankiSessionCounts(state.customReviewCards);
    $("#custom-anki-session-counts").dataset.currentType = card.sessionType || "new";
    $(".anki-count-new", $("#custom-anki-session-counts")).textContent = counts.new;
    $(".anki-count-learning", $("#custom-anki-session-counts")).textContent = counts.learning;
    $(".anki-count-review", $("#custom-anki-session-counts")).textContent = counts.review;
    $("#custom-anki-session-counts").setAttribute("aria-label", `${counts.new} new, ${counts.learning} learning, ${counts.review} review cards remaining; current card is ${card.sessionType || "new"}`);
    const intervals = ankiRatingIntervals(ankiScheduleFor(card.scheduleKey));
    $$('[data-custom-anki-rating]').forEach((button) => { $("span", button).textContent = formatReviewInterval(intervals[button.dataset.customAnkiRating]); });
  }
}

function cleanCustomFeynmanPrompt(value) {
  return String(value)
    .replace(/^Explain\s+/i, "")
    .replace(/\s+in detail\s+without (?:looking at|checking) (?:your )?notes[.!]?$/i, "")
    .replace(/\s+without (?:looking at|checking) (?:your )?notes[.!]?$/i, "")
    .replace(/[.!]+$/, "")
    .trim();
}

function customFeynmanDurationSeconds() {
  return state.customFeynmanTimeUnit === "minutes" ? state.customFeynmanTimeAmount * 60 : state.customFeynmanTimeAmount;
}

function renderCustomFeynmanPractice(item) {
  window.clearInterval(customFeynmanTimerHandle);
  state.customFeynmanStartedAt = null;
  $("#custom-feynman-prompt").textContent = cleanCustomFeynmanPrompt(item.front);
  $("#custom-feynman-time-amount").value = state.customFeynmanTimeAmount;
  $("#custom-feynman-time-unit").value = state.customFeynmanTimeUnit;
  $("#custom-feynman-countdown").textContent = formatElapsed(customFeynmanDurationSeconds() * 1000);
  $("#custom-feynman-response").value = "";
  $("#custom-feynman-status").textContent = "Timer running. Keep developing your explanation.";
  $("#start-custom-feynman-timer").disabled = false;
  $("#start-custom-feynman-timer").textContent = "Restart timer";
  $("#custom-feynman-previous").disabled = state.customReviewPosition === 0;
  $("#custom-feynman-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  startCustomFeynmanTimer();
}

function startCustomFeynmanTimer() {
  window.clearInterval(customFeynmanTimerHandle);
  state.customFeynmanStartedAt = Date.now();
  $("#start-custom-feynman-timer").disabled = false;
  $("#start-custom-feynman-timer").textContent = "Restart timer";
  $("#custom-feynman-status").textContent = "Timer running. Keep developing your explanation.";
  const update = () => {
    const remaining = Math.max(0, customFeynmanDurationSeconds() * 1000 - (Date.now() - state.customFeynmanStartedAt));
    $("#custom-feynman-countdown").textContent = formatElapsed(remaining);
    if (remaining === 0) {
      window.clearInterval(customFeynmanTimerHandle);
      $("#custom-feynman-status").textContent = "Time is up. Finish your current thought, then continue when ready.";
      showToast("Feynman writing time finished.");
    }
  };
  update();
  customFeynmanTimerHandle = window.setInterval(update, 250);
  $("#custom-feynman-response").focus();
}

function moveCustomFeynman(direction) {
  const nextPosition = state.customReviewPosition + direction;
  if (nextPosition < 0) return;
  window.clearInterval(customFeynmanTimerHandle);
  if (nextPosition >= state.customReviewCards.length) { closeCustomReview(); return; }
  state.customReviewPosition = nextPosition;
  renderCustomReviewCard();
}

function renderCustomQuestionPractice(question) {
  const isChoice = question.type === "true_false" || (question.type === "mcq" && (question.options || []).length > 1);
  const options = question.type === "true_false" ? ["True", "False"] : (question.options || []);
  $("#custom-question-type").textContent = `${questionTypeLabel(question.type)}${question.difficulty ? ` · ${question.difficulty}` : ""}`;
  $("#custom-question-prompt").textContent = question.prompt;
  $("#custom-question-choices").hidden = !isChoice;
  $("#custom-question-choices").innerHTML = isChoice ? options.map((option, index) => `<button type="button" data-custom-question-choice="${escapeHtml(option)}"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</button>`).join("") : "";
  $("#custom-question-response-wrap").hidden = isChoice;
  $("#custom-question-response").value = "";
  $("#custom-question-response").disabled = false;
  $("#custom-question-feedback").textContent = "";
  $("#custom-question-feedback").className = "custom-question-feedback";
  $("#custom-question-previous").disabled = state.customReviewPosition === 0;
  $("#custom-question-next").disabled = true;
  $("#custom-question-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  $("#check-custom-question").hidden = isChoice;
  $("#check-custom-question").disabled = false;
  state.customQuestionAnswered = false;
  $$('[data-custom-question-choice]').forEach((button) => button.addEventListener("click", () => answerCustomQuestion(button.dataset.customQuestionChoice)));
}

function answerCustomQuestion(response) {
  if (state.customQuestionAnswered) return;
  const question = state.customReviewCards[state.customReviewPosition];
  const given = String(response ?? $("#custom-question-response").value).trim();
  if (!given) { $("#custom-question-response").focus(); return; }
  const expected = String(question.answer).trim();
  const exactQuestion = question.type === "mcq" || question.type === "true_false" || question.type === "cloze";
  const correct = given.localeCompare(expected, undefined, { sensitivity: "base" }) === 0;
  state.customQuestionAnswered = true;
  $$('[data-custom-question-choice]').forEach((button) => {
    button.disabled = true;
    if (button.dataset.customQuestionChoice.localeCompare(expected, undefined, { sensitivity: "base" }) === 0) button.classList.add("correct");
    else if (button.dataset.customQuestionChoice.localeCompare(given, undefined, { sensitivity: "base" }) === 0) button.classList.add("incorrect");
  });
  $("#custom-question-response").disabled = true;
  const feedback = $("#custom-question-feedback");
  feedback.classList.add(!exactQuestion || correct ? "correct" : "incorrect");
  feedback.textContent = exactQuestion ? (correct ? "Correct." : `Not quite. Correct answer: ${expected}`) : `Model answer: ${expected}`;
  $("#custom-question-next").disabled = false;
  $("#check-custom-question").disabled = true;
}

function moveCustomQuestion(direction) {
  const nextPosition = state.customReviewPosition + direction;
  if (nextPosition < 0) return;
  if (nextPosition >= state.customReviewCards.length) { closeCustomReview(); return; }
  state.customReviewPosition = nextPosition;
  state.customReviewRevealed = false;
  state.customQuestionAnswered = false;
  $("#custom-question-response").disabled = false;
  $("#check-custom-question").disabled = false;
  renderCustomReviewCard();
}

function rateCustomAnkiCard(rating) {
  if (!state.customReviewWasRevealed) return;
  const card = state.customReviewCards.shift();
  if (!card?.scheduleKey) return;
  const selectedIntervalDays = saveAnkiRating(card.scheduleKey, rating);
  const graduated = applyAnkiSessionRating(card, rating, selectedIntervalDays);
  if (!graduated) state.customReviewCards.push(card);
  if (!state.customReviewCards.length) {
    const elapsed = formatElapsed(Date.now() - state.customReviewStartedAt);
    closeCustomReview();
    showToast(`Anki session complete in ${elapsed} — no New, Learning, or Review cards remain.`);
    return;
  }
  state.customReviewPosition = 0;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  renderCustomReviewCard();
}

function deleteCurrentCustomAnkiCard() {
  if (state.customReviewMode !== "anki") return;
  const card = state.customReviewCards[state.customReviewPosition];
  const deckId = state.selectedCustomDeckId;
  if (!card?.id || !deckId) return;
  if (!window.confirm("Remove this card from your personal study set? It will also be removed from future regular and Anki reviews.")) return;
  const decks = loadCustomDecks();
  const deckIndex = decks.findIndex((deck) => deck.id === deckId);
  if (deckIndex < 0) return;
  const deletedFront = card.front;
  decks[deckIndex] = { ...decks[deckIndex], cards: decks[deckIndex].cards.filter((item) => item.id !== card.id), updatedAt: Date.now() };
  storeCustomDecks(decks);
  if (state.editingCustomDeckId === deckId) {
    state.customDraft = state.customDraft.filter((item) => item.id !== card.id);
    renderCustomDraft();
  }
  const schedules = ankiSchedules();
  delete schedules[customAnkiKey(deckId, card.id)];
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  state.customReviewCards.splice(state.customReviewPosition, 1);
  if (!state.customReviewCards.length) {
    closeCustomReview();
    renderCustomDecks();
    showToast(`Removed “${deletedFront}”. No cards remain in this review.`);
    return;
  }
  if (state.customReviewPosition >= state.customReviewCards.length) state.customReviewPosition = state.customReviewCards.length - 1;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  renderCustomDecks();
  renderCustomReviewCard();
  showToast(`Removed “${deletedFront}” from this study set.`);
}

const taskDialog = $("#task-dialog");

applyTheme();
setDateGreeting();
renderCourseShelf();
renderCustomDraft();
renderCustomQuestionDraft();
renderCustomFeynmanDraft();
renderCustomDecks();
restoreTasks();
$$(".task-item input[type='checkbox']").forEach(wireTaskCheckbox);

$("#open-library-button").addEventListener("click", () => showAppView("courses"));
$("#view-all-courses").addEventListener("click", () => $("#course-shelf").scrollIntoView({ behavior: "smooth", block: "center" }));
$("#close-library-button").addEventListener("click", showLibraryOverview);
$("#continue-button").addEventListener("click", () => openCourse("biology", 1));
$("#add-task-button").addEventListener("click", () => {
  const defaultTime = new Date(Date.now() + 3600000);
  $("#alarm-date").value = `${defaultTime.getFullYear()}-${String(defaultTime.getMonth() + 1).padStart(2, "0")}-${String(defaultTime.getDate()).padStart(2, "0")}`;
  $("#alarm-time").value = `${String(defaultTime.getHours()).padStart(2, "0")}:${String(defaultTime.getMinutes()).padStart(2, "0")}`;
  taskDialog.showModal();
});
$("#close-dialog").addEventListener("click", () => taskDialog.close());
$("#cancel-task").addEventListener("click", () => taskDialog.close());
$("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#task-name").value.trim();
  const description = $("#alarm-description").value.trim();
  const timestamp = new Date(`${$("#alarm-date").value}T${$("#alarm-time").value}`).getTime();
  if (!title || !Number.isFinite(timestamp)) return;
  if (timestamp <= Date.now()) { showToast("Choose a future date and time."); return; }
  addStudyAlarm(title, description, timestamp);
  event.currentTarget.reset();
  taskDialog.close();
  showToast("Study alarm scheduled. Allow notifications if your Mac asks.");
});
$(".search-field input").addEventListener("input", (event) => {
  $("#my-courses-search").value = event.currentTarget.value;
  $("#catalog-courses-search").value = event.currentTarget.value;
  renderCourseShelf(event.currentTarget.value);
  showAppView("courses");
});
$("#my-courses-search").addEventListener("input", (event) => renderMyCourses(event.currentTarget.value));
$("#catalog-courses-search").addEventListener("input", (event) => renderCourseShelf(event.currentTarget.value));

function importDeckName(fileName) {
  return fileName.replace(/\.(apkg|txt|csv|tsv)$/i, "").replace(/\.anki$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Imported flashcards";
}

function saveImportedFlashcards({ fileName, type, cards, skipped = 0 }) {
  const status = $("#anki-import-status");
  if (!cards.length) throw new Error("No readable two-sided flashcards were found.");
  const hasCurrentWork = state.customDraft.length || state.customQuestionDraft.length || state.customFeynmanDraft.length || state.editingCustomDeckId || state.editingBuiltInCollectionId;
  if (hasCurrentWork && !window.confirm("Import this file as a new flashcard set? Your current draft will be replaced.")) return null;
  const requestedName = !state.editingCustomDeckId && !state.editingBuiltInCollectionId ? $("#custom-deck-name").value.trim() : "";
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = null;
  state.customDraft = cards;
  state.customQuestionDraft = [];
  state.customFeynmanDraft = [];
  state.customImportSource = { name: fileName, type, importedAt: Date.now() };
  $("#custom-deck-name").value = requestedName || importDeckName(fileName);
  setNotesContent();
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  selectCreateContentTab("flashcards");
  const deck = saveGeneratedCustomDeckInPlace();
  const skippedCopy = skipped ? ` · ${skipped} media-only or incomplete notes skipped` : "";
  status.textContent = `Imported ${deck.cards.length} flashcards from ${fileName}${skippedCopy} · no questions or Feynman prompts created`;
  showToast(`${deck.name} imported with ${deck.cards.length} flashcards.`);
  return deck;
}

async function importAnkiNotesFile(file) {
  const status = $("#anki-import-status");
  const extension = file.name.split(".").pop().toLowerCase();
  if (!["txt", "csv", "tsv"].includes(extension)) {
    if (extension === "apkg") status.textContent = "The Mac app is opening this APKG package locally…";
    else {
      status.textContent = "Choose an APKG, TXT, CSV, or TSV file.";
      showToast("That file type is not supported.");
    }
    return;
  }
  status.textContent = `Reading ${file.name}…`;
  try {
    const parsed = parseAnkiNotes(file.name, await file.text());
    saveImportedFlashcards({ fileName: file.name, type: extension, cards: parsed.cards });
  } catch (error) {
    status.textContent = error?.message || "This file could not be imported.";
    showToast("I couldn’t import that file. Check that it has at least two fields per note.");
  } finally {
    $("#anki-notes-file").value = "";
  }
}

window.receiveAnkiPackageStatus = (message) => { $("#anki-import-status").textContent = message; };
window.receiveAnkiPackageImport = (payload) => {
  try {
    const parsed = cardsFromAnkiPackageNotes(payload.notes);
    saveImportedFlashcards({ fileName: payload.name, type: "apkg", cards: parsed.cards, skipped: parsed.skipped });
  } catch (error) {
    $("#anki-import-status").textContent = error?.message || "This APKG package could not be imported.";
    showToast("I couldn’t find readable flashcards in that APKG package.");
  }
};
window.receiveAnkiPackageImportError = (message) => {
  $("#anki-import-status").textContent = message;
  showToast("This APKG package could not be imported.");
};

$("#choose-anki-notes").addEventListener("click", () => $("#anki-notes-file").click());
$("#notes-input").addEventListener("paste", (event) => {
  const clipboard = event.clipboardData;
  if (!clipboard) return;
  const richHtml = clipboard.getData("text/html");
  if (!richHtml) return;
  event.preventDefault();
  const safeHtml = sanitizeNotesHtml(richHtml);
  document.execCommand("insertHTML", false, safeHtml);
});
$("#anki-notes-file").addEventListener("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (file) importAnkiNotesFile(file);
});

$("#generate-note-cards").addEventListener("click", () => {
  if (state.editingBuiltInCollectionId) {
    saveBuiltInCollectionOverride();
    return;
  }
  const name = $("#custom-deck-name").value.trim();
  const notes = notesPlainText();
  if (!name) { $("#custom-deck-name").focus(); showToast("Give this study set a name first."); return; }
  const hasStudyContent = state.customDraft.length || state.customQuestionDraft.length || state.customFeynmanDraft.length;
  if (!notes && hasStudyContent) {
    const deck = saveCustomDeck({ resetAfterSave: false, notify: false });
    if (!deck) return;
    showToast(`${deck.name} updated with ${deck.cards.length} cards, ${deck.questions.length} questions, and ${deck.feynmanPrompts.length} Feynman prompts.`);
    return;
  }
  if (!notes) { showToast("Add at least one flashcard, question, or Feynman topic."); return; }
  const savedDeck = state.editingCustomDeckId ? loadCustomDecks().find((deck) => deck.id === state.editingCustomDeckId) : null;
  const notesChanged = !savedDeck || notes !== String(savedDeck.sourceNotes || "").trim() || savedDeck.generatorVersion !== NOTES_GENERATOR_VERSION;
  if (notesChanged) {
    const generated = generateCardsFromNotes(notes);
    if (!generated.length) { showToast("I couldn’t find clear facts. Try term: definition or question — answer formatting."); return; }
    state.customImportSource = null;
    const manualCards = state.customDraft.filter((card) => card.manual);
    const manualQuestions = state.customQuestionDraft.filter((question) => question.source === "Manually created");
    state.customDraft = [...generated, ...manualCards];
    state.customQuestionDraft = [...generateQuestionsFromCards(generated), ...manualQuestions];
    const manualFeynmanPrompts = state.customFeynmanDraft.filter((item) => item.manual);
    state.customFeynmanDraft = [...generateFeynmanPrompts(notes, generated), ...manualFeynmanPrompts];
    renderCustomDraft();
    renderCustomQuestionDraft();
    renderCustomFeynmanDraft();
  }
  const deck = state.editingCustomDeckId
    ? saveCustomDeck({ resetAfterSave: false, notify: false })
    : saveGeneratedCustomDeckInPlace();
  if (!deck) return;
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  showToast(`${deck.name} updated with ${deck.cards.length} cards, ${deck.questions.length} questions, and ${deck.feynmanPrompts.length} Feynman prompts.`);
});
$$("[data-create-tab]").forEach((button) => button.addEventListener("click", () => selectCreateContentTab(button.dataset.createTab)));
$("#add-manual-card").addEventListener("click", () => {
  const front = $("#manual-card-front").value.trim();
  const back = $("#manual-card-back").value.trim();
  if ((!front && !state.manualFrontImage) || (!back && !state.manualBackImage)) { showToast("Add text or an image to both sides of the card."); return; }
  state.customDraft.push({ id: makeLocalId("card"), front, back, frontImage: state.manualFrontImage, backImage: state.manualBackImage, manual: true });
  $("#manual-card-front").value = "";
  $("#manual-card-back").value = "";
  state.manualFrontImage = "";
  state.manualBackImage = "";
  renderManualImagePreview("front");
  renderManualImagePreview("back");
  renderCustomDraft();
  $("#manual-card-front").focus();
  showToast("Manual card added. Choose Update set to keep it.");
});
$$('[data-choose-manual-image]').forEach((button) => button.addEventListener("click", () => {
  state.pendingCardImageTarget = { kind: "manual", side: button.dataset.chooseManualImage };
  $("#flashcard-image-file").click();
}));
$$('[data-remove-manual-image]').forEach((button) => button.addEventListener("click", () => applyCardImage({ kind: "manual", side: button.dataset.removeManualImage }, "")));
$("#manual-card-front").addEventListener("paste", (event) => handleCardPaste(event, { kind: "manual", side: "front" }));
$("#manual-card-back").addEventListener("paste", (event) => handleCardPaste(event, { kind: "manual", side: "back" }));
$("#flashcard-image-file").addEventListener("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (file) acceptCardImage(file, state.pendingCardImageTarget);
  event.currentTarget.value = "";
  state.pendingCardImageTarget = null;
});
$("#clear-draft").addEventListener("click", () => {
  if (!state.customDraft.length) return;
  if (!window.confirm(`Clear all ${state.customDraft.length} flashcards from this draft? Questions and Feynman topics will be kept.`)) return;
  state.customDraft = [];
  renderCustomDraft();
  updateCustomSaveButtons();
  showToast("All flashcards cleared. Choose Update set to save the change.");
});
$("#clear-question-draft").addEventListener("click", () => {
  if (!state.customQuestionDraft.length) return;
  if (!window.confirm(`Clear all ${state.customQuestionDraft.length} questions from this draft? Flashcards and Feynman topics will be kept.`)) return;
  state.customQuestionDraft = [];
  renderCustomQuestionDraft();
  updateCustomSaveButtons();
  showToast("All questions cleared. Choose Update set to save the change.");
});
$("#clear-feynman-draft").addEventListener("click", () => {
  if (!state.customFeynmanDraft.length) return;
  if (!window.confirm(`Clear all ${state.customFeynmanDraft.length} Feynman topics from this draft? Flashcards and questions will be kept.`)) return;
  state.customFeynmanDraft = [];
  renderCustomFeynmanDraft();
  updateCustomSaveButtons();
  showToast("All Feynman topics cleared. Choose Update set to save the change.");
});
$("#add-manual-question").addEventListener("click", () => {
  const prompt = $("#manual-question-prompt").value.trim();
  const answer = $("#manual-question-answer").value.trim();
  if (!prompt || !answer) { showToast("Complete both the question and its answer."); return; }
  state.customQuestionDraft.push({ id: makeLocalId("question"), type: $("#manual-question-type").value, prompt, answer, source: "Manually created" });
  $("#manual-question-prompt").value = "";
  $("#manual-question-answer").value = "";
  renderCustomQuestionDraft();
  $("#manual-question-prompt").focus();
});
function addManualFeynmanTopic() {
  const input = $("#manual-feynman-topic");
  const prompt = input.value.trim().replace(/[.!]+$/, "");
  if (!prompt) { input.focus(); showToast("Type a Feynman topic first."); return; }
  state.customFeynmanDraft.push({ id: makeLocalId("feynman"), prompt, manual: true });
  input.value = "";
  renderCustomFeynmanDraft();
  input.focus();
  showToast("Feynman topic added. Choose Update set to keep it.");
}
$("#add-manual-feynman").addEventListener("click", addManualFeynmanTopic);
$("#manual-feynman-topic").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addManualFeynmanTopic(); } });
$("#new-custom-study-set").addEventListener("click", () => {
  const hasDraft = state.customDraft.length || state.customQuestionDraft.length || state.customFeynmanDraft.length || $("#custom-deck-name").value.trim() || notesPlainText();
  let updatedName = "";
  if (state.editingBuiltInCollectionId) {
    const updated = saveBuiltInCollectionOverride({ notify: false });
    if (!updated) return;
    updatedName = updated.name;
  } else if (state.editingCustomDeckId) {
    const savedDeck = loadCustomDecks().find((deck) => deck.id === state.editingCustomDeckId);
    const notes = notesPlainText();
    if (savedDeck && notes && (notes !== String(savedDeck.sourceNotes || "").trim() || savedDeck.generatorVersion !== NOTES_GENERATOR_VERSION)) {
      const generated = generateCardsFromNotes(notes);
      if (!generated.length) { $("#notes-input").focus(); showToast("I couldn’t update this set from those notes yet."); return; }
      state.customImportSource = null;
      const manualCards = state.customDraft.filter((card) => card.manual);
      const manualQuestions = state.customQuestionDraft.filter((question) => question.source === "Manually created");
      state.customDraft = [...generated, ...manualCards];
      state.customQuestionDraft = [...generateQuestionsFromCards(generated), ...manualQuestions];
      const manualFeynmanPrompts = state.customFeynmanDraft.filter((item) => item.manual);
      state.customFeynmanDraft = [...generateFeynmanPrompts(notes, generated), ...manualFeynmanPrompts];
    }
    const updated = saveCustomDeck({ resetAfterSave: false, notify: false });
    if (!updated) return;
    updatedName = updated.name;
  } else if (hasDraft && !window.confirm("Start a new study set? This unsaved draft will be cleared.")) return;
  resetCustomDraft();
  $("#custom-deck-name").focus();
  showToast(updatedName ? `${updatedName} updated. New blank study set ready.` : "New study set ready.");
});
$("#close-custom-study").addEventListener("click", () => showAppView(state.customStudyReturnView));
$("#delete-all-study-sets").addEventListener("click", deleteAllStudySets);
$("#cancel-custom-delete").addEventListener("click", () => { state.pendingCustomDeleteId = null; state.pendingBuiltInDeleteId = null; state.pendingDeleteAllStudySets = false; showAppView(state.customDeleteReturnView); });
$("#confirm-custom-delete").addEventListener("click", confirmCustomDeckDeletion);
$$('[data-custom-study-mode]').forEach((button) => button.addEventListener("click", () => startCustomReview(button.dataset.customStudyMode)));
$("#close-custom-review").addEventListener("click", closeCustomReview);
function revealCustomReviewCard() {
  if (!["regular", "anki"].includes(state.customReviewMode)) return;
  state.customReviewRevealed = true;
  if (state.customReviewMode === "anki") state.customReviewWasRevealed = true;
  renderCustomReviewCard();
}
function toggleCustomReviewCard() {
  if (!["regular", "anki"].includes(state.customReviewMode)) return;
  state.customReviewRevealed = !state.customReviewRevealed;
  if (state.customReviewMode === "anki" && state.customReviewRevealed) state.customReviewWasRevealed = true;
  renderCustomReviewCard();
}
$("#custom-review-card").addEventListener("click", toggleCustomReviewCard);
$("#custom-review-reveal").addEventListener("click", revealCustomReviewCard);
$("#delete-custom-anki-card").addEventListener("click", deleteCurrentCustomAnkiCard);
$("#custom-review-previous").addEventListener("click", () => { if (state.customReviewPosition > 0) { state.customReviewPosition -= 1; state.customReviewRevealed = false; state.customReviewWasRevealed = false; renderCustomReviewCard(); } });
$("#custom-review-next").addEventListener("click", () => {
  if (state.customReviewPosition >= state.customReviewCards.length - 1) { closeCustomReview(); return; }
  state.customReviewPosition += 1;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  renderCustomReviewCard();
});
$("#custom-question-previous").addEventListener("click", () => moveCustomQuestion(-1));
$("#check-custom-question").addEventListener("click", () => answerCustomQuestion());
$("#custom-question-next").addEventListener("click", () => moveCustomQuestion(1));
$("#custom-feynman-time-amount").addEventListener("input", (event) => {
  state.customFeynmanTimeAmount = Math.max(1, Math.min(120, Number(event.currentTarget.value) || 1));
  if (!state.customFeynmanStartedAt) $("#custom-feynman-countdown").textContent = formatElapsed(customFeynmanDurationSeconds() * 1000);
});
$("#custom-feynman-time-unit").addEventListener("change", (event) => {
  state.customFeynmanTimeUnit = event.currentTarget.value;
  if (!state.customFeynmanStartedAt) $("#custom-feynman-countdown").textContent = formatElapsed(customFeynmanDurationSeconds() * 1000);
});
$("#start-custom-feynman-timer").addEventListener("click", startCustomFeynmanTimer);
$("#custom-feynman-previous").addEventListener("click", () => moveCustomFeynman(-1));
$("#custom-feynman-next").addEventListener("click", () => moveCustomFeynman(1));
$$('[data-custom-anki-rating]').forEach((button) => button.addEventListener("click", () => rateCustomAnkiCard(button.dataset.customAnkiRating)));

$("#open-settings").addEventListener("click", () => showAppView("settings"));
$$('[data-settings-tab]').forEach((button) => button.addEventListener("click", () => selectSettingsTab(button.dataset.settingsTab)));
$("#settings-form").addEventListener("change", (event) => { if (event.target.name === "theme") applyTheme(event.target.value); });
$("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const settings = settingsFromForm();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyTheme(settings.theme);
  populateSettingsForm();
  showToast("Settings saved. New Anki sessions will use them.");
});
$("#reset-settings").addEventListener("click", () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  applyTheme(DEFAULT_SETTINGS.theme);
  populateSettingsForm();
  showToast("Settings restored to defaults.");
});

$$("[data-toast]").forEach((element) => element.addEventListener("click", () => showToast(element.dataset.toast)));
$$(".primary-nav .nav-item").forEach((item) => item.addEventListener("click", (event) => {
  const target = item.getAttribute("href");
  if (["#courses", "#dashboard", "#flashcards", "#create", "#study-guide"].includes(target)) { event.preventDefault(); showAppView(target.slice(1)); }
}));
$$('.mobile-nav a[href="#courses"], .mobile-nav a[href="#dashboard"], .mobile-nav a[href="#flashcards"], .mobile-nav a[href="#create"], .mobile-nav a[href="#study-guide"]').forEach((item) => item.addEventListener("click", (event) => { event.preventDefault(); showAppView(item.getAttribute("href").slice(1)); }));
$("#flashcards-create-set").addEventListener("click", () => { showAppView("create"); $("#new-custom-study-set").click(); });
$(".brand").addEventListener("click", (event) => { event.preventDefault(); showAppView("dashboard"); });
document.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $(".search-field input").focus(); } });
