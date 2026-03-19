import express from "express";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { TikTokLiveConnection } from "tiktok-live-connector";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project directory so it works regardless of process cwd (e.g. Cursor/IDE or npm start from parent)
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || "your_tiktok_username_here";

const app = express();
app.use(express.json());

// PWA manifest and service worker: no-cache so updates are always read
app.get("/manifest.json", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, max-age=0");
  res.sendFile(path.join(__dirname, "public", "manifest.json"));
});
app.get("/sw.js", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, max-age=0");
  res.sendFile(path.join(__dirname, "public", "sw.js"));
});

// Static files for frontend
app.use(express.static(path.join(__dirname, "public")));

// Major Arcana image filenames: your actual files in project root (indices 0–21)
// Use these if they exist; otherwise fall back to default names in a "cards" folder
const MAJOR_FILES_IN_ROOT = [
  "thefool.png.jpg", "themagician.png.jpg", "thehighpriestess.png.jpg", "theempress.png.jpg",
  "theemporer.png.jpg", "thehierophant.png.jpg", "thelovers.png.jpg", "thechariot.png.jpg",
  "strength.jpg", "thehermit.png.jpg", "thewheeloffortune.png.jpg", "justice.png.jpg",
  "thehangedman.png.jpg", "death.png.jpg", "temperance.png.jpg", "thedevil.png.jpg",
  "thetower.png.jpg", "thestar.png.jpg", "themoon.png.jpg", "thesun.png.jpg",
  "judgment.png.jpg", "theworld.png.jpg",
];
const MAJOR_FILES_LEGACY = [
  "0_the_fool.jpg", "1_the_magician.jpg", "2_the_high_priestess.jpg", "3_the_empress.jpg",
  "4_the_emperor.jpg", "5_the_hierophant.jpg", "6_the_lovers.jpg", "7_the_chariot.jpg",
  "8_strength.jpg", "9_the_hermit.jpg", "10_wheel_of_fortune.jpg", "11_justice.jpg",
  "12_the_hanged_man.jpg", "13_death.jpg", "14_temperance.jpg", "15_the_devil.jpg",
  "16_the_tower.jpg", "17_the_star.jpg", "18_the_moon.jpg", "19_the_sun.jpg",
  "20_judgement.jpg", "21_the_world.jpg",
];

const WANDS_BASES = [
  "ace_of_wands", "2_of_wands", "3_of_wands", "4_of_wands", "5_of_wands",
  "6_of_wands", "7_of_wands", "8_of_wands", "9_of_wands", "10_of_wands",
  "page_of_wands", "knight_of_wands", "queen_of_wands", "king_of_wands",
];
const WANDS_FILES = WANDS_BASES.flatMap((b) => [`${b}.jpg`, `${b}.png`]);

// Serve card images: prefer files in project root (whitelist), else from "cards" folder
const CARD_FILES_WHITELIST = new Set([
  ...MAJOR_FILES_IN_ROOT,
  ...MAJOR_FILES_LEGACY,
  ...WANDS_FILES,
]);
app.use("/cards", (req, res, next) => {
  const name = path.basename(req.path);
  if (!name || !CARD_FILES_WHITELIST.has(name)) {
    const cardsDir = path.join(__dirname, "cards");
    if (existsSync(cardsDir)) return express.static(cardsDir)(req, res, next);
    return res.status(404).send("Not found");
  }
  const inRoot = path.join(__dirname, name);
  if (existsSync(inRoot)) return res.sendFile(inRoot);
  const inCards = path.join(__dirname, "cards", name);
  if (existsSync(inCards)) return res.sendFile(inCards);
  res.status(404).send("Not found");
});

// Load cards.json as single source of truth (78 cards: 22 Major + 14×4 Minor suits)
const cardsData = JSON.parse(readFileSync(path.join(__dirname, "cards.json"), "utf-8"));
const rawDeck = Array.isArray(cardsData) ? cardsData : cardsData.cards || [];

