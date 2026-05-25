const refs = {
  camera: document.querySelector("#camera"),
  motionCanvas: document.querySelector("#motionCanvas"),
  beatCanvas: document.querySelector("#beatCanvas"),
  cameraStatus: document.querySelector("#cameraStatus"),
  bodyStatus: document.querySelector("#bodyStatus"),
  songStatus: document.querySelector("#songStatus"),
  mapStatus: document.querySelector("#mapStatus"),
  beatStatus: document.querySelector("#beatStatus"),
  motionMeter: document.querySelector("#motionMeter"),
  hitFlash: document.querySelector("#hitFlash"),
  countdownOverlay: document.querySelector("#countdownOverlay"),
  countdownValue: document.querySelector("#countdownValue"),
  scoreValue: document.querySelector("#scoreValue"),
  comboValue: document.querySelector("#comboValue"),
  multiplierValue: document.querySelector("#multiplierValue"),
  bestValue: document.querySelector("#bestValue"),
  accuracyValue: document.querySelector("#accuracyValue"),
  timeValue: document.querySelector("#timeValue"),
  recentHits: document.querySelector("#recentHits"),
  playerName: document.querySelector("#playerName"),
  songFile: document.querySelector("#songFile"),
  songPlayer: document.querySelector("#songPlayer"),
  cameraButton: document.querySelector("#cameraButton"),
  startButton: document.querySelector("#startButton"),
  stopButton: document.querySelector("#stopButton"),
  bpmInput: document.querySelector("#bpmInput"),
  tapButton: document.querySelector("#tapButton"),
  offsetBackButton: document.querySelector("#offsetBackButton"),
  offsetForwardButton: document.querySelector("#offsetForwardButton"),
  motionThreshold: document.querySelector("#motionThreshold"),
  timingWindow: document.querySelector("#timingWindow"),
  cameraAssist: document.querySelector("#cameraAssist"),
  cameraAssistValue: document.querySelector("#cameraAssistValue"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  exportScoresButton: document.querySelector("#exportScoresButton"),
  importScoresButton: document.querySelector("#importScoresButton"),
  importScoresFile: document.querySelector("#importScoresFile"),
  shareScoresButton: document.querySelector("#shareScoresButton"),
  clearScoresButton: document.querySelector("#clearScoresButton"),
  introOverlay: document.querySelector("#introOverlay"),
  skipIntroButton: document.querySelector("#skipIntroButton"),
  showTutorialButton: document.querySelector("#showTutorialButton"),
  tutorialLayer: document.querySelector("#tutorialLayer"),
  tutorialBubble: document.querySelector("#tutorialBubble"),
  tutorialStepLabel: document.querySelector("#tutorialStepLabel"),
  tutorialText: document.querySelector("#tutorialText"),
  endTutorialButton: document.querySelector("#endTutorialButton"),
};

const STORAGE_KEY = "beatcam-dance-highscores-v1";
const INTRO_STORAGE_KEY = "beatcam-dance-intro-seen-v3";
const DEMO_DURATION = 64;
const MOTION_WIDTH = 80;
const MOTION_HEIGHT = 45;
const GRID_COLS = 16;
const GRID_ROWS = 9;
const DIFFICULTY_SLIDER_MIN = 0;
const DIFFICULTY_SLIDER_DEFAULT = 33;
const DIFFICULTY_SLIDER_MAX = 100;
const DIFFICULTY_THRESHOLD_MIN = 8;
const DIFFICULTY_THRESHOLD_DEFAULT = 80;
const DIFFICULTY_THRESHOLD_MAX = 100;
const CAMERA_ASSIST_MIN = 0;
const CAMERA_ASSIST_DEFAULT = 40;
const CAMERA_ASSIST_MAX = 180;
const PERFECT_WINDOW = 0.085;
const GREAT_WINDOW = 0.135;
const TIMING_DISPLAY_DEADZONE = 0.008;
const COMEBACK_BOOST_CAP = 4;
const MEDIAPIPE_VERSION = "0.10.35";
const MEDIAPIPE_PACKAGE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const MEDIAPIPE_WASM_URL = `${MEDIAPIPE_PACKAGE_URL}/wasm`;
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const LANDMARK_CONFIDENCE = 0.42;
const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [15, 17],
  [16, 18],
  [27, 31],
  [28, 32],
];
const POSE_MOVEMENT_WEIGHTS = new Map([
  [11, 0.65],
  [12, 0.65],
  [13, 0.82],
  [14, 0.82],
  [15, 1.35],
  [16, 1.35],
  [23, 0.55],
  [24, 0.55],
  [25, 0.92],
  [26, 0.92],
  [27, 1.2],
  [28, 1.2],
  [31, 1.0],
  [32, 1.0],
]);

const HIT_TYPES = {
  perfect: { label: "Perfect", points: 100, className: "perfect" },
  great: { label: "Great", points: 70, className: "great" },
  good: { label: "Good", points: 40, className: "good" },
  miss: { label: "Miss", points: 0, className: "miss" },
};

const state = {
  stream: null,
  audioContext: null,
  fileObjectUrl: "",
  audioMode: "demo",
  gameActive: false,
  roundStarting: false,
  countdownActive: false,
  countdownTimer: 0,
  countdownCancel: null,
  danceFlashTimer: 0,
  roundSaved: false,
  currentSong: { key: "demo:120", title: "Demo Beat", duration: DEMO_DURATION },
  bpm: 120,
  beatOffset: 0,
  demoStartTime: 0,
  demoNextBeatIndex: 0,
  score: 0,
  combo: 0,
  multiplier: 0,
  comebackBoost: 0,
  maxCombo: 0,
  hits: 0,
  judged: 0,
  lastJudgeIndex: -1,
  recentResults: [],
  samples: [],
  beatMap: [],
  useBeatMap: false,
  beatInfoReady: false,
  analysisPromise: null,
  analysisActive: false,
  analysisComplete: false,
  analysisConfidence: 0,
  analysisToken: 0,
  analysisError: "",
  prevGray: null,
  prevEnergy: 0,
  motionEnergy: 0,
  motionImpulse: 0,
  poseLandmarker: null,
  poseLoadingPromise: null,
  poseSupported: false,
  poseLastVideoTime: -1,
  poseLandmarks: [],
  poseBox: null,
  prevPoseLandmarks: null,
  prevPoseTime: 0,
  poseEnergy: 0,
  poseImpulse: 0,
  trackingSignal: 0,
  trackingMode: "motion",
  hitPulse: null,
  lanePulse: null,
  presence: 0,
  motionGrid: new Float32Array(GRID_COLS * GRID_ROWS),
  offscreen: document.createElement("canvas"),
  tapTimes: [],
  tutorialActive: false,
  tutorialStep: 0,
};

