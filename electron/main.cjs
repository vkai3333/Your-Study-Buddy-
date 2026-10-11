const { app, BrowserWindow, dialog, ipcMain, Notification, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const AdmZip = require("adm-zip");
const initSqlJs = require("sql.js");
const { decompress } = require("fzstd");

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
    const result = database.exec("SELECT id, flds FROM notes ORDER BY id;")[0];
    if (!result?.values?.length) throw new Error("This APKG package does not contain any notes.");
    const notes = result.values.map(([id, fields]) => ({ id, fields: String(fields || "").split("\u001f") }));
    return { name: path.basename(filePath), notes };
  } finally {
    database.close();
  }
}

async function chooseStudyFile(window) {
  const result = await dialog.showOpenDialog(window, {
    title: "Import flashcards",
    buttonLabel: "Import",
    properties: ["openFile"],
    filters: [
      { name: "Study files", extensions: ["apkg", "txt", "csv", "tsv", "pdf", "pptx"] },
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
  if (["txt", "csv", "tsv"].includes(extension)) {
    return { kind: "text", name: path.basename(filePath), extension, text: fs.readFileSync(filePath, "utf8") };
  }
  throw new Error("Choose an APKG, PDF, PPTX, TXT, CSV, or TSV file.");
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
  let lines = sourceLines.map((line) => line.replace(/\s+/g, " ").trim()).filter((line) => line && !/(?:©|Copyright).*Worth Publishers/i.test(line) && !/^page\s*\d+$/i.test(line));
  if (!lines.length) return "";
  const combined = lines.join(" ");
  if (/^(?:True or False|Learning Targets?|Check Your Understanding|AP®? Exam Tip)\b/i.test(lines[0]) || /(?:Examine the Concept|Apply the Concept).*(?:Examine the Concept|Apply the Concept)/i.test(combined)) return "";
  if (lines.length <= 2 && combined.length < 150 && !/:/.test(combined)) return "";
  const output = [];
  lines.forEach((line) => {
    const isBullet = /^(?:[•●▪◦*-]|\d+[.)])\s*/.test(line);
    const cleaned = line.replace(/^[•●▪◦]\s*/, "- ");
    const previous = output[output.length - 1];
    const continuation = previous && !isBullet && !/[.!?:;]$/.test(previous) && !/^[A-Z][^.!?]{2,70}:$/.test(cleaned) && /^[a-z(]/.test(cleaned);
    if (continuation) output[output.length - 1] = `${previous} ${cleaned}`;
    else output.push(cleaned);
  });
  if (!output.length) return "";
  const first = output[0];
  const titleLike = first.length <= 90 && !/[.!?]$/.test(first) && !/^[•*-]/.test(first) && !/^[^:]{2,60}:\s+.+/.test(first);
  if (titleLike) output[0] = `## ${first}`;
  return output.join("\n");
}

function decodeXmlText(value) {
  return String(value || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));
}

function powerpointParagraph(paragraphXml) {
  const level = Math.max(0, Number(paragraphXml.match(/<a:pPr[^>]*\blvl="(\d+)"/)?.[1] || 0));
  const chunks = [];
  const tokenPattern = /<a:r>([\s\S]*?)<\/a:r>|<a:fld[^>]*>([\s\S]*?)<\/a:fld>|<a:br\b[^>]*\/>/g;
  for (const token of paragraphXml.matchAll(tokenPattern)) {
    if (token[0].startsWith("<a:br")) { chunks.push("\n"); continue; }
    const body = token[1] || token[2] || "";
    const value = [...body.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXmlText(match[1])).join("");
    if (!value) continue;
    const bold = /<a:rPr[^>]*\bb="1"/.test(body);
    chunks.push(bold && value.trim() ? `**${value}**` : value);
  }
  if (!chunks.length) chunks.push(...[...paragraphXml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXmlText(match[1])));
  const text = chunks.join("").replace(/[ \t]+([,.;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
  if (!text) return null;
  const numbered = /^\s*(?:\d+|[A-Z])\s*[.)]\s+/.test(text);
  return `${"  ".repeat(level)}${numbered ? "" : "- "}${text}`;
}

function powerpointSlideText(xml) {
  const shapes = [...xml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)].map((match) => match[1]);
  let title = "";
  const body = [];
  shapes.forEach((shape) => {
    const paragraphs = [...shape.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((match) => powerpointParagraph(match[1])).filter(Boolean);
    if (!paragraphs.length) return;
    const isTitle = /<p:ph[^>]*\btype="(?:title|ctrTitle)"/.test(shape);
    if (isTitle && !title) title = paragraphs.map((line) => line.replace(/^\s*-\s*/, "").replace(/\*\*/g, "")).join(" ");
    else body.push(...paragraphs);
  });
  const plainTitle = title.replace(/\s+/g, " ").trim();
  const administrative = /^(?:questions?|agenda|bell schedule|classroom expectations|reading guides?|contact information|about (?:me|the teacher)|homework|reminders?|materials|grading|course syllabus)$/i.test(plainTitle)
    || /(?:walkthrough|class activity|map activity|discussion questions?|ap daily|take notes|exam review directions)/i.test(plainTitle);
  if (administrative) return "";
  const uniqueBody = body.filter((line, index) => {
    const plain = line.replace(/^\s*-\s*/, "").replace(/\*\*/g, "").trim();
    return line.length > 2 && body.indexOf(line) === index && !/\?$/.test(plain) && !/^(?:watch|begin at|turn to|complete|submit|discuss with|take notes|answer the following)\b/i.test(plain);
  });
  if (!plainTitle && !uniqueBody.length) return "";
  return [plainTitle ? `## ${plainTitle}` : "", ...uniqueBody].filter(Boolean).join("\n");
}

function readPowerPointText(filePath) {
  const archive = new AdmZip(filePath);
  const slideEntries = archive.getEntries().filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)).sort((a, b) => Number(a.entryName.match(/\d+/)?.[0]) - Number(b.entryName.match(/\d+/)?.[0]));
  if (!slideEntries.length) throw new Error("No readable slides were found in this PowerPoint.");
  let slides = slideEntries.map((entry) => powerpointSlideText(entry.getData().toString("utf8"))).filter(Boolean);
  const contentStart = slides.findIndex((slide) => /^##\s+(?:unit|chapter|topic|module)\s+\d+\b/im.test(slide));
  if (contentStart >= 3) slides = slides.slice(contentStart);
  slides = slides.filter((slide) => slide.split("\n").filter(Boolean).length > 1 || /^##\s+(?:unit|chapter|topic|module)\s+\d+\b/im.test(slide));
  if (!slides.length) throw new Error("No usable study text was found in this PowerPoint.");
  return slides.join("\n\n");
}

function safeFileName(value) {
  return String(value || "study-set").replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-").replace(/\s+/g, " ").trim() || "study-set";
}

function delimitedCards(cards, delimiter) {
  const quote = (value) => `"${String(value || "").replace(/"/g, '""')}"`;
  return [["Front", "Back"], ...(cards || []).map((card) => [card.front, card.back])].map((row) => row.map(quote).join(delimiter)).join("\r\n");
}

async function createAnkiPackage(payload) {
  const SQL = await sqlEngine();
  const database = new SQL.Database();
  const now = Math.floor(Date.now() / 1000);
  const modelId = now * 1000;
  const deckId = modelId + 1;
  const model = { id: modelId, name: "Your Study Buddy", type: 0, mod: now, usn: -1, sortf: 0, did: deckId, tmpls: [{ name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}<hr id=answer>{{Back}}", bqfmt: "", bafmt: "", did: null }], flds: [{ name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] }, { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] }], css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }", latexPre: "", latexPost: "", latexsvg: false, req: [[0, "any", [0]]] };
  const deck = { id: deckId, name: String(payload.name || "Study set"), mod: now, usn: -1, desc: "Exported from Your Study Buddy", dyn: 0, collapsed: false, extendNew: 20, extendRev: 50 };
  database.run("CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null); CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null); CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null); CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null); CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null); CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due); CREATE INDEX ix_revlog_usn on revlog (usn); CREATE INDEX ix_revlog_cid on revlog (cid);");
  database.run("INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, '{}', ?, ?, '{}', '{}')", [now, Date.now(), Date.now(), JSON.stringify({ [modelId]: model }), JSON.stringify({ [deckId]: deck, 1: { id: 1, name: "Default", mod: now, usn: 0, desc: "", dyn: 0, collapsed: false } })]);
  (payload.cards || []).forEach((card, index) => {
    const noteId = modelId + 10 + index * 2;
    database.run("INSERT INTO notes VALUES (?, ?, ?, ?, -1, '', ?, ?, 0, 0, '')", [noteId, `ysb${noteId}`, modelId, now, `${card.front || ""}\u001f${card.back || ""}`, card.front || ""]);
    database.run("INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')", [noteId + 1, noteId, deckId, now, index + 1]);
  });
  const archive = new AdmZip();
  archive.addFile("collection.anki2", Buffer.from(database.export()));
  archive.addFile("media", Buffer.from("{}"));
  database.close();
  return archive.toBuffer();
}

async function exportStudySet(window, payload) {
  const format = ["apkg", "csv", "tsv", "json"].includes(payload?.format) ? payload.format : "apkg";
  const result = await dialog.showSaveDialog(window, { title: "Export study set", defaultPath: `${safeFileName(payload?.name)}.${format}`, filters: [{ name: format === "apkg" ? "Anki package" : `${format.toUpperCase()} file`, extensions: [format] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const output = format === "apkg" ? await createAnkiPackage(payload) : format === "csv" ? delimitedCards(payload.cards, ",") : format === "tsv" ? delimitedCards(payload.cards, "\t") : JSON.stringify(payload, null, 2);
  fs.writeFileSync(result.filePath, output);
  return { canceled: false };
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
ipcMain.handle("study-file:read-dropped", async (_event, filePath) => {
  try { return await readStudyFile(filePath); }
  catch (error) { return { error: error?.message || "This dropped file could not be imported." }; }
});
ipcMain.handle("study-file:export", async (event, payload) => {
  try { return await exportStudySet(BrowserWindow.fromWebContents(event.sender), payload); }
  catch (error) { return { error: error?.message || "This study set could not be exported." }; }
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
