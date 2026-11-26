/* ===== Hut CV Generator: 2 template, photo, add-more rows, multi-page PDF. app.js-er PORE load hoy ===== */
(function () {
  var KEY = 'rsh_cv2'; /* purono Student Hub-er same key — portokker save data ekhaneo cholbe */
  var COLORS = { gov: '#0b3d8f', corp: '#0f2e55' };
  var MEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var LISTS = {
    edu: ['Education', '🎓', ['Degree', 'Institution', 'Passing year', 'Result'], '+ Education যোগ করুন'],
    exp: ['Experience', '💼', ['Position', 'Organization', 'Period (2023 – Present)'], '+ Experience যোগ করুন'],
    skl: ['Skills', '💻', ['Skill'], '+ Skill যোগ করুন'],
    trn: ['Training / Certificate', '🏅', ['Training / Certificate', 'Institute / Year'], '+ Training যোগ করুন'],
    qlt: ['Personal Qualities', '⭐', ['Quality'], '+ Quality যোগ করুন'],
    lng: ['Languages', '🗣', ['Language', 'Level'], '+ Language যোগ করুন'],
    pi: ['Extra Personal Info', '👤', ['Label (Religion, Nationality...)', 'Value'], '+ Info যোগ করুন'],
    extra: ['Extra Sections', '📌', ['Section title', 'Details (প্রতি লাইনে একটি)'], '+ নতুন Section যোগ করুন']
  };
  var ORDER = ['edu', 'exp', 'skl', 'trn', 'qlt', 'lng', 'pi', 'extra'];
  var PF = [['name', 'Full name'], ['title', 'Title / Tagline (Corporate)'], ['subtitle', 'Subtitle (Govt, ঐচ্ছিক)'], ['father', "Father's name"], ['mother', "Mother's name"],
    ['dob', 'Date of birth'], ['nid', 'National ID'], ['mobile', 'Mobile'], ['email', 'Email'], ['pres', 'Present address'], ['perm', 'Permanent address'],
    ['linkedin', 'LinkedIn'], ['web', 'Website']];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { var d = new Date(); return d.getDate() + ' ' + MEN[d.getMonth()] + ' ' + d.getFullYear(); }
  function ld(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function row(k) { return new Array(LISTS[k][2].length).fill(''); }
  function fresh() {
    var s = { v: 2, tpl: 'gov', color: COLORS.gov, photo: '', subtitle: '', about: '', place: '', date: today(),
      decl: 'I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.' };
    PF.forEach(function (f) { if (s[f[0]] == null) s[f[0]] = ''; });
    var n = { edu: 3, exp: 2, skl: 4, trn: 2, qlt: 4, lng: 2, pi: 1, extra: 0 };
    ORDER.forEach(function (k) { s[k] = []; for (var i = 0; i < n[k]; i++) s[k].push(row(k)); });
    return s;
  }
  var S = (function () { var o = ld(KEY, null); return o && o.tpl ? o : fresh(); })();
  function save() { sv(KEY, S); }

  function fld(l, k, type) { return '<div><label>' + l + '</label><input data-f="' + k + '" type="' + (type || 'text') + '" value="' + esc(S[k] || '') + '"></div>'; }
  function listUI(k) {
    var L = LISTS[k], h = '<h3>' + L[1] + ' ' + L[0] + '</h3>';
    S[k].forEach(function (r, i) {
      h += '<div class="rowbox"><button class="rm" data-rm="' + k + ',' + i + '">✕</button>';
      if (k === 'extra') h += '<input data-l="extra" data-i="' + i + '" data-c="0" placeholder="' + L[2][0] + '" value="' + esc(r[0]) + '" style="width:calc(100% - 44px)"><textarea data-l="extra" data-i="' + i + '" data-c="1" placeholder="' + L[2][1] + '" style="margin-top:4px;min-height:64px">' + esc(r[1]) + '</textarea>';
      else {
        h += '<div class="' + (L[2].length > 1 ? 'r2' : '') + '" style="' + (L[2].length === 1 ? 'width:calc(100% - 44px)' : 'width:calc(100% - 44px)' + '">') + '';
        L[2].forEach(function (p, c) { h += '<input data-l="' + k + '" data-i="' + i + '" data-c="' + c + '" placeholder="' + p + '" value="' + esc(r[c] || '') + '">'; });
        h += '</div>';
      }
      h += '</div>';
    });
    return h + '<button class="btn gh addb" data-add="' + k + '">' + L[3] + '</button>';
  }
  function formUI() {
    return '<p style="color:var(--muted);font-size:12.5px;margin:2px 0 8px">Template বেছে নিন, তথ্য দিন। যত ইচ্ছা Education / Experience / Skill / নতুন Section যোগ করে CV বড় করতে পারবেন। ফাঁকা ঘর CV-তে আসবে না। তথ্য শুধু আপনার ফোনে সেভ থাকে।</p>' +
      '<div class="cvpick"><button data-tpl="gov" class="' + (S.tpl === 'gov' ? 'on' : '') + '">🏛 Government Job CV</button><button data-tpl="corp" class="' + (S.tpl === 'corp' ? 'on' : '') + '">💼 Corporate Job CV</button></div>' +
      '<div class="r2"><div><label>Colour</label><input type="color" data-f="color" value="' + S.color + '"></div><div><label>Photo</label><input type="file" id="cvph" accept="image/*"></div></div>' +
      '<button class="btn" data-dl="1">⬇ Download CV (PDF)</button><div class="r2"><button class="btn gh" data-sample="1">নমুনা তথ্য দিন</button><button class="btn gh" data-clear="1">সব মুছুন</button></div>' +
      '<h3>👤 Personal</h3><div class="r2">' + PF.map(function (f) { return fld(f[1], f[0]); }).join('') + '</div>' +
      '<label>Objective / About me</label><textarea data-f="about" style="min-height:70px">' + esc(S.about) + '</textarea>' +
      ORDER.map(listUI).join('') +
      '<h3>✍ Declaration</h3><textarea data-f="decl" style="min-height:60px">' + esc(S.decl) + '</textarea><div class="r2">' + fld('Place', 'place') + fld('Date', 'date') + '</div>' +
      '<button class="btn" data-dl="1">⬇ Download CV (PDF)</button>';
  }

  /* ---------- PDF download (html2canvas + jsPDF, lazy-load CDN) ---------- */
  function loadLib(u) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = function () { rej(new Error('Library load hoy ni: ' + u)); }; document.head.appendChild(s); }); }
  function shrink(file, cb) {
    var r = new FileReader();
    r.onload = function () { var im = new Image(); im.onload = function () { var m = 520, k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.88)); }; im.src = r.result; };
    r.readAsDataURL(file);
  }
  async function pdf() {
    var btns = document.querySelectorAll('[data-dl]'); btns.forEach(function (b) { b.disabled = true; });
    var h = document.createElement('div');
    h.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff';
    h.innerHTML = window.CVT[S.tpl](S); document.body.appendChild(h);
    try {
      if (!window.jspdf) await loadLib('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js');
      if (!window.html2canvas) await loadLib('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      await document.fonts.ready;
      await Promise.all([].slice.call(h.querySelectorAll('img')).map(function (i) { return i.complete ? 1 : new Promise(function (r) { i.onload = i.onerror = r; }); }));
      var PH = 1123, pages = Math.max(1, Math.ceil((h.firstChild.offsetHeight - 2) / PH));
      var cv = await html2canvas(h.firstChild, { scale: 2, backgroundColor: '#ffffff', useCORS: true, width: 794, height: pages * PH, windowWidth: 794 });
      var P = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), sh = PH * 2;
      for (var p = 0; p < pages; p++) {
        var sl = document.createElement('canvas'); sl.width = cv.width; sl.height = sh;
        var x = sl.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, sl.width, sh); x.drawImage(cv, 0, p * sh, cv.width, sh, 0, 0, cv.width, sh);
        if (p) P.addPage();
        P.addImage(sl.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
      }
      P.save('CV_' + (S.name || 'Student').replace(/[^\w\-]+/g, '_') + '.pdf');
    } catch (e) { toast('CV download হচ্ছে না, ইন্টারনেট চেক করে আবার চেষ্টা করুন'); }
    h.remove(); btns.forEach(function (b) { b.disabled = false; });
  }

  var SAMPLE = function () {
    var s = fresh();
    Object.assign(s, { name: 'Rahim Uddin', title: 'Professional. Dedicated. Results-Driven.', father: 'Md. Abdul Karim', mother: 'Mrs. Rahima Begum', dob: '01 January 2002', nid: '1234567890123',
      mobile: '01712-345678', email: 'rahim@email.com', pres: 'Faridpur Sadar, Faridpur', perm: 'Village: Demo, Post: Faridpur', about: 'A dedicated and enthusiastic student seeking an opportunity to contribute my skills and grow with the organization.' });
    s.edu = [['BA (Hons) in English', 'Govt. Rajendra College, Faridpur', 'Running', ''], ['HSC', 'Faridpur Govt. College', '2024', 'GPA 5.00'], ['SSC', 'Faridpur Zilla School', '2022', 'GPA 5.00']];
    s.exp = [['Part-time Web Developer', 'Freelance', '2024 – Present']];
    s.skl = [['MS Office (Word, Excel, PowerPoint)'], ['Web Design'], ['Graphic Design (Canva)'], ['Communication']];
    s.trn = [['NSDA Level 3 Computer Operation', 'Nagarkanda TTC, 2025']];
    s.qlt = [['Honest'], ['Hardworking'], ['Quick Learner'], ['Team Player']];
    s.lng = [['Bangla', 'Native'], ['English', 'Fluent']];
    return s;
  };

  /* ---------- Hut integration: bottom nav-er "হাবে ফিরুন" button ta ekhon CV kholbe ---------- */
  var first = true;
  window.hutCV = function () {
    openM('<h2>📄 CV Generator</h2><div class="cvf"><div id="cvform">' + formUI() + '</div></div>');
    if (first) { first = false; }
    var f = document.getElementById('cvform');
    f.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.f) S[t.dataset.f] = t.value;
      else if (t.dataset.l) S[t.dataset.l][+t.dataset.i][+t.dataset.c] = t.value;
      else return;
      save();
    });
    f.addEventListener('change', function (e) { if (e.target.id === 'cvph' && e.target.files[0]) shrink(e.target.files[0], function (u) { S.photo = u; save(); toast('ছবি যোগ হয়েছে'); }); });
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var d = b.dataset;
      if (d.tpl) { S.tpl = d.tpl; if (S.color === COLORS.gov || S.color === COLORS.corp) S.color = COLORS[d.tpl]; save(); document.getElementById('cvform').innerHTML = formUI(); rebind(); }
      else if (d.add) { S[d.add].push(row(d.add)); save(); document.getElementById('cvform').innerHTML = formUI(); rebind(); }
      else if (d.rm) { var p = d.rm.split(','); S[p[0]].splice(+p[1], 1); save(); document.getElementById('cvform').innerHTML = formUI(); rebind(); }
      else if (d.dl) pdf();
      else if (d.sample) { if (confirm('নমুনা তথ্য বসালে আগের তথ্য মুছে যাবে। ঠিক আছে?')) { var ph = S.photo; S = SAMPLE(); S.photo = ph; save(); document.getElementById('cvform').innerHTML = formUI(); rebind(); } }
      else if (d.clear) { if (confirm('সব তথ্য মুছে নতুন করে শুরু করবেন?')) { S = fresh(); save(); document.getElementById('cvform').innerHTML = formUI(); rebind(); } }
    });
  };
  function rebind() { /* listeners form er upor delegated — notun HTML e abar bind korar dorkar nai, khali ekta dummy call */ }
})();
