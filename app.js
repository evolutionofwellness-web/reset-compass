const modes = [
  {
    id: 'surviving',
    icon: '🩺',
    label: 'Surviving',
    color: 'mode-surviving',
    description: "You're stressed, tired, or struggling — just trying to get by.",
  },
  {
    id: 'grounded',
    icon: '🌿',
    label: 'Grounded',
    color: 'mode-grounded',
    description: "You're calm and stable, taking care of yourself without pushing too hard.",
  },
  {
    id: 'drifting',
    icon: '🧭',
    label: 'Drifting',
    color: 'mode-drifting',
    description: "You're feeling a little lost or disconnected — going through the motions.",
  },
  {
    id: 'growing',
    icon: '🚀',
    label: 'Growing',
    color: 'mode-growing',
    description: "You're building momentum and making meaningful progress.",
  }
];

function navigate(view) {
  alert("Navigation to '" + view + "' is not set up yet.");
}

function renderHomepage() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="compass">
      ${modes.map((mode, i) => `
        <div class="wedge ${mode.id}" onclick="handleModeClick('${mode.id}')">
          ${mode.label}
        </div>
      `).join('')}
    </div>
    ${modes.map(mode => `
      <button class="mode-button ${mode.color}" onclick="handleModeClick('${mode.id}')">
        ${mode.icon} ${mode.label}
      </button>
      <p class="mode-description">${mode.description}</p>
    `).join('')}
  `;
}

function handleModeClick(modeId) {
  alert(`Mode selected: ${modeId}`);
  // Add future logic here
}

function showWelcomePopupIfFirstVisit() {
  const seen = localStorage.getItem('welcomeShown');
  if (!seen) {
    document.getElementById('welcomePopup').style.display = 'flex';
  }
}

document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('welcomePopup').style.display = 'none';
  localStorage.setItem('welcomeShown', 'true');
});

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splashScreen').style.display = 'none';
    showWelcomePopupIfFirstVisit();
    renderHomepage();
  }, 2000);
});
