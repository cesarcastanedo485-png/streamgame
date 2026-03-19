#!/usr/bin/env node
/**
 * Copies the latest APK to your Desktop — no path needed.
 * 1. If twa-build/app-release-signed.apk exists (Bubblewrap build), use that.
 * 2. Else find the newest .apk in your Downloads folder and copy it.
 * Run after downloading from PWABuilder or after bubblewrap build.
 * Usage: npm run apk-to-desktop
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const desktop =
  process.platform === "win32"
    ? path.join(process.env.USERPROFILE || process.env.HOME || "", "Desktop")
    : path.join(process.env.HOME || "", "Desktop");

const downloads =
  process.platform === "win32"
    ? path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads")
    : path.join(process.env.HOME || "", "Downloads");

const twaApk = path.join(root, "twa-build", "app-release-signed.apk");

function findNewestApk(dir) {
  if (!existsSync(dir)) return null;
  let newest = null;
  let newestTime = 0;
  try {
    for (const name of readdirSync(dir)) {
      if (!name.toLowerCase().endsWith(".apk")) continue;
      const full = path.join(dir, name);
      try {
        const stat = statSync(full);
        if (stat.isFile() && stat.mtimeMs > newestTime) {
          newestTime = stat.mtimeMs;
          newest = full;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return newest;
}

let source = null;
if (existsSync(twaApk)) {
  source = twaApk;
  console.log("Using APK from twa-build (Bubblewrap).");
} else if (existsSync(downloads)) {
  source = findNewestApk(downloads);
  if (source) console.log("Using newest APK from Downloads:", path.basename(source));
}

if (!source) {
  console.error("No APK found.");
  console.error("  - Run bubblewrap build in twa-build/, or");
  console.error("  - Download the APK from PWABuilder (npm run build-apk), then run this again.");
  process.exit(1);
}

const dest = path.join(desktop, "streamgame.apk");
copyFileSync(source, dest);
console.log("Copied to Desktop:", dest);
