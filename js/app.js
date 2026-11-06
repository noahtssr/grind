Object.keys(COL).forEach(k=>COL[k]="#7c5cff");
/* ================= STATE ================= */
let doneAt=store('doneAt')||{};           // key -> date checked
let fcm=store('fcm')||{};                 // flashcard mastery: subj -> {idx:1|0}
let qm=store('qm')||{};                   // mcq mastery: subj -> {idx:1|0}
let grades=store('grades')||{};           // subj -> {compIdx:grade}
let weights=store('weights')||{};         // subj -> [w...]
let assume=store('assume'); if(assume==null) assume=12;
let LANG=store('lang')||'course';
let PLAN=buildPlan();
const app=document.getElementById('app');
let view='home', subj=null, stab='overview', curCh=0, calMonth='2026-11', calSel=null;
const charts=[];

const SHORT={DI:'Digital Innovation',AFA:'Financial Accounting',GT:'Grand Test',MS:'Market Structures',LV:'Spanish (LV1)',ECO:'Econometrics',ST:'Sales Techniques',MM:'Marketing Mgmt',COST:'Cost Accounting',OM:'Operations Mgmt',TL:'Trademark Law'};
const NAV=[['home','🏠','Dashboard'],['library','📚','Subjects'],['review','🔁','Review'],['calendar','📅','Revision calendar'],['progress','📈','Progress'],['grades','🎯','Grades & targets'],['profile','👤','My profile']];
const T=todayStr();

/* ================= HELPERS ================= */
const subjBlocks=s=>PLAN.flatMap(p=>p.blocs).filter(b=>b.s===s);
function prog(s){const a=s?subjBlocks(s):PLAN.flatMap(p=>p.blocs);const d=a.filter(b=>done[b.key]).length;return {d,n:a.length,p:a.length?Math.round(d/a.length*100):0};}
function getW(s){return GRADING[s].map((c,i)=>weights[s]&&weights[s][i]!=null?+weights[s][i]:c.w);}
function required(s){
  const comps=GRADING[s], w=getW(s), g=grades[s]||{}; let acc=0, fw=0, assumed=false;
  comps.forEach((c,i)=>{ if(c.fin){fw+=w[i];return;} const v=g[i]; if(v===''||v==null){acc+=w[i]*assume;assumed=true;} else acc+=w[i]*(+v); });
  const tot=w.reduce((a,b)=>a+b,0)||100; if(!fw) return null;
  const r=(10*tot-acc)/fw; return {r,assumed,known:Object.values(g).some(v=>v!==''&&v!=null)};
}
function reqBadge(s,big){const q=required(s); if(!q) return '';
  const r=q.r; let cls='ok',txt;
  if(r<=0){txt='Already secured';} else if(r>20){cls='bad';txt='> 20 · not reachable';} else {cls=r>=14?'bad':r>=11?'warn':'ok';txt=r.toFixed(1)+'/20';}
  return big?`<span class="req" style="color:var(--${cls==='ok'?'ok':cls==='warn'?'warn':'bad'})">${txt}</span>`:`<span class="pill ${cls}">${txt}</span>`;}
function streak(){const days=new Set(Object.entries(done).filter(([k,v])=>v).map(([k])=>doneAt[k]||k.split('|')[0]));let n=0,d=T;if(!days.has(d))d=addD(d,-1);while(days.has(d)){n++;d=addD(d,-1);}return n;}
function countdown(e){const n=diff(T,e.date);return n>0?'D-'+n:(n===0?'Today':'Done');}
let myCards=store('myCards')||{};
function baseCards(s){const base=CONTENT[s]||{},en=(window.EN||{})[s];return ((LANG==='fr'||!en)?base.cards:en.cards)||[];}
function contentFor(s){const base=CONTENT[s]||{},en=(window.EN||{})[s];const c=(LANG==='fr'||!en)?Object.assign({},base):Object.assign({},base,{format:en.format,fiches:en.fiches,cards:en.cards,exos:en.exos});const mine=(myCards[s]||[]).map(x=>[x.f,x.b]);c.cards=(c.cards||[]).concat(mine);if(!c.cards.length)c.cards=null;return c;}
function shiftIdx(map,idx){if(!map)return map;const o={};Object.entries(map).forEach(([k,v])=>{const n=+k;if(n<idx)o[k]=v;else if(n>idx)o[n-1]=v;});return o;}
function myCardsModal(s){
  const m=document.getElementById('modal');const nb=baseCards(s).length;
  const draw=(err)=>{const L=myCards[s]||[];
    m.innerHTML=`<div class="modal"><div class="box" style="max-width:620px"><h2>✏️ My flashcards · ${EX[s].name}</h2><p class="mut" style="margin-top:-4px">Add your own cards: they join this subject's flashcards, reviews and spaced repetition.</p>
     <label class="fl">Front (question or term)<textarea id="mcf" rows="2" maxlength="400" style="width:100%;margin-top:6px;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)"></textarea></label>
     <label class="fl">Back (answer)<textarea id="mcb" rows="3" maxlength="1200" style="width:100%;margin-top:6px;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)"></textarea></label>
     <div id="mce" class="oerr">${err||''}</div>
     <div style="display:flex;justify-content:flex-end"><button class="btn pri" id="mcadd">➕ Add the card</button></div>
     <h3 style="margin-top:18px">Your cards (${L.length})</h3>
     ${L.length?`<div data-notr>${L.map((x,i)=>`<div class="grow" style="align-items:flex-start"><div style="flex:1;min-width:0"><b class="mcfr"></b><div class="small mut mcbk"></div></div><button class="btn sm" data-mcdel="${i}" aria-label="Delete this card" style="color:var(--bad);border-color:var(--bad)">🗑</button></div>`).join('')}</div>`:'<p class="small mut">No cards yet.</p>'}
     <div style="text-align:right;margin-top:14px"><button class="btn" id="mcclose">Close</button></div></div></div>`;
    m.querySelectorAll('.mcfr').forEach((el,i)=>el.textContent=L[i].f);m.querySelectorAll('.mcbk').forEach((el,i)=>el.textContent=L[i].b);
    document.getElementById('mcclose').onclick=()=>{m.innerHTML='';render();};
    document.getElementById('mcadd').onclick=()=>{const f=document.getElementById('mcf').value.trim(),b=document.getElementById('mcb').value.trim();
      if(!f||!b){draw('Fill in both sides of the card.');return;}
      myCards[s]=(myCards[s]||[]).concat([{f,b,at:T}]);store('myCards',myCards);toast('✓ Card added');draw();setTimeout(()=>{const x=document.getElementById('mcf');if(x)x.focus();},30);};
    m.querySelectorAll('[data-mcdel]').forEach(btn=>btn.onclick=()=>{const i=+btn.dataset.mcdel;
      if(btn.dataset.sure!=='1'){btn.dataset.sure='1';btn.textContent='Delete?';return;}
      const idx=nb+i;myCards[s].splice(i,1);store('myCards',myCards);
      if(fcm[s]){fcm[s]=shiftIdx(fcm[s],idx);store('fcm',fcm);}if(srs[s]){srs[s]=shiftIdx(srs[s],idx);store('srs',srs);}
      toast('🗑 Card deleted');draw();});
  };
  draw();setTimeout(()=>{const x=document.getElementById('mcf');if(x)x.focus();},30);
}
function setDone(k,v){if(v){done[k]=true;doneAt[k]=T;}else{delete done[k];delete doneAt[k];}store('done',done);store('doneAt',doneAt);}
function go(v,s){view=v;drawer=false;if(s){subj=s;stab='overview';curCh=0;}try{location.hash=v==='subject'?'s-'+subj:v}catch(e){}render();window.scrollTo(0,0);}
function killCharts(){while(charts.length)charts.pop().destroy();}

/* ================= NAV ================= */
let wkOpen=store('wkOpen')||null, drawer=false;
function weekGroups(){const g=[];EXAMS.forEach(e=>{const d=s2d(e.date),wd=(d.getUTCDay()+6)%7,mon=addD(e.date,-wd);let w=g.find(x=>x.mon===mon);if(!w){w={mon,ex:[]};g.push(w);}w.ex.push(e);});g.sort((a,b)=>a.mon<b.mon?-1:1);
 g.forEach((w,i)=>{w.i=i;const ds=w.ex.map(e=>s2d(e.date).getUTCDate()),m=MONTHS[s2d(w.ex[0].date).getUTCMonth()],a=Math.min(...ds),b=Math.max(...ds);w.label=`Week ${i+1} · ${a===b?a:a+'–'+b} ${m}`;w.past=w.ex.every(e=>diff(T,e.date)<0);});return g;}
function isOpen(w,gs){if(wkOpen&&wkOpen[w.mon]!==undefined)return wkOpen[w.mon];if(view==='subject'&&w.ex.some(e=>e.id===subj))return true;const first=gs.find(x=>!x.past);return first?first.mon===w.mon:false;}
function navHTML(mobile){
  const gs=weekGroups();
  if(mobile){const cur=view==='subject'&&subj?EX[subj].name:(NAV.find(n=>n[0]===view)||NAV[0])[2];return `<span class="mbrand" data-home="1" role="link" tabindex="0" title="Dashboard"><svg class="logo" width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#7c5cff"/><path d="M21.6 10.2A8 8 0 1 0 24 16h-7" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.5 3.8l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff"/></svg><span>Grind<i>.</i></span></span><span class="mcur">${cur}</span><button class="burger" data-burger="1" aria-label="Menu">☰</button>`;}
  const subName=e=>e.name.replace(' & Data Analysis','').replace('Espagnol · ENDT LV1 S3','Spanish (LV1)');
  return `<div class="brand" data-home="1" role="link" tabindex="0" title="Dashboard"><svg class="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#7c5cff"/><path d="M21.6 10.2A8 8 0 1 0 24 16h-7" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.5 3.8l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff"/></svg><div><div class="bw">Grind<i>.</i></div><div class="bt">S3 finals · Dec 2026</div></div></div><div class="bsub"><a href="#" class="me" data-me="1" title="Your profile">${prof()?(prof().first+' '+prof().last).replace(/</g,''):'Set up your profile'} ✎</a> · IÉSEG BA S3 <span class="syncdot ${syncState}"></span></div>
  ${xpWidget()}
  <div class="nav">${NAV.map(([k,i,l])=>`<a class="${view===k?'on':''}" data-v="${k}"><span class="ico">${i}</span>${l}${k==='review'&&reviewCount()?`<span class="rcount">${reviewCount()}</span>`:''}</a>`).join('')}</div>
  <div class="navh">Subjects by exam week</div>
  ${gs.map(w=>{const o=isOpen(w,gs);return `<div class="wk ${w.past?'past':''}"><button class="wkh" data-wk="${w.mon}" aria-expanded="${o}"><span class="car">${o?'▾':'▸'}</span>${w.label}<span class="wkn">${w.ex.length}</span></button>
   ${o?`<div class="nav">${w.ex.map(e=>`<a class="${view==='subject'&&subj===e.id?'on':''}" data-s="${e.id}"><span class="dot" style="background:${COL[e.id]}"></span>${subName(e)}<span class="cd">${countdown(e)}</span></a>`).join('')}</div>`:''}</div>`;}).join('')}
  </div>`;
}
function bindNav(root){root.querySelectorAll('[data-ui]').forEach(b=>b.onclick=()=>{setUILang(b.dataset.ui);render();});root.querySelectorAll('[data-home]').forEach(a=>{a.onclick=()=>{drawer=false;go('home');};a.onkeydown=e=>{if(e.key==='Enter')a.onclick();};});root.querySelectorAll('[data-me]').forEach(a=>a.onclick=e=>{e.preventDefault();go('profile');});root.querySelectorAll('[data-wk]').forEach(b=>b.onclick=()=>{const gs=weekGroups(),w=gs.find(x=>x.mon===b.dataset.wk);wkOpen=wkOpen||{};wkOpen[w.mon]=!isOpen(w,gs);store('wkOpen',wkOpen);render();});root.querySelectorAll('[data-burger]').forEach(b=>b.onclick=()=>{drawer=true;render();});root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{drawer=false;render();});root.querySelectorAll('[data-v]').forEach(a=>a.onclick=()=>go(a.dataset.v));root.querySelectorAll('[data-s]').forEach(a=>a.onclick=()=>go('subject',a.dataset.s));root.querySelectorAll('[data-lang]').forEach(a=>a.onclick=()=>{LANG=LANG==='fr'?'course':'fr';store('lang',LANG);render();});}

/* ================= TASKS ================= */
function taskHTML(b,showDay){const e=EX[b.s];return `<div class="task ${done[b.key]?'done':''}" style="--sc:${COL[b.s]}"><input type="checkbox" data-k="${b.key}" ${done[b.key]?'checked':''}>
 <div style="flex:1;min-width:0"><div class="tt"><span class="chip" style="margin-right:7px">${b.s}</span>${e.name} — ${b.ch}</div>
 <div class="small mut">${showDay?fmt(b.key.split('|')[0])+' · ':''}${b.act} · 25 min · <a href="#" data-open="${b.s}" data-ch="${b.chi}">notes</a></div></div>
 ${done[b.key]?'<span class="donebadge">✓ Done</span>':`<button class="play" data-start="${b.key}">▶ Start</button>`}</div>`;}
function bindTasks(root){root.querySelectorAll('input[data-k]').forEach(c=>c.onchange=()=>{setDone(c.dataset.k,c.checked);addXP(c.checked?50:-50,c.checked?'· block done':'');if(c.checked)confetti(60);render();});
 root.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>startSession(b.dataset.start));
 root.querySelectorAll('[data-open]').forEach(a=>a.onclick=ev=>{ev.preventDefault();subj=a.dataset.open;view='subject';stab='notes';curCh=+a.dataset.ch||0;render();window.scrollTo(0,0);});}

/* ================= DASHBOARD ================= */
let tmLeft=1500,tmInt=null,tmMode='work';
function viewHome(){
  const p=PLAN.find(x=>x.day===T), all=prog(), st=streak(), next=EXAMS.filter(e=>e.date>=T).slice(0,4), first=EXAMS[0];
  const nDone=Object.values(done).filter(Boolean).length, hrs=Math.round(nDone*25/60*10)/10;
  const h=new Date().getHours(), hi=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  const nextB=PLAN.flatMap(x=>x.blocs).find(b=>!done[b.key]&&b.key.split('|')[0]>=T)||PLAN.flatMap(x=>x.blocs).find(b=>!done[b.key]);
  const todayDone=p&&p.blocs.length?p.blocs.filter(b=>done[b.key]).length:0, todayN=p?p.blocs.length:0;
  const qRight=Object.values(qm).reduce((a,o)=>a+Object.values(o).filter(v=>v===1).length,0);
  const cDone=chal[T]!=null;
  let html=`<div class="hero mb"><div class="blob b1"></div><div class="blob b2"></div><div style="position:relative;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-end">
   <div><p>${fmt(T)} · Level ${lvl()} ${title()}</p><h1>${hi}${prof()?', '+prof().first.replace(/</g,''):''} 👋</h1><p>${todayN?`Today: <b>${todayDone}/${todayN}</b> blocks done${todayDone===todayN?' — day complete! 🎉':''}`:p&&p.off?'Evening off today 😌':(prof()&&T<prof().start)?`Your revision starts on <b>${fmt(prof().start)}</b>`:'Exam period — you got this 💪'}</p>
   ${(()=>{const ex=EXAMS.find(e=>{const d=diff(T,e.date);return d>=0&&d<=1;});return ex?`<button class="cta" data-cram="${ex.id}" style="margin-right:8px">📄 J-1 cram sheet · ${ex.id}</button>`:'';})()}${nextB?`<button class="cta" data-start="${nextB.key}">▶ Start next session · ${nextB.s} — ${nextB.ch.split(' · ')[0]}</button>`:''}</div>
   <div style="text-align:right"><div class="big">${Math.max(0,diff(T,first.date))}</div><p>days before the first exam</p></div></div></div>
  <div class="g g4 mb">
   <div class="kpi k1"><div class="v">${all.p}%</div><div class="l">of the plan completed</div><div class="kb"><i style="width:${all.p}%"></i></div></div>
   <div class="kpi k2"><div class="v">🔥 ${st}</div><div class="l">day${st>1?'s':''} streak</div></div>
   <div class="kpi k3"><div class="v">⭐ ${xp}</div><div class="l">XP · level ${lvl()}</div><div class="kb"><i style="width:${Math.round((xp%LVL)/LVL*100)}%"></i></div></div>
   <div class="kpi k4"><div class="v">🧠 ${qRight}</div><div class="l">MCQs answered right · ${hrs}h studied</div></div>
  </div>
  <div class="g g2 mb" style="grid-template-columns:1.4fr 1fr">
   <div class="card"><h2>📋 Today's plan${reviewCount()?`<span class="sp" style="flex:1"></span><button class="pill rvp" data-v="review">🔁 ${reviewCount()} to review</button>`:''}</h2>${!p?'<p class="mut">The plan covers 2 Nov – 16 Dec.</p>':(!p.off&&!p.blocs.length&&prof()&&T<prof().start)?`<p class="mut">Your revision starts on <b>${fmt(prof().start)}</b>. Until then, you can already explore the subjects, flashcards and MCQs.</p>`:p.off?`<p class="mut">Evening off. <button class="btn sm" id="unoff">Actually I'll study tonight</button></p>`:p.blocs.map(b=>taskHTML(b)).join('')+`<div style="margin-top:12px"><button class="btn sm" id="mkoff">I can't tonight</button> <span class="small mut">Blocks are redistributed over the next days.</span></div>`}</div>
   <div class="g">
    <div class="card chal ${cDone?'cdone':''}"><h2>⚔️ Daily challenge</h2><p class="small" style="margin:0 0 12px;opacity:.95">${cDone?`Done today: <b>${chal[T]}/10</b>. Come back tomorrow for a new one!`:'10 mixed questions from your next exams · 20 s each · combos = bonus XP'}</p><button class="btn ${cDone?'':'pri'} big" id="chalbtn">${cDone?'Play again':'Take the challenge · +100 XP'}</button></div>
   <div class="card"><h2>⏳ Next exams</h2>${next.map(e=>`<div class="grow" style="cursor:pointer" data-s="${e.id}"><span class="chip" style="--sc:${COL[e.id]}">${e.id}</span><div style="flex:1"><b>${e.name}</b><div class="small mut">${fmt(e.date)} · ${e.time}</div></div><div style="text-align:right">${reqBadge(e.id)}<div class="small mut">${countdown(e)}</div></div></div>`).join('')}<p class="small mut" style="margin:8px 0 0">Badge = grade needed at the final to get 10/20.</p></div>
   </div>
  </div>
  <div class="mb">${classesCard()}</div>
  `;
  app.innerHTML=html; bindTasks(app); bindNav(app); bindClasses(app);
  app.querySelectorAll('.cta[data-start]').forEach(b=>b.onclick=()=>startSession(b.dataset.start));
  app.querySelectorAll('[data-cram]').forEach(b=>b.onclick=()=>{subj=b.dataset.cram;view='cram';render();window.scrollTo(0,0);});
  document.getElementById('chalbtn').onclick=startChallenge;
  const mk=document.getElementById('mkoff'); if(mk) mk.onclick=()=>{off[T]=1;store('off',off);PLAN=buildPlan();render();};
  const un=document.getElementById('unoff'); if(un) un.onclick=()=>{delete off[T];store('off',off);PLAN=buildPlan();render();};
}
function timerBind(){const el=document.getElementById('tm'),m=document.getElementById('tmm'),g=document.getElementById('tgo'),r=document.getElementById('trs');if(!el)return;
 const show=()=>{el.textContent=String(Math.floor(tmLeft/60)).padStart(2,'0')+':'+String(tmLeft%60).padStart(2,'0');m.textContent=tmMode==='work'?'Focus':'Break';g.textContent=tmInt?'Pause':'Start';document.title=tmInt?el.textContent+' · '+(tmMode==='work'?'Focus':'Break'):'Révisions partiels — Noah';};
 show(); g.onclick=()=>{if(tmInt){clearInterval(tmInt);tmInt=null;}else{tmInt=setInterval(()=>{tmLeft--;if(tmLeft<=0){tmMode=tmMode==='work'?'break':'work';tmLeft=tmMode==='work'?1500:300;}const e2=document.getElementById('tm');if(e2)show();},1000);}show();};
 r.onclick=()=>{clearInterval(tmInt);tmInt=null;tmMode='work';tmLeft=1500;show();};}

