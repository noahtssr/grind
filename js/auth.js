/* Grind · accounts (Supabase Auth) and app boot */
(function(){
const SB_URL='https://qnvtlyxlwhjulgrufpap.supabase.co', SB_KEY='sb_publishable_WJy5It_8UZunYWQwRWyiWQ_vVsTfF0X';
const BUILD=window.GRIND_BUILD||'1';
const SITE=location.origin+location.pathname;
const recovering=/type=recovery/.test(location.hash);
const confirmed=/type=(signup|email)/.test(location.hash);
const linkError=(location.hash.match(/error_description=([^&]+)/)||[])[1];
const sb=window.SB=window.GRIND_TEST?window.GRIND_TEST.sb:supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
const A=document.getElementById('auth');
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LOGO='<svg width="56" height="56" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#7c5cff"/><path d="M21.6 10.2A8 8 0 1 0 24 16h-7" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.5 3.8l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff"/></svg>';
let booted=false,mode='login',msg='',emailKeep='',pwKeep='',pollT=null;
function errText(e){const m=(e&&e.message)||String(e||'');
  if(/invalid login credentials/i.test(m))return 'Wrong email or password.';
  if(/email not confirmed/i.test(m))return 'NOTCONFIRMED';
  if(/database error saving new user|reserved for @ieseg/i.test(m))return 'Grind is reserved for @ieseg.fr email addresses.';
  if(/already registered|already been registered|user already exists/i.test(m))return 'An account already exists with this email. Log in, or reset your password.';
  if(/rate limit|too many/i.test(m))return 'Too many attempts. Wait a few minutes and try again.';
  if(/password should be at least|weak password/i.test(m))return 'Choose a stronger password (at least 8 characters).';
  if(/failed to fetch|network/i.test(m))return 'No connection. Check your internet and try again.';
  return m||'Something went wrong. Try again.';}
const langSw=()=>`<div class="seg authseg" role="group" aria-label="Site language"><button class="${UI_LANG()==='en'?'on':''}" data-ui="en">English</button><button class="${UI_LANG()==='fr'?'on':''}" data-ui="fr">Français</button></div>`;
function shell(inner){A.innerHTML=`<div class="onb authbg">${langSw()}<div class="onbbox"><div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">${LOGO}<div><div class="authw">Grind<span>.</span></div><div class="small mut">S3 finals · Dec 2026</div></div></div>${inner}</div></div>`;
  A.querySelectorAll('[data-ui]').forEach(b=>b.onclick=()=>{setUILang(b.dataset.ui);draw();});
  A.querySelectorAll('[data-mode]').forEach(b=>b.onclick=e=>{e.preventDefault();mode=b.dataset.mode;msg='';draw();});
  const f=A.querySelector('input');if(f&&!f.value)setTimeout(()=>f.focus(),30);}
const field=(id,label,type,ac,ph,val)=>`<label class="fl">${label}<input id="${id}" type="${type}" autocomplete="${ac}" ${ph?`placeholder="${ph}"`:''} value="${esc(val||'')}"></label>`;
function busy(btn,on,label){btn.disabled=on;if(on){btn.dataset.l=btn.textContent;btn.textContent=label||'…';}else if(btn.dataset.l)btn.textContent=btn.dataset.l;}
function enter(ids,btn){ids.forEach(i=>{const el=document.getElementById(i);if(el)el.onkeydown=e=>{if(e.key==='Enter')btn.click();};});}
function draw(){
  if(mode==='login'){shell(`<h1>Log in</h1><p class="mut" style="margin-top:-2px">Your revision space for the IÉSEG Bachelor S3 finals.</p>
    ${field('ae','School email','email','username','firstname.lastname@ieseg.fr',emailKeep)}${field('ap','Password','password','current-password','')}
    <div id="aerr" class="oerr">${msg==='NOTCONFIRMED'?'':esc(msg)}</div>${msg==='NOTCONFIRMED'?`<div class="tipnote small">Confirm your email first: open the link we sent you. <a href="#" id="resend">Send the link again</a></div>`:''}
    <div class="onbfoot" style="align-items:center"><a href="#" data-mode="forgot" class="small">Forgot your password?</a><button class="btn pri big" id="ago">Log in</button></div>
    <div class="authalt"><span class="mut">New on Grind?</span> <a href="#" data-mode="signup">Create an account</a></div><div class="authfoot"><a href="#" data-privacy>Privacy</a> · <span>A student project, not an official IÉSEG service.</span></div>`);
    const b=document.getElementById('ago');enter(['ae','ap'],b);
    const rs=document.getElementById('resend');if(rs)rs.onclick=async e=>{e.preventDefault();const {error}=await sb.auth.resend({type:'signup',email:emailKeep,options:{emailRedirectTo:SITE}});msg='';draw();document.getElementById('aerr').textContent=error?errText(error):t('Link sent: check your inbox (and spam).');};
    b.onclick=async()=>{const e=document.getElementById('ae').value.trim().toLowerCase(),p=document.getElementById('ap').value,er=document.getElementById('aerr');emailKeep=e;
      if(!e||!p){er.textContent=t('Enter your email and password.');return;}
      busy(b,true,t('Logging in…'));const {data,error}=await sb.auth.signInWithPassword({email:e,password:p});busy(b,false);
      if(error){msg=errText(error);draw();return;}boot(data.session);};}
  else if(mode==='signup'){shell(`<h1>Create your account</h1><p class="mut" style="margin-top:-2px">Reserved for IÉSEG students: use your <b>@ieseg.fr</b> address.</p>
    <div class="g g2" style="gap:0 12px">${field('sf','First name','text','given-name','')}${field('sl','Last name','text','family-name','')}</div>
    ${field('se','School email','email','email','firstname.lastname@ieseg.fr',emailKeep)}${field('sp','Password','password','new-password','At least 8 characters')}${field('sp2','Confirm password','password','new-password','')}
    <p class="small mut" style="margin:10px 0 0">On the leaderboard, only your first name and initial are shown (e.g. Noah.T). By creating an account you accept the <a href="#" data-privacy>privacy notice</a>.</p>
    <div id="aerr" class="oerr">${esc(msg)}</div>
    <div class="onbfoot" style="align-items:center"><a href="#" data-mode="login" class="small">← I already have an account</a><button class="btn pri big" id="sgo">Create my account</button></div>`);
    const b=document.getElementById('sgo');enter(['sf','sl','se','sp','sp2'],b);
    b.onclick=async()=>{const f=document.getElementById('sf').value.trim(),l=document.getElementById('sl').value.trim(),e=document.getElementById('se').value.trim().toLowerCase(),p=document.getElementById('sp').value,p2=document.getElementById('sp2').value,er=document.getElementById('aerr');emailKeep=e;
      if(!f||!l){er.textContent=t('Enter your first and last name.');return;}
      if(!/^[^@\s]+@ieseg\.fr$/.test(e)){er.textContent=t('Grind is reserved for @ieseg.fr email addresses.');return;}
      if(p.length<8){er.textContent=t('Choose a stronger password (at least 8 characters).');return;}
      if(p!==p2){er.textContent=t('The two passwords don\'t match.');return;}
      pwKeep=p;busy(b,true,t('Creating…'));const {data,error}=await sb.auth.signUp({email:e,password:p,options:{data:{first:f,last:l},emailRedirectTo:SITE}});busy(b,false);
      if(error){msg=errText(error);draw();return;}
      if(data.session){boot(data.session);return;}
      if(data.user&&Array.isArray(data.user.identities)&&!data.user.identities.length){msg=errText('already registered');draw();return;}
      mode='checkmail';msg='';draw();};}
  else if(mode==='checkmail'){shell(`<h1>Check your inbox 📬</h1><p>We sent a confirmation link to <b>${esc(emailKeep)}</b>. Open it to activate your account.</p><p class="small mut">⏳ This page logs you in automatically as soon as your account is activated: keep it open. If nothing happens, try logging in: your account may already be active.</p><div class="tipnote small">📥 <b>Not in your inbox?</b> Look in <b>Junk Email / Spam</b>: the first email from Grind often lands there.<br>⏱ It can take up to 10 minutes to arrive.</div><div id="aerr" class="oerr"></div>
    <div class="onbfoot" style="align-items:center"><a href="#" id="resend" class="small">Send the link again</a><button class="btn pri big" data-mode="login">Back to log in</button></div>${window.GRIND_DEMO?`<div class="demobox"><div class="small"><b>Aperçu :</b> in the real site, the student receives an email here. Click to simulate opening it.</div><button class="btn pri" id="demoopen">📧 Open the confirmation email</button></div>`:''}`);
    {const d=document.getElementById('demoopen');if(d)d.onclick=()=>{const s=window.GRIND_DEMO.confirm(emailKeep);if(s){history.replaceState(null,'',location.pathname);boot(s);setTimeout(()=>window.toast&&toast(t('✓ Email confirmed: welcome to Grind!')),1500);}};}
    if(pwKeep&&!pollT){let n=0;const tick=async()=>{pollT=null;if(booted||mode!=='checkmail'||!pwKeep)return;n++;
      try{const {data}=await sb.auth.signInWithPassword({email:emailKeep,password:pwKeep});if(data&&data.session){pwKeep='';window.__toastAfterBoot='✓ Email confirmed: welcome to Grind!';boot(data.session);return;}}catch(x){}
      if(n<60)pollT=setTimeout(tick,n<15?4000:10000);};pollT=setTimeout(tick,3000);}
    document.getElementById('resend').onclick=async e=>{e.preventDefault();const {error}=await sb.auth.resend({type:'signup',email:emailKeep,options:{emailRedirectTo:SITE}});document.getElementById('aerr').textContent=error?t(errText(error)):t('Link sent: check your inbox (and spam).');};}
  else if(mode==='forgot'){shell(`<h1>Forgot your password?</h1><p class="mut" style="margin-top:-2px">Enter your school email: we'll send you a link to choose a new password.</p>
    ${field('fe','School email','email','username','firstname.lastname@ieseg.fr',emailKeep)}<div id="aerr" class="oerr">${esc(msg)}</div>
    <div class="onbfoot" style="align-items:center"><a href="#" data-mode="login" class="small">← Back to log in</a><button class="btn pri big" id="fgo">Send the link</button></div>`);
    const b=document.getElementById('fgo');enter(['fe'],b);
    b.onclick=async()=>{const e=document.getElementById('fe').value.trim().toLowerCase(),er=document.getElementById('aerr');emailKeep=e;
      if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)){er.textContent=t('Enter a valid email address.');return;}
      busy(b,true,t('Sending…'));const {error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:SITE});busy(b,false);
      if(error){msg=errText(error);draw();return;}mode='forgotsent';draw();};}
  else if(mode==='forgotsent'){shell(`<h1>Check your inbox 📬</h1><p>If an account exists for <b>${esc(emailKeep)}</b>, you'll receive a link to choose a new password.</p><p class="small mut">The link is valid for 1 hour. Look in your spam folder if needed.</p><div class="onbfoot"><button class="btn pri big" data-mode="login">Back to log in</button></div>${window.GRIND_DEMO?`<div class="demobox"><div class="small"><b>Aperçu :</b> in the real site, the student receives a link by email. Click to simulate opening it.</div><button class="btn pri" id="demoreset">📧 Open the reset email</button></div>`:''}`);
    {const d=document.getElementById('demoreset');if(d)d.onclick=()=>{if(window.GRIND_DEMO.recover(emailKeep)){mode='recovery';msg='';draw();}else{mode='login';msg=t('No account with this email in the preview: create one first.');draw();}};}}
  else if(mode==='recovery'){shell(`<h1>Choose a new password</h1>${field('rp','New password','password','new-password','At least 8 characters')}${field('rp2','Confirm password','password','new-password','')}<div id="aerr" class="oerr">${esc(msg)}</div><div class="onbfoot"><button class="btn pri big" id="rgo">Save and continue</button></div>`);
    const b=document.getElementById('rgo');enter(['rp','rp2'],b);
    b.onclick=async()=>{const p=document.getElementById('rp').value,p2=document.getElementById('rp2').value,er=document.getElementById('aerr');
      if(p.length<8){er.textContent=t('Choose a stronger password (at least 8 characters).');return;}if(p!==p2){er.textContent=t('The two passwords don\'t match.');return;}
      busy(b,true,t('Saving…'));const {error}=await sb.auth.updateUser({password:p});busy(b,false);if(error){msg=errText(error);draw();return;}
      const {data}=await sb.auth.getSession();window.__toastAfterBoot='🔑 Password updated';boot(data.session);};}
  else if(mode==='loading'){A.innerHTML=`<div class="onb authbg"><div style="text-align:center;color:#fff">${LOGO}<p style="margin-top:14px;opacity:.85">${esc(t(msg||'Loading your space…'))}</p></div></div>`;}
}
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src+(src.includes('?')?'&':'?')+'v='+BUILD;s.onload=res;s.onerror=()=>rej(new Error('load '+src));document.body.appendChild(s);});}
async function decryptContent(keyB64){
  const r=await fetch('content.enc?v='+BUILD);if(!r.ok)throw new Error('content');const b64=(await r.text()).trim();
  const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(keyB64),c=>c.charCodeAt(0)),'AES-GCM',false,['decrypt']);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)},key,raw.slice(12));return new TextDecoder().decode(pt);}
