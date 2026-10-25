#!/usr/bin/env python3
"""Extract The American Pageant glossary and group cards into APUSH CED periods."""

import json
import pathlib
import re
import sys

import pdfplumber


SOURCE_TITLE = "Glossary of Key Terms — The American Pageant"
SOURCE_URL = "https://loscosapush.weebly.com/uploads/5/2/4/8/52484185/glossary_of_key_terms_-_american_pageant.pdf"
LATER_SOURCE_TITLE = "AP US History Flashcards by Time Period — APUSHReview"
LATER_SOURCE_URL = "https://www.apushreview.com/additional-resources/ap-us-history-flashcards-by-time-period/"

PERIODS = [
    (1, "Period 1: 1491–1607", 1, 27, ["Native societies before European contact", "European exploration and the Columbian Exchange", "Spanish colonization and cultural encounters"]),
    (2, "Period 2: 1607–1754", 28, 116, ["Regional patterns of British colonization", "Atlantic trade and slavery", "Colonial society, religion, and self-government", "Relations among European settlers and Native nations", "The Chesapeake and New England colonies", "Mercantilism and the Navigation Acts", "The development of racial slavery"]),
    (3, "Period 3: 1754–1800", 117, 224, ["The imperial crisis and the American Revolution", "Creating the Constitution and a new republic", "Political parties and debates over federal power", "The early republic in an Atlantic world", "Causes of the American Revolution", "The Articles of Confederation and the Constitution", "Federalists and Democratic-Republicans", "The Revolution’s effects on women and enslaved people", "Washington’s presidency"]),
    (4, "Period 4: 1800–1848", 225, 398, ["Democratization and the market revolution", "Expansion, migration, and Native displacement", "Religious revival and reform movements", "National identity and growing sectionalism", "The Market Revolution", "Jacksonian democracy", "The Second Great Awakening", "Antebellum reform movements", "The growth of sectional identities", "Federal power under the Marshall Court"]),
    (5, "Period 5: 1844–1877", 399, 900, ["Manifest Destiny and the Mexican-American War", "Slavery and the sectional crisis", "The Civil War", "Emancipation and Reconstruction", "Citizenship and constitutional change", "Causes of the Civil War", "Civil War turning points", "The successes and failures of Reconstruction", "Reconstruction Amendments"]),
    (6, "Period 6: 1865–1898", 901, 900, ["The Gilded Age", "Industrial capitalism and corporate consolidation", "Labor conflict in the Gilded Age", "Western settlement and Native dispossession", "Populism and farmer protest"]),
    (7, "Period 7: 1890–1945", 901, 900, ["The Progressive Era", "American imperialism", "The Great Depression and the New Deal", "World War II", "American society during the 1920s"]),
    (8, "Period 8: 1945–1980", 901, 900, ["The Cold War", "The Civil Rights Movement", "The Vietnam War and the antiwar movement", "Postwar prosperity and suburbanization"]),
    (9, "Period 9: 1980–Present", 901, 900, ["The conservative resurgence", "Globalization and deindustrialization", "The War on Terror", "Immigration and demographic change"]),
]

