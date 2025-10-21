document.addEventListener('DOMContentLoaded', function () {
  // Splash logic
  const splash = document.getElementById('splash');
  setTimeout(() => {
    splash.style.display = 'none';
    showWelcomePopup();
  }, 2200);

  // Welcome popup
  function showWelcomePopup() {
    const popupShown = localStorage.getItem('popupShown');
    const popup = document.getElementById('welcomePopup');
    if (!popupShown) {
      popup.style.display = 'flex';
    } else {
      popup.style.display = 'none';
    }
    document.getElementById('startButton').addEventListener('click', function () {
      popup.style.display = 'none';
      localStorage.setItem('popupShown', 'true');
    });
  }

  // Mode buttons
  const modes = ['growing', 'surviving', 'grounded', 'drifting'];
  modes.forEach(mode => {
    const btn = document.getElementById(`${mode}Btn`);
    if (btn) {
      btn.addEventListener('click', () => logModeChoice(mode));
    }
  });

  // Logging
  function logModeChoice(mode) {
    const today = new Date().toISOString().split('T')[0];
    const history = JSON.parse(localStorage.getItem('modeHistory')) || [];
    history.push({ date: today, mode });
    localStorage.setItem('modeHistory', JSON.stringify(history));
    alert(`Mode "${mode}" logged for today.`);
  }

  // Compass Rendering
  const compass = document.getElementById('compass');
  if (compass) {
    compass.innerHTML = `
      <div class="wedge growing"><span>🚀 Growing</span></div>
      <div class="wedge surviving"><span>🩺 Surviving</span></div>
      <div class="wedge grounded"><span>🌿 Grounded</span></div>
      <div class="wedge drifting"><span>🧭 Drifting</span></div>
    `;
  }
});
