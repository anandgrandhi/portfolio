
/* Original portfolio motion implementation; architecture inspired by the supplied AI Journey archive. */
const references={};
const dailyDigestVisual='<div class="dd-composition"><img class="dd-flow" src="assets/daily-digest/product-flow.webp" alt="Daily Digest product flow"><img class="dd-reminder" src="assets/daily-digest/reminder.webp" alt="Reminder and Tip of the Day product experience"></div>';
const featuredIds=[0,1,2,3,4];
let portfolioData=null, visualMode='auto', visualIndex=-1, caseOpener=null, pageIndex=0, pageCount=0, viewerRAF=0;
const clamp01=x=>Math.max(0,Math.min(1,x));
function referenceMarkup(id){
 const r=references[id];if(!r)return '';
 return '<div class="reference-photos '+(r.images.length>1?'pair':'')+'">'+r.images.map(src=>'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(src)+'" alt="'+esc(r.caption)+'">').join('')+'</div><div class="reference-credit"><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.caption)+'</a></div>';
}
function bindImageFallbacks(root){root.querySelectorAll('img').forEach(img=>{const fail=()=>{img.style.display='none';const group=img.closest('.reference-photos');if(group&&[...group.querySelectorAll('img')].every(x=>x.style.display==='none'))group.innerHTML='<p style="font-size:13px;color:#6f6f6f;padding:20px;text-align:center">Reference image unavailable. Open the source link below.</p>'};img.addEventListener('error',fail,{once:true});if(img.complete&&!img.naturalWidth)fail()})}
function paintVisual(i,force=false){
 if(i===visualIndex&&!force)return;
 visualIndex=i;
 const canvas=$('#canvas'),id=featuredIds[i],p=featured[i];if(!p)return;
 const mode=!references[id]?'illustration':visualMode==='auto'?([0,5].includes(id)?'reference':'illustration'):visualMode;
 canvas.querySelectorAll('.reference-scene').forEach(el=>{el.classList.add('outgoing');setTimeout(()=>el.remove(),500)});
 canvas.querySelectorAll('svg:not(.outgoing)').forEach(el=>{el.style.opacity=mode==='reference'?'0':'1'});
 if(mode==='reference'&&references[id]){
   const layer=document.createElement('div');layer.className='reference-scene';layer.innerHTML=referenceMarkup(id);canvas.append(layer);bindImageFallbacks(layer);requestAnimationFrame(()=>requestAnimationFrame(()=>layer.classList.add('ready')));
 }
 $('#visualIllustration')?.setAttribute('aria-pressed',String(mode==='illustration'));
 $('#visualReference')?.setAttribute('aria-pressed',String(mode==='reference'));if($('#visualReference'))$('#visualReference').disabled=!references[id];
}
const athenaVisual='<div class="athena-composition"><img class="athena-wheel" src="assets/athena/ecosystem.webp" alt="Athena counselling ecosystem"><img class="athena-phone" src="assets/athena/dashboard.webp" alt="Arete dashboard"></div>';
const whiteTableVisual='<div class="wt-composition"><img class="wt-architecture" src="assets/whitetable/architecture.webp" alt="GrowthOS orchestration and data flow"><img class="wt-assistant" src="assets/whitetable/assistant.webp" alt="WhiteTable Intelligence interface with internal details masked"></div>';
const byjusVisual='<div class="byjus-composition"><img class="byjus-mobile" src="assets/byjus/mobile-journeys.webp" alt="BYJU’S learning journeys"><img class="byjus-graph" src="assets/byjus/knowledge-graph.webp" alt="Knowledge graph concept visual"><img class="byjus-tablet" src="assets/byjus/interactive-light.webp" alt="Interactive light reflection activity"></div>';
const emotoradVisual="<div class=\"em-workflows\"><div><img referrerpolicy=\"no-referrer\" src=\"https://miro.medium.com/v2/resize%3Afit%3A1400/1%2APC7cYhrIRZ1DkdGVDLUZAg.png\" alt=\"HR onboarding example\"></div><div><img referrerpolicy=\"no-referrer\" src=\"https://learnn8nautomation.com/images/rag.png\" alt=\"Document retrieval example\"></div><div><img referrerpolicy=\"no-referrer\" src=\"https://n8niostorageaccount.blob.core.windows.net/n8nio-strapi-blobs-prod/assets/image_6d2f4eb981.png\" alt=\"Task email alert example\"></div><span>Workflow examples</span></div>";
function installDailyDigestVisual(i){
 const canvas=$('#canvas');
 if(!canvas.querySelector('.project-photo-layer')){
  featured.forEach((p,n)=>{
   const layer=document.createElement('div');layer.className='project-photo-layer';layer.dataset.visualIndex=String(n);
   if(n<=4)layer.innerHTML=[dailyDigestVisual,athenaVisual,whiteTableVisual,byjusVisual,emotoradVisual][n];
   else layer.classList.add('project-photo-pending');
   layer.querySelectorAll('img').forEach(img=>{img.loading='eager';img.decoding='async'});
   canvas.append(layer);
  });
 }
 canvas.querySelectorAll('.project-photo-layer').forEach(el=>{const selected=Number(el.dataset.visualIndex)===i;el.classList.toggle('photo-active',selected);el.setAttribute('aria-hidden',String(!selected))});
}
function installVisuals(){
 const canvas=$('#canvas');if(!canvas)return;
 canvas.classList.add('original-photo-canvas');
 const original=setActive;
 setActive=function(i){if(i===active||!featured[i])return;active=i;const p=featured[i];installDailyDigestVisual(i);$('#stageLabel').textContent=p.company;$('#counter').textContent=String(i+1).padStart(2,'0')+' / '+String(featured.length).padStart(2,'0');document.querySelectorAll('.stepnav a').forEach((a,n)=>{a.classList.toggle('active',n===i);if(n===i)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})};
 canvas.querySelectorAll('svg,.reference-scene,.dd-stage').forEach(el=>el.remove());
 installDailyDigestVisual(active);
}
const dialogMarkup='<dialog id="caseViewer" aria-labelledby="cvTitle"><div class="cv-header"><div class="cv-company" id="cvCompany"></div><button class="cv-close" type="button" aria-label="Close case study">×</button></div><div class="cv-scroll" id="cvScroll" tabindex="0" aria-label="Case study chapters"></div><div class="cv-footer"><div class="cv-arrows"><button class="cv-arrow" id="cvPrev" aria-label="Previous chapter">←</button><button class="cv-arrow" id="cvNext" aria-label="Next chapter">→</button></div><div class="cv-steps" id="cvSteps" aria-label="Case study navigation"></div><div class="cv-count" id="cvCount" aria-live="polite"></div></div></dialog>';
document.body.insertAdjacentHTML('beforeend',dialogMarkup);
const viewer=$('#caseViewer'),scroller=$('#cvScroll');
function diagram(items){return '<div class="cv-diagram">'+items.map((s,i)=>(i?'<span>↓</span>':'')+'<div>'+esc(s)+'</div>').join('')+'</div>'}
function page(k,headline,content,visual,first=false){return '<section class="cv-page" tabindex="-1"><div><span class="cv-kicker">'+esc(k)+'</span><h2'+(first?' id="cvTitle"':'')+'>'+esc(headline)+'</h2>'+content+'</div><div class="cv-art">'+visual+'</div></section>'}
function para(s){return s?'<p>'+esc(s)+'</p>':''}

function portfolioArticle(p,id){
 viewer.classList.add('cv-article-mode');
 const a=p.article,emph=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 const slideshow=n=>{const slides=a.slideshows?.[n];if(!slides?.length)return '';return '<figure class="cv-article-figure dd-book-slides" aria-label="Behavioural science research diagrams"><div class="dd-book-heading">Research reference diagrams</div><div class="dd-book-panel">'+slides.map((v,i)=>'<div class="dd-book-slide" '+(i?'hidden':'')+'><img loading="lazy" decoding="async" src="'+esc(v.src)+'" alt="'+esc(v.title)+'"><div class="dd-book-title">'+esc(v.title)+'</div></div>').join('')+'</div><div class="dd-book-controls"><button type="button" data-dd-slide="-1" aria-label="Previous diagram">←</button><span class="dd-book-count" aria-live="polite">1 / '+slides.length+'</span><button type="button" data-dd-slide="1" aria-label="Next diagram">→</button></div><figcaption>Source: Harry Fletcher-Wood, Habits of Success: Getting Every Student Learning. Original book diagrams; not Amazon product artifacts.</figcaption></figure>'};
 const gallery=n=>{const g=a.galleries?.[n];if(!g)return '';return '<figure class="cv-article-figure"><div class="athena-gallery '+(g.portrait?'portrait':'')+'">'+g.images.map(v=>'<div>'+(v.webm?'<video class="creative-demo-video" muted playsinline loop controls preload="none" poster="'+esc(v.src)+'" aria-label="'+esc(v.title)+'"><source data-src="'+esc(v.webm)+'" type="video/webm"><source data-src="'+esc(v.mp4)+'" type="video/mp4"></video>':'<img loading="lazy" decoding="async" src="'+esc(v.src)+'" alt="'+esc(v.title)+'">')+'<span>'+esc(v.title)+'</span></div>').join('')+'</div><figcaption>'+esc(g.caption)+'</figcaption></figure>'};
 const framework=n=>{const f=a.frameworks?.[n];if(!f)return '';return '<figure class="cv-article-figure dd-framework"><h4>'+esc(f.title)+'</h4><div class="dd-framework-rows">'+f.steps.map(([principle,application],i)=>'<div class="dd-framework-row"><span class="dd-framework-number">'+String(i+1).padStart(2,'0')+'</span><div><div class="dd-framework-principle">'+esc(principle)+'</div><div class="dd-framework-application">'+esc(application)+'</div></div></div>').join('')+'</div><figcaption>'+esc(f.caption)+'</figcaption></figure>'};
 const artifact=n=>{const f=a.artifacts?.[n];return f?.src?'<figure class="cv-article-figure"><img class="dd-article-img" loading="lazy" decoding="async" src="'+esc(f.src)+'" alt="'+esc(f.caption)+'"><figcaption>'+esc(f.caption)+(f.kind?' · '+esc(f.kind):'')+'</figcaption></figure>':f?'<figure class="cv-article-figure"><div class="cv-article-placeholder" data-artifact="project-'+id+'-'+n+'"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg><span>Artifact placeholder</span></div><figcaption>'+esc(f.caption)+(f.kind?' · '+esc(f.kind):'')+'</figcaption></figure>':''};
 const stats=a.stats?.length?'<div class="cv-article-metrics">'+a.stats.map(([v,l])=>'<div><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>').join('')+'</div>':'';
 const links=a.sources.map(x=>'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+' ↗</a>').join('');
 $('#cvCompany').textContent=p.organisation+' · Case study';
 scroller.innerHTML='<div class="cv-article-layout"><nav class="cv-article-nav" aria-label="Contents"><span>CONTENTS</span>'+p.chapters.map((c,n)=>'<button type="button" data-section="'+n+'">'+esc(c.label)+'</button>').join('')+'</nav><article class="cv-article"><div class="cv-article-intro"><span class="cv-article-meta">'+esc(a.meta)+'</span><h2 id="cvTitle">'+esc(a.title)+'</h2><p class="cv-article-sub">'+esc(a.subtitle)+'</p>'+(a.metric?'<div class="cv-article-hero-metric"><b>'+esc(a.metric)+'</b><span>'+esc(a.metricLabel)+'</span></div>':'')+'<a class="cv-company-link" href="'+esc(p.companyUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.organisation)+' · Company context ↗</a></div>'+p.chapters.map((c,n)=>'<section class="cv-article-section" id="cvSection'+n+'"><h3><span>'+String(n+1).padStart(2,'0')+'</span>'+esc(c.title)+'</h3>'+c.paragraphs.map(t=>'<p>'+emph(t)+'</p>').join('')+(n===p.chapters.length-1?stats:'')+framework(n)+gallery(n)+slideshow(n)+artifact(n)+'</section>').join('')+(a.hideReferences?'':'<aside class="cv-evidence"><h3>'+esc(a.referenceTitle||'Company references')+'</h3>'+links+'</aside>')+'</article></div>';
 scroller.querySelectorAll('.dd-book-slides').forEach(g=>{const slides=[...g.querySelectorAll('.dd-book-slide')];let k=0;g.querySelectorAll('[data-dd-slide]').forEach(b=>b.onclick=()=>{k=(k+Number(b.dataset.ddSlide)+slides.length)%slides.length;slides.forEach((el,i)=>el.hidden=i!==k);g.querySelector('.dd-book-count').textContent=(k+1)+' / '+slides.length})});
 const buttons=[...scroller.querySelectorAll('[data-section]')];
 buttons.forEach((b,n)=>b.onclick=()=>scroller.querySelector('#cvSection'+n).scrollIntoView({block:'start',behavior:reduce.matches?'instant':'smooth'}));
 pageCount=0;pageIndex=0;viewer.showModal();document.body.style.overflow='hidden';scroller.scrollTop=0;scroller.scrollLeft=0;buttons[0]?.setAttribute('aria-current','location');requestAnimationFrame(()=>$('.cv-close').focus());
}
function updateArticleNav(){
 const sections=[...scroller.querySelectorAll('.cv-article-section')];if(!sections.length)return;
 const top=scroller.getBoundingClientRect().top+100;let n=0;sections.forEach((el,i)=>{if(el.getBoundingClientRect().top<=top)n=i});
 if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-5)n=sections.length-1;
 scroller.querySelectorAll('[data-section]').forEach((b,i)=>{if(i===n)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current')});
}

function openPortfolioCase(id,opener){
 const p=portfolioData?.projects[id];if(!p)return;caseOpener=opener||document.activeElement;viewer.classList.remove('cv-article-mode');scroller.scrollTop=0;if(p.article){portfolioArticle(p,id);return;}
 const i=featuredIds.indexOf(id),visual=p.compact?'':i>=0?art(p,i):diagram(['Business problem','Product decisions','Execution','Outcome']);
 const metric=p.compact?'':p.metric?'<div class="cv-stat">'+esc(p.metric)+'</div><div class="cv-stat-label">'+esc(p.unit)+'</div>':diagram(['Project objective','Evaluation','Outcome']);
 let pages=[
  page('01 / The challenge',p.title,para(p.problem)+'<p class="cv-context">'+esc(p.status||'')+'</p>',visual,true),
  page('02 / Discovery','Understanding the problem',para(p.discovery),diagram(['Customer or operational need','Evidence and constraints','Prioritised opportunity'])),
  page('03 / Product decisions','Choosing what to build',para(p.decision),diagram(['Define the desired outcome','Choose the intervention','Align execution'])),
  page('04 / Execution','Making the solution work',para(p.approach)+(p.assurance?'<h3>Reliability and quality</h3>'+para(p.assurance):''),references[id]?referenceMarkup(id):diagram(['Product definition','Collaborative execution','Quality review'])),
  page('05 / Outcomes','What changed',para(p.outcome)+(p.context?'<p class="cv-context">'+esc(p.context)+'</p>':''),metric)
 ];
 const custom=Array.isArray(p.chapters)&&p.chapters.length>0;
 const labels=custom?p.chapters.map(c=>c.label):['Challenge','Discovery','Decisions','Execution','Outcomes'];
 if(custom)pages=p.chapters.map((c,n)=>page(String(n+1).padStart(2,'0')+' / '+c.label,c.title,c.paragraphs.map(para).join(''),'',n===0).replace('class="cv-page"','class="cv-page cv-text-only"'));
 $('#cvCompany').textContent=p.company;scroller.innerHTML=pages.join('');pageCount=pages.length;pageIndex=0;
 $('#cvSteps').innerHTML=pages.map((_,n)=>'<button type="button" aria-label="Go to chapter '+(n+1)+': '+esc(labels[n])+'" data-page="'+n+'">'+esc(labels[n])+'</button>').join('');
 $('#cvSteps').querySelectorAll('button').forEach(b=>b.onclick=()=>goPage(Number(b.dataset.page)));
 bindImageFallbacks(scroller);viewer.showModal();document.body.style.overflow='hidden';scroller.scrollLeft=0;updateViewer(0);requestAnimationFrame(()=>$('.cv-close').focus());
}
function updateViewer(n){pageIndex=Math.max(0,Math.min(pageCount-1,n));[...scroller.children].forEach((el,j)=>{el.classList.toggle('craft-active',j===pageIndex);el.classList.toggle('craft-inactive',j!==pageIndex)});$('#cvPrev').disabled=pageIndex===0;$('#cvNext').disabled=pageIndex===pageCount-1;$('#cvCount').textContent=(pageIndex+1)+' / '+pageCount;$('#cvSteps').querySelectorAll('button').forEach((b,j)=>{b.classList.toggle('active',j===pageIndex);if(j===pageIndex)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')})}
function goPage(n){n=Math.max(0,Math.min(pageCount-1,n));scroller.scrollTo({left:n*scroller.clientWidth,behavior:reduce.matches?'instant':'smooth'});updateViewer(n)}
$('#cvPrev').onclick=()=>goPage(pageIndex-1);$('#cvNext').onclick=()=>goPage(pageIndex+1);$('.cv-close').onclick=()=>viewer.close();
viewer.addEventListener('close',()=>{document.body.style.overflow='';caseOpener?.focus({preventScroll:true})});
viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close()}});
viewer.addEventListener('keydown',e=>{if(viewer.classList.contains('cv-article-mode'))return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();goPage(e.key==='Home'?0:e.key==='End'?pageCount-1:pageIndex+(e.key==='ArrowRight'?1:-1))}});
scroller.addEventListener('scroll',()=>{if(viewer.classList.contains('cv-article-mode')){updateArticleNav();return;}if(viewerRAF)return;viewerRAF=requestAnimationFrame(()=>{viewerRAF=0;if(scroller.clientWidth)updateViewer(Math.round(scroller.scrollLeft/scroller.clientWidth))})},{passive:true});
let wheelGate=0;scroller.addEventListener('wheel',e=>{if(viewer.classList.contains('cv-article-mode'))return;if(e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;const current=scroller.children[pageIndex];if(current&&current.scrollHeight>current.clientHeight+8)return;if(Math.abs(e.deltaY)<8)return;e.preventDefault();const now=performance.now();if(now-wheelGate>450){wheelGate=now;goPage(pageIndex+Math.sign(e.deltaY))}},{passive:false});
function installCases(d){portfolioData=d;document.querySelectorAll('#chapters .chapter').forEach((el,i)=>{const p=d.projects[featuredIds[i]];{const mobile=el.querySelector('.mobileart');if(mobile){if(i<=4){mobile.innerHTML=[dailyDigestVisual,athenaVisual,whiteTableVisual,byjusVisual,emotoradVisual][i];mobile.classList.add('dd-mobile')}else{mobile.classList.add('visual-pending')}}}const meta=el.querySelector('.meta');if(meta&&p.companyUrl){const link=document.createElement('a');link.className='project-company-link';link.href=p.companyUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=p.company+' ↗';meta.lastElementChild?.replaceWith(link);const status=document.createElement('span');status.className='project-scope';status.textContent=p.engagement;meta.after(status)}const old=el.querySelector('details');if(old){const b=document.createElement('button');b.type='button';b.className='case-launch';b.innerHTML='<span>View case study</span><span>↗</span>';b.onclick=()=>openPortfolioCase(featuredIds[i],b);old.replaceWith(b)}if(references[featuredIds[i]]){const ref=document.createElement('div');ref.className='mobile-ref';ref.innerHTML=referenceMarkup(featuredIds[i]);el.querySelector('.mobileart')?.after(ref);bindImageFallbacks(ref)}});const remaining=[5,6,7,8,9];document.querySelectorAll('#more details').forEach((el,i)=>{const p=d.projects[remaining[i]],b=document.createElement('button');b.type='button';b.className='case-launch';b.innerHTML='<div><div class="meta">'+esc(p.company)+'</div><div class="row-title">'+esc(p.title)+'</div></div><span class="row-metric">'+esc(p.metric)+'</span><span>↗</span>';b.onclick=()=>openPortfolioCase(remaining[i],b);const row=document.createElement('div');row.className='linked-project-row';row.append(b);if(p.companyUrl){const a=document.createElement('a');a.href=p.companyUrl;a.target='_blank';a.rel='noopener noreferrer';a.className='project-company-link';a.textContent=p.organisation+' ↗';a.setAttribute('aria-label','Company context: '+p.organisation);row.append(a)}el.replaceWith(row)})}
function installOrbitArtwork(){
 document.querySelectorAll('.era-illustration').forEach((el,i)=>{const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('class','motion-orbit');svg.setAttribute('viewBox','0 0 300 210');svg.setAttribute('aria-hidden','true');let html='';for(let j=0;j<3;j++){const rx=90+j*22,ry=31+j*13;html+='<ellipse cx="150" cy="105" rx="'+rx+'" ry="'+ry+'" transform="rotate('+(-24+j*24)+' 150 105)" fill="none" stroke="'+eraColors[i]+'" stroke-opacity=".10" stroke-width="1"/>'}for(let j=0;j<9;j++)html+='<circle data-orbit="'+j+'" r="'+(j%3===0?2.8:1.7)+'" fill="'+eraColors[i]+'" opacity="'+(.22+(j%3)*.14)+'"/>';svg.innerHTML=html;el.prepend(svg)})
}
function animateOrbits(){
 if(reduce.matches)return;let visible=[];const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting&&!visible.includes(e.target))visible.push(e.target);else if(!e.isIntersecting)visible=visible.filter(x=>x!==e.target)});if(visible.length&&!orbitRAF)orbitRAF=requestAnimationFrame(frame)},{rootMargin:'100px'});let orbitRAF=0;
 function frame(t){orbitRAF=0;if(reduce.matches||document.hidden)return;visible.forEach(el=>{el.querySelectorAll('[data-orbit]').forEach((node,j)=>{const a=t*.00018*(j%2?1:-1)+j*2.39996;const rx=80+(j%3)*20,ry=30+(j%3)*14;const x=rx*Math.cos(a),y=ry*Math.sin(a),ang=(j%3-1)*.36;node.setAttribute('cx',150+x*Math.cos(ang)-y*Math.sin(ang));node.setAttribute('cy',105+x*Math.sin(ang)+y*Math.cos(ang))})});if(visible.length)orbitRAF=requestAnimationFrame(frame)}
 document.querySelectorAll('.motion-orbit').forEach(el=>observer.observe(el));document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible.length&&!orbitRAF)orbitRAF=requestAnimationFrame(frame)});
}
installOrbitArtwork();animateOrbits();

