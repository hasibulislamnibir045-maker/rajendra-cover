const $=i=>document.getElementById(i);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEPTS=['English','Bangla','History','Islamic History and Culture','Islamic Studies','Philosophy','Political Science','Economics','Sociology','Social Work','Psychology','Geography and Environment','Management','Accounting','Marketing','Finance and Banking','Physics','Chemistry','Mathematics','Botany','Zoology','Statistics'];
const tk=n=>'৳'+Number(n||0).toLocaleString('bn-BD');
const opt=(a,v)=>a.map(d=>`<option ${d===v?'selected':''}>${d}</option>`).join('');
let sb,me=null,prof=null,items=[],cond='';
const ok=window.SUPABASE_URL&&!/YOUR_/.test(window.SUPABASE_URL);

function toast(m){const t=document.createElement('div');t.className='tg';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)}
function openM(h){$('mb').innerHTML='<button class="bm-ib x" onclick="closeM()">✕</button>'+h;$('md').hidden=false}
function closeM(){$('md').hidden=true}
function ask(msg,label){return new Promise(r=>{$('cb').innerHTML=`<h2>নিশ্চিত করুন</h2><p style="color:var(--muted)">${msg}</p><div class="row"><button class="btn gh" id="n0">না, থাক</button><button class="btn bad" id="y0">${label}</button></div>`;$('cf').hidden=false;
 $('n0').onclick=()=>{$('cf').hidden=true;r(false)};$('y0').onclick=()=>{$('cf').hidden=true;r(true)}})}
const img=p=>sb.storage.from('book-images').getPublicUrl(p).data.publicUrl;
const shrink=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,900/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);c.toBlob(r,'image/jpeg',.75)};i.src=URL.createObjectURL(f)});

async function init(){
 $('dept').innerHTML='<option value="">সব বিভাগ</option>'+opt(DEPTS);
 if(!ok){$('cfg').hidden=false;$('cfg').innerHTML='⚙️ Supabase সংযোগ বাকি আছে। <b>js/config.js</b> ফাইলে URL ও anon key বসান।';return}
 if(typeof supabase==='undefined'){$('cfg').hidden=false;$('cfg').innerHTML='⚠️ Supabase library লোড হয়নি। index.html-এ script লাইন ঠিক আছে কিনা দেখুন।';return}
 sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
 sb.auth.onAuthStateChange((_e,s)=>{me=s?.user||null;loadProf()});
 const{data}=await sb.auth.getSession();me=data.session?.user||null;await loadProf();load()}
async function loadProf(){prof=null;if(me){const{data}=await sb.from('profiles').select('*').eq('id',me.id).maybeSingle();prof=data}}
async function load(){const{data,error}=await sb.from('products').select('*').order('created_at',{ascending:false});
 if(error)return toast('বই লোড হয়নি: '+error.message);items=data;render()}
function card(p,own){return `<button class="bm-c ${p.status==='sold'?'off':''}" onclick="details('${p.id}')"><div class="im">${p.images[0]?`<img loading="lazy" src="${img(p.images[0])}" alt="">`:'📘'}</div>
 <span class="bd ${p.status==='sold'?'sold':''}">${p.status==='sold'?'বিক্রি হয়ে গেছে':p.condition==='new'?'নতুন':'পুরোনো'}</span>
 <div class="in"><b>${esc(p.title)}</b><small>${esc(p.author||'')}</small><div class="pr">${tk(p.price)}${p.original_price?`<s>${tk(p.original_price)}</s>`:''}</div></div></button>`}
function render(){const q=$('q').value.trim().toLowerCase(),d=$('dept').value;
 const a=items.filter(p=>!p.is_hidden&&(!cond||p.condition===cond)&&(!d||p.department===d)&&(p.title+(p.author||'')+(p.subject||'')).toLowerCase().includes(q));
 const av=a.filter(p=>p.status==='available'),so=a.filter(p=>p.status==='sold');
 $('grid').innerHTML=av.concat(so).map(card).join('');$('empty').hidden=a.length>0}
