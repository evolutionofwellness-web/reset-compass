document.addEventListener("DOMContentLoaded", function () {
  const modeColors = {
    growing: "#4285F4",   // Blue
    grounded: "#34A853",  // Green
    drifting: "#FBBC05",  // Yellow
    surviving: "#EA4335"  // Red
  };

  const modeIcons = {
    growing: "🛫",
    grounded: "🌿",
    drifting: "🧭",
    surviving: "🩺"
  };

  const modeLabels = {
    growing: "Growing",
    grounded: "Grounded",
    drifting: "Drifting",
    surviving: "Surviving"
  };

  const compassOrder = ["growing", "grounded", "drifting", "surviving"];

  function renderCompass() {
    const compass = document.getElementById("compass");
    compass.innerHTML = "";

    compassOrder.forEach((mode, index) => {
      const wedge = document.createElement("div");
      wedge.className = "wedge";
      wedge.style.backgroundColor = modeColors[mode];
      wedge.style.transform = `rotate(${index * 90}deg) translate(0, -50%) rotate(-${index * 90}deg)`;
      wedge.dataset.mode = mode;
      wedge.innerHTML = `<span>${modeLabels[mode]}</span>`;
      wedge.addEventListener("click", () => selectMode(mode));
      compass.appendChild(wedge);
    });
  }

  function renderButtons() {
    const container = document.getElementById("modeButtons");
    container.innerHTML = "";

    compassOrder.forEach((mode) => {
      const button = document.createElement("button");
      button.className = "mode-button";
      button.style.backgroundColor = modeColors[mode];
      button.innerHTML = `<span class="mode-icon">${modeIcons[mode]}</span>${modeLabels[mode]}`;
      button.addEventListener("click", () => selectMode(mode));
      container.appendChild(button);
    });
  }

  function selectMode(mode) {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("modeHistory") || "{}");
    history[today] = mode;
    localStorage.setItem("modeHistory", JSON.stringify(history));
    renderStreak();
  }

  function renderStreak() {
    const history = JSON.parse(localStorage.getItem("modeHistory") || "{}");
    const today = new Date();
    let streak = 0;

    for (let i = 0; ; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split("T")[0];
      if (history[key]) {
        streak++;
      } else {
        break;
      }
    }

    document.getElementById("streakCount").innerHTML = `🔥 Current Streak: ${streak} day${streak !== 1 ? "s" : ""}`;
  }

  renderCompass();
  renderButtons();
  renderStreak();
});
