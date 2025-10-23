document.addEventListener('DOMContentLoaded', () => {
  // Splash screen logic
  const splash = document.getElementById('splashScreen');
  if (splash) {
    setTimeout(() => {
      splash.style.display = 'none';
      showWelcomePopup();
    }, 2000);
  }

  function showWelcomePopup() {
    const popup = document.getElementById('welcomePopup');
    const appContent = document.getElementById('appContent');
    if (!localStorage.getItem('hasSeenPopup')) {
      popup.style.display = 'block';
    } else {
      appContent.style.display = 'block';
      showSection('homeSection');
    }
  }

  const startButton = document.getElementById('startButton');
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.setItem('hasSeenPopup', 'true');
      document.getElementById('welcomePopup').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
      showSection('homeSection');
    });
  }

  // Show target section and hide others
  function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
  }

  // Top nav buttons
  document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      showSection(target);
    });
  });

  // Mode buttons
  document.querySelectorAll('.mode-button').forEach(button => {
    button.addEventListener('click', () => {
      alert(`You selected: ${button.innerText}`);
    });
  });

  // Compass wedges
  const modeMap = {
    growing: '🚀 Growing',
    drifting: '🧭 Drifting',
    surviving: '🩺 Surviving',
    grounded: '🌿 Grounded'
  };

  const compass = document.getElementById('compass');
  if (compass) {
    compass.addEventListener('click', (e) => {
      if (e.target.tagName === 'path' && e.target.dataset.mode) {
        const mode = e.target.dataset.mode;
        alert(`You selected: ${modeMap[mode]}`);
      }
    });
  }
});