/* ================= CALENDAR ================= */
function viewCalendar(){
  const [y,mo]=calMonth.split('-').map(Number); const first=new Date(Date.UTC(y,mo-1,1)); const startDow=(first.getUTCDay()+6)%7; const days=new Date(Date.UTC(y,mo,0)).getUTCDate();
  let cells=''; for(let i=0;i<startDow;i++) cells+='<div class="cell out"></div>';
  for(let d=1;d<=days;d++){const ds=`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const p=PLAN.find(x=>x.day===ds);const ex=EXAMS.filter(e=>e.date===ds);
    const cls=['cell'];if(ds===T)cls.push('today');if(ds===calSel)cls.push('sel');if(ex.length)cls.push('exam');if(p&&p.off)cls.push('off');if(!p&&!ex.length)cls.push('out');
    cells+=`<div class="${cls.join(' ')}" data-day="${ds}"><div class="d">${d}</div>${ds===T?'<span class="tday">Today</span>':''}${ex.map(e=>`<span class="ex">📝 ${e.id} ${e.time.split('–')[0]}</span>`).join('')}${p?p.blocs.map(b=>`<span class="b ${done[b.key]?'dn':''}" style="background:${COL[b.s]}">${b.s}</span>`).join(''):''}</div>`;}
  if(!calSel) calSel=T; const sel=calSel&&PLAN.find(x=>x.day===calSel);
  app.innerHTML=`<div class="top"><h1>Revision calendar</h1><span class="sp"></span><button class="btn ${calMonth==='2026-11'?'pri':''}" data-m="2026-11">Nov</button><button class="btn ${calMonth==='2026-12'?'pri':''}" data-m="2026-12">Dec</button></div>
  <div class="g mb" style="grid-template-columns:minmax(0,2.2fr) minmax(0,1fr)">
   <div class="card"><div class="cal">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div class="h">${x}</div>`).join('')}${cells}</div>
   <div class="small mut" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:10px"><span>📝 exam (dark cell) · striped = evening off · <b style="color:var(--acc)">framed = selected day · violet “Today” = today</b></span></div></div>
   <div class="card" id="daypanel" style="border-top:4px solid var(--acc)">${sel?`<div class="small mut">Selected day</div><h2>${fmt(sel.day)}${sel.day===T?' <span class="pill">Today</span>':''}</h2>${sel.exams.map(e=>`<p><span class="pill bad">EXAM</span> ${e.name} · ${e.time}</p>`).join('')}${classesOn(sel.day).filter(x=>!x.cancel).length?`<p class="small mut">Classes: ${classesOn(sel.day).filter(x=>!x.cancel).map(x=>x.start+' '+(x.s?EX[x.s].name:x.name)).join(' · ')}</p>`:''}${sel.off?'<p class="mut">Evening off.</p>':sel.blocs.map(b=>taskHTML(b)).join('')}<button class="btn sm" id="tgoff" style="margin-top:10px">${sel.off?'Restore this evening':'Mark evening off'}</button>`:'<h2>Pick a day</h2><p class="mut">Click a day to see its blocks, tick them, or mark the evening off. The whole plan rebalances automatically.</p>'}</div>
  </div>`;
  app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{calMonth=b.dataset.m;render();});
  app.querySelectorAll('[data-day]').forEach(c=>c.onclick=()=>{if(c.classList.contains('out'))return;calSel=c.dataset.day;render();if(window.innerWidth<=860){const pn=document.getElementById('daypanel');if(pn)pn.scrollIntoView({behavior:'smooth'});}});
  const tg=document.getElementById('tgoff'); if(tg) tg.onclick=()=>{if(off[calSel])delete off[calSel];else off[calSel]=1;store('off',off);PLAN=buildPlan();render();};
  bindTasks(app);
}

/* ================= PROGRESS ================= */
function viewProgress(){
  const all=prog(); const days=PLAN.map(p=>p.day); let cp=0,cd=0; const planned=[],achieved=[];
  for(const p of PLAN){cp+=p.blocs.length;cd+=p.blocs.filter(b=>done[b.key]).length;planned.push(cp);achieved.push(p.day<=T?cd:null);}
  const exp=PLAN.filter(p=>p.day<=T).reduce((a,p)=>a+p.blocs.length,0); const ahead=cd-exp;
  const fcP=s=>{const c=(contentFor(s).cards||[]).length;const k=Object.values(fcm[s]||{}).filter(v=>v===1).length;return c?Math.round(k/c*100):0;};
  const qP=s=>{const c=(CONTENT[s].qcm||[]).length;const k=Object.values(qm[s]||{}).filter(v=>v===1).length;return c?Math.round(k/c*100):0;};
  const ids=EXAMS.filter(e=>e.id!=='GT').map(e=>e.id);
  // heatmap
  const cnt={};Object.entries(done).forEach(([k,v])=>{if(v){const d=doneAt[k]||k.split('|')[0];cnt[d]=(cnt[d]||0)+1;}});
  let heat='';for(let d='2026-11-02';d<='2026-12-17';d=addD(d,1)){const n=cnt[d]||0;heat+=`<i title="${fmt(d)}: ${n} blocks" style="background:${n?`color-mix(in srgb,var(--ok) ${Math.min(100,25+n*15)}%,var(--line))`:'var(--line)'};${d===T?'outline:2px solid var(--acc)':''}"></i>`;}
  app.innerHTML=`<div class="top"><h1>Progress</h1></div>
  <div class="g g4 mb">
   <div class="card kpi"><div class="v">${all.d}/${all.n}</div><div class="l">blocks done</div></div>
   <div class="card kpi"><div class="v" style="color:var(--${ahead>=0?'ok':'warn'})">${ahead>=0?'+':''}${ahead}</div><div class="l">blocks ${ahead>=0?'ahead of':'behind'} schedule</div></div>
   <div class="card kpi"><div class="v">${Math.round(ids.reduce((a,s)=>a+fcP(s),0)/ids.length)}%</div><div class="l">flashcards mastered</div></div>
   <div class="card kpi"><div class="v">${Math.round(ids.reduce((a,s)=>a+qP(s),0)/ids.length)}%</div><div class="l">MCQs answered right</div></div>
  </div>
  ${squadCard()}
  <div class="card mb"><h2>🏅 Badges <span class="small mut">${Object.keys(badges).length}/${BADGES.length} unlocked</span></h2><div class="badges">${BADGES.map(([id,ic,n,d])=>`<div class="bdg ${badges[id]?'on':''}" title="${d}"><div class="bi">${ic}</div><div class="bn">${n}</div><div class="bd">${d}</div></div>`).join('')}</div></div>
  <div class="card mb"><h2>Planned vs done (cumulative blocks)</h2><div style="height:260px"><canvas id="c1"></canvas></div></div>
  <div class="g g2 mb"><div class="card"><h2>Plan completion by subject</h2><div style="height:300px"><canvas id="c2"></canvas></div></div>
  <div class="card"><h2>Mastery by subject</h2><div style="height:300px"><canvas id="c3"></canvas></div></div></div>
  <div class="card"><h2>Study heatmap</h2><div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start"><div><div class="heat">${['M','T','W','T','F','S','S'].map(x=>`<span class="small mut" style="text-align:center">${x}</span>`).join('')}${heat}</div></div><p class="small mut" style="max-width:340px">Each square is a day from 2 Nov to 17 Dec; the greener, the more blocks you completed that day.</p></div></div>`;
  squadBind();
  if(!window.Chart) return;
  const css=getComputedStyle(document.documentElement), ink=css.getPropertyValue('--mut').trim(), line=css.getPropertyValue('--line').trim();
  Chart.defaults.color=ink;Chart.defaults.font.family='Inter';Chart.defaults.borderColor=line;
  charts.push(new Chart(document.getElementById('c1'),{type:'line',data:{labels:days.map(d=>fmt(d)),datasets:[{label:'Planned',data:planned,borderColor:'#a5a3c0',borderDash:[5,5],pointRadius:0,tension:.2},{label:'Done',data:achieved,borderColor:'#7c5cff',backgroundColor:'rgba(91,91,246,.15)',fill:true,pointRadius:0,tension:.2}]},options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{x:{ticks:{maxTicksLimit:10}}}}}));
  charts.push(new Chart(document.getElementById('c2'),{type:'bar',data:{labels:EXAMS.map(e=>e.id),datasets:[{label:'% of planned blocks done',data:EXAMS.map(e=>prog(e.id).p),backgroundColor:EXAMS.map(e=>COL[e.id]),borderRadius:6}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{max:100,beginAtZero:true}}}}));
  charts.push(new Chart(document.getElementById('c3'),{type:'bar',data:{labels:ids,datasets:[{label:'Flashcards mastered %',data:ids.map(fcP),backgroundColor:'#7c5cff',borderRadius:6},{label:'MCQs right %',data:ids.map(qP),backgroundColor:'#b6a5ff',borderRadius:6},{label:'Best MCQ score %',data:ids.map(s=>(qstats[s]||{}).best||0),backgroundColor:'#1c1a26',borderRadius:6}]},options:{maintainAspectRatio:false,scales:{y:{max:100,beginAtZero:true}}}}));
}

/* ================= GRADES ================= */
function gradeRows(s,editW){const comps=GRADING[s],w=getW(s),g=grades[s]||{};
  return comps.map((c,i)=>`<div class="grow"><div style="flex:1">${c.n}${c.uc?' <span class="pill warn" title="Weight not found in the course documents: check your syllabus">to confirm</span>':''}</div>
  ${editW?`<input type="number" min="0" max="100" step="1" value="${w[i]}" data-w="${s}|${i}" title="weight %"> %`:`<span class="small mut">${w[i]}%</span>`}
  ${c.fin?'<span class="pill" style="width:96px;text-align:center">final</span>':`<input type="number" min="0" max="20" step="0.25" placeholder="/20" value="${g[i]??''}" data-g="${s}|${i}">`}</div>`).join('');}
function bindGrades(root,after){root.querySelectorAll('[data-g]').forEach(inp=>inp.oninput=()=>{const [s,i]=inp.dataset.g.split('|');grades[s]=grades[s]||{};grades[s][i]=inp.value===''?'':Math.max(0,Math.min(20,+inp.value));store('grades',grades);after&&after(s);});
 root.querySelectorAll('[data-w]').forEach(inp=>inp.oninput=()=>{const [s,i]=inp.dataset.w.split('|');weights[s]=weights[s]||GRADING[s].map(c=>c.w);weights[s][i]=+inp.value||0;store('weights',weights);after&&after(s);});}
function viewGrades(){
  app.innerHTML=`<div class="top"><h1>Grades & targets</h1><span class="sp"></span><span class="small mut">Assume ungraded components at</span><input type="number" id="asm" min="0" max="20" step="0.5" value="${assume}"> <span class="small mut">/20</span></div>
  <p class="mut mb">Enter the grades you already have. For each subject, the target shows the <b>minimum grade at the final exam</b> to finish with <b>10/20</b>. Weights come from your syllabi and course slides; those marked “to confirm” were not found — edit them if needed.</p>
  <div class="g g2">${EXAMS.map(e=>`<div class="card" style="--sc:${COL[e.id]}"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0"><span class="chip">${e.id}</span> ${e.name}</h2><div style="text-align:right" id="rq-${e.id}">${reqBadge(e.id,true)}<div class="small mut">needed at the final</div></div></div><div style="margin-top:10px">${gradeRows(e.id,true)}</div><div class="small mut" id="sum-${e.id}"></div></div>`).join('')}</div>`;
  const upd=s=>{const el=document.getElementById('rq-'+s);if(el)el.innerHTML=reqBadge(s,true)+'<div class="small mut">needed at the final</div>';const w=getW(s).reduce((a,b)=>a+b,0);const sm=document.getElementById('sum-'+s);if(sm)sm.textContent=w!==100?`⚠️ Weights add up to ${w}% (should be 100%).`:'';};
  bindGrades(app,upd); EXAMS.forEach(e=>upd(e.id));
  document.getElementById('asm').oninput=ev=>{assume=+ev.target.value||0;store('assume',assume);EXAMS.forEach(e=>upd(e.id));};
}
function gradesModal(){
  const m=document.getElementById('modal'); const list=EXAMS.filter(e=>GRADING[e.id].some(c=>!c.fin));
  m.innerHTML=`<div class="modal"><div class="box"><h2>🎯 Your mid-term grades</h2><p class="mut">Enter the grades you already have (mid-terms, continuous assessment…). The site then computes, for each subject, the <b>exact minimum grade you need at the final</b> to get 10/20. Leave a field empty if you don't know it yet — you can change everything later in “Grades & targets”.</p>
  ${list.map(e=>`<div style="margin-top:14px"><b><span class="dot" style="background:${COL[e.id]};margin-right:6px"></span>${e.name}</b> <span id="mq-${e.id}" style="float:right">${reqBadge(e.id)}</span>${gradeRows(e.id,false)}</div>`).join('')}
  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px"><button class="btn" id="mskip">Later</button><button class="btn pri" id="msave">Save & see my targets</button></div></div></div>`;
  bindGrades(m,s=>{const el=document.getElementById('mq-'+s);if(el)el.innerHTML=reqBadge(s);});
  document.getElementById('mskip').onclick=()=>{store('askedGrades',1);m.innerHTML='';};
  document.getElementById('msave').onclick=()=>{store('askedGrades',1);m.innerHTML='';go('grades');};
}

/* ================= SUBJECTS GRID ================= */
function viewSubjects(){
  app.innerHTML=`<div class="top"><h1>Subjects</h1></div><div class="g g3">${EXAMS.map(e=>{const pr=prog(e.id);return `<div class="card" style="cursor:pointer;border-top:5px solid ${COL[e.id]};--sc:${COL[e.id]}" data-s="${e.id}">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b>${e.name}</b><span class="pill">${countdown(e)}</span></div>
   <div class="small mut" style="margin:2px 0 10px">${fmt(e.date)} · ${e.time}</div>
   <div class="bar"><i style="width:${pr.p}%"></i></div>
   <div style="display:flex;justify-content:space-between;margin-top:8px" class="small"><span class="mut">${pr.p}% of plan done</span>${reqBadge(e.id)}</div></div>`}).join('')}</div>`;
  bindNav(app);
}

/* ================= EXAMS ================= */
function viewExams(){
  app.innerHTML=`<div class="top"><h1>Exam timetable</h1></div><div class="card">${EXAMS.map(e=>`<div class="grow" style="cursor:pointer;padding:12px 0" data-s="${e.id}"><span class="dot" style="background:${COL[e.id]}"></span><div style="flex:1"><b>${e.name}</b><div class="small mut">${fmt(e.date)} · ${e.time}</div></div><div style="text-align:right">${reqBadge(e.id)}<div class="small mut">${countdown(e)}</div></div></div>`).join('')}<p class="small mut">Exam dates are the same for the whole S3 class. Check your room on Aurion the day before.</p></div>`;
  bindNav(app);
}

