/* Hero: complexity resolving into connected intelligence.
   Restored from intelligence-motion.js (commit f99b4ce): same particle model, phase timings and camera path.
   Refinements: perspective-scaled particles with atmospheric depth, soft floor shadow, lit core,
   damped pointer parallax + local field, one-shot performance that settles into a living idle state.
   Colours: Google Material palette from styles.css tokens. */
(()=>{
'use strict';
const root=document.documentElement,hero=document.querySelector('.hero'),mount=document.getElementById('hero-art');
if(!hero||!mount)return;
const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:true});
if(!ctx)return;
canvas.setAttribute('aria-hidden','true');mount.append(canvas);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(x*(6*x-15)+10)},mix=(a,b,t)=>a+(b-a)*t;

/* Colours come from the design tokens (styles.css) so the palette has a single source. */
const tok=n=>getComputedStyle(root).getPropertyValue(n).trim();
const rgb=h=>{h=h.replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255]};
let palette,inkRGB,lineRGB,ramps,solid,lineColor;
const LEVELS=8,tint=(c,k)=>'rgb('+c.map(v=>Math.round(v+(255-v)*k)).join(',')+')';
/* Pre-built depth ramps: far particles drift toward the white canvas (atmospheric perspective). */
function readPalette(){
 palette=['--blue','--red','--yellow','--green'].map(n=>rgb(tok(n)||'#888'));inkRGB=rgb(tok('--grey-900')||'#202124');lineRGB=rgb(tok('--grey-500')||'#9aa0a6');
 const paper=rgb(tok('--paper')||'#ffffff');
 /* Far particles fade toward the page colour, so depth reads in light and dark themes. */
 ramps=palette.map(c=>Array.from({length:LEVELS},(_,l)=>{const k=l/(LEVELS-1)*.55;return 'rgb('+c.map((v,j)=>Math.round(v+(paper[j]-v)*k)).join(',')+')'}));
 solid=palette.map(c=>tint(c,0));lineColor=tint(lineRGB,0);
}
readPalette();
document.addEventListener('themechange',()=>{readPalette();if(reduced.matches)still();else if(started)draw(timeline(clock),clock)});

/* Particle model — identical to the original. */
const count=192,per=48,rand=i=>{const x=Math.sin(i*127.1+78.233)*43758.5453;return x-Math.floor(x)};
const P=Array.from({length:count},(_,i)=>{
 const g=Math.floor(i/per),k=i%per,v=Math.acos(1-2*(i+.5)/count),u=i*2.3999632297;
 return {g,k,a:k*2.3999632297,b:Math.acos(1-2*(k+.5)/per),phase:rand(i+400)*TAU,size:1.4+rand(i+200)*1.8,delay:rand(i+50)*.48,
  x:Math.sin(v)*Math.cos(u)*(116+rand(i+82)*52),y:Math.cos(v)*122,z:Math.sin(v)*Math.sin(u)*156};
});
const edges=[];
for(let g=0;g<4;g++)for(let k=0;k<per;k++){
 const i=g*per+k;edges.push({i,j:g*per+(k+1)%per,kind:0,phase:rand(i+500)});
 if(k%3===0)edges.push({i,j:g*per+(k+7)%per,kind:1,phase:rand(i+600)});
 if(k%9===0)edges.push({i,j:((g+1)%4)*per+(k+5)%per,kind:2,phase:rand(i+700)});
}
/* Resolved form: four equal great circles at even 45° intervals around one axis — an armillary structure. */
const TILT=[-1.1781,-.3927,.3927,1.1781],RING=96;
/* Screen-space buffers, reused every frame (no per-frame allocation). */
const SX=new Float32Array(count),SY=new Float32Array(count),SD=new Float32Array(count),SF=new Float32Array(count);
const SL=new Uint8Array(count),LC=new Uint16Array(LEVELS*4),LI=new Uint16Array(LEVELS*4*count);
const AQ=32,EMAX=edges.length,EB=new Uint16Array(5*2*AQ),EL=new Uint16Array(5*2*AQ*EMAX),EX=new Float32Array(EMAX),EY=new Float32Array(EMAX);
const PK=[0,1,2,3].map(g=>edges.map((e,n)=>n).filter(n=>edges[n].kind===0&&edges[n].i%4===0&&P[edges[n].i].g===g));

