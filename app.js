document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splash-screen").style.display = "none";
  }, 1500);

  document.querySelectorAll("#compass path").forEach(path => {
    path.addEventListener("click", e => {
      const mode = e.target.getAttribute("data-mode");
      if (mode) {
        goToMode(mode);
      }
    });
  });

  updateStreak();
});

const activities = {
  growing: ["Write a goal", "Tackle a challenge", "Start a new project"],
  grounded: ["Declutter a space", "Complete a task", "Plan your day"],
  drifting: ["Go for a walk", "Journal your thoughts", "Listen to calming music"],
  surviving: ["Drink water", "Breathe deeply", "Rest for 5 minutes"]
};

function goToMode(mode) {
  const container = document.getElementById("content");
  container.innerHTML = `<h2>${capitalize(mode)}</h2>` + activities[mode].map(activity =>
    `<div><label>${activity}</label><input type="text"><button onclick="logActivity('${mode}', '${activity}')">Log</button></div>`
  ).join("") + `<br><a href="#" onclick="navigateHome()">← Back</a>`;
}

function logActivity(mode, activity) {
  const date = new Date().toLocaleDateString();
  let history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  history.push({ date, mode, activity });
  localStorage.setItem("resetHistory", JSON.stringify(history));

  const lastLogged = localStorage.getItem("lastLogged");
  if (lastLogged !== date) {
    let streak = parseInt(localStorage.getItem("streak") || "0");
    localStorage.setItem("streak", streak + 1);
    localStorage.setItem("lastLogged", date);
    updateStreak();
  }
}

function updateStreak() {
  document.getElementById("streak-count").textContent = localStorage.getItem("streak") || "0";
}

function navigateHome() {
  location.reload();
}

function navigateQuickWins() {
  const container = document.getElementById("content");
  container.innerHTML = "<h2>Quick Wins</h2>" + ["Drink water", "Stand up and stretch", "Take 3 deep breaths"].map(qw =>
    `<div><label>${qw}</label><input type="text"><button onclick="logActivity('quick', '${qw}')">Log</button></div>`
  ).join("") + `<br><a href="#" onclick="navigateHome()">← Back</a>`;
}

function navigateHistory() {
  const container = document.getElementById("content");
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  container.innerHTML = "<h2>History</h2>" + (history.length ? history.map(entry =>
    `<p><strong>${entry.date}</strong>: ${entry.mode} — ${entry.activity}</p>`
  ).join("") : "<p>No history yet.</p>") + `<br><a href="#" onclick="navigateHome()">← Back</a>`;
}

function navigateAbout() {
  const container = document.getElementById("content");
  container.innerHTML = `
    <h2>About</h2>
    <p>The Reset Compass was created by Marcus Clark to help you align your energy and actions with your current state. It’s a tool for navigating burnout, overwhelm, and progress—one small step at a time.</p>
    <p>Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p>
    <br><a href="#" onclick="navigateHome()">← Back</a>`;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}