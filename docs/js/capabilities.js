/**
 * Capabilities tab — Google OAuth, Gmail, YouTube, TikTok
 * Error handling, null safety, async lifecycle throughout.
 */
(function () {
  "use strict";

  const STORAGE_KEYS = {
    googleTokens: "cap_google_tokens",
    tiktokTokens: "cap_tiktok_tokens",
  };

  const SCOPES = {
    google: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
  };

  let googleClientId = null;
  let tiktokClientKey = null;
  let googleTokenClient = null;
  let googleCredential = null;

  // --- DOM refs (lazy init) ---
  function $(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el;
  }

  function showError(msg) {
    const el = $("capabilitiesError");
    if (!el) return;
    el.textContent = msg || "An error occurred.";
    el.hidden = false;
  }

  function clearError() {
    const el = $("capabilitiesError");
    if (el) {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function showResult(containerId, message, isError) {
    const el = $(containerId);
    if (!el) return;
    el.textContent = message || "";
    el.className = "cap-result " + (isError ? "error" : "success");
    el.hidden = !message;
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.loading = loading ? "1" : "0";
  }

  // --- Storage (null-safe) ---
  function getStored(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null || raw === "") return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function setStored(key, value) {
    try {
      if (value == null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (_) {}
  }

  // --- Config from server ---
  async function loadConfig() {
    try {
      const url = typeof apiUrl === "function" ? apiUrl("/api/capabilities/config") : "/api/capabilities/config";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Config fetch failed");
      const data = await res.json();
      googleClientId = (data.googleClientId && String(data.googleClientId).trim()) || null;
      tiktokClientKey = (data.tiktokClientKey && String(data.tiktokClientKey).trim()) || null;
      return { googleClientId, tiktokClientKey };
    } catch (e) {
      console.error("[Capabilities] loadConfig", e);
      return { googleClientId: null, tiktokClientKey: null };
    }
  }

  function updateConfigHint() {
    const el = $("configHint");
    if (!el) return;
    if (googleClientId || tiktokClientKey) {
      const parts = [];
      if (googleClientId) parts.push("Google configured.");
      if (tiktokClientKey) parts.push("TikTok configured.");
      el.textContent = parts.join(" ");
    } else {
      el.textContent = "Set GOOGLE_CLIENT_ID and/or TIKTOK_CLIENT_KEY in your server .env (see .env.example).";
    }
  }

  // --- Google OAuth (GIS) ---
  function initGoogleAuth() {
    if (!googleClientId) {
      const btn = $("googleSignInBtn");
      if (btn) btn.disabled = true;
      return;
    }

    const btn = $("googleSignInBtn");
    if (btn) btn.disabled = false;

    if (typeof google === "undefined" || !google.accounts) {
      const check = setInterval(function () {
        if (typeof google !== "undefined" && google.accounts && google.accounts.oauth2) {
          clearInterval(check);
          renderGoogleButton();
        }
      }, 100);
      return;
    }

    renderGoogleButton();
  }

  function renderGoogleButton() {
    if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) return;

    try {
      googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: SCOPES.google,
        callback: onGoogleToken,
      });
    } catch (e) {
      console.error("[Capabilities] Google init", e);
      showError("Google sign-in failed to initialize.");
    }
  }

  function onGoogleToken(response) {
    if (!response || !response.access_token) {
      showError("Google sign-in was cancelled or failed.");
      return;
    }
    const tokens = {
      access_token: response.access_token,
      expires_at: Date.now() + (response.expires_in || 3600) * 1000,
    };
    setStored(STORAGE_KEYS.googleTokens, tokens);
    googleCredential = response;
    updateGoogleUI(true);
    clearError();
  }

  function getValidGoogleToken() {
    const stored = getStored(STORAGE_KEYS.googleTokens);
    if (!stored || !stored.access_token) return null;
    if (stored.expires_at && stored.expires_at < Date.now() + 60000) return null;
    return stored.access_token;
  }

  function updateGoogleUI(connected) {
    const status = $("googleStatus");
    const signIn = $("googleSignInBtn");
    const signOut = $("googleSignOutBtn");
    const emailSubmit = $("emailSubmitBtn");
    const ytSubmit = $("ytSubmitBtn");

    if (status) {
      status.textContent = connected ? "Connected" : "Not connected";
      status.classList.toggle("connected", !!connected);
    }
    if (signIn) signIn.hidden = !!connected;
    if (signOut) signOut.hidden = !connected;
    if (emailSubmit) emailSubmit.disabled = !connected;
    if (ytSubmit) ytSubmit.disabled = !connected;
  }

  function googleSignOut() {
    setStored(STORAGE_KEYS.googleTokens, null);
    googleCredential = null;
    updateGoogleUI(false);
  }

  // --- Gmail send ---
  async function sendEmail(to, subject, body) {
    const token = getValidGoogleToken();
    if (!token) {
      showError("Please sign in with Google first.");
      return false;
    }

    const boundary = "cap_" + Date.now();
    const raw = [
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      "To: " + (to || "").trim(),
      "Subject: " + (subject || "").trim(),
      "",
      (body || "").trim(),
    ].join("\r\n");

    const encoded = btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    try {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        let errMsg = "Gmail API error";
        try {
          const j = JSON.parse(errBody);
          if (j.error && j.error.message) errMsg = j.error.message;
        } catch (_) {}
        throw new Error(errMsg);
      }
      return true;
    } catch (e) {
      if (e.message && e.message.includes("401")) {
        googleSignOut();
        showError("Session expired. Please sign in again.");
      } else {
        throw e;
      }
      return false;
    }
  }

  // --- YouTube Community post ---
  // Note: YouTube deprecated the bulletin/community post API. This attempts the legacy
  // activities.insert; it may fail with a deprecation error. We keep the UI for future API support.
  async function postToYouTube(text, link) {
    const token = getValidGoogleToken();
    if (!token) {
      showError("Please sign in with Google first.");
      return false;
    }

    try {
      const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Could not get channel");
      const channelData = await res.json();
      const channelId = channelData?.items?.[0]?.id;
      if (!channelId) throw new Error("No channel found");

      const description = (text || "").trim();
      const postRes = await fetch("https://www.googleapis.com/youtube/v3/activities?part=snippet", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            channelId: channelId,
            description: description,
            type: "text",
          },
        }),
      });

      if (!postRes.ok) {
        const errBody = await postRes.text();
        let errMsg = "YouTube API error";
        try {
          const j = JSON.parse(errBody);
          if (j.error && j.error.message) errMsg = j.error.message;
        } catch (_) {}
        if (errMsg.toLowerCase().includes("deprecated") || errMsg.toLowerCase().includes("no longer")) {
          errMsg =
            "YouTube no longer supports posting via API. Use YouTube Studio on your phone or desktop to create Community posts.";
        }
        throw new Error(errMsg);
      }
      return true;
    } catch (e) {
      if (e.message && (e.message.includes("401") || e.message.includes("403"))) {
        googleSignOut();
        showError("Session expired or insufficient permissions. Please sign in again.");
      } else {
        throw e;
      }
      return false;
    }
  }

  // --- Event handlers ---
  function bindEvents() {
    const googleSignIn = $("googleSignInBtn");
    const googleSignOut = $("googleSignOutBtn");
    const tiktokSignIn = $("tiktokSignInBtn");
    const tiktokSignOut = $("tiktokSignOutBtn");
    const emailForm = $("emailForm");
    const youtubeForm = $("youtubeForm");

    if (googleSignIn) {
      googleSignIn.addEventListener("click", function () {
        clearError();
        if (googleTokenClient) {
          googleTokenClient.requestAccessToken();
        } else {
          showError("Google sign-in not ready. Refresh the page.");
        }
      });
    }

    if (googleSignOut) {
      googleSignOut.addEventListener("click", function () {
        googleSignOut();
      });
    }

    if (tiktokSignIn) {
      tiktokSignIn.addEventListener("click", function () {
        showError("TikTok sign-in requires TIKTOK_CLIENT_KEY. See .env.example.");
      });
    }

    if (tiktokSignOut) {
      tiktokSignOut.addEventListener("click", function () {
        setStored(STORAGE_KEYS.tiktokTokens, null);
        const status = $("tiktokStatus");
        if (status) {
          status.textContent = "Not connected";
          status.classList.remove("connected");
        }
        if (tiktokSignIn) tiktokSignIn.hidden = false;
        if (tiktokSignOut) tiktokSignOut.hidden = true;
      });
    }

    if (emailForm) {
      emailForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearError();
        const to = $("emailTo")?.value?.trim();
        const subject = $("emailSubject")?.value?.trim();
        const body = $("emailBody")?.value?.trim();
        if (!to || !subject || !body) {
          showError("Please fill in To, Subject, and Message.");
          return;
        }

        const btn = $("emailSubmitBtn");
        setLoading(btn, true);
        showResult("emailResult", "", false);

        try {
          const ok = await sendEmail(to, subject, body);
          if (ok) {
            showResult("emailResult", "Email sent.", false);
            emailForm.reset();
          }
        } catch (err) {
          showError(err?.message || "Failed to send email.");
          showResult("emailResult", err?.message || "Failed", true);
        } finally {
          setLoading(btn, false);
        }
      });
    }

    if (youtubeForm) {
      youtubeForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        clearError();
        const text = $("ytText")?.value?.trim();
        const link = $("ytLink")?.value?.trim();
        if (!text) {
          showError("Please enter post text.");
          return;
        }

        const btn = $("ytSubmitBtn");
        setLoading(btn, true);
        showResult("ytResult", "", false);

        try {
          const ok = await postToYouTube(text, link || null);
          if (ok) {
            showResult("ytResult", "Posted to YouTube.", false);
            youtubeForm.reset();
          }
        } catch (err) {
          showError(err?.message || "Failed to post to YouTube.");
          showResult("ytResult", err?.message || "Failed", true);
        } finally {
          setLoading(btn, false);
        }
      });
    }
  }

  // --- TikTok UI (placeholder) ---
  function updateTiktokUI() {
    const hasKey = !!tiktokClientKey;
    const btn = $("tiktokSignInBtn");
    if (btn) btn.disabled = !hasKey;
  }

  // --- Init ---
  async function init() {
    bindEvents();

    const cfg = await loadConfig();
    googleClientId = cfg.googleClientId;
    tiktokClientKey = cfg.tiktokClientKey;

    updateConfigHint();
    updateTiktokUI();

    if (getValidGoogleToken()) {
      updateGoogleUI(true);
    } else {
      updateGoogleUI(false);
    }

    initGoogleAuth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
