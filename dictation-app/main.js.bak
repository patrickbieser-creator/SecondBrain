const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  clipboard,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const Store = require("electron-store");

const store = new Store({
  defaults: {
    openaiApiKey: "",
    anthropicApiKey: "",
    claudeCleanup: false,
    claudeModel: "claude-haiku-4-5-20251001",
    hotkey: "CommandOrControl+Alt+D",
    language: "en",
    autoPaste: true,
    silenceTimeout: 2500,
  },
});

let tray = null;
let recorderWindow = null; // hidden — runs MediaRecorder + Whisper
let indicatorWindow = null; // floating card, focusable: false
let settingsWindow = null;
let isRecording = false;
let isPaused = false;

// ── Icons ──────────────────────────────────────────────────────────────────────
function getTrayIcon(recording) {
  const iconFile = path.join(
    __dirname,
    "assets",
    recording ? "mic-on.png" : "mic-off.png"
  );
  if (fs.existsSync(iconFile)) return nativeImage.createFromPath(iconFile);
  return nativeImage.createEmpty();
}

// ── Windows ────────────────────────────────────────────────────────────────────
function createRecorderWindow() {
  recorderWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // allow renderer to POST to OpenAI API
    },
  });
  recorderWindow.loadFile(path.join(__dirname, "recorder.html"));
  // Uncomment to debug the hidden recorder window:
  // recorderWindow.webContents.openDevTools({ mode: "detach" });
}

function createIndicatorWindow() {
  indicatorWindow = new BrowserWindow({
    width: 300,
    height: 108,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false, // CRITICAL — do not steal focus from target window
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "indicator-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  indicatorWindow.setPosition(Math.round(width / 2 - 150), height - 126);
  indicatorWindow.loadFile(path.join(__dirname, "indicator.html"));
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 580,
    title: "Dictation Settings",
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWindow.loadFile(path.join(__dirname, "settings.html"));
  settingsWindow.on("closed", () => (settingsWindow = null));
}

// ── Recording control ──────────────────────────────────────────────────────────
function setIndicatorState(state, detail = "") {
  // Indicator has no preload — use executeJavaScript to call the global setState()
  const safeDetail = detail.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  indicatorWindow.webContents
    .executeJavaScript(`window.setState("${state}", "${safeDetail}")`)
    .catch(() => {});
}

function startRecording() {
  if (isRecording) return;
  isRecording = true;
  isPaused = false;
  tray.setImage(getTrayIcon(true));
  tray.setToolTip("Dictation — Recording…");
  indicatorWindow.show();
  setIndicatorState("recording");
  recorderWindow.webContents.send("start-recording", {
    language: store.get("language"),
    silenceTimeout: store.get("silenceTimeout"),
  });
}

function stopRecording() {
  if (!isRecording) return;
  isRecording = false;
  isPaused = false;
  tray.setImage(getTrayIcon(false));
  tray.setToolTip("Dictation — Transcribing…");
  setIndicatorState("processing");
  recorderWindow.webContents.send("stop-recording");
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// ── App ready ──────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createRecorderWindow();
  createIndicatorWindow();

  tray = new Tray(getTrayIcon(false));
  tray.setToolTip("Dictation — Ready");
  tray.on("click", toggleRecording);

  const hotkey = store.get("hotkey");
  const fallbacks = [hotkey, "CommandOrControl+Alt+D", "CommandOrControl+Shift+D"];
  let registered = null;
  for (const hk of fallbacks) {
    try {
      if (globalShortcut.register(hk, toggleRecording)) {
        registered = hk;
        break;
      }
    } catch (_) {}
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: registered
          ? `Start/Stop Dictation  (${registered})`
          : "Start/Stop Dictation",
        click: toggleRecording,
      },
      { label: "Settings…", click: createSettingsWindow },
      { type: "separator" },
      { label: "Quit", role: "quit" },
    ])
  );

  if (!registered) {
    console.warn("[Dictation] Could not register any global hotkey.");
  } else {
    console.log(`[Dictation] Ready — hotkey: ${registered}`);
  }

  // Open settings on first run if no API key
  if (!store.get("openaiApiKey")) {
    createSettingsWindow();
  }
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", (e) => e.preventDefault());

