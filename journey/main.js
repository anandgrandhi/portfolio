/* Portfolio: data rendering, case reading and one coordinated scroll controller.
   The hero's time-based performance lives in hero.js; everything scroll-driven lives here. */
'use strict';
const $=(q,root=document)=>root.querySelector(q), $$=(q,root=document)=>Array.from(root.querySelectorAll(q));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
/* Smooth scrolling — Lenis (MIT, darkroom.engineering, vendored). It eases wheel input onto the
   native scroll position, so sticky stages, the career ball and every scroll reader below keep
   working unchanged. Touch keeps the platform's own momentum. Off under reduced motion. */
const smooth=!!window.Lenis&&!reduced.matches;
const lenis=smooth?new Lenis({lerp:.085,wheelMultiplier:1,autoRaf:true,anchors:{offset:-32},prevent:n=>!!n.closest?.('dialog')}):null;
let caseLenis=null;
const ns='http://www.w3.org/2000/svg';
const clamp=n=>Math.max(0,Math.min(1,n));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=s=>esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const num=i=>String(i+1).padStart(2,'0');
const featured=[0,1,2,5,3,4], secondary=[6,7,8,9];
/* Era colour per project, matching the career journey: BYJU’S green, Amazon yellow, Archmation red, applied-AI consulting blue. */
const eras={0:'yellow',1:'blue',2:'blue',5:'red',3:'green',4:'blue',6:'yellow',7:'red',8:'yellow',9:'yellow'};
const covers={
  0:[['assets/daily-digest/product-flow.webp','Daily Digest product flow']],
  1:[['assets/athena/dashboard.webp','Arete dashboard'],['assets/athena/tasks.webp','Arete task management']],
  2:[['assets/whitetable/architecture.webp','GrowthOS architecture'],['assets/whitetable/assistant.webp','WhiteTable Intelligence interface']],
  5:[['assets/archmation-creative/fashion-workflow.webp','Fashion generation workflow'],['assets/archmation-creative/furniture-workflow.webp','Furniture visualisation workflow']],
  3:[['assets/byjus/mobile-journeys.webp','BYJU’S guided learning journeys'],['assets/byjus/interactive-light.webp','Interactive light reflection']],
  4:[['assets/sop-flow.svg','SOP retrieval workflow']]
};
/* Card copy comes from content.json (Editorial Master). */
/* Short-lived effects register a ticker; update() runs them and keeps a frame queued only while any is live. */
const tickers=new Set();
function animate(fn){tickers.add(fn);queue()}
let data=null, chapters=[], stageLayers=[], progress=[], marker=null, markerX=null, markerTarget=0, active=-1, raf=0, layout=true, opener=null, copyTimer=0;
/* Google text motion: split a block into word spans; CSS staggers them by --i. Text content is unchanged. */
function splitWords(el,kind,base){if(!el||el.dataset.split)return;el.dataset.split=kind;const words=el.textContent.trim().split(/\s+/);el.setAttribute('aria-label',el.textContent.trim());el.innerHTML=words.map((w,i)=>'<span class="word" aria-hidden="true" style="--i:'+i+'">'+esc(w)+(i<words.length-1?' ':'')+'</span>').join('');el.classList.add('split','split-'+kind);if(base)el.style.setProperty('--base',base)}
const media=(src,alt,first=false)=>'<img src="'+esc(src)+'" alt="'+esc(alt)+'" width="800" height="600" loading="eager" decoding="async">';
const cover=(id,first=false)=>'<div class="visual '+(covers[id].length>1?'pair':'')+'">'+covers[id].map(([s,a])=>media(s,a,first)).join('')+'</div>';
const company=p=>p.companyUrl?'<a class="company-link" href="'+esc(p.companyUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(p.organisation||p.company)+' ↗</a>':'<span class="company-name">'+esc(p.organisation||p.company)+'</span>';
function bindMedia(root){
  $$('img',root).forEach(img=>{const fail=()=>{if(!img.isConnected)return;const msg=document.createElement('span');msg.className='media-failure';msg.textContent=img.alt+' — image unavailable';img.replaceWith(msg)};img.addEventListener('error',fail,{once:true});if(img.complete&&!img.naturalWidth&&img.currentSrc&&img.loading!=='lazy')fail()});
}
function render(d){
  data=d;
  $('#chapters').innerHTML=featured.map((id,i)=>{const p=d.projects[id];return '<article class="chapter" id="project-'+num(i)+'" data-era="'+eras[id]+'"><p class="eyebrow">'+num(i)+' · '+company(p)+'</p><h3>'+esc(p.title)+'</h3>'+(p.category?'<p class="scope">'+esc(p.category)+'</p>':'')+'<div class="mobile-visual">'+cover(id,i===0)+'</div>'+'<p>'+esc(p.summary)+'</p>'+(p.outcomes?.length?'<dl class="outcomes">'+p.outcomes.map(([v,l])=>'<div><dt>'+esc(v)+'</dt><dd>'+esc(l)+'</dd></div>').join('')+'</dl>':'')+'<button class="button text" type="button" data-case="'+id+'">View case study <span aria-hidden="true">↗</span></button></article>'}).join('');
  $('#stage-frame').innerHTML=featured.map((id,i)=>cover(id,i===0)).join('');
  $('#progress').innerHTML=featured.map((id,i)=>'<a href="#project-'+num(i)+'" aria-label="'+esc(d.projects[id].title)+'"></a>').join('')+'<span class="progress-marker" aria-hidden="true"></span>';
  $('#more-list').innerHTML=secondary.map(id=>{const p=d.projects[id];return '<div class="more-row"><button class="more-open" type="button" data-case="'+id+'"><span>'+esc(p.title)+'</span><span aria-hidden="true">↗</span></button>'+company({...p,organisation:p.label||p.organisation})+'</div>'}).join('');
  $('#stage-count').innerHTML='<span class="flip" id="stage-flip" aria-hidden="true"></span><span class="sr-only" id="stage-num"></span> / '+String(featured.length).padStart(2,'0');
  chapters=$$('.chapter');stageLayers=$$('#stage-frame .visual');progress=$$('#progress a');marker=$('.progress-marker');
  $$('.more-open>span:first-child').forEach(lift);$$('.button').forEach(roll);
  bindMedia($('#work'));setActive(0);observeReveals();layout=true;queue();
}
function placeMarker(){if(!marker||active<0)return;const a=progress[active];markerTarget=a.offsetLeft+a.offsetWidth/2;if(markerX===null){markerX=markerTarget;marker.style.transform='translateX('+markerX+'px)'}queue()}
function setActive(i){
  if(i===active||!data)return;
  const prev=active,dir=prev<0||i>prev?'down':'up';active=i;
  $('#stage-frame').dataset.dir=dir;
  stageLayers.forEach((el,n)=>{el.classList.toggle('current',i===n);el.classList.toggle('leaving',n===prev);el.setAttribute('aria-hidden',String(i!==n))});
  if(prev>=0)splitSwap(stageLayers[prev],stageLayers[i],dir);
  progress.forEach((el,n)=>{if(i===n)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current')});
  $('.stage').dataset.era=eras[featured[i]];placeMarker();
  scramble($('#stage-company'),data.projects[featured[i]].company);
  flip($('#stage-flip'),num(i));$('#stage-num').textContent=num(i);
}
/* Counter — Google's number flipper (ai-number-flipper): each digit is a column of
   0-9 repeated three times; the column slides to the new digit in .3 s, rolling through
   the digits between. The third set is used when a column wraps, so it never spins backwards. */
function flip(el,value){
  if(!el)return;const digits=String(value).split('');
  if(!el.cols||el.cols.length!==digits.length){
    el.innerHTML=digits.map(()=>'<span class="flip-col">'+Array.from({length:30},(_,k)=>'<span>'+(k%10)+'</span>').join('')+'</span>').join('');
    el.cols=[...el.children];el.vals=digits.map(()=>0);
  }
  const unit=el.cols[0].firstElementChild.getBoundingClientRect().height;if(!unit)return;
  const at=(d,set)=>unit*(+d+10*(set-1));
  el.classList.remove('animate');
  digits.forEach((d,n)=>{if(el.vals[n]!==+d)el.cols[n].style.transform='translateY(-'+at(el.vals[n],2)+'px)'});
  requestAnimationFrame(()=>{
    el.classList.add('animate');
    digits.forEach((d,n)=>{const y=Math.abs(el.vals[n]-+d)>=10?at(d,el.vals[n]>+d?1:3):at(d,2);el.cols[n].style.transform='translateY(-'+y+'px)';el.vals[n]=+d});
  });
}
const dialog=$('#case-dialog'), scroll=$('#case-scroll');
function figure(a){return a?.src?'<figure class="case-figure">'+media(a.src,a.caption)+'<figcaption>'+esc(a.caption)+(a.kind?' · '+esc(a.kind):'')+'</figcaption></figure>':''}
function gallery(g){if(!g?.images?.length)return '';return '<figure class="case-figure"><div class="gallery">'+g.images.map(a=>'<div class="gallery-item">'+(a.webm?'<video autoplay muted loop playsinline preload="metadata" width="800" height="600" aria-label="'+esc(a.title)+'"><source src="'+esc(a.webm)+'" type="video/webm"></video>':media(a.src,a.title))+'<span>'+esc(a.title)+'</span></div>').join('')+'</div><figcaption>'+esc(g.caption)+'</figcaption></figure>'}
function framework(f){if(!f)return '';return '<div class="framework"><h4>'+esc(f.title)+'</h4><ol>'+f.steps.map(([a,b])=>'<li><strong>'+esc(a)+'</strong> — '+esc(b)+'</li>').join('')+'</ol><p class="eyebrow">'+esc(f.caption)+'</p></div>'}
function stats(a){return a?.length?'<div class="stats">'+a.map(([v,l])=>'<div class="stat"><b>'+esc(v)+'</b><span>'+esc(l)+'</span></div>').join('')+'</div>':''}
/* Case study v2 (Editorial Master): one reading column; media sits directly after the paragraph it illustrates. */
function items(run){const compact=run.every(([,d])=>String(d||'').length<130);return '<ul class="items '+(compact?'compact':'stacked')+'">'+run.map(([t,d])=>'<li><b>'+esc(t)+'</b>'+(d?'<span>'+esc(d)+'</span>':'')+'</li>').join('')+'</ul>'}
function table(t){return '<div class="case-table" role="table"><div class="tr th" role="row">'+t.head.map(h=>'<span role="columnheader">'+esc(h)+'</span>').join('')+'</div>'+t.rows.map(r=>'<div class="tr" role="row">'+r.map(c=>'<span role="cell">'+esc(c)+'</span>').join('')+'</div>').join('')+'</div>'}
function recframework(f){return '<figure class="case-figure recframework"><figcaption>'+esc(f.caption)+'</figcaption><ol class="rf">'+f.columns.map(c=>'<li class="rf-col"><p class="rf-n">'+esc(c.n)+'</p><h4>'+esc(c.title)+'</h4><ul>'+c.items.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+(c.exit&&c.exit.length?'<p class="rf-exit"><span aria-hidden="true">→</span>'+c.exit.map(esc).join(' ')+'</p>':'')+'</li>').join('')+'</ol></figure>'}
function outcomesGrid(rows){return '<dl class="case-outcomes">'+rows.map(([l,v])=>'<div><dt>'+esc(v)+'</dt><dd>'+esc(l)+'</dd></div>').join('')+'</dl>'}
function blocks(list){let html='',run=[];const flush=()=>{if(run.length){html+=items(run);run=[]}};
  list.forEach(b=>{if(b.item){run.push(b.item);return}flush();
    if(b.p)html+='<p>'+rich(b.p)+'</p>';else if(b.h4)html+='<h4>'+esc(b.h4)+'</h4>';else if(b.table)html+=table(b.table);
    else if(b.figure)html+=figure(b.figure);else if(b.gallery)html+=gallery(b.gallery);else if(b.framework)html+=framework(b.framework);
    else if(b.recframework)html+=recframework(b.recframework);else if(b.outcomes)html+=outcomesGrid(b.outcomes)});
  flush();return html}
function overview(p){if(!p.overview?.length)return '';const labels=['The challenge','My contribution',['Athena Education','WhiteTable'].includes(p.company)?'Deliverables':'Outcome'];return '<aside class="case-overview" aria-label="At a glance"><h3>At a glance</h3><dl>'+p.overview.map((v,i)=>'<div><dt>'+esc(labels[i])+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl></aside>'}
function caseV2(p){const c=p.case,S=c.sections;
  return '<article class="case-article v2"><header class="case-intro"><p class="crumb">'+esc(c.breadcrumb)+'</p><h2 id="case-title">'+esc(c.title)+'</h2><p class="lead">'+esc(c.category)+'</p>'+company(p)+'</header>'+overview(p)
   +(c.stats&&c.stats.length?'<dl class="case-stats">'+c.stats.map(([v,l])=>'<div><dt>'+esc(v)+'</dt><dd>'+esc(l)+'</dd></div>').join('')+'</dl>':'')
   +'<nav class="case-contents" aria-label="Case study contents">'+S.map((s,i)=>'<a href="#case-section-'+i+'">'+esc(s.nav||s.title)+'</a>').join('')+'</nav>'
   +S.map((s,i)=>'<section id="case-section-'+i+'"><p class="section-label">'+num(i)+'</p><h3>'+esc(s.title)+'</h3>'+blocks(s.blocks)+'</section>').join('')
   +(c.sources&&c.sources.length?'<section class="references"><p class="section-label">'+esc(c.referenceTitle||'References')+'</p><ul>'+c.sources.map(r=>'<li><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.label)+' ↗</a></li>').join('')+'</ul></section>':'')
   +'</article>'}
/* The contents rail follows the reader: the section crossing 35% of the case viewport is current. */
function caseSpy(){const links=$$('.case-contents a',scroll);if(!links.length)return;const y=scroll.getBoundingClientRect().top+scroll.clientHeight*.35;let on=0;links.forEach((a,i)=>{const el=$(a.getAttribute('href'),scroll);if(el&&el.getBoundingClientRect().top<=y)on=i});links.forEach((a,i)=>a.classList.toggle('on',i===on))}
function openCase(id,trigger){
  const p=data?.projects[id];if(!p)return;opener=trigger;setFollow(false);
  const a=p.article||{}, chapters=p.chapters||[];
  dialog.dataset.era=eras[id]||'blue';
  $('#case-company').textContent=p.company;
  scroll.innerHTML=p.case?caseV2(p):'<article class="case-article"><div class="case-intro"><p class="eyebrow">'+esc(a.meta||p.engagement||p.company)+'</p><h2 id="case-title">'+esc(a.title||p.title)+'</h2><p class="lead">'+esc(a.subtitle||p.summary||p.problem)+'</p>'+(a.metric?'<p class="metric">'+esc(a.metric)+'</p><p>'+esc(a.metricLabel)+'</p>':'')+company(p)+'</div>'+overview(p)+stats(a.stats)+'<nav class="case-contents" aria-label="Case study contents">'+chapters.map((c,i)=>'<a href="#case-section-'+i+'">'+esc(c.label)+'</a>').join('')+'</nav>'+chapters.map((c,i)=>'<section id="case-section-'+i+'">'+(c.label&&c.label!==c.title?'<p class="section-label">'+esc(c.label)+'</p>':'')+'<h3>'+esc(c.title)+'</h3>'+c.paragraphs.map(t=>'<p>'+rich(t)+'</p>').join('')+figure(a.artifacts?.[i])+framework(a.frameworks?.[i])+gallery(a.galleries?.[i])+(a.slideshows?.[i]?gallery({caption:'Behavioural science principles',images:a.slideshows[i]}):'')+'</section>').join('')+(a.sources?.length?'<section class="sources"><h3>'+esc(a.referenceTitle||'References')+'</h3>'+a.sources.map(x=>'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+' ↗</a>').join('')+'</section>':'')+'</article>';
  bindMedia(scroll);
  /* Landscape media spans the full width of the case; portrait media pairs up two per row. */
  $$('.gallery-item',scroll).forEach(item=>{const m=$('img,video',item);if(!m)return;const mark=()=>{const w=m.naturalWidth||m.videoWidth,h=m.naturalHeight||m.videoHeight;if(w&&h&&h>w*1.05)item.classList.add('is-portrait')};if(m.tagName==='VIDEO')m.addEventListener('loadedmetadata',mark,{once:true});else if(m.complete)mark();else m.addEventListener('load',mark,{once:true})});
  $$('video',scroll).forEach(v=>{v.muted=true;if(reduced.matches){v.removeAttribute('autoplay');v.controls=true}else v.play?.().catch(()=>{v.controls=true})});
  dialog.showModal();scroll.scrollTop=0;caseProgress();caseSpy();$('#close-case').focus();
  /* The case view scrolls inside the dialog: the page stops, and the case gets its own instance. */
  if(smooth){lenis.stop();caseLenis=new Lenis({wrapper:scroll,content:scroll.firstElementChild,lerp:.085,autoRaf:true})}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(b)openCase(Number(b.dataset.case),b)});
$('#close-case').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{ caseLenis?.destroy();caseLenis=null;lenis?.start();$$('video',scroll).forEach(v=>v.pause());scroll.replaceChildren();opener?.focus();});
/* Reading progress across the case. */
const caseBar=$('#case-progress-bar');
function caseProgress(){const r=scroll.scrollHeight-scroll.clientHeight;caseBar.style.transform='scaleX('+(r>0?Math.min(1,scroll.scrollTop/r):0).toFixed(4)+')'}
scroll.addEventListener('scroll',()=>{caseProgress();caseSpy()},{passive:true});
scroll.addEventListener('click',e=>{const a=e.target.closest('.case-contents a');if(!a)return;const el=$(a.getAttribute('href'),scroll);if(el){e.preventDefault();if(caseLenis){caseLenis.scrollTo(el,{offset:-24});return}el.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'})}});
$('#copy-email')?.addEventListener('click',async()=>{const btn=$('#copy-email'),addr=$('#email').textContent,status=$('#copy-status');try{await navigator.clipboard.writeText(addr);status.textContent='Copied';rollTo(btn,'Copied');btn.classList.add('done');haptic([10,40,10])}catch{status.textContent='Select and copy the email address.'}clearTimeout(copyTimer);copyTimer=setTimeout(()=>{status.textContent='';rollTo(btn,'Copy email');btn.classList.remove('done')},1600)});
/* Single visual vocabulary: flat isometric modules (Lottie-like), in the era colour. */
function svg(tag,attrs={}){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el}
/* Career scenes live in scenes.js; this controller scrubs their build and runs their ambient loop. */
const milestones=$$('.milestone').map((el,i)=>({el,p:1,...Scenes.create($('.milestone-art',el),i)}));
let ambientOn=false;
function ambient(t){let any=false;milestones.forEach(m=>{const r=m.el.getBoundingClientRect();if(m.p>=1&&r.bottom>0&&r.top<innerHeight){m.tick(t/1000);any=true}});if(!any)ambientOn=false;return any}
/* Career journey — Google timeline mechanics: grey stations joined by U-dip arcs; one era-coloured ball
   dwells at each station and travels between them, following with damped lerp (≈ .18 per frame at 60 fps). */
const career=$('#career'),track=$('#career-track'),path=$('#track-base'),ball=$('#track-ball'),stationGroup=$('#track-stations');
const stations=milestones.map(()=>{const g=svg('g'),o1=svg('circle',{r:22,class:'orbit'}),o2=svg('circle',{r:36,class:'orbit outer'}),c=svg('circle',{r:10.5,class:'station'});g.append(o2,o1,c);stationGroup.append(g);return {g,o1,o2,c}});
let pts=[],trackLen=0,stationL=[],stationY=[],eraColors=[],ballL=null,lastTick=0,arrived=-1,ballEra=-1;
const navLinks=$$('.navigation a'),indicator=$('.nav-indicator');
const navSections=navLinks.map(a=>$(a.getAttribute('href')));
let navActive=-2;
function measure(){
  const box=career.getBoundingClientRect(),mobile=matchMedia('(max-width:768px)').matches,w=box.width,h=box.height;
  track.setAttribute('viewBox','0 0 '+w+' '+h);
  const x=mobile?20:w/2;
  stationY=milestones.map(m=>m.el.offsetTop+m.el.offsetHeight/2);
  eraColors=milestones.map(m=>getComputedStyle(m.el).getPropertyValue('--era').trim());
  /* Start above the first station, U-dip between stations (dip = distance × .17 + 30, alternating sides), end below the last. */
  let d='M'+x+' 0 L'+x+' '+stationY[0];
  for(let i=0;i<stationY.length-1;i++){
    const a=stationY[i],b=stationY[i+1],dist=b-a,dip=mobile?Math.min(18,dist*.05):Math.min(160,dist*.17+30),side=mobile?1:(i%2?1:-1),k=dip/.75;
    d+=' C'+(x+side*k)+' '+(a+dist*.06)+' '+(x+side*k)+' '+(b-dist*.06)+' '+x+' '+b;
  }
  d+=' L'+x+' '+h;path.setAttribute('d',d);trackLen=path.getTotalLength();
  pts=Array.from({length:601},(_,i)=>path.getPointAtLength(trackLen*i/600));
  stationL=stationY.map(y=>{let best=0,bd=1e9;pts.forEach((p,i)=>{const dd=Math.abs(p.y-y)+Math.abs(p.x-x)*.01;if(dd<bd){bd=dd;best=i}});return trackLen*best/600});
  stations.forEach((s,i)=>{const p=pointAt(stationL[i]);s.g.setAttribute('transform','translate('+p.x+' '+p.y+')');s.o1.setAttribute('stroke',eraColors[i]);s.o2.setAttribute('stroke',eraColors[i])});
}
function pointAt(l){const f=clamp(l/Math.max(1,trackLen))*600,i=Math.min(599,Math.floor(f)),q=f-i,a=pts[i],b=pts[i+1]||a;return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q}}
/* Scroll → length along the path, with dwell: the ball rests at a station for the first and last quarter of each interval. */
function targetLength(y){
  if(y<=stationY[0])return stationL[0];
  for(let i=0;i<stationY.length-1;i++){if(y<=stationY[i+1]){const u=clamp((y-stationY[i])/(stationY[i+1]-stationY[i])),v=clamp((u-.25)/.5),e=v*v*v*(v*(6*v-15)+10);return stationL[i]+(stationL[i+1]-stationL[i])*e}}
  return stationL[stationL.length-1];
}
function update(t){
  raf=0;const needsLayout=layout;layout=false;
  const dt=lastTick?Math.min(.05,(t-lastTick)/1000):1/60;lastTick=t;
  if(needsLayout){measure();placeMarker()}
  const h=innerHeight,top=scrollY,snap=reduced.matches,k=1-Math.exp(-dt*12);let again=false;
  const navRects=navSections.map(e=>e.getBoundingClientRect());
  const chapterRects=chapters.map(e=>e.getBoundingClientRect());
  const careerRect=career.getBoundingClientRect(),eraRects=milestones.map(m=>m.el.getBoundingClientRect());
  let n=-1;navRects.forEach((r,i)=>{if(r.top<=h*.35)n=i});if(top+h>=document.documentElement.scrollHeight-4)n=2;
  $('#header').classList.toggle('scrolled',top>8);
  if(n!==navActive||needsLayout){navActive=n;navLinks.forEach((a,i)=>{if(i===n)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});if(n<0)indicator.style.opacity='0';else{const a=navLinks[n];indicator.style.transform='translateX('+a.offsetLeft+'px) scaleX('+(a.offsetWidth/32)+')';indicator.style.opacity='1'}}
  if(chapters.length){let i=0;chapterRects.forEach((r,j)=>{if(r.top<=h*.48)i=j});setActive(i)}
  /* Project navigation ball. */
  if(marker&&markerX!==null){if(snap)markerX=markerTarget;else{markerX+=(markerTarget-markerX)*k;if(Math.abs(markerTarget-markerX)>.3)again=true;else markerX=markerTarget}marker.style.transform='translateX('+markerX.toFixed(2)+'px)'}
  /* Career ball. */
  if(pts.length){
    const target=targetLength(h*.5-careerRect.top);
    if(ballL===null||snap||needsLayout&&Math.abs(target-ballL)>h)ballL=target;
    else{ballL+=(target-ballL)*k;if(Math.abs(target-ballL)>.3)again=true;else ballL=target}
    const p=pointAt(ballL);ball.setAttribute('cx',p.x.toFixed(2));ball.setAttribute('cy',p.y.toFixed(2));
    let near=0;stationL.forEach((l,i)=>{if(Math.abs(l-ballL)<Math.abs(stationL[near]-ballL))near=i});
    const at=Math.abs(stationL[near]-ballL)<3?near:-1;
    if(near!==ballEra){ballEra=near;ball.style.fill=eraColors[near]}
    if(at!==arrived){arrived=at;milestones.forEach((m,i)=>{m.el.classList.toggle('arrived',i===at);stations[i].o1.classList.toggle('on',i===at);stations[i].o2.classList.toggle('on',i===at)})}
  }
  /* Illustrations build with the scroll: 0 when the milestone's centre enters the viewport, complete when it reaches the middle — the moment the ball arrives. */
  milestones.forEach((m,i)=>{const r=eraRects[i],c=r.top+r.height/2,p=snap?1:clamp((h-c)/(h*.46));m.p=p;m.draw(p)});
  if(!snap&&!ambientOn&&milestones.some((m,i)=>m.p>=1&&eraRects[i].bottom>0&&eraRects[i].top<h)){ambientOn=true;animate(ambient)}
  /* Era copy: one scroll-driven state per milestone (no second controller). Fully on while its centre is inside the viewport band, fully off outside; hysteresis stops flicker at the edges. */
  milestones.forEach((m,i)=>{const r=eraRects[i],c=r.top+r.height/2,on=m.el.classList.contains('in');const show=snap||(on?(c<h*.86&&c>h*.06):(c<h*.74&&c>h*.14));if(show!==on)m.el.classList.toggle('in',show)});
  status(h);
  if(px>=0)followTarget();
  if(tickers.size){tickers.forEach(f=>{if(f(t,dt)===false)tickers.delete(f)});if(tickers.size)again=true}
  if(again)queue();else lastTick=0;
}
/* Status pill (Desk): reflects where you are, using only text already on the page. */
const pill=$('#status'),pillText=$('#status-text'),statusSections=['#work','#experience','#exploring','#contact'].map(q=>$(q));
let pillKey='';
const dock=$('.dock');
function status(h){
  dock?.classList.toggle('away',scrollY<h*.45);
  if(!pill)return;let s=-1;statusSections.forEach((el,i)=>{if(el.getBoundingClientRect().top<=h*.5)s=i});
  let text='',era='';
  if(s===0&&data&&active>=0){text=data.projects[featured[active]].company+' · '+num(active)+' / '+String(featured.length).padStart(2,'0');era=eras[featured[active]]}
  else if(s===1){const i=Math.max(0,arrived>=0?arrived:ballEra);text=$('.milestone-copy .eyebrow',milestones[i].el).textContent;era=milestones[i].el.dataset.era}
  else if(s>=2){text=($('.eyebrow',statusSections[s])||$('h2',statusSections[s])).textContent;era='blue'}
  const key=text+era;if(key===pillKey)return;pillKey=key;
  pill.classList.toggle('on',!!text);if(text){scramble(pillText,text);$('#status-live').textContent=text}if(era)pill.dataset.era=era;
}
/* Theme toggle (Desk): light / dark, remembered per viewer when storage is available. */
const themeBtn=$('#theme-toggle');
function applyTheme(t){if(t==='dark')document.documentElement.dataset.theme='dark';else delete document.documentElement.dataset.theme;themeBtn?.setAttribute('aria-label',t==='dark'?'Switch to light theme':'Switch to dark theme');layout=true;queue();document.dispatchEvent(new Event('themechange'))}
themeBtn?.addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('desk-theme',t)}catch(e){}applyTheme(t)});
if(document.documentElement.dataset.theme==='dark')themeBtn?.setAttribute('aria-label','Switch to light theme');
function queue(){if(!raf)raf=requestAnimationFrame(update)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{layout=true;queue()},{passive:true});reduced.addEventListener?.('change',()=>queue());
if('ResizeObserver'in window)new ResizeObserver(()=>{layout=true;queue()}).observe(career);
/* Reveals: blocks below the fold rise in with Google timings; anything already in view plays immediately. */
let revealObserver;
function observeReveals(){
  const els=$$('.bridge,.section-heading,.chapter,.more-row,.topics article,.contact-email');
  if(reduced.matches||!('IntersectionObserver'in window)){els.forEach(el=>el.classList.add('reveal-visible'));return}
  revealObserver??=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('reveal-pending');e.target.classList.add('reveal-visible');revealObserver.unobserve(e.target)}}),{threshold:0,rootMargin:'0px 0px -10% 0px'});
  els.forEach(el=>{if(el.dataset.observed)return;el.dataset.observed='true';[...el.children].forEach((c,i)=>c.style.setProperty('--order',i));if(el.getBoundingClientRect().top<innerHeight){el.classList.add('reveal-visible');return}el.classList.add('reveal-pending');revealObserver.observe(el)});
}
/* Text: hero title and body, then each section title. */
const heroEl=$('.hero');
splitWords($('#hero-title'),'title','.34s');splitWords($('.bridge .statement'),'body','.1s');
$$('.section-heading h2').forEach(h=>splitWords(h,'title','.1s'));
requestAnimationFrame(()=>requestAnimationFrame(()=>heroEl?.classList.add('intro-animation')));
observeReveals();queue();
fetch('content.json').then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(render).catch(()=>{$('#chapters').innerHTML='<p role="alert">Case studies could not be loaded. Please refresh the page or contact me directly.</p>'});

/* ——— Interaction layer (Framer University patterns, adapted) ———————————————— */
const fine=matchMedia('(hover:hover) and (pointer:fine)');

/* Haptic tap on phones. Android only: Safari on iPhone exposes no vibration API. */
function haptic(p){try{navigator.vibrate?.(p)}catch{}}
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.target.closest?.('.button,.dock a,.theme-toggle,.more-open,.progress a'))haptic(8)},{passive:true});