state.offscreen.width = MOTION_WIDTH;
state.offscreen.height = MOTION_HEIGHT;
state.offscreenContext = state.offscreen.getContext("2d", {
  willReadFrequently: true,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getBeatInterval() {
  return 60 / state.bpm;
}

function getTimingWindow() {
  return Number(refs.timingWindow.value) / 1000;
}

function getCameraAssistMilliseconds() {
  const value = Number(refs.cameraAssist.value);
  return clamp(
    Number.isFinite(value) ? value : CAMERA_ASSIST_DEFAULT,
    CAMERA_ASSIST_MIN,
    CAMERA_ASSIST_MAX,
  );
}

function getCameraAssistSeconds() {
  return getCameraAssistMilliseconds() / 1000;
}

function syncCameraAssistControl() {
  refs.cameraAssist.min = String(CAMERA_ASSIST_MIN);
  refs.cameraAssist.max = String(CAMERA_ASSIST_MAX);

  const value = Math.round(getCameraAssistMilliseconds());
  refs.cameraAssist.value = String(value);
  refs.cameraAssistValue.textContent = `${value}ms`;
  refs.cameraAssist.title = `Camera scoring assist: ${value}ms`;
  refs.cameraAssist.setAttribute("aria-valuetext", `${value} milliseconds`);
}

function getDifficultySliderValue() {
  const value = Number(refs.motionThreshold.value);
  return clamp(
    Number.isFinite(value) ? value : DIFFICULTY_SLIDER_DEFAULT,
    DIFFICULTY_SLIDER_MIN,
    DIFFICULTY_SLIDER_MAX,
  );
}

function difficultySliderToThreshold(value) {
  if (value <= DIFFICULTY_SLIDER_DEFAULT) {
    const progress = value / DIFFICULTY_SLIDER_DEFAULT;
    return DIFFICULTY_THRESHOLD_MIN + progress * (DIFFICULTY_THRESHOLD_DEFAULT - DIFFICULTY_THRESHOLD_MIN);
  }

  const hardProgress =
    (value - DIFFICULTY_SLIDER_DEFAULT) / (DIFFICULTY_SLIDER_MAX - DIFFICULTY_SLIDER_DEFAULT);
  return DIFFICULTY_THRESHOLD_DEFAULT + hardProgress * (DIFFICULTY_THRESHOLD_MAX - DIFFICULTY_THRESHOLD_DEFAULT);
}

function getDifficultyThreshold() {
  return Math.round(difficultySliderToThreshold(getDifficultySliderValue()));
}

function syncDifficultyControl() {
  refs.motionThreshold.min = String(DIFFICULTY_SLIDER_MIN);
  refs.motionThreshold.max = String(DIFFICULTY_SLIDER_MAX);

  const sliderValue = getDifficultySliderValue();
  refs.motionThreshold.value = String(sliderValue);

  const threshold = getDifficultyThreshold();
  refs.motionThreshold.title = `Difficulty ${Math.round(sliderValue)}% (${threshold} movement required)`;
  refs.motionThreshold.setAttribute(
    "aria-valuetext",
    `${Math.round(sliderValue)}% difficulty, ${threshold} movement required`,
  );
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function setStatus(element, text, tone = "") {
  element.textContent = text;
  element.className = `status-dot ${tone}`.trim();
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * scale));
  const height = Math.max(1, Math.floor(rect.height * scale));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function sanitizeTitle(title) {
  return title.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || title;
}

function setMapStatus(text, tone = "", title = text) {
  setStatus(refs.mapStatus, text, tone);
  refs.mapStatus.title = title;
}

function setIdleStatuses() {
  setStatus(refs.songStatus, "No song loaded");
  setMapStatus("Map idle");
  setStatus(refs.beatStatus, "BPM idle");
}

function setStartDisabled(disabled) {
  refs.startButton.disabled =
    disabled || state.gameActive || state.countdownActive || state.roundStarting || state.analysisActive;
}

function markAnalysisActive(active) {
  state.analysisActive = active;
  setStartDisabled(false);
}

function waitForPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

async function setAnalysisProgress(percent, label = "Audio map") {
  setMapStatus(`${label} ${percent}%`, "warn");
  await waitForPaint();
}

function createRegularBeatMap(duration, bpm, offset = 0) {
  const interval = 60 / bpm;
  const beats = [];

  for (let time = Math.max(0, offset); time <= duration + interval * 0.5; time += interval) {
    beats.push({
      time,
      strength: beats.length % 4 === 0 ? 1 : 0.72,
      kind: beats.length % 4 === 0 ? "downbeat" : "beat",
    });
  }

  return beats;
}

function getActiveBeatMap() {
  if (state.useBeatMap && state.beatMap.length > 0) {
    return state.beatMap;
  }

  return [];
}

function getPlayerName() {
  return refs.playerName.value.trim() || "Player 1";
}

function loadScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function getBestForCurrentSong() {
  return loadScores()
    .filter((entry) => entry.songKey === state.currentSong.key)
    .reduce((best, entry) => Math.max(best, entry.score), 0);
}

function saveRoundScore() {
  if (state.roundSaved || state.judged === 0) {
    return;
  }

  state.roundSaved = true;
  const scores = loadScores();
  scores.push({
    songKey: state.currentSong.key,
    songTitle: state.currentSong.title,
    player: getPlayerName(),
    score: state.score,
    accuracy: state.judged ? state.hits / state.judged : 0,
    maxCombo: state.maxCombo,
    date: new Date().toISOString(),
  });

  scores.sort((a, b) => b.score - a.score);
  persistScores(scores.slice(0, 50));
  renderLeaderboard();
}

function renderLeaderboard() {
  const scores = loadScores().slice(0, 10);
  refs.leaderboardBody.replaceChildren();

  if (scores.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No scores yet";
    row.append(cell);
    refs.leaderboardBody.append(row);
    return;
  }

  for (const entry of scores) {
    const row = document.createElement("tr");
    const song = document.createElement("td");
    const player = document.createElement("td");
    const score = document.createElement("td");
    const date = document.createElement("td");

    song.textContent = entry.songTitle;
    player.textContent = entry.player;
    score.textContent = entry.score.toLocaleString();
    date.textContent = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(entry.date));

    row.append(song, player, score, date);
    refs.leaderboardBody.append(row);
  }
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function scoresToCsv(scores) {
  const rows = [
    ["Song", "Player", "Score", "Accuracy", "Max Combo", "Date"],
    ...scores.map((entry) => [
      entry.songTitle,
      entry.player,
      entry.score,
      `${Math.round((entry.accuracy || 0) * 100)}%`,
      entry.maxCombo || 0,
      entry.date,
    ]),
  ];
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function parseImportedScores(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const indexFor = (name) => headers.indexOf(name);
  const songIndex = indexFor("song");
  const playerIndex = indexFor("player");
  const scoreIndex = indexFor("score");
  const accuracyIndex = indexFor("accuracy");
  const comboIndex = indexFor("max combo");
  const dateIndex = indexFor("date");

  if (songIndex < 0 || playerIndex < 0 || scoreIndex < 0) {
    return [];
  }

  return rows.slice(1).flatMap((row) => {
    const songTitle = row[songIndex]?.trim();
    const player = row[playerIndex]?.trim();
    const score = Number(String(row[scoreIndex] || "").replace(/,/g, ""));

    if (!songTitle || !player || !Number.isFinite(score)) {
      return [];
    }

    const parsedDate = dateIndex >= 0 ? new Date(row[dateIndex]) : new Date();
    const date = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    const accuracyText = accuracyIndex >= 0 ? String(row[accuracyIndex] || "").replace("%", "") : "0";
    const accuracyValue = Number(accuracyText);
    const maxCombo = comboIndex >= 0 ? Number(row[comboIndex]) || 0 : 0;

    return [
      {
        songKey: `import:${songTitle}`,
        songTitle,
        player,
        score,
        accuracy: Number.isFinite(accuracyValue) ? clamp(accuracyValue / 100, 0, 1) : 0,
        maxCombo,
        date,
      },
    ];
  });
}

function mergeScores(existingScores, importedScores) {
  const merged = [...existingScores];
  const seen = new Set(
    existingScores.map((entry) => `${entry.songTitle}|${entry.player}|${entry.score}|${entry.date}`),
  );

  for (const entry of importedScores) {
    const key = `${entry.songTitle}|${entry.player}|${entry.score}|${entry.date}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(entry);
    }
  }

  merged.sort((a, b) => b.score - a.score);
  return merged.slice(0, 50);
}

function scoresToShareText(scores) {
  if (scores.length === 0) {
    return "BeatCam Dance by Niko leaderboard is empty.";
  }

  return [
    "BeatCam Dance by Niko leaderboard",
    ...scores.slice(0, 10).map((entry, index) => {
      const date = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(new Date(entry.date));
      return `${index + 1}. ${entry.player} - ${entry.score.toLocaleString()} on ${entry.songTitle} (${date})`;
    }),
  ].join("\n");
}

function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function flashButtonText(button, text) {
  const original = button.textContent;
  button.textContent = text;
  window.clearTimeout(button._labelTimer);
  button._labelTimer = window.setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function exportScores() {
  const scores = loadScores();

  if (scores.length === 0) {
    flashButtonText(refs.exportScoresButton, "No scores");
    return;
  }

  downloadTextFile("beatcam-leaderboard.csv", scoresToCsv(scores), "text/csv;charset=utf-8");
  flashButtonText(refs.exportScoresButton, "Exported");
}

async function importScoresFile(file) {
  if (!file) {
    return;
  }

  try {
    const importedScores = parseImportedScores(await file.text());
    if (importedScores.length === 0) {
      flashButtonText(refs.importScoresButton, "No scores");
      return;
    }

    const beforeCount = loadScores().length;
    const mergedScores = mergeScores(loadScores(), importedScores);
    persistScores(mergedScores);
    renderLeaderboard();
    const addedCount = Math.max(0, mergedScores.length - beforeCount);
    flashButtonText(refs.importScoresButton, addedCount > 0 ? `+${addedCount}` : "Merged");
  } catch (error) {
    console.warn("Import failed.", error);
    flashButtonText(refs.importScoresButton, "Failed");
  } finally {
    refs.importScoresFile.value = "";
  }
}

async function shareScores() {
  const scores = loadScores();
  const text = scoresToShareText(scores);

  try {
    if (navigator.share) {
      await navigator.share({
        title: "BeatCam Dance by Niko leaderboard",
        text,
      });
      flashButtonText(refs.shareScoresButton, "Shared");
      return;
    }

    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard sharing is not available.");
    }

    await navigator.clipboard.writeText(text);
    flashButtonText(refs.shareScoresButton, "Copied");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.warn("Share failed.", error);
      flashButtonText(refs.shareScoresButton, "Try again");
    }
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // Local storage can be unavailable in private browsing.
  }
}

function shouldShowIntro() {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

function showIntro() {
  refs.introOverlay.hidden = false;
}

function hideIntro() {
  refs.introOverlay.hidden = true;
}

function getTutorialSteps() {
  return [
    {
      id: "camera",
      label: "Step 1 of 4",
      target: refs.cameraButton,
      text: "Click Camera so BeatCam Dance by Niko can see your body movement.",
    },
    {
      id: "player",
      label: "Step 2 of 4",
      target: refs.playerName,
      text: "Enter or confirm your player name. Scores are saved locally under this name.",
    },
    {
      id: "song",
      label: "Step 3 of 4",
      target: refs.songFile,
      text: "Choose a song. The game will analyze it and build the beat map.",
    },
    {
      id: "start",
      label: "Step 4 of 4",
      target: refs.startButton,
      text: "When Audio map reaches 100%, press Start and dance after the countdown.",
    },
  ];
}

function clearTutorialTarget() {
  document.querySelectorAll(".tutorial-target").forEach((node) => {
    node.classList.remove("tutorial-target");
  });
}

function positionTutorialBubble(target) {
  const margin = 16;
  const rect = target.getBoundingClientRect();
  const bubble = refs.tutorialBubble;
  const bubbleRect = bubble.getBoundingClientRect();
  let x = rect.right + margin;
  let y = rect.top + rect.height / 2 - bubbleRect.height / 2;
  bubble.className = "tutorial-bubble";

  if (x + bubbleRect.width > window.innerWidth - margin) {
    x = rect.left - bubbleRect.width - margin;
    bubble.classList.add("left-arrow");
  }

  if (x < margin) {
    x = clamp(rect.left, margin, window.innerWidth - bubbleRect.width - margin);
    y = rect.bottom + margin;
    bubble.className = "tutorial-bubble top-arrow";
  }

  y = clamp(y, margin, window.innerHeight - bubbleRect.height - margin);
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
}

function renderTutorialStep() {
  const steps = getTutorialSteps();
  const step = steps[state.tutorialStep];

  if (!state.tutorialActive || !step) {
    endTutorial();
    return;
  }

  clearTutorialTarget();
  refs.tutorialLayer.hidden = false;
  refs.tutorialStepLabel.textContent = step.label;
  refs.tutorialText.textContent = step.text;
  step.target.classList.add("tutorial-target");
  step.target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  window.setTimeout(() => positionTutorialBubble(step.target), 220);
}

function startTutorial() {
  markIntroSeen();
  hideIntro();
  state.tutorialActive = true;
  state.tutorialStep = 0;
  renderTutorialStep();
}

function endTutorial() {
  markIntroSeen();
  state.tutorialActive = false;
  refs.tutorialLayer.hidden = true;
  clearTutorialTarget();
}

function advanceTutorial(stepId) {
  if (!state.tutorialActive) {
    return;
  }

  const step = getTutorialSteps()[state.tutorialStep];
  if (!step || step.id !== stepId) {
    return;
  }

  state.tutorialStep += 1;
  renderTutorialStep();
}

function visibleLandmark(landmark) {
  return landmark && (landmark.visibility ?? 1) >= LANDMARK_CONFIDENCE;
}

async function ensurePoseLandmarker() {
  if (state.poseLandmarker) {
    return state.poseLandmarker;
  }

  if (state.poseLoadingPromise) {
    return state.poseLoadingPromise;
  }

  setStatus(refs.bodyStatus, "Loading body tracker", "warn");
  state.poseLoadingPromise = (async () => {
    const visionTasks = await import(MEDIAPIPE_PACKAGE_URL);
    const vision = await visionTasks.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    const options = (delegate) => ({
      baseOptions: {
        modelAssetPath: POSE_MODEL_URL,
        delegate,
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.42,
      minPosePresenceConfidence: 0.42,
      minTrackingConfidence: 0.42,
    });
    try {
      state.poseLandmarker = await visionTasks.PoseLandmarker.createFromOptions(
        vision,
        options("GPU"),
      );
    } catch {
      state.poseLandmarker = await visionTasks.PoseLandmarker.createFromOptions(
        vision,
        options("CPU"),
      );
    }
    state.poseSupported = true;
    setStatus(refs.bodyStatus, "Skeleton ready", "live");
    return state.poseLandmarker;
  })().catch((error) => {
    console.warn("Pose tracker unavailable; using motion fallback.", error);
    state.poseSupported = false;
    state.poseLandmarker = null;
    setStatus(refs.bodyStatus, "Motion fallback", "warn");
    return null;
  });

  return state.poseLoadingPromise;
}

async function ensureCamera() {
  if (state.stream) {
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus(refs.cameraStatus, "Camera unavailable", "warn");
    throw new Error("This browser does not expose camera access.");
  }

  setStatus(refs.cameraStatus, "Requesting camera", "warn");
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  refs.camera.srcObject = state.stream;
  await refs.camera.play();
  setStatus(refs.cameraStatus, "Camera ready", "live");
  ensurePoseLandmarker();
}

async function ensureAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
  }

  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }
}

function updateBeatStatus() {
  if (!state.beatInfoReady) {
    setStatus(refs.beatStatus, "BPM idle");
    return;
  }

  const offsetMs = Math.round(state.beatOffset * 1000);
  const offsetText = offsetMs === 0 ? "" : ` ${offsetMs > 0 ? "+" : ""}${offsetMs}ms`;
  setStatus(refs.beatStatus, `${Math.round(state.bpm)} BPM${offsetText}`, "live");
}

function resetRound() {
  state.roundSaved = false;
  state.score = 0;
  state.combo = 0;
  state.multiplier = 0;
  state.comebackBoost = 0;
  state.maxCombo = 0;
  state.hits = 0;
  state.judged = 0;
  state.lastJudgeIndex = -1;
  state.recentResults = [];
  state.samples = [];
  state.demoNextBeatIndex = 0;
  state.prevPoseLandmarks = null;
  state.prevPoseTime = 0;
  state.hitPulse = null;
  state.lanePulse = null;
  refs.recentHits.replaceChildren();
  refs.hitFlash.classList.remove("show");
  renderHud();
}

function clearCountdownOverlay() {
  window.clearTimeout(state.danceFlashTimer);
  state.danceFlashTimer = 0;
  refs.countdownOverlay.classList.remove("show", "go");
  refs.countdownOverlay.setAttribute("aria-hidden", "true");
}

function cancelCountdown() {
  if (state.countdownTimer) {
    window.clearTimeout(state.countdownTimer);
    state.countdownTimer = 0;
  }

  if (state.countdownCancel) {
    const cancel = state.countdownCancel;
    state.countdownCancel = null;
    cancel();
  }

  state.countdownActive = false;
  clearCountdownOverlay();
}

function countdownDelay(milliseconds) {
  return new Promise((resolve, reject) => {
    state.countdownTimer = window.setTimeout(() => {
      state.countdownTimer = 0;
      state.countdownCancel = null;
      resolve();
    }, milliseconds);
    state.countdownCancel = () => {
      reject(new Error("Countdown cancelled"));
    };
  });
}

async function runCountdown() {
  window.clearTimeout(state.danceFlashTimer);
  state.countdownActive = true;
  refs.countdownOverlay.setAttribute("aria-hidden", "false");
  refs.countdownOverlay.classList.remove("go");
  refs.countdownOverlay.classList.add("show");

  for (const value of ["1", "2", "3"]) {
    refs.countdownValue.textContent = value;
    setStatus(refs.songStatus, `Count ${value}`, "warn");
    refs.countdownValue.animate(
      [
        { transform: "scale(0.72)", opacity: 0.2 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 220, easing: "ease-out" },
    );
    await countdownDelay(850);
  }

  state.countdownActive = false;
  clearCountdownOverlay();
}

function showDanceFlash() {
  refs.countdownValue.textContent = "Dance!";
  refs.countdownOverlay.setAttribute("aria-hidden", "false");
  refs.countdownOverlay.classList.add("show", "go");
  window.clearTimeout(state.danceFlashTimer);
  state.danceFlashTimer = window.setTimeout(() => {
    clearCountdownOverlay();
  }, 560);
}

function currentSongFromSelection() {
  const file = refs.songFile.files?.[0];

  if (!file) {
    return {
      key: `demo:${Math.round(state.bpm)}`,
      title: `Demo Beat ${Math.round(state.bpm)} BPM`,
      duration: DEMO_DURATION,
    };
  }

  const title = sanitizeTitle(file.name);
  const knownDuration =
    Number.isFinite(refs.songPlayer.duration) && refs.songPlayer.duration > 0
      ? refs.songPlayer.duration
      : state.currentSong.title === title
        ? state.currentSong.duration
        : DEMO_DURATION;

  return {
    key: `file:${file.name}:${file.size}:${Math.round(knownDuration || 0)}`,
    title,
    duration: knownDuration,
  };
}

async function startRound() {
  if (state.gameActive || state.countdownActive || state.analysisActive) {
    return;
  }

  try {
    await ensureCamera();
    await ensureAudioContext();
  } catch (error) {
    console.error(error);
    return;
  }

  state.bpm = clamp(Number(refs.bpmInput.value) || 120, 60, 220);
  refs.bpmInput.value = Math.round(state.bpm);
  const hasFile = Boolean(refs.songFile.files?.[0] && refs.songPlayer.src);

  if (hasFile && state.analysisPromise) {
    setMapStatus("Audio map 90%", "warn");
    await state.analysisPromise;
  }

  state.currentSong = currentSongFromSelection();
  if (!hasFile) {
    state.beatOffset = 0;
    state.beatMap = createRegularBeatMap(DEMO_DURATION, state.bpm, 0);
    state.useBeatMap = true;
    state.beatInfoReady = true;
    setMapStatus("Demo map ready", "live");
  } else if (!state.useBeatMap || state.beatMap.length === 0) {
    state.beatMap = createRegularBeatMap(state.currentSong.duration, state.bpm, state.beatOffset);
    state.useBeatMap = true;
    state.beatInfoReady = true;
    setMapStatus("Fallback map ready", "warn");
  }

  resetRound();

  state.audioMode = hasFile ? "file" : "demo";
  state.roundStarting = true;

  setStartDisabled(true);
  refs.stopButton.disabled = false;
  refs.songFile.disabled = true;
  refs.songPlayer.disabled = true;

  try {
    await runCountdown();
  } catch (error) {
    if (error.message !== "Countdown cancelled") {
      throw error;
    }
    return;
  }

  state.samples = [];
  state.lastJudgeIndex = -1;

  if (state.audioMode === "file") {
    refs.songPlayer.currentTime = 0;
    refs.songPlayer.volume = 1;
    await refs.songPlayer.play();
    if (!state.roundStarting) {
      refs.songPlayer.pause();
      refs.songPlayer.currentTime = 0;
      return;
    }
    state.gameActive = true;
    state.roundStarting = false;
    setStatus(refs.songStatus, state.currentSong.title, "live");
  } else {
    state.demoStartTime = state.audioContext.currentTime + 0.06;
    state.gameActive = true;
    state.roundStarting = false;
    setStatus(refs.songStatus, "Demo beat playing", "live");
  }

  showDanceFlash();
  updateBeatStatus();
}

function finishRound({ save = true } = {}) {
  if (!state.gameActive && !state.countdownActive && !state.roundStarting) {
    return;
  }

  const roundHadStarted = state.gameActive;
  cancelCountdown();
  state.gameActive = false;
  state.roundStarting = false;
  setStartDisabled(false);
  refs.stopButton.disabled = true;
  refs.songFile.disabled = false;
  refs.songPlayer.disabled = false;

  if (state.audioMode === "file") {
    refs.songPlayer.pause();
  }

  if (save && roundHadStarted) {
    saveRoundScore();
  }

  if (refs.songFile.files?.[0]) {
    setStatus(refs.songStatus, state.currentSong.title, "live");
  } else if (roundHadStarted) {
    setStatus(refs.songStatus, "Demo beat ready");
    setMapStatus("Demo map ready", "live");
    state.beatInfoReady = true;
    updateBeatStatus();
  } else {
    state.beatMap = [];
    state.useBeatMap = false;
    state.beatInfoReady = false;
    setIdleStatuses();
  }
}

function getSongTime() {
  if (state.audioMode === "file") {
    return refs.songPlayer.currentTime || 0;
  }

  if (!state.audioContext || !state.gameActive) {
    return 0;
  }

  return Math.max(0, state.audioContext.currentTime - state.demoStartTime);
}

function getSongDuration() {
  if (state.audioMode === "file" && Number.isFinite(refs.songPlayer.duration)) {
    return refs.songPlayer.duration;
  }

  return state.currentSong.duration || DEMO_DURATION;
}

function smoothValues(values, radius) {
  const output = new Float32Array(values.length);

  for (let index = 0; index < values.length; index += 1) {
    let total = 0;
    let count = 0;

    for (let offset = -radius; offset <= radius; offset += 1) {
      const sampleIndex = index + offset;
      if (sampleIndex >= 0 && sampleIndex < values.length) {
        total += values[sampleIndex];
        count += 1;
      }
    }

    output[index] = count ? total / count : values[index];
  }

  return output;
}

function percentile(values, point) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  const index = clamp(Math.floor(sorted.length * point), 0, sorted.length - 1);
  return sorted[index];
}

function normalizeEnvelope(values, floorPoint = 0.58) {
  const smoothed = smoothValues(values, 2);
  const noiseFloor = percentile(smoothed, floorPoint);
  let maxValue = 0;

  for (let index = 0; index < smoothed.length; index += 1) {
    smoothed[index] = Math.max(0, smoothed[index] - noiseFloor);
    maxValue = Math.max(maxValue, smoothed[index]);
  }

  if (maxValue > 0) {
    for (let index = 0; index < smoothed.length; index += 1) {
      smoothed[index] /= maxValue;
    }
  }

  return smoothed;
}

function buildFlux(energy, scale) {
  const flux = new Float32Array(energy.length);

  for (let index = 1; index < energy.length; index += 1) {
    const diff = Math.log1p(energy[index] * scale) - Math.log1p(energy[index - 1] * scale);
    flux[index] = Math.max(0, diff);
  }

  return flux;
}

function buildOnsetEnvelope(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = 2048;
  const hopSize = 1024;
  const frameCount = Math.max(1, Math.floor((audioBuffer.length - frameSize) / hopSize));
  const channelCount = audioBuffer.numberOfChannels;
  const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));
  const broadEnergy = new Float32Array(frameCount);
  const bassEnergy = new Float32Array(frameCount);
  const trebleEnergy = new Float32Array(frameCount);
  const lowPassAlpha = 1 - Math.exp((-2 * Math.PI * 180) / sampleRate);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hopSize;
    let broadTotal = 0;
    let bassTotal = 0;
    let trebleTotal = 0;
    let low = 0;

    for (let sample = 0; sample < frameSize; sample += 1) {
      let mono = 0;
      for (let channel = 0; channel < channelCount; channel += 1) {
        mono += channels[channel][start + sample] || 0;
      }
      mono /= channelCount;
      low += (mono - low) * lowPassAlpha;
      const high = mono - low;
      broadTotal += mono * mono;
      bassTotal += low * low;
      trebleTotal += high * high;
    }

    broadEnergy[frame] = Math.sqrt(broadTotal / frameSize);
    bassEnergy[frame] = Math.sqrt(bassTotal / frameSize);
    trebleEnergy[frame] = Math.sqrt(trebleTotal / frameSize);
  }

  const broadFlux = normalizeEnvelope(buildFlux(broadEnergy, 80), 0.58);
  const bassFlux = normalizeEnvelope(buildFlux(bassEnergy, 120), 0.55);
  const trebleFlux = normalizeEnvelope(buildFlux(trebleEnergy, 72), 0.62);
  const combined = new Float32Array(frameCount);

  for (let index = 0; index < frameCount; index += 1) {
    combined[index] = broadFlux[index] * 0.62 + bassFlux[index] * 0.3 + trebleFlux[index] * 0.22;
  }

  return {
    values: normalizeEnvelope(combined, 0.5),
    bassValues: bassFlux,
    trebleValues: trebleFlux,
    broadValues: broadFlux,
    hopDuration: hopSize / sampleRate,
  };
}

function estimateBpm(envelope, hopDuration) {
  let best = { bpm: Number(refs.bpmInput.value) || 120, score: 0 };
  let secondBestScore = 0;

  for (let bpm = 70; bpm <= 180; bpm += 0.5) {
    const lag = Math.round((60 / bpm) / hopDuration);
    if (lag < 2 || lag >= envelope.length) {
      continue;
    }

    let score = 0;
    let count = 0;
    for (let index = lag; index < envelope.length; index += 1) {
      score += envelope[index] * envelope[index - lag];
      count += 1;
    }

    const doubleLag = lag * 2;
    if (doubleLag < envelope.length) {
      for (let index = doubleLag; index < envelope.length; index += 1) {
        score += envelope[index] * envelope[index - doubleLag] * 0.38;
      }
    }

    score /= Math.max(1, count);

    if (score > best.score) {
      secondBestScore = best.score;
      best = { bpm, score };
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  }

  const separation = best.score > 0 ? (best.score - secondBestScore) / best.score : 0;
  return {
    bpm: clamp(best.bpm, 70, 180),
    confidence: clamp(0.48 + separation * 1.25, 0.35, 0.96),
  };
}

function envelopeAtTime(envelope, hopDuration, time, frameRadius = 2) {
  const center = Math.round(time / hopDuration);
  let best = 0;

  for (let offset = -frameRadius; offset <= frameRadius; offset += 1) {
    const index = center + offset;
    if (index >= 0 && index < envelope.length) {
      best = Math.max(best, envelope[index]);
    }
  }

  return best;
}

function refineBeatTime(envelope, hopDuration, time, searchSeconds = 0.085) {
  const center = Math.round(time / hopDuration);
  const radius = Math.max(1, Math.round(searchSeconds / hopDuration));
  let bestIndex = center;
  let bestValue = -1;

  for (let offset = -radius; offset <= radius; offset += 1) {
    const index = center + offset;
    if (index >= 0 && index < envelope.length && envelope[index] > bestValue) {
      bestValue = envelope[index];
      bestIndex = index;
    }
  }

  return bestIndex * hopDuration;
}

function estimateBeatOffset(envelope, hopDuration, bpm, duration) {
  const interval = 60 / bpm;
  let bestOffset = 0;
  let bestScore = -1;
  const steps = Math.max(12, Math.round(interval / hopDuration));

  for (let step = 0; step < steps; step += 1) {
    const offset = (step / steps) * interval;
    let score = 0;
    let count = 0;

    for (let time = offset; time < duration; time += interval) {
      score += envelopeAtTime(envelope, hopDuration, time);
      count += 1;
    }

    score /= Math.max(1, count);
    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  return bestOffset;
}

function estimateDownbeatPhase(profile, beats) {
  if (beats.length < 8) {
    return { phase: 0, confidence: 0.35 };
  }

  let bestPhase = 0;
  let bestScore = -Infinity;
  let secondBestScore = -Infinity;

  for (let phase = 0; phase < 4; phase += 1) {
    let score = 0;
    let count = 0;

    for (let index = phase; index < beats.length; index += 4) {
      const beat = beats[index];
      const accent = envelopeAtTime(profile.values, profile.hopDuration, beat.time, 3);
      const bass = envelopeAtTime(profile.bassValues, profile.hopDuration, beat.time, 4);
      const treble = envelopeAtTime(profile.trebleValues, profile.hopDuration, beat.time, 2);
      const previousAccent =
        index > 0 ? envelopeAtTime(profile.values, profile.hopDuration, beats[index - 1].time, 2) : 0;
      score += accent * 0.85 + bass * 1.15 + treble * 0.18 + Math.max(0, accent - previousAccent) * 0.35;
      count += 1;
    }

    score /= Math.max(1, count);
    if (score > bestScore) {
      secondBestScore = bestScore;
      bestScore = score;
      bestPhase = phase;
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  }

  const confidence =
    bestScore > 0 && Number.isFinite(secondBestScore)
      ? clamp((bestScore - secondBestScore) / bestScore, 0.2, 0.95)
      : 0.35;
  return { phase: bestPhase, confidence };
}

function createAudioBeatMap(audioBuffer) {
  const duration = audioBuffer.duration;
  const profile = buildOnsetEnvelope(audioBuffer);
  const tempo = estimateBpm(profile.values, profile.hopDuration);
  const bpm = Math.round(tempo.bpm);
  const interval = 60 / bpm;
  const offset = estimateBeatOffset(profile.values, profile.hopDuration, bpm, duration);
  const beats = [];

  for (let index = 0, time = offset; time <= duration; index += 1, time += interval) {
    const refinedTime = refineBeatTime(profile.values, profile.hopDuration, time);
    const closeToGrid = Math.abs(refinedTime - time) <= 0.09;
    const beatTime = closeToGrid ? refinedTime : time;
    const accent = envelopeAtTime(profile.values, profile.hopDuration, beatTime, 3);
    const bass = envelopeAtTime(profile.bassValues, profile.hopDuration, beatTime, 4);
    const treble = envelopeAtTime(profile.trebleValues, profile.hopDuration, beatTime, 2);

    beats.push({
      time: beatTime,
      strength: clamp(0.42 + accent * 0.38 + bass * 0.18 + treble * 0.12, 0.42, 1),
      kind: "beat",
    });
  }

  const downbeat = estimateDownbeatPhase(profile, beats);
  for (let index = 0; index < beats.length; index += 1) {
    beats[index].kind = index % 4 === downbeat.phase ? "downbeat" : "beat";
  }

  return {
    beatMap: beats,
    bpm,
    offset,
    confidence: clamp(tempo.confidence * 0.72 + downbeat.confidence * 0.28, 0.35, 0.96),
    downbeatConfidence: downbeat.confidence,
    duration,
  };
}

async function analyzeSongFile(file) {
  const token = (state.analysisToken += 1);
  state.analysisComplete = false;
  state.analysisConfidence = 0;
  state.analysisError = "";
  markAnalysisActive(true);
  await setAnalysisProgress(0);

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Audio analysis is not available in this browser.");
    }

    if (!state.audioContext) {
      state.audioContext = new AudioContextClass();
    }
    const context = state.audioContext;
    await setAnalysisProgress(15, "Reading audio");
    const buffer = await file.arrayBuffer();

    if (token !== state.analysisToken) {
      return null;
    }

    await setAnalysisProgress(40, "Decoding audio");
    const audioBuffer = await context.decodeAudioData(buffer.slice(0));

    if (token !== state.analysisToken) {
      return null;
    }

    await setAnalysisProgress(70, "Finding beats");
    const result = createAudioBeatMap(audioBuffer);

    if (token !== state.analysisToken) {
      return null;
    }

    state.bpm = result.bpm;
    state.beatOffset = result.offset;
    state.beatMap = result.beatMap;
    state.useBeatMap = true;
    state.beatInfoReady = true;
    state.analysisError = "";
    state.analysisComplete = true;
    state.analysisConfidence = result.confidence;
    refs.bpmInput.value = result.bpm;
    state.currentSong = {
      key: `file:${file.name}:${file.size}:${Math.round(result.duration)}`,
      title: sanitizeTitle(file.name),
      duration: result.duration,
    };
    setMapStatus(
      "Audio map 100%",
      "live",
      `Audio map done. Beat confidence ${Math.round(result.confidence * 100)}%. Downbeat confidence ${Math.round(result.downbeatConfidence * 100)}%.`,
    );
    updateBeatStatus();
    renderHud();
    return result;
  } catch (error) {
    console.warn("Song analysis failed; using BPM grid fallback.", error);
    if (token === state.analysisToken) {
      state.analysisError = error.message;
      state.analysisComplete = false;
      state.analysisConfidence = 0;
      state.useBeatMap = false;
      state.beatMap = createRegularBeatMap(getSongDuration(), state.bpm, state.beatOffset);
      state.beatInfoReady = true;
      setMapStatus("Fallback map ready", "warn", `Audio analysis failed: ${error.message}`);
    }
    return null;
  } finally {
    if (token === state.analysisToken) {
      state.analysisPromise = null;
      markAnalysisActive(false);
    }
  }
}

function scheduleTone(when, frequency, duration, gainValue, type = "sine") {
  const context = state.audioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, when);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.55), when + duration);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function scheduleDemoAudio(songTime) {
  const interval = getBeatInterval();
  const lookAhead = 0.75;

  while (state.demoNextBeatIndex * interval < songTime + lookAhead) {
    const beatIndex = state.demoNextBeatIndex;
    const beatTime = beatIndex * interval;

    if (beatTime > DEMO_DURATION) {
      break;
    }

    const when = state.demoStartTime + beatTime;
    const beatInBar = beatIndex % 4;
    const isDownbeat = beatInBar === 0;
    scheduleTone(when, isDownbeat ? 92 : 132, 0.13, isDownbeat ? 0.42 : 0.26, "triangle");

    if (beatInBar === 2) {
      scheduleTone(when + 0.018, 225, 0.08, 0.18, "square");
    }

    scheduleTone(when + interval * 0.5, 740, 0.045, 0.05, "square");
    state.demoNextBeatIndex += 1;
  }
}

function sampleMotion(songTime) {
  if (!refs.camera.videoWidth || !refs.camera.videoHeight) {
    return;
  }

  const context = state.offscreenContext;
  context.drawImage(refs.camera, 0, 0, MOTION_WIDTH, MOTION_HEIGHT);
  const pixels = context.getImageData(0, 0, MOTION_WIDTH, MOTION_HEIGHT).data;
  const gray = new Uint8ClampedArray(MOTION_WIDTH * MOTION_HEIGHT);
  const grid = new Float32Array(GRID_COLS * GRID_ROWS);
  let diffTotal = 0;
  let changed = 0;
  let centerX = 0;
  let centerY = 0;

  for (let y = 0; y < MOTION_HEIGHT; y += 1) {
    for (let x = 0; x < MOTION_WIDTH; x += 1) {
      const pixelIndex = y * MOTION_WIDTH + x;
      const rgbaIndex = pixelIndex * 4;
      const value =
        pixels[rgbaIndex] * 0.299 +
        pixels[rgbaIndex + 1] * 0.587 +
        pixels[rgbaIndex + 2] * 0.114;
      gray[pixelIndex] = value;

      if (!state.prevGray) {
        continue;
      }

      const diff = Math.abs(value - state.prevGray[pixelIndex]);
      diffTotal += diff;

      if (diff > 20) {
        changed += 1;
        centerX += x;
        centerY += y;
        const gridX = Math.min(GRID_COLS - 1, Math.floor((x / MOTION_WIDTH) * GRID_COLS));
        const gridY = Math.min(GRID_ROWS - 1, Math.floor((y / MOTION_HEIGHT) * GRID_ROWS));
        grid[gridY * GRID_COLS + gridX] += diff / 255;
      }
    }
  }

  state.prevGray = gray;

  const pixelCount = MOTION_WIDTH * MOTION_HEIGHT;
  const averageDiff = diffTotal / pixelCount;
  const coverage = changed / pixelCount;
  const rawEnergy = clamp(averageDiff * 2.25 + coverage * 130, 0, 100);
  const smoothed = state.motionEnergy * 0.62 + rawEnergy * 0.38;
  const positiveDelta = Math.max(0, smoothed - state.prevEnergy);
  const impulse = clamp(smoothed + positiveDelta * 2.35, 0, 120);

  state.prevEnergy = state.motionEnergy;
  state.motionEnergy = smoothed;
  state.motionImpulse = impulse;
  state.presence = state.presence * 0.88 + (coverage > 0.025 || smoothed > 10 ? 0.12 : 0);
  state.motionGrid = grid;

  if (changed > 0) {
    state.motionCenter = {
      x: centerX / changed / MOTION_WIDTH,
      y: centerY / changed / MOTION_HEIGHT,
    };
  }

  refs.motionMeter.style.width = `${clamp(impulse, 0, 100)}%`;

  if (state.stream && !state.gameActive) {
    if (state.presence > 0.48) {
      setStatus(refs.cameraStatus, "Motion tracked", "live");
    } else {
      setStatus(refs.cameraStatus, "Camera ready", "live");
    }
  }
}

function calculatePoseBox(landmarks) {
  const visible = landmarks.filter(visibleLandmark);
  if (visible.length < 5) {
    return null;
  }

  const xs = visible.map((landmark) => landmark.x);
  const ys = visible.map((landmark) => landmark.y);
  const minX = clamp(Math.min(...xs) - 0.055, 0, 1);
  const maxX = clamp(Math.max(...xs) + 0.055, 0, 1);
  const minY = clamp(Math.min(...ys) - 0.06, 0, 1);
  const maxY = clamp(Math.max(...ys) + 0.06, 0, 1);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function samplePose(songTime) {
  if (!state.poseLandmarker || !refs.camera.videoWidth || !refs.camera.videoHeight) {
    state.trackingMode = "motion";
    return;
  }

  const videoTime = refs.camera.currentTime;
  if (videoTime === state.poseLastVideoTime) {
    return;
  }

  state.poseLastVideoTime = videoTime;

  try {
    const result = state.poseLandmarker.detectForVideo(refs.camera, performance.now());
    const landmarks = result.landmarks?.[0] || [];
    state.poseLandmarks = landmarks;
    state.poseBox = calculatePoseBox(landmarks);

    if (!state.poseBox) {
      state.trackingMode = "motion";
      if (state.stream) {
        setStatus(refs.bodyStatus, "Find body", "warn");
      }
      return;
    }

    let weightedMotion = 0;
    let weightTotal = 0;
    const elapsed = clamp(songTime - state.prevPoseTime, 1 / 90, 0.2);

    if (state.prevPoseLandmarks) {
      for (const [index, weight] of POSE_MOVEMENT_WEIGHTS.entries()) {
        const landmark = landmarks[index];
        const previous = state.prevPoseLandmarks[index];
        if (!visibleLandmark(landmark) || !visibleLandmark(previous)) {
          continue;
        }

        const dx = landmark.x - previous.x;
        const dy = landmark.y - previous.y;
        const dz = (landmark.z || 0) - (previous.z || 0);
        const speed = Math.hypot(dx, dy, dz * 0.25) / elapsed;
        weightedMotion += speed * weight;
        weightTotal += weight;
      }
    }

    const rawEnergy = weightTotal ? clamp((weightedMotion / weightTotal) * 74, 0, 100) : 0;
    const positiveDelta = Math.max(0, rawEnergy - state.poseEnergy);
    state.poseEnergy = state.poseEnergy * 0.58 + rawEnergy * 0.42;
    state.poseImpulse = clamp(state.poseEnergy + positiveDelta * 1.9, 0, 120);
    state.prevPoseLandmarks = landmarks.map((landmark) => ({ ...landmark }));
    state.prevPoseTime = songTime;
    state.trackingMode = "pose";
    state.presence = clamp(state.presence + 0.08, 0, 1);

    if (state.gameActive) {
      setStatus(refs.bodyStatus, "Skeleton scoring", "live");
    } else {
      setStatus(refs.bodyStatus, "Skeleton tracked", "live");
    }
  } catch (error) {
    console.warn("Pose sampling failed; using motion fallback.", error);
    state.trackingMode = "motion";
    setStatus(refs.bodyStatus, "Motion fallback", "warn");
  }
}

function recordTrackingSample(songTime) {
  const usingPose = state.trackingMode === "pose" && state.poseBox;
  const impulse = usingPose ? state.poseImpulse : state.motionImpulse;
  const energy = usingPose ? state.poseEnergy : state.motionEnergy;
  const cameraAssist = getCameraAssistSeconds();
  state.trackingSignal = impulse;
  refs.motionMeter.style.width = `${clamp(impulse, 0, 100)}%`;
  state.samples.push({
    t: Math.max(0, songTime - cameraAssist),
    rawT: songTime,
    cameraAssist,
    impulse,
    energy,
    mode: usingPose ? "pose" : "motion",
  });

  const cutoff = songTime - 2.2;
  while (state.samples.length && state.samples[0].t < cutoff) {
    state.samples.shift();
  }
}

function judgeBeat(beatTime, window) {
  const threshold = getDifficultyThreshold();
  const diagnosticWindow = window + 0.22;
  let bestTimedSample = null;
  let strongestWindowSample = null;
  let strongestNearbySample = null;

  for (const sample of state.samples) {
    const timingDelta = sample.t - beatTime;
    const absoluteDelta = Math.abs(timingDelta);

    if (absoluteDelta <= diagnosticWindow) {
      if (!strongestNearbySample || sample.impulse > strongestNearbySample.impulse) {
        strongestNearbySample = sample;
      }
    }

    if (absoluteDelta <= window) {
      if (!strongestWindowSample || sample.impulse > strongestWindowSample.impulse) {
        strongestWindowSample = sample;
      }

      if (sample.impulse >= threshold) {
        if (
          !bestTimedSample ||
          absoluteDelta < Math.abs(bestTimedSample.t - beatTime) ||
          (absoluteDelta === Math.abs(bestTimedSample.t - beatTime) && sample.impulse > bestTimedSample.impulse)
        ) {
          bestTimedSample = sample;
        }
      }
    }
  }

  if (!bestTimedSample) {
    const missSample =
      strongestNearbySample && Math.abs(strongestNearbySample.t - beatTime) > window
        ? strongestNearbySample
        : strongestWindowSample;
    const reason = missSample
      ? Math.abs(missSample.t - beatTime) > window
        ? "off-time"
        : "low-motion"
      : "no-motion";

    addHit("miss", 0, missSample?.impulse || 0, {
      reason,
      threshold,
      timingDelta: missSample ? missSample.t - beatTime : null,
      rawTimingDelta: missSample ? (missSample.rawT ?? missSample.t) - beatTime : null,
      mode: missSample?.mode || state.trackingMode,
    });
    return;
  }

  const timingDelta = bestTimedSample.t - beatTime;
  const rawTimingDelta = (bestTimedSample.rawT ?? bestTimedSample.t) - beatTime;
  const delta = Math.abs(timingDelta);
  const hitDetails = {
    threshold,
    timingDelta,
    rawTimingDelta,
    mode: bestTimedSample.mode,
  };

  if (delta <= PERFECT_WINDOW) {
    addHit("perfect", delta, bestTimedSample.impulse, hitDetails);
  } else if (delta <= GREAT_WINDOW) {
    addHit("great", delta, bestTimedSample.impulse, hitDetails);
  } else {
    addHit("good", delta, bestTimedSample.impulse, hitDetails);
  }
}

function getComebackBonus(type, boost) {
  if (boost <= 0 || type === "miss") {
    return 0;
  }

  const multipliers = {
    good: 0.5,
    great: 0.75,
    perfect: 1,
  };

  return Math.min(COMEBACK_BOOST_CAP, Math.ceil(boost * (multipliers[type] || 0)));
}

function addHit(type, delta, impulse, details = {}) {
  const hit = HIT_TYPES[type];
  state.judged += 1;
  let awardedPoints = 0;
  let effectiveMultiplier = state.multiplier;
  let comebackBonus = 0;

  if (type === "miss") {
    state.combo = 0;
    state.multiplier = 0;
    state.comebackBoost = Math.min(COMEBACK_BOOST_CAP, state.comebackBoost + 1);
  } else {
    const pendingComebackBoost = state.comebackBoost;
    state.hits += 1;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.multiplier = Math.min(8, 1 + Math.floor(state.combo / 10));
    comebackBonus = getComebackBonus(type, pendingComebackBoost);
    effectiveMultiplier = Math.min(12, state.multiplier + comebackBonus);
    awardedPoints = (hit.points + Math.min(120, state.combo * 2)) * effectiveMultiplier;
    state.score += awardedPoints;
    state.comebackBoost = 0;
  }

  state.recentResults.unshift({
    type,
    label: hit.label,
    points: awardedPoints,
    multiplier: effectiveMultiplier,
    baseMultiplier: state.multiplier,
    comebackBonus,
    comebackBoost: state.comebackBoost,
    delta,
    timingDelta: details.timingDelta,
    rawTimingDelta: details.rawTimingDelta,
    impulse,
    threshold: details.threshold || getDifficultyThreshold(),
    reason: details.reason || "",
    mode: details.mode || state.trackingMode,
  });
  state.recentResults = state.recentResults.slice(0, 5);
  state.hitPulse = {
    startedAt: performance.now(),
    type,
    className: hit.className,
  };
  state.lanePulse = {
    startedAt: performance.now(),
    type,
    className: hit.className,
  };
  showHitFlash(hit.label, hit.className);
  renderRecentHits();
  renderHud();
}

function formatTimingDelta(delta) {
  if (!Number.isFinite(delta)) {
    return "";
  }

  if (Math.abs(delta) <= TIMING_DISPLAY_DEADZONE) {
    return "on beat";
  }

  const milliseconds = Math.round(delta * 1000);
  return `${Math.abs(milliseconds)}ms ${milliseconds > 0 ? "late" : "early"}`;
}

function formatHitDiagnosis(result) {
  const threshold = result.threshold || getDifficultyThreshold();
  const movement = Math.round(result.impulse || 0);
  const movementText = `${movement}/${threshold}`;
  const assistedTiming = formatTimingDelta(result.timingDelta);
  const rawTiming = formatTimingDelta(result.rawTimingDelta);
  const showRaw =
    rawTiming &&
    assistedTiming &&
    Math.abs((result.rawTimingDelta || 0) - (result.timingDelta || 0)) > 0.018;

  if (result.type === "miss") {
    if (result.reason === "low-motion") {
      return [`move low ${movementText}`, assistedTiming].filter(Boolean).join(" · ");
    }

    if (result.reason === "off-time") {
      return [`timing ${assistedTiming}`, `move ${movementText}`].filter(Boolean).join(" · ");
    }

    return "no motion in window";
  }

  return [
    assistedTiming,
    showRaw ? `raw ${rawTiming}` : "",
    `move ${movementText}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function showHitFlash(label, className) {
  refs.hitFlash.textContent = label;
  refs.hitFlash.style.color =
    className === "perfect"
      ? "var(--green)"
      : className === "great"
        ? "var(--cyan)"
        : className === "good"
          ? "var(--yellow)"
          : "var(--red)";
  refs.hitFlash.classList.remove("show");
  window.requestAnimationFrame(() => refs.hitFlash.classList.add("show"));
  window.clearTimeout(state.hitFlashTimeout);
  state.hitFlashTimeout = window.setTimeout(() => {
    refs.hitFlash.classList.remove("show");
  }, 250);
}

function renderRecentHits() {
  refs.recentHits.replaceChildren();

  for (const result of state.recentResults) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const detail = document.createElement("strong");
    const diagnosis = document.createElement("small");
    label.textContent = result.label;
    if (result.type === "miss") {
      detail.textContent = result.comebackBoost
        ? `0 comeback +${result.comebackBoost}x`
        : "0";
    } else if (result.comebackBonus > 0) {
      detail.textContent = `+${result.points} ${result.multiplier}x comeback`;
    } else {
      detail.textContent = `+${result.points} ${result.multiplier}x ${Math.round(result.delta * 1000)}ms`;
    }
    diagnosis.textContent = formatHitDiagnosis(result);
    item.className = HIT_TYPES[result.type].className;
    item.append(label, detail, diagnosis);
    refs.recentHits.append(item);
  }
}

function fitMetricText(element, maxRem, minRem) {
  const parent = element.parentElement;
  if (!parent) {
    return;
  }

  const text = element.textContent || "";
  const parentStyle = window.getComputedStyle(parent);
  const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
  const availableWidth = Math.max(
    24,
    parent.clientWidth -
      parseFloat(parentStyle.paddingLeft) -
      parseFloat(parentStyle.paddingRight) -
      4,
  );
  const cacheKey = `${text}:${availableWidth}:${maxRem}:${minRem}`;

  if (element.dataset.fitCache === cacheKey) {
    return;
  }

  element.dataset.fitCache = cacheKey;
  element.style.letterSpacing = "0";
  element.style.maxWidth = `${availableWidth}px`;
  element.style.fontSize = `${maxRem}rem`;

  const elementStyle = window.getComputedStyle(element);
  const maxPixels = maxRem * rootFontSize;
  const minPixels = minRem * rootFontSize;
  const context = state.fitContext || document.createElement("canvas").getContext("2d");
  state.fitContext = context;
  context.font = `${elementStyle.fontStyle} ${elementStyle.fontWeight} ${maxPixels}px ${elementStyle.fontFamily}`;
  const measuredWidth = context.measureText(text).width;
  const fittedPixels =
    measuredWidth > 0 ? clamp((availableWidth / measuredWidth) * maxPixels, minPixels, maxPixels) : maxPixels;
  element.style.fontSize = `${fittedPixels}px`;

  let fontSize = fittedPixels;
  while (element.scrollWidth > element.clientWidth && fontSize > minPixels) {
    fontSize = Math.max(minPixels, fontSize - 1);
    element.style.fontSize = `${fontSize}px`;
  }

  element.title = text;
}

function fitScoreNumbers() {
  fitMetricText(refs.scoreValue, 4, 0.96);
  fitMetricText(refs.comboValue, 1.95, 0.78);
  fitMetricText(refs.multiplierValue, 1.95, 0.78);
  fitMetricText(refs.bestValue, 1.95, 0.78);
  fitMetricText(refs.accuracyValue, 1.95, 0.78);
  fitMetricText(refs.timeValue, 1.95, 0.78);
}

function scoreDueBeats(songTime) {
  const window = getTimingWindow();
  const beatMap = getActiveBeatMap();

  if (beatMap.length > 0) {
    for (let index = state.lastJudgeIndex + 1; index < beatMap.length; index += 1) {
      const beat = beatMap[index];

      if (beat.time > songTime - window - getCameraAssistSeconds()) {
        break;
      }

      judgeBeat(beat.time, window);
      state.lastJudgeIndex = index;
    }
    return;
  }

  const interval = getBeatInterval();
  const dueIndex = Math.floor((songTime - state.beatOffset - window - getCameraAssistSeconds()) / interval);

  for (let index = state.lastJudgeIndex + 1; index <= dueIndex; index += 1) {
    if (index < 0) {
      state.lastJudgeIndex = index;
      continue;
    }

    const beatTime = state.beatOffset + index * interval;
    if (beatTime > getSongDuration()) {
      break;
    }

    judgeBeat(beatTime, window);
    state.lastJudgeIndex = index;
  }
}

function renderHud() {
  refs.scoreValue.textContent = state.score.toLocaleString();
  refs.comboValue.textContent = state.combo.toLocaleString();
  refs.multiplierValue.textContent =
    state.multiplier === 0 && state.comebackBoost > 0
      ? `0x +${state.comebackBoost}`
      : `${state.multiplier}x`;
  refs.bestValue.textContent = Math.max(getBestForCurrentSong(), state.score).toLocaleString();
  refs.accuracyValue.textContent = state.judged
    ? `${Math.round((state.hits / state.judged) * 100)}%`
    : "0%";
  refs.timeValue.textContent = formatTime(getSongTime());
  fitScoreNumbers();
  refs.multiplierValue.title =
    state.comebackBoost > 0
      ? `Comeback boost ready: Good, Great, or Perfect can cash it in.`
      : `${state.multiplier}x`;
}

function poseColor(className, alpha) {
  const colors = {
    perfect: `rgba(69, 212, 131, ${alpha})`,
    great: `rgba(85, 199, 247, ${alpha})`,
    good: `rgba(255, 209, 102, ${alpha})`,
    miss: `rgba(255, 107, 95, ${alpha})`,
  };
  return colors[className] || `rgba(69, 212, 131, ${alpha})`;
}

function posePoint(landmark, canvas) {
  return {
    x: (1 - landmark.x) * canvas.width,
    y: landmark.y * canvas.height,
  };
}

function drawBodyTrackingOverlay(context, canvas) {
  if (!state.poseBox || state.poseLandmarks.length === 0) {
    return false;
  }

  const box = state.poseBox;
  const x = (1 - box.maxX) * canvas.width;
  const y = box.minY * canvas.height;
  const width = box.width * canvas.width;
  const height = box.height * canvas.height;
  const now = performance.now();
  const pulseAge = state.hitPulse ? (now - state.hitPulse.startedAt) / 720 : 1;
  const pulse = clamp(1 - pulseAge, 0, 1);

  if (state.hitPulse && pulse <= 0) {
    state.hitPulse = null;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle = "rgba(69, 212, 131, 0.46)";
  context.lineWidth = 3;
  context.strokeRect(x, y, width, height);

  if (pulse > 0) {
    const spread = 28 * pulse;
    context.strokeStyle = poseColor(state.hitPulse.className, 0.28 + pulse * 0.62);
    context.lineWidth = 4 + pulse * 8;
    context.strokeRect(x - spread, y - spread, width + spread * 2, height + spread * 2);
  }

  context.strokeStyle = "rgba(85, 199, 247, 0.86)";
  context.lineWidth = 4;
  for (const [start, end] of POSE_CONNECTIONS) {
    const a = state.poseLandmarks[start];
    const b = state.poseLandmarks[end];
    if (!visibleLandmark(a) || !visibleLandmark(b)) {
      continue;
    }

    const startPoint = posePoint(a, canvas);
    const endPoint = posePoint(b, canvas);
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.stroke();
  }

  for (const [index] of POSE_MOVEMENT_WEIGHTS.entries()) {
    const landmark = state.poseLandmarks[index];
    if (!visibleLandmark(landmark)) {
      continue;
    }

    const point = posePoint(landmark, canvas);
    context.fillStyle = "rgba(246, 242, 233, 0.92)";
    context.beginPath();
    context.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
  return true;
}

function drawMotionOverlay() {
  const canvas = refs.motionCanvas;
  resizeCanvas(canvas);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.stream) {
    return;
  }

  const cellWidth = canvas.width / GRID_COLS;
  const cellHeight = canvas.height / GRID_ROWS;
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const amount = state.motionGrid[y * GRID_COLS + x];
      if (amount <= 0.08) {
        continue;
      }

      const mirroredX = GRID_COLS - x - 1;
      context.fillStyle = `rgba(85, 199, 247, ${clamp(amount * 0.2, 0.06, 0.28)})`;
      context.fillRect(
        mirroredX * cellWidth,
        y * cellHeight,
        Math.ceil(cellWidth),
        Math.ceil(cellHeight),
      );
    }
  }

  if (drawBodyTrackingOverlay(context, canvas)) {
    return;
  }

  if (state.motionCenter && state.presence > 0.24) {
    const x = (1 - state.motionCenter.x) * canvas.width;
    const y = state.motionCenter.y * canvas.height;
    const radius = 32 + state.motionImpulse * 0.35;
    const pulseAge = state.hitPulse ? (performance.now() - state.hitPulse.startedAt) / 720 : 1;
    const pulse = clamp(1 - pulseAge, 0, 1);
    context.strokeStyle = "rgba(69, 212, 131, 0.82)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();

    if (pulse > 0) {
      context.strokeStyle = poseColor(state.hitPulse.className, 0.28 + pulse * 0.58);
      context.lineWidth = 5 + pulse * 7;
      context.beginPath();
      context.arc(x, y, radius + 34 * pulse, 0, Math.PI * 2);
      context.stroke();
    }
  }
}

function drawLaneFeedback(context, center, height) {
  if (!state.lanePulse) {
    return;
  }

  const elapsed = (performance.now() - state.lanePulse.startedAt) / 760;
  const progress = clamp(elapsed, 0, 1);
  const fade = 1 - progress;
  const y = height / 2;
  const isMiss = state.lanePulse.type === "miss";
  const color = poseColor(state.lanePulse.className, 1);
  const softColor = poseColor(state.lanePulse.className, 0.22 + fade * 0.35);

  if (progress >= 1) {
    state.lanePulse = null;
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  if (isMiss) {
    const radius = 18 + progress * 56;
    context.strokeStyle = poseColor("miss", 0.18 + fade * 0.58);
    context.lineWidth = 4 + fade * 5;
    context.beginPath();
    context.arc(center, y, radius, 0, Math.PI * 2);
    context.stroke();

    context.strokeStyle = poseColor("miss", 0.32 + fade * 0.6);
    context.lineWidth = 5;
    const slash = 24 + progress * 22;
    context.beginPath();
    context.moveTo(center - slash, y - slash * 0.58);
    context.lineTo(center + slash, y + slash * 0.58);
    context.moveTo(center + slash, y - slash * 0.58);
    context.lineTo(center - slash, y + slash * 0.58);
    context.stroke();

    context.fillStyle = `rgba(255, 107, 95, ${0.16 * fade})`;
    context.fillRect(center - 26 - progress * 28, 0, 52 + progress * 56, height);
    context.restore();
    return;
  }

  const burstRadius = 14 + progress * 84;
  context.fillStyle = softColor;
  context.beginPath();
  context.arc(center, y, 26 + progress * 16, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = color;
  context.lineWidth = 3 + fade * 7;
  context.beginPath();
  context.arc(center, y, burstRadius, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = `rgba(246, 242, 233, ${0.22 + fade * 0.68})`;
  context.lineWidth = 2 + fade * 4;
  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI * 2 * index) / 16;
    const inner = 18 + progress * 28;
    const outer = 38 + progress * 86;
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    context.lineTo(center + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    context.stroke();
  }

  context.fillStyle = `rgba(255, 255, 255, ${0.18 * fade})`;
  context.fillRect(center - 7 - progress * 16, 0, 14 + progress * 32, height);
  context.restore();
}

function drawBeatLane(songTime) {
  const canvas = refs.beatCanvas;
  resizeCanvas(canvas);
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const center = width * 0.28;
  const interval = getBeatInterval();
  const secondsVisible = 3.9;
  const scale = width / secondsVisible;
  const windowWidth = getTimingWindow() * scale;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#101217";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(69, 212, 131, 0.08)";
  context.fillRect(center - windowWidth, 0, windowWidth * 2, height);

  context.strokeStyle = "rgba(246, 242, 233, 0.72)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(center, 16);
  context.lineTo(center, height - 16);
  context.stroke();

  const beatMap = state.beatInfoReady ? getActiveBeatMap() : [];
  const beatsToDraw =
    state.beatInfoReady && beatMap.length > 0
      ? beatMap
          .map((beat, index) => ({ ...beat, index }))
          .filter((beat) => beat.time >= songTime - 0.7 && beat.time <= songTime + secondsVisible)
      : state.beatInfoReady
        ? (() => {
          const firstBeat = Math.max(0, Math.floor((songTime - state.beatOffset - 0.7) / interval));
          const lastBeat = Math.ceil((songTime - state.beatOffset + secondsVisible) / interval);
          const beats = [];
          for (let index = firstBeat; index <= lastBeat; index += 1) {
            beats.push({
              time: state.beatOffset + index * interval,
              strength: index % 4 === 0 ? 1 : 0.72,
              kind: index % 4 === 0 ? "downbeat" : "beat",
              index,
            });
          }
          return beats;
        })()
        : [];

  for (const beat of beatsToDraw) {
    const beatTime = beat.time;
    const x = center + (beatTime - songTime) * scale;

    if (x < -20 || x > width + 20) {
      continue;
    }

    const isDownbeat = beat.kind === "downbeat" || beat.index % 4 === 0;
    const radius = (isDownbeat ? 17 : 12) * clamp(beat.strength || 0.72, 0.55, 1.12);
    context.fillStyle = isDownbeat ? "rgba(255, 79, 123, 0.96)" : "rgba(85, 199, 247, 0.9)";
    context.beginPath();
    context.arc(x, height / 2, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(246, 242, 233, 0.88)";
    context.fillRect(x - 1, 18, 2, height - 36);
  }

  const energyWidth = clamp(state.trackingSignal || state.motionImpulse, 0, 100) / 100;
  context.fillStyle = "rgba(255, 209, 102, 0.85)";
  context.fillRect(0, height - 9, width * energyWidth, 9);
  drawLaneFeedback(context, center, height);
}

function handleTapTempo() {
  const now = performance.now();
  const previous = state.tapTimes[state.tapTimes.length - 1];

  if (!previous || now - previous > 2200) {
    state.tapTimes = [now];
  } else {
    state.tapTimes.push(now);
    state.tapTimes = state.tapTimes.slice(-6);
  }

  if (state.tapTimes.length >= 2) {
    const intervals = [];
    for (let index = 1; index < state.tapTimes.length; index += 1) {
      intervals.push(state.tapTimes[index] - state.tapTimes[index - 1]);
    }

    const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    state.bpm = clamp(60000 / average, 60, 220);
    refs.bpmInput.value = Math.round(state.bpm);
  }

  if (state.gameActive) {
    const interval = getBeatInterval();
    const songTime = getSongTime();
    state.beatOffset = songTime - Math.floor(songTime / interval) * interval;
    state.useBeatMap = false;
    state.lastJudgeIndex = Math.floor(
      (songTime - state.beatOffset - getTimingWindow() - getCameraAssistSeconds()) / interval,
    );
  }

  state.beatMap = createRegularBeatMap(getSongDuration(), state.bpm, state.beatOffset);
  state.useBeatMap = true;
  state.beatInfoReady = true;
  setMapStatus("Tap map ready", "warn");
  updateBeatStatus();
}

function nudgeOffset(delta) {
  state.beatOffset += delta;
  if (state.useBeatMap && state.beatMap.length > 0) {
    state.beatInfoReady = true;
    state.beatMap = state.beatMap
      .map((beat) => ({ ...beat, time: beat.time + delta }))
      .filter((beat) => beat.time >= 0 && beat.time <= getSongDuration() + getBeatInterval());
    setMapStatus("Map ready", "warn");
  }
  updateBeatStatus();
}

function handleSongFile() {
  const file = refs.songFile.files?.[0];

  if (state.fileObjectUrl) {
    URL.revokeObjectURL(state.fileObjectUrl);
    state.fileObjectUrl = "";
  }

  if (!file) {
    state.analysisToken += 1;
    refs.songPlayer.removeAttribute("src");
    refs.songPlayer.load();
    state.analysisPromise = null;
    state.analysisComplete = true;
    state.analysisConfidence = 1;
    state.analysisError = "";
    markAnalysisActive(false);
    state.beatOffset = 0;
    state.beatMap = [];
    state.useBeatMap = false;
    state.beatInfoReady = false;
    state.currentSong = currentSongFromSelection();
    setIdleStatuses();
    renderHud();
    return;
  }

  state.fileObjectUrl = URL.createObjectURL(file);
  refs.songPlayer.src = state.fileObjectUrl;
  refs.songPlayer.load();
  state.currentSong = {
    key: `file:${file.name}:${file.size}`,
    title: sanitizeTitle(file.name),
    duration: DEMO_DURATION,
  };
  state.analysisComplete = false;
  state.analysisConfidence = 0;
  state.analysisError = "";
  state.beatInfoReady = false;
  state.beatMap = [];
  state.useBeatMap = false;
  setStatus(refs.songStatus, state.currentSong.title, "live");
  state.analysisPromise = analyzeSongFile(file);
  renderHud();
}

function updateFromMetadata() {
  if (!refs.songFile.files?.[0]) {
    return;
  }

  state.currentSong = currentSongFromSelection();
  renderHud();
}

function animationLoop() {
  const songTime = getSongTime();

  sampleMotion(songTime);
  samplePose(songTime);
  recordTrackingSample(songTime);

  if (state.gameActive) {
    if (state.audioMode === "demo") {
      scheduleDemoAudio(songTime);
    }

    scoreDueBeats(songTime);

    if (songTime >= getSongDuration()) {
      finishRound();
    }
  }

  drawMotionOverlay();
  drawBeatLane(songTime);
  renderHud();
  window.requestAnimationFrame(animationLoop);
}

refs.cameraButton.addEventListener("click", () => {
  ensureCamera()
    .then(() => advanceTutorial("camera"))
    .catch((error) => {
      console.error(error);
      setStatus(refs.cameraStatus, "Camera blocked", "warn");
    });
});

refs.startButton.addEventListener("click", () => {
  if (state.tutorialActive && getTutorialSteps()[state.tutorialStep]?.id === "start") {
    endTutorial();
  }
  startRound().catch((error) => {
    console.error(error);
    setStatus(refs.songStatus, "Audio blocked", "warn");
    finishRound({ save: false });
  });
});

refs.stopButton.addEventListener("click", () => finishRound());
refs.songPlayer.addEventListener("ended", () => finishRound());
refs.songFile.addEventListener("change", () => {
  handleSongFile();
  if (refs.songFile.files?.[0]) {
    advanceTutorial("song");
  }
});
refs.songPlayer.addEventListener("loadedmetadata", updateFromMetadata);
refs.tapButton.addEventListener("click", handleTapTempo);
refs.offsetBackButton.addEventListener("click", () => nudgeOffset(-0.02));
refs.offsetForwardButton.addEventListener("click", () => nudgeOffset(0.02));
refs.motionThreshold.addEventListener("input", syncDifficultyControl);
refs.cameraAssist.addEventListener("input", syncCameraAssistControl);
refs.playerName.addEventListener("input", () => {
  if (refs.playerName.value.trim()) {
    advanceTutorial("player");
  }
});
refs.playerName.addEventListener("focus", () => {
  if (refs.playerName.value.trim()) {
    window.setTimeout(() => advanceTutorial("player"), 420);
  }
});
refs.bpmInput.addEventListener("input", () => {
  state.bpm = clamp(Number(refs.bpmInput.value) || 120, 60, 220);
  state.currentSong = currentSongFromSelection();
  state.beatMap = createRegularBeatMap(getSongDuration(), state.bpm, state.beatOffset);
  state.useBeatMap = true;
  state.beatInfoReady = true;
  setMapStatus(
    refs.songFile.files?.[0] ? "Manual map ready" : "Demo map ready",
    refs.songFile.files?.[0] ? "warn" : "live",
  );
  updateBeatStatus();
  renderHud();
});
refs.clearScoresButton.addEventListener("click", () => {
  if (window.confirm("Clear local high scores?")) {
    persistScores([]);
    renderLeaderboard();
    renderHud();
  }
});
refs.exportScoresButton.addEventListener("click", exportScores);
refs.importScoresButton.addEventListener("click", () => refs.importScoresFile.click());
refs.importScoresFile.addEventListener("change", () => {
  importScoresFile(refs.importScoresFile.files?.[0]);
});
refs.shareScoresButton.addEventListener("click", () => {
  shareScores();
});
refs.skipIntroButton.addEventListener("click", () => {
  markIntroSeen();
  hideIntro();
});
refs.showTutorialButton.addEventListener("click", startTutorial);
refs.endTutorialButton.addEventListener("click", endTutorial);

window.addEventListener("resize", () => {
  if (state.tutorialActive) {
    renderTutorialStep();
  }
});

window.addEventListener(
  "scroll",
  () => {
    const step = getTutorialSteps()[state.tutorialStep];
    if (state.tutorialActive && step) {
      positionTutorialBubble(step.target);
    }
  },
  { passive: true },
);

window.addEventListener("beforeunload", () => {
  if (state.fileObjectUrl) {
    URL.revokeObjectURL(state.fileObjectUrl);
  }
});

renderLeaderboard();
setIdleStatuses();
syncDifficultyControl();
syncCameraAssistControl();
if (shouldShowIntro()) {
  showIntro();
}
window.requestAnimationFrame(animationLoop);
