/* Career scenes — one isometric illustration per chapter of the vertical journey.
   Each scene is drawn from a small isometric kit and has two drivers, both called by main.js's
   scroll controller (this file owns no timers or animation loops):
     draw(p)  — the build, scrubbed by scroll: p 0 → 1 as the chapter reaches the middle of the screen.
     tick(t)  — a quiet ambient loop (t in seconds) that runs only once a scene is fully built and on screen.
   Every motif comes from the chapter's own copy; nothing in the drawings is decorative filler.
     0 BYJU'S      five yearly slabs · learning app · knowledge graph · learning journey · assessments · STEM atom
     1 Amazon      engagement bars with trend · personalised cards · support chat · operations loop
     2 Archmation  scattered inefficiencies → workflow engine (founder's flag) → structured output
     3 Applied AI  layered AI core with evaluation ring · knowledge · productivity · acquisition · decisions */
(()=>{
'use strict';
const NS='http://www.w3.org/2000/svg',C=.8660254;
const clamp=x=>x<0?0:x>1?1:x;
const outCubic=x=>1-(1-x)**3, smooth=x=>x*x*(3-2*x);
const back=x=>{const c=1.7;return 1+(c+1)*(x-1)**3+c*(x-1)**2};
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);if(attrs)for(const k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.append(n);return n}
const f1=v=>(+v).toFixed(1);

function create(mount,kind){
  const root=el('svg',{viewBox:'0 0 360 270',preserveAspectRatio:'xMidYMid meet',class:'scene','aria-hidden':'true'},mount);
  const uid='sc'+kind+Math.random().toString(36).slice(2,6),defs=el('defs',null,root);
  const blur=el('filter',{id:uid+'b',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:7},blur);
  const glow=el('radialGradient',{id:uid+'g'},defs);el('stop',{offset:'0',class:'sg-a'},glow);el('stop',{offset:'1',class:'sg-b'},glow);
  const O={cx:180,cy:150},S=1.16;
  const P=(x,y,z=0)=>[O.cx+(x-y)*C*S,O.cy+((x+y)*.5-z)*S];
  const pts=a=>a.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
  const steps=[],loops=[];let last=-1;
  const at=(a,b,fn)=>steps.push({a,b,fn});

  /* ——— kit ——— */
  const group=(parent=root,cls)=>el('g',cls?{class:cls}:null,parent);
  function prism(parent,x,y,z,w,d,h,tone='n'){
    const g=el('g',{class:'pr pr-'+tone},parent),L=el('polygon',{class:'fl'},g),R=el('polygon',{class:'fr'},g),T=el('polygon',{class:'ft'},g);
    const set=(hh=h,zz=z)=>{const z1=zz+Math.max(.01,hh);
      L.setAttribute('points',pts([P(x,y+d,zz),P(x+w,y+d,zz),P(x+w,y+d,z1),P(x,y+d,z1)]));
      R.setAttribute('points',pts([P(x+w,y,zz),P(x+w,y+d,zz),P(x+w,y+d,z1),P(x+w,y,z1)]));
      T.setAttribute('points',pts([P(x,y,z1),P(x+w,y,z1),P(x+w,y+d,z1),P(x,y+d,z1)]))};
    set();return {g,set,x,y,z,w,d,h};
  }
  const flat=(parent,quad,z,cls)=>el('polygon',{points:pts(quad.map(([x,y])=>P(x,y,z))),class:cls},parent);
  const line=(parent,world,cls,closed)=>el('path',{d:'M'+world.map(p=>pts([P(...p)])).join(' L')+(closed?' Z':''),class:cls},parent);
  function ring(parent,cx,cy,z,r,cls,n=48){const a=[];for(let i=0;i<=n;i++){const t=i/n*Math.PI*2;a.push([cx+Math.cos(t)*r,cy+Math.sin(t)*r,z])}return line(parent,a,cls)}
  const dot=(parent,[x,y],r,cls)=>el('circle',{cx:f1(x),cy:f1(y),r,class:cls},parent);
  /* Position along a world-space polyline, u in 0–1 (by length). */
  function along(world,u,closed){
    const a=closed?[...world,world[0]]:world,seg=[];let total=0;
    for(let i=1;i<a.length;i++){const l=Math.hypot(a[i][0]-a[i-1][0],a[i][1]-a[i-1][1],a[i][2]-a[i-1][2]);seg.push(l);total+=l}
    let d=((u%1)+1)%1*total;for(let i=0;i<seg.length;i++){if(d<=seg[i]){const k=d/seg[i],p=a[i],q=a[i+1];return P(p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k,p[2]+(q[2]-p[2])*k)}d-=seg[i]}
    return P(...a[a.length-1]);
  }
  /* Build steps. */
  const rise=(g,a,b,dy=16)=>at(a,b,e=>{const k=outCubic(e);g.setAttribute('transform','translate(0 '+f1((1-k)*dy)+')');g.setAttribute('opacity',f1(Math.min(1,e*1.6)))});
  const pop=(g,[ax,ay],a,b)=>at(a,b,e=>{const k=e<=0?0:back(e);g.setAttribute('transform','translate('+f1(ax)+' '+f1(ay)+') scale('+Math.max(0,k).toFixed(3)+') translate('+f1(-ax)+' '+f1(-ay)+')');g.setAttribute('opacity',f1(Math.min(1,e*2.5)))});
  const fade=(g,a,b)=>at(a,b,e=>g.setAttribute('opacity',smooth(e).toFixed(3)));
  const draw=(path,a,b)=>{path.setAttribute('pathLength','1');path.style.strokeDasharray='1 1';at(a,b,e=>{path.style.strokeDashoffset=(1-smooth(e)).toFixed(4)})};
  const slide=(g,a,b,dx,dy)=>at(a,b,e=>{const k=outCubic(e);g.setAttribute('transform','translate('+f1((1-k)*dx)+' '+f1((1-k)*dy)+')');g.setAttribute('opacity',f1(Math.min(1,e*1.8)))});

  /* Soft floor shadow under every platform. */
  const [sx,sy]=P(0,0,0);
  const shadow=el('ellipse',{cx:f1(sx+8),cy:f1(sy+70*S),rx:f1(150*S),ry:f1(16*S),class:'scene-shadow',filter:'url(#'+uid+'b)'},root);
  fade(shadow,0,.3);

  if(kind===0){
    /* BYJU'S — the base is five slabs, one per year, rising in sequence. */
    const base=group();
    for(let i=0;i<5;i++){const s=prism(base,-80+i*32,-62,0,32,124,10,i===4?'t':'n');rise(s.g,.02+i*.045,.24+i*.045,22)}
    /* The learning app. */
    const app=group();const tab=prism(app,-68,-52,10,58,42,5,'t');
    flat(app,[[-62,-47],[-16,-47],[-16,-15],[-62,-15]],15.2,'scr');
    for(let r=0;r<3;r++)line(app,[[-56,-40+r*9,15.4],[-28+(r===1?8:0),-40+r*9,15.4]],'sl-soft');
    rise(app,.22,.42,18);
    /* Knowledge graph, drawn above the app it structures. */
    const nodes=[[-40,-34,86],[-72,-44,62],[-12,-58,66],[-62,-8,50],[-18,-18,52],[-40,-32,36]];
    const edges=[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[1,5],[0,4]];
    const graph=group(),eg=group(graph),ng=group(graph);
    const stem=line(graph,[[-40,-32,18],[-40,-32,36]],'sl-soft sl-dash');fade(stem,.38,.5);
    const edgeEls=edges.map(([a,b],i)=>{const p=line(eg,[nodes[a],nodes[b]],'sl');draw(p,.44+i*.022,.62+i*.022);return p});
    const nodeEls=nodes.map((n,i)=>{const g=group(ng),c=P(...n);el('circle',{cx:f1(c[0]),cy:f1(c[1]),r:i===0?10:7,class:'halo'},g);dot(g,c,i===0?5.2:3.8,i===0?'sd':'sd-w');pop(g,c,.4+i*.03,.56+i*.03);return {g,c,i}});
    const spark=dot(graph,P(...nodes[0]),2.2,'spark');spark.setAttribute('opacity','0');
    /* The personalised learning journey, with assessments along the way. */
    const route=[[-62,52,10],[-24,52,10],[-24,20,10],[14,20,10],[14,-14,10],[52,-14,10],[52,-50,10]];
    const jg=group(),jp=line(jg,route,'sl sl-route');draw(jp,.5,.74);
    route.forEach((w,i)=>{const g=group(jg),c=P(...w);dot(g,c,i===route.length-1?4.6:3.2,i===route.length-1?'sd':'sd-w');pop(g,c,.52+i*.032,.64+i*.032)});
    const flag=group(jg),fp=P(52,-50,10);line(flag,[[52,-50,10],[52,-50,34]],'sl');el('path',{d:'M'+f1(fp[0])+' '+f1(fp[1]-24)+' l13 4 -13 4 z',class:'flag'},flag);pop(flag,fp,.74,.84);
    [[-24,52],[14,20],[52,-14]].forEach(([x,y],i)=>{const c=P(x,y,30),g=group(jg);el('rect',{x:f1(c[0]-8),y:f1(c[1]-8),width:16,height:16,rx:5,class:'badge'},g);el('path',{d:'M'+f1(c[0]-3.6)+' '+f1(c[1])+' l2.6 2.6 4.8-5.4',class:'tick'},g);pop(g,c,.72+i*.05,.84+i*.05)});
    const learner=group(jg),lc=dot(learner,[0,0],4.4,'learner');fade(learner,.82,.92);
    /* Interactive STEM: an atom. */
    const ac=P(72,-40,74),atom=group();
    const orb=[0,60,-60].map(r=>el('ellipse',{cx:f1(ac[0]),cy:f1(ac[1]),rx:22,ry:7.5,transform:'rotate('+r+' '+f1(ac[0])+' '+f1(ac[1])+')',class:'orbit-l'},atom));
    dot(atom,ac,4.6,'sd');const electrons=[0,1,2].map(()=>dot(atom,ac,2.2,'sd'));
    pop(atom,ac,.62,.8);
    loops.push(t=>{
      const p=along(route,(t*.09)%1);lc.setAttribute('cx',f1(p[0]));lc.setAttribute('cy',f1(p[1]));
      electrons.forEach((e,i)=>{const a=t*2.1+i*2.1,r=(i-1)*60*Math.PI/180,x=Math.cos(a)*22,y=Math.sin(a)*7.5;e.setAttribute('cx',f1(ac[0]+x*Math.cos(r)-y*Math.sin(r)));e.setAttribute('cy',f1(ac[1]+x*Math.sin(r)+y*Math.cos(r)))});
      nodeEls.forEach(n=>n.g.setAttribute('transform','translate(0 '+f1(Math.sin(t*1.3+n.i*1.1)*1.6)+')'));
      edgeEls.forEach((e,i)=>e.setAttribute('transform','translate(0 '+f1((Math.sin(t*1.3+edges[i][0]*1.1)+Math.sin(t*1.3+edges[i][1]*1.1))*.8)+')'));
      const k=(t*.5)%1,[a,b]=edges[Math.floor(t*.5)%edges.length],pa=nodes[a],pb=nodes[b],q=P(pa[0]+(pb[0]-pa[0])*k,pa[1]+(pb[1]-pa[1])*k,pa[2]+(pb[2]-pa[2])*k);
      spark.setAttribute('cx',f1(q[0]));spark.setAttribute('cy',f1(q[1]));spark.setAttribute('opacity',f1(Math.sin(k*Math.PI)));
    });
  }

  else if(kind===1){
    /* Amazon — the operations loop runs around the platform that everything else stands on. */
    const base=group();prism(base,-80,-62,0,160,124,10,'n');rise(base,.02,.2,22);
    const loop=[[-70,-52,10],[70,-52,10],[70,52,10],[-70,52,10]];
    const track=line(group(),loop,'sl sl-route',true);draw(track,.16,.4);
    const packets=group(),pk=[0,1,2,3,4].map(()=>{const g=group(packets);prism(g,-4,-4,10,8,8,7,'e');return g});
    fade(packets,.36,.46);
    /* Engagement and adoption: bars that climb, with their trend. */
    const bars=group(),hs=[14,24,36,54],bx=[4,22,40,58];
    const bar=hs.map((h,i)=>prism(bars,bx[i],-44,10,12,12,h,i===3?'e':'t'));
    at(.28,.6,e=>bar.forEach((b,i)=>{const k=outCubic(clamp(e*1.6-i*.2));b.set(hs[i]*k);b.g.setAttribute('opacity',k>0?'1':'0')}));
    const trend=line(bars,hs.map((h,i)=>[bx[i]+6,-38,10+h+10]),'sl');draw(trend,.52,.7);
    const tip=P(64,-38,74);const arrow=el('path',{d:'M'+f1(tip[0]-5)+' '+f1(tip[1]+2)+' l5 -6 5 6',class:'sl'},bars);pop(arrow,tip,.68,.76);
    /* Personalised experiences: cards that sort themselves into a stack. */
    const cards=group(),cardEls=[0,1,2].map(i=>{const g=group(cards);const z=10+i*8;prism(g,-62,4,z,44,34,4,i===2?'t':'n');
      const c=P(-50,12,z+4.2);el('ellipse',{cx:f1(c[0]),cy:f1(c[1]),rx:4.2,ry:2.4,class:'sd'},g);
      line(g,[[-40,10,z+4.2],[-24,10,z+4.2]],'sl-soft');line(g,[[-40,18,z+4.2],[-30,18,z+4.2]],'sl-soft');
      slide(g,.4+i*.07,.62+i*.07,-34+i*6,-14-i*4);return g});
    /* Customer support: a reply being typed. */
    const bc=P(-34,22,64),bub=group();
    el('path',{d:'M'+f1(bc[0]-26)+' '+f1(bc[1]-14)+' h52 a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h-38 l-9 7 1 -7 h-6 a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8 z',class:'bubble'},bub);
    const typing=[-1,0,1].map(j=>dot(bub,[bc[0]+j*10,bc[1]],2.6,'sd'));
    pop(bub,[bc[0]-20,bc[1]+14],.72,.86);
    loops.push(t=>{
      pk.forEach((g,i)=>{const p=along(loop,(t*.07+i/5)%1,true),o=P(0,0,10);g.setAttribute('transform','translate('+f1(p[0]-o[0])+' '+f1(p[1]-o[1])+')')});
      typing.forEach((d,j)=>{const k=Math.max(0,Math.sin(t*5-j*.8));d.setAttribute('transform','translate(0 '+f1(-k*3)+')');d.setAttribute('opacity',f1(.45+.55*k))});
      cardEls.forEach((g,i)=>g.setAttribute('transform','translate(0 '+f1(Math.sin(t*1.1+i*.7)*1.2)+')'));
    });
  }

  else if(kind===2){
    /* Archmation — inefficiency enters on the left, the redesigned workflow structures it on the right. */
    const base=group();prism(base,-80,-62,0,160,124,10,'n');rise(base,.02,.2,22);
    const flow=[[-66,46,10],[-8,-4,10],[64,-48,10]];
    const conveyor=line(group(),flow,'sl sl-route');draw(conveyor,.2,.46);
    /* Scattered, uneven blocks: the inefficiencies. */
    const mess=group(),blocks=[[-74,26,9,7,6,-14],[-60,40,6,9,11,10],[-50,22,8,6,5,-22],[-70,48,7,7,8,16],[-56,52,5,5,4,-8]];
    blocks.forEach(([x,y,w,d,h,r],i)=>{const g=group(mess),s=prism(g,x,y,10,w,d,h,i%2?'t':'n'),c=P(x+w/2,y+d/2,10);g.setAttribute('data-r',r);
      at(.14+i*.04,.34+i*.04,e=>{const k=outCubic(e);g.setAttribute('transform','translate(0 '+f1((1-k)*18)+') rotate('+f1(r*k)+' '+f1(c[0])+' '+f1(c[1])+')');g.setAttribute('opacity',f1(Math.min(1,e*1.6)))})});
    /* The engine: a workflow block with a live core, and the founder's flag on top. */
    const engine=group();const body=prism(engine,-26,-26,10,40,40,26,'t');const lid=prism(engine,-20,-20,36,28,28,5,'e');
    const core=P(-6,-6,41);const pulse=el('ellipse',{cx:f1(core[0]),cy:f1(core[1]),rx:9,ry:5,class:'core'},engine);
    rise(engine,.32,.54,26);
    const flagG=group(engine),fb=P(-6,-6,41);line(flagG,[[-6,-6,41],[-6,-6,82]],'sl');
    const cloth=el('path',{class:'flag'},flagG);
    pop(flagG,fb,.56,.68);
    /* Structured output: aligned cubes stacking up. */
    const out=group(),cells=[];for(let r=0;r<2;r++)for(let c=0;c<3;c++)cells.push([30+c*13,-58+r*13]);
    cells.forEach(([x,y],i)=>{const g=group(out);prism(g,x,y,10,11,11,11,'e');pop(g,P(x+5,y+5,16),.6+i*.04,.72+i*.04)});
    const top2=group(out);[[30,-58],[43,-58]].forEach(([x,y],i)=>prism(top2,x,y,21,11,11,11,i?'t':'e'));rise(top2,.84,.95,14);
    /* Tokens in flight: irregular in, structured out. */
    const inTok=group(),outTok=group(),inShape=el('rect',{x:-5,y:-5,width:10,height:10,rx:2,class:'tok-in'},inTok);prism(outTok,-4,-4,10,8,8,8,'e');
    inTok.setAttribute('opacity','0');outTok.setAttribute('opacity','0');
    loops.push(t=>{
      const k=(t*.32)%1,o=P(0,0,10);
      if(k<.5){const u=k/.5,p=along(flow.slice(0,2),u);inTok.setAttribute('transform','translate('+f1(p[0])+' '+f1(p[1]-6)+') rotate('+f1(t*90)+')');inTok.setAttribute('opacity',f1(Math.sin(u*Math.PI)*.9+.1*(u<.9)));outTok.setAttribute('opacity','0')}
      else{const u=(k-.5)/.5,p=along(flow.slice(1),u);outTok.setAttribute('transform','translate('+f1(p[0]-o[0])+' '+f1(p[1]-o[1])+')');outTok.setAttribute('opacity',f1(Math.sin(u*Math.PI)));inTok.setAttribute('opacity','0')}
      pulse.setAttribute('opacity',f1(.55+.45*Math.sin(t*3)));pulse.setAttribute('rx',f1(8+1.4*Math.sin(t*3)));
      const w=Math.sin(t*3.2)*2.4,top=fb[1]-41;
      cloth.setAttribute('d','M'+f1(fb[0])+' '+f1(top)+' q7 '+f1(-2+w)+' 15 '+f1(3)+' q-7 '+f1(2-w)+' -15 '+f1(7)+' z');
    });
    const wv=fb[1]-41;cloth.setAttribute('d','M'+f1(fb[0])+' '+f1(wv)+' q7 -2 15 3 q-7 2 -15 7 z');
  }

  else {
    /* Applied AI — a layered core, evaluated, serving four kinds of work. */
    const base=group();prism(base,-80,-62,0,160,124,10,'n');rise(base,.02,.2,22);
    const orbitRing=ring(group(),0,0,10,50,'sl-soft sl-dash');fade(orbitRing,.2,.4);
    const ringNodes=group(),rn=[0,1,2,3,4,5].map(()=>dot(ringNodes,[0,0],2.4,'sd'));fade(ringNodes,.4,.5);
    /* Four workstreams fanned around the core: knowledge (left), employee productivity (right),
       customer acquisition (front left) and decision support (front right). */
    const mods=group();
    const knowledge=group(mods);[0,1,2].forEach(i=>prism(knowledge,-70+i*3,18-i*3,10+i*5,24,24,3,i===2?'t':'n'));
    [0,1].forEach(r=>line(knowledge,[[-62,26+r*7,25.2],[-52,26+r*7,25.2]],'sl-soft'));
    const product=group(mods);prism(product,18,-70,10,24,24,5,'n');
    [0,1,2].forEach(r=>{line(product,[[26,-64+r*7,15.2],[38,-64+r*7,15.2]],'sl-soft');dot(product,P(22,-64+r*7,15.2),1.7,r<2?'sd':'sd-w')});
    const funnel=group(mods),fz=[[34,15],[25,10],[16,5]];prism(funnel,-17,53,10,10,10,4,'e');
    fz.forEach(([z,r],i)=>{ring(funnel,-12,58,z,r,i?'sl-soft':'sl')});
    [[-1,0],[1,0]].forEach(([sx])=>line(funnel,[[-12+sx*15*.7071,58-sx*15*.7071,34],[-12+sx*5*.7071,58-sx*5*.7071,16]],'sl-soft'));
    const leads=[0,1,2].map(()=>dot(funnel,P(-12,58,48),2.2,'sd'));
    const decide=group(mods),dh=[10,18,28];const dbar=dh.map((h,i)=>prism(decide,47+i*8,-16,10,7,8,h,i===2?'e':'t'));
    [knowledge,product,funnel,decide].forEach((g,i)=>rise(g,.3+i*.05,.5+i*.05,18));
    /* Links: module ↔ core. */
    const ends=[[-58,30],[30,-58],[-12,58],[58,-12]],links=ends.map(([x,y],i)=>{const p=line(group(),[[x,y,11],[x*.42,y*.42,11]],'sl');draw(p,.48+i*.04,.64+i*.04);root.insertBefore(p.parentNode,mods);return p});
    /* The core: three tiers and an orb, ringed by its evaluation. */
    const coreG=group();
    const tiers=[prism(coreG,-22,-22,10,44,44,10,'t'),prism(coreG,-15,-15,20,30,30,10,'t'),prism(coreG,-8,-8,30,16,16,10,'e')];
    tiers.forEach((tr,i)=>rise(tr.g,.24+i*.08,.42+i*.08,20+i*6));
    const oc=P(0,0,66),orbG=group(coreG);
    const halo=el('circle',{cx:f1(oc[0]),cy:f1(oc[1]),r:30,fill:'url(#'+uid+'g)'},orbG);
    const orb=el('circle',{cx:f1(oc[0]),cy:f1(oc[1]),r:10,class:'orb'},orbG);
    el('circle',{cx:f1(oc[0]-3.4),cy:f1(oc[1]-3.6),r:3,class:'orb-hi'},orbG);
    pop(orbG,oc,.5,.66);
    const evalTrack=el('circle',{cx:f1(oc[0]),cy:f1(oc[1]),r:17,class:'eval-track'},coreG);fade(evalTrack,.6,.66);
    const evalArc=el('circle',{cx:f1(oc[0]),cy:f1(oc[1]),r:17,class:'eval',transform:'rotate(-90 '+f1(oc[0])+' '+f1(oc[1])+')'},coreG);
    evalArc.setAttribute('pathLength','1');evalArc.style.strokeDasharray='1 1';
    at(.64,.9,e=>{evalArc.style.strokeDashoffset=(1-.86*smooth(e)).toFixed(4)});
    root.append(funnel,decide); /* the front modules paint over the core */
    const pulses=group(),pp=ends.map(()=>dot(pulses,[0,0],2.6,'spark'));fade(pulses,.7,.8);
    loops.push(t=>{
      rn.forEach((d,i)=>{const a=t*.45+i*Math.PI/3,p=P(Math.cos(a)*50,Math.sin(a)*50,10);d.setAttribute('cx',f1(p[0]));d.setAttribute('cy',f1(p[1]))});
      ends.forEach(([x,y],i)=>{const k=(t*.55+i*.25)%1,inward=Math.floor(t*.55+i*.25)%2===0,u=inward?k:1-k,p=P(x+(x*.42-x)*u,y+(y*.42-y)*u,11);pp[i].setAttribute('cx',f1(p[0]));pp[i].setAttribute('cy',f1(p[1]));pp[i].setAttribute('opacity',f1(Math.sin(k*Math.PI)))});
      const b=1+.06*Math.sin(t*2.2);halo.setAttribute('r',f1(30*b));orb.setAttribute('r',f1(10*(1+.03*Math.sin(t*2.2))));
      dbar.forEach((bb,i)=>bb.set(dh[i]*(1+.12*Math.sin(t*1.4+i*1.3))));
      leads.forEach((d,i)=>{const k=(t*.5+i/3)%1,a=i*2.1,r=12*(1-k),p=P(-12+Math.cos(a)*r*.5,58+Math.sin(a)*r*.5,50-36*k);d.setAttribute('cx',f1(p[0]));d.setAttribute('cy',f1(p[1]));d.setAttribute('opacity',f1(Math.sin(k*Math.PI)))});
    });
  }

  function drawP(p){
    p=clamp(p);if(Math.abs(p-last)<1e-4)return;last=p;
    for(const s of steps)s.fn(clamp((p-s.a)/(s.b-s.a)));
  }
  function tick(t){for(const f of loops)f(t)}
  drawP(1);
  return {draw:drawP,tick};
}
window.Scenes={create};
})();