let w=0,h=0,dpr=1,raf=0,clock=0,last=0,visible=true;
let px=0,py=0,tx=0,ty=0,fx=-1e4,fy=-1e4,field=0,fieldTarget=0,scrollP=0,scrollS=0;
/* Camera state, set once per frame. */
let ca=1,sa=0,cb=1,sb=0,cr=1,sr=0,scale=1,cx=0,cy=0,dist=500,PX=0,PY=0,PD=0,PF=1;
function camera(yaw,pitch,roll){ca=Math.cos(yaw);sa=Math.sin(yaw);cb=Math.cos(pitch);sb=Math.sin(pitch);cr=Math.cos(roll);sr=Math.sin(roll)}
function project(x,y,z){
 const X=x*ca+z*sa,Z=-x*sa+z*ca,Y=y*cb-Z*sb,D=y*sb+Z*cb,f=dist/Math.max(140,dist+D);
 PX=cx+(X*cr-Y*sr)*scale*f;PY=cy+(X*sr+Y*cr)*scale*f;PD=D;PF=f;
}

/* Loop: build (0–7 s) → hold the structure → dissolve → build again from the start.
   The performance only ever runs forwards; the cycle never plays in reverse. */
const HOLD=1.8,DISSOLVE=.6,PERIOD=7+HOLD+DISSOLVE;
let loopFade=1,loopIdle=0;
function timeline(c){
 if(c<7){loopFade=1;loopIdle=0;return c}
 const u=(c-7)%PERIOD;
 if(u<HOLD){loopFade=1;loopIdle=u;return 7}
 if(u<HOLD+DISSOLVE){const x=clamp((u-HOLD)/DISSOLVE);loopFade=1-x*x*(3-2*x);loopIdle=HOLD;return 7}
 const t=u-HOLD-DISSOLVE;loopFade=ease(t/.5);loopIdle=0;return t;
}
function draw(t,c){
 if(!w||!h)return;
 /* Phase envelopes — unchanged from the original timeline. */
 const settled=ease((t-4.6)/2.4),organise=ease((t-.3)/2.3),assemble=ease((t-2.4)/3.3),intro=ease(t/.6);
 /* Idle: after the performance resolves, the rings keep breathing and the camera keeps a slow orbit. */
 const idleW=ease((loopIdle+.8)/2.6),idle=loopIdle*idleW,flow=idle*.05;
 const view=scrollS,disperse=ease(view*.95);
 const yaw=mix(-.88,.98,ease(t/6.8))+.22*Math.sin(idle*.23)+.045*idle+px*.2;
 const pitch=mix(.48,-.32,ease((t-.4)/5.8))+.10*Math.sin(idle*.24)+py*.12;
 const roll=mix(-.19,.06,ease(t/7.5));
 camera(yaw,pitch,roll);
 /* Fit the tallest phase (the opening sphere, ±122 + drift, near particles enlarged by perspective) inside the canvas. */
 scale=Math.min(w/400,h/390)*mix(1.12,1.04,ease(t/3.4))*(1-.16*disperse);
 cx=w/2;cy=h/2+view*9;dist=mix(430,670,ease(t/4.1));
 const fade=reduced.matches?1:.15+.85*ease(c/.45),alpha=fade*loopFade*(.72+.28*intro)*(1-.72*disperse);
 ctx.clearRect(0,0,w,h);

 /* Directional floor shadow: light from the upper left, so the shadow falls slightly right and gathers as the form resolves. */
 project(0,168,0);const sx=PX+14*scale,sy=PY,sRx=mix(150,96,assemble)*scale*PF,sRy=sRx*(.12+.16*Math.abs(Math.sin(pitch)));
 const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,sRx);sg.addColorStop(0,'rgba(79,44,9,'+(.13*alpha*(.35+.65*organise)).toFixed(3)+')');sg.addColorStop(.55,'rgba(79,44,9,'+(.05*alpha).toFixed(3)+')');sg.addColorStop(1,'rgba(79,44,9,0)');
 ctx.save();ctx.translate(sx,sy);ctx.scale(1,sRy/sRx);ctx.translate(-sx,-sy);ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,sRx,0,TAU);ctx.fill();ctx.restore();

 /* Particle positions (original model) + a soft pointer field in screen space. */
 const R=Math.min(w,h)*.22;
 for(let i=0;i<count;i++){
  const n=P[i],ga=n.g*Math.PI/2+.5;
  const tx=Math.cos(ga)*77+Math.sin(n.b)*Math.cos(n.a)*29,ty=Math.sin(ga)*77+Math.cos(n.b)*29,tz=Math.sin(n.b)*Math.sin(n.a)*29;
  const p=ease((t-.25-n.delay)/2.15),q=ease((t-2.35-n.delay)/3.1);
  const a=n.k/per*TAU+n.g*.14,tilt=TILT[n.g],radius=mix(83+n.g*12,RING,settled);
  const op=a+flow+.09*Math.sin(idle*.24+n.g)*(1-settled)+.018*Math.sin(idle*.65+n.phase)*(1-settled);
  const band=radius+7*Math.sin(op*2+n.g*.55)*(1-settled),ox=band*Math.cos(op),oy=band*Math.sin(op)*Math.cos(tilt),oz=band*Math.sin(op)*Math.sin(tilt);
  const drift=(1-p)*10+p*(1-q)*3;
  let x=mix(n.x,tx,p),y=mix(n.y,ty,p),z=mix(n.z,tz,p);
  x=mix(x,ox,q)+Math.sin(c*.83+n.phase)*drift;y=mix(y,oy,q)+Math.cos(c*.67+n.phase)*drift;z=mix(z,oz,q)+Math.sin(c*.51+n.phase)*drift;
  x=mix(x,n.x*1.55,disperse);y=mix(y,n.y*1.4,disperse);z=mix(z,n.z*1.3,disperse);
  project(x,y,z);
  if(field>.001){const dx=PX-fx,dy=PY-fy,d=Math.hypot(dx,dy);if(d<R&&d>.01){const k=(1-d/R);const push=k*k*field*12;PX+=dx/d*push;PY+=dy/d*push}}
  SX[i]=PX;SY[i]=PY;SD[i]=PD;SF[i]=PF;
 }

 /* Orbit trails: continuous spatial curves, one per group. */
 ctx.lineCap='round';
 for(let g=0;g<4;g++){
  const radius=mix(83+g*12,RING,settled),tilt=TILT[g];ctx.beginPath();
  for(let k=0;k<=96;k++){const a=k/96*TAU,band=radius+7*Math.sin(a*2+g*.55)*(1-settled);project(band*Math.cos(a),band*Math.sin(a)*Math.cos(tilt),band*Math.sin(a)*Math.sin(tilt));if(k)ctx.lineTo(PX,PY);else ctx.moveTo(PX,PY)}
  ctx.strokeStyle=solid[g];ctx.globalAlpha=assemble*.2*alpha;ctx.lineWidth=.8*scale;ctx.stroke();
 }
 /* Connections draw in, with depth-attenuated opacity; packets travel the ring links.
    Batched: edges are bucketed by colour, width and a quantised alpha, then each bucket is stroked once
    (≈280 strokes per frame become a few dozen). The quantisation step (1/32) is below visible resolution. */
 const maxD=Math.min(w,h)*.83;EB.fill(0);
 for(let n=0;n<edges.length;n++){
  const e=edges[n],ai=e.i,bi=e.j,ax=SX[ai],ay=SY[ai],bx=SX[bi],by=SY[bi];
  if(Math.hypot(ax-bx,ay-by)>maxD)continue;
  const fe=e.kind===0?mix(.16,.48,assemble)*organise:e.kind===1?.16*organise*(1-.7*assemble):.12*assemble;
  const rv=ease((t-1.35-e.phase*1.2)/1.8),depth=clamp(1-(SD[ai]+SD[bi])/520);
  const o=fe*rv*alpha*depth;if(o<.004)continue;
  const q=Math.min(AQ-1,Math.round(o*AQ)),col=e.kind===2?4:P[ai].g,key=((col*2+(e.kind===0?0:1))*AQ+q);
  EX[n]=mix(ax,bx,rv);EY[n]=mix(ay,by,rv);EL[key*EMAX+EB[key]++]=n;
 }
 for(let key=0;key<EB.length;key++){
  const cnt=EB[key];if(!cnt)continue;
  const q=key%AQ,wk=(key/AQ|0)%2,col=(key/AQ/2|0);
  ctx.beginPath();
  for(let m=0;m<cnt;m++){const n=EL[key*EMAX+m],e=edges[n];ctx.moveTo(SX[e.i],SY[e.i]);ctx.lineTo(EX[n],EY[n])}
  ctx.lineWidth=wk?.55:.8;ctx.strokeStyle=col===4?lineColor:solid[col];ctx.globalAlpha=q/AQ;ctx.stroke();
 }
 if(assemble>.15){
  const f0=c*.25;
  for(let g=0;g<4;g++){
   ctx.fillStyle=solid[g];
   for(const pass of [0,1]){
    const rr=(pass?2:5.2)*scale;ctx.beginPath();
    for(const n of PK[g]){const e=edges[n],f=(f0+e.phase)%1,x=mix(SX[e.i],SX[e.j],f),y=mix(SY[e.i],SY[e.j],f);ctx.moveTo(x+rr,y);ctx.arc(x,y,rr,0,TAU)}
    ctx.globalAlpha=assemble*(pass?.9:.12)*alpha;ctx.fill();
   }
  }
 }
 /* The core: a decision made from distributed information — a small lit sphere with a quiet halo. */
 project(0,0,0);const coreA=ease((t-4.1)/1.7)*alpha;
 if(coreA>.005){
  const r=4.6*scale*PF,breathe=.5+.5*Math.sin(c*1.6);
  ctx.globalAlpha=coreA*(.10+.06*breathe);ctx.fillStyle=solid[0];ctx.beginPath();ctx.arc(PX,PY,r*(3.1+.4*breathe),0,TAU);ctx.fill();
  const cg=ctx.createRadialGradient(PX-r*.4,PY-r*.45,r*.1,PX,PY,r);cg.addColorStop(0,'rgb(92,104,128)');cg.addColorStop(1,'rgb('+inkRGB+')');
  ctx.globalAlpha=coreA;ctx.fillStyle=cg;ctx.beginPath();ctx.arc(PX,PY,r,0,TAU);ctx.fill();
 }
 /* Particles back to front in 8 depth layers; size and tint follow depth. One fill per layer and group
    replaces 192 individual fills and the per-frame depth sort. */
 LC.fill(0);
 for(let i=0;i<count;i++){const d=clamp((SD[i]+170)/340),lv=Math.min(LEVELS-1,Math.round(d*(LEVELS-1)));SL[i]=lv;const key=lv*4+P[i].g;LI[key*count+LC[key]++]=i}
 for(let lv=LEVELS-1;lv>=0;lv--){
  const a=alpha*(1-.35*lv/(LEVELS-1));let hl=false;
  for(let g=0;g<4;g++){
   const key=lv*4+g,cnt=LC[key];if(!cnt)continue;ctx.beginPath();
   for(let m=0;m<cnt;m++){const i=LI[key*count+m],r=Math.max(1.1,P[i].size*scale*(.55+.6*SF[i]));ctx.moveTo(SX[i]+r,SY[i]);ctx.arc(SX[i],SY[i],r,0,TAU);if(r>2.6&&lv<3)hl=true}
   ctx.globalAlpha=a;ctx.fillStyle=ramps[g][lv];ctx.fill();
  }
  if(hl){ctx.beginPath();
   for(let g=0;g<4;g++){const key=lv*4+g;for(let m=0;m<LC[key];m++){const i=LI[key*count+m],r=Math.max(1.1,P[i].size*scale*(.55+.6*SF[i]));if(r>2.6){const x=SX[i]-r*.32,y=SY[i]-r*.34;ctx.moveTo(x+r*.32,y);ctx.arc(x,y,r*.32,0,TAU)}}}
   ctx.globalAlpha=alpha*.45;ctx.fillStyle='#fff';ctx.fill()}
 }
 ctx.globalAlpha=1;
}

