/* Strážca zaseknutého štartu (prevzaté z PRIMA RE SERVICE v10.10): ak sa appka do 8 s
   nenamountuje a sme online, odregistruje service workery, zmaže cache a reloadne.
   Max. 2 pokusy za session, offline sa nič nemaže. Samostatný súbor, nie inline —
   Content-Security-Policy povoľuje skripty len z vlastného pôvodu. */
(function () {
  var t = setTimeout(function () {
    try {
      if (!document.querySelector('.pre-mount')) return;
      if (navigator.onLine === false) return;
      var n = +(sessionStorage.getItem('primaHomeBootRetry') || 0);
      if (n >= 2) return;
      sessionStorage.setItem('primaHomeBootRetry', String(n + 1));
      var work = [];
      if ('serviceWorker' in navigator) {
        work.push(navigator.serviceWorker.getRegistrations()
          .then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
      }
      if (window.caches && caches.keys) {
        work.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
      }
      Promise.all(work).catch(function () {}).then(function () { location.reload(); });
    } catch (e) {}
  }, 8000);
  window.__primaBootOk = function () { clearTimeout(t); try { sessionStorage.removeItem('primaHomeBootRetry'); } catch (e) {} };
})();
