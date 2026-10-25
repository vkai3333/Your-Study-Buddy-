(function () {
  "use strict";
  const translations = {
    en: { dashboard: "Dashboard", browse: "Browse", study: "Study", create: "Create", notes: "Notes", export: "Export", settings: "Settings", preferences: "Preferences", save: "Save settings", reset: "Restore defaults", login: "Log in", curated: "Curated sets", community: "Community", publicLibrary: "My Public Library", general: "General", anki: "Anki", morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", day: "day", days: "days", personalBest: "Personal best" },
    es: { dashboard: "Inicio", browse: "Explorar", study: "Estudiar", create: "Crear", notes: "Notas", export: "Exportar", settings: "Configuración", preferences: "Preferencias", save: "Guardar configuración", reset: "Restaurar valores", login: "Iniciar sesión", curated: "Colecciones seleccionadas", community: "Comunidad", publicLibrary: "Mi biblioteca pública", general: "General", anki: "Anki", morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches", day: "día", days: "días", personalBest: "Mejor racha" },
    fr: { dashboard: "Tableau de bord", browse: "Parcourir", study: "Étudier", create: "Créer", notes: "Notes", export: "Exporter", settings: "Paramètres", preferences: "Préférences", save: "Enregistrer", reset: "Rétablir", login: "Se connecter", curated: "Collections sélectionnées", community: "Communauté", publicLibrary: "Ma bibliothèque publique", general: "Général", anki: "Anki", morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir", day: "jour", days: "jours", personalBest: "Meilleure série" },
  };
  const navigation = ["dashboard", "browse", "study", "create", "notes", "export"];

  function apply(language = "en") {
    const selected = translations[language] ? language : "en";
    const copy = translations[selected];
    document.documentElement.lang = selected;
    document.documentElement.dataset.language = selected;
    document.querySelectorAll(".primary-nav .nav-item span").forEach((label, index) => {
      const key = navigation[index];
      if (key) label.textContent = copy[key];
    });
    document.querySelectorAll(".mobile-nav a span").forEach((label, index) => {
      const key = navigation[index];
      if (key) label.textContent = copy[key];
    });
    const settingsLabel = document.querySelector("#open-settings span");
    if (settingsLabel) settingsLabel.textContent = copy.settings;
    const loginLabel = document.querySelector("#account-nav-label");
    if (loginLabel && ["Log in", "Iniciar sesión", "Se connecter"].includes(loginLabel.textContent.trim())) loginLabel.textContent = copy.login;
    const browseTitle = document.querySelector("#courses-page-heading");
    if (browseTitle) browseTitle.textContent = copy.browse;
    const browseTabs = document.querySelectorAll("[data-browse-library-view]");
    [copy.curated, copy.community, copy.publicLibrary].forEach((label, index) => { if (browseTabs[index]) browseTabs[index].textContent = label; });
    const sectionLabel = document.querySelector(".settings-page-header .section-label");
    if (sectionLabel) sectionLabel.textContent = copy.preferences;
    const settingsTitle = document.querySelector("#settings-title");
    if (settingsTitle) settingsTitle.textContent = copy.settings;
    const save = document.querySelector("#settings-form button[type='submit']");
    if (save) save.textContent = copy.save;
    const reset = document.querySelector("#reset-settings");
    if (reset) reset.textContent = copy.reset;
    const settingsTabs = document.querySelectorAll("[data-settings-tab]");
    if (settingsTabs[0]) settingsTabs[0].textContent = copy.general;
    if (settingsTabs[1]) settingsTabs[1].textContent = copy.anki;
  }

  function text(language, key) {
    return (translations[language] || translations.en)[key] || translations.en[key] || key;
  }

  function greetingForHour(language, hour) {
    return text(language, hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening");
  }

  window.StudyLanguage = { apply, text, greetingForHour, supported: Object.keys(translations) };
})();
