/* ============ DONNÉES ============ */
const MC='https://mycourses.ieseg.fr/mod/';
const R=id=>MC+'resource/view.php?id='+id, Q=id=>MC+'quiz/view.php?id='+id, P=id=>MC+'page/view.php?id='+id, F=id=>MC+'folder/view.php?id='+id;

const EXAMS=[
 {id:'DI', name:'Digital Innovation', date:'2026-12-03', time:'10:45–12:15', need:14},
 {id:'AFA',name:'Advanced Financial Accounting', date:'2026-12-03', time:'14:00–15:30', need:20},
 {id:'MS', name:'Market Structures & Prices', date:'2026-12-08', time:'16:45–17:45', need:17},
 {id:'ECO',name:'Econometrics & Data Analysis', date:'2026-12-11', time:'14:00–15:30', need:18},
 {id:'ST', name:'Sales Techniques', date:'2026-12-11', time:'16:15–17:45', need:9},
 {id:'MM', name:'Marketing Management', date:'2026-12-15', time:'14:00–15:30', need:12},
 {id:'COST',name:'Cost Accounting', date:'2026-12-15', time:'16:15–17:45', need:16},
 {id:'OM', name:'Operations Management', date:'2026-12-16', time:'16:15–17:45', need:14},
 {id:'TL', name:'Trademark Law', date:'2026-12-17', time:'09:00–10:00', need:12},
];