let enhancementsInstalled=false;function initializeEnhancements(){if(enhancementsInstalled||!window.portfolioContentReady)return;enhancementsInstalled=true;installVisuals();installCases(window.portfolioContentReady)}document.addEventListener('portfolio-content-ready',initializeEnhancements);initializeEnhancements();

/* Text-first chapters until final artifacts are integrated. */
(()=>{const style=document.createElement('style');style.textContent='.cv-page.cv-text-only{display:block!important;padding:clamp(28px,5vw,72px)!important;overflow-y:auto!important}.cv-page.cv-text-only>div:first-child{max-width:790px;width:100%;margin:0 auto}.cv-page.cv-text-only .cv-art{display:none}.cv-page.cv-text-only h2{max-width:740px;margin-bottom:24px}.cv-page.cv-text-only p{max-width:760px;line-height:1.7;margin-bottom:18px}.cv-steps{overflow-x:auto;min-width:0}.cv-steps button{flex-shrink:0;white-space:nowrap}';document.head.append(style)})();

(()=>{const style=document.createElement('style');style.textContent=`
#caseViewer.cv-article-mode .cv-footer{display:none!important}
#caseViewer.cv-article-mode .cv-scroll{display:block!important;overflow-y:auto!important;overflow-x:hidden!important;scroll-snap-type:none!important;min-height:0;flex:1;overscroll-behavior:contain}
.cv-article-layout{display:grid;grid-template-columns:165px minmax(0,680px);justify-content:center;align-items:start;gap:clamp(24px,4vw,64px);padding:40px clamp(22px,5vw,72px) 64px}
.cv-article-nav{position:sticky;top:24px;display:flex;flex-direction:column;gap:8px;padding-top:10px}
.cv-article-nav>span{font-size:10px;letter-spacing:.1em;opacity:.6;margin-bottom:10px}
.cv-article-nav button{font:inherit;font-size:13px;text-align:left;background:none;border:0;border-left:2px solid transparent;padding:8px 10px;color:inherit;opacity:.6;cursor:pointer}
.cv-article-nav button[aria-current]{opacity:1;border-left-color:#199aff;font-weight:500}
.cv-article{min-width:0;max-width:680px}
.cv-article-intro{padding:0 0 36px;border-bottom:1px solid rgba(127,127,127,.22)}
.cv-article-meta{font-size:13px;opacity:.65}
.cv-article-intro h2{font-size:clamp(36px,5vw,60px);font-weight:500;letter-spacing:-.045em;line-height:1.1;margin:14px 0 8px}
.cv-article-sub{font-size:17px;opacity:.75;margin:0}
.cv-article-hero-metric{margin-top:30px;display:flex;flex-direction:column;gap:6px}
.cv-article-hero-metric b{font-size:clamp(30px,4vw,46px);font-weight:500;letter-spacing:-.04em}
.cv-article-hero-metric span,.cv-article-metrics span{font-size:12px;opacity:.7}
.cv-article-section{padding:30px 0;border-bottom:1px solid rgba(127,127,127,.2);scroll-margin-top:28px}
.cv-article-section h3{font-size:21px;font-weight:500;letter-spacing:-.02em;margin:0 0 12px;display:flex;gap:12px;align-items:baseline}
.cv-article-section h3 span{font-size:11px;color:#777;letter-spacing:0}
.cv-article-section p{font-size:16px;line-height:1.7;margin:0;max-width:65ch}
.cv-article-section strong{font-weight:600}
.cv-article-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:24px}
.cv-article-metrics>div{display:flex;flex-direction:column;gap:5px}
.cv-article-metrics b{font-size:28px;font-weight:500;letter-spacing:-.03em}
@media(max-width:680px){.cv-article-layout{display:block;padding:22px 20px 44px}.cv-article-nav{position:static;display:flex;flex-direction:row;flex-wrap:wrap;gap:4px;margin-bottom:22px;padding:0}.cv-article-nav>span{display:none}.cv-article-nav button{font-size:11px;padding:5px 7px;border-left:0;border-bottom:2px solid transparent}.cv-article-nav button[aria-current]{border-bottom-color:#199aff}.cv-article-section{padding:24px 0}.cv-article-section p{font-size:15px}.cv-article-section h3{font-size:19px}.cv-article-metrics{gap:12px}.cv-article-metrics b{font-size:24px}}
`;document.head.append(style)})();

