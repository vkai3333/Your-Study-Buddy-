(() => {
  const sourceUrl = "https://ibo.org/programmes/diploma-programme/curriculum/individuals-and-societies/history/";
  const themes = [
    ["Indigenous societies, conquest, and colonial systems", [1, 2]],
    ["Slavery, resistance, and independence", [2, 3]],
    ["Nation-building, expansion, and civil conflict", [4, 5]],
    ["Industrialization, migration, and reform", [6]],
    ["The Americas in global affairs, 1880–1945", [7]],
    ["Cold War and political change in the Americas", [8]],
    ["Civil rights, democracy, and the contemporary Americas", [8, 9]],
  ];
  const makeDeck = (title, index) => ({
    id: `ibhistamer-theme-${index + 1}`,
    name: `IB History of the Americas · Theme ${index + 1}`,
    shortName: title,
    description: `${title}. Regional-study vocabulary, evidence, comparison, causation, and historical argument.`,
    builtIn: true,
    sourceTitle: "IB History subject brief and History of the Americas regional study",
    sourceUrl,
    cards: [], questions: [], feynmanPrompts: [],
  });
  const decks = themes.map(([title], index) => makeDeck(title, index));
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const seen = new Set();
  const add = (theme, front, back, extra = {}) => {
    const key = normalize(front);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const deck = decks[theme];
    deck.cards.push({ id: `ibhistamer-t${theme + 1}-c${deck.cards.length + 1}`, front, back, ...extra });
  };

  // APUSH is reused only for content that belongs in the wider Americas regional study.
  (window.AP_US_HISTORY_DECKS || []).forEach((sourceDeck, periodIndex) => {
    const period = periodIndex + 1;
    const target = themes.findIndex(([, periods]) => periods.includes(period));
    if (target < 0) return;
    (sourceDeck.cards || []).forEach((card) => add(target, card.front, card.back, {
      sourcePage: card.sourcePage,
      crosswalkSourceUnit: sourceDeck.id,
      ...(card.backImage ? { backImage: card.backImage } : {}),
      ...(card.imageCredit ? { imageCredit: card.imageCredit } : {}),
    }));
  });

  const regional = [
    [0, "Mexica (Aztec) state", "A tribute empire centered on Tenochtitlan whose political authority, markets, warfare, and religious institutions shaped central Mexico before the Spanish conquest."],
    [0, "Inca state", "An Andean empire governed through roads, labor taxation, provincial administration, and reciprocal obligations before conquest by Francisco Pizarro."],
    [0, "Haudenosaunee Confederacy", "Alliance of Indigenous nations governed through the Great Law of Peace; diplomacy and strategic location made it influential in northeastern North America."],
    [0, "Maya city-states", "Politically independent Mesoamerican centers linked by trade, warfare, dynastic rule, writing, astronomy, and shared religious traditions."],
    [0, "Columbian Exchange", "Movement of organisms, foods, diseases, and people across the Atlantic after 1492, transforming environments and societies in both hemispheres."],
    [0, "Encomienda", "Spanish grant allowing colonists to demand Indigenous labor or tribute in exchange for supposed protection and Christian instruction."],
    [0, "Repartimiento", "Colonial Spanish system compelling Indigenous communities to supply rotating labor drafts, formally replacing but often resembling encomienda coercion."],
    [0, "Mita", "Andean labor draft adapted by Spanish authorities, especially to provide workers for silver mining at Potosí."],
    [0, "Potosí", "Major silver-mining center in the Andes whose wealth, coerced labor, and global trade connected colonial America to Europe and Asia."],
    [0, "Casta system", "Flexible but unequal colonial hierarchy that classified people by ancestry and reinforced advantages associated with European status."],
    [0, "Mercantilism in the Americas", "Colonial policy directing trade and resources toward imperial power through monopolies, navigation laws, and restrictions on colonial manufacturing."],
    [0, "Pueblo Revolt", "1680 uprising led by Popé that expelled Spanish colonists from New Mexico for twelve years and temporarily restored Pueblo autonomy."],
    [1, "Atlantic slave trade", "Forced transport of millions of Africans to the Americas, supplying labor to plantation and mining economies while creating enduring African diasporas."],
    [1, "Plantation complex", "Large-scale export agriculture based on land concentration, coerced labor, racial hierarchy, and Atlantic commercial networks."],
    [1, "Maroon communities", "Settlements formed by people who escaped slavery; they preserved autonomy through geography, military resistance, and negotiation."],
    [1, "Haitian Revolution", "Successful 1791–1804 antislavery and anticolonial revolution that created Haiti and challenged racial slavery throughout the Atlantic world."],
    [1, "Toussaint Louverture", "Formerly enslaved leader who became the Haitian Revolution’s leading general and governor before his capture by French forces."],
    [1, "Jean-Jacques Dessalines", "Haitian revolutionary commander who declared independence in 1804 and became the new nation’s first ruler."],
    [1, "Simón Bolívar", "Military and political leader who helped win independence for Venezuela, Colombia, Ecuador, Peru, and Bolivia while advocating continental unity."],
    [1, "José de San Martín", "Independence leader whose campaigns from Argentina through Chile and Peru helped end Spanish rule in southern South America."],
    [1, "Miguel Hidalgo", "Priest whose 1810 Grito de Dolores launched a mass rebellion and the Mexican struggle for independence."],
    [1, "José María Morelos", "Mexican independence leader who called for popular sovereignty, racial equality, and an end to slavery before his execution in 1815."],
    [1, "Brazilian independence", "Separation from Portugal in 1822 under Pedro I; unlike most Spanish American revolutions, it preserved monarchy and much elite continuity."],
    [1, "Creole nationalism", "Political identity among American-born elites who resented peninsular privilege and increasingly claimed authority to govern locally."],
    [1, "Loyalists in British North America", "Colonists who opposed the American Revolution; many migrated north and influenced the political development of Canada."],
    [2, "Caudillismo", "Political dominance by charismatic military strongmen whose personal authority and patronage often substituted for stable institutions after independence."],
    [2, "Gran Colombia", "Bolívar’s short-lived republic joining present-day Colombia, Venezuela, Ecuador, and Panama from 1819 to 1831."],
    [2, "Monroe Doctrine", "1823 U.S. declaration opposing new European colonization in the Americas, later invoked to justify expanded U.S. regional influence."],
    [2, "Manifest Destiny", "Belief that U.S. continental expansion was justified or inevitable, encouraging annexation, war, settlement, and Indigenous displacement."],
    [2, "Mexican–American War", "1846–1848 war ending with Mexico ceding vast northern territories to the United States under the Treaty of Guadalupe Hidalgo."],
    [2, "Treaty of Guadalupe Hidalgo", "1848 treaty ending the Mexican–American War, fixing the Rio Grande border and transferring the Mexican Cession to the United States."],
    [2, "Canadian Confederation", "1867 union of Ontario, Quebec, Nova Scotia, and New Brunswick in a self-governing dominion, later expanded across the continent."],
    [2, "Responsible government in Canada", "Principle that executive leaders must retain the confidence of an elected assembly, achieved in British North American colonies before Confederation."],
    [2, "War of the Pacific", "1879–1884 conflict in which Chile defeated Peru and Bolivia and gained nitrate-rich territory, leaving Bolivia landlocked."],
    [2, "Paraguayan War", "1864–1870 conflict pitting Paraguay against Brazil, Argentina, and Uruguay, producing catastrophic Paraguayan demographic and economic losses."],
    [2, "Liberal reform in Latin America", "Nineteenth-century effort to reduce church and corporate privileges, expand private property, secularize institutions, and centralize nation-states."],
    [2, "La Reforma", "Mexican liberal program associated with Benito Juárez that curtailed church and military privileges and provoked civil war and French intervention."],
    [2, "Benito Juárez", "Zapotec Mexican liberal president who defended the Reform laws and republic against conservatives and the French-backed empire of Maximilian."],
    [2, "Abolition in Brazil", "Gradual emancipation culminated in the Golden Law of 1888, making Brazil the last country in the Americas to abolish slavery."],
    [3, "Export-led growth", "Development strategy based on selling primary commodities abroad and importing manufactured goods, creating growth alongside dependency and vulnerability."],
    [3, "Porfiriato", "Rule of Porfirio Díaz in Mexico from 1876 to 1911, marked by order, foreign investment, railroads, land concentration, and political repression."],
    [3, "Mexican Revolution", "Revolution beginning in 1910 against Díaz that produced competing popular armies, civil war, land reform demands, and the Constitution of 1917."],
    [3, "Emiliano Zapata", "Mexican revolutionary leader whose Plan de Ayala demanded village land restoration and whose slogan became associated with agrarian justice."],
    [3, "Francisco ‘Pancho’ Villa", "Northern Mexican revolutionary commander who mobilized ranchers, workers, and small farmers through the Division of the North."],
    [3, "Constitution of Mexico (1917)", "Charter establishing federal authority and pioneering provisions for land redistribution, labor rights, secular education, and national control of resources."],
    [3, "Mass immigration to Argentina", "Large European migration helped urbanize Argentina, expand its labor force, and reshape politics and culture during export-led growth."],
    [3, "Canadian residential schools", "Church-state institutions that forcibly separated Indigenous children from families to impose assimilation, causing lasting cultural and personal harm."],
    [3, "Indian Act (Canada)", "1876 federal law regulating First Nations status, governance, land, and daily life as an instrument of colonial control and assimilation."],
    [3, "Good Neighbor Policy", "Franklin Roosevelt’s policy reducing direct U.S. military intervention in Latin America while preserving economic and diplomatic influence."],
    [4, "Spanish–American War", "1898 war that ended Spanish rule in Cuba and transferred Puerto Rico, Guam, and the Philippines to U.S. control."],
    [4, "Platt Amendment", "Provisions imposed on Cuba that authorized U.S. intervention and secured a naval base, limiting Cuban sovereignty after independence."],
    [4, "Panama Canal", "U.S.-built canal opened in 1914 after Panama’s separation from Colombia, transforming global shipping and U.S. strategic power."],
    [4, "Roosevelt Corollary", "1904 claim that the United States could intervene in Latin American states to forestall European action and maintain regional order."],
    [4, "Dollar Diplomacy", "Use of U.S. investment and financial control to extend influence abroad, especially in the Caribbean and Central America."],
    [4, "Banana republic", "Critical term for an export-dependent state where foreign companies and local elites exercise disproportionate economic and political power."],
    [4, "Great Depression in Latin America", "Collapse of commodity demand and credit weakened export economies and encouraged import-substitution industrialization and stronger state intervention."],
    [4, "Import-substitution industrialization", "Strategy of replacing manufactured imports with domestic production through tariffs, public investment, and state-supported industry."],
    [4, "Getúlio Vargas", "Brazilian leader who centralized authority, promoted industrialization and labor regulation, and ruled dictatorially during the Estado Novo."],
    [4, "Juan Perón", "Argentine leader whose populist movement joined nationalism, industrialization, social welfare, labor mobilization, and personalist authority."],
    [4, "Canada and the Statute of Westminster", "The 1931 statute recognized Canada and other dominions as legislatively autonomous, advancing constitutional independence from Britain."],
    [4, "Latin America in World War II", "Most states supported the Allies diplomatically or economically; Brazil sent troops, while wartime demand accelerated industry and U.S. influence."],
    [5, "Cuban Revolution", "1959 overthrow of Fulgencio Batista by Fidel Castro’s movement, followed by socialist transformation and alignment with the Soviet Union."],
    [5, "Fidel Castro", "Cuban revolutionary leader who nationalized property, expanded social programs, suppressed opposition, and allied Cuba with the Soviet bloc."],
    [5, "Bay of Pigs invasion", "Failed 1961 U.S.-backed invasion by Cuban exiles that strengthened Castro and encouraged closer Cuban-Soviet ties."],
    [5, "Cuban Missile Crisis", "1962 confrontation over Soviet nuclear missiles in Cuba that brought the superpowers close to war before a negotiated withdrawal."],
    [5, "Alliance for Progress", "Kennedy-era development program intended to encourage reform, growth, and anticommunism in Latin America."],
    [5, "Guatemalan coup (1954)", "CIA-supported overthrow of Jacobo Árbenz after land reform challenged United Fruit interests, helping begin decades of conflict and repression."],
    [5, "Salvador Allende", "Democratically elected Chilean socialist president overthrown in the 1973 military coup led by Augusto Pinochet."],
    [5, "Augusto Pinochet", "Chilean dictator whose regime used systematic repression and implemented market-oriented reforms after the 1973 coup."],
    [5, "Operation Condor", "Cooperation among South American dictatorships in the 1970s and 1980s to track, abduct, torture, and kill political opponents across borders."],
    [5, "Nicaraguan Revolution", "1979 Sandinista overthrow of the Somoza dictatorship, followed by social reforms, Contra war, and intense Cold War intervention."],
    [5, "Contras", "U.S.-supported armed groups fighting Nicaragua’s Sandinista government during the 1980s."],
    [5, "Dirty War in Argentina", "1976–1983 military campaign of disappearance, torture, and killing against alleged subversives and political opponents."],
    [5, "October Crisis", "1970 Canadian crisis triggered by FLQ kidnappings; Prime Minister Pierre Trudeau invoked the War Measures Act."],
    [5, "Quiet Revolution", "Rapid 1960s secularization and state modernization in Quebec that strengthened Francophone nationalism and demands for autonomy."],
    [6, "Civil Rights Movement", "Mass campaign against racial segregation and disfranchisement using litigation, organizing, direct action, federal legislation, and grassroots leadership."],
    [6, "Black Power", "Movement emphasizing racial pride, self-determination, community control, and structural change beyond formal legal equality."],
    [6, "Red Power movement", "Indigenous activism demanding sovereignty, treaty rights, land restoration, cultural survival, and control of institutions."],
    [6, "American Indian Movement", "Organization founded in 1968 that confronted police abuse and promoted treaty rights, sovereignty, and Indigenous cultural renewal."],
    [6, "United Farm Workers", "Labor organization led by César Chávez and Dolores Huerta that used strikes and boycotts to improve farmworker pay and conditions."],
    [6, "César Chávez", "Mexican American labor organizer who led nonviolent campaigns, strikes, and consumer boycotts for farmworker rights."],
    [6, "Dolores Huerta", "Labor and civil-rights organizer who co-founded the United Farm Workers and negotiated major agricultural labor agreements."],
    [6, "Second-wave feminism in the Americas", "Movement addressing employment, education, reproductive rights, family law, sexuality, and unequal political power."],
    [6, "Truth and reconciliation commissions", "Official bodies documenting abuses, recognizing victims, and recommending reform during transitions from dictatorship or conflict."],
    [6, "Third Wave of democratization", "Late twentieth-century shift from military and authoritarian rule toward elected civilian governments across much of Latin America."],
    [6, "NAFTA", "1994 agreement lowering trade barriers among Canada, Mexico, and the United States while intensifying debates over jobs, agriculture, migration, and sovereignty."],
    [6, "Zapatista uprising", "1994 Indigenous-led rebellion in Chiapas opposing exclusion, land loss, and neoliberal reform while demanding autonomy and democratic change."],
    [6, "Quebec sovereignty movement", "Political movement seeking greater autonomy or independence for Quebec, tested in referendums in 1980 and 1995."],
    [6, "Constitution Act, 1982", "Canadian constitutional patriation that included the Charter of Rights and Freedoms but lacked formal Quebec government consent."],
  ];
  regional.forEach(([theme, front, back]) => add(theme, front, back));

  const prompts = [
    [0, "Compare how the Mexica and Inca states governed diverse populations."],
    [0, "Explain how disease, alliance, technology, and internal division interacted in Spanish conquest."],
    [0, "Explain how colonial labor systems changed while coercion persisted."],
    [0, "Compare Indigenous resistance to colonial rule in two parts of the Americas."],
    [0, "Explain how silver linked the colonial Americas to a global economy."],
    [1, "Explain why the Haitian Revolution succeeded and why its consequences frightened slaveholding societies."],
    [1, "Compare the causes and leadership of independence in British, Spanish, Portuguese, and French America."],
    [1, "Explain how enslaved people resisted slavery beyond open rebellion."],
    [1, "Assess whether independence transformed social hierarchy in the Americas."],
    [1, "Compare Bolívar and San Martín as military and political leaders."],
    [2, "Explain why many new American republics struggled to build stable states."],
    [2, "Compare U.S. westward expansion with state expansion elsewhere in the Americas."],
    [2, "Explain the causes and consequences of the Mexican–American War from both national perspectives."],
    [2, "Compare abolition and its aftermath in the United States, Brazil, and the Caribbean."],
    [2, "Explain how federalism addressed regional difference in the United States, Canada, or Latin America."],
    [3, "Explain how export-led growth created both modernization and dependency."],
    [3, "Compare the Mexican Revolution’s major factions and their goals."],
    [3, "Explain how immigration changed cities, labor, and national identity in two American countries."],
    [3, "Assess how Indigenous assimilation policies used education and law."],
    [3, "Compare reform movements in the United States and Latin America before 1930."],
    [4, "Explain how U.S. policy moved from intervention toward the Good Neighbor Policy."],
    [4, "Compare responses to the Great Depression in the United States, Canada, and Latin America."],
    [4, "Explain why import-substitution industrialization expanded after 1929."],
    [4, "Compare Vargas and Perón as populist leaders."],
    [4, "Assess how participation in the world wars changed two societies in the Americas."],
    [5, "Explain why the Cuban Revolution radicalized after 1959."],
    [5, "Reconstruct the decisions that produced and resolved the Cuban Missile Crisis."],
    [5, "Compare Cold War intervention in Guatemala, Chile, Nicaragua, and Cuba."],
    [5, "Explain how military regimes justified repression and how victims challenged them."],
    [5, "Assess whether U.S. Cold War policy in the Americas prioritized democracy or anticommunism."],
    [6, "Compare civil-rights movements led by Black, Indigenous, Latino, and feminist activists."],
    [6, "Explain how grassroots organizing translated into legal and political change."],
    [6, "Compare transitions from dictatorship in two Latin American countries."],
    [6, "Explain the causes and consequences of the Quebec sovereignty movement."],
    [6, "Assess the benefits and costs of continental free trade for different groups."],
    [6, "Explain how truth commissions can reveal history without fully delivering justice."],
  ];
  prompts.forEach(([theme, prompt]) => decks[theme].feynmanPrompts.push({
    id: `ibhistamer-t${theme + 1}-f${decks[theme].feynmanPrompts.length + 1}`, prompt,
  }));
  window.IB_HISTORY_AMERICAS_DECKS = decks;
})();
