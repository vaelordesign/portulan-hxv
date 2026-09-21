
// ------------------------------------------------------------------
// Moteur : fiches, quiz, examen blanc (format de l'intra), cartes éclair.
// Progression 100 % localStorage (clé portulan-hxv), aucun compte.
// ------------------------------------------------------------------
(function(){
const KEY='portulan-hxv', DKEY='portulan-hxv-draft';
const $=(s,r)=> (r||document).querySelector(s);
const $$=(s,r)=> Array.prototype.slice.call((r||document).querySelectorAll(s));
const FICHES=$$('.fiche').map(f=>f.id);
const TITLE={}; $$('.fiche').forEach(f=>TITLE[f.id]=f.getAttribute('data-title'));
const MASTERABLE=FICHES.filter(id=>id!=='s0');
const BYID={}; BANK.forEach(q=>BYID[q.id]=q);

let state=load();
function load(){
  try{ const s=JSON.parse(localStorage.getItem(KEY)||'{}');
    return {mastered:s.mastered||{}, stats:s.stats||{}, cfg:s.cfg||null, exams:s.exams||[]}; }
  catch(e){ return {mastered:{},stats:{},cfg:null,exams:[]}; }
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function stat(id){ return state.stats[id]||{seen:0,ok:0,ko:0,last:null}; }
function record(id,score){ const st=stat(id); st.seen++; if(score>=1) st.ok++; else st.ko++; st.last=score; state.stats[id]=st; save(); updateBadge(); }
function groupOf(s){ return GROUPS.find(g=>g.s.indexOf(s)>=0)||{id:'g0',name:'Synthèse'}; }
function toReview(){ return BANK.filter(q=>{ const st=stat(q.id); return st.seen>0 && st.last<1; }); }
function updateBadge(){ const n=toReview().length; const b=$('#n-quiz'); b.innerHTML=n?n+'<span class="lg"> à revoir</span>':''; b.style.display=n?'':'none'; }
function pct(a,b){ return b?Math.round(100*a/b):0; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(x){ return (Math.round(x*100)/100).toString().replace('.',','); }
function lines(t){ const s=(t||'').trim(); if(!s) return 0; return s.split('\n').reduce((a,l)=>a+Math.max(1,Math.ceil(l.length/85)),0); }
function critHtml(q){ return q.crit?'<div class="crit"><b>Barème (4 points)</b><ol>'+q.crit.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ol></div>':''; }
function kwHtml(q){ return q.k?'<div class="kw">'+q.k.map(k=>'<span>'+esc(k)+'</span>').join('')+'</div>':''; }
function modelHtml(q){
  if(q.t==='lecture') return '<div class="model"><span class="blabel">1) Idée principale</span><p>'+esc(q.idee)+'</p><span class="blabel" style="margin-top:12px">2) Réponse modèle</span>'+q.m+'</div>'+critHtml(q);
  if(q.t==='dev') return '<div class="model"><span class="blabel">Réponse modèle (5-6 lignes)</span>'+q.m+kwHtml(q)+'</div>'+critHtml(q);
  return '<div class="model"><span class="blabel">Réponse modèle</span><p>'+esc(q.m)+'</p>'+kwHtml(q)+'</div>';
}
// la réponse attendue, bien écrite : la première phrase de la réponse modèle (sinon le premier terme accepté)
function ansHead(q){ const m=String(q.m||''); const i=m.indexOf('. '); const h=(i>0&&i<100)?m.slice(0,i):''; if(h) return h; const a=(q.acc&&q.acc[0])||''; return a.charAt(0).toUpperCase()+a.slice(1); }
function passageHtml(q){ return '<div class="passage">'+q.txt+'<span class="ref">Texte rédigé pour l\'exercice, d\'après le cours.</span></div>'; }

// ---- correction automatique des réponses courtes
const STOP={le:1,la:1,les:1,l:1,un:1,une:1,des:1,du:1,de:1,d:1,en:1,au:1,aux:1};
function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/œ/g,'oe').replace(/[’'`]/g,' ').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w&&!STOP[w]).join(' '); }
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; let p=[]; for(let j=0;j<=n;j++) p[j]=j; for(let i=1;i<=m;i++){ let c=[i]; for(let j=1;j<=n;j++){ c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); } p=c; } return p[n]; }
function matchShort(input,acc){
  const x=norm(input); if(!x||!acc||!acc.length) return false;
  return acc.some(a=>{ const y=norm(a); if(!y) return false; if(x===y) return true;
    const xw=x.split(' '), yw=y.split(' ');
    if(xw.length<=yw.length+3 && (' '+x+' ').indexOf(' '+y+' ')>=0) return true;
    if(/\d/.test(y)) return false;
    const d=lev(x,y); return (y.length>=5 && y.length<=8 && d<=1) || (y.length>8 && d<=2); });
}

// ---------------- navigation
const VIEWS=['express','fiches','quiz','exam','cards'];
function showView(v){
  VIEWS.forEach(x=>$('#view-'+x).classList.toggle('on',x===v));
  $$('.tab').forEach(t=>t.setAttribute('aria-selected', t.getAttribute('data-view')===v ? 'true':'false'));
  if(v==='quiz' && !quiz) renderQuizSetup();
  if(v==='exam' && !exam) renderExamIntro();
  if(v==='cards' && !deck) renderCardsSetup();
}
$$('.tab').forEach(t=>t.addEventListener('click',()=>{ location.hash='#'+t.getAttribute('data-view'); }));
function route(){
  const h=(location.hash||'#express').slice(1);
  if(VIEWS.indexOf(h)>=0){ showView(h); if(h==='fiches'||h==='express') window.scrollTo(0,0); return; }
  if(/^x[a-d]$/.test(h) && $('#'+h)){ showView('express'); setTimeout(()=>{ $('#'+h).scrollIntoView({block:'start'}); },0); return; }
  if(/^s\d+$/.test(h) && $('#'+h)){ showView('fiches'); $('#toc').classList.remove('open'); setTimeout(()=>{ $('#'+h).scrollIntoView({block:'start'}); },0); return; }
  showView('express');
}
window.addEventListener('hashchange',route);
$$('.fiche').forEach(f=>f.style.scrollMarginTop='76px');

// ---------------- compte à rebours
(function(){ const el=$('#cd'); if(!el) return; const now=new Date(); const d0=new Date(now.getFullYear(),now.getMonth(),now.getDate()); const exam=new Date(2026,8,23), exam2=new Date(2026,8,24);
  const days=Math.round((exam-d0)/86400000), days2=Math.round((exam2-d0)/86400000);
  let txt=''; if(days>1) txt='Intra dans '+days+' jours'; else if(days===1) txt='Intra demain (gr. 0001)'; else if(days===0) txt='Intra aujourd\'hui (gr. 0001)'; else if(days2===0) txt='Intra aujourd\'hui (gr. 0002-0003)';
  if(txt){ el.textContent=txt; el.hidden=false; } })();

// ---------------- fiches : sommaire, maîtrise, actions
const tocLinks=$$('#toc a');
$('#toc-btn').addEventListener('click',()=>$('#toc').classList.toggle('open'));
tocLinks.forEach(a=>a.addEventListener('click',()=>$('#toc').classList.remove('open')));
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ tocLinks.forEach(a=>a.classList.toggle('cur', a.getAttribute('href')==='#'+en.target.id)); } });
  },{rootMargin:'-70px 0px -75% 0px',threshold:0});
  $$('.fiche').forEach(f=>io.observe(f));
}
function refreshMastery(){
  const done=MASTERABLE.filter(id=>state.mastered[id]).length;
  $('#toc-pct').textContent=done+(done>1?' fiches maîtrisées':' fiche maîtrisée')+' sur '+MASTERABLE.length;
  $('#toc-bar').style.width=pct(done,MASTERABLE.length)+'%';
  tocLinks.forEach(a=>a.classList.toggle('done', !!state.mastered[a.getAttribute('href').slice(1)]));
  $$('.fiche').forEach(f=>{ const b=$('.btn-master',f); if(b){ const on=!!state.mastered[f.id]; b.textContent=on?'Fiche maîtrisée ✓':'Je maîtrise cette fiche'; b.classList.toggle('done',on); } });
}
$$('.fiche').forEach(f=>{
  const act=$('.sec-actions',f); if(!act) return;
  const id=f.id;
  if(id!=='s0'){ const b1=document.createElement('button'); b1.type='button'; b1.className='btn btn-master';
    b1.addEventListener('click',()=>{ state.mastered[id]=!state.mastered[id]; save(); refreshMastery(); });
    act.appendChild(b1); }
  const n=BANK.filter(q=>q.s===id && (q.t==='qcm'||q.t==='vf'||q.t==='courte')).length;
  if(n){ const b2=document.createElement('button'); b2.type='button'; b2.className='btn primary'; b2.textContent='Quiz sur cette fiche ('+n+')';
    b2.addEventListener('click',()=>{ startQuiz({sections:[id],types:['qcm','vf','courte'],n:0,prio:false,label:'Fiche '+id.slice(1)+' · '+TITLE[id]}); location.hash='#quiz'; });
    act.appendChild(b2); }
  const nd=BANK.filter(q=>q.s===id && (q.t==='dev'||q.t==='lecture')).length;
  if(nd){ const b3=document.createElement('button'); b3.type='button'; b3.className='btn ghost'; b3.textContent='Lecture et développement ('+nd+')';
    b3.addEventListener('click',()=>{ startQuiz({sections:[id],types:['lecture','dev'],n:0,prio:false,label:'Écrit · '+TITLE[id]}); location.hash='#quiz'; });
    act.appendChild(b3); }
});
(function(){ const act=$('#s0 .sec-actions'); if(!act) return;
  const p=document.createElement('button'); p.type='button'; p.className='btn'; p.textContent='Imprimer les fiches'; p.addEventListener('click',()=>{ location.hash='#fiches'; setTimeout(()=>window.print(),150); });
  const r=document.createElement('button'); r.type='button'; r.className='btn ghost'; r.textContent='Effacer ma progression';
  r.addEventListener('click',()=>{ if(confirm('Effacer les fiches cochées, les résultats de quiz et les examens blancs sur cet appareil ?')){ state={mastered:{},stats:{},cfg:null,exams:[]}; save(); try{localStorage.removeItem(DKEY);}catch(e){} refreshMastery(); updateBadge(); } });
  act.appendChild(p); act.appendChild(r); })();

