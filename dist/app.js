function defaultCharacteristicFields(template = []) {
  const source = template.length ? template : [
    { name: "Name", front: true, back: false },
    { name: "Column 2", front: false, back: true },
  ];
  return source.slice(0, 15).map((field, index) => ({
    id: field.id || `characteristic-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(field.name || `Column ${index + 1}`),
    value: "",
    front: Boolean(field.front),
    back: Boolean(field.back),
  }));
}

const state = {
  activeCourse: null,
  activeChapter: 0,
  activeMiniUnit: 0,
  activeSection: 0,
  collapsedCourseUnits: new Set(),
  collapsedCourseChapters: new Set(),
  activeView: "lesson",
  selectedAnkiDecks: null,
  ankiQueue: [],
  ankiPosition: 0,
  ankiSessionTotal: 0,
  ankiReviewActive: false,
  ankiStartedAt: null,
  ankiCardShownAt: null,
  selectedFlashcardDecks: null,
  flashcardQueue: [],
  flashcardPosition: 0,
  flashcardReviewActive: false,
  selectedFeynmanDecks: null,
  feynmanQueue: [],
  feynmanPosition: 0,
  feynmanActive: false,
  feynmanFinished: false,
  feynmanStartedAt: null,
  feynmanResponse: "",
  feynmanTimeAmount: 5,
  feynmanTimeUnit: "minutes",
  customDraft: [],
  customQuestionDraft: [],
  customFeynmanDraft: [],
  customImportSource: null,
  editingCustomDeckId: null,
  editingBuiltInCollectionId: null,
  appendNotesToExistingSet: false,
  notesHiddenAfterUpdate: false,
  currentAppView: "dashboard",
  selectedCustomDeckId: null,
  selectedCustomDeckBuiltIn: false,
  selectedBuiltInCollectionId: null,
  selectedBuiltInUnitIds: [],
  calculusAbOnly: false,
  geographyFrontFields: ["country"],
  geographyBackFields: ["capital"],
  usStateFrontFields: ["state"],
  usStateBackFields: ["capital"],
  pendingCustomDeleteId: null,
  pendingBuiltInDeleteId: null,
  pendingDeleteAllStudySets: false,
  pendingReturnAllBuiltIn: false,
  pendingReturnAllTextbooks: false,
  editingStudyFolderId: null,
  customStudyReturnView: "flashcards",
  customDeleteReturnView: "flashcards",
  courseReturnView: "courses",
  customReviewMode: "regular",
  customReviewCards: [],
  customReviewPosition: 0,
  customAnkiSessionTotal: 0,
  customReviewRevealed: false,
  customReviewWasRevealed: false,
  customReviewStartedAt: null,
  customAnkiCardShownAt: null,
  activeAnkiSelections: new Set(),
  customAnkiActiveOwners: [],
  customAnkiBatchSession: false,
  customQuestionAnswered: false,
  customFeynmanTimeAmount: 5,
  customFeynmanTimeUnit: "minutes",
  customFeynmanStartedAt: null,
  manualFrontImage: "",
  manualBackImage: "",
  cardMakerMode: "basic",
  extraColumnsOnly: false,
  customCharacteristicFields: defaultCharacteristicFields(),
  pendingCardImageTarget: null,
  pendingDrawingTarget: null,
  pendingMathTarget: null,
  pendingCodeTarget: null,
  drawingTool: "pen",
  drawingHistory: [],
  textbookCatalogPage: 0,
  studyCatalogPage: 0,
};

const TEXTBOOKS_PER_PAGE = 8;
const STUDY_DECKS_PER_PAGE = 12;
const STUDY_STREAK_KEY = "your-study-buddy-study-days-v1";

function localStudyDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function studyDayNumber(day) {
  const [year, month, date] = String(day).split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / 86400000);
}

function studyDays() {
  try {
    const stored = JSON.parse(localStorage.getItem(STUDY_STREAK_KEY) || "[]");
    return Array.isArray(stored) ? [...new Set(stored.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort() : [];
  } catch { return []; }
}

function studyStreaks() {
  const days = studyDays().map(studyDayNumber).sort((a, b) => a - b);
  if (!days.length) return { current: 0, best: 0 };
  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    run = days[index] === days[index - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const today = studyDayNumber(localStudyDate());
  const latest = days[days.length - 1];
  if (today - latest > 1) return { current: 0, best };
  let current = 1;
  for (let index = days.length - 1; index > 0 && days[index] === days[index - 1] + 1; index -= 1) current += 1;
  return { current, best };
}

function renderStudyStreak() {
  const { current, best } = studyStreaks();
  const currentElement = $("#current-study-streak");
  const bestElement = $("#best-study-streak");
  if (currentElement) currentElement.textContent = `${current} ${current === 1 ? "day" : "days"}`;
  if (bestElement) bestElement.textContent = `Personal best: ${best}`;
}

function recordStudyActivity() {
  const days = studyDays();
  const today = localStudyDate();
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(STUDY_STREAK_KEY, JSON.stringify(days.sort()));
  }
  renderStudyStreak();
}

const SETTINGS_KEY = "your-study-buddy-settings-v1";
const PROFILE_KEY = "your-study-buddy-profile-v1";
const DEFAULT_SETTINGS = {
  theme: "light", newCardsPerDay: 20, maxReviewsPerDay: 200,
  newCardOrder: "random", newReviewOrder: "reviews-first", reviewOrder: "due",
  desiredRetention: 90, enableFuzz: true, dayStartHour: 4, learnAheadMinutes: 20,
  newCardsIgnoreReviewLimit: false, buryNewSiblings: true, buryReviewSiblings: true, buryLearningSiblings: true,
  learningSteps: "1m 10m", graduatingInterval: 1, easyInterval: 4, startingEase: 250,
  hardInterval: 120, easyBonus: 130, intervalModifier: 100, maximumInterval: 36500,
  relearningSteps: "10m", minimumLapseInterval: 1, leechThreshold: 8, leechAction: "tag",
};

function loadSettings() {
  try {
    const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    if (!['light', 'dark'].includes(settings.theme)) settings.theme = "light";
    return settings;
  }
  catch { return { ...DEFAULT_SETTINGS }; }
}

function numericSetting(name) {
  const value = Number(loadSettings()[name]);
  return Number.isFinite(value) ? value : Number(DEFAULT_SETTINGS[name]);
}

function parseAnkiSteps(value) {
  return String(value || "")
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((step) => {
      const match = step.match(/^(\d+(?:\.\d+)?)(s|m|h|d|w)?$/i);
      if (!match || Number(match[1]) <= 0) return null;
      return `${Number(match[1])}${(match[2] || "m").toLowerCase()}`;
    })
    .filter(Boolean);
}

function effectiveTheme(theme = loadSettings().theme) {
  return theme === "dark" ? "dark" : "light";
}

function applyTheme(theme = loadSettings().theme) {
  document.documentElement.dataset.theme = effectiveTheme(theme);
  document.documentElement.style.colorScheme = effectiveTheme(theme);
}

function loadProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!profile || typeof profile.name !== "string") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(profile.birthday || "")) profile.birthday = profile.birthday.slice(5);
    return /^\d{2}-\d{2}$/.test(profile.birthday || "") ? profile : null;
  } catch { return null; }
}

function greetingForNow() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function applyProfile(profile = loadProfile()) {
  if (!profile) return;
  const name = profile.name.trim();
  $("#profile-name").textContent = name;
  $("#profile-avatar").textContent = Array.from(name)[0]?.toUpperCase() || "S";
  $("#dashboard-greeting").textContent = `${greetingForNow()}, ${name}`;
}

function isBirthdayToday(profile = loadProfile()) {
  if (!profile?.birthday) return false;
  const [month, day] = profile.birthday.split("-").map(Number);
  const today = new Date();
  return today.getMonth() + 1 === month && today.getDate() === day;
}

function celebrateBirthday(profile = loadProfile()) {
  const celebration = $("#birthday-celebration");
  const layer = $("#birthday-confetti");
  layer.innerHTML = "";
  document.body.classList.remove("birthday-today");
  celebration.hidden = true;
  if (!isBirthdayToday(profile)) return;
  document.body.classList.add("birthday-today");
  const colors = ["#5b5bd6", "#8b7cf6", "#f2b84b", "#ef6f61", "#37b98b", "#4d98e8"];
  const confetti = Array.from({ length: 72 }, (_, index) => {
    const horizontal = 1.5 + (index * 31.7) % 97;
    const top = 5 + (index * 19.3) % 90;
    const color = colors[index % colors.length];
    const size = 5 + (index % 4) * 2;
    const rotation = (index * 47) % 180;
    return `<i style="--left:${horizontal}%;--top:${top}%;--color:${color};--size:${size}px;--rotation:${rotation}deg"></i>`;
  }).join("");
  const name = escapeHtml(profile.name.trim());
  layer.innerHTML = confetti;
  $("#birthday-message").innerHTML = `Happy Birthday, ${name}!`;
  celebration.hidden = $(".dashboard-grid").hidden;
}

function initializeProfile() {
  const profile = loadProfile();
  if (profile) {
    applyProfile(profile);
    celebrateBirthday(profile);
    return;
  }
  const dialog = $("#welcome-profile-dialog");
  populateBirthdayFields();
  dialog.showModal();
  window.setTimeout(() => $("#welcome-profile-name").focus(), 0);
}

function populateBirthdayFields() {
  populateBirthdaySelects($("#welcome-profile-birth-month"), $("#welcome-profile-birth-day"));
}

function populateBirthdaySelects(monthSelect, daySelect, birthday = "") {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [savedMonth, savedDay] = birthday.split("-").map(Number);
  monthSelect.innerHTML = '<option value="">Choose month</option>' + months.map((month, index) => `<option value="${index + 1}">${month}</option>`).join("");
  const updateDays = () => {
    const month = Number(monthSelect.value);
    const selectedDay = Number(daySelect.value);
    const total = month ? new Date(2000, month, 0).getDate() : 31;
    daySelect.innerHTML = '<option value="">Choose day</option>' + Array.from({ length: total }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("");
    if (selectedDay && selectedDay <= total) daySelect.value = String(selectedDay);
  };
  if (!monthSelect.dataset.birthdayWired) {
    monthSelect.addEventListener("change", updateDays);
    monthSelect.dataset.birthdayWired = "true";
  }
  if (savedMonth) monthSelect.value = String(savedMonth);
  updateDays();
  if (savedDay) daySelect.value = String(savedDay);
}

const apHumanGeographyFeynmanTopics = {
  "aphug-unit-1": ["Geographic data", "Spatial concepts", "Map projections", "Scale of analysis", "Regional analysis", "Human-environment interaction"],
  "aphug-unit-2": ["Population distribution", "Population composition", "Demographic transition", "Population policies", "Migration causes", "Forced migration", "Migration consequences"],
  "aphug-unit-3": ["Concepts of culture", "Cultural landscapes", "Cultural diffusion", "Language patterns", "Religious patterns", "Ethnicity and identity"],
  "aphug-unit-4": ["States and nations", "Political boundaries", "International organizations", "Internal boundaries", "Devolution", "Challenges to sovereignty"],
  "aphug-unit-5": ["Origins of agriculture", "Agricultural revolutions", "Subsistence agriculture", "Commercial agriculture", "Von Thünen model", "Environmental effects of agriculture"],
  "aphug-unit-6": ["Economic sectors", "Measures of development", "Industrial location", "Global trade", "Women and development", "Sustainable development"],
  "aphug-unit-7": ["City types", "Urban origins and growth", "Urban hierarchy", "Urban land-use models", "Suburbanization", "Informal settlements", "Urban sustainability"],
};

const builtInHumanGeographyDecks = (window.AP_HUMAN_GEOGRAPHY_DECKS || []).map((deck) => ({
  ...deck,
  feynmanPrompts: (apHumanGeographyFeynmanTopics[deck.id] || []).map((prompt, index) => ({ id: `${deck.id}-f${index + 1}`, prompt })),
}));
const builtInWorldHistoryDecks = window.AP_WORLD_HISTORY_DECKS || [];
const builtInEnvironmentalScienceDecks = window.AP_ENVIRONMENTAL_SCIENCE_DECKS || [];
const builtInEuropeanHistoryDecks = window.AP_EUROPEAN_HISTORY_DECKS || [];
const builtInGovernmentDecks = window.AP_US_GOVERNMENT_DECKS || [];
const builtInSatVocabularyDecks = window.SAT_VOCABULARY_DECKS || [];
const builtInPsychologyDecks = window.AP_PSYCHOLOGY_DECKS || [];
const builtInUsHistoryDecks = window.AP_US_HISTORY_DECKS || [];
const builtInArtHistoryDecks = window.AP_ART_HISTORY_DECKS || [];
const builtInComputerSciencePrinciplesDecks = window.AP_CSP_DECKS || [];
const builtInBiologyDecks = window.AP_BIOLOGY_DECKS || [];
const builtInStatisticsDecks = window.AP_STATISTICS_DECKS || [];
const builtInChemistryDecks = window.AP_CHEMISTRY_DECKS || [];
const builtInCalculusDecks = window.AP_CALCULUS_DECKS || [];
const builtInPrecalculusDecks = window.AP_PRECALCULUS_DECKS || [];
const builtInComparativeGovernmentDecks = window.AP_COMPARATIVE_GOVERNMENT_DECKS || [];
const builtInMicroeconomicsDecks = window.AP_MICROECONOMICS_DECKS || [];
const builtInMacroeconomicsDecks = window.AP_MACROECONOMICS_DECKS || [];
const builtInMusicTheoryDecks = window.AP_MUSIC_THEORY_DECKS || [];
const builtInLatinDecks = window.AP_LATIN_DECKS || [];
const builtInIbBiologyDecks = window.IB_BIOLOGY_DECKS || [];
const builtInIbChemistryDecks = window.IB_CHEMISTRY_DECKS || [];
const builtInIbPsychologyDecks = window.IB_PSYCHOLOGY_DECKS || [];
const builtInIbEconomicsDecks = window.IB_ECONOMICS_DECKS || [];
const builtInIbGeographyDecks = window.IB_GEOGRAPHY_DECKS || [];
const builtInIbEssDecks = window.IB_ESS_DECKS || [];
const builtInIbMathAaDecks = window.IB_MATH_AA_DECKS || [];
const builtInIbHistoryAmericasDecks = window.IB_HISTORY_AMERICAS_DECKS || [];
const builtInMcatReviewDecks = window.MCAT_REVIEW_DECKS || [];
const builtInUsmleDecks = window.USMLE_DECKS || [];
const builtInDatDecks = window.DAT_DECKS || [];
const builtInAfricanAmericanStudiesDecks = window.AP_AFRICAN_AMERICAN_STUDIES_DECKS || [];
const builtInCybersecurityDecks = window.AP_CYBERSECURITY_DECKS || [];
const builtInBusinessPersonalFinanceDecks = window.AP_BUSINESS_PERSONAL_FINANCE_DECKS || [];
const geographyLocationCountries = window.GEOGRAPHY_LOCATION_COUNTRIES || [];
const usStateBank = window.US_STATE_BANK || [];
const builtInUsPresidentDecks = window.US_PRESIDENT_DECKS || [];
const builtInFlashcardDecks = [...builtInHumanGeographyDecks, ...builtInWorldHistoryDecks, ...builtInEnvironmentalScienceDecks, ...builtInEuropeanHistoryDecks, ...builtInGovernmentDecks, ...builtInSatVocabularyDecks, ...builtInPsychologyDecks, ...builtInUsHistoryDecks, ...builtInArtHistoryDecks, ...builtInComputerSciencePrinciplesDecks, ...builtInBiologyDecks, ...builtInStatisticsDecks, ...builtInChemistryDecks, ...builtInCalculusDecks, ...builtInPrecalculusDecks, ...builtInComparativeGovernmentDecks, ...builtInMicroeconomicsDecks, ...builtInMacroeconomicsDecks, ...builtInMusicTheoryDecks, ...builtInLatinDecks, ...builtInIbBiologyDecks, ...builtInIbChemistryDecks, ...builtInIbPsychologyDecks, ...builtInIbEconomicsDecks, ...builtInIbGeographyDecks, ...builtInIbEssDecks, ...builtInIbMathAaDecks, ...builtInIbHistoryAmericasDecks, ...builtInMcatReviewDecks, ...builtInUsmleDecks, ...builtInDatDecks, ...builtInAfricanAmericanStudiesDecks, ...builtInCybersecurityDecks, ...builtInBusinessPersonalFinanceDecks, ...builtInUsPresidentDecks];
const builtInFlashcardCollections = [{
  id: "aphug",
  name: "AP Human Geography",
  description: "Highlighted terms and broad Feynman topics from the AP Human Geography guide, organized into Units 1–7.",
  units: builtInHumanGeographyDecks,
}, {
  id: "apworld",
  name: "AP World History",
  description: "Explanation, comparison, cause-and-effect, and significance cards grounded in the AP World History guide, organized into Units 1–9.",
  units: builtInWorldHistoryDecks,
}, {
  id: "apes",
  name: "AP Environmental Science",
  description: "Source-aligned environmental science terms and broad Feynman topics from the supplied guide, organized by its seven unit sections.",
  units: builtInEnvironmentalScienceDecks,
}, {
  id: "apeuro",
  name: "AP European History",
  description: "Source-aligned people, events, institutions, ideas, and broad Feynman topics from the supplied review, organized into Units 1–9.",
  units: builtInEuropeanHistoryDecks,
}, {
  id: "apgov",
  name: "AP U.S. Government and Politics",
  description: "Curated institutions, constitutional principles, court cases, civil rights, political beliefs, and participation concepts organized into Units 1–5.",
  units: builtInGovernmentDecks,
}, {
  id: "sat-vocabulary",
  name: "SAT Vocabulary",
  description: "A large SAT vocabulary library divided into five stable, randomly mixed sections of about 200 words each.",
  unitLabel: "mixes",
  catalogLabel: "SAT preparation",
  units: builtInSatVocabularyDecks,
}, {
  id: "appsych",
  name: "AP Psychology",
  description: "Vocabulary from the supplied Myers resource, organized into Unit 0 for statistics, research methods, and ethics plus the five current AP Psychology content units.",
  unitLabel: "sections",
  catalogLabel: "AP course",
  units: builtInPsychologyDecks,
}, {
  id: "apush",
  name: "AP U.S. History",
  description: "American Pageant glossary vocabulary for Periods 1–5 and APUSHReview vocabulary for Periods 6–9, with broad Feynman topics spanning all nine CED periods.",
  unitLabel: "periods",
  catalogLabel: "AP course",
  units: builtInUsHistoryDecks,
}, {
  id: "apart",
  name: "AP Art History",
  description: "Image-first artwork identification cards with descriptions organized into the nine units covered by the supplied study guide.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInArtHistoryDecks,
}, {
  id: "apcsp",
  name: "AP Computer Science Principles",
  description: "Core vocabulary organized by the five AP CSP Big Ideas, with broad prompts for explaining major computing concepts.",
  unitLabel: "Big Ideas",
  catalogLabel: "AP course",
  units: builtInComputerSciencePrinciplesDecks,
}, {
  id: "apbiology",
  name: "AP Biology",
  description: "A focused vocabulary collection aligned to the eight-unit AP Biology framework effective fall 2025.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInBiologyDecks,
}, {
  id: "apstats",
  name: "AP Statistics",
  description: "Vocabulary, procedures, and equation-image cards aligned to the five-unit AP Statistics framework effective fall 2026, with especially detailed sampling and experimental-design coverage.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInStatisticsDecks,
}, {
  id: "apchem",
  name: "AP Chemistry",
  description: "Vocabulary, concepts, and formula-image cards aligned to the nine-unit AP Chemistry framework, with equation applications and broad Feynman topics.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInChemistryDecks,
}, {
  id: "apaas",
  name: "AP African American Studies",
  description: "People, events, institutions, cultural forms, and analytical concepts aligned to the four-unit AP African American Studies framework.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInAfricanAmericanStudiesDecks,
}, {
  id: "apcalculus",
  name: "AP Calculus AB/BC",
  description: "Limits, derivatives, integrals, differential equations, applications, parametric and polar calculus, and infinite series aligned to the current ten-unit framework. Includes an AB-only filter and rendered formulas.",
  unitLabel: "units",
  catalogLabel: "AP course",
  supportsAbFilter: true,
  units: builtInCalculusDecks,
}, {
  id: "apprecalculus",
  name: "AP Precalculus",
  description: "Functions, modeling, formulas, trigonometry, polar coordinates, parameters, vectors, and matrices aligned to all four current CED units. Units 1–3 are tested; Unit 4 is included as optional course content.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInPrecalculusDecks,
}, {
  id: "apcompgov",
  name: "AP Comparative Government and Politics",
  description: "Core concepts and country-specific evidence aligned to all five current CED units and the six required countries: China, Iran, Mexico, Nigeria, Russia, and the United Kingdom.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInComparativeGovernmentDecks,
}, {
  id: "apmicro",
  name: "AP Microeconomics",
  description: "Markets, elasticity, firm behavior, market structures, factor markets, externalities, and public policy aligned to all six CED units, with graph-based cards.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInMicroeconomicsDecks,
}, {
  id: "apmacro",
  name: "AP Macroeconomics",
  description: "Economic indicators, AD–AS, financial markets, stabilization policy, growth, and international finance aligned to all six CED units, with graph-based cards.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInMacroeconomicsDecks,
}, {
  id: "apmusic",
  name: "AP Music Theory",
  description: "Pitch, rhythm, scales, intervals, chords, harmony, voice leading, secondary function, modes, and form aligned to all eight CED units, with notation images.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInMusicTheoryDecks,
}, {
  id: "aplatin",
  name: "AP Latin",
  description: "Latin grammar, literary analysis, cultural context, Pliny’s letters, and Vergil’s Aeneid aligned to the revised six-unit framework effective fall 2025.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInLatinDecks,
}, {
  id: "ibbio",
  name: "IB Biology",
  description: "Current concept-based IB Biology with an SL/HL level toggle, biological diagrams, and investigation skills.",
  unitLabel: "course",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbBiologyDecks,
}, {
  id: "ibchem",
  name: "IB Chemistry",
  description: "Structure, reactivity, experimental analysis, and additional Higher Level chemistry in one course with an SL/HL toggle and analytical diagrams.",
  unitLabel: "course",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbChemistryDecks,
}, {
  id: "ibpsych",
  name: "IB Psychology",
  description: "Biological, cognitive, and sociocultural psychology plus research methods, aligned to the course first assessed in 2027 with an SL/HL toggle.",
  unitLabel: "course",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbPsychologyDecks,
}, {
  id: "ibecon",
  name: "IB Economics",
  description: "Microeconomics, macroeconomics, the global economy, IA analysis, and additional Higher Level theory in one SL/HL-toggle course.",
  unitLabel: "course",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbEconomicsDecks,
}, {
  id: "ibgeo",
  name: "IB Geography",
  description: "Global change, geographic themes, fieldwork, and the Higher Level global-interactions extension, with geographic model diagrams.",
  unitLabel: "course",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbGeographyDecks,
}, {
  id: "ibess",
  name: "IB Environmental Systems and Societies",
  description: "The current SL and HL environmental systems course, including systems thinking, sustainability, investigation skills, law, economics, and justice.",
  unitLabel: "course",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbEssDecks,
}, {
  id: "ibmathaa",
  name: "IB Mathematics: Analysis and Approaches",
  description: "Number and algebra, functions, geometry and trigonometry, statistics and probability, and calculus in one course with an SL/HL toggle, rendered formulas, proof, and mathematical justification.",
  unitLabel: "themes",
  catalogLabel: "IB course",
  supportsLevelFilter: true,
  baseLevel: "SL",
  extensionLevel: "HL",
  units: builtInIbMathAaDecks,
}, {
  id: "ibhistamer",
  name: "IB History of the Americas",
  description: "Higher Level regional study of Indigenous societies, colonial systems, slavery, independence, nation-building, industrialization, global affairs, the Cold War, civil rights, and democracy across North America, Latin America, and the Caribbean.",
  unitLabel: "themes",
  catalogLabel: "IB HL regional study",
  units: builtInIbHistoryAmericasDecks,
}, {
  id: "mcat",
  name: "MCAT Review",
  description: "Large AAMC-outline review spanning biological and biochemical systems, chemical and physical foundations, psychology and sociology, research methods, and CARS reasoning, with sourced diagrams on card backs.",
  unitLabel: "themes",
  catalogLabel: "Standardized exam",
  units: builtInMcatReviewDecks,
}, {
  id: "usmle",
  name: "USMLE Step 1 / Step 2 CK",
  description: "Integrated foundational and clinical medical review organized by organ system, with a Step 1-only toggle and Step 2 CK diagnosis and management extensions.",
  unitLabel: "systems",
  catalogLabel: "Medical licensing exam",
  supportsLevelFilter: true,
  baseLevel: "Step 1",
  extensionLevel: "Step 2 CK",
  extensionDisplayLabel: "Step 1 + Step 2 CK",
  units: builtInUsmleDecks,
}, {
  id: "apcyber",
  name: "AP Cybersecurity",
  description: "Security concepts, controls, attacks, network evidence, and incident response aligned to the five-unit framework effective fall 2026.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInCybersecurityDecks,
}, {
  id: "apbusiness",
  name: "AP Business with Personal Finance",
  description: "Entrepreneurship, marketing, accounting, management, saving, credit, budgeting, and investing aligned to the framework effective fall 2026.",
  unitLabel: "sections",
  catalogLabel: "AP course",
  units: builtInBusinessPersonalFinanceDecks,
}];

const geographyRegionOrder = ["Africa", "Asia", "Europe", "North America & Caribbean", "South America", "Oceania"];
const geographyExtraColumnTemplate = [
  { name: "Country", front: true, back: false },
  { name: "Capital", front: false, back: true },
  { name: "Largest city", front: false, back: false },
  { name: "Currency", front: false, back: false },
  { name: "Region", front: false, back: false },
  { name: "Continent", front: false, back: false },
  { name: "Subregion", front: false, back: false },
  { name: "Languages", front: false, back: false },
  { name: "Population", front: false, back: false },
  { name: "Area (km²)", front: false, back: false },
  { name: "Country codes", front: false, back: false },
  { name: "Calling code", front: false, back: false },
  { name: "Borders", front: false, back: false },
];

function geographyExtraColumns(country) {
  return {
    Country: country.country,
    Capital: country.capital,
    "Largest city": country.largestCity,
    Currency: (country.currencies || []).map((currency) => `${currency.name} (${currency.code})`).join(", "),
    Region: country.region,
    Continent: country.continent,
    Subregion: country.subregion,
    Languages: (country.languages || []).join(", "),
    Population: country.population ? Number(country.population).toLocaleString("en-US") : "",
    "Area (km²)": country.area ? Number(country.area).toLocaleString("en-US") : "",
    "Country codes": country.countryCodes,
    "Calling code": country.callingCode,
    Borders: (country.borders || []).join(", "),
  };
}

const geographyLocationUnits = geographyRegionOrder.map((region, index) => {
  const countries = geographyLocationCountries.filter((country) => !country.territory && country.region === region);
  return {
    id: `world-locations-region-${index + 1}`,
    name: `Countries of the World · ${region}`,
    shortName: region,
    countries,
    cards: countries.map((country) => ({
      id: `geo-${country.id}-country-capital`,
      front: country.country,
      back: country.capital,
      frontImage: "",
      backImage: "",
      characteristicCard: true,
      characteristics: geographyExtraColumns(country),
    })),
    questions: [],
    feynmanPrompts: [],
  };
}).filter((unit) => unit.countries.length);

const geographyTerritories = geographyLocationCountries.filter((country) => country.territory);
if (geographyTerritories.length) geographyLocationUnits.push({
  id: "world-locations-territories",
  name: "Countries of the World · Territories and dependencies",
  shortName: "Territories and dependencies",
  countries: geographyTerritories,
  defaultOff: true,
  cards: geographyTerritories.map((country) => ({
    id: `geo-${country.id}-country-capital`,
    front: country.country,
    back: country.capital,
    frontImage: "",
    backImage: "",
    characteristicCard: true,
    characteristics: geographyExtraColumns(country),
  })),
  questions: [],
  feynmanPrompts: [],
});

builtInFlashcardCollections.push({
  id: "world-locations",
  name: "Countries of the World",
  description: "A configurable location bank covering sovereign countries plus an optional territories-and-dependencies section, with capitals, largest cities, currencies, flags, and outlines.",
  unitLabel: "regions",
  catalogLabel: "Geography",
  geographyBank: true,
  characteristicTemplate: geographyExtraColumnTemplate,
  units: geographyLocationUnits,
});

const usStateRegionOrder = ["Northeast", "Midwest", "South", "West"];
const usStateUnits = usStateRegionOrder.map((region, index) => {
  const states = usStateBank.filter((item) => item.region === region);
  return {
    id: `us-states-region-${index + 1}`,
    name: `U.S. States · ${region}`,
    shortName: region,
    states,
    cards: states.map((item) => ({ id: `us-state-${item.id}`, front: item.state, back: item.capital })),
    questions: [],
    feynmanPrompts: [],
  };
}).filter((unit) => unit.states.length);

builtInFlashcardCollections.push({
  id: "us-states",
  name: "U.S. States",
  description: "A configurable bank of all 50 states with capitals, largest cities, abbreviations, admission dates, Census regions, and 2025 population estimates.",
  unitLabel: "regions",
  catalogLabel: "Geography",
  usStateBank: true,
  units: usStateUnits,
}, {
  id: "us-presidents",
  name: "U.S. Presidents",
  description: "A chronological portrait deck covering every U.S. president, with term dates and concise historically significant actions and events.",
  unitLabel: "set",
  catalogLabel: "U.S. history",
  units: builtInUsPresidentDecks,
}, {
  id: "dat",
  name: "Dental Admission Test (DAT)",
  description: "A large DAT review bank aligned to the 2026 ADA blueprint: Biology, General Chemistry, Organic Chemistry, Perceptual Ability, Reading Comprehension, and Quantitative Reasoning.",
  unitLabel: "sections",
  catalogLabel: "Admissions exam",
  units: builtInDatDecks,
});

// Large standalone exam banks use lightweight catalog metadata at startup.
// Their full card arrays are attached only when the bank is actually needed.
const lazyBuiltInSources = {
  "sat-vocabulary": { scripts: ["sat-vocabulary-data.js"], global: "SAT_VOCABULARY_DECKS", unitCount: 5, cardCount: 986, feynmanCount: 0 },
  mcat: { scripts: ["mcat-review-data.js", "mcat-biochem-expansion.js"], global: "MCAT_REVIEW_DECKS", unitCount: 14, cardCount: 273, feynmanCount: 50 },
  usmle: { scripts: ["usmle-data.js", "usmle-expansion.js"], global: "USMLE_DECKS", unitCount: 12, cardCount: 365, feynmanCount: 24 },
  dat: { scripts: ["admissions-exam-data.js"], global: "DAT_DECKS", unitCount: 6, cardCount: 150, feynmanCount: 0 },
};
const lazyScriptPromises = new Map();
const lazyCollectionPromises = new Map();

function loadLazyScript(file) {
  if (lazyScriptPromises.has(file)) return lazyScriptPromises.get(file);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `./${file}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`${file} could not be loaded.`));
    document.body.appendChild(script);
  });
  lazyScriptPromises.set(file, promise);
  return promise;
}

async function ensureBuiltInCollectionLoaded(collectionId) {
  const source = lazyBuiltInSources[collectionId];
  const collection = builtInFlashcardCollections.find((item) => item.id === collectionId);
  if (!source || !collection || collection.units.length) return collection;
  if (lazyCollectionPromises.has(collectionId)) return lazyCollectionPromises.get(collectionId);
  const promise = (async () => {
    for (const file of source.scripts) await loadLazyScript(file);
    collection.units = Array.isArray(window[source.global]) ? window[source.global] : [];
    collection.catalogLoaded = true;
    renderBuiltInDecks();
    renderCustomDecks();
    renderActiveAnkiDecks();
    return collection;
  })().catch((error) => {
    lazyCollectionPromises.delete(collectionId);
    showToast(`${collection.name} could not be loaded.`);
    throw error;
  });
  lazyCollectionPromises.set(collectionId, promise);
  return promise;
}

async function hydrateAddedCollections() {
  const needed = new Set(addedFlashcardCollectionIds());
  loadActiveAnkiDecks().filter((entry) => entry.target === "deck").forEach((entry) => needed.add(String(entry.id).replace(/^folder:/, "")));
  await Promise.allSettled([...needed].filter((id) => lazyBuiltInSources[id]).map(ensureBuiltInCollectionLoaded));
}

const courses = [
  {
    id: "biology", code: "BIO", title: "Campbell Biology 12e", icon: "⌁", color: "green", level: "Biology", duration: "8 units",
    description: "Eight units and 56 chapter-sized mini-units with textbook-aligned vocabulary and chapter topics.",
    sourceTitle: "Campbell Biology, 12th Edition",
    studyBasis: "Terms come from the chapter reviews and glossary; definitions are cleaned and shortened for study.",
    chapters: [
      lesson("The Chemistry of Life", "Life depends on the properties of matter, water, carbon, and large biological molecules. Chemical structure helps explain how molecules behave inside organisms.", ["Water's polarity supports hydrogen bonding and makes it an effective solvent.", "Carbon can form four covalent bonds and build diverse frameworks.", "Carbohydrates, lipids, proteins, and nucleic acids perform different cellular jobs."], [["Why is water polar?", "Oxygen attracts shared electrons more strongly than hydrogen."], ["What are the four major biological macromolecules?", "Carbohydrates, lipids, proteins, and nucleic acids."], ["Why is carbon chemically versatile?", "It can form four stable covalent bonds and many kinds of skeletons."]], ["Which interaction forms between neighboring water molecules?", ["Peptide bonds", "Hydrogen bonds", "Ionic crystals", "Phosphodiester bonds"], 1]),
      lesson("The Cell", "Cells are life's basic units. Their membranes regulate exchange, their internal structures divide work, and energy transformations power cellular activity.", ["Membranes are selectively permeable phospholipid bilayers.", "Eukaryotic organelles create specialized environments.", "Cellular respiration and photosynthesis transform energy.", "Cell signaling coordinates responses."], [["What is the cell membrane's main role?", "It selectively controls movement between the cell and its environment."], ["Where are proteins assembled?", "At ribosomes."], ["What do mitochondria do?", "They convert energy from fuel molecules into ATP through cellular respiration."]], ["Which structure produces most ATP in a eukaryotic cell?", ["Golgi apparatus", "Mitochondrion", "Lysosome", "Nucleus"], 1]),
      lesson("Genetics", "Genetic information flows from DNA to RNA to protein and is transmitted through cell division and reproduction. Variation arises through mutation, recombination, and independent assortment.", ["Genes are DNA sequences that contribute to inherited traits.", "Meiosis creates haploid cells and reshuffles alleles.", "Gene expression connects genotype with phenotype.", "Regulation determines when and where genes are active."], [["What is an allele?", "One of multiple versions of a gene."], ["What does meiosis produce?", "Genetically varied haploid cells."], ["What is gene expression?", "The use of genetic information to produce a functional RNA or protein."]], ["A heterozygous individual has…", ["Two identical alleles", "Two different alleles", "No alleles", "Only recessive traits"], 1]),
      lesson("Mechanisms of Evolution", "Evolution is change in inherited characteristics across generations. Natural selection, genetic drift, gene flow, and mutation alter populations in different ways.", ["Natural selection increases variants that improve reproductive success in a given environment.", "Genetic drift changes allele frequencies by chance.", "Gene flow moves alleles between populations.", "Speciation requires the evolution of reproductive isolation."], [["What is natural selection?", "Differential survival and reproduction associated with heritable variation."], ["What is genetic drift?", "Random change in allele frequencies, especially strong in small populations."], ["What is reproductive isolation?", "Barriers that prevent populations from exchanging genes successfully."]], ["Which mechanism changes allele frequencies purely by chance?", ["Natural selection", "Genetic drift", "Gene flow", "Assortative mating"], 1]),
      lesson("The Evolutionary History of Biological Diversity", "Shared ancestry explains both the unity and diversity of life. Phylogenies organize evolutionary relationships, while fossils and molecular evidence reveal major transitions.", ["Phylogenetic trees are hypotheses about relationships.", "Three domains organize cellular life: Bacteria, Archaea, and Eukarya.", "Endosymbiosis helps explain mitochondria and chloroplasts.", "Major lineages diversified through adaptation and extinction."], [["What does a branch point represent?", "The most recent common ancestor of descendant lineages."], ["What is endosymbiosis?", "A relationship in which one organism lives inside another; it explains the origin of some organelles."], ["What are the three domains?", "Bacteria, Archaea, and Eukarya."]], ["Mitochondria most likely originated from…", ["Infolded nuclear membranes", "Engulfed bacteria", "Viral particles", "Cell-wall fragments"], 1]),
      lesson("Plant Form and Function", "Plants acquire light, water, minerals, and carbon dioxide while coordinating growth across roots, stems, and leaves. Transport and signaling connect the entire organism.", ["Roots anchor plants and absorb water and minerals.", "Xylem transports water; phloem transports sugars.", "Stomata balance carbon dioxide uptake with water loss.", "Plant hormones coordinate development and environmental responses."], [["What does xylem transport?", "Water and dissolved minerals, mainly from roots upward."], ["What does phloem transport?", "Sugars and other organic products between sources and sinks."], ["What is a stoma?", "A regulated pore that controls gas exchange and water loss."]], ["Which tissue transports sugars?", ["Xylem", "Phloem", "Epidermis", "Cork"], 1]),
      lesson("Animal Form and Function", "Animal bodies maintain internal stability through coordinated tissues, organs, and feedback systems. Exchange, transport, signaling, defense, and reproduction depend on specialized structures.", ["Negative feedback helps maintain homeostasis.", "Nervous and endocrine signals coordinate body functions.", "Circulatory systems move gases, nutrients, wastes, and signals.", "Immune defenses distinguish threats from the body's own cells."], [["What is homeostasis?", "Regulation that keeps internal conditions within workable ranges."], ["What is negative feedback?", "A response that counteracts a deviation from a set range."], ["How do nervous and endocrine signals differ?", "Nervous signals are often rapid and targeted; endocrine signals travel as hormones and are often slower and broader."]], ["Which process usually stabilizes body temperature?", ["Positive feedback", "Negative feedback", "Genetic drift", "Osmosis alone"], 1]),
      lesson("Ecology", "Ecology examines how organisms interact with one another and with their physical environment, from individual behavior to global energy flow and nutrient cycles.", ["Population size changes through births, deaths, immigration, and emigration.", "Species interactions shape communities.", "Energy flows through ecosystems while matter cycles.", "Biodiversity supports resilience and ecosystem services."], [["What is a population?", "Individuals of the same species living in the same area."], ["How does energy move through an ecosystem?", "It flows through trophic levels and is eventually lost as heat."], ["What is carrying capacity?", "The largest population an environment can sustain over time under given conditions."]], ["Which statement about ecosystem energy is correct?", ["It cycles indefinitely", "It flows and is lost as heat", "It increases at higher trophic levels", "It is created by consumers"], 1]),
    ],
  },
];

const miniUnitsByUnit = [
  [
    miniUnit(1, "Evolution, the Themes of Biology, and Scientific Inquiry", "levels of organization|information flow|energy and matter|biological interactions|natural selection|scientific inquiry"),
    miniUnit(2, "The Chemical Context of Life", "elements of life|atomic structure|isotopes|electron shells|chemical bonds|chemical reactions"),
    miniUnit(3, "Water and Life", "water polarity|hydrogen bonding|cohesion and adhesion|temperature moderation|solutions and solutes|acids bases and pH"),
    miniUnit(4, "Carbon and the Molecular Diversity of Life", "carbon skeletons|hydrocarbons|isomers|functional groups|organic chemistry|ATP structure"),
    miniUnit(5, "The Structure and Function of Large Biological Molecules", "polymer formation|carbohydrates|lipids|protein structure|nucleic acids|genomics and proteomics"),
  ],
  [
    miniUnit(6, "A Tour of the Cell", "microscopy|prokaryotic and eukaryotic cells|nucleus and ribosomes|endomembrane system|mitochondria and chloroplasts|cytoskeleton and junctions"),
    miniUnit(7, "Membrane Structure and Function", "fluid mosaic model|selective permeability|diffusion and osmosis|facilitated diffusion|active transport|exocytosis and endocytosis"),
    miniUnit(8, "An Introduction to Metabolism", "metabolic pathways|thermodynamics|free energy|ATP coupling|enzyme catalysis|metabolic regulation"),
    miniUnit(9, "Cellular Respiration and Fermentation", "redox reactions|glycolysis|pyruvate oxidation|citric acid cycle|oxidative phosphorylation|fermentation"),
    miniUnit(10, "Photosynthesis", "chloroplast structure|light reactions|photosystems|electron transport|Calvin cycle|C4 and CAM pathways"),
    miniUnit(11, "Cell Communication", "signal reception|membrane receptors|signal transduction|second messengers|cellular response|apoptosis"),
    miniUnit(12, "The Cell Cycle", "chromosome organization|interphase|mitosis|cytokinesis|cell-cycle control|cancer cells"),
  ],
  [
    miniUnit(13, "Meiosis and Sexual Life Cycles", "chromosome sets|fertilization|stages of meiosis|crossing over|mitosis versus meiosis|sources of genetic variation"),
    miniUnit(14, "Mendel and the Gene Idea", "law of segregation|independent assortment|probability rules|testcrosses|complex inheritance|pedigrees"),
    miniUnit(15, "The Chromosomal Basis of Inheritance", "chromosome theory|sex-linked genes|genetic linkage|recombination maps|chromosome alterations|non-Mendelian inheritance"),
    miniUnit(16, "The Molecular Basis of Inheritance", "DNA as genetic material|double-helix structure|semiconservative replication|replication enzymes|DNA repair|chromatin organization"),
    miniUnit(17, "Gene Expression: From Gene to Protein", "transcription|RNA processing|genetic code|translation|protein targeting|mutations"),
    miniUnit(18, "Regulation of Gene Expression", "operons|chromatin regulation|transcription factors|noncoding RNA|cell differentiation|cancer genetics"),
    miniUnit(19, "Viruses", "viral structure|host dependence|phage cycles|animal virus cycles|emerging viruses|prions"),
    miniUnit(20, "DNA Tools and Biotechnology", "DNA sequencing|recombinant DNA|PCR|gene-expression analysis|cloning and stem cells|genome editing"),
    miniUnit(21, "Genomes and Their Evolution", "genome sequencing|bioinformatics|genome size|multigene families|transposable elements|comparative genomics"),
  ],
  [
    miniUnit(22, "Descent with Modification: A Darwinian View of Life", "Darwin's observations|natural selection|homology|fossil evidence|biogeography|evolutionary adaptation"),
    miniUnit(23, "The Evolution of Populations", "genetic variation|Hardy-Weinberg equilibrium|natural selection|genetic drift|gene flow|sexual selection"),
    miniUnit(24, "The Origin of Species", "species concepts|reproductive barriers|allopatric speciation|sympatric speciation|hybrid zones|rates of speciation"),
    miniUnit(25, "The History of Life on Earth", "origin of life|fossil record|mass extinctions|continental drift|adaptive radiations|evo-devo"),
  ],
  [
    miniUnit(26, "Phylogeny and the Tree of Life", "phylogenetic trees|homology and analogy|cladistics|shared derived characters|molecular clocks|horizontal gene transfer"),
    miniUnit(27, "Bacteria and Archaea", "prokaryotic structure|binary fission|genetic variation|metabolic diversity|bacterial domains|ecological roles"),
    miniUnit(28, "Protists", "eukaryotic diversity|endosymbiosis|excavates|SAR clade|archaeplastids|unicellular ecology"),
    miniUnit(29, "Plant Diversity I: How Plants Colonized Land", "green-algal ancestry|land-plant adaptations|alternation of generations|bryophytes|vascular tissue|seedless vascular plants"),
    miniUnit(30, "Plant Diversity II: The Evolution of Seed Plants", "seed adaptations|gymnosperms|angiosperms|flowers and fruits|plant life cycles|plant conservation"),
    miniUnit(31, "Fungi", "absorptive nutrition|hyphae and mycelia|fungal life cycles|fungal phylogeny|decomposition|mutualism"),
    miniUnit(32, "An Overview of Animal Diversity", "animal characteristics|embryonic development|body symmetry|tissue layers|body cavities|animal phylogeny"),
    miniUnit(33, "An Introduction to Invertebrates", "sponges|cnidarians|lophotrochozoans|molluscs and annelids|ecdysozoans|echinoderms"),
    miniUnit(34, "The Origin and Evolution of Vertebrates", "chordate traits|early vertebrates|jawed vertebrates|tetrapods|amniotes|mammals and humans"),
  ],
  [
    miniUnit(35, "Vascular Plant Structure, Growth, and Development", "plant organs|plant tissues|meristems|primary growth|secondary growth|cell differentiation"),
    miniUnit(36, "Resource Acquisition and Transport in Vascular Plants", "root architecture|apoplast and symplast|xylem transport|transpiration|stomatal control|phloem translocation"),
    miniUnit(37, "Soil and Plant Nutrition", "soil structure|essential elements|mineral deficiency|nitrogen fixation|mycorrhizae|sustainable agriculture"),
    miniUnit(38, "Angiosperm Reproduction and Biotechnology", "flower anatomy|pollination|double fertilization|seed and fruit development|asexual reproduction|crop biotechnology"),
    miniUnit(39, "Plant Responses to Internal and External Signals", "signal transduction|plant hormones|tropisms|photoperiodism|stress responses|plant defenses"),
  ],
  [
    miniUnit(40, "Basic Principles of Animal Form and Function", "structure-function relationships|animal tissues|homeostasis|feedback control|thermoregulation|metabolic rate"),
    miniUnit(41, "Animal Nutrition", "essential nutrients|feeding strategies|digestion|absorption|digestive adaptations|appetite regulation"),
    miniUnit(42, "Circulation and Gas Exchange", "open and closed circulation|heart cycles|blood vessels|blood components|respiratory surfaces|gas transport"),
    miniUnit(43, "The Immune System", "innate immunity|antigens|B cells and antibodies|T cells|immunological memory|immune disorders"),
    miniUnit(44, "Osmoregulation and Excretion", "osmolarity|nitrogenous wastes|excretory systems|nephron function|water conservation|hormonal regulation"),
    miniUnit(45, "Hormones and the Endocrine System", "hormone classes|target receptors|feedback pathways|hypothalamus and pituitary|stress hormones|sex hormones"),
    miniUnit(46, "Animal Reproduction", "asexual and sexual reproduction|fertilization|reproductive anatomy|gametogenesis|hormonal cycles|embryonic pregnancy"),
    miniUnit(47, "Animal Development", "fertilization|cleavage|gastrulation|organogenesis|cell-fate determination|pattern formation"),
    miniUnit(48, "Neurons, Synapses, and Signaling", "neuron structure|resting potential|action potentials|synaptic transmission|neurotransmitters|signal integration"),
    miniUnit(49, "Nervous Systems", "neural circuits|central and peripheral systems|brain regions|cerebral cortex|memory and learning|nervous-system disorders"),
    miniUnit(50, "Sensory and Motor Mechanisms", "sensory reception|mechanoreception|hearing and balance|vision|taste and smell|muscle contraction"),
    miniUnit(51, "Animal Behavior", "behavioral ecology|fixed action patterns|learning|communication|foraging|mating and social behavior"),
  ],
  [
    miniUnit(52, "An Introduction to Ecology and the Biosphere", "ecological levels|climate patterns|terrestrial biomes|aquatic biomes|species distributions|global change"),
    miniUnit(53, "Population Ecology", "population density|demography|exponential growth|logistic growth|life histories|population regulation"),
    miniUnit(54, "Community Ecology", "interspecific competition|predation|symbiosis|species diversity|trophic structure|ecological succession"),
    miniUnit(55, "Ecosystems and Restoration Ecology", "primary production|energy transfer|nutrient cycling|decomposition|restoration ecology|human nutrient impacts"),
    miniUnit(56, "Conservation Biology and Global Change", "biodiversity loss|small-population dynamics|landscape conservation|ecosystem services|climate change|sustainability"),
  ],
];

courses[0].chapters.forEach((unit, index) => { unit.miniUnits = miniUnitsByUnit[index]; });
courses[0].chapters.flatMap((unit) => unit.miniUnits).forEach((chapter) => {
  const vocabulary = window.CAMPBELL_VOCABULARY?.[chapter.number];
  if (vocabulary?.length) {
    const preparedVocabulary = prepareTextbookVocabulary(expandedVocabulary("campbell", chapter.number, vocabulary), "campbell", chapter.number);
    chapter.source = "campbell";
    chapter.textbookTerms = preparedVocabulary.map(([term]) => term);
    chapter.cards = vocabularyDeck(preparedVocabulary);
    chapter.topics = chapter.textbookTerms;
    chapter.quizzes = vocabularyQuizzes(preparedVocabulary, chapter.number, 5);
    chapter.quiz = chapter.quizzes[0];
  }
});
const photosynthesisChapter = courses[0].chapters.flatMap((unit) => unit.miniUnits).find((chapter) => chapter.number === 10);
photosynthesisChapter.cards = vocabularyDeck([
  ["photosynthesis", "The process that converts light energy into chemical energy stored in sugars and other organic molecules."],
  ["autotroph", "An organism that produces its own organic food from inorganic materials using light or chemical energy."],
  ["heterotroph", "An organism that obtains organic molecules by consuming other organisms or their products."],
  ["chloroplast", "The plant and algal organelle where photosynthesis occurs."],
  ["mesophyll", "The leaf tissue containing many chloroplast-rich cells and carrying out most photosynthesis."],
  ["stoma", "A regulated pore in the leaf epidermis that allows carbon dioxide to enter and oxygen and water vapor to leave."],
  ["stroma", "The fluid-filled region of a chloroplast surrounding the thylakoids; the Calvin cycle occurs here."],
  ["thylakoid", "A flattened membrane sac inside a chloroplast; its membrane contains the machinery for the light reactions."],
  ["granum", "A stack of thylakoids inside a chloroplast."],
  ["chlorophyll", "A green pigment that absorbs light energy used in photosynthesis."],
  ["carbon fixation", "The incorporation of inorganic carbon dioxide into an organic molecule."],
  ["light reactions", "Reactions in the thylakoid membrane that use light and water to produce ATP and NADPH while releasing oxygen."],
  ["Calvin cycle", "A cycle in the stroma that uses ATP and NADPH to reduce carbon dioxide and produce G3P."],
  ["NADP+", "The oxidized electron carrier that accepts electrons and hydrogen during the light reactions."],
  ["NADPH", "The reduced electron carrier that supplies high-energy electrons to the Calvin cycle."],
  ["phosphorylation", "The addition of a phosphate group to a molecule; cells commonly use it to transfer energy or regulate protein activity."],
  ["photophosphorylation", "The light-driven production of ATP by chemiosmosis in a chloroplast."],
  ["photon", "A discrete packet of light energy."],
  ["wavelength", "The distance between corresponding points of successive waves, such as crest to crest."],
  ["electromagnetic spectrum", "The complete range of electromagnetic radiation, from short gamma rays to long radio waves."],
  ["visible light", "The portion of the electromagnetic spectrum detectable by human eyes and usable by photosynthetic pigments."],
  ["spectrophotometer", "An instrument that measures how much light a substance absorbs at different wavelengths."],
  ["absorption spectrum", "A graph showing how strongly a pigment absorbs different wavelengths of light."],
  ["action spectrum", "A graph showing how effective different wavelengths are at driving a biological process such as photosynthesis."],
  ["chlorophyll a", "The primary photosynthetic pigment in reaction centers; it directly participates in the light reactions."],
  ["chlorophyll b", "An accessory pigment that broadens the range of light a plant can use and transfers energy to chlorophyll a."],
  ["carotenoid", "A yellow-orange accessory pigment that absorbs additional wavelengths and helps protect chlorophyll from excess light."],
  ["photosystem", "A thylakoid-membrane unit made of a reaction-center complex surrounded by light-harvesting complexes."],
  ["light-harvesting complex", "A group of pigment molecules bound to proteins that captures light and transfers energy toward a reaction center."],
  ["reaction-center complex", "A protein complex containing a special chlorophyll pair and a primary electron acceptor."],
  ["primary electron acceptor", "The molecule that receives an excited electron from reaction-center chlorophyll."],
  ["photosystem II (PS II)", "The photosystem that absorbs light at P680, splits water, releases oxygen, and begins linear electron flow."],
  ["P680", "The reaction-center chlorophyll a pair in photosystem II, named for its best absorption near 680 nanometers."],
  ["photosystem I (PS I)", "The photosystem that absorbs light at P700 and supplies electrons used to reduce NADP+ to NADPH."],
  ["P700", "The reaction-center chlorophyll a pair in photosystem I, named for its best absorption near 700 nanometers."],
  ["linear electron flow", "Electron movement from water through photosystems II and I to NADP+, producing oxygen, ATP, and NADPH."],
  ["cyclic electron flow", "Electron cycling around photosystem I that produces ATP without producing NADPH or oxygen."],
  ["chemiosmosis", "The use of energy stored in a proton gradient to drive ATP synthesis."],
  ["proton gradient", "A difference in hydrogen-ion concentration across a membrane that stores potential energy."],
  ["ATP synthase", "A membrane enzyme that makes ATP as hydrogen ions flow through it down their electrochemical gradient."],
  ["glyceraldehyde 3-phosphate (G3P)", "The three-carbon sugar produced by the Calvin cycle and used to build glucose and other organic molecules."],
  ["rubisco", "The Calvin-cycle enzyme that attaches carbon dioxide to RuBP during carbon fixation."],
  ["RuBP", "The five-carbon carbon-dioxide acceptor that begins the Calvin cycle and is regenerated at the cycle's end."],
  ["reduction phase", "The Calvin-cycle phase in which ATP and NADPH convert carbon-fixation products into G3P."],
  ["regeneration phase", "The Calvin-cycle phase that uses ATP to rebuild RuBP so carbon fixation can continue."],
  ["C3 plant", "A plant whose first stable product of carbon fixation is a three-carbon compound."],
  ["photorespiration", "A process in which rubisco adds oxygen instead of carbon dioxide to RuBP, consuming energy and releasing carbon dioxide."],
  ["C4 plant", "A plant that first fixes carbon dioxide into a four-carbon compound and concentrates carbon dioxide in bundle-sheath cells."],
  ["bundle-sheath cell", "A cell surrounding a leaf vein where C4 plants concentrate carbon dioxide and run the Calvin cycle."],
  ["PEP carboxylase", "The enzyme that initially fixes carbon dioxide in C4 and CAM plants and has a high affinity for carbon dioxide."],
  ["crassulacean acid metabolism (CAM)", "A water-saving pathway that fixes carbon dioxide at night and releases it for the Calvin cycle during the day."],
  ["CAM plant", "A plant that opens its stomata mainly at night and separates initial carbon fixation from the Calvin cycle by time."],
], [
  ["light reactions and Calvin cycle", "The light reactions supply ATP and NADPH to the Calvin cycle; the Calvin cycle returns ADP, phosphate, and NADP+ for reuse."],
  ["photosystem II vs. photosystem I", "Photosystem II begins linear flow by extracting electrons from water at P680; photosystem I re-energizes electrons at P700 so NADPH can form."],
  ["linear vs. cyclic electron flow", "Linear flow uses both photosystems and produces ATP, NADPH, and oxygen. Cyclic flow uses photosystem I and produces additional ATP only."],
  ["C4 vs. CAM pathways", "C4 plants separate initial carbon fixation and the Calvin cycle by location; CAM plants separate them by time."],
]);
courses[0].cardCount = courses[0].chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);

function lesson(title, summary, takeaways, cards, quiz) {
  return { title, summary, takeaways, cards, quiz: { question: quiz[0], options: quiz[1], answer: quiz[2] } };
}

function vocabularyDeck(entries, processCards = []) {
  const cards = entries.map(([term, definition]) => [term, definition]);
  return cards.concat(processCards);
}

function prepareTextbookVocabulary(entries, source, chapterNumber) {
  const contextualDefinitions = {
    "campbell:2:ion": "An atom or molecule with a net electrical charge caused by gaining or losing electrons.",
    "campbell:6:nucleus": "The membrane-enclosed organelle that contains most of a eukaryotic cell's DNA.",
    "campbell:6:chromatin": "DNA and associated proteins that make up eukaryotic chromosomes.",
    "campbell:49:nucleus": "A cluster of neuron cell bodies within the central nervous system.",
  };
  const termCorrections = { "netic drift": "genetic drift", "sponse": "response" };
  const contextualTerms = {
    "campbell:51:communication": "animal communication",
  };
  // The source glossary repeats broad cross-references in many chapters. Keep
  // those terms where the concept is actually introduced so a chapter deck is
  // not padded with context-free cards such as "electron" or "communication."
  const campbellHomeChapters = {
    electron: 2,
    communication: 51,
    science: 1,
    inquiry: 1,
    hypothesis: 1,
    experiment: 1,
    organism: 1,
    organelle: 6,
    cell: 6,
    nucleus: 6,
    molecule: 2,
    matter: 2,
    energy: 8,
    protein: 5,
    transport: 7,
    species: 24,
    variation: 23,
    adaptation: 22,
    bacteria: 27,
    archaea: 27,
    ecology: 52,
    ecosystem: 55,
    community: 54,
    temperature: 3,
    climate: 52,
    fruit: 38,
    family: 26,
    class: 26,
    nerve: 48,
    brain: 49,
    heart: 42,
    plasma: 42,
    density: 53,
    liver: 41,
    testes: 46,
    vertebrate: 34,
    invertebrate: 33,
    flower: 38,
    chromosome: 12,
    cytoplasm: 6,
    "cell division": 12,
    "life cycle": 13,
    fertilization: 13,
    meiosis: 13,
    mitosis: 12,
    tissue: 40,
    organ: 40,
    element: 2,
    mineral: 37,
    absorption: 41,
    digestion: 41,
    nutrition: 41,
    technology: 20,
    genomics: 21,
    "amino acid": 5,
    nucleotide: 5,
    allele: 14,
    phenotype: 14,
    genotype: 14,
    zygote: 13,
    "ecological niche": 54,
    competition: 54,
    photosynthesis: 10,
    "cellular respiration": 9,
    "signal transduction": 11,
    "plasma membrane": 7,
    "active transport": 7,
    osmosis: 7,
    diffusion: 7,
    hydrolysis: 5,
    enzyme: 8,
    substrate: 8,
    stability: 8,
    "chemical reaction": 2,
    "feedback regulation": 8,
  };
  const campbellChapterExclusions = {
    41: new Set(["substrate", "enzyme", "heart", "vertebrate", "breathing", "phylogeny", "trachea"]),
    44: new Set(["acid", "nucleic acid", "feces", "sensor", "solution", "temperate broadleaf forest"]),
  };
  const seen = new Set();
  return entries.map(([rawTerm, rawDefinition]) => {
    const rawNormalized = rawTerm.replace(/\s+/g, " ").trim();
    const contextualKey = `${source}:${chapterNumber}:${rawNormalized.toLowerCase()}`;
    if (source === "campbell" && campbellHomeChapters[rawNormalized.toLowerCase()] && campbellHomeChapters[rawNormalized.toLowerCase()] !== chapterNumber) return null;
    if (source === "campbell" && campbellChapterExclusions[chapterNumber]?.has(rawNormalized.toLowerCase())) return null;
    const term = (contextualTerms[contextualKey] || termCorrections[rawNormalized] || rawNormalized).replace(/\s+/g, " ").trim();
    const key = `${source}:${chapterNumber}:${term.toLowerCase()}`;
    const definition = (contextualDefinitions[key] || rawDefinition)
      .replace(/^\)\s*/, "")
      .replace(/\babout n 1\/2,000\b/gi, "about 1/2,000")
      .replace(/\bknowl edge\b/gi, "knowledge")
      .replace(/\bpolypeps tides\b/gi, "polypeptides")
      .replace(/\bthree[- ]dimensional\b/gi, "three-dimensional")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    return [term, definition];
  }).filter(Boolean).filter(([term, definition]) => {
    const normalized = term.toLowerCase();
    if (!term || !definition || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function expandedVocabulary(source, chapterNumber, entries) {
  const additions = window.TEXTBOOK_VOCABULARY_EXPANSIONS?.[source]?.[chapterNumber] || [];
  const glossaryEntries = source === "vanders" ? (window.VANDERS_GLOSSARY_VOCABULARY?.[chapterNumber] || []) : [];
  // Campbell additions are hand-checked against the chapter text. Put them
  // first so their complete definitions replace damaged glossary extraction.
  return source === "campbell" ? additions.concat(entries) : entries.concat(additions, glossaryEntries);
}

function vocabularyQuizzes(entries, seed, count = 5) {
  const prompts = [
    "Which term matches this description?",
    "Which concept is defined below?",
    "Identify the concept defined below:",
    "Choose the term that best fits this definition:",
    "Which vocabulary term does this describe?",
  ];
  return Array.from({ length: Math.min(count, entries.length) }, (_, questionIndex) => {
    const correctEntryIndex = (seed * 3 + questionIndex * 7) % entries.length;
    const [correctTerm, definition] = entries[correctEntryIndex];
    const distractors = entries
      .map(([term], index) => ({ term, rank: (index - correctEntryIndex - seed - questionIndex + entries.length * 2) % entries.length }))
      .filter(({ term }) => term !== correctTerm)
      .sort((a, b) => a.rank - b.rank)
      .map(({ term }) => term)
      .filter((term, index, terms) => terms.indexOf(term) === index)
      .slice(0, 3);
    const answer = (seed + questionIndex) % 4;
    const options = [...distractors];
    options.splice(answer, 0, correctTerm);
    return { question: `${prompts[questionIndex % prompts.length]} ${definition}`, options, answer };
  });
}

function miniUnit(number, title, topicList) {
  const topics = topicList.split("|");
  return {
    number,
    title,
    topics,
    focusAreas: topics,
    summary: `This chapter develops six connected ideas: ${topics.join(", ")}. Use the lesson to build a mechanism-first explanation rather than memorizing isolated terms.`,
    takeaways: topics.slice(0, 4).map((topic) => `Explain ${topic} and connect it to the chapter's central biological problem.`),
    // Campbell chapters are populated from the textbook glossary below. Keep
    // this empty so no generic question-style fallback cards can leak in.
    cards: [],
    quiz: { question: `Which term describes ${topics[0]}?`, options: [topics[0], topics[1], topics[2], topics[3]], answer: 0 },
  };
}

function companionChapter(spec, source) {
  const vocabulary = prepareTextbookVocabulary(expandedVocabulary(source, spec.number, spec.vocabulary), source, spec.number);
  const details = source === "atkins" ? window.ATKINS_CHAPTER_DETAILS?.[spec.number] : ["zumdahl", "central-science"].includes(source) ? spec : null;
  const sections = details?.sections || (source === "atkins" ? spec.focusAreas.map((title) => ({ title, topics: [] })) : null);
  const equationCards = source === "zumdahl"
    ? (spec.equations || []).map(([name, equation, application]) => [name, application, equation])
    : (details?.equations || []).map(([prompt, equation]) => atkinsEquationApplicationCard(prompt, equation, spec));
  const cards = vocabularyDeck(vocabulary).concat(equationCards);
  const sectionCards = assignCardsToTextbookSections(cards, sections || []);
  return {
    number: spec.number,
    title: spec.title,
    source,
    topics: vocabulary.map(([term]) => term),
    focusAreas: spec.focusAreas,
    textbookTerms: vocabulary.map(([term]) => term),
    textbookVocabulary: vocabulary,
    summary: `This chapter connects ${spec.focusAreas.join(", ")} to build a clear, mechanism-first understanding of the subject.`,
    takeaways: spec.focusAreas.slice(0, 4).map((topic) => `Explain ${topic} using a clear cause-and-effect mechanism.`),
    sections: sectionCards,
    equations: equationCards,
    cards,
    quizzes: vocabularyQuizzes(vocabulary, 100 + spec.number, 5),
  };
}

function assignCardsToTextbookSections(cards, sections) {
  if (!sections.length) return sections;
  const stopWords = new Set(["and", "the", "of", "to", "in", "a", "an", "for", "on", "with", "introduction", "principles", "concepts"]);
  const words = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
  const buckets = sections.map(() => []);
  cards.forEach((card, cardIndex) => {
    const cardWords = new Set(words(`${card[0]} ${card[1]}`));
    let bestIndex = 0; let bestScore = -1;
    sections.forEach((section, sectionIndex) => {
      const vocabulary = words(`${section.title} ${(section.topics || []).join(" ")}`);
      const score = vocabulary.reduce((total, word) => total + (cardWords.has(word) ? 3 : [...cardWords].some((cardWord) => cardWord.includes(word) || word.includes(cardWord)) ? 1 : 0), 0) - buckets[sectionIndex].length * 0.08;
      if (score > bestScore) { bestScore = score; bestIndex = sectionIndex; }
    });
    if (bestScore <= 0) bestIndex = buckets.reduce((smallest, bucket, index) => bucket.length < buckets[smallest].length ? index : smallest, 0);
    buckets[bestIndex].push(cardIndex);
  });
  return sections.map((section, index) => ({ ...section, cardIndexes: buckets[index] }));
}

function normalizeCourseVocabularyCards(course) {
  const chapters = course.chapters.flatMap((unit) => unit.miniUnits);
  chapters.forEach((chapter) => {
    chapter.cards = vocabularyDeck(chapter.textbookVocabulary || []).concat(chapter.equations || []);
  });
}

function atkinsEquationApplicationCard(prompt, equation, chapter) {
  const aliases = {
    "State the perfect-gas equation.": "Perfect-gas equation",
    "State the compression factor.": "Compression factor",
    "State the pressure virial equation through the second virial coefficient.": "Pressure virial equation",
    "State the volume virial equation through the third virial coefficient.": "Volume virial equation",
    "State the van der Waals equation for n moles.": "Van der Waals equation",
    "Define a reduced variable.": "Reduced-variable relations",
    "State the First Law using the book's sign convention.": "First Law of thermodynamics",
    "State reversible pressure-volume work.": "Reversible expansion-work equation",
    "Relate heat to internal energy at constant volume.": "Constant-volume heat relation",
    "Relate heat to enthalpy at constant pressure.": "Constant-pressure heat relation",
    "Define enthalpy.": "Enthalpy definition",
    "State Kirchhoff's equation.": "Kirchhoff equation",
    "Relate perfect-gas heat capacities.": "Perfect-gas heat-capacity relation",
    "Define thermodynamic entropy change.": "Thermodynamic entropy equation",
    "State the Boltzmann formula.": "Boltzmann formula",
    "Define Helmholtz energy.": "Helmholtz-energy definition",
    "Define Gibbs energy.": "Gibbs-energy definition",
    "State the fundamental equation.": "Fundamental thermodynamic equation",
    "State the Gibbs-Helmholtz equation.": "Gibbs-Helmholtz equation",
  };
  const name = aliases[prompt] || prompt
    .replace(/^(State|Define|Write)\s+(the\s+)?/i, "")
    .replace(/^Relate\s+/i, "")
    .replace(/[.?]$/, "")
    .replace(/^./, (letter) => letter.toUpperCase());
  const tests = [
    [/perfect-gas equation/i, "Use it to relate pressure, volume, amount, and temperature when gas interactions are negligible."],
    [/compression factor/i, "Use it to measure how strongly a real gas departs from perfect-gas behavior."],
    [/virial/i, "Use it to model real-gas deviations from experimental pressure-volume-temperature data."],
    [/van der Waals/i, "Use it to estimate real-gas behavior while accounting for attractions and molecular size."],
    [/reduced-variable/i, "Use it to compare different gases at corresponding fractions of their critical conditions."],
    [/First Law/i, "Use it to account for energy transferred as heat and work and the resulting internal-energy change."],
    [/expansion-work/i, "Use it to calculate pressure-volume work along an expansion or compression path."],
    [/constant-volume heat/i, "Use it to obtain an internal-energy change from heat measured at constant volume."],
    [/constant-pressure heat/i, "Use it to obtain an enthalpy change from heat measured at constant pressure."],
    [/enthalpy definition/i, "Use it to define the state function used for heat changes in constant-pressure processes."],
    [/Kirchhoff/i, "Use it to adjust a reaction enthalpy from one temperature to another."],
    [/heat-capacity relation/i, "Use it to convert between constant-pressure and constant-volume heat capacities for a perfect gas."],
    [/entropy equation/i, "Use it to calculate entropy change along a reversible heat-transfer path."],
    [/Boltzmann/i, "Use it to connect macroscopic entropy with the number of accessible microscopic arrangements."],
    [/Helmholtz/i, "Use it to test spontaneity and maximum work at constant temperature and volume."],
    [/Gibbs-energy definition/i, "Use it to test spontaneity and equilibrium at constant temperature and pressure."],
    [/fundamental thermodynamic/i, "Use it to connect changes in internal energy with entropy and volume."],
    [/Gibbs-Helmholtz/i, "Use it to determine how Gibbs energy changes with temperature from enthalpy data."],
    [/Clapeyron/i, "Use it to calculate the slope of a phase boundary from transition enthalpy and volume."],
    [/chemical potential/i, "Use it to predict matter transfer, phase equilibrium, and composition changes."],
    [/Raoult/i, "Use it to calculate component vapor pressures in an ideal solution."],
    [/Henry/i, "Use it to relate dilute-solute concentration to partial pressure."],
    [/osmotic/i, "Use it to connect osmotic pressure with dilute-solute concentration and temperature."],
    [/phase rule/i, "Use it to count the independent intensive variables in a multiphase equilibrium."],
    [/lever rule/i, "Use it to calculate relative amounts of two coexisting phases."],
    [/reaction Gibbs/i, "Use it to determine reaction direction under nonstandard conditions."],
    [/equilibrium constant/i, "Use it to connect equilibrium composition with standard reaction Gibbs energy."],
    [/van 't Hoff/i, "Use it to predict how an equilibrium constant changes with temperature."],
    [/Nernst/i, "Use it to calculate cell potential from composition and standard potential."],
    [/de Broglie/i, "Use it to determine the wavelength associated with a moving particle."],
    [/Schrodinger/i, "Use it to obtain the allowed wavefunctions and energies of a quantum system."],
    [/uncertainty/i, "Use it to estimate the minimum joint uncertainty of conjugate observables."],
    [/box energies/i, "Use it to model quantized translational motion in a confined region."],
    [/harmonic/i, "Use it to approximate molecular vibrational energy levels."],
    [/rigid-rotor/i, "Use it to approximate rotational energy levels of a molecule."],
    [/Rydberg|hydrogenic/i, "Use it to calculate hydrogen-like atomic energies or spectral transitions."],
    [/bond order/i, "Use it to estimate bond strength and stability from molecular-orbital populations."],
    [/Beer-Lambert/i, "Use it to determine concentration from measured absorbance."],
    [/Larmor|resonance condition/i, "Use it to connect magnetic-field strength with nuclear resonance frequency."],
    [/chemical shift/i, "Use it to compare an NMR resonance with a reference and identify chemical environment."],
    [/partition function/i, "Use it to connect molecular energy levels and populations with thermodynamic properties."],
    [/Lennard-Jones/i, "Use it to model short-range repulsion and longer-range dispersion attraction."],
    [/Bragg/i, "Use it to obtain crystal-plane spacings from diffraction angles."],
    [/Fick/i, "Use it to calculate diffusive flux from a concentration gradient."],
    [/Arrhenius/i, "Use it to predict how a reaction rate constant changes with temperature."],
    [/Michaelis-Menten/i, "Use it to model the dependence of enzyme rate on substrate concentration."],
    [/Eyring/i, "Use it to connect a rate constant with activation Gibbs energy."],
    [/Marcus/i, "Use it to estimate electron-transfer barriers and rates."],
    [/Langmuir/i, "Use it to relate surface coverage to pressure for ideal monolayer adsorption."],
  ];
  const application = tests.find(([pattern]) => pattern.test(name))?.[1]
    || `Use it for quantitative problems involving ${chapter.focusAreas.slice(0, 2).join(" and ")}.`;
  return [name, application, equation];
}

const vandersCourse = {
  id: "physiology",
  code: "A&P",
  title: "Vander's Human Physiology 16e",
  icon: "∿",
  color: "blue",
  level: "Human physiology",
  duration: `${window.VANDERS_COURSE_DATA.units.length} units`,
  description: "Five study units and 19 chapters using Vander's chapter topics and key physiological terms.",
  sourceTitle: "Vander's Human Physiology, 16th Edition",
  studyBasis: "Terms and topics are aligned to the chapter text and glossary/index; definitions are paraphrased for study.",
  chapters: window.VANDERS_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "vanders");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
normalizeCourseVocabularyCards(vandersCourse);
vandersCourse.cardCount = vandersCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(vandersCourse);

const atkinsCourse = {
  id: "physical-chemistry",
  code: "P-CHEM",
  title: "Atkins' Physical Chemistry 8e",
  icon: "⚗",
  color: "coral",
  level: "Physical chemistry",
  duration: `${window.ATKINS_COURSE_DATA.units.length} units`,
  description: "Three parts and 25 chapters using Atkins' section structure and checklist concepts.",
  sourceTitle: "Atkins' Physical Chemistry, 8th Edition",
  studyBasis: "Terms and topics are aligned to section headings, checklists of key ideas, and the index; definitions are paraphrased for study.",
  chapters: window.ATKINS_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "atkins");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
normalizeCourseVocabularyCards(atkinsCourse);
atkinsCourse.cardCount = atkinsCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(atkinsCourse);

const ravenCourse = {
  id: "plant-biology",
  code: "BOT",
  title: "Raven Biology of Plants 8e",
  icon: "❧",
  color: "teal",
  level: "Plant biology",
  duration: `${window.RAVEN_COURSE_DATA.units.length} units`,
  description: "Eight study units and 32 chapters using Raven's summaries, glossary, and plant-biology terminology.",
  sourceTitle: "Raven Biology of Plants, 8th Edition",
  studyBasis: "Terms and topics are aligned to chapter summaries, questions, and the glossary; definitions are paraphrased for study.",
  chapters: window.RAVEN_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "raven");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
normalizeCourseVocabularyCards(ravenCourse);
ravenCourse.cardCount = ravenCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(ravenCourse);

const zumdahlCourse = {
  id: "general-chemistry",
  code: "CHEM",
  title: "Zumdahl Chemistry 7e",
  icon: "⚛",
  color: "amber",
  level: "General chemistry",
  duration: `${window.ZUMDAHL_COURSE_DATA.units.length} units`,
  description: "Five study units and 22 chapters aligned to Zumdahl's numbered sections, glossary, equations, and problem-solving structure.",
  sourceTitle: "Chemistry, Seventh Edition",
  studyBasis: "Chapter structure, terminology, definitions, and equations are aligned to Zumdahl Chemistry 7e; explanations are condensed for study.",
  chapters: window.ZUMDAHL_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "zumdahl");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
normalizeCourseVocabularyCards(zumdahlCourse);
zumdahlCourse.cardCount = zumdahlCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(zumdahlCourse);

const centralScienceCourse = {
  id: "central-science",
  code: "CHEM",
  title: "Chemistry: The Central Science 12e",
  icon: "◇",
  color: "violet",
  level: "General chemistry",
  duration: `${window.CENTRAL_SCIENCE_COURSE_DATA.units.length} units`,
  description: "Five study units and 24 chapters built from the textbook glossary and its printed section references.",
  sourceTitle: "Chemistry: The Central Science, 12th Edition",
  studyBasis: "Vocabulary and definitions come from the textbook glossary and are assigned using the section references printed with each entry.",
  chapters: window.CENTRAL_SCIENCE_COURSE_DATA.units.map((unit) => ({
    title: unit.title,
    miniUnits: unit.chapters.map((chapter) => {
      const result = companionChapter(chapter, "central-science");
      result.quiz = result.quizzes[0];
      return result;
    }),
  })),
};
centralScienceCourse.cardCount = centralScienceCourse.chapters.reduce((total, unit) => total + unit.miniUnits.reduce((unitTotal, chapter) => unitTotal + chapter.cards.length, 0), 0);
courses.push(centralScienceCourse);

function textbookFlashcardCollection(course) {
  return {
    id: `textbook-${course.id}`,
    name: course.title,
    description: `${course.description} Select individual units before starting a study session.`,
    unitLabel: "units",
    catalogLabel: "Textbook",
    units: course.chapters.map((unit, unitIndex) => ({
      id: `textbook-${course.id}-unit-${unitIndex + 1}`,
      name: `${course.title} · ${unit.title}`,
      shortName: unit.title,
      builtIn: true,
      sourceTitle: course.sourceTitle,
      cards: unit.miniUnits.flatMap((chapter) => (chapter.cards || []).map((card, cardIndex) => Array.isArray(card) ? {
        id: `textbook-${course.id}-${chapter.number}-c${cardIndex + 1}`,
        front: card[0],
        back: card[1],
        ...(card[2] ? { equation: card[2] } : {}),
      } : card)),
      questions: [],
      feynmanPrompts: unit.miniUnits.flatMap((chapter) => feynmanPrompts(chapter).map((prompt, promptIndex) => ({
        id: `textbook-${course.id}-${chapter.number}-f${promptIndex + 1}`,
        prompt,
      }))),
    })),
  };
}

builtInFlashcardCollections.push(...courses.map(textbookFlashcardCollection));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = $("#toast");
const NOTES_STORAGE_KEY = "your-study-buddy-notes-v1";
const NOTE_FOLDERS_STORAGE_KEY = "your-study-buddy-note-folders-v1";
let activeNoteId = null;
let noteActionsNoteId = null;
let editingNoteFolderId = null;
let noteDrawingTool = "cursor";
let noteDrawingActive = false;
let noteDrawingHistory = [];
let noteDrawingRedoHistory = [];
let noteDrawingStrokes = [];
let noteDrawingTexts = [];
let noteDrawingImages = [];
let currentNoteStroke = null;
let noteDrawingLegacyImage = "";
const DRAWING_CANVAS_WIDTH = 4000;
const DRAWING_CANVAS_HEIGHT = 4000;
const PAGE_CANVAS_WIDTH = 800;
const PAGE_CANVAS_HEIGHT = 1100;
const PAGE_CANVAS_GAP = 44;
const DRAWING_MAX_ZOOM = 4;
let noteDrawingZoom = 1;
let noteDrawingLastPoint = null;
let noteCanvasPanStart = null;
let noteCanvasMode = "open";
let notePageCount = 1;
let notePageLayout = "pages";
let notePageDocumentContent = "";
let noteDocumentPages = [""];
let activeDocumentPage = 0;
let noteDocumentLineSpacing = "1.15";
let noteShowPageNumbers = false;
let noteCanvasTextStyle = "body";
let selectedCanvasTextId = null;
let selectedNoteImageId = null;
let noteImageTransform = null;
let noteCanvasTextFormat = { fontFamily: "Arial", screenSize: 18, color: "#171b2d", bold: false, italic: false };
let noteTextSelection = null;
let noteSaveHandle;
let toastHandle;
let ankiTimerHandle;
let feynmanTimerHandle;
let customReviewTimerHandle;
let customFeynmanTimerHandle;
let freestyleFeynmanTimerHandle;
let freestyleFeynmanStartedAt = null;
let freestyleFeynmanDuration = 0;
let activePdfObjectUrl = "";
let pdfAnnotationLoader = null;

function ensurePdfAnnotationLoaded() {
  if (window.__studyBuddyPdfAnnotationLoaded) return Promise.resolve();
  if (pdfAnnotationLoader) return pdfAnnotationLoader;
  pdfAnnotationLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "./pdf-annotation.bundle.js";
    script.onload = () => { window.__studyBuddyPdfAnnotationLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("The PDF viewer could not be loaded."));
    document.body.appendChild(script);
  });
  return pdfAnnotationLoader;
}

function openNotebookAssetDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("your-study-buddy-note-assets", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("assets")) request.result.createObjectStore("assets");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("The note storage could not be opened."));
  });
}

async function setNotebookAsset(id, blob) {
  const database = await openNotebookAssetDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("assets", "readwrite");
    transaction.objectStore("assets").put(blob, id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("The PDF could not be saved."));
  });
  database.close();
}

async function getNotebookAsset(id) {
  const database = await openNotebookAssetDatabase();
  const blob = await new Promise((resolve, reject) => {
    const request = database.transaction("assets", "readonly").objectStore("assets").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("The PDF could not be opened."));
  });
  database.close();
  return blob;
}

async function removeNotebookAsset(id) {
  if (!id) return;
  const database = await openNotebookAssetDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("assets", "readwrite");
    transaction.objectStore("assets").delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function fixVisibleCountGrammar(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) node.nodeValue = node.nodeValue
    .replace(/\b1 cards\b/g, "1 card")
    .replace(/\b1 questions\b/g, "1 question")
    .replace(/\b1 Feynman (?:prompts|topics)\b/g, "1 Feynman prompt")
    .replace(/\b1 units\b/g, "1 unit")
    .replace(/\b1 decks\b/g, "1 deck");
}

function showToast(message) {
  window.clearTimeout(toastHandle);
  toast.textContent = message;
  toast.classList.add("show");
  toastHandle = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function debounce(callback, delay = 180) {
  let handle;
  return (...args) => {
    window.clearTimeout(handle);
    handle = window.setTimeout(() => callback(...args), delay);
  };
}

function formatStorageBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1073741824) return `${(value / 1048576).toFixed(1)} MB`;
  return `${(value / 1073741824).toFixed(1)} GB`;
}

async function renderStorageHealth() {
  const label = $("#storage-health-label");
  if (!label) return;
  label.textContent = "Checking storage…";
  let localBytes = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    const value = localStorage.getItem(key) || "";
    localBytes += (key.length + value.length) * 2;
  }
  let pdfBytes = 0;
  for (const note of loadNotebookNotes().filter((item) => item.type === "pdf" && item.pdfAssetId)) {
    try { pdfBytes += (await getNotebookAsset(note.pdfAssetId))?.size || 0; } catch (_) {}
  }
  let estimate = null;
  try { estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null; } catch (_) { estimate = null; }
  const total = estimate?.usage ?? localBytes + pdfBytes;
  const quota = estimate?.quota || 0;
  const percent = quota ? Math.min(100, total / quota * 100) : 0;
  const localRisk = localBytes >= 4 * 1048576;
  const level = percent >= 90 || localBytes >= 5 * 1048576 ? "danger" : percent >= 75 || localRisk ? "warning" : "healthy";
  label.textContent = level === "danger" ? "Storage is nearly full" : level === "warning" ? "Back up your data soon" : "Storage looks healthy";
  $("#storage-health-detail").textContent = quota ? `${formatStorageBytes(total)} used of ${formatStorageBytes(quota)} available to the app.` : `${formatStorageBytes(total)} stored locally.`;
  const meter = $(".storage-meter");
  meter.classList.toggle("warning", level === "warning");
  meter.classList.toggle("danger", level === "danger");
  meter.setAttribute("aria-valuenow", String(Math.round(percent)));
  $("#storage-meter-fill").style.width = `${quota ? Math.max(1, percent) : 0}%`;
  let recoveryCount = 0;
  try { recoveryCount = JSON.parse(localStorage.getItem(CORRUPT_DATA_INDEX_KEY) || "[]").length || 0; } catch (_) {}
  $("#storage-diagnostics").innerHTML = `<span>Personal sets: ${loadCustomDecks().length}</span><span>Notes: ${loadNotebookNotes().length}</span><span>Imported PDFs: ${formatStorageBytes(pdfBytes)}</span><span>Local records: ${formatStorageBytes(localBytes)}</span><span>Recovery copies: ${recoveryCount}</span>`;
}

const CORRUPT_DATA_INDEX_KEY = "your-study-buddy-recovered-data-v1";

function preserveCorruptLocalData(key, rawValue) {
  if (!rawValue) return;
  try {
    const recoveryKey = `${key}-recovery-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    localStorage.setItem(recoveryKey, rawValue);
    const index = JSON.parse(localStorage.getItem(CORRUPT_DATA_INDEX_KEY) || "[]");
    const entries = Array.isArray(index) ? index : [];
    entries.push({ key: recoveryKey, originalKey: key, savedAt: Date.now() });
    localStorage.setItem(CORRUPT_DATA_INDEX_KEY, JSON.stringify(entries.slice(-20)));
    localStorage.removeItem(key);
    window.setTimeout(() => showToast("Damaged local data was preserved in a recovery copy."), 0);
  } catch (error) {
    console.error("Could not preserve damaged local data:", error);
  }
}

function loadLocalArray(key, validate = () => true) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) throw new Error("Expected an array");
    return value.filter(validate);
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    preserveCorruptLocalData(key, raw);
    return [];
  }
}

function loadNotebookNotes() {
  return loadLocalArray(NOTES_STORAGE_KEY, (note) => note && typeof note === "object");
}

function saveNotebookNotes(notes) {
  const serialized = JSON.stringify(notes);
  localStorage.setItem(NOTES_STORAGE_KEY, serialized);
  warnIfLocalPayloadLarge(serialized);
}

function loadNoteFolders() {
  return loadLocalArray(NOTE_FOLDERS_STORAGE_KEY, (folder) => folder?.id && folder?.name);
}

function saveNoteFolders(folders) {
  localStorage.setItem(NOTE_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

function createNoteFolder() {
  editingNoteFolderId = null;
  $("#note-folder-dialog-title").textContent = "Create a notebook";
  $("#save-note-folder").textContent = "Create notebook";
  $("#note-folder-name").value = "";
  $("#note-folder-color").value = "#d9b66f";
  $("#note-folder-dialog").showModal();
  window.setTimeout(() => $("#note-folder-name").focus(), 20);
}

function openNoteFolderRename(folderId) {
  const folder = loadNoteFolders().find((item) => item.id === folderId);
  if (!folder) return;
  editingNoteFolderId = folderId;
  $("#note-folder-dialog-title").textContent = "Edit notebook";
  $("#save-note-folder").textContent = "Save notebook";
  $("#note-folder-name").value = folder.name;
  $("#note-folder-color").value = /^#[0-9a-f]{6}$/i.test(folder.color || "") ? folder.color : "#d9b66f";
  $("#note-folder-dialog").showModal();
  window.setTimeout(() => $("#note-folder-name").select(), 20);
}

function saveNoteFolderDialog() {
  const name = $("#note-folder-name").value.trim();
  if (!name) return false;
  const color = $("#note-folder-color").value;
  const folders = loadNoteFolders();
  if (editingNoteFolderId) {
    const folder = folders.find((item) => item.id === editingNoteFolderId);
    if (folder) { folder.name = name; folder.color = color; }
  } else {
    folders.push({ id: makeLocalId("note-folder"), name, color, expanded: true });
  }
  saveNoteFolders(folders);
  editingNoteFolderId = null;
  renderNotesList();
  return true;
}

function moveNotebookNote(noteId, folderId = null) {
  const notes = loadNotebookNotes();
  const note = notes.find((item) => item.id === noteId);
  if (!note) return;
  note.folderId = folderId;
  note.updatedAt = Date.now();
  saveNotebookNotes(notes);
  renderNotesList();
}

function activeNotebookNote() {
  return loadNotebookNotes().find((note) => note.id === activeNoteId) || null;
}

function notePreview(note) {
  if (note.type === "drawing") return "Drawing note";
  if (note.type === "pdf") return `PDF · ${note.sourceFileName || "Original document"}`;
  const holder = document.createElement("div");
  holder.innerHTML = note.html || "";
  return holder.textContent.trim().slice(0, 55) || "Empty word note";
}

function renderNotesList() {
  const search = $("#notes-search")?.value.trim().toLowerCase() || "";
  const notes = loadNotebookNotes().sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
  const visible = notes.filter((note) => !search || `${note.title} ${notePreview(note)}`.toLowerCase().includes(search));
  const folders = loadNoteFolders();
  const noteButton = (note) => `<button type="button" draggable="true" class="note-list-item ${note.id === activeNoteId ? "active" : ""}" data-open-note="${escapeHtml(note.id)}" data-drag-note="${escapeHtml(note.id)}"><span class="note-list-icon">${note.type === "drawing" ? "✎" : note.type === "pdf" ? "PDF" : "Aa"}</span><span class="note-list-copy"><strong>${escapeHtml(note.title || "Untitled note")}</strong><small>${escapeHtml(notePreview(note))}</small></span></button>`;
  const folderMarkup = folders.map((folder) => {
    const items = visible.filter((note) => note.folderId === folder.id);
    const color = /^#[0-9a-f]{6}$/i.test(folder.color || "") ? folder.color : "#d9b66f";
    if (search && !items.length && !folder.name.toLowerCase().includes(search)) return "";
    return `<section class="note-folder" data-note-folder-drop="${escapeHtml(folder.id)}" style="--notebook-color:${color}"><div class="note-folder-heading"><button type="button" class="note-folder-toggle" data-toggle-note-folder="${escapeHtml(folder.id)}"><span class="note-folder-icon">▰</span><strong>${escapeHtml(folder.name)}</strong><span>${folder.expanded ? "⌃" : "⌄"}</span></button><button type="button" class="note-folder-action" data-rename-note-folder="${escapeHtml(folder.id)}" aria-label="Edit ${escapeHtml(folder.name)} notebook">✎</button><button type="button" class="note-folder-action" data-delete-note-folder="${escapeHtml(folder.id)}" aria-label="Delete ${escapeHtml(folder.name)}">×</button></div><div class="note-folder-items" ${folder.expanded ? "" : "hidden"}>${items.length ? items.map(noteButton).join("") : '<div class="note-folder-empty">Drop notes here</div>'}</div></section>`;
  }).join("");
  const unfiled = visible.filter((note) => !note.folderId || !folders.some((folder) => folder.id === note.folderId));
  $("#notes-list").innerHTML = `${folderMarkup}<section class="notes-unfiled-section" data-note-folder-drop=""><div class="notes-unfiled-drop"><strong>Notes outside notebooks</strong><span>Drop here to move a note out</span></div>${unfiled.map(noteButton).join("") || (!folders.length ? '<div class="active-anki-empty">No notes yet.</div>' : "")}</section>`;
  $$('[data-open-note]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => openNotebookNote(button.dataset.openNote)));
  $$('[data-open-note]', $("#notes-list")).forEach((button) => button.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openNoteActions(button.dataset.openNote);
  }));
  $$('[data-drag-note]', $("#notes-list")).forEach((button) => button.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/x-study-note", button.dataset.dragNote);
    $("#notes-list").classList.add("note-drag-active");
  }));
  $$('[data-drag-note]', $("#notes-list")).forEach((button) => button.addEventListener("dragend", () => {
    $("#notes-list").classList.remove("note-drag-active");
    $$('[data-note-folder-drop].drag-over', $("#notes-list")).forEach((target) => target.classList.remove("drag-over"));
  }));
  $$('[data-note-folder-drop]', $("#notes-list")).forEach((target) => {
    target.addEventListener("dragover", (event) => { event.preventDefault(); target.classList.add("drag-over"); });
    target.addEventListener("dragleave", () => target.classList.remove("drag-over"));
    target.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      target.classList.remove("drag-over");
      $("#notes-list").classList.remove("note-drag-active");
      moveNotebookNote(event.dataTransfer.getData("text/x-study-note"), target.dataset.noteFolderDrop || null);
    });
  });
  $$('[data-toggle-note-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => {
    const records = loadNoteFolders(); const folder = records.find((item) => item.id === button.dataset.toggleNoteFolder);
    if (folder) { folder.expanded = !folder.expanded; saveNoteFolders(records); renderNotesList(); }
  }));
  $$('[data-rename-note-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => {
    openNoteFolderRename(button.dataset.renameNoteFolder);
  }));
  $$('[data-delete-note-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => {
    const records = loadNoteFolders(); const folder = records.find((item) => item.id === button.dataset.deleteNoteFolder);
    if (!folder || !window.confirm(`Delete the notebook “${folder.name}”? Its notes will move to Unfiled notes.`)) return;
    saveNoteFolders(records.filter((item) => item.id !== folder.id));
    saveNotebookNotes(loadNotebookNotes().map((note) => note.folderId === folder.id ? { ...note, folderId: null } : note));
    renderNotesList();
  }));
}

function updateNotebookNote(changes, renderList = true) {
  if (!activeNoteId) return;
  const notes = loadNotebookNotes();
  const index = notes.findIndex((note) => note.id === activeNoteId);
  if (index < 0) return;
  notes[index] = { ...notes[index], ...changes, updatedAt: Date.now() };
  saveNotebookNotes(notes);
  if (renderList) renderNotesList();
}

function createNotebookNote(type) {
  const canvasMode = type === "page" ? "page" : "open";
  const note = { id: makeLocalId("note"), type: "drawing", canvasMode, pageCount: 1, pageLayout: "pages", pageDocumentContent: "", title: canvasMode === "page" ? "Untitled page" : "Untitled open note", html: "", drawing: "", drawingWidth: canvasMode === "page" ? PAGE_CANVAS_WIDTH : DRAWING_CANVAS_WIDTH, drawingHeight: canvasMode === "page" ? PAGE_CANVAS_HEIGHT : DRAWING_CANVAS_HEIGHT, drawingTexts: [], drawingImages: [], updatedAt: Date.now() };
  const notes = loadNotebookNotes();
  notes.push(note);
  saveNotebookNotes(notes);
  openNotebookNote(note.id);
  window.setTimeout(() => $("#drawing-note-title")?.select(), 20);
}

let notebookDocumentImportPending = false;

function importedNotePages(text) {
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  const pages = [];
  for (let index = 0; index < lines.length; index += 46) {
    const page = document.createElement("div");
    lines.slice(index, index + 46).forEach((line) => {
      const row = document.createElement("div");
      if (line) row.textContent = line;
      else row.appendChild(document.createElement("br"));
      page.appendChild(row);
    });
    pages.push(page.innerHTML);
  }
  return pages.length ? pages : [""];
}

function createImportedNotebookNote(payload) {
  if (!payload?.text?.trim()) throw new Error("No readable text was found in this document.");
  const documentPages = importedNotePages(payload.text);
  const note = {
    id: makeLocalId("note"),
    type: "drawing",
    canvasMode: "page",
    pageCount: documentPages.length,
    pageLayout: "document",
    pageDocumentContent: documentPages[0] || "",
    documentPages,
    activeDocumentPage: 0,
    title: importDeckName(payload.name || "Imported notes"),
    html: "",
    drawing: "",
    drawingWidth: PAGE_CANVAS_WIDTH,
    drawingHeight: PAGE_CANVAS_HEIGHT * documentPages.length + PAGE_CANVAS_GAP * Math.max(0, documentPages.length - 1),
    drawingTexts: [],
    drawingImages: [],
    updatedAt: Date.now(),
  };
  const notes = loadNotebookNotes();
  notes.push(note);
  saveNotebookNotes(notes);
  showAppView("notes");
  openNotebookNote(note.id);
  showToast(`${note.title} imported as an editable note.`);
}

async function createImportedPdfNotebookNote(file) {
  const assetId = makeLocalId("pdf");
  await setNotebookAsset(assetId, file.slice(0, file.size, "application/pdf"));
  const note = {
    id: makeLocalId("note"),
    type: "pdf",
    pdfAssetId: assetId,
    sourceFileName: file.name,
    title: importDeckName(file.name || "Imported PDF"),
    updatedAt: Date.now(),
  };
  try {
    const notes = loadNotebookNotes();
    notes.push(note);
    saveNotebookNotes(notes);
  } catch (error) {
    await removeNotebookAsset(assetId);
    throw error;
  }
  showAppView("notes");
  openNotebookNote(note.id);
  showToast(`${note.title} imported with its original pages and tables.`);
}

async function displayImportedPdf(note) {
  const frame = $("#pdf-note-pages");
  const loading = document.createElement("div");
  loading.className = "pdf-loading-message";
  loading.textContent = "Loading PDF pages…";
  frame.replaceChildren(loading);
  if (!note?.pdfAssetId) return;
  const blob = await getNotebookAsset(note.pdfAssetId);
  if (!blob || activeNoteId !== note.id) return;
  const request = { noteId: note.id, blob };
  window.__pendingStudyBuddyPdf = request;
  await ensurePdfAnnotationLoaded();
  if (activeNoteId !== note.id) return;
  if (window.__pendingStudyBuddyPdf === request) window.dispatchEvent(new CustomEvent("studybuddy:open-pdf-note", { detail: request }));
}

function handleNotebookImportResult(result) {
  if (!result || result.canceled) return;
  if (result.error) throw new Error(result.error);
  if (result.kind === "document") createImportedNotebookNote(result);
  else if (result.kind === "text") createImportedNotebookNote({ name: result.name, text: result.text });
  else throw new Error("Choose a PDF, PowerPoint, TXT, or Markdown file.");
}

function notebookNotePlainText(note) {
  const htmlToText = (html) => {
    const container = document.createElement("div");
    container.innerHTML = html || "";
    return container.innerText.trim();
  };
  if (note.type === "word") return htmlToText(note.html);
  if (note.type === "pdf") return String(note.extractedText || "").trim();
  const documentText = (note.documentPages || [note.pageDocumentContent || ""]).map(htmlToText).filter(Boolean).join("\n\n");
  const canvasText = (note.drawingTexts || []).map((item) => String(item.text || "").trim()).filter(Boolean).join("\n");
  return [documentText, canvasText].filter(Boolean).join("\n\n");
}

function createFlashcardsFromNotebookNote(noteId = activeNoteId) {
  if (noteId === activeNoteId) {
    const active = activeNotebookNote();
    if (active?.type === "word") updateNotebookNote({ title: $("#word-note-title").value.trim() || "Untitled note", html: sanitizeNotesHtml($("#word-note-content").innerHTML) }, false);
    else if (active?.type === "drawing") saveDrawingNote();
    else if (active?.type === "pdf") updateNotebookNote({ title: $("#pdf-note-title").value.trim() || "Imported PDF" }, false);
  }
  const note = loadNotebookNotes().find((item) => item.id === noteId);
  if (!note) return;
  const text = notebookNotePlainText(note);
  if (!text) {
    showToast("Add typed text to this note before creating flashcards.");
    return;
  }
  const hasCurrentWork = state.editingCustomDeckId || state.editingBuiltInCollectionId || hasAnyStudyItem() || notesPlainText() || $("#custom-deck-name").value.trim();
  if (hasCurrentWork && !window.confirm("Replace the current Create draft with this note?")) return;
  resetCustomDraft();
  $("#custom-deck-name").value = `${note.title || "Imported notes"} flashcards`;
  setNotesContent(text);
  showAppView("create");
  $("#notes-input").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#notes-input").focus();
  showToast("Your note is ready to generate into flashcards.");
}

function openNotebookNote(id) {
  activeNoteId = id;
  const note = activeNotebookNote();
  $("#notes-empty").hidden = Boolean(note);
  $("#word-note-editor").hidden = !note || note.type !== "word";
  $("#drawing-note-editor").hidden = !note || note.type !== "drawing";
  $("#pdf-note-editor").hidden = !note || note.type !== "pdf";
  if (!note) { renderNotesList(); return; }
  if (note.type === "word") {
    $("#word-note-title").value = note.title || "";
    $("#word-note-content").innerHTML = note.html || "";
  } else if (note.type === "drawing") {
    $("#drawing-note-title").value = note.title || "";
    notePageDocumentContent = note.pageDocumentContent || "";
    noteDocumentPages = Array.isArray(note.documentPages) && note.documentPages.length ? note.documentPages : [notePageDocumentContent];
    activeDocumentPage = Math.min(Math.max(0, Number(note.activeDocumentPage) || 0), noteDocumentPages.length - 1);
    noteDocumentLineSpacing = ["1", "1.15", "1.5", "2"].includes(String(note.documentLineSpacing)) ? String(note.documentLineSpacing) : "1.15";
    noteShowPageNumbers = Boolean(note.showPageNumbers);
    $("#document-show-page-numbers").checked = noteShowPageNumbers;
    configureNoteCanvas(note.canvasMode || "open", Math.max(note.pageCount || 1, noteDocumentPages.length), note.pageLayout === "continuous" ? "document" : note.pageLayout || "pages");
    loadDrawingNoteImage(note.drawing || "", note.drawingStrokes || [], note.drawingTexts || [], note.drawingImages || []);
  } else if (note.type === "pdf") {
    $("#pdf-note-title").value = note.title || "Imported PDF";
    displayImportedPdf(note).catch(() => showToast("This imported PDF could not be opened."));
  }
  renderNotesList();
}

function deleteActiveNotebookNote() {
  const note = activeNotebookNote();
  if (!note || !window.confirm(`Delete “${note.title || "Untitled note"}”? This cannot be undone.`)) return;
  const remaining = loadNotebookNotes().filter((item) => item.id !== note.id);
  saveNotebookNotes(remaining);
  if (note.pdfAssetId) removeNotebookAsset(note.pdfAssetId).catch(() => {});
  activeNoteId = remaining.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))[0]?.id || null;
  openNotebookNote(activeNoteId);
  showToast("Note deleted.");
}

function copyLabel(name, existingNames) {
  const base = String(name || "Untitled").replace(/^Copy(?: \d+)? of /i, "");
  let candidate = `Copy of ${base}`;
  let number = 2;
  while (existingNames.has(candidate.toLowerCase())) candidate = `Copy ${number++} of ${base}`;
  return candidate;
}

async function duplicateActiveNotebookNote() {
  let source = activeNotebookNote();
  if (!source) return;
  if (source.type === "word") updateNotebookNote({ title: $("#word-note-title").value.trim() || "Untitled note", html: sanitizeNotesHtml($("#word-note-content").innerHTML) }, false);
  else if (source.type === "drawing") saveDrawingNote();
  else if (source.type === "pdf") updateNotebookNote({ title: $("#pdf-note-title").value.trim() || "Imported PDF" }, false);
  source = activeNotebookNote();
  const notes = loadNotebookNotes();
  const duplicate = JSON.parse(JSON.stringify(source));
  duplicate.id = makeLocalId("note");
  duplicate.title = copyLabel(source.title || "Untitled note", new Set(notes.map((note) => String(note.title || "").toLowerCase())));
  duplicate.updatedAt = Date.now();
  if (source.pdfAssetId) {
    const sourceBlob = await getNotebookAsset(source.pdfAssetId);
    if (!sourceBlob) { showToast("The original PDF file could not be found."); return; }
    duplicate.pdfAssetId = makeLocalId("pdf");
    await setNotebookAsset(duplicate.pdfAssetId, sourceBlob);
  }
  notes.push(duplicate);
  try { saveNotebookNotes(notes); }
  catch (error) {
    if (duplicate.pdfAssetId) await removeNotebookAsset(duplicate.pdfAssetId).catch(() => {});
    showToast("This note could not be copied because local storage is full.");
    return;
  }
  openNotebookNote(duplicate.id);
  showToast(`${duplicate.title} created.`);
}

function openNoteActions(noteId) {
  const note = loadNotebookNotes().find((item) => item.id === noteId);
  if (!note) return;
  if (activeNoteId !== noteId) openNotebookNote(noteId);
  noteActionsNoteId = noteId;
  $("#note-actions-dialog-title").textContent = note.title || "Note actions";
  const canCreateCards = Boolean(notebookNotePlainText(note));
  $("#note-actions-create-cards").disabled = !canCreateCards;
  $("#note-actions-create-cards").title = canCreateCards ? "" : "Add typed text before creating flashcards.";
  $("#note-actions-dialog").showModal();
}

window.addEventListener("studybuddy:pdf-text-ready", (event) => {
  if (!event.detail?.noteId || event.detail.noteId !== noteActionsNoteId || !$("#note-actions-dialog").open) return;
  const note = loadNotebookNotes().find((item) => item.id === event.detail.noteId);
  const canCreateCards = Boolean(note && notebookNotePlainText(note));
  $("#note-actions-create-cards").disabled = !canCreateCards;
  $("#note-actions-create-cards").title = canCreateCards ? "" : "Add typed text before creating flashcards.";
});

function closeNoteActions() {
  if ($("#note-actions-dialog").open) $("#note-actions-dialog").close();
  noteActionsNoteId = null;
}

function drawingNoteCanvas() { return $("#drawing-note-canvas"); }
function drawingWorkspaceWidth() { return noteCanvasMode === "page" ? PAGE_CANVAS_WIDTH : DRAWING_CANVAS_WIDTH; }
function drawingWorkspaceHeight() { return noteCanvasMode === "page" ? PAGE_CANVAS_HEIGHT * notePageCount + PAGE_CANVAS_GAP * Math.max(0, notePageCount - 1) : DRAWING_CANVAS_HEIGHT; }

function configureNoteCanvas(mode, pageCount = notePageCount, pageLayout = notePageLayout) {
  noteCanvasMode = mode === "page" ? "page" : "open";
  notePageCount = noteCanvasMode === "page" ? Math.max(1, Number(pageCount) || 1) : 1;
  notePageLayout = pageLayout === "document" ? "document" : "pages";
  const svg = drawingNoteCanvas();
  svg.setAttribute("viewBox", `0 0 ${drawingWorkspaceWidth()} ${drawingWorkspaceHeight()}`);
  svg.classList.toggle("page-note-surface", noteCanvasMode === "page");
  const documentMode = noteCanvasMode === "page" && notePageLayout === "document";
  if (documentMode) {
    noteDrawingActive = false;
    currentNoteStroke = null;
    svg.style.pointerEvents = "none";
  } else {
    svg.style.pointerEvents = "auto";
  }
  $("#drawing-note-editor").classList.toggle("document-note-mode", documentMode);
  svg.hidden = false;
  $("#page-document-pages").hidden = noteCanvasMode !== "page";
  $("#page-document-pages").classList.toggle("text-editing-active", documentMode);
  $("#document-text-toolbar").hidden = !documentMode;
  $$("#drawing-zoom-out, #drawing-zoom-in, #drawing-zoom-fit, #drawing-zoom-value").forEach((control) => { control.hidden = noteCanvasMode === "page"; });
  $("#toggle-page-layout").hidden = noteCanvasMode !== "page";
  $("#page-actions").hidden = noteCanvasMode !== "page" || documentMode;
  $("#remove-note-page").disabled = notePageCount <= 1;
  $("#toggle-page-layout").textContent = documentMode ? "Drawing pages" : "Document writing";
  if (noteCanvasMode === "page") renderDocumentPages();
  if (noteCanvasMode === "page") setDrawingNoteZoom(1);
  else window.requestAnimationFrame(() => setDrawingNoteZoom(1, true));
}

function drawingFitZoom() {
  const canvas = drawingNoteCanvas();
  const viewport = canvas?.parentElement;
  if (!viewport) return 1 / 40;
  const baseWidth = Math.max(1, viewport.clientWidth) * 40;
  const baseHeight = baseWidth * DRAWING_CANVAS_HEIGHT / DRAWING_CANVAS_WIDTH;
  const horizontalFit = Math.max(1, viewport.clientWidth - 112) / baseWidth;
  const verticalFit = Math.max(1, viewport.clientHeight - 112) / baseHeight;
  return Math.min(horizontalFit, verticalFit);
}

function setDrawingNoteZoom(value, centerCanvas = false) {
  const canvas = drawingNoteCanvas();
  if (!canvas) return;
  const viewport = canvas.parentElement;
  const oldWidth = Math.max(1, canvas.scrollWidth || canvas.getBoundingClientRect().width);
  const oldHeight = Math.max(1, canvas.scrollHeight || canvas.getBoundingClientRect().height);
  const centerX = centerCanvas ? 0.5 : (viewport.scrollLeft + viewport.clientWidth / 2) / oldWidth;
  const centerY = centerCanvas ? 0.5 : (viewport.scrollTop + viewport.clientHeight / 2) / oldHeight;
  const minimumZoom = noteCanvasMode === "page" ? 1 : drawingFitZoom();
  noteDrawingZoom = Math.min(DRAWING_MAX_ZOOM, Math.max(minimumZoom, Number(value) || 1));
  const displayWidth = noteCanvasMode === "page" ? Math.min(800, Math.max(520, viewport.clientWidth - 48)) : Math.max(1, viewport.clientWidth) * 40 * noteDrawingZoom;
  const displayHeight = noteCanvasMode === "page" ? displayWidth * drawingWorkspaceHeight() / PAGE_CANVAS_WIDTH : displayWidth * DRAWING_CANVAS_HEIGHT / DRAWING_CANVAS_WIDTH;
  canvas.style.width = `${Math.round(displayWidth)}px`;
  canvas.style.height = `${Math.round(displayHeight)}px`;
  canvas.style.setProperty("--page-display-height", `${displayWidth * PAGE_CANVAS_HEIGHT / PAGE_CANVAS_WIDTH}px`);
  canvas.style.backgroundSize = noteCanvasMode === "page" ? "0 0" : `${Math.max(8, displayWidth / 50)}px ${Math.max(8, displayHeight / 100)}px`;
  $("#drawing-zoom-value").textContent = `${Math.round(noteDrawingZoom * 100)}%`;
  window.requestAnimationFrame(() => {
    renderOpenNoteTextLayer();
    viewport.scrollLeft = Math.max(0, centerX * canvas.scrollWidth - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, centerY * canvas.scrollHeight - viewport.clientHeight / 2);
  });
}

function clearDrawingCanvas() {
  noteDrawingStrokes = [];
  noteDrawingTexts = [];
  noteDrawingImages = [];
  selectedNoteImageId = null;
  currentNoteStroke = null;
  noteDrawingLegacyImage = "";
  renderDrawingNoteVectors();
}

function drawingStrokePath(stroke) {
  return (stroke.points || []).map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}

function calligraphyStrokePath(stroke) {
  const points = stroke.points || [];
  if (!points.length) return "";
  const halfWidth = Math.max(1, stroke.width / 2);
  const nibAngle = -Math.PI / 4;
  const offsetX = Math.cos(nibAngle) * halfWidth;
  const offsetY = Math.sin(nibAngle) * halfWidth;
  if (points.length === 1) {
    const point = points[0];
    const crossX = -offsetY * 0.18;
    const crossY = offsetX * 0.18;
    return `M${point.x + offsetX + crossX} ${point.y + offsetY + crossY} L${point.x + offsetX - crossX} ${point.y + offsetY - crossY} L${point.x - offsetX - crossX} ${point.y - offsetY - crossY} L${point.x - offsetX + crossX} ${point.y - offsetY + crossY} Z`;
  }
  const left = points.map((point) => ({ x: point.x + offsetX, y: point.y + offsetY }));
  const right = [...points].reverse().map((point) => ({ x: point.x - offsetX, y: point.y - offsetY }));
  return [...left, ...right].map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ") + " Z";
}

function renderDrawingNoteVectors() {
  const svg = drawingNoteCanvas();
  if (!svg) return;
  const viewport = svg.parentElement;
  const preservedScrollLeft = viewport.scrollLeft;
  const preservedScrollTop = viewport.scrollTop;
  svg.replaceChildren();
  if (noteCanvasMode === "page") {
    for (let pageIndex = 0; pageIndex < notePageCount; pageIndex += 1) {
      const page = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      page.setAttribute("x", "0");
      page.setAttribute("y", String(pageIndex * (PAGE_CANVAS_HEIGHT + PAGE_CANVAS_GAP)));
      page.setAttribute("width", String(PAGE_CANVAS_WIDTH));
      page.setAttribute("height", String(PAGE_CANVAS_HEIGHT));
      page.setAttribute("rx", "3");
      page.setAttribute("fill", "#ffffff");
      page.setAttribute("pointer-events", "none");
      svg.appendChild(page);
    }
  }
  if (noteDrawingLegacyImage) {
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("href", noteDrawingLegacyImage);
    image.setAttribute("width", String(drawingWorkspaceWidth()));
    image.setAttribute("height", String(drawingWorkspaceHeight()));
    image.setAttribute("preserveAspectRatio", "none");
    image.setAttribute("opacity", "0.7");
    svg.appendChild(image);
  }
  noteDrawingImages.forEach((imageItem) => {
    if (!imageItem?.src) return;
    const centerX = imageItem.x + imageItem.width / 2;
    const centerY = imageItem.y + imageItem.height / 2;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.noteImageLayer = imageItem.layer === "back" ? "back" : "front";
    group.setAttribute("transform", `rotate(${Number(imageItem.rotation) || 0} ${centerX} ${centerY})`);
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.dataset.noteImageId = imageItem.id;
    image.setAttribute("href", imageItem.src);
    image.setAttribute("x", String(imageItem.x));
    image.setAttribute("y", String(imageItem.y));
    image.setAttribute("width", String(imageItem.width));
    image.setAttribute("height", String(imageItem.height));
    image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    image.style.cursor = noteDrawingTool === "cursor" ? "move" : "crosshair";
    const selectAndMoveImage = (event) => {
      if (noteDrawingTool !== "cursor") return;
      event.preventDefault(); event.stopPropagation();
      selectedNoteImageId = imageItem.id;
      selectedCanvasTextId = null;
      pushDrawingNoteHistory();
      const point = noteCanvasPoint(event);
      noteImageTransform = { mode: "move", pointerId: event.pointerId, start: point, original: { ...imageItem } };
      viewport.setPointerCapture(event.pointerId);
      renderDrawingNoteVectors();
    };
    image.addEventListener("pointerdown", selectAndMoveImage);
    group.appendChild(image);
    const imageHitTarget = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    imageHitTarget.dataset.noteImageId = imageItem.id;
    imageHitTarget.setAttribute("x", String(imageItem.x));
    imageHitTarget.setAttribute("y", String(imageItem.y));
    imageHitTarget.setAttribute("width", String(imageItem.width));
    imageHitTarget.setAttribute("height", String(imageItem.height));
    imageHitTarget.setAttribute("fill", "rgba(0,0,0,0.001)");
    imageHitTarget.setAttribute("pointer-events", noteDrawingTool === "cursor" ? "all" : "none");
    imageHitTarget.style.cursor = noteDrawingTool === "cursor" ? "move" : "crosshair";
    imageHitTarget.addEventListener("pointerdown", selectAndMoveImage);
    group.appendChild(imageHitTarget);
    if (imageItem.caption) {
      const captionScale = drawingWorkspaceWidth() / Math.max(1, svg.getBoundingClientRect().width);
      const caption = document.createElementNS("http://www.w3.org/2000/svg", "text");
      caption.setAttribute("x", String(centerX));
      caption.setAttribute("y", String(imageItem.y + imageItem.height + 18 * captionScale));
      caption.setAttribute("text-anchor", "middle");
      caption.setAttribute("font-size", String(12 * captionScale));
      caption.setAttribute("font-family", "Arial, sans-serif");
      caption.setAttribute("fill", "#34384a");
      caption.setAttribute("stroke", "none");
      caption.textContent = imageItem.caption;
      group.appendChild(caption);
    }
    if (selectedNoteImageId === imageItem.id) {
      const selectionScale = drawingWorkspaceWidth() / Math.max(1, svg.getBoundingClientRect().width);
      const outline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      outline.setAttribute("x", String(imageItem.x)); outline.setAttribute("y", String(imageItem.y));
      outline.setAttribute("width", String(imageItem.width)); outline.setAttribute("height", String(imageItem.height));
      outline.setAttribute("fill", "none"); outline.setAttribute("stroke", "#665ee8"); outline.setAttribute("stroke-width", String(2 * selectionScale)); outline.setAttribute("stroke-dasharray", `${6 * selectionScale} ${4 * selectionScale}`);
      outline.setAttribute("pointer-events", "none"); group.appendChild(outline);
      const addHandle = (kind, x, y, cursor, symbol) => {
        const handleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        handleGroup.dataset.noteImageControl = kind;
        handleGroup.style.cursor = cursor;
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        handle.setAttribute("cx", String(x)); handle.setAttribute("cy", String(y)); handle.setAttribute("r", String(10 * selectionScale));
        handle.setAttribute("fill", "#ffffff"); handle.setAttribute("stroke", kind === "delete" ? "#c6544b" : "#665ee8"); handle.setAttribute("stroke-width", String(2 * selectionScale));
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
        icon.setAttribute("x", String(x)); icon.setAttribute("y", String(y + 3.6 * selectionScale));
        icon.setAttribute("text-anchor", "middle"); icon.setAttribute("font-size", String(11 * selectionScale));
        icon.setAttribute("font-family", "Arial, sans-serif"); icon.setAttribute("font-weight", "800");
        icon.setAttribute("fill", kind === "delete" ? "#c6544b" : "#665ee8"); icon.setAttribute("stroke", "none"); icon.setAttribute("pointer-events", "none");
        icon.textContent = symbol;
        handleGroup.addEventListener("pointerdown", (event) => {
          event.preventDefault(); event.stopPropagation();
          if (kind === "delete") {
            pushDrawingNoteHistory();
            noteDrawingImages = noteDrawingImages.filter((candidate) => candidate.id !== imageItem.id);
            selectedNoteImageId = null;
            renderDrawingNoteVectors();
            saveDrawingNote();
            return;
          }
          const point = noteCanvasPoint(event);
          pushDrawingNoteHistory();
          noteImageTransform = { mode: kind, pointerId: event.pointerId, start: point, original: { ...imageItem } };
          viewport.setPointerCapture(event.pointerId);
        });
        handleGroup.append(handle, icon);
        group.appendChild(handleGroup);
      };
      addHandle("delete", imageItem.x, imageItem.y, "pointer", "×");
      addHandle("resize", imageItem.x + imageItem.width, imageItem.y + imageItem.height, "nwse-resize", "↘");
      const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
      stem.setAttribute("x1", String(centerX)); stem.setAttribute("y1", String(imageItem.y)); stem.setAttribute("x2", String(centerX)); stem.setAttribute("y2", String(imageItem.y - 27 * selectionScale));
      stem.setAttribute("stroke", "#665ee8"); stem.setAttribute("stroke-width", String(2 * selectionScale)); stem.setAttribute("pointer-events", "none"); group.appendChild(stem);
      addHandle("rotate", centerX, imageItem.y - 37 * selectionScale, "grab", "↻");
    }
    svg.appendChild(group);
  });
  const selectedImage = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  const imageOptions = $("#note-image-options");
  if (imageOptions) imageOptions.hidden = !selectedImage || noteDrawingTool !== "cursor";
  const backgroundButton = $("#remove-note-image-background");
  if (backgroundButton) backgroundButton.title = "Remove the selected image's background";
  const pushFrontButton = $("#push-note-image-front");
  if (pushFrontButton) {
    pushFrontButton.disabled = Boolean(selectedImage) && selectedImage.layer !== "back";
    pushFrontButton.title = selectedImage?.layer === "back" ? "Move this image in front of the canvas content" : "This image is already in front of the canvas content";
  }
  const pushBackButton = $("#push-note-image-back");
  if (pushBackButton) {
    pushBackButton.disabled = selectedImage?.layer === "back";
    pushBackButton.title = selectedImage?.layer === "back" ? "This image is already behind the canvas content" : selectedImage ? "Move this image behind the other canvas content" : "Select an image to move it behind the other canvas content";
  }
  [...noteDrawingStrokes, ...(currentNoteStroke ? [currentNoteStroke] : [])].forEach((stroke) => {
    if (!stroke.points?.length) return;
    if (stroke.tool === "calligraphy") {
      const points = stroke.points;
      const nibAngle = -Math.PI / 4;
      if (points.length === 1) {
        const mark = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const halfLength = stroke.width / 2;
        mark.setAttribute("d", `M${points[0].x - Math.cos(nibAngle) * halfLength} ${points[0].y - Math.sin(nibAngle) * halfLength} L${points[0].x + Math.cos(nibAngle) * halfLength} ${points[0].y + Math.sin(nibAngle) * halfLength}`);
        mark.setAttribute("fill", "none");
        mark.setAttribute("stroke", stroke.color);
        mark.setAttribute("stroke-width", String(Math.max(1, stroke.width * 0.16)));
        mark.setAttribute("stroke-linecap", "square");
        svg.appendChild(mark);
        return;
      }
      for (let index = 1; index < points.length; index += 1) {
        const from = points[index - 1];
        const to = points[index];
        const direction = Math.atan2(to.y - from.y, to.x - from.x);
        const apparentWidth = Math.max(stroke.width * 0.14, stroke.width * Math.abs(Math.sin(direction - nibAngle)));
        const segment = document.createElementNS("http://www.w3.org/2000/svg", "path");
        segment.setAttribute("d", `M${from.x.toFixed(2)} ${from.y.toFixed(2)} L${to.x.toFixed(2)} ${to.y.toFixed(2)}`);
        segment.setAttribute("fill", "none");
        segment.setAttribute("stroke", stroke.color);
        segment.setAttribute("stroke-width", String(apparentWidth));
        segment.setAttribute("stroke-linecap", "square");
        segment.setAttribute("stroke-linejoin", "round");
        svg.appendChild(segment);
      }
      return;
    }
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", drawingStrokePath(stroke));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", stroke.color);
    path.setAttribute("stroke-width", String(stroke.width));
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    if (stroke.tool === "highlighter") path.setAttribute("opacity", "0.25");
    if (stroke.tool === "pencil") path.setAttribute("opacity", "0.62");
    if (stroke.tool === "marker") path.setAttribute("opacity", "0.86");
    svg.appendChild(path);
  });
  $$('g[data-note-image-layer="front"]', svg).forEach((group) => svg.appendChild(group));
  renderOpenNoteTextLayer();
  viewport.scrollLeft = preservedScrollLeft;
  viewport.scrollTop = preservedScrollTop;
}

function renderOpenNoteTextLayer() {
  const svg = drawingNoteCanvas();
  const layer = document.getElementById("open-note-text-layer");
  if (!svg || !layer) return;
  const viewport = svg.parentElement;
  if (!viewport.dataset.textLayerScrollWired) {
    viewport.dataset.textLayerScrollWired = "true";
    viewport.addEventListener("scroll", () => {
      if (document.activeElement?.closest?.("#open-note-text-layer")) return;
      renderOpenNoteTextLayer();
    }, { passive: true });
  }
  const preservedScrollLeft = viewport.scrollLeft;
  const preservedScrollTop = viewport.scrollTop;
  layer.replaceChildren();
  const showLayer = activeNotebookNote()?.type === "drawing" && !(noteCanvasMode === "page" && notePageLayout === "document");
  layer.hidden = !showLayer;
  if (!showLayer) return;
  if (layer.parentElement !== document.body) document.body.appendChild(layer);
  const rect = svg.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const scaleX = rect.width / drawingWorkspaceWidth();
  const scaleY = rect.height / drawingWorkspaceHeight();
  const visualScale = noteCanvasMode === "open" ? Math.max(0.1, noteDrawingZoom) : 1;
  layer.style.left = `${viewportRect.left}px`;
  layer.style.top = `${viewportRect.top}px`;
  layer.style.width = `${viewportRect.width}px`;
  layer.style.height = `${viewportRect.height}px`;
  noteDrawingTexts.forEach((textItem) => {
    const shell = document.createElement("div");
    shell.className = "canvas-text-shell";
    shell.style.left = `${rect.left - viewportRect.left + textItem.x * scaleX}px`;
    shell.style.top = `${rect.top - viewportRect.top + textItem.y * scaleY}px`;
    shell.style.width = `${Math.max(24, Math.min(440, (Number(textItem.screenWidth) || 180) * visualScale))}px`;
    shell.style.height = `${Math.max(16, Math.min(240, (Number(textItem.screenHeight) || 36) * visualScale))}px`;
    const removeButton = document.createElement("button");
    removeButton.className = "canvas-text-delete";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", "Delete text");
    removeButton.title = "Delete text";
    removeButton.textContent = "🗑";
    removeButton.addEventListener("pointerdown", (event) => { event.preventDefault(); event.stopPropagation(); });
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      noteDrawingTexts = noteDrawingTexts.filter((item) => item.id !== textItem.id);
      if (selectedCanvasTextId === textItem.id) selectedCanvasTextId = null;
      renderDrawingNoteVectors();
      saveDrawingNote();
    });
    const editor = document.createElement("textarea");
    editor.className = "canvas-text-editor";
    editor.dataset.canvasTextId = textItem.id;
    editor.value = textItem.text || "";
    editor.placeholder = "Type here…";
    editor.setAttribute("aria-label", "Canvas text");
    editor.style.fontSize = `${Math.max(5, Math.min(72, (Number(textItem.screenFontSize) || 16) * visualScale))}px`;
    editor.style.fontFamily = textItem.fontFamily || "Arial";
    editor.style.color = textItem.color || "#171b2d";
    editor.style.fontWeight = textItem.bold ? "760" : textItem.style === "h1" || textItem.style === "h2" ? "760" : textItem.style === "h3" ? "700" : "400";
    editor.style.fontStyle = textItem.italic ? "italic" : "normal";
    const rememberViewport = () => ({
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    });
    const restoreViewport = (position) => {
      if (!position) return;
      viewport.scrollLeft = position.left;
      viewport.scrollTop = position.top;
    };
    editor.addEventListener("keydown", () => { editor._canvasViewportPosition = rememberViewport(); });
    editor.addEventListener("input", () => {
      const viewportPosition = editor._canvasViewportPosition || rememberViewport();
      textItem.text = editor.value || "";
      const nextHeight = Math.max(34, Math.min(160, editor.scrollHeight + 2));
      shell.style.height = `${nextHeight}px`;
      textItem.screenHeight = nextHeight / visualScale;
      saveDrawingNote();
      restoreViewport(viewportPosition);
      window.requestAnimationFrame(() => {
        restoreViewport(viewportPosition);
        window.requestAnimationFrame(() => restoreViewport(viewportPosition));
      });
      window.setTimeout(() => restoreViewport(viewportPosition), 50);
    });
    editor.addEventListener("pointerdown", (event) => { event.stopPropagation(); selectedCanvasTextId = textItem.id; syncCanvasTextOptions(textItem); });
    editor.addEventListener("focus", () => { selectedCanvasTextId = textItem.id; syncCanvasTextOptions(textItem); });
    editor.addEventListener("blur", () => window.setTimeout(() => {
      if (document.activeElement?.closest?.("#canvas-text-options")) return;
      if ((textItem.text || "").trim()) return;
      if (Date.now() - Number(textItem.createdAt || 0) < 600) return;
      noteDrawingTexts = noteDrawingTexts.filter((item) => item.id !== textItem.id);
      if (selectedCanvasTextId === textItem.id) selectedCanvasTextId = null;
      renderDrawingNoteVectors();
      saveDrawingNote();
    }, 0));
    shell.appendChild(editor);
    shell.appendChild(removeButton);
    layer.appendChild(shell);
  });
  viewport.scrollLeft = preservedScrollLeft;
  viewport.scrollTop = preservedScrollTop;
}

function loadDrawingNoteImage(dataUrl, strokes, texts, images = []) {
  noteDrawingLegacyImage = dataUrl || "";
  noteDrawingStrokes = Array.isArray(strokes) ? strokes : [];
  noteDrawingTexts = Array.isArray(texts) ? texts.filter((item) => (item?.text || "").trim()) : [];
  noteDrawingImages = Array.isArray(images) ? images.filter((item) => item?.src) : [];
  selectedNoteImageId = null;
  noteImageTransform = null;
  currentNoteStroke = null;
  noteDrawingHistory = [];
  noteDrawingRedoHistory = [];
  renderDrawingNoteVectors();
}

function drawingNoteSnapshot() {
  return JSON.stringify({ strokes: noteDrawingStrokes, texts: noteDrawingTexts, images: noteDrawingImages, legacy: noteDrawingLegacyImage });
}

function pushDrawingNoteHistory() {
  noteDrawingHistory.push(drawingNoteSnapshot());
  if (noteDrawingHistory.length > 40) noteDrawingHistory.shift();
  noteDrawingRedoHistory = [];
}

function eraseDrawingAt(point, radius) {
  const erased = (candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) <= radius;
  const segmentDistance = (from, to) => {
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    if (!lengthSquared) return Math.hypot(point.x - from.x, point.y - from.y);
    const position = Math.max(0, Math.min(1, ((point.x - from.x) * deltaX + (point.y - from.y) * deltaY) / lengthSquared));
    return Math.hypot(point.x - (from.x + deltaX * position), point.y - (from.y + deltaY * position));
  };
  noteDrawingStrokes = noteDrawingStrokes.flatMap((stroke) => {
    const source = Array.isArray(stroke.points) ? stroke.points : [];
    if (!source.length) return [];
    const nearEraser = source.some(erased) || source.slice(1).some((candidate, index) => segmentDistance(source[index], candidate) <= radius);
    if (!nearEraser) return [stroke];
    if (source.length === 1) return erased(source[0]) ? [] : [stroke];
    const sampled = [source[0]];
    for (let index = 1; index < source.length; index += 1) {
      const from = source[index - 1];
      const to = source[index];
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius / 2)));
      for (let step = 1; step <= steps; step += 1) {
        const amount = step / steps;
        sampled.push({ x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount });
      }
    }
    const fragments = [];
    let fragment = [];
    sampled.forEach((candidate) => {
      if (erased(candidate)) {
        if (fragment.length > 1) fragments.push({ ...stroke, points: fragment });
        fragment = [];
      } else {
        fragment.push(candidate);
      }
    });
    if (fragment.length > 1) fragments.push({ ...stroke, points: fragment });
    return fragments;
  });
}

function restoreDrawingNoteSnapshot(snapshot, afterRestore) {
  try {
    const restored = JSON.parse(snapshot || "{}");
    noteDrawingStrokes = Array.isArray(restored.strokes) ? restored.strokes : [];
    noteDrawingTexts = Array.isArray(restored.texts) ? restored.texts : [];
    noteDrawingImages = Array.isArray(restored.images) ? restored.images : [];
    noteDrawingLegacyImage = restored.legacy || "";
  } catch {
    noteDrawingStrokes = [];
    noteDrawingTexts = [];
    noteDrawingImages = [];
  }
  currentNoteStroke = null;
  renderDrawingNoteVectors();
  afterRestore?.();
}

function saveDrawingNote() {
  updateNotebookNote({ title: $("#drawing-note-title").value.trim() || "Untitled note", canvasMode: noteCanvasMode, pageCount: notePageCount, pageLayout: notePageLayout, pageDocumentContent: notePageDocumentContent, documentPages: noteDocumentPages, activeDocumentPage, documentLineSpacing: noteDocumentLineSpacing, showPageNumbers: noteShowPageNumbers, drawing: noteDrawingLegacyImage, drawingStrokes: noteDrawingStrokes, drawingTexts: noteDrawingTexts, drawingImages: noteDrawingImages, drawingWidth: drawingWorkspaceWidth(), drawingHeight: drawingWorkspaceHeight() }, false);
  $("#drawing-note-status").textContent = "Saved locally";
}

async function clipboardImageDataUrl(file) {
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("The copied image could not be read."));
    reader.readAsDataURL(file);
  });
  const image = await loadExportImage(source);
  if (!image) throw new Error("The copied image could not be opened.");
  const maximumSide = 1800;
  const scale = Math.min(1, maximumSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return { src: canvas.toDataURL("image/webp", .88), width: canvas.width, height: canvas.height };
}

async function pasteImageIntoCanvas(file) {
  const pasted = await clipboardImageDataUrl(file);
  const canvasElement = drawingNoteCanvas();
  const viewport = canvasElement.parentElement;
  const viewportRect = viewport.getBoundingClientRect();
  const canvasRect = canvasElement.getBoundingClientRect();
  const point = {
    x: (viewportRect.left + viewportRect.width / 2 - canvasRect.left) * drawingWorkspaceWidth() / Math.max(1, canvasRect.width),
    y: (viewportRect.top + viewportRect.height / 2 - canvasRect.top) * drawingWorkspaceHeight() / Math.max(1, canvasRect.height),
  };
  const screenScale = Math.min(1, viewportRect.width * .46 / pasted.width, viewportRect.height * .46 / pasted.height);
  const canvasUnitsPerScreenX = drawingWorkspaceWidth() / Math.max(1, canvasRect.width);
  const canvasUnitsPerScreenY = drawingWorkspaceHeight() / Math.max(1, canvasRect.height);
  const width = Math.max(24 * canvasUnitsPerScreenX, pasted.width * screenScale * canvasUnitsPerScreenX);
  const height = Math.max(18 * canvasUnitsPerScreenY, pasted.height * screenScale * canvasUnitsPerScreenY);
  const imageItem = { id: makeLocalId("note-image"), src: pasted.src, x: Math.max(0, point.x - width / 2), y: Math.max(0, point.y - height / 2), width, height, rotation: 0, caption: "", layer: "front" };
  pushDrawingNoteHistory();
  noteDrawingImages.push(imageItem);
  selectedNoteImageId = imageItem.id;
  renderDrawingNoteVectors();
  saveDrawingNote();
  showToast("Image pasted. Drag it, use the corner to resize, the top handle to rotate, or double-click to add a caption.");
}

async function removeImageBackground(source) {
  const image = await loadExportImage(source);
  if (!image) throw new Error("The selected image could not be opened.");
  const maximumSide = 1400;
  const scale = Math.min(1, maximumSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const width = canvas.width;
  const height = canvas.height;
  const cornerIndexes = [0, width - 1, (height - 1) * width, height * width - 1];
  const backgrounds = cornerIndexes.map((index) => [data[index * 4], data[index * 4 + 1], data[index * 4 + 2]]);
  const colorDistance = (index) => {
    const offset = index * 4;
    let closest = Infinity;
    backgrounds.forEach((color) => {
      const red = data[offset] - color[0];
      const green = data[offset + 1] - color[1];
      const blue = data[offset + 2] - color[2];
      closest = Math.min(closest, Math.sqrt(red * red + green * green + blue * blue));
    });
    return closest;
  };
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (index < 0 || index >= visited.length || visited[index] || colorDistance(index) > 82) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (!visited[index]) continue;
    const distance = colorDistance(index);
    data[index * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, (distance - 24) / 58)));
  }
  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL("image/png");
}

async function removeSelectedNoteImageBackground() {
  const imageItem = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  if (!imageItem) return;
  const button = $("#remove-note-image-background");
  button.disabled = true;
  button.textContent = "Removing…";
  try {
    pushDrawingNoteHistory();
    imageItem.src = await removeImageBackground(imageItem.src);
    renderDrawingNoteVectors();
    saveDrawingNote();
    showToast("Image background removed. Undo is available if you want the original back.");
  } catch (error) {
    showToast(error?.message || "The image background could not be removed.");
  } finally {
    button.disabled = false;
    button.textContent = "Remove background";
  }
}

async function pasteImageIntoDocument(editor, file) {
  const pasted = await clipboardImageDataUrl(file);
  editor.focus();
  const availableWidth = Math.max(160, editor.clientWidth - 164);
  const availableHeight = Math.max(180, editor.clientHeight - 190);
  const scale = Math.min(1, availableWidth / pasted.width, availableHeight / pasted.height);
  const displayWidth = Math.max(80, Math.round(pasted.width * scale));
  document.execCommand("insertHTML", false, `<figure class="document-pasted-image" contenteditable="false" data-rotation="0"><img src="${pasted.src}" alt="Pasted image" style="width:min(100%,${displayWidth}px);transform:rotate(0deg)"><figcaption>Double-click to add a caption</figcaption></figure><p><br></p>`);
  saveDocumentEditor(editor);
  showToast("Image pasted. Double-click it to change size, rotation, or caption.");
}

async function pasteImageIntoActiveNote(file) {
  if (noteCanvasMode === "page" && notePageLayout === "document") {
    const editor = activeDocumentEditor();
    if (!editor) throw new Error("Choose a document page before pasting the image.");
    await pasteImageIntoDocument(editor, file);
    return;
  }
  await pasteImageIntoCanvas(file);
}

window.receiveNativeClipboardImage = async (source) => {
  if (!source || state.currentAppView !== "notes" || activeNotebookNote()?.type !== "drawing") return false;
  try {
    const blob = await (await fetch(source)).blob();
    await pasteImageIntoActiveNote(new File([blob], "Pasted image.png", { type: blob.type || "image/png" }));
    return true;
  } catch (error) {
    showToast(error?.message || "The image could not be pasted.");
    return false;
  }
};

function activeDocumentEditor() {
  return $(`[data-document-page="${activeDocumentPage}"]`);
}

function documentEditorOverflows(editor) {
  if (!editor?.textContent && !editor?.querySelector("img,table,ul,ol,h1,h2,h3")) return false;
  const range = document.createRange();
  range.selectNodeContents(editor);
  const contentRects = [...range.getClientRects()];
  if (!contentRects.length) return false;
  const contentBottom = Math.max(...contentRects.map((rect) => rect.bottom));
  const styles = window.getComputedStyle(editor);
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  return contentBottom > editor.getBoundingClientRect().bottom - paddingBottom + 1;
}

function setActiveDocumentPage(index) {
  activeDocumentPage = Math.min(Math.max(0, Number(index) || 0), noteDocumentPages.length - 1);
  $$("[data-document-page-shell]").forEach((shell) => shell.classList.toggle("active", Number(shell.dataset.documentPageShell) === activeDocumentPage));
  $("#document-page-remove").disabled = noteDocumentPages.length <= 1;
}

function saveDocumentEditor(editor) {
  if (!editor) return;
  const index = Number(editor.dataset.documentPage);
  if (!Number.isInteger(index) || index < 0) return;
  if (documentEditorOverflows(editor)) {
    const pendingInput = editor._pendingInput;
    editor.innerHTML = editor._lastValidHtml ?? noteDocumentPages[index] ?? "";
    noteDocumentPages[index] = editor.innerHTML || "";
    const nextIndex = index + 1;
    if (nextIndex >= noteDocumentPages.length) noteDocumentPages.push("");
    notePageCount = Math.max(notePageCount, noteDocumentPages.length);
    activeDocumentPage = nextIndex;
    notePageDocumentContent = noteDocumentPages[nextIndex] || "";
    configureNoteCanvas("page", notePageCount, "document");
    renderDrawingNoteVectors();
    renderDocumentPages(nextIndex);
    saveDrawingNote();
    window.requestAnimationFrame(() => {
      const nextEditor = activeDocumentEditor();
      placeCaretAtDocumentEnd(nextEditor);
      const carriedText = pendingInput?.inputType === "insertParagraph" ? "\n" : pendingInput?.data;
      if (carriedText) {
        document.execCommand("insertText", false, carriedText);
        saveDocumentEditor(nextEditor);
      }
    });
    return false;
  }
  noteDocumentPages[index] = editor.innerHTML || "";
  editor._lastValidHtml = noteDocumentPages[index];
  editor._pendingInput = null;
  setActiveDocumentPage(index);
  notePageDocumentContent = noteDocumentPages[index];
  saveDrawingNote();
  return true;
}

function placeCaretAtDocumentEnd(editor) {
  if (!editor) return;
  editor.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function placeCaretInTableCell(cell) {
  if (!cell) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function wireDocumentEditor(editor) {
  editor._lastValidHtml = editor.innerHTML || "";
  editor.addEventListener("beforeinput", (event) => {
    editor._pendingInput = { inputType: event.inputType, data: event.data ?? event.dataTransfer?.getData("text/plain") ?? "" };
  });
  editor.addEventListener("focus", () => setActiveDocumentPage(editor.dataset.documentPage));
  editor.addEventListener("pointerdown", () => setActiveDocumentPage(editor.dataset.documentPage));
  editor.addEventListener("input", () => {
    if (!editor._positioningCaret) saveDocumentEditor(editor);
  });
  editor.addEventListener("paste", (event) => {
    const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    event.preventDefault();
    pasteImageIntoDocument(editor, imageItem.getAsFile()).catch((error) => showToast(error.message || "The image could not be pasted."));
  });
  editor.addEventListener("dblclick", (event) => {
    const image = event.target.closest?.(".document-pasted-image img");
    if (!image || !editor.contains(image)) return;
    const figure = image.closest("figure");
    const requestedWidth = window.prompt("Image width in pixels:", String(Math.round(image.getBoundingClientRect().width)));
    if (requestedWidth === null) return;
    const width = Math.max(80, Math.min(650, Number(requestedWidth) || 320));
    const requestedRotation = window.prompt("Rotation in degrees:", String(Number(figure.dataset.rotation) || 0));
    if (requestedRotation === null) return;
    const rotation = Math.max(-180, Math.min(180, Number(requestedRotation) || 0));
    const caption = window.prompt("Caption (leave blank for no caption):", figure.querySelector("figcaption")?.textContent === "Double-click to add a caption" ? "" : figure.querySelector("figcaption")?.textContent || "");
    if (caption === null) return;
    image.style.width = `min(100%, ${width}px)`;
    image.style.transform = `rotate(${rotation}deg)`;
    figure.dataset.rotation = String(rotation);
    figure.querySelector("figcaption").textContent = caption.trim() || "Double-click to add a caption";
    saveDocumentEditor(editor);
  });
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const selection = window.getSelection();
      const selectionElement = selection?.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection?.anchorNode?.parentElement;
      const listItem = selectionElement?.closest?.("li");
      if (listItem && editor.contains(listItem)) {
        event.preventDefault();
        const list = listItem.parentElement;
        if (!listItem.textContent.trim()) {
          const paragraph = document.createElement("p");
          paragraph.appendChild(document.createElement("br"));
          list.after(paragraph);
          listItem.remove();
          if (!list.children.length) list.remove();
          placeCaretInTableCell(paragraph);
        } else {
          const nextItem = document.createElement("li");
          nextItem.appendChild(document.createElement("br"));
          listItem.after(nextItem);
          placeCaretInTableCell(nextItem);
        }
        saveDocumentEditor(editor);
        return;
      }
    }
    if (event.key === " ") {
      const selection = window.getSelection();
      if (selection?.rangeCount && selection.isCollapsed && editor.contains(selection.anchorNode)) {
        const anchorElement = selection.anchorNode.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode.parentElement;
        const candidateBlock = anchorElement?.closest("p, div, h1, h2, h3, li");
        const block = candidateBlock && editor.contains(candidateBlock) ? candidateBlock : editor;
        const beforeCaret = document.createRange();
        beforeCaret.selectNodeContents(block);
        beforeCaret.setEnd(selection.anchorNode, selection.anchorOffset);
        const currentLine = beforeCaret.toString().split("\n").at(-1);
        if (currentLine === "-") {
          event.preventDefault();
          document.execCommand("delete", false);
          document.execCommand("insertUnorderedList", false);
          saveDocumentEditor(editor);
          return;
        }
      }
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const selection = window.getSelection();
    const selectionElement = selection?.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection?.anchorNode?.parentElement;
    const tableCell = selectionElement?.closest?.("td,th");
    if (tableCell && editor.contains(tableCell)) {
      const table = tableCell.closest("table");
      let cells = [...table.querySelectorAll("th,td")];
      let nextIndex = cells.indexOf(tableCell) + (event.shiftKey ? -1 : 1);
      if (!event.shiftKey && nextIndex >= cells.length) {
        const columnCount = table.rows[0]?.cells.length || 1;
        const row = table.insertRow();
        for (let index = 0; index < columnCount; index += 1) row.insertCell().appendChild(document.createElement("br"));
        cells = [...table.querySelectorAll("th,td")];
        nextIndex = cells.length - columnCount;
      }
      placeCaretInTableCell(cells[Math.max(0, nextIndex)]);
      saveDocumentEditor(editor);
      return;
    }
    if (document.queryCommandState("insertUnorderedList") || document.queryCommandState("insertOrderedList")) {
      document.execCommand(event.shiftKey ? "outdent" : "indent", false);
    } else {
      document.execCommand("insertText", false, "    ");
    }
    saveDocumentEditor(editor);
  });
}

function renderDocumentPages(focusIndex = null) {
  const container = $("#page-document-pages");
  if (!container) return;
  if (!noteDocumentPages.length) noteDocumentPages = [""];
  activeDocumentPage = Math.min(Math.max(0, activeDocumentPage), noteDocumentPages.length - 1);
  container.replaceChildren(...noteDocumentPages.map((html, index) => {
    const shell = document.createElement("section");
    shell.className = `document-page-shell${index === activeDocumentPage ? " active" : ""}`;
    shell.dataset.documentPageShell = String(index);
    const label = document.createElement("div");
    label.className = "document-page-number";
    label.textContent = `Page ${index + 1}`;
    const editor = document.createElement("div");
    editor.className = "page-document-content";
    editor.contentEditable = notePageLayout === "document" ? "true" : "false";
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-multiline", "true");
    editor.setAttribute("aria-label", `Document page ${index + 1}`);
    editor.dataset.documentPage = String(index);
    editor.dataset.placeholder = "Start typing…";
    editor.style.lineHeight = noteDocumentLineSpacing;
    editor.innerHTML = html || "";
    wireDocumentEditor(editor);
    const printedNumber = document.createElement("div");
    printedNumber.className = "document-printed-page-number";
    printedNumber.textContent = String(index + 1);
    printedNumber.hidden = !noteShowPageNumbers;
    shell.append(label, editor, printedNumber);
    return shell;
  }));
  $("#document-page-remove").disabled = noteDocumentPages.length <= 1;
  if (focusIndex !== null) window.requestAnimationFrame(() => {
    const editor = $(`[data-document-page="${focusIndex}"]`);
    editor?.closest(".document-page-shell")?.scrollIntoView({ behavior: "smooth", block: "center" });
    placeCaretAtDocumentEnd(editor);
  });
}

function removeSharedNotePage(pageIndex) {
  if (notePageCount <= 1) return;
  const pageSpan = PAGE_CANVAS_HEIGHT + PAGE_CANVAS_GAP;
  const pageStart = pageIndex * pageSpan;
  const pageEnd = pageStart + pageSpan;
  noteDrawingStrokes = noteDrawingStrokes.flatMap((stroke) => {
    const points = stroke.points || [];
    if (points.some((point) => point.y >= pageStart && point.y < pageEnd)) return [];
    if (points.every((point) => point.y < pageEnd)) return [stroke];
    return [{ ...stroke, points: points.map((point) => ({ ...point, y: point.y - pageSpan })) }];
  });
  noteDrawingTexts = noteDrawingTexts.flatMap((item) => {
    if (item.y >= pageStart && item.y < pageEnd) return [];
    return [{ ...item, y: item.y >= pageEnd ? item.y - pageSpan : item.y }];
  });
  noteDrawingImages = noteDrawingImages.flatMap((item) => {
    const centerY = item.y + item.height / 2;
    if (centerY >= pageStart && centerY < pageEnd) return [];
    return [{ ...item, y: item.y >= pageEnd ? item.y - pageSpan : item.y }];
  });
  noteDocumentPages.splice(pageIndex, 1);
  notePageCount -= 1;
  activeDocumentPage = Math.min(activeDocumentPage, notePageCount - 1);
  notePageDocumentContent = noteDocumentPages[activeDocumentPage] || "";
}

function canvasTextScale() {
  const rect = drawingNoteCanvas().getBoundingClientRect();
  return drawingWorkspaceWidth() / Math.max(1, rect.width);
}

function syncCanvasTextOptions(textItem) {
  $("#canvas-text-options").hidden = false;
  const scale = canvasTextScale();
  noteCanvasTextStyle = textItem.style || "body";
  noteCanvasTextFormat = {
    fontFamily: textItem.fontFamily || "Arial",
    screenSize: Math.max(8, Number(textItem.screenFontSize) || Math.round((textItem.fontSize || 18 * scale) / scale)),
    color: textItem.color || "#171b2d",
    bold: Boolean(textItem.bold),
    italic: Boolean(textItem.italic),
  };
  $("#canvas-text-font").value = noteCanvasTextFormat.fontFamily;
  $("#canvas-text-size").value = String([8,10,12,14,16,18,20,22,24,28,32,36,42,48,56,64,72].reduce((best, size) => Math.abs(size - noteCanvasTextFormat.screenSize) < Math.abs(best - noteCanvasTextFormat.screenSize) ? size : best, 18));
  $("#canvas-text-color").value = noteCanvasTextFormat.color;
  $("[data-color-palette-for='canvas-text-color']").style.setProperty("--selected-color", noteCanvasTextFormat.color);
  $("#canvas-text-bold").classList.toggle("active", noteCanvasTextFormat.bold);
  $("#canvas-text-italic").classList.toggle("active", noteCanvasTextFormat.italic);
  $$('[data-canvas-text-style]').forEach((button) => button.classList.toggle("active", button.dataset.canvasTextStyle === noteCanvasTextStyle));
}

function applyCanvasTextFormat(changes) {
  noteCanvasTextFormat = { ...noteCanvasTextFormat, ...changes };
  const textItem = noteDrawingTexts.find((item) => item.id === selectedCanvasTextId);
  if (!textItem) return;
  Object.assign(textItem, {
    fontFamily: noteCanvasTextFormat.fontFamily,
    color: noteCanvasTextFormat.color,
    bold: noteCanvasTextFormat.bold,
    italic: noteCanvasTextFormat.italic,
    fontSize: noteCanvasTextFormat.screenSize * canvasTextScale(),
    screenFontSize: noteCanvasTextFormat.screenSize,
    style: noteCanvasTextStyle,
  });
  renderDrawingNoteVectors();
  saveDrawingNote();
  window.requestAnimationFrame(() => document.querySelector(`#open-note-text-layer [data-canvas-text-id="${textItem.id}"]`)?.focus());
}

function queueWordNoteSave() {
  $("#word-note-status").textContent = "Saving…";
  window.clearTimeout(noteSaveHandle);
  const noteId = activeNoteId;
  const title = $("#word-note-title").value.trim() || "Untitled note";
  const html = sanitizeNotesHtml($("#word-note-content").innerHTML);
  noteSaveHandle = window.setTimeout(() => {
    const notes = loadNotebookNotes();
    const index = notes.findIndex((note) => note.id === noteId);
    if (index >= 0) {
      notes[index] = { ...notes[index], title, html, updatedAt: Date.now() };
      saveNotebookNotes(notes);
      if (activeNoteId === noteId) {
        $("#word-note-status").textContent = "Saved locally";
        renderNotesList();
      }
    }
  }, 250);
}

function rememberNoteTextSelection() {
  const selection = window.getSelection();
  const editor = $("#word-note-content");
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return;
  noteTextSelection = selection.getRangeAt(0).cloneRange();
}

function restoreNoteTextSelection() {
  const editor = $("#word-note-content");
  editor.focus();
  if (!noteTextSelection) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(noteTextSelection);
}

const fullscreenWorkspaceViews = new Set(["notes"]);

function syncWorkspaceFullscreenControl() {
  const toggle = $("#notes-only-toggle");
  if (!toggle) return;
  if (!fullscreenWorkspaceViews.has(state.currentAppView)) toggle.checked = false;
}

function setWorkspaceFullscreen(active) {
  const toggle = $("#notes-only-toggle");
  if (!toggle) return;
  toggle.checked = Boolean(active);
  syncWorkspaceFullscreenControl();
  window.requestAnimationFrame(() => {
    if (state.currentAppView === "notes" && activeNotebookNote()?.type === "drawing") {
      renderOpenNoteTextLayer();
    }
  });
}
window.setWorkspaceFullscreen = setWorkspaceFullscreen;

function showAppView(view) {
  const enteringCreate = view === "create" && state.currentAppView !== "create";
  if (enteringCreate && state.notesHiddenAfterUpdate && state.editingCustomDeckId) {
    const savedDeck = loadCustomDecks().find((deck) => deck.id === state.editingCustomDeckId);
    if (savedDeck) setNotesContent(savedDeck.sourceNotes || "", savedDeck.sourceNotesHtml || "");
    state.notesHiddenAfterUpdate = false;
  }
  state.currentAppView = view;
  const openNoteTextLayer = document.getElementById("open-note-text-layer");
  if (openNoteTextLayer && view !== "notes") openNoteTextLayer.hidden = true;
  if (!fullscreenWorkspaceViews.has(view)) setWorkspaceFullscreen(false);
  const showingCourses = view === "courses";
  const showingCourse = view === "course";
  const showingFlashcards = view === "flashcards";
  const showingCreate = view === "create";
  const showingNotes = view === "notes";
  const showingExport = view === "export";
  const showingCustomStudy = view === "custom-study";
  const showingCustomDelete = view === "custom-delete";
  const showingStudyGuide = view === "study-guide";
  const showingSettings = view === "settings";
  $("#courses").hidden = !showingCourses;
  $("#course-page").hidden = !showingCourse;
  $("#flashcards").hidden = !showingFlashcards;
  $("#create").hidden = !showingCreate;
  $("#notes-page").hidden = !showingNotes;
  $("#export").hidden = !showingExport;
  $("#custom-study-page").hidden = !showingCustomStudy;
  $("#custom-delete-page").hidden = !showingCustomDelete;
  $("#study-guide-page").hidden = !showingStudyGuide;
  $("#settings-page").hidden = !showingSettings;
  $("#birthday-celebration").hidden = view !== "dashboard" || !isBirthdayToday();
  $$(".topbar, .stats-grid, .dashboard-grid").forEach((section) => { section.hidden = showingCourses || showingCourse || showingFlashcards || showingCreate || showingNotes || showingExport || showingCustomStudy || showingCustomDelete || showingStudyGuide || showingSettings; });
  const activeHref = showingSettings ? null : showingStudyGuide ? "#study-guide" : showingCustomStudy ? `#${state.customStudyReturnView}` : showingCustomDelete ? `#${state.customDeleteReturnView}` : showingExport ? "#export" : showingNotes ? "#notes" : showingCreate ? "#create" : showingFlashcards ? "#flashcards" : showingCourses || showingCourse ? "#courses" : "#dashboard";
  $$(".primary-nav .nav-item, .mobile-nav a").forEach((item) => {
    const active = item.getAttribute("href") === activeHref;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  $("#open-settings").classList.toggle("active", showingSettings);
  syncWorkspaceFullscreenControl();
  if (showingSettings) populateSettingsForm();
  if (showingCreate || showingFlashcards) renderCustomDecks();
  if (showingNotes) {
    const notes = loadNotebookNotes();
    if (!activeNoteId && notes.length) activeNoteId = notes.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))[0].id;
    openNotebookNote(activeNoteId);
  }
  if (showingExport) renderExportPage();
  if (view === "dashboard") renderActiveAnkiDecks();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateSettingsForm() {
  const settings = loadSettings();
  const form = $("#settings-form");
  Object.entries(settings).forEach(([name, value]) => {
    const fields = form.elements[name];
    if (fields) {
      if (fields.type === "checkbox") fields.checked = Boolean(value);
      else fields.value = String(value);
    }
  });
  const profile = loadProfile();
  $("#settings-profile-name").value = profile?.name || "";
  populateBirthdaySelects($("#settings-profile-birth-month"), $("#settings-profile-birth-day"), profile?.birthday || "");
  if (state.appUpdate?.currentVersion) renderAppUpdate(state.appUpdate);
}

function renderAppUpdate(result) {
  if (!result) return;
  state.appUpdate = result;
  const version = $("#app-update-version"); const status = $("#app-update-status"); const download = $("#download-app-update");
  if (!version || !status || !download) return;
  version.textContent = `Current version ${result.currentVersion || "unknown"}`;
  download.hidden = !result.available || !result.releaseUrl;
  download.dataset.releaseUrl = result.releaseUrl || "";
  if (result.error) status.textContent = "Could not check for updates. Check your internet connection and try again.";
  else if (result.available) status.textContent = `${result.releaseName || `Version ${result.latestVersion}`} is available.`;
  else status.textContent = result.message || "You have the newest published version.";
}

const nativeAppUpdateResolvers = new Map();
window.resolveNativeAppUpdate = (requestId, result) => {
  const resolve = nativeAppUpdateResolvers.get(String(requestId));
  if (!resolve) return;
  nativeAppUpdateResolvers.delete(String(requestId));
  resolve(result || { available: false, error: "The native update check did not return a result." });
};

function checkForUpdatesWithNativeMac() {
  const handler = window.webkit?.messageHandlers?.appUpdateCheck;
  if (!handler) return null;
  const requestId = makeLocalId("update-check");
  return new Promise((resolve) => {
    nativeAppUpdateResolvers.set(requestId, resolve);
    handler.postMessage({ requestId });
  });
}

async function checkForAppUpdates(showFeedback = true) {
  const button = $("#check-for-updates"); const status = $("#app-update-status");
  const nativeMacCheck = checkForUpdatesWithNativeMac();
  if (!window.desktopApp?.checkForUpdates && !nativeMacCheck) {
    if (status) status.textContent = "Update checking is available in the installed desktop app.";
    return;
  }
  if (button) button.disabled = true;
  if (status && showFeedback) status.textContent = "Checking GitHub for updates…";
  const result = nativeMacCheck ? await nativeMacCheck : await window.desktopApp.checkForUpdates();
  renderAppUpdate(result);
  if (button) button.disabled = false;
  if (showFeedback && result?.available) showToast(`${result.releaseName || `Version ${result.latestVersion}`} is ready to download.`);
}

function settingsFromForm() {
  const data = new FormData($("#settings-form"));
  const settings = { ...DEFAULT_SETTINGS };
  Object.keys(settings).forEach((key) => { if (data.has(key)) settings[key] = data.get(key); });
  ["newCardsPerDay", "maxReviewsPerDay", "desiredRetention", "dayStartHour", "learnAheadMinutes", "graduatingInterval", "easyInterval", "startingEase", "hardInterval", "easyBonus", "intervalModifier", "maximumInterval", "minimumLapseInterval", "leechThreshold"].forEach((key) => { settings[key] = Number(settings[key]); });
  ["enableFuzz", "newCardsIgnoreReviewLimit", "buryNewSiblings", "buryReviewSiblings", "buryLearningSiblings"].forEach((key) => { settings[key] = data.has(key); });
  settings.learningSteps = parseAnkiSteps(settings.learningSteps).join(" ");
  settings.relearningSteps = parseAnkiSteps(settings.relearningSteps).join(" ");
  return settings;
}

function selectSettingsTab(tabName) {
  $$('[data-settings-tab]').forEach((button) => {
    const active = button.dataset.settingsTab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-settings-panel]').forEach((panel) => { panel.hidden = panel.dataset.settingsPanel !== tabName; });
}

function setDateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  $("h1").firstChild.textContent = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, Kai `;
  $("#today-label").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function renderLibraryPagination(selector, currentPage, itemCount, pageSize, onChange) {
  const container = $(selector);
  if (!container) return;
  if (itemCount <= pageSize) { container.innerHTML = ""; return; }
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  const page = Math.min(Math.max(0, currentPage), pageCount - 1);
  container.innerHTML = `<button type="button" data-page="first" ${page === 0 ? "disabled" : ""}>First</button><button type="button" data-page="previous" ${page === 0 ? "disabled" : ""}>Previous</button><span>Page ${page + 1} of ${pageCount}</span><button type="button" data-page="next" ${page >= pageCount - 1 ? "disabled" : ""}>Next</button><button type="button" data-page="last" ${page >= pageCount - 1 ? "disabled" : ""}>Last</button>`;
  $$('[data-page]', container).forEach((button) => button.addEventListener("click", () => {
    const destination = button.dataset.page === "first" ? 0 : button.dataset.page === "previous" ? page - 1 : button.dataset.page === "next" ? page + 1 : pageCount - 1;
    onChange(Math.min(Math.max(0, destination), pageCount - 1));
  }));
}

function renderCourseShelf(filter = "") {
  const query = filter.trim().toLowerCase();
  const matches = courses.filter((course) => `${course.title} ${course.code} ${course.level} ${course.sourceTitle || ""} ${course.description}`.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(matches.length / TEXTBOOKS_PER_PAGE));
  state.textbookCatalogPage = Math.min(state.textbookCatalogPage, pageCount - 1);
  const pageMatches = matches.slice(state.textbookCatalogPage * TEXTBOOKS_PER_PAGE, (state.textbookCatalogPage + 1) * TEXTBOOKS_PER_PAGE);
  $("#course-shelf").innerHTML = pageMatches.map((course) => `
    <article class="course-tile catalog-course">
      <div class="course-cover ${course.color}"><span>${course.icon}</span><small>${course.code}</small></div>
      <div class="course-tile-copy"><span>${course.level} · ${course.duration}</span><h3>${course.title}</h3><p>${course.description}</p><small class="book-status connected">● Ready to add</small></div>
      <button class="button course-add" type="button" data-add-course="${course.id}" ${isEnrolled(course.id) ? "disabled" : ""}>${isEnrolled(course.id) ? "Added" : "Add textbook"}</button>
    </article>`).join("") || '<p class="empty-search">No available textbooks match that search.</p>';
  $$('[data-add-course]').forEach((button) => button.addEventListener("click", () => addCourse(button.dataset.addCourse)));
  renderLibraryPagination("#textbook-catalog-pagination", state.textbookCatalogPage, matches.length, TEXTBOOKS_PER_PAGE, (page) => {
    state.textbookCatalogPage = page;
    renderCourseShelf($("#catalog-courses-search").value);
  });
  renderMyCourses($("#my-courses-search").value);
}

function enrolledCourseIds() {
  try { return JSON.parse(localStorage.getItem("study-desk-enrolled-courses") || "[]"); }
  catch { return []; }
}

function isEnrolled(courseId) {
  return enrolledCourseIds().includes(courseId);
}

function addCourse(courseId) {
  const enrolled = new Set(enrolledCourseIds());
  enrolled.add(courseId);
  localStorage.setItem("study-desk-enrolled-courses", JSON.stringify([...enrolled]));
  const matchingDeckId = `textbook-${courseId}`;
  const addedDecks = new Set(addedFlashcardCollectionIds());
  const hasMatchingDeck = builtInFlashcardCollections.some((collection) => collection.id === matchingDeckId);
  if (hasMatchingDeck) {
    addedDecks.add(matchingDeckId);
    localStorage.setItem("study-desk-added-flashcard-collections", JSON.stringify([...addedDecks]));
    renderCustomDecks();
  }
  renderCourseShelf($("#catalog-courses-search").value);
  const course = courses.find((item) => item.id === courseId);
  showToast(`${course?.title || "Textbook"} and its study set were added.`);
}

function removeCourse(courseId, event) {
  event.stopPropagation();
  localStorage.setItem("study-desk-enrolled-courses", JSON.stringify(enrolledCourseIds().filter((id) => id !== courseId)));
  renderCourseShelf($("#catalog-courses-search").value);
  const course = courses.find((item) => item.id === courseId);
  showToast(`${course?.title || "Textbook"} removed from My textbooks.`);
}

function renderMyCourses(filter = "") {
  const query = filter.trim().toLowerCase();
  const allEnrolled = courses.filter((course) => isEnrolled(course.id));
  const enrolled = allEnrolled.filter((course) => `${course.title} ${course.code} ${course.level} ${course.sourceTitle || ""} ${course.description}`.toLowerCase().includes(query));
  $("#my-course-shelf").innerHTML = enrolled.length ? enrolled.map((course) => `
    <article class="course-tile enrolled-course" data-course="${course.id}">
      <div class="course-cover ${course.color}"><span>${course.icon}</span><small>${course.code}</small></div>
      <div class="course-tile-copy"><span>My textbook · ${course.duration}</span><h3>${course.title}</h3><p>Continue your lessons, flashcards, and quizzes.</p></div>
      <button class="course-remove" type="button" data-remove-course="${course.id}" aria-label="Remove ${course.title}">Remove</button>
    </article>`).join("") : query ? '<div class="empty-my-courses"><strong>No added textbooks match</strong><span>Try a different title, subject, or code.</span></div>' : '<div class="empty-my-courses"><strong>No textbooks added yet</strong><span>Choose a textbook from the catalog below.</span></div>';
  $$(".enrolled-course").forEach((tile) => tile.addEventListener("click", () => openCourse(tile.dataset.course)));
  $$('[data-remove-course]').forEach((button) => button.addEventListener("click", (event) => removeCourse(button.dataset.removeCourse, event)));
  const returnAllButton = $("#return-all-textbooks");
  if (returnAllButton) returnAllButton.disabled = allEnrolled.length === 0;
}

function resetAnkiReview() {
  state.selectedAnkiDecks = null;
  state.ankiQueue = [];
  state.ankiPosition = 0;
  state.ankiSessionTotal = 0;
  state.ankiReviewActive = false;
  state.ankiStartedAt = null;
}

function resetFlashcardReview() {
  state.selectedFlashcardDecks = null;
  state.flashcardQueue = [];
  state.flashcardPosition = 0;
  state.flashcardReviewActive = false;
}

function resetFeynmanStudy() {
  state.selectedFeynmanDecks = null;
  state.feynmanQueue = [];
  state.feynmanPosition = 0;
  state.feynmanActive = false;
  state.feynmanFinished = false;
  state.feynmanStartedAt = null;
  state.feynmanResponse = "";
}

function openCourse(courseId, chapterIndex = 0, view = "lesson") {
  state.courseReturnView = !$("#flashcards").hidden ? "flashcards" : "courses";
  state.activeCourse = courses.find((course) => course.id === courseId) || courses[0];
  state.activeChapter = Math.max(0, Math.min(chapterIndex, state.activeCourse.chapters.length - 1));
  state.activeMiniUnit = 0;
  state.activeSection = 0;
  state.activeView = view;
  resetAnkiReview();
  resetFlashcardReview();
  resetFeynmanStudy();
  $("#library-dialog-kicker").textContent = state.activeCourse.code;
  $("#library-dialog-title").textContent = state.activeCourse.title;
  $("#close-library-button").textContent = state.courseReturnView === "flashcards" ? "← Back to Study" : "← Back to textbooks";
  renderChapterSidebar();
  renderLesson();
  showAppView("course");
  window.setTimeout(() => $("#lesson-view").focus(), 40);
}

function showLibraryOverview() {
  state.activeCourse = null;
  showAppView(state.courseReturnView);
}

function renderChapterSidebar() {
  const course = state.activeCourse;
  const miniUnitCount = course.chapters.reduce((total, unit) => total + unit.miniUnits.length, 0);
  const isAtkins = course.id === "physical-chemistry";
  const usesChapters = isAtkins || ["general-chemistry", "central-science"].includes(course.id);
  const groupLabel = isAtkins ? "Part" : "Unit";
  const itemLabel = usesChapters ? "chapters" : "mini-units";
  $("#chapter-sidebar").innerHTML = `<div class="course-mini ${course.color}"><span>${course.icon}</span><div><strong>${course.code}</strong><small>${course.chapters.length} ${groupLabel.toLowerCase()}s · ${miniUnitCount} ${itemLabel}</small></div></div><p class="chapter-label">Textbook structure</p>${course.chapters.map((unit, unitIndex) => {
    const unitCollapsed = state.collapsedCourseUnits.has(`${course.id}:${unitIndex}`);
    return `<div class="unit-group"><button class="chapter-button unit-button ${unitIndex === state.activeChapter ? "active" : ""}" data-unit="${unitIndex}" aria-expanded="${unitIndex === state.activeChapter && !unitCollapsed}"><span>${groupLabel} ${unitIndex + 1} · ${unit.miniUnits.length} ${itemLabel}</span><strong>${unit.title}</strong><i class="structure-chevron">${unitIndex === state.activeChapter && !unitCollapsed ? "⌃" : "⌄"}</i></button>${unitIndex === state.activeChapter && !unitCollapsed ? `<div class="mini-unit-list">${unit.miniUnits.map((chapter, miniIndex) => {
      const chapterKey = `${course.id}:${unitIndex}:${miniIndex}`;
      const chapterCollapsed = state.collapsedCourseChapters.has(chapterKey);
      const hasSections = Boolean(chapter.sections?.length);
      return `<button class="mini-unit-button ${miniIndex === state.activeMiniUnit ? "active" : ""}" data-mini-unit="${miniIndex}" aria-label="Chapter ${chapter.number}: ${escapeHtml(chapter.title)}" ${hasSections ? `aria-expanded="${miniIndex === state.activeMiniUnit && !chapterCollapsed}"` : ""}><span>${chapter.number}</span><strong>${chapter.title}</strong>${hasSections ? `<i class="structure-chevron">${miniIndex === state.activeMiniUnit && !chapterCollapsed ? "⌃" : "⌄"}</i>` : ""}</button>${miniIndex === state.activeMiniUnit && hasSections && !chapterCollapsed ? `<div class="atkins-section-list">${chapter.sections.map((section, sectionIndex) => `<button type="button" class="atkins-section-button ${sectionIndex === state.activeSection ? "active" : ""}" data-atkins-section="${sectionIndex}">${section.title}</button>`).join("")}</div>` : ""}`;
    }).join("")}</div>` : ""}</div>`;
  }).join("")}`;
  $$("[data-unit]", $("#chapter-sidebar")).forEach((button) => button.addEventListener("click", () => {
    const nextUnit = Number(button.dataset.unit);
    const key = `${course.id}:${nextUnit}`;
    if (nextUnit === state.activeChapter) {
      if (state.collapsedCourseUnits.has(key)) state.collapsedCourseUnits.delete(key); else state.collapsedCourseUnits.add(key);
      renderChapterSidebar();
      return;
    }
    state.activeChapter = nextUnit;
    state.collapsedCourseUnits.delete(key);
    state.activeMiniUnit = 0;
    state.activeSection = 0;
    state.activeView = "lesson";
    resetAnkiReview();
    resetFlashcardReview();
    resetFeynmanStudy();
    renderChapterSidebar();
    renderLesson();
  }));
  $$("[data-mini-unit]", $("#chapter-sidebar")).forEach((button) => button.addEventListener("click", () => {
    const nextMiniUnit = Number(button.dataset.miniUnit);
    const chapterKey = `${course.id}:${state.activeChapter}:${nextMiniUnit}`;
    if (nextMiniUnit === state.activeMiniUnit && course.chapters[state.activeChapter].miniUnits[nextMiniUnit].sections?.length) {
      if (state.collapsedCourseChapters.has(chapterKey)) state.collapsedCourseChapters.delete(chapterKey); else state.collapsedCourseChapters.add(chapterKey);
      renderChapterSidebar();
      return;
    }
    state.activeMiniUnit = nextMiniUnit;
    state.collapsedCourseChapters.delete(chapterKey);
    state.activeSection = 0;
    state.activeView = "lesson";
    resetAnkiReview();
    resetFlashcardReview();
    resetFeynmanStudy();
    renderChapterSidebar();
    renderLesson();
  }));
  $$('[data-atkins-section]', $("#chapter-sidebar")).forEach((button) => button.addEventListener("click", () => {
    state.activeSection = Number(button.dataset.atkinsSection);
    state.activeView = "lesson";
    renderChapterSidebar();
    renderLesson();
  }));
}

function renderLesson() {
  window.clearInterval(ankiTimerHandle);
  window.clearInterval(feynmanTimerHandle);
  const unit = state.activeCourse.chapters[state.activeChapter];
  const chapter = unit.miniUnits[state.activeMiniUnit];
  const completedKey = `${state.activeCourse.id}-${state.activeChapter}-${state.activeMiniUnit}`;
  const completed = JSON.parse(localStorage.getItem("study-desk-completed-lessons") || "[]").includes(completedKey);
  const tabs = `<div class="lesson-tabs"><button data-view="lesson" class="${state.activeView === "lesson" ? "active" : ""}">Lesson</button><button data-view="flashcards" class="${state.activeView === "flashcards" ? "active" : ""}">Flashcards</button><button data-view="anki" class="${state.activeView === "anki" ? "active" : ""}">Anki</button><button data-view="feynman" class="${state.activeView === "feynman" ? "active" : ""}">Feynman</button><button data-view="quiz" class="${state.activeView === "quiz" ? "active" : ""}">Quiz</button></div>`;
  let body = "";
  if (state.activeView === "lesson") {
    const activeSection = chapter.sections?.[state.activeSection];
    const sectionOutline = activeSection ? `<div class="atkins-section-outline"><span>Sections</span><h4>${escapeHtml(activeSection.title)}</h4>${activeSection.topics.length ? `<div class="textbook-section-topics">${activeSection.topics.map((topic) => {
      const cleanedTopic = String(topic).replace(/^\s*[-–—•]\s*/, "").trim();
      const match = cleanedTopic.match(/^([A-Z]?\d+(?:\.\d+)*)[.:]?\s+(.+)$/);
      return match ? `<div><b>${escapeHtml(match[1])}</b><span>${escapeHtml(match[2])}</span></div>` : `<div><span>${escapeHtml(cleanedTopic)}</span></div>`;
    }).join("")}</div>` : ""}</div>` : "";
    const equationList = chapter.equations?.length ? `<div class="atkins-equations"><h4>Equations and applications</h4>${chapter.equations.map(([name, application, equation]) => `<div><strong>${escapeHtml(name)}</strong><span class="equation-display">${textbookEquationHtml(equation)}</span><span>${escapeHtml(application)}</span></div>`).join("")}</div>` : "";
    body = `<article class="lesson-article"><p class="lesson-number">Chapter ${chapter.number} · ${state.activeCourse.id === "physical-chemistry" ? "Part" : "Unit"} ${state.activeChapter + 1} of ${state.activeCourse.chapters.length}</p><h3>${chapter.title}</h3><p class="unit-context">${unit.title}</p>${sectionOutline}<p class="lesson-lead">${chapter.summary}</p><h4>Key ideas</h4><ul>${chapter.takeaways.map((idea) => `<li>${idea}</li>`).join("")}</ul>${equationList}<button class="button primary-button complete-lesson" type="button">${completed ? "✓ Chapter completed" : "Mark chapter complete"}</button></article>`;
  } else if (state.activeView === "flashcards") {
    body = renderFlashcardView();
  } else if (state.activeView === "anki") {
    body = renderAnkiView(chapter);
  } else if (state.activeView === "feynman") {
    body = renderFeynmanView();
  } else {
    const quizzes = chapter.quizzes || [chapter.quiz];
    body = `<section class="practice-view"><p class="lesson-number">Knowledge check</p><h3>${chapter.title}</h3><div class="quiz-summary"><strong>${quizzes.length} questions</strong><span id="quiz-score">0 answered</span></div><div class="offline-quiz-stack">${quizzes.map((quiz, questionIndex) => `<div class="offline-quiz" data-quiz="${questionIndex}"><small>Question ${questionIndex + 1} of ${quizzes.length}</small><strong>${quiz.question}</strong>${quiz.options.map((option, answerIndex) => `<button type="button" data-question="${questionIndex}" data-answer="${answerIndex}">${option}</button>`).join("")}<p class="quiz-feedback" aria-live="polite"></p></div>`).join("")}</div></section>`;
  }
  $("#lesson-view").innerHTML = tabs + body;
  $$("[data-view]", $("#lesson-view")).forEach((button) => button.addEventListener("click", () => { state.activeView = button.dataset.view; renderLesson(); }));
  $$("[data-anki-unit], [data-anki-mini], [data-anki-section]", $("#lesson-view")).forEach((input) => input.addEventListener("change", updateAnkiDeckSelection));
  $$("[data-flashcard-unit], [data-flashcard-mini], [data-flashcard-section]", $("#lesson-view")).forEach((input) => input.addEventListener("change", updateFlashcardDeckSelection));
  $$("[data-feynman-unit], [data-feynman-mini]", $("#lesson-view")).forEach((input) => input.addEventListener("change", updateFeynmanDeckSelection));
  const selectAll = $("[data-select-all]", $("#lesson-view"));
  if (selectAll) selectAll.addEventListener("click", () => { state.selectedAnkiDecks = allAnkiDeckKeys(); renderLesson(); });
  const clearSelection = $("[data-clear-selection]", $("#lesson-view"));
  if (clearSelection) clearSelection.addEventListener("click", () => { state.selectedAnkiDecks = []; renderLesson(); });
  const selectAllFlashcards = $("[data-select-all-flashcards]", $("#lesson-view"));
  if (selectAllFlashcards) selectAllFlashcards.addEventListener("click", () => { state.selectedFlashcardDecks = allAnkiDeckKeys(); renderLesson(); });
  const clearFlashcards = $("[data-clear-flashcards]", $("#lesson-view"));
  if (clearFlashcards) clearFlashcards.addEventListener("click", () => { state.selectedFlashcardDecks = []; renderLesson(); });
  const selectAllFeynman = $("[data-select-all-feynman]", $("#lesson-view"));
  if (selectAllFeynman) selectAllFeynman.addEventListener("click", () => { state.selectedFeynmanDecks = allAnkiDeckKeys(); renderLesson(); });
  const clearFeynman = $("[data-clear-feynman]", $("#lesson-view"));
  if (clearFeynman) clearFeynman.addEventListener("click", () => { state.selectedFeynmanDecks = []; renderLesson(); });
  const startReview = $("[data-start-anki]", $("#lesson-view"));
  if (startReview) startReview.addEventListener("click", startAnkiReview);
  const startFlashcards = $("[data-start-flashcards]", $("#lesson-view"));
  if (startFlashcards) startFlashcards.addEventListener("click", startFlashcardReview);
  const removeAnkiCardButton = $("[data-remove-anki-card]", $("#lesson-view"));
  if (removeAnkiCardButton) removeAnkiCardButton.addEventListener("dblclick", removeCurrentAnkiCard);
  const restoreAnkiCardsButton = $("[data-restore-anki-cards]", $("#lesson-view"));
  if (restoreAnkiCardsButton) restoreAnkiCardsButton.addEventListener("click", restoreRemovedAnkiCards);
  const startFeynman = $("[data-start-feynman]", $("#lesson-view"));
  if (startFeynman) startFeynman.addEventListener("click", startFeynmanStudy);
  const feynmanAmount = $("[data-feynman-time]", $("#lesson-view"));
  if (feynmanAmount) feynmanAmount.addEventListener("input", (event) => { state.feynmanTimeAmount = Math.max(1, Number(event.currentTarget.value) || 1); });
  const feynmanUnit = $("[data-feynman-time-unit]", $("#lesson-view"));
  if (feynmanUnit) feynmanUnit.addEventListener("change", (event) => { state.feynmanTimeUnit = event.currentTarget.value; });
  const feynmanResponse = $("[data-feynman-response]", $("#lesson-view"));
  if (feynmanResponse) feynmanResponse.addEventListener("input", (event) => { state.feynmanResponse = event.currentTarget.value; });
  const finishFeynman = $("[data-finish-feynman]", $("#lesson-view"));
  if (finishFeynman) finishFeynman.addEventListener("click", () => finishFeynmanPrompt(false));
  const nextFeynman = $("[data-next-feynman]", $("#lesson-view"));
  if (nextFeynman) nextFeynman.addEventListener("click", nextFeynmanPrompt);
  const feynmanBack = $(".feynman-back", $("#lesson-view"));
  if (feynmanBack) feynmanBack.addEventListener("click", () => { state.feynmanActive = false; state.feynmanStartedAt = null; state.feynmanFinished = false; state.feynmanResponse = ""; renderLesson(); });
  const ankiBack = $(".anki-back", $("#lesson-view"));
  if (ankiBack) ankiBack.addEventListener("click", () => { state.ankiReviewActive = false; state.ankiStartedAt = null; renderLesson(); });
  const flashcardBack = $("[data-flashcard-back]", $("#lesson-view"));
  if (flashcardBack) flashcardBack.addEventListener("click", () => { state.flashcardReviewActive = false; renderLesson(); });
  const previousFlashcard = $("[data-previous-flashcard]", $("#lesson-view"));
  if (previousFlashcard) previousFlashcard.addEventListener("click", () => { state.flashcardPosition = Math.max(0, state.flashcardPosition - 1); renderLesson(); });
  const nextFlashcard = $("[data-next-flashcard]", $("#lesson-view"));
  if (nextFlashcard) nextFlashcard.addEventListener("click", () => {
    if (state.flashcardPosition === state.flashcardQueue.length - 1) recordStudyActivity();
    state.flashcardPosition = (state.flashcardPosition + 1) % state.flashcardQueue.length;
    renderLesson();
  });
  const ankiCard = $(".anki-card", $("#lesson-view"));
  if (ankiCard) ankiCard.addEventListener("click", () => {
    const review = $(".anki-review", $("#lesson-view"));
    setTextbookAnkiReveal(review, !review.classList.contains("revealed"));
  });
  const revealAnkiButton = $("[data-reveal-anki]", $("#lesson-view"));
  if (revealAnkiButton) revealAnkiButton.addEventListener("click", () => {
    const review = $(".anki-review", $("#lesson-view"));
    setTextbookAnkiReveal(review, true);
  });
  $$("[data-anki-rating]", $("#lesson-view")).forEach((button) => button.addEventListener("click", () => rateAnkiCard(button.dataset.ankiRating)));
  $$("[data-answer]", $("#lesson-view")).forEach((button) => button.addEventListener("click", () => answerQuiz(button)));
  const completeButton = $(".complete-lesson");
  if (completeButton) completeButton.addEventListener("click", () => toggleLessonComplete(completedKey));
  if (state.activeView === "anki" && state.ankiReviewActive) {
    updateAnkiTimer();
    ankiTimerHandle = window.setInterval(updateAnkiTimer, 1000);
  }
  if (state.activeView === "feynman" && state.feynmanActive && !state.feynmanFinished) {
    feynmanTimerHandle = window.setInterval(updateFeynmanTimer, 250);
    updateFeynmanTimer();
  }
}

function selectedFlashcardChapters() {
  const selected = new Set(state.selectedFlashcardDecks || []);
  return textbookStudySlices().filter((item) => selected.has(item.key));
}

function renderFlashcardView() {
  if (state.selectedFlashcardDecks === null) state.selectedFlashcardDecks = defaultTextbookDeckKeys();
  if (!state.flashcardReviewActive) {
    const selected = new Set(state.selectedFlashcardDecks);
    const removed = removedAnkiCardKeys();
    const selectedChapters = selectedFlashcardChapters();
    const cardCount = selectedChapters.reduce((total, item) => total + item.cardIndexes.filter((cardIndex) => !removed.has(ankiCardKey(item.unitIndex, item.miniIndex, cardIndex))).length, 0);
    const unitPicker = state.activeCourse.chapters.map((unit, unitIndex) => {
      const unitKeys = textbookStudySlices().filter((slice) => slice.unitIndex === unitIndex).map((slice) => slice.key);
      const selectedCount = unitKeys.filter((key) => selected.has(key)).length;
      return `<div class="anki-unit-picker"><label class="anki-unit-choice"><input type="checkbox" data-flashcard-unit="${unitIndex}" ${selectedCount === unitKeys.length ? "checked" : ""}><span><small>Unit ${unitIndex + 1} · ${unit.miniUnits.length} mini-units</small><strong>${escapeHtml(unit.title)}</strong></span></label><div class="anki-mini-picker">${unit.miniUnits.map((miniUnit, miniIndex) => textbookPickerMarkup(miniUnit, unitIndex, miniIndex, selected, removed, "flashcard")).join("")}</div></div>`;
    }).join("");
    return `<section class="practice-view anki-setup"><p class="lesson-number">Normal flashcards</p><h3>Choose units and mini-units</h3><p>Study every selected card freely. This mode does not change Anki due dates or scheduling.</p><div class="anki-selection-bar"><strong>${selectedChapters.length} mini-units · ${cardCount} cards</strong><div><button type="button" data-select-all-flashcards>Select all</button><button type="button" data-clear-flashcards>Clear</button></div></div><div class="anki-deck-picker">${unitPicker}</div><button class="button primary-button start-anki" type="button" data-start-flashcards ${cardCount ? "" : "disabled"}>Study ${cardCount} flashcards</button></section>`;
  }
  const item = state.flashcardQueue[state.flashcardPosition];
  const reviewChapter = state.activeCourse.chapters[item.unitIndex].miniUnits[item.miniIndex];
  const card = reviewChapter.cards[item.cardIndex];
  const equation = card[2] ? `<span class="anki-equation" aria-label="Equation">${textbookEquationHtml(card[2])}</span>` : "";
  return `<section class="practice-view flashcard-study"><button class="flashcard-back" type="button" data-flashcard-back>← Change selection</button><div class="anki-session-heading"><p class="lesson-number">Flashcard ${state.flashcardPosition + 1} of ${state.flashcardQueue.length}</p><span class="flashcard-mode-label">No scheduling</span></div><h3>${escapeHtml(reviewChapter.title)}</h3><p class="anki-card-source">Unit ${item.unitIndex + 1} · Chapter ${reviewChapter.number}</p><div class="anki-review"><button class="anki-card" type="button"><span>${card[2] ? "Equation" : "Question"}</span><strong>${escapeHtml(card[0])}</strong><em>Click to show answer</em><div class="anki-answer">${equation}<p>${escapeHtml(card[1])}</p></div></button></div><div class="flashcard-navigation"><button type="button" data-previous-flashcard ${state.flashcardPosition === 0 ? "disabled" : ""}>← Previous</button><button type="button" data-next-flashcard>${state.flashcardPosition === state.flashcardQueue.length - 1 ? "Restart deck" : "Next →"}</button></div></section>`;
}

function updateFlashcardDeckSelection(event) {
  const selected = new Set(state.selectedFlashcardDecks || []);
  if (event.currentTarget.dataset.flashcardUnit !== undefined) {
    const unitIndex = Number(event.currentTarget.dataset.flashcardUnit);
    textbookStudySlices().filter((slice) => slice.unitIndex === unitIndex).forEach((slice) => { if (event.currentTarget.checked) selected.add(slice.key); else selected.delete(slice.key); });
  } else {
    const key = event.currentTarget.dataset.flashcardSection || event.currentTarget.dataset.flashcardMini;
    const keys = event.currentTarget.dataset.flashcardMini ? textbookStudySlices().filter((slice) => slice.key === key || slice.key.startsWith(`${key}-`)).map((slice) => slice.key) : [key];
    keys.forEach((item) => { if (event.currentTarget.checked) selected.add(item); else selected.delete(item); });
  }
  state.selectedFlashcardDecks = allAnkiDeckKeys().filter((key) => selected.has(key));
  renderLesson();
}

function startFlashcardReview() {
  const removed = removedAnkiCardKeys();
  state.flashcardQueue = selectedFlashcardChapters().flatMap(({ unitIndex, miniIndex, cardIndexes }) => cardIndexes.map((cardIndex) => ({ unitIndex, miniIndex, cardIndex })).filter((item) => !removed.has(ankiCardKey(item.unitIndex, item.miniIndex, item.cardIndex))));
  if (!state.flashcardQueue.length) return;
  shuffleInPlace(state.flashcardQueue);
  state.flashcardPosition = 0;
  state.flashcardReviewActive = true;
  renderLesson();
}

function renderAnkiView(chapter) {
  if (state.selectedAnkiDecks === null) state.selectedAnkiDecks = defaultTextbookDeckKeys();
  if (!state.ankiReviewActive) {
    const selected = new Set(state.selectedAnkiDecks);
    const removed = removedAnkiCardKeys();
    const selectedChapters = selectedAnkiChapters();
    const selectedCards = selectedChapters.flatMap((item) => item.cardIndexes.map((cardIndex) => ({ ...item, cardIndex })).filter((card) => !removed.has(ankiCardKey(card.unitIndex, card.miniIndex, card.cardIndex))));
    const preparedCards = selectedCards.map((card) => prepareAnkiSessionCard(card, ankiCardKey(card.unitIndex, card.miniIndex, card.cardIndex)));
    const dailyPlan = dailyAnkiPlan(preparedCards, `course:${state.activeCourse.id}`);
    const selectedCardCount = dailyPlan.queue.length;
    const todayReviewCount = dailyPlan.learningCards.length + dailyPlan.reviewCards.length;
    const nextDue = selectedCards.map((card) => ankiScheduleFor(ankiCardKey(card.unitIndex, card.miniIndex, card.cardIndex)).due).filter((due) => due > Date.now()).sort((a, b) => a - b)[0];
    const removedCount = [...removed].filter((key) => key.startsWith(`${state.activeCourse.id}-`)).length;
    const unitPicker = state.activeCourse.chapters.map((unit, unitIndex) => {
      const unitKeys = textbookStudySlices().filter((slice) => slice.unitIndex === unitIndex).map((slice) => slice.key);
      const selectedCount = unitKeys.filter((key) => selected.has(key)).length;
      return `<div class="anki-unit-picker"><label class="anki-unit-choice"><input type="checkbox" data-anki-unit="${unitIndex}" ${selectedCount === unitKeys.length ? "checked" : ""}><span><small>Unit ${unitIndex + 1} · ${unit.miniUnits.length} mini-units</small><strong>${unit.title}</strong></span></label><div class="anki-mini-picker">${unit.miniUnits.map((miniUnit, miniIndex) => textbookPickerMarkup(miniUnit, unitIndex, miniIndex, selected, removed, "anki")).join("")}</div></div>`;
    }).join("");
    return `<section class="practice-view anki-setup"><p class="lesson-number">Spaced-repetition review</p><h3>Choose units and mini-units</h3><p>Your current limit introduces up to ${Math.max(0, Math.floor(numericSetting("newCardsPerDay")))} new cards per day. Learning cards and reviews due today are carried forward automatically.</p><div class="anki-selection-bar"><strong><span id="anki-selected-count">${selectedChapters.length}</span> mini-units</strong><div><button type="button" data-select-all>Select all</button><button type="button" data-clear-selection>Clear</button></div></div><div class="anki-today-panel"><span>Today</span><div><strong>${dailyPlan.newCards.length}</strong><small>New</small></div><div><strong>${todayReviewCount}</strong><small>Review</small></div></div>${!selectedCardCount && nextDue ? `<div class="anki-next-due">Nothing is due now. Next review ${escapeHtml(relativeDueTime(nextDue))}.</div>` : ""}${removedCount ? `<div class="anki-removed-note"><span>${removedCount} removed ${removedCount === 1 ? "card" : "cards"}</span><button type="button" data-restore-anki-cards>Restore removed cards</button></div>` : ""}<div class="anki-deck-picker">${unitPicker}</div><button class="button primary-button start-anki" type="button" data-start-anki ${selectedCardCount ? "" : "disabled"}>Start today's ${selectedCardCount} cards</button></section>`;
  }
  const queueItem = state.ankiQueue[0];
  const reviewChapter = state.activeCourse.chapters[queueItem.unitIndex].miniUnits[queueItem.miniIndex];
  const card = reviewChapter.cards[queueItem.cardIndex];
  const cardFront = cleanAnkiStudyText(card[0]);
  const cardBack = cleanAnkiStudyText(card[1]);
  const intervals = ankiRatingIntervals(ankiScheduleFor(queueItem.scheduleKey));
  const equation = card[2] ? `<span class="anki-equation" aria-label="Equation">${textbookEquationHtml(card[2])}</span>` : "";
  return `<section class="practice-view anki-study"><button class="anki-back" type="button">← Change unit selection</button><div class="anki-session-heading"><p class="lesson-number">Anki review · ${state.ankiQueue.length} ${state.ankiQueue.length === 1 ? "card" : "cards"} remaining</p><span class="anki-time">◷ <strong id="anki-elapsed">00:00</strong></span></div><h3>${reviewChapter.title}</h3><div class="anki-card-meta"><p class="anki-card-source">Chapter ${reviewChapter.number}</p></div><div class="anki-review"><button class="anki-card" type="button" aria-pressed="false" aria-label="Show answer"><span>${card[2] ? "Equation" : "Question"}</span><strong>${escapeHtml(cardFront)}</strong><em>Click to show answer</em><div class="anki-answer">${equation}<p>${escapeHtml(cardBack)}</p></div></button>${ankiSessionCountsMarkup(state.ankiQueue, queueItem.sessionType)}<button class="button primary-button anki-reveal-button" type="button" data-reveal-anki>Reveal answer</button><div class="anki-ratings" aria-label="Schedule this card's next review"><button type="button" data-anki-rating="again"><span>${formatReviewInterval(intervals.again)}</span><strong>Again</strong></button><button type="button" data-anki-rating="hard"><span>${formatReviewInterval(intervals.hard)}</span><strong>Hard</strong></button><button type="button" data-anki-rating="good"><span>${formatReviewInterval(intervals.good)}</span><strong>Good</strong></button><button type="button" data-anki-rating="easy"><span>${formatReviewInterval(intervals.easy)}</span><strong>Easy</strong></button><button type="button" class="anki-remove-choice" data-remove-anki-card title="Double-click to remove this card" aria-label="Double-click to remove this card"><span class="anki-remove-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></span><strong>Remove</strong></button></div></div></section>`;
}

function setTextbookAnkiReveal(review, revealed) {
  if (!review) return;
  review.classList.toggle("revealed", revealed);
  review.classList.add("ratings-ready");
  const card = $(".anki-card", review);
  if (card) {
    card.setAttribute("aria-pressed", String(revealed));
    card.setAttribute("aria-label", revealed ? "Answer shown" : "Show answer");
  }
}

function ankiDeckKey(unitIndex, miniIndex, sectionIndex = null) { return sectionIndex === null ? `${unitIndex}-${miniIndex}` : `${unitIndex}-${miniIndex}-${sectionIndex}`; }

function textbookStudySlices() {
  return state.activeCourse.chapters.flatMap((unit, unitIndex) => unit.miniUnits.flatMap((chapter, miniIndex) => {
    const sectionSlices = (chapter.sections || []).filter((section) => Array.isArray(section.cardIndexes));
    if (!sectionSlices.length) return [{ key: ankiDeckKey(unitIndex, miniIndex), unitIndex, miniIndex, sectionIndex: null, chapter, section: null, cardIndexes: chapter.cards.map((_, index) => index) }];
    return sectionSlices.map((section, sectionIndex) => ({ key: ankiDeckKey(unitIndex, miniIndex, sectionIndex), unitIndex, miniIndex, sectionIndex, chapter, section, cardIndexes: section.cardIndexes }));
  }));
}

function defaultTextbookDeckKeys() {
  const matching = textbookStudySlices().filter((slice) => slice.unitIndex === state.activeChapter && slice.miniIndex === state.activeMiniUnit);
  const section = matching.find((slice) => slice.sectionIndex === state.activeSection);
  return [section?.key || matching[0]?.key || ankiDeckKey(state.activeChapter, state.activeMiniUnit)];
}

function textbookPickerMarkup(chapter, unitIndex, miniIndex, selected, removed, mode) {
  const slices = textbookStudySlices().filter((slice) => slice.unitIndex === unitIndex && slice.miniIndex === miniIndex);
  const chapterKey = ankiDeckKey(unitIndex, miniIndex);
  const allSelected = slices.every((slice) => selected.has(slice.key));
  const countFor = (slice) => slice.cardIndexes.filter((cardIndex) => !removed.has(ankiCardKey(unitIndex, miniIndex, cardIndex))).length;
  const dueFor = (slice) => slice.cardIndexes.filter((cardIndex) => !removed.has(ankiCardKey(unitIndex, miniIndex, cardIndex)) && isAnkiCardDue(ankiCardKey(unitIndex, miniIndex, cardIndex))).length;
  const attribute = mode === "anki" ? "data-anki-mini" : "data-flashcard-mini";
  const sectionAttribute = mode === "anki" ? "data-anki-section" : "data-flashcard-section";
  const total = slices.reduce((sum, slice) => sum + countFor(slice), 0);
  const due = slices.reduce((sum, slice) => sum + dueFor(slice), 0);
  return `<div class="textbook-chapter-picker"><label><input type="checkbox" ${attribute}="${chapterKey}" ${allSelected ? "checked" : ""}><span><small>Chapter ${chapter.number} · ${mode === "anki" ? `${due} due / ` : ""}${total} total</small><strong>${escapeHtml(chapter.title)}</strong></span></label>${slices[0]?.section ? `<div class="textbook-subsection-picker">${slices.map((slice) => `<label><input type="checkbox" ${sectionAttribute}="${slice.key}" ${selected.has(slice.key) ? "checked" : ""}><span><small>${mode === "anki" ? `${dueFor(slice)} due / ` : ""}${countFor(slice)} cards</small><strong>${escapeHtml(slice.section.title)}</strong></span></label>`).join("")}</div>` : ""}</div>`;
}

function ankiCardKey(unitIndex, miniIndex, cardIndex) { return `${state.activeCourse.id}-${unitIndex}-${miniIndex}-${cardIndex}`; }

function ankiSchedules() {
  try { return JSON.parse(localStorage.getItem("study-desk-anki-schedules") || "{}"); }
  catch { return {}; }
}

function ankiScheduleFor(key) {
  const value = ankiSchedules()[key];
  return value && typeof value === "object" ? value : { due: 0, intervalDays: 0, repetitions: 0, reps: 0, lapses: 0, state: 0 };
}

function nextAnkiDayCutoff(now = new Date()) {
  const hour = Math.max(0, Math.min(23, Math.floor(numericSetting("dayStartHour"))));
  const cutoff = new Date(now);
  cutoff.setHours(hour, 0, 0, 0);
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
  return cutoff.getTime();
}

function fsrsCardFromSchedule(schedule, now = new Date()) {
  if (schedule.fsrs) {
    return { ...schedule.fsrs, due: new Date(schedule.fsrs.due), last_review: schedule.fsrs.last_review ? new Date(schedule.fsrs.last_review) : undefined };
  }
  if (!schedule.lastReviewed && !schedule.repetitions && !schedule.reps) return window.FSRS.createEmptyCard(now);
  const interval = Math.max(0, Number(schedule.intervalDays) || 0);
  const importedStability = Number(schedule.stability);
  const importedDifficulty = Number(schedule.difficulty);
  return {
    due: new Date(Number(schedule.due) || now.getTime()), stability: Math.max(0.1, importedStability || interval || 0.2),
    difficulty: Math.max(1, Math.min(10, importedDifficulty || 11 - (Number(schedule.ease) || 2.5) * 2.4)),
    elapsed_days: interval, scheduled_days: Math.round(interval), reps: Number(schedule.repetitions || schedule.reps) || 1,
    lapses: Number(schedule.lapses) || 0, learning_steps: 0,
    state: interval >= 1 ? window.FSRS.State.Review : (schedule.lastRating === "again" ? window.FSRS.State.Relearning : window.FSRS.State.Learning),
    last_review: schedule.lastReviewed ? new Date(schedule.lastReviewed) : now,
  };
}

function serializedFsrsCard(card) {
  return { ...card, due: new Date(card.due).getTime(), last_review: card.last_review ? new Date(card.last_review).getTime() : null };
}

function fsrsScheduler() {
  const settings = loadSettings();
  return window.FSRS.fsrs(window.FSRS.generatorParameters({
    request_retention: Math.max(0.7, Math.min(0.99, Number(settings.desiredRetention) / 100 || 0.9)),
    maximum_interval: Math.max(1, Number(settings.maximumInterval) || 36500),
    enable_fuzz: settings.enableFuzz !== false,
    enable_short_term: true,
    learning_steps: parseAnkiSteps(settings.learningSteps),
    relearning_steps: parseAnkiSteps(settings.relearningSteps),
  }));
}

function isAnkiCardDue(key, now = Date.now()) {
  const schedule = ankiScheduleFor(key);
  if (schedule.suspended) return false;
  const card = fsrsCardFromSchedule(schedule, new Date(now));
  const due = new Date(card.due).getTime();
  return card.state === window.FSRS.State.Review ? due < nextAnkiDayCutoff(new Date(now)) : due <= now;
}

const ANKI_BURIED_KEY = "study-desk-anki-buried-v2";
const ANKI_REVIEW_LOG_KEY = "study-desk-anki-review-log-v2";

function buriedAnkiKeys() {
  try {
    const value = JSON.parse(localStorage.getItem(ANKI_BURIED_KEY) || "{}");
    return value.day === localAnkiDayKey() ? new Set(value.keys || []) : new Set();
  } catch { return new Set(); }
}

function buryAnkiSiblings(answered, queue) {
  if (!answered?.noteId) return;
  const settings = loadSettings();
  const buried = buriedAnkiKeys();
  queue.forEach((candidate) => {
    if (candidate.noteId !== answered.noteId || candidate.scheduleKey === answered.scheduleKey) return;
    if ((candidate.sessionType === "new" && settings.buryNewSiblings) || (candidate.sessionType === "review" && settings.buryReviewSiblings) || (candidate.sessionType === "learning" && settings.buryLearningSiblings)) buried.add(candidate.scheduleKey);
  });
  if (buried.size) localStorage.setItem(ANKI_BURIED_KEY, JSON.stringify({ day: localAnkiDayKey(), keys: [...buried] }));
}

const ANKI_DAILY_NEW_STORAGE_KEY = "study-desk-anki-daily-new-v1";

function localAnkiDayKey(now = new Date()) {
  const studyDay = new Date(now);
  studyDay.setHours(studyDay.getHours() - Math.max(0, Math.min(23, Math.floor(numericSetting("dayStartHour")))));
  return `${studyDay.getFullYear()}-${String(studyDay.getMonth() + 1).padStart(2, "0")}-${String(studyDay.getDate()).padStart(2, "0")}`;
}

function ankiDailyNewState() {
  const empty = { day: localAnkiDayKey(), scopes: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(ANKI_DAILY_NEW_STORAGE_KEY) || "null");
    return saved?.day === empty.day && saved.scopes && typeof saved.scopes === "object" ? saved : empty;
  } catch { return empty; }
}

function markDailyNewCardsStarted(scope, cards) {
  const dailyLimit = Math.max(0, Math.floor(numericSetting("newCardsPerDay")));
  const daily = ankiDailyNewState();
  const started = new Set(Array.isArray(daily.scopes[scope]) ? daily.scopes[scope] : []);
  cards.forEach((card) => started.add(card.scheduleKey));
  daily.scopes[scope] = [...started].slice(0, dailyLimit);
  localStorage.setItem(ANKI_DAILY_NEW_STORAGE_KEY, JSON.stringify(daily));
}

function dailyAnkiPlan(cards, scope) {
  const settings = loadSettings();
  const dailyLimit = Math.max(0, Math.floor(Number(settings.newCardsPerDay)));
  const reviewLimit = Math.max(0, Math.floor(Number(settings.maxReviewsPerDay)));
  const daily = ankiDailyNewState();
  const started = new Set(Array.isArray(daily.scopes[scope]) ? daily.scopes[scope] : []);
  const buried = buriedAnkiKeys();
  const availableCards = cards.filter((card) => !buried.has(card.scheduleKey));
  const newCards = availableCards.filter((card) => card.sessionType === "new" && !ankiScheduleFor(card.scheduleKey).suspended);
  const alreadyStarted = newCards.filter((card) => started.has(card.scheduleKey)).slice(0, dailyLimit);
  const notStarted = newCards.filter((card) => !started.has(card.scheduleKey));
  const availableNew = settings.newCardOrder === "added" ? notStarted : shuffleInPlace(notStarted);
  const dueReviewPool = availableCards.filter((card) => card.sessionType === "review" && isAnkiCardDue(card.scheduleKey));
  const openNewSlots = !settings.newCardsIgnoreReviewLimit && dueReviewPool.length >= reviewLimit ? 0 : Math.max(0, dailyLimit - started.size);
  const selectedNew = [...alreadyStarted, ...availableNew.slice(0, openNewSlots)];
  const learnAheadCutoff = Date.now() + Math.max(0, Number(settings.learnAheadMinutes) || 0) * 60000;
  const learningCards = availableCards.filter((card) => card.sessionType === "learning" && !ankiScheduleFor(card.scheduleKey).suspended);
  const dueLearning = learningCards.filter((card) => Number(ankiScheduleFor(card.scheduleKey).due) <= Date.now());
  const aheadLearning = learningCards.filter((card) => Number(ankiScheduleFor(card.scheduleKey).due) > Date.now() && Number(ankiScheduleFor(card.scheduleKey).due) <= learnAheadCutoff);
  const orderedReviews = settings.reviewOrder === "random" ? shuffleInPlace([...dueReviewPool]) : dueReviewPool.sort((a, b) => ankiScheduleFor(a.scheduleKey).due - ankiScheduleFor(b.scheduleKey).due);
  const dueReview = orderedReviews.slice(0, reviewLimit);
  // Learning cards are never displaced by the new-card or review limits.
  // They are placed before new material so overdue work is pushed forward.
  const learningQueue = shuffleInPlace([...dueLearning]);
  const learnAheadQueue = shuffleInPlace([...aheadLearning]);
  const reviewQueue = [...dueReview];
  const newQueue = settings.newCardOrder === "added" ? [...selectedNew] : shuffleInPlace([...selectedNew]);
  let queue;
  if (settings.newReviewOrder === "new-first") queue = [...newQueue, ...learningQueue, ...reviewQueue, ...learnAheadQueue];
  else if (settings.newReviewOrder === "mix") {
    const established = [...learningQueue, ...reviewQueue];
    queue = [];
    while (established.length || newQueue.length) { if (established.length) queue.push(established.shift()); if (newQueue.length) queue.push(newQueue.shift()); }
    queue.push(...learnAheadQueue);
  } else queue = [...learningQueue, ...reviewQueue, ...newQueue, ...learnAheadQueue];
  return {
    newCards: selectedNew,
    learningCards: shuffleInPlace([...dueLearning, ...aheadLearning]),
    reviewCards: shuffleInPlace([...dueReview]),
    queue,
  };
}

function activeAnkiSummary(cards, scope) {
  const plan = dailyAnkiPlan(cards, scope);
  return {
    total: plan.queue.length,
    newCount: plan.newCards.length,
    learningCount: plan.learningCards.length,
    reviewCount: plan.reviewCards.length,
  };
}

function dashboardAnkiEntries() {
  const removed = removedAnkiCardKeys();
  const active = loadActiveAnkiDecks();
  const activeFolders = new Set(active.filter((entry) => entry.target === "deck" && entry.id.startsWith("folder:")).map((entry) => entry.id.slice(7)));
  const groupedDeckIds = new Set(loadStudyFolders().filter((folder) => activeFolders.has(folder.id)).flatMap((folder) => folder.deckIds));
  const entries = active.map((saved) => {
    if (saved.target === "course") {
      const course = courses.find((item) => item.id === saved.id);
      if (!course || !isEnrolled(course.id)) return null;
      const cards = course.chapters.flatMap((unit, unitIndex) => unit.miniUnits.flatMap((chapter, miniIndex) => chapter.cards.map((card, cardIndex) => ({ card, key: `${course.id}-${unitIndex}-${miniIndex}-${cardIndex}` })).filter((item) => !removed.has(item.key))));
      const scope = `course:${course.id}`;
      const plan = dailyAnkiPlan(cards.map((item) => prepareAnkiSessionCard(item.card, item.key)), scope);
      return { ...saved, name: course.title, kind: "Textbook", scope, plan, total: plan.queue.length, newCount: plan.newCards.length, learningCount: plan.learningCards.length, reviewCount: plan.reviewCards.length };
    }
    if (!saved.id.startsWith("folder:") && groupedDeckIds.has(saved.id)) return null;
    const deck = findStudyDeck(saved.id);
    if (!deck) return null;
    const folder = saved.id.startsWith("folder:") ? loadStudyFolders().find((item) => item.id === saved.id.slice(7)) : null;
    const cards = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(card.sourceDeckId || deck.id, card.id))).filter((card) => !removed.has(card.scheduleKey));
    const scope = `deck:${deck.id}`;
    const plan = dailyAnkiPlan(cards, scope);
    return { ...saved, name: deck.name, kind: folder ? `Folder · ${folder.deckIds.length} sets` : deck.builtIn ? "Built-in deck" : "Personal set", starred: isStudyItemStarred(folder ? saved.id : `deck:${saved.id}`), scope, plan, total: plan.queue.length, newCount: plan.newCards.length, learningCount: plan.learningCards.length, reviewCount: plan.reviewCards.length };
  }).filter(Boolean).map((entry) => ({ ...entry, completedToday: entry.completedDay === localAnkiDayKey() }));
  return entries.sort((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)) || Number(a.completedToday) - Number(b.completedToday) || b.total - a.total || a.name.localeCompare(b.name));
}

function renderActiveAnkiDecks() {
  const list = $("#active-anki-list");
  if (!list) return;
  const entries = dashboardAnkiEntries();
  const dueKeys = new Set(entries.filter((entry) => entry.total > 0).map(activeAnkiEntryKey));
  state.activeAnkiSelections = new Set([...state.activeAnkiSelections].filter((key) => dueKeys.has(key) || Object.keys(lazyBuiltInSources).some((id) => !builtInFlashcardCollections.find((item) => item.id === id)?.units.length && key.endsWith(`:${id}`))));
  persistActiveAnkiSelections();
  const total = entries.reduce((sum, entry) => sum + entry.total, 0);
  $("#active-anki-total").textContent = `${total} due`;
  list.innerHTML = entries.length ? entries.map((entry) => {
    const key = activeAnkiEntryKey(entry);
    return `<article class="active-anki-item ${entry.completedToday ? "completed" : ""}"><label class="active-anki-select" title="Select ${escapeHtml(entry.name)}"><input type="checkbox" data-select-active-anki="${escapeHtml(key)}" ${state.activeAnkiSelections.has(key) ? "checked" : ""} ${entry.total ? "" : "disabled"}><span aria-hidden="true"></span></label><div class="active-anki-copy"><small>${entry.starred ? '<span class="active-anki-star" aria-label="Starred">★</span> ' : ""}${escapeHtml(entry.kind)}</small><strong>${escapeHtml(entry.name)}</strong>${entry.completedToday ? '<div class="active-anki-complete-label">✓ Completed today</div>' : `<div class="active-anki-counts"><span><b>${entry.newCount}</b> new</span><span><b>${entry.learningCount}</b> learning</span><span><b>${entry.reviewCount}</b> review</span></div>`}</div><div class="active-anki-actions"><button class="button primary-button active-anki-start" type="button" data-dashboard-anki="${escapeHtml(entry.id)}" data-dashboard-anki-target="${entry.target}" ${entry.total ? "" : "disabled"}>${entry.completedToday ? "Done" : entry.total ? "Study now" : "Nothing due"}</button><button class="active-anki-remove" type="button" data-remove-active-anki="${escapeHtml(entry.id)}" data-remove-active-target="${entry.target}" aria-label="Remove ${escapeHtml(entry.name)} from Active Anki">Remove</button></div></article>`;
  }).join("") : '<div class="active-anki-empty">No active Anki decks yet. Open Anki for a study set or textbook to add it here.</div>';
  const batch = $("#active-anki-batch");
  batch.hidden = dueKeys.size < 2;
  updateActiveAnkiBatchControls(entries);
  $$('[data-select-active-anki]', list).forEach((input, index) => input.setAttribute("aria-label", `Select ${entries[index]?.name || "deck"} for combined study`));
  $$('[data-select-active-anki]', list).forEach((input) => input.addEventListener("change", () => {
    if (input.checked) state.activeAnkiSelections.add(input.dataset.selectActiveAnki);
    else state.activeAnkiSelections.delete(input.dataset.selectActiveAnki);
    persistActiveAnkiSelections();
    updateActiveAnkiBatchControls(entries);
  }));
  $$('[data-dashboard-anki]', list).forEach((button) => button.addEventListener("click", () => openDashboardAnki(button.dataset.dashboardAnki, button.dataset.dashboardAnkiTarget)));
  $$('[data-remove-active-anki]', list).forEach((button) => button.addEventListener("click", () => removeActiveAnkiDeck(button.dataset.removeActiveAnki, button.dataset.removeActiveTarget)));
}

function activeAnkiEntryKey(entry) {
  return `${entry.target}:${entry.id}`;
}

function updateActiveAnkiBatchControls(entries = dashboardAnkiEntries()) {
  const due = entries.filter((entry) => entry.total > 0);
  const selected = due.filter((entry) => state.activeAnkiSelections.has(activeAnkiEntryKey(entry)));
  const selectAll = $("#active-anki-select-all");
  selectAll.checked = due.length > 0 && selected.length === due.length;
  selectAll.indeterminate = selected.length > 0 && selected.length < due.length;
  $("#active-anki-selection-summary").textContent = `${selected.length} ${selected.length === 1 ? "deck" : "decks"} · ${selected.reduce((sum, entry) => sum + entry.total, 0)} cards`;
  $("#study-selected-active-anki").disabled = selected.length === 0;
}

function roundRobinAnkiQueues(entries) {
  const queues = entries.map((entry) => entry.plan.queue.map((card) => ({
    ...card,
    activeAnkiOwnerKey: activeAnkiEntryKey(entry),
    activeAnkiOwnerName: entry.name,
  })));
  const result = [];
  while (queues.some((queue) => queue.length)) queues.forEach((queue) => { if (queue.length) result.push(queue.shift()); });
  return result;
}

function startSelectedActiveAnki() {
  const entries = dashboardAnkiEntries().filter((entry) => state.activeAnkiSelections.has(activeAnkiEntryKey(entry)) && entry.total > 0);
  if (!entries.length) { showToast("Select at least one due deck."); return; }
  entries.forEach((entry) => markDailyNewCardsStarted(entry.scope, entry.plan.newCards));
  state.customReviewMode = "anki";
  state.customReviewCards = roundRobinAnkiQueues(entries);
  state.customReviewPosition = 0;
  state.customAnkiSessionTotal = state.customReviewCards.length;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  state.customReviewStartedAt = Date.now();
  state.customAnkiCardShownAt = Date.now();
  state.customAnkiActiveOwners = entries.map(({ id, target, name, total }) => ({ id, target, name, total, key: `${target}:${id}` }));
  state.customAnkiBatchSession = true;
  state.selectedCustomDeckId = null;
  state.selectedCustomDeckBuiltIn = true;
  state.customStudyReturnView = "dashboard";
  $("#close-custom-review").textContent = "← Back to dashboard";
  $("#custom-review-title").textContent = entries.length === 1 ? entries[0].name : `${entries.length} selected decks`;
  $("#custom-study-options-view").hidden = true;
  $("#custom-review-view").hidden = false;
  showAppView("custom-study");
  renderCustomReviewCard();
  window.clearInterval(customReviewTimerHandle);
  $("#custom-review-time").textContent = "00:00";
  customReviewTimerHandle = window.setInterval(() => { $("#custom-review-time").textContent = formatElapsed(Date.now() - state.customReviewStartedAt); }, 1000);
}

function openDashboardAnki(id, target) {
  if (target === "course") {
    openCourse(id, 0, "anki");
    state.selectedAnkiDecks = allAnkiDeckKeys();
    renderLesson();
    startAnkiReview();
    return;
  }
  const collection = getBuiltInCollection(id);
  if (collection) {
    state.selectedBuiltInCollectionId = null;
    state.selectedBuiltInUnitIds = collection.units.map((unit) => unit.id);
  }
  state.customStudyReturnView = "dashboard";
  openCustomStudyOptions(id);
  startCustomReview("anki");
}

function ankiSessionTypeForSchedule(schedule) {
  const card = fsrsCardFromSchedule(schedule);
  if (card.state === window.FSRS.State.New) return "new";
  if (card.state === window.FSRS.State.Learning || card.state === window.FSRS.State.Relearning) return "learning";
  return "review";
}

function prepareAnkiSessionCard(card, scheduleKey) {
  const schedule = ankiScheduleFor(scheduleKey);
  const prepared = Array.isArray(card)
    ? card
    : { ...card, front: cleanAnkiStudyText(card.front), back: cleanAnkiStudyText(card.back) };
  return { ...prepared, scheduleKey, noteId: prepared.noteId || prepared.id || scheduleKey, sessionType: ankiSessionTypeForSchedule(schedule) };
}

function cleanAnkiStudyText(value) {
  return String(value ?? "")
    .replace(/\s*\(part\s+\d+\)/gi, "")
    .replace(/\bUnit\s+\d+\s+(?:Vocabulary|Vocab|Notes|Review)\b/gi, "")
    .replace(/\b(?:in|from|for)\s+Unit\s+\d+\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function ankiSessionCounts(cards) {
  return cards.reduce((counts, card) => {
    counts[card.sessionType || "new"] += 1;
    return counts;
  }, { new: 0, learning: 0, review: 0 });
}

function ankiSessionCountsMarkup(cards, currentType = "new") {
  const counts = ankiSessionCounts(cards);
  return `<div class="anki-session-counts" data-current-type="${currentType}" aria-label="${counts.new} new, ${counts.learning} learning, ${counts.review} review cards remaining; current card is ${currentType}"><span class="anki-count-group anki-count-group-new"><strong class="anki-count-new">${counts.new}</strong><small>New</small></span><b aria-hidden="true">+</b><span class="anki-count-group anki-count-group-learning"><strong class="anki-count-learning">${counts.learning}</strong><small>Learning</small></span><b aria-hidden="true">+</b><span class="anki-count-group anki-count-group-review"><strong class="anki-count-review">${counts.review}</strong><small>Review</small></span></div>`;
}

function applyAnkiSessionRating(card, rating, selectedIntervalDays) {
  if (ankiScheduleFor(card.scheduleKey).suspended) return true;
  const schedule = ankiScheduleFor(card.scheduleKey);
  card.sessionType = ankiSessionTypeForSchedule(schedule);
  const due = Number(schedule.due) || 0;
  const learnAhead = Math.max(0, numericSetting("learnAheadMinutes")) * 60000;
  return card.sessionType === "review" || due > Date.now() + learnAhead;
}

function saveAnkiRating(scheduleKey, rating, durationMs = 0) {
  const settings = loadSettings();
  const schedules = ankiSchedules();
  const current = ankiScheduleFor(scheduleKey);
  const now = new Date();
  const grade = { again: window.FSRS.Rating.Again, hard: window.FSRS.Rating.Hard, good: window.FSRS.Rating.Good, easy: window.FSRS.Rating.Easy }[rating];
  const result = fsrsScheduler().next(fsrsCardFromSchedule(current, now), now, grade);
  const nextCard = result.card;
  const intervalDays = Math.max(0, (new Date(nextCard.due).getTime() - now.getTime()) / 86400000);
  const lapses = Number(nextCard.lapses) || 0;
  const leech = lapses >= Math.max(1, Number(settings.leechThreshold) || 8);
  schedules[scheduleKey] = {
    due: new Date(nextCard.due).getTime(), intervalDays: Number(nextCard.scheduled_days) || intervalDays,
    repetitions: Number(nextCard.reps) || 0, reps: Number(nextCard.reps) || 0,
    stability: nextCard.stability, difficulty: nextCard.difficulty, state: nextCard.state,
    lastReviewed: now.getTime(),
    lastRating: rating,
    lapses, leech, fsrs: serializedFsrsCard(nextCard),
    suspended: Boolean(current.suspended) || (leech && settings.leechAction === "suspend"),
  };
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem(ANKI_REVIEW_LOG_KEY) || "[]"); } catch { logs = []; }
  logs.push({ id: `${now.getTime()}-${scheduleKey}`, cardKey: scheduleKey, rating, review: now.getTime(), elapsedDays: result.log.elapsed_days, scheduledDays: result.log.scheduled_days, state: result.log.state, stability: result.log.stability, difficulty: result.log.difficulty, durationMs: Math.max(0, Math.min(60000, Math.round(Number(durationMs) || 0))) });
  localStorage.setItem(ANKI_REVIEW_LOG_KEY, JSON.stringify(logs.slice(-100000)));
  return intervalDays;
}

function ankiRatingIntervals(schedule) {
  const now = new Date();
  const preview = fsrsScheduler().repeat(fsrsCardFromSchedule(schedule, now), now);
  const intervalFor = (grade) => Math.max(0, (new Date(preview[grade].card.due).getTime() - now.getTime()) / 86400000);
  return { again: intervalFor(window.FSRS.Rating.Again), hard: intervalFor(window.FSRS.Rating.Hard), good: intervalFor(window.FSRS.Rating.Good), easy: intervalFor(window.FSRS.Rating.Easy) };
}

function formatReviewInterval(days) {
  if (days < 1 / 24) return `${Math.round(days * 1440)}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 60) return `${Math.round(days)}d`;
  if (days < 730) return `${(days / 30.44).toFixed(days < 305 ? 1 : 0)}mo`;
  return `${(days / 365.25).toFixed(1)}y`;
}

function relativeDueTime(timestamp) {
  const milliseconds = Math.max(0, timestamp - Date.now());
  return `in ${formatReviewInterval(milliseconds / 86400000)}`;
}

function removedAnkiCardKeys() {
  try { return new Set(JSON.parse(localStorage.getItem("study-desk-removed-anki-cards") || "[]")); }
  catch { return new Set(); }
}

function allAnkiDeckKeys() {
  return textbookStudySlices().map((slice) => slice.key);
}

function selectedAnkiChapters() {
  const selected = new Set(state.selectedAnkiDecks || []);
  return textbookStudySlices().filter((item) => selected.has(item.key));
}

function updateAnkiDeckSelection(event) {
  const selected = new Set(state.selectedAnkiDecks || []);
  if (event.currentTarget.dataset.ankiUnit !== undefined) {
    const unitIndex = Number(event.currentTarget.dataset.ankiUnit);
    textbookStudySlices().filter((slice) => slice.unitIndex === unitIndex).forEach((slice) => { if (event.currentTarget.checked) selected.add(slice.key); else selected.delete(slice.key); });
  } else {
    const key = event.currentTarget.dataset.ankiSection || event.currentTarget.dataset.ankiMini;
    const keys = event.currentTarget.dataset.ankiMini ? textbookStudySlices().filter((slice) => slice.key === key || slice.key.startsWith(`${key}-`)).map((slice) => slice.key) : [key];
    keys.forEach((item) => { if (event.currentTarget.checked) selected.add(item); else selected.delete(item); });
  }
  state.selectedAnkiDecks = allAnkiDeckKeys().filter((key) => selected.has(key));
  renderLesson();
}

function startAnkiReview() {
  const selectedChapters = selectedAnkiChapters();
  if (!selectedChapters.length) return;
  const removed = removedAnkiCardKeys();
  const candidates = selectedChapters.flatMap(({ unitIndex, miniIndex, cardIndexes }) => cardIndexes.map((cardIndex) => ({ unitIndex, miniIndex, cardIndex })).filter((item) => !removed.has(ankiCardKey(item.unitIndex, item.miniIndex, item.cardIndex))).map((item) => prepareAnkiSessionCard(item, ankiCardKey(item.unitIndex, item.miniIndex, item.cardIndex))));
  const scope = `course:${state.activeCourse.id}`;
  const plan = dailyAnkiPlan(candidates, scope);
  activateAnkiDeck(state.activeCourse.id, "course");
  state.ankiQueue = plan.queue;
  if (!state.ankiQueue.length) return;
  markDailyNewCardsStarted(scope, plan.newCards);
  state.ankiPosition = 0;
  state.ankiSessionTotal = state.ankiQueue.length;
  state.ankiReviewActive = true;
  state.ankiStartedAt = Date.now();
  state.ankiCardShownAt = Date.now();
  renderLesson();
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function removeCurrentAnkiCard() {
  const queueItem = state.ankiQueue[0];
  if (!queueItem) return;
  const removed = removedAnkiCardKeys();
  removed.add(ankiCardKey(queueItem.unitIndex, queueItem.miniIndex, queueItem.cardIndex));
  localStorage.setItem("study-desk-removed-anki-cards", JSON.stringify([...removed]));
  state.ankiQueue.shift();
  if (!state.ankiQueue.length) {
    state.ankiReviewActive = false;
    state.ankiStartedAt = null;
    state.ankiPosition = 0;
  }
  renderLesson();
  showToast("Card removed from the deck. You can restore it from Anki setup.");
}

function restoreRemovedAnkiCards() {
  const prefix = `${state.activeCourse.id}-`;
  const remaining = [...removedAnkiCardKeys()].filter((key) => !key.startsWith(prefix));
  localStorage.setItem("study-desk-removed-anki-cards", JSON.stringify(remaining));
  renderLesson();
  showToast("Removed Anki cards restored.");
}

function feynmanPrompts(chapter) {
  const customPrompts = {
    3: ["pH", "Water polarity", "Hydrogen bonding", "Acids vs. bases"],
    6: ["Cell parts", "Prokaryotes vs. eukaryotes", "The endomembrane system", "Mitochondria vs. chloroplasts", "Organelles and their functions"],
    9: ["Cellular respiration", "Glycolysis", "The citric acid cycle", "Oxidative phosphorylation", "Aerobic vs. anaerobic respiration"],
    10: ["Photosynthesis", "Light reactions", "Photosystems", "The Calvin cycle", "C4 vs. CAM pathways"],
    13: ["Meiosis", "Mitosis", "Crossing over", "Mitosis vs. meiosis"],
  };
  const sectionTopics = chapter.focusAreas || [];
  const vocabularyTopics = (chapter.textbookTerms || chapter.topics || []).filter((term) => /(?:cycle|system|pathway|transport|growth|development|evolution|respiration|photosynthesis|reproduction|regulation|equilibrium|structure|mechanism|theory|model|metabolism|signaling|inheritance|ecology|diversity|interaction|reaction|synthesis|division|immunity|circulation)/i.test(term));
  const areas = [...new Set([...sectionTopics, ...vocabularyTopics])];
  const termCount = chapter.cards?.length || (chapter.textbookTerms || chapter.topics || []).length;
  if (["campbell", "vanders", "raven"].includes(chapter.source)) {
    const candidates = customPrompts[chapter.number] || areas;
    const targetCount = Math.max(1, Math.round(termCount / 10));
    const count = Math.min(candidates.length, targetCount);
    const chosen = Array.from({ length: count }, (_, index) => candidates[Math.round(index * (candidates.length - 1) / Math.max(1, count - 1))]);
    return [...new Set(chosen)].map(formatFeynmanTopic);
  }
  const count = Math.min(areas.length, termCount <= 8 ? 2 : termCount <= 10 ? 3 : termCount <= 12 ? 4 : termCount <= 14 ? 5 : 6);
  const chosen = Array.from({ length: count }, (_, index) => areas[Math.round(index * (areas.length - 1) / Math.max(1, count - 1))]);
  return [...new Set(chosen)].map(formatFeynmanTopic);
}

function formatFeynmanTopic(topic) {
  const cleaned = topic.replace(/\bversus\b/gi, "vs.").replace(/\s+/g, " ").trim();
  return cleaned === "pH" ? cleaned : cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function selectedFeynmanChapters() {
  const selected = new Set(state.selectedFeynmanDecks || []);
  return state.activeCourse.chapters.flatMap((unit, unitIndex) => unit.miniUnits.map((chapter, miniIndex) => ({ unitIndex, miniIndex, chapter })).filter((item) => selected.has(ankiDeckKey(item.unitIndex, item.miniIndex))));
}

function renderFeynmanView() {
  if (state.selectedFeynmanDecks === null) state.selectedFeynmanDecks = [ankiDeckKey(state.activeChapter, state.activeMiniUnit)];
  if (!state.feynmanActive) {
    const selected = new Set(state.selectedFeynmanDecks);
    const selectedChapters = selectedFeynmanChapters();
    const promptCount = selectedChapters.reduce((total, item) => total + feynmanPrompts(item.chapter).length, 0);
    const unitPicker = state.activeCourse.chapters.map((unit, unitIndex) => {
      const unitKeys = unit.miniUnits.map((_, miniIndex) => ankiDeckKey(unitIndex, miniIndex));
      const selectedCount = unitKeys.filter((key) => selected.has(key)).length;
      return `<div class="anki-unit-picker"><label class="anki-unit-choice"><input type="checkbox" data-feynman-unit="${unitIndex}" ${selectedCount === unitKeys.length ? "checked" : ""}><span><small>Unit ${unitIndex + 1} · ${unit.miniUnits.length} mini-units</small><strong>${unit.title}</strong></span></label><div class="anki-mini-picker">${unit.miniUnits.map((miniUnit, miniIndex) => { const key = ankiDeckKey(unitIndex, miniIndex); const topics = feynmanPrompts(miniUnit).length; return `<label><input type="checkbox" data-feynman-mini="${key}" ${selected.has(key) ? "checked" : ""}><span><small>Chapter ${miniUnit.number} · ${topics} ${topics === 1 ? "topic" : "topics"}</small><strong>${miniUnit.title}</strong></span></label>`; }).join("")}</div></div>`;
    }).join("");
    return `<section class="practice-view feynman-setup"><p class="lesson-number">Feynman study</p><h3>Explain it in your own words</h3><p>Choose units or mini-units, set a writing time, and write freely about one broad topic.</p><div class="anki-selection-bar"><strong>${selectedChapters.length} mini-units · ${promptCount} topics</strong><div><button type="button" data-select-all-feynman>Select all</button><button type="button" data-clear-feynman>Clear</button></div></div><div class="anki-deck-picker">${unitPicker}</div><div class="feynman-time-setting"><label><span>Writing time per topic</span><input type="number" min="1" max="120" value="${state.feynmanTimeAmount}" data-feynman-time></label><select data-feynman-time-unit aria-label="Writing time unit"><option value="seconds" ${state.feynmanTimeUnit === "seconds" ? "selected" : ""}>Seconds</option><option value="minutes" ${state.feynmanTimeUnit === "minutes" ? "selected" : ""}>Minutes</option></select></div><button class="button primary-button start-anki" type="button" data-start-feynman ${promptCount ? "" : "disabled"}>Start Feynman session</button></section>`;
  }
  const item = state.feynmanQueue[state.feynmanPosition];
  const totalSeconds = feynmanDurationSeconds();
  return `<section class="practice-view feynman-session"><button class="anki-back feynman-back" type="button">← Change topic selection</button><div class="anki-session-heading"><p class="lesson-number">Feynman topic · ${state.feynmanPosition + 1} of ${state.feynmanQueue.length}</p><span class="feynman-countdown ${state.feynmanFinished ? "finished" : ""}">◷ <strong id="feynman-remaining">${formatElapsed(totalSeconds * 1000)}</strong></span></div><div class="feynman-prompt"><small>Open-ended topic</small><strong>${escapeHtml(item.prompt)}</strong></div><label class="feynman-response-label" for="feynman-response">Your explanation</label><textarea id="feynman-response" data-feynman-response placeholder="Write what you know, connect the steps, and identify anything you cannot yet explain…" ${state.feynmanFinished ? "disabled" : ""}>${escapeHtml(state.feynmanResponse)}</textarea><div class="feynman-session-actions"><span id="feynman-status">${state.feynmanFinished ? "Response complete. Review the gaps before moving on." : "Keep writing until the timer ends, or finish early."}</span><button class="button secondary-button" type="button" data-finish-feynman ${state.feynmanFinished ? "hidden" : ""}>Finish early</button><button class="button primary-button" type="button" data-next-feynman ${state.feynmanFinished ? "" : "hidden"}>Next topic</button></div></section>`;
}

function updateFeynmanDeckSelection(event) {
  const selected = new Set(state.selectedFeynmanDecks || []);
  if (event.currentTarget.dataset.feynmanUnit !== undefined) {
    const unitIndex = Number(event.currentTarget.dataset.feynmanUnit);
    state.activeCourse.chapters[unitIndex].miniUnits.forEach((_, miniIndex) => {
      const key = ankiDeckKey(unitIndex, miniIndex);
      if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
    });
  } else {
    const key = event.currentTarget.dataset.feynmanMini;
    if (event.currentTarget.checked) selected.add(key); else selected.delete(key);
  }
  state.selectedFeynmanDecks = allAnkiDeckKeys().filter((key) => selected.has(key));
  renderLesson();
}

function feynmanDurationSeconds() {
  return state.feynmanTimeUnit === "minutes" ? state.feynmanTimeAmount * 60 : state.feynmanTimeAmount;
}

function startFeynmanStudy() {
  const selectedChapters = selectedFeynmanChapters();
  if (!selectedChapters.length) return;
  state.feynmanQueue = selectedChapters.flatMap(({ unitIndex, miniIndex, chapter }) => feynmanPrompts(chapter).map((prompt) => ({ unitIndex, miniIndex, chapter, prompt })));
  const offset = Date.now() % state.feynmanQueue.length;
  state.feynmanQueue = state.feynmanQueue.slice(offset).concat(state.feynmanQueue.slice(0, offset));
  state.feynmanPosition = 0;
  state.feynmanActive = true;
  state.feynmanFinished = false;
  state.feynmanStartedAt = Date.now();
  state.feynmanResponse = "";
  renderLesson();
  window.setTimeout(() => $("[data-feynman-response]")?.focus(), 40);
}

function updateFeynmanTimer() {
  const remaining = Math.max(0, feynmanDurationSeconds() * 1000 - (Date.now() - state.feynmanStartedAt));
  const display = $("#feynman-remaining");
  if (display) display.textContent = formatElapsed(remaining);
  if (remaining === 0) finishFeynmanPrompt(true);
}

function finishFeynmanPrompt(timedOut) {
  if (state.feynmanFinished) return;
  state.feynmanFinished = true;
  window.clearInterval(feynmanTimerHandle);
  const response = $("[data-feynman-response]");
  if (response) response.disabled = true;
  const countdown = $(".feynman-countdown");
  if (countdown) countdown.classList.add("finished");
  const status = $("#feynman-status");
  if (status) status.textContent = timedOut ? "Time’s up. Review your explanation and identify what you missed." : "Response complete. Review the gaps before moving on.";
  $("[data-finish-feynman]")?.setAttribute("hidden", "");
  $("[data-next-feynman]")?.removeAttribute("hidden");
  recordStudyActivity();
  showToast(timedOut ? "Feynman writing time finished." : "Feynman response completed.");
}

function nextFeynmanPrompt() {
  state.feynmanPosition = (state.feynmanPosition + 1) % state.feynmanQueue.length;
  state.feynmanFinished = false;
  state.feynmanStartedAt = Date.now();
  state.feynmanResponse = "";
  renderLesson();
  window.setTimeout(() => $("[data-feynman-response]")?.focus(), 40);
}

function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function freestyleFeynmanDurationSeconds() {
  const amountInput = $("#freestyle-feynman-time");
  const amount = Math.max(1, Math.min(120, Math.floor(Number(amountInput.value) || 1)));
  amountInput.value = String(amount);
  return $("#freestyle-feynman-unit").value === "seconds" ? amount : amount * 60;
}

function updateFreestyleFeynmanTimer() {
  if (!freestyleFeynmanStartedAt) return;
  const remaining = Math.max(0, freestyleFeynmanDuration * 1000 - (Date.now() - freestyleFeynmanStartedAt));
  $("#freestyle-feynman-countdown").textContent = formatElapsed(remaining);
  if (remaining <= 0) {
    window.clearInterval(freestyleFeynmanTimerHandle);
    freestyleFeynmanTimerHandle = null;
    freestyleFeynmanStartedAt = null;
    $("#freestyle-feynman-status").textContent = "Time is up. Finish your current thought, then review what you could not explain clearly.";
    recordStudyActivity();
  }
}

function startFreestyleFeynman({ clearResponse = true } = {}) {
  const prompt = $("#freestyle-feynman-prompt-input").value.trim() || "Free writing session";
  freestyleFeynmanDuration = freestyleFeynmanDurationSeconds();
  freestyleFeynmanStartedAt = Date.now();
  window.clearInterval(freestyleFeynmanTimerHandle);
  $("#freestyle-feynman-setup").hidden = true;
  $("#freestyle-feynman-session").hidden = false;
  $("#freestyle-feynman-prompt").textContent = prompt;
  if (clearResponse) $("#freestyle-feynman-response").value = "";
  $("#freestyle-feynman-status").textContent = "Timer running. Keep developing your explanation.";
  updateFreestyleFeynmanTimer();
  freestyleFeynmanTimerHandle = window.setInterval(updateFreestyleFeynmanTimer, 250);
  $("#freestyle-feynman-response").focus();
}

function resetFreestyleFeynman() {
  window.clearInterval(freestyleFeynmanTimerHandle);
  freestyleFeynmanTimerHandle = null;
  freestyleFeynmanStartedAt = null;
  freestyleFeynmanDuration = 0;
  $("#freestyle-feynman-session").hidden = true;
  $("#freestyle-feynman-setup").hidden = false;
  $("#freestyle-feynman-response").value = "";
  $("#freestyle-feynman-status").textContent = "Timer running. Keep developing your explanation.";
  $("#freestyle-feynman-prompt-input").focus();
}

function updateAnkiTimer() {
  const display = $("#anki-elapsed");
  if (display && state.ankiStartedAt) display.textContent = formatElapsed(Date.now() - state.ankiStartedAt);
}

function rateAnkiCard(rating) {
  if (!$(".anki-review", $("#lesson-view"))?.classList.contains("ratings-ready")) return;
  const queueItem = state.ankiQueue.shift();
  if (!queueItem) return;
  const selectedIntervalDays = saveAnkiRating(queueItem.scheduleKey, rating, Date.now() - (state.ankiCardShownAt || Date.now()));
  buryAnkiSiblings(queueItem, state.ankiQueue);
  const buried = buriedAnkiKeys();
  state.ankiQueue = state.ankiQueue.filter((card) => !buried.has(card.scheduleKey));
  const graduated = applyAnkiSessionRating(queueItem, rating, selectedIntervalDays);
  if (!graduated) state.ankiQueue.push(queueItem);
  const finished = state.ankiQueue.length === 0;
  const elapsed = state.ankiStartedAt ? formatElapsed(Date.now() - state.ankiStartedAt) : "00:00";
  if (finished) {
    recordStudyActivity();
    markActiveAnkiComplete(state.activeCourse.id, "course");
    state.ankiReviewActive = false;
    state.ankiStartedAt = null;
    state.ankiCardShownAt = null;
    state.ankiPosition = 0;
  }
  if (!finished) state.ankiCardShownAt = Date.now();
  renderLesson();
  if (finished) showToast(`Anki session complete in ${elapsed} — no New, Learning, or Review cards remain.`);
}

function answerQuiz(button) {
  const chapter = state.activeCourse.chapters[state.activeChapter].miniUnits[state.activeMiniUnit];
  const quizzes = chapter.quizzes || [chapter.quiz];
  const questionIndex = Number(button.dataset.question || 0);
  const quiz = quizzes[questionIndex];
  const quizElement = button.closest(".offline-quiz");
  const selected = Number(button.dataset.answer);
  $$('[data-answer]', quizElement).forEach((option) => {
    option.disabled = true;
    if (Number(option.dataset.answer) === quiz.answer) option.classList.add("correct");
  });
  const correct = selected === quiz.answer;
  if (!correct) button.classList.add("incorrect");
  quizElement.dataset.answered = "true";
  quizElement.dataset.correct = String(correct);
  $(".quiz-feedback", quizElement).textContent = correct ? "Correct — you’ve got it." : `Not quite. The answer is ${quiz.options[quiz.answer]}.`;
  const answered = $$('.offline-quiz[data-answered="true"]', $("#lesson-view"));
  const correctCount = answered.filter((item) => item.dataset.correct === "true").length;
  if (answered.length === quizzes.length) recordStudyActivity();
  $("#quiz-score").textContent = answered.length === quizzes.length ? `${correctCount} of ${quizzes.length} correct` : `${answered.length} of ${quizzes.length} answered`;
}

function toggleLessonComplete(key) {
  const completed = new Set(JSON.parse(localStorage.getItem("study-desk-completed-lessons") || "[]"));
  if (completed.has(key)) completed.delete(key); else completed.add(key);
  localStorage.setItem("study-desk-completed-lessons", JSON.stringify([...completed]));
  if (completed.has(key)) recordStudyActivity();
  renderLesson();
  showToast(completed.has(key) ? "Lesson completed — progress saved on this Mac." : "Lesson marked incomplete.");
}

const STUDY_ALARMS_KEY = "your-study-buddy-alarms-v1";
const STUDY_ALARMS_AVAILABLE = false;

function loadStudyAlarms() {
  try { const alarms = JSON.parse(localStorage.getItem(STUDY_ALARMS_KEY) || "[]"); return Array.isArray(alarms) ? alarms : []; }
  catch { return []; }
}

function storeStudyAlarms(alarms) { localStorage.setItem(STUDY_ALARMS_KEY, JSON.stringify(alarms)); }

function notifyNativeAlarm(action, alarm) {
  const handler = window.webkit?.messageHandlers?.studyAlarm;
  if (handler) { handler.postMessage({ action, ...alarm }); return; }
  if (action === "schedule") window.desktopApp?.scheduleAlarm?.(alarm);
  if (action === "cancel") window.desktopApp?.cancelAlarm?.(alarm.id);
}

function formatAlarmDate(timestamp) {
  return new Date(timestamp).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderStudyAlarms() {
  const alarms = loadStudyAlarms().sort((a, b) => a.timestamp - b.timestamp);
  if (window.desktopApp) alarms.filter((alarm) => alarm.timestamp > Date.now()).forEach((alarm) => notifyNativeAlarm("schedule", alarm));
  $("#tasks-done-stat").textContent = String(alarms.length);
  $("#task-list").innerHTML = alarms.length ? alarms.map((alarm) => `<li class="task-item alarm-item"><span class="alarm-icon" aria-hidden="true">◷</span><div class="task-copy"><strong>${escapeHtml(alarm.title)}</strong><span>${escapeHtml(formatAlarmDate(alarm.timestamp))}${alarm.description ? ` · ${escapeHtml(alarm.description)}` : ""}</span></div><button class="icon-button remove-alarm" type="button" data-remove-alarm="${alarm.id}" aria-label="Remove ${escapeHtml(alarm.title)}">×</button></li>`).join("") : '<li class="alarm-empty"><strong>No alarms scheduled</strong><span>Create one and Your Study Buddy will notify this Mac when it is time to study.</span></li>';
  $$('[data-remove-alarm]').forEach((button) => button.addEventListener("click", () => {
    const alarm = alarms.find((item) => item.id === button.dataset.removeAlarm);
    if (!alarm || !window.confirm(`Remove the alarm “${alarm.title}”?`)) return;
    storeStudyAlarms(alarms.filter((item) => item.id !== alarm.id));
    notifyNativeAlarm("cancel", alarm);
    renderStudyAlarms();
    showToast("Study alarm removed.");
  }));
}

function restoreTasks() {
  if (!STUDY_ALARMS_AVAILABLE) return;
  renderStudyAlarms();
}
function wireTaskCheckbox() {}

function addStudyAlarm(title, description, timestamp) {
  const alarm = { id: `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, description, timestamp };
  const alarms = loadStudyAlarms();
  alarms.push(alarm);
  storeStudyAlarms(alarms);
  notifyNativeAlarm("schedule", alarm);
  renderStudyAlarms();
  return alarm;
}

const CUSTOM_DECKS_KEY = "your-study-buddy-custom-decks";
const STUDY_FOLDERS_KEY = "your-study-buddy-study-folders";
const STARRED_STUDY_ITEMS_KEY = "your-study-buddy-starred-study-items-v1";
const ACTIVE_ANKI_DECKS_KEY = "your-study-buddy-active-anki-decks-v1";
const ACTIVE_ANKI_SELECTIONS_KEY = "your-study-buddy-active-anki-selections-v1";

function restoreActiveAnkiSelections() {
  state.activeAnkiSelections = new Set(window.AnkiSelectionStorage.load(localStorage, ACTIVE_ANKI_SELECTIONS_KEY, localAnkiDayKey()));
}

function persistActiveAnkiSelections() {
  window.AnkiSelectionStorage.save(localStorage, ACTIVE_ANKI_SELECTIONS_KEY, localAnkiDayKey(), state.activeAnkiSelections);
}

function starredStudyItems() {
  try { return new Set(JSON.parse(localStorage.getItem(STARRED_STUDY_ITEMS_KEY) || "[]")); }
  catch { return new Set(); }
}

function isStudyItemStarred(itemId) {
  return starredStudyItems().has(itemId);
}

function toggleStudyItemStar(itemId) {
  const starred = starredStudyItems();
  if (starred.has(itemId)) starred.delete(itemId); else starred.add(itemId);
  localStorage.setItem(STARRED_STUDY_ITEMS_KEY, JSON.stringify([...starred]));
  renderCustomDecks();
  renderActiveAnkiDecks();
}

function loadActiveAnkiDecks() {
  try {
    const entries = JSON.parse(localStorage.getItem(ACTIVE_ANKI_DECKS_KEY) || "[]");
    return Array.isArray(entries) ? entries.filter((entry) => entry?.id && ["course", "deck"].includes(entry.target)) : [];
  } catch { return []; }
}

function storeActiveAnkiDecks(entries) {
  localStorage.setItem(ACTIVE_ANKI_DECKS_KEY, JSON.stringify(entries));
}

function activateAnkiDeck(id, target) {
  const entries = loadActiveAnkiDecks();
  const existing = entries.find((entry) => entry.id === id && entry.target === target);
  if (existing) existing.lastOpenedAt = Date.now();
  else entries.push({ id, target, activatedAt: Date.now(), lastOpenedAt: Date.now(), completedDay: "" });
  storeActiveAnkiDecks(entries);
  renderActiveAnkiDecks();
}

function markActiveAnkiComplete(id, target) {
  const entries = loadActiveAnkiDecks();
  const existing = entries.find((entry) => entry.id === id && entry.target === target);
  if (existing) existing.completedDay = localAnkiDayKey();
  else entries.push({ id, target, activatedAt: Date.now(), lastOpenedAt: Date.now(), completedDay: localAnkiDayKey() });
  storeActiveAnkiDecks(entries);
  renderActiveAnkiDecks();
}

function removeActiveAnkiDeck(id, target) {
  storeActiveAnkiDecks(loadActiveAnkiDecks().filter((entry) => entry.id !== id || entry.target !== target));
  state.activeAnkiSelections.delete(`${target}:${id}`);
  persistActiveAnkiSelections();
  renderActiveAnkiDecks();
}

function makeLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadCustomDecks() {
  return loadLocalArray(CUSTOM_DECKS_KEY, (deck) => deck && Array.isArray(deck.cards));
}

function storeCustomDecks(decks) {
  try {
    const serialized = JSON.stringify(decks);
    localStorage.setItem(CUSTOM_DECKS_KEY, serialized);
    warnIfLocalPayloadLarge(serialized);
    return true;
  } catch (error) {
    showToast("This image is too large to save locally. Try a smaller image.");
    return false;
  }
}

function warnIfLocalPayloadLarge(serialized) {
  if (String(serialized || "").length * 2 < 4 * 1048576 || sessionStorage.getItem("study-buddy-storage-warning-shown")) return;
  sessionStorage.setItem("study-buddy-storage-warning-shown", "true");
  showToast("Your local study data is getting large. Export a backup from Settings.");
}

function loadStudyFolders() {
  return loadLocalArray(STUDY_FOLDERS_KEY, (folder) => folder?.id && folder?.name && Array.isArray(folder.deckIds)).map((folder) => ({
      ...folder,
      color: /^#[0-9a-f]{6}$/i.test(folder.color || "") ? folder.color : "#d9b66f",
      expanded: Boolean(folder.expanded),
    }));
}

function storeStudyFolders(folders) {
  localStorage.setItem(STUDY_FOLDERS_KEY, JSON.stringify(folders));
}

function removeDecksFromFolders(deckIds) {
  const removed = new Set(deckIds);
  storeStudyFolders(loadStudyFolders().map((folder) => ({ ...folder, deckIds: folder.deckIds.filter((id) => !removed.has(id)) })));
}

function createStudyFolder() {
  state.editingStudyFolderId = null;
  $("#folder-editor-title").textContent = "Create a folder";
  $("#folder-editor-name").value = "";
  $("#folder-editor-color").value = "#d9b66f";
  $("#save-folder-editor").textContent = "Create folder";
  $("#folder-editor-dialog").showModal();
  $("#folder-editor-name").focus();
}

function toggleStudyFolder(folderId) {
  const folders = loadStudyFolders();
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;
  folder.expanded = !folder.expanded;
  storeStudyFolders(folders);
  renderCustomDecks();
}

function setStudyFolderColor(folderId, color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  const folders = loadStudyFolders();
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;
  folder.color = color;
  storeStudyFolders(folders);
  renderCustomDecks();
}

function assignDeckToFolder(deckId, folderId) {
  const folders = loadStudyFolders().map((folder) => ({ ...folder, deckIds: folder.deckIds.filter((id) => id !== deckId) }));
  const destination = folders.find((folder) => folder.id === folderId);
  if (destination) {
    destination.deckIds.push(deckId);
    destination.expanded = true;
  }
  storeStudyFolders(folders);
  renderCustomDecks();
}

function wireStudySetDragAndDrop() {
  let draggedDeckId = "";
  const cards = $$('[data-drag-deck]');
  const targets = $$('[data-drop-folder]');
  const clearTargets = () => targets.forEach((target) => target.classList.remove("deck-drop-active"));
  cards.forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggedDeckId = card.dataset.dragDeck;
      card.classList.add("dragging-study-set");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedDeckId);
    });
    card.addEventListener("dragend", () => {
      draggedDeckId = "";
      card.classList.remove("dragging-study-set");
      clearTargets();
    });
  });
  targets.forEach((target) => {
    target.addEventListener("dragover", (event) => {
      if (!draggedDeckId && !event.dataTransfer.types.includes("text/plain")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearTargets();
      target.classList.add("deck-drop-active");
    });
    target.addEventListener("dragleave", (event) => {
      if (!target.contains(event.relatedTarget)) target.classList.remove("deck-drop-active");
    });
    target.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const deckId = draggedDeckId || event.dataTransfer.getData("text/plain");
      if (!deckId) return;
      const folderId = target.dataset.dropFolder || "";
      const folder = loadStudyFolders().find((item) => item.id === folderId);
      assignDeckToFolder(deckId, folderId);
      showToast(folder ? `Study set moved to ${folder.name}.` : "Study set moved out of its folder.");
    });
  });
}

function renameStudyFolder(folderId) {
  const folders = loadStudyFolders();
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;
  state.editingStudyFolderId = folderId;
  $("#folder-editor-title").textContent = "Edit folder";
  $("#folder-editor-name").value = folder.name;
  $("#folder-editor-color").value = folder.color;
  $("#save-folder-editor").textContent = "Save changes";
  $("#folder-editor-dialog").showModal();
  $("#folder-editor-name").focus();
}

function saveStudyFolderEditor() {
  const name = $("#folder-editor-name").value.trim();
  const color = $("#folder-editor-color").value;
  if (!name) return;
  const folders = loadStudyFolders();
  const existing = folders.find((folder) => folder.id === state.editingStudyFolderId);
  if (existing) {
    existing.name = name;
    existing.color = color;
  } else {
    folders.push({ id: makeLocalId("folder"), name, color, expanded: false, deckIds: [] });
  }
  storeStudyFolders(folders);
  $("#folder-editor-dialog").close();
  state.editingStudyFolderId = null;
  renderCustomDecks();
  showToast(existing ? `${name} updated.` : `${name} created.`);
}

function deleteStudyFolder(folderId) {
  const folders = loadStudyFolders();
  const folder = folders.find((item) => item.id === folderId);
  if (!folder || !window.confirm(`Delete the folder “${folder.name}”? Its study sets will remain in My Study Sets.`)) return;
  storeStudyFolders(folders.filter((item) => item.id !== folderId));
  renderCustomDecks();
  showToast(`${folder.name} deleted. Its study sets were not deleted.`);
}

function exportableStudyDecks() {
  const personal = loadCustomDecks().map((deck) => ({ id: deck.id, name: deck.name, cards: deck.cards, questions: deck.questions || [], feynmanPrompts: deck.feynmanPrompts || [], group: "Personal sets" }));
  const builtIn = builtInFlashcardCollections.filter((collection) => isFlashcardCollectionAdded(collection.id)).map((collection) => {
    const effective = effectiveBuiltInCollection(collection);
    return { id: effective.id, name: effective.name, cards: effective.units.flatMap((unit) => unit.cards), questions: effective.units.flatMap((unit) => unit.questions || []), feynmanPrompts: effective.units.flatMap((unit) => unit.feynmanPrompts || []), group: "Built-in sets" };
  });
  const folders = loadStudyFolders().map((folder) => {
    const deck = findStudyDeck(`folder:${folder.id}`);
    return deck ? { id: deck.id, name: folder.name, cards: deck.cards, questions: deck.questions || [], feynmanPrompts: deck.feynmanPrompts || [], group: "Folders" } : null;
  }).filter((deck) => deck?.cards?.length);
  return [...folders, ...personal, ...builtIn].filter((deck) => deck.cards.length);
}

function renderExportPage() {
  const select = $("#export-deck-select");
  const decks = exportableStudyDecks();
  const previous = select.value;
  if (!decks.length) {
    select.innerHTML = '<option value="">No flashcard sets available</option>';
    select.disabled = true;
    $("#export-study-set").disabled = true;
    $("#export-selection-summary").textContent = "Create or add a study set before exporting.";
    renderNoteExportPage();
    return;
  }
  select.disabled = false;
  $("#export-study-set").disabled = false;
  const groups = [...new Set(decks.map((deck) => deck.group))];
  select.innerHTML = groups.map((group) => `<optgroup label="${escapeHtml(group)}">${decks.filter((deck) => deck.group === group).map((deck) => `<option value="${escapeHtml(deck.id)}">${escapeHtml(deck.name)} · ${deck.cards.length} cards</option>`).join("")}</optgroup>`).join("");
  if (decks.some((deck) => deck.id === previous)) select.value = previous;
  updateExportSummary();
  renderNoteExportPage();
}

function selectedExportDeck() {
  return exportableStudyDecks().find((deck) => deck.id === $("#export-deck-select").value);
}

function updateExportSummary() {
  const deck = selectedExportDeck();
  $("#export-selection-summary").textContent = deck ? `${deck.cards.length} flashcards will be exported from ${deck.name}.` : "Choose a study set.";
}

function exportDelimitedText(deck, format) {
  const separator = format === "csv" ? "," : "\t";
  const quote = (value) => {
    const text = String(value || "").replace(/\r?\n/g, "<br>");
    return format === "csv" ? `"${text.replace(/"/g, '""')}"` : text.replace(/\t/g, " ");
  };
  const rows = format === "csv" ? [["Front", "Back"]] : [];
  rows.push(...deck.cards.map((card) => [card.front || "", card.back || ""]));
  return rows.map((row) => row.map(quote).join(separator)).join("\n");
}

function safeExportName(name) {
  return String(name || "Study deck").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "Study deck";
}

function browserDownload(name, format, text) {
  const blob = new Blob([text], { type: format === "csv" ? "text/csv;charset=utf-8" : format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeExportName(name)}.${format}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function portableUserData() {
  const storage = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && /^(?:your-study-buddy|study-desk)-/.test(key)) storage[key] = localStorage.getItem(key);
  }
  const assets = [];
  for (const note of loadNotebookNotes().filter((item) => item.type === "pdf" && item.pdfAssetId)) {
    const blob = await getNotebookAsset(note.pdfAssetId);
    if (!blob) continue;
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("A PDF could not be included in the backup."));
      reader.readAsDataURL(blob);
    });
    assets.push({ id: note.pdfAssetId, data });
  }
  return { application: "Your Study Buddy", version: 1, exportedAt: new Date().toISOString(), storage, assets };
}

const nativeUserDataExportResolvers = new Map();
window.resolveNativeUserDataExport = (requestId, result) => {
  const resolve = nativeUserDataExportResolvers.get(String(requestId));
  if (!resolve) return;
  nativeUserDataExportResolvers.delete(String(requestId));
  resolve(result || { error: "The native backup export did not return a result." });
};

function exportUserDataWithNativeMac(payload) {
  const handler = window.webkit?.messageHandlers?.userDataExport;
  if (!handler) return null;
  const requestId = makeLocalId("backup-export");
  return new Promise((resolve) => {
    nativeUserDataExportResolvers.set(requestId, resolve);
    handler.postMessage({ ...payload, requestId });
  });
}

async function exportUserInformation() {
  $("#settings-export-status").textContent = "Preparing your backup…";
  const backup = await portableUserData();
  const name = `Your Study Buddy backup ${localStudyDate()}`;
  const payload = { name, json: JSON.stringify(backup) };
  const nativeMacExport = exportUserDataWithNativeMac(payload);
  if (!window.desktopApp?.exportUserData && !nativeMacExport) throw new Error("Backup export is only available in the installed desktop app.");
  const result = nativeMacExport ? await nativeMacExport : await window.desktopApp.exportUserData(payload);
  if (result?.error) throw new Error(result.error);
  if (result?.canceled) {
    $("#settings-export-status").textContent = "Backup export canceled.";
    return;
  }
  $("#settings-export-status").textContent = `Backup saved and verified${result?.path ? ` at ${result.path}` : ""}. Keep the JSON file somewhere safe.`;
  showToast("Your information was exported and verified.");
}

async function restoreUserInformation(file) {
  const status = $("#settings-export-status");
  try {
    const payload = JSON.parse(await file.text());
    if (payload?.application !== "Your Study Buddy" || payload?.version !== 1 || !payload.storage || typeof payload.storage !== "object") throw new Error("This is not a valid Your Study Buddy backup.");
    const keys = Object.keys(payload.storage).filter((key) => /^(?:your-study-buddy|study-desk)-/.test(key));
    if (!keys.length) throw new Error("This backup does not contain any study data.");
    if (!window.confirm(`Restore ${keys.length} saved data groups? This will replace matching information currently in the app.`)) { status.textContent = "Restore canceled."; return; }
    keys.forEach((key) => { if (typeof payload.storage[key] === "string") localStorage.setItem(key, payload.storage[key]); });
    for (const asset of Array.isArray(payload.assets) ? payload.assets : []) {
      if (!asset?.id || !/^data:application\/pdf;base64,/i.test(asset.data || "")) continue;
      const response = await fetch(asset.data);
      await setNotebookAsset(asset.id, await response.blob());
    }
    status.textContent = "Backup restored. Reloading your study data…";
    window.setTimeout(() => window.location.reload(), 250);
  } catch (error) {
    status.textContent = error.message || "The backup could not be restored.";
    showToast("The backup could not be restored.");
  }
}

function downloadExportBlob(name, extension, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeExportName(name)}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function blobAsDataUrl(blob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("The exported file could not be prepared."));
    reader.readAsDataURL(blob);
  });
}

async function saveExportedNoteBlob(note, extension, blob) {
  const payload = { name: safeExportName(note.title || note.sourceFileName || "Note"), extension, data: await blobAsDataUrl(blob) };
  if (window.desktopApp?.exportNote) {
    const result = await window.desktopApp.exportNote(payload);
    if (result?.error) throw new Error(result.error);
    return result;
  }
  const handler = window.webkit?.messageHandlers?.noteExport;
  if (handler) { handler.postMessage(payload); return { native: true }; }
  downloadExportBlob(payload.name, extension, blob);
  return { downloaded: true };
}

let noteExportState = { noteId: "", contentBounds: null, selection: null, viewBounds: null, dragging: false, dragStart: null };

function exportableNotes() {
  return loadNotebookNotes().slice().sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
}

function noteExportDimensions(note) {
  const pageCount = Math.max(1, Number(note?.pageCount) || Number(note?.documentPages?.length) || 1);
  return note?.canvasMode === "page"
    ? { width: PAGE_CANVAS_WIDTH, height: PAGE_CANVAS_HEIGHT * pageCount + PAGE_CANVAS_GAP * Math.max(0, pageCount - 1) }
    : { width: Math.max(1, Number(note?.drawingWidth) || DRAWING_CANVAS_WIDTH), height: Math.max(1, Number(note?.drawingHeight) || DRAWING_CANVAS_HEIGHT) };
}

function clampExportBounds(bounds, dimensions) {
  const x = Math.max(0, Math.min(dimensions.width - 1, Number(bounds?.x) || 0));
  const y = Math.max(0, Math.min(dimensions.height - 1, Number(bounds?.y) || 0));
  const width = Math.max(1, Math.min(dimensions.width - x, Number(bounds?.width) || 1));
  const height = Math.max(1, Math.min(dimensions.height - y, Number(bounds?.height) || 1));
  return { x, y, width, height };
}

function noteContentBounds(note) {
  const dimensions = noteExportDimensions(note);
  if (note?.canvasMode === "page" || note?.pageLayout === "document") return { x: 0, y: 0, ...dimensions };
  if (note?.drawing) return { x: 0, y: 0, ...dimensions };
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  const include = (x, y, padding = 0) => {
    if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return;
    minX = Math.min(minX, Number(x) - padding); minY = Math.min(minY, Number(y) - padding);
    maxX = Math.max(maxX, Number(x) + padding); maxY = Math.max(maxY, Number(y) + padding);
  };
  (note?.drawingStrokes || []).forEach((stroke) => (stroke.points || []).forEach((point) => include(point.x, point.y, Math.max(3, Number(stroke.width) || 2) / 2)));
  (note?.drawingTexts || []).forEach((item) => {
    const fontSize = Math.max(8, Number(item.screenFontSize) || Number(item.fontSize) || 16);
    const width = Math.max(24, Number(item.screenWidth) || 180);
    const height = Math.max(fontSize * 1.35, Number(item.screenHeight) || 36);
    include(item.x, item.y); include(Number(item.x) + width, Number(item.y) + height);
  });
  (note?.drawingImages || []).forEach((item) => {
    const padding = item.caption ? 32 : 0;
    include(item.x, item.y); include(Number(item.x) + Number(item.width || 0), Number(item.y) + Number(item.height || 0) + padding);
  });
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: Math.min(800, dimensions.width), height: Math.min(600, dimensions.height) };
  const padding = Math.max(20, Math.min(80, Math.max(maxX - minX, maxY - minY) * 0.04));
  return clampExportBounds({ x: minX - padding, y: minY - padding, width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 }, dimensions);
}

function paddedNoteExportView(bounds, note) {
  const dimensions = noteExportDimensions(note);
  const paddingX = Math.max(12, bounds.width * .08); const paddingY = Math.max(12, bounds.height * .08);
  return clampExportBounds({ x: bounds.x - paddingX, y: bounds.y - paddingY, width: bounds.width + paddingX * 2, height: bounds.height + paddingY * 2 }, dimensions);
}

function selectedExportNote() {
  return exportableNotes().find((note) => note.id === $("#export-note-select")?.value);
}

function noteExportFormats(note) {
  if (note?.type === "pdf") return [{ value: "pdf", label: "PDF · Original document" }];
  if (note?.type === "word" || note?.pageLayout === "document") return [{ value: "html", label: "HTML · Keeps formatting" }, { value: "txt", label: "TXT · Plain text" }];
  return [{ value: "png", label: "PNG · Cropped image" }];
}

function renderNoteExportPage() {
  const select = $("#export-note-select");
  if (!select) return;
  const notes = exportableNotes();
  const previous = noteExportState.noteId || select.value;
  if (!notes.length) {
    select.innerHTML = '<option value="">No notes available</option>';
    select.disabled = true;
    $("#export-note-button").disabled = true;
    $("#export-note-summary").textContent = "Create or import a note before exporting.";
    $("#export-note-preview-empty").hidden = false;
    return;
  }
  select.disabled = false;
  $("#export-note-button").disabled = false;
  select.innerHTML = notes.map((note) => `<option value="${escapeHtml(note.id)}">${escapeHtml(note.title || "Untitled note")}</option>`).join("");
  select.value = notes.some((note) => note.id === previous) ? previous : notes[0].id;
  configureSelectedNoteExport();
}

function configureSelectedNoteExport() {
  const note = selectedExportNote();
  if (!note) return;
  noteExportState.noteId = note.id;
  noteExportState.contentBounds = noteContentBounds(note);
  noteExportState.selection = { ...noteExportState.contentBounds };
  noteExportState.viewBounds = paddedNoteExportView(noteExportState.contentBounds, note);
  const format = $("#export-note-format");
  format.innerHTML = noteExportFormats(note).map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
  const isCanvas = note.type === "drawing" && note.pageLayout !== "document";
  $("#export-note-crop-fields").hidden = !isCanvas;
  $("#export-note-crop-actions").hidden = !isCanvas;
  $("#export-note-help").hidden = !isCanvas;
  $("#export-note-preview").style.cursor = isCanvas ? "crosshair" : "default";
  $("#export-note-summary").textContent = note.type === "pdf" ? "The original imported PDF will be exported." : isCanvas ? "Only the outlined section will be exported. Open notes start fitted to their actual content." : "This typed note will keep its text and basic formatting.";
  syncNoteExportCropInputs();
  drawNoteExportPreview();
}

function syncNoteExportCropInputs() {
  const selection = noteExportState.selection;
  if (!selection) return;
  [["x", "#export-note-crop-x"], ["y", "#export-note-crop-y"], ["width", "#export-note-crop-width"], ["height", "#export-note-crop-height"]].forEach(([key, selector]) => {
    const input = $(selector); if (input) input.value = String(Math.round(selection[key]));
  });
}

function documentNoteHtml(note) {
  if (note.type === "word") return note.html || "";
  const pages = Array.isArray(note.documentPages) && note.documentPages.length ? note.documentPages : [note.pageDocumentContent || ""];
  return pages.map((page, index) => `<section class="note-page" data-page="${index + 1}">${page || ""}</section>`).join("\n");
}

function textFromHtml(html) {
  const node = document.createElement("div"); node.innerHTML = html || ""; return node.innerText || "";
}

function drawWrappedExportText(ctx, text, x, y, maxWidth, lineHeight) {
  String(text || "").split("\n").forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/); let line = "";
    if (!paragraph && paragraphIndex >= 0) { y += lineHeight; return; }
    words.forEach((word) => {
      const trial = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(trial).width > maxWidth) { ctx.fillText(line, x, y); y += lineHeight; line = word; }
      else line = trial;
    });
    if (line) { ctx.fillText(line, x, y); y += lineHeight; }
  });
  return y;
}

async function loadExportImage(source) {
  if (!source) return null;
  return await new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = source; });
}

async function paintNoteExport(ctx, note, sourceBounds, targetWidth, targetHeight, includeSelection = false) {
  ctx.save(); ctx.clearRect(0, 0, targetWidth, targetHeight); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, targetWidth, targetHeight);
  const scale = Math.min(targetWidth / sourceBounds.width, targetHeight / sourceBounds.height);
  const offsetX = (targetWidth - sourceBounds.width * scale) / 2; const offsetY = (targetHeight - sourceBounds.height * scale) / 2;
  ctx.translate(offsetX, offsetY); ctx.scale(scale, scale); ctx.translate(-sourceBounds.x, -sourceBounds.y);
  if (note.type === "drawing" && note.pageLayout !== "document") {
    if (note.drawing) { const image = await loadExportImage(note.drawing); if (image) { ctx.save(); ctx.globalAlpha = .7; ctx.drawImage(image, 0, 0, noteExportDimensions(note).width, noteExportDimensions(note).height); ctx.restore(); } }
    for (const item of (note.drawingImages || [])) {
      const image = await loadExportImage(item.src);
      if (!image) continue;
      const width = Math.max(1, Number(item.width) || image.naturalWidth || 1); const height = Math.max(1, Number(item.height) || image.naturalHeight || 1);
      const centerX = Number(item.x) + width / 2; const centerY = Number(item.y) + height / 2;
      ctx.save(); ctx.translate(centerX, centerY); ctx.rotate((Number(item.rotation) || 0) * Math.PI / 180); ctx.drawImage(image, -width / 2, -height / 2, width, height);
      if (item.caption) { ctx.fillStyle = "#34384a"; ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(item.caption, 0, height / 2 + 8, Math.max(120, width)); }
      ctx.restore();
    }
    (note.drawingStrokes || []).forEach((stroke) => {
      const points = stroke.points || []; if (!points.length) return;
      ctx.save(); ctx.strokeStyle = stroke.color || "#171b2d"; ctx.fillStyle = stroke.color || "#171b2d"; ctx.lineCap = stroke.tool === "calligraphy" ? "square" : "round"; ctx.lineJoin = "round";
      if (stroke.tool === "highlighter") ctx.globalAlpha = .25; else if (stroke.tool === "pencil") ctx.globalAlpha = .62; else if (stroke.tool === "marker") ctx.globalAlpha = .86;
      if (stroke.tool === "calligraphy" && points.length > 1) {
        const nibAngle = -Math.PI / 4;
        for (let index = 1; index < points.length; index += 1) { const from = points[index - 1]; const to = points[index]; const direction = Math.atan2(to.y - from.y, to.x - from.x); ctx.lineWidth = Math.max((Number(stroke.width) || 2) * .14, (Number(stroke.width) || 2) * Math.abs(Math.sin(direction - nibAngle))); ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); }
      } else { ctx.lineWidth = Math.max(1, Number(stroke.width) || 2); ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y)); points.length === 1 ? ctx.fillRect(points[0].x, points[0].y, ctx.lineWidth, ctx.lineWidth) : ctx.stroke(); }
      ctx.restore();
    });
    (note.drawingTexts || []).forEach((item) => {
      const size = Math.max(8, Number(item.screenFontSize) || Number(item.fontSize) || 16); ctx.save(); ctx.fillStyle = item.color || "#171b2d"; ctx.font = `${item.italic ? "italic " : ""}${item.bold || /^h[1-3]$/.test(item.style || "") ? "700 " : "400 "}${size}px ${item.fontFamily || "Arial"}`; ctx.textBaseline = "top"; drawWrappedExportText(ctx, item.text || "", Number(item.x) || 0, Number(item.y) || 0, Math.max(24, Number(item.screenWidth) || 180), size * 1.25); ctx.restore();
    });
  } else {
    ctx.fillStyle = "#171b2d"; ctx.font = "18px Arial"; ctx.textBaseline = "top"; drawWrappedExportText(ctx, textFromHtml(documentNoteHtml(note)), sourceBounds.x + 40, sourceBounds.y + 40, Math.max(120, sourceBounds.width - 80), 27);
  }
  ctx.restore();
  return { scale, offsetX, offsetY };
}

async function drawNoteExportPreview() {
  const canvas = $("#export-note-preview"); const note = selectedExportNote(); if (!canvas || !note) return;
  const ctx = canvas.getContext("2d"); const empty = $("#export-note-preview-empty"); empty.hidden = true;
  if (note.type === "pdf") { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#f4f4f8"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#5b5bd6"; ctx.font = "700 26px Arial"; ctx.textAlign = "center"; ctx.fillText("PDF", canvas.width / 2, canvas.height / 2 - 10); ctx.fillStyle = "#73798d"; ctx.font = "16px Arial"; ctx.fillText("The original document will be exported", canvas.width / 2, canvas.height / 2 + 25); ctx.textAlign = "start"; return; }
  const view = noteExportState.viewBounds || noteContentBounds(note); await paintNoteExport(ctx, note, view, canvas.width, canvas.height);
  if (note.type !== "drawing" || note.pageLayout === "document") return;
  const selection = noteExportState.selection; const scale = Math.min(canvas.width / view.width, canvas.height / view.height); const ox = (canvas.width - view.width * scale) / 2; const oy = (canvas.height - view.height * scale) / 2;
  const x = ox + (selection.x - view.x) * scale; const y = oy + (selection.y - view.y) * scale; const width = selection.width * scale; const height = selection.height * scale;
  ctx.save(); ctx.fillStyle = "rgba(23,27,45,.34)"; ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height); ctx.rect(x, y, width, height); ctx.fill("evenodd"); ctx.strokeStyle = "#5b5bd6"; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.strokeRect(x, y, width, height); ctx.restore();
}

function updateNoteExportSelectionFromInputs() {
  const note = selectedExportNote(); if (!note) return;
  const values = { x: Number($("#export-note-crop-x").value), y: Number($("#export-note-crop-y").value), width: Number($("#export-note-crop-width").value), height: Number($("#export-note-crop-height").value) };
  noteExportState.selection = clampExportBounds(values, noteExportDimensions(note));
  const selection = noteExportState.selection; const content = noteExportState.contentBounds;
  const x = Math.min(selection.x, content.x); const y = Math.min(selection.y, content.y); const right = Math.max(selection.x + selection.width, content.x + content.width); const bottom = Math.max(selection.y + selection.height, content.y + content.height);
  noteExportState.viewBounds = clampExportBounds({ x, y, width: right - x, height: bottom - y }, noteExportDimensions(note));
  syncNoteExportCropInputs(); drawNoteExportPreview();
}

async function exportSelectedNote() {
  const note = selectedExportNote(); if (!note) { showToast("Choose a note to export."); return; }
  const format = $("#export-note-format").value;
  $("#export-note-status").textContent = "Preparing your note…";
  if (format === "pdf") {
    const blob = await getNotebookAsset(note.pdfAssetId); if (!blob) { $("#export-note-status").textContent = "The original PDF could not be found."; showToast("The PDF could not be exported."); return; }
    const result = await saveExportedNoteBlob(note, "pdf", blob); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "html") {
    const body = documentNoteHtml(note); const file = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(note.title || "Note")}</title><style>body{margin:0;background:#eee;font:16px/1.5 Arial,sans-serif}.note-page{box-sizing:border-box;width:8.5in;min-height:11in;margin:24px auto;padding:.75in;background:#fff;box-shadow:0 2px 12px #bbb}@media print{body{background:#fff}.note-page{margin:0;box-shadow:none;break-after:page}}</style></head><body>${body}</body></html>`; const result = await saveExportedNoteBlob(note, "html", new Blob([file], { type: "text/html;charset=utf-8" })); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "txt") { const result = await saveExportedNoteBlob(note, "txt", new Blob([notebookNotePlainText(note)], { type: "text/plain;charset=utf-8" })); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; } }
  else {
    const selection = noteExportState.selection || noteContentBounds(note); const maxDimension = 4096; const scale = Math.min(2, maxDimension / Math.max(selection.width, selection.height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(selection.width * scale)); canvas.height = Math.max(1, Math.round(selection.height * scale)); await paintNoteExport(canvas.getContext("2d"), note, selection, canvas.width, canvas.height); const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("The image could not be created."); const result = await saveExportedNoteBlob(note, "png", blob); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  }
  $("#export-note-status").textContent = `${note.title || "Note"} exported as ${format.toUpperCase()}.`; showToast("Note exported.");
}

async function exportSelectedStudyDeck() {
  const deck = selectedExportDeck();
  if (!deck) { showToast("Choose a flashcard set to export."); return; }
  const format = $('input[name="exportFormat"]:checked')?.value || "apkg";
  if (format === "json") {
    const completeSet = { application: "Your Study Buddy", version: 1, type: "study-set", exportedAt: new Date().toISOString(), name: deck.name, cards: deck.cards || [], questions: deck.questions || [], feynmanPrompts: deck.feynmanPrompts || [] };
    browserDownload(deck.name, "json", JSON.stringify(completeSet, null, 2));
    $("#export-status").textContent = `${completeSet.cards.length} cards, ${completeSet.questions.length} questions, and ${completeSet.feynmanPrompts.length} Feynman prompts exported.`;
    showToast(`${deck.name} exported.`);
    return;
  }
  async function portableImageData(source) {
    if (!source) return "";
    if (String(source).startsWith("data:")) return String(source);
    try {
      const response = await fetch(source);
      if (!response.ok) return "";
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch (_) { return ""; }
  }
  const exportedCards = await Promise.all(deck.cards.map(async (card) => ({
    front: String(card.front || ""),
    back: String(card.back || ""),
    frontImage: await portableImageData(card.frontImage),
    backImage: await portableImageData(card.backImage),
    scheduleKey: customAnkiKey(card.sourceDeckId || deck.id, card.id),
    schedule: ankiScheduleFor(customAnkiKey(card.sourceDeckId || deck.id, card.id)),
  })));
  let reviewLogs = [];
  try { reviewLogs = JSON.parse(localStorage.getItem(ANKI_REVIEW_LOG_KEY) || "[]"); } catch { reviewLogs = []; }
  const exportedKeys = new Set(exportedCards.map((card) => card.scheduleKey));
  const payload = {
    name: safeExportName(deck.name),
    format,
    cards: exportedCards,
    reviewLogs: reviewLogs.filter((log) => exportedKeys.has(log.cardKey)),
  };
  $("#export-status").textContent = `Preparing ${payload.cards.length} cards…`;
  if (window.desktopApp?.exportStudyDeck) {
    const result = await window.desktopApp.exportStudyDeck(payload);
    if (result?.error) { $("#export-status").textContent = result.error; showToast("The deck could not be exported."); return; }
    if (result?.canceled) { $("#export-status").textContent = "Export canceled."; return; }
    $("#export-status").textContent = `${payload.cards.length} cards exported as ${format.toUpperCase()}.`;
    showToast(`${deck.name} exported.`);
    return;
  }
  const handler = window.webkit?.messageHandlers?.studyExport;
  if (handler) {
    handler.postMessage(payload);
    $("#export-status").textContent = "Choose where to save the exported deck…";
    return;
  }
  if (format === "apkg") {
    $("#export-status").textContent = "APKG export is available in the Mac and Windows desktop apps.";
    showToast("Open the desktop app to export APKG files.");
    return;
  }
  browserDownload(deck.name, format, exportDelimitedText(deck, format));
  $("#export-status").textContent = `${payload.cards.length} cards exported as ${format.toUpperCase()}.`;
}

window.receiveStudyExportResult = (result) => {
  if (result?.error) { $("#export-status").textContent = result.error; showToast("The deck could not be exported."); return; }
  if (result?.canceled) { $("#export-status").textContent = "Export canceled."; return; }
  $("#export-status").textContent = `${result.count || 0} cards exported as ${String(result.format || "file").toUpperCase()}.`;
  showToast("Flashcards exported.");
};

function readFlashcardImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || "").startsWith("image/")) { reject(new Error("Choose an image file.")); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const source = String(reader.result || "");
      const image = new Image();
      image.onerror = () => reject(new Error("The image could not be opened."));
      image.onload = () => {
        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const outputType = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
        resolve(canvas.toDataURL(outputType, 0.86));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

function renderManualImagePreview(side) {
  const data = side === "front" ? state.manualFrontImage : state.manualBackImage;
  const image = $(`#manual-${side}-image-preview`);
  const remove = $(`[data-remove-manual-image="${side}"]`);
  image.src = data || "";
  image.hidden = !data;
  remove.hidden = !data;
}

function applyCardImage(target, dataUrl) {
  if (!target) return;
  const property = target.side === "front" ? "frontImage" : "backImage";
  if (target.kind === "manual") {
    if (target.side === "front") state.manualFrontImage = dataUrl;
    else state.manualBackImage = dataUrl;
    renderManualImagePreview(target.side);
    return;
  }
  const card = state.customDraft[target.index];
  if (!card) return;
  card[property] = dataUrl;
  renderCustomDraft();
}

async function acceptCardImage(file, target) {
  try {
    applyCardImage(target, await readFlashcardImage(file));
    showToast("Image added to the card.");
  } catch (error) {
    showToast(error.message || "The image could not be added.");
  }
}

function handleCardPaste(event, target) {
  const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"));
  if (!imageItem) return;
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  acceptCardImage(file, target);
}

function confirmImageRemoval(button, removeImage) {
  if (button.dataset.confirmingRemove === "true") { delete button.dataset.confirmingRemove; removeImage(); return; }
  button.dataset.confirmingRemove = "true"; const originalLabel = button.textContent; button.textContent = "Click again to remove"; button.classList.add("confirming-remove");
  window.setTimeout(() => { if (!button.isConnected || button.dataset.confirmingRemove !== "true") return; delete button.dataset.confirmingRemove; button.textContent = originalLabel; button.classList.remove("confirming-remove"); }, 2500);
}

function cardTextArea(target) {
  if (!target) return null;
  if (target.kind === "manual") return $(`#manual-card-${target.side}`);
  return $(`[data-draft-${target.side}="${target.index}"]`);
}

function openDrawingTool(target) {
  state.pendingDrawingTarget = target;
  state.drawingTool = "pen";
  state.drawingHistory = [];
  $$('[data-drawing-tool]').forEach((button) => button.classList.toggle("active", button.dataset.drawingTool === "pen"));
  const canvas = $("#flashcard-drawing-canvas");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  const property = target.side === "front" ? "frontImage" : "backImage";
  const existing = target.kind === "manual" ? (target.side === "front" ? state.manualFrontImage : state.manualBackImage) : state.customDraft[target.index]?.[property];
  const remember = () => { state.drawingHistory = [canvas.toDataURL("image/png")]; };
  if (existing) {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      remember();
    };
    image.onerror = remember;
    image.src = existing;
  } else remember();
  $("#drawing-dialog-title").textContent = `Draw on the ${target.side}`;
  $("#drawing-dialog").showModal();
}

function closeDrawingTool() {
  $("#drawing-dialog").close();
  state.pendingDrawingTarget = null;
  state.drawingHistory = [];
}

const MATH_GLOSSARY = [
  { group: "Calculus", name: "Indefinite integral", syntax: "∫ f(x) dx", description: "Antiderivative of a function" },
  { group: "Calculus", name: "Definite integral", syntax: "\\int_{a}^{b} f(x) dx", description: "Accumulation from lower bound a to upper bound b" },
  { group: "Calculus", name: "Double integral", syntax: "∬ᴿ f(x,y) dA", description: "Integral over a two-dimensional region" },
  { group: "Calculus", name: "Triple integral", syntax: "∭ⱽ f(x,y,z) dV", description: "Integral over a three-dimensional region" },
  { group: "Calculus", name: "Contour integral", syntax: "∮꜀ f(z) dz", description: "Integral along a closed curve" },
  { group: "Calculus", name: "Derivative operator", syntax: "\\frac{d}{dx}[f(x)]", description: "Differentiate a function with respect to x" },
  { group: "Calculus", name: "First derivative", syntax: "\\frac{dy}{dx}", description: "Rate of change of y with respect to x" },
  { group: "Calculus", name: "Second derivative", syntax: "\\frac{d^2y}{dx^2}", description: "Derivative of the first derivative" },
  { group: "Calculus", name: "Partial derivative", syntax: "\\frac{\\partial f}{\\partial x}", description: "Differentiate a multivariable function with respect to x" },
  { group: "Calculus", name: "Second partial derivative", syntax: "\\frac{\\partial^2 f}{\\partial x^2}", description: "Second partial derivative with respect to x" },
  { group: "Calculus", name: "Mixed partial derivative", syntax: "\\frac{\\partial^2 f}{\\partial x \\partial y}", description: "Differentiate with respect to two variables" },
  { group: "Calculus", name: "Limit", syntax: "\\lim_{x \\to a} f(x)", description: "Value approached as x approaches a" },
  { group: "Vector calculus", name: "Gradient", syntax: "∇f", description: "Vector of partial derivatives" },
  { group: "Vector calculus", name: "Divergence", syntax: "∇ · F", description: "Scalar measure of a vector field's outward flow" },
  { group: "Vector calculus", name: "Curl", syntax: "∇ × F", description: "Rotation of a vector field" },
  { group: "Algebra", name: "Fraction", syntax: "\\frac{a}{b}", description: "A numerator stacked over a denominator" },
  { group: "Algebra", name: "Square root", syntax: "√(x)", description: "Principal square root" },
  { group: "Algebra", name: "Summation", syntax: "\\sum_{i=1}^{n} a_i", description: "Sum terms over an index" },
  { group: "Algebra", name: "Product", syntax: "\\prod_{i=1}^{n} a_i", description: "Multiply terms over an index" },
  { group: "Algebra", name: "Infinity", syntax: "∞", description: "An unbounded quantity" },
  { group: "Relations", name: "Approximately equal", syntax: "≈", description: "Values are approximately equal" },
  { group: "Relations", name: "Not equal", syntax: "≠", description: "Values are not equal" },
  { group: "Relations", name: "Less than or equal", syntax: "≤", description: "Less than or equal to" },
  { group: "Relations", name: "Greater than or equal", syntax: "≥", description: "Greater than or equal to" },
  { group: "Relations", name: "Proportional to", syntax: "∝", description: "One quantity varies proportionally with another" },
  { group: "Greek letters", name: "Alpha", syntax: "α", description: "Lowercase alpha" },
  { group: "Greek letters", name: "Beta", syntax: "β", description: "Lowercase beta" },
  { group: "Greek letters", name: "Gamma", syntax: "γ", description: "Lowercase gamma" },
  { group: "Greek letters", name: "Delta", syntax: "Δ", description: "Uppercase delta; often represents change" },
  { group: "Greek letters", name: "Theta", syntax: "θ", description: "Lowercase theta; often represents an angle" },
  { group: "Greek letters", name: "Lambda", syntax: "λ", description: "Lowercase lambda" },
  { group: "Greek letters", name: "Mu", syntax: "μ", description: "Lowercase mu" },
  { group: "Greek letters", name: "Pi", syntax: "π", description: "Lowercase pi" },
  { group: "Greek letters", name: "Sigma", syntax: "σ", description: "Lowercase sigma" },
];

function renderMathGlossary(query = "") {
  const normalized = String(query).trim().toLowerCase();
  const matches = MATH_GLOSSARY.filter((entry) => !normalized || `${entry.group} ${entry.name} ${entry.syntax} ${entry.description}`.toLowerCase().includes(normalized));
  const groupOrder = ["Algebra", "Relations", "Calculus", "Vector calculus", "Greek letters"];
  const groups = [...new Set(matches.map((entry) => entry.group))].sort((a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b));
  $("#math-glossary-list").innerHTML = matches.length ? groups.map((group) => `<div class="math-glossary-group">${escapeHtml(group)}</div>${matches.filter((entry) => entry.group === group).map((entry) => `<button type="button" class="math-glossary-entry" data-math-entry="${MATH_GLOSSARY.indexOf(entry)}"><strong>${mathDisplayHtml(entry.syntax)}</strong><span><b>${escapeHtml(entry.name)}</b><br>${escapeHtml(entry.description)}</span><small>Insert</small></button>`).join("")}`).join("") : '<div class="math-glossary-empty">No matching math notation.</div>';
  $$('[data-math-entry]', $("#math-glossary-list")).forEach((button) => button.addEventListener("click", () => {
    const entry = MATH_GLOSSARY[Number(button.dataset.mathEntry)];
    const input = $("#math-expression");
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.setRangeText(entry.syntax, start, end, "end");
    updateMathPreview();
    input.focus();
  }));
}

function readableMathSyntax(value) {
  const symbols = { "\\alpha":"α", "\\beta":"β", "\\gamma":"γ", "\\Delta":"Δ", "\\delta":"δ", "\\theta":"θ", "\\lambda":"λ", "\\mu":"μ", "\\pi":"π", "\\sigma":"σ", "\\Sigma":"Σ", "\\int":"∫", "\\iint":"∬", "\\iiint":"∭", "\\oint":"∮", "\\partial":"∂", "\\nabla":"∇", "\\infty":"∞", "\\prod":"Π", "\\times":"×", "\\div":"÷", "\\pm":"±", "\\ne":"≠", "\\approx":"≈", "\\propto":"∝", "\\le":"≤", "\\ge":"≥", "\\rightarrow":"→", "\\rightleftharpoons":"⇌" };
  let text = String(value || "").trim();
  Object.entries(symbols).forEach(([syntax, symbol]) => { text = text.split(syntax).join(symbol); });
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)").replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  const superscript = { 0:"⁰",1:"¹",2:"²",3:"³",4:"⁴",5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹","+":"⁺","-":"⁻" };
  const subscript = { 0:"₀",1:"₁",2:"₂",3:"₃",4:"₄",5:"₅",6:"₆",7:"₇",8:"₈",9:"₉","+":"₊","-":"₋" };
  text = text.replace(/\^\{?([0-9+-]+)\}?/g, (_, chars) => [...chars].map((char) => superscript[char] || char).join(""));
  text = text.replace(/_\{?([0-9+-]+)\}?/g, (_, chars) => [...chars].map((char) => subscript[char] || char).join(""));
  return text;
}

function mathDisplayHtml(value) {
  let html = escapeHtml(String(value || ""));
  html = html.replace(/\\(?:left|right)\b/g, "");
  html = html.replace(/\\text\{([^{}]*)\}/g, "$1");
  html = html.replace(/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, "C<sub>$1,$2</sub>");
  html = html.replace(/\\hat\s*\{?([A-Za-z])\}?/g, "$1̂").replace(/\\bar\s*\{?([A-Za-z])\}?/g, "$1̄");
  html = html.replace(/\\dot\s*\{?([A-Za-z])\}?/g, "$1̇");
  // Give relation signs their own spacing and baseline. A negative result also
  // receives a true mathematical minus so it cannot disappear into the equals.
  html = html.replace(/\s*=\s*(-)?/g, (_match, negative) => `<span class="math-relation" aria-label="equals">=</span>${negative ? '<span class="math-negative" aria-label="negative">−</span>' : ''}`);
  html = html.replace(/\\lim_\{([^{}]+)\}/g, '<span class="math-limit"><span>lim</span><small>$1</small></span>');
  html = html.replace(/\\(int|sum|prod)_\{([^{}]+)\}\^\{([^{}]+)\}/g, (_match, command, lower, upper) => `<span class="math-bounded"><sup>${upper}</sup><span>${({ int: "∫", sum: "Σ", prod: "Π" })[command]}</span><sub>${lower}</sub></span>`);
  html = html.replace(/\\(int|sum|prod)_([^\s^{}]+)\^\{([^{}]+)\}/g, (_match, command, lower, upper) => `<span class="math-bounded"><sup>${upper}</sup><span>${({ int: "∫", sum: "Σ", prod: "Π" })[command]}</span><sub>${lower}</sub></span>`);
  html = html.replace(/\\(int|sum|prod)_(\\[A-Za-z]+|[A-Za-z0-9]+)\^(\\[A-Za-z]+|[A-Za-z0-9]+)/g, (_match, command, lower, upper) => `<span class="math-bounded"><sup>${upper}</sup><span>${({ int: "∫", sum: "Σ", prod: "Π" })[command]}</span><sub>${lower}</sub></span>`);
  const replaceFractions = (text) => {
    let output = text;
    let searchFrom = 0;
    while (true) {
      const start = output.indexOf("\\frac{", searchFrom);
      if (start < 0) break;
      const readGroup = (openIndex) => {
        let depth = 0;
        for (let index = openIndex; index < output.length; index += 1) {
          if (output[index] === "{") depth += 1;
          if (output[index] === "}" && --depth === 0) return { content: output.slice(openIndex + 1, index), end: index };
        }
        return null;
      };
      const numerator = readGroup(start + 5);
      const denominator = numerator && output[numerator.end + 1] === "{" ? readGroup(numerator.end + 1) : null;
      if (!numerator || !denominator) { searchFrom = start + 5; continue; }
      const replacement = `<span class="math-fraction"><span>${replaceFractions(numerator.content)}</span><span>${replaceFractions(denominator.content)}</span></span>`;
      output = output.slice(0, start) + replacement + output.slice(denominator.end + 1);
      searchFrom = start + replacement.length;
    }
    return output;
  };
  html = replaceFractions(html);
  const commands = { "\\rightleftharpoons":"⇌", "\\rightarrow":"→", "\\Rightarrow":"⇒", "\\partial":"∂", "\\nabla":"∇", "\\infty":"∞", "\\varepsilon":"ε", "\\epsilon":"ε", "\\kappa":"κ", "\\tau":"τ", "\\phi":"φ", "\\chi":"χ", "\\Psi":"Ψ", "\\arcsin":"arcsin", "\\arccos":"arccos", "\\arctan":"arctan", "\\alpha":"α", "\\beta":"β", "\\gamma":"γ", "\\Delta":"Δ", "\\delta":"δ", "\\theta":"θ", "\\lambda":"λ", "\\sigma":"σ", "\\langle":"⟨", "\\rangle":"⟩", "\\times":"×", "\\approx":"≈", "\\propto":"∝", "\\quad":" ", "\\sin":"sin", "\\cos":"cos", "\\tan":"tan", "\\sec":"sec", "\\csc":"csc", "\\cot":"cot", "\\log":"log", "\\ln":"ln", "\\lim":"lim", "\\div":"÷", "\\pm":"±", "\\ne":"≠", "\\le":"≤", "\\ge":"≥", "\\mid":"|", "\\cap":"∩", "\\cup":"∪", "\\cdots":"…", "\\circ":"°", "\\mu":"μ", "\\rho":"ρ", "\\eta":"η", "\\pi":"π", "\\Sigma":"Σ", "\\to":"→", "\\,":" " };
  Object.entries(commands).sort(([left], [right]) => right.length - left.length).forEach(([syntax, symbol]) => { html = html.split(syntax).join(symbol); });
  html = html.replace(/\\(iint|iiint|oint|int|sum|prod)\b/g, (_match, command) => ({ int: "∫", iint: "∬", iiint: "∭", oint: "∮", sum: "Σ", prod: "Π" })[command]);
  html = html.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  html = html.replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>").replace(/\^([+-]?\d+|[A-Za-z])/g, "<sup>$1</sup>");
  html = html.replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>").replace(/_([+-]?\d+|[A-Za-z])/g, "<sub>$1</sub>");
  return html.replace(/\n/g, "<br>");
}

function textbookEquationHtml(value) {
  let equation = String(value || "");
  equation = equation.replace(/\(([^()]+?)\s+\/\s+([^()]+?)\)/g, "\\frac{$1}{$2}");
  equation = equation.replace(/([A-Za-z0-9ΔχΠλνμρ]+)\/\(([^()]+)\)/g, "\\frac{$1}{$2}");
  equation = equation.replace(/([A-Za-z0-9ΔχΠλνμρ\[\]₀-₉⁺⁻°]+)\s*\/\s*([A-Za-z0-9ΔχΠλνμρ\[\]₀-₉⁺⁻°]+)/g, "\\frac{$1}{$2}");
  return mathDisplayHtml(equation);
}

function updateMathPreview() {
  const value = $("#math-expression").value.trim();
  $("#math-preview").innerHTML = value ? mathDisplayHtml(value) : "Your expression will appear here.";
}
function editableMathRange(textarea) {
  const value = textarea?.value || "";
  const selectionStart = textarea?.selectionStart ?? value.length;
  const selectionEnd = textarea?.selectionEnd ?? selectionStart;
  if (selectionEnd > selectionStart) return { start: selectionStart, end: selectionEnd, value: value.slice(selectionStart, selectionEnd), editing: true };
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf("\n", selectionStart);
  const lineEnd = nextBreak < 0 ? value.length : nextBreak;
  const line = value.slice(lineStart, lineEnd);
  const looksLikeMath = /\\(?:frac|sqrt|lim|int|iint|iiint|oint|sum|prod|partial|nabla|alpha|beta|gamma|Delta|theta|lambda|mu|pi|sigma|infty)\b|[∫∬∭∮ΣΠ√∂∇∞]/.test(line);
  if (!looksLikeMath) return { start: selectionStart, end: selectionEnd, value: "", editing: false };
  const leading = line.match(/^\s*/)?.[0].length || 0;
  const trailing = line.match(/\s*$/)?.[0].length || 0;
  return { start: lineStart + leading, end: lineEnd - trailing, value: line.trim(), editing: true };
}
function openMathTool(target) {
  const textarea = cardTextArea(target);
  const range = editableMathRange(textarea);
  state.pendingMathTarget = { ...target, ...range };
  $("#math-expression").value = range.value;
  $("#math-glossary-search").value = "";
  renderMathGlossary();
  $("#math-dialog-title").textContent = `${range.editing ? "Edit" : "Insert"} math on the ${target.side}`;
  updateMathPreview();
  $("#math-dialog").showModal();
  $("#math-expression").focus();
}
function closeMathTool() { $("#math-dialog").close(); state.pendingMathTarget = null; }
function insertMathIntoCard() {
  const target = state.pendingMathTarget; const expression = $("#math-expression").value.trim();
  if (!target || !expression) { showToast("Enter a math expression first."); return; }
  const textarea = cardTextArea(target); if (!textarea) return;
  const before = textarea.value.slice(0, target.start); const after = textarea.value.slice(target.end);
  const spacing = target.editing ? expression : `${before && !/\s$/.test(before) ? " " : ""}${expression}${after && !/^\s/.test(after) ? " " : ""}`;
  textarea.value = `${before}${spacing}${after}`;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  closeMathTool(); textarea.focus(); showToast(target.editing ? "Math updated." : "Math inserted into the card.");
}

const CODE_KEYWORDS = {
  python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
  javascript: "async await break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof undefined var void while yield",
  typescript: "abstract any as async await boolean break case catch class const constructor continue declare default delete do else enum export extends false finally for from function get if implements import in infer instanceof interface keyof let namespace never new null number object of private protected public readonly return set static string super switch symbol this throw true try type typeof undefined unknown var void while yield",
  java: "abstract assert boolean break byte case catch char class const continue default do double else enum extends false final finally float for goto if implements import instanceof int interface long native new null package private protected public return short static strictfp super switch synchronized this throw throws transient true try void volatile while",
  c: "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while",
  cpp: "alignas alignof and asm auto bitand bool break case catch char class compl concept const constexpr continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend if inline int long mutable namespace new noexcept not nullptr operator or private protected public register reinterpret_cast requires return short signed sizeof static static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor",
  csharp: "abstract as async await base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while",
  swift: "associatedtype break case catch class continue default defer deinit do else enum extension fallthrough false fileprivate for func guard if import in init inout internal is let nil open operator override private protocol public repeat rethrows return self static struct subscript super switch throw throws true try typealias var where while",
  sql: "add all alter and any as asc backup between by case check column constraint create database default delete desc distinct drop exec exists foreign from full group having in index inner insert into is join key left like limit not null on or order outer primary procedure right rownum select set table top truncate union unique update values view where",
  r: "break else FALSE for function if in Inf NA NaN next NULL repeat return TRUE while",
  bash: "case do done elif else esac export fi for function if in local readonly return then until while",
};

function highlightCodeLine(line, language = "") {
  const aliases = { js: "javascript", jsx: "javascript", ts: "typescript", py: "python", rb: "ruby", sh: "bash", shell: "bash", "c++": "cpp", cs: "csharp", "c#": "csharp" };
  const normalized = aliases[String(language || "").toLowerCase()] || String(language || "").toLowerCase();
  const keywords = new Set(String(CODE_KEYWORDS[normalized] || "").split(" ").filter(Boolean));
  const tokens = /(\/\/.*$|#.*$|--.*$)|(\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)/g;
  let result = ""; let cursor = 0;
  for (const match of line.matchAll(tokens)) {
    result += escapeHtml(line.slice(cursor, match.index));
    const value = escapeHtml(match[0]);
    if (match[1]) result += `<span class="code-token-comment">${value}</span>`;
    else if (match[2]) result += `<span class="code-token-string">${value}</span>`;
    else if (match[3]) result += `<span class="code-token-number">${value}</span>`;
    else if (keywords.has(match[4])) result += `<span class="code-token-keyword">${value}</span>`;
    else result += value;
    cursor = match.index + match[0].length;
  }
  return result + escapeHtml(line.slice(cursor));
}

function codeBlockHtml(code, language = "", numbered = true) {
  const lines = String(code || "").replace(/\r\n?/g, "\n").split("\n");
  const label = language ? `<span class="study-code-language">${escapeHtml(language)}</span>` : "";
  return `<span class="study-code-block ${numbered ? "with-line-numbers" : ""}">${label}<code>${lines.map((line, index) => `<span class="study-code-line">${numbered ? `<i>${index + 1}</i>` : ""}<b>${highlightCodeLine(line, language) || "&nbsp;"}</b></span>`).join("")}</code></span>`;
}

function studyTextHtml(value) {
  const text = String(value || "");
  let cursor = 0;
  let html = "";
  const pattern = /```([^\n]*)\n([\s\S]*?)```/g;
  for (const match of text.matchAll(pattern)) {
    html += mathDisplayHtml(text.slice(cursor, match.index));
    const metadata = String(match[1] || "").trim().split(":");
    html += codeBlockHtml(match[2].replace(/\n$/, ""), metadata[0], metadata[1] !== "plain");
    cursor = match.index + match[0].length;
  }
  return html + mathDisplayHtml(text.slice(cursor));
}

function updateCodePreview() {
  const code = $("#code-expression").value;
  $("#code-preview-content").innerHTML = code ? codeBlockHtml(code, $("#code-language").value, $("#code-line-numbers").checked) : '<span class="code-preview-empty">Your code will appear here.</span>';
}

function openCodeTool(target) {
  const textarea = cardTextArea(target);
  const value = textarea?.value || "";
  const caret = textarea?.selectionStart ?? value.length;
  const blocks = [...value.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)];
  const block = blocks.find((match) => caret >= match.index && caret <= match.index + match[0].length);
  const selectionStart = textarea?.selectionStart ?? value.length;
  const selectionEnd = textarea?.selectionEnd ?? selectionStart;
  const selectedCode = selectionEnd > selectionStart ? value.slice(selectionStart, selectionEnd) : "";
  const metadata = block ? String(block[1] || "").trim().split(":") : [];
  const editing = Boolean(block || selectedCode);
  state.pendingCodeTarget = { ...target, start: block?.index ?? selectionStart, end: block ? block.index + block[0].length : selectionEnd, editing };
  $("#code-expression").value = block ? block[2].replace(/\n$/, "") : selectedCode;
  $("#code-language").value = metadata[0] || "";
  $("#code-line-numbers").checked = !block || metadata[1] !== "plain";
  $("#code-dialog-title").textContent = `${editing ? "Edit" : "Insert"} code on the ${target.side}`;
  updateCodePreview();
  $("#code-dialog").showModal();
  $("#code-expression").focus();
}

function closeCodeTool() { $("#code-dialog").close(); state.pendingCodeTarget = null; }

function insertCodeIntoCard() {
  const target = state.pendingCodeTarget;
  const code = $("#code-expression").value.replace(/\r\n?/g, "\n").trimEnd();
  if (!target || !code.trim()) { showToast("Enter at least one line of code first."); return; }
  const textarea = cardTextArea(target);
  if (!textarea) return;
  const language = $("#code-language").value;
  const metadata = `${language}${$("#code-line-numbers").checked ? ":lines" : ":plain"}`;
  const snippet = `\`\`\`${metadata}\n${code}\n\`\`\``;
  const before = textarea.value.slice(0, target.start);
  const after = textarea.value.slice(target.end);
  textarea.value = target.editing
    ? `${before}${snippet}${after}`
    : `${before}${before && !before.endsWith("\n") ? "\n" : ""}${snippet}${after && !after.startsWith("\n") ? "\n" : ""}${after}`;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  closeCodeTool();
  textarea.focus();
  showToast(target.editing ? "Code updated." : "Code added to the card.");
}

function cleanNoteLine(line) {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
    .replace(/\*{1,3}|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lessonHeadingInfo(line) {
  const cleaned = cleanNoteLine(line).replace(/[–—]/g, "-").trim();
  if (!cleaned || cleaned.length > 100) return null;
  let match = cleaned.match(/^(?:lesson|lecture)\s*(\d+)\s*(?:[-:.]\s*)?(.*)$/i);
  if (match) return { number: match[1], topic: (match[2] || "").replace(/^[-:.]\s*/, "").trim() };
  match = cleaned.match(/^(.+?)\s*(?:[-:]\s*)?(?:lesson|lecture)\s*(\d+)$/i);
  if (match) return { number: match[2], topic: match[1].replace(/^[-:.]\s*|\s*[-:.]$/g, "").trim() };
  return null;
}

function notesEditor() { return $("#notes-input"); }

function notesPlainText() {
  const editor = notesEditor();
  const lines = [];
  const inlineText = (node) => node.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const visit = (node, depth = 0) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.replace(/\u00a0/g, " ").replace(/\r/g, "").split("\n").forEach((part) => {
        const text = part.trim();
        if (text) lines.push(text);
      });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") { lines.push(""); return; }
    if (["UL", "OL"].includes(node.tagName)) {
      [...node.children].forEach((child) => visit(child, depth));
      return;
    }
    if (node.tagName === "LI") {
      const nestedLists = [...node.children].filter((child) => ["UL", "OL"].includes(child.tagName));
      const clone = node.cloneNode(true);
      clone.querySelectorAll("ul,ol").forEach((list) => list.remove());
      const text = inlineText(clone);
      if (text) lines.push(`${"  ".repeat(depth)}- ${text}`);
      nestedLists.forEach((list) => [...list.children].forEach((child) => visit(child, depth + 1)));
      return;
    }
    if (/^H[1-6]$/.test(node.tagName)) {
      const text = inlineText(node);
      if (text) lines.push(`## ${text}`);
      return;
    }
    if (["DIV", "P"].includes(node.tagName)) {
      const lists = [...node.children].filter((child) => ["UL", "OL"].includes(child.tagName));
      const onlyChild = node.children.length === 1 ? node.firstElementChild : null;
      const boldLine = onlyChild && (["B", "STRONG"].includes(onlyChild.tagName) || /bold|[6-9]00/.test(onlyChild.style.fontWeight || ""));
      if (!lists.length) {
        const segments = [];
        let segment = { text: "", bold: false };
        const flush = () => {
          segment.text.replace(/\u00a0/g, " ").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean).forEach((text) => segments.push({ text, bold: segment.bold }));
          segment = { text: "", bold: false };
        };
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR") { flush(); return; }
          segment.text += child.textContent || "";
          if (child.nodeType === Node.ELEMENT_NODE && (["B", "STRONG"].includes(child.tagName) || /bold|[6-9]00/.test(child.style.fontWeight || ""))) segment.bold = true;
        });
        flush();
        let insideBoldTerm = false;
        segments.forEach(({ text, bold }) => {
          if (/^\d+(?:\.\d+)+\.?\s+/.test(text)) { lines.push(text); insideBoldTerm = false; return; }
          if (bold) { lines.push(`- ${text.replace(/^[-*•]\s*/, "")}`); insideBoldTerm = true; return; }
          if (insideBoldTerm && /^[-*•]\s*/.test(text)) lines.push(`  - ${text.replace(/^[-*•]\s*/, "")}`);
          else lines.push(text);
        });
        return;
      }
      const clone = node.cloneNode(true);
      clone.querySelectorAll("ul,ol").forEach((list) => list.remove());
      const text = inlineText(clone);
      if (text) lines.push(boldLine ? `**${text}**` : text);
      lists.forEach((list) => visit(list, depth));
      return;
    }
    [...node.childNodes].forEach((child) => visit(child, depth));
  };
  [...editor.childNodes].forEach((child) => visit(child));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function notesRichHtml() {
  return notesEditor().innerHTML.trim();
}

function setNotesContent(text = "", html = "") {
  const editor = notesEditor();
  if (html) editor.innerHTML = sanitizeNotesHtml(html);
  else editor.textContent = text;
}

function clearNotesAfterUpdate() {
  setNotesContent();
  state.notesHiddenAfterUpdate = true;
}

function sanitizeNotesHtml(rawHtml) {
  const documentFragment = new DOMParser().parseFromString(`<div>${rawHtml}</div>`, "text/html").body.firstElementChild;
  const allowed = new Set(["P", "DIV", "BR", "UL", "OL", "LI", "B", "STRONG", "I", "EM", "U", "MARK", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN"]);
  const cleanNode = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      cleanNode(child);
      if (!allowed.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      const style = child.style;
      const safeStyles = [];
      if (style.backgroundColor) safeStyles.push(`background-color: ${style.backgroundColor}`);
      if (style.fontWeight && (/bold/i.test(style.fontWeight) || Number(style.fontWeight) >= 600)) safeStyles.push(`font-weight: ${style.fontWeight}`);
      if (style.fontStyle === "italic") safeStyles.push("font-style: italic");
      if (style.textDecorationLine === "underline" || /underline/.test(style.textDecoration || "")) safeStyles.push("text-decoration: underline");
      [...child.attributes].forEach((attribute) => child.removeAttribute(attribute.name));
      if (safeStyles.length) child.setAttribute("style", safeStyles.join("; "));
    });
  };
  cleanNode(documentFragment);
  return documentFragment.innerHTML;
}

function ankiSeparator(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ({ tab: "\t", comma: ",", semicolon: ";", space: " ", pipe: "|", colon: ":" })[normalized] || (normalized === "\\t" ? "\t" : value);
}

function countUnquotedSeparators(line, separator) {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && line[index] === separator) count += 1;
  }
  return count;
}

function detectAnkiSeparator(lines, extension) {
  if (extension === "tsv") return "\t";
  const candidates = ["\t", ";", ",", "|"];
  const sample = lines.slice(0, 6);
  return candidates
    .map((separator) => ({ separator, score: sample.reduce((total, line) => total + countUnquotedSeparators(line, separator), 0) }))
    .sort((left, right) => right.score - left.score)[0]?.score > 0
    ? candidates.map((separator) => ({ separator, score: sample.reduce((total, line) => total + countUnquotedSeparators(line, separator), 0) })).sort((left, right) => right.score - left.score)[0].separator
    : extension === "csv" ? "," : "\t";
}

function parseSeparatedRecords(text, separator) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (!quoted && character === separator) {
      record.push(field);
      field = "";
    } else if (!quoted && character === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (field || record.length) { record.push(field); records.push(record); }
  return records;
}

function ankiFieldToText(value) {
  const decoder = document.createElement("textarea");
  decoder.innerHTML = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\[sound:[^\]]+\]/gi, "")
    .replace(/<[^>]*>/g, "");
  return decoder.value.replace(/\u00a0/g, " ").trim();
}

function clozeCardFromField(value) {
  const answers = [];
  const front = value.replace(/\{\{c\d+::([\s\S]*?)(?:::([\s\S]*?))?\}\}/gi, (_, answer, hint) => {
    answers.push(answer);
    return hint ? `[${hint}]` : "[…]";
  });
  if (!answers.length) return null;
  return { front: ankiFieldToText(front), back: ankiFieldToText(answers.join("; ")) };
}

function parseAnkiNotes(fileName, sourceText) {
  const normalized = sourceText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const allLines = normalized.split("\n");
  const headers = {};
  let dataStart = 0;
  while (dataStart < allLines.length) {
    const line = allLines[dataStart];
    if (!line.trim()) { dataStart += 1; continue; }
    if (!line.startsWith("#")) break;
    const header = line.match(/^#([^:]+):\s*(.*)$/);
    if (header) headers[header[1].trim().toLowerCase()] = header[2].trim();
    dataStart += 1;
  }
  const dataLines = allLines.slice(dataStart);
  const extension = fileName.split(".").pop().toLowerCase();
  const separator = headers.separator ? ankiSeparator(headers.separator) : detectAnkiSeparator(dataLines.filter((line) => line.trim() && !line.startsWith("#")), extension);
  const records = parseSeparatedRecords(dataLines.join("\n"), separator).filter((record) => record.some((field) => field.trim()) && !record[0].trim().startsWith("#"));
  const columns = headers.columns ? parseSeparatedRecords(headers.columns, separator)[0].map((column) => column.trim().toLowerCase()) : [];
  let frontIndex = Math.max(0, columns.findIndex((column) => /^(front|question|prompt)$/.test(column)));
  let backIndex = columns.findIndex((column) => /^(back|answer|response)$/.test(column));
  if (backIndex < 0) backIndex = frontIndex === 0 ? 1 : 0;
  if (records.length && /^(front|question|prompt)$/i.test(records[0][frontIndex]?.trim() || "") && /^(back|answer|response)$/i.test(records[0][backIndex]?.trim() || "")) records.shift();
  const cardsByFront = new Map();
  records.forEach((record) => {
    const rawFront = record[frontIndex] || "";
    const rawBack = record[backIndex] || "";
    const cloze = !rawBack.trim() ? clozeCardFromField(rawFront) : null;
    const front = cloze?.front || ankiFieldToText(rawFront);
    const back = cloze?.back || ankiFieldToText(rawBack);
    if (!front || !back) return;
    const key = front.toLocaleLowerCase();
    const existing = cardsByFront.get(key);
    cardsByFront.set(key, { id: existing?.id || makeLocalId("card"), noteId: `anki-note-${note.id}`, front, back, imported: true, importedSchedule: note.schedule || null, importedReviews: note.reviews || [] });
  });
  return { cards: [...cardsByFront.values()], separator, headers };
}

function cardsFromAnkiPackageNotes(notes) {
  const cardsByFront = new Map();
  let skipped = 0;
  (notes || []).forEach((note) => {
    const rawFields = Array.isArray(note.fields) ? note.fields : [];
    const cloze = rawFields.map(clozeCardFromField).find(Boolean);
    const textFields = rawFields.map(ankiFieldToText).filter(Boolean);
    const front = cloze?.front || textFields[0] || "";
    const back = cloze?.back || textFields[1] || "";
    if (!front || !back || front.toLocaleLowerCase() === back.toLocaleLowerCase()) { skipped += 1; return; }
    const key = front.toLocaleLowerCase();
    const existing = cardsByFront.get(key);
    cardsByFront.set(key, { id: existing?.id || makeLocalId("card"), front, back, imported: true });
  });
  return { cards: [...cardsByFront.values()], skipped };
}

const NOTES_GENERATOR_VERSION = 17;

function generateCardsFromNotes(notes) {
  const cards = [];
  const seen = new Set();
  const collapseRepeatedExtraction = (value) => {
    let text = String(value || "")
      .replace(/[\uF000-\uF8FF]/g, "")
      .replace(/(?:style\.(?:visibility|fontWeight|textDecorationUnderline)|ppt_[xy]|rrrr)+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    text = text.replace(/(.{8,70})\1/gi, "$1").replace(/([“”'\"])([^“”'\"]{2,40})\1\2\1/g, "$1$2$1");
    for (let pass = 0; pass < 2; pass += 1) {
      const midpoint = Math.floor(text.length / 2);
      if (text.length >= 8 && text.length % 2 === 0 && text.slice(0, midpoint).toLowerCase() === text.slice(midpoint).toLowerCase()) text = text.slice(0, midpoint).trim();
    }
    return text.replace(/^([•▪◦◆◇❖]+)\s*/, "").trim();
  };
  const sourceLines = String(notes || "").replace(/\r/g, "").split("\n").map(collapseRepeatedExtraction);
  const isStructuralLine = (line) => !line || /^\s*(?:#{1,6}\s+|[-*•]\s+|\d+[.)]\s+)/.test(line) || lessonHeadingInfo(line);
  const reflowedLines = [];
  sourceLines.forEach((line) => {
    if (!line) { reflowedLines.push(""); return; }
    const previousIndex = reflowedLines.length - 1;
    const previous = reflowedLines[previousIndex] || "";
    const shouldJoin = previous && !isStructuralLine(line)
      && !/[.!?:;]$/.test(previous) && /^[a-z(\[]/.test(line)
      && previous.length < 140;
    if (shouldJoin) reflowedLines[previousIndex] = `${previous} ${line}`;
    else reflowedLines.push(line);
  });
  const normalizedNotes = reflowedLines.join("\n");
  const functionalGroupNotes = /organic chemistry\s*[—–-]\s*functional groups|functional groups study notes/i.test(normalizedNotes);
  const molecularGeneticsNotes = /genetics:\s*dna replication, transcription\s*&\s*translation|biology notes\s*[—–-]\s*molecular genetics/i.test(normalizedNotes);
  const ecologyNotes = /ecology\s*[—–-]\s*population dynamics\s*&\s*ecosystems|biology\s*\|\s*unit:\s*ecology|population ecology/i.test(normalizedNotes);
  const calculusNotes = /\b(?:the limit of a function|one-sided limits?|limit laws?|differentiation|definite integral|derivative as a function)\b/i.test(normalizedNotes);
  const psychologyLearningNotes = /\bclassical conditioning\b[\s\S]{0,2500}\boperant conditioning\b[\s\S]{0,2500}\bobservational learning\b/i.test(normalizedNotes);
  const hypothesisTestingNotes = /probability distribution needed for hypothesis testing|hypothesis test for the mean[\s\S]{0,1200}hypothesis test for proportions/i.test(normalizedNotes);
  const electrochemistryNotes = /nernst equation|faradaic reactions? in equilibrium|electrochemical potential/i.test(normalizedNotes);
  const instructionalLessonPlan = /\b5E Lesson\b[\s\S]{0,1500}\bTeacher's Note\b|\bAt a glance\b[\s\S]{0,1200}\bMaterials\b[\s\S]{0,1200}\bThe 5E lesson\b/i.test(normalizedNotes);
  const historyNotes = /french revolution\s*\(1789\s*[–—-]\s*1799\)|causes and early stages of the revolution/i.test(normalizedNotes);
  const inferredDomain = /\b(?:cell|gene|dna|rna|protein|organism|species|ecosystem|chemical|reaction|molecule|energy|force|velocity|disease|anatomy|physiology|population|functional group)\b/i.test(normalizedNotes) ? "science"
    : /\b(?:function|equation|derivative|integral|probability|theorem|proof|graph|matrix|angle|limit)\b/i.test(normalizedNotes) ? "math"
      : /\b(?:novel|poem|character|theme|author|narrator|symbol|literature)\b/i.test(normalizedNotes) ? "literature"
        : /\b(?:market|business|finance|revenue|cost|economy|supply|demand)\b/i.test(normalizedNotes) ? "business"
          : /\b(?:revolution|war|government|empire|king|president|century|political|historical)\b/i.test(normalizedNotes) ? "history" : "general";
  const addCard = (front, back, metadata = {}) => {
    if (molecularGeneticsNotes && !metadata.sourceKind) metadata.sourceKind = "molecular-genetics";
    if (ecologyNotes && !metadata.sourceKind) metadata.sourceKind = "ecology";
    if (calculusNotes && !metadata.sourceKind) metadata.sourceKind = "calculus";
    if (psychologyLearningNotes && !metadata.sourceKind) metadata.sourceKind = "psychology-learning";
    if (hypothesisTestingNotes && !metadata.sourceKind) metadata.sourceKind = "hypothesis-testing";
    if (electrochemistryNotes && !metadata.sourceKind) metadata.sourceKind = "electrochemistry";
    if (historyNotes && !metadata.sourceKind) metadata.sourceKind = "history";
    if (!metadata.sourceKind && inferredDomain !== "general") metadata.sourceKind = inferredDomain;
    let cleanFront = collapseRepeatedExtraction(front).replace(/^(?:the\s+)?(?:use|introduction)\s+of\s+/i, "").replace(/\s+/g, " ").trim();
    cleanFront = cleanFront.replace(/:+$/, "").trim();
    let cleanBack = collapseRepeatedExtraction(back).replace(/\s+/g, " ").trim()
      .replace(/\\\[\s*;\s*/g, "\\(")
      .replace(/;\s*\\\]/g, "\\)");
    if (molecularGeneticsNotes && /^(?:remember|important|example|purpose)$/i.test(cleanFront)) return;
    if (molecularGeneticsNotes && /^(?:common mistakes|generally|helps|both|proteins that|RNA synthesis does not|RNA polymerase does not|transcription|translation)$/i.test(cleanFront)) return;
    if (molecularGeneticsNotes && /^key distinction$/i.test(cleanFront)) cleanFront = "DNA vs. RNA";
    if (molecularGeneticsNotes && /^DNA polymerases$/i.test(cleanFront)) cleanFront = "DNA polymerase";
    if (molecularGeneticsNotes && /^Telomerase can$/i.test(cleanFront)) cleanFront = "Telomerase";
    if (molecularGeneticsNotes && /^DNA → RNA → Protein$/i.test(cleanFront)) cleanFront = "Central dogma of molecular biology";
    if (molecularGeneticsNotes && /^Double-stranded helix, strands run antiparallel$/i.test(cleanFront)) cleanFront = "DNA strand directionality";
    if (molecularGeneticsNotes && /^Bases$/i.test(cleanFront)) cleanFront = "DNA bases";
    if (molecularGeneticsNotes && /^Base pairing$/i.test(cleanFront)) cleanFront = "DNA base pairing";
    if (molecularGeneticsNotes && /^RNA nucleotides pair with the DNA template$/i.test(cleanFront)) cleanFront = "Transcription base-pairing rules";
    if (molecularGeneticsNotes && /^The ribosome has three major tRNA-binding sites$/i.test(cleanFront)) cleanFront = "Ribosomal A, P, and E sites";
    if (molecularGeneticsNotes && /^Larger DNA alterations may involve$/i.test(cleanFront)) cleanFront = "Chromosomal mutations";
    if (molecularGeneticsNotes && /^Without lactose$/i.test(cleanFront)) cleanFront = "Lac operon without lactose";
    if (molecularGeneticsNotes && /^With lactose$/i.test(cleanFront)) cleanFront = "Lac operon with lactose";
    if (molecularGeneticsNotes && /^Gene regulation$/i.test(cleanFront)) return;
    if (calculusNotes && /^(?:limits$|we then|and say|[a-z]\)|from the graph)/i.test(cleanFront)) return;
    if (psychologyLearningNotes && /^learned behaviors involve change and experience$/i.test(cleanFront)) return;
    if (instructionalLessonPlan) return;
    if (electrochemistryNotes && (/^(?:lecture|example|comment on notation|solution|sizi|_?s kT|\d+\s|[−+_=()\d\s]+)$/i.test(cleanFront) || !/[A-Za-z]{3}/.test(cleanFront))) return;
    if (ecologyNotes && /^(?:clumps?|originally markedN)$/i.test(cleanFront)) return;
    if (ecologyNotes && /^Examples?$/i.test(cleanFront)) {
      if (/\bkJ\b/i.test(cleanBack)) cleanFront = "10% rule example";
      else if (/hurricanes?|droughts?|floods?/i.test(cleanBack)) cleanFront = "Density-independent examples";
      else if (/competition|disease|parasitism|predation/i.test(cleanBack)) cleanFront = "Density-dependent examples";
    }
    if (ecologyNotes && /^Important distinction$/i.test(cleanFront)) cleanFront = "Density dependence: drought vs. disease";
    if (ecologyNotes && /^Main connection$/i.test(cleanFront)) cleanFront = "Connections among ecological processes";
    if (molecularGeneticsNotes && metadata.sourceSection && /^(?:initiation|elongation|termination|completion)$/i.test(cleanFront)) {
      const process = metadata.sourceSection.replace(/\s+[—–-]\s+.+$/, "").trim();
      cleanFront = `${process}: ${cleanFront}`;
    }
    if (metadata.sourceSection && /^(?:significance|consequences|limitation):?$/i.test(cleanFront)) {
      cleanFront = `${cleanFront.replace(/:$/, "")} of ${metadata.sourceSection}`;
    }
    const extractionNoise = /^(?:question|answer|step\s*\d+|fall\s+\d{4}|the next three lectures|learning objectives?|by the end of this section, you will be able to|chapter\s+\d+|\d{1,3}|\d[.\d]*[A-Z]?\s*\/\s*\d[.\dA-Z]*.+)$/i;
    if (extractionNoise.test(cleanFront) || /(?:https?:\/\/|terms of use|open.?courseware|style\.visibility)/i.test(`${cleanFront} ${cleanBack}`)) return;
    if (/\b(?:and|or|of|to|when|because|including|include|includes|is|are|was|were)\s*$/i.test(cleanFront) || /^(?:and|or|but|because|which|that)\b/i.test(cleanBack)) return;
    if ((cleanFront.match(/[A-Za-z]+/g) || []).length > 18 && !/[?]$/.test(cleanFront)) return;
    if (cleanFront.length < (molecularGeneticsNotes ? 3 : 4) || cleanBack.length < 3 || cleanBack.length > 900 || cleanFront.toLowerCase() === cleanBack.toLowerCase()) return;
    const key = cleanFront.toLowerCase().replace(/^the\s+/, "").replace(/\s*\(\d{4}\)$/, "").trim();
    if (seen.has(key)) {
      const existing = cards.find((card) => card.front.toLowerCase().replace(/^the\s+/, "").replace(/\s*\(\d{4}\)$/, "").trim() === key);
      if (existing && molecularGeneticsNotes && !existing.back.toLowerCase().includes(cleanBack.toLowerCase())) existing.back = `${existing.back}; ${cleanBack}`;
      else if (existing && cleanBack.length > existing.back.length) existing.back = cleanBack;
      if (existing && metadata.sourceSection && !existing.sourceSection) existing.sourceSection = metadata.sourceSection;
      return;
    }
    if (cards.length >= 300) return;
    seen.add(key);
    cards.push({ id: makeLocalId("card"), front: cleanFront, back: cleanBack, ...metadata });
  };
  const embeddedSubject = (value) => value.replace(/^(A|An|The)\b/, (article) => article.toLowerCase());
  const questionVerb = (value) => value.toLowerCase().replace(/s$/i, "");
  const relationshipSubject = (value) => embeddedSubject(value).replace(/\s+(?:slows?|changes?|increases?|decreases?|varies?).*\s+and$/i, "").replace(/\s+and$/i, "");

  const rawLines = normalizedNotes.split("\n").filter((line) => {
    if (lessonHeadingInfo(line)) return false;
    const cleaned = cleanNoteLine(line);
    return !/^Page\s+\d+\s*:/i.test(cleaned)
      && !/^\d{1,3}$/.test(cleaned)
      && !/^(?:style\.|ppt_[xy]|rrrr)/i.test(cleaned)
      && !/^(?:MIT OpenCourseWare|For information about citing|Fall\s+\d{4})/i.test(cleaned);
  });

  // Tables are common in textbook summaries and lecture slides. Preserve the
  // row relationship instead of flattening each cell into unrelated text.
  const tableCellLines = rawLines.map((line, index) => ({ index, cells: line.split(/\s*\|\s*|\t+/).map(cleanNoteLine).filter(Boolean) })).filter((row) => row.cells.length >= 2);
  for (let position = 0; position < tableCellLines.length;) {
    const group = [tableCellLines[position]];
    let cursor = position + 1;
    while (cursor < tableCellLines.length && tableCellLines[cursor].index === group[group.length - 1].index + 1) group.push(tableCellLines[cursor++]);
    position = cursor;
    if (group.length < 2) continue;
    const separatorIndex = group.findIndex((row) => row.cells.every((cell) => /^:?-{2,}:?$/.test(cell)));
    const headerRow = group[0].cells;
    const dataRows = group.slice(separatorIndex === 1 ? 2 : 1);
    const usefulHeaders = headerRow.every((cell) => cell.length <= 45 && !/[.!?]$/.test(cell));
    if (!usefulHeaders || !dataRows.length) continue;
    dataRows.forEach(({ cells }) => {
      if (cells.length < 2 || cells[0].length > 90 || /^\d+$/.test(cells[0])) return;
      const details = cells.slice(1).map((cell, index) => `${headerRow[index + 1] || `Field ${index + 2}`}: ${cell}`).join("; ");
      addCard(cells[0], details, { sourceSection: headerRow[0], sourceKind: inferredDomain === "general" ? undefined : inferredDomain, sourceFormat: "table" });
    });
  }

  if (ecologyNotes && /mark and recapture/i.test(normalizedNotes)) {
    addCard("Mark-recapture method", "Capture and mark M individuals, release them, then capture a second sample of S individuals and count the R marked individuals recaptured. Estimate population size with N = (S × M) / R.", { sourceSection: "Measuring population size", sourceKind: "ecology" });
  }
  if (ecologyNotes && /quadrats?/i.test(normalizedNotes)) {
    addCard("Quadrat sampling", "Estimate population size or density by counting organisms within sampled plots. Larger or more numerous quadrats are needed when organisms have a clumped distribution.", { sourceSection: "Measuring population size", sourceKind: "ecology" });
  }
  if (calculusNotes) {
    addCard("Limit of a function", "The limit of f(x) as x approaches a is L when the values of f(x) get arbitrarily close to L as x approaches a from both sides.", { sourceSection: "Limits", sourceKind: "calculus" });
    if (/does not matter how the function behaves at/i.test(normalizedNotes)) addCard("Limit versus function value", "A limit depends on the values of the function near a point, not necessarily on the function's value at that point.", { sourceSection: "Limits", sourceKind: "calculus" });
    if (/two-sided vs\.? one-sided limits?/i.test(normalizedNotes)) addCard("Existence of a two-sided limit", "A two-sided limit exists only when the left-hand and right-hand limits both exist and are equal.", { sourceSection: "One-sided limits", sourceKind: "calculus" });
  }
  if (psychologyLearningNotes) {
    const conceptCards = [
      ["Learning", /learning is a\s+(relatively permanent change in behavior or knowledge that results from\s+experience)/i],
      ["Reflex", /Reflexes are\s+(a motor or neural reaction to a specific stimulus in the environment)/i],
      ["Instinct", /instincts are\s+(innate behaviors that are triggered by a broader range of events[^.]*\.)/i],
      ["Associative learning", /Associative learning occurs when\s+(an organism makes connections between stimuli or events that occur together in the environment)/i],
      ["Classical conditioning", /In classical conditioning[\s\S]{0,90}?organisms learn to associate\s+(events[^.]*\.)/i],
      ["Operant conditioning", /In operant conditioning,\s+(organisms learn[^.]*consequence[^.]*\.)/i],
      ["Observational learning", /observational learning is\s+(the process of watching others and then imitating what they\s+do)/i],
    ];
    conceptCards.forEach(([front, pattern]) => {
      const match = normalizedNotes.match(pattern);
      if (match) addCard(front, match[1].replace(/\s+/g, " ").replace(/[.]?$/, "."), { sourceSection: "Learning", sourceKind: "psychology-learning" });
    });
  }
  if (hypothesisTestingNotes) {
    const metadata = { sourceSection: "Choosing a hypothesis test", sourceKind: "hypothesis-testing" };
    addCard("One-sample z-test for a mean", "Use a normal distribution when testing a population mean and the population standard deviation σ is known. Use a simple random sample; the population should be normal or the sample sufficiently large.", metadata);
    addCard("One-sample t-test for a mean", "Use Student's t-distribution when testing a population mean and σ is unknown, so the sample standard deviation s estimates it. Use a simple random sample from an approximately normal population, unless the sample is sufficiently large.", metadata);
    addCard("One-sample z-test for a proportion", "Use the normal approximation for a population proportion p when observations are independent and the success-failure counts are large enough.", metadata);
    addCard("Normal-approximation condition for a proportion", "The source uses np > 5 and nq > 5, where q = 1 - p, so the binomial sampling distribution is sufficiently close to normal.", metadata);
    addCard("Parameter and point estimate: population mean", "The population parameter is μ and its point estimate is the sample mean x̄.", metadata);
    addCard("Parameter and point estimate: population proportion", "The population parameter is p and its point estimate is the sample proportion p̂.", metadata);
  }
  if (electrochemistryNotes) {
    const metadata = { sourceSection: "Electrochemical equilibrium", sourceKind: "electrochemistry" };
    addCard("Electrochemical potential", "For species i on a molar basis, μᵢ = μᵢ° + RT ln(aᵢ) + zᵢFΦ. The terms represent standard chemical potential, chemical activity, and electrostatic energy.", metadata);
    addCard("Chemical activity", "Activity is a dimensionless effective concentration. Nonideal interactions are included through an activity coefficient, commonly written aᵢ = γᵢ(cᵢ/c°).", metadata);
    addCard("Faradaic reaction", "A Faradaic reaction transfers electrons across an electrode-electrolyte interface. Oxidation produces electrons, while reduction consumes electrons.", metadata);
    addCard("Nernst equation", "For a reaction written as a reduction, E = E° - (RT/nF) ln Q. It relates equilibrium electrode potential to temperature, electrons transferred, and reactant/product activities.", metadata);
    addCard("Reaction quotient in the Nernst equation", "Q is formed from product activities divided by reactant activities, each raised to its stoichiometric coefficient. Changing Q shifts the equilibrium electrode potential.", metadata);
    addCard("Standard cell potential", "The standard cell potential is E°cell = E°cathode - E°anode. Only potential differences between two electrodes are measurable.", metadata);
    addCard("Anode and cathode in a galvanic cell", "Oxidation occurs at the anode and produces electrons. Reduction occurs at the cathode and consumes electrons; electrons flow through the external circuit from anode to cathode.", metadata);
    addCard("Equilibrium constant and standard potential", "Standard potential and the equilibrium constant are related by ΔG° = -nFE° = -RT ln K, so E° = (RT/nF) ln K for the cell reaction as written.", metadata);
  }
  if (hypothesisTestingNotes || electrochemistryNotes) return cards;
  if (instructionalLessonPlan) return cards;

  // Slides often identify vocabulary with italics or bold inside an
  // explanatory paragraph instead of using a "term: definition" line.
  rawLines.forEach((rawLine) => {
    if (/^\s*#{1,6}\s+/.test(rawLine)) return;
    const matches = [...rawLine.matchAll(/(?<!\*)\*{1,3}([^*\n]{2,80}?)\*{1,3}(?!\*)/g)];
    if (!matches.length) return;
    const context = cleanNoteLine(rawLine);
    matches.forEach((match) => {
      let term = cleanNoteLine(match[1]).replace(/^\d+[.)]\s+/, "").replace(/[.:;,]+$/, "");
      const followingWord = context.slice(context.toLowerCase().indexOf(term.toLowerCase()) + term.length).match(/^\s+([a-z][a-z-]+)/)?.[1];
      if (term.split(/\s+/).length === 1 && followingWord && !/^(?:and|or|to|in|of|for|with|which|that|was|were|is|are)$/.test(followingWord)) term = `${term} ${followingWord}`;
      const words = term.match(/[A-Za-z0-9'-]+/g) || [];
      const remainder = context.replace(term, "").trim();
      if (!term || words.length > 8 || /^https?:/i.test(term) || /^\(?\d{4}\s*[-–—]\s*\d{4}\)?$/.test(term) || context.toLowerCase() === term.toLowerCase() || /^\([^)]*\)$/.test(remainder) || new RegExp(`^(?:the\\s+)?(?:psychological\\s+)?process\\s+known\\s+as\\s+${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[.]?$`, "i").test(context)) return;
      addCard(term, context);
    });
  });
  const outlineLines = rawLines.map((raw, sourceIndex) => {
    const expanded = raw.replace(/\t/g, "  ");
    const headingMatch = expanded.match(/^\s*(?:#{1,6}\s+)?\*\*(.+?)\*\*\s*$/)
      || expanded.match(/^\s*#{1,6}\s+(.+?)\s*$/)
      || expanded.match(/^\s*\d+(?:\.\d+)+\.?\s+(.+?)\s*$/)
      || expanded.match(/^\s*\d+[.)]\s+([^.!?]{2,80})\s*$/)
      || expanded.match(/^\s*[IVXLCDM]+[.)]\s+(.+?)\s*$/i)
      || expanded.match(/^\s*((?:[A-Z][A-Za-z&/-]*|&)(?:\s+(?:[A-Z][A-Za-z&/-]*|&|and|of|in)){1,8})\s*$/);
    const stageMatch = expanded.match(/^\s*\d+\s*[→➝]\s*(.+?)\s*$/);
    const bulletMatch = expanded.match(/^(\s*)(?:[-*•]|\d+[.)])\s+(.+?)\s*$/);
    if (headingMatch) return { sourceIndex, kind: "heading", depth: -1, text: cleanNoteLine(headingMatch[1]).replace(/^\d+(?:\.\d+)*\.?\s*/, ""), children: [] };
    if (stageMatch) return { sourceIndex, kind: "stage", depth: -0.5, text: cleanNoteLine(stageMatch[1]), children: [] };
    if (bulletMatch) return { sourceIndex, kind: "bullet", depth: Math.floor(bulletMatch[1].length / 2), text: cleanNoteLine(bulletMatch[2]), children: [] };
    const plainText = cleanNoteLine(expanded);
    return plainText ? { sourceIndex, kind: "plain", depth: 0, text: plainText, children: [] } : null;
  }).filter((line) => line?.text);

  // A short unbulleted label followed by bullets is usually a nested topic,
  // such as a character name or theme title, rather than a prose sentence.
  outlineLines.forEach((line, index) => {
    const next = outlineLines[index + 1];
    const nearbyBullet = outlineLines.slice(index + 1, index + 4).some((candidate) => candidate?.kind === "bullet");
    const namedProcessStage = /^(?:initiation|elongation|termination|completion)$/i.test(line.text);
    const ecologyInlineTopic = ecologyNotes && /\s[—–]\s/.test(line.text);
    if (line.kind === "plain" && line.text.length <= 130 && (namedProcessStage || ecologyInlineTopic || (["bullet", "stage"].includes(next?.kind) || nearbyBullet) && !/[.!;,]$/.test(line.text))) {
      line.kind = "subheading";
      line.depth = -0.5;
    }
  });

  // Markdown outlines are treated as a hierarchy. A bullet with children becomes
  // a term card; its immediate details become the back instead of one giant card.
  const headingCount = outlineLines.filter((line) => line.kind === "heading").length;
  const outlineContentCount = outlineLines.filter((line) => line.kind !== "heading").length;
  if (outlineLines.filter((line) => line.kind === "bullet").length >= 3 || (headingCount && outlineContentCount >= 4)) {
    let currentHeading = null;
    const stack = [];
    const roots = [];
    outlineLines.forEach((line) => {
      if (line.kind === "heading") {
        currentHeading = line;
        stack.length = 0;
        roots.push(line);
        return;
      }
      line.section = currentHeading?.text || "";
      while (stack.length && stack[stack.length - 1].depth >= line.depth) stack.pop();
      const parent = stack[stack.length - 1] || currentHeading;
      if (parent) { line.parent = parent; parent.children.push(line); }
      else roots.push(line);
      stack.push(line);
    });

    const splitTermDetail = (value) => {
      const namedProcess = value.match(/^(?:\d+[.)]\s*)?(?:The\s+)?(?:psychological\s+)?process\s+known\s+as\s+(.+?)[.]?$/i);
      if (namedProcess) return [namedProcess[1].trim().replace(/[.]$/, ""), ""];
      const colon = value.match(/^([^:]{2,70}):\s+(.{3,})$/);
      if (colon) return [colon[1].trim(), colon[2].trim()];
      const equals = ecologyNotes ? value.match(/^([A-Za-z][A-Za-z ]{1,40})\s*=\s*(.{3,})$/) : null;
      if (equals) return [equals[1].trim(), equals[2].trim()];
      const dash = ecologyNotes ? value.match(/^([^—–]{2,65})\s+[—–]\s+(.{3,})$/) : null;
      if (dash) return [dash[1].trim(), dash[2].trim()];
      const paren = value.match(/^([^()]{2,65})\s*\(([^()]{4,})\)$/);
      if (paren && !/^(?:more info|[A-Z0-9-]{1,6}|[A-Z][A-Za-z .'-]+,\s*\d{4})$/i.test(paren[2])) return [paren[1].trim(), paren[2].trim()];
      return [value.trim(), ""];
    };
    const cleanDetail = (value) => String(value || "").trim().replace(/[.;]+$/, "");
    const readableDetail = (node) => {
      const [term, detail] = splitTermDetail(node.text);
      if (detail) return cleanDetail(`${term}: ${detail}`);
      if (node.children.length) return cleanDetail(`${term}: ${node.children.map((child) => cleanDetail(splitTermDetail(child.text)[0])).join(", ")}`);
      return cleanDetail(term);
    };
    const completeDetail = (node) => {
      const [term, detail] = splitTermDetail(node.text);
      const own = cleanDetail(detail ? `${term}: ${detail}` : term);
      const descendants = node.children.map(completeDetail).filter(Boolean);
      return [own, ...descendants].filter(Boolean).join("; ");
    };
    const looksLikeFact = (value) => /\b(?:is|are|was|were|has|have|includes?|known as|contains?|containing|comes?|carry|carries|converts?|obtains?|flows?|forms?|supports?|assists?|lines?|secretes?|translates?|modif(?:y|ies)|synthesizes?|produces?|production|breaks?|controls?|maintains?|occurs?|affects?|found|pumped|released|acquired|transferred|tolerates?|switch(?:es)?|starts?)\b|\bbreak down\b|\bvia\b|→/i.test(value);
    const looksLikeTerm = (node) => {
      const [term, detail] = splitTermDetail(node.text);
      const words = term.match(/[A-Za-z0-9+'-]+/g) || [];
      return Boolean(detail) || (words.length > 0 && words.length <= 7 && term.length <= 65 && !/^\(?\d{4}\s*[-–—]\s*\d{4}\)?$/.test(term) && !/[,;.!?]$/.test(term) && !looksLikeFact(term));
    };
    const addOutlineNode = (node) => {
      let [term, inlineDetail] = splitTermDetail(node.text);
      const causalQuestion = term.match(/^Why did (.+?) occur\?$/i);
      if (causalQuestion) term = `Causes of ${causalQuestion[1]}`;
      const childDetails = node.children.map(readableDetail);
      const back = [cleanDetail(inlineDetail), ...childDetails].filter(Boolean).join("; ");
      const metadata = node.section ? { sourceSection: node.section } : {};
      if (node.children.length && term.length <= 75 && back && !/^(?:major leaders and institutions|important events and policies)$/i.test(term)) addCard(term, back, metadata);
      else if (inlineDetail) addCard(term, inlineDetail, metadata);
      else if (node.parent?.kind === "bullet") {
        const fact = term.match(/^(.{2,55}?)\s+(is|are|has|have|synthesizes?|translates?|produces?|breaks?|controls?|maintains?|supports?|assists?|forms?|lines?|secretes?|carries?|contains?)\s+(.{3,})$/i);
        if (fact && !/^(?:a|an|the|if|certain|some|these|those|this)\b/i.test(fact[1]) && !/\b(?:and|or)$/i.test(fact[1])) addCard(fact[1], `${fact[2].charAt(0).toUpperCase()}${fact[2].slice(1)} ${fact[3]}`, metadata);
      }
      if (molecularGeneticsNotes && node.children.length) {
        node.children.forEach((child) => {
          child.text.split(/(?<=[.!?])\s+(?=[A-Z])/).forEach((sentence) => {
            if (/^Linear chromosomes have .*\btelomeres\b/i.test(sentence)) addCard("Telomeres", sentence, metadata);
            const fact = sentence.match(/^((?:DNA|RNA)?\s*[A-Z][A-Za-z-]*(?:\s+[a-z][A-Za-z-]*){0,3})\s+(?:can\s+)?(unwinds?|stabilizes?|relieves?|synthesizes?|adds?|reads?|binds?|seals?|proofreads?|recognizes?|transports?|carries?|removes?|protects?|promotes?|inhibits?|controls?|catalyzes?|extends?|requires?)\s+(.+)$/);
            if (fact && !/^(?:Generally|Helps|Both|Proteins that|RNA synthesis does not|RNA polymerase does not|Transcription|Translation)$/i.test(fact[1])) addCard(fact[1], `${fact[2].charAt(0).toUpperCase()}${fact[2].slice(1)} ${fact[3]}`, metadata);
          });
        });
      }
      node.children.forEach(addOutlineNode);
    };
    roots.forEach((root) => {
      if (root.kind === "heading") {
        if (ecologyNotes && /^(?:Limiting Factors|Energy Flow in Ecosystems|Ecological Succession|Biodiversity & Ecosystem Stability)$/i.test(root.text)) {
          const overview = root.children.map(completeDetail).filter(Boolean).join("; ");
          if (overview) addCard(root.text, overview, { sourceSection: root.text, sourceKind: "ecology" });
          root.children.forEach(addOutlineNode);
          return;
        }
        if (functionalGroupNotes) {
          if (/^common mistakes$/i.test(root.text)) {
            root.children.forEach((child) => {
              const [term, detail] = splitTermDetail(child.text);
              if (detail) addCard(term, detail, { sourceSection: root.text, sourceKind: "functional-groups" });
            });
            return;
          }
          const back = root.children.filter((child) => !/^important chemistry concepts$/i.test(child.text)).map(completeDetail).filter(Boolean).join("; ")
            .replace(/\\\[\s*;\s*/g, "\\(")
            .replace(/;\s*\\\]/g, "\\)");
          if (back) addCard(root.text, back, { sourceSection: root.text, sourceKind: "functional-groups" });
          return;
        }
        if (/^key interpretations?$/i.test(root.text)) {
          root.children.forEach((child) => {
            const sentences = child.text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(Boolean);
            const claim = cleanDetail(sentences[0]);
            if (claim) addCard(claim, child.text, { sourceSection: root.text });
          });
          return;
        }
        if (/^plot summary$/i.test(root.text)) {
          const plotItems = root.children.map((child) => cleanDetail(child.text)).filter(Boolean);
          plotItems.forEach((event, index) => {
            let prompt = "";
            const embeddedLabel = (value) => String(value || "").replace(/^(A|An|The)\b/, (article) => article.toLowerCase());
            const condition = event.match(/^(.+?)\s+gives?\s+(.+?)\s+on the condition that\s+(.+)$/i);
            const advances = event.match(/^(.+?)\s+makes? advances (?:toward|to)\s+(.+?),\s*but\s+(.+?)\s+rejects?/i);
            const breaks = event.match(/^(.+?)\s+breaks?\s+(.+?)\s+by\s+(.+)$/i);
            const accuses = event.match(/^(.+?)\s+accuses?\s+(.+?)\s+of\s+(.+?)(?:,|\.|$)/i);
            const feels = event.match(/^(.+?)\s+feels?\s+(.+)$/i);
            const meets = event.match(/^(.+?)\s+meets?\s+(.+)$/i);
            const anger = event.match(/^(.+?)\s+becomes? angry,?\s+and\s+(.+)$/i);
            if (index === 0) prompt = "How does the story begin?";
            else if (index === plotItems.length - 1) prompt = "How does the story end?";
            else if (condition) prompt = `What condition accompanies the gift from ${embeddedLabel(condition[1])}?`;
            else if (advances) prompt = `How does ${advances[2]} respond to ${advances[1]}'s advances?`;
            else if (breaks) prompt = `How does ${breaks[1]} break ${breaks[2]}?`;
            else if (accuses) prompt = `What does ${accuses[1]} accuse ${accuses[2]} of?`;
            else if (feels) prompt = `How does ${feels[1]} feel, and why?`;
            else if (meets) prompt = `Whom does ${/^(?:he|she|they)$/i.test(meets[1]) ? "the protagonist" : meets[1]} meet?`;
            else if (anger) prompt = `Why does ${embeddedLabel(anger[1])} become angry, and what happens next?`;
            else if (/\btrial\b/i.test(event)) prompt = "What accusation leads to the trial?";
            else if (/\barrives?\b/i.test(event)) prompt = "What changes when the mysterious lady arrives?";
            if (prompt) addCard(prompt, event, { sourceSection: root.text });
          });
          return;
        }
        const flatOutline = root.children.length && root.children.every((child) => !child.children.length);
        const firstTermIndex = flatOutline ? root.children.findIndex(looksLikeTerm) : -1;
        if (firstTermIndex >= 0) {
          const openingFacts = root.children.slice(0, firstTermIndex).map((child) => cleanDetail(child.text)).filter(looksLikeFact);
          if (openingFacts.length && !/[?]$/.test(root.text) && !/^(?:overview|background|introduction|ambition|conclusion|summary)$/i.test(root.text)) addCard(root.text, openingFacts.join("; "), { sourceSection: root.text });
          for (let index = firstTermIndex; index < root.children.length;) {
            const node = root.children[index];
            if (!looksLikeTerm(node)) { index += 1; continue; }
            const [term, inlineDetail] = splitTermDetail(node.text);
            let end = index + 1;
            while (end < root.children.length && !looksLikeTerm(root.children[end])) end += 1;
            const details = root.children.slice(index + 1, end).map((child) => cleanDetail(child.text));
            const back = [cleanDetail(inlineDetail), ...details].filter(Boolean).join("; ");
            if (back) addCard(term, back, { sourceSection: root.text });
            index = end;
          }
          return;
        }
        const directFacts = root.children.filter((child) => !child.children.length && looksLikeFact(child.text)).map((child) => cleanDetail(child.text));
        if (directFacts.length && !/[?]$/.test(root.text) && !/^(?:overview|background|introduction|ambition|conclusion|summary|plot summary|possible discussion questions)$/i.test(root.text)) addCard(root.text, directFacts.join("; "), { sourceSection: root.text });
        root.children.forEach(addOutlineNode);
      } else if (!(headingCount && !root.section)) addOutlineNode(root);
    });
    if (cards.length) return cards;
  }

  const lines = rawLines.map(cleanNoteLine).filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";
    const questionMatch = line.match(/^(?:q|question)\s*[:.-]\s*(.+\?)?\s*(.*)$/i);
    const answerMatch = nextLine.match(/^(?:a|answer)\s*[:.-]\s*(.+)$/i);
    if (questionMatch && answerMatch) {
      const question = [questionMatch[1], questionMatch[2]].filter(Boolean).join(" ").trim();
      addCard(question.endsWith("?") ? question : `${question}?`, answerMatch[1]);
      index += 1;
      continue;
    }

    const inlineQuestion = line.match(/^(.+\?)\s+(?:[-–—]|answer\s*:)\s+(.+)$/i);
    if (inlineQuestion) {
      addCard(inlineQuestion[1], inlineQuestion[2]);
      continue;
    }

    const pair = line.match(/^([^:]{2,80})\s*:\s+(.{4,})$/) || line.match(/^(.{2,80}?)\s+[–—]\s+(.{4,})$/);
    if (pair && !/^(https?|file)$/i.test(pair[1])) {
      addCard(pair[1].replace(/[.?!]+$/, ""), pair[2]);
      continue;
    }

    const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((sentence) => sentence.length >= 18);
    sentences.forEach((sentence) => {
      const normalized = sentence.replace(/[.]+$/, "").trim();
      let match = normalized.match(/^(?:In\s+)?((?:1[5-9]|20)\d{2}),\s+(.{8,})$/i);
      if (match) { addCard(`What happened in ${match[1]}?`, match[2], { sourceKind: "history" }); return; }
      match = normalized.match(/^(.{2,60}?)\s+differs? from\s+(.{2,60}?)\s+because\s+(.{6,})$/i);
      if (match) { addCard(`How do ${match[1]} and ${match[2]} differ?`, `${match[1]} differs from ${match[2]} because ${match[3]}.`); return; }
      match = normalized.match(/^Unlike\s+(.{2,55}?),\s+(.{2,55}?)\s+(.{6,})$/i);
      if (match) { addCard(`How does ${match[2]} differ from ${match[1]}?`, `Unlike ${match[1]}, ${match[2]} ${match[3]}.`); return; }
      match = normalized.match(/^(.{2,70}?)\s+(causes?|produces?|creates?|converts?)\s+(.{2,})$/i);
      if (match) {
        addCard(`What does ${relationshipSubject(match[1])} ${questionVerb(match[2])}?`, match[3]);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+(contains?|consists? of|includes?|requires?)\s+(.{2,})$/i);
      if (match) {
        const verb = /consists? of/i.test(match[2]) ? "consist of" : questionVerb(match[2]);
        addCard(`What does ${relationshipSubject(match[1])} ${verb}?`, match[3]);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+(is|are|means|refers to|describes)\s+(.{6,})$/i);
      if (match) {
        addCard(match[1].replace(/^(?:A|An|The)\s+/i, ""), `${match[1]} ${match[2]} ${match[3]}.`);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+(?:functions?|serves)\s+to\s+(.{6,})$/i);
      if (match) {
        addCard(`What is the function of ${embeddedSubject(match[1])}?`, `${match[1]} functions to ${match[2]}.`);
        return;
      }
      match = normalized.match(/^(.{2,70}?)\s+occurs? when\s+(.{6,})$/i);
      if (match) { addCard(`When does ${embeddedSubject(match[1])} occur?`, match[2]); return; }
      match = normalized.match(/^(?:In\s+)?([A-Za-z][A-Za-z -]{2,55})(?:,\s+also known as [^,]+)?,\s+(.{12,})$/i);
      if (match && /\b(?:learn|associate|involves?|occurs?|refers?|extends?|allows?)\b/i.test(match[2])) addCard(match[1], `${match[1]} ${match[2]}.`);
    });
  }
  return cards;
}

function cardTopic(card) {
  const patterns = [
    /^Explain\s+(.+?)\.$/i,
    /^What is the function of\s+(.+?)\?$/i,
    /^Describe what\s+(.+?)\s+(?:causes?|produces?|creates?|converts?|contains?|consists? of|includes?|requires?)\.$/i,
    /^What does\s+(.+?)\s+(?:cause|causes|produce|produces|create|creates|convert|converts|contain|contains|consist of|consists of|include|includes|require|requires)\?$/i,
    /^What is\s+(?:an?\s+|the\s+)?(.+?)\?$/i,
    /^When does\s+(.+?)\s+occur\?$/i,
  ];
  for (const pattern of patterns) {
    const match = card.front.match(pattern);
    if (match && match[1].length <= 70) return match[1].trim();
  }
  if (!/[?]$/.test(card.front) && card.front.length <= 70) return card.front.trim();
  return "";
}

function generateQuestionsFromCards(cards) {
  const questionCards = cards.filter((card) => !/^Explain\b/i.test(String(card.front || "").trim()));
  const topics = [...new Set(questionCards.map(cardTopic).filter(Boolean))];
  return questionCards.map((card, index) => {
    const topic = cardTopic(card);
    const embeddedTopic = String(topic || "").replace(/^(A|An|The)\b/, (article) => article.toLowerCase());
    const base = { id: makeLocalId("question"), source: card.back, confidence: 0.75 };
    const section = String(card.sourceSection || "").toLowerCase();
    if (topic && /main characters?|characters?/.test(section)) {
      return { ...base, type: "short_answer", prompt: `How do the traits, choices, and position of ${embeddedTopic} shape the story?`, answer: card.back, difficulty: "Medium", confidence: 0.9, rule: "character analysis" };
    }
    if (topic && /major themes?|themes?/.test(section)) {
      return { ...base, type: "short_answer", prompt: `How is the theme of ${topic} developed in the work?`, answer: card.back, difficulty: "Medium", confidence: 0.9, rule: "theme analysis" };
    }
    if (topic && /symbols?|motifs?/.test(section)) {
      const symbolTopic = embeddedTopic.replace(/^(Wealth|Beauty|Secrecy)\b/, (word) => word.toLowerCase());
      return { ...base, type: "short_answer", prompt: `How does ${symbolTopic} function in the story, and why is it significant?`, answer: card.back, difficulty: "Medium", confidence: 0.9, rule: "symbol analysis" };
    }
    if (topic && /conflicts?/.test(section)) {
      const opposingSides = topic.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
      const prompt = opposingSides
        ? `What causes the conflict between ${opposingSides[1]} and ${opposingSides[2]}, and what is at stake?`
        : `What tension involves ${topic}, and what is at stake?`;
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.85, rule: "conflict analysis" };
    }
    if (topic && /key interpretations?|interpretations?/.test(section)) {
      const interpretation = embeddedTopic.replace(/^Leaving\b/, "leaving");
      return { ...base, type: "short_answer", prompt: `What evidence supports the interpretation that ${interpretation}?`, answer: card.back, difficulty: "Hard", confidence: 0.82, rule: "evidence-based interpretation" };
    }
    if (topic && /quick review/.test(section)) {
      const reviewPrompts = {
        author: "Who wrote the work?",
        genre: "What genre is the work?",
        setting: "Where and when is the work set?",
        "main character": "Who is the main character?",
        "central conflict": "What is the central conflict?",
        climax: "What is the climax?",
        resolution: "How is the central conflict resolved?",
        "central idea": "What is the work's central idea?",
      };
      return { ...base, type: "wh", prompt: reviewPrompts[topic.toLowerCase()] || `What is important about ${topic}?`, answer: card.back, difficulty: "Easy", confidence: 0.9, rule: "review fact" };
    }
    if (topic && card.sourceKind === "functional-groups") {
      let prompt = `What are the defining structure, properties, and common reactions of ${topic}?`;
      if (/acidity and basicity/i.test(section)) prompt = "How do structure and pKa determine the acidity or basicity of organic functional groups?";
      else if (/polarity and solubility/i.test(section)) prompt = "How do polarity, hydrogen bonding, charge, and carbon-chain length affect solubility and boiling point?";
      else if (/oxidation and reduction/i.test(section)) prompt = "How can oxidation and reduction of common organic functional groups be recognized?";
      else if (/functional groups in biology/i.test(section)) prompt = "Which functional groups occur in major biological molecules, and what roles do they play?";
      else if (/common mistakes/i.test(section)) {
        const comparison = topic.replace(/\s*≠\s*/, " be distinguished from ").replace(/^[A-Z][a-z]+/, (word) => word.toLowerCase());
        prompt = `How can ${comparison}?`;
      }
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.92, rule: "functional-group reasoning" };
    }
    if (topic && card.sourceKind === "molecular-genetics") {
      let prompt = `What is ${topic}, and what role does it play in molecular genetics?`;
      if (/^(?:DNA Replication|Transcription|Translation): (?:Initiation|Elongation|Termination|Completion)$/i.test(topic)) prompt = `What happens during ${topic}?`;
      else if (/\bvs\.?\b|\s≠\s/i.test(topic)) prompt = `How do ${topic.replace(/\s+(?:vs\.?|≠)\s+/i, " and ").replace(/^[A-Z]/, (letter) => letter.toLowerCase())} differ?`;
      else if (/^(?:Helicase|Single-strand binding proteins|Topoisomerase|Primase|DNA polymerase|RNA polymerase|DNA ligase|Telomerase|Transcription factors|Release factors|Lac repressor|Allolactose)$/i.test(topic)) prompt = `What is the role of ${topic}?`;
      else if (/^(?:mRNA|tRNA|rRNA)$/i.test(topic)) prompt = `What is the role of ${topic} in gene expression?`;
      else if (/^(?:A|P|E) site\b/i.test(topic)) prompt = `What occurs at the ${topic} of the ribosome?`;
      else if (/^Gene Mutations$/i.test(topic)) prompt = "What are gene mutations, and how can they affect gene products?";
      else if (/^Insertions and deletions$/i.test(topic)) prompt = "How can insertions and deletions alter a coding sequence?";
      else if (/^Chromosomal mutations$/i.test(topic)) prompt = "What are the major types of chromosomal mutation?";
      else if (/mutation/i.test(topic)) prompt = `What is a ${embeddedTopic.replace(/^[A-Z]/, (letter) => letter.toLowerCase())}, and how can it affect a gene product?`;
      else if (/central dogma/i.test(topic)) prompt = "How does genetic information flow according to the central dogma?";
      else if (/^DNA Replication —/i.test(topic)) prompt = "When does DNA replication occur, and what does semiconservative replication mean?";
      else if (/^Transcription —/i.test(topic)) prompt = "Where does transcription occur, and what does it produce?";
      else if (/^Translation —/i.test(topic)) prompt = "Where does translation occur, and what does it produce?";
      else if (/leading strand/i.test(topic)) prompt = "How is the leading strand synthesized during DNA replication?";
      else if (/lagging strand/i.test(topic)) prompt = "How is the lagging strand synthesized, and why are Okazaki fragments required?";
      else if (/^Regulation of Gene Expression$/i.test(topic)) prompt = "Why is gene expression regulated, and at what levels can regulation occur?";
      else if (/^Lac operon (?:with|without) lactose$/i.test(topic)) prompt = `How is the ${topic} regulated?`;
      else if (/^Lac operon — inducible system$/i.test(topic)) prompt = "Why is the lac operon considered an inducible system?";
      else if (/^Trp operon — repressible system$/i.test(topic)) prompt = "How does tryptophan regulate the repressible trp operon?";
      else if (/^DNA bases$/i.test(topic)) prompt = "Which nitrogenous bases occur in DNA?";
      else if (/^DNA base pairing$/i.test(topic)) prompt = "What are the DNA base-pairing rules, including hydrogen-bond numbers?";
      else if (/^DNA strand directionality$/i.test(topic)) prompt = "What does it mean for DNA strands to be antiparallel?";
      else if (/^Telomeres$/i.test(topic)) prompt = "What are telomeres, and why do chromosome ends require them?";
      else if (/^Semiconservative replication$/i.test(topic)) prompt = "What does semiconservative DNA replication produce?";
      else if (/^Transcription base-pairing rules$/i.test(topic)) prompt = "What base-pairing rules does RNA polymerase follow during transcription?";
      else if (/^Eukaryotic mRNA processing$/i.test(topic)) prompt = "What three major modifications convert pre-mRNA into mature eukaryotic mRNA?";
      else if (/^5′ cap$/i.test(topic)) prompt = "What is the function of the 5′ cap on eukaryotic mRNA?";
      else if (/^Poly-A tail$/i.test(topic)) prompt = "What is the function of the poly-A tail?";
      else if (/^RNA splicing$/i.test(topic)) prompt = "How does RNA splicing process pre-mRNA, and what does alternative splicing accomplish?";
      else if (/^DNA coding strand$/i.test(topic)) prompt = "How is the DNA coding strand related to the mRNA sequence?";
      else if (/^DNA template strand$/i.test(topic)) prompt = "How is the DNA template strand read during transcription?";
      else if (/^Important codons$/i.test(topic)) prompt = "Which codons initiate and terminate translation?";
      else if (/^Genetic code is degenerate$/i.test(topic)) prompt = "What does it mean that the genetic code is degenerate?";
      else if (/^Ribosomal A, P, and E sites$/i.test(topic)) prompt = "What are the functions of the ribosome's A, P, and E sites?";
      else if (/^The ribosome$/i.test(topic)) prompt = "What does the ribosome do during translation?";
      else if (/^Initiator tRNA$/i.test(topic)) prompt = "What does initiator tRNA do during translation initiation?";
      else if (/^Enhancers and silencers$/i.test(topic)) prompt = "How do enhancers and silencers regulate transcription?";
      else if (/^Noncoding RNAs$/i.test(topic)) prompt = "How can noncoding RNAs regulate gene expression?";
      else if (/^DNA methylation$/i.test(topic)) prompt = "How does promoter-associated DNA methylation affect transcription?";
      else if (/^Histone modification$/i.test(topic)) prompt = "How can histone acetylation and methylation alter gene expression?";
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.92, rule: "molecular-genetics reasoning" };
    }
    if (topic && card.sourceKind === "ecology") {
      let prompt = `What is ${embeddedTopic}, and why is it ecologically important?`;
      if (/^Population$/i.test(topic)) prompt = "What is a population?";
      else if (/^Population Growth$/i.test(topic)) prompt = "Which four processes change population size?";
      else if (/^Population size changes based on 4 factors$/i.test(topic)) prompt = "How do births, deaths, immigration, and emigration change population size?";
      else if (/^Exponential growth$/i.test(topic)) prompt = "Under what conditions does exponential population growth occur, and what does its equation describe?";
      else if (/^Logistic growth$/i.test(topic)) prompt = "How does logistic growth change as population size approaches carrying capacity?";
      else if (/^Equation$/i.test(topic) && /dN\/dt=rN/i.test(card.back)) prompt = "What does each variable represent in the exponential-growth equation dN/dt = rN?";
      else if (/^Density-dependent$/i.test(topic)) prompt = "How do density-dependent limiting factors change as population density increases?";
      else if (/^Density-dependent examples$/i.test(topic)) prompt = "What are common density-dependent limiting factors?";
      else if (/^Density-independent$/i.test(topic)) prompt = "Why can density-independent factors affect crowded and sparse populations alike?";
      else if (/^Density-independent examples$/i.test(topic)) prompt = "What are common density-independent limiting factors?";
      else if (/^Density dependence: drought vs\. disease$/i.test(topic)) prompt = "Why is drought generally density-independent while disease transmission is often density-dependent?";
      else if (/^Competition/i.test(topic)) prompt = "Why is competition represented as −/−, and how do intraspecific and interspecific competition differ?";
      else if (/^Predation/i.test(topic)) prompt = "Why is predation represented as +/−, and how can predator and prey populations influence one another?";
      else if (/^Mutualism/i.test(topic)) prompt = "Why is mutualism represented as +/+?";
      else if (/^Commensalism/i.test(topic)) prompt = "Why is commensalism represented as +/0?";
      else if (/^Parasitism/i.test(topic)) prompt = "Why is parasitism represented as +/−, and why may a parasite avoid immediately killing its host?";
      else if (/^Energy Flow in Ecosystems$/i.test(topic)) prompt = "How do energy and matter move differently through an ecosystem?";
      else if (/^10% rule$/i.test(topic)) prompt = "How can the 10% rule be used to estimate energy available at successive trophic levels?";
      else if (/^10% rule example$/i.test(topic)) prompt = "If producers contain 10,000 kJ, how much energy would the 10% rule predict for primary and secondary consumers?";
      else if (/^Why energy decreases$/i.test(topic)) prompt = "Why does available energy decrease between trophic levels?";
      else if (/^Primary succession$/i.test(topic)) prompt = "Where does primary succession begin, and why is it relatively slow?";
      else if (/^Secondary succession$/i.test(topic)) prompt = "Where does secondary succession begin, and why is it usually faster than primary succession?";
      else if (/^Ecological Succession$/i.test(topic)) prompt = "What is ecological succession, and why does it not always produce one permanent climax community?";
      else if (/^Biodiversity/i.test(topic)) prompt = "How can biodiversity influence ecosystem functioning and resilience?";
      else if (/^Competitive exclusion principle$/i.test(topic)) prompt = "What does the competitive exclusion principle predict when two species occupy the same niche?";
      else if (/^Intraspecific$/i.test(topic)) prompt = "What is intraspecific competition?";
      else if (/^Interspecific$/i.test(topic)) prompt = "What is interspecific competition?";
      else if (/^Limiting Factors$/i.test(topic)) prompt = "How do density-dependent and density-independent limiting factors differ?";
      else if (/^Succession$/i.test(topic)) prompt = "What is ecological succession?";
      else if (/^Connections among ecological processes$/i.test(topic)) prompt = "How are resources, species interactions, population growth, and energy availability connected?";
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.92, rule: "ecological reasoning" };
    }
    if (topic && card.sourceKind === "calculus") {
      let prompt = `What does ${embeddedTopic} mean?`;
      if (/left-hand limit/i.test(topic)) prompt = "What does a left-hand limit describe, and how is it written?";
      else if (/right-hand limit/i.test(topic)) prompt = "What does a right-hand limit describe, and how is it written?";
      else if (/limit of a constant/i.test(topic)) prompt = "What is the limit of a constant function?";
      else if (/limit of .?x/i.test(topic)) prompt = "What is the limit of the identity function as x approaches a value?";
      else if (/line with a hole/i.test(card.back)) prompt = "How can a function have a limit at a point where the graph has a hole?";
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.9, rule: "mathematical concept" };
    }
    if (topic && card.sourceKind === "psychology-learning") {
      let prompt = `What is ${embeddedTopic}?`;
      if (/classical conditioning/i.test(topic)) prompt = "How does classical conditioning create an association between stimuli?";
      else if (/operant conditioning/i.test(topic)) prompt = "How do consequences shape behavior in operant conditioning?";
      else if (/observational learning/i.test(topic)) prompt = "How does observational learning differ from learning through direct experience?";
      else if (/associative learning/i.test(topic)) prompt = "What is associative learning?";
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.9, rule: "psychology concept" };
    }
    if (topic && card.sourceKind === "hypothesis-testing") {
      let prompt = `When would you use ${embeddedTopic}?`;
      if (/normal-approximation condition/i.test(topic)) prompt = "What conditions allow a sample proportion to be modeled with a normal distribution?";
      else if (/population mean/i.test(topic)) prompt = "Which parameter and statistic are used when estimating a population mean?";
      else if (/population proportion/i.test(topic)) prompt = "Which parameter and statistic are used when estimating a population proportion?";
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.92, rule: "statistical test selection" };
    }
    if (topic && card.sourceKind === "electrochemistry") {
      let prompt = `What is ${embeddedTopic}, and how is it used?`;
      if (/Reaction quotient/i.test(topic)) prompt = "How does the reaction quotient affect the electrode potential in the Nernst equation?";
      else if (/Nernst equation/i.test(topic)) prompt = "What does the Nernst equation calculate, and what does each term represent?";
      else if (/Anode and cathode/i.test(topic)) prompt = "Where do oxidation and reduction occur in a galvanic cell, and which way do electrons flow?";
      else if (/Equilibrium constant/i.test(topic)) prompt = "How are standard cell potential, Gibbs free energy, and the equilibrium constant related?";
      else if (/Standard cell potential/i.test(topic)) prompt = "How is standard cell potential calculated from the two half-cell potentials?";
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.92, rule: "electrochemistry reasoning" };
    }
    if (topic && card.sourceKind === "science") {
      const prompt = card.sourceFormat === "table"
        ? `Which defining properties distinguish ${embeddedTopic} from the other entries in this comparison?`
        : /[?]$/.test(card.front) ? card.front
          : `What is ${embeddedTopic}, and how does it function or affect the system being studied?`;
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.86, rule: "scientific mechanism" };
    }
    if (topic && card.sourceKind === "math") {
      const prompt = card.sourceFormat === "table"
        ? `When is ${embeddedTopic} used, and what properties or conditions define it?`
        : /[?]$/.test(card.front) ? card.front
          : `What does ${embeddedTopic} mean, and how would you use it in a problem?`;
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.86, rule: "mathematical interpretation" };
    }
    if (topic && card.sourceKind === "literature") {
      return { ...base, type: "short_answer", prompt: `How does ${embeddedTopic} contribute to the work's meaning? Use relevant evidence.`, answer: card.back, difficulty: "Medium", confidence: 0.84, rule: "literary evidence" };
    }
    if (topic && card.sourceKind === "business") {
      return { ...base, type: "short_answer", prompt: `What is ${embeddedTopic}, which factors influence it, and why does it matter for a decision?`, answer: card.back, difficulty: "Medium", confidence: 0.84, rule: "business application" };
    }
    const historicalSection = card.sourceKind === "history" || /\b(?:revolution|regime|monarchy|assembly|bastille|great fear|feudal\w*|terror|directory|napoleon|historical|dates?|effects?|factions?|estates?|versailles|robespierre|execution|constitutional|political|causes?|connections?|theme|rights?|declaration|enlightenment)\b/i.test(section);
    if (topic && historicalSection) {
      const dateTopic = /^(?:(?:january|february|march|april|may|june|july|august|september|october|november|december)\b|\d{4}\b)/i.test(topic);
      const effectTopic = /effects?$/i.test(topic);
      const personTopic = /^(?:John Locke|Montesquieu|Jean-Jacques Rousseau|Voltaire|Maximilien Robespierre|Napoleon Bonaparte)$/i.test(topic);
      const namedDate = topic.match(/^(.+?)\s+[—–-]\s+(.+)$/);
      let prompt = `What was ${/^(?:First|Second|Third) Estate/i.test(topic) ? "the " : ""}${embeddedTopic}, and why was it significant?`;
      if (/^Significance of /i.test(topic)) prompt = `Why was ${topic.replace(/^Significance of /i, "").replace(/^The\b/, "the")} significant?`;
      else if (/^Consequences of /i.test(topic)) prompt = `What were the consequences of ${topic.replace(/^Consequences of /i, "")}?`;
      else if (/^Limitation of /i.test(topic) && /women were excluded/i.test(card.back)) prompt = "What important limitation remained in the Declaration of the Rights of Man and of the Citizen?";
      else if (/^Limitation of /i.test(topic)) prompt = `What limitation remained after ${topic.replace(/^Limitation of /i, "")}?`;
      else if (/^Principles of the Declaration$/i.test(topic)) prompt = "What principles did the Declaration of the Rights of Man and of the Citizen establish?";
      else if (/^(?:Girondins|Jacobins and Montagnards|Sans-culottes)$/i.test(topic)) prompt = `Who were the ${topic}, and what did they support?`;
      else if (/^Economic Crisis$/i.test(topic)) prompt = "What factors created France's economic crisis before the Revolution?";
      else if (/^Social Inequality$/i.test(topic)) prompt = "How did social inequality contribute to the French Revolution?";
      else if (/^Enlightenment Ideas$/i.test(topic)) prompt = "How did Enlightenment ideas contribute to the French Revolution?";
      else if (/^Essential Historical Connections$/i.test(topic)) prompt = "What cause-and-effect chain connects the major stages of the French Revolution?";
      else if (/^Central theme$/i.test(topic)) prompt = "What central tension defined the French Revolution?";
      else if (/^Storming of the Bastille/i.test(topic)) prompt = "What happened during the Storming of the Bastille, and why was it significant?";
      else if (/^Execution of King Louis XVI/i.test(topic)) prompt = "Why was Louis XVI tried and executed?";
      else if (/^Fall of Robespierre/i.test(topic)) prompt = "How did Robespierre fall from power, and why was his fall significant?";
      else if (/^Napoleon Bonaparte and the End/i.test(topic)) prompt = "How did Napoleon Bonaparte bring the French Revolution to an end?";
      else if (namedDate && dateTopic) prompt = `What was the ${namedDate[2].replace(/^the\s+/i, "")}, and what happened during it?`;
      else if (dateTopic) prompt = `What happened ${/^\d{4}(?:\s*[-–—]\s*\d{4})?$/.test(topic) ? "in" : "on"} ${topic}?`;
      else if (effectTopic) prompt = `What were the ${topic.toLowerCase()} of the French Revolution?`;
      else if (personTopic) prompt = /major causes/i.test(section) ? `What ideas did ${topic} contribute to revolutionary thought?` : `What role did ${topic} play during this period?`;
      else if (/^Causes of /i.test(topic)) prompt = `What caused ${topic.replace(/^Causes of /i, "")}?`;
      return { ...base, type: "short_answer", prompt, answer: card.back, difficulty: "Medium", confidence: 0.9, rule: "historical context" };
    }
    const statement = topic && card.back.toLowerCase().startsWith(topic.toLowerCase())
      ? card.back
      : topic ? `${topic} is ${card.back.charAt(0).toLowerCase()}${card.back.slice(1)}` : card.back;
    if (index % 4 === 1 && topic) {
      const makeFalse = Math.floor(index / 4) % 2 === 1 && topics.length > 1;
      const relatedTopics = questionCards.filter((item) => item !== card && ((card.sourceSection && item.sourceSection === card.sourceSection) || (card.sourceKind && item.sourceKind === card.sourceKind))).map(cardTopic).filter(Boolean);
      const replacement = relatedTopics.find((item) => item !== topic) || topics.find((item) => item !== topic);
      const prompt = makeFalse && replacement
        ? statement.replace(new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), replacement)
        : statement;
      return { ...base, type: "true_false", prompt, answer: makeFalse ? "False" : "True", difficulty: "Medium", confidence: 0.7, rule: makeFalse ? "altered statement" : "source statement" };
    }
    if (index % 4 === 2 && topic) {
      const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(escapedTopic, "i").test(statement)) {
        const cloze = statement.replace(new RegExp(escapedTopic, "i"), "_____");
        return { ...base, type: "cloze", prompt: cloze, answer: topic, difficulty: "Medium", confidence: 0.85, rule: "key-term deletion" };
      }
      return { ...base, type: "short_answer", prompt: /[?]$/.test(card.front) ? card.front : `What is ${embeddedTopic}?`, answer: card.back, difficulty: "Medium", confidence: 0.78, rule: "fact recall" };
    }
    if (index % 4 === 3 && topic && topics.length >= 4) {
      const related = questionCards.filter((item) => item !== card && ((card.sourceSection && item.sourceSection === card.sourceSection) || (card.sourceKind && item.sourceKind === card.sourceKind))).map(cardTopic).filter(Boolean);
      const candidates = [...new Set([...related, ...topics])].filter((item) => item.toLowerCase() !== topic.toLowerCase());
      const offset = index % candidates.length;
      const distractors = [...candidates.slice(offset), ...candidates.slice(0, offset)].slice(0, 3);
      const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cloze = new RegExp(escapedTopic, "i").test(statement) ? statement.replace(new RegExp(escapedTopic, "i"), "_____") : `_____ matches this description: ${card.back}`;
      const options = shuffleInPlace([topic, ...distractors]);
      if (options.length === 4) return { ...base, type: "mcq", prompt: `Complete the statement: ${cloze}`, answer: topic, options, difficulty: "Medium", confidence: 0.9, rule: "key-term deletion with noun distractors" };
    }
    const prompt = topic && card.front.trim() === topic ? `What is ${embeddedTopic}?` : card.front;
    return { ...base, type: "wh", prompt, answer: card.back, difficulty: "Easy", confidence: 0.8, rule: "fact-to-question transformation" };
  });
}

function generateFeynmanPrompts(notes, cards) {
  if (/\b5E Lesson\b[\s\S]{0,1500}\bTeacher's Note\b|\bAt a glance\b[\s\S]{0,1200}\bMaterials\b[\s\S]{0,1200}\bThe 5E lesson\b/i.test(notes)) return [];
  if (/probability distribution needed for hypothesis testing|hypothesis test for the mean[\s\S]{0,1200}hypothesis test for proportions/i.test(notes)) {
    return [
      "Explain how to choose among a one-sample z-test for a mean, a one-sample t-test for a mean, and a one-sample z-test for a proportion.",
      "Explain why knowing or not knowing the population standard deviation changes the test distribution for a population mean.",
      "Check a proposed one-proportion hypothesis test and explain whether independence and success-failure conditions are satisfied.",
      "Distinguish a population parameter from its sample statistic for both means and proportions.",
      "Explain what would go wrong if a hypothesis-test distribution were chosen without checking its assumptions.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/nernst equation|faradaic reactions? in equilibrium|electrochemical potential/i.test(notes)) {
    return [
      "Derive the meaning of each term in the electrochemical-potential equation and explain how concentration and voltage influence it.",
      "Explain why chemical activity replaces concentration in a nonideal solution and how the activity coefficient captures nonideality.",
      "Use the Nernst equation to predict how changing reactant or product activity changes an electrode potential.",
      "Explain oxidation, reduction, anode, cathode, and electron flow for a complete galvanic cell.",
      "Connect standard cell potential to Gibbs free energy and the equilibrium constant, including the sign of each quantity.",
      "Build a complete electrochemical cell from two half-reactions and explain why only a potential difference can be measured.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\b(?:the limit of a function|one-sided limits?|limit laws?|differentiation|definite integral|derivative as a function)\b/i.test(notes)) {
    return [
      "Explain what a limit measures without relying only on notation, then connect the explanation to a graph and a table.",
      "Explain why a function's limit can exist even when the function is undefined or has a different value at that point.",
      "Compare left-hand, right-hand, and two-sided limits and explain how they determine whether a limit exists.",
      "Work through a limit algebraically and explain why each simplification is valid.",
      "Explain the constant, identity, sum, product, quotient, and composition limit laws with examples.",
      "Diagnose a limit that does not exist because of a jump, unbounded behavior, or incompatible one-sided limits.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\bclassical conditioning\b[\s\S]{0,2500}\boperant conditioning\b[\s\S]{0,2500}\bobservational learning\b/i.test(notes)) {
    return [
      "Explain how learned behavior differs from instincts and reflexes, using one original example of each.",
      "Explain associative learning and show how it connects classical and operant conditioning.",
      "Trace a classical-conditioning example from the unconditioned stimulus and response to the conditioned stimulus and response.",
      "Explain how reinforcement and punishment change future behavior in operant conditioning.",
      "Compare classical, operant, and observational learning by what is learned and how experience produces the change.",
      "Explain how attention, memory, and consequences can affect whether an observed behavior is imitated.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/ecology\s*[—–-]\s*population dynamics\s*&\s*ecosystems|biology\s*\|\s*unit:\s*ecology|population ecology|(?:^|\n)\s*#{0,6}\s*ecology\s*(?:\n|$)/im.test(notes)) {
    return [
      "Compare exponential and logistic population growth, explaining each curve, equation, variable, and limiting assumption.",
      "Predict how births, deaths, immigration, and emigration change population size in a given scenario.",
      "Compare density-dependent and density-independent limiting factors and explain why their effects differ.",
      "Explain the sign notation and biological consequences of competition, predation, mutualism, commensalism, and parasitism.",
      "Trace energy through trophic levels and use the 10% rule to estimate how much energy reaches each level.",
      "Explain why energy flows through ecosystems while matter cycles, including the roles of producers, consumers, and decomposers.",
      "Compare primary and secondary succession and predict which will proceed faster after a given disturbance.",
      "Explain how biodiversity, keystone species, invasive species, and habitat fragmentation affect ecosystem stability.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/organic chemistry\s*[—–-]\s*functional groups|functional groups study notes/i.test(notes)) {
    return [
      "Explain how bond order and hybridization distinguish alkanes, alkenes, alkynes, and aromatic compounds and affect their reactions.",
      "Compare alcohols, phenols, and ethers by structure, hydrogen bonding, acidity, boiling point, and water solubility.",
      "Compare aldehydes and ketones, including their structures, relative reactivity, oxidation, and reduction products.",
      "Explain how carboxylic acids, esters, acyl halides, acid anhydrides, and amides are structurally related and interconverted.",
      "Compare amines, amides, nitriles, and nitro groups by bonding, basicity, polarity, and common reactions.",
      "Explain how pKa and pH predict whether an organic functional group is protonated or deprotonated.",
      "Trace the major oxidation and reduction patterns for alcohols, carbonyls, alkenes, nitro groups, and thiols.",
      "Identify the major functional groups found in proteins, carbohydrates, lipids, DNA, RNA, and ATP and explain why each matters.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/genetics:\s*dna replication, transcription\s*&\s*translation|biology notes\s*[—–-]\s*molecular genetics/i.test(notes)) {
    return [
      "Trace the flow of genetic information from DNA to RNA to protein, including the purpose of each stage.",
      "Explain DNA replication from origin recognition through completion, including the role of each major enzyme and 5′→3′ directionality.",
      "Compare leading- and lagging-strand synthesis and explain why Okazaki fragments and multiple primers are needed.",
      "Explain transcription and eukaryotic mRNA processing, including promoters, RNA polymerase, the 5′ cap, poly-A tail, and splicing.",
      "Explain translation from start-codon recognition through termination, including tRNA and the ribosome's A, P, and E sites.",
      "Predict how silent, missense, nonsense, insertion, deletion, and chromosomal mutations can affect a gene product.",
      "Compare lac-operon, trp-operon, and eukaryotic regulation through transcription factors, chromatin changes, and noncoding RNA.",
      "Given DNA coding and template strands, explain how to derive the mRNA sequence and determine the resulting amino-acid sequence.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  const stopWords = new Set("a an and are as at be because been being but by can did do does for from had has have how if in into is it its may more most not of on or our should than that the their then there these they this those through to using was were what when where which who why will with your".split(" "));
  const scores = new Map();
  const display = new Map();
  const lessonTopics = [];
  const headingTopics = [];
  const primaryHeadingTopics = [];
  const addCandidate = (value, weight) => {
    const phrase = cleanNoteLine(value).replace(/[.:;!?]+$/, "").trim();
    if (/^(?:significance|consequences|limitation|principles|january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(phrase) || /^\d{4}(?:\b|\s*[-–—])/.test(phrase)) return;
    const words = phrase.match(/\b(?:\d+(?:st|nd|rd|th)|[A-Za-z][A-Za-z0-9'-]*)\b/gi) || [];
    if (!words.length || words.length > 6 || words.every((word) => stopWords.has(word.toLowerCase()))) return;
    const key = words.join(" ").toLowerCase();
    if (key.length < 3) return;
    scores.set(key, (scores.get(key) || 0) + weight + Math.min(2.5, words.length * 0.45));
    if (!display.has(key)) display.set(key, words.join(" "));
  };

  const lines = notes.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  lines.forEach((line, lineIndex) => {
    const cleaned = cleanNoteLine(line);
    const pageHeading = cleaned.match(/^Page\s+\d+\s*:\s*(.+)$/i);
    if (pageHeading) return;
    const lessonHeading = lessonHeadingInfo(line);
    if (lessonHeading) {
      let topic = lessonHeading.topic;
      if (!topic) {
        const following = lines.slice(lineIndex + 1, lineIndex + 9).map(cleanNoteLine).find((candidate) => candidate && !lessonHeadingInfo(candidate));
        topic = (following || "").replace(/^(?:A|An|The)\s+/i, "").split(/[,;:]/)[0].trim();
      }
      if (topic && !/^lesson\s*\d+$/i.test(topic)) {
        addCandidate(topic, 15);
        lessonTopics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
      }
      return;
    }
    const numberedHeading = line.match(/^\s*(?:\d+(?:\.\d+)*\.?|[IVXLCDM]+[.)])\s+([^.!?]{3,80})$/i);
    const heading = /^#{1,6}\s+/.test(line) || numberedHeading || (/^[A-Z][^.!?]{2,80}:?$/.test(cleaned) && !cleaned.includes(":"));
    if (heading) {
      const headingText = cleanNoteLine(numberedHeading?.[1] || cleaned.replace(/^#{1,6}\s+/, "")).replace(/^(?:Page\s+\d+\s*:\s*)/i, "");
      if (headingText && !/^(?:Overview|Important Vocabulary|Vocabulary|Important Dates to Memorize)$/i.test(headingText)) {
        addCandidate(headingText, 12);
        headingTopics.push(headingText);
        if (numberedHeading) primaryHeadingTopics.push(headingText);
      }
    }
    const definedTerm = cleaned.match(/^([^:]{2,60}):\s+.+/);
    if (definedTerm) addCandidate(definedTerm[1], 8);
  });
  // Well-formed document headings make better broad-recall prompts than
  // vocabulary cards. Card topics are only a fallback for unstructured notes.
  if (!lessonTopics.length && !headingTopics.length) {
    cards.map(cardTopic).filter((topic) => topic && topic.split(/\s+/).length >= 2).forEach((topic) => addCandidate(topic, 4));
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const chosen = [];
  const tokenSet = (value) => new Set(value.toLowerCase().split(/\s+/));
  const overlap = (left, right) => {
    const a = tokenSet(left); const b = tokenSet(right);
    const shared = [...a].filter((word) => b.has(word)).length;
    return shared / Math.max(1, new Set([...a, ...b]).size);
  };
  const targetCount = Math.min(18, Math.max(2, Math.ceil(cards.length / 10)));
  const broadTopics = [...new Set(primaryHeadingTopics)].filter((topic) => !/Important Dates to Memorize/i.test(topic));
  if (broadTopics.length) {
    const desired = Math.min(targetCount, broadTopics.length);
    const anchors = [/old regime/i, /major causes/i, /national assembly/i, /bastille/i, /constitutional monarchy/i, /reign of terror/i, /directory/i, /napoleon/i, /major effects/i];
    anchors.forEach((pattern) => {
      const phrase = broadTopics.find((topic) => pattern.test(topic));
      if (phrase && chosen.length < desired && !chosen.includes(phrase)) chosen.push(phrase);
    });
    for (let index = 0; chosen.length < desired && index < desired * 2; index += 1) {
      const sourceIndex = desired === 1 ? 0 : Math.round(index * (broadTopics.length - 1) / Math.max(1, desired * 2 - 1));
      const phrase = broadTopics[sourceIndex];
      if (phrase && !chosen.includes(phrase)) chosen.push(phrase);
    }
  } else {
    for (const [key] of ranked) {
      if (chosen.length >= targetCount) break;
      const phrase = display.get(key);
      if (chosen.some((item) => overlap(item, phrase) > 0.55)) continue;
      chosen.push(phrase);
    }
  }
  const domain = /\b(?:cell|gene|dna|rna|protein|organism|species|ecosystem|chemical|reaction|molecule|energy|force|velocity|disease|anatomy|physiology)\b/i.test(notes) ? "science"
    : /\b(?:function|equation|derivative|integral|probability|theorem|graph|matrix|angle)\b/i.test(notes) ? "math"
      : /\b(?:novel|poem|character|theme|author|narrator|symbol|literature)\b/i.test(notes) ? "literature"
        : /\b(?:market|business|finance|revenue|cost|economy|supply|demand)\b/i.test(notes) ? "business" : "history";
  return chosen.map((topic) => {
    const normalized = topic.replace(/^(A|An|The)\b/, (article) => article.toLowerCase());
    let prompt = domain === "science" ? `Explain how ${normalized} works, including its mechanism, important variables, and a concrete example.`
      : domain === "math" ? `Explain how to recognize and solve a problem involving ${normalized}, then check the result with an example.`
        : domain === "literature" ? `Explain how ${normalized} develops in the work, using specific evidence and its effect on meaning.`
          : domain === "business" ? `Explain how ${normalized} works, which factors change it, and how it affects a real decision.`
            : `Explain ${normalized} in your own words, including its causes, key developments, and significance.`;
    if (/major causes/i.test(topic)) prompt = "Explain how economic crisis, social inequality, and Enlightenment ideas combined to cause the French Revolution.";
    else if (/major effects/i.test(topic)) prompt = "Explain the major political, social, economic, religious, and international effects of the French Revolution.";
    else if (/historical connections/i.test(topic)) prompt = "Explain the major cause-and-effect chain of the French Revolution from the Old Regime through Napoleon's coup.";
    return { id: makeLocalId("feynman"), prompt };
  });
}

function questionTypeLabel(type) {
  return ({ wh: "Who / What / Why / How", short_answer: "Short answer", true_false: "True / false", cloze: "Fill in the blank", mcq: "Multiple choice" })[type] || "Short answer";
}

function renderCustomQuestionDraft() {
  $("#question-draft-count").textContent = state.customQuestionDraft.length;
  $("#question-tab-count").textContent = state.customQuestionDraft.length;
  $("#question-draft-empty").hidden = state.customQuestionDraft.length > 0;
  $("#question-draft-list").innerHTML = state.customQuestionDraft.map((question, index) => `<div class="draft-card-row" data-question-draft="${index}"><span class="draft-card-number">${index + 1}</span><label>Question<select class="question-type-select" data-question-type="${index}">${["wh","short_answer","true_false","cloze","mcq"].map((type) => `<option value="${type}" ${question.type === type ? "selected" : ""}>${questionTypeLabel(type)}</option>`).join("")}</select><textarea data-question-prompt="${index}">${escapeHtml(question.prompt)}</textarea></label><label>Answer<textarea data-question-answer="${index}">${escapeHtml(question.answer)}</textarea></label><button type="button" class="remove-draft-card" data-remove-question="${index}" aria-label="Remove question ${index + 1}">×</button></div>`).join("");
  $$('[data-question-type]').forEach((input) => input.addEventListener("change", () => { state.customQuestionDraft[Number(input.dataset.questionType)].type = input.value; }));
  $$('[data-question-prompt]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionPrompt)].prompt = input.value; }));
  $$('[data-question-answer]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionAnswer)].answer = input.value; }));
  $$('[data-remove-question]').forEach((button) => button.addEventListener("click", () => { state.customQuestionDraft.splice(Number(button.dataset.removeQuestion), 1); renderCustomQuestionDraft(); updateCustomSaveButtons(); }));
  updateCustomSaveButtons();
}

function renderCustomFeynmanDraft() {
  $("#feynman-draft-count").textContent = state.customFeynmanDraft.length;
  $("#feynman-tab-count").textContent = state.customFeynmanDraft.length;
  $("#feynman-draft-list").innerHTML = state.customFeynmanDraft.map((item, index) => `<div class="feynman-draft-row"><span class="draft-card-number">${index + 1}</span><input data-feynman-prompt="${index}" value="${escapeHtml(item.prompt)}" aria-label="Feynman prompt ${index + 1}"><button type="button" class="remove-draft-card" data-remove-feynman="${index}" aria-label="Remove Feynman prompt ${index + 1}">×</button></div>`).join("");
  $$('[data-feynman-prompt]').forEach((input) => input.addEventListener("input", () => { state.customFeynmanDraft[Number(input.dataset.feynmanPrompt)].prompt = input.value; }));
  $$('[data-remove-feynman]').forEach((button) => button.addEventListener("click", () => { state.customFeynmanDraft.splice(Number(button.dataset.removeFeynman), 1); renderCustomFeynmanDraft(); updateCustomSaveButtons(); }));
  updateCustomSaveButtons();
}

function updateCustomSaveButtons() {
  const button = $("#generate-note-cards");
  // A study set may contain any combination of the three study item types.
  // One valid item in any single category is enough to save the set.
  button.disabled = false;
}

function hasAnyStudyItem() {
  const hasCard = state.customDraft.some((card) =>
    Boolean((String(card.front || "").trim() || card.frontImage) && (String(card.back || "").trim() || card.backImage))
  );
  const hasQuestion = state.customQuestionDraft.some((question) =>
    Boolean(String(question.prompt || "").trim() && String(question.answer || "").trim())
  );
  const hasFeynman = state.customFeynmanDraft.some((item) => Boolean(String(item.prompt || "").trim()));
  return hasCard || hasQuestion || hasFeynman;
}

function characteristicTemplate() {
  if (state.cardMakerMode !== "characteristics") return [];
  return state.customCharacteristicFields.map(({ name, front, back }) => ({ name: name.trim(), front, back }));
}

function setCardMakerMode(mode) {
  state.cardMakerMode = state.extraColumnsOnly || mode === "characteristics" ? "characteristics" : "basic";
  const basicModeButton = $('[data-card-maker-mode="basic"]');
  if (basicModeButton) basicModeButton.hidden = state.extraColumnsOnly;
  $$('[data-card-maker-mode]').forEach((button) => button.classList.toggle("active", button.dataset.cardMakerMode === state.cardMakerMode));
  $("#basic-card-maker").hidden = state.cardMakerMode !== "basic";
  $("#characteristic-card-maker").hidden = state.cardMakerMode !== "characteristics";
  if (state.cardMakerMode === "characteristics") renderCharacteristicCardMaker();
  renderCustomDraft();
}

function renderCharacteristicCardMaker() {
  const fields = state.customCharacteristicFields;
  $("#characteristic-field-count").textContent = `${fields.length} of 15 columns`;
  $("#add-characteristic-field").disabled = fields.length >= 15;
  $("#characteristic-field-list").innerHTML = fields.map((field, index) => `<div class="characteristic-field-row" data-characteristic-row="${field.id}"><input type="text" maxlength="40" value="${escapeHtml(field.name)}" data-characteristic-name="${field.id}" aria-label="Extra column ${index + 1} name"><input type="text" value="${escapeHtml(field.value)}" data-characteristic-value="${field.id}" aria-label="${escapeHtml(field.name || `Extra column ${index + 1}`)} value" placeholder="Enter information"><label class="characteristic-side-toggle" title="Show on front"><input type="checkbox" data-characteristic-front="${field.id}" ${field.front ? "checked" : ""} aria-label="Show ${escapeHtml(field.name)} on front"></label><label class="characteristic-side-toggle" title="Show on back"><input type="checkbox" data-characteristic-back="${field.id}" ${field.back ? "checked" : ""} aria-label="Show ${escapeHtml(field.name)} on back"></label><button type="button" class="remove-characteristic-field" data-remove-characteristic="${field.id}" aria-label="Remove ${escapeHtml(field.name)}" ${fields.length === 1 ? "disabled" : ""}>×</button></div>`).join("");
  $$('[data-characteristic-name]').forEach((input) => input.addEventListener("input", () => {
    const field = fields.find((item) => item.id === input.dataset.characteristicName);
    if (field) {
      const previousName = field.name;
      field.name = input.value;
      state.customDraft.forEach((card) => {
        if (!card.characteristics || previousName === input.value || !(previousName in card.characteristics)) return;
        card.characteristics[input.value] = card.characteristics[previousName];
        delete card.characteristics[previousName];
      });
    }
  }));
  $$('[data-characteristic-value]').forEach((input) => input.addEventListener("input", () => {
    const field = fields.find((item) => item.id === input.dataset.characteristicValue);
    if (field) field.value = input.value;
  }));
  $$('[data-characteristic-front]').forEach((input) => input.addEventListener("change", () => {
    const field = fields.find((item) => item.id === input.dataset.characteristicFront);
    if (field) field.front = input.checked;
  }));
  $$('[data-characteristic-back]').forEach((input) => input.addEventListener("change", () => {
    const field = fields.find((item) => item.id === input.dataset.characteristicBack);
    if (field) field.back = input.checked;
  }));
  $$('[data-remove-characteristic]').forEach((button) => button.addEventListener("click", () => {
    if (fields.length === 1) return;
    state.customCharacteristicFields = fields.filter((field) => field.id !== button.dataset.removeCharacteristic);
    if (state.customCharacteristicFields.length <= 2) {
      convertExtraColumnsToBasic();
      return;
    }
    renderCharacteristicCardMaker();
    renderCustomDraft();
  }));
}

function convertExtraColumnsToBasic() {
  const [frontColumn, backColumn] = state.customCharacteristicFields;
  state.customDraft = state.customDraft.map((card) => ({
    ...card,
    front: card.characteristics?.[frontColumn?.name] ?? card.front ?? "",
    back: card.characteristics?.[backColumn?.name] ?? card.back ?? "",
    characteristicCard: false,
    characteristics: undefined,
  }));
  state.extraColumnsOnly = false;
  state.customCharacteristicFields = defaultCharacteristicFields();
  setCardMakerMode("basic");
  showToast("Two columns remain, so this set is back to the standard Front and Back editor.");
}

function characteristicSideText(fields) {
  return fields.map((field) => fields.length === 1 ? field.value.trim() : `${field.name.trim()}: ${field.value.trim()}`).join("\n\n");
}

function addCharacteristicCard() {
  const namedFields = state.customCharacteristicFields.filter((field) => field.name.trim());
  const frontFields = namedFields.filter((field) => field.front);
  const backFields = namedFields.filter((field) => field.back);
  if (!frontFields.length || !backFields.length) { showToast("Choose at least one extra column for both the front and back."); return; }
  const usedFields = [...new Set([...frontFields, ...backFields])];
  const missing = usedFields.find((field) => !field.value.trim());
  if (missing) {
    $(`[data-characteristic-value="${missing.id}"]`)?.focus();
    showToast(`Add information for ${missing.name.trim()}.`);
    return;
  }
  state.customDraft.push({
    id: makeLocalId("card"),
    front: characteristicSideText(frontFields),
    back: characteristicSideText(backFields),
    manual: true,
    characteristicCard: true,
    characteristics: Object.fromEntries(namedFields.filter((field) => field.value.trim()).map((field) => [field.name.trim(), field.value.trim()])),
  });
  state.customCharacteristicFields.forEach((field) => { field.value = ""; });
  renderCharacteristicCardMaker();
  renderCustomDraft();
  $("[data-characteristic-value]")?.focus();
  showToast("Item added. The same extra columns are ready for the next one.");
}

function renderExtraColumnDraft(list) {
  const columns = state.customCharacteristicFields.filter((field) => field.name.trim());
  list.classList.add("extra-column-draft-list");
  list.innerHTML = `<div class="extra-column-table-wrap"><table class="extra-column-table"><thead><tr><th>#</th>${columns.map((field) => `<th>${escapeHtml(field.name)}</th>`).join("")}<th></th></tr></thead><tbody>${state.customDraft.map((card, index) => `<tr data-draft-card="${index}"><td>${index + 1}</td>${columns.map((field) => `<td><input type="text" value="${escapeHtml(card.characteristics?.[field.name] || "")}" data-extra-column-card="${index}" data-extra-column-name="${escapeHtml(field.name)}" aria-label="${escapeHtml(field.name)} for item ${index + 1}"></td>`).join("")}<td><button type="button" class="remove-draft-card" data-remove-draft="${index}" aria-label="Remove item ${index + 1}">×</button></td></tr>`).join("")}</tbody></table></div>`;
  $$('[data-extra-column-card]', list).forEach((input) => input.addEventListener("input", () => {
    const card = state.customDraft[Number(input.dataset.extraColumnCard)];
    if (!card) return;
    card.characteristicCard = true;
    card.characteristics = { ...(card.characteristics || {}), [input.dataset.extraColumnName]: input.value };
    const frontFields = columns.filter((field) => field.front).map((field) => ({ ...field, value: card.characteristics[field.name] || "" }));
    const backFields = columns.filter((field) => field.back).map((field) => ({ ...field, value: card.characteristics[field.name] || "" }));
    card.front = characteristicSideText(frontFields);
    card.back = characteristicSideText(backFields);
  }));
  $$('[data-remove-draft]', list).forEach((button) => button.addEventListener("click", () => {
    state.customDraft.splice(Number(button.dataset.removeDraft), 1);
    renderCustomDraft();
  }));
}

function renderCustomDraft() {
  const list = $("#draft-card-list");
  const empty = $("#draft-empty");
  $("#draft-card-count").textContent = state.customDraft.length;
  $("#flashcard-tab-count").textContent = state.customDraft.length;
  empty.hidden = state.customDraft.length > 0;
  updateCustomSaveButtons();
  if (state.cardMakerMode === "characteristics" && state.customDraft.some((card) => card.characteristicCard || card.characteristics)) {
    renderExtraColumnDraft(list);
    return;
  }
  list.classList.remove("extra-column-draft-list");
  list.innerHTML = state.customDraft.map((card, index) => `<div class="draft-card-row" data-draft-card="${index}"><span class="draft-card-number">${index + 1}</span><label>Front<textarea data-draft-front="${index}" placeholder="Text or pasted image">${escapeHtml(card.front || "")}</textarea><span class="card-image-editor">${card.frontImage ? `<img src="${card.frontImage}" alt="Front image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-draft-image="front" data-image-index="${index}">${card.frontImage ? "Replace image" : "Add image"}</button><button type="button" data-draw-draft="front" data-image-index="${index}">Draw</button><button type="button" data-math-draft="front" data-image-index="${index}">Math syntax</button><button type="button" data-code-draft="front" data-image-index="${index}">Code</button>${card.frontImage ? `<button type="button" data-remove-draft-image="front" data-image-index="${index}">Remove image</button>` : ""}</span></span></label><label>Back<textarea data-draft-back="${index}" placeholder="Text or pasted image">${escapeHtml(card.back || "")}</textarea><span class="card-image-editor">${card.backImage ? `<img src="${card.backImage}" alt="Back image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-draft-image="back" data-image-index="${index}">${card.backImage ? "Replace image" : "Add image"}</button><button type="button" data-draw-draft="back" data-image-index="${index}">Draw</button><button type="button" data-math-draft="back" data-image-index="${index}">Math syntax</button><button type="button" data-code-draft="back" data-image-index="${index}">Code</button>${card.backImage ? `<button type="button" data-remove-draft-image="back" data-image-index="${index}">Remove image</button>` : ""}</span></span></label><button type="button" class="remove-draft-card" data-remove-draft="${index}" aria-label="Remove card ${index + 1}">×</button></div>`).join("");
  $$('[data-draft-front]', list).forEach((input) => input.addEventListener("input", () => { state.customDraft[Number(input.dataset.draftFront)].front = input.value; }));
  $$('[data-draft-back]', list).forEach((input) => input.addEventListener("input", () => { state.customDraft[Number(input.dataset.draftBack)].back = input.value; }));
  $$('[data-draft-front]', list).forEach((input) => input.addEventListener("paste", (event) => handleCardPaste(event, { kind: "draft", side: "front", index: Number(input.dataset.draftFront) })));
  $$('[data-draft-back]', list).forEach((input) => input.addEventListener("paste", (event) => handleCardPaste(event, { kind: "draft", side: "back", index: Number(input.dataset.draftBack) })));
  $$('[data-choose-draft-image]', list).forEach((button) => button.addEventListener("click", () => {
    state.pendingCardImageTarget = { kind: "draft", side: button.dataset.chooseDraftImage, index: Number(button.dataset.imageIndex) };
    $("#flashcard-image-file").click();
  }));
  $$('[data-draw-draft]', list).forEach((button) => button.addEventListener("click", () => openDrawingTool({ kind: "draft", side: button.dataset.drawDraft, index: Number(button.dataset.imageIndex) })));
  $$('[data-math-draft]', list).forEach((button) => button.addEventListener("click", () => openMathTool({ kind: "draft", side: button.dataset.mathDraft, index: Number(button.dataset.imageIndex) })));
  $$('[data-code-draft]', list).forEach((button) => button.addEventListener("click", () => openCodeTool({ kind: "draft", side: button.dataset.codeDraft, index: Number(button.dataset.imageIndex) })));
  $$('[data-remove-draft-image]', list).forEach((button) => button.addEventListener("click", () => {
    confirmImageRemoval(button, () => { const card = state.customDraft[Number(button.dataset.imageIndex)]; if (card) card[button.dataset.removeDraftImage === "front" ? "frontImage" : "backImage"] = ""; renderCustomDraft(); });
  }));
  $$('[data-remove-draft]', list).forEach((button) => button.addEventListener("click", () => {
    state.customDraft.splice(Number(button.dataset.removeDraft), 1);
    renderCustomDraft();
  }));
}

function selectCreateContentTab(tabName) {
  $$('[data-create-tab]').forEach((button) => {
    const active = button.dataset.createTab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-create-panel]').forEach((panel) => { panel.hidden = panel.dataset.createPanel !== tabName; });
}

function resetCustomDraft() {
  state.customDraft = [];
  state.customQuestionDraft = [];
  state.customFeynmanDraft = [];
  state.customImportSource = null;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = null;
  state.appendNotesToExistingSet = false;
  state.notesHiddenAfterUpdate = false;
  state.manualFrontImage = "";
  state.manualBackImage = "";
  state.extraColumnsOnly = false;
  state.customCharacteristicFields = defaultCharacteristicFields();
  state.pendingCardImageTarget = null;
  $("#custom-deck-name").value = "";
  setNotesContent();
  $("#notes-input").dataset.placeholder = "Paste class notes here. Bold text, highlights, headings, and bullet lists will be preserved.";
  $("#manual-card-front").value = "";
  $("#manual-card-back").value = "";
  renderManualImagePreview("front");
  renderManualImagePreview("back");
  setCardMakerMode("basic");
  $("#manual-feynman-topic").value = "";
  $("#anki-notes-file").value = "";
  $("#anki-import-status").textContent = "Supports APKG, UTF-8 TXT, CSV, and TSV files.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Generate and save study set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  selectCreateContentTab("flashcards");
}

function personalDeckMarkup(deck, folders) {
  const starred = isStudyItemStarred(`deck:${deck.id}`);
  return `<article class="custom-deck-item personal-deck-item draggable-study-set ${starred ? "starred-study-item" : ""}" draggable="true" data-drag-deck="${deck.id}"><button type="button" class="study-item-star" data-toggle-study-star="deck:${deck.id}" aria-pressed="${starred}" aria-label="${starred ? "Unstar" : "Star"} ${escapeHtml(deck.name)}">${starred ? "★" : "☆"}</button><button type="button" class="deck-wrench" data-edit-custom="${deck.id}" aria-label="Edit ${escapeHtml(deck.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5l-7.5 7.5a2 2 0 1 0 2.8 2.8l7.5-7.5a4 4 0 0 0 5-5L18 8.6 15.6 6.2l2.1-2.1Z" /></svg></button><div class="built-in-deck-label">Personal set</div><h3>${escapeHtml(deck.name)}</h3><p>${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts</p><div class="custom-deck-actions"><button type="button" data-study-custom="${deck.id}">Study</button><button type="button" data-edit-custom="${deck.id}">Edit</button><button type="button" data-duplicate-study-set="${deck.id}">Duplicate</button><button type="button" class="delete-custom-deck" data-delete-custom="${deck.id}">Delete</button></div></article>`;
}

function builtInAddedDeckMarkup(collection, folders) {
  const starred = isStudyItemStarred(`deck:${collection.id}`);
  const summary = lazyBuiltInSources[collection.id];
  const unitCount = collection.units.length || summary?.unitCount || 0;
  const cardCount = collection.units.length ? collection.units.reduce((total, unit) => total + unit.cards.length, 0) : summary?.cardCount || 0;
  const feynmanCount = collection.units.length ? collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0) : summary?.feynmanCount || 0;
  return `<article class="custom-deck-item built-in-deck-item added-built-in-deck draggable-study-set ${starred ? "starred-study-item" : ""}" draggable="true" data-drag-deck="${collection.id}"><button type="button" class="study-item-star" data-toggle-study-star="deck:${collection.id}" aria-pressed="${starred}" aria-label="${starred ? "Unstar" : "Star"} ${escapeHtml(collection.name)}">${starred ? "★" : "☆"}</button><div class="built-in-deck-label">Built-in · ${unitCount} ${collection.unitLabel || "units"}</div><h3>${escapeHtml(collection.name)}</h3><p>${cardCount} cards · ${feynmanCount} Feynman topics</p><div class="custom-deck-actions"><button type="button" data-study-built-in-collection="${collection.id}">Study</button><button type="button" data-edit-built-in-collection="${collection.id}">Edit</button><button type="button" data-duplicate-study-set="${collection.id}">Duplicate</button><button type="button" class="remove-built-in-deck" data-delete-built-in-collection="${collection.id}">Delete</button></div></article>`;
}

function renderCustomDecks() {
  const allDecks = loadCustomDecks();
  const allAddedCollections = builtInFlashcardCollections.filter((collection) => isFlashcardCollectionAdded(collection.id)).map((collection) => effectiveBuiltInCollection(collection));
  const studyQuery = ($("#my-study-sets-search")?.value || "").trim().toLowerCase();
  const matchesStudyQuery = (deck) => !studyQuery || `${deck.name} ${deck.description || ""}`.toLowerCase().includes(studyQuery);
  const decks = allDecks.filter(matchesStudyQuery);
  const addedCollections = allAddedCollections.filter(matchesStudyQuery);
  const validIds = new Set([...allDecks.map((deck) => deck.id), ...allAddedCollections.map((collection) => collection.id)]);
  const folders = loadStudyFolders().map((folder) => ({ ...folder, deckIds: [...new Set(folder.deckIds)].filter((id) => validIds.has(id)) })).sort((a, b) => Number(isStudyItemStarred(`folder:${b.id}`)) - Number(isStudyItemStarred(`folder:${a.id}`)));
  storeStudyFolders(folders);
  const filedIds = new Set(folders.flatMap((folder) => folder.deckIds));
  $("#saved-deck-count").textContent = allDecks.length;
  $("#flashcards-deck-count").textContent = allDecks.length + allAddedCollections.length;
  const creatorMarkup = decks.length ? decks.map((deck) => `<article class="custom-deck-item"><h3>${escapeHtml(deck.name)}</h3><p>${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts</p><div class="custom-deck-actions"><button type="button" data-study-custom="${deck.id}">Study</button><button type="button" data-edit-custom="${deck.id}">Edit</button><button type="button" data-duplicate-study-set="${deck.id}">Duplicate</button><button type="button" class="delete-custom-deck" data-delete-custom="${deck.id}">Delete</button></div></article>`).join("") : '<div class="custom-deck-empty">Your saved study sets will appear here.</div>';
  const deckById = new Map([...decks.map((deck) => [deck.id, { type: "personal", value: deck }]), ...addedCollections.map((collection) => [collection.id, { type: "built-in", value: collection }])]);
  const cardMarkup = (record) => record.type === "personal" ? personalDeckMarkup(record.value, folders) : builtInAddedDeckMarkup(record.value, folders);
  const folderMarkup = folders.map((folder) => {
    const records = folder.deckIds.map((id) => deckById.get(id)).filter(Boolean).sort((a, b) => Number(isStudyItemStarred(`deck:${b.value.id}`)) - Number(isStudyItemStarred(`deck:${a.value.id}`)));
    if (studyQuery && !folder.name.toLowerCase().includes(studyQuery) && !records.length) return "";
    const starred = isStudyItemStarred(`folder:${folder.id}`);
    return `<section class="study-folder ${folder.expanded ? "expanded" : ""} ${starred ? "starred-study-item" : ""}" data-drop-folder="${folder.id}" style="--folder-color:${folder.color}"><div class="study-folder-tab"><button type="button" class="study-folder-toggle" data-toggle-folder="${folder.id}" aria-expanded="${folder.expanded}"><span class="folder-shape-icon" aria-hidden="true"></span><span><span class="section-label">Folder</span><strong>${escapeHtml(folder.name)}</strong><small>${records.length} ${records.length === 1 ? "study set" : "study sets"} · drop sets here</small></span><span class="folder-chevron" aria-hidden="true">⌄</span></button><div class="study-folder-actions"><button type="button" class="study-item-star folder-star" data-toggle-study-star="folder:${folder.id}" aria-pressed="${starred}" aria-label="${starred ? "Unstar" : "Star"} ${escapeHtml(folder.name)}">${starred ? "★" : "☆"}</button><button type="button" class="button primary-button" data-study-folder="${folder.id}" ${records.length ? "" : "disabled"}>Study folder</button><label class="folder-color-control" title="Change folder color"><input type="color" value="${folder.color}" data-folder-color="${folder.id}" aria-label="Change ${escapeHtml(folder.name)} color"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1.3a2.2 2.2 0 0 0 1.4-3.9 1.8 1.8 0 0 1 1.1-3.2H18a3 3 0 0 0 3-3C21 6.5 17 3 12 3Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.8" r="1"/><circle cx="14" cy="6.8" r="1"/><circle cx="17" cy="10" r="1"/></svg></label><button type="button" class="button secondary-button" data-rename-folder="${folder.id}">Rename</button><button type="button" class="button danger-text-button" data-delete-folder="${folder.id}">Delete</button></div></div><div class="study-folder-contents" ${folder.expanded ? "" : "hidden"}><div class="custom-deck-list flashcards-deck-grid">${records.length ? records.map(cardMarkup).join("") : '<div class="custom-deck-empty">Drag study sets into this folder.</div>'}</div></div></section>`;
  }).join("");
  const unfiledRecords = [...decks.filter((deck) => !filedIds.has(deck.id)).map((deck) => ({ type: "personal", value: deck })), ...addedCollections.filter((collection) => !filedIds.has(collection.id)).map((collection) => ({ type: "built-in", value: collection }))].sort((a, b) => Number(isStudyItemStarred(`deck:${b.value.id}`)) - Number(isStudyItemStarred(`deck:${a.value.id}`)));
  $("#custom-deck-list").innerHTML = creatorMarkup;
  $("#study-folder-list").innerHTML = folderMarkup;
  $("#flashcards-deck-list").innerHTML = unfiledRecords.length ? unfiledRecords.map(cardMarkup).join("") : (folders.length ? '<div class="custom-deck-empty">All of your study sets are organized into folders.</div>' : '<div class="custom-deck-empty">Add flashcards from the library below, or create your own study set.</div>');
  fixVisibleCountGrammar($("#custom-deck-list"));
  fixVisibleCountGrammar($("#study-folder-list"));
  fixVisibleCountGrammar($("#flashcards-deck-list"));
  $$('[data-study-custom]').forEach((button) => button.addEventListener("click", () => openCustomStudyOptions(button.dataset.studyCustom)));
  $$('[data-edit-custom]').forEach((button) => button.addEventListener("click", () => { showAppView("create"); editCustomDeck(button.dataset.editCustom); }));
  $$('[data-duplicate-study-set]').forEach((button) => button.addEventListener("click", () => duplicateStudySet(button.dataset.duplicateStudySet)));
  $$('[data-delete-custom]').forEach((button) => button.addEventListener("click", () => deleteCustomDeck(button.dataset.deleteCustom)));
  $$('[data-study-built-in-collection]').forEach((button) => button.addEventListener("click", () => openCustomStudyOptions(button.dataset.studyBuiltInCollection)));
  $$('[data-edit-built-in-collection]').forEach((button) => button.addEventListener("click", () => { showAppView("create"); editBuiltInCollection(button.dataset.editBuiltInCollection); }));
  $$('[data-delete-built-in-collection]').forEach((button) => button.addEventListener("click", () => deleteBuiltInCollection(button.dataset.deleteBuiltInCollection)));
  $$('[data-toggle-study-star]').forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); toggleStudyItemStar(button.dataset.toggleStudyStar); }));
  wireStudySetDragAndDrop();
  $$('[data-study-folder]').forEach((button) => button.addEventListener("click", () => openCustomStudyOptions(`folder:${button.dataset.studyFolder}`)));
  $$('[data-toggle-folder]').forEach((button) => button.addEventListener("click", () => toggleStudyFolder(button.dataset.toggleFolder)));
  $$('[data-folder-color]').forEach((input) => input.addEventListener("change", () => setStudyFolderColor(input.dataset.folderColor, input.value)));
  $$('[data-rename-folder]').forEach((button) => button.addEventListener("click", () => renameStudyFolder(button.dataset.renameFolder)));
  $$('[data-delete-folder]').forEach((button) => button.addEventListener("click", () => deleteStudyFolder(button.dataset.deleteFolder)));
  renderBuiltInDecks();
}

function renderBuiltInDecks() {
  const list = $("#built-in-deck-list");
  if (!list) return;
  $("#built-in-deck-count").textContent = `${builtInFlashcardCollections.length} ${builtInFlashcardCollections.length === 1 ? "deck" : "decks"}`;
  const returnAllButton = $("#return-all-built-in-decks");
  if (returnAllButton) returnAllButton.disabled = addedFlashcardCollectionIds().length === 0;
  const query = ($("#built-in-study-search")?.value || "").trim().toLowerCase();
  const apOnly = query === "ap" || query.startsWith("ap ");
  const matches = builtInFlashcardCollections.filter((collection) => {
    const isApCourse = collection.catalogLabel === "AP course" || /^AP\b/i.test(collection.name);
    const searchable = `${collection.name} ${collection.catalogLabel || ""} ${collection.description || ""} ${collection.units.map((unit) => unit.shortName || unit.name).join(" ")}`.toLowerCase();
    return (!apOnly || isApCourse) && searchable.includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / STUDY_DECKS_PER_PAGE));
  state.studyCatalogPage = Math.min(state.studyCatalogPage, pageCount - 1);
  const pageMatches = matches.slice(state.studyCatalogPage * STUDY_DECKS_PER_PAGE, (state.studyCatalogPage + 1) * STUDY_DECKS_PER_PAGE);
  list.innerHTML = pageMatches.map((collection) => {
    const added = isFlashcardCollectionAdded(collection.id);
    const lazySummary = lazyBuiltInSources[collection.id];
    const cardCount = collection.units.length ? collection.units.reduce((total, unit) => total + unit.cards.length, 0) : lazySummary?.cardCount || 0;
    const feynmanCount = collection.units.length ? collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0) : lazySummary?.feynmanCount || 0;
    const topicSummary = feynmanCount ? `${cardCount} study cards · ${feynmanCount} Feynman topics.` : `${cardCount} study cards.`;
    const unitCount = collection.units.length || lazySummary?.unitCount || 0;
    return `<article class="custom-deck-item built-in-deck-item flashcard-catalog-item"><div class="flashcard-catalog-icon" aria-hidden="true">⌖</div><div class="flashcard-catalog-copy"><div class="built-in-deck-label">${escapeHtml(collection.catalogLabel || "AP course")} · ${unitCount} ${escapeHtml(collection.unitLabel || "units")}</div><h3>${escapeHtml(collection.name)}</h3><p>${topicSummary} ${escapeHtml(collection.description)}</p></div><button type="button" class="button course-add" data-add-flashcard-collection="${collection.id}" ${added ? "disabled" : ""}>${added ? "Added" : "Add study deck"}</button></article>`;
  }).join("") || '<div class="custom-deck-empty">No built-in study decks match that search.</div>';
  $$('[data-add-flashcard-collection]').forEach((button) => button.addEventListener("click", () => addFlashcardCollection(button.dataset.addFlashcardCollection)));
  renderLibraryPagination("#study-catalog-pagination", state.studyCatalogPage, matches.length, STUDY_DECKS_PER_PAGE, (page) => {
    state.studyCatalogPage = page;
    renderBuiltInDecks();
  });
}

function addedFlashcardCollectionIds() {
  try { return JSON.parse(localStorage.getItem("study-desk-added-flashcard-collections") || "[]"); }
  catch { return []; }
}

function loadBuiltInCollectionOverrides() {
  try { return JSON.parse(localStorage.getItem("study-desk-built-in-collection-overrides") || "{}"); }
  catch { return {}; }
}

function storeBuiltInCollectionOverrides(overrides) {
  localStorage.setItem("study-desk-built-in-collection-overrides", JSON.stringify(overrides));
}

function effectiveBuiltInCollection(collection) {
  const override = loadBuiltInCollectionOverrides()[collection.id];
  if (!override) return collection;
  const overriddenUnits = override.units || collection.units;
  const overriddenIds = new Set(overriddenUnits.map((unit) => unit.id));
  const newlyAddedUnits = collection.units.filter((unit) => !overriddenIds.has(unit.id));
  return { ...collection, name: override.name || collection.name, units: [...overriddenUnits, ...newlyAddedUnits], customized: true };
}

function getBuiltInCollection(collectionId) {
  const collection = builtInFlashcardCollections.find((item) => item.id === collectionId);
  return collection ? effectiveBuiltInCollection(collection) : null;
}

function isFlashcardCollectionAdded(collectionId) {
  return addedFlashcardCollectionIds().includes(collectionId);
}

async function addFlashcardCollection(collectionId) {
  const catalogButton = $(`[data-add-flashcard-collection="${collectionId}"]`);
  if (catalogButton && lazyBuiltInSources[collectionId]) { catalogButton.disabled = true; catalogButton.textContent = "Loading…"; }
  await ensureBuiltInCollectionLoaded(collectionId);
  const added = new Set(addedFlashcardCollectionIds());
  added.add(collectionId);
  localStorage.setItem("study-desk-added-flashcard-collections", JSON.stringify([...added]));
  renderCustomDecks();
  const collection = getBuiltInCollection(collectionId);
  showToast(`${collection?.name || "Flashcards"} added to My study sets.`);
}

function removeFlashcardCollection(collectionId, event) {
  event?.stopPropagation();
  localStorage.setItem("study-desk-added-flashcard-collections", JSON.stringify(addedFlashcardCollectionIds().filter((id) => id !== collectionId)));
  removeDecksFromFolders([collectionId]);
  renderCustomDecks();
  const collection = getBuiltInCollection(collectionId);
  showToast(`${collection?.name || "Flashcards"} removed from My study sets.`);
}

const geographyFieldOptions = [
  { id: "country", label: "Country" },
  { id: "capital", label: "Capital" },
  { id: "largestCity", label: "Largest city" },
  { id: "currency", label: "Currency" },
  { id: "continent", label: "Continent" },
  { id: "subregion", label: "Subregion" },
  { id: "languages", label: "Languages" },
  { id: "population", label: "Population" },
  { id: "area", label: "Land area" },
  { id: "countryCodes", label: "Country codes" },
  { id: "callingCode", label: "Calling code" },
  { id: "borders", label: "Neighbors" },
  { id: "flag", label: "Flag", visual: true },
  { id: "outline", label: "Outline", visual: true },
];

const usStateFieldOptions = [
  { id: "state", label: "State" },
  { id: "capital", label: "Capital" },
  { id: "largestCity", label: "Largest city" },
  { id: "abbreviation", label: "Abbreviation" },
  { id: "admission", label: "Admission date" },
  { id: "region", label: "Census region" },
  { id: "population", label: "2025 population" },
  { id: "flag", label: "State flag", visual: true },
  { id: "outline", label: "State outline", visual: true },
];

function geographyCurrencyText(country) {
  return (country.currencies || []).map((currency) => `${currency.code} — ${currency.name}`).join(", ") || "No official currency";
}

function geographyCardSide(country, fields) {
  const textFields = fields.filter((field) => !["flag", "outline"].includes(field));
  const values = {
    country: country.country,
    capital: country.capital,
    largestCity: country.largestCity,
    currency: geographyCurrencyText(country),
    continent: country.continent,
    subregion: country.subregion,
    languages: (country.languages || []).join(", ") || "No official language listed",
    population: country.population ? Number(country.population).toLocaleString() : "Not available",
    area: country.area ? `${Number(country.area).toLocaleString()} km²` : "Not available",
    countryCodes: country.countryCodes,
    callingCode: country.callingCode,
    borders: (country.borders || []).join(", ") || "No land borders",
  };
  const labels = { country: "Country", capital: "Capital", largestCity: "Largest city", currency: "Currency", continent: "Continent", subregion: "Subregion", languages: "Official languages", population: "Population", area: "Land area", countryCodes: "Country codes", callingCode: "Calling code", borders: "Neighboring countries" };
  const text = textFields.map((field) => textFields.length === 1 ? values[field] : `${labels[field]}: ${values[field]}`).join("\n\n");
  const visual = fields.includes("flag") ? country.flag : fields.includes("outline") ? country.outline : "";
  return { text, image: visual };
}

function geographyCardsForUnits(units) {
  if (!state.geographyFrontFields.length || !state.geographyBackFields.length) return [];
  const frontKey = state.geographyFrontFields.join("-");
  const backKey = state.geographyBackFields.join("-");
  return units.flatMap((unit) => unit.countries || []).map((country) => {
    const front = geographyCardSide(country, state.geographyFrontFields);
    const back = geographyCardSide(country, state.geographyBackFields);
    return {
      id: `geo-${country.id}-${frontKey}--${backKey}`,
      front: front.text,
      back: back.text,
      frontImage: front.image,
      backImage: back.image,
    };
  });
}

function usStateCardSide(item, fields) {
  const textFields = fields.filter((field) => !["flag", "outline"].includes(field));
  const values = {
    state: item.state,
    capital: item.capital,
    largestCity: item.largestCity,
    abbreviation: item.abbreviation,
    admission: item.admission,
    region: item.region,
    population: Number(item.population).toLocaleString(),
  };
  const labels = Object.fromEntries(usStateFieldOptions.map((field) => [field.id, field.label]));
  const text = textFields.map((field) => textFields.length === 1 ? values[field] : `${labels[field]}: ${values[field]}`).join("\n\n");
  const visual = fields.includes("flag") ? item.flag : fields.includes("outline") ? item.outline : "";
  return { text, image: visual };
}

function usStateCardsForUnits(units) {
  if (!state.usStateFrontFields.length || !state.usStateBackFields.length) return [];
  const frontKey = state.usStateFrontFields.join("-");
  const backKey = state.usStateBackFields.join("-");
  return units.flatMap((unit) => unit.states || []).map((item) => {
    const front = usStateCardSide(item, state.usStateFrontFields);
    const back = usStateCardSide(item, state.usStateBackFields);
    return {
      id: `us-state-${item.id}-${frontKey}--${backKey}`,
      front: front.text,
      back: back.text,
      frontImage: front.image,
      backImage: back.image,
    };
  });
}

function collectionStudyDeck(collection) {
  const selectedIds = state.selectedBuiltInCollectionId === collection.id ? state.selectedBuiltInUnitIds : collection.units.map((unit) => unit.id);
  const selectedUnits = collection.units.filter((unit) => selectedIds.includes(unit.id));
  const supportsLevelFilter = Boolean(collection.supportsAbFilter || collection.supportsLevelFilter);
  const baseOnly = Boolean(supportsLevelFilter && state.calculusAbOnly);
  const extensionLevel = collection.extensionLevel || "BC";
  const baseLabel = collection.baseLevel || "AB";
  const suffix = baseOnly ? ` · ${baseLabel}` : collection.supportsLevelFilter ? ` · ${collection.extensionDisplayLabel || extensionLevel}` : selectedUnits.length === 1 ? ` · ${selectedUnits[0].shortName}` : !selectedUnits.length || selectedUnits.length === collection.units.length ? "" : ` · ${selectedUnits.length} units`;
  const allowed = (item) => !baseOnly || item.courseLevel !== extensionLevel;
  const cards = collection.geographyBank ? geographyCardsForUnits(selectedUnits) : collection.usStateBank ? usStateCardsForUnits(selectedUnits) : selectedUnits.flatMap((unit) => unit.cards.filter(allowed));
  return { id: collection.id, name: `${collection.name}${suffix}`, builtIn: true, geographyBank: Boolean(collection.geographyBank), usStateBank: Boolean(collection.usStateBank), cards, questions: selectedUnits.flatMap((unit) => (unit.questions || []).filter(allowed)), feynmanPrompts: selectedUnits.flatMap((unit) => (unit.feynmanPrompts || []).filter(allowed)) };
}

function findStudyDeck(deckId) {
  if (deckId.startsWith("folder:")) {
    const folder = loadStudyFolders().find((item) => item.id === deckId.slice(7));
    if (!folder) return null;
    const memberDecks = folder.deckIds.map((id) => findStudyDeck(id)).filter(Boolean);
    return {
      id: deckId,
      name: folder.name,
      folderStudy: true,
      builtIn: false,
      cards: memberDecks.flatMap((deck) => deck.cards.map((card) => ({ ...card, sourceDeckId: deck.id }))),
      questions: memberDecks.flatMap((deck) => (deck.questions || []).map((question) => ({ ...question, sourceDeckId: deck.id }))),
      feynmanPrompts: memberDecks.flatMap((deck) => (deck.feynmanPrompts || []).map((prompt) => ({ ...prompt, sourceDeckId: deck.id }))),
    };
  }
  const personalDeck = loadCustomDecks().find((deck) => deck.id === deckId);
  if (personalDeck) return personalDeck;
  const collection = getBuiltInCollection(deckId);
  if (collection) return collectionStudyDeck(collection);
  return builtInFlashcardDecks.find((deck) => deck.id === deckId);
}

function duplicateStudySet(deckId) {
  const personal = loadCustomDecks().find((deck) => deck.id === deckId);
  const collection = personal ? null : getBuiltInCollection(deckId);
  const source = personal || (collection ? {
    name: collection.name,
    cards: collection.units.flatMap((unit) => unit.cards || []),
    questions: collection.units.flatMap((unit) => unit.questions || []),
    feynmanPrompts: collection.units.flatMap((unit) => unit.feynmanPrompts || []),
    characteristicTemplate: [],
  } : null);
  if (!source) return;
  const decks = loadCustomDecks();
  const duplicateId = makeLocalId("deck");
  const duplicateItems = (items, prefix, transform = (item) => item) => (items || []).map((item) => transform({
    ...JSON.parse(JSON.stringify(item)), id: makeLocalId(prefix),
  }));
  const duplicate = {
    id: duplicateId,
    name: copyLabel(source.name, new Set(decks.map((deck) => String(deck.name || "").toLowerCase()))),
    cards: duplicateItems(source.cards, "card", (card) => {
      delete card.importedSchedule;
      delete card.importedReviews;
      return card;
    }),
    questions: duplicateItems(source.questions, "question"),
    feynmanPrompts: duplicateItems(source.feynmanPrompts, "feynman"),
    sourceNotes: personal?.sourceNotes || "",
    sourceNotesHtml: personal?.sourceNotesHtml || "",
    sourceImport: null,
    generatorVersion: personal?.generatorVersion || NOTES_GENERATOR_VERSION,
    characteristicTemplate: JSON.parse(JSON.stringify(source.characteristicTemplate || [])),
    updatedAt: Date.now(),
  };
  decks.unshift(duplicate);
  if (!storeCustomDecks(decks)) return;
  const folders = loadStudyFolders();
  const sourceFolder = folders.find((folder) => folder.deckIds.includes(deckId));
  if (sourceFolder) {
    sourceFolder.deckIds.splice(sourceFolder.deckIds.indexOf(deckId) + 1, 0, duplicateId);
    storeStudyFolders(folders);
  }
  renderCustomDecks();
  showToast(`${duplicate.name} created with fresh study progress.`);
}

function saveCustomDeck({ resetAfterSave = true, notify = true } = {}) {
  const name = $("#custom-deck-name").value.trim();
  const cards = state.customDraft.map((card) => ({ ...card, front: String(card.front || "").trim(), back: String(card.back || "").trim() })).filter((card) => (card.front || card.frontImage) && (card.back || card.backImage));
  const questions = state.customQuestionDraft.map((question) => ({ ...question, prompt: question.prompt.trim(), answer: question.answer.trim() })).filter((question) => question.prompt && question.answer);
  const feynmanPrompts = state.customFeynmanDraft.map((item) => ({ ...item, prompt: item.prompt.trim() })).filter((item) => item.prompt);
  if (!name) { $("#custom-deck-name").focus(); showToast("Give this deck a name first."); return null; }
  if (!cards.length && !questions.length && !feynmanPrompts.length) { showToast("Add at least one card, question, or Feynman prompt."); return null; }
  const decks = loadCustomDecks();
  const existingIndex = decks.findIndex((deck) => deck.id === state.editingCustomDeckId);
  const existingDeck = existingIndex >= 0 ? decks[existingIndex] : null;
  const visibleSourceNotes = notesPlainText();
  const visibleSourceNotesHtml = notesRichHtml();
  const deck = { id: state.editingCustomDeckId || makeLocalId("deck"), name, cards, questions, feynmanPrompts, characteristicTemplate: characteristicTemplate(), sourceNotes: state.notesHiddenAfterUpdate && !visibleSourceNotes ? existingDeck?.sourceNotes || "" : visibleSourceNotes, sourceNotesHtml: state.notesHiddenAfterUpdate && !visibleSourceNotesHtml ? existingDeck?.sourceNotesHtml || "" : visibleSourceNotesHtml, sourceImport: state.customImportSource, generatorVersion: NOTES_GENERATOR_VERSION, updatedAt: Date.now() };
  if (existingIndex >= 0) decks.splice(existingIndex, 1, deck); else decks.unshift(deck);
  if (!storeCustomDecks(decks)) return null;
  state.editingCustomDeckId = deck.id;
  renderCustomDecks();
  if (notify) showToast(`${deck.name} updated — ${cards.length} cards, ${questions.length} questions, and ${feynmanPrompts.length} Feynman prompts.`);
  if (resetAfterSave) resetCustomDraft();
  else {
    $("#generate-note-cards").disabled = false;
    $("#generate-note-cards").textContent = "Update set";
  }
  return deck;
}

function saveBuiltInCollectionOverride({ notify = true } = {}) {
  const collectionId = state.editingBuiltInCollectionId;
  const original = builtInFlashcardCollections.find((item) => item.id === collectionId);
  if (!original) return null;
  const name = $("#custom-deck-name").value.trim() || original.name;
  const fallbackUnitId = original.units[0]?.id;
  const cleanCards = state.customDraft.map((card) => ({ ...card, front: String(card.front || "").trim(), back: String(card.back || "").trim(), builtInUnitId: card.builtInUnitId || fallbackUnitId })).filter((card) => (card.front || card.frontImage) && (card.back || card.backImage));
  const cleanQuestions = state.customQuestionDraft.map((question) => ({ ...question, prompt: question.prompt.trim(), answer: question.answer.trim(), builtInUnitId: question.builtInUnitId || fallbackUnitId })).filter((question) => question.prompt && question.answer);
  const cleanPrompts = state.customFeynmanDraft.map((item) => ({ ...item, prompt: item.prompt.trim(), builtInUnitId: item.builtInUnitId || fallbackUnitId })).filter((item) => item.prompt);
  if (!cleanCards.length && !cleanQuestions.length && !cleanPrompts.length) { showToast("Keep at least one card, question, or Feynman prompt."); return null; }
  const units = original.units.map((unit) => ({
    ...unit,
    cards: cleanCards.filter((card) => card.builtInUnitId === unit.id),
    questions: cleanQuestions.filter((question) => question.builtInUnitId === unit.id),
    feynmanPrompts: cleanPrompts.filter((item) => item.builtInUnitId === unit.id),
  }));
  const overrides = loadBuiltInCollectionOverrides();
  overrides[collectionId] = { name, units, updatedAt: Date.now() };
  storeBuiltInCollectionOverrides(overrides);
  renderCustomDecks();
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  if (notify) showToast(`${name} updated — ${cleanCards.length} cards and ${cleanPrompts.length} Feynman prompts.`);
  return getBuiltInCollection(collectionId);
}

function saveGeneratedCustomDeckInPlace() {
  const name = $("#custom-deck-name").value.trim();
  const decks = loadCustomDecks();
  const existingIndex = decks.findIndex((deck) => deck.id === state.editingCustomDeckId);
  const deck = {
    id: state.editingCustomDeckId || makeLocalId("deck"),
    name,
    cards: state.customDraft.map((card) => ({ ...card })),
    questions: state.customQuestionDraft.map((question) => ({ ...question })),
    feynmanPrompts: state.customFeynmanDraft.map((item) => ({ ...item })),
    characteristicTemplate: characteristicTemplate(),
    sourceNotes: notesPlainText(),
    sourceNotesHtml: notesRichHtml(),
    sourceImport: state.customImportSource,
    generatorVersion: NOTES_GENERATOR_VERSION,
    updatedAt: Date.now(),
  };
  if (existingIndex >= 0) decks.splice(existingIndex, 1, deck); else decks.unshift(deck);
  if (!storeCustomDecks(decks)) return null;
  const schedules = ankiSchedules();
  let reviewLogs = [];
  try { reviewLogs = JSON.parse(localStorage.getItem(ANKI_REVIEW_LOG_KEY) || "[]"); } catch { reviewLogs = []; }
  deck.cards.forEach((card) => {
    if (!card.importedSchedule) return;
    const key = customAnkiKey(deck.id, card.id);
    const imported = card.importedSchedule;
    schedules[key] = { ...imported, lastReviewed: card.importedReviews?.at(-1)?.review || null, lastRating: ({ 1: "again", 2: "hard", 3: "good", 4: "easy" })[card.importedReviews?.at(-1)?.rating] || null };
    (card.importedReviews || []).forEach((log) => reviewLogs.push({ id: `${log.review}-${key}`, cardKey: key, rating: ({ 1: "again", 2: "hard", 3: "good", 4: "easy" })[log.rating] || "good", review: log.review, scheduledDays: log.interval, durationMs: log.durationMs, imported: true }));
  });
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  localStorage.setItem(ANKI_REVIEW_LOG_KEY, JSON.stringify(reviewLogs.slice(-100000)));
  state.editingCustomDeckId = deck.id;
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDecks();
  return deck;
}

function editCustomDeck(deckId) {
  const deck = loadCustomDecks().find((item) => item.id === deckId);
  if (!deck) return;
  state.editingBuiltInCollectionId = null;
  state.editingCustomDeckId = deck.id;
  state.appendNotesToExistingSet = false;
  state.notesHiddenAfterUpdate = false;
  state.customDraft = deck.cards.map((card) => ({ ...card }));
  state.customQuestionDraft = (deck.questions || []).map((question) => ({ ...question }));
  state.customFeynmanDraft = (deck.feynmanPrompts || []).map((item) => ({ ...item }));
  state.customImportSource = deck.sourceImport || null;
  state.extraColumnsOnly = (deck.characteristicTemplate?.length || 0) > 2;
  state.customCharacteristicFields = defaultCharacteristicFields(deck.characteristicTemplate || []);
  $("#custom-deck-name").value = deck.name;
  setNotesContent(deck.sourceNotes || "", deck.sourceNotesHtml || "");
  $("#anki-import-status").textContent = state.customImportSource ? `Imported from ${state.customImportSource.name} · flashcards only` : "Supports APKG, UTF-8 TXT, CSV, and TSV files.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  setCardMakerMode((deck.characteristicTemplate?.length || 0) > 2 ? "characteristics" : "basic");
  selectCreateContentTab("flashcards");
  $("#custom-deck-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function editBuiltInCollection(collectionId) {
  await ensureBuiltInCollectionLoaded(collectionId);
  const collection = getBuiltInCollection(collectionId);
  if (!collection) return;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = collectionId;
  state.appendNotesToExistingSet = false;
  const geographyByCardId = collection.geographyBank
    ? new Map(collection.units.flatMap((unit) => (unit.countries || []).map((country) => [`geo-${country.id}-country-capital`, country])))
    : null;
  state.customDraft = collection.units.flatMap((unit) => unit.cards.map((card) => {
    const country = geographyByCardId?.get(card.id);
    return {
      ...card,
      builtInUnitId: unit.id,
      ...(country && !card.characteristics ? { characteristicCard: true, characteristics: geographyExtraColumns(country) } : {}),
    };
  }));
  state.customQuestionDraft = collection.units.flatMap((unit) => (unit.questions || []).map((question) => ({ ...question, builtInUnitId: unit.id })));
  state.customFeynmanDraft = collection.units.flatMap((unit) => (unit.feynmanPrompts || []).map((item) => ({ ...item, builtInUnitId: unit.id })));
  state.customImportSource = null;
  state.extraColumnsOnly = (collection.characteristicTemplate?.length || 0) > 2;
  state.customCharacteristicFields = defaultCharacteristicFields(collection.characteristicTemplate || []);
  $("#custom-deck-name").value = collection.name;
  setNotesContent();
  $("#notes-input").dataset.placeholder = "This built-in deck is edited below. You can also add individual cards manually.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  setCardMakerMode((collection.characteristicTemplate?.length || 0) > 2 ? "characteristics" : "basic");
  selectCreateContentTab("flashcards");
  $("#custom-deck-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteCustomDeck(deckId) {
  const deck = loadCustomDecks().find((item) => item.id === deckId);
  if (!deck) return;
  if (!$("#flashcards").hidden) state.customDeleteReturnView = "flashcards";
  else if (!$("#create").hidden) state.customDeleteReturnView = "create";
  state.pendingCustomDeleteId = deckId;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = false;
  state.pendingReturnAllBuiltIn = false;
  state.pendingReturnAllTextbooks = false;
  $("#custom-delete-title").textContent = `Delete “${deck.name}”?`;
  $("#custom-delete-message").textContent = "Are you sure? This study set and its saved review progress will be permanently deleted.";
  $("#custom-delete-summary").textContent = `${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts`;
  $("#confirm-custom-delete").textContent = "Delete permanently";
  showAppView("custom-delete");
}

function deleteBuiltInCollection(collectionId) {
  const collection = getBuiltInCollection(collectionId);
  if (!collection) return;
  state.customDeleteReturnView = "flashcards";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = collectionId;
  state.pendingDeleteAllStudySets = false;
  state.pendingReturnAllBuiltIn = false;
  state.pendingReturnAllTextbooks = false;
  $("#custom-delete-title").textContent = `Delete “${collection.name}”?`;
  $("#custom-delete-message").textContent = "Are you sure? This deck will be removed from My study sets. You can add the original built-in deck again from the Study library.";
  $("#custom-delete-summary").textContent = `${collection.units.reduce((total, unit) => total + unit.cards.length, 0)} cards · ${collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0)} Feynman prompts`;
  $("#confirm-custom-delete").textContent = "Delete deck";
  showAppView("custom-delete");
}

function deleteAllStudySets() {
  const personalDecks = loadCustomDecks();
  const addedCollections = addedFlashcardCollectionIds();
  const total = personalDecks.length + addedCollections.length;
  if (!total) { showToast("There are no study sets to delete."); return; }
  state.customDeleteReturnView = "flashcards";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = true;
  state.pendingReturnAllBuiltIn = false;
  state.pendingReturnAllTextbooks = false;
  $("#custom-delete-title").textContent = "Delete all study sets?";
  $("#custom-delete-message").textContent = "Are you sure? Every personal set, added built-in deck, and their saved Anki progress will be permanently removed.";
  $("#custom-delete-summary").textContent = `${total} ${total === 1 ? "study set" : "study sets"}`;
  $("#confirm-custom-delete").textContent = "Delete All";
  showAppView("custom-delete");
}

function returnAllBuiltInDecks() {
  const addedCollections = addedFlashcardCollectionIds();
  if (!addedCollections.length) { showToast("All built-in decks are already in the library."); return; }
  state.customDeleteReturnView = "flashcards";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = false;
  state.pendingReturnAllBuiltIn = true;
  state.pendingReturnAllTextbooks = false;
  $("#custom-delete-title").textContent = "Return all built-in decks?";
  $("#custom-delete-message").textContent = "The decks will move out of My Study Sets and become available in the Study library again. Personal study sets and saved deck edits will remain unchanged.";
  $("#custom-delete-summary").textContent = `${addedCollections.length} ${addedCollections.length === 1 ? "built-in deck" : "built-in decks"}`;
  $("#confirm-custom-delete").textContent = "Return to library";
  showAppView("custom-delete");
}

function returnAllTextbooks() {
  const enrolled = enrolledCourseIds();
  if (!enrolled.length) { showToast("All textbooks are already in the library."); return; }
  state.customDeleteReturnView = "courses";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = false;
  state.pendingReturnAllBuiltIn = false;
  state.pendingReturnAllTextbooks = true;
  $("#custom-delete-title").textContent = "Return all textbooks?";
  $("#custom-delete-message").textContent = "Every added textbook will move back to the textbook catalog. Your study sets, edits, and Anki progress will remain unchanged.";
  $("#custom-delete-summary").textContent = `${enrolled.length} ${enrolled.length === 1 ? "textbook" : "textbooks"}`;
  $("#confirm-custom-delete").textContent = "Return to library";
  showAppView("custom-delete");
}

function confirmCustomDeckDeletion() {
  if (state.pendingReturnAllTextbooks) {
    localStorage.setItem("study-desk-enrolled-courses", "[]");
    state.pendingReturnAllTextbooks = false;
    showAppView("courses");
    renderCourseShelf($("#catalog-courses-search").value);
    showToast("All textbooks returned to the textbook library.");
    return;
  }
  if (state.pendingReturnAllBuiltIn) {
    removeDecksFromFolders(addedFlashcardCollectionIds());
    localStorage.setItem("study-desk-added-flashcard-collections", "[]");
    state.pendingReturnAllBuiltIn = false;
    showAppView("flashcards");
    renderCustomDecks();
    showToast("All built-in decks returned to the Study library.");
    return;
  }
  if (state.pendingDeleteAllStudySets) {
    storeCustomDecks([]);
    storeStudyFolders([]);
    localStorage.setItem("study-desk-added-flashcard-collections", "[]");
    storeBuiltInCollectionOverrides({});
    const schedules = ankiSchedules();
    Object.keys(schedules).filter((key) => key.startsWith("custom:")).forEach((key) => delete schedules[key]);
    localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
    resetCustomDraft();
    state.pendingDeleteAllStudySets = false;
    showAppView("flashcards");
    renderCustomDecks();
    showToast("All study sets deleted.");
    return;
  }
  if (state.pendingBuiltInDeleteId) {
    const collectionId = state.pendingBuiltInDeleteId;
    const collection = getBuiltInCollection(collectionId);
    removeFlashcardCollection(collectionId);
    const overrides = loadBuiltInCollectionOverrides();
    delete overrides[collectionId];
    storeBuiltInCollectionOverrides(overrides);
    const schedules = ankiSchedules();
    Object.keys(schedules).filter((key) => key.startsWith(`custom:${collectionId}:`)).forEach((key) => delete schedules[key]);
    localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
    state.pendingBuiltInDeleteId = null;
    showAppView(state.customDeleteReturnView);
    renderCustomDecks();
    showToast(`${collection?.name || "Built-in deck"} deleted from My study sets.`);
    return;
  }
  const deckId = state.pendingCustomDeleteId;
  const decks = loadCustomDecks();
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) { state.pendingCustomDeleteId = null; showAppView(state.customDeleteReturnView); return; }
  storeCustomDecks(decks.filter((item) => item.id !== deckId));
  removeDecksFromFolders([deckId]);
  const schedules = ankiSchedules();
  Object.keys(schedules).filter((key) => key.startsWith(`custom:${deckId}:`)).forEach((key) => delete schedules[key]);
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  if (state.editingCustomDeckId === deckId) resetCustomDraft();
  state.pendingCustomDeleteId = null;
  showAppView(state.customDeleteReturnView);
  showToast(`${deck.name} deleted.`);
}

function customAnkiKey(deckId, cardId) {
  return `custom:${deckId}:${cardId}`;
}

async function openCustomStudyOptions(deckId) {
  if (lazyBuiltInSources[deckId]) {
    showToast("Loading study cards…");
    await ensureBuiltInCollectionLoaded(deckId);
  }
  const collection = getBuiltInCollection(deckId);
  if (collection && state.selectedBuiltInCollectionId !== collection.id) {
    state.selectedBuiltInUnitIds = collection.units.filter((unit) => !unit.defaultOff).map((unit) => unit.id);
    state.calculusAbOnly = false;
  }
  state.selectedBuiltInCollectionId = collection?.id || null;
  const deck = findStudyDeck(deckId);
  if (!deck) return;
  if (!$("#flashcards").hidden) state.customStudyReturnView = "flashcards";
  else if (!$("#create").hidden) state.customStudyReturnView = "create";
  state.selectedCustomDeckId = deckId;
  state.selectedCustomDeckBuiltIn = Boolean(deck.builtIn || deck.folderStudy);
  $("#close-custom-study").textContent = state.customStudyReturnView === "dashboard" ? "← Back to dashboard" : state.customStudyReturnView === "flashcards" ? "← Back to Study" : "← Back to Create";
  renderBuiltInUnitPicker(collection);
  renderGeographyFieldPicker(collection);
  renderUsStateFieldPicker(collection);
  refreshCustomStudyOptions();
  $("#custom-study-options-view").hidden = false;
  $("#custom-review-view").hidden = true;
  showAppView("custom-study");
}

function renderGeographyFieldPicker(collection) {
  const picker = $("#geography-field-picker");
  picker.hidden = !collection?.geographyBank;
  if (!collection?.geographyBank) return;
  const renderSide = (side) => {
    const selected = side === "front" ? state.geographyFrontFields : state.geographyBackFields;
    const target = $(`#geography-${side}-fields`);
    target.innerHTML = geographyFieldOptions.map((field) => `<label class="geography-field-choice"><input type="checkbox" value="${field.id}" ${selected.includes(field.id) ? "checked" : ""}><span>${field.label}</span></label>`).join("");
    $$('input[type="checkbox"]', target).forEach((input) => input.addEventListener("change", () => {
      let next = $$('input[type="checkbox"]:checked', target).map((item) => item.value);
      if (input.checked && ["flag", "outline"].includes(input.value)) {
        next = next.filter((field) => field === input.value || !["flag", "outline"].includes(field));
      }
      if (side === "front") state.geographyFrontFields = next;
      else state.geographyBackFields = next;
      renderGeographyFieldPicker(collection);
      refreshCustomStudyOptions();
    }));
  };
  renderSide("front");
  renderSide("back");
  const labelFor = (fields) => fields.map((field) => geographyFieldOptions.find((option) => option.id === field)?.label).filter(Boolean).join(" + ") || "None";
  $("#geography-field-summary").textContent = `${labelFor(state.geographyFrontFields)} → ${labelFor(state.geographyBackFields)}`;
  $$('[data-geography-preset]', picker).forEach((button) => button.onclick = () => {
    const presets = {
      "country-capital": [["country"], ["capital"]],
      "capital-country": [["capital"], ["country"]],
      "country-details": [["country"], ["capital", "currency"]],
      "flag-country": [["flag"], ["country"]],
      "outline-country": [["outline"], ["country"]],
    };
    [state.geographyFrontFields, state.geographyBackFields] = presets[button.dataset.geographyPreset];
    renderGeographyFieldPicker(collection);
    refreshCustomStudyOptions();
  });
}

function renderUsStateFieldPicker(collection) {
  const picker = $("#us-state-field-picker");
  picker.hidden = !collection?.usStateBank;
  if (!collection?.usStateBank) return;
  const renderSide = (side) => {
    const selected = side === "front" ? state.usStateFrontFields : state.usStateBackFields;
    const target = $(`#us-state-${side}-fields`);
    target.innerHTML = usStateFieldOptions.map((field) => `<label class="geography-field-choice"><input type="checkbox" value="${field.id}" ${selected.includes(field.id) ? "checked" : ""}><span>${field.label}</span></label>`).join("");
    $$('.geography-field-choice input[type="checkbox"]', target).forEach((input) => input.addEventListener("change", () => {
      let next = $$('input[type="checkbox"]:checked', target).map((item) => item.value);
      if (input.checked && ["flag", "outline"].includes(input.value)) {
        next = next.filter((field) => field === input.value || !["flag", "outline"].includes(field));
      }
      if (side === "front") state.usStateFrontFields = next;
      else state.usStateBackFields = next;
      renderUsStateFieldPicker(collection);
      refreshCustomStudyOptions();
    }));
  };
  renderSide("front");
  renderSide("back");
  const labelFor = (fields) => fields.map((field) => usStateFieldOptions.find((option) => option.id === field)?.label).filter(Boolean).join(" + ") || "None";
  $("#us-state-field-summary").textContent = `${labelFor(state.usStateFrontFields)} → ${labelFor(state.usStateBackFields)}`;
  $$('[data-us-state-preset]', picker).forEach((button) => button.onclick = () => {
    const presets = {
      "state-capital": [["state"], ["capital"]],
      "capital-state": [["capital"], ["state"]],
      "state-cities": [["state"], ["capital", "largestCity"]],
      "abbreviation-state": [["abbreviation"], ["state"]],
      "state-admission": [["state"], ["admission"]],
      "flag-state": [["flag"], ["state"]],
      "outline-state": [["outline"], ["state"]],
    };
    [state.usStateFrontFields, state.usStateBackFields] = presets[button.dataset.usStatePreset];
    renderUsStateFieldPicker(collection);
    refreshCustomStudyOptions();
  });
}

function renderBuiltInUnitPicker(collection) {
  const picker = $("#built-in-unit-picker");
  picker.hidden = !collection;
  if (!collection) return;
  const abToggle = $("#toggle-calculus-ab");
  const supportsLevelFilter = Boolean(collection.supportsAbFilter || collection.supportsLevelFilter);
  const extensionLevel = collection.extensionLevel || "BC";
  const baseLabel = collection.baseLevel || "AB";
  abToggle.hidden = !supportsLevelFilter;
  abToggle.classList.toggle("active", state.calculusAbOnly);
  abToggle.textContent = collection.supportsLevelFilter ? `Level: ${state.calculusAbOnly ? baseLabel : (collection.extensionDisplayLabel || extensionLevel)}` : `AB only: ${state.calculusAbOnly ? "On" : "Off"}`;
  $("#built-in-unit-grid").innerHTML = collection.units.map((unit) => {
    const allowed = (item) => !state.calculusAbOnly || item.courseLevel !== extensionLevel;
    const cardCount = unit.cards.filter(allowed).length;
    const feynmanCount = (unit.feynmanPrompts || []).filter(allowed).length;
    const summary = cardCount ? (feynmanCount ? `${cardCount} cards · ${feynmanCount} Feynman topics` : `${cardCount} cards`) : "BC only";
    return `<label class="built-in-unit-choice"><input type="checkbox" value="${unit.id}" ${state.selectedBuiltInUnitIds.includes(unit.id) ? "checked" : ""} ${cardCount ? "" : "disabled"}><span><strong>${escapeHtml(unit.shortName)}</strong><small>${summary}</small></span></label>`;
  }).join("");
  $$('input[type="checkbox"]', $("#built-in-unit-grid")).forEach((input) => input.addEventListener("change", () => {
    state.selectedBuiltInUnitIds = $$('input[type="checkbox"]:checked', $("#built-in-unit-grid")).map((item) => item.value);
    updateBuiltInUnitToggle(collection);
    refreshCustomStudyOptions();
  }));
  $("#toggle-all-built-in-units").onclick = () => {
    const selectableUnits = collection.units.filter((unit) => !state.calculusAbOnly || unit.cards.some((card) => card.courseLevel !== extensionLevel));
    const allSelected = selectableUnits.every((unit) => state.selectedBuiltInUnitIds.includes(unit.id));
    state.selectedBuiltInUnitIds = allSelected ? [] : selectableUnits.map((unit) => unit.id);
    renderBuiltInUnitPicker(collection);
    refreshCustomStudyOptions();
  };
  abToggle.onclick = () => {
    state.calculusAbOnly = !state.calculusAbOnly;
    if (state.calculusAbOnly) state.selectedBuiltInUnitIds = collection.units.filter((unit) => unit.cards.some((card) => card.courseLevel !== extensionLevel)).map((unit) => unit.id);
    else state.selectedBuiltInUnitIds = collection.units.map((unit) => unit.id);
    renderBuiltInUnitPicker(collection);
    refreshCustomStudyOptions();
  };
  updateBuiltInUnitToggle(collection);
}

function updateBuiltInUnitToggle(collection) {
  const extensionLevel = collection.extensionLevel || "BC";
  const selectableUnits = collection.units.filter((unit) => !state.calculusAbOnly || unit.cards.some((card) => card.courseLevel !== extensionLevel));
  $("#toggle-all-built-in-units").textContent = selectableUnits.length && selectableUnits.every((unit) => state.selectedBuiltInUnitIds.includes(unit.id)) ? "Clear all" : "Select all";
}

function refreshCustomStudyOptions() {
  const deck = findStudyDeck(state.selectedCustomDeckId);
  if (!deck) return;
  $("#custom-study-title").textContent = deck.name;
  const removed = removedAnkiCardKeys();
  const candidates = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(card.sourceDeckId || deck.id, card.id))).filter((card) => !removed.has(card.scheduleKey));
  const dailyPlan = dailyAnkiPlan(candidates, `deck:${deck.id}`);
  const dueCount = dailyPlan.queue.length;
  const reviewCount = dailyPlan.learningCards.length + dailyPlan.reviewCards.length;
  const futureDue = deck.cards.map((card) => ankiScheduleFor(customAnkiKey(card.sourceDeckId || deck.id, card.id)).due).filter((due) => due > Date.now()).sort((a, b) => a - b)[0];
  const factBankMissingSide = (deck.geographyBank && (!state.geographyFrontFields.length || !state.geographyBackFields.length)) || (deck.usStateBank && (!state.usStateFrontFields.length || !state.usStateBackFields.length));
  $("#custom-anki-due-copy").textContent = factBankMissingSide ? "Choose at least one field for both sides to study." : !deck.cards.length ? "Select at least one unit." : dueCount ? `${dueCount} cards are in today's session.` : futureDue ? `Nothing is due now. Next review ${relativeDueTime(futureDue)}.` : "No flashcards are available.";
  $("#custom-anki-daily-new").textContent = dailyPlan.newCards.length;
  $("#custom-anki-daily-review").textContent = reviewCount;
  $('[data-custom-study-mode="regular"]').disabled = factBankMissingSide || !deck.cards.length;
  $('[data-custom-study-mode="anki"]').disabled = factBankMissingSide || !dueCount;
  $('[data-custom-study-mode="questions"]').disabled = !(deck.questions || []).length;
  $('[data-custom-study-mode="feynman"]').disabled = !(deck.feynmanPrompts || []).length;
  $('[data-custom-study-mode="questions"]').closest(".custom-study-option-card").hidden = Boolean(deck.builtIn);
  $('[data-custom-study-mode="feynman"]').closest(".custom-study-option-card").hidden = false;
  configureCustomReviewCount("#custom-regular-count", deck.cards.length);
  configureCustomReviewCount("#custom-questions-count", (deck.questions || []).length);
}

function configureCustomReviewCount(selector, available) {
  const input = $(selector);
  const maximum = Math.max(0, available);
  const wasDisabled = input.disabled;
  input.disabled = maximum === 0;
  input.max = String(Math.max(1, maximum));
  input.value = String(maximum ? Math.min(maximum, wasDisabled ? 20 : Math.max(1, Number(input.value) || maximum)) : 1);
}

function customReviewCount(mode, available) {
  const selectors = { regular: "#custom-regular-count", questions: "#custom-questions-count" };
  const input = $(selectors[mode]);
  if (!input) return available;
  const count = Math.min(available, Math.max(1, Math.floor(Number(input.value) || available)));
  input.value = String(count);
  return count;
}

function startCustomReview(mode) {
  const deck = findStudyDeck(state.selectedCustomDeckId);
  if (!deck) return;
  state.customReviewMode = mode;
  state.customAnkiBatchSession = false;
  state.customAnkiActiveOwners = mode === "anki" ? [{ id: deck.id, target: "deck" }] : [];
  if (mode === "questions") {
    const questions = (deck.questions || []).map((question) => ({
      ...question,
      front: question.prompt,
      back: question.answer,
    }));
    state.customReviewCards = shuffleInPlace(questions).slice(0, customReviewCount(mode, questions.length));
  } else if (mode === "feynman") {
    state.customReviewCards = (deck.feynmanPrompts || []).map((item) => ({ id: item.id, front: cleanCustomFeynmanPrompt(item.prompt), back: "Review your explanation and add any important details you missed." }));
  } else if (mode === "anki") {
    const scope = `deck:${deck.id}`;
    const removed = removedAnkiCardKeys();
    const candidates = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(card.sourceDeckId || deck.id, card.id))).filter((card) => !removed.has(card.scheduleKey));
    const plan = dailyAnkiPlan(candidates, scope);
    activateAnkiDeck(deck.id, "deck");
    state.customReviewCards = plan.queue;
    markDailyNewCardsStarted(scope, plan.newCards);
  } else {
    const cards = deck.cards.map((card) => ({ ...card }));
    state.customReviewCards = shuffleInPlace(cards).slice(0, customReviewCount(mode, cards.length));
  }
  if (!state.customReviewCards.length) { showToast("Nothing is available for that study mode yet."); return; }
  state.customReviewPosition = 0;
  state.customAnkiSessionTotal = mode === "anki" ? state.customReviewCards.length : 0;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  state.customQuestionAnswered = false;
  state.customFeynmanStartedAt = null;
  state.customReviewStartedAt = Date.now();
  state.customAnkiCardShownAt = mode === "anki" ? Date.now() : null;
  $("#custom-review-title").textContent = deck.name;
  $("#custom-study-options-view").hidden = true;
  $("#custom-review-view").hidden = false;
  renderCustomReviewCard();
  window.clearInterval(customReviewTimerHandle);
  if (mode === "anki") {
    $("#custom-review-time").textContent = "00:00";
    customReviewTimerHandle = window.setInterval(() => {
      $("#custom-review-time").textContent = formatElapsed(Date.now() - state.customReviewStartedAt);
    }, 1000);
  }
}

function closeCustomReview() {
  window.clearInterval(customReviewTimerHandle);
  window.clearInterval(customFeynmanTimerHandle);
  if (state.customAnkiBatchSession) {
    state.customAnkiBatchSession = false;
    state.customAnkiActiveOwners = [];
    $("#custom-review-view").hidden = true;
    $("#custom-study-options-view").hidden = false;
    showAppView("dashboard");
  } else if (state.selectedCustomDeckId) openCustomStudyOptions(state.selectedCustomDeckId);
  else {
    $("#custom-review-view").hidden = true;
    $("#custom-study-options-view").hidden = false;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCustomReviewCard() {
  const card = state.customReviewCards[state.customReviewMode === "anki" ? 0 : state.customReviewPosition];
  if (!card) return;
  const reviewCard = $("#custom-review-card");
  reviewCard.classList.toggle("revealed", state.customReviewRevealed);
  const modeLabels = { regular: ["Front", "Back", "Flashcard review"], anki: ["Front", "Back", "Anki review"], questions: ["Question", "Answer", "Question practice"], feynman: ["Prompt", "Self-check", "Feynman practice"] };
  const labels = modeLabels[state.customReviewMode] || modeLabels.regular;
  $("#custom-review-side").textContent = state.customReviewRevealed ? labels[1] : labels[0];
  $("#custom-review-mode-label").textContent = labels[2];
  const reviewText = state.customReviewRevealed ? card.back : card.front;
  const reviewImage = state.customReviewRevealed ? card.backImage : card.frontImage;
  const reviewContent = $("#custom-review-content");
  const reviewImageElement = $("#custom-review-image");
  const equation = state.customReviewRevealed && card.equation ? `<span class="anki-equation" aria-label="Equation">${textbookEquationHtml(card.equation)}</span>` : "";
  reviewContent.innerHTML = equation + (reviewText ? studyTextHtml(reviewText) : "");
  reviewContent.hidden = !reviewText && !equation;
  reviewImageElement.src = reviewImage || "";
  reviewImageElement.alt = reviewImage ? `${state.customReviewRevealed ? labels[1] : labels[0]} image` : "";
  reviewImageElement.hidden = !reviewImage;
  const isAnki = state.customReviewMode === "anki";
  const isQuestions = state.customReviewMode === "questions";
  const isFeynman = state.customReviewMode === "feynman";
  $("#custom-question-practice").hidden = !isQuestions;
  $("#custom-feynman-practice").hidden = !isFeynman;
  $("#custom-review-card").hidden = isQuestions || isFeynman;
  $("#custom-review-progress").textContent = isAnki ? `${state.customReviewCards.length} ${state.customReviewCards.length === 1 ? "card" : "cards"} remaining` : `${labels[0]} ${state.customReviewPosition + 1} of ${state.customReviewCards.length}`;
  const sourceLabel = $("#custom-anki-source");
  sourceLabel.hidden = !isAnki || !state.customAnkiBatchSession;
  sourceLabel.textContent = card.activeAnkiOwnerName ? `From ${card.activeAnkiOwnerName}` : "";
  const deckProgress = $("#custom-anki-deck-progress");
  deckProgress.hidden = !isAnki || !state.customAnkiBatchSession;
  if (!deckProgress.hidden) {
    const remainingByOwner = state.customReviewCards.reduce((counts, item) => {
      if (item.activeAnkiOwnerKey) counts[item.activeAnkiOwnerKey] = (counts[item.activeAnkiOwnerKey] || 0) + 1;
      return counts;
    }, {});
    $("#custom-anki-deck-progress-list").innerHTML = state.customAnkiActiveOwners.map((owner) => {
      const remaining = remainingByOwner[owner.key] || 0;
      const completed = Math.max(0, owner.total - remaining);
      const percent = owner.total ? Math.round(completed / owner.total * 100) : 100;
      return `<div class="custom-anki-deck-progress-row"><div><strong>${escapeHtml(owner.name)}</strong><span>${remaining} remaining</span></div><div class="custom-anki-deck-progress-track"><span style="width:${percent}%"></span></div></div>`;
    }).join("");
  }
  $("#custom-regular-controls").hidden = isAnki || isQuestions || isFeynman;
  $("#custom-anki-ratings").hidden = !isAnki || !state.customReviewWasRevealed;
  $("#custom-review-reveal").hidden = isQuestions || isFeynman || state.customReviewRevealed;
  $("#custom-anki-session-counts").hidden = !isAnki;
  $("#delete-custom-anki-card").hidden = !isAnki || state.selectedCustomDeckBuiltIn;
  $("#custom-review-time").hidden = !isAnki;
  $("#custom-review-previous").disabled = state.customReviewPosition === 0;
  $("#custom-review-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  if (isQuestions) {
    renderCustomQuestionPractice(card);
    return;
  }
  if (isFeynman) {
    renderCustomFeynmanPractice(card);
    return;
  }
  if (isAnki) {
    const counts = ankiSessionCounts(state.customReviewCards);
    $("#custom-anki-session-counts").dataset.currentType = card.sessionType || "new";
    $(".anki-count-new", $("#custom-anki-session-counts")).textContent = counts.new;
    $(".anki-count-learning", $("#custom-anki-session-counts")).textContent = counts.learning;
    $(".anki-count-review", $("#custom-anki-session-counts")).textContent = counts.review;
    $("#custom-anki-session-counts").setAttribute("aria-label", `${counts.new} new, ${counts.learning} learning, ${counts.review} review cards remaining; current card is ${card.sessionType || "new"}`);
    const intervals = ankiRatingIntervals(ankiScheduleFor(card.scheduleKey));
    $$('[data-custom-anki-rating]').forEach((button) => { $("span", button).textContent = formatReviewInterval(intervals[button.dataset.customAnkiRating]); });
  }
}

function cleanCustomFeynmanPrompt(value) {
  return String(value)
    .replace(/^Explain\s+/i, "")
    .replace(/\s+in detail\s+without (?:looking at|checking) (?:your )?notes[.!]?$/i, "")
    .replace(/\s+without (?:looking at|checking) (?:your )?notes[.!]?$/i, "")
    .replace(/[.!]+$/, "")
    .trim();
}

function customFeynmanDurationSeconds() {
  return state.customFeynmanTimeUnit === "minutes" ? state.customFeynmanTimeAmount * 60 : state.customFeynmanTimeAmount;
}

function renderCustomFeynmanPractice(item) {
  window.clearInterval(customFeynmanTimerHandle);
  state.customFeynmanStartedAt = null;
  $("#custom-feynman-prompt").textContent = cleanCustomFeynmanPrompt(item.front);
  $("#custom-feynman-time-amount").value = state.customFeynmanTimeAmount;
  $("#custom-feynman-time-unit").value = state.customFeynmanTimeUnit;
  $("#custom-feynman-countdown").textContent = formatElapsed(customFeynmanDurationSeconds() * 1000);
  $("#custom-feynman-response").value = "";
  $("#custom-feynman-status").textContent = "Timer running. Keep developing your explanation.";
  $("#start-custom-feynman-timer").disabled = false;
  $("#start-custom-feynman-timer").textContent = "Restart timer";
  $("#custom-feynman-previous").disabled = state.customReviewPosition === 0;
  $("#custom-feynman-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  startCustomFeynmanTimer();
}

function startCustomFeynmanTimer() {
  window.clearInterval(customFeynmanTimerHandle);
  state.customFeynmanStartedAt = Date.now();
  $("#start-custom-feynman-timer").disabled = false;
  $("#start-custom-feynman-timer").textContent = "Restart timer";
  $("#custom-feynman-status").textContent = "Timer running. Keep developing your explanation.";
  const update = () => {
    const remaining = Math.max(0, customFeynmanDurationSeconds() * 1000 - (Date.now() - state.customFeynmanStartedAt));
    $("#custom-feynman-countdown").textContent = formatElapsed(remaining);
    if (remaining === 0) {
      window.clearInterval(customFeynmanTimerHandle);
      $("#custom-feynman-status").textContent = "Time is up. Finish your current thought, then continue when ready.";
      showToast("Feynman writing time finished.");
    }
  };
  update();
  customFeynmanTimerHandle = window.setInterval(update, 250);
  $("#custom-feynman-response").focus();
}

function moveCustomFeynman(direction) {
  const nextPosition = state.customReviewPosition + direction;
  if (nextPosition < 0) return;
  window.clearInterval(customFeynmanTimerHandle);
  if (nextPosition >= state.customReviewCards.length) { recordStudyActivity(); closeCustomReview(); return; }
  state.customReviewPosition = nextPosition;
  renderCustomReviewCard();
}

function renderCustomQuestionPractice(question) {
  const isChoice = question.type === "true_false" || (question.type === "mcq" && (question.options || []).length > 1);
  const options = question.type === "true_false" ? ["True", "False"] : (question.options || []);
  $("#custom-question-type").textContent = `${questionTypeLabel(question.type)}${question.difficulty ? ` · ${question.difficulty}` : ""}`;
  $("#custom-question-prompt").textContent = question.prompt;
  $("#custom-question-choices").hidden = !isChoice;
  $("#custom-question-choices").innerHTML = isChoice ? options.map((option, index) => `<button type="button" data-custom-question-choice="${escapeHtml(option)}"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</button>`).join("") : "";
  $("#custom-question-response-wrap").hidden = isChoice;
  $("#custom-question-response").value = "";
  $("#custom-question-response").disabled = false;
  $("#custom-question-feedback").textContent = "";
  $("#custom-question-feedback").className = "custom-question-feedback";
  $("#custom-question-previous").disabled = state.customReviewPosition === 0;
  $("#custom-question-next").disabled = true;
  $("#custom-question-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  $("#check-custom-question").hidden = isChoice;
  $("#check-custom-question").disabled = false;
  state.customQuestionAnswered = false;
  $$('[data-custom-question-choice]').forEach((button) => button.addEventListener("click", () => answerCustomQuestion(button.dataset.customQuestionChoice)));
}

function answerCustomQuestion(response) {
  if (state.customQuestionAnswered) return;
  const question = state.customReviewCards[state.customReviewPosition];
  const given = String(response ?? $("#custom-question-response").value).trim();
  if (!given) { $("#custom-question-response").focus(); return; }
  const expected = String(question.answer).trim();
  const exactQuestion = question.type === "mcq" || question.type === "true_false" || question.type === "cloze";
  const correct = given.localeCompare(expected, undefined, { sensitivity: "base" }) === 0;
  state.customQuestionAnswered = true;
  $$('[data-custom-question-choice]').forEach((button) => {
    button.disabled = true;
    if (button.dataset.customQuestionChoice.localeCompare(expected, undefined, { sensitivity: "base" }) === 0) button.classList.add("correct");
    else if (button.dataset.customQuestionChoice.localeCompare(given, undefined, { sensitivity: "base" }) === 0) button.classList.add("incorrect");
  });
  $("#custom-question-response").disabled = true;
  const feedback = $("#custom-question-feedback");
  feedback.classList.add(!exactQuestion || correct ? "correct" : "incorrect");
  feedback.textContent = exactQuestion ? (correct ? "Correct." : `Not quite. Correct answer: ${expected}`) : `Model answer: ${expected}`;
  $("#custom-question-next").disabled = false;
  $("#check-custom-question").disabled = true;
}

function moveCustomQuestion(direction) {
  const nextPosition = state.customReviewPosition + direction;
  if (nextPosition < 0) return;
  if (nextPosition >= state.customReviewCards.length) { recordStudyActivity(); closeCustomReview(); return; }
  state.customReviewPosition = nextPosition;
  state.customReviewRevealed = false;
  state.customQuestionAnswered = false;
  $("#custom-question-response").disabled = false;
  $("#check-custom-question").disabled = false;
  renderCustomReviewCard();
}

function rateCustomAnkiCard(rating) {
  if (!state.customReviewWasRevealed) return;
  const card = state.customReviewCards.shift();
  if (!card?.scheduleKey) return;
  const selectedIntervalDays = saveAnkiRating(card.scheduleKey, rating, Date.now() - (state.customAnkiCardShownAt || Date.now()));
  buryAnkiSiblings(card, state.customReviewCards);
  const buried = buriedAnkiKeys();
  state.customReviewCards = state.customReviewCards.filter((candidate) => !buried.has(candidate.scheduleKey));
  const graduated = applyAnkiSessionRating(card, rating, selectedIntervalDays);
  if (!graduated) state.customReviewCards.push(card);
  if (!state.customReviewCards.length) {
    const elapsed = formatElapsed(Date.now() - state.customReviewStartedAt);
    recordStudyActivity();
    const owners = state.customAnkiActiveOwners.length ? [...state.customAnkiActiveOwners] : [{ id: state.selectedCustomDeckId, target: "deck" }];
    owners.filter((owner) => owner.id).forEach((owner) => markActiveAnkiComplete(owner.id, owner.target));
    closeCustomReview();
    showToast(`Anki session complete in ${elapsed} — no New, Learning, or Review cards remain.`);
    return;
  }
  state.customReviewPosition = 0;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  state.customAnkiCardShownAt = Date.now();
  renderCustomReviewCard();
}

function removeCurrentCustomAnkiFromStudy() {
  if (state.customReviewMode !== "anki") return;
  const current = state.customReviewCards[0];
  if (!current?.scheduleKey) return;
  const card = state.customReviewCards.shift();
  if (!card?.scheduleKey) return;
  const removed = removedAnkiCardKeys();
  removed.add(card.scheduleKey);
  localStorage.setItem("study-desk-removed-anki-cards", JSON.stringify([...removed]));
  if (!state.customReviewCards.length) {
    closeCustomReview();
    renderActiveAnkiDecks();
    showToast("Card removed from future study. This Anki session is complete.");
    return;
  }
  state.customReviewPosition = 0;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  renderCustomReviewCard();
  renderActiveAnkiDecks();
  showToast("Card removed from future study.");
}

function deleteCurrentCustomAnkiCard() {
  if (state.customReviewMode !== "anki") return;
  const card = state.customReviewCards[state.customReviewPosition];
  const deckId = state.selectedCustomDeckId;
  if (!card?.id || !deckId) return;
  if (!window.confirm("Remove this card from your personal study set? It will also be removed from future regular and Anki reviews.")) return;
  const decks = loadCustomDecks();
  const deckIndex = decks.findIndex((deck) => deck.id === deckId);
  if (deckIndex < 0) return;
  const deletedFront = card.front;
  decks[deckIndex] = { ...decks[deckIndex], cards: decks[deckIndex].cards.filter((item) => item.id !== card.id), updatedAt: Date.now() };
  storeCustomDecks(decks);
  if (state.editingCustomDeckId === deckId) {
    state.customDraft = state.customDraft.filter((item) => item.id !== card.id);
    renderCustomDraft();
  }
  const schedules = ankiSchedules();
  delete schedules[customAnkiKey(deckId, card.id)];
  localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
  state.customReviewCards.splice(state.customReviewPosition, 1);
  if (!state.customReviewCards.length) {
    closeCustomReview();
    renderCustomDecks();
    showToast(`Removed “${deletedFront}”. No cards remain in this review.`);
    return;
  }
  if (state.customReviewPosition >= state.customReviewCards.length) state.customReviewPosition = state.customReviewCards.length - 1;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  renderCustomDecks();
  renderCustomReviewCard();
  showToast(`Removed “${deletedFront}” from this study set.`);
}

const taskDialog = $("#task-dialog");
const folderEditorDialog = $("#folder-editor-dialog");

// Navigation is core infrastructure, so wire it before rendering or initializing
// any individual workspace. One broken optional feature must not disable every tab.
$$(".primary-nav .nav-item").forEach((item) => item.addEventListener("click", (event) => {
  const target = item.getAttribute("href");
  if (["#courses", "#dashboard", "#flashcards", "#create", "#notes", "#export", "#study-guide"].includes(target)) {
    event.preventDefault();
    showAppView(target.slice(1));
  }
}));
$$('.mobile-nav a[href="#courses"], .mobile-nav a[href="#dashboard"], .mobile-nav a[href="#flashcards"], .mobile-nav a[href="#create"], .mobile-nav a[href="#notes"], .mobile-nav a[href="#export"], .mobile-nav a[href="#study-guide"]').forEach((item) => item.addEventListener("click", (event) => {
  event.preventDefault();
  showAppView(item.getAttribute("href").slice(1));
}));
function positionInlinePalette(palette, control) {
  palette.classList.remove("opens-below");
  window.requestAnimationFrame(() => {
    const controlRect = control.getBoundingClientRect();
    if (controlRect.top - palette.offsetHeight < 58) palette.classList.add("opens-below");
  });
}
document.addEventListener("click", (event) => {
  const createButton = event.target.closest("#new-word-note, #new-drawing-note, [data-new-note]");
  if (!createButton) return;
  event.preventDefault();
  const type = createButton.dataset.newNote || (createButton.id === "new-drawing-note" ? "drawing" : "word");
  createNotebookNote(type);
});
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-color-palette-for]");
  const moreColors = event.target.closest("[data-more-colors-for]");
  const swatch = event.target.closest("[data-pick-color]");
  if (moreColors) {
    event.preventDefault();
    event.stopPropagation();
    const control = moreColors.closest(".inline-color-control");
    control.querySelectorAll(".inline-color-palette").forEach((palette) => { palette.hidden = true; });
    const fullPalette = control.querySelector(".full-color-palette");
    if (fullPalette) {
      fullPalette.hidden = false;
      positionInlinePalette(fullPalette, control);
    }
    return;
  }
  if (trigger) {
    event.preventDefault();
    const palette = trigger.parentElement.querySelector(".quick-color-palette, .inline-color-palette");
    const opening = palette.hidden;
    $$(".inline-color-palette").forEach((item) => { item.hidden = true; });
    palette.hidden = !opening;
    if (opening) positionInlinePalette(palette, trigger.closest(".inline-color-control"));
    return;
  }
  if (swatch) {
    event.preventDefault();
    const control = swatch.closest(".inline-color-control");
    const input = control.querySelector('input[type="hidden"]');
    const color = swatch.dataset.pickColor;
    input.value = color;
    control.querySelector(".inline-color-trigger").style.setProperty("--selected-color", color);
    control.querySelectorAll(".inline-color-palette").forEach((palette) => { palette.hidden = true; });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  if (!event.target.closest(".inline-color-control")) $$(".inline-color-palette").forEach((item) => { item.hidden = true; });
});
initializeNotesWorkspace();

function runStartupStep(name, callback) {
  try {
    callback();
  } catch (error) {
    console.error(`${name} could not be initialized:`, error);
  }
}

runStartupStep("Theme", applyTheme);
runStartupStep("Date greeting", setDateGreeting);
runStartupStep("Profile", initializeProfile);
runStartupStep("Study streak", renderStudyStreak);
runStartupStep("Textbook shelf", renderCourseShelf);
runStartupStep("Flashcard draft", renderCustomDraft);
runStartupStep("Question draft", renderCustomQuestionDraft);
runStartupStep("Feynman draft", renderCustomFeynmanDraft);
runStartupStep("Study sets", renderCustomDecks);
runStartupStep("Study alarms", restoreTasks);
runStartupStep("Active Anki selection", restoreActiveAnkiSelections);
runStartupStep("Active Anki decks", renderActiveAnkiDecks);
runStartupStep("Alarm checkboxes", () => $$(".task-item input[type='checkbox']").forEach(wireTaskCheckbox));
window.requestAnimationFrame(() => window.setTimeout(hydrateAddedCollections, 0));

$("#view-all-courses").addEventListener("click", () => $("#course-shelf").scrollIntoView({ behavior: "smooth", block: "center" }));
$("#close-library-button").addEventListener("click", showLibraryOverview);
$("#start-freestyle-feynman").addEventListener("click", () => startFreestyleFeynman());
$("#restart-freestyle-feynman").addEventListener("click", () => startFreestyleFeynman({ clearResponse: false }));
$("#new-freestyle-feynman").addEventListener("click", resetFreestyleFeynman);
$("#freestyle-feynman-prompt-input").addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") startFreestyleFeynman();
});
$("#add-task-button").addEventListener("click", () => {
  const defaultTime = new Date(Date.now() + 3600000);
  $("#alarm-date").value = `${defaultTime.getFullYear()}-${String(defaultTime.getMonth() + 1).padStart(2, "0")}-${String(defaultTime.getDate()).padStart(2, "0")}`;
  $("#alarm-time").value = `${String(defaultTime.getHours()).padStart(2, "0")}:${String(defaultTime.getMinutes()).padStart(2, "0")}`;
  taskDialog.showModal();
});
$("#close-dialog").addEventListener("click", () => taskDialog.close());
$("#cancel-task").addEventListener("click", () => taskDialog.close());
$("#close-folder-editor").addEventListener("click", () => folderEditorDialog.close());
$("#cancel-folder-editor").addEventListener("click", () => folderEditorDialog.close());
$("#folder-editor-form").addEventListener("submit", (event) => { event.preventDefault(); saveStudyFolderEditor(); });
$("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#task-name").value.trim();
  const description = $("#alarm-description").value.trim();
  const timestamp = new Date(`${$("#alarm-date").value}T${$("#alarm-time").value}`).getTime();
  if (!title || !Number.isFinite(timestamp)) return;
  if (timestamp <= Date.now()) { showToast("Choose a future date and time."); return; }
  addStudyAlarm(title, description, timestamp);
  event.currentTarget.reset();
  taskDialog.close();
  showToast("Study alarm scheduled. Allow notifications if your Mac asks.");
});
$(".search-field input")?.addEventListener("input", (event) => {
  $("#my-courses-search").value = event.currentTarget.value;
  $("#catalog-courses-search").value = event.currentTarget.value;
  renderCourseShelf(event.currentTarget.value);
  showAppView("courses");
});
$("#my-courses-search").addEventListener("input", (event) => renderMyCourses(event.currentTarget.value));
$("#catalog-courses-search").addEventListener("input", (event) => { state.textbookCatalogPage = 0; renderCourseShelf(event.currentTarget.value); });

function importDeckName(fileName) {
  return fileName.replace(/\.(apkg|pdf|pptx|txt|md|csv|tsv)$/i, "").replace(/\.anki$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Imported study set";
}

function loadImportedDocument(payload) {
  if (!payload?.text?.trim()) throw new Error("No readable text was found in this document.");
  if (state.editingCustomDeckId || state.editingBuiltInCollectionId) {
    const createNew = window.confirm("Create a new study set from the imported notes?\n\nChoose Cancel to add only new, nonduplicate material to the end of this set.");
    if (!createNew) {
      const input = $("#notes-input");
      const spacer = document.createElement("div");
      spacer.appendChild(document.createElement("br"));
      const imported = document.createElement("div");
      imported.textContent = payload.text;
      input.append(spacer, imported);
      state.appendNotesToExistingSet = true;
      state.notesHiddenAfterUpdate = false;
      state.customImportSource = { name: payload.name, type: payload.extension, importedAt: Date.now() };
      $("#anki-import-status").textContent = `Added ${payload.name} to the current notes. Choose Update set to append new material.`;
      $("#anki-notes-file").value = "";
      $("#choose-anki-notes").disabled = false;
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Imported notes added. Duplicates will be skipped when you update.");
      return;
    }
    resetCustomDraft();
  } else if ((state.customDraft.length || state.customQuestionDraft.length || state.customFeynmanDraft.length) && !window.confirm("Replace the current notes and draft with this document?")) return;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = null;
  state.customDraft = [];
  state.customQuestionDraft = [];
  state.customFeynmanDraft = [];
  state.customImportSource = { name: payload.name, type: payload.extension, importedAt: Date.now() };
  $("#custom-deck-name").value = importDeckName(payload.name);
  setNotesContent(payload.text);
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  $("#anki-import-status").textContent = `Extracted ${payload.name}. Review the notes below, then choose Generate and save study set.`;
  $("#anki-notes-file").value = "";
  $("#choose-anki-notes").disabled = false;
  $("#notes-input").scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("Document text imported. Review it before generating your study set.");
}

function saveImportedFlashcards({ fileName, type, cards, skipped = 0 }) {
  const status = $("#anki-import-status");
  if (!cards.length) throw new Error("No readable two-sided flashcards were found.");
  const hasCurrentWork = state.customDraft.length || state.customQuestionDraft.length || state.customFeynmanDraft.length || state.editingCustomDeckId || state.editingBuiltInCollectionId;
  if (hasCurrentWork && !window.confirm("Import this file as a new flashcard set? Your current draft will be replaced.")) return null;
  const requestedName = !state.editingCustomDeckId && !state.editingBuiltInCollectionId ? $("#custom-deck-name").value.trim() : "";
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = null;
  state.customDraft = cards;
  state.customQuestionDraft = [];
  state.customFeynmanDraft = [];
  state.customImportSource = { name: fileName, type, importedAt: Date.now() };
  $("#custom-deck-name").value = requestedName || importDeckName(fileName);
  setNotesContent();
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  selectCreateContentTab("flashcards");
  const deck = saveGeneratedCustomDeckInPlace();
  const skippedCopy = skipped ? ` · ${skipped} media-only or incomplete notes skipped` : "";
  status.textContent = `Imported ${deck.cards.length} flashcards from ${fileName}${skippedCopy} · no questions or Feynman prompts created`;
  showToast(`${deck.name} imported with ${deck.cards.length} flashcards.`);
  return deck;
}

async function importAnkiNotesFile(file) {
  const status = $("#anki-import-status");
  const extension = file.name.split(".").pop().toLowerCase();
  if (!["txt", "csv", "tsv"].includes(extension)) {
    if (extension === "apkg") status.textContent = "The desktop app is opening this APKG package locally…";
    else {
      status.textContent = ["pdf", "pptx"].includes(extension) ? "PDF and PowerPoint extraction is available in the Mac and Windows desktop apps." : "Choose an APKG, PDF, PPTX, TXT, CSV, or TSV file.";
      showToast("That file type is not supported.");
    }
    return;
  }
  status.textContent = `Reading ${file.name}…`;
  try {
    const parsed = parseAnkiNotes(file.name, await file.text());
    saveImportedFlashcards({ fileName: file.name, type: extension, cards: parsed.cards });
  } catch (error) {
    status.textContent = error?.message || "This file could not be imported.";
    showToast("I couldn’t import that file. Check that it has at least two fields per note.");
  } finally {
    $("#anki-notes-file").value = "";
  }
}

window.receiveAnkiPackageStatus = (message) => { $("#anki-import-status").textContent = message; };
window.receiveAnkiPackageImport = (payload) => {
  try {
    const parsed = cardsFromAnkiPackageNotes(payload.notes);
    saveImportedFlashcards({ fileName: payload.name, type: "apkg", cards: parsed.cards, skipped: parsed.skipped });
  } catch (error) {
    $("#anki-import-status").textContent = error?.message || "This APKG package could not be imported.";
    showToast("I couldn’t find readable flashcards in that APKG package.");
  }
};
window.receiveAnkiPackageImportError = (message) => {
  $("#anki-import-status").textContent = message;
  showToast("This APKG package could not be imported.");
};
window.receiveDocumentImport = (payload) => {
  try {
    if (notebookDocumentImportPending) {
      notebookDocumentImportPending = false;
      createImportedNotebookNote(payload);
      $("#notes-import-file").value = "";
      $("#import-notes").disabled = false;
      return;
    }
    loadImportedDocument(payload);
  }
  catch (error) { window.receiveDocumentImportError(error?.message || "This document could not be read."); }
};
window.receiveDocumentImportStatus = (message) => {
  if (notebookDocumentImportPending) {
    showToast(message);
    $("#import-notes").disabled = true;
    return;
  }
  $("#anki-import-status").textContent = message;
  $("#choose-anki-notes").disabled = true;
};
window.receiveDocumentImportError = (message) => {
  if (notebookDocumentImportPending) {
    notebookDocumentImportPending = false;
    $("#notes-import-file").value = "";
    $("#import-notes").disabled = false;
    showToast(message || "This document could not be imported.");
    return;
  }
  $("#anki-import-status").textContent = message || "This PDF or PowerPoint could not be imported.";
  $("#anki-notes-file").value = "";
  $("#choose-anki-notes").disabled = false;
  showToast("This document could not be imported.");
};
window.receiveNotebookDocumentImport = (payload) => {
  try {
    notebookDocumentImportPending = false;
    createImportedNotebookNote(payload);
    $("#notes-import-file").value = "";
    $("#import-notes").disabled = false;
  } catch (error) {
    window.receiveNotebookDocumentImportError(error?.message || "This document could not be read.");
  }
};
window.receiveNotebookDocumentImportStatus = (message) => {
  $("#import-notes").disabled = true;
  showToast(message);
};
window.receiveNotebookDocumentImportError = (message) => {
  notebookDocumentImportPending = false;
  $("#notes-import-file").value = "";
  $("#import-notes").disabled = false;
  showToast(message || "This document could not be imported.");
};

function handleStudyFileResult(result) {
  const status = $("#anki-import-status");
  if (!result || result.canceled) return;
  if (result.error) { status.textContent = result.error; showToast("This file could not be imported."); return; }
  try {
    if (result.kind === "apkg") {
      const parsed = cardsFromAnkiPackageNotes(result.payload.notes);
      saveImportedFlashcards({ fileName: result.payload.name, type: "apkg", cards: parsed.cards, skipped: parsed.skipped });
    } else if (result.kind === "text") {
      const parsed = parseAnkiNotes(result.name, result.text);
      saveImportedFlashcards({ fileName: result.name, type: result.extension, cards: parsed.cards });
    } else if (result.kind === "document") loadImportedDocument(result);
  } catch (error) {
    status.textContent = error?.message || "This file could not be imported.";
    showToast("I couldn’t find readable study material in that file.");
  }
}

async function importDroppedStudyFile(file) {
  const extension = String(file?.name || "").split(".").pop().toLowerCase();
  if (!file || !["apkg", "pdf", "pptx", "txt", "csv", "tsv"].includes(extension)) { showToast("Drop an APKG, PDF, PPTX, TXT, CSV, or TSV file."); return; }
  $("#anki-import-status").textContent = `Reading ${file.name}…`;
  if (window.desktopApp?.readDroppedStudyFile) { handleStudyFileResult(await window.desktopApp.readDroppedStudyFile(file)); return; }
  if (["txt", "csv", "tsv"].includes(extension)) { await importAnkiNotesFile(file); return; }
  if (window.webkit?.messageHandlers?.studyDroppedFile) {
    const reader = new FileReader();
    reader.onerror = () => window.receiveDocumentImportError("The dropped file could not be read.");
    reader.onload = () => window.webkit.messageHandlers.studyDroppedFile.postMessage({ name: file.name, data: String(reader.result || "") });
    reader.readAsDataURL(file);
    return;
  }
  showToast("Drop PDF, PowerPoint, and APKG files into the desktop app.");
}

$("#choose-anki-notes").addEventListener("click", async () => {
  if (!window.desktopApp?.chooseStudyFile) { $("#anki-notes-file").click(); return; }
  const status = $("#anki-import-status");
  status.textContent = "Choose an APKG, PDF, PPTX, TXT, CSV, or TSV file.";
  const result = await window.desktopApp.chooseStudyFile();
  handleStudyFileResult(result);
});
const studyFileDropZone = $("#study-file-drop-zone");
["dragenter", "dragover"].forEach((type) => studyFileDropZone.addEventListener(type, (event) => { event.preventDefault(); event.stopPropagation(); studyFileDropZone.classList.add("drag-over"); }));
["dragleave", "drop"].forEach((type) => studyFileDropZone.addEventListener(type, (event) => { event.preventDefault(); event.stopPropagation(); studyFileDropZone.classList.remove("drag-over"); }));
studyFileDropZone.addEventListener("drop", (event) => { const file = event.dataTransfer?.files?.[0]; if (file) importDroppedStudyFile(file); });
function normalizedStudyItem(value) {
  return String(value || "").toLowerCase().replace(/<[^>]*>/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function appendUniqueStudyItems(existing, incoming, keyForItem) {
  const keys = new Set(existing.map((item) => keyForItem(item)));
  const additions = incoming.filter((item) => {
    const key = keyForItem(item);
    if (!key || keys.has(key)) return false;
    keys.add(key);
    return true;
  });
  return { items: [...existing, ...additions], added: additions.length };
}

$("#notes-input").addEventListener("paste", (event) => {
  const clipboard = event.clipboardData;
  if (!clipboard) return;
  const richHtml = clipboard.getData("text/html");
  const plainText = clipboard.getData("text/plain");
  if (!richHtml && !plainText) return;
  let startedNewSet = false;
  if (state.editingCustomDeckId || state.editingBuiltInCollectionId) {
    const createNew = window.confirm("Create a new study set from the pasted notes?\n\nChoose Cancel to add only new, nonduplicate material to the end of this set.");
    if (createNew) {
      resetCustomDraft();
      startedNewSet = true;
      showToast("Starting a new study set from the pasted notes.");
    } else {
      state.appendNotesToExistingSet = true;
      showToast("New material will be added to the end; duplicates will be skipped.");
    }
  }
  event.preventDefault();
  if (startedNewSet) {
    setNotesContent(plainText, richHtml ? sanitizeNotesHtml(richHtml) : "");
    $("#custom-deck-name").focus();
    return;
  }
  if (richHtml) document.execCommand("insertHTML", false, sanitizeNotesHtml(richHtml));
  else document.execCommand("insertText", false, plainText);
});
$("#notes-input").addEventListener("input", () => {
  if (notesPlainText()) state.notesHiddenAfterUpdate = false;
});
$("#anki-notes-file").addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  if (["apkg", "pdf", "pptx"].includes(extension)) {
    $("#anki-import-status").textContent = `Reading ${file.name}…`;
    if (window.desktopApp?.readDroppedStudyFile) {
      handleStudyFileResult(await window.desktopApp.readDroppedStudyFile(file));
      event.currentTarget.value = "";
      return;
    }
    if (window.webkit?.messageHandlers?.studyDroppedFile) {
      const reader = new FileReader();
      reader.onerror = () => window.receiveDocumentImportError("The selected file could not be read.");
      reader.onload = () => window.webkit.messageHandlers.studyDroppedFile.postMessage({ name: file.name, data: String(reader.result || ""), target: "create" });
      reader.readAsDataURL(file);
      return;
    }
  }
  await importAnkiNotesFile(file);
});

$("#generate-note-cards").addEventListener("click", () => {
  if (state.editingBuiltInCollectionId) {
    const notes = notesPlainText();
    if (state.appendNotesToExistingSet && notes) {
      const generated = generateCardsFromNotes(notes);
      const cardResult = appendUniqueStudyItems(state.customDraft, generated, (card) => normalizedStudyItem(card.front || card.frontImage));
      const questionResult = appendUniqueStudyItems(state.customQuestionDraft, generateQuestionsFromCards(generated), (question) => normalizedStudyItem(question.prompt));
      const promptResult = appendUniqueStudyItems(state.customFeynmanDraft, generateFeynmanPrompts(notes, generated), (item) => normalizedStudyItem(item.prompt));
      state.customDraft = cardResult.items;
      state.customQuestionDraft = questionResult.items;
      state.customFeynmanDraft = promptResult.items;
      state.appendNotesToExistingSet = false;
      renderCustomDraft(); renderCustomQuestionDraft(); renderCustomFeynmanDraft();
      saveBuiltInCollectionOverride({ notify: false });
      setNotesContent();
      showToast(`Added ${cardResult.added} new cards, ${questionResult.added} questions, and ${promptResult.added} Feynman prompts. Duplicates were skipped.`);
      return;
    }
    saveBuiltInCollectionOverride();
    return;
  }
  const name = $("#custom-deck-name").value.trim();
  const notes = notesPlainText();
  if (!name) { $("#custom-deck-name").focus(); showToast("Give this study set a name first."); return; }
  const hasStudyContent = hasAnyStudyItem();
  if (!notes && hasStudyContent) {
    const deck = saveCustomDeck({ resetAfterSave: false, notify: false });
    if (!deck) return;
    clearNotesAfterUpdate();
    showToast(`${deck.name} updated with ${deck.cards.length} cards, ${deck.questions.length} questions, and ${deck.feynmanPrompts.length} Feynman prompts.`);
    return;
  }
  if (!notes) { showToast("Add at least one flashcard, question, or Feynman topic."); return; }
  const savedDeck = state.editingCustomDeckId ? loadCustomDecks().find((deck) => deck.id === state.editingCustomDeckId) : null;
  const notesChanged = !savedDeck || notes !== String(savedDeck.sourceNotes || "").trim() || savedDeck.generatorVersion !== NOTES_GENERATOR_VERSION;
  if (notesChanged) {
    const generated = generateCardsFromNotes(notes);
    if (!generated.length) { showToast("I couldn’t find clear facts. Try term: definition or question — answer formatting."); return; }
    state.customImportSource = null;
    if (state.appendNotesToExistingSet && savedDeck) {
      const cardResult = appendUniqueStudyItems(state.customDraft, generated, (card) => normalizedStudyItem(card.front || card.frontImage));
      const questionResult = appendUniqueStudyItems(state.customQuestionDraft, generateQuestionsFromCards(generated), (question) => normalizedStudyItem(question.prompt));
      const promptResult = appendUniqueStudyItems(state.customFeynmanDraft, generateFeynmanPrompts(notes, generated), (item) => normalizedStudyItem(item.prompt));
      state.customDraft = cardResult.items;
      state.customQuestionDraft = questionResult.items;
      state.customFeynmanDraft = promptResult.items;
      state.appendNotesToExistingSet = false;
      state.lastAppendSummary = { cards: cardResult.added, questions: questionResult.added, prompts: promptResult.added };
    } else {
      const manualCards = state.customDraft.filter((card) => card.manual);
      const manualQuestions = state.customQuestionDraft.filter((question) => question.source === "Manually created");
      state.customDraft = [...generated, ...manualCards];
      state.customQuestionDraft = [...generateQuestionsFromCards(generated), ...manualQuestions];
      const manualFeynmanPrompts = state.customFeynmanDraft.filter((item) => item.manual);
      state.customFeynmanDraft = [...generateFeynmanPrompts(notes, generated), ...manualFeynmanPrompts];
    }
    renderCustomDraft();
    renderCustomQuestionDraft();
    renderCustomFeynmanDraft();
  }
  const deck = state.editingCustomDeckId
    ? saveCustomDeck({ resetAfterSave: false, notify: false })
    : saveGeneratedCustomDeckInPlace();
  if (!deck) return;
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  clearNotesAfterUpdate();
  const appended = state.lastAppendSummary;
  state.lastAppendSummary = null;
  showToast(appended ? `Added ${appended.cards} new cards, ${appended.questions} questions, and ${appended.prompts} Feynman prompts. Duplicates were skipped.` : `${deck.name} updated with ${deck.cards.length} cards, ${deck.questions.length} questions, and ${deck.feynmanPrompts.length} Feynman prompts.`);
});
$$("[data-create-tab]").forEach((button) => button.addEventListener("click", () => selectCreateContentTab(button.dataset.createTab)));
$$("[data-card-maker-mode]").forEach((button) => button.addEventListener("click", () => setCardMakerMode(button.dataset.cardMakerMode)));
$("#add-characteristic-field").addEventListener("click", () => {
  if (state.customCharacteristicFields.length >= 15) return;
  const number = state.customCharacteristicFields.length + 1;
  const field = { id: makeLocalId("characteristic"), name: "Column " + number, value: "", front: false, back: true };
  state.customCharacteristicFields.push(field);
  if (state.customCharacteristicFields.length > 2) {
    state.extraColumnsOnly = true;
    const basicModeButton = $('[data-card-maker-mode="basic"]');
    if (basicModeButton) basicModeButton.hidden = true;
  }
  renderCharacteristicCardMaker();
  document.querySelector('[data-characteristic-name="' + field.id + '"]')?.select();
});
$("#add-characteristic-card").addEventListener("click", addCharacteristicCard);
$("#add-manual-card").addEventListener("click", () => {
  const front = $("#manual-card-front").value.trim();
  const back = $("#manual-card-back").value.trim();
  if ((!front && !state.manualFrontImage) || (!back && !state.manualBackImage)) { showToast("Add text or an image to both sides of the card."); return; }
  state.customDraft.push({ id: makeLocalId("card"), front, back, frontImage: state.manualFrontImage, backImage: state.manualBackImage, manual: true });
  $("#manual-card-front").value = "";
  $("#manual-card-back").value = "";
  state.manualFrontImage = "";
  state.manualBackImage = "";
  renderManualImagePreview("front");
  renderManualImagePreview("back");
  renderCustomDraft();
  $("#manual-card-front").focus();
  showToast("Manual card added. Choose Update set to keep it.");
});
$$('[data-choose-manual-image]').forEach((button) => button.addEventListener("click", () => {
  state.pendingCardImageTarget = { kind: "manual", side: button.dataset.chooseManualImage };
  $("#flashcard-image-file").click();
}));
$$('[data-draw-manual]').forEach((button) => button.addEventListener("click", () => openDrawingTool({ kind: "manual", side: button.dataset.drawManual })));
$$('[data-math-manual]').forEach((button) => button.addEventListener("click", () => openMathTool({ kind: "manual", side: button.dataset.mathManual })));
$$('[data-code-manual]').forEach((button) => button.addEventListener("click", () => openCodeTool({ kind: "manual", side: button.dataset.codeManual })));
$$('[data-remove-manual-image]').forEach((button) => button.addEventListener("click", () => confirmImageRemoval(button, () => applyCardImage({ kind: "manual", side: button.dataset.removeManualImage }, ""))));
$("#manual-card-front").addEventListener("paste", (event) => handleCardPaste(event, { kind: "manual", side: "front" }));
$("#manual-card-back").addEventListener("paste", (event) => handleCardPaste(event, { kind: "manual", side: "back" }));
$("#flashcard-image-file").addEventListener("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (file) acceptCardImage(file, state.pendingCardImageTarget);
  event.currentTarget.value = "";
  state.pendingCardImageTarget = null;
});

const drawingCanvas = $("#flashcard-drawing-canvas");
const drawingContext = drawingCanvas.getContext("2d");
let drawingPointerActive = false;
function drawingPoint(event) {
  const rect = drawingCanvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * drawingCanvas.width / rect.width, y: (event.clientY - rect.top) * drawingCanvas.height / rect.height };
}
function restoreDrawingSnapshot(dataUrl) {
  drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  if (!dataUrl) return;
  const image = new Image(); image.onload = () => drawingContext.drawImage(image, 0, 0, drawingCanvas.width, drawingCanvas.height); image.src = dataUrl;
}
drawingCanvas.addEventListener("pointerdown", (event) => {
  event.preventDefault(); drawingPointerActive = true; drawingCanvas.setPointerCapture(event.pointerId);
  state.drawingHistory.push(drawingCanvas.toDataURL("image/png")); if (state.drawingHistory.length > 24) state.drawingHistory.shift();
  const point = drawingPoint(event); drawingContext.beginPath(); drawingContext.moveTo(point.x, point.y);
});
drawingCanvas.addEventListener("pointermove", (event) => {
  if (!drawingPointerActive) return; event.preventDefault(); const point = drawingPoint(event);
  drawingContext.lineWidth = Number($("#drawing-size").value) || 6; drawingContext.lineCap = "round"; drawingContext.lineJoin = "round";
  drawingContext.globalCompositeOperation = state.drawingTool === "eraser" ? "destination-out" : "source-over";
  drawingContext.strokeStyle = $("#drawing-color").value; drawingContext.lineTo(point.x, point.y); drawingContext.stroke();
});
function finishDrawingPointer() { drawingPointerActive = false; drawingContext.closePath(); drawingContext.globalCompositeOperation = "source-over"; }
drawingCanvas.addEventListener("pointerup", finishDrawingPointer);
drawingCanvas.addEventListener("pointercancel", finishDrawingPointer);
$$('[data-drawing-tool]').forEach((button) => button.addEventListener("click", () => { state.drawingTool = button.dataset.drawingTool; $$('[data-drawing-tool]').forEach((item) => item.classList.toggle("active", item === button)); }));
$("#drawing-undo").addEventListener("click", () => restoreDrawingSnapshot(state.drawingHistory.pop()));
$("#drawing-clear").addEventListener("click", () => { state.drawingHistory.push(drawingCanvas.toDataURL("image/png")); drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); });
$("#save-drawing").addEventListener("click", () => { if (!state.pendingDrawingTarget) return; applyCardImage(state.pendingDrawingTarget, drawingCanvas.toDataURL("image/png")); closeDrawingTool(); showToast("Drawing added to the card."); });
$("#close-drawing-dialog").addEventListener("click", closeDrawingTool);
$("#cancel-drawing").addEventListener("click", closeDrawingTool);
$("#drawing-dialog").addEventListener("cancel", (event) => { event.preventDefault(); closeDrawingTool(); });

$("#math-expression").addEventListener("input", updateMathPreview);
$("#math-glossary-search").addEventListener("input", (event) => renderMathGlossary(event.currentTarget.value));
$("#insert-math").addEventListener("click", insertMathIntoCard);
$("#math-expression").addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") insertMathIntoCard(); });
$("#close-math-dialog").addEventListener("click", closeMathTool);
$("#cancel-math").addEventListener("click", closeMathTool);
$("#math-dialog").addEventListener("cancel", (event) => { event.preventDefault(); closeMathTool(); });
$("#code-expression").addEventListener("input", updateCodePreview);
$("#code-language").addEventListener("change", updateCodePreview);
$("#code-line-numbers").addEventListener("change", updateCodePreview);
$("#insert-code").addEventListener("click", insertCodeIntoCard);
$("#code-expression").addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") insertCodeIntoCard(); });
$("#close-code-dialog").addEventListener("click", closeCodeTool);
$("#cancel-code").addEventListener("click", closeCodeTool);
$("#code-dialog").addEventListener("cancel", (event) => { event.preventDefault(); closeCodeTool(); });
$("#clear-draft").addEventListener("click", () => {
  if (!state.customDraft.length) return;
  if (!window.confirm(`Clear all ${state.customDraft.length} flashcards from this draft? Questions and Feynman topics will be kept.`)) return;
  state.customDraft = [];
  renderCustomDraft();
  updateCustomSaveButtons();
  showToast("All flashcards cleared. Choose Update set to save the change.");
});
$("#clear-question-draft").addEventListener("click", () => {
  if (!state.customQuestionDraft.length) return;
  if (!window.confirm(`Clear all ${state.customQuestionDraft.length} questions from this draft? Flashcards and Feynman topics will be kept.`)) return;
  state.customQuestionDraft = [];
  renderCustomQuestionDraft();
  updateCustomSaveButtons();
  showToast("All questions cleared. Choose Update set to save the change.");
});
$("#clear-feynman-draft").addEventListener("click", () => {
  if (!state.customFeynmanDraft.length) return;
  if (!window.confirm(`Clear all ${state.customFeynmanDraft.length} Feynman topics from this draft? Flashcards and questions will be kept.`)) return;
  state.customFeynmanDraft = [];
  renderCustomFeynmanDraft();
  updateCustomSaveButtons();
  showToast("All Feynman topics cleared. Choose Update set to save the change.");
});
$("#add-manual-question").addEventListener("click", () => {
  const prompt = $("#manual-question-prompt").value.trim();
  const answer = $("#manual-question-answer").value.trim();
  if (!prompt || !answer) { showToast("Complete both the question and its answer."); return; }
  state.customQuestionDraft.push({ id: makeLocalId("question"), type: $("#manual-question-type").value, prompt, answer, source: "Manually created" });
  $("#manual-question-prompt").value = "";
  $("#manual-question-answer").value = "";
  renderCustomQuestionDraft();
  $("#manual-question-prompt").focus();
});
function addManualFeynmanTopic() {
  const input = $("#manual-feynman-topic");
  const prompt = input.value.trim().replace(/[.!]+$/, "");
  if (!prompt) { input.focus(); showToast("Type a Feynman topic first."); return; }
  state.customFeynmanDraft.push({ id: makeLocalId("feynman"), prompt, manual: true });
  input.value = "";
  renderCustomFeynmanDraft();
  input.focus();
  showToast("Feynman topic added. Choose Update set to keep it.");
}
$("#add-manual-feynman").addEventListener("click", addManualFeynmanTopic);
$("#manual-feynman-topic").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addManualFeynmanTopic(); } });
$("#new-custom-study-set").addEventListener("click", () => {
  const hasDraft = hasAnyStudyItem() || $("#custom-deck-name").value.trim() || notesPlainText();
  let updatedName = "";
  if (state.editingBuiltInCollectionId) {
    const updated = saveBuiltInCollectionOverride({ notify: false });
    if (!updated) return;
    updatedName = updated.name;
  } else if (state.editingCustomDeckId) {
    const savedDeck = loadCustomDecks().find((deck) => deck.id === state.editingCustomDeckId);
    const notes = notesPlainText();
    if (savedDeck && notes && (notes !== String(savedDeck.sourceNotes || "").trim() || savedDeck.generatorVersion !== NOTES_GENERATOR_VERSION)) {
      const generated = generateCardsFromNotes(notes);
      if (!generated.length) { $("#notes-input").focus(); showToast("I couldn’t update this set from those notes yet."); return; }
      state.customImportSource = null;
      const manualCards = state.customDraft.filter((card) => card.manual);
      const manualQuestions = state.customQuestionDraft.filter((question) => question.source === "Manually created");
      state.customDraft = [...generated, ...manualCards];
      state.customQuestionDraft = [...generateQuestionsFromCards(generated), ...manualQuestions];
      const manualFeynmanPrompts = state.customFeynmanDraft.filter((item) => item.manual);
      state.customFeynmanDraft = [...generateFeynmanPrompts(notes, generated), ...manualFeynmanPrompts];
    }
    const updated = saveCustomDeck({ resetAfterSave: false, notify: false });
    if (!updated) return;
    updatedName = updated.name;
  } else if (hasDraft && !window.confirm("Start a new study set? This unsaved draft will be cleared.")) return;
  resetCustomDraft();
  $("#custom-deck-name").focus();
  showToast(updatedName ? `${updatedName} updated. New blank study set ready.` : "New study set ready.");
});
$("#close-custom-study").addEventListener("click", () => showAppView(state.customStudyReturnView));
$("#delete-all-study-sets").addEventListener("click", deleteAllStudySets);
$("#create-study-folder").addEventListener("click", createStudyFolder);
$("#return-all-built-in-decks").addEventListener("click", returnAllBuiltInDecks);
$("#return-all-textbooks").addEventListener("click", returnAllTextbooks);
$("#my-study-sets-search").addEventListener("input", debounce(renderCustomDecks));
$("#built-in-study-search").addEventListener("input", debounce(() => { state.studyCatalogPage = 0; renderBuiltInDecks(); }));
$("#cancel-custom-delete").addEventListener("click", () => { state.pendingCustomDeleteId = null; state.pendingBuiltInDeleteId = null; state.pendingDeleteAllStudySets = false; state.pendingReturnAllBuiltIn = false; state.pendingReturnAllTextbooks = false; showAppView(state.customDeleteReturnView); });
$("#confirm-custom-delete").addEventListener("click", confirmCustomDeckDeletion);
$$('[data-custom-study-mode]').forEach((button) => button.addEventListener("click", () => startCustomReview(button.dataset.customStudyMode)));
$("#close-custom-review").addEventListener("click", closeCustomReview);
function revealCustomReviewCard() {
  if (!["regular", "anki"].includes(state.customReviewMode)) return;
  state.customReviewRevealed = true;
  if (state.customReviewMode === "anki") state.customReviewWasRevealed = true;
  renderCustomReviewCard();
}
function toggleCustomReviewCard() {
  if (!["regular", "anki"].includes(state.customReviewMode)) return;
  state.customReviewRevealed = !state.customReviewRevealed;
  if (state.customReviewMode === "anki" && state.customReviewRevealed) state.customReviewWasRevealed = true;
  renderCustomReviewCard();
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable || event.metaKey || event.ctrlKey || event.altKey) return;
  const textbookReview = state.activeView === "anki" && state.ankiReviewActive ? $(".anki-review", $("#lesson-view")) : null;
  const customReview = state.customReviewMode === "anki" && !$("#custom-review-view")?.hidden;
  if (!textbookReview && !customReview) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (textbookReview) setTextbookAnkiReveal(textbookReview, !textbookReview.classList.contains("revealed"));
    else if (customReview) toggleCustomReviewCard();
    return;
  }
  const rating = { "1": "again", "2": "hard", "3": "good", "4": "easy" }[event.key];
  if (!rating) return;
  if (textbookReview?.classList.contains("ratings-ready")) { event.preventDefault(); rateAnkiCard(rating); }
  else if (customReview && state.customReviewWasRevealed) { event.preventDefault(); rateCustomAnkiCard(rating); }
});
$("#custom-review-card").addEventListener("click", toggleCustomReviewCard);
$("#custom-review-reveal").addEventListener("click", revealCustomReviewCard);
$("#delete-custom-anki-card").addEventListener("click", deleteCurrentCustomAnkiCard);
$("#custom-review-previous").addEventListener("click", () => { if (state.customReviewPosition > 0) { state.customReviewPosition -= 1; state.customReviewRevealed = false; state.customReviewWasRevealed = false; renderCustomReviewCard(); } });
$("#custom-review-next").addEventListener("click", () => {
  if (state.customReviewPosition >= state.customReviewCards.length - 1) { recordStudyActivity(); closeCustomReview(); return; }
  state.customReviewPosition += 1;
  state.customReviewRevealed = false;
  state.customReviewWasRevealed = false;
  renderCustomReviewCard();
});
$("#custom-question-previous").addEventListener("click", () => moveCustomQuestion(-1));
$("#check-custom-question").addEventListener("click", () => answerCustomQuestion());
$("#custom-question-next").addEventListener("click", () => moveCustomQuestion(1));
$("#custom-feynman-time-amount").addEventListener("input", (event) => {
  state.customFeynmanTimeAmount = Math.max(1, Math.min(120, Number(event.currentTarget.value) || 1));
  if (!state.customFeynmanStartedAt) $("#custom-feynman-countdown").textContent = formatElapsed(customFeynmanDurationSeconds() * 1000);
});
$("#custom-feynman-time-unit").addEventListener("change", (event) => {
  state.customFeynmanTimeUnit = event.currentTarget.value;
  if (!state.customFeynmanStartedAt) $("#custom-feynman-countdown").textContent = formatElapsed(customFeynmanDurationSeconds() * 1000);
});
$("#start-custom-feynman-timer").addEventListener("click", startCustomFeynmanTimer);
$("#custom-feynman-previous").addEventListener("click", () => moveCustomFeynman(-1));
$("#custom-feynman-next").addEventListener("click", () => moveCustomFeynman(1));
$$('[data-custom-anki-rating]').forEach((button) => button.addEventListener("click", () => rateCustomAnkiCard(button.dataset.customAnkiRating)));
$("#remove-custom-anki-study").addEventListener("dblclick", removeCurrentCustomAnkiFromStudy);

$("#open-settings").addEventListener("click", () => { showAppView("settings"); renderStorageHealth(); });
$("#refresh-storage-health").addEventListener("click", renderStorageHealth);
$$('[data-settings-tab]').forEach((button) => button.addEventListener("click", () => selectSettingsTab(button.dataset.settingsTab)));
$("#settings-form").addEventListener("change", (event) => { if (event.target.name === "theme") applyTheme(event.target.value); });
$("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const profileName = $("#settings-profile-name").value.trim();
  const birthMonth = Number($("#settings-profile-birth-month").value);
  const birthDay = Number($("#settings-profile-birth-day").value);
  if (!profileName || !birthMonth || !birthDay) { showToast("Add your name, birth month, and birth day."); return; }
  const settings = settingsFromForm();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  const profile = { name: profileName, birthday: `${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}` };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  applyTheme(settings.theme);
  applyProfile(profile);
  celebrateBirthday(profile);
  populateSettingsForm();
  showToast("Profile and settings saved.");
});
$("#reset-settings").addEventListener("click", () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  applyTheme(DEFAULT_SETTINGS.theme);
  populateSettingsForm();
  showToast("Settings restored to defaults.");
});

$$("[data-toast]").forEach((element) => element.addEventListener("click", () => showToast(element.dataset.toast)));

function initializeNotesWorkspace() {
try {
const paletteLightnesses = [12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 89, 93, 97];
const paletteFamilies = [
  { name: "Gray", hue: 0, saturation: 0 },
  { name: "Brown", hue: 28, saturation: 48 },
  { name: "Red", hue: 0, saturation: 78 },
  { name: "Orange", hue: 25, saturation: 88 },
  { name: "Yellow", hue: 48, saturation: 88 },
  { name: "Lime", hue: 85, saturation: 70 },
  { name: "Green", hue: 130, saturation: 65 },
  { name: "Teal", hue: 175, saturation: 65 },
  { name: "Cyan", hue: 195, saturation: 75 },
  { name: "Blue", hue: 215, saturation: 80 },
  { name: "Purple", hue: 265, saturation: 72 },
  { name: "Pink", hue: 330, saturation: 78 },
];
const expandedColors = paletteFamilies.flatMap((family) => paletteLightnesses.map((lightness) => ({
  value: `hsl(${family.hue} ${family.saturation}% ${lightness}%)`,
  label: `${family.name} ${lightness}`,
})));
["drawing-note-color", "canvas-text-color"].forEach((inputId) => {
  const palette = document.querySelector(`[data-color-palette-for="${inputId}"]`)?.parentElement?.querySelector(".inline-color-palette");
  if (!palette) return;
  const control = palette.closest(".inline-color-control");
  const quickColors = ["#171b2d", "#e05252", "#f59e0b", "#f2d34f", "#2fac7f", "#3b82f6", "#665ee8"];
  palette.classList.add("quick-color-palette");
  const quickSwatches = quickColors.map((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.dataset.pickColor = color;
    swatch.style.setProperty("--swatch", color);
    swatch.setAttribute("aria-label", `Choose ${color}`);
    return swatch;
  });
  const moreButton = document.createElement("button");
  moreButton.type = "button";
  moreButton.className = "more-colors-swatch";
  moreButton.dataset.moreColorsFor = inputId;
  moreButton.setAttribute("aria-label", "More colors");
  moreButton.title = "More colors";
  moreButton.textContent = "+";
  palette.replaceChildren(...quickSwatches, moreButton);
  let fullPalette = control.querySelector(".full-color-palette");
  if (!fullPalette) {
    fullPalette = document.createElement("div");
    fullPalette.className = "inline-color-palette full-color-palette";
    fullPalette.setAttribute("role", "menu");
    fullPalette.hidden = true;
    control.appendChild(fullPalette);
  }
  fullPalette.replaceChildren(...expandedColors.map((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.dataset.pickColor = color.value;
    swatch.style.setProperty("--swatch", color.value);
    swatch.setAttribute("aria-label", `Choose ${color.label}`);
    return swatch;
  }));
});
$("#new-note-folder").addEventListener("click", createNoteFolder);
$("#import-notes").addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (window.webkit?.messageHandlers?.notebookImportFile) {
    window.webkit.messageHandlers.notebookImportFile.postMessage({});
    return;
  }
  $("#notes-import-file").click();
});
$("#notes-import-file").addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();
  try {
    if (extension === "pdf") {
      await createImportedPdfNotebookNote(file);
      event.currentTarget.value = "";
      return;
    }
    if (["txt", "md"].includes(extension)) {
      createImportedNotebookNote({ name: file.name, text: await file.text() });
      event.currentTarget.value = "";
      return;
    }
    if (extension === "pptx" && window.desktopApp?.readDroppedStudyFile) {
      handleNotebookImportResult(await window.desktopApp.readDroppedStudyFile(file));
      event.currentTarget.value = "";
      return;
    }
    if (extension === "pptx" && window.webkit?.messageHandlers?.studyDroppedFile) {
      notebookDocumentImportPending = true;
      const reader = new FileReader();
      reader.onerror = () => window.receiveDocumentImportError("The selected file could not be read.");
      reader.onload = () => window.webkit.messageHandlers.studyDroppedFile.postMessage({ name: file.name, data: String(reader.result || ""), target: "notes" });
      reader.readAsDataURL(file);
      return;
    }
    throw new Error("PDF and PowerPoint note importing is available in the Mac and Windows desktop apps.");
  } catch (error) {
    event.currentTarget.value = "";
    showToast(error?.message || "This note could not be imported.");
  }
});
$("#close-note-folder-dialog").addEventListener("click", () => $("#note-folder-dialog").close());
$("#cancel-note-folder").addEventListener("click", () => $("#note-folder-dialog").close());
$("#note-folder-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (saveNoteFolderDialog()) $("#note-folder-dialog").close();
});
$("#notes-search").addEventListener("input", renderNotesList);
$$('[data-delete-note]').forEach((button) => button.addEventListener("click", deleteActiveNotebookNote));
$("#close-note-actions").addEventListener("click", closeNoteActions);
$("#cancel-note-actions").addEventListener("click", closeNoteActions);
$("#note-actions-form").addEventListener("submit", (event) => event.preventDefault());
$("#note-actions-copy").addEventListener("click", () => {
  if (!noteActionsNoteId) return;
  if (activeNoteId !== noteActionsNoteId) openNotebookNote(noteActionsNoteId);
  $("#note-actions-dialog").close();
  duplicateActiveNotebookNote().catch(() => showToast("This note could not be copied."));
  noteActionsNoteId = null;
});
$("#note-actions-create-cards").addEventListener("click", () => {
  if (!noteActionsNoteId) return;
  const noteId = noteActionsNoteId;
  $("#note-actions-dialog").close();
  noteActionsNoteId = null;
  createFlashcardsFromNotebookNote(noteId);
});
$("#word-note-title").addEventListener("input", queueWordNoteSave);
$("#word-note-content").addEventListener("input", queueWordNoteSave);
$("#word-note-content").addEventListener("keyup", rememberNoteTextSelection);
$("#word-note-content").addEventListener("pointerup", rememberNoteTextSelection);
$$('[data-note-command], [data-note-block]').forEach((button) => button.addEventListener("pointerdown", (event) => {
  // Keep the editor selection active while a formatting control is pressed.
  event.preventDefault();
}));
$("#drawing-note-title").addEventListener("input", () => {
  updateNotebookNote({ title: $("#drawing-note-title").value.trim() || "Untitled drawing" });
  $("#drawing-note-status").textContent = "Saved locally";
});
$("#pdf-note-title").addEventListener("input", () => {
  updateNotebookNote({ title: $("#pdf-note-title").value.trim() || "Imported PDF" });
});
$("#document-page-add").addEventListener("click", () => {
  saveDocumentEditor(activeDocumentEditor());
  noteDocumentPages.push("");
  notePageCount = noteDocumentPages.length;
  activeDocumentPage = noteDocumentPages.length - 1;
  configureNoteCanvas("page", notePageCount, "document");
  renderDrawingNoteVectors();
  renderDocumentPages(activeDocumentPage);
  saveDrawingNote();
});
$("#document-page-remove").addEventListener("click", () => {
  if (noteDocumentPages.length <= 1) return;
  if (!window.confirm(`Remove document page ${activeDocumentPage + 1}?`)) return;
  removeSharedNotePage(activeDocumentPage);
  configureNoteCanvas("page", notePageCount, "document");
  renderDrawingNoteVectors();
  renderDocumentPages(activeDocumentPage);
  saveDrawingNote();
});
$$("[data-document-command], [data-document-block], [data-document-table]").forEach((button) => button.addEventListener("pointerdown", (event) => event.preventDefault()));
$$('.document-toolbar-menu').forEach((menu) => menu.addEventListener("toggle", () => {
  if (!menu.open) return;
  $$('.document-toolbar-menu').forEach((otherMenu) => {
    if (otherMenu !== menu) otherMenu.open = false;
  });
}));
$$("[data-document-command]").forEach((button) => button.addEventListener("click", () => {
  const editor = activeDocumentEditor();
  if (!editor) return;
  editor.focus();
  document.execCommand(button.dataset.documentCommand, false);
  saveDocumentEditor(editor);
}));
$$("[data-document-line-spacing]").forEach((button) => button.addEventListener("click", () => {
  noteDocumentLineSpacing = button.dataset.documentLineSpacing;
  $$(".page-document-content").forEach((editor) => { editor.style.lineHeight = noteDocumentLineSpacing; });
  saveDrawingNote();
}));
$("#document-show-page-numbers").addEventListener("change", (event) => {
  noteShowPageNumbers = event.currentTarget.checked;
  $$(".document-printed-page-number").forEach((number) => { number.hidden = !noteShowPageNumbers; });
  saveDrawingNote();
});
$$("[data-document-block]").forEach((button) => button.addEventListener("click", () => {
  const editor = activeDocumentEditor();
  if (!editor) return;
  editor.focus();
  document.execCommand("formatBlock", false, button.dataset.documentBlock);
  saveDocumentEditor(editor);
}));
$("#document-insert-table").addEventListener("click", () => {
  const editor = activeDocumentEditor();
  if (!editor) return;
  const requestedRows = window.prompt("How many rows?", "3");
  if (requestedRows === null) return;
  const rows = Math.max(1, Math.min(20, Number(requestedRows) || 1));
  const requestedColumns = window.prompt("How many columns?", "3");
  if (requestedColumns === null) return;
  const columns = Math.max(1, Math.min(12, Number(requestedColumns) || 1));
  editor.focus();
  const header = `<tr>${Array.from({ length: columns }, (_, index) => `<th>Column ${index + 1}</th>`).join("")}</tr>`;
  const body = Array.from({ length: Math.max(0, rows - 1) }, () => `<tr>${"<td><br></td>".repeat(columns)}</tr>`).join("");
  document.execCommand("insertHTML", false, `<table><thead>${header}</thead><tbody>${body}</tbody></table><p><br></p>`);
  saveDocumentEditor(editor);
});
$("#document-text-font").addEventListener("change", (event) => {
  const editor = activeDocumentEditor(); if (!editor) return;
  editor.focus(); document.execCommand("fontName", false, event.currentTarget.value); saveDocumentEditor(editor);
});
const documentPointSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96];
$("#document-text-size").replaceChildren(...documentPointSizes.map((pointSize) => {
  const option = document.createElement("option");
  option.value = String(pointSize);
  option.textContent = String(pointSize);
  option.selected = pointSize === 11;
  return option;
}));
$("#document-text-size").addEventListener("change", (event) => {
  const editor = activeDocumentEditor(); if (!editor) return;
  editor.focus();
  document.execCommand("fontSize", false, "7");
  editor.querySelectorAll('font[size="7"]').forEach((font) => {
    font.removeAttribute("size");
    font.style.fontSize = `${event.currentTarget.value}pt`;
  });
  saveDocumentEditor(editor);
});
$("#document-text-color").addEventListener("change", (event) => {
  const editor = activeDocumentEditor(); if (!editor) return;
  editor.focus(); document.execCommand("foreColor", false, event.currentTarget.value); saveDocumentEditor(editor);
});
$$('[data-note-command]').forEach((button) => button.addEventListener("click", () => {
  restoreNoteTextSelection();
  document.execCommand(button.dataset.noteCommand, false);
  rememberNoteTextSelection();
  queueWordNoteSave();
}));
$$('[data-note-block]').forEach((button) => button.addEventListener("click", () => {
  restoreNoteTextSelection();
  document.execCommand("formatBlock", false, button.dataset.noteBlock);
  rememberNoteTextSelection();
  queueWordNoteSave();
}));
$("#word-note-font").addEventListener("change", (event) => {
  restoreNoteTextSelection();
  document.execCommand("fontName", false, event.currentTarget.value);
  rememberNoteTextSelection();
  queueWordNoteSave();
});
$("#word-note-font-size").addEventListener("change", (event) => {
  restoreNoteTextSelection();
  document.execCommand("fontSize", false, event.currentTarget.value);
  rememberNoteTextSelection();
  queueWordNoteSave();
});
$$('[data-note-tool]').forEach((button) => button.addEventListener("click", () => {
  noteDrawingTool = button.dataset.noteTool;
  if (noteDrawingTool !== "cursor") {
    selectedNoteImageId = null;
    noteImageTransform = null;
  }
  $$('[data-note-tool]').forEach((item) => item.classList.toggle("active", item === button));
  $("#canvas-text-options").hidden = noteDrawingTool !== "text";
  drawingNoteCanvas().style.cursor = noteDrawingTool === "cursor" ? "default" : noteDrawingTool === "text" ? "text" : noteDrawingTool === "eraser" ? "cell" : "crosshair";
  renderDrawingNoteVectors();
}));
$$('[data-canvas-text-style]').forEach((button) => button.addEventListener("click", () => {
  noteCanvasTextStyle = button.dataset.canvasTextStyle;
  const screenSizes = { body: 18, h1: 34, h2: 28, h3: 22 };
  applyCanvasTextFormat({ screenSize: screenSizes[noteCanvasTextStyle] });
  noteDrawingTool = "text";
  $$('[data-canvas-text-style]').forEach((item) => item.classList.toggle("active", item === button));
  $$('[data-note-tool]').forEach((item) => item.classList.toggle("active", item.dataset.noteTool === "text"));
  $("#canvas-text-options").hidden = false;
  drawingNoteCanvas().style.cursor = "text";
}));
$("#canvas-text-bold").addEventListener("click", () => {
  applyCanvasTextFormat({ bold: !noteCanvasTextFormat.bold });
  $("#canvas-text-bold").classList.toggle("active", noteCanvasTextFormat.bold);
});
$("#canvas-text-italic").addEventListener("click", () => {
  applyCanvasTextFormat({ italic: !noteCanvasTextFormat.italic });
  $("#canvas-text-italic").classList.toggle("active", noteCanvasTextFormat.italic);
});
$("#canvas-text-font").addEventListener("change", (event) => applyCanvasTextFormat({ fontFamily: event.currentTarget.value }));
$("#canvas-text-size").addEventListener("change", (event) => applyCanvasTextFormat({ screenSize: Number(event.currentTarget.value) || 18 }));
$("#canvas-text-color").addEventListener("change", (event) => applyCanvasTextFormat({ color: event.currentTarget.value }));

const noteCanvas = drawingNoteCanvas();
if (!noteCanvas) throw new Error("The drawing-note canvas is unavailable.");
let noteClipboardPasteSequence = 0;
document.addEventListener("keydown", (event) => {
  if (state.currentAppView !== "notes" || activeNotebookNote()?.type !== "drawing" || event.key.toLowerCase() !== "v" || (!event.metaKey && !event.ctrlKey)) return;
  const sequence = ++noteClipboardPasteSequence;
  window.setTimeout(() => {
    if (sequence !== noteClipboardPasteSequence) return;
    if (window.webkit?.messageHandlers?.clipboardImage) window.webkit.messageHandlers.clipboardImage.postMessage({});
    else if (window.desktopApp?.readClipboardImage) window.desktopApp.readClipboardImage().then((source) => source && window.receiveNativeClipboardImage(source));
  }, 80);
}, true);
document.addEventListener("paste", (event) => {
  if (event.defaultPrevented || state.currentAppView !== "notes" || activeNotebookNote()?.type !== "drawing") return;
  noteClipboardPasteSequence += 1;
  const clipboardFiles = [...(event.clipboardData?.files || [])];
  const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.kind === "file" && (item.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(item.getAsFile()?.name || "")));
  const file = imageItem?.getAsFile() || clipboardFiles.find((item) => item.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(item.name || ""));
  if (file) {
    event.preventDefault();
    pasteImageIntoActiveNote(file).catch((error) => showToast(error.message || "The image could not be pasted."));
    return;
  }
  if (window.desktopApp?.readClipboardImage) {
    const looksLikeFilePaste = [...(event.clipboardData?.types || [])].some((type) => /files|uri-list/i.test(type));
    if (looksLikeFilePaste) event.preventDefault();
    window.desktopApp.readClipboardImage().then((source) => source && window.receiveNativeClipboardImage(source));
  }
});
$("#edit-note-image-caption").addEventListener("click", () => {
  const imageItem = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  if (!imageItem) return;
  const caption = window.prompt("Image caption (leave blank for no caption):", imageItem.caption || "");
  if (caption === null) return;
  pushDrawingNoteHistory();
  imageItem.caption = caption.trim();
  renderDrawingNoteVectors();
  saveDrawingNote();
});
$("#remove-note-image-background").addEventListener("click", removeSelectedNoteImageBackground);
$("#push-note-image-front").addEventListener("click", () => {
  const imageItem = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  if (!imageItem) return;
  pushDrawingNoteHistory();
  imageItem.layer = "front";
  renderDrawingNoteVectors();
  saveDrawingNote();
  showToast("Image moved in front of the canvas content.");
});
$("#push-note-image-back").addEventListener("click", () => {
  const imageItem = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  if (!imageItem) return;
  pushDrawingNoteHistory();
  imageItem.layer = "back";
  renderDrawingNoteVectors();
  saveDrawingNote();
  showToast("Image moved behind the other canvas content.");
});
$("#delete-note-image").addEventListener("click", () => {
  if (!selectedNoteImageId) return;
  pushDrawingNoteHistory();
  noteDrawingImages = noteDrawingImages.filter((item) => item.id !== selectedNoteImageId);
  selectedNoteImageId = null;
  renderDrawingNoteVectors();
  saveDrawingNote();
});
document.addEventListener("keydown", (event) => {
  if (state.currentAppView !== "notes" || !selectedNoteImageId || !["Backspace", "Delete"].includes(event.key)) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target?.isContentEditable) return;
  event.preventDefault();
  pushDrawingNoteHistory();
  noteDrawingImages = noteDrawingImages.filter((item) => item.id !== selectedNoteImageId);
  selectedNoteImageId = null;
  renderDrawingNoteVectors();
  saveDrawingNote();
});
const noteCanvasViewport = noteCanvas.parentElement;
noteCanvasViewport.addEventListener("pointerdown", (event) => {
  if (noteDrawingTool !== "cursor" || activeNotebookNote()?.type !== "drawing") return;
  if (noteCanvasMode === "page" && notePageLayout === "document") return;
  if (event.target.closest?.(".canvas-text-editor, .canvas-text-delete, [data-note-image-control]")) return;
  const point = noteCanvasPoint(event);
  const selectedImage = [...noteDrawingImages].reverse().find((imageItem) => {
    const centerX = imageItem.x + imageItem.width / 2;
    const centerY = imageItem.y + imageItem.height / 2;
    const angle = -(Number(imageItem.rotation) || 0) * Math.PI / 180;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle) + centerX;
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle) + centerY;
    return localX >= imageItem.x && localX <= imageItem.x + imageItem.width && localY >= imageItem.y && localY <= imageItem.y + imageItem.height;
  });
  event.preventDefault();
  if (selectedImage) {
    event.stopPropagation();
    selectedNoteImageId = selectedImage.id;
    selectedCanvasTextId = null;
    pushDrawingNoteHistory();
    noteImageTransform = { mode: "move", pointerId: event.pointerId, start: point, original: { ...selectedImage } };
    noteCanvasViewport.setPointerCapture(event.pointerId);
    renderDrawingNoteVectors();
    return;
  }
  selectedNoteImageId = null;
  noteDrawingActive = true;
  noteCanvasPanStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: noteCanvasViewport.scrollLeft, scrollTop: noteCanvasViewport.scrollTop };
  noteCanvasViewport.setPointerCapture(event.pointerId);
  noteCanvasViewport.style.cursor = "grabbing";
}, true);
noteCanvasViewport.addEventListener("pointermove", (event) => {
  if (!noteCanvasPanStart || event.pointerId !== noteCanvasPanStart.pointerId) return;
  event.preventDefault();
  noteCanvasViewport.scrollLeft = noteCanvasPanStart.scrollLeft - (event.clientX - noteCanvasPanStart.x);
  noteCanvasViewport.scrollTop = noteCanvasPanStart.scrollTop - (event.clientY - noteCanvasPanStart.y);
  renderOpenNoteTextLayer();
});
const finishCanvasPan = (event) => {
  if (!noteCanvasPanStart || event.pointerId !== noteCanvasPanStart.pointerId) return;
  noteCanvasPanStart = null;
  noteDrawingActive = false;
  noteCanvasViewport.style.cursor = "";
  noteCanvas.style.cursor = noteDrawingTool === "cursor" ? "default" : "crosshair";
};
noteCanvasViewport.addEventListener("pointerup", finishCanvasPan);
noteCanvasViewport.addEventListener("pointercancel", finishCanvasPan);
function noteCanvasPoint(event) {
  const canvas = drawingNoteCanvas();
  const matrix = canvas.getScreenCTM?.();
  if (matrix) {
    const point = canvas.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * drawingWorkspaceWidth() / rect.width, y: (event.clientY - rect.top) * drawingWorkspaceHeight() / rect.height };
}
noteCanvas.addEventListener("pointerdown", (event) => {
  if (activeNotebookNote()?.type !== "drawing") return;
  if (noteCanvasMode === "page" && notePageLayout === "document") return;
  if (event.target.closest?.(".canvas-text-editor")) return;
  if (!noteImageTransform && !event.target.closest?.("[data-note-image-id]")) selectedNoteImageId = null;
  event.preventDefault();
  if (noteDrawingTool === "cursor") {
    renderDrawingNoteVectors();
    return;
  }
  const point = noteCanvasPoint(event);
  if (noteDrawingTool === "text") {
    const preservedScrollLeft = noteCanvas.parentElement.scrollLeft;
    const preservedScrollTop = noteCanvas.parentElement.scrollTop;
    noteDrawingTexts = noteDrawingTexts.filter((item) => (item?.text || "").trim());
    const canvasRect = noteCanvas.getBoundingClientRect();
    const viewportRect = noteCanvas.parentElement.getBoundingClientRect();
    const scale = drawingWorkspaceWidth() / canvasRect.width;
    const boxWidth = Math.min(180, Math.max(100, viewportRect.width - 32));
    const safeScreenX = Math.max(0, Math.min(event.clientX - canvasRect.left, viewportRect.right - canvasRect.left - boxWidth - 12));
    const safeScreenY = Math.max(0, event.clientY - canvasRect.top);
    point.x = safeScreenX * scale;
    point.y = safeScreenY * drawingWorkspaceHeight() / canvasRect.height;
    const textItem = {
      id: makeLocalId("canvas-text"),
      x: point.x,
      y: point.y,
      width: Math.min(drawingWorkspaceWidth() - point.x, 260 * scale),
      height: 52 * scale,
      screenWidth: boxWidth,
      screenHeight: 36,
      screenFontSize: Math.min(36, noteCanvasTextFormat.screenSize || 16),
      style: noteCanvasTextStyle,
      fontSize: noteCanvasTextFormat.screenSize * scale,
      fontFamily: noteCanvasTextFormat.fontFamily,
      color: noteCanvasTextFormat.color,
      bold: noteCanvasTextFormat.bold,
      italic: noteCanvasTextFormat.italic,
      text: "",
      createdAt: Date.now(),
    };
    noteDrawingTexts.push(textItem);
    selectedCanvasTextId = textItem.id;
    renderDrawingNoteVectors();
    window.setTimeout(() => {
      const editor = document.querySelector(`#open-note-text-layer [data-canvas-text-id="${textItem.id}"]`);
      editor?.focus();
      if (editor) {
        const caretPosition = editor.value.length;
        editor.setSelectionRange(caretPosition, caretPosition);
      }
      noteCanvas.parentElement.scrollLeft = preservedScrollLeft;
      noteCanvas.parentElement.scrollTop = preservedScrollTop;
      window.requestAnimationFrame(() => {
        noteCanvas.parentElement.scrollLeft = preservedScrollLeft;
        noteCanvas.parentElement.scrollTop = preservedScrollTop;
      });
    }, 0);
    saveDrawingNote();
    return;
  }
  noteDrawingActive = true;
  noteCanvas.setPointerCapture(event.pointerId);
  pushDrawingNoteHistory();
  noteDrawingLastPoint = point;
  if (noteDrawingTool === "eraser") {
    const radius = Number($("#drawing-note-size").value) * drawingWorkspaceWidth() / noteCanvas.getBoundingClientRect().width * 4;
    eraseDrawingAt(point, radius);
    renderDrawingNoteVectors();
  } else {
    const multiplier = noteDrawingTool === "highlighter" ? 4 : noteDrawingTool === "marker" ? 2.2 : noteDrawingTool === "calligraphy" ? 1.65 : noteDrawingTool === "pencil" ? 0.7 : 1;
    const width = Number($("#drawing-note-size").value) * drawingWorkspaceWidth() / noteCanvas.getBoundingClientRect().width * multiplier;
    currentNoteStroke = { tool: noteDrawingTool, color: $("#drawing-note-color").value, width, points: [point] };
    renderDrawingNoteVectors();
  }
});
window.__noteCanvasControlsReady = true;
function applyNoteImageTransform(event) {
  if (!noteImageTransform || event.pointerId !== noteImageTransform.pointerId) return false;
    const item = noteDrawingImages.find((candidate) => candidate.id === selectedNoteImageId);
    if (!item) return false;
    const point = noteCanvasPoint(event);
    const original = noteImageTransform.original;
    if (noteImageTransform.mode === "move") {
      item.x = Math.max(0, Math.min(drawingWorkspaceWidth() - item.width, original.x + point.x - noteImageTransform.start.x));
      item.y = Math.max(0, Math.min(drawingWorkspaceHeight() - item.height, original.y + point.y - noteImageTransform.start.y));
    } else if (noteImageTransform.mode === "resize") {
      const centerX = original.x + original.width / 2; const centerY = original.y + original.height / 2;
      const angle = -(Number(original.rotation) || 0) * Math.PI / 180;
      const dx = point.x - centerX; const dy = point.y - centerY;
      const localX = dx * Math.cos(angle) - dy * Math.sin(angle); const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
      const aspect = original.width / Math.max(1, original.height);
      let width = Math.max(60, Math.abs(localX) * 2); let height = Math.max(40, Math.abs(localY) * 2);
      if (event.shiftKey) { height = width / aspect; }
      item.width = Math.min(drawingWorkspaceWidth(), width); item.height = Math.min(drawingWorkspaceHeight(), height);
      item.x = centerX - item.width / 2; item.y = centerY - item.height / 2;
    } else if (noteImageTransform.mode === "rotate") {
      const centerX = original.x + original.width / 2; const centerY = original.y + original.height / 2;
      let rotation = Math.atan2(point.y - centerY, point.x - centerX) * 180 / Math.PI + 90;
      if (event.shiftKey) rotation = Math.round(rotation / 15) * 15;
      item.rotation = rotation;
    }
    return true;
}
noteCanvasViewport.addEventListener("pointermove", (event) => {
  if (noteCanvasMode === "page" && notePageLayout === "document") return;
  if (applyNoteImageTransform(event)) {
    event.preventDefault();
    renderDrawingNoteVectors();
    return;
  }
  if (!noteDrawingActive) return;
  event.preventDefault();
  const point = noteCanvasPoint(event);
  noteDrawingLastPoint = point;
  if (noteDrawingTool === "eraser") {
    const radius = Number($("#drawing-note-size").value) * drawingWorkspaceWidth() / noteCanvas.getBoundingClientRect().width * 4;
    eraseDrawingAt(point, radius);
  } else if (currentNoteStroke) {
    currentNoteStroke.points.push(point);
  }
  renderDrawingNoteVectors();
});
const finishNoteStroke = (event) => {
  if (noteImageTransform) {
    applyNoteImageTransform(event);
    noteImageTransform = null;
    renderDrawingNoteVectors();
    saveDrawingNote();
    return;
  }
  if (noteCanvasPanStart) return;
  if (noteCanvasMode === "page" && notePageLayout === "document") {
    noteDrawingActive = false;
    currentNoteStroke = null;
    return;
  }
  if (!noteDrawingActive) return;
  noteDrawingActive = false;
  if (currentNoteStroke?.points?.length) noteDrawingStrokes.push(currentNoteStroke);
  currentNoteStroke = null;
  renderDrawingNoteVectors();
  saveDrawingNote();
};
noteCanvasViewport.addEventListener("pointerup", finishNoteStroke);
noteCanvasViewport.addEventListener("pointercancel", finishNoteStroke);
// Keep Cursor drags alive even when WebKit moves the pointer outside the canvas viewport.
window.addEventListener("pointermove", (event) => {
  if (noteCanvasPanStart && event.pointerId === noteCanvasPanStart.pointerId) {
    event.preventDefault();
    noteCanvasViewport.scrollLeft = noteCanvasPanStart.scrollLeft - (event.clientX - noteCanvasPanStart.x);
    noteCanvasViewport.scrollTop = noteCanvasPanStart.scrollTop - (event.clientY - noteCanvasPanStart.y);
    renderOpenNoteTextLayer();
    return;
  }
  if (noteImageTransform && event.pointerId === noteImageTransform.pointerId) {
    event.preventDefault();
    applyNoteImageTransform(event);
    renderDrawingNoteVectors();
  }
}, { capture: true });
window.addEventListener("pointerup", (event) => {
  if (noteCanvasPanStart && event.pointerId === noteCanvasPanStart.pointerId) finishCanvasPan(event);
  if (noteImageTransform && event.pointerId === noteImageTransform.pointerId) finishNoteStroke(event);
}, { capture: true });
function undoDrawingNote() {
  const previous = noteDrawingHistory.pop();
  if (!previous) return;
  noteDrawingRedoHistory.push(drawingNoteSnapshot());
  restoreDrawingNoteSnapshot(previous, saveDrawingNote);
}
function redoDrawingNote() {
  const next = noteDrawingRedoHistory.pop();
  if (!next) return;
  noteDrawingHistory.push(drawingNoteSnapshot());
  restoreDrawingNoteSnapshot(next, saveDrawingNote);
}
$("#undo-note-stroke").addEventListener("click", undoDrawingNote);
$("#redo-note-stroke").addEventListener("click", redoDrawingNote);
document.addEventListener("keydown", (event) => {
  if (state.currentAppView !== "notes" || event.altKey || (!event.metaKey && !event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key !== "z" && key !== "y") return;
  const redo = key === "y" || (key === "z" && event.shiftKey);
  const editor = event.target?.closest?.(".page-document-content");
  if (editor) {
    event.preventDefault();
    document.execCommand(redo ? "redo" : "undo");
    saveDocumentEditor(editor);
    return;
  }
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target?.isContentEditable) return;
  if (activeNotebookNote()?.type !== "drawing" || (noteCanvasMode === "page" && notePageLayout === "document")) return;
  event.preventDefault();
  if (redo) redoDrawingNote();
  else undoDrawingNote();
});
$("#drawing-zoom-out").addEventListener("click", () => {
  const nextZoom = noteDrawingZoom / 1.25;
  setDrawingNoteZoom(noteDrawingZoom > 1 && nextZoom < 1 ? 1 : nextZoom);
});
$("#drawing-zoom-in").addEventListener("click", () => {
  const nextZoom = noteDrawingZoom * 1.25;
  setDrawingNoteZoom(noteDrawingZoom < 1 && nextZoom > 1 ? 1 : nextZoom);
});
$("#drawing-zoom-fit").addEventListener("click", () => {
  const canvas = drawingNoteCanvas();
  const viewport = canvas.parentElement;
  setDrawingNoteZoom(drawingFitZoom(), true);
  viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
});
$("#add-note-page").addEventListener("click", () => {
  if (noteCanvasMode !== "page") return;
  notePageCount += 1;
  while (noteDocumentPages.length < notePageCount) noteDocumentPages.push("");
  configureNoteCanvas("page", notePageCount, notePageLayout);
  renderDrawingNoteVectors();
  saveDrawingNote();
  const viewport = drawingNoteCanvas().parentElement;
  window.requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" }));
});
$("#remove-note-page").addEventListener("click", () => {
  if (noteCanvasMode !== "page" || notePageCount <= 1) return;
  if (!window.confirm("Remove the last page and anything written or drawn on it?")) return;
  removeSharedNotePage(notePageCount - 1);
  configureNoteCanvas("page", notePageCount, notePageLayout);
  renderDrawingNoteVectors();
  saveDrawingNote();
});
$("#toggle-page-layout").addEventListener("click", () => {
  if (noteCanvasMode !== "page") return;
  notePageLayout = notePageLayout === "document" ? "pages" : "document";
  configureNoteCanvas("page", notePageCount, notePageLayout);
  renderDrawingNoteVectors();
  saveDrawingNote();
  if (notePageLayout === "document") window.requestAnimationFrame(() => activeDocumentEditor()?.focus());
});
$("#clear-note-canvas").addEventListener("click", () => {
  if (!window.confirm("Clear this entire drawing?")) return;
  pushDrawingNoteHistory();
  clearDrawingCanvas();
  saveDrawingNote();
});
} catch (error) {
  console.error("Notes workspace could not be initialized:", error);
}
}
$("#export-deck-select").addEventListener("change", updateExportSummary);
$("#export-study-set").addEventListener("click", exportSelectedStudyDeck);
$("#export-user-information").addEventListener("click", () => exportUserInformation().catch((error) => {
  console.error(error);
  $("#settings-export-status").textContent = "The backup could not be created.";
  showToast("The backup could not be created.");
}));
$("#restore-user-information").addEventListener("click", () => {
  window.nativeFilePickerPurpose = "restore-backup";
  $("#restore-user-information-file").click();
});
$("#restore-user-information-file").addEventListener("change", (event) => {
  window.nativeFilePickerPurpose = "";
  const file = event.target.files?.[0];
  if (file) restoreUserInformation(file);
  event.target.value = "";
});
$("#check-for-updates").addEventListener("click", () => checkForAppUpdates(true));
$("#download-app-update").addEventListener("click", (event) => {
  const releaseUrl = event.currentTarget.dataset.releaseUrl;
  if (!releaseUrl) return;
  if (window.desktopApp?.openUpdate) window.desktopApp.openUpdate(releaseUrl);
  else window.webkit?.messageHandlers?.appUpdateOpen?.postMessage({ releaseUrl });
});
$("#export-note-select").addEventListener("change", configureSelectedNoteExport);
$("#export-note-button").addEventListener("click", () => exportSelectedNote().catch((error) => { console.error(error); $("#export-note-status").textContent = "The note could not be exported."; showToast("The note could not be exported."); }));
["#export-note-crop-x", "#export-note-crop-y", "#export-note-crop-width", "#export-note-crop-height"].forEach((selector) => $(selector).addEventListener("change", updateNoteExportSelectionFromInputs));
$("#export-note-fit-content").addEventListener("click", () => {
  const note = selectedExportNote(); if (!note) return;
  noteExportState.contentBounds = noteContentBounds(note);
  noteExportState.selection = { ...noteExportState.contentBounds };
  noteExportState.viewBounds = paddedNoteExportView(noteExportState.contentBounds, note);
  syncNoteExportCropInputs(); drawNoteExportPreview();
});
$("#export-note-whole-canvas").addEventListener("click", () => {
  const note = selectedExportNote(); if (!note) return;
  const dimensions = noteExportDimensions(note);
  noteExportState.selection = { x: 0, y: 0, ...dimensions };
  noteExportState.viewBounds = { ...noteExportState.selection };
  syncNoteExportCropInputs(); drawNoteExportPreview();
});
const noteExportPreview = $("#export-note-preview");
const noteExportPoint = (event) => {
  const rect = noteExportPreview.getBoundingClientRect(); const view = noteExportState.viewBounds;
  if (!view) return null;
  const scale = Math.min(noteExportPreview.width / view.width, noteExportPreview.height / view.height);
  const offsetX = (noteExportPreview.width - view.width * scale) / 2; const offsetY = (noteExportPreview.height - view.height * scale) / 2;
  const canvasX = (event.clientX - rect.left) * noteExportPreview.width / rect.width; const canvasY = (event.clientY - rect.top) * noteExportPreview.height / rect.height;
  return { x: Math.max(view.x, Math.min(view.x + view.width, view.x + (canvasX - offsetX) / scale)), y: Math.max(view.y, Math.min(view.y + view.height, view.y + (canvasY - offsetY) / scale)) };
};
noteExportPreview.addEventListener("pointerdown", (event) => {
  const note = selectedExportNote(); if (!note || note.type !== "drawing" || note.pageLayout === "document") return;
  const point = noteExportPoint(event); if (!point) return;
  noteExportState.dragging = true; noteExportState.dragStart = point; noteExportPreview.setPointerCapture(event.pointerId); event.preventDefault();
});
noteExportPreview.addEventListener("pointermove", (event) => {
  if (!noteExportState.dragging || !noteExportState.dragStart) return;
  const point = noteExportPoint(event); if (!point) return; const start = noteExportState.dragStart;
  noteExportState.selection = { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width: Math.max(1, Math.abs(point.x - start.x)), height: Math.max(1, Math.abs(point.y - start.y)) };
  syncNoteExportCropInputs(); drawNoteExportPreview();
});
const finishNoteExportDrag = (event) => { if (!noteExportState.dragging) return; noteExportState.dragging = false; noteExportState.dragStart = null; try { noteExportPreview.releasePointerCapture(event.pointerId); } catch (_) {} syncNoteExportCropInputs(); drawNoteExportPreview(); };
noteExportPreview.addEventListener("pointerup", finishNoteExportDrag);
noteExportPreview.addEventListener("pointercancel", finishNoteExportDrag);
$("#flashcards-create-set").addEventListener("click", () => { showAppView("create"); $("#new-custom-study-set").click(); });
$("#active-anki-select-all").addEventListener("change", (event) => {
  const dueEntries = dashboardAnkiEntries().filter((entry) => entry.total > 0);
  if (event.target.checked) dueEntries.forEach((entry) => state.activeAnkiSelections.add(activeAnkiEntryKey(entry)));
  else state.activeAnkiSelections.clear();
  persistActiveAnkiSelections();
  renderActiveAnkiDecks();
});
$("#study-selected-active-anki").addEventListener("click", startSelectedActiveAnki);
$(".brand").addEventListener("click", (event) => { event.preventDefault(); showAppView("dashboard"); });
$("#welcome-profile-dialog").addEventListener("cancel", (event) => event.preventDefault());
$("#welcome-profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#welcome-profile-name").value.trim();
  const month = Number($("#welcome-profile-birth-month").value);
  const day = Number($("#welcome-profile-birth-day").value);
  if (!name || !month || !day) return;
  const birthday = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const profile = { name, birthday };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  applyProfile(profile);
  $("#welcome-profile-dialog").close();
  celebrateBirthday(profile);
});
window.setTimeout(() => checkForAppUpdates(false), 2500);
