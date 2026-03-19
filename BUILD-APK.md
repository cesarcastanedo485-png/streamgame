# Build Android APK — one command, then upload to Google Drive

The app is a **Node.js server**. The APK is a **wrapper** that opens your **deployed** site in fullscreen. Deploy once to HTTPS, then use one command to open the builder and (optionally) build locally and copy the APK to your Desktop.

---

## One-command flow (automated)

1. **Deploy the app** to HTTPS (Railway, Render, Fly.io, VPS, etc.). Note the URL, e.g. `https://your-app.railway.app`.

2. **Set your live URL** in `.env`:
   ```bash
   DEPLOYED_URL=https://your-app.railway.app
   ```
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

1. **Redeploy** the app (so the live URL has the new code).
2. Run **`npm run build-apk`** again (PWABuilder will use the new site; or Bubblewrap will wrap the updated URL).
3. Download the new APK (from PWABuilder or from Desktop if you use local build), then upload the new APK to Google Drive so the link points to the latest version.

---

## Summary

| What you do | Result |
|-------------|--------|
| Set `DEPLOYED_URL` in `.env` | Script knows where your app lives. |
| Run `npm run build-apk` | Browser opens PWABuilder; optional local build + copy to Desktop. |
| On PWABuilder: Package → Android → Download | You get the APK file. |
| Upload APK to Google Drive | One place to download on any device. |
| On phone: open Drive link → download APK → install | App installed; open it to use your live site. |