// ── IPC: transcript from recorder ─────────────────────────────────────────────
ipcMain.on("transcript-ready", (_e, { text, error }) => {
  tray.setToolTip("Dictation — Ready");

  if (error || !text || !text.trim()) {
    console.error("[Dictation] Transcription error:", error ?? "empty result");
    setIndicatorState("error", error ?? "No speech detected");
    setTimeout(() => indicatorWindow.hide(), 2500);
    return;
  }

  const trimmed = text.trim();

  // Replace spoken newline commands with actual newline characters.
  // Most apps accept multiline clipboard content and insert breaks correctly.
  const finalText = trimmed.replace(
    /\b(new line|newline|next line|new paragraph)\b/gi,
    "\n"
  );
  console.log(`[Dictation] Pasting: "${finalText}"`);

  // Write to clipboard unconditionally
  const prevClipboard = clipboard.readText();
  clipboard.writeText(finalText);

  if (store.get("autoPaste")) {
    // Give clipboard time to settle, then send Ctrl+V to foreground window.
    // The target window keeps focus because indicatorWindow is focusable:false
    // and recorderWindow is hidden — so the user's window stays in the foreground.
    setTimeout(() => {
      const cmd = `powershell -NoProfile -NonInteractive -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('^v')"`;
      exec(cmd, (err) => {
        if (err) console.error("[Dictation] Paste error:", err.message);
        // Restore previous clipboard after a brief delay
        setTimeout(() => clipboard.writeText(prevClipboard), 800);
      });
    }, 80);
  }

  setIndicatorState("success", finalText.replace(/\n/g, " ↵ "));
  setTimeout(() => indicatorWindow.hide(), 2000);
});

// Recorder signals Claude cleanup is starting — show "Cleaning up…" state
ipcMain.on("cleaning-started", () => {
  tray.setToolTip("Dictation — Cleaning up…");
  setIndicatorState("cleaning");
});

// Recorder signals it auto-stopped due to silence — update UI only.
// Do NOT send stop-recording back; the recorder already stopped itself.
ipcMain.on("recording-auto-stopped", () => {
  if (!isRecording) return;
  isRecording = false;
  isPaused = false;
  tray.setImage(getTrayIcon(false));
  tray.setToolTip("Dictation — Transcribing…");
  setIndicatorState("processing");
});

// ── IPC: indicator buttons ─────────────────────────────────────────────────────
ipcMain.on("indicator-pause", () => {
  if (!isRecording || isPaused) return;
  isPaused = true;
  setIndicatorState("paused");
  recorderWindow.webContents.send("pause-recording");
});

ipcMain.on("indicator-resume", () => {
  if (!isRecording || !isPaused) return;
  isPaused = false;
  setIndicatorState("recording");
  recorderWindow.webContents.send("resume-recording");
});

ipcMain.on("indicator-stop", () => {
  if (!isRecording) return;
  stopRecording();
});

ipcMain.on("indicator-discard", () => {
  if (!isRecording) return;
  isRecording = false;
  isPaused = false;
  tray.setImage(getTrayIcon(false));
  tray.setToolTip("Dictation — Ready");
  recorderWindow.webContents.send("discard-recording");
  indicatorWindow.hide();
});

// Recorder reports which microphone was opened
ipcMain.on("mic-info", (_e, label) => {
  // Shorten common Windows prefixes to keep the pill compact
  const clean = label
    .replace(/^Default\s*-\s*/i, "")
    .replace(/\s*\(.*?(Realtek|NVIDIA|AMD|Intel|USB|HD Audio|High Definition)[^)]*\)/gi, (m) => {
      const inner = m.replace(/[()]/g, "").trim();
      return ` (${inner.split(/\s+/).slice(0, 2).join(" ")})`;
    })
    .trim();
  const safe = clean.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  indicatorWindow.webContents
    .executeJavaScript(`window.setMicLabel("${safe}")`)
    .catch(() => {});
});

// ── IPC: config ────────────────────────────────────────────────────────────────
ipcMain.handle("get-config", () => ({
  openaiApiKey: store.get("openaiApiKey"),
  anthropicApiKey: store.get("anthropicApiKey"),
  claudeCleanup: store.get("claudeCleanup"),
  claudeModel: store.get("claudeModel"),
  hotkey: store.get("hotkey"),
  language: store.get("language"),
  autoPaste: store.get("autoPaste"),
  silenceTimeout: store.get("silenceTimeout"),
}));

ipcMain.handle("set-config", (_e, values) => {
  const allowed = [
    "openaiApiKey", "anthropicApiKey", "claudeCleanup", "claudeModel",
    "hotkey", "language", "autoPaste", "silenceTimeout",
  ];
  for (const key of allowed) {
    if (values[key] !== undefined) store.set(key, values[key]);
  }

  // Re-register hotkey if it changed
  if (values.hotkey) {
    globalShortcut.unregisterAll();
    try {
      globalShortcut.register(values.hotkey, toggleRecording);
    } catch (_) {}
  }

  return { ok: true };
});

ipcMain.on("open-settings", () => createSettingsWindow());