// Card keys for deck library (index 0–77): major_0..major_21, then ace,2..10,page,knight,queen,king per suit
const MINOR_NAMES = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "page", "knight", "queen", "king"];
const SUITS_FOR_KEYS = ["chalices", "pentacles", "wands", "swords"];
const CARD_KEYS = [];
for (let i = 0; i < 22; i++) CARD_KEYS.push("major_" + i);
for (const suit of SUITS_FOR_KEYS) for (const n of MINOR_NAMES) CARD_KEYS.push(suit + "_" + n);

const DECKS_DIR = path.join(__dirname, "decks");
const ACTIVE_DECK_FILE = path.join(__dirname, "active-deck.json");
let deckCache = null;

function getActiveDeckId() {
  try {
    if (existsSync(ACTIVE_DECK_FILE)) {
      const j = JSON.parse(readFileSync(ACTIVE_DECK_FILE, "utf-8"));
      return j.deckId || "default";
    }
  } catch (_) {}
  return "default";
}

function setActiveDeckId(deckId) {
  mkdirSync(path.dirname(ACTIVE_DECK_FILE), { recursive: true });
  writeFileSync(ACTIVE_DECK_FILE, JSON.stringify({ deckId }, null, 2));
  deckCache = null;
}

function listDecks() {
  const out = [{ id: "default", name: "Default (Santa Muerte)" }];
  if (!existsSync(DECKS_DIR)) return out;
  for (const name of readdirSync(DECKS_DIR, { withFileTypes: true })) {
    if (name.isDirectory()) {
      let label = name.name;
      const metaPath = path.join(DECKS_DIR, name.name, "meta.json");
      if (existsSync(metaPath)) {
        try {
          const m = JSON.parse(readFileSync(metaPath, "utf-8"));
          if (m.name) label = m.name;
        } catch (_) {}
      }
      out.push({ id: name.name, name: label });
    }
  }
  return out;
}

// Pick first existing filename for each major (root, then cards folder)
function getMajorFile(i) {
  const inRoot = path.join(__dirname, MAJOR_FILES_IN_ROOT[i]);
  if (existsSync(inRoot)) return MAJOR_FILES_IN_ROOT[i];
  const inCards = path.join(__dirname, "cards", MAJOR_FILES_LEGACY[i]);
  if (existsSync(inCards)) return MAJOR_FILES_LEGACY[i];
  return MAJOR_FILES_IN_ROOT[i]; // frontend will 404 and show broken img, or use placeholder
}
const MAJOR_FILES = Array.from({ length: 22 }, (_, i) => getMajorFile(i));

function getWandsFile(i) {
  const base = WANDS_BASES[i];
  for (const ext of [".jpg", ".png"]) {
    const name = base + ext;
    if (existsSync(path.join(__dirname, name))) return name;
    if (existsSync(path.join(__dirname, "cards", name))) return name;
  }
  return null;
}

function inferSuit(card, index) {
  if (index < 22) return "Major";
  const n = (card.name || "").toLowerCase();
  if (n.includes("chalices") || n.includes("cups")) return "Cups";
  if (n.includes("pentacles")) return "Pentacles";
  if (n.includes("wands")) return "Wands";
  if (n.includes("swords")) return "Swords";
  return "Major";
}

function getDeckImagePath(deckId, cardKey) {
  const dir = path.join(DECKS_DIR, deckId);
  if (!existsSync(dir)) return null;
  for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
    const p = path.join(dir, cardKey + ext);
    if (existsSync(p)) return "/decks/" + deckId + "/" + path.basename(p);
  }
  return null;
}

function buildDeck() {
  const deckId = getActiveDeckId();
  let meanings = rawDeck;
  if (deckId !== "default") {
    const deckPath = path.join(DECKS_DIR, deckId, "cards.json");
    if (existsSync(deckPath)) {
      try {
        const data = JSON.parse(readFileSync(deckPath, "utf-8"));
        meanings = Array.isArray(data) ? data : data.cards || rawDeck;
      } catch (_) {}
    }
  }
  return meanings.slice(0, 78).map((c, i) => {
    const suit = c.suit || inferSuit(c, i);
    let file = null;
    if (deckId === "default") {
      if (i < 22) file = c.file || MAJOR_FILES[i];
      else if (i >= 50 && i < 64) file = c.file || getWandsFile(i - 50);
    } else {
      file = getDeckImagePath(deckId, CARD_KEYS[i]);
    }
    return { ...c, suit, file };
  });
}

