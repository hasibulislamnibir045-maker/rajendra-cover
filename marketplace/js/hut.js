/* Campus Hut · Dhap 2: category, order flow, approval screen. app.js-er PORE load hoy. */
let cats=[],cat='';
const IC={"home": "<path d=\"M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/>", "store": "<path d=\"M4 9l1-5h14l1 5M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0M5 12v8h14v-8M10 20v-4h4v4\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21c0-4 4-6 8-6s8 2 8 6\"/>", "back": "<path d=\"M19 12H5M12 19l-7-7 7-7\"/>", "search": "<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M21 21l-4.3-4.3\"/>", "list": "<path d=\"M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01\"/>", "gear": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1\"/>", "logout": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9\"/>", "edit": "<path d=\"M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/>"};const ic=n=>`<svg class="ic" viewBox="0 0 24 24">${IC[n]}</svg>`;
const ST={new:'অপেক্ষমাণ',accepted:'নিশ্চিত',processing:'প্রস্তুত হচ্ছে',ready:'প্রস্তুত',completed:'সম্পন্ন',cancelled:'বাতিল'};
const waLink=(n,t)=>'https://wa.me/'+String(n).replace(/\D/g,'').replace(/^0/,'880')+'?text='+encodeURIComponent(t);
const bigBtn='class="btn" style="display:block;text-align:center;text-decoration:none"';

async function loadCats(){
 if(!sb)return;const{data}=await sb.from('categories').select('*').eq('active',true).order('sort');cats=data||[];
 const el=$('cats');if(!cats.length){el.hidden=true;return}
 el.hidden=false;el.innerHTML=cats.map(c=>`<button class="ct" data-k="${esc(c.name)}"><i>${esc(c.icon)}</i><span>${esc(c.name)}</span></button>`).join('');
 el.onclick=e=>{const b=e.target.closest('.ct');if(!b)return;cat=cat===b.dataset.k?'':b.dataset.k;[...el.children].forEach(x=>x.classList.toggle('on',x.dataset.k===cat));render()}}

render=function(){const q=$('q').value.trim().toLowerCase(),d=$('dept').value;
 const a=items.filter(p=>p.approval==='approved'&&!p.is_hidden&&(!cond||p.condition===cond)&&(!d||p.department===d)&&(!cat||p.category===cat)&&(p.title+(p.author||'')+(p.subject||'')).toLowerCase().includes(q));
 $('grid').innerHTML=a.filter(p=>p.status==='available').concat(a.filter(p=>p.status==='sold')).map(card).join('');$('empty').hidden=a.length>0};

details=function(id){const p=items.find(x=>x.id===id);if(!p)return;
 openM(`<div class="gal">${p.images.length?p.images.map(i=>`<img src="${img(i)}" alt="">`).join(''):'<div>📘</div>'}</div><h2>${esc(p.title)}</h2>
 <div style="color:var(--muted)">${esc(p.author||'')}</div><div class="pr" style="font-size:26px">${tk(p.price)}${p.original_price?`<s>${tk(p.original_price)}</s>`:''}</div>
 <div class="chips"><span>${p.condition==='new'?'নতুন':'পুরোনো'}</span>${[p.category,p.department,p.subject,p.semester].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}${p.status==='sold'?'<span style="color:var(--bad)">বিক্রি হয়ে গেছে</span>':''}</div>
 <p>${esc(p.description||'')}</p><label>বিক্রেতা</label><b>${esc(p.seller_name||'')}</b>
 ${p.status!=='available'?'<p class="bm-note">এটি আর কেনা যাবে না।</p>':p.kind==='rokomari'?(/^https?:\/\//.test(p.affiliate_url||'')?`<a ${bigBtn} href="${esc(p.affiliate_url)}" target="_blank" rel="noopener sponsored">রকমারিতে কিনুন</a>`:''):me&&me.id===p.seller_id?'<p class="bm-note">এটি আপনার নিজের পোস্ট।</p>':`<button class="btn" onclick="orderForm('${p.id}')">🛒 অর্ডার করুন</button><p class="bm-note" style="margin-top:10px">ক্যাশ অন ডেলিভারি · ফরিদপুরের মধ্যে। বিক্রেতা নিশ্চিত করলে যোগাযোগের নম্বর পাবেন।</p>`}
 ${me&&me.id!==p.seller_id?`<button class="btn gh" onclick="report('${p.id}')">⚑ রিপোর্ট করুন</button>`:''}`)};

