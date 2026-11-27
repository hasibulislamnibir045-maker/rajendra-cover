/* =============================================================
   tuition-app.js — Tuition Hub Premium (single coherent layer)
   Tuition marketplace UI: Home, Finder, Tutors, Post, Become-Tutor,
   application flow. Depends on: hubdb.js, tuition-data.js, tuition.css
   ============================================================= */
(function () {
  var TD = window.TuitionData;
  var H = window.HUBDB;
  if (!TD) { console.error('tuition-app: tuition-data.js load hoy ni'); return; }

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; }); }
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

  /* ---------- verified badge (Facebook-style, admin-approved only) ---------- */
  var VERIFIED_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4 10-10"/></svg>';
  function verifiedBadgeHTML() {
    return '<span class="tn-verified-badge" role="img" aria-label="ভেরিফায়েড">' + VERIFIED_SVG + '</span>';
  }
  function timeAgo(iso) {
    if (!iso) return '';
    var d = new Date(iso), now = new Date();
    var s = Math.floor((now - d) / 1000);
    if (s < 60) return 'এইমাত্র';
    var m = Math.floor(s / 60);
    if (m < 60) return bn(m) + ' মিনিট আগে';
    var h = Math.floor(m / 60);
    if (h < 24) return bn(h) + ' ঘণ্টা আগে';
    var dd = Math.floor(h / 24);
    if (dd < 30) return bn(dd) + ' দিন আগে';
    return d.toLocaleDateString('bn-BD');
  }
  function postID(id) { return id ? 'TH-' + String(id).slice(0, 8).toUpperCase() : ''; }

  /* ---------- admin check / data helpers ---------- */
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
  function fetchApplicantCounts(d, ids) {
    return d.from('tuition_applications').select('tuition_post_id').in('tuition_post_id', ids)
      .then(function (r) {
        if (r.error) return {};
        var map = {};
        (r.data || []).forEach(function (row) {
          map[row.tuition_post_id] = (map[row.tuition_post_id] || 0) + 1;
        });
        return map;
      }).catch(function () { return {}; });
  }

  /* =========================================================
     FINDER
     ========================================================= */
  var finderState = { loaded: false, all: [], page: 0, pageSize: 9 };

  function finderFilters() {
    var hf = window.tnHeroFilters || {};
    return {
      q: window.tnFinderSeedQuery || '',
      category: ($('fCategory') || {}).value || '',
      classLevel: ($('fClass') || {}).value || hf.classLevel || '',
      subject: ($('fSubject') || {}).value || hf.subject || '',
      minSalary: ($('fSalary') || {}).value || '',
      verifiedOnly: !!($('fVerifiedOnly') || {}).checked,
      sort: ($('fSort') || {}).value || 'newest',
      area: hf.area || ''
    };
  }

  function loadFinder(reset) {
    if (reset) { finderState.page = 0; window.tnHeroFilters = {}; }
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
      if (countEl) countEl.textContent = 'মোট ' + bn(finderState.all.length) + ' টি পোস্ট পাওয়া গেছে';
      var moreWrap = $('fLoadMoreWrap');
      if (moreWrap) moreWrap.classList.toggle('tn-hidden', finderState.all.length <= finderState.pageSize);
      var btn = $('fLoadMore');
      if (btn) btn.onclick = function () {
        finderState.page++;
        var next = finderState.all.slice(0, (finderState.page + 1) * finderState.pageSize);
        TD.renderPostCards('fResults', next);
        if (next.length >= finderState.all.length && moreWrap) moreWrap.classList.add('tn-hidden');
      };
    }).catch(function (e) {
      if (countEl) countEl.textContent = 'পোস্ট লোড করা যায়নি';
      if (grid) grid.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__title">লোড করা যায়নি</div><p>' + esc(e.message || '') + '</p></div>';
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
      if (countEl) countEl.textContent = 'মোট ' + bn(tutorsState.all.length) + ' জন ভেরিফায়েড টিউটর';
    }).catch(function () {
      if (countEl) countEl.textContent = 'টিউটর লোড করা যায়নি';
    });
  }

  /* =========================================================
     POST FORM
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
        area: $('pArea').value.trim(),
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
          'পোস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন অনুমোদনের পর সবার কাছে দেখা যাবে — ঠিকানা পোস্টে দেখা যাবে, তবে মোবাইল প্রাইভেট থাকবে (শুধু অ্যাডমিন দেখবে)।',
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
     BECOME TUTOR
     ========================================================= */
  function initTutorForm() {
    var form = $('tutorForm');
    if (!form) return;
    var fileInput = $('tuFile'), uploadBox = $('tuUpload'), chosenFile = null;

    uploadBox.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      chosenFile = fileInput.files[0] || null;
      $('tuFileName').textContent = chosenFile ? chosenFile.name : '';
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
          $('tuFileName').textContent = chosenFile.name;
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
          'রেজিস্ট্রেশন সফল! আপনার ডকুমেন্ট প্রাইভেট বাকেটে সংরক্ষিত — অ্যাডমিন যাচাই করলে নীল ভেরিফায়েড ব্যাজ পাবেন।',
          'success');
        toast('টিউটর রেজিস্ট্রেশন জমা হয়েছে', 'success');
      }).catch(function (e2) {
        btn.disabled = false; btn.textContent = 'রেজিস্টার করুন';
        if (String(e2.message || '').indexOf('লগইন') >= 0) {
          $('tutorAuthGate')?.classList.remove('tn-hidden');
          showResult($('tutorResult'), 'রেজিস্ট্রেশন করতে আগে লগইন করুন।', 'warn');
        } else {
          showResult($('tutorResult'), 'রেজিস্ট্রেশন করা যায়নি: ' + (e2.message || 'অজানা ত্রুটি'), 'danger');
        }
      });
    });
  }

  /* =========================================================
     APPLICATION FLOW
     ========================================================= */
  function initApplicationFlow() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tn-apply]');
      if (!btn) return;
      e.preventDefault();
      var postId = btn.getAttribute('data-tn-apply');
      btn.disabled = true; btn.textContent = 'আবেদন হচ্ছে…';
      TD.applyToPost(postId).then(function () {
        btn.textContent = 'আবেদন হয়েছে';
        toast('আবেদন সফল! পোস্ট মালিককে নোটিফিকেশন গেছে।', 'success');
        TD.refreshBellDot();
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = 'আবেদন করুন';
        toast(err.message || 'আবেদন করা যায়নি', 'error');
      });
    });
  }

  /* =========================================================
     BOOKMARK FLOW (saved_tuition_posts)
     ========================================================= */
  function initBookmarkFlow() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tn-bookmark]');
      if (!btn) return;
      e.preventDefault();
      var pid = btn.getAttribute('data-tn-bookmark');
      var isSaved = btn.classList.contains('is-saved');
      H.session().then(function (me) {
        if (!me) { toast('সেভ করতে আগে লগইন করুন', 'error'); return; }
        TD._db().then(function (d) {
          if (isSaved) {
            return d.from('saved_tuition_posts').delete().eq('user_id', me.id).eq('tuition_post_id', pid)
              .then(function (r) { if (!r.error) { btn.classList.remove('is-saved'); toast('সেভ থেকে সরানো হয়েছে'); } });
          }
          return d.from('saved_tuition_posts').insert({ user_id: me.id, tuition_post_id: pid })
            .then(function (r) {
              if (r.error && /duplicate|unique/i.test(r.message || '')) { btn.classList.add('is-saved'); toast('আগেই সেভ করা আছে'); return; }
              if (!r.error) { btn.classList.add('is-saved'); toast('পোস্ট সেভ হয়েছে', 'success'); }
            });
        });
      });
    });
  }

  /* =========================================================
     CONTACT POPUP (admin-only)
     ========================================================= */
  function contactPopup(title, phone, address) {
    var old = document.querySelector('.tn-contact-pop');
    if (old) old.remove();
    var pop = document.createElement('div');
    pop.className = 'tn-contact-pop';
    pop.innerHTML =
      '<div class="tn-contact-pop__box">' +
        '<h4>' + esc(title) + '</h4>' +
        (phone ? '<div class="tn-contact-pop__row"><span>📞</span><a href="tel:' + esc(phone) + '">' + esc(phone) + '</a></div>' : '') +
        (address ? '<div class="tn-contact-pop__row"><span>🏠</span>' + esc(address) + '</div>' : '') +
        '<div class="tn-contact-pop__note">মোবাইল নম্বর প্রাইভেট — শুধু অ্যাডমিন দেখতে পারে।</div>' +
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

  /* =========================================================
     PREMIUM CARD RENDERERS (Lucide icons, reference layout)
     ========================================================= */
  var ICONS = {
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="m5 13 4 4 10-10"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    /* study illustration (per reference: ruler + stacked books) */
    illus: '<svg viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="55" r="52" fill="#EFF4FF"/>' +
      '<path d="M22 78 44 20l14 5-22 58z" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>' +
      '<path d="M38 25l3 1-3 8 3 1" stroke="#B45309" stroke-width="1.2"/>' +
      '<path d="M40 82h44a4 4 0 0 0 4-4V62a4 4 0 0 0-4-4H40a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4z" fill="#D1A054" stroke="#B4803C" stroke-width="1.5"/>' +
      '<path d="M36 64h52v3H36z" fill="#EFE3C8"/>' +
      '<path d="M52 56l38 12a4 4 0 0 0 5-2.6l3.6-11.4a4 4 0 0 0-2.5-5L58 38a4 4 0 0 0-5 2.6l-3.6 11.4a4 4 0 0 0 2.6 5z" fill="#0F766E" stroke="#115E59" stroke-width="1.5"/>' +
      '<path d="M56 47l34 11" stroke="#134E4A" stroke-width="1.4"/>' +
      '<path d="M58 44l34 11" stroke="#134E4A" stroke-width="1.4"/>' +
    '</svg>'
  };

  function infoRow(icon, label, value) {
    return '<div class="tn-inforow">' + icon + '<b>' + esc(label) + ': ' + esc(value) + '</b></div>';
  }

  function postCardHTML(p, extra) {
    extra = extra || {};
    var hasSalary = p.salary === 0 || p.salary;
    return '<article class="tn-card tn-card--post">' +
      /* layer 1: strip — pills + heart */
      '<div class="tn-card__strip">' +
        '<div class="tn-card__pills">' +
          (p.verifiedOnly
            ? '<span class="tn-badge tn-badge--verified"><span class="tn-badge__ic">' + ICONS.check + '</span>ভেরিফায়েড</span>'
            : '') +
          (p.classLevel ? '<span class="tn-badge tn-badge--cls">' + esc(p.classLevel) + '</span>' : '') +
          (extra.isNew ? '<span class="tn-badge tn-badge--new">নতুন</span>' : '') +
          (!p.verifiedOnly && p.category ? '<span class="tn-badge tn-badge--cat">' + esc(p.category) + '</span>' : '') +
        '</div>' +
        '<button class="tn-card__bookmark" type="button" data-tn-bookmark="' + esc(p.id) + '" aria-label="প্রিয় হিসেবে সেভ করুন">' + ICONS.heart + '</button>' +
      '</div>' +
      /* layer 2: body — illustration + title + rows */
      '<div class="tn-card__body">' +
        '<div class="tn-illus">' + ICONS.illus + '</div>' +
        '<div class="tn-card__main">' +
          '<h3 class="tn-card__title">' + esc(p.title) + '</h3>' +
          '<div class="tn-card__rows" data-tn-rows>' +
            (p.classLevel ? infoRow(ICONS.cap, 'ক্লাস', p.classLevel) : '') +
            (p.medium ? infoRow(ICONS.book, 'মাধ্যম', p.medium) : '') +
            (p.subjects ? infoRow(ICONS.book, 'বিষয়', String(p.subjects).split(/[,،]/)[0].trim()) : '') +
            (p.days ? infoRow(ICONS.cal, 'সপ্তাহে', p.days + ' দিন') : '') +
            (p.area ? infoRow(ICONS.pin, 'লোকেশন', p.area) : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      /* layer 3: salary band */
      '<div class="tn-card__band">' +
        '<div class="tn-card__salary">' +
          (hasSalary
            ? '<b>৳ ' + bn(p.salary) + '</b><span>/ মাস</span>'
            : '<b>আলোচনাসাপেক্ষ</b>') +
        '</div>' +
        '<div class="tn-card__actions">' +
          '<button class="tn-btn-apply" data-tn-apply="' + esc(p.id) + '" type="button">আবেদন করুন ' + ICONS.arrow + '</button>' +
        '</div>' +
      '</div>' +
      /* layer 4: meta strip */
      '<div class="tn-card__meta">' +
        '<span>' + ICONS.clock + timeAgo(p.createdAt) + '</span>' +
        '<span>' + ICONS.users + bn(extra.applicants || 0) + ' জন আবেদন করছেন</span>' +
        '<span>' + postID(p.id) + '</span>' +
      '</div>' +
    '</article>';
  }

  TD.renderPostCards = function (containerId, posts) {
    var el = document.getElementById(containerId);
    if (!el) return;
    posts = posts || [];
    if (!posts.length) {
      el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__title">এখনো কোনো পোস্ট নেই</div><p>প্রথম পোস্টটি আপনিই দিন!</p></div>';
      return;
    }
    var ids = posts.map(function (p) { return p.id; }).filter(Boolean);
    var now = Date.now();
    el.innerHTML = posts.map(function (p) {
      return postCardHTML(p, { isNew: p.createdAt && (now - new Date(p.createdAt).getTime()) < 3 * 864e5 });
    }).join('');
    if (!ids.length) return;

    Promise.all([
      TD._db().then(function (d) { return fetchPostExtras(d, ids); }),
      TD._db().then(function (d) { return fetchApplicantCounts(d, ids); }),
      isAdminP()
    ]).then(function (res) {
      var extras = res[0], counts = res[1], admin = res[2];
      var byId = {};
      (extras.rows || []).forEach(function (row) { byId[row.id] = row; });
      var contactCol = extras.contactCol;
      el.querySelectorAll('.tn-card--post').forEach(function (card) {
        var applyBtn = card.querySelector('[data-tn-apply]');
        if (!applyBtn) return;
        var pid = applyBtn.getAttribute('data-tn-apply');
        var row = byId[pid];
        /* applicant count */
        var meta = card.querySelector('.tn-card__meta');
        if (meta && counts && counts[pid] !== undefined) {
          var cntEl = meta.children[1];
          if (cntEl) cntEl.innerHTML = ICONS.users + bn(counts[pid]) + ' জন আবেদন করছেন';
        }
        /* address (public) */
        if (row && row.address) {
          var rows = card.querySelector('[data-tn-rows]');
          if (rows && !card.querySelector('.tn-card__addr')) {
            var addr = document.createElement('div');
            addr.className = 'tn-inforow tn-inforow--wide tn-card__addr';
            addr.innerHTML = ICONS.home + '<b>ঠিকানা: ' + esc(row.address) + '</b>';
            rows.appendChild(addr);
          }
        }
        /* admin contact button */
        if (admin && row && contactCol && row[contactCol]) {
          var acts = card.querySelector('.tn-card__actions');
          if (acts && !card.querySelector('[data-tn-contact]')) {
            var cb = document.createElement('button');
            cb.className = 'tn-btn tn-btn--ghost tn-btn--sm';
            cb.type = 'button';
            cb.setAttribute('data-tn-contact', pid);
            cb.textContent = 'কন্টাক্ট';
            acts.insertBefore(cb, applyBtn);
          }
        }
      });
    }).catch(function () {});
  };

  TD.renderTutorCards = function (containerId, tutors) {
    var el = document.getElementById(containerId);
    if (!el) return;
    tutors = tutors || [];
    if (!tutors.length) {
      el.innerHTML = '<div class="tn-empty" style="grid-column:1/-1"><div class="tn-empty__title">এখনো কোনো ভেরিফায়েড টিউটর নেই</div><p>টিউটররা ভেরিফিকেশনের অপেক্ষায় আছেন।</p></div>';
      return;
    }
    el.innerHTML = tutors.map(function (t) {
      var isVerified = t.verificationStatus === 'verified' || t.verification_status === 'verified';
      var name = t.fullName || t.full_name || '';
      var inst = t.institution || '';
      var subjects = t.subjects || '';
      var initials = name ? name.replace(/^(মোঃ|মো\.|ড়্\.)\s*/i, '').trim().charAt(0).toUpperCase() : 'T';
      return '<article class="tn-card tn-card--tutor">' +
        '<div class="tnt-head">' +
          '<div class="tnt-av">' + esc(initials) + '</div>' +
          '<div class="tnt-info">' +
            '<h4 class="tnt-name"><span class="tnt-nametext">' + esc(name) + '</span>' + (isVerified ? verifiedBadgeHTML() : '') + '</h4>' +
            '<div class="tnt-inst">' + esc(inst) + '</div>' +
          '</div>' +
        '</div>' +
        (subjects ? '<div class="tn-card__chips">' +
          subjects.split(/[,،]/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3)
            .map(function (s) { return '<span class="tn-chip">' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="tnt-meta">' +
          (t.experience ? '<span>' + ICONS.clock + bn(t.experience) + ' বছর অভিজ্ঞতা</span>' : '') +
          (t.areas ? '<span>' + ICONS.pin + esc(String(t.areas).slice(0, 30)) + '</span>' : '') +
        '</div>' +
      '</article>';
    }).join('');
  };

  /* =========================================================
     createPost wrap: correct contact column
     ========================================================= */
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

  /* =========================================================
     VIEW ROUTING + INIT
     ========================================================= */
  function onView(view) {
    if (view === 'finder') loadFinder(true);
    else if (view === 'tutors') loadTutors();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPostForm();
    initTutorForm();
    initApplicationFlow();
    initBookmarkFlow();
    window.addEventListener('tn:viewchange', function (e) { onView(e.detail.view); });
    $('fApply')?.addEventListener('click', function () { loadFinder(true); });
    $('fReset')?.addEventListener('click', function () {
      ['fCategory', 'fClass', 'fSubject', 'fSalary'].forEach(function (id) { if ($(id)) $(id).value = ''; });
      if ($('fVerifiedOnly')) $('fVerifiedOnly').checked = false;
      window.tnFinderSeedQuery = '';
      window.tnHeroFilters = {};
      loadFinder(true);
    });
    $('fSort')?.addEventListener('change', function () { loadFinder(true); });
    $('tSearch')?.addEventListener('input', function (e) {
      var term = e.target.value.trim();
      TD.searchTutors(term, 24).then(function (ts) { TD.renderTutorCards('tResults', ts); });
    });
  });

  /* =========================================================
     OUTSIDE-CLICK / ESC → close menus, dropdowns, panels, popups
     ========================================================= */
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
