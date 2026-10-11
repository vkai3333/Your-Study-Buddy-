#!/usr/bin/env node
/* Build a current-CED AP Biology deck from a curated subset of Campbell vocabulary. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(root, "dist/vocabulary-data.js"), "utf8"));

const units = [
  ["Chemistry of Life", ["polar covalent bond","electronegativity","van der Waals interactions","cohesion","specific heat","buffer","hydrophilic","hydrophobic","aqueous solution","monomer","hydrolysis","carbohydrate","monosaccharide","cellulose","glycogen","lipid","fatty acid","phospholipid","amino acid","protein","denaturation","nucleic acid","nucleotide","ATP (adenosine triphosphate)"]],
  ["Cells", ["cell","prokaryotic cell","nucleus","nuclear envelope","ribosome","endomembrane system","endoplasmic reticulum (ER)","rough ER","smooth ER","Golgi apparatus","lysosome","mitochondria","cytoskeleton","microtubule","microfilament","plasma membrane","fluid mosaic model","amphipathic","diffusion","osmosis","facilitated diffusion","active transport","electrochemical gradient","endocytosis","exocytosis"]],
  ["Cellular Energetics", ["enzyme","activation energy","active site","substrate","induced fit","competitive inhibitor","noncompetitive inhibitor","allosteric regulation","feedback inhibition","energy coupling","ATP synthase","photosynthesis","photosystem","light reactions","Calvin cycle","carbon fixation","rubisco","photorespiration","cellular respiration","glycolysis","acetyl CoA","electron transport chain","proton-motive force","fermentation"]],
  ["Cell Communication and Cell Cycle", ["signal transduction","signal transduction pathway","G protein","protein kinase","cyclic AMP (cAMP)","phosphorylation cascade","apoptosis","cell cycle","cell cycle control system","cell division","mitosis","mitotic (M) phase","S phase","prophase","prometaphase","metaphase","metaphase plate","mitotic spindle","sister chromatids","telophase","cytokinesis","cleavage furrow","cell plate","cyclin"]],
  ["Heredity", ["meiosis","fertilization","zygote","diploid cell","somatic cell","sister chromatids","chiasmata","allele","genotype","phenotype","law of segregation","testcross","monohybrid cross","dihybrid","Punnett square","complete dominance","incomplete dominance","codominance","multifactorial","polygenic inheritance","linked genes","linkage map","nondisjunction","genomic imprinting"]],
  ["Gene Expression and Regulation", ["DNA replication","origin of replication","helicase","leading strand","transcription","promoter","RNA processing","RNA splicing","alternative RNA splicing","codon","reading frame","ribosome","mutation","insertion","deletion","operon","operator","activator","inducer","differential gene expression","DNA technology","restriction enzyme"]],
  ["Natural Selection", ["adaptation","variation","balancing selection","Hardy-Weinberg equilibrium","adaptive evolution","directional selection","mutation","allele","genotype","phenotype","allopatric speciation","speciation","macroevolution","punctuated equilibria","adaptive radiation","analogy","phylogeny","phylogenetic tree","clade","monophyletic","sister taxa","molecular clock"]],
  ["Ecology", ["fixed action pattern","learning","imprinting","associative learning","communication","optimal foraging model","inclusive fitness","metapopulation","density","carrying capacity","density dependent","density independent","community","ecosystem","ecological niche","competitive exclusion","mutualism","commensalism","primary succession","ecological succession","trophic level","primary production","species diversity","species richness","decomposer"]],
];

const prompts = [
  ["Water's properties and biological systems","Structure and function of biological macromolecules"],
  ["Cell structure and function","Membrane transport and osmoregulation","Origins of cellular compartmentalization"],
  ["Enzyme function and regulation","Photosynthesis","Cellular respiration"],
  ["Signal transduction pathways","Feedback regulation","Cell-cycle control and cancer"],
  ["Meiosis and genetic diversity","Mendelian and non-Mendelian inheritance"],
  ["DNA replication","Gene expression from DNA to protein","Regulation of gene expression","Biotechnology"],
  ["Natural selection and population change","Hardy–Weinberg equilibrium","Evidence for common ancestry","Speciation and phylogeny"],
  ["Population growth and regulation","Community interactions","Energy flow through ecosystems","Biodiversity and ecosystem disruption"],
];

// Required CED concepts that are absent, incomplete, or poorly OCRed in the source glossary.
const supplements = [
  [
    ["Hydrogen bond","A weak attraction between a partially positive hydrogen atom and an electronegative atom; collectively, these bonds give water many of its biological properties."],
    ["Adhesion","The attraction between unlike substances, such as water molecules and the walls of plant xylem."],
    ["Surface tension","Resistance of a liquid surface to stretching or breaking because cohesive forces pull surface molecules inward."],
    ["pH","A logarithmic measure of hydrogen ion concentration; each one-unit change represents a tenfold change in H+ concentration."],
    ["Dehydration synthesis","A reaction that covalently joins monomers while releasing a molecule of water."],
    ["Polymer","A large molecule made of repeating or similar monomer subunits."],
    ["Peptide bond","The covalent bond formed between the carboxyl group of one amino acid and the amino group of another."],
    ["Primary protein structure","The unique amino acid sequence of a polypeptide."],
    ["Secondary protein structure","Local alpha helices and beta sheets formed mainly by hydrogen bonding along the polypeptide backbone."],
    ["Tertiary protein structure","The overall three-dimensional shape of one polypeptide produced by interactions among its side chains."],
    ["Quaternary protein structure","The arrangement of two or more polypeptide subunits into one functional protein."],
    ["Triglyceride","A lipid consisting of glycerol joined to three fatty acids; it functions mainly in long-term energy storage."],
    ["Functional group","A specific group of atoms that gives an organic molecule characteristic chemical properties."],
    ["Hydroxyl group","A polar -OH functional group found in alcohols that can form hydrogen bonds with water."],
    ["Carboxyl group","An acidic -COOH functional group that can donate H+ and become negatively charged."],
    ["Saturated fatty acid","A fatty acid with no carbon-carbon double bonds; its straight chain packs tightly."],
    ["Unsaturated fatty acid","A fatty acid with one or more carbon-carbon double bonds that introduce bends and reduce tight packing."],
    ["Molecular directionality","The chemically distinct ends of a biological polymer, such as the 5' and 3' ends of nucleic acids or the amino and carboxyl ends of proteins."],
  ],
  [
    ["Eukaryotic cell","A cell containing a membrane-bound nucleus and other membrane-bound organelles."],
    ["Chloroplast","The photosynthetic organelle of plants and algae; its thylakoid membranes capture light energy and its stroma contains the Calvin cycle."],
    ["Selective permeability","The property of a membrane that permits some substances to cross more readily than others."],
    ["Surface-area-to-volume ratio","The amount of membrane surface relative to cell volume; it decreases as a cell grows and limits exchange with the environment."],
    ["Tonicity","A solution's ability to cause a cell to gain or lose water, determined by nonpenetrating solute concentrations."],
    ["Water potential","The potential energy of water relative to pure water; water moves from higher water potential to lower water potential."],
    ["Aquaporin","A membrane channel protein that enables rapid, selective movement of water across a membrane."],
    ["Sodium-potassium pump","An ATP-powered transport protein that moves three Na+ out of a cell and two K+ into it per cycle."],
    ["Endosymbiotic theory","The hypothesis that mitochondria and chloroplasts originated as free-living prokaryotes engulfed by an ancestral cell."],
    ["Compartmentalization","Division of a cell into regions that maintain distinct conditions and allow incompatible reactions to occur efficiently."],
    ["Plasmolysis","Separation of a plant cell's plasma membrane from its wall after water leaves the cell in a hypertonic environment."],
    ["Cotransport","Coupled transport in which movement of one solute down its electrochemical gradient powers movement of another solute."],
    ["Membrane protein","A protein associated with a membrane that may transport substances, receive signals, catalyze reactions, identify cells, or attach structures."],
    ["Water-potential equation","Water potential is calculated as Ψ = Ψs + Ψp, the sum of solute potential and pressure potential."],
    ["Solute-potential equation","For a solution, Ψs = -iCRT, where i is the ionization constant, C is molar concentration, R is the pressure constant, and T is absolute temperature."],
    ["Evidence for endosymbiosis","Mitochondria and chloroplasts contain circular DNA, bacterial-like ribosomes, double membranes, and divide independently by binary fission."],
  ],
  [
    ["Oxidation-reduction reaction","A reaction involving electron transfer; oxidation loses electrons and reduction gains electrons."],
    ["NADH","A reduced electron carrier that delivers high-energy electrons to the electron transport chain."],
    ["FADH2","A reduced electron carrier that donates electrons to the electron transport chain at a later point than NADH."],
    ["Citric acid cycle","A cyclic pathway in the mitochondrial matrix that oxidizes acetyl-CoA, releases CO2, and produces NADH, FADH2, and ATP."],
    ["Oxidative phosphorylation","ATP production powered by electron transport and chemiosmosis across a membrane."],
    ["Chemiosmosis","Use of energy stored in a proton gradient to drive ATP synthesis through ATP synthase."],
    ["Cyclic electron flow","A photosynthetic route around photosystem I that produces ATP without producing NADPH or oxygen."],
    ["C3 plant","A plant that initially fixes CO2 into a three-carbon compound directly through the Calvin cycle."],
    ["C4 plant","A plant that spatially separates initial CO2 fixation from the Calvin cycle, reducing photorespiration in hot conditions."],
    ["CAM plant","A plant that opens stomata at night and temporally separates CO2 fixation from the Calvin cycle to conserve water."],
    ["Enzyme denaturation","Loss of enzyme shape and function when environmental conditions disrupt the interactions maintaining protein structure."],
    ["Optimal temperature","The temperature at which an enzyme's reaction rate is highest before instability or denaturation reduces activity."],
    ["Optimal pH","The pH at which an enzyme's active-site chemistry and structure support its highest activity."],
    ["Reaction-rate graph","A graph showing product formation or substrate loss over time; its slope represents reaction rate."],
    ["NADP+","An oxidized electron carrier that accepts electrons and H+ during the light reactions of photosynthesis."],
    ["NADPH","A reduced electron carrier produced in the light reactions and used to reduce carbon compounds in the Calvin cycle."],
    ["Anaerobic pathway","An energy pathway that does not require oxygen; fermentation regenerates NAD+ so glycolysis can continue."],
  ],
  [
    ["Ligand","A signaling molecule that binds specifically to a receptor."],
    ["Receptor","A protein that detects a signaling molecule and initiates a cellular response."],
    ["Second messenger","A small intracellular molecule or ion, such as cAMP or Ca2+, that relays and amplifies a signal."],
    ["Calcium signaling","Use of changes in cytosolic Ca2+ concentration as an intracellular signal."],
    ["Protein phosphatase","An enzyme that removes phosphate groups from proteins, often reversing protein-kinase activity."],
    ["Negative feedback","A regulatory mechanism in which a response reduces the original stimulus and stabilizes a system."],
    ["Positive feedback","A regulatory mechanism in which a response amplifies the original stimulus until a terminating event occurs."],
    ["Cell-cycle checkpoint","A control point where stop-and-go signals regulate progression through the cell cycle."],
    ["Cyclin-dependent kinase (CDK)","A protein kinase activated by binding a cyclin; cyclin-CDK complexes regulate cell-cycle transitions."],
    ["Cancer","Uncontrolled cell division caused by failures in normal cell-cycle regulation."],
    ["Signal amplification","Multiplication of a cellular signal as one activated component activates many downstream molecules."],
    ["Quorum sensing","Cell-to-cell signaling that allows microorganisms to coordinate gene expression according to population density."],
    ["Caspase","A protease that participates in the signaling cascade and controlled cellular dismantling of apoptosis."],
    ["Proto-oncogene","A normal gene that promotes cell growth or division and can become an oncogene when mutated or overexpressed."],
    ["Tumor-suppressor gene","A gene whose product restrains cell division, repairs DNA, or promotes apoptosis; loss of function can contribute to cancer."],
  ],
  [
    ["Crossing over","Exchange of corresponding DNA segments between nonsister chromatids of homologous chromosomes during prophase I."],
    ["Independent assortment","The random orientation of homologous chromosome pairs at metaphase I, producing varied chromosome combinations in gametes."],
    ["Recombination frequency","The percentage of recombinant offspring; it estimates the distance between linked genes up to a maximum of 50%."],
    ["Epistasis","An interaction in which one gene alters or masks the phenotypic expression of another gene."],
    ["Pleiotropy","The ability of one gene to affect multiple phenotypic traits."],
    ["Sex-linked trait","A trait determined by a gene on a sex chromosome, most commonly the X chromosome."],
    ["Pedigree","A diagram showing the inheritance of a trait through multiple generations of a family."],
    ["Environmental effect on phenotype","A change in phenotype caused by environmental conditions without a change in genotype."],
    ["Genetic linkage","The tendency of genes located near one another on the same chromosome to be inherited together."],
    ["Product rule","For independent events, the probability that all occur equals the product of their individual probabilities."],
    ["Sum rule","For mutually exclusive outcomes, the probability that one occurs equals the sum of their individual probabilities."],
    ["Map unit","A unit of genetic distance corresponding to a 1% recombination frequency; it is also called a centimorgan."],
    ["Norm of reaction","The range of phenotypes a genotype can produce under different environmental conditions."],
    ["Pedigree interpretation","Analysis of trait patterns across generations to infer dominance, recessiveness, sex linkage, and possible genotypes."],
  ],
  [
    ["DNA polymerase","An enzyme that adds DNA nucleotides to the 3' end of a growing strand and proofreads newly synthesized DNA."],
    ["Lagging strand","The new DNA strand synthesized discontinuously away from the replication fork as Okazaki fragments."],
    ["Okazaki fragment","A short segment of DNA synthesized on the lagging strand and later joined by DNA ligase."],
    ["Messenger RNA (mRNA)","An RNA transcript that carries coding information from DNA to a ribosome."],
    ["Transfer RNA (tRNA)","An adaptor RNA that pairs its anticodon with an mRNA codon and carries the corresponding amino acid."],
    ["Translation","Synthesis of a polypeptide by a ribosome using the codon sequence of mRNA."],
    ["Transcription factor","A regulatory protein that binds DNA and influences transcription."],
    ["Epigenetic regulation","Heritable changes in gene expression caused by chromatin modifications rather than changes in DNA sequence."],
    ["Polymerase chain reaction (PCR)","A technique that uses repeated temperature cycles and DNA polymerase to amplify a chosen DNA segment."],
    ["Gel electrophoresis","A technique that separates nucleic acid fragments by size as they migrate through a gel in an electric field."],
    ["Topoisomerase","An enzyme that relieves twisting strain ahead of the replication fork by temporarily cutting and rejoining DNA."],
    ["Single-strand binding protein","A protein that stabilizes separated DNA strands and prevents them from re-forming the double helix during replication."],
    ["Primase","An enzyme that synthesizes short RNA primers during DNA replication."],
    ["RNA primer","A short RNA strand providing the free 3'-OH required for DNA polymerase to begin synthesis."],
    ["DNA ligase","An enzyme that seals breaks in the sugar-phosphate backbone, including gaps between Okazaki fragments."],
    ["Telomerase","An enzyme that extends telomeres using an internal RNA template, helping prevent loss of chromosome-end DNA."],
    ["RNA polymerase","The transcription enzyme that builds RNA from a DNA template; it is not the enzyme that replicates DNA."],
    ["Lac operon","An inducible bacterial gene-regulation system that permits lactose metabolism when lactose is available and glucose is scarce."],
    ["Trp operon","A repressible bacterial gene-regulation system normally active until tryptophan activates its repressor."],
    ["MicroRNA (miRNA)","A small RNA that associates with proteins and reduces gene expression by degrading target mRNA or inhibiting its translation."],
    ["Plasmid","A small, independently replicating circular DNA molecule commonly found in bacteria and used as a cloning vector."],
    ["Bacterial transformation","Uptake and incorporation of external DNA by a bacterial cell."],
    ["DNA sequencing","Determination of the nucleotide order in a DNA molecule."],
  ],
  [
    ["Fitness","An organism's relative contribution of viable, fertile offspring to the next generation."],
    ["Natural selection","Differential survival and reproduction caused by heritable phenotypic variation."],
    ["Gene flow","Movement of alleles between populations through migration and reproduction."],
    ["Genetic drift","Random change in allele frequencies, with especially strong effects in small populations."],
    ["Founder effect","Genetic drift that occurs when a new population is established by a small number of individuals."],
    ["Bottleneck effect","Genetic drift following a sharp reduction in population size that leaves a nonrepresentative sample of alleles."],
    ["Stabilizing selection","Selection favoring intermediate phenotypes over both extremes."],
    ["Disruptive selection","Selection favoring both phenotypic extremes over intermediate phenotypes."],
    ["Sexual selection","Selection arising from differences in mating success."],
    ["Reproductive isolation","Biological barriers that prevent gene flow between populations."],
    ["Homologous structure","A feature similar because of shared ancestry, even when its function differs among species."],
    ["Vestigial structure","A reduced inherited feature that has lost most or all of its ancestral function."],
    ["Hardy-Weinberg equation","For two alleles, p + q = 1 and p² + 2pq + q² = 1 describe allele and genotype frequencies in a non-evolving population."],
    ["Prezygotic barrier","A reproductive barrier that prevents mating or fertilization before a zygote forms."],
    ["Postzygotic barrier","A reproductive barrier that reduces hybrid viability or fertility after fertilization."],
    ["Common ancestry","Shared descent inferred from homologous structures, fossils, embryology, biogeography, and molecular similarities."],
    ["Convergent evolution","Independent evolution of similar traits in distantly related lineages exposed to similar selective pressures."],
    ["Allele-frequency change","A change in the proportion of an allele in a population across generations; it is a measurable definition of evolution."],
  ],
  [
    ["Taxis","Directed movement toward or away from a stimulus."],
    ["Kinesis","A nondirectional change in activity or turning rate in response to a stimulus."],
    ["Exponential growth","Population growth under unlimited conditions, producing a J-shaped curve."],
    ["Logistic growth","Population growth that slows near carrying capacity, producing an S-shaped curve."],
    ["Density-dependent factor","A limiting factor whose effect increases with population density, such as competition or disease."],
    ["Density-independent factor","A limiting factor that affects populations regardless of density, such as a severe storm."],
    ["Keystone species","A species whose effect on community structure is disproportionately large relative to its abundance."],
    ["Biodiversity","Variation among organisms at genetic, species, and ecosystem levels."],
    ["Ecosystem resilience","The ability of an ecosystem to resist or recover from disturbance."],
    ["Ecological disruption","A disturbance that changes population sizes, community interactions, or ecosystem processes."],
    ["Chi-square test","A statistical test comparing observed and expected categorical counts to evaluate whether deviations are likely due to chance."],
    ["Error bar","A graphical representation of variability or uncertainty around a measured value."],
    ["Gross primary productivity (GPP)","The total rate at which producers capture and store chemical energy in an ecosystem."],
    ["Net primary productivity (NPP)","Energy stored as producer biomass after respiration; NPP = GPP - respiration."],
    ["Trophic efficiency","The percentage of production transferred from one trophic level to the next, commonly about 10%."],
    ["Secondary succession","Community recovery after a disturbance that leaves soil intact."],
    ["Invasive species","A nonnative species that spreads and causes ecological, economic, or human-health harm."],
    ["Standard error","An estimate of how much a sample mean is expected to vary among repeated samples."],
    ["Confidence interval","A range calculated from sample data that estimates a population parameter with a stated confidence level."],
    ["Statistical significance","Evidence that an observed result would be unlikely under the null hypothesis at a chosen probability threshold."],
    ["Null hypothesis","A testable statement predicting no real difference or association; observed deviations are attributed to chance."],
    ["Experimental control","A comparison condition used to isolate the effect of the independent variable."],
  ],
];

const glossary = new Map();
for (const entries of Object.values(window.CAMPBELL_VOCABULARY)) {
  for (const [term, definition] of entries) {
    const key = term.toLowerCase();
    if (!glossary.has(key) && definition && definition.length > 20) glossary.set(key, definition.replace(/\s+/g, " ").trim());
  }
}

const missing = [];
const decks = units.map(([name, terms], unitIndex) => {
  const id = `apbio-unit-${unitIndex + 1}`;
  const cards = terms.map((term, cardIndex) => {
    const back = glossary.get(term.toLowerCase());
    if (!back) missing.push(term);
    return { id: `${id}-c${cardIndex + 1}`, front: term, back: back || "" };
  });
  for (const [front, back] of supplements[unitIndex]) {
    cards.push({ id: `${id}-c${cards.length + 1}`, front, back });
  }
  return {
    id,
    name: `AP Biology · Unit ${unitIndex + 1}`,
    shortName: `Unit ${unitIndex + 1}: ${name}`,
    builtIn: true,
    sourceTitle: "AP Biology Course and Exam Description, Effective Fall 2025; EBSCO AP Biology Study Guide",
    sourceUrl: "https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf",
    cards,
    questions: [],
    feynmanPrompts: prompts[unitIndex].map((prompt, index) => ({ id: `${id}-f${index + 1}`, prompt })),
  };
});

if (missing.length) {
  console.error(`Missing definitions: ${missing.join(", ")}`);
  process.exit(1);
}
fs.writeFileSync(path.join(root, "dist/apbiology-data.js"), `window.AP_BIOLOGY_DECKS = ${JSON.stringify(decks)};\n`);
console.log(`Wrote ${decks.reduce((sum, deck) => sum + deck.cards.length, 0)} cards across ${decks.length} AP Biology units.`);
