# Capabilities Tab — Setup Guide

The **Capabilities** tab lets you connect Google and TikTok accounts to send emails, post to YouTube, and (when configured) use TikTok from your phone.

## 1. Google (Gmail + YouTube)

### Create OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. If prompted, configure the **OAuth consent screen**:
   - User type: **External** (or Internal for workspace)
   - Add scopes: `gmail.send`, `youtube.force-ssl`, `userinfo.email`, `userinfo.profile`
5. Application type: **Web application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (local dev)
   - Your deployed URL, e.g. `https://your-app.up.railway.app`
   - GitHub Pages URL if you use it, e.g. `https://youruser.github.io`
7. Add **Authorized redirect URIs** (same origins)
8. Copy the **Client ID**

### Configure your server

Add to `.env`:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

For Railway: add the same variable in **Variables**.

### What works

- **Gmail** — Send emails from your connected account
- **YouTube** — Community posting was deprecated by YouTube; the form may show an error. Use YouTube Studio on your phone for Community posts.

## 2. TikTok

TikTok posting requires a [TikTok for Developers](https://developers.tiktok.com/) app.

1. Create an app in the TikTok Developer Portal
2. Enable **Login Kit** (and **Content Posting API** if available)
3. Add your app’s redirect URI
4. Copy the **Client Key**

Add to `.env`:

```
TIKTOK_CLIENT_KEY=your-tiktok-client-key
```

The Capabilities tab will show a TikTok sign-in button when `TIKTOK_CLIENT_KEY` is set. Full video posting may require additional API access.

## 3. CORS (when app and server are on different domains)

If your app is on GitHub Pages and your server is on Railway:

1. In Railway **Variables**, set:
   ```
   CORS_ORIGINS=https://youruser.github.io
   ```
2. In the app, open **Control** and set **Streaming server URL** to your Railway URL

The Capabilities tab will then fetch config and use your backend.

## 4. Security notes

- OAuth tokens are stored in `localStorage` on your device
- Sign out when using a shared device
- `GOOGLE_CLIENT_ID` and `TIKTOK_CLIENT_KEY` are **not** secret (they’re in the browser), but keep your server URL and any API secrets private
