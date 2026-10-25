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
  googleAccount: null,
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
  customUnits: [],
  activeCustomTopicId: "",
  draftViewUnitId: "",
  draftViewTopicId: "",
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
  selectedBuiltInTopicIds: [],
  selectedCustomTopicIds: [],
  selectedNotebookFolderId: null,
  selectedNotebookNoteIds: [],
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
  customFlashcardModeSelector: "regular",
  customQuestionModeSelector: "normal",
  customEssayPromptId: "",
  customEssayTimerEnabled: false,
  customEssayTimeMinutes: 40,
  customEssayStartedAt: null,
  customMatchingAnswerOrder: [],
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
  manualQuestionImage: "",
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
  browseLibraryView: "built-in",
  communityKind: "all",
  communitySort: "relevance",
  communityItems: [],
  communityLoading: false,
  communityError: "",
  myPublicKind: "all",
  myPublishedItems: [],
  myPublishedLoading: false,
  myPublishedError: "",
  communityProfileItems: [],
  previewItem: null,
  previewTab: "cards",
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
  const language = loadSettings().language || "en";
  const unit = window.StudyLanguage?.text(language, current === 1 ? "day" : "days") || (current === 1 ? "day" : "days");
  const personalBest = window.StudyLanguage?.text(language, "personalBest") || "Personal best";
  const currentElement = $("#current-study-streak");
  const bestElement = $("#best-study-streak");
  if (currentElement) currentElement.textContent = `${current} ${unit}`;
  if (bestElement) bestElement.textContent = `${personalBest}: ${best}`;
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
const DEFAULT_PROFILE = { name: "Guest", birthday: "" };
const GOOGLE_CLIENT_ID = "376424510756-mncplov3qh8rhesmagc2041lsp9telsc.apps.googleusercontent.com";
const DEFAULT_SETTINGS = {
  theme: "light", language: "en", reduceMotion: false, compactMode: false, dataSaver: false,
  newCardsPerDay: 20, maxReviewsPerDay: 200,
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
    if (!['en', 'es', 'fr'].includes(settings.language)) settings.language = "en";
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

function applyInterfacePreferences(settings = loadSettings()) {
  document.documentElement.dataset.compact = settings.compactMode ? "true" : "false";
  document.documentElement.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
  document.documentElement.dataset.dataSaver = settings.dataSaver ? "true" : "false";
  window.StudyLanguage?.apply(settings.language || "en");
}

function loadProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!profile || typeof profile.name !== "string") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(profile.birthday || "")) profile.birthday = profile.birthday.slice(5);
    profile.birthday = /^\d{2}-\d{2}$/.test(profile.birthday || "") ? profile.birthday : "";
    if (profile.name.trim() === "Student" && !profile.birthday) {
      profile.name = "Guest";
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
    return profile.name.trim() ? profile : null;
  } catch { return null; }
}

function greetingForNow() {
  const hour = new Date().getHours();
  return window.StudyLanguage?.greetingForHour(loadSettings().language || "en", hour)
    || (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
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
  const profile = loadProfile() || { ...DEFAULT_PROFILE };
  if (!loadProfile()) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  applyProfile(profile);
  celebrateBirthday(profile);
}

function hostedGoogleSignInAvailable() {
  return window.location.protocol === "https:";
}

function accountSetupComplete(account) {
  return Boolean(account?.username && account?.displayName);
}

function saveAccountDisplayNameLocally(account) {
  if (!account?.displayName) return;
  const profile = loadProfile() || { ...DEFAULT_PROFILE };
  profile.name = account.displayName;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  applyProfile(profile);
}

function renderGoogleAccount(account = state.googleAccount || null) {
  window.StudySync?.setAccount(account);
  if (accountSetupComplete(account)) window.setTimeout(() => syncCommunitySavesToAccount(), 0);
  const status = $("#google-account-status");
  const detail = $("#google-account-detail");
  const avatar = $("#google-account-avatar");
  const signIn = $("#google-signin-button");
  const sidebarLabel = $("#profile-account-label");
  const accountNavLabel = $("#account-nav-label");
  const signedOutPanel = $("#account-signed-out");
  const usernamePanel = $("#username-setup");
  const signedInPanel = $("#account-signed-in");
  const syncButton = $("#sync-progress-now");
  const dialogTitle = $("#account-dialog-title");
  if (!status || !detail || !avatar || !signIn || !sidebarLabel || !accountNavLabel || !signedOutPanel || !usernamePanel || !signedInPanel) return;
  signedOutPanel.hidden = Boolean(account);
  const setupComplete = accountSetupComplete(account);
  if (syncButton) {
    syncButton.disabled = !hostedGoogleSignInAvailable();
    syncButton.textContent = !hostedGoogleSignInAvailable() ? "Website only" : setupComplete ? "Sync now" : "Log in to sync";
  }
  usernamePanel.hidden = !account || setupComplete;
  signedInPanel.hidden = !setupComplete;
  dialogTitle.textContent = !account ? "Log in" : setupComplete ? "Account" : "Create your profile";
  if (!hostedGoogleSignInAvailable()) {
    signedOutPanel.hidden = false;
    usernamePanel.hidden = true;
    signedInPanel.hidden = true;
    status.textContent = "Google sign-in is available on the website";
    detail.textContent = "Open yourstudybuddy.net to link an account. This installed app stays fully usable offline.";
    avatar.hidden = true;
    signIn.hidden = true;
    sidebarLabel.textContent = "Offline profile";
    accountNavLabel.textContent = "Log in";
    return;
  }
  if (account) {
    avatar.src = account.picture || "./your-study-buddy-icon.png";
    avatar.alt = account.name ? `${account.name}'s Google profile photo` : "Google profile photo";
    avatar.hidden = false;
    $("#google-account-name").textContent = account.name || "Google account";
    $("#google-account-email").textContent = account.email || "";
    signIn.hidden = true;
    if (!setupComplete) {
      accountNavLabel.textContent = "Finish setup";
      sidebarLabel.textContent = "Account setup incomplete";
      const displayNameInput = $("#display-name-input");
      if (!displayNameInput.value) displayNameInput.value = account.displayName || account.name || "";
      const availability = $("#username-availability");
      availability.textContent = account.usernameStorageReady === false
        ? "Username storage still needs to be connected in Cloudflare."
        : "Choose an available username to finish setup.";
      availability.dataset.state = account.usernameStorageReady === false ? "error" : "";
      $("#save-username").disabled = account.usernameStorageReady === false;
      return;
    }
    const completeAvatar = $("#signed-in-account-avatar");
    completeAvatar.src = account.picture || "./your-study-buddy-icon.png";
    completeAvatar.alt = account.name ? `${account.name}'s Google profile photo` : "Google profile photo";
    completeAvatar.hidden = false;
    $("#signed-in-account-name").textContent = account.displayName || account.name || "Google account";
    $("#signed-in-account-email").textContent = account.email || "";
    $("#signed-in-username").textContent = `@${account.username}`;
    sidebarLabel.textContent = `@${account.username}`;
    accountNavLabel.textContent = `@${account.username}`;
    return;
  }
  status.textContent = "Not signed in";
  detail.textContent = "Sign in with Google to link your account. Your existing local study data will not be removed.";
  avatar.hidden = true;
  sidebarLabel.textContent = "Not signed in";
  accountNavLabel.textContent = "Log in";
  signIn.hidden = !window.google?.accounts?.id;
}

function openAccountDialog() {
  const dialog = $("#account-dialog");
  if (!dialog.open) dialog.showModal();
  renderGoogleAccount();
  if (!state.googleAccount) {
    loadGoogleIdentityLibrary();
    renderGoogleSignInButton();
  } else if (!accountSetupComplete(state.googleAccount)) {
    window.setTimeout(() => $("#display-name-input").focus(), 0);
  }
}

function normalizedUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function usernameValidationMessage(username) {
  if (username.length < 3) return "Use at least 3 characters.";
  if (username.length > 24) return "Use no more than 24 characters.";
  if (!/^[a-z][a-z0-9_]*$/.test(username)) return "Start with a letter and use only letters, numbers, or underscores.";
  return "";
}

let usernameCheckTimer = null;
let lastAvailableUsername = "";

async function checkUsernameAvailability() {
  const input = $("#username-input");
  const availability = $("#username-availability");
  const saveButton = $("#save-username");
  const username = normalizedUsername(input.value);
  input.value = username;
  lastAvailableUsername = "";
  availability.dataset.state = "";
  const validationMessage = usernameValidationMessage(username);
  if (validationMessage) {
    availability.textContent = validationMessage;
    saveButton.disabled = true;
    return;
  }
  if (state.googleAccount?.usernameStorageReady === false) {
    availability.textContent = "Username storage still needs to be connected in Cloudflare.";
    availability.dataset.state = "error";
    saveButton.disabled = true;
    return;
  }
  availability.textContent = "Checking availability…";
  saveButton.disabled = true;
  try {
    const response = await fetch(`/api/account/username/check?username=${encodeURIComponent(username)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not check this username");
    if (result.available) {
      lastAvailableUsername = username;
      availability.textContent = `@${username} is available.`;
      availability.dataset.state = "available";
      saveButton.disabled = false;
    } else {
      availability.textContent = `@${username} is already taken.`;
      availability.dataset.state = "taken";
    }
  } catch (error) {
    availability.textContent = error.message || "Could not check this username. Try again.";
    availability.dataset.state = "error";
  }
}

async function saveUsername(event) {
  event.preventDefault();
  const displayName = $("#display-name-input").value.trim().replace(/\s+/g, " ");
  const username = normalizedUsername($("#username-input").value);
  if (!displayName || displayName.length > 40) {
    $("#display-name-input").focus();
    showToast("Enter a name between 1 and 40 characters.");
    return;
  }
  if (username !== lastAvailableUsername) {
    await checkUsernameAvailability();
    if (username !== lastAvailableUsername) return;
  }
  const availability = $("#username-availability");
  const saveButton = $("#save-username");
  saveButton.disabled = true;
  availability.textContent = "Creating your account…";
  availability.dataset.state = "";
  try {
    const response = await fetch("/api/account/profile", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Username could not be created");
    state.googleAccount = result.user;
    saveAccountDisplayNameLocally(result.user);
    renderGoogleAccount(result.user);
    showToast(`Welcome, ${result.user.displayName}. Your username is @${result.user.username}.`);
  } catch (error) {
    lastAvailableUsername = "";
    availability.textContent = error.message || "Your account could not be created. Try again.";
    availability.dataset.state = "error";
    saveButton.disabled = false;
  }
}

function renderGoogleSignInButton() {
  const container = $("#google-signin-button");
  if (!container || !window.google?.accounts?.id || state.googleAccount) return;
  container.innerHTML = "";
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    ux_mode: "popup",
    auto_select: false,
    use_fedcm_for_prompt: true,
  });
  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: effectiveTheme() === "dark" ? "filled_black" : "outline",
    size: "large",
    shape: "rectangular",
    text: "continue_with",
    width: 240,
  });
  container.hidden = false;
}

function loadGoogleIdentityLibrary() {
  if (!hostedGoogleSignInAvailable()) return;
  if (window.google?.accounts?.id) { renderGoogleSignInButton(); return; }
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.referrerPolicy = "strict-origin-when-cross-origin";
  script.addEventListener("load", renderGoogleSignInButton, { once: true });
  script.addEventListener("error", () => {
    $("#google-account-status").textContent = "Google sign-in could not load";
    $("#google-account-detail").textContent = "Check your internet connection or browser privacy settings, then reload.";
  }, { once: true });
  document.head.appendChild(script);
}

async function handleGoogleCredential(response) {
  const credential = response?.credential;
  if (!credential) return;
  $("#google-account-status").textContent = "Signing in securely…";
  $("#google-signin-button").hidden = true;
  try {
    const request = await fetch("/api/auth/google", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!request.ok) throw new Error("Google sign-in was not accepted");
    const { user } = await request.json();
    state.googleAccount = user;
    if (accountSetupComplete(user)) saveAccountDisplayNameLocally(user);
    renderGoogleAccount(user);
    openAccountDialog();
    showToast(accountSetupComplete(user) ? `Signed in as @${user.username}.` : "Google sign-in complete. Create your profile.");
  } catch (error) {
    console.error("Google sign-in failed:", error);
    state.googleAccount = null;
    renderGoogleAccount();
    renderGoogleSignInButton();
    showToast("Google sign-in could not be completed. Try again after the latest web deployment.");
  }
}

async function initializeGoogleAccount() {
  renderGoogleAccount();
  if (!hostedGoogleSignInAvailable()) return;
  try {
    const response = await fetch("/api/auth/me", { credentials: "same-origin", headers: { Accept: "application/json" } });
    if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
      const { user } = await response.json();
      state.googleAccount = user || null;
      if (accountSetupComplete(state.googleAccount)) saveAccountDisplayNameLocally(state.googleAccount);
      renderGoogleAccount(state.googleAccount);
    }
  } catch (_) {}
  if (!state.googleAccount) loadGoogleIdentityLibrary();
}

async function signOutGoogleAccount() {
  try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (_) {}
  state.googleAccount = null;
  window.google?.accounts?.id?.disableAutoSelect?.();
  renderGoogleAccount();
  loadGoogleIdentityLibrary();
  renderGoogleSignInButton();
  showToast("Signed out of Google.");
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
const builtInUsHistoryDecks = (window.AP_US_HISTORY_DECKS || []).map((deck) => ({
  ...deck,
  cards: (deck.cards || []).map((card) => card.front === "Shays’s Rebellion (1786)"
    ? { ...card, front: "Shays' Rebellion (1786–1787)", back: "An armed uprising by indebted western Massachusetts farmers against high taxes and property foreclosures. It exposed the weakness of the Articles of Confederation and strengthened calls for a more powerful federal government." }
    : card),
}));
const builtInArtHistoryDecks = window.AP_ART_HISTORY_DECKS || [];
const builtInComputerSciencePrinciplesDecks = window.AP_CSP_DECKS || [];
const builtInBiologyDecks = window.AP_BIOLOGY_DECKS || [];
const builtInStatisticsDecks = window.AP_STATISTICS_DECKS || [];
const builtInChemistryDecks = window.AP_CHEMISTRY_DECKS || [];
const builtInPhysics1Decks = window.AP_PHYSICS_1_DECKS || [];
const builtInPhysics2Decks = window.AP_PHYSICS_2_DECKS || [];
const builtInPhysicsCMechanicsDecks = window.AP_PHYSICS_C_MECHANICS_DECKS || [];
const builtInPhysicsCEmDecks = window.AP_PHYSICS_C_ELECTRICITY_MAGNETISM_DECKS || [];
const builtInCalculusDecks = window.AP_CALCULUS_DECKS || [];
const builtInPrecalculusDecks = window.AP_PRECALCULUS_DECKS || [];
const builtInComparativeGovernmentDecks = window.AP_COMPARATIVE_GOVERNMENT_DECKS || [];
const builtInMicroeconomicsDecks = window.AP_MICROECONOMICS_DECKS || [];
const builtInMacroeconomicsDecks = window.AP_MACROECONOMICS_DECKS || [];
const builtInMusicTheoryDecks = window.AP_MUSIC_THEORY_DECKS || [];
const builtInLatinDecks = window.AP_LATIN_DECKS || [];
const builtInEnglishLanguageDecks = window.AP_ENGLISH_LANGUAGE_DECKS || [];
const builtInEnglishLiteratureDecks = window.AP_ENGLISH_LITERATURE_DECKS || [];
window.YSB_ATTACH_IB_EXAM_PRACTICE?.({
  ibbio: window.IB_BIOLOGY_DECKS,
  ibchem: window.IB_CHEMISTRY_DECKS,
  ibpsych: window.IB_PSYCHOLOGY_DECKS,
  ibecon: window.IB_ECONOMICS_DECKS,
  ibgeo: window.IB_GEOGRAPHY_DECKS,
  ibess: window.IB_ESS_DECKS,
  ibmathaa: window.IB_MATH_AA_DECKS,
  ibhistamer: window.IB_HISTORY_AMERICAS_DECKS,
});
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
const communityMiniCollections = window.COMMUNITY_MINI_COLLECTIONS || [];
const builtInFlashcardDecks = [...builtInHumanGeographyDecks, ...builtInWorldHistoryDecks, ...builtInEnvironmentalScienceDecks, ...builtInEuropeanHistoryDecks, ...builtInGovernmentDecks, ...builtInSatVocabularyDecks, ...builtInPsychologyDecks, ...builtInUsHistoryDecks, ...builtInArtHistoryDecks, ...builtInComputerSciencePrinciplesDecks, ...builtInBiologyDecks, ...builtInStatisticsDecks, ...builtInChemistryDecks, ...builtInPhysics1Decks, ...builtInPhysics2Decks, ...builtInPhysicsCMechanicsDecks, ...builtInPhysicsCEmDecks, ...builtInCalculusDecks, ...builtInPrecalculusDecks, ...builtInComparativeGovernmentDecks, ...builtInMicroeconomicsDecks, ...builtInMacroeconomicsDecks, ...builtInMusicTheoryDecks, ...builtInLatinDecks, ...builtInEnglishLanguageDecks, ...builtInEnglishLiteratureDecks, ...builtInIbBiologyDecks, ...builtInIbChemistryDecks, ...builtInIbPsychologyDecks, ...builtInIbEconomicsDecks, ...builtInIbGeographyDecks, ...builtInIbEssDecks, ...builtInIbMathAaDecks, ...builtInIbHistoryAmericasDecks, ...builtInMcatReviewDecks, ...builtInUsmleDecks, ...builtInDatDecks, ...builtInAfricanAmericanStudiesDecks, ...builtInCybersecurityDecks, ...builtInBusinessPersonalFinanceDecks, ...builtInUsPresidentDecks];
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
  id: "apphysics1",
  name: "AP Physics 1: Algebra-Based",
  description: "All current College Board topics with exactly 10 original easy-to-hard practice questions per topic and 80 equation, model, and definition flashcards.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInPhysics1Decks,
}, {
  id: "apphysics2",
  name: "AP Physics 2: Algebra-Based",
  description: "All current College Board topics with exactly 10 original easy-to-hard practice questions per topic and 80 equation, model, and definition flashcards.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInPhysics2Decks,
}, {
  id: "apphysicscmechanics",
  name: "AP Physics C: Mechanics",
  description: "All current College Board topics with exactly 10 original easy-to-hard practice questions per topic and 80 calculus-based equation, model, and definition flashcards.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInPhysicsCMechanicsDecks,
}, {
  id: "apphysicscem",
  name: "AP Physics C: Electricity and Magnetism",
  description: "All current College Board topics with exactly 10 original easy-to-hard practice questions per topic and 80 calculus-based equation, model, and definition flashcards.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInPhysicsCEmDecks,
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
  id: "aplang",
  name: "AP English Language and Composition",
  description: "Rhetorical situation, claims and evidence, reasoning, organization, style, synthesis, argument, analysis, and revision across the current nine-unit skills framework.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInEnglishLanguageDecks,
}, {
  id: "aplit",
  name: "AP English Literature and Composition",
  description: "Literary analysis vocabulary and original practice across the recurring short fiction, poetry, and longer fiction or drama sequence.",
  unitLabel: "units",
  catalogLabel: "AP course",
  units: builtInEnglishLiteratureDecks,
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

builtInFlashcardCollections.push(...communityMiniCollections);

// Large standalone exam banks use lightweight catalog metadata at startup.
// Their full card arrays are attached only when the bank is actually needed.
const lazyBuiltInSources = {
  "sat-vocabulary": { scripts: ["sat-vocabulary-data.js"], global: "SAT_VOCABULARY_DECKS", unitCount: 5, cardCount: 986, feynmanCount: 0 },
  mcat: { scripts: ["mcat-review-data.js", "mcat-biochem-expansion.js"], global: "MCAT_REVIEW_DECKS", unitCount: 14, cardCount: 1321, feynmanCount: 139 },
  usmle: { scripts: ["mcat-review-data.js", "mcat-biochem-expansion.js", "usmle-data.js", "usmle-expansion.js"], global: "USMLE_DECKS", unitCount: 12, cardCount: 1181, feynmanCount: 24 },
  dat: { scripts: ["mcat-review-data.js", "mcat-biochem-expansion.js", "admissions-exam-data.js"], global: "DAT_DECKS", unitCount: 6, cardCount: 984, feynmanCount: 0 },
};
const OFFICIAL_COMMUNITY_COLLECTIONS = [
  { id: "official:mcat", collectionId: "mcat", baseRating: 4.8, ratingPhase: 0, ratingCount: 38, addCount: 12842, author: { displayName: "orbit", username: "orbitstudies17" } },
  { id: "official:usmle", collectionId: "usmle", baseRating: 4.7, ratingPhase: 2, ratingCount: 31, addCount: 8731, author: { displayName: "moth", username: "notesat2am" } },
  { id: "official:dat", collectionId: "dat", baseRating: 4.6, ratingPhase: 4, ratingCount: 24, addCount: 5376, author: { displayName: "moth", username: "notesat2am" } },
  { id: "official:us-presidents", collectionId: "us-presidents", baseRating: 4.9, ratingPhase: 6, ratingCount: 17, addCount: 4862, author: { displayName: "paper trails", username: "papertrails_73" } },
  { id: "official:cranial-nerves", collectionId: "mini-cranial-nerves", baseRating: 4.9, ratingPhase: 1, ratingCount: 14, addCount: 2347, author: { displayName: "orbit", username: "orbitstudies17" } },
  { id: "official:spinal-nerves", collectionId: "mini-spinal-nerves", baseRating: 4.7, ratingPhase: 3, ratingCount: 11, addCount: 1819, author: { displayName: "orbit", username: "orbitstudies17" } },
  { id: "official:amino-acids", collectionId: "mini-amino-acids", baseRating: 4.8, ratingPhase: 5, ratingCount: 19, addCount: 3614, author: { displayName: "orbit", username: "orbitstudies17" } },
  { id: "official:cuban-missile-crisis", collectionId: "mini-cuban-missile-crisis", baseRating: 4.8, ratingPhase: 7, ratingCount: 9, addCount: 1428, author: { displayName: "paper trails", username: "papertrails_73" } },
  { id: "official:haitian-revolution", collectionId: "mini-haitian-revolution", baseRating: 4.7, ratingPhase: 0, ratingCount: 8, addCount: 946, author: { displayName: "juno", username: "afterclass404" } },
  { id: "official:french-revolution", collectionId: "mini-french-revolution", baseRating: 4.8, ratingPhase: 2, ratingCount: 13, addCount: 2173, author: { displayName: "paper trails", username: "papertrails_73" } },
  { id: "official:us-civil-rights", collectionId: "mini-us-civil-rights", baseRating: 4.9, ratingPhase: 4, ratingCount: 16, addCount: 1786, author: { displayName: "juno", username: "afterclass404" } },
  { id: "official:civil-war-turning-points", collectionId: "mini-civil-war-turning-points", baseRating: 4.7, ratingPhase: 6, ratingCount: 12, addCount: 2541, author: { displayName: "paper trails", username: "papertrails_73" } },
];
const OFFICIAL_COMMUNITY_COLLECTION_IDS = new Set(OFFICIAL_COMMUNITY_COLLECTIONS.map((item) => item.collectionId));
const CURATED_RATING_PERIOD_MS = 2 * 24 * 60 * 60 * 1000;
const CURATED_RATING_OFFSETS = [0, 0.1, 0, -0.1, 0, 0.1, -0.1, 0];

function curatedCommunityRating(item, now = Date.now()) {
  const period = Math.floor(now / CURATED_RATING_PERIOD_MS);
  const offsetIndex = (period + Number(item.ratingPhase || 0)) % CURATED_RATING_OFFSETS.length;
  const average = Math.max(4.4, Math.min(5, Number(item.baseRating || 4.7) + CURATED_RATING_OFFSETS[offsetIndex]));
  const roundedAverage = Math.round(average * 10) / 10;
  return {
    average: roundedAverage,
    mean: roundedAverage,
    median: roundedAverage,
    count: Number(item.ratingCount) || 5,
  };
}
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
  if (!collection) return collection;
  if (isApCourseCollection(collection) && !window.AP_CED_TOPIC_MAP) await loadLazyScript("ap-ced-topic-data.js");
  if (!source || collection.units.length) return collection;
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

async function hydrateCuratedQuestionCounts() {
  if (!window.AP_CED_TOPIC_MAP) await loadLazyScript("ap-ced-topic-data.js");
  builtInQuestionCountCache.clear();
  renderCustomDecks();
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

function conciseTextbookDefinition(value, maximumLength = 240) {
  const cleaned = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maximumLength) return cleaned;
  const sentence = cleaned.slice(0, maximumLength + 1).match(/^(.{40,240}?[.!?])(?:\s|$)/)?.[1];
  if (sentence) return sentence;
  const clipped = cleaned.slice(0, maximumLength).replace(/\s+\S*$/, "").trim();
  return `${clipped}…`;
}

function textbookPracticeQuestions(course, unit, cards, unitIndex) {
  const usableCards = cards.filter((card) => String(card.front || "").trim() && String(card.back || "").trim());
  if (usableCards.length < 2) return [];
  return usableCards.filter((_, index) => index % 2 === 0).map((card, questionIndex) => {
    const cardIndex = usableCards.indexOf(card);
    const distractors = [];
    for (let offset = 1; offset < usableCards.length && distractors.length < 3; offset += 1) {
      const candidate = usableCards[(cardIndex + offset * 7) % usableCards.length].front;
      if (candidate !== card.front && !distractors.includes(candidate)) distractors.push(candidate);
    }
    const options = [...distractors];
    options.splice(questionIndex % (options.length + 1), 0, card.front);
    return {
      id: `textbook-${course.id}-unit-${unitIndex + 1}-q${questionIndex + 1}`,
      type: "mcq",
      prompt: `Which term best matches this description? ${conciseTextbookDefinition(card.back)}`,
      options,
      answer: card.front,
      difficulty: ["Easy", "Medium", "Hard"][questionIndex % 3],
      source: course.sourceTitle,
    };
  });
}

function textbookFlashcardCollection(course) {
  return {
    id: `textbook-${course.id}`,
    name: course.title,
    description: `${course.description} Select individual units before starting a study session.`,
    unitLabel: "units",
    catalogLabel: "Study set",
    units: course.chapters.map((unit, unitIndex) => {
      const cards = unit.miniUnits.flatMap((chapter) => (chapter.cards || []).map((card, cardIndex) => Array.isArray(card) ? {
        id: `textbook-${course.id}-${chapter.number}-c${cardIndex + 1}`,
        front: card[0],
        back: card[1],
        ...(card[2] ? { equation: card[2] } : {}),
      } : card));
      return {
        id: `textbook-${course.id}-unit-${unitIndex + 1}`,
        name: `${course.title} · ${unit.title}`,
        shortName: unit.title,
        builtIn: true,
        sourceTitle: course.sourceTitle,
        cards,
        questions: textbookPracticeQuestions(course, unit, cards, unitIndex),
        feynmanPrompts: unit.miniUnits.flatMap((chapter) => feynmanPrompts(chapter).map((prompt, promptIndex) => ({
        id: `textbook-${course.id}-${chapter.number}-f${promptIndex + 1}`,
        prompt,
        }))),
      };
    }),
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
const PRESENTATION_CANVAS_HEIGHT = 450;
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
let lastNoteImagePointerDown = null;
let selectedDocumentImage = null;
let noteImageCropState = null;
let noteCanvasTextFormat = { fontFamily: "Arial", screenSize: 18, color: "#171b2d", bold: false, italic: false };
let noteTextSelection = null;
let noteSaveHandle;
let toastHandle;
let ankiTimerHandle;
let feynmanTimerHandle;
let customReviewTimerHandle;
let customFeynmanTimerHandle;
let customEssayTimerHandle;
let customEssayPromptFilter = "";
let customMatchingClickTimerHandle;
let freestyleFeynmanTimerHandle;
let definitionSuggestionTimerHandle;
let freestyleFeynmanStartedAt = null;
let freestyleFeynmanDuration = 0;
let activePdfObjectUrl = "";
let pdfAnnotationLoader = null;

function pageCanvasHeight(note = activeNotebookNote()) { return note?.sourceFormat === "pptx" ? PRESENTATION_CANVAS_HEIGHT : PAGE_CANVAS_HEIGHT; }

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

window.NoteAssetStorage = { get: getNotebookAsset, set: setNotebookAsset, remove: removeNotebookAsset };

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function openAppPrompt({ title = "Confirm action", message = "", confirmLabel = "Continue", cancelLabel = "Cancel", danger = false, input = null } = {}) {
  const dialog = $("#app-prompt-dialog");
  if (!dialog?.showModal) return Promise.resolve(input ? window.prompt(message, input.value || "") : window.confirm(message));
  $("#app-prompt-title").textContent = title;
  $("#app-prompt-message").textContent = message;
  $("#app-prompt-confirm").textContent = confirmLabel;
  $("#app-prompt-cancel").textContent = cancelLabel;
  dialog.dataset.danger = String(Boolean(danger));
  const wrap = $("#app-prompt-input-wrap");
  const field = $("#app-prompt-input");
  wrap.hidden = !input;
  if (input) { $("#app-prompt-input-label").textContent = input.label || "Value"; field.value = input.value || ""; field.type = input.type || "text"; field.min = input.min || ""; field.max = input.max || ""; }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => { if (settled) return; settled = true; cleanup(); if (dialog.open) dialog.close(); resolve(value); };
    const submit = (event) => { event.preventDefault(); finish(input ? field.value : true); };
    const cancel = () => finish(input ? null : false);
    const cleanup = () => { $("#app-prompt-form").removeEventListener("submit", submit); $("#app-prompt-cancel").removeEventListener("click", cancel); $("#app-prompt-close").removeEventListener("click", cancel); dialog.removeEventListener("cancel", onCancel); };
    const onCancel = (event) => { event.preventDefault(); cancel(); };
    $("#app-prompt-form").addEventListener("submit", submit);
    $("#app-prompt-cancel").addEventListener("click", cancel);
    $("#app-prompt-close").addEventListener("click", cancel);
    dialog.addEventListener("cancel", onCancel);
    dialog.showModal();
    window.requestAnimationFrame(() => (input ? field : $("#app-prompt-confirm")).focus());
  });
}
window.AppDialog = {
  confirm: (message, options = {}) => openAppPrompt({ message, ...options }),
  prompt: (message, value = "", options = {}) => openAppPrompt({ message, input: { value, label: options.inputLabel, type: options.type, min: options.min, max: options.max }, ...options }),
};

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
  const measuredLocalBytes = localBytes + pdfBytes;
  const total = Math.max(Number(estimate?.usage) || 0, measuredLocalBytes);
  const quota = estimate?.quota || 0;
  const percent = quota ? Math.min(100, total / quota * 100) : 0;
  const localRisk = localBytes >= 4 * 1048576;
  const level = percent >= 90 || localBytes >= 8 * 1048576 ? "danger" : percent >= 75 || localRisk ? "warning" : "healthy";
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
  renderActiveNoteNotebookSelectors();
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
  renderActiveNoteNotebookSelectors();
}

function renderActiveNoteNotebookSelectors() {
  const note = activeNotebookNote();
  const folders = loadNoteFolders();
  const options = ['<option value="">Unfiled notes</option>', ...folders.map((folder) => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`)].join("");
  $$('[data-note-notebook-select]').forEach((select) => {
    select.innerHTML = options;
    select.value = note?.folderId && folders.some((folder) => folder.id === note.folderId) ? note.folderId : "";
    select.disabled = !note;
  });
}

function activeNotebookNote() {
  return loadNotebookNotes().find((note) => note.id === activeNoteId) || null;
}

function notePreview(note) {
  if (note.type === "drawing") {
    if (note.noteTemplate === "cornell") return "Cornell note";
    if (note.noteTemplate === "outline") return "Outline note";
    return note.canvasMode === "page" ? "Page note" : "Open note";
  }
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
    const folderNotes = notes.filter((note) => note.folderId === folder.id);
    const color = /^#[0-9a-f]{6}$/i.test(folder.color || "") ? folder.color : "#d9b66f";
    if (search && !items.length && !folder.name.toLowerCase().includes(search)) return "";
    return `<section class="note-folder" data-note-folder-drop="${escapeHtml(folder.id)}" style="--notebook-color:${color}"><div class="note-folder-heading"><button type="button" class="note-folder-toggle" data-toggle-note-folder="${escapeHtml(folder.id)}"><span class="note-folder-icon">▰</span><strong>${escapeHtml(folder.name)}</strong><span>${folder.expanded ? "⌃" : "⌄"}</span></button><button type="button" class="note-folder-action note-folder-add" data-new-note-in-folder="${escapeHtml(folder.id)}" aria-label="Create a page note in ${escapeHtml(folder.name)}">+</button><button type="button" class="note-folder-study" data-study-note-folder="${escapeHtml(folder.id)}" ${folderNotes.length ? "" : "disabled"}>Study</button><button type="button" class="note-folder-action" data-rename-note-folder="${escapeHtml(folder.id)}" aria-label="Edit ${escapeHtml(folder.name)} notebook">✎</button><button type="button" class="note-folder-action" data-delete-note-folder="${escapeHtml(folder.id)}" aria-label="Delete ${escapeHtml(folder.name)}">×</button></div><div class="note-folder-items" ${folder.expanded ? "" : "hidden"}>${items.length ? items.map(noteButton).join("") : '<div class="note-folder-empty">Drop notes here</div>'}</div></section>`;
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
  $$('[data-study-note-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => {
    openNotebookFolderStudy(button.dataset.studyNoteFolder);
  }));
  $$('[data-new-note-in-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => {
    createNotebookNote("page", button.dataset.newNoteInFolder);
  }));
  $$('[data-rename-note-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", () => {
    openNoteFolderRename(button.dataset.renameNoteFolder);
  }));
  $$('[data-delete-note-folder]', $("#notes-list")).forEach((button) => button.addEventListener("click", async () => {
    const records = loadNoteFolders(); const folder = records.find((item) => item.id === button.dataset.deleteNoteFolder);
    if (!folder || !await window.AppDialog.confirm(`Delete the notebook “${folder.name}”? Its notes will move to Unfiled notes.`, { title: "Delete notebook?", confirmLabel: "Delete notebook", danger: true })) return;
    saveNoteFolders(records.filter((item) => item.id !== folder.id));
    saveNotebookNotes(loadNotebookNotes().map((note) => note.folderId === folder.id ? { ...note, folderId: null } : note));
    renderNotesList();
    renderActiveNoteNotebookSelectors();
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

function cornellTemplateContent() {
  return `<div class="cornell-note-template">
    <div class="cornell-meta">
      <div class="cornell-topic-field"><span class="cornell-field-label cornell-static" contenteditable="false">Topic</span><div class="cornell-meta-entry" contenteditable="true" data-placeholder="Lecture or reading topic"></div></div>
      <div class="cornell-meta-field"><span class="cornell-field-label cornell-static" contenteditable="false">Course</span><div class="cornell-meta-entry" contenteditable="true" data-placeholder="Course or class"></div></div>
      <div class="cornell-meta-field"><span class="cornell-field-label cornell-static" contenteditable="false">Date</span><div class="cornell-meta-entry" contenteditable="true" data-placeholder="Month / day / year"></div></div>
    </div>
    <div class="cornell-columns">
      <div class="cornell-column cornell-cues"><div class="cornell-section-title cornell-static" contenteditable="false"><strong>Cues & questions</strong><span>Review after class</span></div><div class="cornell-writing-area" contenteditable="true" data-placeholder="Key terms, questions, formulas, and recall prompts"></div></div>
      <div class="cornell-column cornell-notes"><div class="cornell-section-title cornell-static" contenteditable="false"><strong>Notes</strong><span>Record during class</span></div><div class="cornell-writing-area" contenteditable="true" data-placeholder="Main ideas, explanations, examples, diagrams, and supporting details"></div></div>
    </div>
    <div class="cornell-summary"><div class="cornell-section-title cornell-static" contenteditable="false"><strong>Summary</strong><span>Write after reviewing the page</span></div><div class="cornell-writing-area" contenteditable="true" data-placeholder="Explain the central ideas in your own words"></div></div>
  </div>`;
}

function migrateCornellTemplateHtml(rawHtml) {
  const html = String(rawHtml || "");
  if (!html.trim()) return cornellTemplateContent();
  const holder = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild;
  const sourceTemplate = holder.querySelector(".cornell-note-template");
  if (!sourceTemplate) return html;
  const legacy = sourceTemplate.querySelector(".cornell-heading");
  const legacyColumns = sourceTemplate.querySelectorAll(".cornell-columns > section, .cornell-columns > div");
  const legacySummary = sourceTemplate.querySelector(".cornell-summary");
  const usefulHtml = (section, placeholder) => {
    if (!section) return "<br>";
    const clone = section.cloneNode(true);
    clone.querySelector("h1,h2,h3,h4")?.remove();
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    return !text || text.toLowerCase() === placeholder.toLowerCase() ? "<br>" : clone.innerHTML;
  };
  const upgraded = new DOMParser().parseFromString(`<div>${cornellTemplateContent()}</div>`, "text/html").body.firstElementChild;
  const entries = upgraded.querySelectorAll(".cornell-meta-entry");
  if (legacy) {
    const topic = legacy.querySelector("h1,h2,h3")?.textContent.trim() || "";
    const date = legacy.querySelector("p")?.textContent.replace(/^date\s*:?\s*/i, "").trim() || "";
    entries[0].innerHTML = topic && topic.toLowerCase() !== "topic" ? escapeHtml(topic) : "";
    entries[2].innerHTML = date ? escapeHtml(date) : "";
    upgraded.querySelector(".cornell-cues .cornell-writing-area").innerHTML = usefulHtml(legacyColumns[0], "Key terms and questions");
    upgraded.querySelector(".cornell-notes .cornell-writing-area").innerHTML = usefulHtml(legacyColumns[1], "Main ideas, examples, and details");
    upgraded.querySelector(".cornell-summary .cornell-writing-area").innerHTML = usefulHtml(legacySummary, "Summarize the page in your own words.");
  } else {
    const sourceEntries = sourceTemplate.querySelectorAll(".cornell-meta-entry");
    sourceEntries.forEach((entry, index) => {
      if (entries[index] && entry.textContent.trim()) entries[index].innerHTML = entry.innerHTML;
    });
    [".cornell-cues .cornell-writing-area", ".cornell-notes .cornell-writing-area", ".cornell-summary .cornell-writing-area"].forEach((selector) => {
      const source = sourceTemplate.querySelector(selector);
      const target = upgraded.querySelector(selector);
      if (source?.textContent.trim()) target.innerHTML = source.innerHTML;
    });
  }
  return upgraded.innerHTML;
}

function noteTemplateContent(type) {
  if (type === "cornell") return cornellTemplateContent();
  if (type === "outline") return '<div class="outline-note-template"><h2>Main topic</h2><p><strong>I. Key idea</strong></p><p>&nbsp;&nbsp;&nbsp;A. Supporting detail</p><p>&nbsp;&nbsp;&nbsp;B. Example or evidence</p><p><strong>II. Next key idea</strong></p><p>&nbsp;&nbsp;&nbsp;A. Supporting detail</p><p>&nbsp;&nbsp;&nbsp;B. Question to review</p><h3>Summary</h3><p>Write the central takeaway.</p></div>';
  return "";
}

function createNotebookNote(type, folderId = null) {
  const templated = type === "cornell" || type === "outline";
  const canvasMode = type === "page" || templated ? "page" : "open";
  const templateContent = noteTemplateContent(type);
  const title = type === "cornell" ? "Untitled Cornell note" : type === "outline" ? "Untitled outline" : canvasMode === "page" ? "Untitled page" : "Untitled open note";
  const note = { id: makeLocalId("note"), type: "drawing", noteTemplate: templated ? type : "blank", folderId: folderId || null, canvasMode, pageCount: 1, pageLayout: templated ? "document" : "pages", pageDocumentContent: templateContent, documentPages: templated ? [templateContent] : undefined, title, html: "", drawing: "", drawingWidth: canvasMode === "page" ? PAGE_CANVAS_WIDTH : DRAWING_CANVAS_WIDTH, drawingHeight: canvasMode === "page" ? PAGE_CANVAS_HEIGHT : DRAWING_CANVAS_HEIGHT, drawingTexts: [], drawingImages: [], updatedAt: Date.now() };
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

function presentationSlideParts(value) {
  const lines = String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const title = (lines.find((line) => /^##\s+/.test(line)) || lines[0] || "Untitled slide").replace(/^##\s+/, "");
  const body = lines.filter((line) => line !== lines[0] && !/^##\s+/.test(line)).map((line) => line.replace(/^[-*]\s+/, "")).join("\n");
  return { title, body };
}

async function createImportedPowerPointNotebookNote(payload, sourceFile = null) {
  const source = sourceFile || (payload?.data ? await (await fetch(payload.data)).blob() : null);
  if (!source) throw new Error("The original PowerPoint file could not be preserved.");
  const slides = Array.isArray(payload?.slides) && payload.slides.length
    ? payload.slides
    : String(payload?.text || "").split(/\n\s*\n(?=##\s+)/).filter((slide) => slide.trim());
  if (!slides.length) throw new Error("No readable slides were found in this PowerPoint.");
  const assetId = makeLocalId("pptx");
  await setNotebookAsset(assetId, source.slice(0, source.size, "application/vnd.openxmlformats-officedocument.presentationml.presentation"));
  const drawingTexts = [];
  slides.forEach((slide, index) => {
    const { title, body } = presentationSlideParts(slide);
    const pageY = index * (PRESENTATION_CANVAS_HEIGHT + PAGE_CANVAS_GAP);
    drawingTexts.push({ id: makeLocalId("slide-title"), text: title, x: 54, y: pageY + 42, screenWidth: 690, screenHeight: 60, screenFontSize: 29, style: "h1", bold: true, color: "#171b2d", fontFamily: "Arial", locked: true });
    if (body) drawingTexts.push({ id: makeLocalId("slide-body"), text: body, x: 70, y: pageY + 125, screenWidth: 660, screenHeight: 260, screenFontSize: 18, color: "#34384a", fontFamily: "Arial", locked: true });
  });
  const note = {
    id: makeLocalId("note"), type: "drawing", sourceFormat: "pptx", pptxAssetId: assetId,
    sourceFileName: payload?.name || sourceFile?.name || "Imported presentation.pptx",
    title: importDeckName(payload?.name || sourceFile?.name || "Imported presentation"),
    canvasMode: "page", pageCount: slides.length, pageLayout: "pages", presentationSlides: slides,
    drawing: "", drawingWidth: PAGE_CANVAS_WIDTH,
    drawingHeight: PRESENTATION_CANVAS_HEIGHT * slides.length + PAGE_CANVAS_GAP * Math.max(0, slides.length - 1),
    drawingStrokes: [], drawingTexts, drawingImages: [], updatedAt: Date.now(),
  };
  try {
    const notes = loadNotebookNotes(); notes.push(note); saveNotebookNotes(notes);
  } catch (error) { await removeNotebookAsset(assetId); throw error; }
  showAppView("notes"); openNotebookNote(note.id);
  showToast(`${note.title} imported as ${slides.length} drawable slides.`);
}

async function createImportedEditableNotebookNote(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch (_) {
    throw new Error("This YSB file is damaged or invalid.");
  }
  if (payload?.application !== "Your Study Buddy" || payload?.version !== 1 || payload?.type !== "editable-note" || payload?.note?.type !== "drawing") {
    throw new Error("This is not a valid editable YSB file.");
  }
  const source = payload.note;
  const note = {
    ...source,
    id: makeLocalId("note"),
    folderId: null,
    title: importDeckName(source.title || file.name || "Imported note"),
    drawingStrokes: Array.isArray(source.drawingStrokes) ? source.drawingStrokes : [],
    drawingTexts: Array.isArray(source.drawingTexts) ? source.drawingTexts : [],
    drawingImages: Array.isArray(source.drawingImages) ? source.drawingImages : [],
    canvasViewport: {
      zoom: Math.max(.01, Math.min(DRAWING_MAX_ZOOM, Number(payload.viewport?.zoom) || 1)),
      scrollLeft: Math.max(0, Number(payload.viewport?.scrollLeft) || 0),
      scrollTop: Math.max(0, Number(payload.viewport?.scrollTop) || 0),
    },
    updatedAt: Date.now(),
  };
  delete note.pdfAssetId;
  const notes = loadNotebookNotes();
  notes.push(note);
  saveNotebookNotes(notes);
  showAppView("notes");
  openNotebookNote(note.id);
  showToast(`${note.title} imported as a fully editable canvas.`);
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
  if (result.kind === "document" && result.extension === "pptx") return createImportedPowerPointNotebookNote(result);
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
  if (noteImageCropState) closeNoteImageCrop();
  activeNoteId = id;
  const note = activeNotebookNote();
  $("#notes-empty").hidden = Boolean(note);
  $("#word-note-editor").hidden = !note || note.type !== "word";
  $("#drawing-note-editor").hidden = !note || note.type !== "drawing";
  $("#pdf-note-editor").hidden = !note || note.type !== "pdf";
  if (!note) { renderNotesList(); return; }
  if (note.type === "word") {
    $("#word-note-title").value = note.title || "";
    $("#word-note-content").innerHTML = sanitizeNotesHtml(note.html || "");
  } else if (note.type === "drawing") {
    $("#drawing-note-title").value = note.title || "";
    notePageDocumentContent = note.pageDocumentContent || "";
    noteDocumentPages = Array.isArray(note.documentPages) && note.documentPages.length ? note.documentPages : [notePageDocumentContent];
    if (note.noteTemplate === "cornell") {
      noteDocumentPages = noteDocumentPages.map(migrateCornellTemplateHtml);
      notePageDocumentContent = noteDocumentPages[0] || "";
    }
    activeDocumentPage = Math.min(Math.max(0, Number(note.activeDocumentPage) || 0), noteDocumentPages.length - 1);
    noteDocumentLineSpacing = ["1", "1.15", "1.5", "2"].includes(String(note.documentLineSpacing)) ? String(note.documentLineSpacing) : "1.15";
    noteShowPageNumbers = Boolean(note.showPageNumbers);
    $("#document-show-page-numbers").checked = noteShowPageNumbers;
    configureNoteCanvas(note.canvasMode || "open", Math.max(note.pageCount || 1, noteDocumentPages.length), note.pageLayout === "continuous" ? "document" : note.pageLayout || "pages");
    loadDrawingNoteImage(note.drawing || "", note.drawingStrokes || [], note.drawingTexts || [], note.drawingImages || []);
    const savedViewport = note.canvasViewport || note.importedViewport;
    if (savedViewport && note.canvasMode !== "page") window.requestAnimationFrame(() => {
      const viewport = drawingNoteCanvas()?.parentElement;
      if (!viewport) return;
      setDrawingNoteZoom(savedViewport.zoom || 1);
      window.requestAnimationFrame(() => {
        viewport.scrollLeft = savedViewport.scrollLeft || 0;
        viewport.scrollTop = savedViewport.scrollTop || 0;
      });
    });
  } else if (note.type === "pdf") {
    $("#pdf-note-title").value = note.title || "Imported PDF";
    displayImportedPdf(note).catch(() => showToast("This imported PDF could not be opened."));
  }
  renderActiveNoteNotebookSelectors();
  renderNotesList();
}

async function deleteActiveNotebookNote() {
  const note = activeNotebookNote();
  if (!note || !await window.AppDialog.confirm(`Delete “${note.title || "Untitled note"}”? This cannot be undone.`, { title: "Delete note?", confirmLabel: "Delete note", danger: true })) return;
  const remaining = loadNotebookNotes().filter((item) => item.id !== note.id);
  saveNotebookNotes(remaining);
  if (note.pdfAssetId) removeNotebookAsset(note.pdfAssetId).catch(() => {});
  if (note.pptxAssetId) removeNotebookAsset(note.pptxAssetId).catch(() => {});
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
  $("#note-actions-publish").disabled = note.type === "pdf";
  $("#note-actions-publish").title = note.type === "pdf" ? "Imported PDFs cannot be published." : "Publish this note to Community.";
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

function publicNotePayload(note) {
  const source = JSON.parse(JSON.stringify(note));
  delete source.id;
  delete source.folderId;
  delete source.pdfAssetId;
  delete source.sourceFileName;
  delete source.updatedAt;
  return { version: 1, note: source };
}

async function publishNotebookNote(noteId) {
  if (noteId === activeNoteId) {
    const active = activeNotebookNote();
    if (active?.type === "word") updateNotebookNote({ title: $("#word-note-title").value.trim() || "Untitled note", html: sanitizeNotesHtml($("#word-note-content").innerHTML) }, false);
    else if (active?.type === "drawing") saveDrawingNote();
  }
  const note = loadNotebookNotes().find((item) => item.id === noteId);
  if (!note || note.type === "pdf") {
    showToast("Imported PDFs cannot be published.");
    return;
  }
  const summary = notebookNotePlainText(note).slice(0, 180) || (note.canvasMode === "page" ? "Shared page note" : "Shared open note");
  await publishCommunityItem({ kind: "note", sourceId: note.id, title: note.title || "Untitled note", summary, payload: publicNotePayload(note) });
}

function drawingNoteCanvas() { return $("#drawing-note-canvas"); }
function drawingWorkspaceWidth() { return noteCanvasMode === "page" ? PAGE_CANVAS_WIDTH : DRAWING_CANVAS_WIDTH; }
function drawingWorkspaceHeight() { const height = pageCanvasHeight(); return noteCanvasMode === "page" ? height * notePageCount + PAGE_CANVAS_GAP * Math.max(0, notePageCount - 1) : DRAWING_CANVAS_HEIGHT; }

function syncDocumentDrawingMode() {
  const documentMode = noteCanvasMode === "page" && notePageLayout === "document";
  const svg = drawingNoteCanvas();
  if (!svg) return;
  if (documentMode && noteDrawingTool !== "cursor") {
    noteDrawingTool = "cursor";
    $$('[data-note-tool]').forEach((button) => button.classList.toggle("active", button.dataset.noteTool === "cursor"));
    $("#canvas-text-options").hidden = true;
  }
  svg.style.pointerEvents = documentMode ? "none" : "auto";
  $("#drawing-note-editor").classList.remove("document-drawing-active");
  $("#page-document-pages").classList.toggle("text-editing-active", documentMode);
}

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
  }
  $("#drawing-note-editor").classList.toggle("document-note-mode", documentMode);
  svg.hidden = false;
  $("#page-document-pages").hidden = noteCanvasMode !== "page";
  $("#document-text-toolbar").hidden = !documentMode;
  $$("#drawing-zoom-out, #drawing-zoom-in, #drawing-zoom-fit, #drawing-zoom-value").forEach((control) => { control.hidden = noteCanvasMode === "page"; });
  $("#toggle-page-layout").hidden = noteCanvasMode !== "page";
  $("#page-actions").hidden = noteCanvasMode !== "page" || documentMode;
  $("#remove-note-page").disabled = notePageCount <= 1;
  $("#toggle-page-layout").textContent = documentMode ? "Drawing pages" : "Document writing";
  syncDocumentDrawingMode();
  if (noteCanvasMode === "page") renderDocumentPages();
  if (noteCanvasMode === "page") setDrawingNoteZoom(1);
  else window.requestAnimationFrame(() => {
    setDrawingNoteZoom(1, false);
    const viewport = svg.parentElement;
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  });
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
  canvas.style.setProperty("--page-display-height", `${displayWidth * pageCanvasHeight() / PAGE_CANVAS_WIDTH}px`);
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

function appendCanvasImageCropControls(group, imageItem, scale) {
  const rect = noteImageCropState?.rect;
  if (!rect) return;
  const left = imageItem.x + rect.x * imageItem.width;
  const top = imageItem.y + rect.y * imageItem.height;
  const width = rect.width * imageItem.width;
  const height = rect.height * imageItem.height;
  const right = left + width;
  const bottom = top + height;
  const shade = (x, y, shadeWidth, shadeHeight) => {
    if (shadeWidth <= 0 || shadeHeight <= 0) return;
    const region = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    region.setAttribute("x", String(x)); region.setAttribute("y", String(y));
    region.setAttribute("width", String(shadeWidth)); region.setAttribute("height", String(shadeHeight));
    region.setAttribute("fill", "#ffffff"); region.setAttribute("fill-opacity", ".58"); region.setAttribute("pointer-events", "none");
    group.appendChild(region);
  };
  shade(imageItem.x, imageItem.y, imageItem.width, top - imageItem.y);
  shade(imageItem.x, bottom, imageItem.width, imageItem.y + imageItem.height - bottom);
  shade(imageItem.x, top, left - imageItem.x, height);
  shade(right, top, imageItem.x + imageItem.width - right, height);
  const selection = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  selection.dataset.noteCropHandle = "move";
  selection.setAttribute("x", String(left)); selection.setAttribute("y", String(top));
  selection.setAttribute("width", String(width)); selection.setAttribute("height", String(height));
  selection.setAttribute("fill", "transparent"); selection.setAttribute("stroke", "#111111");
  selection.setAttribute("stroke-width", String(2 * scale)); selection.setAttribute("stroke-dasharray", `${5 * scale} ${4 * scale}`);
  selection.setAttribute("pointer-events", "fill"); selection.style.cursor = "move";
  group.appendChild(selection);
  const edges = [
    ["n", left, top, right, top, "ns-resize"],
    ["e", right, top, right, bottom, "ew-resize"],
    ["s", left, bottom, right, bottom, "ns-resize"],
    ["w", left, top, left, bottom, "ew-resize"],
  ];
  edges.forEach(([mode, x1, y1, x2, y2, cursor]) => {
    const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
    edge.dataset.noteCropHandle = mode;
    edge.setAttribute("x1", String(x1)); edge.setAttribute("y1", String(y1));
    edge.setAttribute("x2", String(x2)); edge.setAttribute("y2", String(y2));
    edge.setAttribute("stroke", "transparent"); edge.setAttribute("stroke-width", String(18 * scale));
    edge.setAttribute("pointer-events", "stroke"); edge.style.cursor = cursor;
    group.appendChild(edge);
  });
  const grips = [
    ["nw", left, top, "nwse-resize"], ["n", left + width / 2, top, "ns-resize"], ["ne", right, top, "nesw-resize"],
    ["e", right, top + height / 2, "ew-resize"], ["se", right, bottom, "nwse-resize"], ["s", left + width / 2, bottom, "ns-resize"],
    ["sw", left, bottom, "nesw-resize"], ["w", left, top + height / 2, "ew-resize"],
  ];
  grips.forEach(([mode, x, y, cursor]) => {
    const grip = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const size = 14 * scale;
    grip.dataset.noteCropHandle = mode;
    grip.setAttribute("x", String(x - size / 2)); grip.setAttribute("y", String(y - size / 2));
    grip.setAttribute("width", String(size)); grip.setAttribute("height", String(size));
    grip.setAttribute("fill", "#111111"); grip.setAttribute("stroke", "#ffffff"); grip.setAttribute("stroke-width", String(scale));
    grip.setAttribute("pointer-events", "all"); grip.style.cursor = cursor;
    group.appendChild(grip);
  });
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
      page.setAttribute("y", String(pageIndex * (pageCanvasHeight() + PAGE_CANVAS_GAP)));
      page.setAttribute("width", String(PAGE_CANVAS_WIDTH));
      page.setAttribute("height", String(pageCanvasHeight()));
      page.setAttribute("rx", "3");
      page.setAttribute("fill", notePageLayout === "document" ? "transparent" : "#ffffff");
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
    image.setAttribute("stroke", "none");
    image.style.cursor = noteDrawingTool === "cursor" ? "move" : "crosshair";
    const selectAndMoveImage = (event) => {
      if (noteDrawingTool !== "cursor") return;
      event.preventDefault(); event.stopPropagation();
      selectedNoteImageId = imageItem.id;
      selectedCanvasTextId = null;
      if (event.detail > 1) {
        noteImageTransform = null;
        openNoteImageCrop({ kind: "canvas", imageId: imageItem.id, src: imageItem.src });
        return;
      }
      pushDrawingNoteHistory();
      const point = noteCanvasPoint(event);
      noteImageTransform = { mode: "move", pointerId: event.pointerId, start: point, original: { ...imageItem } };
      viewport.setPointerCapture(event.pointerId);
      renderDrawingNoteVectors();
    };
    image.addEventListener("pointerdown", selectAndMoveImage);
    image.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectedNoteImageId = imageItem.id;
      noteImageTransform = null;
      openNoteImageCrop({ kind: "canvas", imageId: imageItem.id, src: imageItem.src });
    });
    group.appendChild(image);
    const imageHitTarget = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    imageHitTarget.dataset.noteImageId = imageItem.id;
    imageHitTarget.setAttribute("x", String(imageItem.x));
    imageHitTarget.setAttribute("y", String(imageItem.y));
    imageHitTarget.setAttribute("width", String(imageItem.width));
    imageHitTarget.setAttribute("height", String(imageItem.height));
    imageHitTarget.setAttribute("fill", "#ffffff");
    imageHitTarget.setAttribute("fill-opacity", "0");
    imageHitTarget.setAttribute("stroke", "none");
    imageHitTarget.setAttribute("pointer-events", noteDrawingTool === "cursor" ? "all" : "none");
    imageHitTarget.style.cursor = noteDrawingTool === "cursor" ? "move" : "crosshair";
    imageHitTarget.addEventListener("pointerdown", selectAndMoveImage);
    imageHitTarget.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectedNoteImageId = imageItem.id;
      noteImageTransform = null;
      openNoteImageCrop({ kind: "canvas", imageId: imageItem.id, src: imageItem.src });
    });
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
    const selectionScale = drawingWorkspaceWidth() / Math.max(1, svg.getBoundingClientRect().width);
    const croppingThisImage = noteImageCropState?.target?.kind === "canvas" && noteImageCropState.target.imageId === imageItem.id;
    if (selectedNoteImageId === imageItem.id && !croppingThisImage) {
      const outline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      outline.setAttribute("x", String(imageItem.x)); outline.setAttribute("y", String(imageItem.y));
      outline.setAttribute("width", String(imageItem.width)); outline.setAttribute("height", String(imageItem.height));
      outline.setAttribute("fill", "none"); outline.setAttribute("stroke", "#665ee8"); outline.setAttribute("stroke-width", String(2 * selectionScale)); outline.setAttribute("stroke-dasharray", `${6 * selectionScale} ${4 * selectionScale}`);
      outline.setAttribute("pointer-events", "none"); group.appendChild(outline);
      const addHandle = (kind, x, y, cursor, symbol) => {
        const handleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        handleGroup.dataset.noteImageControl = kind;
        handleGroup.dataset.noteImageId = imageItem.id;
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
      addHandle("delete", imageItem.x + imageItem.width, imageItem.y, "pointer", "×");
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
  const canvasCropActive = noteImageCropState?.target?.kind === "canvas" && noteImageCropState.target.imageId === selectedImage?.id;
  const cropButton = $("#crop-note-image");
  if (cropButton) {
    cropButton.textContent = "Crop";
    cropButton.disabled = canvasCropActive;
    cropButton.title = canvasCropActive ? "Drag the dotted crop frame, then click outside the image" : "Crop this image in place";
  }
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
    if (textItem.locked) shell.style.pointerEvents = "none";
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
    removeButton.hidden = Boolean(textItem.locked);
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
    editor.readOnly = Boolean(textItem.locked);
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
  hydrateDrawingImageAspectRatios();
}

async function hydrateDrawingImageAspectRatios() {
  const noteId = activeNoteId;
  let changed = false;
  await Promise.all(noteDrawingImages.map(async (imageItem) => {
    if (Number(imageItem.aspectRatio) > 0) return;
    const source = imageItem.src;
    const loaded = await loadExportImage(source).catch(() => null);
    if (!loaded || activeNoteId !== noteId) return;
    const current = noteDrawingImages.find((candidate) => candidate.id === imageItem.id && candidate.src === source);
    if (!current) return;
    const aspectRatio = (loaded.naturalWidth || loaded.width) / Math.max(1, loaded.naturalHeight || loaded.height);
    if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return;
    const centerX = current.x + current.width / 2;
    const centerY = current.y + current.height / 2;
    let width = current.width;
    let height = width / aspectRatio;
    const minimumScale = Math.max(1, 60 / Math.max(1, width), 40 / Math.max(1, height));
    width *= minimumScale;
    height = width / aspectRatio;
    const fitScale = Math.min(1, drawingWorkspaceWidth() / Math.max(1, width), drawingWorkspaceHeight() / Math.max(1, height));
    width *= fitScale;
    height = width / aspectRatio;
    current.aspectRatio = aspectRatio;
    current.width = width;
    current.height = height;
    current.x = Math.max(0, Math.min(drawingWorkspaceWidth() - width, centerX - width / 2));
    current.y = Math.max(0, Math.min(drawingWorkspaceHeight() - height, centerY - height / 2));
    changed = true;
  }));
  if (!changed || activeNoteId !== noteId) return;
  renderDrawingNoteVectors();
  saveDrawingNote();
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
  const viewport = drawingNoteCanvas()?.parentElement;
  updateNotebookNote({ title: $("#drawing-note-title").value.trim() || "Untitled note", canvasMode: noteCanvasMode, pageCount: notePageCount, pageLayout: notePageLayout, pageDocumentContent: notePageDocumentContent, documentPages: noteDocumentPages, activeDocumentPage, documentLineSpacing: noteDocumentLineSpacing, showPageNumbers: noteShowPageNumbers, drawing: noteDrawingLegacyImage, drawingStrokes: noteDrawingStrokes, drawingTexts: noteDrawingTexts, drawingImages: noteDrawingImages, drawingWidth: drawingWorkspaceWidth(), drawingHeight: drawingWorkspaceHeight(), canvasViewport: { zoom: noteDrawingZoom, scrollLeft: viewport?.scrollLeft || 0, scrollTop: viewport?.scrollTop || 0 } }, false);
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
  const aspectRatio = pasted.width / Math.max(1, pasted.height);
  let width = Math.max(24 * canvasUnitsPerScreenX, pasted.width * screenScale * canvasUnitsPerScreenX);
  let height = width / aspectRatio;
  const maximumHeight = viewportRect.height * .46 * canvasUnitsPerScreenY;
  if (height > maximumHeight) { height = maximumHeight; width = height * aspectRatio; }
  const imageItem = { id: makeLocalId("note-image"), src: pasted.src, originalSrc: pasted.src, cropRect: { x: 0, y: 0, width: 1, height: 1 }, x: Math.max(0, point.x - width / 2), y: Math.max(0, point.y - height / 2), width, height, aspectRatio, rotation: 0, caption: "", layer: "front" };
  pushDrawingNoteHistory();
  noteDrawingImages.push(imageItem);
  selectedNoteImageId = imageItem.id;
  renderDrawingNoteVectors();
  saveDrawingNote();
  showToast("Image pasted. Drag to move it, use the handles to resize or rotate, and double-click to crop in place.");
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

function clampCropValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizedStoredCrop(value) {
  const source = value && typeof value === "object" ? value : {};
  const x = clampCropValue(Number(source.x) || 0, 0, .94);
  const y = clampCropValue(Number(source.y) || 0, 0, .94);
  const width = clampCropValue(Number(source.width) || 1, .06, 1 - x);
  const height = clampCropValue(Number(source.height) || 1, .06, 1 - y);
  return { x, y, width, height };
}

function canvasCropSourceFrame(imageItem, crop = normalizedStoredCrop(imageItem?.cropRect)) {
  const width = imageItem.width / Math.max(.06, crop.width);
  const height = imageItem.height / Math.max(.06, crop.height);
  return {
    x: imageItem.x - crop.x * width,
    y: imageItem.y - crop.y * height,
    width,
    height,
  };
}

function documentImageStoredCrop(image) {
  return normalizedStoredCrop({
    x: image?.dataset.cropX,
    y: image?.dataset.cropY,
    width: image?.dataset.cropWidth,
    height: image?.dataset.cropHeight,
  });
}

function saveDocumentImageCropMetadata(image, originalSource, rect) {
  image.dataset.originalSrc = originalSource;
  image.dataset.cropX = String(rect.x);
  image.dataset.cropY = String(rect.y);
  image.dataset.cropWidth = String(rect.width);
  image.dataset.cropHeight = String(rect.height);
}

function noteImageCropTargetMatches(target) {
  if (!noteImageCropState?.target || !target) return false;
  if (target.kind !== noteImageCropState.target.kind) return false;
  return target.kind === "canvas" ? target.imageId === noteImageCropState.target.imageId : target.image === noteImageCropState.target.image;
}

function renderDocumentInlineCrop() {
  const target = noteImageCropState?.target;
  const activeFigure = target?.kind === "document" && target.image?.isConnected ? target.image.closest("figure") : null;
  $$('[data-document-crop-overlay]').forEach((overlay) => {
    if (activeFigure && overlay.closest("figure") === activeFigure) return;
    overlay.closest("figure")?.classList.remove("is-cropping");
    overlay.remove();
  });
  if (!activeFigure) return;
  const figure = target.image.closest("figure");
  figure.classList.add("is-cropping");
  let overlay = figure.querySelector("[data-document-crop-overlay]");
  if (overlay) {
    overlay.style.left = `${target.image.offsetLeft}px`;
    overlay.style.top = `${target.image.offsetTop}px`;
    overlay.style.width = `${target.sourceDisplayWidth}px`;
    overlay.style.height = `${target.sourceDisplayHeight}px`;
    const selection = overlay.querySelector(".document-inline-crop-selection");
    const rect = noteImageCropState.rect;
    selection.style.left = `${rect.x * 100}%`;
    selection.style.top = `${rect.y * 100}%`;
    selection.style.width = `${rect.width * 100}%`;
    selection.style.height = `${rect.height * 100}%`;
    return;
  }
  overlay = document.createElement("div");
  overlay.className = "document-inline-crop";
  overlay.dataset.documentCropOverlay = "true";
  overlay.setAttribute("contenteditable", "false");
  overlay.style.left = `${target.image.offsetLeft}px`;
  overlay.style.top = `${target.image.offsetTop}px`;
  overlay.style.width = `${target.sourceDisplayWidth}px`;
  overlay.style.height = `${target.sourceDisplayHeight}px`;
  const sourcePreview = document.createElement("img");
  sourcePreview.className = "note-inline-crop-source";
  sourcePreview.src = target.src;
  sourcePreview.alt = "";
  const selection = document.createElement("div");
  selection.className = "document-inline-crop-selection";
  selection.dataset.noteCropHandle = "move";
  selection.setAttribute("role", "group");
  selection.setAttribute("aria-label", "Image crop selection. Drag the dotted black edge or handles, then press Enter to apply or Escape to cancel.");
  const rect = noteImageCropState.rect;
  selection.style.left = `${rect.x * 100}%`;
  selection.style.top = `${rect.y * 100}%`;
  selection.style.width = `${rect.width * 100}%`;
  selection.style.height = `${rect.height * 100}%`;
  ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((handle) => {
    const grip = document.createElement("span");
    grip.className = "document-inline-crop-handle";
    grip.dataset.noteCropHandle = handle;
    selection.appendChild(grip);
  });
  ["n", "e", "s", "w"].forEach((handle) => {
    const edge = document.createElement("span");
    edge.className = "document-inline-crop-edge";
    edge.dataset.noteCropHandle = handle;
    selection.appendChild(edge);
  });
  overlay.append(sourcePreview, selection);
  figure.appendChild(overlay);
  overlay.addEventListener("pointerdown", (event) => {
    const mode = documentCropModeAtEvent(event, selection);
    if (!mode) return;
    event.preventDefault();
    event.stopPropagation();
    beginNoteImageCropDrag(event, mode, "document");
    overlay.setPointerCapture(event.pointerId);
  });
  overlay.addEventListener("pointermove", (event) => { if (moveNoteImageCropDrag(event, "document")) event.stopPropagation(); });
  overlay.addEventListener("pointerup", (event) => { event.stopPropagation(); finishNoteImageCropDrag(event); });
  overlay.addEventListener("pointercancel", (event) => { event.stopPropagation(); finishNoteImageCropDrag(event); });
  overlay.addEventListener("dblclick", (event) => { event.preventDefault(); applyNoteImageCrop(); });
}

function renderCanvasInlineCrop() {
  const target = noteImageCropState?.target;
  const canvas = drawingNoteCanvas();
  const viewport = canvas?.parentElement;
  const image = target?.kind === "canvas" ? canvas?.querySelector(`[data-note-image-id="${CSS.escape(target.imageId)}"]`) : null;
  let overlay = viewport?.querySelector("[data-canvas-crop-overlay]");
  if (!image || !viewport || !noteImageCropState) {
    overlay?.remove();
    return;
  }
  const viewportRect = viewport.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const sourceFrame = target.sourceFrame;
  const scaleX = canvasRect.width / drawingWorkspaceWidth();
  const scaleY = canvasRect.height / drawingWorkspaceHeight();
  const left = canvasRect.left - viewportRect.left + viewport.scrollLeft + sourceFrame.x * scaleX;
  const top = canvasRect.top - viewportRect.top + viewport.scrollTop + sourceFrame.y * scaleY;
  const sourceWidth = sourceFrame.width * scaleX;
  const sourceHeight = sourceFrame.height * scaleY;
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "canvas-inline-crop";
    overlay.dataset.canvasCropOverlay = "true";
    const sourcePreview = document.createElement("img");
    sourcePreview.className = "note-inline-crop-source";
    sourcePreview.src = target.src;
    sourcePreview.alt = "";
    const selection = document.createElement("div");
    selection.className = "document-inline-crop-selection";
    selection.dataset.noteCropHandle = "move";
    selection.setAttribute("aria-label", "Image crop selection. Drag a dotted edge or black handle. Click outside to finish.");
    ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((handle) => {
      const grip = document.createElement("span");
      grip.className = "document-inline-crop-handle";
      grip.dataset.noteCropHandle = handle;
      selection.appendChild(grip);
    });
    ["n", "e", "s", "w"].forEach((handle) => {
      const edge = document.createElement("span");
      edge.className = "document-inline-crop-edge";
      edge.dataset.noteCropHandle = handle;
      selection.appendChild(edge);
    });
    overlay.append(sourcePreview, selection);
    viewport.appendChild(overlay);
    overlay.addEventListener("pointerdown", (event) => {
      const mode = event.target.closest?.("[data-note-crop-handle]")?.dataset.noteCropHandle;
      if (!mode) return;
      event.preventDefault(); event.stopPropagation();
      beginNoteImageCropDrag(event, mode, "canvas");
      overlay.setPointerCapture(event.pointerId);
    });
    overlay.addEventListener("pointermove", (event) => { if (moveNoteImageCropDrag(event, "canvas")) event.stopPropagation(); });
    overlay.addEventListener("pointerup", (event) => { event.stopPropagation(); finishNoteImageCropDrag(event); });
    overlay.addEventListener("pointercancel", (event) => { event.stopPropagation(); finishNoteImageCropDrag(event); });
    overlay.addEventListener("dblclick", (event) => { event.preventDefault(); event.stopPropagation(); applyNoteImageCrop(); });
  }
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.width = `${sourceWidth}px`;
  overlay.style.height = `${sourceHeight}px`;
  const selection = overlay.querySelector(".document-inline-crop-selection");
  const rect = noteImageCropState.rect;
  selection.style.left = `${rect.x * 100}%`;
  selection.style.top = `${rect.y * 100}%`;
  selection.style.width = `${rect.width * 100}%`;
  selection.style.height = `${rect.height * 100}%`;
}

function renderNoteImageCropSelection() {
  if (!noteImageCropState) return;
  if (noteImageCropState.target.kind === "canvas") {
    if (!document.querySelector("[data-canvas-crop-overlay]")) renderDrawingNoteVectors();
    renderCanvasInlineCrop();
  }
  else {
    renderDocumentInlineCrop();
    updateDocumentCropButton();
  }
}

function closeNoteImageCrop() {
  const previousTarget = noteImageCropState?.target;
  noteImageCropState = null;
  document.querySelector("[data-canvas-crop-overlay]")?.remove();
  if (previousTarget?.kind === "document" && !previousTarget.applied) {
    const figure = previousTarget.image?.closest("figure");
    if (figure) {
      figure.style.width = previousTarget.previousFigureWidth;
      figure.style.height = previousTarget.previousFigureHeight;
    }
  }
  renderDocumentInlineCrop();
  if (previousTarget?.kind === "canvas") renderDrawingNoteVectors();
  updateDocumentCropButton();
}

function focusCanvasImageForCrop(imageItem, sourceFrame = canvasCropSourceFrame(imageItem)) {
  const canvas = drawingNoteCanvas();
  const viewport = canvas?.parentElement;
  if (!canvas || !viewport || !imageItem) return;
  const horizontalZoom = .82 * drawingWorkspaceWidth() / Math.max(1, 40 * sourceFrame.width);
  const verticalZoom = .72 * viewport.clientHeight * drawingWorkspaceWidth() / Math.max(1, viewport.clientWidth * 40 * sourceFrame.height);
  setDrawingNoteZoom(Math.min(1, horizontalZoom, verticalZoom));
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    const scale = canvas.scrollWidth / drawingWorkspaceWidth();
    viewport.scrollLeft = Math.max(0, (sourceFrame.x + sourceFrame.width / 2) * scale - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, (sourceFrame.y + sourceFrame.height / 2) * scale - viewport.clientHeight / 2);
    renderOpenNoteTextLayer();
    renderCanvasInlineCrop();
  }));
}

function openNoteImageCrop(target) {
  if (!target?.src) return;
  if (noteImageCropTargetMatches(target)) {
    applyNoteImageCrop();
    return;
  }
  closeNoteImageCrop();
  let initialRect = { x: 0, y: 0, width: 1, height: 1 };
  if (target.kind === "canvas") {
    const imageItem = noteDrawingImages.find((item) => item.id === target.imageId);
    if (!imageItem) return;
    initialRect = normalizedStoredCrop(imageItem.cropRect);
    target.src = imageItem.originalSrc || imageItem.src;
    target.sourceFrame = canvasCropSourceFrame(imageItem, initialRect);
  } else if (target.kind === "document") {
    const figure = target.image.closest("figure");
    if (!figure) return;
    initialRect = documentImageStoredCrop(target.image);
    target.src = target.image.dataset.originalSrc || target.image.src;
    target.previousFigureWidth = figure.style.width;
    target.previousFigureHeight = figure.style.height;
    const currentFigureWidth = figure.getBoundingClientRect().width;
    const sourceFigureWidth = currentFigureWidth / Math.max(.06, initialRect.width);
    const sourceNaturalWidth = Number(target.image.dataset.originalWidth) || target.image.naturalWidth || 1;
    const sourceNaturalHeight = Number(target.image.dataset.originalHeight) || target.image.naturalHeight || 1;
    target.sourceNaturalWidth = sourceNaturalWidth;
    target.sourceNaturalHeight = sourceNaturalHeight;
    target.sourceFigureWidth = sourceFigureWidth;
    target.sourceDisplayWidth = Math.max(1, sourceFigureWidth - 20);
    target.sourceDisplayHeight = target.sourceDisplayWidth * sourceNaturalHeight / Math.max(1, sourceNaturalWidth);
    figure.style.width = `min(100%, ${Math.round(sourceFigureWidth)}px)`;
    figure.style.height = `${Math.round(target.sourceDisplayHeight + 40)}px`;
  }
  noteImageCropState = {
    target,
    rect: initialRect,
    drag: null,
  };
  renderNoteImageCropSelection();
  if (target.kind === "canvas") {
    focusCanvasImageForCrop(noteDrawingImages.find((item) => item.id === target.imageId), target.sourceFrame);
  }
  showToast("Crop mode: drag any dotted edge inward, then click outside the image.");
}

function normalizedCropPointer(event, kind) {
  if (kind === "canvas") {
    const frame = document.querySelector("[data-canvas-crop-overlay]")?.getBoundingClientRect();
    if (!frame) return null;
    return { x: (event.clientX - frame.left) / Math.max(1, frame.width), y: (event.clientY - frame.top) / Math.max(1, frame.height) };
  }
  const image = noteImageCropState?.target?.image;
  if (!image?.isConnected) return null;
  const frame = image.getBoundingClientRect();
  return { x: (event.clientX - frame.left) / Math.max(1, frame.width), y: (event.clientY - frame.top) / Math.max(1, frame.height) };
}

function cropModeAtNormalizedPoint(rect, point, toleranceX, toleranceY) {
  if (!rect || !point) return "";
  const left = rect.x;
  const top = rect.y;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  if (point.x < left - toleranceX || point.x > right + toleranceX || point.y < top - toleranceY || point.y > bottom + toleranceY) return "";
  const horizontal = Math.abs(point.x - left) <= toleranceX ? "w" : Math.abs(point.x - right) <= toleranceX ? "e" : "";
  const vertical = Math.abs(point.y - top) <= toleranceY ? "n" : Math.abs(point.y - bottom) <= toleranceY ? "s" : "";
  if (horizontal || vertical) return `${vertical}${horizontal}`;
  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom ? "move" : "";
}

function canvasCropModeAtEvent(event) {
  const imageItem = noteDrawingImages.find((item) => item.id === noteImageCropState?.target?.imageId);
  const canvas = drawingNoteCanvas();
  if (!imageItem || !canvas) return "";
  const point = normalizedCropPointer(event, "canvas");
  const frame = document.querySelector("[data-canvas-crop-overlay]")?.getBoundingClientRect();
  const screenWidth = frame?.width || 1;
  const screenHeight = frame?.height || 1;
  return cropModeAtNormalizedPoint(noteImageCropState.rect, point, 18 / Math.max(1, screenWidth), 18 / Math.max(1, screenHeight));
}

function documentCropModeAtEvent(event, selection) {
  const frame = selection?.getBoundingClientRect();
  const point = normalizedCropPointer(event, "document");
  if (!frame || !point) return "";
  return cropModeAtNormalizedPoint(noteImageCropState.rect, point, 18 / Math.max(1, frame.width), 18 / Math.max(1, frame.height));
}

function beginNoteImageCropDrag(event, mode, kind) {
  if (!noteImageCropState || noteImageCropState.target.kind !== kind) return;
  const point = normalizedCropPointer(event, kind);
  if (!point) return;
  noteImageCropState.drag = { pointerId: event.pointerId, kind, mode, startX: point.x, startY: point.y, rect: { ...noteImageCropState.rect } };
}

function resizedCropRect(rect, mode, deltaX, deltaY) {
  const minimum = .06;
  if (mode === "move") {
    return {
      ...rect,
      x: clampCropValue(rect.x + deltaX, 0, 1 - rect.width),
      y: clampCropValue(rect.y + deltaY, 0, 1 - rect.height),
    };
  }
  let left = rect.x;
  let top = rect.y;
  let right = rect.x + rect.width;
  let bottom = rect.y + rect.height;
  if (mode.includes("w")) left = clampCropValue(left + deltaX, 0, right - minimum);
  if (mode.includes("e")) right = clampCropValue(right + deltaX, left + minimum, 1);
  if (mode.includes("n")) top = clampCropValue(top + deltaY, 0, bottom - minimum);
  if (mode.includes("s")) bottom = clampCropValue(bottom + deltaY, top + minimum, 1);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function moveNoteImageCropDrag(event, kind) {
  const drag = noteImageCropState?.drag;
  if (!drag || drag.kind !== kind || drag.pointerId !== event.pointerId) return false;
  const point = normalizedCropPointer(event, kind);
  if (!point) return false;
  event.preventDefault();
  const deltaX = point.x - drag.startX;
  const deltaY = point.y - drag.startY;
  noteImageCropState.rect = resizedCropRect(drag.rect, drag.mode, deltaX, deltaY);
  renderNoteImageCropSelection();
  return true;
}

function finishNoteImageCropDrag(event) {
  if (!noteImageCropState?.drag || noteImageCropState.drag.pointerId !== event.pointerId) return;
  noteImageCropState.drag = null;
}

async function cropNoteImageSource(source, rect) {
  const image = await loadExportImage(source);
  if (!image) throw new Error("The selected image could not be opened.");
  const sourceX = Math.round(rect.x * image.naturalWidth);
  const sourceY = Math.round(rect.y * image.naturalHeight);
  const sourceWidth = Math.max(1, Math.round(rect.width * image.naturalWidth));
  const sourceHeight = Math.max(1, Math.round(rect.height * image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  canvas.getContext("2d").drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
  return { src: canvas.toDataURL("image/png"), width: sourceWidth, height: sourceHeight };
}

function croppedCanvasImageFrame(imageItem, rect) {
  return {
    x: imageItem.x + rect.x * imageItem.width,
    y: imageItem.y + rect.y * imageItem.height,
    width: imageItem.width * rect.width,
    height: imageItem.height * rect.height,
  };
}

async function applyNoteImageCrop() {
  if (!noteImageCropState) return;
  const { target, rect } = noteImageCropState;
  try {
    const cropped = await cropNoteImageSource(target.src, rect);
    if (target.kind === "canvas") {
      const imageItem = noteDrawingImages.find((item) => item.id === target.imageId);
      if (!imageItem) throw new Error("The selected image is no longer available.");
      pushDrawingNoteHistory();
      const croppedFrame = croppedCanvasImageFrame(target.sourceFrame, rect);
      imageItem.originalSrc = target.src;
      imageItem.cropRect = { ...rect };
      imageItem.src = cropped.src;
      imageItem.aspectRatio = cropped.width / cropped.height;
      imageItem.x = croppedFrame.x;
      imageItem.y = croppedFrame.y;
      imageItem.width = croppedFrame.width;
      imageItem.height = croppedFrame.height;
      renderDrawingNoteVectors();
      saveDrawingNote();
    } else if (target.kind === "document" && target.image?.isConnected) {
      const figure = target.image.closest("figure");
      const croppedDisplayWidth = Math.max(80, target.sourceFigureWidth * rect.width);
      target.image.src = cropped.src;
      target.image.dataset.originalWidth = String(target.sourceNaturalWidth || cropped.width);
      target.image.dataset.originalHeight = String(target.sourceNaturalHeight || cropped.height);
      saveDocumentImageCropMetadata(target.image, target.src, rect);
      $$('[data-document-crop-overlay]').forEach((overlay) => overlay.remove());
      figure?.classList.remove("is-cropping");
      if (figure) {
        figure.style.width = `min(100%, ${Math.round(croppedDisplayWidth)}px)`;
        figure.style.height = "";
      }
      target.applied = true;
      saveDocumentEditor(target.editor);
    }
    closeNoteImageCrop();
    showToast("Image cropped. Undo is available for open-note images.");
  } catch (error) {
    showToast(error?.message || "The image could not be cropped.");
  }
}

function updateDocumentCropButton() {
  const button = $("#document-crop-image");
  const documentCropActive = noteImageCropState?.target?.kind === "document" && noteImageCropState.target.image === selectedDocumentImage?.image;
  if (button) {
    button.disabled = !selectedDocumentImage?.image?.isConnected || documentCropActive;
    button.textContent = "Crop selected image";
  }
}

async function pasteImageIntoDocument(editor, file) {
  const pasted = await clipboardImageDataUrl(file);
  editor.focus();
  const availableWidth = Math.max(160, editor.clientWidth - 164);
  const availableHeight = Math.max(180, editor.clientHeight - 190);
  const scale = Math.min(1, availableWidth / pasted.width, availableHeight / pasted.height);
  const displayWidth = Math.max(80, Math.round(pasted.width * scale));
  document.execCommand("insertHTML", false, `<figure class="document-pasted-image" contenteditable="false" data-rotation="0" style="width:min(100%,${displayWidth}px)"><img src="${pasted.src}" data-original-src="${pasted.src}" data-original-width="${pasted.width}" data-original-height="${pasted.height}" data-crop-x="0" data-crop-y="0" data-crop-width="1" data-crop-height="1" alt="Pasted image" style="width:100%;height:auto;transform:rotate(0deg)"><figcaption>Drag the lower-right corner to resize · Double-click to crop · Shift-double-click for options</figcaption></figure><p><br></p>`);
  saveDocumentEditor(editor);
  showToast("Image pasted. Double-click to crop in place, or Shift-double-click for size, rotation, and caption options.");
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

function placeCaretAtEditableStart(field) {
  if (!field) return;
  const hasOnlyPlaceholderBreaks = !field.textContent.trim() && [...field.childNodes].every((node) => node.nodeName === "BR" || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()));
  if (hasOnlyPlaceholderBreaks) field.replaceChildren();
  field.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(field);
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function wireDocumentEditor(editor) {
  editor.querySelectorAll(".document-pasted-image").forEach((figure) => {
    const image = figure.querySelector("img");
    if (!image) return;
    if (!figure.style.width) {
      const legacyWidth = image.style.width.match(/([\d.]+)px/)?.[1];
      figure.style.width = `${Math.max(80, Math.min(650, Number(legacyWidth) || 320))}px`;
    }
    image.style.width = "100%";
    image.style.height = "auto";
  });
  editor._lastValidHtml = editor.innerHTML || "";
  editor.addEventListener("beforeinput", (event) => {
    editor._pendingInput = { inputType: event.inputType, data: event.data ?? event.dataTransfer?.getData("text/plain") ?? "" };
  });
  editor.addEventListener("focus", () => setActiveDocumentPage(editor.dataset.documentPage));
  editor.addEventListener("focusin", (event) => {
    const cornellField = event.target.closest?.(".cornell-meta-entry, .cornell-writing-area");
    if (!cornellField || !editor.contains(cornellField) || cornellField.textContent.trim()) return;
    window.requestAnimationFrame(() => placeCaretAtEditableStart(cornellField));
  });
  editor.addEventListener("pointerdown", (event) => {
    if (noteImageCropState?.target?.kind === "document" && !event.target.closest?.("[data-document-crop-overlay]")) {
      event.preventDefault();
      event.stopPropagation();
      applyNoteImageCrop();
      return;
    }
    const cornellField = event.target.closest?.(".cornell-meta-entry, .cornell-writing-area");
    if (cornellField && !cornellField.textContent.trim()) {
      const placeholderOnly = [...cornellField.childNodes].every((node) => node.nodeName === "BR" || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()));
      if (placeholderOnly) cornellField.replaceChildren();
    }
    setActiveDocumentPage(editor.dataset.documentPage);
    const image = event.target.closest?.(".document-pasted-image img");
    selectedDocumentImage = image && editor.contains(image) ? { image, editor } : null;
    updateDocumentCropButton();
  });
  editor.addEventListener("input", () => {
    if (!editor._positioningCaret) saveDocumentEditor(editor);
  });
  editor.addEventListener("paste", (event) => {
    const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    event.preventDefault();
    pasteImageIntoDocument(editor, imageItem.getAsFile()).catch((error) => showToast(error.message || "The image could not be pasted."));
  });
  editor.addEventListener("pointerup", (event) => {
    if (!event.target.closest?.(".document-pasted-image")) return;
    window.requestAnimationFrame(() => saveDocumentEditor(editor));
  });
  editor.addEventListener("dblclick", async (event) => {
    const image = event.target.closest?.(".document-pasted-image img");
    if (!image || !editor.contains(image)) return;
    const figure = image.closest("figure");
    if (!event.shiftKey) {
      event.preventDefault();
      selectedDocumentImage = { image, editor };
      updateDocumentCropButton();
      openNoteImageCrop({ kind: "document", src: image.src, image, editor });
      return;
    }
    const requestedWidth = await window.AppDialog.prompt("Choose how wide this image should appear.", String(Math.round(image.getBoundingClientRect().width)), { title: "Image width", inputLabel: "Width in pixels", type: "number", min: "80", max: "650", confirmLabel: "Next" });
    if (requestedWidth === null) return;
    const width = Math.max(80, Math.min(650, Number(requestedWidth) || 320));
    const requestedRotation = await window.AppDialog.prompt("Rotate the image if needed.", String(Number(figure.dataset.rotation) || 0), { title: "Image rotation", inputLabel: "Degrees", type: "number", min: "-180", max: "180", confirmLabel: "Next" });
    if (requestedRotation === null) return;
    const rotation = Math.max(-180, Math.min(180, Number(requestedRotation) || 0));
    const currentCaption = figure.querySelector("figcaption")?.textContent || "";
    const caption = await window.AppDialog.prompt("Add an optional caption.", /double-click/i.test(currentCaption) ? "" : currentCaption, { title: "Image caption", inputLabel: "Caption", confirmLabel: "Save image" });
    if (caption === null) return;
    figure.style.width = `min(100%, ${width}px)`;
    image.style.width = "100%";
    image.style.height = "auto";
    image.style.transform = `rotate(${rotation}deg)`;
    figure.dataset.rotation = String(rotation);
    figure.querySelector("figcaption").textContent = caption.trim() || "Drag the lower-right corner to resize · Double-click to crop · Shift-double-click for options";
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
    editor.innerHTML = sanitizeNotesHtml(html || "");
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
  const pageSpan = pageCanvasHeight() + PAGE_CANVAS_GAP;
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
  const drawing = state.currentAppView === "notes" && activeNotebookNote()?.type === "drawing" && noteCanvasMode === "open";
  const viewport = drawing ? drawingNoteCanvas()?.parentElement : null;
  const beforeWidth = viewport?.clientWidth || 0;
  const beforeHeight = viewport?.clientHeight || 0;
  toggle.checked = Boolean(active);
  syncWorkspaceFullscreenControl();
  window.requestAnimationFrame(() => {
    if (drawing && viewport) {
      if (active && beforeWidth && beforeHeight) {
        const widthRatio = beforeWidth / Math.max(1, viewport.clientWidth);
        const heightRatio = beforeHeight / Math.max(1, viewport.clientHeight);
        setDrawingNoteZoom(noteDrawingZoom * Math.min(widthRatio, heightRatio));
      }
      renderOpenNoteTextLayer();
    }
  });
}
window.setWorkspaceFullscreen = setWorkspaceFullscreen;

function setBrowseLibraryView(view = state.browseLibraryView) {
  state.browseLibraryView = ["community", "mine"].includes(view) ? view : "built-in";
  $("#browse-flashcard-sets").hidden = state.browseLibraryView !== "built-in";
  $("#browse-community").hidden = state.browseLibraryView !== "community";
  $("#browse-my-public").hidden = state.browseLibraryView !== "mine";
  $$('[data-browse-library-view]').forEach((button) => {
    const active = button.dataset.browseLibraryView === state.browseLibraryView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (state.browseLibraryView === "community") loadCommunityLibrary();
  else if (state.browseLibraryView === "mine") loadMyPublicLibrary();
  else renderBuiltInDecks();
}

function migrateEnrolledTextbooksToStudySets() {
  const enrolled = enrolledCourseIds();
  if (!enrolled.length) return;
  const current = new Set(addedFlashcardCollectionIds());
  enrolled.forEach((courseId) => current.add(`textbook-${courseId}`));
  localStorage.setItem("study-desk-added-flashcard-collections", JSON.stringify([...current]));
  localStorage.setItem("study-desk-enrolled-courses", "[]");
}

function showAppView(view) {
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
  const showingSettings = view === "settings";
  $("#courses").hidden = !showingCourses;
  $("#course-page").hidden = !showingCourse;
  $("#flashcards").hidden = !showingFlashcards;
  $("#create").hidden = !showingCreate;
  $("#notes-page").hidden = !showingNotes;
  $("#export").hidden = !showingExport;
  $("#custom-study-page").hidden = !showingCustomStudy;
  $("#custom-delete-page").hidden = !showingCustomDelete;
  $("#settings-page").hidden = !showingSettings;
  $("#birthday-celebration").hidden = view !== "dashboard" || !isBirthdayToday();
  $$(".topbar, .stats-grid, .dashboard-grid").forEach((section) => { section.hidden = showingCourses || showingCourse || showingFlashcards || showingCreate || showingNotes || showingExport || showingCustomStudy || showingCustomDelete || showingSettings; });
  const activeHref = showingSettings ? null : showingCustomStudy ? `#${state.customStudyReturnView}` : showingCustomDelete ? `#${state.customDeleteReturnView}` : showingExport ? "#export" : showingNotes ? "#notes" : showingCreate ? "#create" : showingFlashcards ? "#flashcards" : showingCourses || showingCourse ? "#courses" : "#dashboard";
  $$(".primary-nav .nav-item, .mobile-nav a").forEach((item) => {
    const active = item.getAttribute("href") === activeHref;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  $("#open-settings").classList.toggle("active", showingSettings);
  syncWorkspaceFullscreenControl();
  if (showingSettings) populateSettingsForm();
  if (showingCourses) setBrowseLibraryView();
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
  const profileReady = hostedGoogleSignInAvailable() && accountSetupComplete(state.googleAccount);
  const profilePublic = state.googleAccount?.profilePublic !== false;
  $$('input[name="profileVisibility"]', form).forEach((input) => {
    input.checked = input.value === (profilePublic ? "public" : "private");
    input.disabled = !profileReady;
  });
  $("#profile-visibility-status").textContent = profileReady
    ? `Your profile is currently ${profilePublic ? "public" : "private"}.`
    : hostedGoogleSignInAvailable()
      ? "Log in with Google to change profile visibility."
      : "Profile visibility is managed through your account on the website.";
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
  ["enableFuzz", "newCardsIgnoreReviewLimit", "buryNewSiblings", "buryReviewSiblings", "buryLearningSiblings", "reduceMotion", "compactMode", "dataSaver"].forEach((key) => { settings[key] = data.has(key); });
  settings.learningSteps = parseAnkiSteps(settings.learningSteps).join(" ");
  settings.relearningSteps = parseAnkiSteps(settings.relearningSteps).join(" ");
  return settings;
}

async function saveProfileVisibilityFromSettings() {
  if (!hostedGoogleSignInAvailable() || !accountSetupComplete(state.googleAccount)) return;
  const selected = $('input[name="profileVisibility"]:checked');
  if (!selected) return;
  const profilePublic = selected.value === "public";
  if (profilePublic === (state.googleAccount.profilePublic !== false)) return;
  const response = await fetch("/api/account/profile/privacy", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profilePublic }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Profile visibility could not be saved");
  state.googleAccount = result.user;
  renderGoogleAccount(result.user);
}

function selectSettingsTab(tabName) {
  $$('[data-settings-tab]').forEach((button) => {
    const active = button.dataset.settingsTab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-settings-panel]').forEach((panel) => { panel.hidden = panel.dataset.settingsPanel !== tabName; });
}

const LEGAL_DOCUMENTS = {
  privacy: {
    title: "Privacy",
    html: `<p><strong>Effective October 24, 2026.</strong> Your Study Buddy stores most study material on your device. When you sign in with Google, the service receives your verified Google account identifier, email address, name, and profile image so it can operate your account.</p><h3>Synced information</h3><p>Supported personal decks, folders, settings, streaks, saved-set state, and Anki progress are stored with your account. PDF files and large note images are not included in account sync.</p><h3>Community information</h3><p>Your chosen display name, username, publications, ratings, and reports are stored when you use Community features. Private profiles hide the profile page, but individually published items remain public until you unpublish them.</p><h3>Your choices</h3><p>You can export device data, make your profile private, remove publications, sign out, or delete your online account from Settings. Account deletion does not erase local data stored on your devices.</p><p><a href="./privacy.html" target="_blank" rel="noopener">Read the full Privacy Policy</a></p>`,
  },
  terms: {
    title: "Terms of use",
    html: `<p><strong>Effective October 24, 2026.</strong> Online accounts and Community features are for people age 13 or older. Use Your Study Buddy for lawful educational purposes. Do not publish content that is illegal, dangerous, sexually exploitative, deceptive, invasive of privacy, or that infringes another person's rights.</p><h3>Study information</h3><p>Curated and community material is a study aid, not an official exam source or a substitute for professional advice. Verify important facts against your course materials.</p><h3>Your content</h3><p>You keep ownership of material you create. Publishing gives the service permission to display and distribute copies through Community until you unpublish it. You are responsible for having the right to share it.</p><h3>Enforcement</h3><p>Reported material may be hidden or removed. Accounts that repeatedly abuse publishing or reporting may lose Community access.</p><p><a href="./terms.html" target="_blank" rel="noopener">Read the full Terms of Use</a></p>`,
  },
  community: {
    title: "Community Guidelines",
    html: `<p>Publish helpful, accurate study material that you created or have permission to share. Protect other people's privacy and intellectual property.</p><h3>Not allowed</h3><p>Do not publish copied paid materials, private information, sexual exploitation, harassment, dangerous instructions, malware, spam, deceptive answer keys, active-exam answers, or content designed to manipulate ratings, saves, or reports.</p><h3>Enforcement and appeals</h3><p>Material may be hidden or removed after automated checks or user reports. To appeal a decision, contact support with your username and the item title.</p><p><a href="./community-guidelines.html" target="_blank" rel="noopener">Read the full Community Guidelines</a></p>`,
  },
  copyright: {
    title: "Copyright and Community reports",
    html: `<p>Publish only material you created, material you have permission to share, or material whose license permits redistribution. A citation alone does not replace permission.</p><h3>Reporting</h3><p>Open a Community item, choose Report, select “Copyright concern,” and explain what work is affected and why you believe the publication is unauthorized. Reports are recorded once per signed-in account.</p><h3>What happens next</h3><p>Material may be automatically hidden after a substantial report threshold. A complete production launch should also use human review for disputed reports and restoration requests.</p>`,
  },
  deletion: {
    title: "Data export and deletion",
    html: `<p>Use “Export my information” before deleting anything you may want to keep. The export includes supported device data and available local assets.</p><h3>Online account</h3><p>“Delete account” permanently removes your profile, synced progress, publications, ratings, and reports from the online service and signs you out.</p><h3>Device data</h3><p>Online account deletion does not remove decks, notes, images, schedules, or settings stored in this browser or installed app. Remove those through the app or clear the app's local storage separately.</p>`,
  },
};

function openLegalDocument(name) {
  const documentCopy = LEGAL_DOCUMENTS[name];
  if (!documentCopy) return;
  $("#legal-dialog-title").textContent = documentCopy.title;
  $("#legal-document-content").innerHTML = documentCopy.html;
  $("#legal-dialog").showModal();
}

async function deleteOnlineAccount() {
  const button = $("#delete-online-account");
  const status = $("#account-deletion-status");
  if (!accountSetupComplete(state.googleAccount)) {
    status.textContent = "Log in with Google before deleting an online account.";
    return;
  }
  if (button.dataset.confirmDelete !== "true") {
    button.dataset.confirmDelete = "true";
    button.textContent = "Click again to permanently delete";
    status.textContent = "This removes the online account and public content. Local device data will remain.";
    window.setTimeout(() => {
      if (button.dataset.confirmDelete !== "true") return;
      delete button.dataset.confirmDelete;
      button.textContent = "Delete account";
    }, 5000);
    return;
  }
  button.disabled = true;
  status.textContent = "Deleting online account…";
  try {
    const response = await fetch("/api/account", { method: "DELETE", credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The account could not be deleted.");
    state.googleAccount = null;
    renderGoogleAccount();
    loadGoogleIdentityLibrary();
    renderGoogleSignInButton();
    status.textContent = "Online account deleted. Local study data remains on this device.";
    showToast("Your online account was deleted.");
  } catch (error) {
    status.textContent = error.message || "The account could not be deleted.";
  } finally {
    button.disabled = false;
    delete button.dataset.confirmDelete;
    button.textContent = "Delete account";
  }
}

function setDateGreeting() {
  const now = new Date();
  const profile = loadProfile() || DEFAULT_PROFILE;
  const language = loadSettings().language || "en";
  $("#dashboard-greeting").textContent = `${greetingForNow()}, ${profile.name || "Guest"}`;
  $("#today-label").textContent = now.toLocaleDateString(language, { weekday: "long", month: "long", day: "numeric" });
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
    const frozen = frozenAnkiDeck(deck.id);
    const folder = saved.id.startsWith("folder:") ? loadStudyFolders().find((item) => item.id === saved.id.slice(7)) : null;
    const cards = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(card.sourceDeckId || deck.id, card.id))).filter((card) => !removed.has(card.scheduleKey));
    const scope = `deck:${deck.id}`;
    const plan = frozen ? { queue: [], newCards: [], learningCards: [], reviewCards: [] } : dailyAnkiPlan(cards, scope);
    return { ...saved, name: deck.name, kind: folder ? `Folder · ${folder.deckIds.length} sets` : deck.builtIn ? "Curated set" : "Personal set", frozen: Boolean(frozen), frozenAt: frozen?.frozenAt, starred: isStudyItemStarred(folder ? saved.id : `deck:${saved.id}`), scope, plan, total: plan.queue.length, newCount: plan.newCards.length, learningCount: plan.learningCards.length, reviewCount: plan.reviewCards.length };
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
    return `<article class="active-anki-item ${entry.completedToday ? "completed" : ""} ${entry.frozen ? "anki-frozen" : ""}"><label class="active-anki-select" title="Select ${escapeHtml(entry.name)}"><input type="checkbox" data-select-active-anki="${escapeHtml(key)}" ${state.activeAnkiSelections.has(key) ? "checked" : ""} ${entry.total ? "" : "disabled"}><span aria-hidden="true"></span></label><div class="active-anki-copy"><small>${entry.starred ? '<span class="active-anki-star" aria-label="Starred">★</span> ' : ""}${escapeHtml(entry.kind)}</small><strong>${escapeHtml(entry.name)}</strong>${entry.frozen ? '<div class="anki-frozen-label">❄ Anki time is frozen</div>' : entry.completedToday ? '<div class="active-anki-complete-label">✓ Completed today</div>' : `<div class="active-anki-counts"><span><b>${entry.newCount}</b> new</span><span><b>${entry.learningCount}</b> learning</span><span><b>${entry.reviewCount}</b> review</span></div>`}</div><div class="active-anki-actions">${entry.frozen ? `<button class="button active-anki-frozen-state" type="button" disabled>❄ Frozen</button><button class="button active-anki-freeze" type="button" data-toggle-anki-freeze="${escapeHtml(entry.id)}">Resume</button>` : `<button class="button primary-button active-anki-start" type="button" data-dashboard-anki="${escapeHtml(entry.id)}" data-dashboard-anki-target="${entry.target}" ${entry.total ? "" : "disabled"}>${entry.completedToday ? "Done" : entry.total ? "Study now" : "Nothing due"}</button><button class="button active-anki-freeze" type="button" data-toggle-anki-freeze="${escapeHtml(entry.id)}">Freeze Anki</button>`}<button class="active-anki-remove" type="button" data-remove-active-anki="${escapeHtml(entry.id)}" data-remove-active-target="${entry.target}" title="Click to remove this set from Active Anki" aria-label="Remove ${escapeHtml(entry.name)} from Active Anki">Remove</button></div></article>`;
  }).join("") : '<div class="active-anki-empty">No active Anki decks yet. Open Anki for a study set to add it here.</div>';
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
  $$('[data-toggle-anki-freeze]', list).forEach((button) => button.addEventListener("click", () => toggleAnkiDeckFreeze(button.dataset.toggleAnkiFreeze)));
  $$('[data-remove-active-anki]', list).forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.confirmRemove === "true") {
      removeActiveAnkiDeck(button.dataset.removeActiveAnki, button.dataset.removeActiveTarget);
      return;
    }
    $$('[data-remove-active-anki]', list).forEach((candidate) => {
      candidate.dataset.confirmRemove = "false";
      candidate.classList.remove("confirming");
      candidate.textContent = "Remove";
      candidate.title = "Click to remove this set from Active Anki";
    });
    button.dataset.confirmRemove = "true";
    button.classList.add("confirming");
    button.textContent = "Confirm remove";
    button.title = "Click again to confirm removal";
    button.setAttribute("aria-label", "Confirm removal from Active Anki");
  }));
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
    state.selectedBuiltInTopicIds = allApTopicIds(collection);
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
const FROZEN_ANKI_DECKS_KEY = "your-study-buddy-frozen-anki-decks-v1";

function loadFrozenAnkiDecks() {
  try {
    const value = JSON.parse(localStorage.getItem(FROZEN_ANKI_DECKS_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function frozenAnkiDeck(deckId) {
  return loadFrozenAnkiDecks()[String(deckId)] || null;
}

function ankiScheduleKeysForDeck(deck) {
  return new Set((deck?.cards || []).map((card) => customAnkiKey(card.sourceDeckId || deck.id, card.id)));
}

function shiftFrozenDeckSchedules(deck, duration) {
  const keys = ankiScheduleKeysForDeck(deck);
  const schedules = ankiSchedules();
  let changed = false;
  keys.forEach((key) => {
    const schedule = schedules[key];
    if (!schedule || typeof schedule !== "object") return;
    if (Number.isFinite(Number(schedule.due)) && Number(schedule.due) > 0) {
      schedule.due = Number(schedule.due) + duration;
      changed = true;
    }
    if (schedule.fsrs && Number.isFinite(new Date(schedule.fsrs.due).getTime())) {
      schedule.fsrs.due = new Date(schedule.fsrs.due).getTime() + duration;
      changed = true;
    }
  });
  if (changed) localStorage.setItem("study-desk-anki-schedules", JSON.stringify(schedules));
}

function toggleAnkiDeckFreeze(deckId) {
  const deck = findStudyDeck(deckId);
  if (!deck) return;
  const frozen = loadFrozenAnkiDecks();
  if (frozen[deckId]) {
    const duration = Math.max(0, Date.now() - Number(frozen[deckId].frozenAt || Date.now()));
    shiftFrozenDeckSchedules(deck, duration);
    delete frozen[deckId];
    showToast(`${deck.name} resumed. Its Anki clock is running again.`);
  } else {
    frozen[deckId] = { frozenAt: Date.now() };
    showToast(`${deck.name} frozen. Reviews will not pile up.`);
  }
  localStorage.setItem(FROZEN_ANKI_DECKS_KEY, JSON.stringify(frozen));
  renderCustomDecks();
  renderActiveAnkiDecks();
  if (state.selectedCustomDeckId === deckId && !$("#custom-study-options-view")?.hidden) refreshCustomStudyOptions();
}

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

const CUSTOM_GENERAL_TOPIC_ID = "__general__";

function normalizedCustomUnits(units) {
  if (!Array.isArray(units)) return [];
  return units.map((unit, unitIndex) => ({
    id: String(unit?.id || makeLocalId("unit")),
    name: String(unit?.name || `Unit ${unitIndex + 1}`).trim() || `Unit ${unitIndex + 1}`,
    topics: Array.isArray(unit?.topics) ? unit.topics.map((topic, topicIndex) => ({
      id: String(topic?.id || makeLocalId("topic")),
      name: String(topic?.name || `${unitIndex + 1}.${topicIndex + 1} Topic`).trim() || `${unitIndex + 1}.${topicIndex + 1} Topic`,
      builtInUnitId: topic?.builtInUnitId ? String(topic.builtInUnitId) : "",
    })) : [],
  }));
}

function customTopicEntries(units = state.customUnits) {
  return normalizedCustomUnits(units).flatMap((unit) => unit.topics.map((topic) => ({ ...topic, unitId: unit.id, unitName: unit.name })));
}

function customTopicSelectMarkup(selectedId = "") {
  const options = customTopicEntries().map((topic) => `<option value="${escapeHtml(topic.id)}" ${selectedId === topic.id ? "selected" : ""}>${escapeHtml(topic.unitName)} · ${escapeHtml(topic.name)}</option>`).join("");
  return `<option value="" ${selectedId ? "" : "selected"}>General (no subtopic)</option>${options}`;
}

function renderCustomDraftViewControls() {
  const filters = $("#draft-view-filters");
  const unitSelect = $("#draft-view-unit");
  const topicSelect = $("#draft-view-topic");
  if (!filters || !unitSelect || !topicSelect) return;
  const units = normalizedCustomUnits(state.customUnits);
  filters.hidden = units.length === 0;
  const validUnitIds = new Set(units.map((unit) => unit.id));
  if (state.draftViewUnitId && state.draftViewUnitId !== CUSTOM_GENERAL_TOPIC_ID && !validUnitIds.has(state.draftViewUnitId)) {
    state.draftViewUnitId = "";
    state.draftViewTopicId = "";
  }
  const unitOptions = units.map((unit) => `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.name)}</option>`).join("");
  unitSelect.innerHTML = `<option value="">All units</option><option value="${CUSTOM_GENERAL_TOPIC_ID}">General (no subtopic)</option>${unitOptions}`;
  unitSelect.value = state.draftViewUnitId;
  const availableUnits = state.draftViewUnitId && state.draftViewUnitId !== CUSTOM_GENERAL_TOPIC_ID
    ? units.filter((unit) => unit.id === state.draftViewUnitId)
    : units;
  const availableTopicIds = new Set(availableUnits.flatMap((unit) => unit.topics.map((topic) => topic.id)));
  if (state.draftViewTopicId && !availableTopicIds.has(state.draftViewTopicId)) state.draftViewTopicId = "";
  const topicOptions = availableUnits.map((unit) => unit.topics.length
    ? `<optgroup label="${escapeHtml(unit.name)}">${unit.topics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.name)}</option>`).join("")}</optgroup>`
    : "").join("");
  topicSelect.innerHTML = `<option value="">${state.draftViewUnitId === CUSTOM_GENERAL_TOPIC_ID ? "General only" : "All subtopics"}</option>${topicOptions}`;
  topicSelect.value = state.draftViewTopicId;
  topicSelect.disabled = state.draftViewUnitId === CUSTOM_GENERAL_TOPIC_ID || !availableTopicIds.size;
  filters.classList.toggle("has-structure", units.length > 0);
  unitSelect.onchange = () => {
    state.draftViewUnitId = unitSelect.value;
    state.draftViewTopicId = "";
    renderCustomDraft();
  };
  topicSelect.onchange = () => {
    state.draftViewTopicId = topicSelect.value;
    renderCustomDraft();
  };
}

function customDraftVisibleRecords() {
  const selectedUnit = state.customUnits.find((unit) => unit.id === state.draftViewUnitId);
  const unitTopicIds = new Set((selectedUnit?.topics || []).map((topic) => topic.id));
  return state.customDraft.map((card, index) => ({ card, index })).filter(({ card }) => {
    if (state.draftViewTopicId) return card.customTopicId === state.draftViewTopicId;
    if (state.draftViewUnitId === CUSTOM_GENERAL_TOPIC_ID) return !card.customTopicId;
    if (state.draftViewUnitId) return unitTopicIds.has(card.customTopicId);
    return true;
  });
}

function injectDraftTopicSelectors(container, items) {
  if (!container || !customTopicEntries().length) return;
  [...container.children].forEach((row, fallbackIndex) => {
    const indexedValue = row.dataset.draftCard ?? row.dataset.questionDraft ?? row.dataset.feynmanDraft;
    const index = indexedValue === undefined ? fallbackIndex : Number(indexedValue);
    if (!items[index]) return;
    const label = document.createElement("label");
    label.className = "draft-topic-field";
    label.innerHTML = `Subtopic<select>${customTopicSelectMarkup(items[index].customTopicId || "")}</select>`;
    label.querySelector("select").addEventListener("change", (event) => {
      items[index].customTopicId = event.target.value;
      const topic = customTopicEntries().find((entry) => entry.id === event.target.value);
      if (state.editingBuiltInCollectionId && topic) items[index].builtInUnitId = topic.builtInUnitId || topic.unitId;
      if (container.id === "draft-card-list") renderCustomDraft();
    });
    row.classList.add("has-draft-topic");
    row.querySelector(".draft-card-number")?.after(label);
  });
}

function renderCustomUnitBuilder() {
  const list = $("#custom-unit-list");
  if (!list) return;
  const collection = state.editingBuiltInCollectionId ? getBuiltInCollection(state.editingBuiltInCollectionId) : null;
  const lockedCourseStructure = Boolean(collection && (isApCourseCollection(collection) || isIbCourseCollection(collection)));
  const builderCopy = $("#custom-topic-builder-heading")?.parentElement?.querySelector("p:last-child");
  if (builderCopy) builderCopy.textContent = lockedCourseStructure
    ? "Course subdivisions are built in. Use the selector above each item to move it."
    : "Organize your set like an AP course. New material is added to the selected subtopic.";
  list.classList.toggle("locked-course-structure", lockedCourseStructure);
  $("#add-custom-unit").hidden = lockedCourseStructure;
  list.innerHTML = state.customUnits.map((unit, unitIndex) => {
    const heading = lockedCourseStructure
      ? `<strong class="custom-unit-structure-name">${escapeHtml(unit.name)}</strong><span class="custom-unit-structure-count">${unit.topics.length} ${unit.topics.length === 1 ? "subdivision" : "subdivisions"}</span>`
      : `<input value="${escapeHtml(unit.name)}" data-custom-unit-name="${escapeHtml(unit.id)}" aria-label="Unit ${unitIndex + 1} name"><button type="button" data-add-custom-topic="${escapeHtml(unit.id)}">+ Subtopic</button><button type="button" class="danger-text-button" data-remove-custom-unit="${escapeHtml(unit.id)}">Remove</button>`;
    const topics = lockedCourseStructure
      ? unit.topics.map((topic) => `<div class="custom-subtopic-structure"><span>Subtopic</span><strong>${escapeHtml(topic.name)}</strong></div>`).join("")
      : unit.topics.map((topic) => `<label><span>Subtopic</span><input value="${escapeHtml(topic.name)}" data-custom-topic-name="${escapeHtml(topic.id)}"><button type="button" class="remove-draft-card" data-remove-custom-topic="${escapeHtml(topic.id)}" aria-label="Remove ${escapeHtml(topic.name)}">×</button></label>`).join("") || '<p>Add a subtopic such as “1.1 Scientific foundations.”</p>';
    return `<section class="custom-unit-editor" data-custom-unit="${escapeHtml(unit.id)}"><div class="custom-unit-editor-heading">${heading}</div><div class="custom-subtopic-list">${topics}</div></section>`;
  }).join("") || '<div class="custom-topic-empty"><strong>No units yet</strong><span>Add a unit when you want to organize this set into sections.</span></div>';
  const active = $("#active-custom-topic");
  active.innerHTML = customTopicSelectMarkup(state.activeCustomTopicId);
  if (state.activeCustomTopicId && !customTopicEntries().some((topic) => topic.id === state.activeCustomTopicId)) state.activeCustomTopicId = "";
  active.value = state.activeCustomTopicId;
  active.onchange = () => { state.activeCustomTopicId = active.value; };
  renderCustomDraftViewControls();
  $$('[data-custom-unit-name]', list).forEach((input) => input.addEventListener("input", () => {
    const unit = state.customUnits.find((item) => item.id === input.dataset.customUnitName);
    if (unit) unit.name = input.value;
    active.innerHTML = customTopicSelectMarkup(state.activeCustomTopicId);
    renderCustomDraftViewControls();
  }));
  $$('[data-custom-topic-name]', list).forEach((input) => input.addEventListener("input", () => {
    const topic = customTopicEntries().find((item) => item.id === input.dataset.customTopicName);
    const unit = state.customUnits.find((item) => item.id === topic?.unitId);
    const stored = unit?.topics.find((item) => item.id === topic?.id);
    if (stored) stored.name = input.value;
    active.innerHTML = customTopicSelectMarkup(state.activeCustomTopicId);
    renderCustomDraftViewControls();
  }));
  $$('[data-add-custom-topic]', list).forEach((button) => button.addEventListener("click", () => {
    const unit = state.customUnits.find((item) => item.id === button.dataset.addCustomTopic);
    if (!unit) return;
    const topic = { id: makeLocalId("topic"), name: `${state.customUnits.indexOf(unit) + 1}.${unit.topics.length + 1} New subtopic` };
    unit.topics.push(topic);
    state.activeCustomTopicId = topic.id;
    renderCustomUnitBuilder();
  }));
  $$('[data-remove-custom-topic]', list).forEach((button) => button.addEventListener("click", () => removeCustomTopic(button.dataset.removeCustomTopic)));
  $$('[data-remove-custom-unit]', list).forEach((button) => button.addEventListener("click", () => {
    const unit = state.customUnits.find((item) => item.id === button.dataset.removeCustomUnit);
    if (!unit || !window.confirm(`Remove “${unit.name}” and move its material to General?`)) return;
    unit.topics.forEach((topic) => removeCustomTopic(topic.id, false));
    state.customUnits = state.customUnits.filter((item) => item.id !== unit.id);
    renderCustomUnitBuilder(); renderCustomDraft(); renderCustomQuestionDraft(); renderCustomFeynmanDraft();
  }));
}

function removeCustomTopic(topicId, shouldRender = true) {
  state.customUnits.forEach((unit) => { unit.topics = unit.topics.filter((topic) => topic.id !== topicId); });
  [state.customDraft, state.customQuestionDraft, state.customFeynmanDraft].forEach((items) => items.forEach((item) => { if (item.customTopicId === topicId) item.customTopicId = ""; }));
  if (state.activeCustomTopicId === topicId) state.activeCustomTopicId = "";
  if (state.draftViewTopicId === topicId) state.draftViewTopicId = "";
  if (shouldRender) { renderCustomUnitBuilder(); renderCustomDraft(); renderCustomQuestionDraft(); renderCustomFeynmanDraft(); }
}

function loadCustomDecks() {
  return loadLocalArray(CUSTOM_DECKS_KEY, (deck) => deck && Array.isArray(deck.cards));
}

function isReadOnlyStudySet(deck) {
  return deck?.readOnlySource === "community";
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
    return { id: effective.id, name: effective.name, cards: effective.units.flatMap((unit) => unit.cards), questions: effective.units.flatMap((unit) => unit.questions || []), feynmanPrompts: effective.units.flatMap((unit) => unit.feynmanPrompts || []), group: "Curated sets" };
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
  const pageHeight = pageCanvasHeight(note);
  return note?.canvasMode === "page"
    ? { width: PAGE_CANVAS_WIDTH, height: pageHeight * pageCount + PAGE_CANVAS_GAP * Math.max(0, pageCount - 1) }
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
  if (note?.sourceFormat === "pptx") return [{ value: "pptx", label: "PowerPoint · Original slideshow" }, { value: "pdf", label: "PDF · Slides with annotations" }];
  if (note?.type === "word" || note?.pageLayout === "document") return [{ value: "pdf", label: "PDF · Ready to share or print" }];
  return [{ value: "pdf", label: "PDF · Selected canvas area" }, { value: "ysb", label: "YSB · Editable full canvas" }, { value: "png", label: "PNG · Selected canvas area" }];
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
  const isCanvas = note.type === "drawing" && note.canvasMode !== "page" && note.pageLayout !== "document";
  $("#export-note-crop-fields").hidden = !isCanvas;
  $("#export-note-crop-actions").hidden = !isCanvas;
  $("#export-note-help").hidden = !isCanvas;
  $("#export-note-preview").style.cursor = isCanvas ? "crosshair" : "default";
  $("#export-note-summary").textContent = note.type === "pdf" ? "The original imported PDF will be exported." : note.sourceFormat === "pptx" ? "PowerPoint keeps the original slideshow. PDF includes the drawing annotations." : isCanvas ? "PDF and PNG use the outlined section. YSB preserves every editable canvas item and the current view." : "PDF preserves the page layout for sharing or printing.";
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
  if (format === "pdf" && note.type === "pdf") {
    const blob = await getNotebookAsset(note.pdfAssetId); if (!blob) { $("#export-note-status").textContent = "The original PDF could not be found."; showToast("The PDF could not be exported."); return; }
    const result = await saveExportedNoteBlob(note, "pdf", blob); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "pptx") {
    const blob = await getNotebookAsset(note.pptxAssetId); if (!blob) { $("#export-note-status").textContent = "The original PowerPoint could not be found."; showToast("The PowerPoint could not be exported."); return; }
    const result = await saveExportedNoteBlob(note, "pptx", blob); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "pdf") {
    const blob = await createNotePdf(note);
    const result = await saveExportedNoteBlob(note, "pdf", blob); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "ysb") {
    const viewport = activeNoteId === note.id ? drawingNoteCanvas()?.parentElement : null;
    const savedViewport = note.canvasViewport || { zoom: 1, scrollLeft: 0, scrollTop: 0 };
    const payload = { application: "Your Study Buddy", version: 1, type: "editable-note", exportedAt: new Date().toISOString(), note: { ...note, id: undefined, folderId: null }, viewport: { zoom: activeNoteId === note.id ? noteDrawingZoom : savedViewport.zoom, scrollLeft: viewport?.scrollLeft ?? savedViewport.scrollLeft, scrollTop: viewport?.scrollTop ?? savedViewport.scrollTop } };
    const result = await saveExportedNoteBlob(note, "ysb", new Blob([JSON.stringify(payload)], { type: "application/vnd.yourstudybuddy.note+json" })); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "html") {
    const body = documentNoteHtml(note); const file = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(note.title || "Note")}</title><style>body{margin:0;background:#eee;font:16px/1.5 Arial,sans-serif}.note-page{box-sizing:border-box;width:8.5in;min-height:11in;margin:24px auto;padding:.75in;background:#fff;box-shadow:0 2px 12px #bbb}@media print{body{background:#fff}.note-page{margin:0;box-shadow:none;break-after:page}}</style></head><body>${body}</body></html>`; const result = await saveExportedNoteBlob(note, "html", new Blob([file], { type: "text/html;charset=utf-8" })); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  } else if (format === "txt") { const result = await saveExportedNoteBlob(note, "txt", new Blob([notebookNotePlainText(note)], { type: "text/plain;charset=utf-8" })); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; } }
  else {
    const selection = noteExportState.selection || noteContentBounds(note); const maxDimension = 4096; const scale = Math.min(2, maxDimension / Math.max(selection.width, selection.height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(selection.width * scale)); canvas.height = Math.max(1, Math.round(selection.height * scale)); await paintNoteExport(canvas.getContext("2d"), note, selection, canvas.width, canvas.height); const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("The image could not be created."); const result = await saveExportedNoteBlob(note, "png", blob); if (result?.canceled) { $("#export-note-status").textContent = "Export canceled."; return; }
  }
  $("#export-note-status").textContent = `${note.title || "Note"} exported as ${format.toUpperCase()}.`; showToast("Note exported.");
}

async function canvasJpeg(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
  if (!blob) throw new Error("The PDF page could not be rendered.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
}

function pdfFromJpegs(images) {
  const encoder = new TextEncoder(); const chunks = []; const offsets = [0]; let length = 0;
  const push = (value) => { const bytes = typeof value === "string" ? encoder.encode(value) : value; chunks.push(bytes); length += bytes.length; };
  push("%PDF-1.4\n%YSB\n");
  const objectCount = 2 + images.length * 3;
  const object = (number, bodyParts) => { offsets[number] = length; push(`${number} 0 obj\n`); bodyParts.forEach(push); push("\nendobj\n"); };
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  const pageIds = images.map((_, index) => 3 + index * 3);
  object(2, [`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`]);
  images.forEach((image, index) => {
    const pageId = 3 + index * 3; const contentId = pageId + 1; const imageId = pageId + 2;
    const pageWidth = 612; const pageHeight = 792; const scale = Math.min(576 / image.width, 756 / image.height);
    const width = image.width * scale; const height = image.height * scale; const x = (pageWidth - width) / 2; const y = (pageHeight - height) / 2;
    const commands = `q\n${width.toFixed(3)} 0 0 ${height.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im${index + 1} Do\nQ\n`;
    object(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
    object(contentId, [`<< /Length ${encoder.encode(commands).length} >>\nstream\n`, commands, "endstream"]);
    object(imageId, [`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`, image.bytes, "\nendstream"]);
  });
  const xref = length; push(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let index = 1; index <= objectCount; index += 1) push(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}

async function createNotePdf(note) {
  const canvases = [];
  if (note.type === "word" || note.pageLayout === "document") {
    const pages = note.type === "word" ? [note.html || ""] : (Array.isArray(note.documentPages) && note.documentPages.length ? note.documentPages : [note.pageDocumentContent || ""]);
    for (const page of pages) {
      const canvas = document.createElement("canvas"); canvas.width = 1275; canvas.height = 1650;
      const pageNote = note.type === "word" ? { ...note, html: page } : { ...note, documentPages: [page], pageDocumentContent: page, pageCount: 1 };
      await paintNoteExport(canvas.getContext("2d"), pageNote, { x: 0, y: 0, width: PAGE_CANVAS_WIDTH, height: PAGE_CANVAS_HEIGHT }, canvas.width, canvas.height);
      canvases.push(canvas);
    }
  } else if (note.canvasMode === "page") {
    const count = Math.max(1, Number(note.pageCount) || 1);
    const pageHeight = pageCanvasHeight(note);
    for (let index = 0; index < count; index += 1) {
      const canvas = document.createElement("canvas"); canvas.width = note.sourceFormat === "pptx" ? 1600 : 1275; canvas.height = note.sourceFormat === "pptx" ? 900 : 1650;
      await paintNoteExport(canvas.getContext("2d"), note, { x: 0, y: index * (pageHeight + PAGE_CANVAS_GAP), width: PAGE_CANVAS_WIDTH, height: pageHeight }, canvas.width, canvas.height);
      canvases.push(canvas);
    }
  } else {
    const selection = noteExportState.selection || noteContentBounds(note); const scale = Math.min(2, 2400 / Math.max(selection.width, selection.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(selection.width * scale)); canvas.height = Math.max(1, Math.round(selection.height * scale));
    await paintNoteExport(canvas.getContext("2d"), note, selection, canvas.width, canvas.height); canvases.push(canvas);
  }
  return pdfFromJpegs(await Promise.all(canvases.map(canvasJpeg)));
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

function renderManualQuestionImagePreview() {
  const image = $("#manual-question-image-preview");
  const remove = $("[data-remove-manual-question-image]");
  image.src = state.manualQuestionImage || "";
  image.hidden = !state.manualQuestionImage;
  remove.hidden = !state.manualQuestionImage;
}

function cardImageForTarget(target) {
  if (!target) return "";
  if (target.kind === "manual") return target.side === "front" ? state.manualFrontImage : state.manualBackImage;
  if (target.kind === "draft") {
    const property = target.side === "front" ? "frontImage" : "backImage";
    return state.customDraft[target.index]?.[property] || "";
  }
  if (target.kind === "manual-question") return state.manualQuestionImage;
  if (target.kind === "question-draft") return state.customQuestionDraft[target.index]?.image || "";
  return "";
}

function applyCardImage(target, dataUrl) {
  if (!target) return;
  if (target.kind === "manual-question") {
    state.manualQuestionImage = dataUrl;
    renderManualQuestionImagePreview();
    return;
  }
  if (target.kind === "question-draft") {
    const question = state.customQuestionDraft[target.index];
    if (!question) return;
    question.image = dataUrl;
    question.imageSourceUrl = "";
    renderCustomQuestionDraft();
    return;
  }
  if (target.kind === "manual") {
    if (target.side === "front") state.manualFrontImage = dataUrl;
    else state.manualBackImage = dataUrl;
    renderManualImagePreview(target.side);
    return;
  }
  const card = state.customDraft[target.index];
  if (!card) return;
  const property = target.side === "front" ? "frontImage" : "backImage";
  card[property] = dataUrl;
  renderCustomDraft();
}

async function acceptCardImage(file, target) {
  try {
    applyCardImage(target, await readFlashcardImage(file));
    showToast(target?.kind?.includes("question") ? "Image added to the question." : "Image added to the card.");
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
  if (target.kind === "manual-question") return $(`#manual-question-${target.side === "question" ? "prompt" : "answer"}`);
  if (target.kind === "question-draft") return $(`[data-question-${target.side === "question" ? "prompt" : "answer"}="${target.index}"]`);
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
  const existing = cardImageForTarget(target);
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
  closeMathTool(); textarea.focus(); showToast(target.editing ? "Math updated." : "Math inserted.");
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
  showToast(target.editing ? "Code updated." : "Code added.");
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
  const allowed = new Set(["P", "DIV", "BR", "UL", "OL", "LI", "B", "STRONG", "I", "EM", "U", "MARK", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "FIGURE", "IMG", "FIGCAPTION"]);
  const templateClasses = new Set(["cornell-note-template", "cornell-meta", "cornell-topic-field", "cornell-meta-grid", "cornell-meta-field", "cornell-field-label", "cornell-meta-entry", "cornell-columns", "cornell-column", "cornell-cues", "cornell-notes", "cornell-section-title", "cornell-writing-area", "cornell-summary", "cornell-static", "outline-note-template", "document-pasted-image"]);
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
      if (style.borderColor) safeStyles.push(`border-color: ${style.borderColor}`);
      if (style.borderWidth) safeStyles.push(`border-width: ${style.borderWidth}`);
      if (style.borderStyle) safeStyles.push(`border-style: ${style.borderStyle}`);
      if (style.width && ["FIGURE", "IMG"].includes(child.tagName)) safeStyles.push(`width: ${style.width}`);
      if (style.height && child.tagName === "IMG") safeStyles.push(`height: ${style.height}`);
      if (style.transform && child.tagName === "IMG") safeStyles.push(`transform: ${style.transform}`);
      if (style.fontWeight && (/bold/i.test(style.fontWeight) || Number(style.fontWeight) >= 600)) safeStyles.push(`font-weight: ${style.fontWeight}`);
      if (style.fontStyle === "italic") safeStyles.push("font-style: italic");
      if (style.textDecorationLine === "underline" || /underline/.test(style.textDecoration || "")) safeStyles.push("text-decoration: underline");
      const safeClasses = [...child.classList].filter((className) => templateClasses.has(className));
      const placeholder = safeClasses.some((className) => className === "cornell-meta-entry" || className === "cornell-writing-area") ? child.getAttribute("data-placeholder") : "";
      const staticField = safeClasses.includes("cornell-static") && child.getAttribute("contenteditable") === "false";
      const editableField = safeClasses.some((className) => className === "cornell-meta-entry" || className === "cornell-writing-area") && child.getAttribute("contenteditable") === "true";
      const columnSpan = ["TH", "TD"].includes(child.tagName) ? Math.max(1, Math.min(24, Number(child.getAttribute("colspan")) || 1)) : 1;
      const rowSpan = ["TH", "TD"].includes(child.tagName) ? Math.max(1, Math.min(50, Number(child.getAttribute("rowspan")) || 1)) : 1;
      const imageSource = child.tagName === "IMG" ? safeQuestionResourceUrl(child.getAttribute("src")) : "";
      const imageAlt = child.tagName === "IMG" ? String(child.getAttribute("alt") || "Pasted image").slice(0, 180) : "";
      const imageData = child.tagName === "IMG" ? {
        originalSrc: safeQuestionResourceUrl(child.dataset.originalSrc), cropX: child.dataset.cropX, cropY: child.dataset.cropY,
        cropWidth: child.dataset.cropWidth, cropHeight: child.dataset.cropHeight,
      } : null;
      const figureRotation = child.tagName === "FIGURE" ? String(Number(child.dataset.rotation) || 0) : "";
      [...child.attributes].forEach((attribute) => child.removeAttribute(attribute.name));
      if (safeStyles.length) child.setAttribute("style", safeStyles.join("; "));
      if (safeClasses.length) child.setAttribute("class", safeClasses.join(" "));
      if (placeholder) child.setAttribute("data-placeholder", placeholder.slice(0, 180));
      if (staticField) child.setAttribute("contenteditable", "false");
      if (editableField) child.setAttribute("contenteditable", "true");
      if (["TH", "TD"].includes(child.tagName) && columnSpan > 1) child.setAttribute("colspan", String(columnSpan));
      if (["TH", "TD"].includes(child.tagName) && rowSpan > 1) child.setAttribute("rowspan", String(rowSpan));
      if (child.tagName === "FIGURE") { child.setAttribute("contenteditable", "false"); child.dataset.rotation = figureRotation; }
      if (child.tagName === "IMG" && imageSource) {
        child.setAttribute("src", imageSource); child.setAttribute("alt", imageAlt);
        if (imageData.originalSrc) child.dataset.originalSrc = imageData.originalSrc;
        [["cropX", imageData.cropX], ["cropY", imageData.cropY], ["cropWidth", imageData.cropWidth], ["cropHeight", imageData.cropHeight]].forEach(([name, value]) => {
          if (Number.isFinite(Number(value))) child.dataset[name] = String(Number(value));
        });
      }
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
    cardsByFront.set(key, { id: existing?.id || makeLocalId("card"), noteId: `anki-note-${cardsByFront.size + 1}`, front, back, imported: true });
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

const NOTES_GENERATOR_VERSION = 24;

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
  const limitNotes = /\b(?:the limit of a function|one-sided limits?|limit laws?|limits? at infinity|two-sided limits?)\b/i.test(normalizedNotes);
  const relatedRatesNotes = /\brelated[- ]rates?\b|\b(?:two|several) related quantities\b[\s\S]{0,240}\bchanging (?:with respect to|over) time\b/i.test(normalizedNotes);
  const calculusNotes = limitNotes || relatedRatesNotes || /\b(?:differentiation|definite integral|derivative as a function|chain rule|instantaneous rate of change)\b/i.test(normalizedNotes);
  const glycolysisNotes = /\bglycolysis\b[\s\S]{0,1200}\b(?:glucose|pyruvate|ATP|NADH)\b/i.test(normalizedNotes);
  const memorySystemsNotes = /\bencoding\b[\s\S]{0,1600}\bstorage\b[\s\S]{0,1600}\bretrieval\b/i.test(normalizedNotes);
  const reactionYieldNotes = /\blimiting reactant\b[\s\S]{0,1800}\b(?:theoretical yield|actual yield|percent yield)\b/i.test(normalizedNotes);
  const basicHypothesisTestingNotes = /\bnull hypothesis\b[\s\S]{0,1600}\b(?:alternative hypothesis|p-value|significance level)\b/i.test(normalizedNotes);
  const haitianRevolutionNotes = /\bHaitian Revolution\b[\s\S]{0,2200}\b(?:Saint-Domingue|Toussaint Louverture|independence in 1804)\b/i.test(normalizedNotes);
  const macbethNotes = /(?:^|\n)\s*#{1,6}\s+Macbeth\b[\s\S]{0,2200}\b(?:Lady Macbeth|Banquo|Macduff)\b/i.test(normalizedNotes);
  const supplyDemandNotes = /\blaw of demand\b[\s\S]{0,1800}\blaw of supply\b[\s\S]{0,1800}\b(?:market )?equilibrium\b/i.test(normalizedNotes);
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
    const preferBack = Boolean(metadata.preferBack);
    if (preferBack) delete metadata.preferBack;
    if (molecularGeneticsNotes && !metadata.sourceKind) metadata.sourceKind = "molecular-genetics";
    if (ecologyNotes && !metadata.sourceKind) metadata.sourceKind = "ecology";
    if (relatedRatesNotes && !metadata.sourceKind) metadata.sourceKind = "related-rates";
    if (reactionYieldNotes && !metadata.sourceKind) metadata.sourceKind = "reaction-yields";
    if (basicHypothesisTestingNotes && !metadata.sourceKind) metadata.sourceKind = "hypothesis-testing";
    if (haitianRevolutionNotes && !metadata.sourceKind) metadata.sourceKind = "haitian-revolution";
    if (macbethNotes && !metadata.sourceKind) metadata.sourceKind = "macbeth";
    if (supplyDemandNotes && !metadata.sourceKind) metadata.sourceKind = "supply-demand";
    if (glycolysisNotes && !metadata.sourceKind) metadata.sourceKind = "glycolysis";
    if (memorySystemsNotes && !metadata.sourceKind) metadata.sourceKind = "psychology-memory";
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
    if (cleanBack.length > 520) {
      const sentences = cleanBack.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      const concise = [];
      for (const sentence of sentences) {
        if (concise.length >= 3 || `${concise.join(" ")} ${sentence}`.trim().length > 500) break;
        concise.push(sentence.trim());
      }
      if (concise.length) cleanBack = concise.join(" ");
    }
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
    const extractionNoise = /^(?:question|answer|step\s*\d+|fall\s+\d{4}|the next three lectures|learning objectives?|problem-solving strategy|key concepts?|examples?\s*\d*(?:\.\d+)?|solutions?|checkpoints?\s*\d*(?:\.\d+)?|figures?\s*\d*(?:\.\d+)?|images?|by the end of this section, you will be able to|chapter\s+\d+|\d{1,3}|\d[.\d]*[A-Z]?\s*\/\s*\d[.\dA-Z]*.+)$/i;
    if (extractionNoise.test(cleanFront) || /^(?:overview|summary|introduction|key points?|class notes?|study guide)$/i.test(cleanFront) || /(?:https?:\/\/|terms of use|open.?courseware|style\.visibility)/i.test(`${cleanFront} ${cleanBack}`)) return;
    if (/\b(?:and|or|of|to|when|because|including|include|includes|is|are|was|were)\s*$/i.test(cleanFront) || /^(?:and|or|but|because|which|that)\b/i.test(cleanBack)) return;
    if ((cleanFront.match(/[A-Za-z]+/g) || []).length > 18 && !/[?]$/.test(cleanFront)) return;
    if (cleanFront.length < (molecularGeneticsNotes ? 3 : 4) || cleanBack.length < 3 || cleanBack.length > 900 || cleanFront.toLowerCase() === cleanBack.toLowerCase()) return;
    const key = cleanFront.toLowerCase().replace(/^the\s+/, "").replace(/\s*\(\d{4}\)$/, "").trim();
    if (seen.has(key)) {
      const existing = cards.find((card) => card.front.toLowerCase().replace(/^the\s+/, "").replace(/\s*\(\d{4}\)$/, "").trim() === key);
      if (existing && molecularGeneticsNotes && !existing.back.toLowerCase().includes(cleanBack.toLowerCase())) existing.back = `${existing.back}; ${cleanBack}`;
      else if (existing && (preferBack || cleanBack.length > existing.back.length)) existing.back = cleanBack;
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
  if (limitNotes) {
    addCard("Limit of a function", "The limit of f(x) as x approaches a is L when the values of f(x) get arbitrarily close to L as x approaches a from both sides.", { sourceSection: "Limits", sourceKind: "calculus" });
    if (/does not matter how the function behaves at/i.test(normalizedNotes)) addCard("Limit versus function value", "A limit depends on the values of the function near a point, not necessarily on the function's value at that point.", { sourceSection: "Limits", sourceKind: "calculus" });
    if (/two-sided vs\.? one-sided limits?/i.test(normalizedNotes)) addCard("Existence of a two-sided limit", "A two-sided limit exists only when the left-hand and right-hand limits both exist and are equal.", { sourceSection: "One-sided limits", sourceKind: "calculus" });
  }
  if (relatedRatesNotes) {
    addCard("Related rates", "Related-rates problems connect two or more quantities that change with time. Differentiate an equation relating the quantities to connect their rates of change.", { sourceSection: "Related rates", sourceKind: "related-rates" });
    addCard("Related-rates workflow", "Define the changing quantities, identify the known and unknown rates, write an equation connecting the quantities, differentiate with respect to time, then substitute the values for the instant being studied and solve.", { sourceSection: "Related rates", sourceKind: "related-rates" });
    if (/substitut(?:e|ing)[\s\S]{0,240}(?:after differentiat|too soon|before differentiat)/i.test(normalizedNotes) || /not to substitute[\s\S]{0,120}until after/i.test(normalizedNotes)) {
      addCard("Why values are substituted after differentiating", "Substituting a changing quantity too early makes it behave like a constant, so its derivative disappears and the resulting rate equation can be wrong.", { sourceSection: "Related rates", sourceKind: "related-rates" });
    }
  }
  if (glycolysisNotes) {
    addCard("Glycolysis", "Glycolysis is the first stage of glucose breakdown. It occurs in the cytosol and converts one six-carbon glucose into two three-carbon pyruvate molecules while transferring energy to ATP and NADH.", { sourceSection: "Glycolysis", sourceKind: "glycolysis" });
    if (/two\s+(?:net\s+)?ATP[\s\S]{0,120}two\s+NADH|net gain of two ATP[\s\S]{0,120}two NADH/i.test(normalizedNotes)) {
      addCard("Net products of glycolysis", "Per glucose molecule, glycolysis produces two pyruvate, a net gain of two ATP, and two NADH.", { sourceSection: "Glycolysis", sourceKind: "glycolysis" });
    }
    if (/two ATP[\s\S]{0,120}(?:used|invested)[\s\S]{0,240}(?:four ATP|payoff)/i.test(normalizedNotes)) {
      addCard("ATP investment and payoff in glycolysis", "Glycolysis invests two ATP early and produces four ATP later by substrate-level phosphorylation, giving a net gain of two ATP.", { sourceSection: "Glycolysis", sourceKind: "glycolysis" });
    }
  }
  if (memorySystemsNotes) {
    addCard("Three basic functions of memory", "Encoding brings information into the memory system, storage retains it, and retrieval brings stored information back into awareness.", { sourceSection: "How memory functions", sourceKind: "psychology-memory" });
    addCard("Encoding", "Encoding is the input and organization of information in the memory system, connecting new information with existing knowledge.", { sourceSection: "How memory functions", sourceKind: "psychology-memory" });
    addCard("Storage", "Storage is the retention of encoded information over time.", { sourceSection: "How memory functions", sourceKind: "psychology-memory" });
    addCard("Retrieval", "Retrieval is the process of bringing stored information back into conscious awareness.", { sourceSection: "How memory functions", sourceKind: "psychology-memory" });
    if (/automatic processing[\s\S]{0,1000}effortful processing/i.test(normalizedNotes)) {
      addCard("Automatic vs. effortful processing", "Automatic processing encodes some information with little conscious effort, whereas effortful processing requires attention and deliberate work.", { sourceSection: "Encoding", sourceKind: "psychology-memory" });
    }
    if (/Atkinson[–—-]?Shiffrin|sensory memory[\s\S]{0,500}short-term memory[\s\S]{0,500}long-term memory/i.test(normalizedNotes)) {
      addCard("Atkinson–Shiffrin model", "Information moves from sensory memory to short-term memory when attended to and can enter long-term memory through continued processing such as rehearsal.", { sourceSection: "Storage", sourceKind: "psychology-memory" });
    }
  }
  if (reactionYieldNotes) {
    const metadata = { sourceSection: "Reaction yields", sourceKind: "reaction-yields" };
    addCard("Limiting reactant", "The reactant consumed first; it determines the maximum amount of product that can form.", metadata);
    addCard("Excess reactant", "A reactant left over after the limiting reactant has been completely consumed.", metadata);
    addCard("Identifying the limiting reactant", "Convert each reactant amount to the amount of product it could form. The reactant that predicts less product is limiting.", metadata);
    if (/3\s*mol\s*H₂[\s\S]{0,200}2\s*mol\s*Cl₂/i.test(normalizedNotes)) addCard("Hydrogen chloride limiting-reactant example", "For H₂ + Cl₂ → 2HCl, 3 mol H₂ and 2 mol Cl₂ can form 4 mol HCl. Cl₂ is limiting and 1 mol H₂ remains.", metadata);
    addCard("Theoretical yield", "The maximum amount of product predicted from the balanced equation and the available limiting reactant.", metadata);
    addCard("Actual yield", "The amount of product actually collected in an experiment.", metadata);
    if (/percent yield/i.test(normalizedNotes)) addCard("Percent yield", "Percent yield = (actual yield ÷ theoretical yield) × 100%.", metadata);
  }
  if (basicHypothesisTestingNotes) {
    const metadata = { sourceSection: "Hypothesis testing", sourceKind: "hypothesis-testing" };
    addCard("Hypothesis test", "A procedure that uses sample evidence to evaluate a claim about a population parameter.", metadata);
    addCard("Null hypothesis (H₀)", "The baseline claim tested with sample evidence.", metadata);
    addCard("Alternative hypothesis (Hₐ)", "The competing claim supported when the evidence against H₀ is sufficiently strong.", metadata);
    addCard("Significance level (α)", "The cutoff chosen before analysis for deciding whether the p-value is small enough to reject H₀.", metadata);
    addCard("p-value decision rule", "Reject H₀ when p ≤ α; otherwise fail to reject H₀.", metadata);
    addCard("Type I error", "Rejecting H₀ when H₀ is actually true.", metadata);
    addCard("Type II error", "Failing to reject H₀ when H₀ is actually false.", metadata);
    addCard("Hypothesis-test workflow", "State H₀ and Hₐ, choose α, calculate the test statistic and p-value, make a decision, and state the conclusion in context.", metadata);
  }
  if (haitianRevolutionNotes) {
    const metadata = { sourceSection: "Haitian Revolution", sourceKind: "haitian-revolution" };
    addCard("Saint-Domingue before the revolution", "A profitable French sugar and coffee colony built on enslaved labor and severe racial inequality.", metadata);
    addCard("Haitian uprising of 1791", "An uprising by enslaved people that began in northern Saint-Domingue and expanded into a wider revolution.", metadata);
    addCard("French abolition of slavery in 1794", "France abolished slavery in its colonies while fighting the revolution and wars against Britain and Spain.", metadata);
    addCard("Toussaint Louverture", "The revolution's leading general; he ended slavery across Hispaniola and promoted a constitution in 1801.", metadata);
    addCard("Louverture's arrest", "Napoleon's forces arrested Toussaint Louverture in 1802 and deported him to France.", metadata);
    addCard("Haitian independence", "After defeating French forces, Haiti declared independence in 1804.", metadata);
    addCard("Historical significance of the Haitian Revolution", "It overthrew colonial rule and created an independent nation led by formerly enslaved people.", metadata);
  }
  if (macbethNotes) {
    const metadata = { sourceSection: "Macbeth", sourceKind: "macbeth" };
    addCard("Author", "William Shakespeare.", metadata);
    addCard("Genre", "Tragedy.", metadata);
    addCard("Setting", "Medieval Scotland.", metadata);
    addCard("Macbeth", "A celebrated soldier whose ambition and choices turn him into a tyrant.", metadata);
    addCard("Lady Macbeth", "Macbeth's wife, who urges the first murder but later collapses under guilt.", metadata);
    addCard("Banquo", "Macbeth's friend and foil; he hears prophecy without murdering for power.", metadata);
    addCard("Macduff", "A Scottish noble who opposes and ultimately defeats Macbeth.", metadata);
    addCard("Ambition", "The desire for power becomes destructive when separated from moral restraint.", metadata);
    addCard("Guilt", "Violence creates psychological consequences that Macbeth and Lady Macbeth cannot control.", metadata);
    addCard("Appearance versus reality", "Prophecies and deception make dangerous ideas seem trustworthy.", metadata);
    addCard("Central conflict", "Macbeth tries to secure power through violence while resistance grows against his rule.", metadata);
    addCard("Resolution", "Macduff kills Macbeth, Malcolm becomes king, and political order begins to return.", metadata);
  }
  if (supplyDemandNotes) {
    const metadata = { sourceSection: "Supply and demand", sourceKind: "supply-demand" };
    addCard("Law of demand", "Other things equal, a higher price usually lowers quantity demanded.", metadata);
    addCard("Demand vs. quantity demanded", "Demand is the full price-quantity relationship; quantity demanded is one point on the demand curve.", metadata);
    addCard("Law of supply", "Other things equal, a higher price usually raises quantity supplied.", metadata);
    addCard("Supply vs. quantity supplied", "Supply is the full price-quantity relationship; quantity supplied is one point on the supply curve.", metadata);
    addCard("Market equilibrium", "The price and quantity where quantity demanded equals quantity supplied.", metadata);
    addCard("Surplus", "At a price above equilibrium, quantity supplied exceeds quantity demanded and puts downward pressure on price.", metadata);
    addCard("Shortage", "At a price below equilibrium, quantity demanded exceeds quantity supplied and puts upward pressure on price.", metadata);
    addCard("Demand shifters", "Income, tastes, prices of related goods, population, and expectations can shift demand.", metadata);
    addCard("Supply shifters", "Input costs, technology, natural conditions, taxes, and subsidies can shift supply.", metadata);
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
  if (reactionYieldNotes || basicHypothesisTestingNotes || haitianRevolutionNotes || macbethNotes || supplyDemandNotes || hypothesisTestingNotes || electrochemistryNotes) return cards;
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
      if (!term || /^(?:trigger|outcomes?|key figures?)$/i.test(term) || words.length > 8 || /^https?:/i.test(term) || /^\(?\d{4}\s*[-–—]\s*\d{4}\)?$/.test(term) || context.toLowerCase() === term.toLowerCase() || /^\([^)]*\)$/.test(remainder) || new RegExp(`^(?:the\\s+)?(?:psychological\\s+)?process\\s+known\\s+as\\s+${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[.]?$`, "i").test(context)) return;
      addCard(term, context);
    });
  });
  const outlineLines = rawLines.map((raw, sourceIndex) => {
    const expanded = raw.replace(/\t/g, "  ");
    const markdownBoldHeading = expanded.match(/^\s*(#{1,6})\s+\*\*(.+?)\*\*\s*$/);
    const markdownHeading = expanded.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const boldHeading = expanded.match(/^\s*\*\*(.+?)\*\*\s*$/);
    const numberedHeading = expanded.match(/^\s*(\d+(?:\.\d+)+)\.?\s+(.+?)\s*$/);
    const headingMatch = markdownBoldHeading
      || markdownHeading
      || boldHeading
      || numberedHeading
      || expanded.match(/^\s*\d+[.)]\s+([^.!?]{2,80})\s*$/)
      || expanded.match(/^\s*[IVXLCDM]+[.)]\s+(.+?)\s*$/i)
      || expanded.match(/^\s*((?:[A-Z][A-Za-z&/-]*|&)(?:\s+(?:[A-Z][A-Za-z&/-]*|&|and|of|in)){1,8})\s*$/);
    const stageMatch = expanded.match(/^\s*\d+\s*[→➝]\s*(.+?)\s*$/);
    const bulletMatch = expanded.match(/^(\s*)(?:[-*•]|\d+[.)])\s+(.+?)\s*$/);
    if (headingMatch) {
      const headingText = markdownBoldHeading?.[2] || markdownHeading?.[2] || boldHeading?.[1] || numberedHeading?.[2] || headingMatch[1];
      const headingLevel = markdownBoldHeading?.[1]?.length || markdownHeading?.[1]?.length || (numberedHeading ? numberedHeading[1].split(".").length : 1);
      return { sourceIndex, kind: "heading", depth: -1, headingLevel, text: cleanNoteLine(headingText).replace(/^\d+(?:\.\d+)*\.?\s*/, ""), children: [] };
    }
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
      value = String(value || "").replace(/\*{1,3}/g, "").trim();
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
    const headingCardTitle = (value) => cleanDetail(value)
      .replace(/^\d+(?:\.\d+)*[.)]?\s*/, "")
      .replace(/\s*\((?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(?:Pre-)?\d{4}(?:\s*[–—-]\s*\d{4})?\)\s*$/i, "")
      .replace(/^The\s+(?=[A-Z])/i, "")
      .trim();
    const genericHeading = (value) => /^(?:trigger|outcomes?|key figures?|key background(?:\s*&\s*causes?)?|background(?:\s*&\s*causes?)?|causes?|significance(?:\s*&\s*long-term impact)?|long-term impact|summary|overview|introduction|learning objectives?|problem-solving strategy|key concepts?|examples?\s*\d*(?:\.\d+)?|solutions?|checkpoints?\s*\d*(?:\.\d+)?)(?:\s*\([^)]*\))?$/i.test(value);
    const headingSummaryParts = (start, end, limit = 4) => {
      const parts = [];
      for (let index = start; index < end && parts.length < limit; index += 1) {
        const line = outlineLines[index];
        if (!line || line.kind === "heading") continue;
        const [term, detail] = splitTermDetail(line.text);
        if (!detail && /^(?:trigger|outcomes?|key figures?):?$/i.test(term)) continue;
        const part = cleanDetail(detail ? `${term}: ${detail}` : term);
        if (part && part.length >= 8 && !parts.some((existing) => existing.toLowerCase() === part.toLowerCase())) parts.push(part);
      }
      return parts;
    };
    const addMeaningfulHeadingCards = () => {
      const headings = outlineLines.map((line, index) => ({ line, index })).filter(({ line }) => line.kind === "heading");
      headings.forEach(({ line, index }) => {
        const title = headingCardTitle(line.text);
        if (!title || genericHeading(title) || title.length > 80) return;
        const level = line.headingLevel || 1;
        let end = outlineLines.length;
        for (let cursor = index + 1; cursor < outlineLines.length; cursor += 1) {
          const candidate = outlineLines[cursor];
          if (candidate.kind === "heading" && (candidate.headingLevel || 1) <= level) { end = cursor; break; }
        }
        const immediateChildren = headings.filter(({ line: child, index: childIndex }) => childIndex > index && childIndex < end && (child.headingLevel || 1) === level + 1);
        let parts = [];
        if (immediateChildren.length) {
          parts = immediateChildren.slice(0, 4).map(({ line: child, index: childIndex }, childPosition) => {
            const nextChild = immediateChildren[childPosition + 1]?.index || end;
            const details = headingSummaryParts(childIndex + 1, nextChild, 2);
            const childTitle = headingCardTitle(child.text);
            return details.length ? `${childTitle}: ${details.join("; ")}` : childTitle;
          }).filter(Boolean);
        } else {
          parts = headingSummaryParts(index + 1, end, 4);
        }
        let summary = parts.join("; ");
        if (summary.length > 780) summary = `${summary.slice(0, 777).replace(/\s+\S*$/, "")}…`;
        if (summary) addCard(title, summary, { sourceSection: title, sourceKind: inferredDomain === "general" ? undefined : inferredDomain, sourceFormat: "heading-summary", preferBack: true });
      });
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
      const organizationalLabel = /^(?:trigger|outcomes?|key figures?):?$/i.test(term);
      if (!organizationalLabel && node.children.length && term.length <= 75 && back && !/^(?:major leaders and institutions|important events and policies)$/i.test(term)) addCard(term, back, metadata);
      else if (!organizationalLabel && inlineDetail) addCard(term, inlineDetail, metadata);
      else if (!organizationalLabel && node.parent?.kind === "bullet") {
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
            if (back && !/^(?:trigger|outcomes?|key figures?):?$/i.test(term)) addCard(term, back, { sourceSection: root.text });
            index = end;
          }
          return;
        }
        const directFacts = root.children.filter((child) => !child.children.length && looksLikeFact(child.text)).map((child) => cleanDetail(child.text));
        if (directFacts.length && !/[?]$/.test(root.text) && !/^(?:overview|background|introduction|ambition|conclusion|summary|plot summary|possible discussion questions)$/i.test(root.text)) addCard(root.text, directFacts.join("; "), { sourceSection: root.text });
        root.children.forEach(addOutlineNode);
      } else if (!(headingCount && !root.section)) addOutlineNode(root);
    });
    addMeaningfulHeadingCards();
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

function supplementalQuestionsFromNotes(notes) {
  const source = String(notes || "").replace(/\s+/g, " ").trim();
  const questions = [];
  if (/\bencoding\b[\s\S]{0,1200}\bstorage\b[\s\S]{0,1200}\bretrieval\b/i.test(source)) {
    questions.push({
      id: makeLocalId("question"), type: "multiple_select",
      prompt: "Which processes are the three basic functions of memory?",
      options: ["Encoding", "Storage", "Retrieval", "Rehearsal"],
      answer: "Encoding | Storage | Retrieval",
      explanation: "Encoding inputs information, storage retains it, and retrieval returns it to awareness.",
      difficulty: "Easy", confidence: 0.96, rule: "source-grounded process set",
    });
  }
  if (/\bglycolysis\b/i.test(source) && /two\s+(?:net\s+)?ATP[\s\S]{0,160}two\s+NADH|net gain of two ATP[\s\S]{0,160}two NADH/i.test(source)) {
    questions.push({
      id: makeLocalId("question"), type: "multiple_select",
      prompt: "Which products are produced per glucose molecule during glycolysis?",
      options: ["Two pyruvate", "Two ATP net", "Two NADH", "Six carbon dioxide"],
      answer: "Two pyruvate | Two ATP net | Two NADH",
      explanation: "Glycolysis yields two pyruvate, two net ATP, and two NADH; carbon dioxide is not released during glycolysis.",
      difficulty: "Medium", confidence: 0.96, rule: "source-grounded process products",
    });
  }
  if (/\blimiting reactant\b[\s\S]{0,1800}\b(?:theoretical yield|actual yield|percent yield)\b/i.test(source)) {
    questions.push({
      id: makeLocalId("question"), type: "mcq",
      prompt: "For H₂ + Cl₂ → 2HCl, what is the result when 3 mol H₂ react with 2 mol Cl₂?",
      options: ["Cl₂ is limiting and 4 mol HCl can form", "H₂ is limiting and 6 mol HCl can form", "Cl₂ is limiting and 2 mol HCl can form", "Neither reactant is limiting"],
      answer: "Cl₂ is limiting and 4 mol HCl can form",
      explanation: "The reaction uses H₂ and Cl₂ in a 1:1 ratio. Two moles of Cl₂ consume two of the three moles of H₂ and form four moles of HCl.",
      difficulty: "Medium", confidence: 0.96, rule: "source-grounded stoichiometry",
    });
  }
  if (/\bnull hypothesis\b[\s\S]{0,1600}\b(?:alternative hypothesis|p-value|significance level)\b/i.test(source)) {
    questions.push({
      id: makeLocalId("question"), type: "multiple_select",
      prompt: "Which steps belong in a complete hypothesis test?",
      options: ["State H₀ and Hₐ", "Choose α", "Calculate a test statistic and p-value", "Always accept H₀ when p > α"],
      answer: "State H₀ and Hₐ | Choose α | Calculate a test statistic and p-value",
      explanation: "A complete test states hypotheses, sets α, analyzes the sample, makes a reject/fail-to-reject decision, and concludes in context.",
      difficulty: "Medium", confidence: 0.96, rule: "source-grounded procedure",
    });
  }
  if (/\blaw of demand\b[\s\S]{0,1800}\blaw of supply\b[\s\S]{0,1800}\b(?:market )?equilibrium\b/i.test(source)) {
    questions.push({
      id: makeLocalId("question"), type: "mcq",
      prompt: "A market price is below equilibrium. Which outcome should the supply-and-demand model predict?",
      options: ["A shortage and upward pressure on price", "A surplus and downward pressure on price", "A shortage and downward pressure on price", "No pressure for price to change"],
      answer: "A shortage and upward pressure on price",
      explanation: "Below equilibrium, quantity demanded exceeds quantity supplied, so competition among buyers tends to push price upward.",
      difficulty: "Medium", confidence: 0.96, rule: "source-grounded market scenario",
    });
  }
  const balloonRate = source.match(/(?:spherical\s+)?balloon[\s\S]{0,320}?(?:rate of|at a rate of)\s*([\d.]+)\s*(?:cm\s*\^?\s*3|cm³|cubic centimeters?)/i);
  const balloonRadius = source.match(/radius(?:\s+is|\s*=|\s+of)?\s*([\d.]+)\s*cm/i);
  if (balloonRate && balloonRadius) {
    const volumeRate = Number(balloonRate[1]);
    const radius = Number(balloonRadius[1]);
    if (Number.isFinite(volumeRate) && Number.isFinite(radius) && volumeRate > 0 && radius > 0) {
      const correct = volumeRate / (4 * Math.PI * radius * radius);
      const formatRate = (value) => `${value.toFixed(4)} cm/s`;
      const options = [correct, volumeRate / (4 * Math.PI * radius), volumeRate / (Math.PI * radius * radius), volumeRate / (3 * Math.PI * radius * radius)].map(formatRate);
      questions.push({
        id: makeLocalId("question"), type: "mcq",
        prompt: `A spherical balloon's volume increases at ${volumeRate} cm³/s. How fast is its radius increasing when the radius is ${radius} cm?`,
        options: [...new Set(options)], answer: formatRate(correct),
        explanation: "Differentiate V = (4/3)πr³ with respect to time to obtain dV/dt = 4πr²(dr/dt), then substitute the values.",
        difficulty: "Hard", confidence: 0.97, rule: "source-grounded quantitative application",
      });
    }
  }
  return questions;
}

function generateQuestionsFromCards(cards, notes = "") {
  const noteText = String(notes || "");
  const relatedRatesNotes = /\brelated[- ]rates?\b|\b(?:two|several) related quantities\b[\s\S]{0,240}\bchanging (?:with respect to|over) time\b/i.test(noteText);
  const glycolysisNotes = /\bglycolysis\b[\s\S]{0,1200}\b(?:glucose|pyruvate|ATP|NADH)\b/i.test(noteText);
  const memorySystemsNotes = /\bencoding\b[\s\S]{0,1600}\bstorage\b[\s\S]{0,1600}\bretrieval\b/i.test(noteText);
  const reactionYieldNotes = /\blimiting reactant\b[\s\S]{0,1800}\b(?:theoretical yield|actual yield|percent yield)\b/i.test(noteText);
  const hypothesisNotes = /\bnull hypothesis\b[\s\S]{0,1600}\b(?:alternative hypothesis|p-value|significance level)\b/i.test(noteText);
  const haitianRevolutionNotes = /\bHaitian Revolution\b[\s\S]{0,2200}\b(?:Saint-Domingue|Toussaint Louverture|independence in 1804)\b/i.test(noteText);
  const macbethNotes = /(?:^|\n)\s*#{1,6}\s+Macbeth\b[\s\S]{0,2200}\b(?:Lady Macbeth|Banquo|Macduff)\b/i.test(noteText);
  const supplyDemandNotes = /\blaw of demand\b[\s\S]{0,1800}\blaw of supply\b[\s\S]{0,1800}\b(?:market )?equilibrium\b/i.test(noteText);
  const questionCards = cards.filter((card) => !/^Explain\b/i.test(String(card.front || "").trim())
    && !((card.sourceKind === "related-rates" || relatedRatesNotes) && /^Balloon example$/i.test(String(card.front || "").trim()))
    && !((card.sourceKind === "psychology-memory" || memorySystemsNotes) && /^(?:How Memory Functions|Memory uses three basic functions)$/i.test(String(card.front || "").trim())));
  const topics = [...new Set(questionCards.map(cardTopic).filter(Boolean))];
  const generatedQuestions = questionCards.map((card, index) => {
    const topic = cardTopic(card);
    const embeddedTopic = String(topic || "").replace(/^(A|An|The)\b/, (article) => article.toLowerCase());
    const base = { id: makeLocalId("question"), source: card.back, confidence: 0.75 };
    const section = String(card.sourceSection || "").toLowerCase();
    if (topic && (card.sourceKind === "related-rates" || relatedRatesNotes)) {
      if (/^Why values are substituted after differentiating$/i.test(topic)) {
        return { ...base, type: "cloze", prompt: "If changing values are substituted before differentiation, they may incorrectly behave like _____.", answer: "constants", difficulty: "Medium", confidence: 0.95, rule: "related-rates error diagnosis" };
      }
      if (/^Related-rates workflow$/i.test(topic)) {
        return { ...base, type: "cloze", prompt: "After writing an equation that relates the changing quantities, differentiate both sides with respect to _____.", answer: "time", difficulty: "Medium", confidence: 0.95, rule: "related-rates procedure" };
      }
      if (/^Solving a Related-Rates Problem$/i.test(topic)) {
        return { ...base, type: "cloze", prompt: "In a related-rates solution, substitute the values for the instant being studied only _____ differentiating the equation.", answer: "after", difficulty: "Medium", confidence: 0.95, rule: "related-rates substitution order" };
      }
      return { ...base, type: "cloze", prompt: "Equations that connect two or more quantities changing with time are studied using _____.", answer: "related rates", difficulty: "Easy", confidence: 0.95, rule: "related-rates concept" };
    }
    if (topic && (card.sourceKind === "glycolysis" || glycolysisNotes)) {
      if (/^Net products of glycolysis$/i.test(topic)) return { ...base, type: "cloze", prompt: "Per glucose, glycolysis produces two pyruvate, two net ATP, and two _____.", answer: "NADH", difficulty: "Medium", confidence: 0.96, rule: "glycolysis product accounting" };
      if (/ATP investment and payoff/i.test(topic)) return { ...base, type: "cloze", prompt: "Glycolysis invests two ATP and produces four ATP, giving a net gain of _____ ATP.", answer: "two", difficulty: "Medium", confidence: 0.96, rule: "glycolysis energy accounting" };
      if (/^Energy investment$/i.test(topic)) return { ...base, type: "cloze", prompt: "The energy-investment phase of glycolysis consumes _____ ATP per glucose.", answer: "two", difficulty: "Easy", confidence: 0.94, rule: "glycolysis investment" };
      if (/^Energy payoff$/i.test(topic)) return { ...base, type: "cloze", prompt: "The energy-payoff phase of glycolysis produces _____ ATP per glucose before subtracting the investment.", answer: "four", difficulty: "Medium", confidence: 0.94, rule: "glycolysis payoff" };
      if (/^Net products$/i.test(topic)) return { ...base, type: "cloze", prompt: "After subtracting the ATP investment, glycolysis has a net gain of _____ ATP per glucose.", answer: "two", difficulty: "Medium", confidence: 0.94, rule: "glycolysis net yield" };
      return { ...base, type: "cloze", prompt: "The cytosolic pathway that converts one glucose into two pyruvate is _____.", answer: "glycolysis", difficulty: "Easy", confidence: 0.96, rule: "glycolysis concept" };
    }
    if (topic && (card.sourceKind === "psychology-memory" || memorySystemsNotes)) {
      if (/Three basic functions of memory/i.test(topic)) return { ...base, type: "cloze", prompt: "Encoding inputs information, storage retains it, and _____ brings it back into awareness.", answer: "retrieval", difficulty: "Easy", confidence: 0.96, rule: "memory-process sequence" };
      if (/Automatic vs\. effortful processing/i.test(topic)) return { ...base, type: "cloze", prompt: "Encoding that requires attention and deliberate work is called _____ processing.", answer: "effortful", difficulty: "Easy", confidence: 0.96, rule: "memory-process comparison" };
      if (/Atkinson[–—-]Shiffrin model/i.test(topic)) return { ...base, type: "cloze", prompt: "In the Atkinson–Shiffrin model, attended sensory information first enters _____ memory.", answer: "short-term", difficulty: "Medium", confidence: 0.95, rule: "memory-model sequence" };
      const replaced = card.back.replace(new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____");
      return { ...base, type: "cloze", prompt: replaced.includes("_____") ? replaced : `${questionDefinitionExcerpt(card.back)} The process is _____.`, answer: topic, difficulty: "Easy", confidence: 0.9, rule: "memory concept recall" };
    }
    if (topic && (card.sourceKind === "reaction-yields" || reactionYieldNotes)) {
      if (/^Limiting reactant$/i.test(topic)) return { ...base, type: "cloze", prompt: "The reactant consumed first, which determines the maximum product, is the _____.", answer: "limiting reactant", difficulty: "Easy", confidence: 0.96, rule: "reaction-yield concept" };
      if (/^Excess reactant$/i.test(topic)) return { ...base, type: "cloze", prompt: "A reactant left after the limiting reactant is consumed is the _____.", answer: "excess reactant", difficulty: "Easy", confidence: 0.96, rule: "reaction-yield concept" };
      if (/^Identifying/i.test(topic)) return { ...base, type: "cloze", prompt: "When each reactant is converted to possible product, the reactant predicting the _____ amount of product is limiting.", answer: "smaller", difficulty: "Medium", confidence: 0.95, rule: "limiting-reactant method" };
      if (/^Theoretical yield$/i.test(topic)) return { ...base, type: "cloze", prompt: "The maximum product predicted by stoichiometry is the _____.", answer: "theoretical yield", difficulty: "Easy", confidence: 0.96, rule: "yield definition" };
      if (/^Actual yield$/i.test(topic)) return { ...base, type: "cloze", prompt: "The amount of product collected experimentally is the _____.", answer: "actual yield", difficulty: "Easy", confidence: 0.96, rule: "yield definition" };
      if (/^Percent yield$/i.test(topic)) return { ...base, type: "cloze", prompt: "Percent yield equals actual yield divided by theoretical yield, multiplied by _____%. ", answer: "100", difficulty: "Easy", confidence: 0.96, rule: "yield calculation" };
      return { ...base, type: "cloze", prompt: "In the H₂ + Cl₂ example, _____ is the limiting reactant.", answer: "Cl₂", difficulty: "Medium", confidence: 0.94, rule: "limiting-reactant example" };
    }
    if (topic && (card.sourceKind === "hypothesis-testing" || hypothesisNotes)) {
      if (/^Null hypothesis/i.test(topic)) return { ...base, type: "cloze", prompt: "The baseline claim evaluated by a hypothesis test is _____.", answer: "H₀", difficulty: "Easy", confidence: 0.96, rule: "hypothesis vocabulary" };
      if (/^Alternative hypothesis/i.test(topic)) return { ...base, type: "cloze", prompt: "The competing claim supported by strong evidence against H₀ is _____.", answer: "Hₐ", difficulty: "Easy", confidence: 0.96, rule: "hypothesis vocabulary" };
      if (/^Significance level/i.test(topic)) return { ...base, type: "cloze", prompt: "The decision cutoff chosen before a hypothesis test is denoted by _____.", answer: "α", difficulty: "Easy", confidence: 0.96, rule: "hypothesis vocabulary" };
      if (/^p-value decision rule$/i.test(topic)) return { ...base, type: "cloze", prompt: "Reject H₀ when the p-value is _____ α.", answer: "less than or equal to", difficulty: "Medium", confidence: 0.96, rule: "hypothesis decision" };
      if (/^Type I error$/i.test(topic)) return { ...base, type: "cloze", prompt: "Rejecting a true null hypothesis is a _____ error.", answer: "Type I", difficulty: "Medium", confidence: 0.96, rule: "hypothesis error" };
      if (/^Type II error$/i.test(topic)) return { ...base, type: "cloze", prompt: "Failing to reject a false null hypothesis is a _____ error.", answer: "Type II", difficulty: "Medium", confidence: 0.96, rule: "hypothesis error" };
      if (/workflow/i.test(topic)) return { ...base, type: "cloze", prompt: "After calculating a test statistic and p-value, make a decision and state the conclusion in _____.", answer: "context", difficulty: "Medium", confidence: 0.94, rule: "hypothesis workflow" };
      return { ...base, type: "cloze", prompt: "A procedure that uses sample evidence to evaluate a population claim is a _____.", answer: "hypothesis test", difficulty: "Easy", confidence: 0.95, rule: "hypothesis concept" };
    }
    if (topic && (card.sourceKind === "haitian-revolution" || haitianRevolutionNotes)) {
      if (/uprising of 1791/i.test(topic)) return { ...base, type: "cloze", prompt: "The uprising by enslaved people in northern Saint-Domingue began in _____.", answer: "1791", difficulty: "Medium", confidence: 0.96, rule: "historical chronology" };
      if (/abolition of slavery in 1794/i.test(topic)) return { ...base, type: "cloze", prompt: "France abolished slavery in its colonies in _____.", answer: "1794", difficulty: "Medium", confidence: 0.96, rule: "historical chronology" };
      if (/Toussaint Louverture/i.test(topic)) return { ...base, type: "cloze", prompt: "The leading Haitian revolutionary general who promoted a constitution in 1801 was _____.", answer: "Toussaint Louverture", difficulty: "Medium", confidence: 0.96, rule: "historical figure" };
      if (/Louverture's arrest/i.test(topic)) return { ...base, type: "cloze", prompt: "Napoleon's forces arrested and deported Toussaint Louverture in _____.", answer: "1802", difficulty: "Medium", confidence: 0.96, rule: "historical chronology" };
      if (/Haitian independence/i.test(topic)) return { ...base, type: "cloze", prompt: "After defeating French forces, Haiti declared independence in _____.", answer: "1804", difficulty: "Medium", confidence: 0.96, rule: "historical chronology" };
      if (/significance/i.test(topic)) return { ...base, type: "multiple_select", prompt: "Which outcomes made the Haitian Revolution historically significant?", options: ["It overthrew colonial rule", "It established Haitian independence", "It created a nation led by formerly enslaved people", "It restored French plantation rule"], answer: "It overthrew colonial rule | It established Haitian independence | It created a nation led by formerly enslaved people", difficulty: "Medium", confidence: 0.95, rule: "historical significance" };
      return { ...base, type: "cloze", prompt: `${questionDefinitionExcerpt(card.back)} The place described is _____.`, answer: "Saint-Domingue", difficulty: "Easy", confidence: 0.9, rule: "historical context" };
    }
    if (topic && (card.sourceKind === "macbeth" || macbethNotes)) {
      const characterOptions = ["Macbeth", "Lady Macbeth", "Banquo", "Macduff"];
      if (characterOptions.includes(topic)) return { ...base, type: "mcq", prompt: `Which character matches this description: ${card.back}`, options: characterOptions, answer: topic, difficulty: "Medium", confidence: 0.95, rule: "literary character evidence" };
      const themeOptions = ["Ambition", "Guilt", "Appearance versus reality", "Loyalty"];
      if (themeOptions.includes(topic)) return { ...base, type: "mcq", prompt: `Which theme best matches this explanation: ${card.back}`, options: themeOptions, answer: topic, difficulty: "Medium", confidence: 0.94, rule: "literary theme" };
      if (/^Author$/i.test(topic)) return { ...base, type: "cloze", prompt: "Macbeth was written by _____.", answer: "William Shakespeare", difficulty: "Easy", confidence: 0.99, rule: "literary fact" };
      if (/^Genre$/i.test(topic)) return { ...base, type: "cloze", prompt: "Macbeth is a _____.", answer: "tragedy", difficulty: "Easy", confidence: 0.99, rule: "literary fact" };
      if (/^Setting$/i.test(topic)) return { ...base, type: "cloze", prompt: "Macbeth is primarily set in medieval _____.", answer: "Scotland", difficulty: "Easy", confidence: 0.99, rule: "literary fact" };
      return { ...base, type: "true_false", prompt: card.back, answer: "True", difficulty: "Medium", confidence: 0.86, rule: "literary claim" };
    }
    if (topic && (card.sourceKind === "supply-demand" || supplyDemandNotes)) {
      if (/^Surplus$/i.test(topic)) return { ...base, type: "cloze", prompt: "A price above equilibrium creates a _____.", answer: "surplus", difficulty: "Easy", confidence: 0.97, rule: "market disequilibrium" };
      if (/^Shortage$/i.test(topic)) return { ...base, type: "cloze", prompt: "A price below equilibrium creates a _____.", answer: "shortage", difficulty: "Easy", confidence: 0.97, rule: "market disequilibrium" };
      if (/^Market equilibrium$/i.test(topic)) return { ...base, type: "cloze", prompt: "At market equilibrium, quantity demanded _____ quantity supplied.", answer: "equals", difficulty: "Easy", confidence: 0.97, rule: "market equilibrium" };
      if (/^Law of demand$/i.test(topic)) return { ...base, type: "cloze", prompt: "Other things equal, a higher price usually _____ quantity demanded.", answer: "lowers", difficulty: "Easy", confidence: 0.96, rule: "law of demand" };
      if (/^Law of supply$/i.test(topic)) return { ...base, type: "cloze", prompt: "Other things equal, a higher price usually _____ quantity supplied.", answer: "raises", difficulty: "Easy", confidence: 0.96, rule: "law of supply" };
      if (/Demand vs\./i.test(topic)) return { ...base, type: "cloze", prompt: "Demand describes the full curve, while _____ describes one point on it.", answer: "quantity demanded", difficulty: "Medium", confidence: 0.95, rule: "economic distinction" };
      if (/Supply vs\./i.test(topic)) return { ...base, type: "cloze", prompt: "Supply describes the full curve, while _____ describes one point on it.", answer: "quantity supplied", difficulty: "Medium", confidence: 0.95, rule: "economic distinction" };
      return { ...base, type: "multiple_select", prompt: `Which factors can shift ${/^Demand/i.test(topic) ? "demand" : "supply"}?`, options: /^Demand/i.test(topic) ? ["Income", "Tastes", "Prices of related goods", "The good's own price"] : ["Input costs", "Technology", "Taxes or subsidies", "The good's own price"], answer: /^Demand/i.test(topic) ? "Income | Tastes | Prices of related goods" : "Input costs | Technology | Taxes or subsidies", difficulty: "Medium", confidence: 0.94, rule: "curve shifters" };
    }
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
  const seenPrompts = new Set();
  return [...supplementalQuestionsFromNotes(notes), ...generatedQuestions.map((question, index) => typedQuestionAsCloze(question, questionCards[index]))]
    .filter((question) => {
      const key = String(question.prompt || "").replace(/\s+/g, " ").trim().toLowerCase();
      const answer = String(question.answer || "").replace(/\s+/g, " ").trim();
      if (!key || !answer || key.length > 420 || answer.length > 700 || seenPrompts.has(key)) return false;
      if (["mcq", "stimulus_mcq", "multiple_select"].includes(question.type)) {
        const options = [...new Set((question.options || []).map((option) => String(option).trim()).filter(Boolean))];
        const answers = String(question.answer).split(/\s*\|\s*/).filter(Boolean);
        if (options.length < 3 || !answers.every((expected) => options.some((option) => option.localeCompare(expected, undefined, { sensitivity: "base" }) === 0))) return false;
        question.options = options;
      }
      seenPrompts.add(key);
      return true;
    });
}

function generateFeynmanPrompts(notes, cards) {
  if (/\b5E Lesson\b[\s\S]{0,1500}\bTeacher's Note\b|\bAt a glance\b[\s\S]{0,1200}\bMaterials\b[\s\S]{0,1200}\bThe 5E lesson\b/i.test(notes)) return [];
  if (/\brelated[- ]rates?\b|\b(?:two|several) related quantities\b[\s\S]{0,240}\bchanging (?:with respect to|over) time\b/i.test(notes)) {
    return [
      "Explain a reliable related-rates workflow: define variables, connect the quantities, differentiate with respect to time, substitute the instant's values, solve, and check units.",
      "Explain why substituting a changing quantity before differentiating can erase the rate you need to find.",
      "Solve a spherical-balloon related-rates problem and explain how dV/dt, r, and dr/dt are connected.",
      "Compare a related-rates equation before and after implicit differentiation, identifying which quantities and rates are known or unknown.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\bglycolysis\b[\s\S]{0,1200}\b(?:glucose|pyruvate|ATP|NADH)\b/i.test(notes)) {
    return [
      "Trace one glucose molecule through glycolysis, accounting for carbon atoms, ATP invested, ATP produced, NADH, and pyruvate.",
      "Explain why glycolysis has an energy-investment phase and an energy-payoff phase, and calculate its net ATP yield.",
      "Explain how glycolysis can produce ATP without oxygen and why cells still need a way to regenerate NAD+.",
      "Predict how inhibiting an early glycolysis enzyme would affect downstream intermediates, ATP production, and pyruvate formation.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\bencoding\b[\s\S]{0,1600}\bstorage\b[\s\S]{0,1600}\bretrieval\b/i.test(notes)) {
    return [
      "Trace a new piece of information through encoding, storage, and retrieval using one concrete example.",
      "Compare automatic and effortful processing, then explain when each is likely to create a durable memory.",
      "Explain the Atkinson–Shiffrin model from sensory input through long-term memory, including the roles of attention and rehearsal.",
      "Diagnose whether a forgetting example is primarily an encoding, storage, or retrieval problem and justify the classification.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\blimiting reactant\b[\s\S]{0,1800}\b(?:theoretical yield|actual yield|percent yield)\b/i.test(notes)) {
    return [
      "Explain two reliable methods for identifying a limiting reactant and why they give the same result.",
      "Solve the H₂ + Cl₂ example from reactant amounts through limiting reactant, product formed, and excess remaining.",
      "Connect limiting reactant, theoretical yield, actual yield, and percent yield in one experimental scenario.",
      "Diagnose common stoichiometry mistakes involving an unbalanced equation, grams versus moles, and the wrong reactant ratio.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\bnull hypothesis\b[\s\S]{0,1600}\b(?:alternative hypothesis|p-value|significance level)\b/i.test(notes)) {
    return [
      "Walk through a complete hypothesis test from the research claim to a conclusion written in context.",
      "Explain the null hypothesis, alternative hypothesis, significance level, and p-value without treating the p-value as the probability that H₀ is true.",
      "Compare Type I and Type II errors using one concrete decision and explain their consequences.",
      "Explain why failing to reject H₀ is not the same as proving or accepting H₀.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\bHaitian Revolution\b[\s\S]{0,2200}\b(?:Saint-Domingue|Toussaint Louverture|independence in 1804)\b/i.test(notes)) {
    return [
      "Trace the Haitian Revolution from conditions in Saint-Domingue through the 1791 uprising, emancipation, and independence in 1804.",
      "Explain Toussaint Louverture's role, his 1801 constitution, and why Napoleon's government arrested him.",
      "Explain how war among France, Britain, and Spain affected the revolution in Saint-Domingue.",
      "Compare the Haitian Revolution's goals and outcomes with those of the American and French Revolutions, especially regarding slavery and racial equality.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/(?:^|\n)\s*#{1,6}\s+Macbeth\b[\s\S]{0,2200}\b(?:Lady Macbeth|Banquo|Macduff)\b/i.test(notes)) {
    return [
      "Trace how Macbeth changes from celebrated soldier to tyrant, connecting his choices to ambition, fear, and guilt.",
      "Compare Macbeth, Lady Macbeth, Banquo, and Macduff as different responses to ambition, prophecy, loyalty, and moral responsibility.",
      "Explain how appearance versus reality operates through prophecy, deception, and Macbeth's mistaken sense of security.",
      "Explain how the ending resolves both Macbeth's personal conflict and Scotland's political disorder.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
  if (/\blaw of demand\b[\s\S]{0,1800}\blaw of supply\b[\s\S]{0,1800}\b(?:market )?equilibrium\b/i.test(notes)) {
    return [
      "Explain how a market moves back toward equilibrium when its price begins above or below equilibrium.",
      "Distinguish a movement along a curve from a shift of the curve for both demand and supply.",
      "Analyze a real event with the four-step supply-and-demand process and predict the new equilibrium price and quantity.",
      "Compare shortages and surpluses, including their causes and the price pressures each creates.",
    ].map((prompt) => ({ id: makeLocalId("feynman"), prompt }));
  }
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
  if (/\b(?:the limit of a function|one-sided limits?|limit laws?|limits? at infinity|two-sided limits?)\b/i.test(notes)) {
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

const questionTypeOptions = [
  ["mcq", "Multiple choice"],
  ["multiple_select", "Select all that apply"],
  ["stimulus_mcq", "Stimulus based"],
  ["diagram_label", "Diagram labeling"],
  ["true_false", "True / false"],
  ["cloze", "Fill in the blank"],
  ["essay", "Essay prompt"],
];

function questionTypeLabel(type) {
  return questionTypeOptions.find(([value]) => value === type)?.[1] || "Fill in the blank";
}

function typedQuestionAsCloze(question, card = null) {
  const rawPrompt = String(question.prompt || "").replace(/\s+/g, " ").trim();
  const relatedDefinition = rawPrompt.match(/(?:the\s+)?related concept described as\s+(.+?)(?:\s+is\s*_{2,}[.!]?|$)/i)?.[1];
  if (relatedDefinition) return { ...question, type: "cloze", prompt: fillInBlankDefinitionPrompt(relatedDefinition) };
  if (!["wh", "short_answer", "matching", "ordering"].includes(question.type)) return question;
  const topic = card ? cardTopic(card) : "";
  const description = questionDefinitionExcerpt(card?.back || "");
  if (topic && description) {
    return { ...question, type: "cloze", prompt: fillInBlankDefinitionPrompt(description), answer: topic };
  }
  const whatIsTopic = rawPrompt.match(/^what (?:is|are|was|were)\s+(?:an?\s+|the\s+)?(.+?)[?!.]*$/i)?.[1];
  if (whatIsTopic && question.answer) return { ...question, type: "cloze", prompt: fillInBlankDefinitionPrompt(question.answer), answer: whatIsTopic };
  return { ...question, type: "cloze", prompt: `${String(question.prompt || "Complete the statement").replace(/[?.]+$/, "")}: _____` };
}

function questionTypeSelectOptions(selected) {
  return questionTypeOptions.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function questionOptionsFromText(value) {
  return [...new Set(String(value || "").split(/\n|\s*\|\s*/).map((item) => item.trim()).filter(Boolean))];
}

function isAnswerChoiceQuestion(type) {
  return type === "mcq" || type === "multiple_select";
}

function questionCorrectAnswers(question) {
  const answers = String(question?.answer || "").split(/\s*\|\s*/).map((item) => item.trim()).filter(Boolean);
  return question?.type === "mcq" ? answers.slice(0, 1) : answers;
}

function normalizeEditableQuestionChoices(question) {
  if (!isAnswerChoiceQuestion(question.type)) return question;
  const options = Array.isArray(question.options) ? question.options.map((option) => String(option || "")) : [];
  const startedWithoutChoices = options.length === 0;
  const correctAnswers = questionCorrectAnswers(question);
  correctAnswers.slice().reverse().forEach((answer) => {
    if (answer && !options.includes(answer)) options.unshift(answer);
  });
  while (options.length < (startedWithoutChoices ? 4 : 2)) options.push("");
  const fallback = options.find((option) => option.trim()) || "";
  const selected = correctAnswers.length ? correctAnswers : (fallback ? [fallback] : []);
  return { ...question, options, answer: question.type === "mcq" ? (selected[0] || "") : selected.join(" | ") };
}

function cleanQuestionForStorage(question) {
  const clean = { ...question, prompt: String(question.prompt || "").trim(), answer: String(question.answer || "").trim() };
  clean.options = [...new Set((question.options || []).map((option) => String(option || "").trim()).filter(Boolean))];
  if (isAnswerChoiceQuestion(clean.type)) {
    const correct = questionCorrectAnswers(clean).filter((answer) => clean.options.includes(answer));
    clean.answer = clean.type === "mcq" ? (correct[0] || clean.options[0] || "") : correct.join(" | ");
  }
  return clean;
}

function questionChoiceRowsHtml(question, questionIndex) {
  const isMultiple = question.type === "multiple_select";
  const correct = new Set(questionCorrectAnswers(question));
  const hasExplicitCorrect = correct.size > 0;
  return question.options.map((option, choiceIndex) => {
    const choiceLetter = String.fromCharCode(65 + choiceIndex);
    const checked = correct.has(option) || (!hasExplicitCorrect && choiceIndex === 0);
    return `<div class="question-choice-row"><input type="${isMultiple ? "checkbox" : "radio"}" name="draft-question-correct-${questionIndex}" data-question-choice-correct="${questionIndex}" data-choice-index="${choiceIndex}" ${checked ? "checked" : ""} aria-label="Mark choice ${choiceLetter} correct"><span>${choiceLetter}</span><input type="text" value="${escapeHtml(option)}" data-question-choice-text="${questionIndex}" data-choice-index="${choiceIndex}" placeholder="Answer choice ${choiceLetter}"><button type="button" data-remove-question-choice="${questionIndex}" data-choice-index="${choiceIndex}" aria-label="Remove choice ${choiceLetter}" ${question.options.length <= 2 ? "disabled" : ""}>×</button></div>`;
  }).join("");
}

let manualQuestionChoices = ["", "", "", ""];
let manualQuestionCorrectChoiceIndexes = new Set([0]);

function renderManualQuestionChoices() {
  const isMultiple = $("#manual-question-type").value === "multiple_select";
  $("#manual-question-choice-help").textContent = isMultiple ? "Mark every correct answer" : "Choose one correct answer";
  $("#manual-question-choice-list").innerHTML = manualQuestionChoices.map((choice, index) => {
    const choiceLetter = String.fromCharCode(65 + index);
    return `<div class="question-choice-row"><input type="${isMultiple ? "checkbox" : "radio"}" name="manual-question-correct" data-manual-choice-correct="${index}" ${manualQuestionCorrectChoiceIndexes.has(index) ? "checked" : ""} aria-label="Mark choice ${choiceLetter} correct"><span>${choiceLetter}</span><input type="text" value="${escapeHtml(choice)}" data-manual-choice-text="${index}" placeholder="Answer choice ${choiceLetter}"><button type="button" data-remove-manual-choice="${index}" aria-label="Remove choice ${choiceLetter}" ${manualQuestionChoices.length <= 2 ? "disabled" : ""}>×</button></div>`;
  }).join("");
}

function resetManualQuestionChoices() {
  manualQuestionChoices = ["", "", "", ""];
  manualQuestionCorrectChoiceIndexes = new Set([0]);
  renderManualQuestionChoices();
}

function syncDraftQuestionChoices(questionIndex) {
  const question = state.customQuestionDraft[questionIndex];
  const editor = $(`[data-question-draft="${questionIndex}"] .question-choice-editor`);
  if (!question || !editor) return;
  const rows = $$(".question-choice-row", editor);
  question.options = rows.map((row) => row.querySelector("[data-question-choice-text]").value);
  const correct = rows.filter((row) => row.querySelector("[data-question-choice-correct]").checked)
    .map((row) => row.querySelector("[data-question-choice-text]").value.trim()).filter(Boolean);
  question.answer = question.type === "mcq" ? (correct[0] || "") : correct.join(" | ");
  updateCustomSaveButtons();
}

function essaySourcesFromText(value) {
  return String(value || "").split(/\n\s*---\s*\n/g).map((block) => block.trim()).filter(Boolean).map((block, index) => {
    const [metadata = "", ...excerptLines] = block.split("\n");
    const [title = `Source ${index + 1}`, author = "", date = "", sourceUrl = ""] = metadata.split("|").map((item) => item.trim());
    return { title: title || `Source ${index + 1}`, author, date, sourceUrl, excerpt: excerptLines.join("\n").trim(), rights: "Source supplied by the set creator" };
  }).filter((source) => source.excerpt);
}

function essaySourcesToText(sources) {
  return (sources || []).map((source, index) => `${source.title || `Source ${index + 1}`} | ${source.author || ""} | ${source.date || ""} | ${source.sourceUrl || ""}\n${source.excerpt || ""}`).join("\n\n---\n\n");
}

function updateManualEssayBuilder() {
  const type = $("#manual-question-type").value;
  const isEssay = type === "essay";
  const isChoice = isAnswerChoiceQuestion(type);
  if (type === "mcq" && manualQuestionCorrectChoiceIndexes.size !== 1) {
    manualQuestionCorrectChoiceIndexes = new Set([[...manualQuestionCorrectChoiceIndexes][0] ?? 0]);
  }
  $("#manual-essay-builder").hidden = !isEssay;
  $("#manual-question-answer-field").hidden = isChoice;
  $("#manual-question-choice-editor").hidden = !isChoice;
  $("#manual-question-options-field").hidden = isEssay || isChoice;
  $("#manual-question-stimulus-field").hidden = isEssay;
  $(".manual-question-extras").hidden = isChoice;
  $(".manual-question-extras summary").textContent = isEssay ? "Essay setup" : "Answer choices (optional)";
  if (isEssay) $(".manual-question-extras").open = true;
  if (isChoice) renderManualQuestionChoices();
}

function renderCustomQuestionDraft() {
  state.customQuestionDraft = state.customQuestionDraft.map((question) => normalizeEditableQuestionChoices(typedQuestionAsCloze(question)));
  $("#question-draft-count").textContent = state.customQuestionDraft.length;
  $("#question-tab-count").textContent = state.customQuestionDraft.length;
  $("#question-draft-empty").hidden = state.customQuestionDraft.length > 0;
  $("#question-draft-list").innerHTML = state.customQuestionDraft.map((question, index) => {
    const isChoice = isAnswerChoiceQuestion(question.type);
    const answerEditor = isChoice
      ? `<section class="question-choice-editor draft-question-answer" aria-label="Answer choices"><header><span>Answer choices</span><small>${question.type === "multiple_select" ? "Mark every correct answer" : "Choose one correct answer"}</small></header><div class="question-choice-list">${questionChoiceRowsHtml(question, index)}</div><button type="button" class="question-choice-add" data-add-question-choice="${index}">+ Add choice</button></section>`
      : `<label class="draft-question-answer">Answer<textarea data-question-answer="${index}">${escapeHtml(question.answer)}</textarea><span class="card-image-editor"><span class="card-image-actions"><button type="button" data-math-question-side="answer" data-question-tool-index="${index}">Math syntax</button><button type="button" data-code-question-side="answer" data-question-tool-index="${index}">Code</button></span></span></label>`;
    const optionsEditor = isChoice ? "" : `<label>Answer choices<textarea data-question-options="${index}" placeholder="One choice per line">${escapeHtml((question.options || []).join("\n"))}</textarea></label>`;
    const promptEditor = `<section class="draft-question-prompt"><label><span class="field-label-row"><span>Stimulus</span><small>Optional</small></span><textarea class="draft-question-stimulus" data-question-stimulus="${index}" placeholder="Passage, scenario, data, quotation, or source text">${escapeHtml(question.stimulus || "")}</textarea></label><label>Question<select class="question-type-select" data-question-type="${index}">${questionTypeSelectOptions(question.type)}</select><textarea data-question-prompt="${index}" placeholder="Text, code, math, or pasted image">${escapeHtml(question.prompt)}</textarea><span class="card-image-editor">${question.image ? `<img src="${escapeHtml(question.image)}" alt="Question image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-question-image="${index}">${question.image ? "Replace image" : "Add image"}</button><button type="button" data-draw-question="${index}">Draw</button><button type="button" data-math-question-side="question" data-question-tool-index="${index}">Math syntax</button><button type="button" data-code-question-side="question" data-question-tool-index="${index}">Code</button>${question.image ? `<button type="button" data-remove-question-image="${index}">Remove image</button>` : ""}</span></span></label></section>`;
    const extrasEditor = isChoice ? "" : `<details class="question-draft-extras"><summary>Answer choices (optional)</summary><div class="question-draft-extra-grid">${optionsEditor}</div></details>`;
    return `<div class="draft-card-row question-draft-row" data-question-draft="${index}"><span class="draft-card-number">${index + 1}</span>${promptEditor}${answerEditor}<button type="button" class="remove-draft-card" data-remove-question="${index}" aria-label="Remove question ${index + 1}">×</button>${extrasEditor}</div>`;
  }).join("");
  state.customQuestionDraft.forEach((question, index) => {
    if (question.type !== "essay") return;
    const details = $(`[data-question-draft="${index}"] .question-draft-extras`);
    details.querySelector("summary").textContent = "Essay setup";
    details.querySelector(".question-draft-extra-grid").innerHTML = `<label>Essay format<select data-question-essay-type="${index}"><option value="argument" ${question.essayType === "argument" ? "selected" : ""}>Argument</option><option value="rhetorical_analysis" ${question.essayType === "rhetorical_analysis" ? "selected" : ""}>Rhetorical analysis</option><option value="synthesis" ${question.essayType === "synthesis" ? "selected" : ""}>Synthesis</option><option value="literary_argument" ${question.essayType === "literary_argument" ? "selected" : ""}>Literary argument</option><option value="prose_analysis" ${question.essayType === "prose_analysis" ? "selected" : ""}>Prose analysis</option><option value="poetry_analysis" ${question.essayType === "poetry_analysis" ? "selected" : ""}>Poetry analysis</option><option value="drama_analysis" ${question.essayType === "drama_analysis" ? "selected" : ""}>Drama analysis</option></select></label><label>Suggested time<input type="number" min="1" max="180" value="${Math.max(1, Math.min(180, Number(question.recommendedMinutes) || 40))}" data-question-essay-minutes="${index}"></label><label class="question-draft-essay-sources">Source packet<textarea data-question-essay-sources="${index}" placeholder="Title | Author | Year | https://source.url&#10;Paste the source excerpt here.">${escapeHtml(essaySourcesToText(question.sources))}</textarea></label>`;
  });
  injectDraftTopicSelectors($("#question-draft-list"), state.customQuestionDraft);
  $$('[data-question-type]').forEach((input) => input.addEventListener("change", () => { state.customQuestionDraft[Number(input.dataset.questionType)].type = input.value; renderCustomQuestionDraft(); }));
  $$('[data-question-prompt]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionPrompt)].prompt = input.value; }));
  $$('[data-question-answer]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionAnswer)].answer = input.value; }));
  $$('[data-question-options]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionOptions)].options = questionOptionsFromText(input.value); }));
  $$('[data-question-choice-text]').forEach((input) => input.addEventListener("input", () => syncDraftQuestionChoices(Number(input.dataset.questionChoiceText))));
  $$('[data-question-choice-correct]').forEach((input) => input.addEventListener("change", () => syncDraftQuestionChoices(Number(input.dataset.questionChoiceCorrect))));
  $$('[data-add-question-choice]').forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.addQuestionChoice);
    syncDraftQuestionChoices(index);
    if (state.customQuestionDraft[index].options.length >= 8) { showToast("A question can have up to 8 answer choices."); return; }
    state.customQuestionDraft[index].options.push("");
    renderCustomQuestionDraft();
  }));
  $$('[data-remove-question-choice]').forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.removeQuestionChoice);
    const choiceIndex = Number(button.dataset.choiceIndex);
    syncDraftQuestionChoices(index);
    let question = state.customQuestionDraft[index];
    if (question.options.length <= 2) return;
    question.options.splice(choiceIndex, 1);
    question = normalizeEditableQuestionChoices(question);
    state.customQuestionDraft[index] = question;
    renderCustomQuestionDraft();
  }));
  $$('[data-question-stimulus]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionStimulus)].stimulus = input.value; }));
  $$('[data-question-essay-type]').forEach((input) => input.addEventListener("change", () => { state.customQuestionDraft[Number(input.dataset.questionEssayType)].essayType = input.value; }));
  $$('[data-question-essay-minutes]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionEssayMinutes)].recommendedMinutes = Math.max(1, Math.min(180, Number(input.value) || 40)); }));
  $$('[data-question-essay-sources]').forEach((input) => input.addEventListener("input", () => { state.customQuestionDraft[Number(input.dataset.questionEssaySources)].sources = essaySourcesFromText(input.value); }));
  $$('[data-question-prompt]').forEach((input) => input.addEventListener("paste", (event) => handleCardPaste(event, { kind: "question-draft", side: "question", index: Number(input.dataset.questionPrompt) })));
  $$('[data-choose-question-image]').forEach((button) => button.addEventListener("click", () => {
    state.pendingCardImageTarget = { kind: "question-draft", side: "question", index: Number(button.dataset.chooseQuestionImage) };
    $("#flashcard-image-file").click();
  }));
  $$('[data-draw-question]').forEach((button) => button.addEventListener("click", () => openDrawingTool({ kind: "question-draft", side: "question", index: Number(button.dataset.drawQuestion) })));
  $$('[data-math-question-side]').forEach((button) => button.addEventListener("click", () => openMathTool({ kind: "question-draft", side: button.dataset.mathQuestionSide, index: Number(button.dataset.questionToolIndex) })));
  $$('[data-code-question-side]').forEach((button) => button.addEventListener("click", () => openCodeTool({ kind: "question-draft", side: button.dataset.codeQuestionSide, index: Number(button.dataset.questionToolIndex) })));
  $$('[data-remove-question-image]').forEach((button) => button.addEventListener("click", () => confirmImageRemoval(button, () => applyCardImage({ kind: "question-draft", side: "question", index: Number(button.dataset.removeQuestionImage) }, ""))));
  $$('[data-remove-question]').forEach((button) => button.addEventListener("click", () => { state.customQuestionDraft.splice(Number(button.dataset.removeQuestion), 1); renderCustomQuestionDraft(); updateCustomSaveButtons(); }));
  updateCustomSaveButtons();
}

function renderCustomFeynmanDraft() {
  $("#feynman-draft-count").textContent = state.customFeynmanDraft.length;
  $("#feynman-tab-count").textContent = state.customFeynmanDraft.length;
  $("#feynman-draft-list").innerHTML = state.customFeynmanDraft.map((item, index) => `<div class="feynman-draft-row"><span class="draft-card-number">${index + 1}</span><input data-feynman-prompt="${index}" value="${escapeHtml(item.prompt)}" aria-label="Feynman prompt ${index + 1}"><button type="button" class="remove-draft-card" data-remove-feynman="${index}" aria-label="Remove Feynman prompt ${index + 1}">×</button></div>`).join("");
  injectDraftTopicSelectors($("#feynman-draft-list"), state.customFeynmanDraft);
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
    customTopicId: state.activeCustomTopicId || "",
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

function renderExtraColumnDraft(list, visibleRecords = state.customDraft.map((card, index) => ({ card, index }))) {
  const columns = state.customCharacteristicFields.filter((field) => field.name.trim());
  list.classList.add("extra-column-draft-list");
  list.innerHTML = visibleRecords.length
    ? `<div class="extra-column-table-wrap"><table class="extra-column-table"><thead><tr><th>#</th>${columns.map((field) => `<th>${escapeHtml(field.name)}</th>`).join("")}<th></th></tr></thead><tbody>${visibleRecords.map(({ card, index }) => `<tr data-draft-card="${index}"><td>${index + 1}</td>${columns.map((field) => `<td><input type="text" value="${escapeHtml(card.characteristics?.[field.name] || "")}" data-extra-column-card="${index}" data-extra-column-name="${escapeHtml(field.name)}" aria-label="${escapeHtml(field.name)} for item ${index + 1}"></td>`).join("")}<td><button type="button" class="remove-draft-card" data-remove-draft="${index}" aria-label="Remove item ${index + 1}">×</button></td></tr>`).join("")}</tbody></table></div>`
    : '<div class="draft-filter-empty"><strong>No flashcards in this view</strong><span>Choose another unit or subtopic to continue editing.</span></div>';
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
  renderCustomDraftViewControls();
  const visibleRecords = customDraftVisibleRecords();
  $("#draft-card-count").textContent = state.customDraft.length;
  $("#flashcard-tab-count").textContent = state.customDraft.length;
  $("#draft-view-count").textContent = `${visibleRecords.length.toLocaleString()} shown`;
  empty.hidden = state.customDraft.length > 0;
  updateCustomSaveButtons();
  if (state.cardMakerMode === "characteristics" && state.customDraft.some((card) => card.characteristicCard || card.characteristics)) {
    renderExtraColumnDraft(list, visibleRecords);
    return;
  }
  list.classList.remove("extra-column-draft-list");
  list.innerHTML = visibleRecords.length
    ? visibleRecords.map(({ card, index }) => `<div class="draft-card-row" data-draft-card="${index}"><span class="draft-card-number">${index + 1}</span><label>Front<textarea data-draft-front="${index}" placeholder="Text or pasted image">${escapeHtml(card.front || "")}</textarea><span class="card-image-editor">${card.frontImage ? `<img src="${card.frontImage}" alt="Front image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-draft-image="front" data-image-index="${index}">${card.frontImage ? "Replace image" : "Add image"}</button><button type="button" data-draw-draft="front" data-image-index="${index}">Draw</button><button type="button" data-math-draft="front" data-image-index="${index}">Math syntax</button><button type="button" data-code-draft="front" data-image-index="${index}">Code</button>${card.frontImage ? `<button type="button" data-remove-draft-image="front" data-image-index="${index}">Remove image</button>` : ""}</span></span></label><label>Back<textarea data-draft-back="${index}" placeholder="Text or pasted image">${escapeHtml(card.back || "")}</textarea><span class="card-image-editor">${card.backImage ? `<img src="${card.backImage}" alt="Back image preview">` : ""}<span class="card-image-actions"><button type="button" data-choose-draft-image="back" data-image-index="${index}">${card.backImage ? "Replace image" : "Add image"}</button><button type="button" data-draw-draft="back" data-image-index="${index}">Draw</button><button type="button" data-math-draft="back" data-image-index="${index}">Math syntax</button><button type="button" data-code-draft="back" data-image-index="${index}">Code</button>${card.backImage ? `<button type="button" data-remove-draft-image="back" data-image-index="${index}">Remove image</button>` : ""}</span></span></label><button type="button" class="remove-draft-card" data-remove-draft="${index}" aria-label="Remove card ${index + 1}">×</button></div>`).join("")
    : state.customDraft.length ? '<div class="draft-filter-empty"><strong>No flashcards in this view</strong><span>Choose another unit or subtopic to continue editing.</span></div>' : "";
  injectDraftTopicSelectors(list, state.customDraft);
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
  state.customUnits = [];
  state.activeCustomTopicId = "";
  state.draftViewUnitId = "";
  state.draftViewTopicId = "";
  state.customImportSource = null;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = null;
  state.appendNotesToExistingSet = false;
  state.notesHiddenAfterUpdate = false;
  state.manualFrontImage = "";
  state.manualBackImage = "";
  state.manualQuestionImage = "";
  state.extraColumnsOnly = false;
  state.customCharacteristicFields = defaultCharacteristicFields();
  state.pendingCardImageTarget = null;
  $("#custom-deck-name").value = "";
  setNotesContent();
  renderManualQuestionImagePreview();
  $("#notes-input").dataset.placeholder = "Paste class notes here. Bold text, highlights, headings, and bullet lists will be preserved.";
  $("#manual-card-front").value = "";
  $("#manual-card-back").value = "";
  renderManualDefinitionSuggestions();
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
  renderCustomUnitBuilder();
  selectCreateContentTab("flashcards");
}

function personalDeckMarkup(deck, folders) {
  const starred = isStudyItemStarred(`deck:${deck.id}`);
  const locked = isReadOnlyStudySet(deck);
  const editControl = locked ? "" : `<button type="button" class="deck-wrench" data-edit-custom="${deck.id}" aria-label="Edit ${escapeHtml(deck.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5l-7.5 7.5a2 2 0 1 0 2.8 2.8l7.5-7.5a4 4 0 0 0 5-5L18 8.6 15.6 6.2l2.1-2.1Z" /></svg></button>`;
  const actions = locked
    ? `<button type="button" data-study-custom="${deck.id}">Study</button><button type="button" data-duplicate-study-set="${deck.id}">Make a copy</button>${deck.communityItemId ? `<button type="button" data-review-community-set="${escapeHtml(deck.communityItemId)}">Review</button>` : ""}<button type="button" class="delete-custom-deck" data-delete-custom="${deck.id}">Delete</button>`
    : `<button type="button" data-study-custom="${deck.id}">Study</button><button type="button" data-edit-custom="${deck.id}">Edit</button><button type="button" data-duplicate-study-set="${deck.id}">Duplicate</button><button type="button" data-publish-study-set="${deck.id}">Publish</button><button type="button" class="delete-custom-deck" data-delete-custom="${deck.id}">Delete</button>`;
  return `<article class="custom-deck-item personal-deck-item draggable-study-set ${locked ? "read-only-study-set" : ""} ${starred ? "starred-study-item" : ""}" draggable="true" data-drag-deck="${deck.id}"><button type="button" class="study-item-star" data-toggle-study-star="deck:${deck.id}" aria-pressed="${starred}" aria-label="${starred ? "Unstar" : "Star"} ${escapeHtml(deck.name)}">${starred ? "★" : "☆"}</button>${editControl}<div class="built-in-deck-label">${locked ? "Community set" : "Personal set"}</div><h3>${escapeHtml(deck.name)}</h3><p>${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts</p><div class="custom-deck-actions">${actions}</div></article>`;
}

const builtInQuestionCountCache = new Map();

function builtInCollectionQuestionCount(collection) {
  if (!collection?.units?.length) return 0;
  if (builtInQuestionCountCache.has(collection.id)) return builtInQuestionCountCache.get(collection.id);
  const count = collection.units.reduce((total, unit) => total + (isApCourseCollection(collection)
    ? apSubtopicsForUnit(collection, unit).reduce((unitTotal, topic) => unitTotal + (topic.questions || []).length, 0)
    : (unit.questions || []).length), 0);
  builtInQuestionCountCache.set(collection.id, count);
  return count;
}

function builtInAddedDeckMarkup(collection, folders) {
  const starred = isStudyItemStarred(`deck:${collection.id}`);
  const summary = lazyBuiltInSources[collection.id];
  const unitCount = collection.units.length || summary?.unitCount || 0;
  const cardCount = collection.units.length ? collection.units.reduce((total, unit) => total + unit.cards.length, 0) : summary?.cardCount || 0;
  const questionCount = collection.units.length ? builtInCollectionQuestionCount(collection) : summary?.questionCount || 0;
  const feynmanCount = collection.units.length ? collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0) : summary?.feynmanCount || 0;
  return `<article class="custom-deck-item built-in-deck-item added-built-in-deck read-only-study-set draggable-study-set ${starred ? "starred-study-item" : ""}" draggable="true" data-drag-deck="${collection.id}"><button type="button" class="study-item-star" data-toggle-study-star="deck:${collection.id}" aria-pressed="${starred}" aria-label="${starred ? "Unstar" : "Star"} ${escapeHtml(collection.name)}">${starred ? "★" : "☆"}</button><div class="built-in-deck-label">Curated set · ${unitCount} ${collection.unitLabel || "units"}</div><h3>${escapeHtml(collection.name)}</h3><p>${cardCount} cards · ${questionCount} questions · ${feynmanCount} Feynman prompts</p><div class="custom-deck-actions"><button type="button" data-study-built-in-collection="${collection.id}">Study</button><button type="button" data-duplicate-study-set="${collection.id}">Make a copy</button><button type="button" class="remove-built-in-deck" data-delete-built-in-collection="${collection.id}">Delete</button></div></article>`;
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
  const dashboardSetCount = $("#dashboard-study-set-count");
  const dashboardSetDetail = $("#dashboard-study-set-detail");
  const totalStudySets = allDecks.length + allAddedCollections.length;
  if (dashboardSetCount) dashboardSetCount.textContent = `${totalStudySets} ${totalStudySets === 1 ? "set" : "sets"}`;
  if (dashboardSetDetail) dashboardSetDetail.textContent = totalStudySets ? "Open Study to continue" : "Add a set from Browse";
  const creatorMarkup = decks.length ? decks.map((deck) => personalDeckMarkup(deck, folders)).join("") : '<div class="custom-deck-empty">Your saved study sets will appear here.</div>';
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
  $$('[data-publish-study-set]').forEach((button) => button.addEventListener("click", () => publishStudySet(button.dataset.publishStudySet)));
  $$('[data-review-community-set]').forEach((button) => button.addEventListener("click", () => openSavedCommunityReview(button.dataset.reviewCommunitySet)));
  $$('[data-delete-custom]').forEach((button) => button.addEventListener("click", () => deleteCustomDeck(button.dataset.deleteCustom)));
  $$('[data-study-built-in-collection]').forEach((button) => button.addEventListener("click", () => openCustomStudyOptions(button.dataset.studyBuiltInCollection)));
  $$('[data-delete-built-in-collection]').forEach((button) => button.addEventListener("click", () => deleteBuiltInCollection(button.dataset.deleteBuiltInCollection)));
  $$('[data-toggle-study-star]').forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); toggleStudyItemStar(button.dataset.toggleStudyStar); }));
  $$('.custom-deck-item [data-toggle-anki-freeze]').forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); toggleAnkiDeckFreeze(button.dataset.toggleAnkiFreeze); }));
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
  const builtInCatalogCount = builtInFlashcardCollections.filter((collection) => !OFFICIAL_COMMUNITY_COLLECTION_IDS.has(collection.id)).length;
  $("#built-in-deck-count").textContent = `${builtInCatalogCount} ${builtInCatalogCount === 1 ? "deck" : "decks"}`;
  const returnAllButton = $("#return-all-built-in-decks");
  if (returnAllButton) returnAllButton.disabled = addedFlashcardCollectionIds().length === 0;
  const query = ($("#built-in-study-search")?.value || "").trim().toLowerCase();
  const apOnly = query === "ap" || query.startsWith("ap ");
  const matches = builtInFlashcardCollections.filter((collection) => {
    if (OFFICIAL_COMMUNITY_COLLECTION_IDS.has(collection.id)) return false;
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
    const questionCount = collection.units.length ? builtInCollectionQuestionCount(collection) : lazySummary?.questionCount || 0;
    const feynmanCount = collection.units.length ? collection.units.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0) : lazySummary?.feynmanCount || 0;
    const topicSummary = `${cardCount} flashcards · ${questionCount} questions · ${feynmanCount} Feynman prompts.`;
    const unitCount = collection.units.length || lazySummary?.unitCount || 0;
    return `<article class="custom-deck-item built-in-deck-item flashcard-catalog-item"><div class="flashcard-catalog-icon" aria-hidden="true">⌖</div><div class="flashcard-catalog-copy"><div class="built-in-deck-label">${escapeHtml(collection.catalogLabel || "AP course")} · ${unitCount} ${escapeHtml(collection.unitLabel || "units")}</div><h3>${escapeHtml(collection.name)}</h3><p>${topicSummary} ${escapeHtml(collection.description)}</p></div><div class="catalog-card-actions"><button type="button" class="button secondary-button" data-preview-built-in="${collection.id}">Preview</button><button type="button" class="button course-add" data-add-flashcard-collection="${collection.id}" ${added ? "disabled" : ""}>${added ? "Added" : "Add study deck"}</button></div></article>`;
  }).join("") || '<div class="custom-deck-empty">No curated study decks match that search.</div>';
  $$('[data-add-flashcard-collection]').forEach((button) => button.addEventListener("click", () => addFlashcardCollection(button.dataset.addFlashcardCollection)));
  $$('[data-preview-built-in]').forEach((button) => button.addEventListener("click", () => previewBuiltInCollection(button.dataset.previewBuiltIn)));
  renderLibraryPagination("#study-catalog-pagination", state.studyCatalogPage, matches.length, STUDY_DECKS_PER_PAGE, (page) => {
    state.studyCatalogPage = page;
    renderBuiltInDecks();
  });
}

let communityLoadRevision = 0;

function communityContentLabel(kind) {
  return kind === "note" ? "Note" : "Study set";
}

function ratingMarkup(item) {
  const rating = Number(item.rating?.average ?? item.rating);
  const count = Number(item.rating?.count) || 0;
  if (count < 5 || !Number.isFinite(rating) || rating <= 0) {
    const message = count ? `${count} ${count === 1 ? "review" : "reviews"} · score shown after 5` : "Rating shown after 5 reviews";
    return `<div class="community-rating community-rating-pending"><small>${message}</small></div>`;
  }
  const context = item.official ? "" : `${count} ${count === 1 ? "review" : "reviews"}`;
  return `<div class="community-rating" aria-label="${rating.toFixed(1)} out of 5"><span aria-hidden="true">★★★★★</span><strong>${rating.toFixed(1)}/5</strong><small>${context}</small></div>`;
}

function communityRelevance(item, query) {
  if (!query) return 0;
  const title = String(item.title || "").toLowerCase();
  const summary = String(item.summary || "").toLowerCase();
  const username = String(item.author?.username || "").toLowerCase();
  const displayName = String(item.author?.displayName || "").toLowerCase();
  let score = 0;
  if (title === query) score += 100;
  else if (title.startsWith(query)) score += 70;
  else if (title.includes(query)) score += 45;
  if (summary.includes(query)) score += 18;
  if (username.includes(query) || displayName.includes(query)) score += 12;
  return score;
}

function sortedCommunityItems(items) {
  const query = $("#community-search").value.trim().toLowerCase();
  return [...items].sort((a, b) => {
    if (state.communitySort === "rating") {
      const aRating = Number(a.rating?.count) >= 5 ? Number(a.rating?.average) || 0 : -1;
      const bRating = Number(b.rating?.count) >= 5 ? Number(b.rating?.average) || 0 : -1;
      return bRating - aRating || (Number(b.rating?.count) || 0) - (Number(a.rating?.count) || 0) || (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
    }
    if (state.communitySort === "new") return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
    if (state.communitySort === "adds") return (Number(b.addCount) || 0) - (Number(a.addCount) || 0) || (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
    return communityRelevance(b, query) - communityRelevance(a, query) || (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
  });
}

function officialCommunityItems(query = "", respectKind = true) {
  if (respectKind && state.communityKind === "note") return [];
  return OFFICIAL_COMMUNITY_COLLECTIONS.map((official) => {
    const collection = builtInFlashcardCollections.find((item) => item.id === official.collectionId);
    const summary = lazyBuiltInSources[official.collectionId] || {};
    const loadedUnits = collection?.units || [];
    const counts = loadedUnits.length ? {
      cards: loadedUnits.reduce((total, unit) => total + (unit.cards || []).length, 0),
      questions: collection ? builtInCollectionQuestionCount(collection) : loadedUnits.reduce((total, unit) => total + (unit.questions || []).length, 0),
      feynmanPrompts: loadedUnits.reduce((total, unit) => total + (unit.feynmanPrompts || []).length, 0),
    } : {
      cards: summary.cardCount || 0,
      questions: summary.questionCount || 0,
      feynmanPrompts: summary.feynmanCount || 0,
    };
    return {
      ...official,
      rating: curatedCommunityRating(official),
      kind: "study_set",
      official: true,
      title: collection?.name || official.collectionId.toUpperCase(),
      summary: collection?.description || "Exam-preparation collection.",
      author: official.author || { displayName: "Your Study Buddy", username: "yourstudybuddy" },
      counts,
      addCount: Number(official.addCount) || 0,
      updatedAt: 0,
    };
  }).filter((item) => !query || `${item.title} ${item.summary} ${item.author.username}`.toLowerCase().includes(query));
}

function communityItemIsSaved(item) {
  if (!item) return false;
  const collectionId = item.builtInCollectionId || item.collectionId;
  if (item.official || collectionId) return Boolean(collectionId && isFlashcardCollectionAdded(collectionId));
  return localStorage.getItem(`your-study-buddy-community-saved:${item.id}`) === "1"
    || localStorage.getItem(`your-study-buddy-community-add:${item.id}`) === "1";
}

function renderCommunityLibrary() {
  const list = $("#community-library-list");
  if (!list) return;
  const items = sortedCommunityItems(state.communityItems);
  $("#community-sort").value = state.communitySort;
  $$('[data-community-kind]').forEach((button) => button.classList.toggle("active", button.dataset.communityKind === state.communityKind));
  if (state.communityLoading) {
    list.innerHTML = '<div class="custom-deck-empty">Loading published study material…</div>';
    return;
  }
  if (state.communityError) {
    list.innerHTML = `<div class="custom-deck-empty">${escapeHtml(state.communityError)}</div>`;
    return;
  }
  list.innerHTML = items.map((item) => {
    const counts = item.counts || {};
    const details = item.kind === "note"
      ? escapeHtml(item.summary || "Shared note")
      : `${Number(counts.cards) || 0} cards · ${Number(counts.questions) || 0} questions · ${Number(counts.feynmanPrompts) || 0} Feynman prompts`;
    const addCount = Number(item.addCount) || 0;
    const saved = communityItemIsSaved(item);
    const saveLabel = saved ? (item.kind === "note" ? "Saved" : "Added") : (item.kind === "note" ? "Save note" : "Add to Study");
    const authorName = escapeHtml(item.author?.displayName || "Student");
    const authorUsername = escapeHtml(item.author?.username || "student");
    const sourceLabel = item.official ? `${communityContentLabel(item.kind)} · Starter collection` : communityContentLabel(item.kind);
    return `<article class="custom-deck-item community-item-card ${item.official ? "community-starter-card" : ""}"><div class="built-in-deck-label">${sourceLabel}</div><h3>${escapeHtml(item.title)}</h3>${ratingMarkup(item)}<p>${details}</p><div class="community-card-meta"><div class="community-author"><span>by</span><button type="button" data-open-community-profile="${authorUsername}" aria-label="View ${authorName}'s profile"><strong>${authorName}</strong><span>@${authorUsername}</span></button></div><span class="community-add-count">${addCount.toLocaleString()} ${addCount === 1 ? "save" : "saves"}</span></div><div class="community-card-actions"><button type="button" class="button secondary-button" data-preview-community-item="${escapeHtml(item.id)}">Preview</button><button type="button" class="button primary-button ${saved ? "community-added-button" : ""}" data-save-community-item="${escapeHtml(item.id)}" ${saved ? "disabled" : ""}>${saveLabel}</button></div></article>`;
  }).join("") || '<div class="custom-deck-empty">No published items match this search yet.</div>';
  $$('[data-save-community-item]', list).forEach((button) => button.addEventListener("click", () => saveCommunityItem(button.dataset.saveCommunityItem)));
  $$('[data-preview-community-item]', list).forEach((button) => button.addEventListener("click", () => previewCommunityItem(button.dataset.previewCommunityItem)));
  $$('[data-open-community-profile]', list).forEach((button) => button.addEventListener("click", () => openCommunityProfile(button.dataset.openCommunityProfile)));
}

function communityProfileItemMarkup(item) {
  const counts = item.counts || {};
  const details = item.kind === "note"
    ? escapeHtml(item.summary || "Shared note")
    : `${Number(counts.cards) || 0} cards · ${Number(counts.questions) || 0} questions · ${Number(counts.feynmanPrompts) || 0} Feynman prompts`;
  const saves = Number(item.addCount) || 0;
  const rating = Number(item.rating?.average ?? item.rating);
  const ratingCount = Number(item.rating?.count) || 0;
  const ratingText = ratingCount >= 5 && Number.isFinite(rating) ? `★ ${rating.toFixed(1)}` : "New";
  return `<article class="community-profile-item"><div class="community-profile-item-top"><span>${communityContentLabel(item.kind)}</span><small>${ratingText}</small></div><div class="community-profile-item-copy"><h3 title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3><p>${details}</p></div><div class="community-profile-item-meta"><small>${saves.toLocaleString()} ${saves === 1 ? "save" : "saves"}</small><button type="button" class="button secondary-button" data-preview-profile-item="${escapeHtml(item.id)}">Preview</button></div></article>`;
}

function renderCommunityProfile(profile, items = [], options = {}) {
  const dialog = $("#community-profile-dialog");
  const displayName = profile?.displayName || "Student";
  const username = profile?.username || "student";
  const isPrivate = profile?.public === false;
  const totalCards = items.reduce((total, item) => total + (Number(item.counts?.cards) || 0), 0);
  const totalSaves = items.reduce((total, item) => total + (Number(item.addCount) || 0), 0);
  state.communityProfileItems = items;
  $("#community-profile-avatar").textContent = Array.from(displayName)[0]?.toUpperCase() || "S";
  $("#community-profile-name").textContent = displayName;
  $("#community-profile-username").textContent = `@${username}`;
  $("#community-profile-badge").textContent = options.seeded ? "Curated contributor" : isPrivate ? "Private profile" : "Public profile";
  $("#community-profile-published-count").textContent = isPrivate ? "—" : items.length.toLocaleString();
  $("#community-profile-card-count").textContent = isPrivate ? "—" : totalCards.toLocaleString();
  $("#community-profile-save-count").textContent = isPrivate ? "—" : totalSaves.toLocaleString();
  $("#community-profile-summary").textContent = options.loading
    ? "Loading published study material…"
    : isPrivate
      ? "This creator keeps their profile private. Their individually published items can still appear in Community."
      : items.length ? "Browse this creator’s published study material." : "No published study material yet.";
  $("#community-profile-items").innerHTML = options.loading
    ? '<div class="custom-deck-empty">Loading profile…</div>'
    : isPrivate
      ? '<div class="custom-deck-empty">This profile and its publication list are private.</div>'
      : items.map(communityProfileItemMarkup).join("") || '<div class="custom-deck-empty">This creator has no public items yet.</div>';
  $$('[data-preview-profile-item]', $("#community-profile-items")).forEach((button) => button.addEventListener("click", () => previewProfileCommunityItem(button.dataset.previewProfileItem)));
  if (!dialog.open) dialog.showModal();
}

async function openCommunityProfile(username) {
  const normalized = String(username || "").trim().toLowerCase();
  if (!normalized) return;
  const seededItems = officialCommunityItems("", false).filter((item) => item.author?.username === normalized);
  if (seededItems.length) {
    renderCommunityProfile({ ...seededItems[0].author, public: true }, seededItems, { seeded: true });
    return;
  }
  renderCommunityProfile({ displayName: "Loading…", username: normalized, public: true }, [], { loading: true });
  try {
    const response = await fetch(`/api/community/profiles/${encodeURIComponent(normalized)}`, { credentials: "same-origin", headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This profile could not be opened");
    renderCommunityProfile(result.profile, Array.isArray(result.items) ? result.items : []);
  } catch (error) {
    $("#community-profile-dialog").close();
    showToast(error.message || "This profile could not be opened.");
  }
}

async function previewProfileCommunityItem(itemId) {
  const item = state.communityProfileItems.find((candidate) => candidate.id === itemId);
  if (!item) return;
  $("#community-profile-dialog").close();
  if (item.official) {
    try {
      await ensureBuiltInCollectionLoaded(item.collectionId);
      const collection = getBuiltInCollection(item.collectionId);
      openDeckPreview({ ...item, builtInCollectionId: item.collectionId, payload: previewDeckFromCollection(collection), reviews: [] });
    } catch (error) { showToast(error.message || "This preview could not be opened."); }
    return;
  }
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}`, { headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This preview could not be opened");
    openDeckPreview({ ...result.item, community: true });
  } catch (error) { showToast(error.message || "This preview could not be opened."); }
}

async function loadCommunityLibrary() {
  const list = $("#community-library-list");
  if (!list) return;
  state.communityLoading = true;
  state.communityError = "";
  const revision = ++communityLoadRevision;
  renderCommunityLibrary();
  const query = $("#community-search").value.trim().toLowerCase();
  const officialItems = officialCommunityItems(query);
  if (!hostedGoogleSignInAvailable()) {
    state.communityItems = officialItems;
    state.communityLoading = false;
    renderCommunityLibrary();
    return;
  }
  const params = new URLSearchParams();
  if (state.communityKind !== "all") params.set("kind", state.communityKind);
  if (query) params.set("q", query);
  try {
    const response = await fetch(`/api/community/items?${params}`, { headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Community library could not load");
    if (revision !== communityLoadRevision) return;
    state.communityItems = [...officialItems, ...(Array.isArray(result.items) ? result.items : [])];
  } catch (error) {
    if (revision !== communityLoadRevision) return;
    state.communityItems = [];
    state.communityError = error.message || "Community library could not load.";
  } finally {
    if (revision !== communityLoadRevision) return;
    state.communityLoading = false;
    renderCommunityLibrary();
  }
}

function renderMyPublicLibrary() {
  const list = $("#my-public-library-list");
  if (!list) return;
  const items = state.myPublishedItems.filter((item) => state.myPublicKind === "all" || item.kind === state.myPublicKind);
  $$('[data-my-public-kind]').forEach((button) => button.classList.toggle("active", button.dataset.myPublicKind === state.myPublicKind));
  if (!accountSetupComplete(state.googleAccount)) {
    list.innerHTML = '<div class="custom-deck-empty my-public-login"><strong>Log in to view your public library</strong><span>Your published study sets and notes are tied to your Google account.</span><button type="button" class="button primary-button" data-open-my-public-login>Log in</button></div>';
    $('[data-open-my-public-login]', list)?.addEventListener("click", openAccountDialog);
    return;
  }
  if (state.myPublishedLoading) {
    list.innerHTML = '<div class="custom-deck-empty">Loading your public study material…</div>';
    return;
  }
  if (state.myPublishedError) {
    list.innerHTML = `<div class="custom-deck-empty">${escapeHtml(state.myPublishedError)}</div>`;
    return;
  }
  list.innerHTML = items.map((item) => {
    const counts = item.counts || {};
    const details = item.kind === "note"
      ? escapeHtml(item.summary || "Shared note")
      : `${Number(counts.cards) || 0} cards · ${Number(counts.questions) || 0} questions · ${Number(counts.feynmanPrompts) || 0} Feynman prompts`;
    const addCount = Number(item.addCount) || 0;
    const updated = Number(item.updatedAt) ? new Date(Number(item.updatedAt)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recently";
    return `<article class="custom-deck-item community-item-card"><div class="community-card-meta"><div class="built-in-deck-label">${communityContentLabel(item.kind)}</div><span class="my-public-status">Public</span></div><h3>${escapeHtml(item.title)}</h3>${ratingMarkup(item)}<p>${details}</p><div class="community-card-meta"><span class="my-public-updated">Updated ${escapeHtml(updated)}</span><span class="community-add-count">${addCount.toLocaleString()} ${addCount === 1 ? "save" : "saves"}</span></div><div class="community-card-actions"><button type="button" class="button secondary-button" data-preview-my-public-item="${escapeHtml(item.id)}">Preview public version</button><button type="button" class="button danger-text-button" data-unpublish-item="${escapeHtml(item.id)}">Unpublish</button></div></article>`;
  }).join("") || '<div class="custom-deck-empty">You have not published anything in this category yet. Publish a study set from Study or a note from Notes.</div>';
  $$('[data-preview-my-public-item]', list).forEach((button) => button.addEventListener("click", () => previewMyPublishedItem(button.dataset.previewMyPublicItem)));
  $$('[data-unpublish-item]', list).forEach((button) => button.addEventListener("click", () => unpublishCommunityItem(button.dataset.unpublishItem)));
}

async function loadMyPublicLibrary() {
  if (!accountSetupComplete(state.googleAccount)) {
    state.myPublishedItems = [];
    state.myPublishedLoading = false;
    state.myPublishedError = "";
    renderMyPublicLibrary();
    return;
  }
  state.myPublishedLoading = true;
  state.myPublishedError = "";
  renderMyPublicLibrary();
  try {
    const response = await fetch("/api/community/mine", { credentials: "same-origin", headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your public library could not load");
    state.myPublishedItems = Array.isArray(result.items) ? result.items : [];
  } catch (error) {
    state.myPublishedItems = [];
    state.myPublishedError = error.message || "Your public library could not load.";
  } finally {
    state.myPublishedLoading = false;
    renderMyPublicLibrary();
  }
}

async function previewMyPublishedItem(itemId) {
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}`, { headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This public item could not be opened");
    openDeckPreview({ ...result.item, community: true, owner: true });
  } catch (error) {
    showToast(error.message || "This public item could not be opened.");
  }
}

async function unpublishCommunityItem(itemId) {
  const item = state.myPublishedItems.find((candidate) => candidate.id === itemId);
  if (!item || !await window.AppDialog.confirm(`Unpublish “${item.title}”? It will disappear from Community, but your original copy will stay on this device.`, { title: "Unpublish item?", confirmLabel: "Unpublish", danger: true })) return;
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}`, { method: "DELETE", credentials: "same-origin", headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This item could not be unpublished");
    state.myPublishedItems = state.myPublishedItems.filter((candidate) => candidate.id !== itemId);
    state.communityItems = state.communityItems.filter((candidate) => candidate.id !== itemId);
    renderMyPublicLibrary();
    showToast(`“${item.title}” is no longer public.`);
  } catch (error) {
    showToast(error.message || "This item could not be unpublished.");
  }
}

function importedCommunityStudySet(payload, title, communityItemId = "") {
  const cards = Array.isArray(payload?.cards) ? payload.cards : [];
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];
  const feynmanPrompts = Array.isArray(payload?.feynmanPrompts) ? payload.feynmanPrompts : [];
  if (!cards.length && !questions.length && !feynmanPrompts.length) throw new Error("This published study set is empty.");
  const decks = loadCustomDecks();
  const deck = {
    id: makeLocalId("deck"),
    name: copyLabel(String(title || payload.name || "Community study set").slice(0, 80), new Set(decks.map((item) => String(item.name || "").toLowerCase()))),
    cards: cards.map((item) => ({ ...item, id: makeLocalId("card"), importedSchedule: undefined, importedReviews: undefined })),
    questions: questions.map((item) => ({ ...item, id: makeLocalId("question") })),
    feynmanPrompts: feynmanPrompts.map((item) => ({ ...item, id: makeLocalId("feynman") })),
    units: normalizedCustomUnits(payload.units),
    readOnlySource: "community",
    communityItemId,
    sourceNotes: "",
    sourceNotesHtml: "",
    sourceImport: null,
    generatorVersion: NOTES_GENERATOR_VERSION,
    characteristicTemplate: [],
    updatedAt: Date.now(),
  };
  decks.unshift(deck);
  if (!storeCustomDecks(decks)) throw new Error("This study set is too large to save on this device.");
  renderCustomDecks();
  return deck;
}

function importedCommunityNote(payload, title) {
  const source = payload?.note;
  if (!source || !["drawing", "word"].includes(source.type)) throw new Error("This published note format is not supported.");
  const notes = loadNotebookNotes();
  const note = JSON.parse(JSON.stringify(source));
  note.id = makeLocalId("note");
  note.title = copyLabel(String(title || source.title || "Community note").slice(0, 100), new Set(notes.map((item) => String(item.title || "").toLowerCase())));
  note.folderId = null;
  note.updatedAt = Date.now();
  delete note.pdfAssetId;
  delete note.sourceFileName;
  if (note.type === "word") note.html = sanitizeNotesHtml(note.html || "");
  note.pageDocumentContent = sanitizeNotesHtml(note.pageDocumentContent || "");
  if (Array.isArray(note.documentPages)) note.documentPages = note.documentPages.map((page) => sanitizeNotesHtml(page || ""));
  notes.unshift(note);
  saveNotebookNotes(notes);
  renderNotesList();
  return note;
}

async function recordCommunityAdd(itemId) {
  const account = state.googleAccount;
  if (!accountSetupComplete(account)) return;
  const accountKey = String(account.id || account.username || "account").replace(/[^a-z0-9_-]/gi, "_");
  const storageKey = `your-study-buddy-community-add:${accountKey}:${itemId}`;
  try {
    if (localStorage.getItem(storageKey)) return;
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}/add`, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const result = await response.json().catch(() => ({}));
    localStorage.setItem(storageKey, "1");
    const listed = state.communityItems.find((item) => item.id === itemId);
    if (listed) listed.addCount = Number(result.addCount) || (Number(listed.addCount) || 0) + 1;
    if (state.previewItem?.id === itemId) state.previewItem.addCount = Number(result.addCount) || (Number(state.previewItem.addCount) || 0) + 1;
    renderCommunityLibrary();
  } catch (_) {
    // Saving the local copy still succeeds when the popularity counter is unavailable.
  }
}

async function syncCommunitySavesToAccount() {
  if (!accountSetupComplete(state.googleAccount)) return;
  const itemIds = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    if (key.startsWith("your-study-buddy-community-saved:") && localStorage.getItem(key) === "1") {
      itemIds.push(key.slice("your-study-buddy-community-saved:".length));
    }
  }
  for (const itemId of itemIds) await recordCommunityAdd(itemId);
}

async function saveCommunityItem(itemId) {
  const official = OFFICIAL_COMMUNITY_COLLECTIONS.find((item) => item.id === itemId);
  if (official) {
    await addFlashcardCollection(official.collectionId);
    renderCommunityLibrary();
    return;
  }
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}`, { headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This published item could not be opened");
    if (result.item.kind === "note") {
      const note = importedCommunityNote(result.item.payload, result.item.title);
      localStorage.setItem(`your-study-buddy-community-saved:${itemId}`, "1");
      await recordCommunityAdd(itemId);
      showToast(`“${note.title}” was saved to Notes.`);
    } else {
      const deck = importedCommunityStudySet(result.item.payload, result.item.title, itemId);
      localStorage.setItem(`your-study-buddy-community-saved:${itemId}`, "1");
      await recordCommunityAdd(itemId);
      showToast(`“${deck.name}” was added to Study.`);
    }
    renderCommunityLibrary();
  } catch (error) {
    showToast(error.message || "This published item could not be saved.");
  }
}

function previewDeckFromCollection(collection) {
  const effective = effectiveBuiltInCollection(collection);
  return {
    cards: effective.units.flatMap((unit) => unit.cards || []),
    questions: effective.units.flatMap((unit) => isApCourseCollection(effective)
      ? apSubtopicsForUnit(effective, unit).flatMap((topic) => topic.questions || [])
      : (unit.questions || [])),
    feynmanPrompts: effective.units.flatMap((unit) => unit.feynmanPrompts || []),
  };
}

function previewItemText(value) {
  return escapeHtml(String(value || "").trim());
}

function previewItemImage(value, alt, credit, sourceUrl) {
  const image = safeQuestionResourceUrl(value);
  if (!image) return "";
  const source = safeQuestionResourceUrl(sourceUrl);
  const creditText = String(credit || "").trim();
  const caption = creditText
    ? (source
      ? `<figcaption><a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Image: ${escapeHtml(creditText)}</a></figcaption>`
      : `<figcaption>Image: ${escapeHtml(creditText)}</figcaption>`)
    : "";
  return `<figure class="deck-preview-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(alt || "Study diagram")}" loading="lazy">${caption}</figure>`;
}

function renderDeckPreview() {
  const item = state.previewItem;
  if (!item) return;
  $("#deck-preview-title").textContent = item.title || "Preview";
  $("#deck-preview-source").textContent = item.community || item.official ? `Community ${communityContentLabel(item.kind).toLowerCase()}` : "Curated study set";
  $("#deck-preview-rating").innerHTML = item.community || item.official ? ratingMarkup(item) : "";
  const tabs = $(".deck-preview-tabs");
  tabs.hidden = item.kind === "note";
  $$('[data-preview-tab]').forEach((button) => button.classList.toggle("active", button.dataset.previewTab === state.previewTab));
  const payload = item.payload || {};
  let records = [];
  if (item.kind === "note") {
    records = [{ label: "Note preview", primary: item.summary || "Shared note", secondary: "Save a copy to open and edit the complete note." }];
  } else if (state.previewTab === "questions") {
    records = (payload.questions || []).map((question) => question.type === "essay"
      ? { label: essayTypeLabel(question.essayType), primary: question.title || "Essay prompt", secondary: question.prompt }
      : { label: "Question", primary: question.prompt, secondary: question.answer ? `Answer: ${question.answer}` : (question.options || []).join(" · "), image: question.image, imageAlt: question.imageAlt || `Diagram for ${question.prompt || "question"}`, imageCredit: question.imageCredit, imageSourceUrl: question.imageSourceUrl });
  } else if (state.previewTab === "feynman") {
    records = (payload.feynmanPrompts || []).map((prompt) => ({ label: "Feynman prompt", primary: prompt.prompt || prompt.front, secondary: "Explain this topic in your own words." }));
  } else {
    records = (payload.cards || []).map((card) => ({ label: "Flashcard", primary: card.front, secondary: card.back, frontImage: card.frontImage, image: card.backImage, imageAlt: `Structure or diagram for ${card.front || "flashcard"}`, imageCredit: card.imageCredit, imageSourceUrl: card.imageSourceUrl }));
  }
  const shown = records.slice(0, 100);
  $("#deck-preview-scroll").innerHTML = shown.length ? `${shown.map((record) => `<article class="deck-preview-item"><span>${previewItemText(record.label)}</span>${previewItemImage(record.frontImage, `Front image for ${record.primary || "flashcard"}`, record.imageCredit, record.imageSourceUrl)}<strong>${previewItemText(record.primary) || "Visual study item"}</strong>${record.secondary ? `<p>${previewItemText(record.secondary)}</p>` : ""}${previewItemImage(record.image, record.imageAlt, record.imageCredit, record.imageSourceUrl)}</article>`).join("")}${records.length > shown.length ? `<div class="custom-deck-empty">Showing the first ${shown.length} of ${records.length} items.</div>` : ""}` : '<div class="custom-deck-empty">This section has no items to preview.</div>';
  const saveButton = $("#save-previewed-deck");
  const saved = communityItemIsSaved(item);
  saveButton.textContent = saved ? (item.kind === "note" ? "Saved" : "Added") : (item.kind === "note" ? "Save note" : "Add to Study");
  saveButton.disabled = saved;
  saveButton.classList.toggle("community-added-button", saved);
  const feedback = $("#community-feedback");
  feedback.hidden = !item.community || item.official || item.owner;
  const reviewForm = $("#community-review-form");
  const canReview = Boolean(item.community && !item.official && !item.owner && saved);
  reviewForm.hidden = !canReview;
  $(".community-feedback-grid", feedback)?.classList.toggle("single-panel", !canReview);
  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  $("#community-review-list").innerHTML = reviews.length ? `<h3>Recent ratings</h3>${reviews.map((review) => { const stars = Math.max(1, Math.min(5, Number(review.rating) || 1)); return `<article class="community-review-entry" aria-label="${stars} out of 5 stars"><span aria-hidden="true">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</span></article>`; }).join("")}` : '<div class="custom-deck-empty">No ratings yet.</div>';
}

function openDeckPreview(item) {
  state.previewItem = item;
  state.previewTab = "cards";
  $("#community-review-form").reset();
  $("#community-report-form").reset();
  renderDeckPreview();
  $("#deck-preview-dialog").showModal();
}

async function previewBuiltInCollection(collectionId) {
  try {
    await ensureBuiltInCollectionLoaded(collectionId);
    const collection = getBuiltInCollection(collectionId);
    if (!collection) throw new Error("This deck could not be found.");
    openDeckPreview({ id: `built-in:${collectionId}`, title: collection.name, kind: "study_set", builtInCollectionId: collectionId, payload: previewDeckFromCollection(collection) });
  } catch (error) {
    showToast(error.message || "This preview could not be opened.");
  }
}

async function previewCommunityItem(itemId) {
  const summary = state.communityItems.find((item) => item.id === itemId);
  if (!summary) return;
  if (summary.official) {
    try {
      await ensureBuiltInCollectionLoaded(summary.collectionId);
      const collection = getBuiltInCollection(summary.collectionId);
      openDeckPreview({ ...summary, builtInCollectionId: summary.collectionId, payload: previewDeckFromCollection(collection), reviews: [] });
    } catch (error) {
      showToast(error.message || "This preview could not be opened.");
    }
    return;
  }
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}`, { headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This preview could not be opened");
    openDeckPreview({ ...result.item, community: true });
  } catch (error) {
    showToast(error.message || "This preview could not be opened.");
  }
}

async function openSavedCommunityReview(itemId) {
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(itemId)}`, { headers: { Accept: "application/json" } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This community set could not be opened");
    openDeckPreview({ ...result.item, community: true });
  } catch (error) {
    showToast(error.message || "This community set could not be opened.");
  }
}

async function submitCommunityReview(event) {
  event.preventDefault();
  const item = state.previewItem;
  if (!item?.community || item.official || !publishingAccountReady()) return;
  if (!communityItemIsSaved(item)) { showToast("Save this item before rating it."); return; }
  const rating = Number(new FormData(event.currentTarget).get("communityRating"));
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(item.id)}/review`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your review could not be saved");
    item.rating = result.rating;
    item.reviews = result.reviews || item.reviews;
    const listed = state.communityItems.find((candidate) => candidate.id === item.id);
    if (listed) listed.rating = result.rating;
    event.currentTarget.reset();
    renderDeckPreview();
    renderCommunityLibrary();
    showToast("Your rating was saved.");
  } catch (error) {
    showToast(error.message || "Your review could not be saved.");
  }
}

async function submitCommunityReport(event) {
  event.preventDefault();
  const item = state.previewItem;
  if (!item?.community || item.official || !publishingAccountReady()) return;
  const reason = $("#community-report-reason").value;
  const details = $("#community-report-details").value.trim();
  try {
    const response = await fetch(`/api/community/items/${encodeURIComponent(item.id)}/report`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your report could not be submitted");
    event.currentTarget.reset();
    if (result.removed) {
      state.communityItems = state.communityItems.filter((candidate) => candidate.id !== item.id);
      $("#deck-preview-dialog").close();
      renderCommunityLibrary();
      showToast("Report submitted. This publication reached the safety threshold and was removed from Community.");
    } else showToast("Report submitted. Thank you for helping keep Community useful.");
  } catch (error) {
    showToast(error.message || "Your report could not be submitted.");
  }
}

function publishingAccountReady() {
  if (accountSetupComplete(state.googleAccount)) return true;
  openAccountDialog();
  showToast(state.googleAccount ? "Finish your profile before publishing." : "Log in with Google before publishing.");
  return false;
}

let pendingCommunityPublish = null;

function publishCommunityItem({ kind, sourceId, title, summary, payload }) {
  if (!publishingAccountReady()) return false;
  const payloadSize = new Blob([JSON.stringify(payload)]).size;
  if (payloadSize > 700000) {
    showToast("This item is too large to publish. Remove some large pasted images and try again.");
    return false;
  }
  pendingCommunityPublish = { kind, sourceId, title, summary, payload };
  $("#publish-dialog-title").textContent = `Publish “${title}”`;
  $("#publish-description").value = "";
  $("#publish-description-count").textContent = "0 / 280";
  $("#publish-dialog").showModal();
  window.setTimeout(() => $("#publish-description").focus(), 0);
  return true;
}

async function submitCommunityPublication(event) {
  event.preventDefault();
  if (!pendingCommunityPublish) return;
  const publication = pendingCommunityPublish;
  const description = $("#publish-description").value.trim();
  if (description.length > 280) {
    showToast("Keep the description at 280 characters or fewer.");
    return;
  }
  const submitButton = $("#confirm-publish");
  submitButton.disabled = true;
  submitButton.textContent = "Publishing…";
  try {
    const response = await fetch("/api/community/publish", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...publication, summary: description || publication.summary }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "This item could not be published");
    $("#publish-dialog").close();
    pendingCommunityPublish = null;
    showToast(`“${publication.title}” is now published in Community.`);
    if (state.browseLibraryView === "mine") loadMyPublicLibrary();
    return true;
  } catch (error) {
    showToast(error.message || "This item could not be published.");
    return false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Publish publicly";
  }
}

function closePublishDialog() {
  $("#publish-dialog").close();
  pendingCommunityPublish = null;
}

function publicStudySetPayload(deck) {
  return {
    version: 1,
    name: deck.name,
    units: normalizedCustomUnits(deck.units),
    cards: (deck.cards || []).map(({ importedSchedule, importedReviews, sourceDeckId, ...card }) => card),
    questions: (deck.questions || []).map(({ sourceDeckId, ...question }) => question),
    feynmanPrompts: (deck.feynmanPrompts || []).map(({ sourceDeckId, ...prompt }) => prompt),
  };
}

function publishStudySet(deckId) {
  const deck = loadCustomDecks().find((item) => item.id === deckId);
  if (!deck) return;
  if (isReadOnlyStudySet(deck)) { showToast("Make a copy before publishing this community set."); return; }
  const summary = `${deck.cards.length} cards · ${(deck.questions || []).length} questions · ${(deck.feynmanPrompts || []).length} Feynman prompts`;
  publishCommunityItem({ kind: "study_set", sourceId: deck.id, title: deck.name, summary, payload: publicStudySetPayload(deck) });
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

const sourcedDiagramPages = {
  "psychology-neuron.svg": "https://commons.wikimedia.org/wiki/File:Complete_neuron_cell_diagram_en.svg",
  "psychology-brainstem.svg": "https://commons.wikimedia.org/wiki/File:Brain_stem_normal_human.svg",
  "psychology-inner-ear.svg": "https://commons.wikimedia.org/wiki/File:Anatomy_of_the_Human_Ear.svg",
  "psychology-action-potential.svg": "https://commons.wikimedia.org/wiki/File:Action_potential_schematic.svg",
  "biology-mitochondrion.svg": "https://commons.wikimedia.org/wiki/File:Mitochondrion_(standalone_version)-en.svg",
  "biology-membrane.svg": "https://commons.wikimedia.org/wiki/File:Cell_membrane_detailed_diagram_en.svg",
  "biology-cell-cycle.svg": "https://commons.wikimedia.org/wiki/File:The_Cell_Cycle.svg",
  "biology-dna-replication.svg": "https://commons.wikimedia.org/wiki/File:Eukaryotic_DNA_replication.svg",
  "chemistry-mass-spectrum.svg": "https://commons.wikimedia.org/wiki/File:Mass_Spectrometry_Graph_(NIH_BioArt_582).svg",
  "chemistry-photoelectron-spectrum.png": "https://commons.wikimedia.org/wiki/File:PES_Spectrum_of_Ammonia.png",
  "chemistry-electromagnetic-spectrum.svg": "https://commons.wikimedia.org/wiki/File:The_electromagnetic_spectrum.svg",
  "chemistry-beer-law.jpg": "https://commons.wikimedia.org/wiki/File:Beer%27s_Law_Plot.jpg",
  "chemistry-chromatogram.svg": "https://commons.wikimedia.org/wiki/File:Chromatogram_in_English.svg",
  "geography-hoyt-model.svg": "https://commons.wikimedia.org/wiki/File:Hoyt_model.svg",
  "geography-multiple-nuclei.png": "https://commons.wikimedia.org/wiki/File:Multiple_nuclei_model.svg",
  "geography-central-place.png": "https://commons.wikimedia.org/wiki/File:Christaller_model_3.svg",
  "geography-von-thunen.png": "https://commons.wikimedia.org/wiki/File:Von_Thunen_Model.svg",
};

function questionDefinitionExcerpt(value, maximumLength = 170) {
  const cleaned = conciseQuestionText(value).replace(/^[\s:;,.–—-]+/, "");
  if (!cleaned) return "Review the source material and identify the matching term.";
  const completeSentence = cleaned.match(new RegExp(`^(.{12,${maximumLength}}?[.!?])(?:\\s|$)`))?.[1] || cleaned;
  let excerpt = completeSentence;
  if (excerpt.length > maximumLength) {
    const shortened = excerpt.slice(0, maximumLength + 1).replace(/\s+\S*$/, "").replace(/[,:;\s]+$/, "");
    excerpt = `${shortened || excerpt.slice(0, maximumLength).trim()}…`;
  }
  excerpt = excerpt.charAt(0).toUpperCase() + excerpt.slice(1);
  if (!/[.!?…]$/.test(excerpt)) excerpt += ".";
  return excerpt;
}

function fillInBlankDefinitionPrompt(value) {
  return `${questionDefinitionExcerpt(value)} The term is _____.`;
}

function conciseQuestionText(value) {
  return String(value || "").replace(/\s+/g, " ").replace(/\s+\d+\.?$/, "").trim();
}

function deterministicChoices(answer, candidates, seed) {
  const unique = [...new Set(candidates.map(conciseQuestionText).filter((item) => item && item.toLowerCase() !== answer.toLowerCase()))];
  const offset = unique.length ? [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % unique.length : 0;
  const distractors = [...unique.slice(offset), ...unique.slice(0, offset)].slice(0, 3);
  const choices = [answer, ...distractors];
  const answerOffset = choices.length ? [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % choices.length : 0;
  return [...choices.slice(answerOffset), ...choices.slice(0, answerOffset)];
}

function diagramSourceForCard(card) {
  const image = card.backImage || card.frontImage || "";
  const fileName = image.split("/").pop();
  if (!image || !sourcedDiagramPages[fileName]) return null;
  return { image, sourceUrl: sourcedDiagramPages[fileName], credit: card.imageCredit || "Wikimedia Commons", alt: `Reference diagram for ${conciseQuestionText(card.front)}` };
}

function closestTopicCards(topicTitle, unitCards, count = 2) {
  const stopWords = new Set(["and", "the", "of", "in", "to", "for", "with", "from", "introduction", "developments", "changes", "period", "context"]);
  const keywords = new Set((String(topicTitle).toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length > 2 && !stopWords.has(word)));
  return (unitCards || []).map((card, index) => {
    const text = `${card.front || ""} ${card.back || ""}`.toLowerCase();
    const score = [...keywords].reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    return { card, score, index };
  }).sort((left, right) => right.score - left.score || left.index - right.index).slice(0, count).map((entry) => entry.card);
}

function buildApTopicQuestions(collection, topic, cards, unitCards) {
  const courseName = conciseQuestionText(collection.name);
  const sourceUrl = collection.units.find((unit) => unit.cedUrl)?.cedUrl || collection.units.find((unit) => unit.sourceUrl)?.sourceUrl || "";
  const base = { source: `Original ${courseName} practice`, sourceUrl, topicId: topic.id, difficulty: "Medium" };
  if (collection.id === "apcalculus" && typeof window.AP_CALCULUS_QUESTIONS_FOR_TOPIC === "function") {
    return window.AP_CALCULUS_QUESTIONS_FOR_TOPIC(topic.number, topic.title).map((question, index) => ({
      ...base,
      ...question,
      id: `${topic.id}-calculus-${index + 1}`,
    }));
  }
  if (collection.id === "apchem" && typeof window.AP_CHEMISTRY_QUESTIONS_FOR_TOPIC === "function") {
    return window.AP_CHEMISTRY_QUESTIONS_FOR_TOPIC(topic.number, topic.title).map((question, index) => ({
      ...base,
      ...question,
      id: `${topic.id}-chemistry-${index + 1}`,
    }));
  }
  const questionCards = cards.length ? cards : closestTopicCards(topic.title, unitCards);
  if (!questionCards.length) {
    return [];
  }
  const primary = questionCards[0];
  const secondary = questionCards[1] || questionCards[0];
  const answer = conciseQuestionText(primary.front);
  const description = conciseQuestionText(primary.back);
  const unitTerms = (unitCards || []).map((card) => card.front);
  const options = deterministicChoices(answer, [...questionCards.map((card) => card.front), ...unitTerms], `${collection.id}-${topic.id}`);
  const questions = [];
  if (options.length >= 3) {
    questions.push({ ...base, id: `${topic.id}-recall`, type: "mcq", prompt: `Which concept best matches this description? ${description}`, answer, options, difficulty: "Easy" });
    questions.push({ ...base, id: `${topic.id}-stimulus`, type: "stimulus_mcq", stimulus: `A learner encounters the following description: “${description}”`, prompt: "Which concept is most directly illustrated by the stimulus?", answer, options, difficulty: "Medium" });
  } else {
    questions.push({ ...base, id: `${topic.id}-recall`, type: "cloze", prompt: `_____ matches this description: ${description}`, answer, difficulty: "Easy" });
    questions.push({ ...base, id: `${topic.id}-stimulus`, type: "cloze", stimulus: `A learner encounters the following description: “${description}”`, prompt: "The concept illustrated by the stimulus is _____.", answer, difficulty: "Medium" });
  }
  const hardAnswer = conciseQuestionText(secondary.front);
  const hardDescription = questionDefinitionExcerpt(secondary.back);
  questions.push({ ...base, id: `${topic.id}-hard-cloze`, type: "cloze", prompt: fillInBlankDefinitionPrompt(hardDescription), answer: hardAnswer, difficulty: "Hard" });
  if (primary === secondary) questions.push({ ...base, id: `${topic.id}-cloze`, type: "cloze", prompt: `_____ matches this description: ${description}`, answer, difficulty: "Medium" });
  const diagramCard = questionCards.find(diagramSourceForCard);
  const diagram = diagramCard && diagramSourceForCard(diagramCard);
  if (diagram) {
    const diagramAnswer = conciseQuestionText(diagramCard.front);
    const diagramOptions = deterministicChoices(diagramAnswer, [...questionCards.map((card) => card.front), ...unitTerms], `${topic.id}-diagram`);
    questions.push({ ...base, id: `${topic.id}-diagram`, type: "diagram_label", prompt: `Use the diagram to identify the labeled structure or process associated with this description: ${conciseQuestionText(diagramCard.back)}`, answer: diagramAnswer, options: diagramOptions, image: diagram.image, imageAlt: diagram.alt, imageCredit: diagram.credit, imageSourceUrl: diagram.sourceUrl, difficulty: "Medium" });
  }
  return questions;
}

function dedicatedExamQuestionsForUnit(collection, unit) {
  return (window.YSB_AP_EXAM_PRACTICE?.[collection?.id]?.[unit?.id] || []).map((question) => ({
    sourceUrl: unit.cedUrl || unit.sourceUrl || "",
    ...question,
  }));
}

function isApCourseCollection(collection) {
  return Boolean(collection && (collection.catalogLabel === "AP course" || /^AP\s/.test(collection.name || "")));
}

function isIbCourseCollection(collection) {
  return Boolean(collection && (/^IB\b/.test(collection.catalogLabel || "") || /^IB\s/.test(collection.name || "")));
}

function builtInEditorSubdivisionStructure(collection) {
  if (!collection) return { units: [], topicByItem: new Map() };
  const topicByItem = new Map();
  if (isIbCourseCollection(collection)) {
    const topics = collection.units.map((unit, unitIndex) => {
      const topic = { id: `${unit.id}-subdivision`, name: unit.shortName || unit.name || `Subdivision ${unitIndex + 1}`, builtInUnitId: unit.id };
      [...(unit.cards || []), ...(unit.questions || []), ...(unit.feynmanPrompts || [])].forEach((item) => topicByItem.set(item, topic.id));
      return topic;
    });
    return { units: normalizedCustomUnits([{ id: `${collection.id}-subdivisions`, name: `${collection.name} course subdivisions`, topics }]), topicByItem };
  }
  if (!isApCourseCollection(collection)) {
    const units = collection.units.map((unit, unitIndex) => {
      const topic = { id: `${unit.id}-subdivision`, name: unit.shortName || unit.name || `Section ${unitIndex + 1}`, builtInUnitId: unit.id };
      [...(unit.cards || []), ...(unit.questions || []), ...(unit.feynmanPrompts || [])].forEach((item) => topicByItem.set(item, topic.id));
      return { id: unit.id, name: unit.shortName || unit.name || `Section ${unitIndex + 1}`, topics: [topic] };
    });
    return { units: normalizedCustomUnits(units), topicByItem };
  }
  const units = collection.units.map((unit, unitIndex) => {
    const sourceTopics = apSubtopicsForUnit(collection, unit);
    sourceTopics.forEach((topic) => {
      [...(topic.cards || []), ...(topic.questions || []), ...(topic.feynmanPrompts || [])].forEach((item) => topicByItem.set(item, topic.id));
    });
    return {
      id: unit.id,
      name: unit.shortName || unit.name || `Unit ${unitIndex + 1}`,
      topics: sourceTopics.map((topic) => ({ id: topic.id, name: topic.label || topic.name || `Subtopic ${unitIndex + 1}`, builtInUnitId: unit.id })),
    };
  });
  return { units: normalizedCustomUnits(units), topicByItem };
}

function apSubtopicsForUnit(collection, unit) {
  if (!isApCourseCollection(collection)) return [{ id: unit.id, label: unit.shortName, cards: unit.cards || [], questions: unit.questions || [], feynmanPrompts: unit.feynmanPrompts || [] }];
  if (Array.isArray(unit.subtopics) && unit.subtopics.length) return unit.subtopics;
  const definitions = window.AP_CED_TOPIC_MAP?.courses?.[collection.id]?.units?.[unit.id];
  if (!Array.isArray(definitions) || !definitions.length) {
    return [{ id: unit.id, label: unit.shortName, cards: unit.cards || [], questions: unit.questions || [], feynmanPrompts: unit.feynmanPrompts || [] }];
  }
  const unitsById = new Map(collection.units.map((item) => [item.id, item]));
  const dedicatedQuestions = dedicatedExamQuestionsForUnit(collection, unit);
  return definitions.map((topic, topicIndex) => {
    const cards = topic.cardRefs.map(([unitId, cardId]) => unitsById.get(unitId)?.cards?.find((card) => card.id === cardId)).filter(Boolean);
    const sourceQuestions = topic.questionRefs.map(([unitId, index]) => unitsById.get(unitId)?.questions?.[index]).filter(Boolean);
    const assignedExamQuestions = dedicatedQuestions.filter((_, questionIndex) => questionIndex % definitions.length === topicIndex);
    return {
      id: topic.id,
      label: `${topic.number} ${topic.title}`,
      cards,
      questions: [...sourceQuestions, ...assignedExamQuestions, ...(dedicatedQuestions.length ? [] : buildApTopicQuestions(collection, topic, cards, unit.cards || []))],
      feynmanPrompts: topic.promptRefs.map(([unitId, index]) => unitsById.get(unitId)?.feynmanPrompts?.[index]).filter(Boolean),
    };
  });
}

function allApTopicIds(collection, units = collection.units) {
  return units.flatMap((unit) => apSubtopicsForUnit(collection, unit).map((topic) => topic.id));
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
  const useTopicSelection = isApCourseCollection(collection) && state.selectedBuiltInCollectionId === collection.id;
  const selectedTopicIds = new Set(state.selectedBuiltInTopicIds);
  const chosenTopics = (unit) => apSubtopicsForUnit(collection, unit).filter((topic) => !useTopicSelection || selectedTopicIds.has(topic.id));
  const cards = collection.geographyBank ? geographyCardsForUnits(selectedUnits) : collection.usStateBank ? usStateCardsForUnits(selectedUnits) : selectedUnits.flatMap((unit) => chosenTopics(unit).flatMap((topic) => topic.cards).filter(allowed));
  const questions = selectedUnits.flatMap((unit) => chosenTopics(unit).flatMap((topic) => topic.questions).filter(allowed));
  const feynmanPrompts = selectedUnits.flatMap((unit) => chosenTopics(unit).flatMap((topic) => topic.feynmanPrompts).filter(allowed));
  return { id: collection.id, name: `${collection.name}${suffix}`, builtIn: true, geographyBank: Boolean(collection.geographyBank), usStateBank: Boolean(collection.usStateBank), cards, questions, feynmanPrompts };
}

function findStudyDeck(deckId) {
  if (deckId.startsWith("notebook-folder:")) {
    const folderId = deckId.slice(16);
    const folder = loadNoteFolders().find((item) => item.id === folderId);
    if (!folder) return null;
    const folderNotes = loadNotebookNotes().filter((note) => note.folderId === folderId);
    const selectedIds = state.selectedNotebookFolderId === folderId ? new Set(state.selectedNotebookNoteIds) : new Set(folderNotes.map((note) => note.id));
    const selectedNotes = folderNotes.filter((note) => selectedIds.has(note.id));
    const generated = selectedNotes.map((note) => {
      const sourceText = notebookNotePlainText(note);
      const cards = generateCardsFromNotes(sourceText).map((card, index) => ({ ...card, id: `notebook-card-${note.id}-${index + 1}`, sourceNoteId: note.id, sourceDeckId: `notebook-note:${note.id}` }));
      const questions = generateQuestionsFromCards(cards, sourceText).map((question, index) => ({ ...question, id: `notebook-question-${note.id}-${index + 1}`, sourceNoteId: note.id, sourceDeckId: `notebook-note:${note.id}` }));
      const feynmanPrompts = generateFeynmanPrompts(sourceText, cards).map((prompt, index) => ({ ...prompt, id: `notebook-feynman-${note.id}-${index + 1}`, sourceNoteId: note.id, sourceDeckId: `notebook-note:${note.id}` }));
      return { cards, questions, feynmanPrompts };
    });
    return {
      id: deckId,
      name: folder.name,
      notebookFolderStudy: true,
      builtIn: false,
      cards: generated.flatMap((entry) => entry.cards),
      questions: generated.flatMap((entry) => entry.questions),
      feynmanPrompts: generated.flatMap((entry) => entry.feynmanPrompts),
    };
  }
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
  if (personalDeck) {
    const hasTopics = customTopicEntries(personalDeck.units).length > 0;
    if (!hasTopics || state.selectedCustomDeckId !== deckId) return personalDeck;
    const selected = new Set(state.selectedCustomTopicIds);
    const included = (item) => selected.has(item.customTopicId || CUSTOM_GENERAL_TOPIC_ID);
    return { ...personalDeck, cards: personalDeck.cards.filter(included), questions: (personalDeck.questions || []).filter(included), feynmanPrompts: (personalDeck.feynmanPrompts || []).filter(included) };
  }
  const collection = getBuiltInCollection(deckId);
  if (collection) return collectionStudyDeck(collection);
  return builtInFlashcardDecks.find((deck) => deck.id === deckId);
}

function openNotebookFolderStudy(folderId) {
  const notes = loadNotebookNotes().filter((note) => note.folderId === folderId);
  state.selectedNotebookFolderId = folderId;
  state.selectedNotebookNoteIds = notes.map((note) => note.id);
  openCustomStudyOptions(`notebook-folder:${folderId}`);
}

function copyableBuiltInStudySet(collection) {
  const subdivisionStructure = builtInEditorSubdivisionStructure(collection);
  const topics = customTopicEntries(subdivisionStructure.units);
  const assignedTopicId = (item, unit) => subdivisionStructure.topicByItem.get(item)
    || topics.find((topic) => (topic.builtInUnitId || topic.unitId) === unit.id)?.id
    || "";
  return {
    name: collection.name,
    units: subdivisionStructure.units,
    cards: collection.units.flatMap((unit) => (unit.cards || []).map((card) => ({ ...card, customTopicId: assignedTopicId(card, unit) }))),
    questions: collection.units.flatMap((unit) => (unit.questions || []).map((question) => ({ ...question, customTopicId: assignedTopicId(question, unit) }))),
    feynmanPrompts: collection.units.flatMap((unit) => (unit.feynmanPrompts || []).map((prompt) => ({ ...prompt, customTopicId: assignedTopicId(prompt, unit) }))),
    characteristicTemplate: collection.characteristicTemplate || [],
  };
}

function duplicateStudySet(deckId) {
  const personal = loadCustomDecks().find((deck) => deck.id === deckId);
  const collection = personal ? null : getBuiltInCollection(deckId);
  const source = personal || (collection ? copyableBuiltInStudySet(collection) : null);
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
    units: normalizedCustomUnits(JSON.parse(JSON.stringify(source.units || []))),
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
  showToast(`${duplicate.name} created as an editable copy with fresh study progress.`);
}

function saveCustomDeck({ resetAfterSave = true, notify = true } = {}) {
  const name = $("#custom-deck-name").value.trim();
  const cards = state.customDraft.map((card) => ({ ...card, front: String(card.front || "").trim(), back: String(card.back || "").trim() })).filter((card) => (card.front || card.frontImage) && (card.back || card.backImage));
  const questions = state.customQuestionDraft.map(cleanQuestionForStorage).filter((question) => question.prompt && question.answer);
  const feynmanPrompts = state.customFeynmanDraft.map((item) => ({ ...item, prompt: item.prompt.trim() })).filter((item) => item.prompt);
  if (!name) { $("#custom-deck-name").focus(); showToast("Give this deck a name first."); return null; }
  if (!cards.length && !questions.length && !feynmanPrompts.length) { showToast("Add at least one card, question, or Feynman prompt."); return null; }
  const decks = loadCustomDecks();
  const existingIndex = decks.findIndex((deck) => deck.id === state.editingCustomDeckId);
  const existingDeck = existingIndex >= 0 ? decks[existingIndex] : null;
  if (isReadOnlyStudySet(existingDeck)) { showToast("Make a copy before editing this community set."); return null; }
  const visibleSourceNotes = notesPlainText();
  const visibleSourceNotesHtml = notesRichHtml();
  const deck = { id: state.editingCustomDeckId || makeLocalId("deck"), name, cards, questions, feynmanPrompts, units: normalizedCustomUnits(state.customUnits), characteristicTemplate: characteristicTemplate(), sourceNotes: state.notesHiddenAfterUpdate && !visibleSourceNotes ? existingDeck?.sourceNotes || "" : visibleSourceNotes, sourceNotesHtml: state.notesHiddenAfterUpdate && !visibleSourceNotesHtml ? existingDeck?.sourceNotesHtml || "" : visibleSourceNotesHtml, sourceImport: state.customImportSource, generatorVersion: NOTES_GENERATOR_VERSION, updatedAt: Date.now() };
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
  showToast("Curated sets cannot be edited. Make a copy first.");
  return null;
  /* Legacy override migration code remains below so existing saved data can still be read. */
  const collectionId = state.editingBuiltInCollectionId;
  const original = builtInFlashcardCollections.find((item) => item.id === collectionId);
  if (!original) return null;
  const name = $("#custom-deck-name").value.trim() || original.name;
  const fallbackUnitId = original.units[0]?.id;
  const cleanCards = state.customDraft.map((card) => ({ ...card, front: String(card.front || "").trim(), back: String(card.back || "").trim(), builtInUnitId: card.builtInUnitId || fallbackUnitId })).filter((card) => (card.front || card.frontImage) && (card.back || card.backImage));
  const cleanQuestions = state.customQuestionDraft.map((question) => ({ ...cleanQuestionForStorage(question), builtInUnitId: question.builtInUnitId || fallbackUnitId })).filter((question) => question.prompt && question.answer);
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
  if (existingIndex >= 0 && isReadOnlyStudySet(decks[existingIndex])) { showToast("Make a copy before editing this community set."); return null; }
  const deck = {
    id: state.editingCustomDeckId || makeLocalId("deck"),
    name,
    cards: state.customDraft.map((card) => ({ ...card })),
    questions: state.customQuestionDraft.map((question) => ({ ...question })),
    feynmanPrompts: state.customFeynmanDraft.map((item) => ({ ...item })),
    units: normalizedCustomUnits(state.customUnits),
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
  if (isReadOnlyStudySet(deck)) { showToast("Make a copy before editing this community set."); return; }
  state.editingBuiltInCollectionId = null;
  state.editingCustomDeckId = deck.id;
  state.appendNotesToExistingSet = false;
  state.notesHiddenAfterUpdate = true;
  state.customDraft = deck.cards.map((card) => ({ ...card }));
  state.customQuestionDraft = (deck.questions || []).map((question) => ({ ...question }));
  state.customFeynmanDraft = (deck.feynmanPrompts || []).map((item) => ({ ...item }));
  state.customUnits = normalizedCustomUnits(deck.units);
  state.activeCustomTopicId = customTopicEntries(state.customUnits)[0]?.id || "";
  state.draftViewUnitId = "";
  state.draftViewTopicId = "";
  state.customImportSource = deck.sourceImport || null;
  state.extraColumnsOnly = (deck.characteristicTemplate?.length || 0) > 2;
  state.customCharacteristicFields = defaultCharacteristicFields(deck.characteristicTemplate || []);
  $("#custom-deck-name").value = deck.name;
  setNotesContent();
  $("#anki-import-status").textContent = state.customImportSource ? `Imported from ${state.customImportSource.name} · flashcards only` : "Supports APKG, UTF-8 TXT, CSV, and TSV files.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  renderCustomUnitBuilder();
  setCardMakerMode((deck.characteristicTemplate?.length || 0) > 2 ? "characteristics" : "basic");
  selectCreateContentTab("flashcards");
  $("#custom-deck-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function editBuiltInCollection(collectionId) {
  showToast("Curated sets cannot be edited. Make a copy first.");
  return;
  /* Legacy editor loading code remains below for compatibility with old saved overrides. */
  await ensureBuiltInCollectionLoaded(collectionId);
  const collection = getBuiltInCollection(collectionId);
  if (!collection) return;
  state.editingCustomDeckId = null;
  state.editingBuiltInCollectionId = collectionId;
  state.appendNotesToExistingSet = false;
  const subdivisionStructure = builtInEditorSubdivisionStructure(collection);
  state.customUnits = subdivisionStructure.units;
  const validTopicIds = new Set(customTopicEntries(state.customUnits).map((topic) => topic.id));
  state.activeCustomTopicId = customTopicEntries(state.customUnits)[0]?.id || "";
  state.draftViewUnitId = "";
  state.draftViewTopicId = "";
  const assignedTopicId = (item, unit) => validTopicIds.has(item.customTopicId)
    ? item.customTopicId
    : subdivisionStructure.topicByItem.get(item) || customTopicEntries(state.customUnits).find((topic) => (topic.builtInUnitId || topic.unitId) === unit.id)?.id || "";
  const geographyByCardId = collection.geographyBank
    ? new Map(collection.units.flatMap((unit) => (unit.countries || []).map((country) => [`geo-${country.id}-country-capital`, country])))
    : null;
  state.customDraft = collection.units.flatMap((unit) => unit.cards.map((card) => {
    const country = geographyByCardId?.get(card.id);
    return {
      ...card,
      builtInUnitId: unit.id,
      customTopicId: assignedTopicId(card, unit),
      ...(country && !card.characteristics ? { characteristicCard: true, characteristics: geographyExtraColumns(country) } : {}),
    };
  }));
  state.customQuestionDraft = collection.units.flatMap((unit) => (unit.questions || []).map((question) => ({ ...question, builtInUnitId: unit.id, customTopicId: assignedTopicId(question, unit) })));
  state.customFeynmanDraft = collection.units.flatMap((unit) => (unit.feynmanPrompts || []).map((item) => ({ ...item, builtInUnitId: unit.id, customTopicId: assignedTopicId(item, unit) })));
  state.customImportSource = null;
  state.extraColumnsOnly = (collection.characteristicTemplate?.length || 0) > 2;
  state.customCharacteristicFields = defaultCharacteristicFields(collection.characteristicTemplate || []);
  $("#custom-deck-name").value = collection.name;
  setNotesContent();
  $("#notes-input").dataset.placeholder = "This curated set is edited below. You can also add individual cards manually.";
  $("#generate-note-cards").disabled = false;
  $("#generate-note-cards").textContent = "Update set";
  renderCustomDraft();
  renderCustomQuestionDraft();
  renderCustomFeynmanDraft();
  renderCustomUnitBuilder();
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
  $("#custom-delete-message").textContent = "Are you sure? This deck will be removed from My study sets. You can add the curated set again from the Study library.";
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
  $("#custom-delete-message").textContent = "Are you sure? Every personal set, added curated set, and their saved Anki progress will be permanently removed.";
  $("#custom-delete-summary").textContent = `${total} ${total === 1 ? "study set" : "study sets"}`;
  $("#confirm-custom-delete").textContent = "Delete All";
  showAppView("custom-delete");
}

function returnAllBuiltInDecks() {
  const addedCollections = addedFlashcardCollectionIds();
  if (!addedCollections.length) { showToast("All curated sets are already in the library."); return; }
  state.customDeleteReturnView = "courses";
  state.pendingCustomDeleteId = null;
  state.pendingBuiltInDeleteId = null;
  state.pendingDeleteAllStudySets = false;
  state.pendingReturnAllBuiltIn = true;
  state.pendingReturnAllTextbooks = false;
  $("#custom-delete-title").textContent = "Return all curated sets?";
  $("#custom-delete-message").textContent = "The decks will move out of My Study Sets and become available in the Study library again. Personal study sets and saved deck edits will remain unchanged.";
  $("#custom-delete-summary").textContent = `${addedCollections.length} ${addedCollections.length === 1 ? "curated set" : "curated sets"}`;
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
    showAppView("courses");
    setBrowseLibraryView("flashcards");
    renderCustomDecks();
    showToast("All curated sets returned to the Study library.");
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
    showToast(`${collection?.name || "Curated set"} deleted from My study sets.`);
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
    state.selectedBuiltInTopicIds = allApTopicIds(collection, collection.units.filter((unit) => !unit.defaultOff));
    state.calculusAbOnly = false;
  }
  state.selectedBuiltInCollectionId = collection?.id || null;
  const personalDeck = loadCustomDecks().find((item) => item.id === deckId);
  if (personalDeck && state.selectedCustomDeckId !== deckId) {
    state.selectedCustomTopicIds = [CUSTOM_GENERAL_TOPIC_ID, ...customTopicEntries(personalDeck.units).map((topic) => topic.id)];
  }
  const deck = findStudyDeck(deckId);
  if (!deck) return;
  if (!$("#flashcards").hidden) state.customStudyReturnView = "flashcards";
  else if (!$("#create").hidden) state.customStudyReturnView = "create";
  else if (!$("#notes-page").hidden) state.customStudyReturnView = "notes";
  state.selectedCustomDeckId = deckId;
  state.selectedCustomDeckBuiltIn = Boolean(deck.builtIn || deck.folderStudy);
  $("#close-custom-study").textContent = state.customStudyReturnView === "dashboard" ? "← Back to dashboard" : state.customStudyReturnView === "flashcards" ? "← Back to Study" : state.customStudyReturnView === "notes" ? "← Back to Notes" : "← Back to Create";
  renderBuiltInUnitPicker(collection);
  renderNotebookTopicPicker(deckId);
  renderCustomTopicPicker(personalDeck || null);
  renderGeographyFieldPicker(collection);
  renderUsStateFieldPicker(collection);
  refreshCustomStudyOptions();
  $("#custom-study-options-view").hidden = false;
  $("#custom-review-view").hidden = true;
  showAppView("custom-study");
}

function renderCustomTopicPicker(deck) {
  const picker = $("#custom-topic-picker");
  const units = normalizedCustomUnits(deck?.units);
  const topics = customTopicEntries(units);
  picker.hidden = !deck || !topics.length;
  if (picker.hidden) return;
  const selected = new Set(state.selectedCustomTopicIds);
  const unassignedCount = [...(deck.cards || []), ...(deck.questions || []), ...(deck.feynmanPrompts || [])].filter((item) => !item.customTopicId).length;
  const general = unassignedCount ? `<label class="built-in-topic-choice"><input type="checkbox" data-custom-study-topic value="${CUSTOM_GENERAL_TOPIC_ID}" ${selected.has(CUSTOM_GENERAL_TOPIC_ID) ? "checked" : ""}><span><strong>General</strong><small>${unassignedCount} unassigned items</small></span></label>` : "";
  $("#custom-topic-grid").innerHTML = `${general}${units.map((unit) => {
    const unitTopics = unit.topics;
    const selectedCount = unitTopics.filter((topic) => selected.has(topic.id)).length;
    const topicMarkup = unitTopics.map((topic) => {
      const items = [...(deck.cards || []), ...(deck.questions || []), ...(deck.feynmanPrompts || [])].filter((item) => item.customTopicId === topic.id);
      return `<label class="built-in-topic-choice"><input type="checkbox" data-custom-study-topic value="${escapeHtml(topic.id)}" ${selected.has(topic.id) ? "checked" : ""}><span><strong title="${escapeHtml(topic.name)}">${escapeHtml(topic.name)}</strong><small>${items.length} study items</small></span></label>`;
    }).join("");
    return `<section class="built-in-unit-group"><label class="built-in-unit-choice"><input type="checkbox" data-custom-study-unit value="${escapeHtml(unit.id)}" ${selectedCount === unitTopics.length ? "checked" : ""}><span><strong>${escapeHtml(unit.name)}</strong><small>${unitTopics.length} subtopics</small></span></label><div class="built-in-topic-grid">${topicMarkup}</div></section>`;
  }).join("")}`;
  $$('[data-custom-study-unit]', picker).forEach((input) => {
    const unit = units.find((item) => item.id === input.value);
    const ids = unit?.topics.map((topic) => topic.id) || [];
    const count = ids.filter((id) => selected.has(id)).length;
    input.indeterminate = count > 0 && count < ids.length;
    input.onchange = () => {
      state.selectedCustomTopicIds = input.checked ? [...new Set([...state.selectedCustomTopicIds, ...ids])] : state.selectedCustomTopicIds.filter((id) => !ids.includes(id));
      renderCustomTopicPicker(deck); refreshCustomStudyOptions();
    };
  });
  $$('[data-custom-study-topic]', picker).forEach((input) => input.onchange = () => {
    state.selectedCustomTopicIds = input.checked ? [...new Set([...state.selectedCustomTopicIds, input.value])] : state.selectedCustomTopicIds.filter((id) => id !== input.value);
    renderCustomTopicPicker(deck); refreshCustomStudyOptions();
  });
  const allIds = [CUSTOM_GENERAL_TOPIC_ID, ...topics.map((topic) => topic.id)].filter((id) => id !== CUSTOM_GENERAL_TOPIC_ID || unassignedCount);
  const allSelected = allIds.every((id) => selected.has(id));
  $("#toggle-all-custom-topics").textContent = allSelected ? "Clear all" : "Select all";
  $("#toggle-all-custom-topics").onclick = () => {
    state.selectedCustomTopicIds = allSelected ? [] : allIds;
    renderCustomTopicPicker(deck); refreshCustomStudyOptions();
  };
}

function renderNotebookTopicPicker(deckId) {
  const picker = $("#notebook-topic-picker");
  const isNotebookFolder = deckId?.startsWith("notebook-folder:");
  picker.hidden = !isNotebookFolder;
  if (!isNotebookFolder) return;
  const folderId = deckId.slice(16);
  const notes = loadNotebookNotes().filter((note) => note.folderId === folderId);
  const selected = new Set(state.selectedNotebookNoteIds);
  $("#notebook-topic-grid").innerHTML = notes.map((note) => {
    const hasStudyText = Boolean(notebookNotePlainText(note));
    const typeLabel = note.type === "pdf" ? "PDF note" : note.type === "word" ? "Word note" : note.canvasMode === "page" ? "Page note" : "Open note";
    return `<label class="built-in-topic-choice notebook-topic-choice"><input type="checkbox" data-notebook-topic value="${escapeHtml(note.id)}" ${selected.has(note.id) ? "checked" : ""}><span><strong>${escapeHtml(note.title || "Untitled note")}</strong><small>${hasStudyText ? typeLabel : `${typeLabel} · no typed text`}</small></span></label>`;
  }).join("") || '<div class="note-folder-empty">Add a note to this folder to study it.</div>';
  $$('[data-notebook-topic]', $("#notebook-topic-grid")).forEach((input) => input.addEventListener("change", () => {
    state.selectedNotebookNoteIds = $$('[data-notebook-topic]:checked', $("#notebook-topic-grid")).map((item) => item.value);
    renderNotebookTopicPicker(deckId);
    refreshCustomStudyOptions();
  }));
  const allSelected = notes.length > 0 && notes.every((note) => selected.has(note.id));
  $("#toggle-all-notebook-topics").textContent = allSelected ? "Clear all" : "Select all";
  $("#toggle-all-notebook-topics").onclick = () => {
    state.selectedNotebookNoteIds = allSelected ? [] : notes.map((note) => note.id);
    renderNotebookTopicPicker(deckId);
    refreshCustomStudyOptions();
  };
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
  const apTopicsEnabled = isApCourseCollection(collection);
  $("#built-in-unit-grid").classList.toggle("has-ap-subtopics", apTopicsEnabled);
  $("#built-in-unit-grid").innerHTML = collection.units.map((unit) => {
    const allowed = (item) => !state.calculusAbOnly || item.courseLevel !== extensionLevel;
    const topics = apTopicsEnabled ? apSubtopicsForUnit(collection, unit) : [];
    const cardCount = apTopicsEnabled ? topics.flatMap((topic) => topic.cards).filter(allowed).length : unit.cards.filter(allowed).length;
    const questionCount = apTopicsEnabled ? topics.flatMap((topic) => topic.questions).filter(allowed).length : (unit.questions || []).filter(allowed).length;
    const feynmanCount = apTopicsEnabled ? topics.flatMap((topic) => topic.feynmanPrompts).filter(allowed).length : (unit.feynmanPrompts || []).filter(allowed).length;
    const summary = [cardCount ? `${cardCount} cards` : "", questionCount ? `${questionCount} questions` : "", feynmanCount ? `${feynmanCount} Feynman topics` : ""].filter(Boolean).join(" · ") || "No study items";
    if (!apTopicsEnabled) return `<label class="built-in-unit-choice"><input type="checkbox" data-built-in-unit value="${unit.id}" ${state.selectedBuiltInUnitIds.includes(unit.id) ? "checked" : ""} ${cardCount ? "" : "disabled"}><span><strong>${escapeHtml(unit.shortName)}</strong><small>${summary}</small></span></label>`;
    const selectedCount = topics.filter((topic) => state.selectedBuiltInTopicIds.includes(topic.id)).length;
    const topicMarkup = topics.map((topic) => {
      const topicCardCount = topic.cards.filter(allowed).length;
      const topicQuestionCount = topic.questions.filter(allowed).length;
      return `<label class="built-in-topic-choice"><input type="checkbox" data-built-in-topic value="${topic.id}" ${state.selectedBuiltInTopicIds.includes(topic.id) ? "checked" : ""}><span><strong title="${escapeHtml(topic.label)}">${escapeHtml(topic.label)}</strong><small>${topicCardCount} ${topicCardCount === 1 ? "card" : "cards"} · ${topicQuestionCount} questions</small></span></label>`;
    }).join("");
    return `<section class="built-in-unit-group"><label class="built-in-unit-choice"><input type="checkbox" data-built-in-unit value="${unit.id}" ${selectedCount === topics.length ? "checked" : ""}><span><strong>${escapeHtml(unit.shortName)}</strong><small>${summary} · ${topics.length} topics</small></span></label><div class="built-in-topic-grid">${topicMarkup}</div></section>`;
  }).join("");
  $$('[data-built-in-unit]', $("#built-in-unit-grid")).forEach((input) => {
    if (apTopicsEnabled) {
      const unit = collection.units.find((item) => item.id === input.value);
      const topics = apSubtopicsForUnit(collection, unit);
      const selectedCount = topics.filter((topic) => state.selectedBuiltInTopicIds.includes(topic.id)).length;
      input.indeterminate = selectedCount > 0 && selectedCount < topics.length;
    }
    input.addEventListener("change", () => {
      if (apTopicsEnabled) {
        const unit = collection.units.find((item) => item.id === input.value);
        const topicIds = apSubtopicsForUnit(collection, unit).map((topic) => topic.id);
        state.selectedBuiltInTopicIds = input.checked ? [...new Set([...state.selectedBuiltInTopicIds, ...topicIds])] : state.selectedBuiltInTopicIds.filter((id) => !topicIds.includes(id));
        state.selectedBuiltInUnitIds = collection.units.filter((candidate) => apSubtopicsForUnit(collection, candidate).some((topic) => state.selectedBuiltInTopicIds.includes(topic.id))).map((candidate) => candidate.id);
      } else {
        state.selectedBuiltInUnitIds = $$('[data-built-in-unit]:checked', $("#built-in-unit-grid")).map((item) => item.value);
      }
      renderBuiltInUnitPicker(collection);
      refreshCustomStudyOptions();
    });
  });
  $$('[data-built-in-topic]', $("#built-in-unit-grid")).forEach((input) => input.addEventListener("change", () => {
    state.selectedBuiltInTopicIds = input.checked ? [...new Set([...state.selectedBuiltInTopicIds, input.value])] : state.selectedBuiltInTopicIds.filter((id) => id !== input.value);
    state.selectedBuiltInUnitIds = collection.units.filter((unit) => apSubtopicsForUnit(collection, unit).some((topic) => state.selectedBuiltInTopicIds.includes(topic.id))).map((unit) => unit.id);
    renderBuiltInUnitPicker(collection);
    refreshCustomStudyOptions();
  }));
  $("#toggle-all-built-in-units").onclick = () => {
    const selectableUnits = collection.units.filter((unit) => !state.calculusAbOnly || apSubtopicsForUnit(collection, unit).some((topic) => topic.cards.some((card) => card.courseLevel !== extensionLevel)));
    const selectableTopicIds = apTopicsEnabled ? allApTopicIds(collection, selectableUnits) : [];
    const allSelected = apTopicsEnabled ? selectableTopicIds.every((id) => state.selectedBuiltInTopicIds.includes(id)) : selectableUnits.every((unit) => state.selectedBuiltInUnitIds.includes(unit.id));
    state.selectedBuiltInUnitIds = allSelected ? [] : selectableUnits.map((unit) => unit.id);
    if (apTopicsEnabled) state.selectedBuiltInTopicIds = allSelected ? [] : allApTopicIds(collection, selectableUnits);
    renderBuiltInUnitPicker(collection);
    refreshCustomStudyOptions();
  };
  abToggle.onclick = () => {
    state.calculusAbOnly = !state.calculusAbOnly;
    const selectedUnits = state.calculusAbOnly ? collection.units.filter((unit) => apSubtopicsForUnit(collection, unit).some((topic) => topic.cards.some((card) => card.courseLevel !== extensionLevel))) : collection.units;
    state.selectedBuiltInUnitIds = selectedUnits.map((unit) => unit.id);
    if (apTopicsEnabled) state.selectedBuiltInTopicIds = allApTopicIds(collection, selectedUnits);
    renderBuiltInUnitPicker(collection);
    refreshCustomStudyOptions();
  };
  updateBuiltInUnitToggle(collection);
}

function updateBuiltInUnitToggle(collection) {
  const extensionLevel = collection.extensionLevel || "BC";
  const selectableUnits = collection.units.filter((unit) => !state.calculusAbOnly || apSubtopicsForUnit(collection, unit).some((topic) => topic.cards.some((card) => card.courseLevel !== extensionLevel)));
  const allSelected = isApCourseCollection(collection)
    ? allApTopicIds(collection, selectableUnits).every((id) => state.selectedBuiltInTopicIds.includes(id))
    : selectableUnits.every((unit) => state.selectedBuiltInUnitIds.includes(unit.id));
  $("#toggle-all-built-in-units").textContent = selectableUnits.length && allSelected ? "Clear all" : "Select all";
}

function availableEssayPrompts() {
  const deck = state.selectedCustomDeckId ? findStudyDeck(state.selectedCustomDeckId) : null;
  return (deck?.questions || []).filter((question) => question.type === "essay");
}

function essayPromptMeta(question) {
  const details = [];
  if (question.recommendedMinutes) details.push(`${question.recommendedMinutes} min`);
  if (question.sources?.length) details.push(`${question.sources.length} source${question.sources.length === 1 ? "" : "s"}`);
  return details.join(" · ") || "Essay practice";
}

function renderEssayPromptPicker() {
  const trigger = $("#custom-essay-prompt");
  if (!trigger) return;
  const questions = availableEssayPrompts();
  const selected = questions.find((question) => question.id === state.customEssayPromptId);
  $("#custom-essay-prompt-type").textContent = selected ? essayTypeLabel(selected.essayType) : "Any essay type";
  $("#custom-essay-prompt-title").textContent = selected ? (selected.title || selected.prompt.slice(0, 80)) : "Random prompt";
  trigger.title = selected ? (selected.title || selected.prompt) : "Choose a random prompt when practice starts";

  const availableTypes = [...new Set(questions.map((question) => question.essayType || "essay"))];
  const selectedType = selected?.essayType || "essay";
  if (!customEssayPromptFilter || !availableTypes.includes(customEssayPromptFilter)) customEssayPromptFilter = availableTypes.includes(selectedType) ? selectedType : availableTypes[0] || "essay";
  $("#custom-essay-prompt-filters").innerHTML = availableTypes.map((type) => `<button type="button" class="${customEssayPromptFilter === type ? "active" : ""}" data-essay-prompt-filter="${escapeHtml(type)}">${escapeHtml(essayTypeLabel(type))}</button>`).join("");

  const filtered = questions.filter((question) => {
    return (question.essayType || "essay") === customEssayPromptFilter;
  });
  const groups = [...new Set(filtered.map((question) => question.essayType || "essay"))];
  const randomChoice = `
    <button type="button" class="essay-prompt-option random ${state.customEssayPromptId ? "" : "selected"}" data-essay-prompt-id="" role="option" aria-selected="${state.customEssayPromptId ? "false" : "true"}">
      <span class="essay-prompt-option-icon" aria-hidden="true">↻</span><span><strong>Random prompt</strong><small>Choose for me when practice starts</small></span>
    </button>`;
  const groupedChoices = groups.map((type) => `
    <section class="essay-prompt-group">
      <h4>${escapeHtml(essayTypeLabel(type))}</h4>
      ${filtered.filter((question) => (question.essayType || "essay") === type).map((question) => `
        <button type="button" class="essay-prompt-option ${question.id === state.customEssayPromptId ? "selected" : ""}" data-essay-prompt-id="${escapeHtml(question.id)}" role="option" aria-selected="${question.id === state.customEssayPromptId ? "true" : "false"}">
          <span><strong>${escapeHtml(question.title || question.prompt.slice(0, 90))}</strong><small>${escapeHtml(essayPromptMeta(question))}</small></span><i aria-hidden="true">›</i>
        </button>`).join("")}
    </section>`).join("");
  $("#custom-essay-prompt-list").innerHTML = randomChoice + groupedChoices || `<p class="essay-prompt-empty">No prompts match that search.</p>`;
}

function toggleEssayPromptPicker(forceOpen) {
  const panel = $("#custom-essay-prompt-panel");
  const trigger = $("#custom-essay-prompt");
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : panel.hidden;
  panel.hidden = !shouldOpen;
  trigger.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) {
    renderEssayPromptPicker();
    window.setTimeout(() => $("#custom-essay-prompt-filters button.active")?.focus(), 0);
  }
}

function selectEssayPrompt(promptId) {
  state.customEssayPromptId = promptId;
  const question = availableEssayPrompts().find((item) => item.id === promptId);
  if (question?.recommendedMinutes) {
    state.customEssayTimeMinutes = question.recommendedMinutes;
    $("#custom-essay-time-minutes").value = String(question.recommendedMinutes);
  }
  if (question?.essayType) customEssayPromptFilter = question.essayType;
  renderEssayPromptPicker();
  toggleEssayPromptPicker(false);
}

function refreshCustomStudyOptions() {
  const deck = findStudyDeck(state.selectedCustomDeckId);
  if (!deck) return;
  const regularQuestions = (deck.questions || []).filter((question) => question.type !== "essay");
  const essayQuestions = (deck.questions || []).filter((question) => question.type === "essay");
  $("#custom-study-title").textContent = deck.name;
  const removed = removedAnkiCardKeys();
  const candidates = deck.cards.map((card) => prepareAnkiSessionCard(card, customAnkiKey(card.sourceDeckId || deck.id, card.id))).filter((card) => !removed.has(card.scheduleKey));
  const frozen = frozenAnkiDeck(deck.id);
  const dailyPlan = frozen ? { queue: [], newCards: [], learningCards: [], reviewCards: [] } : dailyAnkiPlan(candidates, `deck:${deck.id}`);
  const dueCount = dailyPlan.queue.length;
  const reviewCount = dailyPlan.learningCards.length + dailyPlan.reviewCards.length;
  const futureDue = deck.cards.map((card) => ankiScheduleFor(customAnkiKey(card.sourceDeckId || deck.id, card.id)).due).filter((due) => due > Date.now()).sort((a, b) => a - b)[0];
  const factBankMissingSide = (deck.geographyBank && (!state.geographyFrontFields.length || !state.geographyBackFields.length)) || (deck.usStateBank && (!state.usStateFrontFields.length || !state.usStateBackFields.length));
  $("#custom-anki-due-copy").textContent = frozen ? "This deck is frozen. Resume it from Active Anki on the Dashboard to restart its clock." : factBankMissingSide ? "Choose at least one field for both sides to study." : !deck.cards.length ? deck.notebookFolderStudy ? "Select at least one note with typed text." : "Select at least one unit." : dueCount ? `${dueCount} cards are in today's session.` : futureDue ? `Nothing is due now. Next review ${relativeDueTime(futureDue)}.` : "No flashcards are available.";
  $("#custom-anki-daily-new").textContent = dailyPlan.newCards.length;
  $("#custom-anki-daily-review").textContent = reviewCount;
  $("#start-custom-flashcards").disabled = factBankMissingSide || !deck.cards.length;
  $('[data-custom-study-mode="anki"]').disabled = Boolean(frozen) || factBankMissingSide || !dueCount;
  $("#start-custom-questions").disabled = state.customQuestionModeSelector === "essay" ? !essayQuestions.length : !regularQuestions.length;
  $('[data-custom-study-mode="feynman"]').disabled = !(deck.feynmanPrompts || []).length;
  $("#start-custom-questions").closest(".custom-study-option-card").hidden = false;
  $('[data-custom-study-mode="feynman"]').closest(".custom-study-option-card").hidden = false;
  configureCustomReviewCount("#custom-regular-count", deck.cards.length);
  configureCustomReviewCount("#custom-questions-count", regularQuestions.length);
  const selectedPromptStillExists = essayQuestions.some((question) => question.id === state.customEssayPromptId);
  if (!selectedPromptStillExists) state.customEssayPromptId = "";
  renderEssayPromptPicker();
  renderCustomQuestionModeSelector();
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
  const selectors = { regular: "#custom-regular-count", scroll: "#custom-regular-count", matching: "#custom-regular-count", questions: "#custom-questions-count" };
  const input = $(selectors[mode]);
  if (!input) return available;
  const count = Math.min(available, Math.max(1, Math.floor(Number(input.value) || available)));
  input.value = String(count);
  return count;
}

const CUSTOM_FLASHCARD_MODES = [
  { id: "regular", label: "Classic", detail: "One at a time" },
  { id: "scroll", label: "Scroll", detail: "All cards" },
  { id: "matching", label: "Matching", detail: "Match answers" },
];

function renderCustomFlashcardModeSelector() {
  const selectedIndex = Math.max(0, CUSTOM_FLASHCARD_MODES.findIndex((mode) => mode.id === state.customFlashcardModeSelector));
  const selected = CUSTOM_FLASHCARD_MODES[selectedIndex];
  $("#selected-custom-flashcard-mode").innerHTML = `<strong>${selected.label}</strong><small>${selected.detail}</small>`;
  $$(".flashcard-mode-dots i").forEach((dot, index) => dot.classList.toggle("active", index === selectedIndex));
}

function moveCustomFlashcardMode(direction) {
  const current = Math.max(0, CUSTOM_FLASHCARD_MODES.findIndex((mode) => mode.id === state.customFlashcardModeSelector));
  state.customFlashcardModeSelector = CUSTOM_FLASHCARD_MODES[(current + direction + CUSTOM_FLASHCARD_MODES.length) % CUSTOM_FLASHCARD_MODES.length].id;
  renderCustomFlashcardModeSelector();
}

const CUSTOM_QUESTION_MODES = [
  { id: "normal", label: "Regular", detail: "Question worksheet" },
  { id: "essay", label: "Essay", detail: "Prompt and writing space" },
];

function renderCustomQuestionModeSelector() {
  const selectedIndex = Math.max(0, CUSTOM_QUESTION_MODES.findIndex((mode) => mode.id === state.customQuestionModeSelector));
  const selected = CUSTOM_QUESTION_MODES[selectedIndex];
  $("#selected-custom-question-mode").innerHTML = `<strong>${selected.label}</strong><small>${selected.detail}</small>`;
  $$(".question-mode-dots i").forEach((dot, index) => dot.classList.toggle("active", index === selectedIndex));
  $("#custom-question-count-picker").hidden = selected.id === "essay";
  $("#essay-start-options").hidden = selected.id !== "essay";
  const deck = state.selectedCustomDeckId ? findStudyDeck(state.selectedCustomDeckId) : null;
  const available = deck ? (deck.questions || []).some((question) => selected.id === "essay" ? question.type === "essay" : question.type !== "essay") : false;
  $("#start-custom-questions").disabled = !available;
}

function cycleQuestionPracticeMode(direction) {
  const current = Math.max(0, CUSTOM_QUESTION_MODES.findIndex((mode) => mode.id === state.customQuestionModeSelector));
  state.customQuestionModeSelector = CUSTOM_QUESTION_MODES[(current + direction + CUSTOM_QUESTION_MODES.length) % CUSTOM_QUESTION_MODES.length].id;
  renderCustomQuestionModeSelector();
}

function startCustomReview(mode) {
  const deck = findStudyDeck(state.selectedCustomDeckId);
  if (!deck) return;
  if (mode === "anki" && frozenAnkiDeck(deck.id)) { showToast("Resume this deck before starting Anki."); return; }
  state.customReviewMode = mode;
  state.customAnkiBatchSession = false;
  state.customAnkiActiveOwners = mode === "anki" ? [{ id: deck.id, target: "deck" }] : [];
  if (mode === "essay") {
    const essays = (deck.questions || []).filter((question) => question.type === "essay");
    const selected = state.customEssayPromptId ? essays.find((question) => question.id === state.customEssayPromptId) : shuffleInPlace([...essays])[0];
    state.customReviewCards = selected ? [{ ...selected, front: selected.prompt, back: selected.answer }] : [];
  } else if (mode === "questions") {
    const questions = (deck.questions || []).map((question) => {
      const normalized = typedQuestionAsCloze(question);
      return { ...normalized, front: normalized.prompt, back: normalized.answer };
    }).filter((question) => question.type !== "essay");
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
  state.customMatchingAnswerOrder = mode === "matching" ? shuffleInPlace(state.customReviewCards.map((_, index) => index)) : [];
  state.customQuestionAnswered = false;
  state.customFeynmanStartedAt = null;
  state.customEssayStartedAt = null;
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
  window.clearInterval(customEssayTimerHandle);
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
  const modeLabels = { regular: ["Front", "Back", "Flashcard review"], scroll: ["Front", "Back", "Flashcard scroll"], matching: ["Term", "Answer", "Flashcard matching"], anki: ["Front", "Back", "Anki review"], questions: ["Question", "Answer", "Question practice"], essay: ["Prompt", "Checklist", "Essay practice"], feynman: ["Prompt", "Self-check", "Feynman practice"] };
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
  const isEssay = state.customReviewMode === "essay";
  const isFeynman = state.customReviewMode === "feynman";
  const isScroll = state.customReviewMode === "scroll";
  const isMatching = state.customReviewMode === "matching";
  $("#custom-question-practice").hidden = !isQuestions;
  $("#custom-essay-practice").hidden = !isEssay;
  $("#custom-feynman-practice").hidden = !isFeynman;
  $("#custom-flashcard-scroll").hidden = !isScroll;
  $("#custom-matching-practice").hidden = !isMatching;
  $("#custom-review-card").hidden = isQuestions || isEssay || isFeynman || isScroll || isMatching;
  $("#custom-review-progress").textContent = isAnki
    ? `${state.customReviewCards.length} ${state.customReviewCards.length === 1 ? "card" : "cards"} remaining`
    : isQuestions
      ? `${state.customReviewCards.length} ${state.customReviewCards.length === 1 ? "question" : "questions"} · scroll to work through them`
      : isEssay
        ? `${questionTypeLabel(card.type)} · ${card.recommendedMinutes || 40} suggested minutes`
      : isScroll
        ? `${state.customReviewCards.length} ${state.customReviewCards.length === 1 ? "card" : "cards"} · scroll to review`
        : isMatching
          ? `0 of ${state.customReviewCards.length} matched`
      : `${labels[0]} ${state.customReviewPosition + 1} of ${state.customReviewCards.length}`;
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
  $("#custom-regular-controls").hidden = isAnki || isQuestions || isEssay || isFeynman || isScroll || isMatching;
  $("#custom-anki-ratings").hidden = !isAnki || !state.customReviewWasRevealed;
  $("#custom-review-reveal").hidden = isQuestions || isEssay || isFeynman || isScroll || isMatching || state.customReviewRevealed;
  $("#custom-anki-session-counts").hidden = !isAnki;
  $("#delete-custom-anki-card").hidden = !isAnki || state.selectedCustomDeckBuiltIn;
  $("#custom-review-time").hidden = !isAnki;
  $("#custom-review-previous").disabled = state.customReviewPosition === 0;
  $("#custom-review-next").textContent = state.customReviewPosition === state.customReviewCards.length - 1 ? "Finish" : "Next →";
  if (isQuestions) {
    renderCustomQuestionPractice();
    return;
  }
  if (isEssay) {
    renderCustomEssayPractice(card);
    return;
  }
  if (isFeynman) {
    renderCustomFeynmanPractice(card);
    return;
  }
  if (isScroll) {
    renderCustomFlashcardScroll();
    return;
  }
  if (isMatching) {
    renderCustomMatchingPractice();
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

function flashcardScrollFace(card, revealed) {
  const text = revealed ? card.back : card.front;
  const image = safeQuestionResourceUrl(revealed ? card.backImage : card.frontImage);
  const equation = revealed && card.equation ? `<span class="anki-equation" aria-label="Equation">${textbookEquationHtml(card.equation)}</span>` : "";
  return `<span>${revealed ? "Back" : "Front"}</span>${image ? `<img src="${escapeHtml(image)}" alt="${revealed ? "Back" : "Front"} image">` : ""}<strong>${equation}${text ? studyTextHtml(text) : "Visual card"}</strong>`;
}

function renderCustomFlashcardScroll() {
  const list = $("#custom-flashcard-scroll-list");
  list.innerHTML = state.customReviewCards.map((card, index) => `<button type="button" class="custom-flashcard-scroll-card" data-scroll-flashcard="${index}" aria-pressed="false">${flashcardScrollFace(card, false)}</button>`).join("");
  list.onclick = (event) => {
    const button = event.target.closest("[data-scroll-flashcard]");
    if (!button) return;
    const revealed = button.dataset.revealed !== "true";
    button.dataset.revealed = String(revealed);
    button.classList.toggle("revealed", revealed);
    button.setAttribute("aria-pressed", String(revealed));
    button.innerHTML = flashcardScrollFace(state.customReviewCards[Number(button.dataset.scrollFlashcard)], revealed);
  };
  $$('[data-finish-flashcard-scroll]', $("#custom-flashcard-scroll")).forEach((button) => {
    button.onclick = () => { recordStudyActivity(); closeCustomReview(); };
  });
}

function matchingPlainText(value) {
  const element = document.createElement("div");
  element.innerHTML = String(value || "");
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function markCustomMatchingExpandableTiles(bank) {
  $$("[data-matching-tile]", bank).forEach((tile) => {
    const text = $(".custom-matching-tile-text", tile);
    const expandable = Boolean(text && text.scrollHeight > text.clientHeight + 1);
    tile.dataset.matchingExpandable = String(expandable);
    if (expandable) tile.insertAdjacentHTML("beforeend", `<small class="custom-matching-expand-hint">Double-click to expand</small>`);
  });
}

function renderCustomMatchingPractice() {
  const bank = $("#custom-matching-bank");
  const list = $("#custom-matching-list");
  bank.innerHTML = state.customMatchingAnswerOrder.map((answerIndex) => {
    const answer = matchingPlainText(state.customReviewCards[answerIndex]?.back) || `Answer ${answerIndex + 1}`;
    return `<button type="button" class="custom-matching-tile" draggable="true" data-matching-tile="${answerIndex}" data-matching-expandable="false" aria-expanded="false" aria-label="Answer tile: ${escapeHtml(answer)}"><span class="custom-matching-tile-text">${escapeHtml(answer)}</span></button>`;
  }).join("");
  markCustomMatchingExpandableTiles(bank);
  list.innerHTML = state.customReviewCards.map((card, index) => `<div class="custom-matching-row" data-matching-row="${index}"><div class="custom-matching-front">${studyTextHtml(card.front || `Card ${index + 1}`)}</div><div class="custom-matching-drop" data-matching-drop="${index}" role="button" tabindex="0" aria-label="Drop answer for ${escapeHtml(matchingPlainText(card.front) || `card ${index + 1}`)}"><span>Drop answer here</span></div></div>`).join("");
  const practice = $("#custom-matching-practice");
  window.clearTimeout(customMatchingClickTimerHandle);
  practice.dataset.selectedAnswer = "";
  practice.ondragstart = (event) => {
    const tile = event.target.closest("[data-matching-tile]");
    if (!tile || tile.disabled) return;
    event.dataTransfer.setData("text/plain", tile.dataset.matchingTile);
    event.dataTransfer.effectAllowed = "move";
    tile.classList.add("dragging");
  };
  practice.ondragend = (event) => event.target.closest("[data-matching-tile]")?.classList.remove("dragging");
  practice.ondragover = (event) => {
    const target = event.target.closest("[data-matching-drop], [data-matching-bank]");
    if (!target || target.classList.contains("locked")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };
  practice.ondrop = (event) => {
    const target = event.target.closest("[data-matching-drop], [data-matching-bank]");
    if (!target || target.classList.contains("locked")) return;
    event.preventDefault();
    const answerIndex = Number(event.dataTransfer.getData("text/plain"));
    if (target.matches("[data-matching-bank]")) returnMatchingTileToBank(answerIndex);
    placeMatchingTile(Number(target.dataset.matchingDrop), answerIndex);
  };
  practice.onclick = (event) => {
    const target = event.target;
    window.clearTimeout(customMatchingClickTimerHandle);
    customMatchingClickTimerHandle = window.setTimeout(() => handleCustomMatchingClick(target), 220);
  };
  practice.ondblclick = (event) => {
    const tile = event.target.closest("[data-matching-tile]");
    if (!tile || tile.dataset.matchingExpandable !== "true") return;
    event.preventDefault();
    window.clearTimeout(customMatchingClickTimerHandle);
    const expanded = !tile.classList.contains("expanded");
    tile.classList.toggle("expanded", expanded);
    tile.setAttribute("aria-expanded", String(expanded));
    const hint = $(".custom-matching-expand-hint", tile);
    if (hint) hint.textContent = expanded ? "Double-click to collapse" : "Double-click to expand";
  };
  practice.onkeydown = (event) => {
    const drop = event.target.closest("[data-matching-drop]");
    if (!drop || !["Enter", " "].includes(event.key) || practice.dataset.selectedAnswer === "") return;
    event.preventDefault();
    placeMatchingTile(Number(drop.dataset.matchingDrop), Number(practice.dataset.selectedAnswer));
  };
  const submit = $("#custom-matching-submit");
  submit.dataset.complete = "false";
  submit.textContent = "Submit answers";
  $("#custom-matching-score").textContent = `0 of ${state.customReviewCards.length} correct`;
}

function handleCustomMatchingClick(target) {
  const practice = $("#custom-matching-practice");
  const tile = target.closest("[data-matching-tile]");
    if (tile && !tile.disabled) {
      const tileZone = tile.closest("[data-matching-drop]");
      if (tileZone && practice.dataset.selectedAnswer !== "" && practice.dataset.selectedAnswer !== tile.dataset.matchingTile) {
        placeMatchingTile(Number(tileZone.dataset.matchingDrop), Number(practice.dataset.selectedAnswer));
        return;
      }
      const selected = practice.dataset.selectedAnswer === tile.dataset.matchingTile;
      practice.dataset.selectedAnswer = selected ? "" : tile.dataset.matchingTile;
      practice.classList.toggle("tile-selected", !selected);
      $$('[data-matching-tile]', practice).forEach((item) => item.classList.toggle("selected", !selected && item === tile));
      return;
    }
    const drop = target.closest("[data-matching-drop]");
    const row = target.closest("[data-matching-row]");
    const destination = drop || (row ? $("[data-matching-drop]", row) : null);
    if (!destination || destination.classList.contains("locked") || practice.dataset.selectedAnswer === "") return;
    placeMatchingTile(Number(destination.dataset.matchingDrop), Number(practice.dataset.selectedAnswer));
}

function clearMatchingTileSelection() {
  const practice = $("#custom-matching-practice");
  practice.dataset.selectedAnswer = "";
  practice.classList.remove("tile-selected");
  $$('[data-matching-tile]', practice).forEach((tile) => tile.classList.remove("selected"));
}

function refreshMatchingDropZone(zone) {
  zone.classList.toggle("filled", Boolean($("[data-matching-tile]", zone)));
}

function returnMatchingTileToBank(answerIndex) {
  const tile = $(`[data-matching-tile="${answerIndex}"]`, $("#custom-matching-practice"));
  if (!tile || tile.disabled) return;
  const previousZone = tile.closest("[data-matching-drop]");
  $("#custom-matching-bank").append(tile);
  if (previousZone) {
    refreshMatchingDropZone(previousZone);
    previousZone.closest("[data-matching-row]").classList.remove("incorrect");
  }
  clearMatchingTileSelection();
}

function placeMatchingTile(rowIndex, answerIndex) {
  const zone = $(`[data-matching-drop="${rowIndex}"]`, $("#custom-matching-list"));
  const tile = $(`[data-matching-tile="${answerIndex}"]`, $("#custom-matching-practice"));
  if (!zone || !tile || tile.disabled || zone.classList.contains("locked")) return;
  const previousZone = tile.closest("[data-matching-drop]");
  const displacedTile = $("[data-matching-tile]", zone);
  if (displacedTile && displacedTile !== tile) $("#custom-matching-bank").append(displacedTile);
  zone.append(tile);
  if (previousZone && previousZone !== zone) {
    refreshMatchingDropZone(previousZone);
    previousZone.closest("[data-matching-row]").classList.remove("incorrect");
  }
  refreshMatchingDropZone(zone);
  zone.closest("[data-matching-row]").classList.remove("incorrect");
  clearMatchingTileSelection();
}

function submitCustomMatching() {
  const submit = $("#custom-matching-submit");
  if (submit.dataset.complete === "true") {
    recordStudyActivity();
    closeCustomReview();
    return;
  }
  let correctCount = 0;
  $$('[data-matching-row]', $("#custom-matching-list")).forEach((row) => {
    const index = Number(row.dataset.matchingRow);
    const zone = $("[data-matching-drop]", row);
    const tile = $("[data-matching-tile]", zone);
    if (row.classList.contains("correct")) {
      correctCount += 1;
      return;
    }
    const correct = Boolean(tile) && Number(tile.dataset.matchingTile) === index;
    row.classList.toggle("correct", correct);
    row.classList.toggle("incorrect", !correct);
    if (correct) {
      zone.classList.add("locked");
      zone.tabIndex = -1;
      tile.draggable = false;
      tile.disabled = true;
      correctCount += 1;
    }
  });
  const total = state.customReviewCards.length;
  $("#custom-matching-score").textContent = `${correctCount} of ${total} correct`;
  $("#custom-review-progress").textContent = `${correctCount} of ${total} matched`;
  if (correctCount === total) {
    submit.dataset.complete = "true";
    submit.textContent = "Finish matching";
    showToast("All matches are correct.");
  } else {
    submit.textContent = "Check answers again";
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

function safeQuestionResourceUrl(value) {
  const raw = String(value || "").trim();
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(raw)) return raw;
  if (/^(?:\.\/|\.\.\/)/.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function customQuestionChoiceDetails(question) {
  const singleChoiceTypes = new Set(["mcq", "stimulus_mcq", "diagram_label"]);
  const isMultipleSelect = question.type === "multiple_select";
  const options = question.type === "true_false" ? ["True", "False"] : (question.options || []);
  const isChoice = question.type === "true_false" || ((singleChoiceTypes.has(question.type) || isMultipleSelect) && options.length > 1);
  return { isChoice, isMultipleSelect, options };
}

function essayTypeLabel(type) {
  return ({ argument: "Argument", rhetorical_analysis: "Rhetorical analysis", synthesis: "Synthesis", literary_argument: "Literary argument", prose_analysis: "Prose analysis", poetry_analysis: "Poetry analysis", drama_analysis: "Drama analysis" })[type] || "Essay";
}

function renderCustomEssayClock() {
  if (!state.customEssayTimerEnabled || !state.customEssayStartedAt) return;
  const totalMs = state.customEssayTimeMinutes * 60 * 1000;
  const remaining = Math.max(0, totalMs - (Date.now() - state.customEssayStartedAt));
  $("#custom-essay-clock").textContent = formatElapsed(remaining);
  $("#custom-essay-clock").classList.toggle("expired", remaining === 0);
  if (!remaining) window.clearInterval(customEssayTimerHandle);
}

function startCustomEssayTimer() {
  window.clearInterval(customEssayTimerHandle);
  if (!state.customEssayTimerEnabled) return;
  state.customEssayStartedAt = Date.now();
  renderCustomEssayClock();
  customEssayTimerHandle = window.setInterval(renderCustomEssayClock, 250);
}

function renderCustomEssayPractice(question) {
  $("#custom-essay-type").textContent = essayTypeLabel(question.essayType);
  $("#custom-essay-title").textContent = question.title || "Essay practice";
  $("#custom-essay-prompt-text").textContent = question.prompt || "";
  $("#custom-essay-checklist-text").textContent = question.answer || "Develop a defensible thesis, use specific evidence, and explain your reasoning.";
  $("#custom-essay-response").value = "";
  const sources = Array.isArray(question.sources) ? question.sources : [];
  $("#custom-essay-sources").innerHTML = sources.map((source, index) => {
    const sourceUrl = safeQuestionResourceUrl(source.sourceUrl);
    const title = source.title || `Source ${String.fromCharCode(65 + index)}`;
    const byline = [source.author, source.date].filter(Boolean).join(" · ");
    const visual = source.visual && typeof source.visual === "object" ? source.visual : null;
    const imageUrl = visual?.type === "image" ? safeQuestionResourceUrl(visual.url) : "";
    const imageVisual = imageUrl ? `<figure class="essay-source-visual"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(visual.alt || title)}" loading="lazy" referrerpolicy="no-referrer"><figcaption>${escapeHtml(visual.caption || "Visual source")}</figcaption></figure>` : "";
    const columns = visual?.type === "table" && Array.isArray(visual.columns) ? visual.columns : [];
    const rows = visual?.type === "table" && Array.isArray(visual.rows) ? visual.rows : [];
    const tableVisual = columns.length && rows.length ? `<figure class="essay-source-visual essay-source-table"><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(String(column))}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((_, cellIndex) => `<td>${escapeHtml(String(Array.isArray(row) ? (row[cellIndex] ?? "") : ""))}</td>`).join("")}</tr>`).join("")}</tbody></table><figcaption>${escapeHtml(visual.caption || "Source data")}</figcaption></figure>` : "";
    return `<article class="custom-essay-source"><header><span>Source ${String.fromCharCode(65 + index)}</span><div><strong>${escapeHtml(title)}</strong>${byline ? `<small>${escapeHtml(byline)}</small>` : ""}</div>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Original</a>` : ""}</header>${imageVisual || tableVisual}<p>${escapeHtml(source.excerpt || "")}</p>${source.rights ? `<footer>${escapeHtml(source.rights)}</footer>` : ""}</article>`;
  }).join("");
  $("#custom-essay-sources").hidden = !sources.length;
  $("#custom-essay-clock").hidden = !state.customEssayTimerEnabled;
  state.customEssayStartedAt = null;
  startCustomEssayTimer();
}

function customQuestionImageHtml(question, index) {
  const imageUrl = safeQuestionResourceUrl(question.image);
  if (!imageUrl) return "";
  const sourceUrl = safeQuestionResourceUrl(question.imageSourceUrl);
  const credit = question.imageCredit ? `Image: ${question.imageCredit}` : "Open image source";
  const caption = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(credit)}</a>`
    : (question.imageCredit ? escapeHtml(`Image: ${question.imageCredit}`) : "");
  return `<figure class="custom-question-visual" data-question-visual="${index}"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(question.imageAlt || "Question reference image")}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
}

function renderCustomQuestionPractice() {
  const list = $("#custom-question-scroll-list");
  list.innerHTML = state.customReviewCards.map((question, index) => {
    const { isChoice, isMultipleSelect, options } = customQuestionChoiceDetails(question);
    const choices = isChoice ? `<div class="custom-question-choices${isMultipleSelect ? " multiple-select" : ""}">${options.map((option, optionIndex) => `<button type="button" data-scroll-question-choice="${index}" data-question-option-index="${optionIndex}" aria-pressed="false"><span>${String.fromCharCode(65 + optionIndex)}</span>${escapeHtml(option)}</button>`).join("")}</div>` : "";
    const response = isChoice ? "" : `<label class="custom-question-response">Your answer<input type="text" data-scroll-question-response="${index}" placeholder="Type the missing word or phrase…" autocomplete="off"></label>`;
    const checkButton = !isChoice || isMultipleSelect ? `<button type="button" class="button secondary-button custom-question-check" data-check-scroll-question="${index}">Check answer</button>` : "";
    return `<article class="custom-question-item" data-scroll-question-index="${index}">
      <div class="custom-question-item-head"><span class="custom-question-number">${index + 1}</span><span class="custom-question-type">${escapeHtml(questionTypeLabel(question.type))}</span></div>
      ${question.stimulus ? `<div class="custom-question-stimulus">${escapeHtml(question.stimulus)}</div>` : ""}
      ${customQuestionImageHtml(question, index)}
      <h3>${studyTextHtml(question.prompt)}</h3>
      ${choices}${response}
      <p class="custom-question-feedback" data-scroll-question-feedback="${index}" aria-live="polite"></p>
      ${checkButton}
    </article>`;
  }).join("");
  $$('[data-question-visual] img', list).forEach((image) => {
    image.addEventListener("error", () => { image.closest("[data-question-visual]").hidden = true; }, { once: true });
  });
  list.onclick = (event) => {
    const choice = event.target.closest("[data-scroll-question-choice]");
    if (choice) {
      const index = Number(choice.dataset.scrollQuestionChoice);
      const question = state.customReviewCards[index];
      if (customQuestionChoiceDetails(question).isMultipleSelect) {
        choice.classList.toggle("selected");
        choice.setAttribute("aria-pressed", String(choice.classList.contains("selected")));
      } else answerScrollQuestion(index, customQuestionChoiceDetails(question).options[Number(choice.dataset.questionOptionIndex)]);
      return;
    }
    const check = event.target.closest("[data-check-scroll-question]");
    if (check) answerScrollQuestion(Number(check.dataset.checkScrollQuestion));
  };
  list.onkeydown = (event) => {
    if (event.key === "Enter" && event.target.matches("[data-scroll-question-response]")) {
      event.preventDefault();
      answerScrollQuestion(Number(event.target.dataset.scrollQuestionResponse));
    }
  };
  $$('[data-finish-question-scroll]', $("#custom-question-practice")).forEach((button) => {
    button.onclick = () => { recordStudyActivity(); closeCustomReview(); };
  });
  updateCustomQuestionScrollProgress();
}

function updateCustomQuestionScrollProgress() {
  const answered = $$('.custom-question-item[data-answered="true"]', $("#custom-question-scroll-list")).length;
  const total = state.customReviewCards.length;
  $("#custom-review-progress").textContent = answered ? `${answered} of ${total} answered` : `${total} ${total === 1 ? "question" : "questions"} · scroll to work through them`;
}

function answerScrollQuestion(index, response) {
  const item = $(`[data-scroll-question-index="${index}"]`, $("#custom-question-scroll-list"));
  if (!item || item.dataset.answered === "true") return;
  const question = state.customReviewCards[index];
  const { isMultipleSelect, options } = customQuestionChoiceDetails(question);
  const selectedButtons = isMultipleSelect ? $$("[data-scroll-question-choice].selected", item) : [];
  const selectedAnswers = selectedButtons.map((button) => options[Number(button.dataset.questionOptionIndex)]);
  const responseInput = $("[data-scroll-question-response]", item);
  const given = String(response ?? (isMultipleSelect ? selectedAnswers.join(" | ") : responseInput?.value)).trim();
  if (!given) { responseInput?.focus(); return; }
  const expected = String(question.answer).trim();
  const exactQuestion = ["mcq", "true_false", "cloze", "stimulus_mcq", "diagram_label", "multiple_select"].includes(question.type);
  const normalizedSet = (value) => String(value).split(/\s*\|\s*|\s*,\s*/).map((item) => item.trim().toLowerCase()).filter(Boolean).sort().join("|");
  const correct = isMultipleSelect ? normalizedSet(given) === normalizedSet(expected) : given.localeCompare(expected, undefined, { sensitivity: "base" }) === 0;
  item.dataset.answered = "true";
  item.classList.add(correct ? "answered-correct" : "answered-incorrect");
  $$("[data-scroll-question-choice]", item).forEach((button) => {
    button.disabled = true;
    const option = options[Number(button.dataset.questionOptionIndex)];
    const expectedOptions = isMultipleSelect ? normalizedSet(expected).split("|") : [expected.toLowerCase()];
    if (expectedOptions.includes(option.toLowerCase())) button.classList.add("correct");
    else if ((isMultipleSelect && selectedAnswers.includes(option)) || option.localeCompare(given, undefined, { sensitivity: "base" }) === 0) button.classList.add("incorrect");
  });
  if (responseInput) responseInput.disabled = true;
  const checkButton = $("[data-check-scroll-question]", item);
  if (checkButton) checkButton.disabled = true;
  const feedback = $("[data-scroll-question-feedback]", item);
  feedback.classList.add(!exactQuestion || correct ? "correct" : "incorrect");
  feedback.innerHTML = exactQuestion
    ? (correct ? "Correct." : `<span>Not quite. Correct answer:</span><span class="custom-question-answer-content">${studyTextHtml(expected)}</span>`)
    : `<span>Model answer:</span><span class="custom-question-answer-content">${studyTextHtml(expected)}</span>`;
  if (question.explanation) feedback.innerHTML += `<span class="custom-question-explanation">${studyTextHtml(question.explanation)}</span>`;
  updateCustomQuestionScrollProgress();
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

async function deleteCurrentCustomAnkiCard() {
  if (state.customReviewMode !== "anki") return;
  const card = state.customReviewCards[state.customReviewPosition];
  const deckId = state.selectedCustomDeckId;
  if (!card?.id || !deckId) return;
  if (!await window.AppDialog.confirm("Remove this card from your personal study set? It will also be removed from future Classic and Anki reviews.", { title: "Remove flashcard?", confirmLabel: "Remove card", danger: true })) return;
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
  if (["#courses", "#dashboard", "#flashcards", "#create", "#notes", "#export"].includes(target)) {
    event.preventDefault();
    showAppView(target.slice(1));
  }
}));
$$('.mobile-nav a[href="#courses"], .mobile-nav a[href="#dashboard"], .mobile-nav a[href="#flashcards"], .mobile-nav a[href="#create"], .mobile-nav a[href="#notes"], .mobile-nav a[href="#export"]').forEach((item) => item.addEventListener("click", (event) => {
  event.preventDefault();
  showAppView(item.getAttribute("href").slice(1));
}));
$$('[data-browse-library-view]').forEach((button) => button.addEventListener("click", () => setBrowseLibraryView(button.dataset.browseLibraryView)));
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
  const menu = $("#note-create-menu");
  if (menu) menu.open = false;
  createNotebookNote(type);
});
document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-note-notebook-select]");
  if (!select || !activeNoteId) return;
  moveNotebookNote(activeNoteId, select.value || null);
  showToast(select.value ? "Note moved to notebook." : "Note moved to Unfiled notes.");
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
runStartupStep("Interface preferences", applyInterfacePreferences);
runStartupStep("Date greeting", setDateGreeting);
runStartupStep("Profile", initializeProfile);
runStartupStep("Google account", initializeGoogleAccount);
runStartupStep("Study streak", renderStudyStreak);
runStartupStep("Textbook migration", migrateEnrolledTextbooksToStudySets);
runStartupStep("Flashcard draft", renderCustomDraft);
runStartupStep("Question draft", renderCustomQuestionDraft);
runStartupStep("Feynman draft", renderCustomFeynmanDraft);
runStartupStep("Study sets", renderCustomDecks);
runStartupStep("Study alarms", restoreTasks);
runStartupStep("Active Anki selection", restoreActiveAnkiSelections);
runStartupStep("Active Anki decks", renderActiveAnkiDecks);
runStartupStep("Alarm checkboxes", () => $$(".task-item input[type='checkbox']").forEach(wireTaskCheckbox));
window.requestAnimationFrame(() => window.setTimeout(hydrateAddedCollections, 0));
const scheduleCatalogMetadata = window.requestIdleCallback
  ? (callback) => window.requestIdleCallback(callback, { timeout: 3500 })
  : (callback) => window.setTimeout(callback, 1400);
scheduleCatalogMetadata(() => hydrateCuratedQuestionCounts().catch(() => {}));

$("#view-all-courses")?.addEventListener("click", () => $("#course-shelf")?.scrollIntoView({ behavior: "smooth", block: "center" }));
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
  $("#built-in-study-search").value = event.currentTarget.value;
  state.studyCatalogPage = 0;
  renderBuiltInDecks();
  showAppView("courses");
});

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
window.receiveNotebookDocumentImport = async (payload) => {
  try {
    notebookDocumentImportPending = false;
    if (payload?.extension === "pptx") await createImportedPowerPointNotebookNote(payload);
    else createImportedNotebookNote(payload);
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

function assignActiveCustomTopic(items) {
  return items.map((item) => ({ ...item, customTopicId: item.customTopicId || state.activeCustomTopicId || "" }));
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
      const questionResult = appendUniqueStudyItems(state.customQuestionDraft, generateQuestionsFromCards(generated, notes), (question) => normalizedStudyItem(question.prompt));
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
    const generated = assignActiveCustomTopic(generateCardsFromNotes(notes));
    if (!generated.length) { showToast("I couldn’t find clear facts. Try term: definition or question — answer formatting."); return; }
    state.customImportSource = null;
    if (state.appendNotesToExistingSet && savedDeck) {
      const cardResult = appendUniqueStudyItems(state.customDraft, generated, (card) => normalizedStudyItem(card.front || card.frontImage));
      const questionResult = appendUniqueStudyItems(state.customQuestionDraft, assignActiveCustomTopic(generateQuestionsFromCards(generated, notes)), (question) => normalizedStudyItem(question.prompt));
      const promptResult = appendUniqueStudyItems(state.customFeynmanDraft, assignActiveCustomTopic(generateFeynmanPrompts(notes, generated)), (item) => normalizedStudyItem(item.prompt));
      state.customDraft = cardResult.items;
      state.customQuestionDraft = questionResult.items;
      state.customFeynmanDraft = promptResult.items;
      state.appendNotesToExistingSet = false;
      state.lastAppendSummary = { cards: cardResult.added, questions: questionResult.added, prompts: promptResult.added };
    } else {
      const manualCards = state.customDraft.filter((card) => card.manual);
      const manualQuestions = state.customQuestionDraft.filter((question) => question.source === "Manually created");
      state.customDraft = [...generated, ...manualCards];
      state.customQuestionDraft = [...assignActiveCustomTopic(generateQuestionsFromCards(generated, notes)), ...manualQuestions];
      const manualFeynmanPrompts = state.customFeynmanDraft.filter((item) => item.manual);
      state.customFeynmanDraft = [...assignActiveCustomTopic(generateFeynmanPrompts(notes, generated)), ...manualFeynmanPrompts];
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
$("#add-custom-unit").addEventListener("click", () => {
  const unitNumber = state.customUnits.length + 1;
  const unit = { id: makeLocalId("unit"), name: `Unit ${unitNumber}`, topics: [] };
  const topic = { id: makeLocalId("topic"), name: `${unitNumber}.1 New subtopic` };
  unit.topics.push(topic);
  state.customUnits.push(unit);
  state.activeCustomTopicId = topic.id;
  renderCustomUnitBuilder();
});
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
  state.customDraft.push({ id: makeLocalId("card"), front, back, frontImage: state.manualFrontImage, backImage: state.manualBackImage, customTopicId: state.activeCustomTopicId || "", manual: true });
  $("#manual-card-front").value = "";
  $("#manual-card-back").value = "";
  renderManualDefinitionSuggestions();
  state.manualFrontImage = "";
  state.manualBackImage = "";
  renderManualImagePreview("front");
  renderManualImagePreview("back");
  renderCustomDraft();
  $("#manual-card-front").focus();
  showToast("Manual card added. Choose Update set to keep it.");
});

function normalizedSuggestionTerm(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\b([a-z]+)'s\b/g, "$1s")
    .replace(/\b([a-z]+s)'\b/g, "$1")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function definitionSourceMatchesContext(source, context) {
  if (!context) return false;
  const normalizedSource = normalizedSuggestionTerm(source);
  if (normalizedSource && (context.includes(normalizedSource) || normalizedSource.includes(context))) return true;
  if (/\b(?:apush|ap us history|us history|american history)\b/.test(context) && normalizedSource === "ap u s history") return true;
  if (/\b(?:apgov|ap gov|ap government)\b/.test(context) && normalizedSource === "ap u s government and politics") return true;
  return false;
}

function suggestionEditDistance(left, right) {
  if (left === right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  let beforePrevious = previous.slice();
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + Number(left[leftIndex - 1] !== right[rightIndex - 1]);
      let distance = Math.min(current[rightIndex - 1] + 1, previous[rightIndex] + 1, substitution);
      if (leftIndex > 1 && rightIndex > 1 && left[leftIndex - 1] === right[rightIndex - 2] && left[leftIndex - 2] === right[rightIndex - 1]) {
        distance = Math.min(distance, beforePrevious[rightIndex - 2] + 1);
      }
      current.push(distance);
    }
    beforePrevious = previous.slice();
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function suggestionMatchScore(query, front) {
  if (front === query) return 0;
  if (front.startsWith(`${query} `)) return 1;
  if (front.includes(query)) return 2;
  if (query.length < 4) return Number.POSITIVE_INFINITY;
  const queryWordCount = query.split(" ").length;
  const frontWords = front.split(" ");
  const windows = frontWords.length > queryWordCount
    ? frontWords.slice(0, frontWords.length - queryWordCount + 1).map((_, index) => frontWords.slice(index, index + queryWordCount).join(" "))
    : [front];
  const distance = Math.min(...windows.map((candidate) => suggestionEditDistance(query, candidate)));
  const tolerance = query.length < 6 ? 1 : Math.min(3, Math.floor(query.length / 6));
  return distance <= tolerance ? 3 + (distance / 10) : Number.POSITIVE_INFINITY;
}

function localDefinitionSuggestions(term) {
  const query = normalizedSuggestionTerm(term);
  if (query.length < 2) return [];
  const context = normalizedSuggestionTerm($("#custom-deck-name")?.value);
  const builtInCards = builtInFlashcardCollections.flatMap((collection) =>
    (collection.units || []).flatMap((unit) => (unit.cards || []).map((card) => ({ ...card, suggestionSource: collection.name }))));
  const personalCards = loadCustomDecks().flatMap((deck) => (deck.cards || []).map((card) => ({ ...card, suggestionSource: deck.name })));
  const draftCards = state.customDraft.map((card) => ({ ...card, suggestionSource: "Current set" }));
  const candidates = [...draftCards, ...personalCards, ...builtInCards];
  const seen = new Set();
  return candidates
    .map((card) => ({ front: String(card.front || "").trim(), back: String(card.back || "").trim(), source: card.suggestionSource || "Study library", normalizedFront: normalizedSuggestionTerm(card.front) }))
    .map((card) => ({ ...card, matchScore: suggestionMatchScore(query, card.normalizedFront) }))
    .filter((card) => card.front && card.back && Number.isFinite(card.matchScore))
    .sort((left, right) => {
      const sourceDifference = Number(!definitionSourceMatchesContext(left.source, context)) - Number(!definitionSourceMatchesContext(right.source, context));
      if (sourceDifference) return sourceDifference;
      return left.matchScore - right.matchScore || left.front.length - right.front.length || left.front.localeCompare(right.front);
    })
    .filter((card) => {
      const key = `${card.front.toLowerCase()}\u0000${card.back.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function renderManualDefinitionSuggestions() {
  const box = $("#manual-definition-suggestions");
  if (!box) return;
  const back = $("#manual-card-back");
  const suggestions = back.value.trim() ? [] : localDefinitionSuggestions($("#manual-card-front").value);
  box.innerHTML = suggestions.map((suggestion, index) => `<button type="button" class="definition-suggestion" data-definition-suggestion="${index}"><span class="definition-suggestion-heading"><strong>${escapeHtml(suggestion.front)}</strong><small>${escapeHtml(suggestion.source)}</small></span><span>${escapeHtml(suggestion.back)}</span></button>`).join("");
  box.hidden = !suggestions.length;
  $$('[data-definition-suggestion]', box).forEach((button) => button.addEventListener("click", () => {
    const suggestion = suggestions[Number(button.dataset.definitionSuggestion)];
    if (!suggestion || back.value.trim()) return;
    back.value = suggestion.back;
    box.hidden = true;
    box.innerHTML = "";
    back.focus();
    showToast("Definition added. You can edit it before adding the card.");
  }));
}

function queueManualDefinitionSuggestions() {
  window.clearTimeout(definitionSuggestionTimerHandle);
  definitionSuggestionTimerHandle = window.setTimeout(renderManualDefinitionSuggestions, 120);
}

$("#manual-card-front").addEventListener("input", queueManualDefinitionSuggestions);
$("#manual-card-back").addEventListener("input", renderManualDefinitionSuggestions);
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
$("#manual-question-prompt").addEventListener("paste", (event) => handleCardPaste(event, { kind: "manual-question", side: "question" }));
$("[data-choose-manual-question-image]").addEventListener("click", () => {
  state.pendingCardImageTarget = { kind: "manual-question", side: "question" };
  $("#flashcard-image-file").click();
});
$("[data-draw-manual-question]").addEventListener("click", () => openDrawingTool({ kind: "manual-question", side: "question" }));
$$('[data-math-manual-question]').forEach((button) => button.addEventListener("click", () => openMathTool({ kind: "manual-question", side: button.dataset.mathManualQuestion })));
$$('[data-code-manual-question]').forEach((button) => button.addEventListener("click", () => openCodeTool({ kind: "manual-question", side: button.dataset.codeManualQuestion })));
$("[data-remove-manual-question-image]").addEventListener("click", (event) => confirmImageRemoval(event.currentTarget, () => applyCardImage({ kind: "manual-question", side: "question" }, "")));
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
$("#save-drawing").addEventListener("click", () => { if (!state.pendingDrawingTarget) return; const questionTarget = state.pendingDrawingTarget.kind.includes("question"); applyCardImage(state.pendingDrawingTarget, drawingCanvas.toDataURL("image/png")); closeDrawingTool(); showToast(questionTarget ? "Drawing added to the question." : "Drawing added to the card."); });
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
$("#clear-draft").addEventListener("click", async () => {
  if (!state.customDraft.length) return;
  if (!await window.AppDialog.confirm(`Clear all ${state.customDraft.length} flashcards from this draft? Questions and Feynman topics will be kept.`, { title: "Clear flashcards?", confirmLabel: "Clear flashcards", danger: true })) return;
  state.customDraft = [];
  renderCustomDraft();
  updateCustomSaveButtons();
  showToast("All flashcards cleared. Choose Update set to save the change.");
});
$("#clear-question-draft").addEventListener("click", async () => {
  if (!state.customQuestionDraft.length) return;
  if (!await window.AppDialog.confirm(`Clear all ${state.customQuestionDraft.length} questions from this draft? Flashcards and Feynman topics will be kept.`, { title: "Clear questions?", confirmLabel: "Clear questions", danger: true })) return;
  state.customQuestionDraft = [];
  renderCustomQuestionDraft();
  updateCustomSaveButtons();
  showToast("All questions cleared. Choose Update set to save the change.");
});
$("#clear-feynman-draft").addEventListener("click", async () => {
  if (!state.customFeynmanDraft.length) return;
  if (!await window.AppDialog.confirm(`Clear all ${state.customFeynmanDraft.length} Feynman topics from this draft? Flashcards and questions will be kept.`, { title: "Clear Feynman topics?", confirmLabel: "Clear topics", danger: true })) return;
  state.customFeynmanDraft = [];
  renderCustomFeynmanDraft();
  updateCustomSaveButtons();
  showToast("All Feynman topics cleared. Choose Update set to save the change.");
});
$("#add-manual-question").addEventListener("click", () => {
  const prompt = $("#manual-question-prompt").value.trim();
  const type = $("#manual-question-type").value;
  const choiceQuestion = isAnswerChoiceQuestion(type);
  const options = choiceQuestion
    ? manualQuestionChoices.map((choice) => choice.trim()).filter(Boolean)
    : questionOptionsFromText($("#manual-question-options").value);
  const selectedChoices = choiceQuestion
    ? [...manualQuestionCorrectChoiceIndexes].map((index) => manualQuestionChoices[index]?.trim()).filter(Boolean)
    : [];
  const answer = choiceQuestion
    ? (type === "mcq" ? (selectedChoices[0] || "") : selectedChoices.join(" | "))
    : ($("#manual-question-answer").value.trim() || (type === "essay" ? "Develop a defensible thesis, use specific evidence, and explain how the evidence supports your reasoning." : ""));
  if (!prompt) { showToast("Add the question first."); $("#manual-question-prompt").focus(); return; }
  if (choiceQuestion && options.length < 2) { showToast("Add at least two answer choices."); return; }
  if (!answer) { showToast(choiceQuestion ? "Mark at least one answer choice as correct." : "Complete the answer."); return; }
  const stimulus = $("#manual-question-stimulus").value.trim();
  const essayDetails = type === "essay" ? { essayType: $("#manual-essay-type").value, recommendedMinutes: Math.max(1, Math.min(180, Number($("#manual-essay-minutes").value) || 40)), sources: essaySourcesFromText($("#manual-question-sources").value) } : {};
  state.customQuestionDraft.push({ id: makeLocalId("question"), type, prompt, answer, options, stimulus, ...essayDetails, image: state.manualQuestionImage, imageSourceUrl: "", customTopicId: state.activeCustomTopicId || "", source: "Manually created" });
  $("#manual-question-prompt").value = "";
  $("#manual-question-answer").value = "";
  $("#manual-question-options").value = "";
  $("#manual-question-stimulus").value = "";
  $("#manual-question-sources").value = "";
  resetManualQuestionChoices();
  state.manualQuestionImage = "";
  renderManualQuestionImagePreview();
  renderCustomQuestionDraft();
  $("#manual-question-prompt").focus();
});
$("#manual-question-choice-list").addEventListener("input", (event) => {
  const input = event.target.closest("[data-manual-choice-text]");
  if (!input) return;
  manualQuestionChoices[Number(input.dataset.manualChoiceText)] = input.value;
});
$("#manual-question-choice-list").addEventListener("change", (event) => {
  const input = event.target.closest("[data-manual-choice-correct]");
  if (!input) return;
  const index = Number(input.dataset.manualChoiceCorrect);
  if ($("#manual-question-type").value === "multiple_select") {
    if (input.checked) manualQuestionCorrectChoiceIndexes.add(index);
    else manualQuestionCorrectChoiceIndexes.delete(index);
  } else {
    manualQuestionCorrectChoiceIndexes = new Set([index]);
  }
});
$("#manual-question-choice-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-manual-choice]");
  if (!button || manualQuestionChoices.length <= 2) return;
  const index = Number(button.dataset.removeManualChoice);
  manualQuestionChoices.splice(index, 1);
  manualQuestionCorrectChoiceIndexes = new Set([...manualQuestionCorrectChoiceIndexes]
    .filter((choiceIndex) => choiceIndex !== index)
    .map((choiceIndex) => choiceIndex > index ? choiceIndex - 1 : choiceIndex));
  if (!manualQuestionCorrectChoiceIndexes.size) manualQuestionCorrectChoiceIndexes.add(0);
  renderManualQuestionChoices();
});
$("#add-manual-question-choice").addEventListener("click", () => {
  if (manualQuestionChoices.length >= 8) { showToast("A question can have up to 8 answer choices."); return; }
  manualQuestionChoices.push("");
  renderManualQuestionChoices();
  $$('[data-manual-choice-text]', $("#manual-question-choice-list")).at(-1)?.focus();
});
$("#manual-question-type").addEventListener("change", updateManualEssayBuilder);
updateManualEssayBuilder();
function addManualFeynmanTopic() {
  const input = $("#manual-feynman-topic");
  const prompt = input.value.trim().replace(/[.!]+$/, "");
  if (!prompt) { input.focus(); showToast("Type a Feynman topic first."); return; }
  state.customFeynmanDraft.push({ id: makeLocalId("feynman"), prompt, customTopicId: state.activeCustomTopicId || "", manual: true });
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
      state.customQuestionDraft = [...generateQuestionsFromCards(generated, notes), ...manualQuestions];
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
$("#my-study-sets-search").addEventListener("input", debounce(renderCustomDecks));
$("#built-in-study-search").addEventListener("input", debounce(() => { state.studyCatalogPage = 0; renderBuiltInDecks(); }));
$("#community-search").addEventListener("input", debounce(loadCommunityLibrary, 350));
$("#community-sort").addEventListener("change", (event) => {
  state.communitySort = event.currentTarget.value;
  renderCommunityLibrary();
});
$$('[data-community-kind]').forEach((button) => button.addEventListener("click", () => {
  state.communityKind = button.dataset.communityKind;
  loadCommunityLibrary();
}));
$("#refresh-my-public-library").addEventListener("click", loadMyPublicLibrary);
$$('[data-my-public-kind]').forEach((button) => button.addEventListener("click", () => {
  state.myPublicKind = button.dataset.myPublicKind;
  renderMyPublicLibrary();
}));
$("#close-deck-preview").addEventListener("click", () => $("#deck-preview-dialog").close());
$$('[data-preview-tab]').forEach((button) => button.addEventListener("click", () => {
  state.previewTab = button.dataset.previewTab;
  renderDeckPreview();
}));
$("#save-previewed-deck").addEventListener("click", async () => {
  const item = state.previewItem;
  if (!item) return;
  if (item.builtInCollectionId) await addFlashcardCollection(item.builtInCollectionId);
  else await saveCommunityItem(item.id);
  renderDeckPreview();
});
$("#community-review-form").addEventListener("submit", submitCommunityReview);
$("#community-report-form").addEventListener("submit", submitCommunityReport);
$("#publish-form").addEventListener("submit", submitCommunityPublication);
$("#publish-description").addEventListener("input", (event) => {
  $("#publish-description-count").textContent = `${event.currentTarget.value.length} / 280`;
});
$("#close-publish-dialog").addEventListener("click", closePublishDialog);
$("#cancel-publish").addEventListener("click", closePublishDialog);
$("#publish-dialog").addEventListener("close", () => { pendingCommunityPublish = null; });
$("#cancel-custom-delete").addEventListener("click", () => { state.pendingCustomDeleteId = null; state.pendingBuiltInDeleteId = null; state.pendingDeleteAllStudySets = false; state.pendingReturnAllBuiltIn = false; state.pendingReturnAllTextbooks = false; showAppView(state.customDeleteReturnView); });
$("#confirm-custom-delete").addEventListener("click", confirmCustomDeckDeletion);
$("#start-custom-flashcards").addEventListener("click", () => startCustomReview(state.customFlashcardModeSelector));
$("#previous-custom-flashcard-mode").addEventListener("click", () => moveCustomFlashcardMode(-1));
$("#next-custom-flashcard-mode").addEventListener("click", () => moveCustomFlashcardMode(1));
renderCustomFlashcardModeSelector();
$("#start-custom-questions").addEventListener("click", () => startCustomReview(state.customQuestionModeSelector === "essay" ? "essay" : "questions"));
$("#previous-custom-question-mode").addEventListener("click", () => cycleQuestionPracticeMode(-1));
$("#next-custom-question-mode").addEventListener("click", () => cycleQuestionPracticeMode(1));
$("#custom-essay-prompt").addEventListener("click", () => toggleEssayPromptPicker());
$("#custom-essay-prompt-filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-essay-prompt-filter]");
  if (!button) return;
  customEssayPromptFilter = button.dataset.essayPromptFilter;
  renderEssayPromptPicker();
});
$("#custom-essay-prompt-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-essay-prompt-id]");
  if (!button) return;
  selectEssayPrompt(button.dataset.essayPromptId);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#essay-prompt-picker")) toggleEssayPromptPicker(false);
});
$("#essay-prompt-picker").addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  toggleEssayPromptPicker(false);
  $("#custom-essay-prompt").focus();
});
$("#custom-essay-timer-enabled").addEventListener("change", (event) => { state.customEssayTimerEnabled = event.currentTarget.checked; });
$("#custom-essay-time-minutes").addEventListener("input", (event) => { state.customEssayTimeMinutes = Math.max(1, Math.min(180, Number(event.currentTarget.value) || 40)); });
$("#finish-custom-essay").addEventListener("click", () => { recordStudyActivity(); closeCustomReview(); });
renderCustomQuestionModeSelector();
$$('[data-custom-study-mode]').forEach((button) => button.addEventListener("click", () => startCustomReview(button.dataset.customStudyMode)));
$("#close-custom-review").addEventListener("click", closeCustomReview);
$("#custom-matching-submit").addEventListener("click", submitCustomMatching);
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
$("#open-account-dialog").addEventListener("click", openAccountDialog);
$("#open-account-settings").addEventListener("click", openAccountDialog);
$("#close-account-dialog").addEventListener("click", () => $("#account-dialog").close());
$("#account-dialog").addEventListener("cancel", (event) => {
  if (state.googleAccount && !accountSetupComplete(state.googleAccount)) {
    event.preventDefault();
    $("#display-name-input").focus();
    showToast("Add a name and unique username to finish account setup.");
  }
});
$("#username-input").addEventListener("input", () => {
  window.clearTimeout(usernameCheckTimer);
  usernameCheckTimer = window.setTimeout(checkUsernameAvailability, 350);
});
$("#username-form").addEventListener("submit", saveUsername);
$("#google-signout").addEventListener("click", signOutGoogleAccount);
$("#refresh-storage-health").addEventListener("click", renderStorageHealth);
$("#sync-progress-now").addEventListener("click", () => {
  if (!accountSetupComplete(state.googleAccount)) { openAccountDialog(); return; }
  window.StudySync?.syncNow();
});
window.addEventListener("studybuddy:sync-status", (event) => {
  const status = $("#account-sync-status");
  const detail = $("#account-sync-detail");
  if (!status || !detail) return;
  const sync = event.detail || {};
  status.textContent = sync.message || "Progress sync";
  detail.textContent = sync.state === "synced" && sync.updatedAt
    ? `Last synced ${new Date(sync.updatedAt).toLocaleString(loadSettings().language || "en")}.`
    : sync.state === "error" ? "Your device data is safe. Sync will retry when the connection returns." : "Supported changes are saved automatically.";
});
window.addEventListener("studybuddy:remote-progress-applied", () => showToast("Newer account progress was downloaded. Reload when convenient to apply it everywhere."));
$$('[data-legal-document]').forEach((button) => button.addEventListener("click", () => openLegalDocument(button.dataset.legalDocument)));
$("#close-legal-dialog").addEventListener("click", () => $("#legal-dialog").close());
$("#delete-online-account").addEventListener("click", deleteOnlineAccount);
$$('[data-settings-tab]').forEach((button) => button.addEventListener("click", () => selectSettingsTab(button.dataset.settingsTab)));
$("#settings-form").addEventListener("change", (event) => {
  if (event.target.name === "theme") applyTheme(event.target.value);
  if (["language", "reduceMotion", "compactMode", "dataSaver"].includes(event.target.name)) applyInterfacePreferences(settingsFromForm());
});
$("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const profileName = $("#settings-profile-name").value.trim();
  const birthMonth = Number($("#settings-profile-birth-month").value);
  const birthDay = Number($("#settings-profile-birth-day").value);
  if (!profileName) { showToast("Add a name."); return; }
  if ((birthMonth && !birthDay) || (!birthMonth && birthDay)) { showToast("Choose both a birth month and day, or leave both blank."); return; }
  const settings = settingsFromForm();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  const profile = { name: profileName, birthday: birthMonth && birthDay ? `${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}` : "" };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  applyTheme(settings.theme);
  applyInterfacePreferences(settings);
  applyProfile(profile);
  celebrateBirthday(profile);
  try {
    await saveProfileVisibilityFromSettings();
    populateSettingsForm();
    showToast("Profile and settings saved.");
  } catch (error) {
    populateSettingsForm();
    showToast(error.message || "Your local settings were saved, but profile visibility could not be updated.");
  }
});
$("#reset-settings").addEventListener("click", () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  applyTheme(DEFAULT_SETTINGS.theme);
  applyInterfacePreferences(DEFAULT_SETTINGS);
  populateSettingsForm();
  showToast("Settings restored to defaults.");
});
$("#close-community-profile").addEventListener("click", () => $("#community-profile-dialog").close());

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
    if (extension === "ysb") {
      await createImportedEditableNotebookNote(file);
      event.currentTarget.value = "";
      return;
    }
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
      const result = await window.desktopApp.readDroppedStudyFile(file);
      await createImportedPowerPointNotebookNote(result, file);
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
$$('[data-publish-active-note]').forEach((button) => button.addEventListener("click", () => publishNotebookNote(activeNoteId)));
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
$("#note-actions-publish").addEventListener("click", async () => {
  if (!noteActionsNoteId) return;
  const noteId = noteActionsNoteId;
  $("#note-actions-dialog").close();
  noteActionsNoteId = null;
  await publishNotebookNote(noteId);
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
function addDocumentPage(pageType = "blank") {
  saveDocumentEditor(activeDocumentEditor());
  noteDocumentPages.push(pageType === "cornell" ? cornellTemplateContent() : "");
  notePageCount = noteDocumentPages.length;
  activeDocumentPage = noteDocumentPages.length - 1;
  configureNoteCanvas("page", notePageCount, "document");
  renderDrawingNoteVectors();
  renderDocumentPages(activeDocumentPage);
  saveDrawingNote();
  $("#document-page-menu").open = false;
  showToast(pageType === "cornell" ? "Cornell page added." : "Blank page added.");
}
$$('[data-add-document-page]').forEach((button) => button.addEventListener("click", () => addDocumentPage(button.dataset.addDocumentPage)));
$("#document-page-remove").addEventListener("click", async () => {
  if (noteDocumentPages.length <= 1) return;
  if (!await window.AppDialog.confirm(`Remove document page ${activeDocumentPage + 1}?`, { title: "Remove page?", confirmLabel: "Remove page", danger: true })) return;
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
$("#document-insert-table").addEventListener("click", async () => {
  const editor = activeDocumentEditor();
  if (!editor) return;
  const requestedRows = await window.AppDialog.prompt("Choose the number of table rows.", "3", { title: "Insert table", inputLabel: "Rows", type: "number", min: "1", max: "20", confirmLabel: "Next" });
  if (requestedRows === null) return;
  const rows = Math.max(1, Math.min(20, Number(requestedRows) || 1));
  const requestedColumns = await window.AppDialog.prompt("Choose the number of table columns.", "3", { title: "Insert table", inputLabel: "Columns", type: "number", min: "1", max: "12", confirmLabel: "Insert table" });
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
  syncDocumentDrawingMode();
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
$("#edit-note-image-caption").addEventListener("click", async () => {
  const imageItem = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  if (!imageItem) return;
  const caption = await window.AppDialog.prompt("Add an optional caption.", imageItem.caption || "", { title: "Image caption", inputLabel: "Caption", confirmLabel: "Save caption" });
  if (caption === null) return;
  pushDrawingNoteHistory();
  imageItem.caption = caption.trim();
  renderDrawingNoteVectors();
  saveDrawingNote();
});
$("#crop-note-image").addEventListener("click", () => {
  const imageItem = noteDrawingImages.find((item) => item.id === selectedNoteImageId);
  if (imageItem) openNoteImageCrop({ kind: "canvas", imageId: imageItem.id, src: imageItem.src });
});
$("#document-crop-image").addEventListener("click", () => {
  if (!selectedDocumentImage?.image?.isConnected) return;
  openNoteImageCrop({ kind: "document", src: selectedDocumentImage.image.src, ...selectedDocumentImage });
});
document.addEventListener("keydown", (event) => {
  if (!noteImageCropState) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeNoteImageCrop();
    showToast("Crop cancelled.");
  } else if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    applyNoteImageCrop();
  }
}, true);
document.addEventListener("pointerdown", (event) => {
  if (!noteImageCropState || noteImageCropState.drag) return;
  if (event.target.closest?.("[data-canvas-crop-overlay], [data-document-crop-overlay], #crop-note-image, #document-crop-image")) return;
  applyNoteImageCrop();
}, true);
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
  if (noteImageCropState?.target?.kind === "canvas") {
    if (event.target.closest?.("[data-canvas-crop-overlay]")) return;
    event.preventDefault();
    event.stopPropagation();
    const cropMode = canvasCropModeAtEvent(event);
    if (cropMode) {
      beginNoteImageCropDrag(event, cropMode, "canvas");
      noteCanvasViewport.setPointerCapture(event.pointerId);
      return;
    }
    applyNoteImageCrop();
    return;
  }
  const imageControl = event.target.closest?.("[data-note-image-control]");
  if (imageControl) {
    const imageItem = noteDrawingImages.find((item) => item.id === imageControl.dataset.noteImageId);
    if (!imageItem) return;
    event.preventDefault();
    event.stopPropagation();
    selectedNoteImageId = imageItem.id;
    selectedCanvasTextId = null;
    pushDrawingNoteHistory();
    if (imageControl.dataset.noteImageControl === "delete") {
      noteDrawingImages = noteDrawingImages.filter((item) => item.id !== imageItem.id);
      selectedNoteImageId = null;
      renderDrawingNoteVectors();
      saveDrawingNote();
      return;
    }
    const point = noteCanvasPoint(event);
    noteImageTransform = {
      mode: imageControl.dataset.noteImageControl,
      pointerId: event.pointerId,
      start: point,
      original: { ...imageItem },
    };
    noteCanvasViewport.setPointerCapture(event.pointerId);
    return;
  }
  if (event.target.closest?.(".canvas-text-editor, .canvas-text-delete")) return;
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
    const now = Date.now();
    const isImageDoubleClick = lastNoteImagePointerDown?.imageId === selectedImage.id && now - lastNoteImagePointerDown.at < 430;
    lastNoteImagePointerDown = isImageDoubleClick ? null : { imageId: selectedImage.id, at: now };
    if (isImageDoubleClick) {
      noteImageTransform = null;
      openNoteImageCrop({ kind: "canvas", imageId: selectedImage.id, src: selectedImage.src });
      return;
    }
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
  if (moveNoteImageCropDrag(event, "canvas")) return;
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
noteCanvasViewport.addEventListener("pointerup", finishNoteImageCropDrag);
noteCanvasViewport.addEventListener("pointercancel", finishNoteImageCropDrag);
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
      const localX = dx * Math.cos(angle) - dy * Math.sin(angle) + centerX;
      const localY = dx * Math.sin(angle) + dy * Math.cos(angle) + centerY;
      const aspect = Number(original.aspectRatio) > 0 ? Number(original.aspectRatio) : original.width / Math.max(1, original.height);
      const draggedWidth = localX - original.x;
      const draggedHeight = localY - original.y;
      const projectedScale = (draggedWidth * original.width + draggedHeight * original.height) / Math.max(1, original.width * original.width + original.height * original.height);
      const minimumScale = Math.max(60 / Math.max(1, original.width), 40 / Math.max(1, original.height));
      const maximumScale = Math.max(minimumScale, Math.min(
        (drawingWorkspaceWidth() - original.x) / Math.max(1, original.width),
        (drawingWorkspaceHeight() - original.y) / Math.max(1, original.height),
      ));
      const scale = Math.max(minimumScale, Math.min(maximumScale, projectedScale));
      item.width = original.width * scale; item.height = item.width / aspect;
      item.aspectRatio = aspect;
      item.x = original.x;
      item.y = original.y;
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
function addCanvasPage(pageType = "blank") {
  if (noteCanvasMode !== "page") return;
  if (pageType === "cornell") {
    addDocumentPage("cornell");
    return;
  }
  notePageCount += 1;
  while (noteDocumentPages.length < notePageCount) noteDocumentPages.push("");
  configureNoteCanvas("page", notePageCount, notePageLayout);
  renderDrawingNoteVectors();
  saveDrawingNote();
  const viewport = drawingNoteCanvas().parentElement;
  window.requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" }));
  $(".page-add-menu").open = false;
}
$$('[data-add-canvas-page]').forEach((button) => button.addEventListener("click", () => addCanvasPage(button.dataset.addCanvasPage)));
$("#remove-note-page").addEventListener("click", async () => {
  if (noteCanvasMode !== "page" || notePageCount <= 1) return;
  if (!await window.AppDialog.confirm("Remove the last page and anything written or drawn on it?", { title: "Remove page?", confirmLabel: "Remove page", danger: true })) return;
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
$("#clear-note-canvas").addEventListener("click", async () => {
  if (!await window.AppDialog.confirm("Clear this entire drawing?", { title: "Clear drawing?", confirmLabel: "Clear drawing", danger: true })) return;
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
renderCustomUnitBuilder();
window.setTimeout(() => checkForAppUpdates(false), 2500);
