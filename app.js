console.log("✅ JavaScript loaded");

document.addEventListener("DOMContentLoaded", () => {
  const wedges = document.querySelectorAll("path");
  wedges.forEach(wedge => {
    wedge.addEventListener("click", () => {
      alert(`You clicked: ${wedge.dataset.mode}`);
    });
  });

  const buttons = document.querySelectorAll(".mode-button");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      alert(`You clicked: ${button.dataset.mode}`);
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const splash = document.getElementById("splash-screen");
  setTimeout(() => {
    splash.style.display = "none";
    container.style.display = "block";
  }, 2500);

  updateStreak();
  renderHistory();
});

function selectMode(mode) {
  const titles = {
    growing: "Growing",
    grounded: "Grounded",
    drifting: "Drifting",
    surviving: "Surviving"
  };
  const activities = {
    growing: ["Write a goal", "Tackle a challenge", "Start a new project"],
    grounded: ["Organize your space", "Do deep breathing", "Plan your day"],
    drifting: ["Take a walk", "Journal for 5 minutes", "Drink water"],
    surviving: ["Stretch", "Take a break", "Do nothing for 5 minutes"]
  };

  document.getElementById("home").style.display = "none";
  const view = document.getElementById("mode-view");
  view.style.display = "block";
  document.getElementById("mode-title").textContent = titles[mode];

  const actList = document.getElementById("activities");
  actList.innerHTML = "";
  activities[mode].forEach(text => {
    const div = document.createElement("div");
    div.className = "activity-box";
    div.innerHTML = `<p>${text}</p><textarea></textarea><button onclick="logActivity('${text}')">Log</button>`;
    actList.appendChild(div);
  });
}

function showHome() {
  hideAll();
  document.getElementById("home").style.display = "block";
}

function showQuickWins() {
  hideAll();
  document.getElementById("quickwins").style.display = "block";
  document.getElementById("quickwins-list").innerHTML = `
    <p>Drink water</p>
    <p>Do 5 squats</p>
    <p>Take 3 deep breaths</p>
  `;
}

function showHistory() {
  hideAll();
  document.getElementById("history").style.display = "block";
  renderHistory();
}

function showAbout() {
  hideAll();
  document.getElementById("about").style.display = "block";
}

function goBack() {
  hideAll();
  document.getElementById("home").style.display = "block";
}

function hideAll() {
  document.querySelectorAll("#home, #mode-view, #quickwins, #history, #about").forEach(el => el.style.display = "none");
}

function logActivity(activity) {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  const today = new Date().toISOString().slice(0, 10);
  logs.push({ date: today, activity });
  localStorage.setItem("logs", JSON.stringify(logs));
  localStorage.setItem("lastLogged", today);
  updateStreak();
  alert("Activity logged!");
}

function updateStreak() {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  const today = new Date().toISOString().slice(0, 10);
  const days = [...new Set(logs.map(log => log.date))];
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[days.length - 1 - i] === getPastDate(i)) {
      streak++;
    } else break;
  }
  document.getElementById("streak-count").textContent = streak;
}

function renderHistory() {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  const container = document.getElementById("history-log");
  container.innerHTML = "";
  logs.slice(-20).reverse().forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `${entry.date}: ${entry.activity}`;
    container.appendChild(div);
  });
}

function getPastDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}