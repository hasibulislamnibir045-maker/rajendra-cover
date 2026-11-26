/* ============================================================
   HUB-AUTH :: Shared Supabase email login — ONE login for ALL features
   - signIn / signUp / signOut / session / isAdmin helpers
   - Login modal UI (Hut-style orange theme) auto-injected
   - Fires HubAuth events so every feature stays in sync
   Depends on hubdb.js (loaded first by hub-loader.js)
   ============================================================ */
(function () {
  var H = window.HUBDB;
  if (!H) { console.error('hub-auth: HUBDB not loaded'); return; }

  var me = null, profile = null, modalOpen = false, mode = 'login', busy = false, msg = '';
  var listeners = [];
  window.HubAuth = {
    /* Register callbacks: fn(user, profile) — fires on every login/logout */
    onChange: function (fn) { if (fn) listeners.push(fn); try { fn(me, profile); } catch (e) {} },
    user: function () { return me; },
    profile: function () { return profile; },
    isAdmin: function () { return !!(profile && profile.is_admin); },
    require: function () {  /* returns Promise resolving to user, or opens login modal */
      if (me) return Promise.resolve(me);
      return new Promise(function (res) {
        window.HubAuth.open(function (u) { res(u); });
      });
    },
    open: function (onDone) {
      if (onDone) pending.push(onDone);
      modalOpen = true; render();
    },
    close: function () { modalOpen = false; render(); },
    signIn: function (email, pass) {
      return H.signIn(email, pass).then(loadProfile).then(function () { msg = ''; done(); });
    },
    signUp: function (name, email, pass) {
      return H.signUp(name, email, pass).then(loadProfile).then(function () {
        msg = '✅ Account toiri hoyeche. Ekhon login korun.'; mode = 'login'; render();
      });
    },
    signOut: function () {
      return H.signOut().then(function () { me = null; profile = null; fire(); notifyAll(); });
    }
  };

  var pending = [];
  function loadProfile() {
    me = H.user();
    if (!me) return null;
    return H.profile().then(function (p) { profile = p || null; });
  }
  function fire() { listeners.forEach(function (fn) { try { fn(me, profile); } catch (e) {} }); }
  function done() {
    modalOpen = false;
    var q = pending.splice(0);
    q.forEach(function (fn) { try { fn(me); } catch (e) {} });
    fire(); notifyAll();
  }
  /* Old features still call window.stuIn()/stuMe() — keep them working */
  function notifyAll() {
    if (window.stuAuthSync) window.stuAuthSync(me, profile);
    if (window.hubNoticeSync) window.hubNoticeSync(me, profile);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  /* ---------- Login modal UI (Hut orange theme) ---------- */
  function render() {
    var host = document.getElementById('hub-auth-root');
    if (!host) { host = document.createElement('div'); host.id = 'hub-auth-root'; document.body.appendChild(host); }
    if (!modalOpen) { host.innerHTML = ''; return; }
    host.innerHTML =
      '<div class="hub-modal" onclick="if(event.target===this)HubAuth.close()">' +
        '<div class="hub-card">' +
          '<div class="hub-card-head"><b>👤 লগইন</b><button class="hub-x" onclick="HubAuth.close()">✕</button></div>' +
          '<p class="hub-sub">এক লগইন দিয়েই সব ফিচার — নোটিশ, রিসোর্স, রুটিন</p>' +
          '<div class="hub-tabs">' +
            '<button class="' + (mode === 'login' ? 'on' : '') + '" onclick="HubAuth.mode(\'login\')">🔑 লগইন</button>' +
            '<button class="' + (mode === 'reg' ? 'on' : '') + '" onclick="HubAuth.mode(\'reg\')">📝 নতুন অ্যাকাউন্ট</button>' +
          '</div>' +
          (msg ? '<div class="hub-msg">' + esc(msg) + '</div>' : '') +
          (mode === 'login'
            ? '<div class="hub-f"><label>ইমেইল</label><input id="ha_em" type="email" placeholder="you@example.com"></div>' +
              '<div class="hub-f"><label>পাসওয়ার্ড</label><input id="ha_pw" type="password" placeholder="••••••••"></div>' +
              '<button class="hub-btn" onclick="HubAuth.go()">' + (busy ? '⏳ হচ্ছে...' : 'ঢুকুন') + '</button>'
            : '<div class="hub-f"><label>নাম</label><input id="ha_nm" placeholder="আপনার নাম"></div>' +
              '<div class="hub-f"><label>ইমেইল</label><input id="ha_em" type="email" placeholder="you@example.com"></div>' +
              '<div class="hub-f"><label>পাসওয়ার্ড (৬+ অক্ষর)</label><input id="ha_pw" type="password" placeholder="••••••••"></div>' +
              '<button class="hub-btn" onclick="HubAuth.go()">' + (busy ? '⏳ হচ্ছে...' : 'অ্যাকাউন্ট খুলুন') +() + '</button>'
          ) +
        '</div>' +
      '</div>';
    if (mode === 'reg') { var nm = document.getElementById('ha_nm'); if (nm) nm.focus(); }
  }
  window.HubAuth.mode = function (m) { mode = m; msg = ''; render(); };
  window.HubAuth.go = function () {
    var em = (document.getElementById('ha_em') || {}).value || '';
    var pw = (document.getElementById('ha_pw') || {}).value || '';
    em = String(em).trim(); pw = String(pw).trim();
    if (!em || !pw) { msg = 'ইমেইল ও পাসওয়ার্ড দিন'; render(); return; }
    if (mode === 'reg') {
      var nm = String(((document.getElementById('ha_nm') || {}).value) || '').trim();
      if (!nm) { msg = 'নাম দিন'; render(); return; }
      if (pw.length < 6) { msg = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর দিন'; render(); return; }
      busy = true; render();
      window.HubAuth.signUp(nm, em, pw).catch(function (e) { msg = e.message || 'সমস্যা হয়েছে'; }).then(function () { busy = false; render(); });
    } else {
      busy = true; render();
      window.HubAuth.signIn(em, pw).catch(function (e) { msg = e.message || 'ভুল ইমেইল বা পাসওয়ার্ড'; }).then(function () { busy = false; render(); });
    }
    render();
  };

  /* Restore session on load */
  H.session().then(function (u) { if (u) { loadProfile().then(function () { fire(); notifyAll(); }); } });
})();
