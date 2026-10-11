const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  platform: process.platform,
  scheduleAlarm(alarm) {
    ipcRenderer.send("study-alarm:schedule", alarm);
  },
  cancelAlarm(id) {
    ipcRenderer.send("study-alarm:cancel", id);
  },
});
