const { contextBridge, ipcRenderer, webUtils } = require("electron");

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
  chooseNoteFile() {
    return ipcRenderer.invoke("note-file:choose");
  },
  readDroppedStudyFile(file) {
    return ipcRenderer.invoke("study-file:read-dropped", webUtils.getPathForFile(file));
  },
  readClipboardImage() {
    return ipcRenderer.invoke("clipboard:image");
  },
  exportStudyDeck(payload) {
    return ipcRenderer.invoke("study-deck:export", payload);
  },
  exportNote(payload) {
    return ipcRenderer.invoke("note:export", payload);
  },
  exportUserData(payload) {
    return ipcRenderer.invoke("user-data:export", payload);
  },
  setFullscreen(active) {
    return ipcRenderer.invoke("window:set-fullscreen", Boolean(active));
  },
  checkForUpdates() {
    return ipcRenderer.invoke("app-update:check");
  },
  openUpdate(releaseUrl) {
    return ipcRenderer.invoke("app-update:open", releaseUrl);
  },
});
