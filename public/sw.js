const CACHE_NAMES = {
    app: "ccc-app-v1",
    content: "ccc-content-v1",
};

const CURRENT_CACHES = Object.values(CACHE_NAMES);

/* ----------------------------------------
   INSTALL
---------------------------------------- */

self.addEventListener("install", (event) => {
    event.waitUntil(
        self.skipWaiting(),
    );
});

/* ----------------------------------------
   ACTIVATE
---------------------------------------- */

self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim(),
        ]),
    );
});

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();

    await Promise.all(
        cacheNames
            .filter(
                (name) =>
                    !CURRENT_CACHES.includes(name),
            )
            .map(
                (name) =>
                    caches.delete(name),
            ),
    );
}

/* ----------------------------------------
   FETCH
---------------------------------------- */

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    /*
     * Only handle same-origin GET requests.
     */

    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    /*
     * Never cache the service worker itself.
     */

    if (url.pathname === "/sw.js") {
        return;
    }

    /*
     * Never cache Next.js internals.
     */

    if (url.pathname.startsWith("/_next")) {
        return;
    }

    /*
     * Never cache API responses.
     */

    if (url.pathname.startsWith("/api")) {
        return;
    }

    event.respondWith(
        cacheFirst(request),
    );
});

/* ----------------------------------------
   CACHE FIRST
---------------------------------------- */

async function cacheFirst(request) {
    const cached =
        await caches.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response =
            await fetch(request);

        if (response.ok) {
            const cache =
                await caches.open(
                    CACHE_NAMES.app,
                );

            await cache.put(
                request,
                response.clone(),
            );
        }

        return response;
    } catch {
        return new Response(
            "Offline",
            {
                status: 503,
                headers: {
                    "Content-Type":
                        "text/plain",
                },
            },
        );
    }
}

/* ----------------------------------------
   CACHE MANAGEMENT
---------------------------------------- */

async function purgeCache(
    cacheName,
) {
    await caches.delete(
        cacheName,
    );
}

async function purgeApp() {
    await purgeCache(
        CACHE_NAMES.app,
    );
}

async function purgeContent() {
    await purgeCache(
        CACHE_NAMES.content,
    );
}

async function purgeAll() {
    const cacheNames =
        await caches.keys();

    await Promise.all(
        cacheNames.map(
            (name) =>
                caches.delete(name),
        ),
    );
}

/* ----------------------------------------
   MESSAGES
---------------------------------------- */

self.addEventListener(
    "message",
    (event) => {
        const type =
            event.data?.type;

        switch (type) {
            case "SKIP_WAITING":
                self.skipWaiting();
                break;

            case "PURGE_APP":
                event.waitUntil(
                    purgeApp(),
                );
                break;

            case "PURGE_CONTENT":
                event.waitUntil(
                    purgeContent(),
                );
                break;

            case "PURGE_ALL":
                event.waitUntil(
                    purgeAll(),
                );
                break;
        }
    },
);