/* ================= SUBJECT ================= */
const STABS=[['overview','Overview'],['notes','Notes'],['flash','Flashcards'],['mcq','MCQ'],['exos','Exercises'],['exam','Exam mode'],['res','Resources']];
function viewSubject(){
  const e=EX[subj], chs=CH[subj], c=contentFor(subj), pr=prog(subj), q=required(subj);
  const fcN=(c.cards||[]).length, fcK=Object.values(fcm[subj]||{}).filter(v=>v===1).length, qN=(CONTENT[subj].qcm||[]).length, qK=Object.values(qm[subj]||{}).filter(v=>v===1).length;
  let h=`<div class="shero mb" style="--sc:${COL[subj]}"><div class="small" style="opacity:.85">${fmt(e.date)} · ${e.time} · ${countdown(e)}</div><h1>${e.name}</h1>
   <div class="row"><div class="stat"><div class="v">${pr.p}%</div><div class="l">plan done (${pr.d}/${pr.n})</div></div>
   <div class="stat"><div class="v">${fcN?Math.round(fcK/fcN*100)+'%':'—'}</div><div class="l">flashcards mastered</div></div>
   <div class="stat"><div class="v">${qN?Math.round(qK/qN*100)+'%':'—'}</div><div class="l">MCQs right</div></div>
   <div class="stat"><div class="v">${q?(q.r<=0?'✓':q.r>20?'>20':q.r.toFixed(1)):'—'}</div><div class="l">needed at the final /20</div></div></div></div>
  <div class="tabs">${STABS.map(([k,l])=>`<button class="${stab===k?'on':''}" data-t="${k}">${l}</button>`).join('')}</div>`;
  if(stab==='overview'){
    const nextB=subjBlocks(subj).find(b=>!done[b.key]&&b.key.split('|')[0]>=T);
    h+=`<div class="g g2 mb" style="grid-template-columns:1.3fr 1fr"><div class="card"><h2>Exam format</h2><div class="note">${c.format||'—'}</div>
     ${nextB?`<h3>Next block</h3>${taskHTML(nextB,true)}`:''}</div>
     <div class="card"><h2>Your target</h2>${q?`<div style="display:flex;align-items:center;gap:14px">${reqBadge(subj,true)}<span class="small mut">minimum at the final to get 10/20${q.assumed?` (ungraded parts assumed at ${assume}/20)`:''}</span></div>`:''}<div style="margin-top:8px">${gradeRows(subj,false)}</div><a href="#" id="tog">Edit weights →</a></div></div>
    <div class="card"><h2>Chapters</h2>${chs.map((x,i)=>{const bl=subjBlocks(subj).filter(b=>b.chi===i);const d=bl.filter(b=>done[b.key]).length;const has=c.fiches&&c.fiches[i];return `<div class="grow"><span class="small mut" style="width:22px">${i+1}</span><div style="flex:1;cursor:pointer" data-chap="${i}"><b>${x.t}</b><div class="small mut">${has?'notes ✓ · ':''}${bl.length?`${d}/${bl.length} blocks done`:'no block planned'}</div></div><div style="width:110px;--sc:${COL[subj]}"><div class="bar"><i style="width:${bl.length?Math.round(d/bl.length*100):0}%"></i></div></div></div>`}).join('')}</div>`;
  }
  if(stab==='notes'){
    h+=`<div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><select id="chsel">${chs.map((x,i)=>`<option value="${i}" ${i===curCh?'selected':''}>${x.t}</option>`).join('')}</select><span class="sp"></span><button class="btn sm" id="pv" ${curCh===0?'disabled':''}>← Prev</button><button class="btn sm" id="nx" ${curCh===chs.length-1?'disabled':''}>Next →</button></div>`;
    const f=c.fiches&&c.fiches[curCh]; h+=f?`<div style="margin-top:14px" data-notr>${f}</div><div style="text-align:right;margin-top:8px"><a href="#" class="replink" data-rep="n|${subj}|${curCh}">⚑ Report an error</a></div>`:`<p class="mut" style="margin-top:14px">No notes for this chapter yet — use the professor's material below.</p>`;
    const res=chs[curCh].res; if(res.length) h+=`<h3>Professor's material</h3><ul>${res.map(r=>`<li><a href="${r[1]}" target="_blank" rel="noopener">${r[0]}</a></li>`).join('')}</ul>`;
    h+=`</div>`;
  }
  if(stab==='flash') h+=c.cards?`<div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px"><span class="small mut" id="fn"></span><span class="sp" style="flex:1"></span><label class="small"><input type="checkbox" id="onlyU"> only cards I don't know yet</label><button class="btn sm" id="fs">Shuffle</button><button class="btn sm" id="fmy">✏️ My cards (${(myCards[subj]||[]).length})</button><button class="btn sm" id="fexp">✍️ Explain-it mode</button></div><div class="flash" id="fc"></div><div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap"><button class="btn" id="fp">←</button><button class="btn" id="fno" style="border-color:var(--bad)">✗ Didn't know</button><button class="btn" id="fyes" style="border-color:var(--ok)">✓ Knew it</button><button class="btn" id="fx">→</button></div><p class="small mut" style="text-align:center">Click the card to flip it. <a href="#" class="replink" id="frep" data-rep="">⚑ Report an error</a></p></div>`:`<div class="card"><p class="mut">No flashcards for this subject yet.</p><button class="btn pri" id="fmy">✏️ Create my own cards</button></div>`;
  if(stab==='mcq') h+=CONTENT[subj].qcm?`<div class="card" id="qz"></div>`:'<div class="card mut">No MCQ for this subject yet.</div>';
  if(stab==='exos') h+=exosTab(c);
  if(stab==='exam') h+=examTab();
  if(stab==='res'){ h+=`<div class="card"><p class="small mut">Official exercises, solutions, past exams and MCQs from your professors on MyCourses (log in to open them).</p>${chs.filter(x=>x.res.length).map(x=>`<h3>${x.t}</h3><ul>${x.res.map(r=>`<li><a href="${r[1]}" target="_blank" rel="noopener">${r[0]}</a></li>`).join('')}</ul>`).join('')||'<p class="mut">No resources.</p>'}</div>`;}
  app.innerHTML=h;
  app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{stab=b.dataset.t;render();});
  app.querySelectorAll('[data-chap]').forEach(b=>b.onclick=()=>{curCh=+b.dataset.chap;stab='notes';render();});
  const tog=document.getElementById('tog'); if(tog) tog.onclick=ev=>{ev.preventDefault();go('grades');};
  bindGrades(app,()=>{}); app.querySelectorAll('[data-g]').forEach(i=>i.addEventListener('change',()=>render()));
  const sel=document.getElementById('chsel'); if(sel){sel.onchange=()=>{curCh=+sel.value;render();};document.getElementById('pv').onclick=()=>{curCh--;render();};document.getElementById('nx').onclick=()=>{curCh++;render();};}
  app.querySelectorAll('[data-sol]').forEach(b=>b.onclick=()=>{const d=document.getElementById('sol'+b.dataset.sol);const o=d.style.display==='none';d.style.display=o?'block':'none';b.textContent=o?'Hide solution':'Show solution';});
  app.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>guideExo(subj,+b.dataset.guide));
  {const mk=document.getElementById('mock');if(mk)mk.onclick=()=>startMock(subj);const cr=document.getElementById('cram');if(cr)cr.onclick=()=>{view='cram';render();window.scrollTo(0,0);};const ex=document.getElementById('fexp');if(ex)ex.onclick=()=>cardRun((c.cards||[]).map((_,i)=>({s:subj,i})).sort(()=>Math.random()-.5).slice(0,15),{title:EX[subj].name,write:true});}
  {const fm=document.getElementById('fmy');if(fm)fm.onclick=()=>myCardsModal(subj);}
  if(stab==='flash'&&c.cards) flashBind(c.cards);
  if(stab==='mcq'&&CONTENT[subj].qcm) quizBind(CONTENT[subj].qcm);
  bindTasks(app);
}
function flashBind(cards){
  const s=subj; fcm[s]=fcm[s]||{}; let only=false, order=cards.map((_,i)=>i), i=0, back=false;
  const el=document.getElementById('fc'), n=document.getElementById('fn');
  const list=()=>only?order.filter(k=>fcm[s][k]!==1):order;
  const show=()=>{const L=list(); if(!L.length){el.textContent='🎉 You know all the cards!';n.textContent='';return;} if(i>=L.length)i=0; const k=L[i], cd=cards[k];
    el.textContent=back?cd[1]:cd[0]; el.style.fontWeight=back?'400':'700'; {const fr=document.getElementById('frep');if(fr)fr.dataset.rep='c|'+s+'|'+k;} const known=Object.values(fcm[s]).filter(v=>v===1).length;
    n.textContent=`${i+1} / ${L.length}${back?' · back':''} · mastered ${known}/${cards.length}${fcm[s][k]===1?' · ✓ known':fcm[s][k]===0?' · ✗ to review':''}${k>=baseCards(s).length?' · ✏️ your card':''}`;};
  el.onclick=()=>{back=!back;show();};
  const mark=v=>{const L=list();if(!L.length)return;fcm[s][L[i]]=v;store('fcm',fcm);srsMark(s,L[i],v);if(v===1)addXP(5,'· card known',`fc|${s}|${L[i]}`);back=false;if(!(only&&v===1))i++;show();};
  document.getElementById('fyes').onclick=()=>mark(1); document.getElementById('fno').onclick=()=>mark(0);
  document.getElementById('fx').onclick=()=>{i++;back=false;show();}; document.getElementById('fp').onclick=()=>{const L=list();i=(i-1+L.length)%L.length;back=false;show();};
  document.getElementById('fs').onclick=()=>{order.sort(()=>Math.random()-.5);i=0;back=false;show();};
  document.getElementById('onlyU').onchange=ev=>{only=ev.target.checked;i=0;back=false;show();};
  show();
}
function quizBind(qs){
  const s=subj, box=document.getElementById('qz'); qm[s]=qm[s]||{};
  let order=qs.map((_,i)=>i).sort(()=>Math.random()-.5), i=0, score=0, answered=false, wrong=[];
  const st=qstats[s]||{best:null};
  const start=mode=>{order=(mode==='wrong'?qs.map((_,k)=>k).filter(k=>qm[s][k]===0):qs.map((_,k)=>k)).sort(()=>Math.random()-.5);i=0;score=0;wrong=[];showQ();};
  const showQ=()=>{
    if(!order.length){box.innerHTML='<p>🎉 No missed question left.</p><button class="btn pri" id="ra">Redo all</button>';document.getElementById('ra').onclick=()=>start('all');return;}
    if(i>=order.length){const pct=Math.round(score/order.length*100);st.best=Math.max(st.best||0,pct);qstats[s]=st;store('qstats',qstats);if(pct===100&&order.length>=10){addXP(100,'· perfect quiz!');confetti(200);}else confetti(60);checkBadges();
      box.innerHTML=`<h2>Score: ${score}/${order.length} (${pct}%)</h2><p class="mut">Best score: ${st.best}%</p>${wrong.length?`<button class="btn pri" id="rw">Redo the ${wrong.length} missed</button> `:''}<button class="btn" id="ra">Redo all</button>`;
      const rw=document.getElementById('rw'); if(rw) rw.onclick=()=>{order=wrong.slice();wrong=[];i=0;score=0;showQ();}; document.getElementById('ra').onclick=()=>start('all'); return;}
    const k=order[i], q=qs[k]; answered=false; const missedN=Object.values(qm[s]).filter(v=>v===0).length;
    const src=q[3]==='C'?'Question by Claude, built from your slides':q[3]==='S'?'Question from the slides':(q[3]==='P?'?'Professor\'s Practice MCQs · uncertain answer, check in class':'Professor\'s Practice MCQs · answer proposed by Claude');
    box.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="small mut">Question ${i+1}/${order.length} · score ${score}</span>${missedN?`<button class="btn sm" id="mw">Practise my ${missedN} missed questions</button>`:''}</div>
     <div class="bar" style="margin:8px 0 4px"><i style="width:${Math.round(i/order.length*100)}%"></i></div>
     <h3 style="font-size:17px">${q[0]}</h3>${q[1].map((o,j)=>`<button class="opt" data-j="${j}">${o}</button>`).join('')}<div class="small mut" style="margin-top:8px">${src}</div><div id="qn"></div>`;
    const mw=document.getElementById('mw'); if(mw) mw.onclick=()=>start('wrong');
    box.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ if(answered)return; answered=true; const j=+b.dataset.j, ok=j===q[2];
      box.querySelectorAll('.opt')[q[2]].classList.add('good'); if(ok){score++;addXP(10,'');} else{b.classList.add('bad');wrong.push(k);} qm[s][k]=ok?1:0; store('qm',qm);
      const exFr=((window.EXPL||{})[s]||[])[k], enS=(window.EN||{})[s], exEn=enS&&enS.expl?enS.expl[k]:null;
      const main=LANG==='fr'?exFr:(exEn||exFr), second=LANG==='fr'?exEn:(exEn?exFr:null);
      const okL=s==='LV'?'✅ ¡Correcto!':'✅ Correct.', badL=s==='LV'?'❌ Respuesta correcta: ':'❌ Correct answer: ';
      document.getElementById('qn').innerHTML=`<div class="explain ${ok?'okx':'badx'}"><b>${ok?okL:badL+q[1][q[2]]+'.'}</b>${main?' '+main:''}${second?`<div class="small mut" style="margin-top:6px">${LANG==='fr'?'🇬🇧':'🇫🇷'} ${second}</div>`:''}</div><div class="qfoot"><button class="btn pri" id="nxq">Next →</button><a href="#" class="replink" data-rep="q|${s}|${k}">⚑ Report an error</a></div>`;
      document.getElementById('nxq').onclick=()=>{i++;showQ();};});
  };
  showQ();
}

/* ================= GAMIFICATION ================= */
let xp=store('xp')||0, badges=store('badges')||{}, chal=store('chal')||{}, xpSeen=store('xpSeen')||{};
const LVL=250, TITLES=['Rookie','Apprentice','Learner','Scholar','Expert','Master','Grand Master','Legend'];
const lvl=()=>Math.floor(xp/LVL)+1, title=()=>TITLES[Math.min(TITLES.length-1,Math.floor((lvl()-1)/2))];
function xpWidget(){const l=lvl(),p=Math.round((xp%LVL)/LVL*100);return `<div class="xpw"><div class="lv">${l}</div><div style="flex:1;min-width:0"><div class="xt">${title()} · <b>${xp} XP</b></div><div class="xb"><i style="width:${p}%"></i></div><div class="xs">${LVL-xp%LVL} XP to level ${l+1}</div></div></div>`;}
function toast(msg,col){document.querySelectorAll('.toast').forEach(x=>x.remove());const t=document.createElement('div');t.className='toast';t.innerHTML=msg;if(col)t.style.background=col;document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('in'));setTimeout(()=>{t.classList.remove('in');setTimeout(()=>t.remove(),400)},2200);}
function addXP(n,label,once){ if(once){if(xpSeen[once])return;xpSeen[once]=1;store('xpSeen',xpSeen);}
  const before=lvl(); xp=Math.max(0,xp+n); store('xp',xp); if(n>0){xpDay[T]=(xpDay[T]||0)+n;store('xpDay',xpDay);}
  if(n>0) toast(`<b>+${n} XP</b> ${label||''}`);
  const w=document.querySelector('aside .xpw'); if(w) w.outerHTML=xpWidget();
  if(lvl()>before){confetti(160);setTimeout(()=>toast(`🏆 <b>Level ${lvl()}</b> · ${title()}`,''),400);}
  checkBadges(); }
const BADGES=[
 ['first','👣','First step','Complete your first block',()=>Object.values(done).filter(Boolean).length>=1],
 ['five','✋','High five','Complete 5 blocks',()=>Object.values(done).filter(Boolean).length>=5],
 ['fire','🔥','On fire','3-day streak',()=>streak()>=3],
 ['unstop','⚡','Unstoppable','7-day streak',()=>streak()>=7],
 ['marathon','🏃','Marathon','5 blocks in one day',()=>{const c={};Object.entries(done).forEach(([k,v])=>{if(v){const d=doneAt[k]||k.split('|')[0];c[d]=(c[d]||0)+1}});return Object.values(c).some(n=>n>=5);}],
 ['q50','🧠','Quiz whiz','50 MCQs answered right',()=>Object.values(qm).reduce((a,o)=>a+Object.values(o).filter(v=>v===1).length,0)>=50],
 ['q150','🎓','Brainiac','150 MCQs answered right',()=>Object.values(qm).reduce((a,o)=>a+Object.values(o).filter(v=>v===1).length,0)>=150],
 ['c50','🃏','Card shark','50 flashcards mastered',()=>Object.values(fcm).reduce((a,o)=>a+Object.values(o).filter(v=>v===1).length,0)>=50],
 ['perfect','💯','Perfectionist','Score 100% on a full MCQ',()=>Object.values(qstats).some(x=>x.best===100)],
 ['chal','⚔️','Challenger','Finish a daily challenge',()=>Object.keys(chal).length>=1],
 ['chal5','👑','Champion','Finish 5 daily challenges',()=>Object.keys(chal).length>=5],
 ['master','🌟','Subject master','All flashcards + 80% MCQs in one subject',()=>EXAMS.some(e=>{const c=(contentFor(e.id).cards||[]).length,q=(CONTENT[e.id].qcm||[]).length;if(!c||!q)return false;const fk=Object.values(fcm[e.id]||{}).filter(v=>v===1).length,qk=Object.values(qm[e.id]||{}).filter(v=>v===1).length;return fk>=c&&qk/q>=.8;})],
 ['lvl5','🚀','Rocket','Reach level 5',()=>lvl()>=5],
];
function checkBadges(){BADGES.forEach(([id,ic,n])=>{const b=BADGES.find(x=>x[0]===id);if(!badges[id]&&b[4]()){badges[id]=T;store('badges',badges);setTimeout(()=>{toast(`${ic} Badge unlocked: <b>${n}</b>`,'');confetti(90);},700);}});}
function confetti(n){const c=document.createElement('canvas');c.className='confetti';c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);const x=c.getContext('2d');
  const cols=['#7c5cff','#a48bff','#5b3ee8','#d4c9ff','#ffffff'];const ps=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,s:Math.random()*7+4,c:cols[Math.floor(Math.random()*cols.length)],r:Math.random()*6,vr:(Math.random()-.5)*.3}));
  let f=0;(function tick(){x.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore();});if(++f<130)requestAnimationFrame(tick);else c.remove();})();}

/* ================= QUIZ ENGINE (sessions & challenge) ================= */
function pickQ(s,n){const qs=CONTENT[s].qcm||[];const m=qm[s]||{};const idx=qs.map((_,i)=>i);const pri=i=>m[i]===0?0:m[i]===undefined?1:2;return idx.sort((a,b)=>pri(a)-pri(b)||Math.random()-.5).slice(0,n).map(k=>({s,k}));}
function runQuiz(box,items,opts){
  let i=0,score=0,combo=0,best=0,tm=null,left=0;
  const next=()=>{clearInterval(tm); if(i>=items.length){opts.onEnd&&opts.onEnd(score,items.length,best);return;}
    const {s,k}=items[i],q=CONTENT[s].qcm[k];let ans=false;
    box.innerHTML=`<div class="qhead"><span class="chip" style="--sc:${COL[s]}">${s}</span><span class="small mut">Question ${i+1}/${items.length}</span><span class="sp"></span>${combo>=2?`<span class="combo">🔥 x${combo}</span>`:''}${opts.timer?`<span class="qt" id="qt"></span>`:''}<span class="pill">Score ${score}</span></div>
     <div class="bar" style="margin:10px 0;--sc:${COL[s]}"><i style="width:${Math.round(i/items.length*100)}%"></i></div>
     <h3 style="font-size:18px;margin:14px 0">${q[0]}</h3>${q[1].map((o,j)=>`<button class="opt" data-j="${j}"><span class="ol">${'ABCD'[j]}</span>${o}</button>`).join('')}<div id="qx"></div>`;
    const answer=j=>{if(ans)return;ans=true;clearInterval(tm);const ok=j===q[2];const bs=box.querySelectorAll('.opt');bs[q[2]].classList.add('good');if(j>=0&&!ok)bs[j].classList.add('bad');
      qm[s]=qm[s]||{};qm[s][k]=ok?1:0;store('qm',qm);
      if(ok){score++;combo++;best=Math.max(best,combo);addXP(10+(combo>=3?5:0),combo>=3?`· combo x${combo}`:'');}else combo=0;
      const exFr=((window.EXPL||{})[s]||[])[k],enS=(window.EN||{})[s],exEn=enS&&enS.expl?enS.expl[k]:null,main=LANG==='fr'?exFr:(exEn||exFr),sec=LANG==='fr'?exEn:(exEn?exFr:null);
      box.querySelector('#qx').innerHTML=`<div class="explain ${ok?'okx':'badx'}"><b>${ok?'✅ Correct!':j<0?'⏰ Time\'s up! Answer: '+q[1][q[2]]+'.':'❌ Answer: '+q[1][q[2]]+'.'}</b> ${main||''}${sec?`<div class="small mut" style="margin-top:6px">${LANG==='fr'?'🇬🇧':'🇫🇷'} ${sec}</div>`:''}</div><div class="qfoot"><button class="btn pri" id="qn2">Next →</button><a href="#" class="replink" data-rep="q|${s}|${k}">⚑ Report an error</a></div>`;
      box.querySelector('#qn2').onclick=()=>{i++;next();};};
    box.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.j));
    if(opts.timer){left=opts.timer;const el=box.querySelector('#qt');const upd=()=>{el.textContent='⏱ '+left+'s';el.classList.toggle('low',left<=5);};upd();tm=setInterval(()=>{left--;upd();if(left<=0)answer(-1);},1000);}
  };
  next();
}

/* ================= GUIDED STUDY SESSION ================= */
function startSession(key){
  const b=PLAN.flatMap(p=>p.blocs).find(x=>x.key===key); if(!b) return;
  const s=b.s,c=contentFor(s),m=document.getElementById('modal'); let step=0, gained0=xp, sec=1500, st=null;
  const steps=['📖 Notes','🃏 Flashcards','❓ Quiz','🏁 Done'];
  const cards=(c.cards||[]).map((cd,i)=>i).sort((a,z)=>((fcm[s]||{})[a]===1)-((fcm[s]||{})[z]===1)||Math.random()-.5).slice(0,6);
  const items=pickQ(s,6);
  const shell=inner=>`<div class="modal"><div class="box sess" style="--sc:${COL[s]}"><div class="shead"><div><div class="small" style="opacity:.85">${b.act}</div><b>${EX[s].name}</b><div class="small" style="opacity:.9">${b.ch}</div></div><div class="sp"></div><div class="stimer" id="stt"></div><button class="xbtn" id="sclose">✕</button></div>
    <div class="steps">${steps.map((x,i)=>`<span class="${i===step?'on':i<step?'ok':''}">${x}</span>`).join('')}</div><div class="sbody" id="sbody">${inner}</div></div></div>`;
  const tick=()=>{const el=document.getElementById('stt');if(el)el.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};
  st=setInterval(()=>{if(sec>0)sec--;tick();},1000);
  const close=()=>{clearInterval(st);m.innerHTML='';render();};
  const draw=()=>{
    if(step===0){const f=c.fiches&&c.fiches[b.chi];m.innerHTML=shell(`${f?`<div class="notes">${f}</div>`:'<p class="mut">No notes for this chapter: open the professor\'s slides from the Resources tab.</p>'}<div class="sfoot"><button class="btn pri big" id="sn">I've read it → Flashcards</button></div>`);
      document.getElementById('sn').onclick=()=>{addXP(10,'· notes read');step=1;draw();};}
    else if(step===1){let i=0,back=false;m.innerHTML=shell(`<div class="small mut" id="fci"></div><div class="flash big" id="sfc"></div><div class="sfoot"><button class="btn bad2" id="fno">✗ Didn't know</button><button class="btn ok2" id="fyes">✓ Knew it</button></div>`);
      const show=()=>{if(i>=cards.length){step=2;draw();return;}const cd=c.cards[cards[i]];const el=document.getElementById('sfc');el.textContent=back?cd[1]:cd[0];el.classList.toggle('back',back);document.getElementById('fci').textContent=`Card ${i+1}/${cards.length} · tap the card to flip it`;};
      document.getElementById('sfc').onclick=()=>{back=!back;show();};
      const mark=v=>{fcm[s]=fcm[s]||{};fcm[s][cards[i]]=v;store('fcm',fcm);srsMark(s,cards[i],v);if(v===1)addXP(5,'· card known',`fc|${s}|${cards[i]}`);i++;back=false;show();};
      document.getElementById('fyes').onclick=()=>mark(1);document.getElementById('fno').onclick=()=>mark(0);show();}
    else if(step===2){m.innerHTML=shell(`<div id="sq"></div>`);runQuiz(document.getElementById('sq'),items,{onEnd:(sc,n)=>{step=3;draw.score=sc;draw.n=n;draw();}});}
    else{const sc=draw.score||0,n=draw.n||0;if(!done[b.key]){setDone(b.key,true);addXP(50,'· block completed');}addXP(sc===n&&n?60:25,sc===n&&n?'· perfect session!':'· session bonus');confetti(200);
      m.innerHTML=shell(`<div style="text-align:center;padding:10px 0"><div style="font-size:56px">${sc===n?'🏆':sc>=n/2?'🎉':'💪'}</div><h2 style="margin:6px 0">${sc===n?'Perfect session!':sc>=n/2?'Great job!':'Keep going!'}</h2><p class="mut">Quiz: <b>${sc}/${n}</b> · XP earned this session: <b>+${xp-gained0}</b> · Level ${lvl()} ${title()}</p>
       <div class="bar" style="max-width:360px;margin:12px auto"><i style="width:${Math.round((xp%LVL)/LVL*100)}%"></i></div><p class="small mut">Block marked as done ✓</p><div class="sfoot" style="justify-content:center"><button class="btn" id="again">Redo the quiz</button><button class="btn pri big" id="fin">Back to my plan</button></div></div>`);
      document.getElementById('fin').onclick=close;document.getElementById('again').onclick=()=>{step=2;draw();};}
    tick(); const x=document.getElementById('sclose'); if(x) x.onclick=close;
  };
  draw();
}