function getDeck() {
  if (deckCache) return deckCache;
  deckCache = buildDeck();
  return deckCache;
}

function clearDeckCache() {
  deckCache = null;
}

// Spread position labels for each reading type (definitive meanings for interpretation)
const SPREAD_POSITIONS = {
  yesno: ["Answer"],
  two_card: [
    "What you're going through now",
    "What's going to help you get through this",
  ],
  three_card: [
    "What you've been through in the past (and how it affects your situation)",
    "What you're going through now",
    "What to do in the future",
  ],
  five_card: [
    "The Present or General Theme — your current situation, the heart of the matter",
    "Past Influences — events or energies from the past still affecting the present",
    "The Future — what may happen next or the short-term outlook",
    "The Reason Behind the Question — underlying cause, motivation, or hidden factor",
    "The Potential or Outcome — possible result or untapped opportunities",
  ],
  celtic7: [
    "The Past — influences or events that shaped the current situation",
    "The Present — your current circumstances or the core issue",
    "The Future — short-term outlook or what may unfold soon",
    "Obstacles or Challenges — what stands in your way, internal or external",
    "Attitudes of Others or External Influences — how people or outside factors affect you",
    "What You Should Do (Advice) — suggested actions, mindset shifts, or steps to take",
    "The Outcome — likely result if you follow the advice, or potential resolution",
  ],
};

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// WebSocket server for overlay
const wss = new WebSocketServer({ server });

