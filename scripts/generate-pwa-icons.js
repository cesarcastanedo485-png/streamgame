#!/usr/bin/env node
/**
 * Writes placeholder PWA icons (1x1 PNG) so manifest.json doesn't 404.
 * Replace public/icon-192.png and public/icon-512.png with real 192x192 and 512x512 icons for store/APK.
 */
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

// Smallest valid 1x1 transparent PNG (68 bytes)
const minimalPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
  "base64"
);

writeFileSync(path.join(publicDir, "icon-192.png"), minimalPng);
writeFileSync(path.join(publicDir, "icon-512.png"), minimalPng);
console.log("Created public/icon-192.png and public/icon-512.png (placeholders). Replace with real icons for store/APK.");
