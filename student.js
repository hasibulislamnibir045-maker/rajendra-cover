/* ===== Student account + dashboard + class routine (tuition.js-er pore, admin.js-er age load hobe) ===== */
(function () {
  var KEY = 'rsh_stu', S = ld(KEY, null), DAT = null, mode = 'login', tab = 'today', msg = '', busy = false;
  var WD = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  var KL = { 'class': '📘 ক্লাস', exam: '📝 পরীক্ষা', holiday: '🏖️ ছুটি' };

  function pad(n) { return ('0' + n).slice(-2); }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function api(a, d) {
    var U = window.RSH_API;
    if (!/^https/.test(U || '')) return Promise.reject(new Error('Admin এখনো Apps Script URL বসায়নি'));
    return fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ a: a }, d || {})) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.err) throw new Error(j.err); return j; });
  }
  function fmtT(t) {
    if (!t) return ''; var p = String(t).split(':'), h = +p[0], m = p[1] || '00', ap = h >= 12 ? 'PM' : 'AM';
    return bn(pad(h % 12 || 12) + ':' + m) + ' ' + ap;
  }
  function on(r, s, wd) {
    var d = String(r.d || '').slice(0, 10);
    if (r.rep === '' || r.rep == null) return d === s;
    return (!d || s >= d) && +r.rep === wd;
  }
  /* kono tarikhe ei student-er routine (calendar-o eta use kore) */
  window.stuRt = function (s) {
    if (!DAT) return [];
    var wd = new Date(s + 'T00:00:00').getDay();
    return DAT.rt.filter(function (r) { return on(r, s, wd); }).sort(function (a, b) { return String(a.st).localeCompare(String(b.st)); });
  };
  window.stuIn = function () { return !!DAT; };
  window.stuMe = function () { return DAT ? DAT.me : null; };

  function setData(j) {
    DAT = j; sv(KEY, S); label();
    if (window.calR) calR();
    if (window.notiChk) notiChk();
    if ($('stw')) draw();
  }
  function label() { var b = $('stb'); if (b) b.textContent = DAT ? '👤 ' + String(DAT.me.n).split(' ')[0] : '👤 Student'; }
  function load() {
    return api('sdata', S).then(setData).catch(function (e) {
      if (/ভুল/.test(e.message)) { S = null; DAT = null; sv(KEY, null); label(); }
      msg = e.message; if ($('stw')) draw();
    });
  }

  /* ---------- UI pieces ---------- */
  function item(r) {
    var t = r.st ? fmtT(r.st) + (r.en ? ' – ' + fmtT(r.en) : '') : '';
    return '<div class="rti ' + esc(r.k) + '"><b>' + esc(r.sub) + '</b> <small>' + (KL[r.k] || '') + '</small><div>' +
      [t ? '⏰ ' + t : '', r.tch ? '👨‍🏫 ' + esc(r.tch) : '', r.room ? '🚪 ' + esc(r.room) : ''].filter(Boolean).join(' · ') + '</div></div>';
  }
  function dayLabel(i, d) { return i === 0 ? 'আজ' : i === 1 ? 'আগামীকাল' : WD[d.getDay()]; }
  function exams(n) {
    var out = [], td = new Date(new Date().toDateString());
    for (var i = 0; i < n; i++) {
      var d = new Date(td); d.setDate(d.getDate() + i);
      window.stuRt(ds(d)).forEach(function (r) { if (r.k === 'exam') out.push({ i: i, d: d, r: r }); });
    }
    return out;
  }
  function authUI() {
    var dept = Object.keys(DEPT).map(function (k) { return '<option value="' + esc(k) + '">' + esc(k) + ' / ' + esc(DEPT[k]) + '</option>'; }).join('');
    var h = '<p style="color:var(--muted);font-size:13px;margin:4px 0 8px">নিজের বিভাগ ও বর্ষ অনুযায়ী ক্লাস রুটিন, পরীক্ষা, নোটিশ ও রিসোর্স এক জায়গায় পাবেন।</p>' +
      '<div class="tu-tabs"><button class="' + (mode === 'login' ? 'on' : '') + '" onclick="STU.mode(\'login\')">🔑 লগইন</button><button class="' + (mode === 'reg' ? 'on' : '') + '" onclick="STU.mode(\'reg\')">📝 নতুন রেজিস্ট্রেশন</button></div>';
    if (msg) h += '<div class="res" style="margin:8px 0">' + esc(msg) + '</div>';
    if (mode === 'login') {
      return h + '<div class="tug"><div><label>মোবাইল</label><input id="sl_m" type="tel" maxlength="11" value="' + esc(S ? S.m : '') + '"></div><div><label>PIN (৪ সংখ্যা)</label><input id="sl_p" type="tel" maxlength="4"></div></div>' +
        '<button class="btn pr" id="stgo" onclick="STU.login()">ঢুকুন</button>';
    }
    return h + '<div class="tug"><div><label>নাম *</label><input id="sg_n"></div><div><label>ক্লাস রোল *</label><input id="sg_r"></div>' +
      '<div style="grid-column:1/-1"><label>বিভাগ *</label><select id="sg_d">' + dept + '</select></div>' +
      '<div><label>স্তর *</label><select id="sg_g" onchange="STU.yrs()"><option>Honours</option><option>Degree (Pass)</option><option>Masters</option></select></div><div><label>বর্ষ *</label><select id="sg_y"></select></div>' +
      '<div><label>মোবাইল *</label><input id="sg_m" type="tel" maxlength="11" placeholder="01XXXXXXXXX"></div><div><label>৪ সংখ্যার PIN *</label><input id="sg_p" type="tel" maxlength="4" placeholder="মনে রাখবেন"></div></div>' +
      '<button class="btn pr" id="stgo" onclick="STU.reg()">রেজিস্ট্রেশন করুন</button>';
  }
  function dashUI() {
    var me = DAT.me, td = new Date(new Date().toDateString()), h = '';
    h += '<div class="tuc"><b>👤 ' + esc(me.n) + '</b><p>' + esc(me.dept) + ' · ' + esc(me.prog) + ' · ' + esc(me.yr) + '<br>রোল: ' + esc(bn(me.roll)) + ' · মোবাইল: ' + esc(me.m) + '</p>' +
      '<div class="act"><button class="ib" onclick="STU.cover()">📄 কভার পেজে ব্যবহার</button><button class="ib" onclick="STU.cal()">📅 ক্যালেন্ডার</button><button class="ib" onclick="STU.refresh()">🔄 রিফ্রেশ</button><button class="ib" onclick="STU.out()">বের হন</button></div></div>';
    var soon = exams(4);
    if (soon.length) h += '<div class="res" style="margin:8px 0">🔔 ' + soon.map(function (x) { return esc(x.r.sub) + ' — ' + (x.i ? bn(x.i) + ' দিন বাকি' : 'আজ!'); }).join(' · ') + '</div>';
    if (msg) h += '<div class="res" style="margin:8px 0">' + esc(msg) + '</div>';
    var T = [['today', '🗓️ রুটিন'], ['exam', '📝 পরীক্ষা'], ['notice', '📢 নোটিশ'], ['res', '📚 রিসোর্স']];
    h += '<div class="tu-tabs">' + T.map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" onclick="STU.tab(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'today') {
      var any = 0;
      for (var i = 0; i < 7; i++) {
        var d = new Date(td); d.setDate(d.getDate() + i); var L = window.stuRt(ds(d));
        if (!L.length) continue; any = 1;
        h += '<h3>' + dayLabel(i, d) + ' <small style="text-transform:none;color:var(--muted)">' + bn(d.getDate() + ' ' + MBN[d.getMonth()]) + '</small></h3>' + L.map(item).join('');
      }
      if (!any) h += '<p class="cal-e">আগামী ৭ দিনে আপনার ক্লাসের কোনো রুটিন নেই</p>';
    } else if (tab === 'exam') {
      var E = exams(90);
      h += E.length ? E.map(function (x) { return '<h3>' + (x.i ? bn(x.i) + ' দিন বাকি' : 'আজ') + ' <small style="text-transform:none;color:var(--muted)">' + bn(x.d.getDate() + ' ' + MBN[x.d.getMonth()] + ', ' + x.d.getFullYear()) + '</small></h3>' + item(x.r); }).join('')
        : '<p class="cal-e">আগামী ৩ মাসে কোনো পরীক্ষার রুটিন নেই</p>';
    } else if (tab === 'notice') {
      var N = DAT.nt.slice().sort(function (a, b) { return String(b.d).localeCompare(String(a.d)); });
      h += N.map(function (n) {
        return '<div class="tuc"><b>' + esc(n.t) + '</b> <small>' + (n.dept ? '⭐ আপনার বিভাগ · ' : '') + esc(n.c || '') + ' · ' + esc(n.d) + '</small><p>' + esc(n.x || '') + (n.u ? ' <a style="color:var(--gold)" target="_blank" rel="noopener" href="' + esc(n.u) + '">লিংক</a>' : '') + '</p></div>';
      }).join('') || '<p class="cal-e">কোনো নোটিশ নেই</p>';
    } else {
      h += DAT.res.map(function (r) {
        return '<div class="ex"><span><b>' + esc(r.t) + '</b><br><small style="color:var(--muted)">' + esc(r.yr) + ' · ' + esc(r.type) + '</small></span><a class="ib" style="text-decoration:none;font-size:13px" href="' + esc(r.u) + '" target="_blank" rel="noopener">খুলুন</a></div>';
      }).join('') || '<p class="cal-e">আপনার বিভাগের কোনো রিসোর্স এখনো যোগ হয়নি</p>';
    }
    return h;
  }
  function draw() {
    var w = $('stw'); if (!w) return;
    if (busy) { w.innerHTML = '<p class="cal-e">লোড হচ্ছে...</p>'; return; }
    w.innerHTML = DAT ? dashUI() : authUI();
    if (!DAT && mode === 'reg') STU.yrs();
  }
  function go(p) {
    busy = true; msg = ''; draw();
    return p.catch(function (e) { msg = e.message || 'সার্ভারে সমস্যা'; }).then(function () { busy = false; draw(); });
  }

  window.STU = {
    mode: function (m) { mode = m; msg = ''; draw(); },
    yrs: function () { var g = $('sg_g'), y = $('sg_y'); if (g && y) y.innerHTML = YEARS[g.value].map(function (x) { return '<option value="' + x[0] + '">' + x[0] + ' / ' + x[1] + '</option>'; }).join(''); },
    login: function () {
      var m = $('sl_m').value.trim(), p = $('sl_p').value.trim();
      if (!/^01\d{9}$/.test(m) || !/^\d{4}$/.test(p)) { msg = 'সঠিক মোবাইল ও ৪ সংখ্যার PIN দিন'; return draw(); }
      S = { m: m, pin: p }; go(api('sdata', S).then(setData).catch(function (e) { S = null; throw e; }));
    },
    reg: function () {
      var v = function (i) { return $(i).value.trim(); }, d = { n: v('sg_n'), roll: v('sg_r'), dept: v('sg_d'), prog: v('sg_g'), yr: v('sg_y'), m: v('sg_m'), pin: v('sg_p') };
      if (!d.n || !d.roll) { msg = 'নাম ও রোল দিন'; return draw(); }
      if (!/^01\d{9}$/.test(d.m)) { msg = 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)'; return draw(); }
      if (!/^\d{4}$/.test(d.pin)) { msg = 'PIN ঠিক ৪ সংখ্যার হতে হবে'; return draw(); }
      S = { m: d.m, pin: d.pin }; tab = 'today';
      go(api('sreg', { d: d }).then(setData).catch(function (e) { S = null; throw e; }));
    },
    out: function () { S = null; DAT = null; sv(KEY, null); label(); if (window.calR) calR(); draw(); },
    tab: function (t) { tab = t; draw(); },
    refresh: function () { go(api('sdata', S).then(setData)); },
    cal: function () { closeV(); var c = $('calsec'); if (c) c.scrollIntoView({ behavior: 'smooth' }); },
    cover: function () {
      var me = DAT.me; $('clg').value = 'r'; $('name').value = me.n; $('roll').value = me.roll; $('ph').value = me.m; $('dept').value = me.dept; $('prog').value = me.prog; fillYears();
      var yi = YEARS[me.prog].map(function (y) { return y[0]; }).indexOf(me.yr); $('year').selectedIndex = Math.max(0, yi);
      render(); closeV(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* Notification: Study Planner + class routine-er pariksha, 3 diner moddhe */
  window.notiChk = function () {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      var td = new Date(new Date().toDateString()), seen = {};
      var fire = function (n, t, d) { var k = t + d; if (seen[k]) return; seen[k] = 1; new Notification('📚 ' + t, { body: n ? bn(n) + ' দিন বাকি' : 'আজ পরীক্ষা!', tag: k }); };
      ld('rsh_ex', []).forEach(function (e) { var n = Math.ceil((new Date(e.d) - td) / 864e5); if (n >= 0 && n <= 3) fire(n, e.n, e.d); });
      exams(4).forEach(function (x) { fire(x.i, x.r.sub, ds(x.d)); });
    } catch (e) {}
  };

  /* hub-e tile + header button + view */
  HUB.splice(1, 0, ['👤', 'stu', 'Student Login', 'প্রোফাইল, ক্লাস রুটিন ও আপডেট', 'live']);
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  VW.stu = ['Student Login & Dashboard', '<div id="stw"></div>', function () { draw(); if (S && !DAT) { busy = true; draw(); load().then(function () { busy = false; draw(); }); } }];
  label();
  if (S) setTimeout(load, 0);   // calendar-e routine highlight-er jonno chupchap load
})();
