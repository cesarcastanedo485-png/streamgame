#!/usr/bin/env node
/**
 * Setup check — validates project structure and config.
 * Run: node scripts/setup-check.js
 */
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const checks = [];
let hasErrors = false;

function ok(msg) {
  checks.push({ ok: true, msg });
}
function fail(msg) {
  checks.push({ ok: false, msg });
  hasErrors = true;
}

// Required files
if (existsSync(path.join(ROOT, "server.js"))) ok("server.js exists");
else fail("server.js missing");

if (existsSync(path.join(ROOT, "package.json"))) ok("package.json exists");
else fail("package.json missing");

if (existsSync(path.join(ROOT, "docs"))) ok("docs/ exists");
else fail("docs/ missing");

if (existsSync(path.join(ROOT, "docs", "index.html"))) ok("docs/index.html exists");
else fail("docs/index.html missing");

if (existsSync(path.join(ROOT, "docs", "capabilities.html"))) ok("docs/capabilities.html exists");
else fail("docs/capabilities.html missing");

// .env
if (existsSync(path.join(ROOT, ".env"))) {
  ok(".env exists");
  const env = readFileSync(path.join(ROOT, ".env"), "utf-8");
  if (env.includes("TIKTOK_USERNAME=") && !env.includes("your_tiktok_username_here")) {
    ok("TIKTOK_USERNAME appears configured");
  } else {
    checks.push({ ok: false, msg: "TIKTOK_USERNAME not set in .env (use your TikTok username)" });
  }
} else {
  fail(".env missing — copy from .env.example and fill in TIKTOK_USERNAME");
}

// node_modules
if (existsSync(path.join(ROOT, "node_modules", "express"))) ok("express installed");
else fail("Run npm install");

// cards.json
if (existsSync(path.join(ROOT, "cards.json"))) ok("cards.json exists");
else fail("cards.json missing");

console.log("\n--- Setup check ---\n");
checks.forEach((c) => {
  console.log(c.ok ? "  ✓" : "  ✗", c.msg);
});
console.log("");
if (hasErrors) {
  console.log("Fix the issues above, then run: npm start\n");
  process.exit(1);
}
console.log("Ready. Run: npm start\n");