/* ================= DAILY CHALLENGE ================= */
function startChallenge(){
  const up=EXAMS.filter(e=>e.date>=T&&CONTENT[e.id]&&CONTENT[e.id].qcm).slice(0,4);
  const items=up.flatMap(e=>pickQ(e.id,3)).sort(()=>Math.random()-.5).slice(0,10);
  const m=document.getElementById('modal');
  m.innerHTML=`<div class="modal"><div class="box sess" style="--sc:#7c5cff"><div class="shead" ><div><div class="small" style="opacity:.9">20 seconds per question · combos give bonus XP</div><b>⚔️ Daily challenge</b></div><div class="sp"></div><button class="xbtn" id="cclose">✕</button></div><div class="sbody" id="cq"></div></div></div>`;
  document.getElementById('cclose').onclick=()=>{m.innerHTML='';render();};
  runQuiz(document.getElementById('cq'),items,{timer:20,onEnd:(sc,n,best)=>{const first=!chal[T];chal[T]=Math.max(chal[T]||0,sc);store('chal',chal);if(first)addXP(100,'· daily challenge');confetti(220);
    document.getElementById('cq').innerHTML=`<div style="text-align:center;padding:10px 0"><div style="font-size:56px">${sc>=8?'👑':sc>=5?'🎉':'💪'}</div><h2>${sc}/${n} correct</h2><p class="mut">Best combo: <b>x${best}</b>${first?' · +100 XP challenge bonus':''}</p><div class="sfoot" style="justify-content:center"><button class="btn pri big" id="cdone">Done</button></div></div>`;
    document.getElementById('cdone').onclick=()=>{m.innerHTML='';render();};}});
}

/* ================= V4 · SPACED REPETITION ================= */
let srs=store('srs')||{}, mocks=store('mocks')||{}, xpDay=store('xpDay')||{};
const SRS_STEPS=[1,3,7,14,30];
function srsMark(s,i,v){srs[s]=srs[s]||{};const o=srs[s][i]||{n:-1};const n=v===1?Math.min(o.n+1,SRS_STEPS.length-1):0;srs[s][i]={n,due:addD(T,v===1?SRS_STEPS[n]:1)};store('srs',srs);}
function dueCards(sOnly){const out=[];Object.entries(srs).forEach(([s,o])=>{if(sOnly&&s!==sOnly)return;const c=contentFor(s).cards||[];Object.entries(o).forEach(([i,x])=>{if(x.due<=T&&c[i])out.push({s,i:+i});});});return out;}
function missedQs(sOnly){const out=[];Object.entries(qm).forEach(([s,o])=>{if(sOnly&&s!==sOnly)return;if(!CONTENT[s]||!CONTENT[s].qcm)return;Object.entries(o).forEach(([k,v])=>{if(v===0&&CONTENT[s].qcm[k])out.push({s,k:+k});});});return out;}
function missedCards(sOnly){const out=[];Object.entries(fcm).forEach(([s,o])=>{if(sOnly&&s!==sOnly)return;const c=contentFor(s).cards||[];Object.entries(o).forEach(([i,v])=>{if(v===0&&c[i])out.push({s,i:+i});});});return out;}
function reviewCount(){return dueCards().length+missedQs().length;}

/* ===== card runner (review + explain-it mode) ===== */
function cardRun(list,opts){
  opts=opts||{};const m=document.getElementById('modal');let i=0,back=false,write=!!opts.write,known=0;
  if(!list.length){toast('Nothing to review here 🎉');return;}
  const close=()=>{m.innerHTML='';render();};
  const draw=()=>{
    if(i>=list.length){confetti(120);m.innerHTML=`<div class="modal"><div class="box sess"><div class="shead"><div><b>${opts.title||'Review'}</b></div><div class="sp"></div><button class="xbtn" id="rc">✕</button></div><div class="sbody" style="text-align:center"><div style="font-size:52px">🧠</div><h2>${known}/${list.length} known</h2><p class="mut">Cards you missed come back tomorrow, the others later (1 → 3 → 7 → 14 days).</p><div class="sfoot" style="justify-content:center"><button class="btn pri big" id="rdone">Done</button></div></div></div></div>`;document.getElementById('rc').onclick=close;document.getElementById('rdone').onclick=close;return;}
    const {s,i:k}=list[i],cd=contentFor(s).cards[k];
    m.innerHTML=`<div class="modal"><div class="box sess"><div class="shead"><div><div class="small" style="opacity:.85">${write?'✍️ Explain-it mode · write your answer first':'Tap the card to flip it'}</div><b>${opts.title||'Review'}</b></div><div class="sp"></div><span class="stimer" style="font-size:15px">${i+1}/${list.length}</span><button class="xbtn" id="rc">✕</button></div>
     <div class="sbody"><div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><span class="chip" style="--sc:${COL[s]}">${s}</span><span class="sp" style="flex:1"></span><label class="small"><input type="checkbox" id="wm" ${write?'checked':''}> ✍️ Explain-it mode</label></div>
     <div class="flash big ${back?'back':''}" id="rcd">${back?cd[1]:cd[0]}</div><div style="text-align:right;margin-top:6px"><a href="#" class="replink" data-rep="c|${s}|${k}">⚑ Report an error</a></div>
     ${write&&!back?`<textarea id="wa" rows="4" placeholder="Write your answer in ${s==='LV'?'Spanish':'English'}, then reveal" style="width:100%;margin-top:12px;font:inherit;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink)"></textarea><div class="sfoot"><button class="btn pri big" id="rev">Reveal the answer</button></div>`:''}
     ${write&&back&&draw.mine?`<div class="note" style="margin-top:12px"><b>Your answer:</b> ${draw.mine.replace(/</g,'&lt;')}</div><p class="small mut">Compare with the card: did you get the key idea?</p>`:''}
     ${back||!write?`<div class="sfoot"><button class="btn bad2" id="no">✗ Didn't know</button><button class="btn ok2" id="yes">✓ Knew it</button></div>`:''}</div></div></div>`;
    document.getElementById('rc').onclick=close;
    document.getElementById('wm').onchange=e=>{write=e.target.checked;back=false;draw();};
    document.getElementById('rcd').onclick=()=>{if(write&&!back)return;back=!back;draw();};
    const rv=document.getElementById('rev');if(rv)rv.onclick=()=>{draw.mine=document.getElementById('wa').value.trim();back=true;draw();};
    const mark=v=>{fcm[s]=fcm[s]||{};fcm[s][k]=v;store('fcm',fcm);srsMark(s,k,v);if(v===1){known++;addXP(write?8:5,write?'· explained it':'· card known',write?null:`fc|${s}|${k}`);}i++;back=false;draw.mine='';draw();};
    const y=document.getElementById('yes');if(y){y.onclick=()=>mark(1);document.getElementById('no').onclick=()=>mark(0);}
  };
  draw();
}
function quizModal(items,title,onEnd){
  if(!items.length){toast('Nothing to review here 🎉');return;}
  const m=document.getElementById('modal');
  m.innerHTML=`<div class="modal"><div class="box sess"><div class="shead"><div><b>${title}</b></div><div class="sp"></div><button class="xbtn" id="qc">✕</button></div><div class="sbody" id="qmb"></div></div></div>`;
  document.getElementById('qc').onclick=()=>{m.innerHTML='';render();};
  runQuiz(document.getElementById('qmb'),items,{onEnd:(sc,n)=>{confetti(100);onEnd&&onEnd(sc,n);document.getElementById('qmb').innerHTML=`<div style="text-align:center"><div style="font-size:52px">${sc===n?'🏆':'💪'}</div><h2>${sc}/${n}</h2><p class="mut">Questions you got right leave your mistakes notebook.</p><div class="sfoot" style="justify-content:center"><button class="btn pri big" id="qd">Done</button></div></div>`;document.getElementById('qd').onclick=()=>{m.innerHTML='';render();};}});
}

