/* ===== HUB-SHOP :: Marketplace tile (opens /marketplace/) =====
   Old market.js tile-ta restore kore: click korle /marketplace/ e chole jay. */
(function () {
  if (!window.HUB || !document.getElementById('hg')) return;
  delete window.SOON ? window.SOON.shop : null;
  var i = HUB.map(function (h) { return h[1]; }).indexOf('shop');
  if (i === -1) HUB.push(['\uD83D\uDECD', 'shop', 'Student Marketplace', '\u09AC\u0987 \u0993 \u099C\u09BF\u09A8\u09BF\u09B8 \u0995\u09C7\u09A8\u09BE\u09AC\u09C7\u099A\u09BE', 'live']);
  else HUB[i] = ['\uD83D\uDECD', 'shop', 'Student Marketplace', '\u09AC\u0987 \u0993 \u099C\u09BF\u09A8\u09BF\u09B8 \u0995\u09C7\u09A8\u09BE\u09AC\u09C7\u099A\u09BE', 'live'];
  document.getElementById('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>\u099A\u09BE\u09B2\u09C1 \u0986\u099B\u09C7</em>' : '<em class="soon">\u09B6\u09C0\u0998\u09CD\u09B0\u09C7 \u0986\u09B8\u099B\u09C7</em>') + '</button>'; }).join('');
  /* click-hole /marketplace/ e niye jay (index.html-er aro ekta handler + ei handler) */
  document.getElementById('hg').addEventListener('click', function (e) {
    var b = e.target.closest('.hc');
    if (b && /'shop'/.test(b.getAttribute('onclick') || '')) { e.preventDefault(); e.stopPropagation(); location.href = 'marketplace/'; }
  }, true);
})();
