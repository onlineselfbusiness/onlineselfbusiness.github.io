const PRECACHE = 'v1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  'index.html',
  './',
  'https://cdn.webix.com/materialdesignicons/5.8.95/css/materialdesignicons.min.css',
  'https://cdn.webix.com/8.3/webix.css',
  'css/newWorldMarket.css',
  'css/nse-styles.css',
  'https://cdn.webix.com/8.3/webix.js',
  'https://cdn.amcharts.com/lib/3/amcharts.js',
  'https://cdn.amcharts.com/lib/3/serial.js',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highstock/6.0.3/highstock.js',
  'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js',
  'js/ag-grid-enterprise.min.noStyle.js',
  'js/ag-charts-community.min.js',
  'css/ag-grid.css',
  'css/ag-theme-alpine.css',
  'js/indexedDB.js',
  'js/scriptNames.js',
  'js/option_stratagies.js',
  'js/strategy_calculation.js',
  './assets/images/close.png',
  './assets/images/breadcrumb_bg.jpg',
  './images/banner-tradeinfo.jpg',
  'https://cdn.webix.com/materialdesignicons/5.8.95/fonts/materialdesignicons-webfont.woff2?v=5.8.55',
  './grficon.gif',
  './icon.png'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  //if (event.request.url.startsWith(self.location.origin)) {
    console.dir(event.request.url)
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  //}
});