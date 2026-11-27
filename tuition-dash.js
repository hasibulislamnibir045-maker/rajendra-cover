/* =============================================================
   tuition-dash.js — Tuition Marketplace dashboards
   - Student: my posts + received applications (shortlist/accept/reject)
   - Tutor: my applications + verification status
   - Admin: KPIs, verification queue, post moderation, reports,
     featured toggles, suspensions, stats charts
   Depends on: hubdb.js, tuition-data.js
   ============================================================= */
(function () {
  var TD = window.TuitionData, H = window.HUBDB;
  if (!TD) { console.error('tuition-dash: tuition-data.js load hoy ni'); return; }

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function db() { return TD._db(); }
  function err(r) { if (r.error) throw r.error; return r.data; }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'tn-toast' + (kind === 'success' ? ' tn-toast--success' : kind === 'error' ? ' tn-toast--error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    setTimeout(function () { t.classList.remove('is-visible'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }

  var role = null, me = null, admin = false;

  /* ---------- dashboard shell ---------- */
  function dashShell(active) {
    return '<div class="tn-dash">' +
      '<nav class="tn-dash__nav" id="tnDashNav">' +
        '<a href="#" data-dtab="overview" class="' + (active === 'overview' ? 'is-active' : '') + '">🏠 ওভারভিউ</a>' +
        '<a href="#" data-dtab="posts" class="' + (active === 'posts' ? 'is-active' : '') + '">📢 আমার পোস্ট</a>' +
        '<a href="#" data-dtab="applications" class="' + (active === 'applications' ? 'is-active' : '') + '">📨 আবেদনসমূহ</a>' +
        '<a href="#" data-dtab="tutor-profile" class="' + (active === 'tutor-profile' ? 'is-active' : '') + '">🎓 টিউটর প্রোফাইল</a>' +
        (admin ? '<a href="#" data-dtab="admin" class="' + (active === 'admin' ? 'is-active' : '') + '">🛡 অ্যাডমিন প্যানেল</a>' : '') +
      '</nav>' +
      '<div id="tnDashContent"></div>' +
    '</div>';
  }

  /* ---------- KPI helper ---------- */
  function kpis(items) {
    return '<div class="tn-kpis">' + items.map(function (k) {
      return '<div class="tn-kpi"><div class="tn-kpi__label">' + esc(k.label) + '</div>' +
        '<div class="tn-kpi__value">' + esc(k.value) + '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------- data fetchers ---------- */
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

  /* ---------- tab renderers ---------- */
  function tabOverview() {
    var content = $('tnDashContent');
    content.innerHTML = '<div class="tn-dash__panel"><div class="tn-dash__panel-title">লোড হচ্ছে…</div></div>';
    Promise.all([myPosts(), myApplications(), myTutorProfile()]).then(function (r) {
      var posts = r[0], apps = r[1], tp = r[2];
      var pendingApps = apps.filter(function (a) { return a.status === 'pending'; }).length;
      applicationsForMyPosts().then(function (recvd) {
        content.innerHTML =
          '<div class="tn-dash__panel">' +
            '<div class="tn-dash__panel-title">👋 ' + esc((me.email || '').split('@')[0]) + '</div>' +
            (tp ? '<div class="tn-notice tn-notice--' +
                (tp.verification_status === 'verified' ? 'success' : tp.verification_status === 'rejected' ? 'danger' : 'warn') + '">' +
                'টিউটর প্রোফাইল: ' + (tp.verification_status === 'verified' ? '✓ ভেরিফায়েড' :
                  tp.verification_status === 'rejected' ? '✗ প্রত্যাখ্যাত' : '⏳ যাচাইয়ের অপেক্ষায়') + '</div>' : '') +
          '</div>' +
          kpis([
            { label: 'আমার পোস্ট', value: posts.length },
            { label: 'আমার আবেদন', value: apps.length },
            { label: 'অপেক্ষমাণ আবেদন', value: pendingApps },
            { label: 'প্রাপ্ত আবেদন', value: recvd.length }
          ]) +
          '<div class="tn-dash__panel"><div class="tn-dash__panel-title">সাম্প্রতিক কার্যক্রম</div>' +
            '<p class="tn-text-soft">নতুন আবেদন বা স্ট্যাটাস আপডেট এখানে দেখা যাবে। নোটিফিকেশন বেল 🔔-এ সতর্কতা পাবেন।</p>' +
          '</div>';
      });
    }).catch(function (e) {
      content.innerHTML = '<div class="tn-notice tn-notice--danger">লোড করা যায়নি: ' + esc(e.message || '') + '</div>';
    });
  }

  function tabPosts() {
    var content = $('tnDashContent');
    content.innerHTML = '<div class="tn-dash__panel"><div class="tn-dash__panel-title">লোড হচ্ছে…</div></div>';
    myPosts().then(function (posts) {
      if (!posts.length) {
        content.innerHTML = '<div class="tn-empty"><div class="tn-empty__icon">📢</div>' +
          '<div class="tn-empty__title">কোনো পোস্ট নেই</div>' +
          '<p><a href="#post">প্রথম টিউশন পোস্ট করুন →</a></p></div>';
        return;
      }
      content.innerHTML = '<div class="tn-dash__panel"><div class="tn-dash__panel-title">আমার পোস্ট (' + posts.length + ')</div>' +
        '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
        '<th>শিরোনাম</th><th>বেতন</th><th>স্ট্যাটাস</th><th>তারিখ</th></tr></thead><tbody>' +
        posts.map(function (p) {
          var badge = p.status === 'approved' ? 'tn-badge--approved' : p.status === 'rejected' ? 'tn-badge--rejected' : 'tn-badge--pending';
          var label = p.status === 'approved' ? '✓ অনুমোদিত' : p.status === 'rejected' ? '✗ প্রত্যাখ্যাত' : '⏳ অপেক্ষমাণ';
          return '<tr><td>' + esc(p.title) + '</td><td>৳' + esc(p.salary || '—') + '</td>' +
            '<td><span class="tn-badge ' + badge + '">' + label + '</span></td>' +
            '<td>' + new Date(p.created_at).toLocaleDateString('bn-BD') + '</td></tr>';
        }).join('') +
        '</tbody></table></div></div>';
    }).catch(function (e) {
      content.innerHTML = '<div class="tn-notice tn-notice--danger">লোড করা যায়নি: ' + esc(e.message || '') + '</div>';
    });
  }

  function tabApplications() {
    var content = $('tnDashContent');
    content.innerHTML = '<div class="tn-dash__panel"><div class="tn-dash__panel-title">লোড হচ্ছে…</div></div>';
    applicationsForMyPosts().then(function (recvd) {
      myApplications().then(function (mine) {
        var html = '';
        html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">আমার পোস্টে প্রাপ্ত আবেদন (' + recvd.length + ')</div>';
        if (!recvd.length) html += '<p class="tn-text-soft">এখনো কোনো আবেদন আসেনি।</p>';
        else {
          html += '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
            '<th>টিউটর</th><th>বিষয়</th><th>বার্তা</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>';
          recvd.forEach(function (a) {
            var t = a.tutor_profiles || {};
            html += '<tr><td><strong>' + esc(t.full_name || '—') + '</strong>' +
              (t.verification_status === 'verified' ? ' <span class="tn-verified-tick">✓</span>' : '') + '<br>' +
              '<span class="tn-text-faint" style="font-size:0.78rem">' + esc(t.institution || '') + '</span></td>' +
              '<td>' + esc(t.subjects || '—') + '</td>' +
              '<td style="max-width:220px">' + esc((a.message || '').slice(0, 90)) + '</td>' +
              '<td><span class="tn-badge ' + (a.status === 'accepted' ? 'tn-badge--approved' : a.status === 'rejected' ? 'tn-badge--rejected' : a.status === 'shortlisted' ? 'tn-badge--featured' : 'tn-badge--pending') + '">' + esc(a.status) + '</span></td>' +
              '<td>' +
                '<button class="tn-btn tn-btn--sm tn-btn--ghost" data-app-act="shortlist" data-app-id="' + a.id + '">শর্টলিস্ট</button> ' +
                '<button class="tn-btn tn-btn--sm tn-btn--primary" data-app-act="accept" data-app-id="' + a.id + '">অ্যাকসেপ্ট</button> ' +
                '<button class="tn-btn tn-btn--sm tn-btn--danger" data-app-act="reject" data-app-id="' + a.id + '">বাতিল</button>' +
              '</td></tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';
        html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">আমার প্রেরিত আবেদন (' + mine.length + ')</div>';
        if (!mine.length) html += '<p class="tn-text-soft">এখনো কোনো আবেদন করেননি। <a href="#finder">টিউশন খুঁজুন →</a></p>';
        else {
          html += '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
            '<th>পোস্ট</th><th>প্রস্তাবিত বেতন</th><th>স্ট্যাটাস</th><th>তারিখ</th></tr></thead><tbody>';
          mine.forEach(function (a) {
            html += '<tr><td>' + esc((a.tuition_posts || {}).title || '—') + '</td>' +
              '<td>' + (a.proposed_rate ? '৳' + esc(a.proposed_rate) : '—') + '</td>' +
              '<td><span class="tn-badge ' + (a.status === 'accepted' ? 'tn-badge--approved' : a.status === 'rejected' ? 'tn-badge--rejected' : a.status === 'shortlisted' ? 'tn-badge--featured' : 'tn-badge--pending') + '">' + esc(a.status) + '</span></td>' +
              '<td>' + new Date(a.created_at).toLocaleDateString('bn-BD') + '</td></tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';
        content.innerHTML = html;
      });
    }).catch(function (e) {
      content.innerHTML = '<div class="tn-notice tn-notice--danger">লোড করা যায়নি: ' + esc(e.message || '') + '</div>';
    });
  }

  function tabTutorProfile() {
    var content = $('tnDashContent');
    content.innerHTML = '<div class="tn-dash__panel"><div class="tn-dash__panel-title">লোড হচ্ছে…</div></div>';
    myTutorProfile().then(function (tp) {
      if (!tp) {
        content.innerHTML = '<div class="tn-empty"><div class="tn-empty__icon">🎓</div>' +
          '<div class="tn-empty__title">টিউটর প্রোফাইল নেই</div>' +
          '<p>টিউটর হিসেবে রেজিস্টার করলে এখানে আপনার প্রোফাইল ও ভেরিফিকেশন স্ট্যাটাস দেখা যাবে।</p>' +
          '<p class="tn-mt-2"><a class="tn-btn tn-btn--primary" href="#become-tutor">টিউটর হিসেবে রেজিস্টার করুন</a></p></div>';
        return;
      }
      var v = tp.verification_status;
      var vBadge = v === 'verified' ? '<span class="tn-badge tn-badge--verified">✓ ভেরিফায়েড</span>'
        : v === 'rejected' ? '<span class="tn-badge tn-badge--rejected">✗ প্রত্যাখ্যাত</span>'
        : '<span class="tn-badge tn-badge--pending">⏳ যাচাইয়ের অপেক্ষায়</span>';
      content.innerHTML = '<div class="tn-dash__panel">' +
        '<div class="tn-tutor__head tn-mb-2"><div class="tn-tutor__avatar">🎓</div>' +
        '<div><h3 style="color:var(--tn-primary)">' + esc(tp.full_name) + ' ' + vBadge + '</h3>' +
        '<div class="tn-text-faint">' + esc(tp.institution || '') + '</div></div></div>' +
        '<div class="tn-card__meta">' +
          '<span>📚 ' + esc(tp.subjects || '—') + '</span>' +
          '<span>⏳ ' + esc(tp.experience || 0) + ' বছরের অভিজ্ঞতা</span>' +
          '<span>📍 ' + esc(tp.areas || '—') + '</span>' +
        '</div>' +
        (tp.bio ? '<p class="tn-text-soft tn-mt-2">' + esc(tp.bio) + '</p>' : '') +
        '<div class="tn-notice tn-notice--info tn-mt-2">🔒 আপনার ফোন ও ডকুমেন্ট প্রাইভেট — অ্যাডমিন ছাড়া কেউ দেখতে পাবে না।</div>' +
      '</div>';
    }).catch(function (e) {
      content.innerHTML = '<div class="tn-notice tn-notice--danger">লোড করা যায়নি: ' + esc(e.message || '') + '</div>';
    });
  }

  /* ---------- ADMIN PANEL ---------- */
  function tabAdmin() {
    var content = $('tnDashContent');
    content.innerHTML = '<div class="tn-dash__panel"><div class="tn-dash__panel-title">লোড হচ্ছে…</div></div>';
    db().then(function (d) {
      return Promise.all([
        d.from('tutor_profiles').select('*').order('created_at', { ascending: false }).limit(200).then(err),
        d.from('tuition_posts').select('*').order('created_at', { ascending: false }).limit(200).then(err),
        d.from('tuition_reports').select('*').order('created_at', { ascending: false }).limit(100).then(err),
        d.from('tuition_applications').select('id,status').then(err)
      ]).then(function (r) {
        var tutors = r[0], posts = r[1], reports = r[2], apps = r[3];

        var pendV = tutors.filter(function (t) { return t.verification_status === 'pending'; }).length;
        var pendP = posts.filter(function (p) { return p.status === 'pending'; }).length;
        var openR = reports.filter(function (x) { return x.status === 'open'; }).length;
        var accepted = apps.filter(function (a) { return a.status === 'accepted'; }).length;

        var html = kpis([
          { label: 'অপেক্ষমাণ ভেরিফিকেশন', value: pendV },
          { label: 'অপেক্ষমাণ পোস্ট', value: pendP },
          { label: 'খোলা রিপোর্ট', value: openR },
          { label: 'সফল ম্যাচিং', value: accepted }
        ]);

        html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">🎓 ভেরিফিকেশন কিউ (' + pendV + ')</div>';
        if (!pendV) html += '<p class="tn-text-soft">সব যাচাই সম্পন্ন ✅</p>';
        else {
          html += '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
            '<th>নাম</th><th>প্রতিষ্ঠান</th><th>বিষয়</th><th>অ্যাকশন</th></tr></thead><tbody>';
          tutors.filter(function (t) { return t.verification_status === 'pending'; }).forEach(function (t) {
            html += '<tr><td><strong>' + esc(t.full_name) + '</strong></td>' +
              '<td>' + esc(t.institution || '—') + '</td><td>' + esc(t.subjects || '—') + '</td>' +
              '<td>' +
                '<button class="tn-btn tn-btn--sm tn-btn--primary" data-vact="verify" data-tid="' + t.id + '">✓ ভেরিফাই</button> ' +
                '<button class="tn-btn tn-btn--sm tn-btn--danger" data-vact="reject" data-tid="' + t.id + '">✗ বাতিল</button> ' +
                '<button class="tn-btn tn-btn--sm tn-btn--ghost" data-vact="toggle-feature" data-tid="' + t.id + '">⭐ ফিচার</button>' +
              '</td></tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';

        html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">📢 পোস্ট মডারেশন (' + pendP + ' অপেক্ষমাণ)</div>';
        if (!pendP) html += '<p class="tn-text-soft">সব পোস্ট মডারেট সম্পন্ন ✅</p>';
        else {
          html += '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
            '<th>শিরোনাম</th><th>বেতন</th><th>অ্যাকশন</th></tr></thead><tbody>';
          posts.filter(function (p) { return p.status === 'pending'; }).forEach(function (p) {
            html += '<tr><td>' + esc(p.title) + '</td><td>৳' + esc(p.salary || '—') + '</td>' +
              '<td>' +
                '<button class="tn-btn tn-btn--sm tn-btn--primary" data-pact="approve" data-pid="' + p.id + '">✓ অনুমোদন</button> ' +
                '<button class="tn-btn tn-btn--sm tn-btn--danger" data-pact="reject" data-pid="' + p.id + '">✗ বাতিল</button>' +
              '</td></tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';

        html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">🚩 রিপোর্ট (' + openR + ' খোলা)</div>';
        if (!openR) html += '<p class="tn-text-soft">কোনো খোলা রিপোর্ট নেই ✅</p>';
        else {
          html += '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
            '<th>ধরন</th><th>কারণ</th><th>বিবরণ</th><th>অ্যাকশন</th></tr></thead><tbody>';
          reports.filter(function (x) { return x.status === 'open'; }).forEach(function (x) {
            html += '<tr><td>' + esc(x.target_type) + '</td><td>' + esc(x.reason) + '</td>' +
              '<td style="max-width:220px">' + esc((x.details || '').slice(0, 80)) + '</td>' +
              '<td>' +
                '<button class="tn-btn tn-btn--sm tn-btn--ghost" data-ract="dismiss" data-rid="' + x.id + '">উপেক্ষা</button> ' +
                '<button class="tn-btn tn-btn--sm tn-btn--primary" data-ract="resolve" data-rid="' + x.id + '">সমাধান</button>' +
              '</td></tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';

        html += '<div class="tn-dash__panel"><div class="tn-dash__panel-title">⭐ ফিচার্ড / স্থগিত টিউটর</div>';
        if (!tutors.length) html += '<p class="tn-text-soft">কোনো টিউটর নেই।</p>';
        else {
          html += '<div class="tn-table-wrap"><table class="tn-table"><thead><tr>' +
            '<th>নাম</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>';
          tutors.forEach(function (t) {
            html += '<tr><td>' + esc(t.full_name) + (t.featured ? ' ⭐' : '') + '</td>' +
              '<td><span class="tn-badge ' + (t.verification_status === 'verified' ? 'tn-badge--verified' : t.verification_status === 'rejected' ? 'tn-badge--rejected' : 'tn-badge--pending') + '">' + esc(t.verification_status) + '</span>' +
              (t.suspended ? ' <span class="tn-badge tn-badge--suspended">স্থগিত</span>' : '') + '</td>' +
              '<td>' +
                '<button class="tn-btn tn-btn--sm tn-btn--ghost" data-vact="toggle-feature" data-tid="' + t.id + '">' + (t.featured ? 'ফিচার সরান' : '⭐ ফিচার') + '</button> ' +
                '<button class="tn-btn tn-btn--sm ' + (t.suspended ? 'tn-btn--primary' : 'tn-btn--danger') + '" data-vact="toggle-suspend" data-tid="' + t.id + '">' +
                (t.suspended ? 'পুনরায় চালু' : 'স্থগিত করুন') + '</button>' +
              '</td></tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';

        content.innerHTML = html;
      });
    }).catch(function (e) {
      content.innerHTML = '<div class="tn-notice tn-notice--danger">অ্যাডমিন প্যানেল লোড করা যায়নি: ' + esc(e.message || '') + '</div>';
    });
  }

  /* ---------- admin actions ---------- */
  function act(table, id, patch, redraw) {
    return db().then(function (d) {
      return d.from(table).update(patch).eq('id', id).then(err)
        .then(function () { toast('আপডেট হয়েছে', 'success'); })
        .catch(function (e) { toast(e.message || 'আপডেট ব্যর্থ', 'error'); });
    }).then(redraw);
  }

  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-app-act]'))) {
      var map = { shortlist: 'shortlisted', accept: 'accepted', reject: 'rejected' };
      var aid = el.getAttribute('data-app-id');
      el.disabled = true;
      act('tuition_applications', aid, { status: map[el.getAttribute('data-app-act')] }, tabApplications);
      return;
    }
    if ((el = e.target.closest('[data-vact]'))) {
      var tid = el.getAttribute('data-tid'), va = el.getAttribute('data-vact');
      el.disabled = true;
      if (va === 'verify') act('tutor_profiles', tid, { verification_status: 'verified' }, tabAdmin);
      else if (va === 'reject') act('tutor_profiles', tid, { verification_status: 'rejected' }, tabAdmin);
      else if (va === 'toggle-feature') db().then(function (d) {
        d.from('tutor_profiles').select('featured').eq('id', tid).maybeSingle().then(err).then(function (t) {
          act('tutor_profiles', tid, { featured: !(t && t.featured) }, tabAdmin);
        });
      });
      else if (va === 'toggle-suspend') db().then(function (d) {
        d.from('tutor_profiles').select('suspended').eq('id', tid).maybeSingle().then(err).then(function (t) {
          act('tutor_profiles', tid, { suspended: !(t && t.suspended) }, tabAdmin);
        });
      });
      return;
    }
    if ((el = e.target.closest('[data-pact]'))) {
      var pid = el.getAttribute('data-pid'), pa = el.getAttribute('data-pact');
      el.disabled = true;
      act('tuition_posts', pid, { status: pa === 'approve' ? 'approved' : 'rejected' }, tabAdmin);
      return;
    }
    if ((el = e.target.closest('[data-ract]'))) {
      var rid = el.getAttribute('data-rid'), ra = el.getAttribute('data-ract');
      el.disabled = true;
      act('tuition_reports', rid, { status: ra === 'resolve' ? 'resolved' : 'dismissed' }, tabAdmin);
      return;
    }
  });

  /* ---------- boot on view change ---------- */
  function loadDash(active) {
    var root = $('tnDashRoot');
    if (!root) return;
    H.session().then(function (user) {
      me = user;
      if (!me) {
        root.innerHTML = '<div class="tn-empty"><div class="tn-empty__icon">🔐</div>' +
          '<div class="tn-empty__title">ড্যাশবোর্ড দেখতে লগইন করুন</div>' +
          '<p class="tn-mt-2"><a class="tn-btn tn-btn--primary" href="index.html">লগইন / রেজিস্টার</a></p></div>';
        return;
      }
      H.isAdmin().then(function (a) {
        admin = !!a;
        root.innerHTML = dashShell(active || 'overview');
        $('tnDashNav').addEventListener('click', function (ev) {
          var link = ev.target.closest('[data-dtab]');
          if (!link) return;
          ev.preventDefault();
          var tab = link.getAttribute('data-dtab');
          root.querySelectorAll('[data-dtab]').forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
          TABS[tab]();
        });
        TABS[active || 'overview']();
      });
    });
  }

  var TABS = {
    overview: tabOverview,
    posts: tabPosts,
    applications: tabApplications,
    'tutor-profile': tabTutorProfile,
    admin: function () { admin ? tabAdmin() : ($('tnDashContent').innerHTML = '<div class="tn-notice tn-notice--danger">অনুমতি নেই</div>'); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('tn:viewchange', function (e) {
      if (e.detail.view === 'dashboard') loadDash('overview');
    });
  });
})();
