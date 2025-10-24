document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcome = document.getElementById("welcomePopup");
  const startBtn = document.getElementById("startButton");

  setTimeout(() => {
    splash.style.display = "none";
    if (!localStorage.getItem("visited")) {
      welcome.style.display = "flex";
    }
  }, 2000);

  startBtn.onclick = () => {
    welcome.style.display = "none";
    localStorage.setItem("visited", "true");
  };

  document.querySelectorAll("#compass path").forEach(path => {
    path.addEventListener("click", () => {
      const mode = path.dataset.mode;
      logMode(mode);
    });
  });

  window.selectMode = (mode) => {
    logMode(mode);
  };

  window.showSection = (id) => {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };

  function logMode(mode) {
    const date = new Date().toLocaleDateString();
    const history = JSON.parse(localStorage.getItem("modeHistory") || "[]");
    history.push({ date, mode });
    localStorage.setItem("modeHistory", JSON.stringify(history));
    updateStreak(history);
    alert(`Logged: ${mode}`);
  }

  function updateStreak(history) {
    const days = [...new Set(history.map(e => e.date))];
    const streak = days.length;
    document.getElementById("streakDisplay").textContent = `🔥 ${streak} day streak`;
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("modeHistory") || "[]");
    const container = document.getElementById("modeHistory");
    container.innerHTML = "";
    history.reverse().forEach(entry => {
      const div = document.createElement("div");
      div.textContent = `${entry.date}: ${entry.mode}`;
      container.appendChild(div);
    });
    updateStreak(history);
  }

  loadHistory();
});