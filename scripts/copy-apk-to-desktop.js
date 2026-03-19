#!/usr/bin/env node
/**
 * Copies the built APK to your Desktop for easy access.
 * Run after bubblewrap build, from the bubblewrap project folder, or pass the APK path.
 *
 * Usage:
 *   node scripts/copy-apk-to-desktop.js                    # copy from current dir
 *   node scripts/copy-apk-to-desktop.js path/to/app-release-signed.apk
 */
import { copyFileSync, existsSync } from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const desktop =
  process.platform === "win32"
    ? path.join(process.env.USERPROFILE || os.homedir(), "Desktop")
    : path.join(os.homedir(), "Desktop");

const apkPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(process.cwd(), "app-release-signed.apk");

if (!existsSync(apkPath)) {
  console.error("APK not found at:", apkPath);
  console.error("\nUsage: node scripts/copy-apk-to-desktop.js [path/to/app-release-signed.apk]");
  console.error("Run from the folder where you ran 'bubblewrap build', or pass the APK path.");
  process.exit(1);
}

const dest = path.join(desktop, path.basename(apkPath));
copyFileSync(apkPath, dest);
console.log("Copied to Desktop:", dest);
