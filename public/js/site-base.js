/* GitHub Pages project sites: set window.__TAROT_SITE_BASE__ before this script (e.g. "/streamgame"). */
(function (g) {
  if (typeof g.__TAROT_SITE_BASE__ === "string" && g.__TAROT_SITE_BASE__) {
    g.TAROT_BASE_PATH = g.__TAROT_SITE_BASE__.replace(/\/+$/, "");
  } else if (typeof g.TAROT_BASE_PATH === "undefined") {
    g.TAROT_BASE_PATH = "";
  }
  g.tarotResolvePath = function (pathname) {
    if (!pathname || pathname.charAt(0) !== "/") return pathname;
    return g.TAROT_BASE_PATH + pathname;
  };
})(typeof window !== "undefined" ? window : globalThis);
