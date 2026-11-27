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
      q: window.tnFinderSeedQuery || ($('fCategory') && '') || '',
      category: ($('fCategory') || {}).value || '',
      classLevel: ($('fClass') || {}).value || '',
      subject: ($('fSubject') || {}).value || '',
      minSalary: ($('fSalary') || {}).value || '',
      verifiedOnly: !!($('fVerifiedOnly') || {}).checked,
      sort: ($('fSort') || {}).value || 'newest'
    };
  }

  function loadFinder(reset) {
    if (reset) { finderState.page = 0; }
    var f = finderFilters();
    var countEl = $('fCount'), grid = $('fResults');
    if (reset && grid) grid.innerHTML =
      '<div class="tn-skel"><div class="tn-skel__bar tn-skel__bar--title"></div><div class="tn-skel__bar"></div><div class="tn-skel__bar tn-skel__bar--md"></div></div>' +
      '<div class="tn-skel"><div class="tn-skel__bar tn-skel__bar--title"></div><div class="tn-skel__bar"></div><div class="tn-skel__bar tn-skel__bar--md"></div></div>' +
      '<div class="tn-skel"><div class="tn-skel__bar tn-skel__bar--title"></div><div class="tn-skel__bar"></div><div class="tn-skel__bar tn-skel__bar--md"></div></div>';
    if (countEl) countEl.textContent = 'লোড হচ্ছে…';
    // free-text seed on first open (from hero search)
    if (window.tnFinderSeedQuery) {
      if ($('fSubject')) { $('fSubject').value = ''; }
      f.q = window.tnFinderSeedQuery;
    }
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
    }).catch(function (e) {
      if (countEl) countEl.textContent = 'টিউটর লোড করা যায়নি';
    });
  }

  /* =========================================================
     POST FORM — validation + moderation-aware submit
     ========================================================= */
  function initPostForm() {
    var form = $('postForm');
    if (!form) return;
    // auth gate
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
          '✅ পোস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন অনুমোদনের পর সবার কাছে দেখা যাবে (মডারেশন সচেতন — আপনার ঠিকানা/ফোন প্রাইভেট থাকবে)।',
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
      window.tnFinderSeedQuery = window.tnFinderSeedQuery || '';
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
    // finder filter controls
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
