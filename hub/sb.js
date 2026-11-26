/* ===== Rajendra Student Hub - Supabase core (single project, sob feature ekhane) ===== */
window.SB = (function () {
  var URL = 'https://dcwzxozhgysxhcptataq.supabase.co';
  var KEY = 'sb_publishable_i7C5FVxKNwaBPABgdFHOIQ_HKrxz5rM';
  var client = null, me = null;

  function init() {
    if (typeof supabase === 'undefined') throw new Error('Supabase library load hoy ni');
    client = supabase.createClient(URL, KEY);
    client.auth.onAuthStateChange(function (_e, s) { me = s && s.user ? s.user : null; });
    return client.auth.getSession().then(function (r) { me = r.data.session ? r.data.session.user : null; return client; });
  }
  function c() { if (!client) throw new Error('Supabase init hoy ni'); return client; }
  function user() { return me; }
  function toast(m) { var t = document.createElement('div'); t.className = 'tg'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; }); }
  function ld(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  return { init: init, c: c, user: user, toast: toast, esc: esc, bn: bn, ld: ld, sv: sv };
})();
