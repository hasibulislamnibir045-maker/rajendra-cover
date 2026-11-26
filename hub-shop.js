/* ===== HUB-SHOP :: Home page tiles (all features, one login) =====
   Purono tuition.js/market.js/admin.js tile-ta restore kore.
   - tuition/mess/admin tile -> modal (VW view)
   - shop tile -> /marketplace/ e redirect
   Load: hub-loader.js-er ses e. */
(function () {
  if (!window.HUB || !document.getElementById('hg')) return;
  var T = {
    tuition: ['\uD83C\uDF93', 'Tuition Hub', '\u099F\u09BF\u0989\u099F\u09B0 \u0996\u09C1\u0981\u099C\u09C1\u09A8, \u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C1\u09A8', 'live'],
    mess:    ['\uD83C\uDFE0', 'Mess & Hostel', '\u09AE\u09C7\u09B8 / \u09B8\u09BF\u099F \u09AD\u09BE\u09A1\u09BC\u09BE \u0993 \u0996\u09CB\u0981\u099C\u09BE', 'live'],
    shop:    ['\uD83D\uDECD', 'Student Marketplace', '\u09AC\u0987 \u0993 \u099C\u09BF\u09A8\u09BF\u09B8 \u0995\u09C7\u09A8\u09BE\u09AC\u09C7\u099A\u09BE', 'live'],
    admin:   ['\uD83D\uDEE0', 'Admin Panel', '\u0993\u09DF\u09C7\u09AC \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09A8\u09BE (\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8)', 'live']
  };
  ['tuition', 'mess', 'shop', 'admin'].forEach(function (k) {
    var i = HUB.map(function (h) { return h[1]; }).indexOf(k);
    if (i === -1) HUB.push(T[k]);
    else HUB[i] = T[k];
  });
  if (window.SOON) { delete SOON.shop; delete SOON.admin; }
  function paint() {
    document.getElementById('hg').innerHTML = HUB.map(function (h) {
      return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>\u099A\u09BE\u09B2\u09C1 \u0986\u099B\u09C7</em>' : '<em class="soon">\u09B6\u09C0\u0998\u09CD\u09B0\u09C7 \u0986\u09B8\u099B\u09C7</em>') + '</button>';
    }).join('');
  }
  paint();
  document.getElementById('hg').addEventListener('click', function (e) {
    var b = e.target.closest('.hc');
    if (b && /'shop'/.test(b.getAttribute('onclick') || '')) { e.preventDefault(); e.stopPropagation(); location.href = 'marketplace/'; }
  }, true);
})();
