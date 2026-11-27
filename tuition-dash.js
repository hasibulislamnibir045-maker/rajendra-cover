/* =============================================================
   tuition-dash.js — Tuition Hub Premium dashboards (Rajendra College, Faridpur)
   Phase-3 restyle (PR-24): matches the PR-23 premium design system —
   Lucide-style inline SVG icons (emoji icons removed), Bengali numerals,
   card-based application & admin panels, mobile-friendly layouts.
   BEHAVIOR UNCHANGED: same DB queries, same action attributes
   (data-app-act / data-vact / data-pact / data-ract), same events
   (tn:viewchange → dashboard), same container (#tnDashRoot),
   same 5s watchdog + failBox migration hint.
   - Student: my posts + received applications (shortlist/accept/reject)
   - Tutor: my applications + verification status
   - Admin: KPIs, verification queue, post moderation, reports,
     featured toggles, suspensions
   Depends on: hubdb.js, tuition-data.js, tuition.css
   ============================================================= */
(function () {
  var TD = window.TuitionData, H = window.HUBDB;
  if (!TD) { console.error('tuition-dash: tuition-data.js load hoy ni'); return; }

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function db() { return TD._db(); }
  function err(r) { if (r.error) throw r.error; return r.data; }
  /* বাংলা সংখ্যা — নতুন কার্ড ডিজাইনের সাথে মিল রেখে */
  function bn(n) {
    return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; });
  }
  /* টাকার ফরম্যাট: ৳ ৫,০০০ */
  function tk(v) {
    var n = Number(v);
    return isNaN(n) ? String(v == null ? '' : v) : n.toLocaleString('bn-BD');
  }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'tn-toast' + (kind === 'success' ? ' tn-toast--success' : kind === 'error' ? ' tn-toast--error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    setTimeout(function () { t.classList.remove('is-visible'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
  /* সবসময় ব্যবহারকারীকে জানাও — লোডিং-এ চিরকাল আটকে থাকবে না */
  function failBox(container, e) {
    if (!container) return;
    var msg = (e && e.message) ? e.message : String(e || 'অজানা ত্রুটি');
    var hint = /relation|does not exist/i.test(msg) ? '<p style="margin-top:6px">⚠️ মনে হচ্ছে ডাটাবেস মাইগ্রেশন এখনো চালানো হয়নি — Supabase SQL Editor-এ 0001 ও 0002 চালাও।</p>' : '';
    container.innerHTML = '<div class="tn-notice tn-notice--danger" style="display:flex;gap:10px;align-items:flex-start">' +
      ico('alert', 16) + '<div><strong>লোড করা যায়নি:</strong> ' + esc(msg) + hint + '</div></div>';
  }

  /* ---------- Lucide-style inline SVG icons (PR-23 design language) ---------- */
  var ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    post: '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    act: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
  };
  function ico(n, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[n] || '') + '</svg>';
  }

  var me = null, admin = false;

  /* ---------- dashboard shell ---------- */
  function dashShell(active) {
    function tab(id, icon, label) {
      return '<a href="#" data-dtab="' + id + '" class="' + (active === id ? 'is-active' : '') + '">' +
        ico(icon, 15) + '<span>' + label + '</span></a>';
    }
    return '<div class="tn-dash">' +
      '<nav class="tn-dash__nav" id="tnDashNav">' +
        tab('overview', 'grid', 'ওভারভিউ') +
        tab('posts', 'post', 'আমার পোস্ট') +
        tab('applications', 'mail', 'আবেদনসমূহ') +
        tab('tutor-profile', 'cap', 'টিউটর প্রোফাইল') +
        (admin ? tab('admin', 'shield', 'অ্যাডমিন প্যানেল') : '') +
      '</nav>' +
      '<div id="tnDashContent"></div>' +
    '</div>';
  }

  function kpis(items) {
    return '<div class="tn-kpis">' + items.map(function (k) {
      return '<div class="tn-kpi"><div class="tn-kpi__label">' + esc(k.label) + '</div>' +
        '<div class="tn-kpi__value">' + bn(k.value) + '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------- small markup helpers ---------- */
  function panelLoading() {
    return '<div class="tn-dash__panel"><div class="tn-dash__panel-title">লোড হচ্ছে…</div></div>';
  }
  function emptyBlock(iconName, title, text, cta) {
    return '<div class="tn-empty"><div class="tn-empty__icon">' + ico(iconName, 26) + '</div>' +
      '<div class="tn-empty__title">' + esc(title) + '</div><p>' + text + '</p>' +
      (cta ? '<p style="margin-top:14px">' + cta + '</p>' : '') + '</div>';
  }
  function chips(subjects) {
    if (!subjects) return '';
    return String(subjects).split(/[,،]/).map(function (s) { return s.trim(); })
      .filter(Boolean).slice(0, 4).map(function (s) {
        return '<span class="tn-chip tn-chip--subject">' + esc(s) + '</span>';
      }).join('');
  }
  function appBadge(status) {
    var map = {
      pending: { cls: 'tn-badge--pending', ico: 'clock', txt: 'অপেক্ষমাণ' },
      shortlisted: { cls: 'tn-badge--verified', ico: 'star', txt: 'শর্টলিস্টেড' },
      accepted: { cls: 'tn-badge--approved', ico: 'check', txt: 'গৃহীত' },
      rejected: { cls: 'tn-badge--rejected', ico: 'x', txt: 'প্রত্যাখ্যাত' },
      withdrawn: { cls: 'tn-badge--rejected', ico: 'x', txt: 'প্রত্যাহৃত' }
    };
    var s = map[status] || map.pending;
    return '<span class="tn-badge ' + s.cls + '">' + ico(s.ico, 13) + ' ' + s.txt + '</span>';
  }
  function postBadge(status) {
    var map = {
      pending: { cls: 'tn-badge--pending', txt: 'রিভিউ-অপেক্ষমাণ' },
      approved: { cls: 'tn-badge--approved', txt: 'প্রকাশিত' },
      rejected: { cls: 'tn-badge--rejected', txt: 'প্রত্যাখ্যাত' },
      filled: { cls: 'tn-badge--verified', txt: 'পূর্ণ হয়েছে' },
      closed: { cls: 'tn-badge--pending', txt: 'বন্ধ' },
      expired: { cls: 'tn-badge--pending', txt: 'মেয়াদোত্তীর্ণ' }
    };
    var s = map[status] || map.pending;
    return '<span class="tn-badge ' + s.cls + '">' + s.txt + '</span>';
  }
  function verifyBadge(st) {
    if (st === 'verified') return '<span class="tn-badge tn-badge--verified">' + ico('check', 13) + ' ভেরিফায়েড</span>';
    if (st === 'rejected') return '<span class="tn-badge tn-badge--rejected">' + ico('x', 13) + ' প্রত্যাখ্যাত</span>';
    return '<span class="tn-badge tn-badge--pending">' + ico('clock', 13) + ' যাচাইয়ের অপেক্ষায়</span>';
  }
  function avatarChar(name) {
    return esc(String(name == null ? '' : name).charAt(0).toUpperCase() || '?');
  }
  function verificationNotice(tp) {
    var st = tp.verification_status;
    if (st === 'verified') {
      return '<div class="tn-notice tn-notice--success" style="display:flex;gap:10px;align-items:flex-start">' +
        ico('check', 16) + '<div><strong>টিউটর প্রোফাইল ভেরিফায়েড</strong> — আপনার প্রোফাইল এখন সবার কাছে ভেরিফায়েড ব্যাজ নিয়ে দেখাবে।</div></div>';
    }
    if (st === 'rejected') {
      return '<div class="tn-notice tn-notice--danger" style="display:flex;gap:10px;align-items:flex-start">' +
        ico('alert', 16) + '<div><strong>প্রোফাইল প্রত্যাখ্যাত</strong> — তথ্য ঠিক করে আবার আবেদন করুন।</div></div>';
    }
    return '<div class="tn-notice tn-notice--warn" style="display:flex;gap:10px;align-items:flex-start">' +
      ico('clock', 16) + '<div><strong>যাচাইয়ের অপেক্ষায়</strong> — অ্যাডমিন যাচাই করে দিলেই ভেরিফায়েড ব্যাজ পাবেন।</div></div>';
  }

  /* ---------- data fetchers (unchanged queries) ---------- */
  function myPosts() {
    return db().then(function (d) {
      return d.from('tuition_posts').select('*')
        .eq('created_by', me.id).order('created_at', { ascending: false }).then(err);
    });
  }
  function myApplications() {
    return db().then(function (d) {
      return d.from('tutor_profiles').select('id').eq('user_id', me.id).maybeSingle().then(err)
        .then(function (tp) {
          if (!tp) return [];
          return d.from('tuition_applications').select('*,tuition_posts(title,salary,category,status)')
            .eq('tutor_profile_id', tp.id).order('created_at', { ascending: false }).then(err);
        });
    });
  }
  function applicationsForMyPosts() {
    return db().then(function (d) {
      return d.from('tuition_posts').select('id').eq('created_by', me.id).then(err)
        .then(function (posts) {
          if (!posts.length) return [];
          return d.from('tuition_applications')
            .select('*,tutor_profiles(full_name,institution,experience,subjects,verification_status)')
            .in('tuition_post_id', posts.map(function (p) { return p.id; }))
            .order('created_at', { ascending: false }).then(err);
        });
    });
  }
  function myTutorProfile() {
    return db().then(function (d) {
      return d.from('tutor_profiles').select('*').eq('user_id', me.id).maybeSingle().then(err);
    });
  }

  /* ---------- tab: overview ---------- */
  function tabOverview() {
    var content = $('tnDashContent');
    content.innerHTML = panelLoading();
    Promise.all([myPosts(), myApplications(), myTutorProfile()]).then(function (r) {
      var posts = r[0], apps = r[1], tp = r[2];
      var pendingApps = apps.filter(function (a) { return a.status === 'pending'; }).length;
      applicationsForMyPosts().then(function (recvd) {
        var name = (me.user_metadata && me.user_metadata.full_name) || ((me.email || 'ব্যবহারকারী').split('@')[0]);
        content.innerHTML =
          '<div class="tn-dash__panel" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
            '<div class="tn-avatar" style="width:52px;height:52px;font-size:1.25rem">' + avatarChar(name) + '</div>' +
            '<div style="min-width:0">' +
              '<div style="font-weight:800;font-size:1.08rem;color:var(--tn-primary)">' + esc(name) + '</div>' +
              '<div class="tn-text-faint" style="font-size:.86rem">' + esc(me.email || '') + '</div>' +
            '</div>' +
            '<div style="margin-left:auto">' + (tp ? verifyBadge(tp.verification_status) : '') + '</div>' +
          '</div>' +
          (tp ? verificationNotice(tp) : '') +
          kpis([
            { label: 'আমার পোস্ট', value: posts.length },
            { label: 'আমার আবেদন', value: apps.length },
            { label: 'অপেক্ষমাণ আবেদন', value: pendingApps },
            { label: 'প্রাপ্ত আবেদন', value: recvd.length }
          ]) +
          '<div class="tn-dash__panel">' +
            '<div class="tn-dash__panel-title">' + ico('act', 17) + ' সাম্প্রতিক কার্যক্রম</div>' +
            '<p class="tn-text-soft">নতুন আবেদন বা স্ট্যাটাস আপডেট এখানে দেখা যাবে। নোটিফিকেশন বেল-এ সতর্কতা পাবেন।</p>' +
            '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px">' +
              '<button class="tn-btn tn-btn--ghost tn-btn--sm" data-dtab-jump="posts">' + ico('post', 15) + ' আমার পোস্ট</button>' +
              '<button class="tn-btn tn-btn--ghost tn-btn--sm" data-dtab-jump="applications">' + ico('mail', 15) + ' আবেদনসমূহ</button>' +
              '<a class="tn-btn tn-btn--outline tn-btn--sm" href="#find">' + ico('pin', 15) + ' টিউশন খুঁজুন</a>' +
            '</div>' +
          '</div>';
      }).catch(function (e) { failBox(content, e); });
    }).catch(function (e) { failBox(content, e); });
  }

  /* ---------- tab: my posts ---------- */
  function tabPosts() {
    var content = $('tnDashContent');
    content.innerHTML = panelLoading();
    myPosts().then(function (posts) {
      if (!posts.length) {
        content.innerHTML = emptyBlock('post', 'কোনো পোস্ট নেই',
          'প্রথম টিউশন পোস্ট করে উপযুক্ত টিউটর খুঁজে নিন।',
          '<a class="tn-btn tn-btn--primary" href="#post">' + ico('post', 15) + ' প্রথম টিউশন পোস্ট করুন</a>');
        return;
      }
      content.innerHTML =
        '<div class="tn-dash__panel">' +
          '<div class="tn-dash__panel-title">' + ico('post', 17) + ' আমার পোস্ট (' + bn(posts.length) + ')</div>' +
          '<div class="tn-table-wrap"><table class="tn-table">' +
            '<thead><tr><th>শিরোনাম</th><th>বেতন</th><th>স্ট্যাটাস</th><th>তারিখ</th></tr></thead>' +
            '<tbody>' + posts.map(function (p) {
              return '<tr>' +
                '<td style="font-weight:700">' + esc(p.title) + '</td>' +
                '<td>' + (p.salary != null ? '৳' + tk(p.salary) : '—') + '</td>' +
                '<td>' + postBadge(p.status) + '</td>' +
                '<td class="tn-text-faint">' + new Date(p.created_at).toLocaleDateString('bn-BD') + '</td>' +
              '</tr>';
            }).join('') + '</tbody>' +
          '</table></div>' +
        '</div>';
    }).catch(function (e) { failBox(content, e); });
  }

  /* ---------- tab: applications ---------- */
  function receivedAppCard(a) {
    var tp = a.tutor_profiles || {}, post = a.tuition_posts || {};
    var actions = '';
    if (a.status === 'pending' || a.status === 'shortlisted') {
      actions =
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
          '<button class="tn-btn tn-btn--ghost tn-btn--sm" data-app-act="shortlist" data-app-id="' + a.id + '">' + ico('star', 14) + ' শর্টলিস্ট</button>' +
          '<button class="tn-btn tn-btn--primary tn-btn--sm" data-app-act="accept" data-app-id="' + a.id + '">' + ico('check', 14) + ' গ্রহণ করুন</button>' +
          '<button class="tn-btn tn-btn--danger tn-btn--sm" data-app-act="reject" data-app-id="' + a.id + '">' + ico('x', 14) + ' প্রত্যাখ্যান</button>' +
        '</div>';
    }
    return '<div style="border:1px solid var(--tn-border);border-radius:var(--tn-radius-sm);padding:14px;background:var(--tn-surface)">' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
          '<div class="tn-tutor__avatar" style="width:40px;height:40px;font-size:1rem;flex-shrink:0">' + avatarChar(tp.full_name) + '</div>' +
          '<div style="min-width:0;flex:1">' +
            '<div style="font-weight:700">' + esc(tp.full_name || 'টিউটর') +
              (tp.verification_status === 'verified' ? ' <span class="tn-badge tn-badge--verified">' + ico('check', 12) + ' ভেরিফায়েড</span>' : '') +
            '</div>' +
            '<div class="tn-text-faint" style="font-size:.84rem">' +
              esc(tp.institution || '') + (tp.experience ? ' · ' + bn(tp.experience) + ' বছরের অভিজ্ঞতা' : '') +
            '</div>' +
          '</div>' +
          appBadge(a.status) +
        '</div>' +
        '<div class="tn-card__meta" style="margin-top:10px">' +
          '<span>' + ico('doc', 14) + ' পোস্ট: <strong>' + esc(post.title || '') + '</strong></span>' +
          (post.salary != null ? '<span>৳' + tk(post.salary) + '/মাস</span>' : '') +
          '<span>' + ico('clock', 14) + ' ' + new Date(a.created_at).toLocaleDateString('bn-BD') + '</span>' +
        '</div>' +
        (tp.subjects ? '<div style="margin-top:8px">' + chips(tp.subjects) + '</div>' : '') +
        (a.message ? '<p class="tn-text-soft" style="margin-top:8px">“' + esc(a.message) + '”</p>' : '') +
        actions +
      '</div>';
  }
  function myAppCard(a) {
    var post = a.tuition_posts || {};
    return '<div style="border:1px solid var(--tn-border);border-radius:var(--tn-radius-sm);padding:14px;background:var(--tn-surface)">' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
          '<div style="min-width:0;flex:1">' +
            '<div style="font-weight:700">' + esc(post.title || 'টিউশন') + '</div>' +
            '<div class="tn-text-faint" style="font-size:.84rem">' +
              esc(post.category || '') + (post.salary != null ? ' · ৳' + tk(post.salary) + '/মাস' : '') +
            '</div>' +
          '</div>' +
          appBadge(a.status) +
        '</div>' +
        '<div class="tn-text-faint" style="margin-top:8px;font-size:.82rem">' +
          ico('clock', 13) + ' আবেদনের তারিখ: ' + new Date(a.created_at).toLocaleDateString('bn-BD') +
        '</div>' +
      '</div>';
  }
  function tabApplications() {
    var content = $('tnDashContent');
    content.innerHTML = panelLoading();
    Promise.all([applicationsForMyPosts(), myApplications()]).then(function (r) {
      var recvd = r[0], mine = r[1];
      var html =
        '<div class="tn-dash__panel">' +
          '<div class="tn-dash__panel-title">' + ico('users', 17) + ' আমার পোস্টে প্রাপ্ত আবেদন (' + bn(recvd.length) + ')</div>' +
          (recvd.length
            ? '<div style="display:grid;gap:12px">' + recvd.map(receivedAppCard).join('') + '</div>'
            : '<p class="tn-text-soft">এখনো কেউ আবেদন করেননি। পোস্ট প্রকাশিত হলে টিউটররা এখানে আবেদন করবেন।</p>') +
        '</div>' +
        '<div class="tn-dash__panel">' +
          '<div class="tn-dash__panel-title">' + ico('mail', 17) + ' আমার পাঠানো আবেদন (' + bn(mine.length) + ')</div>' +
          (mine.length
            ? '<div style="display:grid;gap:12px">' + mine.map(myAppCard).join('') + '</div>'
            : '<p class="tn-text-soft">আপনি এখনো কোনো টিউশনে আবেদন করেননি। <a href="#find">টিউশন খুঁজুন →</a></p>') +
        '</div>';
      content.innerHTML = html;
    }).catch(function (e) { failBox(content, e); });
  }

  /* ---------- tab: tutor profile ---------- */
  function tabTutorProfile() {
    var content = $('tnDashContent');
    content.innerHTML = panelLoading();
    myTutorProfile().then(function (tp) {
      if (!tp) {
        content.innerHTML = emptyBlock('cap', 'টিউটর প্রোফাইল নেই',
          'টিউটর হিসেবে রেজিস্টার করলে এখানে আপনার প্রোফাইল ও ভেরিফিকেশন স্ট্যাটাস দেখা যাবে।',
          '<a class="tn-btn tn-btn--primary" href="#become-tutor">' + ico('cap', 15) + ' টিউটর হিসেবে রেজিস্টার করুন</a>');
        return;
      }
      content.innerHTML =
        '<div class="tn-dash__panel">' +
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
            '<div class="tn-tutor__avatar" style="width:56px;height:56px;flex-shrink:0">' + ico('cap', 26) + '</div>' +
            '<div style="min-width:0;flex:1">' +
              '<h3 style="color:var(--tn-primary);font-size:1.15rem;font-weight:800">' + esc(tp.full_name) + '</h3>' +
              '<div class="tn-text-faint">' + esc(tp.institution || '') + '</div>' +
            '</div>' +
            verifyBadge(tp.verification_status) +
          '</div>' +
          '<div class="tn-card__meta" style="margin-top:14px">' +
            (tp.subjects ? '<span>' + ico('doc', 14) + ' ' + esc(tp.subjects) + '</span>' : '') +
            (tp.experience != null ? '<span>' + ico('clock', 14) + ' ' + bn(tp.experience) + ' বছরের অভিজ্ঞতা</span>' : '') +
            (tp.areas ? '<span>' + ico('pin', 14) + ' ' + esc(tp.areas) + '</span>' : '') +
          '</div>' +
          (tp.subjects ? '<div style="margin-top:10px">' + chips(tp.subjects) + '</div>' : '') +
          (tp.bio ? '<p class="tn-text-soft" style="margin-top:12px">' + esc(tp.bio) + '</p>' : '') +
          '<div class="tn-notice tn-notice--info" style="display:flex;gap:10px;align-items:flex-start;margin-top:14px">' +
            ico('lock', 16) + '<div>আপনার ফোন ও ডকুমেন্ট প্রাইভেট — অ্যাডমিন ছাড়া কেউ দেখতে পাবে না।</div>' +
          '</div>' +
        '</div>';
    }).catch(function (e) { failBox(content, e); });
  }

  /* ---------- tab: admin panel ---------- */
  function verifyCard(t) {
    return '<div style="border:1px solid var(--tn-border);border-radius:var(--tn-radius-sm);padding:14px;background:var(--tn-surface)">' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
          '<div class="tn-tutor__avatar" style="width:40px;height:40px;font-size:1rem;flex-shrink:0">' + avatarChar(t.full_name) + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:700">' + esc(t.full_name) + '</div>' +
            '<div class="tn-text-faint" style="font-size:.84rem">' +
              esc(t.institution || '') + (t.experience ? ' · ' + bn(t.experience) + ' বছর' : '') +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="tn-btn tn-btn--primary tn-btn--sm" data-vact="verify" data-tid="' + t.id + '">' + ico('check', 14) + ' ভেরিফাই</button>' +
            '<button class="tn-btn tn-btn--danger tn-btn--sm" data-vact="reject" data-tid="' + t.id + '">' + ico('x', 14) + ' প্রত্যাখ্যান</button>' +
          '</div>' +
        '</div>' +
        (t.subjects ? '<div style="margin-top:10px">' + chips(t.subjects) + '</div>' : '') +
        (t.areas ? '<div class="tn-text-faint" style="margin-top:8px;font-size:.82rem">' + ico('pin', 13) + ' ' + esc(t.areas) + '</div>' : '') +
      '</div>';
  }
  function modPostRow(p) {
    return '<div style="border:1px solid var(--tn-border);border-radius:var(--tn-radius-sm);padding:14px;background:var(--tn-surface);display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:700">' + esc(p.title) + '</div>' +
          '<div class="tn-text-faint" style="font-size:.84rem">' +
            [p.category, p.class_level, p.area].filter(Boolean).map(function (x) { return esc(x); }).join(' · ') +
            (p.salary != null ? ' · ৳' + tk(p.salary) : '') +
          '</div>' +
        '</div>' +
        '<button class="tn-btn tn-btn--primary tn-btn--sm" data-pact="approve" data-pid="' + p.id + '">' + ico('check', 14) + ' অনুমোদন</button>' +
        '<button class="tn-btn tn-btn--danger tn-btn--sm" data-pact="reject" data-pid="' + p.id + '">' + ico('x', 14) + ' প্রত্যাখ্যান</button>' +
      '</div>';
  }
  function reportRow(r) {
    return '<div style="border:1px solid var(--tn-border);border-radius:var(--tn-radius-sm);padding:14px;background:var(--tn-surface)">' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
          '<span class="tn-badge tn-badge--pending">' + esc(r.target_type || 'post') + '</span>' +
          '<div style="flex:1;min-width:0;font-weight:700">' + esc(r.reason) + '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="tn-btn tn-btn--ghost tn-btn--sm" data-ract="dismiss" data-rid="' + r.id + '">খারিজ</button>' +
            '<button class="tn-btn tn-btn--primary tn-btn--sm" data-ract="resolve" data-rid="' + r.id + '">' + ico('check', 14) + ' সমাধান</button>' +
          '</div>' +
        '</div>' +
        (r.details ? '<p class="tn-text-soft" style="margin-top:8px">' + esc(r.details) + '</p>' : '') +
      '</div>';
  }
  function manageTutorRow(t) {
    return '<div style="border:1px solid var(--tn-border);border-radius:var(--tn-radius-sm);padding:12px 14px;background:var(--tn-surface);display:flex;flex-wrap:wrap;align-items:center;gap:10px">' +
        '<div class="tn-tutor__avatar" style="width:36px;height:36px;font-size:.95rem;flex-shrink:0">' + avatarChar(t.full_name) + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:700">' + esc(t.full_name) +
            (t.featured ? ' <span class="tn-badge tn-badge--featured">' + ico('star', 12) + ' ফিচার্ড</span>' : '') +
            (t.suspended ? ' <span class="tn-badge tn-badge--rejected">' + ico('x', 12) + ' স্থগিত</span>' : '') +
          '</div>' +
          '<div class="tn-text-faint" style="font-size:.82rem">' + esc(t.institution || '') + '</div>' +
        '</div>' +
        '<button class="tn-btn tn-btn--ghost tn-btn--sm" data-vact="toggle-feature" data-tid="' + t.id + '">' +
          ico('star', 14) + (t.featured ? ' আন-ফিচার' : ' ফিচার') + '</button>' +
        '<button class="tn-btn tn-btn--ghost tn-btn--sm" data-vact="toggle-suspend" data-tid="' + t.id + '">' +
          ico(t.suspended ? 'check' : 'x', 14) + (t.suspended ? ' পুনরায় চালু' : ' স্থগিত করুন') + '</button>' +
      '</div>';
  }
  function tabAdmin() {
    var content = $('tnDashContent');
    if (!admin) {
      content.innerHTML = '<div class="tn-notice tn-notice--danger" style="display:flex;gap:10px;align-items:flex-start">' +
        ico('alert', 16) + '<div><strong>অনুমতি নেই</strong> — এই প্যানেল শুধু অ্যাডমিনদের জন্য।</div></div>';
      return;
    }
    content.innerHTML = panelLoading();
    db().then(function (d) {
      return Promise.all([
        d.from('tuition_posts').select('id', { count: 'exact', head: true }),
        d.from('tuition_posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        d.from('tutor_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        d.from('tutor_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        d.from('tuition_applications').select('id', { count: 'exact', head: true }),
        d.from('tuition_applications').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
        d.from('tuition_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        d.from('tutor_profiles').select('id,full_name,institution,subjects,experience,areas,verification_status,featured,suspended,created_at')
          .eq('verification_status', 'pending').order('created_at', { ascending: true }).limit(25).then(err),
        d.from('tuition_posts').select('id,title,category,class_level,area,salary,created_at')
          .eq('status', 'pending').order('created_at', { ascending: true }).limit(25).then(err),
        d.from('tuition_reports').select('*')
          .eq('status', 'open').order('created_at', { ascending: true }).limit(25).then(err),
        d.from('tutor_profiles').select('id,full_name,institution,verification_status,featured,suspended,created_at')
          .eq('verification_status', 'verified').order('featured', { ascending: false })
          .order('created_at', { ascending: false }).limit(20).then(err)
      ]);
    }).then(function (rs) {
      var c = function (i) { return (rs[i] && rs[i].count) || 0; };
      var pendingTutors = rs[7], pendingPosts = rs[8], openReports = rs[9], verifiedList = rs[10];
      var featuredCount = verifiedList.filter(function (t) { return t.featured; }).length;
      var html = kpis([
        { label: 'মোট পোস্ট', value: c(0) },
        { label: 'অপেক্ষমাণ পোস্ট', value: c(1) },
        { label: 'ভেরিফায়েড টিউটর', value: c(2) },
        { label: 'যাচাই-অপেক্ষমাণ টিউটর', value: c(3) },
        { label: 'মোট আবেদন', value: c(4) },
        { label: 'গৃহীত আবেদন', value: c(5) },
        { label: 'ওপেন রিপোর্ট', value: c(6) },
        { label: 'ফিচার্ড টিউটর', value: featuredCount }
      ]);
      html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">' + ico('cap', 17) +
        ' ভেরিফিকেশন কিউ (' + bn(pendingTutors.length) + ')</div>' +
        (pendingTutors.length
          ? '<div style="display:grid;gap:12px">' + pendingTutors.map(verifyCard).join('') + '</div>'
          : '<p class="tn-text-soft">কোনো টিউটর যাচাইয়ের অপেক্ষায় নেই।</p>') +
        '</div>';
      html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">' + ico('post', 17) +
        ' পোস্ট মডারেশন (' + bn(pendingPosts.length) + ')</div>' +
        (pendingPosts.length
          ? '<div style="display:grid;gap:12px">' + pendingPosts.map(modPostRow).join('') + '</div>'
          : '<p class="tn-text-soft">সব পোস্ট রিভিউ করা হয়েছে।</p>') +
        '</div>';
      html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">' + ico('alert', 17) +
        ' রিপোর্ট (' + bn(openReports.length) + ')</div>' +
        (openReports.length
          ? '<div style="display:grid;gap:12px">' + openReports.map(reportRow).join('') + '</div>'
          : '<p class="tn-text-soft">কোনো ওপেন রিপোর্ট নেই।</p>') +
        '</div>';
      html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">' + ico('star', 17) +
        ' ভেরিফায়েড টিউটর ম্যানেজমেন্ট</div>' +
        (verifiedList.length
          ? '<div style="display:grid;gap:10px">' + verifiedList.map(manageTutorRow).join('') + '</div>'
          : '<p class="tn-text-soft">এখনো কোনো ভেরিফায়েড টিউটর নেই।</p>') +
        '</div>';
      content.innerHTML = html;
    }).catch(function (e) { failBox(content, e); });
  }

  /* ---------- tabs registry + switching ---------- */
  var TABS = {
    overview: tabOverview,
    posts: tabPosts,
    applications: tabApplications,
    'tutor-profile': tabTutorProfile,
    admin: tabAdmin
  };
  function switchTab(tab) {
    if (!TABS[tab]) tab = 'overview';
    var nav = $('tnDashNav');
    if (nav) {
      var links = nav.querySelectorAll('[data-dtab]');
      for (var i = 0; i < links.length; i++) {
        links[i].className = links[i].getAttribute('data-dtab') === tab ? 'is-active' : '';
      }
    }
    TABS[tab]();
  }

  /* ---------- row update helper (same tables/patches as before) ---------- */
  function updateRow(table, id, patch, refresh) {
    db().then(function (d) {
      return d.from(table).update(patch).eq('id', id).then(err);
    }).then(function () {
      toast('আপডেট হয়েছে ✓', 'success');
      refresh();
    }).catch(function (e) {
      toast('আপডেট করা যায়নি: ' + (e && e.message ? e.message : 'অজানা ত্রুটি'), 'error');
      refresh();
    });
  }

  /* ---------- global click delegation (same action attributes as before) ---------- */
  document.addEventListener('click', function (ev) {
    var el;
    /* ওভারভিউ থেকে ট্যাব-জাম্প */
    el = ev.target.closest('[data-dtab-jump]');
    if (el) { switchTab(el.getAttribute('data-dtab-jump')); return; }
    /* আবেদন: শর্টলিস্ট / গ্রহণ / প্রত্যাখ্যান */
    el = ev.target.closest('[data-app-act]');
    if (el) {
      el.disabled = true;
      updateRow('tuition_applications', el.getAttribute('data-app-id'),
        { status: { shortlist: 'shortlisted', accept: 'accepted', reject: 'rejected' }[el.getAttribute('data-app-act')] },
        TABS.applications);
      return;
    }
    /* অ্যাডমিন: টিউটর ভেরিফাই / প্রত্যাখ্যান / ফিচার / স্থগিত */
    el = ev.target.closest('[data-vact]');
    if (el) {
      var tid = el.getAttribute('data-tid'), vact = el.getAttribute('data-vact');
      el.disabled = true;
      if (vact === 'verify') {
        updateRow('tutor_profiles', tid, { verification_status: 'verified' }, TABS.admin);
      } else if (vact === 'reject') {
        updateRow('tutor_profiles', tid, { verification_status: 'rejected' }, TABS.admin);
      } else if (vact === 'toggle-feature') {
        db().then(function (d) {
          return d.from('tutor_profiles').select('featured').eq('id', tid).maybeSingle().then(err);
        }).then(function (row) {
          updateRow('tutor_profiles', tid, { featured: !(row && row.featured) }, TABS.admin);
        });
      } else if (vact === 'toggle-suspend') {
        db().then(function (d) {
          return d.from('tutor_profiles').select('suspended').eq('id', tid).maybeSingle().then(err);
        }).then(function (row) {
          updateRow('tutor_profiles', tid, { suspended: !(row && row.suspended) }, TABS.admin);
        });
      }
      return;
    }
    /* অ্যাডমিন: পোস্ট অনুমোদন / প্রত্যাখ্যান */
    el = ev.target.closest('[data-pact]');
    if (el) {
      el.disabled = true;
      updateRow('tuition_posts', el.getAttribute('data-pid'),
        { status: el.getAttribute('data-pact') === 'approve' ? 'approved' : 'rejected' }, TABS.admin);
      return;
    }
    /* অ্যাডমিন: রিপোর্ট সমাধান / খারিজ */
    el = ev.target.closest('[data-ract]');
    if (el) {
      el.disabled = true;
      updateRow('tuition_reports', el.getAttribute('data-rid'),
        { status: el.getAttribute('data-ract') === 'resolve' ? 'resolved' : 'dismissed' }, TABS.admin);
      return;
    }
  });

  /* ---------- loader (watchdog + login gate, unchanged behavior) ---------- */
  function loadDash(active) {
    var root = $('tnDashRoot');
    if (!root) return;
    // ৫ সেকেন্ড পর সতর্কবার্তা — লোডিং চিরকাল আটকে থাকলে ব্যবহারকারী জানবে
    var watchdog = setTimeout(function () {
      if ($('tnDashContent') && $('tnDashContent').innerHTML.indexOf('লোড হচ্ছে') > -1) {
        failBox($('tnDashContent'), new Error('লোডিং অস্বাভাবিকভাবে দীর্ঘ হচ্ছে — মাইগ্রেশন চালানো হয়েছে কিনা দেখুন, বা ব্রাউজার কনসোলে (F12) error দেখুন'));
      }
    }, 5000);

    root.innerHTML = '<div class="tn-empty"><div class="tn-empty__icon">' + ico('clock', 26) + '</div>' +
      '<div class="tn-empty__title">লোড হচ্ছে…</div><p>ড্যাশবোর্ড প্রস্তুত হচ্ছে</p></div>';
    H.session().then(function (user) {
      me = user;
      if (!me) {
        clearTimeout(watchdog);
        root.innerHTML = '<div class="tn-empty"><div class="tn-empty__icon">' + ico('lock', 26) + '</div>' +
          '<div class="tn-empty__title">ড্যাশবোর্ড দেখতে লগইন করুন</div>' +
          '<p class="tn-text-soft">মূল সাইটের লগইন ব্যবহার করে ঢুকুন।</p>' +
          '<p style="margin-top:14px"><a class="tn-btn tn-btn--primary" href="index.html">' + ico('user', 15) + ' লগইন / রেজিস্টার</a></p></div>';
        return;
      }
      H.isAdmin().then(function (a) {
        admin = !!a;
        root.innerHTML = dashShell(active || 'overview');
        clearTimeout(watchdog);
        $('tnDashNav').addEventListener('click', function (ev) {
          var link = ev.target.closest('[data-dtab]');
          if (!link) return;
          ev.preventDefault();
          switchTab(link.getAttribute('data-dtab'));
        });
        TABS[active || 'overview']();
      }).catch(function (e) {
        clearTimeout(watchdog);
        failBox(root, e);
      });
    }).catch(function (e) {
      clearTimeout(watchdog);
      failBox(root, e);
    });
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('tn:viewchange', function (e) {
      if (e.detail && e.detail.view === 'dashboard') loadDash('overview');
    });
  });
})();