/* ================= V4 · REVIEW HUB ================= */
let revSubj='';
function viewReview(){
  const due=dueCards(revSubj),mq=missedQs(revSubj),mc=missedCards(revSubj);
  const per=EXAMS.map(e=>({e,d:dueCards(e.id).length,q:missedQs(e.id).length})).filter(x=>x.d||x.q);
  app.innerHTML=`<div class="top"><h1>Review</h1><span class="sp"></span><select id="rsub"><option value="">All subjects</option>${EXAMS.map(e=>`<option value="${e.id}" ${revSubj===e.id?'selected':''}>${e.name}</option>`).join('')}</select></div>
  <div class="g g2 mb">
   <div class="card"><h2>🔁 Cards due today</h2><p class="small mut" style="margin-top:-6px">Spaced repetition: a card you miss comes back tomorrow, then after 3, 7 and 14 days.</p><div class="kpi"><div class="v" style="color:var(--acc)">${due.length}</div><div class="l">card${due.length>1?'s':''} to review</div></div><div class="sfoot" style="justify-content:flex-start"><button class="btn pri big" id="rdue" ${due.length?'':'disabled'}>Review now</button><button class="btn big" id="rexp" ${due.length?'':'disabled'}>✍️ Explain-it mode</button></div></div>
   <div class="card"><h2>📕 Mistakes notebook</h2><p class="small mut" style="margin-top:-6px">Every MCQ and card you missed. Get them right to clear them.</p><div style="display:flex;gap:24px"><div class="kpi"><div class="v" style="color:var(--bad)">${mq.length}</div><div class="l">missed MCQs</div></div><div class="kpi"><div class="v" style="color:var(--bad)">${mc.length}</div><div class="l">missed cards</div></div></div><div class="sfoot" style="justify-content:flex-start"><button class="btn pri big" id="rmq" ${mq.length?'':'disabled'}>Redo my mistakes</button><button class="btn big" id="rmc" ${mc.length?'':'disabled'}>Missed cards</button></div></div>
  </div>
  ${per.length?`<div class="card mb"><h2>By subject</h2>${per.map(x=>`<div class="grow"><span class="chip" style="--sc:${COL[x.e.id]}">${x.e.id}</span><div style="flex:1"><b>${x.e.name}</b><div class="small mut">${x.d} card${x.d>1?'s':''} due · ${x.q} missed MCQ${x.q>1?'s':''}</div></div><button class="btn sm" data-rs="${x.e.id}">Review</button></div>`).join('')}</div>`:''}
  ${mq.length?`<div class="card"><h2>Your missed questions</h2><div data-notr>${mq.slice(0,40).map(({s,k})=>{const q=CONTENT[s].qcm[k];return `<div class="grow" style="align-items:flex-start"><span class="chip" style="--sc:${COL[s]}">${s}</span><div style="flex:1"><div>${q[0]}</div><div class="small" style="color:var(--ok)">✓ ${q[1][q[2]]}</div></div></div>`}).join('')}${mq.length>40?`<p class="small mut">+ ${mq.length-40} more</p>`:''}</div></div>`:`<div class="card"><p class="mut" style="margin:0">No mistakes yet: answer MCQs and flashcards, the ones you miss will land here.</p></div>`}`;
  document.getElementById('rsub').onchange=e=>{revSubj=e.target.value;render();};
  const b=(id,f)=>{const el=document.getElementById(id);if(el)el.onclick=f;};
  b('rdue',()=>cardRun(dueCards(revSubj),{title:'Cards due today'}));
  b('rexp',()=>cardRun(dueCards(revSubj),{title:'Cards due today',write:true}));
  b('rmq',()=>quizModal(missedQs(revSubj).sort(()=>Math.random()-.5).slice(0,15),'Redo my mistakes'));
  b('rmc',()=>cardRun(missedCards(revSubj),{title:'Missed cards'}));
  app.querySelectorAll('[data-rs]').forEach(x=>x.onclick=()=>{revSubj=x.dataset.rs;render();});
}

/* ================= V4 · EXAM MODE (mock + J-1) ================= */
function examMinutes(s){const f=(contentFor(s).format||'').replace(/<[^>]+>/g,'');const m=f.match(/(\d)\s*h\s*(\d{2})?/);if(m)return +m[1]*60+(+(m[2]||0));const n=f.match(/(\d{2,3})\s*min/);return n?+n[1]:60;}
function examTab(){
  const s=subj,c=contentFor(s),qN=(CONTENT[s].qcm||[]).length,ex=c.exos||[],ms=mocks[s]||[],q=required(s),last=ms[ms.length-1];
  const tip=s==='LV'?'':'';
  return `<div class="g g2 mb">
   <div class="card"><h2>📝 Mock exam</h2><p class="small mut" style="margin-top:-6px">Real conditions: ${examMinutes(s)} min timer, no hints until the end, then a grade out of 20.</p>
    ${qN||ex.length?`<ul class="small"><li>${Math.min(20,qN)} MCQs from your course${ex.length?` · 1 exercise from the course, self-graded with the solution`:''}</li></ul>
    ${last?`<div class="grow"><div style="flex:1"><b>Last mock: ${last.g.toFixed(1)}/20</b><div class="small mut">${fmt(last.d)}${q?` · you need ${q.r<=0?'nothing':q.r.toFixed(1)+'/20'} at the final`:''}</div></div><span class="pill ${q&&last.g>=q.r?'ok':'bad'}">${q?(last.g>=q.r?'On track':'Below target'):''}</span></div>`:''}
    <div class="sfoot" style="justify-content:flex-start"><button class="btn pri big" id="mock">Start a mock exam</button></div>`:'<p class="mut">Not enough material for this subject yet.</p>'}</div>
   <div class="card"><h2>📄 Cram sheet (J-1)</h2><p class="small mut" style="margin-top:-6px">For the day before the exam: key points, formulas, your weak spots and the most likely questions.</p><div class="sfoot" style="justify-content:flex-start"><button class="btn pri big" id="cram">Open the cram sheet</button></div></div>
  </div>
  ${ms.length>1?`<div class="card"><h2>Your mock grades</h2>${ms.slice(-6).map(x=>`<div class="grow"><span class="small mut" style="width:90px">${fmt(x.d)}</span><div style="flex:1"><div class="bar"><i style="width:${x.g*5}%"></i></div></div><b>${x.g.toFixed(1)}</b></div>`).join('')}</div>`:''}`;
}
function startMock(s){
  const c=contentFor(s),qs=CONTENT[s].qcm||[],items=qs.map((_,k)=>k).sort(()=>Math.random()-.5).slice(0,20),exo=(c.exos||[]).length?c.exos[Math.floor(Math.random()*c.exos.length)]:null;
  let sec=examMinutes(s)*60,tm=null;const ans={};const m=document.getElementById('modal');
  const close=()=>{clearInterval(tm);m.innerHTML='';render();};
  m.innerHTML=`<div class="modal"><div class="box sess" style="max-width:820px"><div class="shead"><div><div class="small" style="opacity:.85">Mock exam · ${items.length} MCQs${exo?' + 1 exercise':''}</div><b>${EX[s].name}</b></div><div class="sp"></div><div class="stimer" id="mt"></div><button class="xbtn" id="mx">✕</button></div>
   <div class="sbody" id="mb">${items.map((k,n)=>{const q=qs[k];return `<div class="mq" style="margin-bottom:18px"><b>${n+1}. ${q[0]}</b>${q[1].map((o,j)=>`<button class="opt" data-n="${n}" data-j="${j}"><span class="ol">${'ABCD'[j]}</span>${o}</button>`).join('')}</div>`}).join('')}
   ${exo?`<div class="mq"><b>Exercise.</b> ${exo.q}<textarea id="mexo" rows="6" placeholder="Your working and answers" style="width:100%;margin-top:10px;font:inherit;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink)"></textarea></div>`:''}
   <div class="sfoot"><button class="btn pri big" id="msub">Hand in my paper</button></div></div></div></div>`;
  const upd=()=>{const el=document.getElementById('mt');if(el)el.textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');};upd();
  tm=setInterval(()=>{sec--;upd();if(sec<=0)submit();},1000);
  m.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const n=+b.dataset.n;ans[n]=+b.dataset.j;m.querySelectorAll(`.opt[data-n="${n}"]`).forEach(x=>x.classList.toggle('sel2',x===b));});
  document.getElementById('mx').onclick=()=>{if(confirmClose())close();};
  function confirmClose(){return !Object.keys(ans).length||document.getElementById('mx').dataset.sure==='1'||(document.getElementById('mx').dataset.sure='1',toast('Tap ✕ again to quit without handing in'),false);}
  const submit=()=>{clearInterval(tm);let ok=0;qm[s]=qm[s]||{};
    items.forEach((k,n)=>{const q=qs[k],good=ans[n]===q[2];if(good)ok++;if(ans[n]!==undefined)qm[s][k]=good?1:0;m.querySelectorAll(`.opt[data-n="${n}"]`).forEach((b,j)=>{b.disabled=true;if(j===q[2])b.classList.add('good');else if(j===ans[n])b.classList.add('bad');});});
    store('qm',qm);const mine=exo?document.getElementById('mexo').value:'';
    const mcqPct=items.length?ok/items.length:0;
    const body=document.getElementById('mb');const sub=document.getElementById('msub');sub.parentNode.remove();
    const fin=selfG=>{const g=Math.round((exo?(mcqPct*20+selfG*2)/2:mcqPct*20)*10)/10;mocks[s]=mocks[s]||[];mocks[s].push({d:T,g});store('mocks',mocks);addXP(80,'· mock exam');confetti(200);const q=required(s);
      body.insertAdjacentHTML('afterbegin',`<div class="note mb" style="text-align:center"><div style="font-size:44px;font-weight:800;color:var(--acc)">${g.toFixed(1)}/20</div><div>MCQs ${ok}/${items.length}${exo?` · exercise ${selfG}/10`:''}${q?` · target at the final: ${q.r<=0?'already secured':q.r.toFixed(1)+'/20'}`:''}</div><div class="small mut">Scroll down to see the corrections. Missed questions went to your mistakes notebook.</div></div>`);body.scrollTop=0;};
    if(exo){body.insertAdjacentHTML('beforeend',`<div class="card" style="margin-top:10px"><h3>Exercise solution</h3>${mine?`<div class="small mut">Your answer:</div><div class="note mb">${mine.replace(/</g,'&lt;')}</div>`:''}${exo.sol}<h3>Grade yourself</h3><div style="display:flex;gap:10px;align-items:center"><input type="range" id="sg" min="0" max="10" step="1" value="5" style="flex:1"><b id="sgv">5/10</b><button class="btn pri" id="sgo">Get my grade</button></div></div>`);
      const r=document.getElementById('sg');r.oninput=()=>document.getElementById('sgv').textContent=r.value+'/10';document.getElementById('sgo').onclick=e=>{e.target.parentNode.parentNode.remove();fin(+r.value);};
      document.getElementById('sgo').scrollIntoView({behavior:'smooth',block:'center'});}
    else fin(0);
    document.getElementById('mx').onclick=close;
  };
  document.getElementById('msub').onclick=submit;
}
function viewCram(){
  const s=subj,e=EX[s],c=contentFor(s),chs=CH[s];const div=document.createElement('div');
  const keys=[],formulas=[];
  chs.forEach((x,i)=>{const f=c.fiches&&c.fiches[i];if(!f)return;div.innerHTML=f;const lis=[...div.querySelectorAll('li')].filter(li=>!li.querySelector('li'));const pts=[];
    lis.forEach(li=>{const t=li.textContent.trim();if(/[=×÷]/.test(t)&&/\d|[A-Z]{2}/.test(t)&&t.length<260)formulas.push({ch:x.t,h:li.innerHTML});else if(li.querySelector('b')&&pts.length<4)pts.push(li.innerHTML.length>260?li.innerHTML.slice(0,li.innerHTML.lastIndexOf(' ',250))+'…':li.innerHTML);});
    if(pts.length)keys.push({t:x.t,pts});});
  const mq=missedQs(s),mc=missedCards(s);
  app.innerHTML=`<div class="shero mb"><div class="small" style="opacity:.85">Cram sheet · ${fmt(e.date)} · ${e.time} · ${countdown(e)}</div><h1>${e.name}</h1><div class="row"><button class="cta" id="c20" style="margin-top:4px">▶ 20 most likely questions</button><button class="cta" id="cback" style="margin-top:4px;background:rgba(255,255,255,.12);box-shadow:none">← Back to the subject</button></div></div>
  <div class="card mb"><h2>Exam format</h2><div class="note">${c.format||'—'}</div></div>
  ${formulas.length?`<div class="card mb"><h2>Formulas and calculations</h2><ul data-notr>${formulas.slice(0,18).map(f=>`<li>${f.h}</li>`).join('')}</ul></div>`:''}
  ${mq.length||mc.length?`<div class="card mb"><h2>Your weak spots</h2><div data-notr>${mq.slice(0,12).map(({k})=>{const q=CONTENT[s].qcm[k];return `<div class="grow" style="align-items:flex-start"><div style="flex:1"><div>${q[0]}</div><div class="small" style="color:var(--ok)">✓ ${q[1][q[2]]}</div></div></div>`}).join('')}${mc.slice(0,8).map(({i})=>{const cd=c.cards[i];return `<div class="grow" style="align-items:flex-start"><div style="flex:1"><b>${cd[0]}</b><div class="small mut">${cd[1]}</div></div></div>`}).join('')}</div></div>`:''}
  <div class="card"><h2>Key points by chapter</h2><div data-notr>${keys.map(k=>`<h3>${k.t}</h3><ul>${k.pts.map(p=>`<li>${p}</li>`).join('')}</ul>`).join('')||'<p class="mut">Open the notes tab for this subject.</p>'}</div></div>`;
  document.getElementById('c20').onclick=()=>quizModal(pickQ(s,20),'20 most likely questions · '+e.id);
  document.getElementById('cback').onclick=()=>{view='subject';stab='exam';render();window.scrollTo(0,0);};
}

/* ================= V4 · GUIDED EXERCISES ================= */
function numsIn(t){return (t.replace(/(\d),(\d{3})/g,'$1$2').match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);}
function exosTab(c){
  if(!(c.exos&&c.exos.length))return '<div class="card mut">No exercises yet.</div>';
  return `<div class="card">${c.exos.map((x,i)=>`<div class="task" style="display:block"><div data-notr>${i+1}. ${x.q}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn pri sm" data-guide="${i}">✏️ Solve step by step</button><button class="btn sm" data-sol="${i}">Show solution</button></div><div data-notr id="sol${i}" style="display:none;margin-top:8px;padding:11px 13px;border-radius:12px;background:var(--okbg)">${x.sol}</div></div>`).join('')}</div>`;
}
function guideExo(s,i){
  const x=contentFor(s).exos[i],d=document.createElement('div');d.innerHTML=x.sol;const top=d.querySelector('ol,ul');
  const steps=top?[...top.children].filter(n=>n.tagName==='LI').map(li=>({h:li.innerHTML,n:[...li.querySelectorAll('b')].flatMap(b=>numsIn(b.textContent))})):[{h:x.sol,n:[]}];
  let k=0,good=0;const m=document.getElementById('modal');const close=()=>{m.innerHTML='';render();};
  const draw=(fb)=>{
    const st=steps[k];
    m.innerHTML=`<div class="modal"><div class="box sess" style="max-width:820px"><div class="shead"><div><div class="small" style="opacity:.85">Guided exercise · step ${Math.min(k+1,steps.length)}/${steps.length}</div><b>${EX[s].name}</b></div><div class="sp"></div><button class="xbtn" id="gx">✕</button></div><div class="sbody">
     <div class="note mb">${x.q}</div>
     ${steps.slice(0,k).map((p,j)=>`<div class="explain okx" style="margin-top:6px"><b>Step ${j+1}.</b> ${p.h}</div>`).join('')}
     ${k<steps.length?`<div class="card" style="margin-top:12px;border-color:var(--acc)"><b>Step ${k+1}</b>${st.n.length?`<p class="small mut" style="margin:4px 0 8px">Type your result for this step (just the number).</p><div style="display:flex;gap:8px"><input id="ga" type="text" inputmode="decimal" placeholder="e.g. 286" style="flex:1;font:inherit;padding:9px 11px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)"><button class="btn pri" id="gc">Check</button></div>${fb||''}`:`<p class="small mut" style="margin:4px 0 0">This step is about reasoning: think it through, then reveal it.</p>`}<div class="sfoot" style="justify-content:flex-start"><button class="btn sm" id="gr">${st.n.length?'Show this step':'Reveal the step'}</button></div></div>`
     :`<div style="text-align:center;margin-top:16px"><div style="font-size:48px">${good===steps.filter(p=>p.n.length).length?'🏆':'💪'}</div><h2>Exercise done</h2><p class="mut">${good} step${good>1?'s':''} found on your own.</p><div class="sfoot" style="justify-content:center"><button class="btn pri big" id="gd">Done</button></div></div>`}
    </div></div></div>`;
    document.getElementById('gx').onclick=close;const gd=document.getElementById('gd');if(gd){confetti(100);gd.onclick=close;return;}
    const next=()=>{k++;draw();};document.getElementById('gr').onclick=next;
    const gc=document.getElementById('gc');if(gc){const inp=document.getElementById('ga');inp.focus();inp.onkeydown=e=>{if(e.key==='Enter')gc.click();};
      gc.onclick=()=>{const raw=inp.value.trim();if(!raw){draw('<div class="small" style="color:var(--bad);margin-top:6px">Enter a number first.</div>');return;}
        const v=numsIn(raw.replace(/\s/g,'').replace(/(\d),(\d{1,2})$/,'$1.$2'))[0];const hit=v!=null&&st.n.some(t=>{const tol=Math.max(Math.abs(t)*0.01,0.5);return Math.abs(v-t)<=tol||Math.abs(v*100-t)<=tol||Math.abs(v/100-t)<=Math.max(Math.abs(t)*0.01,0.005);});
        if(hit){good++;addXP(15,'· step solved');toast('✅ Right!');next();}else draw('<div class="explain badx" style="margin-top:8px">❌ Not quite. Check your working and try again, or show the step.</div>');};}
  };
  draw();
}

