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
const main = fs.readFileSync(path.join(root, "electron", "main.cjs"), "utf8");
const preload = fs.readFileSync(path.join(root, "electron", "preload.cjs"), "utf8");
const selectionStorage = require(path.join(dist, "anki-selection-storage.js"));

function generatorHarness() {
  const helperSource = app.slice(app.indexOf("function cleanNoteLine"), app.indexOf("function notesEditor"));
  const cardSource = app.slice(app.indexOf("function generateCardsFromNotes"), app.indexOf("function cardTopic"));
  const context = { makeLocalId: (prefix) => `${prefix}-test-${Math.random()}` };
  vm.createContext(context);
  vm.runInContext(`${helperSource}\n${cardSource}\nthis.generateCardsFromNotes = generateCardsFromNotes;`, context);
  return context.generateCardsFromNotes;
}

test("browser JavaScript entry points parse", () => {
  for (const file of ["app.js", "fullscreen.js", "table-editing.js", "open-note-controls.js", "anki-selection-storage.js"]) {
    const result = spawnSync(process.execPath, ["--check", path.join(dist, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${file} failed syntax validation:\n${result.stderr}`);
  }
});

test("all local scripts, stylesheets, and images referenced by index exist", () => {
  const references = [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
  assert.ok(references.length > 20, "expected the app shell to reference its local assets");
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

test("Create explains that one generated item type is enough", () => {
  assert.match(html, /only needs one flashcard, one question, or one Feynman prompt/i);
  assert.doesNotMatch(html, /One pass creates and saves flashcards, practice questions, and Feynman prompts/i);
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
