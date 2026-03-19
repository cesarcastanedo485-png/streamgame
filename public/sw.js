/* Service worker — cache app shell; paths respect GitHub Pages subfolder (registration scope). */
const CACHE_NAME = "tarot-gate-v5-fonts-greens";

function scopePathPrefix() {
  try {
    const scopeUrl = new URL(self.registration.scope);
    let p = scopeUrl.pathname;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p === "/" ? "" : p;
  } catch (e) {
    return "";
  }
}

function p(rel) {
  const base = scopePathPrefix();
  if (!rel.startsWith("/")) rel = "/" + rel;
  return base + rel;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .addAll([
          p("/"),
          p("/index.html"),
          p("/css/portal-theme.css"),
          p("/manifest.json"),
          p("/library.html"),
          p("/control.html"),
          p("/cards.json"),
          p("/spread-yesno.html"),
          p("/spread-two-card.html"),
          p("/spread-past-present-future.html"),
          p("/spread-path-of-five.html"),
          p("/spread-celtic-seven.html"),
          p("/spread-equilibrium.html"),
        ])
        .catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("/manifest.json") || url.includes("/sw.js")) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
