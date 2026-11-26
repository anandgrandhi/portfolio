const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const safe=s=>/^(https:\/\/|images\/)[^\s]*$/i.test(s)?esc(s):'';const toggle=document.querySelector('#toggle'),menu=document.querySelector('#menu');function close(){menu.hidden=true;toggle.textContent='Menu';toggle.setAttribute('aria-expanded','false')}toggle.onclick=()=>{if(!menu.hidden)return close();menu.hidden=false;toggle.textContent='Close';toggle.setAttribute('aria-expanded','true')};menu.onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});fetch('content.json').then(r=>{if(!r.ok)throw Error('Content unavailable');return r.json()}).then(d=>{document.querySelector('#intro').innerHTML=d.intro.map(x=>'<p>'+x+'</p>').join('');document.querySelector('#projects').innerHTML=d.projects.filter(p=>!['Publishing faster without sacrificing editorial accuracy','Helping teachers see where students were actually struggling'].includes(p.title)).map(p=>'<details><summary><div><span class="meta">'+esc(p.company).replace(/BYJU’S|\b(Amazon|AI|ARCHMATION)\b/g,'<strong class="blue">$&</strong>')+'</span><span class="project-title">'+esc(p.title)+'</span></div><div class="metric">'+esc(p.metric)+'<span class="expand">+</span><small>'+esc(p.unit)+'</small></div></summary><div class="case"><span class="case-status">'+esc(p.status||'')+'</span>'+(p.context?'<p class="muted">'+esc(p.context)+'</p>':'')+'<div class="case-lead"><h3>The business problem</h3><p>'+esc(p.problem)+'</p></div><div class="case-grid">'+[['What I discovered',p.discovery],['What I decided and why',p.decision],['What we built',p.approach],['How we ensured reliability',p.assurance]].filter(x=>x[1]).map(x=>'<div><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p></div>').join('')+'</div><div class="case-result"><h3>What changed</h3><p>'+esc(p.outcome)+'</p></div>'+p.images.map(i=>'<figure><img loading="lazy" src="'+safe(i.src)+'" alt="'+esc(i.caption)+'"><figcaption>'+esc(i.caption)+'</figcaption></figure>').join('')+'</div></details>').join('');document.querySelector('#jobs').innerHTML=d.jobs.map(j=>'<div class="job"><strong>'+esc(j[0]).replace(/\b(Amazon|ARCHMATION)\b/g,'<span class="blue">$1</span>')+'</strong><div class="jobline">'+esc(j[1])+'<span class="rule"></span>'+(j[2]?'<span class="chip">'+esc(j[2])+'</span>':'')+'</div></div>').join('');document.querySelector('#shelf').innerHTML=d.books.map(b=>'<div class="book" style="background:'+(/^#[0-9a-f]{6}$/i.test(b[2])?b[2]:'#e6eef6')+'">'+(b[3]?'<img src="'+safe(b[3])+'" alt="'+esc(b[0])+'">':'<span>'+esc(b[0])+'</span><small>'+esc(b[1])+'</small>')+'</div>').join('');document.querySelector('#notes').innerHTML=d.notes.map(n=>'<div class="note"><a href="'+safe(n[1])+'">'+esc(n[0])+' ↗</a></div>').join('')}).catch(e=>document.querySelector('#intro').textContent=e.message);
const secondaryProjects=[
  [
    "ARCHMATION",
    "Transforming creative production with generative AI",
    "Developed 11 specialised workflows for product photography, video production, virtual try-on, garment replacement, architectural visualisation and 3D assets. Applications ranged from publication-ready assets to internal design workflows, campaign exploration and client briefs. Built using ComfyUI, ControlNet, LoRA and generative video models. Many workflows were in commercial demand at the time and have since been superseded by newer models.",
    "11 workflows · 45% reduction in video production costs"
  ],
  [
    "Amazon",
    "Turning complex data into actionable decisions",
    "Designed a dashboard combining assessment results, engagement data and concept-level proficiency. Owned product requirements, metric definitions, information architecture and dashboard design. Worked with engineering and design teams to connect these insights to lesson planning, cohort-level decisions and individual interventions.",
    ""
  ],
  [
    "ARCHMATION",
    "Building a unified operating system for creative teams",
    "Built an Airtable-based system to manage client briefs, project schedules, resource allocation, production tasks and approvals. Designed the database structure, interfaces, automated notifications and review workflows. Connected client requirements, internal teams and external vendors within a single workspace.",
    ""
  ],
  [
    "Amazon",
    "Designing personalised and adaptive user journeys",
    "Developed personalised learning pathways based on user behaviour, proficiency and learning goals. Defined diagnostic assessments, recommendation logic, content sequencing, mastery requirements and intervention rules. Used knowledge graphs to map prerequisites and guide progression.",
    ""
  ],
  [
    "Amazon",
    "Streamlining operations and improving efficiency at scale",
    "Redesigned editorial production and quality assessment processes across multiple content formats. Developed evaluation rubrics, error taxonomies, automated validation rules and structured feedback mechanisms. Explored ML-assisted defect classification and used recurring quality issues to inform creator training.",
    "35% → 82% first-draft acceptance · 8 → 3 review iterations · 40% lower publishing turnaround time · 98% editorial accuracy"
  ]
];
const secondarySection=document.createElement('section');secondarySection.id='more-work';secondarySection.className='split';secondarySection.innerHTML='<h2>More selected work</h2><div class="case-grid">'+secondaryProjects.map(p=>'<article><span class="meta">'+esc(p[0])+'</span><h3 class="project-title" style="margin:4px 0 12px">'+esc(p[1])+'</h3><p>'+esc(p[2])+'</p>'+(p[3]?'<p class="blue">'+esc(p[3])+'</p>':'')+'</article>').join('')+'</div>';document.querySelector('#work').after(secondarySection);const moreLink=document.createElement('a');moreLink.href='#more-work';moreLink.textContent='More selected work';menu.querySelector('a[href="#work"]').after(moreLink);
