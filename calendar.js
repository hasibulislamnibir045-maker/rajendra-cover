/* ===== Student Calendar: Study Planner-er exam ar goal ekhane highlight hoy ===== */
(function () {
  var WD = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  var cur = new Date(); cur.setDate(1);
  var sel = '';

  function pad(n) { return String(n).padStart(2, '0'); }
  function key(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function data() { return { ex: ld('rsh_ex', []), tk: ld('rsh_tk', []) }; }
  function bnDay(s) { var p = s.split('-'); return bn(+p[2] + ' ' + MBN[+p[1] - 1] + ', ' + p[0]); }

  window.calR = function () {
    var box = document.getElementById('calbox'); if (!box) return;
    var y = cur.getFullYear(), m = cur.getMonth(), D = data();
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    var today = new Date(), tk = key(today.getFullYear(), today.getMonth(), today.getDate());
    var ex = {}, go = {};
    D.ex.forEach(function (e) { (ex[e.d] = ex[e.d] || []).push(e.n); });
    D.tk.forEach(function (t) { if (t.d) (go[t.d] = go[t.d] || []).push(t); });
    var rt = {}, hasRt = window.stuIn && stuIn();
    if (hasRt) for (var q = 1; q <= days; q++) { var kk = key(y, m, q), L = stuRt(kk); if (L.length) rt[kk] = L; }

    var h = '<div class="cal-h"><button class="ib" id="calP">‹</button><b>' + MBN[m] + ' ' + bn(y) +
      '</b><button class="ib" id="calN">›</button></div><div class="cal-g">';
    WD.forEach(function (w) { h += '<div class="cal-w">' + w + '</div>'; });
    for (var i = 0; i < first; i++) h += '<div class="cal-d off"></div>';
    for (var d = 1; d <= days; d++) {
      var k = key(y, m, d), c = 'cal-d';
      if (ex[k]) c += ' ex'; else if (go[k]) c += ' go'; else if (rt[k]) c += ' rt';
      if (k === tk) c += ' td';
      if (k === sel) c += ' sl';
      var dots = (ex[k] ? '<i class="dx"></i>' : '') + (go[k] ? '<i class="dg2"></i>' : '') + (rt[k] ? '<i class="dr"></i>' : '');
      h += '<button class="' + c + '" data-k="' + k + '"><span>' + bn(d) + '</span>' + dots + '</button>';
    }
    h += '</div><div class="cal-l"><span><i class="dx"></i> পরীক্ষা</span><span><i class="dg2"></i> লক্ষ্য / প্ল্যান</span><span><i class="dt2"></i> আজ</span>' + (hasRt ? '<span><i class="dr"></i> আপনার ক্লাস রুটিন</span>' : '') + '</div>';

    // selected day panel
    if (sel) {
      var items = (rt[sel] || []).map(function (r) {
        var tm = r.st ? bn(r.st) + (r.en ? '–' + bn(r.en) : '') : '';
        return '<div class="ex rtl ' + esc(r.k) + '"><span><b>' + esc(r.sub) + '</b> <small>' + ({ exam: '📝 পরীক্ষা', holiday: '🏖️ ছুটি' }[r.k] || '📘 ক্লাস') + '</small><br><small style="color:var(--muted)">' +
          [tm && '⏰ ' + tm, r.tch && '👨‍🏫 ' + esc(r.tch), r.room && '🚪 ' + esc(r.room)].filter(Boolean).join(' · ') + '</small></span></div>';
      }).concat((ex[sel] || []).map(function (n) { return '<div class="ex"><span>📚 <b>' + esc(n) + '</b></span></div>'; }))
        .concat((go[sel] || []).map(function (t) { return '<div class="ex"><span>' + (t.k ? '✅' : '🎯') + ' ' + esc(t.n) + '</span></div>'; }));
      h += '<div class="cal-p"><b>' + bnDay(sel) + '</b>' + (items.join('') || '<p class="cal-e">এই দিনে কিছু নেই</p>') +
        '<div class="mini" style="grid-template-columns:1fr auto auto"><input id="calT" placeholder="নতুন লক্ষ্য / পরীক্ষার নাম">' +
        '<button class="ib" id="calAG">+ লক্ষ্য</button><button class="ib" id="calAE">+ পরীক্ষা</button></div></div>';
    } else {
      h += '<p class="cal-e">কোনো তারিখে ক্লিক করুন, সেখানে লক্ষ্য বা পরীক্ষা যোগ করতে পারবেন।</p>';
    }
    box.innerHTML = h;
  };

  function mount() {
    var s = document.getElementById('calsec'); if (!s) return;
    s.innerHTML = '<h2>📅 Student Calendar</h2><p>Study Planner-এর পরীক্ষা ও লক্ষ্য হাইলাইট হবে। Student Login করলে আপনার ক্লাসের রুটিনও (নীল রঙে) দেখাবে</p><div class="cal" id="calbox"></div>';
    document.getElementById('calbox').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.id === 'calP') { cur.setMonth(cur.getMonth() - 1); calR(); return; }
      if (b.id === 'calN') { cur.setMonth(cur.getMonth() + 1); calR(); return; }
      if (b.dataset.k) { sel = sel === b.dataset.k ? '' : b.dataset.k; calR(); return; }
      var t = document.getElementById('calT'), v = t && t.value.trim();
      if (!v || !sel) return;
      if (b.id === 'calAG') { var a = ld('rsh_tk', []); a.push({ n: v, k: 0, d: sel }); sv('rsh_tk', a); }
      if (b.id === 'calAE') { var x = ld('rsh_ex', []); x.push({ n: v, d: sel }); sv('rsh_ex', x); }
      calR();
    });
    calR();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

/* ===== Hub boot loader: Supabase-based hub features load hoy ekhane theke ===== */
(function () {
  function css(u) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l); }
  function js(u, cb) { var s = document.createElement('script'); s.src = u; if (cb) s.onload = cb; document.head.appendChild(s); }
  function start() {
    css('hub/hub.css');
    var chain = function () { js('hub/sb.js', function () { js('hub/notice.js'); }); };
    if (typeof supabase === 'undefined') js('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', chain);
    else chain();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
