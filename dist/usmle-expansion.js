(() => {
  const decks = window.USMLE_DECKS || [];
  const mcat = window.MCAT_REVIEW_DECKS || [];
  if (!decks.length || !mcat.length) return;
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const seen = new Set(decks.flatMap((deck) => deck.cards).map((card) => normalize(card.front)));
  const route = (card, fallback) => {
    const text = `${card.front} ${card.back}`.toLowerCase();
    if (/heart|cardiac|arter|vein|blood pressure|hemoglobin|coag|platelet|anemia/.test(text)) return /hemoglobin|coag|platelet|anemia/.test(text) ? 7 : 1;
    if (/lung|pulmonary|respir|alveol|oxygen|carbon dioxide/.test(text)) return 2;
    if (/kidney|renal|nephron|urine|electrolyte|acid.base/.test(text)) return 3;
    if (/liver|gastro|intestin|pancrea|bile|digest|absorption/.test(text)) return 4;
    if (/hormone|endocr|glucose|insulin|thyroid|adrenal|metabol/.test(text)) return 5;
    if (/brain|neuron|nerv|vision|hearing|synap|memory|cognit/.test(text)) return 6;
    if (/immune|lymph|antibod|cancer|tumor|blood|erythro|leuk/.test(text)) return 7;
    if (/bone|muscle|joint|skin|collagen/.test(text)) return 8;
    if (/pregnan|reproduct|embry|child|develop/.test(text)) return 9;
    if (/bacter|virus|fung|parasite|infection|antibiotic/.test(text)) return 10;
    if (/psych|behavior|social|ethic|capacity|bias|study|statistic|epidemi/.test(text)) return 11;
    return fallback;
  };
  const eligibleThemes = new Map([[0,0],[1,0],[2,5],[3,0],[9,11],[10,6],[11,11],[12,11]]);
  eligibleThemes.forEach((fallback, themeIndex) => {
    (mcat[themeIndex]?.cards || []).forEach((source) => {
      const key = normalize(source.front);
      if (!key || seen.has(key)) return;
      seen.add(key);
      const targetIndex = route(source, fallback);
      const target = decks[targetIndex];
      target.cards.push({
        ...JSON.parse(JSON.stringify(source)),
        id: `usmle-${targetIndex + 1}-x${target.cards.length + 1}`,
        courseLevel: "Step 1",
        crosswalkSource: "MCAT foundational science bank",
      });
    });
  });

  const visuals = [
    { pattern: /nephron|proximal tubule|loop of henle|collecting duct/i, image: "./usmle-images/nephron.svg", credit: "Burton Radons / Wikimedia Commons / CC0 1.0" },
    { pattern: /emphysema/i, image: "./usmle-images/emphysema.jpg", credit: "PLoS Medicine via Wikimedia Commons / CC BY 2.0" },
    { pattern: /myocardial infarction|coagulative necrosis/i, image: "./usmle-images/mi-histology.jpg", credit: "Wikimedia Commons / CC BY 4.0" },
  ];
  visuals.forEach(({ pattern, image, credit }) => {
    let used = 0;
    decks.flatMap((deck) => deck.cards).forEach((card) => {
      if (used >= 8 || card.backImage || !pattern.test(`${card.front} ${card.back}`)) return;
      card.backImage = image;
      card.imageCredit = credit;
      used += 1;
    });
  });
  window.USMLE_DECKS = decks;
})();