/* Amazon article: isolate introductory content from the site's sticky masthead. */
(()=>{const style=document.createElement('style');style.textContent=`
#caseViewer.cv-article-mode .cv-article-intro{position:static;display:block;background:none;backdrop-filter:none;z-index:auto;min-width:0;padding:0 0 32px;margin:0}
#caseViewer.cv-article-mode .cv-article-intro h2{font-size:clamp(34px,4.5vw,52px);margin:12px 0 8px;line-height:1.15;font-weight:500}
#caseViewer.cv-article-mode .cv-article-meta{display:block}
#caseViewer.cv-article-mode .cv-article-hero-metric{margin-top:24px}
#caseViewer.cv-article-mode .cv-article-hero-metric b{white-space:nowrap;font-size:clamp(28px,4vw,42px)}
#caseViewer.cv-article-mode .cv-article-section strong{font-weight:600}
.cv-article-figure{margin:24px 0 4px}
.cv-article-placeholder{aspect-ratio:16/9;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;background:#f7f8fa;border:1px dashed #c9ced6;border-radius:10px;color:#717780;font-size:12px}
.cv-article-figure figcaption{font-size:12px;line-height:1.5;color:#727272;margin-top:10px}
@media(max-width:680px){#caseViewer.cv-article-mode .cv-article-intro{padding-bottom:24px}.cv-article-figure{margin-top:18px}}
`;document.head.append(style)})();

