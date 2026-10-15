(() => {
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const addCrosswalk = ({ target, sources, hlPattern, excludePattern = /\bap exam\b|\bcollege board\b/i }) => {
    if (!Array.isArray(target) || target.length < 2) return;
    const [slDeck, hlDeck] = target;
    const existing = new Set([...slDeck.cards, ...hlDeck.cards].map((card) => normalize(card.front)));
    let serial = 1;
    sources.flatMap((decks) => Array.isArray(decks) ? decks : []).forEach((sourceDeck) => {
      (sourceDeck.cards || []).forEach((card) => {
        const key = normalize(card.front);
        const combined = `${card.front || ""} ${card.back || ""}`;
        if (!key || existing.has(key) || excludePattern.test(combined)) return;
        existing.add(key);
        const destination = hlPattern.test(combined) ? hlDeck : slDeck;
        destination.cards.push({
          ...card,
          id: `${destination.id}-x${serial++}`,
          builtInUnitId: destination.id,
          crosswalkSourceUnit: sourceDeck.id,
        });
      });
    });
  };

  const addPrompts = (target, sourceDecks, extraPrompts) => {
    if (!Array.isArray(target) || target.length < 2) return;
    const sourcePrompts = sourceDecks.flatMap((decks) => Array.isArray(decks) ? decks : [])
      .flatMap((deck) => deck.feynmanPrompts || []).map((item) => item.prompt).filter(Boolean);
    const prompts = [...sourcePrompts, ...extraPrompts];
    const seen = new Set(target.flatMap((deck) => deck.feynmanPrompts).map((item) => normalize(item.prompt)));
    prompts.forEach((prompt, index) => {
      const key = normalize(prompt);
      if (!key || seen.has(key)) return;
      seen.add(key);
      const destination = index % 3 === 0 ? target[1] : target[0];
      destination.feynmanPrompts.push({ id: `${destination.id}-xf${destination.feynmanPrompts.length + 1}`, prompt });
    });
  };

  addCrosswalk({
    target: window.IB_BIOLOGY_DECKS,
    sources: [window.AP_BIOLOGY_DECKS],
    hlPattern: /operon|epigen|transcription factor|signal transduction|g protein|second messenger|hardy|phylogen|clad|speciation|genetic drift|electron transport|chemiosmosis|oxidative phosphorylation|photosystem|calvin|rubisco|krebs|citric acid|immune|antibody|lymphocyte|nephron|loop of henle|action potential|synap|hormone|endocrine|stem cell|apoptosis|polymerase chain|gel electrophoresis|restriction enzyme|recombinant|crispr/i,
  });
  addPrompts(window.IB_BIOLOGY_DECKS, [window.AP_BIOLOGY_DECKS], [
    "How to connect molecular structure to biological function", "How to interpret an enzyme-rate graph", "How to predict water movement using water potential",
    "How to compare mitosis and meiosis through their biological purposes", "How to infer inheritance from a pedigree", "How to evaluate evidence for natural selection",
    "How to trace carbon through photosynthesis and respiration", "How to explain kidney function from filtration through the loop of Henle", "How to connect innate and adaptive immune responses",
    "How to evaluate whether data support a biological hypothesis", "How to distinguish correlation from causation in biological research",
  ]);

  addCrosswalk({
    target: window.IB_CHEMISTRY_DECKS,
    sources: [window.AP_CHEMISTRY_DECKS],
    hlPattern: /born haber|lattice|gibbs|entropy|arrhenius|rate law|reaction mechanism|rate determining|buffer|henderson|equivalence|half cell|electrode potential|nernst|faraday|nucleophile|electrophile|substitution|elimination|nmr|mass spect|photoelectron|crystal field|ligand|complex ion|organic mechanism|stereoisomer|chirality|optical isomer/i,
  });
  addPrompts(window.IB_CHEMISTRY_DECKS, [window.AP_CHEMISTRY_DECKS], [
    "How to determine molecular geometry, polarity, and intermolecular forces", "How to choose the correct stoichiometric pathway", "How to interpret mass, infrared, and NMR spectra together",
    "How to construct an equilibrium expression and predict a shift", "How to select an indicator for an acid–base titration", "How to use electrode potentials to predict a redox reaction",
    "How to connect structure with organic reactivity", "How to evaluate uncertainty and systematic error in a chemistry investigation", "How to identify the rate-determining step from a mechanism",
  ]);

  addCrosswalk({
    target: window.IB_PSYCHOLOGY_DECKS,
    sources: [window.AP_PSYCHOLOGY_DECKS],
    hlPattern: /etiology|diagnos|disorder|therapy|treatment|psychopath|prevalence|protective factor|risk factor|randomized|qualitative|reflexiv|transferab|triangulation|gene environment|epigen|agonist|antagonist|neurotransmitter|hormone|localization|neuroplastic|cultural dimension|acculturation/i,
  });
  addPrompts(window.IB_PSYCHOLOGY_DECKS, [window.AP_PSYCHOLOGY_DECKS], [
    "How to explain one behavior through biological, cognitive, and sociocultural lenses", "How to operationalize a psychological construct", "How to select a sampling method and discuss its bias",
    "How to evaluate an experiment’s internal and ecological validity", "How to use an ethical framework when deception may be necessary", "How to compare quantitative and qualitative evidence",
    "How to build an evidence-based explanation without claiming that one study proves a theory", "How to evaluate cultural bias in a psychological explanation", "How to connect etiology, diagnosis, and treatment",
  ]);

  addCrosswalk({
    target: window.IB_ECONOMICS_DECKS,
    sources: [window.AP_MICROECONOMICS_DECKS, window.AP_MACROECONOMICS_DECKS],
    hlPattern: /monopoly|monopolistic|oligopoly|game theory|nash|dominant strategy|collusion|price discrimination|natural monopoly|marginal revenue product|marginal factor cost|monopsony|economic rent|lorenz|gini|multiplier|crowding out|phillips|quantity theory|monetary neutrality|balance of payments|current account|financial account|purchasing power parity|exchange rate/i,
  });
  addPrompts(window.IB_ECONOMICS_DECKS, [window.AP_MICROECONOMICS_DECKS, window.AP_MACROECONOMICS_DECKS], [
    "How to select and fully explain the right diagram for an economics response", "How to distinguish economic growth from economic development", "How to evaluate an intervention using equity and efficiency",
    "How to calculate elasticity and interpret what the value means", "How to connect market failure to an appropriate policy", "How to explain international trade through comparative advantage",
    "How to analyze inflation using competing macroeconomic models", "How to evaluate development strategies using real-world evidence", "How to write a balanced economics conclusion under time pressure",
  ]);

  addCrosswalk({
    target: window.IB_GEOGRAPHY_DECKS,
    sources: [window.AP_HUMAN_GEOGRAPHY_DECKS],
    hlPattern: /globalization|transnational|multinational|global city|world city|outsourcing|offshoring|time space|diaspora|supranational|geopolit|foreign direct investment|global production|commodity chain|core periphery|dependency theory|world systems|neoliberal|cultural diffusion|network|soft power|trade bloc|sovereignty/i,
  });
  addPrompts(window.IB_GEOGRAPHY_DECKS, [], [
    "How to explain a geographic pattern using both physical and human processes", "How to select a case study that supports an argument", "How to compare population policies in contrasting places",
    "How to explain a hydrograph using drainage-basin characteristics", "How to evaluate hard and soft hazard-management strategies", "How to explain coastal change using systems and sediment budgets",
    "How to evaluate food, water, and energy security strategies", "How to compare urban land-use patterns in two cities", "How to assess whether tourism is sustainable",
    "How to analyze an unfamiliar map, graph, or infographic", "How to explain a global flow through networks, nodes, and barriers", "How to evaluate the power of states and non-state actors",
    "How to connect globalization with local cultural change", "How to write a geographic synthesis across multiple scales", "How to evaluate fieldwork sampling and data quality",
    "How to construct a geographic essay around a clear line of argument", "How to distinguish place-specific evidence from a general process", "How to use scale to reconcile apparently conflicting evidence",
    "How to evaluate climate vulnerability and resilience", "How to explain why the same hazard creates unequal disasters", "How to assess progress toward sustainable urban development",
    "How to explain migration using interacting push, pull, and intervening factors", "How to evaluate whether a development indicator captures well-being", "How to compare top-down and bottom-up development",
    "How to connect a commodity to its global production network", "How to analyze winners and losers from a geopolitical decision", "How to use counterarguments in a Paper 3 response",
    "How to turn field observations into a defensible conclusion", "How to distinguish correlation from causation in spatial data", "How to evaluate the limitations of a geographic model",
  ]);

  addCrosswalk({
    target: window.IB_ESS_DECKS,
    sources: [window.AP_ENVIRONMENTAL_SCIENCE_DECKS],
    hlPattern: /environmental law|environmental justice|environmental economics|externality|common pool|tragedy|political ecology|tipping|planetary boundary|life cycle|circular economy|cost benefit|stakeholder|cap and trade|carbon tax|tradable permit|command and control|precautionary|polluter pays|international agreement|montreal protocol|paris agreement|basel convention|cites/i,
  });
  addPrompts(window.IB_ESS_DECKS, [window.AP_ENVIRONMENTAL_SCIENCE_DECKS], [
    "How to trace matter and energy through an environmental system", "How to identify positive and negative feedback from a scenario", "How to compare environmental value systems without stereotyping stakeholders",
    "How to evaluate an environmental policy across ecological, social, and economic criteria", "How to explain why pollution effects change across spatial and temporal scales", "How to connect biodiversity loss with ecosystem resilience",
    "How to design a field investigation with representative sampling", "How to interpret uncertainty without treating it as ignorance", "How to compare mitigation, adaptation, restoration, and prevention",
  ]);

  const addIbCards = (deck, prefix, entries, themeHint) => entries.forEach(([front, back], index) => deck.cards.push({ id: `${prefix}-${index + 1}`, front, back, themeHint }));
  addIbCards(window.IB_ECONOMICS_DECKS[0], "ibecon-ia", [
    ["Key concept lens", "An IA commentary uses one of the course’s key concepts to organize analysis rather than merely mentioning it."],
    ["IA article selection", "Choose a recent, focused news extract containing a clear economic issue that can be analyzed with course theory."],
    ["Diagram integration", "A diagram should be correctly labeled, explained in the text, and applied directly to the article’s situation."],
    ["Stakeholder analysis", "Identify how a policy or outcome affects groups differently, including consumers, producers, workers, government, and future generations."],
    ["Short-run versus long-run evaluation", "A policy’s effects, constraints, and effectiveness can change as behavior and productive capacity adjust over time."],
    ["Assumption testing", "Evaluate whether the assumptions behind a model plausibly hold in the article’s real-world context."],
    ["Policy trade-off", "Improvement in one objective may worsen another, such as efficiency versus equity or growth versus sustainability."],
    ["Evidence-based judgment", "A conclusion should answer the issue using theory and article evidence while recognizing uncertainty and conditions."],
    ["Ceteris paribus", "The modeling assumption that other relevant influences remain constant while one relationship is examined."],
    ["Model limitation", "An economic model deliberately simplifies reality; evaluation identifies which omitted factors matter for the case."],
  ], 4);
  addIbCards(window.IB_GEOGRAPHY_DECKS[0], "ibgeo-physical", [
    ["Drainage-basin system", "Inputs such as precipitation move through stores and transfers before leaving as river discharge or evapotranspiration."],
    ["Hydrograph", "Graph of river discharge over time used to analyze lag time, peak discharge, and storm response."],
    ["Infiltration", "Movement of water from the ground surface into soil."],
    ["Throughflow", "Lateral movement of water through soil toward a channel."],
    ["Surface runoff", "Water flowing over land when rainfall exceeds infiltration or the ground is saturated."],
    ["Sediment budget", "Balance among sediment inputs, transfers, stores, and outputs within a coastal system."],
    ["Longshore drift", "Wave-driven movement of sediment along a coast when waves approach at an angle."],
    ["Coastal erosion", "Removal of coastal material through processes such as hydraulic action, abrasion, attrition, and solution."],
    ["Hazard risk", "Probability and potential severity of loss produced by the interaction of hazard, exposure, vulnerability, and capacity."],
    ["Tectonic plate boundary", "Zone where lithospheric plates converge, diverge, or slide past one another, concentrating geophysical hazards."],
    ["Primary hazard", "Direct physical event such as ground shaking, lava, or ash fall."],
    ["Secondary hazard", "Hazard triggered by a primary event, such as tsunami, landslide, fire, or disease outbreak."],
    ["Disaster preparedness", "Planning, education, drills, supplies, and warning systems intended to reduce losses before an event."],
    ["Hard engineering", "Management using constructed defenses such as dams, levees, groynes, or sea walls."],
    ["Soft engineering", "Management working with natural processes through approaches such as floodplain zoning, beach nourishment, or wetland restoration."],
    ["Extreme environment", "Environment where physical conditions strongly constrain ecosystems and human activity, such as polar or arid regions."],
    ["Aridity", "Persistent moisture deficit in which potential evapotranspiration exceeds precipitation."],
    ["Permafrost", "Ground remaining at or below 0°C for at least two consecutive years."],
  ], 2);
  addIbCards(window.IB_ESS_DECKS[0], "ibess-investigation", [
    ["Focused research question", "A testable environmental question specifying variables, system, location or population, and relevant context."],
    ["Independent variable", "Factor deliberately changed or used to define comparison groups."],
    ["Dependent variable", "Measured response expected to change with the independent variable."],
    ["Controlled variable", "Factor held sufficiently constant so it does not confound the relationship being investigated."],
    ["Representative sampling", "Sampling designed to reflect relevant variation in the target system or population."],
    ["Random sampling", "Selection in which each eligible unit has a known, often equal, chance of inclusion."],
    ["Systematic sampling", "Collection at regular spatial or temporal intervals after a starting point is chosen."],
    ["Measurement uncertainty", "Quantified range associated with the limits of an instrument or measurement process."],
    ["Reliability", "Consistency of a result when a method or measurement is repeated."],
    ["Validity", "Extent to which the method and evidence support the intended conclusion."],
    ["Anomalous result", "Observation differing markedly from the overall pattern; investigate it rather than automatically deleting it."],
    ["Method evaluation", "Specific discussion of limitations, their likely effects, and realistic improvements tied to the investigation."],
  ], 5);

  const themePlans = {
    IB_BIOLOGY_DECKS: [
      ["Unity and diversity", /apbio-unit-(1|7|8)|molecule|water|carbon|carbohydrate|lipid|protein|nucleic|dna|rna|gene|allele|genome|cell theory|prokary|eukary|biodiversity|classification|species/i],
      ["Form and function", /apbio-unit-2|structure|function|membrane|organelle|enzyme|transport|diffusion|osmosis|tissue|organ|muscle|kidney|nephron|loop of henle|heart|lung|root|leaf|xylem|phloem/i],
      ["Interaction and interdependence", /apbio-unit-(3|4|6)|interaction|signal|receptor|hormone|endocrine|nervous|neuron|synap|action potential|immune|antibody|lymphocyte|homeostasis|ecosystem|population|community|food web|energy flow|photosynthesis|respiration/i],
      ["Continuity and change", /apbio-unit-5|replication|cell cycle|mitosis|meiosis|inherit|chromosome|mutation|reproduction|evolution|selection|drift|speciation|phylogen|hardy|continuity|change/i],
    ],
    IB_CHEMISTRY_DECKS: [
      ["Structure 1 · Models of matter", /apchem-unit-1|particle|atom|isotope|mole|molar|stoichi|gas|solution|concentration|mass spectrum|empirical|molecular formula/i],
      ["Structure 2 · Bonding and materials", /apchem-unit-2|bond|ionic|covalent|metallic|lewis|geometry|hybrid|polarity|intermolecular|lattice|solid|crystal/i],
      ["Structure 3 · Classification", /apchem-unit-3|periodic|periodicity|group|transition metal|organic|functional group|homolog|isomer|nomenclature|spectr|chromat|nmr/i],
      ["Reactivity 1 · Energy and direction", /apchem-unit-6|enthalpy|entropy|gibbs|energy|calor|hess|born haber|spontan|thermodynamic/i],
      ["Reactivity 2 · Amount, rate, and extent", /apchem-unit-(4|5|7)|rate|kinetic|equilibrium|reaction quotient|le ch.telier|yield|collision|activation|catalyst|rate law|order/i],
      ["Reactivity 3 · Chemical change", /apchem-unit-(8|9)|acid|base|buffer|titration|redox|oxid|reduc|electro|nucleophile|electrophile|mechanism|substitution|elimination/i],
    ],
    IB_PSYCHOLOGY_DECKS: [
      ["Biological influences", /appsych-unit-2|brain|neural|neuron|synap|neurotransmitter|hormone|gene|genetic|biological|localization|plasticity|agonist|antagonist|evolution/i],
      ["Cognition and behavior", /appsych-unit-3|cognit|memory|thinking|schema|perception|attention|decision|language|intelligence|emotion|learning|conditioning/i],
      ["Sociocultural influences", /appsych-unit-(4|6)|social|cultur|group|identity|norm|conform|obedience|stereotype|prejudice|acculturation|attribution|attitude/i],
      ["Health and human development", /appsych-unit-5|development|child|adolesc|attachment|disorder|diagnos|etiology|treatment|therapy|stress|health|well-being|protective factor|risk factor/i],
      ["Research concepts and methods", /appsych-unit-1|research|experiment|sample|variable|valid|reliab|ethic|qualitative|quantitative|correlation|triangulation|reflexiv|transferab|bias|hypothesis/i],
    ],
    IB_ECONOMICS_DECKS: [
      ["Introduction to economics", /scarcity|choice|opportunity|factor of production|production possibil|positive statement|normative|economic well-being|efficiency|equity|sustainability/i],
      ["Microeconomics", /demand|supply|elastic|market|consumer|producer|tax|subsid|external|public good|common resource|firm|cost|revenue|profit|monopoly|oligopoly|labor|wage|price/i],
      ["Macroeconomics", /gdp|unemployment|inflation|aggregate|fiscal|monetary|business cycle|multiplier|phillips|growth|development|income distribution|interest rate|money/i],
      ["The global economy", /trade|comparative advantage|tariff|quota|exchange rate|currency|balance of payments|current account|financial account|capital flow|foreign|global|terms of trade/i],
      ["Internal assessment and evaluation", /commentary|evaluation|stakeholder|assumption|limitation|real.world|diagram|evidence/i],
    ],
    IB_GEOGRAPHY_DECKS: [
      ["Geographic perspectives and skills", /aphug-unit-1|scale|map|projection|spatial|region|data|fieldwork|sampling|geographic|place|pattern|model|gis|remote sensing/i],
      ["Population and global change", /aphug-unit-2|population|demograph|migration|fertility|mortality|climate|vulnerability|resilience|resource security|development|gender/i],
      ["Physical environments and hazards", /water|drainage|river|coast|ocean|hazard|earthquake|volcano|tectonic|extreme|soil|weather|erosion/i],
      ["Human systems and urban environments", /aphug-unit-(3|5|6)|urban|city|settlement|agricultur|food|health|tourism|industry|land use|central place|von th.nen|housing|transport/i],
      ["HL · Global interactions", /aphug-unit-(4|7)|globalization|transnational|multinational|global city|outsourcing|offshoring|time.space|diaspora|supranational|geopolit|foreign direct|production network|commodity chain|soft power|trade bloc|sovereignty/i],
    ],
    IB_ESS_DECKS: [
      ["Foundations and systems", /apes-unit-3|system|feedback|equilibrium|sustainab|value system|model|energy|matter|ecological footprint|carrying capacity/i],
      ["Ecology, biodiversity, and conservation", /apes-unit-(1|2)|ecosystem|species|population|community|biodiversity|succession|trophic|food web|biome|conservation|habitat|invasive/i],
      ["Water, land, and food systems", /apes-unit-(4|5)|water|aquatic|freshwater|ocean|soil|agricultur|food|forest|land|fisher|irrigation|eutrophication/i],
      ["Atmosphere, climate, and pollution", /apes-unit-7|atmospher|climate|carbon|greenhouse|ozone|air pollution|acid deposition|waste|toxic|pollut|biomagnif/i],
      ["Resources, energy, and governance", /apes-unit-6|energy|resource|fuel|mining|law|econom|justice|policy|externality|common.pool|tipping|planetary|life.cycle|circular|stakeholder|agreement|protocol/i],
      ["Investigation and data skills", /investigation|sampling|data|uncertainty|error|method|hypothesis|variable|reliab|valid/i],
    ],
  };

  const sourceThemeMaps = {
    IB_BIOLOGY_DECKS: { "apbio-unit-1": 0, "apbio-unit-2": 1, "apbio-unit-3": 2, "apbio-unit-4": 2, "apbio-unit-5": 3, "apbio-unit-6": 2, "apbio-unit-7": 3, "apbio-unit-8": 3 },
    IB_CHEMISTRY_DECKS: { "apchem-unit-1": 0, "apchem-unit-2": 1, "apchem-unit-3": 2, "apchem-unit-4": 4, "apchem-unit-5": 4, "apchem-unit-6": 3, "apchem-unit-7": 4, "apchem-unit-8": 5, "apchem-unit-9": 5 },
    IB_PSYCHOLOGY_DECKS: { "appsych-unit-0": 4, "appsych-unit-1": 0, "appsych-unit-2": 1, "appsych-unit-3": 3, "appsych-unit-4": 2, "appsych-unit-5": 3 },
    IB_ECONOMICS_DECKS: { "apmicro-unit-1": 0, "apmicro-unit-2": 1, "apmicro-unit-3": 1, "apmicro-unit-4": 1, "apmicro-unit-5": 1, "apmicro-unit-6": 1, "apmacro-unit-1": 0, "apmacro-unit-2": 2, "apmacro-unit-3": 2, "apmacro-unit-4": 2, "apmacro-unit-5": 2, "apmacro-unit-6": 3 },
    IB_GEOGRAPHY_DECKS: { "aphug-unit-1": 0, "aphug-unit-2": 1, "aphug-unit-3": 3, "aphug-unit-4": 4, "aphug-unit-5": 3, "aphug-unit-6": 3, "aphug-unit-7": 4 },
    IB_ESS_DECKS: { "apes-unit-12": 1, "apes-unit-3": 0, "apes-unit-4": 2, "apes-unit-5": 2, "apes-unit-6": 4, "apes-unit-78": 3, "apes-unit-9": 3 },
  };

  const mergeLevels = (globalKey) => {
    const levels = window[globalKey];
    if (!Array.isArray(levels) || levels.length < 2) return;
    const [sl, hl] = levels;
    const plans = themePlans[globalKey];
    const cards = [...sl.cards.map((card) => ({ ...card, courseLevel: "SL" })), ...hl.cards.map((card) => ({ ...card, courseLevel: "HL" }))];
    const prompts = [...sl.feynmanPrompts.map((prompt) => ({ ...prompt, courseLevel: "SL" })), ...hl.feynmanPrompts.map((prompt) => ({ ...prompt, courseLevel: "HL" }))];
    const buckets = plans.map(([title], index) => ({
      ...sl,
      id: `${sl.id.replace(/-sl$/, "")}-theme-${index + 1}`,
      name: `${sl.name.replace(/ · SL$/, "")} · Theme ${index + 1}`,
      shortName: title,
      description: `${title}. Use the course-level toggle to include or exclude HL material.`,
      cards: [], questions: [], feynmanPrompts: [],
    }));
    const chooseBucket = (text) => {
      const index = plans.findIndex(([, pattern]) => pattern.test(text));
      return buckets[index < 0 ? 0 : index];
    };
    cards.forEach((card) => {
      const mappedIndex = sourceThemeMaps[globalKey]?.[card.crosswalkSourceUnit];
      const bucketIndex = Number.isInteger(card.themeHint) ? card.themeHint : mappedIndex;
      const bucket = Number.isInteger(bucketIndex) ? buckets[bucketIndex] : chooseBucket(`${card.front || ""} ${card.back || ""}`);
      bucket.cards.push(card);
    });
    prompts.forEach((prompt) => chooseBucket(prompt.prompt || "").feynmanPrompts.push(prompt));
    buckets.filter((bucket) => bucket.shortName.startsWith("HL ·")).forEach((bucket) => {
      bucket.cards = bucket.cards.map((card) => ({ ...card, courseLevel: "HL" }));
      bucket.feynmanPrompts = bucket.feynmanPrompts.map((prompt) => ({ ...prompt, courseLevel: "HL" }));
    });
    window[globalKey] = buckets;
  };
  ["IB_BIOLOGY_DECKS", "IB_CHEMISTRY_DECKS", "IB_PSYCHOLOGY_DECKS", "IB_ECONOMICS_DECKS", "IB_GEOGRAPHY_DECKS", "IB_ESS_DECKS"].forEach(mergeLevels);
})();
