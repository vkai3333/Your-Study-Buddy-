(function initializeAnkiSelectionStorage(root) {
  "use strict";

  function normalize(payload, day) {
    if (!payload || payload.day !== day || !Array.isArray(payload.keys)) return [];
    return [...new Set(payload.keys.filter((key) => typeof key === "string" && /^(course|deck):.+/.test(key)))];
  }

  function load(storage, key, day) {
    try { return normalize(JSON.parse(storage.getItem(key) || "null"), day); }
    catch { return []; }
  }

  function save(storage, key, day, keys) {
    const normalized = normalize({ day, keys: [...keys] }, day);
    storage.setItem(key, JSON.stringify({ day, keys: normalized }));
    return normalized;
  }

  const api = { normalize, load, save };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.AnkiSelectionStorage = api;
})(typeof window !== "undefined" ? window : globalThis);