LATER_PERIOD_CARDS = {
    6: [
        ("Gilded Age", "The period from the 1870s through the 1890s when rapid industrial growth and displays of prosperity concealed political corruption, labor conflict, inequality, and poverty."),
        ("Social Darwinism", "The application of ideas about natural selection to human society, often used by industrialists and their defenders to portray wealth and poverty as the results of competition and individual fitness."),
        ("Labor unions in the Gilded Age", "Organizations such as the Knights of Labor and the American Federation of Labor that sought higher wages, shorter hours, safer workplaces, and greater bargaining power for workers."),
        ("New South", "The post–Civil War vision of a more industrial and economically diversified South, although agriculture, racial inequality, sharecropping, and tenant farming remained dominant."),
        ("Sharecropping", "A labor system in which farmers worked land owned by someone else and paid the owner with a share of the crop, frequently trapping Black and poor white families in cycles of debt."),
        ("Mechanized agriculture", "The growing use of machinery to increase farm output, which encouraged commercial agriculture but also displaced workers and contributed to farmers’ debt and political organizing."),
        ("People’s Party (Populist Party)", "A political movement formed largely by farmers and laborers that demanded railroad regulation, monetary reform, a graduated income tax, direct election of senators, and greater government responsiveness."),
        ("Political machines", "Urban party organizations that exchanged jobs and services for votes and loyalty; they helped many immigrants navigate city life but were frequently associated with patronage and corruption."),
        ("Settlement houses", "Community centers such as Jane Addams’s Hull House that offered education, childcare, health assistance, and other services to immigrants and working-class urban residents."),
        ("Destruction of the buffalo herds", "The near extermination of bison through commercial hunting, railroad expansion, and federal policy, which undermined the economies and independence of many Plains Indigenous nations."),
        ("Plessy v. Ferguson", "The 1896 Supreme Court decision that upheld racial segregation under the doctrine of “separate but equal,” giving constitutional protection to Jim Crow laws until Brown v. Board of Education."),
        ("Assimilation of Native Americans", "Federal efforts to dissolve tribal identities and landholding through policies such as the Dawes Act and boarding schools that imposed private property, English, Christianity, and Euro-American customs."),
        ("Social Gospel", "A Protestant reform movement that applied Christian ethics to problems created by industrialization, including poverty, poor housing, unsafe labor, and unequal urban conditions."),
    ],
    7: [
        ("Closing of the frontier", "The 1890 Census Bureau announcement that a continuous western frontier line no longer existed, prompting Frederick Jackson Turner to argue that the frontier had shaped American democracy and identity."),
        ("Progressive Era", "A reform period from roughly the 1890s through the 1920s in which activists used investigation, organization, and government action to address corruption, corporate power, unsafe conditions, and social inequality."),
        ("Urbanization in the early twentieth century", "The shift of population and economic activity toward cities as industrial employment, immigration, and internal migration expanded; by 1920 a majority of Americans lived in urban places."),
        ("Harlem Renaissance", "The flowering of African American literature, music, art, and intellectual life centered in 1920s Harlem, associated with figures including Langston Hughes, Zora Neale Hurston, and Duke Ellington."),
        ("United States entry into World War I", "The 1917 decision to enter the war against Germany after unrestricted submarine warfare, the Zimmermann Telegram, economic ties to the Allies, and claims about defending democracy."),
        ("Treaty of Versailles and League of Nations", "The post–World War I settlement and international organization championed by Woodrow Wilson; Senate opposition to collective-security commitments kept the United States out of the League."),
        ("Great Migration", "The movement of millions of African Americans from the rural South to northern, midwestern, and western cities for industrial employment and relief from Jim Crow oppression."),
        ("First Red Scare", "The post–World War I fear of communism, anarchism, and radical labor that contributed to the Palmer Raids, deportations, restrictions on dissent, and intensified nativism."),
        ("Immigration quotas of the 1920s", "Federal laws that sharply limited immigration and used national-origins quotas favoring northern and western Europe while restricting southern and eastern Europeans and excluding most Asian immigrants."),
        ("Great Depression", "The severe economic collapse beginning in 1929 that produced bank failures, unemployment, falling production, homelessness, and demands for a larger federal response to economic insecurity."),
        ("New Deal", "Franklin D. Roosevelt’s programs and reforms addressing the Great Depression through relief for the unemployed, economic recovery measures, and long-term regulation and social insurance."),
        ("United States in World War II", "The American mobilization after Pearl Harbor that combined military alliances, mass industrial production, scientific research, rationing, and expanded work opportunities to help defeat the Axis powers."),
        ("Japanese American incarceration", "The forced removal and imprisonment of about 120,000 people of Japanese ancestry during World War II under Executive Order 9066, upheld at the time in Korematsu v. United States."),
        ("Atomic bombings of Hiroshima and Nagasaki", "The August 1945 U.S. attacks that devastated two Japanese cities and accelerated Japan’s surrender while creating enduring debate over military necessity, civilian casualties, and nuclear warfare."),
    ],
    8: [
        ("Containment", "The Cold War policy, associated with diplomat George Kennan, of resisting further expansion of Soviet influence and communism through economic, diplomatic, and military measures."),
        ("Korean War", "The 1950–1953 conflict in which the United States and other United Nations forces defended South Korea against communist North Korea and Chinese intervention, ending near the original dividing line."),
        ("Military-industrial complex", "The close relationship among the armed forces, government policymakers, and defense contractors whose influence President Eisenhower warned could encourage permanent military expansion."),
        ("Baby boom", "The sharp rise in U.S. births from 1946 through 1964 that expanded demand for housing, schools, consumer goods, and later social programs."),
        ("Postwar suburbanization", "The movement of millions of Americans to suburbs encouraged by automobiles, highways, federal mortgage policies, mass-produced housing such as Levittown, and racial exclusion from many developments."),
        ("Civil rights activism", "Organized efforts using litigation, boycotts, sit-ins, Freedom Rides, marches, voter registration, and federal legislation to challenge segregation and racial discrimination."),
        ("Brown v. Board of Education", "The 1954 Supreme Court decision declaring state-mandated segregation in public schools inherently unequal and overturning the educational basis of Plessy v. Ferguson."),
        ("Sun Belt", "The growing region stretching from the Southeast through the Southwest to California that gained population, political influence, defense spending, and new industries after World War II."),
        ("Great Society", "Lyndon B. Johnson’s domestic agenda that expanded the federal role in civil rights, health care, education, immigration, environmental protection, and the reduction of poverty."),
        ("Immigration and Nationality Act of 1965", "The law that abolished the national-origins quota system and prioritized family reunification and skilled immigrants, increasing migration from Asia, Latin America, Africa, and the Caribbean."),
        ("Vietnam War", "The prolonged conflict in which the United States supported South Vietnam against communist North Vietnam and the Viet Cong, provoking extensive domestic protest before U.S. withdrawal and communist victory."),
        ("Counterculture", "A youth movement that rejected many conventional social norms, opposed the Vietnam War, experimented with communal living and drugs, and promoted sexual and cultural liberation."),
        ("Détente", "The easing of Cold War tensions during the 1970s through negotiation and arms-control agreements, including SALT I, alongside improved U.S. relations with the Soviet Union and China."),
        ("Modern environmental movement", "A broad campaign, energized by works such as Rachel Carson’s Silent Spring, that produced public pressure and federal measures including the EPA, Clean Air Act, and Clean Water Act."),
    ],
    9: [
        ("Reaganomics", "The Reagan administration’s economic program emphasizing tax cuts, deregulation, reduced domestic spending, and increased defense spending, based partly on supply-side economic theory."),
        ("Conservative opposition to big government", "The movement arguing that federal taxation, regulation, and social programs had grown too powerful, helping Ronald Reagan build a coalition around smaller government and traditional values."),
        ("Reagan administration", "The presidency from 1981 to 1989 that advanced conservative economic policy, increased military spending, appointed conservative judges, and pursued a more confrontational early approach to the Soviet Union."),
        ("Mikhail Gorbachev", "The final major leader of the Soviet Union, whose policies of glasnost and perestroika and negotiations with Ronald Reagan contributed to reduced Cold War tensions and the Soviet Union’s dissolution."),
        ("September 11 attacks", "The 2001 al-Qaeda terrorist attacks on the World Trade Center and Pentagon that killed nearly 3,000 people and transformed U.S. foreign, military, immigration, and domestic-security policy."),
        ("Wars in Afghanistan and Iraq", "Post-9/11 U.S. wars launched against the Taliban and al-Qaeda in Afghanistan and against Saddam Hussein’s government in Iraq; both developed into prolonged conflicts with extensive regional consequences."),
        ("War on Terror", "The global U.S.-led campaign after September 11 using military action, intelligence, law enforcement, alliances, and expanded surveillance to combat terrorist organizations."),
        ("Free-trade agreements", "Treaties such as NAFTA that reduced trade barriers among participating countries, increasing cross-border commerce while producing debate over jobs, wages, industry, and economic inequality."),
        ("Climate change politics", "The growing political dispute over greenhouse-gas emissions, energy policy, environmental regulation, scientific evidence, and the proper national and international response to global warming."),
    ],
}

