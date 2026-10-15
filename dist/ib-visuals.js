(() => {
  const credit = {
    membrane: "OpenStax / Wikimedia Commons / CC BY 4.0",
    mitochondrion: "Kelvinsong / Wikimedia Commons / CC BY-SA 3.0",
    replication: "LadyofHats / Wikimedia Commons / public domain",
    cycle: "Kelvinsong / Wikimedia Commons / CC BY-SA 3.0",
    spectrum: "Philip Ronan / Wikimedia Commons / CC BY-SA 3.0",
    mass: "K. Aainsqatsi / Wikimedia Commons / CC BY-SA 3.0",
    chrom: "Wikimedia Commons / CC BY-SA",
    pes: "Wikimedia Commons / CC BY-SA",
    neuron: "BruceBlaus / Wikimedia Commons / CC BY 3.0",
    action: "Original diagram by Chris 73 / Wikimedia Commons / CC BY-SA",
    brainstem: "OpenStax / Wikimedia Commons / CC BY 4.0",
    ear: "OpenStax / Wikimedia Commons / CC BY 4.0",
    central: "BPL / Wikimedia Commons / CC BY-SA",
    hoyt: "Wikimedia Commons / CC BY-SA",
    thunen: "Wikimedia Commons / CC BY-SA",
  };
  const scienceRules = [
    [/phospholipid|cell membrane|fluid mosaic|selective permeability|membrane protein/i, "./science-diagrams/biology-membrane.svg", credit.membrane, 4],
    [/mitochond|cellular respiration|oxidative phosphorylation|chemiosmosis|electron transport chain/i, "./science-diagrams/biology-mitochondrion.svg", credit.mitochondrion, 4],
    [/dna replication|replication fork|helicase|leading strand|lagging strand|okazaki/i, "./science-diagrams/biology-dna-replication.svg", credit.replication, 4],
    [/cell cycle|mitosis|checkpoint|cyclin/i, "./science-diagrams/biology-cell-cycle.svg", credit.cycle, 3],
    [/electromagnetic spectrum|photon|wavelength|frequency|spectroscopy/i, "./science-diagrams/chemistry-electromagnetic-spectrum.svg", credit.spectrum, 3],
    [/mass spectrum|mass spectrometry|mass-to-charge|isotope abundance/i, "./science-diagrams/chemistry-mass-spectrum.svg", credit.mass, 3],
    [/chromatograph|stationary phase|mobile phase|retention time/i, "./science-diagrams/chemistry-chromatogram.svg", credit.chrom, 3],
    [/photoelectron|binding energy|electron configuration/i, "./science-diagrams/chemistry-photoelectron-spectrum.png", credit.pes, 3],
    [/neuron|dendrite|axon|myelin|synap/i, "./science-diagrams/psychology-neuron.svg", credit.neuron, 3],
    [/action potential|depolarization|repolarization|refractory period/i, "./science-diagrams/psychology-action-potential.svg", credit.action, 3],
    [/brainstem|medulla|pons|reticular formation/i, "./science-diagrams/psychology-brainstem.svg", credit.brainstem, 2],
    [/auditory|hearing|cochlea|inner ear|sensory transduction/i, "./science-diagrams/psychology-inner-ear.svg", credit.ear, 2],
    [/central place|urban hierarchy|threshold|range of a good/i, "./science-diagrams/geography-central-place.png", credit.central, 2],
    [/hoyt|sector model|urban land-use model/i, "./science-diagrams/geography-hoyt-model.svg", credit.hoyt, 2],
    [/von th.nen|agricultural land use|bid-rent/i, "./science-diagrams/geography-von-thunen.png", credit.thunen, 2],
  ];
  const historyRules = [
    [/aztec|mexica|tenochtitlan/i, "./history-images/aztec-empire.svg", "Sémhur / Wikimedia Commons / CC BY-SA", 4],
    [/inca|tawantinsuyu|pizarro|mita\b/i, "./history-images/inca-empire.svg", "QQuantum / Wikimedia Commons / CC BY-SA", 4],
    [/george washington|continental army|first u\.s\. president/i, "./history-images/george-washington.jpg", "Gilbert Stuart / Wikimedia Commons / public domain", 3],
    [/thomas jefferson|declaration of independence|louisiana purchase/i, "./history-images/thomas-jefferson.jpg", "Rembrandt Peale / Wikimedia Commons / public domain", 3],
    [/alexander hamilton|hamiltonian|national bank/i, "./history-images/alexander-hamilton.jpg", "U.S. Department of the Treasury / Wikimedia Commons / public domain", 3],
    [/andrew jackson|jacksonian|bank war|indian removal/i, "./history-images/andrew-jackson.jpg", "Ralph Eleaser Whiteside Earl / Wikimedia Commons / public domain", 3],
    [/abraham lincoln|emancipation proclamation/i, "./history-images/abraham-lincoln.jpg", "George Peter Alexander Healy / Wikimedia Commons / public domain", 3],
    [/frederick douglass|abolitionist movement/i, "./history-images/frederick-douglass.jpg", "Library of Congress / Wikimedia Commons / public domain", 2],
    [/harriet tubman|underground railroad/i, "./history-images/harriet-tubman.jpg", "Horatio Seymour Squyer / Wikimedia Commons / public domain", 2],
    [/ida b\. wells|anti-lynching/i, "./history-images/ida-b-wells.jpg", "Wikimedia Commons / public domain", 2],
    [/theodore roosevelt|roosevelt corollary|square deal/i, "./history-images/theodore-roosevelt.jpg", "Pach Brothers / Wikimedia Commons / public domain", 3],
    [/franklin.*roosevelt|new deal|good neighbor policy/i, "./history-images/franklin-roosevelt.jpg", "U.S. National Archives / Wikimedia Commons / public domain", 3],
    [/john f\. kennedy|kennedy|cuban missile crisis|alliance for progress/i, "./history-images/john-kennedy.jpg", "Cecil Stoughton, White House / Wikimedia Commons / public domain", 3],
    [/martin luther king|march on washington|southern christian leadership/i, "./history-images/martin-luther-king.jpg", "Betsy Graves Reyneau, U.S. National Archives / Wikimedia Commons / public domain", 3],
    [/ronald reagan|reaganomics/i, "./history-images/ronald-reagan.jpg", "White House / Wikimedia Commons / public domain", 2],
    [/john d\. rockefeller|standard oil|robber baron/i, "./history-images/john-rockefeller.jpg", "Pach Brothers / National Portrait Gallery / CC0", 2],
    [/louisiana purchase|lewis and clark/i, "./history-images/louisiana-purchase.png", "William Morris / Wikimedia Commons / CC BY-SA 4.0", 2],
    [/great migration|harlem renaissance/i, "./history-images/great-migration.png", "U.S. Census Bureau / Wikimedia Commons / public domain", 2],
  ];
  const allIbDecks = [
    ...(window.IB_BIOLOGY_DECKS || []), ...(window.IB_CHEMISTRY_DECKS || []),
    ...(window.IB_PSYCHOLOGY_DECKS || []), ...(window.IB_ECONOMICS_DECKS || []),
    ...(window.IB_GEOGRAPHY_DECKS || []), ...(window.IB_ESS_DECKS || []),
  ];
  const historyDecks = window.IB_HISTORY_AMERICAS_DECKS || [];
  const applyRules = (decks, rules, ceiling) => {
    let attached = decks.flatMap((deck) => deck.cards || []).filter((card) => card.backImage).length;
    for (const [pattern, image, imageCredit, limit] of rules) {
      let used = 0;
      for (const card of decks.flatMap((deck) => deck.cards || [])) {
        if (attached >= ceiling || used >= limit) break;
        if (card.backImage || !pattern.test(`${card.front || ""} ${card.back || ""}`)) continue;
        card.backImage = image;
        card.imageCredit = imageCredit;
        attached += 1;
        used += 1;
      }
    }
    return attached;
  };
  applyRules(allIbDecks, scienceRules, 34);
  applyRules(historyDecks, historyRules, 46);
})();
