#!/usr/bin/env node
/**
 * Build static site into docs/ for GitHub Pages.
 *
 *   TAROT_SITE_BASE=/your-repo-name npm run build-static
 *
 * Use leading slash, no trailing slash, e.g. /streamgame for https://user.github.io/streamgame/
 * Omit TAROT_SITE_BASE for a site served at domain root (e.g. custom domain).
 */
import {
  cpSync,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
  statSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "docs");
const SITE_BASE = (process.env.TAROT_SITE_BASE || "").replace(/\/+$/, "");

const MAJOR_FILES_IN_ROOT = [
  "thefool.png.jpg",
  "themagician.png.jpg",
  "thehighpriestess.png.jpg",
  "theempress.png.jpg",
  "theemporer.png.jpg",
  "thehierophant.png.jpg",
  "thelovers.png.jpg",
  "thechariot.png.jpg",
  "strength.jpg",
  "thehermit.png.jpg",
  "thewheeloffortune.png.jpg",
  "justice.png.jpg",
  "thehangedman.png.jpg",
  "death.png.jpg",
  "temperance.png.jpg",
  "thedevil.png.jpg",
  "thetower.png.jpg",
  "thestar.png.jpg",
  "themoon.png.jpg",
  "thesun.png.jpg",
  "judgment.png.jpg",
  "theworld.png.jpg",
];
const MAJOR_FILES_LEGACY = [
  "0_the_fool.jpg",
  "1_the_magician.jpg",
  "2_the_high_priestess.jpg",
  "3_the_empress.jpg",
  "4_the_emperor.jpg",
  "5_the_hierophant.jpg",
  "6_the_lovers.jpg",
  "7_the_chariot.jpg",
  "8_strength.jpg",
  "9_the_hermit.jpg",
  "10_wheel_of_fortune.jpg",
  "11_justice.jpg",
  "12_the_hanged_man.jpg",
  "13_death.jpg",
  "14_temperance.jpg",
  "15_the_devil.jpg",
  "16_the_tower.jpg",
  "17_the_star.jpg",
  "18_the_moon.jpg",
  "19_the_sun.jpg",
  "20_judgement.jpg",
  "21_the_world.jpg",
];
const WANDS_BASES = [
  "ace_of_wands",
  "2_of_wands",
  "3_of_wands",
  "4_of_wands",
  "5_of_wands",
  "6_of_wands",
  "7_of_wands",
  "8_of_wands",
  "9_of_wands",
  "10_of_wands",
  "page_of_wands",
  "knight_of_wands",
  "queen_of_wands",
  "king_of_wands",
];
const WANDS_FILES = WANDS_BASES.flatMap((b) => [`${b}.jpg`, `${b}.png`]);
const CARD_FILENAMES = new Set([...MAJOR_FILES_IN_ROOT, ...MAJOR_FILES_LEGACY, ...WANDS_FILES]);

if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out, { recursive: true });
cpSync(path.join(root, "public"), out, { recursive: true });

const cardsJsonSrc = path.join(root, "cards.json");
if (!existsSync(cardsJsonSrc)) {
  console.error("Missing cards.json at project root.");
  process.exit(1);
}
cpSync(cardsJsonSrc, path.join(out, "cards.json"));

const cardsOut = path.join(out, "cards");
mkdirSync(cardsOut, { recursive: true });
let copied = 0;
for (const name of CARD_FILENAMES) {
  const inRoot = path.join(root, name);
  const inCards = path.join(root, "cards", name);
  const dest = path.join(cardsOut, name);
  if (existsSync(inRoot)) {
    cpSync(inRoot, dest);
    copied++;
  } else if (existsSync(inCards)) {
    cpSync(inCards, dest);
    copied++;
  }
}
console.log(`Copied ${copied} card image file(s) into docs/cards/ (skip missing).`);

writeFileSync(path.join(out, ".nojekyll"), "");

const inject =
  SITE_BASE !== ""
    ? `<script>window.__TAROT_SITE_BASE__=${JSON.stringify(SITE_BASE)};</script>\n    `
    : "";

function patchHtml(filePath) {
  if (!inject) return;
  if (path.basename(filePath) === "404.html") return;
  let html = readFileSync(filePath, "utf8");
  if (html.includes("window.__TAROT_SITE_BASE__=")) return;
  if (!html.includes("<head>")) return;
  html = html.replace("<head>", `<head>\n    ${inject}`);
  writeFileSync(filePath, html);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".html")) patchHtml(p);
  }
}
walk(out);

const four = path.join(out, "404.html");
if (existsSync(four)) {
  let h = readFileSync(four, "utf8");
  h = h.replace(
    `window.__TAROT_404_BASE__ = window.__TAROT_404_BASE__ || "";`,
    SITE_BASE !== ""
      ? `window.__TAROT_404_BASE__ = ${JSON.stringify(SITE_BASE)};`
      : `window.__TAROT_404_BASE__ = "";`
  );
  writeFileSync(four, h);
}

console.log(
  SITE_BASE
    ? `docs/ ready. GitHub Pages base path: ${SITE_BASE}`
    : "docs/ ready. No TAROT_SITE_BASE — use for root-hosted site or set TAROT_SITE_BASE for /repo-name."
);