LATER_PERIOD_EXPANSION = {
    6: [
        ("Transcontinental Railroad", "The rail line completed in 1869 that connected eastern networks with the Pacific Coast, accelerating migration, trade, corporate growth, and Indigenous dispossession."),
        ("Homestead Act", "The 1862 law granting western land to settlers who lived on and improved it, encouraging migration while transferring Indigenous homelands to private ownership."),
        ("Pacific Railway Acts", "Federal laws that supported railroad construction with land grants and loans, enabling private corporations to build transcontinental lines."),
        ("Chinese Exclusion Act", "The 1882 federal law suspending immigration of Chinese laborers and barring Chinese immigrants from naturalization."),
        ("Dawes Act", "The 1887 law dividing tribal lands into individual allotments to promote assimilation, causing Indigenous nations to lose millions of acres."),
        ("Ghost Dance", "A Native religious movement promising cultural renewal and the restoration of Indigenous life that alarmed federal officials before the Wounded Knee massacre."),
        ("Wounded Knee Massacre", "The 1890 killing of hundreds of Lakota people by U.S. soldiers in South Dakota, marking the violent suppression of armed Indigenous resistance on the Plains."),
        ("Sand Creek Massacre", "The 1864 attack by Colorado militia on a peaceful Cheyenne and Arapaho encampment, killing many women and children."),
        ("Battle of Little Bighorn", "The 1876 victory of Lakota, Northern Cheyenne, and Arapaho forces over George Custer’s command, followed by intensified federal warfare."),
        ("Vertical integration", "A business strategy in which a company controls multiple stages of production and distribution, associated with Andrew Carnegie’s steel operations."),
        ("Horizontal integration", "A business strategy in which a company absorbs or eliminates competitors in the same industry, associated with John D. Rockefeller’s Standard Oil."),
        ("Trust", "A legal arrangement placing several companies under centralized control, used by large corporations to limit competition and dominate markets."),
        ("Monopoly", "Control of a market by one company or coordinated group, allowing it to influence prices, production, and competition."),
        ("Andrew Carnegie", "Steel industrialist who used vertical integration, promoted the Gospel of Wealth, and funded libraries and educational institutions."),
        ("John D. Rockefeller", "Founder of Standard Oil who used horizontal integration, rebates, and trusts to dominate petroleum refining."),
        ("J. P. Morgan", "Financier who consolidated corporations and reorganized industries, including the creation of U.S. Steel."),
        ("Gospel of Wealth", "Carnegie’s argument that the rich had a duty to use their fortunes for socially beneficial philanthropy."),
        ("Sherman Antitrust Act", "The 1890 law prohibiting combinations that restrained interstate trade, initially enforced weakly and sometimes used against labor unions."),
        ("Interstate Commerce Act", "The 1887 law regulating railroads and creating the Interstate Commerce Commission, the first federal regulatory agency."),
        ("Knights of Labor", "An inclusive national labor organization seeking broad economic reform and worker cooperation, weakened after association with the Haymarket affair."),
        ("American Federation of Labor", "A federation led by Samuel Gompers that organized skilled workers around wages, hours, and working conditions."),
        ("Haymarket affair", "The 1886 labor rally in Chicago where a bomb and police gunfire caused deaths, damaging the labor movement through association with radicalism."),
        ("Homestead Strike", "The violent 1892 steel strike at Carnegie’s Homestead plant that ended in defeat for the union."),
        ("Pullman Strike", "The 1894 railroad strike suppressed by federal troops after the government obtained an injunction and claimed interference with the mail."),
        ("Grange", "A farmers’ organization that promoted cooperation and regulation of railroad and grain-storage rates."),
        ("Interstate migration", "Movement within the United States toward cities, industrial centers, mining regions, and western farms in response to economic change."),
        ("New immigration", "Late nineteenth-century immigration increasingly originating in southern and eastern Europe and fueling nativist responses."),
        ("Tenements", "Crowded, poorly ventilated urban apartment buildings that housed many working-class and immigrant families."),
        ("Pendleton Civil Service Act", "The 1883 law establishing merit-based federal hiring for selected positions after criticism of the patronage system."),
        ("Mugwumps", "Republican reformers who opposed party corruption and supported Democrat Grover Cleveland in the 1884 election."),
        ("Jim Crow laws", "State and local measures enforcing racial segregation and Black political subordination after Reconstruction."),
        ("Disenfranchisement", "The restriction of voting through poll taxes, literacy tests, intimidation, and other devices aimed especially at Black citizens."),
    ],
    7: [
        ("Muckrakers", "Progressive journalists who exposed corruption, dangerous working conditions, corporate abuses, and urban poverty."),
        ("Pure Food and Drug Act", "The 1906 law prohibiting mislabeled or contaminated food and medicine and increasing federal consumer protection."),
        ("Meat Inspection Act", "The 1906 law establishing federal inspection and sanitation requirements in meatpacking."),
        ("Sixteenth Amendment", "The constitutional amendment authorizing a federal income tax."),
        ("Seventeenth Amendment", "The constitutional amendment establishing direct popular election of U.S. senators."),
        ("Nineteenth Amendment", "The constitutional amendment prohibiting denial of voting rights on the basis of sex."),
        ("Federal Reserve Act", "The 1913 law creating a central banking system to manage currency, credit, and financial stability."),
        ("Spanish-American War", "The 1898 conflict in Cuba and the Philippines that ended Spanish colonial rule and expanded U.S. overseas power."),
        ("Open Door Policy", "The U.S. policy advocating equal commercial access to China and preservation of Chinese territorial integrity."),
        ("Roosevelt Corollary", "The assertion that the United States could intervene in Latin American nations to preserve order and prevent European involvement."),
        ("Dollar Diplomacy", "The use of American investment and financial influence to advance U.S. strategic interests abroad."),
        ("Panama Canal", "The U.S.-built waterway opened in 1914 that linked the Atlantic and Pacific and strengthened American trade and naval power."),
        ("Fourteen Points", "Woodrow Wilson’s proposed principles for a postwar settlement emphasizing self-determination, open diplomacy, and a League of Nations."),
        ("Espionage and Sedition Acts", "World War I laws criminalizing interference with the war effort and certain criticism of the government, restricting civil liberties."),
        ("Schenck v. United States", "The 1919 Supreme Court decision upholding wartime speech restrictions and articulating the clear-and-present-danger standard."),
        ("Prohibition", "The national ban on producing and selling alcoholic beverages under the Eighteenth Amendment, later repealed by the Twenty-first Amendment."),
        ("Scopes trial", "The 1925 Tennessee trial over teaching evolution that symbolized conflict between modernism and religious fundamentalism."),
        ("Second Ku Klux Klan", "A revived nationwide organization promoting white Protestant supremacy and hostility toward Black Americans, Catholics, Jews, and immigrants."),
        ("Sacco and Vanzetti", "Italian immigrant anarchists whose controversial convictions and executions reflected nativism and fear of radicalism."),
        ("Fordism", "Mass production based on assembly lines, standardized goods, high output, and wages sufficient to support consumer purchasing."),
        ("Stock market crash of 1929", "The collapse in stock prices that damaged confidence and finance while helping expose deeper weaknesses leading into the Great Depression."),
        ("Dust Bowl", "Severe drought and soil erosion on the Great Plains that displaced farm families during the 1930s."),
        ("Social Security Act", "The 1935 law creating old-age pensions, unemployment insurance, and assistance programs through a federal-state system."),
        ("Wagner Act", "The 1935 law protecting collective bargaining and establishing the National Labor Relations Board."),
        ("Congress of Industrial Organizations", "A labor federation that organized mass-production workers across industries including steel and automobiles."),
        ("Court-packing plan", "Roosevelt’s unsuccessful proposal to add Supreme Court justices after the Court invalidated several New Deal programs."),
        ("Lend-Lease Act", "The 1941 law allowing the United States to supply military aid to nations considered vital to American defense."),
        ("Pearl Harbor", "The Japanese attack on December 7, 1941, that brought the United States into World War II."),
        ("Double V campaign", "The Black wartime campaign seeking victory over fascism abroad and racism at home."),
        ("Rosie the Riveter", "The cultural symbol of women entering industrial war work during World War II."),
        ("Bracero Program", "A wartime agreement bringing Mexican laborers to the United States for temporary agricultural and railroad employment."),
    ],
    8: [
        ("Truman Doctrine", "The 1947 commitment to support nations resisting communist pressure, first applied to Greece and Turkey."),
        ("Marshall Plan", "The U.S. program providing economic aid to rebuild Western Europe and limit communist influence after World War II."),
        ("North Atlantic Treaty Organization", "The collective-defense alliance formed in 1949 by the United States, Canada, and Western European nations."),
        ("Berlin Airlift", "The 1948–1949 operation supplying West Berlin by air during a Soviet blockade."),
        ("House Un-American Activities Committee", "A congressional committee that investigated alleged communist influence and contributed to blacklisting during the Second Red Scare."),
        ("McCarthyism", "The practice of making poorly supported accusations of communist disloyalty, associated with Senator Joseph McCarthy."),
        ("GI Bill", "The law providing veterans with education, housing, and business benefits that expanded the postwar middle class while being administered unequally."),
        ("Levittown", "A mass-produced suburban development that symbolized postwar homeownership and racially exclusionary housing practices."),
        ("Interstate Highway Act", "The 1956 law funding a national expressway system that promoted suburbanization, automobile travel, commerce, and urban displacement."),
        ("Montgomery bus boycott", "The 1955–1956 mass protest against segregated buses that elevated Martin Luther King Jr. and demonstrated sustained nonviolent activism."),
        ("Southern Christian Leadership Conference", "A civil rights organization led by Black ministers that coordinated nonviolent protest against segregation."),
        ("Student Nonviolent Coordinating Committee", "A youth-led civil rights organization central to sit-ins, Freedom Rides, voter registration, and grassroots organizing."),
        ("Freedom Rides", "Integrated interstate bus journeys in 1961 that challenged segregation and forced federal enforcement of desegregation rules."),
        ("March on Washington", "The 1963 demonstration for jobs and freedom where Martin Luther King Jr. delivered his “I Have a Dream” speech."),
        ("Civil Rights Act of 1964", "The law prohibiting discrimination in public accommodations and employment and strengthening federal enforcement against segregation."),
        ("Voting Rights Act of 1965", "The law banning discriminatory voting practices and authorizing federal oversight in jurisdictions with histories of exclusion."),
        ("Black Power", "A movement emphasizing racial pride, self-determination, community control, and sometimes armed self-defense."),
        ("Gulf of Tonkin Resolution", "The 1964 congressional measure granting President Johnson broad authority to escalate U.S. military involvement in Vietnam."),
        ("Tet Offensive", "The major 1968 communist assault that weakened American public confidence despite heavy military losses for North Vietnam and the Viet Cong."),
        ("Vietnamization", "Nixon’s policy of withdrawing U.S. troops while transferring more combat responsibility to South Vietnamese forces."),
        ("War Powers Resolution", "The 1973 law intended to limit unilateral presidential military action by requiring notification and congressional authorization."),
        ("Watergate", "The political scandal involving the Nixon administration’s cover-up of a break-in and abuses of power, leading to Nixon’s resignation."),
        ("New Frontier", "John F. Kennedy’s domestic program promoting economic growth, space exploration, social initiatives, and civil rights proposals."),
        ("Medicare and Medicaid", "Great Society programs providing health coverage respectively to older Americans and qualifying low-income people."),
        ("Stonewall uprising", "The 1969 resistance to a police raid at New York’s Stonewall Inn that became a catalyst for the modern LGBTQ rights movement."),
        ("National Organization for Women", "An organization founded in 1966 to pursue legal, political, and workplace equality for women."),
        ("Equal Rights Amendment", "A proposed constitutional amendment guaranteeing legal equality regardless of sex that fell short of ratification."),
        ("Silent Spring", "Rachel Carson’s 1962 book documenting pesticide harms and helping energize modern environmentalism."),
        ("Environmental Protection Agency", "The federal agency established in 1970 to enforce pollution standards and coordinate environmental regulation."),
        ("OPEC oil embargo", "The 1973 restriction on oil exports that produced fuel shortages, inflation, and heightened concern about U.S. energy dependence."),
        ("Stagflation", "The combination of high inflation, weak economic growth, and unemployment that challenged conventional economic policy during the 1970s."),
    ],
    9: [
        ("New Right", "A conservative coalition of religious activists, anticommunists, business interests, and voters opposed to taxes, regulation, and liberal social policy."),
        ("Moral Majority", "A conservative Christian political organization that mobilized evangelical voters around social issues and Republican candidates."),
        ("Supply-side economics", "The theory that reducing taxes and regulation encourages investment, production, and economic growth."),
        ("Strategic Defense Initiative", "Reagan’s proposed missile-defense system intended to protect the United States from nuclear attack."),
        ("Iran-Contra affair", "The scandal in which officials secretly sold arms to Iran and directed proceeds to Contra rebels despite congressional restrictions."),
        ("Glasnost", "Gorbachev’s policy of greater openness in Soviet government and public discussion."),
        ("Perestroika", "Gorbachev’s effort to restructure the Soviet political and economic system."),
        ("Fall of the Berlin Wall", "The 1989 opening and dismantling of the barrier dividing Berlin, symbolizing the collapse of communist rule in Eastern Europe."),
        ("Persian Gulf War", "The 1991 U.S.-led military campaign that expelled Iraqi forces from Kuwait."),
        ("North American Free Trade Agreement", "The 1994 agreement reducing trade barriers among the United States, Canada, and Mexico."),
        ("World Trade Organization", "The international body created in 1995 to administer trade agreements and resolve disputes among member nations."),
        ("Globalization", "The increasing international integration of markets, production, finance, communication, migration, and culture."),
        ("Deindustrialization", "The decline or relocation of manufacturing employment that transformed many American communities and labor markets."),
        ("Rust Belt", "The industrial region of the Northeast and Midwest affected by factory closures, job losses, and population decline."),
        ("Information Revolution", "The economic and social transformation driven by computers, digital communication, the internet, and knowledge-based industries."),
        ("Personal Responsibility and Work Opportunity Reconciliation Act", "The 1996 welfare law replacing a federal entitlement with time-limited state-administered assistance tied to work requirements."),
        ("Election of 2000", "The disputed presidential contest resolved after Bush v. Gore halted a Florida recount, giving George W. Bush the presidency."),
        ("USA PATRIOT Act", "The post-9/11 law expanding federal surveillance, investigation, and information-sharing powers in terrorism cases."),
        ("Department of Homeland Security", "The cabinet department created after September 11 to coordinate domestic security, border, emergency, and counterterrorism functions."),
        ("Bush Doctrine", "The foreign-policy approach asserting a right to preventive action against perceived threats and states supporting terrorism."),
        ("Great Recession", "The severe 2007–2009 economic downturn triggered by a housing and financial crisis, producing unemployment, foreclosures, and federal intervention."),
        ("Troubled Asset Relief Program", "The 2008 program authorizing federal funds to stabilize banks and financial markets during the crisis."),
        ("Affordable Care Act", "The 2010 law expanding health-insurance coverage through marketplaces, subsidies, Medicaid expansion, and insurance regulations."),
        ("Deferred Action for Childhood Arrivals", "The 2012 policy offering renewable protection from deportation and work authorization to some immigrants brought to the United States as children."),
        ("Tea Party movement", "A conservative movement opposing taxes, federal spending, the Affordable Care Act, and what it viewed as excessive government power."),
        ("Black Lives Matter", "A movement founded in 2013 that protests police violence and broader forms of systemic racism."),
        ("Same-sex marriage", "A major civil-rights issue culminating in the 2015 Obergefell v. Hodges decision recognizing a constitutional right to marriage for same-sex couples."),
        ("Obergefell v. Hodges", "The 2015 Supreme Court decision requiring states to license and recognize marriages between two people of the same sex."),
        ("Citizens United v. FEC", "The 2010 Supreme Court decision holding that independent political spending by corporations and unions is protected speech."),
        ("Demographic change", "The transformation of the U.S. population through immigration, aging, regional movement, and growing racial and ethnic diversity."),
        ("Immigration Reform and Control Act", "The 1986 law granting legal status to many undocumented immigrants while penalizing employers who knowingly hired unauthorized workers."),
        ("North American migration after 1980", "Continued immigration from Latin America, Asia, Africa, and the Caribbean that reshaped communities, politics, labor, and culture."),
        ("Election of Barack Obama", "The 2008 election of the first African American president amid economic crisis and wars in Iraq and Afghanistan."),
        ("Polarization", "The widening ideological distance between political parties and their voters, accompanied by declining bipartisan cooperation."),
        ("War on drugs", "Federal and state policies emphasizing criminal enforcement against illegal drugs, contributing to expanded incarceration and racial disparities."),
        ("Mass incarceration", "The dramatic growth of the U.S. prison population since the late twentieth century, driven by sentencing policy, drug enforcement, and unequal impacts."),
    ],
}


