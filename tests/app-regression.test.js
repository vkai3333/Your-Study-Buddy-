const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const app = fs.readFileSync(path.join(dist, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(dist, "styles.css"), "utf8");
const main = fs.readFileSync(path.join(root, "electron", "main.cjs"), "utf8");
const preload = fs.readFileSync(path.join(root, "electron", "preload.cjs"), "utf8");
const selectionStorage = require(path.join(dist, "anki-selection-storage.js"));
const generatorSamples = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "note-generator-samples.json"), "utf8"));

function generatorHarness() {
  const helperSource = app.slice(app.indexOf("function cleanNoteLine"), app.indexOf("function notesEditor"));
  const cardSource = app.slice(app.indexOf("function generateCardsFromNotes"), app.indexOf("function cardTopic"));
  const context = { makeLocalId: (prefix) => `${prefix}-test-${Math.random()}`, typedQuestionAsCloze: (question) => question };
  vm.createContext(context);
  vm.runInContext(`${helperSource}\n${cardSource}\nthis.generateCardsFromNotes = generateCardsFromNotes;`, context);
  return context.generateCardsFromNotes;
}

function generatorQualityHarness() {
  const helperSource = app.slice(app.indexOf("function cleanNoteLine"), app.indexOf("function notesEditor"));
  const cardSource = app.slice(app.indexOf("function generateCardsFromNotes"), app.indexOf("function cardTopic"));
  const cardTopicSource = app.slice(app.indexOf("function cardTopic"), app.indexOf("function supplementalQuestionsFromNotes"));
  const supplementalSource = app.slice(app.indexOf("function supplementalQuestionsFromNotes"), app.indexOf("function generateQuestionsFromCards"));
  const questionSource = app.slice(app.indexOf("function generateQuestionsFromCards"), app.indexOf("function generateFeynmanPrompts"));
  const feynmanSource = app.slice(app.indexOf("function generateFeynmanPrompts"), app.indexOf("const questionTypeOptions"));
  const context = { makeLocalId: (prefix) => `${prefix}-test-${Math.random()}`, typedQuestionAsCloze: (question) => question };
  vm.createContext(context);
  vm.runInContext(`${helperSource}\n${cardSource}\n${cardTopicSource}\n${supplementalSource}\n${questionSource}\n${feynmanSource}\nthis.api = { generateCardsFromNotes, supplementalQuestionsFromNotes, generateQuestionsFromCards, generateFeynmanPrompts };`, context);
  return context.api;
}

