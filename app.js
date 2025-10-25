document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
  }, 2000);

  updateStreak();
  navigateTo('home');
});

function navigateTo(sectionId) {
  document.querySelectorAll("main > section").forEach(s => s.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");
}

function openMode(mode) {
  const container = document.getElementById('modeView');
  container.innerHTML = `<h2>${capitalize(mode)} Mode</h2>` + getModeActivities(mode);
  navigateTo('modeView');
}

function getModeActivities(mode) {
  const activities = {
    growing: ["Do something that scares you", "Make bold progress on a long-term goal", "Reach out for feedback or growth"],
    grounded: ["Tidy up your space", "Plan your next 3 tasks", "Take a mindful break"],
    drifting: ["Go for a walk", "Stretch or move lightly", "Do a brain-dump to clear your mind"],
    surviving: ["Drink a glass of water", "Cancel one nonessential task", "Do a 2-minute reset: breathe + pause"]
  };

  return activities[mode].map(act =>
    `<div class="activity"><p>${act}</p>
    <textarea placeholder="Write what you did..." onchange="logActivity('${mode}', this.value)"></textarea></div>`
  ).join("");
}

function logActivity(mode, text) {
  if (!text.trim()) return;
  const history = JSON.parse(localStorage.getItem("activityHistory") || "[]");
  const date = new Date().toISOString().split("T")[0];
  history.push({ date, mode, text });
  localStorage.setItem("activityHistory", JSON.stringify(history));

  // streak logic
  const lastLogged = localStorage.getItem("lastLoggedDate");
  if (lastLogged !== date) {
    let streak = parseInt(localStorage.getItem("streak") || "0");
    streak += 1;
    localStorage.setItem("streak", streak.toString());
    localStorage.setItem("lastLoggedDate", date);
    updateStreak();
  }
}

function updateStreak() {
  const streak = localStorage.getItem("streak") || "0";
  document.getElementById("streakDisplay").innerText = `🔥 ${streak}-day streak`;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}