/* ===== Admin Panel (tuition.js-er sathe load hobe; API URL ekhane lagbe na) ===== */
(function () {
  var A = null, D = {}, tab = 'stats';
  var PL = { notice: '📢 নোটিশ', resource: '📚 রিসোর্স', tuition: '🎓 টিউশন', routine: '🗓️ রুটিন', market: '🛒 মার্কেট' };           // permission nam
  var TB = [['stats', '📊 সারসংক্ষেপ'], ['notice', '📢 নোটিশ', 'notice'], ['resource', '📚 রিসোর্স', 'resource'], ['tuition', '🎓 টিউশন', 'tuition'], ['routine', '🗓️ রুটিন', 'routine'], ['market', '🛒 মার্কেট', 'market'], ['admins', '👥 অ্যাডমিন', 'su']];
  var LOAD = { stats: 'stats', notice: 'apub', resource: 'apub', routine: 'rlist', market: 'mlist', tuition: 'tlist', admins: 'ulist' };
  var LBL = { pending: '⏳ অপেক্ষায়', approved: '✅ চালু', rejected: '❌ বাতিল', confirmed: '🎉 কনফার্ম' };

  function ap(a, d) {
    var U = window.RSH_API;
    if (!/^https/.test(U || '')) return Promise.reject(new Error('tuition.js-এ Apps Script URL বসানো হয়নি'));
    return fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ a: a }, A ? { u: A.u, p: A.p } : {}, d || {})) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.err) throw new Error(j.err); return j; });
  }
  function err(e) { alert(e.message || 'সার্ভারে সমস্যা'); }
  function can(p) { return A.su || A.perms.indexOf(p) > -1; }
  function today() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function opt(a) { return a.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
  function v(id) { return $(id).value.trim(); }
  function inp(id, l, ph, w) { return '<div' + (w ? ' style="grid-column:1/-1"' : '') + '><label>' + l + '</label><input id="' + id + '" placeholder="' + (ph || '') + '"></div>'; }
  function sel(id, l, o) { return '<div><label>' + l + '</label><select id="' + id + '">' + opt(o) + '</select></div>'; }
  function selv(id, l, pairs, w) { return '<div' + (w ? ' style="grid-column:1/-1"' : '') + '><label>' + l + '</label><select id="' + id + '">' + pairs.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; }
  function inpt(id, l, type) { return '<div><label>' + l + '</label><input id="' + id + '" type="' + type + '"></div>'; }
  var YRS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Preliminary to Masters', 'Masters Final Year'], WDN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  var KLB = { 'class': '📘 ক্লাস', exam: '📝 পরীক্ষা', holiday: '🏖️ ছুটি' };
  function btn(l, js) { return '<button class="ib" onclick="' + js + '">' + l + '</button>'; }

  /* ---------- public data: Sheet theke NOTICES / RES bhore ---------- */
  function fill(j) { NOTICES.length = 0; [].push.apply(NOTICES, j.notices || []); RES.length = 0; [].push.apply(RES, j.res || []); }
  function pubLoad() { return ap('pub').then(function (j) { fill(j); return j; }); }

  /* ---------- tab bodies ---------- */
  function body() {
    if (tab === 'stats') {
      var s = D, b = function (n, l) { return '<div class="tuc" style="text-align:center"><b style="font-size:22px">' + bn(n) + '</b><br><small>' + l + '</small></div>'; };
      return '<div class="tug">' + b(s.tutors[0], 'মোট টিউটর') + b(s.tutors[1], 'অনুমোদনের অপেক্ষায় (টিউটর)') + b(s.posts[0], 'মোট টিউশন পোস্ট') + b(s.posts[1], 'অনুমোদনের অপেক্ষায় (পোস্ট)') +
        b(s.posts[2], 'টিউটর ঠিক হয়েছে') + b(s.notices, 'নোটিশ') + b(s.res, 'রিসোর্স') + b(s.admins, 'অ্যাডমিন') + '</div>';
    }
    if (tab === 'notice') {
      return '<h3>নতুন নোটিশ</h3><div class="tug">' + sel('n_c', 'ধরন', ['সাধারণ', 'পরীক্ষা', 'ভর্তি', 'ফরম পূরণ', 'ফলাফল', 'একাডেমিক']) + inp('n_d', 'তারিখ', today()) + inp('n_t', 'শিরোনাম *', '', 1) +
        '<div style="grid-column:1/-1"><label>বিস্তারিত</label><textarea id="n_x"></textarea></div>' + inp('n_u', 'লিংক (ঐচ্ছিক)', 'https://', 1) + '</div><button class="btn pr" onclick="ADM.put(\'notice\')">প্রকাশ করুন</button>' +
        '<h3>প্রকাশিত নোটিশ</h3>' + ((D.notices || []).slice().sort(function (a, b) { return b.d.localeCompare(a.d); }).map(function (n) {
          return '<div class="tuc"><b>' + esc(n.t) + '</b> <small>' + esc(n.c) + ' · ' + esc(n.d) + (n.dept ? ' · ' + esc(n.dept) : '') + ' · by ' + esc(n.by) + '</small><div class="act">' + btn('🗑 মুছুন', 'ADM.del(\'notice\',\'' + n.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">কোনো নোটিশ নেই</p>');
    }
    if (tab === 'resource') {
      return '<h3>নতুন রিসোর্স</h3><div class="tug">' + inp('r_t', 'শিরোনাম *', '', 1) + (A.dept ? sel('r_dept', 'বিভাগ (আপনার)', [A.dept]) : sel('r_dept', 'বিভাগ', Object.keys(DEPT))) + sel('r_yr', 'বর্ষ', ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Masters']) +
        sel('r_type', 'ধরন', ['প্রশ্নপত্র', 'সিলেবাস', 'সাজেশন', 'অ্যাসাইনমেন্ট', 'ক্লাস PDF', 'বইয়ের তালিকা', 'নোট']) + inp('r_u', 'লিংক * (Drive / PDF)', 'https://') + '</div><button class="btn pr" onclick="ADM.put(\'resource\')">যোগ করুন</button>' +
        '<h3>রিসোর্স তালিকা</h3>' + ((D.res || []).map(function (r) {
          return '<div class="tuc"><b>' + esc(r.t) + '</b> <small>' + esc(r.dept) + ' · ' + esc(r.yr) + ' · ' + esc(r.type) + '</small><div class="act"><a class="ib" target="_blank" rel="noopener" href="' + esc(r.u) + '">খুলুন</a>' + btn('🗑 মুছুন', 'ADM.del(\'resource\',\'' + r.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">কিছু নেই</p>');
    }
    if (tab === 'routine') {
      var dl = A.dept ? [[A.dept, A.dept]] : [['all', 'সব বিভাগ (সবার জন্য)']].concat(Object.keys(DEPT).map(function (k) { return [k, k + ' / ' + DEPT[k]]; }));
      var rl = (D.rt || []).slice().sort(function (a, b) { return String(b.d || '').localeCompare(String(a.d || '')); });
      return '<h3>নতুন রুটিন' + (A.dept ? ' — ' + esc(A.dept) + ' বিভাগ' : '') + '</h3><p style="color:var(--muted);font-size:12.5px">যে ক্লাসের জন্য দিবেন শুধু সেই ক্লাসের শিক্ষার্থীরাই দেখবে। তারিখ দিন অথবা "প্রতি সপ্তাহে" বার বাছুন (দুটোই দিলে ওই তারিখ থেকে প্রতি সপ্তাহে)।</p><div class="tug">' +
        selv('rt_dept', 'ক্লাস (বিভাগ) *', dl, 1) + selv('rt_prog', 'স্তর', [['', 'সব স্তর'], ['Honours', 'Honours'], ['Degree (Pass)', 'Degree (Pass)'], ['Masters', 'Masters']]) +
        selv('rt_yr', 'বর্ষ', [['', 'সব বর্ষ']].concat(YRS.map(function (y) { return [y, y]; }))) + inpt('rt_d', 'তারিখ', 'date') +
        selv('rt_rep', 'প্রতি সপ্তাহে', [['', 'একবার (শুধু ওই তারিখ)']].concat(WDN.map(function (w, i) { return [String(i), 'প্রতি ' + w]; }))) +
        inpt('rt_st', 'শুরু', 'time') + inpt('rt_en', 'শেষ', 'time') + inp('rt_sub', 'বিষয় / শিরোনাম *', '', 1) + inp('rt_tch', 'শিক্ষক') + inp('rt_room', 'রুম') +
        selv('rt_k', 'ধরন', [['class', '📘 ক্লাস'], ['exam', '📝 পরীক্ষা'], ['holiday', '🏖️ ছুটি']], 1) +
        '</div><button class="btn pr" onclick="ADM.put(\'routine\')">রুটিন যোগ করুন</button><h3>দেওয়া রুটিন (' + bn(rl.length) + ')</h3>' +
        (rl.map(function (r) {
          return '<div class="tuc"><b>' + esc(r.sub) + '</b> <small>' + (KLB[r.k] || '') + ' · ' + esc(r.dept === 'all' ? 'সব বিভাগ' : r.dept) + (r.prog ? ' · ' + esc(r.prog) : '') + (r.yr ? ' · ' + esc(r.yr) : '') + '</small><p>' +
            [r.rep !== '' ? 'প্রতি ' + WDN[+r.rep] : '', r.d ? esc(r.d) : '', r.st ? esc(r.st) + (r.en ? '–' + esc(r.en) : '') : '', r.tch ? esc(r.tch) : '', r.room ? 'রুম ' + esc(r.room) : ''].filter(Boolean).join(' · ') + '</p><div class="act">' + btn('🗑 মুছুন', 'ADM.del(\'routine\',\'' + r.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">কোনো রুটিন নেই</p>');
    }
    if (tab === 'market') {
      var LS = D.ls || [], OS = D.os || [], RK = D.rk || [], TIc = { book: '📚', want: '🙋', mess: '🏠', prod: '🛍️' }, LLb = { pending: '⏳ অপেক্ষায়', approved: '✅ চালু', rejected: '❌ বাতিল' };
      var OLb = { pending: '⏳ অপেক্ষায়', confirmed: '✅ কনফার্ম', delivered: '📦 ডেলিভারি', cancelled: '❌ বাতিল' };
      var lc = function (l) {
        var im = l.img ? l.img.split(',')[0] : '', b = function (st, lb) { return btn(lb, 'ADM.ls(\'' + l.id + '\',\'' + st + '\')'); };
        return '<div class="tuc"><b>' + TIc[l.type] + ' ' + esc(l.t) + '</b> <span class="tub">' + (l.sold === 'yes' ? '✔ শেষ' : LLb[l.status] || l.status) + '</span><p>' + [l.n, l.m, l.price, l.area, l.type === 'prod' && l.stock !== '' ? 'স্টক ' + l.stock : ''].filter(Boolean).map(esc).join(' · ') + '</p>' +
          (im ? '<img src="' + esc(im) + '" alt="" style="height:70px;border-radius:8px;margin-bottom:6px">' : '') + '<div class="act">' + (l.type !== 'prod' && l.status !== 'approved' ? b('approved', '✅ অনুমোদন') : '') + (l.type !== 'prod' && l.status !== 'rejected' ? b('rejected', '❌ বাতিল') : '') +
          (l.sold === 'yes' ? b('unsold', '↩ আবার চালু') : b('sold', l.type === 'prod' ? '🚫 স্টক শেষ' : '✔ শেষ')) + b('delete', '🗑') + '</div></div>';
      };
      var oc = function (o) {
        var b = function (st, lb) { return btn(lb, 'ADM.os(\'' + o.id + '\',\'' + st + '\')'); };
        return '<div class="tuc"><b>🛒 ' + esc(o.pt) + ' × ' + bn(o.qty) + '</b> <span class="tub">' + (OLb[o.status] || o.status) + '</span><p>' + [o.n, o.m, 'ডেলিভারি: ' + o.place, o.note, 'মোট ৳' + ((+o.price || 0) * (+o.qty || 1))].filter(Boolean).map(esc).join(' · ') + '</p><div class="act"><a class="ib" href="tel:' + esc(o.m) + '">📞</a>' +
          (o.status === 'pending' ? b('confirmed', '✅ কনফার্ম') : '') + (o.status === 'confirmed' || o.status === 'pending' ? b('delivered', '📦 ডেলিভারি হয়েছে') : '') + (o.status !== 'cancelled' && o.status !== 'delivered' ? b('cancelled', '❌ বাতিল') : '') + '</div></div>';
      };
      var pend = LS.filter(function (l) { return l.type !== 'prod' && l.status === 'pending'; }), other = LS.filter(function (l) { return l.type !== 'prod' && l.status !== 'pending'; }), prods = LS.filter(function (l) { return l.type === 'prod'; });
      var oPend = OS.filter(function (o) { return o.status === 'pending'; }), oRest = OS.filter(function (o) { return o.status !== 'pending'; });
      return '<h3>⏳ অনুমোদনের অপেক্ষায় (' + bn(pend.length) + ')</h3>' + (pend.map(lc).join('') || '<p class="cal-e">কিছু নেই</p>') +
        '<h3>🛒 নতুন অর্ডার (' + bn(oPend.length) + ')</h3>' + (oPend.map(oc).join('') || '<p class="cal-e">কোনো নতুন অর্ডার নেই</p>') +
        '<h3>🛍️ নতুন পণ্য যোগ করুন</h3><div class="tug">' + inp('p_t', 'পণ্যের নাম *', '', 1) + inp('p_cat', 'ক্যাটাগরি', 'বই / খাতা-কলম / ...') + inp('p_price', 'দাম (টাকা) *', '') + inp('p_stock', 'স্টক (ফাঁকা = সীমাহীন)', '') +
        '<div style="grid-column:1/-1"><label>বিস্তারিত</label><textarea id="p_note"></textarea></div><div style="grid-column:1/-1"><label>ছবি (সর্বোচ্চ ৩টি)</label><input type="file" id="p_img" accept="image/*" multiple></div></div><button class="btn pr" id="p_btn" onclick="ADM.padd()">পণ্য যোগ করুন</button>' +
        '<h3>আমার পণ্য (' + bn(prods.length) + ')</h3>' + (prods.map(lc).join('') || '<p class="cal-e">কোনো পণ্য নেই</p>') +
        '<h3>📦 Rokomari affiliate বই</h3><div class="tug">' + inp('k_t', 'বইয়ের নাম *', '', 1) + inp('k_u', 'Affiliate লিংক * (https://...)', 'https://', 1) + inp('k_p', 'দাম (ঐচ্ছিক)') + inp('k_i', 'ছবির লিংক (ঐচ্ছিক)', 'https://') + '</div><button class="btn pr" onclick="ADM.rk()">যোগ করুন</button>' +
        RK.map(function (r) { return '<div class="tuc"><b>' + esc(r.t) + '</b> <small>' + esc(r.price) + '</small><div class="act"><a class="ib" target="_blank" rel="noopener" href="' + esc(r.u) + '">খুলুন</a>' + btn('🗑 মুছুন', 'ADM.rkd(\'' + r.id + '\')') + '</div></div>'; }).join('') +
        '<h3>অন্য পোস্ট (' + bn(other.length) + ')</h3>' + (other.map(lc).join('') || '<p class="cal-e">কিছু নেই</p>') + '<h3>পুরোনো অর্ডার (' + bn(oRest.length) + ')</h3>' + (oRest.map(oc).join('') || '<p class="cal-e">কিছু নেই</p>');
    }
    if (tab === 'tuition') {
      var card = function (t, o) {
        var b = function (s, l) { return btn(l, 'ADM.ts(\'' + t + '\',\'' + o.id + '\',\'' + s + '\')'); };
        var info = t === 'tutor' ? [o.n, o.m, o.ins, o.sub, o.cls, o.area, o.sal] : [o.n, o.m, 'ক্লাস ' + o.cls, o.sub, o.area, o.sal];
        return '<div class="tuc"><b>' + (t === 'tutor' ? '👩‍🏫' : '📌') + ' ' + esc(info[0]) + '</b> <span class="tub">' + (LBL[o.status] || o.status) + '</span><p>' + info.slice(1).filter(Boolean).map(esc).join(' · ') + '</p><div class="act">' +
          (o.status !== 'approved' ? b('approved', '✅ অনুমোদন') : '') + (o.status !== 'rejected' ? b('rejected', '❌ বাতিল') : '') + (t === 'post' && o.status !== 'confirmed' ? b('confirmed', '🎉 কনফার্ম') : '') + b('delete', '🗑') + '</div></div>';
      }, srt = function (a) { return a.slice().sort(function (x, y) { return (x.status === 'pending' ? 0 : 1) - (y.status === 'pending' ? 0 : 1); }); };
      return '<h3>টিউটর (' + bn(D.tutors.length) + ')</h3>' + srt(D.tutors).map(function (x) { return card('tutor', x); }).join('') + '<h3>টিউশন পোস্ট (' + bn(D.posts.length) + ')</h3>' + srt(D.posts).map(function (x) { return card('post', x); }).join('');
    }
    if (tab === 'admins') {
      var pm = function (id, cur) { return Object.keys(PL).map(function (k) { return '<label style="display:inline-flex;gap:4px;align-items:center;margin:4px 10px 0 0;font-size:13px;color:var(--text)"><input type="checkbox" style="width:auto" data-pm="' + id + '" value="' + k + '"' + (cur.indexOf(k) > -1 ? ' checked' : '') + '>' + PL[k] + '</label>'; }).join(''); };
      return '<h3>নতুন অ্যাডমিন</h3><p style="color:var(--muted);font-size:12.5px">যাকে যে কাজ দিতে চান শুধু সেটাই টিক দিন। সে ওই কাজই করতে পারবে, বাকি কিছু না।</p><div class="tug">' + inp('u_n', 'নাম (ইংরেজিতে, লগইনের জন্য)') + inp('u_p', 'পাসওয়ার্ড (৬+ অক্ষর)') + selv('u_dept', 'বিভাগীয় প্রতিনিধি হলে বিভাগ বাছুন (সে শুধু নিজের বিভাগেই কাজ করবে)', [['', '— সাধারণ অ্যাডমিন —']].concat(Object.keys(DEPT).map(function (k) { return [k, k]; })), 1) + '</div>' + pm('new', '') +
        '<button class="btn pr" onclick="ADM.ua()">অ্যাডমিন যোগ করুন</button><h3>বর্তমান অ্যাডমিন</h3>' + ((D.admins || []).map(function (u) {
          return '<div class="tuc"><b>👤 ' + esc(u.name) + '</b>' + (u.dept ? ' <small>🎓 প্রতিনিধি: ' + esc(u.dept) + '</small>' : '') + '<div>' + pm(u.id, u.perms) + '</div><div class="act">' + btn('💾 সেভ', 'ADM.up(\'' + u.id + '\')') + btn('🗑 মুছুন', 'ADM.ud(\'' + u.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">এখনো কোনো অ্যাডমিন যোগ হয়নি</p>');
    }
    return '';
  }
  function picks(id) { return [].map.call(document.querySelectorAll('[data-pm="' + id + '"]:checked'), function (c) { return c.value; }); }

  function view() {
    var w = $('adw'); if (!w) return;
    if (!A) { w.innerHTML = '<p style="color:var(--muted);font-size:13px;margin:4px 0 8px">অ্যাডমিন নাম ও পাসওয়ার্ড দিন (মালিকের নাম: owner)</p><div class="tug"><div><label>নাম</label><input id="alu"></div><div><label>পাসওয়ার্ড</label><input id="alp" type="password"></div></div><button class="btn pr" onclick="ADM.login()">ঢুকুন</button>'; return; }
    w.innerHTML = '<div class="tu-tabs">' + TB.filter(function (t) { return !t[2] || (t[2] === 'su' ? A.su : can(t[2])); }).map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" onclick="ADM.go(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') +
      '<button onclick="ADM.out()">বের হন</button></div><small style="color:var(--muted)">👤 ' + esc(A.name) + (A.su ? ' (মালিক)' : '') + (A.dept ? ' · প্রতিনিধি: ' + esc(A.dept) : '') + '</small><div id="adb"><p class="cal-e">লোড হচ্ছে...</p></div>';
  }
  function load() { ap(LOAD[tab]).then(function (j) { D = j; var b = $('adb'); if (b) b.innerHTML = body(); }).catch(err); }
  function act(a, d) { ap(a, d).then(load).catch(err); }

  window.ADM = {
    login: function () { A = { u: v('alu'), p: $('alp').value }; ap('login').then(function (j) { A = { u: A.u, p: A.p, name: j.name, perms: j.perms, su: j.su, dept: j.dept || '' }; ADM.go('stats'); }).catch(function (e) { A = null; err(e); }); },
    out: function () { A = null; D = {}; view(); },
    go: function (t) { tab = t; view(); load(); },
    put: function (t) {
      var d = t === 'notice' ? { c: v('n_c'), d: v('n_d') || today(), t: v('n_t'), x: v('n_x'), u: v('n_u') }
        : t === 'routine' ? { dept: v('rt_dept'), prog: v('rt_prog'), yr: v('rt_yr'), d: v('rt_d'), rep: v('rt_rep'), st: v('rt_st'), en: v('rt_en'), sub: v('rt_sub'), tch: v('rt_tch'), room: v('rt_room'), k: v('rt_k') }
        : { t: v('r_t'), dept: v('r_dept'), yr: v('r_yr'), type: v('r_type'), u: v('r_u') };
      act('put', { t: t === 'resource' ? 'res' : t, d: d });
    },
    del: function (t, id) { if (confirm('মুছে ফেলবেন?')) act('del', { t: t === 'resource' ? 'res' : t, id: id }); },
    ts: function (t, id, s) { if (s !== 'delete' || confirm('মুছে ফেলবেন?')) act('tset', { t: t, id: id, s: s }); },
    ua: function () { act('uadd', { d: { name: v('u_n'), pw: $('u_p').value, perms: picks('new'), dept: v('u_dept') } }); },
    up: function (id) { ap('uperm', { id: id, perms: picks(id) }).then(function () { alert('সেভ হয়েছে'); }).catch(err); },
    ls: function (id, st) { if (st !== 'delete' || confirm('মুছে ফেলবেন? (ছবিসহ)')) act('lset', { id: id, s: st }); },
    os: function (id, st) { act('oset', { id: id, s: st }); },
    padd: function () {
      var b = $('p_btn'); b.disabled = true; b.textContent = 'যোগ হচ্ছে...';
      MK.files($('p_img')).then(function (imgs) { return ap('padd', { d: { t: v('p_t'), cat: v('p_cat'), price: v('p_price'), stock: v('p_stock'), note: v('p_note'), imgs: imgs } }); })
        .then(load).catch(function (e) { b.disabled = false; b.textContent = 'পণ্য যোগ করুন'; err(e); });
    },
    rk: function () { act('rkadd', { d: { t: v('k_t'), u: v('k_u'), price: v('k_p'), img: v('k_i') } }); },
    rkd: function (id) { if (confirm('মুছবেন?')) act('rkdel', { id: id }); },
    ud: function (id) { if (confirm('এই অ্যাডমিন মুছবেন?')) act('udel', { id: id }); }
  };

  /* ---------- site-er sathe jora ---------- */
  delete SOON.admin;
  HUB.forEach(function (h) { if (h[1] === 'admin') { h[4] = 'live'; h[3] = 'নোটিশ, রিসোর্স, রুটিন, মার্কেট, টিউশন ও অ্যাডমিন পরিচালনা'; } });
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  VW.admin = ['Admin Panel', '<div id="adw"></div>', function () { view(); if (A) ADM.go(tab); }];
  VW.notice = ['College Notice Board', '<div id="nbx"></div>', function () { $('nbx').innerHTML = noticeR(); pubLoad().then(function () { var e = $('nbx'); if (e) e.innerHTML = noticeR(); }).catch(function () {}); }];
  var lo = VW.lib[2]; VW.lib[2] = function () { lo(); pubLoad().then(function () { if ($('lr')) libR(); }).catch(function () {}); };
  setTimeout(function () { pubLoad().catch(function () {}); }, 0);
})();
