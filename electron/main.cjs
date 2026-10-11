const { app, BrowserWindow, dialog, ipcMain, Notification, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
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
      { name: "Anki and notes files", extensions: ["apkg", "txt", "csv", "tsv"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const extension = path.extname(filePath).slice(1).toLowerCase();
  if (extension === "apkg") return { kind: "apkg", payload: await readAnkiPackage(filePath) };
  if (["txt", "csv", "tsv"].includes(extension)) {
    return { kind: "text", name: path.basename(filePath), extension, text: fs.readFileSync(filePath, "utf8") };
  }
  throw new Error("Choose an APKG, TXT, CSV, or TSV file.");
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

async function createAnkiPackage(name, cards) {
  const SQL = await sqlEngine();
  const database = new SQL.Database();
  const now = Date.now();
  const modelId = now;
  const deckId = now + 1;
  const model = { id: modelId, name: "Your Study Buddy Basic", type: 0, mod: Math.floor(now / 1000), usn: -1, sortf: 0, did: deckId, tmpls: [{ name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}<hr id=answer>{{Back}}", bqfmt: "", bafmt: "", did: null, bfont: "Arial", bsize: 20 }], flds: [{ name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, description: "", plainText: false, collapsed: false, excludeFromSearch: false }, { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, description: "", plainText: false, collapsed: false, excludeFromSearch: false }], css: ".card { font-family: Arial; font-size: 20px; text-align: center; color: black; background-color: white; }", latexPre: "", latexPost: "", latexsvg: false, req: [[0, "all", [0]]] };
  const deck = { id: deckId, name, mod: Math.floor(now / 1000), usn: -1, desc: "Exported from Your Study Buddy", dyn: 0, collapsed: false, browserCollapsed: false, extendNew: 0, extendRev: 0, conf: 1 };
  database.run("CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null); CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null); CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null); CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null); CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null); CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due); CREATE INDEX ix_revlog_usn on revlog (usn); CREATE INDEX ix_revlog_cid on revlog (cid);");
  database.run("INSERT INTO col VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)", [Math.floor(now / 1000), now, now, 11, 0, -1, 0, "{}", JSON.stringify({ [modelId]: model }), JSON.stringify({ [deckId]: deck }), "{}", "{}"]);
  const noteStatement = database.prepare("INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)");
  const cardStatement = database.prepare("INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  cards.forEach((card, index) => {
    const noteId = now + 1000 + index * 2;
    const cardId = noteId + 1;
    const front = ankiHtml(card.front);
    const back = ankiHtml(card.back);
    const checksum = parseInt(crypto.createHash("sha1").update(front).digest("hex").slice(0, 8), 16);
    noteStatement.run([noteId, crypto.randomBytes(8).toString("base64url"), modelId, Math.floor(now / 1000), -1, "", `${front}\u001f${back}`, String(card.front || ""), checksum, 0, ""]);
    cardStatement.run([cardId, noteId, deckId, 0, Math.floor(now / 1000), -1, 0, 0, index + 1, 0, 2500, 0, 0, 0, 0, 0, 0, ""]);
  });
  noteStatement.free(); cardStatement.free();
  const archive = new AdmZip();
  archive.addFile("collection.anki2", Buffer.from(database.export()));
  archive.addFile("media", Buffer.from("{}"));
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
  const content = format === "apkg" ? await createAnkiPackage(safeName, cards) : Buffer.from(exportText(cards, format), "utf8");
  fs.writeFileSync(result.filePath, content);
  return { path: result.filePath, format, count: cards.length };
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
ipcMain.handle("study-deck:export", async (event, payload) => {
  try { return await exportStudyDeck(BrowserWindow.fromWebContents(event.sender), payload); }
  catch (error) { return { error: error?.message || "This deck could not be exported." }; }
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
