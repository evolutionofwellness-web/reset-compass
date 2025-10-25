document.addEventListener("DOMContentLoaded", () => {
  // Splash screen
  setTimeout(() => {
    document.getElementById("splash-screen").style.display = "none";
    document.getElementById("appContent").classList.remove("hidden");
    if (!localStorage.getItem("welcomeShown")) {
      document.getElementById("welcomeModal").style.display = "flex";
    }
  }, 1500);

  loadStreak();
  renderHistory();
});

function closeWelcome() {
  localStorage.setItem("welcomeShown", "true");
  document.getElementById("welcomeModal").style.display = "none";
}

function navigateTo(section) {
  document.querySelectorAll("main, section").forEach(s => s.classList.add("hidden"));
  document.getElementById(section + "Section").classList.remove("hidden");
}

function goToMode(mode) {
  const activities = {
    surviving: ["Drink a glass of water", "Eat something with protein", "Sit or lie down for 5 minutes"],
    drifting: ["Make a to-do list", "Write one goal for today", "Take a 10-minute walk"],
    grounded: ["Stretch your body", "Listen to music", "Text someone you care about"],
    growing: ["Plan one growth activity", "Read one page of a book", "Do one thing you’ve been avoiding"]
  };

  const titles = {
    surviving: "🩺 Surviving",
    drifting: "🧭 Drifting",
    grounded: "🌿 Grounded",
    growing: "🚀 Growing"
  };

  document.getElementById("modeTitle").textContent = titles[mode];
  const list = document.getElementById("activityList");
  list.innerHTML = "";

  activities[mode].forEach(act => {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = act;
    input.onblur = () => logAction(mode, act);
    list.appendChild(input);
  });

  navigateTo("mode");
}

function logAction(mode, activity) {
  const today = new Date().toISOString().split("T")[0];
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  if (!localStorage.getItem("lastStreakDate") || localStorage.getItem("lastStreakDate") !== today) {
    let streak = parseInt(localStorage.getItem("streak") || "0");
    streak++;
    localStorage.setItem("streak", streak);
    localStorage.setItem("lastStreakDate", today);
  }

  history.push({ date: today, mode, activity });
  localStorage.setItem("history", JSON.stringify(history));
  loadStreak();
  renderHistory();
}

function loadStreak() {
  const streak = localStorage.getItem("streak") || 0;
  document.getElementById("streak").textContent = `🔥 ${streak}-day streak`;
}

function renderHistory() {
  const log = JSON.parse(localStorage.getItem("history") || "[]");
  const list = document.getElementById("historyLog");
  list.innerHTML = "";

  log.slice().reverse().forEach(entry => {
    const item = document.createElement("li");
    item.textContent = `${entry.date}: [${entry.mode}] ${entry.activity}`;
    list.appendChild(item);
  });
}