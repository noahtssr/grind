/* Grind · fiche layout: turns plain notes (<h3> sections + bullet lists) into
   key points, colour-coded blocks, collapsible sections, read tracking and quick checks.
   Works on any element with class "fx" and data-fs (subject) / data-fc (chapter). */
(function(G){
const T=k=>(typeof G.t==='function'?G.t(k):k);
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&amp;/g,' ').replace(/\s+/g,' ').trim();
const KINDS={def:{ic:'📘',l:'Definition'},frm:{ic:'🧮',l:'Formula'},trap:{ic:'⚠️',l:'Exam trap'},ex:{ic:'💡',l:'Worked example'}};
function classify(li){
  const h=li.innerHTML,t=strip(h);
  if(li.querySelector('ul,ol,table'))return 'n';
  if(/⚠|^\s*(trap|piège|careful|beware|watch out|attention|common mistake|don.?t confuse|do not confuse|never)\b/i.test(t))return 'trap';
  const head=t.slice(0,45);
  if(/\b(example|exemple|case|exercise|exercice)\b/i.test(head)&&/\d/.test(t))return 'ex';
  if(/\b(Example|Exemple)\s*:/.test(t)&&(t.match(/\d+/g)||[]).length>=3)return 'ex';
  if(/=/.test(t)&&(/[\/√×²Σ∑^]/.test(t)||/(^|[\s(])[A-Za-z*'ᵢ₀-₉]{1,4}\s?=/.test(t))&&t.length<280)return 'frm';
  if(/^<b>[^<]{2,60}<\/b>\s*(:|=|–|—|is\b|are\b|means\b|\()/i.test(h.trim())&&/\b(is|are|means|refers to|defined as|=)\b/i.test(t.slice(0,160)))return 'def';
  return 'n';}
function block(kind,html,short){const k=KINDS[kind];return `<div class="fxb fx-${kind}${kind==='frm'&&short?' fx-c':''}"><div class="fxl">${k.ic} ${T(k.l)}</div><div>${html}</div></div>`;}
function rebuildList(ul){ // returns html: blocks + remaining plain bullets
  if(ul.tagName!=='UL')return ul.outerHTML;let out='',buf=[];
  const flush=()=>{if(buf.length){out+='<ul>'+buf.join('')+'</ul>';buf=[];}};
  [...ul.children].forEach(li=>{if(li.tagName!=='LI'){buf.push(li.outerHTML);return;}const k=classify(li);
    if(k==='n')buf.push(li.outerHTML);else{flush();out+=block(k,li.innerHTML,strip(li.innerHTML).length<90);}});
  flush();return out;}
const STOP=new Set('this that with from your their they them have been were when what which will would there these those than then into over also only more most such each both very much many some same other about under after before while where because between should could must does used using make made like just even well take shows show case example exam course slide slides class notes answer question correct option following true false best which'.split(' '));
const toks=s=>(s.toLowerCase().match(/[a-zà-öø-ÿ]{4,}/g)||[]).filter(w=>!STOP.has(w));
function pickQ(subj,text,used){
  const C=(G.CONTENT||{})[subj];if(!C||!C.qcm)return -1;const tw=new Set(toks(text));if(tw.size<5)return -1;
  let best=-1,bs=0;C.qcm.forEach((q,i)=>{if(!q||q[3]==='H'||used.has(i))return;const qt=toks(q[0]+' '+q[1][q[2]]);if(!qt.length)return;
    let m=0;new Set(qt).forEach(w=>{if(tw.has(w))m++;});const sc=m/Math.sqrt(new Set(qt).size);if(m>=4&&sc>bs){bs=sc;best=i;}});
  return bs>=1.35?best:-1;}
function readMap(){try{return (typeof G.store==='function'&&G.store('ficheRead'))||{};}catch(e){return {};}}
function saveRead(m){try{G.store('ficheRead',m);}catch(e){}}
function enhance(el){
  if(el.dataset.fxd)return;el.dataset.fxd='1';
  const subj=el.dataset.fs,ch=el.dataset.fc;const src=document.createElement('div');src.innerHTML=el.innerHTML;
  // split by h3
  const secs=[];let cur={title:null,nodes:[]};
  [...src.childNodes].forEach(n=>{if(n.nodeType===1&&n.tagName==='H3'){if(cur.title||cur.nodes.some(x=>x.nodeType===1||(x.textContent||'').trim()))secs.push(cur);cur={title:n.innerHTML,nodes:[]};}else cur.nodes.push(n);});
  secs.push(cur);
  if(secs.length<2&&!secs[0].title){el.classList.add('fx-plain');return;} // nothing to structure
  // key points: first bullet of the first sections (or first formula/def)
  const keys=[];const firstLi=nodes=>{for(const n of nodes){if(n.nodeType===1){const li=n.tagName==='UL'||n.tagName==='OL'?n.querySelector(':scope>li'):null;if(li)return li;}}return null;};
  secs.forEach(s=>{if(keys.length>=3||!s.title)return;const li=firstLi(s.nodes);if(!li)return;let h=li.innerHTML;const t=strip(h);
    if(t.length>170){const cut=t.slice(0,170);const p=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('; '));h=(p>60?cut.slice(0,p+1):cut.replace(/\s\S*$/,'')+'…');}
    keys.push(h);});
  const rm=readMap(),used=new Set();let words=0;
  const body=secs.map((s,i)=>{
    const htmlParts=s.nodes.map(n=>n.nodeType===1&&(n.tagName==='UL')?rebuildList(n):(n.nodeType===1?n.outerHTML:(n.textContent.trim()?`<p>${n.textContent}</p>`:''))).join('');
    const plain=strip(s.nodes.map(n=>n.nodeType===1?n.outerHTML:n.textContent).join(' '));words+=plain.split(' ').length;
    if(!s.title)return htmlParts?`<div class="fxintro">${htmlParts}</div>`:'';
    const id=`${subj}|${ch}|${i}`,isRead=!!rm[id];const qi=pickQ(subj,strip(s.title)+' '+plain,used);if(qi>=0)used.add(qi);
    const q=qi>=0?G.CONTENT[subj].qcm[qi]:null;
    const quiz=q?`<div class="fxq" data-qi="${qi}"><div class="fxqh">✅ ${T('Check yourself')}</div><div class="fxqq"></div><div class="fxqo">${q[1].map((o,j)=>`<button class="btn sm" data-j="${j}"></button>`).join('')}</div><div class="fxqr small"></div></div>`:'';
    return `<details class="fxs" data-id="${id}" ${isRead?'':'open'}><summary><span class="fxst">${s.title}</span><button class="btn sm fxrd ${isRead?'on':''}" type="button">${isRead?T('Read ✓'):T('Mark as read')}</button></summary><div class="fxsb">${htmlParts}${quiz}</div></details>`;}).join('');
  const nSec=secs.filter(s=>s.title).length,mins=Math.max(1,Math.round(words/180));
  el.innerHTML=`<div class="fxhd"><span class="small mut">⏱ ${mins} ${T('min read')}</span><span class="fxpc small mut"></span></div><div class="fxbar"><i></i></div>
  <div class="fxleg small">${Object.values(KINDS).map(k=>`<span>${k.ic} ${T(k.l)}</span>`).join('')}</div>
  ${keys.length?`<div class="fxkey"><div class="fxl">🎯 ${T('Key points')}</div><ul>${keys.map(k=>`<li>${k}</li>`).join('')}</ul></div>`:''}${body}`;
  // fill quiz text safely
  el.querySelectorAll('.fxq').forEach(box=>{const q=G.CONTENT[subj].qcm[+box.dataset.qi];box.querySelector('.fxqq').textContent=q[0];
    box.querySelectorAll('[data-j]').forEach(b=>{b.textContent=q[1][+b.dataset.j];b.onclick=()=>{const ok=+b.dataset.j===q[2];const r=box.querySelector('.fxqr');
      box.querySelectorAll('[data-j]').forEach(x=>{x.classList.remove('fxok','fxko');});b.classList.add(ok?'fxok':'fxko');
      const ex=(((typeof LANG!=='undefined'?LANG:'en')==='fr'?(G.EXPL||{})[subj]:((G.EN||{})[subj]||{}).expl)||[])[+box.dataset.qi]||'';
      r.textContent=(ok?'✓ '+T('Correct'):'✗ '+T('Not quite')+' · '+T('Answer')+': '+q[1][q[2]])+(ex?' — '+ex.replace(/<[^>]+>/g,''):'');r.style.color=ok?'var(--ok,#16a34a)':'var(--bad,#dc2626)';};});});
  const upd=()=>{const m=readMap();const n=[...el.querySelectorAll('.fxs')].filter(d=>m[d.dataset.id]).length;el.querySelector('.fxpc').textContent=`${n} / ${nSec} ${T('sections read')}`;el.querySelector('.fxbar i').style.width=(nSec?n/nSec*100:0)+'%';};
  el.querySelectorAll('.fxrd').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const d=b.closest('.fxs'),m=readMap(),id=d.dataset.id;
    if(m[id]){delete m[id];b.classList.remove('on');b.textContent=T('Mark as read');}
    else{m[id]=1;b.classList.add('on');b.textContent=T('Read ✓');d.open=false;try{G.addXP&&G.addXP(5,'· '+T('section read'),'fr|'+id);}catch(x){}}
    saveRead(m);upd();});
  upd();
}
function scan(root){(root||document).querySelectorAll('.fx[data-fs]:not([data-fxd])').forEach(enhance);}
G.GrindFiche={scan,enhance,classify};
if(typeof document!=='undefined'){const go=()=>{scan();new MutationObserver(()=>scan()).observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();}
})(typeof window!=='undefined'?window:globalThis);
