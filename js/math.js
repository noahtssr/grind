/* Grind · maths rendering: turns plain-text formulas (a/b, √(…), x², σ…) into KaTeX fractions and roots.
   Runs on the rendered page (text nodes only), so content files stay unchanged. */
(function(G){
const ATOMCH="A-Za-zÀ-ÿ0-9.,*'²³σμεαβλπΣΔ\\u0304\\u0302ˆ_ᵢⱼₖₙ₀-₉";
const NUM="\\d{1,3}(?:[ \\u00a0\\u202f,]\\d{3})+(?:[.,]\\d+)?";
const reLeft=new RegExp("(?:"+NUM+"|√?["+ATOMCH+"]+)$");
const reRight=new RegExp("^(?:"+NUM+"|["+ATOMCH+"]+)");
const SKIP=/^(A\/R|A\/P|S\/W|O\/T|F\/F|O\/M|Y\/N|N\/A|I\/O|R\/W|B2B\/B2C|Dr\/Cr|P\/L|24\/7|TB\/GB|AND\/OR|H0\/H1|H1\/H0|A\/B|B\/C|M\/F|F\/M|DD\/MM|MM\/AA|S\/O)$/i;
const UNIT=/^(h|hr|hrs|hour|hours|day|days|jour|jours|j|year|yr|an|month|mois|week|wk|unit|units|u|kg|g|t|m|km|cm|l|min|s|sec|pers|person|page|class|order|tonne|box|heure|heures|an|ans|semaine|année|€|\$)$/i;
function matchBack(s,i){let d=0;for(let k=i;k>=0;k--){if(s[k]===')')d++;else if(s[k]==='('){d--;if(!d)return k;}}return -1;}
function matchFwd(s,i){let d=0;for(let k=i;k<s.length;k++){if(s[k]==='(')d++;else if(s[k]===')'){d--;if(!d)return k;}}return -1;}
function leftAtom(s,end){ // s[..end) ; returns start index or -1
  let e=end;if(s[e-1]===' ')e--;
  if(s[e-1]===')'){const st=matchBack(s,e-1);if(st<0)return -1;let k=st;const m=s.slice(0,k).match(/(√|Σ|[A-Za-z]{1,4}[ᵢⱼ₀-₉]?)$/);if(m)k-=m[0].length;return k;}
  const m=s.slice(0,e).match(reLeft);if(!m)return -1;let k=e-m[0].length;
  if(s[k-1]==='√')k--;return k;}
function rightAtom(s,start){ // returns end index (exclusive) or -1
  let k=start;if(s[k]===' ')k++;
  if(s[k]==='√'){const r=rightAtom(s,k+1);return r;}
  if(s[k]==='('){const e=matchFwd(s,k);if(e<0)return -1;let z=e+1;const sup=s.slice(z).match(/^[²³*']+/);if(sup)z+=sup[0].length;return z;}
  const m=s.slice(k).match(reRight);if(!m)return -1;let z=k+m[0].length;
  if(s[z]==='('){const e=matchFwd(s,z);if(e>0)z=e+1;}
  while(z>k&&/[.,]/.test(s[z-1]))z--;return z>k?z:-1;}
const GREEK={'σ':'\\sigma ','μ':'\\mu ','ε':'\\varepsilon ','α':'\\alpha ','β':'\\beta ','λ':'\\lambda ','π':'\\pi ','Σ':'\\Sigma ','Δ':'\\Delta '};
function esc(t){ // plain chunk (no / no √) → latex
  t=t.replace(/[−–]/g,'-').replace(/×/g,'\\times ').replace(/÷/g,'\\div ').replace(/≥/g,'\\geq ').replace(/≤/g,'\\leq ').replace(/≈/g,'\\approx ').replace(/≠/g,'\\neq ')
   .replace(/(\d)[ \u00a0\u202f](?=\d{3}\b)/g,'$1{\\,}').replace(/(\d),(?=\d{3}\b)/g,'$1{,}').replace(/(\d),(?=\d)/g,'$1{,}').replace(/%/g,'\\%').replace(/€/g,'\\text{€}').replace(/\$/g,'\\$');
  t=t.replace(/([A-Za-z])\u0304/g,'\\bar{$1}').replace(/([A-Za-z])[\u0302ˆ]/g,'\\hat{$1}').replace(/²([a-z])(?![a-z])/g,'^{2}_{$1}').replace(/²/g,'^{2}').replace(/([A-Za-z])\*/g,'$1^{*}').replace(/³/g,'^{3}');
  t=t.replace(/[σμεαβλπΣΔ]/g,c=>GREEK[c]).replace(/([ᵢⱼₖₙ₀-₉])/g,c=>'_{'+({'ᵢ':'i','ⱼ':'j','ₖ':'k','ₙ':'n'}[c]||String(c.charCodeAt(0)-0x2080))+'}');
  // words: ≥3 lowercase letters or mixed words → \text ; 2+ capitals → \mathrm
  t=t.replace(/(\\[a-zA-Z]+|[A-Za-zÀ-ÿ]{2,})/g,w=>w[0]==='\\'?w:(/[a-zà-ÿ]{2,}/.test(w)||/^[A-Z][a-z]{2,}/.test(w)?'\\text{'+w+'}':/^[A-Z]{2,}$/.test(w)?'\\mathrm{'+w+'}':w));
  return t.replace(/\\text\{([^}]*)\}(\s+)\\text\{/g,'\\text{$1$2');}
function strip(t){t=t.trim();if(t[0]==='('&&matchFwd(t,0)===t.length-1)return t.slice(1,-1);return t;}
function tex(expr){ // expression → latex (handles √ and / recursively)
  let out='',i=0;expr=expr.trim();
  // find top-level '/' (outside parentheses)
  let d=0,pos=-1;for(let k=0;k<expr.length;k++){const c=expr[k];if(c==='(')d++;else if(c===')')d--;else if(c==='/'&&!d){pos=k;break;}}
  if(pos>=0){const L=expr.slice(0,pos),R=expr.slice(pos+1);const ls=leftAtom(L,L.length),re=rightAtom(R,0);
    if(ls>=0&&re>0){return tex(L.slice(0,ls))+'\\frac{'+tex(strip(L.slice(ls)))+'}{'+tex(strip(R.slice(0,re)))+'}'+tex(R.slice(re));}
    return tex(L)+'/'+tex(R);}
  const r=expr.indexOf('√');
  if(r>=0){const a=expr.slice(0,r);let b=expr.slice(r+1);let inner,rest;
    if(b[0]==='('){const e=matchFwd(b,0);inner=b.slice(1,e);rest=b.slice(e+1);} else {const m=b.match(reRight);inner=m?m[0]:'';rest=b.slice(inner.length);}
    return tex(a)+'\\sqrt{'+tex(inner)+'}'+tex(rest);}
  return esc(expr);}
function wordy(x){x=x.replace(/^[a-zA-Z]['’]/,'');return /^[A-Za-zÀ-ÿ]{2,}$/.test(x)||/^[a-zà-ÿ]+$/.test(x)&&x.length>1;}
function mathy(x){x=x.trim();const y=x.replace(/^\(|\)$/g,'');return /[\d+\-−–×=*^√Σ²σμεΔ]/.test(y)||y.length<=2||/^[A-Z]{2,4}$/.test(y)||/^[A-Za-z]{1,2}\(/.test(y);}
function okPair(a,b,ctxL,ctxR){if(/^\./.test(a.trim())||/^\./.test(b.trim()))return false;
  if(!mathy(a)&&!mathy(b))return false;
  {const A=a.trim(),B=b.trim();if(/^\d+([.,]\d+)?$/.test(A)&&/^(10|20|100)$/.test(B)&&+A.replace(',','.')<=+B)return false;
   if(/^\s?(blocks?|blocs?|sessions?|séances?|done|faits?|questions?|cards?|cartes?|days?|jours?|correct|right|bonnes?|points?|pts|marks?)\b/i.test(ctxR))return false;}
  {const A=a.trim(),B=b.trim();if(/^\d+$/.test(A)&&/^\d+$/.test(B)){const x=+A,y=+B;
    if((x===0&&y===1)||(x+y===100&&x>0&&y>0&&A.length===2))return false;
    if(x<=31&&y>=1&&y<=12&&/(at|on|au|le|du|the|by|until|before|after|from|to|jusqu'au|avant|après)\s$/i.test(ctxL))return false;}}
  if(/[CT]-\s*$/.test(ctxL)||/(Directive|Regulation|Règlement|Dir\.|Reg\.|n°|No\.)\s*(\(\w+\)\s*)?$/i.test(ctxL)||/^(19|20)\d\d$/.test(a.trim()))return false;
  if(/(sessions?|séances?|weeks?|semaines?|class(es)?|cours|chapters?|chapitres?|parts?|parties|topics?)\s$/i.test(ctxL))return false;
  {const A=a.trim(),B=b.trim();if(/^[A-Z]\d$/.test(A)&&/^[A-Z]\d$/.test(B))return false;
   if(/^[a-zà-ÿ]{3,}$/.test(B)&&!/^\(/.test(A)&&/[A-Z]/.test(A))return false;
   if(/^[a-zà-ÿ]{3,}$/.test(A)&&/^\d/.test(B)&&/^\s?%/.test(ctxR))return false;}
  if(/^[A-Z][a-zà-ÿ]{2,}/.test(b.trim())&&!/^\(/.test(b.trim())&&!/=\s*$/.test(ctxL))return false;const k=(a+'/'+b).replace(/\s/g,'');if(SKIP.test(k))return false;
  const A=a.trim(),B=b.trim();
  if(/^[a-zà-ÿ]{2,}$/i.test(A)&&/^[a-zà-ÿ]{2,}$/i.test(B)&&!/^[A-Z]{2,}$/.test(A))return false; // and/or, read/write, Debit/credit
  const alpha=x=>/^[A-Za-zÀ-ÿ]+$/.test(x);
  if((wordy(A)&&alpha(B))||(wordy(B)&&alpha(A))){if(!(/=\s*$/.test(ctxL)||/^\s*=/.test(ctxR)||/[=]/.test(ctxL.slice(-4))))return false;}
  if(UNIT.test(B)&&!/^\(/.test(A)&&!/^\d/.test(A)&&/^[A-Za-zà-ÿ€$]{2,}$/.test(A))return false; // units/h, €/h
  if(UNIT.test(B)&&/^[\d.,  \u202f]+$/.test(A))return false; // 4/h written as rate
  if(/^\d{1,2}$/.test(A)&&/^\d{1,2}$/.test(B)&&+B<=31&&+A<=31&&+B>12)return false; // dates like 15/12 handled below
  return true;}
function convertText(s){ // returns array of {t} | {m}
  if(!/[\/√]/.test(s)||/https?:|www\./.test(s))return null;
  s=s.replace(/(\d) ?x ?(\d)/g,'$1×$2');
  if(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(s))return null; // dates
  if(/(^|[\s(])(A|L|E|R|SE|XA)\s?[+\-–−](?=[\s,;/)]|$)/.test(s)&&!/=/.test(s))return null; // journal entries (Dr / Cr)
  const out=[];let last=0,i=0,found=false;
  while(i<s.length){
    const c=s[i];
    if(c==='/'&&s[i+1]!=='/'&&s[i-1]!=='/'){
      const ls=leftAtom(s,i),re=rightAtom(s,i+1);
      if(ls>=last&&re>0){const A=s.slice(ls,i),B=s.slice(i+1,re);
        if(s[re]==='/'||(s[re]===' '&&s[re+1]==='/')||s[ls-1]==='/'){let z=re;while(/[\/ \d.,]/.test(s[z]||''))z++;i=z;continue;}
        const lw=/^[a-zà-ÿ]{2,}$/i.test(A.trim())&&/[a-zà-ÿ]{2,} $/i.test(s.slice(0,ls)),rw=/^[a-zà-ÿ]{2,}$/i.test(B.trim())&&/^ [a-zà-ÿ]{2,}/i.test(s.slice(re));
        if(!lw&&!rw&&A.trim()!=='Σ'&&B.trim()!=='Σ'&&okPair(A,B,s.slice(Math.max(0,ls-15),ls),s.slice(re,re+15))){let st=ls;// extend left over a preceding √
          out.push({t:s.slice(last,st)});out.push({m:tex(s.slice(st,re))});last=re;i=re;found=true;continue;}}}
    if(c==='√'){let e;if(s[i+1]==='('){e=matchFwd(s,i+1);e=e<0?-1:e+1;}else{const m=s.slice(i+1).match(reRight);e=m?i+1+m[0].length:-1;}
      if(e>0){let z=e;while(s[z]===' '&&s[z+1]==='/'){z=-1;break;}
        if(s[e]==='/'||(s[e]===' '&&s[e+1]==='/')){i++;continue;} // handled as fraction numerator
        out.push({t:s.slice(last,i)});out.push({m:tex(s.slice(i,e))});last=e;i=e;found=true;continue;}}
    i++;}
  if(!found)return null;out.push({t:s.slice(last)});return out;}
const SKIPTAG=/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE|SELECT|OPTION)$/;
function renderIn(root){
  if(!G.katex||!root)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||SKIPTAG.test(p.tagName)||p.closest('.katex,[contenteditable],.nomath,.kpi,.pill,.top,nav,.hero,.toast,.stat,h1,h2,.navi,.minbox,.bar,#mobnav,#drawer,.onb,.req,.chip,.chal'))return NodeFilter.FILTER_REJECT;return /[\/√]/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  for(const n of nodes){const parts=convertText(n.nodeValue);if(!parts)continue;
    const f=document.createDocumentFragment();
    for(const p of parts){if(p.t!=null){if(p.t)f.appendChild(document.createTextNode(p.t));}
      else{const sp=document.createElement('span');sp.setAttribute('data-notr','');sp.className='mth';try{G.katex.render(p.m,sp,{throwOnError:true,strict:false,output:'html'});}catch(e){sp.textContent='';sp.appendChild(document.createTextNode(p.src||''));continue;}f.appendChild(sp);}}
    n.parentNode.replaceChild(f,n);}
}
let busy=false,pend=new Set(),raf=0;
function flush(){raf=0;busy=true;try{for(const el of pend)if(el.isConnected)renderIn(el);}finally{pend.clear();busy=false;}}
function start(){renderIn(document.body);
  new MutationObserver(ms=>{if(busy)return;for(const m of ms){if(m.type==='characterData'){if(m.target.parentElement)pend.add(m.target.parentElement);}else m.addedNodes.forEach(n=>{if(n.nodeType===1)pend.add(n);else if(n.nodeType===3&&n.parentElement)pend.add(n.parentElement);});}
    if(pend.size&&!raf)raf=requestAnimationFrame(flush);}).observe(document.body,{childList:true,subtree:true,characterData:true});}
G.GrindMath={convertText,tex,renderIn};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();}
})(typeof window!=='undefined'?window:globalThis);
