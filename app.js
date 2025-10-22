document.addEventListener('DOMContentLoaded', () => {
  // Splash screen
  setTimeout(() => {
    document.getElementById('splashScreen').style.display = 'none';

    // Show welcome popup only once
    if (!localStorage.getItem('popupShown')) {
      document.getElementById('popup').style.display = 'flex';
      localStorage.setItem('popupShown', 'true');
    }
  }, 2000);

  // Start button for welcome popup
  document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none';
  });

  // Nav buttons
  document.querySelectorAll('.nav-menu button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      navigateTo(page);
    });
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      alert(`You selected: ${mode}`);
    });
  });

  // Compass wedges
  document.querySelectorAll('.wedge').forEach((wedge) => {
    wedge.addEventListener('click', () => {
      const mode = wedge.getAttribute('data-mode');
      alert(`You selected: ${mode}`);
    });
  });
});

function navigateTo(pageId) {
  const pages = ['home', 'quickwins', 'history', 'about'];
  pages.forEach((id) => {
    const section = document.getElementById(`${id}Section`);
    if (section) {
      section.style.display = id === pageId ? 'block' : 'none';
    }
  });

  // Highlight active nav
  document.querySelectorAll('.nav-menu button').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
  });
}
