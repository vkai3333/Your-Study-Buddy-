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
