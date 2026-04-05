const CACHE = 'codequest-v14';

const APP_SHELL = [
  '/goteamolatoyes/hackathon/index.html',
  '/goteamolatoyes/hackathon/manifest.json',
  '/goteamolatoyes/hackathon/offline.html',
  '/goteamolatoyes/hackathon/riri-widget.js',
  '/goteamolatoyes/hackathon/sw.js',
  // All pages
  '/goteamolatoyes/hackathon/kickoff.html',
  '/goteamolatoyes/hackathon/boys-recap.html',
  '/goteamolatoyes/hackathon/girls-recap.html',
  '/goteamolatoyes/hackathon/hackathon-recap.html',
  '/goteamolatoyes/hackathon/badges.html',
  '/goteamolatoyes/hackathon/tonight.html',
  '/goteamolatoyes/hackathon/slideshow.html',
  '/goteamolatoyes/hackathon/hosting.html',
  '/goteamolatoyes/hackathon/database.html',
  '/goteamolatoyes/hackathon/prompts.html',
  // Icons
  '/goteamolatoyes/hackathon/icons/icon-192.png',
  '/goteamolatoyes/hackathon/icons/icon-512.png',
  '/goteamolatoyes/hackathon/icons/icon-180.png',
  // Thumbnails
  '/goteamolatoyes/hackathon/thumbnails/thumb-hackathon-night.svg',
  '/goteamolatoyes/hackathon/thumbnails/thumb-boys-checkin.svg',
  '/goteamolatoyes/hackathon/thumbnails/thumb-girls-elsie.svg',
  '/goteamolatoyes/hackathon/thumbnails/thumb-girls-fullteam.svg',
  '/goteamolatoyes/hackathon/thumbnails/thumb-girls-hs-part1.svg',
  '/goteamolatoyes/hackathon/thumbnails/thumb-girls-hs-part2.svg',
  '/goteamolatoyes/hackathon/thumbnails/thumb-riri.svg',
];

const NEVER_CACHE = [
  'supabase.co',
  'anthropic.com',
  'drive.google.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── Install ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(err => console.warn('[SW] Cache install error:', err)))
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Never cache these — always network
  if (NEVER_CACHE.some(skip => url.includes(skip))) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for our app files
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // If it's a page navigation, show offline page
          if (e.request.mode === 'navigate') {
            return caches.match('/goteamolatoyes/hackathon/offline.html');
          }
        });
      })
  );
});

// ── Message: skip waiting (for update notifications) ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