function broadcastToClients(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// In-memory state
const likeCounts = new Map(); // userId -> likeCount (per-user, for yes/no at 1000)
const pendingQuestions = new Map(); // userId -> { type, requiredCards, createdAt }
const readingQueue = [];
let processing = false;

// Gift coin thresholds (TikTok diamonds/coins) → spread type
const GIFT_SPREAD_TIERS = [
  { minCoins: 25000, type: "equilibrium", label: "Santa Muerte Equilibrium" },
  { minCoins: 900, type: "celtic7", requiredCards: 7, label: "7-card Celtic" },
  { minCoins: 400, type: "five_card", requiredCards: 5, label: "Path of Five" },
  { minCoins: 150, type: "three_card", requiredCards: 3, label: "Past · Present · Future" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomCard(fromDeck) {
  if (!fromDeck) fromDeck = getDeck();
  const c = fromDeck[Math.floor(Math.random() * fromDeck.length)];
  const isUpright = Math.random() < 0.5;
  const upText = typeof c.upright === "string" ? c.upright : "";
  const revText = typeof c.reversed === "string" ? c.reversed : "";
  let meaning = isUpright ? upText : revText;
  if (!meaning) meaning = isUpright ? revText : upText;
  if (!meaning) meaning = `${c.name || "Card"} (${isUpright ? "upright" : "reversed"}): Trust your intuition.`;
  return { ...c, upright: isUpright, meaning };
}

function drawCards(n, fromDeck) {
  if (!fromDeck) fromDeck = getDeck();
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(getRandomCard(fromDeck));
  }
  return result;
}

function getCardMeaning(card) {
  if (card.meaning != null && card.meaning !== "") return card.meaning;
  if (typeof card.upright === "string") return card.upright;
  if (typeof card.reversed === "string") return card.reversed;
  return `${card.name} (${card.upright ? "upright" : "reversed"}): Trust your intuition.`;
}

/** Build interpretation from local database based on spread type (no external API). */
function buildLocalInterpretation({ type, username, question, cards }) {
  const positions = SPREAD_POSITIONS[type] || cards.map((_, i) => `Card ${i + 1}`);
  const parts = [];

  if (type === "yesno" && cards.length >= 1) {
    const card = cards[0];
    const meaning = getCardMeaning(card);
    const lean = card.upright ? "The cards lean toward yes." : "The cards lean toward no.";
    return `Question: ${question}\n\n${lean} ${meaning}`;
  }

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const label = positions[i] || `Position ${i + 1}`;
    const meaning = getCardMeaning(card);
    parts.push(`${label} — ${card.name} (${card.upright ? "upright" : "reversed"}): ${meaning}`);
  }

  return `Question: ${question}\n\n` + parts.join("\n\n");
}

// --- Santa Muerte Equilibrium Spread (9 cards: A–I) ---
function divideDecks() {
  const d = getDeck();
  const majors = d.filter((c) => c.suit === "Major");
  const cups = d.filter((c) => c.suit === "Cups");
  const pentacles = d.filter((c) => c.suit === "Pentacles");
  const swords = d.filter((c) => c.suit === "Swords");
  const wands = d.filter((c) => c.suit === "Wands");
  return {
    majors: shuffle(majors),
    cups: shuffle(cups),
    pentacles: shuffle(pentacles),
    swords: shuffle(swords),
    wands: shuffle(wands),
  };
}

function getAdviceOfTheDead(card) {
  if (!card.advice) return "Reflect on the present card and seek clarity within.";
  return card.advice;
}

const EQUILIBRIUM_POSITIONS = {
  A: {
    label: "Past / Inertia",
    deck: "majors",
    description: "Past, the beginning of the situation the querent wishes to clarify, or inertia—what is keeping the situation blocked and stagnant.",
  },
  B: {
    label: "Present / Development",
    deck: "majors",
    description: "The present situation: development of conditions about which clarification is requested, and how to observe the current movement.",
  },
  C: {
    label: "Future / Conclusion",
    deck: "majors",
    description: "The future: the conclusion of the entire situation or the balance that will be achieved.",
  },
  D: {
    label: "Advantages / Active",
    deck: "majors",
    description: "What is to our advantage: strong points to use and preserve, what comes to our aid, or more generally the active influences.",
  },
  E: {
    label: "Disadvantages / Receptive",
    deck: "majors",
    description: "What is to our disadvantage: weak points to be careful of and to remove ourselves from, the risk or receptive influences for a new point of view.",
  },
  F: {
    label: "Emotional center (Chalices)",
    deck: "cups",
    description: "From the Suit of Chalices. The state of our emotional center, our feelings, and the influence of our memories.",
  },
  G: {
    label: "Material center (Pentacles)",
    deck: "pentacles",
    description: "From the Minor Arcana of Pentacles. The state of our material center: economic situation, appearance, and physical health.",
  },
  H: {
    label: "Mental center (Swords)",
    deck: "swords",
    description: "From the Minor Arcana of Swords. The state of our mental center: thoughts, ideas, and how we communicate with the external world.",
  },
  I: {
    label: "Creative center (Wands)",
    deck: "wands",
    description: "From the Minor Arcana of Wands. The state of our creative center: desires, sexual satisfaction, and how we express creativity.",
  },
};

function equilibriumDraw(decks) {
  const out = {};
  const majorIndices = [0, 1, 2, 3, 4];
  function ensureMeaning(c, isUpright) {
    const upText = typeof c.upright === "string" ? c.upright : "";
    const revText = typeof c.reversed === "string" ? c.reversed : "";
    let meaning = isUpright ? upText : revText;
    if (!meaning) meaning = isUpright ? revText : upText;
    if (!meaning) meaning = `${c.name || "Card"} (${isUpright ? "upright" : "reversed"}): Trust your intuition.`;
    return meaning;
  }
  for (const key of ["A", "B", "C", "D", "E"]) {
    const pile = decks.majors;
    const i = majorIndices["ABCDE".indexOf(key)];
    if (!pile || !pile[i]) continue;
    const c = pile[i];
    const isUpright = Math.random() < 0.5;
    const card = { ...c, upright: isUpright, meaning: ensureMeaning(c, isUpright) };
    out[key] = { ...EQUILIBRIUM_POSITIONS[key], card };
  }
  for (const key of ["F", "G", "H", "I"]) {
    const deckKey = EQUILIBRIUM_POSITIONS[key].deck;
    const pile = decks[deckKey];
    if (!pile || pile.length === 0) continue;
    const c = pile[0];
    const isUpright = Math.random() < 0.5;
    const card = { ...c, upright: isUpright, meaning: ensureMeaning(c, isUpright) };
    out[key] = { ...EQUILIBRIUM_POSITIONS[key], card };
  }
  return out;
}

async function runEquilibriumSpread(username, question) {
  const decks = divideDecks();
  const positions = equilibriumDraw(decks);
  const interpretations = {};
  for (const [key, data] of Object.entries(positions)) {
    if (!data.card) continue;
    interpretations[key] = getCardMeaning(data.card);
  }
  const cardB = positions.B?.card;
  const adviceOfTheDead = cardB ? await getAdviceOfTheDead(cardB, question) : "";
  if (adviceOfTheDead && cardB) {
    console.log("[Advice of the dead for B]", adviceOfTheDead);
  }
  return {
    username,
    question,
    positions: Object.fromEntries(
      Object.entries(positions).map(([k, v]) => [
        k,
        v.card
          ? {
              label: v.label,
              description: v.description,
              card: { ...v.card, name: v.card.name, file: v.card.file, upright: v.card.upright, meaning: v.card.meaning || interpretations[k] },
              interpretation: interpretations[k],
            }
          : null,
      ])
    ),
    adviceOfTheDead,
  };
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (readingQueue.length > 0) {
    const item = readingQueue.shift();
    const { type, username, question, requiredCards } = item;

    const cards = drawCards(requiredCards);
    let aiText = buildLocalInterpretation({ type, username, question, cards });

    let adviceOfTheDead = null;
    if (type === "yesno" && cards.length >= 1) {
      adviceOfTheDead = await getAdviceOfTheDead(cards[0], question || "General guidance");
      aiText = aiText + "\n\nAdvice from the dead: " + adviceOfTheDead;
    }

    const payload = {
      event: "new_reading",
      type,
      username,
      question,
      cards,
      aiText,
      ...(adviceOfTheDead && { adviceOfTheDead }),
    };

    console.log("Broadcasting reading:", type, username);
    broadcastToClients(payload);
  }

  processing = false;
}

function enqueueReading({ type, username, question, requiredCards }) {
  readingQueue.push({ type, username, question, requiredCards });
  processQueue(); // async; no need to await
}

// Trigger Santa Muerte Equilibrium Spread (manual or from control panel)
app.post("/api/equilibrium", async (req, res) => {
  try {
    const question = req.body?.question || "General guidance";
    const username = req.body?.username || "Streamer";
    const result = await runEquilibriumSpread(username, question);
    broadcastToClients({ event: "equilibrium_reading", ...result });
    res.json({ ok: true, message: "Equilibrium spread broadcast" });
  } catch (err) {
    console.error("equilibrium error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Test endpoint: local interpretation only (no API)
app.get("/test-reading", (req, res) => {
  try {
    const card = getRandomCard();
    const cards = [card];
    const aiText = buildLocalInterpretation({
      type: "yesno",
      username: "test",
      question: "Will this week go well?",
      cards,
    });
    res.json({ ok: true, card: { name: card.name, upright: card.upright }, aiText });
  } catch (err) {
    console.error("test-reading error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Hidden streamer control panel (open in a separate tab — do not add to OBS)
app.get("/control", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "control.html"));
});

// Spread pages (Past · Present · Future = 3-card, Path of Five = 5-card)
app.get("/spread/yesno", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spread-yesno.html"));
});
app.get("/spread/two-card", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spread-two-card.html"));
});
app.get("/spread/past-present-future", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spread-past-present-future.html"));
});
app.get("/spread/path-of-five", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spread-path-of-five.html"));
});
app.get("/spread/celtic-seven", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spread-celtic-seven.html"));
});
app.get("/spread/equilibrium", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spread-equilibrium.html"));
});

