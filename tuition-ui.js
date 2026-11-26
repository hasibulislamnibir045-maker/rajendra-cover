/* ===== Tuition Hub UI kit (cards, helpers) ===== */
var TU_APP={};
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function bn(n){return String(n).replace(/\d/g,function(d){return'\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]})}
  TU_APP.esc=esc;TU_APP.bn=bn;
  TU_APP.toast=function(m){var t=document.createElement('div');t.className='hub-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3200)};
  TU_APP.v=function(id){var e=document.getElementById(id);return e?String(e.value).trim():''};
  TU_APP.contact=function(m){
    if(!m)return'';
    return '<div class="hub-tools" style="margin-top:12px">'+
      '<a class="hub-btn2" style="text-decoration:none" href="tel:'+esc(m)+'">\uD83D\uDCDE \u0995\u09B2</a>'+
      '<a class="hub-btn2" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/88'+esc(String(m).replace(/^0/,''))+'">\uD83D\uDCAC WhatsApp</a></div>';
  };
  TU_APP.tCard=function(x){
    return '<div class="hub-card"><div class="hub-card-top"><span class="hub-chip">'+esc(x.ins||'\u099F\u09BF\u0989\u099F\u09B0')+'</span><span class="hub-chip">'+esc(x.cls||'')+'</span></div>'+
      '<h4>'+esc(x.n)+'</h4><p>'+
      (x.sub?'\uD83D\uDCDD '+esc(x.sub)+'<br>':'')+
      (x.area?'\uD83D\uDCCD '+esc(x.area)+'<br>':'')+
      (x.sal?'\uD83D\uDCB0 '+esc(x.sal)+'<br>':'')+
      (x.exp?'\u23F3 '+esc(x.exp):'')+'</p>'+TU_APP.contact(x.m)+'</div>';
  };
  TU_APP.pCard=function(x){
    return '<div class="hub-card"><div class="hub-card-top"><span class="hub-chip">'+esc(x.cls||'')+'</span><span class="hub-chip">'+esc(x.med||'')+'</span></div>'+
      '<h4>'+esc(x.n)+'</h4><p>'+
      (x.sub?'\uD83D\uDCDD '+esc(x.sub)+'<br>':'')+
      (x.area?'\uD83D\uDCCD '+esc(x.area)+'<br>':'')+
      (x.days?'\uD83D\uDCC5 \u09B8\u09AA\u09CD\u09A4\u09BE\u09B9\u09C7 '+bn(x.days)+' \u09A6\u09BF\u09A8<br>':'')+
      (x.sal?'\uD83D\uDCB0 '+esc(x.sal):'')+'</p>'+TU_APP.contact(x.m)+'</div>';
  };
  TU_APP.mCard=function(x,kind){
    return '<div class="hub-card"><h4>'+esc(x.n)+'</h4><p>'+esc([x.cls,x.sub,x.area].filter(Boolean).join(' \u00B7 '))+'</p>'+
      '<div class="hub-tools"><button class="hub-btn2" onclick="'+(kind==='t'?'delT':'delP')+'(\''+x.id+'\')">\uD83D\uDDD1\uFE0F \u09AE\u09C1\u099B\u09C1\u09A8</button></div></div>';
  };
})();
