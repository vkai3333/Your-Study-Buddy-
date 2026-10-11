const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  platform: process.platform,
  scheduleAlarm(alarm) {
    ipcRenderer.send("study-alarm:schedule", alarm);
  },
  cancelAlarm(id) {
    ipcRenderer.send("study-alarm:cancel", id);
  },
  chooseStudyFile() {
    return ipcRenderer.invoke("study-file:choose");
  },
  exportStudyDeck(payload) {
    return ipcRenderer.invoke("study-deck:export", payload);
  },
});
