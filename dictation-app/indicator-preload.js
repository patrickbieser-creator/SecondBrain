const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("controls", {
  pause:   () => ipcRenderer.send("indicator-pause"),
  resume:  () => ipcRenderer.send("indicator-resume"),
  stop:    () => ipcRenderer.send("indicator-stop"),
  discard: () => ipcRenderer.send("indicator-discard"),
});
