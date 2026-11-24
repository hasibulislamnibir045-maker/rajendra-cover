/* ===== Tuition Hub: tutor registration, tuition post, dashboard, admin approval ===== */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbxM3COcrkebmp17kL8tOEM3SbIYbmffrQW1ISx2qvhwer3VeeocQoo_EqxULxkPZuId/exec'; // Apps Script Web app URL ekhane boshan
  window.RSH_API = API;
  var ST = { t: [], p: [], tab: 'posts', q: '', cr: ld('rsh_tu_cr', null), my: null, ad: null, ap: '', msg: '' };
  var LB = { pending: '⏳ অনুমোদনের অপেক্ষায়', approved: '✅ চালু আছে', rejected: '❌ বাতিল', confirmed: '🎉 টিউটর ঠিক হয়েছে' };
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
  function fail(e) { alert(e.message === 'API' ? 'Admin এখনো Apps Script URL বসায়নি' : (e.message || 'সার্ভারে সমস্যা, আবার চেষ্টা করুন')); }
  function fi(p, f) {
    var id = p + f[0], ph = f[2] || '', h = '<div' + (f[3] === 'w' ? ' style="grid-column:1/-1"' : '') + '><label>' + f[1] + '</label>';
    if (ph.indexOf('sel:') === 0) h += '<select id="' + id + '">' + ph.slice(4).split(',').map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>';
    else if (f[3] === 'w') h += '<textarea id="' + id + '" placeholder="' + ph + '"></textarea>';
    else h += '<input id="' + id + '" placeholder="' + ph + '"' + (f[0] === 'pin' ? ' type="tel" maxlength="4"' : f[0] === 'm' ? ' type="tel" maxlength="11"' : '') + '>';
    return h + '</div>';
  }
  function tel(m) { return String(m || '').replace(/\D/g, ''); }
  function call(m) { return '<a class="ib" href="tel:' + tel(m) + '">📞 কল</a><a class="ib" target="_blank" rel="noopener" href="https://wa.me/88' + tel(m) + '">💬 WhatsApp</a>'; }
  function line(a) { return a.filter(function (x) { return x[1]; }).map(function (x) { return '<b>' + x[0] + ':</b> ' + esc(x[1]); }).join(' · '); }
  function badge(s) { return '<span class="tub ' + s + '">' + (LB[s] || s) + '</span>'; }

  function tutorC(t, mode) {
    var h = '<div class="tuc"><b>👩‍🏫 ' + esc(t.n) + '</b> <small>' + esc(t.g || '') + ' · ' + esc(t.ins) + '</small>' + (mode ? ' ' + badge(t.status) : '') +
      '<p>' + line([['বিষয়', t.sub], ['ক্লাস', t.cls], ['মাধ্যম', t.med], ['এলাকা', t.area], ['পদ্ধতি', t.mode], ['বেতন', t.sal], ['যোগ্যতা', t.yr], ['অভিজ্ঞতা', t.exp]]) + '</p><div class="act">';
    if (!mode || mode === 'ad') h += call(t.m);
    if (mode === 'my') h += '<button class="ib" onclick="TU.own(\'del\',\'tutor\',\'' + t.id + '\')">🗑 মুছুন</button>';
    if (mode === 'ad') h += adBtn('tutor', t);
    return h + '</div></div>';
  }
  function postC(p, mode) {
    var h = '<div class="tuc"><b>📌 ক্লাস ' + esc(p.cls) + ' · ' + esc(p.sub) + '</b> <small>' + esc(p.area) + '</small>' + (mode ? ' ' + badge(p.status) : '') +
      '<p>' + line([['ছাত্র/ছাত্রী', p.sg], ['মাধ্যম', p.med], ['সপ্তাহে', p.days], ['বেতন', p.sal], ['চান', p.tg], ['নোট', p.note]]) + '</p><div class="act">';
    if (!mode || mode === 'ad') h += call(p.m);
    if (mode === 'my') {
      if (p.status !== 'confirmed') h += '<button class="ib" onclick="TU.own(\'confirm\',\'post\',\'' + p.id + '\')">🎉 টিউটর ঠিক হয়েছে</button>';
      h += '<button class="ib" onclick="TU.own(\'del\',\'post\',\'' + p.id + '\')">🗑 মুছুন</button>';
    }
    if (mode === 'ad') h += '<small>' + esc(p.n) + '</small>' + adBtn('post', p);
    return h + '</div></div>';
  }
  function adBtn(t, o) {
    var b = function (s, l) { return '<button class="ib" onclick="TU.aset(\'' + t + '\',\'' + o.id + '\',\'' + s + '\')">' + l + '</button>'; };
    return (o.status !== 'approved' ? b('approved', '✅ অনুমোদন') : '') + (o.status !== 'rejected' ? b('rejected', '❌ বাতিল') : '') +
      (t === 'post' && o.status !== 'confirmed' ? b('confirmed', '🎉 কনফার্ম') : '') + b('delete', '🗑');
  }

  function list(arr, fn, empty) {
    var q = ST.q.toLowerCase(), a = arr.filter(function (x) { return !q || JSON.stringify(x).toLowerCase().indexOf(q) > -1; });
    return a.map(fn).join('') || '<p class="cal-e">' + empty + '</p>';
  }
  function body() {
    var t = ST.tab, h = '';
    if (ST.msg) { h += '<div class="res" style="margin:8px 0">' + ST.msg + '</div>'; }
    if (t === 'posts' || t === 'tutors') {
      var P = t === 'posts';
      return h + '<input placeholder="🔎 বিষয় / ক্লাস / এলাকা দিয়ে খুঁজুন" value="' + esc(ST.q) + '" oninput="TU.s(this.value)"><div id="tul">' +
        (P ? list(ST.p, function (x) { return postC(x); }, 'এখন কোনো টিউশন পোস্ট নেই') : list(ST.t, function (x) { return tutorC(x); }, 'এখন কোনো টিউটর নেই')) + '</div>';
    }
    if (t === 'rt' || t === 'rp') {
      var T = t === 'rt', F = T ? TF : PF, p = T ? 't_' : 'p_';
      return h + '<h3>' + (T ? '🎓 টিউটর রেজিস্ট্রেশন' : '👨‍👩‍👧 টিউটর চাই (টিউশন পোস্ট)') + '</h3><p style="color:var(--muted);font-size:12.5px;margin:2px 0 6px">তথ্য জমা দিলে Admin যাচাই করে অনুমোদন দেবেন, তারপর সবার জন্য দেখা যাবে। মোবাইল + PIN দিয়ে ড্যাশবোর্ডে ঢুকে নিজের তথ্য দেখতে পারবেন।</p><div class="tug">' +
        F.map(function (f) { return fi(p, f); }).join('') + '</div><button class="btn pr" id="tusb" onclick="TU.sub(\'' + (T ? 'tutor' : 'post') + '\')">জমা দিন</button>';
    }
    if (t === 'dash') {
      if (!ST.my) return h + '<h3>👤 আমার ড্যাশবোর্ড</h3><div class="tug"><div><label>মোবাইল</label><input id="lm" type="tel" maxlength="11" value="' + esc(ST.cr ? ST.cr.m : '') + '"></div><div><label>PIN</label><input id="lp" type="tel" maxlength="4"></div></div><button class="btn pr" onclick="TU.login()">ঢুকুন</button>';
      return h + '<h3>👤 আমার ড্যাশবোর্ড</h3><button class="ib" onclick="TU.out()">বের হন</button>' +
        (ST.my.tutors.length ? '<h3>🎓 আমার টিউটর প্রোফাইল</h3>' + ST.my.tutors.map(function (x) { return tutorC(x, 'my'); }).join('') : '') +
        (ST.my.posts.length ? '<h3>📌 আমার টিউশন পোস্ট</h3>' + ST.my.posts.map(function (x) { return postC(x, 'my'); }).join('') : '');
    }
    if (t === 'ad') {
      if (!ST.ad) return h + '<h3>🔐 Admin</h3><label>Password</label><input id="ap" type="password"><button class="btn pr" onclick="TU.adl()">ঢুকুন</button>';
      var srt = function (a) { return a.slice().sort(function (x, y) { return (x.status === 'pending' ? 0 : 1) - (y.status === 'pending' ? 0 : 1); }); };
      return h + '<h3>🔐 Admin: টিউটর (' + bn(ST.ad.tutors.length) + ')</h3>' + srt(ST.ad.tutors).map(function (x) { return tutorC(x, 'ad'); }).join('') +
        '<h3>Admin: টিউশন পোস্ট (' + bn(ST.ad.posts.length) + ')</h3>' + srt(ST.ad.posts).map(function (x) { return postC(x, 'ad'); }).join('');
    }
    return h;
  }
  function draw() {
    var tabs = [['posts', '📋 টিউশন খুঁজুন'], ['tutors', '👩‍🏫 টিউটর তালিকা'], ['dash', '👤 আমার ড্যাশবোর্ড']];
    $('tuw').innerHTML = '<div class="tu-pick"><button onclick="TU.go(\'rt\')">🎓 টিউটর রেজিস্ট্রেশন<span>আমি টিউশন করাতে চাই</span></button><button onclick="TU.go(\'rp\')">👨‍👩‍👧 টিউটর চাই<span>অভিভাবক: টিউশন পোস্ট করুন</span></button></div>' +
      '<div class="tu-tabs">' + tabs.map(function (x) { return '<button class="' + (ST.tab === x[0] ? 'on' : '') + '" onclick="TU.go(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>' +
      body() + '<p style="text-align:center;margin-top:18px"><a href="#" style="color:var(--muted);font-size:12px" onclick="TU.go(\'ad\');return false">🔐 Admin</a></p>';
  }
  function load() { return api('list').then(function (j) { ST.t = j.tutors; ST.p = j.posts; draw(); }).catch(function (e) { if (e.message !== 'API') console.error(e); draw(); }); }
  function loadMy() { return api('my', ST.cr).then(function (j) { ST.my = j; sv('rsh_tu_cr', ST.cr); draw(); }).catch(function (e) { ST.my = null; draw(); fail(e); }); }
  function adLoad() { return api('admin', { p: ST.ap }).then(function (j) { ST.ad = j; draw(); }).catch(function (e) { ST.ad = null; draw(); fail(e); }); }

  window.TU = {
    go: function (t) { ST.tab = t; ST.q = ''; ST.msg = ''; draw(); if (t === 'dash' && !ST.my && ST.cr) loadMy(); window.scrollTo(0, 0); },
    s: function (v) { ST.q = v; var el = $('tul'); if (el) { var P = ST.tab === 'posts'; el.innerHTML = P ? list(ST.p, function (x) { return postC(x); }, 'কিছু পাওয়া যায়নি') : list(ST.t, function (x) { return tutorC(x); }, 'কিছু পাওয়া যায়নি'); } },
    sub: function (t) {
      var F = t === 'tutor' ? TF : PF, p = t === 'tutor' ? 't_' : 'p_', d = {};
      F.forEach(function (f) { d[f[0]] = $(p + f[0]).value.trim(); });
      var miss = F.filter(function (f) { return f[1].indexOf('*') > 0 && !d[f[0]]; })[0];
      if (miss) return alert('"' + miss[1].replace(' *', '') + '" পূরণ করুন');
      if (!/^01\d{9}$/.test(d.m)) return alert('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)');
      if (!/^\d{4}$/.test(d.pin)) return alert('PIN ঠিক ৪ সংখ্যার হতে হবে');
      $('tusb').disabled = true;
      api('add', { t: t, d: d }).then(function () {
        ST.cr = { m: d.m, pin: d.pin }; ST.tab = 'dash'; ST.msg = '✅ জমা হয়েছে! Admin অনুমোদন করলে তালিকায় দেখা যাবে। নিচে স্ট্যাটাস দেখুন।';
        return loadMy();
      }).catch(function (e) { $('tusb').disabled = false; fail(e); });
    },
    login: function () { ST.cr = { m: $('lm').value.trim(), pin: $('lp').value.trim() }; loadMy(); },
    out: function () { ST.my = null; ST.cr = null; sv('rsh_tu_cr', null); draw(); },
    own: function (act, t, id) {
      if (!confirm(act === 'confirm' ? 'টিউটর ঠিক হয়ে গেছে? পোস্টটি সবার তালিকা থেকে সরে যাবে।' : 'নিশ্চিতভাবে মুছবেন?')) return;
      api('own', { m: ST.cr.m, pin: ST.cr.pin, act: act, t: t, id: id }).then(function () { return Promise.all([loadMy(), load()]); }).catch(fail);
    },
    adl: function () { ST.ap = $('ap').value; adLoad(); },
    aset: function (t, id, s) { if (s === 'delete' && !confirm('মুছে ফেলবেন?')) return; api('aset', { p: ST.ap, t: t, id: id, s: s }).then(function () { return Promise.all([adLoad(), load()]); }).catch(fail); }
  };

  var css = document.createElement('style');
  css.textContent = '.tu-pick{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.tu-pick button{border:2px solid var(--line);border-radius:14px;background:var(--panel);color:var(--text);padding:14px 8px;cursor:pointer;font:700 14.5px "Noto Serif Bengali",Inter,sans-serif}' +
    '.tu-pick button span{display:block;font:400 11.5px "Noto Serif Bengali",Inter;color:var(--muted);margin-top:5px}.tu-pick button:hover{border-color:#3ddc84;box-shadow:0 0 14px rgba(61,220,132,.3)}' +
    '.tu-tabs{display:flex;gap:6px;overflow-x:auto;margin:6px 0 10px;padding-bottom:4px}.tu-tabs button{flex:none;border:1px solid var(--line);background:none;color:var(--text);border-radius:20px;padding:6px 13px;font:600 13px "Noto Serif Bengali",Inter;cursor:pointer}' +
    '.tu-tabs button.on{background:rgba(61,220,132,.2);border-color:#3ddc84}.tuc{border:1px solid var(--line);border-radius:12px;padding:11px;margin-top:9px;background:rgba(128,128,128,.06)}.tuc small{color:var(--muted)}.tuc p{font-size:13px;margin:5px 0;line-height:1.55}' +
    '.tuc .act{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}.tuc .act .ib{font-size:12.5px;text-decoration:none;padding:5px 10px}.tub{font-size:11px;border-radius:10px;padding:2px 8px;border:1px solid var(--line);white-space:nowrap}' +
    '.tug{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media(max-width:600px){.tug{grid-template-columns:1fr}.tu-pick button{font-size:13px}}';
  document.head.appendChild(css);

  HUB.splice(8, 0, ['🎓', 'tuition', 'Tuition Hub', 'টিউটর রেজিস্ট্রেশন ও টিউশন পোস্ট', 'live']);
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  VW.tuition = ['Tuition Hub', '<div id="tuw"></div>', function () { ST.tab = 'posts'; ST.q = ''; ST.msg = ''; draw(); load(); }];
})();