function resize(){
 const r=mount.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,1.5);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 if(reduced.matches)still();else if(started)draw(timeline(clock),clock);
}
function still(){scrollS=0;px=py=field=0;loopFade=1;loopIdle=0;draw(7,20);}

/* ── Choreography ─────────────────────────────────────────────────────────────────────────────
   One composition on one clock. Nothing moves until the type is loaded and the main thread is quiet,
   so the first frames are never dropped; then the canvas performance and the text entrance start on
   the same frame. Text is a sequence of overlapping phases (eyebrow → headline lines → actions), each
   starting while the previous is still decelerating. Only opacity and transform are animated, through
   the Web Animations API, so the text runs on the compositor even while the canvas draws. */
const copy=hero.querySelector('.hero-copy'),eyebrow=hero.querySelector('.hero .eyebrow'),title=hero.querySelector('h1');
const actions=[...hero.querySelectorAll('.actions>.button')],statement=document.querySelector('.bridge .statement');
const OUT='cubic-bezier(.16,1,.3,1)';            // long, soft deceleration (expo-out family)
const T={eyebrow:120,title:260,line:90,actions:380,action:80,dur:1000,durShort:820};
let started=false,introAnims=[],introEnd=0;
const escH=x=>x.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Masked line reveal: the text is measured as laid out (same wrap, same balance), each rendered line is
   wrapped in a clipping row, and the row's content rises into place. The original text node is restored
   as soon as the reveal ends, so wrapping stays fully responsive and nothing is left in the DOM. */
