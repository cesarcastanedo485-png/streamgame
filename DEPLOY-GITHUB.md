# Deploy static app to GitHub Pages + tunnel + APK

This app can run **free** on GitHub Pages (static HTML/JS). TikTok Live, WebSocket, and deck APIs still need **your computer** running `node server.js` plus a **tunnel** (Cloudflare or ngrok). On your phone, set **Streaming server URL** on the Control page to that tunnel URL.

## 1. One-time: GitHub repo

1. Push this project to GitHub.
2. Build the static site into `docs/` (see below).
3. In the repo: **Settings → Pages → Build and deployment → Source**: **Deploy from a branch**, branch `main`, folder **`/docs`**, Save.
4. Wait for the site at `https://<username>.github.io/<repo>/`.

## 2. Build `docs/` (every time you change the front-end)

If your repo name is `streamgame`, your site lives under `/streamgame/`:

```bash
set TAROT_SITE_BASE=/streamgame
npm run build-static
```

On macOS/Linux:

```bash
TAROT_SITE_BASE=/streamgame npm run build-static
```

- **`TAROT_SITE_BASE`**: must match the repo name (leading `/`, no trailing slash). For a **user site** (`username.github.io` with no repo path), omit `TAROT_SITE_BASE`:

```bash
npm run build-static
```

Then commit and push the `docs/` folder.

The script copies `public/`, `cards.json`, and any matching card images from the project root or `cards/` into `docs/cards/`.

## 3. CORS on your computer

When the app is opened from GitHub Pages, your local server must allow that origin. In `.env` on the machine that runs `server.js`:

```env
CORS_ORIGINS=https://yourusername.github.io
```

Use your real GitHub Pages origin (no path). If you use a custom domain, add `https://yourdomain.com` as well, comma-separated:

```env
CORS_ORIGINS=https://yourusername.github.io,https://yourdomain.com
```

Restart the server after changing `.env`.

## 4. APK (PWABuilder / Bubblewrap)

Point the packaged app at the **GitHub Pages URL**, not the tunnel:

```env
DEPLOYED_URL=https://yourusername.github.io/your-repo
```

Then:

```bash
npm run build-apk
```

Complete the PWABuilder flow and install the APK on your phone.

## 5. Every stream

1. On your PC: set `TIKTOK_USERNAME` in `.env`, run `npm start`.
2. Start a tunnel to port 3000, e.g. Cloudflare quick tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. On your phone: open the app → **Control** → **Streaming server URL** → paste the HTTPS tunnel URL → **Save**.
4. Open **Live** / **The Dex** as needed; they will use the tunnel for API + WebSocket.

## Files added for this flow

| File | Purpose |
|------|---------|
| `public/js/backend-url.js` | `localStorage` streaming server URL; `apiUrl`, `getWebSocketUrl`, `tarotMediaUrl` |
| `public/js/site-base.js` | GitHub subpath `TAROT_BASE_PATH` via `__TAROT_SITE_BASE__` |
| `public/js/link-base.js` | Prefixes `/…` nav links with `TAROT_BASE_PATH` |
| `public/js/static-deck.js` | Default deck rows when no API (static library) |
| `public/404.html` | Maps `/library`, `/spread/yesno`, … to `.html` on GitHub Pages |
| `scripts/build-static.js` | Fills `docs/` for Pages |
| `server.js` | `/cards.json` route; `CORS_ORIGINS` |