def lines_for_column(page, x_min, x_max, y_min):
    words = [
        word for word in page.extract_words(use_text_flow=False, keep_blank_chars=False)
        if x_min <= float(word["x0"]) < x_max and y_min <= float(word["top"]) <= 690
    ]
    lines = []
    for word in sorted(words, key=lambda item: (round(float(item["top"]), 1), float(item["x0"]))):
        top = float(word["top"])
        if not lines or abs(lines[-1][0] - top) > 2.0:
            lines.append([top, [word]])
        else:
            lines[-1][1].append(word)
    return [" ".join(word["text"] for word in sorted(items, key=lambda item: float(item["x0"]))) for _, items in lines]


def normalize_text(text):
    text = re.sub(r"\s+", " ", text).strip()
    replacements = {
        "in de pen dence": "independence", "in dep en dent": "independent",
        "or ga ni za tion": "organization", "org an iz a tional": "organizational",
        "slave ry": "slavery", "New En gland": "New England", "Eng lishmen": "Englishmen",
        "antidem o cratic": "antidemocratic", "acc ep tance": "acceptance",
        "mea sure": "measure", "eigh teenth": "eighteenth", "nine teenth": "nineteenth",
        "go vern ment": "government", "gov ern ment": "government", "com merce": "commerce",
        "ter ri to ries": "territories", "con sti tu tion": "constitution",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text


def extract_entries(pdf_path):
    raw_entries = []
    current = None
    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            y_min = 120 if page_number == 1 else 75
            for line in lines_for_column(page, 50, 320, y_min) + lines_for_column(page, 325, 645, y_min):
                line = normalize_text(line)
                match = re.match(r"^(.{2,120}?):\s*(.*)$", line)
                if match:
                    if current:
                        raw_entries.append(current)
                    current = [match.group(1).strip(), match.group(2).strip()]
                elif current:
                    if current[1].endswith("-"):
                        current[1] = current[1][:-1] + line
                    else:
                        current[1] += " " + line
    if current:
        raw_entries.append(current)

    entries = []
    for term, definition in raw_entries:
        term = normalize_text(term)
        definition = normalize_text(definition)
        ref_match = re.search(r"\((\d+)(?:,\s*\d+)*\)\.?$", definition)
        if not ref_match:
            continue
        reference = int(ref_match.group(1))
        definition = definition[:ref_match.start()].strip()
        if len(term) < 2 or len(definition) < 18:
            continue
        entries.append({"term": term, "definition": definition, "reference": reference})
    for entry in entries:
        if entry["term"].lower() == "voyageurs":
            entry["definition"] = "French fur traders and woodsmen in North America, also known as coureurs de bois, who established trading relationships and posts among Native communities."
    return entries


def period_for(entry):
    term = entry["term"]
    dated = re.search(r"\b(1[45-8]\d{2})\b", term)
    if dated:
        year = int(dated.group(1))
        if year < 1607:
            return 1
        if year < 1754:
            return 2
        if year < 1800:
            return 3
        if year < 1844:
            return 4
        return 5
    for number, _, low, high, _ in PERIODS:
        if low <= entry["reference"] <= high:
            return number
    return 5


TERM_REPAIRS = {
    "en glish civil war (1642–1651)": "English Civil War (1642–1651)",
    "mas sa chus etts bay colony (founded in 1630)": "Massachusetts Bay Colony (founded in 1630)",
    "salutary ne glect (1688–1763)": "salutary neglect (1688–1763)",
    "ecological im pe rialism": "ecological imperialism",
    "cal i fornia bear flag republic (1846)": "California Bear Flag Republic (1846)",
    "cal i fornia gold rush (beginning in 1849)": "California gold rush (beginning in 1849)",
    "of war hawks (1811–1812)": "war hawks (1811–1812)",
    "dred scott v. stanford (1857)": "Dred Scott v. Sandford (1857)",
    "shays’s rebellion (1786)": "Shays' Rebellion (1786–1787)",
}

# Remove glossary minutiae that test isolated names rather than the APUSH
# historical processes and evidence students are expected to understand.
APUSH_REMOVE_BY_PERIOD = {
    1: {"canadian shield", "middlemen"},
    2: {
        "acadians", "blue laws", "buffer", "conversion", "coureurs de bois",
        "first anglo-powhatan war", "second anglo-powhatan war", "king george’s war",
        "king william’s war", "leisler’s rebellion", "new york slave revolt",
        "old lights", "new lights", "patroonships", "poor richard’s almanack",
        "queen anne’s war", "tuscarora war", "voyageurs", "war of jenkins’s ear",
        "yamasee indians",
    },
    3: {
        "armed neutrality", "civil law", "common law", "disestablished",
        "fort stanwix, treaty of", "hessians", "long island, battle of",
        "model treaty", "old northwest", "privateers", "québec, battle of",
        "radical whigs", "regulars", "regulator movement", "tammany hall",
        "tariff", "trenton, battle of",
    },
    4: {
        "the american scholar", "ancient order of hibernians", "anglo-american convention",
        "anti-masonic party", "appeal to the colored citizens of the world", "aroostook war",
        "awful disclosures", "black belt", "breakers", "caroline", "clipper ships",
        "convention of 1800", "creole", "fletcher v. peck", "goliad",
        "judiciary act of 1801", "land act of 1820", "liberia", "liberty party",
        "loose construction", "lyceum", "macon’s bill no. 2", "mason-dixon line",
        "midnight judges", "minstrel shows", "molly maguires", "new harmony",
        "oneida community", "opium war", "orders in council", "patent office",
        "rendezvous", "responsorial", "russo-american treaty", "shakers",
        "tariff of 1816", "tariff of 1842", "west africa squadron",
    },
    5: {
        "alabama", "buena vista, battle of", "california bear flag republic",
        "clayton-bulwer treaty", "conscience whigs", "dominion of canada",
        "fort henry and fort donelson, battle of", "fredericksburg, battle of",
        "freeport question", "kanagawa, treaty of", "laird rams", "maine law of 1851",
        "the man without a country", "merrimack and monitor", "morrill tariff act",
        "new england emigrant aid company", "pacific railroad act", "peninsula campaign",
        "pony express", "second battle of bull run", "spot resolutions", "tariff of 1857",
        "trent affair", "u.s. sanitary commission", "union league", "union party",
        "walker tariff", "wanghia, treaty of", "west virginia", "wilderness campaign",
        "woman’s loyal league",
    },
}


def base_term(term):
    return re.sub(r"\s*\([^)]*\)\s*$", "", term).strip().casefold()


def curate_period_entries(entries, number):
    result = []
    seen = set()
    removals = APUSH_REMOVE_BY_PERIOD.get(number, set())
    for entry in entries:
        repaired = TERM_REPAIRS.get(entry["term"].casefold(), entry["term"])
        if repaired == "(1861–1865)" or base_term(repaired) in removals:
            continue
        key = base_term(repaired)
        if not key or key in seen:
            continue
        seen.add(key)
        result.append({**entry, "term": repaired})
    return result


def build_data(entries):
    decks = []
    for number, title, _, _, prompts in PERIODS:
        period_entries = [entry for entry in entries if period_for(entry) == number]
        if number in LATER_PERIOD_CARDS:
            period_entries.extend({"term": term, "definition": definition, "reference": f"Period {number}"} for term, definition in LATER_PERIOD_CARDS[number])
            period_entries.extend({"term": term, "definition": definition, "reference": f"CED Period {number}"} for term, definition in LATER_PERIOD_EXPANSION[number])
        period_entries = curate_period_entries(period_entries, number)
        prompts = prompts[:max(1, round(len(period_entries) / 10))]
        deck_id = f"apush-period-{number}"
        decks.append({
            "id": deck_id,
            "name": f"AP U.S. History · {title}",
            "shortName": title,
            "builtIn": True,
            "sourceTitle": LATER_SOURCE_TITLE if number >= 6 else SOURCE_TITLE,
            "sourceUrl": LATER_SOURCE_URL if number >= 6 else SOURCE_URL,
            "cards": [{
                "id": f"{deck_id}-c{index}",
                "front": entry["term"],
                "back": entry["definition"],
                "sourcePage": entry["reference"],
            } for index, entry in enumerate(period_entries, start=1)],
            "questions": [],
            "feynmanPrompts": [{
                "id": f"{deck_id}-f{index}",
                "prompt": prompt,
            } for index, prompt in enumerate(prompts, start=1)],
        })
    return decks


def main():
    root = pathlib.Path(__file__).resolve().parents[1]
    pdf_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "tmp/pdfs/apush-american-pageant-glossary.pdf"
    output_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / "dist/apush-textbook-data.js"
    data = build_data(extract_entries(pdf_path))
    output_path.write_text(
        "window.AP_US_HISTORY_DECKS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    counts = [len(deck["cards"]) for deck in data]
    print(f"Wrote {sum(counts)} cards across periods: {counts}")


if __name__ == "__main__":
    main()
