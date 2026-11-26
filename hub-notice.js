/* ===== Hub Notices :: Supabase + Student Hut-style UI =====
   Dependencies: hubdb.js age load thakte hobe (window.HUBDB) */
(function () {
  var MBN = ['à¦œà¦¾à¦¨à§à¦¯à¦¼à¦¾à¦°à¦¿','à¦«à§‡à¦¬à§à¦°à§à¦¯à¦¼à¦¾à¦°à¦¿','à¦®à¦¾à¦°à§à¦š','à¦à¦ªà§à¦°à¦¿à¦²','à¦®à§‡','à¦œà§à¦¨','à¦œà§à¦²à¦¾à¦‡','à¦†à¦—à¦¸à§à¦Ÿ','à¦¸à§‡à¦ªà§à¦Ÿà§‡à¦®à§à¦¬à¦°','à¦…à¦•à§à¦Ÿà§‹à¦¬à¦°','à¦¨à¦­à§‡à¦®à§à¦¬à¦°','à¦¡à¦¿à¦¸à§‡à¦®à§à¦¬à¦°'];
  var items = [], busy = false, msg = '', mode = 'list';
  var CATS = ['à¦¸à¦¾à¦§à¦¾à¦°à¦£','à¦ªà¦°à§€à¦•à§à¦·à¦¾','à¦­à¦°à§à¦¤à¦¿','à¦«à¦°à¦® à¦ªà§‚à¦°à¦£','à¦«à¦²à¦¾à¦«à¦²','à¦œà¦°à§à¦°à¦¿','à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦•'];
  var DEPTS = ['', 'English', 'Bangla', 'History', 'Islamic History and Culture', 'Islamic Studies', 'Philosophy', 'Political Science', 'Economics', 'Sociology', 'Social Work', 'Psychology', 'Geography and Environment', 'Management', 'Accounting', 'Marketing', 'Finance and Banking', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'Statistics'];
  var admin = null;

  function toast(m){var t=document.createElement('div');t.className='hub-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3500)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function bn(n){return String(n).replace(/\d/g,function(d){return 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[+d]})}

  function load() {
    busy = true; msg = ''; draw();
    HUBDB.getNotices().then(function (n) { items = n; busy = false; draw(); })
      .catch(function (e) { msg = 'à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦²à§‹à¦¡ à¦¹à¦¯à¦¼à¦¨à¦¿: ' + e.message; items = []; busy = false; draw(); });
  }

  function card(n) {
    var d = (n.d || '').slice(0, 10), p = d.split('-');
    var ds = p.length === 3 ? bn(+p[2] + ' ' + MBN[+p[1] - 1] + ', ' + p[0]) : '';
    return '<article class="hub-card">' +
      '<div class="hub-card-top"><span class="hub-chip' + (n.c === 'à¦œà¦°à§à¦°à¦¿' ? ' red' : '') + '">' + esc(n.c || 'à¦¸à¦¾à¦§à¦¾à¦°à¦£') + '</span>' +
      (n.dept ? '<span class="hub-chip">' + esc(n.dept) + '</span>' : '') +
      '<span class="hub-date">' + ds + '</span></div>' +
      '<h4>' + esc(n.t) + '</h4>' +
      (n.x ? '<p>' + esc(n.x) + '</p>' : '') +
      (n.u ? '<a class="hub-link" target="_blank" rel="noopener" href="' + esc(n.u) + '">ðŸ”— à¦²à¦¿à¦‚à¦•</a>' : '') +
      '</article>';
  }

  function listUI() {
    if (busy) return '<p class="hub-empty">à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡â€¦</p>';
    if (msg) return '<p class="hub-empty">' + esc(msg) + '</p>';
    if (!items.length) return '<p class="hub-empty">à¦à¦–à¦¨à§‹ à¦•à§‹à¦¨à§‹ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¨à§‡à¦‡à¥¤ à¦¨à¦¤à§à¦¨ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦¹à¦¬à§‡ à¦à¦–à¦¾à¦¨à§‡à¥¤</p>';
    return items.map(card).join('');
  }

  function formUI() {
    return '<form id="ntcForm" class="hub-form">' +
      '<label>à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® *</label><input id="nt_t" required>' +
      '<div class="hub-row2"><div><label>à¦§à¦°à¦¨</label><select id="nt_c">' + CATS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div><label>à¦¬à¦¿à¦­à¦¾à¦—</label><select id="nt_d">' + DEPTS.map(function (x) { return '<option value="' + x + '">' + (x || 'à¦¸à¦¬ à¦¬à¦¿à¦­à¦¾à¦—') + '</option>'; }).join('') + '</select></div></div>' +
      '<label>à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤</label><textarea id="nt_x"></textarea>' +
      '<label>à¦²à¦¿à¦‚à¦• (à¦à¦šà§à¦›à¦¿à¦•)</label><input id="nt_u" type="url" placeholder="https://â€¦">' +
      '<label>à¦¤à¦¾à¦°à¦¿à¦–</label><input id="nt_d2" type="date" value="' + HUBDB.today() + '">' +
      '<button type="submit" id="nt_btn" class="hub-btn">à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à§à¦¨</button></form>';
  }

  function checkAdmin() {
    if (!HUBDB.user()) { admin = null; return; }
    HUBDB.isAdmin().then(function (ok) { admin = !!ok; draw(); }).catch(function () {});
  }

  function draw() {
    var w = document.getElementById('ntw'); if (!w) return;
    var logged = !!HUBDB.user();
    var h = '';
    if (logged && admin) h += '<div class="hub-tools"><button class="hub-btn2" id="ntNew">' + (mode === 'form' ? 'â† à¦¤à¦¾à¦²à¦¿à¦•à¦¾à¦¯à¦¼ à¦«à¦¿à¦°à§à¦¨' : 'ï¼‹ à¦¨à¦¤à§à¦¨ à¦¨à§‹à¦Ÿà¦¿à¦¶') + '</button></div>';
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
        }).then(function () { toast('âœ… à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà§à¦°à¦•à¦¾à¦¶à¦¿à¦¤ à¦¹à¦¯à¦¼à§‡à¦›à§‡'); mode = 'list'; load(); })
          .catch(function (er) { b.disabled = false; toast('à¦¸à§‡à¦­ à¦¹à¦¯à¦¼à¦¨à¦¿: ' + er.message); });
      };
    }
  }

  /* ---- Hub view register (purono static notice board-er bodole) ---- */
  if (window.VW) VW.notice = ['ðŸ“¢ College Notice Board', '<div id="ntw"></div>', function () { load(); checkAdmin(); }];

  /* ---- Hub tile jog (jodi na thake) ---- */
  function addTile() {
    if (!window.HUB || !document.getElementById('hg')) return;
    var has = HUB.some(function (h) { return h[1] === 'notice'; });
    if (!has) HUB.push(['ðŸ“¢', 'notice', 'à¦¨à§‹à¦Ÿà¦¿à¦¶', 'à¦•à¦²à§‡à¦œà§‡à¦° à¦¸à¦¬ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦à¦• à¦œà¦¾à¦¯à¦¼à¦—à¦¾à¦¯à¦¼', 'live']);
    document.getElementById('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>à¦šà¦¾à¦²à§ à¦†à¦›à§‡</em>' : '<em class="soon">à¦¶à§€à¦˜à§à¦°à¦‡ à¦†à¦¸à¦›à§‡</em>') + '</button>'; }).join('');
  }
  var go = function () { setTimeout(addTile, 0); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
