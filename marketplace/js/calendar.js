/* ===== Hut Calendar module: exam + goal planner (hutCal()) ===== */
(function () {
  var MBN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  var WD = ['রবি','সোম','মঙ্গল','বুধ','বৃহঃ','শুক্র','শনি'];
  var cur = new Date(); cur.setDate(1); var sel = '';
  function bn(n){return String(n).replace(/\d/g,function(d){return '০১২৩৪৫৬৭৮৯'[+d];});}
  function pad(n){return String(n).padStart(2,'0');}
  function key(y,m,d){return y+'-'+pad(m+1)+'-'+pad(d);}
  function ld(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
  function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function render(){
    var box=document.getElementById('calbox');if(!box)return;
    var y=cur.getFullYear(),m=cur.getMonth(),ex={},go={};
    ld('rsh_ex',[]).forEach(function(e){(ex[e.d]=ex[e.d]||[]).push(e.n);});
    ld('rsh_tk',[]).forEach(function(t){if(t.d)(go[t.d]=go[t.d]||[]).push(t);});
    var first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
    var t=new Date(),tk=key(t.getFullYear(),t.getMonth(),t.getDate());
    var h='<div class="cal-h"><button id="calP">‹</button><b>'+MBN[m]+' '+bn(y)+'</b><button id="calN">›</button></div><div class="cal-g">';
    WD.forEach(function(w){h+='<div class="cal-w">'+w+'</div>';});
    for(var i=0;i<first;i++)h+='<div class="cal-d off"></div>';
    for(var d=1;d<=days;d++){
      var k=key(y,m,d),c='cal-d';
      if(ex[k])c+=' ex';else if(go[k])c+=' go';
      if(k===tk)c+=' td';if(k===sel)c+=' sl';
      h+='<button class="'+c+'" data-k="'+k+'"><span>'+bn(d)+'</span>'+((ex[k]||go[k])?'<i class="'+(ex[k]?'dx':'dg2')+'"></i>':'')+'</button>';
    }
    h+='</div><div class="cal-l"><span><i class="dx"></i> পরীক্ষা</span><span><i class="dg2"></i> লক্ষ্য / প্ল্যান</span><span><i class="dt2"></i> আজ</span></div>';
    if(sel){
      var p=sel.split('-'),it='';
      (ex[sel]||[]).forEach(function(n){it+='<div class="ex"><span>📚 <b>'+esc(n)+'</b></span></div>';});
      (go[sel]||[]).forEach(function(g){it+='<div class="ex"><span>'+(g.k?'✅':'🎯')+' <b>'+esc(g.n)+'</b></span></div>';});
      h+='<div class="cal-p"><b>'+bn(p[2]+' '+MBN[p[1]-1]+', '+p[0])+'</b>'+(it||'<p class="cal-e">এই দিনে কিছু নেই</p>')+
        '<div class="mini"><input id="calT" placeholder="নতুন লক্ষ্য / পরীক্ষার নাম"><button id="calAG">+ লক্ষ্য</button><button id="calAE">+ পরীক্ষা</button></div></div>';
    }else h+='<p class="cal-e">কোনো তারিখে ক্লিক করুন, সেখানে লক্ষ্য বা পরীক্ষা যোগ করতে পারবেন।</p>';
    box.innerHTML=h;
  }

  window.hutCal=function(){
    openM('<h2>📅 Student Calendar</h2><p style="color:var(--muted);font-size:13px;margin:2px 0 10px">পরীক্ষা ও লক্ষ্য হাইলাইট হবে। ডেটা আপনার ফোনেই সেভ থাকে।</p><div class="cal" id="calbox"></div>');
    render();
    document.getElementById('calbox').addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      if(b.id==='calP'){cur.setMonth(cur.getMonth()-1);render();return;}
      if(b.id==='calN'){cur.setMonth(cur.getMonth()+1);render();return;}
      if(b.dataset.k){sel=(sel===b.dataset.k)?'':b.dataset.k;render();return;}
      var t=document.getElementById('calT'),v=t&&t.value.trim();
      if(!v||!sel)return;
      if(b.id==='calAG'){var a=ld('rsh_tk',[]);a.push({n:v,k:0,d:sel});sv('rsh_tk',a);}
      if(b.id==='calAE'){var x=ld('rsh_ex',[]);x.push({n:v,d:sel});sv('rsh_ex',x);}
      render();
    });
  };
})();
