/* Presentation controls do not animate the workspace or its glass backdrop. */
(()=>{
let previousTab=state.tab;
function fitStatus(message){let status=$('#egypt-fit-status');if(!status){status=document.createElement('div');status.id='egypt-fit-status';status.setAttribute('role','status');document.body.appendChild(status)}status.textContent=message;setTimeout(()=>status.remove(),2400)}
function resetEgyptButton(){
 if(state.tab!=='Overview'){state.tab='Overview';state.factory=-1;render()}
 const map=geoMap;if(!map){fitStatus('Map Is Unavailable');return}
 state.factory=-1;state.area='All areas';state.line=0;mapSelection=-1;
 document.querySelectorAll('.map-detail,.network-panel').forEach(el=>el.remove());networkOpen=false;
 siteMarkers.forEach(marker=>marker.getElement?.()?.querySelector('.site-orb')?.classList.remove('selected'));
 $('#factory').value='-1';if(drawerOpen)toggleNavigation();closeFactoryDrawer();
 const apply=()=>{
  if(map!==geoMap||state.tab!=='Overview')return;
  map.stop();map.setMinZoom(0);map.invalidateSize({pan:false,animate:false});
  const bounds=L.latLngBounds([[22,24.7],[31.8,37]]),padding=L.point(72,180);
  let zoom=Math.max(0,Math.min(6,map.getBoundsZoom(bounds,false,padding)));
  const southWest=map.project(bounds.getSouthWest(),zoom),northEast=map.project(bounds.getNorthEast(),zoom);
  const center=map.unproject(southWest.add(northEast).divideBy(2),zoom);
  map.setView(center,zoom,{animate:false,reset:true});
  for(let tries=0;tries<3&&!map.getBounds().contains(bounds)&&zoom>0;tries++)map.setView(center,--zoom,{animate:false,reset:true});
  map.setMinZoom(Math.min(3,zoom));fitStatus(map.getBounds().contains(bounds)?'Egypt View Restored':'Zoom Out To See More Of Egypt');
 };
 if(window.requestAnimationFrame)window.requestAnimationFrame(apply);else setTimeout(apply,0);
}
window.resetEgyptButton=resetEgyptButton;
function bindEgyptButton(){const button=$('#fit-egypt')||[...document.querySelectorAll('.map-switcher button')].find(b=>b.textContent.trim().toLowerCase()==='fit egypt');if(!button)return;button.id='fit-egypt';button.removeAttribute('onclick');button.onclick=resetEgyptButton;button.type='button';button.title='Reset Zoom And Show All Of Egypt'}
function slideIndex(){return Math.max(0,tabs.indexOf(state.tab))}
function navigateSlide(delta){const next=slideIndex()+delta;if(next<0||next>=tabs.length)return;go(tabs[next])}
function pickSlide(index){if(!Number.isInteger(index)||!tabs[index])return;$('#modal').close();go(tabs[index])}
function showSlides(){openModal('Dashboard Slides',`<p>Select A Slide · Use Left And Right Arrow Keys To Navigate</p><div class="dashboard-slide-picker">${tabs.map((tab,i)=>`<button onclick="pickDashboardSlide(${i})" class="${state.tab===tab?'selected':''}" aria-label="Slide ${i+1}: ${escapeHTML(tab)}"><span>${String(i+1).padStart(2,'0')}</span><strong>${escapeHTML(tab)}</strong><small>${state.tab===tab?'Current Slide':'Open Slide →'}</small></button>`).join('')}</div>`);$('#modal').classList.add('wide-modal')}
window.changeDashboardSlide=navigateSlide;window.pickDashboardSlide=pickSlide;window.showDashboardSlides=showSlides;
function mountDeck(){
 document.body.classList.add('presentation-navigation');bindEgyptButton();
 const footer=document.querySelector('footer');if(!footer)return;const index=slideIndex();
 footer.innerHTML=`<div class="deck-navigation"><button onclick="changeDashboardSlide(-1)" ${index===0?'disabled':''} aria-label="Previous Dashboard Slide">← Previous</button><button onclick="showDashboardSlides()" title="Choose A Slide" aria-label="Open Dashboard Slide Picker">▦ Slides</button></div><div class="deck-center"><div class="deck-caption"><strong>${escapeHTML(state.tab)}</strong><span>${index+1} / ${tabs.length}</span></div><div class="deck-progress" role="group" aria-label="Dashboard Slides">${tabs.map((tab,i)=>`<button onclick="pickDashboardSlide(${i})" title="${escapeHTML(tab)}" aria-label="Go To Slide ${i+1}: ${escapeHTML(tab)}" ${i===index?'aria-current="step"':''} class="${i===index?'current':i<index?'visited':''}"></button>`).join('')}</div></div><div class="deck-next"><span>← → Navigate</span><button onclick="changeDashboardSlide(1)" ${index===tabs.length-1?'disabled':''} aria-label="Next Dashboard Slide">Next →</button></div>`;
 if(previousTab!==state.tab){const caption=footer.querySelector('.deck-caption strong');if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)caption.animate?.([{transform:'translateX(10px)'},{transform:'translateX(0)'}],{duration:160,easing:'ease-out'})}previousTab=state.tab;
}
const before=render;render=function(){before();mountDeck()};
document.addEventListener('keydown',event=>{if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;const target=event.target;if(target?.closest?.('input,select,textarea,[contenteditable="true"],[role="slider"],svg,[data-viz-point]')||document.querySelector('dialog[open]'))return;const delta=['ArrowRight','PageDown'].includes(event.key)?1:['ArrowLeft','PageUp'].includes(event.key)?-1:0;if(delta){event.preventDefault();navigateSlide(delta)}});
mountDeck();
})();
