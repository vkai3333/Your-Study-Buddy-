const { app, BrowserWindow, clipboard, dialog, ipcMain, nativeImage, Notification, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const AdmZip = require("adm-zip");
const initSqlJs = require("sql.js");
const { decompress } = require("fzstd");

const RELEASES_API = "https://api.github.com/repos/vkai3333/Your-Study-Buddy-/releases?per_page=20";

function versionParts(value) {
  return String(value || "").replace(/^v/i, "").split("-")[0].split(".").map((part) => Number.parseInt(part, 10) || 0).slice(0, 3);
}

function compareVersions(left, right) {
  const a = versionParts(left); const b = versionParts(right);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
  }
  return 0;
}

async function checkForAppUpdate() {
  const currentVersion = app.getVersion();
  const response = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json", "User-Agent": `Your-Study-Buddy/${currentVersion}` } });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);
  const releases = (await response.json()).filter((release) => !release.draft && release.tag_name);
  releases.sort((left, right) => compareVersions(right.tag_name, left.tag_name));
  const latest = releases[0];
  if (!latest) return { currentVersion, available: false, message: "No published releases were found." };
  const latestVersion = String(latest.tag_name).replace(/^v/i, "");
  return {
    currentVersion,
    latestVersion,
    available: compareVersions(latestVersion, currentVersion) > 0,
    releaseName: latest.name || `Version ${latestVersion}`,
    releaseUrl: latest.html_url,
    publishedAt: latest.published_at,
  };
}

const alarmTimers = new Map();
let sqlPromise;

function sqlEngine() {
  if (!sqlPromise) {
    const wasmBinary = fs.readFileSync(require.resolve("sql.js/dist/sql-wasm.wasm"));
    sqlPromise = initSqlJs({ wasmBinary });
  }
  return sqlPromise;
}

async function readAnkiPackage(filePath) {
  const archive = new AdmZip(filePath);
  const entries = new Map(archive.getEntries().map((entry) => [entry.entryName, entry]));
  let databaseBytes;
  if (entries.has("collection.anki21")) databaseBytes = entries.get("collection.anki21").getData();
  else if (entries.has("collection.anki2")) databaseBytes = entries.get("collection.anki2").getData();
  else if (entries.has("collection.anki21b")) databaseBytes = Buffer.from(decompress(entries.get("collection.anki21b").getData()));
  else throw new Error("No Anki collection database was found inside this APKG package.");

  if (!databaseBytes.subarray(0, 16).toString("utf8").startsWith("SQLite format 3")) {
    throw new Error("The Anki database inside this APKG package could not be decoded.");
  }
  const SQL = await sqlEngine();
  const database = new SQL.Database(databaseBytes);
  try {
    const collectionRow = database.exec("SELECT crt FROM col LIMIT 1;")[0]?.values?.[0];
    const collectionCreated = Number(collectionRow?.[0] || Math.floor(Date.now() / 1000));
    const result = database.exec("SELECT n.id, n.flds, c.id, c.type, c.queue, c.due, c.ivl, c.factor, c.reps, c.lapses, c.left, c.data FROM notes n LEFT JOIN cards c ON c.nid = n.id ORDER BY n.id, c.ord;")[0];
    if (!result?.values?.length) throw new Error("This APKG package does not contain any notes.");
    const reviewRows = database.exec("SELECT cid, ease, ivl, lastIvl, factor, time, type, id FROM revlog ORDER BY id;")[0]?.values || [];
    const reviewsByCard = new Map();
    reviewRows.forEach(([cardId, ease, interval, lastInterval, factor, time, type, id]) => {
      if (!reviewsByCard.has(cardId)) reviewsByCard.set(cardId, []);
      reviewsByCard.get(cardId).push({ rating: Number(ease), interval: Number(interval), lastInterval: Number(lastInterval), factor: Number(factor), durationMs: Number(time), type: Number(type), review: Number(id) });
    });
    const notes = result.values.map(([id, fields, cardId, type, queue, due, interval, factor, reps, lapses, left, data]) => {
      let customData = {};
      try { customData = JSON.parse(String(data || "{}")); } catch {}
      const dueTimestamp = Number(queue) === 1 ? Number(due) * 1000 : (collectionCreated + Number(due || 0) * 86400) * 1000;
      return { id, cardId, fields: String(fields || "").split("\u001f"), schedule: { due: dueTimestamp, intervalDays: Number(interval) || 0, repetitions: Number(reps) || 0, lapses: Number(lapses) || 0, ease: (Number(factor) || 2500) / 1000, state: Number(type) === 2 ? 2 : Number(type) === 3 ? 3 : Number(type) === 1 ? 1 : 0, suspended: Number(queue) < 0, learningSteps: Number(left) || 0, stability: Number(customData.s || customData.stability) || 0, difficulty: Number(customData.d || customData.difficulty) || 0 }, reviews: reviewsByCard.get(cardId) || [] };
    });
    return { name: path.basename(filePath), notes };
  } finally {
    database.close();
  }
}

