// IIFE to avoid global scope pollutioN
(function () {
  "use strict";

  const TODO_LIST_CACHE = "todo-list-cache";

  self.addEventListener("install", function (event) {
    event.waitUntil(caches.open(TODO_LIST_CACHE));
  });

  self.addEventListener("fetch", function (event) {
    console.log("fetching event request: ", event.request);
    if (
      event.request.method === "GET" &&
      event.request.url.endsWith("/todos")
    ) {
      event.respondWith(
        caches
          .match(event.request)
          .then((response) => response || fetch(event.request))
      );
      event.waitUntil(
        updateCache(event.request, TODO_LIST_CACHE).then(refresh)
      );
    } else {
      event.respondWith(fetch(event.request));
    }
  });

  self.addEventListener("activate", function (event) {});

  function updateCache(request, cacheName) {
    return caches.open(cacheName).then((cache) => {
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        return cache.put(request, response.clone()).then(() => response);
      });
    });
  }

  function refresh(response) {
    return response.json().then((jsonResponse) => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
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
