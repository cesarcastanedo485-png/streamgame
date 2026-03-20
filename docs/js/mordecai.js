/**
 * Mordechaius Maximus — Cursor-inspired chat
 * Microphone, agent selection, Keep all / Undo all, Planning vs Ask mode
 */
(function () {
  "use strict";

  const STORAGE_KEY = "mordecai_chats";
  const STORAGE_CURRENT = "mordecai_current_chat";

  let currentChatId = null;
  let chats = {};
  let pendingChanges = [];
  let isRecording = false;
  let recognition = null;

  function $(id) {
    return document.getElementById(id);
  }

  function showStatusEl(msg, duration) {
    const statusEl = $("mordecaiStatus");
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.hidden = !msg;
    if (duration && msg) {
      setTimeout(function () {
        statusEl.hidden = true;
        statusEl.textContent = "";
      }, duration);
    }
  }

  function loadChats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      chats = raw ? JSON.parse(raw) : {};
    } catch (_) {
      chats = {};
    }
  }

  function saveChats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (_) {}
  }

  function createChat() {
    const id = "chat_" + Date.now();
    chats[id] = { id, messages: [], createdAt: Date.now(), title: "New chat" };
    saveChats();
    return id;
  }

  function getCurrentChat() {
    if (!currentChatId || !chats[currentChatId]) {
      currentChatId = createChat();
      try {
        localStorage.setItem(STORAGE_CURRENT, currentChatId);
      } catch (_) {}
    }
    return chats[currentChatId];
  }

  function renderChatList() {
    const list = $("chatList");
    if (!list) return;
    const ids = Object.keys(chats).sort((a, b) => (chats[b].createdAt || 0) - (chats[a].createdAt || 0));
    list.innerHTML = ids.slice(0, 20).map(function (id) {
      const c = chats[id];
      const title = (c && c.title) || "Chat";
      const active = id === currentChatId ? " active" : "";
      return '<button type="button" class="mordecai-chat-item' + active + '" data-id="' + escapeAttr(id) + '">' + escapeHtml(title) + "</button>";
    }).join("");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  function renderMessages() {
    const container = $("messages");
    if (!container) return;
    const chat = getCurrentChat();
    const msgs = (chat && chat.messages) || [];
    container.innerHTML = msgs.map(function (m) {
      const role = m.role || "user";
      const text = (m.content || "").replace(/\n/g, "<br>");
      const code = m.code ? '<div class="code-block">' + escapeHtml(m.code) + "</div>" : "";
      return '<div class="mordecai-msg ' + role + '">' + text + code + "</div>";
    }).join("");
    container.scrollTop = container.scrollHeight;
  }

  function addMessage(role, content, code) {
    const chat = getCurrentChat();
    if (!chat.messages) chat.messages = [];
    chat.messages.push({ role, content, code: code || null });
    if (chat.messages.length === 1 && content) {
      chat.title = content.slice(0, 40) + (content.length > 40 ? "…" : "");
    }
    saveChats();
    renderMessages();
    renderChatList();
  }

  function setPendingChanges(changes) {
    pendingChanges = changes || [];
    const bar = $("actionsBar");
    if (bar) bar.hidden = pendingChanges.length === 0;
  }

  function getMode() {
    const planBtn = $("modePlan");
    return planBtn && planBtn.classList.contains("active") ? "plan" : "ask";
  }

  function getAgent() {
    const sel = $("agentSelect");
    return (sel && sel.value) || "agent";
  }

  async function sendToBackend(messages) {
    const url = typeof apiUrl === "function" ? apiUrl("/api/mordecai/chat") : "/api/mordecai/chat";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        mode: getMode(),
        agent: getAgent(),
      }),
    });
    if (!res.ok) throw new Error("Chat request failed");
    return res.json();
  }

  async function sendMessage() {
    const input = $("mordecaiInput");
    const sendBtn = $("sendBtn");
    if (!input || !sendBtn) return;
    const text = (input.value || "").trim();
    if (!text) return;

    input.value = "";
    input.style.height = "auto";
    addMessage("user", text);

    sendBtn.disabled = true;
    const chat = getCurrentChat();
    chat.messages.push({ role: "assistant", content: "Thinking…", code: null });
    renderMessages();
    const thinkingEl = $("messages").lastElementChild;
    if (thinkingEl) thinkingEl.classList.add("thinking");

    try {
      const messages = (chat.messages || []).slice(0, -1).map(function (m) {
        return { role: m.role, content: m.content };
      });

      const data = await sendToBackend(messages);
      const content = (data && data.content) || "I couldn't process that. Add OPENAI_API_KEY to your server .env to enable Mordechaius Maximus AI.";
      const code = data && data.code ? data.code : null;

      chat.messages[chat.messages.length - 1] = { role: "assistant", content, code };
      saveChats();
      renderMessages();

      if (data && data.changes && data.changes.length > 0) {
        setPendingChanges(data.changes);
      } else {
        setPendingChanges([]);
      }
    } catch (e) {
      console.error("Mordechaius Maximus chat error", e);
      chat.messages[chat.messages.length - 1] = { role: "assistant", content: "Error: " + (e.message || "Request failed"), code: null };
      saveChats();
      renderMessages();
      showStatusEl("Chat error. Is the server running?", 4000);
    } finally {
      sendBtn.disabled = false;
    }
  }

  function initMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const btn = $("micBtn");
      if (btn) btn.title = "Voice input not supported in this browser";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = function (e) {
      const last = e.results.length - 1;
      const transcript = e.results[last][0].transcript;
      if (e.results[last].isFinal && transcript) {
        const input = $("mordecaiInput");
        if (input) input.value = (input.value + " " + transcript).trim();
      }
    };

    recognition.onerror = function () {
      isRecording = false;
      const btn = $("micBtn");
      if (btn) btn.classList.remove("recording");
    };

    recognition.onend = function () {
      isRecording = false;
      const btn = $("micBtn");
      if (btn) btn.classList.remove("recording");
    };
  }

  function toggleMic() {
    if (!recognition) return;
    const input = $("mordecaiInput");
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      isRecording = true;
      const btn = $("micBtn");
      if (btn) btn.classList.add("recording");
    }
  }

  function keepAll() {
    if (pendingChanges.length === 0) return;
    showStatusEl("Keep all — add file-edit backend to apply changes", 3000);
    setPendingChanges([]);
  }

  function undoAll() {
    setPendingChanges([]);
    showStatusEl("Undo all — changes discarded", 2000);
  }

  let screenStream = null;

  async function startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStream = stream;
      const overlay = $("mordecaiScreenOverlay");
      const video = $("mordecaiScreenVideo");
      if (overlay) overlay.hidden = false;
      if (video) {
        video.srcObject = stream;
      }
      stream.getVideoTracks()[0].onended = stopScreenShare;
    } catch (e) {
      showStatusEl("Screen share failed: " + (e.message || "Permission denied"), 3000);
    }
  }

  function stopScreenShare() {
    if (screenStream) {
      screenStream.getTracks().forEach(function (t) { t.stop(); });
      screenStream = null;
    }
    const overlay = $("mordecaiScreenOverlay");
    const video = $("mordecaiScreenVideo");
    if (overlay) overlay.hidden = true;
    if (video) video.srcObject = null;
  }

  function bindEvents() {
    const newBtn = $("newChatBtn");
    const sendBtn = $("sendBtn");
    const input = $("mordecaiInput");
    const micBtn = $("micBtn");
    const keepAllBtn = $("keepAllBtn");
    const undoAllBtn = $("undoAllBtn");
    const modeAsk = $("modeAsk");
    const modePlan = $("modePlan");

    if (newBtn) {
      newBtn.addEventListener("click", function () {
        currentChatId = createChat();
        try {
          localStorage.setItem(STORAGE_CURRENT, currentChatId);
        } catch (_) {}
        renderMessages();
        renderChatList();
        setPendingChanges([]);
      });
    }

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);

    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      input.addEventListener("input", function () {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
      });
    }

    if (micBtn) micBtn.addEventListener("click", toggleMic);

    if (keepAllBtn) keepAllBtn.addEventListener("click", keepAll);
    if (undoAllBtn) undoAllBtn.addEventListener("click", undoAll);

    const screenShareBtn = $("screenShareBtn");
    const stopScreenBtn = $("stopScreenBtn");
    if (screenShareBtn) screenShareBtn.addEventListener("click", startScreenShare);
    if (stopScreenBtn) stopScreenBtn.addEventListener("click", stopScreenShare);

    if (modeAsk) {
      modeAsk.addEventListener("click", function () {
        if (modePlan) modePlan.classList.remove("active");
        modeAsk.classList.add("active");
      });
    }
    if (modePlan) {
      modePlan.addEventListener("click", function () {
        if (modeAsk) modeAsk.classList.remove("active");
        modePlan.classList.add("active");
      });
    }

    const list = $("chatList");
    if (list) {
      list.addEventListener("click", function (e) {
        const btn = e.target.closest(".mordecai-chat-item");
        if (!btn || !btn.dataset.id) return;
        currentChatId = btn.dataset.id;
        try {
          localStorage.setItem(STORAGE_CURRENT, currentChatId);
        } catch (_) {}
        renderMessages();
        renderChatList();
        setPendingChanges([]);
      });
    }
  }

  function init() {
    loadChats();
    try {
      currentChatId = localStorage.getItem(STORAGE_CURRENT);
    } catch (_) {}
    if (!currentChatId || !chats[currentChatId]) {
      currentChatId = createChat();
    }
    initMic();
    bindEvents();
    renderMessages();
    renderChatList();
    setPendingChanges([]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
