#!/usr/bin/env node
/**
 * Init .env from .env.example if .env doesn't exist.
 * Run: node scripts/init-env.js
 */
import { existsSync, copyFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const envPath = path.join(ROOT, ".env");
const examplePath = path.join(ROOT, ".env.example");

if (!existsSync(envPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log("Created .env from .env.example. Edit .env and set TIKTOK_USERNAME.");
} else if (existsSync(envPath)) {
  console.log(".env already exists.");
} else {
  console.log(".env.example not found. Create .env manually.");
}
