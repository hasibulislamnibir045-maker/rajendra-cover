/* ===== Tuition Hub v2: professional tuition platform style (CareTutors/TutorSheba-inspired)
   Full-page experience (no popup feel) · Hero + quick actions · Stats · Job cards · Tutor cards
   Feed · Dashboard · Admin approval (login/tlist/tset — backend v3 actions) ===== */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbxM3COcrkebmp17kL8tOEM3SbIYbmffrQW1ISx2qvhwer3VeeocQoo_EqxULxkPZuId/exec'; // Apps Script Web app URL ekhane boshan
  window.RSH_API = API;
  var ST = { t: [], p: [], tab: 'feed', q: '', cr: ld('rsh_tu_cr', null), my: null, ad: null, au: '', ap: '', adT: [], adP: [], msg: '' };
  var LB = { pending: 'অনুমোদনের অপেক্ষায়', approved: 'চালু আছে', rejected: 'বাতিল', confirmed: 'টিউটর ঠিক হয়েছে' };
  var MED = 'sel:বাংলা মাধ্যম,ইংরেজি ভার্সন,ইংরেজি মাধ্যম,মাদ্রাসা';
  var TF = [['n', 'নাম *'], ['m', 'মোবাইল *', '01XXXXXXXXX'], ['g', 'লিঙ্গ', 'sel:ছেলে,মেয়ে'], ['ins', 'প্রতিষ্ঠান / বিভাগ *', 'Rajendra College, English'], ['yr', 'বর্ষ / যোগ্যতা', 'Honours 2nd year'],
    ['sub', 'যে বিষয় পড়াবেন *', 'বাংলা, ইংরেজি, গণিত'], ['cls', 'যে ক্লাস পড়াবেন *', '৬ষ্ঠ - ১০ম'], ['med', 'মাধ্যম', MED], ['area', 'এলাকা *', 'Faridpur Sadar'],
    ['mode', 'পদ্ধতি', 'sel:বাসায় গিয়ে,অনলাইন,দুটোই'], ['sal', 'প্রত্যাশিত বেতন', '২৫০০-৩০০০'], ['exp', 'অভিজ্ঞতা', 'যেমন: ২ বছর'], ['pin', 'নিজের ৪ সংখ্যার PIN *', 'মনে রাখবেন']];
  var PF = [['n', 'অভিভাবকের নাম *'], ['m', 'মোবাইল *', '01XXXXXXXXX'], ['cls', 'ছাত্র/ছাত্রীর ক্লাস *', 'যেমন: ৮ম'], ['sg', 'ছাত্র / ছাত্রী', 'sel:ছেলে,মেয়ে'], ['sub', 'বিষয় *', 'সব বিষয় / গণিত, ইংরেজি'],
    ['med', 'মাধ্যম', MED], ['area', 'ঠিকানা / এলাকা *'], ['days', 'সপ্তাহে কয়দিন', '৩ / ৫ / ৬'], ['sal', 'বেতন (টাকা)', '২০০০'], ['tg', 'টিউটর কেমন চান', 'sel:যে কেউ,ছেলে টিউটর,মেয়ে টিউটর'],
    ['note', 'অন্যান্য তথ্য', 'সময়, শর্ত ইত্যাদি', 'w'], ['pin', 'নিজের ৪ সংখ্যার PIN *', 'মনে রাখবেন']];

  function api(a, d) {
    if (!/^https/.test(API)) return Promise.reject(new Error('API'));
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ a: a }, d || {})) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.err) throw new Error(j.err); return j; });
  }
  function fail(e) { toast(e.message === 'API' ? 'Admin এখনো Apps Script URL বসায়নি' : (e.message || 'সার্ভারে সমস্যা, আবার চেষ্টা করুন'), 'err'); }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'tu-toast ' + (kind || 'ok');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 350); }, 3200);
  }
  function fi(p, f) {
    var id = p + f[0], ph = f[2] || '', h = '<div' + (f[3] === 'w' ? ' style="grid-column:1/-1"' : '') + '><label>' + f[1] + '</label>';
    if (ph.indexOf('sel:') === 0) h += '<select id="' + id + '">' + ph.slice(4).split(',').map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>';
    else if (f[3] === 'w') h += '<textarea id="' + id + '" placeholder="' + ph + '"></textarea>';
    else h += '<input id="' + id + '" placeholder="' + ph + '"' + (f[0] === 'pin' ? ' type="tel" maxlength="4"' : f[0] === 'm' ? ' type="tel" maxlength="11"' : '') + '>';
    return h + '</div>';
  }
  function tel(m) { return String(m || '').replace(/\D/g, ''); }
  function av(n, g) {
    var c = g === 'মেয়ে' ? 'f' : 'm';
    return '<span class="tu-av ' + c + '">' + esc((n || '?').trim().charAt(0)) + '</span>';
  }
  function call(m) { return '<a class="tu-cta call" href="tel:' + tel(m) + '">📞 কল</a><a class="tu-cta wa" target="_blank" rel="noopener" href="https://wa.me/88' + tel(m) + '">💬 WhatsApp</a>'; }
  function kv(k, v) { return v ? '<span class="tu-kv"><b>' + k + '</b>' + esc(v) + '</span>' : ''; }
  function badge(s) { return '<span class="tub ' + s + '">' + (LB[s] || s) + '</span>'; }

  /* ---------- Job card (tuition post) — professional platform style ---------- */
  function jobC(p, mode) {
    var h = '<article class="tu-card job">' +
      '<div class="tu-card-top">' + av(p.n, p.sg) +
      '<div class="tu-who"><b>' + esc(p.n) + '</b><small>অভিভাবক · ' + esc(p.area) + '</small></div>' +
      (mode ? badge(p.status) : '<span class="tu-chip live">● লাইভ টিউশন</span>') + '</div>' +
      '<div class="tu-row"><div class="tu-sal"><small>মাসিক বেতন</small><b>৳' + esc(p.sal) + '</b></div></div>' +
      '<div class="tu-grid">' +
      kv('ক্লাস', p.cls) + kv('বিষয়', p.sub) + kv('ছাত্র/ছাত্রী', p.sg) +
      kv('মাধ্যম', p.med) + kv('সপ্তাহে', p.days) + kv('টিউটর চান', p.tg) +
      '</div>' +
      (p.note ? '<p class="tu-note">📌 ' + esc(p.note) + '</p>' : '') +
      '<div class="tu-act">';
    if (!mode || mode === 'ad') h += call(p.m);
    if (mode === 'my') {
      if (p.status !== 'confirmed') h += '<button class="tu-cta ok" onclick="TU.own(\'confirm\',\'post\',\'' + p.id + '\')">🎉 টিউটর ঠিক হয়েছে</button>';
      h += '<button class="tu-cta del" onclick="TU.own(\'del\',\'post\',\'' + p.id + '\')">🗑 মুছুন</button>';
    }
    if (mode === 'ad') h += adBtn('post', p);
    return h + '</div></article>';
  }

  /* ---------- Tutor card — professional platform style ---------- */
  function tutorC(t, mode) {
    var h = '<article class="tu-card tutor">' +
      '<div class="tu-card-top">' + av(t.n, t.g) +
      '<div class="tu-who"><b>' + esc(t.n) + '</b><small>' + esc(t.ins) + (t.yr ? ' · ' + esc(t.yr) : '') + '</small></div>' +
      (mode ? badge(t.status) : '<span class="tu-chip verify">✔ ভেরিফাইড টিউটর</span>') + '</div>' +
      '<div class="tu-grid">' +
      kv('বিষয়', t.sub) + kv('ক্লাস', t.cls) + kv('মাধ্যম', t.med) +
      kv('এলাকা', t.area) + kv('পদ্ধতি', t.mode) + kv('অভিজ্ঞতা', t.exp) +
      '</div>' +
      (t.sal ? '<div class="tu-row"><div class="tu-sal"><small>প্রত্যাশিত বেতন</small><b>৳' + esc(t.sal) + '</b></div></div>' : '') +
      '<div class="tu-act">';
    if (!mode || mode === 'ad') h += call(t.m);
    if (mode === 'my') h += '<button class="tu-cta del" onclick="TU.own(\'del\',\'tutor\',\'' + t.id + '\')">🗑 মুছুন</button>';
    if (mode === 'ad') h += adBtn('tutor', t);
    return h + '</div></article>';
  }
  function adBtn(t, o) {
    var b = function (s, l) { return '<button class="tu-cta" onclick="TU.aset(\'' + t + '\',\'' + o.id + '\',\'' + s + '\')">' + l + '</button>'; };
    return (o.status !== 'approved' ? b('approved', '✅ অনুমোদন') : '') + (o.status !== 'rejected' ? b('rejected', '❌ বাতিল') : '') +
      (t === 'post' && o.status !== 'confirmed' ? b('confirmed', '🎉 কনফার্ম') : '') + b('delete', '🗑');
  }

  function searchBox(ph) {
    return '<input class="tu-search" placeholder="' + ph + '" value="' + esc(ST.q) + '" oninput="TU.s(this.value)">';
  }
  function listHTML(arr, fn, empty) {
    var q = ST.q.toLowerCase(), a = arr.filter(function (x) { return !q || JSON.stringify(x).toLowerCase().indexOf(q) > -1; });
    return a.map(fn).join('') || '<div class="tu-empty">🔎 ' + empty + '</div>';
  }
  function approved(a) { return a.filter(function (x) { return x.status === 'approved'; }); }

  /* ---------- Views ---------- */
  function hero() {
    return '<div class="tu-hero"><div class="tu-hero-in">' +
      '<h2>🎓 Rajendra <span>Tuition Hub</span></h2>' +
      '<p>এলাকার ভেরিফাইড টিউটর খুঁজুন, অথবা আপনার টিউশনের প্রয়োজন পোস্ট করুন — সবকিছু এক জায়গায়</p>' +
      '<div class="tu-hero-btns">' +
      '<button class="tu-btn big pr" onclick="TU.go(\'rp\')">📌 টিউশন পোস্ট করুন</button>' +
      '<button class="tu-btn big gh" onclick="TU.go(\'rt\')">🎓 টিউটর হিসেবে যোগ দিন</button>' +
      '</div></div></div>';
  }
  function stats() {
    return '<div class="tu-stats">' +
      '<div class="tu-stat"><b>' + bn(approved(ST.p).length) + '</b><small>লাইভ টিউশন</small></div>' +
      '<div class="tu-stat"><b>' + bn(approved(ST.t).length) + '</b><small>ভেরিফাইড টিউটর</small></div>' +
      '<div class="tu-stat"><b>৳</b><small>স্বচ্ছ বেতন</small></div>' +
      '<div class="tu-stat"><b>✔</b><small>Admin যাচাইকৃত</small></div>' +
      '</div>';
  }
  function feedBody() {
    var P = approved(ST.p), T = approved(ST.t), cards = '';
    if (ST.q) {
      var q = ST.q.toLowerCase();
      cards = [].concat(P, T).filter(function (x) { return JSON.stringify(x).toLowerCase().indexOf(q) > -1; })
        .map(function (x) { return x.cls ? jobC(x) : tutorC(x); }).join('') || '<div class="tu-empty">🔎 কিছু পাওয়া যায়নি</div>';
    } else {
      cards = P.map(function (x) { return jobC(x); }).join('') + T.map(function (x) { return tutorC(x); }).join('');
    }
    return searchBox('🔎 বিষয় / ক্লাস / এলাকা দিয়ে খুঁজুন…') +
      '<div class="tu-feed">' + (cards || '<div class="tu-empty">এখনো কোনো অনুমোদিত পোস্ট নেই। প্রথম পোস্টটি আপনি করুন!</div>') + '</div>';
  }
  function jobsBody() {
    return searchBox('🔎 বিষয় / ক্লাস / এলাকা দিয়ে খুঁজুন…') +
      '<div class="tu-feed">' + listHTML(approved(ST.p), function (x) { return jobC(x); }, 'এখন কোনো লাইভ টিউশন পোস্ট নেই') + '</div>';
  }
  function tutorsBody() {
    return searchBox('🔎 নাম / বিষয় / এলাকা দিয়ে খুঁজুন…') +
      '<div class="tu-feed">' + listHTML(approved(ST.t), function (x) { return tutorC(x); }, 'এখন কোনো ভেরিফাইড টিউটর নেই') + '</div>';
  }
  function formBody(t) {
    var T = t === 'rt', F = T ? TF : PF, p = T ? 't_' : 'p_';
    return '<h3 class="tu-h3">' + (T ? '🎓 টিউটর রেজিস্ট্রেশন' : '👨‍👩‍👧 টিউটর চাই — টিউশন পোস্ট') + '</h3>' +
      '<p class="tu-sub">তথ্য জমা দিলে Admin যাচাই করে অনুমোদন দেবেন, তারপর সবার জন্য দেখা যাবে। মোবাইল + PIN দিয়ে ড্যাশবোর্ডে ঢুকে নিজের তথ্য দেখতে পারবেন।</p>' +
      '<div class="tug">' + F.map(function (f) { return fi(p, f); }).join('') + '</div>' +
      '<button class="tu-btn pr" id="tusb" style="width:100%;margin-top:12px" onclick="TU.sub(\'' + (T ? 'tutor' : 'post') + '\')">✓ জমা দিন</button>';
  }
  function dashBody() {
    if (!ST.my) return '<h3 class="tu-h3">👤 আমার ড্যাশবোর্ড</h3>' +
      '<p class="tu-sub">মোবাইল ও PIN দিয়ে ঢুকে নিজের টিউটর প্রোফাইল ও পোস্টগুলো দেখুন, ম্যানেজ করুন।</p>' +
      '<div class="tug"><div><label>মোবাইল</label><input id="lm" type="tel" maxlength="11" value="' + esc(ST.cr ? ST.cr.m : '') + '"></div><div><label>PIN</label><input id="lp" type="tel" maxlength="4"></div></div>' +
      '<button class="tu-btn pr" style="width:100%;margin-top:12px" onclick="TU.login()">🔓 ঢুকুন</button>';
    return '<h3 class="tu-h3">👤 আমার ড্যাশবোর্ড</h3>' +
      (ST.my.tutors.length ? '<p class="tu-sec">🎓 আমার টিউটর প্রোফাইল</p>' + ST.my.tutors.map(function (x) { return tutorC(x, 'my'); }).join('') : '') +
      (ST.my.posts.length ? '<p class="tu-sec">📌 আমার টিউশন পোস্ট</p>' + ST.my.posts.map(function (x) { return jobC(x, 'my'); }).join('') : '') +
      '<button class="tu-btn gh" style="margin-top:14px" onclick="TU.out()">বের হন</button>';
  }
  /* Admin: backend v3-er 'login' action (u: username, p: password) → tlist → tset */
  function adBody() {
    if (!ST.ad) return '<h3 class="tu-h3">🔐 Admin</h3>' +
      '<p class="tu-sub">মূল Admin Panel-এর একই username ও password দিয়ে ঢুকুন (যেমন: owner)।</p>' +
      '<div class="tug"><div><label>Username</label><input id="au" placeholder="owner" value="' + esc(ST.au) + '"></div><div><label>Password</label><input id="ap" type="password"></div></div>' +
      '<button class="tu-btn pr" style="width:100%;margin-top:12px" onclick="TU.adl()">🔓 ঢুকুন</button>';
    var srt = function (a) { return a.slice().sort(function (x, y) { return (x.status === 'pending' ? 0 : 1) - (y.status === 'pending' ? 0 : 1); }); };
    return '<h3 class="tu-h3">🔐 Admin Panel</h3>' +
      '<div class="tu-who" style="margin:2px 0 6px"><b>👤 ' + esc(ST.ad.name) + (ST.ad.su ? ' (মালিক)' : '') + '</b><small>টিউটর ও টিউশন পোস্ট অনুমোদন/বাতিল করুন</small></div>' +
      '<button class="tu-btn gh" style="margin-bottom:10px" onclick="TU.adOut()">বের হন</button>' +
      '<p class="tu-sec">🎓 টিউটর (' + bn(ST.adT.length) + ')</p>' + srt(ST.adT).map(function (x) { return tutorC(x, 'ad'); }).join('') +
      '<p class="tu-sec">📌 টিউশন পোস্ট (' + bn(ST.adP.length) + ')</p>' + srt(ST.adP).map(function (x) { return jobC(x, 'ad'); }).join('');
  }

  function draw() {
    var t = ST.tab;
    var tabs = [['feed', '🏠 ফিড'], ['jobs', '📋 টিউশন খুঁজুন'], ['tutors', '👩‍🏫 টিউটর তালিকা'], ['dash', '👤 আমার ড্যাশবোর্ড']];
    var bodyHtml = '';
    if (t === 'feed') bodyHtml = stats() + feedBody();
    else if (t === 'jobs') bodyHtml = jobsBody();
    else if (t === 'tutors') bodyHtml = tutorsBody();
    else if (t === 'rt' || t === 'rp') bodyHtml = formBody(t);
    else if (t === 'dash') bodyHtml = dashBody();
    else if (t === 'ad') bodyHtml = adBody();
    $('tuw').innerHTML =
      '<div class="tu-topbar">' +
      '<button class="tu-back" onclick="closeV()">← সাইটে ফিরুন</button>' +
      '<b class="tu-top-t">🎓 Tuition Hub</b>' +
      '<div class="tu-top-links"><button onclick="TU.go(\'feed\')">ফিড</button><button onclick="TU.go(\'dash\')">ড্যাশবোর্ড</button><button onclick="TU.go(\'ad\')" title="Admin">🔐</button></div>' +
      '</div>' +
      (t === 'feed' ? hero() : '') +
      (t !== 'feed' ? '<nav class="tu-tabs">' + tabs.map(function (x) { return '<button class="' + (ST.tab === x[0] ? 'on' : '') + '" onclick="TU.go(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</nav>' : '') +
      (ST.msg ? '<div class="tu-okmsg">' + ST.msg + '</div>' : '') +
      '<div class="tu-body">' + bodyHtml + '</div>';
  }
  function load() { return api('list').then(function (j) { ST.t = j.tutors; ST.p = j.posts; draw(); }).catch(function (e) { if (e.message !== 'API') console.error(e); draw(); }); }
  function loadMy() { return api('my', ST.cr).then(function (j) { ST.my = j; sv('rsh_tu_cr', ST.cr); draw(); }).catch(function (e) { ST.my = null; draw(); fail(e); }); }
  /* Admin login → tlist (backend v3 actions, username + password সহ) */
  function adLoad() {
    return api('login', { u: ST.au, p: ST.ap }).then(function (j) {
      ST.ad = j;
      return api('tlist', { u: ST.au, p: ST.ap }).then(function (k) { ST.adT = k.tutors || []; ST.adP = k.posts || []; draw(); });
    }).catch(function (e) { ST.ad = null; draw(); fail(e); });
  }

  window.TU = {
    go: function (t) { ST.tab = t; ST.q = ''; ST.msg = ''; draw(); if (t === 'dash' && !ST.my && ST.cr) loadMy(); var w = $('tuw'); if (w) w.scrollIntoView(); },
    s: function (v) { ST.q = v; draw(); var el = document.querySelector('.tu-search'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); } },
    sub: function (t) {
      var F = t === 'tutor' ? TF : PF, p = t === 'tutor' ? 't_' : 'p_', d = {};
      F.forEach(function (f) { d[f[0]] = $(p + f[0]).value.trim(); });
      var miss = F.filter(function (f) { return f[1].indexOf('*') > 0 && !d[f[0]]; })[0];
      if (miss) return toast('"' + miss[1].replace(' *', '') + '" পূরণ করুন', 'err');
      if (!/^01\d{9}$/.test(d.m)) return toast('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)', 'err');
      if (!/^\d{4}$/.test(d.pin)) return toast('PIN ঠিক ৪ সংখ্যার হতে হবে', 'err');
      $('tusb').disabled = true;
      api('add', { t: t, d: d }).then(function () {
        ST.cr = { m: d.m, pin: d.pin }; ST.tab = 'dash'; ST.msg = '✅ জমা হয়েছে! Admin অনুমোদন করলে ফিডে দেখা যাবে।';
        return loadMy();
      }).catch(function (e) { $('tusb').disabled = false; fail(e); });
    },
    login: function () { ST.cr = { m: $('lm').value.trim(), pin: $('lp').value.trim() }; loadMy(); },
    out: function () { ST.my = null; ST.cr = null; sv('rsh_tu_cr', null); draw(); },
    own: function (act, t, id) {
      if (!confirm(act === 'confirm' ? 'টিউটর ঠিক হয়ে গেছে? পোস্টটি ফিড থেকে সরে যাবে।' : 'নিশ্চিতভাবে মুছবেন?')) return;
      api('own', { m: ST.cr.m, pin: ST.cr.pin, act: act, t: t, id: id }).then(function () { return Promise.all([loadMy(), load()]); }).catch(fail);
    },
    adl: function () { ST.au = $('au').value.trim(); ST.ap = $('ap').value; adLoad(); },
    adOut: function () { ST.ad = null; ST.ap = ''; ST.adT = []; ST.adP = []; draw(); },
    aset: function (t, id, s) {
      if (s === 'delete' && !confirm('মুছে ফেলবেন?')) return;
      api('tset', { u: ST.au, p: ST.ap, t: t, id: id, s: s }).then(function () { return Promise.all([adLoad(), load()]); }).catch(fail);
    }
  };

  /* ---------- Styles: professional tuition platform ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#vw{padding:0!important}#vw .in{max-width:none!important;margin:0!important}#vw .panel{border-radius:0!important;max-width:none!important;border-left:0;border-right:0;padding:0!important;overflow:visible}' +
    '#tuw{background:var(--bg);min-height:100vh;padding:0 0 40px}' +
    '.tu-topbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:10px 16px;background:rgba(2,12,7,.95);border-bottom:2px solid #1fd16a;backdrop-filter:blur(8px)}' +
    ':root[data-theme=light] .tu-topbar{background:rgba(255,255,255,.95)}' +
    '.tu-back{background:none;border:1px solid var(--line);color:var(--text);border-radius:9px;padding:7px 13px;cursor:pointer;font:600 13px "Noto Serif Bengali",Inter}' +
    '.tu-back:hover{border-color:#3ddc84}' +
    '.tu-top-t{font:700 16px "Playfair Display",serif;color:var(--gold)}' +
    '.tu-top-links{margin-left:auto;display:flex;gap:8px}.tu-top-links button{background:none;border:none;color:var(--muted);cursor:pointer;font:600 13px "Noto Serif Bengali",Inter;padding:5px 9px;border-radius:8px}' +
    '.tu-top-links button:hover{color:var(--text);background:rgba(128,128,128,.12)}' +
    '.tu-hero{background:linear-gradient(140deg,rgba(15,122,63,.35),rgba(4,18,10,.9)),url(bg.jpg) center/cover;padding:44px 20px 36px;text-align:center}' +
    '.tu-hero h2{font:800 27px "Playfair Display",serif;color:#fff;letter-spacing:.01em}' +
    '.tu-hero h2 span{color:#3ddc84}.tu-hero p{color:var(--muted);font-size:13.5px;max-width:520px;margin:8px auto 0}' +
    '.tu-hero-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px}' +
    '.tu-btn{border:0;border-radius:11px;cursor:pointer;font:700 14px "Noto Serif Bengali",Inter;padding:11px 20px;transition:.18s}' +
    '.tu-btn.big{padding:13px 26px;font-size:15px}.tu-btn.pr{background:linear-gradient(135deg,#22d46d,#0fa352);color:#032010}' +
    '.tu-btn.pr:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(31,209,106,.4)}.tu-btn.gh{background:none;border:1px solid var(--line);color:var(--text)}' +
    '.tu-btn.gh:hover{border-color:#3ddc84}.tu-btn:disabled{opacity:.6;cursor:wait}' +
    '.tu-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:920px;margin:16px auto 0;padding:0 16px}' +
    '.tu-stat{background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:13px 8px;text-align:center}' +
    '.tu-stat b{display:block;font:800 21px Inter;color:#3ddc84}.tu-stat small{color:var(--muted);font-size:11.5px}' +
    '.tu-tabs{display:flex;gap:7px;overflow-x:auto;max-width:920px;margin:18px auto 0;padding:0 16px;scrollbar-width:none}' +
    '.tu-tabs::-webkit-scrollbar{display:none}' +
    '.tu-tabs button{flex:none;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:22px;padding:8px 16px;font:600 13px "Noto Serif Bengali",Inter;cursor:pointer;transition:.15s}' +
    '.tu-tabs button.on{background:#3ddc84;color:#032010;border-color:#3ddc84;font-weight:700}' +
    '.tu-body{max-width:920px;margin:0 auto;padding:14px 16px 0}' +
    '.tu-search{width:100%;margin:2px 0 4px}' +
    '.tu-feed{display:grid;gap:12px;margin-top:10px}' +
    '.tu-card{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:14px 15px;transition:.2s}' +
    '.tu-card:hover{border-color:rgba(61,220,132,.6);box-shadow:0 6px 24px rgba(31,209,106,.14)}' +
    '.tu-card-top{display:flex;align-items:center;gap:11px}' +
    '.tu-av{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:50%;font:700 18px Inter;color:#fff}' +
    '.tu-av.m{background:linear-gradient(135deg,#0fa352,#0f7a3f)}.tu-av.f{background:linear-gradient(135deg,#b06a8f,#7c3f63)}' +
    '.tu-who{min-width:0;flex:1}.tu-who b{display:block;font-size:14.5px;color:var(--text)}.tu-who small{color:var(--muted);font-size:11.5px}' +
    '.tu-chip{flex:none;font:600 10px Inter;padding:3px 9px;border-radius:99px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}' +
    '.tu-chip.live{color:#3ddc84;border-color:rgba(61,220,132,.5);background:rgba(61,220,132,.12)}' +
    '.tu-chip.verify{color:#f3d98a;border-color:rgba(243,217,138,.45);background:rgba(243,217,138,.1)}' +
    '.tu-row{margin-top:10px}.tu-sal{display:inline-flex;flex-direction:column;background:rgba(61,220,132,.1);border:1px solid rgba(61,220,132,.3);border-radius:10px;padding:6px 14px}' +
    '.tu-sal small{color:var(--muted);font-size:10.5px}.tu-sal b{color:#3ddc84;font-size:16px}' +
    '.tu-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}' +
    '.tu-kv{display:inline-flex;align-items:center;gap:5px;background:rgba(128,128,128,.09);border:1px solid var(--line);border-radius:8px;padding:4px 10px;font-size:12px;color:var(--text)}' +
    '.tu-kv b{color:var(--muted);font-weight:600}' +
    '.tu-note{margin-top:10px;font-size:12.5px;color:var(--muted);background:rgba(128,128,128,.07);border-left:3px solid #3ddc84;padding:7px 10px;border-radius:0 8px 8px 0}' +
    '.tu-act{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:12px}' +
    '.tu-cta{display:inline-flex;align-items:center;gap:4px;border-radius:9px;padding:7px 13px;font:600 12.5px "Noto Serif Bengali",Inter;cursor:pointer;text-decoration:none;border:1px solid var(--line);color:var(--text);background:rgba(128,128,128,.08)}' +
    '.tu-cta.call:hover,.tu-cta.wa:hover{border-color:#3ddc84;color:#3ddc84}' +
    '.tu-cta.ok{border-color:rgba(61,220,132,.5);background:rgba(61,220,132,.15);color:#3ddc84}' +
    '.tu-cta.del{border-color:rgba(239,68,68,.4);color:#f87171}.tu-cta.del:hover{background:rgba(239,68,68,.12)}' +
    '.tub{font-size:10.5px;border-radius:99px;padding:3px 10px;border:1px solid var(--line);color:var(--muted);white-space:nowrap;flex:none}' +
    '.tub.approved{color:#3ddc84;border-color:rgba(61,220,132,.5);background:rgba(61,220,132,.1)}' +
    '.tub.pending{color:#f3d98a;border-color:rgba(243,217,138,.45);background:rgba(243,217,138,.08)}' +
    '.tub.rejected{color:#f87171;border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.08)}' +
    '.tub.confirmed{color:#3ddc84;border-color:rgba(61,220,132,.5)}' +
    '.tu-h3{font:700 17px "Playfair Display",serif;color:var(--gold);margin:6px 0 4px}' +
    '.tu-sub{color:var(--muted);font-size:12.5px;margin-bottom:10px}' +
    '.tu-sec{font:700 13px "Noto Serif Bengali";color:var(--gold);margin:16px 0 8px;border-left:3px solid #3ddc84;padding-left:8px}' +
    '.tu-empty{text-align:center;color:var(--muted);font-size:13px;padding:34px 10px;background:var(--panel);border:1px dashed var(--line);border-radius:13px}' +
    '.tu-okmsg{max-width:920px;margin:10px auto 0;padding:10px 14px;border-radius:10px;background:rgba(61,220,132,.12);border:1px solid rgba(61,220,132,.35);font:600 13px "Noto Serif Bengali";color:#3ddc84}' +
    '.tu-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(16px);background:rgba(8,32,20,.96);border:1px solid rgba(61,220,132,.5);color:#eaf7ef;font:600 13px "Noto Serif Bengali";padding:11px 20px;border-radius:11px;opacity:0;transition:.3s;z-index:999;pointer-events:none;max-width:90%}' +
    '.tu-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}' +
    '.tu-toast.err{border-color:rgba(239,68,68,.55);background:rgba(38,10,10,.96)}' +
    '.tug{display:grid;grid-template-columns:1fr 1fr;gap:9px}' +
    '@media(max-width:640px){.tu-stats{grid-template-columns:repeat(2,1fr)}.tu-hero h2{font-size:21px}.tug{grid-template-columns:1fr}.tu-hero{padding:30px 14px 26px}.tu-hero-btns .tu-btn{width:100%}}';
  document.head.appendChild(css);

  HUB.splice(8, 0, ['🎓', 'tuition', 'Tuition Hub', 'টিউটর খুঁজুন ও টিউশন পোস্ট করুন', 'live']);
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  VW.tuition = ['Tuition Hub', '<div id="tuw"></div>', function () { ST.tab = 'feed'; ST.q = ''; ST.msg = ''; draw(); load(); }];
})();