(()=>{const style=document.createElement('style');style.textContent=`
.project-company-link,.cv-company-link{color:inherit;text-decoration:underline;text-decoration-color:#b7b7b7;text-underline-offset:4px}
.project-scope{display:block;color:#727272;font-size:12px;margin:6px 0 10px}
.linked-project-row{display:flex;align-items:center;gap:18px;border-bottom:1px solid #e6e6e6}
.linked-project-row>.case-launch{flex:1;min-width:0;border-bottom:0!important}
.linked-project-row>.project-company-link{flex-shrink:0;font-size:12px;color:#6f6f6f;padding:8px 0}
.cv-company-link{display:inline-block;font-size:13px;margin-top:18px}
.cv-evidence{padding:26px 0;font-size:13px;color:#666}
.cv-evidence h3{font-size:16px;font-weight:500;color:inherit;margin-bottom:8px}
.cv-evidence p{line-height:1.55;margin-bottom:12px}
.cv-evidence a{display:block;text-decoration:underline;text-underline-offset:3px;margin-top:8px}
@media(max-width:680px){.linked-project-row{gap:8px}.linked-project-row>.project-company-link{font-size:10px}}
`;document.head.append(style)})();

(()=>{const style=document.createElement('style');style.textContent=`
.dd-stage{position:absolute;inset:0;z-index:2;background:#f3f6f8;animation:reveal .45s ease both}
.dd-composition{position:relative;width:100%;height:100%;display:grid;place-items:center;background:#f3f6f8}
.dd-flow{position:absolute;left:3%;top:4%;width:94%;height:77%;object-fit:contain;object-position:top center}
.dd-reminder{position:absolute;right:4%;bottom:4%;width:39%;height:auto;border-radius:8px;box-shadow:0 4px 16px #0002;border:2px solid white}
.dd-mobile{aspect-ratio:1.17!important}
.dd-framework{padding:24px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:12px}
.dd-framework h4{font-size:19px;font-weight:500;line-height:1.3;margin:0 0 22px;letter-spacing:-.02em}
.dd-framework-rows{display:grid;gap:0}
.dd-framework-row{display:grid;grid-template-columns:30px minmax(0,1fr);gap:14px;position:relative;padding:0 0 22px}
.dd-framework-row:last-child{padding-bottom:0}
.dd-framework-row:not(:last-child):before{content:'';position:absolute;width:1px;background:#d9dfe7;left:14px;top:31px;bottom:2px}
.dd-framework-number{width:29px;height:29px;display:grid;place-items:center;border-radius:50%;font-size:11px;color:#1967d2;background:#e8f0fe}
.dd-framework-principle{font-size:15px;font-weight:500;line-height:1.4}
.dd-framework-application{font-size:14px;line-height:1.5;color:#555;margin-top:4px}
.dd-framework figcaption{border-top:1px solid #e0e3e7;padding-top:12px;margin-top:20px}
@media(max-width:680px){.dd-framework{padding:17px}.dd-framework-row{gap:10px}}
.dd-article-img{display:block;width:100%;height:auto;border-radius:10px;border:1px solid #e5e5e5}
@media(prefers-reduced-motion:reduce){.dd-stage{animation:none}}
`;document.head.append(style)})();
(()=>{const style=document.createElement('style');style.textContent=`
.dd-book-slides{padding:20px;border:1px solid #e4e4e4;border-radius:12px;background:white}
.dd-book-heading{font-size:16px;font-weight:500;margin-bottom:16px}
.dd-book-panel{min-width:0}
.dd-book-slide[hidden]{display:none!important}
.dd-book-slide img{display:block;width:100%;height:clamp(300px,58vh,620px);object-fit:contain}
.dd-book-title{text-align:center;font-size:14px;color:#444;margin:12px 0}
.dd-book-controls{display:flex;align-items:center;justify-content:center;gap:20px;margin:14px 0}
.dd-book-controls button{width:38px;height:38px;border:1px solid #ddd;border-radius:50%;background:white;color:#333;font:inherit}
.dd-book-controls button:hover{background:#f4f4f4}
.dd-book-count{font-size:12px;color:#666;font-variant-numeric:tabular-nums}
@media(max-width:680px){.dd-book-slides{padding:12px}.dd-book-slide img{height:auto;max-height:62vh}}
`;document.head.append(style)})();
(()=>{const style=document.createElement('style');style.textContent=`
.athena-composition{position:relative;width:100%;height:100%;background:#faf7ee;overflow:hidden}
.athena-wheel{position:absolute;left:3%;top:10%;width:69%;height:80%;object-fit:cover;object-position:left;clip-path:inset(0 0 0 0)}
.athena-phone{position:absolute;right:5%;top:6%;height:88%;width:auto;max-width:42%;object-fit:contain;border-radius:10px;box-shadow:0 5px 18px #0002}
.athena-gallery{display:grid;gap:18px;grid-template-columns:1fr}
.athena-gallery.portrait{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.athena-gallery img{display:block;width:100%;height:auto;border-radius:8px;border:1px solid #e5e5e5}
.athena-gallery span{display:block;margin-top:7px;font-size:12px;color:#555}
`;document.head.append(style)})();
/* Original project imagery only in featured-project previews. */
(()=>{const style=document.createElement('style');style.textContent=`
#canvas>svg,.chapter .mobileart>svg{display:none!important}
#canvas[data-project-visual="pending"]{background:#f8f8f8!important}
.chapter .mobileart.visual-pending{display:none!important}
`;document.head.append(style)})();

