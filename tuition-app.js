/* =============================================================
   tuition-app.js — Tuition Marketplace UI behaviour
   Views: Home (already in tuition-data), Finder, Post, Become-Tutor,
   Tutors directory, application flow with duplicate-prevention UX.
   Depends on: hubdb.js, tuition-data.js, tuition.css, tuition.html
   ============================================================= */
(function () {
  var TD = window.TuitionData;
  var H = window.HUBDB;
  if (!TD) { console.error('tuition-app: tuition-data.js load hoy ni'); return; }

  /* ---------- shared helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'tn-toast' + (kind === 'success' ? ' tn-toast--success' : kind === 'error' ? ' tn-toast--error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    setTimeout(function () {
      t.classList.remove('is-visible');
      setTimeout(function () { t.remove(); }, 300);
    }, 3200);
  }
  function showResult(el, msg, kind) {
    if (!el) return;
    el.innerHTML = '<div class="tn-notice tn-notice--' + (kind || 'info') + '">' + esc(msg) + '</div>';
  }
  function fieldError(fieldEl, hasError) {
    if (fieldEl) fieldEl.classList.toggle('has-error', !!hasError);
    return !hasError;
  }
  function require(el, fieldEl, minLen) {
    var ok = el && el.value.trim().length >= (minLen || 1);
    return fieldError(fieldEl, !ok);
  }

  /* =========================================================
     FINDER — filters + sort + load-more
     ========================================================= */
  var finderState = { loaded: false, all: [], page: 0, pageSize: 9 };

  function finderFilters() {
    return {
      q: window.tnFinderSeedQuery || '',
      category: ($('fCategory') || {}).value || '',
      classLevel: ($('fClass') || {}).value || '',
      subject: ($('fSubject') || {}).value || '',
      minSalary: ($('fSalary') || {}).value || '',
      verifiedOnly: !!($('fVerifiedOnly') || {}).checked,
      sort: ($('fSort') || {}).value || 'newest'
    };
  }

  function loadFinder(reset) {
    if (reset) finderState.page = 0;
    var f = finderFilters();
    var countEl = $('fCount'), grid = $('fResults');
    if (reset && grid) grid.innerHTML =
      '<div class="tn-skel"><div class="tn-skel__bar tn-skel__bar--title"></div><div class="tn-skel__bar"></div><div class="tn-skel__bar tn-skel__bar--md"></div></div>' +
      '<div class="tn-skel"><div class="tn-skel__bar tn-skel__bar--title"></div><div class="tn-skel__bar"></div><div class="tn-skel__bar tn-skel__bar--md"></div></div>' +
      '<div class="tn-skel"><div class="tn-skel__bar tn-skel__bar--title"></div><div class="tn-skel__bar"></div><div class="tn-skel__bar tn-skel__bar--md"></div></div>';
    if (countEl) countEl.textContent = 'লোড হচ্ছে…';
    return TD.searchPosts(f).then(function (posts) {
      finderState.all = posts || [];
      finderState.loaded = true;
      var slice = finderState.all.slice(0, finderState.pageSize);
      TD.renderPostCards('fResults', slice);
      if (countEl) countEl.textContent = 'মোট ' + finderState.all.length + ' টি পোস্ট পাওয়া গেছে';
      var moreWrap = $('fLoadMoreWrap');
      if (moreWrap) moreWrap.classList.toggle('tn-hidden', finderState.all.length <= finderState.pageSize);
      var btn = $('fLoadMore');
      if (btn) btn.onclick = function () {
        finderState.page++;
        var next = finderState.all.slice(0, (finderState.page + 1) * finderState.pageSize);
        TD.renderPostCards('fResults', next);
        if (next.length >= finderState.all.length) moreWrap.classList.add('tn-hidden');
      };
    }).catch(function (e) {
      if (countEl) countEl.textContent = 'পোস্ট লোড করা যায়নি';
      if (grid) grid.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__icon">⚠️</div><div class="tn-empty__title">লোড করা যায়নি</div><p>' + esc(e.message || '') + '</p></div>';
    });
  }

  /* =========================================================
     TUTORS DIRECTORY
     ========================================================= */
  var tutorsState = { loaded: false, all: [] };
  function loadTutors() {
    if (tutorsState.loaded) return Promise.resolve();
    var countEl = $('tCount');
    if (countEl) countEl.textContent = 'লোড হচ্ছে…';
    return TD.searchTutors('', 24).then(function (tutors) {
      tutorsState.all = tutors || [];
      tutorsState.loaded = true;
      TD.renderTutorCards('tResults', tutorsState.all);
      if (countEl) countEl.textContent = 'মোট ' + tutorsState.all.length + ' জন ভেরিফায়েড টিউটর';
    }).catch(function () {
      if (countEl) countEl.textContent = 'টিউটর লোড করা যায়নি';
    });
  }

  /* =========================================================
     POST FORM — validation + moderation-aware submit
     ========================================================= */
  function initPostForm() {
    var form = $('postForm');
    if (!form) return;
    H.session().then(function (me) {
      if (!me) $('postAuthGate')?.classList.remove('tn-hidden');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ok = require($('pTitle'), $('pTitle').closest('.tn-field'), 10) && ok;
      ok = require($('pCategory'), $('pCategory').closest('.tn-field')) && ok;
      ok = require($('pSubjects'), $('pSubjects').closest('.tn-field')) && ok;
      ok = require($('pSalary'), $('pSalary').closest('.tn-field')) && ok;
      if (+$('pSalary').value <= 0) ok = fieldError($('pSalary').closest('.tn-field'), true) && ok;
      if (!ok) { showResult($('postResult'), 'ফর্মে কিছু ভুল আছে — লাল ঘরগুলো ঠিক করুন।', 'danger'); return; }

      var btn = $('postSubmit');
      btn.disabled = true; btn.textContent = 'পোস্ট হচ্ছে…';
      TD.createPost({
        title: $('pTitle').value.trim(),
        category: $('pCategory').value,
        classLevel: $('pClass').value.trim(),
        subjects: $('pSubjects').value.trim(),
        medium: $('pMedium').value,
        days: $('pDays').value,
        salary: $('pSalary').value,
        verifiedOnly: $('pVerifiedOnly').checked,
        description: $('pDescription').value.trim(),
        address: $('pAddress').value.trim(),
        contact: $('pContact').value.trim()
      }).then(function () {
        btn.disabled = false; btn.textContent = 'পোস্ট করুন';
        form.reset();
        showResult($('postResult'),
          '✅ পোস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন অনুমোদনের পর সবার কাছে দেখা যাবে — ঠিকানা পোস্টে দেখা যাবে, তবে মোবাইল প্রাইভেট থাকবে (শুধু অ্যাডমিন দেখবে)।',
          'success');
        toast('পোস্ট জমা হয়েছে — অনুমোদনের অপেক্ষায়', 'success');
      }).catch(function (e2) {
        btn.disabled = false; btn.textContent = 'পোস্ট করুন';
        if (String(e2.message || '').indexOf('লগইন') >= 0) {
          $('postAuthGate')?.classList.remove('tn-hidden');
          showResult($('postResult'), 'পোস্ট করতে আগে লগইন করুন।', 'warn');
        } else {
          showResult($('postResult'), 'পোস্ট করা যায়নি: ' + (e2.message || 'অজানা ত্রুটি'), 'danger');
        }
      });
    });
  }

  /* =========================================================
     BECOME TUTOR — registration + private doc upload
     ========================================================= */
  function initTutorForm() {
    var form = $('tutorForm');
    if (!form) return;
    var fileInput = $('tuFile'), uploadBox = $('tuUpload'), chosenFile = null;

    uploadBox.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      chosenFile = fileInput.files[0] || null;
      $('tuFileName').textContent = chosenFile ? '📎 ' + chosenFile.name : '';
      fieldError(uploadBox.closest('.tn-field'), false);
    });
    ['dragover', 'dragleave', 'drop'].forEach(function (ev) {
      uploadBox.addEventListener(ev, function (e) {
        e.preventDefault();
        if (ev === 'dragover') uploadBox.classList.add('is-drag');
        else uploadBox.classList.remove('is-drag');
        if (ev === 'drop' && e.dataTransfer.files[0]) {
          chosenFile = e.dataTransfer.files[0];
          fileInput.files = e.dataTransfer.files;
          $('tuFileName').textContent = '📎 ' + chosenFile.name;
        }
      });
    });

    H.session().then(function (me) {
      if (!me) $('tutorAuthGate')?.classList.remove('tn-hidden');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ok = require($('tuName'), $('tuName').closest('.tn-field')) && ok;
      ok = require($('tuPhone'), $('tuPhone').closest('.tn-field'), 6) && ok;
      ok = require($('tuInstitution'), $('tuInstitution').closest('.tn-field')) && ok;
      ok = require($('tuSubjects'), $('tuSubjects').closest('.tn-field')) && ok;
      if (!ok) { showResult($('tutorResult'), 'ফর্মে কিছু ভুল আছে — লাল ঘরগুলো ঠিক করুন।', 'danger'); return; }
      if (!chosenFile) {
        fieldError(uploadBox.closest('.tn-field'), true);
        showResult($('tutorResult'), 'ভেরিফিকেশনের জন্য একটি ডকুমেন্ট আপলোড করুন।', 'danger');
        return;
      }
      if (chosenFile.size > 5 * 1024 * 1024) {
        showResult($('tutorResult'), 'ফাইল খুব বড় — সর্বোচ্চ ৫MB।', 'danger');
        return;
      }

      var btn = $('tutorSubmit');
      btn.disabled = true; btn.textContent = 'রেজিস্টার হচ্ছে…';
      TD.registerTutor({
        fullName: $('tuName').value.trim(),
        phone: $('tuPhone').value.trim(),
        institution: $('tuInstitution').value.trim(),
        experience: $('tuExperience').value,
        subjects: $('tuSubjects').value.trim(),
        areas: $('tuAreas').value.trim(),
        bio: $('tuBio').value.trim()
      }).then(function () {
        return TD.uploadDoc(chosenFile);
      }).then(function () {
        btn.disabled = false; btn.textContent = 'রেজিস্টার করুন';
        form.reset(); chosenFile = null; $('tuFileName').textContent = '';
        showResult($('tutorResult'),
          '✅ রেজিস্ট্রেশন সফল! আপনার ডকুমেন্ট প্রাইভেট বাকেটে সংরক্ষিত — অ্যাডমিন যাচাই করলে ভেরিফায়েড ✓ ব্যাজ পাবেন।',
          'success');
        toast('টিউটর রেজিস্ট্রেশন জমা হয়েছে', 'success');
      }).catch(function (e2) {
        btn.disabled = false; btn.textContent = 'রেজিস্টার করুন';
        if (String(e2.message || '').indexOf('লগইন') >= 0) {
          $('tutorAuthGate')?.classList.remove('tn-hidden');
          showResult($('tutorResult'), 'রেজিস্টার করতে আগে লগইন করুন।', 'warn');
        } else {
          showResult($('tutorResult'), 'রেজিস্টার করা যায়নি: ' + (e2.message || 'অজানা ত্রুটি'), 'danger');
        }
      });
    });
  }

  /* =========================================================
     APPLICATION FLOW — click "আবেদন করুন" on any post card
     ========================================================= */
  function initApplicationFlow() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tn-apply]');
      if (!btn) return;
      e.preventDefault();
      var postId = btn.getAttribute('data-tn-apply');
      btn.disabled = true; btn.textContent = 'আবেদন হচ্ছে…';
      TD.applyToPost(postId).then(function () {
        btn.textContent = '✓ আবেদন হয়েছে';
        toast('আবেদন সফল! পোস্ট মালিককে নোটিফিকেশন গেছে।', 'success');
        TD.refreshBellDot();
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = 'আবেদন করুন';
        toast(err.message || 'আবেদন করা যায়নি', 'error');
      });
    });
  }

  /* =========================================================
     VIEW ROUTING — lazy-load data per view
     ========================================================= */
  function onView(view) {
    if (view === 'finder') {
      loadFinder(true);
    } else if (view === 'tutors') {
      loadTutors();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPostForm();
    initTutorForm();
    initApplicationFlow();
    window.addEventListener('tn:viewchange', function (e) { onView(e.detail.view); });
    $('fApply')?.addEventListener('click', function () { loadFinder(true); });
    $('fReset')?.addEventListener('click', function () {
      ['fCategory', 'fClass', 'fSubject', 'fSalary'].forEach(function (id) { if ($(id)) $(id).value = ''; });
      if ($('fVerifiedOnly')) $('fVerifiedOnly').checked = false;
      window.tnFinderSeedQuery = '';
      loadFinder(true);
    });
    $('fSort')?.addEventListener('change', function () { loadFinder(true); });
    $('tSearch')?.addEventListener('input', function (e) {
      var term = e.target.value.trim();
      TD.searchTutors(term, 24).then(function (ts) { TD.renderTutorCards('tResults', ts); });
    });
  });
})();

