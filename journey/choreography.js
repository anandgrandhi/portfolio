
(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');const clamp=x=>Math.max(0,Math.min(1,x));let enabled=!reduced.matches,installed=false,raf=0,last=0;const states=new WeakMap();
const C={ink:'#2c2c2c',blue:'#199aff',lime:'#d6fe6a',green:'#426400',yellow:'#ffd100',pink:'#fbe3e8',coral:'#fe5241',line:'#cbcbcb'};
const t=(x,y,s,n=14,a='middle',c=C.ink)=>'<text x="'+x+'" y="'+y+'" font-size="'+n+'" text-anchor="'+a+'" fill="'+c+'">'+esc(s)+'</text>';
const group=(s,i=0,cls='assemble')=>'<g class="'+cls+'" style="--delay:'+i*130+'ms">'+s+'</g>';
const rect=(x,y,w,h,fill='white',rx=12)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'"/>';
const path=(d,c=C.line,i=0)=>'<path class="trace" style="--delay:'+i*130+'ms" pathLength="1" d="'+d+'" stroke="'+c+'" stroke-width="2" stroke-linecap="round" fill="none"/>';
const card=(x,y,w,h,label,fill,i)=>group(rect(x,y,w,h,fill)+t(x+w/2,y+h/2+5,label,13),i,'signal-card');
const originalArt=art;
art=function(p,i){let v='';
if(i===0){
v=path('M90 82C145 82 135 150 195 150',C.ink,1)+path('M90 165H195',C.ink,2)+path('M90 248C145 248 135 180 195 180',C.ink,3);
v+=card(18,58,106,48,'Weak areas',C.lime,0)+card(18,141,106,48,'Recent activity','white',1)+card(18,224,106,48,'Learning goals',C.yellow,2);
v+='<g class="phone-body">'+rect(190,25,120,255,C.ink,23)+rect(196,31,108,243,'white',18)+rect(230,38,40,7,C.ink,4)+t(250,74,'Daily Digest',13)+t(250,91,'Your daily journey',8)+[0,1,2].map((j)=>group(rect(206,105+j*43,88,35,[C.lime,'#e2f3ff',C.pink][j],7)+'<circle cx="218" cy="'+(122+j*43)+'" r="5" fill="'+[C.green,C.blue,C.coral][j]+'"/>'+rect(230,116+j*43,49,4,C.ink,2)+rect(230,125+j*43,34,3,C.line,2),j+3)).join('')+rect(232,263,36,3,C.ink,2)+'</g>';
v+=group(rect(343,95,139,95,'white',16)+t(412,135,'80k+',31)+t(412,157,'Daily active users',10)+t(412,174,'from 35k',10),5)+path('M310 145H343',C.ink,5)+t(250,335,'Conceptual personalised learning journey',12);
}else if(i===1){
v=[0,1,2,3].map((j)=>{const x=25+j*116;return (j?path('M'+(x-20)+' 136H'+x,C.ink,j):'')+group(rect(x,82,96,108,'white',14)+rect(x+14,101,68,12,[C.blue,C.yellow,C.coral,C.green][j],5)+rect(x+14,128,60,5,C.line,2)+rect(x+14,142,46,5,C.line,2)+t(x+48,173,['Research','Draft','Review','Publish'][j],12),j)}).join('')+group(t(250,250,'6.5h → 45m',39)+t(250,278,'Per article · human review retained',13),5);
}else if(i===2){
v=group(rect(28,45,214,225,'white',20)+t(135,72,'Interactive STEM',16)+'<g transform="translate(135 152)" stroke="'+C.blue+'" fill="none" stroke-width="2"><ellipse rx="65" ry="25"/><ellipse rx="65" ry="25" transform="rotate(60)"/><ellipse rx="65" ry="25" transform="rotate(120)"/><circle r="10" fill="'+C.coral+'" stroke="none"/><circle r="5" cx="65" fill="'+C.green+'" stroke="none"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="7s" repeatCount="indefinite"/></circle></g>'+t(135,243,'Conceptual learning applet',11),0);
v+=group(rect(260,45,212,95,C.lime,16)+t(366,88,'300+',33)+t(366,112,'Interactive applets',13),2)+group(rect(260,152,212,118,C.pink,16)+t(366,197,'150+',30)+t(366,218,'Learning games',12)+t(366,244,'20+ virtual labs',12),3)+t(250,335,'Reported programme outputs',12);
}else{
v=card(22,60,108,55,'Conversations','white',0)+card(22,150,108,55,'Historical data','white',1)+card(22,240,108,55,'Documents','white',2)+path('M130 88Q174 88 192 173',C.ink,1)+path('M130 178H192',C.ink,2)+path('M130 268Q174 268 192 183',C.ink,3)+group(rect(192,142,112,76,C.ink,16)+t(248,174,'Evidence',15,'middle','white')+t(248,194,'& review',12,'middle','white'),3)+path('M304 180H342',C.ink,4)+group(rect(342,115,138,130,C.lime,17)+t(411,142,'Student plan',15)+[0,1,2].map(j=>path('M356 '+(166+j*22)+'l5 5 9 -10',C.green,j+4)+rect(378,162+j*22,86,5,C.green,2)).join('')+t(411,231,'Human approval',11),5)+t(250,335,'Conceptual workflow · reference prototype',12);
}
return '<svg class="scene-art" viewBox="0 0 500 370" role="img" aria-label="'+esc(p.title)+' — original conceptual animation"><g class="artlayer">'+v+'</g></svg>';
};
function init(){if(installed||!window.portfolioContentReady)return;installed=true;
const canvas=document.querySelector('#canvas');const old=canvas.querySelector('svg:not(.outgoing)');if(old){const wrap=document.createElement('div');wrap.innerHTML=art(featured[active],active);const next=wrap.firstElementChild;next.classList.add('ready');old.replaceWith(next)}
document.querySelectorAll('.chapter .mobileart').forEach((el,i)=>el.innerHTML=art(featured[i],i));
if(typeof visualMode!=='undefined'){visualMode='illustration';paintVisual(active,true);const oldPaint=paintVisual;paintVisual=function(i,force=false){if(visualMode==='auto')visualMode='illustration';return oldPaint(i,force)}}
const h=document.querySelector('.relate-hero h1');if(h){const text=h.textContent;h.setAttribute('aria-label',text);h.replaceChildren(...text.split(' ').flatMap((word,i)=>{const span=document.createElement('span');span.className='motion-word';span.style.setProperty('--word',i);span.textContent=word;span.setAttribute('aria-hidden','true');return[span,document.createTextNode(' ')]}))}
const nodes=[...document.querySelectorAll('.chapter,.era-row')];const mode=document.createElement('button');mode.type='button';mode.className='scene-mode';document.body.append(mode);
function setMode(v){enabled=v&&!reduced.matches;document.body.classList.toggle('scene-ready',enabled);mode.textContent=enabled?'Motion on':'Motion off';mode.setAttribute('aria-pressed',String(enabled));document.querySelectorAll('svg.scene-art').forEach(s=>{try{enabled?s.unpauseAnimations():s.pauseAnimations()}catch(e){}});if(!enabled){canvas.style.removeProperty('--camera-y');canvas.style.removeProperty('--camera-x');canvas.style.removeProperty('--camera-scale')}else queue()}
mode.onclick=()=>setMode(!enabled);reduced.addEventListener?.('change',()=>setMode(!reduced.matches));
function paint(now){raf=0;if(!enabled)return;let dt=last?Math.min(50,now-last):16;last=now;let moving=false;let camera=0;
nodes.forEach(el=>{const r=el.getBoundingClientRect();const center=(r.top+r.height/2-innerHeight*.5)/Math.max(innerHeight*.5+r.height*.25,1);const desired=clamp((1.15-Math.abs(center))/.42);const prev=states.get(el)??desired;const value=prev+(desired-prev)*(1-Math.exp(-dt/110));states.set(el,value);const shift=Math.max(-18,Math.min(18,center*24))*(1-value);el.style.setProperty('--scene-opacity',String(.42+.58*value));el.style.setProperty('--scene-shift',shift+'px');el.style.setProperty('--scene-scale',String(.94+.06*value));if(Math.abs(value-desired)>.004)moving=true;if(el===nodes[active])camera=center});
canvas.style.setProperty('--camera-y',Math.max(-5,Math.min(5,camera*6))+'deg');canvas.style.setProperty('--camera-x',Math.max(-3,Math.min(3,camera*-4))+'deg');canvas.style.setProperty('--camera-scale',String(1-Math.min(.035,Math.abs(camera)*.025)));if(moving)raf=requestAnimationFrame(paint)}
function queue(){if(!raf&&enabled){last=0;raf=requestAnimationFrame(paint)}}addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);setMode(enabled);
}
document.addEventListener('portfolio-content-ready',init);init();
})();