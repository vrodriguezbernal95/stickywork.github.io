const CACHE_NAME = 'stickywork-v2';

// Archivos del dashboard que se cachean para acceso offline
const ASSETS_TO_CACHE = [
    '/admin-dashboard.html',
    '/admin/css/admin.css',
    '/css/styles.css',
    '/admin/js/app.js',
    '/admin/js/dashboard.js',
    '/admin/js/bookings.js',
    '/admin/js/clients.js',
    '/admin/js/calendar.js',
    '/admin/js/settings.js',
    '/images/favicon-192x192.png',
    '/images/favicon-512x512.png',
    '/images/apple-touch-icon.png'
];

// Instalación: cachear recursos estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first para las llamadas a la API, cache-first para el resto
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Las llamadas a la API siempre van a red (nunca caché)
    if (url.hostname === 'api.stickywork.com') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Para el resto: intentar red, si falla usar caché
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Guardar copia fresca en caché
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
