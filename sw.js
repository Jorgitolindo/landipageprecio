// Service Worker para Precio Verdadero PWA
const CACHE_VERSION = 'v2';
const CACHE_NAME = `precio-verdadero-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/sw.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  // Durante la instalación, precachear archivos esenciales.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos allSettled para evitar que un solo recurso fallido rechace toda la instalación
      return Promise.allSettled(urlsToCache.map((url) => cache.add(url))).then((results) => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.warn('No se pudo cachear:', urlsToCache[i], r.reason);
          }
        });
        console.log('✅ Precaching finalizado (parcial si hubo errores)');
      });
    }).catch((error) => {
      console.error('❌ Error abriendo cache durante install:', error);
    })
  );
  // Tomar control inmediatamente después de instalar si se solicita
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear solicitudes POST, PUT, DELETE, etc.
  if (request.method !== 'GET') {
    return; // Dejar que la solicitud pase normalmente
  }

  // No cachear solicitudes de extensiones de Chrome
  if (url.protocol === 'chrome-extension:') {
    return; // Dejar que la solicitud pase normalmente
  }

  // No cachear solicitudes de API (solo cachear recursos estáticos)
  if (url.pathname.startsWith('/api/')) {
    return; // Dejar que la solicitud pase normalmente
  }

  // No cachear solicitudes a otros dominios (solo nuestro dominio)
  if (url.origin !== self.location.origin && !url.href.startsWith('http://localhost') && !url.href.startsWith('https://')) {
    return; // Dejar que la solicitud pase normalmente
  }

  // Estrategia diferenciada:
  // - Navegación/document: network-first (obtener HTML actualizado, fallback a cache)
  // - Otros recursos estáticos: cache-first (mejor UX offline)
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        // Guardar en cache la respuesta de navegación para uso offline
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return networkResponse;
      }).catch(() => {
        // Si falla la red, devolver la página cacheada (index.html)
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Para otros recursos (imágenes, CSS, JS): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((networkResponse) => {
        // Solo cachear respuestas válidas y del mismo origen
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(request, responseToCache);
          } catch (e) {
            // Ignorar errores de cache (espacio, CORS, etc.)
          }
        });

        return networkResponse;
      }).catch(() => {
        // Si falla la red y no hay cache, devolver un fallback según el tipo
        if (request.destination === 'image') {
          // podrías devolver una imagen placeholder local si existe
          return new Response('', { status: 404, statusText: 'Not Found' });
        }
        return new Response('Sin conexión', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

