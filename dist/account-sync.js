(function () {
  "use strict";

  const META_KEY = "your-study-buddy-sync-meta-v1";
  const EXACT_KEYS = new Set([
    "your-study-buddy-settings-v1",
    "your-study-buddy-profile-v1",
    "your-study-buddy-study-days-v1",
    "your-study-buddy-custom-decks",
    "your-study-buddy-study-folders",
    "your-study-buddy-starred-study-items-v1",
    "your-study-buddy-active-anki-decks-v1",
    "your-study-buddy-active-anki-selections-v1",
    "your-study-buddy-frozen-anki-decks-v1",
    "your-study-buddy-alarms-v1",
    "study-desk-anki-schedules",
    "study-desk-anki-buried-v2",
    "study-desk-anki-review-log-v2",
    "study-desk-anki-daily-new-v1",
    "study-desk-removed-anki-cards",
    "study-desk-completed-lessons",
    "study-desk-added-flashcard-collections",
    "study-desk-enrolled-courses",
    "your-study-buddy-notes-v1",
    "your-study-buddy-note-folders-v1",
  ]);
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  let accountReady = false;
  let applyingRemote = false;
  let syncTimer = 0;
  let syncing = false;
  let serverVersion = 0;
  let accountId = "";

  function metadata() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) { return {}; }
  }

  function emit(state, message, updatedAt = 0) {
    window.dispatchEvent(new CustomEvent("studybuddy:sync-status", { detail: { state, message, updatedAt } }));
  }

  function writeMetadata(next) {
    originalSetItem.call(localStorage, META_KEY, JSON.stringify(next));
  }

  function tracks(key) { return EXACT_KEYS.has(String(key || "")); }

  function markChanged(key) {
    if (!tracks(key) || applyingRemote) return;
    const next = metadata();
    next[key] = Date.now();
    const deleted = next.__deleted && typeof next.__deleted === "object" ? next.__deleted : {};
    delete deleted[key];
    next.__deleted = deleted;
    writeMetadata(next);
    schedule();
  }

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage) markChanged(key);
  };

  Storage.prototype.removeItem = function (key) {
    originalRemoveItem.call(this, key);
    if (this === localStorage && tracks(key) && !applyingRemote) {
      const next = metadata();
      const removedAt = Date.now();
      next[key] = removedAt;
      const deleted = next.__deleted && typeof next.__deleted === "object" ? next.__deleted : {};
      deleted[key] = removedAt;
      next.__deleted = deleted;
      writeMetadata(next);
      schedule();
    }
  };

  function localRecords() {
    const timestamps = metadata();
    const deleted = timestamps.__deleted && typeof timestamps.__deleted === "object" ? timestamps.__deleted : {};
    const now = Date.now();
    const records = {};
    EXACT_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value === null) {
        if (Number(deleted[key])) records[key] = { value: null, deleted: true, updatedAt: Number(deleted[key]) };
        return;
      }
      records[key] = { value, updatedAt: Number(timestamps[key]) || now };
    });
    return records;
  }

  const ENTITY_ARRAY_KEYS = new Set([
    "your-study-buddy-custom-decks", "your-study-buddy-study-folders", "your-study-buddy-active-anki-decks-v1",
    "your-study-buddy-alarms-v1", "your-study-buddy-notes-v1", "your-study-buddy-note-folders-v1",
  ]);

  function parseArrayRecord(record) {
    if (record?.deleted === true || typeof record?.value !== "string") return null;
    try { const value = JSON.parse(record.value); return Array.isArray(value) ? value : null; }
    catch (_) { return null; }
  }

  function entityId(item, index) { return String(item?.id || item?.deckId || item?.noteId || `position-${index}`); }
  function itemTime(item, fallback) { return Number(item?.updatedAt || item?.modifiedAt || item?.createdAt) || Number(fallback) || 0; }
  function conflictCopy(item, id, timestamp) {
    const copy = structuredClone(item);
    copy.id = `${id}-conflict-${timestamp}`;
    const field = Object.hasOwn(copy, "title") ? "title" : Object.hasOwn(copy, "name") ? "name" : "";
    if (field && !/\(conflict copy\)$/.test(copy[field] || "")) copy[field] = `${copy[field] || "Untitled"} (conflict copy)`;
    copy.updatedAt = timestamp;
    return copy;
  }

  function mergeEntityArrays(key, localRecord, remoteRecord, lastSyncedAt) {
    const localItems = parseArrayRecord(localRecord);
    const remoteItems = parseArrayRecord(remoteRecord);
    if (!ENTITY_ARRAY_KEYS.has(key) || !localItems || !remoteItems) return null;
    const output = new Map(remoteItems.map((item, index) => [entityId(item, index), item]));
    localItems.forEach((localItem, index) => {
      const id = entityId(localItem, index);
      const remoteItem = output.get(id);
      if (!remoteItem) { output.set(id, localItem); return; }
      if (JSON.stringify(localItem) === JSON.stringify(remoteItem)) return;
      const localTime = itemTime(localItem, localRecord.updatedAt);
      const remoteTime = itemTime(remoteItem, remoteRecord.updatedAt);
      const localWon = localTime >= remoteTime;
      output.set(id, localWon ? localItem : remoteItem);
      if (Number(localRecord.updatedAt) > lastSyncedAt && Number(remoteRecord.updatedAt) > lastSyncedAt) {
        const loser = localWon ? remoteItem : localItem;
        const conflictId = `${id}-conflict-${Math.min(localTime, remoteTime)}`;
        if (!output.has(conflictId)) output.set(conflictId, conflictCopy(loser, id, Math.min(localTime, remoteTime)));
      }
    });
    return { value: JSON.stringify([...output.values()]), updatedAt: Math.max(Number(localRecord.updatedAt), Number(remoteRecord.updatedAt)) + 1 };
  }

  function mergeRecords(remoteRecords = {}, preferRemote = false) {
    const local = localRecords();
    const merged = { ...remoteRecords };
    const syncMeta = metadata();
    let remoteApplied = false;
    applyingRemote = true;
    try {
      Object.entries(local).forEach(([key, record]) => {
        if (!merged[key]) { merged[key] = record; return; }
        const structured = !preferRemote && mergeEntityArrays(key, record, merged[key], Number(syncMeta.__syncedAtByKey?.[key]) || 0);
        if (structured) merged[key] = structured;
        else if (!preferRemote && Number(record.updatedAt) >= Number(merged[key].updatedAt || 0)) merged[key] = record;
      });
      Object.entries(merged).forEach(([key, record]) => {
        if (!tracks(key) || (record?.deleted !== true && typeof record?.value !== "string")) return;
        if (!local[key] || Number(record.updatedAt) > Number(local[key].updatedAt || 0)) {
          if (record.deleted === true) originalRemoveItem.call(localStorage, key);
          else originalSetItem.call(localStorage, key, record.value);
          remoteApplied = true;
        }
      });
      const timestamps = metadata();
      const deleted = timestamps.__deleted && typeof timestamps.__deleted === "object" ? timestamps.__deleted : {};
      Object.entries(merged).forEach(([key, record]) => {
        if (!tracks(key)) return;
        timestamps[key] = Number(record.updatedAt) || Date.now();
        if (record.deleted === true) deleted[key] = timestamps[key];
        else delete deleted[key];
      });
      timestamps.__deleted = deleted;
      writeMetadata(timestamps);
    } finally { applyingRemote = false; }
    return { records: merged, remoteApplied };
  }

  async function request(path, options = {}) {
    const response = await fetch(path, { credentials: "same-origin", ...options });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || "Progress sync failed.");
      error.status = response.status;
      throw error;
    }
    return result;
  }

  async function reconcile() {
    if (!accountReady || syncing || location.protocol !== "https:") return;
    syncing = true;
    emit("syncing", "Syncing study progress…");
    try {
      let remoteApplied = false;
      let saved = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const remote = await request("/api/account/progress");
        serverVersion = Number(remote.version) || 0;
        const syncMeta = metadata();
        const firstSyncForAccount = syncMeta.__accountId !== accountId || !Number(syncMeta.__serverVersion);
        const hydratedRemote = window.AccountAssetSync ? await window.AccountAssetSync.hydrateRecords(remote.data?.records || {}) : (remote.data?.records || {});
        const merged = mergeRecords(hydratedRemote, firstSyncForAccount && serverVersion > 0);
        remoteApplied = remoteApplied || merged.remoteApplied;
        const uploadRecords = window.AccountAssetSync ? await window.AccountAssetSync.dehydrateRecords(merged.records) : merged.records;
        try {
          saved = await request("/api/account/progress", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ version: serverVersion, data: { records: uploadRecords } }),
          });
          break;
        } catch (error) {
          if (error.status !== 409 || attempt === 2) throw error;
        }
      }
      if (!saved) throw new Error("Progress could not sync.");
      serverVersion = Number(saved.version) || serverVersion;
      const savedMeta = metadata();
      savedMeta.__accountId = accountId;
      savedMeta.__serverVersion = serverVersion;
      savedMeta.__syncedAtByKey = Object.fromEntries([...EXACT_KEYS].map((key) => [key, Number(savedMeta[key]) || Date.now()]));
      writeMetadata(savedMeta);
      emit("synced", "Progress synced", Number(saved.updatedAt) || Date.now());
      if (remoteApplied) window.dispatchEvent(new CustomEvent("studybuddy:remote-progress-applied"));
    } catch (error) {
      emit("error", error.message || "Progress could not sync.");
    } finally { syncing = false; }
  }

  function schedule() {
    if (!accountReady || location.protocol !== "https:") return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(reconcile, 1400);
  }

  function setAccount(account) {
    const nextReady = Boolean(account?.username && account?.displayName);
    const nextAccountId = nextReady ? String(account.id || account.email || account.username) : "";
    const accountChanged = nextReady !== accountReady || nextAccountId !== accountId;
    accountReady = nextReady;
    accountId = nextAccountId;
    if (accountReady && accountChanged) reconcile();
    else if (!accountReady) emit("local", "Progress is stored on this device");
  }

  window.addEventListener("online", () => { if (accountReady) reconcile(); });
  window.StudySync = { setAccount, syncNow: reconcile, trackedKeys: () => [...EXACT_KEYS] };
})();
