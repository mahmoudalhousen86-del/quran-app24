// Service Worker للمصحف الكامل
const CACHE_NAME = 'quran-app-complete-v3';
const APP_VERSION = '3.0.0';

// الملفات التي سيتم تخزينها للتشغيل بدون إنترنت
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Noto+Naskh+Arabic&family=Tajawal&display=swap',
    'https://img.icons8.com/color/96/000000/quran.png',
    'https://img.icons8.com/color/144/000000/quran.png',
    'https://img.icons8.com/color/192/000000/quran.png',
    'https://img.icons8.com/color/512/000000/quran.png'
];

// التثبيت الأولي
self.addEventListener('install', event => {
    console.log('🕌 جاري تثبيت تطبيق المصحف...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📚 جاري تخزين الملفات الأساسية...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ تم التثبيت بنجاح');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ خطأ في التثبيت:', error);
            })
    );
});

// التنشيط
self.addEventListener('activate', event => {
    console.log('🚀 تفعيل Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // حذف الكاش القديم
                        if (cacheName !== CACHE_NAME) {
                            console.log(`🗑️ حذف الكاش القديم: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker مفعل وجاهز');
                return self.clients.claim();
            })
    );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
    // تجاهل الطلبات غير GET
    if (event.request.method !== 'GET') return;
    
    // تجاهل طلبات chrome-extension
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا كان الملف موجوداً في الكاش
                if (response) {
                    return response;
                }
                
                // إذا لم يكن موجوداً، جلب من الشبكة
                return fetch(event.request)
                    .then(networkResponse => {
                        // التحقق من صحة الاستجابة
                        if (!networkResponse || 
                            networkResponse.status !== 200 || 
                            networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // استنساخ الاستجابة للتخزين
                        const responseToCache = networkResponse.clone();
                        
                        // تخزين في الكاش
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(() => {
                        // إذا فشل الاتصال بالشبكة
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // للطلبات الأخرى، يمكنك إعادة ملف بديل
                        if (event.request.url.includes('.json')) {
                            return new Response(JSON.stringify({
                                error: 'لا يوجد اتصال بالإنترنت',
                                offline: true
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    });
            })
    );
});

// معالجة الإشعارات
self.addEventListener('push', event => {
    console.log('📨 استلام إشعار دفع');
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || '🕌 حان وقت قراءة القرآن الكريم',
        icon: 'https://img.icons8.com/color/192/000000/quran.png',
        badge: 'https://img.icons8.com/color/96/000000/quran.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'read',
                title: '📖 قراءة الآن'
            },
            {
                action: 'snooze',
                title: '⏰ بعد قليل'
            }
        ],
        tag: 'quran-reminder',
        renotify: true,
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification('مصحف القرآن الكريم', options)
    );
});

// النقر على الإشعارات
self.addEventListener('notificationclick', event => {
    console.log('👆 نقر على الإشعار');
    
    event.notification.close();
    
    if (event.action === 'read') {
        // فتح التطبيق للقراءة
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then(clientList => {
                    // البحث عن نافذة مفتوحة بالفعل
                    for (const client of clientList) {
                        if (client.url.includes('/') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // إذا لم تكن هناك نافذة مفتوحة، افتح واحدة جديدة
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    } else if (event.action === 'snooze') {
        // تأجيل التذكير (يمكن إضافة منطق أكثر تعقيداً)
        console.log('⏰ تم تأجيل التذكير');
    } else {
        // النقر العادي على الإشعار
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// رسالة من الصفحة الرئيسية
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// مزامنة البيانات عند العودة للاتصال
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncAppData());
    }
});

async function syncAppData() {
    try {
        console.log('🔄 مزامنة البيانات...');
        
        // هنا يمكنك إضافة منطق مزامنة البيانات
        // مثل حفظ التقدم على السحابة، إلخ
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('❌ خطأ في المزامنة:', error);
    }
}

// تسجيل الدخول في وحدة التحكم للتتبع
console.log('✅ Service Worker للمصحف الكامل جاهز للتشغيل');
