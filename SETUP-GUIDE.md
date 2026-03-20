# Step-by-Step Setup Guide — TikTok Tarot Overlay

This guide tells you **exactly what to do** and **what is automated**. Follow in order.

---

## Part A: Run the app locally (quick test)

### YOU DO

1. Open a terminal in the project folder (`C:\Users\cmc\Desktop\streamgame`).
2. Run:
   ```bash
   npm install
   npm run init-env
   npm run setup-check
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### I AUTOMATE

- `npm run init-env` — Creates `.env` from `.env.example` if `.env` doesn't exist.
- `npm run setup-check` — Validates project structure (server, docs, cards.json, node_modules).
- Server uses `docs/` when `public/` is missing (already done).
- All routes and static files are configured (already done).

---

## Part B: TikTok Live connection (for stream overlay)

### YOU DO

1. Create a `.env` file in the project root (copy from `.env.example`).
2. Go to [TikTok](https://www.tiktok.com/) and note your **username** (e.g. `@yourname` → use `yourname`).
3. In `.env`, set:
   ```
   TIKTOK_USERNAME=your_tiktok_username
   ```
4. Restart the server (`npm start`).

### I AUTOMATE

- `.env.example` already has `TIKTOK_USERNAME` (already done).

---

## Part C: Deploy to Railway (for live URL + APK)

### YOU DO

1. Push your code to GitHub (if not already):
   - Go to [GitHub — New repository](https://github.com/new).
   - Create a repo (e.g. `tiktok-tarot`).
   - In your project folder, run:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```

2. Deploy on Railway:
   - Go to [Railway](https://railway.app/).
   - Sign in → **New Project** → **Deploy from GitHub repo**.
   - Select your repo → **Deploy**.

3. Add variables in Railway:
   - Open your service → **Variables**.
   - Add:
     - `TIKTOK_USERNAME` = your TikTok username
     - (Optional) `DEPLOYED_URL` = your Railway URL (e.g. `https://your-app.up.railway.app`)

4. Get your live URL:
   - In Railway: **Settings** → **Generate domain**.
   - Copy the URL (e.g. `https://your-app.up.railway.app`).

### I AUTOMATE

- `npm run deploy` can push updates (see `DEPLOY-RAILWAY.md`).

---

## Part D: Capabilities tab — Google (Gmail + YouTube)

### YOU DO

1. **Create a Google Cloud project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Click **Select a project** → **New Project**.
   - Name it (e.g. "Tarot App") → **Create**.

2. **Configure OAuth consent screen**
   - Go to [APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
   - User type: **External** → **Create**.
   - App name: e.g. "TikTok Tarot".
   - User support email: your email.
   - Developer contact: your email.
   - **Save and Continue**.
   - **Add or remove scopes** → Add:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - **Save and Continue** → **Back to dashboard**.

3. **Create OAuth client ID**
   - Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
   - **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: e.g. "Tarot Web".
   - **Authorized JavaScript origins** — Add:
     - `http://localhost:3000`
     - Your Railway URL, e.g. `https://your-app.up.railway.app`
     - (If using GitHub Pages) `https://youruser.github.io`
   - **Authorized redirect URIs** — Add the same URLs.
   - **Create**.
   - Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`).

4. **Add Client ID to your app**
   - In `.env` (local):
     ```
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     ```
   - In Railway **Variables**:
     - Add `GOOGLE_CLIENT_ID` = your Client ID.

5. **Restart / redeploy**
   - Local: restart `npm start`.
   - Railway: push a commit or redeploy.

6. **Test**
   - Open your app → **Capabilities** tab.
   - Click **Sign in with Google**.
   - Sign in and approve.
   - Try **Send email** (Gmail).

### I AUTOMATE

- Capabilities page, OAuth flow, and Gmail send logic (already done).
- `/api/capabilities/config` serves the Client ID to the frontend (already done).

---

## Part E: Capabilities tab — TikTok (optional)

### YOU DO

1. Go to [TikTok for Developers](https://developers.tiktok.com/).
2. Create an app and enable **Login Kit**.
3. Copy the **Client Key**.
4. Add to `.env` and Railway:
   ```
   TIKTOK_CLIENT_KEY=your-tiktok-client-key
   ```

### I AUTOMATE

- TikTok sign-in button appears when `TIKTOK_CLIENT_KEY` is set (already done).
- Full video posting requires additional TikTok API access (manual setup).

---

## Part F: GitHub Pages (optional — static hosting)

### YOU DO

1. In your GitHub repo: **Settings** → **Pages**.
2. Source: **Deploy from a branch**.
3. Branch: `main`, folder: `/docs`.
4. Save.
5. Your app will be at `https://youruser.github.io/your-repo/`.

6. **Set backend URL in the app**
   - Open your GitHub Pages URL.
   - Go to **Control** tab.
   - Paste your Railway URL in **Streaming server URL**.
   - Click **Save**.

### I AUTOMATE

- `docs/` is the static output (already done).
- `404.html` handles pretty URLs (already done).

---

## Part G: Build APK (install on phone)

### YOU DO

1. Ensure `DEPLOYED_URL` is set in `.env` (your Railway or GitHub Pages URL).
2. Run:
   ```bash
   npm run build-apk
   ```
3. Your browser opens [PWABuilder](https://www.pwabuilder.com/).
4. On PWABuilder:
   - **Package for stores** → **Android**.
   - Build and **Download** the APK.
5. Upload the APK to [Google Drive](https://drive.google.com/).
6. On your phone: open the Drive link → download → install.

### I AUTOMATE

- `build-apk` script opens PWABuilder with your URL (already done).

---

## Part H: Mordechaius Maximus — AI Chat

### YOU DO

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys).
2. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key
   ```
3. Restart the server.
4. Open **Mordechaius Maximus** tab — chat with voice input, agent selection, Ask/Plan mode.

### I AUTOMATE

- Mordechaius Maximus UI, mic, agent selector, mode toggle, Keep all / Undo all (already done).
- Chat API at `/api/mordecai/chat` (already done).

---

## Quick reference — links

| Step | Link |
|------|------|
| Google Cloud Console | https://console.cloud.google.com/ |
| OAuth consent screen | https://console.cloud.google.com/apis/credentials/consent |
| OAuth credentials | https://console.cloud.google.com/apis/credentials |
| TikTok for Developers | https://developers.tiktok.com/ |
| Railway | https://railway.app/ |
| GitHub new repo | https://github.com/new |
| PWABuilder | https://www.pwabuilder.com/ |
| Google Drive | https://drive.google.com/ |
| OpenAI API keys | https://platform.openai.com/api-keys |

---

## Troubleshooting

- **Live tab shows "Disconnected"** — Set Streaming server URL in Control to your Railway URL (or use same origin).
- **Capabilities "Sign in with Google" disabled** — Add `GOOGLE_CLIENT_ID` to `.env` and restart.
- **CORS errors** — Add your app origin to `CORS_ORIGINS` in Railway Variables (e.g. `https://youruser.github.io`).
