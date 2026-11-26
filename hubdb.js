/* ============================================================
   HUBDB :: Main site-er Supabase layer (Apps Script-er jabonio)
   - Ekmatro project: Student Hut-er Supabase (same URL/key)
   - Data shape purono system-er moto kore map kora (t, x, c, d, u...)
   ============================================================ */
window.HUBDB = (function () {
  var URL = window.SUPABASE_URL || 'https://dcwzxozhgysxhcptataq.supabase.co';
  var KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_i7C5FVxKNwaBPABgdFHOIQ_HKrxz5rM';
  var sb = null, me = null, myProfile = null;

  function client() {
    if (sb) return sb;
    if (typeof supabase === 'undefined') throw new Error('Supabase library load hoy ni');
    sb = supabase.createClient(URL, KEY);
    sb.auth.onAuthStateChange(function (_e, s) { me = (s && s.user) || null; myProfile = null; });
    return sb;
  }
  function today() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function uid() { return client().auth.getUser().then(function (r) { return (r.data && r.data.user && r.data.user.id) || null; }); }

  /* ---------------- à¦¨à§‹à¦Ÿà¦¿à¦¶ ---------------- */
  function getNotices() {
    return client().from('notices').select('id,title,body,category,dept,link,notice_date')
      .order('notice_date', { ascending: false }).limit(200).then(function (r) {
        if (r.error) throw r.error;
        return r.data.map(function (n) {
          return { id: n.id, t: n.title, x: n.body || '', c: n.category, dept: n.dept || '',
            u: n.link || '', d: String(n.notice_date || '') };
        });
      });
  }
  function addNotice(v) {
    return uid().then(function (id) {
      var row = { title: v.t, body: v.x || null, category: v.c || 'à¦¸à¦¾à¦§à¦¾à¦°à¦£', dept: v.dept || null,
        link: v.u || null, notice_date: v.d || today(), created_by: id };
      return client().from('notices').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function delNotice(id) {
    return client().from('notices').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------------- à¦°à¦¿à¦¸à§‹à¦°à§à¦¸ ---------------- */
  function getResources(dept, yr) {
    var q = client().from('resources').select('*').order('created_at', { ascending: false }).limit(300);
    if (dept) q = q.eq('dept', dept);
    if (yr) q = q.eq('yr', yr);
    return q.then(function (r) {
      if (r.error) throw r.error;
      return r.data.map(function (x) {
        return { id: x.id, t: x.title, dept: x.dept || '', yr: x.yr || '', type: x.type, u: x.url };
      });
    });
  }
  function addResource(v) {
    return uid().then(function (id) {
      var row = { title: v.t, dept: v.dept || null, yr: v.yr || null, type: v.type || 'à¦¨à§‹à¦Ÿ', url: v.u, created_by: id };
      return client().from('resources').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function delResource(id) {
    return client().from('resources').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------------- à¦°à§à¦Ÿà¦¿à¦¨ ---------------- */
  function getRoutines(dept, prog, yr) {
    return client().from('routines').select('*').order('created_at', { ascending: true }).limit(500).then(function (r) {
      if (r.error) throw r.error;
      return r.data.map(function (x) {
        return { id: x.id, dept: x.dept, prog: x.prog || '', yr: x.yr || '', sub: x.sub, k: x.kind,
          d: x.date || '', rep: (x.rep == null ? '' : x.rep), st: x.st || '', en: x.en || '',
          tch: x.tch || '', room: x.room || '' };
      }).filter(function (x) {
        if (dept && x.dept !== 'all' && x.dept !== dept) return false;
        if (prog && x.prog && x.prog !== prog) return false;
        if (yr && x.yr && x.yr !== yr) return false;
        return true;
      });
    });
  }
  function addRoutine(v) {
    return uid().then(function (id) {
      var row = { dept: v.dept || 'all', prog: v.prog || null, yr: v.yr || null, sub: v.sub,
        kind: v.k || 'class', date: v.d || null, rep: (v.rep === '' || v.rep == null ? null : +v.rep),
        st: v.st || null, en: v.en || null, tch: v.tch || null, room: v.room || null, created_by: id };
      return client().from('routines').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function delRoutine(id) {
    return client().from('routines').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------------- auth / admin ---------------- */
  function user() { return me; }
  function profile() {
    if (myProfile) return Promise.resolve(myProfile);
    if (!me) return Promise.resolve(null);
    return client().from('profiles').select('*').eq('id', me.id).maybeSingle().then(function (r) {
      myProfile = r.data || null; return myProfile;
    });
  }
  function isAdmin() { return profile().then(function (p) { return !!(p && p.is_admin); }); }
  function signIn(email, pass) {
    return client().auth.signInWithPassword({ email: email, password: pass }).then(function (r) {
      if (r.error) throw r.error; me = r.data.user; return me;
    });
  }
  function signOut() { return client().auth.signOut().then(function () { me = null; myProfile = null; }); }

  return {
    getNotices: getNotices, addNotice: addNotice, delNotice: delNotice,
    getResources: getResources, addResource: addResource, delResource: delResource,
    getRoutines: getRoutines, addRoutine: addRoutine, delRoutine: delRoutine,
    user: user, profile: profile, isAdmin: isAdmin, signIn: signIn, signOut: signOut, today: today
  };
})();
