/* Navigation visibility is independent of the selected dashboard tab. */
let dashboardNavigationClosed=false;
function setDashboardNavigation(closed){dashboardNavigationClosed=closed;syncDashboardNavigation();window.dispatchEvent(new Event('resize'))}
function syncDashboardNavigation(){
 const nav=document.querySelector('#nav');if(!nav)return;
 document.body.classList.toggle('dashboard-navigation-closed',dashboardNavigationClosed);
 nav.setAttribute('aria-label','Dashboard Navigation');
 if(!nav.querySelector('.navigation-close')){const close=document.createElement('button');close.className='navigation-close';close.textContent='×';close.title='Close Navigation';close.setAttribute('aria-label','Close Navigation');close.onclick=()=>setDashboardNavigation(true);nav.appendChild(close)}
 let reopen=document.querySelector('.navigation-reopen');if(!reopen){reopen=document.createElement('button');reopen.className='navigation-reopen';reopen.textContent='☰ Navigation';reopen.setAttribute('aria-controls','nav');reopen.onclick=()=>setDashboardNavigation(false);document.querySelector('.controls')?.appendChild(reopen)}
 reopen?.setAttribute('aria-expanded',String(!dashboardNavigationClosed));
 if(dashboardNavigationClosed)reopen?.focus();
}
const renderBeforeNavigationControls=render;
render=function(){renderBeforeNavigationControls();syncDashboardNavigation()};
syncDashboardNavigation();
