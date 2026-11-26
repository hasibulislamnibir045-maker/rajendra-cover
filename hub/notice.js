/* ===== Hub Notices: Supabase + Hut-style UI ===== */
/* Table: notices (id, created_at, title, cat, dept, link, body, created_by) */
(function () {
  var MBN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  var items = [], busy = false, msg = '', mode = 'list';
  var CATS = ['সাধারণ', 'পরীক্ষা', 'ভর্তি', 'ছুটি', 'ফলাফল', 'জরুরি'];
  var DEPTS = ['', 'English', 'Bangla', 'History', 'Islamic History and Culture', 'Islamic Studies', 'Philosophy', 'Political Science', 'Economics', 'Sociology', 'Social Work', 'Psychology', 'Geography and Environment', 'Management', 'Accounting', 'Marketing', 'Finance and Banking', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'Statistics'];

  function load() {
    busy = true; msg = ''; draw();
    return SB.c().from('notices').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) { msg = 'নোটিশ লোড হয়নি: ' + r.error.message; items = []; }
      else items = r.data || [];
      busy = false; draw();
    });
  }

  function card(n) {
    var esc = SB.esc, bn = SB.bn;
    var d = n.created_at ? new Date(n.created_at) : new Date();
    var ds = bn(d.getDate() + ' ' + MBN[d.getMonth()] + ', ' + d.getFullYear());
    return '<article class="hub-card">' +
      '<div class="hub-card-top"><span class="hub-chip ' + (n.cat === 'জরুরি' ? 'red' : '') + '">' + esc(n.cat || 'সাধারণ') + '</span>' +
      (n.dept ? '<span class="hub-chip">' + esc(n.dept) + '</span>' : '') +
      '<span class="hub-date">' + ds + '</span></div>' +
      '<h4>' + esc(n.title) + '</h4>' +
      (n.body ? '<p>' + esc(n.body) + '</p>' : '') +
      (n.link ? '<a class="hub-link" target="_blank" rel="noopener" href="' + esc(n.link) + '">🔗 লিংক</a>' : '') +
      '</article>';
  }

  function listUI() {
    if (busy) return '<p class="hub-empty">লোড হচ্ছে…</p>';
    if (msg) return '<p class="hub-empty">' + SB.esc(msg) + '</p>';
    if (!items.length) return '<p class="hub-empty">এখনো কোনো নোটিশ নেই। প্রথম নোটিশটি খুব শীঘ্রই আসবে।</p>';
    return items.map(card).join('');
  }

  function formUI() {
    return '<form id="ntcForm" class="hub-form">' +
      '<label>শিরোনাম *</label><input id="nt_t" required>' +
      '<div class="hub-row2"><div><label>ধরন</label><select id="nt_c">' + CATS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div><label>বিভাগ (খালি = সবার জন্য)</label><select id="nt_d">' + DEPTS.map(function (x) { return '<option value="' + x + '">' + (x || 'সব বিভাগ') + '</option>'; }).join('') + '</select></div></div>' +
      '<label>বিবরণ</label><textarea id="nt_x"></textarea>' +
      '<label>লিংক (ঐচ্ছিক)</label><input id="nt_u" type="url" placeholder="https://…">' +
      '<button class="hub-btn">প্রকাশ করুন</button></form>';
  }

  function isAdmin() { var p = SB.ld('rsh_admin_cache', null); return !!(p && p.is_admin); }
  function checkAdmin() {
    var u = SB.user(); if (!u) return;
    SB.c().from('profiles').select('is_admin').eq('id', u.id).maybeSingle().then(function (r) {
      if (!r.error && r.data) SB.sv('rsh_admin_cache', r.data);
    });
  }

  function draw() {
    var w = document.getElementById('ntw'); if (!w) return;
    var h = '';
    if (SB.user() && isAdmin()) h += '<div class="hub-tools"><button class="hub-btn2" id="ntNew">' + (mode === 'form' ? '← তালিকায় ফিরুন' : '＋ নতুন নোটিশ') + '</button></div>';
    h += mode === 'form' ? formUI() : listUI();
    w.innerHTML = h;
    var nb = document.getElementById('ntNew');
    if (nb) nb.onclick = function () { mode = mode === 'form' ? 'list' : 'form'; draw(); };
    if (mode === 'form') {
      var f = document.getElementById('ntcForm');
      f.onsubmit = function (e) {
        e.preventDefault();
        var row = { title: document.getElementById('nt_t').value.trim(), cat: document.getElementById('nt_c').value, dept: document.getElementById('nt_d').value || null, body: document.getElementById('nt_x').value.trim(), link: document.getElementById('nt_u').value.trim() || null, created_by: SB.user().id };
        SB.c().from('notices').insert(row).then(function (r) {
          if (r.error) { SB.toast('সেভ হয়নি: ' + r.error.message); return; }
          SB.toast('নোটিশ প্রকাশিত হয়েছে'); mode = 'list'; load();
        });
      };
    }
  }

  /* Hub tile-er jonno public interface */
  window.HUBNOTICE = {
    open: function () {
      if (typeof openV === 'function') { openV('notice'); }
      load(); checkAdmin();
    }
  };
  /* existing hub view system-e notice view register (VW available thakle) */
  if (window.VW) VW.notice = ['📢 নোটিশ', '<div id="ntw"></div>', function () { load(); checkAdmin(); }];
})();