function orderForm(id){if(!need())return;const p=items.find(x=>x.id===id);
 openM(`<h2>অর্ডার করুন</h2><p>${esc(p.title)} · <b>${tk(p.price)}</b></p><form id="of"><label>আপনার নাম</label><input id="on" value="${esc(prof?.full_name)}" required>
 <label>মোবাইল নম্বর</label><input id="om" type="tel" value="${esc(prof?.mobile)}" required><label>ঠিকানা (ফরিদপুর) বা কোথায় দেখা করবেন</label><input id="oa" required>
 <label>নোট (ঐচ্ছিক)</label><textarea id="oo"></textarea><button class="btn" id="ob">অর্ডার পাঠান</button></form>`);
 $('of').onsubmit=async e=>{e.preventDefault();const b=$('ob');b.disabled=true;
  const{error}=await sb.rpc('place_order',{p_product:id,p_name:$('on').value,p_mobile:$('om').value,p_delivery:'cod',p_address:$('oa').value,p_note:$('oo').value});
  if(error){toast(error.message);b.disabled=false;return}toast('অর্ডার পাঠানো হয়েছে');ordersView()}}

async function ordersView(){if(!need())return;
 const{data,error}=await sb.from('orders').select('*,order_items(title,price)').order('created_at',{ascending:false});if(error)return toast(error.message);
 const row=(o,sel)=>{const s=o.status,a=[];
  if(sel&&s==='new')a.push(['accepted','✅ নিশ্চিত করুন'],['cancelled','❌ বাতিল']);
  if(sel&&s==='accepted')a.push(['completed','📦 লেনদেন সম্পন্ন']);
  if(!sel&&s==='new')a.push(['cancelled','❌ অর্ডার বাতিল']);
  return `<div class="od"><b>${o.order_items.map(i=>esc(i.title)).join(', ')}</b><span class="st ${s}">${ST[s]||s}</span>
  <div><small>${sel?'ক্রেতা: '+esc(o.buyer_name)+' · ':''}ঠিকানা: ${esc(o.address||'')}</small></div>
  <div class="acts">${a.map(x=>`<button onclick="setSt('${o.id}','${x[0]}')">${x[1]}</button>`).join('')}${s==='accepted'||s==='completed'?`<button onclick="contacts('${o.id}')">📞 যোগাযোগ</button>`:''}</div></div>`};
 const mo=data.filter(o=>o.buyer_id===me.id),go=data.filter(o=>o.seller_id===me.id);
 openM(`<h2>অর্ডার</h2><h3 class="sh">আমি যা কিনছি</h3>${mo.map(o=>row(o,0)).join('')||'<p class="bm-note">কোনো অর্ডার নেই।</p>'}
 <h3 class="sh">আমার পোস্টে আসা অর্ডার</h3>${go.map(o=>row(o,1)).join('')||'<p class="bm-note">কোনো অর্ডার আসেনি।</p>'}`)}

async function setSt(id,s){
 const m={accepted:'নিশ্চিত করবেন? এরপর দুজনের নম্বর দুজনকে দেখানো হবে।',cancelled:'অর্ডারটি বাতিল করবেন?',completed:'লেনদেন সম্পন্ন হয়েছে? পণ্যটি "বিক্রি হয়েছে" হয়ে যাবে।'}[s];
 if(!await ask(m,'হ্যাঁ'))return;const{error}=await sb.rpc('set_order_status',{p_id:id,p_status:s});
 if(error)return toast(error.message);toast('আপডেট হয়েছে');await load();ordersView()}

async function contacts(id){const{data,error}=await sb.rpc('order_contacts',{p_order:id});if(error)return toast(error.message);
 openM('<h2>যোগাযোগ</h2>'+data.map(c=>`<div class="od"><small>${c.who==='seller'?'বিক্রেতা':'ক্রেতা'}</small><br><b>${esc(c.name)}</b> · ${esc(c.mobile)}<a ${bigBtn} href="tel:${esc(c.mobile)}">📞 কল করুন</a></div>`).join('')+'<button class="btn gh" onclick="ordersView()">← অর্ডারে ফিরুন</button>')}

