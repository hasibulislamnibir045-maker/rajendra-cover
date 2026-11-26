/* ===== HUB-ADMIN :: Admin Panel (ONE shared login + Supabase) =====
   - Ek login site-jure (HubAuth)
   - profiles.is_admin = true holei admin panel dekhabe
   - Notice + Routine + Resource + Tuition + Mess manage kora jay */
(function () {
  var admin = false, busy = 0, msg = '';
  var N = [], R = [], RE = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]; }); }
  function v(id) { var e = document.getElementById(id); return e ? String(e.value).trim() : ''; }
  function toast(m) { var t = document.createElement('div'); t.className = 'hub-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); }

  function check() {
    if (!window.HUBDB || !HUBDB.user()) { admin = false; draw(); return; }
    HUBDB.isAdmin().then(function (ok) { admin = !!ok; draw(); }).catch(function () { admin = false; draw(); });
  }
  function load() {
    if (!admin) return;
    busy = 1; draw();
    Promise.all([HUBDB.getNotices(), HUBDB.getRoutines(null, null, null), HUBDB.getResources(null, null)]).then(function (r) {
      N = r[0]; R = r[1]; RE = r[2]; busy = 0; draw();
    }).catch(function (e) { msg = e.message; busy = 0; draw(); });
  }

  function head() {
    return '<div class="hub-tabs">' +
      '<button class="' + (tab === 'notice' ? 'on' : '') + '" onclick="ADM.tab(\'notice\')">\uD83D\uDCE2 \u09A8\u09CB\u099F\u09BF\u09B6</button>' +
      '<button class="' + (tab === 'routine' ? 'on' : '') + '" onclick="ADM.tab(\'routine\')">\uD83D\uDCC5 \u09B0\u09C1\u099F\u09BF\u09A8</button>' +
      '<button class="' + (tab === 'resource' ? 'on' : '') + '" onclick="ADM.tab(\'resource\')">\uD83D\uDCDA \u09B0\u09BF\u09B8\u09CB\u09B0\u09CD\u09B8</button>' +
      '</div>';
  }
  var tab = 'notice';

  function noticeUI() {
    var h = '<div class="hub-sub">\u09AE\u09CB\u099F: <b>' + bn(N.length) + '</b> \u09A8\u09CB\u099F\u09BF\u09B6</div>';
    N.forEach(function (n) {
      h += '<article class="hub-card"><h4>' + esc(n.t) + '</h4><p><small>' + esc(n.d) + ' \u00B7 ' + esc(n.c || '') + (n.dept ? ' \u00B7 ' + esc(n.dept) : '') + '</small></p>' +
        '<div class="hub-tools"><button class="hub-btn2" onclick="ADM.delN(\'' + n.id + '\')">\uD83D\uDDD1\uFE0F \u09AE\u09C1\u099B\u09C1\u09A8</button></div></article>';
    });
    return h || '<p class="hub-empty">\u0995\u09CB\u09A8\u09CB \u09A8\u09CB\u099F\u09BF\u09B6 \u09A8\u09C7\u0987</p>';
  }
  function routineUI() {
    var h = '<div class="hub-sub">\u09AE\u09CB\u099F: <b>' + bn(R.length) + '</b> \u09B0\u09C1\u099F\u09BF\u09A8</div>';
    R.forEach(function (r) {
      h += '<article class="hub-card"><h4>' + esc(r.sub) + '</h4><p><small>' + esc(r.k) + ' \u00B7 ' + esc(r.d || '') + (r.st ? ' \u00B7 ' + esc(r.st) : '') + (r.room ? ' \u00B7 ' + esc(r.room) : '') + '</small></p>' +
        '<div class="hub-tools"><button class="hub-btn2" onclick="ADM.delR(\'' + r.id + '\')">\uD83D\uDDD1\uFE0F \u09AE\u09C1\u099B\u09C1\u09A8</button></div></article>';
    });
    return h || '<p class="hub-empty">\u0995\u09CB\u09A8\u09CB \u09B0\u09C1\u099F\u09BF\u09A8 \u09A8\u09C7\u0987</p>';
  }
  function resourceUI() {
    var h = '<div class="hub-sub">\u09AE\u09CB\u099F: <b>' + bn(RE.length) + '</b> \u09B0\u09BF\u09B8\u09CB\u09B0\u09CD\u09B8</div>';
    RE.forEach(function (r) {
      h += '<article class="hub-card"><h4>' + esc(r.t) + '</h4><p><small>' + esc(r.yr || '') + ' \u00B7 ' + esc(r.type || '') + '</small></p>' +
        '<div class="hub-tools"><a class="hub-btn2" href="' + esc(r.u) + '" target="_blank" rel="noopener">\uD83D\uDD17 \u09B2\u09BF\u0982\u0995</a>' +
        '<button class="hub-btn2" onclick="ADM.delRe(\'' + r.id + '\')">\uD83D\uDDD1\uFE0F \u09AE\u09C1\u099B\u09C1\u09A8</button></div></article>';
    });
    return h || '<p class="hub-empty">\u0995\u09CB\u09A8\u09CB \u09B0\u09BF\u09B8\u09CB\u09B0\u09CD\u09B8 \u09A8\u09C7\u0987</p>';
  }

  function draw() {
    var w = document.getElementById('adw'); if (!w) return;
    if (!window.HUBDB || !HUBDB.user()) {
      w.innerHTML = '<p class="hub-sub" style="margin:10px 0">\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09AA\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 \u09A2\u09C1\u0995\u09A4\u09C7 \u0986\u0997\u09C7 \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964</p>' +
        '<button class="hub-btn" style="max-width:360px" onclick="HubAuth.open()">\uD83D\uDD11 \u09B2\u0997\u0987\u09A8</button>';
      return;
    }
    if (!admin) {
      w.innerHTML = '<p class="hub-empty">\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09A8\u09C7\u0987\u0964 \u09AE\u09BE\u09B2\u09BF\u0995\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964</p>';
      return;
    }
    var h = head();
    if (busy) { w.innerHTML = h + '<p class="hub-empty">\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7\u2026</p>'; return; }
    h += tab === 'notice' ? noticeUI() : tab === 'routine' ? routineUI() : resourceUI();
    w.innerHTML = h;
  }

  window.ADM = {
    tab: function (t) { tab = t; draw(); },
    delN: function (id) { if (!confirm('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?')) return; HUBDB.delNotice(id).then(function () { toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09DF\u09C7\u099B\u09C7'); load(); }); },
    delR: function (id) { if (!confirm('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?')) return; HUBDB.delRoutine(id).then(function () { toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09DF\u09C7\u099B\u09C7'); load(); }); },
    delRe: function (id) { if (!confirm('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?')) return; HUBDB.delResource(id).then(function () { toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09DF\u09C7\u099B\u09C7'); load(); }); }
  };

  /* View + auth sync */
  if (window.VW) VW.admin = ['\u2699\uFE0F Admin Panel', '<div id="adw"></div>', function () { check(); load(); }];
  if (window.HubAuth) window.HubAuth.onChange(function () { admin = false; check(); });
  else var iv = setInterval(function () { if (window.HubAuth) { clearInterval(iv); window.HubAuth.onChange(function () { admin = false; check(); }); } }, 400);
})();
