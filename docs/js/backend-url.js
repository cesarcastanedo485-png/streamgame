(function (global) {
  var KEY = "tarot_backend_url";

  function norm(u) {
    if (!u) return "";
    u = String(u).trim().replace(/\/+$/, "");
    return u;
  }

  global.getBackendBaseUrl = function () {
    try {
      return norm(global.localStorage.getItem(KEY));
    } catch (e) {
      return "";
    }
  };

  global.setBackendBaseUrl = function (url) {
    try {
      var n = norm(url);
      if (n) global.localStorage.setItem(KEY, n);
      else global.localStorage.removeItem(KEY);
    } catch (e) {}
  };

  global.apiUrl = function (path) {
    var b = global.getBackendBaseUrl();
    if (!path) path = "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    if (b) return b + path;
    var base = typeof global.TAROT_BASE_PATH !== "undefined" ? global.TAROT_BASE_PATH : "";
    return base + path;
  };

  global.getWebSocketUrl = function () {
    var b = global.getBackendBaseUrl();
    if (b) {
      try {
        var u = new URL(b);
        var proto = u.protocol === "https:" ? "wss:" : "ws:";
        return proto + "//" + u.host;
      } catch (e) {
        console.warn("Invalid backend URL", b);
      }
    }
    var protocol = global.location.protocol === "https:" ? "wss" : "ws";
    return protocol + "://" + global.location.host;
  };

  /** Card / deck image path from server (e.g. /cards/x.jpg or /decks/id/key.jpg). */
  global.tarotMediaUrl = function (file) {
    if (!file) return "";
    var path = file.charAt(0) === "/" ? file : "/cards/" + file;
    var backend = global.getBackendBaseUrl();
    if (backend) return backend + path;
    var base = typeof global.TAROT_BASE_PATH !== "undefined" ? global.TAROT_BASE_PATH : "";
    return base + path;
  };
})(typeof window !== "undefined" ? window : globalThis);
