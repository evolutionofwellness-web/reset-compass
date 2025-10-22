// app.js?v=5

document.addEventListener("DOMContentLoaded", () => {
  // Splash Screen Logic
  const splash = document.getElementById("splashScreen");
  setTimeout(() => {
    splash.style.display = "none";
    checkFirstVisit();
  }, 1500);

  // Welcome popup only once
  function checkFirstVisit() {
    const hasVisited = localStorage.getItem("visited");
    if (!hasVisited) {
      document.getElementById("welcomePopup").style.display = "block";
      localStorage.setItem("visited", "true");
    }
  }

  // Start button to enter app
  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("welcomePopup").style.display = "none";
  });

  // Navigation function
  window.navigateTo = (section) => {
    document.querySelectorAll(".section").forEach((sec) => {
      sec.style.display = "none";
    });
    document.getElementById(`${section}Section`).style.display = "block";
  };

  // Select mode (wedge or button)
  window.selectMode = (mode) => {
    currentMode = mode;
    updateModeTitle(mode);
    renderActivities(mode);
    navigateTo("mode");
    logModeSelection(mode);
    updateStats();
  };

  // Update header title for each mode
  function updateModeTitle(mode) {
    const titles = {
      growing: "🚀 Growing Mode Activities",
      drifting: "🧭 Drifting Mode Activities",
      surviving: "🩺 Surviving Mode Activities",
      grounded: "🌿 Grounded Mode Activities"
    };
    document.getElementById("modeTitle").textContent = titles[mode] || "Mode Activities";
  }

  // Render activity list for each mode
  function renderActivities(mode) {
    const activityList = document.getElementById("activityList");
    activityList.innerHTML = "";

    const activities = {
      growing: ["Learn something new", "Take bold action", "Write down a goal"],
      drifting: ["Declutter something", "Write your thoughts", "Go for a casual walk"],
      surviving: ["Take a breath", "Drink water", "Ask for help"],
      grounded: ["Stretch", "Eat slowly", "Check in with someone"]
    };

    activities[mode].forEach((activity) => {
      const container = document.createElement("div");
      const label = document.createElement("p");
      label.textContent = `• ${activity}`;
      const textarea = document.createElement("textarea");
      textarea.placeholder = "Add notes or reflections (optional)";
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save Note + Completed";
      const completeBtn = document.createElement("button");
      completeBtn.textContent = "Completed";

      // Save button logic
      saveBtn.addEventListener("click", () => {
        saveLog(mode, activity, textarea.value.trim());
        textarea.value = "";
      });

      // Just complete
      completeBtn.addEventListener("click", () => {
        saveLog(mode, activity, "");
      });

      container.appendChild(label);
      container.appendChild(textarea);
      container.appendChild(saveBtn);
      container.appendChild(completeBtn);
      container.style.marginBottom = "16px";

      activityList.appendChild(container);
    });

    // Add return button styling
    const backBtn = document.querySelector("#modeSection button");
    backBtn.textContent = "← Return to Compass";
    backBtn.style.marginTop = "20px";
    backBtn.style.padding = "10px 20px";
    backBtn.style.borderRadius = "8px";
    backBtn.style.backgroundColor = "#0B3D2E";
    backBtn.style.color = "#fff";
    backBtn.style.border = "none";
    backBtn.style.fontWeight = "bold";
    backBtn.style.cursor = "pointer";
  }

  // Save mode activity log
  function saveLog(mode, activity, note) {
    const logs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
    logs.push({ mode, activity, note, timestamp: new Date().toISOString() });
    localStorage.setItem("activityLogs", JSON.stringify(logs));
    updateStats();
  }

  // Show streak and mode breakdown
  function updateStats() {
    const logs = JSON.parse(localStorage.getItem("activityLogs") || "[]");
    const today = new Date().toISOString().split("T")[0];
    const uniqueDays = new Set(logs.map(log => log.timestamp.split("T")[0]));
    document.getElementById("streakCount").textContent = uniqueDays.size;

    const modeCounts = { growing: 0, drifting: 0, surviving: 0, grounded: 0 };
    logs.forEach(log => modeCounts[log.mode]++);
    const breakdownList = document.getElementById("modeBreakdownList");
    breakdownList.innerHTML = "";
    Object.entries(modeCounts).forEach(([mode, count]) => {
      const li = document.createElement("li");
      li.textContent = `${capitalize(mode)}: ${count}`;
      breakdownList.appendChild(li);
    });

    const historyList = document.getElementById("mode-history");
    historyList.innerHTML = "";
    logs.slice().reverse().forEach(log => {
      const entry = document.createElement("div");
      entry.innerHTML = `<p><strong>${capitalize(log.mode)}</strong> – ${log.activity} <br/><small>${new Date(log.timestamp).toLocaleString()}</small>${log.note ? `<br/><em>Note: ${log.note}</em>` : ""}</p>`;
      entry.style.borderBottom = "1px solid #ddd";
      entry.style.padding = "8px 0";
      historyList.appendChild(entry);
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
