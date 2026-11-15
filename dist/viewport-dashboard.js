/* Keep the workspace within the viewport; page long collections without losing records. */
(()=>{
const pages=new Map();let pending=false;
const raf=fn=>(window.requestAnimationFrame?window.requestAnimationFrame(fn):setTimeout(fn,0));
function pager(container,items,size,key){
 if(!items.length)return;
 let control=container._viewportPager;
 if(!control){control=document.createElement('div');control.className='viewport-pager';container.insertAdjacentElement('afterend',control);container._viewportPager=control;}
 const count=Math.max(1,Math.ceil(items.length/size));let page=Math.min(pages.get(key)||0,count-1);
 function show(next){page=Math.max(0,Math.min(count-1,next));pages.set(key,page);items.forEach((el,i)=>el.hidden=i<page*size||i>=(page+1)*size);control.hidden=count===1;control.innerHTML=`<button type="button" aria-label="Previous page" ${page===0?'disabled':''}>‹</button><span>${page*size+1}–${Math.min(items.length,(page+1)*size)} of ${items.length}</span><button type="button" aria-label="Next page" ${page===count-1?'disabled':''}>›</button>`;const buttons=control.querySelectorAll('button');buttons[0].onclick=()=>show(page-1);buttons[1].onclick=()=>show(page+1);}
 show(page);
}
function measure(){
 pending=false;if(!document.body.classList.contains('viewport-dashboard'))return;
 const main=document.querySelector('#main'),footer=document.querySelector('footer');if(!main)return;
 const top=main.getBoundingClientRect().top;
 const footerHeight=footer?.getBoundingClientRect().height||0;
 main.style.setProperty('--dashboard-height',Math.max(220,(window.innerHeight||800)-top-footerHeight-2)+'px');
 document.querySelectorAll('.maintenance-render').forEach(el=>el.style.setProperty('--asset-stage-height',el.getBoundingClientRect().height+'px'));
 const key=state.tab+'|'+state.factory+'|'+(typeof maint==='undefined'?'':maint.type+'|'+maint.status+'|'+maint.search+'|'+maint.index);
 document.querySelectorAll('.maintenance-register-list').forEach((el,i)=>{const rows=[...el.children].filter(x=>!x.classList.contains('maint-empty'));rows.forEach(x=>x.hidden=false);const h=el.getBoundingClientRect().height;pager(el,rows,Math.max(1,Math.floor((h-27)/65)),key+'assets'+i)});
 main.querySelectorAll('.table-scroll').forEach((el,i)=>{const rows=[...el.querySelectorAll('tr')].filter(x=>x.querySelector('td'));if(!rows.length)return;rows.forEach(x=>x.hidden=false);const header=el.querySelector('tr:has(th)');const rowHeight=Math.max(27,rows[0].getBoundingClientRect().height||30);const available=el.getBoundingClientRect().height-(header?.getBoundingClientRect().height||30)-28;pager(el,rows,Math.max(1,Math.floor(available/rowHeight)),key+'table'+i)});
 document.querySelectorAll('.maintenance-history ol').forEach((el,i)=>{const rows=[...el.children];rows.forEach(x=>x.hidden=false);pager(el,rows,Math.max(1,Math.floor((el.getBoundingClientRect().height-26)/43)),key+'history'+i)});
}
function schedule(){if(!pending){pending=true;raf(measure)}}
function prepare(){
 const active=state.tab!=='Overview';document.body.classList.toggle('viewport-dashboard',active);document.body.dataset.screen=state.tab.toLowerCase().replace(/\s+/g,'-');
 if(!active)return;
 const main=document.querySelector('#main');if(main.querySelector('.screen-content'))return;
 const content=document.createElement('div');content.className='screen-content';
 [...main.children].forEach(el=>{if(!['crumb','title','workspace-tools','kpis'].some(c=>el.classList.contains(c))){if(el.classList.contains('note')){el.hidden=true;return;}content.appendChild(el)}});main.appendChild(content);if(content.children.length===1)content.classList.add("single-screen");
 content.querySelectorAll('.panel>table').forEach(table=>{const box=document.createElement('div');box.className='table-scroll';table.replaceWith(box);box.appendChild(table)});
 const decisions=content.querySelector('.smart-factory-decisions'),foot=content.querySelector('.smart-factory-foot');if(decisions)content.insertBefore(decisions,foot||null);
 if(state.tab==='Quality'){content.querySelectorAll('.analytics-grid>.panel>p,.analytics-grid>.panel>.insight').forEach((el,i)=>{const text=el.innerHTML;const button=document.createElement('button');button.className='viewport-detail-button';button.textContent=i===0?'Recipe limits & notes ↗':'Release rules & notes ↗';button.onclick=()=>openModal(button.textContent,text);el.replaceWith(button)})}
 const grid=content.querySelector('.analytics-grid');
 if(grid&&(window.innerWidth||1600)<1100&&grid.children.length>2){const panels=[...grid.children];const controls=document.createElement('div');controls.className='viewport-pager';const max=Math.ceil(panels.length/2);const key='sections|'+state.tab;let page=Math.min(pages.get(key)||0,max-1);function show(next){page=Math.max(0,Math.min(max-1,next));pages.set(key,page);panels.forEach((el,i)=>el.hidden=Math.floor(i/2)!==page);grid.style.gridTemplateColumns=(window.innerWidth||1600)<650?'1fr':'repeat(2,minmax(0,1fr))';grid.style.gridTemplateRows=(window.innerWidth||1600)<650?'repeat(2,minmax(0,1fr))':'minmax(0,1fr)';controls.innerHTML='<button aria-label="Previous charts">‹</button><span>Charts '+(page*2+1)+'–'+Math.min(panels.length,page*2+2)+' of '+panels.length+'</span><button aria-label="Next charts">›</button>';const buttons=controls.querySelectorAll('button');buttons[0].disabled=page===0;buttons[1].disabled=page===max-1;buttons[0].onclick=()=>show(page-1);buttons[1].onclick=()=>show(page+1)}const host=document.createElement('div');host.className='viewport-section-host';grid.replaceWith(host);host.appendChild(grid);host.appendChild(controls);grid.style.flex='1';show(page)}
 const sustainability=state.tab==='Sustainability'&&content.querySelector('.analytics-grid');if(sustainability&&sustainability.children.length<=4)sustainability.classList.add('filtered');
 if(document.querySelector('.controls')&&!document.querySelector('.viewport-fullscreen')){const button=document.createElement('button');button.className='viewport-fullscreen';button.textContent='⛶';button.title='Toggle fullscreen';button.setAttribute('aria-label','Toggle fullscreen dashboard');button.onclick=()=>{const promise=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();promise?.catch(()=>{});};document.querySelector('.controls').appendChild(button)}
 schedule();
}
const prior=render;render=function(){prior();prepare()};
if(window.addEventListener){window.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(schedule);['.controls','#nav'].forEach(s=>{const el=document.querySelector(s);if(el)observer.observe(el)})}}
prepare();
})();
