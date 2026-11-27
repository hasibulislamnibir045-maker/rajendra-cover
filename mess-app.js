/* ===== Mess & Hostel page app ===== */
(function(){
  var A=MS_APP,L=[],MINE=[],tab='feed',form=0,busy=0,msg='',Q='',G='';
  function draw(){
    var w=document.getElementById('app');if(!w)return;
    var u=HUBDB.user();
    var h='<div class="hub-tabs">'+
      '<button class="'+(tab==='feed'?'on':'')+'" onclick="MSP.tab(\'feed\')">\uD83C\uDFE0 \u0996\u09BE\u09B2\u09BF \u09B8\u09BF\u099F</button>'+
      (u?'<button class="'+(tab==='mine'?'on':'')+'" onclick="MSP.tab(\'mine\')">\uD83D\uDC64 \u0986\u09AE\u09BE\u09B0 \u09AA\u09CB\u09B8\u09CD\u099F</button>':'')+
      '</div>';
    if(msg)h+='<p class="hub-empty">'+A.esc(msg)+'</p>';
    w.innerHTML=h+'<p class="hub-empty">\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7\u2026</p>';
  }
  window.MSP={tab:function(t){tab=t;form=0;load()}};
  draw();
})();
