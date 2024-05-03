const staticCacheName = 'site-static-2'
const dynamicCacheName = 'site-dynamic-1'
const assets = [
    './',
    'index.html',
    'js/app.js',
    'js/ui.js',
    'js/materialize.min.js',
    'css/styles.css',
    'css/materialize.min.css',
    'img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
    'pages/fallback.html'
]

// cache size limiting function
const limitCacheSize = (cacheName, size) => {
    caches.open(cacheName).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > size){
                cache.delete(keys[0]).then(limitCacheSize(cacheName, size))
            }
        })
    })
}

self.addEventListener('install', evt => { 
    // console.log('Service Worker Installed.') 
    evt.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log('Caching assets...')
            cache.addAll(assets)
            console.log('Assets cached.')
        })
    )
})

self.addEventListener('activate', evt => { 
    // console.log('Service Worker Activated.') 
    evt.waitUntil(
        caches.keys().then(keys => {
            // console.log(keys)
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                .map(key => caches.delete(key))
            )
        })
    )
})

self.addEventListener('fetch', evt => { 
    // console.log('Fetch Events:', evt) 
    evt.respondWith(
        caches.match(evt.request).then(cacheRes => {
            return cacheRes || fetch(evt.request).then(fetchRes => {
                return caches.open(dynamicCacheName).then(cache => {
                    cache.put(evt.request.url, fetchRes.clone())
                    limitCacheSize(dynamicCacheName, 3)
                    return fetchRes
                })
            })
        }).catch(() => {
            if (evt.request.url.indexOf('.html') > -1){
                return caches.match('pages/fallback.html')
            }
        })
    )
})