/* ============================================================
   HUBDB :: Main site Supabase layer (Apps Script replacement)
   - Single project: Student Hut Supabase (same URL/key)
   - Data shape mapped to old system keys (t, x, c, d, u...)
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
      user() { return me; } = null; /* placeholder */
    });
  }
