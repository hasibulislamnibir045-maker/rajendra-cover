/* ===== Hub loader :: Supabase + hubdb + hub-auth + all hub modules =====
   Load order: supabase-js -> hubdb -> hub-auth -> hub-notice -> hub-tuition -> hub-mess -> hub-admin -> hub-shop
   V-bust = cache-buster (browser purano file dhore rakhle ei jinishe notun ta ashbe).
   SHIM: index.html e HUB/VW/SOON `const` diye banao — const window-e boshe na.
   Tai DOM ready hole amra segulo window-e tule dei, tahole hub module gulor
   `window.HUB` / `window.VW` check kaj kore, tile + view register hoy. */
(function () {
  var V = '?v=3';
  if (window.__HUB_LOADED__) return;
  window.__HUB_LOADED__ = true;
  function css(u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u + V; document.head.appendChild(l); }
  function js(u, cb) { var s = document.createElement('script'); s.src = u + V; if (cb) s.onload = cb; document.head.appendChild(s); }

  /* ---- const -> window shim (ekbari) ---- */
  function adopt() {
    try { if (typeof HUB !== 'undefined' && !window.HUB) window.HUB = HUB; } catch (e) {}
    try { if (typeof VW !== 'undefined' && !window.VW) window.VW = VW; } catch (e) {}
    try { if (typeof SOON !== 'undefined' && !window.SOON) window.SOON = SOON; } catch (e) {}
  }

  function start() {
    adopt();
    css('hub-ui.css');
    var chain = function () {
      js('hubdb.js', function () {
        js('hub-auth.js', function () {
          js('hub-notice.js', function () {
            js('hub-tuition.js', function () {
              js('hub-mess.js', function () {
                js('hub-admin.js', function () { js('hub-shop.js'); });
              });
            });
          });
        });
      });
    };
    if (typeof supabase === 'undefined') js('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', chain);
    else chain();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
