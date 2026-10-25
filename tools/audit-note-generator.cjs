const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "dist", "app.js"), "utf8");
const samples = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "note-generator-samples.json"), "utf8"));

const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));
const helperSource = between("function cleanNoteLine", "function notesEditor");
const cardSource = between("function generateCardsFromNotes", "function cardTopic");
const cardTopicSource = between("function cardTopic", "function supplementalQuestionsFromNotes");
const supplementalSource = between("function supplementalQuestionsFromNotes", "function generateQuestionsFromCards");
const questionSource = between("function generateQuestionsFromCards", "function generateFeynmanPrompts");
const feynmanSource = between("function generateFeynmanPrompts", "const questionTypeOptions");
const questionTextSource = between("function questionDefinitionExcerpt", "function deterministicChoices");
const typedQuestionSource = between("function typedQuestionAsCloze", "function questionTypeSelectOptions");
const context = { makeLocalId: (prefix) => `${prefix}-audit-${Math.random()}` };
vm.createContext(context);
vm.runInContext(`${helperSource}\n${cardSource}\n${cardTopicSource}\n${supplementalSource}\n${questionSource}\n${feynmanSource}\n${questionTextSource}\n${typedQuestionSource}\nthis.api = { generateCardsFromNotes, generateQuestionsFromCards, generateFeynmanPrompts };`, context);

const normalized = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
const failures = [];
const report = samples.map((sample) => {
  const cards = context.api.generateCardsFromNotes(sample.notes);
  const questions = context.api.generateQuestionsFromCards(cards, sample.notes);
  const prompts = context.api.generateFeynmanPrompts(sample.notes, cards);
  const cardKeys = cards.map((card) => normalized(card.front));
  const questionKeys = questions.map((question) => normalized(question.prompt));
  const duplicateCards = cardKeys.filter((key, index) => key && cardKeys.indexOf(key) !== index);
  const duplicateQuestions = questionKeys.filter((key, index) => key && questionKeys.indexOf(key) !== index);
  const malformedQuestions = questions.filter((question) => {
    const prompt = String(question.prompt || "");
    return !prompt.trim() || /\bundefined\b/i.test(prompt) || /\.{4,}\s*\d+[.)]?\s*$/i.test(prompt)
      || (question.type === "cloze" && !prompt.includes("_____"))
      || /^complete the statement:\s*_____\s+is\s+/i.test(prompt) || /[;:]\s*;/.test(prompt);
  });
  const overlyLongCards = cards.filter((card) => normalized(card.back).length > 520);
  if (cards.length < 3) failures.push(`${sample.id}: generated fewer than 3 cards`);
  if (!questions.length) failures.push(`${sample.id}: generated no questions`);
  if (!prompts.length) failures.push(`${sample.id}: generated no Feynman prompts`);
  if (duplicateCards.length) failures.push(`${sample.id}: duplicate card fronts (${[...new Set(duplicateCards)].join(", ")})`);
  if (duplicateQuestions.length) failures.push(`${sample.id}: duplicate question prompts`);
  if (malformedQuestions.length) failures.push(`${sample.id}: ${malformedQuestions.length} malformed question(s)`);
  if (overlyLongCards.length) failures.push(`${sample.id}: ${overlyLongCards.length} card back(s) exceed 520 characters`);
  return {
    id: sample.id,
    cards: cards.length,
    questions: questions.length,
    feynman: prompts.length,
    cardFronts: cards.map((card) => card.front),
    questionPrompts: questions.map((question) => question.prompt),
    feynmanPrompts: prompts.map((item) => item.prompt),
  };
});

process.stdout.write(`${JSON.stringify({ samples: report, failures }, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
