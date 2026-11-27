/* =============================================================
   tuition-data.js — Tuition Hub Supabase data layer
   Reuses unified auth from hubdb.js. Never exposes
   address / phone / verification docs publicly.
   ============================================================= */
(function () {
  var H = window.HUBDB;
  if (!H) { console.error('tuition-data: hubdb.js load hoy ni'); return; }

  function db() {
    if (H._client) return H._client();
    if (H._db) return H._db();
    throw new Error('hubdb client not found');
  }
  function err(r) { if (r.error) throw r.error; return r.data; }

  /* ---------- mappers ---------- */
  function mapPost(x) {
    return {
      id: x.id,
      title: x.title || '',
      category: x.category || '',
      classLevel: x.class_level || '',
      subjects: x.subjects || '',
      medium: x.medium || '',
      area: x.area || '',
      days: x.days || '',
      salary: x.salary,
      verifiedOnly: !!x.verified_only,
      description: x.description || '',
      status: x.status || 'pending',
      createdAt: x.created_at,
      createdBy: x.created_by
    };
  }
  function mapTutor(x) {
    return {
      id: x.id,
      fullName: x.full_name || '',
      institution: x.institution || '',
      experience: x.experience || 0,
      subjects: x.subjects || '',
      areas: x.areas || '',
      bio: x.bio || '',
      featured: !!x.featured,
      suspended: !!x.suspended,
      verificationStatus: x.verification_status || 'pending'
    };
  }

  /* ---------- homepage ---------- */
  function init() {
    renderHeaderActions();
    loadHome();
    document.addEventListener('tn:viewchange', function (e) { if (e.detail.view === 'home') loadHome(); });
  }
  function loadHome() {
    getStats().then(renderStats).catch(function () { renderStats({ posts: 0, verifiedTutors: 0, activeTuition: 0, matches: 0 }); });
    Promise.all([getLatestPosts(6), getFeaturedTutors(4)])
      .then(function (res) {
        renderPostCards('tnLatestPosts', res[0]);
        renderTutorCards('tnFeaturedTutors', res[1]);
      })
      .catch(function (e) {
        console.error('tuition-data homepage:', e);
        var el = document.getElementById('tnLatestPosts');
        if (el) el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__icon">⚠️</div><div class="tn-empty__title">লোড করা যায়নি</div><p>' + esc(e.message || '') + '</p></div>';
      });
  }

  function getStats() {
    return db().then(function (d) {
      return Promise.all([
        d.from('tuition_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        d.from('tutor_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        d.from('tuition_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
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
        .catch(function () { return []; })
        .then(function (rows) {
          if (rows.length) return rows.map(mapTutor);
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

  function subjectChips(subjects) {
    if (!subjects) return '';
    return subjects.split(/[,،]/).map(function (s) { return s.trim(); })
      .filter(Boolean).slice(0, 4)
      .map(function (s) { return '<span class="tn-chip tn-chip--subject">' + esc(s) + '</span>'; })
      .join('');
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
      return '<article class="tn-card tn-card--post">' +
        '<div class="tn-card__strip">' +
          '<span class="tn-chip tn-chip--category">' + (p.category ? esc(p.category) : 'টিউশন') + '</span>' +
          (p.verifiedOnly ? '<span class="tn-badge tn-badge--verified">✓ শুধু ভেরিফায়েড</span>' : '') +
        '</div>' +
        '<h3 class="tn-card__title">' + esc(p.title) + '</h3>' +
        '<div class="tn-card__rows">' +
          (p.classLevel ? '<div class="tn-card__row"><span>🎓</span>ক্লাস: <strong>' + esc(p.classLevel) + '</strong></div>' : '') +
          (p.medium ? '<div class="tn-card__row"><span>📖</span>মাধ্যম: <strong>' + esc(p.medium) + '</strong></div>' : '') +
          (p.area ? '<div class="tn-card__row"><span>📍</span>এলাকা: <strong>' + esc(p.area) + '</strong></div>' : '') +
          (p.days ? '<div class="tn-card__row"><span>📅</span>সপ্তাহে <strong>' + esc(p.days) + '</strong></div>' : '') +
        '</div>' +
        '<div class="tn-card__chips">' + subjectChips(p.subjects) + '</div>' +
        (p.description ? '<p class="tn-card__body">' + esc(p.description).slice(0, 120) + '</p>' : '') +
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
      return '<article class="tn-card tn-card--tutor">' +
        '<div class="tn-tutor__head">' +
          '<div class="tn-tutor__avatar">🎓</div>' +
          '<div><h3 class="tn-tutor__name">' + esc(t.fullName) +
            '<span class="tn-verified-tick" title="ভেরিফায়েড">✓</span></h3>' +
            '<div class="tn-text-faint" style="font-size:0.83rem">' + esc(t.institution) + '</div>' +
          '</div>' +
          (t.featured ? '<span class="tn-badge tn-badge--featured">⭐ ফিচার্ড</span>' : '') +
        '</div>' +
        '<div class="tn-card__chips">' + subjectChips(t.subjects) + '</div>' +
        '<div class="tn-card__meta">' +
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
  function unreadCount() { return getNotifications(50).then(function (n) { return n.length; }); }
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
          '<a class="tn-btn tn-btn--primary tn-btn--sm" href="index.html">রেজিস্টার</a>';
        return;
      }
      var initial = (me.email || 'U').charAt(0).toUpperCase();
      wrap.innerHTML =
        '<div class="tn-bell" id="tnBell"><button class="tn-bell__btn" id="tnBellBtn" aria-label="নোটিফিকেশন">🔔</button></div>' +
        '<div class="tn-profile-menu">' +
          '<button class="tn-avatar" id="tnAvatarBtn" aria-label="প্রোফাইল">' + initial + '</button>' +
          '<div class="tn-profile-dropdown" id="tnProfileDropdown">' +
            '<a href="#dashboard">📊 ড্যাশবোর্ড</a>' +
            '<a href="#post">➕ টিউশন পোস্ট</a>' +
            '<a href="#become-tutor">🎓 টিউটর হন</a>' +
            '<div class="tn-divider"></div>' +
            '<button id="tnSignOut">🚪 লগআউট</button>' +
          '</div>' +
        '</div>';
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
      document.getElementById('tnSignOut').addEventListener('click', function () {
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
    panel.innerHTML = '<div style="padding:14px"><div class="tn-skel__bar"></div></div>';
    getNotifications(20).then(function (ns) {
      if (!ns.length) {
        panel.innerHTML = '<div class="tn-empty" style="padding:22px 12px"><div class="tn-empty__icon">🔕</div><div class="tn-empty__title">নোটিফিকেশন নেই</div></div>';
        return;
      }
      panel.innerHTML = ns.map(function (n) {
        return '<div class="tn-notif is-unread">' +
          '<div><div class="tn-notif__title">' + esc(n.title) + '</div>' +
          '<div class="tn-notif__body">' + esc(n.body).slice(0, 80) + '</div>' +
          '<div class="tn-notif__time">' + new Date(n.created_at).toLocaleString('bn-BD') + '</div></div>' +
        '</div>';
      }).join('');
      markAllRead().then(refreshBellDot);
    });
  }

  /* ---------- flows ---------- */
  function applyToPost(postId) {
    return H.session().then(function (me) {
      if (!me) throw new Error('আবেদন করতে আগে লগইন করুন');
      return db().then(function (d) {
        return d.from('tutor_profiles').select('id').eq('user_id', me.id).maybeSingle().then(err)
          .then(function (tp) {
            if (!tp) throw new Error('আবেদন করতে আগে টিউটর হিসেবে রেজিস্টার করুন (#become-tutor)');
            return d.from('tuition_applications').select('id').eq('tutor_profile_id', tp.id).eq('tuition_post_id', postId).maybeSingle().then(err)
              .then(function (existing) {
                if (existing) throw new Error('আপনি এই পোস্টে ইতিমধ্যে আবেদন করেছেন');
                return d.from('tuition_applications').insert({
                  tuition_post_id: postId,
                  tutor_profile_id: tp.id,
                  message: '',
                  proposed_rate: null,
                  status: 'pending'
                }).then(err);
              });
          });
      });
    });
  }
  function createPost(v) {
    return H.session().then(function (me) {
      if (!me) throw new Error('লগইন করুন');
      return db().then(function (d) {
        return d.from('tuition_posts').insert({
          title: v.title, category: v.category, class_level: v.classLevel,
          subjects: v.subjects, medium: v.medium, area: v.area,
          days: v.days, salary: v.salary, verified_only: v.verifiedOnly,
          description: v.description, address: v.address, contact: v.contact,
          status: 'pending', created_by: me.id
        }).then(err);
      });
    });
  }
  function registerTutor(v) {
    return H.session().then(function (me) {
      if (!me) throw new Error('লগইন করুন');
      return db().then(function (d) {
        return d.from('tutor_profiles').upsert({
          user_id: me.id, full_name: v.fullName, phone: v.phone,
          institution: v.institution, experience: v.experience ? +v.experience : 0,
          subjects: v.subjects, areas: v.areas, bio: v.bio,
          verification_status: 'pending', suspended: false, featured: false
        }, { onConflict: 'user_id' }).then(err);
      });
    });
  }
  function uploadDoc(file) {
    return H.session().then(function (me) {
      if (!me) throw new Error('লগইন করুন');
      return db().then(function (d) {
        var path = me.id + '/' + file.name;
        return d.storage.from('tuition-docs').upload(path, file, { upsert: true }).then(err);
      });
    });
  }

  /* ---------- export ---------- */
  window.TuitionData = {
    init: init,
    _db: db,
    getStats: getStats,
    searchPosts: searchPosts,
    searchTutors: searchTutors,
    getFeaturedTutors: getFeaturedTutors,
    getLatestPosts: getLatestPosts,
    renderPostCards: renderPostCards,
    renderTutorCards: renderTutorCards,
    getNotifications: getNotifications,
    refreshBellDot: refreshBellDot,
    markAllRead: markAllRead,
    applyToPost: applyToPost,
    createPost: createPost,
    registerTutor: registerTutor,
    uploadDoc: uploadDoc
  };
})();
