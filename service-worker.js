const CACHE_NAME = "constellation-v1";
const APP_FILES = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./service-worker.js",
  "./icons/astroid.svg",
  "./icons/favicon.png.webp",
  "./icons/footprints.svg",
  "./icons/icon-192.png",
  "./icons/icon-192.png.webp",
  "./icons/icon-512-maskable.png",
  "./icons/icon-512-maskable.png.png",
  "./icons/icon-512.png",
  "./icons/icon-512.png.webp",
  "./icons/moon-star.svg",
  "./icons/moon.svg",
  "./icons/rest.svg",
  "./icons/settings.svg",
  "./icons/star-x.svg",
  "./icons/star.svg",
  "./icons/sun.svg",
  "./icons/volleyball.svg",
  "./icons/walk.svg",
  "./icons/workout.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME)
      .then((cache) => cache.match(event.request))
      .then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});
