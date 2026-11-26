/* ===== Hub Notices :: Supabase + Student Hut-style UI =====
   Dependencies: hubdb.js must load first (window.HUBDB) */
(function () {
  var MBN = ['\u099C\u09BE\u09A8\u09C1\u09AF\u09BC\u09BE\u09B0\u09BF','\u09AB\u09C7\u09AC\u09CD\u09B0\u09C1\u09AF\u09BC\u09BE\u09B0\u09BF','\u09AE\u09BE\u09B0\u09CD\u099A','\u098F\u09AA\u09CD\u09B0\u09BF\u09B2','\u09AE\u09C7','\u099C\u09C1\u09A8','\u099C\u09C1\u09B2\u09BE\u0987','\u0986\u0997\u09B8\u09CD\u099F','\u09B8\u09C7\u09AA\u09CD\u099F\u09C7\u09AE\u09CD\u09AC\u09B0','\u0985\u0995\u09CD\u099F\u09CB\u09AC\u09B0','\u09A8\u09AD\u09C7\u09AE\u09CD\u09AC\u09B0','\u09A1\u09BF\u09B8\u09C7\u09AE\u09CD\u09AC\u09B0'];
  var DEF = '\u09B8\u09BE\u09A7\u09BE\u09B0\u09A3', RED = '\u099C\u09B0\u09C1\u09B0\u09BF';
  var CATS = [DEF,'\u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE','\u09AD\u09B0\u09CD\u09A4\u09BF','\u09AB\u09B0\u09AE \u09AA\u09C2\u09B0\u09A3','\u09AB\u09B2\u09BE\u09AB\u09B2',RED,'\u098F\u0995\u09BE\u09A1\u09C7\u09AE\u09BF\u0995'];
  var DEPTS = ['', 'English', 'Bangla', 'History', 'Islamic History and Culture', 'Islamic Studies', 'Philosophy', 'Political Science', 'Economics', 'Sociology', 'Social Work', 'Psychology', 'Geography and Environment', 'Management', 'Accounting', 'Marketing', 'Finance and Banking', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'Statistics'];
  var items = [], busy = false, msg = '', mode = 'list', admin = null;

  function toast(m){var t=document.createElement('div');t.className='hub-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3500)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function bn(n){return String(n).replace(/\d/g,function(d){return '\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]})}

  function load() {
    busy = true; msg = ''; draw();
    HUBDB.getNotices().then(function (n) { items = n; busy = false; draw(); })
      .catch(function (e) { msg = '\u09A8\u09CB\u099F\u09BF\u09B6 \u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09A8\u09BF: ' + e.message; items = []; busy = false; draw(); });
  }

  function card(n) {
    var d = (n.d || '').slice(0, 10), p = d.split('-');
    var ds = p.length === 3 ? bn(+p[2] + ' ' + MBN[+p[1] - 1] + ', ' + p[0]) : '';
    return '<article class="hub-card">' +
      '<div class="hub-card-top"><span class="hub-chip' + (n.c === RED ? ' red' : '') + '">' + esc(n.c || DEF) + '</span>' +
      (n.dept ? '<span class="hub-chip">' + esc(n.dept) + '</span>' : '') +
      '<span class="hub-date">' + ds + '</span></div>' +
      '<h4>' + esc(n.t) + '</h4>' +
      (n.x ? '<p>' + esc(n.x) + '</p>' : '') +
      (n.u ? '<a class="hub-link" target="_blank" rel="noopener" href="' + esc(n.u) + '">\uD83D\uDD17 \u09B2\u09BF\u0982\u0995</a>' : '') +
      '</article>';
  }

  function listUI() {
    if (busy) return '<p class="hub-empty">\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7\u2026</p>';
    if (msg) return '<p class="hub-empty">' + esc(msg) + '</p>';
    if (!items.length) return '<p class="hub-empty">\u098F\u0996\u09A8\u09CB \u0995\u09CB\u09A8\u09CB \u09A8\u09CB\u099F\u09BF\u09B6 \u09A8\u09C7\u0987\u0964 \u09A8\u09A4\u09C1\u09A8 \u09A8\u09CB\u099F\u09BF\u09B6 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6 \u09B9\u09AC\u09C7 \u098F\u0996\u09BE\u09A8\u09C7\u0964</p>';
    return items.map(card).join('');
  }

  function formUI() {
    return '<form id="ntcForm" class="hub-form">' +
      '<label>\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE *</label><input id="nt_t" required>' +
      '<div class="hub-row2"><div><label>\u09A7\u09B0\u09A8</label><select id="nt_c">' + CATS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div><label>\u09AC\u09BF\u09AD\u09BE\u0997</label><select id="nt_d">' + DEPTS.map(function (x) { return '<option value="' + x + '">' + (x || '\u09B8\u09AC \u09AC\u09BF\u09AD\u09BE\u0997') + '</option>'; }).join('') + '</select></div></div>' +
      '<label>\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4</label><textarea id="nt_x"></textarea>' +
      '<label>\u09B2\u09BF\u0982\u0995 (\u0990\u099A\u09CD\u099B\u09BF\u0995)</label><input id="nt_u" type="url" placeholder="https://...">' +
      '<label>\u09A4\u09BE\u09B0\u09BF\u0996</label><input id="nt_d2" type="date" value="' + HUBDB.today() + '">' +
      '<button type="submit" id="nt_btn" class="hub-btn">\u09AA\u09CD\u09B0\u0995\u09BE\u09B6 \u0995\u09B0\u09C1\u09A8</button></form>';
  }

  function checkAdmin() {
    if (!HUBDB.user()) { admin = null; return; }
    HUBDB.isAdmin().then(function (ok) { admin = !!ok; draw(); }).catch(function () {});
  }

  function draw() {
    var w = document.getElementById('ntw'); if (!w) return;
    var h = '';
    if (HUBDB.user() && admin) h += '<div class="hub-tools"><button class="hub-btn2" id="ntNew">' + (mode === 'form' ? '\u2190 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AF\u09BC \u09AB\u09BF\u09B0\u09C1\u09A8' : '\uFF0B \u09A8\u09A4\u09C1\u09A8 \u09A8\u09CB\u099F\u09BF\u09B6') + '</button></div>';
    h += mode === 'form' ? formUI() : listUI();
    w.innerHTML = h;
    var nb = document.getElementById('ntNew');
    if (nb) nb.onclick = function () { mode = mode === 'form' ? 'list' : 'form'; draw(); };
    if (mode === 'form') {
      document.getElementById('ntcForm').onsubmit = function (e) {
        e.preventDefault();
        var b = document.getElementById('nt_btn'); b.disabled = true;
        HUBDB.addNotice({
          t: document.getElementById('nt_t').value.trim(),
          x: document.getElementById('nt_x').value.trim(),
          c: document.getElementById('nt_c').value,
          dept: document.getElementById('nt_d').value || null,
          u: document.getElementById('nt_u').value.trim() || null,
          d: document.getElementById('nt_d2').value || null
        }).then(function () { toast('\u2705 \u09A8\u09CB\u099F\u09BF\u09B6 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6\u09BF\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7'); mode = 'list'; load(); })
          .catch(function (er) { b.disabled = false; toast('\u09B8\u09C7\u09AD \u09B9\u09AF\u09BC\u09A8\u09BF: ' + er.message); });
      };
    }
  }

  /* Hub view register (replaces old static notice board) */
  if (window.VW) VW.notice = ['\uD83D\uDCE2 College Notice Board', '<div id="ntw"></div>', function () { load(); checkAdmin(); }];

  /* Hub tile add (only if missing) */
  function addTile() {
    if (!window.HUB || !document.getElementById('hg')) return;
    var has = HUB.some(function (h) { return h[1] === 'notice'; });
    if (!has) HUB.push(['\uD83D\uDCE2', 'notice', '\u09A8\u09CB\u099F\u09BF\u09B6', '\u0995\u09B2\u09C7\u099C\u09C7\u09B0 \u09B8\u09AC \u0986\u09AA\u09A1\u09C7\u099F \u098F\u0995 \u099C\u09BE\u09AF\u09BC\u0997\u09BE\u09AF\u09BC', 'live']);
    document.getElementById('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>\u099A\u09BE\u09B2\u09C1 \u0986\u099B\u09C7</em>' : '<em class="soon">\u09B6\u09C0\u0998\u09CD\u09B0\u0987 \u0986\u09B8\u099B\u09C7</em>') + '</button>'; }).join('');
  }
  var go = function () { setTimeout(addTile, 0); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