/* ================= SYNC + LEADERBOARD (Supabase) ================= */
const SYNC_KEYS=['myCards','profile','done','doneAt','off','qstats','fcm','qm','grades','weights','assume','lang','xp','badges','chal','xpSeen','wkOpen','srs','mocks','xpDay','askedGrades','squadOn','ics'];
const SB=window.SB, _me=window.ME_ID, SPX=window.__SP;
let _pushT=null,syncState='synced',_pushing=false,_again=false;
const _store0=store;
store=function(k,v){const r=_store0(k,v);if(v!==undefined&&SYNC_KEYS.includes(k)){try{localStorage.setItem(SPX+'_at',String(Date.now()))}catch(e){}schedulePush();}return r;};
function snapshot(){const o={};SYNC_KEYS.forEach(k=>{const v=_store0(k);if(v!=null)o[k]=v;});return o;}
function reloadState(){window.__P=undefined;myCards=_store0('myCards')||{};done=_store0('done')||{};doneAt=_store0('doneAt')||{};off=_store0('off')||{};qstats=_store0('qstats')||{};fcm=_store0('fcm')||{};qm=_store0('qm')||{};grades=_store0('grades')||{};weights=_store0('weights')||{};const a=_store0('assume');assume=a==null?12:a;LANG=_store0('lang')||'course';xp=_store0('xp')||0;badges=_store0('badges')||{};chal=_store0('chal')||{};xpSeen=_store0('xpSeen')||{};wkOpen=_store0('wkOpen')||null;srs=_store0('srs')||{};mocks=_store0('mocks')||{};xpDay=_store0('xpDay')||{};PLAN=buildPlan();}
function schedulePush(){clearTimeout(_pushT);_pushT=setTimeout(pushNow,1500);}
async function pushNow(){if(!SB)return;if(_pushing){_again=true;return;}_pushing=true;
  try{const at=+(localStorage.getItem(SPX+'_at')||Date.now());const {error}=await SB.from('user_state').upsert({user_id:_me,data:snapshot(),updated_at:at});if(error)throw error;syncState='synced';await pushBoard();}
  catch(e){syncState='error';}
  _pushing=false;paintSync();if(_again){_again=false;schedulePush();}}
window.addEventListener('pagehide',()=>{if(_pushT){clearTimeout(_pushT);pushNow();}});
function weekXP(){let n=0;for(let i=0;i<7;i++)n+=xpDay[addD(T,-i)]||0;return n;}
function squadOn(){return _store0('squadOn')!==false;}
let _lastBoard='';
async function pushBoard(){if(!SB||!prof()||!prof().start)return;
  if(!squadOn()){await SB.from('leaderboard').delete().eq('user_id',_me);_lastBoard='';return;}
  const row={user_id:_me,pseudo:pseudo(prof()).slice(0,40),week_xp:Math.min(weekXP(),100000),xp:Math.min(xp,1000000),lvl:lvl(),streak:streak(),blocks:Object.values(done).filter(Boolean).length};
  const sig=JSON.stringify(row);if(sig===_lastBoard)return;
  const {error}=await SB.from('leaderboard').upsert(Object.assign({updated_at:new Date().toISOString()},row));if(!error)_lastBoard=sig;}
function paintSync(){document.querySelectorAll('.syncdot').forEach(el=>{el.className='syncdot '+syncState;el.title=syncState==='synced'?'Progress saved to your account':'Not saved yet: check your connection';});}
let boardRows=null;
function squadCard(){return `<div class="card mb" id="squad"><h2>👥 S3 leaderboard <span class="sp" style="flex:1"></span><label class="small" style="font-weight:400"><input type="checkbox" id="sqon" ${squadOn()?'checked':''}> show me</label></h2><div id="sqb"><p class="small mut">Loading…</p></div><p class="small mut" style="margin:10px 0 0">Ranked by XP earned over the last 7 days. Only nicknames are shown (first name + initial).</p></div>`;}
async function squadBind(){
  const sq=document.getElementById('sqon');if(sq)sq.onchange=async e=>{store('squadOn',e.target.checked);await pushBoard();boardRows=null;squadBind();};
  const box=document.getElementById('sqb');if(!box)return;
  const paint=rows=>{const b=document.getElementById('sqb');if(!b)return;const wk=Date.now()-7*864e5;
    rows=rows.map(r=>Object.assign({},r,{wk:new Date(r.updated_at).getTime()>=wk?r.week_xp:0})).sort((a,z)=>z.wk-a.wk||z.xp-a.xp);
    if(!rows.length){b.innerHTML='<p class="small mut">Nobody yet: be the first!</p>';return;}
    const meI=rows.findIndex(r=>r.user_id===_me);const top=rows.slice(0,15);
    const line=(r,i)=>`<div class="grow ${r.user_id===_me?'meRow':''}"><b style="width:28px;color:var(--acc)">${['🥇','🥈','🥉'][i]||i+1}</b><div style="flex:1;min-width:0"><b class="nm"></b>${r.user_id===_me?' <span class="pill">you</span>':''}<div class="small mut">Level ${r.lvl||1} · 🔥 ${r.streak||0} · ${r.blocks||0} blocks</div></div><b>${r.wk} XP</b></div>`;
    b.innerHTML=top.map(line).join('')+(meI>=15?`<div class="small mut" style="text-align:center;margin:4px 0">···</div>`+line(rows[meI],meI):'')+`<p class="small mut" style="margin:8px 0 0">${rows.length} student${rows.length>1?'s':''} on Grind</p>`;
    const shown=top.concat(meI>=15?[rows[meI]]:[]);b.querySelectorAll('.nm').forEach((el,i)=>{el.textContent=shown[i].pseudo;});};
  if(boardRows){paint(boardRows);return;}
  if(!SB){box.innerHTML='<p class="small mut">Leaderboard unavailable.</p>';return;}
  await pushBoard();
  const {data,error}=await SB.from('leaderboard').select('user_id,pseudo,week_xp,xp,lvl,streak,blocks,updated_at').order('week_xp',{ascending:false}).limit(300);
  if(error){box.innerHTML='<p class="small mut">Leaderboard unavailable right now.</p>';return;}
  boardRows=data||[];paint(boardRows);setTimeout(()=>{boardRows=null;},60000);
}

