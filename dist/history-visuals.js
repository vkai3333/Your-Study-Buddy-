(() => {
  const addFrontImage = (decks, id, image, credit) => {
    const card = decks.flatMap((deck) => deck.cards || []).find((entry) => entry.id === id);
    if (!card) return;
    card.backImage = image;
    card.imageCredit = credit;
  };

  const addPersonCard = (decks, deckId, card) => {
    const deck = decks.find((entry) => entry.id === deckId);
    if (!deck || deck.cards.some((entry) => entry.id === card.id || entry.front === card.front)) return;
    if (card.frontImage) {
      card.backImage = card.frontImage;
      delete card.frontImage;
    }
    deck.cards.push(card);
  };

  const europeanHistory = window.AP_EUROPEAN_HISTORY_DECKS || [];
  addFrontImage(europeanHistory, "apeuro-u2-c14", "./history-images/henry-viii.jpg", "Hans Holbein the Younger / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u3-c10", "./history-images/louis-xiv.jpg", "Hyacinthe Rigaud / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u5-c28", "./history-images/napoleon.jpg", "Jacques-Louis David / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u2-c1", "./history-images/martin-luther.jpg", "Lucas Cranach the Younger / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u3-c6", "./history-images/peter-the-great.jpg", "University of Texas at Austin / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u4-c35", "./history-images/catherine-the-great.jpg", "Fedor Rokotov / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u7-c9", "./history-images/karl-marx.jpg", "John Jabez Edwin Mayall / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u8-c37", "./history-images/lenin.jpg", "Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u6-c16", "./history-images/charles-darwin.jpg", "Herbert Rose Barraud / Wikimedia Commons / public domain");
  addFrontImage(europeanHistory, "apeuro-u8-c68", "./history-images/adolf-hitler.jpg", "German Federal Archives / Wikimedia Commons / CC BY-SA 3.0 DE");
  addFrontImage(europeanHistory, "apeuro-u9-c1", "./history-images/joseph-stalin.jpg", "Wikimedia Commons / CC0");

  const worldHistory = window.AP_WORLD_HISTORY_DECKS || [];
  addFrontImage(worldHistory, "apworld-u2-c3", "./history-images/mongol-empire.svg", "Bkkbrad and historicair / Wikimedia Commons / CC BY-SA");
  addFrontImage(worldHistory, "apworld-u3-c18", "./history-images/ottoman-empire.png", "Atilim Gunes Baydin / Wikimedia Commons / CC BY-SA");
  addFrontImage(worldHistory, "apworld-u3-c5", "./history-images/peter-the-great.jpg", "University of Texas at Austin / Wikimedia Commons / public domain");
  addFrontImage(worldHistory, "apworld-u1-c25", "./history-images/aztec-empire.svg", "Sémhur / Wikimedia Commons / CC BY-SA");
  addFrontImage(worldHistory, "apworld-u1-c26", "./history-images/inca-empire.svg", "QQuantum / Wikimedia Commons / CC BY-SA");
  addFrontImage(worldHistory, "apworld-u3-c19", "./history-images/safavid-empire.png", "André Koehne / Wikimedia Commons / CC BY-SA");

  const usHistory = window.AP_US_HISTORY_DECKS || [];
  addFrontImage(usHistory, "apush-period-4-c36", "./history-images/louisiana-purchase.png", "William Morris / Wikimedia Commons / CC BY-SA 4.0");
  addFrontImage(usHistory, "apush-period-7-c7", "./history-images/great-migration.png", "U.S. Census Bureau / Wikimedia Commons / public domain");
  addFrontImage(usHistory, "apush-period-6-c28", "./history-images/john-rockefeller.jpg", "Pach Brothers / National Portrait Gallery / CC0");

  [
    ["apush-period-3", {
      id: "apush-person-george-washington", front: "George Washington",
      back: "Commander of the Continental Army, president of the Constitutional Convention, and first U.S. president. He established precedents for the executive branch, supported Hamilton’s financial program, and pursued neutrality in European wars.",
      frontImage: "./history-images/george-washington.jpg", imageCredit: "Gilbert Stuart / Wikimedia Commons / public domain", sourcePage: "CED Period 3"
    }],
    ["apush-period-3", {
      id: "apush-person-thomas-jefferson", front: "Thomas Jefferson",
      back: "Principal author of the Declaration of Independence, leader of the Democratic-Republicans, and third U.S. president. His Louisiana Purchase expanded the nation despite his preference for a limited federal government and strict constitutional interpretation.",
      frontImage: "./history-images/thomas-jefferson.jpg", imageCredit: "Rembrandt Peale / Wikimedia Commons / public domain", sourcePage: "CED Periods 3–4"
    }],
    ["apush-period-3", {
      id: "apush-person-alexander-hamilton", front: "Alexander Hamilton",
      back: "Federalist leader and first secretary of the treasury whose financial program funded the national debt, assumed state debts, created the Bank of the United States, and encouraged manufacturing through a broad interpretation of federal power.",
      frontImage: "./history-images/alexander-hamilton.jpg", imageCredit: "U.S. Department of the Treasury / Wikimedia Commons / public domain", sourcePage: "CED Period 3"
    }],
    ["apush-period-4", {
      id: "apush-person-andrew-jackson", front: "Andrew Jackson",
      back: "Seventh U.S. president and symbol of expanded political participation for white men. His presidency featured the spoils system, Bank War, forceful use of executive power, tariff conflict, and Indian removal.",
      frontImage: "./history-images/andrew-jackson.jpg", imageCredit: "Ralph Eleaser Whiteside Earl / Wikimedia Commons / public domain", sourcePage: "CED Period 4"
    }],
    ["apush-period-5", {
      id: "apush-person-abraham-lincoln", front: "Abraham Lincoln",
      back: "Sixteenth U.S. president who led the Union during the Civil War. He framed the war first around preserving the Union and later made emancipation a central war aim; his reelection helped secure Union victory and the Thirteenth Amendment.",
      frontImage: "./history-images/abraham-lincoln.jpg", imageCredit: "George Peter Alexander Healy / Wikimedia Commons / public domain", sourcePage: "CED Period 5"
    }],
    ["apush-period-5", {
      id: "apush-person-frederick-douglass", front: "Frederick Douglass",
      back: "Formerly enslaved abolitionist, author, and orator who exposed slavery’s brutality and demanded immediate emancipation, equal citizenship, and Black military service during the Civil War.",
      frontImage: "./history-images/frederick-douglass.jpg", imageCredit: "Library of Congress / Wikimedia Commons / public domain", sourcePage: "CED Period 5"
    }],
    ["apush-period-5", {
      id: "apush-person-harriet-tubman", front: "Harriet Tubman",
      back: "Abolitionist who escaped slavery, repeatedly guided others to freedom through the Underground Railroad, and served the Union as a nurse, scout, and spy during the Civil War.",
      frontImage: "./history-images/harriet-tubman.jpg", imageCredit: "Horatio Seymour Squyer / Wikimedia Commons / public domain", sourcePage: "CED Period 5"
    }],
    ["apush-period-6", {
      id: "apush-person-ida-b-wells", front: "Ida B. Wells",
      back: "Journalist, civil-rights activist, and suffragist who documented lynching as organized racial terror, challenged segregation, and helped found organizations that fought for Black political and legal equality.",
      frontImage: "./history-images/ida-b-wells.jpg", imageCredit: "Wikimedia Commons / public domain", sourcePage: "CED Periods 6–7"
    }],
    ["apush-period-7", {
      id: "apush-person-theodore-roosevelt", front: "Theodore Roosevelt",
      back: "Progressive president whose Square Deal promoted consumer protection, conservation, and regulation of large corporations. In foreign affairs he expanded U.S. influence through the Roosevelt Corollary and “big stick” diplomacy.",
      frontImage: "./history-images/theodore-roosevelt.jpg", imageCredit: "Pach Brothers / Wikimedia Commons / public domain", sourcePage: "CED Period 7"
    }],
    ["apush-period-7", {
      id: "apush-person-franklin-roosevelt", front: "Franklin D. Roosevelt",
      back: "President during the Great Depression and most of World War II. His New Deal relief, recovery, and reform programs expanded federal responsibility for economic security and built a durable Democratic coalition.",
      frontImage: "./history-images/franklin-roosevelt.jpg", imageCredit: "U.S. National Archives / Wikimedia Commons / public domain", sourcePage: "CED Period 7"
    }],
    ["apush-period-8", {
      id: "apush-person-john-kennedy", front: "John F. Kennedy",
      back: "Cold War president associated with the New Frontier, the space race, the failed Bay of Pigs invasion, and the Cuban Missile Crisis. He increasingly supported federal civil-rights legislation before his assassination in 1963.",
      frontImage: "./history-images/john-kennedy.jpg", imageCredit: "Cecil Stoughton, White House / Wikimedia Commons / public domain", sourcePage: "CED Period 8"
    }],
    ["apush-period-8", {
      id: "apush-person-martin-luther-king", front: "Martin Luther King Jr.",
      back: "Minister and civil-rights leader who used nonviolent direct action through the Southern Christian Leadership Conference. Campaigns in Birmingham, the March on Washington, and Selma helped build support for the Civil Rights Act of 1964 and Voting Rights Act of 1965.",
      frontImage: "./history-images/martin-luther-king.jpg", imageCredit: "Betsy Graves Reyneau, U.S. National Archives / Wikimedia Commons / public domain", sourcePage: "CED Period 8"
    }],
    ["apush-period-9", {
      id: "apush-person-ronald-reagan", front: "Ronald Reagan",
      back: "President who embodied the modern conservative resurgence. He promoted tax cuts, deregulation, reduced domestic spending, a military buildup, and a confrontational early Cold War policy before negotiating with Mikhail Gorbachev.",
      frontImage: "./history-images/ronald-reagan.jpg", imageCredit: "White House / Wikimedia Commons / public domain", sourcePage: "CED Period 9"
    }]
  ].forEach(([deckId, card]) => addPersonCard(usHistory, deckId, card));
})();
