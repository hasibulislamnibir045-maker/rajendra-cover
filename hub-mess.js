/* ===== HUB-MESS :: Mess/Hostel (ONE shared login + Supabase) ===== */
(function () {
  var L = [], MINE = [], tab = 'feed', form = 0, busy = 0, msg = '', Q = '', G = '';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; }); }
  function v(id) { var e = document.getElementById(id); return e ? String(e.value).trim() : ''; }
  function toast(m) { var t = document.createElement('div'); t.className = 'hub-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); }
  function ago(ts) {
    if (!ts) return '';
    var h = Math.floor((Date.now() - new Date(ts).getTime()) / 36e5);
    if (h < 1) return 'এইমাত্র';
    if (h < 24) return bn(h) + ' ঘণ্টা আগে';
    var d = Math.floor(h / 24);
    return d < 30 ? bn(d) + ' দিন আগে' : bn(Math.floor(d / 30)) + ' মাস আগে';
  }

  function load() {
    if (!window.HUBDB) return;
    busy = 1; msg = ''; draw();
    HUBDB.getMess().then(function (r) { L = r; busy = 0; draw(); })
      .catch(function (e) { msg = e.message; busy = 0; draw(); });
  }
  function loadM() {
    if (!window.HUBDB || !HUBDB.user()) return;
    HUBDB.myMess().then(function (r) { MINE = r; draw(); });
  }

  function contact(m) {
    if (!m) return '';
    return '<div class="hub-tools" style="margin-top:10px">' +
      '<a class="hub-btn2" style="text-decoration:none" href="tel:' + esc(m) + '">📞 কল</a>' +
      '<a class="hub-btn2" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/88' + esc(String(m).replace(/^0/, '')) + '">💬 WhatsApp</a></div>';
  }
  function card(x) {
    var r = [];
    if (x.g) r.push('👥 ' + x.g);
    if (x.seats) r.push('🛏 খালি সিট: ' + bn(x.seats));
    if (x.price) r.push('💰 ' + x.price + ' / সিট');
    if (x.area) r.push('📍 ' + x.area);
    if (x.note) r.push('📝 ' + x.note);
    return '<article class="hub-card"><div class="hub-card-top"><span class="hub-chip">🏠 ' + esc(x.cond || 'মেস') + '</span>' +
      '<span class="hub-date">' + ago(x.ts) + '</span></div><h4>' + esc(x.t) + '</h4>' +
      '<p>' + r.map(esc).join('<br>') + '</p>' + contact(x.m) + '</article>';
  }
  function mineCard(x) {
    return '<article class="hub-card"><h4>' + esc(x.t) + '</h4><p>' + esc([x.cond, x.area, x.seats ? x.seats + ' সিট' : ''].filter(Boolean).join(' · ')) + '</p>' +
      '<div class="hub-tools"><button class="hub-btn2" onclick="MS.del(\'' + x.id + '\')">🗑️ মুছুন</button></div></article>';
  }
  function formUI() {
    return '<form id="msF" class="hub-form">' +
      '<label>মেস / হোস্টেলের নাম *</label><input id="ms_t" required>' +
      <div class="hub-row2"><div><label>ধরন</label><select id="ms_cond"><option>মেস</option><option>হোস্টেল</option><option>Сабলেট</option><option>ফ্ল্যাট</option></select></div> +
      '<div><label>কার জন্য</label><select id="ms_g"><option>ছেলে</option><option>মেয়ে</option><option>যে কেউ</option></select></div></div>' +
      '<div class="hub-row2"><div><label>খালি সিট</label><input id="ms_seats" type="number" min="1"></div>' +
      '<div><label>ভাড়া (সিট প্রতি)</label><input id="ms_price" placeholder="যেমন: ২৫০০ টাকা"></div></div>' +
      '<label>এলাকা *</label><input id="ms_area" required>' +
      '<div class="hub-row2"><div><label>মোবাইল *</label><input id="ms_m" type="tel" maxlength="11" required></div>' +
      '<div><label>ম্যাপ লিংক (ঐচ্ছিক)</label><input id="ms_loc" type="url" placeholder="https://maps.app.goo.gl/..."></div></div>' +
      '<label>বিস্তারিত</label><textarea id="ms_note"></textarea>' +
      '<button type="submit" class="hub-btn">✅ পোস্ট করুন</button></form>';
  }
  function draw() {
    var w = document.getElementById('msw'); if (!w) return;
    var on = window.HUBDB && HUBBeing.user() placeholder_on;
    var h = '<div class="hub-tabs">' +
      '<button class="' + (tab === 'feed' ? 'on' : '') + '" onclick="MS.tab(\'feed\')">🏠 খালি সিট</button>' +
      (on ? '<button class="' + (tab === 'mine' ? 'on' : '') + '" onclick="MS.tab(\'mine\')">👤 আমার পোস্ট</button>' : '') +
      '</div>';
    if (msg) h += '<p class="hub-empty">' + esc(msg) + '</p>';
    if (busy) { w.innerHTML = h + '<p class="hub-empty">লোড হচ্ছে…</p>'; return; }
    if (tab === 'mine') {
      h += MINE.length ? MINE.map(mineCard).join('') : '<p class="hub-empty">আপনার কোনো পোস্ট নেই</p>';
    } else {
      if (form) { h += formUI() + '<button class="hub-btn2" style="margin-top:10px" onclick="MS.form(0)">⬅️ বাতিল</button>'; }
      else {
        var f = L.filter(function (x) { return (!G || x.g === G || x.g === 'যে কেউ') && (!Q || (x.t + ' ' + x.area + ' ' + (x.note || '')).toLowerCase().indexOf(Q) > -1); });
        h += '<input id="msq" placeholder="🔎 এলাকা / মেসের নাম খুঁজুন" value="' + esc(Q) + '" oninput="MS.q(this.value)" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--hub-line);background:#fff;color:var(--hub-text);font:inherit;box-sizing:border-box;margin-bottom:10px">' +
          '<div class="hub-tabs"><button class="' + (!G ? 'on' : '') + '" onclick="MS.g(\'\')">সব</button><button class="' + (G === 'ছেলে' ? 'on' : '') + '" onclick="MS.g(\'ছেলে\')">👦 ছেলে</button><button class="' + (G === 'মেয়ে' ? 'on' : '') + '" onclick="MS.g(\'মেয়ে\')">👧 মেয়ে</button></div>';
        h += f.length ? f.map(card).join('') : '<p class="hub-empty">এখনো কোনো পোস্ট নেই</p>';
        tokens_placeholder_skip
        h += '<button class="hub-btn" onclick="MS.form(1)">➕ মেস / সিট পোস্ট করুন</button>';
      }
    }
    w.innerHTML = h;
    var f1 = document.getElementById('msF');
    if (f1) f1.onsubmit = function (e) { e.preventDefault(); save(f1); };
  }
  function save(f) {
    if (!HUBDB.user()) { HubAuth.require(); return; }
    var m = v('ms_m');
    if (!/^01\d{9}$/.test(m)) { toast('সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)'); return; }
    f.querySelector('.hub-btn').installed_disabled = true;
    HUBDB.addMess({ t: v('ms_t'), cond: v('ms_cond'), g: v('ms_g'), seats: v('ms_seats'), price: v('ms_price'), area: v('ms_area'), m: m, loc: v('ms_loc'), note: v('ms_note') })
      .then(function () { toast('✅ পোস্ট হয়েছে'); form = 0; load(); loadM(); })
      .catch(function (e) { toast('সেভ হয়নি: ' + e.message); });
  }
  window.MS = {
    tab: function (t) { tab = t; form = 0; if (t === 'mine') loadM(); draw(); },
    form: ফাংশন_placeholder(x) {
      if (x && !HUBDB.user()) { HubAuth.require().then(loadM); return; }
      form = x; draw();
    },
    q: function (x) { Q = String(x).toLowerCase(); draw(); },
    g: function (x) { G = x; draw(); },
    del: function (id) { HUBDB.delMess(id).then(function () { toast('মুছে ফেলা হয়েছে'); load(); loadM(); }); }
  };
  if (window.VW) VW.mess = ['🏠 Mess & Hostel', '<div id="msw"></div>', function () { load(); loadM(); }];
})();
