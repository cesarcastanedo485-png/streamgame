# Build Android APK — one command, then upload to Google Drive

The app is a **Node.js server**. The APK is a **wrapper** that opens your **deployed** site in fullscreen. Deploy once to HTTPS, then use one command to open the builder and (optionally) build locally and copy the APK to your Desktop.

### Already have Streamgame installed on your phone?

You usually **do not need a new APK** for UI or feature updates.

- The APK opens your **live URL** (e.g. Railway). When you **push new code and redeploy**, the next time you open the app it loads that updated site—same icon, same install.
- **Fully close the app** (swipe it away from recents) and open it again if something looks cached. On Android you can also **clear cache** for the app in system settings if needed.
- Build and install a **new APK only** if you change something **native** (different start URL/domain, new Android package name, or you want a fresh wrapper from PWABuilder for another reason).

---

## One-command flow (automated)

1. **Deploy the app** to HTTPS (Railway, Render, Fly.io, VPS, **or GitHub Pages** from `docs/`). Note the URL, e.g. `https://your-app.railway.app` or `https://youruser.github.io/your-repo`.

2. **Set your live URL** in `.env`:
   ```bash
   DEPLOYED_URL=https://your-app.railway.app
   ```
   For GitHub Pages static hosting, use your Pages URL (no trailing slash). You still set **Streaming server URL** in the app (Control) to your tunnel when streaming — see [DEPLOY-GITHUB.md](DEPLOY-GITHUB.md).
   (No trailing slash. Copy from `.env.example` if needed.)

3. **Run:**
   ```bash
   npm run build-apk
   ```

4. **What happens:**
   - Your **browser opens PWABuilder** with your app URL. On that page: **Package for stores** → **Android** → build and **download the APK**. No Android Studio or Java needed.
   - **Upload** the downloaded APK to [Google Drive](https://drive.google.com). Share the link if you want others to install.
   - **Download** on your phone from that Drive link and install.

5. **Optional — local build + Desktop copy:**  
   If you want the APK built locally and copied to your Desktop in one go:
   - Install Bubblewrap once: `npm i -g @bubblewrap/cli`
   - Run once: `bubblewrap init --manifest https://YOUR-DEPLOYED-URL/manifest.json --directory twa-build` (answer the prompts).
   - Then every time: `npm run build-apk` — the script will also run `bubblewrap build` and copy `app-release-signed.apk` to your Desktop.

So after the first setup: **set `DEPLOYED_URL` → run `npm run build-apk` → use the opened PWABuilder to download (or get the APK on Desktop if you use Bubblewrap) → upload to Drive → download on phone.**

---

## Manual / alternative: Bubblewrap only

If you prefer not to use PWABuilder:

1. Deploy the app to HTTPS.
2. `npm i -g @bubblewrap/cli`
3. `bubblewrap init --manifest https://YOUR-URL/manifest.json` (creates a folder; follow prompts).
4. `cd <that folder>` → `bubblewrap build` (use `BUBBLEWRAP_KEYSTORE_PASSWORD` and `BUBBLEWRAP_KEY_PASSWORD` in `.env` for non-interactive build).
5. Copy APK to Desktop: from that folder run  
   `node path/to/streamgame/scripts/copy-apk-to-desktop.js`  
   or from project: `npm run copy-apk-to-desktop -- path/to/folder/app-release-signed.apk`.

---

## Upload + Google Lens (in the app)

- **Tap:** Library → create a deck → tap a card slot → choose image (camera, gallery, or a photo saved from Google Lens).
- **Drag and drop:** Drag an image onto a card slot (desktop).
- **Google Lens:** Scan a card with Lens → save to device → in the app tap a slot → choose that photo.

Supported: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.

---

## After code changes

1. **Redeploy** the app (Railway / your host) so the live URL serves the new `public/` files and `server.js`.
2. **That’s the update** for phones that already have the Streamgame APK—open the app (or force-close and reopen).

Only if you need a **new APK file** (rare): run `npm run build-apk` again, download from PWABuilder (or Bubblewrap), then install over the old app—same package usually updates in place.

---

## Summary

| What you do | Result |
|-------------|--------|
| Set `DEPLOYED_URL` in `.env` | Script knows where your app lives. |
| Run `npm run build-apk` | Browser opens PWABuilder; optional local build + copy to Desktop. |
| On PWABuilder: Package → Android → Download | You get the APK file. |
| Upload APK to Google Drive | One place to download on any device. |
| On phone: open Drive link → download APK → install | App installed; open it to use your live site. |
