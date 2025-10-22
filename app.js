document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded");

  const splash = document.getElementById("splashScreen");
  const welcome = document.getElementById("welcomePopup");
  const startBtn = document.getElementById("startButton");
  const streakEl = document.getElementById("streakCount");
  const breakdownList = document.getElementById("modeBreakdownList");
  const modeHistory = document.getElementById("mode-history");
  const app = document.getElementById("app");
  const sections = document.querySelectorAll(".section");

  const activitySets = {
    growing: ["Plan your next step", "Revisit goals", "Reflect on progress"],
    drifting: ["Take 5 deep breaths", "Pause distractions", "1-minute body check-in"],
    surviving: ["Drink water", "Stretch 1 min", "Put phone down 5 mins"],
    grounded: ["Mindful walk", "Gratitude list", "Deep breathing"]
  };

  function hideAllSections() {
    sections.forEach(sec => sec.style.display = "none");
  }

  function navigateTo(sectionId) {
    console.log(`🔁 Navigating to: ${sectionId}`);
    hideAllSections();
    const target = document.getElementById(`${sectionId}Section`);
    if (target) target.style.display = "block";
  }

  function selectMode(mode) {
    console.log(`🎯 Mode selected: ${mode}`);
    localStorage.setItem("lastMode", mode);
    saveModeToHistory(mode);
    showModeView(mode);
  }

  function showModeView(mode) {
    const titleMap = {
      growing: "🚀 Growing",
      drifting: "🧭 Drifting",
      surviving: "🩺 Surviving",
      grounded: "🌿 Grounded"
    };

    const activityList = document.getElementById("activityList");
    document.getElementById("modeTitle").textContent = titleMap[mode];
    activityList.innerHTML = "";

    activitySets[mode].forEach(activity => {
      const container = document.createElement("div");
      const p = document.createElement("p");
      p.textContent = activity;

      const textarea = document.createElement("textarea");
      textarea.placeholder = "Add notes or reflections";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save note + Completed";
      saveBtn.className = "save-btn";
      saveBtn.onclick = () => {
        saveNote(mode, activity, textarea.value);
        textarea.value = "";
      };

      const completeBtn = document.createElement("button");
      completeBtn.textContent = "Completed";
      completeBtn.className = "complete-btn";
      completeBtn.onclick = () => {
        saveNote(mode, activity, "");
      };

      container.appendChild(p);
      container.appendChild(textarea);
      container.appendChild(saveBtn);
      container.appendChild(completeBtn);
      activityList.appendChild(container);
    });

    navigateTo("mode");
  }

  function saveNote(mode, activity, note) {
    const log = {
      mode,
      activity,
      note,
      timestamp: new Date().toISOString()
    };
    const existing = JSON.parse(localStorage.getItem("activityLog") || "[]");
    existing.unshift(log);
    localStorage.setItem("activityLog", JSON.stringify(existing));
    updateHistory();
    alert("Activity logged!");
  }

  function saveModeToHistory(mode) {
    const today = new Date().toISOString().split("T")[0];
    const modeLog = JSON.parse(localStorage.getItem("modeLog") || "[]");

    const alreadyLogged = modeLog.find(entry => entry.date === today);
    if (!alreadyLogged) {
      modeLog.push({ date: today, mode });
      localStorage.setItem("modeLog", JSON.stringify(modeLog));
    }
  }

  function updateHistory() {
    const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
    const modeLog = JSON.parse(localStorage.getItem("modeLog") || "[]");
    const modeCounts = {};
    let streak = 0;

    const days = modeLog.map(entry => entry.date).sort((a, b) => new Date(b) - new Date(a));
    let currentDate = new Date().toISOString().split("T")[0];

    for (let date of days) {
      if (date === currentDate) {
        streak++;
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        currentDate = prev.toISOString().split("T")[0];
      } else {
        break;
      }
    }

    streakEl.textContent = streak;
    breakdownList.innerHTML = "";
    modeLog.forEach(entry => {
      modeCounts[entry.mode] = (modeCounts[entry.mode] || 0) + 1;
    });
    Object.entries(modeCounts).forEach(([mode, count]) => {
      const li = document.createElement("li");
      li.textContent = `${mode}: ${count}`;
      breakdownList.appendChild(li);
    });

    modeHistory.innerHTML = "";
    log.forEach(entry => {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${entry.mode}</strong>: ${entry.activity}<br/><em>${entry.note || ''}</em><br/><small>${new Date(entry.timestamp).toLocaleString()}</small><hr/>`;
      modeHistory.appendChild(div);
    });
  }

  function showApp() {
    splash.style.display = "none";
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      console.log("👋 First-time visitor — showing welcome popup");
      welcome.style.display = "block";
    } else {
      console.log("🏠 Returning visitor — going to home");
      navigateTo("home");
    }
  }

  setTimeout(() => {
    console.log("⏱️ Splash delay complete");
    showApp();
  }, 1400);

  startBtn.addEventListener("click", () => {
    console.log("👉 Start clicked");
    localStorage.setItem("hasVisited", "true");
    welcome.style.display = "none";
    navigateTo("home");
  });

  console.log("📈 Loading history");
  updateHistory();
});
