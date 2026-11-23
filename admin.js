/* ===== Admin Panel (tuition.js-er sathe load hobe; API URL ekhane lagbe na) ===== */
(function () {
  var A = null, D = {}, tab = 'stats';
  var PL = { notice: '📢 নোটিশ', resource: '📚 রিসোর্স', tuition: '🎓 টিউশন' };           // permission nam
  var TB = [['stats', '📊 সারসংক্ষেপ'], ['notice', '📢 নোটিশ', 'notice'], ['resource', '📚 রিসোর্স', 'resource'], ['tuition', '🎓 টিউশন', 'tuition'], ['admins', '👥 অ্যাডমিন', 'su']];
  var LOAD = { stats: 'stats', notice: 'pub', resource: 'pub', tuition: 'tlist', admins: 'ulist' };
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
          return '<div class="tuc"><b>' + esc(n.t) + '</b> <small>' + esc(n.c) + ' · ' + esc(n.d) + ' · by ' + esc(n.by) + '</small><div class="act">' + btn('🗑 মুছুন', 'ADM.del(\'notice\',\'' + n.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">কোনো নোটিশ নেই</p>');
    }
    if (tab === 'resource') {
      return '<h3>নতুন রিসোর্স</h3><div class="tug">' + inp('r_t', 'শিরোনাম *', '', 1) + sel('r_dept', 'বিভাগ', Object.keys(DEPT)) + sel('r_yr', 'বর্ষ', ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Masters']) +
        sel('r_type', 'ধরন', ['প্রশ্নপত্র', 'সিলেবাস', 'সাজেশন', 'বইয়ের তালিকা', 'নোট']) + inp('r_u', 'লিংক * (Drive / PDF)', 'https://') + '</div><button class="btn pr" onclick="ADM.put(\'resource\')">যোগ করুন</button>' +
        '<h3>রিসোর্স তালিকা</h3>' + ((D.res || []).map(function (r) {
          return '<div class="tuc"><b>' + esc(r.t) + '</b> <small>' + esc(r.dept) + ' · ' + esc(r.yr) + ' · ' + esc(r.type) + '</small><div class="act"><a class="ib" target="_blank" rel="noopener" href="' + esc(r.u) + '">খুলুন</a>' + btn('🗑 মুছুন', 'ADM.del(\'resource\',\'' + r.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">কিছু নেই</p>');
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
      return '<h3>নতুন অ্যাডমিন</h3><p style="color:var(--muted);font-size:12.5px">যাকে যে কাজ দিতে চান শুধু সেটাই টিক দিন। সে ওই কাজই করতে পারবে, বাকি কিছু না।</p><div class="tug">' + inp('u_n', 'নাম (ইংরেজিতে, লগইনের জন্য)') + inp('u_p', 'পাসওয়ার্ড (৬+ অক্ষর)') + '</div>' + pm('new', '') +
        '<button class="btn pr" onclick="ADM.ua()">অ্যাডমিন যোগ করুন</button><h3>বর্তমান অ্যাডমিন</h3>' + ((D.admins || []).map(function (u) {
          return '<div class="tuc"><b>👤 ' + esc(u.name) + '</b><div>' + pm(u.id, u.perms) + '</div><div class="act">' + btn('💾 সেভ', 'ADM.up(\'' + u.id + '\')') + btn('🗑 মুছুন', 'ADM.ud(\'' + u.id + '\')') + '</div></div>';
        }).join('') || '<p class="cal-e">এখনো কোনো অ্যাডমিন যোগ হয়নি</p>');
    }
    return '';
  }
  function picks(id) { return [].map.call(document.querySelectorAll('[data-pm="' + id + '"]:checked'), function (c) { return c.value; }); }

  function view() {
    var w = $('adw'); if (!w) return;
    if (!A) { w.innerHTML = '<p style="color:var(--muted);font-size:13px;margin:4px 0 8px">অ্যাডমিন নাম ও পাসওয়ার্ড দিন (মালিকের নাম: owner)</p><div class="tug"><div><label>নাম</label><input id="alu"></div><div><label>পাসওয়ার্ড</label><input id="alp" type="password"></div></div><button class="btn pr" onclick="ADM.login()">ঢুকুন</button>'; return; }
    w.innerHTML = '<div class="tu-tabs">' + TB.filter(function (t) { return !t[2] || (t[2] === 'su' ? A.su : can(t[2])); }).map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" onclick="ADM.go(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') +
      '<button onclick="ADM.out()">বের হন</button></div><small style="color:var(--muted)">👤 ' + esc(A.name) + (A.su ? ' (মালিক)' : '') + '</small><div id="adb"><p class="cal-e">লোড হচ্ছে...</p></div>';
  }
  function load() { ap(LOAD[tab]).then(function (j) { D = j; if (tab === 'notice' || tab === 'resource') fill(j); var b = $('adb'); if (b) b.innerHTML = body(); }).catch(err); }
  function act(a, d) { ap(a, d).then(load).catch(err); }

  window.ADM = {
    login: function () { A = { u: v('alu'), p: $('alp').value }; ap('login').then(function (j) { A = { u: A.u, p: A.p, name: j.name, perms: j.perms, su: j.su }; ADM.go('stats'); }).catch(function (e) { A = null; err(e); }); },
    out: function () { A = null; D = {}; view(); },
    go: function (t) { tab = t; view(); load(); },
    put: function (t) {
      var d = t === 'notice' ? { c: v('n_c'), d: v('n_d') || today(), t: v('n_t'), x: v('n_x'), u: v('n_u') } : { t: v('r_t'), dept: v('r_dept'), yr: v('r_yr'), type: v('r_type'), u: v('r_u') };
      act('put', { t: t === 'notice' ? 'notice' : 'res', d: d });
    },
    del: function (t, id) { if (confirm('মুছে ফেলবেন?')) act('del', { t: t === 'notice' ? 'notice' : 'res', id: id }); },
    ts: function (t, id, s) { if (s !== 'delete' || confirm('মুছে ফেলবেন?')) act('tset', { t: t, id: id, s: s }); },
    ua: function () { act('uadd', { d: { name: v('u_n'), pw: $('u_p').value, perms: picks('new') } }); },
    up: function (id) { ap('uperm', { id: id, perms: picks(id) }).then(function () { alert('সেভ হয়েছে'); }).catch(err); },
    ud: function (id) { if (confirm('এই অ্যাডমিন মুছবেন?')) act('udel', { id: id }); }
  };

  /* ---------- site-er sathe jora ---------- */
  delete SOON.admin;
  HUB.forEach(function (h) { if (h[1] === 'admin') { h[4] = 'live'; h[3] = 'নোটিশ, রিসোর্স, টিউশন ও অ্যাডমিন পরিচালনা'; } });
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  VW.admin = ['Admin Panel', '<div id="adw"></div>', function () { view(); if (A) ADM.go(tab); }];
  VW.notice = ['College Notice Board', '<div id="nbx"></div>', function () { $('nbx').innerHTML = noticeR(); pubLoad().then(function () { var e = $('nbx'); if (e) e.innerHTML = noticeR(); }).catch(function () {}); }];
  var lo = VW.lib[2]; VW.lib[2] = function () { lo(); pubLoad().then(function () { if ($('lr')) libR(); }).catch(function () {}); };
  setTimeout(function () { pubLoad().catch(function () {}); }, 0);
})();
