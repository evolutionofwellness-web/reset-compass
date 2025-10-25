document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const historyList = document.getElementById("historyList");
  const streakCount = document.getElementById("streakCount");

  const MODES = {
    growing: [
      "Do a challenging workout",
      "Apply to a new opportunity",
      "Pitch your idea to someone"
    ],
    grounded: [
      "Clean your space",
      "Prioritize your top 3 tasks",
      "Finish something you’ve been putting off"
    ],
    drifting: [
      "Take a walk",
      "Do 5 minutes of deep breathing",
      "Write freely for 10 minutes"
    ],
    surviving: [
      "Drink water",
      "Lie down with no screens for 10 minutes",
      "Text someone you trust"
    ]
  };

  function navigate(id) {
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  function showMode(mode) {
    navigate("modeSection");
    document.getElementById("modeTitle").innerText = mode.charAt(0).toUpperCase() + mode.slice(1);
    const container = document.getElementById("activitiesContainer");
    container.innerHTML = "";
    MODES[mode].forEach(activity => {
      const div = document.createElement("div");
      div.className = "activity";
      div.innerHTML = `
        <strong>${activity}</strong>
        <textarea placeholder="What did you do?" onchange="logActivity('${mode}', this.value)"></textarea>
      `;
      container.appendChild(div);
    });
  }

  function logActivity(type, text) {
    if (!text.trim()) return;
    const item = document.createElement("li");
    const now = new Date().toLocaleString();
    item.textContent = `[${now}] (${type}) ${text}`;
    historyList.appendChild(item);

    const today = new Date().toDateString();
    if (localStorage.getItem("lastLoggedDate") !== today) {
      localStorage.setItem("lastLoggedDate", today);
      let streak = parseInt(localStorage.getItem("streak") || "0") + 1;
      localStorage.setItem("streak", streak);
      updateStreak();
    }
  }

  function updateStreak() {
    const count = localStorage.getItem("streak") || "0";
    streakCount.textContent = `🔥 ${count}-day streak`;
  }

  updateStreak();
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
  }, 1500);

  window.navigate = navigate;
  window.showMode = showMode;
  window.logActivity = logActivity;
});