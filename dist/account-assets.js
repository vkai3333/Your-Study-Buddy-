(function () {
  "use strict";

  const NOTES_KEY = "your-study-buddy-notes-v1";
  const IMAGE_DATA_URL = /data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=]+)/gi;
  const ASSET_MARKER = /ysb-account-asset:([a-z0-9._-]+)/gi;
  const cache = new Map();

  function bytesToHex(bytes) { return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join(""); }
  async function digest(blob) { return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))); }
  function dataUrlToBlob(type, encoded) {
    const raw = atob(encoded);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    return new Blob([bytes], { type });
  }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("The image could not be restored."));
      reader.readAsDataURL(blob);
    });
  }
  async function requestAsset(id, options = {}) {
    const response = await fetch(`/api/account/assets/${encodeURIComponent(id)}`, { credentials: "same-origin", ...options });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "A note attachment could not sync.");
    return response;
  }
  async function upload(id, blob) {
    if (cache.get(id) === "uploaded") return;
    await requestAsset(id, { method: "PUT", headers: { "Content-Type": blob.type || "application/octet-stream" }, body: blob });
    cache.set(id, "uploaded");
  }
  async function download(id) {
    if (cache.get(id) instanceof Blob) return cache.get(id);
    const blob = await (await requestAsset(id)).blob();
    cache.set(id, blob);
    return blob;
  }
  async function replaceAsync(value, expression, replacer) {
    const matches = [...String(value).matchAll(expression)];
    if (!matches.length) return value;
    const replacements = await Promise.all(matches.map((match) => replacer(match)));
    let output = "", cursor = 0;
    matches.forEach((match, index) => { output += value.slice(cursor, match.index) + replacements[index]; cursor = match.index + match[0].length; });
    return output + value.slice(cursor);
  }
  async function dehydrateNotes(value) {
    return replaceAsync(value, IMAGE_DATA_URL, async (match) => {
      const blob = dataUrlToBlob(match[1], match[2]);
      const extension = match[1].split("/")[1].replace("jpeg", "jpg");
      const id = `note-image-${await digest(blob)}.${extension}`;
      await upload(id, blob);
      return `ysb-account-asset:${id}`;
    });
  }
  async function hydrateNotes(value) {
    return replaceAsync(value, ASSET_MARKER, async (match) => blobToDataUrl(await download(match[1])));
  }
  function notePdfIds(value) {
    try { return JSON.parse(value || "[]").map((note) => note?.pdfAssetId).filter(Boolean); }
    catch (_) { return []; }
  }
  async function dehydrateRecords(records) {
    const result = structuredClone(records || {});
    const record = result[NOTES_KEY];
    if (record?.deleted !== true && typeof record?.value === "string") {
      for (const id of notePdfIds(record.value)) {
        const blob = await window.NoteAssetStorage?.get(id);
        if (blob) await upload(id, blob);
      }
      record.value = await dehydrateNotes(record.value);
    }
    return result;
  }
  async function hydrateRecords(records) {
    const result = structuredClone(records || {});
    const record = result[NOTES_KEY];
    if (record?.deleted !== true && typeof record?.value === "string") {
      record.value = await hydrateNotes(record.value);
      for (const id of notePdfIds(record.value)) {
        if (!await window.NoteAssetStorage?.get(id)) {
          try { await window.NoteAssetStorage?.set(id, await download(id)); }
          catch (error) { if (!/not found/i.test(error.message || "")) throw error; }
        }
      }
    }
    return result;
  }

  window.AccountAssetSync = { dehydrateRecords, hydrateRecords };
})();