/* Chapitres + ressources des profs (MyCourses, connecte-toi pour les ouvrir) */
const CH={
DI:[
 {t:'S1 · Processus, BPMN & 4 types d\'innovation',res:[['Slides S1',F(324646)]]},
 {t:'S2 · Systèmes d\'information & ERP',res:[['Slides S2',F(325908)]]},
 {t:'S3 · Défis ERP, business models digitaux, éthique',res:[['Slides S3',F(325956)]]},
 {t:'S4 · 4e révolution industrielle & Web3',res:[['Slides S4',F(327217)]]},
 {t:'S5 · Data, analytics & blockchain',res:[['Slides S5',F(327999)]]},
 {t:'S6 · Cloud computing & métiers du digital',res:[['Slides S6',F(328868)]]},
 {t:'S7 · Transformation digitale (cas UCB)',res:[['Slides S7',F(330012)]]},
 {t:'S8 · Cybersécurité (cours du 5 nov.)',res:[]},
 {t:'S9 · Enjeux légaux, sociaux, économiques (20 nov.)',res:[]},
 {t:'Révision globale · Practice MCQs',res:[['Practice MCQs (prof)',R(280791)],['Syllabus',R(280789)]]},
],
AFA:[
 {t:'Topic 1 · Accounting cycle',res:[['Slides',R(299560)],['Extra exercises',R(299571)],['Solution',R(304290)]]},
 {t:'Topic 2 · Operating transactions',res:[['Slides',R(299561)],['Extra exercises',R(305599)],['Solutions',R(305600)]]},
 {t:'Topic 3 · Investing (PPE & intangibles)',res:[['Slides',R(299562)],['Extra exercises',R(305602)],['Solution',R(305603)]]},
 {t:'Topic 4 · Financing decisions',res:[['Slides',R(327114)],['Solutions slides',R(299563)],['Extra exercises',R(299577)],['Solution',R(304293)]]},
 {t:'Q&A · Session d\'exercices',res:[['Exercices',R(299568)],['Solutions',R(305011)]]},
 {t:'Topic 5 · End-of-period adjustments',res:[['Slides',R(327122)],['Extra exercises',R(299580)]]},
 {t:'Topic 6 · Profit appropriation & dividends',res:[['Slides',R(327131)],['Extra exercises',R(299581)]]},
 {t:'Topic 7 · Cash flow statement',res:[['Slides',R(327132)],['Exercise 1',R(299583)],['Exercise 2',R(299585)]]},
 {t:'Topic 8 · Limites des états financiers',res:[['Slides',R(308043)]]},
],
MS:[
 {t:'Ch.1 · Market structures',res:[['Slides PDF',R(321306)],['Insights',R(321472)],['Exercises',R(321835)],['Solutions',R(321836)],['Additional + sol.',R(321842)],['QCM Basic',Q(321318)],['QCM Intermediate',Q(321319)]]},
 {t:'Ch.2 · Strategic interaction (2.1, 2.2, 2.4)',res:[['Slides PDF',R(321348)],['Insights',R(321473)],['Exercises 2.1',R(321838)],['Solutions',R(321837)],['Additional + sol.',R(321844)],['QCM Basic',Q(321320)],['QCM Intermediate',Q(321323)]]},
 {t:'Ch.2.3 · Sequential games',res:[['Exercise (main)',R(321620)],['Solution',R(321621)],['Cases',R(321363)],['Cases sol.',R(321875)],['Additional',R(321625)],['Add. sol.',R(321874)]]},
 {t:'Ch.3 · Profit max. (constant MC) & price discrimination',res:[['Slides PDF',R(321352)],['Insights',R(321474)],['Exercises',R(321839)],['Pizza challenge',R(321650)],['Additional',R(321846)],['Constant & increasing MC',R(321373)],['Sand economics',R(321596)],['QCM Basic',Q(321326)],['QCM Intermediate',Q(321327)]]},
 {t:'Ch.4 · Profit max. & market equilibrium',res:[['Slides PDF',R(321360)],['Insights',R(321480)],['Roadmap',R(322490)],['QCM Basic',Q(321877)],['QCM Intermediate',Q(321878)]]},
 {t:'Mock exam',res:[['Mock exam',R(321540)],['Structure',R(321626)]]},
],
ECO:[
 {t:'Ch.1 · Données & SPSS',res:[['Tutoriels SPSS',P(177536)]]},
 {t:'Ch.2 · Intervalles de confiance',res:[['Intervalle de confiance',P(177588)],['Tutoriel SPSS IC',P(177629)]]},
 {t:'Ch.3 · Tests d\'hypothèse',res:[['Global review on tests',P(180016)],['Tests on the mean',P(179987)],['Indépendance (khi²)',P(180019)],['Proportions',P(180020)]]},
 {t:'Régression 1–3 · Premier modèle, R²',res:[['1&2 Intro',P(180055)],['3 R² & erreur std',P(180232)]]},
 {t:'Régression 4–6 · Multiple, hypothèses LINE, significativité',res:[['4 R² ajusté',P(180265)],['5 LINE',P(180044)],['6 Significance',P(180186)]]},
 {t:'Régression 7–10 · Outliers, dummies, multicolinéarité, non linéaire',res:[['7 Outliers',P(180220)],['8 Dummies',P(180223)],['9 Multicollinearity',P(180318)],['10 Non linear',P(179315)]]},
 {t:'ACP · Analyse en composantes principales',res:[['Principal Component Analysis',P(191960)]]},
 {t:'Annales 2021–2023',res:[['2021 corrigé',R(199855)],['2022 questions',R(282155)],['2022 réponses',R(225895)],['2023 questions',R(282148)],['2023 corrigé',R(270655)]]},
 {t:'Annale 2025 + global review',res:[['Final 2025',R(312079)],['Global review',P(180320)],['How to prepare',F(193058)],['In-class exercises',F(324335)],['In-class reviews',F(324387)]]},
],
ST:[
 {t:'S1 · Rôle du vendeur moderne, B2B/B2C, buyer journey',res:[['What to expect',R(299774)],['Session 1',R(299775)]]},
 {t:'S2 · Prospecter & qualifier (openers, BANT)',res:[['Session 2',R(299777)]]},
 {t:'S3 · Découvrir les besoins (écoute active)',res:[['Session 3',R(299778)]]},
 {t:'S4 · SPIN Selling',res:[['Session 4',R(299779)]]},
 {t:'S5 · Pitch & storytelling (CAP)',res:[['Session 5',R(299780)]]},
 {t:'S6 · Objections (FFF), closing, BATNA/ZOPA',res:[['Session 6',R(299781)]]},
 {t:'S7 · Simulation finale & cas',res:[['Session 7',R(299782)],['B2B case Soleil du Nord',R(323904)],['B2C case Soleil du Nord',R(323905)],['Case Alpha Partner',R(331688)]]},
],
MM:[
 {t:'S1 · Intro to marketing',res:[['Slides S1 (dossier MM Slides)',F(181504)],['Handout S1',R(324241)]]},
 {t:'S2 · Market analysis (PESTEL, SWOT)',res:[['Slides S2 (dossier MM Slides)',F(181504)],['Handout S2',R(325408)]]},
 {t:'S3 · Segmentation, targeting, positioning',res:[['Slides S3 (dossier MM Slides)',F(181504)],['Handout S3',R(326617)]]},
 {t:'S4 · Products, services & branding',res:[['Slides S4 (dossier MM Slides)',F(181504)],['Handout S4',R(327294)]]},
 {t:'S5 · Price',res:[['Slides S5 (dossier MM Slides)',F(181504)],['Handout S5',R(328569)]]},
 {t:'S6 · Distribution',res:[['Slides S6 (dossier MM Slides)',F(181504)],['Handout S6',R(329576)]]},
 {t:'S7 · Communication',res:[['Slides S7 (dossier MM Slides)',F(181504)],['Handout S7',R(330800)]]},
],
COST:[
 {t:'S1 · Concepts de coûts',res:[['PPT',R(270582)],['PPT + sol.',R(270584)],['Handout',R(270583)],['Exercises',R(270580)],['Solutions',R(270579)]]},
 {t:'S2 · CVP, seuil de rentabilité, levier',res:[['PPT',R(270733)],['PPT + sol.',R(270735)],['Handout',R(180328)],['Exercises',R(270736)],['Solutions',R(270737)]]},
 {t:'S3 · Overhead, absorption, ABC, job order',res:[['PPT',R(180330)],['PPT + sol.',R(180331)],['Handout',R(180332)],['Exercises',R(180303)],['Solutions',R(180359)]]},
 {t:'S4 · COGM / COGS, taux par département',res:[['PPT',R(180334)],['PPT + sol.',R(180342)],['Handout',R(180336)],['Exercises',R(180360)],['Solutions',R(180361)]]},
 {t:'S5 · Coûts pertinents & décisions',res:[['PPT',R(180399)],['PPT + sol.',R(180306)],['Handout',R(180397)],['Exercises',R(180398)],['Solutions',R(270738)]]},
 {t:'S6 · Full costing (exercices)',res:[['Exercises',R(180307)],['Solutions',R(180357)],['Additional ex.',R(307564)]]},
],
OM:[
 {t:'Class 1 · Intro to OM',res:[['Slides',R(246586)],['At-home ex.',R(246588)]]},
 {t:'Class 2 · Facility location',res:[['Slides',R(246618)],['In-class ex.',R(184076)],['At-home ex.',R(180594)],['Break-even extra',R(210008)]]},
 {t:'Class 3 · Optimization & transportation',res:[['Slides',R(210047)],['In-class ex.',R(251867)],['At-home ex.',R(210048)]]},
 {t:'Class 4–5 · Capacity & Theory of Constraints',res:[['Slides C4',R(246925)],['TOC in-class',R(180607)],['TOC solution',R(180608)],['At-home ex.',R(180606)],['Slides C5',R(322323)]]},
 {t:'Class 6 · Inventory management (EOQ)',res:[['Slides',R(210050)],['At-home ex.',R(180616)],['EOQ in-class',R(180617)]]},
 {t:'Class 7 · Scheduling',res:[['Slides',R(254616)],['In-class ex.',R(299223)],['At-home ex.',R(210060)]]},
 {t:'Class 8–9 · Flexibility & OM challenges',res:[['Slides C8',R(330720)],['Slides C9',R(331513)]]},
 {t:'Practice exams & exemple de final',res:[['Practice C1–2',Q(271908)],['Practice C3–4',Q(251975)],['Practice C6–7',Q(273656)],['Example final',R(284749)],['Recap',R(191959)]]},
],
TL:[
 {t:'S1 · Droits de PI & autres signes distinctifs',res:[['Session 1',R(302890)],['Glossary',R(300330)]]},
 {t:'S2 · Catégories et fonctions de la marque',res:[['Session 2',R(304870)],['Case law list',R(300327)]]},
 {t:'S3 · Signe représentable',res:[['Session 3',R(304871)]]},
 {t:'S4 · Signe distinctif (motifs absolus)',res:[['Session 4',R(304872)]]},
 {t:'S5 · Signe disponible (motifs relatifs)',res:[['Session 5',R(306776)]]},
 {t:'S6 · Enregistrement et perte de la marque',res:[['Session 6',R(307808)]]},
 {t:'S8 · Utilité : licence, cession, contrefaçon',res:[['Session 8',R(308531)]]},
 {t:'Méthode du cas pratique',res:[['Case study methodology',R(313969)],['Fiche de cours',R(249704)]]},
],
};

