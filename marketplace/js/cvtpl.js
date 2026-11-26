/* ===== Hut CV templates: gov + corp. cv.js-er AGE load hobe ===== */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var E = esc, T = function (s) { return String(s == null ? '' : s).trim(); };
  function rows(a) { return (a || []).filter(function (r) { return r.some(function (x) { return T(x); }); }); }
  function photo(d, w, h, rad, extra) {
    var st = 'width:' + w + 'px;height:' + h + 'px;border-radius:' + rad + 'px;overflow:hidden;background:#cfe6fb;flex:none;' + (extra || '');
    return '<div style="' + st + '">' + (d.photo
      ? '<img src="' + d.photo + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      : '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#5b7a99;font:600 14px Inter,sans-serif">PHOTO</div>') + '</div>';
  }
  function lis(a, key) { return rows(a).map(function (r) { return '<li style="margin:2px 0">' + E(r[key || 0]) + '</li>'; }).join(''); }

  /* ---------------- GOVERNMENT ---------------- */
  function gov(d) {
    var c = d.color;
    var H = function (t) {
      return '<div style="margin:16px 0 8px;display:flex;align-items:center;break-inside:avoid"><div style="background:' + c + ';color:#fff;padding:5px 30px 5px 12px;border-radius:6px 22px 22px 6px;font:700 15.5px Tinos,serif;min-width:250px">' + t + '</div><div style="flex:1;height:2px;background:' + c + ';opacity:.35"></div></div>';
    };
    var pr = [['Name', d.name], ["Father's Name", d.father], ["Mother's Name", d.mother], ['Date of Birth', d.dob], ['National ID No.', d.nid],
      ['Present Address', d.pres], ['Permanent Address', d.perm], ['Mobile', d.mobile], ['Email', d.email]]
      .concat(rows(d.pi).map(function (r) { return [r[0], r[1]]; })).filter(function (r) { return T(r[1]); });
    var h = '<div style="width:794px;min-height:1123px;box-sizing:border-box;padding:30px 36px 34px;background:#fff;color:#111;font:15.5px/1.5 Tinos,\'Noto Serif Bengali\',serif">';
    h += '<div style="display:flex;gap:20px;align-items:flex-start">' + photo(d, 185, 228, 4) + '<div style="flex:1;min-width:0">' +
      '<div style="background:' + c + ';color:#fff;border-radius:6px;padding:12px 16px;text-align:center"><div style="font:700 31px \'Playfair Display\',serif">Curriculum Vitae (CV)</div>' +
      (T(d.subtitle) ? '<div style="font:700 17px Tinos,serif;margin-top:2px">(' + E(d.subtitle) + ')</div>' : '') + '</div>' +
      '<div style="margin-top:10px">' + H('Personal Information').replace('margin:16px 0 8px', 'margin:0 0 6px') +
      pr.map(function (r) { return '<div style="display:grid;grid-template-columns:148px 14px 1fr;font-size:15px;line-height:1.45;padding:1px 0"><b style="font-weight:700">' + E(r[0]) + '</b><span>:</span><span>' + E(r[1]) + '</span></div>'; }).join('') +
      '</div></div></div>';
    if (T(d.about)) h += H('Career Objective') + '<p style="text-align:justify">' + E(d.about) + '</p>';
    var ed = rows(d.edu);
    if (ed.length) h += H('Educational Qualifications') +
      '<table style="width:100%;border-collapse:collapse;font-size:14.5px;border:1px solid ' + c + '"><tr style="background:#dce9fb;font-weight:700;text-align:center">' +
      ['Degree', 'Institution', 'Passing Year', 'Result'].map(function (x) { return '<td style="border:1px solid ' + c + ';padding:4px 8px">' + x + '</td>'; }).join('') + '</tr>' +
      ed.map(function (r) { return '<tr>' + [0, 1, 2, 3].map(function (i) { return '<td style="border:1px solid ' + c + ';padding:4px 8px;' + (i > 1 ? 'text-align:center' : '') + '">' + E(r[i]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    var ex = rows(d.exp);
    if (ex.length) h += H('Professional Experience') + '<ul style="margin-left:22px">' +
      ex.map(function (r) { return '<li style="margin:3px 0"><div style="display:flex;justify-content:space-between;gap:12px"><span>' + E(r[0]) + (T(r[1]) ? ', ' + E(r[1]) : '') + '</span><span style="white-space:nowrap">' + (T(r[2]) ? ': ' + E(r[2]) : '') + '</span></div></li>'; }).join('') + '</ul>';
    if (rows(d.skl).length) h += H('Computer / Other Skills') + '<ul style="margin-left:22px;columns:2;column-gap:30px">' + lis(d.skl) + '</ul>';
    if (rows(d.trn).length) h += H('Training & Certifications') + '<ul style="margin-left:22px;columns:2;column-gap:30px">' +
      rows(d.trn).map(function (r) { return '<li style="margin:2px 0">' + E(r[0]) + (T(r[1]) ? ' – ' + E(r[1]) : '') + '</li>'; }).join('') + '</ul>';
    if (rows(d.lng).length) h += H('Languages') + '<ul style="margin-left:22px;columns:2;column-gap:30px">' +
      rows(d.lng).map(function (r) { return '<li style="margin:2px 0">' + E(r[0]) + (T(r[1]) ? ' – ' + E(r[1]) : '') + '</li>'; }).join('') + '</ul>';
    if (rows(d.qlt).length) h += H('Personal Qualities') + '<div style="display:flex;flex-wrap:wrap;gap:6px 28px;margin-left:6px">' +
      rows(d.qlt).map(function (r) { return '<span>• ' + E(r[0]) + '</span>'; }).join('') + '</div>';
    (d.extra || []).forEach(function (x) {
      if (T(x[0]) && T(x[1])) h += H(E(x[0])) + '<ul style="margin-left:22px">' + x[1].split('\n').filter(T).map(function (l) { return '<li>' + E(l) + '</li>'; }).join('') + '</ul>';
    });
    h += H('Declaration') + '<p style="text-align:justify">' + E(d.decl) + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;break-inside:avoid"><div style="font-size:14.5px">' +
      (T(d.date) ? 'Date: ' + E(d.date) + '<br>' : '') + (T(d.place) ? 'Place: ' + E(d.place) : '') + '</div>' +
      '<div style="text-align:center;min-width:190px"><div style="font:italic 700 22px Tinos,serif;color:' + c + '">' + E(d.name) + '</div><div style="border-top:1px solid #333;margin-top:2px;padding-top:2px;font-size:14px">(' + E(d.name || 'Signature') + ')</div></div></div></div>';
    return h;
  }

  /* ---------------- CORPORATE ---------------- */
  function corp(d) {
    var c = d.color, ac = '#2f8fe8';
    var IC = { p: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', m: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
      a: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>', l: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', w: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>' };
    var ico = function (k) { return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">' + IC[k] + '</svg>'; };
    var SH = function (t) { return '<div style="font:600 17px Inter,sans-serif;margin:24px 0 8px;border-bottom:1px solid ' + ac + ';padding-bottom:5px;color:#fff">' + t + '</div>'; };
    var MH = function (t) { return '<div style="font:700 20px Inter,sans-serif;color:' + c + ';border-bottom:2px solid ' + ac + ';padding-bottom:4px;margin:22px 0 10px;break-inside:avoid">' + t + '</div>'; };
    var wave = '<div style="position:absolute;right:0;bottom:0;z-index:0;line-height:0;pointer-events:none"><svg width="360" height="120" viewBox="0 0 360 120"><path d="M360 14 C 290 70 190 48 90 86 C 60 98 30 108 0 120 L360 120 Z" fill="' + ac + '" opacity=".2"/><path d="M360 58 C 292 90 210 80 150 120 L360 120 Z" fill="' + c + '" opacity=".85"/></svg></div>';
    var side = '<div style="width:268px;flex:none;position:relative;z-index:1;background:' + c + ';color:#e9f1fb;padding:30px 24px;box-sizing:border-box;font:13.5px/1.55 Inter,\'Noto Serif Bengali\',sans-serif">' +
      photo(d, 220, 240, 18, 'border:3px solid #fff;margin:0 auto');
    if (T(d.about)) side += SH('About Me') + '<div>' + E(d.about) + '</div>';
    if (rows(d.skl).length) side += SH('Skills') + '<ul style="margin-left:16px">' + lis(d.skl) + '</ul>';
    if (rows(d.lng).length) side += SH('Languages') + '<ul style="margin-left:16px">' + rows(d.lng).map(function (r) { return '<li>' + E(r[0]) + (T(r[1]) ? ' – ' + E(r[1]) : '') + '</li>'; }).join('') + '</ul>';
    if (rows(d.qlt).length) side += SH('Personal Qualities') + '<ul style="margin-left:16px">' + lis(d.qlt) + '</ul>';
    side += '</div>';

    var ct = [['p', d.mobile], ['m', d.email], ['a', d.pres], ['l', d.linkedin], ['w', d.web]].filter(function (r) { return T(r[1]); });
    var main = '<div style="flex:1;min-width:0;position:relative;z-index:1;padding:34px 34px 30px 30px;box-sizing:border-box;font:14px/1.5 Inter,\'Noto Serif Bengali\',sans-serif;color:#1b2735">' +
      '<div style="position:relative;z-index:1"><div style="font:800 40px/1.1 Inter,sans-serif;color:' + c + '">' + E(d.name || 'Your Name') + '</div>' +
      (T(d.title) ? '<div style="margin-top:8px;font:500 15px Inter,sans-serif;letter-spacing:.04em;color:#34506e;border-bottom:2px solid ' + ac + ';padding-bottom:10px">' + E(d.title) + '</div>' : '') +
      '<div style="margin-top:12px;display:grid;gap:5px;font-size:13.5px;max-width:420px">' + ct.map(function (r) { return '<div style="display:flex;gap:8px;align-items:center">' + ico(r[0]) + '<span>' + E(r[1]) + '</span></div>'; }).join('') + '</div></div>' +
      '<div style="position:relative;z-index:1">';
    var ed = rows(d.edu);
    if (ed.length) main += MH('Education') + ed.map(function (r) { return '<div style="margin-bottom:9px;break-inside:avoid"><b>' + E(r[0]) + '</b><br>' + E(r[1]) + (T(r[2]) ? ' | ' + E(r[2]) : '') + (T(r[3]) ? '<br>' + E(r[3]) : '') + '</div>'; }).join('');
    var ex = rows(d.exp);
    if (ex.length) main += MH('Work Experience') + ex.map(function (r) { return '<div style="margin-bottom:9px;break-inside:avoid"><b>' + E(r[0]) + '</b><br>' + E(r[1]) + (T(r[2]) ? ' | ' + E(r[2]) : '') + '</div>'; }).join('');
    if (rows(d.trn).length) main += MH('Certifications') + '<ul style="margin-left:18px">' + rows(d.trn).map(function (r) { return '<li style="margin:2px 0">' + E(r[0]) + (T(r[1]) ? ' – ' + E(r[1]) : '') + '</li>'; }).join('') + '</ul>';
    var pr = [['Father', d.father], ['Mother', d.mother], ['Date of Birth', d.dob], ['National ID', d.nid], ['Permanent Address', d.perm]]
      .concat(rows(d.pi).map(function (r) { return [r[0], r[1]]; })).filter(function (r) { return T(r[1]); });
    if (pr.length) main += MH('Personal Details') + pr.map(function (r) { return '<div style="display:grid;grid-template-columns:140px 1fr"><b>' + E(r[0]) + '</b><span>' + E(r[1]) + '</span></div>'; }).join('');
    (d.extra || []).forEach(function (x) {
      if (T(x[0]) && T(x[1])) main += MH(E(x[0])) + '<ul style="margin-left:18px">' + x[1].split('\n').filter(T).map(function (l) { return '<li>' + E(l) + '</li>'; }).join('') + '</ul>';
    });
    main += MH('Declaration') + '<div>' + E(d.decl) + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;break-inside:avoid"><div style="font-size:13px">' +
      (T(d.date) ? 'Date: ' + E(d.date) + '<br>' : '') + (T(d.place) ? 'Place: ' + E(d.place) : '') + '</div>' +
      '<div style="text-align:right"><div style="font:italic 700 22px Tinos,serif;color:' + c + '">' + E(d.name) + '</div><div style="font-weight:600;font-size:13px">' + E(d.name) + '</div></div></div></div></div>';
    return '<div style="width:794px;min-height:1123px;display:flex;background:#fff;position:relative">' + wave + side + main + '</div>';
  }

  window.CVT = { gov: gov, corp: corp };
})();
