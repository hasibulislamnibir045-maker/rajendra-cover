var MS_APP={};
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function bn(n){return String(n).replace(/\d/g,function(d){return'\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]})}
  MS_APP.esc=esc;MS_APP.bn=bn;
  MS_APP.toast=function(m){var t=document.createElement('div');t.className='hub-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3200)};
  MS_APP.v=function(id){var e=document.getElementById(id);return e?String(e.value).trim():''};
  MS_APP.ago=function(ts){
    if(!ts)return'';
    var h=Math.floor((Date.now()-new Date(ts).getTime())/36e5);
    if(h<1)return'\u098F\u0987\u09AE\u09BE\u09A4\u09CD\u09B0';
    if(h<24)return bn(h)+' \u0998\u09A3\u09CD\u099F\u09BE \u0986\u0997\u09C7';
    var d=Math.floor(h/24);
    return d<30?bn(d)+' \u09A6\u09BF\u09A8 \u0986\u0997\u09C7':bn(Math.floor(d/30))+' \u09AE\u09BE\u09B8 \u0986\u0997\u09C7';
  };
  MS_APP.contact=function(m){
    if(!m)return'';
    return '<div class="hub-tools" style="margin-top:12px">'+
      '<a class="hub-btn2" href="tel:'+esc(m)+'">\uD83D\uDCDE \u0995\u09B2</a>'+
      '<a class="hub-btn2" target="_blank" rel="noopener" href="https://wa.me/88'+esc(String(m).replace(/^0/,''))+'">\uD83D\uDCAC WhatsApp</a></div>';
  };
  MS_APP.card=function(x){
    var r=[];
    if(x.g)r.push('\uD83D\uDC65 '+esc(x.g));
    if(x.seats)r.push('\uD83E\uDE9B \u0996\u09BE\u09B2\u09BF \u09B8\u09BF\u099F: '+bn(x.seats));
    if(x.price)r.push('\uD83D\uDCB0 '+esc(x.price)+' / \u09B8\u09BF\u099F');
    if(x.area)r.push('\uD83D\uDCCD '+esc(x.area));
    if(x.note)r.push('\uD83D\uDCDD '+esc(x.note));
    return '<div class="hub-card"><div class="hub-card-top"><span class="hub-chip">\uD83C\uDFE0 '+esc(x.cond||'\u09AE\u09C7\u09B8')+'</span>'+
      '<span class="hub-date">'+MS_APP.ago(x.ts)+'</span></div><h4>'+esc(x.t)+'</h4>'+
      '<p>'+r.join('<br>')+'</p>'+MS_APP.contact(x.m)+'</div>';
  };
  MS_APP.mineCard=function(x){
    return '<div class="hub-card"><h4>'+esc(x.t)+'</h4><p>'+esc([x.cond,x.area,x.seats?x.seats+' \u09B8\u09BF\u099F':''].filter(Boolean).join(' \u00B7 '))+'</p>'+
      '<div class="hub-tools"><button class="hub-btn2" onclick="MS_DEL(\''+x.id+'\')">\uD83D\uDDD1\uFE0F \u09AE\u09C1\u099B\u09C1\u09A8</button></div></div>';
  };
})();