/* Label slide: two stacked copies of the label; on hover the first exits upward as the second rises.
   The arrow glyph becomes a pair too, so one copy leaves along its direction as the other arrives. */
const letters=text=>esc(text);
function roll(btn){
  if(btn.dataset.roll)return;const node=[...btn.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(!node)return;
  const text=node.textContent.trim(),s=document.createElement('span');btn.dataset.roll='1';s.className='roll';
  s.innerHTML='<span class="sr-only">'+esc(text)+'</span><span class="roll-a" aria-hidden="true">'+letters(text)+'</span><span class="roll-b" aria-hidden="true">'+letters(text)+'</span>';
  node.replaceWith(s);
  const g=[...btn.children].find(n=>n.matches('span[aria-hidden]')&&!n.classList.contains('roll'));
  if(g){const ch=g.textContent.trim();g.className='arr';g.dataset.glyph=ch==='↓'?'down':ch==='×'?'close':'diag';g.innerHTML='<span>'+esc(ch)+'</span><span>'+esc(ch)+'</span>'}
  if(btn.id==='copy-email')btn.insertAdjacentHTML('afterbegin','<svg class="copy-check" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.4 5.6 10.3 11.5 3.8"/></svg>');
}
function rollTo(btn,text){
  const r=$('.roll',btn);if(!r){btn.textContent=text;return}
  $('.sr-only',r).textContent=text;const a=$('.roll-a',r),b=$('.roll-b',r);
  if(reduced.matches){a.innerHTML=b.innerHTML=letters(text);return}
  b.innerHTML=letters(text);r.style.minWidth=Math.max(r.offsetWidth,b.scrollWidth)+'px';r.classList.add('swap');
  clearTimeout(r.t);r.t=setTimeout(()=>{a.innerHTML=b.innerHTML=letters(text);r.classList.remove('swap');r.style.minWidth=''},620);
}

/* Title ripple for the secondary project rows. Words stay unbreakable so titles still wrap cleanly. */
function lift(el){
  if(el.classList.contains('lift'))return;const text=el.textContent;let k=0;
  el.innerHTML='<span class="sr-only">'+esc(text)+'</span><span aria-hidden="true">'+text.split(/(\s+)/).map(w=>/^\s*$/.test(w)?w:'<span class="w">'+[...w].map(ch=>'<i style="--i:'+(k++)+'">'+esc(ch)+'</i>').join('')+'</span>').join('')+'</span>';
  el.classList.add('lift');
}

/* Mono-label scramble: letters cycle and resolve left to right when a label changes. */
const GLYPHS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el,text){
  if(!el||el.dataset.target===text)return;el.dataset.target=text;
  if(reduced.matches||!el.textContent.trim()){el.textContent=text;return}
  const chars=[...text],n=Math.max(1,chars.length);let start=0;
  animate(t=>{
    if(el.dataset.target!==text)return false;if(!start)start=t;const p=Math.min(1,(t-start)/520);
    el.textContent=chars.map((ch,i)=>!/[A-Za-z0-9]/.test(ch)||p>=.2+.8*i/n?ch:GLYPHS[(Math.random()*GLYPHS.length)|0]).join('');
    return p<1;
  });
}

