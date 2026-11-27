var MS_APP={};
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
  function bn(n){return String(n).replace(/\d/g,function(d){return'\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]})}
  MS_APP.esc=esc;MS_APP.bn=bn;
  MS_APP.toast=function(m){var t=document.createElement('div');t.className='hub-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3200)};
  MS_APP.v=function(id){var e=document.getElementById(id);return e?String(e.value).trim():''};
  MS_APP.meCard=function(u){
    var nm=String((u&&u.user_metadata&&u.user_metadata.full_name)||((u&&u.email)||''));
    return '<div class="hub-card tme" style="display:flex;align-items:center;gap:14px">'+
    '<div class="me-av">'+esc(nm.charAt(0).toUpperCase())+'</div>'+
    '<div><h4 style="margin:0">'+esc(nm)+'</h4>'+
    '<p style="font-size:13px">'+esc((u&&u.email)||'')+'</p>'+
    '<small style="color:var(--muted,#a6a9cf);font-size:12px">\u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F \u098F\u0987 \u099F\u09CD\u09AF\u09BE\u09AC \u09A5\u09C7\u0995\u09C7 \u09AA\u09B0\u09BF\u099A\u09BE\u09B2\u09A8\u09BE \u0995\u09B0\u09C1\u09A8</small></div></div>';
  };
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
    if(x.seats)r.push('\uD83E\uDE9B \u0996\u09BE\u09B2\u09BF: '+bn(x.seats)+' \u09B8\u09BF\u099F');
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
  MS_APP.form=function(){
    return '<div class="hub-form" style="max-width:640px;margin:0 auto;background:#1b1846;border:1px solid rgba(139,124,248,.28);border-radius:18px;padding:22px">'+
    '<form id="msF" onsubmit="MS_SAVE(event)">'+
    '<label>\u09AE\u09C7\u09B8 / \u09B9\u09CB\u09B8\u09CD\u099F\u09C7\u09B2\u09C7\u09B0 \u09A8\u09BE\u09AE *</label><input id="ms_t" required>'+
    '<div class="hub-row2"><div><label>\u09A7\u09B0\u09A8</label><select id="ms_cond"><option>\u09AE\u09C7\u09B8</option><option>\u09B9\u09CB\u09B8\u09CD\u099F\u09C7\u09B2</option><option>\u09B8\u09BE\u09AC\u09B2\u09C7\u099F</option><option>\u09AB\u09CD\u09B2\u09CD\u09AF\u09BE\u099F</option></select></div>'+
    '<div><label>\u0995\u09C7\u09A8\u09C7 \u09A8\u09BF\u09A8</label><select id="ms_g"><option>\u099B\u09C7\u09B2\u09C7</option><option>\u09AE\u09C7\u09DF\u09C7</option><option>\u09AF\u09C7 \u0995\u09C7\u0989</option></select></div></div>'+
    '<div class="hub-row2"><div><label>\u0996\u09BE\u09B2\u09BF \u09B8\u09BF\u099F</label><input id="ms_seats" type="number" min="1"></div>'+
    '<div><label>\u09A6\u09BE\u09AE / \u09B8\u09BF\u099F</label><input id="ms_price"></div></div>'+
    '<label>\u098F\u09B2\u09BE\u0995\u09BE *</label><input id="ms_area" required>'+
    '<div class="hub-row2"><div><label>\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 *</label><input id="ms_m" type="tel" maxlength="11" required></div>'+
    '<div><label>\u09AE\u09CD\u09AF\u09BE\u09AA</label><input id="ms_loc" type="url" placeholder="https://maps.app.goo.gl/..."></div></div>'+
    '<label>\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4</label><textarea id="ms_note"></textarea>'+
    '<button type="submit" class="hub-btn">\u2705 \u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C1\u09A8</button></form></div>';
  };
})();
