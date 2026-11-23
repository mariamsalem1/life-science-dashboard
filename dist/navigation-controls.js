/* One visibility state for the map drawer and the dashboard tab bar. */
let dashboardNavigationClosed=false;
function setDashboardNavigation(closed){
 dashboardNavigationClosed=Boolean(closed);
 syncDashboardNavigation();
 const target=document.querySelector(closed?'.navigation-reopen':'#nav button.active');
 target?.focus();
 window.dispatchEvent(new Event('resize'));
}
function syncDashboardNavigation(){
 const nav=document.querySelector('#nav');if(!nav)return;
 document.body.classList.toggle('dashboard-navigation-closed',dashboardNavigationClosed);
 nav.classList.toggle('open',!dashboardNavigationClosed);
 nav.setAttribute('aria-label','Dashboard Navigation');
 nav.setAttribute('aria-hidden',String(dashboardNavigationClosed));
 if(typeof drawerOpen!=='undefined')drawerOpen=!dashboardNavigationClosed;
 if(!nav.querySelector('.navigation-close')){
  const close=document.createElement('button');close.className='navigation-close';close.textContent='×';close.title='Close Navigation';close.setAttribute('aria-label','Close Navigation');close.onclick=()=>setDashboardNavigation(true);nav.appendChild(close);
 }
 let reopen=document.querySelector('.navigation-reopen');if(!reopen){
  reopen=document.createElement('button');reopen.className='navigation-reopen';reopen.textContent='☰ Navigation';reopen.setAttribute('aria-controls','nav');reopen.onclick=()=>setDashboardNavigation(false);document.querySelector('.controls')?.appendChild(reopen);
 }
 reopen?.setAttribute('aria-expanded',String(!dashboardNavigationClosed));
 document.querySelectorAll('.navigation-handle').forEach(handle=>{handle.hidden=true;handle.setAttribute('aria-hidden','true');handle.tabIndex=-1});
}
/* Older map links and Escape use this same state too. */
toggleNavigation=function(){setDashboardNavigation(!dashboardNavigationClosed)};
const renderBeforeNavigationControls=render;
render=function(){renderBeforeNavigationControls();syncDashboardNavigation()};
syncDashboardNavigation();
