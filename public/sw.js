// Budgety service worker — conservative on purpose.
// - Never touches /api (auth + live data always hit the network).
// - Network-first for page navigations, with an offline fallback.
// - Cache-first for static build assets (fast repeat loads).
const CACHE = "budgety-static-v1";
const PRECACHE = ["/offline.html", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const req = event.request;
	if (req.method !== "GET") return;

	const url = new URL(req.url);
	if (url.origin !== self.location.origin) return;
	if (url.pathname.startsWith("/api")) return; // auth + data: always network

	// Page loads: try the network, fall back to a cached offline page.
	if (req.mode === "navigate") {
		event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
		return;
	}

	// Static assets: serve from cache if present, otherwise fetch + cache.
	const isStatic =
		url.pathname.startsWith("/_next/static") ||
		/\.(?:png|svg|ico|jpg|jpeg|webp|woff2?|css|js)$/.test(url.pathname);
	if (isStatic) {
		event.respondWith(
			caches.match(req).then(
				(hit) =>
					hit ||
					fetch(req)
						.then((res) => {
							const copy = res.clone();
							caches.open(CACHE).then((c) => c.put(req, copy));
							return res;
						})
						.catch(() => hit),
			),
		);
	}
});
