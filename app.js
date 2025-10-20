// app.js v11 – Splash, welcome popup, localStorage, routing

window.addEventListener('DOMContentLoaded', () => {
  const splash = document.createElement('div');
  splash.id = 'splash';
  splash.innerHTML = '<img src="icons/icon-192.png" alt="Reset Compass">';
  document.body.appendChild(splash);

  setTimeout(() => splash.remove(), 2500);

  if (!localStorage.getItem('hasVisited')) {
    document.getElementById('welcome-popup')?.classList.add('show');
  }

  document.querySelector('#welcome-popup button')?.addEventListener('click', () => {
    localStorage.setItem('hasVisited', 'true');
    document.getElementById('welcome-popup')?.classList.remove('show');
  });

  // Routing logic
  const routes = {
    '#/home': renderHome,
    '#/wins': renderWins,
    '#/history': renderHistory,
    '#/about': renderAbout,
    '#/surviving': () => renderMode('Surviving'),
    '#/drifting': () => renderMode('Drifting'),
    '#/grounded': () => renderMode('Grounded'),
    '#/growing': () => renderMode('Growing'),
  };

  function router() {
    const view = routes[location.hash] || renderHome;
    view();
  }

  window.addEventListener('hashchange', router);
  router(); // Initial call

  // Add other helper functions like renderHome(), renderMode(), etc. as before
});
