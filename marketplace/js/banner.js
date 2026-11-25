(async()=>{
 if(!window.SUPABASE_URL||/YOUR_/.test(window.SUPABASE_URL)||typeof supabase==='undefined')return;
 try{
  const c=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await c.from('banners').select('*').eq('active',true).order('sort');
  if(error||!data||!data.length)return;
  const u=p=>c.storage.from('banners').getPublicUrl(p).data.publicUrl;
  const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  [['top','ban'],['mid','ban2'],['bottom','ban3']].forEach(([pos,id])=>{
   const el=document.getElementById(id),list=data.filter(b=>(b.position||'top')===pos);
   if(!el||!list.length)return;
   el.innerHTML='<div class="bn-t">'+list.map(b=>{
    const i=`<img src="${u(b.image)}" alt="" loading="lazy" onerror="this.closest('.bn-s').remove()">`;
    return `<div class="bn-s">${/^https?:\/\//.test(b.link||'')?`<a href="${b.link}" rel="noopener">${i}</a>`:i}</div>`}).join('')+'</div>'
    +(list.length>1?'<div class="bn-d">'+list.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')+'</div>':'');
   el.hidden=false;
   const t=el.querySelector('.bn-t'),d=[...el.querySelectorAll('.bn-d i')];
   const at=()=>Math.round(t.scrollLeft/t.clientWidth);
   t.addEventListener('scroll',()=>d.forEach((x,k)=>x.classList.toggle('on',k===at())));
   if(list.length>1&&!calm)setInterval(()=>t.scrollTo({left:((at()+1)%list.length)*t.clientWidth,behavior:'smooth'}),4000);
  });
 }catch(e){}
})();
