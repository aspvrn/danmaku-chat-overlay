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
//  * PUBLIC API ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  if (text == null && !(content instanceof Node)) return;

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
  nameSpan.textContent = cleanName;

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

window.addDanmaku = addDanmaku;

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// EVENT LOGGER (DEV USE ONLY)
window.addEventListener("onEventReceived", (obj) => {
  const evt = obj?.detail?.event;

  console.group("STREAM ELEMENTS EVENT");
  // console.log("EVENT DETAIL:", obj?.detail);
  console.log("LISTENER:", obj?.detail?.listener);
  console.log("TYPE:", evt?.type);
  console.log("DATA:", evt?.data);
  console.groupEnd();
});




// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  EVENT LISTENER
window.addEventListener("onEventReceived", (obj) => {
  const d = obj.detail;
  if (!d || !d.event || d.listener != "event") return;

  // Normalize chat
  if (d.listener === "message") {
    detectEvent({
      type: "message",
      data: d.event.data
    });
    return;
  }

  // Everything else already has evt.type
  detectEvent(d.event);
});


//  EVENT MANAGER
function detectEvent(evt) {
  const kind = evt.type;

  switch (kind) {
    case "message":
      handleChat(evt);
      break;

    case "sponsor":
    case "subscriber":
      handleSub(evt);
      break;

    case "communityGiftPurchase":
      handleCommunityGift(evt);
      break;

    case "tip":
      handleTip(evt);
      break;

    case "superchat":
      handleSuperChat(evt);
      break;

    case "raid":
      handleRaid(evt);
      break;
    
    case "cheer":
      handleCheer(evt);
      break

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


// RAID SCALING
function raidScale(viewers) {
  if (!viewers || viewers <= 0) return 1.2;

  // Clamp to avoid insanity
  const capped = Math.min(viewers, 500);

  // Smooth growth
  return 1.2 + Math.log10(capped) * 0.8;
}


// CHEER SCALING
function cheerScale(bits) {
  if (!bits || bits <= 0) return 1;

  const capped = Math.min(bits, 10000);
  return 1 + Math.log10(capped) * 0.7;
}


// Gift Scaling
function giftScale(count) {
  if (!count || count <= 1) return 1.2;

  const capped = Math.min(count, 100);
  return 1.2 + Math.log10(capped) * 1.1;
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
function handleSub(evt) {
  const d = evt.data;
  if (!d) return;

  // Gifted sub recipient
  if (d.gifted) {
    addDanmaku({
      name: d.displayName,
      content: document.createTextNode(""),
      type: "gifted_sub",
      scale: 1
    });
    return;
  }

  // ⭐ Normal sub
  addDanmaku({
    name: d.displayName,
    text: "just subscribed!",
    type: "sub",
    scale: 1.4
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


// Raids
function handleRaid(evt) {
  const d = evt.data || {};
  if (!d.displayName || !d.amount) return;

  const raider = d.displayName;
  const viewers = d.amount;

  // Build structured content
  const content = document.createElement("span");

  const nameEl = document.createElement("span");
  nameEl.textContent = `${raider} `;

  const textEl = document.createElement("span");
  textEl.textContent = "is raiding with ";

  const amountEl = document.createElement("span");
  amountEl.className = "amount";
  amountEl.textContent = `${viewers} viewers!`;

  content.appendChild(nameEl);
  content.appendChild(textEl);
  content.appendChild(amountEl);

  addDanmaku({
    name: "RAID",
    content,
    type: "raid",
    scale: raidScale(viewers)
  });
}



function handleCheer(evt) {
  const d = evt.data;
  if (!d) return;

  const bits = d.amount;
  const user = d.displayName;
  // const message = d.message?.trim();

  const content = document.createElement("span");

  const textEl = document.createElement("span");
  textEl.textContent = "cheered ";

  const amountEl = document.createElement("span");
  amountEl.className = "amount";
  amountEl.textContent = `${bits} bits`;

  content.appendChild(textEl);
  content.appendChild(amountEl);

  // if (message) {
  //   const msgEl = document.createElement("span");
  //   msgEl.textContent = ` — ${message}`;
  //   content.appendChild(msgEl);
  // }

  addDanmaku({
    name: user,
    content,
    type: "cheer",
    scale: cheerScale(bits)
  });
}



function handleCommunityGift(evt) {
  const d = evt.data;
  if (!d || !d.displayName || !d.amount) return;

  const gifter = d.displayName;
  const count = d.amount;

  const content = document.createElement("span");

  const textEl = document.createElement("span");
  textEl.textContent = "gifted ";

  const amountEl = document.createElement("span");
  amountEl.className = "amount";
  amountEl.textContent = `${count} subscriptions!`;

  content.appendChild(textEl);
  content.appendChild(amountEl);

  addDanmaku({
    name: gifter,
    content,
    type: "gifted_sub",
    scale: giftScale(count)
  });
}


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////









function applyStyleVars() {
  
}

let lastLaneGap = null;

// widget load (fields/settings)
window.addEventListener("onWidgetLoad", (obj) => {
  const f = obj?.detail?.fieldData;
  if (!f) return;

  RUNTIME.devMode       = f.devMode;
  RUNTIME.devDelay      = Number(f.devDelay);
  RUNTIME.fontSize      = Number(f.fontSize);
  RUNTIME.laneGap       = Number(f.laneGap);
  RUNTIME.shadowColor   = f.shadowColor;
  RUNTIME.strokeColor   = f.strokeColor;
  RUNTIME.strokeWidth   = Number(f.strokeWidth);

  const root = document.documentElement.style;
  root.setProperty("--stroke-width",  `${RUNTIME.strokeWidth}px`);
  root.setProperty("--font-size",     `${RUNTIME.fontSize}px`);
  root.setProperty("--text-color",    RUNTIME.textColor);
  root.setProperty("--stroke-color",  RUNTIME.strokeColor);
  root.setProperty("--shadow-color",  RUNTIME.shadowColor);
  
  computeLanes();
  restartDevChat();
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


