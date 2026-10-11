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
  readDroppedStudyFile(file) {
    const filePath = webUtils.getPathForFile(file);
    return ipcRenderer.invoke("study-file:read-dropped", filePath);
  },
  exportStudySet(payload) {
    return ipcRenderer.invoke("study-file:export", payload);
  },
});
