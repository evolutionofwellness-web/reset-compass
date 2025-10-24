window.onload = () => {
  const splash = document.getElementById('splashScreen');
  setTimeout(() => splash.style.display = 'none', 2000);

  if (!localStorage.getItem('welcomeShown')) {
    document.getElementById('welcomePopup').style.display = 'flex';
  }
};

document.getElementById('startButton').onclick = () => {
  document.getElementById('welcomePopup').style.display = 'none';
  localStorage.setItem('welcomeShown', 'true');
};

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`${sectionId}Section`)?.classList.remove('hidden');
  document.getElementById(sectionId)?.classList.remove('hidden');
}

function goToMode(mode) {
  showSection(`${mode}Section`);
  const now = new Date().toLocaleString();
  const entry = `${now} - Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  let history = JSON.parse(localStorage.getItem('resetHistory')) || [];
  history.unshift(entry);
  localStorage.setItem('resetHistory', JSON.stringify(history));
  updateHistory();
}

function updateHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('resetHistory')) || [];
  history.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    list.appendChild(li);
  });
}

updateHistory();