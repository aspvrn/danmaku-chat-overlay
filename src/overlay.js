/**
 * Danmaku engine
 * - assigns messages to lanes (rows)
 * - prevents too much overlap
 * - animates right->left
 */

const stage = document.getElementById("stage");

const RUNTIME = {
  devMode: true,
  devDelay: 1200,

  fontSize: 24,
  laneGap: 36,

  textColor: "rgba(255,255,255,1)",
  strokeColor: "rgba(0,0,0,1)",
  shadowColor: "rgba(0,0,0,0.45)",

  strokeWidth: 4
};


// Tunables (safe defaults for 1080p)
const CONFIG = {
  lanePaddingTop: 16,      // px
  lanePaddingBottom: 16,   // px
  maxLanes: null,          // null = auto from stage height
  minGapPx: 80,            // minimum gap between bullets in same lane
  rateLimitPerSec: 20,     // basic spam protection
  maxTextLength: 160,      // trim overly long messages
};

let lanes = [];
let lastSecond = 0;
let countThisSecond = 0;

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function nowSec() { return Math.floor(Date.now() / 1000); }

function computeLanes() {
  const h = stage.clientHeight || 1080;
  const usable = h - CONFIG.lanePaddingTop - CONFIG.lanePaddingBottom;

  const laneCount = Math.floor(usable / RUNTIME.laneGap);
  const count =
    CONFIG.maxLanes == null
      ? laneCount
      : Math.min(laneCount, CONFIG.maxLanes);

  lanes = Array.from({ length: Math.max(1, count) }, () => ({
    lastEndTime: 0,
    lastRightEdgeX: 0
  }));
}

function speedVariation(percent) {
  const p = percent / 100;
  return 1 + (Math.random() * (p * 2) - p);
}



window.addEventListener("resize", computeLanes);
computeLanes();











// /**
//  * PUBLIC API ///////////////////////////////////////////////////////////////////////////////////////
//  */
function addDanmaku({ name, text, content, type = "chat", color, scale = 1 }) {

  // ─────────────────────────────
  // Rate limit
  // ─────────────────────────────
  const s = nowSec();
  if (s !== lastSecond) {
    lastSecond = s;
    countThisSecond = 0;
  }
  if (++countThisSecond > CONFIG.rateLimitPerSec) return;

  // Allow text OR structured content
  if (!text && !(content instanceof Node)) return;

  const cleanName = (name ?? "Anonymous").toString().slice(0, 32);

  let cleanText = "";
  if (typeof text === "string") {
    cleanText = text.replace(/\s+/g, " ").trim();
    if (!cleanText) return;
    if (cleanText.length > CONFIG.maxTextLength) {
      cleanText = cleanText.slice(0, CONFIG.maxTextLength) + "…";
    }
  }

  // ─────────────────────────────
  // Create nodes (movement + visuals separated)
  // ─────────────────────────────
  const el = document.createElement("div");
  el.className = "danmaku";
  el.dataset.type = type;

  const inner = document.createElement("div");
  inner.className = "danmaku-inner";
  inner.style.setProperty("--scale", scale);

  const nameSpan = document.createElement("span");
  nameSpan.className = "name";
  nameSpan.textContent = cleanName + ":";

  const msgSpan = document.createElement("span");
  msgSpan.className = "msg";

  if (content instanceof Node) {
    msgSpan.appendChild(content);
  } else {
    msgSpan.textContent = cleanText;
  }

  inner.appendChild(nameSpan);
  inner.appendChild(msgSpan);
  el.appendChild(inner);
  stage.appendChild(el);

  // ─────────────────────────────
  // Event-based styling
  // ─────────────────────────────
  if (type === "sub" || type === "gifted_sub") {
    nameSpan.style.color = "rgba(180,100,255,1)";
  }

  if (type === "donation" || type === "tip") {
    nameSpan.style.color = "rgba(80,220,120,1)";
  }

  if (color) {
    nameSpan.style.color = color;
  }

  // ─────────────────────────────
  // Measure width AFTER layout
  // ─────────────────────────────
  const w = el.getBoundingClientRect().width;
  const stageW = stage.clientWidth || 1920;

  // ─────────────────────────────
  // Lane selection
  // ─────────────────────────────
  const t = performance.now();
  let laneIndex = 0;
  let best = Infinity;

  for (let i = 0; i < lanes.length; i++) {
    const score = Math.max(lanes[i].lastEndTime - t, 0);
    if (score < best) {
      best = score;
      laneIndex = i;
    }
  }

  const lane = lanes[laneIndex];

  // ─────────────────────────────
  // Positioning
  // ─────────────────────────────
  const yPx = CONFIG.lanePaddingTop + laneIndex * RUNTIME.laneGap;
  const startX = stageW + 20;
  const visualWidth = w * scale;
  const endX = -visualWidth - 40;


  // ─────────────────────────────
  // Fixed-speed motion (KEY FIX)
  // ─────────────────────────────
  const baseSpeed = RUNTIME.baseSpeed || 220;

  const speedMultiplier =
    type === "donation"
      ? Math.min(1.6, 1 + (scale - 1) * 0.15)
      : 1;

  // Speed variation between messages
  const speed = baseSpeed * speedMultiplier * speedVariation(15);
  const distance = startX - endX;

  let duration = distance / speed;
  duration = Math.max(duration, 3); // safety clamp
  duration = Math.min(duration, 18); // safety clamp

  // Lane overlap timing
  const gapTimeMs = ((w + CONFIG.minGapPx) / speed) * 1000;
  lane.lastEndTime = t + gapTimeMs;

  // ─────────────────────────────
  // Animate
  // ─────────────────────────────
  el.style.setProperty("--start-x", `${startX}px`);
  el.style.setProperty("--end-x", `${endX}px`);
  el.style.setProperty("--y", `${yPx}px`);

  el.style.animation = `fly ${duration}s linear forwards`;

  el.addEventListener("animationend", (e) => {
    if (e.target !== el) return; // ignore inner animations
    el.remove();
  }, { once: true });

}



// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
window.addDanmaku = addDanmaku;




































// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // EVENT LOGGER (DEV USE ONLY)
// window.addEventListener("onEventReceived", (obj) => {
//   const evt = obj?.detail?.event;

//   console.group("STREAM ELEMENTS EVENT");
//   console.log("RAW EVENT:", evt);
//   console.log("LISTENER:", evt?.listener);
//   console.log("TYPE:", evt?.type);
//   console.log("DATA:", evt?.data);
//   console.groupEnd();
// });



//  EVENT LISTENER
window.addEventListener("onEventReceived", (obj) => {
  const detail = obj.detail;
  if (!detail) return;

  const listener = detail.listener;
  const evt = detail.event || {};

  // ───────── Chat messages ─────────
  if (listener === "message") {
    const data = evt.data;
    if (!data) return;

    detectEvent({
      type: "message",
      data: {
        displayName: data.displayName,
        text: data.text,
        userId: data.userId,
        msgId: data.msgId
      }
    });

    return;
  }

  // ───────── Non-chat events ─────────
  detectEvent(evt);
});

//  EVENT IDENTIFIER
function getEventKind(evt) {
  // Prefer originalEventName if present
  if (evt.originalEventName) return evt.originalEventName;

  // Fall back to type
  return evt.type;
}


//  EVENT HANDLER
function detectEvent(evt) {
  const kind = getEventKind(evt);

  switch (kind) {
    case "message":
      handleChat(evt);
      break;

    case "sponsor":
    case "subscriber":
      handleSponsor(evt);
      break;

    case "tip":
      handleTip(evt);
      break;

    case "superchat":
      handleSuperChat(evt);
      break;

    default:
      // ignore
      break;
  }
}


// NAME HANDLER
function pickName(evt) {
  const d = evt.data || evt;

  return (
    d.sender ||          // gifter
    d.displayName ||     // user / recipient
    d.username ||
    d.name ||
    "Anonymous"
  );
}


// CURRENCY HELPER 
function formatCurrency(amount, currency = "USD", locale = "en-US") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback if currency code is invalid
    return `${amount} ${currency}`;
  }
}



// DONATION SCALING
function donationScale(amount) {
  const BASE = 25;          // $25 = meaningful
  const MIN_SCALE = 1;
  const MAX_SCALE = 8;      // visually huge but controlled

  if (amount <= 0) return MIN_SCALE;

  // Logarithmic growth
  const scale = 1 + Math.log10(amount / BASE + 1) * 3;

  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}



// EVENTS
// message
function handleChat(evt) {
  const text = evt?.data?.text || evt?.data?.message || "";
  if (!text) return;

  addDanmaku({
    name: pickName(evt),
    text,
    type: "chat"
  });
}



