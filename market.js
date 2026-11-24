/* ===== Student Marketplace (boi/jinish kenabecha + notun product order + Rokomari) ar Mess & Hostel feed =====
   student.js-er pore, admin.js-er age load hobe. API URL: window.RSH_API (tuition.js set kore) */
(function () {
  var M = 'shop';
  var ST = { ls: [], rk: [], ok: 0, err: '', cr: ld('rsh_mk_cr', null), my: null, msg: '', busy: 0 };
  var V = { shop: { v: 'home', tab: 'all', q: '', id: '', ft: '' }, mess: { v: 'home', g: '', q: '', id: '', ft: '' } };
  var YR = ['১ম বর্ষ', '২য় বর্ষ', '৩য় বর্ষ', '৪র্থ বর্ষ', 'মাস্টার্স', 'অন্যান্য'];
  var DOP = ['সাধারণ / অন্যান্য'].concat(Object.keys(DEPT));
  var OL = { pending: '⏳ অপেক্ষায়', confirmed: '✅ কনফার্ম', delivered: '📦 ডেলিভারি হয়েছে', cancelled: '❌ বাতিল' };
  var LL = { pending: '⏳ অনুমোদনের অপেক্ষায়', approved: '✅ চালু আছে', rejected: '❌ বাতিল' };
  var TI = { book: '📚', want: '🙋', mess: '🏠', prod: '🛍️' };

  /* ---------- helpers ---------- */
  function api(a, d) {
    var U = window.RSH_API;
    if (!/^https/.test(U || '')) return Promise.reject(new Error('Admin এখনো Apps Script URL বসায়নি'));
    return fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ a: a }, d || {})) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.err) throw new Error(j.err); return j; });
  }
  function shrink(file, max) {
    return new Promise(function (res) {
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.78));
        };
        im.onerror = function () { res(''); }; im.src = r.result;
      };
      r.onerror = function () { res(''); }; r.readAsDataURL(file);
    });
  }
  window.MK = { files: function (inp) { var fs = [].slice.call((inp && inp.files) || [], 0, 3); return Promise.all(fs.map(function (f) { return shrink(f, 900); })).then(function (a) { return a.filter(Boolean); }); } };

  function imgs(l) { return l.img ? l.img.split(',').filter(Boolean) : []; }
  function money(p) { return /^\d+(\.\d+)?$/.test(String(p).trim()) ? '৳ ' + bn(String(p).trim()) : esc(p || ''); }
  function tel(m) { return String(m || '').replace(/\D/g, ''); }
  function ago(ts) {
    var m = (Date.now() - new Date(ts)) / 6e4; if (isNaN(m)) return '';
    return m < 60 ? bn(Math.max(1, Math.round(m))) + ' মিনিট আগে' : m < 1440 ? bn(Math.round(m / 60)) + ' ঘণ্টা আগে' : bn(Math.round(m / 1440)) + ' দিন আগে';
  }
  function wa(m, text) { return 'https://wa.me/88' + tel(m) + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function callB(l) {
    return '<a class="ib" href="tel:' + tel(l.m) + '">📞 কল করুন</a><a class="ib" target="_blank" rel="noopener" href="' + wa(l.m, (l.type === 'mess' ? 'আসসালামু আলাইকুম, "' + l.t + '" মেসের সিট এখনো খালি আছে?' : 'আসসালামু আলাইকুম, "' + l.t + '" আছে?')) + '">💬 WhatsApp</a>';
  }
  function thumb(l) {
    var i = imgs(l)[0];
    return '<div class="mk-im">' + (i ? '<img loading="lazy" src="' + esc(i) + '" alt="" onerror="this.parentNode.classList.add(\'mk-ph\');this.remove()">' : '') + '<span class="mk-pi">' + (TI[l.type] || '🛍️') + '</span></div>';
  }
  function card(l) {
    var badge = l.type === 'prod' ? '🆕 নতুন' : l.type === 'want' ? '🙋 চাই' : esc(l.cond || 'পুরোনো');
    return '<button class="mk-c" onclick="MKT.open(\'' + l.id + '\')">' + thumb(l) + '<span class="mk-bd">' + badge + '</span><div class="mk-in"><b>' + esc(l.t) + '</b><div class="mk-pr">' + (l.price ? money(l.price) : '') + '</div><small>' +
      [l.dept && l.dept.indexOf('সাধারণ') < 0 ? l.dept : '', l.yr, l.area].filter(Boolean).map(esc).join(' · ') + '</small></div></button>';
  }
  function find(id) { return ST.ls.filter(function (x) { return x.id === id; })[0]; }
  function hit(l, q) { return !q || [l.t, l.dept, l.cat, l.area, l.note, l.cond, l.yr, l.g].join(' ').toLowerCase().indexOf(q) > -1; }
  function gal(l) {
    var im = imgs(l);
    if (!im.length) return '<div class="mk-gal"><div class="mk-gph">' + (TI[l.type] || '🛍️') + '</div></div>';
    return '<div class="mk-gal">' + im.map(function (i) { return '<img loading="lazy" src="' + esc(i) + '" alt="">'; }).join('') + '</div>' + (im.length > 1 ? '<div class="mk-hint">← ' + bn(im.length) + 'টি ছবি, সোয়াইপ করুন →</div>' : '');
  }
  function F(k, l, o) { o = o || {}; o.k = k; o.l = l; return o; }
  function field(f) {
    var id = 'f_' + f.k, h = '<div' + (f.w ? ' style="grid-column:1/-1"' : '') + '><label>' + f.l + '</label>';
    if (f.o) h += '<select id="' + id + '">' + f.o.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>';
    else if (f.ta) h += '<textarea id="' + id + '" placeholder="' + (f.ph || '') + '"></textarea>';
    else h += '<input id="' + id + '" placeholder="' + (f.ph || '') + '"' + (f.t ? ' type="' + f.t + '"' : '') + (f.max ? ' maxlength="' + f.max + '"' : '') + '>';
    return h + '</div>';
  }
  var COMMON = [F('n', 'আপনার নাম *'), F('m', 'মোবাইল *', { t: 'tel', max: 11, ph: '01XXXXXXXXX' }), F('pin', 'নিজের ৪ সংখ্যার PIN *', { t: 'tel', max: 4, ph: 'মনে রাখবেন' })];
  var FORMS = {
    book: { h: '📚 পুরোনো বই বিক্রি করুন', p: 'ছবি দিলে বই অনেক তাড়াতাড়ি বিক্রি হয়। Admin অনুমোদন করলে সবাই দেখতে পাবে, ক্রেতা সরাসরি আপনাকে ফোন করবে।', f: [
      F('t', 'বইয়ের নাম *', { w: 1 }), F('dept', 'বিভাগ', { o: DOP }), F('yr', 'বর্ষ', { o: YR }), F('cond', 'অবস্থা', { o: ['নতুনের মতো', 'ভালো', 'মোটামুটি'] }), F('price', 'দাম (টাকা) *', { t: 'tel', ph: '২০০' }),
      F('area', 'এলাকা *', { ph: 'Faridpur Sadar / হল / কলেজ গেট', w: 1 }), F('note', 'বিস্তারিত', { ta: 1, w: 1, ph: 'লেখক, সংস্করণ, পেজ কেমন...' })] },
    want: { h: '🙋 বই চাই', p: 'কোন বই খুঁজছেন লিখুন, যাদের কাছে আছে তারা আপনাকে ফোন করবে।', f: [
      F('t', 'কোন বই / জিনিস চাই *', { w: 1 }), F('dept', 'বিভাগ', { o: DOP }), F('yr', 'বর্ষ', { o: YR }), F('price', 'সর্বোচ্চ বাজেট (টাকা)', { t: 'tel' }), F('area', 'এলাকা', { ph: 'Faridpur Sadar' }), F('note', 'অন্যান্য', { ta: 1, w: 1 })] },
    mess: { h: '🏠 মেস / হোস্টেল / সিট পোস্ট', p: 'সিট খালি থাকলে ছবি ও ঠিকানা দিয়ে পোস্ট করুন। Admin অনুমোদন করলে সবাই দেখবে।', f: [
      F('t', 'শিরোনাম *', { w: 1, ph: 'যেমন: কলেজ গেটের কাছে ছেলেদের মেস, ২টি সিট খালি' }), F('cond', 'ধরন', { o: ['মেস', 'হোস্টেল', 'বাসা / ফ্ল্যাট'] }), F('g', 'কাদের জন্য', { o: ['ছেলে', 'মেয়ে', 'যে কেউ'] }),
      F('seats', 'খালি সিট *', { t: 'tel', ph: '২' }), F('price', 'ভাড়া (প্রতি সিট, টাকা) *', { t: 'tel', ph: '১৫০০' }), F('area', 'ঠিকানা / এলাকা *', { w: 1, ph: 'পূর্ব খাবাসপুর, কলেজ গেট থেকে ৫ মিনিট' }),
      F('loc', 'Google Map লিংক (ঐচ্ছিক)', { w: 1, ph: 'https://maps.app.goo.gl/...' }), F('note', 'সুবিধা / শর্ত', { ta: 1, w: 1, ph: 'ওয়াইফাই, রান্না, বিদ্যুৎ বিল, সিকিউরিটি...' })] }
  };

  /* ---------- views ---------- */
  function back() { return '<button class="ib" onclick="MKT.back()">← ফিরে যান</button>'; }
  function gridHTML() {
    var s = V.shop, q = s.q.toLowerCase(), t = s.tab;
    if (t === 'rk') {
      return (ST.rk.length ? '<p class="mk-n">📦 Rokomari-র বই। নিচের বাটনে চাপলে Rokomari ওয়েবসাইটে যাবে। আমরা এই লিংক থেকে সামান্য কমিশন পেতে পারি, আপনার দাম বাড়ে না।</p><div class="mk-g">' + ST.rk.filter(function (r) { return hit({ t: r.t }, q); }).map(function (r) {
        return '<a class="mk-c" target="_blank" rel="sponsored noopener" href="' + esc(r.u) + '"><div class="mk-im">' + (r.img ? '<img loading="lazy" src="' + esc(r.img) + '" alt="" onerror="this.remove()">' : '') + '<span class="mk-pi">📦</span></div><span class="mk-bd">Rokomari</span><div class="mk-in"><b>' + esc(r.t) + '</b><div class="mk-pr">' + (r.price ? money(r.price) : '') + '</div><small>Rokomari-তে দেখুন ↗</small></div></a>';
      }).join('') + '</div>' : '<p class="cal-e">Rokomari-র বইয়ের তালিকা শীঘ্রই আসছে</p>');
    }
    var L = ST.ls.filter(function (l) { return hit(l, q); }), main = L.filter(function (l) { return t === 'all' ? l.type === 'prod' || l.type === 'book' : l.type === t; }), h = '';
    if (t !== 'want') h += main.length ? '<div class="mk-g">' + main.map(card).join('') + '</div>' : '<p class="cal-e">' + (q ? 'কিছু পাওয়া যায়নি' : 'এখনো কিছু যোগ হয়নি') + '</p>';
    if (t === 'all' || t === 'want') {
      var W = L.filter(function (l) { return l.type === 'want'; }).slice(0, t === 'want' ? 99 : 6);
      if (W.length) h += '<h3>🙋 কেউ খুঁজছেন (আপনার কাছে আছে?)</h3>' + W.map(function (l) {
        return '<div class="tuc"><b>🙋 ' + esc(l.t) + '</b> <small>' + [l.dept, l.yr, l.area].filter(Boolean).map(esc).join(' · ') + '</small><p>' + (l.price ? 'বাজেট: ' + money(l.price) + ' · ' : '') + esc(l.note || '') + '</p><div class="act">' + callB(l) + '</div></div>';
      }).join('');
      else if (t === 'want') h += '<p class="cal-e">এখন কেউ বই খুঁজছে না</p>';
    }
    return h;
  }
  function shopHome() {
    var s = V.shop, T = [['all', 'সব'], ['prod', '🆕 নতুন পণ্য'], ['book', '📚 পুরোনো বই'], ['want', '🙋 বই চাই'], ['rk', '📦 Rokomari']];
    return '<input id="mq" placeholder="🔎 বইয়ের নাম / বিভাগ / পণ্য খুঁজুন" value="' + esc(s.q) + '" oninput="MKT.q(this.value)">' +
      '<button class="mk-cta" onclick="MKT.form(\'book\')"><span>📚</span><b>পুরোনো বই বিক্রি করুন</b><small>ছবি দিয়ে ফ্রি পোস্ট · ক্রেতা সরাসরি ফোন করবে</small></button>' +
      '<div class="tu-tabs">' + T.map(function (x) { return '<button class="' + (s.tab === x[0] ? 'on' : '') + '" onclick="MKT.tab(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="mk-sub"><button class="ib" onclick="MKT.form(\'want\')">🙋 বই চাই পোস্ট</button><button class="ib" onclick="MKT.my()">👤 আমার পোস্ট ও অর্ডার</button></div><div id="mkg">' + gridHTML() + '</div>' +
      '<p class="mk-n">🚚 নতুন পণ্য শুধু কলেজ ক্যাম্পাসের ভিতরে ডেলিভারি, ক্যাশ অন ডেলিভারি। পুরোনো জিনিসের লেনদেন ক্রেতা-বিক্রেতা নিজেরা ফোনে ঠিক করবেন।</p>';
  }
  function shopItem(l) {
    if (!l) return back() + '<p class="cal-e">পোস্টটি আর নেই</p>';
    var me = window.stuMe && stuMe(), h = back() + gal(l) + '<h2 style="margin:10px 0 2px">' + esc(l.t) + '</h2><div class="mk-pr big">' + (l.price ? money(l.price) : '') + '</div>' +
      '<div class="mk-ch">' + [l.type === 'prod' ? '🆕 নতুন' : l.type === 'want' ? '🙋 চাই' : '♻️ ' + esc(l.cond || 'পুরোনো'), l.dept && l.dept.indexOf('সাধারণ') < 0 ? '🎓 ' + esc(l.dept) : '', l.yr ? esc(l.yr) : '', l.cat ? '🏷 ' + esc(l.cat) : '', l.area ? '📍 ' + esc(l.area) : '',
        l.type === 'prod' && l.stock !== '' ? '📦 স্টকে ' + bn(l.stock) + 'টি' : ''].filter(Boolean).map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
      (l.note ? '<p style="margin:8px 0;white-space:pre-wrap">' + esc(l.note) + '</p>' : '');
    if (l.type === 'prod') {
      h += '<div class="tuc"><h3 style="margin:0 0 6px">🛒 অর্ডার করুন</h3><p>ক্যাশ অন ডেলিভারি · শুধু কলেজ ক্যাম্পাসের ভিতরে ডেলিভারি</p><div class="tug">' +
        field(F('oq', 'পরিমাণ', { o: ['1', '2', '3', '4', '5'] })) + field(F('on', 'আপনার নাম *')) + field(F('om', 'মোবাইল *', { t: 'tel', max: 11 })) + field(F('opin', 'নিজের ৪ সংখ্যার PIN *', { t: 'tel', max: 4, ph: 'অর্ডার ট্র্যাক করতে' })) +
        field(F('op', 'ডেলিভারির স্থান *', { w: 1, ph: 'যেমন: ইংরেজি বিভাগ, ২য় তলা / কলেজ গেট' })) + field(F('oo', 'নোট', { w: 1 })) + '</div><button class="btn pr" id="mkob" onclick="MKT.order(\'' + l.id + '\')">অর্ডার জমা দিন</button></div>';
      setTimeout(function () { if ($('f_on') && me) { $('f_on').value = me.n; $('f_om').value = me.m; } }, 0);
    } else h += '<div class="act" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">' + callB(l) + '<button class="ib" onclick="MKT.share(\'' + l.id + '\')">🔗 শেয়ার</button></div><small style="color:var(--muted)">বিক্রেতা: ' + esc(l.n) + ' · ' + ago(l.ts) + '</small>';
    return h;
  }
  function formView(t) {
    var f = FORMS[t], me = window.stuMe && stuMe();
    setTimeout(function () { if (me && $('f_n')) { $('f_n').value = me.n; $('f_m').value = me.m; } }, 0);
    return back() + '<h3>' + f.h + '</h3><p style="color:var(--muted);font-size:12.5px;margin:2px 0 6px">' + f.p + '</p><div class="tug">' + f.f.concat(COMMON).map(field).join('') + '</div>' +
      (t === 'want' ? '' : '<label>ছবি (সর্বোচ্চ ৩টি, ঐচ্ছিক)</label><input type="file" id="f_img" accept="image/*" multiple onchange="MKT.pv(this)"><div id="mkpv" class="mk-pv"></div>') +
      '<button class="btn pr" id="mkfb" onclick="MKT.sub()">জমা দিন</button>';
  }
  function myView() {
    var h = back() + '<h3>👤 আমার পোস্ট ও অর্ডার</h3>';
    if (ST.msg) h += '<div class="res" style="margin:8px 0">' + ST.msg + '</div>';
    if (!ST.my) return h + '<div class="tug"><div><label>মোবাইল</label><input id="lm2" type="tel" maxlength="11" value="' + esc(ST.cr ? ST.cr.m : '') + '"></div><div><label>PIN</label><input id="lp2" type="tel" maxlength="4"></div></div><button class="btn pr" onclick="MKT.login()">ঢুকুন</button>';
    h += '<button class="ib" onclick="MKT.out()">বের হন</button>';
    if (ST.my.ls.length) h += '<h3>📋 আমার পোস্ট</h3>' + ST.my.ls.map(function (l) {
      var done = l.sold === 'yes', lab = l.type === 'mess' ? 'ভাড়া হয়ে গেছে' : l.type === 'want' ? 'পেয়ে গেছি' : 'বিক্রি হয়েছে';
      return '<div class="tuc mk-row">' + thumb(l) + '<div><b>' + esc(l.t) + '</b> <span class="tub">' + (done ? '✔ ' + lab : LL[l.status] || l.status) + '</span><p>' + [TI[l.type], l.price ? money(l.price) : '', esc(l.area)].filter(Boolean).join(' · ') + '</p><div class="act">' +
        (l.status === 'approved' ? '<button class="ib" onclick="MKT.mine(\'' + (done ? 'unsold' : 'sold') + '\',\'' + l.id + '\')">' + (done ? '↩ আবার চালু করুন' : '✅ ' + lab) + '</button>' : '') + '<button class="ib" onclick="MKT.mine(\'del\',\'' + l.id + '\')">🗑 মুছুন</button></div></div></div>';
    }).join('');
    if (ST.my.os.length) h += '<h3>🛒 আমার অর্ডার</h3>' + ST.my.os.map(function (o) {
      return '<div class="tuc"><b>' + esc(o.pt) + '</b> × ' + bn(o.qty) + ' <span class="tub">' + (OL[o.status] || o.status) + '</span><p>মোট: ' + money((+o.price || 0) * (+o.qty || 1)) + ' · ডেলিভারি: ' + esc(o.place) + ' · ' + ago(o.ts) + '</p>' +
        (o.status === 'pending' ? '<div class="act"><button class="ib" onclick="MKT.cancel(\'' + o.id + '\')">❌ অর্ডার বাতিল</button></div>' : '') + '</div>';
    }).join('');
    return h;
  }
  function messHome() {
    var s = V.mess, q = s.q.toLowerCase(), G = [['', 'সব'], ['ছেলে', '👦 ছেলে'], ['মেয়ে', '👧 মেয়ে'], ['যে কেউ', '👥 যে কেউ']];
    return '<input id="mq" placeholder="🔎 এলাকা / মেসের নাম খুঁজুন" value="' + esc(s.q) + '" oninput="MKT.q(this.value)">' +
      '<button class="mk-cta" onclick="MKT.form(\'mess\')"><span>🏠</span><b>মেস / হোস্টেল / সিট পোস্ট করুন</b><small>সিট খালি আছে? ছবি ও নম্বর দিয়ে জানিয়ে দিন</small></button>' +
      '<div class="tu-tabs">' + G.map(function (x) { return '<button class="' + (s.g === x[0] ? 'on' : '') + '" onclick="MKT.g(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="mk-sub"><button class="ib" onclick="MKT.my()">👤 আমার পোস্ট</button></div><div id="mkg">' + feed() + '</div>';
  }
  function feed() {
    var s = V.mess, q = s.q.toLowerCase(), L = ST.ls.filter(function (l) { return l.type === 'mess' && hit(l, q) && (!s.g || l.g === s.g || l.g === 'যে কেউ'); });
    return L.map(function (l) {
      return '<div class="mk-post"><div class="mk-ph-h"><span class="mk-av">' + esc(String(l.n || '?').charAt(0).toUpperCase()) + '</span><div><b>' + esc(l.n) + '</b><small>' + ago(l.ts) + ' · ' + esc(l.area) + '</small></div><span class="tub">' + esc(l.cond || 'মেস') + '</span></div>' + gal(l) +
        '<div class="mk-pb"><h4>' + esc(l.t) + '</h4><div class="mk-ch"><span>👥 ' + esc(l.g || 'যে কেউ') + '</span><span>🛏 খালি সিট: ' + bn(l.seats || '?') + '</span><span>💰 ' + money(l.price) + ' / সিট</span></div>' + (l.note ? '<p style="white-space:pre-wrap;margin:6px 0">' + esc(l.note) + '</p>' : '') +
        '<p style="margin:6px 0">📍 ' + esc(l.area) + '</p><div class="act" style="display:flex;gap:8px;flex-wrap:wrap">' + callB(l) + (/^https?:\/\//.test(l.loc) ? '<a class="ib" target="_blank" rel="noopener" href="' + esc(l.loc) + '">🗺 ম্যাপ</a>' : '') + '<button class="ib" onclick="MKT.share(\'' + l.id + '\')">🔗 শেয়ার</button></div></div></div>';
    }).join('') || '<p class="cal-e">' + (q || s.g ? 'কিছু পাওয়া যায়নি' : 'এখনো কোনো মেস / সিট পোস্ট হয়নি') + '</p>';
  }
  function draw() {
    var w = $(M === 'mess' ? 'msw' : 'mkw'); if (!w) return;
    if (!ST.ok) { w.innerHTML = ST.err ? '<div class="res">' + esc(ST.err) + '</div>' : '<p class="cal-e">লোড হচ্ছে...</p>'; return; }
    var s = V[M];
    w.innerHTML = s.v === 'form' ? formView(s.ft) : s.v === 'my' ? myView() : s.v === 'item' ? shopItem(find(s.id)) : M === 'mess' ? messHome() : shopHome();
  }
  function load() {
    return api('mpub').then(function (j) { ST.ls = j.ls; ST.rk = j.rk; ST.ok = 1; ST.err = ''; draw(); }).catch(function (e) { ST.err = e.message; draw(); });
  }
  function loadMy() {
    return api('lmy', ST.cr).then(function (j) { ST.my = j; sv('rsh_mk_cr', ST.cr); draw(); }).catch(function (e) { ST.my = null; draw(); alert(e.message); });
  }

  window.MKT = {
    back: function () { V[M].v = 'home'; ST.msg = ''; draw(); },
    open: function (id) { V[M].v = 'item'; V[M].id = id; draw(); var w = $('vw'); if (w) w.scrollTop = 0; },
    tab: function (t) { V.shop.tab = t; draw(); },
    g: function (g) { V.mess.g = g; draw(); },
    q: function (v) { V[M].q = v; var g = $('mkg'); if (g) g.innerHTML = M === 'mess' ? feed() : gridHTML(); },
    form: function (t) { V[M].v = 'form'; V[M].ft = t; draw(); },
    pv: function (inp) {
      if (inp.files.length > 3) alert('সর্বোচ্চ ৩টি ছবি নেওয়া হবে');
      $('mkpv').innerHTML = [].slice.call(inp.files, 0, 3).map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join('');
    },
    sub: function () {
      var t = V[M].ft, fs = FORMS[t].f.concat(COMMON), d = { type: t };
      fs.forEach(function (f) { d[f.k] = $('f_' + f.k).value.trim(); });
      var miss = fs.filter(function (f) { return f.l.indexOf('*') > 0 && !d[f.k]; })[0];
      if (miss) return alert('"' + miss.l.replace(' *', '') + '" পূরণ করুন');
      if (!/^01\d{9}$/.test(d.m)) return alert('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)');
      if (!/^\d{4}$/.test(d.pin)) return alert('PIN ঠিক ৪ সংখ্যার হতে হবে');
      var b = $('mkfb'); b.disabled = true; b.textContent = 'জমা হচ্ছে...';
      MK.files($('f_img')).then(function (im) { d.imgs = im; return api('ladd', { d: d }); }).then(function () {
        ST.cr = { m: d.m, pin: d.pin }; ST.my = null; V[M].v = 'my'; ST.msg = '✅ জমা হয়েছে! Admin অনুমোদন করলে সবার জন্য দেখা যাবে। এখান থেকে স্ট্যাটাস দেখতে পারবেন।'; return loadMy();
      }).catch(function (e) { b.disabled = false; b.textContent = 'জমা দিন'; alert(e.message || 'সার্ভারে সমস্যা'); });
    },
    order: function (id) {
      var l = find(id), d = { pid: id, qty: $('f_oq').value, n: $('f_on').value.trim(), m: $('f_om').value.trim(), pin: $('f_opin').value.trim(), place: $('f_op').value.trim(), note: $('f_oo').value.trim() };
      if (!d.n || !d.place) return alert('নাম ও ডেলিভারির স্থান দিন');
      if (!/^01\d{9}$/.test(d.m)) return alert('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)');
      if (!/^\d{4}$/.test(d.pin)) return alert('PIN ঠিক ৪ সংখ্যার হতে হবে');
      var b = $('mkob'); b.disabled = true; b.textContent = 'জমা হচ্ছে...';
      api('oadd', { d: d }).then(function () {
        ST.cr = { m: d.m, pin: d.pin }; ST.my = null; V.shop.v = 'my';
        var txt = 'আসসালামু আলাইকুম, আমি "' + l.t + '" × ' + d.qty + ' অর্ডার করেছি। নাম: ' + d.n + ', ডেলিভারি: ' + d.place;
        var num = (typeof DEV !== 'undefined' && DEV.whatsapp) || '';
        ST.msg = '✅ অর্ডার জমা হয়েছে! কনফার্ম হলে স্ট্যাটাস বদলাবে। দ্রুত কনফার্মের জন্য <a style="color:var(--gold)" target="_blank" rel="noopener" href="https://wa.me/' + tel(num) + '?text=' + encodeURIComponent(txt) + '">WhatsApp-এ জানান</a>';
        return loadMy().then(load);
      }).catch(function (e) { b.disabled = false; b.textContent = 'অর্ডার জমা দিন'; alert(e.message || 'সার্ভারে সমস্যা'); });
    },
    my: function () { V[M].v = 'my'; ST.msg = ''; draw(); if (!ST.my && ST.cr) loadMy(); },
    login: function () { ST.cr = { m: $('lm2').value.trim(), pin: $('lp2').value.trim() }; loadMy(); },
    out: function () { ST.my = null; ST.cr = null; sv('rsh_mk_cr', null); draw(); },
    mine: function (act, id) {
      if (act === 'del' && !confirm('নিশ্চিতভাবে মুছবেন?')) return;
      api('lown', { m: ST.cr.m, pin: ST.cr.pin, act: act, id: id }).then(function () { return Promise.all([loadMy(), load()]); }).catch(function (e) { alert(e.message); });
    },
    cancel: function (id) { if (!confirm('অর্ডারটি বাতিল করবেন?')) return; api('oown', { m: ST.cr.m, pin: ST.cr.pin, id: id }).then(function () { return Promise.all([loadMy(), load()]); }).catch(function (e) { alert(e.message); }); },
    share: function (id) {
      var l = find(id), t = l.t + (l.price ? ' — ' + (/^\d+$/.test(l.price) ? '৳' + l.price : l.price) : '') + ' | Rajendra Student Hub ' + location.origin;
      if (navigator.share) navigator.share({ title: l.t, text: t }).catch(function () {}); else window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
    }
  };

  /* ---------- hub-e jora ---------- */
  delete SOON.shop;
  HUB.forEach(function (h) { if (h[1] === 'shop') { h[0] = '🛒'; h[2] = 'Student Marketplace'; h[3] = 'বই ও জিনিস কেনাবেচা, নতুন পণ্য অর্ডার'; h[4] = 'live'; } });
  var si = HUB.map(function (h) { return h[1]; }).indexOf('shop');
  HUB.splice(si + 1, 0, ['🏠', 'mess', 'Mess & Hostel', 'মেস / হোস্টেল সিট ভাড়া ও খোঁজা', 'live']);
  $('hg').innerHTML = HUB.map(function (h) { return '<button class="hc" onclick="openV(\'' + h[1] + '\')"><span class="ic">' + h[0] + '</span><b>' + h[2] + '</b><span>' + h[3] + '</span><br>' + (h[4] === 'live' ? '<em>চালু আছে</em>' : '<em class="soon">শীঘ্রই আসছে</em>') + '</button>'; }).join('');
  var openIt = function (m) { return function () { M = m; V[m].v = 'home'; draw(); load(); }; };
  VW.shop = ['Student Marketplace', '<div id="mkw"></div>', openIt('shop')];
  VW.mess = ['Mess & Hostel', '<div id="msw"></div>', openIt('mess')];
})();