const CH_EN={"DI": ["S1 · Processes, BPMN & 4 types of innovation", "S2 · Information systems & ERP", "S3 · ERP challenges, digital business models, ethics", "S4 · Fourth Industrial Revolution & Web3", "S5 · Data, analytics & blockchain", "S6 · Cloud computing & digital careers", "S7 · Digital transformation (UCB case)", "S8 · Cybersecurity (class on 5 Nov)", "S9 · Legal, social & economic issues (20 Nov)", "Global review · Practice MCQs"], "AFA": ["Topic 1 · Accounting cycle", "Topic 2 · Operating transactions", "Topic 3 · Investing (PPE & intangibles)", "Topic 4 · Financing decisions", "Q&A · Exercise session", "Topic 5 · End-of-period adjustments", "Topic 6 · Profit appropriation & dividends", "Topic 7 · Cash flow statement", "Topic 8 · Limitations of financial statements"], "MS": ["Ch.1 · Market structures", "Ch.2 · Strategic interaction (2.1, 2.2, 2.4)", "Ch.2.3 · Sequential games", "Ch.3 · Profit max. (constant MC) & price discrimination", "Ch.4 · Profit max. & market equilibrium", "Mock exam"], "LV": ["Tema 7 · De compras", "Tema 8 · Otras épocas (imperfecto)", "Repaso · Productos de ayer y hoy (indefinido)", "Repaso general"], "ECO": ["Ch.1 · Data & SPSS", "Ch.2 · Confidence intervals", "Ch.3 · Hypothesis tests", "Regression 1–3 · First model, R²", "Regression 4–6 · Multiple, LINE assumptions, significance", "Regression 7–10 · Outliers, dummies, multicollinearity, non-linear", "PCA · Principal component analysis", "Past exams 2021–2023", "2025 exam + global review"], "ST": ["S1 · Modern salesperson, B2B/B2C, buyer journey", "S2 · Prospecting & qualifying (openers, BANT)", "S3 · Discovering needs (active listening)", "S4 · SPIN Selling", "S5 · Pitching & storytelling (CAP)", "S6 · Objections (FFF), closing, BATNA/ZOPA", "S7 · Final simulation & cases"], "MM": ["S1 · Introduction to marketing", "S2 · Market analysis (PESTEL, SWOT)", "S3 · Segmentation, targeting, positioning", "S4 · Products, services & branding", "S5 · Price", "S6 · Distribution", "S7 · Communication"], "COST": ["S1 · Cost terms and concepts", "S2 · CVP analysis, break-even, leverage", "S3 · Overheads, full costing, inventories", "S4 · COGM / COGS, departmental rates", "S5 · Relevant costs & decisions", "S6 · Full costing (exercises)"], "OM": ["Class 1 · Intro to OM", "Class 2 · Facility location", "Class 3 · Optimization & transportation", "Class 4–5 · Capacity & Theory of Constraints", "Class 6 · Inventory management (EOQ)", "Class 7 · Scheduling", "Class 8–9 · Flexibility & OM challenges", "Practice exams & example final"], "TL": ["S1 · IP rights & other distinctive signs", "S2 · Categories and functions of trademarks", "S3 · Sign capable of representation", "S4 · Distinctive sign (absolute grounds)", "S5 · Available sign (relative grounds)", "S6 · Registration and loss of the trademark", "S8 · Usefulness: licence, assignment, infringement", "Case study methodology"], "GT": ["Grand Test · content to be confirmed"]};
for(const k in CH_EN) CH_EN[k].forEach((t,i)=>{if(CH[k]&&CH[k][i]) CH[k][i].t=t;});

