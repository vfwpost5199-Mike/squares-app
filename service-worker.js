// Update this version number any time you change files on GitHub
const CACHE_NAME = "squares-draw-v3";

// Core files to cache for offline use + fast loading
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./icon-192.png",
  "./icon-512.png",
  "./cheer.mp3",
  "./whistle.mp3"
  // Note: Team logo PNGs are not listed here on purpose (you may add many).
  // The app will still load them from the network when online.
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

/**
 * Fetch strategy:
 * - index.html (navigation): NETWORK FIRST so updates show up quickly
 * - everything else: CACHE FIRST for speed/offline
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  const isNavigation =
    req.mode === "navigate" ||
    (req.destination === "document") ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    // Network-first for HTML
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for everything else (images, mp3, css, js)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});

