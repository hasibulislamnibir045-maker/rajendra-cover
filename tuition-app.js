/* ===== Tuition Hub page app part 2 — forms, draw, events ===== */
(function () {
  var A=TU_APP,T=[],P=[],MT=[],MP=[],tab='tutors',form=0,busy=0,msg='',Q='',FC='',FA='';
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
    var u=HUBDB.user(),b=document.getElementById('authBtn');
    if(b)b.textContent=u?('\uD83D\uDC64 '+String((u.user_metadata&&u.user_metadata.full_name)||u.email||'').split(' ')[0]):'\uD83D\uDD11 \u09B2\u0997\u0987\u09A8';
  }
  function tForm(){
    return '<div class="hub-form" style="max-width:640px;margin:0 auto;background:var(--hub-panel,rgba(5,26,15,.82));border:1px solid var(--hub-line,rgba(61,220,132,.3));border-radius:18px;padding:22px">'+
    '<form id="tF" onsubmit="saveT(event)">'+
    '<label>\u09A8\u09BE\u09AE *</label><input id="t_n" required>'+
    '<div class="hub-row2"><div><label>\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 *</label><input id="t_m" type="tel" maxlength="11" required></div>'+
    '<div><label>\u09B2\u09BF\u0999\u09CD\u0997</label><select id="t_g"><option>\u09AA\u09C1\u09B0\u09C1\u09B7</option><option>\u09AE\u09B9\u09BF\u09B2\u09BE</option></select></div></div>'+
    '<label>\u09B6\u09BF\u0995\u09CD\u09B7\u09BE \u09AA\u09CD\u09B0\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A8</label><input id="t_ins">'+
    '<label>\u09AC\u09BF\u09B7\u09AF\u09BC</label><input id="t_sub">'+
    '<div class="hub-row2"><div><label>\u09B8\u09CD\u09A4\u09B0</label><select id="t_cls"><option>HSC</option><option>Honours</option><option>Degree</option><option>Masters</option><option>Class 6-10</option></select></div>'+
    '<div><label>\u09AC\u09B0\u09CD\u09B7</label><input id="t_yr"></div></div>'+
    '<div class="hub-row2"><div><label>\u09AE\u09BE\u09A7\u09CD\u09AF\u09AE</label><select id="t_med"><option>\u09AC\u09BE\u0982\u09B2\u09BE</option><option>\u0987\u0982\u09B0\u09C7\u099C\u09BF</option><option>\u09A6\u09C1\u099F\u09CB\u0987</option></select></div>'+
    '<div><label>\u09AA\u09A6\u09CD\u09A7\u09A4\u09BF</label><select id="t_mode"><option>\u0998\u09B0\u09C7</option><option>\u0985\u09A8\u09B2\u09BE\u0987\u09A8</option><option>\u09A6\u09C1\u099F\u09CB\u0987</option></select></div></div>'+
    '<label>\u098F\u09B2\u09BE\u0995\u09BE</label><input id="t_area">'+
    '<div class="hub-row2"><div><label>\u09AC\u09C7\u09A4\u09A8</label><input id="t_sal"></div><div><label>\u0985\u09AD\u09BF\u099C\u09CD\u099E\u09A4\u09BE</label><input id="t_exp"></div></div>'+
    '<button type="submit" class="hub-btn">\u2705 \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6 \u0995\u09B0\u09C1\u09A8</button></form></div>';
  }
  function pForm(){
    return '<div class="hub-form" style="max-width:640px;margin:0 auto;background:var(--hub-panel,rgba(5,26,15,.82));border:1px solid var(--hub-line,rgba(61,220,132,.3));border-radius:18px;padding:22px">'+
    '<form id="pF" onsubmit="saveP(event)">'+
    '<label>\u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BE\u09AE *</label><input id="p_n" required>'+
    '<div class="hub-row2"><div><label>\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 *</label><input id="p_m" type="tel" maxlength="11" required></div>'+
    '<div><label>\u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0 \u09B2\u09BF\u0999\u09CD\u0997</label><select id="p_sg"><option>\u09AA\u09C1\u09B0\u09C1\u09B7</option><option>\u09AE\u09B9\u09BF\u09B2\u09BE</option></select></div></div>'+
    '<div class="hub-row2"><div><label>\u09B6\u09CD\u09B0\u09C7\u09A3\u09BF</label><select id="p_cls"><option>Class 6-10</option><option>HSC</option><option>Honours</option><option>Degree</option><option>Masters</option></select></div>'+
    '<div><label>\u09AE\u09BE\u09A7\u09CD\u09AF\u09AE</label><select id="p_med"><option>\u09AC\u09BE\u0982\u09B2\u09BE</option><option>\u0987\u0982\u09B0\u09C7\u099C\u09BF</option><option>\u09A6\u09C1\u099F\u09CB\u0987</option></select></div></div>'+
    '<label>\u09AC\u09BF\u09B7\u09AF\u09BC</label><input id="p_sub">'+
    '<label>\u098F\u09B2\u09BE\u0995\u09BE</label><input id="p_area">'+
    '<div class="hub-row2"><div><label>\u09B8\u09AA\u09CD\u09A4\u09BE\u09B9\u09C7 \u09A6\u09BF\u09A8</label><input id="p_days" type="number" min="1" max="7"></div><div><label>\u09AC\u09C7\u09A4\u09A8</label><input id="p_sal"></div></div>'+
    '<label>\u09B2\u0995\u09CD\u09B7\u09CD\u09AF \u099F\u09BF\u0989\u099F\u09B0</label><input id="p_tg">'+
    '<label>\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4</label><textarea id="p_note"></textarea>'+
    '<button type="submit" class="hub-btn">\u2705 \u09AA\u09CB\u09B8\u099F \u0995\u09B0\u09C1\u09A8</button></form></div>';
  }
  function draw(){
    syncBtn();
    var w=document.getElementById('app');if(!w)return;
    var on=HUBDB.user();
    var h='<div class="hub-tabs">'+
      '<button class="hub-tab'+(tab==='tutors'?' on':'')+'" onclick="setTab(\'tutors\')">\uD83D\uDC68\u200D\uD83C\uDFEB \u099F\u09BF\u0989\u099F\u09B0</button>'+
      '<button class="hub-tab'+(tab==='posts'?' on':'')+'" onclick="setTab(\'posts\')">\uD83D\uDCCC \u099F\u09BF\u0989\u09B6\u09A8 \u09AA\u09CB\u09B8\u09CD\u099F</button>'+
      (on?'<button class="hub-tab'+(tab==='mine'?' on':'')+'" onclick="setTab(\'mine\')">\uD83D\uDC64 \u0986\u09AE\u09BE\u09B0\u099F\u09BE</button>':'')+
      '</div>';
    if(msg)h+='<p class="hub-empty">'+A.esc(msg)+'</p>';
    if(busy){w.innerHTML=h+'<p class="hub-empty">\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7\u2026</p>';return}
    if(tab==='mine'){
      h+=(MT.length?'<h3 style="margin:12px 0 8px;color:#3ddc84">\u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 ('+A.bn(MT.length)+')</h3>'+MT.map(function(x){return A.mCard(x,'t')}).join(''):'<p class="hub-empty">\u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u09A8\u09C7\u0987</p>');
      h+=(MP.length?'<h3 style="margin:12px 0 8px;color:#3ddc84">\u09AA\u09CB\u09B8\u09CD\u099F ('+A.bn(MP.length)+')</h3>'+MP.map(function(x){return A.mCard(x,'p')}).join(''):'<p class="hub-empty">\u0995\u09CB\u09A8\u09CB \u09AA\u09CB\u09B8\u09CD\u099F \u09A8\u09C7\u0987</p>');
    } else if(form==='tab'){
      h+=tab==='tutors'?tForm():pForm();
      h+='<button class="hub-btn2" style="margin-top:12px" onclick="setForm(0)">\u2B05\uFE0F \u09AA\u09C7\u099B\u09A8\u09C7 \u09AF\u09BE\u09A8</button>';
    } else {
      h+='<div style="display:flex;gap:10px;margin:14px 0;flex-wrap:wrap">'+
      '<input placeholder="\uD83D\uDD0E \u09A8\u09BE\u09AE, \u09AC\u09BF\u09B7\u09AF\u09BC \u09AC\u09BE \u098F\u09B2\u09BE\u0995\u09BE \u09B2\u09BF\u0996\u09C1\u09A8" value="'+A.esc(Q)+'" oninput="setQ(this.value)" style="flex:1;min-width:200px;padding:11px 14px;border-radius:12px;border:1px solid var(--hub-line,rgba(61,220,132,.3));background:#082016;color:#eaf7ef;font:inherit;outline:none">'+
      (tab==='tutors'?'<select onchange="setFC(this.value)" style="padding:11px 12px;border-radius:12px;border:1px solid var(--hub-line,rgba(61,220,132,.3));background:#082016;color:#eaf7ef;font:600 13px Inter"><option value="">\u09B8\u09CD\u09A4\u09B0: \u09B8\u09AC</option><option>HSC</option><option>Honours</option><option>Degree</option><option>Masters</option><option>Class 6-10</option></select>':'')+
      '</div>';
      var L=tab==='tutors'?T:P;
      if(FC)L=L.filter(function(x){return x.cls===FC});
      if(Q)L=L.filter(function(x){return hit(x.n+' '+x.sub+' '+(x.area||''))});
      h+='<div class="hub-grid">'+(L.length?L.map(tab==='tutors'?A.tCard:A.pCard).join(''):'<p class="hub-empty" style="grid-column:1/-1">\u0995\u09BF\u099B\u09C1 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF</p>')+'</div>';
      h+='<button class="hub-btn" style="max-width:640px;margin-top:18px" onclick="goForm()">'+(tab==='tutors'?'\u2795 \u099F\u09BF\u0989\u099F\u09B0 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09A8':'\u2795 \u099F\u09BF\u0989\u09B6\u09A8 \u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09B0\u09C1\u09A8')+'</button>';
    }
    w.innerHTML=h;
  }
  window.setTab=function(t){tab=t;form=0;if(t==='mine')loadM();draw();window.scrollTo({top:0,behavior:'smooth'})};
  window.setForm=function(f){form=f?'tab':0;draw();window.scrollTo({top:0,behavior:'smooth'})};
  window.goForm=function(){
    if(!HUBDB.user()){HubAuth.open();return}
    window.setForm(1);
  };
  window.setQ=function(x){Q=String(x).toLowerCase();draw()};
  window.setFC=function(x){FC=x;draw()};
  window.delT=function(id){if(!confirm('\u09AE\u09C1\u099B\u09AC\u09C7\u09A8?'))return;HUBDB.delTutor(id).then(function(){A.toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');load();loadM()})};
  window.delP=function(id){if(!confirm('\u09AE\u09C1\u099B\u09AC\u09C7\u09A8?'))return;HUBDB.delPost(id).then(function(){A.toast('\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');load();loadM()})};
  window.saveT=function(e){
    e.preventDefault();
    if(!HUBDB.user()){HubAuth.open();return}
    var m=A.v('t_m');if(!/^01\d{9}$/.test(m)){A.toast('\u09B8\u09A0\u09BF\u0995 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8 (11 \u09B8\u0982\u0996\u09CD\u09AF\u09BE)');return}
    HUBDB.addTutor({n:A.v('t_n'),m:m,g:A.v('t_g'),ins:A.v('t_ins'),yr:A.v('t_yr'),sub:A.v('t_sub'),cls:A.v('t_cls'),med:A.v('t_med'),mode:A.v('t_mode'),area:A.v('t_area'),sal:A.v('t_sal'),exp:A.v('t_exp')})
    .then(function(){A.toast('\u2705 \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6\u09BF\u09A4');form=0;load();loadM()})
    .catch(function(er){A.toast('\u09B8\u09C7\u09AD \u09B9\u09AF\u09BC\u09A8\u09BF: '+er.message)});
  };
  window.saveP=function(e){
    e.preventDefault();
    if(!HUBDB.user()){HubAuth.open();return}
    var m=A.v('p_m');if(!/^01\d{9}$/.test(m)){A.toast('\u09B8\u09A0\u09BF\u0995 \u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8 (11 \u09B8\u0982\u0996\u09CD\u09AF\u09BE)');return}
    HUBDB.addPost({n:A.v('p_n'),m:m,sg:A.v('p_sg'),cls:A.v('p_cls'),sub:A.v('p_sub'),med:A.v('p_med'),area:A.v('p_area'),days:A.v('p_days'),sal:A.v('p_sal'),tg:A.v('p_tg'),note:A.v('p_note')})
    .then(function(){A.toast('\u2705 \u09AA\u09CB\u09B8\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7');form=0;load();loadM()})
    .catch(function(er){A.toast('\u09B8\u09C7\u09AD \u09B9\u09AF\u09BC\u09A8\u09BF: '+er.message)});
  };
  load();
  HUBDB.session().then(function(u){if(u)loadM();syncBtn()});
  HubAuth.onChange(function(){syncBtn();if(HUBDB.user())loadM();else{MT=[];MP=[]}draw()});
})();