const CONTENT=window.CONTENT=window.CONTENT||{};
const TT={};
const DAILY={};
/* ============ PLANNING ============ */
const START='2026-11-02', END='2026-12-16';
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
window.DOW_REF=DOW;window.MON_REF=MONTHS;
const d2s=d=>d.toISOString().slice(0,10);
const s2d=s=>new Date(s+'T12:00:00Z');
const addD=(s,n)=>{const d=s2d(s);d.setUTCDate(d.getUTCDate()+n);return d2s(d)};
const diff=(a,b)=>Math.round((s2d(b)-s2d(a))/864e5);
const fmt=s=>{const d=s2d(s);return DOW[d.getUTCDay()]+' '+d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]};
const todayStr=()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')};
const EX=Object.fromEntries(EXAMS.map(e=>[e.id,e]));
const COL={DI:'#6366f1',AFA:'#0ea5e9',GT:'#64748b',MS:'#f59e0b',LV:'#ef4444',ECO:'#10b981',ST:'#ec4899',MM:'#8b5cf6',COST:'#14b8a6',OM:'#f97316',TL:'#a16207'};

function store(k,v){const SPX=window.__SP||'rev_';try{if(v===undefined)return JSON.parse(localStorage.getItem(SPX+k));localStorage.setItem(SPX+k,JSON.stringify(v))}catch(e){return null}}
let done=store('done')||{}; let off=store('off')||{}; let qstats=store('qstats')||{};

