// ── Config (loaded once) ──────────────────────────────────────────────────────
let cfg = { openaiApiKey: "", anthropicApiKey: "", secondbrainUrl: "http://localhost:3000" };
window.capture.getConfig().then((c) => { cfg = c; loadDomains(); });

// ── State ─────────────────────────────────────────────────────────────────────
const State = { IDLE: "idle", RECORDING: "recording", PROCESSING: "processing", PREVIEW: "preview", SUCCESS: "success" };
let state = State.IDLE;
let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let elapsed = 0;
let domains = [];
let transcript = "";
let tagged = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const screens = {
  capture: document.getElementById("screen-capture"),
  processing: document.getElementById("screen-processing"),
  preview: document.getElementById("screen-preview"),
  success: document.getElementById("screen-success"),
};
const btnMic          = document.getElementById("btn-mic");
const recIndicator    = document.getElementById("recording-indicator");
const timerEl         = document.getElementById("timer");
const micHint         = document.getElementById("mic-hint");
const procStatus      = document.getElementById("processing-status");
const previewTitle    = document.getElementById("preview-title");
const previewDomain   = document.getElementById("preview-domain");
const previewPriority = document.getElementById("preview-priority");
const previewDue      = document.getElementById("preview-due");
const previewTranscript = document.getElementById("preview-transcript");

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  elapsed = 0;
  timerEl.textContent = "0:00";
  timerInterval = setInterval(() => {
    elapsed++;
    timerEl.textContent = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  }, 1000);
}
function stopTimer() { clearInterval(timerInterval); timerInterval = null; }

// ── Recording ─────────────────────────────────────────────────────────────────
async function startRecording() {
  if (state !== State.IDLE) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Log which mic was selected
    const track = stream.getAudioTracks()[0];
    console.log("[Capture] Microphone:", track.label);
    micHint.textContent = `🎤 ${track.label}`;
    audioChunks = [];
    // Pick the first MIME type Electron actually supports on this platform
    const preferredTypes = [
      "audio/webm;codecs=opus", "audio/webm",
      "audio/ogg;codecs=opus",  "audio/ogg",
      "video/webm;codecs=vp8,opus", "video/webm",
    ];
    const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = onRecordingStop;
    mediaRecorder.start(100);
    state = State.RECORDING;
    btnMic.classList.add("recording");
    recIndicator.classList.remove("hidden");
    micHint.textContent = "Click to stop recording";
    startTimer();
  } catch (err) {
    alert("Microphone access denied: " + err.message);
  }
}

function stopRecording() {
  if (state !== State.RECORDING || !mediaRecorder) return;
  state = State.PROCESSING;
  stopTimer();
  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach((t) => t.stop());
  showScreen("processing");
}

async function onRecordingStop() {
  const actualMime = mediaRecorder.mimeType || "audio/webm";
  const blob = new Blob(audioChunks, { type: actualMime });
  try {
    procStatus.textContent = "Transcribing audio…";
    transcript = await transcribeAudio(blob);

    procStatus.textContent = "Tagging with AI…";
    tagged = await tagTranscript(transcript);

    populatePreview();
    showScreen("preview");
    state = State.PREVIEW;
    setTimeout(() => previewTitle.focus(), 50);
  } catch (err) {
    alert("Error: " + err.message);
    resetToIdle();
  }
}

