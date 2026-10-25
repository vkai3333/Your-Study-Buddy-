(() => {
  const decks = window.MCAT_REVIEW_DECKS;
  if (!Array.isArray(decks) || decks.length < 4) return;
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const allCards = () => decks.flatMap((deck) => deck.cards || []);
  const upsert = (theme, front, back, extra = {}) => {
    const existing = allCards().find((card) => normalize(card.front) === normalize(front));
    if (existing) { existing.back = back; Object.assign(existing, extra); return existing; }
    const deck = decks[theme];
    const card = { id: `mcat-extra-t${theme + 1}-c${deck.cards.length + 1}`, front, back, ...extra };
    deck.cards.push(card);
    return card;
  };
  const image = (name) => ({ backImage: `./mcat-images/${name}.png`, imageCredit: "NIH/NLM PubChem / U.S. government scientific resource" });
  [
    ["Alanine", "Ala, A. Small nonpolar amino acid with a methyl side chain; commonly carries nitrogen from muscle to liver in the glucose–alanine cycle.", "alanine"],
    ["Arginine", "Arg, R. Basic, positively charged amino acid with a guanidinium side chain; participates in the urea cycle and nitric-oxide synthesis.", "arginine"],
    ["Asparagine", "Asn, N. Polar uncharged amino acid with an amide side chain; a common site of N-linked glycosylation.", "asparagine"],
    ["Aspartate", "Asp, D. Acidic, negatively charged amino acid at physiological pH; participates in the urea cycle and nucleotide synthesis.", "aspartic-acid"],
    ["Cysteine", "Cys, C. Polar sulfur-containing amino acid whose thiol can form disulfide bonds; also contributes to glutathione.", "cysteine"],
    ["Glutamate", "Glu, E. Acidic, negatively charged amino acid; major excitatory neurotransmitter and central collector/donor of amino groups.", "glutamic-acid"],
    ["Glutamine", "Gln, Q. Polar uncharged amide that safely transports nitrogen and donates nitrogen in biosynthetic reactions.", "glutamine"],
    ["Glycine", "Gly, G. Smallest amino acid, with hydrogen as its side chain; achiral, flexible, and common in collagen turns.", "glycine"],
    ["Histidine", "His, H. Aromatic basic amino acid with an imidazole side chain whose pKa near physiological pH makes it useful in acid–base catalysis.", "histidine"],
    ["Isoleucine", "Ile, I. Nonpolar, branched-chain, essential amino acid; both glucogenic and ketogenic.", "isoleucine"],
    ["Leucine", "Leu, L. Nonpolar, branched-chain, essential amino acid; exclusively ketogenic and an important nutrient signal.", "leucine"],
    ["Lysine", "Lys, K. Basic, positively charged essential amino acid with an ε-amino group; exclusively ketogenic.", "lysine"],
    ["Methionine", "Met, M. Nonpolar sulfur-containing essential amino acid; initiator amino acid and precursor of S-adenosylmethionine.", "methionine"],
    ["Phenylalanine", "Phe, F. Nonpolar aromatic essential amino acid and precursor of tyrosine; its aromatic ring absorbs ultraviolet light weakly.", "phenylalanine"],
    ["Proline", "Pro, P. Nonpolar cyclic imino acid that restricts backbone rotation, disrupts α helices, and creates turns; abundant in collagen.", "proline"],
    ["Serine", "Ser, S. Polar uncharged hydroxyl-containing amino acid; can be phosphorylated and participates in catalytic triads.", "serine"],
    ["Threonine", "Thr, T. Polar uncharged, essential hydroxyl-containing amino acid; can be phosphorylated and is both glucogenic and ketogenic.", "threonine"],
    ["Tryptophan", "Trp, W. Nonpolar aromatic essential amino acid with an indole ring; precursor of serotonin, melatonin, and niacin and strongest protein UV absorber.", "tryptophan"],
    ["Tyrosine", "Tyr, Y. Polar aromatic amino acid with a phenolic hydroxyl; can be phosphorylated and is a precursor of catecholamines, thyroid hormone, and melanin.", "tyrosine"],
    ["Valine", "Val, V. Nonpolar, branched-chain, essential amino acid that is glucogenic.", "valine"],
  ].forEach(([front, back, file]) => upsert(0, front, back, image(file)));

  const vitaminRows = `Vitamin A|Fat-soluble retinoids and carotenoids important for vision, epithelial differentiation, growth, reproduction, and immune function.
Retinol|Alcohol storage/transport form of vitamin A that can be reversibly oxidized to retinal.
Retinal|Vitamin A aldehyde that combines with opsins; 11-cis-retinal isomerizes after photon absorption in vision.
Retinoic acid|Vitamin A-derived signaling molecule that regulates gene transcription through nuclear receptors; it cannot be converted back to retinal.
Beta-carotene|Plant carotenoid that can be cleaved to vitamin A and also functions as an antioxidant.
Vitamin B1 (thiamine)|Water-soluble vitamin whose active coenzyme TPP transfers aldehyde groups in oxidative decarboxylation and transketolase reactions.
Thiamine pyrophosphate (TPP)|Active B1 coenzyme used by pyruvate dehydrogenase, α-ketoglutarate dehydrogenase, branched-chain α-ketoacid dehydrogenase, and transketolase.
Vitamin B2 (riboflavin)|Precursor of FAD and FMN, redox cofactors that carry one or two electrons.
Flavin adenine dinucleotide (FAD)|B2-derived redox coenzyme used by succinate dehydrogenase, acyl-CoA dehydrogenase, and other flavoproteins.
Flavin mononucleotide (FMN)|B2-derived redox cofactor found prominently in electron-transport-chain complex I.
Vitamin B3 (niacin)|Precursor of NAD+ and NADP+; can be synthesized partly from tryptophan.
Nicotinamide adenine dinucleotide (NAD+)|B3-derived electron carrier used mainly in catabolic oxidation; accepts a hydride to become NADH.
NAD phosphate (NADP+)|Phosphorylated B3-derived carrier whose reduced form NADPH supports reductive biosynthesis and antioxidant defense.
Vitamin B5 (pantothenic acid)|Component of coenzyme A and acyl carrier protein, required for acyl-group transfer.
Coenzyme A|B5-containing carrier whose thiol forms high-energy thioesters such as acetyl-CoA and fatty acyl-CoA.
Vitamin B6 (pyridoxine)|Family of vitamers converted to pyridoxal phosphate, important in amino-acid metabolism, neurotransmitter synthesis, and heme synthesis.
Pyridoxal phosphate (PLP)|Active B6 coenzyme that stabilizes reaction intermediates in transamination, decarboxylation, and glycogen phosphorylase reactions.
Vitamin B7 (biotin)|Covalently bound coenzyme that carries activated carbon dioxide in carboxylase reactions.
Biotin-dependent carboxylases|Pyruvate carboxylase, acetyl-CoA carboxylase, propionyl-CoA carboxylase, and methylcrotonyl-CoA carboxylase require biotin.
Vitamin B9 (folate)|One-carbon-transfer vitamin needed for nucleotide synthesis and methylation; deficiency impairs DNA synthesis and causes megaloblastic anemia.
Tetrahydrofolate (THF)|Reduced active folate carrier that transfers one-carbon units at several oxidation states.
5-methyl-THF|Folate form that donates a methyl group to homocysteine in the B12-dependent regeneration of methionine.
Vitamin B12 (cobalamin)|Cobalt-containing vitamin required for methionine synthase and methylmalonyl-CoA mutase; deficiency can cause neurologic injury and megaloblastic anemia.
Methylcobalamin|B12 form used by methionine synthase to transfer a methyl group from 5-methyl-THF to homocysteine.
Adenosylcobalamin|B12 form used by methylmalonyl-CoA mutase to convert methylmalonyl-CoA to succinyl-CoA.
Vitamin C (ascorbic acid)|Water-soluble antioxidant and reducing agent required for collagen hydroxylation, carnitine synthesis, catecholamine synthesis, and improved nonheme iron absorption.
Vitamin D|Fat-soluble steroid-like vitamin regulating calcium and phosphate balance, bone mineralization, and gene expression.
Vitamin D2 (ergocalciferol)|Plant/fungal vitamin D form that can be hydroxylated to active hormone.
Vitamin D3 (cholecalciferol)|Skin- and animal-derived vitamin D form produced from 7-dehydrocholesterol under UVB light.
Calcitriol|1,25-dihydroxyvitamin D, the active hormonal form that increases intestinal calcium and phosphate absorption.
Calcidiol|25-hydroxyvitamin D, the major circulating storage form commonly measured to assess vitamin D status.
Vitamin E|Fat-soluble antioxidant family that protects membrane lipids from free-radical chain reactions.
Alpha-tocopherol|Principal biologically retained vitamin E form in humans.
Vitamin K|Fat-soluble vitamin required to γ-carboxylate glutamate residues in clotting and bone proteins so they can bind calcium.
Vitamin K1 (phylloquinone)|Plant-derived vitamin K form abundant in leafy green vegetables.
Vitamin K2 (menaquinone)|Family of vitamin K forms produced by bacteria and found in some fermented or animal foods.
Essential vitamin|Organic micronutrient required in small amounts that humans cannot synthesize adequately and therefore must obtain from diet.
Fat-soluble vitamins|Vitamins A, D, E, and K; stored more readily in tissues and therefore more likely than water-soluble vitamins to accumulate to toxic levels.
Water-soluble vitamins|The B-complex vitamins and vitamin C; generally have limited body storage, with B12 as a major exception.`;
  vitaminRows.trim().split("\n").forEach((line) => { const [front, back] = line.split("|"); upsert(3, front, back); });

  const metabolismRows = `Glycolysis overview|Cytosolic pathway converting glucose to two pyruvate, net two ATP, and two NADH; it can operate without oxygen.
Glycolysis step 1: hexokinase or glucokinase|Glucose is phosphorylated to glucose-6-phosphate using ATP, trapping it in the cell; this irreversible step is inhibited by its product in most tissues.
Glycolysis step 2: phosphoglucose isomerase|Glucose-6-phosphate is reversibly rearranged to fructose-6-phosphate.
Glycolysis step 3: phosphofructokinase-1|Fructose-6-phosphate becomes fructose-1,6-bisphosphate using ATP; this committed irreversible step is activated by AMP and fructose-2,6-bisphosphate and inhibited by ATP and citrate.
Glycolysis step 4: aldolase|Fructose-1,6-bisphosphate splits into glyceraldehyde-3-phosphate and dihydroxyacetone phosphate.
Glycolysis step 5: triose phosphate isomerase|Dihydroxyacetone phosphate reversibly becomes glyceraldehyde-3-phosphate, producing two equivalent three-carbon substrates per glucose.
Glycolysis step 6: glyceraldehyde-3-phosphate dehydrogenase|Glyceraldehyde-3-phosphate is oxidized and phosphorylated to 1,3-bisphosphoglycerate while NAD+ becomes NADH.
Glycolysis step 7: phosphoglycerate kinase|1,3-bisphosphoglycerate donates phosphate to ADP, forming ATP by substrate-level phosphorylation and 3-phosphoglycerate.
Glycolysis step 8: phosphoglycerate mutase|3-phosphoglycerate is rearranged to 2-phosphoglycerate.
Glycolysis step 9: enolase|2-phosphoglycerate loses water to form phosphoenolpyruvate.
Glycolysis step 10: pyruvate kinase|Phosphoenolpyruvate donates phosphate to ADP, forming ATP and pyruvate in an irreversible substrate-level phosphorylation.
Lactate dehydrogenase|Reversibly reduces pyruvate to lactate while oxidizing NADH to NAD+, regenerating the NAD+ required for anaerobic glycolysis.
Pyruvate dehydrogenase complex|Irreversibly converts pyruvate, CoA, and NAD+ into acetyl-CoA, carbon dioxide, and NADH in the mitochondrial matrix.
Pyruvate dehydrogenase cofactors|TPP, lipoic acid, CoA, FAD, and NAD+—remembered as five coenzymes derived from B1, lipoate, B5, B2, and B3.
Citric acid cycle overview|Mitochondrial cycle oxidizing each acetyl-CoA to two CO2 while producing three NADH, one FADH2, and one GTP.
TCA step 1: citrate synthase|Oxaloacetate and acetyl-CoA condense irreversibly to citrate.
TCA step 2: aconitase|Citrate is reversibly isomerized to isocitrate through cis-aconitate.
TCA step 3: isocitrate dehydrogenase|Isocitrate undergoes oxidative decarboxylation to α-ketoglutarate, producing CO2 and NADH; ADP activates and ATP/NADH inhibit.
TCA step 4: α-ketoglutarate dehydrogenase|α-Ketoglutarate undergoes oxidative decarboxylation to succinyl-CoA, producing CO2 and NADH using cofactors analogous to pyruvate dehydrogenase.
TCA step 5: succinyl-CoA synthetase|Succinyl-CoA becomes succinate while driving substrate-level phosphorylation of GDP to GTP.
TCA step 6: succinate dehydrogenase|Succinate is oxidized to fumarate while FAD becomes FADH2; the enzyme is also electron-transport-chain complex II.
TCA step 7: fumarase|Fumarate is hydrated to malate.
TCA step 8: malate dehydrogenase|Malate is oxidized to oxaloacetate while NAD+ becomes NADH.
Electron transport chain complex I|Accepts electrons from NADH, transfers them to ubiquinone, and pumps protons from matrix to intermembrane space.
Electron transport chain complex II|Succinate dehydrogenase transfers electrons from FADH2 to ubiquinone but does not pump protons.
Coenzyme Q|Lipid-soluble electron carrier that moves electrons from complexes I and II to complex III.
Electron transport chain complex III|Transfers electrons from reduced coenzyme Q to cytochrome c and pumps protons through the Q cycle.
Cytochrome c|Small mobile protein carrying one electron at a time from complex III to complex IV.
Electron transport chain complex IV|Transfers electrons to oxygen, producing water, and pumps protons; oxygen is the final electron acceptor.
ATP synthase|Uses proton-motive force to rotate and phosphorylate ADP to ATP through oxidative phosphorylation.
Gluconeogenesis overview|Primarily hepatic synthesis of glucose from lactate, glycerol, and glucogenic amino acids during fasting.
Pyruvate carboxylase|Mitochondrial biotin enzyme converting pyruvate to oxaloacetate using ATP; activated by acetyl-CoA.
PEP carboxykinase|Converts oxaloacetate to phosphoenolpyruvate using GTP and releases CO2.
Fructose-1,6-bisphosphatase|Gluconeogenic bypass enzyme converting fructose-1,6-bisphosphate to fructose-6-phosphate; inhibited by AMP and fructose-2,6-bisphosphate.
Glucose-6-phosphatase|ER enzyme in liver and kidney that releases free glucose from glucose-6-phosphate; absent from skeletal muscle.
Glycogenesis|Synthesis of glycogen from UDP-glucose, driven by glycogen synthase and branching enzyme.
Glycogen synthase|Extends glycogen through α-1,4 glycosidic bonds; stimulated by insulin-mediated dephosphorylation.
Branching enzyme|Creates α-1,6 branches, increasing glycogen solubility and the number of nonreducing ends.
Glycogenolysis|Breakdown of glycogen by glycogen phosphorylase and debranching enzyme to release glucose-1-phosphate and free glucose at branch points.
Glycogen phosphorylase|Uses inorganic phosphate to cleave α-1,4 bonds at nonreducing ends; activated by phosphorylation in liver and muscle.
Debranching enzyme|Transfers a short oligosaccharide and hydrolyzes the remaining α-1,6 bond during glycogen breakdown.
Pentose phosphate pathway oxidative phase|Irreversible cytosolic production of NADPH, ribulose-5-phosphate, and CO2 from glucose-6-phosphate.
Glucose-6-phosphate dehydrogenase|Rate-limiting PPP enzyme producing NADPH; deficiency makes red blood cells vulnerable to oxidative damage.
Pentose phosphate pathway nonoxidative phase|Reversible interconversion of sugar phosphates using transketolase and transaldolase, connecting ribose needs with glycolysis.
Beta oxidation|Mitochondrial spiral that shortens fatty acyl-CoA by two carbons per cycle and produces acetyl-CoA, NADH, and FADH2.
Carnitine shuttle|Transfers long-chain fatty acyl groups into the mitochondrial matrix using CPT I, translocase, and CPT II.
Beta-oxidation cycle|Repeated oxidation, hydration, oxidation, and thiolysis reactions release one acetyl-CoA and a shortened acyl-CoA.
Fatty acid synthesis|Cytosolic process using acetyl-CoA, malonyl-CoA, ATP, and NADPH to build palmitate on fatty acid synthase.
Acetyl-CoA carboxylase|Biotin-dependent rate-limiting enzyme converting acetyl-CoA to malonyl-CoA; activated by citrate and insulin and inhibited by palmitoyl-CoA and glucagon signaling.
Citrate shuttle|Exports mitochondrial acetyl units as citrate; cytosolic ATP citrate lyase regenerates acetyl-CoA for lipid synthesis.
Ketogenesis|Liver mitochondrial conversion of excess acetyl-CoA into acetoacetate and beta-hydroxybutyrate during prolonged fasting or low carbohydrate availability.
Ketolysis|Extrahepatic conversion of ketone bodies back to acetyl-CoA; liver cannot consume ketones because it lacks thiophorase.
Urea cycle overview|Liver pathway converting toxic nitrogen from ammonia and aspartate into urea for renal excretion.
Carbamoyl phosphate synthetase I|Mitochondrial rate-limiting urea-cycle enzyme combining ammonia and bicarbonate using two ATP; activated by N-acetylglutamate.
Ornithine transcarbamylase|Transfers carbamoyl phosphate to ornithine, producing citrulline in mitochondria.
Argininosuccinate synthetase|Cytosolic enzyme joining citrulline and aspartate using ATP to form argininosuccinate.
Argininosuccinate lyase|Splits argininosuccinate into arginine and fumarate.
Arginase|Hydrolyzes arginine to urea and ornithine, completing the urea cycle.
Cori cycle|Lactate from anaerobic tissues travels to liver for gluconeogenesis; glucose returns to tissues, shifting energy cost to the liver.
Glucose–alanine cycle|Muscle transfers nitrogen and carbon to liver as alanine; liver converts nitrogen to urea and carbon skeleton to glucose.
Fed state metabolism|High insulin promotes glucose uptake in muscle/adipose, glycolysis, glycogen synthesis, fatty-acid synthesis, and protein synthesis.
Fasting state metabolism|Low insulin and high glucagon promote hepatic glycogenolysis, gluconeogenesis, adipose lipolysis, fatty-acid oxidation, and later ketogenesis.
Malate–aspartate shuttle|Transfers cytosolic NADH reducing equivalents into mitochondria as matrix NADH without consuming the electrons.
Glycerol-3-phosphate shuttle|Transfers cytosolic NADH electrons to mitochondrial FAD, entering the respiratory chain at coenzyme Q with lower ATP yield.`;
  metabolismRows.trim().split("\n").forEach((line) => {
    const [front, back] = line.split("|");
    const cycleImage = /glycolysis|hexokinase|phosphofructokinase|pyruvate kinase/i.test(front)
      ? { backImage: "./science-diagrams/biochemistry-glycolysis.svg", imageCredit: "Yikrazuul / Wikimedia Commons / public domain" }
      : /TCA|citric acid cycle|citrate synthase|aconitase|isocitrate dehydrogenase|succinyl-CoA synthetase|fumarase|malate dehydrogenase/i.test(front)
        ? { backImage: "./science-diagrams/biochemistry-citric-acid-cycle.svg", imageCredit: "Choij / Wikimedia Commons / public domain" }
        : /electron transport chain|ATP synthase|oxidative phosphorylation/i.test(front)
          ? { backImage: "./science-diagrams/biochemistry-electron-transport-chain.svg", imageCredit: "T-Fork / Wikimedia Commons / CC0 1.0" }
          : /beta oxidation|ketogenesis/i.test(front)
            ? { backImage: "./science-diagrams/biology-mitochondrion.svg", imageCredit: "Kelvinsong / Wikimedia Commons / CC BY-SA 3.0" }
            : {};
    upsert(2, front, back, cycleImage);
  });

  [
    "How to identify any standard amino acid from its side-chain structure",
    "How to calculate amino-acid net charge as pH crosses each pKa",
    "How to classify amino acids by polarity, charge, aromaticity, and essentiality",
    "How B-vitamin-derived cofactors connect glycolysis, pyruvate oxidation, and the TCA cycle",
    "How to compare fat-soluble and water-soluble vitamin storage and deficiency patterns",
    "How to trace one glucose through glycolysis, pyruvate dehydrogenase, TCA, and oxidative phosphorylation",
    "How to decide whether glycolysis, gluconeogenesis, glycogenesis, or glycogenolysis is active",
    "How to compare fatty-acid oxidation with fatty-acid synthesis",
    "How the liver coordinates ketogenesis, the urea cycle, and gluconeogenesis during fasting",
    "How to predict the metabolic consequence of inhibiting an enzyme or electron-transport complex",
  ].forEach((prompt) => {
    const theme = /amino acid/i.test(prompt) ? 0 : /vitamin/i.test(prompt) ? 3 : 2;
    if (!decks[theme].feynmanPrompts.some((item) => normalize(item.prompt) === normalize(prompt))) decks[theme].feynmanPrompts.push({ id: `mcat-extra-t${theme + 1}-f${decks[theme].feynmanPrompts.length + 1}`, prompt });
  });

  const nonMcatPrompts = new Set([
    "photosynthesis",
    "population growth and regulation",
    "community interactions",
    "energy flow through ecosystems",
    "biodiversity and ecosystem disruption",
  ]);
  decks.forEach((deck) => {
    deck.feynmanPrompts = deck.feynmanPrompts.filter((item) => !nonMcatPrompts.has(normalize(item.prompt)));
  });
})();
