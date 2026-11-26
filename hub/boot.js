/* ===== Hub boot loader: dom ready hole Supabase lib + hub module gulo inject kore ===== */
/* Ei file calendar.js-er por ek line add korle sob hub feature chole ashbe */
(function () {
  function css(u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l); }
  function js(u, cb) { var s = document.createElement('script'); s.src = u; if (cb) s.onload = cb; document.head.appendChild(s); }

  function start() {
    css('hub/hub.css');
    if (typeof supabase === 'undefined') {
      js('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', function () {
        js('hub/sb.js', function () { js('hub/notice.js'); });
      });
    } else {
      js('hub/sb.js', function () { js('hub/notice.js'); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
