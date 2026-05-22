const CACHE_NAME = 'hedef-paneli-v3';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@400;700&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
    'https://www.youtube.com/iframe_api'
];

// Install - Önbelleğe al
self.addEventListener('install', function(event) {
    console.log('🔧 Service Worker: Yükleniyor...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('✅ Önbellek açıldı');
                return cache.addAll(urlsToCache).catch(function(err) {
                    console.log('⚠️ Bazı dosyalar önbelleğe alınamadı:', err);
                });
            })
    );
    // Yeni SW hemen aktif olsun
    self.skipWaiting();
});

// Fetch - Cache First stratejisi (önce önbellek, yoksa ağ)
self.addEventListener('fetch', function(event) {
    // API isteklerini önbelleğe alma (sözler, YouTube API)
    if (event.request.url.includes('zenquotes.io') || 
        event.request.url.includes('api.quotable.io') || 
        event.request.url.includes('dummyjson.com') ||
        event.request.url.includes('youtube.com') ||
        event.request.url.includes('googlevideo.com')) {
        // Network first for APIs
        event.respondWith(
            fetch(event.request).catch(function() {
                return new Response(JSON.stringify({
                    content: "Hedeflerine odaklan, başarı seni bekliyor!",
                    author: "Hedef Paneli"
                }));
            })
        );
        return;
    }

    // Diğer istekler için Cache First
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                // Önbellekte yoksa ağdan al
                return fetch(event.request).then(function(response) {
                    // Geçersiz cevapları önbelleğe alma
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    // Cevapla ve önbelleğe kaydet
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                });
            })
    );
});

// Activate - Eski önbellekleri temizle
self.addEventListener('activate', function(event) {
    console.log('🔄 Service Worker: Aktif');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('🗑️ Eski önbellek siliniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Hemen tüm sayfaları kontrol et
    self.clients.claim();
});

// Push bildirimi (opsiyonel)
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'Hedeflerini kontrol etmeyi unutma!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
        vibrate: [200, 100, 200]
    };
    event.waitUntil(
        self.registration.showNotification('Hedef Paneli', options)
    );
});