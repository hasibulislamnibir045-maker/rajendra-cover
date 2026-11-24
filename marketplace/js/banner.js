(async()=>{
 const el=document.getElementById('ban');
 if(!el||!window.SUPABASE_URL||/YOUR_/.test(window.SUPABASE_URL)||typeof supabase==='undefined')return;
 try{
  const c=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await c.from('banners').select('*').eq('active',true).order('sort');
  if(error||!data||!data.length)return;
  const u=p=>c.storage.from('banners').getPublicUrl(p).data.publicUrl;
  el.innerHTML='<div class="bn-t" id="bnt">'+data.map(b=>{
   const i=`<img src="${u(b.image)}" alt="" loading="lazy">`;
   return `<div class="bn-s">${/^https?:\/\//.test(b.link||'')?`<a href="${b.link}" rel="noopener">${i}</a>`:i}</div>`}).join('')+'</div>'
   +(data.length>1?'<div class="bn-d" id="bnd">'+data.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')+'</div>':'');
  el.hidden=false;
  const t=document.getElementById('bnt'),d=[...document.querySelectorAll('#bnd i')];
  t.addEventListener('scroll',()=>{const i=Math.round(t.scrollLeft/t.clientWidth);d.forEach((x,k)=>x.classList.toggle('on',k===i))});
  if(data.length>1&&!matchMedia('(prefers-reduced-motion:reduce)').matches)
   setInterval(()=>{const n=(Math.round(t.scrollLeft/t.clientWidth)+1)%data.length;t.scrollTo({left:n*t.clientWidth,behavior:'smooth'})},4000);
 }catch(e){}
})();
