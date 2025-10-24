document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById('splashScreen').classList.add('hidden');

    const seenModal = localStorage.getItem('seenWelcome');
    if (!seenModal) {
      document.getElementById('welcomeModal').classList.remove('hidden');
    } else {
      document.getElementById('appContent').classList.remove('hidden');
      renderHome();
    }
  }, 1200);
});

function closeModal() {
  localStorage.setItem('seenWelcome', 'true');
  document.getElementById('welcomeModal').classList.add('hidden');
  document.getElementById('appContent').classList.remove('hidden');
  renderHome();
}

function renderHome() {
  const main = document.getElementById('mainContent');
  const streak = getStreak();

  main.innerHTML = `
    <div class="streak">🔥 ${streak}-Day Streak</div>
    <button class="mode-button mode-growing" onclick="selectMode('Growing')">Growing</button>
    <button class="mode-button mode-grounded" onclick="selectMode('Grounded')">Grounded</button>
    <button class="mode-button mode-drifting" onclick="selectMode('Drifting')">Drifting</button>
    <button class="mode-button mode-surviving" onclick="selectMode('Surviving')">Surviving</button>
  `;
}

function selectMode(mode) {
  logDay(mode);
  alert(`Mode selected: ${mode}`);
  renderHome();
}

function getStreak() {
  const today = new Date().toISOString().split("T")[0];
  const stored = JSON.parse(localStorage.getItem('streakData')) || { lastDate: '', count: 0 };

  if (stored.lastDate === today) return stored.count;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split("T")[0];

  const newCount = stored.lastDate === yDate ? stored.count + 1 : 1;

  localStorage.setItem('streakData', JSON.stringify({ lastDate: today, count: newCount }));
  return newCount;
}

function logDay(mode) {
  const date = new Date().toISOString().split("T")[0];
  const logs = JSON.parse(localStorage.getItem('modeLogs')) || [];
  logs.push({ date, mode });
  localStorage.setItem('modeLogs', JSON.stringify(logs));
}

function renderQuickWins() {
  document.getElementById('mainContent').innerHTML = `<p>Quick Wins section coming soon.</p>`;
}

function renderHistory() {
  const logs = JSON.parse(localStorage.getItem('modeLogs')) || [];
  let html = `<h2>History</h2>`;
  if (logs.length === 0) {
    html += `<p>No logs yet.</p>`;
  } else {
    html += `<ul>${logs.map(log => `<li>${log.date}: ${log.mode}</li>`).join('')}</ul>`;
  }
  document.getElementById('mainContent').innerHTML = html;
}

function renderAbout() {
  document.getElementById('mainContent').innerHTML = `
    <h2>About This App</h2>
    <p>The Reset Compass helps you take simple, effective actions based on how you feel each day. It’s your daily anchor for better health.</p>
  `;
}