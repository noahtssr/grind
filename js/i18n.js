/* Grind · interface language (English / Français). Course content is never translated here. */
(function(){
  let L=null;try{L=localStorage.getItem('grind_ui');}catch(e){}
  if(L!=='en'&&L!=='fr')L=((navigator.language||'').toLowerCase().startsWith('fr'))?'fr':'en';
  const FR=window.GRIND_FR||{}, RX=window.GRIND_FR_RX||[];
  const SKIP='.note,.notes,.flash,.opt,.explain,.sumb,.mq,.qtext,.cardq,.nm,input,textarea,script,style,[data-notr]';
  const DOW_EN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON_EN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DOW_FR=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'],MON_FR=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  function tr(s){const k=s.replace(/\s+/g,' ').trim();if(!k)return null;
    if(Object.prototype.hasOwnProperty.call(FR,k))return s.replace(s.trim(),FR[k]);
    for(const [rx,f] of RX){const m=k.match(rx);if(m)return s.replace(s.trim(),typeof f==='function'?f.apply(null,m):k.replace(rx,f));}
    return null;}
  function node(n){if(n.nodeType===3){const p=n.parentElement;if(!p||p.closest(SKIP))return;if(n.__fr===n.nodeValue)return;const t=tr(n.nodeValue);if(t!=null&&t!==n.nodeValue){n.__en=n.nodeValue;n.nodeValue=t;n.__fr=t;}return;}
    if(n.nodeType!==1)return;if(n.matches&&n.matches('script,style'))return;
    attrs(n);n.querySelectorAll&&n.querySelectorAll('[placeholder],[title],[aria-label]').forEach(attrs);
    walk(n);}
  function attrs(n){['placeholder','title','aria-label'].forEach(a=>{const v=n.getAttribute&&n.getAttribute(a);if(v&&!n.closest('[data-notr]')){const t=tr(v);if(t!=null&&t!==v)n.setAttribute(a,t);}});}
  function walk(n){if(n.nodeType===3){node(n);return;}if(n.nodeType!==1||n.matches('script,style'))return;if(n.closest(SKIP))return;for(const c of n.childNodes)walk(c);}
  function run(root){if(L!=='fr')return;node(root||document.body);if(document.title&&FR[document.title])document.title=FR[document.title];}
  function dates(){if(!window.DOW_REF)return;const d=L==='fr'?DOW_FR:DOW_EN,m=L==='fr'?MON_FR:MON_EN;window.DOW_REF.splice(0,7,...d);window.MON_REF.splice(0,12,...m);}
  let mo=null;
  function observe(){if(mo)return;mo=new MutationObserver(ms=>{if(L!=='fr')return;for(const m of ms){if(m.type==='characterData')node(m.target);else if(m.type==='attributes')attrs(m.target);else m.addedNodes.forEach(n=>node(n));}});mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']});}
  window.UI_LANG=()=>L;
  window.t=s=>{if(L!=='fr')return s;const r=tr(s);return r==null?s:r;};
  window.setUILang=v=>{L=v==='fr'?'fr':'en';try{localStorage.setItem('grind_ui',L);}catch(e){}document.documentElement.lang=L;dates();if(L==='fr')run();};
  window.i18nInit=()=>{document.documentElement.lang=L;dates();observe();run();};
  window.i18nRun=run;
})();
