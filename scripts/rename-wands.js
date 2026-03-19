/**
 * Rename and copy Wands images from wands_temp/ to project root.
 * Place 14 files in wands_temp/ as 01.jpg, 02.jpg, ... 14.jpg (or .png).
 * Order: Ace, 2, 3, 4, 5, 6, 7, 8, 9, 10, Page, Knight, Queen, King.
 */
import { readdirSync, copyFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const sourceDir = path.join(projectRoot, "wands_temp");

const WANDS_NAMES = [
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

if (!existsSync(sourceDir)) {
  console.error(`Folder not found: ${sourceDir}`);
  console.log("Create wands_temp/ and add 01.jpg … 14.jpg (or .png) in Ace→King order.");
  process.exit(1);
}

const entries = readdirSync(sourceDir, { withFileTypes: true }).filter((e) => e.isFile());
const byNum = {};
for (const e of entries) {
  const m = e.name.match(/^(\d{1,2})(\.\w+)$/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 14) byNum[n] = { name: e.name, ext: m[2] };
  }
}

let done = 0;
for (let i = 1; i <= 14; i++) {
  const info = byNum[i];
  if (!info) {
    console.warn(`Missing: ${String(i).padStart(2, "0")}.*`);
    continue;
  }
  const src = path.join(sourceDir, info.name);
  const destName = WANDS_NAMES[i - 1] + info.ext;
  const dest = path.join(projectRoot, destName);
  copyFileSync(src, dest);
  console.log(`${info.name} → ${destName}`);
  done++;
}

console.log(`Done: ${done}/14 files copied to project root.`);