// Subs
function handleSponsor(evt) {
  const d = evt.data || {};
  const name = pickName(evt);

  if (d.gifted) {
    addDanmaku({
      name: d.sender || name,   // gifter
      text: "gifted a membership!",
      type: "gifted_sub"
    });
    return;
  }

  addDanmaku({
    name,
    text: "just became a member!",
    type: "sub"
  });
}



// Donations
function handleTip(evt) {
  const d = evt.data || evt || {};

  const amount =
    d.amount ??
    d.tipAmount ??
    d.totalAmount ??
    null;

  if (!amount) return;

  const currency =
    d.currency ||
    d.currencyCode ||
    "USD";

  const content = document.createElement("div");
  content.className = "content";

  const amountEl = document.createElement("span");
  amountEl.className = "amount";
  amountEl.textContent = formatCurrency(amount, currency);
  content.appendChild(amountEl);

  const scale = donationScale(amount);

  addDanmaku({
    name: pickName(evt),
    content,
    type: "donation",
    scale
  });
}



// Superchat
function handleSuperChat(evt) {
  const d = evt.data || evt || {};

  const amount =
    d.amount ??
    d.totalAmount ??
    d.value ??
    null;

  const currency =
    d.currency ||
    d.currencyCode ||
    "USD";

  const message =
    d.message ||
    d.text ||
    "";

  const content = document.createElement("div");
  content.className = "content";

  if (amount) {
    const amountEl = document.createElement("span");
    amountEl.className = "amount";
    amountEl.textContent = formatCurrency(amount, currency);
    content.appendChild(amountEl);
  }

  if (message) {
    const msgEl = document.createElement("span");
    msgEl.className = "message";
    msgEl.textContent = ` — ${message}`;
    content.appendChild(msgEl);
  }

  const scale = donationScale(amount);

  addDanmaku({
    name: pickName(evt),
    content,
    type: "donation",
    scale
  });
}



// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
















function applyStyleVars() {
  const root = document.documentElement.style;

  root.setProperty("--font-size", `${RUNTIME.fontSize}px`);
  root.setProperty("--text-color", RUNTIME.textColor);
  root.setProperty("--stroke-color", RUNTIME.strokeColor);
  root.setProperty("--shadow-color", RUNTIME.shadowColor);
  root.setProperty("--stroke-width", `${RUNTIME.strokeWidth}px`);
}

let lastLaneGap = null;

function applyRuntime() {
  applyStyleVars();


  if (RUNTIME.laneGap !== lastLaneGap) {
    lastLaneGap = RUNTIME.laneGap;
    computeLanes();
  }

  restartDevChat();
}


// widget load (fields/settings)
window.addEventListener("onWidgetLoad", (obj) => {
  const f = obj?.detail?.fieldData;
  if (!f) return;

  RUNTIME.devMode     = f.devMode;
  RUNTIME.devDelay    = Number(f.devDelay);
  RUNTIME.fontSize    = Number(f.fontSize);
  RUNTIME.shadowColor = f.shadowColor;
  RUNTIME.strokeColor = f.strokeColor;
  RUNTIME.strokeWidth = Number(f.strokeWidth);

  applyRuntime();
});



let devTimer = null;

const DEV_NAMES = ["PixelPenguin", "NeonByte", "ShadowOrbit", "MangoFPS", "LofiLlama", "NoScopeNate", "RetroWave", "NullPtr", "ZenithTV", "CosmicToast"];
const DEV_MESSAGES = ["hello chat", "this overlay is clean", "danmaku goes hard", "why is this so smooth", "W overlay"];
const DEV_SPAM = ["😭😭😭😭😭😭","WWWWWWWWWWWW","😂😂😂😂😂","🔥🔥🔥🔥🔥","💀💀💀💀","CHAT CHAT CHAT","AAAAAAAAAAA"];

function restartDevChat() {
  if (devTimer) {
    clearInterval(devTimer);
    devTimer = null;
  }

  if (!RUNTIME.devMode) return;

  devTimer = setInterval(() => {
    // Normal messages
    addDanmaku({
      name: DEV_NAMES[Math.floor(Math.random() * DEV_NAMES.length)],
      text: DEV_MESSAGES[Math.floor(Math.random() * DEV_MESSAGES.length)]
    });
  }, RUNTIME.devDelay);
}


