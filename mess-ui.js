var MS_APP={};
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function bn(n){return String(n).replace(/\d/g,function(d){return'\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF'[+d]})}
  MS_APP.esc=esc;MS_APP.bn=bn;
  MS_APP.toast=function(m){var t=document.createElement('div');t.className='hub-toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},3200)};
  MS_APP.v=function(id){var e=document.getElementById(id);return e?String(e.value).trim():''};
})();
