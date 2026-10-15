(function () {
  function extend(decks, deckId, prefix, cards, prompts = []) {
    const deck = decks.find((item) => item.id === deckId);
    if (!deck) return;
    const existing = new Set(deck.cards.map((card) => card.front.toLowerCase()));
    cards.forEach(([front, back], index) => {
      if (!existing.has(front.toLowerCase())) deck.cards.push({ id: `${prefix}-c${index + 1}`, front, back });
    });
    const existingPrompts = new Set(deck.feynmanPrompts.map((item) => item.prompt.toLowerCase()));
    prompts.forEach((prompt, index) => {
      if (!existingPrompts.has(prompt.toLowerCase())) deck.feynmanPrompts.push({ id: `${prefix}-f${index + 1}`, prompt });
    });
  }

  const aas = window.AP_AFRICAN_AMERICAN_STUDIES_DECKS || [];
  extend(aas, "apaas-unit-1", "apaas-x1", [
    ["Aksum", "An ancient northeast African kingdom whose Red Sea trade, coinage, monumental architecture, and adoption of Christianity connected Africa to Mediterranean and Indian Ocean worlds."],
    ["King Ezana", "A fourth-century ruler of Aksum associated with the kingdom's adoption of Christianity and expansion of regional power."],
    ["Nok culture", "An ancient West African culture known for terracotta sculpture and early ironworking in present-day Nigeria."],
    ["Sunjata", "Founder celebrated in Mande oral tradition for establishing the Mali Empire and creating a durable model of political authority and social order."],
    ["Sudanic empires", "Large West African states, including Ghana, Mali, and Songhai, that grew through agriculture, political organization, and control of trans-Saharan commerce."],
    ["Songhai Empire", "A major West African empire centered on the Niger River that controlled trade cities and expanded under rulers such as Sunni Ali and Askia Muhammad."],
    ["Mande peoples", "West African ethnolinguistic communities whose histories include the Mali Empire, long-distance commerce, and the Sunjata epic tradition."],
    ["Sankofa", "An Akan concept, often symbolized by looking backward, that emphasizes retrieving knowledge from the past to guide the present and future."],
  ], ["Ancient African states and the evidence used to study them"]);

  extend(aas, "apaas-unit-2", "apaas-x2", [
    ["Barracoon", "A coastal enclosure in which captive Africans were confined before embarkation on slave ships."],
    ["Departure zone", "An African coastal region from which captives were transported into the Atlantic slave trade; zones differed in language, culture, and historical conditions."],
    ["Olaudah Equiano", "An eighteenth-century abolitionist whose published narrative described enslavement, the Middle Passage, freedom, and commercial life in the Atlantic world."],
    ["Igbo Landing", "An 1803 site in Georgia remembered through oral tradition as a collective act of resistance by captive Igbo people who refused enslavement."],
    ["Seasoned African", "A captive person who survived the initial period of forced adaptation to the disease environment, labor system, and surveillance of an American slave society."],
    ["Negro Convention Movement", "A series of nineteenth-century Black-led conventions that debated abolition, citizenship, education, economic advancement, and collective political strategy."],
    ["American Colonization Society", "An organization founded in 1816 that promoted the migration of free Black Americans to Africa, producing strong debate and opposition within Black communities."],
    ["Emigrationism", "The belief that Black people should pursue freedom or self-determination by relocating outside the United States."],
    ["Pan-Africanism", "A political and cultural tradition emphasizing the shared interests, solidarity, and liberation of African peoples and the African diaspora."],
    ["Seminole resistance", "Resistance in Florida involving Seminole people and self-emancipated Africans who challenged U.S. expansion, removal, and the recovery of freedom seekers."],
    ["Denmark Vesey", "A free Black carpenter accused of organizing a major 1822 antislavery uprising in Charleston; authorities executed him and others after a secret trial."],
    ["Gabriel's Rebellion", "A planned 1800 Virginia uprising organized by the enslaved blacksmith Gabriel and others, suppressed before it began."],
  ], ["Black political thought, conventions, and debates over emigration"]);

  extend(aas, "apaas-unit-3", "apaas-x3", [
    ["Historically Black college and university", "A U.S. institution of higher education established before 1964 with the principal mission of educating Black Americans excluded from many other colleges."],
    ["Black Greek-letter organization", "A historically Black fraternity or sorority that builds networks of scholarship, service, leadership, and mutual support."],
    ["National Association of Colored Women", "A federation founded in 1896 that joined Black women's clubs in campaigns for education, suffrage, community welfare, and racial justice."],
    ["Lifting as we climb", "A motto associated with Black women's club activism expressing an obligation to advance the broader community while achieving personal progress."],
    ["Talented Tenth", "Du Bois's contested idea that a highly educated segment of Black Americans could help lead struggles for racial advancement."],
    ["Chicago Defender", "An influential Black newspaper that opposed racial violence and encouraged southern Black readers to migrate to northern cities."],
    ["Jacob Lawrence", "Artist whose narrative painting series represented Black history, including the movement, hardship, and possibilities of the Great Migration."],
    ["James Van Der Zee", "Photographer whose portraits documented the aspirations, style, institutions, and everyday life of Black Harlem."],
    ["Jazz", "A Black American musical tradition characterized by improvisation, rhythmic complexity, and interaction, with roots in blues, ragtime, spirituals, and African diasporic practices."],
    ["Carter G. Woodson", "Historian who founded the Association for the Study of Negro Life and History and Negro History Week to institutionalize the study of Black history."],
    ["Afro-Caribbean migration", "Movement of people from the Caribbean that reshaped Black communities, politics, religion, and culture in U.S. cities during the twentieth century."],
    ["Universal Negro Improvement Association", "Marcus Garvey's mass organization promoting Black pride, economic self-reliance, global solidarity, and African redemption."],
  ], ["Black education, clubs, newspapers, photography, and historical memory"]);

  extend(aas, "apaas-unit-4", "apaas-x4", [
    ["Négritude", "A Francophone Black literary and political movement that affirmed African and diasporic culture while opposing colonial racism and assimilation."],
    ["Anticolonialism", "Political thought and action seeking to end colonial rule and restore sovereignty, often linked to Pan-African and Black freedom struggles."],
    ["Decolonization", "The process through which colonies challenged imperial control and achieved political independence, while confronting continuing economic and cultural domination."],
    ["A. Philip Randolph", "Labor and civil-rights leader whose planned March on Washington pressured the federal government to prohibit discrimination in defense employment."],
    ["Executive Order 8802", "Franklin Roosevelt's 1941 order barring racial discrimination in the defense industry and creating the Fair Employment Practice Committee."],
    ["GI Bill racial disparity", "Unequal local administration of veterans' benefits that limited many Black veterans' access to housing, education, and wealth-building opportunities."],
    ["Second Great Migration", "The movement of millions of Black southerners to northern and western cities during and after World War II."],
    ["Gospel music", "A Black sacred musical tradition combining Christian testimony, powerful vocals, improvisation, and African American performance practices."],
    ["Black church", "A diverse set of religious institutions that have served spiritual, social, educational, economic, and political roles in Black communities."],
    ["Soul aesthetics", "Artistic practices that express Black identity and collective feeling through styles rooted in African American musical, visual, and vernacular traditions."],
    ["Black Studies", "An interdisciplinary academic field created through earlier scholarship and student activism to center Black histories, cultures, politics, and knowledge."],
    ["Henrietta Lacks", "A Black woman whose cancer cells were taken without informed consent in 1951 and became the widely used HeLa cell line, raising enduring questions about medical ethics."],
    ["Environmental racism", "Policies and practices that expose communities of color to disproportionate environmental hazards while limiting access to environmental benefits."],
    ["Great Society", "A set of 1960s federal programs addressing poverty, education, health care, and civil rights, with important but uneven effects on Black communities."],
  ], ["Anticolonialism, decolonization, and Black internationalism", "Black Studies, medicine, technology, and environmental justice"]);

  const cyber = window.AP_CYBERSECURITY_DECKS || [];
  extend(cyber, "apcyber-unit-2", "apcyber-x2", [
    ["Piggybacking", "Unauthorized entry into a secured space with an authorized person's knowledge or assistance."],
    ["Mantrap", "A controlled entry space with two interlocking doors that allows one person to be authenticated before the second door opens."],
    ["Security vestibule", "An access-control space designed to prevent direct passage into a protected area and support identity verification."],
    ["Security camera", "A visual monitoring control used to deter activity, observe spaces, and preserve evidence of physical events."],
    ["Motion sensor", "A detection device that signals movement within a monitored area."],
    ["Door contact sensor", "A device that records or alerts when a door changes between open and closed states."],
    ["Security lighting", "Illumination positioned to improve visibility, deter intrusion, and support monitoring without creating dangerous glare or shadows."],
    ["Bollard", "A strong post used to prevent or redirect vehicles from entering a protected area."],
    ["Perimeter control", "A barrier or monitoring measure placed at a site's boundary to deter, delay, channel, or detect entry."],
    ["Security guard", "A trained human control that observes, verifies access, responds to events, and exercises judgment that automated controls may lack."],
    ["Physical vulnerability assessment", "A systematic examination of a facility to identify weaknesses, plausible threats, existing controls, and resulting risk."],
    ["Control placement", "Selecting a location for a security control so it effectively deters, prevents, or detects the relevant threat while minimizing blind spots."],
  ], ["Designing layered physical security for a facility"]);

  extend(cyber, "apcyber-unit-4", "apcyber-x4", [
    ["Authentication log", "A record of login attempts and related events, including identities, times, sources, success or failure, and sometimes authentication method."],
    ["Endpoint detection and response", "Technology that continuously monitors endpoints, records activity, detects suspicious behavior, and supports investigation and response."],
    ["Anti-malware software", "Software that detects, blocks, quarantines, or removes malicious code using signatures, behavior, reputation, or other analysis."],
    ["Secure boot", "A startup process that verifies cryptographic signatures so a device loads only trusted firmware and boot software."],
    ["Firmware", "Low-level software stored on hardware that controls a device's basic operation and may require security updates."],
    ["Default credential", "A manufacturer-provided username or password that creates serious risk if not replaced before deployment."],
    ["Application allowlisting", "A control that permits only explicitly approved software or code to execute."],
    ["Automatic update", "A configuration that retrieves and applies trusted security updates with limited delay and user intervention."],
    ["Device inventory", "An accurate record of organizational hardware, ownership, configuration, software, and support status used to manage risk."],
    ["End-of-life device", "Hardware or software no longer supported with security updates, making continued use progressively riskier."],
  ], ["Device authentication, hardening, malware defense, and log evidence"]);

  extend(cyber, "apcyber-unit-5", "apcyber-x5", [
    ["Access control list", "A set of entries specifying which users, groups, or systems may perform particular actions on a resource."],
    ["Read permission", "Authorization to view or copy a file's contents without changing them."],
    ["Write permission", "Authorization to modify, replace, or delete data in a file or directory as allowed by the system."],
    ["Execute permission", "Authorization to run a file as a program or traverse a directory, depending on the resource type."],
    ["Directory traversal attack", "Manipulation of a file path to access files or directories outside the location an application intended to expose."],
    ["Ransomware data impact", "Loss of availability through encryption or deletion, often combined with confidentiality loss through data theft."],
  ]);

  const business = window.AP_BUSINESS_PERSONAL_FINANCE_DECKS || [];
  extend(business, "apbusiness-unit-1", "apbusiness-x1", [
    ["Business-to-business market", "A market in which a business sells goods or services primarily to other organizations."],
    ["Business-to-consumer market", "A market in which a business sells goods or services primarily to individuals for personal use."],
    ["Market share", "A business's sales as a percentage of total sales in its defined market."],
  ]);
  extend(business, "apbusiness-unit-2", "apbusiness-x2", [
    ["Price elasticity of demand", "A measure of how strongly quantity demanded responds to a change in price."],
    ["A/B test", "A controlled comparison in which audience groups receive different versions so their measured responses can inform a decision."],
    ["Unique selling proposition", "A clear, distinctive benefit presented as the main reason a target customer should choose an offering."],
  ]);
  extend(business, "apbusiness-unit-3b", "apbusiness-x3", [
    ["Contribution margin", "Selling price per unit minus variable cost per unit; the amount each sale contributes toward fixed costs and profit."],
    ["Current ratio", "Current assets divided by current liabilities, used to assess short-term liquidity."],
    ["Retained earnings", "Cumulative profit kept in a business rather than distributed to owners."],
    ["Depreciation", "Allocation of a long-lived asset's cost over its useful life for accounting purposes."],
  ]);
  extend(business, "apbusiness-unit-4", "apbusiness-x4", [
    ["Buyer power", "Customers' ability to pressure sellers for lower prices, higher quality, or better terms."],
    ["Supplier power", "Suppliers' ability to raise input prices, reduce quality, or impose less favorable terms."],
    ["Threat of new entrants", "The pressure created when new competitors can enter a market and challenge established firms."],
  ]);
  extend(business, "apbusiness-unit-5", "apbusiness-x5", [
    ["Rebalancing", "Restoring a portfolio to its intended asset allocation by buying or selling assets after market changes alter the mix."],
    ["Expense ratio", "The annual operating expenses of a fund expressed as a percentage of average assets."],
    ["Employer match", "An employer contribution to a worker's retirement account based on the worker's eligible contribution, subject to plan rules."],
  ], ["Investment fees, rebalancing, and employer retirement benefits"]);
})();