// ---------------- quiz
let quiz=null;
const qroot=$('#quiz-root');
function renderQuizSetup(){
  quiz=null;
  const cfg=state.cfg||{groups:GROUPS.map(g=>g.id),types:['qcm','vf','courte'],n:20,prio:false};
  const rev=toReview();
  const seen=Object.keys(state.stats).length;
  const oks=Object.keys(state.stats).reduce((a,k)=>a+state.stats[k].ok,0);
  const tot=Object.keys(state.stats).reduce((a,k)=>a+state.stats[k].seen,0);
  qroot.innerHTML=
   '<div class="card"><div class="eyebrow">Quiz</div><h2>Compose ton quiz</h2>'+
   '<p class="lead">Choisis les blocs de matière, les types de questions et le nombre. Chaque réponse est corrigée tout de suite, avec l\'explication et un lien vers la fiche.</p>'+
   '<div class="field"><label>Blocs de matière</label><div class="chips" id="q-groups">'+GROUPS.map(g=>'<button type="button" class="chip" data-g="'+g.id+'" aria-pressed="'+(cfg.groups.indexOf(g.id)>=0)+'">'+g.name+'<span class="cnt">'+BANK.filter(q=>g.s.indexOf(q.s)>=0).length+'</span></button>').join('')+'</div></div>'+
   '<div class="field"><label>Types de questions</label><div class="chips" id="q-types">'+Object.keys(TYPES).map(t=>'<button type="button" class="chip" data-t="'+t+'" aria-pressed="'+(cfg.types.indexOf(t)>=0)+'">'+TYPES[t]+'<span class="cnt">'+BANK.filter(q=>q.t===t).length+'</span></button>').join('')+'</div></div>'+
   '<div class="row"><div class="field"><label for="q-n">Nombre de questions</label><select id="q-n"><option value="10">10</option><option value="20">20</option><option value="40">40</option><option value="0">Toutes</option></select></div>'+
   '<div class="field"><label>Priorité</label><button type="button" class="chip" id="q-prio" aria-pressed="'+!!cfg.prio+'">Prioriser mes erreurs</button></div></div>'+
   '<div class="row"><button type="button" class="btn primary" id="q-start">Commencer</button><span class="stat-line" id="q-avail"></span></div></div>'+
   '<div class="card"><div class="eyebrow">Ma progression</div>'+
   (seen?'<div class="score"><div><small>Questions vues</small><b>'+seen+'<span style="font-size:16px;color:var(--muted)"> / '+BANK.length+'</span></b></div><div><small>Taux de réussite</small><b>'+pct(oks,tot)+' %</b></div><div><small>À revoir</small><b>'+rev.length+'</b></div></div>'+
     '<div class="row">'+(rev.length?'<button type="button" class="btn primary" id="q-review">Refaire mes '+rev.length+' question'+(rev.length>1?'s':'')+' ratée'+(rev.length>1?'s':'')+'</button>':'')+'</div>'
    :'<p class="empty">Aucune question faite pour l\'instant. Les résultats restent sur cet appareil.</p>')+
   '</div>';
  $('#q-n').value=String(cfg.n);
  function readCfg(){ return {groups:$$('#q-groups .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-g')), types:$$('#q-types .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-t')), n:parseInt($('#q-n').value,10), prio:$('#q-prio').getAttribute('aria-pressed')==='true'}; }
  function avail(){ const c=readCfg(); const secs=GROUPS.filter(g=>c.groups.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); const n=BANK.filter(q=>secs.indexOf(q.s)>=0 && c.types.indexOf(q.t)>=0).length; $('#q-avail').textContent=n+' question'+(n>1?'s':'')+' disponible'+(n>1?'s':'')+' avec ces choix'; $('#q-start').disabled=!n; return c; }
  $$('#q-groups .chip, #q-types .chip, #q-prio').forEach(c=>c.addEventListener('click',()=>{ c.setAttribute('aria-pressed', c.getAttribute('aria-pressed')==='true'?'false':'true'); avail(); }));
  $('#q-n').addEventListener('change',avail);
  avail();
  $('#q-start').addEventListener('click',()=>{ const c=avail(); state.cfg=c; save(); const secs=GROUPS.filter(g=>c.groups.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); startQuiz({sections:secs,types:c.types,n:c.n,prio:c.prio,label:'Quiz'}); });
  const rb=$('#q-review'); if(rb) rb.addEventListener('click',()=>startQuiz({ids:rev.map(q=>q.id),n:0,label:'Mes erreurs'}));
}
const WRITTEN={lecture:1,dev:1};
function startQuiz(o){
  let list;
  if(o.ids){ list=BANK.filter(q=>o.ids.indexOf(q.id)>=0); }
  else { list=BANK.filter(q=>o.sections.indexOf(q.s)>=0 && o.types.indexOf(q.t)>=0); }
  shuffle(list);
  if(o.prio){ list.sort((a,b)=>{ const sa=stat(a.id), sb=stat(b.id); const ka=(sa.seen&&sa.last<1)?0:(sa.seen?2:1); const kb=(sb.seen&&sb.last<1)?0:(sb.seen?2:1); return ka-kb; }); }
  if(o.n) list=list.slice(0,o.n);
  // comme à l'examen : l'écrit à la fin
  list.sort((a,b)=>(WRITTEN[a.t]?1:0)-(WRITTEN[b.t]?1:0));
  quiz={list:list.map(q=>({q:q, order:q.t==='qcm'?shuffle(q.o.map((_,i)=>i)):null, score:null})), i:0, label:o.label||'Quiz'};
  renderQuestion();
  window.scrollTo(0,0);
}
function renderQuestion(){
  const it=quiz.list[quiz.i], q=it.q, n=quiz.list.length;
  const g=groupOf(q.s);
  let body='';
  if(q.t==='qcm'){ body='<div class="opts" id="opts">'+it.order.map((oi,k)=>'<button type="button" class="opt" data-i="'+oi+'"><span class="k">'+(k+1)+'</span>'+esc(q.o[oi])+'</button>').join('')+'</div>'; }
  else if(q.t==='vf'){ body='<div class="opts" id="opts"><button type="button" class="opt" data-i="1"><span class="k">1</span>Vrai</button><button type="button" class="opt" data-i="0"><span class="k">2</span>Faux</button></div>'; }
  else if(q.t==='courte' && q.acc && q.acc.length){ body='<input type="text" id="q-in" autocomplete="off" spellcheck="false" placeholder="Ta réponse (un mot ou quelques mots)"><div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="q-check">Vérifier</button><button type="button" class="btn ghost" id="q-idk">Je ne sais pas</button></div>'; }
  else { body='<textarea id="q-text" placeholder="'+(q.t==='courte'?'Écris ta réponse en une ou deux phrases.':'Écris ta réponse ici (5 à 6 lignes), puis compare avec le corrigé.')+'"></textarea>'+(WRITTEN[q.t]?'<div class="lines" id="q-lines">0 ligne</div>':'')+'<div class="row" style="margin-top:10px"><button type="button" class="btn primary" id="q-reveal">'+(WRITTEN[q.t]?'Voir le corrigé et le barème':'Voir la réponse modèle')+'</button></div>'; }
  qroot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">'+esc(quiz.label)+' · question '+(quiz.i+1)+' sur '+n+'</span><span class="qtype">'+TYPES[q.t]+' · '+esc(g.name)+'</span></div>'+
    '<div class="progress"><i style="width:'+pct(quiz.i,n)+'%"></i></div>'+
    (q.t==='lecture'?passageHtml(q):'')+
    '<div class="qtext">'+esc(q.q)+'</div>'+body+'<div id="q-fb"></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="q-quit">Arrêter le quiz</button><span></span></div></div>';
  $('#q-quit').addEventListener('click',()=>{ if(quiz.i===0||confirm('Arrêter ce quiz ? Les réponses déjà données sont retenues.')){ quiz=null; renderQuizSetup(); } });
  if(q.t==='qcm'||q.t==='vf'){ $$('#opts .opt').forEach(b=>b.addEventListener('click',()=>answerChoice(parseInt(b.getAttribute('data-i'),10)))); }
  else if($('#q-check')){ const inp=$('#q-in'); inp.focus({preventScroll:true});
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); checkShort(false); } });
    $('#q-check').addEventListener('click',()=>checkShort(false)); $('#q-idk').addEventListener('click',()=>checkShort(true)); }
  else { $('#q-reveal').addEventListener('click',revealModel); const ta=$('#q-text'), ln=$('#q-lines'); if(ln) ta.addEventListener('input',()=>{ const k=lines(ta.value); ln.textContent=k+' ligne'+(k>1?'s':'')+' environ'; }); }
}
function answerChoice(i){
  const it=quiz.list[quiz.i], q=it.q;
  const correct = q.t==='qcm' ? q.a : (q.a?1:0);
  const ok = i===correct;
  $$('#opts .opt').forEach(b=>{ b.disabled=true; const bi=parseInt(b.getAttribute('data-i'),10); if(bi===correct) b.classList.add('ok'); else if(bi===i) b.classList.add('ko'); });
  it.score=ok?1:0; record(q.id,it.score);
  $('#q-fb').innerHTML='<div class="fb '+(ok?'ok':'ko')+'"><span class="blabel">'+(ok?'Bonne réponse':'Mauvaise réponse')+'</span><p>'+esc(q.w)+'</p><p style="margin-top:6px"><a href="#'+q.s+'" class="ui" style="font-size:13px">Relire la fiche : '+esc(TITLE[q.s])+'</a></p></div>';
  nextButton();
}
function checkShort(idk){
  const it=quiz.list[quiz.i], q=it.q; const inp=$('#q-in'); const val=inp.value;
  if(!idk && !val.trim()){ inp.focus(); return; }
  inp.disabled=true; $('#q-check').disabled=true; $('#q-idk').disabled=true;
  const ok=!idk && matchShort(val,q.acc);
  if(ok){ it.score=1; record(q.id,1);
    $('#q-fb').innerHTML='<div class="fb ok"><span class="blabel">Bonne réponse</span><p>'+esc(q.m)+'</p></div>'; nextButton(); return; }
  $('#q-fb').innerHTML='<div class="fb ko"><span class="blabel">'+(idk?'Réponse attendue':'Pas reconnue automatiquement')+'</span><p>'+esc(q.m)+'</p></div>'+
    '<div class="grade"><span class="eyebrow">'+(idk?'':'Ta réponse était-elle juste, formulée autrement ?')+'</span>'+(idk?'':'<button type="button" class="btn" data-g="1">Oui, j\'avais bon</button>')+'<button type="button" class="btn" data-g="0">'+(idk?'Continuer':'Non, raté')+'</button><a href="#'+q.s+'" class="btn ghost">Relire la fiche</a></div>';
  $$('#q-fb .grade .btn[data-g]').forEach(b=>b.addEventListener('click',()=>{ const s=parseFloat(b.getAttribute('data-g')); it.score=s; record(q.id,s); $$('#q-fb .grade .btn[data-g]').forEach(x=>{ x.disabled=true; x.classList.toggle('done',x===b); }); nextButton(); }));
}
function revealModel(){
  const it=quiz.list[quiz.i], q=it.q;
  $('#q-reveal').disabled=true;
  const written=!!WRITTEN[q.t];
  const btns=written? [0,1,2,3,4].map(p=>'<button type="button" class="btn" data-g="'+(p/4)+'">'+p+' / 4</button>').join('')
    : '<button type="button" class="btn" data-g="1">Je l\'avais</button><button type="button" class="btn" data-g="0.5">À moitié</button><button type="button" class="btn" data-g="0">Raté</button>';
  $('#q-fb').innerHTML=modelHtml(q)+'<div class="grade"><span class="eyebrow">'+(written?'Ta note avec le barème :':'Auto-évaluation :')+'</span>'+btns+'</div>';
  $$('#q-fb .grade .btn').forEach(b=>b.addEventListener('click',()=>{ const s=parseFloat(b.getAttribute('data-g')); it.score=s; record(q.id,s); $$('#q-fb .grade .btn').forEach(x=>{ x.disabled=true; x.classList.toggle('done',x===b); }); nextButton(); }));
}
function nextButton(){
  const last=quiz.i===quiz.list.length-1;
  const nav=$('.qnav'); const b=document.createElement('button'); b.type='button'; b.className='btn primary'; b.textContent=last?'Voir mes résultats':'Question suivante';
  b.addEventListener('click',()=>{ if(last) renderResults(); else { quiz.i++; renderQuestion(); window.scrollTo(0,0); } });
  nav.lastElementChild.replaceWith(b); b.focus({preventScroll:true});
}
document.addEventListener('keydown',e=>{
  if(!quiz || !quiz.list || quiz.done || !$('#view-quiz').classList.contains('on')) return;
  if(e.target && (e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT')) return;
  const opts=$$('#opts .opt:not(:disabled)');
  if(opts.length && /^[1-4]$/.test(e.key)){ const b=opts[parseInt(e.key,10)-1]; if(b) b.click(); }
  else if(e.key==='Enter'){ const nb=$('.qnav .btn.primary'); if(nb) nb.click(); }
});
function renderResults(){
  const L=quiz.list, n=L.length;
  const total=L.reduce((a,it)=>a+(it.score||0),0);
  const byG={}; L.forEach(it=>{ const g=groupOf(it.q.s); byG[g.id]=byG[g.id]||{name:g.name,n:0,s:0}; byG[g.id].n++; byG[g.id].s+=it.score||0; });
  const missed=L.filter(it=>(it.score||0)<1);
  const p=pct(total,n);
  const msg = p>=90?'Excellent. Cette partie est prête.': p>=75?'Solide. Relis les fiches des questions ratées et refais-les.': p>=50?'Ça avance. Concentre-toi sur les fiches ci-dessous avant de continuer.':'Relis les fiches concernées avant de refaire un quiz : ça vaut mieux que de deviner.';
  qroot.innerHTML='<div class="card"><div class="eyebrow">'+esc(quiz.label)+' · résultats</div><h2>'+fmt(total)+' sur '+n+'</h2><p class="lead">'+msg+'</p>'+
    '<div class="score"><div><small>Note</small><b>'+p+' %</b></div><div><small>Réussies</small><b>'+L.filter(it=>it.score>=1).length+'</b></div><div><small>À revoir</small><b>'+missed.length+'</b></div></div>'+
    '<ul class="bygroup">'+Object.keys(byG).map(k=>'<li><span>'+esc(byG[k].name)+'</span><span class="tnum">'+fmt(byG[k].s)+' / '+byG[k].n+'</span><span class="bar"><i style="width:'+pct(byG[k].s,byG[k].n)+'%"></i></span></li>').join('')+'</ul>'+
    '<div class="row">'+(missed.length?'<button type="button" class="btn primary" id="r-redo">Refaire les '+missed.length+' ratée'+(missed.length>1?'s':'')+'</button>':'')+'<button type="button" class="btn" id="r-new">Nouveau quiz</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div></div>'+
    (missed.length?'<div class="card"><div class="eyebrow">À revoir</div><ul class="missed">'+missed.map(it=>'<li>'+esc(it.q.q)+' <a href="#'+it.q.s+'">Fiche '+it.q.s.slice(1)+' : '+esc(TITLE[it.q.s])+'</a></li>').join('')+'</ul></div>':'');
  const rd=$('#r-redo'); if(rd) rd.addEventListener('click',()=>startQuiz({ids:missed.map(it=>it.q.id),n:0,label:'Reprise'}));
  $('#r-new').addEventListener('click',()=>{ quiz=null; renderQuizSetup(); });
  quiz={done:true,list:L,label:quiz.label};
  window.scrollTo(0,0);
}

// ---------------- examen blanc : la vraie structure de l'intra
// Partie 1 : 8 questions à 0,5 (3 courtes, 3 qcm, 2 vf) · Partie 2 : 1 lecture (4) · Partie 3 : 3 développements au choix sur 6 (3 × 4)
let exam=null;
const eroot=$('#exam-root');
function loadDraft(){ try{ const d=JSON.parse(localStorage.getItem(DKEY)||'null'); if(d && d.p1 && d.p1.every(x=>BYID[x.id]) && BYID[d.p2.id] && d.p3.every(x=>BYID[x.id])) return d; }catch(e){} return null; }
function saveDraft(){ if(!exam||exam.submitted) return; try{ localStorage.setItem(DKEY,JSON.stringify({p1:exam.p1.map(x=>({id:x.q.id,order:x.order,sel:x.sel,text:x.text})),p2:{id:exam.p2.q.id,text:exam.p2.text},p3:exam.p3.map(x=>({id:x.q.id,pick:x.pick,text:x.text})),end:exam.end,mins:exam.mins})); }catch(e){} }
function clearDraft(){ try{ localStorage.removeItem(DKEY); }catch(e){} }
function renderExamIntro(){
  exam=null;
  const d=loadDraft();
  eroot.innerHTML='<div class="qwrap"><div class="card"><div class="eyebrow">Examen blanc</div><h2>La copie de l\'intra, en vrai</h2>'+
    '<p class="lead">Même structure que l\'examen du prof : <b>partie 1</b>, 8 questions courtes à 0,5 point; <b>partie 2</b>, une question de lecture sur 4; <b>partie 3</b>, tu choisis 3 questions de développement sur 6, à 4 points chacune. Total sur 20, comme les 20 % de l\'intra.</p>'+
    '<p class="stat-line" style="margin-top:0">La partie 1 est corrigée automatiquement. Pour les parties 2 et 3, tu te notes toi-même avec le corrigé et le barème : sois sévère, comme le prof.</p>'+
    '<div class="field"><label for="e-dur">Durée</label><select id="e-dur"><option value="110">1 h 50 (une séance complète)</option><option value="75">1 h 15</option><option value="0">Sans limite</option></select></div>'+
    '<div class="row"><button type="button" class="btn primary" id="e-start">Commencer l\'examen</button>'+(d?'<button type="button" class="btn" id="e-resume">Reprendre l\'examen en cours</button>':'')+'</div>'+
    '<p class="stat-line">La durée réelle de l\'intra n\'est pas indiquée dans le plan de cours : 1 h 50 correspond à une séance.</p></div>'+
    '<div class="card"><div class="eyebrow">Mes examens blancs</div>'+(state.exams.length?'<ul class="bygroup">'+state.exams.slice().reverse().map(x=>'<li><span>'+esc(x.date)+'</span><span class="tnum">'+fmt(x.score)+' / '+x.total+'</span><span class="bar"><i style="width:'+pct(x.score,x.total)+'%"></i></span></li>').join('')+'</ul>':'<p class="empty">Aucun examen blanc fait pour l\'instant.</p>')+'</div></div>';
  $('#e-start').addEventListener('click',()=>{ if(d && !confirm('Commencer un nouvel examen ? L\'examen en cours sera abandonné.')) return; clearDraft(); startExam(parseInt($('#e-dur').value,10)); });
  const rs=$('#e-resume'); if(rs) rs.addEventListener('click',()=>resumeExam(d));
}
function pickSpread(filter,count){
  const buckets=GROUPS.map(g=>shuffle(BANK.filter(q=>filter(q) && g.s.indexOf(q.s)>=0)));
  const out=[]; let guard=0;
  while(out.length<count && guard<1000){ guard++; let any=false; for(const b of shuffle(buckets.slice())){ if(out.length>=count) break; if(b.length){ out.push(b.pop()); any=true; } } if(!any) break; }
  return out;
}
function startExam(mins){
  const p1=pickSpread(q=>q.t==='courte'&&q.acc&&q.acc.length,3).concat(pickSpread(q=>q.t==='qcm',3),pickSpread(q=>q.t==='vf',2));
  const p2=shuffle(BANK.filter(q=>q.t==='lecture'))[0];
  const p3=pickSpread(q=>q.t==='dev',6);
  exam={p1:shuffle(p1).map(q=>({q:q,order:q.t==='qcm'?shuffle(q.o.map((_,i)=>i)):null,sel:null,text:'',score:null,override:false})),
        p2:{q:p2,text:'',score:null}, p3:p3.map(q=>({q:q,pick:false,text:'',score:null})),
        mins:mins,end:mins?Date.now()+mins*60000:0,timer:null,submitted:false};
  if(mins) exam.timer=setInterval(tickExam,1000);
  saveDraft(); renderExamPaper(); window.scrollTo(0,0);
}
function resumeExam(d){
  exam={p1:d.p1.map(x=>({q:BYID[x.id],order:x.order,sel:x.sel,text:x.text||'',score:null,override:false})),
        p2:{q:BYID[d.p2.id],text:d.p2.text||'',score:null}, p3:d.p3.map(x=>({q:BYID[x.id],pick:!!x.pick,text:x.text||'',score:null})),
        mins:d.mins,end:d.end,timer:null,submitted:false};
  if(exam.end && exam.end<=Date.now()){ submitExam(true); return; }
  if(exam.end) exam.timer=setInterval(tickExam,1000);
  renderExamPaper(); window.scrollTo(0,0);
}
function tickExam(){
  if(!exam||exam.submitted) return;
  const el=$('#e-timer'); if(!el) return;
  const left=exam.end-Date.now();
  if(left<=0){ clearInterval(exam.timer); submitExam(true); return; }
  const h=Math.floor(left/3600000), m=Math.floor((left%3600000)/60000), s=Math.floor((left%60000)/1000);
  el.textContent=(h?h+' h ':'')+(m<10?'0':'')+m+':'+(s<10?'0':'')+s; el.classList.toggle('low',left<10*60000);
}
function answeredCount(){ return exam.p1.filter(x=>x.sel!==null||x.text.trim()).length + (exam.p2.text.trim()?1:0) + exam.p3.filter(x=>x.pick&&x.text.trim()).length; }
function renderExamPaper(){
  const picks=exam.p3.filter(x=>x.pick).length;
  let h='<div class="ewrap"><div class="ebar"><span class="eyebrow">Examen blanc · copie</span><span class="row">'+(exam.mins?'<span class="timer" id="e-timer">--:--</span>':'')+'<button type="button" class="btn primary sm" id="e-submit-top">Remettre ma copie</button></span></div>';
  // partie 1
  h+='<div class="paper"><div class="part-h"><h3>Partie 1 · Questions courtes</h3><span class="pts">4 points · 8 × 0,5</span></div>';
  exam.p1.forEach((it,k)=>{ const q=it.q; let body='';
    if(q.t==='qcm') body='<div class="opts">'+it.order.map((oi,j)=>'<button type="button" class="opt'+(it.sel===oi?' sel':'')+'" data-p1="'+k+'" data-i="'+oi+'"><span class="k">'+String.fromCharCode(97+j)+'</span>'+esc(q.o[oi])+'</button>').join('')+'</div>';
    else if(q.t==='vf') body='<div class="opts"><button type="button" class="opt'+(it.sel===1?' sel':'')+'" data-p1="'+k+'" data-i="1"><span class="k">V</span>Vrai</button><button type="button" class="opt'+(it.sel===0?' sel':'')+'" data-p1="'+k+'" data-i="0"><span class="k">F</span>Faux</button></div>';
    else body='<input type="text" id="p1-'+k+'" data-p1t="'+k+'" autocomplete="off" spellcheck="false" placeholder="Réponse courte" value="'+esc(it.text)+'">';
    h+='<div class="eq"><span class="n">Question '+(k+1)+' · '+TYPES[q.t]+' · 0,5 pt</span><div class="qtext">'+esc(q.q)+'</div>'+body+'</div>'; });
  h+='</div>';
  // partie 2
  const q2=exam.p2.q;
  h+='<div class="paper"><div class="part-h"><h3>Partie 2 · Question de lecture</h3><span class="pts">4 points</span></div>'+passageHtml(q2)+'<div class="qtext">'+esc(q2.q)+'</div><textarea id="p2-text" placeholder="1) Idée principale en une phrase. 2) Deux arguments, chacun avec un exemple précis.">'+esc(exam.p2.text)+'</textarea><div class="lines" id="p2-lines"></div></div>';
  // partie 3
  h+='<div class="paper"><div class="part-h"><h3>Partie 3 · Moyen développement</h3><span class="pts">12 points · 3 × 4</span></div><p class="stat-line" style="margin-top:0">Choisis <b>3 questions sur 6</b> et réponds à chacune en 5 à 6 lignes. <span id="p3-count">'+picks+' / 3 choisies</span></p>';
  exam.p3.forEach((it,k)=>{ const dis=!it.pick && picks>=3;
    h+='<div class="eq'+(it.pick?'':' off')+'"><label class="pick"><input type="checkbox" data-p3="'+k+'"'+(it.pick?' checked':'')+(dis?' disabled':'')+'> Je choisis cette question</label><div class="qtext">'+esc(it.q.q)+'</div>'+(it.pick?'<textarea data-p3t="'+k+'" placeholder="Réponse de 5 à 6 lignes : une phrase qui répond, deux ou trois faits précis, une conséquence.">'+esc(it.text)+'</textarea><div class="lines" data-p3l="'+k+'"></div>':'')+'</div>'; });
  h+='</div><div class="row" style="margin-top:18px;justify-content:space-between"><button type="button" class="btn ghost" id="e-quit">Abandonner</button><button type="button" class="btn primary" id="e-submit">Remettre ma copie</button></div></div>';
  eroot.innerHTML=h;
  if(exam.mins) tickExam();
  $$('.opt[data-p1]').forEach(b=>b.addEventListener('click',()=>{ const k=parseInt(b.getAttribute('data-p1'),10); exam.p1[k].sel=parseInt(b.getAttribute('data-i'),10); $$('.opt[data-p1="'+k+'"]').forEach(x=>x.classList.toggle('sel',x===b)); saveDraft(); }));
  $$('input[data-p1t]').forEach(inp=>inp.addEventListener('input',()=>{ exam.p1[parseInt(inp.getAttribute('data-p1t'),10)].text=inp.value; saveDraft(); }));
  const t2=$('#p2-text'), l2=$('#p2-lines'); const up2=()=>{ const k=lines(t2.value); l2.textContent=k?k+' ligne'+(k>1?'s':'')+' environ':''; }; up2();
  t2.addEventListener('input',()=>{ exam.p2.text=t2.value; up2(); saveDraft(); });
  $$('input[data-p3]').forEach(c=>c.addEventListener('change',()=>{ const k=parseInt(c.getAttribute('data-p3'),10); const it=exam.p3[k];
    if(!c.checked && it.text.trim() && !confirm('Retirer cette question ? Ta réponse sera effacée.')){ c.checked=true; return; }
    it.pick=c.checked; if(!it.pick) it.text=''; saveDraft(); const y=window.scrollY; renderExamPaper(); window.scrollTo(0,y); const ta=$('textarea[data-p3t="'+k+'"]'); if(ta) ta.focus({preventScroll:true}); }));
  $$('textarea[data-p3t]').forEach(ta=>{ const k=ta.getAttribute('data-p3t'); const ln=$('[data-p3l="'+k+'"]'); const up=()=>{ const n=lines(ta.value); ln.textContent=n?n+' ligne'+(n>1?'s':'')+' environ':''; }; up();
    ta.addEventListener('input',()=>{ exam.p3[parseInt(k,10)].text=ta.value; up(); saveDraft(); }); });
  const sub=()=>{ const p=exam.p3.filter(x=>x.pick).length; const miss=8-exam.p1.filter(x=>x.sel!==null||x.text.trim()).length;
    let warn=[]; if(miss) warn.push(miss+' question'+(miss>1?'s':'')+' de la partie 1 sans réponse'); if(!exam.p2.text.trim()) warn.push('la partie 2 est vide'); if(p<3) warn.push('seulement '+p+' développement'+(p>1?'s':'')+' choisi'+(p>1?'s':'')+' sur 3');
    if(!warn.length || confirm('Attention : '+warn.join(', ')+'. Remettre quand même ?')) submitExam(false); };
  $('#e-submit').addEventListener('click',sub); $('#e-submit-top').addEventListener('click',sub);
  $('#e-quit').addEventListener('click',()=>{ if(confirm('Abandonner cet examen blanc ? Rien ne sera enregistré.')){ if(exam.timer) clearInterval(exam.timer); clearDraft(); exam=null; renderExamIntro(); window.scrollTo(0,0); } });
}
function submitExam(timeout){
  if(exam.timer) clearInterval(exam.timer);
  exam.submitted=true; clearDraft();
  exam.p1.forEach(it=>{ const q=it.q;
    if(q.t==='qcm') it.score=it.sel===q.a?0.5:0;
    else if(q.t==='vf') it.score=(it.sel!==null && (it.sel===1)===q.a)?0.5:0;
    else it.score=matchShort(it.text,q.acc)?0.5:0;
    record(q.id,it.score*2); });
  exam.timeout=timeout; renderCorrection(); window.scrollTo(0,0);
}
function examTotals(){
  const p1=exam.p1.reduce((a,it)=>a+it.score,0);
  const chosen=exam.p3.filter(x=>x.pick);
  const graded=exam.p2.score!==null && chosen.every(x=>x.score!==null);
  const p2=exam.p2.score||0, p3=chosen.reduce((a,x)=>a+(x.score||0),0);
  return {p1:p1,p2:p2,p3:p3,graded:graded,total:p1+p2+p3};
}
function ptsButtons(cur,attr){ return '<div class="pts-btns" '+attr+'><span class="eyebrow">Ma note :</span>'+[0,0.5,1,1.5,2,2.5,3,3.5,4].map(p=>'<button type="button" class="btn sm'+(cur===p?' done':'')+'" data-v="'+p+'">'+fmt(p)+'</button>').join('')+'</div>'; }
function renderCorrection(){
  const T=examTotals();
  const chosen=exam.p3.filter(x=>x.pick);
  let h='<div class="ewrap"><div class="card" id="e-head">'+headHtml(T,chosen)+'</div>';
  h+='<div class="paper"><div class="part-h"><h3>Partie 1 · corrigée automatiquement</h3><span class="pts" id="c-p1">'+fmt(T.p1)+' / 4</span></div>';
  exam.p1.forEach((it,k)=>{ const q=it.q; let you='';
    if(q.t==='qcm'){ const ok=it.score>0; you='<p class="res '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.sel===null?'aucune':esc(q.o[it.sel]))+'</b>'+(ok?' ✓':'')+'</p>'+(ok?'':'<p class="res">Bonne réponse : <b>'+esc(q.o[q.a])+'</b></p>')+'<p style="font-size:15px;color:var(--ink-2);margin-top:6px">'+esc(q.w)+'</p>'; }
    else if(q.t==='vf'){ const ok=it.score>0; you='<p class="res '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.sel===null?'aucune':(it.sel===1?'Vrai':'Faux'))+'</b>'+(ok?' ✓':'')+'</p>'+(ok?'':'<p class="res">Bonne réponse : <b>'+(q.a?'Vrai':'Faux')+'</b></p>')+'<p style="font-size:15px;color:var(--ink-2);margin-top:6px">'+esc(q.w)+'</p>'; }
    else { const ok=it.score>0; you='<p class="res '+(ok?'ok':'ko')+'">Ta réponse : <b>'+(it.text.trim()?esc(it.text):'aucune')+'</b>'+(ok?' ✓':'')+'</p><p class="res">Réponse attendue : <b>'+esc(ansHead(q))+'</b></p><p style="font-size:15px;color:var(--ink-2);margin-top:6px">'+esc(q.m)+'</p>'+
      (!ok && it.text.trim()?'<div class="grade"><button type="button" class="btn sm'+(it.override?' done':'')+'" data-ov="'+k+'">'+(it.override?'Comptée juste ✓':'Ma réponse était juste (autre formulation)')+'</button></div>':''); }
    h+='<div class="eq"><span class="n">Question '+(k+1)+' · '+TYPES[q.t]+' · <a href="#'+q.s+'">fiche '+q.s.slice(1)+'</a></span><div class="qtext">'+esc(q.q)+'</div>'+you+'</div>'; });
  h+='</div>';
  const q2=exam.p2.q;
  h+='<div class="paper"><div class="part-h"><h3>Partie 2 · à noter avec le barème</h3><span class="pts" id="c-p2">'+(exam.p2.score===null?'… ':fmt(exam.p2.score))+' / 4</span></div><div class="qtext">'+esc(q2.q)+'</div><p class="res">Ta réponse :</p><div class="fb" style="white-space:pre-wrap;margin-top:4px">'+(exam.p2.text.trim()?esc(exam.p2.text):'<span class="empty">aucune réponse</span>')+'</div>'+modelHtml(q2)+ptsButtons(exam.p2.score,'data-g2="1"')+'</div>';
  h+='<div class="paper"><div class="part-h"><h3>Partie 3 · à noter avec le barème</h3><span class="pts" id="c-p3">'+fmt(T.p3)+' / 12</span></div>';
  if(!chosen.length) h+='<p class="empty">Aucune question choisie.</p>';
  exam.p3.forEach((it,k)=>{ if(!it.pick) return; const q=it.q;
    h+='<div class="eq"><span class="n"><a href="#'+q.s+'">fiche '+q.s.slice(1)+'</a></span><div class="qtext">'+esc(q.q)+'</div><p class="res">Ta réponse ('+lines(it.text)+' lignes environ) :</p><div class="fb" style="white-space:pre-wrap;margin-top:4px">'+(it.text.trim()?esc(it.text):'<span class="empty">aucune réponse</span>')+'</div>'+modelHtml(q)+ptsButtons(it.score,'data-g3="'+k+'"')+'</div>'; });
  const others=exam.p3.filter(x=>!x.pick);
  if(others.length) h+='<p class="stat-line">Questions non choisies (à réviser aussi) : '+others.map(x=>esc(x.q.q)).join(' · ')+'</p>';
  h+='</div></div>';
  eroot.innerHTML=h;
  bindCorrection();
}
function headHtml(T,chosen){
  const n3=chosen.length*4;
  return '<div class="eyebrow">Examen blanc · correction</div><h2>'+(T.graded?fmt(T.total)+' / 20':'Note tes parties 2 et 3')+'</h2>'+
    (exam.timeout?'<p class="lead">Le temps est écoulé : la copie a été remise automatiquement.</p>':'')+
    '<div class="score"><div><small>Partie 1</small><b>'+fmt(T.p1)+'<span style="font-size:16px;color:var(--muted)"> / 4</span></b></div><div><small>Partie 2</small><b>'+(exam.p2.score===null?'…':fmt(T.p2))+'<span style="font-size:16px;color:var(--muted)"> / 4</span></b></div><div><small>Partie 3</small><b>'+(T.graded?fmt(T.p3):'…')+'<span style="font-size:16px;color:var(--muted)"> / '+(n3||12)+'</span></b></div></div>'+
    (T.graded?'<p class="lead">'+(T.total>=17?'Excellent : tu es prêt.':T.total>=14?'Bien. Relis les corrigés des questions où tu as perdu des points.':T.total>=10?'La note de passage est là, mais il reste du travail : reprends les fiches des questions ratées.':'Reprends les fiches et les cartes éclair, puis refais un examen blanc demain.')+'</p><div class="row"><button type="button" class="btn primary" id="e-again">Nouvel examen blanc</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div>'
      :'<p class="stat-line">Compare ta réponse au corrigé, puis clique ta note. Un argument sans exemple précis vaut la moitié.</p>');
}
function bindCorrection(){
  function refresh(){ const T=examTotals(); const chosen=exam.p3.filter(x=>x.pick); $('#e-head').innerHTML=headHtml(T,chosen); $('#c-p1').textContent=fmt(T.p1)+' / 4'; $('#c-p2').textContent=(exam.p2.score===null?'… ':fmt(exam.p2.score))+' / 4'; $('#c-p3').textContent=fmt(T.p3)+' / 12';
    const ag=$('#e-again'); if(ag) ag.addEventListener('click',()=>{ exam=null; renderExamIntro(); window.scrollTo(0,0); });
    if(T.graded && !exam.saved){ exam.saved=true; state.exams.push({date:new Date().toLocaleDateString('fr-CA',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}),score:T.total,total:20}); if(state.exams.length>20) state.exams.shift(); save(); }
    else if(T.graded && exam.saved){ state.exams[state.exams.length-1].score=T.total; save(); } }
  $$('[data-ov]').forEach(b=>b.addEventListener('click',()=>{ const it=exam.p1[parseInt(b.getAttribute('data-ov'),10)]; it.override=!it.override; it.score=it.override?0.5:0; if(state.stats[it.q.id]){ state.stats[it.q.id].last=it.score*2; save(); updateBadge(); } b.classList.toggle('done',it.override); b.textContent=it.override?'Comptée juste ✓':'Ma réponse était juste (autre formulation)'; refresh(); }));
  $$('.pts-btns').forEach(box=>box.addEventListener('click',e=>{ const b=e.target.closest('button[data-v]'); if(!b) return; const v=parseFloat(b.getAttribute('data-v'));
    let it; if(box.hasAttribute('data-g2')) it=exam.p2; else it=exam.p3[parseInt(box.getAttribute('data-g3'),10)];
    const first=it.score===null; it.score=v; if(first) record(it.q.id,v/4); else { state.stats[it.q.id].last=v/4; save(); updateBadge(); }
    $$('button[data-v]',box).forEach(x=>x.classList.toggle('done',x===b)); refresh(); }));
  refresh();
}

