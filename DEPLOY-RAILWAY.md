# Deploy this app to Railway — step by step

## 1. Push your code to GitHub (if you haven’t)

Railway deploys from a Git repo. If this project isn’t on GitHub yet:

- Create a new repo on [github.com](https://github.com/new) (e.g. `streamgame` or `tiktok-tarot`).
- In your project folder, run:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
  git push -u origin main
  ```
  Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

---

## 2. New project in Railway

1. Go to [railway.app](https://railway.app) and log in.
2. Click **“New Project”**.
3. Choose **“Deploy from GitHub repo”**.
4. If asked, connect your GitHub account and allow Railway to see your repos.
5. Select the **repo** that contains this app (the one you pushed in step 1).
6. Click **“Deploy now”** or **“Add repository”**. Railway will create a service from that repo.

---

## 3. Let Railway build and run the app

Railway usually detects Node.js and uses something like:

- **Build command:** `npm install` (or leave default).
- **Start command:** `npm start` or `node server.js`.

If you see a **Settings** or **Configure** tab for your service:

- **Root directory:** leave blank (app is at repo root).
- **Build command:** `npm install` (or `npm ci`).
- **Start command:** `npm start`.

Save if there’s a Save button. The first deploy may already be running.

---

## 4. Add environment variables

Your app needs at least `TIKTOK_USERNAME` (and uses `PORT` automatically).

1. In Railway, open your **service** (the one that was created from the repo).
2. Go to the **Variables** tab (or **Settings → Variables**).
3. Click **“Add variable”** or **“New variable”**.
4. Add:

   | Name             | Value                    |
   |------------------|--------------------------|
   | `TIKTOK_USERNAME` | Your TikTok username (e.g. `mortyy_c_137`) |
   | `DEPLOYED_URL`   | Leave empty for now      |

5. **Do not** add `.env` or secrets to the repo; set everything in Railway’s Variables.
6. Save. Railway will redeploy when you change variables.

Optional: after the first deploy, copy your app’s public URL (see step 5) and add it as:

- `DEPLOYED_URL` = `https://your-app.railway.app` (no trailing slash)

so `npm run build-apk` can use it.

---

## 5. Get your app URL

1. In your service, open the **Settings** or **Deployments** tab.
2. Find **“Generate domain”** or **“Public networking”** / **“Add domain”**.
3. Click **“Generate domain”**. Railway will assign a URL like:
   `https://your-app-name.up.railway.app`
4. Copy that URL. That’s your **live app**; open it in a browser to confirm the tarot overlay loads.

---

## 6. Redeploy if needed

If you changed variables or the build/start commands:

- Railway often auto-redeploys on variable change.
- To redeploy manually: **Deployments** tab → **“Redeploy”** on the latest deployment, or push a new commit to the same branch.

---

## 7. Use the URL for the APK

1. In Railway **Variables**, set:
   - `DEPLOYED_URL` = `https://your-app-name.up.railway.app` (the URL from step 5, no trailing slash).
2. In your **local** project, add the same to `.env`:
   ```env
   DEPLOYED_URL=https://your-app-name.up.railway.app
   ```
3. Run **`npm run build-apk`** locally. Your browser will open PWABuilder with that URL; build the Android package and download the APK, then upload it to Google Drive if you like.

---

## Quick checklist

- [ ] Code is on GitHub.
- [ ] New Railway project → Deploy from GitHub repo → this repo.
- [ ] Build: `npm install` (or default). Start: `npm start`.
- [ ] Variables: `TIKTOK_USERNAME` = your TikTok username.
- [ ] Generate domain → copy URL.
- [ ] Set `DEPLOYED_URL` (in Railway and in local `.env`) to that URL for APK builds.

If a step fails, note the exact error message and the step number; that will make it easy to fix.