/* Magnetic controls (iPadOS-style): the control leans toward the pointer and springs back. */
function magnetic(el,strength,max){
  el.addEventListener('pointermove',e=>{if(!fine.matches||reduced.matches)return;const r=el.getBoundingClientRect(),c=v=>Math.max(-max,Math.min(max,v)).toFixed(2)+'px';
    el.style.setProperty('--mx',c((e.clientX-r.left-r.width/2)*strength));el.style.setProperty('--my',c((e.clientY-r.top-r.height/2)*strength))});
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px')});
}
$$('.hero .actions .button,#contact .button,#close-case').forEach(el=>magnetic(el,.28,6));
$$('.dock a,.theme-toggle').forEach(el=>magnetic(el,.22,4));
$$('#contact .button,#close-case').forEach(roll);

/* Cursor follower: a "View case study" pill that trails the pointer over the project stage and the
   secondary project rows. Position comes from the controller's spring; CSS only fades and scales it. */
const follow=document.createElement('div');follow.className='follow';follow.setAttribute('aria-hidden','true');
follow.innerHTML='<div class="follow-inner"><span class="follow-label">View case study <span>↗</span></span></div>';
document.body.append(follow);
let px=-1,py=-1,fx=0,fy=0,fOn=false,fSnap=true,fRunning=false;
function setFollow(on,key){
  $('#stage-frame')?.classList.toggle('has-follow',key==='stage');
  if(on&&!fOn)fSnap=true;if(on!==fOn){fOn=!!on;follow.classList.toggle('on',fOn)}
  if(fOn&&!fRunning){fRunning=true;animate(followTick)}
}
function followTarget(){
  if(!fine.matches||reduced.matches||dialog.open||px<0)return setFollow(false);
  const el=document.elementFromPoint(px,py);if(!el)return setFollow(false);
  if(el.closest('.more-row')&&!el.closest('.company-link'))return setFollow(true,'row');
  const stage=el.closest('#stage-frame');if(stage&&stage.offsetParent)return setFollow(true,'stage');
  setFollow(false);
}
function followTick(t,dt){
  const tx=px+16,ty=py+18;if(fSnap){fx=tx;fy=ty;fSnap=false}
  const k=1-Math.exp(-dt*22);fx+=(tx-fx)*k;fy+=(ty-fy)*k;
  follow.style.transform='translate3d('+fx.toFixed(1)+'px,'+fy.toFixed(1)+'px,0)';
  if(Math.abs(tx-fx)<.2&&Math.abs(ty-fy)<.2){fRunning=false;return false}
  return true;
}
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;px=e.clientX;py=e.clientY;followTarget();if(fOn&&!fRunning){fRunning=true;animate(followTick)}},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{px=-1;setFollow(false)});
$('#stage-frame').addEventListener('click',()=>{const b=$('#project-'+num(active)+' [data-case]');if(b)openCase(Number(b.dataset.case),b)});

