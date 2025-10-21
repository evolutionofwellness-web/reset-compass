const activities = {
  growing: ["Plan your week", "Tackle a new habit", "Move your body with purpose"],
  drifting: ["Declutter your space", "Go for a walk", "Reflect on recent patterns"],
  grounded: ["Prepare a nourishing meal", "Stretch or breathe", "Do something creative"],
  surviving: ["Drink water", "Lay down for 5 minutes", "Write one sentence to yourself"]
};

function navigateTo(view) {
  document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
  document.getElementById(view + 'View').style.display = 'block';
}

function selectMode(mode) {
  navigateTo('mode');
  const container = document.getElementById('modeView');
  container.innerHTML = `<h2>${capitalize(mode)} Mode</h2><ul id="activityList"></ul>`;

  activities[mode].forEach((activity, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <p>${activity}</p>
      <textarea placeholder="What did you do?"></textarea>
      <input type="button" value="Save" onclick="saveActivity('${mode}', ${i}, this)">
    `;
    container.querySelector("#activityList").appendChild(li);
  });
}

function saveActivity(mode, index, btn) {
  const textarea = btn.previousElementSibling;
  const value = textarea.value.trim();
  if (value) {
    const entry = { date: new Date().toLocaleDateString(), mode, activity: activities[mode][index], note: value };
    const logs = JSON.parse(localStorage.getItem("resetHistory") || "[]");
    logs.push(entry);
    localStorage.setItem("resetHistory", JSON.stringify(logs));
    updateStreak();
    textarea.disabled = true;
    btn.disabled = true;
    btn.value = "Saved";
  }
}

function updateStreak() {
  const logs = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  const dates = [...new Set(logs.map(log => log.date))];
  const today = new Date().toLocaleDateString();
  let streak = dates.includes(today) ? 1 : 0;
  for (let i = 1; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (dates.includes(d.toLocaleDateString())) streak++;
    else break;
  }
  document.querySelector(".streak").textContent = `🔥 ${streak}-day streak`;
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const logs = JSON.parse(localStorage.getItem("resetHistory") || "[]").reverse();
  list.innerHTML = logs.map(log =>
    `<li><strong>${log.date}</strong> — [${log.mode}] ${log.activity}<br>${log.note}</li>`
  ).join("");
}

document.getElementById("startButton").onclick = () => {
  document.getElementById("welcomePopup").style.display = "none";
  document.getElementById("app").style.display = "block";
};

window.onload = () => {
  if (!localStorage.getItem("visited")) {
    document.getElementById("splashScreen").style.display = "block";
    setTimeout(() => {
      document.getElementById("splashScreen").style.display = "none";
      document.getElementById("welcomePopup").style.display = "block";
      localStorage.setItem("visited", "true");
    }, 1500);
  } else {
    document.getElementById("splashScreen").style.display = "none";
    document.getElementById("app").style.display = "block";
  }
  updateStreak();
  renderHistory();
};

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}