(()=>{const style=document.createElement('style');style.textContent=`
#canvas.original-photo-canvas{background:#f8f8f8!important;transform:none!important;rotate:none!important;translate:none!important;scale:none!important;animation:none!important;transition:none!important;will-change:auto!important}
#canvas.original-photo-canvas:hover{transform:none!important;rotate:none!important}
#canvas .project-photo-layer{position:absolute;inset:0;opacity:0;pointer-events:none;background:#f8f8f8;transition:opacity 420ms cubic-bezier(.4,0,.2,1);animation:none!important}
#canvas .project-photo-layer.photo-active{opacity:1;pointer-events:auto}
#canvas .project-photo-layer img{animation:none!important;transition:none!important}
@media(prefers-reduced-motion:reduce){#canvas .project-photo-layer{transition:none!important}}
`;document.head.append(style)})();
(()=>{const style=document.createElement('style');style.textContent=`
.wt-composition{position:relative;width:100%;height:100%;background:#edf0f4;overflow:hidden}
.wt-architecture{position:absolute;left:4%;top:4%;height:92%;width:65%;object-fit:contain;object-position:left center}
.wt-assistant{position:absolute;right:4%;bottom:9%;width:51%;height:auto;border:1px solid #d0d5dc;border-radius:8px;box-shadow:0 6px 22px #0003}
`;document.head.append(style)})();
(()=>{const style=document.createElement('style');style.textContent=`
.byjus-composition{position:relative;width:100%;height:100%;background:#f7f4fb;overflow:hidden}
.byjus-mobile{position:absolute;left:4%;top:6%;width:68%;height:62%;object-fit:contain;object-position:top left;border-radius:6px}
.byjus-graph{position:absolute;right:4%;top:5%;width:25%;height:53%;object-fit:contain}
.byjus-tablet{position:absolute;left:23%;bottom:6%;width:69%;height:auto;border-radius:9px;box-shadow:0 6px 22px #0002}
`;document.head.append(style)})();
(()=>{const style=document.createElement('style');style.textContent=`
.em-workflows{height:100%;width:100%;display:grid;grid-template-rows:repeat(3,minmax(0,1fr)) auto;gap:8px;padding:12px;box-sizing:border-box;background:#f5f6f7}
.em-workflows>div{min-height:0;overflow:hidden;border:1px solid #e1e3e6;border-radius:6px;background:white}
.em-workflows img{width:100%;height:100%;object-fit:contain;display:block}
.em-workflows>span{font-size:11px;color:#555;text-align:center}
`;document.head.append(style)})();
(()=>{const style=document.createElement('style');style.textContent='.creative-demo-video{display:block;width:100%;height:auto;max-height:540px;object-fit:contain;background:#111;border-radius:6px}';document.head.append(style);const reduced=matchMedia('(prefers-reduced-motion: reduce)');const io=new IntersectionObserver(entries=>entries.forEach(({target:v,isIntersecting})=>{if(isIntersecting){if(!v.dataset.loaded){v.querySelectorAll('source[data-src]').forEach(el=>el.src=el.dataset.src);v.dataset.loaded="1";v.load()}if(!reduced.matches&&!document.hidden){v.muted=true;v.play().catch(()=>{})}}else v.pause()}),{threshold:.35});const bind=()=>document.querySelectorAll('video.creative-demo-video:not([data-observed])').forEach(v=>{v.dataset.observed="1";io.observe(v)});const mo=new MutationObserver(records=>{for(const r of records)for(const n of r.removedNodes)if(n.nodeType===1){const vs=n.matches?.('video.creative-demo-video')?[n]:Array.from(n.querySelectorAll?.('video.creative-demo-video')||[]);vs.forEach(v=>{v.pause();io.unobserve(v)})}bind()});mo.observe(document.body,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video.creative-demo-video').forEach(v=>v.pause());else if(!reduced.matches)document.querySelectorAll('video.creative-demo-video[data-loaded]').forEach(v=>{const r=v.getBoundingClientRect();if(r.top>=0&&r.bottom<=innerHeight&&v.getClientRects().length)v.play().catch(()=>{})})});bind()})();
