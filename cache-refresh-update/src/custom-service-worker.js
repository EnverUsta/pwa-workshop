// IIFE to avoid global scope pollutioN
(function () {
  "use strict";

  // Declare constant variable TODO_LIST_CACHE with the value "todo-list-cache"
  const TODO_LIST_CACHE = "todo-list-cache";

  // Listen to "install" event and wait until caches.open() promise is resolved
  self.addEventListener("install", function (event) {
    event.waitUntil(caches.open(TODO_LIST_CACHE));
  });

  // Listen to "fetch" event
  self.addEventListener("fetch", function (event) {
    console.log("fetching event request: ", event.request);
    // Check if the request method is "GET" and the request URL ends with "/todos"
    if (
      event.request.method === "GET" &&
      event.request.url.endsWith("/todos")
    ) {
      // Respond with the cached response or fetch from network if not found
      event.respondWith(
        caches
          .match(event.request)
          .then((response) => response || fetch(event.request))
      );
      // Wait until updateCache function promise is resolved, then call refresh function
      event.waitUntil(
        updateCache(event.request, TODO_LIST_CACHE).then(refresh)
      );
    } else {
      // Respond with fetching the request from network if the request method is not "GET" or the request URL does not end with "/todos"
      event.respondWith(fetch(event.request));
    }
  });

  // Listen to "activate" event
  self.addEventListener("activate", function (event) {});

  // Function to update the cache with the request and cacheName
  function updateCache(request, cacheName) {
    // Return a promise which opens the cache by cacheName
    return caches.open(cacheName).then((cache) => {
      // Return a promise which fetches the request
      return fetch(request).then((response) => {
        // Check if the response is valid (not null, has status code 200 and type "basic")
        if (!response || response.status !== 200 || response.type !== "basic") {
          // Return the response if invalid
          return response;
        }
        // Return a promise which puts the request and a cloned response into the cache
        return cache.put(request, response.clone()).then(() => response);
      });
    });
  }

  // Function to refresh the clients with the response
  function refresh(response) {
    // Return a promise which resolves with the JSON data of the response
    return response.json().then((jsonResponse) => {
      // Return a promise which matches all the clients and send a post message with the JSON stringified data of the response URL and data
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
      // Resolve the promise with the new data
      return jsonResponse.data;
    });
  }
})();
