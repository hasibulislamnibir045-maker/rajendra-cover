/* ===== Tuition Hub app logic (tuition.html) — ONE shared login ===== */
(function () {
  var A=TU_APP,T=[],P=[],MT=[],MP=[],tab='tutors',form=0,busy=0,msg='',Q='',FC='';
  function hit(x){return !Q||(x||'').toLowerCase().indexOf(Q)>-1}
  function load(){
    busy=1;msg='';draw();
    Promise.all([HUBDB.getTutors(),HUBDB.getPosts()]).then(function(r){
      T=r[0];P=r[1];busy=0;
      var a=document.getElementById('stT'),b=document.getElementById('stP');
      if(a)a.textContent=A.bn(T.length);if(b)b.textContent=A.bn(P.length);
      draw();
    }).catch(function(e){msg=e.message;busy=0;draw()});
  }
  function loadM(){
    if(!HUBDB.user())return;
    Promise.all([HUBDB.myTutors(),HUBDB.myPosts()]).then(function(r){MT=r[0];MP=r[1];draw()});
  }
  window.authClick=function(){
    if(HUBDB.user()){HubAuth.signOut().then(function(){MT=[];MP=[];if(tab==='mine')tab='tutors';draw()})}
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
    var on=HUBDB.user();
    var h='<div class="hub-tabs">'+
      '<button class="'+(tab==='tutors'?'on':'')+'" onclick="setTab(\'tutors\')">\uD83E\uDDEC \u09AE\u09C7\u09A7\u09BE\u09AC\u09C0</button>'+
      '<button class="'+(tab==='posts'?'on':'')+'" onclick="setTab(\'posts\')">\uD83D\uDCC4 \u099C\u09B0\u09C1\u09B0\u09BF \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8</button>'+
      (on?'<button class="'+(tab==='mine'?'on':'')+'" onclick="setTab(\'mine\')">\uD83D\uDC64 \u0986\u09AE\u09BE\u09B0\u099F\u09BE</button>':'')+
      '</div>';
    if(msg)h+='<p class="hub-empty">'+A.esc(msg)+'</p>';
    if(busy){w.innerHTML=h+'<p class="hub-empty">\u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u0986\u09A8\u099B\u09C7\u2026</p>';return}
    if(tab==='mine'){
      h+=A.meCard(HUBDB.user(),(window.HubAuth&&HubAuth.profile())||null);
      h+=(MT.length?'<h3 style="margin:12px 0 8px;color:#a99cfb">\u0986\u09AE\u09BE\u09B0 \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 ('+A.bn(MT.length)+')</h3>'+MT.map(function(x){return A.mCard(x,'t')}).join(''):'<p class="hub-empty">\u098F\u0996\u09A8\u0993 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7\u09A8\u09A8\u09BF</p>');
      h+=(MP.length?'<h3 style="margin:12px 0 8px;color:#a99cfb">\u0986\u09AE\u09BE\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F ('+A.bn(MP.length)+')</h3>'+MP.map(function(x){return A.mCard(x,'p')}).join(''):'<p class="hub-empty">\u098F\u0996\u09A8\u0993 \u0995\u09CB\u09A8\u09CB \u099C\u09B0\u09C1\u09B0\u09BF \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8 \u09AC\u09BF\u09A1\u09BC\u09BF\u09A8\u09A8\u09BF</p>');
    } else if(form==='tab'){
      h+=tab==='tutors'?A.tForm():A.pForm();
      h+='<button class="hub-btn2" style="margin-top:12px" onclick="setForm(0)">\u2B05\uFE0F \u09AA\u09C7\u099B\u09A8\u09C7 \u09AF\u09BE\u09A8</button>';
    } else {
      h+='<div style="display:flex;gap:10px;margin:14px 0;flex-wrap:wrap">'+
      '<input placeholder="\uD83D\uDD0E \u09A8\u09BE\u09AE \u09AC\u09BE \u09AC\u09BF\u09B7\u09AF\u09BC\u09C7\u09B0 \u09B2\u0997\u09A4 \u0995\u09C0\u099B\u09C1 \u09B2\u09BF\u0996\u09C1\u09A8" value="'+A.esc(Q)+'" oninput="setQ(this.value)" style="flex:1;min-width:200px;padding:11px 14px;border-radius:12px;border:1px solid rgba(139,124,248,.28);background:#221e4d;color:#eef0ff;font:inherit;outline:none">'+
      (tab==='tutors'?'<select onchange="setFC(this.value)" style="padding:11px 12px;border-radius:12px;border:1px solid rgba(139,124,248,.28);background:#221e4d;color:#eef0ff;font:600 13px Inter"><option value="">\u09B8\u09CD\u09A4\u09B0: \u09B8\u09AC</option><option>HSC</option><option>Honours</option><option>Degree</option><option>Masters</option><option>Class 6-10</option></select>':'')+
      '</div>';
      var L=tab==='tutors'?T:P;
      if(FC)L=L.filter(function(x){return x.cls===FC});
      if(Q)L=L.filter(function(x){return hit(x.n+' '+x.sub+' '+(x.area||''))});
      h+='<div class="grid">'+(L.length?L.map(tab==='tutors'?A.tCard:A.pCard).join(''):'<p class="hub-empty" style="grid-column:1/-1">\u098F\u0996\u09A8\u0993 \u0995\u09CB\u09A8\u09CB \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u09A8\u09C7\u0987</p>')+'</div>';
      h+='<button class="hub-btn" style="max-width:640px;margin-top:18px" onclick="goForm()">'+(tab==='tutors'?'\u2795 \u09AE\u09C7\u09A7\u09BE\u09AC\u09C0 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09A8':'\u2795 \u099C\u09B0\u09C1\u09B0\u09BF \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8 \u09B2\u09BF\u0996\u09C1\u09A8')+'</button>';
    }
    w.innerHTML=h;
  }
  window.setTab=function(t){tab=t;form=0;if(t==='mine')loadM();draw();window.scrollTo({top:0,behavior:'smooth'})};
  window.setForm=function(f){form=f?'tab':0;draw();window.scrollTo({top:0,behavior:'smooth'})};
  window.goForm=function(){if(!HUBDB.user()){HubAuth.open();return}window.setForm(1)};
  window.setQ=function(x){Q=Student(x);draw()};
  function Student(x){return String(x).toLowerCase()}
  window.setFC=function(x){FC=x;draw()};
  window.delT=function(id){if(!confirm('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?'))return;HUBDB.delTutor(id).then(function(){A.toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');load();loadM()})};
  window.delP=function(id){if(!confirm('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09AC\u09C7\u09A8?'))return;HUBDB.delPost(id).then(function(){A.toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');load();loadM()})};
  window.saveT=function(e){
    e.preventDefault();
    if(!HUBDB.user()){HubAuth.open();return}
    var m=A.v('t_m');if(!/^01\d{9}$/.test(m)){A.toast('\u09EE\u09E7 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A6\u09BF\u09A8');return}
    HUBDB.addTutor({n:A.v('t_n'),m:m,g:A.v('t_g'),ins:A.v('t_ins'),yr:A.v('t_yr'),sub:A.v('t_sub'),cls:A.v('t_cls'),med:A.v('t_med'),mode:A.v('t_mode'),area:A.v('t_area'),sal:A.v('t_sal'),exp:A.v('t_exp')})
    .then(function(){A.toast('\u2714\uFE0F \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09A6\u09CD\u09A6 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');form=0;load();loadM()})
    .catch(function(er){A.toast('\u09B9\u09AF\u09BC\u09A8\u09BF: '+er.message)});
  };
  window.saveP=function(e){
    e.preventDefault();
    if(!HUBDB.user()){HubAuth.open();return}
    var m=A.v('p_m');if(!/^01\d{9}$/.test(m)){A.toast('\u09EE\u09E7 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A6\u09BF\u09A8');return}
    HUBDB.addPost({n:A.v('p_n'),m:m,sg:A.v('p_sg'),cls:A.v('p_cls'),sub:A.v('p_sub'),med:A.v('p_med'),area:A.v('p_area'),days:A.v('p_days'),sal:A.v('p_sal'),tg:A.v('p_tg'),note:A.v('p_note')})
    .then(function(){A.toast('\u2714\uFE0F \u09AA\u09CB\u09B8\u09CD\u099F \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09A6\u09CD\u09A6 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');form=0;load();loadM()})
    .catch(function(er){A.toast('\u09B9\u09AF\u09BC\u09A8\u09BF: '+er.message)});
  };
  load();
  HUBDB.session().then(function(u){if(u)loadM();syncBtn()});
  HubAuth.onChange(function(){syncBtn();if(HUBDB.user())loadM();else{MT=[];MP=[]}draw()});
})();