/* ================= OUTLOOK TIMETABLE (optional) + CLASS SUMMARIES ================= */
const SUBJ_RX=[[/DIGITAL INNOVATION/i,'DI'],[/ADVANCED FINANCIAL ACCOUNTING/i,'AFA'],[/MARKET STRUCTURES/i,'MS'],[/ECONOMETRICS/i,'ECO'],[/SALES TECHNIQUES/i,'ST'],[/MARKETING MANAGEMENT/i,'MM'],[/COST ACCOUNTING/i,'COST'],[/OPERATIONS MANAGEMENT/i,'OM'],[/TRADEMARK LAW/i,'TL']];
const ICS_RX=/^https:\/\/outlook\.office(365)?\.com\/owa\/calendar\/[^\/\s]+\/[^\/\s]+\/(calendar|reachcalendar)\.ics$/i;
let ICS=null,icsState='none',SUMS=null;
function parseICS(txt){
  const ev=txt.replace(/\r?\n[ \t]/g,'').split('BEGIN:VEVENT').slice(1);const out=[];
  const pick=(e,k)=>{const m=e.match(new RegExp('(?:^|\\n)'+k+'[^:\\n]*:(.*)'));return m?m[1].trim():'';};
  ev.forEach(e=>{const st=pick(e,'DTSTART');if(!/^\d{8}/.test(st))return;const day=st.slice(0,4)+'-'+st.slice(4,6)+'-'+st.slice(6,8);
    let s=pick(e,'SUMMARY').replace(/\\([;,\\])/g,'$1').replace(/\\n/gi,' ');const cancel=/^cancel+ed\s*-/i.test(s)||/STATUS:CANCELLED/i.test(e);s=s.replace(/^cancel+ed\s*-\s*/i,'');
    const parts=s.split(';').map(x=>x.trim());const tm=(parts[0].match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)||[]);
    const name=(parts[2]||parts[0]||'').replace(/\s+\d{3,5}$/,'').trim();let code=null;for(const [rx,c] of SUBJ_RX)if(rx.test(s)){code=c;break;}
    const t=st.length>=13?st.slice(9,11)+':'+st.slice(11,13):'';
    out.push({day,start:tm[1]||t,end:tm[2]||'',room:(parts[1]||'').replace(/^Room\s*/i,''),name:name||'Class',prof:parts[3]||'',s:code,cancel});});
  const byS={};out.filter(x=>x.s&&!x.cancel).sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:(a.start<b.start?-1:1)).forEach(x=>{byS[x.s]=byS[x.s]||[];if(!byS[x.s].includes(x.day))byS[x.s].push(x.day);x.session=byS[x.s].indexOf(x.day)+1;});
  return out;
}
async function loadICS(force){
  const url=store('ics');if(!url){ICS=null;icsState='none';return;}
  const ck=SPX+'icsc';if(!force){try{const c=JSON.parse(sessionStorage.getItem(ck)||'null');if(c&&c.d===T&&c.u===url){ICS=c.e;icsState='ok';return;}}catch(e){}}
  icsState='loading';
  try{const {data,error}=await SB.functions.invoke('ics',{body:{url}});if(error||!data||!data.ics)throw error||new Error('empty');
    ICS=parseICS(data.ics);icsState='ok';try{sessionStorage.setItem(ck,JSON.stringify({d:T,u:url,e:ICS}));}catch(e){}}
  catch(e){icsState='error';ICS=null;}
}
async function loadSums(){if(SUMS||!SB)return;const {data}=await SB.from('summaries').select('subj,session,title,html,ch');SUMS={};(data||[]).forEach(r=>{SUMS[r.subj+'|'+r.session]=r;});}
const classesOn=day=>(ICS||[]).filter(x=>x.day===day).sort((a,b)=>a.start<b.start?-1:1);
const nowHM=()=>{const n=new Date();return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');};

/* auto class summaries from the course notes (session → chapter) */
const SESSION_CH={DI:n=>n<=9?n-1:null,ST:n=>n<=7?n-1:null,MM:n=>n<=7?n-1:null,COST:n=>n<=6?n-1:null,TL:n=>n<=6?n-1:(n===8?6:null),OM:n=>[0,1,2,3,3,4,5,6,6][n-1]??null,AFA:n=>n<=9?n-1:null};
function autoSummary(s,n){const f=SESSION_CH[s];if(!f)return null;const ch=f(n);if(ch==null)return null;const c=contentFor(s),fi=c.fiches&&c.fiches[ch],t=(CH[s][ch]||{}).t;if(!fi)return null;
  const d=document.createElement('div');d.innerHTML=fi;const lis=[...d.querySelectorAll('li')].filter(li=>!li.querySelector('li')&&li.querySelector('b'));
  const pts=(lis.length?lis:[...d.querySelectorAll('li')]).slice(0,7).map(li=>{const h=li.innerHTML;return h.length>320?h.slice(0,h.lastIndexOf(' ',300))+'…':h;});
  if(!pts.length)return null;return {title:t,ch,html:`<ul>${pts.map(p=>`<li>${p}</li>`).join('')}</ul><p class="small mut" style="margin:6px 0">${(window.t||(s=>s))("Key points of this session's chapter, from your course notes.")}</p>`};}

function classesCard(){
  if(!store('ics'))return `<div class="card"><h2>🏫 Your classes</h2><p class="mut" style="margin-top:-4px">Connect your Outlook timetable to see your classes of the day and get <b>a summary of each class as soon as it ends</b>.</p><button class="btn pri" data-ics="1">Connect my timetable</button><p class="small mut" style="margin:10px 0 0">Optional · takes 2 minutes · you can remove it anytime.</p></div>`;
  if(icsState==='loading'||icsState==='none')return `<div class="card"><h2>🏫 Today's classes</h2><p class="mut">Loading your timetable…</p></div>`;
  if(icsState==='error')return `<div class="card"><h2>🏫 Today's classes</h2><p class="mut">Your Outlook timetable couldn't be loaded. Check that the link is still published.</p><button class="btn sm" data-ics="1">Check my link</button> <button class="btn sm" id="icsretry">Retry</button></div>`;
  const tc=classesOn(T),now=nowHM();
  return `<div class="card"><h2>🏫 Today's classes<span class="sp" style="flex:1"></span><a href="#" class="small" data-ics="1" style="font-weight:500">Timetable ⚙</a></h2>${tc.length?tc.map(x=>{const ended=x.end&&T===todayStr()&&now>=x.end,sm=x.s?((SUMS&&SUMS[x.s+'|'+x.session])||autoSummary(x.s,x.session)):null;
    return `<div class="cls ${x.cancel?'cx':''}"><div class="clh"><span class="small mut" style="width:92px;flex:none">${x.start}${x.end?'–'+x.end:''}</span><div style="flex:1;min-width:0"><b>${x.s?EX[x.s].name:x.name}</b>${x.cancel?' <span class="pill bad">cancelled</span>':''}<div class="small mut">${[x.room,x.s&&!x.cancel?'Session '+x.session:''].filter(Boolean).join(' · ')}</div></div></div>
     ${x.s&&!x.cancel?(ended?(sm?`<details class="sumd"><summary>📝 Class summary · ${sm.title}</summary><div class="sumb" data-notr>${sm.html}${sm.ch!=null?`<a href="#" data-open="${x.s}" data-ch="${sm.ch}">${(window.t||(s=>s))('Open the full notes →')}</a>`:''}</div></details>`:`<div class="small mut sumw">📝 No summary for this session: <a href="#" data-libopen="${x.s}">open the ${x.s} notes →</a></div>`):`<div class="small mut sumw">📝 Summary available when the class ends${x.end?' ('+x.end+')':''}.</div>`):''}</div>`;}).join(''):'<p class="mut">No classes today.</p>'}</div>`;
}
function bindClasses(root){
  root.querySelectorAll('[data-ics]').forEach(b=>b.onclick=e=>{e.preventDefault();icsModal();});
  const r=document.getElementById('icsretry');if(r)r.onclick=async()=>{await loadICS(true);render();};
  root.querySelectorAll('[data-open]').forEach(a=>a.onclick=e=>{e.preventDefault();subj=a.dataset.open;view='subject';stab='notes';curCh=+a.dataset.ch||0;render();window.scrollTo(0,0);});
  root.querySelectorAll('[data-libopen]').forEach(a=>a.onclick=e=>{e.preventDefault();libS=a.dataset.libopen;go('library');});
}
function icsModal(){
  const m=document.getElementById('modal'),cur=store('ics')||'';
  m.innerHTML=`<div class="modal"><div class="box" style="max-width:600px"><h2>🗓 Connect your Outlook timetable</h2><p class="mut" style="margin-top:-4px">Your IÉSEG timetable is in your school Outlook calendar. Publish it once, paste the link here, and Grind shows your classes and a summary of each class right after it ends.</p>
   <ol class="steps2">
    <li>Open <a href="https://outlook.office.com/calendar/options/calendar/SharedCalendars" target="_blank" rel="noopener">Outlook calendar settings</a> and sign in with your <b>@ieseg.fr</b> account.<div class="small mut">Or: Outlook → ⚙ Settings → Calendar → Shared calendars.</div></li>
    <li>Under <b>Publish a calendar</b>, choose <b>Calendar</b> (the one with your classes).</li>
    <li>In the permissions list, choose <b>Can view titles and locations</b>, then click <b>Publish</b>.</li>
    <li>Two links appear: click the <b>ICS</b> link and choose <b>Copy link</b>.</li>
    <li>Paste it below. It looks like <span class="small" style="word-break:break-all">https://outlook.office365.com/owa/calendar/…/calendar.ics</span></li>
   </ol>
   <input id="icsu" placeholder="https://outlook.office365.com/owa/calendar/…/calendar.ics" value="${cur.replace(/"/g,'&quot;')}" style="width:100%;font:inherit;padding:11px 13px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)">
   <div id="icse" class="oerr"></div>
   <p class="small mut">🔒 Only you can see this link in Grind. In Outlook, “titles and locations” shares no details of your personal events. To stop sharing, click <b>Unpublish</b> on the same Outlook page.</p>
   <div style="display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;margin-top:8px">${cur?'<button class="btn" id="icsdel" style="color:var(--bad);border-color:var(--bad)">Remove my timetable</button>':'<span></span>'}<div style="display:flex;gap:10px"><button class="btn" id="icsc">Cancel</button><button class="btn pri" id="icss">Connect</button></div></div></div></div>`;
  const err=t=>{document.getElementById('icse').textContent=t;};
  document.getElementById('icsu').oninput=()=>err('');
  document.getElementById('icsc').onclick=()=>m.innerHTML='';
  const del=document.getElementById('icsdel');if(del)del.onclick=()=>{store('ics',null);localStorage.removeItem(SPX+'ics');ICS=null;icsState='none';schedulePush();m.innerHTML='';render();toast('Timetable removed');};
  document.getElementById('icss').onclick=async()=>{const u=document.getElementById('icsu').value.trim();
    if(!u){err('Paste your ICS link first.');return;}
    if(!ICS_RX.test(u)){err(/\.html$/i.test(u)?'This is the HTML link: copy the ICS link instead (it ends with .ics).':'This doesn\'t look like an Outlook ICS link. It must start with https://outlook.office365.com/owa/calendar/ and end with .ics');return;}
    const b=document.getElementById('icss');b.disabled=true;b.textContent='Checking…';
    store('ics',u);await loadICS(true);
    if(icsState!=='ok'){b.disabled=false;b.textContent='Connect';err('Grind couldn\'t read this calendar. Check that it is published and that you copied the ICS link.');return;}
    const n=ICS.filter(x=>x.s).length;if(!n){b.disabled=false;b.textContent='Connect';store('ics',null);err('This calendar has no IÉSEG S3 classes. Make sure you published “Calendar”, the one with your classes.');ICS=null;icsState='none';return;}
    await loadSums();m.innerHTML='';render();confetti(120);toast(`🗓 Timetable connected · ${n} classes found`);};
}

/* ================= V5 · PROFILE, ONBOARDING, STUDY-TIME TEST ================= */
const PREP_END='2026-12-01', EXAM_START='2026-12-02';
function pseudo(P){if(!P)return '';const f=P.first.trim().split(/\s+/)[0],l=P.last.trim()[0]||'';return (f.charAt(0).toUpperCase()+f.slice(1).toLowerCase())+(l?'.'+l.toUpperCase():'');}
function prof(){if(window.__P===undefined)window.__P=store('profile')||null;return window.__P;}
function setProf(p){window.__P=p;store('profile',p);}
function blocsFor(day){
  const P=prof();const dow=s2d(day).getUTCDay();const examDay=EXAMS.some(e=>e.date===day);
  if(!P){ if(day===START)return 2; if(day>='2026-12-02')return examDay?3:(dow===0?6:5); if(dow===6)return 2; if(dow===0)return 5; return 3; }
  if(day<P.start)return 0;
  if(day>='2026-12-02')return examDay?3:(dow===0?6:5);
  const m=dow===6?P.sat:dow===0?P.sun:P.wk;return Math.floor(m/25);
}
const TOTAL_NEED=()=>EXAMS.reduce((a,e)=>a+e.need,0);
function capacity(p){let wkDays=0,fixed=0;for(let d=p.start;d<=END;d=addD(d,1)){if(d<todayStr())continue;const dow=s2d(d).getUTCDay(),ex=EXAMS.some(e=>e.date===d);
  if(d>=EXAM_START)fixed+=ex?3:(dow===0?6:5);else if(dow===6)fixed+=Math.floor(p.sat/25);else if(dow===0)fixed+=Math.floor(p.sun/25);else wkDays++;}
  const need=TOTAL_NEED(),rest=need-fixed,minBlocks=rest<=0?1:(wkDays?Math.ceil(rest/wkDays):Infinity);return {need,fixed,wkDays,minWk:minBlocks*25,total:fixed+wkDays*Math.floor(p.wk/25)};}
const hm=m=>m>=60?`${Math.floor(m/60)}h${m%60?String(m%60).padStart(2,'0'):''}`:`${m} min`;

function onboarding(mode){ /* mode: 'new' | 'edit' */
  const old=prof();let st=(mode==='edit'||(old&&old.first&&old.last&&!old.start))?2:1;
  const today=todayStr();const t0=today<START?START:today;
  const ov_=(k,d)=>old&&old[k]!=null?old[k]:d;let f={first:ov_('first',''),last:ov_('last',''),start:old&&old.start&&old.start>=t0?old.start:t0,wk:ov_('wk',75),sat:ov_('sat',50),sun:ov_('sun',100)};
  let ov=document.getElementById('onb');if(!ov){ov=document.createElement('div');ov.id='onb';document.body.appendChild(ov);}
  const close=()=>{ov.remove();document.body.style.overflow='';};
  document.body.style.overflow='hidden';
  const nextMon=(()=>{let d=t0;do{d=addD(d,1);}while(s2d(d).getUTCDay()!==1);return d;})();
  const chips=[[t0,'Today'],[nextMon,'Next Monday'],['2026-11-16','16 Nov'],['2026-11-23','23 Nov']].filter(([d])=>d>=t0&&d<=PREP_END).filter((x,i,a)=>a.findIndex(y=>y[0]===x[0])===i);
  const draw=()=>{
    if(st===1){ov.innerHTML=`<div class="onb"><div class="onbbox"><div class="onbstep">Step 1 of 2</div><div style="margin:6px 0 2px"><svg class="logo" width="52" height="52" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#7c5cff"/><path d="M21.6 10.2A8 8 0 1 0 24 16h-7" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.5 3.8l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff"/></svg></div><h1>Welcome to Grind<span style="color:var(--acc)">.</span></h1><p class="mut">Your revision space for the IÉSEG Bachelor S3 finals (3–17 Dec 2026): a daily plan, notes, flashcards, MCQs, mock exams and your progress.</p>
      <label class="fl">First name<input id="of" autocomplete="given-name" value="${f.first.replace(/"/g,'&quot;')}" placeholder="Léa"></label>
      <label class="fl">Last name<input id="ol" autocomplete="family-name" value="${f.last.replace(/"/g,'&quot;')}" placeholder="Martin"></label>
      <div id="oe" class="oerr"></div>
      ${mode==='new'&&Object.keys(done).length?`<p class="small mut">Progress already saved on this device will be reset to zero for this new profile.</p>`:''}
      <div class="onbfoot"><button class="btn pri big" id="on1">Continue →</button></div></div></div>`;
      const go1=()=>{f.first=document.getElementById('of').value.trim();f.last=document.getElementById('ol').value.trim();if(!f.first||!f.last){document.getElementById('oe').textContent='Enter your first and last name.';return;}st=2;draw();};
      document.getElementById('on1').onclick=go1;['of','ol'].forEach(id=>{const i=document.getElementById(id);i.oninput=()=>document.getElementById('oe').textContent='';i.onkeydown=e=>{if(e.key==='Enter')go1();};});
      setTimeout(()=>document.getElementById('of').focus(),50);return;}
    const c=capacity(f),ok=f.wk>=c.minWk&&c.minWk!==Infinity&&c.minWk<=300;
    ov.innerHTML=`<div class="onb"><div class="onbbox wide">${mode==='new'?'<div class="onbstep">Step 2 of 2</div>':''}<h1>${mode==='new'?`Nice to meet you, ${f.first.replace(/</g,'')} 👋`:'Your study time'}</h1><p class="mut">A quick test to size your plan. Everything is counted in 25-minute focus sessions.</p>
     <div class="q"><div class="ql">1. When do you want to start revising for your finals?</div><div class="chips">${chips.map(([d,l])=>`<button class="chipb ${f.start===d?'on':''}" data-d="${d}">${l}</button>`).join('')}<input type="date" id="osd" min="${t0}" max="${PREP_END}" value="${f.start}"></div></div>
     <div class="q"><div class="ql">2. How long can you study on a weekday evening (Mon–Fri)? <b id="vwk">${hm(f.wk)}</b></div><input type="range" id="owk" min="0" max="300" step="25" value="${f.wk}"></div>
     <div class="g g2" style="gap:14px"><div class="q"><div class="ql">3. On Saturdays? <b id="vsat">${hm(f.sat)}</b></div><input type="range" id="osat" min="0" max="300" step="25" value="${f.sat}"></div>
     <div class="q"><div class="ql">4. On Sundays? <b id="vsun">${hm(f.sun)}</b></div><input type="range" id="osun" min="0" max="300" step="25" value="${f.sun}"></div></div>
     <div class="minbox ${ok?'ok':'bad'}">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><div><div class="small mut">Your minimum on weekdays</div><div class="minv">${c.minWk===Infinity||c.minWk>300?'Not reachable':hm(c.minWk)}</div></div>
      <div style="text-align:right"><div class="small mut">Planned until 17 Dec</div><div style="font-weight:800;font-size:20px">${Math.min(c.total,999)} / ${c.need} sessions</div></div></div>
      <div class="bar" style="margin:10px 0 8px"><i style="width:${Math.min(100,Math.round(c.total/c.need*100))}%"></i></div>
      <div class="small">${c.minWk===Infinity||c.minWk>300?`Starting on ${fmt(f.start)} leaves too little time, even at 5 h a day. <b>Start earlier.</b>`:ok?`✓ Your plan covers all ${EXAMS.length} exams (${c.need} sessions ≈ ${Math.round(c.need*25/60)} h). Exam period (2–17 Dec) is planned automatically.`:`Below the minimum: to cover all ${EXAMS.length} exams starting ${fmt(f.start)}, you need at least <b>${hm(c.minWk)}</b> on weekday evenings with these weekends. Study more, or start earlier to lower it.`}</div>
      ${!ok&&c.minWk<=300?`<button class="btn sm" id="omin" style="margin-top:10px">Use the minimum (${hm(c.minWk)})</button>`:''}
     </div>
     <div class="onbfoot">${mode==='new'?'<button class="btn" id="oback">← Back</button>':'<button class="btn" id="ocancel">Cancel</button>'}<button class="btn pri big" id="ogo" ${ok?'':'disabled'}>${mode==='new'?'Build my plan 🚀':'Save my plan'}</button></div></div></div>`;
    const upd=k=>e=>{f[k]=+e.target.value;draw();setTimeout(()=>{const el=document.getElementById('o'+k);if(el)el.focus();},0);};
    document.getElementById('owk').onchange=upd('wk');document.getElementById('osat').onchange=upd('sat');document.getElementById('osun').onchange=upd('sun');
    ['wk','sat','sun'].forEach(k=>document.getElementById('o'+k).oninput=e=>{document.getElementById('v'+k).textContent=hm(+e.target.value);});
    ov.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{f.start=b.dataset.d;draw();});
    document.getElementById('osd').onchange=e=>{const v=e.target.value;if(v>=t0&&v<=PREP_END){f.start=v;draw();}};
    const mn=document.getElementById('omin');if(mn)mn.onclick=()=>{f.wk=c.minWk;draw();};
    const bk=document.getElementById('oback');if(bk)bk.onclick=()=>{st=1;draw();};
    const cc=document.getElementById('ocancel');if(cc)cc.onclick=close;
    document.getElementById('ogo').onclick=()=>{if(!ok)return;
      if(mode==='new'){wipeAll();}
      setProf({first:f.first,last:f.last,start:f.start,wk:f.wk,sat:f.sat,sun:f.sun,at:Date.now()});
      PLAN=buildPlan();close();render();
      if(mode==='new'){confetti(180);toast(`🚀 Plan ready · ${PLAN.reduce((a,p)=>a+p.blocs.length,0)} sessions`);if(!store('askedGrades'))setTimeout(gradesModal,600);pushBoard();}
      else toast('✓ Plan updated');};
  };
  draw();
}
function wipeAll(){SYNC_KEYS.concat(['profile','qstats','squadOn']).forEach(k=>{if(k==='ics'||k==='myCards'||k==='lang')return;try{localStorage.removeItem(SPX+k)}catch(e){}});window.__P=null;reloadState();try{localStorage.setItem(SPX+'_at',String(Date.now()))}catch(e){}schedulePush();}
function profileModal(){
  const P=prof();if(!P){onboarding('new');return;}const m=document.getElementById('modal');
  m.innerHTML=`<div class="modal"><div class="box" style="max-width:460px"><div style="display:flex;align-items:center;gap:12px"><div class="xpw" style="background:var(--acc2);flex:1"><div class="lv">${(P.first[0]||'?').toUpperCase()}${(P.last[0]||'').toUpperCase()}</div><div><b>${P.first.replace(/</g,'')} ${P.last.replace(/</g,'')}</b><div class="small mut">${(window.ME_EMAIL||'').replace(/</g,'')}</div><div class="small mut">Revision from ${fmt(P.start)} · weekdays ${hm(P.wk)} · Sat ${hm(P.sat)} · Sun ${hm(P.sun)}</div></div></div></div>
   <div style="display:grid;gap:10px;margin-top:16px"><button class="btn big" id="pedit">⏱ Change my study time</button><button class="btn big" id="pics">🗓 Outlook timetable${store('ics')?' · connected':''}</button><button class="btn big" id="pname">✏️ Change my name</button><button class="btn big" id="ppw">🔑 Change my password</button><button class="btn big" id="pout">↪ Log out</button><button class="btn big" id="preset" style="border-color:var(--bad);color:var(--bad)">↺ Start over from zero</button></div>
   <div style="text-align:right;margin-top:14px"><button class="btn" id="pclose">Close</button></div></div></div>`;
  document.getElementById('pclose').onclick=()=>m.innerHTML='';
  document.getElementById('pedit').onclick=()=>{m.innerHTML='';onboarding('edit');};
  document.getElementById('pics').onclick=()=>icsModal();
  document.getElementById('pout').onclick=async()=>{clearTimeout(_pushT);await pushNow();await SB.auth.signOut();location.reload();};
  document.getElementById('ppw').onclick=()=>{const b=m.querySelector('.box');b.innerHTML=`<h2>New password</h2><label class="fl">New password<input id="np1" type="password" autocomplete="new-password"></label><label class="fl">Confirm<input id="np2" type="password" autocomplete="new-password"></label><div id="npe" class="oerr"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="btn" id="npc">Cancel</button><button class="btn pri" id="nps">Save</button></div>`;
    document.getElementById('npc').onclick=()=>m.innerHTML='';document.getElementById('nps').onclick=async()=>{const p1=document.getElementById('np1').value,p2=document.getElementById('np2').value,er=document.getElementById('npe');
      if(p1.length<8){er.textContent='At least 8 characters.';return;}if(p1!==p2){er.textContent='The two passwords don\'t match.';return;}
      const {error}=await SB.auth.updateUser({password:p1});if(error){er.textContent=error.message;return;}m.innerHTML='';toast('🔑 Password updated');};};
  document.getElementById('pname').onclick=()=>{const b=m.querySelector('.box');b.innerHTML=`<h2>Your name</h2><label class="fl">First name<input id="nf" value="${P.first.replace(/"/g,'&quot;')}"></label><label class="fl">Last name<input id="nl" value="${P.last.replace(/"/g,'&quot;')}"></label><div id="ne" class="oerr"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button class="btn" id="nc">Cancel</button><button class="btn pri" id="ns">Save</button></div>`;
    document.getElementById('nc').onclick=()=>m.innerHTML='';document.getElementById('ns').onclick=()=>{const a=document.getElementById('nf').value.trim(),z=document.getElementById('nl').value.trim();if(!a||!z){document.getElementById('ne').textContent='Enter your first and last name.';return;}setProf(Object.assign({},P,{first:a,last:z}));m.innerHTML='';render();pushBoard();};};
  document.getElementById('preset').onclick=e=>{const b=e.target;if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='Tap again to erase all your progress';b.style.background='var(--badbg)';return;}m.innerHTML='';onboarding('new');};
}



/* ================= REPORT AN ERROR ================= */
function repItem(ref){const [t,s,k]=ref.split('|');const n=+k;
  try{if(t==='q'){const q=CONTENT[s].qcm[n];return 'MCQ: '+q[0]+' | Options: '+q[1].map((o,j)=>'ABCD'[j]+') '+o).join(' ')+' | Marked answer: '+'ABCD'[q[2]];}
    if(t==='c'){const cd=contentFor(s).cards[n];return 'Card: '+cd[0]+' → '+cd[1];}
    if(t==='n'){return 'Notes: '+((CH[s]||[])[n]||{}).t;}}catch(e){}return ref;}
function reportModal(ref){
  const m=document.getElementById('modal'),prev=m.innerHTML,isPriv=ref==='privacy';const [t,s]=ref.split('|');
  const kinds=isPriv?[['privacy','Question about my data']]:[['wrong','Wrong answer'],['typo','Typo'],['unclear','Unclear'],['other','Other']];
  const wrap=document.createElement('div');wrap.className='modal';wrap.style.zIndex=90;
  wrap.innerHTML=`<div class="box" style="max-width:520px"><h2>${isPriv?'✉️ Contact about my data':'⚑ Report an error'}</h2>${isPriv?'<p class="mut" style="margin-top:-4px">Your message goes to the creator of Grind with your account email, so he can answer you.</p>':`<p class="mut" style="margin-top:-4px">Thanks! The creator of Grind will check it and fix the content for everyone.</p><div class="small note" data-notr style="max-height:110px;overflow:auto"></div>`}
   <div class="chips" style="margin:12px 0">${kinds.map((x,i)=>`<button class="chipb ${i===0?'on':''}" data-kind="${x[0]}">${x[1]}</button>`).join('')}</div>
   <textarea id="repc" rows="4" maxlength="1500" placeholder="${isPriv?'Your question or request (e.g. a copy of my data)':'What is wrong? (optional)'}" style="width:100%;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)"></textarea>
   <div id="repe" class="oerr"></div><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" id="repx">Cancel</button><button class="btn pri" id="reps">Send</button></div></div>`;
  document.body.appendChild(wrap);const nt=wrap.querySelector('.note');if(nt)nt.textContent=repItem(ref);
  let kind=kinds[0][0];wrap.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;wrap.querySelectorAll('[data-kind]').forEach(x=>x.classList.toggle('on',x===b));});
  const close=()=>wrap.remove();wrap.querySelector('#repx').onclick=close;
  wrap.querySelector('#reps').onclick=async e=>{const c=wrap.querySelector('#repc').value.trim();if(isPriv&&!c){wrap.querySelector('#repe').textContent=t_('Write your message first.');return;}
    e.target.disabled=true;const {error}=await SB.from('reports').insert({user_id:_me,subj:isPriv?null:(s||null),kind,ref:ref.slice(0,60),item:isPriv?(window.ME_EMAIL||''):repItem(ref).slice(0,1500),comment:c.slice(0,1500)});
    if(error){e.target.disabled=false;wrap.querySelector('#repe').textContent=t_('Couldn\'t send it. Check your connection and try again.');return;}close();toast(t_(isPriv?'✉️ Message sent':'✓ Thanks, error reported'));};
}
const t_=s=>(window.t?window.t(s):s);
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-rep]');if(!a)return;e.preventDefault();e.stopPropagation();if(a.dataset.rep)reportModal(a.dataset.rep);},true);


