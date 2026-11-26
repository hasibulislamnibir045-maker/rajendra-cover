/* ===== Hub loader :: Supabase + hubdb + hub-auth + all hub modules =====
   Load order: supabase-js -> hubdb -> hub-auth -> hub-notice -> hub-tuition -> hub-mess -> hub-admin
   Double-load guard: ei script ekbar-i kaj korbe. */
(function () {
  if (window.__HUB_LOADED__) return;
  window.__HUB_LOADED__ = true;
  function css(u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l); }
  function js(u, cb) { var s = document.createElement('script'); s.src = u; if (cb) s.onload = cb; document.head.appendChild(s); }
  function start() {
    css('hub-ui.css');
    var chain = function () {
      js('hubdb.js', function () {
        js('hub-auth.js', function () {
          js('hub-notice.js', function () {
            js('hub-tuition.js', function () {
              js('hub-mess.js', function () { js('hub-admin.js'); });
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