function blocsFor(day){
  if(day===START) return 2;            // ce soir : on démarre doucement
  const dow=s2d(day).getUTCDay();
  const examDay=EXAMS.some(e=>e.date===day);
  if(day>='2026-12-02'){ return examDay?3:(dow===0?6:5); } // période d'examens : plus de temps libre
  if(dow===6) return 2;
  if(dow===0) return 5;
  return 3;                            // lun–ven : 3 blocs de 25 min (1h30)
}

function buildPlan(){
  const need={}, used={};
  EXAMS.forEach(e=>{need[e.id]=e.need;used[e.id]=0});
  const plan=[];
  for(let day=START; day<=END; day=addD(day,1)){
    const exams=EXAMS.filter(e=>e.date===day);
    if(off[day]){plan.push({day,off:true,blocs:[],exams});continue;}
    const n=blocsFor(day); const blocs=[]; const cnt={};
    // matières dont l'examen est le lendemain (ou le surlendemain si le lendemain est un dimanche)
    const tomorrow=EXAMS.filter(e=>diff(day,e.date)===1);
    for(let k=0;k<n;k++){
      let pick=null;
      const EVECAP={GT:2,LV:3};
      const eveCap=tomorrow.reduce((s,e)=>s+(EVECAP[e.id]||99),0);
      if(day===START){ pick='DI'; }
      else if(tomorrow.length && k<eveCap){ pick=tomorrow[k%tomorrow.length].id; }
      else{
        let best=-1;
        for(const e of EXAMS){
          const dl=diff(day,e.date); if(dl<=0) continue;
          const rem=Math.max(0,e.need-used[e.id]);
          let sc=(rem+0.3)/Math.pow(dl+1,0.85);
          if((cnt[e.id]||0)>=2) sc*=0.05;
          if(e.date===day) sc=0;
          if(sc>best){best=sc;pick=e.id;}
        }
      }
      if(!pick) break;
      cnt[pick]=(cnt[pick]||0)+1;
      const i=used[pick]++; const e=EX[pick]; const chs=CH[pick];
      const nAnn=Math.max(1,Math.round(e.need*0.25));
      let ch, act, blocsChi=null;
      if(diff(day,e.date)===1){ ch=chs[chs.length-1]; act=k%2===0?'Final review: flashcards + full MCQ':'Final review: redo missed exercises'; }
      else if(i>=e.need-nAnn){ ch=chs[(i)%chs.length]; act='Past exams / global review'; }
      else{ const L=Math.max(1,e.need-nAnn), Pn=Math.ceil(L/2), k2=Math.floor(i/2), n=chs.length;
        const a=Math.min(n-1,Math.floor(k2*n/Pn)), z=Math.max(a,Math.min(n-1,Math.floor((k2+1)*n/Pn)-1));
        ch=a===z?chs[a]:{t:chs.slice(a,z+1).map(c=>c.t).join(' / ')};
        const rep=k2>0&&Math.min(n-1,Math.floor((k2-1)*n/Pn))===a&&a===z;
        blocsChi=a; act=rep?(i%2===0?'Review: notes + flashcards (2nd pass)':'Review: redo missed MCQs and exercises'):(i%2===0?'Learn: notes + flashcards':'Practise: MCQ + solved exercises'); }
      blocs.push({s:pick,ch:ch.t,chi:blocsChi!==null?blocsChi:chs.indexOf(ch),act,key:day+'|'+pick+'|'+k});
    }
    plan.push({day,blocs,exams});
  }
  return plan;
}


