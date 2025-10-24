document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomePopup = document.getElementById("welcomePopup");
  const startBtn = document.getElementById("startBtn");

  setTimeout(() => {
    splash.style.display = "none";
    if (!localStorage.getItem("welcomeSeen")) {
      welcomePopup.style.display = "flex";
    }
  }, 1500);

  startBtn.onclick = () => {
    welcomePopup.style.display = "none";
    localStorage.setItem("welcomeSeen", "true");
  };

  showSection("home");
  updateStreak();
  loadQuickWins();
  loadHistory();
});

function showSection(id) {
  document.querySelectorAll(".app-section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function selectMode(mode) {
  const date = new Date().toISOString().split('T')[0];
  let history = JSON.parse(localStorage.getItem("history") || "{}");
  history[date] = mode;
  localStorage.setItem("history", JSON.stringify(history));
  updateStreak();
  loadHistory();
  alert(`Mode for today set as: ${mode}`);
}

function updateStreak() {
  const history = JSON.parse(localStorage.getItem("history") || "{}");
  let streak = 0;
  let today = new Date();
  while (true) {
    const dateStr = today.toISOString().split('T')[0];
    if (history[dateStr]) {
      streak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }
  document.getElementById("streakDisplay").textContent = `🔥 ${streak}-day streak`;
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "{}");
  const list = Object.entries(history).sort((a,b)=>b[0].localeCompare(a[0]));
  const container = document.getElementById("historyList");
  container.innerHTML = list.length
    ? `<ul>${list.map(([date, mode]) => `<li>${date}: ${mode}</li>`).join('')}</ul>`
    : `<p>No history yet.</p>`;
}

function loadQuickWins() {
  const wins = [
    "Drink a glass of water",
    "Take 3 deep breaths",
    "Stretch for 2 minutes",
    "Step outside",
    "Write down 1 thing you did well today"
  ];
  const ul = document.getElementById("quickWinList");
  wins.forEach(win => {
    const li = document.createElement("li");
    li.textContent = win;
    ul.appendChild(li);
  });
}