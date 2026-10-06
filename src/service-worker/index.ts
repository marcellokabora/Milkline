import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

const CACHE = `milkline-${version}`;
// The scope is the deploy root, so this also works when the app is served from a sub-path.
const SCOPE = self.registration.scope;
const SHELL = SCOPE;
const ASSETS = [...immutable, ...assets].map((asset) => new URL(asset.path, SCOPE).pathname);
const API_PATH = new URL('api/', SCOPE).pathname;

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([SHELL, ...ASSETS]))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	// Live herd data (including the event stream) must always come from the network, never a stale copy.
	if (url.origin !== self.location.origin || url.pathname.startsWith(API_PATH)) return;

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(async () => (await caches.match(SHELL)) ?? Response.error())
		);
		return;
	}

	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
	}
});
