// Splash screen and welcome popup logic
document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const startBtn = document.getElementById("startButton");

  setTimeout(() => {
    splash.style.display = "none";

    const seenWelcome = localStorage.getItem("seenWelcome");
    if (!seenWelcome) {
      welcomeModal.classList.remove("hidden");
    }
  }, 1300);

  startBtn.addEventListener("click", () => {
    welcomeModal.classList.add("hidden");
    localStorage.setItem("seenWelcome", "true");
  });
});

// Mode descriptions
const modeDescriptions = {
  growing: "You're energized and thriving. Lean in and grow further.",
  drifting: "You’re coasting without direction. Time to recenter.",
  surviving: "You’re in stress mode. Support your health first.",
  grounded: "You’re stable. Let’s stay steady and connected."
};

// Click handlers for modes
function selectMode(mode) {
  const now = new Date();
  const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
  log.push({ mode, timestamp: now.toISOString(), note: "" });
  localStorage.setItem("activityLog", JSON.stringify(log));
  updateStreak();
  showModeDetails(mode);
}

function showModeDetails(mode) {
  const title = mode.charAt(0).toUpperCase() + mode.slice(1);
  document.getElementById("modeSection").classList.remove("hidden");
  document.getElementById("homeSection").classList.add("hidden");
  document.getElementById("modeTitle").innerText = title;
  document.getElementById("modeDescription").innerText = modeDescriptions[mode] || "";

  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  for (let i = 1; i <= 3; i++) {
    const textarea = document.createElement("textarea");
    textarea.placeholder = `Activity ${i}...`;

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save Activity";
    saveBtn.onclick = () => {
      const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
      log[log.length - 1].note = textarea.value;
      localStorage.setItem("activityLog", JSON.stringify(log));
      alert("Activity saved.");
    };

    activityList.appendChild(textarea);
    activityList.appendChild(saveBtn);
  }
}

// Streak logic
function updateStreak() {
  const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
  const dates = [...new Set(log.map(entry => entry.timestamp.slice(0, 10)))];

  let streak = 0;
  let today = new Date();
  while (dates.includes(today.toISOString().slice(0, 10))) {
    streak++;
    today.setDate(today.getDate() - 1);
  }

  document.getElementById("streakDisplay").innerHTML = `🔥 ${streak}`;
}

// Render history
function showHistory() {
  const log = JSON.parse(localStorage.getItem("activityLog") || "[]").reverse();
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  if (log.length === 0) {
    list.innerHTML = "<li>No activity yet.</li>";
    return;
  }

  log.forEach(entry => {
    const li = document.createElement("li");
    const date = new Date(entry.timestamp);
    li.innerText = `${date.toLocaleDateString()} - ${entry.mode.toUpperCase()} - ${entry.note || "No notes"}`;
    list.appendChild(li);
  });
}

// Nav routing
function navigateTo(section) {
  const allSections = ["homeSection", "modeSection", "quickwinsSection", "historySection", "aboutSection"];
  allSections.forEach(id => document.getElementById(id).classList.add("hidden"));

  switch (section) {
    case "home":
      document.getElementById("homeSection").classList.remove("hidden");
      break;
    case "quickwins":
      document.getElementById("quickwinsSection").classList.remove("hidden");
      break;
    case "history":
      document.getElementById("historySection").classList.remove("hidden");
      showHistory();
      updateStreak();
      break;
    case "about":
      document.getElementById("aboutSection").classList.remove("hidden");
      break;
  }
}
