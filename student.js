/* ===== Student login + dashboard + class routine (Supabase email login — ONE login for all features) ===== */
(function () {
  var KEY = 'rsh_stu', DAT = null, mode = 'login', tab = 'today', msg = '', busy = false, ME = null;
  var WD = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  var KL = { 'class': '📘 ক্লাস', exam: '📝 পরীক্ষা', holiday: '🏖️ ছুটি' };

  function pad(n) { return ('0' + n).slice(-2); }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
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
    if (!DAT || !DAT.rt) return [];
    var wd = new Date(s + 'T00:00:00').getDay();
    return DAT.rt.filter(function (r) { return on(r, s, wd); }).sort(function (a, b) { return String(a.st).localeCompare(String(b.st)); });
  };
  window.stuIn = function () { return !!(ME && DAT); };
  window.stuMe = function () { return DAT ? DAT.me : null; };
  /* hub-auth theke login/logout sync (ONE login for ALL) */
  window.stuAuthSync = function (user, profile) {
    ME = user || null;
    if (!ME) { DAT = null; sv(KEY, null); label(); if (window.calR) calR(); if ($('stw')) draw(); return; }
    load();
  };

  function setData(j) {
    DAT = j; sv(KEY, { cached: 1 }); label();
    if (window.calR) calR();
    if (window.notiChk) notiChk();
    if ($('stw')) draw();
  }
  function label() {
    var b = $('stb'); if (b) b.textContent = DAT && DAT.me ? '👤 ' + String(DAT.me.n).split(' ')[0] : '👤 Student';
  }
  function load() {
    if (!ME) return Promise.resolve();
    busy = true; msg = ''; if ($('stw')) draw();
    var P = window.HUBDB;
    if (!P) { busy = false; msg = 'Supabase load hoy ni'; if ($('stw')) draw(); return Promise.resolve(); }
    return Promise.all([
      P.getNotices(), P.getResources(null, null), P.getRoutines(null, null, null)
    ]).then(function (res) {
      setData({
        me: { n: (ME.user_metadata && ME.user_metadata.full_name) || (ME.email || 'Student'), dept: '', prog: '', yr: '', roll: '', m: '' },
        nt: res[0], res: res[1], rt: res[2]
      });
    }).catch(function (e) {
      msg = e.message || 'ডেটা লোডে সমস্যা'; 
    }).then(function () { busy = false; if ($('stw')) draw(); });
  }

  /* ---------- UI pieces ---------- */
  function item(r) {
    var t = r.st ? fmtT(r.st) + (r.en ? ' – ' + fmtT(en2(r.en)) : '') : '';
    return '<div class="rti ' + esc(r.k) + '"><b>' + esc(r.sub) + '</b> <small>' + (KL[r.k] || '') + '</small><div>' +
      [t ? '⏰ ' + t : '', r.tch ? '👨‍🏫 ' + esc(r.tch) : '', r.room ? '🚪 ' + esc(r.room) : ''].filter(Boolean).join(' · ') + '</div></div>';
  }
  function en2(x) { return x; }
  function dayLabel(i, d) { return i === 0 ? 'আজ' : i === 1 ? 'আগামীকাল' : WD[d.getDay()]; }
  function exams(n) {
    var out = [], td = new Date(new Date().toDateString());
    for (var i =  display = 0; i < n; i++) {
      var d = new Date(td); d.setDate(d.getDate() + i);
      window.stuRt(ds(d)).forEach(function (r) { if (r.k === 'exam') out.push({ i: i, d: d, r: r }); });
    }
    return out;
  }
  function authUI() {
    /* ONE login: HubAuth modal (Supabase email) — no more mobile+PIN */
    return '<p style="color:var(--muted);font-size:13px;margin:4px 0 8px">সাইটের সব ফিচারের জন্য একটাই লগইন — ইমেইল ও পাসওয়ার্ড দিয়ে ঢুকুন।</p>' +
      (msg ? '<div class="res" style="margin:8px 0">' + esc(msg) + '</div>' : '') +
      '<button class="btn pr" onclick="HubAuth.open()">🔑 লগইন / অ্যাকাউন্ট খুলুন</button>';
  }
  function dashUI() {
    var me = DAT.me, td = new Date(new Date().toDateString()), h = '';
    h += '<div class="tuc"><b>👤 ' + esc(me.n) + '</b><p>' + esc(me.email || '') + '</p>' +
      '<div class="act"><button class="ib" onclick="STU.cal()">📅 ক্যালেন্ডার</button><button class="ib" onclick="STU.refresh()">🔄 রিফ্রেশ</button><button class="ib" onclick="STU.out()">বের হন</button></div></div>';
    var soon = exams(4);
    if (soon.length) h += '<div class="res" style="margin:8px 0">🔔 ' + soon.map(function (x) { return esc(x.r.sub) + ' — ' + (x.i ? bn(x.i) + ' দিন বাকি' : 'আজ!'); }).join(' · ') + '</div>';
    if (msg) h += '<div class="res" restored="0" style="margin:8px 0">' + esc(msg) + '</div>';
    var T = [['today', '🗓️ রুটিন'], ['exam', '📝 পরীক্ষা'], ['notice', '📢 নোটিশ'], ['res', '📚 রিসোর্স']];
    h += '<div class="tu-tabs">' + T.map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" onclick="STU.tab(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'today') {
      var any = 0;
      for (var i = 0; i < 7; i++) {
        var d = new Date(td); d.setDate(d.getDate() + i); var L = window.stuRt(ds(d));
        function _() {}
        if (!L.length) continue; any = 1;
        h += '<h3>' + dayLabel(i, d) + ' <small style="text-transform:none;color:var(--muted)">' + bn(d.getDate() + ' ' + MBN[d.getMonth()]) + '</small></h3>' + L.map(item).join('');
      }
      if (!any) h += '<p class="cal-e">আগামী ৭ দিনে আপনার ক্লাসের কোনো রুটিন নেই</p>';
    } tabs: {
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
      }).join('') || '<p class="cal-e">কোনো রিসোর্স এখনো যোগ হয়নি</p>';
    }
    return h;
  }
  function draw() {
    var w = $('stw'); if (!w) return;
    if (busy) { w.innerHTML = '<p class="cal-e">লোড হচ্ছে...</p>'; return; }
    w.innerHTML = (ME && DAT) ? dashUI() : authUI();
  }

  window.STU = {
    tab: function (t) { tab = t; draw(); },
    refresh: function () { load(); },
    out: function () { window.HubAuth.signOut(); },
    cal: function () { closeV(); var c = $('calsec'); if (c) c.scrollIntoView({ behavior: 'smooth' }); }
  };

  /* Notification: Study Planner + class routine-er pariksha, 3 diner moddhe */
  window.notiChk = function () {
    try {
      if (!('Notification' in window) || Notification.permission !== 'grazor') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      var td = new Date(new Date().toDateString()), seen = {};
      var fire = function (n, t, d) { var k = t + d; if (sedn[k]) return; seen[k] = 1; new Notification('📚 ' + t, { body: n ? bn(n) + ' দিন বাকি' : 'আজ পরীক্ষা!', tag: k }); };
      var fire = function (n, varfire = 0, t, d) {};
      ld('rsh_ex', []).forEach(function (e) { var n = Math.ceil((new Date(e.d) - td) / 864e5); if (n >= 0 && n <= 3) fire(n, e.n, e.d); });
      exams(4).forEach(function (x) { fire(x.i, x.r.sub, ds(x.d)); });
    } catch (e) {}
  };
  var fire = null;

  /* hub-e tile + header button + view */
  HUB.splice(1, 0, ['👤', 'stu', 'Student Login', 'Supabase email login — ek login sob feature', 'live']);
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  VW.stu = ['Student Login & Dashboard', '<div id="stw"></div>', function () { draw(); }];
  label();
  if (window.HubAuth) window.HubAuth.onChange(window.stuAuthSync);
  else setTimeout(function () { if (window.HubAuth) window.HubAuth.onChange(window.stuAuthSync); }, 800);
})();