// ---------------- cartes éclair
let deck=null;
const croot=$('#cards-root');
function renderCardsSetup(){
  deck=null;
  const cards=BANK.filter(q=>q.t==='courte');
  croot.innerHTML='<div class="card"><div class="eyebrow">Cartes éclair</div><h2>Une question, une réponse</h2><p class="lead">Idéal pour la partie 1 : définitions, personnages, dates. Réfléchis, retourne la carte, puis dis honnêtement si tu l\'avais. Les cartes « à revoir » reviennent en fin de paquet.</p>'+
    '<div class="field"><label>Blocs de matière</label><div class="chips" id="c-groups">'+GROUPS.map(g=>'<button type="button" class="chip" data-g="'+g.id+'" aria-pressed="true">'+g.name+'<span class="cnt">'+cards.filter(q=>g.s.indexOf(q.s)>=0).length+'</span></button>').join('')+'</div></div>'+
    '<div class="row"><button type="button" class="btn primary" id="c-start">Commencer</button><span class="stat-line" id="c-avail"></span></div></div>';
  function sel(){ const gs=$$('#c-groups .chip').filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.getAttribute('data-g')); const secs=GROUPS.filter(g=>gs.indexOf(g.id)>=0).reduce((a,g)=>a.concat(g.s),[]); const l=cards.filter(q=>secs.indexOf(q.s)>=0); $('#c-avail').textContent=l.length+' carte'+(l.length>1?'s':''); $('#c-start').disabled=!l.length; return l; }
  $$('#c-groups .chip').forEach(c=>c.addEventListener('click',()=>{ c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true'); sel(); }));
  sel();
  $('#c-start').addEventListener('click',()=>{ deck={queue:shuffle(sel().slice()),flipped:false,ok:0,again:0,total:0}; deck.total=deck.queue.length; renderCard(); });
}
function renderCard(){
  if(!deck.queue.length){ croot.innerHTML='<div class="card"><div class="eyebrow">Cartes éclair · terminé</div><h2>Paquet terminé</h2><div class="score"><div><small>Sues du premier coup</small><b>'+deck.ok+'</b></div><div><small>Revues</small><b>'+deck.again+'</b></div></div><div class="row"><button type="button" class="btn primary" id="c-new">Nouveau paquet</button><a class="btn ghost" href="#fiches">Retour aux fiches</a></div></div>'; $('#c-new').addEventListener('click',renderCardsSetup); return; }
  const q=deck.queue[0];
  const done=deck.total-deck.queue.length;
  croot.innerHTML='<div class="card"><div class="qhead"><span class="eyebrow">Cartes éclair · '+deck.queue.length+' restante'+(deck.queue.length>1?'s':'')+'</span><span class="qtype">'+esc(TITLE[q.s])+'</span></div>'+
    '<div class="progress"><i style="width:'+pct(Math.max(0,done),deck.total)+'%"></i></div>'+
    '<div class="flash" id="c-card" role="button" tabindex="0"><div class="side" id="c-front">'+esc(q.q)+'</div><div class="side back" id="c-back" hidden>'+(q.acc&&q.acc.length?'<p style="font-family:var(--f-display);font-size:26px;margin-bottom:6px">'+esc(ansHead(q))+'</p>':'')+'<p>'+esc(q.m)+'</p></div><div class="hint" id="c-hint">Clique ou appuie sur Espace pour retourner</div></div>'+
    '<div class="grade" id="c-grade" hidden><button type="button" class="btn" data-r="ok">Je l\'avais</button><button type="button" class="btn" data-r="again">À revoir</button><a href="#'+q.s+'" class="btn ghost">Relire la fiche</a></div>'+
    '<div class="qnav"><button type="button" class="btn ghost" id="c-quit">Arrêter</button></div></div>';
  const flip=()=>{ if(deck.flipped) return; deck.flipped=true; $('#c-front').hidden=true; $('#c-back').hidden=false; $('#c-hint').hidden=true; $('#c-grade').hidden=false; };
  $('#c-card').addEventListener('click',flip);
  $('#c-card').addEventListener('keydown',e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); flip(); } });
  $$('#c-grade .btn[data-r]').forEach(b=>b.addEventListener('click',()=>{ const r=b.getAttribute('data-r'); deck.queue.shift(); deck.flipped=false; if(r==='ok'){ deck.ok++; record(q.id,1); } else { deck.again++; record(q.id,0); deck.queue.push(q); } renderCard(); }));
  $('#c-quit').addEventListener('click',()=>{ deck=null; renderCardsSetup(); });
  $('#c-card').focus({preventScroll:true});
}