async function chooseStudyFile(window) {
  const result = await dialog.showOpenDialog(window, {
    title: "Import study file",
    buttonLabel: "Import",
    properties: ["openFile"],
    filters: [
      { name: "Study files", extensions: ["apkg", "pdf", "pptx", "txt", "md", "csv", "tsv"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  return readStudyFile(result.filePaths[0]);
}

async function chooseNoteFile(window) {
  const result = await dialog.showOpenDialog(window, {
    title: "Import notes",
    buttonLabel: "Add to Notes",
    properties: ["openFile"],
    filters: [
      { name: "Note files", extensions: ["pdf", "pptx", "txt", "md"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  return readStudyFile(result.filePaths[0]);
}

async function readStudyFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) throw new Error("That file could not be opened.");
  const extension = path.extname(filePath).slice(1).toLowerCase();
  if (extension === "apkg") return { kind: "apkg", payload: await readAnkiPackage(filePath) };
  if (extension === "pdf") return { kind: "document", name: path.basename(filePath), extension, text: await readPdfText(filePath) };
  if (extension === "pptx") return { kind: "document", name: path.basename(filePath), extension, text: readPowerPointText(filePath) };
  if (["txt", "md", "csv", "tsv"].includes(extension)) {
    return { kind: "text", name: path.basename(filePath), extension, text: fs.readFileSync(filePath, "utf8") };
  }
  throw new Error("Choose an APKG, PDF, PPTX, TXT, Markdown, CSV, or TSV file.");
}

async function readPdfText(filePath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(filePath)), disableWorker: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = [];
    content.items.filter((item) => String(item.str || "").trim()).forEach((item) => {
      const x = Number(item.transform?.[4] || 0), y = Number(item.transform?.[5] || 0);
      let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2.5);
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ x, text: String(item.str || "").trim() });
    });
    const lines = rows.sort((a, b) => b.y - a.y).map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ").replace(/\s+([,.;:!?])/g, "$1").trim()).filter(Boolean);
    const cleaned = cleanPdfSlide(lines);
    if (cleaned) pages.push(cleaned);
  }
  if (!pages.length) throw new Error("No usable study text was found in this PDF. It may contain only scanned images.");
  return pages.join("\n\n");
}

function cleanPdfSlide(sourceLines) {
  const lines = sourceLines.map((line) => line.replace(/\s+/g, " ").trim()).filter((line) => line && !/(?:©|Copyright).*Worth Publishers/i.test(line) && !/^page\s*\d+$/i.test(line));
  if (!lines.length) return "";
  const combined = lines.join(" ");
  if (/^(?:True or False|Learning Targets?|Check Your Understanding|AP®? Exam Tip)\b/i.test(lines[0]) || /(?:Examine the Concept|Apply the Concept).*(?:Examine the Concept|Apply the Concept)/i.test(combined)) return "";
  if (lines.length <= 2 && combined.length < 150 && !/:/.test(combined)) return "";
  const output = [];
  lines.forEach((line) => {
    const bullet = /^(?:[•●▪◦*-]|\d+[.)])\s*/.test(line);
    const cleaned = line.replace(/^[•●▪◦]\s*/, "- ");
    const previous = output[output.length - 1];
    if (previous && !bullet && !/[.!?:;]$/.test(previous) && /^[a-z(]/.test(cleaned)) output[output.length - 1] = `${previous} ${cleaned}`;
    else output.push(cleaned);
  });
  const first = output[0] || "";
  if (first.length <= 90 && !/[.!?]$/.test(first) && !/^[•*-]/.test(first) && !/^[^:]{2,60}:\s+.+/.test(first)) output[0] = `## ${first}`;
  return output.join("\n");
}

function decodeXmlText(value) {
  return String(value || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));
}

function powerpointParagraph(xml) {
  const level = Math.max(0, Number(xml.match(/<a:pPr[^>]*\blvl="(\d+)"/)?.[1] || 0));
  const chunks = [];
  for (const token of xml.matchAll(/<a:r>([\s\S]*?)<\/a:r>|<a:fld[^>]*>([\s\S]*?)<\/a:fld>|<a:br\b[^>]*\/>/g)) {
    if (token[0].startsWith("<a:br")) { chunks.push("\n"); continue; }
    const body = token[1] || token[2] || "";
    const value = [...body.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXmlText(match[1])).join("");
    if (value) {
      const bold = /<a:rPr[^>]*\bb="1"/.test(body);
      const italic = /<a:rPr[^>]*\bi="1"/.test(body);
      if (value.trim() && bold && italic) chunks.push(`***${value}***`);
      else if (value.trim() && bold) chunks.push(`**${value}**`);
      else if (value.trim() && italic) chunks.push(`*${value}*`);
      else chunks.push(value);
    }
  }
  if (!chunks.length) chunks.push(...[...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXmlText(match[1])));
  const text = chunks.join("").replace(/[ \t]+([,.;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
  if (!text) return null;
  return `${"  ".repeat(level)}${/^\s*(?:\d+|[A-Z])\s*[.)]\s+/.test(text) ? "" : "- "}${text}`;
}

function powerpointSlideText(xml) {
  const shapes = [...xml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)].map((match) => match[1]);
  let title = ""; const body = [];
  shapes.forEach((shape) => {
    const paragraphs = [...shape.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((match) => powerpointParagraph(match[1])).filter(Boolean);
    if (!paragraphs.length) return;
    if (/<p:ph[^>]*\btype="(?:title|ctrTitle)"/.test(shape) && !title) title = paragraphs.map((line) => line.replace(/^\s*-\s*/, "").replace(/\*\*/g, "")).join(" ");
    else body.push(...paragraphs);
  });
  const plainTitle = title.replace(/\s+/g, " ").trim();
  if (/^(?:questions?|agenda|bell schedule|classroom expectations|reading guides?|contact information|about (?:me|the teacher)|homework|reminders?|materials|grading|course syllabus)$/i.test(plainTitle) || /(?:walkthrough|class activity|map activity|discussion questions?|ap daily|take notes|exam review directions)/i.test(plainTitle)) return "";
  const uniqueBody = body.filter((line, index) => {
    const plain = line.replace(/^\s*-\s*/, "").replace(/\*\*/g, "").trim();
    return line.length > 2 && body.indexOf(line) === index && !/^https?:\/\/\S+$/i.test(plain) && !/\?$/.test(plain) && !/^(?:watch|begin at|turn to|complete|submit|discuss with|take notes|answer the following)\b/i.test(plain);
  });
  return [plainTitle ? `## ${plainTitle}` : "", ...uniqueBody].filter(Boolean).join("\n");
}

function readPowerPointText(filePath) {
  const archive = new AdmZip(filePath);
  const slides = archive.getEntries().filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)).sort((a, b) => Number(a.entryName.match(/\d+/)?.[0]) - Number(b.entryName.match(/\d+/)?.[0])).map((entry) => powerpointSlideText(entry.getData().toString("utf8"))).filter(Boolean);
  if (!slides.length) throw new Error("No usable study text was found in this PowerPoint.");
  return slides.join("\n\n");
}

function exportText(cards, format) {
  const separator = format === "csv" ? "," : "\t";
  const quote = (value) => {
    const text = String(value || "").replace(/\r?\n/g, "<br>");
    return format === "csv" ? `"${text.replace(/"/g, '""')}"` : text.replace(/\t/g, " ");
  };
  const rows = format === "csv" ? [["Front", "Back"]] : [];
  rows.push(...cards.map((card) => [card.front, card.back]));
  return rows.map((row) => row.map(quote).join(separator)).join("\n");
}

function ankiHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>");
}

async function createAnkiPackage(name, cards, reviewLogs = []) {
  const SQL = await sqlEngine();
  const database = new SQL.Database();
  const now = Date.now();
  const modelId = now;
  const deckId = now + 1;
  const model = { id: modelId, name: "Your Study Buddy Basic", type: 0, mod: Math.floor(now / 1000), usn: -1, sortf: 0, did: deckId, tmpls: [{ name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}<hr id=answer>{{Back}}", bqfmt: "", bafmt: "", did: null, bfont: "Arial", bsize: 20 }], flds: [{ name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, description: "", plainText: false, collapsed: false, excludeFromSearch: false }, { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, description: "", plainText: false, collapsed: false, excludeFromSearch: false }], css: ".card { font-family: Arial; font-size: 20px; text-align: center; color: black; background-color: white; }", latexPre: "", latexPost: "", latexsvg: false, req: [[0, "all", [0]]] };
  const deck = { id: deckId, name, mod: Math.floor(now / 1000), usn: -1, desc: "Exported from Your Study Buddy", dyn: 0, collapsed: false, browserCollapsed: false, extendNew: 0, extendRev: 0, conf: 1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], reviewLimit: null, newLimit: null, reviewLimitToday: null, newLimitToday: null };
  const defaultDeck = { id: 1, name: "Default", mod: 0, usn: 0, desc: "", dyn: 0, collapsed: true, browserCollapsed: true, extendNew: 0, extendRev: 0, conf: 1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], reviewLimit: null, newLimit: null, reviewLimitToday: null, newLimitToday: null };
  database.run("CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null); CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null); CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null); CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null); CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null); CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due); CREATE INDEX ix_revlog_usn on revlog (usn); CREATE INDEX ix_revlog_cid on revlog (cid);");
  database.run("INSERT INTO col VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)", [Math.floor(now / 1000), now, now, 11, 0, -1, 0, "{}", JSON.stringify({ [modelId]: model }), JSON.stringify({ [deckId]: deck, 1: defaultDeck }), "{}", "{}"]);
  const noteStatement = database.prepare("INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  const cardStatement = database.prepare("INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  const mediaFiles = [];
  const exportedCardIds = new Map();
  const withImage = (text, image, side, index) => {
    let html = ankiHtml(text);
    const match = String(image || "").match(/^data:([^;,]+);base64,(.+)$/s);
    if (!match) return html;
    const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg" };
    const filename = `ysb-${index + 1}-${side}.${extensions[match[1]] || "png"}`;
    mediaFiles.push({ filename, data: Buffer.from(match[2], "base64") });
    return `${html}${html ? "<br>" : ""}<img src="${filename}">`;
  };
  cards.forEach((card, index) => {
    const noteId = now + 1000 + index * 2;
    const cardId = noteId + 1;
    exportedCardIds.set(card.scheduleKey, cardId);
    const front = withImage(card.front, card.frontImage, "front", index);
    const back = withImage(card.back, card.backImage, "back", index);
    const checksum = parseInt(crypto.createHash("sha1").update(front).digest("hex").slice(0, 8), 16);
    noteStatement.run([noteId, crypto.randomBytes(8).toString("base64url"), modelId, Math.floor(now / 1000), -1, "", `${front}\u001f${back}`, String(card.front || ""), checksum, 0, ""]);
    const schedule = card.schedule || {};
    const fsrs = schedule.fsrs || {};
    const state = Number(fsrs.state ?? schedule.state ?? 0);
    const queue = schedule.suspended ? -1 : state === 0 ? 0 : state === 2 ? 2 : 1;
    const dueMs = Number(fsrs.due || schedule.due || now);
    const due = queue === 2 ? Math.max(1, Math.round((dueMs / 1000 - Math.floor(now / 1000)) / 86400)) : queue === 1 ? Math.floor(dueMs / 1000) : index + 1;
    const interval = Math.max(0, Math.round(Number(fsrs.scheduled_days ?? schedule.intervalDays) || 0));
    const cardData = fsrs.stability ? JSON.stringify({ s: Number(fsrs.stability), d: Number(fsrs.difficulty) }) : "";
    cardStatement.run([cardId, noteId, deckId, 0, Math.floor(now / 1000), -1, state === 2 ? 2 : state ? 1 : 0, queue, due, interval, 0, Number(fsrs.reps ?? schedule.repetitions) || 0, Number(fsrs.lapses ?? schedule.lapses) || 0, 0, 0, 0, 0, cardData]);
  });
  noteStatement.free(); cardStatement.free();
  const reviewStatement = database.prepare("INSERT INTO revlog VALUES (?,?,?,?,?,?,?,?,?)");
  reviewLogs.forEach((log, index) => {
    const cardId = exportedCardIds.get(log.cardKey);
    if (!cardId) return;
    const reviewId = Math.max(now + index, Number(log.review) || now + index);
    const ease = ({ again: 1, hard: 2, good: 3, easy: 4 })[log.rating] || 3;
    reviewStatement.run([reviewId, cardId, -1, ease, Math.round(Number(log.scheduledDays) || 0), 0, 0, Math.round(Number(log.durationMs) || 0), Number(log.state) || 1]);
  });
  reviewStatement.free();
  const archive = new AdmZip();
  archive.addFile("collection.anki2", Buffer.from(database.export()));
  const mediaMap = {};
  mediaFiles.forEach((file, index) => { archive.addFile(String(index), file.data); mediaMap[String(index)] = file.filename; });
  archive.addFile("media", Buffer.from(JSON.stringify(mediaMap)));
  database.close();
  return archive.toBuffer();
}

async function exportStudyDeck(window, payload) {
  const format = ["apkg", "csv", "tsv", "txt"].includes(payload?.format) ? payload.format : "csv";
  const cards = Array.isArray(payload?.cards) ? payload.cards.filter((card) => card && (card.front || card.back)) : [];
  if (!cards.length) throw new Error("This study set does not contain any flashcards.");
  const safeName = String(payload.name || "Study deck").replace(/[\\/:*?"<>|]+/g, "-");
  const result = await dialog.showSaveDialog(window, { title: "Export flashcards", defaultPath: `${safeName}.${format}`, filters: [{ name: format === "apkg" ? "Anki package" : `${format.toUpperCase()} file`, extensions: [format] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const content = format === "apkg" ? await createAnkiPackage(safeName, cards, Array.isArray(payload?.reviewLogs) ? payload.reviewLogs : []) : Buffer.from(exportText(cards, format), "utf8");
  fs.writeFileSync(result.filePath, content);
  return { path: result.filePath, format, count: cards.length };
}

async function exportNote(window, payload) {
  const extension = ["png", "html", "txt", "pdf"].includes(payload?.extension) ? payload.extension : "png";
  const safeName = String(payload?.name || "Note").replace(/[\\/:*?"<>|]+/g, "-");
  const match = String(payload?.data || "").match(/^data:[^;,]+;base64,(.+)$/s);
  if (!match) throw new Error("The note file could not be decoded.");
  const result = await dialog.showSaveDialog(window, { title: "Export note", defaultPath: `${safeName}.${extension}`, filters: [{ name: `${extension.toUpperCase()} file`, extensions: [extension] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, Buffer.from(match[1], "base64"));
  return { path: result.filePath, format: extension };
}

async function exportUserBackup(window, payload) {
  const json = String(payload?.json || "");
  let backup;
  try { backup = JSON.parse(json); }
  catch { throw new Error("The backup data could not be encoded."); }
  if (backup?.application !== "Your Study Buddy" || backup?.version !== 1 || !backup.storage || typeof backup.storage !== "object") throw new Error("The backup data is incomplete.");
  const safeName = String(payload?.name || "Your Study Buddy backup").replace(/[\\/:*?"<>|]+/g, "-");
  const result = await dialog.showSaveDialog(window, { title: "Export your information", defaultPath: `${safeName}.json`, filters: [{ name: "Your Study Buddy backup", extensions: ["json"] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  const saved = JSON.parse(fs.readFileSync(result.filePath, "utf8"));
  if (saved.application !== "Your Study Buddy" || saved.version !== 1) throw new Error("The saved backup could not be verified.");
  return { path: result.filePath, storageGroups: Object.keys(saved.storage).length, pdfAssets: Array.isArray(saved.assets) ? saved.assets.length : 0 };
}

function cancelAlarm(id) {
  const timer = alarmTimers.get(id);
  if (timer) clearTimeout(timer);
  alarmTimers.delete(id);
}

function scheduleAlarm(alarm) {
  if (!alarm?.id || !alarm?.timestamp) return;
  cancelAlarm(alarm.id);
  const delay = Number(alarm.timestamp) - Date.now();
  if (delay <= 0 || delay > 2_147_483_647) return;
  const timer = setTimeout(() => {
    if (Notification.isSupported()) {
      new Notification({
        title: alarm.title || "Your Study Buddy",
        body: alarm.description || "It’s time to study.",
      }).show();
    }
    alarmTimers.delete(alarm.id);
  }, delay);
  alarmTimers.set(alarm.id, timer);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 920,
    minHeight: 650,
    title: "Your Study Buddy",
    icon: path.join(__dirname, "../dist/your-study-buddy-icon.png"),
    backgroundColor: "#f7f7fb",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.loadFile(path.join(__dirname, "../dist/index.html"));
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.on("study-alarm:schedule", (_event, alarm) => scheduleAlarm(alarm));
ipcMain.on("study-alarm:cancel", (_event, id) => cancelAlarm(id));
ipcMain.handle("study-file:choose", async (event) => {
  try {
    return await chooseStudyFile(BrowserWindow.fromWebContents(event.sender));
  } catch (error) {
    return { error: error?.message || "This file could not be imported." };
  }
});
ipcMain.handle("note-file:choose", async (event) => {
  try {
    return await chooseNoteFile(BrowserWindow.fromWebContents(event.sender));
  } catch (error) {
    return { error: error?.message || "This note could not be imported." };
  }
});
ipcMain.handle("study-file:read-dropped", async (_event, filePath) => {
  try { return await readStudyFile(filePath); }
  catch (error) { return { error: error?.message || "This dropped file could not be imported." }; }
});
ipcMain.handle("clipboard:image", () => {
  const image = clipboard.readImage();
  if (!image.isEmpty()) return image.toDataURL();
  const uriList = clipboard.read("text/uri-list") || clipboard.readText();
  const fileUrl = String(uriList || "").split(/\r?\n/).find((line) => line.startsWith("file://"));
  if (fileUrl) {
    try {
      const filePath = decodeURIComponent(new URL(fileUrl).pathname).replace(/^\/(?:([A-Za-z]:))/i, "$1");
      if (/\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(filePath) && fs.existsSync(filePath)) {
        const fileImage = nativeImage.createFromPath(filePath);
        if (!fileImage.isEmpty()) return fileImage.toDataURL();
      }
    } catch {}
  }
  return "";
});
ipcMain.handle("study-deck:export", async (event, payload) => {
  try { return await exportStudyDeck(BrowserWindow.fromWebContents(event.sender), payload); }
  catch (error) { return { error: error?.message || "This deck could not be exported." }; }
});
ipcMain.handle("note:export", async (event, payload) => {
  try { return await exportNote(BrowserWindow.fromWebContents(event.sender), payload); }
  catch (error) { return { error: error?.message || "This note could not be exported." }; }
});
ipcMain.handle("user-data:export", async (event, payload) => {
  try { return await exportUserBackup(BrowserWindow.fromWebContents(event.sender), payload); }
  catch (error) { return { error: error?.message || "Your information could not be exported." }; }
});
ipcMain.handle("window:set-fullscreen", (event, active) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;
  window.setFullScreen(Boolean(active));
  return window.isFullScreen();
});
ipcMain.handle("app-update:check", async () => {
  try { return await checkForAppUpdate(); }
  catch (error) { return { currentVersion: app.getVersion(), available: false, error: error?.message || "Updates could not be checked." }; }
});
ipcMain.handle("app-update:open", async (_event, releaseUrl) => {
  const url = String(releaseUrl || "");
  if (!/^https:\/\/github\.com\/vkai3333\/Your-Study-Buddy-\/releases(?:\/|$)/i.test(url)) return false;
  await shell.openExternal(url);
  return true;
});

app.whenReady().then(() => {
  if (process.platform === "win32") app.setAppUserModelId("com.kaichenguo.studydesk");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