async function pendingScreen(title){const s={};
 try{const{data}=await sb.from('app_settings').select('key,value').like('key','pub_%');(data||[]).forEach(r=>s[r.key]=r.value)}catch(e){}
 openM(`<h2>✅ পোস্ট জমা হয়েছে</h2><p>অ্যাডমিন যাচাই করে অনুমোদন দিলে সাইটে দেখা যাবে। ${esc(s.pub_approval_text||'সাধারণত ৩০–৪০ মিনিট')} সময় লাগে।</p>
 ${s.pub_whatsapp?`<a ${bigBtn} href="${waLink(s.pub_whatsapp,'আসসালামু আলাইকুম, আমি "'+title+'" পোস্ট করেছি। অনুমোদনের অনুরোধ।')}">💬 WhatsApp-এ অ্যাডমিনকে জানান</a>`:''}<button class="btn gh" onclick="closeM()">ঠিক আছে</button>`)}

const _toast=toast;toast=function(m){if(m==='বইটি মার্কেটপ্লেসে যুক্ত হয়েছে'){pendingScreen($('t')?$('t').value:'');return}_toast(m)};

const _sell=sellForm;sellForm=function(p){_sell(p);const f=$('sf');if(!f||$('cat'))return;
 f.insertAdjacentHTML('afterbegin','<label>ক্যাটাগরি</label><select id="cat">'+cats.map(c=>`<option ${p&&c.name===p.category?'selected':''}>${esc(c.name)}</option>`).join('')+'</select>');
 $('mb').querySelectorAll('h2,label').forEach(n=>n.textContent=n.textContent.replace('বইয়ের','পণ্যের').replace('বই ','পণ্য '))};

/* আমার দোকান: nijer shob pronno, order, bikroy ekhane */
mine=async function(){if(!need())return;await load();
 const mp=items.filter(p=>p.seller_id===me.id),{data}=await sb.from('orders').select('status,order_items(price,qty)').eq('seller_id',me.id),o=data||[];
 const earn=o.filter(x=>x.status==='completed').reduce((t,x)=>t+x.order_items.reduce((a,i)=>a+i.price*i.qty,0),0),nw=o.filter(x=>x.status==='new').length,n=f=>mp.filter(f).length;
 const c=[['📦','মোট পণ্য',mp.length],['🟢','বিক্রির জন্য',n(p=>p.approval==='approved'&&p.status==='available')],['✅','বিক্রি হয়েছে',n(p=>p.status==='sold')],['⏳','অপেক্ষায়',n(p=>p.approval==='pending')],['📥','নতুন অর্ডার',nw],['💰','মোট বিক্রয়',tk(earn)]];
 const sp=p=>p.is_hidden?`<span class="st cancelled">Admin লুকিয়েছেন${p.hidden_reason?': '+esc(p.hidden_reason):''}</span>`:p.approval==='pending'?'<span class="st new">অনুমোদনের অপেক্ষায়</span>':p.approval==='rejected'?`<span class="st cancelled">বাতিল${p.reject_reason?': '+esc(p.reject_reason):''}</span>`:p.status==='sold'?'<span class="st completed">বিক্রি হয়েছে</span>':'<span class="st accepted">বিক্রির জন্য আছে</span>';
 openM(`<div class="shop"><i>🏪</i><div><h2>${esc(prof?.full_name||'আমার')}-এর দোকান</h2><small>${esc(prof?.department||'')}</small></div></div>
 <div class="dash">${c.map(x=>`<div><i>${x[0]}</i><b>${x[2]}</b><small>${x[1]}</small></div>`).join('')}</div>
 <div class="row"><button class="btn" onclick="sellForm()">＋ নতুন পণ্য</button><button class="btn gh" onclick="ordersView()">🧾 অর্ডার${nw?' ('+nw+')':''}</button></div>
 <h3 class="sh">আমার পণ্য</h3>${mp.map(p=>`<div class="mine">${p.images[0]?`<img src="${img(p.images[0])}" alt="">`:'<div class="ph"></div>'}<div><b>${esc(p.title)}</b><br>${tk(p.price)} ${sp(p)}
 <div class="acts">${p.status==='available'?`<button onclick="editP('${p.id}')">✏️ এডিট</button><button onclick="markSold('${p.id}')">✅ বিক্রি হয়েছে</button>`:''}<button class="dl" onclick="delP('${p.id}')">🗑 ${p.status==='sold'?'সরান':'মুছুন'}</button></div></div></div>`).join('')||'<p class="bm-note">আপনার দোকানে এখনো কোনো পণ্য নেই। ওপরের ＋ বোতামে চাপুন।</p>'}`)};
