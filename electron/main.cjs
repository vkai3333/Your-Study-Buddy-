const { app, BrowserWindow, ipcMain, Notification, shell } = require("electron");
const path = require("node:path");

const alarmTimers = new Map();

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
