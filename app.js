window.onload = () => {
  setTimeout(() => {
    document.getElementById('splashScreen').style.display = 'none';

    if (!localStorage.getItem('welcomeShown')) {
      document.getElementById('welcomeModal').style.display = 'flex';
    }
  }, 2000);

  updateStreak();
  showSection('home');
};

function closeWelcome() {
  document.getElementById('welcomeModal').style.display = 'none';
  localStorage.setItem('welcomeShown', 'true');
}

function showSection(id) {
  document.querySelectorAll('main section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  if (id === 'history') updateStreak(true);
}

function selectMode(mode) {
  const today = new Date().toISOString().split('T')[0];
  let log = JSON.parse(localStorage.getItem('log') || '{}');
  log[today] = mode;
  localStorage.setItem('log', JSON.stringify(log));
  updateStreak();
  alert(`Logged mode: ${mode}`);
}

function updateStreak(showHistory = false) {
  const log = JSON.parse(localStorage.getItem('log') || '{}');
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let date = new Date();

  while (true) {
    const dateString = date.toISOString().split('T')[0];
    if (log[dateString]) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  const text = `🔥 ${streak}-day streak`;
  document.getElementById('streakDisplay').innerText = text;
  if (showHistory) {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    Object.entries(log).reverse().forEach(([date, mode]) => {
      const li = document.createElement('li');
      li.textContent = `${date}: ${mode}`;
      list.appendChild(li);
    });
    document.getElementById('historyStreak').innerText = text;
  }
}