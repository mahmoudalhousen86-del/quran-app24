const CACHE_NAME = 'quran-app-full-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://img.icons8.com/color/192/000000/quran.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
