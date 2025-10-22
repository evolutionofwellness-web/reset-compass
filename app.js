// Splash screen logic
window.addEventListener('load', () => {
  const splash = document.getElementById('splashScreen');
  setTimeout(() => {
    splash.style.display = 'none';
    showWelcomePopup();
  }, 2000);
});

function showWelcomePopup() {
  if (!localStorage.getItem('hasSeenPopup')) {
    document.getElementById('welcomePopup').style.display = 'block';
  } else {
    document.getElementById('appContent').style.display = 'block';
  }
}

document.getElementById('startButton').addEventListener('click', () => {
  localStorage.setItem('hasSeenPopup', 'true');
  document.getElementById('welcomePopup').style.display = 'none';
  document.getElementById('appContent').style.display = 'block';
});

// Navigation
function showSection(id) {
  document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    showSection(btn.getAttribute('data-target'));
  });
});

// Compass mode click routing
const modeMap = {
  growing: '🚀 Growing',
  drifting: '🧭 Drifting',
  surviving: '🩺 Surviving',
  grounded: '🌿 Grounded'
};

document.querySelectorAll('.mode-button').forEach(button => {
  button.addEventListener('click', () => {
    alert(`You selected: ${button.innerText}`);
  });
});

document.getElementById('compass').addEventListener('click', (e) => {
  if (e.target.tagName === 'path' && e.target.dataset.mode) {
    const mode = e.target.dataset.mode;
    alert(`You selected: ${modeMap[mode]}`);
  }
});