/* ================= ADMIN (creator only) ================= */
let ADMIN=false,admTab='users',admSort='created_at';
async function checkAdmin(){try{const {data}=await SB.rpc('is_grind_admin');if(data===true&&!ADMIN){ADMIN=true;NAV.push(['admin','🛠','Admin']);render();}}catch(e){}}
function admKpi(s){const k=document.getElementById('admk');if(!k)return;k.innerHTML=[['👥',s.users,'accounts'],['✅',s.confirmed,'confirmed emails'],['🔥',s.active7,'active this week'],['⚑',s.open_reports,'reports to fix']].map(x=>`<div class="kpi"><div class="v">${x[0]} ${x[1]??'—'}</div><div class="l">${x[2]}</div></div>`).join('');}
async function admUsers(){
  const L=document.getElementById('adml');if(!L)return;const {data,error}=await SB.rpc('grind_accounts');
  if(error){L.innerHTML='<p class="mut">Couldn\'t load the accounts.</p>';console.error(error);return;}
  const rows=(data||[]).slice(),num=['xp','xp7','sessions','streak','lvl'];
  rows.sort((a,b)=>{const x=a[admSort],y=b[admSort];if(num.includes(admSort))return (+y||0)-(+x||0);return String(y||'').localeCompare(String(x||''));});
  const loc=UI_LANG()==='fr'?'fr-FR':'en-GB',dt=d=>d?new Date(d).toLocaleString(loc,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
  const H=[['name','Student'],['created_at','Signed up'],['last_sign_in','Last login'],['active_at','Last activity'],['xp','XP'],['xp7','XP 7 days'],['sessions','Sessions'],['streak','Streak']];
  L.innerHTML=`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><span class="small mut">${rows.length} ${t('accounts')} · ${rows.filter(r=>r.confirmed).length} ${t('confirmed emails')}</span><span class="sp" style="flex:1"></span><button class="btn sm" id="admcp">📋 Copy the emails</button></div>
  <div style="overflow-x:auto"><table class="admt"><thead><tr>${H.map(h=>`<th>${h[0]==='name'?h[1]:`<a href="#" data-srt="${h[0]}">${h[1]}${admSort===h[0]?' ▾':''}</a>`}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td><div class="adm-n" data-notr style="font-weight:600"></div><div class="small mut adm-e" data-notr></div>${r.confirmed?'':`<span class="pill">${t('email not confirmed')}</span>`}</td><td>${dt(r.created_at)}</td><td>${dt(r.last_sign_in)}</td><td>${dt(r.active_at)}</td><td>${Math.round(+r.xp||0)}</td><td>${Math.round(+r.xp7||0)}</td><td>${r.sessions||0}</td><td>${r.streak!=null?r.streak+' 🔥':'—'}</td></tr>`).join('')}</tbody></table></div>
  <p class="small mut" style="margin-top:10px">Passwords are encrypted: nobody can see them, not even you. Mid-term grades and calendars stay private.</p>`;
  L.querySelectorAll('.adm-n').forEach((el,i)=>el.textContent=((rows[i].first||'')+' '+(rows[i].last||'')).trim()||'—');L.querySelectorAll('.adm-e').forEach((el,i)=>el.textContent=rows[i].email);
  L.querySelectorAll('[data-srt]').forEach(a=>a.onclick=e=>{e.preventDefault();admSort=a.dataset.srt;admUsers();});
  document.getElementById('admcp').onclick=async()=>{try{await navigator.clipboard.writeText(rows.map(r=>r.email).join('; '));toast(t('✓ Emails copied'));}catch(e){toast(t('Couldn\'t copy.'));}};
}
async function viewAdmin(){
  if(!ADMIN){go('home');return;}
  app.innerHTML=`<div class="top"><h1>🛠 Admin</h1><span class="sp"></span><button class="btn sm" id="admr">Refresh</button></div><div id="admk" class="g g4 mb"></div><div class="card"><div class="libtabs" style="margin-bottom:8px"><button class="chipb ${admTab==='users'?'on':''}" data-at="users">Accounts</button><button class="chipb ${admTab==='open'?'on':''}" data-at="open">To fix</button><button class="chipb ${admTab==='done'?'on':''}" data-at="done">Fixed</button></div><div id="adml"><p class="mut">Loading…</p></div></div>`;
  document.getElementById('admr').onclick=()=>viewAdmin();
  app.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{admTab=b.dataset.at;viewAdmin();});
  if(admTab==='users'){const st=await SB.rpc('grind_stats');admKpi(st.data||{});return admUsers();}
  const [st,rp]=await Promise.all([SB.rpc('grind_stats'),SB.from('reports').select('id,subj,kind,ref,item,comment,status,created_at').eq('status',admTab).order('created_at',{ascending:false}).limit(200)]);
  admKpi(st.data||{});
  const L=document.getElementById('adml'),rows=rp.data||[];
  const K={wrong:'Wrong answer',typo:'Typo',unclear:'Unclear',other:'Other',privacy:'Data request'};
  L.innerHTML=rows.length?rows.map(r=>`<div class="grow" style="align-items:flex-start"><div style="flex:1;min-width:0"><div class="small"><span class="pill ${r.kind==='privacy'?'bad':''}">${K[r.kind]||r.kind}</span> ${r.subj?`<b>${r.subj}</b>`:''} <span class="mut">${new Date(r.created_at).toLocaleString(UI_LANG()==='fr'?'fr-FR':'en-GB',{dateStyle:'short',timeStyle:'short'})} · ${r.ref||''}</span></div><div class="adm-i small" data-notr style="margin-top:4px"></div><div class="adm-c" data-notr style="margin-top:4px"></div></div>${r.status==='open'?`<button class="btn sm" data-done="${r.id}">✓ Fixed</button>`:`<button class="btn sm" data-reopen="${r.id}">Reopen</button>`}</div>`).join(''):'<p class="mut">Nothing here.</p>';
  L.querySelectorAll('.adm-i').forEach((el,i)=>el.textContent=rows[i].item||'');L.querySelectorAll('.adm-c').forEach((el,i)=>{el.textContent=rows[i].comment?'💬 '+rows[i].comment:'';});
  L.querySelectorAll('[data-done],[data-reopen]').forEach(b=>b.onclick=async()=>{const id=+(b.dataset.done||b.dataset.reopen);b.disabled=true;await SB.from('reports').update({status:b.dataset.done?'done':'open'}).eq('id',id);viewAdmin();});
}

/* ================= SUBJECTS LIBRARY (read-only) ================= */
let libS=null;const libOpen={};
function viewLibrary(){
  const s=libS&&EX[libS]?libS:EXAMS[0].id;libS=s;const e=EX[s],c=contentFor(s),chs=CH[s]||[];
  app.innerHTML=`<div class="top"><h1>📚 Subjects</h1></div>
  <p class="mut" style="margin:-6px 0 14px">Read your notes and open your professors' material, chapter by chapter. Nothing here changes your plan or your progress.</p>
  <div class="libtabs">${EXAMS.map(x=>`<button class="chipb ${x.id===s?'on':''}" data-lib="${x.id}">${x.id}</button>`).join('')}</div>
  <div class="card mb"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2 style="margin:0">${e.name}</h2><div class="small mut">${fmt(e.date)} · ${e.time} · ${countdown(e)}</div></div><button class="btn sm" data-practise="${s}">Practise this subject →</button></div>
   ${c.format?`<details class="libfmt"><summary>Exam format</summary><div class="note" style="margin-top:8px">${c.format}</div></details>`:''}</div>
  ${chs.map((x,i)=>{const f=c.fiches&&c.fiches[i],k=s+'|'+i;return `<details class="libch" data-k="${k}" ${libOpen[k]?'open':''}><summary><span class="libn">${i+1}</span><span class="libt">${x.t}</span><span class="libtags">${f?'<span class="pill">Notes</span>':''}${x.res.length?`<span class="pill">📎 ${x.res.length}</span>`:''}</span></summary>
    <div class="libb">${f?`<div data-notr class="libnotes">${f}</div><div style="text-align:right;margin-top:6px"><a href="#" class="replink" data-rep="n|${s}|${i}">⚑ Report an error</a></div>`:'<p class="mut">No notes for this chapter yet: open the professor\'s material below.</p>'}
    ${x.res.length?`<div class="libres"><b>📎 Professor's material</b><div class="small mut">On MyCourses (log in to open it).</div><ul>${x.res.map(r=>`<li><a href="${r[1]}" target="_blank" rel="noopener">${r[0]}</a></li>`).join('')}</ul></div>`:''}</div></details>`;}).join('')||'<div class="card mut">No chapters for this subject yet.</div>'}`;
  app.querySelectorAll('[data-lib]').forEach(b=>b.onclick=()=>{libS=b.dataset.lib;render();window.scrollTo(0,0);});
  app.querySelectorAll('details.libch').forEach(d=>d.ontoggle=()=>{libOpen[d.dataset.k]=d.open;});
  app.querySelectorAll('[data-practise]').forEach(b=>b.onclick=()=>go('subject',b.dataset.practise));
}

/* ================= MY PROFILE ================= */
let profEdit=null;
function viewProfile(){
  const P=prof()||{first:'',last:''},ini=((P.first||'?')[0]+(P.last||'')[0]||'').toUpperCase();
  const esc=s=>String(s||'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const sec=(t,body)=>`<div class="card mb"><h2>${t}</h2>${body}</div>`;
  app.innerHTML=`<div class="top"><h1>👤 My profile</h1></div>
  <div class="card mb profhead"><div class="avatar">${esc(ini)}</div><div style="flex:1;min-width:0"><h2 style="margin:0">${esc(P.first)} ${esc(P.last)}</h2><div class="small mut">${esc(window.ME_EMAIL||'')}</div><div class="small" style="margin-top:4px">Level ${lvl()} · ${title()} · ${xp} XP</div></div></div>
  <div class="g g2">
  <div>
  ${sec('⏱ Study time',(P.start?`<p class="mut" style="margin-top:-4px">Revision from <b>${fmt(P.start)}</b> · weekdays <b>${hm(P.wk)}</b> · Sat <b>${hm(P.sat)}</b> · Sun <b>${hm(P.sun)}</b></p>`:'<p class="mut">Not set yet.</p>')+'<button class="btn pri" id="pf-time">Change my study time</button>')}
  ${sec('🗓 Outlook timetable',store('ics')?`<p class="mut" style="margin-top:-4px">Connected: your classes and class summaries appear on the dashboard.</p><button class="btn" id="pf-ics">Manage my timetable</button>`:`<p class="mut" style="margin-top:-4px">Not connected. Connect it to see your classes of the day and a summary of each class as soon as it ends.</p><button class="btn pri" id="pf-ics">Connect my timetable</button>`)}
  ${sec('🌍 Language',`<div class="small mut" style="margin:-4px 0 6px">Site language</div><div class="seg seg2" role="group" aria-label="Site language"><button class="${UI_LANG()==='en'?'on':''}" data-ui="en">English</button><button class="${UI_LANG()==='fr'?'on':''}" data-ui="fr">Français</button></div>
    <div class="small mut" style="margin:12px 0 6px">Course content (notes, flashcards, MCQs)</div><div class="seg seg2" role="group" aria-label="Course content language"><button class="${LANG!=='fr'?'on':''}" data-cl="course">English (exam language)</button><button class="${LANG==='fr'?'on':''}" data-cl="fr">French help</button></div>`)}
  </div><div>
  ${sec('👥 Leaderboard',`<p class="mut" style="margin-top:-4px">You appear as <b>${esc(pseudo(P))}</b>.</p><label class="small"><input type="checkbox" id="pf-board" ${squadOn()?'checked':''}> Show me on the S3 leaderboard</label>`)}
  ${sec('🔐 Account',profEdit==='name'?`<label class="fl">First name<input id="pf-f" value="${esc(P.first)}"></label><label class="fl">Last name<input id="pf-l" value="${esc(P.last)}"></label><div id="pf-e" class="oerr"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-cancel="1">Cancel</button><button class="btn pri" id="pf-ns">Save</button></div>`
    :profEdit==='pw'?`<label class="fl">New password<input id="pf-p1" type="password" autocomplete="new-password"></label><label class="fl">Confirm<input id="pf-p2" type="password" autocomplete="new-password"></label><div id="pf-e" class="oerr"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-cancel="1">Cancel</button><button class="btn pri" id="pf-ps">Save</button></div>`
    :`<div style="display:grid;gap:10px"><button class="btn" id="pf-name">✏️ Change my name</button><button class="btn" id="pf-pw">🔑 Change my password</button><button class="btn" id="pf-out">↪ Log out</button></div>`)}
  ${sec('Start over',`<p class="mut" style="margin-top:-4px">Erase all your progress (blocks, XP, flashcards, grades) and redo the study-time test. Your account and your own flashcards are kept.</p><button class="btn" id="pf-reset" style="color:var(--bad);border-color:var(--bad)">↺ Start over from zero</button>`)}
  ${sec('🔒 Privacy',`<p class="mut" style="margin-top:-4px">What Grind stores about you, why, and how to delete it.</p><div style="display:grid;gap:10px"><button class="btn" data-privacy>Read the privacy notice</button><button class="btn" data-rep="privacy">✉️ Contact about my data</button>${profEdit==='del'?`<div class="tipnote small">This permanently deletes your account, your progress, your flashcards and your place on the leaderboard. Type <b>DELETE</b> to confirm.</div><input id="pf-del" autocomplete="off" style="font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--bad);background:var(--bg);color:var(--ink)"><div id="pf-de" class="oerr"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-cancel="1">Cancel</button><button class="btn" id="pf-delgo" style="background:var(--bad);border-color:var(--bad);color:#fff">Delete my account</button></div>`:`<button class="btn" id="pf-delask" style="color:var(--bad);border-color:var(--bad)">🗑 Delete my account</button>`}</div>`)}
  </div></div>`;
  const $=id=>document.getElementById(id),b=(id,f)=>{const el=$(id);if(el)el.onclick=f;};
  b('pf-time',()=>onboarding('edit'));b('pf-ics',()=>icsModal());
  b('pf-name',()=>{profEdit='name';render();});b('pf-pw',()=>{profEdit='pw';render();});
  app.querySelectorAll('[data-cancel]').forEach(x=>x.onclick=()=>{profEdit=null;render();});
  b('pf-ns',()=>{const f=$('pf-f').value.trim(),l=$('pf-l').value.trim();if(!f||!l){$('pf-e').textContent=t('Enter your first and last name.');return;}setProf(Object.assign({},P,{first:f,last:l}));profEdit=null;render();pushBoard();toast(t('✓ Name updated'));});
  b('pf-ps',async()=>{const p1=$('pf-p1').value,p2=$('pf-p2').value;if(p1.length<8){$('pf-e').textContent=t('At least 8 characters.');return;}if(p1!==p2){$('pf-e').textContent=t('The two passwords don\'t match.');return;}const {error}=await SB.auth.updateUser({password:p1});if(error){$('pf-e').textContent=error.message;return;}profEdit=null;render();toast(t('🔑 Password updated'));});
  b('pf-delask',()=>{profEdit='del';render();setTimeout(()=>{const i=$('pf-del');if(i)i.focus();},30);});
  b('pf-delgo',async()=>{const v=($('pf-del').value||'').trim().toUpperCase();if(v!=='DELETE'&&v!=='SUPPRIMER'){$('pf-de').textContent=t('Type DELETE to confirm.');return;}
    $('pf-delgo').disabled=true;clearTimeout(_pushT);const {error}=await SB.rpc('delete_my_account');if(error){$('pf-delgo').disabled=false;$('pf-de').textContent=t('Couldn\'t delete your account. Try again.');return;}
    try{Object.keys(localStorage).filter(k=>k.startsWith(SPX)).forEach(k=>localStorage.removeItem(k));}catch(e){}await SB.auth.signOut();location.replace(location.pathname+'#deleted');location.reload();});
  b('pf-out',async()=>{clearTimeout(_pushT);await pushNow();await SB.auth.signOut();location.reload();});
  const pb=$('pf-board');if(pb)pb.onchange=async e=>{store('squadOn',e.target.checked);await pushBoard();boardRows=null;toast(e.target.checked?t('You appear on the leaderboard'):t('You are hidden from the leaderboard'));};
  app.querySelectorAll('[data-cl]').forEach(x=>x.onclick=()=>{LANG=x.dataset.cl==='fr'?'fr':'course';store('lang',LANG);render();});
  b('pf-reset',e=>{const el=$('pf-reset');if(el.dataset.sure!=='1'){el.dataset.sure='1';el.textContent=t('Tap again to erase all your progress');el.style.background='var(--badbg)';return;}onboarding('new');});
  bindNav(app);
}

/* ================= RENDER ================= */
function render(){
  killCharts();
  const side=document.getElementById('side'); side.innerHTML=navHTML(false); bindNav(side);
  const mob=document.getElementById('mobnav'); mob.innerHTML=navHTML(true); bindNav(mob);
  const dr=document.getElementById('drawer'); dr.className=drawer?'drawer in':'drawer'; dr.innerHTML=drawer?`<button class="xbtn dclose" data-close="1" aria-label="Close">✕</button>`+navHTML(false):''; bindNav(dr); document.body.style.overflow=drawer?'hidden':'';
  if(view==='admin')viewAdmin(); else if(view==='library')viewLibrary(); else if(view==='profile')viewProfile(); else if(view==='review')viewReview(); else if(view==='cram'&&subj)viewCram(); else if(view==='calendar')viewCalendar(); else if(view==='subjects')viewSubjects(); else if(view==='progress')viewProgress(); else if(view==='grades')viewGrades(); else if(view==='exams')viewExams(); else if(view==='subject'&&subj)viewSubject(); else viewHome();
}
(async function init(){const h=(location.hash||'').slice(1); if(h.startsWith('s-')&&EX[h.slice(2)]){view='subject';subj=h.slice(2);} else if(['calendar','progress','grades','exams','subjects','review','library','profile','admin'].includes(h)) view=h;
  render(); if(!prof()||!prof().start) onboarding('new'); else if(!store('askedGrades')) gradesModal();
  if(store('ics')){await Promise.all([loadICS(),loadSums()]);if(view==='home'||view==='calendar')render();}
  pushBoard();checkAdmin();})();
window.addEventListener('hashchange',()=>{const h=(location.hash||'').slice(1);if(h.startsWith('s-')&&EX[h.slice(2)]){if(view!=='subject'||subj!==h.slice(2)){view='subject';subj=h.slice(2);stab='overview';render();}}else if(['calendar','progress','grades','exams','home','subjects','review','library','profile','admin'].includes(h)&&h!==view){view=h;render();}});
