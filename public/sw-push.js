/* Push notifikácie (importuje ho generovaný service worker, vite.config.js → workbox.importScripts).
   Payload z edge funkcie send-push: { title, body, url, tag }. Klik otvorí/zaostrí appku na url. */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  var title = d.title || 'PRIMA';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || undefined, renotify: !!d.tag,
    data: { url: d.url || '/' },
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if ('focus' in c) { try { if (c.navigate) c.navigate(url); } catch (err) {} return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