/* ============ GRADING (weights from syllabi / course slides; uc = unconfirmed) ============ */
const GRADING={
 DI:[{n:'Poster presentation',w:25},{n:'Mid-term exam',w:30,mid:1},{n:'Final exam',w:45,fin:1}],
 AFA:[{n:'Mid-term exam',w:30,mid:1,uc:1},{n:'Capstone / participation',w:20,uc:1},{n:'Final exam',w:50,fin:1,uc:1}],
 MS:[{n:'Mid-term exam',w:30,mid:1,uc:1},{n:'Participation / online MCQs',w:20,uc:1},{n:'Final exam',w:50,fin:1,uc:1}],
 ECO:[{n:'Mid-term exam',w:30,mid:1,uc:1},{n:'Capstone project / homework',w:20,uc:1},{n:'Final exam',w:50,fin:1,uc:1}],
 ST:[{n:'Presence',w:5},{n:'Squad work',w:20},{n:'Final AI simulation',w:25},{n:'Written exam',w:50,fin:1}],
 MM:[{n:'Participation',w:10},{n:'Continuous assessment (capstone)',w:40},{n:'Final exam',w:50,fin:1}],
 COST:[{n:'Mid-term MCQ',w:30,mid:1},{n:'Final exam',w:70,fin:1}],
 OM:[{n:'Mid-term exam',w:20,mid:1},{n:'Continuous assessment',w:10},{n:'Tutorial (beer game)',w:10},{n:'Final exam',w:60,fin:1}],
 TL:[{n:'Participation',w:10},{n:'Case study',w:25},{n:'Multiple choice questions',w:25},{n:'End of term exam (1 h)',w:40,fin:1}],
};
