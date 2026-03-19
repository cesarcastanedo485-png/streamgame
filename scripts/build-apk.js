#!/usr/bin/env node
/**
 * One-command APK flow:
 * 1. Opens PWABuilder in your browser with your app URL → build in cloud, download APK, upload to Drive.
 * 2. If you already ran "bubblewrap init" once (twa-build folder exists), runs "bubblewrap build" and copies APK to Desktop.
 *
 * Set DEPLOYED_URL in .env to your live HTTPS app URL (e.g. https://your-app.railway.app).
 * Run: npm run build-apk
 */
import { existsSync, copyFileSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

// Load .env — prefer .env file over inherited env so local URL always wins
let DEPLOYED_URL = (process.env.DEPLOYED_URL || "").replace(/\/$/, "");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  const m = content.match(/DEPLOYED_URL=(.+)/m);
  if (m) {
    const fromFile = m[1].trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
    if (fromFile) DEPLOYED_URL = fromFile;
  }
}
if (!DEPLOYED_URL) {
  try {
    require("dotenv").config({ path: envPath });
    DEPLOYED_URL = (process.env.DEPLOYED_URL || "").replace(/\/$/, "");
  } catch (_) {}
}
const twaDir = path.join(root, "twa-build");
const apkPath = path.join(twaDir, "app-release-signed.apk");

const desktop =
  process.platform === "win32"
    ? path.join(process.env.USERPROFILE || process.env.HOME || "", "Desktop")
    : path.join(process.env.HOME || "", "Desktop");

function openBrowser(url) {
  const start =
    process.platform === "win32"
      ? "start"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  spawn(start, [url], { shell: true, stdio: "ignore" });
}

function runBubblewrapBuild() {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (process.env.BUBBLEWRAP_KEYSTORE_PASSWORD)
      env.BUBBLEWRAP_KEYSTORE_PASSWORD = process.env.BUBBLEWRAP_KEYSTORE_PASSWORD;
    if (process.env.BUBBLEWRAP_KEY_PASSWORD)
      env.BUBBLEWRAP_KEY_PASSWORD = process.env.BUBBLEWRAP_KEY_PASSWORD;

    const child = spawn("bubblewrap", ["build"], {
      cwd: twaDir,
      env,
      shell: true,
      stdio: "inherit",
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error("bubblewrap build exited " + code))));
    child.on("error", (err) => reject(err));
  });
}

async function main() {
  if (!DEPLOYED_URL) {
    console.log(`
One-command APK build needs your live app URL.

1. Deploy this app to HTTPS (Railway, Render, Fly.io, etc.).
2. In the project root, copy .env.example to .env if needed, then set:

   DEPLOYED_URL=https://your-app.railway.app

   (no trailing slash)

3. Run again:

   npm run build-apk

Then:
- Your browser will open PWABuilder with your URL. Click "Package for stores" → Android → build and download the APK. Upload that to Google Drive.
- If you already ran "bubblewrap init" once in this project (so twa-build/ exists), the script will also run "bubblewrap build" and copy the APK to your Desktop.
`);
    process.exit(1);
  }

  const manifestUrl = `${DEPLOYED_URL}/manifest.json`;
  const pwabuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(DEPLOYED_URL)}`;

  console.log("DEPLOYED_URL:", DEPLOYED_URL);
  console.log("Opening PWABuilder in browser — build your PWA there and download the APK.\n");
  console.log("After you download the APK, run:  npm run apk-to-desktop");
  console.log("(That copies the newest APK from Downloads to your Desktop as streamgame.apk)\n");
  openBrowser(pwabuilderUrl);

  if (existsSync(path.join(twaDir, "twa-manifest.json"))) {
    console.log("twa-build/ found. Running bubblewrap build...\n");
    try {
      await runBubblewrapBuild();
      if (existsSync(apkPath)) {
        const dest = path.join(desktop, "app-release-signed.apk");
        copyFileSync(apkPath, dest);
        console.log("\nAPK copied to Desktop:", dest);
      }
    } catch (e) {
      console.error("Bubblewrap build failed:", e.message);
      console.log("Use the PWABuilder tab that opened to build and download the APK instead.");
    }
  } else {
    console.log(`
To also build the APK locally and copy to Desktop:
  1. Install Bubblewrap: npm i -g @bubblewrap/cli
  2. Run once: bubblewrap init --manifest ${manifestUrl} --directory twa-build
  3. Run again: npm run build-apk

Optional: set BUBBLEWRAP_KEYSTORE_PASSWORD and BUBBLEWRAP_KEY_PASSWORD in .env for non-interactive build.
`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
