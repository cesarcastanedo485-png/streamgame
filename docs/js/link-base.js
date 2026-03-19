/* Prefix absolute same-site links with TAROT_BASE_PATH (GitHub Pages /repo/ subpath). */
(function () {
  function run() {
    var b = typeof window.TAROT_BASE_PATH !== "undefined" ? window.TAROT_BASE_PATH : "";
    document.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var h = a.getAttribute("href");
      if (!h || h.startsWith("//")) return;
      a.href = b + h;
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
