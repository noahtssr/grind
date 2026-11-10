/* Grind · fiche layout: turns plain notes (<h3> sections + bullet lists) into
   key points, colour-coded blocks, collapsible sections, read tracking and quick checks.
   Works on any element with class "fx" and data-fs (subject) / data-fc (chapter). */
(function(G){
const T=k=>(typeof G.t==='function'?G.t(k):k);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const norm=s=>String(s).replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
let _tmp=null;const tdiv=()=>_tmp||(_tmp=document.createElement('div'));
const strip=h=>{const d=tdiv();d.innerHTML=h;return norm(d.textContent);};
const slug=s=>norm(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);
const KINDS={def:{ic:'📘',l:'Definition'},frm:{ic:'🧮',l:'Formula'},trap:{ic:'⚠️',l:'Exam trap'},ex:{ic:'💡',l:'Worked example'}};
const lang=()=>(typeof LANG!=='undefined'?LANG:(G.LANG||'en'));

/* ---------- classification ---------- */
const DISC=/not (yet )?(on|available on) MyCourses|not (yet )?available|pas encore (en ligne|disponible)/i;
const TRAPW=/(⚠|\b(exam trap|trap|piège|careful|beware|watch out|common mistake|classic mistake|mistakes?|pitfall|don.?t confuse|do not confuse|ne pas confondre|never|jamais|avoid|attention|weak questions)\b)/i;
const BADHEAD=/CJEU|court|\b(1[89]|20)\d\d\b|\?|\b(task|exercise|grading|key questions|capstone|steps?|example|mock|game|dilemma|checks?|checklist|take-?aways|why|how|rationale|importance|storage|analysis|first|layout|trend|explanations|case|data|homework|tips|q\d|assumptions|conclusion|long term|short term|long run|short run|fits when|lots of|pattern|effects?|limits)\b/i;
function own(li){const c=li.cloneNode(true);c.querySelectorAll('ul,ol,table').forEach(x=>x.remove());return {h:c.innerHTML.trim(),t:norm(c.textContent)};}
const JOURNAL=/\b(Dr|Cr)\b|\b[A-Z]{1,3}[+−](?=[\s\/,.;)]|$)/;
function formula(t){
  if(JOURNAL.test(t)||t.length>300)return {ok:false,lead:false};
  if(/[√Σ∑±]/.test(t)&&t.length<160&&!/=/.test(t))return {ok:true,lead:true};
  const k=t.indexOf('=');if(k<0||k>110)return {ok:false,lead:false};
  const lhs=t.slice(0,k).trim(),rhs0=t.slice(k+1).trim();
  const rhs=rhs0.replace(/\s?€?\/\s?(unit|units|h|hour|day|month|year|an|mois|jour|kg|t|exam|item|piece)\b/gi,' ').replace(/\d+(\/\d+){2,}/g,' ').slice(0,90);
  const lw=lhs.replace(/^[^:]{0,40}:\s*/,'').split(/\s+/).filter(Boolean);
  if(/^(a|an|the|all|any|one|each|un|une|le|la|les|des|du)\b/i.test(rhs0))return {ok:false,lead:false};
  const lead=lw.length>=1&&lw.length<=7&&!/\d{3}|\d,\d{3}/.test(lhs);
  const op=/[\/×·÷√²³Σ∑^−+*≤≥<>±%]|\d|\bmax\b|\bmin\b/.test(rhs.slice(0,60));
  const greek=/[α-ωΑ-Ωμσβεx̄ŷ₀-₉ᵢ]/.test(lhs);
  return {ok:lead&&(op||greek),lead:lead&&op};}
function isDef(h,t,bh){
  if(/^(definition|définition)\b/i.test(t))return true;
  if(bh){if(BADHEAD.test(bh)||/^\s*\d/.test(bh)||bh.split(/\s+/).length>6)return false;
    const rest=t.slice(norm(bh).length).trim();
    if(/^=/.test(rest))return !/^=\s*[\d(]/.test(rest);
    const r=rest.replace(/^[:–—-]\s*/,'');
    if(/^(\([^)]{0,40}\)\s*)?[:–—-]?\s*(is|are|means|refers to|is defined as|est|sont|désigne|correspond à)\b/i.test(rest))return true;
    if(/^[:–—]/.test(rest)&&/^(a|an|the|any|all|one|un|une|le|la|l'|les|tout|toute)\s/i.test(r)&&!/\d/.test(r.slice(0,50))&&!JOURNAL.test(r.slice(0,60)))return true;
    return false;}
  const m=t.match(/^([A-Z][\w'()\/ -]{0,40}?)\s=\s(.*)/);
  if(m&&!/^[\d(−-]/.test(m[2])&&m[1].split(/\s+/).length<=5&&!BADHEAD.test(m[1]))return true;
  return false;}
function classify(li,ctx){
  ctx=ctx||{};const {h,t}=own(li);if(!t||DISC.test(t))return 'n';
  if(ctx.trapSec||TRAPW.test(t.slice(0,40)))return 'trap';
  const bh=((h.match(/^<b>([^<]{1,80})<\/b>/)||[])[1]||'');
  const nums=(t.match(/\d+([.,]\d+)?/g)||[]).length,big=(t.match(/\d{1,3}(,\d{3})+|\d{3,}/g)||[]).length;
  const exHead=/^(example|exemple|e\.g\.|case|cas|exercise|exercice|homework|mock exam|own example|worked)\b/i.test(t)||/\b(example|exemple|case|exercise|homework|mock|game|dilemma|battle|ultimatum)\b/i.test(bh);
  if(exHead&&(nums>=2||/^(example|exemple|own example)/i.test(t)))return 'ex';
  if(/\(\s*-?\d+\s*[;,]\s*-?\d+\s*\)/.test(t)&&nums>=6)return 'ex';
  const f=formula(t);
  const k=t.indexOf('=');const numSub=k>=0&&/^\s*[\d(]/.test(t.slice(k+1))&&big>=2;
  if((big>=3&&!f.lead)||(numSub&&!/[A-Za-zα-ω]\s*[\/×]/.test(t.slice(0,k))))return 'ex';
  if(f.ok)return 'frm';
  if(isDef(h,t,bh))return 'def';
  return 'n';}
function block(kind,html,short,tag){const k=KINDS[kind];if(kind==='trap')html=html.replace(/^\s*⚠️?\s*/,'');const b=`<div class="fxb fx-${kind}${kind==='frm'&&short?' fx-c':''}"><div class="fxl nomath">${k.ic} ${T(k.l)}</div><div>${html}</div></div>`;return tag?`<li class="fxli">${b}</li>`:b;}
function rebuildList(list,ctx){
  const ol=list.tagName==='OL';let out='',buf=[];const items=[...list.children];
  // classify, then align siblings that share the "<b>Term</b> – …" shape
  const ks=items.map(li=>li.tagName==='LI'?classify(li,ctx):'n');
  const heads=items.map(li=>li.tagName==='LI'?(own(li).h.match(/^<b>([^<]{1,50})<\/b>\s*[:–—-]/)||[])[1]:null);
  const shaped=heads.filter(x=>x&&!BADHEAD.test(x)).length;
  const nd=ks.filter(k=>k==='def').length;
  if(shaped>=2&&shaped>=items.length/2&&nd>=Math.max(1,shaped/3))ks.forEach((k,i)=>{if(k==='n'&&heads[i]&&!BADHEAD.test(heads[i])&&!/^\s*\d/.test(heads[i])&&own(items[i]).t.length-heads[i].length>20)ks[i]='def';});
  const inner=li=>{const c=li.cloneNode(true);c.querySelectorAll(':scope>ul,:scope>ol').forEach(n=>{const d=document.createElement('div');d.innerHTML=rebuildList(n,ctx);n.replaceWith(...d.childNodes);});return c.innerHTML;};
  const flush=()=>{if(buf.length){out+=ol?buf.join(''):'<ul>'+buf.join('')+'</ul>';buf=[];}};
  items.forEach((li,i)=>{if(li.tagName!=='LI'){buf.push(li.outerHTML);return;}const k=ks[i],html=inner(li);
    if(k==='n'){buf.push(`<li>${html}</li>`);return;}
    const short=own(li).t.length<90;
    if(ol)buf.push(block(k,html,short,true));else{flush();out+=block(k,html,short);}});
  flush();return ol?`<ol>${out}</ol>`:out;}

/* ---------- quick checks: one MCQ per section, unique per subject ---------- */
const STOP=new Set('this that with from your their they them have been were when what which will would there these those than then into over also only more most such each both very much many some same other about under after before while where because between should could must does used using make made like just even well take shows show case example exam course slide slides class notes answer question correct option following true false best which'.split(' '));
const toks=s=>(s.toLowerCase().match(/[a-zà-öø-ÿ]{4,}/g)||[]).filter(w=>!STOP.has(w));
const BADQ=/same data|same stations|same firm|previous question|question above|as above|same figures|same numbers/i;
/* reviewed by hand: "chapter:section" → MCQ index (-1 = no quick check) */
const OVR={
 MM:{'6:3':-1,'2:0':8,'3:1':-1,'2:2':7,'5:1':49,'4:2':44,'6:2':22},
 TL:{'0:0':-1,'5:0':28,'6:0':27,'7:0':-1,'4:2':21,'6:2':30,'0:3':3,'4:3':-1},
 DI:{'2:1':53},
 OM:{'1:1':-1,'1:3':31,'4:0':12,'7:2':48},
 MS:{'0:2':3,'3:1':18,'3:2':19,'5:1':33,'0:1':0},
 ST:{'4:1':13,'0:2':1,'3:1':10},
 AFA:{'0:1':4,'3:2':51,'4:2':-1,'6:3':-1,'0:2':1,'6:0':22,'8:0':30,'5:2':16,'5:3':56,'7:1':26},
 COST:{'4:3':46,'1:0':-1,'1:1':6,'1:4':36,'2:2':13,'2:0':37,'1:2':9,'2:3':15},
 ECO:{'0:0':-1,'0:3':24,'1:1':26,'1:3':28,'2:1':32,'3:3':35,'3:5':39,'4:1':41,'6:0':56}};
const NOAUTO={MM:[12,20],DI:[56,59,60,65],ST:[14],AFA:[13],COST:[20]};
const plans={};
function sectionsOf(html){const d=document.createElement('div');d.innerHTML=html;const out=[];let cur=null;
  [...d.childNodes].forEach(n=>{if(n.nodeType===1&&n.tagName==='H3'){cur={title:norm(n.textContent),txt:''};out.push(cur);}else if(cur)cur.txt+=' '+(n.textContent||'');});return out;}
function plan(subj){
  if(plans[subj])return plans[subj];const P={};plans[subj]=P;
  const C=(G.CONTENT||{})[subj],F=(((G.EN||{})[subj]||{}).fiches)||{};if(!C||!C.qcm)return P;
  const ov=OVR[subj]||{},no=new Set(NOAUTO[subj]||[]),used=new Set();
  Object.keys(ov).forEach(k=>{if(ov[k]>=0&&C.qcm[ov[k]]&&C.qcm[ov[k]][3]!=='H'){P[k]=ov[k];used.add(ov[k]);}else P[k]=-1;});
  const qt=C.qcm.map((q,i)=>(!q||q[3]==='H'||no.has(i)||BADQ.test(q[0]))?null:new Set(toks(q[0]+' '+q[1][q[2]])));
  const pairs=[];
  Object.keys(F).forEach(ch=>sectionsOf(F[ch]).forEach((s,si)=>{const key=ch+':'+si;if(key in P)return;
    const tw=new Set(toks(s.title+' '+s.title+' '+s.txt));if(tw.size<5)return;const tt=new Set(toks(s.title));
    qt.forEach((qs,i)=>{if(!qs||!qs.size)return;let m=0,mt=0;qs.forEach(w=>{if(tw.has(w))m++;if(tt.has(w))mt++;});const sc=(m+mt*.5)/Math.sqrt(qs.size);if(m>=4&&sc>=1.35)pairs.push([sc,key,i]);});}));
  pairs.sort((a,b)=>b[0]-a[0]);
  pairs.forEach(([sc,key,i])=>{if(key in P||used.has(i))return;P[key]=i;used.add(i);});
  return P;}

/* ---------- exam traps quoted from the notes ---------- */
const TRAPS={
 MM:['never describe the company in O/T','Line extension','are the weakest','The consumer price ≠ the manufacturer','not automatically lower','A launch aims at awareness'],
 TL:['can only sue in tort','must be transposed','not durable enough','is not enough','doesn\'t save it','not decisive','exception to specialty','checks only absolute grounds','Exclusive licence','no fault or damage'],
 DI:['Android is an OS, not an application','not a programming language','series of technology investments','AR merges the real and virtual','stored on every miner','someone else\'s computer','one shared key'],
 OM:['Higher production ≠ higher productivity','multifactor goes down','less productive per euro','not by margin per unit','useless, or even harmful','no gain','re-check','P has no impact on Q','opportunity loss','same for every rule','More is not always better'],
 MS:['not every NE is an equilibrium in dominant strategies','still Break','profit max ≠ revenue max','p ≥ AVC','Not Bertrand'],
 ST:['decision-maker?','once need and value are established','disguised as open','are implication questions','yes, and','Silence is what should worry you'],
 AFA:['neither good nor bad','you owe the goods','of training is an expense','Generated internally','A dividend is not an expense','no effect on the company\'s books','with no new expense','ignoring the residual value','Total equity is unchanged','Non-cash items are NOT'],
 COST:['Always round UP','Be consistent','Don\'t forget inventories','Classic mistake','higher CM per unit','is misleading'],
 ECO:['read Levene first','small deviations are detected','No universal','Pairwise correlations are not enough','Never remove them all at once','because it\'s inconvenient','Sum of eigenvalues','without explanation','No causal conclusion','still one sample','count as independent']};
function sentenceAround(t,i,len){let a=t.lastIndexOf('. ',i);a=a<0?0:a+2;const sc=t.lastIndexOf('; ',i);if(sc>=0&&sc+2>a&&i-sc<160)a=sc+2;
  let b=t.indexOf('. ',i+len);b=b<0?t.length:b+1;const sb=t.indexOf('; ',i+len);if(sb>=0&&sb<b)b=sb;
  return t.slice(a,b).trim();}
function trapsFor(subj,nodes){
  const L=TRAPS[subj];if(!L||lang()==='fr')return [];const out=[];
  const lis=[];nodes.forEach(n=>{if(n.nodeType!==1)return;if(n.tagName==='LI')lis.push(n);n.querySelectorAll('li').forEach(x=>lis.push(x));});
  lis.forEach(li=>{const {t}=own(li);if(TRAPW.test(t.slice(0,40)))return;L.forEach(q=>{const i=t.toLowerCase().indexOf(norm(q).toLowerCase());if(i>=0){const s=sentenceAround(t,i,q.length);if(s&&!out.includes(s))out.push(s.length>260?s.slice(0,257)+'…':s);}});});
  return out.slice(0,3);}

/* ---------- key points ---------- */
const ABBR=/\b(e\.g|i\.e|art|adj|vs|etc|Inc|cf|n°|No|approx|min|max|p|pp|fig|Ltd|Co|St)\.$/i;
function shorten(t,max){if(t.length<=max)return t;let depth=0,best=-1;
  for(let i=0;i<Math.min(t.length,max);i++){const c=t[i];if(c==='('||c==='[')depth++;else if((c===')'||c===']')&&depth)depth--;
    else if(c==='.'&&depth===0&&t[i+1]===' '&&!ABBR.test(t.slice(Math.max(0,i-8),i+1)))best=i;}
  if(best>70)return t.slice(0,best+1);
  return t.slice(0,max).replace(/[\s,;:(–-]+\S*$/,'')+'…';}
const SKIPSEC=/exam format|grading|course map|capstone|presentation|poster|deliverable|organisation|organization|logistics/i;
function keyFor(sec,ctx){
  const lis=[];sec.nodes.forEach(n=>{if(n.nodeType===1&&(n.tagName==='UL'||n.tagName==='OL'))[...n.children].forEach(li=>{if(li.tagName==='LI')lis.push(li);});});
  const ok=li=>{const {t}=own(li);return t.length>=45&&!DISC.test(t)&&!/^(grading|exam|mcq tips|data)\b/i.test(t)&&((t.match(/\d/g)||[]).length<t.length*.12);};
  if(sec.flat){const p=sec.nodes.find(n=>n.nodeType===1&&n.tagName==='P');const t=p?own(p).t:'';return t.length>=30?`<b>${esc(sec.titleTxt)}</b> — ${esc(shorten(t,175))}`:null;}
  let pick=lis.find(li=>ok(li)&&['def','frm'].includes(classify(li,ctx)))||lis.find(ok);if(!pick)return null;
  return `<b>${esc(sec.titleTxt)}</b> — ${esc(shorten(own(pick).t,175))}`;}

/* ---------- read state ---------- */
function readMap(){try{return (typeof G.store==='function'&&G.store('ficheRead'))||{};}catch(e){return {};}}
function saveRead(m){try{G.store('ficheRead',m);}catch(e){}}
function refreshAll(){document.querySelectorAll('.fx[data-fxd]').forEach(el=>{if(el._fxupd)el._fxupd();});}

/* ---------- split into sections ---------- */
function split(src){
  const secs=[];let cur={title:null,nodes:[]};
  [...src.childNodes].forEach(n=>{if(n.nodeType===1&&n.tagName==='H3'){if(cur.title||cur.nodes.some(x=>x.nodeType===1||(x.textContent||'').trim()))secs.push(cur);cur={title:n.innerHTML,nodes:[]};}else cur.nodes.push(n);});
  secs.push(cur);
  if(secs.length>=2||secs[0].title)return secs;
  // no <h3> (French notes): one section per top bullet that starts with a bold term
  const ul=[...src.children].filter(n=>n.tagName==='UL');if(ul.length!==1)return null;
  const lis=[...ul[0].children].filter(n=>n.tagName==='LI');
  if(lis.length<3||lis.filter(li=>/^<b>[^<]{2,70}<\/b>/.test(li.innerHTML.trim())).length<lis.length*.6)return null;
  const out=[];const pre=[...src.childNodes].filter(n=>n!==ul[0]&&(n.nodeType===1||(n.textContent||'').trim()));if(pre.length)out.push({title:null,nodes:pre});
  lis.forEach(li=>{const m=li.innerHTML.trim().match(/^<b>([^<]{2,70})<\/b>\s*[:–—-]?\s*/);
    if(!m){const last=out[out.length-1];if(last&&last.title){const u=document.createElement('ul');u.appendChild(li.cloneNode(true));last.nodes.push(u);}return;}
    const body=document.createElement('div');body.innerHTML='<p>'+li.innerHTML.trim().slice(m[0].length)+'</p>';
    // move nested lists out of the paragraph
    const p=body.firstChild;p.querySelectorAll(':scope>ul,:scope>ol').forEach(x=>body.appendChild(x));
    out.push({title:esc(m[1].replace(/\s*[:–—-]\s*$/,'')),nodes:[...body.childNodes],flat:1});});
  return out;}

/* ---------- main ---------- */
function enhance(el){
  if(el.dataset.fxd)return;el.dataset.fxd='1';
  const subj=el.dataset.fs,ch=el.dataset.fc,fr=lang()==='fr';const src=document.createElement('div');src.innerHTML=el.innerHTML;
  const secs=split(src);
  if(!secs){el.classList.add('fx-plain');return;}
  secs.forEach(s=>{s.titleTxt=s.title?strip(s.title):'';s.trapSec=/trap|mistake|pitfall|piège|erreur/i.test(s.titleTxt);});
  const titled=secs.filter(s=>s.title),nSec=titled.length;
  const flat=titled.some(s=>s.flat);
  // French notes mirror the English structure: reuse its quick checks and read ids
  const enSecs=fr&&!flat?sectionsOf(((((G.EN||{})[subj]||{}).fiches)||{})[ch]||''):null;const mirror=!!(enSecs&&enSecs.length===nSec);
  const P=flat||(fr&&!mirror)?{}:plan(subj);
  // key points
  const keys=[];titled.forEach(s=>{if(keys.length>=3||SKIPSEC.test(s.titleTxt)||s.trapSec)return;const k=keyFor(s,{trapSec:false});if(k)keys.push(k);});
  // ids (stable: title slug) + migration from the first version (position ids)
  const rm=readMap();let mig=false;let words=0,ti=0;
  const body=secs.map((s,i)=>{
    const ctx={trapSec:s.trapSec};
    const htmlParts=s.nodes.map(n=>n.nodeType===1&&(n.tagName==='UL'||n.tagName==='OL')?rebuildList(n,ctx):(n.nodeType===1?n.outerHTML:(n.textContent.trim()?`<p>${esc(n.textContent)}</p>`:''))).join('');
    const plain=norm(s.nodes.map(n=>n.textContent||'').join(' '));words+=plain.split(' ').length;
    if(!s.title)return htmlParts?`<div class="fxintro">${htmlParts}</div>`:'';
    const si=ti++;const id=mirror?`${subj}|${ch}|${slug(enSecs[si].title)||si}`:`${subj}|${ch}|${fr?'fr:':''}${slug(s.titleTxt)||si}`,old=`${subj}|${ch}|${i}`;
    if(!fr&&!s.flat&&rm[old]&&!rm[id]){rm[id]=1;delete rm[old];mig=true;}
    const isRead=!!rm[id];
    const traps=s.trapSec?[]:trapsFor(subj,s.nodes);
    const trapBox=traps.length?`<div class="fxb fx-trap"><div class="fxl nomath">⚠️ ${T('Exam trap')}</div><div>${traps.length>1?'<ul>'+traps.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>':esc(traps[0])}</div></div>`:'';
    const qi=(ch+':'+si) in P?P[ch+':'+si]:-1;const q=qi>=0?G.CONTENT[subj].qcm[qi]:null;
    const quiz=q?`<div class="fxq" data-qi="${qi}"><div class="fxqh nomath">✅ ${T('Check yourself')}</div><div class="fxqq"></div><div class="fxqo">${q[1].map((o,j)=>`<button class="btn sm" data-j="${j}"></button>`).join('')}</div><div class="fxqr small"></div></div>`:'';
    return `<details class="fxs" data-id="${esc(id)}" ${isRead?'':'open'}><summary><span class="fxst">${s.title}</span><button class="btn sm fxrd nomath ${isRead?'on':''}" type="button">${isRead?T('Read ✓'):T('Mark as read')}</button></summary><div class="fxsb">${htmlParts}${trapBox}${quiz}</div></details>`;}).join('');
  if(mig)saveRead(rm);
  const mins=Math.max(1,Math.round(words/180));
  el.innerHTML=`<div class="fxhd nomath"><span class="small mut">⏱ ${mins} ${T('min read')}</span><span class="fxpc small mut"></span></div><div class="fxbar"><i></i></div>
  <div class="fxleg small nomath">${Object.values(KINDS).map(k=>`<span>${k.ic} ${T(k.l)}</span>`).join('')}</div>
  ${keys.length?`<div class="fxkey"><div class="fxl nomath">🎯 ${T('Key points')}</div><ul>${keys.map(k=>`<li>${k}</li>`).join('')}</ul></div>`:''}${body}`;
  // quizzes (text inserted safely)
  el.querySelectorAll('.fxq').forEach(box=>{const q=G.CONTENT[subj].qcm[+box.dataset.qi];box.querySelector('.fxqq').textContent=q[0];
    box.querySelectorAll('[data-j]').forEach(b=>{b.textContent=q[1][+b.dataset.j];b.onclick=()=>{const ok=+b.dataset.j===q[2];const r=box.querySelector('.fxqr');
      box.querySelectorAll('[data-j]').forEach(x=>{x.classList.remove('fxok','fxko');});b.classList.add(ok?'fxok':'fxko');
      const ex=((lang()==='fr'?(G.EXPL||{})[subj]:((G.EN||{})[subj]||{}).expl)||[])[+box.dataset.qi]||'';
      r.textContent=(ok?'✓ '+T('Correct!'):'✗ '+T('Not quite')+' · '+T('Answer')+': '+q[1][q[2]])+(ex?' — '+strip(ex):'');r.style.color=ok?'var(--ok,#16a34a)':'var(--bad,#dc2626)';};});});
  el._fxupd=()=>{const m=readMap();el.querySelectorAll('.fxs').forEach(d=>{const on=!!m[d.dataset.id],b=d.querySelector('.fxrd');if(b&&b.classList.contains('on')!==on){b.classList.toggle('on',on);b.textContent=on?T('Read ✓'):T('Mark as read');}});
    const n=[...el.querySelectorAll('.fxs')].filter(d=>m[d.dataset.id]).length;el.querySelector('.fxpc').textContent=`${n} / ${nSec} ${T('sections read')}`;el.querySelector('.fxbar i').style.width=(nSec?n/nSec*100:0)+'%';};
  el.querySelectorAll('.fxrd').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const d=b.closest('.fxs'),m=readMap(),id=d.dataset.id;
    if(m[id]){delete m[id];d.open=true;}
    else{m[id]=1;d.open=false;try{G.addXP&&G.addXP(5,'· '+T('section read'),'fr|'+id);}catch(x){}}
    saveRead(m);refreshAll();});
  el._fxupd();
}
let _sch=0;
function scan(root){(root||document).querySelectorAll('.fx[data-fs]:not([data-fxd])').forEach(enhance);}
G.GrindFiche={scan,enhance,classify,plan};
if(typeof document!=='undefined'){const go=()=>{scan();new MutationObserver(()=>{if(_sch)return;_sch=1;Promise.resolve().then(()=>{_sch=0;scan();});}).observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();}
})(typeof window!=='undefined'?window:globalThis);