$('q').oninput=render;$('dept').onchange=render;
$('tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;cond=b.dataset.c;document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));render()};
document.querySelector('.bm-nav').onclick=e=>{const b=e.target.closest('button');if(!b)return;({home:()=>{closeM();scrollTo({top:0,behavior:'smooth'})},sell:()=>sellForm(),mine:mine,acc:account})[b.dataset.n]()};
$('acc').onclick=()=>account();
function need(){if(!ok){toast('আগে Supabase সংযোগ দিন');return false}if(!me){authForm();return false}return true}

function details(id){const p=items.find(x=>x.id===id);if(!p)return;const n=(p.contact||'').replace(/\D/g,'');
 openM(`<div class="gal">${p.images.length?p.images.map(i=>`<img src="${img(i)}" alt="">`).join(''):'<div>📘</div>'}</div><h2>${esc(p.title)}</h2>
 <div style="color:var(--muted)">${esc(p.author||'')}</div><div class="pr" style="font-size:24px">${tk(p.price)}${p.original_price?`<s>${tk(p.original_price)}</s>`:''}</div>
 <div class="chips"><span>${p.condition==='new'?'নতুন':'পুরোনো'}</span>${[p.department,p.subject,p.semester].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}${p.status==='sold'?'<span style="color:var(--bad)">বিক্রি হয়ে গেছে</span>':''}</div>
 <p>${esc(p.description||'')}</p><label>বিক্রেতা</label><b>${esc(p.seller_name||'')}</b>
 ${p.status==='available'?`<a class="btn" style="display:block;text-align:center;text-decoration:none" href="tel:${n}">📞 বিক্রেতাকে কল করুন</a>`:'<p class="bm-note">এই বইটি আর কেনা যাবে না।</p>'}
 ${me&&me.id!==p.seller_id?`<button class="btn gh" onclick="report('${p.id}')">⚑ রিপোর্ট করুন</button>`:''}`)}
async function report(id){const r=prompt('কেন রিপোর্ট করছেন?');if(!r)return;const{error}=await sb.from('reports').insert({product_id:id,reporter_id:me.id,reason:r});toast(error?error.message:'রিপোর্ট পাঠানো হয়েছে')}

function authForm(m='in'){const up=m==='up';
 openM(`<h2>${up?'নতুন অ্যাকাউন্ট':'লগইন'}</h2><form id="af"><label>ইমেইল</label><input id="e" type="email" required>${up?`<label>নাম</label><input id="n" required><label>বিভাগ</label><select id="d">${opt(DEPTS)}</select><div class="row"><div><label>সেশন</label><input id="s" placeholder="2025-2026"></div><div><label>মোবাইল</label><input id="m" type="tel" required></div></div>`:''}
 <label>পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label><input id="pw" type="password" minlength="6" required><button class="btn">${up?'অ্যাকাউন্ট খুলুন':'লগইন করুন'}</button></form>
 <button class="btn gh" onclick="authForm('${up?'in':'up'}')">${up?'আগে থেকেই অ্যাকাউন্ট আছে':'নতুন অ্যাকাউন্ট খুলুন'}</button>`);
 $('af').onsubmit=async e=>{e.preventDefault();
  try{
   if(!sb)throw new Error('Supabase connect hoyni. index.html e supabase script line nei, othoba config.js e bhul ache');
   const em=$('e').value,pw=$('pw').value;let r;
   if(up)r=await sb.auth.signUp({email:em,password:pw,options:{data:{full_name:$('n').value,department:$('d').value,session:$('s').value,mobile:$('m').value}}});
   else r=await sb.auth.signInWithPassword({email:em,password:pw});
   if(r.error)throw r.error;
   if(up&&!r.data.session){alert('Account khola hoyeche kintu login hoyni. Supabase e Confirm email bondho kora ache kina dekho, tarpor "আগে থেকেই অ্যাকাউন্ট আছে" chepe login koro.');return}
   closeM();toast('স্বাগতম!');
  }catch(er){alert('Error: '+(er.message||er))}
 }}
async function account(){if(!ok)return toast('আগে Supabase সংযোগ দিন');if(!me)return authForm();if(!prof)await loadProf();
 openM(`<h2>আমার প্রোফাইল</h2>${prof?.is_blocked?'<p class="bm-note" style="color:var(--bad)">আপনার অ্যাকাউন্ট ব্লক করা আছে।</p>':''}<form id="pf"><label>ইমেইল</label><input value="${esc(me.email)}" disabled>
 <label>নাম</label><input id="n" value="${esc(prof?.full_name)}" required><label>বিভাগ</label><select id="d">${opt(DEPTS,prof?.department)}</select>
 <div class="row"><div><label>সেশন</label><input id="s" value="${esc(prof?.session)}"></div><div><label>মোবাইল</label><input id="m" type="tel" value="${esc(prof?.mobile)}" required></div></div><button class="btn">সেভ করুন</button></form>
 <button class="btn gh" id="lo">লগআউট</button>`);
 $('pf').onsubmit=async e=>{e.preventDefault();const{error}=await sb.from('profiles').update({full_name:$('n').value,department:$('d').value,session:$('s').value,mobile:$('m').value}).eq('id',me.id);if(error)return toast(error.message);await loadProf();toast('সেভ হয়েছে')};
 $('lo').onclick=async()=>{await sb.auth.signOut();closeM();toast('লগআউট হয়েছে')}}

function sellForm(p){if(!need())return;if(prof?.is_blocked)return toast('আপনার অ্যাকাউন্ট ব্লক করা আছে');const v=p||{};
 openM(`<h2>${p?'বই এডিট করুন':'বই বিক্রির জন্য তুলুন'}</h2><form id="sf"><label>বইয়ের নাম</label><input id="t" value="${esc(v.title)}" required><label>লেখক</label><input id="a" value="${esc(v.author)}">
 <div class="row"><div><label>বিভাগ</label><select id="d">${opt(DEPTS,v.department||prof?.department)}</select></div><div><label>বিষয়</label><input id="su" value="${esc(v.subject)}"></div></div>
 <div class="row"><div><label>সেমিস্টার/বর্ষ</label><input id="se" value="${esc(v.semester)}"></div><div><label>অবস্থা</label><select id="c"><option value="used" ${v.condition==='used'?'selected':''}>পুরোনো (Second Hand)</option><option value="new" ${v.condition==='new'?'selected':''}>নতুন (Brand New)</option></select></div></div>
 <div class="row"><div><label>আসল দাম (৳)</label><input id="op" type="number" min="0" value="${v.original_price??''}"></div><div><label>বিক্রয় মূল্য (৳)</label><input id="pr" type="number" min="0" value="${v.price??''}" required></div></div>
 <label>বইয়ের ছবি (সর্বোচ্চ ৪টি)${p?' · নতুন ছবি দিলে আগেরগুলো বদলে যাবে':''}</label><input id="im" type="file" accept="image/*" multiple>
 <label>বিবরণ</label><textarea id="ds">${esc(v.description)}</textarea>
 <div class="row"><div><label>বিক্রেতার নাম</label><input id="sn" value="${esc(v.seller_name||prof?.full_name)}" required></div><div><label>যোগাযোগ নম্বর</label><input id="ct" type="tel" value="${esc(v.contact||prof?.mobile)}" required></div></div>
 <button class="btn" id="sb">${p?'আপডেট করুন':'বই তুলুন'}</button></form>`);
 $('sf').onsubmit=async e=>{e.preventDefault();const b=$('sb');b.disabled=true;b.textContent='অপেক্ষা করুন…';
  try{const row={title:$('t').value,author:$('a').value,department:$('d').value,subject:$('su').value,semester:$('se').value,condition:$('c').value,original_price:$('op').value||null,price:$('pr').value,description:$('ds').value,seller_name:$('sn').value,contact:$('ct').value};
   const fs=[...$('im').files].slice(0,4);
   if(fs.length){const ps=[];for(const f of fs){const path=`${me.id}/${Date.now()}-${ps.length}.jpg`,{error}=await sb.storage.from('book-images').upload(path,await shrink(f),{contentType:'image/jpeg'});if(error)throw error;ps.push(path)}row.images=ps}
   let r;if(p){r=await sb.from('products').update(row).eq('id',p.id);if(!r.error&&row.images&&p.images.length)sb.storage.from('book-images').remove(p.images)}
   else r=await sb.from('products').insert({...row,seller_id:me.id});
   if(r.error)throw r.error;closeM();toast(p?'আপডেট হয়েছে':'বইটি মার্কেটপ্লেসে যুক্ত হয়েছে');load()}
  catch(er){toast(er.message);b.disabled=false;b.textContent='আবার চেষ্টা করুন'}}}

async function mine(){if(!need())return;await load();const a=items.filter(p=>p.seller_id===me.id);
 const st=p=>p.is_hidden?`<span class="bd hid" style="position:static">Admin লুকিয়েছেন${p.hidden_reason?': '+esc(p.hidden_reason):''}</span>`:p.status==='sold'?'<span class="bd sold" style="position:static">বিক্রি হয়েছে</span>':'<span class="bd" style="position:static">বিক্রির জন্য আছে</span>';
 openM(`<h2>আমার বই</h2><small style="color:var(--muted)">মোট ${a.length} · বিক্রির জন্য ${a.filter(p=>p.status==='available').length} · বিক্রি হয়েছে ${a.filter(p=>p.status==='sold').length}</small>
 ${a.map(p=>`<div class="mine">${p.images[0]?`<img src="${img(p.images[0])}" alt="">`:'<div class="ph"></div>'}<div><b>${esc(p.title)}</b><br>${tk(p.price)} ${st(p)}
 <div class="acts">${p.status==='available'?`<button onclick="editP('${p.id}')">✏️ এডিট</button><button onclick="markSold('${p.id}')">✅ বিক্রি হয়েছে</button>`:''}<button class="dl" onclick="delP('${p.id}')">🗑 ${p.status==='sold'?'তালিকা থেকে সরান':'মুছুন'}</button></div></div></div>`).join('')||'<p class="bm-note">আপনি এখনো কোনো বই তোলেননি।</p>'}
 <button class="btn" onclick="sellForm()">＋ নতুন বই তুলুন</button>`)}
const editP=id=>sellForm(items.find(x=>x.id===id));
async function markSold(id){const p=items.find(x=>x.id===id);if(!await ask(`«${esc(p.title)}» বিক্রি হয়ে গেছে বলে চিহ্নিত করবেন? এরপর নতুন অর্ডার নেওয়া যাবে না।`,'হ্যাঁ, বিক্রি হয়েছে'))return;
 const{error}=await sb.from('products').update({status:'sold'}).eq('id',id);if(error)return toast(error.message);toast('বইটি বিক্রি হয়েছে হিসেবে চিহ্নিত');mine()}
async function delP(id){const p=items.find(x=>x.id===id);if(!await ask(`«${esc(p.title)}» স্থায়ীভাবে মুছবেন? অর্ডারের ইতিহাস থেকে যাবে, কিন্তু বইটি আর ফেরানো যাবে না।`,'হ্যাঁ, মুছুন'))return;
 const{error}=await sb.rpc('delete_product',{p_id:id});if(error)return toast(error.message);if(p.images.length)sb.storage.from('book-images').remove(p.images);toast('মুছে ফেলা হয়েছে');mine()}
init();
