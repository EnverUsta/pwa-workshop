// write an IIFE to avoid global scope pollution
(function () {
  'use strict'; // enable strict mode

  const SQL_REPORT_CACHE = 'sql-report-cache';
  const KPI_ALARM_CACHE = 'kpi-alarm-cache';
  const SQL_ALARM_CACHE = 'sql-alarm-cache';
  const ALARM_SET_CACHE = 'alarm-set-cache';

  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(SQL_REPORT_CACHE),
      caches.open(KPI_ALARM_CACHE),
      caches.open(SQL_ALARM_CACHE),
      caches.open(ALARM_SET_CACHE)
    );
  });

  self.addEventListener('fetch', function (event) {
    if (event.request.method === 'GET') {
      event.respondWith(
        caches
          .match(event.request)
          .then((response) => response || fetch(event.request))
      );
      if (event.request.url.endsWith('srv/PIEMSService/sql-report')) {
        event.waitUntil(
          updateCache(event.request, SQL_REPORT_CACHE).then(refresh)
        );
      } else if (event.request.url.endsWith('srv/PIEMSService/kpi-alarm')) {
        event.waitUntil(
          updateCache(event.request, KPI_ALARM_CACHE).then(refresh)
        );
      } else if (event.request.url.endsWith('srv/PIEMSService/sql-alarm')) {
        event.waitUntil(
          updateCache(event.request, SQL_ALARM_CACHE).then(refresh)
        );
      } else if (event.request.url.endsWith('srv/PIEMSService/alarm-set')) {
        event.waitUntil(
          updateCache(event.request, ALARM_SET_CACHE).then(refresh)
        );
      }
    } else {
      event.respondWith(fetch(event.request));
    }
  });

  self.addEventListener('activate', function (event) {
    // console.log('Service worker activated');
  });

  function updateCache(request, cacheName) {
    return caches.open(cacheName).then((cache) => {
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        return cache.put(request, response.clone()).then(() => response);
      });
    });
  }

  function refresh(response) {
    // console.log('from service worker: Refreshing cache called!');
    return response
      .json() // read and parse JSON response
      .then((jsonResponse) => {
        // console.log('from service worker jsonResponse: ', jsonResponse);
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            // report and send new data to client
            client.postMessage(
              JSON.stringify({
                url: response.url,
                data: jsonResponse,
              })
            );
          });
        });
        return jsonResponse.data; // resolve promise with new data
      });
  }
})();