/* =============================================================
   PREMIUM REDESIGN LAYER — single coherent layer (v3, 2026-11-27)
   একটাই লেয়ার — আগের দুইটা stacked লেয়ারের (UI-fix + polish)
   পরিষ্কার, ডুপ্লিকেট-মুক্ত সংস্করণ।
   ১) রেফারেন্স প্যালেট: রয়্যাল ব্লু + নেভি + #F5F7FC + নেভি ফুটার
   ২) মোবাইল 360-430px: overflow/কাটা/ওভারল্যাপ সম্পূর্ণ ফিক্স
   ৩) নতুন পোস্ট কার্ড + কমপ্যাক্ট টিউটর কার্ড
   ৪) ঠিকানা পাবলিক / মোবাইল প্রাইভেট (অ্যাডমিন-ওয়ানলি পপআপ)
   ৫) বাইরে-ক্লিক/Esc-এ মেনু-ড্রপডাউন-প্যানেল-পপআপ বন্ধ
   ৬) createPost: contact_phone কলাম ফিক্স
   ============================================================= */
(function () {
  var TD = window.TuitionData, H = window.HUBDB;
  if (!TD) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; }); }
  function salaryText(sal) { return (sal === 0 || sal) ? '৳' + bn(sal) + '/মাস' : 'আলোচনাসাপেক্ষ'; }
  function chipsHTML(subjects, max) {
    if (!subjects) return '';
    return subjects.split(/[,،]/).map(function (s) { return s.trim(); })
      .filter(Boolean).slice(0, max || 3)
      .map(function (s) { return '<span class="tnp-chip">' + esc(s) + '</span>'; }).join('');
  }
  function isAdminP() {
    if (!H || !H.isAdmin) return Promise.resolve(false);
    try {
      return H.isAdmin().then(function (ok) { return !!ok; }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  function fetchPostExtras(d, ids) {
    function q(cols) { return d.from('tuition_posts').select(cols).in('id', ids); }
    return q('id,address,contact_phone').then(function (r) {
      if (!r.error) return { rows: r.data || [], contactCol: 'contact_phone' };
      return q('id,address').then(function (r2) {
        if (!r2.error) return { rows: r2.data || [], contactCol: null };
        return q('id,contact_phone').then(function (r3) {
          if (!r3.error) return { rows: r3.data || [], contactCol: 'contact_phone' };
          return q('id,contact').then(function (r4) {
            if (!r4.error) return { rows: r4.data || [], contactCol: 'contact' };
            return { rows: [], contactCol: null };
          });
        });
      });
    }).catch(function () { return { rows: [], contactCol: null }; });
  }

  /* ---------- ১) ডিজাইন সিস্টেম (একটাই CSS ব্লক) ---------- */
  var css = document.createElement('style');
  css.textContent =
    /* প্যালেট: রয়্যাল ব্লু + ইন্ডিগো + সফট গ্রে */
    ':root{' +
      '--tn-primary:#2563eb;--tn-primary-600:#1d4ed8;--tn-primary-soft:#e8f0fe;' +
      '--tn-accent-violet:#7c5cff;--tn-accent-blue:#2563eb;' +
      '--tn-gradient:linear-gradient(135deg,#0a1931 0%,#1e50ff 60%,#7c5cff 100%);' +
      '--tn-gradient-soft:linear-gradient(135deg,#eef4ff 0%,#f6f3ff 100%);' +
      '--tn-bg:#f5f7fc;--tn-surface:#ffffff;--tn-surface-2:#f0f4fa;' +
      '--tn-border:#e2e8f0;--tn-border-strong:#cbd5e1;' +
      '--tn-text:#1e293b;--tn-text-soft:#64748b;--tn-text-faint:#94a3b8;' +
      '--tn-verified:#10b981;--tn-verified-soft:#e7f8f1;' +
      '--tn-warning:#f59e0b;--tn-warning-soft:#fff7e6;' +
      '--tn-danger:#ef4444;--tn-danger-soft:#fdecec;' +
      '--tn-info:#2563eb;--tn-info-soft:#e8f0fe;' +
      '--tn-radius:16px;--tn-radius-sm:10px;--tn-radius-lg:22px;' +
      '--tn-shadow-sm:0 1px 3px rgba(15,23,42,.07);' +
      '--tn-shadow:0 6px 18px rgba(15,23,42,.09);' +
      '--tn-shadow-lg:0 16px 40px rgba(15,23,42,.14);' +
      '--tn-font:"Hind Siliguri","Noto Sans Bengali","Segoe UI",system-ui,sans-serif;' +
    '}' +
    /* হেডার: সাদা + নীল pill-এ active লিংক */
    '.tn-header{background:rgba(255,255,255,.96);border-bottom:1px solid var(--tn-border);box-shadow:0 1px 2px rgba(15,23,42,.04);}' +
    '.tn-logo{color:#0a1931;font-weight:800;letter-spacing:.2px;}' +
    '.tn-nav a{color:var(--tn-text-soft);font-weight:600;border-radius:999px;padding:8px 14px;}' +
    '.tn-nav a:hover{background:var(--tn-primary-soft);color:var(--tn-primary);text-decoration:none;}' +
    '.tn-nav a.is-active{background:var(--tn-primary);color:#fff;box-shadow:var(--tn-shadow-sm);}' +
    /* হিরো: রেফারেন্স-স্টাইল নীল গ্রেডিয়েন্ট */
    '.tn-hero{background:linear-gradient(135deg,#0a1931 0%,#1e50ff 68%,#7c5cff 100%);}' +
    '.tn-hero::after{display:none;}' +
    '.tn-hero__title{font-weight:800;letter-spacing:.2px;}' +
    /* সার্চ বার: সাদা পিল + রয়্যাল ব্লু বাটন */
    '.tn-search{margin-top:22px;display:flex;gap:8px;background:#fff;border-radius:999px;padding:6px;box-shadow:0 10px 30px rgba(10,25,49,.28);}' +
    '.tn-search input{flex:1;border:none;outline:none;padding:10px 14px;font-size:1rem;background:transparent;min-width:0;}' +
    '.tn-search .tn-btn{border-radius:999px;flex-shrink:0;}' +
    '.tn-search .tn-btn--primary{background:var(--tn-primary);}' +
    /* স্ট্যাট কার্ড */
    '.tn-stat{transition:transform .2s ease,box-shadow .2s ease;}' +
    '.tn-stat:hover{transform:translateY(-3px);box-shadow:var(--tn-shadow);}' +
    '.tn-stat__num{color:var(--tn-primary);}' +
    /* সেকশন */
    '.tn-section{padding:34px 0 26px;}' +
    '.tn-section .tn-section__head{margin-bottom:18px;}' +
    '.tn-section__title{color:#0a1931;letter-spacing:.2px;}' +
    /* ---- নতুন পোস্ট কার্ড ---- */
    '.tn-card--post{position:relative;overflow:hidden;border:1px solid var(--tn-border);border-radius:16px;' +
      'background:linear-gradient(180deg,#ffffff 0%,#f8faff 100%);box-shadow:0 4px 14px rgba(15,23,42,.07);' +
      'padding:14px 14px 0;transition:box-shadow .2s ease,transform .2s ease,border-color .2s ease;}' +
    '.tn-card--post::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;' +
      'background:linear-gradient(90deg,#2563eb 0%,#7c5cff 100%);}' +
    '.tn-card--post:hover{box-shadow:0 14px 30px rgba(15,23,42,.15);transform:translateY(-3px);border-color:#c7d6f5;}' +
    '.tnp-strip{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:2px 0 8px;}' +
    '.tnp-cat{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;' +
      'background:var(--tn-primary-soft);color:var(--tn-primary-600);font-size:.74rem;font-weight:700;}' +
    '.tnp-vonly{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;' +
      'background:var(--tn-verified-soft);color:var(--tn-verified);font-size:.72rem;font-weight:700;}' +
    '.tnp-title{margin:0 0 8px;font-size:1.06rem;font-weight:800;color:#0a1931;line-height:1.55;' +
      'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
    '.tnp-rows{display:flex;flex-direction:column;gap:3px;}' +
    '.tnp-row{display:flex;align-items:flex-start;gap:8px;font-size:.85rem;color:var(--tn-text-soft);padding:2px 0;line-height:1.55;}' +
    '.tnp-row .tnp-ic{flex:0 0 20px;text-align:center;}' +
    '.tnp-row b{color:var(--tn-text);font-weight:600;flex:1;min-width:0;overflow-wrap:anywhere;}' +
    '.tnp-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}' +
    '.tnp-chip{display:inline-flex;padding:3px 10px;border-radius:999px;background:#eef2fa;color:#1d4ed8;' +
      'font-size:.73rem;font-weight:600;white-space:nowrap;}' +
    '.tnp-desc{margin:8px 0 0;font-size:.82rem;color:var(--tn-text-soft);line-height:1.6;' +
      'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
    '.tnp-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;' +
      'margin:12px -14px 0;padding:10px 14px;background:#eef2fa;border-top:1px solid #e2e8f0;' +
      'border-radius:0 0 15px 15px;}' +
    '.tnp-salary{font-size:.95rem;font-weight:800;color:#4f46e5;white-space:nowrap;}' +
    '.tnp-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;}' +
    /* ---- কমপ্যাক্ট টিউটর কার্ড ---- */
    '.tn-grid--tutors{grid-template-columns:repeat(auto-fill,minmax(210px,1fr)) !important;gap:12px !important;}' +
    '.tn-card--tutor{padding:12px;border-radius:14px;border:1px solid var(--tn-border);background:#fff;' +
      'box-shadow:0 2px 8px rgba(15,23,42,.05);gap:8px;transition:box-shadow .2s ease,transform .2s ease;}' +
    '.tn-card--tutor:hover{box-shadow:0 10px 22px rgba(15,23,42,.12);transform:translateY(-2px);}' +
    '.tnt-head{display:flex;align-items:center;gap:9px;min-width:0;}' +
    '.tnt-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#eef4ff,#f1ecff);' +
      'border:1.5px solid #dbe3f5;display:grid;place-items:center;font-size:.95rem;flex:0 0 34px;}' +
    '.tnt-info{min-width:0;flex:1;}' +
    '.tnt-name{margin:0;font-size:.9rem;font-weight:700;color:#0a1931;line-height:1.35;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.tnt-inst{font-size:.74rem;color:var(--tn-text-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.tnt-star{font-size:.8rem;flex-shrink:0;}' +
    '.tn-card--tutor .tnp-chips{margin-top:0;}' +
    '.tn-card--tutor .tnp-chip{font-size:.68rem;padding:2px 8px;}' +
    '.tnt-meta{font-size:.75rem;color:var(--tn-text-soft);display:flex;flex-wrap:wrap;gap:3px 10px;line-height:1.5;}' +
    /* ---- ফুটার: নেভি ---- */
    '.tn-footer{background:#0b1b3d;color:rgba(255,255,255,.85);margin-top:48px;padding:28px 0;}' +
    '.tn-footer__bottom a{color:rgba(255,255,255,.9);}' +
    /* ---- কন্টাক্ট পপআপ ---- */
    '.tn-contact-pop{position:fixed;inset:0;background:rgba(10,25,49,.6);display:grid;place-items:center;z-index:1000;padding:16px;}' +
    '.tn-contact-pop__box{background:#fff;border-radius:16px;padding:20px;max-width:340px;width:100%;' +
      'max-height:82vh;overflow-y:auto;box-shadow:0 20px 50px rgba(10,25,49,.35);}' +
    '.tn-contact-pop__box h4{margin:0 0 10px;font-size:1.05rem;color:#0a1931;}' +
    '.tn-contact-pop__row{display:flex;gap:8px;align-items:center;padding:8px 0;font-size:.95rem;' +
      'border-bottom:1px dashed var(--tn-border);overflow-wrap:anywhere;}' +
    '.tn-contact-pop__row:last-of-type{border-bottom:none;}' +
    '.tn-contact-pop__note{font-size:.78rem;color:var(--tn-text-faint);margin-top:10px;}' +
    '.tn-contact-pop__close{margin-top:14px;width:100%;}' +
    /* ---- মোবাইল: 360-430px সম্পূর্ণ ফিক্স ---- */
    'img,svg{max-width:100%;}' +
    '.tn-table-wrap{max-width:100%;}' +
    '@media (max-width:768px){' +
      '.tn-search{flex-direction:row;padding:5px;gap:6px;}' +
      '.tn-search input{font-size:16px;min-width:0;}' +
      '.tn-search .tn-btn{width:48px;min-width:48px;flex:0 0 48px;padding:9px 0;border-radius:999px;}' +
      '.tn-nav{position:fixed;top:var(--tn-header-h);left:0;right:0;max-width:100vw;}' +
      '.tn-profile-dropdown{right:0;left:auto;min-width:190px;max-width:calc(100vw - 24px);}' +
      '.tn-notif-panel{right:10px;left:10px;width:auto;max-width:none;}' +
      '.tn-header__inner{gap:8px;}' +
      '.tn-container{padding:0 14px;}' +
      '.tn-btn{padding:10px 16px;}' +
      '.tn-btn--sm{padding:8px 12px;}' +
    '}' +
    '@media (max-width:480px){' +
      'html,body{overflow-x:hidden;}' +
      '.tn-header__inner{flex-wrap:nowrap;}' +
      '.tn-logo__text{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '.tn-hero{padding:28px 0 40px;}' +
      '.tn-hero__title{font-size:1.4rem;}' +
      '.tn-hero__cta .tn-btn{flex:1;min-width:0;}' +
      '.tn-stats{gap:10px;}' +
      '.tn-stat{padding:12px 8px;min-width:0;}' +
      '.tn-stat__num{font-size:1.2rem;}' +
      '.tn-stat__label{font-size:.74rem;}' +
      '.tn-grid--tutors{grid-template-columns:repeat(auto-fill,minmax(150px,1fr)) !important;gap:10px !important;}' +
      '.tn-card{min-width:0;max-width:100%;}' +
      '.tn-card--post{padding:12px 12px 0;}' +
      '.tnp-foot{flex-wrap:wrap;gap:8px;margin:12px -12px 0;padding:10px 12px;}' +
      '.tnp-salary{font-size:.9rem;}' +
      '.tnp-actions{width:100%;justify-content:stretch;}' +
      '.tnp-actions .tn-btn{flex:1;}' +
      '.tn-form-card{padding:16px 14px;}' +
      '.tn-dash__panel{padding:16px 14px;max-width:100%;}' +
      '.tn-section{padding:24px 0 20px;}' +
      '.tn-section__head{flex-wrap:wrap;gap:8px;}' +
      '.tn-table{font-size:.78rem;}' +
      '.tn-toast{max-width:88vw;}' +
      '.tn-contact-pop{padding:12px;}' +
      '.tn-contact-pop__box{padding:16px;border-radius:12px;max-width:100%;}' +
      '.tn-finders{max-width:100%;}' +
      '.tn-toolbar__right{width:100%;}' +
    '}' +
    '@media (max-width:360px){' +
      '.tn-container{padding:0 10px;}' +
      '.tn-grid--tutors{grid-template-columns:1fr !important;}' +
      '.tn-stats{grid-template-columns:1fr 1fr;}' +
    '}';
  document.head.appendChild(css);

  /* ---------- ২) ফর্ম লেবেল: ঠিকানা পাবলিক / মোবাইল প্রাইভেট ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var la = document.querySelector('label[for="pAddress"]');
    if (la) la.textContent = 'ঠিকানা (পোস্টে পাবলিক দেখাবে)';
    var lc = document.querySelector('label[for="pContact"]');
    if (lc) lc.textContent = 'মোবাইল (প্রাইভেট — শুধু অ্যাডমিন দেখবে)';
  });

  /* ---------- ৩) কন্টাক্ট পপআপ (শুধু অ্যাডমিন) ---------- */
  function contactPopup(title, phone, address) {
    var old = document.querySelector('.tn-contact-pop');
    if (old) old.remove();
    var pop = document.createElement('div');
    pop.className = 'tn-contact-pop';
    pop.innerHTML =
      '<div class="tn-contact-pop__box">' +
        '<h4>' + esc(title) + '</h4>' +
        (phone ? '<div class="tn-contact-pop__row"><span>📱</span><a href="tel:' + esc(phone) + '">' + esc(phone) + '</a></div>' : '') +
        (address ? '<div class="tn-contact-pop__row"><span>🏠</span>' + esc(address) + '</div>' : '') +
        '<div class="tn-contact-pop__note">🔒 মোবাইল নম্বর প্রাইভেট — শুধু অ্যাডমিন দেখতে পারে।</div>' +
        '<button class="tn-btn tn-btn--ghost tn-btn--sm tn-contact-pop__close" type="button">বন্ধ করুন</button>' +
      '</div>';
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) {
      if (e.target === pop || (e.target.closest && e.target.closest('.tn-contact-pop__close'))) pop.remove();
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-tn-contact]') : null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var pid = btn.getAttribute('data-tn-contact');
    btn.disabled = true;
    TD._db().then(function (d) {
      return d.from('tuition_posts').select('id,title,address,contact_phone').eq('id', pid).maybeSingle();
    }).then(function (r) {
      btn.disabled = false;
      if (r.error || !r.data) { contactPopup('কন্টাক্ট পাওয়া যায়নি', '', ''); return; }
      contactPopup(r.data.title || 'পোস্ট', r.data.contact_phone || '', r.data.address || '');
    }).catch(function () { btn.disabled = false; });
  });

  /* ---------- ৪) নতুন পোস্ট কার্ড রেন্ডারার ---------- */
  function postCardHTML(p) {
    return '<article class="tn-card tn-card--post" data-tn-pid="' + esc(p.id) + '">' +
      '<div class="tnp-strip">' +
        '<span class="tnp-cat">' + esc(p.category ? p.category : 'টিউশন') + '</span>' +
        (p.verifiedOnly ? '<span class="tnp-vonly">✓ শুধু ভেরিফায়েড</span>' : '') +
      '</div>' +
      '<h3 class="tnp-title">' + esc(p.title) + '</h3>' +
      '<div class="tnp-rows" data-tn-rows>' +
        (p.classLevel ? '<div class="tnp-row"><span class="tnp-ic">🎓</span><b>ক্লাস: ' + esc(p.classLevel) + '</b></div>' : '') +
        (p.medium ? '<div class="tnp-row"><span class="tnp-ic">📖</span><b>মাধ্যম: ' + esc(p.medium) + '</b></div>' : '') +
        (p.area ? '<div class="tnp-row"><span class="tnp-ic">📍</span><b>এলাকা: ' + esc(p.area) + '</b></div>' : '') +
        (p.days ? '<div class="tnp-row"><span class="tnp-ic">📅</span><b>সপ্তাহে ' + bn(p.days) + ' দিন</b></div>' : '') +
      '</div>' +
      (p.subjects ? '<div class="tnp-chips">' + chipsHTML(p.subjects, 4) + '</div>' : '') +
      (p.description ? '<p class="tnp-desc">' + esc(p.description.slice(0, 130)) + '</p>' : '') +
      '<div class="tnp-foot">' +
        '<span class="tnp-salary">' + salaryText(p.salary) + '</span>' +
        '<div class="tnp-actions">' +
          '<button class="tn-btn tn-btn--primary tn-btn--sm" data-tn-apply="' + esc(p.id) + '" type="button">আবেদন করুন</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  TD.renderPostCards = function (containerId, posts) {
    var el = document.getElementById(containerId);
    if (!el) return;
    posts = posts || [];
    if (!posts.length) {
      el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__icon">📭</div><div class="tn-empty__title">এখনো কোনো পোস্ট নেই</div><p>প্রথম পোস্টটি আপনিই দিন!</p></div>';
      return;
    }
    el.innerHTML = posts.map(postCardHTML).join('');
    var ids = posts.map(function (p) { return p.id; }).filter(Boolean);
    if (!ids.length) return;
    TD._db().then(function (d) {
      return fetchPostExtras(d, ids);
    }).then(function (res) {
      if (!res.rows.length) return;
      var byId = {};
      res.rows.forEach(function (row) { byId[row.id] = row; });
      var contactCol = res.contactCol;
      isAdminP().then(function (admin) {
        el.querySelectorAll('.tn-card--post').forEach(function (card) {
          var pid = card.getAttribute('data-tn-pid');
          var row = byId[pid];
          if (!row) return;
          if (row.address) {
            var rows = card.querySelector('[data-tn-rows]');
            if (rows && !card.querySelector('.tn-card__addr')) {
              var addr = document.createElement('div');
              addr.className = 'tnp-row tn-card__addr';
              addr.innerHTML = '<span class="tnp-ic">🏠</span><b>ঠিকানা: ' + esc(row.address) + '</b>';
              rows.appendChild(addr);
            }
          }
          if (admin && contactCol && row[contactCol]) {
            var acts = card.querySelector('.tnp-actions');
            var applyBtn = card.querySelector('[data-tn-apply]');
            if (acts && applyBtn && !card.querySelector('[data-tn-contact]')) {
              var cb = document.createElement('button');
              cb.className = 'tn-btn tn-btn--ghost tn-btn--sm';
              cb.type = 'button';
              cb.setAttribute('data-tn-contact', pid);
              cb.textContent = '📞 কন্টাক্ট';
              acts.insertBefore(cb, applyBtn);
            }
          }
        });
      });
    }).catch(function () {});
  };

  /* ---------- ৫) কমপ্যাক্ট টিউটর কার্ড রেন্ডারার ---------- */
  TD.renderTutorCards = function (containerId, tutors) {
    var el = document.getElementById(containerId);
    if (!el) return;
    tutors = tutors || [];
    if (!tutors.length) {
      el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__icon">👩‍🏫</div><div class="tn-empty__title">এখনো কোনো ভেরিফায়েড টিউটর নেই</div><p>টিউটররা ভেরিফিকেশনের অপেক্ষায় আছেন।</p></div>';
      return;
    }
    el.innerHTML = tutors.map(function (t) {
      return '<article class="tn-card tn-card--tutor">' +
        '<div class="tnt-head">' +
          '<div class="tnt-av">🎓</div>' +
          '<div class="tnt-info">' +
            '<h4 class="tnt-name">' + esc(t.fullName) + ' <span class="tn-verified-tick" title="ভেরিফায়েড">✓</span></h4>' +
            '<div class="tnt-inst">' + esc(t.institution || '') + '</div>' +
          '</div>' +
          (t.featured ? '<span class="tnt-star" title="ফিচার্ড">⭐</span>' : '') +
        '</div>' +
        (t.subjects ? '<div class="tnp-chips">' + chipsHTML(t.subjects, 3) + '</div>' : '') +
        '<div class="tnt-meta">' +
          (t.experience ? '<span>⏳ ' + bn(t.experience) + ' বছর</span>' : '') +
          (t.areas ? '<span>📍 ' + esc(String(t.areas).slice(0, 36)) + '</span>' : '') +
        '</div>' +
      '</article>';
    }).join('');
  };

  /* ---------- ৬) অ্যাডমিন মডারেশন টেবিল: ঠিকানা+মোবাইল কলাম ---------- */
  var enhanceQueued = false;
  function enhanceAdminTables() {
    enhanceQueued = false;
    isAdminP().then(function (admin) {
      if (!admin) return;
      var pbtns = document.querySelectorAll('[data-pact]:not([data-tn-seen])');
      var prows = [];
      pbtns.forEach(function (b) {
        b.setAttribute('data-tn-seen', '1');
        var tr = b.closest ? b.closest('tr') : null;
        if (tr) prows.push({ id: b.getAttribute('data-pid'), tr: tr });
      });
      if (prows.length) {
        TD._db().then(function (d) {
          return fetchPostExtras(d, prows.map(function (x) { return x.id; }));
        }).then(function (res) {
          if (!res.rows.length) return;
          var byId = {};
          res.rows.forEach(function (row) { byId[row.id] = row; });
          prows.forEach(function (x) {
            var row = byId[x.id];
            if (!row || !x.tr || x.tr.getAttribute('data-tn-done')) return;
            x.tr.setAttribute('data-tn-done', '1');
            var td = document.createElement('td');
            td.style.maxWidth = '190px';
            td.style.fontSize = '.78rem';
            td.innerHTML =
              ((res.contactCol && row[res.contactCol]) ? '📞 <a href="tel:' + esc(row[res.contactCol]) + '">' + esc(row[res.contactCol]) + '</a><br>' : '') +
              (row.address ? '🏠 ' + esc(row.address) : '');
            x.tr.appendChild(td);
          });
        }).catch(function () {});
      }
      var vbtns = document.querySelectorAll('[data-vact="verify"]:not([data-tn-seen])');
      var vrows = [];
      vbtns.forEach(function (b) {
        b.setAttribute('data-tn-seen', '1');
        var tr = b.closest ? b.closest('tr') : null;
        if (tr) vrows.push({ id: b.getAttribute('data-tid'), tr: tr });
      });
      if (vrows.length) {
        TD._db().then(function (d) {
          return d.from('tutor_profiles').select('id,phone').in('id', vrows.map(function (x) { return x.id; }));
        }).then(function (r) {
          if (r.error || !r.data) return;
          var byId = {};
          r.data.forEach(function (row) { byId[row.id] = row; });
          vrows.forEach(function (x) {
            var row = byId[x.id];
            if (!row || !row.phone || !x.tr || x.tr.getAttribute('data-tn-done')) return;
            x.tr.setAttribute('data-tn-done', '1');
            var td = document.createElement('td');
            td.innerHTML = '📞 <a href="tel:' + esc(row.phone) + '">' + esc(row.phone) + '</a>';
            x.tr.appendChild(td);
          });
        }).catch(function () {});
      }
    }).catch(function () {});
  }
  function queueEnhance() {
    if (enhanceQueued) return;
    enhanceQueued = true;
    setTimeout(enhanceAdminTables, 400);
  }
  if ('MutationObserver' in window) {
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) { queueEnhance(); return; }
      }
    });
    document.addEventListener('DOMContentLoaded', function () {
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  /* ---------- ৭) createPost: contact_phone কলাম ফিক্স ---------- */
  TD.createPost = function (data) {
    return H.session().then(function (me) {
      if (!me) throw new Error('লগইন করুন');
      return TD._db().then(function (d) {
        function payload(col) {
          var p = {
            title: data.title,
            category: data.category,
            class_level: data.classLevel,
            subjects: data.subjects,
            medium: data.medium,
            area: data.area,
            days: data.days,
            salary: data.salary,
            verified_only: data.verifiedOnly,
            description: data.description,
            address: data.address,
            status: 'pending',
            created_by: me.id
          };
          if (col) p[col] = data.contact;
          return p;
        }
        return d.from('tuition_posts').insert(payload('contact_phone')).then(function (r) {
          if (r.error && /contact_phone/.test(r.message || '')) {
            return d.from('tuition_posts').insert(payload('contact')).then(function (r2) {
              if (r2.error) throw r2.error;
              return r2.data;
            });
          }
          if (r.error) throw r.error;
          return r.data;
        });
      });
    });
  };

  /* ---------- ৮) বাইরে-ক্লিক / Esc → সব মেনু-প্যানেল-পপআপ বন্ধ ---------- */
  function closeOverlays(target) {
    function outside(sel) {
      return !(target && target.closest && target.closest(sel));
    }
    var nav = document.getElementById('tnNav');
    if (nav && nav.classList.contains('is-open') && outside('#tnNav') && outside('#tnNavToggle')) {
      nav.classList.remove('is-open');
    }
    if (outside('.tn-profile-menu')) {
      document.querySelectorAll('.tn-profile-dropdown.is-open').forEach(function (dd) { dd.classList.remove('is-open'); });
    }
    if (outside('.tn-bell')) {
      document.querySelectorAll('.tn-notif-panel.is-open').forEach(function (p) { p.classList.remove('is-open'); });
    }
    if (outside('.tn-contact-pop__box')) {
      document.querySelectorAll('.tn-contact-pop').forEach(function (p) { p.remove(); });
    }
  }
  document.addEventListener('click', function (e) {
    closeOverlays(e.target);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOverlays(null);
  });
})();