// ── OpenAI Whisper (browser fetch) ────────────────────────────────────────────
async function transcribeAudio(blob) {
  if (!cfg.openaiApiKey) throw new Error("OpenAI API key not set. Open Settings.");
  // Derive a filename extension Whisper will accept from the actual MIME type
  const mime = blob.type.split(";")[0];
  const extMap = { "audio/webm": "webm", "audio/ogg": "ogg", "video/webm": "webm", "audio/mp4": "mp4" };
  const ext = extMap[mime] ?? "webm";
  const form = new FormData();
  form.append("file", blob, `recording.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "en");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.openaiApiKey}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Whisper error ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.text;
}

// ── Claude tagging (browser fetch) ───────────────────────────────────────────
async function tagTranscript(text) {
  if (!cfg.anthropicApiKey) throw new Error("Anthropic API key not set. Open Settings.");
  const today = new Date().toISOString().slice(0, 10);
  const domainList = domains.map((d) => d.name).join(", ") || "none";

  const prompt = `You are a task parser for a personal productivity app.
Given a voice transcript, return ONLY valid JSON (no markdown):
{
  "cleanTitle": "concise imperative task title",
  "domainName": "exact match from list or null",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "dueDate": "YYYY-MM-DD or null"
}

Domains: ${domainList}
Today: ${today}
Transcript: ${text}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude error ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const raw = data.content[0].text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(raw);
}

// ── Domains ───────────────────────────────────────────────────────────────────
async function loadDomains() {
  try {
    const res = await fetch(`${cfg.secondbrainUrl}/api/domains`);
    const json = await res.json();
    console.log("[Capture] domains response:", JSON.stringify(json));
    domains = Array.isArray(json) ? json : (json.data ?? []);
    previewDomain.innerHTML = '<option value="">No domain</option>';
    domains.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      previewDomain.appendChild(opt);
    });
    console.log(`[Capture] Loaded ${domains.length} domains`);
  } catch (err) {
    console.warn("[Capture] loadDomains failed:", err.message);
  }
}

// ── Preview ───────────────────────────────────────────────────────────────────
function populatePreview() {
  previewTitle.value = tagged?.cleanTitle ?? transcript.slice(0, 80);
  previewPriority.value = tagged?.priority ?? "MEDIUM";
  previewDue.value = tagged?.dueDate ?? "";
  previewTranscript.textContent = transcript;
  if (tagged?.domainName) {
    const match = domains.find((d) => d.name.toLowerCase() === tagged.domainName.toLowerCase());
    if (match) previewDomain.value = match.id;
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function saveToInbox() {
  if (state !== State.PREVIEW) return;
  state = State.SUCCESS;

  const payload = {
    rawText: transcript,
    source: "VOICE",
    aiSuggestedDomainId: previewDomain.value || null,
    aiSuggestionsJson: JSON.stringify({
      cleanTitle: previewTitle.value,
      priority: previewPriority.value,
      dueDate: previewDue.value || null,
      transcript,
    }),
  };

  try {
    const res = await fetch(`${cfg.secondbrainUrl}/api/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    showScreen("success");
    setTimeout(() => { resetToIdle(); window.capture.hideWindow(); }, 1200);
  } catch (err) {
    alert("Save failed: " + err.message);
    state = State.PREVIEW;
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetToIdle() {
  state = State.IDLE;
  audioChunks = [];
  transcript = "";
  tagged = null;
  btnMic.classList.remove("recording");
  recIndicator.classList.add("hidden");
  micHint.textContent = "Click to record · Space to start/stop";
  stopTimer();
  showScreen("capture");
}

// ── Event listeners ───────────────────────────────────────────────────────────
btnMic.addEventListener("click", () => {
  if (state === State.IDLE) startRecording();
  else if (state === State.RECORDING) stopRecording();
});

document.getElementById("btn-settings").addEventListener("click", () => window.capture.openSettings());
["btn-close", "btn-close2", "btn-close3"].forEach((id) =>
  document.getElementById(id)?.addEventListener("click", () => { resetToIdle(); window.capture.hideWindow(); })
);
document.getElementById("btn-discard").addEventListener("click", resetToIdle);
document.getElementById("btn-save").addEventListener("click", saveToInbox);

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  if (e.key === "Escape") { resetToIdle(); window.capture.hideWindow(); return; }
  if (e.key === " " && state === State.IDLE && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
    e.preventDefault(); startRecording(); return;
  }
  if (e.key === " " && state === State.RECORDING) { e.preventDefault(); stopRecording(); return; }
  if (e.key === "Enter" && state === State.PREVIEW && tag !== "BUTTON") { e.preventDefault(); saveToInbox(); }
});

window.capture.onWindowShown(() => { if (state === State.SUCCESS) resetToIdle(); });
