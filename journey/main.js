/* Portfolio: data rendering, case reading and one coordinated scroll controller. */
'use strict';
const $=(q,root=document)=>root.querySelector(q), $$=(q,root=document)=>Array.from(root.querySelectorAll(q));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const ns='http://www.w3.org/2000/svg';
const clamp=n=>Math.max(0,Math.min(1,n));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const num=i=>String(i+1).padStart(2,'0');
const featured=[0,1,2,5,3,4], secondary=[6,7,8,9];
const covers={
  0:[['assets/daily-digest/product-flow.webp','Daily Digest product flow']],
  1:[['assets/athena/dashboard.webp','Arete dashboard'],['assets/athena/tasks.webp','Arete task management']],
  2:[['assets/whitetable/architecture.webp','GrowthOS architecture'],['assets/whitetable/assistant.webp','WhiteTable Intelligence interface']],
  5:[['assets/archmation-creative/fashion-workflow.webp','Fashion generation workflow'],['assets/archmation-creative/furniture-workflow.webp','Furniture visualisation workflow']],
  3:[['assets/byjus/mobile-journeys.webp','BYJU’S guided learning journeys'],['assets/byjus/interactive-light.webp','Interactive light reflection']],
  4:[['assets/sop-flow.svg','Conceptual SOP retrieval workflow']]
};
const summaries={
  0:'I transformed Question of the Day into a personalised daily experience designed to increase visit frequency, meaningful practice and adoption of other learning features.',
  1:'I developed an AI product strategy to increase counselling capacity, automate routine documentation and enable context-aware student planning without compromising individual guidance.',
  2:'I defined reusable agent workflows across knowledge management, employee assistance, business operations, software development and customer acquisition, supported by functional prototypes and evaluation requirements.',
  5:'Developed 11 specialised workflows for product photography, video production, virtual try-on, garment replacement, architectural visualisation and 3D assets.',
  3:'I led initiatives connecting knowledge architecture, guided learning journeys and interactive STEM with repeatable development processes across multidisciplinary teams.',
  4:'I designed three practical workflows for employee onboarding, access to internal procedures and pending-work reminders, prioritising existing tools and minimal maintenance.'
};
let data=null, chapters=[], stageLayers=[], progress=[], active=-1, raf=0, dirty=true, layout=true, opener=null, copyTimer=0;
const media=(src,alt,first=false)=>'<img src="'+esc(src)+'" alt="'+esc(alt)+'" width="800" height="600" loading="'+(first?'eager':'lazy')+'" decoding="async">';
const cover=(id,first=false)=>'<div class="visual '+(covers[id].length>1?'pair':'')+'">'+covers[id].map(([s,a])=>media(s,a,first)).join('')+'</div>';
const company=p=>p.companyUrl?'<a class="company-link" href="'+esc(p.companyUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.organisation||p.company)+' ↗</a>':'<span class="company-name">'+esc(p.organisation||p.company)+'</span>';
function bindMedia(root){
  $$('img',root).forEach(img=>{const fail=()=>{if(!img.isConnected)return;const msg=document.createElement('span');msg.className='media-failure';msg.textContent=img.alt+' — image unavailable';img.replaceWith(msg)};img.addEventListener('error',fail,{once:true});if(img.complete&&!img.naturalWidth)fail()});
}
function render(d){
  data=d;
  $('#chapters').innerHTML=featured.map((id,i)=>{const p=d.projects[id];return '<article class="chapter" id="project-'+num(i)+'"><p class="eyebrow">'+num(i)+' · '+company(p)+'</p><h3>'+esc(p.title)+'</h3>'+(p.engagement?'<p class="scope">'+esc(p.engagement)+'</p>':'')+'<div class="mobile-visual">'+cover(id,i===0)+'</div>'+(p.metric?'<div><p class="metric">'+esc(p.metric)+'</p><p class="metric-label">'+esc(p.unit)+'</p></div>':'')+'<p>'+esc(summaries[id]||p.summary||p.problem)+'</p><button class="button primary" type="button" data-case="'+id+'">View case study <span aria-hidden="true">↗</span></button></article>'}).join('');
  $('#stage-frame').innerHTML=featured.map((id,i)=>cover(id,i===0)).join('');
  $('#progress').innerHTML=featured.map((id,i)=>'<a href="#project-'+num(i)+'" aria-label="'+esc(d.projects[id].title)+'"></a>').join('');
  $('#more-list').innerHTML=secondary.map(id=>{const p=d.projects[id];return '<div class="more-row"><button class="more-open" type="button" data-case="'+id+'"><span>'+esc(p.title)+'</span><span aria-hidden="true">↗</span></button>'+company(p)+'</div>'}).join('');
  chapters=$$('.chapter');stageLayers=$$('#stage-frame .visual');progress=$$('#progress a');
  bindMedia($('#work'));setActive(0);observeReveals();layout=true;queue();
}
function setActive(i){
  if(i===active||!data)return;active=i;
  stageLayers.forEach((el,n)=>{el.classList.toggle('current',i===n);el.setAttribute('aria-hidden',String(i!==n))});
  progress.forEach((el,n)=>{if(i===n)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current')});
  $('#stage-company').textContent=data.projects[featured[i]].company;
  $('#stage-count').textContent=num(i)+' / '+String(featured.length).padStart(2,'0');
}
const dialog=$('#case-dialog'), scroll=$('#case-scroll');
function figure(a){return a?.src?'<figure class="case-figure">'+media(a.src,a.caption)+'<figcaption>'+esc(a.caption)+(a.kind?' · '+esc(a.kind):'')+'</figcaption></figure>':''}
function gallery(g){if(!g?.images?.length)return '';return '<figure class="case-figure"><div class="gallery">'+g.images.map(a=>'<div class="gallery-item">'+(a.webm?'<video controls playsinline preload="none" width="800" height="600" aria-label="'+esc(a.title)+'"><source src="'+esc(a.webm)+'" type="video/webm"></video>':media(a.src,a.title))+'<span>'+esc(a.title)+'</span></div>').join('')+'</div><figcaption>'+esc(g.caption)+'</figcaption></figure>'}
function framework(f){if(!f)return '';return '<div class="framework"><h4>'+esc(f.title)+'</h4><ol>'+f.steps.map(([a,b])=>'<li><strong>'+esc(a)+'</strong> — '+esc(b)+'</li>').join('')+'</ol><p class="eyebrow">'+esc(f.caption)+'</p></div>'}
function stats(a){return a?.length?'<div class="stats">'+a.map(([v,l])=>'<div class="stat"><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>').join('')+'</div>':''}
function openCase(id,trigger){
  const p=data?.projects[id];if(!p)return;opener=trigger;
  const a=p.article||{}, chapters=p.chapters||[];
  $('#case-company').textContent=p.company;
  scroll.innerHTML='<article class="case-article"><div class="case-intro"><p class="eyebrow">'+esc(a.meta||p.engagement||p.company)+'</p><h2 id="case-title">'+esc(a.title||p.title)+'</h2><p class="lead">'+esc(a.subtitle||p.summary||p.problem)+'</p>'+(a.metric?'<p class="metric">'+esc(a.metric)+'</p><p>'+esc(a.metricLabel)+'</p>':'')+company(p)+'</div>'+stats(a.stats)+'<nav class="case-contents" aria-label="Case study contents">'+chapters.map((c,i)=>'<a href="#case-section-'+i+'">'+esc(c.label)+'</a>').join('')+'</nav>'+chapters.map((c,i)=>'<section id="case-section-'+i+'"><h3>'+esc(c.title)+'</h3>'+c.paragraphs.map(t=>'<p>'+rich(t)+'</p>').join('')+figure(a.artifacts?.[i])+framework(a.frameworks?.[i])+gallery(a.galleries?.[i])+(a.slideshows?.[i]?gallery({caption:'Research reference diagrams',images:a.slideshows[i]}):'')+'</section>').join('')+(a.sources?.length?'<section class="sources"><h3>'+esc(a.referenceTitle||'References')+'</h3>'+a.sources.map(x=>'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+' ↗</a>').join('')+'</section>':'')+'</article>';
  bindMedia(scroll);dialog.showModal();scroll.scrollTop=0;$('#close-case').focus();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(b)openCase(Number(b.dataset.case),b)});
$('#close-case').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{ $$('video',scroll).forEach(v=>v.pause());scroll.replaceChildren();opener?.focus();});
scroll.addEventListener('click',e=>{const a=e.target.closest('.case-contents a');if(!a)return;const el=$(a.getAttribute('href'),scroll);if(el){e.preventDefault();el.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'})}});
$('#copy-email').addEventListener('click',async()=>{const addr=$('#email').textContent,status=$('#copy-status');try{await navigator.clipboard.writeText(addr);status.textContent='Copied';$('#copy-email').textContent='Copied'}catch{status.textContent='Select and copy the email address.'}clearTimeout(copyTimer);copyTimer=setTimeout(()=>{status.textContent='';$('#copy-email').textContent='Copy email'},1600)});
/* Single visual vocabulary: isometric modules and connected planes. */
function svg(tag,attrs={}){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el}
function tile(w=24,h=10,core=false){
  const g=svg('g');g.append(svg('path',{d:'M-'+w+' 0 L0 '+w*.58+' L'+w+' 0 V'+h+' L0 '+(w*.58+h)+' L-'+w+' '+h+' Z',class:'scene-side'}),svg('path',{d:'M-'+w+' 0 L0 -'+w*.58+' L'+w+' 0 L0 '+w*.58+' Z',class:core?'scene-core':'scene-tile'}));return g;
}
function scene(mount,kind){
  const root=svg('svg',{viewBox:'0 0 360 270',preserveAspectRatio:'xMidYMid meet'});
  root.append(svg('ellipse',{cx:180,cy:224,rx:96,ry:12,class:'scene-shadow'}));
  const guides=svg('g'),group=svg('g');root.append(guides,group);mount.append(root);
  const specs=[];
  if(kind===0||kind===4){for(let y=0;y<3;y++)for(let x=0;x<3;x++)specs.push({x:180+(x-y)*36,y:91+(x+y)*23,w:32,h:14,core:x===y})}
  else if(kind===1){for(let j=0;j<5;j++)specs.push({x:100+j*39,y:181-j*13,w:23,h:20+j*9,core:j===4})}
  else if(kind===2){for(let j=0;j<6;j++){const a=j*Math.PI/3;specs.push({x:180+Math.cos(a)*81,y:132+Math.sin(a)*52,w:23,h:12,core:false})}specs.push({x:180,y:132,w:36,h:20,core:true})}
  else {for(let j=0;j<8;j++){const a=j*Math.PI/4;specs.push({x:180+Math.cos(a)*96,y:137+Math.sin(a)*58,w:12,h:7,core:false})}for(let j=0;j<3;j++)specs.push({x:180,y:156-j*24,w:43,h:12,core:j===2})}
  if(kind===2||kind===3){specs.slice(0,kind===2?6:8).forEach(p=>guides.append(svg('path',{d:'M180 137 L'+p.x+' '+p.y,class:'scene-line'})))}
  else guides.append(svg('path',{d:'M68 152 L180 83 L292 152 L180 219 Z',class:'scene-line'}));
  const items=specs.map((p,i)=>{const g=tile(p.w,p.h,p.core);group.append(g);return {...p,g,i,dx:Math.sin(i*2.17+kind)*55,dy:Math.cos(i*1.73+kind)*42,rot:(i%2?1:-1)*28}});
  function draw(progress){
    guides.setAttribute('opacity',String(.18+.82*progress));
    items.forEach(o=>{const start=o.i/Math.max(1,items.length-1)*.26,k=clamp((progress-start)/.74),e=k*k*(3-2*k),q=1-e;
      o.g.setAttribute('transform','translate('+(o.x+o.dx*q)+' '+(o.y+o.dy*q+Math.sin(Math.PI*e)*8)+') rotate('+(o.rot*q)+') scale('+(.65+.35*e)+')');
      o.g.setAttribute('opacity',String(.22+.78*e));
    });
  }
  draw(1);return draw;
}
const heroDraw=scene($('#hero-art'),4),milestones=$$('.milestone').map((el,i)=>({el,draw:scene($('.milestone-art',el),i)}));
const career=$('#career'),track=$('#career-track'),path=$('#track-base'),dot=$('#track-dot'),beadGroup=$('#track-beads');
const beads=Array.from({length:9},(_,i)=>{const n=svg('circle',{r:2.8-i*.19,class:'track-bead'});beadGroup.append(n);return n});
let trackPoints=[],careerBox=null,heroStart=null,heroFinished=false;
const duration=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scene'))||800;
const navLinks=$$('.navigation a'),nav=$('.navigation'),indicator=$('.nav-indicator');
const navSections=navLinks.map(a=>$(a.getAttribute('href')));
let navActive=-2;
function measure(){
  const box=career.getBoundingClientRect(),mobile=matchMedia('(max-width:768px)').matches,w=box.width,h=box.height;
  track.setAttribute('viewBox','0 0 '+w+' '+h);
  const x=mobile?16:w/2;let d='M'+x+' 0',y=0;
  milestones.forEach((m,i)=>{const next=m.el.offsetTop+m.el.offsetHeight,dy=next-y,side=mobile?5:20,sign=i%2?1:-1;d+=' C'+x+' '+(y+dy*.22)+' '+(x+sign*side)+' '+(y+dy*.31)+' '+(x+sign*side)+' '+(y+dy*.5)+' S'+x+' '+(y+dy*.79)+' '+x+' '+next;y=next});
  path.setAttribute('d',d);const len=path.getTotalLength();trackPoints=Array.from({length:401},(_,i)=>path.getPointAtLength(len*i/400));
}
function trackAt(y){
  let lo=0,hi=trackPoints.length-1;while(lo<hi){const m=(lo+hi)>>1;if(trackPoints[m].y<y)lo=m+1;else hi=m}
  const a=trackPoints[Math.max(0,lo-1)],b=trackPoints[lo];if(!a||!b)return {x:0,y:0};const q=clamp((y-a.y)/Math.max(.001,b.y-a.y));return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};
}
function update(t){
  raf=0;const needsLayout=layout;layout=false;dirty=false;
  if(needsLayout)measure();
  const h=innerHeight,top=scrollY;
  const navRects=navSections.map(e=>e.getBoundingClientRect());
  const chapterRects=chapters.map(e=>e.getBoundingClientRect());
  const careerRect=career.getBoundingClientRect(),eraRects=milestones.map(m=>m.el.getBoundingClientRect());
  let n=-1;navRects.forEach((r,i)=>{if(r.top<=h*.35)n=i});if(top+h>=document.documentElement.scrollHeight-4)n=2;
  $('#header').classList.toggle('scrolled',top>8);
  if(n!==navActive||needsLayout){navActive=n;navLinks.forEach((a,i)=>{if(i===n)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});if(n<0)indicator.style.opacity='0';else{const a=navLinks[n];indicator.style.transform='translateX('+a.offsetLeft+'px) scaleX('+(a.offsetWidth/32)+')';indicator.style.opacity='1'}}
  if(chapters.length){let i=0;chapterRects.forEach((r,j)=>{if(r.top<=h*.48)i=j});setActive(i)}
  if(!heroFinished){if(heroStart===null)heroStart=t;const q=reduced.matches?1:clamp((t-heroStart)/duration);heroDraw(1-Math.pow(1-q,3));heroFinished=q===1}
  if(trackPoints.length){const y=clamp((h*.55-careerRect.top)/Math.max(1,careerRect.height))*careerRect.height,p=trackAt(y);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);beads.forEach((b,i)=>{const q=trackAt(Math.max(0,y-(i+1)*11));b.setAttribute('cx',q.x);b.setAttribute('cy',q.y);b.setAttribute('opacity',String(y>(i+1)*11?1-i/10:0))})}
  milestones.forEach((m,i)=>{const r=eraRects[i],p=reduced.matches?1:clamp((h*.9-r.top)/Math.max(1,Math.min(h*.58,r.height*.85)));m.draw(p)});
  if(!heroFinished&&!reduced.matches)queue();
}
function queue(){if(!raf)raf=requestAnimationFrame(update)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{layout=true;queue()},{passive:true});reduced.addEventListener?.('change',()=>{heroFinished=false;heroStart=null;queue()});
if('ResizeObserver'in window)new ResizeObserver(()=>{layout=true;queue()}).observe(career);
let revealObserver;
function observeReveals(){
  if(reduced.matches||!('IntersectionObserver'in window))return;
  revealObserver??=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('reveal-pending');e.target.classList.add('reveal-visible');revealObserver.unobserve(e.target)}}),{threshold:0,rootMargin:'0px 0px -24px 0px'});
  $$('.section-heading,.chapter,.more-row,.milestone-copy,.topics article').forEach(el=>{if(el.dataset.observed)return;el.dataset.observed='true';if(el.getBoundingClientRect().top<innerHeight)return;el.classList.add('reveal-pending');revealObserver.observe(el)});
}
observeReveals();queue();
fetch('content.json').then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(render).catch(()=>{$('#chapters').innerHTML='<p role="alert">Case studies could not be loaded. Please refresh the page or contact me directly.</p>'});