function splitLines(el){
 const text=el.dataset.introText??(el.dataset.introText=el.textContent.trim().replace(/\s+/g,' '));
 const words=text.split(' ');
 el.style.width=el.getBoundingClientRect().width+'px'; /* hold the box: the split must not change the layout */
 el.innerHTML=words.map(x=>'<span class="intro-w">'+escH(x)+'</span>').join(' ');
 const rows=[];let top=null;
 el.querySelectorAll('.intro-w').forEach((sp,k)=>{const y=sp.offsetTop;if(top===null||Math.abs(y-top)>3){rows.push([]);top=y}rows[rows.length-1].push(words[k])});
 el.innerHTML='<span class="sr-only">'+escH(text)+'</span>'+rows.map(r=>'<span class="intro-ln" aria-hidden="true"><span class="intro-li">'+escH(r.join(' '))+'</span></span>').join('');
 return [...el.querySelectorAll('.intro-li')];
}
function unsplit(el){if(el&&el.dataset.introText&&el.querySelector('.intro-ln')){el.textContent=el.dataset.introText;el.style.width=''}}
const rise=(el,dist,dur,delay)=>el.animate([{opacity:0,transform:'translate3d(0,'+dist+',0)'},{opacity:1,offset:.45},{opacity:1,transform:'none'}],{duration:dur,delay,easing:OUT,fill:'backwards'});

