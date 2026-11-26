/* ===== HUB-MESS :: Mess/Hostel (ONE shared login + Supabase) ===== */
(function () {
  var L = [], MINE = [], tab = 'feed', form = 0, busy = 0, msg = '', Q = '', G = '';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]; }); }
  function v(id) { var e = document.getElementById(id); return e ? String(e.value).trim() : ''; }
  function toast(m) { var t = document.createElement('div'); t.className = 'hub-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); }
  function ago(ts) {
    if (!ts) return '';
    var h = Math.floor((Date.now() - new Date(ts).getTime()) / 36e5);
    if (h < 1) return '\u098F\u0987\u09AE\u09BE\u09A4\u09CD\u09B0';
    if (h < 24) return bn(h) + ' \u0998\u09A3\u09CD\u099F\u09BE \u0986\u0997\u09C7';
    var d = Math.floor(h / 24);
    return d < 30 ? bn(d) + ' \u09A6\u09BF\u09A8 \u0986\u0997\u09C7' : bn(Math.floor(d / 30)) + ' \u09AE\u09BE\u09B8 \u0986\u0997\u09C7';
  }

  function load() {
    if (!window.HUBDB) return;
    busy = 1; msg = ''; draw();
    HUBDB.getMess().then(function (r) { L = r; busy = 0; draw(); })
      .catch(function (e) { msg = e.message; busy = 0; draw(); });
  }
  function loadM() {
    if (!window.HUBDB || !HUBDB.user()) return;
    HUBDB.myMess().then(function (r) { MINE = r; draw(); });
  }

  function contact(m) {
    if (!m) return '';
    return '<div class="hub-tools" style="margin-top:10px">' +
      '<a class="hub-btn2" style="text-decoration:none" href="tel:' + esc(m) + '">\uD83D\uDCDE \u0995\u09B2</a>' +
      '<a class="hub-btn2" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/88' + esc(String(m).replace(/^0/, '')) + '">\uD83D\uDCAC WhatsApp</a></div>';
  }
  function card(x) {
    var r = [];
    if (x.g) r.push('\uD83D\uDC65 ' + x.g);
    if (x.seats) r.push('\uD83E\uDE9B \u0996\u09BE\u09B2\u09BF \u09B8\u09BF\u099F: ' + bn(x.seats));
    if (x.price) r.push('\uD83D\uDCB0 ' + x.price + ' / \u09B8\u09BF\u099F');
    if (x.area) r.push('\uD83D\uDCCD ' + x.area);
    if (x.note) r.push('\uD83D\uDCDD ' + x.note);
    return '<article class="hub-card"><div class="hub-card-top"><span class="hub-chip">\uD83C\uDFE0 ' + esc(x.cond || '\u09AE\u09C7\u09B8') + '</span>' +
      '<span class="hub-date">' + ago(x.ts) + '</span></div><h4>' + esc(x.t) + '</h4>' +
      '<p>' + r.map(esc).join('<br>') + '</p>' + contact(x.m) + '</article>';
  }
  function mineCard(x) {
    return '<article class="hub-card"><h4>' + esc(x.t) + '</h4><p>' + esc([x.cond, x.area, x.seats ? x.seats + ' \u09B8\u09BF\u099F' : ''].filter(Boolean).join(' \u00B7 ')) + '</p>' +
      '<div class="hub-tools"><button class="hub-btn2" onclick="MS.del(\'' + x.id + '\')">\uD83D\uDDD1\uFE0F \u09AE\u09C1\u099B\u09C1\u09A8</button></div></article>';
  }
  function formUI() {
    return '<form id="msF" class="hub-form">' +
      '<label>\u09AE\u09C7\u09B8 / \u09B9\u09CB\u09B8\u09CD\u099F\u09C7\u09B2\u09C7\u09B0 \u09A8\u09BE\u09AE *</label><input id="ms_t" required>' +
      '<div class="hub-row2"><div><label>\u09A7\u09B0\u09A8</label><select id="ms_cond"><option>\u09AE\u09C7\u09B8</option><option>\u09B9\u09CB\u09B8\u09CD\u099F\u09C7\u09B2</option><option>\u09B8\u09BE\u09AC\u09B2\u09C7\u099F</option><option>\u09AB\u09CD\u09B2\u09CD\u09AF\u099F</option></select></div>' +
      '<div><label>\u0995\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF</label><select id="ms_g"><option>\u099B\u09C7\u09B2\u09C7</option><option>\u09AE\u09C7\u09DF\u09C7</option><option>\u09AF\u09C7 \u0995\u09C7\u0989</option></select></div></div>' +
      '<div class="hub-row2"><div><label>\u0996\u09BE\u09B2\u09BF \u09B8\u09BF\u099F</label><input id="ms_seats" type="number" min="1"></div>' +
      '<div><label>\u09AD\u09BE\u09A1\u09BC\u09BE (\u09B8\u09BF\u099F \u09AA\u09CD\u09B0\u09A4\u09BF)</label><input id="ms_price"></div></div>' +
      '<label>\u098F\u09B2\u09BE\u0995\u09BE *</label><input id="ms_area" required>' +
      '<div class="hub-row2"><div><label>\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 *</label><input id="ms_m" type="tel" maxlength="11" required></div>' +
      '<div><label>\u09AE\u09CD\u09AF\u09BE\u09AA \u09B2\u09BF\u0982\u0995</label><input id="ms_loc" type="url" placeholder="https://maps.app.goo.gl/..."></div></div>' +
      '<label>\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4</label><textarea id="ms_note"></textarea>' +
      '<button type="submit" class="hub-btn">\u2705 \u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C1\u09A8</button></form>';
  }
  function draw() {
    var w = document.getElementById('msw'); if (!w) return;
    var on = window.HUBDB && HUBDB.user();
    var h = '<div class="hub-tabs">' +
      '<button class="' + (tab === 'feed' ? 'on' : '') + '" onclick="MS.tab(\'feed\')">\uD83C\uDFE0 \u0996\u09BE\u09B2\u09BF \u09B8\u09BF\u099F</button>' +
      (on ? '<button class="' + (tab === 'mine' ? 'on' : '') + '" onclick="MS.tab(\'mine\')">\uD83D\uDC64 \u0986\u09AE\u09BE\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F</button>' : '') +
      '</div>';
    if (msg) h += '<p class="hub-empty">' + esc(msg) + '</p>';
    if (busy) { w.innerHTML = h + '<p class="hub-empty">\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7\u2026</p>'; return; }
    if (tab === 'mine') {
      h += MINE.length ? MINE.map(mineCard).join('') : '<p class="hub-empty">\u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09CB\u09A8\u09CB \u09AA\u09CB\u09B8\u09CD\u099F \u09A8\u09C7\u0987</p>';
    } else if (form) {
      h += formUI() + '<button class="hub-btn2" style="margin-top:10px" onclick="MS.form(0)">\u2B05\uFE0F \u09AC\u09BE\u09A4\u09BF\u09B2</button>';
    } else {
      var f = L.filter(function (x) { return (!G || x.g === G || x.g === '\u09AF\u09C7 \u0995\u09C7\u0989') && (!Q || (x.t + ' ' + x.area + ' ' + (x.note || '')).toLowerCase().indexOf(Q) > -1); });
      h += '<input id="msq" placeholder="\uD83D\uDD0E \u098F\u09B2\u09BE\u0995\u09BE / \u09AE\u09C7\u09B8\u09C7\u09B0 \u09A8\u09BE\u09AE \u0996\u09C1\u0981\u099C\u09C1\u09A8" value="' + esc(Q) + '" oninput="MS.q(this.value)" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--hub-line);background:#fff;color:var(--hub-text);font:inherit;box-sizing:border-box;margin-bottom:10px">' +
        '<div class="hub-tabs"><button class="' + (!G ? 'on' : '') + '" onclick="MS.g(\'\')">\u09B8\u09AC</button><button class="' + (G === '\u099B\u09C7\u09B2\u09C7' ? 'on' : '') + '" onclick="MS.g(\'\u099B\u09C7\u09B2\u09C7\')">\uD83D\uDC66 \u099B\u09C7\u09B2\u09C7</button><button class="' + (G === '\u09AE\u09C7\u09DF\u09C7' ? 'on' : '') + '" onclick="MS.g(\'\u09AE\u09C7\u09DF\u09C7\')">\uD83D\uDC67 \u09AE\u09C7\u09DF\u09C7</button></div>';
      h += f.length ? f.map(card).join('') : '<p class="hub-empty">\u098F\u0996\u09A8\u09CB \u0995\u09CB\u09A8\u09CB \u09AA\u09CB\u09B8\u09CD\u099F \u09A8\u09C7\u0987</p>';
      h += '<button class="hub-btn" onclick="MS.form(1)">\u2795 \u09AE\u09C7\u09B8 / \u09B8\u09BF\u099F \u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C1\u09A8</button>';
    }
    w.innerHTML = h;
    var f1 = document.getElementById('msF');
    if (f1) f1.onsubmit = function (e) { e.preventDefault(); save(f1); };
  }
  function save(f) {
    if (!HUBDB.user()) { HubAuth.require(); return; }
    var m = v('ms_m');
    if (!/^01\d{9}$/.test(m)) { toast('\u09B8\u09A0\u09BF\u0995 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8 (11 \u09B8\u0982\u0996\u09CD\u09AF\u09BE)'); return; }
    f.querySelector('.hub-btn').disabled = true;
    HUBDB.addMess({ t: v('ms_t'), cond: v('ms_cond'), g: v('ms_g'), seats: v('ms_seats'), price: v('ms_price'), area: v('ms_area'), m: m, loc: v('ms_loc'), note: v('ms_note') })
      .then(function () { toast('\u2705 \u09AA\u09CB\u09B8\u09CD\u099F \u09B9\u09DF\u09C7\u099B\u09C7'); form = 0; load(); loadM(); })
      .catch(function (e) { toast('\u09B8\u09C7\u09AD \u09B9\u09DF\u09BC\u09A8\u09BF: ' + e.message); });
  }
  window.MS = {
    tab: function (t) { tab = t; form = 0; if (t === 'mine') loadM(); draw(); },
    form: function (x) {
      if (x && !HUBDB.user()) { HubAuth.require().then(loadM); return; }
      form = x; draw();
    },
    q: function (x) { Q = String(x).toLowerCase(); draw(); },
    g: function (x) { G = x; draw(); },
    del: function (id) { HUBDB.delMess(id).then(function () { toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09DF\u09C7\u099B\u09C7'); load(); loadM(); }); }
  };
  if (window.VW) VW.mess = ['\uD83C\uDFE0 Mess & Hostel', '<div id="msw"></div>', function () { load(); loadM(); }];
})();