test("browser JavaScript entry points parse", () => {
  for (const file of ["app.js", "app.bundle.js", "exam-practice-data.js", "fullscreen.js", "table-editing.js", "open-note-controls.js", "anki-selection-storage.js", "account-sync.js", "interface-language.js", "performance-bootstrap.js"]) {
    const result = spawnSync(process.execPath, ["--check", path.join(dist, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${file} failed syntax validation:\n${result.stderr}`);
  }
});

test("all local scripts, stylesheets, and images referenced by index exist", () => {
  const references = [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
  assert.ok(references.length >= 4, "expected the app shell to reference its local assets");
  const missing = references.filter((reference) => !fs.existsSync(path.join(dist, reference)));
  assert.deepEqual(missing, []);
});

test("the native macOS build copies every local file referenced by index", () => {
  const buildScript = fs.readFileSync(path.join(root, "build-mac-app.sh"), "utf8");
  const references = [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)]
    .map((match) => match[1])
    .filter((reference) => !reference.includes("/"));
  const missingCopies = references.filter((reference) => !buildScript.includes(`dist/${reference}`));
  assert.deepEqual(missingCopies, [], `native build omits: ${missingCopies.join(", ")}`);
});

test("primary navigation and critical workspaces remain wired", () => {
  for (const id of ["dashboard", "courses", "flashcards", "create", "notes-page", "export", "custom-study-page"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing workspace ${id}`);
  }
  for (const id of ["active-anki-list", "study-selected-active-anki", "notes-input", "drawing-note-canvas", "custom-review-card"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing critical control ${id}`);
  }
});

test("small screens use readable single-column catalogs and contained pagination", () => {
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.flashcards-deck-grid \{ grid-template-columns: repeat\(2,minmax\(0,1fr\)\); \}/);
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.flashcards-deck-grid \{ grid-template-columns: minmax\(0,1fr\); \}/);
  assert.match(styles, /\.library-pagination \{ width: 100%; display: grid; grid-template-columns: repeat\(2,minmax\(0,1fr\)\);/);
  assert.match(styles, /@media \(max-width: 360px\)[\s\S]*?\.catalog-card-actions,\.community-card-actions \{ grid-template-columns: 1fr; \}/);
});

test("Browse contains built-in and community libraries while Study contains saved sets", () => {
  const browseStart = html.indexOf('id="courses"');
  const studyStart = html.indexOf('id="flashcards"');
  const createStart = html.indexOf('id="create"');
  const libraryStart = html.indexOf('id="browse-flashcard-sets"');
  assert.ok(browseStart >= 0 && browseStart < libraryStart && libraryStart < studyStart, "the built-in study library should live in Browse");
  assert.doesNotMatch(html.slice(browseStart, studyStart), /id="browse-textbooks"|My textbooks|Available textbooks/, "Browse should no longer expose a separate textbook interface");
  assert.match(html.slice(browseStart, studyStart), /data-browse-library-view="community"/);
  assert.match(html.slice(browseStart, studyStart), /flashcards, practice questions, and Feynman prompts/i, "Browse should describe complete study sets");
  assert.ok(studyStart < html.indexOf('id="study-folder-list"') && html.indexOf('id="study-folder-list"') < createStart, "saved study sets should remain in Study");
  assert.doesNotMatch(html.slice(studyStart, createStart), /built-in-flashcards-library/, "Study should not repeat the built-in library");
  assert.match(app, /function setBrowseLibraryView\(view = state\.browseLibraryView\)/);
  assert.doesNotMatch(app, /setBrowseLibraryView\("textbooks"\)/);
});

test("former textbooks are complete study sets with questions and Feynman prompts", () => {
  assert.match(app, /catalogLabel: "Study set"/);
  assert.match(app, /questions: textbookPracticeQuestions\(course, unit, cards, unitIndex\)/);
  assert.match(app, /Which term best matches this description\?/);
  assert.match(app, /feynmanPrompts: unit\.miniUnits\.flatMap/);
  assert.match(app, /function migrateEnrolledTextbooksToStudySets\(\)/);
  assert.match(app, /current\.add\(`textbook-\$\{courseId\}`\)/);
  assert.match(app, /runStartupStep\("Textbook migration", migrateEnrolledTextbooksToStudySets\)/);
});

test("Create explains that one generated item type is enough", () => {
  assert.match(html, /only needs one flashcard, one question, or one Feynman prompt/i);
  assert.doesNotMatch(html, /One pass creates and saves flashcards, practice questions, and Feynman prompts/i);
});

test("successfully generated notes stay cleared after saving", () => {
  assert.match(app, /function clearNotesAfterUpdate\(\) \{\s*setNotesContent\(\);/);
  assert.doesNotMatch(app, /enteringCreate && state\.notesHiddenAfterUpdate/);
  assert.match(app, /function editCustomDeck[\s\S]*?state\.notesHiddenAfterUpdate = true;[\s\S]*?setNotesContent\(\);/);
});

test("Active Anki selections survive same-day restarts and expire the next day", () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  const key = "test-selection";
  selectionStorage.save(storage, key, "2026-10-17", new Set(["deck:alpha", "course:biology", "deck:alpha", "invalid"]));
  assert.deepEqual(selectionStorage.load(storage, key, "2026-10-17"), ["deck:alpha", "course:biology"]);
  assert.deepEqual(selectionStorage.load(storage, key, "2026-10-18"), []);
});

test("combined Anki retains source labels and per-deck progress", () => {
  assert.match(app, /activeAnkiOwnerName/);
  assert.match(app, /activeAnkiOwnerKey/);
  assert.match(html, /id="custom-anki-source"/);
  assert.match(html, /id="custom-anki-deck-progress-list"/);
});

test("AP decks expose selectable numbered subtopics inside each unit", () => {
  assert.match(app, /function apSubtopicsForUnit\(/);
  assert.match(app, /loadLazyScript\("ap-ced-topic-data\.js"\)/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "tools", "browser-bundle-sources.json"), "utf8"), /ap-ced-topic-data\.js/);
  assert.match(app, /window\.AP_CED_TOPIC_MAP/);
  assert.match(app, /label: `\$\{topic\.number\} \$\{topic\.title\}`/);
  assert.match(app, /data-built-in-topic/);
  assert.match(app, /selectedBuiltInTopicIds/);
  assert.match(app, /chosenTopics\(unit\)\.flatMap\(\(topic\) => topic\.cards\)/);
});

test("notebook folders study individual notes as selectable topics", () => {
  assert.match(html, /id="notebook-topic-picker"/);
  assert.match(html, /id="toggle-all-notebook-topics"/);
  assert.match(app, /data-study-note-folder/);
  assert.match(app, /function openNotebookFolderStudy\(folderId\)/);
  assert.match(app, /state\.selectedNotebookNoteIds = notes\.map\(\(note\) => note\.id\)/);
  assert.match(app, /data-notebook-topic/);
  assert.match(app, /selectedNotes\.map\(\(note\) =>/);
  assert.match(app, /sourceDeckId: `notebook-note:\$\{note\.id\}`/);
  assert.match(html, /data-note-notebook-select/);
  assert.match(app, /function renderActiveNoteNotebookSelectors\(\)/);
  assert.match(app, /data-new-note-in-folder/);
  assert.doesNotMatch(html, /data-new-note="cornell"/);
  assert.match(html, /data-add-document-page="cornell"/);
  assert.match(html, /data-new-note="outline"/);
  assert.match(app, /function noteTemplateContent\(type\)/);
});

test("Cornell notes preserve a study-ready three-zone page", () => {
  assert.match(app, /function cornellTemplateContent\(\)/);
  assert.match(app, /Cues & questions/);
  assert.match(app, /Record during class/);
  assert.match(app, /Write after reviewing the page/);
  assert.match(app, /function migrateCornellTemplateHtml\(rawHtml\)/);
  assert.match(app, /note\.noteTemplate === "cornell"/);
  assert.match(app, /const templateClasses = new Set\(\["cornell-note-template"/);
  assert.match(styles, /\.cornell-columns \{[^}]*grid-template-columns: minmax\(155px,29%\) minmax\(0,1fr\)/);
  assert.match(styles, /\.cornell-summary \{[^}]*border-top: 1\.5px solid/);
  assert.match(styles, /\.cornell-writing-area\[data-placeholder\]:has\(> br:only-child\)::before/);
});

test("AP English Language and Literature starter courses provide original study coverage", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "ap-english-data.js"), "utf8"), context);
  assert.equal(context.window.AP_ENGLISH_LANGUAGE_DECKS.length, 9);
  assert.equal(context.window.AP_ENGLISH_LITERATURE_DECKS.length, 9);
  for (const course of [context.window.AP_ENGLISH_LANGUAGE_DECKS, context.window.AP_ENGLISH_LITERATURE_DECKS]) {
    assert.ok(course.every((unit) => unit.cards.length >= 5));
    assert.ok(course.every((unit) => unit.questions.length >= 1));
    assert.ok(course.every((unit) => unit.questions.every((question) => question.type === "essay")));
    assert.ok(course.every((unit) => unit.feynmanPrompts.length >= 1));
  }
  const languageQuestions = context.window.AP_ENGLISH_LANGUAGE_DECKS.flatMap((unit) => unit.questions);
  const literatureQuestions = context.window.AP_ENGLISH_LITERATURE_DECKS.flatMap((unit) => unit.questions);
  assert.equal(languageQuestions.length, 18);
  assert.equal(literatureQuestions.length, 18);
  assert.ok(context.window.AP_ENGLISH_LANGUAGE_DECKS.every((unit) => unit.questions.length === 2));
  assert.ok(context.window.AP_ENGLISH_LITERATURE_DECKS.every((unit) => unit.questions.length === 2));
  assert.ok(literatureQuestions.some((question) => question.essayType === "prose_analysis"));
  assert.ok(literatureQuestions.some((question) => question.essayType === "poetry_analysis"));
  assert.ok(literatureQuestions.some((question) => question.essayType === "drama_analysis"));
  const rhetoricalQuestions = languageQuestions.filter((question) => question.essayType === "rhetorical_analysis");
  const synthesisQuestions = languageQuestions.filter((question) => question.essayType === "synthesis");
  assert.ok(rhetoricalQuestions.every((question) => question.sources.length === 1));
  assert.ok(rhetoricalQuestions.every((question) => question.sources[0].excerpt.trim().split(/\s+/).length >= 250));
  assert.ok(synthesisQuestions.every((question) => question.sources.length >= 6 && question.sources.length <= 7));
  assert.ok(synthesisQuestions.every((question) => {
    const visualCount = question.sources.filter((source) => source.visual?.type === "image" || source.visual?.type === "table").length;
    return visualCount >= 1 && visualCount <= 2;
  }));
  assert.ok(synthesisQuestions.every((question) => question.sources.every((source) => source.title && source.author && source.date && source.sourceUrl && source.excerpt && source.rights)));
  assert.ok([...languageQuestions, ...literatureQuestions].flatMap((question) => question.sources || []).every((source) => source.sourceUrl && source.rights));
  assert.match(app, /essay-source-visual/);
  assert.match(app, /prose_analysis: "Prose analysis"/);
});

test("every AP card is mapped exactly once to a CED topic", () => {
  const exported = JSON.parse(spawnSync(process.execPath, [path.join(root, "tools", "export-ap-content.cjs")], { encoding: "utf8", maxBuffer: 20_000_000 }).stdout);
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "ap-ced-topic-data.js"), "utf8"), context);
  const globals = {
    aphug: "AP_HUMAN_GEOGRAPHY_DECKS", apworld: "AP_WORLD_HISTORY_DECKS", apes: "AP_ENVIRONMENTAL_SCIENCE_DECKS",
    apeuro: "AP_EUROPEAN_HISTORY_DECKS", apgov: "AP_US_GOVERNMENT_DECKS", appsych: "AP_PSYCHOLOGY_DECKS",
    apush: "AP_US_HISTORY_DECKS", apart: "AP_ART_HISTORY_DECKS", apcsp: "AP_CSP_DECKS", apbiology: "AP_BIOLOGY_DECKS",
    apstats: "AP_STATISTICS_DECKS", apchem: "AP_CHEMISTRY_DECKS", apcalculus: "AP_CALCULUS_DECKS",
    apprecalculus: "AP_PRECALCULUS_DECKS", apcompgov: "AP_COMPARATIVE_GOVERNMENT_DECKS",
    apmicro: "AP_MICROECONOMICS_DECKS", apmacro: "AP_MACROECONOMICS_DECKS", apmusic: "AP_MUSIC_THEORY_DECKS",
    aplatin: "AP_LATIN_DECKS", apaas: "AP_AFRICAN_AMERICAN_STUDIES_DECKS", apcyber: "AP_CYBERSECURITY_DECKS",
    apbusiness: "AP_BUSINESS_PERSONAL_FINANCE_DECKS",
  };
  for (const [courseId, globalName] of Object.entries(globals)) {
    const expected = exported[globalName].flatMap((unit) => unit.cards.map((card) => `${unit.id}:${card.id}`)).sort();
    const definitions = Object.values(context.window.AP_CED_TOPIC_MAP.courses[courseId].units).flat();
    const actual = definitions.flatMap((topic) => topic.cardRefs.map(([unitId, cardId]) => `${unitId}:${cardId}`)).sort();
    assert.deepEqual(actual, expected, `${courseId} must map every card once`);
    definitions.forEach((topic) => assert.match(topic.number, /^(?:SP\.|\d+\.)\d+$/));
  }
});

test("AP Psychology topics include stimulus and sourced diagram questions", () => {
  const exported = JSON.parse(spawnSync(process.execPath, [path.join(root, "tools", "export-ap-content.cjs")], { encoding: "utf8", maxBuffer: 20_000_000 }).stdout);
  const context = { window: { ...exported } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "science-diagrams.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(dist, "ap-ced-topic-data.js"), "utf8"), context);
  const questionHelpers = app.slice(app.indexOf("const sourcedDiagramPages"), app.indexOf("function collectionStudyDeck"));
  vm.runInContext(`${questionHelpers}\nthis.apSubtopicsForUnit = apSubtopicsForUnit;`, context);
  const collection = { id: "appsych", name: "AP Psychology", catalogLabel: "AP course", units: context.window.AP_PSYCHOLOGY_DECKS };
  const topics = collection.units.flatMap((unit) => context.apSubtopicsForUnit(collection, unit));
  const questions = topics.flatMap((topic) => topic.questions);
  const diagrams = questions.filter((question) => question.type === "diagram_label");
  assert.ok(topics.every((topic) => topic.questions.length >= 2), "every AP Psychology topic should have at least two questions");
  assert.ok(questions.some((question) => question.type === "stimulus_mcq"), "expected stimulus-based practice");
  assert.ok(diagrams.length >= 3, "expected several psychology diagram-labeling questions");
  assert.ok(diagrams.every((question) => /^https:\/\/commons\.wikimedia\.org\//.test(question.imageSourceUrl)), "diagram questions must link to an online source page");
  assert.ok(questions.every((question) => !["wh", "short_answer", "matching", "ordering"].includes(question.type)), "AP practice should not contain open-ended short answers");
  assert.ok(questions.some((question) => question.type === "cloze" && String(question.difficulty).toLowerCase() === "hard"), "AP practice should retain challenging fill-in-the-blank questions");
  assert.ok(questions.every((question) => !/\bUnit\s+\d+\b/i.test(question.prompt)), "organizational labels must not leak into questions");
  const psychologyCards = collection.units.flatMap((unit) => unit.cards || []);
  const nightTerrors = psychologyCards.find((card) => card.front.toLowerCase() === "night terrors");
  assert.match(nightTerrors?.back || "", /deep NREM-3 sleep/i, "night-terrors card should preserve the sleep-stage fact");
  assert.ok(psychologyCards.every((card) => !/\b(?:Stage|age|about|within|from)\s{2,}/i.test(card.back)), "psychology definitions should not contain gaps left by removed numbers");
  assert.ok(psychologyCards.every((card) => !/\s[1-9]\.(?:\s|$)/.test(card.back)), "PDF layout markers should not leak into psychology definitions");
});

test("AP Physics content depth varies appropriately by numbered topic", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "ap-physics-data.js"), "utf8"), context);
  const globals = [
    "AP_PHYSICS_1_DECKS",
    "AP_PHYSICS_2_DECKS",
    "AP_PHYSICS_C_MECHANICS_DECKS",
    "AP_PHYSICS_C_ELECTRICITY_MAGNETISM_DECKS",
  ];
  for (const globalName of globals) {
    const units = context.window[globalName];
    const topics = units.flatMap((unit) => unit.subtopics || []);
    const cards = units.flatMap((unit) => unit.cards || []);
    assert.ok(topics.length >= 30, `${globalName} should expose the full numbered topic list`);
    assert.ok(topics.every((topic) => /^\d+\.\d+\s/.test(topic.label)), `${globalName} topics should retain official numbering in navigation`);
    assert.ok(topics.every((topic) => topic.cards.length >= 2 && topic.cards.length <= 3), `${globalName} should provide two or three focused flashcards per topic`);
    assert.ok(new Set(topics.map((topic) => topic.cards.length)).size > 1, `${globalName} card depth should vary by topic`);
    assert.ok(topics.every((topic) => topic.questions.length >= 6 && topic.questions.length <= 8), `${globalName} should provide six to eight substantive questions per topic`);
    assert.ok(topics.every((topic) => topic.questions.filter((question) => /\d/.test(`${question.prompt} ${question.stimulus || ""}`)).length >= 4), `${globalName} topics should emphasize concrete quantitative problems`);
    assert.ok(topics.every((topic) => ["Easy", "Medium", "Hard"].every((difficulty) => topic.questions.some((question) => question.difficulty === difficulty))), `${globalName} topics should mix easy, medium, and hard practice`);
    assert.ok(topics.flatMap((topic) => topic.questions).every((question) => !/strongest physics-based|most defensible next step|changes two independent variables|modeling check/i.test(`${question.prompt} ${question.stimulus || ""}`)), `${globalName} should not contain generic equation-selection prompts`);
    assert.ok(cards.every((card) => !/\bUnit\s+\d+\b/i.test(`${card.front} ${card.back}`)), `${globalName} card content should not include unit labels`);
    assert.ok(topics.flatMap((topic) => topic.questions).every((question) => !/\bUnit\s+\d+\b/i.test(`${question.prompt} ${question.answer}`)), `${globalName} question content should not include unit labels`);
  }
  const torqueWork = context.window.AP_PHYSICS_1_DECKS.flatMap((unit) => unit.subtopics).find((topic) => /Torque and Work/.test(topic.label));
  assert.ok(torqueWork.questions.some((question) => /12 N·m turns a shaft through 3\.0 rad/.test(question.prompt)), "torque-and-work practice should include a real calculation");
  const allPhysicsQuestions = globals.flatMap((globalName) => context.window[globalName].flatMap((unit) => unit.subtopics || []).flatMap((topic) => topic.questions));
  const diagramQuestions = allPhysicsQuestions.filter((question) => question.image);
  assert.ok(diagramQuestions.length >= 4, "physics should include several diagram-dependent questions");
  assert.ok(diagramQuestions.every((question) => /^https:\/\/upload\.wikimedia\.org\//.test(question.image)), "physics diagrams should load from online Wikimedia originals");
  assert.ok(diagramQuestions.every((question) => /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(question.imageSourceUrl)), "physics diagrams should link to their public source page");
  assert.ok(allPhysicsQuestions.some((question) => /Atwood machine/i.test(question.prompt)), "physics should include an Atwood-machine calculation");
  assert.ok(allPhysicsQuestions.some((question) => /30° incline/i.test(question.prompt)), "physics should include an inclined-plane calculation");
  for (const globalName of ["AP_PHYSICS_1_DECKS", "AP_PHYSICS_C_MECHANICS_DECKS"]) {
    const questions = context.window[globalName].flatMap((unit) => unit.subtopics || []).flatMap((topic) => topic.questions);
    assert.equal(questions.filter((question) => /Atwood machine/i.test(question.prompt)).length, 1, `${globalName} should not repeat the Atwood-machine problem across dynamics topics`);
    assert.equal(questions.filter((question) => /30° incline/i.test(question.prompt)).length, 1, `${globalName} should keep the ramp problem in the friction topic only`);
  }
  const mechanicsCenterOfMass = context.window.AP_PHYSICS_C_MECHANICS_DECKS.flatMap((unit) => unit.subtopics).find((topic) => /Systems and Center of Mass/.test(topic.label));
  assert.ok(mechanicsCenterOfMass.questions.filter((question) => /∫/.test(`${question.prompt} ${question.answer}`)).length >= 2, "AP Physics C center-of-mass practice should require integration");
  assert.ok(mechanicsCenterOfMass.questions.filter((question) => question.type === "stimulus_mcq").length >= 2, "AP Physics C should include contextual AP-style word problems");
  assert.ok(Object.values(context.window.AP_PHYSICS_CONTENT_DIAGNOSTICS).every((diagnostic) => diagnostic.unmatchedProfiles.length === 0), "every AP Physics topic should use a subject-specific content profile");
});

test("AP Calculus uses real derivative, integral, related-rates, and BC practice", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "apcalculus-data.js"), "utf8"), context);
  const questionsFor = context.window.AP_CALCULUS_QUESTIONS_FOR_TOPIC;
  assert.equal(typeof questionsFor, "function");
  const derivatives = questionsFor("2.3", "Differentiating Polynomial Functions");
  const relatedRates = questionsFor("4.5", "Solving Related Rates Problems");
  const integrals = questionsFor("6.4", "The Fundamental Theorem of Calculus");
  const series = questionsFor("10.12", "Lagrange Error Bound");
  assert.ok(derivatives.length >= 4 && derivatives.some((question) => /Differentiate|derivative/i.test(question.prompt)), "calculus should ask students to calculate derivatives");
  assert.ok(relatedRates.length >= 4 && relatedRates.some((question) => /sphere/i.test(question.prompt)) && relatedRates.some((question) => /ladder/i.test(question.prompt)) && relatedRates.some((question) => /cone/i.test(question.prompt)), "related-rates practice should contain varied real setups");
  assert.ok(integrals.length >= 5 && integrals.some((question) => /∫/.test(question.prompt)), "calculus should ask students to evaluate and interpret integrals");
  assert.ok(series.length >= 6 && series.every((question) => question.courseLevel === "BC"), "BC topics should include a substantial BC-only question bank");
  assert.ok([...derivatives, ...relatedRates, ...integrals, ...series].some((question) => question.difficulty === "Hard"), "calculus should include AP-level multi-step questions");
  assert.ok([...derivatives, ...relatedRates, ...integrals, ...series].every((question) => !/Which concept best matches this description/i.test(question.prompt)), "calculus should not fall back to generic definition prompts");
  assert.match(app, /collection\.id === "apcalculus"/);
  assert.match(app, /AP_CALCULUS_QUESTIONS_FOR_TOPIC/);
});

test("AP Chemistry uses quantitative and laboratory-style practice across every topic", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "ap-ced-topic-data.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(dist, "apchem-questions.js"), "utf8"), context);
  const questionsFor = context.window.AP_CHEMISTRY_QUESTIONS_FOR_TOPIC;
  assert.equal(typeof questionsFor, "function");
  const topics = Object.values(context.window.AP_CED_TOPIC_MAP.courses.apchem.units).flat();
  assert.ok(topics.length >= 90, "expected the full AP Chemistry topic list");
  const topicQuestions = topics.map((topic) => ({ topic, questions: questionsFor(topic.number, topic.title) }));
  assert.ok(topicQuestions.every(({ questions }) => questions.length >= 4), "every chemistry topic should have at least four substantive questions");
  assert.ok(topicQuestions.every(({ questions }) => questions.some((question) => question.difficulty === "Hard")), "every chemistry topic should include hard practice");
  assert.ok(topicQuestions.every(({ questions }) => questions.every((question) => question.options.length === 4 && question.options.includes(question.answer))), "chemistry multiple-choice questions should have four valid options");
  const allQuestions = topicQuestions.flatMap(({ questions }) => questions);
  assert.ok(allQuestions.some((question) => question.type === "stimulus_mcq"), "chemistry should include laboratory and experimental scenarios");
  assert.ok(allQuestions.some((question) => /moles|molar mass/i.test(question.prompt)), "chemistry should include mole calculations");
  assert.ok(allQuestions.some((question) => /rate law|half-life/i.test(question.prompt)), "chemistry should include kinetics calculations");
  assert.ok(allQuestions.some((question) => /equilibrium|\bKsp\b|\bQ < K\b/i.test(question.prompt)), "chemistry should include equilibrium reasoning");
  assert.ok(allQuestions.some((question) => /pH|titration/i.test(question.prompt)), "chemistry should include acid-base calculations");
  assert.ok(allQuestions.some((question) => /cell|electrolysis|Faraday/i.test(question.prompt)), "chemistry should include electrochemistry calculations");
  assert.ok(allQuestions.every((question) => !/Which concept best matches this description/i.test(question.prompt)), "chemistry should not use generic definition prompts");
  assert.match(app, /collection\.id === "apchem"/);
  assert.match(app, /AP_CHEMISTRY_QUESTIONS_FOR_TOPIC/);
});

test("priority AP and every IB course use validated exam-style question banks", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, "exam-practice-data.js"), "utf8"), context);
  const banks = context.window.YSB_AP_EXAM_PRACTICE;
  const expectedUnits = {
    apstats: 5, apprecalculus: 4, apmicro: 6, apmacro: 6, apcsp: 5, apmusic: 8, aplatin: 6,
    apush: 9, apworld: 9, apeuro: 9, apgov: 5,
    ibbio: 4, ibchem: 6, ibpsych: 5, ibecon: 5, ibgeo: 5, ibess: 6, ibmathaa: 5, ibhistamer: 7,
  };
  for (const [course, unitCount] of Object.entries(expectedUnits)) {
    assert.equal(Object.keys(banks[course] || {}).length, unitCount, `${course} should cover every course subdivision`);
    const questions = Object.values(banks[course]).flat();
    assert.ok(questions.length >= unitCount * 2, `${course} should have at least two authored questions per subdivision`);
    assert.ok(questions.every((question) => ["mcq", "stimulus_mcq"].includes(question.type)), `${course} should use supported practice formats`);
    assert.ok(questions.every((question) => question.options.length === 4 && question.options.includes(question.answer)), `${course} answers must be valid choices`);
    assert.ok(questions.every((question) => question.explanation && question.explanation.length >= 20), `${course} should explain every answer`);
    assert.equal(new Set(questions.map((question) => question.prompt)).size, questions.length, `${course} should not repeat prompts`);
    assert.ok(questions.every((question) => !/Which concept best matches this description|A learner encounters the following description/i.test(`${question.prompt} ${question.stimulus || ""}`)), `${course} should not use definition-conversion filler`);
  }
  const fakeIb = Object.fromEntries(Object.entries(expectedUnits).filter(([course]) => course.startsWith("ib")).map(([course]) => [course, Object.keys(banks[course]).map((id) => ({ id, questions: [] }))]));
  context.window.YSB_ATTACH_IB_EXAM_PRACTICE(fakeIb);
  assert.ok(Object.values(fakeIb).flat().every((unit) => unit.questions.length >= 2), "every IB subdivision should receive practice questions");
  assert.match(app, /dedicatedExamQuestionsForUnit/);
  assert.match(app, /dedicatedQuestions\.length \? \[\] : buildApTopicQuestions/);
  assert.match(app, /custom-question-explanation/);
});

test("question builder exposes expanded practice formats", () => {
  for (const type of ["mcq", "multiple_select", "stimulus_mcq", "diagram_label", "true_false", "cloze", "essay"]) {
    assert.match(html, new RegExp(`value="${type}"`), `missing ${type} question option`);
  }
  for (const type of ["wh", "short_answer", "matching", "ordering"]) {
    assert.doesNotMatch(html, new RegExp(`value="${type}"`), `${type} should not be offered`);
  }
  assert.match(html, /id="manual-question-image-preview"/);
  assert.match(html, /data-choose-manual-question-image/);
  assert.match(html, /data-draw-manual-question/);
  assert.match(html, /data-math-manual-question="question"/);
  assert.match(html, /data-code-manual-question="question"/);
  assert.doesNotMatch(html, /id="manual-question-image-source"/);
  assert.doesNotMatch(html, />Online image URL</);
  assert.match(html, /id="manual-essay-type"/);
  assert.match(html, /id="manual-question-sources"/);
  assert.match(html, /id="manual-essay-minutes"/);
  assert.match(html, /id="manual-question-choice-editor"/);
  assert.match(html, /id="manual-question-choice-list"/);
  assert.match(html, /id="add-manual-question-choice"/);
  assert.ok(html.indexOf('id="manual-question-stimulus-field"') < html.indexOf('id="manual-question-choice-editor"'), "stimulus should be visible with the question, before its answer choices");
  assert.match(app, /function isAnswerChoiceQuestion\(type\)/);
  assert.match(app, /type === "mcq" \|\| type === "multiple_select"/);
  assert.match(app, /data-question-choice-correct/);
  assert.match(app, /manualQuestionCorrectChoiceIndexes = new Set\(\[0\]\)/);
  assert.match(app, /Mark every correct answer/);
  assert.match(app, /class="draft-question-stimulus" data-question-stimulus/);
  assert.match(styles, /\.manual-question-grid \{[^}]*grid-template-columns: minmax\(0,1\.15fr\) minmax\(0,1fr\) 150px/);
  assert.match(app, /class="custom-question-stimulus"/);
  assert.match(app, /closestTopicCards\(topic\.title, unitCards\)/);
  assert.match(app, /closest\("\.custom-study-option-card"\)\.hidden = false/);
});

test("question practice renders as one scrollable worksheet", () => {
  assert.match(html, /id="custom-question-scroll-list"/);
  assert.match(html, /data-finish-question-scroll/);
  assert.doesNotMatch(html, /id="custom-question-(?:previous|next)"/);
  assert.doesNotMatch(html, /id="check-custom-question"/);
  assert.match(app, /function renderCustomQuestionPractice\(\)/);
  assert.match(app, /data-scroll-question-choice/);
  assert.match(app, /function answerScrollQuestion\(index, response\)/);
  assert.doesNotMatch(app, /question\.difficulty \? ` ·/);
  assert.doesNotMatch(app, /moveCustomQuestion/);
  assert.match(html, /id="selected-custom-question-mode"/);
  assert.match(html, /id="custom-essay-prompt"/);
  assert.doesNotMatch(html, /id="custom-essay-prompt-search"/);
  assert.match(html, /id="custom-essay-prompt-filters"/);
  assert.match(html, /id="custom-essay-prompt-list"/);
  assert.match(html, /id="custom-essay-timer-enabled"/);
  assert.match(html, /id="custom-essay-practice"/);
  assert.match(app, /function renderEssayPromptPicker\(\)/);
  assert.match(app, /data-essay-prompt-filter/);
  assert.match(app, /data-essay-prompt-id/);
  assert.match(app, /function renderCustomEssayPractice\(question\)/);
});

test("flashcard study offers classic, scroll, and retryable matching modes", () => {
  assert.match(html, /id="start-custom-flashcards"/);
  assert.match(html, /id="selected-custom-flashcard-mode"/);
  assert.match(html, /id="previous-custom-flashcard-mode"/);
  assert.match(html, /id="next-custom-flashcard-mode"/);
  assert.doesNotMatch(html, /id="custom-flashcard-mode-view"/);
  assert.match(app, /const CUSTOM_FLASHCARD_MODES = \[/);
  assert.match(app, /id: "regular", label: "Classic"/);
  assert.match(app, /id: "scroll"/);
  assert.match(app, /id: "matching"/);
  assert.match(app, /function moveCustomFlashcardMode\(direction\)/);
  assert.match(app, /startCustomReview\(state\.customFlashcardModeSelector\)/);
  assert.match(html, /id="custom-flashcard-scroll-list"/);
  assert.match(html, /id="custom-matching-submit"/);
  assert.match(app, /function renderCustomFlashcardScroll\(\)/);
  assert.match(app, /function submitCustomMatching\(\)/);
  assert.match(html, /id="custom-matching-bank"/);
  assert.match(app, /draggable="true" data-matching-tile/);
  assert.match(app, /function placeMatchingTile\(rowIndex, answerIndex\)/);
  assert.match(app, /practice\.ondragstart/);
  assert.match(app, /practice\.ondrop/);
  assert.match(app, /function markCustomMatchingExpandableTiles\(bank\)/);
  assert.match(app, /text\.scrollHeight > text\.clientHeight \+ 1/);
  assert.match(app, /practice\.ondblclick/);
  assert.match(app, /tile\.classList\.toggle\("expanded", expanded\)/);
  assert.match(app, /handleCustomMatchingClick\(target\)/);
  assert.match(app, /tileZone && practice\.dataset\.selectedAnswer !== ""/);
  assert.match(app, /const destination = drop \|\| \(row \? \$\("\[data-matching-drop\]", row\) : null\)/);
  assert.match(app, /practice\.classList\.toggle\("tile-selected", !selected\)/);
  assert.match(app, /row\.classList\.toggle\("correct", correct\)/);
  assert.match(app, /row\.classList\.toggle\("incorrect", !correct\)/);
  assert.match(app, /tile\.draggable = false/);
  assert.match(app, /tile\.disabled = true/);
  assert.match(styles, /\.custom-matching-list \{[^}]*grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.custom-review-shell:has\(#custom-matching-practice:not\(\[hidden\]\)\) \{[^}]*max-width: none/);
  assert.match(styles, /\.custom-matching-tile \{[^}]*height: 124px;[^}]*min-height: 124px/);
  assert.doesNotMatch(styles, /matching-tile-(?:short|medium|long)/);
  assert.match(styles, /\.custom-matching-bank > \.custom-matching-tile\.expanded \{[^}]*grid-column: 1 \/ -1/);
});

test("AP topic picker uses compact three-column topics with full hover names", () => {
  assert.match(styles, /\.built-in-topic-grid \{[^}]*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.built-in-topic-choice strong \{[^}]*-webkit-line-clamp: 2/);
  assert.match(app, /<strong title="\$\{escapeHtml\(topic\.label\)\}">\$\{escapeHtml\(topic\.label\)\}<\/strong>/);
});

test("personal study sets support editable units and subtopics", () => {
  assert.match(html, /id="custom-topic-builder-heading"/);
  assert.match(html, /id="add-custom-unit"/);
  assert.match(html, /id="active-custom-topic"/);
  assert.match(html, /id="custom-topic-picker"/);
  assert.match(app, /function normalizedCustomUnits\(units\)/);
  assert.match(app, /function renderCustomUnitBuilder\(\)/);
  assert.match(app, /function renderCustomTopicPicker\(deck\)/);
  assert.match(app, /customTopicId: state\.activeCustomTopicId \|\| ""/);
  assert.match(app, /units: normalizedCustomUnits\(state\.customUnits\)/);
  assert.match(app, /cards: personalDeck\.cards\.filter\(included\)/);
  assert.match(app, /injectDraftTopicSelectors\(list, state\.customDraft\)/);
  assert.match(html, /id="draft-view-unit"/);
  assert.match(html, /id="draft-view-topic"/);
  assert.match(app, /function renderCustomDraftViewControls\(\)/);
  assert.match(app, /function customDraftVisibleRecords\(\)/);
  assert.match(app, /state\.draftViewTopicId/);
  assert.match(app, /visibleRecords\.map\(\(\{ card, index \}\)/);
  assert.match(styles, /\.draft-view-filters \{[^}]*grid-template-columns:/);
});

test("built-in and community originals are locked while copies preserve editable subdivisions", () => {
  assert.match(styles, /\.draft-card-row\.has-draft-topic \.draft-topic-field \{[^}]*grid-column: 2 \/ 4;[^}]*grid-row: 1;/);
  assert.match(app, /function builtInEditorSubdivisionStructure\(collection\)/);
  assert.match(app, /function isIbCourseCollection\(collection\)/);
  assert.match(app, /function copyableBuiltInStudySet\(collection\)/);
  assert.match(app, /units: subdivisionStructure\.units/);
  assert.match(app, /customTopicId: assignedTopicId\(card, unit\)/);
  assert.match(app, /units: normalizedCustomUnits\(JSON\.parse\(JSON\.stringify\(source\.units \|\| \[\]\)\)\)/);
  assert.match(app, /readOnlySource: "community"/);
  assert.match(app, /units: normalizedCustomUnits\(payload\.units\)/);
  assert.match(app, /Make a copy before editing this community set/);
  assert.match(app, /Curated sets cannot be edited\. Make a copy first/);
  assert.doesNotMatch(app, /data-edit-built-in-collection=/);
});

test("question editor supports pasted images, drawing, math, and code", () => {
  assert.match(app, /target\.kind === "manual-question"/);
  assert.match(app, /target\.kind === "question-draft"/);
  assert.match(app, /handleCardPaste\(event, \{ kind: "manual-question", side: "question" \}\)/);
  assert.match(app, /data-draw-question/);
  assert.match(app, /data-math-question-side/);
  assert.match(app, /data-code-question-side/);
  assert.ok(app.includes('/^data:image\\/(?:png|jpeg|webp|gif);base64,'));
  assert.match(app, /studyTextHtml\(question\.prompt\)/);
});

test("fill-in-the-blank conversion uses concise sentence-cased definitions", () => {
  const definitionSource = app.slice(app.indexOf("function questionDefinitionExcerpt"), app.indexOf("function deterministicChoices"));
  const clozeSource = app.slice(app.indexOf("function typedQuestionAsCloze"), app.indexOf("function questionTypeSelectOptions"));
  const context = { cardTopic: (card) => card.front };
  vm.createContext(context);
  vm.runInContext(`${definitionSource}\n${clozeSource}\nthis.typedQuestionAsCloze = typedQuestionAsCloze;`, context);
  const malformed = context.typedQuestionAsCloze({
    type: "cloze",
    prompt: "absolute threshold is described as The minimum stimulation needed to detect a stimulus. The related concept described as Act or state of adjustment or adaptation, changes in shape of the ocular lens for various focal distances. is _____.",
    answer: "accommodation",
  });
  assert.equal(malformed.prompt, "Act or state of adjustment or adaptation, changes in shape of the ocular lens for various focal distances. The term is _____.");
  assert.doesNotMatch(malformed.prompt, /absolute threshold|related concept described/i);
  const converted = context.typedQuestionAsCloze({ type: "short_answer", prompt: "What is neuroplasticity?", answer: "A long answer" }, {
    front: "neuroplasticity",
    back: "the brain's ability to reorganize by forming new neural connections. This second sentence contains extra details that should not be copied into the question.",
  });
  assert.equal(converted.prompt, "The brain's ability to reorganize by forming new neural connections. The term is _____.");
  assert.equal(converted.answer, "neuroplasticity");
  assert.ok(converted.prompt.length < 170);
});

test("study content does not use part-number card labels", () => {
  const dataFiles = fs.readdirSync(dist).filter((file) => /(?:data|expansion|enrichment)\.js$/.test(file));
  const offenders = [];
  for (const file of dataFiles) {
    const source = fs.readFileSync(path.join(dist, file), "utf8");
    if (/\b(?:front|back)\s*:\s*["'`]\s*(?:part\s+[123]|unit\s+\d+)\b/i.test(source)) offenders.push(file);
  }
  assert.deepEqual(offenders, [], `organizational labels leaked into cards: ${offenders.join(", ")}`);
});

test("complete study-set export includes every generated item type", () => {
  assert.match(html, /value="json"[\s\S]{0,180}Cards, questions, and Feynman prompts/i);
  assert.match(app, /type: "study-set"/);
  assert.match(app, /questions: deck\.questions \|\| \[\]/);
  assert.match(app, /feynmanPrompts: deck\.feynmanPrompts \|\| \[\]/);
});

test("portable user backups can be exported and restored", () => {
  for (const id of ["export-user-information", "restore-user-information", "restore-user-information-file"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(app, /function portableUserData\(/);
  assert.match(app, /async function restoreUserInformation\(/);
  assert.match(app, /This is not a valid Your Study Buddy backup/);
  assert.match(app, /desktopApp\?\.exportUserData/);
  assert.match(main, /async function exportUserBackup\(/);
  assert.match(main, /fs\.writeFileSync\(result\.filePath/);
  assert.match(main, /The saved backup could not be verified/);
  assert.match(preload, /exportUserData\(payload\)/);
  assert.match(app, /messageHandlers\?\.userDataExport/);
  assert.match(app, /resolveNativeUserDataExport/);
  assert.match(app, /nativeFilePickerPurpose = "restore-backup"/);
  assert.match(main, /ipcMain\.handle\("user-data:export"/);
  const nativeMac = fs.readFileSync(path.join(root, "macOS", "StudyDeskApp.swift"), "utf8");
  assert.match(nativeMac, /Restore Your Study Buddy backup/);
  assert.match(nativeMac, /Choose a Your Study Buddy JSON backup/);
  assert.match(nativeMac, /restoringBackup \? \[\.json\] : \[\.item\]/);
});

test("generator avoids malformed generic questions", () => {
  assert.doesNotMatch(app, /`Describe what \$\{embeddedSubject\(match\[1\]\)\}/);
  assert.doesNotMatch(app, /`_____ is \$\{card\.back/);
  assert.doesNotMatch(app, /`What is the significance of \$\{topic\}\?`/);
  assert.match(app, /What does \$\{relationshipSubject\(match\[1\]\)/);
});

test("PDF annotation engine is loaded only when a PDF note is opened", () => {
  assert.doesNotMatch(html, /<script src="\.\/pdf-annotation\.bundle\.js"><\/script>/);
  assert.match(app, /function ensurePdfAnnotationLoaded\(/);
  assert.match(app, /await ensurePdfAnnotationLoaded\(\)/);
});

test("large standalone study banks use summary-first loading", () => {
  for (const file of ["sat-vocabulary-data.js", "mcat-review-data.js", "mcat-biochem-expansion.js", "usmle-data.js", "usmle-expansion.js", "admissions-exam-data.js"]) {
    assert.doesNotMatch(html, new RegExp(`<script src="\\./${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"></script>`), `${file} should not block startup`);
  }
  assert.match(app, /const lazyBuiltInSources =/);
  assert.match(app, /async function ensureBuiltInCollectionLoaded\(/);
  assert.match(app, /requestAnimationFrame\(\(\) => window\.setTimeout\(hydrateAddedCollections/);
  assert.match(html, /<script src="\.\/app\.bundle\.js\?v=20261025-spacing16"><\/script>/);
  assert.equal((html.match(/<script\s+src=/g) || []).length, 1, "the startup shell should make one JavaScript request");
});

test("Create workspace gives the question editor the full available width", () => {
  assert.match(styles, /\.create-page \{ width: min\(1720px, 100%\); max-width: none;/);
  assert.match(styles, /\.create-layout \{[^}]*grid-template-columns: minmax\(0, 1fr\) clamp\(240px, 17vw, 290px\)/);
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.create-layout \{ grid-template-columns: 1fr; \}/);
});

test("notes export to PDF and open canvases round-trip through editable YSB files", () => {
  assert.match(app, /async function createNotePdf\(/);
  assert.match(app, /function pdfFromJpegs\(/);
  assert.match(app, /value: "ysb"/);
  assert.match(app, /note\?\.type === "word" \|\| note\?\.pageLayout === "document"\) return \[\{ value: "pdf"/);
  assert.match(app, /type: "editable-note"/);
  assert.match(app, /async function createImportedEditableNotebookNote\(/);
  assert.match(app, /viewport: \{ zoom:/);
  assert.match(html, /accept="\.ysb,/);
  assert.doesNotMatch(app, /ysbnote/);
  assert.doesNotMatch(app, /setDrawingNoteZoom\(1, true\)/);
});

test("PowerPoint notes retain their slideshow source, slide pages, and PPTX export", () => {
  const nativeMac = fs.readFileSync(path.join(root, "macOS", "StudyDeskApp.swift"), "utf8");
  assert.match(app, /async function createImportedPowerPointNotebookNote\(/);
  assert.match(app, /sourceFormat: "pptx"/);
  assert.match(app, /pptxAssetId: assetId/);
  assert.match(app, /PowerPoint · Original slideshow/);
  assert.match(app, /PDF · Slides with annotations/);
  assert.match(main, /"pptx", "ysb"/);
  assert.match(nativeMac, /"pptx", "ysb"/);
});

test("visible product polish keeps summaries accurate and controls readable", () => {
  assert.match(html, /id="dashboard-study-set-count"/);
  assert.match(html, /Feynman prompts where available/);
  assert.match(app, /Math\.max\(Number\(estimate\?\.usage\) \|\| 0, measuredLocalBytes\)/);
  assert.match(app, /note\.noteTemplate === "cornell"\) return "Cornell note"/);
  assert.match(app, /async function hydrateCuratedQuestionCounts\(\)/);
  assert.match(styles, /\.custom-topic-empty \{ display: grid; gap: 4px; line-height: 1\.5; \}/);
  assert.match(app, /Log in to sync/);
  assert.match(styles, /\.saved-decks \{ order: 0; \}/);
  assert.match(styles, /\.create-content-tabs \{ position: sticky;/);
  assert.match(styles, /Keep secondary controls readable/);
});

test("Community exam summaries match their complete dependency-aware banks", () => {
  const context = vm.createContext({ window: {} });
  for (const file of [
    "appsych-data.js", "apbiology-data.js", "apchem-data.js", "ap-physics-data.js",
    "apstats-data.js", "apprecalculus-data.js", "ib-diploma-data.js",
    "ib-course-crosswalk.js", "ib-math-aa-data.js", "mcat-review-data.js",
    "mcat-biochem-expansion.js", "usmle-data.js", "usmle-expansion.js",
    "admissions-exam-data.js",
  ]) vm.runInContext(fs.readFileSync(path.join(dist, file), "utf8"), context);

  const cardCount = (key) => context.window[key].reduce((total, unit) => total + (unit.cards || []).length, 0);
  assert.equal(cardCount("MCAT_REVIEW_DECKS"), 1321);
  assert.equal(cardCount("USMLE_DECKS"), 1181);
  assert.equal(cardCount("DAT_DECKS"), 984);
  assert.match(app, /mcat: \{ scripts: \["mcat-review-data\.js", "mcat-biochem-expansion\.js"\], global: "MCAT_REVIEW_DECKS", unitCount: 14, cardCount: 1321, feynmanCount: 139 \}/);
  assert.match(app, /usmle: \{ scripts: \["mcat-review-data\.js", "mcat-biochem-expansion\.js", "usmle-data\.js", "usmle-expansion\.js"\], global: "USMLE_DECKS", unitCount: 12, cardCount: 1181, feynmanCount: 24 \}/);
  assert.match(app, /dat: \{ scripts: \["mcat-review-data\.js", "mcat-biochem-expansion\.js", "admissions-exam-data\.js"\], global: "DAT_DECKS", unitCount: 6, cardCount: 984, feynmanCount: 0 \}/);
  for (const unit of context.window.DAT_DECKS) {
    const fronts = unit.cards.map((card) => String(card.front || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
    assert.equal(new Set(fronts).size, fronts.length, `${unit.shortName} contains duplicate card fronts`);
  }
});

test("Community mini decks are focused, subdivided, and stay below 40 cards", () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(dist, "community-mini-decks-data.js"), "utf8"), context);
  const collections = context.window.COMMUNITY_MINI_COLLECTIONS;
  assert.ok(Array.isArray(collections));
  assert.ok(collections.length >= 6);
  const ids = new Set();
  for (const collection of collections) {
    assert.ok(!ids.has(collection.id), `duplicate mini-deck id: ${collection.id}`);
    ids.add(collection.id);
    assert.ok(collection.units.length >= 2, `${collection.name} should preserve useful subdivisions`);
    const cards = collection.units.flatMap((unit) => unit.cards || []);
    assert.ok(cards.length > 0 && cards.length < 40, `${collection.name} must contain 1–39 cards`);
    assert.equal(new Set(cards.map((card) => card.id)).size, cards.length, `${collection.name} contains duplicate card ids`);
    assert.ok(cards.every((card) => String(card.front || "").trim() && String(card.back || "").trim()), `${collection.name} contains an empty card`);
  }
  assert.match(fs.readFileSync(path.join(root, "tools", "browser-bundle-sources.json"), "utf8"), /community-mini-decks-data\.js/);
  for (const collection of collections) assert.match(app, new RegExp(`collectionId: "${collection.id}"`));
});

test("Amino-acid community deck contains all 20 standard amino acids with sourced structures", () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(dist, "community-mini-decks-data.js"), "utf8"), context);
  const collection = context.window.COMMUNITY_MINI_COLLECTIONS.find((item) => item.id === "mini-amino-acids");
  assert.ok(collection, "amino-acid community deck is missing");
  const cards = collection.units.flatMap((unit) => unit.cards || []);
  assert.equal(cards.length, 20);
  assert.ok(cards.every((card) => /^\.\/mcat-images\/[a-z-]+\.png$/.test(card.backImage || "")), "every amino acid should have a structure image");
  assert.ok(cards.every((card) => /PubChem/.test(card.imageCredit || "")), "every amino-acid structure should credit PubChem");
  for (const card of cards) assert.ok(fs.existsSync(path.join(dist, card.backImage.replace(/^\.\//, ""))), `${card.backImage} is missing`);
  assert.match(app, /function previewItemImage\(/);
  assert.match(app, /image: card\.backImage/);
  assert.match(styles, /\.deck-preview-image img/);
});

test("MCAT biochemistry uses credited public-source pathway diagrams", () => {
  for (const file of ["biochemistry-glycolysis.svg", "biochemistry-citric-acid-cycle.svg", "biochemistry-electron-transport-chain.svg"]) {
    assert.ok(fs.existsSync(path.join(dist, "science-diagrams", file)), `${file} is missing`);
  }
  const credits = fs.readFileSync(path.join(dist, "science-diagrams", "CREDITS.md"), "utf8");
  assert.match(credits, /Glycolysis overview\.svg/);
  assert.match(credits, /Citric acid cycle\.svg/);
  assert.match(credits, /Electron transport chain\.svg/);
  assert.match(fs.readFileSync(path.join(dist, "mcat-biochem-expansion.js"), "utf8"), /biochemistry-glycolysis\.svg/);
});

test("MCAT source-page markers do not leak into study text", () => {
  const context = vm.createContext({ window: {} });
  for (const file of ["apbiology-data.js", "apchem-data.js", "appsych-data.js", "mcat-review-data.js", "mcat-biochem-expansion.js"]) {
    vm.runInContext(fs.readFileSync(path.join(dist, file), "utf8"), context);
  }
  const cards = context.window.MCAT_REVIEW_DECKS.flatMap((deck) => deck.cards || []);
  assert.ok(cards.length > 1000, "the complete MCAT bank should contain more than 1,000 cards");
  assert.ok(cards.every((card) => !/\s+[1-9]\.\s*$/.test(card.front) && !/\s+[1-9]\.\s*$/.test(card.back)), "trailing source-page markers must be removed");
});

test("damaged personal data is preserved before reset", () => {
  assert.match(app, /function preserveCorruptLocalData\(/);
  assert.match(app, /recovery-/);
  assert.doesNotMatch(app, /catch \{\s*localStorage\.removeItem\(CUSTOM_DECKS_KEY\)/);
});

test("settings exposes storage health and recovery diagnostics", () => {
  for (const id of ["storage-health-title", "storage-health-label", "storage-health-detail", "storage-meter-fill", "storage-diagnostics", "refresh-storage-health"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(app, /async function renderStorageHealth\(/);
  assert.match(app, /Recovery copies:/);
  assert.match(app, /warnIfLocalPayloadLarge/);
});

test("software updates are connected on Electron and native macOS", () => {
  assert.match(app, /messageHandlers\?\.appUpdateCheck/);
  assert.match(app, /resolveNativeAppUpdate/);
  assert.match(main, /ipcMain\.handle\("app-update:check"/);
  const nativeMac = fs.readFileSync(path.join(root, "macOS", "StudyDeskApp.swift"), "utf8");
  assert.match(nativeMac, /configuration\.userContentController\.add\(self, name: "appUpdateCheck"\)/);
  assert.match(nativeMac, /api\.github\.com\/repos\/vkai3333\/Your-Study-Buddy-\/releases/);
});

test("large deck searches are debounced", () => {
  assert.match(app, /function debounce\(/);
  assert.match(app, /my-study-sets-search"\)\.addEventListener\("input", debounce\(renderCustomDecks\)/);
  assert.match(app, /built-in-study-search"\)\.addEventListener\("input", debounce/);
});

test("generator preserves relationships in comparison tables", () => {
  const generate = generatorHarness();
  const cards = generate(`Functional Group | General Formula | Characteristic Reaction\n--- | --- | ---\nAlkene | C=C | Addition reactions\nAlcohol | R-OH | Oxidation and substitution`);
  const alkene = cards.find((card) => card.front === "Alkene");
  assert.ok(alkene, "expected a card for the alkene table row");
  assert.match(alkene.back, /General Formula: C=C/);
  assert.match(alkene.back, /Characteristic Reaction: Addition reactions/);
});

test("generator rejects incomplete extracted fragments", () => {
  const generate = generatorHarness();
  const cards = generate(`Energy flow includes\nValid concept: A complete and useful explanation.\nBecause this fragment began on another slide.`);
  assert.ok(cards.some((card) => card.front === "Valid concept"));
  assert.ok(cards.every((card) => !/includes$/i.test(card.front) && !/^because\b/i.test(card.back)));
});

test("generator handles timeline, comparison, and relationship notes", () => {
  const generate = generatorHarness();
  const cards = generate(`In 1789, revolutionaries stormed the Bastille and transformed the political crisis.\nPrimary succession differs from secondary succession because it begins without soil.\nExponential growth produces a J-shaped curve when resources are abundant.`);
  assert.ok(cards.some((card) => card.front === "What happened in 1789?"));
  assert.ok(cards.some((card) => /How do Primary succession and secondary succession differ\?/.test(card.front)));
  assert.ok(cards.some((card) => /^What does exponential growth produce\?$/i.test(card.front)));
  assert.ok(cards.every((card) => !/What does .* produces\?/i.test(card.front)));
});

test("generator turns meaningful history headings into section overview cards", () => {
  const generate = generatorHarness();
  const cards = generate(`## 1. Key Background & Causes (Pre-1917)
- **Autocratic Rule:** Tsar Nicholas II held absolute power as part of the Romanov dynasty.
- **World War I:** Devastating losses, food shortages, inflation, and low morale pushed Russia toward collapse.

## 2. The Revolutions of 1917
### The February Revolution (March 1917)
- **Trigger:** Mass strikes, food riots, and army mutinies in Petrograd.
- **Outcome:**
  - Tsar Nicholas II abdicated, ending Romanov rule.
  - A Provisional Government took power.

### The October Revolution (November 1917)
- **Trigger:** The rise of the Soviets and Bolshevik popularity.
- **Outcome:** Armed Bolsheviks seized power and later withdrew Russia from World War I.

## 3. Russian Civil War (1918–1922)
- Reds fought a White anti-Bolshevik coalition.
- The Red Army won due to organization, central geography, and Trotsky's leadership.`);
  const byFront = new Map(cards.map((card) => [card.front, card]));
  assert.ok(byFront.has("Revolutions of 1917"));
  assert.match(byFront.get("Revolutions of 1917").back, /February Revolution/);
  assert.match(byFront.get("Revolutions of 1917").back, /October Revolution/);
  assert.ok(byFront.has("February Revolution"));
  assert.match(byFront.get("February Revolution").back, /Mass strikes|abdicated/);
  assert.ok(byFront.has("Russian Civil War"));
  assert.match(byFront.get("Russian Civil War").back, /Reds fought|Red Army won/);
  assert.ok(!byFront.has("Trigger") && !byFront.has("Outcome"));
  assert.ok(cards.every((card) => !/Outcome:;/.test(card.back)));
});

test("generator quality holds across public biology, psychology, and calculus samples", () => {
  const { generateCardsFromNotes: generateCards, supplementalQuestionsFromNotes: generateQuestions, generateQuestionsFromCards: generateAllQuestions, generateFeynmanPrompts: generateFeynman } = generatorQualityHarness();
  const samples = Object.fromEntries(generatorSamples.map((sample) => [sample.id, sample]));

  const glycolysisCards = generateCards(samples["openstax-glycolysis"].notes);
  assert.ok(glycolysisCards.some((card) => card.front === "Glycolysis"));
  assert.ok(glycolysisCards.some((card) => card.front === "Net products of glycolysis" && /two pyruvate/i.test(card.back)));
  const glycolysisQuestions = generateQuestions(samples["openstax-glycolysis"].notes);
  assert.ok(glycolysisQuestions.some((question) => question.type === "multiple_select" && /products.*glycolysis/i.test(question.prompt)));
  assert.ok(generateFeynman(samples["openstax-glycolysis"].notes, glycolysisCards).some((item) => /ATP invested.*ATP produced/i.test(item.prompt)));

  const memoryCards = generateCards(samples["openstax-memory"].notes);
  assert.ok(memoryCards.some((card) => card.front === "Three basic functions of memory"));
  assert.ok(memoryCards.some((card) => card.front === "Automatic vs. effortful processing"));
  const memoryQuestions = generateQuestions(samples["openstax-memory"].notes);
  assert.ok(memoryQuestions.some((question) => question.type === "multiple_select" && /three basic functions/i.test(question.prompt)));
  assert.ok(generateFeynman(samples["openstax-memory"].notes, memoryCards).some((item) => /encoding, storage, and retrieval/i.test(item.prompt)));

  const ratesCards = generateCards(samples["openstax-related-rates"].notes);
  assert.ok(ratesCards.some((card) => card.front === "Related rates"));
  assert.ok(ratesCards.some((card) => card.front === "Why values are substituted after differentiating"));
  assert.ok(!ratesCards.some((card) => card.front === "Limit of a function"));
  const ratesQuestions = generateQuestions(samples["openstax-related-rates"].notes);
  assert.ok(ratesQuestions.some((question) => question.type === "mcq" && /balloon/i.test(question.prompt) && /0\.0177 cm\/s/.test(question.answer)));
  const allRatesQuestions = generateAllQuestions(ratesCards, samples["openstax-related-rates"].notes);
  assert.ok(allRatesQuestions.some((question) => /only _____ differentiating/i.test(question.prompt) && question.answer === "after"));
  assert.ok(allRatesQuestions.every((question) => !/The term is _____/i.test(question.prompt)));
  const ratesPrompts = generateFeynman(samples["openstax-related-rates"].notes, ratesCards);
  assert.ok(ratesPrompts.some((item) => /related-rates workflow/i.test(item.prompt)));
  assert.ok(ratesPrompts.every((item) => !/one-sided limits?/i.test(item.prompt)));

  generatorSamples.forEach((sample) => assert.match(sample.source, /^https:\/\/(?:openstax\.org|www\.gutenberg\.org)\//));
});

test("expanded public-source generator corpus passes the reusable quality audit", () => {
  const result = spawnSync(process.execPath, [path.join(root, "tools", "audit-note-generator.cjs")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout || result.stderr);
  const audit = JSON.parse(result.stdout);
  assert.ok(audit.samples.length >= 8);
  assert.deepEqual(audit.failures, []);
  audit.samples.forEach((sample) => {
    assert.ok(sample.cards >= 3, `${sample.id} needs more cards`);
    assert.ok(sample.questions >= 3, `${sample.id} needs more questions`);
    assert.ok(sample.feynman >= 2, `${sample.id} needs more Feynman prompts`);
  });
  for (const id of ["openstax-reaction-yields", "openstax-hypothesis-testing", "openstax-haitian-revolution", "gutenberg-macbeth", "openstax-supply-demand"]) {
    assert.ok(audit.samples.some((sample) => sample.id === id), `missing audit sample ${id}`);
  }
});

test("Open Notes image controls resize reliably and delete from the upper-right", () => {
  assert.match(app, /handleGroup\.dataset\.noteImageId = imageItem\.id/);
  assert.match(app, /addHandle\("delete", imageItem\.x \+ imageItem\.width, imageItem\.y/);
  assert.match(app, /const imageControl = event\.target\.closest\?\.\("\[data-note-image-control\]"\)/);
  assert.match(app, /mode: imageControl\.dataset\.noteImageControl/);
  assert.match(app, /noteCanvasViewport\.setPointerCapture\(event\.pointerId\)/);
  assert.match(app, /const draggedWidth = localX - original\.x/);
  assert.match(app, /const projectedScale = \(draggedWidth \* original\.width \+ draggedHeight \* original\.height\)/);
  assert.match(app, /item\.x = original\.x;[\s\S]{0,80}item\.y = original\.y/);
  assert.match(app, /item\.height = item\.width \/ aspect/);
  assert.match(html, /drag corner to resize/i);
  assert.match(styles, /\.document-pasted-image[^}]+resize: horizontal/);
  assert.match(app, /figure\.style\.width = `min\(100%, \$\{width\}px\)`/);
  assert.match(app, /imageHitTarget\.setAttribute\("stroke", "none"\)/);
  assert.match(app, /imageHitTarget\.setAttribute\("fill-opacity", "0"\)/);
  assert.match(app, /hydrateDrawingImageAspectRatios\(\)/);
});

test("note images crop in place with Slides-style dotted black controls", () => {
  assert.match(html, /id="crop-note-image"/);
  assert.match(html, /id="document-crop-image"/);
  assert.doesNotMatch(html, /id="cancel-note-image-inline-crop"/);
  assert.doesNotMatch(html, /id="cancel-document-inline-crop"/);
  assert.doesNotMatch(html, /id="note-image-crop-dialog"/);
  assert.match(app, /function openNoteImageCrop\(target\)/);
  const openCropSource = app.slice(app.indexOf("function openNoteImageCrop(target)"), app.indexOf("async function cropNoteImageSource"));
  assert.doesNotMatch(openCropSource, /showModal\(/);
  assert.match(app, /function renderDocumentInlineCrop\(\)/);
  assert.match(app, /function renderCanvasInlineCrop\(\)/);
  assert.match(app, /data-canvas-crop-overlay/);
  assert.match(app, /viewport\.appendChild\(overlay\)/);
  assert.match(app, /overlay\.setPointerCapture\(event\.pointerId\)/);
  assert.match(app, /function focusCanvasImageForCrop\(imageItem, sourceFrame/);
  assert.match(app, /focusCanvasImageForCrop\(noteDrawingImages\.find/);
  assert.match(app, /dataset\.noteCropHandle = mode/);
  assert.match(app, /edge\.setAttribute\("stroke-width", String\(18 \* scale\)\)/);
  assert.match(app, /edge\.setAttribute\("pointer-events", "stroke"\)/);
  assert.match(app, /edge\.className = "document-inline-crop-edge"/);
  assert.match(styles, /\.document-inline-crop-edge\[data-note-crop-handle="n"\]/);
  assert.match(app, /function cropModeAtNormalizedPoint\(rect, point, toleranceX, toleranceY\)/);
  assert.match(app, /const cropMode = canvasCropModeAtEvent\(event\)/);
  assert.match(app, /beginNoteImageCropDrag\(event, cropMode, "canvas"\)/);
  assert.doesNotMatch(app, /beginNoteImageCropDrag\(event, cropHandle\.dataset\.noteCropHandle, "canvas"\)/);
  assert.doesNotMatch(app, /if \(croppingThisImage\) appendCanvasImageCropControls/);
  assert.match(app, /\["nw", "n", "ne", "e", "se", "s", "sw", "w"\]/);
  assert.match(app, /function cropNoteImageSource\(source, rect\)/);
  assert.match(app, /canvas\.getContext\("2d"\)\.drawImage/);
  assert.match(app, /imageItem\.src = cropped\.src/);
  assert.match(app, /imageItem\.originalSrc = target\.src/);
  assert.match(app, /imageItem\.cropRect = \{ \.\.\.rect \}/);
  assert.match(app, /target\.image\.src = cropped\.src/);
  assert.match(app, /saveDocumentImageCropMetadata\(target\.image, target\.src, rect\)/);
  assert.match(app, /sourcePreview\.className = "note-inline-crop-source"/);
  assert.match(app, /event\.detail > 1/);
  assert.match(app, /image\.addEventListener\("dblclick"/);
  assert.match(app, /imageHitTarget\.addEventListener\("dblclick"/);
  assert.match(app, /lastNoteImagePointerDown\?\.imageId === selectedImage\.id/);
  assert.match(app, /now - lastNoteImagePointerDown\.at < 430/);
  assert.match(app, /Double-click to crop/);
  assert.match(app, /if \(!event\.shiftKey\)/);
  assert.match(app, /noteImageCropState\.rect = resizedCropRect\(drag\.rect, drag\.mode, deltaX, deltaY\)/);
  assert.match(styles, /\.document-inline-crop-selection[^}]+border: 2px dashed #111/);
  assert.match(styles, /\.document-inline-crop-handle[^}]+background: #111/);
  assert.match(app, /event\.key === "Enter"/);
  assert.match(app, /event\.key === "Escape"/);
  assert.doesNotMatch(app, /textContent = "Apply crop"/);
  assert.doesNotMatch(styles, /document-inline-crop-actions/);
  assert.match(app, /cropButton\.disabled = canvasCropActive/);
  assert.match(app, /button\.disabled = !selectedDocumentImage\?\.image\?\.isConnected \|\| documentCropActive/);
  const cropPointerSource = app.slice(app.indexOf('noteCanvasViewport.addEventListener("pointerdown"'), app.indexOf('const imageControl = event.target.closest?.("[data-note-image-control]")'));
  assert.match(cropPointerSource, /event\.target\.closest\?\.\("\[data-canvas-crop-overlay\]"\)/);
  assert.match(cropPointerSource, /applyNoteImageCrop\(\)/);
  assert.match(app, /drag any dotted edge inward, then click outside the image/);
  assert.match(app, /function croppedCanvasImageFrame\(imageItem, rect\)/);
  assert.match(app, /imageItem\.width = croppedFrame\.width/);
  assert.match(app, /imageItem\.height = croppedFrame\.height/);
});

test("canvas crop trims the visible frame instead of stretching it", () => {
  const frameSource = app.slice(app.indexOf("function croppedCanvasImageFrame"), app.indexOf("async function applyNoteImageCrop"));
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${frameSource}\nthis.croppedCanvasImageFrame = croppedCanvasImageFrame;`, context);
  const result = context.croppedCanvasImageFrame({ x: 100, y: 40, width: 800, height: 400 }, { x: .25, y: .1, width: .5, height: .75 });
  assert.deepEqual({ ...result }, { x: 300, y: 80, width: 400, height: 300 });
});

test("reopening a cropped canvas image restores its original crop frame", () => {
  const helperSource = app.slice(app.indexOf("function clampCropValue"), app.indexOf("function noteImageCropTargetMatches"));
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${helperSource}\nthis.canvasCropSourceFrame = canvasCropSourceFrame;`, context);
  const result = context.canvasCropSourceFrame({
    x: 300, y: 80, width: 400, height: 300,
    cropRect: { x: .25, y: .1, width: .5, height: .75 },
  });
  assert.deepEqual({ ...result }, { x: 100, y: 40, width: 800, height: 400 });
});

test("dragging a dotted crop edge changes the crop rectangle", () => {
  const resizeSource = app.slice(app.indexOf("function clampCropValue"), app.indexOf("function moveNoteImageCropDrag"));
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${resizeSource}\nthis.resizedCropRect = resizedCropRect;`, context);
  const full = { x: 0, y: 0, width: 1, height: 1 };
  assert.deepEqual({ ...context.resizedCropRect(full, "n", 0, .2) }, { x: 0, y: .2, width: 1, height: .8 });
  assert.deepEqual({ ...context.resizedCropRect(full, "w", .25, 0) }, { x: .25, y: 0, width: .75, height: 1 });
});

test("crop edges are detected by pointer position even when the SVG target is missed", () => {
  const hitSource = app.slice(app.indexOf("function cropModeAtNormalizedPoint"), app.indexOf("function canvasCropModeAtEvent"));
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${hitSource}\nthis.cropModeAtNormalizedPoint = cropModeAtNormalizedPoint;`, context);
  const rect = { x: .1, y: .2, width: .7, height: .6 };
  assert.equal(context.cropModeAtNormalizedPoint(rect, { x: .45, y: .205 }, .02, .02), "n");
  assert.equal(context.cropModeAtNormalizedPoint(rect, { x: .795, y: .5 }, .02, .02), "e");
  assert.equal(context.cropModeAtNormalizedPoint(rect, { x: .105, y: .205 }, .02, .02), "nw");
  assert.equal(context.cropModeAtNormalizedPoint(rect, { x: .45, y: .5 }, .02, .02), "move");
});

test("image crop converts the selected normalized rectangle into real source pixels", async () => {
  const cropSource = app.slice(app.indexOf("async function cropNoteImageSource"), app.indexOf("async function applyNoteImageCrop"));
  const sourceImage = { naturalWidth: 1000, naturalHeight: 500 };
  let drawArguments = null;
  const context = {
    loadExportImage: async () => sourceImage,
    document: {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: (...args) => { drawArguments = args; } }),
        toDataURL: () => "data:image/png;base64,cropped",
      }),
    },
  };
  vm.createContext(context);
  vm.runInContext(`${cropSource}\nthis.cropNoteImageSource = cropNoteImageSource;`, context);
  const result = await context.cropNoteImageSource("data:image/png;base64,source", { x: .2, y: .1, width: .6, height: .6 });
  assert.deepEqual(drawArguments.slice(1), [200, 50, 600, 300, 0, 0, 600, 300]);
  assert.equal(result.width, 600);
  assert.equal(result.height, 300);
  assert.equal(result.src, "data:image/png;base64,cropped");
});

test("Dashboard Active Anki removal requires a confirmation click", () => {
  assert.match(app, /title="Click to remove this set from Active Anki"/);
  const removalWiring = app.match(/\$\$\('\[data-remove-active-anki\]'[^\n]+/);
  assert.ok(removalWiring, "expected Active Anki removal wiring");
  assert.match(removalWiring[0], /addEventListener\("click"/);
  assert.match(app, /button\.dataset\.confirmRemove === "true"/);
  assert.match(app, /button\.textContent = "Confirm remove"/);
  assert.match(app, /Click again to confirm removal/);
});

test("first launch skips personalization and uses Guest by default", () => {
  assert.match(app, /const DEFAULT_PROFILE = \{ name: "Guest", birthday: "" \}/);
  assert.match(html, /id="profile-name">Guest</);
  assert.match(app, /profile\.name\.trim\(\) === "Student"[\s\S]*profile\.name = "Guest"/);
  assert.match(app, /localStorage\.setItem\(PROFILE_KEY, JSON\.stringify\(profile\)\)/);
  assert.doesNotMatch(html, /welcome-profile-dialog|Let’s personalize your app/);
  assert.doesNotMatch(app, /welcome-profile-dialog|welcome-profile-form/);
});

test("Google accounts sync supported progress and can be deleted", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  const sync = fs.readFileSync(path.join(dist, "account-sync.js"), "utf8");
  assert.match(html, /id="account-sync-status"/);
  assert.match(html, /id="sync-progress-now"/);
  assert.match(sync, /study-desk-anki-schedules/);
  assert.match(sync, /your-study-buddy-custom-decks/);
  assert.match(sync, /\/api\/account\/progress/);
  assert.match(sync, /deleted: true/);
  assert.match(sync, /attempt < 3/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS user_progress/);
  assert.match(worker, /record\?\.deleted === true/);
  assert.match(worker, /async function getSyncedProgress/);
  assert.match(worker, /async function saveSyncedProgress/);
  assert.match(worker, /async function deleteAccount/);
  assert.match(worker, /url\.pathname === "\/api\/account" && request\.method === "DELETE"/);
});

test("progress sync persists deletion tombstones", () => {
  const source = fs.readFileSync(path.join(dist, "account-sync.js"), "utf8");
  class TestStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
    setItem(key, value) { this.values.set(String(key), String(value)); }
    removeItem(key) { this.values.delete(String(key)); }
  }
  const localStorage = new TestStorage();
  const context = {
    Storage: TestStorage,
    localStorage,
    location: { protocol: "http:" },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    window: { dispatchEvent() {}, addEventListener() {}, clearTimeout, setTimeout },
    fetch: async () => { throw new Error("network should not run in this test"); },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  localStorage.setItem("your-study-buddy-custom-decks", "[]");
  localStorage.removeItem("your-study-buddy-custom-decks");
  const metadata = JSON.parse(localStorage.getItem("your-study-buddy-sync-meta-v1"));
  assert.ok(metadata.__deleted["your-study-buddy-custom-decks"] > 0);
});

test("settings include language, accessibility, performance, and legal controls", () => {
  assert.match(html, /name="language"/);
  assert.match(html, /name="reduceMotion"/);
  assert.match(html, /name="compactMode"/);
  assert.match(html, /name="dataSaver"/);
  assert.match(html, /data-legal-document="privacy"/);
  assert.match(html, /data-legal-document="terms"/);
  assert.match(html, /data-legal-document="community"/);
  assert.match(html, /data-legal-document="copyright"/);
  assert.match(html, /id="delete-online-account"/);
  assert.match(styles, /data-reduce-motion="true"/);
  assert.match(styles, /content-visibility:auto/);
});

test("public legal documents and the application license are complete and linked", () => {
  const privacy = fs.readFileSync(path.join(dist, "privacy.html"), "utf8");
  const terms = fs.readFileSync(path.join(dist, "terms.html"), "utf8");
  const guidelines = fs.readFileSync(path.join(dist, "community-guidelines.html"), "utf8");
  const license = fs.readFileSync(path.join(root, "LICENSE"), "utf8");
  for (const file of [privacy, terms, guidelines]) {
    assert.match(file, /support@yourstudybuddy\.net/);
    assert.match(file, /legal\.css/);
  }
  assert.match(privacy, /Google provides account authentication/);
  assert.match(privacy, /Cloudflare provides hosting/);
  assert.match(terms, /at least 13 years old/);
  assert.match(terms, /Community Guidelines/);
  assert.match(guidelines, /Academic integrity/);
  assert.match(html, /href="\.\/privacy\.html"/);
  assert.match(html, /href="\.\/terms\.html"/);
  assert.match(html, /href="\.\/community-guidelines\.html"/);
  assert.match(license, /ISC License/);
  assert.match(license, /Copyright \(c\) 2026 Kai Chen Guo/);
});

test("Google sign-in uses the configured client and a verified Worker session", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  const wrangler = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  const clientId = "376424510756-mncplov3qh8rhesmagc2041lsp9telsc.apps.googleusercontent.com";
  assert.match(html, /id="google-signin-button"/);
  assert.match(html, /id="google-signout"/);
  assert.ok(app.includes(`const GOOGLE_CLIENT_ID = "${clientId}"`));
  assert.match(app, /fetch\("\/api\/auth\/google"/);
  assert.match(app, /fetch\("\/api\/auth\/me"/);
  assert.ok(worker.includes(`const GOOGLE_CLIENT_ID = "${clientId}"`));
  assert.match(worker, /crypto\.subtle\.verify/);
  assert.match(worker, /payload\.email_verified !== true/);
  assert.match(worker, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS auth_sessions/);
  assert.match(worker, /sessionTokenHash/);
  assert.doesNotMatch(worker, /Set-Cookie.*body\.credential/);
  assert.match(wrangler, /"run_worker_first": \["\/api\/\*"\]/);
});

test("account login appears above Settings and requires a name plus unique username after Google sign-in", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  const loginPosition = html.indexOf('id="open-account-dialog"');
  const settingsPosition = html.indexOf('id="open-settings"');
  assert.ok(loginPosition >= 0 && loginPosition < settingsPosition, "expected Log in immediately above Settings");
  assert.match(html, /id="account-dialog"/);
  assert.match(html, /id="username-form"/);
  assert.match(html, /id="display-name-input"[^>]+maxlength="40"/);
  assert.match(html, /Your name is how people see you/);
  assert.match(html, /id="username-input"[^>]+pattern="\[A-Za-z\]\[A-Za-z0-9_\]\{2,23\}"/);
  assert.match(app, /openAccountDialog\(\);[\s\S]{0,180}Create your profile/);
  assert.match(app, /\/api\/account\/username\/check/);
  assert.match(app, /fetch\("\/api\/account\/profile"/);
  assert.match(app, /body: JSON\.stringify\(\{ displayName, username \}\)/);
  assert.match(worker, /username TEXT COLLATE NOCASE UNIQUE/);
  assert.match(worker, /users_username_unique ON users\(username COLLATE NOCASE\)/);
  assert.match(worker, /google_sub TEXT PRIMARY KEY/);
  assert.match(worker, /url\.pathname === "\/api\/account\/username\/check"/);
  assert.match(worker, /url\.pathname === "\/api\/account\/profile"/);
  assert.match(worker, /UPDATE users SET display_name = \?, username = \?/);
  assert.match(worker, /RESERVED_USERNAMES/);
});

test("signed-in users can publish and browse community study sets and notes", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  assert.match(html, /id="browse-community"/);
  assert.match(html, /data-community-kind="study_set"/);
  assert.match(html, /data-community-kind="note"/);
  assert.match(app, /fetch\("\/api\/community\/publish"/);
  assert.match(app, /function publishStudySet\(deckId\)/);
  assert.match(app, /function publishNotebookNote\(noteId\)/);
  assert.match(html, /id="publish-description" maxlength="280"/);
  assert.match(html, /id="publish-description-count">0 \/ 280/);
  assert.match(app, /function submitCommunityPublication\(event\)/);
  assert.match(app, /summary: description \|\| publication\.summary/);
  assert.match(worker, /body\.summary\.length > 280/);
  assert.match(worker, /Keep the description at 280 characters or fewer/);
  assert.match(app, /function importedCommunityStudySet/);
  assert.match(app, /function importedCommunityNote/);
  assert.match(app, /function communityItemIsSaved\(item\)/);
  assert.match(app, /your-study-buddy-community-saved:/);
  assert.match(app, /community-added-button/);
  assert.match(app, /saveButton\.classList\.toggle\("community-added-button", saved\)/);
  assert.match(styles, /\.community-added-button,\.community-added-button:disabled \{[^}]*background: #e8f8f1;[^}]*color: #167957/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS published_items/);
  assert.match(worker, /UNIQUE\(author_sub, kind, source_id\)/);
  assert.match(worker, /url\.pathname === "\/api\/community\/publish"/);
  assert.match(worker, /url\.pathname === "\/api\/community\/items"/);
  assert.match(worker, /Finish creating your profile before publishing/);
});

test("signed-in users can view and manage their public library", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  assert.match(html, /data-browse-library-view="mine"/);
  assert.match(html, /id="browse-my-public"/);
  assert.match(html, /id="my-public-library-list"/);
  assert.match(app, /function loadMyPublicLibrary\(\)/);
  assert.match(app, /fetch\("\/api\/community\/mine"/);
  assert.match(app, /function previewMyPublishedItem\(itemId\)/);
  assert.match(app, /function unpublishCommunityItem\(itemId\)/);
  assert.match(app, /method: "DELETE"/);
  assert.match(worker, /async function listMyPublishedItems\(request, env\)/);
  assert.match(worker, /async function unpublishItem\(request, env, itemId\)/);
  assert.match(worker, /url\.pathname === "\/api\/community\/mine"/);
  assert.match(worker, /request\.method === "DELETE"/);
  assert.match(styles, /\.browse-library-toggle \{[^}]*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
});

test("Notes uses one creation menu for page and open notes", () => {
  const notesStart = html.indexOf('id="notes-page"');
  const notesEnd = html.indexOf('id="export"');
  const notesMarkup = html.slice(notesStart, notesEnd);
  assert.match(notesMarkup, /id="note-create-menu"/);
  assert.match(notesMarkup, /<summary class="button primary-button">\+ Note<\/summary>/);
  assert.match(notesMarkup, /data-new-note="open"/);
  assert.match(notesMarkup, /data-new-note="page"/);
  assert.doesNotMatch(notesMarkup, /data-new-note="cornell"/);
  assert.match(notesMarkup, /id="document-page-menu"/);
  assert.match(notesMarkup, /data-add-document-page="cornell"/);
  assert.match(notesMarkup, /data-add-canvas-page="cornell"/);
  assert.match(notesMarkup, /id="document-table-fill-color"/);
  assert.match(notesMarkup, /id="document-table-merge-right"/);
  assert.match(notesMarkup, /id="document-table-merge-down"/);
  assert.match(notesMarkup, /id="document-table-split-cell"/);
  assert.match(app, /function syncDocumentDrawingMode\(\)/);
  assert.match(app, /svg\.style\.pointerEvents = documentMode \? "none" : "auto"/);
  assert.match(styles, /\.document-note-mode \.drawing-tools,[\s\S]*?\.document-note-mode #clear-note-canvas \{ display: none !important; \}/);
  assert.match(app, /"TABLE", "THEAD", "TBODY", "TR", "TH", "TD"/);
  assert.match(app, /child\.setAttribute\("colspan"/);
  assert.match(app, /child\.setAttribute\("rowspan"/);
  assert.match(app, /pageType === "cornell" \? cornellTemplateContent\(\) : ""/);
  assert.doesNotMatch(notesMarkup, /id="new-drawing-note"|id="new-word-note"/);
  assert.match(styles, /\.note-create-menu > div \{[^}]*background: var\(--surface\)/);
  assert.doesNotMatch(styles, /\.note-create-menu > div \{[^}]*background: var\(--panel\)/);
});

test("Browse previews decks before saving them", () => {
  assert.match(html, /id="deck-preview-dialog"/);
  assert.match(html, /data-preview-tab="cards"/);
  assert.match(html, /data-preview-tab="questions"/);
  assert.match(html, /data-preview-tab="feynman"/);
  assert.match(app, /data-preview-built-in/);
  assert.match(app, /function previewBuiltInCollection\(collectionId\)/);
  assert.match(app, /function previewCommunityItem\(itemId\)/);
  assert.match(html, /id="deck-preview-scroll"/);
});

test("Community uses saved-deck star ratings and reports", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  assert.match(html, /id="community-review-form"/);
  assert.doesNotMatch(html, /id="community-review-text"/);
  assert.match(html, />Submit rating</);
  assert.match(html, /id="community-report-form"/);
  assert.match(app, /function ratingMarkup\(item\)/);
  assert.match(app, /data-review-community-set/);
  assert.match(app, /function openSavedCommunityReview\(itemId\)/);
  assert.match(app, /if \(!communityItemIsSaved\(item\)\) \{ showToast\("Save this item before rating it\."\); return; \}/);
  assert.match(app, /reviewForm\.hidden = !canReview/);
  assert.match(app, /communityItemId,/);
  assert.match(app, /submitCommunityReview/);
  assert.match(app, /submitCommunityReport/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS published_ratings/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS published_saves/);
  assert.match(worker, /INSERT OR IGNORE INTO published_saves/);
  assert.match(worker, /Save this item before rating it/);
  assert.match(worker, /PRIMARY KEY\(item_id, user_sub\)/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS published_reports/);
  assert.match(worker, /reviewPublishedItem/);
  assert.match(worker, /reportPublishedItem/);
  assert.match(worker, /You cannot review your own published item/);
  assert.match(worker, /const review = "";/);
  assert.match(worker, /SELECT rating\s+FROM published_ratings WHERE item_id = \?/);
  assert.match(worker, /map\(\(row\) => \(\{ rating: row\.rating \}\)\)/);
  assert.match(app, /aria-label="\$\{stars\} out of 5 stars"/);
  assert.doesNotMatch(app, /community-review-entry[^\n]*reviewerDisplayName/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS community_moderation/);
  assert.match(worker, /AUTO_HIDE_MIN_REPORTS = 8/);
  assert.match(worker, /AUTO_HIDE_REPORT_SAVE_RATIO = 0\.35/);
  assert.match(worker, /REPORT_ACCOUNT_MIN_AGE_MS/);
  assert.match(worker, /MAX_PUBLISHED_ITEMS_PER_ACCOUNT/);
  assert.match(worker, /MAX_NEW_PUBLICATIONS_PER_HOUR/);
  assert.match(worker, /reportCount >= AUTO_HIDE_MIN_REPORTS && reportSaveRatio >= AUTO_HIDE_REPORT_SAVE_RATIO/);
  assert.match(worker, /'pending_review'/);
  assert.match(worker, /removed: false, hiddenForReview/);
  assert.match(worker, /function publicationModerationIssue\(body\)/);
  assert.match(worker, /status: 422/);
});

test("Cloudflare schema and security controls are deployable", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  const migration = fs.readFileSync(path.join(root, "migrations", "0001_account_and_community.sql"), "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS auth_sessions/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS published_saves/);
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Permissions-Policy/);
});

test("manual flashcards suggest local definitions without overwriting the back", () => {
  assert.match(html, /id="manual-definition-suggestions"/);
  assert.match(app, /function localDefinitionSuggestions\(term\)/);
  assert.match(app, /function normalizedSuggestionTerm\(value\)/);
  assert.match(app, /function definitionSourceMatchesContext\(source, context\)/);
  assert.match(app, /function suggestionEditDistance\(left, right\)/);
  assert.match(app, /function suggestionMatchScore\(query, front\)/);
  assert.match(app, /if \(front\.includes\(query\)\) return 2;/);
  assert.match(app, /Number\.isFinite\(card\.matchScore\)/);
  assert.match(app, /suggestion\.source/);
  assert.match(app, /\.\.\.personalCards, \.\.\.builtInCards/);
  assert.match(app, /if \(!suggestion \|\| back\.value\.trim\(\)\) return;/);
  assert.match(app, /Definition added\. You can edit it before adding the card\./);
  assert.match(styles, /\.definition-suggestions/);
  assert.match(styles, /\.definition-suggestion/);
});

test("APUSH autocomplete recognizes Shays' Rebellion without inventing a new card", () => {
  const apushSource = fs.readFileSync(path.join(dist, "apush-textbook-data.js"), "utf8");
  assert.equal((apushSource.match(/Shays’s Rebellion \(1786\)/g) || []).length, 1);
  assert.match(app, /card\.front === "Shays’s Rebellion \(1786\)"/);
  assert.match(app, /front: "Shays' Rebellion \(1786–1787\)"/);
  assert.match(app, /It exposed the weakness of the Articles of Confederation/);
});

test("Community search and sorting use trustworthy rating and add signals", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  assert.match(html, /id="community-search"/);
  assert.match(html, /id="community-sort"/);
  assert.match(html, /value="relevance"/);
  assert.match(html, /value="rating"/);
  assert.match(html, /value="new"/);
  assert.match(html, /value="adds"/);
  assert.match(app, /function sortedCommunityItems\(items\)/);
  assert.match(app, /count < 5/);
  assert.match(worker, /function ratingStatistics\(values\)/);
  assert.match(worker, /\(mean \+ median\) \/ 2/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS published_add_counts/);
  assert.match(worker, /recordPublishedAdd/);
  assert.match(worker, /lower\(p\.summary\) LIKE/);
});

test("curated decks live in Community with distinct ratings that shift every two days", () => {
  assert.match(app, /\{ id: "official:mcat", collectionId: "mcat", baseRating: 4\.8, ratingPhase: 0, ratingCount: 38,/);
  assert.match(app, /\{ id: "official:usmle", collectionId: "usmle", baseRating: 4\.7, ratingPhase: 2, ratingCount: 31,/);
  assert.match(app, /\{ id: "official:dat", collectionId: "dat", baseRating: 4\.6, ratingPhase: 4, ratingCount: 24,/);
  assert.match(app, /\{ id: "official:us-presidents", collectionId: "us-presidents", baseRating: 4\.9, ratingPhase: 6, ratingCount: 17,/);
  assert.match(app, /CURATED_RATING_PERIOD_MS = 2 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(app, /function curatedCommunityRating\(item, now = Date\.now\(\)\)/);
  assert.match(app, /\(period \+ Number\(item\.ratingPhase \|\| 0\)\) % CURATED_RATING_OFFSETS\.length/);
  assert.match(app, /rating: curatedCommunityRating\(official\)/);
  assert.match(app, /const loadedUnits = collection\?\.units \|\| \[\]/);
  assert.match(app, /cards: loadedUnits\.reduce\(\(total, unit\) => total \+ \(unit\.cards \|\| \[\]\)\.length, 0\)/);
  assert.match(app, /counts,/);
  assert.match(app, /OFFICIAL_COMMUNITY_COLLECTION_IDS\.has\(collection\.id\)/);
  assert.doesNotMatch(app, /Official rating|Official community deck|Official ·/);
  assert.match(app, /addCount: 12842, author: \{ displayName: "orbit", username: "orbitstudies17" \}/);
  assert.match(app, /username: "papertrails_73"/);
  assert.match(app, /username: "afterclass404"/);
  assert.match(app, /addCount: Number\(official\.addCount\) \|\| 0/);
});

test("Community creator profiles are clickable and respect account privacy", () => {
  const worker = fs.readFileSync(path.join(root, "worker", "index.mjs"), "utf8");
  assert.match(html, /id="community-profile-dialog"/);
  assert.match(html, /name="profileVisibility" value="public"/);
  assert.match(html, /name="profileVisibility" value="private"/);
  assert.match(app, /data-open-community-profile=/);
  assert.match(app, /function openCommunityProfile\(username\)/);
  assert.match(app, /Curated contributor/);
  assert.match(app, /\/api\/community\/profiles\//);
  assert.match(app, /\/api\/account\/profile\/privacy/);
  assert.match(styles, /\.community-profile-dialog/);
  assert.match(styles, /\.profile-visibility-options/);
  assert.match(worker, /profile_public INTEGER NOT NULL DEFAULT 1/);
  assert.match(worker, /async function updateProfilePrivacy/);
  assert.match(worker, /async function getCommunityProfile/);
  assert.match(worker, /if \(!isPublic\) return json\(\{ profile: profileSummary, items: \[\] \}\)/);
});

test("Anki decks can freeze time without accumulating reviews", () => {
  const sync = fs.readFileSync(path.join(root, "dist", "account-sync.js"), "utf8");
  assert.match(app, /FROZEN_ANKI_DECKS_KEY = "your-study-buddy-frozen-anki-decks-v1"/);
  assert.match(app, /function toggleAnkiDeckFreeze\(deckId\)/);
  assert.match(app, /shiftFrozenDeckSchedules\(deck, duration\)/);
  assert.match(app, /schedule\.due = Number\(schedule\.due\) \+ duration/);
  assert.match(app, /schedule\.fsrs\.due = new Date\(schedule\.fsrs\.due\)\.getTime\(\) \+ duration/);
  assert.match(app, /Anki time is frozen/);
  assert.match(app, /Freeze Anki/);
  assert.match(styles, /\.anki-frozen::after/);
  assert.match(app, /Reviews will not pile up/);
  assert.match(sync, /your-study-buddy-frozen-anki-decks-v1/);
  assert.match(html, /Before clearing browser data/);
  assert.match(html, /Clearing all site data can erase anything stored only on this device/);
  const studySetMarkup = app.slice(app.indexOf("function personalDeckMarkup"), app.indexOf("function renderCustomDecks"));
  assert.doesNotMatch(studySetMarkup, /Freeze Anki|Resume Anki|data-toggle-anki-freeze|anki-frozen/);
  const dashboardMarkup = app.slice(app.indexOf("function renderActiveAnkiDecks"), app.indexOf("function activeAnkiEntryKey"));
  assert.match(dashboardMarkup, /Freeze Anki/);
  assert.match(dashboardMarkup, /data-toggle-anki-freeze/);
});

test("country outlines include microstates and preserve geographic proportions", () => {
  const geography = fs.readFileSync(path.join(root, "dist", "geography-locations-data.js"), "utf8");
  const countries = JSON.parse(geography.slice(geography.indexOf("["), geography.lastIndexOf("]") + 1));
  const generator = fs.readFileSync(path.join(root, "tools", "generate-geography-bank.py"), "utf8");
  for (const code of ["va", "mc", "nr"]) {
    const outline = fs.readFileSync(path.join(root, "dist", "assets", "geography", "outlines", `${code}.svg`), "utf8");
    assert.match(outline, /<path d="M/);
    assert.equal(countries.find((country) => country.id === code)?.outline, `./assets/geography/outlines/${code}.svg`);
  }
  assert.equal(countries.filter((country) => !country.territory && !country.outline).length, 0);
  assert.match(generator, /longitude_scale = max\(\.12, math\.cos\(math\.radians\(mean_latitude\)\)\)/);
  assert.match(generator, /COMPACT_SOVEREIGN_OUTLINE_CODES = \{"MC", "NR", "VA"\}/);
});