// --- Deck library: list, active, upload, serve images ---
app.get("/library", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "library.html"));
});

app.get("/api/decks", (req, res) => {
  res.json(listDecks());
});

app.get("/api/decks/active", (req, res) => {
  res.json({ deckId: getActiveDeckId() });
});

app.get("/api/decks/active/cards", (req, res) => {
  const d = getDeck();
  res.json(CARD_KEYS.slice(0, d.length).map((key, i) => ({
    key,
    name: d[i].name,
    file: d[i].file || null,
  })));
});

app.post("/api/decks/active", express.json(), (req, res) => {
  const deckId = (req.body && req.body.deckId) || "default";
  const decks = listDecks();
  if (!decks.some((d) => d.id === deckId)) {
    return res.status(400).json({ error: "Unknown deck" });
  }
  setActiveDeckId(deckId);
  clearDeckCache();
  res.json({ deckId });
});

app.post("/api/decks", express.json(), (req, res) => {
  const name = (req.body && req.body.name) || "New deck";
  const id = (req.body && req.body.id) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!id) return res.status(400).json({ error: "Invalid name" });
  const dir = path.join(DECKS_DIR, id);
  if (existsSync(dir)) return res.status(409).json({ error: "Deck already exists" });
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ name }, null, 2));
  clearDeckCache();
  res.json({ id, name });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.post("/api/decks/:deckId/cards/:cardKey/upload", upload.single("file"), (req, res) => {
  const { deckId, cardKey } = req.params;
  if (!CARD_KEYS.includes(cardKey)) return res.status(400).json({ error: "Invalid card key" });
  if (deckId === "default") return res.status(400).json({ error: "Cannot upload to default deck; create a custom deck first" });
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file" });
  let ext = path.extname(file.originalname).toLowerCase();
  if (!ext && file.mimetype && file.mimetype.startsWith("image/")) ext = ".jpg";
  if (!ext) ext = ".jpg";
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (!allowed.includes(ext)) return res.status(400).json({ error: "Use .jpg, .png, .webp or .gif" });
  const dir = path.join(DECKS_DIR, deckId);
  mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, cardKey + ext);
  writeFileSync(outPath, file.buffer);
  clearDeckCache();
  res.json({ ok: true, cardKey, file: "/decks/" + deckId + "/" + cardKey + ext });
});

