(() => {
  const mcq = (prompt, answer, distractors, explanation, stimulus = "", difficulty = "Medium") => ({
    type: stimulus ? "stimulus_mcq" : "mcq",
    prompt,
    answer,
    options: [answer, ...distractors],
    explanation,
    stimulus,
    difficulty,
  });

  const banks = {};
  const add = (course, unit, ...questions) => {
    banks[course] ||= {};
    banks[course][unit] = questions.map((question, index) => ({
      id: `exam-${course}-${unit}-${index + 1}`,
      source: "Original exam-style practice",
      ...question,
    }));
  };

  // AP Statistics: interpretation, design, probability, inference, and regression.
  add("apstats", "apstats-unit-1",
    mcq("A distribution of household incomes is strongly right-skewed. Which pair best describes its center and spread?", "Median and IQR", ["Mean and standard deviation", "Mean and IQR", "Median and standard deviation"], "The median and IQR resist the influence of the unusually large incomes."),
    mcq("Researchers randomly assign 120 volunteers to a new tutoring program or the existing program. What conclusion is justified if the new group scores significantly higher?", "The tutoring program caused a higher mean score for volunteers like those studied", ["The program will raise scores for every student", "The program is associated with scores but causation cannot be inferred", "The result generalizes to all students because assignment was random"], "Random assignment supports causation; volunteer sampling limits generalization.", "The volunteers were not randomly sampled from a larger population.", "Hard"));
  add("apstats", "apstats-unit-2",
    mcq("A disease test has sensitivity 0.90. Among people who have the disease, what is the probability that two independently tested people both receive positive results?", "0.81", ["0.18", "0.90", "1.80"], "For independent results, multiply: 0.90 × 0.90 = 0.81."),
    mcq("For X ~ Binomial(20, 0.30), which expression gives P(X = 4)?", "C(20,4)(0.30)^4(0.70)^16", ["C(20,4)(0.30)^16(0.70)^4", "(0.30)^4(0.70)^16", "C(20,4)(0.30)^4"], "Choose the 4 successful trials, then multiply by the probability of 4 successes and 16 failures.", "Twenty independent customers each have a 0.30 probability of using a coupon.", "Hard"));
  add("apstats", "apstats-unit-3",
    mcq("A 95% confidence interval for a population proportion is (0.42, 0.50). Which interpretation is correct?", "The method captures the true population proportion in about 95% of repeated samples", ["There is a 95% probability that this fixed interval contains the parameter", "95% of observations lie between 0.42 and 0.50", "The sample proportion equals the parameter 95% of the time"], "Confidence describes the long-run success rate of the interval-producing method."),
    mcq("A test of H₀: p = 0.50 against Hₐ: p > 0.50 gives p = 0.032. At α = 0.05, what is the correct conclusion?", "Reject H₀; the data provide evidence that p is greater than 0.50", ["Accept H₀ because 0.032 is close to zero", "Reject H₀ and conclude p equals 0.532", "Fail to reject H₀ because p is less than α"], "Because 0.032 < 0.05, the result is statistically significant in the direction of the alternative.", "The sample was randomly selected and the large-counts condition is satisfied."));
  add("apstats", "apstats-unit-4",
    mcq("Which procedure is appropriate for comparing mean blood pressure before and after treatment for the same 30 patients?", "A matched-pairs t procedure on the within-patient differences", ["A two-sample z procedure", "A chi-square test of independence", "A two-sample t procedure treating the groups as independent"], "The observations are paired because both measurements come from each patient."),
    mcq("A one-sample t interval uses n = 16 observations. What degrees of freedom should be used?", "15", ["14", "16", "30"], "For a one-sample t procedure, df = n − 1 = 15."));
  add("apstats", "apstats-unit-5",
    mcq("For ŷ = 12 + 3.4x, what does the slope mean?", "Each one-unit increase in x predicts a 3.4-unit increase in y", ["When x is zero, y must equal 3.4", "The correlation is 3.4", "Each 3.4-unit increase in x predicts a one-unit increase in y"], "Regression slope is the predicted change in the response for a one-unit increase in the explanatory variable."),
    mcq("A point has observed y = 41 and predicted ŷ = 47. What is its residual?", "−6", ["6", "88", "−88"], "Residual = observed − predicted = 41 − 47 = −6."));

  // AP Precalculus: students must calculate and interpret, not identify definitions.
  add("apprecalculus", "apprecalc-unit-1",
    mcq("If f(x) = x³ − 4x and x − 2 is a factor, what is the quotient?", "x² + 2x", ["x² − 2x", "x² + 2x − 4", "x² − 4"], "Synthetic division of x³ + 0x² − 4x + 0 by x − 2 gives x² + 2x."),
    mcq("For r(x) = (x + 1)/(x − 3), which statement is correct?", "x = 3 is a vertical asymptote and y = 1 is a horizontal asymptote", ["x = −1 is vertical and y = 3 is horizontal", "x = 3 is a hole and y = 1 is vertical", "x = −3 is vertical and y = −1 is horizontal"], "The denominator vanishes at 3 without cancellation; equal degrees give the ratio of leading coefficients, 1."));
  add("apprecalculus", "apprecalc-unit-2",
    mcq("A population follows P(t) = 800(1.06)^t. Approximately when will it first exceed 1,200?", "7 years", ["5 years", "9 years", "12 years"], "Solve 800(1.06)^t > 1200: t > ln(1.5)/ln(1.06) ≈ 6.96."),
    mcq("Solve log₂(x − 1) + log₂(x + 1) = 3.", "x = 3", ["x = −3", "x = √7", "x = 4"], "Combine logs: log₂(x²−1)=3, so x²−1=8. The domain requires x>1, leaving x=3.", "Use the domain restrictions before accepting a solution.", "Hard"));
  add("apprecalculus", "apprecalc-unit-3",
    mcq("What are all solutions to 2sin x = 1 on 0 ≤ x < 2π?", "π/6 and 5π/6", ["π/3 and 2π/3", "π/6 and 11π/6", "5π/6 and 7π/6"], "sin x = 1/2 in quadrants I and II."),
    mcq("A Ferris wheel has radius 18 m and its center is 20 m above the ground. A rider begins at the lowest point and completes one revolution in 40 s. Which model gives height h after t seconds?", "h(t) = 20 − 18cos(πt/20)", ["h(t) = 20 + 18cos(πt/20)", "h(t) = 18 − 20cos(πt/40)", "h(t) = 20 − 18sin(πt/20)"], "The angular rate is 2π/40 = π/20, and starting at the minimum requires a negative cosine."));
  add("apprecalculus", "apprecalc-unit-4",
    mcq("For x = 2t + 1 and y = t² − 3, what point corresponds to t = 2?", "(5, 1)", ["(3, 1)", "(5, −1)", "(4, 1)"], "Substitute t=2 into both equations: x=5 and y=1."),
    mcq("Which vector is perpendicular to ⟨3, −4⟩?", "⟨4, 3⟩", ["⟨3, 4⟩", "⟨−3, 4⟩", "⟨6, −8⟩"], "Perpendicular vectors have dot product zero: 3(4)+(−4)(3)=0."));

  // AP Microeconomics.
  add("apmicro", "apmicro-unit-1",
    mcq("A country can produce either 60 computers or 120 bicycles. What is the opportunity cost of one computer if the PPF is linear?", "2 bicycles", ["0.5 bicycle", "60 bicycles", "180 bicycles"], "The tradeoff is 120/60 = 2 bicycles per computer."),
    mcq("Ana can bake 8 loaves or 4 pies per hour; Bo can bake 6 loaves or 6 pies. Who has comparative advantage in pies?", "Bo, because one pie costs 1 loaf instead of 2", ["Ana, because she can bake more loaves", "Ana, because one pie costs 0.5 loaf", "Neither; their opportunity costs are equal"], "Ana gives up 2 loaves per pie; Bo gives up 1."));
  add("apmicro", "apmicro-unit-2",
    mcq("If demand increases while supply decreases, which outcome is certain?", "Equilibrium price rises", ["Equilibrium quantity rises", "Equilibrium quantity falls", "Equilibrium price falls"], "Both shifts raise price; their effects on quantity oppose one another."),
    mcq("Price rises from $10 to $12 and quantity demanded falls from 100 to 80. Using the midpoint method, demand is approximately", "unit elastic", ["perfectly inelastic", "elastic with coefficient 2", "inelastic with coefficient 0.25"], "Both midpoint percentage changes are about 22.2%, so elasticity is about 1."));
  add("apmicro", "apmicro-unit-3",
    mcq("A competitive firm faces P = $18, AVC = $14, and ATC = $22 at the profit-maximizing output. What should it do in the short run?", "Produce and incur an economic loss", ["Shut down because price is below ATC", "Produce and earn profit", "Exit immediately without producing"], "Because P exceeds AVC, production covers all variable cost and part of fixed cost."),
    mcq("When marginal cost is below average total cost, increasing output causes average total cost to", "fall", ["rise", "remain constant", "become zero"], "A marginal value below an average pulls the average downward."));
  add("apmicro", "apmicro-unit-4",
    mcq("A single-price monopolist maximizes profit at the quantity where", "MR = MC, then charges the price on the demand curve", ["P = MC at the demand curve", "ATC is minimized", "demand intersects MC and price equals MR"], "The monopoly chooses output using MR=MC and uses demand to determine price."),
    mcq("Compared with perfect competition, an unregulated monopoly generally produces", "less output at a higher price", ["more output at a lower price", "the same output at a higher price", "less output at a lower price"], "Market power restricts output and raises price, creating deadweight loss."));
  add("apmicro", "apmicro-unit-5",
    mcq("A profit-maximizing firm hires the next worker when the worker's marginal revenue product is", "at least as large as the wage", ["less than marginal product", "equal to total revenue", "greater than the product price only"], "The worker is hired while the additional revenue generated covers the marginal resource cost."),
    mcq("If product demand increases, the demand for labor used to produce that product will most likely", "shift right", ["shift left", "become perfectly inelastic", "remain unchanged"], "Labor demand is derived from demand for the output workers produce."));
  add("apmicro", "apmicro-unit-6",
    mcq("A factory imposes pollution costs on nearby residents. Which policy most directly internalizes the externality?", "A per-unit tax equal to marginal external cost", ["A subsidy equal to marginal private cost", "A binding price ceiling", "Removal of property rights"], "A Pigouvian tax makes producers face the external cost and moves output toward the social optimum."),
    mcq("Why is a nonexcludable, nonrival good likely underprovided by a private market?", "Consumers can free ride without paying", ["Its marginal cost must rise continuously", "Only one firm can legally produce it", "Its benefits are entirely private"], "Because payment cannot be enforced, firms cannot capture all benefits through market sales."));

  // AP Macroeconomics.
  add("apmacro", "apmacro-unit-1",
    mcq("Real GDP increases when an economy", "produces more final goods and services at constant prices", ["experiences only a higher price level", "imports more without changing production", "transfers income between households"], "Real GDP isolates changes in production from changes in prices."),
    mcq("If MPC = 0.75, the simple spending multiplier is", "4", ["0.25", "0.75", "3"], "The multiplier is 1/(1−MPC)=1/0.25=4."));
  add("apmacro", "apmacro-unit-2",
    mcq("A discouraged worker stops looking for work. All else equal, the measured unemployment rate will", "fall, even though labor-market conditions did not improve", ["rise because unemployment increased", "remain unchanged", "become equal to the natural rate"], "The worker leaves both the unemployed category and the labor force."),
    mcq("Nominal GDP is $550 billion and the GDP deflator is 110. Real GDP is", "$500 billion", ["$605 billion", "$440 billion", "$660 billion"], "Real GDP = nominal GDP/(deflator/100) = 550/1.10 = 500."));
  add("apmacro", "apmacro-unit-3",
    mcq("An increase in government purchases initially shifts", "aggregate demand to the right", ["aggregate demand to the left", "short-run aggregate supply to the right", "long-run aggregate supply to the left"], "Government purchases are a component of aggregate demand."),
    mcq("The economy is in a recessionary gap. With MPC = 0.8 and no crowding out, a $20 billion increase in spending changes equilibrium output by", "$100 billion", ["$16 billion", "$25 billion", "$80 billion"], "The multiplier is 5, so output changes by 5×$20 billion."));
  add("apmacro", "apmacro-unit-4",
    mcq("When the central bank buys government securities, bank reserves and the money supply generally", "increase", ["both decrease", "move in opposite directions", "remain unchanged"], "The purchase credits bank reserves, supporting deposit and loan expansion."),
    mcq("If the required reserve ratio is 0.10, the simple deposit multiplier is", "10", ["0.10", "1", "90"], "The simple deposit multiplier is 1/0.10 = 10."));
  add("apmacro", "apmacro-unit-5",
    mcq("Expansionary fiscal policy financed by borrowing can raise real interest rates and reduce private investment. This is called", "crowding out", ["automatic stabilization", "monetary neutrality", "comparative advantage"], "Government borrowing increases demand for loanable funds, placing upward pressure on real interest rates."),
    mcq("In the long run, a sustained increase in the money supply that exceeds real-output growth primarily raises", "the price level", ["potential output", "the natural rate of unemployment", "labor productivity"], "Long-run monetary neutrality implies mainly nominal rather than real effects."));
  add("apmacro", "apmacro-unit-6",
    mcq("If U.S. real interest rates rise relative to foreign rates, the dollar will tend to", "appreciate as financial capital flows into U.S. assets", ["depreciate as U.S. exports rise", "appreciate because U.S. imports fall", "remain fixed regardless of capital flows"], "Higher returns increase demand for dollars needed to purchase U.S. assets."),
    mcq("An appreciation of a country's currency will most directly cause its exports to become", "more expensive to foreign buyers", ["cheaper to foreign buyers", "unaffected in foreign-currency terms", "illegal under floating exchange rates"], "Foreign buyers must give up more of their currency for each unit of the appreciated currency."));

  // AP Computer Science Principles.
  add("apcsp", "apcsp-unit-1",
    mcq("A team develops a program in small working pieces, tests each piece, and revises based on feedback. This best illustrates", "incremental and iterative development", ["lossy compression", "parallel computing", "public-key encryption"], "Incremental development adds pieces; iteration revisits and improves them."),
    mcq("Why is a procedure with a descriptive name an abstraction?", "It lets a programmer use behavior without managing every implementation detail", ["It guarantees the program has no errors", "It makes all data public", "It prevents the procedure from accepting parameters"], "Procedural abstraction hides lower-level steps behind a meaningful interface."));
  add("apcsp", "apcsp-unit-2",
    mcq("An unsigned 8-bit integer stores values 0 through 255. What happens if 1 is added to 255 in a fixed 8-bit system?", "An overflow error may occur", ["The value is stored exactly as 256", "A roundoff error changes it to 255.5", "Lossless compression is triggered"], "256 requires a ninth bit, exceeding the representation's capacity."),
    mcq("Which format is generally the better choice when an image must be recovered pixel-for-pixel?", "Lossless compression", ["Lossy compression", "Sampling at a lower rate", "Deleting metadata only"], "Lossless compression permits exact reconstruction."));
  add("apcsp", "apcsp-unit-3",
    mcq("What value is displayed?", "9", ["3", "6", "12"], "The loop adds 1+2+3 to the initial value 3, producing 9.", "x ← 3\nFOR EACH n IN [1, 2, 3]\n{ x ← x + n }\nDISPLAY(x)", "Hard"),
    mcq("Which list index is accessed after the code runs?", "4", ["2", "3", "5"], "The variable changes from 1 to 2 to 4 before the list access.", "i ← 1\ni ← i + 1\ni ← i * 2\nDISPLAY(values[i])"));
  add("apcsp", "apcsp-unit-4",
    mcq("Why can Internet packets from one message take different routes?", "Routers independently forward packets using available paths", ["Every packet must visit the same central server", "IP guarantees one fixed physical circuit", "DNS encrypts each packet with a different route"], "Packet switching lets routers adapt to network conditions and failures."),
    mcq("What is the primary role of DNS?", "Translate domain names into IP addresses", ["Encrypt web traffic", "Break messages into packets", "Assign copyright licenses to websites"], "DNS is a distributed naming system that maps human-readable names to addresses."));
  add("apcsp", "apcsp-unit-5",
    mcq("A facial-recognition system has much higher error rates for a demographic group underrepresented in its training data. This is strongest evidence of", "algorithmic bias related to the data set", ["a syntax error", "lossless compression", "a denial-of-service attack"], "A model can reproduce or amplify imbalances and measurement problems in its training data."),
    mcq("Which practice most directly reduces the damage from a leaked password database?", "Store salted password hashes instead of plaintext passwords", ["Use shorter passwords", "Publish the database through an API", "Disable all software updates"], "Salting and hashing make stolen records harder to convert back into usable passwords."));

  // AP Music Theory: written-theory items test spelling, function, and voice leading.
  add("apmusic", "apmusic-unit-1",
    mcq("Which collection correctly spells D major?", "D–E–F♯–G–A–B–C♯–D", ["D–E–F–G–A–B–C–D", "D–E–G♭–G–A–B–D♭–D", "D–E♭–F–G–A–B♭–C–D"], "D major has two sharps: F♯ and C♯."),
    mcq("In 6/8 meter, the notated eighth notes normally group into", "two beats, each divided into three", ["six beats, each divided into two", "three beats, each divided into two", "two beats, each divided into two"], "6/8 is compound duple: two dotted-quarter beats with triple subdivision."));
  add("apmusic", "apmusic-unit-2",
    mcq("Which ascending scale spells A harmonic minor?", "A–B–C–D–E–F–G♯–A", ["A–B–C♯–D–E–F♯–G♯–A", "A–B–C–D–E–F♯–G♯–A", "A–B♭–C–D–E♭–F–G–A"], "Harmonic minor raises scale degree 7 of the natural-minor collection."),
    mcq("A single melody performed in unison by several singers has which texture?", "Monophonic", ["Homophonic", "Polyphonic", "Heterometric"], "Doubling one melodic line does not create independent parts."));
  add("apmusic", "apmusic-unit-3",
    mcq("Which pitches form a root-position B diminished triad?", "B–D–F", ["B–D♯–F♯", "B–D–F♯", "B–D♯–F"], "A diminished triad contains a minor third and diminished fifth above the root."),
    mcq("A G7 chord with B in the bass is in", "first inversion", ["root position", "second inversion", "third inversion"], "B is the third of G–B–D–F, so the figured bass is 6/5."));
  add("apmusic", "apmusic-unit-4",
    mcq("Which progression in C major forms a perfect authentic cadence?", "G major to C major, both root position, ending with C in the soprano", ["F major to C major", "G major to A minor", "C major to G major"], "A PAC requires V–I in root position with scale degree 1 in the final soprano."),
    mcq("A phrase that ends on V most likely closes with a", "half cadence", ["plagal cadence", "deceptive cadence", "perfect authentic cadence"], "Any phrase-ending cadence on dominant is a half cadence."));
  add("apmusic", "apmusic-unit-5",
    mcq("In a common-practice progression, which chord most naturally serves predominant function before V?", "ii", ["iii", "viio/V", "I"], "ii and IV are the principal predominant harmonies."),
    mcq("Which four-part motion is an error?", "Soprano and bass move from a perfect fifth to another perfect fifth in similar motion", ["One voice holds while another moves", "Outer voices move in contrary motion", "A leading tone resolves up by step"], "Parallel perfect fifths weaken voice independence."));
  add("apmusic", "apmusic-unit-6",
    mcq("A nonchord tone approached by step and left by step in the same direction is a", "passing tone", ["neighbor tone", "suspension", "anticipation"], "A passing tone fills the interval between two chord tones with continuous stepwise motion."),
    mcq("A prepared dissonance held into the next chord and resolved downward by step is a", "suspension", ["retardation", "escape tone", "appoggiatura"], "Preparation, suspension, and downward resolution define the figure."));
  add("apmusic", "apmusic-unit-7",
    mcq("In C major, which chord is V/V?", "D major", ["D minor", "G major", "A major"], "The dominant of G, the dominant scale degree, is D major."),
    mcq("Which event most clearly signals modulation rather than brief tonicization?", "A cadence confirms the new tonic and the music continues in that key", ["One chromatic chord resolves immediately to a diatonic chord", "A single accidental appears in a melody", "V/V resolves to V and the original key continues"], "Modulation establishes and prolongs a new tonal center."));
  add("apmusic", "apmusic-unit-8",
    mcq("Which scale is major-like but has lowered scale degree 7?", "Mixolydian", ["Lydian", "Dorian", "Phrygian"], "Mixolydian differs from major by its lowered seventh."),
    mcq("A piece organized A–B–A is most directly classified as", "ternary form", ["binary form", "strophic form", "through-composed form"], "Ternary form presents, contrasts, and returns."));

  // AP Latin: original translation, syntax, and literary-analysis questions.
  add("aplatin", "aplatin-unit-1",
    mcq("In 'Caesar dixit milites venire,' what is the grammatical construction of 'milites venire'?", "Indirect statement with accusative subject and infinitive", ["Purpose clause", "Ablative absolute", "Indirect command"], "After a verb of saying, the reported statement uses accusative plus infinitive."),
    mcq("Translate 'urbe capta, cives fugerunt.'", "When the city had been captured, the citizens fled", ["The citizens captured the city and fled", "The city fled after the citizens", "The citizens fled in order to capture the city"], "Urbe capta is an ablative absolute; the perfect passive participle indicates prior action."));
  add("aplatin", "aplatin-unit-2",
    mcq("Why does Pliny compare the eruption cloud to a pine tree?", "To give a precise visual model of its rising trunk and spreading branches", ["To claim the eruption occurred in a forest", "To make the disaster comic", "To prove the cloud was harmless"], "The simile converts an unfamiliar natural event into a recognizable shape."),
    mcq("Pliny the Elder's decision to approach Vesuvius is characterized primarily by", "scientific curiosity joined with public duty", ["military ambition alone", "fear of Tacitus", "a desire to abandon the fleet"], "The narrative turns observation into a rescue mission."));
  add("aplatin", "aplatin-unit-3",
    mcq("In a letter requesting imperial guidance, Pliny's detailed account of procedure most strongly constructs a persona of", "a conscientious administrator seeking lawful consistency", ["a rebellious provincial governor", "an epic hero pursuing glory", "an indifferent private citizen"], "The careful reporting and request for a rule emphasize administrative responsibility."),
    mcq("When an author delays the main verb through several subordinate clauses, the most likely effect is to", "build suspense before revealing the central action", ["eliminate all ambiguity in meter", "convert prose into direct speech", "prove that every clause is independent"], "Periodic syntax withholds completion and controls narrative pacing."));
  add("aplatin", "aplatin-unit-4",
    mcq("In epic poetry, an invocation of the Muse primarily", "announces the subject and claims inspired authority", ["marks a comic interruption", "ends the narrative conflict", "signals that the narrator is a character in every scene"], "The convention frames the epic's theme and the poet's relationship to tradition."),
    mcq("What is the metrical pattern of a dactyl?", "long–short–short", ["long–long", "short–long–short", "short–short–long"], "A dactyl contains one long syllable followed by two shorts."));
  add("aplatin", "aplatin-unit-5",
    mcq("Dido's curse near the end of Aeneid 4 most directly helps explain", "future hostility between Rome and Carthage", ["the founding of Athens", "the fall of Troy before Aeneas departs", "the reconciliation of Turnus and Aeneas"], "The personal tragedy is connected etiologically to later Roman-Carthaginian conflict."),
    mcq("Aeneas' visit to the underworld chiefly strengthens the epic's concern with", "the cost of duty and Rome's promised future", ["agricultural comedy", "rejection of all divine prophecy", "the superiority of private desire over public obligation"], "The encounter with Anchises links personal sacrifice to historical mission."));
  add("aplatin", "aplatin-unit-6",
    mcq("When translating an unseen poetic passage, what should a reader identify first?", "Finite verbs, clause boundaries, and the case relationships of nouns", ["A rhyming scheme", "Every English synonym for each word", "The author's biography only"], "Syntax provides the sentence's structure before stylistic nuance is added."),
    mcq("Which observation best supports a claim about emphatic Latin word order?", "A normally connected adjective and noun are separated around a key verb", ["Every word appears alphabetically", "The line has exactly the same order as idiomatic English", "All nouns are nominative"], "Hyperbaton and framing can foreground words and visually enact relationships."));

  // AP history and government: source reasoning, causation, comparison, and institutions.
  const historyUnits = {
    apush: [
      ["apush-period-1", "A European account describes densely populated towns, maize cultivation, and regional trade before sustained colonization. Which claim does the account best support?", "Indigenous societies developed diverse, complex economies before European contact", ["North America lacked permanent settlements", "All Indigenous societies used identical political systems", "European crops created the first trade networks"], "The described agriculture, settlement, and exchange predate sustained European colonization."],
      ["apush-period-2", "Which development most directly increased colonial resistance to British rule before 1754?", "The growth of elected assemblies and traditions of local self-government", ["The abolition of Atlantic trade", "The end of religious diversity", "The creation of a strong colonial monarchy"], "Long experience with local institutions shaped expectations about representation and taxation."],
      ["apush-period-3", "Which weakness exposed by Shays' Rebellion most directly encouraged support for the Constitution?", "The Confederation government's limited ability to raise revenue and respond to unrest", ["Congress's power to veto state laws", "The president's excessive military authority", "The Supreme Court's use of judicial review"], "The crisis highlighted the Articles' weak national taxing and enforcement powers."],
      ["apush-period-4", "The market revolution most directly contributed to which social change?", "Greater regional specialization and participation in wage labor", ["The disappearance of immigration", "An immediate end to slavery", "The collapse of commercial farming"], "Transportation and production changes tied regions to markets and expanded wage work."],
      ["apush-period-5", "Which wartime development most directly transformed the Civil War into a conflict over emancipation?", "The Emancipation Proclamation and enlistment of Black soldiers", ["The Compromise of 1850", "The Dred Scott decision", "The Kansas-Nebraska Act"], "Emancipation became an explicit Union war aim and Black military service strengthened it."],
      ["apush-period-6", "Farmers who supported the Populist movement most commonly sought", "currency expansion, railroad regulation, and political reform", ["higher tariffs and tighter money", "an end to public participation in politics", "federal protection of railroad monopolies"], "These proposals addressed debt, deflation, transportation costs, and concentrated power."],
      ["apush-period-7", "Which factor most directly explains the Great Migration during the early twentieth century?", "Industrial jobs in northern cities combined with escape from Jim Crow violence", ["The end of urban manufacturing", "A federal ban on interstate movement", "The disappearance of immigration restrictions"], "Economic opportunity and racial oppression jointly drove the migration."],
      ["apush-period-8", "The strategy of the Montgomery bus boycott most clearly demonstrates", "mass nonviolent protest using economic pressure against segregation", ["armed resistance directed by the federal government", "judicial restraint preventing constitutional claims", "the decline of grassroots organizing"], "Sustained collective action imposed economic costs and supported a legal challenge."],
      ["apush-period-9", "A major continuity in U.S. politics since 1980 has been debate over", "the proper scope of federal power in economic and social policy", ["whether the Constitution should create a presidency", "whether states may print independent currency", "whether industrialization should begin"], "Disputes over regulation, taxation, welfare, and rights continue older federalism debates."],
    ],
    apworld: [
      ["apworld-unit-1", "The use of Confucian examinations by Song rulers most directly supported", "a centralized bureaucracy staffed through mastery of classical learning", ["the abolition of imperial government", "rule by independent merchant republics", "the replacement of agriculture by nomadism"], "Examinations recruited scholar-officials and reinforced imperial administration."],
      ["apworld-unit-2", "Caravanserai along Silk Roads most directly facilitated trade by", "providing merchants and animals secure lodging and supplies", ["eliminating all customs duties", "replacing maritime transport", "ending cultural exchange"], "Roadside inns reduced travel costs and risks across long routes."],
      ["apworld-unit-3", "Ottoman devshirme and Safavid use of military slaves both helped rulers", "build forces personally loyal to the central state", ["abolish gunpowder weapons", "transfer sovereignty to merchants", "eliminate religious legitimacy"], "Recruitment outside hereditary elites strengthened central authority."],
      ["apworld-unit-4", "Which consequence followed the Columbian Exchange most directly?", "Old World diseases caused catastrophic Indigenous population decline in the Americas", ["American crops immediately reduced Europe's population", "The Atlantic slave trade ended", "Asian states ceased maritime trade"], "Populations without prior exposure suffered especially severe epidemics."],
      ["apworld-unit-5", "The Haitian Revolution differed from the American Revolution because it", "destroyed slavery through a successful revolt by enslaved people", ["rejected Enlightenment language", "created a European monarchy", "occurred before Atlantic trade"], "Haiti combined anticolonial revolution with emancipation."],
      ["apworld-unit-6", "European imperial rule in the late nineteenth century was most often justified through", "racial ideologies and claims of a civilizing mission", ["opposition to industrial capitalism", "support for equal sovereignty", "a rejection of missionary activity"], "Social Darwinism and civilizing rhetoric rationalized conquest."],
      ["apworld-unit-7", "Why did total war increase civilian involvement in both world wars?", "States mobilized entire economies, labor forces, and propaganda systems", ["Armies stopped using industrial weapons", "Governments ended taxation", "Civilian factories became irrelevant"], "Industrial warfare depended on national production and social mobilization."],
      ["apworld-unit-8", "A major shared challenge for newly independent states after 1945 was", "building political unity within borders inherited from colonial rule", ["restoring European empires", "ending all ethnic diversity", "avoiding participation in global markets"], "Colonial boundaries and institutions often complicated nation-building."],
      ["apworld-unit-9", "Which development best explains the acceleration of economic globalization after 1980?", "Lower trade barriers combined with container shipping and digital communication", ["The disappearance of multinational firms", "An end to financial flows", "The universal adoption of autarky"], "Policy liberalization and transport/communication technology expanded global supply chains."],
    ],
    apeuro: [
      ["apeuro-unit-1", "Renaissance humanists differed from medieval scholastics most clearly in their emphasis on", "classical texts, rhetoric, and human agency", ["rejecting all Christian belief", "eliminating urban patronage", "ending the study of language"], "Humanists recovered classical models and emphasized eloquence and civic life."],
      ["apeuro-unit-2", "The printing press accelerated the Reformation chiefly because it", "enabled rapid, inexpensive circulation of vernacular religious arguments", ["prevented laypeople from reading", "gave monarchs complete control of ideas", "ended theological controversy"], "Print expanded audience size and speed of debate."],
      ["apeuro-unit-3", "England's post-1688 settlement differed from Louis XIV's France by", "placing stronger parliamentary limits on royal authority", ["abolishing taxation", "eliminating a hereditary monarchy", "rejecting overseas commerce"], "The Bill of Rights and parliamentary finance constrained the crown."],
      ["apeuro-unit-4", "Which Enlightenment claim most directly challenged absolutism?", "Legitimate government rests on consent and protects natural rights", ["Social hierarchy is fixed by divine law", "Scientific inquiry requires censorship", "Trade should be prohibited"], "Social-contract theory made political authority conditional rather than absolute."],
      ["apeuro-unit-5", "The radicalization of the French Revolution in 1792–1793 was most directly encouraged by", "war, economic crisis, and fear of counterrevolution", ["stable food prices and peace", "the restoration of feudal dues by the National Assembly", "the absence of urban political participation"], "External and internal threats intensified demands for emergency measures."],
      ["apeuro-unit-6", "Industrialization initially transformed class relations by", "expanding an urban wage-working class and industrial middle class", ["eliminating inequality", "returning production to isolated households", "ending migration to cities"], "Factory production reorganized work, ownership, and urban society."],
      ["apeuro-unit-7", "Nationalist movements in nineteenth-century Europe most often claimed that", "people sharing culture or history should possess political self-determination", ["dynastic empires should ignore popular identity", "industrial workers should reject politics", "states should restore universal feudalism"], "Nationalism connected collective identity to sovereignty."],
      ["apeuro-unit-8", "Fascist regimes gained support between the world wars partly by promising", "national renewal, order, and protection from communism", ["liberal pluralism and minority rights", "immediate decolonization", "the abolition of militarism"], "Crisis, fear, and resentment made authoritarian promises attractive."],
      ["apeuro-unit-9", "European integration after 1945 was intended chiefly to", "bind economies together and reduce the likelihood of renewed interstate war", ["restore colonial empires", "dissolve all national governments", "separate France from Germany economically"], "Cooperation began in strategic industries and broadened into common institutions."],
    ],
    apgov: [
      ["apgov-unit-1", "Congress creates a national bank to carry out its taxing and borrowing powers. Which constitutional principle most directly supports the law?", "Implied powers under the Necessary and Proper Clause", ["Reserved powers under the Tenth Amendment", "The Ex Post Facto Clause", "The Establishment Clause"], "McCulloch v. Maryland interpreted necessary and proper broadly in service of enumerated powers."],
      ["apgov-unit-2", "The Senate confirms a president's nominee to lead an executive department. This is an example of", "checks and balances", ["popular sovereignty through referendum", "judicial review", "selective incorporation"], "Senate confirmation allows the legislative branch to check appointments."],
      ["apgov-unit-3", "A state law restricts political speech. Which doctrine allows a claimant to invoke the First Amendment against the state?", "Selective incorporation through the Fourteenth Amendment", ["Executive privilege", "Senatorial courtesy", "Dual federalism under the Articles"], "The Due Process Clause has applied many Bill of Rights protections to states."],
      ["apgov-unit-4", "A voter consistently chooses candidates based on retrospective judgments about economic performance. This behavior best illustrates", "performance voting", ["prospective socialization", "judicial activism", "bureaucratic discretion"], "Retrospective voting evaluates incumbents based on past results."],
      ["apgov-unit-5", "Why do single-member plurality districts tend to disadvantage minor parties?", "Only the top candidate wins representation, encouraging strategic support for major parties", ["Minor parties cannot appear on any ballot", "All seats are allocated proportionally", "Voters are legally required to join a major party"], "Winner-take-all rules make votes for smaller parties less likely to translate into seats."],
    ],
  };
  Object.entries(historyUnits).forEach(([course, rows]) => rows.forEach(([unit, prompt, answer, distractors, explanation]) => {
    add(course, unit, mcq(prompt, answer, distractors, explanation, "Use the historical situation and your knowledge of the period to select the best answer.", "Hard"));
  }));
  const addHistoryQuestion = (course, unit, question) => banks[course][unit].push({
    id: `exam-${course}-${unit}-2`, source: "Original exam-style practice", ...question,
  });
  [
    ["apush-period-1", "The encomienda system most directly changed Indigenous societies by", "compelling labor and tribute under Spanish colonial authority", ["creating political equality with settlers", "ending missionary activity", "preventing epidemic disease"], "The institution redirected Indigenous labor and production toward colonial goals."],
    ["apush-period-2", "Which comparison between Chesapeake and New England colonies is most accurate in the seventeenth century?", "The Chesapeake relied more heavily on tobacco exports, while New England developed more mixed economies", ["New England relied more heavily on plantation slavery from its founding", "Both regions had identical religious institutions", "The Chesapeake had more compact towns and family migration"], "Different environments, migration patterns, and labor systems produced distinct regional economies."],
    ["apush-period-3", "The Northwest Ordinance established the precedent that", "territories could enter the Union as equal states while slavery was barred north of the Ohio River", ["western lands would remain permanent colonies", "Congress could not govern territories", "all Native land claims were protected from settlement"], "The ordinance provided a statehood process and a sectional restriction on slavery."],
    ["apush-period-4", "The Second Great Awakening contributed to antebellum reform by", "encouraging individuals to perfect society through moral action", ["defending inherited privilege", "discouraging voluntary associations", "ending women's participation in reform"], "Revivalism linked personal salvation to temperance, abolition, and other reforms."],
    ["apush-period-5", "Why did Reconstruction amendments fail to secure lasting political equality by 1900?", "Federal enforcement weakened while southern states imposed violence and discriminatory laws", ["The amendments explicitly permitted segregation", "Freedpeople rejected voting rights", "Congress immediately restored slavery"], "Constitutional change was undermined by retreat, court decisions, and organized white supremacy."],
    ["apush-period-6", "A historian arguing that industrialization increased corporate power would best cite", "vertical and horizontal integration by firms such as Carnegie and Standard Oil", ["the disappearance of railroads", "declining national markets", "the abolition of wage labor"], "Integration enabled large firms to control supply chains and competitors."],
    ["apush-period-7", "The New Deal most significantly altered the relationship between citizens and the federal government by", "expanding federal responsibility for economic security and regulation", ["ending national taxation", "abolishing private property", "returning monetary policy to the states"], "Relief, recovery, regulation, and social insurance broadened expectations of federal action."],
    ["apush-period-8", "Which factor most directly contributed to the rise of the modern conservative movement?", "Opposition to expanded federal programs and rapid social change", ["unanimous support for the Great Society", "the end of suburbanization", "the disappearance of evangelical politics"], "Fiscal, anticommunist, and social conservatives formed an increasingly influential coalition."],
    ["apush-period-9", "The growth of the Internet most directly transformed the U.S. economy by", "accelerating communication, services, and globalized information work", ["ending productivity growth", "eliminating regional inequality", "making manufacturing the only expanding sector"], "Digital networks changed production, commerce, and labor while creating new inequalities."],
  ].forEach(([unit, prompt, answer, distractors, explanation]) => addHistoryQuestion("apush", unit, mcq(prompt, answer, distractors, explanation, "Select the answer that best explains the historical development.", "Hard")));
  [
    ["apworld-unit-1", "Which feature was shared by the Abbasid Caliphate and Song China?", "Large urban commercial networks supported by sophisticated administration", ["Complete political equality for women", "Dependence on Atlantic plantation slavery", "Rejection of long-distance trade"], "Both states governed prosperous urban-commercial societies with extensive bureaucratic systems."],
    ["apworld-unit-2", "The spread of paper-making from China across Eurasia most directly demonstrates", "the movement of technologies along trade and conquest networks", ["the isolation of regional cultures", "the decline of literacy", "the end of state administration"], "Merchants, travelers, and expanding empires carried practical technologies between regions."],
    ["apworld-unit-3", "Why did gunpowder empires invest heavily in monumental architecture?", "To display dynastic legitimacy and imperial power", ["To replace military institutions", "To eliminate religious symbolism", "To decentralize taxation"], "Mosques, palaces, and capitals made authority visible to diverse populations."],
    ["apworld-unit-4", "The silver trade linking Spanish America, Europe, and China was driven especially by", "American mines and Chinese demand for silver tax payments", ["the disappearance of Asian markets", "a ban on European ocean travel", "African production of all global silver"], "Potosí and Mexican production met a monetized Chinese economy through global exchange."],
    ["apworld-unit-5", "Which condition most directly enabled early industrialization in Britain?", "Accessible coal, capital, expanding markets, and agricultural productivity", ["a complete absence of overseas trade", "scarcity of navigable waterways", "the abolition of private investment"], "The combination supported mechanization, energy use, labor movement, and demand."],
    ["apworld-unit-6", "Indentured labor expanded after emancipation primarily because", "plantations and mines still demanded inexpensive controlled labor", ["global commodity demand ended", "states abolished labor migration", "former slaveholders abandoned export production"], "Employers recruited contract workers, often under coercive conditions, to replace enslaved labor."],
    ["apworld-unit-7", "The Treaty of Versailles contributed to later instability by", "imposing grievances while failing to create an enforceable security order", ["integrating Germany immediately into equal partnership", "ending nationalism", "preventing all border changes"], "Punitive terms and weak collective-security mechanisms fostered resentment and revisionism."],
    ["apworld-unit-8", "Which strategy was common to anticolonial movements in India and parts of Africa?", "Mass political mobilization combined with negotiation and selective noncooperation", ["exclusive reliance on European armies", "rejection of national identity", "support for permanent colonial rule"], "Nationalists built organizations capable of pressuring empires domestically and internationally."],
    ["apworld-unit-9", "A major environmental consequence of post-1950 economic growth has been", "rapid increases in fossil-fuel use and greenhouse-gas emissions", ["universal declines in energy consumption", "the disappearance of industrial agriculture", "an end to deforestation"], "Production, transport, and consumption expanded carbon-intensive activity."],
  ].forEach(([unit, prompt, answer, distractors, explanation]) => addHistoryQuestion("apworld", unit, mcq(prompt, answer, distractors, explanation, "Select the best-supported historical interpretation.", "Hard")));
  [
    ["apeuro-unit-1", "Northern Renaissance writers such as Erasmus most often used classical learning to", "criticize corruption and promote Christian moral reform", ["defend illiteracy", "abolish printing", "reject education for laypeople"], "Christian humanists joined textual scholarship to calls for institutional and personal reform."],
    ["apeuro-unit-2", "The Peace of Augsburg attempted to reduce religious conflict by", "allowing each prince in the Holy Roman Empire to choose Lutheranism or Catholicism", ["granting full toleration to every faith", "creating a unified Calvinist state", "ending princely control of religion"], "The settlement recognized limited confessional choice at the territorial-ruler level."],
    ["apeuro-unit-3", "The Dutch Republic's power in the seventeenth century rested especially on", "commercial finance, maritime trade, and decentralized urban wealth", ["serf-based agriculture alone", "absolute monarchy modeled on France", "isolation from overseas markets"], "Merchant institutions and shipping supported a distinctive republican commercial state."],
    ["apeuro-unit-4", "The scientific method challenged older authority chiefly by", "requiring claims to be tested through observation, mathematics, and experiment", ["treating inherited texts as sufficient proof", "rejecting quantitative reasoning", "prohibiting instruments"], "Empirical verification shifted the basis of credible natural knowledge."],
    ["apeuro-unit-5", "Napoleon simultaneously preserved and limited revolutionary change by", "retaining legal equality while restricting political liberty", ["restoring feudal privilege completely", "ending centralized administration", "abolishing the Napoleonic Code"], "His regime institutionalized some reforms under authoritarian rule."],
    ["apeuro-unit-6", "Why did labor unions initially face resistance from liberal governments?", "Collective action was often treated as an unlawful restraint on individual contracts and property", ["Workers already controlled parliament", "Industrial employers supported every strike", "Liberalism rejected private property"], "Early liberal law privileged individual contracting and property over organized labor."],
    ["apeuro-unit-7", "Bismarck's social insurance programs were intended partly to", "weaken socialist appeal while strengthening loyalty to the state", ["abolish industrial capitalism", "eliminate the army", "create direct democracy"], "Conservative state welfare offered protection while containing radical politics."],
    ["apeuro-unit-8", "Appeasement before World War II was shaped most strongly by", "war weariness, economic weakness, and misjudgment of Hitler's aims", ["certainty that Germany was disarming", "complete military superiority and willingness to fight", "the absence of memories of World War I"], "Leaders sought time and peace but underestimated expansionist commitments."],
    ["apeuro-unit-9", "The collapse of communist regimes in Eastern Europe in 1989 was accelerated by", "economic stagnation, reform in the Soviet Union, and mass opposition", ["successful repression everywhere", "the expansion of Stalinist central control", "the end of communication across borders"], "Domestic crisis and reduced Soviet willingness to intervene opened space for revolutions."],
  ].forEach(([unit, prompt, answer, distractors, explanation]) => addHistoryQuestion("apeuro", unit, mcq(prompt, answer, distractors, explanation, "Select the best explanation of the development.", "Hard")));
  [
    ["apgov-unit-1", "Federal categorical grants differ from block grants because categorical grants", "target narrower purposes and usually impose more detailed conditions", ["are prohibited by the Constitution", "give states unlimited discretion", "come only from local governments"], "Categorical grants use the spending power to shape specific state policies."],
    ["apgov-unit-2", "Why can divided government increase policy gridlock?", "Separate institutions controlled by opposing parties have incentives and tools to block one another", ["The president gains unilateral lawmaking power", "Congress loses the power of the purse", "Courts must approve every bill before passage"], "Multiple veto points make agreement harder under partisan conflict."],
    ["apgov-unit-3", "Which government action is most likely to violate the Establishment Clause?", "A public school leads students in a required religious prayer", ["A student privately prays during lunch", "A church endorses a candidate", "A legislature protects voluntary religious exercise"], "Government-sponsored compulsory prayer endorses religion in a public institution."],
    ["apgov-unit-4", "Why do public-opinion polls weight responses?", "To make the sample better reflect relevant population characteristics", ["To guarantee the preferred candidate wins", "To eliminate sampling error entirely", "To replace random selection with convenience sampling"], "Weighting adjusts under- or overrepresented groups but cannot cure every design flaw."],
    ["apgov-unit-5", "An interest group files an amicus curiae brief primarily to", "offer legal arguments or information to influence a court's decision", ["cast a vote on the Court", "remove a justice", "enact a statute without Congress"], "Friend-of-the-court briefs are an outside-litigation strategy."],
  ].forEach(([unit, prompt, answer, distractors, explanation]) => addHistoryQuestion("apgov", unit, mcq(prompt, answer, distractors, explanation, "Apply the relevant constitutional or political principle.", "Hard")));

  // IB Biology.
  add("ibbio", "ibbio-theme-1",
    mcq("A double-stranded DNA sample contains 28% adenine. What percentage of the bases are cytosine?", "22%", ["28%", "44%", "72%"], "Thymine is also 28%, leaving 44% for G and C; therefore C is 22%."),
    mcq("Which observation provides the strongest evidence for common ancestry?", "Different species share homologous genes with similar nucleotide sequences", ["Unrelated species occupy the same habitat", "All organisms have identical phenotypes", "Every mutation produces the same trait"], "Sequence homology is inherited molecular evidence of descent from a common ancestor."));
  add("ibbio", "ibbio-theme-2",
    mcq("Why are phospholipids able to form bilayers spontaneously in water?", "Hydrophilic heads interact with water while hydrophobic tails aggregate away from it", ["Covalent bonds form between every phospholipid", "All phospholipid regions are nonpolar", "Water repels the phosphate heads"], "The amphipathic structure drives self-assembly through hydrophobic interactions."),
    mcq("A competitive inhibitor is added to an enzyme reaction. Which change is most likely?", "The apparent Km increases while Vmax can still be reached at high substrate concentration", ["Vmax falls to zero", "Km decreases and Vmax increases", "Both Km and Vmax remain unchanged"], "Substrate can outcompete the inhibitor, but a greater concentration is required."));
  add("ibbio", "ibbio-theme-3",
    mcq("A plant cell has solute potential −0.7 MPa and pressure potential 0.3 MPa. It is placed in a solution with water potential −0.2 MPa. What is the net direction of water movement?", "Into the cell", ["Out of the cell", "No net movement", "Movement cannot occur through a membrane"], "Cell water potential is −0.4 MPa; water moves from −0.2 to −0.4 MPa."),
    mcq("Removing a top predator causes herbivore abundance to rise and plant biomass to fall. This is best described as", "a trophic cascade", ["primary succession", "competitive exclusion", "genetic drift"], "A change at one trophic level indirectly affects lower levels through feeding relationships."));
  add("ibbio", "ibbio-theme-4",
    mcq("Two heterozygous parents for an autosomal recessive condition have a child. What is the probability the child is unaffected but carries the allele?", "1/2", ["1/4", "3/4", "1"], "Aa × Aa produces AA, Aa, Aa, aa; two of four outcomes are unaffected carriers."),
    mcq("Why does a small isolated population experience stronger genetic drift?", "Random sampling changes allele frequencies more sharply when few individuals reproduce", ["Natural selection stops operating", "Mutations become directed toward adaptation", "Every allele becomes dominant"], "Chance deviations have larger proportional effects in small populations."));

  // IB Chemistry.
  add("ibchem", "ibchem-theme-1",
    mcq("How many moles are present in 8.8 g of CO₂?", "0.20 mol", ["0.10 mol", "0.40 mol", "2.0 mol"], "M(CO₂)=44 g mol⁻¹, so n=8.8/44=0.20 mol."),
    mcq("Successive ionization energies rise modestly for three removals and then increase sharply. The element most likely has", "three valence electrons", ["one valence electron", "four occupied shells", "a noble-gas configuration initially"], "The large jump occurs after all valence electrons have been removed."));
  add("ibchem", "ibchem-theme-2",
    mcq("Which substance has the highest melting point?", "MgO", ["NaCl", "H₂O", "CO₂"], "Mg²⁺ and O²⁻ have larger charge product and strong ionic attraction."),
    mcq("Why is the H–O–H bond angle smaller than the tetrahedral angle?", "Two lone pairs repel bonding pairs more strongly than bonding pairs repel one another", ["O–H bonds are nonpolar", "Water is linear in the gas phase", "Hydrogen forms double bonds to oxygen"], "Lone-pair repulsion compresses the bond angle."));
  add("ibchem", "ibchem-theme-3",
    mcq("Across Period 3, first ionization energy generally rises because", "effective nuclear charge increases while shielding changes relatively little", ["atomic radius increases greatly", "the number of occupied shells doubles", "electron-electron repulsion disappears"], "Greater nuclear attraction holds valence electrons more strongly."),
    mcq("A mass spectrum has molecular-ion peaks M and M+2 in an approximately 3:1 ratio. Which atom is most likely present?", "Chlorine", ["Bromine", "Carbon", "Fluorine"], "The natural abundances of chlorine-35 and chlorine-37 are approximately 3:1."));
  add("ibchem", "ibchem-theme-4",
    mcq("For a reaction with ΔH = −120 kJ mol⁻¹ and ΔS = −200 J mol⁻¹ K⁻¹, above what temperature does the reaction become nonspontaneous?", "600 K", ["240 K", "400 K", "1,667 K"], "Set ΔG=0: T=ΔH/ΔS=(−120000)/(−200)=600 K."),
    mcq("A catalyst changes which quantities?", "It lowers activation energy in both directions but does not change K", ["It increases ΔH and K", "It changes equilibrium composition permanently", "It lowers activation energy only for the forward reaction"], "A catalyst changes kinetics, not thermodynamic state functions or equilibrium position."));
  add("ibchem", "ibchem-theme-5",
    mcq("For rate = k[A]²[B], what happens to rate if [A] doubles and [B] halves?", "The rate doubles", ["The rate halves", "The rate quadruples", "The rate is unchanged"], "The factor is 2²×(1/2)=2."),
    mcq("For N₂O₄(g) ⇌ 2NO₂(g), the container volume is suddenly decreased. The equilibrium shifts", "left, toward fewer gas particles", ["right, toward more gas particles", "nowhere because K becomes zero", "right because pressure falls"], "Higher pressure favors the side with fewer moles of gas."));
  add("ibchem", "ibchem-theme-6",
    mcq("A buffer contains equal concentrations of HA and A⁻. Its pH is", "equal to pKa", ["equal to 7 in every case", "twice pKa", "equal to pKb"], "Henderson–Hasselbalch gives pH=pKa+log(1)=pKa."),
    mcq("In a galvanic cell, oxidation occurs at the", "anode, which supplies electrons to the external circuit", ["cathode, which supplies electrons", "salt bridge only", "electrolyte without an electrode"], "Oxidation releases electrons at the anode; reduction consumes them at the cathode."));

  // IB Psychology.
  add("ibpsych", "ibpsych-theme-1",
    mcq("Which design best tests whether sleep deprivation causes poorer recall?", "Randomly assign participants to sleep-deprived and normal-sleep conditions, then compare recall", ["Correlate self-reported sleep and grades", "Interview one student with insomnia", "Compare two preexisting age groups"], "Random assignment and manipulation support a causal inference."),
    mcq("A drug blocks dopamine receptors. Which prediction follows most directly?", "Neural responses normally mediated by dopamine should decrease", ["Dopamine synthesis must immediately stop", "All neurotransmission becomes electrical", "The blood-brain barrier disappears"], "A receptor antagonist reduces postsynaptic response even if transmitter is present."));
  add("ibpsych", "ibpsych-theme-2",
    mcq("Participants remember the first and last words in a list better than middle words. This is the", "serial-position effect", ["fundamental attribution error", "placebo effect", "availability cascade"], "Primacy and recency combine to produce the serial-position curve."),
    mcq("A witness's memory changes after hearing a misleading question. This finding supports the view that memory is", "reconstructive", ["a perfect recording", "entirely genetic", "unaffected by post-event information"], "Retrieval can incorporate schemas and later information."));
  add("ibpsych", "ibpsych-theme-3",
    mcq("A person explains a stranger's rude behavior as personality but their own rude behavior as caused by stress. This pattern combines", "fundamental attribution error and actor-observer bias", ["classical conditioning and extinction", "group polarization and deindividuation", "encoding and retrieval failure"], "Observers overemphasize disposition, while actors emphasize situations affecting themselves."),
    mcq("Which finding would best support social identity theory?", "Minimal arbitrary groups are enough to produce in-group favoritism", ["People never categorize themselves", "Only relatives receive favorable treatment", "Group membership cannot affect self-esteem"], "Even trivial categorization can create an in-group identity and bias."));
  add("ibpsych", "ibpsych-theme-4",
    mcq("A longitudinal study is especially useful for investigating development because it", "tracks change in the same participants over time", ["eliminates attrition", "always takes less time than a cross-sectional study", "prevents cohort effects by using new samples each year"], "Repeated observation directly measures within-person change, though attrition remains a limitation."),
    mcq("Which conclusion is justified when a therapy group improves more than a randomized placebo-control group?", "The therapy likely contributed to improvement under the study conditions", ["The therapy cures every patient", "Placebo effects cannot exist", "Random assignment guarantees a representative population"], "The controlled randomized difference supports causation, not universal generalization."));
  add("ibpsych", "ibpsych-theme-5",
    mcq("Why is inter-rater reliability important in an observational study?", "It shows that independent observers apply the coding scheme consistently", ["It proves the sample is random", "It eliminates participant reactivity", "It guarantees construct validity"], "Agreement reduces concern that results depend on one observer's subjective judgments."),
    mcq("Researchers conceal the study's true purpose and later explain it fully. Which ethical process is essential after participation?", "Debriefing", ["Random sampling", "Counterbalancing", "Peer review before consent"], "Debriefing explains deception, restores informed understanding, and offers withdrawal where appropriate."));

  // IB Economics.
  add("ibecon", "ibecon-theme-1",
    mcq("A government chooses to fund hospitals rather than a rail line. The opportunity cost is", "the benefits of the best rail project forgone", ["the hospital construction bill only", "all possible government projects combined", "zero because taxes finance both"], "Opportunity cost is the next-best alternative sacrificed."),
    mcq("A bowed-out production possibility curve indicates", "increasing opportunity cost as resources are reallocated", ["constant opportunity cost", "unlimited resources", "productive inefficiency at every point"], "Resources are not equally suited to producing both goods."));
  add("ibecon", "ibecon-theme-2",
    mcq("A binding price ceiling below equilibrium creates", "a shortage", ["a surplus", "higher legal equilibrium price", "an outward supply shift"], "Quantity demanded exceeds quantity supplied at the controlled price."),
    mcq("Demand elasticity is 0.4. If price rises by 10%, quantity demanded changes by approximately", "a 4% decrease", ["a 25% decrease", "a 4% increase", "a 10% decrease"], "Percentage quantity change equals elasticity times percentage price change, in the opposite direction."));
  add("ibecon", "ibecon-theme-3",
    mcq("If an economy has a deflationary gap, which policy is most directly expansionary?", "Increase government spending or reduce taxes", ["Raise interest rates", "Reduce the money supply", "Cut transfer payments"], "Expansionary fiscal policy increases aggregate demand."),
    mcq("Nominal income rises 6% while the price level rises 8%. Real purchasing power approximately", "falls by 2%", ["rises by 14%", "rises by 2%", "is unchanged"], "Real growth is approximately nominal growth minus inflation."));
  add("ibecon", "ibecon-theme-4",
    mcq("Country A has a lower opportunity cost of producing coffee than Country B. Trade theory predicts A should", "specialize relatively more in coffee and export it", ["import coffee exclusively", "avoid trade because B may have absolute advantage", "produce only goods with the highest monetary price"], "Comparative advantage depends on opportunity cost, not absolute productivity."),
    mcq("A tariff on imported steel will most likely", "raise domestic steel price and reduce import quantity", ["lower domestic producer surplus", "increase world efficiency", "eliminate government revenue"], "The tariff creates a wedge that protects domestic producers but causes consumption and production distortions."));
  add("ibecon", "ibecon-theme-5",
    mcq("Which evidence would best strengthen an evaluation of a sugar tax?", "Price, consumption, health, and distributional data before and after implementation", ["A definition of taxation alone", "One producer's advertisement", "A supply diagram without any context"], "Evaluation should test intended effects, side effects, and equity using relevant evidence."),
    mcq("A strong economics commentary uses a diagram most effectively when it", "explains each shift using evidence from the chosen real-world case", ["includes every diagram learned in the course", "labels curves but never refers to them", "assumes a policy has no stakeholders"], "The model should analyze the case rather than decorate the response."));

  // IB Geography.
  add("ibgeo", "ibgeo-theme-1",
    mcq("A choropleth map of population totals can mislead when regions differ greatly in area. What is a better mapped variable?", "Population density", ["Raw population total with no normalization", "Latitude only", "A random category"], "Normalizing by area makes intensity more comparable."),
    mcq("Which sampling method best captures environmental quality at increasing distances from a highway?", "Systematic samples along transects perpendicular to the highway", ["Convenience samples beside one parking lot", "One sample chosen after seeing results", "Only interviews with drivers"], "Transects reveal a distance-decay pattern while systematic spacing reduces selection bias."));
  add("ibgeo", "ibgeo-theme-2",
    mcq("A country has falling death rates while birth rates remain high. In the demographic transition model it is most likely in", "Stage 2", ["Stage 1", "Stage 4", "Stage 5 only"], "Early transition produces rapid natural increase as mortality falls before fertility."),
    mcq("Which process most directly intensifies urban heat islands?", "Dark impervious surfaces absorb heat and vegetation loss reduces evapotranspiration", ["Rural albedo always falls below urban albedo", "Cities receive more solar radiation because of latitude", "Urban buildings eliminate waste heat"], "Surface properties, limited vegetation, and anthropogenic heat raise urban temperatures."));
  add("ibgeo", "ibgeo-theme-3",
    mcq("Why can earthquake magnitude be high while local losses remain limited?", "The epicenter may be remote and exposure or vulnerability low", ["Magnitude measures property damage directly", "All high-magnitude earthquakes strike dense cities", "Building design cannot affect risk"], "Disaster risk depends on hazard, exposure, vulnerability, and capacity."),
    mcq("On a storm hydrograph, urbanization generally causes", "shorter lag time and higher peak discharge", ["longer lag time and lower peak discharge", "no change in runoff", "lower peak discharge because pavement absorbs water"], "Impervious surfaces and drains move water to channels rapidly."));
  add("ibgeo", "ibgeo-theme-4",
    mcq("Gentrification can simultaneously", "increase investment while displacing lower-income residents", ["eliminate every housing shortage", "reduce all property values", "end spatial inequality"], "Reinvestment and amenity gains can be accompanied by rising rents and exclusion."),
    mcq("A primate city is one that", "is disproportionately larger and more influential than the next-ranked cities", ["has no economic links outside its country", "is always the political capital", "contains only primary-sector employment"], "Primate-city dominance exceeds what a regular rank-size pattern predicts."));
  add("ibgeo", "ibgeo-theme-5",
    mcq("A global production network places design in one country, components in several others, and assembly where wages are lower. This illustrates", "a spatial division of labor coordinated by a transnational corporation", ["complete economic autarky", "the end of comparative advantage", "a local multiplier without trade"], "Firms fragment production to exploit location-specific advantages."),
    mcq("Which indicator best reveals that globalization's benefits are uneven within a country?", "Regional wage and employment changes disaggregated by sector", ["National GDP alone", "Total land area", "Average latitude"], "Aggregate growth can conceal concentrated gains and losses."));

  // IB Environmental Systems and Societies.
  add("ibess", "ibess-theme-1",
    mcq("A lake receives nutrient runoff, algal growth increases, decomposition lowers oxygen, and fish die. This sequence is", "a positive feedback that can intensify eutrophication", ["a stabilizing negative feedback only", "primary succession without nutrient change", "a closed system with no inputs"], "More biomass and decomposition can reinforce oxygen depletion and ecological change."),
    mcq("Which property distinguishes an open system?", "It exchanges both energy and matter with its surroundings", ["It exchanges neither", "It exchanges energy but never matter", "It must remain at equilibrium"], "Most ecosystems are open systems."));
  add("ibess", "ibess-theme-2",
    mcq("In a mark-release-recapture study, 40 animals are marked. Later 50 are captured and 10 are marked. The estimated population is", "200", ["80", "100", "500"], "N ≈ (40×50)/10 = 200."),
    mcq("Why does habitat fragmentation often reduce biodiversity?", "It isolates populations and increases edge effects", ["It always increases core habitat", "It prevents invasive species from entering", "It guarantees gene flow"], "Small isolated patches support fewer individuals and expose more habitat to edge conditions."));
  add("ibess", "ibess-theme-3",
    mcq("Why can irrigation in arid regions cause soil salinization?", "Evaporation leaves dissolved salts behind near the surface", ["Rainfall washes every ion away", "Plants convert salts to nitrogen gas", "Irrigation prevents capillary rise"], "Repeated irrigation plus high evaporation concentrates salts in the root zone."),
    mcq("Which policy most directly addresses groundwater depletion from many independent farmers?", "Metered extraction limits based on aquifer recharge", ["A subsidy for deeper wells", "Removal of all monitoring", "A fixed crop price unrelated to water use"], "A shared-resource limit ties withdrawals to sustainable replenishment."));
  add("ibess", "ibess-theme-4",
    mcq("Why does ocean acidification reduce calcification?", "Added CO₂ lowers pH and reduces carbonate-ion availability", ["It removes all dissolved carbon", "It raises pH above 10", "It converts calcium into nitrogen"], "Carbonic acid shifts carbonate equilibria away from carbonate ions used in shells."),
    mcq("Which intervention reduces both particulate air pollution and carbon dioxide emissions?", "Replacing coal combustion with low-carbon electricity", ["Installing taller smokestacks only", "Moving traffic to a neighboring district", "Increasing coal sulfur content"], "Avoided combustion reduces both local particulates and greenhouse-gas emissions."));
  add("ibess", "ibess-theme-5",
    mcq("A carbon tax is most effective when it", "makes emitters face the social cost and preserves incentives to reduce each additional unit", ["sets emissions price permanently at zero", "rewards higher fossil-fuel use", "prohibits measurement"], "Pricing the external cost changes decisions throughout the economy."),
    mcq("Life-cycle assessment compares products by", "tracking material and energy impacts from extraction through disposal", ["considering purchase price only", "ignoring transport and waste", "measuring one factory shift"], "A full life cycle prevents shifting impacts between stages."));
  add("ibess", "ibess-theme-6",
    mcq("A stream study finds r = −0.82 between nitrate concentration and macroinvertebrate diversity. What can be concluded?", "There is a strong negative association, but causation requires additional evidence", ["Nitrate definitely causes exactly 82% of diversity loss", "There is no relationship", "Diversity causes nitrate in every stream"], "Correlation describes association and does not by itself control confounders."),
    mcq("Why should a field investigation record uncertainty and repeat measurements?", "To estimate precision and distinguish patterns from measurement variation", ["To guarantee the hypothesis is true", "To remove all systematic error automatically", "To make sample size irrelevant"], "Replication and uncertainty quantify reliability but do not eliminate every bias."));

  // IB Mathematics: Analysis and Approaches.
  add("ibmathaa", "ibmathaa-theme-1",
    mcq("Solve 3^(2x−1) = 27.", "x = 2", ["x = 1", "x = 3", "x = 4/3"], "Since 27=3³, 2x−1=3 and x=2."),
    mcq("The sum of the first 20 terms of an arithmetic sequence with a₁=5 and d=3 is", "670", ["610", "640", "1,340"], "a₂₀=62 and S₂₀=20(5+62)/2=670."));
  add("ibmathaa", "ibmathaa-theme-2",
    mcq("For f(x)=(2x−1)/(x+3), solve f(x)=1.", "x = 4", ["x = −2", "x = 1", "x = −3"], "2x−1=x+3 gives x=4; x=−3 is excluded."),
    mcq("If g(x)=f(x−2)+3, the graph of f is translated", "2 right and 3 up", ["2 left and 3 up", "2 right and 3 down", "3 right and 2 up"], "Replacing x by x−2 shifts right; adding 3 shifts up."));
  add("ibmathaa", "ibmathaa-theme-3",
    mcq("Two sides of a triangle are 7 and 10 with included angle 60°. The third side is", "√79", ["√51", "13", "17"], "Cosine rule: c²=49+100−140(1/2)=79."),
    mcq("A vector has components ⟨6,8⟩. Its magnitude is", "10", ["7", "14", "100"], "Magnitude is √(6²+8²)=10."));
  add("ibmathaa", "ibmathaa-theme-4",
    mcq("A fair die is rolled twice. What is the probability the sum is 8?", "5/36", ["1/6", "1/8", "8/36"], "The favorable ordered pairs are (2,6),(3,5),(4,4),(5,3),(6,2)."),
    mcq("For data with mean 40 and standard deviation 5, the z-score of 52.5 is", "2.5", ["1.5", "2", "10.5"], "Standardize the value: z=(52.5−40)/5=2.5."));
  add("ibmathaa", "ibmathaa-theme-5",
    mcq("If f(x)=x²e^x, then f′(x)=", "e^x(x²+2x)", ["2xe^x", "x²e^x", "e^x(x²−2x)"], "The product rule gives 2xe^x+x²e^x."),
    mcq("Evaluate ∫₀² (3x²+1) dx.", "10", ["8", "9", "12"], "An antiderivative is x³+x; evaluating from 0 to 2 gives 8+2=10."));

  // IB History of the Americas.
  add("ibhistamer", "ibhistamer-theme-1",
    mcq("Which factor most shaped the different colonial labor systems established in the Americas?", "Local demography, available crops and minerals, and imperial policy", ["A uniform climate across all colonies", "The absence of Indigenous political organization", "An immediate ban on coerced labor"], "Labor systems varied with environment, population, economic goals, and state power."),
    mcq("A colonial official's report describing Indigenous labor is most useful when paired with", "accounts from Indigenous communities and evidence about the official's administrative goals", ["the report alone treated as neutral", "a source from an unrelated century only", "no information about authorship"], "Corroboration and sourcing help evaluate perspective and omission."));
  add("ibhistamer", "ibhistamer-theme-2",
    mcq("Why did Atlantic revolutionary language pose a challenge to slaveholding societies?", "Claims about natural rights exposed contradictions in racial slavery", ["It defended hereditary bondage explicitly", "It ended plantation exports immediately", "It rejected popular sovereignty"], "Universal claims could be appropriated by enslaved and free people seeking emancipation."),
    mcq("The Haitian Revolution had which major hemispheric consequence?", "It inspired antislavery hopes while alarming slaveholding elites", ["It restored French slavery throughout the Americas", "It ended every colonial war", "It prevented Latin American independence"], "Its success changed debates about race, slavery, and revolution across the region."));
  add("ibhistamer", "ibhistamer-theme-3",
    mcq("A central problem of nineteenth-century nation-building in the Americas was", "reconciling regional interests with stronger central authority", ["eliminating all export trade", "restoring precolonial borders everywhere", "avoiding written constitutions"], "Federalism, caudillismo, and civil conflict often grew from center-region tensions."),
    mcq("Which evidence best supports an argument that territorial expansion intensified sectional conflict in the United States?", "Repeated disputes over whether slavery could expand into western territories", ["The disappearance of political parties", "Uniform northern and southern economies", "An end to congressional compromise"], "Expansion repeatedly reopened the balance between free and slave regions."));
  add("ibhistamer", "ibhistamer-theme-4",
    mcq("Industrialization drew migrants to cities chiefly because", "factories and services concentrated wage employment", ["rural land became universally free", "cities eliminated class inequality", "transportation networks disappeared"], "Urban labor demand pulled workers while rural pressures often pushed them."),
    mcq("Progressive reformers most commonly responded to industrial capitalism by", "seeking regulation, public health measures, and political reform", ["abolishing all government inspection", "restoring mercantilist empires", "opposing mass education"], "Reform movements targeted unsafe conditions, corruption, monopoly, and urban problems."));
  add("ibhistamer", "ibhistamer-theme-5",
    mcq("U.S. intervention in the Caribbean around 1900 was most directly connected to", "strategic interests, commercial expansion, and claims of regional police power", ["the abandonment of naval power", "support for European recolonization", "the end of canal planning"], "Security and economic arguments accompanied an expanding interpretation of hemispheric power."),
    mcq("The Great Depression strengthened state intervention across many American countries because", "economic collapse discredited laissez-faire responses and intensified social demands", ["exports rose rapidly", "unemployment disappeared", "governments lost the ability to regulate banks"], "Crisis encouraged relief, regulation, and new development strategies."));
  add("ibhistamer", "ibhistamer-theme-6",
    mcq("During the Cold War, U.S. policy toward Latin America often prioritized", "anti-communism even when allied governments were authoritarian", ["neutrality toward every revolution", "ending all military aid", "restoring Spanish colonial rule"], "Containment frequently outweighed democracy and human-rights concerns."),
    mcq("The Cuban Missile Crisis is best understood as", "a confrontation shaped by deterrence, misperception, and negotiated compromise", ["a direct conventional war lasting years", "the end of nuclear competition", "a conflict unrelated to alliance security"], "Both sides balanced credibility against the risk of nuclear escalation."));
  add("ibhistamer", "ibhistamer-theme-7",
    mcq("Which strategy was shared by several civil-rights movements in the Americas?", "Combining grassroots mobilization with legal and political pressure", ["Avoiding public organization", "Rejecting all court challenges", "Relying only on foreign armies"], "Movements used multiple institutions while building sustained collective action."),
    mcq("A truth commission after authoritarian rule primarily seeks to", "document abuses and establish a public record, sometimes alongside limited accountability", ["erase testimony", "guarantee immediate prosecution in every case", "restore the former regime"], "Truth commissions address memory and recognition, though their legal powers vary."));

  window.YSB_AP_EXAM_PRACTICE = banks;
  window.YSB_ATTACH_IB_EXAM_PRACTICE = (collections) => {
    Object.entries(collections).forEach(([course, units]) => {
      (units || []).forEach((unit) => {
        const questions = banks[course]?.[unit.id] || [];
        if (questions.length) unit.questions = [...(unit.questions || []), ...questions];
      });
    });
  };
})();
