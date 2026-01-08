const CACHE_NAME = 'quran-full-v4';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://img.icons8.com/color/96/000000/quran.png',
    'https://img.icons8.com/color/144/000000/quran.png',
    'https://img.icons8.com/color/192/000000/quran.png',
    'https://img.icons8.com/color/512/000000/quran.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📚 جاري تخزين المصحف الكامل للتشغيل بدون إنترنت...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ جاري حذف الكاش القديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// التعامل مع الإشعارات
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : '🕌 حان وقت قراءة القرآن الكريم',
        icon: 'https://img.icons8.com/color/96/000000/quran.png',
        badge: 'https://img.icons8.com/color/96/000000/quran.png',
        vibrate: [100, 50, 100],
        data: {
            url: './'
        },
        actions: [
            {
                action: 'read',
                title: '📖 قراءة الآن'
            },
            {
                action: 'later',
                title: '⏰ لاحقاً'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('مصحف القرآن الكريم', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'read') {
        event.waitUntil(
            clients.matchAll({type: 'window'}).then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes('./') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('./');
                }
            })
        );
    }
});
