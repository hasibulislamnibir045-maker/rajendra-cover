/* ===== Hub loader :: Supabase + hubdb + hub-notice auto-load =====
   index.html-er seshe <script src="hub-loader.js"></script> dilei sob cholbe.
   hub-ui.css, hubdb.js, hub-notice.js ek e folder e thakte hobe. */
(function () {
  function css(u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l); }
  function js(u, cb) { var s = document.createElement('script'); s.src = u; if (cb) s.onload = cb; document.head.appendChild(s); }
  function start() {
    css('hub-ui.css');
    var chain = function () { js('hubdb.js', function () { js('hub-notice.js'); }); };
    if (typeof supabase === 'undefined') js('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', chain);
    else chain();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
