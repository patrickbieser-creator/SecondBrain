const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dictation", {
  // Recorder → Main
  transcriptReady: (payload) => ipcRenderer.send("transcript-ready", payload),
  autoStopped: () => ipcRenderer.send("recording-auto-stopped"),
  micInfo: (label) => ipcRenderer.send("mic-info", label),
  cleaningStarted: () => ipcRenderer.send("cleaning-started"),

  // Main → Recorder
  onStartRecording: (cb) =>
    ipcRenderer.on("start-recording", (_e, opts) => cb(opts)),
  onStopRecording:  (cb) => ipcRenderer.on("stop-recording",  () => cb()),
  onPause:          (cb) => ipcRenderer.on("pause-recording",  () => cb()),
  onResume:         (cb) => ipcRenderer.on("resume-recording", () => cb()),
  onDiscard:        (cb) => ipcRenderer.on("discard-recording", () => cb()),

  // Settings
  getConfig: () => ipcRenderer.invoke("get-config"),
  setConfig: (values) => ipcRenderer.invoke("set-config", values),
  openSettings: () => ipcRenderer.send("open-settings"),
});
