/* ===== HUB-TUITION :: Tuition Hub (ONE shared login + Supabase) =====
   Ek login site-jure (HubAuth) — tuition e alada login nai. */
(function () {
  var L = { t: [], p: [] }, M = { t: [], p: [] }, tab = 't', form = 0, busy = 0, msg = '';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; }); }
  function v(id) { var e = document.getElementById(id); return e ? String(e.value).trim() : ''; }
  function toast(m) { var t = document.createElement('div'); t.className = 'hub-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); }

  function load() {
    if (!window.HUBDB) return;
    busy = 1; msg = ''; draw();
    Promise.all([HUBDB.getTutors(), HUBDB.getPosts()]).then(function (r) {
      L.t = r[0]; L.p = r[1]; busy = 0; draw();
    }).catch(function (e) { msg = e.message; busy = 0; draw(); });
  }
  function loadM() {
    if (!window.HUBDB || !HUBDB.user()) return;
    Promise.all([HUBDB.myTutors(), HUBDB.myPosts()]).then(function (r) { M.t = r[0]; M.p = r[1]; draw(); });
  }

  function contact(m) {
    if (!m) return '';
    return '<div class="hub-tools" style="margin-top:10px">' +
      '<a class="hub-btn2" style="text-decoration:none" href="tel:' + esc(m) + '">📞 কল</a>' +
      '<a class="hub-btn2" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/88' + esc(String(m).replace(/^0/, '')) + '">💬 WhatsApp</a></div>';
  }
  function card(x, isT) {
    var r = [];
    if (isT) {
      if (x.ins) r.push('🎓 ' + x.ins);
      if (x.cls) r.push('📖 ' + x.cls + (x.sub ? ' — ' + x.sub : ''));
      if (x.area) r.push('📍 ' + x.area);
      if (x.sal) r.push('💰 ' + x.sal);
      if (x.exp) r.push('⏳ ' + x.exp);
    } else {
      if (x.cls) r.push('📖 ' + x.cls + (x.sub ? ' — ' + x.sub : ''));
      if (x.area) r.push('📍 ' + x.area);
      if (x.days) r.push('📅 সপ্তাহে ' + bn(x.days) + ' দিন');
      if (x.sal) r.push('💰 ' + x.sal);
      if (x.tg) r.push('🎯 ' + x.tg);
      if (x.note) r.push('📝 ' + x.note);
    }
    return '<article class="hub-card"><div class="hub-card-top"><span class="hub-chip">' + (isT ? '👨‍🏫 টিউটর' : '📌 টিউশন পোস্ট') + '</span></div>' +
      '<h4>' + esc(x.n) + '</h4><p>' + r.map(esc).join('<br>') + '</p>' + contact(x.m) + '</article>';
  }

  function tForm() {
    return '<form id="tuF" class="hub-form">' +
      '<label>নাম *</label><input id="tu_n" required>' +
      '<div class="hub-row2"><div><label>মোবাইল *</label><input id="tu_m" type="tel" maxlength="11" required></div>' +
      '<div><label>লিঙ্গ</label><select id="tu_g"><option>পুরুষ</option><option>মহিলা</option></select></div></div>' +
      '<label>শিক্ষা প্রতিষ্ঠান</label><input id="tu_ins">' +
      '<label>বিষয়</label><input id="tu_sub">' +
      '<div class="hub-row2"><div><label>স্তর</label><select id="tu_cls"><option>HSC</option><option>Honours</option><option>Degree</option><option>Masters</option><option>Class 6-10</option></select></div>' +
      '<div><label>বর্ষ</label><input id="tu_yr"></div></div>' +
      '<div class="hub-row2"><div><label>মাধ্যম</label><select id="tu_med"><option>বাংলা</option><option>ইংরেজি</option><option>দুটোই</option></select></div>' +
      '<div><label>পদ্ধতি</label><select id="tu_mode"><option>ঘরে</option><option>অনলাইন</option><option>দুটোই</option></select></div></div>' +
      '<label>এলাকা</label><input id="tu_area">' +
      '<div class="hub-row2"><div><label>বেতন</label><input id="tu_sal"></div><div><label>অভিজ্ঞতা</label><input id="tu_exp"></div></div>' +
      '<button type="submit" class="hub-btn">✅ প্রোফাইল প্রকাশ করুন</button></form>';
  }
  function pForm() {
    return '<form id="poF" class="hub-form">' +
      '<label>আপনার নাম *</label><input id="po_n" required>' +
      '<div class="hub-row2"><div><label>মোবাইল *</label><input id="po_m" type="tel" maxlength="11" required></div>' +
      '<div><label>শিক্ষার্থীর লিঙ্গ</label><select id="po_sg"><option>পুরুষ</option><option>মহিলা</option></select></div></div>' +
      '<div class="hub-row2"><div><label>শ্রেণি</label><select id="po_cls"><option>Class 6-10</option><option>HSC</option><option>Honours</option><option>Degree</option><option>Masters</option></select></div>' +
      '<div><label>মাধ্যম</label><select id="po_med"><option>বাংলা</option><option>ইংরেজি</option><option>দুটোই</option></select></div></div>' +
      '<label>বিষয়</label><input id="po_sub">' +
      '<label>এলাকা</label><input id="po_area">' +
      '<div class="hub-row2"><div><label>সপ্তাহে দিন</label><input id="po_days" type="number" min="1" max="7"></div><div><label>বেতন</label><input id="po_sal"></div></div>' +
      '<label>লক্ষ্য</label><input id="po_tg">' +
      '<label>বিস্তারিত</label><input id="po_note">' +
      '<button type="submit" class="hub-btn">✅ পোস্ট করুন</button></form>';
  }

  function draw() {
    var w = document.getElementById('tuw'); if (!w) return;
    var on = window.HUBDB && HUBDB.user();
    var h = '<div class="hub-tabs">' +
      '<button class="' + (tab === 't' ? 'on' : '') + '" onclick="TU.tab(\'t\')">👨‍🏫 টিউটর</button>' +
      '<button class="' + (tab === 'p' ? 'on' : '') + '" onclick="TU.tab(\'p\')">📌 পোস্ট</button>' +
      (on ? '<button class="' + (tab === 'm' ? 'on' : '') + '" onclick="TU.tab(\'m\')">👤 আমারটা</button>' : '') +
      '</div>';
    if (msg) h += '<p class="hub-empty">' + esc(msg) + '</p>';
    if (busy) { w.innerHTML = h + '<p class="hub-empty">লোড হচ্ছে…</p>'; return; }
    if (tab === 'm') {
      h += '<p class="hub-sub">টিউটর প্রোফাইল: <b>' + bn(M.t.length) + '</b> · পোস্ট: <b>' + bn(M.p.length) + '</b></p>';
      M.t.forEach(function (x) { h += '<article class="hub-card"><h4>' + esc(x.n) + '</h4><p>' + esc([x.cls, x.sub, x.area].filter(Boolean).join(' · ')) + '</p><div class="hub-tools"><button class="hub-btn2" onclick="TU.delT(\'' + x.id + '\')">🗑️ মুছুন</button></div></article>'; });
      M.p.forEach(function (x) { h += '<article class="hub-card"><h4>' + esc(x.n) + '</h4><p>' + esc([x.cls, x.sub, x.area].filter(Boolean).join(' · ')) + '</p><div class="hub-tools"><button class="hub-btn2" onclick="TU.delP(\'' + x.id + '\')">🗑️ মুছুন</button></div></article>'; });
    } else {
      var arr = tab === 't' ? L.t : L.p;
      if (form === tab) {
        h += (tab === 't' ? tForm() : pForm());
        h += '<button class="hub-btn2" style="margin-top:10px" onclick="TU.form(0)">⬅️ বাতিল</button>';
      } else {
        h += arr.length ? arr.map(function (x) { return card(x, tab === 't'); }).join('')
          : '<p class="hub-empty">' + (tab === 't' ? 'এখনো কোনো টিউটর প্রোফাইল নেই' : 'এখনো কোনো টিউশন পোস্ট নেই') + '</p>';
        h += '<button class="hub-btn" onclick="TU.form(\'' + tab + '\')">➕ ' + (tab === 't' ? 'টিউটর হিসেবে যুক্ত হন' : 'টিউশন পোস্ট করুন') + '</button>';
      }
    }
    w.innerHTML = h;
    var f1 = document.getElementById('tuF'); if (f1) f1.onsubmit = function (e) { e.preventDefault(); saveT(f1); };
    var f2 = document.getElementById('poF'); if (f2) f2.onsubmit = function (e) { e.preventDefault(); saveP(f2); };
  }

  function saveT(f) {
    if (!HUBDB.user()) { HubAuth.require(); return; }
    var m = v('tu_m');
    if (!/^01\d{9}$/.test(m)) { toast('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)'); return; }
    f.querySelector('.hub-btn').disabled = true;
    HUBDB.addTutor({ n: v('tu_n'), m: m, g: v('tu_g'), ins: v('tu_ins'), yr: v('tu_yr'), sub: v('tu_sub'), cls: v('tu_cls'), med: v('tu_med'), mode: v('tu_mode'), area: v('tu_area'), sal: v('tu_sal'), exp: v('tu_exp') })
      .then(function () { toast('✅ প্রোফাইল প্রকাশিত হয়েছে'); form = 0; load(); loadM(); })
      .catch(function (e) { toast('সেভ হয়নি: ' + e.message); });
  }
  function saveP(f) {
    if (!HUBDB.user()) { HubAuth.require(); return; }
    var m = v('po_m');
    if (!/^01\d{9}$/.test(m)) { toast('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)'); return; }
    f.querySelector('.hub-btn').disabled = true;
    HUBDB.addPost({ n: v('po_n'), m: m, sg: v('po_sg'), cls: v('po_cls'), sub: v('po_sub'), med: v('po_med'), area: v('po_area'), days: v('po_days'), sal: v('po_sal'), tg: v('po_tg'), note: v('po_note') })
      .then(function () { toast('✅ পোস্ট হয়েছে'); form = 0; load(); loadM(); })
      .catch(function (e) { toast('সেভ হয়নি: ' + e.message); });
  }

  window.TU = {
    tab: function (t) { tab = t; form = 0; if (t === 'm') loadM(); draw(); },
    form: function (t) {
      if (t && !HUBDB.user()) { HubAuth.require().then(loadM); return; }
      form = t; draw();
    },
    delT: function (id) { HUBDB.delTutor(id).then(function () { toast('মুছে ফেলা হয়েছে'); load(); loadM(); }); },
    delP: function (id) { HUBDB.delPost(id).then(function () { toast('মুছে ফেলা হয়েছে'); load(); loadM(); }); }
  };

  /* Old tuition.js-er registry over-write korbe (loader ses e ei file execute hoy) */
  if (window.VW) VW.tuition = ['🎓 Tuition Hub', '<div id="tuw"></div>', function () { load(); loadM(); }];
})();
