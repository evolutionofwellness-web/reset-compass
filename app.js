// Show splash screen, then modal
window.onload = function () {
  const splash = document.getElementById('splashScreen');
  const welcomePopup = document.getElementById('welcomePopup');
  const startButton = document.getElementById('startButton');

  setTimeout(() => {
    splash.style.display = 'none';

    if (!localStorage.getItem('hasVisited')) {
      welcomePopup.style.display = 'block';
    } else {
      document.getElementById('homeSection').classList.add('active');
      updateStreak();
      updateHistory();
    }
  }, 2200);

  startButton.onclick = () => {
    localStorage.setItem('hasVisited', 'true');
    welcomePopup.style.display = 'none';
    document.getElementById('homeSection').classList.add('active');
    updateStreak();
    updateHistory();
  };
};

// Nav logic
document.querySelectorAll('.navBtn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(button.dataset.section).classList.add('active');
    if (button.dataset.section === 'historySection') updateHistory();
  });
});

// Mode logic
const modes = {
  surviving: {
    name: "Surviving",
    color: "#D0021B",
    activities: ["Take a cold shower", "Write down 3 worries", "Ask for help"]
  },
  drifting: {
    name: "Drifting",
    color: "#F5A623",
    activities: ["Journal your thoughts", "Go for a walk", "Turn off notifications"]
  },
  grounded: {
    name: "Grounded",
    color: "#7ED321",
    activities: ["Meal prep", "Stretch for 5 min", "Finish a small task"]
  },
  growing: {
    name: "Growing",
    color: "#4A90E2",
    activities: ["Read 10 pages", "Learn something new", "Start a side project"]
  }
};

// From compass or button click
function selectMode(modeKey) {
  const mode = modes[modeKey];
  const modeTitle = document.getElementById('modeTitle');
  const activityList = document.getElementById('activityList');

  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.getElementById('modeSection').classList.add('active');

  modeTitle.textContent = `${mode.name} Mode`;
  activityList.innerHTML = '';

  mode.activities.forEach((activity, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${activity}</strong><br><textarea placeholder="What did you do?"></textarea>`;
    activityList.appendChild(li);
  });

  saveModeChoice(modeKey);
}

// Logging and streak
function saveModeChoice(modeKey) {
  const today = new Date().toISOString().split('T')[0];
  const data = JSON.parse(localStorage.getItem('modeLog') || '{}');
  data[today] = modeKey;
  localStorage.setItem('modeLog', JSON.stringify(data));
  updateStreak();
}

// Streak logic
function updateStreak() {
  const data = JSON.parse(localStorage.getItem('modeLog') || '{}');
  let streak = 0;
  let date = new Date();

  while (true) {
    const dateStr = date.toISOString().split('T')[0];
    if (data[dateStr]) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  document.getElementById('streak').innerHTML = `🔥 ${streak} day streak`;
  document.getElementById('historyStreak').innerHTML = `🔥 ${streak} day streak`;
}

// History section
function updateHistory() {
  const container = document.getElementById('modeHistory');
  container.innerHTML = '';
  const data = JSON.parse(localStorage.getItem('modeLog') || '{}');
  const sortedDates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(date => {
    const modeKey = data[date];
    const div = document.createElement('div');
    div.textContent = `${date}: ${modes[modeKey].name}`;
    div.style.color = modes[modeKey].color;
    container.appendChild(div);
  });
}

// Compass clicks
document.getElementById("compass").addEventListener("click", function (e) {
  const id = e.target.id;
  if (modes[id]) selectMode(id);
});

// Mode button clicks
document.querySelectorAll('.mode-button').forEach(btn => {
  btn.addEventListener('click', () => {
    selectMode(btn.dataset.mode);
  });
});

// Quick wins
const quickWinList = document.getElementById('quickWinList');
["Take 3 deep breaths", "Stretch for 1 minute", "Drink a full glass of water"].forEach(win => {
  const li = document.createElement('li');
  li.innerHTML = `<strong>${win}</strong><br><textarea placeholder="What did you do?"></textarea>`;
  quickWinList.appendChild(li);
});