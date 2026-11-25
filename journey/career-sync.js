/* Career-only scroll choreography. Reuses the approved path and illustrations. */
(()=>{
if(typeof story==='undefined'||typeof tick!=='function')return;
const style=document.createElement('style');
style.textContent=`
#careerStory.career-sync .era-copy{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}
#careerStory.career-sync .era-copy>*{opacity:var(--career-alpha,1)!important;translate:none!important;transform:perspective(900px) translate3d(0,var(--career-y,0px),var(--career-z,0px))!important;transition:none!important;animation:none!important}
#careerStory.career-sync .era-illustration{opacity:var(--career-art-alpha,1)!important;transform:perspective(1000px) translate3d(var(--career-art-x,0px),var(--career-art-y,0px),0) rotateY(var(--career-art-turn,0deg)) scale(var(--career-art-scale,1))!important;transition:none!important;transform-origin:center}
#careerStory.career-sync .era-illustration>svg:not(.motion-orbit){scale:1!important;animation:none!important;transition:none!important}
#careerStory.career-sync .orbit-lines>*{transition:none!important}
#careerStory.career-sync #journeyDrop{filter:none}
@media(max-width:800px){#careerStory.career-sync .era-copy>*{opacity:1!important;transform:none!important}#careerStory.career-sync .era-illustration{opacity:1!important;transform:none!important}}
@media(prefers-reduced-motion:reduce){#careerStory.career-sync .era-copy>*,#careerStory.career-sync .era-illustration{opacity:1!important;transform:none!important}}
`;
document.head.append(style);story.classList.add('career-sync');
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
let cacheKey='',points=[],milestones=[],lastY=null,lastStamp=0,velocity=0;
function cache(){
 const key=ink.getAttribute('d');if(key===cacheKey)return;cacheKey=key;
 points=Array.from({length:801},(_,i)=>ink.getPointAtLength(len*i/800));
 const top=story.getBoundingClientRect().top;
 milestones=rows.map((row,i)=>{const box=row.getBoundingClientRect();return {row,i,center:box.top-top+box.height/2,height:box.height,children:[...row.querySelector('.era-copy').children],art:row.querySelector('.era-illustration'),lines:[...row.querySelectorAll('[data-len]')]}});
}
function point(d){const n=clamp(d)*800,i=Math.min(799,Math.floor(n)),t=n-i,a=points[i],b=points[i+1];return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}
function color(a,b,t){const n=x=>parseInt(x.slice(1),16),u=n(a),v=n(b);return '#'+[16,8,0].map(k=>Math.round(((u>>k)&255)*(1-t)+((v>>k)&255)*t).toString(16).padStart(2,'0')).join('')}
if(raf)cancelAnimationFrame(raf);raf=0;
tick=function(t){
 raf=0;cache();if(!points.length)return;
 const top=story.getBoundingClientRect().top,vh=innerHeight;
 const raw=clamp((vh*.58-top)/Math.max(1,story.offsetHeight))*story.offsetHeight;
 const off=top>vh+100||top+story.offsetHeight<-100;
 if(off&&lastY!==null&&(raw===0||raw===story.offsetHeight)&&lastY===raw)return;
 let lo=0,hi=800;while(lo<hi){const m=(lo+hi)>>1;if(points[m].y<raw)lo=m+1;else hi=m}
 const j=Math.max(0,lo-1),a=points[j],b=points[Math.min(800,j+1)],fraction=clamp((raw-a.y)/Math.max(.001,b.y-a.y));
 display=reduce.matches?1:(j+fraction)/800;target=display;
 const pt=point(display),dt=Math.max(8,Math.min(50,t-(lastStamp||t-16)));
 const speed=lastY===null?0:Math.abs(raw-lastY)/dt;velocity=velocity*.45+Math.min(1,speed/1.8)*.55;lastY=raw;lastStamp=t;
 const near=milestones.reduce((best,m)=>Math.abs(m.center-raw)<Math.abs(best.center-raw)?m:best,milestones[0]);
 const arrival=near?1-smooth(Math.abs(near.center-raw)/Math.max(60,near.height*.28)):0;
 const stretch=velocity*(1-arrival*.8);
 const ahead=point(display+.004),behind=point(display-.004),angle=Math.atan2(ahead.y-behind.y,ahead.x-behind.x)*180/Math.PI;
 ink.style.strokeDashoffset=String(len*(1-display));
 const base=9+arrival*5;dot.setAttribute('cx',pt.x);dot.setAttribute('cy',pt.y);dot.setAttribute('rx',base+stretch*20);dot.setAttribute('ry',Math.max(4,base-stretch*5));dot.setAttribute('transform','rotate('+angle+' '+pt.x+' '+pt.y+')');
 let k=0;while(k+1<milestones.length&&raw>milestones[k+1].center)k++;
 const next=Math.min(k+1,eraColors.length-1),mix=smooth((raw-milestones[k].center)/Math.max(1,milestones[next].center-milestones[k].center));
 const tint=color(eraColors[k],eraColors[next],mix);dot.setAttribute('fill',tint);dot.style.opacity=reduce.matches?'0':'1';
 halo.setAttribute('cx',pt.x);halo.setAttribute('cy',pt.y);halo.setAttribute('fill',tint);halo.setAttribute('r',15+arrival*13);halo.style.opacity=reduce.matches||off?'0':String(.045+arrival*.13);
 beads.forEach((el,i)=>{const p=point(display-(i+1)*(4+stretch*5)/Math.max(1,len));el.setAttribute('cx',p.x);el.setAttribute('cy',p.y);el.setAttribute('fill',tint);el.style.opacity=reduce.matches||off||raw<5?'0':String(stretch*.52*(1-i/beads.length))});
 for(const m of milestones){
 const distance=m.center-raw,range=Math.max(140,m.height*.94),entry=smooth(1-distance/range),exit=smooth((-distance-m.height*.32)/Math.max(120,m.height*.65));
 const artProgress=reduce.matches?1:smooth(1-distance/(range*1.25));
 m.art.style.setProperty('--career-art-scale',String(.42+.58*artProgress-.24*exit));m.art.style.setProperty('--career-art-alpha',String(.16+.84*artProgress-.55*exit));m.art.style.setProperty('--career-art-y',String(48*(1-artProgress)-32*exit)+'px');
 m.art.style.setProperty('--career-art-x',String((m.i%2?1:-1)*(34*(1-artProgress)-18*exit))+'px');m.art.style.setProperty('--career-art-turn',String((m.i%2?1:-1)*(18*(1-artProgress)-8*exit))+'deg');
 m.children.forEach((el,i)=>{const p=reduce.matches?1:smooth((entry-i*.115)/(1-i*.115));el.style.setProperty('--career-alpha',String(reduce.matches?1:.16+.84*p-.35*exit));el.style.setProperty('--career-y',String(reduce.matches?0:44*(1-p)-24*exit)+'px');el.style.setProperty('--career-z',String(reduce.matches?0:-95*(1-p)-55*exit)+'px')});
 m.lines.forEach((el,i)=>{const p=reduce.matches?1:smooth(artProgress*1.5-i*.065);el.style.strokeDashoffset=String(Number(el.dataset.len)*(1-p))});
 }
 if(!reduce.matches&&!off&&velocity>.018)raf=requestAnimationFrame(tick);
};
updateCareer=function(){if(!raf)raf=requestAnimationFrame(tick)};
updateCareer();
})();