function playText(){
 introAnims.forEach(a=>a.cancel());introAnims=[];
 if(reduced.matches){hero.dataset.intro='done';unsplit(title);return}
 const lines=splitLines(title);hero.dataset.intro='play';
 introAnims.push(rise(eyebrow,'12px',T.durShort,T.eyebrow));
 lines.forEach((l,k)=>introAnims.push(rise(l,'108%',T.dur,T.title+k*T.line)));
 const a0=T.title+(lines.length-1)*T.line+T.actions;
 actions.forEach((b,k)=>introAnims.push(rise(b,'16px',T.durShort,a0+k*T.action)));
 introEnd=performance.now()+a0+(actions.length-1)*T.action+T.durShort;
 const mine=introAnims;
 Promise.all(mine.map(a=>a.finished)).then(()=>{if(introAnims!==mine)return;hero.dataset.intro='done';unsplit(title);introAnims=[]},()=>{});
}

/* Hand-off: the supporting statement uses the same masked line reveal when it enters, and never
   before the hero's own entrance has finished, so the two read as one continuous sequence. */
function watchStatement(){
 if(!statement)return;
 if(reduced.matches||!('IntersectionObserver'in window)){statement.dataset.intro='done';return}
 const io=new IntersectionObserver(([e])=>{
  if(!e.isIntersecting)return;io.disconnect();
  const lines=splitLines(statement),wait=Math.max(0,introEnd-performance.now()-T.dur*.5);statement.dataset.intro='play';
  const anims=lines.map((l,k)=>rise(l,'108%',T.dur,wait+k*T.line));
  Promise.all(anims.map(a=>a.finished)).then(()=>{statement.dataset.intro='done';unsplit(statement)},()=>{});
 },{rootMargin:'0px 0px -12% 0px'});
 io.observe(statement);
}

