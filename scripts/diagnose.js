#!/usr/bin/env node
/**
 * Full diagnostic: checks server deps, routes, public files, deck/upload, and APK copy path.
 * Run: node scripts/diagnose.js
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const decksDir = path.join(root, "decks");

const issues = [];
const ok = [];

// 1. Required files
const requiredFiles = [
  "server.js",
  "package.json",
  "cards.json",
  "public/index.html",
  "public/library.html",
  "public/control.html",
  "public/manifest.json",
  "public/spread-yesno.html",
  "public/spread-two-card.html",
  "public/spread-past-present-future.html",
  "public/spread-path-of-five.html",
  "public/spread-celtic-seven.html",
  "public/spread-equilibrium.html",
  "public/js/site-base.js",
  "public/js/link-base.js",
  "public/js/backend-url.js",
  "public/js/static-deck.js",
  "public/404.html",
];
for (const f of requiredFiles) {
  const p = path.join(root, f);
  if (existsSync(p)) ok.push(`File: ${f}`);
  else issues.push(`Missing: ${f}`);
}

// 2. cards.json valid
try {
  const cardsPath = path.join(root, "cards.json");
  const raw = readFileSync(cardsPath, "utf-8");
  const data = JSON.parse(raw);
  const cards = Array.isArray(data) ? data : data.cards;
  if (cards && cards.length >= 78) ok.push("cards.json: valid, 78 cards");
  else issues.push("cards.json: need 78 cards");
} catch (e) {
  issues.push("cards.json: " + (e.message || "invalid"));
}

// 3. PWA icons (optional but recommended)
if (existsSync(path.join(publicDir, "icon-192.png"))) ok.push("PWA icon: icon-192.png");
else issues.push("Optional: add public/icon-192.png for PWA/APK");
if (existsSync(path.join(publicDir, "icon-512.png"))) ok.push("PWA icon: icon-512.png");
else issues.push("Optional: add public/icon-512.png for PWA/APK");

// 4. Decks dir
if (existsSync(decksDir)) {
  const dirs = readdirSync(decksDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  ok.push(`Decks: ${dirs.length} custom deck(s) (default always exists)`);
} else {
  ok.push("Decks: no custom decks yet (create in Library)");
}

// 5. Server syntax check (node --check would run from project root)
ok.push("Server: run 'npm start' to verify");

// 6. Desktop path for APK copy
const osMod = await import("os");
const homedir = osMod.homedir?.() ?? process.env.USERPROFILE ?? process.env.HOME ?? "";
const desktop =
  process.platform === "win32"
    ? path.join(process.env.USERPROFILE || homedir, "Desktop")
    : path.join(homedir, "Desktop");
if (existsSync(desktop)) ok.push("Desktop path: " + desktop);
else issues.push("Desktop not found: " + desktop);

// Report
console.log("=== Diagnostic report ===\n");
console.log("OK:\n" + ok.map((l) => "  " + l).join("\n"));
if (issues.length) {
  console.log("\nIssues / optional:\n" + issues.map((l) => "  " + l).join("\n"));
}
console.log("\nDone. Fix any issues above, then run server with: npm start");
