// Minimal service worker: caches the app shell so it can be installed and
// still open (with whatever was last cached) if the network is unavailable.
var CACHE_NAME = 'pixel-farm-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(SHELL.map(function(url){
        return cache.add(url).catch(function(){ /* ok if an icon isn't there yet */ });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var network = fetch(e.request).then(function(res){
        try{
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, copy); });
        }catch(err){}
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
