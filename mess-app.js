/* ===== Mess & Hostel page app — ONE shared login ===== */
(function(){
  var A=MS_APP,L=[],MINE=[],tab='feed',form=0,busy=0,msg='',Q='',G='';
  function txt(){
    document.getElementById('heroH').innerHTML='\u09B8\u09BF\u099F \u09B9\u09B2\u09CB \u09AA\u09A1\u09BC\u09BE \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC\u09BE\u0993 \u0995\u09CD\u09B2\u09C7\u099C\u09C7\u09B0 \u0997\u09A8\u09CD\u09A7\u09C7\u0964 <em>\u09AC\u09C7\u09B6 \u09AC\u09CD\u09AF\u09BE\u099A\u09BE\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u0996\u09C1\u0981\u099C\u09C7 \u09A8\u09BF\u09A8\u0964</em>';
    document.getElementById('heroP').textContent='\u09AE\u09C7\u09B8, \u09B9\u09CB\u09B8\u09CD\u099F\u09C7\u09B2 \u09AC\u09BE \u09AB\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09C7\u09B0 \u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8 \u2014 \u09B8\u09AC\u09BE\u0987 \u098F\u0995 \u09B2\u0997\u0987\u09A8\u09C7\u0987 \u09AA\u09CB\u09B7\u09CD\u099F \u0993 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE\u0964';
    document.getElementById('stML').textContent='\u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8';
    document.getElementById('loadLbl').textContent='\u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u0986\u09A8\u099B\u09C7\u2026';
  }
  function load(){
    if(!window.HUBDB)return;
    busy=1;msg='';draw();
    HUBDB.getMess().then(function(r){L=r;busy=0;var s=document.getElementById('stM');if(s)s.textContent=A.bn(L.length);draw()})
    .catch(function(e){msg=e.message;busy=0;draw()});
  }
  function loadM(){
    if(!HUBDB.user())return;
    HUBDB.myMess().then(function(r){MINE=r;draw()});
  }
  window.authClick=function(){
    if(HUBDB.user()){HubAuth.signOut().then(function(){MINE=[];if(tab==='mine')tab='feed';draw()})}
    else HubAuth.open();
  };
  function syncBtn(){
    var u=HUBDB.user(),l=document.getElementById('authLbl');
    if(!l)return;
    if(u)l.textContent='\uD83D\uDC64 '+String((u.user_metadata&&u.user_metadata.full_name)||u.email||'').split(' ')[0];
    else l.textContent='\uD83D\uDD11 \u09B2\u0997\u0987\u09A8';
  }
  function draw(){
    syncBtn();
    var w=document.getElementById('app');if(!w)return;
    var u=HUBDB.user();
    var h='<div class="hub-tabs">'+
      '<button class="'+(tab==='feed'?'on':'')+'" onclick="MSP.tab(\'feed\')">\uD83C\uDFE0 \u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8</button>'+
      (u?'<button class="'+(tab==='mine'?'on':'')+'" onclick="MSP.tab(\'mine\')">\uD83D\uDC64 \u0986\u09AE\u09BE\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F</button>':'')+
      '</div>';
    if(msg)h+='<p class="hub-empty">'+A.esc(msg)+'</p>';
    if(busy){w.innerHTML=h+'<p class="hub-empty">\u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u0986\u09A8\u099B\u09C7\u2026</p>';return}
    if(tab==='mine'){
      h+=A.meCard(u);
      h+=MINE.length?MINE.map(A.mineCard).join(''):'<p class="hub-empty">\u098F\u0996\u09A8\u0993 \u0995\u09CB\u09A8\u09CB \u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C7\u09A8\u09A8\u09BF</p>';
    } else if(form){
      h+=A.form()+'<button class="hub-btn2" style="margin-top:12px" onclick="MSP.form(0)">\u2B05\uFE0F \u09AA\u09C7\u099B\u09A8\u09C7 \u09AF\u09BE\u09A8</button>';
    } else {
      var f=L.filter(function(x){return (!G||x.g===G||x.g==='\u09AF\u09C7 \u0995\u09C7\u0989')&&(!Q||(x.t+' '+x.area+' '+(x.note||'')).toLowerCase().indexOf(Q)>-1)});
      h+='<div style="display:flex;gap:10px;margin:14px 0;flex-wrap:wrap">'+
      '<input placeholder="\uD83D\uDD0E \u098F\u09B2\u09BE\u0995\u09BE \u09AC\u09BE \u09AE\u09C7\u09B8\u09C7\u09B0 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u09C1\u09A8" value="'+A.esc(Q)+'" oninput="MSP.q(this.value)" style="flex:1;min-width:200px;padding:11px 14px;border-radius:12px;border:1px solid rgba(139,124,248,.28);background:#221e4d;color:#eef0ff;font:inherit;outline:none">'+
      '</div>';
      h+='<div class="hub-tabs"><button class="'+(!G?'on':'')+'" onclick="MSP.g(\'\')">\u09B8\u09AC</button><button class="'+(G==='\u099B\u09C7\u09B2\u09C7'?'on':'')+'" onclick="MSP.g(\'\u099B\u09C7\u09B2\u09C7\')">\uD83D\uDC66 \u099B\u09C7\u09B2\u09C7</button><button class="'+(G==='\u09AE\u09C7\u09DF\u09C7'?'on':'')+'" onclick="MSP.g(\'\u09AE\u09C7\u09DF\u09C7\')">\uD83D\uDC67 \u09AE\u09C7\u09DF\u09C7</button></div>';
      h+='<div class="grid">'+(f.length?f.map(A.card).join(''):'<p class="hub-empty" style="grid-column:1/-1">\u098F\u0996\u09A8\u0993 \u0995\u09CB\u09A8\u09CB \u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8 \u09A8\u09C7\u0987</p>')+'</div>';
      h+='<button class="hub-btn" style="max-width:640px;margin-top:18px" onclick="MSP.form(1)">\u2795 \u09AC\u09BF\u09B2\u09BE\u09B8\u09BF \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F \u09B2\u09BF\u0996\u09C1\u09A8</button>';
    }
    w.innerHTML=h;
  }
  window.MSP={
    tab:function(t){tab=t;form=0;if(t==='mine')loadM();draw();window.scrollTo({top:0,behavior:'smooth'})},
    form:function(x){
      if(x&&!HUBDB.user()){HubAuth.require().then(loadM);return}
      form=x;draw();window.scrollTo({top:0,behavior:'smooth'});
    },
    q:function(x){Q=String(x).toLowerCase();draw()},
    g:function(x){G=x;draw()}
  };
  window.MS_DEL=function(id){if(!confirm('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?'))return;HUBDB.delMess(id).then(function(){A.toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');load();loadM()})};
  window.MS_SAVE=function(e){
    e.preventDefault();
    if(!HUBDB.user()){HubAuth.require();return}
    var m=A.v('ms_m');if(!/^01\d{9}$/.test(m)){A.toast('\u09EE\u09E7 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A6\u09BF\u09A8');return}
    HUBDB.addMess({t:A.v('ms_t'),cond:A.v('ms_cond'),g:A.v('ms_g'),seats:A.v('ms_seats'),price:A.v('ms_price'),area:A.v('ms_area'),m:m,loc:A.v('ms_loc'),note:A.v('ms_note')})
    .then(function(){A.toast('\u2714\uFE0F \u09AA\u09CB\u09B8\u09CD\u099F \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09A6\u09CD\u09A6 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');form=0;load();loadM()})
    .catch(function(er){A.toast('\u09B9\u09AF\u09BC\u09A8\u09BF: '+er.message)});
  };
  txt();load();syncBtn();
  HUBDB.session().then(function(u){if(u)loadM()});
  HubAuth.onChange(function(){syncBtn();if(HUBDB.user())loadM();else{MINE=[];if(tab==='mine')tab='feed'}draw()});
})();
