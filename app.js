document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const modal = document.getElementById("welcomeModal");
  const app = document.getElementById("appWrapper");
  const startBtn = document.getElementById("startApp");

  const hasSeen = localStorage.getItem("seenWelcome");

  if (!hasSeen) {
    setTimeout(() => {
      splash.style.display = "none";
      modal.classList.remove("hidden");
    }, 1500);
  } else {
    splash.style.display = "none";
    modal.classList.add("hidden");
    app.classList.remove("hidden");
    updateStreak();
  }

  startBtn.addEventListener("click", () => {
    localStorage.setItem("seenWelcome", "true");
    modal.classList.add("hidden");
    app.classList.remove("hidden");
    updateStreak();
  });

  window.navigate = (target) => {
    document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(target).classList.remove("hidden");
    updateStreak();
    renderHistory();
  };

  function updateStreak() {
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const dates = Object.keys(history).sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (let date of dates) {
      const dateStr = currentDate.toISOString().split("T")[0];
      if (date === dateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    const streakDisplay = document.getElementById("streakDisplay");
    if (streakDisplay) {
      streakDisplay.innerHTML = `🔥 ${streak}-day streak`;
    }
  }

  function logActivity(mode, value) {
    if (!value) return;
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    if (!history[today]) history[today] = {};
    if (!history[today][mode]) history[today][mode] = [];
    if (!history[today][mode].includes(value)) {
      history[today][mode].push(value);
      localStorage.setItem("history", JSON.stringify(history));
    }
    updateStreak();
  }

  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const mode = textarea.dataset.mode;
      const value = textarea.value.trim();
      logActivity(mode, value);
    });
  });

  const compass = document.getElementById("compass");
  if (compass) {
    compass.querySelectorAll("path").forEach(path => {
      path.addEventListener("click", () => {
        const mode = path.getAttribute("data-mode");
        if (mode) navigate(mode + "View");
      });
    });
  }

  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      if (mode) navigate(mode + "View");
    });
  });

  function renderHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;
    historyList.innerHTML = "";

    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const sortedDates = Object.keys(history).sort().reverse();

    sortedDates.forEach(date => {
      const entry = history[date];
      const listItem = document.createElement("li");
      let html = `<strong>${date}</strong><br/>`;

      Object.keys(entry).forEach(mode => {
        html += `<em>${mode}:</em><ul>`;
        entry[mode].forEach(item => {
          html += `<li>${item}</li>`;
        });
        html += `</ul>`;
      });

      listItem.innerHTML = html;
      historyList.appendChild(listItem);
    });
  }

  renderHistory();
});