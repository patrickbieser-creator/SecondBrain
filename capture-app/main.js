const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");

const store = new Store({
  defaults: {
    openaiApiKey: "",
    anthropicApiKey: "",
    secondbrainUrl: "http://localhost:3000",
  },
});

let mainWindow = null;
let settingsWindow = null;
let tray = null;

function getTrayIcon() {
  const iconPath = path.join(__dirname, "assets", "icon.png");
  if (fs.existsSync(iconPath)) return nativeImage.createFromPath(iconPath);
  return nativeImage.createEmpty();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 320,
    show: false,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,  // allow file:// renderer to fetch localhost API
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.webContents.openDevTools({ mode: "detach" });
  mainWindow.on("blur", () => { if (mainWindow?.isVisible()) mainWindow.hide(); });
  mainWindow.on("closed", () => { mainWindow = null; });
}

function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({
    width: 480,
    height: 360,
    title: "Capture App Settings",
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });
  settingsWindow.loadFile(path.join(__dirname, "renderer", "settings.html"));
  settingsWindow.on("closed", () => (settingsWindow = null));
}

function toggleWindow() {
  if (!mainWindow) createMainWindow();
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("window-shown");
  }
}

app.whenReady().then(() => {
  tray = new Tray(getTrayIcon());
  tray.on("click", toggleWindow);

  createMainWindow();

  const hotkeys = ["CommandOrControl+Shift+Space", "CommandOrControl+Alt+Space", "CommandOrControl+Shift+X"];
  let registeredHotkey = null;
  for (const hk of hotkeys) {
    if (globalShortcut.register(hk, toggleWindow)) { registeredHotkey = hk; break; }
  }

  const label = registeredHotkey ? `Capture (${registeredHotkey})` : "Capture (use tray)";
  tray.setToolTip(`SecondBrain Capture${registeredHotkey ? " — " + registeredHotkey : ""}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label, click: toggleWindow },
    { label: "Settings", click: createSettingsWindow },
    { type: "separator" },
    { label: "Quit", role: "quit" },
  ]));

  console.log(`[Capture] Ready. Hotkey: ${registeredHotkey ?? "none"}`);

  if (!store.get("openaiApiKey") || !store.get("anthropicApiKey")) {
    createSettingsWindow();
  }
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", (e) => e.preventDefault());

// ── IPC: config ───────────────────────────────────────────────────────────────
ipcMain.handle("get-config", () => ({
  openaiApiKey: store.get("openaiApiKey"),
  anthropicApiKey: store.get("anthropicApiKey"),
  secondbrainUrl: store.get("secondbrainUrl"),
}));

ipcMain.handle("set-config", (_e, values) => {
  if (values.openaiApiKey !== undefined) store.set("openaiApiKey", values.openaiApiKey);
  if (values.anthropicApiKey !== undefined) store.set("anthropicApiKey", values.anthropicApiKey);
  if (values.secondbrainUrl !== undefined) store.set("secondbrainUrl", values.secondbrainUrl);
  return { ok: true };
});

// ── IPC: window controls ──────────────────────────────────────────────────────
ipcMain.on("hide-window", () => { if (mainWindow) mainWindow.hide(); });
ipcMain.on("open-settings", () => createSettingsWindow());
