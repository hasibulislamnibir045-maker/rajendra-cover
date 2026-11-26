/* ============================================================
   HUBDB :: Main site Supabase layer (Apps Script replacement)
   - Single project: Student Hut Supabase (same URL/key)
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

  /* ---------- Notices ---------- */
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
      var row = { title: v.t, body: v.x || null, category: v.c || '\u09B8\u09BE\u09A7\u09BE\u09B0\u09A3', dept: v.dept || null,
        link: v.u || null, notice_date: v.d || today(), created_by: id };
      return client().from('notices').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function delNotice(id) {
    return client().from('notices').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------- Resources ---------- */
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
      var row = { title: v.t, dept: v.dept || null, yr: v.yr || null, type: v.type || '\u09A8\u09CB\u099F', url: v.u, created_by: id };
      return client().from('resources').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function delResource(id) {
    return client().from('resources').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------- Routines ---------- */
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

  /* ---------- Tuition: Tutors ---------- */
  function getTutors() {
    return client().from('tutors').select('*').eq('status', 'active')
      .order('created_at', { ascending: false }).limit(300).then(function (r) {
        if (r.error) throw r.error;
        return r.data.map(function (x) {
          return { id: x.id, uid: x.user_id, n: x.full_name, m: x.mobile || '', g: x.gender || '',
            ins: x.institution || '', yr: x.year || '', sub: x.subject || '', cls: x.class_level || '',
            med: x.medium || '', area: x.area || '', mode: x.mode || '', sal: x.salary || '',
            exp: x.experience || '', ts: x.created_at };
        });
      });
  }
  function addTutor(v) {
    return uid().then(function (id) {
      var row = { user_id: id, full_name: v.n, mobile: v.m || null, gender: v.g || null,
        institution: v.ins || null, year: v.yr || null, subject: v.sub || null, class_level: v.cls || null,
        medium: v.med || null, area: v.area || null, mode: v.mode || null, salary: v.sal || null,
        experience: v.exp || null };
      return client().from('tutors').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function myTutors() {
    return uid().then(function (id) {
      return client().from('tutors').select('*').eq('user_id', id)
        .order('created_at', { ascending: false }).then(function (r) {
          if (r.error) throw r.error;
          return r.data.map(function (x) {
            return { id: x.id, n: x.full_name, m: x.mobile || '', g: x.gender || '', ins: x.institution || '',
              yr: x.year || '', sub: x.subject || '', cls: x.class_level || '', med: x.medium || '',
              area: x.area || '', mode: x.mode || '', sal: x.salary || '', exp: x.experience || '' };
          });
        });
    });
  }
  function delTutor(id) {
    return client().from('tutors').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------- Tuition: Posts ---------- */
  function getPosts() {
    return client().from('posts').select('*').eq('status', 'active')
      .order('created_at', { ascending: false }).limit(300).then(function (r) {
        if (r.error) throw r.error;
        return r.data.map(function (x) {
          return { id: x.id, uid: x.user_id, n: x.full_name, m: x.mobile || '', cls: x.class_level || '',
            sg: x.student_gender || '', sub: x.subject || '', med: x.medium || '', area: x.area || '',
            days: x.days || '', sal: x.salary || '', tg: x.target || '', note: x.note || '', ts: x.created_at };
        });
      });
  }
  function addPost(v) {
    return uid().then(function (id) {
      var row = { user_id: id, full_name: v.n, mobile: v.m || null, class_level: v.cls || null,
        student_gender: v.sg || null, subject: v.sub || null, medium: v.med || null, area: v.area || null,
        days: v.days || null, salary: v.sal || null, target: v.tg || null, note: v.note || null };
      return client().from('posts').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function myPosts() {
    return uid().then(function (id) {
      return client().from('posts').select('*').eq('user_id', id)
        .order('created_at', { ascending: false }).then(function (r) {
          if (r.error) throw r.error;
          return r.data.map(function (x) {
            return { id: x.id, n: x.full_name, m: x.mobile || '', cls: x.class_level || '', sg: x.student_gender || '',
              sub: x.subject || '', med: x.medium || '', area: x.area || '', days: x.days || '',
              sal: x.salary || '', tg: x.target || '', note: x.note || '' };
          });
        });
    });
  }
  function delPost(id) {
    return client().from('posts').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------- Mess / Hostel ---------- */
  function getMess() {
    return client().from('mess').select('*').eq('status', 'active')
      .order('created_at', { ascending: false }).limit(300).then(function (r) {
        if (r.error) throw r.error;
        return r.data.map(function (x) {
          return { id: x.id, uid: x.user_id, t: x.title, cond: x.cond || '', g: x.g || '',
            seats: x.seats, price: x.price || '', area: x.area || '', m: x.mobile || '',
            loc: x.loc || '', note: x.note || '', ts: x.created_at };
        });
      });
  }
  function addMess(v) {
    return uid().then(function (id) {
      var row = { user_id: id, title: v.t, cond: v.cond || null, g: v.g || null,
        seats: (v.seats ? +v.seats : null), price: v.price || null, area: v.area || null,
        mobile: v.m || null, loc: v.loc || null, note: v.note || null };
      return client().from('mess').insert(row).then(function (r) { if (r.error) throw r.error; });
    });
  }
  function myMess() {
    return uid().then(function (id) {
      return client().from('mess').select('*').eq('user_id', id)
        .order('created_at', { ascending: false }).then(function (r) {
          if (r.error) throw r.error;
          return r.data.map(function (x) {
            return { id: x.id, t: x.title, cond: x.cond || '', g: x.g || '', seats: x.seats,
              price: x.price || '', area: x.area || '', m: x.mobile || '', loc: x.loc || '', note: x.note || '' };
          });
        });
    });
  }
  function delMess(id) {
    return client().from('mess').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
  }

  /* ---------- Auth ---------- */
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
      if (r.error) throw r.error; me = r.data.user; myProfile = null; return me;
    });
  }
  function signUp(name, email, pass) {
    return client().auth.signUp({ email: email, password: pass, options: { data: { full_name: name } } }).then(function (r) {
      if (r.error) throw r.error;
      me = (r.data && r.data.user) || null; myProfile = null; return me;
    });
  }
  function session() {
    return client().auth.getSession().then(function (r) {
      me = (r.data && r.data.session && r.data.session.user) || null;
      return me;
    });
  }
  function signOut() { return client().auth.signOut().then(function () { me = null; myProfile = null; }); }

  return {
    getNotices: getNotices, addNotice: addNotice, delNotice: delNotice,
    getResources: getResources, addResource: addResource, delResource: delResource,
    getRoutines: getRoutines, addRoutine: addRoutine, delRoutine: delRoutine,
    getTutors: getTutors, addTutor: addTutor, myTutors: myTutors, delTutor: delTutor,
    getPosts: getPosts, addPost: addPost, myPosts: myPosts, delPost: delPost,
    getMess: getMess, addMess: addMess, myMess: myMess, delMess: delMess,
    user: user, profile: profile, isAdmin: isAdmin,
    signIn: signIn, signUp: signUp, session: session, signOut: signOut, today: today
  };
})();
