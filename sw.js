// ===== DrDer-Maze - Service Worker =====

const CACHE_NAME = 'drdermaze-cache-v1';
const OFFLINE_CACHE = 'drdermaze-offline-v1';

// الملفات الأساسية للتطبيق - استخدام مسارات نسبية
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './maze.js',
    './storage.js',
    './manifest.json',
    './192.png',
    './512.png'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('Service Worker installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache assets:', error);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// استراتيجية التخزين: Cache First مع تحديث في الخلفية
self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات غير GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // تجاهل طلبات API الخارجية
    if (event.request.url.includes('http') && !event.request.url.includes(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // تحديث الكاش في الخلفية
                    fetch(event.request)
                        .then((response) => {
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                        })
                        .catch((error) => {
                            console.log('Background fetch failed:', error);
                        });
                    
                    return cachedResponse;
                }
                
                // إذا لم يكن الملف موجوداً في الكاش، حاول جلبه من الشبكة
                return fetch(event.request)
                    .then((response) => {
                        // التحقق من صحة الاستجابة
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // تخزين الاستجابة في الكاش
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // إذا فشل الجلب وكان الملف HTML، أرجع صفحة البداية
                        if (event.request.headers.get('accept') && 
                            event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        
                        // إرجاع استجابة فارغة للملفات الأخرى
                        return new Response('', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});

// معالجة طلبات التنقل (Navigation Requests)
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // عند الفشل، إرجاع الصفحة الرئيسية من الكاش
                    return caches.match('./index.html');
                })
        );
    }
});

// معالجة الرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: CACHE_NAME
                });
            });
        });
    }
});

// معالجة أحداث التحديث
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-mazes') {
        event.waitUntil(syncMazes());
    }
});

// مزامنة المتاهات عند توفر الإنترنت
async function syncMazes() {
    try {
        const cache = await caches.open(OFFLINE_CACHE);
        const requests = await cache.keys();
        
        // محاولة تحديث الملفات المخزنة
        for (const request of requests) {
            try {
                const response = await fetch(request);
                if (response && response.status === 200) {
                    await cache.put(request, response);
                }
            } catch (error) {
                console.log('Failed to sync:', error);
            }
        }
        
        console.log('Maze sync completed');
    } catch (error) {
        console.error('Failed to sync mazes:', error);
    }
}

// تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('Removing old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
    );
});
