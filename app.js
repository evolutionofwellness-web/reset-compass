document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splashScreen');
  const welcome = document.getElementById('welcomePopup');
  const startBtn = document.getElementById('startButton');

  if (splash) {
    setTimeout(() => {
      splash.style.display = 'none';
    }, 2000);
  }

  if (!localStorage.getItem('welcomeShown')) {
    welcome.style.display = 'flex';
  } else {
    welcome.style.display = 'none';
  }

  startBtn.addEventListener('click', () => {
    welcome.style.display = 'none';
    localStorage.setItem('welcomeShown', 'true');
  });

  const compass = document.getElementById('compass');
  const modes = [
    { name: 'Growing', class: 'growing', emoji: '🚀' },
    { name: 'Surviving', class: 'surviving', emoji: '🩺' },
    { name: 'Grounded', class: 'grounded', emoji: '🌿' },
    { name: 'Drifting', class: 'drifting', emoji: '🧭' }
  ];

  compass.innerHTML = '';

  modes.forEach(mode => {
    const wedge = document.createElement('div');
    wedge.className = `wedge ${mode.class}`;
    wedge.innerHTML = `<span>${mode.emoji} ${mode.name}</span>`;
    compass.appendChild(wedge);
  });
});
