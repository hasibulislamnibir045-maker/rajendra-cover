/* ===== Tuition Hub: tutor + post forms ===== */
(function(){
  function sh(id){return '<div class="hub-form" style="max-width:640px;margin:0 auto;background:rgba(5,26,15,.82);border:1px solid rgba(61,220,132,.3);border-radius:18px;padding:22px"><form id="'+id+'" onsubmit="'+(id==='tF'?'saveT':'saveP')+'(event)">'}
  TU_APP.tForm=function(){
    return sh('tF')+
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
  };
  TU_APP.pForm=function(){
    return sh('pF')+
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
  };
})();
