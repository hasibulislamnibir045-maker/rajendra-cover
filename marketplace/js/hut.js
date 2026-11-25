/* Campus Hut · Dhap 2: category, order flow, approval screen. app.js-er PORE load hoy. */
let cats=[],cat='';
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
 ${p.status!=='available'?'<p class="bm-note">এটি আর কেনা যাবে না।</p>':me&&me.id===p.seller_id?'<p class="bm-note">এটি আপনার নিজের পোস্ট।</p>':`<button class="btn" onclick="orderForm('${p.id}')">🛒 অর্ডার করুন</button><p class="bm-note" style="margin-top:10px">ক্যাশ অন ডেলিভারি · ফরিদপুরের মধ্যে। বিক্রেতা নিশ্চিত করলে যোগাযোগের নম্বর পাবেন।</p>`}
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

const _mine=mine;mine=async function(){if(!need())return;await _mine();
 const h=items.filter(p=>p.seller_id===me.id&&p.approval!=='approved').map(p=>`<div class="od"><b>${esc(p.title)}</b><span class="st ${p.approval==='rejected'?'cancelled':'new'}">${p.approval==='rejected'?'বাতিল':'অনুমোদনের অপেক্ষায়'}</span>${p.reject_reason?`<div><small>কারণ: ${esc(p.reject_reason)}</small></div>`:''}</div>`).join('');
 $('mb').insertAdjacentHTML('beforeend',(h?'<h3 class="sh">অনুমোদনের অপেক্ষায়</h3>'+h:'')+'<button class="btn gh" onclick="ordersView()">📋 আমার অর্ডার</button>')};

if(sb)loadCats().then(()=>{if(items.length)render()});
