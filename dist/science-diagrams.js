(() => {
  const addFrontImage = (decks, id, image, credit) => {
    const card = decks.flatMap((deck) => deck.cards || []).find((entry) => entry.id === id);
    if (!card) return;
    card.backImage = image;
    card.imageCredit = credit;
  };

  const addBackImage = (decks, id, image, credit) => {
    const card = decks.flatMap((deck) => deck.cards || []).find((entry) => entry.id === id);
    if (!card) return;
    card.backImage = image;
    card.imageCredit = credit;
  };

  const biology = window.AP_BIOLOGY_DECKS || [];
  addFrontImage(biology, "apbio-unit-2-c12", "./science-diagrams/biology-mitochondrion.svg", "Kelvinsong / Wikimedia Commons / CC BY-SA 3.0");
  addFrontImage(biology, "apbio-unit-2-c16", "./science-diagrams/biology-membrane.svg", "LadyofHats / Wikimedia Commons / public domain");
  addFrontImage(biology, "apbio-unit-4-c8", "./science-diagrams/biology-cell-cycle.svg", "George Weller / Wikimedia Commons / CC BY-SA");
  addFrontImage(biology, "apbio-unit-6-c1", "./science-diagrams/biology-dna-replication.svg", "LadyofHats / Wikimedia Commons / public domain");

  const psychology = window.AP_PSYCHOLOGY_DECKS || [];
  addFrontImage(psychology, "appsych-unit-1-c61", "./science-diagrams/psychology-neuron.svg", "LadyofHats / Wikimedia Commons / public domain");
  addFrontImage(psychology, "appsych-unit-1-c14", "./science-diagrams/psychology-brainstem.svg", "Patrick J. Lynch / Wikimedia Commons / CC BY 2.5");
  addFrontImage(psychology, "appsych-unit-1-c44", "./science-diagrams/psychology-inner-ear.svg", "Patrick J. Lynch / Wikimedia Commons / CC BY 2.5");
  addFrontImage(psychology, "appsych-unit-1-c3", "./science-diagrams/psychology-action-potential.svg", "Laurens R. Krol / Wikimedia Commons / CC BY-SA 4.0");

  const chemistry = window.AP_CHEMISTRY_DECKS || [];
  addBackImage(chemistry, "apchem-u1-c12", "./science-diagrams/chemistry-mass-spectrum.svg", "NIH BioArt / Wikimedia Commons / public domain");
  addBackImage(chemistry, "apchem-u1-c24", "./science-diagrams/chemistry-photoelectron-spectrum.png", "Wikimedia Commons / CC BY-SA 4.0");
  addBackImage(chemistry, "apchem-u1-c13", "./science-diagrams/chemistry-electromagnetic-spectrum.svg", "U.S. National Institutes of Health / Wikimedia Commons / public domain");
  addBackImage(chemistry, "apchem-u3-c24", "./science-diagrams/chemistry-beer-law.jpg", "Adilia James and Sarah Coutlee / Wikimedia Commons / public domain");
  addBackImage(chemistry, "apchem-u3-c23", "./science-diagrams/chemistry-chromatogram.svg", "Wikimedia Commons / CC BY-SA");

  const humanGeography = window.AP_HUMAN_GEOGRAPHY_DECKS || [];
  addFrontImage(humanGeography, "aphug-u7-c24", "./science-diagrams/geography-hoyt-model.svg", "Wikimedia Commons / CC BY-SA");
  addFrontImage(humanGeography, "aphug-u7-c28", "./science-diagrams/geography-multiple-nuclei.png", "Wikimedia Commons / CC BY-SA");
  addFrontImage(humanGeography, "aphug-u7-c1", "./science-diagrams/geography-central-place.png", "Wikimedia Commons / CC BY-SA");
  addFrontImage(humanGeography, "aphug-u5-c79", "./science-diagrams/geography-von-thunen.png", "W576A925 / Wikimedia Commons / public domain");
})();