const _ov=ordersView;ordersView=async function(){await _ov();if($('mb').querySelector('h2'))$('mb').insertAdjacentHTML('beforeend','<button class="btn gh" onclick="mine()">← আমার দোকান</button>')};
/* প্রোফাইল */
const _accEdit=account;
const editProfile=async()=>{await _accEdit();$('mb').insertAdjacentHTML('beforeend','<button class="btn gh" onclick="account()">← প্রোফাইল</button>')};
account=async function(){
 if(!ok)return toast('আগে Supabase সংযোগ দিন');if(!me)return authForm();if(!prof)await loadProf();
 const{data}=await sb.from('orders').select('buyer_id,seller_id,status'),o=data||[],mp=items.filter(p=>p.seller_id===me.id),nm=prof?.full_name||'ইউজার';
 const m=(i,t,f,c)=>`<button class="mn ${c||''}" onclick="${f}"><span>${ic(i)}</span>${t}<em>›</em></button>`;
 openM(`<div class="pf"><div class="av">${esc(nm.trim().charAt(0).toUpperCase())}</div><h2>${esc(nm)}</h2><small>${esc(me.email)}</small>
 <div class="chips">${[prof?.department,prof?.session&&'সেশন '+prof.session,prof?.role==='admin'&&'অ্যাডমিন'].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
 <div class="dash"><div><b>${mp.length}</b><small>আমার পোস্ট</small></div><div><b>${o.filter(x=>x.buyer_id===me.id).length}</b><small>আমার কেনা</small></div><div><b>${o.filter(x=>x.seller_id===me.id&&x.status==='new').length}</b><small>নতুন অর্ডার</small></div></div>
 ${m('store','আমার দোকান','mine()')}${m('list','আমার অর্ডার','ordersView()')}${m('plus','নতুন পণ্য বিক্রি করুন','sellForm()')}${m('edit','প্রোফাইল এডিট','editProfile()')}
 ${prof?.role==='admin'?`<a class="mn" href="admin.html"><span>${ic('gear')}</span>অ্যাডমিন ড্যাশবোর্ড<em>›</em></a>`:''}
 ${m('logout','লগআউট',"sb.auth.signOut().then(()=>{closeM();toast('লগআউট হয়েছে')})",'red')}`)};
card=function(p){const off=p.original_price>p.price?Math.round((1-p.price/p.original_price)*100):0,sold=p.status==='sold';
 return `<button class="bm-c ${sold?'off':''}" onclick="details('${p.id}')"><div class="im">${p.images[0]?`<img loading="lazy" src="${img(p.images[0])}" alt="">`:'📦'}</div>${off&&!sold?`<span class="ds">-${off}%</span>`:''}
 <span class="bd ${sold?'sold':''}">${sold?'বিক্রি হয়ে গেছে':p.kind==='shop'?'শপ':p.kind==='rokomari'?'রকমারি':p.condition==='new'?'নতুন':'পুরোনো'}</span>
 <div class="in"><b>${esc(p.title)}</b><small>${esc(p.category||p.author||'')}</small><div class="pr">${tk(p.price)}${p.original_price?`<s>${tk(p.original_price)}</s>`:''}</div>${p.free_delivery?'<span class="fd">ফ্রি ডেলিভারি</span>':''}
 <span class="cta">${sold?'কেনা যাবে না':p.kind==='rokomari'?'রকমারিতে দেখুন':'অর্ডার করুন'}</span></div></button>`};

if(sb)loadCats().then(()=>{if(items.length)render()});
