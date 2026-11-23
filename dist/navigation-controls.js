/* Keep menu visibility separate from its fixed position. */
let dashboardNavigationClosed=true;
function setDashboardNavigation(closed){
 dashboardNavigationClosed=Boolean(closed);syncDashboardNavigation();
 document.querySelector(closed?'.navigation-reopen':'#nav .active')?.focus();
 window.dispatchEvent(new Event('resize'));
}
function syncDashboardNavigation(){
 const nav=document.querySelector('#nav');if(!nav)return;
 document.body.classList.toggle('dashboard-navigation-closed',dashboardNavigationClosed);
 nav.classList.toggle('open',!dashboardNavigationClosed);
 nav.setAttribute('aria-label','Dashboard Navigation');nav.setAttribute('aria-hidden',String(dashboardNavigationClosed));
 if(typeof drawerOpen!=='undefined')drawerOpen=!dashboardNavigationClosed;
 if(!nav.querySelector('.navigation-close')){const close=document.createElement('button');close.className='navigation-close';close.textContent='×';close.title='Close Navigation';close.setAttribute('aria-label','Close Navigation');close.onclick=()=>setDashboardNavigation(true);nav.appendChild(close)}
 let reopen=document.querySelector('.navigation-reopen');if(!reopen){reopen=document.createElement('button');reopen.className='navigation-reopen';reopen.textContent='☰  Navigation  ›';reopen.setAttribute('aria-controls','nav');reopen.onclick=()=>setDashboardNavigation(false)}
 if(reopen.parentElement!==document.body)document.body.appendChild(reopen);
 reopen.textContent='☰  Navigation  ›';reopen.setAttribute('aria-label','Open Navigation');reopen.setAttribute('aria-expanded',String(!dashboardNavigationClosed));
 document.querySelectorAll('.navigation-handle').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true');el.tabIndex=-1});
}
toggleNavigation=function(){setDashboardNavigation(!dashboardNavigationClosed)};
const renderBeforeNavigationControls=render;
render=function(){const closed=dashboardNavigationClosed;renderBeforeNavigationControls();dashboardNavigationClosed=closed;syncDashboardNavigation()};
syncDashboardNavigation();
