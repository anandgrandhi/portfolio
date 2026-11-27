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
document.addEventListener('themechange',()=>{readPalette();if(reduced.matches)still();else draw(timeline(clock),clock)});

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
const order=Array.from({length:count},(_,i)=>i);

let w=0,h=0,dpr=1,raf=0,clock=0,last=0,visible=true;
let px=0,py=0,tx=0,ty=0,fx=-1e4,fy=-1e4,field=0,fieldTarget=0,scrollP=0,scrollS=0;
/* Camera state, set once per frame. */
let ca=1,sa=0,cb=1,sb=0,cr=1,sr=0,scale=1,cx=0,cy=0,dist=500,PX=0,PY=0,PD=0,PF=1;
function camera(yaw,pitch,roll){ca=Math.cos(yaw);sa=Math.sin(yaw);cb=Math.cos(pitch);sb=Math.sin(pitch);cr=Math.cos(roll);sr=Math.sin(roll)}
function project(x,y,z){
 const X=x*ca+z*sa,Z=-x*sa+z*ca,Y=y*cb-Z*sb,D=y*sb+Z*cb,f=dist/Math.max(140,dist+D);
 PX=cx+(X*cr-Y*sr)*scale*f;PY=cy+(X*sr+Y*cr)*scale*f;PD=D;PF=f;
}

/* Text motion is CSS (styles.css, Google timings); this module only restarts it on replay. */
function replayText(){hero.classList.remove('intro-animation');void hero.offsetWidth;hero.classList.add('intro-animation')}

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
 /* Connections draw in, with depth-attenuated opacity; packets travel the ring links. */
 const maxD=Math.min(w,h)*.83;
 for(const e of edges){
  const ai=e.i,bi=e.j,ax=SX[ai],ay=SY[ai],bx=SX[bi],by=SY[bi];
  if(Math.hypot(ax-bx,ay-by)>maxD)continue;
  const fe=e.kind===0?mix(.16,.48,assemble)*organise:e.kind===1?.16*organise*(1-.7*assemble):.12*assemble;
  const rv=ease((t-1.35-e.phase*1.2)/1.8),depth=clamp(1-(SD[ai]+SD[bi])/520);
  const o=fe*rv*alpha*depth;if(o<.004)continue;
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(mix(ax,bx,rv),mix(ay,by,rv));ctx.lineWidth=e.kind===0?.8:.55;ctx.strokeStyle=e.kind===2?lineColor:solid[P[ai].g];ctx.globalAlpha=o;ctx.stroke();
 }
 if(assemble>.15){
  for(const e of edges){
   if(e.kind!==0||e.i%4)continue;
   const f=(c*.25+e.phase)%1,x=mix(SX[e.i],SX[e.j],f),y=mix(SY[e.i],SY[e.j],f),col=solid[P[e.i].g];
   ctx.fillStyle=col;ctx.globalAlpha=assemble*.12*alpha;ctx.beginPath();ctx.arc(x,y,5.2*scale,0,TAU);ctx.fill();
   ctx.globalAlpha=assemble*.9*alpha;ctx.beginPath();ctx.arc(x,y,2*scale,0,TAU);ctx.fill();
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
 /* Particles back-to-front; size and tint follow depth. */
 order.sort((a,b)=>SD[b]-SD[a]);
 for(const i of order){
  const n=P[i],d=clamp((SD[i]+170)/340),lv=Math.min(LEVELS-1,Math.round(d*(LEVELS-1)));
  const r=Math.max(1.1,n.size*scale*(.55+.6*SF[i]));
  ctx.globalAlpha=alpha*(1-.35*d);ctx.fillStyle=ramps[n.g][lv];ctx.beginPath();ctx.arc(SX[i],SY[i],r,0,TAU);ctx.fill();
  if(r>2.6&&d<.4){ctx.globalAlpha=alpha*.45;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(SX[i]-r*.32,SY[i]-r*.34,r*.32,0,TAU);ctx.fill()}
 }
 ctx.globalAlpha=1;
}

function resize(){
 const r=mount.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 if(reduced.matches)still();else draw(timeline(clock),clock);
}
function still(){scrollS=0;px=py=field=0;loopFade=1;loopIdle=0;draw(7,20);}
function frame(now){
 raf=0;if(!visible||document.hidden||reduced.matches){last=0;return}
 const dt=last?Math.min(.05,(now-last)/1000):0;last=now;clock+=dt;
 /* Frame-rate independent damping (Google-style lerps): pointer .1-ish, field fades in/out, scroll eases. */
 const k=1-Math.exp(-dt*5),kf=1-Math.exp(-dt*6),ks=1-Math.exp(-dt*9);
 px=mix(px,tx,k);py=mix(py,ty,k);field=mix(field,fieldTarget,kf);
 scrollP=clamp(-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight));scrollS=mix(scrollS,scrollP,ks);
 draw(timeline(clock),clock);
 raf=requestAnimationFrame(frame);
}
function activate(){if(!raf&&visible&&!document.hidden&&!reduced.matches){last=0;raf=requestAnimationFrame(frame)}}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
function setMode(){stop();if(reduced.matches)still();else activate()}

hero.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch')return;const b=hero.getBoundingClientRect(),m=mount.getBoundingClientRect();
 tx=Math.max(-1,Math.min(1,(e.clientX-b.left-b.width/2)/(b.width/2)));ty=Math.max(-1,Math.min(1,(e.clientY-b.top-b.height/2)/(b.height/2)));
 fx=e.clientX-m.left;fy=e.clientY-m.top;fieldTarget=(fx>-40&&fy>-40&&fx<m.width+40&&fy<m.height+40)?1:0;
},{passive:true});
hero.addEventListener('pointerleave',()=>{tx=ty=0;fieldTarget=0});
/* Click the scene to replay the performance. */
mount.addEventListener('click',()=>{if(reduced.matches)return;clock=0;replayText();activate()});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(mount);else addEventListener('resize',resize,{passive:true});
if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)activate();else stop()},{rootMargin:'40px'}).observe(mount);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else activate()});
reduced.addEventListener?.('change',setMode);
resize();setMode();
})();
