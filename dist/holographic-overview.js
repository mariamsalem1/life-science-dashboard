/* Live factory controls over the approved holographic artwork. */
const holographicPositions=[[41,61],[55,38],[27,35],[78,58]];
const networkBeforeHologram=terrainNetwork;
terrainNetwork=function(){
 const box=document.createElement('div');box.innerHTML=networkBeforeHologram();const selectedFactory=state.factory;try{state.factory=-1;const kpis=box.querySelector('.terrain-kpis');if(kpis){kpis.innerHTML=networkTiles();kpis.querySelectorAll('button[onclick]').forEach(button=>button.setAttribute('onclick','state.factory=-1;'+button.getAttribute('onclick')))}}finally{state.factory=selectedFactory}
 const stage=box.querySelector('.terrain-stage'),art=box.querySelector('.terrain-art');if(!stage||!art)return box.innerHTML;
 stage.classList.add('holographic-stage');art.classList.add('holographic-art');
 const image=art.querySelector(':scope>img');image.src='assets/holographic-egypt.png';image.alt='Illustrative Holographic Egypt With The Nile, Delta And Sinai';
 art.querySelectorAll('.terrain-sea,.terrain-egypt').forEach(el=>el.remove());
 const links=[[2,1],[1,0],[0,3],[2,0]],paths=links.map(([from,to])=>{const a=holographicPositions[from],b=holographicPositions[to],x1=a[0]*10,y1=a[1]*5.625,x2=b[0]*10,y2=b[1]*5.625;const midX=(x1+x2)/2,controlY=Math.min(y1,y2)-48,midY=(y1+2*controlY+y2)/4;return `<path class="holo-link ${terrainSelection===from||terrainSelection===to?'selected':''}" d="M${x1} ${y1} Q${midX} ${controlY} ${x2} ${y2}"/><circle class="holo-link-node" cx="${midX}" cy="${midY}" r="3"/>`}).join('');
 art.insertAdjacentHTML('beforeend',`<svg class="holo-connections" viewBox="0 0 1000 562.5" preserveAspectRatio="none" aria-hidden="true">${paths}</svg><span class="holo-egypt-word" aria-hidden="true">E G Y P T</span>`);
 art.querySelectorAll('.terrain-pin').forEach((pin,i)=>{const p=holographicPositions[i];pin.style.left=p[0]+'%';pin.style.top=p[1]+'%';pin.dataset.factory=String(i);pin.setAttribute('aria-pressed',String(i===terrainSelection));pin.insertAdjacentHTML('afterbegin','<i class="holo-factory-pad" aria-hidden="true"></i>');pin.querySelector('span')?.classList.add('holo-factory-label')});
 stage.insertAdjacentHTML('afterbegin',`<div class="holo-spotlight" aria-hidden="true"></div>`);
 const notice=stage.querySelector('.terrain-notice');if(notice)notice.textContent='Illustrative Holographic View · Approximate Factory Locations';
 box.querySelectorAll('.terrain-bottom button').forEach(button=>{if(/3d terrain/i.test(button.textContent))button.textContent='Holographic View'});
 return box.innerHTML;
};
function bindHolographicLighting(){const stage=$('.holographic-stage');if(!stage)return;let frame=0;stage.addEventListener('pointermove',event=>{if(frame)return;const x=event.clientX,y=event.clientY;const draw=()=>{frame=0;if(!stage.isConnected)return;const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;stage.style.setProperty('--pointer-x',((x-r.left)/r.width*100)+'%');stage.style.setProperty('--pointer-y',((y-r.top)/r.height*100)+'%')};if(window.requestAnimationFrame)frame=window.requestAnimationFrame(draw);else draw()});stage.addEventListener('pointerleave',()=>{stage.style.removeProperty('--pointer-x');stage.style.removeProperty('--pointer-y')})}
const renderBeforeHolographicOverview=render;render=function(){renderBeforeHolographicOverview();document.documentElement.classList.toggle('earth-network-background',state.tab==='Factory Overview'&&!factoryInterior);if(state.tab==='Factory Overview'&&!factoryInterior)document.querySelectorAll('#main>.business-strip,#main>.screen-content>.business-strip').forEach(el=>el.remove());bindHolographicLighting()};
