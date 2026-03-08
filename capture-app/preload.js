const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("capture", {
  getConfig: () => ipcRenderer.invoke("get-config"),
  setConfig: (values) => ipcRenderer.invoke("set-config", values),
  hideWindow: () => ipcRenderer.send("hide-window"),
  openSettings: () => ipcRenderer.send("open-settings"),
  onWindowShown: (cb) => ipcRenderer.on("window-shown", cb),
});
