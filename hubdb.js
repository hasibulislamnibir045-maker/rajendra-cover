/* ============================================================
   HUBDB :: Main site-er Supabase layer (Apps Script-er jabonio)
   - Ekmatro project: Student Hut-er Supabase (same URL/key)
   - Eta NOTUN file — kono purono file e haat deya hoyni,
     tai index.html e jog na korleo site 100% thik thakbe.
   - Data shape purono system-er moto kore map kora (t, x, c, d, u, by...)
     jate student/admin render code e abar use kora jay.
   ============================================================ */
window.HUBDB = (function () {
  var URL = window.SUPABASE_URL || 'https://dcwzxozhgysxhcptataq.supabase.co';
  var KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_i7C5FVxKNwaBPABgdFHOIQ_HKrxz5rM';
  var sb = null, me = null, myProfile = null;

  function client() {
    if (sb) return sb;
    if (typeof supabase === 'undefined') throw new Error('Supabase library load hoy ni (CDN script age din)');
    sb = supabase.createClient(URL, KEY);
    sb.auth.onAuthStateChange(function (_e, s) {
      me = (s && s.user) || null; myProfile = null;
    });
    return sb;
  }
  function today() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  async function uid() { var u = await client().auth.getUser(); return (u.data && u.data.user && u.data.user.id) || null; }

  /* ---------------- নোটিশ ---------------- */
  async function getNotices() {
    var r = await client().from('notices')
      .select('id,title,body,category,dept,link,notice_date')
      .order('notice_date', { ascending: false }).limit(200);
    if (r.error) throw r.error;
    return r.data.map(function (n) {
      return { id: n.id, t: n.title, x: n.body || '', c: n.category, dept: n.dept || '',
        u: n.link || '', d: String(n.notice_date || '') };
    });
  }
  async function addNotice(v) {
    var row = { title: v.t, body: v.x || null, category: v.c || 'সাধারণ', dept: v.dept || null,
      link: v.u || null, notice_date: v.d || today() };
    var r = await client().from('notices').insert(row);
    if (r.error) throw r.error;
  }
  async function delNotice(id) {
    var r = await client().from('notices').delete().eq('id', id);
    if (r.error) throw r.error;
  }

  /* ---------------- রিসোর্স ---------------- */
  async function getResources(dept, yr) {
    var q = client().from('resources').select('*').order('created_at', { ascending: false }).limit(300);
    if (dept) q = q.eq('dept', dept);
    if (yr) q = q.eq('yr', yr);
    var r = await q;
    if (r.error) throw r.error;
    return r.data.map(function (x) {
      return { id: x.id, t: x.title, dept: x.dept || '', yr: x.yr || '', type: x.type, u: x.url };
    });
  }
  async function addResource(v) {
    var row = { title: v.t, dept: v.dept || null, yr: v.yr || null, type: v.type || 'নোট',
      url: v.u };
    var r = await client().from('resources').insert(row);
    if (r.error) throw r.error;
  }
  async function delResource(id) {
    var r = await client().from('resources').delete().eq('id', id);
    if (r.error) throw r.error;
  }

  /* ---------------- রুটিন ---------------- */
  async function getRoutines(dept, prog, yr) {
    var q = client().from('routines').select('*').order('created_at', { ascending: true }).limit(500);
    var r = await q;
    if (r.error) throw r.error;
    var out = r.data.map(function (x) {
      return { id: x.id, dept: x.dept, prog: x.prog || '', yr: x.yr || '', sub: x.sub, k: x.kind,
        d: x.date || '', rep: (x.rep == null ? '' : x.rep), st: x.st || '', en: x.en || '',
        tch: x.tch || '', room: x.room || '' };
    }).filter(function (x) {
      if (dept && x.dept !== 'all' && x.dept !== dept) return false;
      if (prog && x.prog && x.prog !== prog) return false;
      if (yr && x.yr && x.yr !== yr) return false;
      return true;
    });
    return out;
  }
  async function addRoutine(v) {
    var row = { dept: v.dept || 'all', prog: v.prog || null, yr: v.yr || null, sub: v.sub,
      kind: v.k || 'class', date: v.d || null, rep: (v.rep === '' || v.rep == null ? null : +v.rep),
      st: v.st || null, en: v.en || null, tch: v.tch || null, room: v.room || null };
    var r = await client().from('routines').insert(row);
    if (r.error) throw r.error;
  }
  async function delRoutine(id) {
    var r = await client().from('routines').delete().eq('id', id);
    if (r.error) throw r.error;
  }

  /* ---------------- auth / admin ---------------- */
  function user() { return me; }
  async function profile() {
    if (myProfile) return myProfile;
    if (!me) return null;
    var r = await client().from('profiles').select('*').eq('id', me.id).maybeSingle();
    myProfile = r.data || null;
    return myProfile;
  }
  async function isAdmin() { var p = await profile(); return !!(p && p.is_admin); }
  async function signIn(email, pass) {
    var r = await client().auth.signInWithPassword({ email: email, password: pass });
    if (r.error) throw r.error;
    me = r.data.user; return me;
  }
  async function signOut() { await client().auth.signOut(); me = null; myProfile = null; }

  return {
    getNotices: getNotices, addNotice: addNotice, delNotice: delNotice,
    getResources: getResources, addResource: addResource, delResource: delResource,
    getRoutines: getRoutines, addRoutine: addRoutine, delRoutine: delRoutine,
    user: user, profile: profile, isAdmin: isAdmin, signIn: signIn, signOut: signOut,
    today: today
  };
})();