app.get("/decks/:deckId/:filename", (req, res) => {
  const { deckId, filename } = req.params;
  const base = path.basename(filename, path.extname(filename));
  if (!CARD_KEYS.includes(base)) return res.status(404).send("Not found");
  const p = path.join(DECKS_DIR, deckId, filename);
  if (!existsSync(p)) return res.status(404).send("Not found");
  res.sendFile(p);
});

// TikTok connection
if (!TIKTOK_USERNAME || TIKTOK_USERNAME === "your_tiktok_username_here") {
  console.warn(
    "TIKTOK_USERNAME is not configured. Please set it in your .env file."
  );
} else {
  console.log(`Connecting to TikTok live for @${TIKTOK_USERNAME}...`);

  const tiktokConnection = new TikTokLiveConnection(TIKTOK_USERNAME, {
    enableExtendedGiftInfo: true,
  });

  tiktokConnection
    .connect()
    .then((state) => {
      console.log(`Connected to roomId ${state.roomId}`);
    })
    .catch((err) => {
      console.error("Failed to connect to TikTok live:", err);
    });

  // Likes: per-user 1000 -> yes/no (only that user can ask the question)
  tiktokConnection.on("like", (data) => {
    const userId = data.userId || data.uniqueId || "unknown";
    const username = data.uniqueId || data.nickname || "Unknown";
    const delta = data.likeCount || 1;

    const previous = likeCounts.get(userId) || 0;
    const newTotal = previous + delta;
    likeCounts.set(userId, newTotal);
    const previousBlocks = Math.floor(previous / 1000);
    const newBlocks = Math.floor(newTotal / 1000);
    if (newBlocks > previousBlocks) {
      console.log(
        `User ${username} reached ${newBlocks * 1000} likes, flagging pending yes/no question.`
      );
      pendingQuestions.set(userId, {
        type: "yesno",
        requiredCards: 1,
        createdAt: Date.now(),
      });
      broadcastToClients({
        event: "notification",
        message: `@${username} reached 1,000 likes! Only they may ask a yes/no question in chat now.`,
      });
    }
  });

  // Share: 2-card reading (only the sharer may ask the question)
  tiktokConnection.on("share", (data) => {
    const userId = data.userId || data.uniqueId || "unknown";
    const username = data.uniqueId || data.nickname || "Unknown";

    console.log(`Share from ${username}, awaiting question for 2-card reading.`);
    pendingQuestions.set(userId, {
      type: "two_card",
      requiredCards: 2,
      createdAt: Date.now(),
    });

    broadcastToClients({
      event: "notification",
      message: `@${username} shared the live! Only they may ask the question for their 2-card reading in chat.`,
    });
  });

  // Gifts: coin tiers -> premium spreads (3-card ~199, 5-card ~500, 7-card ~1000, Equilibrium 29k+)
  tiktokConnection.on("gift", (data) => {
    const userId = data.userId || data.uniqueId || "unknown";
    const username = data.uniqueId || data.nickname || "Unknown";
    const giftName =
      data.giftName || data.extendedGiftInfo?.name || data.extendedGiftInfo?.giftName || "Unknown gift";

    // Only act on single gifts or when streak ends (avoid triggering on every repeat)
    const isRepeatEnd = data.repeatEnd === true;
    const repeatCount = Math.max(1, data.repeatCount || data.gift?.repeat_count || 1);
    const diamondPerUnit = data.diamondCount ?? data.extendedGiftInfo?.diamondCount ?? 0;
    const totalCoins = diamondPerUnit * repeatCount;

    if (!isRepeatEnd && repeatCount > 1) return; // mid-streak, wait for repeatEnd

    console.log(`Gift from ${username}: ${giftName} (${totalCoins} coins)`);

    const tier = GIFT_SPREAD_TIERS.find((t) => totalCoins >= t.minCoins);
    if (!tier) return;

    if (tier.type === "equilibrium") {
      pendingQuestions.set(userId, { type: "equilibrium", createdAt: Date.now() });
      broadcastToClients({
        event: "attuning",
        username,
        spreadLabel: "Santa Muerte Equilibrium Spread",
        spreadRoute: "/spread/equilibrium",
      });
      broadcastToClients({
        event: "notification",
        message: `Only @${username} may ask the question for this reading. Center yourself and ask in chat.`,
      });
      console.log(`Premium gift from ${username}: Santa Muerte Equilibrium (only they may ask).`);
      return;
    }

    pendingQuestions.set(userId, {
      type: tier.type,
      requiredCards: tier.requiredCards,
      createdAt: Date.now(),
    });
    const spreadRoutes = {
      three_card: "/spread/past-present-future",
      five_card: "/spread/path-of-five",
      celtic7: "/spread/celtic-seven",
    };
    broadcastToClients({
      event: "attuning",
      username,
      spreadLabel: tier.label,
      spreadRoute: spreadRoutes[tier.type] || "/",
    });
    broadcastToClients({
      event: "notification",
      message: `Only @${username} may ask the question for this ${tier.label} reading. Ask in chat when ready.`,
    });
    console.log(`Gift from ${username}: ${tier.label} (only they may ask).`);
  });

  // Chat: !equilibrium triggers spread (next message = question). 3-card and 5-card are gift-only.
  tiktokConnection.on("chat", async (data) => {
    const userId = data.userId || data.uniqueId || "unknown";
    const username = data.uniqueId || data.nickname || "Unknown";
    const text = (data.comment || "").trim();

    if (/!equilibrium/i.test(text)) {
      pendingQuestions.set(userId, { type: "equilibrium", createdAt: Date.now() });
      broadcastToClients({
        event: "notification",
        message: `@${username} requested the Santa Muerte Equilibrium Spread. Ask your question in chat now!`,
      });
      console.log(`Equilibrium spread requested by ${username}`);
      return;
    }

    const pending = pendingQuestions.get(userId);
    if (!pending) return;

    if (Date.now() - pending.createdAt > 5 * 60 * 1000) {
      pendingQuestions.delete(userId);
      return;
    }

    pendingQuestions.delete(userId);

    if (pending.type === "equilibrium") {
      try {
        const result = await runEquilibriumSpread(username, text || "General guidance");
        broadcastToClients({ event: "equilibrium_reading", ...result });
      } catch (err) {
        console.error("Equilibrium spread error:", err);
      }
      return;
    }

    console.log(`Received question from ${username} for ${pending.type} reading: ${text}`);
    enqueueReading({
      type: pending.type,
      username,
      question: text,
      requiredCards: pending.requiredCards,
    });
  });

  tiktokConnection.on("disconnected", () => {
    console.warn("Disconnected from TikTok live.");
  });
}