async function boot(session){
  if(booted||!session)return;booted=true;mode='loading';msg='Loading your space…';draw();
  try{
    const u=session.user;window.ME_ID=u.id;window.ME_EMAIL=u.email;const SP=window.__SP='g_'+u.id+'_';
    const [st,sec]=await Promise.all([sb.from('user_state').select('data,updated_at').eq('user_id',u.id).maybeSingle(),sb.from('app_secret').select('value').eq('name','content_key').maybeSingle()]);
    if(sec.error||!sec.data)throw new Error('secret');
    const localAt=+(localStorage.getItem(SP+'_at')||0);
    if(st.data&&st.data.data&&+st.data.updated_at>localAt){Object.entries(st.data.data).forEach(([k,v])=>{try{localStorage.setItem(SP+k,JSON.stringify(v));}catch(e){}});localStorage.setItem(SP+'_at',String(st.data.updated_at));}
    let P=null;try{P=JSON.parse(localStorage.getItem(SP+'profile'));}catch(e){}
    const md=u.user_metadata||{};if(!P&&md.first){localStorage.setItem(SP+'profile',JSON.stringify({first:md.first,last:md.last||''}));}
    const txt=await decryptContent(sec.data.value);const s=document.createElement('script');s.textContent=txt;document.head.appendChild(s);
    await loadScript('js/core.js');setUILang(UI_LANG());await loadScript('js/chart.umd.js').catch(()=>{});
    A.innerHTML='';document.querySelector('.layout').hidden=false;
    await loadScript('js/app.js');
    if(confirmed&&window.toast)setTimeout(()=>toast(t('✓ Email confirmed: welcome to Grind!')),400);
    if(window.__toastAfterBoot&&window.toast)setTimeout(()=>toast(t(window.__toastAfterBoot)),400);
  }catch(e){booted=false;mode='loading';msg='';A.innerHTML=`<div class="onb authbg"><div class="onbbox"><h1>${esc(t('Couldn\'t load Grind'))}</h1><p class="mut">${esc(t('Check your connection, then reload the page.'))}</p><div class="onbfoot"><button class="btn" id="lo">${esc(t('Log out'))}</button><button class="btn pri big" onclick="location.reload()">${esc(t('Reload'))}</button></div></div></div>`;document.getElementById('lo').onclick=async()=>{await sb.auth.signOut();location.reload();};console.error(e);}
}
window.GRIND_BOOT=boot;
function openPrivacy(){let ov=document.getElementById('privov');if(ov)ov.remove();ov=document.createElement('div');ov.id='privov';ov.className='privov';
  ov.innerHTML=`<div class="privbox"><button class="xbtn privx" aria-label="Close">✕</button><iframe src="privacy.html?embed=1" title="Privacy"></iframe></div>`;
  document.body.appendChild(ov);const close=()=>ov.remove();ov.querySelector('.privx').onclick=close;ov.onclick=e=>{if(e.target===ov)close();};
  document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k);}});}
window.openPrivacy=openPrivacy;
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-privacy]');if(!a)return;e.preventDefault();openPrivacy();});
i18nInit();
sb.auth.onAuthStateChange((ev,session)=>{if(ev==='PASSWORD_RECOVERY'){mode='recovery';msg='';draw();}});
(async()=>{mode='loading';msg='Loading…';draw();
  const {data}=await sb.auth.getSession();
  if(recovering){if(mode!=='recovery'){mode='recovery';draw();}return;}
  if(data&&data.session){boot(data.session);return;}
  mode='login';if(/deleted/.test(location.hash)){msg=t('Your account and all your data have been deleted.');history.replaceState(null,'',location.pathname);draw();return;}msg=linkError?decodeURIComponent(linkError.replace(/\+/g,' ')):'';if(/expired|invalid/i.test(msg))msg=t('This link has already been used or has expired. Try logging in: your account is probably already active. Otherwise, ask for a new link.');draw();})();
})();
