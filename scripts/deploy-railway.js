#!/usr/bin/env node
/**
 * Stage all changes, commit (if needed), and push to origin.
 * Railway redeploys automatically when your connected GitHub branch updates.
 *
 * Usage:
 *   npm run deploy -- "Your commit message"
 *   npm run deploy                    (uses a timestamp message)
 */
import { spawnSync, execSync } from "node:child_process";
import process from "node:process";

const cwd = process.cwd();

function git(args, inherit = true) {
  const r = spawnSync("git", args, {
    cwd,
    stdio: inherit ? "inherit" : "pipe",
    encoding: "utf8",
  });
  const code = r.status ?? 1;
  if (code !== 0) process.exit(code);
}

function isGitRepo() {
  const r = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd,
    stdio: "pipe",
  });
  return r.status === 0 && String(r.stdout || "").trim() === "true";
}

function hasUncommittedChanges() {
  const r = spawnSync("git", ["status", "--porcelain"], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
  });
  return Boolean((r.stdout || "").trim());
}

function currentBranch() {
  const r = spawnSync("git", ["branch", "--show-current"], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
  });
  return (r.stdout || "").trim() || "main";
}

function main() {
  if (!isGitRepo()) {
    console.error(
      "Not a git repository. From this folder run:\n  git init\n  git remote add origin https://github.com/YOU/REPO.git\n  git branch -M main\n  git push -u origin main"
    );
    process.exit(1);
  }

  const message =
    process.argv
      .slice(2)
      .join(" ")
      .trim() || `Deploy ${new Date().toISOString().replace("T", " ").slice(0, 19)}`;

  const branch = currentBranch();
  console.log(`Branch: ${branch}`);

  if (hasUncommittedChanges()) {
    console.log("Staging all changes…");
    git(["add", "-A"]);
    console.log(`Committing: ${message}`);
    git(["commit", "-m", message]);
  } else {
    console.log("No uncommitted changes — pushing existing commits only.");
  }

  console.log(`Pushing to origin ${branch}…`);
  git(["push", "-u", "origin", branch]);

  console.log("\nDone. Open Railway → Deployments and wait for the new build to finish.");
}

main();
