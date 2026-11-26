/* Original portfolio motion artwork: complexity to connected intelligence. */
(()=>{
'use strict';
const hero=document.querySelector('.relate-hero'),mount=hero?.querySelector('.relate-symbol');
if(!hero||!mount)return;
const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:true});
if(!ctx)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
canvas.setAttribute('aria-hidden','true');canvas.className='intelligence-canvas';
mount.append(canvas);mount.classList.add('intelligence-scene');
const headline=hero.querySelector('.kinetic-headline');const lines=[...hero.querySelectorAll('.kinetic-line>span')];
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(x*(6*x-15)+10)},mix=(a,b,t)=>a+(b-a)*t;
const palette=['#199aff','#fe5241','#e1b600','#709942'];
const count=192,per=48,rand=i=>{const x=Math.sin(i*127.1+78.233)*43758.5453;return x-Math.floor(x)};
const particles=Array.from({length:count},(_,i)=>{
 const g=Math.floor(i/per),k=i%per,a=k*2.3999632297,b=Math.acos(1-2*(k+.5)/per),phase=rand(i+400)*TAU;
 const v=Math.acos(1-2*(i+.5)/count),u=i*2.3999632297;
 return {i,g,k,a,b,phase,color:palette[g],size:1.4+rand(i+200)*1.8,delay:rand(i+50)*.48,
 x:Math.sin(v)*Math.cos(u)*(116+rand(i+82)*52),y:Math.cos(v)*122,z:Math.sin(v)*Math.sin(u)*156};
});
const edges=[];
for(let g=0;g<4;g++)for(let k=0;k<per;k++){
 const i=g*per+k;edges.push({i,j:g*per+(k+1)%per,kind:0,phase:rand(i+500)});
 if(k%3===0)edges.push({i,j:g*per+(k+7)%per,kind:1,phase:rand(i+600)});
 if(k%9===0)edges.push({i,j:((g+1)%4)*per+(k+5)%per,kind:2,phase:rand(i+700)});
}
let w=0,h=0,dpr=1,raf=0,elapsed=0,last=0,visible=true,pointerX=0,pointerY=0,targetX=0,targetY=0,scroll=0;
const project=(x,y,z,yaw,pitch,roll,scale,cx,cy,dist)=>{
 const ca=Math.cos(yaw),sa=Math.sin(yaw),cb=Math.cos(pitch),sb=Math.sin(pitch);
 const X=x*ca+z*sa,Z=-x*sa+z*ca,Y=y*cb-Z*sb,D=y*sb+Z*cb;
 const cr=Math.cos(roll),sr=Math.sin(roll),f=dist/Math.max(140,dist+D);
 return {x:cx+(X*cr-Y*sr)*scale*f,y:cy+(X*sr+Y*cr)*scale*f,z:D,f};
};
function resize(){
 const r=mount.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(reduced.matches?9.5:elapsed);mount.classList.add('intelligence-ready');
}
function draw(t){
 if(!w||!h)return;
 const settled=ease((t-4.6)/2.4),organise=ease((t-.3)/2.3),assemble=ease((t-2.4)/3.3),intro=ease(t/.6);
 const wordProgress=[ease((t-.08)/.85),ease((t-.3)/.95),ease((t-.55)/1.05)];
 if(headline)lines.forEach((el,i)=>{const p=wordProgress[i];el.style.transform='translate3d(0,'+((1-p)*.82)+'em,0)';el.style.opacity=String(.12+.88*p)});
 const idle=Math.max(0,t-7),view=clamp(scroll),disperse=ease(view*.95);
 const yaw=mix(-.88,.98,ease(t/6.8))+.22*Math.sin(idle*.23)+pointerX*.2;
 const pitch=mix(.48,-.32,ease((t-.4)/5.8))+.10*Math.sin(idle*.24)+pointerY*.12;
 const roll=mix(-.19,.06,ease(t/7.5));
 const scale=Math.min(w/380,h/300)*mix(1.12,1.04,ease(t/3.4))*(1-.16*disperse);
 const cx=w/2,cy=h/2+view*9,dist=mix(430,670,ease(t/4.1));
 ctx.clearRect(0,0,w,h);
 const pts=particles.map(n=>{
  const groupAngle=n.g*Math.PI/2+.5,clusterRadius=77;
  const tx=Math.cos(groupAngle)*clusterRadius+Math.sin(n.b)*Math.cos(n.a)*29;
  const ty=Math.sin(groupAngle)*clusterRadius+Math.cos(n.b)*29;
  const tz=Math.sin(n.b)*Math.sin(n.a)*29;
  const p=ease((t-.25-n.delay)/2.15),q=ease((t-2.35-n.delay)/3.1);
  const a=n.k/per*TAU+n.g*.14,tilt=[-.9,-.27,.38,.99][n.g],radius=83+n.g*12;
  const orbitPhase=a+.09*Math.sin(idle*.24+n.g)+.018*Math.sin(idle*.65+n.phase);
  const turn=orbitPhase*2+n.g*.55,band=radius+7*Math.sin(turn);const ox=band*Math.cos(orbitPhase),oy=band*Math.sin(orbitPhase)*Math.cos(tilt),oz=band*Math.sin(orbitPhase)*Math.sin(tilt);
  const drift=(1-p)*10+p*(1-q)*3+settled*1.25;
  let x=mix(n.x,tx,p),y=mix(n.y,ty,p),z=mix(n.z,tz,p);
  x=mix(x,ox,q)+Math.sin(t*.83+n.phase)*drift;
  y=mix(y,oy,q)+Math.cos(t*.67+n.phase)*drift;
  z=mix(z,oz,q)+Math.sin(t*.51+n.phase)*drift;
  x=mix(x,n.x*1.55,disperse);y=mix(y,n.y*1.4,disperse);z=mix(z,n.z*1.3,disperse);
  return {...project(x,y,z,yaw,pitch,roll,scale,cx,cy,dist),n};
 });
 const alpha=(.72+.28*intro)*(1-.72*disperse);
 // Render translucent orbit trails as continuous spatial curves, with depth-dependent line opacity.
 for(let g=0;g<4;g++){
  const radius=83+g*12,tilt=[-.9,-.27,.38,.99][g];ctx.beginPath();
  for(let k=0;k<=100;k++){const a=k/100*TAU,band=radius+7*Math.sin(a*2+g*.55),p=project(band*Math.cos(a),band*Math.sin(a)*Math.cos(tilt),band*Math.sin(a)*Math.sin(tilt),yaw,pitch,roll,scale,cx,cy,dist);if(k)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}
  ctx.strokeStyle=palette[g];ctx.globalAlpha=assemble*.065*alpha;ctx.lineWidth=8*scale;ctx.stroke();ctx.globalAlpha=assemble*.28*alpha;ctx.lineWidth=1.15*scale;ctx.stroke();
 }
 for(const e of edges){
  const a=pts[e.i],b=pts[e.j],d=Math.hypot(a.x-b.x,a.y-b.y);
  const fade=e.kind===0?mix(.16,.48,assemble)*organise:e.kind===1?.16*organise*(1-.7*assemble):.12*assemble;
  const reveal=ease((t-1.35-e.phase*1.2)/1.8);
  if(d>Math.min(w,h)*.83)continue;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mix(a.x,b.x,reveal),mix(a.y,b.y,reveal));ctx.lineWidth=e.kind===0?.8:.55;ctx.strokeStyle=e.kind===2?'#81909f':a.n.color;ctx.globalAlpha=fade*reveal*alpha*clamp(1-(a.z+b.z)/520);ctx.stroke();
  if(e.kind===0&&e.i%4===0&&assemble>.15){
   const f=(t*.25+e.phase)%1;ctx.fillStyle=a.n.color;ctx.globalAlpha=assemble*.85*alpha;ctx.beginPath();ctx.arc(mix(a.x,b.x,f),mix(a.y,b.y,f),2.1*scale,0,TAU);ctx.fill();
  }
 }
 // The central point represents a decision made from distributed information.
 const core=project(0,0,0,yaw,pitch,roll,scale,cx,cy,dist),coreAlpha=ease((t-4.1)/1.7)*alpha;
 ctx.globalAlpha=coreAlpha*.1;ctx.fillStyle='#199aff';ctx.beginPath();ctx.arc(core.x,core.y,20*scale,0,TAU);ctx.fill();
 ctx.globalAlpha=coreAlpha*.2;ctx.strokeStyle='#199aff';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(core.x,core.y,(23+Math.sin(t*1.25)*1.3)*scale,0,TAU);ctx.stroke();
 ctx.globalAlpha=coreAlpha;ctx.fillStyle='#2c2c2c';ctx.beginPath();ctx.arc(core.x,core.y,5.8*scale,0,TAU);ctx.fill();
 // Back-to-front particle compositing supplies depth without expensive blur or external dependencies.
 pts.sort((a,b)=>b.z-a.z);
 for(const p of pts){
  const depth=clamp((180-p.z)/360),radius=Math.max(.8,p.n.size*p.f*scale*(.72+.4*depth));
  ctx.globalAlpha=alpha*(.33+.67*depth);ctx.fillStyle=p.n.color;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,TAU);ctx.fill();
  if(depth>.55&&radius>2){ctx.globalAlpha=alpha*.38;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x-radius*.24,p.y-radius*.24,radius*.29,0,TAU);ctx.fill();}
 }
 ctx.globalAlpha=1;
}
function frame(now){
 raf=0;if(!visible||document.hidden||reduced.matches){last=0;return;}
 const dt=last?Math.min(.05,(now-last)/1000):0;last=now;elapsed+=dt;
 const damping=1-Math.exp(-dt*5);pointerX=mix(pointerX,targetX,damping);pointerY=mix(pointerY,targetY,damping);
 scroll=clamp(-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight));
 draw(elapsed);raf=requestAnimationFrame(frame);
}
function activate(){if(!raf&&visible&&!document.hidden&&!reduced.matches){last=0;raf=requestAnimationFrame(frame);}}
function resetMotion(){if(raf){cancelAnimationFrame(raf);raf=0;}last=0;if(reduced.matches){pointerX=pointerY=scroll=0;draw(9.5);}else activate();}
hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const b=hero.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(e.clientX-b.left-b.width/2)/(b.width/2)));targetY=Math.max(-1,Math.min(1,(e.clientY-b.top-b.height/2)/(b.height/2)));},{passive:true});
hero.addEventListener('pointerleave',()=>{targetX=targetY=0;});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(mount);else addEventListener('resize',resize,{passive:true});
if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)activate();else{if(raf)cancelAnimationFrame(raf);raf=0;last=0;}},{rootMargin:'40px'}).observe(mount);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else activate();});
reduced.addEventListener?.('change',resetMotion);resize();resetMotion();
})();