/* Scroll exit: as the page moves on, the copy drifts up slightly faster than the scroll and fades, while
   the particles open out (scrollS, above). Driven from this module's existing frame loop: no scroll listener. */
let exitK=-1;
function exit(p){
 const k=clamp((p-.04)/.62);if(Math.abs(k-exitK)<.001)return;exitK=k;
 if(k<=0){copy.style.transform='';copy.style.opacity='';return}
 copy.style.transform='translate3d(0,'+(-k*56).toFixed(2)+'px,0)';copy.style.opacity=(1-k*k).toFixed(3);
}

function frame(now){
 raf=0;if(!visible||document.hidden||reduced.matches||!started){last=0;return}
 /* Clamp the step to two frames: a late frame slows the performance for a moment instead of jumping. */
 const dt=last?Math.min(1/30,(now-last)/1000):0;last=now;clock+=dt;
 const k=1-Math.exp(-dt*5),kf=1-Math.exp(-dt*6),ks=1-Math.exp(-dt*9);
 px=mix(px,tx,k);py=mix(py,ty,k);field=mix(field,fieldTarget,kf);
 scrollP=clamp(-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight));scrollS=mix(scrollS,scrollP,ks);
 exit(scrollP);
 if(artVisible)draw(timeline(clock),clock);
 raf=requestAnimationFrame(frame);
}
let artVisible=true;
function activate(){if(!raf&&started&&visible&&!document.hidden&&!reduced.matches){last=0;raf=requestAnimationFrame(frame)}}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
function setMode(){stop();if(reduced.matches){copy.style.transform=copy.style.opacity='';introAnims.forEach(a=>a.finish());still()}else activate()}

/* Start gate: fonts that shape the composition are loaded (so lines are measured once, with no reflow
   mid-reveal) and three consecutive frames have arrived on time (so the opening is not cut by the page's
   own start-up work). Both are capped, so a slow network or device never holds the intro back for long. */
function calmFrames(){return new Promise(res=>{let prev=0,calm=0;const t0=performance.now();const tick=t=>{calm=prev&&t-prev<22?calm+1:0;prev=t;if(calm>=3||t-t0>900)res();else requestAnimationFrame(tick)};requestAnimationFrame(tick)})}
function fontsReady(){
 if(!document.fonts)return Promise.resolve();
 const want=['400 1em "Libre Baskerville"','400 1em "Google Sans"'].map(f=>document.fonts.load(f).catch(()=>{}));
 return Promise.race([Promise.all(want),new Promise(r=>setTimeout(r,1400))]);
}
function begin(){started=true;clock=0;exitK=-1;playText();activate()}

hero.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch')return;const b=hero.getBoundingClientRect(),m=mount.getBoundingClientRect();
 tx=Math.max(-1,Math.min(1,(e.clientX-b.left-b.width/2)/(b.width/2)));ty=Math.max(-1,Math.min(1,(e.clientY-b.top-b.height/2)/(b.height/2)));
 fx=e.clientX-m.left;fy=e.clientY-m.top;fieldTarget=(fx>-40&&fy>-40&&fx<m.width+40&&fy<m.height+40)?1:0;
},{passive:true});
hero.addEventListener('pointerleave',()=>{tx=ty=0;fieldTarget=0});
/* Click the scene to replay the whole composition, text included. */
mount.addEventListener('click',()=>{if(reduced.matches||!started)return;begin()});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(mount);else addEventListener('resize',resize,{passive:true});
/* The loop runs while any part of the hero is on screen (the copy's exit needs it); the canvas only draws while the art is. */
if('IntersectionObserver'in window){
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)activate();else stop()},{rootMargin:'40px'}).observe(hero);
 new IntersectionObserver(([e])=>{artVisible=e.isIntersecting},{rootMargin:'40px'}).observe(mount);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else activate()});
reduced.addEventListener?.('change',setMode);
hero.dataset.intro='wait';if(statement&&!reduced.matches)statement.dataset.intro='wait';
resize();
if(reduced.matches){started=true;hero.dataset.intro='done';watchStatement();still()}
else fontsReady().then(calmFrames).then(()=>{begin();watchStatement()});
})();
