/* =============================================================
   tuition-data.js — Tuition Marketplace Supabase data layer
   Reuses hubdb.js unified client/session (window.HUBDB).
   Never exposes private fields (address, phone, doc URLs).
   ============================================================= */
window.TuitionData = (function () {
  var H = window.HUBDB;
  if (!H) { console.error('tuition-data: hubdb.js load hoy ni'); return {}; }

  /* Private fields that must NEVER leak to public listings */
  var PRIVATE_FIELDS = ['address', 'contact_phone', 'phone', 'document_url', 'docs', 'mobile'];

  function sb() { return H.session ? null : null; } // placeholder, see client()
  function client() {
    // HUBDB keeps a single supabase client; access via a read to force init:
    return H.session().then(function () { return window.supabase ? null : null; });
  }

  /* Actually HUBDB doesn't export its client; but since both share
     the same window.supabase library + same URL/key constants are
     inside hubdb.js, we create our own client with the same project.
     IMPORTANT: keep in sync with hubdb.js URL/KEY. */
  var _sb = null;
  function db() {
    if (_sb) return Promise.resolve(_sb);
    if (typeof supabase === 'undefined') return Promise.reject(new Error('Supabase library load hoy ni'));
    _sb = supabase.createClient(
      window.SUPABASE_URL || 'https://dcwzxozhgysxhcptataq.supabase.co',
      window.SUPABASE_ANON_KEY || 'sb_publishable_i7C5FVxKNwaBPABgdFHOIQ_HKrxz5rM'
    );
    return Promise.resolve(_sb);
  }

  /* ---------- helpers ---------- */
  function stripPrivate(row) {
    var clean = {};
    for (var k in row) {
      if (PRIVATE_FIELDS.indexOf(k) === -1) clean[k] = row[k];
    }
    return clean;
  }
  function mapPost(x) {
    // public projection of a tuition_post — no address/contact
    return {
      id: x.id, title: x.title, category: x.category || '', classLevel: x.class_level || '',
      subjects: x.subjects || '', medium: x.medium || '', area: x.area || '',
      days: x.days || '', salary: x.salary || null, verifiedOnly: !!x.verified_only,
      description: x.description || '', status: x.status || 'pending',
      createdAt: x.created_at, createdBy: x.created_by
    };
  }
  function mapTutor(x) {
    // public projection of a tutor_profile — no phone/docs
    return {
      id: x.id, fullName: x.full_name || x.name || '', institution: x.institution || '',
      experience: x.experience || 0, subjects: x.subjects || '',
      verification: x.verification_status || 'pending', featured: !!x.featured,
      bio: x.bio || '', areas: x.areas || '', suspended: !!x.suspended,
      createdAt: x.created_at
    };
  }
  function err(r) { if (r.error) throw r.error; return r.data; }

  /* ---------- homepage ---------- */
  function renderHomepage() {
    return Promise.all([getStats(), getLatestPosts(6), getFeaturedTutors(4)])
      .then(function (res) {
        renderStats(res[0]);
        renderPostCards('tnLatestPosts', res[1]);
        renderTutorCards('tnFeaturedTutors', res[2]);
      })
      .catch(function (e) {
        console.error('tuition-data homepage:', e);
        document.getElementById('tnStats').innerHTML =
          '<div class="tn-stat" style="grid-column:1/-1"><div class="tn-stat__num">—</div><div class="tn-stat__label">স্ট্যাট লোড হয়নি</div></div>';
      });
  }

  function getStats() {
    // Count from tables directly (public select allowed via RLS).
    return db().then(function (d) {
      return Promise.all([
        d.from('tuition_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        d.from('tutor_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        d.from('tuition_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved').lt('salary', 999999),
        d.from('tuition_applications').select('id', { count: 'exact', head: true }).eq('status', 'accepted')
      ]).then(function (rs) {
        return {
          posts: rs[0].count || 0,
          verifiedTutors: rs[1].count || 0,
          activeTuition: rs[2].count || 0,
          matches: rs[3].count || 0
        };
      });
    });
  }

  function renderStats(s) {
    var el = document.getElementById('tnStats');
    if (!el) return;
    el.innerHTML =
      '<div class="tn-stat"><div class="tn-stat__num">' + s.posts + '</div><div class="tn-stat__label">সক্রিয় পোস্ট</div></div>' +
      '<div class="tn-stat"><div class="tn-stat__num">' + s.verifiedTutors + '</div><div class="tn-stat__label">ভেরিফায়েড টিউটর</div></div>' +
      '<div class="tn-stat"><div class="tn-stat__num">' + s.activeTuition + '</div><div class="tn-stat__label">চলমান টিউশন</div></div>' +
      '<div class="tn-stat"><div class="tn-stat__num">' + s.matches + '</div><div class="tn-stat__label">সফল ম্যাচিং</div></div>';
  }

  /* ---------- posts ---------- */
  function getLatestPosts(n) {
    return db().then(function (d) {
      return d.from('tuition_posts')
        .select('id,title,category,class_level,subjects,medium,area,days,salary,verified_only,description,status,created_at,created_by')
        .eq('status', 'approved').order('created_at', { ascending: false }).limit(n || 6)
        .then(err).then(function (rows) { return rows.map(mapPost); });
    });
  }

  function searchPosts(opts) {
    opts = opts || {};
    return db().then(function (d) {
      var q = d.from('tuition_posts')
        .select('id,title,category,class_level,subjects,medium,area,days,salary,verified_only,description,status,created_at,created_by')
        .eq('status', 'approved');
      if (opts.q) q = q.or('title.ilike.%' + opts.q + '%,subjects.ilike.%' + opts.q + '%,area.ilike.%' + opts.q + '%');
      if (opts.category) q = q.eq('category', opts.category);
      if (opts.classLevel) q = q.ilike('class_level', '%' + opts.classLevel + '%');
      if (opts.subject) q = q.ilike('subjects', '%' + opts.subject + '%');
      if (opts.minSalary) q = q.gte('salary', +opts.minSalary);
      if (opts.verifiedOnly) q = q.eq('verified_only', true);
      if (opts.sort === 'salary-high') q = q.order('salary', { ascending: false });
      else if (opts.sort === 'salary-low') q = q.order('salary', { ascending: true });
      else q = q.order('created_at', { ascending: false });
      if (opts.limit) q = q.limit(opts.limit);
      return q.then(err).then(function (rows) { return rows.map(mapPost); });
    });
  }

  /* ---------- tutors ---------- */
  function getFeaturedTutors(n) {
    return db().then(function (d) {
      return d.from('tutor_profiles')
        .select('id,full_name,institution,experience,subjects,verification_status,featured,bio,areas,suspended,created_at')
        .eq('verification_status', 'verified').eq('suspended', false).eq('featured', true)
        .order('created_at', { ascending: false }).limit(n || 4)
        .then(err)
        .catch(function () { return []; }) // featured may be empty
        .then(function (rows) {
          if (rows.length) return rows.map(mapTutor);
          // fallback: latest verified tutors
          return d.from('tutor_profiles')
            .select('id,full_name,institution,experience,subjects,verification_status,featured,bio,areas,suspended,created_at')
            .eq('verification_status', 'verified').eq('suspended', false)
            .order('created_at', { ascending: false }).limit(n || 4)
            .then(err).then(function (r2) { return r2.map(mapTutor); });
        });
    });
  }

  function searchTutors(term, limit) {
    return db().then(function (d) {
      var q = d.from('tutor_profiles')
        .select('id,full_name,institution,experience,subjects,verification_status,featured,bio,areas,suspended,created_at')
        .eq('verification_status', 'verified').eq('suspended', false)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      if (term) q = q.or('full_name.ilike.%' + term + '%,subjects.ilike.%' + term + '%,institution.ilike.%' + term + '%');
      return q.limit(limit || 24).then(err).then(function (rows) { return rows.map(mapTutor); });
    });
  }

  /* ---------- card rendering (shared by app + dash) ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function salaryText(sal) {
    return sal ? '৳' + sal + '/মাস' : 'আলোচনাসাপেক্ষ';
  }
  function renderPostCards(containerId, posts) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!posts.length) {
      el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__icon">📭</div>' +
        '<div class="tn-empty__title">এখনো কোনো পোস্ট নেই</div><p>প্রথম পোস্টটি আপনিই দিন!</p></div>';
      return;
    }
    el.innerHTML = posts.map(function (p) {
      return '<article class="tn-card">' +
        '<div class="tn-card__top">' +
          '<h3 class="tn-card__title">' + esc(p.title) + '</h3>' +
          (p.verifiedOnly ? '<span class="tn-badge tn-badge--verified">✓ ভেরিফায়েড টিউটর</span>' : '') +
        '</div>' +
        '<div class="tn-card__meta">' +
          (p.category ? '<span>🏷 ' + esc(p.category) + '</span>' : '') +
          (p.classLevel ? '<span>🎓 ' + esc(p.classLevel) + '</span>' : '') +
          (p.subjects ? '<span>📚 ' + esc(p.subjects) + '</span>' : '') +
          (p.area ? '<span>📍 ' + esc(p.area) + '</span>' : '') +
        '</div>' +
        '<p class="tn-card__body">' + esc(p.description).slice(0, 140) + '</p>' +
        '<div class="tn-card__foot">' +
          '<span class="tn-card__salary">' + salaryText(p.salary) + '</span>' +
          '<div class="tn-card__actions">' +
            '<button class="tn-btn tn-btn--primary tn-btn--sm" data-tn-apply="' + p.id + '">আবেদন করুন</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }
  function renderTutorCards(containerId, tutors) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!tutors.length) {
      el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__icon">👩‍🏫</div>' +
        '<div class="tn-empty__title">এখনো কোনো ভেরিফায়েড টিউটর নেই</div><p>টিউটররা ভেরিফিকেশনের অপেক্ষায় আছেন।</p></div>';
      return;
    }
    el.innerHTML = tutors.map(function (t) {
      return '<article class="tn-card">' +
        '<div class="tn-tutor__head">' +
          '<div class="tn-tutor__avatar">🎓</div>' +
          '<div><h3 class="tn-tutor__name">' + esc(t.fullName) +
            '<span class="tn-verified-tick" title="ভেরিফায়েড">✓</span></h3>' +
            '<div class="tn-text-faint" style="font-size:0.83rem">' + esc(t.institution) + '</div>' +
          '</div>' +
          (t.featured ? '<span class="tn-badge tn-badge--featured">⭐ ফিচার্ড</span>' : '') +
        '</div>' +
        '<div class="tn-card__meta">' +
          (t.subjects ? '<span>📚 ' + esc(t.subjects) + '</span>' : '') +
          (t.experience ? '<span>⏳ ' + esc(t.experience) + ' বছরের অভিজ্ঞতা</span>' : '') +
          (t.areas ? '<span>📍 ' + esc(t.areas) + '</span>' : '') +
        '</div>' +
        (t.bio ? '<p class="tn-card__body">' + esc(t.bio).slice(0, 120) + '</p>' : '') +
      '</article>';
    }).join('');
  }

  /* ---------- notifications ---------- */
  function getNotifications(limit) {
    return H.session().then(function (me) {
      if (!me) return [];
      return db().then(function (d) {
        return d.from('tuition_notifications').select('*')
          .eq('user_id', me.id).eq('is_read', false)
          .order('created_at', { ascending: false }).limit(limit || 20)
          .then(err);
      });
    });
  }
  function unreadCount() {
    return getNotifications(50).then(function (n) { return n.length; });
  }
  function markAllRead() {
    return H.session().then(function (me) {
      if (!me) return;
      return db().then(function (d) {
        return d.from('tuition_notifications').update({ is_read: true })
          .eq('user_id', me.id).eq('is_read', false).then(err);
      });
    });
  }

  /* ---------- header actions (bell + profile menu) ---------- */
  function renderHeaderActions() {
    var wrap = document.getElementById('tnHeaderActions');
    if (!wrap) return Promise.resolve();
    return H.session().then(function (me) {
      if (!me) {
        wrap.innerHTML =
          '<a class="tn-btn tn-btn--outline tn-btn--sm" href="index.html">লগইন</a>' +
          '<a class="tn-btn tn-btn--primary tn-btn--sm" href="index.html"><span>রেজিস্টার</span></a>';
        return;
      }
      var initial = (me.email || 'U').charAt(0).toUpperCase();
      wrap.innerHTML =
        '<div class="tn-bell" id="tnBell"><button class="tn-bell__btn" id="tnBellBtn" aria-label="নোটিফিকেশন">🔔</button></div>' +
        '<div class="tn-profile-menu">' +
          '<button class="tn-avatar" id="tnAvatarBtn" aria-label="প্রোফাইল">' + initial + '</button>' +
          '<div class="tn-profile-dropdown" id="tnProfileDropdown">' +
            '<div style="padding:8px 12px;font-size:0.82rem;color:var(--tn-text-soft)" class="tn-sr-only">' + esc(me.email) + '</div>' +
            '<a href="#dashboard">📊 ড্যাশবোর্ড</a>' +
            '<a href="#post">➕ টিউশন পোস্ট</a>' +
            '<a href="#become-tutor">🎓 টিউটর হন</a>' +
            '<div class="tn-divider"></div>' +
            '<button id="tnSignOut">🚪 লগআউট</button>' +
          '</div>' +
        '</div>';
      // bell behaviour
      var panel = document.createElement('div');
      panel.className = 'tn-notif-panel';
      panel.id = 'tnNotifPanel';
      document.getElementById('tnBell').appendChild(panel);
      document.getElementById('tnBellBtn').addEventListener('click', function () {
        panel.classList.toggle('is-open');
        if (panel.classList.contains('is-open')) loadNotifPanel(panel);
      });
      document.getElementById('tnAvatarBtn').addEventListener('click', function () {
        document.getElementById('tnProfileDropdown').classList.toggle('is-open');
      });
      document.getElementById('tnSignOut')?.addEventListener('click', function () {
        H.signOut().then(function () { location.href = 'index.html'; });
      });
      refreshBellDot();
    });
  }
  function refreshBellDot() {
    return unreadCount().then(function (n) {
      var bell = document.getElementById('tnBell');
      if (!bell) return;
      var old = bell.querySelector('.tn-bell__dot');
      if (old) old.remove();
      if (n > 0) {
        var dot = document.createElement('div');
        dot.className = 'tn-bell__dot';
        dot.textContent = n > 9 ? '9+' : n;
        bell.appendChild(dot);
      }
    });
  }
  function loadNotifPanel(panel) {
    panel.innerHTML = '<div style="padding:14px;text-align:center;color:var(--tn-text-faint)">লোড হচ্ছে…</div>';
    return getNotifications(20).then(function (list) {
      if (!list.length) {
        panel.innerHTML = '<div style="padding:24px;text-align:center;color:var(--tn-text-soft)">কোনো নতুন নোটিফিকেশন নেই</div>';
        return;
      }
      panel.innerHTML = list.map(function (n) {
        return '<div class="tn-notif is-unread">' +
          '<div style="flex:1">' +
            '<div class="tn-notif__title">' + esc(n.title) + '</div>' +
            '<div class="tn-notif__body">' + esc(n.body || '') + '</div>' +
            '<div class="tn-notif__time">' + new Date(n.created_at).toLocaleString('bn-BD') + '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
      '<div style="padding:8px"><button class="tn-btn tn-btn--ghost tn-btn--sm tn-btn--block" id="tnMarkAllRead">সব পড়া হয়েছে</button></div>';
      document.getElementById('tnMarkAllRead')?.addEventListener('click', function () {
        markAllRead().then(function () { panel.classList.remove('is-open'); refreshBellDot(); });
      });
    });
  }

  /* ---------- applications ---------- */
  function applyToPost(postId, message, proposedRate) {
    return H.session().then(function (me) {
      if (!me) throw new Error('আবেদন করতে লগইন করুন');
      return db().then(function (d) {
        // find own tutor profile
        return d.from('tutor_profiles').select('id,verification_status,suspended')
          .eq('user_id', me.id).maybeSingle().then(err).then(function (tp) {
            if (!tp) throw new Error('আগে টিউটর হিসেবে রেজিস্টার করুন');
            if (tp.suspended) throw new Error('আপনার টিউটর প্রোফাইল স্থগিত আছে');
            if (tp.verification_status !== 'verified')
              throw new Error('শুধু ভেরিফায়েড টিউটররা আবেদন করতে পারেন');
            // duplicate-prevention handled by unique index + pre-check
            return d.from('tuition_applications').select('id')
              .eq('tuition_post_id', postId).eq('tutor_profile_id', tp.id).maybeSingle().then(err)
              .then(function (existing) {
                if (existing) throw new Error('আপনি ইতিমধ্যে এই পোস্টে আবেদন করেছেন');
                return d.from('tuition_applications').insert({
                  tuition_post_id: postId,
                  tutor_profile_id: tp.id,
                  message: message || null,
                  proposed_rate: proposedRate ? +proposedRate : null,
                  status: 'pending'
                }).then(err);
              });
          });
      });
    });
  }

  /* ---------- tutor registration ---------- */
  function registerTutor(data) {
    return H.session().then(function (me) {
      if (!me) throw new Error('রেজিস্টার করতে লগইন করুন');
      return db().then(function (d) {
        return d.from('tutor_profiles').select('id')
          .eq('user_id', me.id).maybeSingle().then(err).then(function (existing) {
            var row = {
              user_id: me.id, full_name: data.fullName, phone: data.phone || null,
              institution: data.institution || null, experience: data.experience ? +data.experience : 0,
              subjects: data.subjects || null, areas: data.areas || null, bio: data.bio || null,
              verification_status: 'pending'
            };
            if (existing) {
              return d.from('tutor_profiles').update(row).eq('id', existing.id).then(err);
            }
            return d.from('tutor_profiles').insert(row).then(err);
          });
      });
    });
  }
  function uploadDoc(file) {
    return H.session().then(function (me) {
      if (!me) throw new Error('ডকুমেন্ট আপলোড করতে লগইন করুন');
      return db().then(function (d) {
        var path = me.id + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]/g, '_');
        return d.storage.from('tuition-docs').upload(path, file, {
          upsert: false, contentType: file.type
        }).then(function (r) {
          if (r.error) throw r.error;
          // save path on tutor profile (kept private)
          return d.from('tutor_profiles').update({ document_path: r.data.path })
            .eq('user_id', me.id).then(err);
        });
      });
    });
  }

  /* ---------- post tuition ---------- */
  function createPost(data) {
    return H.session().then(function (me) {
      if (!me) throw new Error('পোস্ট করতে লগইন করুন');
      return db().then(function (d) {
        var row = {
          created_by: me.id, title: data.title, category: data.category,
          class_level: data.classLevel || null, subjects: data.subjects,
          medium: data.medium || null, area: data.area || null,
          days: data.days || null, salary: data.salary ? +data.salary : null,
          verified_only: !!data.verifiedOnly, description: data.description || null,
          address: data.address || null, contact_phone: data.contact || null,
          status: 'pending' // moderation-aware: approved হলে পাবলিক হবে
        };
        return d.from('tuition_posts').insert(row).then(err);
      });
    });
  }

  /* ---------- reports ---------- */
  function reportTarget(targetType, targetId, reason, details) {
    return H.session().then(function (me) {
      if (!me) throw new Error('রিপোর্ট করতে লগইন করুন');
      return db().then(function (d) {
        return d.from('tuition_reports').insert({
          reporter_id: me.id, target_type: targetType, target_id: targetId,
          reason: reason, details: details || null, status: 'open'
        }).then(err);
      });
    });
  }

  /* ---------- saved posts ---------- */
  function toggleSavePost(postId) {
    return H.session().then(function (me) {
      if (!me) throw new Error('সেভ করতে লগইন করুন');
      return db().then(function (d) {
        return d.from('saved_tuition_posts').select('id')
          .eq('user_id', me.id).eq('tuition_post_id', postId).maybeSingle().then(err)
          .then(function (row) {
            if (row) return d.from('saved_tuition_posts').delete().eq('id', row.id).then(err);
            return d.from('saved_tuition_posts').insert({ user_id: me.id, tuition_post_id: postId }).then(err);
          });
      });
    });
  }

  /* ---------- init ---------- */
  function init() {
    return renderHeaderActions().then(renderHomepage);
  }

  return {
    init: init,
    renderHomepage: renderHomepage,
    getStats: getStats,
    getLatestPosts: getLatestPosts,
    getFeaturedTutors: getFeaturedTutors,
    searchPosts: searchPosts,
    searchTutors: searchTutors,
    renderPostCards: renderPostCards,
    renderTutorCards: renderTutorCards,
    getNotifications: getNotifications,
    unreadCount: unreadCount,
    markAllRead: markAllRead,
    refreshBellDot: refreshBellDot,
    applyToPost: applyToPost,
    registerTutor: registerTutor,
    uploadDoc: uploadDoc,
    createPost: createPost,
    reportTarget: reportTarget,
    toggleSavePost: toggleSavePost,
    stripPrivate: stripPrivate,
    _db: db
  };
})();