// ---------------- révision express
$$('[data-express]').forEach(b=>b.addEventListener('click',()=>{
  const all=GROUPS.reduce((a,g)=>a.concat(g.s),[]);
  const k=b.getAttribute('data-express');
  if(k==='p1'){ const l=shuffle(BANK.filter(q=>q.t==='courte'&&q.acc&&q.acc.length)).slice(0,3).concat(shuffle(BANK.filter(q=>q.t==='qcm')).slice(0,3),shuffle(BANK.filter(q=>q.t==='vf')).slice(0,2)); startQuiz({ids:l.map(q=>q.id),n:0,label:'Comme la partie 1'}); }
  else if(k==='p2') startQuiz({sections:all,types:['lecture'],n:1,prio:false,label:'Comme la partie 2'});
  else startQuiz({sections:all,types:['dev'],n:3,prio:false,label:'Comme la partie 3'});
  location.hash='#quiz';
}));
(function(){ const btn=$('#x-chrono'), out=$('#x-timer'); if(!btn) return; let t0=null, id=null;
  btn.addEventListener('click',()=>{ if(id){ clearInterval(id); id=null; btn.textContent='Relancer le chrono'; return; }
    t0=Date.now(); out.hidden=false; btn.textContent='Arrêter le chrono';
    id=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); const m=Math.floor(s/60); out.textContent=(m<10?'0':'')+m+':'+(s%60<10?'0':'')+(s%60); out.classList.toggle('low',m>=30); },1000); });
})();

// ---------------- démarrage
refreshMastery(); updateBadge();
route();
})();