/* Split transition for the sticky stage: the outgoing project falls away in strips while the next
   rises in, staggered in the scroll direction. A swap requested mid-split (fast scrolling) cancels
   it and falls back to the plain crossfade, so the stage never queues up a backlog of motion. */
let splitBusy=null;
function splitSwap(from,to,dir){
  const frame=$('#stage-frame');
  if(splitBusy){splitBusy.cancel();return}
  if(reduced.matches||!frame.offsetParent||!from||!to||typeof frame.animate!=='function')return;
  const N=7,down=dir==='down'?1:-1,order=k=>down>0?k:N-1-k;
  const make=src=>{const layer=document.createElement('div');layer.className='strip-layer';const parts=[];
    for(let k=0;k<N;k++){const s=src.cloneNode(true);s.classList.remove('current','leaving');s.classList.add('strip');s.setAttribute('aria-hidden','true');
      $$('img',s).forEach(i=>i.loading='eager');
      s.style.clipPath='inset(0 '+Math.max(0,100-(k+1)*100/N-.2).toFixed(3)+'% 0 '+(k*100/N).toFixed(3)+'%)';
      s.style.transformOrigin=((k+.5)*100/N).toFixed(2)+'% 50%';layer.append(s);parts.push(s)}
    frame.append(layer);return {layer,parts}};
  const out=make(from),inn=make(to),anims=[];
  frame.classList.add('splitting');
  out.parts.forEach((s,k)=>anims.push(s.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY('+(-down*22)+'px) rotateX('+(down*16)+'deg) scale(.98)'}],{duration:340,delay:order(k)*28,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'})));
  inn.parts.forEach((s,k)=>anims.push(s.animate([{opacity:0,transform:'translateY('+(down*30)+'px) rotateX('+(-down*20)+'deg)'},{opacity:1,transform:'none'}],{duration:620,delay:150+order(k)*44,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'})));
  const clear=()=>{out.layer.remove();inn.layer.remove();frame.classList.remove('splitting');splitBusy=null};
  splitBusy={cancel(){anims.forEach(a=>a.cancel());clear()}};
  Promise.all(anims.map(a=>a.finished)).then(()=>{to.style.transition='none';clear();void to.offsetWidth;requestAnimationFrame(()=>{to.style.transition=''})},()=>{});
}
